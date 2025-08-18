// src/components/inventory/outbound/SelectedProductsTable.jsx
import React, { useState } from 'react'
import { useLanguage } from '../../../context/LanguageContext'

const SelectedProductsTable = ({
  selectedProducts,
  setSelectedProducts,
  availableProducts,
  formLoading,
  nextItemId
}) => {
  const { t } = useLanguage()
  
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
      alert(t('pleaseEnterProductCodeAndName'))
      return
    }

    const newProduct = {
      uniqueId: nextItemId.current++,
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
        <h5 className="text-sm font-medium text-gray-700">{t('selectedProductsForOutbound')}</h5>
        <button
          type="button"
          onClick={() => setShowManualAdd(true)}
          className="text-xs text-yellow-600 hover:text-yellow-800 font-medium"
        >
          + {t('manualAdd')}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('serialNumber')}</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('code')}</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('productDescription')}</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('packing')}</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('batchNo')}</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('quantity')}</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('actions')}</th>
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
                    placeholder={t('batchNumber')}
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
                    placeholder={t('quantity')}
                    required
                  />
                  {product.quantity && !product.isManual && !validateQuantity(product.product_id, product.quantity) && (
                    <div className="text-xs text-red-500 mt-1">{t('exceedsStock')}</div>
                  )}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => removeProductFromSelection(index)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    {t('remove')}
                  </button>
                </td>
              </tr>
            ))}

            {/* Manual Add Row - 集成在表格最后一行，有底色区分 */}
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
                    placeholder={t('enterNewProductCode')}
                    required
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={manualProduct.product_name}
                    onChange={(e) => setManualProduct(prev => ({ ...prev, product_name: e.target.value }))}
                    className="w-full px-2 py-1 text-sm border border-yellow-300 rounded focus:outline-none focus:ring-1 focus:ring-yellow-500"
                    placeholder={t('enterNewProductName')}
                    required
                  />
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <input
                    type="text"
                    value={manualProduct.packing_size}
                    onChange={(e) => setManualProduct(prev => ({ ...prev, packing_size: e.target.value }))}
                    className="w-full px-2 py-1 text-sm border border-yellow-300 rounded focus:outline-none focus:ring-1 focus:ring-yellow-500"
                    placeholder={t('enterNewPacking')}
                  />
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <input
                    type="text"
                    value={manualProduct.batch_number}
                    onChange={(e) => setManualProduct(prev => ({ ...prev, batch_number: e.target.value }))}
                    className="w-full px-2 py-1 text-sm border border-yellow-300 rounded focus:outline-none focus:ring-1 focus:ring-yellow-500"
                    placeholder={t('enterNewBatchNo')}
                  />
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={manualProduct.quantity}
                    onChange={(e) => setManualProduct(prev => ({ ...prev, quantity: e.target.value }))}
                    className="w-20 px-2 py-1 text-sm border border-yellow-300 rounded focus:outline-none focus:ring-1 focus:ring-yellow-500"
                    placeholder={t('enterNewQuantity')}
                  />
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={addManualProduct}
                      className="px-2 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    >
                      {t('add')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowManualAdd(false)}
                      className="px-2 py-1 bg-gray-400 text-white text-xs rounded hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400"
                    >
                      {t('cancel')}
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Summary and Submit */}
      <div className="bg-red-50 px-4 py-3 border-t flex justify-between items-center">
        <div className="text-sm text-gray-600">
          <span className="font-medium">{t('totalProducts')}: {selectedProducts.length}</span>
          <span className="mx-2">|</span>
          <span className="font-medium">{t('totalQuantity')}: {selectedProducts.reduce((sum, p) => sum + (parseFloat(p.quantity) || 0), 0).toLocaleString()}</span>
          <span className="mx-2">|</span>
          <span className="text-xs text-yellow-600">* {t('manualEntry')}</span>
        </div>
        <div className="flex gap-2">
          {!showManualAdd && (
            <button
              type="button"
              onClick={() => setShowManualAdd(true)}
              className="px-3 py-2 border border-yellow-600 text-yellow-600 rounded-md text-sm font-medium hover:bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              + {t('manualAdd')}
            </button>
          )}
          <button
            type="submit"
            disabled={formLoading || selectedProducts.length === 0}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
          >
            {formLoading 
              ? t('processing')
              : `${t('createOutboundTransaction')}${selectedProducts.length > 1 ? 's' : ''}`
            }
          </button>
        </div>
      </div>
    </div>
  )
}

export default SelectedProductsTable
