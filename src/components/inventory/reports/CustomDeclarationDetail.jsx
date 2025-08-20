import React, { useState, useEffect } from 'react'
import { useLanguage } from '../../../context/LanguageContext'
import { supabase } from '../../../supabase/client'

const CustomDeclarationDetail = ({ declaration, onBack }) => {
  const { t } = useLanguage()
  const [declarationItems, setDeclarationItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDeclarationItems()
  }, [declaration.id])

  const fetchDeclarationItems = async () => {
    try {
      setLoading(true)
      
      // 直接从 custom_declaration_items 表获取所有数据（包括已保存的 account_code）
      const { data, error } = await supabase
        .from('custom_declaration_items')
        .select('*')
        .eq('declaration_id', declaration.id)
        .order('serial_number')

      if (error) {
        console.error('Error fetching declaration items:', error)
        return
      }

      setDeclarationItems(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-600">Loading declaration details...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header - Hide on Print */}
      <div className="flex justify-between items-center print:hidden">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Reports
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Custom Declaration Form</h1>
            <p className="text-gray-600">PO: {declaration.po_number}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Print
          </button>
        </div>
      </div>

      {/* Print-only Content */}
      <div className="print-content">
        {/* Declaration Info Card */}
        <div className="bg-white shadow rounded-lg p-6 print:shadow-none print:border print:border-gray-300">
          {/* Header Information - 横向排列 */}
          <div className="print:flex print:justify-between print:items-center print:mb-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 print:gap-8">
            <div className="print:flex print:items-center">
              <span className="text-xs font-medium text-gray-500 print:text-[10px] print:mr-2">PO Number:</span>
              <span className="text-sm font-semibold text-gray-900 print:text-xs">{declaration.po_number}</span>
            </div>
            <div className="print:flex print:items-center">
              <span className="text-xs font-medium text-gray-500 print:text-[10px] print:mr-2">Declaration Date:</span>
              <span className="text-sm font-semibold text-gray-900 print:text-xs">{formatDate(declaration.declaration_date)}</span>
            </div>
            <div className="print:flex print:items-center">
              <span className="text-xs font-medium text-gray-500 print:text-[10px] print:mr-2">Total Quantity:</span>
              <span className="text-sm font-semibold text-gray-900 print:text-xs">{declaration.total_quantity?.toLocaleString() || '-'}</span>
            </div>
            <div className="print:flex print:items-center">
              <span className="text-xs font-medium text-gray-500 print:text-[10px] print:mr-2">Created At:</span>
              <span className="text-sm font-semibold text-gray-900 print:text-xs">{formatDate(declaration.created_at)}</span>
            </div>
          </div>

          {/* Weight Summary - 横向排列 */}
          <div className="mt-4 pt-4 border-t border-gray-200 print:mt-2 print:pt-2">
            <h3 className="text-sm font-medium text-gray-900 mb-3 print:text-xs print:mb-2">Weight Summary</h3>
            <div className="print:flex print:justify-between print:items-center grid grid-cols-1 md:grid-cols-3 gap-4 print:gap-8">
              <div className="text-center p-3 bg-green-50 rounded-lg print:p-1 print:bg-white print:text-left print:flex print:items-center">
                <span className="text-lg font-bold text-green-900 print:text-xs print:text-black print:mr-2">{declaration.net_weight?.toFixed(2) || '0.00'}</span>
                <span className="text-xs text-gray-600 print:text-[8px]">Net Weight (kg)</span>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg print:p-1 print:bg-white print:text-left print:flex print:items-center">
                <span className="text-lg font-bold text-orange-900 print:text-xs print:text-black print:mr-2">{declaration.carton_weight?.toFixed(2) || '0.00'}</span>
                <span className="text-xs text-gray-600 print:text-[8px]">Carton Weight (kg)</span>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg print:p-1 print:bg-white print:text-left print:flex print:items-center">
                <span className="text-lg font-bold text-purple-900 print:text-xs print:text-black print:mr-2">{declaration.gross_weight?.toFixed(2) || '0.00'}</span>
                <span className="text-xs text-gray-600 print:text-[8px]">Gross Weight (kg)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden print:shadow-none print:border print:border-gray-300">
          <div className="px-6 py-4 border-b border-gray-200 print:px-2 print:py-1">
            <h2 className="text-sm font-medium text-gray-900 print:text-xs">Product Details</h2>
            <p className="text-xs text-gray-600 mt-1 print:text-[8px]">
              {declarationItems.length} products in this declaration
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:px-1 print:py-1 print:text-xs">S/N</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:px-1 print:py-1 print:text-xs print:hidden">Code</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:px-1 print:py-1 print:text-xs print:hidden">Customer Code</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:px-1 print:py-1 print:text-xs print:hidden">Account Code</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:px-1 print:py-1 print:text-xs">Product Name</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:px-1 print:py-1 print:text-xs">Packing</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:px-1 print:py-1 print:text-xs print:hidden">Batch No</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:px-1 print:py-1 print:text-xs">Quantity</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:px-1 print:py-1 print:text-xs">UOM</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:px-1 print:py-1 print:text-xs">Total Weight</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {declarationItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 print:hover:bg-white">
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 print:px-1 print:py-1 print:text-sm">
                      {item.serial_number}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900 print:px-1 print:py-1 print:text-sm print:hidden">
                      {item.product_id}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 print:px-1 print:py-1 print:text-sm print:hidden">
                      {item.customer_code || '-'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 print:px-1 print:py-1 print:text-sm print:hidden">
                      {item.account_code || '-'}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-900 print:px-1 print:py-1 print:text-sm">
                      {item.product_name}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 print:px-1 print:py-1 print:text-sm">
                      {item.packing_size || '-'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 print:px-1 print:py-1 print:text-sm print:hidden">
                      {item.batch_number}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 print:px-1 print:py-1 print:text-sm">
                      {item.quantity}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 print:px-1 print:py-1 print:text-sm">
                      {item.uom || '-'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 print:px-1 print:py-1 print:text-sm">
                      {item.total_weight ? item.total_weight.toFixed(2) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          /* 移除浏览器默认的页眉页脚 */
          @page {
            margin: 0.5in;
            size: A4;
          }
          
          /* 隐藏浏览器默认的页眉页脚信息 */
          html, body {
            margin: 0 !important;
            padding: 0 !important;
          }
          
          body * {
            visibility: hidden;
          }
          
          .print-content, .print-content * {
            visibility: visible;
          }
          
          .print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          
          .print\\:flex {
            display: flex !important;
          }
          
          .print\\:justify-between {
            justify-content: space-between !important;
          }
          
          .print\\:items-center {
            align-items: center !important;
          }
          
          .print\\:mb-4 {
            margin-bottom: 1rem !important;
          }
          
          .print\\:gap-8 {
            gap: 2rem !important;
          }
          
          .print\\:mr-2 {
            margin-right: 0.5rem !important;
          }
          
          .print\\:text-left {
            text-align: left !important;
          }
          
          .print\\:text-xs {
            font-size: 0.75rem !important;
          }
          
          .print\\:text-sm {
            font-size: 0.875rem !important;
          }
          
          .print\\:px-1 {
            padding-left: 0.25rem !important;
            padding-right: 0.25rem !important;
          }
          
          .print\\:py-1 {
            padding-top: 0.25rem !important;
            padding-bottom: 0.25rem !important;
          }
          
          .print\\:p-1 {
            padding: 0.25rem !important;
          }
          
          .print\\:mt-2 {
            margin-top: 0.5rem !important;
          }
          
          .print\\:pt-2 {
            padding-top: 0.5rem !important;
          }
          
          .print\\:mb-2 {
            margin-bottom: 0.5rem !important;
          }
          
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          
          .print\\:border {
            border: 1px solid #d1d5db !important;
          }
          
          .print\\:border-gray-300 {
            border-color: #d1d5db !important;
          }
          
          .print\\:bg-white {
            background-color: white !important;
          }
          
          .print\\:text-black {
            color: black !important;
          }
          
          .print\\:hover\\:bg-white:hover {
            background-color: white !important;
          }
          
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  )
}

export default CustomDeclarationDetail
