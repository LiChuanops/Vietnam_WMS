-- Supabase RPC function to get a local monthly inventory report.
create or replace function get_local_monthly_inventory(report_month date)
returns table (
    product_id text,
    product_name character varying,
    viet_name character varying,
    uom character varying,
    packing_size character varying,
    opening_stock numeric,
    inbound_quantity numeric,
    outbound_quantity numeric,
    convert_quantity numeric,
    adjustment_quantity numeric,
    closing_stock numeric
)
language sql
as $$
with
  all_products as (
    select system_code from products
  ),
  opening_stock_calc as (
    select
      it.product_id,
      coalesce(sum(
        case
          when it.transaction_type = 'IN' then it.quantity
          when it.transaction_type = 'OUT' then -it.quantity
          when it.transaction_type = 'ADJUSTMENT' then it.quantity
          else 0
        end
      ), 0) as total_opening_stock
    from local_inventory it
    where it.transaction_date < date_trunc('month', report_month)
    group by it.product_id
  ),
  monthly_aggs as (
    select
      it.product_id,
      coalesce(sum(case when it.transaction_type = 'IN' and it.is_conversion = false then it.quantity else 0 end), 0) as total_inbound,
      coalesce(sum(case when it.transaction_type = 'OUT' and it.is_conversion = false then it.quantity else 0 end), 0) as total_outbound,
      coalesce(sum(case when it.transaction_type = 'ADJUSTMENT' then it.quantity else 0 end), 0) as total_adjustment,
      coalesce(sum(
        case
          when it.is_conversion = true and it.transaction_type = 'IN' then it.quantity
          when it.is_conversion = true and it.transaction_type = 'OUT' then -it.quantity
          else 0
        end
      ), 0) as total_convert
    from local_inventory it
    where date_trunc('month', it.transaction_date) = date_trunc('month', report_month)
    group by it.product_id
  )
select
  p.system_code as product_id,
  p.product_name,
  p.viet_name,
  p.uom,
  p.packing_size,
  coalesce(os.total_opening_stock, 0) as opening_stock,
  coalesce(ma.total_inbound, 0) as inbound_quantity,
  coalesce(ma.total_outbound, 0) as outbound_quantity,
  coalesce(ma.total_convert, 0) as convert_quantity,
  coalesce(ma.total_adjustment, 0) as adjustment_quantity,
  (
    coalesce(os.total_opening_stock, 0) +
    coalesce(ma.total_inbound, 0) -
    coalesce(ma.total_outbound, 0) +
    coalesce(ma.total_adjustment, 0) +
    coalesce(ma.total_convert, 0)
  ) as closing_stock
from all_products ap
left join products p on ap.system_code = p.system_code
left join opening_stock_calc os on ap.system_code = os.product_id
left join monthly_aggs ma on ap.system_code = ma.product_id
where
  coalesce(os.total_opening_stock, 0) != 0 OR
  coalesce(ma.total_inbound, 0) != 0 OR
  coalesce(ma.total_outbound, 0) != 0 OR
  coalesce(ma.total_adjustment, 0) != 0 OR
  coalesce(ma.total_convert, 0) != 0
order by p.product_name;
$$;
