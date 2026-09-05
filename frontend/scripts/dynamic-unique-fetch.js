const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const targetDir = path.join(__dirname, '../public/images/products');

function fetchHtml(query) {
  return new Promise((resolve) => {
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    };
    https.get(`https://unsplash.com/s/photos/${encodeURIComponent(query)}`, options, (res) => {
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => resolve(data));
    }).on('error', () => resolve(''));
  });
}

function downloadUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadUrl(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Status ${res.statusCode}`));
      }
      const data = [];
      res.on('data', c => data.push(c));
      res.on('end', () => resolve(Buffer.concat(data)));
    }).on('error', reject);
  });
}

const NEED_NEW_PHOTOS = [
  { file: 'codecraft_pro', search: 'gaming keyboard mechanical' },
  { file: 'titan_heavy_mouse', search: 'gaming mouse pc' },
  { file: 'zenith_carbon_mouse', search: 'computer mouse dark' },
  { file: 'samsung_galaxy_tab_s9', search: 'tablet screen pen' },
  { file: 'gan_charger_100w', search: 'wall charger usb-c power' },
  { file: 'laptop_stand_alum', search: 'laptop stand desk' },
  { file: 'omnipad_mini', search: 'ipad tablet mini' },
  { file: 'novamat_xl', search: 'desk pad mat setup' },
  { file: 'webcam_4k', search: 'webcam computer camera' },
  { file: 'zenith_oled_27', search: 'oled computer monitor screen' }
];

async function run() {
  const existingFiles = fs.readdirSync(targetDir).filter(f => f.endsWith('.jpg'));
  const existingHashes = new Set();
  existingFiles.forEach(f => {
    const buf = fs.readFileSync(path.join(targetDir, f));
    existingHashes.add(crypto.createHash('md5').update(buf).digest('hex'));
  });

  console.log(`Starting dynamic distinct photo resolution for ${NEED_NEW_PHOTOS.length} items...`);

  for (const item of NEED_NEW_PHOTOS) {
    console.log(`Searching for: ${item.search}...`);
    const html = await fetchHtml(item.search);
    
    // Extract photo IDs from links: /photos/[slug]-[id] or /photos/[id]
    const matches = [...html.matchAll(/images\.unsplash\.com\/(photo-[a-zA-Z0-9_-]+)/g)].map(m => m[1]);
    const uniqueMatches = [...new Set(matches)];
    console.log(`Found ${uniqueMatches.length} candidate photos for ${item.file}`);

    let saved = false;
    for (const photoId of uniqueMatches) {
      const url = `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=800&q=80`;
      try {
        const buf = await downloadUrl(url);
        const hash = crypto.createHash('md5').update(buf).digest('hex');
        if (!existingHashes.has(hash)) {
          fs.writeFileSync(path.join(targetDir, `${item.file}.jpg`), buf);
          fs.writeFileSync(path.join(targetDir, `${item.file}.png`), buf);
          existingHashes.add(hash);
          console.log(`[SUCCESS] Saved 100% brand new distinct photo for ${item.file} (${buf.length} bytes)`);
          saved = true;
          break;
        }
      } catch {
        // try next candidate
      }
    }

    if (!saved) {
      console.log(`[WARNING] Could not find brand new photo for ${item.file}`);
    }
  }

  // Final uniqueness audit
  const finalFiles = fs.readdirSync(targetDir).filter(f => f.endsWith('.jpg'));
  const finalHashes = {};
  finalFiles.forEach(f => {
    const buf = fs.readFileSync(path.join(targetDir, f));
    const h = crypto.createHash('md5').update(buf).digest('hex');
    if (!finalHashes[h]) finalHashes[h] = [];
    finalHashes[h].push(f);
  });

  const dupes = Object.entries(finalHashes).filter(([h, items]) => items.length > 1);
  console.log(`\n======================================================`);
  console.log(`FINAL DUPLICATE AUDIT: ${dupes.length} duplicate groups.`);
  if (dupes.length === 0) {
    console.log(`SUCCESS! ALL ${finalFiles.length} PRODUCT IMAGES ARE 100% DISTINCT AND UNIQUE!`);
  } else {
    dupes.forEach(([h, items]) => console.log('Dupe:', items.join(', ')));
  }
  console.log(`======================================================\n`);
}

run();
