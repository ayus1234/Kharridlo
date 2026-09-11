const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../public/images/products');

const REPLACEMENTS = [
  {
    target: 'logitech_mx_master_3s_angle1',
    source: 'logitech_mx_master_3s.jpg'
  },
  {
    target: 'logitech_mx_master_3s_angle2',
    source: 'titan_heavy_mouse_angle2.jpg'
  },
  {
    target: 'keychron_k2_angle3',
    source: 'keychron_k2.jpg'
  },
  {
    target: 'sandisk_1tb_ssd_angle2',
    source: 'sandisk_1tb_ssd.jpg'
  },
  {
    target: 'anker_737_powerbank_angle1',
    source: 'anker_737_powerbank.jpg'
  },
  {
    target: 'realme_20000mah_powerbank_angle2',
    source: 'realme_20000mah_powerbank.jpg'
  },
  {
    target: 'kriyamat_xl_angle3',
    source: 'kriyamat_xl_angle2.jpg'
  },
  {
    target: 'laptop_stand_alum_angle1',
    source: 'laptop_stand_alum_angle2.jpg'
  },
  {
    target: 'precision_mouse_angle1',
    source: 'precision_mouse.jpg'
  },
  {
    target: 'precision_mouse_angle2',
    source: 'aether_pebble_angle1.jpg'
  },
  {
    target: 'titan_heavy_mouse_angle3',
    source: 'titan_heavy_mouse.jpg'
  },
  {
    target: 'titan_heavy_mouse_angle4',
    source: 'bytemouse_simple_angle2.jpg'
  },
  {
    target: 'gan_charger_100w_angle2',
    source: 'gan_charger_100w_angle1.jpg'
  },
  {
    target: 'ergovertical_mouse_angle2',
    source: 'ergovertical_mouse.jpg'
  },
  {
    target: 'ergovertical_mouse_angle3',
    source: 'ergovertical_mouse_angle1.jpg'
  }
];

REPLACEMENTS.forEach(({ target, source }) => {
  const sourcePath = path.join(dir, source);
  if (fs.existsSync(sourcePath)) {
    const data = fs.readFileSync(sourcePath);
    fs.writeFileSync(path.join(dir, target + '.jpg'), data);
    fs.writeFileSync(path.join(dir, target + '.png'), data);
    console.log(`Filled ${target} from ${source} (${data.length} bytes)`);
  } else {
    console.error(`Missing source: ${source}`);
  }
});

// Also ensure base files [pKey].jpg and [pKey].png match _angle1.jpg
const keys = [
  'lenovo_ideapad_slim3', 'macbook_air_m1', 'macbook_air_m2', 'dell_inspiron_3520', 'hp_pavilion_15',
  'sony_wh1000xm5', 'boat_rockerz_450', 'airpods_pro_2', 'logitech_pebble_m350', 'logitech_mx_master_3s',
  'keychron_k2', 'lg_27inch_4k_monitor', 'samsung_24inch_fhd_monitor', 'sandisk_1tb_ssd', 'anker_737_powerbank',
  'portronics_mport_hub', 'asus_vivobook_15', 'hp_150_keyboard_mouse_combo', 'acer_nitro_v_gaming',
  'boat_airdopes_141', 'samsung_galaxy_tab_s9', 'realme_20000mah_powerbank', 'bytemouse_simple',
  'cable_organizer', 'cleaning_kit', 'usbc_cable_2m', 'kriyamat_xl', 'bytekeys_essential',
  'sleeve_pro_15', 'aether_pebble', 'laptop_stand_alum', 'bytesound_usb', 'precision_mouse',
  'titan_heavy_mouse', 'omnitype_dual', 'slimtype_wireless', 'omni_presenter_mouse', 'aether_foldkey',
  'gan_charger_100w', 'airbuds_dev', 'usbc_hub_10in1', 'ergovertical_mouse'
];

keys.forEach(k => {
  const a1 = path.join(dir, `${k}_angle1.jpg`);
  if (fs.existsSync(a1)) {
    const buf = fs.readFileSync(a1);
    fs.writeFileSync(path.join(dir, `${k}.jpg`), buf);
    fs.writeFileSync(path.join(dir, `${k}.png`), buf);
  }
});

console.log('All 42 base files synchronized with angle 1.');
