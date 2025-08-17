// src/components/inventory/OutboundTransactions.jsx - 最终版本
import React, { useState, useEffect } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'
import { usePermissions, PERMISSIONS } from '../../context/PermissionContext'
import { supabase } from '../../supabase/client'
import ProductSelectionFilters from './shared/ProductSelectionFilters'
import ShipmentInfoForm from './outbound/ShipmentInfoForm'
import SelectedProductsTable from './outbound/SelectedProductsTable'
import EmptyState from './outbound/EmptyState'

const OutboundTransactions = () => {
  const { t } = useLanguage()
  const { userProfile } = useAuth()
  const { hasPermission } = usePermissions()
  const [availableProducts, setAvailableProducts] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Shipment Information - 使用 localStorage 保持状态
  const [shipmentInfo, setShipmentInfo] = useState(() => {
    const saved = localStorage.getItem('outbound_shipment_info')
    return saved ? JSON.parse(saved) : {
      shipment: '',
      containerNumber: '',
      sealNo: '',
      etd: '',
      eta: '',
      poNumber: ''
    }
  })

  // Selected Products for Outbound - 使用 localStorage 保持状态
  const [selectedProducts, setSelectedProducts] = useState(() => {
    const saved = localStorage.getItem('outbound_selected_products')
    return saved ? JSON.parse(saved) : []
  })
  
  // Product Selection Filters - 使用 localStorage 保持状态
  const [productFilters, setProductFilters] = useState(() => {
    const saved = localStorage.getItem('outbound_product_filters')
    return saved ? JSON.parse(saved) : {
      country: '',
      vendor: '',
      type: '',
      search: ''
    }
  })

  // 控制产品列表显示/隐藏
  const [showProductList, setShowProductList] = useState(() => {
    const saved = localStorage.getItem('outbound_show_product_list')
    return saved ? JSON.parse(saved) : true
  })

  const [formLoading, setFormLoading] = useState(false)
  const canCreateTransaction = hasPermission(PERMISSIONS.INVENTORY_EDIT)

  // 保存状态到 localStorage
  useEffect(() => {
    localStorage.setItem('outbound_shipment_info', JSON.stringify(shipmentInfo))
  }, [shipmentInfo])

  useEffect(() => {
    localStorage.setItem('outbound_selected_products', JSON.stringify(selectedProducts))
  }, [selectedProducts])

  useEffect(() => {
    localStorage.setItem('outbound_product_filters', JSON.stringify(productFilters))
  }, [productFilters])

  useEffect(() => {
    localStorage.setItem('outbound_show_product_list', JSON.stringify(showProductList))
  }, [showProductList])

  useEffect(() => {
    fetchAvailableProducts()
  }, [])

  const fetchAvailableProducts = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('current_inventory')
        .select('*')
        .gt('current_stock', 0)
        .order('product_name')

      if (error) {
        console.error('Error fetching available products:', error)
        return
      }

      setAvailableProducts(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter products for selection
  const filteredProducts = availableProducts.filter(product => {
    const matchesCountry = !productFilters.country || product.country === productFilters.country
    const matchesVendor = !productFilters.vendor || product.vendor === productFilters.vendor
    const matchesType = !productFilters.type || product.type === productFilters.type
    const matchesSearch = !productFilters.search || 
      product.product_name?.toLowerCase().includes(productFilters.search.toLowerCase()) ||
      product.product_id?.toLowerCase().includes(productFilters.search.toLowerCase())
    
    return matchesCountry && matchesVendor && matchesType && matchesSearch
  })

  const addProductToSelection = (productId) => {
    const product = availableProducts.find(p => p.product_id === productId)
    if (!product) return

    const newProduct = {
      sn: selectedProducts.length + 1,
      product_id: productId,
      product_name: product.product_name,
      packing_size: product.packing_size,
      available_stock: product.current_stock,
      batch_number: '',
      quantity: ''
    }

    setSelectedProducts(prev => [...prev, newProduct])
  }

  // 清除所有状态
  const clearAllData = () => {
    setSelectedProducts([])
    setShipmentInfo({
      shipment: '',
      containerNumber: '',
      sealNo: '',
      etd: '',
      eta: '',
      poNumber: ''
    })
    localStorage.removeItem('outbound_selected_products')
    localStorage.removeItem('outbound_shipment_info')
  }

  const validateQuantity = (productId, requestedQuantity) => {
    const product = availableProducts.find(p => p.product_id === productId)
    if (!product) return true // 手动添加的产品跳过验证
    
    return parseFloat(requestedQuantity) <= parseFloat(product.current_stock)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (selectedProducts.length === 0) {
      alert('Please select at least one product')
      return
    }

    // Validate all quantities and batch numbers
    for (let product of selectedProducts) {
      if (!product.quantity || parseFloat(product.quantity) <= 0) {
        alert(`Please enter quantity for ${product.product_name}`)
        return
      }
      if (!product.batch_number.trim()) {
        alert(`Please enter batch number for ${product.product_name}`)
        return
      }
      // 只对系统产品进行库存验证
      if (!product.isManual && !validateQuantity(product.product_id, product.quantity)) {
        alert(`Insufficient stock for ${product.product_name}! Available: ${product.available_stock}`)
        return
      }
    }

    setFormLoading(true)

    try {
      const transactionDate = new Date().toISOString().split('T')[0]
      
      const shipmentNotes = `Shipment: ${shipmentInfo.shipment || 'N/A'}, Container: ${shipmentInfo.containerNumber || 'N/A'}, Seal: ${shipmentInfo.sealNo || 'N/A'}, ETD: ${shipmentInfo.etd || 'N/A'}, ETA: ${shipmentInfo.eta || 'N/A'}, PO: ${shipmentInfo.poNumber || 'N/A'}`

      const transactions = selectedProducts.map(product => ({
        product_id: product.product_id,
        transaction_type: 'OUT',
        quantity: parseFloat(product.quantity),
        unit_price: null,
        total_amount: null,
        transaction_date: transactionDate,
        reference_number: null,
        notes: `${shipmentNotes}, Batch: ${product.batch_number}${product.isManual ? ' (Manual Entry)' : ''}`,
        batch_number: product.batch_number,
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

      // 清除所有数据和localStorage
      clearAllData()
      
      await fetchAvailableProducts()
      
      const notification = document.createElement('div')
      notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-md shadow-lg z-50'
      notification.textContent = 'Outbound transactions added successfully!'
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
        <span className="ml-3 text-gray-600">Loading available products...</span>
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
        <p className="text-lg text-gray-500">You don't have permission to add outbound transactions</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* 货运信息表单组件 */}
        <ShipmentInfoForm 
          shipmentInfo={shipmentInfo}
          setShipmentInfo={setShipmentInfo}
        />

        {/* 使用共用的产品选择过滤器组件 */}
        <ProductSelectionFilters
          availableProducts={availableProducts}
          productFilters={productFilters}
          setProductFilters={setProductFilters}
          showProductList={showProductList}
          setShowProductList={setShowProductList}
          selectedProducts={selectedProducts}
          clearAllData={clearAllData}
          title="Product Selection"
        />

        {/* Product List - 保持原来的产品列表显示 */}
        {productFilters.country && showProductList && (
          <div className="bg-white border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b flex justify-between items-center">
              <h5 className="text-sm font-medium text-gray-700">
                Available Products {productFilters.country && `from ${productFilters.country}`}
                {filteredProducts.length > 0 && ` (${filteredProducts.length} found)`}
              </h5>
              <button
                type="button"
                onClick={() => setShowProductList(false)}
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
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Available Stock</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredProducts.map(product => (
                      <tr key={product.product_id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                          {product.product_id}
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
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-blue-600 font-medium">
                          {parseFloat(product.current_stock || 0).toLocaleString()}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => addProductToSelection(product.product_id)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
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

        {/* 已选产品表格组件 或 空状态组件 */}
        {selectedProducts.length > 0 ? (
          <SelectedProductsTable
            selectedProducts={selectedProducts}
            setSelectedProducts={setSelectedProducts}
            availableProducts={availableProducts}
            formLoading={formLoading}
          />
        ) : (
          <EmptyState />
        )}
      </form>
    </div>
  )
}

export default OutboundTransactions
