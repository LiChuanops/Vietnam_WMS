// src/components/inventory/outbound/SelectedProductsTable.jsx
import React, { useState } from 'react'

const SelectedProductsTable = ({
  selectedProducts,
  setSelectedProducts,
  availableProducts,
  formLoading
}) => {
  // Manual add 状态管理
  const [showManualAdd, setShowManualAdd] = useState(false)
  const [manualProduct, setManualProduct] = useState({
    product_id: '',
    product_name: '',
    packing_size: '',
    batch_number: '',
    quantity: ''
  })

  // 手动添加产品
  const addManualProduct = () => {
    if (!manualProduct.product_id.trim() || !manualProduct.product_name.trim()) {
      alert('Please enter product code and name')
      return
    }

    const newProduct = {
      sn: selectedProducts.length + 1,
      product_id: manualProduct.product_id.trim(),
      product_name: manualProduct.product_name.trim(),
      packing_size: manualProduct.packing_size.trim() || '-',
      batch_number: manualProduct.batch_number.trim(),
      quantity: manualProduct.quantity,
      isManual: true // 标记为手动添加
    }

    setSelectedProducts(prev => [...prev, newProduct])
    
    // 重置手动添加表单
    setManualProduct({
      product_id: '',
      product_name: '',
      packing_size: '',
      batch_number: '',
      quantity: ''
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
      prev.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    )
  }

  const validateQuantity = (productId, requestedQuantity) => {
    const product = availableProducts.find(p => p.product_id === productId)
    if (!product) return true // 手动添加的产品跳过验证
    
    return parseFloat(requestedQuantity) <= parseFloat(product.current_stock)
  }

  return (
    <div className="bg-white border rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-4 py-2 border-b flex justify-between items-center">
        <h5 className="text-sm font-medium text-gray-700">Selected Products for Outbound</h5>
        <button
          type="button"
          onClick={() => setShowManualAdd(true)}
          className="text-xs text-yellow-600 hover:text-yellow-800 font-medium"
        >
          + Manual Add
        </button>
      </div>

      {/* Manual Add Row - 当 showManualAdd 为 true 时显示 */}
      {showManualAdd && (
        <div className="bg-yellow-50 border-b border-yellow-200">
          <div className="px-4 py-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-yellow-800">Manual Add Product</span>
              <button
                type="button"
                onClick={() => setShowManualAdd(false)}
                className="text-yellow-600 hover:text-yellow-800"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-7 gap-2 items-end">
              <div>
                <input
                  type="text"
                  value={manualProduct.product_id}
                  onChange={(e) => setManualProduct(prev => ({ ...prev, product_id: e.target.value }))}
                  className="w-full px-2 py-1 text-xs border border-yellow-300 rounded focus:outline-none focus:ring-1 focus:ring-yellow-500"
                  placeholder="Product Code *"
                  required
                />
              </div>
              <div className="col-span-2">
                <input
                  type="text"
                  value={manualProduct.product_name}
                  onChange={(e) => setManualProduct(prev => ({ ...prev, product_name: e.target.value }))}
                  className="w-full px-2 py-1 text-xs border border-yellow-300 rounded focus:outline-none focus:ring-1 focus:ring-yellow-500"
                  placeholder="Product Name *"
                  required
                />
              </div>
              <div>
                <input
                  type="text"
                  value={manualProduct.packing_size}
                  onChange={(e) => setManualProduct(prev => ({ ...prev, packing_size: e.target.value }))}
                  className="w-full px-2 py-1 text-xs border border-yellow-300 rounded focus:outline-none focus:ring-1 focus:ring-yellow-500"
                  placeholder="Packing"
                />
              </div>
              <div>
                <input
                  type="text"
                  value={manualProduct.batch_number}
                  onChange={(e) => setManualProduct(prev => ({ ...prev, batch_number: e.target.value }))}
                  className="w-full px-2 py-1 text-xs border border-yellow-300 rounded focus:outline-none focus:ring-1 focus:ring-yellow-500"
                  placeholder="Batch No"
                />
              </div>
              <div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={manualProduct.quantity}
                  onChange={(e) => setManualProduct(prev => ({ ...prev, quantity: e.target.value }))}
                  className="w-full px-2 py-1 text-xs border border-yellow-300 rounded focus:outline-none focus:ring-1 focus:ring-yellow-500"
                  placeholder="Quantity"
                />
              </div>
              <div>
                <button
                  type="button"
                  onClick={addManualProduct}
                  className="w-full px-2 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S/N</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Description</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Packing</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch No</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {selectedProducts.map((product, index) => (
              <tr key={`${product.product_id}-${index}`} className="hover:bg-gray-50">
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                  {product.sn}
                  {product.isManual && <span className="ml-1 text-xs text-yellow-600">*</span>}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                  {product.product_id}
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
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-red-500"
                    placeholder="Batch number"
                    required
                  />
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={product.isManual ? undefined : product.available_stock}
                    value={product.quantity}
                    onChange={(e) => updateProductInSelection(index, 'quantity', e.target.value)}
                    className={`w-20 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-red-500 ${
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
          </tbody>
        </table>
      </div>
      
      {/* Summary and Submit */}
      <div className="bg-red-50 px-4 py-3 border-t flex justify-between items-center">
        <div className="text-sm text-gray-600">
          <span className="font-medium">Total Products: {selectedProducts.length}</span>
          <span className="mx-2">|</span>
          <span className="font-medium">Total Quantity: {selectedProducts.reduce((sum, p) => sum + (parseFloat(p.quantity) || 0), 0).toLocaleString()}</span>
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
            disabled={formLoading || selectedProducts.length === 0}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
          >
            {formLoading 
              ? 'Processing...' 
              : `Create ${selectedProducts.length} Outbound Transaction${selectedProducts.length > 1 ? 's' : ''}`
            }
          </button>
        </div>
      </div>
    </div>
  )
}

export default SelectedProductsTable
