import React, { useState, useEffect, useRef } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { supabase } from '../../supabase/client'
import * as XLSX from 'xlsx'

const InventorySummary = () => {
  const { t } = useLanguage()
  const scrollContainerRef = useRef(null);
  const [inventoryData, setInventoryData] = useState([])
  const [loading, setLoading] = useState(true)
  const [isExportingAccountReport, setIsExportingAccountReport] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7))
  const [viewMode, setViewMode] = useState('stock') // 'stock' or 'inboundOutbound'
  const [datesWithAdjustments, setDatesWithAdjustments] = useState(new Set())

  useEffect(() => {
    fetchInventorySummary()
  }, [currentMonth])

  // React状态管理的拖拽实现
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [scrollStart, setScrollStart] = useState({ left: 0, top: 0 });

  const handleMouseDown = (e) => {
    // 如果点击在按钮或输入框上，不启动拖拽
    if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT' || e.target.closest('button') || e.target.closest('input')) {
      return;
    }

    console.log('开始拖拽');
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setScrollStart({ 
      left: scrollContainerRef.current.scrollLeft, 
      top: scrollContainerRef.current.scrollTop 
    });
    
    scrollContainerRef.current.style.cursor = 'grabbing';
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    console.log('拖拽中...');
    e.preventDefault();
    
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    scrollContainerRef.current.scrollLeft = scrollStart.left - deltaX;
    scrollContainerRef.current.scrollTop = scrollStart.top - deltaY;
  };

  const handleMouseUp = () => {
    if (isDragging) {
      console.log('结束拖拽');
      setIsDragging(false);
      scrollContainerRef.current.style.cursor = 'grab';
    }
  };

  useEffect(() => {
    if (isDragging) {
      // 当开始拖拽时，在document上监听事件
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart, scrollStart]);

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

      // Identify dates with adjustments
      const adjustmentDates = new Set()
      transactionsData.forEach(transaction => {
        if (transaction.transaction_type === 'ADJUSTMENT') {
          adjustmentDates.add(transaction.transaction_date)
        }
      })
      setDatesWithAdjustments(adjustmentDates)

      // Get unique products from transactions
      const uniqueProducts = {}
      const transactionsByProduct = {}
      const monthlyTotals = {}

      transactionsData.forEach(transaction => {
        const { product_id, transaction_date, transaction_type, quantity, products } = transaction
        
        // Aggregate monthly totals
        if (!monthlyTotals[product_id]) {
          monthlyTotals[product_id] = { in: 0, out: 0 };
        }
        if (transaction_type === 'IN' || transaction_type === 'OPENING') {
          monthlyTotals[product_id].in += parseFloat(quantity);
        } else if (transaction_type === 'OUT') {
          monthlyTotals[product_id].out += parseFloat(quantity);
        }

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
          transactionsByProduct[product_id][transaction_date] = { in: 0, out: 0, adj: 0 }
        }
        
        if (transaction_type === 'IN' || transaction_type === 'OPENING') {
          transactionsByProduct[product_id][transaction_date].in += parseFloat(quantity)
        } else if (transaction_type === 'OUT') {
          transactionsByProduct[product_id][transaction_date].out += parseFloat(quantity)
        } else if (transaction_type === 'ADJUSTMENT') {
          transactionsByProduct[product_id][transaction_date].adj += parseFloat(quantity)
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

  const exportToExcel = () => {
    if (inventoryData.length === 0) return;

    const wb = XLSX.utils.book_new();
    const ws_data = [];

    // Header Row 1: Merged dates
    const header1 = [
      t('productCode'),
      t('productName'),
      t('country'),
      t('vendor'),
      t('packingSize'),
      t('uom'),
      t('currentStock'),
    ];
    const merges = [];
    let col_idx = header1.length;

    monthDays.forEach(date => {
      const d = new Date(date);
      header1[col_idx] = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
      const hasAdj = datesWithAdjustments.has(date);
      const merge_end = col_idx + (hasAdj ? 2 : 1);
      if (col_idx !== merge_end) {
        merges.push({ s: { r: 0, c: col_idx }, e: { r: 0, c: merge_end } });
      }
      col_idx = merge_end + 1;
    });
    ws_data.push(header1);

    // Header Row 2: In, Out, Adj
    const header2 = new Array(7).fill('');
    monthDays.forEach(date => {
      const hasAdj = datesWithAdjustments.has(date);
      header2.push(t('in'), t('out'));
      if (hasAdj) {
        header2.push(t('adj_short'));
      }
    });
    ws_data.push(header2);

    // Data Rows
    inventoryData.forEach(item => {
      const row = [
        item.product_id,
        item.product_name,
        item.country || '',
        item.vendor || '',
        item.packing_size || '',
        item.uom || '',
        item.current_stock,
      ];
      monthDays.forEach(date => {
        const dayData = item.dailyTransactions[date];
        const hasAdj = datesWithAdjustments.has(date);
        row.push(dayData?.in || '');
        row.push(dayData?.out || '');
        if (hasAdj) {
          row.push(dayData?.adj || '');
        }
      });
      ws_data.push(row);
    });

    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    ws['!merges'] = merges;
    XLSX.utils.book_append_sheet(wb, ws, 'Inventory Summary');
    XLSX.writeFile(wb, `inventory_summary_${currentMonth}.xlsx`);
  };

  const exportAccountMovementReportToExcel = async () => {
    setIsExportingAccountReport(true);
    try {
      const { data, error } = await supabase.rpc('get_daily_product_movements', {
        report_month: `${currentMonth}-01`,
      });

      if (error) {
        console.error('Error fetching account movement report:', error);
        return;
      }
      if (data.length === 0) return;

      const wb = XLSX.utils.book_new();
      const ws_data = [];
      const merges = [];

      // Group data by product_id
      const products = {};
      const reportDates = new Set();
      data.forEach(item => {
        if (!products[item.product_id]) {
          products[item.product_id] = {
            product_id: item.product_id,
            account_code: item.account_code,
            packing_size: item.packing_size,
            uom: item.uom,
            movements: {},
          };
        }
        products[item.product_id].movements[item.transaction_date] = {
          in: item.in_weight,
          convert: item.convert_weight,
          out: item.out_weight,
          adj: item.adjustment_weight,
        };
        if (item.adjustment_weight && item.adjustment_weight !== 0) {
          reportDates.add(item.transaction_date);
        }
      });

      // Header Row 1: Merged dates
      const header1 = [t('accountCode'), t('packingSize'), t('uom')];
      let col_idx = header1.length;
      monthDays.forEach(date => {
        const d = new Date(date);
        header1[col_idx] = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
        const hasAdj = reportDates.has(date);
        const merge_end = col_idx + (hasAdj ? 3 : 2);
        if (col_idx !== merge_end) {
            merges.push({ s: { r: 0, c: col_idx }, e: { r: 0, c: merge_end } });
        }
        col_idx = merge_end + 1;
      });
      ws_data.push(header1);

      // Header Row 2: In, Convert, Out, Adj
      const header2 = new Array(3).fill('');
      monthDays.forEach(date => {
        const hasAdj = reportDates.has(date);
        header2.push(t('in'), 'Convert', t('out'));
        if (hasAdj) {
          header2.push(t('adj_short'));
        }
      });
      ws_data.push(header2);

      // Data Rows
      Object.values(products).forEach(product => {
        const row = [product.account_code, product.packing_size || '', product.uom || ''];
        monthDays.forEach(date => {
          const movement = product.movements[date];
          const hasAdj = reportDates.has(date);
          row.push(movement?.in || '', movement?.convert || '', movement?.out || '');
          if (hasAdj) {
            row.push(movement?.adj || '');
          }
        });
        ws_data.push(row);
      });

      const ws = XLSX.utils.aoa_to_sheet(ws_data);
      ws['!merges'] = merges;
      XLSX.utils.book_append_sheet(wb, ws, 'Account Movement');
      XLSX.writeFile(wb, `account_movement_report_${currentMonth}.xlsx`);

    } catch (err) {
      console.error('Error exporting account movement report:', err);
    } finally {
      setIsExportingAccountReport(false);
    }
  };

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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 opacity-0 pointer-events-none">
                {t('toggleView')}
              </label>
              <button
                type="button"
                onClick={() => setViewMode(prev => prev === 'stock' ? 'inboundOutbound' : 'stock')}
                className="bg-white hover:bg-gray-100 text-gray-800 px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-gray-400 border border-gray-300 shadow-sm"
              >
                {viewMode === 'stock' ? t('showMonthlyInOut') : t('showCurrentStock')}
              </button>
            </div>
          </div>

          <div className="flex gap-x-2">
            <button
              onClick={exportToExcel}
              disabled={inventoryData.length === 0 || isExportingAccountReport}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-300"
            >
              📊 {t('exportToExcel')}
            </button>
            <button
              onClick={exportAccountMovementReportToExcel}
              disabled={isExportingAccountReport}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-300"
            >
              {isExportingAccountReport ? t('exporting') : t('accountExcelDownload')}
            </button>
          </div>
        </div>

        <div className="text-sm text-gray-600">
          {t('showing')} {inventoryData.length} {t('showingProducts')}
        </div>
      </div>

      <div className="flex-1 bg-white shadow rounded-lg">
        <div 
          ref={scrollContainerRef} 
          className="w-full h-full overflow-auto cursor-grab"
          style={{ 
            userSelect: 'none',
            WebkitUserSelect: 'none'
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <table className="min-w-full border-separate border-spacing-0">
            <thead className="bg-gray-50 sticky top-0 z-20">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-100px sticky left-0 bg-gray-50 z-10 border-b border-gray-200">
                  {t('productCode')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-200px sticky left-100px bg-gray-50 z-10 border-b border-gray-200">
                  {t('productName')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-100px sticky left-300px bg-gray-50 z-10 border-b border-gray-200">
                  {t('country')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-150px sticky left-400px bg-gray-50 z-10 border-b border-gray-200">
                  {t('vendor')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-100px sticky left-550px bg-gray-50 z-10 border-b border-gray-200">
                  {t('packing')}
                </th>
                {viewMode === 'stock' ? (
                  <>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50 min-w-100px sticky left-650px z-10 border-b border-gray-200">
                      {t('currentStock')}
                    </th>
                    {monthDays.map(date => {
                      const day = date.split('-')[2]
                      return (
                        <th key={date} className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-l border-gray-200 min-w-[140px]">
                          <div>{day}</div>
                          {datesWithAdjustments.has(date) ? (
                            <div className="flex text-center">
                              <div className="w-1/3 text-green-600">{t('in')}</div>
                              <div className="w-1/3 text-red-600">{t('out')}</div>
                              <div className="w-1/3 text-blue-600">{t('adj_short')}</div>
                            </div>
                          ) : (
                            <div className="flex text-center">
                              <div className="w-1/2 text-green-600">{t('in')}</div>
                              <div className="w-1/2 text-red-600">{t('out')}</div>
                            </div>
                          )}
                        </th>
                      )
                    })}
                  </>
                ) : (
                  <>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-green-50">
                      {t('totalInbound')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-red-50">
                      {t('totalOutbound')}
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="bg-white">
              {inventoryData.length === 0 ? (
                <tr>
                  <td colSpan={viewMode === 'stock' ? (6 + monthDays.length) : 7} className="px-6 py-8 text-center text-gray-500 border-b border-gray-200">
                    <div className="flex flex-col items-center">
                      <svg className="h-12 w-12 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} 
                          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2-2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8l-4 4-4-4" />
                      </svg>
                      <p className="text-lg font-medium">{t('noInventoryData')}</p>
                      <p className="text-sm mt-1">{t('tryAdjustingFiltersInventory')}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                inventoryData.map((item) => (
                  <tr key={item.product_id} className="group">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white group-hover:bg-gray-50 z-10 border-b border-gray-200">
                      {item.product_id}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 sticky left-100px bg-white group-hover:bg-gray-50 z-10 border-b border-gray-200 whitespace-normal break-words">
                      {item.product_name}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 sticky left-300px bg-white group-hover:bg-gray-50 z-10 border-b border-gray-200">
                      {item.country}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 sticky left-400px bg-white group-hover:bg-gray-50 z-10 border-b border-gray-200">
                      {item.vendor}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 sticky left-550px bg-white group-hover:bg-gray-50 z-10 border-b border-gray-200">
                      {item.packing_size}
                    </td>
                    {viewMode === 'stock' ? (
                      <>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-blue-900 bg-blue-50 group-hover:bg-blue-100 sticky left-650px z-10 border-b border-gray-200">
                          {parseFloat(item.current_stock).toLocaleString()}
                        </td>
                        {monthDays.map(date => {
                          const dayData = item.dailyTransactions[date]
                          return (
                            <td key={date} className="px-2 py-4 whitespace-nowrap text-xs text-center border-l border-gray-200 min-w-[140px]">
                              {datesWithAdjustments.has(date) ? (
                                <div className="flex">
                                  <div className="w-1/3 text-green-600 font-medium">
                                    {dayData?.in ? parseFloat(dayData.in).toLocaleString() : ''}
                                  </div>
                                  <div className="w-1/3 text-red-600 font-medium">
                                    {dayData?.out ? parseFloat(dayData.out).toLocaleString() : ''}
                                  </div>
                                  <div className="w-1/3 text-blue-600 font-medium">
                                    {dayData?.adj ? parseFloat(dayData.adj).toLocaleString() : ''}
                                  </div>
                                </div>
                              ) : (
                                <div className="flex">
                                  <div className="w-1/2 text-green-600 font-medium">
                                    {dayData?.in ? parseFloat(dayData.in).toLocaleString() : ''}
                                  </div>
                                  <div className="w-1/2 text-red-600 font-medium">
                                    {dayData?.out ? parseFloat(dayData.out).toLocaleString() : ''}
                                  </div>
                                </div>
                              )}
                            </td>
                          )
                        })}
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-green-900 bg-green-50">
                          {item.totalInbound.toLocaleString()}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-red-900 bg-red-50">
                          {item.totalOutbound.toLocaleString()}
                        </td>
                      </>
                    )}
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
