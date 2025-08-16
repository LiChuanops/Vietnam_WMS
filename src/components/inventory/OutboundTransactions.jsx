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
  const [formData, setFormData] = useState({
    product_id: '',
    quantity: '',
    unit_price: '',
    transaction_date: new Date().toISOString().split('T')[0],
    reference_number: '',
    notes: ''
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

    setFormData({
      product_id: '',
      quantity: '',
      unit_price: '',
      transaction_date: new Date().toISOString().split('T')[0],
      reference_number: '',
      notes: ''
    })
    setShowModal(true)
  }

  const validateQuantity = (productId, requestedQuantity) => {
    const product = availableProducts.find(p => p.product_id === productId)
    if (!product) return false
    
    return parseFloat(requestedQuantity) <= parseFloat(product.current_stock)
  }

  const getAvailableStock = (productId) => {
    const product = availableProducts.find(p => p.product_id === productId)
    return product ? parseFloat(product.current_stock) : 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.product_id || !formData.quantity || !formData.transaction_date) {
      alert('Please fill in required fields')
      return
    }

    if (!validateQuantity(formData.product_id, formData.quantity)) {
      const availableStock = getAvailableStock(formData.product_id)
      alert(`Insufficient stock! Available: ${availableStock}, Requested: ${formData.quantity}`)
      return
    }

    setFormLoading(true)

    try {
      const transactionData = {
        product_id: formData.product_id,
        transaction_type: 'OUT',
        quantity: parseFloat(formData.quantity),
        unit_price: formData.unit_price ? parseFloat(formData.unit_price) : null,
        total_amount: formData.unit_price && formData.quantity 
          ? parseFloat(formData.unit_price) * parseFloat(formData.quantity) 
          : null,
        transaction_date: formData.transaction_date,
        reference_number: formData.reference_number.trim() || null,
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
      
      await fetchAvailableProducts()
      
      const notification = document.createElement('div')
      notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-md shadow-lg z-50'
      notification.textContent = 'Outbound transaction added successfully!'
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

  const filteredTransactions = transactions.filter(transaction => {
    if (!searchTerm) return true
    
    const searchLower = searchTerm.toLowerCase()
    return (
      transaction.product_id?.toLowerCase().includes(searchLower) ||
      transaction.products?.product_name?.toLowerCase().includes(searchLower) ||
      transaction.reference_number?.toLowerCase().includes(searchLower) ||
      transaction.notes?.toLowerCase().includes(searchLower)
    )
  })

  const totalQuantity = filteredTransactions.reduce((sum, t) => sum + parseFloat(t.quantity), 0)
  const totalAmount = filteredTransactions.reduce((sum, t) => sum + (parseFloat(t.total_amount) || 0), 0)

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
            <button
              onClick={handleAddTransaction}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              + Add Outbound
            </button>
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
            <div>
              <span className="text-gray-600">Total Amount: </span>
              <span className="font-semibold text-red-800">
                {totalAmount > 0 ? `$${totalAmount.toLocaleString()}` : '-'}
              </span>
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
                  Unit Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reference
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.unit_price ? `$${parseFloat(transaction.unit_price).toFixed(2)}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {transaction.total_amount ? `$${parseFloat(transaction.total_amount).toLocaleString()}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.reference_number || '-'}
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
          <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Add Outbound Transaction
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product *
                    </label>
                    <select
                      value={formData.product_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, product_id: e.target.value }))}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Select a product</option>
                      {availableProducts.map(product => (
                        <option key={product.product_id} value={product.product_id}>
                          {product.product_id} - {product.product_name} (Stock: {parseFloat(product.current_stock).toLocaleString()})
                        </option>
                      ))}
                    </select>
                  </div>

                  {formData.product_id && (
                    <div className="md:col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="text-sm text-blue-800">
                        <strong>Available Stock: {getAvailableStock(formData.product_id).toLocaleString()}</strong>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max={formData.product_id ? getAvailableStock(formData.product_id) : undefined}
                      value={formData.quantity}
                      onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter quantity"
                    />
                    {formData.product_id && formData.quantity && !validateQuantity(formData.product_id, formData.quantity) && (
                      <p className="text-red-500 text-xs mt-1">
                        Quantity exceeds available stock ({getAvailableStock(formData.product_id).toLocaleString()})
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit Price
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.unit_price}
                      onChange={(e) => setFormData(prev => ({ ...prev, unit_price: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter unit price"
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reference Number
                    </label>
                    <input
                      type="text"
                      value={formData.reference_number}
                      onChange={(e) => setFormData(prev => ({ ...prev, reference_number: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g., SO-001"
                    />
                  </div>

                  <div className="md:col-span-2">
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

                  {formData.quantity && formData.unit_price && (
                    <div className="md:col-span-2 bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="text-sm text-red-800">
                        <strong>Total Amount: ${(parseFloat(formData.quantity) * parseFloat(formData.unit_price)).toFixed(2)}</strong>
                      </div>
                    </div>
                  )}
                </div>

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
                    disabled={formLoading || (formData.product_id && formData.quantity && !validateQuantity(formData.product_id, formData.quantity))}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                  >
                    {formLoading ? 'Adding...' : 'Add Transaction'}
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
