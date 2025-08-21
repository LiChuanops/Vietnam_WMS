-- =================================================================
-- FINAL REPORT SETUP SCRIPT
-- Please run this entire script in your Supabase SQL Editor.
-- This will create/update all necessary database functions for the report.
-- =================================================================

-- Script 1: Helper function to safely convert text to numbers
CREATE OR REPLACE FUNCTION safe_to_numeric(p_text TEXT)
RETURNS NUMERIC AS $$
BEGIN
    -- Attempt to convert the text to a numeric value.
    RETURN to_number(p_text, '9999D99');
EXCEPTION
    -- If an exception occurs (e.g., invalid number format), return 0.
    WHEN others THEN
        RETURN 0;
END;
$$ LANGUAGE plpgsql;

-- =================================================================

-- Script 2: Main function for the "View Details" report
CREATE OR REPLACE FUNCTION get_monthly_inventory(report_month date)
RETURNS TABLE (
    product_id text,
    product_name character varying,
    viet_name character varying,
    uom character varying,
    packing_size character varying,
    opening_stock numeric,
    inbound_quantity numeric,
    outbound_quantity numeric,
    adjustment_quantity numeric,
    closing_stock numeric
)
LANGUAGE sql
AS $$
WITH
  all_products AS (
    SELECT system_code FROM products
  ),
  opening_stock_calc AS (
    SELECT
      it.product_id,
      coalesce(sum(
        CASE
          WHEN it.transaction_type = 'IN' THEN it.quantity
          WHEN it.transaction_type = 'OUT' THEN -it.quantity
          WHEN it.transaction_type = 'ADJUSTMENT' THEN it.quantity
          ELSE 0
        END
      ), 0) AS total_opening_stock
    FROM inventory_transactions it
    WHERE it.transaction_date < date_trunc('month', report_month)
    GROUP BY it.product_id
  ),
  monthly_aggs AS (
    SELECT
      it.product_id,
      coalesce(sum(CASE WHEN it.transaction_type = 'IN' THEN it.quantity ELSE 0 END), 0) AS total_inbound,
      coalesce(sum(CASE WHEN it.transaction_type = 'OUT' THEN it.quantity ELSE 0 END), 0) AS total_outbound,
      coalesce(sum(CASE WHEN it.transaction_type = 'ADJUSTMENT' THEN it.quantity ELSE 0 END), 0) AS total_adjustment
    FROM inventory_transactions it
    WHERE date_trunc('month', it.transaction_date) = date_trunc('month', report_month)
    GROUP BY it.product_id
  )
SELECT
  p.system_code AS product_id,
  p.product_name,
  p.viet_name,
  p.uom,
  p.packing_size,
  coalesce(os.total_opening_stock, 0) AS opening_stock,
  coalesce(ma.total_inbound, 0) AS inbound_quantity,
  coalesce(ma.total_outbound, 0) AS outbound_quantity,
  coalesce(ma.total_adjustment, 0) AS adjustment_quantity,
  (
    coalesce(os.total_opening_stock, 0) +
    coalesce(ma.total_inbound, 0) -
    coalesce(ma.total_outbound, 0) +
    coalesce(ma.total_adjustment, 0)
  ) AS closing_stock
FROM all_products ap
LEFT JOIN products p ON ap.system_code = p.system_code
LEFT JOIN opening_stock_calc os ON ap.system_code = os.product_id
LEFT JOIN monthly_aggs ma ON ap.system_code = ma.product_id
WHERE
  coalesce(os.total_opening_stock, 0) != 0 OR
  coalesce(ma.total_inbound, 0) != 0 OR
  coalesce(ma.total_outbound, 0) != 0 OR
  coalesce(ma.total_adjustment, 0) != 0
ORDER BY p.product_name;
$$;

-- =================================================================

-- Script 3: Main function for the "View By Weight" report (Corrected Version)
CREATE OR REPLACE FUNCTION get_monthly_inventory_by_weight(report_month date)
RETURNS TABLE (
    account_code text,
    uom text,
    opening_stock_weight numeric,
    inbound_weight numeric,
    outbound_weight numeric,
    adjustment_weight numeric,
    closing_stock_weight numeric
)
LANGUAGE sql
AS $$
WITH
  transactions_with_uom AS (
    SELECT
      it.transaction_date,
      it.transaction_type,
      it.quantity,
      p.account_code,
      safe_to_numeric(p.uom) AS uom_numeric -- Using the safe helper function
    FROM inventory_transactions it
    JOIN products p ON it.product_id = p.system_code
    WHERE p.account_code IS NOT NULL
  ),
  opening_stock_calc AS (
    SELECT
      t.account_code,
      coalesce(sum(
        CASE
          WHEN t.transaction_type = 'IN' THEN t.quantity * t.uom_numeric
          WHEN t.transaction_type = 'OUT' THEN -t.quantity * t.uom_numeric
          WHEN t.transaction_type = 'ADJUSTMENT' THEN t.quantity * t.uom_numeric
          ELSE 0
        END
      ), 0) AS total_opening_weight
    FROM transactions_with_uom t
    WHERE t.transaction_date < date_trunc('month', report_month)
    GROUP BY t.account_code
  ),
  monthly_aggs AS (
    SELECT
      t.account_code,
      coalesce(sum(CASE WHEN t.transaction_type = 'IN' THEN t.quantity * t.uom_numeric ELSE 0 END), 0) AS total_inbound_weight,
      coalesce(sum(CASE WHEN t.transaction_type = 'OUT' THEN t.quantity * t.uom_numeric ELSE 0 END), 0) AS total_outbound_weight,
      coalesce(sum(CASE WHEN t.transaction_type = 'ADJUSTMENT' THEN t.quantity * t.uom_numeric ELSE 0 END), 0) AS total_adjustment_weight
    FROM transactions_with_uom t
    WHERE date_trunc('month', t.transaction_date) = date_trunc('month', report_month)
    GROUP BY t.account_code
  ),
  account_uoms AS (
    SELECT DISTINCT ON (account_code) account_code, uom FROM products WHERE account_code IS NOT NULL
  )
SELECT
  au.account_code,
  au.uom,
  coalesce(os.total_opening_weight, 0) AS opening_stock_weight,
  coalesce(ma.total_inbound_weight, 0) AS inbound_weight,
  coalesce(ma.total_outbound_weight, 0) AS outbound_weight,
  coalesce(ma.total_adjustment_weight, 0) AS adjustment_weight,
  (
    coalesce(os.total_opening_weight, 0) +
    coalesce(ma.total_inbound_weight, 0) -
    coalesce(ma.total_outbound_weight, 0) +
    coalesce(ma.total_adjustment_weight, 0)
  ) AS closing_stock_weight
FROM account_uoms au
LEFT JOIN opening_stock_calc os ON au.account_code = os.account_code
LEFT JOIN monthly_aggs ma ON au.account_code = ma.account_code
WHERE
  coalesce(os.total_opening_weight, 0) != 0 OR
  coalesce(ma.total_inbound_weight, 0) != 0 OR
  coalesce(ma.total_outbound_weight, 0) != 0 OR
  coalesce(ma.total_adjustment_weight, 0) != 0
ORDER BY au.account_code;
$$;
