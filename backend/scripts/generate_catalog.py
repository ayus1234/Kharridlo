import json
import os

# Exactly 84 synthetic products across 8 categories
catalog = [
    # ==========================================
    # 1. LAPTOPS (20 SKUs)
    # ==========================================
    {
        "id": "prod_lp15_01",
        "sku": "DK-LP-15",
        "name": "TechNova Laptop Pro 15",
        "brand": "TechNova",
        "category": "laptop",
        "price_paise": 6499900,  # ₹64,999 (Key Buildathon Recommendation)
        "currency": "INR",
        "description": "High-performance developer laptop featuring Intel Core Ultra 7 processor and fast LPDDR5X RAM, engineered for concurrent programming environments, containerized testing, and local AI model exploration.",
        "specs": {"processor": "Intel Core Ultra 7 155H", "ram_gb": 16, "storage_gb": 512, "storage_type": "NVMe PCIe 4.0 SSD", "display": "15.6-inch 2.8K OLED 120Hz", "battery_hours": 11.5, "weight_kg": 1.48, "gpu": "Intel Arc Graphics"},
        "image_url": "/images/products/laptop_pro_15.png",
        "available_quantity": 18,
        "reserved_quantity": 2,
        "low_stock_threshold": 5
    },
    {
        "id": "prod_lp14_oos",
        "sku": "DK-LP-14-OOS",
        "name": "TechNova Laptop 14 Lite",
        "brand": "TechNova",
        "category": "laptop",
        "price_paise": 5999900,  # ₹59,999
        "currency": "INR",
        "description": "Ultra-portable 14-inch productivity notebook designed for full-day campus coding and web engineering.",
        "specs": {"processor": "Intel Core Ultra 5 125H", "ram_gb": 16, "storage_gb": 512, "storage_type": "NVMe SSD", "display": "14-inch FHD+ IPS 90Hz", "battery_hours": 13.0, "weight_kg": 1.25, "gpu": "Intel Graphics"},
        "image_url": "/images/products/laptop_14_lite.png",
        "available_quantity": 0,  # OUT OF STOCK TEST CASE
        "reserved_quantity": 0,
        "low_stock_threshold": 5
    },
    {
        "id": "prod_lp_ultra_01",
        "sku": "DK-LP-ULTRA",
        "name": "TechNova Laptop Ultra 16",
        "brand": "TechNova",
        "category": "laptop",
        "price_paise": 14900000,  # ₹1,49,000 (Over-Budget Policy Block Case)
        "currency": "INR",
        "description": "Heavyweight workstation engineered for enterprise machine learning training, CUDA acceleration, and extreme multi-threaded workloads.",
        "specs": {"processor": "Intel Core i9-14900HX", "ram_gb": 32, "storage_gb": 1024, "storage_type": "NVMe PCIe 4.0 SSD", "display": "16-inch 4K Mini-LED 165Hz", "battery_hours": 7.0, "weight_kg": 2.3, "gpu": "NVIDIA GeForce RTX 4080 12GB"},
        "image_url": "/images/products/laptop_ultra_16.png",
        "available_quantity": 7,
        "reserved_quantity": 1,
        "low_stock_threshold": 3
    },
    {
        "id": "prod_lp_low_01",
        "sku": "DK-LP-LOW-01",
        "name": "TechNova DevBook Air 13",
        "brand": "TechNova",
        "category": "laptop",
        "price_paise": 6199900,  # ₹61,999
        "currency": "INR",
        "description": "Lightweight development laptop with exceptional battery performance, silent thermal architecture, and 16GB unified RAM.",
        "specs": {"processor": "AMD Ryzen 7 8840HS", "ram_gb": 16, "storage_gb": 512, "storage_type": "NVMe SSD", "display": "13.3-inch Retina-grade IPS", "battery_hours": 15.0, "weight_kg": 1.18, "gpu": "Radeon 780M"},
        "image_url": "/images/products/devbook_air_13.png",
        "available_quantity": 2,  # LOW STOCK TEST CASE
        "reserved_quantity": 1,
        "low_stock_threshold": 5
    },
    {
        "id": "prod_lp_05",
        "sku": "DK-LP-05",
        "name": "NovaBook 15 SE",
        "brand": "TechNova",
        "category": "laptop",
        "price_paise": 5299900,  # ₹52,999
        "currency": "INR",
        "description": "Reliable budget developer laptop with 16GB dual-channel memory and Ryzen 5 processor for smooth full-stack coding.",
        "specs": {"processor": "AMD Ryzen 5 7535HS", "ram_gb": 16, "storage_gb": 512, "display": "15.6-inch FHD 144Hz", "weight_kg": 1.7},
        "image_url": "/images/products/novabook_15.png",
        "available_quantity": 25,
        "reserved_quantity": 0,
        "low_stock_threshold": 5
    },
    {
        "id": "prod_lp_06",
        "sku": "DK-LP-06",
        "name": "NexusThink Developer 14",
        "brand": "Nexus",
        "category": "laptop",
        "price_paise": 6899900,  # ₹68,999 (Under ₹70k cap)
        "currency": "INR",
        "description": "Rugged business-grade coding laptop with spill-resistant keyboard, 16GB RAM, and military-grade durability.",
        "specs": {"processor": "Intel Core i7-13700H", "ram_gb": 16, "storage_gb": 1024, "display": "14-inch QHD IPS", "weight_kg": 1.45},
        "image_url": "/images/products/nexusthink_14.png",
        "available_quantity": 12,
        "reserved_quantity": 2,
        "low_stock_threshold": 4
    },
    {
        "id": "prod_lp_07",
        "sku": "DK-LP-07",
        "name": "VeloceCode Pro 16",
        "brand": "Veloce",
        "category": "laptop",
        "price_paise": 6999900,  # ₹69,999 (Right at ₹70k threshold)
        "currency": "INR",
        "description": "Full-size laptop with dedicated numeric keypad, 16GB DDR5, and high-efficiency multi-core performance for backend engineering.",
        "specs": {"processor": "AMD Ryzen 7 7735HS", "ram_gb": 16, "storage_gb": 1024, "display": "16-inch WQXGA 165Hz", "weight_kg": 1.8},
        "image_url": "/images/products/veloce_code_16.png",
        "available_quantity": 14,
        "reserved_quantity": 1,
        "low_stock_threshold": 5
    },
    {
        "id": "prod_lp_08",
        "sku": "DK-LP-08",
        "name": "Zenith Studio 14",
        "brand": "Zenith",
        "category": "laptop",
        "price_paise": 8499900,  # ₹84,999
        "currency": "INR",
        "description": "Creator and software studio laptop with factory-calibrated 100% DCI-P3 display and RTX 4050 GPU.",
        "specs": {"processor": "Intel Core i7-14700H", "ram_gb": 16, "storage_gb": 1024, "display": "14.5-inch 3K OLED", "weight_kg": 1.55},
        "image_url": "/images/products/zenith_studio_14.png",
        "available_quantity": 9,
        "reserved_quantity": 0,
        "low_stock_threshold": 3
    },
    {
        "id": "prod_lp_09",
        "sku": "DK-LP-09",
        "name": "AetherBook Slim 13",
        "brand": "Aether",
        "category": "laptop",
        "price_paise": 4799900,  # ₹47,999
        "currency": "INR",
        "description": "Ultra-lightweight student and entry developer notebook with all-day 16-hour battery life and fast charging.",
        "specs": {"processor": "Intel Core i5-1335U", "ram_gb": 8, "storage_gb": 512, "display": "13.3-inch FHD IPS", "weight_kg": 1.1},
        "image_url": "/images/products/aether_slim_13.png",
        "available_quantity": 30,
        "reserved_quantity": 3,
        "low_stock_threshold": 6
    },
    {
        "id": "prod_lp_10",
        "sku": "DK-LP-10",
        "name": "TechNova Studio Creator 16",
        "brand": "TechNova",
        "category": "laptop",
        "price_paise": 11999900,  # ₹1,19,999
        "currency": "INR",
        "description": "Precision creator and game development laptop with dual NVMe slots and dedicated ray tracing graphics.",
        "specs": {"processor": "AMD Ryzen 9 7940HS", "ram_gb": 32, "storage_gb": 1024, "display": "16-inch 165Hz IPS", "weight_kg": 2.1},
        "image_url": "/images/products/technova_studio_16.png",
        "available_quantity": 6,
        "reserved_quantity": 1,
        "low_stock_threshold": 3
    },
    {
        "id": "prod_lp_11",
        "sku": "DK-LP-11",
        "name": "NovaBook AI Edition",
        "brand": "TechNova",
        "category": "laptop",
        "price_paise": 6699900,  # ₹66,999 (Under ₹70k)
        "currency": "INR",
        "description": "Dedicated NPU-accelerated laptop featuring Ryzen AI processor for on-device AI agent execution and fast local compilation.",
        "specs": {"processor": "AMD Ryzen 7 8845HS", "ram_gb": 16, "storage_gb": 512, "display": "15.6-inch 2.5K 120Hz", "weight_kg": 1.65},
        "image_url": "/images/products/novabook_ai.png",
        "available_quantity": 16,
        "reserved_quantity": 2,
        "low_stock_threshold": 4
    },
    {
        "id": "prod_lp_12",
        "sku": "DK-LP-12",
        "name": "ByteForge 15 Essential",
        "brand": "ByteForge",
        "category": "laptop",
        "price_paise": 3999900,  # ₹39,999
        "currency": "INR",
        "description": "Budget-conscious laptop for web development, scripting, and introductory computer science curricula.",
        "specs": {"processor": "AMD Ryzen 3 7320U", "ram_gb": 8, "storage_gb": 512, "display": "15.6-inch FHD", "weight_kg": 1.6},
        "image_url": "/images/products/byteforge_15.png",
        "available_quantity": 40,
        "reserved_quantity": 0,
        "low_stock_threshold": 8
    },
    {
        "id": "prod_lp_13",
        "sku": "DK-LP-13",
        "name": "OmniBook Matrix 14",
        "brand": "Omni",
        "category": "laptop",
        "price_paise": 6399900,  # ₹63,999
        "currency": "INR",
        "description": "Compact powerhouse featuring 16GB dual-channel RAM, matte IPS panel, and dual Thunderbolt 4 ports.",
        "specs": {"processor": "Intel Core i5-14500H", "ram_gb": 16, "storage_gb": 512, "display": "14-inch 2.2K IPS", "weight_kg": 1.35},
        "image_url": "/images/products/omnibook_14.png",
        "available_quantity": 11,
        "reserved_quantity": 1,
        "low_stock_threshold": 4
    },
    {
        "id": "prod_lp_14",
        "sku": "DK-LP-14",
        "name": "TitanCode Rugged 15",
        "brand": "Titan",
        "category": "laptop",
        "price_paise": 7499900,  # ₹74,999
        "currency": "INR",
        "description": "Drop-tested aluminum unibody notebook equipped with high-efficiency cooling for extended computational jobs.",
        "specs": {"processor": "Intel Core i7-13620H", "ram_gb": 16, "storage_gb": 1024, "display": "15.6-inch 144Hz IPS", "weight_kg": 1.95},
        "image_url": "/images/products/titancode_15.png",
        "available_quantity": 8,
        "reserved_quantity": 0,
        "low_stock_threshold": 3
    },
    {
        "id": "prod_lp_15",
        "sku": "DK-LP-15-MAX",
        "name": "TechNova Laptop Max 17",
        "brand": "TechNova",
        "category": "laptop",
        "price_paise": 18900000,  # ₹1,89,000
        "currency": "INR",
        "description": "Ultimate desktop-replacement laptop with dual vapor chamber cooling and 64GB DDR5 memory.",
        "specs": {"processor": "Intel Core i9-14900HX", "ram_gb": 64, "storage_gb": 2048, "display": "17.3-inch 4K 144Hz", "weight_kg": 2.8},
        "image_url": "/images/products/technova_max_17.png",
        "available_quantity": 4,
        "reserved_quantity": 0,
        "low_stock_threshold": 2
    },
    {
        "id": "prod_lp_16",
        "sku": "DK-LP-16",
        "name": "PrismBook 14 OLED",
        "brand": "Prism",
        "category": "laptop",
        "price_paise": 6599900,  # ₹65,999 (Under ₹70k)
        "currency": "INR",
        "description": "Vibrant 90Hz OLED laptop tailored for frontend developers and UI engineers needing 100% color accuracy.",
        "specs": {"processor": "Intel Core Ultra 5 125H", "ram_gb": 16, "storage_gb": 512, "display": "14-inch 2.8K OLED", "weight_kg": 1.3},
        "image_url": "/images/products/prismbook_14.png",
        "available_quantity": 15,
        "reserved_quantity": 1,
        "low_stock_threshold": 4
    },
    {
        "id": "prod_lp_17",
        "sku": "DK-LP-17",
        "name": "QuantumCode 15",
        "brand": "Quantum",
        "category": "laptop",
        "price_paise": 5899900,  # ₹58,999
        "currency": "INR",
        "description": "Balanced coding machine with 16GB RAM, fast NVMe read speeds, and silent fan mode for library work.",
        "specs": {"processor": "AMD Ryzen 5 7640HS", "ram_gb": 16, "storage_gb": 512, "display": "15.6-inch FHD 120Hz", "weight_kg": 1.6},
        "image_url": "/images/products/quantumcode_15.png",
        "available_quantity": 22,
        "reserved_quantity": 1,
        "low_stock_threshold": 5
    },
    {
        "id": "prod_lp_18",
        "sku": "DK-LP-18",
        "name": "ApexBook Pro 14",
        "brand": "Apex",
        "category": "laptop",
        "price_paise": 6749900,  # ₹67,499 (Under ₹70k)
        "currency": "INR",
        "description": "CNC-milled magnesium laptop offering 14 hours battery life, WiFi 7, and glass precision touchpad.",
        "specs": {"processor": "Intel Core Ultra 7 155U", "ram_gb": 16, "storage_gb": 1024, "display": "14-inch 2.5K IPS", "weight_kg": 1.22},
        "image_url": "/images/products/apexbook_14.png",
        "available_quantity": 10,
        "reserved_quantity": 1,
        "low_stock_threshold": 3
    },
    {
        "id": "prod_lp_19",
        "sku": "DK-LP-19",
        "name": "CoreForge Edge 15",
        "brand": "CoreForge",
        "category": "laptop",
        "price_paise": 4499900,  # ₹44,999
        "currency": "INR",
        "description": "Workhorse business laptop with upgradable RAM slot and dual storage expansion options.",
        "specs": {"processor": "Intel Core i5-12450H", "ram_gb": 16, "storage_gb": 512, "display": "15.6-inch FHD 60Hz", "weight_kg": 1.75},
        "image_url": "/images/products/coreforge_15.png",
        "available_quantity": 35,
        "reserved_quantity": 2,
        "low_stock_threshold": 6
    },
    {
        "id": "prod_lp_20",
        "sku": "DK-LP-20",
        "name": "TechNova GoBook 12",
        "brand": "TechNova",
        "category": "laptop",
        "price_paise": 2999900,  # ₹29,999
        "currency": "INR",
        "description": "Ultra-portable companion laptop for reading docs, SSH remote terminal sessions, and cloud IDEs.",
        "specs": {"processor": "Intel N100 Quad-Core", "ram_gb": 8, "storage_gb": 256, "display": "12.2-inch FHD Touch", "weight_kg": 0.98},
        "image_url": "/images/products/gobook_12.png",
        "available_quantity": 19,
        "reserved_quantity": 0,
        "low_stock_threshold": 5
    },

    # ==========================================
    # 2. SMARTPHONES (10 SKUs)
    # ==========================================
    {
        "id": "prod_ph_01",
        "sku": "DK-PH-01",
        "name": "TechNova Pulse 5G",
        "brand": "TechNova",
        "category": "smartphone",
        "price_paise": 2499900,  # ₹24,999
        "currency": "INR",
        "description": "Clean stock Android smartphone with 120Hz AMOLED display and 5000mAh battery.",
        "specs": {"processor": "Snapdragon 7s Gen 2", "ram_gb": 8, "storage_gb": 256, "display": "6.67-inch AMOLED 120Hz", "camera": "50MP OIS", "battery_mah": 5000},
        "image_url": "/images/products/pulse_5g.png",
        "available_quantity": 30,
        "reserved_quantity": 2,
        "low_stock_threshold": 5
    },
    {
        "id": "prod_ph_02",
        "sku": "DK-PH-02",
        "name": "TechNova Pulse Pro 5G",
        "brand": "TechNova",
        "category": "smartphone",
        "price_paise": 3899900,  # ₹38,999
        "currency": "INR",
        "description": "Flagship-tier camera phone featuring Sony LYT-700 sensor and 80W rapid charging.",
        "specs": {"processor": "MediaTek Dimensity 8300 Ultra", "ram_gb": 12, "storage_gb": 256, "display": "6.7-inch 1.5K AMOLED", "camera": "50MP Triple", "battery_mah": 5100},
        "image_url": "/images/products/pulse_pro_5g.png",
        "available_quantity": 20,
        "reserved_quantity": 1,
        "low_stock_threshold": 4
    },
    {
        "id": "prod_ph_03",
        "sku": "DK-PH-03",
        "name": "Nexus Apex One",
        "brand": "Nexus",
        "category": "smartphone",
        "price_paise": 5499900,  # ₹54,999
        "currency": "INR",
        "description": "Premium glass and ceramic device with wireless charging and IP68 water resistance.",
        "specs": {"processor": "Snapdragon 8 Gen 3", "ram_gb": 12, "storage_gb": 256, "display": "6.78-inch LTPO 1-120Hz", "camera": "50MP Periscope 3x", "battery_mah": 5400},
        "image_url": "/images/products/nexus_apex.png",
        "available_quantity": 15,
        "reserved_quantity": 0,
        "low_stock_threshold": 3
    },
    {
        "id": "prod_ph_04",
        "sku": "DK-PH-04",
        "name": "NovaPhone Lite",
        "brand": "TechNova",
        "category": "smartphone",
        "price_paise": 1499900,  # ₹14,999
        "currency": "INR",
        "description": "Value-first 5G phone with long battery life, 33W charging, and 3.5mm audio jack.",
        "specs": {"processor": "MediaTek Dimensity 6100+", "ram_gb": 6, "storage_gb": 128, "display": "6.56-inch 90Hz LCD", "camera": "50MP Main", "battery_mah": 5000},
        "image_url": "/images/products/novaphone_lite.png",
        "available_quantity": 50,
        "reserved_quantity": 4,
        "low_stock_threshold": 10
    },
    {
        "id": "prod_ph_05",
        "sku": "DK-PH-05",
        "name": "Aether Speed 12",
        "brand": "Aether",
        "category": "smartphone",
        "price_paise": 2999900,  # ₹29,999
        "currency": "INR",
        "description": "Gaming and multi-tasking smartphone with dedicated cooling chamber and bypass charging.",
        "specs": {"processor": "Snapdragon 7+ Gen 3", "ram_gb": 12, "storage_gb": 256, "display": "6.74-inch 144Hz AMOLED", "camera": "50MP OIS", "battery_mah": 5500},
        "image_url": "/images/products/aether_speed_12.png",
        "available_quantity": 25,
        "reserved_quantity": 1,
        "low_stock_threshold": 5
    },
    {
        "id": "prod_ph_06",
        "sku": "DK-PH-06",
        "name": "Zenith Horizon Ultra",
        "brand": "Zenith",
        "category": "smartphone",
        "price_paise": 7999900,  # ₹79,999
        "currency": "INR",
        "description": "Professional imaging flagship with 1-inch camera sensor and titanium body frame.",
        "specs": {"processor": "Snapdragon 8 Gen 3", "ram_gb": 16, "storage_gb": 512, "display": "6.82-inch 2K LTPO", "camera": "50MP Quad Pro", "battery_mah": 5000},
        "image_url": "/images/products/zenith_horizon.png",
        "available_quantity": 8,
        "reserved_quantity": 0,
        "low_stock_threshold": 2
    },
    {
        "id": "prod_ph_07",
        "sku": "DK-PH-07",
        "name": "BytePhone Core 5G",
        "brand": "ByteForge",
        "category": "smartphone",
        "price_paise": 1899900,  # ₹18,999
        "currency": "INR",
        "description": "Everyday dependable 5G phone with stereo speakers and expandable microSD storage.",
        "specs": {"processor": "Snapdragon 6 Gen 1", "ram_gb": 8, "storage_gb": 128, "display": "6.6-inch FHD+ 120Hz", "camera": "64MP", "battery_mah": 5000},
        "image_url": "/images/products/bytephone_core.png",
        "available_quantity": 35,
        "reserved_quantity": 2,
        "low_stock_threshold": 6
    },
    {
        "id": "prod_ph_08",
        "sku": "DK-PH-08",
        "name": "Prism Neo 11",
        "brand": "Prism",
        "category": "smartphone",
        "price_paise": 3299900,  # ₹32,999
        "currency": "INR",
        "description": "Sleek compact phone with curved edges and dual stereo speakers tuned for media playback.",
        "specs": {"processor": "Dimensity 7200", "ram_gb": 8, "storage_gb": 256, "display": "6.5-inch 3D Curved AMOLED", "camera": "50MP Dual", "battery_mah": 4800},
        "image_url": "/images/products/prism_neo.png",
        "available_quantity": 18,
        "reserved_quantity": 0,
        "low_stock_threshold": 4
    },
    {
        "id": "prod_ph_09",
        "sku": "DK-PH-09",
        "name": "Titan Shield Tough 5G",
        "brand": "Titan",
        "category": "smartphone",
        "price_paise": 2799900,  # ₹27,999
        "currency": "INR",
        "description": "Rugged industrial smartphone certified for drop resistance, water immersion, and dust protection.",
        "specs": {"processor": "Dimensity 7050", "ram_gb": 8, "storage_gb": 256, "display": "6.58-inch Gorilla Glass Victus", "camera": "48MP Night Vision", "battery_mah": 6000},
        "image_url": "/images/products/titan_tough.png",
        "available_quantity": 12,
        "reserved_quantity": 1,
        "low_stock_threshold": 3
    },
    {
        "id": "prod_ph_10",
        "sku": "DK-PH-10",
        "name": "TechNova Pulse Flip",
        "brand": "TechNova",
        "category": "smartphone",
        "price_paise": 6499900,  # ₹64,999
        "currency": "INR",
        "description": "Pocketable clamshell folding phone with 3.6-inch full functional outer display and zero-gap hinge.",
        "specs": {"processor": "Snapdragon 8s Gen 3", "ram_gb": 12, "storage_gb": 256, "display": "6.9-inch 120Hz LTPO", "camera": "50MP Dual", "battery_mah": 4000},
        "image_url": "/images/products/pulse_flip.png",
        "available_quantity": 9,
        "reserved_quantity": 1,
        "low_stock_threshold": 3
    },

    # ==========================================
    # 3. MONITORS (10 SKUs)
    # ==========================================
    {
        "id": "prod_mon_01",
        "sku": "DK-MON-01",
        "name": "TechNova ViewPro 27 4K",
        "brand": "TechNova",
        "category": "monitor",
        "price_paise": 2899900,  # ₹28,999
        "currency": "INR",
        "description": "27-inch 4K UHD IPS professional monitor with 90W USB-C Power Delivery and built-in KVM switch.",
        "specs": {"size_inches": 27, "resolution": "3840x2160 (4K)", "panel": "IPS 60Hz", "color_gamut": "99% sRGB", "ports": "USB-C (90W), HDMI 2.0, DP 1.4"},
        "image_url": "/images/products/viewpro_27.png",
        "available_quantity": 15,
        "reserved_quantity": 1,
        "low_stock_threshold": 4
    },
    {
        "id": "prod_mon_02",
        "sku": "DK-MON-02",
        "name": "TechNova UltraWide 34 Curve",
        "brand": "TechNova",
        "category": "monitor",
        "price_paise": 4299900,  # ₹42,999
        "currency": "INR",
        "description": "34-inch 21:9 curved ultrawide display providing massive desktop space for coding, logs, and side-by-side docs.",
        "specs": {"size_inches": 34, "resolution": "3440x1440 (UWQHD)", "panel": "VA Curved 1500R 144Hz", "ports": "USB-C, 2x HDMI 2.1, DP 1.4"},
        "image_url": "/images/products/ultrawide_34.png",
        "available_quantity": 10,
        "reserved_quantity": 0,
        "low_stock_threshold": 3
    },
    {
        "id": "prod_mon_03",
        "sku": "DK-MON-03",
        "name": "NovaVision 24 Developer",
        "brand": "TechNova",
        "category": "monitor",
        "price_paise": 1149900,  # ₹11,499
        "currency": "INR",
        "description": "Crisp 24-inch Full HD monitor with vertical pivot stand, ideal as a dedicated vertical code-reading secondary display.",
        "specs": {"size_inches": 24, "resolution": "1920x1080 (FHD)", "panel": "IPS 100Hz", "stand": "Pivot 90 deg, Height, Swivel", "ports": "HDMI, DisplayPort"},
        "image_url": "/images/products/novavision_24.png",
        "available_quantity": 28,
        "reserved_quantity": 3,
        "low_stock_threshold": 5
    },
    {
        "id": "prod_mon_04",
        "sku": "DK-MON-04",
        "name": "Nexus PurePixel 32 4K",
        "brand": "Nexus",
        "category": "monitor",
        "price_paise": 4999900,  # ₹49,999
        "currency": "INR",
        "description": "Expansive 32-inch 4K HDR display with factory color report and ambient light sensor for automatic brightness.",
        "specs": {"size_inches": 32, "resolution": "3840x2160 (4K)", "panel": "IPS Black 60Hz", "contrast": "2000:1", "ports": "Thunderbolt 4, HDMI, DP"},
        "image_url": "/images/products/purepixel_32.png",
        "available_quantity": 7,
        "reserved_quantity": 0,
        "low_stock_threshold": 2
    },
    {
        "id": "prod_mon_05",
        "sku": "DK-MON-05",
        "name": "VeloceSpeed 27 180Hz",
        "brand": "Veloce",
        "category": "monitor",
        "price_paise": 1999900,  # ₹19,999
        "currency": "INR",
        "description": "Fast QHD gaming and engineering monitor with 180Hz refresh rate and 1ms GtG response time.",
        "specs": {"size_inches": 27, "resolution": "2560x1440 (QHD)", "panel": "Fast IPS 180Hz", "ports": "2x HDMI 2.0, DP 1.4"},
        "image_url": "/images/products/velocespeed_27.png",
        "available_quantity": 22,
        "reserved_quantity": 2,
        "low_stock_threshold": 5
    },
    {
        "id": "prod_mon_06",
        "sku": "DK-MON-06",
        "name": "Zenith OLED 27 Pro",
        "brand": "Zenith",
        "category": "monitor",
        "price_paise": 6999900,  # ₹69,999
        "currency": "INR",
        "description": "True-black 240Hz OLED monitor delivering infinite contrast, 0.03ms response time, and anti-reflective coating.",
        "specs": {"size_inches": 27, "resolution": "2560x1440 (QHD)", "panel": "QD-OLED 240Hz", "ports": "USB-C (65W), 2x HDMI 2.1, DP 1.4"},
        "image_url": "/images/products/zenith_oled_27.png",
        "available_quantity": 5,
        "reserved_quantity": 1,
        "low_stock_threshold": 2
    },
    {
        "id": "prod_mon_07",
        "sku": "DK-MON-07",
        "name": "Aether DuoScreen Portable 15",
        "brand": "Aether",
        "category": "monitor",
        "price_paise": 1399900,  # ₹13,999
        "currency": "INR",
        "description": "Portable 15.6-inch external monitor powered by a single USB-C cable for on-the-go dual monitor setups.",
        "specs": {"size_inches": 15.6, "resolution": "1920x1080 (FHD)", "panel": "IPS 60Hz", "weight_kg": 0.75, "ports": "2x USB-C, Mini-HDMI"},
        "image_url": "/images/products/duoscreen_15.png",
        "available_quantity": 30,
        "reserved_quantity": 1,
        "low_stock_threshold": 6
    },
    {
        "id": "prod_mon_08",
        "sku": "DK-MON-08",
        "name": "ByteView 27 QHD",
        "brand": "ByteForge",
        "category": "monitor",
        "price_paise": 1649900,  # ₹16,499
        "currency": "INR",
        "description": "Affordable 27-inch 1440p work monitor with flicker-free technology and low blue light hardware filter.",
        "specs": {"size_inches": 27, "resolution": "2560x1440 (QHD)", "panel": "IPS 75Hz", "ports": "HDMI 1.4, DisplayPort"},
        "image_url": "/images/products/byteview_27.png",
        "available_quantity": 25,
        "reserved_quantity": 0,
        "low_stock_threshold": 5
    },
    {
        "id": "prod_mon_09",
        "sku": "DK-MON-09",
        "name": "Titan Curved 27 Gaming",
        "brand": "Titan",
        "category": "monitor",
        "price_paise": 1799900,  # ₹17,999
        "currency": "INR",
        "description": "1500R curved gaming monitor with 165Hz refresh rate and FreeSync Premium compatibility.",
        "specs": {"size_inches": 27, "resolution": "1920x1080", "panel": "VA Curved 165Hz", "ports": "2x HDMI, DP"},
        "image_url": "/images/products/titan_curved_27.png",
        "available_quantity": 18,
        "reserved_quantity": 1,
        "low_stock_threshold": 4
    },
    {
        "id": "prod_mon_10",
        "sku": "DK-MON-10",
        "name": "CoreForge 22 Office",
        "brand": "CoreForge",
        "category": "monitor",
        "price_paise": 749900,  # ₹7,499
        "currency": "INR",
        "description": "Compact entry-level monitor for compact desks and call center terminal operations.",
        "specs": {"size_inches": 21.5, "resolution": "1920x1080", "panel": "VA 75Hz", "ports": "HDMI, VGA"},
        "image_url": "/images/products/coreforge_22.png",
        "available_quantity": 45,
        "reserved_quantity": 0,
        "low_stock_threshold": 10
    },

    # ==========================================
    # 4. KEYBOARDS (8 SKUs)
    # ==========================================
    {
        "id": "prod_kb_01",
        "sku": "DK-KB-01",
        "name": "TechNova CodeCraft Pro Mechanical",
        "brand": "TechNova",
        "category": "keyboard",
        "price_paise": 449900,  # ₹4,499
        "currency": "INR",
        "description": "75% compact wireless mechanical keyboard featuring hot-swappable custom linear switches and sound-dampening foam.",
        "specs": {"layout": "75% ANSI", "connectivity": "Tri-mode (2.4GHz, Bluetooth 5.2, USB-C)", "switches": "Custom Linear 45g", "battery_hours": 200},
        "image_url": "/images/products/codecraft_pro.png",
        "available_quantity": 25,
        "reserved_quantity": 2,
        "low_stock_threshold": 5
    },
    {
        "id": "prod_kb_02",
        "sku": "DK-KB-02",
        "name": "TechNova SlimType Wireless",
        "brand": "TechNova",
        "category": "keyboard",
        "price_paise": 229900,  # ₹2,299
        "currency": "INR",
        "description": "Low-profile aluminum scissor-switch keyboard designed for quiet office typing and multi-device switching.",
        "specs": {"layout": "Full Size 104-key", "connectivity": "Bluetooth + 2.4GHz", "switches": "Scissor Membrane", "battery_months": 5},
        "image_url": "/images/products/slimtype_wireless.png",
        "available_quantity": 35,
        "reserved_quantity": 1,
        "low_stock_threshold": 6
    },
    {
        "id": "prod_kb_03",
        "sku": "DK-KB-03",
        "name": "NovaType Ergo Split",
        "brand": "TechNova",
        "category": "keyboard",
        "price_paise": 899900,  # ₹8,999
        "currency": "INR",
        "description": "Ergonomic split-column mechanical keyboard designed to relieve wrist strain during marathon software sprints.",
        "specs": {"layout": "Split Ortholinear", "connectivity": "USB-C Wired + TRRS", "switches": "Gateron Brown Tactile"},
        "image_url": "/images/products/novatype_ergo.png",
        "available_quantity": 8,
        "reserved_quantity": 0,
        "low_stock_threshold": 3
    },
    {
        "id": "prod_kb_04",
        "sku": "DK-KB-04",
        "name": "Nexus Keyset 65 Wireless",
        "brand": "Nexus",
        "category": "keyboard",
        "price_paise": 599900,  # ₹5,999
        "currency": "INR",
        "description": "CNC aluminum 65% keyboard with brass weight and PBT double-shot keycaps.",
        "specs": {"layout": "65% Compact", "connectivity": "Bluetooth & Type-C", "switches": "Gateron Pro Yellow"},
        "image_url": "/images/products/nexus_keyset_65.png",
        "available_quantity": 14,
        "reserved_quantity": 1,
        "low_stock_threshold": 4
    },
    {
        "id": "prod_kb_05",
        "sku": "DK-KB-05",
        "name": "VeloceStrike RGB Mechanical",
        "brand": "Veloce",
        "category": "keyboard",
        "price_paise": 349900,  # ₹3,499
        "currency": "INR",
        "description": "Tenkeyless (TKL) gaming and coding keyboard with per-key RGB backlighting and braided cable.",
        "specs": {"layout": "87-Key TKL", "connectivity": "USB-C Wired", "switches": "Outemu Red Linear"},
        "image_url": "/images/products/velocestrike_rgb.png",
        "available_quantity": 30,
        "reserved_quantity": 2,
        "low_stock_threshold": 5
    },
    {
        "id": "prod_kb_06",
        "sku": "DK-KB-06",
        "name": "ByteKeys Essential USB",
        "brand": "ByteForge",
        "category": "keyboard",
        "price_paise": 89900,  # ₹899
        "currency": "INR",
        "description": "Simple, reliable wired spill-resistant membrane keyboard for everyday workstation usage.",
        "specs": {"layout": "Full Size", "connectivity": "USB-A Wired (1.8m)", "switches": "Membrane"},
        "image_url": "/images/products/bytekeys_essential.png",
        "available_quantity": 60,
        "reserved_quantity": 0,
        "low_stock_threshold": 12
    },
    {
        "id": "prod_kb_07",
        "sku": "DK-KB-07",
        "name": "Aether FoldKey Bluetooth",
        "brand": "Aether",
        "category": "keyboard",
        "price_paise": 249900,  # ₹2,499
        "currency": "INR",
        "description": "Tri-folding pocket keyboard with built-in touchpad, ideal for tablet travel setups.",
        "specs": {"layout": "Folding Compact", "connectivity": "Bluetooth 5.1", "weight_kg": 0.22},
        "image_url": "/images/products/aether_foldkey.png",
        "available_quantity": 20,
        "reserved_quantity": 1,
        "low_stock_threshold": 4
    },
    {
        "id": "prod_kb_08",
        "sku": "DK-KB-08",
        "name": "OmniType DualOS Wireless",
        "brand": "Omni",
        "category": "keyboard",
        "price_paise": 199900,  # ₹1,999
        "currency": "INR",
        "description": "Multi-device wireless keyboard with dedicated Mac and Windows dual layout keycaps.",
        "specs": {"layout": "Compact Tenkeyless", "connectivity": "Bluetooth 3-device switch", "switches": "Scissor"},
        "image_url": "/images/products/omnitype_dual.png",
        "available_quantity": 32,
        "reserved_quantity": 1,
        "low_stock_threshold": 5
    },

    # ==========================================
    # 5. MICE (10 SKUs)
    # ==========================================
    {
        "id": "prod_mouse_01",
        "sku": "DK-MS-01",
        "name": "TechNova Precision Wireless Mouse",
        "brand": "TechNova",
        "category": "mouse",
        "price_paise": 149900,  # ₹1,499 (THE KEY BUNDLE PRODUCT)
        "currency": "INR",
        "description": "Ergonomic wireless mouse with silent mechanical switches, dual-mode connectivity, and smooth hyper-fast scroll wheel, tailored for developer workflows.",
        "specs": {"sensor": "Optical 4000 DPI", "connectivity": "2.4GHz Nano USB + Bluetooth 5.0", "battery_life": "18 months (1x AA)", "buttons": 6, "weight_g": 92},
        "image_url": "/images/products/precision_mouse.png",
        "available_quantity": 65,
        "reserved_quantity": 4,
        "low_stock_threshold": 10
    },
    {
        "id": "prod_mouse_02",
        "sku": "DK-MS-02",
        "name": "TechNova ErgoVertical Pro",
        "brand": "TechNova",
        "category": "mouse",
        "price_paise": 299900,  # ₹2,999
        "currency": "INR",
        "description": "57-degree natural handshake posture vertical mouse designed to prevent carpal tunnel syndrome.",
        "specs": {"sensor": "Optical 4000 DPI", "posture_angle": "57 degrees", "connectivity": "Bluetooth + 2.4GHz", "rechargeable": "USB-C"},
        "image_url": "/images/products/ergovertical_mouse.png",
        "available_quantity": 24,
        "reserved_quantity": 1,
        "low_stock_threshold": 5
    },
    {
        "id": "prod_mouse_03",
        "sku": "DK-MS-03",
        "name": "NovaTrack Thumb Trackball",
        "brand": "TechNova",
        "category": "mouse",
        "price_paise": 379900,  # ₹3,799
        "currency": "INR",
        "description": "Stationary ergonomic trackball mouse that eliminates arm movement across tight desks.",
        "specs": {"ball_diameter_mm": 34, "connectivity": "Bluetooth + USB Dongle", "dpi_levels": "500/1000/1600"},
        "image_url": "/images/products/novatrack_mouse.png",
        "available_quantity": 12,
        "reserved_quantity": 0,
        "low_stock_threshold": 3
    },
    {
        "id": "prod_mouse_04",
        "sku": "DK-MS-04",
        "name": "VeloceGlide 8K Wireless",
        "brand": "Veloce",
        "category": "mouse",
        "price_paise": 449900,  # ₹4,499
        "currency": "INR",
        "description": "Ultra-lightweight 49g gaming mouse featuring 8000Hz polling rate and PixArt 3395 sensor.",
        "specs": {"sensor": "PixArt PAW3395 26K DPI", "weight_g": 49, "polling_rate": "8000Hz Wireless", "switches": "Optical 100M clicks"},
        "image_url": "/images/products/veloceglide_8k.png",
        "available_quantity": 18,
        "reserved_quantity": 2,
        "low_stock_threshold": 4
    },
    {
        "id": "prod_mouse_05",
        "sku": "DK-MS-05",
        "name": "ByteMouse USB Simple",
        "brand": "ByteForge",
        "category": "mouse",
        "price_paise": 34900,  # ₹349
        "currency": "INR",
        "description": "Basic 3-button optical wired USB mouse with 1000 DPI tracking.",
        "specs": {"sensor": "1000 DPI Optical", "connectivity": "USB-A Wired (1.5m)", "buttons": 3},
        "image_url": "/images/products/bytemouse_simple.png",
        "available_quantity": 80,
        "reserved_quantity": 2,
        "low_stock_threshold": 15
    },
    {
        "id": "prod_mouse_06",
        "sku": "DK-MS-06",
        "name": "Nexus MasterPro Scroll",
        "brand": "Nexus",
        "category": "mouse",
        "price_paise": 699900,  # ₹6,999
        "currency": "INR",
        "description": "Machined stainless steel MagSpeed scroll wheel mouse with thumb gesture pad and darkfield sensor that tracks on glass.",
        "specs": {"sensor": "8000 DPI Darkfield", "connectivity": "Bluetooth Low Energy + Bolt", "battery": "USB-C Rechargeable (70 days)"},
        "image_url": "/images/products/nexus_masterpro.png",
        "available_quantity": 10,
        "reserved_quantity": 1,
        "low_stock_threshold": 3
    },
    {
        "id": "prod_mouse_07",
        "sku": "DK-MS-07",
        "name": "Aether Pebble Ultra-Slim",
        "brand": "Aether",
        "category": "mouse",
        "price_paise": 99900,  # ₹999
        "currency": "INR",
        "description": "Quiet pebble-shaped flat mouse that slips into laptop sleeves without bulging.",
        "specs": {"profile": "Low Profile Flat", "clicks": "90% Noise Reduction", "connectivity": "Bluetooth"},
        "image_url": "/images/products/aether_pebble.png",
        "available_quantity": 40,
        "reserved_quantity": 3,
        "low_stock_threshold": 8
    },
    {
        "id": "prod_mouse_08",
        "sku": "DK-MS-08",
        "name": "Zenith Carbon Precision",
        "brand": "Zenith",
        "category": "mouse",
        "price_paise": 849900,  # ₹8,499
        "currency": "INR",
        "description": "Carbon fiber composite shell mouse weighing only 42 grams with zero flex.",
        "specs": {"material": "Real Carbon Fiber", "sensor": "30K DPI Optical", "connectivity": "2.4GHz Lag-free"},
        "image_url": "/images/products/zenith_carbon_mouse.png",
        "available_quantity": 5,
        "reserved_quantity": 0,
        "low_stock_threshold": 2
    },
    {
        "id": "prod_mouse_09",
        "sku": "DK-MS-09",
        "name": "Titan HeavyClick Wireless",
        "brand": "Titan",
        "category": "mouse",
        "price_paise": 179900,  # ₹1,799
        "currency": "INR",
        "description": "Shockproof rubberized wireless mouse built to survive workstation drops.",
        "specs": {"sensor": "2400 DPI", "bumper": "Full Rubberized Bumper", "drop_tested": "2 meters"},
        "image_url": "/images/products/titan_heavy_mouse.png",
        "available_quantity": 25,
        "reserved_quantity": 0,
        "low_stock_threshold": 5
    },
    {
        "id": "prod_mouse_10",
        "sku": "DK-MS-10",
        "name": "OmniPresenter Laser Mouse",
        "brand": "Omni",
        "category": "mouse",
        "price_paise": 249900,  # ₹2,499
        "currency": "INR",
        "description": "2-in-1 device functioning as a desktop mouse and rotating into a wireless presentation clicker with red laser pointer.",
        "specs": {"modes": "Desktop Mouse / Presentation Remote", "laser": "Class 2 Red", "range_m": 15},
        "image_url": "/images/products/omni_presenter_mouse.png",
        "available_quantity": 16,
        "reserved_quantity": 1,
        "low_stock_threshold": 4
    },

    # ==========================================
    # 6. HEADPHONES & AUDIO (8 SKUs)
    # ==========================================
    {
        "id": "prod_hp_01",
        "sku": "DK-HP-01",
        "name": "TechNova SoundSilence Pro ANC",
        "brand": "TechNova",
        "category": "headphones",
        "price_paise": 799900,  # ₹7,999
        "currency": "INR",
        "description": "Over-ear active noise cancelling headphones with hybrid triple-mic array for distraction-free coding in noisy environments.",
        "specs": {"anc_depth_db": 42, "battery_hours": 45, "codecs": "LDAC, AAC, SBC", "multipoint": "2 devices simultaneous"},
        "image_url": "/images/products/soundsilence_pro.png",
        "available_quantity": 20,
        "reserved_quantity": 1,
        "low_stock_threshold": 4
    },
    {
        "id": "prod_hp_02",
        "sku": "DK-HP-02",
        "name": "TechNova AirBuds Developer TWS",
        "brand": "TechNova",
        "category": "headphones",
        "price_paise": 299900,  # ₹2,999
        "currency": "INR",
        "description": "True wireless earbuds with low-latency gaming/video mode and dual ENC mics for crystal clear standup calls.",
        "specs": {"driver_mm": 12.4, "battery_hours": 36, "ip_rating": "IP55", "low_latency_ms": 45},
        "image_url": "/images/products/airbuds_dev.png",
        "available_quantity": 40,
        "reserved_quantity": 3,
        "low_stock_threshold": 8
    },
    {
        "id": "prod_hp_03",
        "sku": "DK-HP-03",
        "name": "NovaAcoustic OpenEar Studio",
        "brand": "TechNova",
        "category": "headphones",
        "price_paise": 1199900,  # ₹11,999
        "currency": "INR",
        "description": "Open-back reference headphones offering wide, natural soundstage and breathable velour earpads.",
        "specs": {"type": "Open-Back Dynamic", "impedance_ohm": 80, "frequency_hz": "5 - 35,000", "cable": "3m Detachable Oxygen-Free"},
        "image_url": "/images/products/nova_openear.png",
        "available_quantity": 8,
        "reserved_quantity": 0,
        "low_stock_threshold": 2
    },
    {
        "id": "prod_hp_04",
        "sku": "DK-HP-04",
        "name": "Nexus QuietComfort Studio",
        "brand": "Nexus",
        "category": "headphones",
        "price_paise": 1999900,  # ₹19,999
        "currency": "INR",
        "description": "Executive ANC headphones with custom spatial audio calibration and plush memory foam headband.",
        "specs": {"anc": "Adaptive Digital ANC", "battery_hours": 30, "fast_charge": "15m gives 4 hours", "weight_g": 240},
        "image_url": "/images/products/nexus_quietcomfort.png",
        "available_quantity": 10,
        "reserved_quantity": 0,
        "low_stock_threshold": 3
    },
    {
        "id": "prod_hp_05",
        "sku": "DK-HP-05",
        "name": "ByteSound USB Headset",
        "brand": "ByteForge",
        "category": "headphones",
        "price_paise": 129900,  # ₹1,299
        "currency": "INR",
        "description": "Wired USB on-ear headset with noise-cancelling boom mic and in-line volume/mute controls.",
        "specs": {"connection": "USB-A Plug and Play", "mic": "Rotatable Boom ENC", "cable_m": 2.1},
        "image_url": "/images/products/bytesound_usb.png",
        "available_quantity": 50,
        "reserved_quantity": 2,
        "low_stock_threshold": 10
    },
    {
        "id": "prod_hp_06",
        "sku": "DK-HP-06",
        "name": "VeloceWave Spatial 7.1",
        "brand": "Veloce",
        "category": "headphones",
        "price_paise": 449900,  # ₹4,499
        "currency": "INR",
        "description": "Wireless surround sound gaming headset with 50mm neodymium drivers and broadcast-quality mic.",
        "specs": {"audio": "Virtual 7.1 Surround", "wireless": "2.4GHz Lossless", "battery_hours": 32},
        "image_url": "/images/products/velocewave_71.png",
        "available_quantity": 18,
        "reserved_quantity": 1,
        "low_stock_threshold": 4
    },
    {
        "id": "prod_hp_07",
        "sku": "DK-HP-07",
        "name": "Aether BoneConduct Sport",
        "brand": "Aether",
        "category": "headphones",
        "price_paise": 379900,  # ₹3,799
        "currency": "INR",
        "description": "Open-ear bone conduction headset that keeps your ears open to room surroundings and team chats.",
        "specs": {"technology": "Bone Conduction Transducers", "ip_rating": "IP67 Waterproof", "battery_hours": 8},
        "image_url": "/images/products/aether_boneconduct.png",
        "available_quantity": 16,
        "reserved_quantity": 1,
        "low_stock_threshold": 4
    },
    {
        "id": "prod_hp_08",
        "sku": "DK-HP-08",
        "name": "OmniCall Conference Speakerphone",
        "brand": "Omni",
        "category": "headphones",
        "price_paise": 499900,  # ₹4,999
        "currency": "INR",
        "description": "360-degree table speakerphone with 4-microphone beamforming array and echo cancellation for team scrum calls.",
        "specs": {"pickup_radius_m": 4, "speaker_w": 5, "connectivity": "USB-C + Bluetooth 5.3"},
        "image_url": "/images/products/omnicall_speaker.png",
        "available_quantity": 14,
        "reserved_quantity": 0,
        "low_stock_threshold": 3
    },

    # ==========================================
    # 7. TABLETS (6 SKUs)
    # ==========================================
    {
        "id": "prod_tab_01",
        "sku": "DK-TAB-01",
        "name": "TechNova Pad Pro 11",
        "brand": "TechNova",
        "category": "tablet",
        "price_paise": 3499900,  # ₹34,999
        "currency": "INR",
        "description": "11-inch 2.5K 144Hz stylus-ready tablet equipped with quad speakers and desktop-style split screen multitasking.",
        "specs": {"display": "11-inch 2.5K 144Hz IPS", "processor": "Snapdragon 870", "ram_gb": 8, "storage_gb": 128, "pen_support": "Active Stylus (4096 levels)"},
        "image_url": "/images/products/pad_pro_11.png",
        "available_quantity": 15,
        "reserved_quantity": 1,
        "low_stock_threshold": 4
    },
    {
        "id": "prod_tab_02",
        "sku": "DK-TAB-02",
        "name": "TechNova Pad Max 12.7",
        "brand": "TechNova",
        "category": "tablet",
        "price_paise": 4499900,  # ₹44,999
        "currency": "INR",
        "description": "Large 12.7-inch paper-feel display tablet ideal for architectural schematics, code architecture sketching, and sheet music.",
        "specs": {"display": "12.7-inch 144Hz Anti-Glare", "processor": "Dimensity 8300", "ram_gb": 8, "storage_gb": 256, "battery_mah": 10200},
        "image_url": "/images/products/pad_max_127.png",
        "available_quantity": 10,
        "reserved_quantity": 0,
        "low_stock_threshold": 3
    },
    {
        "id": "prod_tab_03",
        "sku": "DK-TAB-03",
        "name": "NovaNote E-Ink Reader",
        "brand": "TechNova",
        "category": "tablet",
        "price_paise": 2499900,  # ₹24,999
        "currency": "INR",
        "description": "10.3-inch glare-free Carta 1200 E-Ink tablet for deep reading, technical whitepapers, and natural paper note-taking.",
        "specs": {"display": "10.3-inch E-Ink Carta 300 PPI", "storage_gb": 64, "battery_weeks": 4, "pen": "Wacom EMR Battery-Free Stylus"},
        "image_url": "/images/products/novanote_eink.png",
        "available_quantity": 18,
        "reserved_quantity": 1,
        "low_stock_threshold": 4
    },
    {
        "id": "prod_tab_04",
        "sku": "DK-TAB-04",
        "name": "Nexus Tab Ultra 14",
        "brand": "Nexus",
        "category": "tablet",
        "price_paise": 7999900,  # ₹79,999
        "currency": "INR",
        "description": "Flagship 14.6-inch Dynamic AMOLED 2X tablet with keyboard dock support and desktop mode.",
        "specs": {"display": "14.6-inch AMOLED 120Hz", "processor": "Snapdragon 8 Gen 3", "ram_gb": 12, "storage_gb": 512, "waterproof": "IP68"},
        "image_url": "/images/products/nexus_tab_ultra.png",
        "available_quantity": 6,
        "reserved_quantity": 0,
        "low_stock_threshold": 2
    },
    {
        "id": "prod_tab_05",
        "sku": "DK-TAB-05",
        "name": "BytePad Student 10",
        "brand": "ByteForge",
        "category": "tablet",
        "price_paise": 1299900,  # ₹12,999
        "currency": "INR",
        "description": "Affordable 10.1-inch learning tablet with dual stereo speakers and parent-governed educational profiles.",
        "specs": {"display": "10.1-inch FHD IPS", "processor": "Unisoc T606", "ram_gb": 4, "storage_gb": 64, "battery_mah": 6000},
        "image_url": "/images/products/bytepad_student.png",
        "available_quantity": 35,
        "reserved_quantity": 1,
        "low_stock_threshold": 8
    },
    {
        "id": "prod_tab_06",
        "sku": "DK-TAB-06",
        "name": "OmniPad Mini 8.4",
        "brand": "Omni",
        "category": "tablet",
        "price_paise": 1999900,  # ₹19,999
        "currency": "INR",
        "description": "Single-handed 8.4-inch portable tablet with 4G LTE SIM slot for field diagnostics and drone flight telemetry.",
        "specs": {"display": "8.4-inch 2.5K IPS", "processor": "Helio G99", "ram_gb": 8, "storage_gb": 256, "connectivity": "4G LTE Dual SIM"},
        "image_url": "/images/products/omnipad_mini.png",
        "available_quantity": 22,
        "reserved_quantity": 2,
        "low_stock_threshold": 5
    },

    # ==========================================
    # 8. ACCESSORIES & WORKSPACE GEAR (12 SKUs)
    # ==========================================
    {
        "id": "prod_acc_01",
        "sku": "DK-ACC-01",
        "name": "TechNova 10-in-1 USB-C Hub",
        "brand": "TechNova",
        "category": "accessories",
        "price_paise": 299900,  # ₹2,999
        "currency": "INR",
        "description": "Aluminum USB-C multiport adapter supporting 4K 60Hz HDMI, Gigabit Ethernet, 100W Power Delivery, and SD card reader.",
        "specs": {"ports": "4K HDMI, RJ45 1Gbps, 100W PD, 3x USB 3.0, SD/TF", "material": "Space Gray Aluminum"},
        "image_url": "/images/products/usbc_hub_10in1.png",
        "available_quantity": 40,
        "reserved_quantity": 2,
        "low_stock_threshold": 8
    },
    {
        "id": "prod_acc_02",
        "sku": "DK-ACC-02",
        "name": "TechNova GaN Fast Charger 100W",
        "brand": "TechNova",
        "category": "accessories",
        "price_paise": 249900,  # ₹2,499
        "currency": "INR",
        "description": "Compact gallium nitride (GaN) wall adapter capable of fast-charging a laptop and two phones simultaneously.",
        "specs": {"power_watts": 100, "ports": "3x USB-C + 1x USB-A", "technology": "GaN III Tech"},
        "image_url": "/images/products/gan_charger_100w.png",
        "available_quantity": 55,
        "reserved_quantity": 3,
        "low_stock_threshold": 10
    },
    {
        "id": "prod_acc_03",
        "sku": "DK-ACC-03",
        "name": "TechNova Aluminum Laptop Stand",
        "brand": "TechNova",
        "category": "accessories",
        "price_paise": 119900,  # ₹1,199
        "currency": "INR",
        "description": "Foldable ergonomic aluminum riser with non-slip silicone pads and open airflow design to maximize laptop cooling.",
        "specs": {"compatibility": "10 to 17.3 inch laptops", "angles": "6 adjustable levels", "weight_g": 260},
        "image_url": "/images/products/laptop_stand_alum.png",
        "available_quantity": 50,
        "reserved_quantity": 1,
        "low_stock_threshold": 10
    },
    {
        "id": "prod_acc_04",
        "sku": "DK-ACC-04",
        "name": "DeskMat Pro Desk Pad XL",
        "brand": "TechNova",
        "category": "accessories",
        "price_paise": 79900,  # ₹799
        "currency": "INR",
        "description": "900x400mm waterproof vegan leather desk mat with micro-textured glide surface for mice and keyboards.",
        "specs": {"dimensions_mm": "900 x 400 x 2", "material": "PU Leather Dual-Sided", "waterproof": True},
        "image_url": "/images/products/novamat_xl.png",
        "available_quantity": 60,
        "reserved_quantity": 0,
        "low_stock_threshold": 12
    },
    {
        "id": "prod_acc_05",
        "sku": "DK-ACC-05",
        "name": "Nexus 4K Streaming Webcam",
        "brand": "Nexus",
        "category": "accessories",
        "price_paise": 599900,  # ₹5,999
        "currency": "INR",
        "description": "Ultra HD 4K conference webcam with AI autoframing, dual noise-reducing microphones, and physical privacy shutter.",
        "specs": {"resolution": "4K at 30fps / 1080p at 60fps", "field_of_view": "65/78/90 degrees", "autofocus": "Dual Pixel PDAF"},
        "image_url": "/images/products/webcam_4k.png",
        "available_quantity": 22,
        "reserved_quantity": 1,
        "low_stock_threshold": 5
    },
    {
        "id": "prod_acc_06",
        "sku": "DK-ACC-06",
        "name": "VeloceCode Braided USB-C Cable 2m",
        "brand": "Veloce",
        "category": "accessories",
        "price_paise": 49900,  # ₹499
        "currency": "INR",
        "description": "Heavy-duty nylon braided 100W PD charging and 480Mbps data sync cable tested for 20,000 bends.",
        "specs": {"length_m": 2, "rating": "100W (20V/5A) E-Marker", "jacket": "Double-Braided Nylon"},
        "image_url": "/images/products/usbc_cable_2m.png",
        "available_quantity": 100,
        "reserved_quantity": 5,
        "low_stock_threshold": 20
    },
    {
        "id": "prod_acc_07",
        "sku": "DK-ACC-07",
        "name": "ByteVault 1TB External SSD",
        "brand": "ByteForge",
        "category": "accessories",
        "price_paise": 649900,  # ₹6,499
        "currency": "INR",
        "description": "Shockproof pocket-sized portable SSD with 1050MB/s transfer speeds over USB 3.2 Gen 2.",
        "specs": {"capacity": "1TB", "speed_mbps": "1050 Read / 1000 Write", "connector": "USB-C"},
        "image_url": "/images/products/bytevault_1tb.png",
        "available_quantity": 30,
        "reserved_quantity": 2,
        "low_stock_threshold": 6
    },
    {
        "id": "prod_acc_08",
        "sku": "DK-ACC-08",
        "name": "Zenith ScreenBar Monitor Light",
        "brand": "Zenith",
        "category": "accessories",
        "price_paise": 349900,  # ₹3,499
        "currency": "INR",
        "description": "Asymmetrical optical monitor hanging light bar that illuminates your desk with zero screen glare.",
        "specs": {"color_temp_k": "2700 - 6500K", "cri": "Ra95", "power": "USB 5V/1A"},
        "image_url": "/images/products/screenbar_light.png",
        "available_quantity": 20,
        "reserved_quantity": 1,
        "low_stock_threshold": 4
    },
    {
        "id": "prod_acc_09",
        "sku": "DK-ACC-09",
        "name": "Aether CableOrganizer Magnetic",
        "brand": "Aether",
        "category": "accessories",
        "price_paise": 39900,  # ₹399
        "currency": "INR",
        "description": "Set of 5 magnetic cable clips with adhesive base to keep your charging cords neatly routed on your desk edge.",
        "specs": {"pieces": 5, "magnet": "N52 Neodymium", "adhesive": "Traceless 3M Acrylic"},
        "image_url": "/images/products/cable_organizer.png",
        "available_quantity": 75,
        "reserved_quantity": 0,
        "low_stock_threshold": 15
    },
    {
        "id": "prod_acc_10",
        "sku": "DK-ACC-10",
        "name": "TechNova Sleeve Pro 15",
        "brand": "TechNova",
        "category": "accessories",
        "price_paise": 99900,  # ₹999
        "currency": "INR",
        "description": "Water-repellent 360-degree shock-absorbing bubble foam protective sleeve with accessory front zipper pocket.",
        "specs": {"compatibility": "15 to 15.6 inch laptops", "lining": "Plush Velvet Inner Lining", "exterior": "300D Polyester"},
        "image_url": "/images/products/sleeve_pro_15.png",
        "available_quantity": 50,
        "reserved_quantity": 2,
        "low_stock_threshold": 10
    },
    {
        "id": "prod_acc_11",
        "sku": "DK-ACC-12",
        "name": "Prism Cleaning Kit 7-in-1",
        "brand": "Prism",
        "category": "accessories",
        "price_paise": 44900,  # ₹449
        "currency": "INR",
        "description": "Multi-function keyboard and screen cleaning kit with keycap puller, microfiber wipe, and high-density soft brush.",
        "specs": {"tools": "Keycap puller, brush, screen spray, lens pen, cleaning flock"},
        "image_url": "/images/products/cleaning_kit.png",
        "available_quantity": 65,
        "reserved_quantity": 1,
        "low_stock_threshold": 12
    },
    {
        "id": "prod_acc_12",
        "sku": "DK-ACC-13",
        "name": "Omni PowerBank 20000 65W",
        "brand": "Omni",
        "category": "accessories",
        "price_paise": 329900,  # ₹3,299
        "currency": "INR",
        "description": "High-output 20,000mAh portable power bank capable of fully charging a USB-C laptop at 65W fast-charging speeds.",
        "specs": {"capacity_mah": 20000, "output_watts": 65, "display": "Digital Percentage LED", "ports": "2x USB-C + 1x USB-A"},
        "image_url": "/images/products/powerbank_20k_65w.png",
        "available_quantity": 28,
        "reserved_quantity": 1,
        "low_stock_threshold": 5
    }
]

# Write to data/synthetic_catalog.json
output_path = os.path.join(os.path.dirname(__file__), "..", "..", "data", "synthetic_catalog.json")
output_path = os.path.abspath(output_path)
os.makedirs(os.path.dirname(output_path), exist_ok=True)

with open(output_path, "w", encoding="utf-8") as f:
    json.dump(catalog, f, indent=2, ensure_ascii=False)

print(f"Successfully generated synthetic catalog with {len(catalog)} products at {output_path}")
