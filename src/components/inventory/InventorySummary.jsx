import React, { useState, useEffect } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { supabase } from '../../supabase/client'

const InventorySummary = () => {
  const { t } = useLanguage()
  const [inventoryData, setInventoryData] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7)) // YYYY-MM format
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    country: '',
    vendor: ''
  })

  useEffect(() => {
    fetchInventorySummary()
  }, [currentMonth])

  const fetchInventorySummary = async () => {
    try {
      setLoading(true)
      
      // Get current inventory with stock > 0
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('current_inventory')
        .select('*')
        .gt('current_stock', 0)
        .order('product_id')

      if (inventoryError) {
        console.error('Error fetching inventory:', inventoryError)
        return
      }

      // Get monthly transactions for each product
      const startDate = `${currentMonth}-01`
      const endDate = new Date(currentMonth + '-01')
      endDate.setMonth(endDate.getMonth() + 1)
      endDate.setDate(0) // Last day of the month
      const endDateStr = endDate.toISOString().split('T')[0]

      const productIds = inventoryData.map(item => item.product_id)
      
      if (productIds.length > 0) {
        const { data: transactionsData, error: transactionsError } = await supabase
          .from('inventory_transactions')
          .select('product_id, transaction_date, transaction_type, quantity, reference_number')
          .in('product_id', productIds)
          .gte('transaction_date', startDate)
          .lte('transaction_date', endDateStr)
          .order('transaction_date')

        if (transactionsError) {
          console.error('Error fetching transactions:', transactionsError)
          return
        }

        // Group transactions by product and date
        const transactionsByProduct = transactionsData.reduce((acc, transaction) => {
          const { product_id, transaction_date, transaction_type, quantity } = transaction
          
          if (!acc[product_id]) {
            acc[product_id] = {}
          }
          
          if (!acc[product_id][transaction_date]) {
            acc[product_id][transaction_date] = { in: 0, out: 0 }
          }
          
          if (transaction_type === 'IN' || transaction_type === 'OPENING') {
            acc[product_id][transaction_date].in += parseFloat(quantity)
          } else if (transaction_type === 'OUT') {
            acc[product_id][transaction_date].out += parseFloat(quantity)
          }
          
          return acc
        }, {})

        // Combine inventory data with transaction data
        const enrichedData = inventoryData.map(item => ({
          ...item,
          dailyTransactions: transactionsByProduct[item.product_id] || {}
        }))

        setInventoryData(enrichedData)
      } else {
        setInventoryData([])
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Generate days of the month
  const generateMonthDays = () => {
    const year = parseInt(currentMonth.split('-')[0])
    const month = parseInt(currentMonth.split('-')[1])
    const daysInMonth = new Date(year, month, 0).getDate()
    
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1
      return `${currentMonth}-${day.toString().padStart(2, '0')}`
    })
  }

  const monthDays = generateMonthDays()

  // Filter data
  const uniqueCountries = [...new Set(inventoryData.map(item => item.country).filter(Boolean))]
  const filteredVendors = filters.country 
    ? [...new Set(inventoryData
        .filter(item => item.country === filters.country)
        .map(item => item.vendor)
        .filter(Boolean)
      )]
    : [...new Set(inventoryData.map(item => item.vendor).filter(Boolean))]

  const filteredData = inventoryData.filter(item => {
    const matchesSearch = !searchTerm || 
      item.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product_id?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilters = (
      (!filters.country || item.country === filters.country) &&
      (!filters.vendor || item.vendor === filters.vendor)
    )
    
    return matchesSearch && matchesFilters
  })

  const exportToCSV = () => {
    if (filteredData.length === 0) return

    // Create CSV headers
    const headers = [
      'Product Code',
      'Product Name', 
      'Country',
      'Vendor',
      'Packing Size',
      'UOM',
      'Current Stock',
      ...monthDays.map(date => {
        const day = date.split('-')[2]
        return `${day} In`
      }),
      ...monthDays.map(date => {
        const day = date.split('-')[2]
        return `${day} Out`
      })
    ]

    // Create CSV rows
    const rows = filteredData.map(item => {
      const row = [
        item.product_id,
        item.product_name,
        item.country || '',
        item.vendor || '',
        item.packing_size || '',
        item.uom || '',
        item.current_stock
      ]

      // Add daily IN transactions
      monthDays.forEach(date => {
        const dayData = item.dailyTransactions[date]
        row.push(dayData?.in || '')
      })

      // Add daily OUT transactions
      monthDays.forEach(date => {
        const dayData = item.dailyTransactions[date]
        row.push(dayData?.out || '')
      })

      return row
    })

    // Convert to CSV string
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `inventory_summary_${currentMonth}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-600">Loading inventory summary...</span>
      </div>
    )
  }

  return (
    <div>
      {/* Controls */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Month Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Month
              </label>
              <input
                type="month"
                value={currentMonth}
                onChange={(e) => setCurrentMonth(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 w-full sm:w-64"
              />
            </div>
          </div>

          {/* Export Button */}
          <button
            onClick={exportToCSV}
            disabled={filteredData.length === 0}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            📊 Export to CSV
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <select
            value={filters.country}
            onChange={(e) => setFilters(prev => ({ ...prev, country: e.target.value, vendor: '' }))}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Countries</option>
            {uniqueCountries.map(country => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>

          <select
            value={filters.vendor}
            onChange={(e) => setFilters(prev => ({ ...prev, vendor: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            disabled={filteredVendors.length === 0}
          >
            <option value="">All Vendors</option>
            {filteredVendors.map(vendor => (
              <option key={vendor} value={vendor}>{vendor}</option>
            ))}
          </select>
        </div>

        <div className="text-sm text-gray-600">
          Showing {filteredData.length} products with stock
        </div>
      </div>

      {/* Summary Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto" style={{ maxHeight: '70vh' }}>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                {/* Fixed columns */}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-20 border-r border-gray-200">
                  Product Code
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-32 bg-gray-50 z-20 border-r border-gray-200" style={{ left: '128px', minWidth: '200px' }}>
                  Product Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Country
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendor
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Packing
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50 border-l border-blue-200">
                  Stock
                </th>
                
                {/* Daily columns */}
                {monthDays.map(date => {
                  const day = date.split('-')[2]
                  return (
                    <th key={date} className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-l border-gray-200">
                      <div>{day}</div>
                      <div className="flex">
                        <div className="w-1/2 text-green-600">In</div>
                        <div className="w-1/2 text-red-600">Out</div>
                      </div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={6 + monthDays.length} className="px-6 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <svg className="h-12 w-12 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} 
                          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8l-4 4-4-4" />
                      </svg>
                      <p className="text-lg font-medium">No inventory data</p>
                      <p className="text-sm mt-1">No products have current stock or try adjusting your filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item.product_id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white z-10 border-r border-gray-200">
                      {item.product_id}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 sticky left-32 bg-white z-10 border-r border-gray-200" style={{ left: '128px', minWidth: '200px' }}>
                      {item.product_name}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.country}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.vendor}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.packing_size}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-blue-900 bg-blue-50 border-l border-blue-200">
                      {parseFloat(item.current_stock).toLocaleString()}
                    </td>
                    
                    {/* Daily transaction columns */}
                    {monthDays.map(date => {
                      const dayData = item.dailyTransactions[date]
                      return (
                        <td key={date} className="px-2 py-4 whitespace-nowrap text-xs text-center border-l border-gray-200">
                          <div className="flex">
                            <div className="w-1/2 text-green-600 font-medium">
                              {dayData?.in ? parseFloat(dayData.in).toLocaleString() : ''}
                            </div>
                            <div className="w-1/2 text-red-600 font-medium">
                              {dayData?.out ? parseFloat(dayData.out).toLocaleString() : ''}
                            </div>
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default InventorySummary
