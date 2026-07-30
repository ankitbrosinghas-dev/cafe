import { OrderService } from '../services/order-service.js';
import { MENU } from './menu-data.js';
import QRCode from 'qrcode';

/* js/main.js Ã¢â‚¬â€ Customer ordering page logic */

let cart = {};

/* ---- CURSOR (desktop only) ---- */
const cursor = document.getElementById('cursor');
const isTouchDevice = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;

if (!isTouchDevice) {
  document.addEventListener('mousemove', e => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
  });
  document.querySelectorAll('a, button, .menu-item, .cat-btn, .step').forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('hovering'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('hovering'));
  });
}

/* ---- NAV HAMBURGER ---- */
const hamburger = document.getElementById('navHamburger');
const navLinks  = document.getElementById('navLinks');
hamburger?.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  navLinks.classList.toggle('open');
  document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
});
function closeNav() {
  hamburger?.classList.remove('open');
  navLinks?.classList.remove('open');
  document.body.style.overflow = '';
}


/* ---- MAGNETIC BUTTONS ---- */
document.querySelectorAll('.btn-primary, .btn-ghost').forEach(btn => {
  btn.addEventListener('mousemove', e => {
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    btn.style.transform = `translate(${x * 0.25}px, ${y * 0.25}px)`;
  });
  btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
});

/* ---- PROGRESS BAR + NAV SCROLL ---- */
const progressBar = document.getElementById('progress-bar');
const nav = document.getElementById('main-nav');
const menuSection = document.getElementById('menu-section');

window.addEventListener('scroll', () => {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  progressBar.style.width = (scrollTop / docHeight * 100) + '%';
  nav.classList.toggle('scrolled', scrollTop > 60);
}, { passive: true });

/* ---- PARTICLES ---- */
(function () {
  const canvas = document.getElementById('particles');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, pts = [];
  function resize() { W = canvas.width = canvas.offsetWidth; H = canvas.height = canvas.offsetHeight; }
  resize(); window.addEventListener('resize', resize);
  for (let i = 0; i < 60; i++) {
    pts.push({ x: Math.random() * 1920, y: Math.random() * 1080, vx: (Math.random() - 0.5) * 0.2, vy: (Math.random() - 0.5) * 0.2, r: Math.random() * 1.5 + 0.3 });
  }
  function frame() {
    ctx.clearRect(0, 0, W, H);
    pts.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(200,154,58,0.5)'; ctx.fill();
    });
    pts.forEach((a, i) => {
      pts.slice(i + 1).forEach(b => {
        const dx = a.x - b.x, dy = a.y - b.y, d = Math.sqrt(dx * dx + dy * dy);
        if (d < 110) {
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(200,154,58,${0.1 * (1 - d / 110)})`; ctx.lineWidth = 0.5; ctx.stroke();
        }
      });
    });
    requestAnimationFrame(frame);
  }
  frame();
})();

/* ---- SCROLL REVEAL ---- */
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('shown'); });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal-fade, .reveal-slide').forEach(el => observer.observe(el));

/* ---- MENU SPOTLIGHT ---- */
function initSpotlight() {
  document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('mousemove', e => {
      const rect = item.getBoundingClientRect();
      item.style.setProperty('--x', `${e.clientX - rect.left}px`);
      item.style.setProperty('--y', `${e.clientY - rect.top}px`);
    });
  });
}

/* ---- MENU RENDERING ---- */
function renderMenuSection() {
  const nav = document.getElementById('catNav');
  const grid = document.getElementById('menuGrid');
  nav.innerHTML = ''; grid.innerHTML = '';

  MENU.forEach((cat, ci) => {
    const btn = document.createElement('button');
    btn.className = 'cat-btn' + (ci === 0 ? ' active' : '');
    btn.textContent = cat.cat;
    btn.onclick = () => {
      document.getElementById('cat-' + ci).scrollIntoView({ behavior: 'smooth', block: 'start' });
      document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    };
    nav.appendChild(btn);

    const sec = document.createElement('div');
    sec.className = 'menu-cat-section reveal-fade';
    sec.id = 'cat-' + ci;
    sec.innerHTML = `<div class="menu-cat-title">${cat.cat}</div>`;

    const itemGrid = document.createElement('div');
    itemGrid.className = 'menu-items-grid';

    cat.items.forEach(item => {
      const key = item.name;
      const qty = cart[key]?.qty || 0;
      const div = document.createElement('div');
      div.className = 'menu-item' + (qty > 0 ? ' in-cart' : '');
      div.id = 'mi-' + key.replace(/\s/g, '_');
      div.innerHTML = `
        <div class="item-info">
          <div class="item-name">${escHtml(item.name)}</div>
          <div class="item-price">₹${item.price}</div>
        </div>
        <div class="item-controls">
          ${qty === 0
            ? `<button class="ctrl-btn" onclick="addItem('${escAttr(key)}',${item.price})">+</button>`
            : `<button class="ctrl-btn" onclick="changeQty('${escAttr(key)}',-1)">-</button>
               <span class="ctrl-qty">${qty}</span>
               <button class="ctrl-btn" onclick="changeQty('${escAttr(key)}',1)">+</button>`
          }
        </div>`;
      itemGrid.appendChild(div);
    });

    sec.appendChild(itemGrid);
    grid.appendChild(sec);
    observer.observe(sec);
  });

  initSpotlight();
}

function escHtml(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
function escAttr(s) { return s.replace(/'/g, "\\'"); }

function addItem(name, price) { cart[name] = { qty: 1, price }; renderMenuSection(); updateCartBar(); }
function changeQty(name, delta) {
  if (!cart[name]) return;
  cart[name].qty += delta;
  if (cart[name].qty <= 0) delete cart[name];
  renderMenuSection(); updateCartBar();
}

function updateCartBar() {
  const keys = Object.keys(cart);
  const total = keys.reduce((sum, key) => sum + cart[key].qty * cart[key].price, 0);
  const count = keys.reduce((sum, key) => sum + cart[key].qty, 0);
  document.getElementById('cartCount').textContent = count;
  document.getElementById('cartSummary').textContent = count === 1 ? 'item' : 'items';
  document.getElementById('cartTotalBar').textContent = 'Rs. ' + total;
  document.getElementById('cart-bar').classList.toggle('visible', count > 0);
}
/* ---- ORDER PANEL ---- */
function openOrder() {
  const keys = Object.keys(cart);
  let html = '', total = 0;
  keys.forEach(key => { const { qty, price } = cart[key]; const subtotal = qty * price; total += subtotal; html += `<div class="order-line"><span class="order-line-name">${escHtml(key)}</span><span class="order-line-qty">x${qty}</span><span class="order-line-price">Rs. ${subtotal}</span></div>`; });
  document.getElementById('orderLines').innerHTML = html || '<p style="color:rgba(253,246,236,0.3);font-size:13px;padding:1rem 0">Cart is empty</p>';
  document.getElementById('orderTotal').textContent = 'Rs. ' + total;
  document.getElementById('placeBtn').disabled = keys.length === 0;
  document.getElementById('order-panel').classList.add('open');
}function closeOrder() { document.getElementById('order-panel').classList.remove('open'); }

/* ---- PLACE ORDER ---- */
let isSubmittingOrder = false;

function setOrderMessage(message, type = 'error') {
  const el = document.getElementById('orderMessage');
  el.textContent = message;
  el.className = 'order-message ' + type;
}

async function placeOrder() {
  if (isSubmittingOrder) return;
  const name = document.getElementById('customerName').value.trim();
  const phone = document.getElementById('customerPhone').value.trim();
  const address = document.getElementById('customerAddress').value.trim();
  const paymentMethod = document.getElementById('paymentMethod').value;
  const keys = Object.keys(cart);
  if (!keys.length) return setOrderMessage('Your cart is empty. Add an item before placing an order.');
  if (!name || !phone || !address) return setOrderMessage('Please enter your name, phone number, and pickup details.');
  const items = keys.map(k => ({ productName: k, quantity: cart[k].qty }));
  const btn = document.getElementById('placeBtn'); isSubmittingOrder = true; btn.disabled = true; btn.textContent = 'Saving order...'; setOrderMessage('');
  try {
    const { order } = await OrderService.create({ items, paymentMethod: paymentMethod === 'Cash' ? 'cash_at_counter' : paymentMethod.toLowerCase(), idempotencyKey: crypto.randomUUID() });
    document.getElementById('tToken').textContent = '#' + order.orderNumber;
    document.getElementById('tCustomer').textContent = name;
    document.getElementById('tTotal').textContent = 'Rs. ' + order.total;
    document.getElementById('tStatus').textContent = 'Order received. We will begin preparing it shortly.';
    const qr = document.getElementById('tQrCode'); qr.src = await QRCode.toDataURL(window.location.origin + '/pickup.html?token=' + encodeURIComponent(order.pickupToken), { width: 220, margin: 1 }); qr.hidden = false;
    document.getElementById('tItems').innerHTML = keys.map(k => `<div class="ticket-item-line"><span>${escHtml(k)} x${cart[k].qty}</span><span>Rs. ${cart[k].qty * cart[k].price}</span></div>`).join('');
    cart = {}; closeOrder(); document.getElementById('ticket-panel').classList.add('open'); renderMenuSection(); updateCartBar();
  } catch (error) { setOrderMessage(error.message || 'Unable to place your order. Please check your connection and try again.'); }
  finally { isSubmittingOrder = false; btn.disabled = false; btn.textContent = 'Confirm order'; }
}function newOrder() {
  cart = {};
  ['customerName','customerPhone','customerEmail','customerAddress','specialInstructions'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('ticket-panel').classList.remove('open');
  renderMenuSection(); updateCartBar();
  document.getElementById('menu-section').scrollIntoView({ behavior: 'smooth' });
}

/* ---- INIT ---- */
renderMenuSection();
updateCartBar();

