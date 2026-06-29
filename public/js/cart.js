/* ── TaiLand Cart System ── */
(function () {
  'use strict';

  // ── State ──
  let cart = JSON.parse(localStorage.getItem('tailand_cart') || '[]');

  function saveCart() {
    localStorage.setItem('tailand_cart', JSON.stringify(cart));
  }

  // ── Cart operations ──
  function addItem(id, nameVi, nameEn, price, category) {
    const existing = cart.find(i => i.id === id);
    if (existing) {
      existing.qty++;
    } else {
      cart.push({ id, nameVi, nameEn, price: parseInt(price), category, qty: 1 });
    }
    saveCart();
    renderCart();
    animateCartBtn();
    showToast(nameVi || nameEn);
  }

  function updateQty(id, delta) {
    const item = cart.find(i => i.id === id);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) cart = cart.filter(i => i.id !== id);
    saveCart();
    renderCart();
  }

  function removeItem(id) {
    cart = cart.filter(i => i.id !== id);
    saveCart();
    renderCart();
  }

  function clearCart() {
    cart = [];
    saveCart();
    renderCart();
  }

  function getTotal() {
    return cart.reduce((s, i) => s + i.price * i.qty, 0);
  }

  function getTotalQty() {
    return cart.reduce((s, i) => s + i.qty, 0);
  }

  // ── Lang helper ──
  function getLang() {
    return document.documentElement.lang || 'vi';
  }

  // ── Render cart panel ──
  function renderCart() {
    const lang = getLang();
    const panel = document.getElementById('cart-panel');
    const body  = document.getElementById('cart-body');
    const badge = document.getElementById('cart-badge');
    const totalEl = document.getElementById('cart-total');
    const totalQty = getTotalQty();

    // Badge
    if (badge) {
      badge.textContent = totalQty;
      badge.style.display = totalQty > 0 ? 'flex' : 'none';
    }

    if (!body) return;

    if (cart.length === 0) {
      body.innerHTML = `
        <div class="cart-empty">
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
          <p>${lang === 'vi' ? 'Giỏ hàng trống' : 'Your cart is empty'}</p>
          <span>${lang === 'vi' ? 'Thêm món từ thực đơn' : 'Add items from the menu'}</span>
        </div>`;
    } else {
      body.innerHTML = cart.map(item => `
        <div class="cart-item" data-id="${item.id}">
          <div class="cart-item-info">
            <div class="cart-item-name">${lang === 'vi' ? item.nameVi : (item.nameEn || item.nameVi)}</div>
            <div class="cart-item-price">${item.price.toLocaleString('vi-VN')}đ / ${lang === 'vi' ? 'phần' : 'item'}</div>
          </div>
          <div class="cart-item-controls">
            <button class="qty-btn" onclick="TaiCart.updateQty('${item.id}', -1)" aria-label="Giảm">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
            <span class="qty-val">${item.qty}</span>
            <button class="qty-btn" onclick="TaiCart.updateQty('${item.id}', 1)" aria-label="Tăng">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
            <span class="cart-item-subtotal">${(item.price * item.qty).toLocaleString('vi-VN')}đ</span>
            <button class="cart-remove" onclick="TaiCart.removeItem('${item.id}')" aria-label="Xóa">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>`).join('');
    }

    if (totalEl) totalEl.textContent = getTotal().toLocaleString('vi-VN') + 'đ';

    // Show/hide footer
    const footer = document.getElementById('cart-footer');
    if (footer) footer.style.display = cart.length > 0 ? 'block' : 'none';

    // Update menu page qty displays
    updateMenuQtyDisplays();
  }

  // ── Update quantity controls on menu cards ──
  function updateMenuQtyDisplays() {
    document.querySelectorAll('.menu-card[data-item-id]').forEach(card => {
      const id = card.dataset.itemId;
      const cartItem = cart.find(i => i.id === id);
      const qty = cartItem ? cartItem.qty : 0;

      const addBtn = card.querySelector('.card-add-btn');
      const qtyControls = card.querySelector('.card-qty-controls');
      const qtyDisplay = card.querySelector('.card-qty-num');

      if (addBtn && qtyControls) {
        if (qty > 0) {
          addBtn.style.display = 'none';
          qtyControls.style.display = 'flex';
          if (qtyDisplay) qtyDisplay.textContent = qty;
        } else {
          addBtn.style.display = 'flex';
          qtyControls.style.display = 'none';
        }
      }
    });
  }

  // ── Cart panel toggle ──
  function openCart() {
    const panel = document.getElementById('cart-panel');
    const overlay = document.getElementById('cart-overlay');
    if (panel) { panel.classList.add('open'); document.body.style.overflow = 'hidden'; }
    if (overlay) overlay.classList.add('show');
  }

  function closeCart() {
    const panel = document.getElementById('cart-panel');
    const overlay = document.getElementById('cart-overlay');
    if (panel) panel.classList.remove('open');
    if (overlay) overlay.classList.remove('show');
    document.body.style.overflow = '';
  }

  // ── Animate cart button ──
  function animateCartBtn() {
    const btn = document.getElementById('cart-float-btn');
    if (!btn) return;
    btn.classList.add('bounce');
    setTimeout(() => btn.classList.remove('bounce'), 500);
  }

  // ── Toast notification ──
  function showToast(name) {
    const lang = getLang();
    let toast = document.getElementById('cart-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'cart-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = lang === 'vi' ? `Đã thêm: ${name}` : `Added: ${name}`;
    toast.className = 'cart-toast show';
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove('show'), 2200);
  }

  // ── Print receipt ──
  function printReceipt() {
    const lang = getLang();
    if (cart.length === 0) return;

    const now = new Date();
    const dateStr = now.toLocaleDateString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric' });
    const timeStr = now.toLocaleTimeString('vi-VN', { hour:'2-digit', minute:'2-digit' });
    const total = getTotal();
    const orderNo = 'TL' + Date.now().toString().slice(-6);

    const rows = cart.map(item => `
      <tr>
        <td class="receipt-item-name">${lang === 'vi' ? item.nameVi : (item.nameEn || item.nameVi)}</td>
        <td class="receipt-item-qty">${item.qty}</td>
        <td class="receipt-item-price">${item.price.toLocaleString('vi-VN')}đ</td>
        <td class="receipt-item-sub">${(item.price * item.qty).toLocaleString('vi-VN')}đ</td>
      </tr>`).join('');

    const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="UTF-8">
<title>Phiếu tính tiền — TaiLand Cafe</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Courier New', Courier, monospace;
    background: #fff;
    color: #111;
    padding: 24px;
    max-width: 340px;
    margin: 0 auto;
  }
  .receipt-header { text-align: center; padding-bottom: 16px; border-bottom: 2px dashed #ccc; margin-bottom: 16px; }
  .receipt-logo { font-size: 1.5rem; font-weight: 900; letter-spacing: .1em; }
  .receipt-tagline { font-size: .7rem; color: #666; margin-top: 2px; letter-spacing: .08em; }
  .receipt-meta { font-size: .72rem; color: #444; margin-top: 10px; line-height: 1.8; }
  .receipt-order { font-size: .8rem; font-weight: 700; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
  th { font-size: .68rem; text-transform: uppercase; letter-spacing: .06em; color: #666; padding: 6px 0; border-bottom: 1px solid #ddd; text-align: left; }
  th:nth-child(2), th:nth-child(3), th:nth-child(4) { text-align: right; }
  td { padding: 8px 0; font-size: .8rem; vertical-align: top; border-bottom: 1px solid #f0f0f0; }
  .receipt-item-name { width: 44%; line-height: 1.4; }
  .receipt-item-qty, .receipt-item-price, .receipt-item-sub { text-align: right; }
  .receipt-item-sub { font-weight: 600; }
  .receipt-divider { border: none; border-top: 2px dashed #ccc; margin: 12px 0; }
  .receipt-totals { font-size: .82rem; }
  .receipt-totals td { border: none; padding: 4px 0; }
  .receipt-totals .label { color: #555; }
  .receipt-totals .val { font-weight: 600; text-align: right; }
  .receipt-grand { font-size: 1.05rem !important; font-weight: 900 !important; }
  .receipt-footer { text-align: center; margin-top: 16px; padding-top: 14px; border-top: 2px dashed #ccc; font-size: .7rem; color: #666; line-height: 2; }
  .receipt-footer strong { font-size: .78rem; color: #111; letter-spacing: .05em; }
  @media print {
    body { padding: 8px; }
    @page { margin: 8mm; size: 80mm auto; }
  }
</style>
</head>
<body>
<div class="receipt-header">
  <div class="receipt-logo">TAILAND</div>
  <div class="receipt-tagline">${lang === 'vi' ? 'Nơi cảm hứng hội tụ' : 'Where Inspiration Converges'}</div>
  <div class="receipt-meta">
    ${lang === 'vi' ? 'Ngày' : 'Date'}: ${dateStr} &nbsp;|&nbsp; ${lang === 'vi' ? 'Giờ' : 'Time'}: ${timeStr}
  </div>
  <div class="receipt-order">${lang === 'vi' ? 'Phiếu' : 'Order'} #${orderNo}</div>
</div>

<table>
  <thead>
    <tr>
      <th>${lang === 'vi' ? 'Tên món' : 'Item'}</th>
      <th>${lang === 'vi' ? 'SL' : 'Qty'}</th>
      <th>${lang === 'vi' ? 'Đơn giá' : 'Price'}</th>
      <th>${lang === 'vi' ? 'Thành tiền' : 'Amount'}</th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
</table>

<hr class="receipt-divider">

<table class="receipt-totals">
  <tr>
    <td class="label">${lang === 'vi' ? 'Tổng cộng' : 'Subtotal'}</td>
    <td class="val">${total.toLocaleString('vi-VN')}đ</td>
  </tr>
  <tr>
    <td class="label">${lang === 'vi' ? 'Thuế/Phí dịch vụ' : 'Service charge'}</td>
    <td class="val">0đ</td>
  </tr>
  <tr>
    <td class="label receipt-grand">${lang === 'vi' ? 'THANH TOÁN' : 'TOTAL'}</td>
    <td class="val receipt-grand">${total.toLocaleString('vi-VN')}đ</td>
  </tr>
</table>

<div class="receipt-footer">
  <strong>${lang === 'vi' ? 'Cảm ơn quý khách!' : 'Thank you!'}</strong><br>
  ${lang === 'vi' ? 'Hẹn gặp lại tại TaiLand Cafe' : 'See you again at TaiLand Cafe'}<br>
  tailandcafe.vn
</div>

<script>window.onload = function() { window.print(); }<\/script>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=420,height=640');
    win.document.write(html);
    win.document.close();
  }

  // ── Inject cart UI into page ──
  function injectCartUI() {
    const lang = getLang();

    // Floating button
    const floatBtn = document.createElement('button');
    floatBtn.id = 'cart-float-btn';
    floatBtn.setAttribute('aria-label', lang === 'vi' ? 'Giỏ hàng' : 'Cart');
    floatBtn.innerHTML = `
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
      </svg>
      <span id="cart-badge" style="display:none">0</span>`;
    floatBtn.onclick = openCart;
    document.body.appendChild(floatBtn);

    // Overlay
    const overlay = document.createElement('div');
    overlay.id = 'cart-overlay';
    overlay.onclick = closeCart;
    document.body.appendChild(overlay);

    // Panel
    const panel = document.createElement('div');
    panel.id = 'cart-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', lang === 'vi' ? 'Giỏ hàng' : 'Cart');
    panel.innerHTML = `
      <div class="cart-panel-header">
        <div class="cart-panel-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
          ${lang === 'vi' ? 'Đơn hàng' : 'Order'}
        </div>
        <button class="cart-close-btn" onclick="TaiCart.closeCart()" aria-label="Đóng">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div id="cart-body" class="cart-panel-body"></div>
      <div id="cart-footer" class="cart-panel-footer" style="display:none">
        <div class="cart-total-row">
          <span class="cart-total-label">${lang === 'vi' ? 'Tổng tiền' : 'Total'}</span>
          <span id="cart-total" class="cart-total-val">0đ</span>
        </div>
        <div class="cart-actions">
          <button class="btn btn-outline btn-sm" onclick="TaiCart.printReceipt()">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
              <rect x="6" y="14" width="12" height="8"/>
            </svg>
            ${lang === 'vi' ? 'In phiếu' : 'Print'}
          </button>
          <button class="btn btn-accent btn-sm" onclick="TaiCart.clearCart()">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            </svg>
            ${lang === 'vi' ? 'Xóa tất cả' : 'Clear'}
          </button>
        </div>
      </div>`;
    document.body.appendChild(panel);

    renderCart();
  }

  // ── Add order controls to menu cards ──
  function enhanceMenuCards() {
    document.querySelectorAll('.menu-card').forEach(card => {
      const foot = card.querySelector('.menu-card-foot');
      if (!foot || card.dataset.cartEnhanced) return;
      card.dataset.cartEnhanced = '1';

      const id       = card.dataset.itemId;
      const nameVi   = card.dataset.nameVi || '';
      const nameEn   = card.dataset.nameEn || '';
      const price    = card.dataset.price   || '0';
      const category = card.dataset.category || '';

      if (!id) return;

      // Add button
      const addBtn = document.createElement('button');
      addBtn.className = 'card-add-btn';
      addBtn.setAttribute('aria-label', `Thêm ${nameVi}`);
      addBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        <span>Thêm</span>`;
      addBtn.onclick = () => addItem(id, nameVi, nameEn, price, category);

      // Qty controls
      const qtyControls = document.createElement('div');
      qtyControls.className = 'card-qty-controls';
      qtyControls.style.display = 'none';
      qtyControls.innerHTML = `
        <button class="qty-btn-card" onclick="TaiCart.updateQty('${id}', -1)" aria-label="Giảm">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
        <span class="card-qty-num">0</span>
        <button class="qty-btn-card" onclick="TaiCart.updateQty('${id}', 1)" aria-label="Tăng">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>`;

      foot.appendChild(addBtn);
      foot.appendChild(qtyControls);
    });

    updateMenuQtyDisplays();
  }

  // ── Public API ──
  window.TaiCart = { addItem, updateQty, removeItem, clearCart, openCart, closeCart, printReceipt };

  // ── Init ──
  document.addEventListener('DOMContentLoaded', () => {
    injectCartUI();
    enhanceMenuCards();
  });
})();
