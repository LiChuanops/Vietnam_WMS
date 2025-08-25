create or replace view public.local_current_stock as
select
  p.system_code as product_id,
  p.product_name,
  p.viet_name,
  p.account_code,
  p.country,
  p.vendor,
  p.type,
  p.packing_size,
  p.uom,
  p.pieces_per_carton,
  coalesce(
    sum(
      case
        when it.transaction_type::text = any (
          array[
            'IN'::character varying,
            'OPENING'::character varying,
            'ADJUSTMENT'::character varying
          ]::text[]
        ) then it.quantity
        when it.transaction_type::text = 'OUT'::text then - it.quantity
        else 0::numeric
      end
    ),
    0::numeric
  ) as current_stock
from
  products p
  left join local_inventory it on p.system_code::text = it.product_id::text
group by
  p.system_code,
  p.product_name,
  p.viet_name,
  p.account_code,
  p.country,
  p.vendor,
  p.type,
  p.packing_size,
  p.uom,
  p.pieces_per_carton
having
  coalesce(
    sum(
      case
        when it.transaction_type::text = any (
          array[
            'IN'::character varying,
            'OPENING'::character varying,
            'ADJUSTMENT'::character varying
          ]::text[]
        ) then it.quantity
        when it.transaction_type::text = 'OUT'::text then - it.quantity
        else 0::numeric
      end
    ),
    0::numeric
  ) > 0::numeric;
