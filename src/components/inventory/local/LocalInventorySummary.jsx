import React, { useState, useEffect } from 'react'
import { useLanguage } from '../../../context/LanguageContext'
import { supabase } from '../../../supabase/client'

const LocalInventorySummary = () => {
  const { t } = useLanguage()
  const [inventoryData, setInventoryData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInventorySummary()
  }, [])

  const fetchInventorySummary = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('local_current_stock')
        .select('*')
        .order('product_name')

      if (error) {
        console.error('Error fetching local inventory summary:', error)
        return
      }

      setInventoryData(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-600">{t('loadingInventorySummary')}</span>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6 space-y-4 flex-shrink-0">
        <h2 className="text-2xl font-semibold">{t('localInventorySummary')}</h2>
        <div className="text-sm text-gray-600">
          {t('showing')} {inventoryData.length} {t('productsWithStock')}
        </div>
      </div>

      <div className="flex-1 bg-white shadow rounded-lg overflow-auto">
        <table className="min-w-full border-separate border-spacing-0">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                {t('productCode')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                {t('productName')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                {t('country')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                {t('vendor')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                {t('packingSize')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                {t('currentStock')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {inventoryData.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                  <p className="text-lg font-medium">{t('noInventoryData')}</p>
                </td>
              </tr>
            ) : (
              inventoryData.map((item) => (
                <tr key={item.product_id} className="group hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-b border-gray-200">
                    {item.product_id}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900 border-b border-gray-200">
                    {item.product_name}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 border-b border-gray-200">
                    {item.country}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 border-b border-gray-200">
                    {item.vendor}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 border-b border-gray-200">
                    {item.packing_size}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-blue-900 border-b border-gray-200">
                    {parseFloat(item.current_stock).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default LocalInventorySummary
