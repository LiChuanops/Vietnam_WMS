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

  // 调试信息
  const totalWidth = 620 + (monthDays.length * 100)
  console.log('Table total width:', totalWidth, 'Days:', monthDays.length)

  return (
    // 🔥 完全脱离父容器布局系统
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      padding: '24px',
      backgroundColor: '#f9fafb',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header Section */}
      <div style={{
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: '16px',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '4px'
          }}>
            {t('month')}
          </label>
          <input
            type="month"
            value={currentMonth}
            onChange={(e) => setCurrentMonth(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />
        </div>

        <button
          onClick={exportToCSV}
          disabled={inventoryData.length === 0}
          style={{
            backgroundColor: inventoryData.length === 0 ? '#9ca3af' : '#059669',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            border: 'none',
            cursor: inventoryData.length === 0 ? 'not-allowed' : 'pointer'
          }}
        >
          📊 {t('exportToCSV')}
        </button>
      </div>

      {/* 调试信息 */}
      <div style={{
        backgroundColor: '#fef3c7',
        border: '1px solid #f59e0b',
        borderRadius: '6px',
        padding: '12px',
        marginBottom: '16px',
        fontSize: '12px',
        color: '#92400e'
      }}>
        <strong>调试信息:</strong> 表格总宽度: {totalWidth}px | 天数: {monthDays.length} | 
        屏幕宽度: {window.innerWidth}px | 
        {totalWidth > window.innerWidth ? '✅ 应该显示滚动条' : '❌ 可能不会显示滚动条'}
      </div>

      <div style={{
        backgroundColor: 'white',
        padding: '12px',
        marginBottom: '16px',
        borderRadius: '6px',
        fontSize: '14px',
        color: '#6b7280'
      }}>
        {t('showing')} {inventoryData.length} {t('showingProducts')}
      </div>

      {/* 🔥 CRITICAL: 强制滚动的容器 */}
      <div style={{
        flex: 1,
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        border: '3px solid #ef4444', // 红色边框便于调试
        overflow: 'hidden'
      }}>
        <div 
          id="scroll-container"
          style={{
            width: '100%',
            height: '100%',
            overflowX: 'scroll',
            overflowY: 'auto',
            border: '2px solid #3b82f6', // 蓝色边框便于调试
            backgroundColor: '#fef9e7'
          }}
          onScroll={(e) => {
            console.log('Scroll event:', e.target.scrollLeft, '/', e.target.scrollWidth - e.target.clientWidth)
          }}
        >
          {/* 🔥 CRITICAL: 强制超宽内容 */}
          <div style={{
            width: `${Math.max(totalWidth, window.innerWidth + 500)}px`, // 强制比屏幕宽
            minHeight: '400px',
            backgroundColor: '#f0f9ff',
            border: '2px solid #10b981' // 绿色边框便于调试
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              tableLayout: 'fixed'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  <th style={{ 
                    width: '120px', 
                    padding: '12px', 
                    border: '1px solid #e5e7eb',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    {t('productCode')}
                  </th>
                  <th style={{ 
                    width: '200px', 
                    padding: '12px', 
                    border: '1px solid #e5e7eb',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    {t('productName')}
                  </th>
                  <th style={{ 
                    width: '100px', 
                    padding: '12px', 
                    border: '1px solid #e5e7eb',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    {t('country')}
                  </th>
                  <th style={{ 
                    width: '100px', 
                    padding: '12px', 
                    border: '1px solid #e5e7eb',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    {t('vendor')}
                  </th>
                  <th style={{ 
                    width: '100px', 
                    padding: '12px', 
                    border: '1px solid #e5e7eb',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    {t('packing')}
                  </th>
                  <th style={{ 
                    width: '120px', 
                    padding: '12px', 
                    border: '1px solid #e5e7eb',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '600',
                    backgroundColor: '#dbeafe'
                  }}>
                    {t('currentStock')}
                  </th>
                  
                  {monthDays.map(date => {
                    const day = date.split('-')[2]
                    return (
                      <th key={date} style={{ 
                        width: '100px',
                        padding: '8px',
                        border: '1px solid #e5e7eb',
                        textAlign: 'center',
                        fontSize: '11px',
                        fontWeight: '600'
                      }}>
                        <div style={{ marginBottom: '4px' }}>{day}</div>
                        <div style={{ display: 'flex' }}>
                          <div style={{ flex: 1, color: '#059669' }}>In</div>
                          <div style={{ flex: 1, color: '#dc2626' }}>Out</div>
                        </div>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {inventoryData.length === 0 ? (
                  <tr>
                    <td colSpan={6 + monthDays.length} style={{ 
                      padding: '48px',
                      textAlign: 'center',
                      color: '#6b7280',
                      fontSize: '16px'
                    }}>
                      {t('noInventoryData')}
                    </td>
                  </tr>
                ) : (
                  inventoryData.map((item, index) => (
                    <tr key={item.product_id} style={{ 
                      backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb'
                    }}>
                      <td style={{ 
                        width: '120px',
                        padding: '12px',
                        border: '1px solid #e5e7eb',
                        fontSize: '13px',
                        fontWeight: '500'
                      }}>
                        {item.product_id}
                      </td>
                      <td style={{ 
                        width: '200px',
                        padding: '12px',
                        border: '1px solid #e5e7eb',
                        fontSize: '13px'
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
                        padding: '12px',
                        border: '1px solid #e5e7eb',
                        fontSize: '13px'
                      }}>
                        {item.country}
                      </td>
                      <td style={{ 
                        width: '100px',
                        padding: '12px',
                        border: '1px solid #e5e7eb',
                        fontSize: '13px'
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
                        padding: '12px',
                        border: '1px solid #e5e7eb',
                        fontSize: '13px'
                      }}>
                        {item.packing_size}
                      </td>
                      <td style={{ 
                        width: '120px',
                        padding: '12px',
                        border: '1px solid #e5e7eb',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#1e40af',
                        backgroundColor: '#dbeafe'
                      }}>
                        {parseFloat(item.current_stock).toLocaleString()}
                      </td>
                      
                      {monthDays.map(date => {
                        const dayData = item.dailyTransactions[date]
                        return (
                          <td key={date} style={{ 
                            width: '100px',
                            padding: '8px',
                            border: '1px solid #e5e7eb',
                            fontSize: '11px',
                            textAlign: 'center'
                          }}>
                            <div style={{ display: 'flex' }}>
                              <div style={{ 
                                flex: 1,
                                color: '#059669',
                                fontWeight: '500'
                              }}>
                                {dayData?.in ? parseFloat(dayData.in).toLocaleString() : ''}
                              </div>
                              <div style={{ 
                                flex: 1,
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

      {/* 额外的调试信息 */}
      <div style={{
        marginTop: '16px',
        padding: '12px',
        backgroundColor: '#e0f2fe',
        borderRadius: '6px',
        fontSize: '12px',
        color: '#0369a1'
      }}>
        <strong>如果还是看不到滚动条，请检查:</strong><br/>
        1. 浏览器设置中是否隐藏了滚动条<br/>
        2. 操作系统是否设置为自动隐藏滚动条<br/>
        3. 按 F12 在 Elements 标签中查找 id="scroll-container" 的元素<br/>
        4. 在 Console 中检查是否有滚动事件被触发
      </div>
    </div>
  )
}

export default InventorySummary
