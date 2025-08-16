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
    const { data: inventoryData, error: inventoryError
