# Authentication and roles

1. In Supabase Authentication → URL Configuration, set the production Site URL and add these redirect URLs:
   - `https://YOUR_DOMAIN/auth/login.html`
   - `https://YOUR_DOMAIN/auth/reset-password.html`
2. Enable Email provider and turn on **Confirm email**.
3. Apply `supabase/migrations/001_production_schema.sql` in the SQL editor.
4. New users are `customer` by default. Promote verified operators server-side only:
   `update public.profiles set role = 'staff' where email = 'staff@example.com';`
   Use `admin` only for trusted administrators.

The browser only receives the Supabase anon key. Supabase manages session persistence and token refresh; staff/admin route checks query the protected `profiles` record.
