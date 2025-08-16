import React, { useState, useEffect } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { supabase } from '../../supabase/client'

const InventoryReports = () => {
  const { t } = useLanguage()
  const [reportType, setReportType] = useState('current_stock')
  const [loading, setLoading] = useState(false)
  const [reportData, setReportData] = useState([])
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  })

  const reportTypes = [
    { id: 'current_stock', name: 'Current Stock Report', description: 'All products with current inventory levels' },
    { id: 'transactions_summary', name: 'Transactions Summary', description: 'Summary of all transactions by date range' },
    { id: 'monthly_summary', name: 'Monthly Summary', description: 'Monthly breakdown of inventory movements' },
    { id: 'low_stock', name: 'Low Stock Alert', description: 'Products with low inventory levels' }
  ]

  const generateCurrentStockReport = async () => {
    try {
      const { data, error } = await supabase
        .from('current_inventory')
        .select('*')
        .order('product_id')

      if (error) {
        console.error('Error fetching current stock:', error)
        return
      }

      setReportData(data || [])
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const generateTransactionsSummary = async () => {
    try {
      if (!dateRange.startDate || !dateRange.endDate) {
        alert('Please select date range for transactions summary')
        return
      }

      const { data, error } = await supabase
        .from('inventory_transactions_export')
        .select('*')
        .gte('"Transaction Date"', dateRange.startDate)
        .lte('"Transaction Date"', dateRange.endDate)

      if (error) {
        console.error('Error fetching transactions:', error)
        return
      }

      setReportData(data || [])
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const generateMonthlySummary = async () => {
    try {
      const { data, error } = await supabase
        .from('monthly_inventory_report')
        .select('*')
        .order('"Product Code"')
        .order('"Month"')

      if (error) {
        console.error('Error fetching monthly summary:', error)
        return
      }

      setReportData(data || [])
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const generateLowStockReport = async () => {
    try {
      // Define low stock threshold (you can make this configurable)
      const lowStockThreshold = 100

      const { data, error } = await supabase
        .from('current_inventory')
        .select('*')
        .lte('current_stock', lowStockThreshold)
        .gt('current_stock', 0)
        .order('current_stock')

      if (error) {
        console.error('Error fetching low stock:', error)
        return
      }

      setReportData(data || [])
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const generateReport = async () => {
    setLoading(true)
    setReportData([])

    try {
      switch (reportType) {
        case 'current_stock':
          await generateCurrentStockReport()
          break
        case 'transactions_summary':
          await generateTransactionsSummary()
          break
        case 'monthly_summary':
          await generateMonthlySummary()
          break
        case 'low_stock':
          await generateLowStockReport()
          break
        default:
          break
      }
    } catch (error) {
      console.error('Error generating report:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = () => {
    if (reportData.length === 0) {
      alert('No data to export')
      return
    }

    // Get column headers
    const headers = Object.keys(reportData[0])
    
    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...reportData.map(row => 
        headers.map(header => {
          const value = row[header]
          // Wrap in quotes and escape any quotes
          return `"${String(value || '').replace(/"/g, '""')}"`
        }).join(',')
      )
    ].join('\n')

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const renderReportTable = () => {
    if (reportData.length === 0) {
      return (
        <div className="text-center py-12">
          <svg className="h-12 w-12 text-gray-300 mb-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} 
              d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-lg font-medium text-gray-900">No Data Available</p>
          <p className="text-sm text-gray-500 mt-1">Generate a report to see data here</p>
        </div>
      )
    }

    const headers = Object.keys(reportData[0])

    return (
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto" style={{ maxHeight: '60vh' }}>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                {headers.map(header => (
                  <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {header.replace(/['"]/g, '').replace(/_/g, ' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  {headers.map(header => (
                    <td key={header} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {typeof row[header] === 'number' && header.toLowerCase().includes('stock') 
                        ? parseFloat(row[header]).toLocaleString()
                        : row[header] || '-'
                      }
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Report Controls */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end justify-between">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Report Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Report Type
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 w-64"
              >
                {reportTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {reportTypes.find(type => type.id === reportType)?.description}
              </p>
            </div>

            {/* Date Range (for transaction reports) */}
            {reportType === 'transactions_summary' && (
              <div className="flex gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={generateReport}
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {loading ? 'Generating...' : '📊 Generate Report'}
            </button>
            
            {reportData.length > 0 && (
              <button
                onClick={exportToCSV}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                📁 Export CSV
              </button>
            )}
          </div>
        </div>

        {/* Report Summary */}
        {reportData.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex flex-wrap gap-6 text-sm">
              <div>
                <span className="text-gray-600">Total Records: </span>
                <span className="font-semibold text-blue-800">{reportData.length.toLocaleString()}</span>
              </div>
              
              {reportType === 'current_stock' && (
                <>
                  <div>
                    <span className="text-gray-600">Total Products: </span>
                    <span className="font-semibold text-blue-800">{reportData.length}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Stock Value: </span>
                    <span className="font-semibold text-blue-800">
                      {reportData.reduce((sum, item) => sum + parseFloat(item.current_stock || 0), 0).toLocaleString()} units
                    </span>
                  </div>
                </>
              )}
              
              {reportType === 'low_stock' && (
                <div>
                  <span className="text-gray-600">Low Stock Products: </span>
                  <span className="font-semibold text-red-800">{reportData.length} items need attention</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Report Table */}
      {renderReportTable()}

      {/* Report Info */}
      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">Report Information</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <p><strong>Current Stock Report:</strong> Shows all products with their current inventory levels calculated from all transactions.</p>
          <p><strong>Transactions Summary:</strong> Detailed list of all inbound and outbound transactions within the selected date range.</p>
          <p><strong>Monthly Summary:</strong> Aggregated view of inventory movements grouped by month and product.</p>
          <p><strong>Low Stock Alert:</strong> Products with stock levels below 100 units that may need replenishment.</p>
        </div>
      </div>
    </div>
  )
}

export default InventoryReports
