-- Supabase RPC function to get a monthly inventory report.
-- This function takes a single date argument, which should be the first day of the desired month.
create or replace function get_monthly_inventory(report_month date)
returns table (
    product_id text,
    product_name character varying,
    viet_name character varying,
    uom character varying,
    opening_stock numeric,
    inbound_quantity numeric,
    outbound_quantity numeric,
    adjustment_quantity numeric,
    closing_stock numeric
)
language sql
as $$
with
  -- 1. Get a list of all unique products to ensure every product appears in the report.
  all_products as (
    select system_code from products
  ),

  -- 2. Calculate opening stock for each product.
  -- This is the sum of all transactions that happened *before* the start of the report_month.
  opening_stock_calc as (
    select
      it.product_id,
      coalesce(sum(
        case
          when it.transaction_type = 'INBOUND' then it.quantity
          when it.transaction_type = 'OUTBOUND' then -it.quantity
          when it.transaction_type = 'ADJUSTMENT' then it.quantity
          else 0
        end
      ), 0) as total_opening_stock
    from inventory_transactions it
    where it.transaction_date < date_trunc('month', report_month)
    group by it.product_id
  ),

  -- 3. Aggregate all transactions *within* the report_month.
  monthly_aggs as (
    select
      it.product_id,
      coalesce(sum(case when it.transaction_type = 'INBOUND' then it.quantity else 0 end), 0) as total_inbound,
      coalesce(sum(case when it.transaction_type = 'OUTBOUND' then it.quantity else 0 end), 0) as total_outbound,
      coalesce(sum(case when it.transaction_type = 'ADJUSTMENT' then it.quantity else 0 end), 0) as total_adjustment
    from inventory_transactions it
    where date_trunc('month', it.transaction_date) = date_trunc('month', report_month)
    group by it.product_id
  )

-- 4. Final select to join everything together.
-- We use a LEFT JOIN starting from all_products to ensure that products with no transactions
-- in the given month or no opening stock still appear in the report with 0 values.
select
  p.system_code as product_id,
  p.product_name,
  p.viet_name,
  p.uom,
  coalesce(os.total_opening_stock, 0) as opening_stock,
  coalesce(ma.total_inbound, 0) as inbound_quantity,
  coalesce(ma.total_outbound, 0) as outbound_quantity,
  coalesce(ma.total_adjustment, 0) as adjustment_quantity,
  -- Calculate closing_stock based on the other aggregates
  (
    coalesce(os.total_opening_stock, 0) +
    coalesce(ma.total_inbound, 0) -
    coalesce(ma.total_outbound, 0) +
    coalesce(ma.total_adjustment, 0)
  ) as closing_stock
from all_products ap
left join products p on ap.system_code = p.system_code
left join opening_stock_calc os on ap.system_code = os.product_id
left join monthly_aggs ma on ap.system_code = ma.product_id
order by p.product_name;
$$;
