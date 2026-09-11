const fs = require('fs');
const path = require('path');

const catalogPath = path.join(__dirname, '../lib/curated-catalog.ts');
const rawContent = fs.readFileSync(catalogPath, 'utf8');

// Normalize line endings for reliable searching
const content = rawContent.replace(/\r\n/g, '\n');

const startPattern = 'export const CURATED_MARKETPLACE_PRODUCTS: MarketplaceProduct[] = [';
const startIndex = content.indexOf(startPattern);
if (startIndex === -1) {
  console.error('Could not find start of CURATED_MARKETPLACE_PRODUCTS');
  process.exit(1);
}

const endPattern = '];\n\nexport interface FilterOptions {';
const endIndex = content.indexOf(endPattern);
if (endIndex === -1) {
  console.error('Could not find end of CURATED_MARKETPLACE_PRODUCTS');
  process.exit(1);
}

const prefix = content.slice(0, startIndex + startPattern.length);
const arrayContent = content.slice(startIndex + startPattern.length, endIndex);
const suffix = content.slice(endIndex);

let products;
try {
  products = eval(`[${arrayContent}]`);
} catch (e) {
  console.error('Failed to parse products array:', e.message);
  process.exit(1);
}

console.log(`Parsed ${products.length} products. Updating images...`);

products.forEach((p, idx) => {
  const base = p.primary_image_url
    .replace('/images/products/', '')
    .replace('.jpg', '')
    .replace('.png', '')
    .replace('_angle1', '');

  p.primary_image_url = `/images/products/${base}_angle1.jpg`;
  p.images = [
    {
      id: `${p.id}_img_1`,
      source_url: `/images/products/${base}_angle1.jpg`,
      image_type: "FRONT_VIEW",
      width: 1000,
      height: 750,
      alt_text: `${p.title} - Front / Main View`,
      sort_order: 0,
      is_primary: true
    },
    {
      id: `${p.id}_img_2`,
      source_url: `/images/products/${base}_angle2.jpg`,
      image_type: "ANGLED_VIEW",
      width: 1000,
      height: 750,
      alt_text: `${p.title} - 45° Perspective View`,
      sort_order: 1,
      is_primary: false
    },
    {
      id: `${p.id}_img_3`,
      source_url: `/images/products/${base}_angle3.jpg`,
      image_type: "DETAIL_VIEW",
      width: 1000,
      height: 750,
      alt_text: `${p.title} - Component / Detail View`,
      sort_order: 2,
      is_primary: false
    },
    {
      id: `${p.id}_img_4`,
      source_url: `/images/products/${base}_angle4.jpg`,
      image_type: "PROFILE_VIEW",
      width: 1000,
      height: 750,
      alt_text: `${p.title} - Side Profile / Alternative View`,
      sort_order: 3,
      is_primary: false
    }
  ];
});

// Format json representation
const formattedProducts = JSON.stringify(products, null, 2);
const innerJson = formattedProducts.slice(1, formattedProducts.length - 1).trim();

const newContent = `${prefix}\n  ${innerJson}\n${suffix}`;
fs.writeFileSync(catalogPath, newContent, 'utf8');

console.log('Successfully updated curated-catalog.ts with all 42 products x 4 distinct angles!');
