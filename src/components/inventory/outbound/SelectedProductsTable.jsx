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

      {/* 继续第四段... */}
