import React, { useState } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { supabase } from '../../supabase/client'

const InventoryReports = () => {
  const { t } = useLanguage()
  const [reportType, setReportType] = useState('current_stock')
  const [loading, setLoading] = useState(false)
  const [reportData, setReportData] = useState([])
  const [showShipmentModal, setShowShipmentModal] = useState(false)
  const [selectedShipment, setSelectedShipment] = useState(null)
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' })

  const reportTypes = [
    { id: 'current_stock', name: 'Current Stock Report', description: 'All products with current inventory levels' },
    { id: 'transactions_summary', name: 'Transactions Summary', description: 'Summary of all transactions by date range' },
    { id: 'monthly_summary', name: 'Monthly Summary', description: 'Monthly breakdown of inventory movements' },
    { id: 'low_stock', name: 'Low Stock Alert', description: 'Products with low inventory levels' },
    { id: 'shipment_details', name: 'Shipment Details', description: 'Outbound shipment records with export options' }
  ]

  // ==============================
  // Report Generators
  // ==============================

  const generateCurrentStockReport = async () => {
    const { data, error } = await supabase.from('current_inventory').select('*').order('product_id')
    if (error) console.error('Error fetching current stock:', error)
    setReportData(data || [])
  }

  const generateTransactionsSummary = async () => {
    if (!dateRange.startDate || !dateRange.endDate) {
      alert('Please select date range for transactions summary')
      return
    }
    const { data, error } = await supabase
      .from('inventory_transactions_export')
      .select('*')
      .gte('"Transaction Date"', dateRange.startDate)
      .lte('"Transaction Date"', dateRange.endDate)
    if (error) console.error('Error fetching transactions:', error)
    setReportData(data || [])
  }

  const generateMonthlySummary = async () => {
    const { data, error } = await supabase
      .from('monthly_inventory_report')
      .select('*')
      .order('"Product Code"')
      .order('"Month"')
    if (error) console.error('Error fetching monthly summary:', error)
    setReportData(data || [])
  }

  const generateShipmentDetails = async () => {
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

    // Group by shipment info
    const shipmentGroups = {}
    data.forEach(transaction => {
      const notes = transaction.notes || ''
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
  }

  const generateReport = async () => {
    setLoading(true)
    setReportData([])
    try {
      switch (reportType) {
        case 'current_stock': await generateCurrentStockReport(); break
        case 'transactions_summary': await generateTransactionsSummary(); break
        case 'monthly_summary': await generateMonthlySummary(); break
        case 'low_stock': /* TODO: add low stock report */ break
        case 'shipment_details': await generateShipmentDetails(); break
        default: break
      }
    } catch (error) {
      console.error('Error generating report:', error)
    } finally {
      setLoading(false)
    }
  }

  // ==============================
  // Helpers
  // ==============================

  const exportToCSV = () => {
    if (reportData.length === 0) {
      alert('No data to export')
      return
    }
    const headers = Object.keys(reportData[0])
    const csvContent = [
      headers.join(','),
      ...reportData.map(row =>
        headers.map(header => `"${String(row[header] || '').replace(/"/g, '""')}"`).join(',')
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const viewShipmentDetails = (shipment) => {
    setSelectedShipment(shipment)
    setShowShipmentModal(true)
  }

  // ==============================
  // Render
  // ==============================

  return (
    <div>
      {/* Controls */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end justify-between">
          <div className="flex flex-col sm:flex-row gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="px-3 py-2 border rounded-md shadow-sm focus:ring-indigo-500 w-64"
              >
                {reportTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {reportTypes.find(type => type.id === reportType)?.description}
              </p>
            </div>

            {(reportType === 'transactions_summary' || reportType === 'shipment_details') && (
              <div className="flex gap-2">
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  className="px-3 py-2 border rounded-md"
                />
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  className="px-3 py-2 border rounded-md"
                />
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={generateReport}
              disabled={loading}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md"
            >
              {loading ? 'Generating...' : '📊 Generate Report'}
            </button>
            {reportData.length > 0 && (
              <button onClick={exportToCSV} className="bg-green-600 text-white px-4 py-2 rounded-md">
                📁 Export CSV
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Report Table */}
      {/* 你可以把之前的 renderReportTable() 贴到这里 */}
      
      {/* Shipment Modal */}
      {showShipmentModal && selectedShipment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-5xl shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">
                Shipment Details - {selectedShipment.shipment}
              </h3>
              <button onClick={() => setShowShipmentModal(false)} className="text-gray-400 hover:text-gray-600">
                ✖
              </button>
            </div>
            {/* Products Table */}
            <table className="min-w-full border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-3 py-2">S/N</th>
                  <th className="px-3 py-2">Code</th>
                  <th className="px-3 py-2">Product Description</th>
                  <th className="px-3 py-2">Packing</th>
                  <th className="px-3 py-2">Batch</th>
                  <th className="px-3 py-2">Quantity</th>
                </tr>
              </thead>
              <tbody>
                {selectedShipment.transactions.map((tr, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-3 py-2">{i + 1}</td>
                    <td className="px-3 py-2">{tr.product_id}</td>
                    <td className="px-3 py-2">{tr.products?.product_name}</td>
                    <td className="px-3 py-2">{tr.products?.packing_size}</td>
                    <td className="px-3 py-2">{tr.batch}</td>
                    <td className="px-3 py-2">{tr.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default InventoryReports
