export interface DeliveryAddress {
  id: string;
  fullName: string;
  phone: string;
  pincode: string;
  flatHouse: string;
  areaStreet: string;
  landmark?: string;
  city: string;
  state: string;
  addressType: "campus" | "home" | "work";
  isDefault?: boolean;
}

export const PRESET_ADDRESSES: DeliveryAddress[] = [
  {
    id: "addr_campus_dorm",
    fullName: "Ayush Sharma",
    phone: "9876543210",
    pincode: "400076",
    flatHouse: "Room 304, Hostel 16 (H-16)",
    areaStreet: "IIT Bombay Campus, Powai",
    landmark: "Opposite Lakeside Walkway",
    city: "Mumbai",
    state: "Maharashtra",
    addressType: "campus",
    isDefault: true,
  },
  {
    id: "addr_home_blr",
    fullName: "Ayush Sharma",
    phone: "9876543210",
    pincode: "560103",
    flatHouse: "Flat 502, Green Glen Towers",
    areaStreet: "Outer Ring Road, Bellandur",
    landmark: "Near EcoSpace Business Park",
    city: "Bengaluru",
    state: "Karnataka",
    addressType: "home",
    isDefault: false,
  },
  {
    id: "addr_work_delhi",
    fullName: "Ayush Sharma",
    phone: "9876543210",
    pincode: "110016",
    flatHouse: "Lab 4B, Advanced Computing Wing",
    areaStreet: "IIT Delhi Campus, Hauz Khas",
    landmark: "Near Central Library",
    city: "New Delhi",
    state: "Delhi",
    addressType: "work",
    isDefault: false,
  },
];

const STORAGE_KEY = "kharridlo_delivery_address";
const ALL_ADDRESSES_KEY = "kharridlo_saved_addresses";

export function getDefaultDeliveryAddress(): DeliveryAddress {
  if (typeof window === "undefined") {
    return PRESET_ADDRESSES[0];
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && parsed.fullName && parsed.pincode) {
        return parsed;
      }
    }
  } catch {}
  return PRESET_ADDRESSES[0];
}

export function saveDeliveryAddress(address: DeliveryAddress): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(address));
    sessionStorage.setItem("kharridlo_active_shipping_address", JSON.stringify(address));
    
    // Also update saved addresses list
    const existingStr = localStorage.getItem(ALL_ADDRESSES_KEY);
    let list: DeliveryAddress[] = existingStr ? JSON.parse(existingStr) : [...PRESET_ADDRESSES];
    if (!Array.isArray(list)) list = [...PRESET_ADDRESSES];
    const idx = list.findIndex((a) => a.id === address.id);
    if (idx >= 0) {
      list[idx] = address;
    } else {
      list.unshift(address);
    }
    localStorage.setItem(ALL_ADDRESSES_KEY, JSON.stringify(list));
  } catch {}
}

export function getSavedAddresses(): DeliveryAddress[] {
  if (typeof window === "undefined") {
    return PRESET_ADDRESSES;
  }
  try {
    const existingStr = localStorage.getItem(ALL_ADDRESSES_KEY);
    if (existingStr) {
      const parsed = JSON.parse(existingStr);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}
  return PRESET_ADDRESSES;
}

export function formatAddress(addr?: DeliveryAddress | null): string {
  if (!addr) return "Standard Delivery Address";
  const parts = [
    addr.flatHouse,
    addr.areaStreet,
    addr.landmark ? `Near ${addr.landmark}` : null,
    [addr.city, addr.state].filter(Boolean).join(", ") + (addr.pincode ? ` - ${addr.pincode}` : ""),
  ].filter(Boolean);
  return parts.join(", ") || "Standard Delivery Address";
}
