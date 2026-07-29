/* js/storage.js — Shared order storage (localStorage) */

const OrderStore = (() => {
  const KEY = 'cct_orders';
  const TOKEN_KEY = 'cct_token_counter';

  function getAll() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; }
    catch(e) { return []; }
  }

  function save(orders) {
    localStorage.setItem(KEY, JSON.stringify(orders));
  }

  function nextToken() {
    const n = parseInt(localStorage.getItem(TOKEN_KEY) || '0', 10) + 1;
    localStorage.setItem(TOKEN_KEY, String(n));
    return String(n).padStart(2, '0');
  }

  function addOrder(customerName, items) {
    const orders = getAll();
    const total = items.reduce((s, i) => s + i.qty * i.price, 0);
    const order = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      token: nextToken(),
      customer: customerName,
      items,
      total,
      status: 'pending', /* pending | accepted | ready | completed | cancelled */
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      note: ''
    };
    orders.unshift(order);
    save(orders);
    return order;
  }

  function updateStatus(id, status) {
    const orders = getAll();
    const idx = orders.findIndex(o => o.id === id);
    if (idx === -1) return false;
    orders[idx].status = status;
    orders[idx].updatedAt = new Date().toISOString();
    save(orders);
    return true;
  }

  function getByToken(token) {
    return getAll().find(o => o.token === token) || null;
  }

  function clearAll() {
    localStorage.removeItem(KEY);
    localStorage.removeItem(TOKEN_KEY);
  }

  function todayOrders() {
    const today = new Date().toDateString();
    return getAll().filter(o => new Date(o.createdAt).toDateString() === today);
  }

  return { getAll, addOrder, updateStatus, getByToken, clearAll, todayOrders };
})();
