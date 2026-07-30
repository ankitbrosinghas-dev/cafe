-- Pickup-token lifecycle and safe staff verification.
alter table public.orders add column if not exists pickup_token_expires_at timestamptz;
update public.orders set pickup_token_expires_at = created_at + interval '24 hours' where pickup_token_expires_at is null;
alter table public.orders alter column pickup_token_expires_at set not null;
alter table public.orders alter column pickup_token_expires_at set default (now() + interval '24 hours');
create index if not exists orders_pickup_token_idx on public.orders(pickup_token);
-- Use a short-lived token. Completed/cancelled/expired tokens are rejected by the pickup API.
create or replace function public.create_cafe_order(p_user_id uuid, p_items jsonb, p_payment_method text, p_idempotency_key uuid)
returns table(order_number text, pickup_token text, subtotal numeric, tax numeric, total numeric, order_status public.order_status, payment_status public.payment_status, created_at timestamptz)
language plpgsql security definer set search_path = public as $$
declare v_order public.orders%rowtype; v_subtotal numeric(10,2); v_tax numeric(10,2) := 0; v_item jsonb; v_product public.products%rowtype; v_quantity int;
begin
 if p_payment_method not in ('cash_at_counter','upi','razorpay','stripe') then raise exception 'INVALID_PAYMENT_METHOD'; end if;
 if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items)=0 then raise exception 'EMPTY_CART'; end if;
 select * into v_order from public.orders where idempotency_key=p_idempotency_key; if found then return query select v_order.order_number,v_order.pickup_token,v_order.subtotal,v_order.tax,v_order.total,v_order.order_status,v_order.payment_status,v_order.created_at; return; end if;
 v_subtotal:=0; for v_item in select value from jsonb_array_elements(p_items) loop v_quantity := (v_item->>'quantity')::int; if v_quantity is null or v_quantity < 1 or v_quantity > 20 then raise exception 'INVALID_QUANTITY'; end if; select * into v_product from public.products where id=(v_item->>'product_id')::uuid and available=true for share; if not found then raise exception 'PRODUCT_UNAVAILABLE'; end if; v_subtotal:=v_subtotal+v_product.price*v_quantity; end loop;
 insert into public.orders(user_id,customer_name,email,phone,subtotal,tax,total,payment_method,idempotency_key,pickup_token_expires_at) select p.id,p.full_name,p.email,p.phone,v_subtotal,v_tax,v_subtotal+v_tax,p_payment_method,p_idempotency_key,now()+interval '24 hours' from public.profiles p where p.id=p_user_id returning * into v_order;
 for v_item in select value from jsonb_array_elements(p_items) loop select * into v_product from public.products where id=(v_item->>'product_id')::uuid; v_quantity:=(v_item->>'quantity')::int; insert into public.order_items(order_id,product_id,product_name,unit_price,quantity,line_total) values(v_order.id,v_product.id,v_product.name,v_product.price,v_quantity,v_product.price*v_quantity); end loop;
 insert into public.audit_logs(actor_id,action,entity_type,entity_id,metadata) values(p_user_id,'order.created','order',v_order.id,jsonb_build_object('order_number',v_order.order_number)); return query select v_order.order_number,v_order.pickup_token,v_order.subtotal,v_order.tax,v_order.total,v_order.order_status,v_order.payment_status,v_order.created_at;
end $$;
