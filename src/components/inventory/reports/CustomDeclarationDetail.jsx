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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 print:gap-2">
            <div>
              <h3 className="text-xs font-medium text-gray-500 print:text-[10px]">PO Number</h3>
              <p className="text-sm font-semibold text-gray-900 print:text-xs">{declaration.po_number}</p>
            </div>
            <div>
              <h3 className="text-xs font-medium text-gray-500 print:text-[10px]">Declaration Date</h3>
              <p className="text-sm font-semibold text-gray-900 print:text-xs">{formatDate(declaration.declaration_date)}</p>
            </div>
            <div>
              <h3 className="text-xs font-medium text-gray-500 print:text-[10px]">Total Quantity</h3>
              <p className="text-sm font-semibold text-gray-900 print:text-xs">{declaration.total_quantity?.toLocaleString() || '-'}</p>
            </div>
            <div>
              <h3 className="text-xs font-medium text-gray-500 print:text-[10px]">Created At</h3>
              <p className="text-sm font-semibold text-gray-900 print:text-xs">{formatDate(declaration.created_at)}</p>
            </div>
          </div>

          {/* Weight Summary */}
          <div className="mt-4 pt-4 border-t border-gray-200 print:mt-2 print:pt-2">
            <h3 className="text-sm font-medium text-gray-900 mb-3 print:text-xs print:mb-2">Weight Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:gap-2">
              <div className="text-center p-3 bg-green-50 rounded-lg print:p-1 print:bg-gray-50">
                <div className="text-lg font-bold text-green-900 print:text-xs print:text-black">{declaration.net_weight?.toFixed(2) || '0.00'}</div>
                <div className="text-xs text-gray-600 print:text-[8px]">Net Weight (kg)</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg print:p-1 print:bg-gray-50">
                <div className="text-lg font-bold text-orange-900 print:text-xs print:text-black">{declaration.carton_weight?.toFixed(2) || '0.00'}</div>
                <div className="text-xs text-gray-600 print:text-[8px]">Carton Weight (kg)</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg print:p-1 print:bg-gray-50">
                <div className="text-lg font-bold text-purple-900 print:text-xs print:text-black">{declaration.gross_weight?.toFixed(2) || '0.00'}</div>
                <div className="text-xs text-gray-600 print:text-[8px]">Gross Weight (kg)</div>
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
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:px-1 print:py-1 print:text-[8px]">S/N</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:px-1 print:py-1 print:text-[8px]">Code</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:px-1 print:py-1 print:text-[8px]">Customer Code</th>
                  {/* 🔥 新增 Account Code 列 */}
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:px-1 print:py-1 print:text-[8px]">Account Code</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:px-1 print:py-1 print:text-[8px]">Product Name</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:px-1 print:py-1 print:text-[8px]">Packing</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:px-1 print:py-1 print:text-[8px]">Batch No</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:px-1 print:py-1 print:text-[8px]">Quantity</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:px-1 print:py-1 print:text-[8px]">UOM</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:px-1 print:py-1 print:text-[8px]">Total Weight</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {declarationItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 print:hover:bg-white">
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 print:px-1 print:py-1 print:text-[8px]">
                      {item.serial_number}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900 print:px-1 print:py-1 print:text-[8px]">
                      {item.product_id}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 print:px-1 print:py-1 print:text-[8px]">
                      {item.customer_code || '-'}
                    </td>
                    {/* 🔥 新增 Account Code 数据列 */}
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 print:px-1 print:py-1 print:text-[8px]">
                      {item.account_code || '-'}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-900 print:px-1 print:py-1 print:text-[8px]">
                      {item.product_name}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 print:px-1 print:py-1 print:text-[8px]">
                      {item.packing_size || '-'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 print:px-1 print:py-1 print:text-[8px]">
                      {item.batch_number}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 print:px-1 print:py-1 print:text-[8px]">
                      {item.quantity}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 print:px-1 print:py-1 print:text-[8px]">
                      {item.uom || '-'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 print:px-1 print:py-1 print:text-[8px]">
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
          
          .print\\:text-xs {
            font-size: 0.75rem !important;
          }
          
          .print\\:text-\\[10px\\] {
            font-size: 10px !important;
          }
          
          .print\\:text-\\[8px\\] {
            font-size: 8px !important;
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
          
          .print\\:gap-2 {
            gap: 0.5rem !important;
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
          
          .print\\:bg-gray-50 {
            background-color: #f9fafb !important;
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
