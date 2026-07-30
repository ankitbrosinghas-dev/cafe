import { requireRole, signOut, signIn, updatePassword, updateProfile } from '../lib/auth.js';
import { OrderService } from '../services/order-service.js';
const profile = await requireRole(['staff', 'admin'], '../auth/login.html');
if (!profile) throw new Error('Redirecting to sign in.');
const STATUSES = ['pending', 'accepted', 'preparing', 'ready_for_pickup', 'completed', 'cancelled'];
const STATUS_MAP = {
  pending: 'Pending',
  accepted: 'Accepted',
  preparing: 'Preparing',
  ready_for_pickup: 'Ready for Pickup',
  completed: 'Completed',
  cancelled: 'Cancelled'
};
let orders = [], currentFilter = 'all', currentTab = 'orders';
const esc = v => { const e = document.createElement('div'); e.textContent = v ?? ''; return e.innerHTML; };
const money = v => `₹${Number(v || 0).toFixed(2).replace(/\.00$/, '')}`;
const fmt = v => new Date(v).toLocaleString();
async function loadOrders() { try { orders = await OrderService.getAll(); renderCurrent(); } catch (error) { document.getElementById('ordersGrid').innerHTML = `<div class="no-orders-admin">${esc(error.message || 'Unable to load orders.')}</div>`; } }
function renderCurrent() { updateStats(); if (currentTab === 'orders') renderOrders(); else if (currentTab === 'history') renderHistory(); else if (currentTab === 'stats') renderStats(); }
function updateStats() {
  const count = status => orders.filter(o => o.orderStatus === status).length;
  document.getElementById('sPending').textContent = count('pending');
  document.getElementById('sAccepted').textContent = count('accepted') + count('preparing') + count('ready_for_pickup');
  document.getElementById('sCompleted').textContent = count('completed');
  document.getElementById('sCancelled').textContent = count('cancelled');
  document.getElementById('sRevenue').textContent = money(orders.filter(o => o.orderStatus === 'completed').reduce((sum, o) => sum + Number(o.total), 0));
  document.getElementById('pendingBadge').textContent = count('pending') + count('accepted') + count('preparing') + count('ready_for_pickup');
}
function filtered() { const q = (document.getElementById('searchOrders')?.value || '').toLowerCase().trim(); return orders.filter(o => (currentFilter === 'all' || o.orderStatus === currentFilter) && (!q || o.customerName.toLowerCase().includes(q) || o.phone.toLowerCase().includes(q))); }
function renderOrders() { const grid = document.getElementById('ordersGrid'), list = filtered(); if (!list.length) { grid.innerHTML = '<div class="no-orders-admin">No orders to show</div>'; return; } grid.innerHTML = list.map(o => `<div class="order-card-admin"><div class="oca-header"><span class="oca-token">#${o.orderNumber.slice(0,8).toUpperCase()}</span><span class="oca-badge">${esc(STATUS_MAP[o.orderStatus] || o.orderStatus)}</span></div><div class="oca-customer">${esc(o.customerName)} · ${esc(o.phone)} · ${fmt(o.createdAt)}</div><div class="oca-items">${o.items.map(i => `<div class="oca-item-line"><span>${esc(i.name)}</span><span>×${i.quantity} &nbsp; ${money(i.subtotal)}</span></div>`).join('')}</div><div class="oca-total"><span>Total</span><span>${money(o.total)}</span></div><div class="oca-actions"><button class="oca-btn oca-btn-details" onclick="viewDetail('${o.orderNumber}')">Details</button><select class="oca-btn" onchange="changeStatus('${o.orderNumber}',this.value)">${STATUSES.map(s => `<option value="${s}" ${s === o.orderStatus ? 'selected' : ''}>${STATUS_MAP[s] || s}</option>`).join('')}</select></div></div>`).join(''); }
async function changeStatus(id, status) { try { await OrderService.updateStatus(id, status); await loadOrders(); } catch (error) { alert(error.message || 'Could not update this order.'); } }
function viewDetail(id) { const o = orders.find(x => x.orderNumber === id); if (!o) return; document.getElementById('modalToken').textContent = '#' + o.orderNumber.slice(0,8).toUpperCase() + ' — ' + o.customerName; document.getElementById('modalBody').innerHTML = `<div class="modal-detail-row"><span>Phone</span><span>${esc(o.phone)}</span></div><div class="modal-detail-row"><span>Address</span><span>${esc(o.address)}</span></div><div class="modal-detail-row"><span>Payment</span><span>${esc(o.payment_method)} (${esc(o.payment_status)})</span></div><div class="modal-detail-row"><span>Instructions</span><span>${esc(o.special_instructions || 'None')}</span></div>${o.items.map(i => `<div class="modal-detail-row"><span>${esc(i.name)} ×${i.quantity}</span><span>${money(i.subtotal)}</span></div>`).join('')}<div class="modal-detail-row"><span>Total</span><span>${money(o.total)}</span></div>`; document.getElementById('orderModal').style.display = 'flex'; }
function renderHistory() { document.getElementById('historyBody').innerHTML = orders.map(o => `<tr><td>#${o.orderNumber.slice(0,8).toUpperCase()}</td><td>${esc(o.customerName)}<br><small>${esc(o.phone)}</small></td><td>${o.items.map(i => `${esc(i.name)} ×${i.quantity}`).join(', ')}</td><td>${money(o.total)}</td><td>${fmt(o.createdAt)}</td><td>${esc(STATUS_MAP[o.orderStatus] || o.orderStatus)}</td></tr>`).join('') || '<tr><td colspan="6">No orders yet</td></tr>'; }
function renderStats() { document.getElementById('statsLayout').innerHTML = STATUSES.map(s => `<div class="stats-box"><div class="stats-box-title">${STATUS_MAP[s] || s}</div><div class="revenue-big">${orders.filter(o => o.orderStatus === s).length}</div></div>`).join(''); }
function showTab(name) { currentTab=name; document.querySelectorAll('.tab-content').forEach(t=>t.style.display='none'); document.getElementById('tab-'+name).style.display='block'; document.getElementById('filterBar').style.display=name==='orders'?'flex':'none'; renderCurrent(); }
function setFilter(f,el) { currentFilter=f; document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active')); el.classList.add('active'); renderOrders(); }
function closeModal(){document.getElementById('orderModal').style.display='none';} function refreshAll(){loadOrders();} async function doLogout(){await signOut();window.location.href='../auth/login.html';}
Object.assign(window,{showTab,setFilter,viewDetail,changeStatus,closeModal,refreshAll,doLogout});
(function(){const u=profile.full_name;document.getElementById('adminNameDisplay').textContent=u;document.getElementById('adminAvatar').textContent=u.charAt(0).toUpperCase();document.getElementById('orderModal').addEventListener('click',e=>{if(e.target.id==='orderModal')closeModal();});loadOrders();try{OrderService.subscribe(loadOrders);}catch(_){ }setInterval(loadOrders,30000);})();

function showSettingsMessage(id, type, message) { const el = document.getElementById(id); el.className = 'pw-change-msg ' + type; el.textContent = message; el.style.display = 'block'; setTimeout(() => { el.style.display = 'none'; }, 4000); }
async function changePassword() { const current = document.getElementById('curPw').value, next = document.getElementById('newPw').value, confirm = document.getElementById('confirmPw').value; if (next !== confirm) return showSettingsMessage('pwChangeMsg', 'error', 'New passwords do not match.'); try { await signIn(profile.email, current); await updatePassword(next); showSettingsMessage('pwChangeMsg', 'success', 'Password updated successfully.'); } catch (error) { showSettingsMessage('pwChangeMsg', 'error', error.message || 'Unable to update password.'); } }
async function changeUsername() { const password = document.getElementById('userConfirmPw').value, name = document.getElementById('newUsername').value.trim(); try { await signIn(profile.email, password); profile.full_name = (await updateProfile(name)).full_name; document.getElementById('adminNameDisplay').textContent = name; document.getElementById('adminAvatar').textContent = name.charAt(0).toUpperCase(); showSettingsMessage('userChangeMsg', 'success', 'Username updated successfully.'); } catch (error) { showSettingsMessage('userChangeMsg', 'error', error.message || 'Unable to update username.'); } }
function clearAllOrders() { showSettingsMessage('pwChangeMsg', 'error', 'Bulk deletion is disabled for Supabase orders. Delete records from Supabase only when required.'); }
Object.assign(window, { changePassword, changeUsername, clearAllOrders });
