// Writes static prices ([data-price]) and Product JSON-LD into index.html from the PRODUCTS
// config in app.js (CONFIG-START … CONFIG-END). Usage: node tools/build.mjs [--check]
// --check exits 1 if index.html is out of sync (use before every commit / in CI).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..') + path.sep;
const js = fs.readFileSync(root + 'app.js', 'utf8');
const cfg = js.slice(js.indexOf('/* CONFIG-START'), js.indexOf('/* CONFIG-END */'));
const { PRODUCTS, SITE, SHOP } = new Function(cfg + '; return { PRODUCTS, SITE, SHOP };')();
const htmlPath = root + 'index.html';
const html = fs.readFileSync(htmlPath, 'utf8');
let out = html.replace(/(<[^>]*data-price="(\w+)"[^>]*>)[^<]*(<\/)/g, (m, open, key, close) => {
  if (!PRODUCTS[key]) throw new Error('unknown data-price ' + key);
  return open + '$' + PRODUCTS[key].price + close;
});
const ld = Object.values(PRODUCTS).map(p => ({
  '@context': 'https://schema.org', '@type': 'Product', name: p.name, sku: p.sku,
  brand: { '@type': 'Brand', name: 'Deji' }, description: p.desc, image: SITE + 'assets/og-drop1.jpg',
  offers: { '@type': 'Offer', price: p.price.toFixed(2), priceCurrency: 'USD', url: SHOP + '/products/' + p.handle }
}));
const block = '<script type="application/ld+json" id="product-ld">' + JSON.stringify(ld) + '</script>';
if (/<script type="application\/ld\+json" id="product-ld">.*?<\/script>/s.test(out)) out = out.replace(/<script type="application\/ld\+json" id="product-ld">.*?<\/script>/s, block);
else out = out.replace(/<!-- Product JSON-LD[^>]*-->/, block);
if (!out.includes('id="product-ld"')) throw new Error('JSON-LD anchor not found');
if (process.argv.includes('--check')) {
  if (out !== html) { console.error('index.html out of sync with PRODUCTS — run node tools/build.mjs'); process.exit(1); }
  console.log('OK: prices + JSON-LD match PRODUCTS');
} else { fs.writeFileSync(htmlPath, out); console.log('index.html updated'); }
