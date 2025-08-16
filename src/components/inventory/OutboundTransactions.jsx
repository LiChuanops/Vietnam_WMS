import React, { useState, useEffect } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'
import { usePermissions, PERMISSIONS } from '../../context/PermissionContext'
import { supabase } from '../../supabase/client'

const OutboundTransactions = () => {
  const { t } = useLanguage()
  const { userProfile } = useAuth()
  const { hasPermission } = usePermissions()
  const [transactions, setTransactions] = useState([])
  const [availableProducts, setAvailableProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('system') // 'system' or 'manual'
  
  // Manual product entry
  const [manualProducts, setManualProducts] = useState([])
  
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
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  })

  const canCreateTransaction = hasPermission(PERMISSIONS.INVENTORY_EDIT)

  useEffect(() => {
    fetchTransactions()
    fetchAvailableProducts()
  }, [])

  useEffect(() => {
    fetchTransactions()
  }, [dateFilter])

  const fetchAvailableProducts = async () => {
    try {
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
    }
  }

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('inventory_transactions')
        .select(`
          *,
          products:product_id (
            product_name,
            country,
            vendor,
            packing_size
          )
        `)
        .eq('transaction_type', 'OUT')
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false })

      if (dateFilter.startDate) {
        query = query.gte('transaction_date', dateFilter.startDate)
      }
      if (dateFilter.endDate) {
        query = query.lte('transaction_date', dateFilter.endDate)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching transactions:', error)
        return
      }

      setTransactions(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddTransaction = () => {
    if (!canCreateTransaction) {
      alert('No permission to add transactions')
      return
    }

    setModalMode('system')
    setShipmentInfo({
      shipment: '',
      containerNumber: '',
      sealNo: '',
      etd: '',
      eta: '',
      poNumber: ''
    })
    setSelectedProducts([])
    setProductFilters({
      country: '',
      vendor: '',
      type: '',
      search: ''
    })
    setShowModal(true)
  }

  const handleManualAdd = () => {
    if (!canCreateTransaction) {
      alert('No permission to add transactions')
      return
    }

    setModalMode('manual')
    setShipmentInfo({
      shipment: '',
      containerNumber: '',
      sealNo: '',
      etd: '',
      eta: '',
      poNumber: ''
    })
    setManualProducts([])
    setShowModal(true)
  }

  const addManualProduct = () => {
    const newProduct = {
      sn: manualProducts.length + 1,
      product_description: '',
      packing: '',
      batch_number: '',
      quantity: ''
    }
    setManualProducts(prev => [...prev, newProduct])
  }

  const removeManualProduct = (index) => {
    setManualProducts(prev => {
      const updated = prev.filter((_, i) => i !== index)
      return updated.map((item, i) => ({ ...item, sn: i + 1 }))
    })
  }

  const updateManualProduct = (index, field, value) => {
    setManualProducts(prev => 
      prev.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    )
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

    // Check if product already selected
    if (selectedProducts.find(p => p.product_id === productId)) {
      alert('Product already selected')
      return
    }

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

  const validateQuantity = (productId, requestedQuantity) => {
    const product = availableProducts.find(p => p.product_id === productId)
    if (!product) return false
    
    return parseFloat(requestedQuantity) <= parseFloat(product.current_stock)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (modalMode === 'system') {
      // System product submission
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

        const { data, error } = await supabase
          .from('inventory_transactions')
          .insert(transactions)
          .select(`
            *,
            products:product_id (
              product_name,
              country,
              vendor,
              packing_size
            )
          `)

        if (error) {
          console.error('Error adding transactions:', error)
          alert('Error adding transactions: ' + error.message)
          return
        }

        setTransactions(prev => [...data, ...prev])
        setShowModal(false)
        
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
    } else {
      // Manual product submission
      if (manualProducts.length === 0) {
        alert('Please add at least one product')
        return
      }

      // Validate all manual products
      for (let product of manualProducts) {
        if (!product.product_description.trim()) {
          alert(`Please enter product description for row ${product.sn}`)
          return
        }
        if (!product.quantity || parseFloat(product.quantity) <= 0) {
          alert(`Please enter quantity for row ${product.sn}`)
          return
        }
        if (!product.batch_number.trim()) {
          alert(`Please enter batch number for row ${product.sn}`)
          return
        }
      }

      setFormLoading(true)

      try {
        const transactionDate = new Date().toISOString().split('T')[0]
        
        const shipmentNotes = `Shipment: ${shipmentInfo.shipment || 'N/A'}, Container: ${shipmentInfo.containerNumber || 'N/A'}, Seal: ${shipmentInfo.sealNo || 'N/A'}, ETD: ${shipmentInfo.etd || 'N/A'}, ETA: ${shipmentInfo.eta || 'N/A'}, PO: ${shipmentInfo.poNumber || 'N/A'}`

        // For manual products, we'll create special entries
        const transactions = manualProducts.map(product => ({
          product_id: 'MANUAL', // Special ID for manual entries
          transaction_type: 'OUT',
          quantity: parseFloat(product.quantity),
          unit_price: null,
          total_amount: null,
          transaction_date: transactionDate,
          reference_number: null,
          notes: `${shipmentNotes}, Manual Entry: ${product.product_description}, Packing: ${product.packing}, Batch: ${product.batch_number}`,
          batch_number: product.batch_number,
          created_by: userProfile?.id
        }))

        const { data, error } = await supabase
          .from('inventory_transactions')
          .insert(transactions)
          .select('*')

        if (error) {
          console.error('Error adding manual transactions:', error)
          alert('Error adding manual transactions: ' + error.message)
          return
        }

        // Add manual product info to the data for display
        const enrichedData = data.map((transaction, index) => ({
          ...transaction,
          products: {
            product_name: manualProducts[index].product_description,
            packing_size: manualProducts[index].packing
          }
        }))

        setTransactions(prev => [...enrichedData, ...prev])
        setShowModal(false)
        
        const notification = document.createElement('div')
        notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-md shadow-lg z-50'
        notification.textContent = 'Manual outbound transactions added successfully!'
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
  }

  const filteredTransactions = transactions.filter(transaction => {
    if (!searchTerm) return true
    
    const searchLower = searchTerm.toLowerCase()
    return (
      transaction.product_id?.toLowerCase().includes(searchLower) ||
      transaction.products?.product_name?.toLowerCase().includes(searchLower) ||
      transaction.notes?.toLowerCase().includes(searchLower)
    )
  })

  const totalQuantity = filteredTransactions.reduce((sum, t) => sum + parseFloat(t.quantity), 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-600">Loading outbound transactions...</span>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={dateFilter.startDate}
                  onChange={(e) => setDateFilter(prev => ({ ...prev, startDate: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={dateFilter.endDate}
                  onChange={(e) => setDateFilter(prev => ({ ...prev, endDate: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 w-full sm:w-64"
              />
            </div>
          </div>

          {canCreateTransaction && (
            <div className="flex gap-2">
              <button
                onClick={handleAddTransaction}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                + Add Outbound
              </button>
              <button
                onClick={handleManualAdd}
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                + Manual Add
              </button>
            </div>
          )}
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex flex-wrap gap-6 text-sm">
            <div>
              <span className="text-gray-600">Total Transactions: </span>
              <span className="font-semibold text-red-800">{filteredTransactions.length}</span>
            </div>
            <div>
              <span className="text-gray-600">Total Quantity: </span>
              <span className="font-semibold text-red-800">{totalQuantity.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto" style={{ maxHeight: '60vh' }}>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <svg className="h-12 w-12 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} 
                          d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                      </svg>
                      <p className="text-lg font-medium">No outbound transactions</p>
                      <p className="text-sm mt-1">Start by adding your first outbound transaction</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(transaction.transaction_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {transaction.product_id}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {transaction.products?.product_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold">
                      -{parseFloat(transaction.quantity).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {transaction.notes || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Multi-Product Outbound Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-5 mx-auto p-5 border w-full max-w-6xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {modalMode === 'system' ? 'Add Outbound Transaction' : 'Manual Add Outbound Transaction'}
              </h3>
              
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

                {modalMode === 'system' ? (
                  // System Product Selection
                  <>
                    <div className="bg-gray-50 p-4 rounded-lg border">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Product Selection</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
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
                        <div className="flex items-end">
                          <select
                            onChange={(e) => e.target.value && addProductToSelection(e.target.value)}
                            value=""
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          >
                            <option value="">Add Product...</option>
                            {filteredProducts.map(product => (
                              <option key={product.product_id} value={product.product_id}>
                                {product.product_id} - {product.product_name} (Stock: {parseFloat(product.current_stock).toLocaleString()})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        Found {filteredProducts.length} products
                      </div>
                    </div>

                    {/* Selected Products Table */}
                    {selectedProducts.length > 0 && (
                      <div className="bg-white border rounded-lg overflow-hidden">
                        <div className="bg-gray-50 px-4 py-2 border-b">
                          <h5 className="text-sm font-medium text-gray-700">Selected Products</h5>
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
                                <tr key={index} className="hover:bg-gray-50">
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
                                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
                                      className={`w-20 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                                        product.quantity && !validateQuantity(product.product_id, product.quantity)
                                          ? 'border-red-import React, { useState, useEffect } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'
import { usePermissions, PERMISSIONS } from '../../context/PermissionContext'
import { supabase } from '../../supabase/client'

const OutboundTransactions = () => {
  const { t } = useLanguage()
  const { userProfile } = useAuth()
  const { hasPermission } = usePermissions()
  const [transactions, setTransactions] = useState([])
  const [availableProducts, setAvailableProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('system') // 'system' or 'manual'
  
  // Manual product entry
  const [manualProducts, setManualProducts] = useState([])
  
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
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  })

  const canCreateTransaction = hasPermission(PERMISSIONS.INVENTORY_EDIT)

  useEffect(() => {
    fetchTransactions()
    fetchAvailableProducts()
  }, [])

  useEffect(() => {
    fetchTransactions()
  }, [dateFilter])

  const fetchAvailableProducts = async () => {
    try {
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
    }
  }

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('inventory_transactions')
        .select(`
          *,
          products:product_id (
            product_name,
            country,
            vendor,
            packing_size
          )
        `)
        .eq('transaction_type', 'OUT')
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false })

      if (dateFilter.startDate) {
        query = query.gte('transaction_date', dateFilter.startDate)
      }
      if (dateFilter.endDate) {
        query = query.lte('transaction_date', dateFilter.endDate)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching transactions:', error)
        return
      }

      setTransactions(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddTransaction = () => {
    if (!canCreateTransaction) {
      alert('No permission to add transactions')
      return
    }

    setModalMode('system')
    setShipmentInfo({
      shipment: '',
      containerNumber: '',
      sealNo: '',
      etd: '',
      eta: '',
      poNumber: ''
    })
    setSelectedProducts([])
    setProductFilters({
      country: '',
      vendor: '',
      type: '',
      search: ''
    })
    setShowModal(true)
  }

  const handleManualAdd = () => {
    if (!canCreateTransaction) {
      alert('No permission to add transactions')
      return
    }

    setModalMode('manual')
    setShipmentInfo({
      shipment: '',
      containerNumber: '',
      sealNo: '',
      etd: '',
      eta: '',
      poNumber: ''
    })
    setManualProducts([])
    setShowModal(true)
  }

  const addManualProduct = () => {
    const newProduct = {
      sn: manualProducts.length + 1,
      product_description: '',
      packing: '',
      batch_number: '',
      quantity: ''
    }
    setManualProducts(prev => [...prev, newProduct])
  }

  const removeManualProduct = (index) => {
    setManualProducts(prev => {
      const updated = prev.filter((_, i) => i !== index)
      return updated.map((item, i) => ({ ...item, sn: i + 1 }))
    })
  }

  const updateManualProduct = (index, field, value) => {
    setManualProducts(prev => 
      prev.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    )
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

    // Check if product already selected
    if (selectedProducts.find(p => p.product_id === productId)) {
      alert('Product already selected')
      return
    }

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

  const validateQuantity = (productId, requestedQuantity) => {
    const product = availableProducts.find(p => p.product_id === productId)
    if (!product) return false
    
    return parseFloat(requestedQuantity) <= parseFloat(product.current_stock)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (modalMode === 'system') {
      // System product submission
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

        const { data, error } = await supabase
          .from('inventory_transactions')
          .insert(transactions)
          .select(`
            *,
            products:product_id (
              product_name,
              country,
              vendor,
              packing_size
            )
          `)

        if (error) {
          console.error('Error adding transactions:', error)
          alert('Error adding transactions: ' + error.message)
          return
        }

        setTransactions(prev => [...data, ...prev])
        setShowModal(false)
        
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
    } else {
      // Manual product submission
      if (manualProducts.length === 0) {
        alert('Please add at least one product')
        return
      }

      // Validate all manual products
      for (let product of manualProducts) {
        if (!product.product_description.trim()) {
          alert(`Please enter product description for row ${product.sn}`)
          return
        }
        if (!product.quantity || parseFloat(product.quantity) <= 0) {
          alert(`Please enter quantity for row ${product.sn}`)
          return
        }
        if (!product.batch_number.trim()) {
          alert(`Please enter batch number for row ${product.sn}`)
          return
        }
      }

      setFormLoading(true)

      try {
        const transactionDate = new Date().toISOString().split('T')[0]
        
        const shipmentNotes = `Shipment: ${shipmentInfo.shipment || 'N/A'}, Container: ${shipmentInfo.containerNumber || 'N/A'}, Seal: ${shipmentInfo.sealNo || 'N/A'}, ETD: ${shipmentInfo.etd || 'N/A'}, ETA: ${shipmentInfo.eta || 'N/A'}, PO: ${shipmentInfo.poNumber || 'N/A'}`

        // For manual products, we'll create special entries
        const transactions = manualProducts.map(product => ({
          product_id: 'MANUAL', // Special ID for manual entries
          transaction_type: 'OUT',
          quantity: parseFloat(product.quantity),
          unit_price: null,
          total_amount: null,
          transaction_date: transactionDate,
          reference_number: null,
          notes: `${shipmentNotes}, Manual Entry: ${product.product_description}, Packing: ${product.packing}, Batch: ${product.batch_number}`,
          batch_number: product.batch_number,
          created_by: userProfile?.id
        }))

        const { data, error } = await supabase
          .from('inventory_transactions')
          .insert(transactions)
          .select('*')

        if (error) {
          console.error('Error adding manual transactions:', error)
          alert('Error adding manual transactions: ' + error.message)
          return
        }

        // Add manual product info to the data for display
        const enrichedData = data.map((transaction, index) => ({
          ...transaction,
          products: {
            product_name: manualProducts[index].product_description,
            packing_size: manualProducts[index].packing
          }
        }))

        setTransactions(prev => [...enrichedData, ...prev])
        setShowModal(false)
        
        const notification = document.createElement('div')
        notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-md shadow-lg z-50'
        notification.textContent = 'Manual outbound transactions added successfully!'
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
  }

  const filteredTransactions = transactions.filter(transaction => {
    if (!searchTerm) return true
    
    const searchLower = searchTerm.toLowerCase()
    return (
      transaction.product_id?.toLowerCase().includes(searchLower) ||
      transaction.products?.product_name?.toLowerCase().includes(searchLower) ||
      transaction.notes?.toLowerCase().includes(searchLower)
    )
  })

  const totalQuantity = filteredTransactions.reduce((sum, t) => sum + parseFloat(t.quantity), 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-600">Loading outbound transactions...</span>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={dateFilter.startDate}
                  onChange={(e) => setDateFilter(prev => ({ ...prev, startDate: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={dateFilter.endDate}
                  onChange={(e) => setDateFilter(prev => ({ ...prev, endDate: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 w-full sm:w-64"
              />
            </div>
          </div>

          {canCreateTransaction && (
            <div className="flex gap-2">
              <button
                onClick={handleAddTransaction}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                + Add Outbound
              </button>
              <button
                onClick={handleManualAdd}
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                + Manual Add
              </button>
            </div>
          )}
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex flex-wrap gap-6 text-sm">
            <div>
              <span className="text-gray-600">Total Transactions: </span>
              <span className="font-semibold text-red-800">{filteredTransactions.length}</span>
            </div>
            <div>
              <span className="text-gray-600">Total Quantity: </span>
              <span className="font-semibold text-red-800">{totalQuantity.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto" style={{ maxHeight: '60vh' }}>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <svg className="h-12 w-12 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} 
                          d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                      </svg>
                      <p className="text-lg font-medium">No outbound transactions</p>
                      <p className="text-sm mt-1">Start by adding your first outbound transaction</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(transaction.transaction_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {transaction.product_id}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {transaction.products?.product_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold">
                      -{parseFloat(transaction.quantity).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {transaction.notes || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Multi-Product Outbound Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-5 mx-auto p-5 border w-full max-w-6xl shadow-lg rounded-md bg-white">
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
                        
                        <div className="bg-gray-50 px-4 py-2 border-t">
                          <div className="text-sm text-gray-600">
                            Total Products: {selectedProducts.length} | 
                            Total Quantity: {selectedProducts.reduce((sum, p) => sum + (parseFloat(p.quantity) || 0), 0).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  // Manual Product Entry
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-sm font-medium text-gray-700">Manual Product Entry</h4>
                      <button
                        type="button"
                        onClick={addManualProduct}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                      >
                        + Add Row
                      </button>
                    </div>
                    
                    {manualProducts.length > 0 ? (
                      <div className="bg-white border rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S/N</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Description</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Packing</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch No</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {manualProducts.map((product, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                    {product.sn}
                                  </td>
                                  <td className="px-3 py-2">
                                    <input
                                      type="text"
                                      value={product.product_description}
                                      onChange={(e) => updateManualProduct(index, 'product_description', e.target.value)}
                                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                      placeholder="Product description"
                                      required
                                    />
                                  </td>
                                  <td className="px-3 py-2">
                                    <input
                                      type="text"
                                      value={product.packing}
                                      onChange={(e) => updateManualProduct(index, 'packing', e.target.value)}
                                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                      placeholder="Packing"
                                    />
                                  </td>
                                  <td className="px-3 py-2">
                                    <input
                                      type="text"
                                      value={product.batch_number}
                                      onChange={(e) => updateManualProduct(index, 'batch_number', e.target.value)}
                                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                      placeholder="Batch number"
                                      required
                                    />
                                  </td>
                                  <td className="px-3 py-2">
                                    <input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={product.quantity}
                                      onChange={(e) => updateManualProduct(index, 'quantity', e.target.value)}
                                      className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                      placeholder="Qty"
                                      required
                                    />
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap">
                                    <button
                                      type="button"
                                      onClick={() => removeManualProduct(index)}
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
                        
                        <div className="bg-gray-50 px-4 py-2 border-t">
                          <div className="text-sm text-gray-600">
                            Total Products: {manualProducts.length} | 
                            Total Quantity: {manualProducts.reduce((sum, p) => sum + (parseFloat(p.quantity) || 0), 0).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6 text-gray-500">
                        <p>No products added yet. Click "Add Row" to start.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Form Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading || 
                      (modalMode === 'system' && selectedProducts.length === 0) ||
                      (modalMode === 'manual' && manualProducts.length === 0)
                    }
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                  >
                    {formLoading ? 'Processing...' : 
                      modalMode === 'system' 
                        ? `Create ${selectedProducts.length} Outbound Transaction${selectedProducts.length > 1 ? 's' : ''}`
                        : `Create ${manualProducts.length} Manual Transaction${manualProducts.length > 1 ? 's' : ''}`
                    }
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OutboundTransactions
