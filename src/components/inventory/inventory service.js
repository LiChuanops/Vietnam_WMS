import { supabase } from '../supabase/client'

export const inventoryService = {
  // Get current inventory with stock > 0
  async getCurrentInventory() {
    const { data, error } = await supabase
      .from('current_inventory')
      .select('*')
      .gt('current_stock', 0)
      .order('product_id')
    
    return { data, error }
  },

  // Get monthly summary data
  async getMonthlySummary(year, month) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const endDate = new Date(year, month, 0).toISOString().split('T')[0] // Last day of month

    // Get current inventory
    const { data: inventoryData, error: inventoryError } = await supabase
      .from('current_inventory')
      .select('*')
      .gt('current_stock', 0)
      .order('product_id')

    if (inventoryError) return { data: null, error: inventoryError }

    // Get monthly transactions
    const { data: transactionsData, error: transactionsError } = await supabase
      .from('inventory_transactions')
      .select('product_id, transaction_date, transaction_type, quantity, reference_number')
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate)
      .order('transaction_date')

    if (transactionsError) return { data: null, error: transactionsError }

    // Group transactions by product and date
    const transactionsByProduct = transactionsData.reduce((acc, transaction) => {
      const { product_id, transaction_date, transaction_type, quantity } = transaction
      
      if (!acc[product_id]) {
        acc[product_id] = {}
      }
      
      if (!acc[product_id][transaction_date]) {
        acc[product_id][transaction_date] = { in: 0, out: 0 }
      }
      
      if (transaction_type === 'IN' || transaction_type === 'OPENING') {
        acc[product_id][transaction_date].in += parseFloat(quantity)
      } else if (transaction_type === 'OUT') {
        acc[product_id][transaction_date].out += parseFloat(quantity)
      }
      
      return acc
    }, {})

    // Combine with inventory data
    const enrichedData = inventoryData.map(item => ({
      ...item,
      dailyTransactions: transactionsByProduct[item.product_id] || {}
    }))

    return { data: enrichedData, error: null }
  },

  // Get inbound transactions with optional filters
  async getInboundTransactions(filters = {}) {
    let query = supabase
      .from('inventory_transactions')
      .select(`
        *,
        products:product_id (
          product_name,
          country,
          vendor,
          packing_size
        )
      `)
      .eq('transaction_type', 'IN')
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false })

    // Apply filters
    if (filters.startDate) query = query.gte('transaction_date', filters.startDate)
    if (filters.endDate) query = query.lte('transaction_date', filters.endDate)
    if (filters.productId) query = query.eq('product_id', filters.productId)
    
    return await query
  },

  // Get outbound transactions with optional filters
  async getOutboundTransactions(filters = {}) {
    let query = supabase
      .from('inventory_transactions')
      .select(`
        *,
        products:product_id (
          product_name,
          country,
          vendor,
          packing_size
        )
      `)
      .eq('transaction_type', 'OUT')
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false })

    // Apply filters
    if (filters.startDate) query = query.gte('transaction_date', filters.startDate)
    if (filters.endDate) query = query.lte('transaction_date', filters.endDate)
    if (filters.productId) query = query.eq('product_id', filters.productId)
    
    return await query
  },

  // Add new transaction(s)
  async addTransaction(transactionData) {
    const payload = Array.isArray(transactionData) ? transactionData : [transactionData];
    const { data, error } = await supabase
      .from('inventory_transactions')
      .insert(payload)
      .select(`
        *,
        products:product_id (
          product_name,
          country,
          vendor,
          packing_size
        )
      `)
    
    return { data, error }
  },

  // Get active products (for dropdowns)
  async getActiveProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('system_code, product_name, country, vendor, packing_size')
      .eq('status', 'Active')
      .order('product_name')
    
    return { data, error }
  },

  // Get products with current stock (for outbound transactions)
  async getProductsWithStock() {
    const { data, error } = await supabase
      .from('current_inventory')
      .select('*')
      .gt('current_stock', 0)
      .order('product_name')
    
    return { data, error }
  },

  // Monthly closing - create opening stock for next month
  async performMonthlyClosing(year, month) {
    try {
      // Calculate month-end stock using the stored function
      const { data: stockData, error: stockError } = await supabase
        .rpc('calculate_month_end_stock', { 
          target_year: year, 
          target_month: month 
        })

      if (stockError) return { data: null, error: stockError }

      // Prepare opening transactions for next month
      const nextMonth = month === 12 ? 1 : month + 1
      const nextYear = month === 12 ? year + 1 : year
      
      const openingTransactions = stockData
        .filter(item => item.stock > 0)
        .map(item => ({
          product_id: item.product_id,
          transaction_type: 'OPENING',
          quantity: item.stock,
          transaction_date: `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`,
          reference_number: `OPEN-${nextYear}-${String(nextMonth).padStart(2, '0')}`,
          notes: `Opening stock carried forward from ${year}-${String(month).padStart(2, '0')}`,
          created_by: null // System generated
        }))

      if (openingTransactions.length > 0) {
        const { data, error } = await supabase
          .from('inventory_transactions')
          .insert(openingTransactions)
        
        return { data, error }
      }

      return { data: [], error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Get export data for different report types
  async getExportData(reportType, filters = {}) {
    switch (reportType) {
      case 'current_stock':
        return await supabase
          .from('current_inventory')
          .select('*')
          .order('product_id')

      case 'transactions_export':
        let query = supabase
          .from('inventory_transactions_export')
          .select('*')
          .order('"Transaction Date"', { ascending: false })

        if (filters.startDate) query = query.gte('"Transaction Date"', filters.startDate)
        if (filters.endDate) query = query.lte('"Transaction Date"', filters.endDate)
        
        return await query

      case 'monthly_report':
        return await supabase
          .from('monthly_inventory_report')
          .select('*')
          .order('"Product Code"')
          .order('"Month"')

      case 'low_stock':
        const threshold = filters.threshold || 100
        return await supabase
          .from('current_inventory')
          .select('*')
          .lte('current_stock', threshold)
          .gt('current_stock', 0)
          .order('current_stock')

      default:
        return { data: [], error: { message: 'Unknown report type' } }
    }
  },

  // Import opening stock (bulk operation)
  async importOpeningStock(openingStockData, date, createdBy) {
    const transactions = openingStockData.map(item => ({
      product_id: item.product_id,
      transaction_type: 'OPENING',
      quantity: parseFloat(item.quantity),
      transaction_date: date,
      reference_number: `OPEN-${date}`,
      notes: 'Opening stock import',
      created_by: createdBy
    }))

    const { data, error } = await supabase
      .from('inventory_transactions')
      .insert(transactions)
    
    return { data, error }
  },

  // Get transaction history for a specific product
  async getProductTransactionHistory(productId, limit = 50) {
    const { data, error } = await supabase
      .from('inventory_transactions')
      .select(`
        *,
        profiles:created_by (name)
      `)
      .eq('product_id', productId)
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit)
    
    return { data, error }
  },

  // Get inventory summary statistics
  async getInventoryStats() {
    try {
      // Get current inventory count
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('current_inventory')
        .select('current_stock')
        .gt('current_stock', 0)

      if (inventoryError) return { data: null, error: inventoryError }

      // Get transaction counts for current month
      const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
      const { data: transactionData, error: transactionError } = await supabase
        .from('inventory_transactions')
        .select('transaction_type, quantity')
        .gte('transaction_date', `${currentMonth}-01`)
        .lte('transaction_date', `${currentMonth}-31`)

      if (transactionError) return { data: null, error: transactionError }

      // Calculate statistics
      const stats = {
        totalProducts: inventoryData.length,
        totalStock: inventoryData.reduce((sum, item) => sum + parseFloat(item.current_stock), 0),
        monthlyInbound: transactionData
          .filter(t => t.transaction_type === 'IN')
          .reduce((sum, t) => sum + parseFloat(t.quantity), 0),
        monthlyOutbound: transactionData
          .filter(t => t.transaction_type === 'OUT')
          .reduce((sum, t) => sum + parseFloat(t.quantity), 0),
        totalTransactions: transactionData.length
      }

      return { data: stats, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }
}
