# Order API

All order APIs require `Authorization: Bearer <Supabase access token>` and return `{ error: { code, message } }` on failure.

- `POST /api/orders` — customer-only order creation. Body: `{ items: [{ productName, quantity }], paymentMethod, idempotencyKey }`. The service resolves current available products and prices server-side; client totals are ignored. The idempotency UUID makes retries safe.
- `GET /api/orders` — customer receives their orders; staff/admin receives all orders. Supports `page`, `pageSize`, `status`.
- `GET /api/orders/:orderNumber` — owner or staff/admin only.
- `PATCH /api/orders/:orderNumber` and `POST /api/orders/:orderNumber/status` — staff/admin only; validates ordered status transitions.
- `POST /api/orders/:orderNumber/cancel` — owner only while status is `pending`.
- `GET /api/orders/customer`, `/active`, `/history` — authenticated customer order lists.

Apply migrations `001_production_schema.sql` then `002_order_api.sql`. Populate `products` with the current menu before accepting orders; the API deliberately rejects missing or unavailable products rather than trusting browser menu prices.
