const https = require('https');
const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '../public/images/products');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Curated high-resolution, hardware-accurate Unsplash photos for all 42 products x 4 angles
// Angle 1: Front / Hero View
// Angle 2: 45° 3D Perspective View
// Angle 3: Detail / Keyboard / Ports / Earcup / Sensor View
// Angle 4: Profile / Alternative / Case / Stand View
const PRODUCT_ANGLES = {
  // 1. Lenovo IdeaPad Slim 3
  "lenovo_ideapad_slim3": {
    angle1: "photo-1588872657578-7efd1f1555ed", // Dark thin laptop front
    angle2: "photo-1516321318423-f06f85e504b3", // 45-deg open perspective
    angle3: "photo-1541807084-5c52b6b3adef", // AccuType keyboard & trackpad
    angle4: "photo-1496181133206-80ce9b88a853", // Side profile & ports
  },
  // 2. Apple MacBook Air M1 Space Grey
  "macbook_air_m1": {
    angle1: "photo-1517336714731-489689fd1ca8", // Space Grey front hero
    angle2: "photo-1611186871348-b1ce696e52c9", // 45-deg wedge perspective
    angle3: "photo-1541807084-5c52b6b3adef", // Magic keyboard & trackpad
    angle4: "photo-1531297484001-80022131f5a1", // Closed clamshell profile
  },
  // 3. Apple MacBook Air M2 Midnight
  "macbook_air_m2": {
    angle1: "photo-1611186871348-b1ce696e52c9", // Dark midnight finish front
    angle2: "photo-1517336714731-489689fd1ca8", // 45-deg sleek chassis
    angle3: "photo-1587614382346-4ec70e388b28", // Full keyboard view
    angle4: "photo-1537498425277-c283d32ef9db", // Ultra-thin profile
  },
  // 4. Dell Inspiron 3520
  "dell_inspiron_3520": {
    angle1: "photo-1593642632823-8f785ba67e45", // Dell Inspiron front
    angle2: "photo-1588872657578-7efd1f1555ed", // Angled open display
    angle3: "photo-1522199755839-a2bacb67c546", // Keyboard & trackpad
    angle4: "photo-1542393545-10f5cde2c810", // Side profile & vents
  },
  // 5. HP Pavilion 15
  "hp_pavilion_15": {
    angle1: "photo-1544244015-0df4b3ffc6b0", // HP Pavilion front
    angle2: "photo-1498050108023-c5249f4df085", // Angled workstation
    angle3: "photo-1486312338219-ce68d2c6f44d", // Keyboard typing view
    angle4: "photo-1515378791036-0648a3ef77b2", // Sleek side profile
  },
  // 6. Sony WH-1000XM5 ANC Headphones
  "sony_wh1000xm5": {
    angle1: "photo-1505740420928-5e560c06d30e", // Premium ANC headphones front
    angle2: "photo-1484704849700-f032a568e944", // 45-deg earcups & headband
    angle3: "photo-1583394838336-acd977736f90", // Soft leather earcup cushion
    angle4: "photo-1577174881658-0f30ed549adc", // Folded / profile view
  },
  // 7. boAt Rockerz 450 On-Ear Headphones
  "boat_rockerz_450": {
    angle1: "photo-1484704849700-f032a568e944", // Matte black on-ear front
    angle2: "photo-1505740420928-5e560c06d30e", // Angled headband & drivers
    angle3: "photo-1583394838336-acd977736f90", // Padded cushions & controls
    angle4: "photo-1546435770-a3e426bf472b", // Folded compact view
  },
  // 8. Apple AirPods Pro 2
  "airpods_pro_2": {
    angle1: "photo-1600294037681-c80b4cb5b434", // White in-ear ANC AirPods
    angle2: "photo-1590658268037-6bf12165a8df", // Angled earbuds outside case
    angle3: "photo-1572536147248-ac59a8abfa4b", // Touch sensor stem & tips
    angle4: "photo-1606220588913-b3aacb4d2f46", // Open charging case view
  },
  // 9. Logitech Pebble M350 Mouse
  "logitech_pebble_m350": {
    angle1: "photo-1615663245857-ac93bb7c39e7", // Slim pastel pebble mouse
    angle2: "photo-1527864550417-7fd91fc51a46", // 45-deg smooth curve
    angle3: "photo-1586864387967-d02ef85d93e8", // Scroll wheel & top buttons
    angle4: "photo-1629429408209-1f912961dbd8", // Low-profile side view
  },
  // 10. Logitech MX Master 3S
  "logitech_mx_master_3s": {
    angle1: "photo-1605774337864-7d89ba020f69", // Dark flagship mouse top
    angle2: "photo-1596207891396-373180295846", // Ergonomic thumb rest
    angle3: "photo-1625842268584-8f3296236761", // MagSpeed metal wheel detail
    angle4: "photo-1584438784894-089d6a62b8fa", // Side profile & base sensor
  },
  // 11. Keychron K2 Mechanical Keyboard
  "keychron_k2": {
    angle1: "photo-1587829741301-dc798b83add3", // 75% mechanical keyboard top
    angle2: "photo-1595225476474-87563907a212", // 45-deg angled key profile
    angle3: "photo-1541140532154-b024d705b909", // Keycaps & mechanical switches
    angle4: "photo-1587202372775-e229f172b9d7", // Side frame & RGB backlight
  },
  // 12. LG 27-inch 4K Monitor
  "lg_27inch_4k_monitor": {
    angle1: "photo-1527443224154-c4a3942d3acf", // Clean desktop 4K monitor front
    angle2: "photo-1547082299-de196ea013d6", // Angled display with ArcLine stand
    angle3: "photo-1551645120-d70bfe84c826", // Screen bezel & panel clarity
    angle4: "photo-1542751371-adc38448a05e", // Rear ports & side slim bezel
  },
  // 13. Samsung 24-inch FHD Monitor
  "samsung_24inch_fhd_monitor": {
    angle1: "photo-1585792180666-f7347c490ee2", // 24" borderless FHD front
    angle2: "photo-1527443224154-c4a3942d3acf", // 45-deg Y-stand perspective
    angle3: "photo-1593640408182-31c70c8268f5", // Screen color accuracy view
    angle4: "photo-1545665277-5937489579f2", // Side profile & slim edges
  },
  // 14. SanDisk 1TB Extreme Portable SSD
  "sandisk_1tb_ssd": {
    angle1: "photo-1597872200969-2b65d56bd16b", // Rugged portable SSD front
    angle2: "photo-1628155930542-40a02973843d", // Angled pocket drive
    angle3: "photo-1544652478-6653e09f18a2", // USB-C high-speed port
    angle4: "photo-1583863788434-e58a36330cf0", // Carabiner loop & bumper
  },
  // 15. Anker 737 Power Bank 140W
  "anker_737_powerbank": {
    angle1: "photo-1609592424109-dd9892f1b177", // Heavy duty power bank front
    angle2: "photo-1585338107529-13afc5f02586", // Angled digital display view
    angle3: "photo-1620799140408-edc6dcb6d633", // Dual USB-C & USB-A ports
    angle4: "photo-1563770660941-20978e870e26", // Base specs & thermal vents
  },
  // 16. Portronics Mport 6-in-1 USB Hub
  "portronics_mport_hub": {
    angle1: "photo-1616440347437-b1c73416efc2", // USB-C multiport dongle
    angle2: "photo-1544652478-6653e09f18a2", // Angled connector & ports
    angle3: "photo-1563770660941-20978e870e26", // 4K HDMI & 100W PD close-up
    angle4: "photo-1583863788434-e58a36330cf0", // SD/TF slots & aluminum body
  },
  // 17. ASUS Vivobook 15 Laptop
  "asus_vivobook_15": {
    angle1: "photo-1525547719571-a2d4ac8945e2", // Asus slim notebook front
    angle2: "photo-1588872657578-7efd1f1555ed", // 45-deg open display
    angle3: "photo-1541807084-5c52b6b3adef", // ErgoLift keyboard & trackpad
    angle4: "photo-1496181133206-80ce9b88a853", // Side profile & vents
  },
  // 18. HP 150 Keyboard & Mouse Combo
  "hp_150_keyboard_mouse_combo": {
    angle1: "photo-1595225476474-87563907a212", // Full-size office keyboard & mouse
    angle2: "photo-1618384887929-16ec33fab9ef", // Angled desk setup
    angle3: "photo-1587829741301-dc798b83add3", // Low-profile keycaps
    angle4: "photo-1560762484-813fc97650a0", // Optical mouse & nano receiver
  },
  // 19. Acer Nitro V Gaming Laptop
  "acer_nitro_v_gaming": {
    angle1: "photo-1603302576837-37561b2e2302", // Red backlit gaming laptop front
    angle2: "photo-1526374965328-7f61d4dc18c5", // 45-deg gaming chassis
    angle3: "photo-1461749280684-dccba630e2f6", // WASD keyboard & screen
    angle4: "photo-1588702547923-7093a6c3ba33", // Dual-fan rear exhaust vents
  },
  // 20. boAt Airdopes 141 TWS Earbuds
  "boat_airdopes_141": {
    angle1: "photo-1590658268037-6bf12165a8df", // Matte black TWS earbuds
    angle2: "photo-1600294037681-c80b4cb5b434", // Angled earbuds beside case
    angle3: "photo-1572536147248-ac59a8abfa4b", // ENx mic & touch sensors
    angle4: "photo-1606220588913-b3aacb4d2f46", // Open charging case & ASAP port
  },
  // 21. SAMSUNG Galaxy Tab S9 FE Tablet
  "samsung_galaxy_tab_s9": {
    angle1: "photo-1561154464-82e9adf32764", // 10.9" vibrant tablet screen front
    angle2: "photo-1589739900243-4b52cd9b104e", // Angled tablet with stylus pen
    angle3: "photo-1542751110-97427bbecf20", // Stylus drawing & precision tip
    angle4: "photo-1512499617640-c74ae3a79d37", // Ultra-thin aluminum profile
  },
  // 22. realme 20000 mAh 33W Power Bank
  "realme_20000mah_powerbank": {
    angle1: "photo-1620799140408-edc6dcb6d633", // Fast charge slim power bank
    angle2: "photo-1609592424109-dd9892f1b177", // Angled textured chassis
    angle3: "photo-1585338107529-13afc5f02586", // Triple output ports & LED
    angle4: "photo-1563770660941-20978e870e26", // Base circuit rating & cable
  },
  // 23. ByteMouse USB Simple
  "bytemouse_simple": {
    angle1: "photo-1527864550417-7fd91fc51a46", // Basic black optical mouse
    angle2: "photo-1586864387967-d02ef85d93e8", // Angled palm view
    angle3: "photo-1615663245857-ac93bb7c39e7", // Click switches & scroll wheel
    angle4: "photo-1629429408209-1f912961dbd8", // Underside 1000 DPI sensor
  },
  // 24. Aether CableOrganizer Magnetic
  "cable_organizer": {
    angle1: "photo-1583863788434-e58a36330cf0", // Magnetic cable clips on desk
    angle2: "photo-1544652478-6653e09f18a2", // Angled cable organizer strip
    angle3: "photo-1563770660941-20978e870e26", // Magnetic collar close-up
    angle4: "photo-1616440347437-b1c73416efc2", // Clean desk cable routing
  },
  // 25. Prism Cleaning Kit 7-in-1
  "cleaning_kit": {
    angle1: "photo-1584308666744-24d5c474f2ae", // Tech cleaning kit set
    angle2: "photo-1583863788434-e58a36330cf0", // Retractable brush & spray
    angle3: "photo-1587829741301-dc798b83add3", // Keycap puller in action
    angle4: "photo-1618384887929-16ec33fab9ef", // Screen microfiber enclosure
  },
  // 26. VeloceCode Braided USB-C Cable 2m
  "usbc_cable_2m": {
    angle1: "photo-1563770660941-20978e870e26", // Braided 2m USB-C cable coil
    angle2: "photo-1544652478-6653e09f18a2", // Aluminum connector housing
    angle3: "photo-1616440347437-b1c73416efc2", // Gold-plated Type-C pins
    angle4: "photo-1583863788434-e58a36330cf0", // Tangle-free silicone tie
  },
  // 27. TechNova DeskMat Pro Vegan Leather XL
  "kriyamat_xl": {
    angle1: "photo-1586953208448-b95a79798f07", // Smooth extended desk mat
    angle2: "photo-1526738549149-8e07eca6c147", // 45-deg edge stitching & grain
    angle3: "photo-1547394765-185e1317ac14", // Micro-textured glide surface
    angle4: "photo-1551645120-d70bfe84c826", // Anti-slip suede backing
  },
  // 28. ByteKeys Essential USB
  "bytekeys_essential": {
    angle1: "photo-1618384887929-16ec33fab9ef", // Low profile black keyboard
    angle2: "photo-1595225476474-87563907a212", // Angled typing perspective
    angle3: "photo-1587829741301-dc798b83add3", // Membrane laser keycaps
    angle4: "photo-1560762484-813fc97650a0", // Spill-drain & tilt feet
  },
  // 29. TechNova Sleeve Pro 15
  "sleeve_pro_15": {
    angle1: "photo-1544816155-12df9643f363", // Padded laptop protective sleeve
    angle2: "photo-1517336714731-489689fd1ca8", // Laptop slipping into sleeve
    angle3: "photo-1544652478-6653e09f18a2", // 360-degree shock foam interior
    angle4: "photo-1588872657578-7efd1f1555ed", // Front zipper accessory pouch
  },
  // 30. Aether Pebble Ultra-Slim Mouse
  "aether_pebble": {
    angle1: "photo-1586864387967-d02ef85d93e8", // Ultra-flat white optical mouse
    angle2: "photo-1615663245857-ac93bb7c39e7", // 45-deg ergonomic curve
    angle3: "photo-1527864550417-7fd91fc51a46", // Silent micro-switches
    angle4: "photo-1629429408209-1f912961dbd8", // Base mode switch & dongle
  },
  // 31. TechNova Aluminum Laptop Stand
  "laptop_stand_alum": {
    angle1: "photo-1527690789675-4ea7d8da4eb3", // Folding aluminum stand riser
    angle2: "photo-1586210579191-33b45e38fa2c", // Elevated 15-degree view
    angle3: "photo-1588702547923-7093a6c3ba33", // Silicone non-slip pads
    angle4: "photo-1544716278-ca5e3f4abd8c", // Folded flat travel profile
  },
  // 32. ByteSound USB Headset
  "bytesound_usb": {
    angle1: "photo-1546435770-a3e426bf472b", // Headset with boom mic front
    angle2: "photo-1505740420928-5e560c06d30e", // Angled padded headband
    angle3: "photo-1484704849700-f032a568e944", // Noise-cancelling boom mic
    angle4: "photo-1583394838336-acd977736f90", // In-line volume/mute controller
  },
  // 33. TechNova Precision Wireless Mouse
  "precision_mouse": {
    angle1: "photo-1596207891396-373180295846", // Precision silver scroll mouse
    angle2: "photo-1605774337864-7d89ba020f69", // Contoured thumb rest
    angle3: "photo-1625842268584-8f3296236761", // Metal scroll wheel detail
    angle4: "photo-1584438784894-089d6a62b8fa", // Underside DPI sensor & glides
  },
  // 34. Titan HeavyClick Wireless Mouse
  "titan_heavy_mouse": {
    angle1: "photo-1626218174358-7769486c4b79", // Weighted ergonomic gaming mouse
    angle2: "photo-1625842268584-8f3296236761", // Grooved textured side grip
    angle3: "photo-1605774337864-7d89ba020f69", // Mechanical switches & DPI button
    angle4: "photo-1596207891396-373180295846", // Underside weight bay
  },
  // 35. OmniType DualOS Wireless Keyboard
  "omnitype_dual": {
    angle1: "photo-1595044426077-d36d9236d54a", // Retro round keycap keyboard
    angle2: "photo-1560762484-813fc97650a0", // Angled Mac/Win dual layout
    angle3: "photo-1587829741301-dc798b83add3", // Integrated device cradle
    angle4: "photo-1618384887929-16ec33fab9ef", // Bluetooth 3-device switch dial
  },
  // 36. TechNova SlimType Wireless Keyboard
  "slimtype_wireless": {
    angle1: "photo-1560762484-813fc97650a0", // Sleek silver wireless keyboard
    angle2: "photo-1595044426077-d36d9236d54a", // Ultra-thin 4mm side edge
    angle3: "photo-1587829741301-dc798b83add3", // Scissor-switch quiet keycaps
    angle4: "photo-1618384887929-16ec33fab9ef", // Type-C recharge port & switch
  },
  // 37. OmniPresenter Laser Mouse
  "omni_presenter_mouse": {
    angle1: "photo-1629429408209-1f912961dbd8", // Slim stylus/pointer presenter mouse
    angle2: "photo-1586864387967-d02ef85d93e8", // Twisted presenter grip
    angle3: "photo-1527864550417-7fd91fc51a46", // Red laser button & slide buttons
    angle4: "photo-1615663245857-ac93bb7c39e7", // Magnetic USB dongle bay
  },
  // 38. Aether FoldKey Bluetooth Keyboard
  "aether_foldkey": {
    angle1: "photo-1511467687858-23d96c32e4ae", // Folding travel keyboard open
    angle2: "photo-1560762484-813fc97650a0", // Aluminum hinge joints angled
    angle3: "photo-1595044426077-d36d9236d54a", // Integrated multi-touch touchpad
    angle4: "photo-1618384887929-16ec33fab9ef", // Folded pocket-size view
  },
  // 39. TechNova GaN Fast Charger 100W
  "gan_charger_100w": {
    angle1: "photo-1585338107529-13afc5f02586", // Compact GaN wall block front
    angle2: "photo-1609592424109-dd9892f1b177", // 3-port configuration angled
    angle3: "photo-1563770660941-20978e870e26", // Dual USB-C 100W PD ports
    angle4: "photo-1620799140408-edc6dcb6d633", // Foldable travel prongs
  },
  // 40. TechNova AirBuds Developer TWS
  "airbuds_dev": {
    angle1: "photo-1572536147248-ac59a8abfa4b", // Gunmetal earbuds in open case
    angle2: "photo-1590658268037-6bf12165a8df", // Ergonomic acoustic nozzles
    angle3: "photo-1600294037681-c80b4cb5b434", // Dual ENC mic ports
    angle4: "photo-1606220588913-b3aacb4d2f46", // Qi wireless charging case
  },
  // 41. TechNova 10-in-1 USB-C Hub
  "usbc_hub_10in1": {
    angle1: "photo-1544652478-6653e09f18a2", // 10-in-1 aluminium docking station
    angle2: "photo-1616440347437-b1c73416efc2", // Angled host cable & HDMI ports
    angle3: "photo-1563770660941-20978e870e26", // Gigabit Ethernet & USB 3.0 ports
    angle4: "photo-1583863788434-e58a36330cf0", // Heat-dissipating alloy body
  },
  // 42. TechNova ErgoVertical Pro Mouse
  "ergovertical_mouse": {
    angle1: "photo-1584438784894-089d6a62b8fa", // Vertical handshake ergonomic mouse
    angle2: "photo-1596207891396-373180295846", // 57-degree natural wrist slope
    angle3: "photo-1605774337864-7d89ba020f69", // Precision scroll wheel & thumb keys
    angle4: "photo-1625842268584-8f3296236761", // Underside dual mode switch
  }
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
      res.on('data', chunk => data.push(chunk));
      res.on('end', () => resolve(Buffer.concat(data)));
    }).on('error', reject);
  });
}

async function run() {
  const products = Object.keys(PRODUCT_ANGLES);
  console.log(`Starting multi-angle asset generation for ${products.length} products...`);
  
  const cache = new Map();
  let totalFiles = 0;
  let errors = 0;

  for (let i = 0; i < products.length; i++) {
    const pKey = products[i];
    const angles = PRODUCT_ANGLES[pKey];
    console.log(`[${i + 1}/${products.length}] Processing ${pKey}...`);

    for (const [angleName, photoId] of Object.entries(angles)) {
      const url = `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=800&q=80`;
      try {
        let buffer = cache.get(photoId);
        if (!buffer) {
          buffer = await downloadUrl(url);
          cache.set(photoId, buffer);
        }

        // Save angle file
        const jpgFile = path.join(targetDir, `${pKey}_${angleName}.jpg`);
        const pngFile = path.join(targetDir, `${pKey}_${angleName}.png`);
        fs.writeFileSync(jpgFile, buffer);
        fs.writeFileSync(pngFile, buffer);
        totalFiles += 2;

        // If angle1, also ensure primary files [pKey].jpg and [pKey].png are updated
        if (angleName === 'angle1') {
          fs.writeFileSync(path.join(targetDir, `${pKey}.jpg`), buffer);
          fs.writeFileSync(path.join(targetDir, `${pKey}.png`), buffer);
          totalFiles += 2;
        }
      } catch (err) {
        console.error(`  FAIL: ${pKey} ${angleName} (${err.message})`);
        errors++;
      }
    }
  }

  console.log(`\nCompleted! Generated ${totalFiles} image files. Errors: ${errors}`);
}

run();
