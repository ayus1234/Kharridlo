const fs = require('fs');
const path = require('path');

const catalogContent = fs.readFileSync(path.join(__dirname, '../lib/curated-catalog.ts'), 'utf8');

const match = catalogContent.match(/export const CURATED_MARKETPLACE_PRODUCTS:\s*MarketplaceProduct\[\]\s*=\s*(\[[\s\S]*?\n\];)/);
if (!match) {
  console.error("Could not match CURATED_MARKETPLACE_PRODUCTS array");
  process.exit(1);
}
let rawArray = match[1].trim();
if (rawArray.endsWith(';')) rawArray = rawArray.slice(0, -1);

let products;
try {
  products = eval(rawArray);
  console.log(`Successfully parsed ${products.length} products from curated-catalog.ts`);
} catch (e) {
  console.error("Failed to parse array with eval:", e.message);
  process.exit(1);
}

const publicDir = path.join(__dirname, '../public');
const imgDir = path.join(publicDir, 'images/products');

const existingFiles = new Set(fs.existsSync(imgDir) ? fs.readdirSync(imgDir) : []);
console.log(`Total image files in public/images/products: ${existingFiles.size}`);

const imageUsage = {};
const emptyOrMissing = [];
const allImages = [];

products.forEach((p, idx) => {
  const primary = p.primary_image_url || (p.images && p.images[0] && p.images[0].source_url);
  const images = (p.images || []).map(i => i.source_url);
  
  console.log(`[${idx + 1}] ID: ${p.id} | Title: "${p.title.substring(0, 45)}..." | Category: ${p.category} | Primary: ${primary}`);

  if (!primary || primary.trim() === '' || primary === '/assets/laptop-product.png') {
    emptyOrMissing.push({ id: p.id, title: p.title, category: p.category, reason: 'Empty or fallback placeholder' });
  } else if (primary.startsWith('/images/products/')) {
    const filename = path.basename(primary);
    if (!existingFiles.has(filename)) {
      emptyOrMissing.push({ id: p.id, title: p.title, category: p.category, reason: `File not found on disk: ${filename}` });
    }
  }

  if (primary) {
    imageUsage[primary] = (imageUsage[primary] || 0) + 1;
    allImages.push(primary);
  }
});

console.log("\n--- DUPLICATE IMAGE USAGE ---");
let hasDuplicates = false;
for (const [img, count] of Object.entries(imageUsage)) {
  if (count > 1) {
    console.log(`DUPLICATE (${count} times): ${img}`);
    hasDuplicates = true;
  }
}
if (!hasDuplicates) {
  console.log("No duplicate primary images found in curated-catalog.ts!");
}

console.log("\n--- EMPTY OR MISSING IMAGES ---");
console.log(`Total empty/missing: ${emptyOrMissing.length}`);
emptyOrMissing.forEach(item => console.log(item));
