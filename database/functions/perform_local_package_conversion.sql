-- =================================================================
-- LOCAL PACKAGE CONVERSION FUNCTION
-- This script defines the function to handle package conversions
-- for local inventory.
-- =================================================================

CREATE OR REPLACE FUNCTION public.perform_local_package_conversion(
    source_product_id_param character varying,
    target_product_id_param character varying,
    quantity_param numeric,
    conversion_date_param date,
    created_by_param uuid,
    notes_param text
)
RETURNS void AS $$
DECLARE
    out_transaction_id uuid;
    in_transaction_id uuid;
BEGIN
    -- Step 1: Insert the outbound transaction for the source product.
    INSERT INTO public.local_inventory (
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
        notes_param || ' (Source)'
    )
    RETURNING id INTO out_transaction_id;

    -- Step 2: Insert the inbound transaction for the target product.
    INSERT INTO public.local_inventory (
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
        notes_param || ' (Target)'
    )
    RETURNING id INTO in_transaction_id;

    -- Step 3: Update the source transaction to complete the circular reference.
    UPDATE public.local_inventory
    SET conversion_reference_id = in_transaction_id -- Link to the target transaction
    WHERE id = out_transaction_id;

END;
$$ LANGUAGE plpgsql;
