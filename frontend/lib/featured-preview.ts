export interface FeaturedProduct {
  id: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  price_paise: number;
  price_inr: number;
  mrp_inr?: number;
  currency: string;
  description: string;
  availability_status: "in_stock" | "low_stock" | "out_of_stock";
  image_url: string;
  specs?: Record<string, any>;
  provider?: string;
  source_rating?: number;
}

export const FEATURED_PREVIEW_PRODUCTS: FeaturedProduct[] = [
  {
    id: "amz_B0BT9SCV9B",
    sku: "B0BT9SCV9B",
    name: "Lenovo IdeaPad Slim 3 Intel Core i3 12th Gen 15.6\" FHD Laptop",
    brand: "Lenovo",
    category: "Electronics",
    price_paise: 3499000,
    price_inr: 34990,
    mrp_inr: 52990,
    currency: "INR",
    description: "12th Gen Intel Core i3 | 8GB RAM DDR4 | 512GB SSD | 15.6\" FHD Display | Rapid Charge",
    availability_status: "in_stock",
    image_url: "/images/products/lenovo_ideapad_slim3_angle1.jpg",
    provider: "amazon",
  },
  {
    id: "amz_B08N5XSG8Z",
    sku: "B08N5XSG8Z",
    name: "Apple MacBook Air Laptop M1 chip, 13.3-inch Retina Display (8GB/256GB SSD)",
    brand: "Apple",
    category: "Electronics",
    price_paise: 6999000,
    price_inr: 69990,
    mrp_inr: 99900,
    currency: "INR",
    description: "Apple M1 chip | 18-hr Battery Life | 8GB Unified Memory | 13.3-inch Retina Display | Silent Fanless",
    availability_status: "in_stock",
    image_url: "/images/products/macbook_air_m1_angle1.jpg",
    provider: "amazon",
  },
  {
    id: "amz_B0B3BPH58N",
    sku: "B0B3BPH58N",
    name: "Apple MacBook Air Laptop M2 chip, 13.6-inch Liquid Retina Display",
    brand: "Apple",
    category: "Electronics",
    price_paise: 9499000,
    price_inr: 94990,
    mrp_inr: 114900,
    currency: "INR",
    description: "Apple M2 chip 8-core CPU | 13.6\" Liquid Retina | 8GB Unified RAM | 256GB SSD | MagSafe 3",
    availability_status: "in_stock",
    image_url: "/images/products/macbook_air_m2_angle1.jpg",
    provider: "amazon",
  },
  {
    id: "amz_B09NL8H8XZ",
    sku: "B09NL8H8XZ",
    name: "Dell Inspiron 3520 Laptop Intel Core i5-1235U (16GB RAM/512GB SSD)",
    brand: "Dell",
    category: "Electronics",
    price_paise: 4899000,
    price_inr: 48990,
    mrp_inr: 68990,
    currency: "INR",
    description: "12th Gen Intel Core i5 | 16GB DDR4 | 512GB PCIe NVMe SSD | 15.6\" 120Hz Display | Windows 11",
    availability_status: "in_stock",
    image_url: "/images/products/dell_inspiron_3520_angle1.jpg",
    provider: "amazon",
  },
  {
    id: "amz_B09V18R53H",
    sku: "B09V18R53H",
    name: "HP Pavilion 15 Intel Core i5 12th Gen 15.6-inch FHD Laptop",
    brand: "HP",
    category: "Electronics",
    price_paise: 6299000,
    price_inr: 62990,
    mrp_inr: 78990,
    currency: "INR",
    description: "Intel Core i5-1240P | 16GB DDR4 | 512GB SSD | Intel Iris Xe Graphics | B&O Audio",
    availability_status: "in_stock",
    image_url: "/images/products/hp_pavilion_15_angle1.jpg",
    provider: "amazon",
  },
  {
    id: "fk_COMGZFH6ZG8VPHGZ",
    sku: "COMGZFH6ZG8VPHGZ",
    name: "ASUS Vivobook 15 Intel Core i3 12th Gen Thin and Light Laptop",
    brand: "ASUS",
    category: "Electronics",
    price_paise: 3899000,
    price_inr: 38990,
    mrp_inr: 54990,
    currency: "INR",
    description: "12th Gen Intel Core i3 | 8GB RAM | 512GB SSD | 15.6\" Full HD Anti-Glare | 1.7kg Portable",
    availability_status: "in_stock",
    image_url: "/images/products/asus_vivobook_15_angle1.jpg",
    provider: "flipkart",
  }
];
