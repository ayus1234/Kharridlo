const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const targetDir = path.join(__dirname, '../public/images/products');

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

// Candidates to disambiguate the remaining 12 pairs
const NEW_CANDIDATES = {
  "anker_737_powerbank": "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=800&q=80",
  "bytevault_1tb": "https://images.unsplash.com/photo-1531492746076-161ca9bcad58?auto=format&fit=crop&w=800&q=80",
  "laptop_stand_alum": "https://images.unsplash.com/photo-1588702547923-7093a6c3ba33?auto=format&fit=crop&w=800&q=80",
  "gan_charger_100w": "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80",
  "codecraft_pro": "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?auto=format&fit=crop&w=800&q=80",
  "novamat_xl": "https://images.unsplash.com/photo-1595044426077-d36d9236d54a?auto=format&fit=crop&w=800&q=80",
  "titan_heavy_mouse": "https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?auto=format&fit=crop&w=800&q=80",
  "webcam_4k": "https://images.unsplash.com/photo-1544652478-6653e09f18a2?auto=format&fit=crop&w=800&q=80",
  "omnipad_mini": "https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?auto=format&fit=crop&w=800&q=80",
  "samsung_galaxy_tab_s9": "https://images.unsplash.com/photo-1542751110-97427bbecf20?auto=format&fit=crop&w=800&q=80",
  "zenith_oled_27": "https://images.unsplash.com/photo-1547082299-de196ea013d6?auto=format&fit=crop&w=800&q=80",
  "zenith_carbon_mouse": "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=800&q=80"
};

async function solveAll() {
  for (const [name, url] of Object.entries(NEW_CANDIDATES)) {
    try {
      const buf = await downloadUrl(url);
      fs.writeFileSync(path.join(targetDir, `${name}.jpg`), buf);
      fs.writeFileSync(path.join(targetDir, `${name}.png`), buf);
      console.log(`[SUCCESS] ${name} updated (${buf.length} bytes)`);
    } catch (err) {
      console.error(`[ERROR] ${name}: ${err.message}`);
    }
  }

  // Verify hash uniqueness across entire directory
  const files = fs.readdirSync(targetDir).filter(f => f.endsWith('.jpg'));
  const hashes = {};
  for (const f of files) {
    const buf = fs.readFileSync(path.join(targetDir, f));
    const hash = crypto.createHash('md5').update(buf).digest('hex');
    if (!hashes[hash]) hashes[hash] = [];
    hashes[hash].push(f);
  }

  const dupes = Object.entries(hashes).filter(([h, items]) => items.length > 1);
  console.log(`\nFinal Uniqueness Result: ${dupes.length} duplicate groups.`);
  if (dupes.length === 0) {
    console.log('PERFECT! 100% OF ALL PRODUCTS HAVE STRICTLY UNIQUE IMAGES!');
  } else {
    dupes.forEach(([h, items]) => console.log('Dupes:', items.join(', ')));
  }
}

solveAll();
