const SHOP = 'https://9z9z0b-ic.myshopify.com';
/* ── VARIANT_MAP ─────────────────────────────────────────────────────────────
   Shopify variant IDs: handle → colour → size → numeric variantId.
   LEFT EMPTY ON PURPOSE: real IDs could not be read (store returns HTTP 402).
   Fill from Shopify admin (Products → variant URL …/variants/<ID>) or
   https://9z9z0b-ic.myshopify.com/products/<handle>.js once the store is live.
   When every line in the bag has an ID, checkout uses a cart permalink:
     SHOP/cart/<variantId>:<qty>,<variantId>:<qty>
   Otherwise it falls back honestly to the product page (no ?variant guess).
   ───────────────────────────────────────────────────────────────────────── */
const VARIANT_MAP = {
'hdy-001-pullover': { BLK: {}, HGR: {}, BON: {} },
'pnt-001-extra-wide': { BLK: {}, HGR: {}, BON: {} },
'drop1-set': { BLK: {}, HGR: {}, BON: {} }
};
const IMG = { BLK: 'assets/HDY-PNT-BLK.svg', HGR: 'assets/HDY-PNT-HGR.svg', BON: 'assets/HDY-PNT-BON.svg' };
const PRODUCTS = {
hdy: { id: 'hdy', handle: 'hdy-001-pullover', name: 'HDY-001 Pullover', price: 98, desc: 'HDY-001 pullover. 420 GSM 80/20 brushed fleece. Relaxed oversized, kangaroo pocket. PB geometric monogram, left chest only.' },
pnt: { id: 'pnt', handle: 'pnt-001-extra-wide', name: 'PNT-001 Extra-Wide Pants', price: 94, desc: 'PNT-001 extra-wide pooling fleece pants. 420 GSM 80/20 brushed fleece. Clean exterior, no logo.' },
set: { id: 'set', handle: 'drop1-set', name: 'Drop 1 Set', price: 192, desc: 'HDY-001 Pullover + PNT-001 Extra-Wide Pants. Matched colour and size.' }
};
Object.values(PRODUCTS).forEach(p => { p.url = SHOP + '/products/' + p.handle; p.images = IMG; });
const COLOR_LABELS = { BLK: 'Black (BLK)', HGR: 'Heather Grey (HGR)', BON: 'Bone (BON)' };
const CART_KEY = 'deji_cart_v1';
const variantId = (handle, color, size) => ((VARIANT_MAP[handle] || {})[color] || {})[size] || null;
function loadCart() { try { const c = JSON.parse(localStorage.getItem(CART_KEY) || '[]'); return Array.isArray(c) ? c.filter(i => PRODUCTS[i.id] && COLOR_LABELS[i.color] && i.qty > 0) : []; } catch (e) { return []; } }
function saveCart() { try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) {} }
let cart = loadCart();
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const sm = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
/* Checkout URL: permalink when all IDs known, else honest product-page fallback. */
function checkoutUrl(items) {
items = items || cart;
if (!items.length) return null;
const ids = items.map(i => variantId(PRODUCTS[i.id].handle, i.color, i.size));
if (ids.every(Boolean)) return SHOP + '/cart/' + items.map((i, n) => ids[n] + ':' + i.qty).join(',');
return PRODUCTS[items[0].id].url;
}
window.DEJI = { VARIANT_MAP, checkoutUrl, getCart: () => cart.slice() };
function selectedSize(scope) { const s = scope.querySelector('.size-pill.sel'); return s ? s.textContent.trim() : null; }
function bindSizes(scope, onPick) {
$$('.size-pill', scope).forEach(p => p.addEventListener('click', () => {
$$('.size-pill', scope).forEach(x => { x.classList.remove('sel'); x.setAttribute('aria-pressed', 'false'); });
p.classList.add('sel'); p.setAttribute('aria-pressed', 'true'); onPick && onPick(p.textContent.trim());
}));
}
function swapImg(img, src, alt) {
if (!img) return;
img.classList.add('swap');
const pre = new Image();
pre.onload = pre.onerror = () => setTimeout(() => { img.src = src; img.alt = alt; img.classList.remove('swap'); }, reduce ? 0 : 200);
pre.src = src;
}
function addToCart(key, color, size) {
const p = PRODUCTS[key];
if (!p || !size) return false;
const lineId = key + '-' + color + '-' + size;
const ex = cart.find(i => i.lineId === lineId);
if (ex) ex.qty++; else cart.push({ lineId, id: key, color, size, qty: 1 });
saveCart(); renderCart(); openCart();
const bag = $('#bag'); bag.classList.remove('bump'); void bag.offsetWidth; bag.classList.add('bump');
return true;
}
function changeQty(lineId, d) {
const i = cart.findIndex(x => x.lineId === lineId);
if (i < 0) return;
cart[i].qty += d;
if (cart[i].qty <= 0) cart.splice(i, 1);
saveCart(); renderCart();
}
function renderCart() {
const count = cart.reduce((s, i) => s + i.qty, 0);
const total = cart.reduce((s, i) => s + PRODUCTS[i.id].price * i.qty, 0);
$('#cart-count').textContent = count;
$('#bag').setAttribute('aria-label', 'Open bag, ' + count + (count === 1 ? ' item' : ' items'));
const body = $('#cart-body'), foot = $('#cart-foot');
if (!cart.length) {
body.innerHTML = '<div class="cart-empty"><p>Your bag is empty.<br>Add something worth wearing.</p></div>';
foot.style.display = 'none';
return;
}
foot.style.display = 'block';
$('#cart-total').textContent = '$' + total;
const permalink = cart.every(i => variantId(PRODUCTS[i.id].handle, i.color, i.size));
$('#ship-note').textContent = permalink ? 'Shipping calculated at Shopify checkout' : 'Checkout opens the product page on Shopify — pick colour & size there to confirm.';
body.innerHTML = cart.map(item => { const p = PRODUCTS[item.id]; return `
<div class="cart-item" data-line="${item.lineId}">
<div class="cart-item-img"><img src="${IMG[item.color]}" alt="" style="object-position:50% 40%;transform:scale(1.5);transform-origin:50% 40%"></div>
<div class="ci-info">
<div><div class="ci-name">${p.name}</div><div class="ci-sub">${COLOR_LABELS[item.color]} · Size ${item.size}</div></div>
<div class="ci-price">$${p.price * item.qty}</div>
<div class="ci-qty"><button type="button" aria-label="Decrease ${p.name} ${item.size}" data-q="${item.lineId}" data-d="-1">−</button><span>${item.qty}</span><button type="button" aria-label="Increase ${p.name} ${item.size}" data-q="${item.lineId}" data-d="1">+</button></div>
</div>
</div>`; }).join('');
}
let lastFocus = null;
function openCart() {
lastFocus = document.activeElement;
$('#cart').classList.add('show'); $('#overlay').classList.add('show');
$('#cart').setAttribute('aria-hidden', 'false');
document.body.classList.add('lock');
$('#cartClose').focus({ preventScroll: true });
}
function closeCart() {
if (!$('#cart').classList.contains('show')) return;
$('#cart').classList.remove('show'); $('#overlay').classList.remove('show');
$('#cart').setAttribute('aria-hidden', 'true');
document.body.classList.remove('lock');
if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
}
function toggleCart() { $('#cart').classList.contains('show') ? closeCart() : openCart(); }
function goCheckout() { const u = checkoutUrl(); if (u) window.location.href = u; }
$('#bag').addEventListener('click', toggleCart);
$('#cartClose').addEventListener('click', closeCart);
$('#overlay').addEventListener('click', closeCart);
$('#keep').addEventListener('click', closeCart);
$('#checkout').addEventListener('click', goCheckout);
$('#cart-body').addEventListener('click', e => { const b = e.target.closest('[data-q]'); if (b) changeQty(b.dataset.q, +b.dataset.d); });
/* Size guide */
const sg = $('#sg'); let sgFrom = null;
function openSG() { sgFrom = document.activeElement; sg.hidden = false; document.body.classList.add('lock'); $('#sgClose').focus(); }
function closeSG() { if (sg.hidden) return; sg.hidden = true; document.body.classList.remove('lock'); sgFrom && sgFrom.focus && sgFrom.focus(); }
$$('[data-sg]').forEach(b => b.addEventListener('click', openSG));
$('#sgClose').addEventListener('click', closeSG);
sg.addEventListener('click', e => { if (e.target === sg) closeSG(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeSG(); closeCart(); setMenu(false); } });
/* Collection cards: size required */
$$('.card').forEach(card => {
const key = card.dataset.product, btn = $('.quick-add', card);
const sync = () => { const ok = !!selectedSize(card); btn.setAttribute('aria-disabled', ok ? 'false' : 'true'); btn.textContent = ok ? 'Add to Bag' : 'Select a size'; };
$$('.sw', card).forEach(sw => sw.addEventListener('click', () => {
card.dataset.color = sw.dataset.color;
$$('.sw', card).forEach(s => s.setAttribute('aria-pressed', s === sw ? 'true' : 'false'));
$('.cl', card).textContent = COLOR_LABELS[sw.dataset.color];
swapImg(document.getElementById('img-' + key), IMG[sw.dataset.color], PRODUCTS[key].name + ' — ' + COLOR_LABELS[sw.dataset.color]);
}));
bindSizes(card, sync); sync();
btn.addEventListener('click', () => {
const size = selectedSize(card);
if (!size) { $('.sizes', card).classList.add('need'); setTimeout(() => $('.sizes', card).classList.remove('need'), 900); return; }
addToCart(key, card.dataset.color || 'BLK', size);
});
});
/* Buy-box */
const buy = { p: 'hdy', color: 'BLK', size: null };
const buyImg = $('#buyImg'), buyStage = $('#buyStage'), buyAdd = $('#buyAdd'), buyMsg = $('#buyMsg');
function buySync() {
const ok = !!buy.size;
buyAdd.setAttribute('aria-disabled', ok ? 'false' : 'true');
buyAdd.textContent = ok ? 'Add to Bag — $' + PRODUCTS[buy.p].price : 'Select a size';
if (ok) buyMsg.textContent = '';
}
function buyView() {
buyStage.dataset.view = buy.p;
$('#buyCl').textContent = COLOR_LABELS[buy.color];
$('#buyDesc').textContent = PRODUCTS[buy.p].desc;
const z = $('#buyZoom'); const canZoom = buy.p !== 'pnt';
z.hidden = !canZoom; if (!canZoom) { buyStage.dataset.zoom = '0'; z.setAttribute('aria-pressed', 'false'); }
swapImg(buyImg, IMG[buy.color], PRODUCTS[buy.p].name + ' — ' + COLOR_LABELS[buy.color]);
buySync();
}
$$('.buy-prod [data-p]').forEach(b => b.addEventListener('click', () => {
buy.p = b.dataset.p; $$('.buy-prod [data-p]').forEach(x => x.setAttribute('aria-checked', x === b ? 'true' : 'false')); buyView();
}));
$$('#buySw .sw').forEach(sw => sw.addEventListener('click', () => {
buy.color = sw.dataset.color; $$('#buySw .sw').forEach(s => s.setAttribute('aria-pressed', s === sw ? 'true' : 'false')); buyView();
}));
bindSizes($('#buySz'), s => { buy.size = s; buySync(); });
$('#buyZoom').addEventListener('click', e => { const on = buyStage.dataset.zoom !== '1'; buyStage.dataset.zoom = on ? '1' : '0'; e.currentTarget.setAttribute('aria-pressed', on); });
buyAdd.addEventListener('click', () => {
if (!buy.size) { buyMsg.textContent = 'Choose a size first.'; $('#buySz').classList.add('need'); setTimeout(() => $('#buySz').classList.remove('need'), 900); return; }
addToCart(buy.p, buy.color, buy.size);
});
/* Hook for a future 360 sprite / 3D viewer. Intentionally a no-op: no sprite or model exists yet. */
function initTurntable() { const src = buyStage.dataset.sprite; if (!src) return; /* implement sprite scrub here when assets exist */ }
initTurntable();
buySync(); renderCart();
/* Sticky "Shop Drop 1" pill: hidden while the buy-box is in view or at the very top */
const pill = $('#shopPill');
if ('IntersectionObserver' in window) {
let inView = true;
new IntersectionObserver(es => es.forEach(e => { inView = e.isIntersecting; pill.classList.toggle('show', !inView && scrollY > innerHeight * .5); }), { threshold: 0.15 }).observe($('#buy'));
addEventListener('scroll', () => pill.classList.toggle('show', !inView && scrollY > innerHeight * .5), { passive: true });
}
$('#nl').addEventListener('submit', e => {
const inp = $('#nl-email');
if (!inp.checkValidity()) { e.preventDefault(); inp.reportValidity(); }
/* otherwise the form posts to Shopify's customer signup (form_type=customer, tags=newsletter) */
});
const nav = $('#nav'), menu = $('#menu'), burger = $('#burger');
function setMenu(on) {
menu.classList.toggle('open', on); nav.classList.toggle('menu-open', on);
burger.setAttribute('aria-expanded', on); menu.setAttribute('aria-hidden', !on);
document.body.classList.toggle('lock', on);
}
burger.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
$$('#menu a').forEach(a => a.addEventListener('click', () => setMenu(false)));
if ($('#reel .reel-video')) $('#reel').classList.add('has-video');
let kc = 0;
function split(node) {
Array.from(node.childNodes).forEach(n => {
if (n.nodeType === 3) {
const f = document.createDocumentFragment();
n.textContent.split(/(\s+)/).forEach(t => {
if (!t) return;
if (/^\s+$/.test(t)) { f.appendChild(document.createTextNode(' ')); return; }
const w = document.createElement('span'); w.className = 'w';
const i = document.createElement('span'); i.textContent = t; i.style.setProperty('--k', kc++);
w.appendChild(i); f.appendChild(w);
});
n.replaceWith(f);
} else if (n.nodeType === 1 && n.tagName !== 'BR') split(n);
});
}
$$('[data-split]').forEach(el => { kc = 0; el.setAttribute('aria-label', el.textContent.trim()); split(el); });
const revealEls = $$('.reveal, [data-split]');
const settle = el => { if (el.classList.contains('reveal')) setTimeout(() => el.classList.remove('reveal', 'on'), 1800 + (parseInt(el.style.getPropertyValue('--d')) || 0)); };
const show = el => { el.classList.add('on'); settle(el); };
if (root.classList.contains('static') || reduce || !('IntersectionObserver' in window)) {
revealEls.forEach(show);
} else {
const obs = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { show(e.target); obs.unobserve(e.target); } }), { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
revealEls.forEach(el => obs.observe(el));
}
const mqRows = $$('.mrow').map(el => ({ el, dir: +el.dataset.dir, sp: +el.dataset.speed, x: 0, w: 0 }));
function setupMarquee() {
mqRows.forEach(r => {
if (!r.base) r.base = r.el.innerHTML;
r.el.innerHTML = r.base;
r.w = r.el.scrollWidth;
let n = 0;
while (r.el.scrollWidth < r.w + innerWidth * 1.2 && n++ < 8) r.el.insertAdjacentHTML('beforeend', r.base);
});
}
const tiles = $$('.tile').map(el => ({ el, px: $('.px', el), s: +$('.px', el).dataset.s, vis: false }));
if ('IntersectionObserver' in window) {
const tio = new IntersectionObserver(es => es.forEach(e => { const t = tiles.find(x => x.el === e.target); if (t) t.vis = e.isIntersecting; }), { rootMargin: '20% 0px' });
tiles.forEach(t => tio.observe(t.el));
} else tiles.forEach(t => t.vis = true);
const hs = $('#details'), hsTrack = $('#hsTrack'), hsBar = $('#hsBar'), hsCount = $('#hsCount');
const panels = $$('.panel', hsTrack);
const mqNative = matchMedia('(max-width:768px)');
let hsNative = false, hsMax = 0;
function setupHS() {
hsNative = mqNative.matches;
hs.classList.toggle('native', hsNative);
hsTrack.style.transform = '';
if (hsNative) { hs.style.height = ''; return; }
hsMax = Math.max(0, hsTrack.scrollWidth - innerWidth);
hs.style.height = (hsMax + innerHeight) + 'px';
}
const sig = $('#signature'), stage = $('#stage'), pTop = $('#pTop'), pBot = $('#pBot'), ghost = $$('#ghost span'), cos = $$('.co'), cw = $$('#sigCw span'), sigBar = $('#sigBar'), sigCap = $('#sigCap');
const imgsT = $$('img', pTop), imgsB = $$('img', pBot);
let stageH = 0;
cos.forEach(c => { c._at = +c.dataset.at; c._dur = +(c.dataset.dur || .17); c._pl = c.dataset.pl; c._u = $('u', c); c._txt = $('span', c).innerHTML.replace(/<br>/g, ' · '); });
function setupSig() { stageH = stage.offsetHeight; }
let hsP = 0, sigP = 0, hsT = 0, sigT = 0, lastY = -1, vel = 0, last = performance.now(), dirty = true;
function frame(now) {
const dt = Math.min(64, now - last); last = now;
const y = scrollY, vh = innerHeight;
vel += ((y - (lastY < 0 ? y : lastY)) - vel) * 0.2; lastY = y;
const k = reduce ? 1 : 1 - Math.pow(1 - 0.11, dt / 16.7);
nav.classList.toggle('scrolled', y > 40);
const mr = $('#marquee').getBoundingClientRect();
if (!reduce && mr.bottom > 0 && mr.top < vh) {
mqRows.forEach(r => {
if (!r.w) return;
r.x += r.dir * (r.sp * dt * 0.06 + Math.abs(vel) * 0.35 * r.sp) ;
const off = ((r.x % r.w) + r.w) % r.w - r.w;
r.el.style.transform = 'translate3d(' + off.toFixed(1) + 'px,0,0)';
});
}
const pm = innerWidth <= 768 ? 0.45 : 1;
tiles.forEach(t => { if (!t.vis) return; const r = t.el.getBoundingClientRect(); t.px.style.setProperty('--ty', ((r.top + r.height / 2 - vh / 2) * t.s * pm).toFixed(1) + 'px'); });
const hr = hs.getBoundingClientRect();
if (hr.bottom > -vh && hr.top < vh * 2 && !hsNative) {
hsT = clamp(-hr.top / Math.max(1, hs.offsetHeight - vh), 0, 1);
hsP += (hsT - hsP) * k;
hsTrack.style.transform = 'translate3d(' + (-hsP * hsMax).toFixed(1) + 'px,0,0)';
hs.style.setProperty('--p', hsP.toFixed(4)); hsBar.style.setProperty('--p', hsP.toFixed(4));
hsCount.textContent = '0' + (Math.round(hsP * (panels.length - 1)) + 1) + ' / 0' + panels.length;
}
const sr = sig.getBoundingClientRect();
if (sr.bottom > -vh && sr.top < vh * 2) {
sigT = clamp(-sr.top / Math.max(1, sig.offsetHeight - vh), 0, 1);
sigP += (sigT - sigP) * k;
const p = sigP, mob = innerWidth <= 768;
const ex = sm(.06, .34, p) - sm(.8, .97, p);
const off = ex * stageH * (mob ? .085 : .1), dx = ex * stageH * .018;
pTop.style.transform = 'translate3d(' + (-dx).toFixed(1) + 'px,' + (-off).toFixed(1) + 'px,0) scale(' + (1 + ex * .02).toFixed(4) + ')';
pBot.style.transform = 'translate3d(' + dx.toFixed(1) + 'px,' + off.toFixed(1) + 'px,0) scale(' + (1 + ex * .02).toFixed(4) + ')';
const f = (ex * 6).toFixed(2) + '%'; pTop.style.setProperty('--f', f); pBot.style.setProperty('--f', f);
const tilt = mob ? 6 : 14;
stage.style.transform = 'rotateY(' + ((p - .5) * -tilt).toFixed(2) + 'deg) rotateX(' + (ex * (mob ? 1.5 : 3.5)).toFixed(2) + 'deg) scale(' + (1 + p * .05).toFixed(4) + ')';
const o1 = sm(.28, .38, p), o2 = sm(.62, .72, p);
imgsT[1].style.opacity = imgsB[1].style.opacity = o1;
imgsT[2].style.opacity = imgsB[2].style.opacity = o2;
ghost[0].style.opacity = 1 - o1; ghost[1].style.opacity = o1 - o2; ghost[2].style.opacity = o2;
const ci = p < .33 ? 0 : p < .67 ? 1 : 2;
cw.forEach((c, i) => c.classList.toggle('on', i === ci));
sigBar.style.setProperty('--p', p.toFixed(4));
let best = null, bv = 0;
cos.forEach(c => {
const a = c._at, v = sm(a, a + .045, p) * (1 - sm(a + c._dur, a + c._dur + .045, p));
c.style.opacity = v.toFixed(3);
c._u.style.setProperty('--s', sm(a, a + .06, p).toFixed(3));
c.style.transform = 'translate3d(0,' + ((c._pl === 't' ? -off : off)).toFixed(1) + 'px,70px)';
if (v > bv) { bv = v; best = c; }
});
if (mob) { const t = best && bv > .4 ? best._txt : 'Pullover + extra-wide pants'; if (sigCap._t !== t) { sigCap._t = t; sigCap.textContent = t; } }
}
requestAnimationFrame(frame);
}
function setupAll() { setupMarquee(); setupHS(); setupSig(); }
addEventListener('resize', () => { clearTimeout(setupAll._t); setupAll._t = setTimeout(setupAll, 150); });
(document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(() => { setupAll(); });
setupAll();
addEventListener('load', setupAll);
requestAnimationFrame(frame);
