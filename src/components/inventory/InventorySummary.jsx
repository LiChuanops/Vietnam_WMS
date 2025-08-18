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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '16rem' }}>
        <div style={{ 
          width: '3rem', 
          height: '3rem', 
          border: '2px solid #e5e7eb', 
          borderTop: '2px solid #4f46e5',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <span style={{ marginLeft: '0.75rem', color: '#6b7280' }}>{t('loadingInventorySummary')}</span>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header Controls */}
      <div style={{ marginBottom: '1.5rem', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
              {t('month')}
            </label>
            <input
              type="month"
              value={currentMonth}
              onChange={(e) => setCurrentMonth(e.target.value)}
              style={{ 
                padding: '0.5rem 0.75rem', 
                border: '1px solid #d1d5db', 
                borderRadius: '0.375rem',
                fontSize: '0.875rem'
              }}
            />
          </div>
          <button
            onClick={exportToCSV}
            disabled={inventoryData.length === 0}
            style={{ 
              backgroundColor: inventoryData.length === 0 ? '#9ca3af' : '#059669',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              border: 'none',
              cursor: inventoryData.length === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            📊 {t('exportToCSV')}
          </button>
        </div>
        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
          {t('showing')} {inventoryData.length} {t('showingProducts')}
        </div>
      </div>

      {/* Table Container */}
      <div style={{ 
        flex: 1, 
        backgroundColor: 'white', 
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', 
        borderRadius: '0.5rem',
        overflow: 'hidden'
      }}>
        <div style={{ 
          overflow: 'auto', 
          height: '100%',
          width: '100%'
        }}>
          <table style={{ 
            width: '100%',
            borderCollapse: 'collapse',
            tableLayout: 'auto'
          }}>
            <thead style={{ 
              backgroundColor: '#f9fafb',
              position: 'sticky',
              top: 0,
              zIndex: 1
            }}>
              <tr>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb' }}>
                  {t('productCode')}
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb' }}>
                  {t('productName')}
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb' }}>
                  {t('country')}
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb' }}>
                  {t('vendor')}
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb' }}>
                  {t('packing')}
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb', backgroundColor: '#dbeafe' }}>
                  {t('currentStock')}
                </th>
                
                {monthDays.map(date => {
                  const day = date.split('-')[2]
                  return (
                    <th key={date} style={{ 
                      padding: '0.5rem', 
                      textAlign: 'center', 
                      fontSize: '0.75rem', 
                      fontWeight: '500', 
                      color: '#6b7280', 
                      textTransform: 'uppercase',
                      borderLeft: '1px solid #e5e7eb',
                      borderBottom: '1px solid #e5e7eb',
                      minWidth: '60px'
                    }}>
                      <div>{day}</div>
                      <div style={{ display: 'flex' }}>
                        <div style={{ width: '50%', color: '#059669' }}>In</div>
                        <div style={{ width: '50%', color: '#dc2626' }}>Out</div>
                      </div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {inventoryData.length === 0 ? (
                <tr>
                  <td colSpan={6 + monthDays.length} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <svg style={{ height: '3rem', width: '3rem', color: '#d1d5db', marginBottom: '1rem' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} 
                          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8l-4 4-4-4" />
                      </svg>
                      <p style={{ fontSize: '1.125rem', fontWeight: '500' }}>{t('noInventoryData')}</p>
                      <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>{t('tryAdjustingFiltersInventory')}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                inventoryData.map((item) => (
                  <tr key={item.product_id} style={{ 
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    <td style={{ padding: '1rem 0.75rem', fontSize: '0.875rem', fontWeight: '500', color: '#111827' }}>
                      {item.product_id}
                    </td>
                    <td style={{ padding: '1rem 0.75rem', fontSize: '0.875rem', color: '#111827' }}>
                      {item.product_name}
                    </td>
                    <td style={{ padding: '1rem 0.75rem', fontSize: '0.875rem', color: '#111827' }}>
                      {item.country}
                    </td>
                    <td style={{ padding: '1rem 0.75rem', fontSize: '0.875rem', color: '#111827' }}>
                      {item.vendor}
                    </td>
                    <td style={{ padding: '1rem 0.75rem', fontSize: '0.875rem', color: '#111827' }}>
                      {item.packing_size || '-'}
                    </td>
                    <td style={{ padding: '1rem 0.75rem', fontSize: '0.875rem', fontWeight: '600', color: '#1e40af', backgroundColor: '#dbeafe' }}>
                      {parseFloat(item.current_stock).toLocaleString()}
                    </td>
                    
                    {monthDays.map(date => {
                      const dayData = item.dailyTransactions[date]
                      return (
                        <td key={date} style={{ 
                          padding: '1rem 0.5rem', 
                          fontSize: '0.75rem', 
                          textAlign: 'center',
                          borderLeft: '1px solid #e5e7eb'
                        }}>
                          <div style={{ display: 'flex' }}>
                            <div style={{ width: '50%', color: '#059669', fontWeight: '500' }}>
                              {dayData?.in ? parseFloat(dayData.in).toLocaleString() : ''}
                            </div>
                            <div style={{ width: '50%', color: '#dc2626', fontWeight: '500' }}>
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
