import React, { useState, useEffect, useRef } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { supabase } from '../../supabase/client'

const InventorySummary = () => {
  const { t } = useLanguage()
  const scrollContainerRef = useRef(null);
  const dragState = useRef({
    isDown: false,
    startX: 0,
    scrollLeft: 0,
  });
  const [inventoryData, setInventoryData] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7))
  const [viewMode, setViewMode] = useState('stock') // 'stock' or 'inboundOutbound'

  useEffect(() => {
    fetchInventorySummary()
  }, [currentMonth])

  useEffect(() => {
    const slider = scrollContainerRef.current;
    if (!slider) return;

    const handleMouseDown = (e) => {
      e.preventDefault();
      dragState.current.isDown = true;
      dragState.current.startX = e.clientX - slider.getBoundingClientRect().left;
      dragState.current.scrollLeft = slider.scrollLeft;

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = (e) => {
      if (!dragState.current.isDown) return;
      e.preventDefault();
      const x = e.clientX - slider.getBoundingClientRect().left;
      const walk = (x - dragState.current.startX) * 2;
      slider.scrollLeft = dragState.current.scrollLeft - walk;
    };

    const handleMouseUp = () => {
      dragState.current.isDown = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    slider.addEventListener('mousedown', handleMouseDown);

    return () => {
      slider.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const fetchInventorySummary = async () => {
    try {
      setLoading(true)
      
      const startDate = `${currentMonth}-01`
      const endDate = new Date(currentMonth + '-01')
      endDate.setMonth(endDate.getMonth() + 1)
      endDate.setDate(0)
      const endDateStr = endDate.toISOString().split('T')[0]

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

      const uniqueProducts = {}
      const transactionsByProduct = {}
      const monthlyTotals = {}

      transactionsData.forEach(transaction => {
        const { product_id, transaction_date, transaction_type, quantity, products } = transaction
        
        if (!monthlyTotals[product_id]) {
          monthlyTotals[product_id] = { in: 0, out: 0 };
        }
        if (transaction_type === 'IN' || transaction_type === 'OPENING') {
          monthlyTotals[product_id].in += parseFloat(quantity);
        } else if (transaction_type === 'OUT') {
          monthlyTotals[product_id].out += parseFloat(quantity);
        }

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

        const stockLookup = {}
        inventoryData.forEach(item => {
          stockLookup[item.product_id] = item.current_stock
        })

        const enrichedData = Object.values(uniqueProducts).map(product => ({
          ...product,
          current_stock: stockLookup[product.product_id] || 0,
          dailyTransactions: transactionsByProduct[product.product_id] || {},
          totalInbound: monthlyTotals[product.product_id]?.in || 0,
          totalOutbound: monthlyTotals[product.product_id]?.out || 0,
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
      <div className="flex-1 bg-white shadow rounded-lg">
        <div 
          ref={scrollContainerRef} 
          className="w-full h-full overflow-x-auto overflow-y-auto cursor-grab active:cursor-grabbing select-none"
        >
          <table className="border-separate border-spacing-0 min-w-max">
            <thead className="bg-gray-50 sticky top-0 z-20">
              <tr>
                <th style={{ left: 0 }}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky bg-gray-50 z-10 border-b border-gray-200 min-w-[120px]">
                  {t('productCode')}
                </th>
                <th style={{ left: 120 }}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky bg-gray-50 z-10 border-b border-gray-200 min-w-[200px]">
                  {t('productName')}
                </th>
                <th style={{ left: 320 }}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky bg-gray-50 z-10 border-b border-gray-200 min-w-[150px]">
                  {t('country')}
                </th>
                <th style={{ left: 470 }}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky bg-gray-50 z-10 border-b border-gray-200 min-w-[180px]">
                  {t('vendor')}
                </th>
                <th style={{ left: 650 }}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky bg-gray-50 z-10 border-b border-gray-200 min-w-[120px]">
                  {t('packing')}
                </th>
                {viewMode === 'stock' ? (
                  <>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-blue-50 border-b border-gray-200 min-w-[120px]">
                      {t('currentStock')}
                    </th>
                    {monthDays.map(date => {
                      const day = date.split('-')[2]
                      return (
                        <th key={date} className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase border-l border-gray-200">
                          {day}
                        </th>
                      )
                    })}
                  </>
                ) : (
                  <>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-green-50 border-b border-gray-200">
                      {t('totalInbound')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-red-50 border-b border-gray-200">
                      {t('totalOutbound')}
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="bg-white">
              {inventoryData.map((item) => (
                <tr key={item.product_id}>
                  <td style={{ left: 0 }} className="px-4 py-2 text-sm sticky bg-white border-b border-gray-200">
                    {item.product_id}
                  </td>
                  <td style={{ left: 120 }} className="px-4 py-2 text-sm sticky bg-white border-b border-gray-200">
                    {item.product_name}
                  </td>
                  <td style={{ left: 320 }} className="px-4 py-2 text-sm sticky bg-white border-b border-gray-200">
                    {item.country}
                  </td>
                  <td style={{ left: 470 }} className="px-4 py-2 text-sm sticky bg-white border-b border-gray-200">
                    {item.vendor}
                  </td>
                  <td style={{ left: 650 }} className="px-4 py-2 text-sm sticky bg-white border-b border-gray-200">
                    {item.packing_size}
                  </td>
                  {viewMode === 'stock' ? (
                    <>
                      <td className="px-4 py-2 text-sm border-b border-gray-200">{item.current_stock}</td>
                      {monthDays.map(date => (
                        <td key={date} className="px-2 py-2 text-xs text-center border-b border-gray-200">
                          {item.dailyTransactions[date]?.in || ''}/{item.dailyTransactions[date]?.out || ''}
                        </td>
                      ))}
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-2 text-sm border-b border-gray-200">{item.totalInbound}</td>
                      <td className="px-4 py-2 text-sm border-b border-gray-200">{item.totalOutbound}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default InventorySummary
