const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, '../lib/curated-catalog.ts'), 'utf8');
const match = content.match(/export const CURATED_MARKETPLACE_PRODUCTS:\s*MarketplaceProduct\[\]\s*=\s*(\[[\s\S]*?\n\];)/);
if (!match) {
  console.log('Could not find CURATED_MARKETPLACE_PRODUCTS');
  process.exit(1);
}
let raw = match[1].trim();
if (raw.endsWith(';')) raw = raw.slice(0, -1);
const products = eval(raw);
console.log('Total curated products:', products.length);

products.slice(0, 16).forEach((p, idx) => {
  console.log(`[${idx+1}] ID: ${p.id} | Brand: ${p.brand} | Cat: ${p.category}`);
  console.log(`    Title: ${p.title}`);
  console.log(`    Primary: ${p.primary_image_url}`);
  console.log(`    Images count: ${p.images ? p.images.length : 0}`);
  if (p.images) {
    p.images.forEach((img, i) => {
      console.log(`       Angle ${i+1}: ${img.source_url} | ${img.alt_text}`);
    });
  }
});
