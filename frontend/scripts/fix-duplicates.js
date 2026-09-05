const https = require('https');
const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '../public/images/products');

const REPLACEMENTS = {
  "anker_737_powerbank": "photo-1620799140408-edc6dcb6d633",
  "powerbank_20k_65w": "photo-1585338107529-13afc5f02586",
  "gan_charger_100w": "photo-1583863788434-e58a36330cf0",
  "logitech_mx_master_3s": "photo-1626218174358-7769486c4b79",
  "bytemouse_simple": "photo-1527864550417-7fd91fc51a46",
  "bytevault_1tb": "photo-1544652478-6653e09f18a2",
  "sandisk_1tb_ssd": "photo-1597872200969-2b65d56bd16b",
  "codecraft_pro": "photo-1601445638532-3c6f6c3aa1d6",
  "keychron_k2": "photo-1587829741301-dc798b83add3",
  "hp_150_keyboard_mouse_combo": "photo-1595225476474-87563907a212",
  "samsung_galaxy_tab_s9": "photo-1589739900243-4b52cd9b104e",
  "hp_pavilion_15": "photo-1544244015-0df4b3ffc6b0",
  "zenith_carbon_mouse": "photo-1625842268584-8f3296236761",
  "kriyamat_xl": "photo-1607604276583-eef5d076aa5f",
  "novamat_xl": "photo-1586210579191-33b45e38fa2c",
  "kriyatrack_mouse": "photo-1584438784894-089d6a62b8fa",
  "novatrack_mouse": "photo-1627843563095-f6e94676cfe0",
  "laptop_stand_alum": "photo-1516321497487-e288fb19713f",
  "titancode_15": "photo-1588702547923-7093a6c3ba33",
  "lg_27inch_4k_monitor": "photo-1527443224154-c4a3942d3acf",
  "velocespeed_27": "photo-1545665277-5937489579f2",
  "zenith_oled_27": "photo-1551645120-d70bfe84c826",
  "purepixel_32": "photo-1542751371-adc38448a05e",
  "samsung_24inch_fhd_monitor": "photo-1585792180666-f7347c490ee2",
  "omnipad_mini": "photo-1544716278-ca5e3f4abd8c",
  "pad_pro_11": "photo-1561154464-82e9adf32764",
  "webcam_4k": "photo-1588508065123-287b28e013da",
  "screenbar_light": "photo-1507473885765-e6ed057f782c"
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

async function runReplacements() {
  console.log(`Downloading ${Object.keys(REPLACEMENTS).length} dedicated replacement photos...`);
  for (const [name, photoId] of Object.entries(REPLACEMENTS)) {
    const url = `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=800&q=80`;
    try {
      const buf = await downloadUrl(url);
      fs.writeFileSync(path.join(targetDir, `${name}.jpg`), buf);
      fs.writeFileSync(path.join(targetDir, `${name}.png`), buf);
      console.log(`[OK] Updated ${name}.jpg / .png (${buf.length} bytes)`);
    } catch (e) {
      console.error(`[ERROR] ${name}: ${e.message}`);
    }
  }
}

runReplacements();
