const fs = require('fs');
const path = require('path');

const publicProductsDir = path.join(__dirname, '../public/images/products');
if (!fs.existsSync(publicProductsDir)) {
  fs.mkdirSync(publicProductsDir, { recursive: true });
}
const existingLocalFiles = fs.readdirSync(publicProductsDir);
console.log('Currently existing local files in public/images/products:', existingLocalFiles.length);

// 1. Backend synthetic catalog
const backendCatalogPath = path.join(__dirname, '../../backend/data/synthetic_catalog.json');
let backendProducts = [];
if (fs.existsSync(backendCatalogPath)) {
  backendProducts = JSON.parse(fs.readFileSync(backendCatalogPath, 'utf8'));
}
console.log(`Backend synthetic catalog products: ${backendProducts.length}`);

// 2. Frontend curated catalog
const curatedCatalogContent = fs.readFileSync(path.join(__dirname, '../lib/curated-catalog.ts'), 'utf8');
const match = curatedCatalogContent.match(/export const CURATED_MARKETPLACE_PRODUCTS:\s*MarketplaceProduct\[\]\s*=\s*(\[[\s\S]*?\n\];)/);
let curatedProducts = [];
if (match) {
  let raw = match[1].trim();
  if (raw.endsWith(';')) raw = raw.slice(0, -1);
  curatedProducts = eval(raw);
}
console.log(`Frontend curated catalog products: ${curatedProducts.length}`);

// Collect all unique products
const allProductsMap = new Map();

backendProducts.forEach(p => {
  allProductsMap.set(p.id, {
    source: 'backend',
    id: p.id,
    sku: p.sku,
    name: p.name,
    category: p.category,
    image_url: p.image_url,
  });
});

curatedProducts.forEach(p => {
  if (!allProductsMap.has(p.id)) {
    allProductsMap.set(p.id, {
      source: 'curated',
      id: p.id,
      sku: p.provider_product_id,
      name: p.title,
      category: p.category,
      image_url: p.primary_image_url || (p.images && p.images[0] && p.images[0].source_url),
    });
  }
});

console.log(`Total unique products across system: ${allProductsMap.size}`);

const categorized = {};
const missingFiles = [];

for (const [id, prod] of allProductsMap.entries()) {
  const cat = (prod.category || 'other').toLowerCase();
  categorized[cat] = (categorized[cat] || 0) + 1;

  const imgPath = prod.image_url || '';
  const filename = path.basename(imgPath);
  const exists = existingLocalFiles.includes(filename) || existingLocalFiles.includes(filename.replace(/\.png$/, '.jpg')) || existingLocalFiles.includes(filename.replace(/\.jpg$/, '.png'));

  if (!exists) {
    missingFiles.push({
      id: prod.id,
      name: prod.name,
      category: prod.category,
      image_url: prod.image_url,
      expectedFilename: filename,
    });
  }
}

console.log('\n--- BREAKDOWN BY CATEGORY ---');
console.log(categorized);

console.log(`\n--- MISSING IMAGE FILES COUNT: ${missingFiles.length} ---`);
missingFiles.slice(0, 30).forEach((m, idx) => {
  console.log(`[${idx + 1}] ID: ${m.id} | Cat: ${m.category} | Name: "${m.name}" | Expected: ${m.expectedFilename}`);
});
if (missingFiles.length > 30) {
  console.log(`... and ${missingFiles.length - 30} more.`);
}

fs.writeFileSync(path.join(__dirname, 'missing_products.json'), JSON.stringify(missingFiles, null, 2));
console.log('\nWrote all missing products to scripts/missing_products.json');
