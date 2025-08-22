-- =================================================================
-- PACKAGE CONVERSION FUNCTION
-- This script defines the function to handle package conversions.
-- It should be run in your Supabase SQL Editor.
-- =================================================================

-- IMPORTANT:
-- If you have not already added the new columns to your inventory_transactions table,
-- you may need to run a command like this first. The user who requested this
-- feature provided the table structure, so this might not be necessary.
--
-- ALTER TABLE public.inventory_transactions
-- ADD COLUMN is_conversion BOOLEAN NOT NULL DEFAULT false,
-- ADD COLUMN conversion_reference_id UUID NULL;
--
-- ALTER TABLE public.inventory_transactions
-- ADD CONSTRAINT inventory_transactions_conversion_reference_fkey
-- FOREIGN KEY (conversion_reference_id) REFERENCES public.inventory_transactions(id);

-- =================================================================

-- This function performs a package conversion by creating two linked
-- inventory transactions: one 'OUT' for the source product and one 'IN'
-- for the target product.

CREATE OR REPLACE FUNCTION public.perform_package_conversion(
    source_product_id_param character varying,
    target_product_id_param character varying,
    quantity_param numeric,
    conversion_date_param date,
    created_by_param uuid
)
RETURNS void AS $$
DECLARE
    out_transaction_id uuid;
    in_transaction_id uuid;
BEGIN
    -- Step 1: Insert the outbound transaction for the source product.
    -- The conversion_reference_id is left NULL initially.
    INSERT INTO public.inventory_transactions (
        product_id,
        transaction_type,
        quantity,
        transaction_date,
        created_by,
        is_conversion,
        notes
    )
    VALUES (
        source_product_id_param,
        'OUT',
        quantity_param,
        conversion_date_param,
        created_by_param,
        true,
        'Package Conversion: Source'
    )
    RETURNING id INTO out_transaction_id;

    -- Step 2: Insert the inbound transaction for the target product,
    -- linking it back to the source transaction.
    INSERT INTO public.inventory_transactions (
        product_id,
        transaction_type,
        quantity,
        transaction_date,
        created_by,
        is_conversion,
        conversion_reference_id,
        notes
    )
    VALUES (
        target_product_id_param,
        'IN',
        quantity_param,
        conversion_date_param,
        created_by_param,
        true,
        out_transaction_id, -- Link to the source transaction
        'Package Conversion: Target'
    )
    RETURNING id INTO in_transaction_id;

    -- Step 3: Update the source transaction to complete the circular reference.
    UPDATE public.inventory_transactions
    SET conversion_reference_id = in_transaction_id -- Link to the target transaction
    WHERE id = out_transaction_id;

END;
$$ LANGUAGE plpgsql;
