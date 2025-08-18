import React, { useState, useEffect, useRef } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { supabase } from '../../supabase/client'

const InventorySummary = () => {
  const { t } = useLanguage()
  const [inventoryData, setInventoryData] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7))
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)
  
  const tableContainerRef = useRef(null)
  const scrollBarRef = useRef(null)

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

  // 处理拖拽开始
  const handleMouseDown = (e) => {
    e.preventDefault()
    setIsDragging(true)
    setStartX(e.clientX)
    setScrollLeft(tableContainerRef.current.scrollLeft)
    document.body.style.cursor = 'grabbing'
    document.body.style.userSelect = 'none'
  }

  // 处理拖拽移动 - 修复版本
  const handleMouseMove = (e) => {
    if (!isDragging || !tableContainerRef.current) return
    e.preventDefault()
    
    const x = e.clientX
    const walk = (startX - x) * 1.5 // 调整滚动敏感度
    const newScrollLeft = scrollLeft + walk
    
    // 确保滚动值在有效范围内
    const maxScroll = tableContainerRef.current.scrollWidth - tableContainerRef.current.clientWidth
    const clampedScrollLeft = Math.max(0, Math.min(newScrollLeft, maxScroll))
    
    tableContainerRef.current.scrollLeft = clampedScrollLeft
    updateScrollBar()
  }

  // 处理拖拽结束
  const handleMouseUp = () => {
    setIsDragging(false)
    document.body.style.cursor = 'default'
    document.body.style.userSelect = 'auto'
  }

  // 更新自定义滚动条 - 修复版本
  const updateScrollBar = () => {
    if (!tableContainerRef.current || !scrollBarRef.current) return
    
    const container = tableContainerRef.current
    const scrollBar = scrollBarRef.current
    const thumb = scrollBar.querySelector('.scroll-thumb')
    
    if (!thumb) return
    
    const maxScroll = container.scrollWidth - container.clientWidth
    if (maxScroll <= 0) return
    
    const scrollPercentage = container.scrollLeft / maxScroll
    const thumbWidth = 48 // thumb宽度
    const maxThumbPosition = scrollBar.clientWidth - thumbWidth
    
    thumb.style.left = `${scrollPercentage * maxThumbPosition}px`
  }

  // 处理自定义滚动条点击 - 修复版本
  const handleScrollBarClick = (e) => {
    if (!tableContainerRef.current || !scrollBarRef.current) return
    
    const rect = scrollBarRef.current.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const percentage = clickX / rect.width
    const maxScroll = tableContainerRef.current.scrollWidth - tableContainerRef.current.clientWidth
    
    tableContainerRef.current.scrollLeft = percentage * maxScroll
    updateScrollBar()
  }

  // 监听表格滚动事件
  const handleTableScroll = () => {
    updateScrollBar()
  }

  // 设置事件监听器
  useEffect(() => {
    const container = tableContainerRef.current
    if (container) {
      container.addEventListener('scroll', handleTableScroll)
      return () => container.removeEventListener('scroll', handleTableScroll)
    }
  }, [])

  // 全局鼠标事件监听器 - 修复版本
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove, { passive: false })
      document.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, startX, scrollLeft])

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

  return (
    <div>
      <div className="mb-6 space-y-4">
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

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div 
          className="overflow-x-auto"
          ref={tableContainerRef}
          style={{ cursor: isDragging ? 'grabbing' : 'auto' }}
        >
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-30">
              <tr>
                {/* Sticky固定列 */}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-40 border-r border-gray-200" style={{ width: '120px' }}>
                  {t('productCode')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky bg-gray-50 z-40 border-r border-gray-200" style={{ left: '120px', width: '200px' }}>
                  {t('productName')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky bg-gray-50 z-40 border-r border-gray-200" style={{ left: '320px', width: '100px' }}>
                  {t('country')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky bg-gray-50 z-40 border-r border-gray-200" style={{ left: '420px', width: '120px' }}>
                  {t('vendor')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky bg-gray-50 z-40 border-r border-gray-200" style={{ left: '540px', width: '100px' }}>
                  {t('packing')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky bg-blue-50 z-40 border-r-4 border-blue-400" style={{ left: '640px', width: '120px' }}>
                  {t('currentStock')}
                </th>
                
                {/* 可拖拽滚动的日期列 */}
                {monthDays.map(date => {
                  const day = date.split('-')[2]
                  return (
                    <th 
                      key={date} 
                      className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-l border-gray-200 cursor-grab hover:bg-gray-100 active:cursor-grabbing transition-colors duration-150" 
                      style={{ minWidth: '80px' }}
                      onMouseDown={handleMouseDown}
                      title="点击拖拽水平滚动表格"
                    >
                      <div>{day}</div>
                      <div className="flex">
                        <div className="w-1/2 text-green-600">In</div>
                        <div className="w-1/2 text-red-600">Out</div>
                      </div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
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
                inventoryData.map((item) => (
                  <tr key={item.product_id} className="hover:bg-gray-50">
                    {/* Sticky固定单元格 */}
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white z-20 border-r border-gray-200" style={{ width: '120px' }}>
                      {item.product_id}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 sticky bg-white z-20 border-r border-gray-200" style={{ left: '120px', width: '200px' }}>
                      <div className="truncate" title={item.product_name}>
                        {item.product_name}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 sticky bg-white z-20 border-r border-gray-200" style={{ left: '320px', width: '100px' }}>
                      {item.country}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 sticky bg-white z-20 border-r border-gray-200" style={{ left: '420px', width: '120px' }}>
                      <div className="truncate" title={item.vendor}>
                        {item.vendor}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 sticky bg-white z-20 border-r border-gray-200" style={{ left: '540px', width: '100px' }}>
                      {item.packing_size}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-blue-900 sticky bg-blue-50 z-20 border-r-4 border-blue-400" style={{ left: '640px', width: '120px' }}>
                      {parseFloat(item.current_stock).toLocaleString()}
                    </td>
                    
                    {/* 可拖拽滚动的日期数据单元格 */}
                    {monthDays.map(date => {
                      const dayData = item.dailyTransactions[date]
                      
                      return (
                        <td 
                          key={`${date}-${item.product_id}`}
                          className="px-2 py-4 whitespace-nowrap text-xs text-center border-l border-gray-200 cursor-grab hover:bg-gray-50 active:cursor-grabbing" 
                          style={{ minWidth: '80px' }}
                          onMouseDown={handleMouseDown}
                        >
                          <div className="flex">
                            <div className="w-1/2 text-green-600 font-medium">
                              {dayData?.in ? parseFloat(dayData.in).toLocaleString() : ''}
                            </div>
                            <div className="w-1/2 text-red-600 font-medium">
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
        
        {/* 自定义X轴滚动条 */}
        <div className="bg-gray-100 h-4 relative border-t border-gray-200">
          <div 
            ref={scrollBarRef}
            className="h-full w-full relative cursor-pointer"
            onClick={handleScrollBarClick}
          >
            <div 
              className="scroll-thumb absolute top-0 h-full w-12 bg-blue-500 hover:bg-blue-600 rounded transition-colors duration-150 cursor-pointer"
              style={{ left: '0px' }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InventorySummary
