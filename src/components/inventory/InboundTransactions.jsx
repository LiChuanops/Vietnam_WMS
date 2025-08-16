import React, { useState, useEffect } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'
import { usePermissions, PERMISSIONS } from '../../context/PermissionContext'
import { supabase } from '../../supabase/client'

const InboundTransactions = () => {
  const { t } = useLanguage()
  const { userProfile } = useAuth()
  const { hasPermission } = usePermissions()
  const [transactions, setTransactions] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('single') // 'single' or 'bulk'
  const [bulkProducts, setBulkProducts] = useState([])
  const [formData, setFormData] = useState({
    product_id: '',
    quantity: '',
    transaction_date: new Date().toISOString().split('T')[0],
    notes: ''
  })
  const [formLoading, setFormLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [productFilters, setProductFilters] = useState({
    country: '',
    vendor: '',
    type: '',
    search: ''
  })
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  })

  const canCreateTransaction = hasPermission(PERMISSIONS.INVENTORY_EDIT)

  useEffect(() => {
    fetchTransactions()
    fetchProducts()
  }, [])

  useEffect(() => {
    fetchTransactions()
  }, [dateFilter])

  const fetchProducts = async () => {
    try {
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
        .eq('transaction_type', 'IN')
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

    setModalMode('single')
    setFormData({
      product_id: '',
      quantity: '',
      transaction_date: new Date().toISOString().split('T')[0],
      notes: ''
    })
    setProductFilters({
      country: '',
      vendor: '',
      type: '',
      search: ''
    })
    setShowModal(true)
  }

  const handleBulkAdd = () => {
    if (!canCreateTransaction) {
      alert('No permission to add transactions')
      return
    }

    setModalMode('bulk')
    setBulkProducts([])
    setProductFilters({
      country: '',
      vendor: '',
      type: '',
      search: ''
    })
    setShowModal(true)
  }

  const addProductToBulk = (productId) => {
    const product = products.find(p => p.system_code === productId)
    if (!product) return

    if (bulkProducts.find(p => p.product_id === productId)) {
      alert('Product already added')
      return
    }

    const newProduct = {
      sn: bulkProducts.length + 1,
      product_id: productId,
      product_name: product.product_name,
      packing_size: product.packing_size,
      quantity: '',
      notes: ''
    }

    setBulkProducts(prev => [...prev, newProduct])
  }

  const removeProductFromBulk = (index) => {
    setBulkProducts(prev => {
      const updated = prev.filter((_, i) => i !== index)
      return updated.map((item, i) => ({ ...item, sn: i + 1 }))
    })
  }

  const updateProductInBulk = (index, field, value) => {
    setBulkProducts(prev => 
      prev.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (modalMode === 'single') {
      // Single product submission
      if (!formData.product_id || !formData.quantity || !formData.transaction_date) {
        alert('Please fill in required fields')
        return
      }

      setFormLoading(true)

      try {
        const transactionData = {
          product_id: formData.product_id,
          transaction_type: 'IN',
          quantity: parseFloat(formData.quantity),
          unit_price: null,
          total_amount: null,
          transaction_date: formData.transaction_date,
          reference_number: null,
          notes: formData.notes.trim() || null,
          created_by: userProfile?.id
        }

        const { data, error } = await supabase
          .from('inventory_transactions')
          .insert([transactionData])
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
          console.error('Error adding transaction:', error)
          alert('Error adding transaction: ' + error.message)
          return
        }

        setTransactions(prev => [data[0], ...prev])
        setShowModal(false)
        
        const notification = document.createElement('div')
        notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg z-50'
        notification.textContent = 'Inbound transaction added successfully!'
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
      // Bulk submission
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
        const currentDate = new Date().toISOString().split('T')[0]
        
        const transactions = bulkProducts.map(product => ({
          product_id: product.product_id,
          transaction_type: 'IN',
          quantity: parseFloat(product.quantity),
          unit_price: null,
          total_amount: null,
          transaction_date: currentDate,
          reference_number: null,
          notes: product.notes.trim() || null,
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
        
        const notification = document.createElement('div')
        notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg z-50'
        notification.textContent = `${bulkProducts.length} inbound transactions added successfully!`
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

  // Get unique filter options
  const uniqueCountries = [...new Set(products.map(p => p.country).filter(Boolean))].sort()
  const uniqueVendors = productFilters.country 
    ? [...new Set(products.filter(p => p.country === productFilters.country).map(p => p.vendor).filter(Boolean))].sort()
    : [...new Set(products.map(p => p.vendor).filter(Boolean))].sort()
  const uniqueTypes = [...new Set(products.map(p => p.type).filter(Boolean))].sort()

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-600">Loading inbound transactions...</span>
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
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                + Add Single
              </button>
              <button
                onClick={handleBulkAdd}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                + Bulk Add
              </button>
            </div>
          )}
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex flex-wrap gap-6 text-sm">
            <div>
              <span className="text-gray-600">Total Transactions: </span>
              <span className="font-semibold text-green-800">{filteredTransactions.length}</span>
            </div>
            <div>
              <span className="text-gray-600">Total Quantity: </span>
              <span className="font-semibold text-green-800">{totalQuantity.toLocaleString()}</span>
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
                          d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                      <p className="text-lg font-medium">No inbound transactions</p>
                      <p className="text-sm mt-1">Start by adding your first inbound transaction</p>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                      +{parseFloat(transaction.quantity).toLocaleString()}
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

      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {modalMode === 'single' ? 'Add Single Inbound Transaction' : 'Add Bulk Inbound Transactions'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {modalMode === 'single' ? (
                  // Single Product Form
                  <div className="grid grid-cols-1 gap-4">
                    
                    <div className="bg-gray-50 p-4 rounded-lg border">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Product Filters</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        
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
                      <div className="mt-2 text-xs text-gray-500">
                        Found {filteredProducts.length} products
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Product *
                      </label>
                      <select
                        value={formData.product_id}
                        onChange={(e) => setFormData(prev => ({ ...prev, product_id: e.target.value }))}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 max-h-40 overflow-y-auto"
                        size={Math.min(filteredProducts.length + 1, 8)}
                      >
                        <option value="">Select a product</option>
                        {filteredProducts.map(product => (
                          <option key={product.system_code} value={product.system_code}>
                            {product.system_code} - {product.product_name} ({product.country} - {product.vendor})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Quantity *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.quantity}
                          onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Enter quantity"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Transaction Date *
                        </label>
                        <input
                          type="date"
                          value={formData.transaction_date}
                          onChange={(e) => setFormData(prev => ({ ...prev, transaction_date: e.target.value }))}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notes
                      </label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Additional notes..."
                      />
                    </div>
                  </div>
                ) : (
                  // Bulk Product Form
                  <div className="grid grid-cols-1 gap-4">
                    
                    {/* Product Selection */}
                    <div className="bg-gray-50 p-4 rounded-lg border">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Product Selection</h4>
                      
                      {/* Product Filters */}
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
                            className="w-full pximport React, { useState, useEffect } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'
import { usePermissions, PERMISSIONS } from '../../context/PermissionContext'
import { supabase } from '../../supabase/client'

const InboundTransactions = () => {
  const { t } = useLanguage()
  const { userProfile } = useAuth()
  const { hasPermission } = usePermissions()
  const [transactions, setTransactions] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('single') // 'single' or 'bulk'
  const [bulkProducts, setBulkProducts] = useState([])
  const [formData, setFormData] = useState({
    product_id: '',
    quantity: '',
    transaction_date: new Date().toISOString().split('T')[0],
    notes: ''
  })
  const [formLoading, setFormLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [productFilters, setProductFilters] = useState({
    country: '',
    vendor: '',
    type: '',
    search: ''
  })
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  })

  const canCreateTransaction = hasPermission(PERMISSIONS.INVENTORY_EDIT)

  useEffect(() => {
    fetchTransactions()
    fetchProducts()
  }, [])

  useEffect(() => {
    fetchTransactions()
  }, [dateFilter])

  const fetchProducts = async () => {
    try {
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
        .eq('transaction_type', 'IN')
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

    setModalMode('single')
    setFormData({
      product_id: '',
      quantity: '',
      transaction_date: new Date().toISOString().split('T')[0],
      notes: ''
    })
    setProductFilters({
      country: '',
      vendor: '',
      type: '',
      search: ''
    })
    setShowModal(true)
  }

  const handleBulkAdd = () => {
    if (!canCreateTransaction) {
      alert('No permission to add transactions')
      return
    }

    setModalMode('bulk')
    setBulkProducts([])
    setProductFilters({
      country: '',
      vendor: '',
      type: '',
      search: ''
    })
    setShowModal(true)
  }

  const addProductToBulk = (productId) => {
    const product = products.find(p => p.system_code === productId)
    if (!product) return

    if (bulkProducts.find(p => p.product_id === productId)) {
      alert('Product already added')
      return
    }

    const newProduct = {
      sn: bulkProducts.length + 1,
      product_id: productId,
      product_name: product.product_name,
      packing_size: product.packing_size,
      quantity: '',
      notes: ''
    }

    setBulkProducts(prev => [...prev, newProduct])
  }

  const removeProductFromBulk = (index) => {
    setBulkProducts(prev => {
      const updated = prev.filter((_, i) => i !== index)
      return updated.map((item, i) => ({ ...item, sn: i + 1 }))
    })
  }

  const updateProductInBulk = (index, field, value) => {
    setBulkProducts(prev => 
      prev.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (modalMode === 'single') {
      // Single product submission
      if (!formData.product_id || !formData.quantity || !formData.transaction_date) {
        alert('Please fill in required fields')
        return
      }

      setFormLoading(true)

      try {
        const transactionData = {
          product_id: formData.product_id,
          transaction_type: 'IN',
          quantity: parseFloat(formData.quantity),
          unit_price: null,
          total_amount: null,
          transaction_date: formData.transaction_date,
          reference_number: null,
          notes: formData.notes.trim() || null,
          created_by: userProfile?.id
        }

        const { data, error } = await supabase
          .from('inventory_transactions')
          .insert([transactionData])
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
          console.error('Error adding transaction:', error)
          alert('Error adding transaction: ' + error.message)
          return
        }

        setTransactions(prev => [data[0], ...prev])
        setShowModal(false)
        
        const notification = document.createElement('div')
        notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg z-50'
        notification.textContent = 'Inbound transaction added successfully!'
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
      // Bulk submission
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
        const currentDate = new Date().toISOString().split('T')[0]
        
        const transactions = bulkProducts.map(product => ({
          product_id: product.product_id,
          transaction_type: 'IN',
          quantity: parseFloat(product.quantity),
          unit_price: null,
          total_amount: null,
          transaction_date: currentDate,
          reference_number: null,
          notes: product.notes.trim() || null,
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
        
        const notification = document.createElement('div')
        notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg z-50'
        notification.textContent = `${bulkProducts.length} inbound transactions added successfully!`
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

  // Get unique filter options
  const uniqueCountries = [...new Set(products.map(p => p.country).filter(Boolean))].sort()
  const uniqueVendors = productFilters.country 
    ? [...new Set(products.filter(p => p.country === productFilters.country).map(p => p.vendor).filter(Boolean))].sort()
    : [...new Set(products.map(p => p.vendor).filter(Boolean))].sort()
  const uniqueTypes = [...new Set(products.map(p => p.type).filter(Boolean))].sort()

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-600">Loading inbound transactions...</span>
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
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                + Add Single
              </button>
              <button
                onClick={handleBulkAdd}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                + Bulk Add
              </button>
            </div>
          )}
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex flex-wrap gap-6 text-sm">
            <div>
              <span className="text-gray-600">Total Transactions: </span>
              <span className="font-semibold text-green-800">{filteredTransactions.length}</span>
            </div>
            <div>
              <span className="text-gray-600">Total Quantity: </span>
              <span className="font-semibold text-green-800">{totalQuantity.toLocaleString()}</span>
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
                          d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                      <p className="text-lg font-medium">No inbound transactions</p>
                      <p className="text-sm mt-1">Start by adding your first inbound transaction</p>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                      +{parseFloat(transaction.quantity).toLocaleString()}
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

      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
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
                            onChange={(e) => e.target.value && addProductToBulk(e.target.value)}
                            value=""
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          >
                            <option value="">Add Product...</option>
                            {filteredProducts.map(product => (
                              <option key={product.system_code} value={product.system_code}>
                                {product.system_code} - {product.product_name}
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
                    {bulkProducts.length > 0 && (
                      <div className="bg-white border rounded-lg overflow-hidden">
                        <div className="bg-gray-50 px-4 py-2 border-b">
                          <h5 className="text-sm font-medium text-gray-700">Selected Products</h5>
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
                                  <td className="px-3 py-2 whitespace-nowrap">
                                    <input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={product.quantity}
                                      onChange={(e) => updateProductInBulk(index, 'quantity', e.target.value)}
                                      className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                      placeholder="Qty"
                                      required
                                    />
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap">
                                    <input
                                      type="text"
                                      value={product.notes}
                                      onChange={(e) => updateProductInBulk(index, 'notes', e.target.value)}
                                      className="w-32 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
                        
                        {/* Summary */}
                        <div className="bg-gray-50 px-4 py-2 border-t">
                          <div className="text-sm text-gray-600">
                            Total Products: {bulkProducts.length} | 
                            Total Quantity: {bulkProducts.reduce((sum, p) => sum + (parseFloat(p.quantity) || 0), 0).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

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
                    disabled={formLoading || (modalMode === 'bulk' && bulkProducts.length === 0)}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    {formLoading 
                      ? 'Processing...' 
                      : modalMode === 'single' 
                        ? 'Add Transaction' 
                        : `Add ${bulkProducts.length} Transactions`
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

export default InboundTransactions
