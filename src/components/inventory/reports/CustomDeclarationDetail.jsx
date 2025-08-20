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
      {/* Header */}
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

      {/* Declaration Info Card */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500">PO Number</h3>
            <p className="text-lg font-semibold text-gray-900">{declaration.po_number}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Declaration Date</h3>
            <p className="text-lg font-semibold text-gray-900">{formatDate(declaration.declaration_date)}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Total Quantity</h3>
            <p className="text-lg font-semibold text-gray-900">{declaration.total_quantity?.toLocaleString() || '-'}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Created At</h3>
            <p className="text-lg font-semibold text-gray-900">{formatDate(declaration.created_at)}</p>
          </div>
        </div>

        {/* Weight Summary */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Weight Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-900">{declaration.net_weight?.toFixed(2) || '0.00'}</div>
              <div className="text-sm text-gray-600">Net Weight (kg)</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-900">{declaration.carton_weight?.toFixed(2) || '0.00'}</div>
              <div className="text-sm text-gray-600">Carton Weight (kg)</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-900">{declaration.gross_weight?.toFixed(2) || '0.00'}</div>
              <div className="text-sm text-gray-600">Gross Weight (kg)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Product Details</h2>
          <p className="text-sm text-gray-600 mt-1">
            {declarationItems.length} products in this declaration
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S/N</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer Code</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Packing</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch No</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">UOM</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Weight</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {declarationItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.serial_number}
                    {item.is_manual && <span className="ml-1 text-xs text-yellow-600">*</span>}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.product_id}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.customer_code || '-'}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900">
                    {item.product_name}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.packing_size || '-'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.batch_number}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.quantity}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.uom || '-'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.total_weight ? item.total_weight.toFixed(2) : '-'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {item.is_manual && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Manual
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Note */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            * Manual entries are products added manually to the declaration form
          </p>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          .print\\:hidden {
            display: none !important;
          }
          
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          
          .bg-green-50, .bg-orange-50, .bg-purple-50 {
            background-color: #f9f9f9 !important;
          }
          
          .shadow {
            box-shadow: none !important;
          }
          
          .rounded-lg {
            border: 1px solid #e5e7eb !important;
          }
        }
      `}</style>
    </div>
  )
}

export default CustomDeclarationDetail
