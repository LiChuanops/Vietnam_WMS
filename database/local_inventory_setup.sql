create table public.local_inventory (
  id uuid not null default gen_random_uuid (),
  product_id character varying(50) null,
  transaction_type character varying(15) null,
  quantity numeric(10, 2) not null,
  transaction_date date not null,
  reference_number character varying(100) null,
  notes text null,
  created_at timestamp without time zone null default now(),
  created_by uuid null,
  batch_number character varying(100) null,
  shipment_info jsonb null,
  is_conversion boolean not null default false,
  conversion_reference_id uuid null,
  constraint local_inventory_pkey primary key (id),
  constraint local_inventory_conversion_reference_fkey foreign KEY (conversion_reference_id) references public.local_inventory (id),
  constraint local_inventory_created_by_fkey foreign KEY (created_by) references public.profiles (id),
  constraint local_inventory_product_id_fkey foreign KEY (product_id) references public.products (system_code),
  constraint local_inventory_transaction_type_check check (
    (
      (transaction_type)::text = any (
        array[
          ('IN'::character varying)::text,
          ('OUT'::character varying)::text,
          ('OPENING'::character varying)::text,
          ('ADJUSTMENT'::character varying)::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_local_inventory_product_date on public.local_inventory using btree (product_id, transaction_date) TABLESPACE pg_default;

create index IF not exists idx_local_inventory_date_type on public.local_inventory using btree (transaction_date, transaction_type) TABLESPACE pg_default;

create index IF not exists idx_local_inventory_type on public.local_inventory using btree (transaction_type) TABLESPACE pg_default;

create index IF not exists idx_local_inventory_batch on public.local_inventory using btree (batch_number) TABLESPACE pg_default;

create index IF not exists idx_local_inventory_conversion_ref on public.local_inventory using btree (conversion_reference_id) TABLESPACE pg_default;

create index IF not exists idx_local_inventory_date_product_type on public.local_inventory using btree (transaction_date, product_id, transaction_type) TABLESPACE pg_default;

create index IF not exists idx_local_inventory_product_date_desc on public.local_inventory using btree (product_id, transaction_date desc) TABLESPACE pg_default;

create index IF not exists idx_local_inventory_nonzero_qty on public.local_inventory using btree (transaction_date, product_id) TABLESPACE pg_default
where
  (quantity <> (0)::numeric);
