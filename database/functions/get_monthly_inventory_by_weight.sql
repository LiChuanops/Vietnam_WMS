-- Supabase RPC function to get a monthly inventory report grouped by account_code and calculated by weight.
-- Version 1: Groups by account_code and multiplies quantities by UOM.
create or replace function get_monthly_inventory_by_weight(report_month date)
returns table (
    account_code text,
    uom text,
    opening_stock_weight numeric,
    inbound_weight numeric,
    outbound_weight numeric,
    adjustment_weight numeric,
    closing_stock_weight numeric
)
language sql
as $$
with
  -- 1. Create a base transaction view that includes account_code and a numeric UOM
  transactions_with_uom as (
    select
      it.transaction_date,
      it.transaction_type,
      it.quantity,
      p.account_code,
      -- Attempt to convert UOM to a number. This assumes UOM is a string representing a number.
      -- If UOM can be non-numeric, this will fail and needs a more robust solution.
      to_number(p.uom, '9999.99') as uom_numeric
    from inventory_transactions it
    join products p on it.product_id = p.system_code
    where p.account_code is not null and p.uom is not null
  ),

  -- 2. Calculate opening stock weight for each account_code.
  opening_stock_calc as (
    select
      t.account_code,
      coalesce(sum(
        case
          when t.transaction_type = 'IN' then t.quantity * t.uom_numeric
          when t.transaction_type = 'OUT' then -t.quantity * t.uom_numeric
          when t.transaction_type = 'ADJUSTMENT' then t.quantity * t.uom_numeric
          else 0
        end
      ), 0) as total_opening_weight
    from transactions_with_uom t
    where t.transaction_date < date_trunc('month', report_month)
    group by t.account_code
  ),

  -- 3. Aggregate all transaction weights *within* the report_month.
  monthly_aggs as (
    select
      t.account_code,
      coalesce(sum(case when t.transaction_type = 'IN' then t.quantity * t.uom_numeric else 0 end), 0) as total_inbound_weight,
      coalesce(sum(case when t.transaction_type = 'OUT' then t.quantity * t.uom_numeric else 0 end), 0) as total_outbound_weight,
      coalesce(sum(case when t.transaction_type = 'ADJUSTMENT' then t.quantity * t.uom_numeric else 0 end), 0) as total_adjustment_weight
    from transactions_with_uom t
    where date_trunc('month', t.transaction_date) = date_trunc('month', report_month)
    group by t.account_code
  ),

  -- 4. Get a representative UOM for each account_code for display purposes
  account_uoms as (
    select distinct on (account_code) account_code, uom from products where account_code is not null
  )

-- 5. Final select to join everything together.
select
  au.account_code,
  au.uom,
  coalesce(os.total_opening_weight, 0) as opening_stock_weight,
  coalesce(ma.total_inbound_weight, 0) as inbound_weight,
  coalesce(ma.total_outbound_weight, 0) as outbound_weight,
  coalesce(ma.total_adjustment_weight, 0) as adjustment_weight,
  (
    coalesce(os.total_opening_weight, 0) +
    coalesce(ma.total_inbound_weight, 0) -
    coalesce(ma.total_outbound_weight, 0) +
    coalesce(ma.total_adjustment_weight, 0)
  ) as closing_stock_weight
from account_uoms au
left join opening_stock_calc os on au.account_code = os.account_code
left join monthly_aggs ma on au.account_code = ma.account_code
where
  coalesce(os.total_opening_weight, 0) != 0 OR
  coalesce(ma.total_inbound_weight, 0) != 0 OR
  coalesce(ma.total_outbound_weight, 0) != 0 OR
  coalesce(ma.total_adjustment_weight, 0) != 0
order by au.account_code;
$$;
