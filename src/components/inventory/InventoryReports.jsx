import React, { useState, useEffect } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../supabase/client'
import CustomDeclarationDetail from './reports/CustomDeclarationDetail'

const InventoryReports = () => {
  const { t } = useLanguage()
  const { userProfile } = useAuth()
  const [customDeclarations, setCustomDeclarations] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDeclaration, setSelectedDeclaration] = useState(null)
  const [showDetail, setShowDetail] = useState(false)

  useEffect(() => {
    fetchCustomDeclarations()
  }, [])

  const fetchCustomDeclarations = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('custom_declarations')
        .select(`
          *,
          profiles:created_by (
            name
          )
        `)
        .order('declaration_date', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching custom declarations:', error)
        return
      }

      setCustomDeclarations(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewDeclaration = (declaration) => {
    setSelectedDeclaration(declaration)
    setShowDetail(true)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-600">Loading reports...</span>
      </div>
    )
  }

  if (showDetail && selectedDeclaration) {
    return (
      <CustomDeclarationDetail
        declaration={selectedDeclaration}
        onBack={() => {
          setShowDetail(false)
          setSelectedDeclaration(null)
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>
          <p className="text-gray-600 mt-1">Custom Declaration Forms and other reports</p>
        </div>
        <button
          onClick={fetchCustomDeclarations}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          Refresh
        </button>
      </div>

      {/* Custom Declarations List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Custom Declaration Forms</h2>
          <p className="text-sm text-gray-600 mt-1">
            Click on any declaration to view details
          </p>
        </div>

        {customDeclarations.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto h-16 w-16 text-gray-400 mb-4">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} 
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Custom Declarations Found</h3>
            <p className="text-gray-500">Create your first custom declaration form to see it here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PO Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Net Weight (kg)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gross Weight (kg)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {customDeclarations.map((declaration) => (
                  <tr 
                    key={declaration.id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleViewDeclaration(declaration)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-indigo-600">
                        {declaration.po_number}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(declaration.declaration_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {declaration.total_quantity?.toLocaleString() || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {declaration.net_weight?.toFixed(2) || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {declaration.gross_weight?.toFixed(2) || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {declaration.profiles?.name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(declaration.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleViewDeclaration(declaration)
                        }}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default InventoryReports
