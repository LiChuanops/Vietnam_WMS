import React, { useState, useEffect } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { supabase } from '../../supabase/client'

const InventoryReports = () => {
  const { t } = useLanguage()
  const [reportType, setReportType] = useState('current_stock')
  const [loading, setLoading] = useState(false)
  const [reportData, setReportData] = useState([])
  const [shipmentData, setShipmentData] = useState([])
  const [showShipmentModal, setShowShipmentModal] = useState(false)
  const [selectedShipment, setSelectedShipment] = useState(null)
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  })

  const reportTypes = [
    { id: 'current_stock', name: 'Current Stock Report', description: 'All products with current inventory levels' },
    { id: 'transactions_summary', name: 'Transactions Summary', description: 'Summary of all transactions by date range' },
    { id: 'monthly_summary', name: 'Monthly Summary', description: 'Monthly breakdown of inventory movements' },
    { id: 'low_stock', name: 'Low Stock Alert', description: 'Products with low inventory levels' },
    { id: 'shipment_details', name: 'Shipment Details', description: 'Outbound shipment records with export options' }
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

  const generateShipmentDetails = async () => {
    try {
      if (!dateRange.startDate || !dateRange.endDate) {
        alert('Please select date range for shipment details')
        return
      }

      const { data, error } = await supabase
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
        .gte('transaction_date', dateRange.startDate)
        .lte('transaction_date', dateRange.endDate)
        .not('notes', 'is', null)
        .order('transaction_date', { ascending: false })

      if (error) {
        console.error('Error fetching shipment details:', error)
        return
      }

      // Group by shipment info (extracted from notes)
      const shipmentGroups = {}
      data.forEach(transaction => {
        const notes = transaction.notes || ''
        // Extract shipment info from notes
        const shipmentMatch = notes.match(/Shipment:\s*([^,]+)/)
        const containerMatch = notes.match(/Container:\s*([^,]+)/)
        const sealMatch = notes.match(/Seal:\s*([^,]+)/)
        const etdMatch = notes.match(/ETD:\s*([^,]+)/)
        const etaMatch = notes.match(/ETA:\s*([^,]+)/)
        const poMatch = notes.match(/PO:\s*([^,]+)/)
        const batchMatch = notes.match(/Batch:\s*([^,]+)/)

        const shipmentKey = shipmentMatch ? shipmentMatch[1].trim() : 'Unknown Shipment'
        
        if (!shipmentGroups[shipmentKey]) {
          shipmentGroups[shipmentKey] = {
            shipment: shipmentKey,
            container: containerMatch ? containerMatch[1].trim() : '',
            seal: sealMatch ? sealMatch[1].trim() : '',
            etd: etdMatch ? etdMatch[1].trim() : '',
            eta: etaMatch ? etaMatch[1].trim() : '',
            po: poMatch ? poMatch[1].trim() : '',
            transactions: [],
            totalQuantity: 0
          }
        }
        
        shipmentGroups[shipmentKey].transactions.push({
          ...transaction,
          batch: batchMatch ? batchMatch[1].trim() : ''
        })
        shipmentGroups[shipmentKey].totalQuantity += parseFloat(transaction.quantity)
      })

      setReportData(Object.values(shipmentGroups))
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
        case 'shipment_details':
          await generateShipmentDetails()
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

    if (reportType === 'shipment_details') {
      return (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shipment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Container</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ETD</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ETA</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PO Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Products</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Qty</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.map((shipment, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => viewShipmentDetails(shipment)}
                        className="text-indigo-600 hover:text-indigo-900 font-medium"
                      >
                        {shipment.shipment}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {shipment.container}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {shipment.etd}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {shipment.eta}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {shipment.po}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {shipment.transactions.length}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">
                      {shipment.totalQuantity.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => exportShipmentToExcel(shipment)}
                          className="text-green-600 hover:text-green-900 text-sm"
                          title="Export to Excel"
                        >
                          📊 Excel
                        </button>
                        <button
                          onClick={() => printShipmentPDF(shipment)}
                          className="text-blue-600 hover:text-blue-900 text-sm"
                          title="Print PDF"
                        >
                          🖨️ Print
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
            {(reportType === 'transactions_summary' || reportType === 'shipment_details') && (
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

      {/* Shipment Details Modal */}
      {showShipmentModal && selectedShipment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-6xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Shipment Details - {selectedShipment.shipment}
                </h3>
                <button
                  onClick={() => setShowShipmentModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Shipment Information */}
              <div className="bg-blue-50 p-4 rounded-lg border mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Shipment Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <span className="text-xs text-gray-600">Shipment:</span>
                    <div className="font-medium">{selectedShipment.shipment}</div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-600">Container Number:</span>
                    <div className="font-medium">{selectedShipment.container}</div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-600">Seal No:</span>
                    <div className="font-medium">{selectedShipment.seal}</div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-600">ETD:</span>
                    <div className="font-medium">{selectedShipment.etd}</div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-600">ETA:</span>
                    <div className="font-medium">{selectedShipment.eta}</div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-600">PO Number:</span>
                    <div className="font-medium">{selectedShipment.po}</div>
                  </div>
                </div>
              </div>

              {/* Products Table */}
              <div className="bg-white border rounded-lg overflow-hidden mb-4">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S/N</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Description</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Packing</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch No</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedShipment.transactions.map((transaction, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                import React, { useState, useEffect } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { supabase } from '../../supabase/client'

const InventoryReports = () => {
  const { t } = useLanguage()
  const [reportType, setReportType] = useState('current_stock')
  const [loading, setLoading] = useState(false)
  const [reportData, setReportData] = useState([])
  const [shipmentData, setShipmentData] = useState([])
  const [showShipmentModal, setShowShipmentModal] = useState(false)
  const [selectedShipment, setSelectedShipment] = useState(null)
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  })

  const reportTypes = [
    { id: 'current_stock', name: 'Current Stock Report', description: 'All products with current inventory levels' },
    { id: 'transactions_summary', name: 'Transactions Summary', description: 'Summary of all transactions by date range' },
    { id: 'monthly_summary', name: 'Monthly Summary', description: 'Monthly breakdown of inventory movements' },
    { id: 'low_stock', name: 'Low Stock Alert', description: 'Products with low inventory levels' },
    { id: 'shipment_details', name: 'Shipment Details', description: 'Outbound shipment records with export options' }
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

  const generateShipmentDetails = async () => {
    try {
      if (!dateRange.startDate || !dateRange.endDate) {
        alert('Please select date range for shipment details')
        return
      }

      const { data, error } = await supabase
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
        .gte('transaction_date', dateRange.startDate)
        .lte('transaction_date', dateRange.endDate)
        .not('notes', 'is', null)
        .order('transaction_date', { ascending: false })

      if (error) {
        console.error('Error fetching shipment details:', error)
        return
      }

      // Group by shipment info (extracted from notes)
      const shipmentGroups = {}
      data.forEach(transaction => {
        const notes = transaction.notes || ''
        // Extract shipment info from notes
        const shipmentMatch = notes.match(/Shipment:\s*([^,]+)/)
        const containerMatch = notes.match(/Container:\s*([^,]+)/)
        const sealMatch = notes.match(/Seal:\s*([^,]+)/)
        const etdMatch = notes.match(/ETD:\s*([^,]+)/)
        const etaMatch = notes.match(/ETA:\s*([^,]+)/)
        const poMatch = notes.match(/PO:\s*([^,]+)/)
        const batchMatch = notes.match(/Batch:\s*([^,]+)/)

        const shipmentKey = shipmentMatch ? shipmentMatch[1].trim() : 'Unknown Shipment'
        
        if (!shipmentGroups[shipmentKey]) {
          shipmentGroups[shipmentKey] = {
            shipment: shipmentKey,
            container: containerMatch ? containerMatch[1].trim() : '',
            seal: sealMatch ? sealMatch[1].trim() : '',
            etd: etdMatch ? etdMatch[1].trim() : '',
            eta: etaMatch ? etaMatch[1].trim() : '',
            po: poMatch ? poMatch[1].trim() : '',
            transactions: [],
            totalQuantity: 0
          }
        }
        
        shipmentGroups[shipmentKey].transactions.push({
          ...transaction,
          batch: batchMatch ? batchMatch[1].trim() : ''
        })
        shipmentGroups[shipmentKey].totalQuantity += parseFloat(transaction.quantity)
      })

      setReportData(Object.values(shipmentGroups))
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
        case 'shipment_details':
          await generateShipmentDetails()
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

    if (reportType === 'shipment_details') {
      return (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shipment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Container</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ETD</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ETA</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PO Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Products</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Qty</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.map((shipment, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => viewShipmentDetails(shipment)}
                        className="text-indigo-600 hover:text-indigo-900 font-medium"
                      >
                        {shipment.shipment}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {shipment.container}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {shipment.etd}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {shipment.eta}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {shipment.po}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {shipment.transactions.length}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">
                      {shipment.totalQuantity.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => exportShipmentToExcel(shipment)}
                          className="text-green-600 hover:text-green-900 text-sm"
                          title="Export to Excel"
                        >
                          📊 Excel
                        </button>
                        <button
                          onClick={() => printShipmentPDF(shipment)}
                          className="text-blue-600 hover:text-blue-900 text-sm"
                          title="Print PDF"
                        >
                          🖨️ Print
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
            {(reportType === 'transactions_summary' || reportType === 'shipment_details') && (
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
                            {index + 1}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                            {transaction.product_id}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900">
                            {transaction.products?.product_name || ''}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                            {transaction.products?.packing_size || ''}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                            {transaction.batch || ''}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-red-600 font-semibold">
                            {parseFloat(transaction.quantity).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50">
                        <td colSpan="5" className="px-3 py-2 text-sm font-medium text-gray-900 text-right">
                          Total Quantity:
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm font-bold text-red-600">
                          {selectedShipment.totalQuantity.toLocaleString()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => exportShipmentToExcel(selectedShipment)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  📊 Save Excel
                </button>
                <button
                  onClick={() => printShipmentPDF(selectedShipment)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  🖨️ Print PDF
                </button>
                <button
                  onClick={() => setShowShipmentModal(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default InventoryReports
