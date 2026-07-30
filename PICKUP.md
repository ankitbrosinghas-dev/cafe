# Pickup QR flow

Apply `003_pickup_tokens.sql` after earlier migrations. It gives each order a 24-hour opaque pickup token. QR codes contain only `https://YOUR_DOMAIN/pickup.html?token=TOKEN`; they never contain an order ID, customer information, or totals.

- Customers see QR codes on confirmation and My Orders. Completed/cancelled orders show an inactive code.
- `/pickup.html` requires a signed-in `staff` or `admin` profile.
- `GET /api/pickup/:token` verifies the token and returns only staff-facing order details.
- `POST /api/pickup/:token` completes a ready-for-pickup order once and records an audit entry.
- Expired, invalid, cancelled, and previously collected tokens are rejected.

Enable the `orders` table in the `supabase_realtime` publication (already included in the base migration) for dashboard status refresh.
