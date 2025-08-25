-- 优化后的月末库存计算函数
CREATE OR REPLACE FUNCTION calculate_month_end_stock(target_year INTEGER, target_month INTEGER)
RETURNS TABLE(product_id CHARACTER VARYING(50), stock NUMERIC) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    it.product_id,
    SUM(
      CASE 
        WHEN it.transaction_type IN ('IN', 'OPENING') THEN it.quantity
        WHEN it.transaction_type = 'OUT' THEN -it.quantity
        WHEN it.transaction_type = 'ADJUSTMENT' THEN 
          -- 假设 ADJUSTMENT 可以是正数或负数
          -- 如果你的业务逻辑不同，请相应调整
          it.quantity
        ELSE 0
      END
    ) as stock
  FROM inventory_transactions it
  WHERE it.transaction_date <= DATE(target_year || '-' || LPAD(target_month::TEXT, 2, '0') || '-01') + INTERVAL '1 MONTH' - INTERVAL '1 DAY'
  GROUP BY it.product_id
  HAVING SUM(
    CASE 
      WHEN it.transaction_type IN ('IN', 'OPENING') THEN it.quantity
      WHEN it.transaction_type = 'OUT' THEN -it.quantity
      WHEN it.transaction_type = 'ADJUSTMENT' THEN it.quantity
      ELSE 0
    END
  ) > 0;
END;
$$;

-- 性能优化索引建议
-- 1. 为日期范围查询优化的复合索引
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_date_product_type 
ON public.inventory_transactions 
USING btree (transaction_date, product_id, transaction_type);

-- 2. 如果经常按产品查询历史记录，这个索引会很有用
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_product_date_desc 
ON public.inventory_transactions 
USING btree (product_id, transaction_date DESC);

-- 3. 为了支持部分索引，可以考虑只索引非零数量的记录
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_nonzero_qty 
ON public.inventory_transactions 
USING btree (transaction_date, product_id) 
WHERE quantity != 0;
