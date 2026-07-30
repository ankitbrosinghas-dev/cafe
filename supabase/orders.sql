create extension if not exists "pgcrypto";
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(), customer_name text not null check (char_length(customer_name) between 1 and 80), phone text not null check (char_length(phone) between 5 and 30), email text, address text not null check (char_length(address) between 1 and 500), items jsonb not null check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) > 0), subtotal numeric(10,2) not null check (subtotal >= 0), delivery_fee numeric(10,2) not null default 0 check (delivery_fee >= 0), total numeric(10,2) not null check (total >= 0), payment_method text not null, payment_status text not null default 'Pending', order_status text not null default 'Pending' check (order_status in ('Pending', 'Preparing', 'Ready', 'Out for Delivery', 'Delivered', 'Cancelled')), special_instructions text, created_at timestamptz not null default now()
);
create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_customer_phone_idx on public.orders (customer_name, phone);
alter table public.orders enable row level security;
-- These policies make the static admin work. Replace them with authenticated staff policies before a public launch.
create policy "Anyone can create an order" on public.orders for insert to anon, authenticated with check (true);
create policy "Anyone can view orders" on public.orders for select to anon, authenticated using (true);
create policy "Anyone can update orders" on public.orders for update to anon, authenticated using (true) with check (true);
alter publication supabase_realtime add table public.orders;
