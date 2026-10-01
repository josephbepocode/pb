const SHOP = 'https://9z9z0b-ic.myshopify.com';
const IMG = { BLK: 'assets/HDY-PNT-BLK.svg', HGR: 'assets/HDY-PNT-HGR.svg', BON: 'assets/HDY-PNT-BON.svg' };
const PRODUCTS = {
hdy: { id: 'hdy', name: 'HDY-001 Pullover', price: 98, url: SHOP + '/products/hdy-001-pullover', images: IMG },
pnt: { id: 'pnt', name: 'PNT-001 Extra-Wide Pants', price: 94, url: SHOP + '/products/pnt-001-extra-wide', images: IMG },
set: { id: 'set', name: 'Drop 1 Set', price: 192, url: SHOP + '/products/drop1-set', images: IMG }
};
const COLOR_LABELS = { BLK: 'Black (BLK)', HGR: 'Heather Grey (HGR)', BON: 'Bone (BON)' };
let cart = [];
let lastCheckoutUrl = PRODUCTS.hdy.url;
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const sm = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
function selectedSize(card) { const s = card.querySelector('.size-pill.sel'); return s ? s.textContent.trim() : 'M'; }
function selectedColor(card) { return card.dataset.color || 'BLK'; }
function setColor(el, key, color) {
const card = el.closest('.card');
card.dataset.color = color;
$$('.sw', card).forEach(s => s.setAttribute('aria-pressed', s === el ? 'true' : 'false'));
$('.cl', card).textContent = COLOR_LABELS[color];
const img = document.getElementById('img-' + key);
if (img && PRODUCTS[key]) {
const src = PRODUCTS[key].images[color];
img.classList.add('swap');
const pre = new Image();
pre.onload = pre.onerror = () => setTimeout(() => {
img.src = src; img.alt = PRODUCTS[key].name + ' — ' + COLOR_LABELS[color];
img.classList.remove('swap');
}, reduce ? 0 : 200);
pre.src = src;
}
}
function quickAdd(key, btn) {
const p = PRODUCTS[key];
if (!p) return;
const card = btn ? btn.closest('.card') : $('.card[data-product="' + key + '"]');
const color = card ? selectedColor(card) : 'BLK';
const size = card ? selectedSize(card) : 'M';
const lineId = key + '-' + color + '-' + size;
const ex = cart.find(i => i.lineId === lineId);
if (ex) ex.qty++;
else cart.push({ lineId, id: key, name: p.name, price: p.price, color: COLOR_LABELS[color] || color, size, qty: 1, img: p.images[color], url: p.url });
lastCheckoutUrl = p.url;
renderCart();
openCart();
const bag = $('#bag'); bag.classList.remove('bump'); void bag.offsetWidth; bag.classList.add('bump');
if (btn) {
const orig = btn.dataset.label || btn.textContent;
btn.textContent = 'Added ✓';
setTimeout(() => {
btn.textContent = orig;
window.location.href = p.url;
}, 700);
} else {
window.location.href = p.url;
}
}
function changeQty(lineId, d) {
const i = cart.findIndex(x => x.lineId === lineId);
if (i < 0) return;
cart[i].qty += d;
if (cart[i].qty <= 0) cart.splice(i, 1);
if (cart.length) lastCheckoutUrl = cart[cart.length - 1].url;
renderCart();
}
function renderCart() {
const count = cart.reduce((s, i) => s + i.qty, 0);
const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
$('#cart-count').textContent = count;
const body = $('#cart-body'), foot = $('#cart-foot');
if (!cart.length) {
body.innerHTML = '<div class="cart-empty"><p>Your bag is empty.<br>Add something worth wearing.</p></div>';
foot.style.display = 'none';
return;
}
foot.style.display = 'block';
$('#cart-total').textContent = '$' + total;
$('#ship-note').textContent = 'Shipping calculated at Shopify checkout';
body.innerHTML = cart.map(item => `
<div class="cart-item">
<div class="cart-item-img"><img src="${item.img}" alt="${item.name}" style="object-position:50% 40%;transform:scale(1.5);transform-origin:50% 40%"></div>
<div class="ci-info">
<div><div class="ci-name">${item.name}</div><div class="ci-sub">${item.color} · Size ${item.size}</div></div>
<div class="ci-price">$${item.price * item.qty}</div>
<div class="ci-qty"><button type="button" aria-label="Decrease" data-q="${item.lineId}" data-d="-1">−</button><span>${item.qty}</span><button type="button" aria-label="Increase" data-q="${item.lineId}" data-d="1">+</button></div>
</div>
</div>`).join('');
}
function openCart() {
$('#cart').classList.add('show'); $('#overlay').classList.add('show');
$('#cart').setAttribute('aria-hidden', 'false');
document.body.classList.add('lock');
}
function closeCart() {
$('#cart').classList.remove('show'); $('#overlay').classList.remove('show');
$('#cart').setAttribute('aria-hidden', 'true');
document.body.classList.remove('lock');
}
function toggleCart() { $('#cart').classList.contains('show') ? closeCart() : openCart(); }
function goCheckout() {
if (!cart.length) return;
window.location.href = cart[cart.length - 1].url || lastCheckoutUrl;
}
$('#bag').addEventListener('click', toggleCart);
$('#cartClose').addEventListener('click', closeCart);
$('#overlay').addEventListener('click', closeCart);
$('#keep').addEventListener('click', closeCart);
$('#checkout').addEventListener('click', goCheckout);
$('#cart-body').addEventListener('click', e => { const b = e.target.closest('[data-q]'); if (b) changeQty(b.dataset.q, +b.dataset.d); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeCart(); setMenu(false); } });
$$('.card').forEach(card => {
const key = card.dataset.product;
$$('.sw', card).forEach(sw => sw.addEventListener('click', () => setColor(sw, key, sw.dataset.color)));
$$('.size-pill', card).forEach(p => p.addEventListener('click', () => {
$$('.size-pill', card).forEach(x => { x.classList.remove('sel'); x.setAttribute('aria-pressed', 'false'); });
p.classList.add('sel'); p.setAttribute('aria-pressed', 'true');
}));
$('.quick-add', card).addEventListener('click', e => quickAdd(key, e.currentTarget));
});
$$('.chip-f').forEach(btn => btn.addEventListener('click', () => {
$$('.chip-f').forEach(b => b.classList.remove('active'));
btn.classList.add('active');
const cat = btn.dataset.f;
$$('.card').forEach(c => c.classList.toggle('hide', !(cat === 'all' || (c.dataset.cat || '').includes(cat))));
}));
$('#nl').addEventListener('submit', e => {
e.preventDefault();
const inp = $('#nl-email');
if (!inp.value.includes('@')) { alert('Enter a valid email.'); return; }
inp.value = '';
alert("You're on the list. First to know about every Deji drop.");
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
