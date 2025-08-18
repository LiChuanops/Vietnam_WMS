import React, { useState, useEffect } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { supabase } from '../../supabase/client'

const InventorySummary = () => {
  const { t } = useLanguage()
  const [inventoryData, setInventoryData] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7))

  useEffect(() => {
    fetchInventorySummary()
  }, [currentMonth])

  const fetchInventorySummary = async () => {
    try {
      setLoading(true)
      
      const startDate = `${currentMonth}-01`
      const endDate = new Date(currentMonth + '-01')
      endDate.setMonth(endDate.getMonth() + 1)
      endDate.setDate(0)
      const endDateStr = endDate.toISOString().split('T')[0]

      // Get all products that have transactions in the selected month
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('inventory_transactions')
        .select(`
          product_id, 
          transaction_date, 
          transaction_type, 
          quantity,
          products:product_id (
            product_name,
            viet_name,
            country,
            vendor,
            packing_size,
            uom
          )
        `)
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDateStr)
        .order('transaction_date')

      if (transactionsError) {
        console.error('Error fetching transactions:', transactionsError)
        return
      }

      // Get unique products from transactions
      const uniqueProducts = {}
      const transactionsByProduct = {}

      transactionsData.forEach(transaction => {
        const { product_id, transaction_date, transaction_type, quantity, products } = transaction
        
        // Store unique product info
        if (!uniqueProducts[product_id] && products) {
          uniqueProducts[product_id] = {
            product_id,
            product_name: products.product_name,
            viet_name: products.viet_name,
            country: products.country,
            vendor: products.vendor,
            packing_size: products.packing_size,
            uom: products.uom
          }
        }
        
        // Group transactions by product and date
        if (!transactionsByProduct[product_id]) {
          transactionsByProduct[product_id] = {}
        }
        
        if (!transactionsByProduct[product_id][transaction_date]) {
          transactionsByProduct[product_id][transaction_date] = { in: 0, out: 0 }
        }
        
        if (transaction_type === 'IN' || transaction_type === 'OPENING') {
          transactionsByProduct[product_id][transaction_date].in += parseFloat(quantity)
        } else if (transaction_type === 'OUT') {
          transactionsByProduct[product_id][transaction_date].out += parseFloat(quantity)
        }
      })

      // Now get current stock for these products
      const productIds = Object.keys(uniqueProducts)
      if (productIds.length > 0) {
        const { data: inventoryData, error: inventoryError } = await supabase
          .from('current_inventory')
          .select('product_id, current_stock')
          .in('product_id', productIds)

        if (inventoryError) {
          console.error('Error fetching current inventory:', inventoryError)
          return
        }

        // Create stock lookup
        const stockLookup = {}
        inventoryData.forEach(item => {
          stockLookup[item.product_id] = item.current_stock
        })

        // Combine product info with transactions and current stock
        const enrichedData = Object.values(uniqueProducts).map(product => ({
          ...product,
          current_stock: stockLookup[product.product_id] || 0,
          dailyTransactions: transactionsByProduct[product.product_id] || {}
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

  const exportToCSV = () => {
    if (inventoryData.length === 0) return

    const headers = [
      t('productCode'),
      t('productName'), 
      t('country'),
      t('vendor'),
      t('packingSize'),
      t('uom'),
      t('currentStock'),
      ...monthDays.map(date => {
        const day = date.split('-')[2]
        return `${day} In`
      }),
      ...monthDays.map(date => {
        const day = date.split('-')[2]
        return `${day} Out`
      })
    ]

    const rows = inventoryData.map(item => {
      const row = [
        item.product_id,
        item.product_name,
        item.country || '',
        item.vendor || '',
        item.packing_size || '',
        item.uom || '',
        item.current_stock
      ]

      monthDays.forEach(date => {
        const dayData = item.dailyTransactions[date]
        row.push(dayData?.in || '')
      })

      monthDays.forEach(date => {
        const dayData = item.dailyTransactions[date]
        row.push(dayData?.out || '')
      })

      return row
    })

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

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
        <span className="ml-3 text-gray-600">{t('loadingInventorySummary')}</span>
      </div>
    )
  }

  // 计算表格总宽度
  const totalWidth = 620 + (monthDays.length * 100)

  return (
    <div className="h-full flex flex-col">
      {/* Header Section - 保持原有布局 */}
      <div className="mb-6 space-y-4 flex-shrink-0">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('month')}
              </label>
              <input
                type="month"
                value={currentMonth}
                onChange={(e) => setCurrentMonth(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <button
            onClick={exportToCSV}
            disabled={inventoryData.length === 0}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            📊 {t('exportToCSV')}
          </button>
        </div>

        <div className="text-sm text-gray-600">
          {t('showing')} {inventoryData.length} {t('showingProducts')}
        </div>
      </div>

      {/* 🔥 关键：表格容器 - 保持在正常布局中但确保滚动 */}
      <div className="flex-1 bg-white shadow rounded-lg overflow-hidden">
        <div 
          style={{
            width: '100%',
            height: '100%',
            overflowX: 'scroll', // 强制水平滚动
            overflowY: 'auto',
            backgroundColor: '#ffffff'
          }}
        >
          {/* 🔥 关键：强制内容宽度 */}
          <div style={{ 
            width: `${Math.max(totalWidth, 1500)}px`, // 确保至少1500px宽
            minHeight: '100%'
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              tableLayout: 'fixed'
            }}>
              <thead style={{ 
                backgroundColor: '#f9fafb',
                position: 'sticky',
                top: 0,
                zIndex: 10
              }}>
                <tr>
                  {/* 固定列 */}
                  <th style={{ 
                    width: '120px',
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    borderRight: '1px solid #d1d5db',
                    position: 'sticky',
                    left: 0,
                    backgroundColor: '#f9fafb',
                    zIndex: 20
                  }}>
                    {t('productCode')}
                  </th>
                  <th style={{ 
                    width: '200px',
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    borderRight: '1px solid #d1d5db',
                    position: 'sticky',
                    left: '120px',
                    backgroundColor: '#f9fafb',
                    zIndex: 20
                  }}>
                    {t('productName')}
                  </th>
                  <th style={{ 
                    width: '100px',
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    borderRight: '1px solid #d1d5db',
                    position: 'sticky',
                    left: '320px',
                    backgroundColor: '#f9fafb',
                    zIndex: 20
                  }}>
                    {t('country')}
                  </th>
                  <th style={{ 
                    width: '100px',
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    borderRight: '1px solid #d1d5db',
                    position: 'sticky',
                    left: '420px',
                    backgroundColor: '#f9fafb',
                    zIndex: 20
                  }}>
                    {t('vendor')}
                  </th>
                  <th style={{ 
                    width: '100px',
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    borderRight: '1px solid #d1d5db',
                    position: 'sticky',
                    left: '520px',
                    backgroundColor: '#f9fafb',
                    zIndex: 20
                  }}>
                    {t('packing')}
                  </th>
                  <th style={{ 
                    width: '120px',
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    borderRight: '1px solid #d1d5db',
                    backgroundColor: '#dbeafe',
                    position: 'sticky',
                    left: '620px',
                    zIndex: 20
                  }}>
                    {t('currentStock')}
                  </th>
                  
                  {/* 滚动的日期列 */}
                  {monthDays.map(date => {
                    const day = date.split('-')[2]
                    return (
                      <th key={date} style={{ 
                        width: '100px',
                        padding: '12px 8px',
                        textAlign: 'center',
                        fontSize: '12px',
                        fontWeight: '500',
                        color: '#6b7280',
                        textTransform: 'uppercase',
                        borderLeft: '1px solid #e5e7eb'
                      }}>
                        <div style={{ marginBottom: '4px' }}>{day}</div>
                        <div style={{ display: 'flex' }}>
                          <div style={{ width: '50%', color: '#059669', fontSize: '10px' }}>In</div>
                          <div style={{ width: '50%', color: '#dc2626', fontSize: '10px' }}>Out</div>
                        </div>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody style={{ backgroundColor: 'white' }}>
                {inventoryData.length === 0 ? (
                  <tr>
                    <td colSpan={6 + monthDays.length} className="px-6 py-8 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <svg className="h-12 w-12 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} 
                            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8l-4 4-4-4" />
                        </svg>
                        <p className="text-lg font-medium">{t('noInventoryData')}</p>
                        <p className="text-sm mt-1">{t('tryAdjustingFiltersInventory')}</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  inventoryData.map((item, index) => (
                    <tr key={item.product_id} style={{ 
                      borderBottom: '1px solid #e5e7eb'
                    }}>
                      {/* 固定列 */}
                      <td style={{ 
                        width: '120px',
                        padding: '16px',
                        whiteSpace: 'nowrap',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#111827',
                        borderRight: '1px solid #e5e7eb',
                        position: 'sticky',
                        left: 0,
                        backgroundColor: 'white',
                        zIndex: 10
                      }}>
                        {item.product_id}
                      </td>
                      <td style={{ 
                        width: '200px',
                        padding: '16px',
                        fontSize: '14px',
                        color: '#111827',
                        borderRight: '1px solid #e5e7eb',
                        position: 'sticky',
                        left: '120px',
                        backgroundColor: 'white',
                        zIndex: 10
                      }}>
                        <div style={{ 
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }} title={item.product_name}>
                          {item.product_name}
                        </div>
                      </td>
                      <td style={{ 
                        width: '100px',
                        padding: '16px',
                        whiteSpace: 'nowrap',
                        fontSize: '14px',
                        color: '#111827',
                        borderRight: '1px solid #e5e7eb',
                        position: 'sticky',
                        left: '320px',
                        backgroundColor: 'white',
                        zIndex: 10
                      }}>
                        {item.country}
                      </td>
                      <td style={{ 
                        width: '100px',
                        padding: '16px',
                        fontSize: '14px',
                        color: '#111827',
                        borderRight: '1px solid #e5e7eb',
                        position: 'sticky',
                        left: '420px',
                        backgroundColor: 'white',
                        zIndex: 10
                      }}>
                        <div style={{ 
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }} title={item.vendor}>
                          {item.vendor}
                        </div>
                      </td>
                      <td style={{ 
                        width: '100px',
                        padding: '16px',
                        whiteSpace: 'nowrap',
                        fontSize: '14px',
                        color: '#111827',
                        borderRight: '1px solid #e5e7eb',
                        position: 'sticky',
                        left: '520px',
                        backgroundColor: 'white',
                        zIndex: 10
                      }}>
                        {item.packing_size}
                      </td>
                      <td style={{ 
                        width: '120px',
                        padding: '16px',
                        whiteSpace: 'nowrap',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#1e40af',
                        backgroundColor: '#dbeafe',
                        borderRight: '1px solid #e5e7eb',
                        position: 'sticky',
                        left: '620px',
                        zIndex: 10
                      }}>
                        {parseFloat(item.current_stock).toLocaleString()}
                      </td>
                      
                      {/* 滚动的日期列 */}
                      {monthDays.map(date => {
                        const dayData = item.dailyTransactions[date]
                        return (
                          <td key={date} style={{ 
                            width: '100px',
                            padding: '16px 8px',
                            whiteSpace: 'nowrap',
                            fontSize: '12px',
                            textAlign: 'center',
                            borderLeft: '1px solid #e5e7eb'
                          }}>
                            <div style={{ display: 'flex' }}>
                              <div style={{ 
                                width: '50%',
                                color: '#059669',
                                fontWeight: '500'
                              }}>
                                {dayData?.in ? parseFloat(dayData.in).toLocaleString() : ''}
                              </div>
                              <div style={{ 
                                width: '50%',
                                color: '#dc2626',
                                fontWeight: '500'
                              }}>
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
    </div>
  )
}

export default InventorySummary
