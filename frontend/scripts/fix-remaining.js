const https = require('https');
const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '../public/images/products');

// Tested working Unsplash photo IDs for the 8 items
const CANDIDATES = {
  "purepixel_32": "photo-1585792180666-f7347c490ee2", // Monitor
  "velocespeed_27": "photo-1527443224154-c4a3942d3acf", // Monitor
  "codecraft_pro": "photo-1587829741301-dc798b83add3", // Mechanical keyboard
  "logitech_mx_master_3s": "photo-1527864550417-7fd91fc51a46", // Mouse
  "omnipad_mini": "photo-1561154464-82e9adf32764", // Tablet
  "anker_737_powerbank": "photo-1585338107529-13afc5f02586", // Powerbank
  "bytevault_1tb": "photo-1597872200969-2b65d56bd16b", // Portable SSD
  "webcam_4k": "photo-1507473885765-e6ed057f782c", // Desk camera/webcam
};

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

async function fixRemaining() {
  for (const [name, id] of Object.entries(CANDIDATES)) {
    const url = `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=80`;
    try {
      const buf = await downloadUrl(url);
      fs.writeFileSync(path.join(targetDir, `${name}.jpg`), buf);
      fs.writeFileSync(path.join(targetDir, `${name}.png`), buf);
      console.log(`[FIXED] ${name}.jpg / .png (${buf.length} bytes)`);
    } catch (e) {
      console.error(`[STILL FAILING] ${name}: ${e.message}`);
    }
  }
}

fixRemaining();
