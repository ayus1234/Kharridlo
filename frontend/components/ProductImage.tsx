"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Laptop, Cpu, Monitor, Headphones, Mouse, Keyboard, Cable, ShieldCheck } from "lucide-react";

interface ProductImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  category?: string;
  productId?: string;
}

// 1. Direct local verified image mapping for all 42 products by ID, SKU and title keyword
const EXACT_PRODUCT_MAP: Record<string, string> = {
  // Laptops
  "amz_B0BT9SCV9B": "/images/products/lenovo_ideapad_slim3.jpg",
  "amz_B08N5XSG8Z": "/images/products/macbook_air_m1.jpg",
  "amz_B0B3BPH58N": "/images/products/macbook_air_m2.jpg",
  "amz_B09NL8H8XZ": "/images/products/dell_inspiron_3520.jpg",
  "amz_B09V18R53H": "/images/products/hp_pavilion_15.jpg",
  "fk_COMGZFH6ZG8VPHGZ": "/images/products/asus_vivobook_15.jpg",
  "fk_COMGT6G7YGHZZZZZ": "/images/products/acer_nitro_v_gaming.jpg",

  // Audio & Earbuds
  "amz_B09XS7JWHH": "/images/products/sony_wh1000xm5.jpg",
  "amz_B07PR1CL3S": "/images/products/boat_rockerz_450.jpg",
  "amz_B0CHX1W1XY": "/images/products/airpods_pro_2.jpg",
  "fk_ACCGZFH6ZG8VPHGZ": "/images/products/boat_airdopes_141.jpg",
  "prod_hp_05": "/images/products/bytesound_usb.jpg",
  "DK-HP-05": "/images/products/bytesound_usb.jpg",
  "prod_hp_02": "/images/products/airbuds_dev.jpg",
  "DK-HP-02": "/images/products/airbuds_dev.jpg",

  // Mice & Pointers
  "amz_B091J3F6HC": "/images/products/logitech_pebble_m350.jpg",
  "amz_B0B11DMP1L": "/images/products/logitech_mx_master_3s.jpg",
  "prod_mouse_05": "/images/products/bytemouse_simple.jpg",
  "DK-MS-05": "/images/products/bytemouse_simple.jpg",
  "prod_mouse_07": "/images/products/aether_pebble.jpg",
  "DK-MS-07": "/images/products/aether_pebble.jpg",
  "prod_mouse_01": "/images/products/precision_mouse.jpg",
  "DK-MS-01": "/images/products/precision_mouse.jpg",
  "prod_mouse_09": "/images/products/titan_heavy_mouse.jpg",
  "DK-MS-09": "/images/products/titan_heavy_mouse.jpg",
  "prod_mouse_02": "/images/products/ergovertical_mouse.jpg",
  "DK-MS-02": "/images/products/ergovertical_mouse.jpg",
  "prod_mouse_10": "/images/products/omni_presenter_mouse.jpg",
  "DK-MS-10": "/images/products/omni_presenter_mouse.jpg",

  // Keyboards & Combos
  "amz_B0866BD53R": "/images/products/keychron_k2.jpg",
  "fk_ACCGGZ7QZTYK86HF": "/images/products/hp_150_keyboard_mouse_combo.jpg",
  "prod_kb_06": "/images/products/bytekeys_essential.jpg",
  "DK-KB-06": "/images/products/bytekeys_essential.jpg",
  "prod_kb_08": "/images/products/omnitype_dual.jpg",
  "DK-KB-08": "/images/products/omnitype_dual.jpg",
  "prod_kb_02": "/images/products/slimtype_wireless.jpg",
  "DK-KB-02": "/images/products/slimtype_wireless.jpg",
  "prod_kb_07": "/images/products/aether_foldkey.jpg",
  "DK-KB-07": "/images/products/aether_foldkey.jpg",

  // Displays & Monitors
  "amz_B07PGL2ZSL": "/images/products/lg_27inch_4k_monitor.jpg",
  "amz_B08J82K4GX": "/images/products/samsung_24inch_fhd_monitor.jpg",

  // Storage, Power & Accessories
  "amz_B08GTYFC37": "/images/products/sandisk_1tb_ssd.jpg",
  "amz_B09VPHVT2Z": "/images/products/anker_737_powerbank.jpg",
  "amz_B09V7Y16R2": "/images/products/portronics_mport_hub.jpg",
  "fk_TABGZFH6ZG8VPHGZ": "/images/products/samsung_galaxy_tab_s9.jpg",
  "fk_PWGZFH6ZG8VPHGZ": "/images/products/realme_20000mah_powerbank.jpg",
  "prod_acc_09": "/images/products/cable_organizer.jpg",
  "DK-ACC-09": "/images/products/cable_organizer.jpg",
  "prod_acc_11": "/images/products/cleaning_kit.jpg",
  "DK-ACC-11": "/images/products/cleaning_kit.jpg",
  "prod_acc_06": "/images/products/usbc_cable_2m.jpg",
  "DK-ACC-06": "/images/products/usbc_cable_2m.jpg",
  "prod_acc_04": "/images/products/kriyamat_xl.jpg",
  "DK-ACC-04": "/images/products/kriyamat_xl.jpg",
  "prod_acc_10": "/images/products/sleeve_pro_15.jpg",
  "DK-ACC-10": "/images/products/sleeve_pro_15.jpg",
  "prod_acc_03": "/images/products/laptop_stand_alum.jpg",
  "DK-ACC-03": "/images/products/laptop_stand_alum.jpg",
  "prod_acc_02": "/images/products/gan_charger_100w.jpg",
  "DK-ACC-02": "/images/products/gan_charger_100w.jpg",
  "prod_acc_01": "/images/products/usbc_hub_10in1.jpg",
  "DK-ACC-01": "/images/products/usbc_hub_10in1.jpg"
};

// Keyword-based model fallback mapper
const KEYWORD_MAP: Array<{ keyword: string; path: string }> = [
  { keyword: "lenovo", path: "/images/products/lenovo_ideapad_slim3.jpg" },
  { keyword: "macbook air m1", path: "/images/products/macbook_air_m1.jpg" },
  { keyword: "macbook air m2", path: "/images/products/macbook_air_m2.jpg" },
  { keyword: "macbook", path: "/images/products/macbook_air_m1.jpg" },
  { keyword: "dell", path: "/images/products/dell_inspiron_3520.jpg" },
  { keyword: "hp pavilion", path: "/images/products/hp_pavilion_15.jpg" },
  { keyword: "vivobook", path: "/images/products/asus_vivobook_15.jpg" },
  { keyword: "nitro", path: "/images/products/acer_nitro_v_gaming.jpg" },
  { keyword: "wh-1000xm5", path: "/images/products/sony_wh1000xm5.jpg" },
  { keyword: "rockerz", path: "/images/products/boat_rockerz_450.jpg" },
  { keyword: "airpods", path: "/images/products/airpods_pro_2.jpg" },
  { keyword: "airdopes", path: "/images/products/boat_airdopes_141.jpg" },
  { keyword: "bytesound", path: "/images/products/bytesound_usb.jpg" },
  { keyword: "airbuds", path: "/images/products/airbuds_dev.jpg" },
  { keyword: "pebble", path: "/images/products/logitech_pebble_m350.jpg" },
  { keyword: "mx master", path: "/images/products/logitech_mx_master_3s.jpg" },
  { keyword: "bytemouse", path: "/images/products/bytemouse_simple.jpg" },
  { keyword: "precision mouse", path: "/images/products/precision_mouse.jpg" },
  { keyword: "heavyclick", path: "/images/products/titan_heavy_mouse.jpg" },
  { keyword: "ergovertical", path: "/images/products/ergovertical_mouse.jpg" },
  { keyword: "vertical", path: "/images/products/ergovertical_mouse.jpg" },
  { keyword: "presenter", path: "/images/products/omni_presenter_mouse.jpg" },
  { keyword: "keychron", path: "/images/products/keychron_k2.jpg" },
  { keyword: "hp 150", path: "/images/products/hp_150_keyboard_mouse_combo.jpg" },
  { keyword: "bytekeys", path: "/images/products/bytekeys_essential.jpg" },
  { keyword: "omnitype", path: "/images/products/omnitype_dual.jpg" },
  { keyword: "slimtype", path: "/images/products/slimtype_wireless.jpg" },
  { keyword: "foldkey", path: "/images/products/aether_foldkey.jpg" },
  { keyword: "lg 27", path: "/images/products/lg_27inch_4k_monitor.jpg" },
  { keyword: "samsung 24", path: "/images/products/samsung_24inch_fhd_monitor.jpg" },
  { keyword: "monitor", path: "/images/products/lg_27inch_4k_monitor.jpg" },
  { keyword: "sandisk", path: "/images/products/sandisk_1tb_ssd.jpg" },
  { keyword: "ssd", path: "/images/products/sandisk_1tb_ssd.jpg" },
  { keyword: "anker 737", path: "/images/products/anker_737_powerbank.jpg" },
  { keyword: "realme", path: "/images/products/realme_20000mah_powerbank.jpg" },
  { keyword: "power bank", path: "/images/products/anker_737_powerbank.jpg" },
  { keyword: "mport", path: "/images/products/portronics_mport_hub.jpg" },
  { keyword: "10-in-1", path: "/images/products/usbc_hub_10in1.jpg" },
  { keyword: "galaxy tab", path: "/images/products/samsung_galaxy_tab_s9.jpg" },
  { keyword: "tablet", path: "/images/products/samsung_galaxy_tab_s9.jpg" },
  { keyword: "cableorganizer", path: "/images/products/cable_organizer.jpg" },
  { keyword: "organizer", path: "/images/products/cable_organizer.jpg" },
  { keyword: "cleaning kit", path: "/images/products/cleaning_kit.jpg" },
  { keyword: "clean", path: "/images/products/cleaning_kit.jpg" },
  { keyword: "braided", path: "/images/products/usbc_cable_2m.jpg" },
  { keyword: "cable", path: "/images/products/usbc_cable_2m.jpg" },
  { keyword: "deskmat", path: "/images/products/kriyamat_xl.jpg" },
  { keyword: "kriyamat", path: "/images/products/kriyamat_xl.jpg" },
  { keyword: "pad", path: "/images/products/kriyamat_xl.jpg" },
  { keyword: "sleeve", path: "/images/products/sleeve_pro_15.jpg" },
  { keyword: "stand", path: "/images/products/laptop_stand_alum.jpg" },
  { keyword: "charger", path: "/images/products/gan_charger_100w.jpg" },
  { keyword: "gan", path: "/images/products/gan_charger_100w.jpg" }
];

function resolveDirectProductImage(src?: string | null, alt?: string, category?: string, productId?: string): string {
  // If src is already a valid local product path, use it directly!
  if (src && src.startsWith("/images/products/")) {
    return src;
  }

  // Check ID / SKU match
  if (productId && EXACT_PRODUCT_MAP[productId]) {
    return EXACT_PRODUCT_MAP[productId];
  }

  const query = `${productId || ""} ${alt || ""} ${category || ""} ${src || ""}`.toLowerCase();

  // Check keyword matches
  for (const item of KEYWORD_MAP) {
    if (query.includes(item.keyword)) {
      return item.path;
    }
  }

  // Category fallback
  if (query.includes("mouse")) return "/images/products/precision_mouse.jpg";
  if (query.includes("keyboard")) return "/images/products/keychron_k2.jpg";
  if (query.includes("headphone") || query.includes("earphone") || query.includes("audio")) return "/images/products/sony_wh1000xm5.jpg";
  if (query.includes("monitor") || query.includes("screen")) return "/images/products/lg_27inch_4k_monitor.jpg";
  if (query.includes("tablet")) return "/images/products/samsung_galaxy_tab_s9.jpg";
  if (query.includes("cable") || query.includes("charger") || query.includes("hub") || query.includes("stand") || query.includes("sleeve") || query.includes("mat") || query.includes("kit")) {
    return "/images/products/cleaning_kit.jpg";
  }

  return "/images/products/lenovo_ideapad_slim3.jpg";
}

export default function ProductImage({
  src,
  alt,
  className = "",
  width = 300,
  height = 300,
  priority = false,
  category,
  productId,
}: ProductImageProps) {
  const resolvedPath = resolveDirectProductImage(src, alt, category, productId);

  const [currentSrc, setCurrentSrc] = useState<string>(resolvedPath);
  const [hasFailed, setHasFailed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setCurrentSrc(resolvedPath);
    setHasFailed(false);
  }, [resolvedPath]);

  const handleError = useCallback(() => {
    if (currentSrc !== resolvedPath) {
      setCurrentSrc(resolvedPath);
    } else {
      setHasFailed(true);
    }
  }, [currentSrc, resolvedPath]);

  return (
    <div className={`relative overflow-hidden bg-slate-50 flex items-center justify-center ${className}`}>
      {hasFailed ? (
        <div className="flex flex-col items-center justify-center p-3 text-center text-slate-400">
          <Cpu className="h-7 w-7 stroke-1 mb-1 text-slate-400" />
          <span className="text-[10px] font-semibold text-slate-500 line-clamp-1">{alt || "Kharridlo Product"}</span>
        </div>
      ) : (
        <Image
          src={currentSrc}
          alt={alt || "Kharridlo Product"}
          width={width}
          height={height}
          priority={priority}
          unoptimized={true}
          onError={handleError}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      )}
    </div>
  );
}
