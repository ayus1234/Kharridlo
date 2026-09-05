const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../public/images/products');
const filesOnDisk = new Set(fs.readdirSync(publicDir));
console.log('Total files on disk in public/images/products:', filesOnDisk.size);

const backendCatalogPath = path.join(__dirname, '../../backend/data/synthetic_catalog.json');
const backendProducts = JSON.parse(fs.readFileSync(backendCatalogPath, 'utf8'));

const curatedCatalogContent = fs.readFileSync(path.join(__dirname, '../lib/curated-catalog.ts'), 'utf8');
const match = curatedCatalogContent.match(/export const CURATED_MARKETPLACE_PRODUCTS:\s*MarketplaceProduct\[\]\s*=\s*(\[[\s\S]*?\n\];)/);
let raw = match[1].trim();
if (raw.endsWith(';')) raw = raw.slice(0, -1);
const curatedProducts = eval(raw);

const fullMap = {};

// 1. Curated products
curatedProducts.forEach(p => {
  const primary = p.primary_image_url || (p.images && p.images[0] && p.images[0].source_url);
  if (primary && primary.startsWith('/images/products/')) {
    const filename = path.basename(primary);
    if (filesOnDisk.has(filename)) {
      fullMap[p.id] = primary;
      if (p.provider_product_id) fullMap[p.provider_product_id] = primary;
    }
  }
});

// 2. Backend products
backendProducts.forEach(p => {
  const img = p.image_url;
  if (img && img.startsWith('/images/products/')) {
    const filename = path.basename(img);
    if (filesOnDisk.has(filename)) {
      fullMap[p.id] = img;
      if (p.sku) fullMap[p.sku] = img;
    } else {
      // Check if .jpg exists instead of .png or vice versa
      const altExt = filename.endsWith('.png') ? filename.replace('.png', '.jpg') : filename.replace('.jpg', '.png');
      if (filesOnDisk.has(altExt)) {
        fullMap[p.id] = `/images/products/${altExt}`;
        if (p.sku) fullMap[p.sku] = `/images/products/${altExt}`;
      }
    }
  }
});

console.log('Total mapped keys in fullMap:', Object.keys(fullMap).length);

// Verify all mapped paths exist on disk
let missingOnDisk = 0;
for (const [key, val] of Object.entries(fullMap)) {
  const fname = path.basename(val);
  if (!filesOnDisk.has(fname)) {
    console.log(`MISSING ON DISK: ${key} -> ${val}`);
    missingOnDisk++;
  }
}
console.log(`Verification: ${missingOnDisk} missing on disk.`);

// Output fullMap formatted for ProductImage.tsx
fs.writeFileSync(path.join(__dirname, 'generated_map.json'), JSON.stringify(fullMap, null, 2));
console.log('Saved to scripts/generated_map.json');
