import React, { useState } from 'react'
import { useLanguage } from '../../../context/LanguageContext'

const CustomDeclarationTable = ({
  selectedProducts,
  setSelectedProducts,
  availableProducts,
  formLoading,
  nextItemId,
  calculateTotalWeight,
  calculateSummary,
  poNumber,
  setPONumber,
  declarationDate,
  setDeclarationDate
}) => {
  const { t } = useLanguage()
  
  // Manual add 状态管理
  const [showManualAdd, setShowManualAdd] = useState(false)
  const [manualProduct, setManualProduct] = useState({
    product_id: '',
    customer_code: '',
    product_name: '',
    packing_size: '',
    batch_number: '',
    quantity: '',
    uom: ''
  })

  // 手动添加产品
  const addManualProduct = () => {
    if (!manualProduct.product_id.trim() || !manualProduct.product_name.trim()) {
      alert('Please enter Product Code and Product Name')
      return
    }

    const uomValue = parseFloat(manualProduct.uom) || 0
    const totalWeight = calculateTotalWeight(manualProduct.quantity, uomValue)

    const newProduct = {
      uniqueId: nextItemId.current++,
      sn: selectedProducts.length + 1,
      product_id: manualProduct.product_id.trim(),
      customer_code: manualProduct.customer_code.trim(),
      product_name: manualProduct.product_name.trim(),
      packing_size: manualProduct.packing_size.trim() || '-',
      batch_number: manualProduct.batch_number.trim(),
      quantity: manualProduct.quantity,
      uom: uomValue,
      total_weight: totalWeight,
      isManual: true
    }

    setSelectedProducts(prev => [...prev, newProduct])
    
    // 重置手动添加表单
    setManualProduct({
      product_id: '',
      customer_code: '',
      product_name: '',
      packing_size: '',
      batch_number: '',
      quantity: '',
      uom: ''
    })
    setShowManualAdd(false)
  }

  const removeProductFromSelection = (index) => {
    setSelectedProducts(prev => {
      const updated = prev.filter((_, i) => i !== index)
      return updated.map((item, i) => ({ ...item, sn: i + 1 }))
    })
  }

  const updateProductInSelection = (index, field, value) => {
    setSelectedProducts(prev => 
      prev.map((item, i) => {
        if (i === index) {
          const updatedItem = { ...item, [field]: value }
          
          // 如果更新的是 quantity，重新计算 total_weight
          if (field === 'quantity') {
            updatedItem.total_weight = calculateTotalWeight(value, item.uom)
          }
          
          return updatedItem
        }
        return item
      })
    )
  }

  const validateQuantity = (productId, requestedQuantity) => {
    const product = availableProducts.find(p => p.product_id === productId)
    if (!product) return true // 手动添加的产品跳过验证
    
    return parseFloat(requestedQuantity) <= parseFloat(product.current_stock)
  }

  // 获取汇总数据
  const summary = calculateSummary()

  return (
    <div className="bg-white border rounded-lg overflow-hidden">
      {/* Header with PO and Date */}
      <div className="bg-blue-50 px-4 py-3 border-b">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <h5 className="text-sm font-medium text-gray-700">Selected Products for Custom Declaration</h5>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-600 whitespace-nowrap">PO:</label>
              <input
                type="text"
                value={poNumber}
                onChange={(e) => setPONumber(e.target.value)}
                className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter PO number"
                required
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-600 whitespace-nowrap">Date:</label>
              <input
                type="date"
                value={declarationDate}
                onChange={(e) => setDeclarationDate(e.target.value)}
                className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S/N</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer Code</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Packing</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch No</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">UOM</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Weight</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {/* 现有产品行 */}
            {selectedProducts.map((product, index) => (
              <tr key={product.uniqueId} className="hover:bg-gray-50">
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                  {product.sn}
                  {product.isManual && <span className="ml-1 text-xs text-yellow-600">*</span>}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                  {product.product_id}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                  {product.customer_code || '-'}
                </td>
                <td className="px-3 py-2 text-sm text-gray-900">
                  {product.product_name}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                  {product.packing_size || '-'}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <input
                    type="text"
                    value={product.batch_number}
                    onChange={(e) => updateProductInSelection(index, 'batch_number', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Batch number"
                    required
                  />
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <input
                    type="text"
                    value={product.quantity}
                    onChange={(e) => updateProductInSelection(index, 'quantity', e.target.value)}
                    className={`w-20 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                      product.quantity && !product.isManual && !validateQuantity(product.product_id, product.quantity)
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-300'
                    }`}
                    placeholder="Qty"
                    required
                  />
                  {product.quantity && !product.isManual && !validateQuantity(product.product_id, product.quantity) && (
                    <div className="text-xs text-red-500 mt-1">Exceeds stock</div>
                  )}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                  {product.uom || '-'}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                  {product.total_weight > 0 ? product.total_weight.toFixed(2) : '-'}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => removeProductFromSelection(index)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}

            {/* Manual Add Row */}
            {showManualAdd && (
              <tr className="bg-yellow-50 border-t-2 border-yellow-200">
                <td className="px-3 py-2 whitespace-nowrap text-sm text-yellow-700 font-medium">
                  +
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <input
                    type="text"
                    value={manualProduct.product_id}
                    onChange={(e) => setManualProduct(prev => ({ ...prev, product_id: e.target.value }))}
                    className="w-full px-2 py-1 text-sm border border-yellow-300 rounded focus:outline-none focus:ring-1 focus:ring-yellow-500"
                    placeholder="Product Code *"
                    required
                  />
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <input
                    type="text"
                    value={manualProduct.customer_code}
                    onChange={(e) => setManualProduct(prev => ({ ...prev, customer_code: e.target.value }))}
                    className="w-full px-2 py-1 text-sm border border-yellow-300 rounded focus:outline-none focus:ring-1 focus:ring-yellow-500"
                    placeholder="Customer Code"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={manualProduct.product_name}
                    onChange={(e) => setManualProduct(prev => ({ ...prev, product_name: e.target.value }))}
                    className="w-full px-2 py-1 text-sm border border-yellow-300 rounded focus:outline-none focus:ring-1 focus:ring-yellow-500"
                    placeholder="Product Name *"
                    required
                  />
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <input
                    type="text"
                    value={manualProduct.packing_size}
                    onChange={(e) => setManualProduct(prev => ({ ...prev, packing_size: e.target.value }))}
                    className="w-full px-2 py-1 text-sm border border-yellow-300 rounded focus:outline-none focus:ring-1 focus:ring-yellow-500"
                    placeholder="Packing"
                  />
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <input
                    type="text"
                    value={manualProduct.batch_number}
                    onChange={(e) => setManualProduct(prev => ({ ...prev, batch_number: e.target.value }))}
                    className="w-full px-2 py-1 text-sm border border-yellow-300 rounded focus:outline-none focus:ring-1 focus:ring-yellow-500"
                    placeholder="Batch No"
                  />
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <input
                    type="text"
                    value={manualProduct.quantity}
                    onChange={(e) => setManualProduct(prev => ({ ...prev, quantity: e.target.value }))}
                    className="w-20 px-2 py-1 text-sm border border-yellow-300 rounded focus:outline-none focus:ring-1 focus:ring-yellow-500"
                    placeholder="Qty"
                  />
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <input
                    type="number"
                    step="0.01"
                    value={manualProduct.uom}
                    onChange={(e) => setManualProduct(prev => ({ ...prev, uom: e.target.value }))}
                    className="w-16 px-2 py-1 text-sm border border-yellow-300 rounded focus:outline-none focus:ring-1 focus:ring-yellow-500"
                    placeholder="UOM"
                  />
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                  {calculateTotalWeight(manualProduct.quantity, manualProduct.uom).toFixed(2)}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={addManualProduct}
                      className="px-2 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowManualAdd(false)}
                      className="px-2 py-1 bg-gray-400 text-white text-xs rounded hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Summary Section */}
      <div className="bg-blue-50 px-4 py-4 border-t">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-900">{summary.totalQuantity.toLocaleString()}</div>
            <div className="text-xs text-gray-600">Total Quantity</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-green-900">{summary.netWeight.toFixed(2)}</div>
            <div className="text-xs text-gray-600">Net Weight (kg)</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-orange-900">{summary.cartonWeight.toFixed(2)}</div>
            <div className="text-xs text-gray-600">Carton Weight (kg)</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-purple-900">{summary.grossWeight.toFixed(2)}</div>
            <div className="text-xs text-gray-600">Gross Weight (kg)</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Products: {selectedProducts.length}</span>
            <span className="mx-2">|</span>
            <span className="text-xs text-yellow-600">* Manual Entry</span>
          </div>
          <div className="flex gap-2">
            {!showManualAdd && (
              <button
                type="button"
                onClick={() => setShowManualAdd(true)}
                className="px-3 py-2 border border-yellow-600 text-yellow-600 rounded-md text-sm font-medium hover:bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                + Manual Add
              </button>
            )}
            <button
              type="submit"
              disabled={formLoading || selectedProducts.length === 0 || !poNumber.trim()}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {formLoading 
                ? 'Saving...'
                : 'Save Custom Declaration Form'
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CustomDeclarationTable
