import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nlxsuuxssbbyveoewmny.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5seHN1dXhzc2JieXZlb2V3bW55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxNjg4MzQsImV4cCI6MjA3MDc0NDgzNH0.aKCUDelPVKJ6k0-DrpaeR13CfCjIR1LOCDq6gj-7QvM'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
