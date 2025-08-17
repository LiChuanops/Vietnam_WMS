import React, { useState, useEffect } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'
import { usePermissions, PERMISSIONS } from '../../context/PermissionContext'
import { supabase } from '../../supabase/client'
import ProductSelectionFilters from './shared/ProductSelectionFilters'

const InboundTransactions = ({ inboundData, setInboundData, clearInboundData }) => {
  const { t } = useLanguage()
  const { userProfile } = useAuth()
  const { hasPermission } = usePermissions()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [formLoading, setFormLoading] = useState(false)

  const canCreateTransaction = hasPermission(PERMISSIONS.INVENTORY_EDIT)

  // 从父组件获取状态
  const { bulkProducts, productFilters, showProductList, transactionDate } = inboundData

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('products')
        .select('system_code, product_name, country, vendor, type, packing_size')
        .eq('status', 'Active')
        .order('product_name')

      if (error) {
        console.error('Error fetching products:', error)
        return
      }

      setProducts(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  // 更新状态的辅助函数
  const updateInboundData = (updates) => {
    setInboundData(prev => ({ ...prev, ...updates }))
  }

  const updateProductFilters = (filtersOrFunction) => {
    if (typeof filtersOrFunction === 'function') {
      // 如果传入的是函数，先获取当前状态，然后应用函数
      const newFilters = filtersOrFunction(productFilters)
      updateInboundData({ productFilters: newFilters })
    } else {
      // 如果传入的是对象，直接更新
      updateInboundData({ productFilters: filtersOrFunction })
    }
  }

  const updateShowProductList = (show) => {
    updateInboundData({ showProductList: show })
  }

  const updateTransactionDate = (date) => {
    updateInboundData({ transactionDate: date })
  }

  // 获取日期限制
  const getMinDate = () => {
    const today = new Date()
    const currentMonth = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0')
    return currentMonth + '-01' // 当月1号
  }

  const addProductToBulk = (productId) => {
    const product = products.find(p => p.system_code === productId)
    if (!product) return

    const newProduct = {
      sn: bulkProducts.length + 1,
      product_id: productId,
      product_name: product.product_name,
      packing_size: product.packing_size,
      quantity: '',
      notes: ''
    }

    updateInboundData({ 
      bulkProducts: [...bulkProducts, newProduct] 
    })
  }

  const removeProductFromBulk = (index) => {
    const updated = bulkProducts.filter((_, i) => i !== index)
    const renumbered = updated.map((item, i) => ({ ...item, sn: i + 1 }))
    updateInboundData({ bulkProducts: renumbered })
  }

  const updateProductInBulk = (index, field, value) => {
    const updated = bulkProducts.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    )
    updateInboundData({ bulkProducts: updated })
  }

  // Filter products for selection
  const filteredProducts = products.filter(product => {
    const matchesCountry = !productFilters.country || product.country === productFilters.country
    const matchesVendor = !productFilters.vendor || product.vendor === productFilters.vendor
    const matchesType = !productFilters.type || product.type === productFilters.type
    const matchesSearch = !productFilters.search || 
      product.product_name?.toLowerCase().includes(productFilters.search.toLowerCase()) ||
      product.system_code?.toLowerCase().includes(productFilters.search.toLowerCase())
    
    return matchesCountry && matchesVendor && matchesType && matchesSearch
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (bulkProducts.length === 0) {
      alert('Please add at least one product')
      return
    }

    // Validate all products have quantities
    for (let product of bulkProducts) {
      if (!product.quantity || parseFloat(product.quantity) <= 0) {
        alert(`Please enter quantity for ${product.product_name}`)
        return
      }
    }

    setFormLoading(true)

    try {
      const transactions = bulkProducts.map(product => ({
        product_id: product.product_id,
        transaction_type: 'IN',
        quantity: parseFloat(product.quantity),
        unit_price: null,
        total_amount: null,
        transaction_date: transactionDate, // 使用用户选择的日期
        reference_number: null,
        notes: product.notes.trim() || null,
        created_by: userProfile?.id
      }))

      const { error } = await supabase
        .from('inventory_transactions')
        .insert(transactions)

      if (error) {
        console.error('Error adding transactions:', error)
        alert('Error adding transactions: ' + error.message)
        return
      }

      // 清除表单数据
      clearInboundData()
      
      const notification = document.createElement('div')
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg z-50'
      notification.textContent = `${transactions.length} inbound transactions added successfully!`
      document.body.appendChild(notification)
      
      setTimeout(() => {
        document.body.removeChild(notification)
      }, 3000)

    } catch (error) {
      console.error('Error:', error)
      alert('Unexpected error')
    } finally {
      setFormLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-600">Loading...</span>
      </div>
    )
  }

  if (!canCreateTransaction) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-32 w-32 text-gray-400 mb-4">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} 
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-lg text-gray-500">You don't have permission to add inbound transactions</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 使用共用的 ProductSelectionFilters 组件 */}
        <ProductSelectionFilters
          availableProducts={products}
          productFilters={productFilters}
          setProductFilters={updateProductFilters}
          showProductList={showProductList}
          setShowProductList={updateShowProductList}
          selectedProducts={bulkProducts}
          clearAllData={clearInboundData}
          title="Product Selection"
        />

        {/* Product List - 可控制显示/隐藏 */}
        {productFilters.country && showProductList && (
          <div className="bg-white border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b flex justify-between items-center">
              <h5 className="text-sm font-medium text-gray-700">
                Available Products {productFilters.country && `from ${productFilters.country}`}
                {filteredProducts.length > 0 && ` (${filteredProducts.length} found)`}
              </h5>
              <button
                type="button"
                onClick={() => updateShowProductList(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {filteredProducts.length > 0 ? (
              <div className="max-h-64 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Packing</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredProducts.map(product => (
                      <tr key={product.system_code} className="hover:bg-gray-50">
                        <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                          {product.system_code}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900">
                          {product.product_name}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                          {product.vendor}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                          {product.type}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                          {product.packing_size || '-'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => addProductToBulk(product.system_code)}
                            className="text-green-600 hover:text-green-800 text-sm font-medium"
                          >
                            Add
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500">
                <p>No products found matching the selected criteria.</p>
                {productFilters.search && (
                  <p className="text-xs mt-1">Try adjusting your search terms or filters.</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Selected Products Table */}
        {bulkProducts.length > 0 ? (
          <div className="bg-white border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b flex justify-between items-center">
              <h5 className="text-sm font-medium text-gray-700">Selected Products for Inbound</h5>
              <div className="flex items-center gap-3">
                <label className="text-xs font-medium text-gray-600">Transaction Date:</label>
                <input
                  type="date"
                  value={transactionDate}
                  onChange={(e) => updateTransactionDate(e.target.value)}
                  min={getMinDate()}
                  className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S/N</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Code</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Packing</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bulkProducts.map((product, index) => (
                    <tr key={`${product.product_id}-${index}`} className="hover:bg-gray-50">
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                        {product.sn}
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
                          type="number"
                          step="0.01"
                          min="0"
                          value={product.quantity}
                          onChange={(e) => updateProductInBulk(index, 'quantity', e.target.value)}
                          className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                          placeholder="Qty"
                          required
                        />
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <input
                          type="text"
                          value={product.notes}
                          onChange={(e) => updateProductInBulk(index, 'notes', e.target.value)}
                          className="w-32 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                          placeholder="Notes"
                        />
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => removeProductFromBulk(index)}
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
            <div className="bg-green-50 px-4 py-3 border-t flex justify-between items-center">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Total Products: {bulkProducts.length}</span>
                <span className="mx-2">|</span>
                <span className="font-medium">Total Quantity: {bulkProducts.reduce((sum, p) => sum + (parseFloat(p.quantity) || 0), 0).toLocaleString()}</span>
                <span className="mx-2">|</span>
                <span className="font-medium">Date: {transactionDate}</span>
              </div>
              <button
                type="submit"
                disabled={formLoading || bulkProducts.length === 0}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
              >
                {formLoading 
                  ? 'Processing...' 
                  : `Add ${bulkProducts.length} Inbound Transaction${bulkProducts.length > 1 ? 's' : ''}`
                }
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
            <div className="mx-auto h-16 w-16 text-gray-400 mb-4">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} 
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Products Selected</h3>
            <p className="text-gray-500 mb-4">Select a country from the filters above to view available products.</p>
            <p className="text-sm text-gray-400">Once you select a country, products will appear below for you to add to your inbound transaction.</p>
          </div>
        )}
      </form>
    </div>
  )
}

export default InboundTransactions
