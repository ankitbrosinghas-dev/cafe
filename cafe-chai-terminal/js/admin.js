/* js/admin.js — Admin dashboard logic */

/* ---- AUTH GUARD ---- */
if (!AdminAuth.isLoggedIn()) {
  window.location.href = 'login.html';
}

/* Refresh session check every minute */
setInterval(() => {
  if (!AdminAuth.isLoggedIn()) window.location.href = 'login.html';
}, 60000);

/* ---- STATE ---- */
let currentFilter = 'all';
let currentTab = 'orders';

/* ---- INIT ---- */
(function init() {
  const user = AdminAuth.getSessionUser();
  document.getElementById('adminNameDisplay').textContent = user;
  document.getElementById('adminAvatar').textContent = user.charAt(0).toUpperCase();
  refreshAll();
  /* Auto-refresh every 10 seconds */
  setInterval(refreshAll, 10000);

  /* Cursor */
  const cur = document.getElementById('cursor');
  document.addEventListener('mousemove', e => { cur.style.left = e.clientX + 'px'; cur.style.top = e.clientY + 'px'; });
  document.addEventListener('mousedown', () => cur.classList.add('big'));
  document.addEventListener('mouseup', () => cur.classList.remove('big'));
})();

function refreshAll() {
  updateStats();
  if (currentTab === 'orders') renderOrders();
  else if (currentTab === 'history') renderHistory();
  else if (currentTab === 'stats') renderStats();
}

/* ---- TABS ---- */
const TAB_META = {
  orders:   { title: 'Live orders',     subtitle: 'Manage and action incoming orders in real time' },
  history:  { title: 'Order history',   subtitle: 'Full log of all orders placed today and before' },
  stats:    { title: "Today's stats",   subtitle: 'Revenue, popular items and order breakdown' },
  settings: { title: 'Settings',        subtitle: 'Manage credentials and system data' }
};

function showTab(name) {
  currentTab = name;
  document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
  document.getElementById('tab-' + name).style.display = 'block';
  document.querySelectorAll('.snav-item').forEach(b => b.classList.remove('active'));
  event.currentTarget.classList.add('active');
  const meta = TAB_META[name];
  document.getElementById('tabTitle').textContent = meta.title;
  document.getElementById('tabSubtitle').textContent = meta.subtitle;
  document.getElementById('filterBar').style.display = (name === 'orders') ? 'flex' : 'none';
  document.getElementById('statRow').style.display = (name === 'orders' || name === 'stats') ? 'grid' : 'none';
  refreshAll();
}

/* ---- STATS ---- */
function updateStats() {
  const all = OrderStore.getAll();
  const today = OrderStore.todayOrders();
  const pending    = all.filter(o => o.status === 'pending').length;
  const accepted   = all.filter(o => o.status === 'accepted').length;
  const completed  = all.filter(o => o.status === 'completed').length;
  const cancelled  = all.filter(o => o.status === 'cancelled').length;
  const revenue    = today.filter(o => o.status === 'completed').reduce((s, o) => s + o.total, 0);

  document.getElementById('sPending').textContent   = pending;
  document.getElementById('sAccepted').textContent  = accepted;
  document.getElementById('sCompleted').textContent = completed;
  document.getElementById('sCancelled').textContent = cancelled;
  document.getElementById('sRevenue').textContent   = '₹' + revenue;
  document.getElementById('pendingBadge').textContent = pending + accepted;
}

/* ---- FILTER ---- */
function setFilter(f, el) {
  currentFilter = f;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  renderOrders();
}

/* ---- ORDERS GRID ---- */
function renderOrders() {
  const grid = document.getElementById('ordersGrid');
  let orders = OrderStore.getAll();
  const q = (document.getElementById('searchOrders')?.value || '').toLowerCase().trim();

  if (currentFilter !== 'all') orders = orders.filter(o => o.status === currentFilter);
  if (q) orders = orders.filter(o => o.customer.toLowerCase().includes(q) || o.token.includes(q));

  if (!orders.length) {
    grid.innerHTML = '<div class="no-orders-admin">No orders to show</div>';
    return;
  }

  grid.innerHTML = orders.map(o => `
    <div class="order-card-admin status-${o.status}" id="oc-${o.id}">
      <div class="oca-header">
        <span class="oca-token">#${o.token}</span>
        <span class="oca-badge badge-${o.status}">${capitalize(o.status)}</span>
      </div>
      <div class="oca-customer">${escHtml(o.customer)} · ${fmtTime(o.createdAt)}</div>
      <div class="oca-items">
        ${o.items.map(i => `<div class="oca-item-line"><span>${escHtml(i.name)}</span><span>×${i.qty} &nbsp; ₹${i.qty * i.price}</span></div>`).join('')}
      </div>
      <div class="oca-total"><span>Total</span><span>₹${o.total}</span></div>
      <div class="oca-actions">
        ${actionButtons(o)}
      </div>
    </div>
  `).join('');
}

function actionButtons(o) {
  const s = o.status;
  let btns = `<button class="oca-btn oca-btn-details" onclick="viewDetail('${o.id}')">Details</button>`;

  if (s === 'pending') {
    btns += `<button class="oca-btn oca-btn-accept" onclick="confirmAction('accept','${o.id}','Accept order #${o.token}?','Mark this order as accepted and start preparation.')">Accept</button>`;
    btns += `<button class="oca-btn oca-btn-cancel" onclick="confirmAction('cancel','${o.id}','Cancel order #${o.token}?','This cannot be undone. The customer will be notified.')">Cancel</button>`;
  } else if (s === 'accepted') {
    btns += `<button class="oca-btn oca-btn-ready" onclick="confirmAction('ready','${o.id}','Mark #${o.token} as ready?','This tells the customer their order is ready to collect.')">Ready</button>`;
    btns += `<button class="oca-btn oca-btn-cancel" onclick="confirmAction('cancel','${o.id}','Cancel order #${o.token}?','This cannot be undone.')">Cancel</button>`;
  } else if (s === 'ready') {
    btns += `<button class="oca-btn oca-btn-complete" onclick="confirmAction('complete','${o.id}','Complete order #${o.token}?','Mark as served and close this order.')">Complete</button>`;
  }
  return btns;
}

/* ---- ACTION CONFIRM DIALOG ---- */
let pendingAction = null;

function confirmAction(type, id, title, msg) {
  pendingAction = { type, id };
  document.getElementById('confirmTitle').textContent = title;
  document.getElementById('confirmMsg').textContent = msg;
  const okBtn = document.getElementById('confirmOkBtn');
  okBtn.textContent = type === 'cancel' ? 'Yes, cancel order' : type === 'complete' ? 'Mark complete' : 'Confirm';
  okBtn.className = 'confirm-ok-btn' + (type === 'cancel' ? '' : ' ok-green');
  document.getElementById('confirmDialog').style.display = 'flex';
}

function closeConfirm() {
  pendingAction = null;
  document.getElementById('confirmDialog').style.display = 'none';
}

document.getElementById('confirmOkBtn').onclick = function () {
  if (!pendingAction) return;
  const { type, id } = pendingAction;
  const statusMap = { accept: 'accepted', ready: 'ready', complete: 'completed', cancel: 'cancelled' };
  OrderStore.updateStatus(id, statusMap[type]);
  closeConfirm();
  refreshAll();
};

/* ---- ORDER DETAIL MODAL ---- */
function viewDetail(id) {
  const o = OrderStore.getAll().find(x => x.id === id);
  if (!o) return;
  document.getElementById('modalToken').textContent = '#' + o.token + ' — ' + escHtml(o.customer);
  document.getElementById('modalBody').innerHTML = `
    <div class="modal-detail-row"><span style="color:var(--text-dim)">Status</span><span><span class="oca-badge badge-${o.status}">${capitalize(o.status)}</span></span></div>
    <div class="modal-detail-row"><span style="color:var(--text-dim)">Time</span><span>${new Date(o.createdAt).toLocaleString()}</span></div>
    <div class="modal-detail-row"><span style="color:var(--text-dim)">Customer</span><span>${escHtml(o.customer)}</span></div>
    <div style="margin: 1rem 0 0.5rem; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-dim);">Items</div>
    ${o.items.map(i => `<div class="modal-detail-row"><span>${escHtml(i.name)}</span><span>×${i.qty} &nbsp; <span style="color:var(--gold)">₹${i.qty * i.price}</span></span></div>`).join('')}
    <div class="modal-detail-row" style="margin-top:4px; font-size:15px; font-weight:500"><span>Total</span><span style="color:var(--gold-light)">₹${o.total}</span></div>
  `;
  document.getElementById('orderModal').style.display = 'flex';
}

function closeModal() { document.getElementById('orderModal').style.display = 'none'; }
document.getElementById('orderModal').addEventListener('click', e => { if (e.target === document.getElementById('orderModal')) closeModal(); });

/* ---- HISTORY ---- */
function renderHistory() {
  const orders = OrderStore.getAll();
  const tbody = document.getElementById('historyBody');
  if (!orders.length) { tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--text-dim);font-style:italic;">No orders yet</td></tr>'; return; }
  tbody.innerHTML = orders.map(o => `
    <tr>
      <td style="color:var(--chai-light);font-weight:500">#${o.token}</td>
      <td>${escHtml(o.customer)}</td>
      <td style="color:var(--text-dim)">${o.items.map(i => i.name + ' ×' + i.qty).join(', ')}</td>
      <td style="color:var(--gold)">₹${o.total}</td>
      <td>${fmtTime(o.createdAt)}</td>
      <td><span class="oca-badge badge-${o.status}">${capitalize(o.status)}</span></td>
    </tr>
  `).join('');
}

/* ---- STATS ---- */
function renderStats() {
  const today = OrderStore.todayOrders();
  const revenue = today.filter(o => o.status === 'completed').reduce((s, o) => s + o.total, 0);

  /* Top items */
  const itemCounts = {};
  today.forEach(o => { if (o.status !== 'cancelled') o.items.forEach(i => { itemCounts[i.name] = (itemCounts[i.name] || 0) + i.qty; }); });
  const topItems = Object.entries(itemCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);

  /* Category breakdown */
  const catCounts = {};
  today.forEach(o => { if (o.status !== 'cancelled') o.items.forEach(i => { const cat = MENU.find(m => m.items.find(mi => mi.name === i.name)); if (cat) catCounts[cat.cat] = (catCounts[cat.cat] || 0) + i.qty; }); });

  document.getElementById('statsLayout').innerHTML = `
    <div class="stats-box">
      <div class="stats-box-title">Today's revenue</div>
      <div class="revenue-big">₹${revenue}</div>
      <div class="revenue-sub">${today.filter(o => o.status === 'completed').length} completed orders today</div>
    </div>
    <div class="stats-box">
      <div class="stats-box-title">Order breakdown today</div>
      ${['pending','accepted','ready','completed','cancelled'].map(s => {
        const c = today.filter(o => o.status === s).length;
        return `<div class="top-item-row"><span class="top-item-name">${capitalize(s)}</span><span class="top-item-count">${c}</span></div>`;
      }).join('')}
    </div>
    <div class="stats-box">
      <div class="stats-box-title">Top items today</div>
      ${topItems.length ? topItems.map(([name, count]) => `<div class="top-item-row"><span class="top-item-name">${escHtml(name)}</span><span class="top-item-count">${count} sold</span></div>`).join('') : '<div style="color:var(--text-dim);font-size:13px;padding:1rem 0">No sales yet today</div>'}
    </div>
    <div class="stats-box">
      <div class="stats-box-title">Popular categories today</div>
      ${Object.entries(catCounts).sort((a,b)=>b[1]-a[1]).map(([cat, c]) => `<div class="top-item-row"><span class="top-item-name">${escHtml(cat)}</span><span class="top-item-count">${c} items</span></div>`).join('') || '<div style="color:var(--text-dim);font-size:13px;padding:1rem 0">No data yet</div>'}
    </div>
  `;
}

/* ---- SETTINGS ---- */
function changePassword() {
  const cur  = document.getElementById('curPw').value;
  const nw   = document.getElementById('newPw').value;
  const conf = document.getElementById('confirmPw').value;
  const msg  = document.getElementById('pwChangeMsg');
  msg.style.display = 'none';
  if (nw !== conf) { showMsg(msg, 'error', 'New passwords do not match.'); return; }
  const res = AdminAuth.changePassword(cur, nw);
  showMsg(msg, res.success ? 'success' : 'error', res.message);
  if (res.success) { document.getElementById('curPw').value = ''; document.getElementById('newPw').value = ''; document.getElementById('confirmPw').value = ''; }
}

function changeUsername() {
  const pw   = document.getElementById('userConfirmPw').value;
  const name = document.getElementById('newUsername').value.trim();
  const msg  = document.getElementById('userChangeMsg');
  msg.style.display = 'none';
  const res = AdminAuth.changeUsername(pw, name);
  showMsg(msg, res.success ? 'success' : 'error', res.message);
  if (res.success) {
    document.getElementById('adminNameDisplay').textContent = name;
    document.getElementById('adminAvatar').textContent = name.charAt(0).toUpperCase();
    document.getElementById('userConfirmPw').value = '';
    document.getElementById('newUsername').value = '';
  }
}

function showMsg(el, type, text) {
  el.className = 'pw-change-msg ' + type;
  el.textContent = text;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 4000);
}

function clearAllOrders() {
  confirmAction('cancel', '_ALL_', 'Clear all order data?', 'This will permanently delete all orders. This cannot be undone.');
  document.getElementById('confirmOkBtn').onclick = function () {
    OrderStore.clearAll();
    closeConfirm();
    refreshAll();
  };
}

function doLogout() {
  AdminAuth.logout();
  window.location.href = 'login.html';
}

/* ---- HELPERS ---- */
function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
function escHtml(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
