# Café Chai Terminal — VS Code Setup Guide

## Project Structure
```
cafe-chai-terminal/
├── index.html              ← Customer ordering page
├── admin/
│   ├── login.html          ← Admin login (secure)
│   └── dashboard.html      ← Admin panel (orders, stats, settings)
├── css/
│   ├── style.css           ← Main styles (customer page)
│   └── admin.css           ← Admin panel styles
├── js/
│   ├── menu-data.js        ← All menu items & prices
│   ├── storage.js          ← Order storage (localStorage)
│   ├── security.js         ← Login, lockout, session auth
│   ├── main.js             ← Customer page logic
│   └── admin.js            ← Admin dashboard logic
└── README.md
```

---

## How to Run

### Option 1 — VS Code Live Server (recommended)
1. Install the **Live Server** extension in VS Code
2. Right-click `index.html` → **Open with Live Server**
3. The site opens at `http://127.0.0.1:5500`

### Option 2 — Open directly
Just double-click `index.html` in your file explorer.

---

## Default Admin Credentials

| Field    | Value      |
|----------|------------|
| Username | `admin`    |
| Password | `chai@2024`|

**Change these immediately** via Admin Panel → Settings.

Access admin panel: `http://127.0.0.1:5500/admin/login.html`
Or click **Staff login** in the top navigation.

---

## Security Features

| Feature                 | Detail                              |
|-------------------------|-------------------------------------|
| Password hashing        | djb2 hash (never plain text stored) |
| Login lockout           | 5 failed attempts → 5 min lockout   |
| Session expiry          | Auto-logout after 4 hours           |
| Session storage         | Session token in sessionStorage      |
| Auth guard              | Dashboard redirects if not logged in|
| XSS protection          | All user input is HTML-escaped      |
| Input length limits     | Username 32 chars, password 64 chars|

---

## How Orders Flow

1. **Customer** visits `index.html`, adds items to cart, places order
2. Order saved to `localStorage` with status `pending`
3. **Admin** visits `admin/dashboard.html`, sees live orders
4. Admin clicks **Accept** → status becomes `accepted`
5. Admin clicks **Ready** → status becomes `ready`
6. Customer ticket screen updates automatically (polls every 5s)
7. Admin clicks **Complete** → order closed with status `completed`
8. Admin can **Cancel** any order at pending or accepted stage

---

## Customising the Menu

Edit `js/menu-data.js` — each category follows this format:

```js
{ cat: "Category Name", items: [
  { name: "Item Name", price: 99 },
]}
```

---

## Notes

- All data is stored in the **browser's localStorage** (no backend needed)
- Orders persist across page refreshes but are per-browser
- For a real multi-device setup, you'd need a backend (Node.js + database)
- To reset all orders: Admin Panel → Settings → "Clear all orders data"
