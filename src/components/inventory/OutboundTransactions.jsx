import React, { useState, useEffect } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'
import { usePermissions, PERMISSIONS } from '../../context/PermissionContext'
import { supabase } from '../../supabase/client'

const OutboundTransactions = () => {
  const { t } = useLanguage()
  const { userProfile } = useAuth()
  const { hasPermission } = usePermissions()
  const [availableProducts, setAvailableProducts] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Shipment Information
  const [shipmentInfo, setShipmentInfo] = useState({
    shipment: '',
    containerNumber: '',
    sealNo: '',
    etd: '',
    eta: '',
    poNumber: ''
  })

  // Selected Products for Outbound
  const [selectedProducts, setSelectedProducts] = useState([])
  
  // Product Selection Filters
  const [productFilters, setProductFilters] = useState({
    country: '',
    vendor: '',
    type: '',
    search: ''
  })

  const [formLoading, setFormLoading] = useState(false)

  const canCreateTransaction = hasPermission(PERMISSIONS.INVENTORY_EDIT)

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

  // Get unique filter options
  const uniqueCountries = [...new Set(availableProducts.map(p => p.country).filter(Boolean))].sort()
  const uniqueVendors = productFilters.country 
    ? [...new Set(availableProducts.filter(p => p.country === productFilters.country).map(p => p.vendor).filter(Boolean))].sort()
    : [...new Set(availableProducts.map(p => p.vendor).filter(Boolean))].sort()
  const uniqueTypes = [...new Set(availableProducts.map(p => p.type).filter(Boolean))].sort()

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

    // 允许选择同一个产品（移除重复检查）
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

  const removeProductFromSelection = (index) => {
    setSelectedProducts(prev => {
      const updated = prev.filter((_, i) => i !== index)
      // Renumber S/N
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

  const clearAllProducts = () => {
    setSelectedProducts([])
    setShipmentInfo({
      shipment: '',
      containerNumber: '',
      sealNo: '',
      etd: '',
      eta: '',
      poNumber: ''
    })
  }

  const validateQuantity = (productId, requestedQuantity) => {
    const product = availableProducts.find(p => p.product_id === productId)
    if (!product) return false
    
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
      if (!validateQuantity(product.product_id, product.quantity)) {
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
        notes: `${shipmentNotes}, Batch: ${product.batch_number}`,
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

      // Clear the form after successful submission
      setSelectedProducts([])
      setShipmentInfo({
        shipment: '',
        containerNumber: '',
        sealNo: '',
        etd: '',
        eta: '',
        poNumber: ''
      })
      
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
        
        {/* Shipment Information */}
        <div className="bg-blue-50 p-4 rounded-lg border">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Shipment Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Shipment</label>
              <input
                type="text"
                value={shipmentInfo.shipment}
                onChange={(e) => setShipmentInfo(prev => ({ ...prev, shipment: e.target.value }))}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Shipment name"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Container Number</label>
              <input
                type="text"
                value={shipmentInfo.containerNumber}
                onChange={(e) => setShipmentInfo(prev => ({ ...prev, containerNumber: e.target.value }))}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Container number"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Seal No</label>
              <input
                type="text"
                value={shipmentInfo.sealNo}
                onChange={(e) => setShipmentInfo(prev => ({ ...prev, sealNo: e.target.value }))}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Seal number"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">ETD</label>
              <input
                type="date"
                value={shipmentInfo.etd}
                onChange={(e) => setShipmentInfo(prev => ({ ...prev, etd: e.target.value }))}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">ETA</label>
              <input
                type="date"
                value={shipmentInfo.eta}
                onChange={(e) => setShipmentInfo(prev => ({ ...prev, eta: e.target.value }))}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">PO Number</label>
              <input
                type="text"
                value={shipmentInfo.poNumber}
                onChange={(e) => setShipmentInfo(prev => ({ ...prev, poNumber: e.target.value }))}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="PO number"
              />
            </div>
          </div>
        </div>

        {/* Product Selection - 浅蓝色背景，类似Inbound */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Product Selection</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Country</label>
              <select
                value={productFilters.country}
                onChange={(e) => setProductFilters(prev => ({ ...prev, country: e.target.value, vendor: '' }))}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">All Countries</option>
                {uniqueCountries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Vendor</label>
              <select
                value={productFilters.vendor}
                onChange={(e) => setProductFilters(prev => ({ ...prev, vendor: e.target.value }))}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                disabled={!productFilters.country}
              >
                <option value="">All Vendors</option>
                {uniqueVendors.map(vendor => (
                  <option key={vendor} value={vendor}>{vendor}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
              <select
                value={productFilters.type}
                onChange={(e) => setProductFilters(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">All Types</option>
                {uniqueTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Search</label>
              <input
                type="text"
                value={productFilters.search}
                onChange={(e) => setProductFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Product name or code..."
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-500">
              Found {filteredProducts.length} products with stock
            </div>
            {selectedProducts.length > 0 && (
              <button
                type="button"
                onClick={clearAllProducts}
                className="text-xs text-red-600 hover:text-red-800 font-medium"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Product List - 当选择了国家后显示产品列表 */}
        {productFilters.country && (
          <div className="bg-white border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b">
              <h5 className="text-sm font-medium text-gray-700">
                Available Products {productFilters.country && `from ${productFilters.country}`}
                {filteredProducts.length > 0 && ` (${filteredProducts.length} found)`}
              </h5>
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
                          {parseFloat(product.current_stock).toLocaleString()}
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

        {/* Selected Products Table */}
        {selectedProducts.length > 0 ? (
          <div className="bg-white border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b">
              <h5 className="text-sm font-medium text-gray-700">Selected Products for Outbound</h5>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S/N</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Description</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Packing</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Available Stock</th>
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
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-blue-600 font-medium">
                        {parseFloat(product.available_stock).toLocaleString()}
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
                          max={product.available_stock}
                          value={product.quantity}
                          onChange={(e) => updateProductInSelection(index, 'quantity', e.target.value)}
                          className={`w-20 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-red-500 ${
                            product.quantity && !validateQuantity(product.product_id, product.quantity)
                              ? 'border-red-500 bg-red-50'
                              : 'border-gray-300'
                          }`}
                          placeholder="Qty"
                          required
                        />
                        {product.quantity && !validateQuantity(product.product_id, product.quantity) && (
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
              </div>
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
        ) : (
          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
            <div className="mx-auto h-16 w-16 text-gray-400 mb-4">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} 
                  d="M7 16l-4-4m0 0l4-4m-4 4h18" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Products Selected</h3>
            <p className="text-gray-500 mb-4">Select a country from the filters above to view available products with stock.</p>
            <p className="text-sm text-gray-400">Once you select a country, products will appear below for you to add to your outbound transaction.</p>
          </div>
        )}
      </form>
    </div>
  )
}

export default OutboundTransactions
