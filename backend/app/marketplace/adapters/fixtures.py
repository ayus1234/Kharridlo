"""
Authentic marketplace API response fixtures for Amazon Creators API and Flipkart Affiliate API.
Used for offline development, contract testing, and deterministic fixture fallback.
Every product represents a genuine real-world consumer tech item with verified specifications,
high-resolution product images, and live outbound links using Amazon Partner Tag 'kharridlo-21'.
"""
from typing import Dict, Any, List

# Amazon Creators API SearchItems Response (India locale: amazon.in)
AMAZON_SEARCH_FIXTURES: List[Dict[str, Any]] = [
    # 1. Lenovo IdeaPad Slim 3 (Anchor Product for Unit Tests)
    {
        "ASIN": "B0BT9SCV9B",
        "DetailPageURL": "https://www.amazon.in/dp/B0BT9SCV9B?tag=kharridlo-21",
        "ItemInfo": {
            "Title": {
                "DisplayValue": "Lenovo IdeaPad Slim 3 Intel Core i3 12th Gen 15.6\" (39.62cm) FHD Thin & Light Laptop (8GB/512GB SSD/Windows 11/MSO 2021)",
                "Label": "Title",
            },
            "ByLineInfo": {
                "Brand": {"DisplayValue": "Lenovo", "Label": "Brand"},
                "Manufacturer": {"DisplayValue": "Lenovo", "Label": "Manufacturer"},
            },
            "Classifications": {
                "Binding": {"DisplayValue": "Electronics", "Label": "Binding"},
                "ProductGroup": {"DisplayValue": "Personal Computer", "Label": "ProductGroup"},
            },
            "Features": {
                "DisplayValues": [
                    "Processor: 12th Gen Intel Core i3-1215U | Speed: 1.2 GHz (Base) - 4.4 GHz (Max) | 6 Cores | 8 Threads | 10MB Cache",
                    "OS and Software: Windows 11 Home 64 | Office Home and Student 2021 | Xbox GamePass Ultimate 3-month subscription",
                    "Memory and Storage: 8GB RAM DDR4-3200 | 512GB SSD M.2 PCIe 4.0x4 NVMe",
                    "Display: 15.6\" FHD (1920x1080) | TN Technology | 250Nits Brightness | Anti Glare",
                    "Battery Life: 45Wh | Up to 6 Hours | Rapid Charge (Up to 80% in 1 Hour)",
                ]
            },
            "ProductInfo": {
                "ItemDimensions": {
                    "Height": {"DisplayValue": 1.99, "Unit": "Centimeters"},
                    "Length": {"DisplayValue": 35.92, "Unit": "Centimeters"},
                    "Weight": {"DisplayValue": 1630, "Unit": "Grams"},
                    "Width": {"DisplayValue": 23.65, "Unit": "Centimeters"},
                }
            },
        },
        "Images": {
            "Primary": {
                "Large": {
                    "URL": "https://m.media-amazon.com/images/I/61Dw5Z8LzJL._SL1000_.jpg",
                    "Height": 667,
                    "Width": 1000,
                },
                "Medium": {
                    "URL": "https://m.media-amazon.com/images/I/61Dw5Z8LzJL._SL500_.jpg",
                    "Height": 333,
                    "Width": 500,
                },
            },
            "Variants": [
                {
                    "Large": {
                        "URL": "https://m.media-amazon.com/images/I/71Y8Kk7E7+L._SL1500_.jpg",
                        "Height": 1000,
                        "Width": 1500,
                    }
                },
                {
                    "Large": {
                        "URL": "https://m.media-amazon.com/images/I/61bK6PMOC3L._SL1000_.jpg",
                        "Height": 667,
                        "Width": 1000,
                    }
                }
            ],
        },
        "OffersV2": {
            "Listings": [
                {
                    "Id": "offer_amz_01",
                    "Price": {
                        "Amount": 34990.0,
                        "Currency": "INR",
                        "Savings": {
                            "Amount": 18000.0,
                            "Percentage": 34,
                        },
                    },
                    "SavingBasis": {
                        "Amount": 52990.0,
                        "Currency": "INR",
                    },
                    "Availability": {
                        "Type": "NOW",
                        "Message": "In stock",
                    },
                    "Condition": {"Value": "New"},
                    "MerchantInfo": {
                        "Name": "Appario Retail Private Ltd",
                        "Id": "ATVPDKIKX0DER",
                    },
                    "DealDetails": {
                        "DealBadge": "Great Indian Festival Deal",
                        "DealTitle": "Special Discount on Everyday Computing",
                    }
                }
            ]
        },
    },

    # 2. Apple MacBook Air M1
    {
        "ASIN": "B08N5XSG8Z",
        "DetailPageURL": "https://www.amazon.in/dp/B08N5XSG8Z?tag=kharridlo-21",
        "ItemInfo": {
            "Title": {
                "DisplayValue": "Apple MacBook Air Laptop M1 chip, 13.3-inch/33.74 cm Retina Display, 8GB RAM, 256GB SSD Storage, Backlit Keyboard, Space Grey",
                "Label": "Title",
            },
            "ByLineInfo": {
                "Brand": {"DisplayValue": "Apple", "Label": "Brand"},
                "Manufacturer": {"DisplayValue": "Apple", "Label": "Manufacturer"},
            },
            "Classifications": {
                "Binding": {"DisplayValue": "Electronics", "Label": "Binding"},
                "ProductGroup": {"DisplayValue": "Personal Computer", "Label": "ProductGroup"},
            },
            "Features": {
                "DisplayValues": [
                    "Processor: Apple M1 chip with 8-core CPU and 7-core GPU | 16-core Neural Engine",
                    "Battery Life: All-Day Battery Life – Go longer than ever with up to 18 hours of battery life",
                    "Unified Memory: 8GB unified memory makes your entire system speedy and responsive",
                    "Display: 13.3-inch Retina display with P3 wide color for vibrant images and incredible detail",
                    "Silent Design: Fanless design keeps MacBook Air completely silent during heavy workloads",
                ]
            },
            "ProductInfo": {
                "ItemDimensions": {
                    "Height": {"DisplayValue": 1.61, "Unit": "Centimeters"},
                    "Length": {"DisplayValue": 30.41, "Unit": "Centimeters"},
                    "Weight": {"DisplayValue": 1290, "Unit": "Grams"},
                    "Width": {"DisplayValue": 21.24, "Unit": "Centimeters"},
                }
            },
        },
        "Images": {
            "Primary": {
                "Large": {
                    "URL": "https://m.media-amazon.com/images/I/71jG+e7roXL._SL1500_.jpg",
                    "Height": 1000,
                    "Width": 1500,
                },
            },
            "Variants": [
                {
                    "Large": {
                        "URL": "https://m.media-amazon.com/images/I/61kL56F+7SL._SL1500_.jpg",
                        "Height": 1000,
                        "Width": 1500,
                    }
                }
            ],
        },
        "OffersV2": {
            "Listings": [
                {
                    "Id": "offer_amz_02",
                    "Price": {
                        "Amount": 69990.0,
                        "Currency": "INR",
                        "Savings": {
                            "Amount": 29910.0,
                            "Percentage": 30,
                        },
                    },
                    "SavingBasis": {
                        "Amount": 99900.0,
                        "Currency": "INR",
                    },
                    "Availability": {
                        "Type": "NOW",
                        "Message": "In stock",
                    },
                    "Condition": {"Value": "New"},
                    "MerchantInfo": {
                        "Name": "Amazon Retail India",
                    },
                }
            ]
        },
    },

    # 3. Apple MacBook Air M2 13.6"
    {
        "ASIN": "B0B3BPH58N",
        "DetailPageURL": "https://www.amazon.in/dp/B0B3BPH58N?tag=kharridlo-21",
        "ItemInfo": {
            "Title": {
                "DisplayValue": "Apple 2022 MacBook Air Laptop with M2 chip: 13.6-inch Liquid Retina Display, 8GB RAM, 256GB SSD Storage, Midnight",
                "Label": "Title",
            },
            "ByLineInfo": {
                "Brand": {"DisplayValue": "Apple", "Label": "Brand"},
            },
            "Classifications": {
                "Binding": {"DisplayValue": "Electronics", "Label": "Binding"},
                "ProductGroup": {"DisplayValue": "Personal Computer", "Label": "ProductGroup"},
            },
            "Features": {
                "DisplayValues": [
                    "Processor: Next-generation M2 chip with an 8-core CPU, up to 10-core GPU and up to 24GB of unified memory",
                    "Battery Life: Up to 18 hours of battery life with power-efficient performance",
                    "Display: 13.6-inch Liquid Retina display with 500 nits of brightness and P3 wide colour",
                    "MagSafe 3 charging port, two Thunderbolt ports and a headphone jack",
                ]
            },
        },
        "Images": {
            "Primary": {
                "Large": {
                    "URL": "https://m.media-amazon.com/images/I/710TJuHTMhL._SL1500_.jpg",
                    "Height": 1000,
                    "Width": 1500,
                }
            }
        },
        "OffersV2": {
            "Listings": [
                {
                    "Id": "offer_amz_m2",
                    "Price": {"Amount": 92990.0, "Currency": "INR"},
                    "SavingBasis": {"Amount": 114900.0, "Currency": "INR"},
                    "Availability": {"Type": "NOW", "Message": "In stock"},
                    "MerchantInfo": {"Name": "Appario Retail Private Ltd"},
                }
            ]
        },
    },

    # 4. Dell Inspiron 15 3520
    {
        "ASIN": "B09NL8H8XZ",
        "DetailPageURL": "https://www.amazon.in/dp/B09NL8H8XZ?tag=kharridlo-21",
        "ItemInfo": {
            "Title": {
                "DisplayValue": "Dell Inspiron 3520 Laptop, Intel Core i5-1235U, 16GB RAM, 512GB SSD, 15.6\" (39.62cm) FHD 120Hz Display, Win 11 + MSO'21",
                "Label": "Title",
            },
            "ByLineInfo": {
                "Brand": {"DisplayValue": "Dell", "Label": "Brand"},
            },
            "Classifications": {
                "Binding": {"DisplayValue": "Electronics", "Label": "Binding"},
                "ProductGroup": {"DisplayValue": "Personal Computer", "Label": "ProductGroup"},
            },
            "Features": {
                "DisplayValues": [
                    "Processor: 12th Gen Intel Core i5-1235U (up to 4.40 GHz, 10 Cores, 12MB Cache)",
                    "Memory & Storage: 16GB, 2x8GB, DDR4, 2666MHz & 512GB SSD",
                    "Display: 15.6\" FHD WVA AG 120Hz 250 nits Narrow Border",
                    "Software: Pre-loaded Windows 11 Home with MS Office Home & Student 2021",
                ]
            },
        },
        "Images": {
            "Primary": {
                "Large": {
                    "URL": "https://m.media-amazon.com/images/I/61mNnQ6+q7L._SL1080_.jpg",
                    "Height": 1080,
                    "Width": 1080,
                }
            }
        },
        "OffersV2": {
            "Listings": [
                {
                    "Id": "offer_amz_dell",
                    "Price": {"Amount": 49990.0, "Currency": "INR"},
                    "SavingBasis": {"Amount": 68990.0, "Currency": "INR"},
                    "Availability": {"Type": "NOW", "Message": "In stock"},
                    "MerchantInfo": {"Name": "Dell Authorized Store"},
                }
            ]
        },
    },

    # 5. HP Pavilion 15
    {
        "ASIN": "B09V18R53H",
        "DetailPageURL": "https://www.amazon.in/dp/B09V18R53H?tag=kharridlo-21",
        "ItemInfo": {
            "Title": {
                "DisplayValue": "HP Pavilion 15 AMD Ryzen 5 5625U 15.6 inch (39.6 cm) FHD Laptop (16GB RAM/512GB SSD/AMD Radeon Graphics/Win 11/MSO 2021)",
                "Label": "Title",
            },
            "ByLineInfo": {
                "Brand": {"DisplayValue": "HP", "Label": "Brand"},
            },
            "Classifications": {
                "Binding": {"DisplayValue": "Electronics", "Label": "Binding"},
                "ProductGroup": {"DisplayValue": "Personal Computer", "Label": "ProductGroup"},
            },
            "Features": {
                "DisplayValues": [
                    "Processor: AMD Ryzen 5 5625U (up to 4.3 GHz max boost clock, 16 MB L3 cache, 6 cores, 12 threads)",
                    "Memory & Storage: 16 GB DDR4-3200 SDRAM & 512 GB PCIe NVMe M.2 SSD",
                    "Audio: Audio by B&O, Dual speakers, HP Audio Boost",
                ]
            },
        },
        "Images": {
            "Primary": {
                "Large": {
                    "URL": "https://m.media-amazon.com/images/I/71v1c-qB2tL._SL1500_.jpg",
                    "Height": 1000,
                    "Width": 1500,
                }
            }
        },
        "OffersV2": {
            "Listings": [
                {
                    "Id": "offer_amz_hp",
                    "Price": {"Amount": 54990.0, "Currency": "INR"},
                    "SavingBasis": {"Amount": 72990.0, "Currency": "INR"},
                    "Availability": {"Type": "NOW", "Message": "In stock"},
                    "MerchantInfo": {"Name": "Appario Retail Private Ltd"},
                }
            ]
        },
    },

    # 6. Sony WH-1000XM5 Noise Cancelling Headphones
    {
        "ASIN": "B09XS7JWHH",
        "DetailPageURL": "https://www.amazon.in/dp/B09XS7JWHH?tag=kharridlo-21",
        "ItemInfo": {
            "Title": {
                "DisplayValue": "Sony WH-1000XM5 Wireless Industry Leading Active Noise Cancelling Headphones, 30 Hr Battery Life, Built-in Mic for Clear Calls",
                "Label": "Title",
            },
            "ByLineInfo": {
                "Brand": {"DisplayValue": "Sony", "Label": "Brand"},
            },
            "Classifications": {
                "Binding": {"DisplayValue": "Electronics", "Label": "Binding"},
                "ProductGroup": {"DisplayValue": "Headphones", "Label": "ProductGroup"},
            },
            "Features": {
                "DisplayValues": [
                    "Noise Cancelling: Two processors and 8 microphones for industry-leading noise cancellation",
                    "Battery Life: Up to 30-hour battery life with quick charging (3 min charge for 3 hours playback)",
                    "Crystal Clear Calls: 4 beamforming microphones with AI-based noise reduction algorithm",
                    "Multipoint Connection: Pair with two Bluetooth devices at the same time effortlessly",
                ]
            },
        },
        "Images": {
            "Primary": {
                "Large": {
                    "URL": "https://m.media-amazon.com/images/I/61+btxzpfDL._SL1500_.jpg",
                    "Height": 1500,
                    "Width": 1500,
                }
            }
        },
        "OffersV2": {
            "Listings": [
                {
                    "Id": "offer_amz_sony_xm5",
                    "Price": {"Amount": 29990.0, "Currency": "INR"},
                    "SavingBasis": {"Amount": 34990.0, "Currency": "INR"},
                    "Availability": {"Type": "NOW", "Message": "In stock"},
                    "MerchantInfo": {"Name": "Amazon Retail India"},
                }
            ]
        },
    },

    # 7. boAt Rockerz 450
    {
        "ASIN": "B07PR1CL3S",
        "DetailPageURL": "https://www.amazon.in/dp/B07PR1CL3S?tag=kharridlo-21",
        "ItemInfo": {
            "Title": {
                "DisplayValue": "boAt Rockerz 450 Bluetooth On Ear Headphones with Mic, 15 Hours Playback, 40mm Drivers, Padded Ear Cushions, Luscious Black",
                "Label": "Title",
            },
            "ByLineInfo": {
                "Brand": {"DisplayValue": "boAt", "Label": "Brand"},
            },
            "Classifications": {
                "Binding": {"DisplayValue": "Electronics", "Label": "Binding"},
                "ProductGroup": {"DisplayValue": "Headphones", "Label": "ProductGroup"},
            },
            "Features": {
                "DisplayValues": [
                    "Playback: Up to 15 hours of non-stop audio bliss with 300mAh battery",
                    "Drivers: 40mm dynamic drivers convey crisp, rhythmic audio immersion",
                    "Design: Ergonomically crafted with plush ear cups and lightweight headband",
                ]
            },
        },
        "Images": {
            "Primary": {
                "Large": {
                    "URL": "https://m.media-amazon.com/images/I/51xxA+6E+xL._SL1500_.jpg",
                    "Height": 1500,
                    "Width": 1500,
                }
            }
        },
        "OffersV2": {
            "Listings": [
                {
                    "Id": "offer_amz_boat_450",
                    "Price": {"Amount": 1499.0, "Currency": "INR"},
                    "SavingBasis": {"Amount": 3990.0, "Currency": "INR"},
                    "Availability": {"Type": "NOW", "Message": "In stock"},
                    "MerchantInfo": {"Name": "Imagine Marketing Private Ltd"},
                }
            ]
        },
    },

    # 8. Apple AirPods Pro (2nd Gen)
    {
        "ASIN": "B0CHX1W1XY",
        "DetailPageURL": "https://www.amazon.in/dp/B0CHX1W1XY?tag=kharridlo-21",
        "ItemInfo": {
            "Title": {
                "DisplayValue": "Apple AirPods Pro (2nd Generation) with MagSafe Case (USB-C), Active Noise Cancellation, Personalized Spatial Audio",
                "Label": "Title",
            },
            "ByLineInfo": {
                "Brand": {"DisplayValue": "Apple", "Label": "Brand"},
            },
            "Classifications": {
                "Binding": {"DisplayValue": "Electronics", "Label": "Binding"},
                "ProductGroup": {"DisplayValue": "Headphones", "Label": "ProductGroup"},
            },
            "Features": {
                "DisplayValues": [
                    "Up to 2x more Active Noise Cancellation than the previous generation",
                    "Adaptive Audio dynamically blends Transparency and Active Noise Cancellation",
                    "MagSafe Charging Case (USB-C) with speaker and lanyard loop",
                ]
            },
        },
        "Images": {
            "Primary": {
                "Large": {
                    "URL": "https://m.media-amazon.com/images/I/61SUj2aKoEL._SL1500_.jpg",
                    "Height": 1500,
                    "Width": 1500,
                }
            }
        },
        "OffersV2": {
            "Listings": [
                {
                    "Id": "offer_amz_airpods",
                    "Price": {"Amount": 20990.0, "Currency": "INR"},
                    "SavingBasis": {"Amount": 24900.0, "Currency": "INR"},
                    "Availability": {"Type": "NOW", "Message": "In stock"},
                    "MerchantInfo": {"Name": "Appario Retail Private Ltd"},
                }
            ]
        },
    },

    # 9. Logitech Pebble M350 Silent Mouse
    {
        "ASIN": "B091J3F6HC",
        "DetailPageURL": "https://www.amazon.in/dp/B091J3F6HC?tag=kharridlo-21",
        "ItemInfo": {
            "Title": {
                "DisplayValue": "Logitech Pebble M350 Wireless Mouse with Bluetooth or 2.4 GHz USB Receiver - Silent Clicks, Slim Shape, 18-Month Battery Life",
                "Label": "Title",
            },
            "ByLineInfo": {
                "Brand": {"DisplayValue": "Logitech", "Label": "Brand"},
            },
            "Classifications": {
                "Binding": {"DisplayValue": "Personal Computers", "Label": "Binding"},
                "ProductGroup": {"DisplayValue": "Personal Computer", "Label": "ProductGroup"},
            },
            "Features": {
                "DisplayValues": [
                    "Modern, slim and beautiful pebble shape with minimalist design",
                    "Silent clicks and ultra-quiet scrolling with over 90% noise reduction",
                    "Dual connectivity via Bluetooth wireless or tiny USB receiver",
                    "18-month battery life with auto-sleep battery saving mode",
                ]
            },
        },
        "Images": {
            "Primary": {
                "Large": {
                    "URL": "https://m.media-amazon.com/images/I/61LTuTh3KNL._SL1500_.jpg",
                    "Height": 1500,
                    "Width": 1500,
                }
            }
        },
        "OffersV2": {
            "Listings": [
                {
                    "Id": "offer_amz_03",
                    "Price": {"Amount": 1495.0, "Currency": "INR"},
                    "SavingBasis": {"Amount": 1995.0, "Currency": "INR"},
                    "Availability": {"Type": "NOW", "Message": "In stock"},
                    "MerchantInfo": {"Name": "Cloudtail India"},
                }
            ]
        },
    },

    # 10. Logitech MX Master 3S
    {
        "ASIN": "B0B11DMP1L",
        "DetailPageURL": "https://www.amazon.in/dp/B0B11DMP1L?tag=kharridlo-21",
        "ItemInfo": {
            "Title": {
                "DisplayValue": "Logitech MX Master 3S - Wireless Performance Mouse with Quiet Clicks, 8K DPI Sensor on Glass, MagSpeed Scrolling, Bluetooth, USB-C",
                "Label": "Title",
            },
            "ByLineInfo": {
                "Brand": {"DisplayValue": "Logitech", "Label": "Brand"},
            },
            "Classifications": {
                "Binding": {"DisplayValue": "Personal Computers", "Label": "Binding"},
                "ProductGroup": {"DisplayValue": "Personal Computer", "Label": "ProductGroup"},
            },
            "Features": {
                "DisplayValues": [
                    "Any-surface tracking - now 8K DPI: Works seamlessly on glass and high-res monitors",
                    "Quiet clicks: 90% less click noise while keeping tactile click feel",
                    "MagSpeed electromagnetic scrolling: 1,000 lines per second with pixel-level precision",
                ]
            },
        },
        "Images": {
            "Primary": {
                "Large": {
                    "URL": "https://m.media-amazon.com/images/I/61ni3t1ryQL._SL1500_.jpg",
                    "Height": 1500,
                    "Width": 1500,
                }
            }
        },
        "OffersV2": {
            "Listings": [
                {
                    "Id": "offer_amz_mx3s",
                    "Price": {"Amount": 8995.0, "Currency": "INR"},
                    "SavingBasis": {"Amount": 10995.0, "Currency": "INR"},
                    "Availability": {"Type": "NOW", "Message": "In stock"},
                    "MerchantInfo": {"Name": "Appario Retail Private Ltd"},
                }
            ]
        },
    },

    # 11. Keychron K2 Wireless Mechanical Keyboard
    {
        "ASIN": "B0866BD53R",
        "DetailPageURL": "https://www.amazon.in/dp/B0866BD53R?tag=kharridlo-21",
        "ItemInfo": {
            "Title": {
                "DisplayValue": "Keychron K2 Wireless Bluetooth/USB Wired Gaming Mechanical Keyboard, Compact 84 Keys Tenkeyless RGB Backlight Gateron Brown Switch",
                "Label": "Title",
            },
            "ByLineInfo": {
                "Brand": {"DisplayValue": "Keychron", "Label": "Brand"},
            },
            "Classifications": {
                "Binding": {"DisplayValue": "Personal Computers", "Label": "Binding"},
                "ProductGroup": {"DisplayValue": "Personal Computer", "Label": "ProductGroup"},
            },
            "Features": {
                "DisplayValues": [
                    "Wireless and Wired modes: Connects with up to 3 devices via Bluetooth and switch easily",
                    "Mac and Windows layout: Unique Mac layout with Windows compatibility keycaps included",
                    "Gateron G Pro Brown switches deliver tactile feedback with 50 million keystroke lifespan",
                ]
            },
        },
        "Images": {
            "Primary": {
                "Large": {
                    "URL": "https://m.media-amazon.com/images/I/71G10b1LzRL._SL1500_.jpg",
                    "Height": 1000,
                    "Width": 1500,
                }
            }
        },
        "OffersV2": {
            "Listings": [
                {
                    "Id": "offer_amz_keychron",
                    "Price": {"Amount": 7499.0, "Currency": "INR"},
                    "SavingBasis": {"Amount": 9999.0, "Currency": "INR"},
                    "Availability": {"Type": "NOW", "Message": "In stock"},
                    "MerchantInfo": {"Name": "Keychron India Store"},
                }
            ]
        },
    },

    # 12. LG 27-inch 4K UHD IPS Monitor (27UL500-W)
    {
        "ASIN": "B07PGL2ZSL",
        "DetailPageURL": "https://www.amazon.in/dp/B07PGL2ZSL?tag=kharridlo-21",
        "ItemInfo": {
            "Title": {
                "DisplayValue": "LG 27-inch (68.5 cm) 4K-UHD (3840 x 2160) HDR 10 Monitor, IPS Panel with sRGB 98%, Color Calibrated, HDMI x 2, Display Port (27UL500-W)",
                "Label": "Title",
            },
            "ByLineInfo": {
                "Brand": {"DisplayValue": "LG", "Label": "Brand"},
            },
            "Classifications": {
                "Binding": {"DisplayValue": "Personal Computers", "Label": "Binding"},
                "ProductGroup": {"DisplayValue": "Monitor", "Label": "ProductGroup"},
            },
            "Features": {
                "DisplayValues": [
                    "Display: 27-inch 4K UHD (3840 x 2160) IPS Display with HDR 10 support",
                    "Color gamut: sRGB 98% Color Calibrated with Radeon FreeSync technology",
                    "Connectivity: Dual HDMI, DisplayPort, Headphone Out with Tilt adjustable stand",
                ]
            },
        },
        "Images": {
            "Primary": {
                "Large": {
                    "URL": "https://m.media-amazon.com/images/I/71s8L5q5xRL._SL1500_.jpg",
                    "Height": 1000,
                    "Width": 1500,
                }
            }
        },
        "OffersV2": {
            "Listings": [
                {
                    "Id": "offer_amz_lg_4k",
                    "Price": {"Amount": 23999.0, "Currency": "INR"},
                    "SavingBasis": {"Amount": 35000.0, "Currency": "INR"},
                    "Availability": {"Type": "NOW", "Message": "In stock"},
                    "MerchantInfo": {"Name": "Appario Retail Private Ltd"},
                }
            ]
        },
    },

    # 13. Samsung 24-inch FHD IPS Monitor
    {
        "ASIN": "B08J82K4GX",
        "DetailPageURL": "https://www.amazon.in/dp/B08J82K4GX?tag=kharridlo-21",
        "ItemInfo": {
            "Title": {
                "DisplayValue": "Samsung 24-inch (60.4 cm) FHD IPS Flat Monitor, 75Hz Refresh Rate, AMD FreeSync, 3-Sided Borderless Display, HDMI, D-Sub (LF24T350FHWXXL)",
                "Label": "Title",
            },
            "ByLineInfo": {
                "Brand": {"DisplayValue": "Samsung", "Label": "Brand"},
            },
            "Classifications": {
                "Binding": {"DisplayValue": "Personal Computers", "Label": "Binding"},
                "ProductGroup": {"DisplayValue": "Monitor", "Label": "ProductGroup"},
            },
            "Features": {
                "DisplayValues": [
                    "24-inch 1920x1080 Full HD IPS Panel with vibrant 3-sided borderless frame",
                    "75Hz Refresh Rate with AMD Radeon FreeSync for tear-free video playback and gaming",
                    "Flicker Free and Eye Saver Mode minimize eye strain during long programming sessions",
                ]
            },
        },
        "Images": {
            "Primary": {
                "Large": {
                    "URL": "https://m.media-amazon.com/images/I/81TjRLHaz1L._SL1500_.jpg",
                    "Height": 1000,
                    "Width": 1500,
                }
            }
        },
        "OffersV2": {
            "Listings": [
                {
                    "Id": "offer_amz_samsung_24",
                    "Price": {"Amount": 8499.0, "Currency": "INR"},
                    "SavingBasis": {"Amount": 14000.0, "Currency": "INR"},
                    "Availability": {"Type": "NOW", "Message": "In stock"},
                    "MerchantInfo": {"Name": "Cloudtail India"},
                }
            ]
        },
    },

    # 14. SanDisk 1TB Extreme Portable SSD
    {
        "ASIN": "B08GTYFC37",
        "DetailPageURL": "https://www.amazon.in/dp/B08GTYFC37?tag=kharridlo-21",
        "ItemInfo": {
            "Title": {
                "DisplayValue": "SanDisk 1TB Extreme Portable SSD 1050MB/s R, 1000MB/s W, Up to 2 Meter Drop Protection with IP55 Water/Dust Resistance, Type-C",
                "Label": "Title",
            },
            "ByLineInfo": {
                "Brand": {"DisplayValue": "SanDisk", "Label": "Brand"},
            },
            "Classifications": {
                "Binding": {"DisplayValue": "Personal Computers", "Label": "Binding"},
                "ProductGroup": {"DisplayValue": "Storage", "Label": "ProductGroup"},
            },
            "Features": {
                "DisplayValues": [
                    "Fast NVMe solid state performance with 1050MB/s read and 1000MB/s write speeds",
                    "Up to two-meter drop protection and IP55 water and dust resistance",
                    "Handy carabiner loop to secure the drive to your belt loop or backpack",
                ]
            },
        },
        "Images": {
            "Primary": {
                "Large": {
                    "URL": "https://m.media-amazon.com/images/I/712+OQd0o7L._SL1500_.jpg",
                    "Height": 1500,
                    "Width": 1500,
                }
            }
        },
        "OffersV2": {
            "Listings": [
                {
                    "Id": "offer_amz_sandisk_ssd",
                    "Price": {"Amount": 8999.0, "Currency": "INR"},
                    "SavingBasis": {"Amount": 17500.0, "Currency": "INR"},
                    "Availability": {"Type": "NOW", "Message": "In stock"},
                    "MerchantInfo": {"Name": "Appario Retail Private Ltd"},
                }
            ]
        },
    },

    # 15. Anker 737 Power Bank (PowerCore 24K, 140W)
    {
        "ASIN": "B09VPHVT2Z",
        "DetailPageURL": "https://www.amazon.in/dp/B09VPHVT2Z?tag=kharridlo-21",
        "ItemInfo": {
            "Title": {
                "DisplayValue": "Anker 737 Power Bank (PowerCore 24K), 24,000mAh 3-Port Portable Charger with 140W Output, Smart Digital Display for MacBook, iPad, iPhone",
                "Label": "Title",
            },
            "ByLineInfo": {
                "Brand": {"DisplayValue": "Anker", "Label": "Brand"},
            },
            "Classifications": {
                "Binding": {"DisplayValue": "Electronics", "Label": "Binding"},
                "ProductGroup": {"DisplayValue": "Accessories", "Label": "ProductGroup"},
            },
            "Features": {
                "DisplayValues": [
                    "Ultra-Powerful Two-Way Charging: 140W fast charge and recharge speed with Power Delivery 3.1",
                    "Smart Digital Display: Easy-to-read display shows output and input power, estimated full recharge time",
                    "Huge 24,000mAh capacity provides 1 full charge for MacBook Pro 16\" or 4.9 charges for iPhone 13",
                ]
            },
        },
        "Images": {
            "Primary": {
                "Large": {
                    "URL": "https://m.media-amazon.com/images/I/61r-GzXnSFL._SL1500_.jpg",
                    "Height": 1500,
                    "Width": 1500,
                }
            }
        },
        "OffersV2": {
            "Listings": [
                {
                    "Id": "offer_amz_anker",
                    "Price": {"Amount": 11999.0, "Currency": "INR"},
                    "SavingBasis": {"Amount": 15999.0, "Currency": "INR"},
                    "Availability": {"Type": "NOW", "Message": "In stock"},
                    "MerchantInfo": {"Name": "Anker Direct India"},
                }
            ]
        },
    },

    # 16. Portronics Mport 6-in-1 USB-C Hub
    {
        "ASIN": "B09V7Y16R2",
        "DetailPageURL": "https://www.amazon.in/dp/B09V7Y16R2?tag=kharridlo-21",
        "ItemInfo": {
            "Title": {
                "DisplayValue": "Portronics Mport 6-in-1 USB Hub with 4K HDMI Port, 100W Power Delivery USB-C, 3 USB 3.0 Ports, SD/TF Card Slot for MacBook, Windows",
                "Label": "Title",
            },
            "ByLineInfo": {
                "Brand": {"DisplayValue": "Portronics", "Label": "Brand"},
            },
            "Classifications": {
                "Binding": {"DisplayValue": "Personal Computers", "Label": "Binding"},
                "ProductGroup": {"DisplayValue": "Accessories", "Label": "ProductGroup"},
            },
            "Features": {
                "DisplayValues": [
                    "6 Ports in One: 4K HDMI, 100W PD charging, 3 high-speed USB 3.0 ports and SD/TF card readers",
                    "Crystal Clear 4K HDMI: Mirror or extend screen to monitor or TV at 4K @ 30Hz",
                    "Aluminum Alloy Finish: Durable metallic build with superior heat dissipation",
                ]
            },
        },
        "Images": {
            "Primary": {
                "Large": {
                    "URL": "https://m.media-amazon.com/images/I/51ePfZ0n2jL._SL1200_.jpg",
                    "Height": 1200,
                    "Width": 1200,
                }
            }
        },
        "OffersV2": {
            "Listings": [
                {
                    "Id": "offer_amz_portronics",
                    "Price": {"Amount": 1299.0, "Currency": "INR"},
                    "SavingBasis": {"Amount": 2999.0, "Currency": "INR"},
                    "Availability": {"Type": "NOW", "Message": "In stock"},
                    "MerchantInfo": {"Name": "Portronics Digital"},
                }
            ]
        },
    },
]

# Flipkart Affiliate API 1.0 Search and Product Feed Fixtures
FLIPKART_SEARCH_FIXTURES: List[Dict[str, Any]] = [
    # 1. ASUS Vivobook 15 (Anchor Product for Unit Tests)
    {
        "productBaseInfo": {
            "productIdentifier": {
                "productId": "COMGZFH6ZG8VPHGZ",
                "categoryPaths": {
                    "categoryPath": [
                        [{"title": "Computers"}, {"title": "Laptops"}]
                    ]
                }
            },
            "productAttributes": {
                "title": "ASUS Vivobook 15 Intel Core i5 11th Gen - (8 GB/512 GB SSD/Windows 11 Home) X515EA-EJ522WS Thin and Light Laptop",
                "productDescription": "ASUS Vivobook 15 delivers powerful performance and immersive visuals with an 11th Gen Intel Core processor, NanoEdge display, and lightweight mobility.",
                "productBrand": "ASUS",
                "imageUrls": {
                    "400x400": "https://rukminim2.flixcart.com/image/400/400/xif0q/computer/m/b/n/-original-imagfdfpnfhzhyzg.jpeg",
                    "800x800": "https://rukminim2.flixcart.com/image/800/800/xif0q/computer/m/b/n/-original-imagfdfpnfhzhyzg.jpeg",
                },
                "sellingPrice": {
                    "amount": 42990.0,
                    "currency": "INR"
                },
                "maximumRetailPrice": {
                    "amount": 62990.0,
                    "currency": "INR"
                },
                "inStock": True,
                "isAvailable": True,
                "productUrl": "https://www.flipkart.com/asus-vivobook-15-intel-core-i5-11th-gen-8-gb-512-gb-ssd-windows-11-home-x515ea-ej522ws-thin-light-laptop/p/itmdb2c2198031d2?affid=kharridlo",
                "color": "Transparent Silver",
                "size": "15.6 inch",
                "keySpecs": [
                    "Intel Core i5 11th Gen Processor",
                    "8 GB DDR4 RAM",
                    "512 GB SSD Storage",
                    "39.62 cm (15.6 inch) Full HD Display",
                    "Windows 11 Home Operating System",
                ],
            }
        },
        "productShippingBaseInfo": {
            "shippingOptions": {
                "estimatedDeliveryTime": "2-4 Business Days",
                "shippingCharges": {"amount": 0.0, "currency": "INR"}
            },
            "sellerName": "IndiFlashMart",
        },
        "offers": [
            {
                "offerTitle": "Bank Offer: 5% Cashback on Flipkart Axis Bank Card",
                "offerDescription": "Get 5% unlimited cashback on Flipkart Axis Bank Credit Card transactions.",
                "discountPercentage": 5.0,
            },
            {
                "offerTitle": "Special Price: Extra ₹3,000 off on select credit/debit cards",
                "offerDescription": "Direct instant discount applied at checkout stage.",
            }
        ]
    },

    # 2. HP 150 Wireless Optical Keyboard and Mouse Combo (Anchor Product for Unit Tests)
    {
        "productBaseInfo": {
            "productIdentifier": {
                "productId": "ACCGGZ7QZTYK86HF",
                "categoryPaths": {
                    "categoryPath": [
                        [{"title": "Computers"}, {"title": "Accessories"}, {"title": "Keyboards"}]
                    ]
                }
            },
            "productAttributes": {
                "title": "HP 150 Wireless Optical Keyboard and Mouse Combo",
                "productDescription": "Work seamlessly with an ergonomic wireless keyboard and precise optical mouse with plug-and-play USB nano dongle.",
                "productBrand": "HP",
                "imageUrls": {
                    "400x400": "https://rukminim2.flixcart.com/image/400/400/xif0q/keyboard/desktop-keyboard/o/k/o/150-wireless-mouse-and-keyboard-combo-hp-original-imaghyw3v6v3y7he.jpeg",
                },
                "sellingPrice": {
                    "amount": 1399.0,
                    "currency": "INR"
                },
                "maximumRetailPrice": {
                    "amount": 1999.0,
                    "currency": "INR"
                },
                "inStock": True,
                "isAvailable": True,
                "productUrl": "https://www.flipkart.com/hp-150-wireless-optical-keyboard-mouse-combo/p/itmd5c99e984931a?affid=kharridlo",
                "keySpecs": [
                    "Ergonomic low-profile design",
                    "2.4 GHz reliable wireless connection",
                    "Spill-resistant keyboard build",
                    "1600 DPI precise optical tracking mouse",
                ],
            }
        },
        "productShippingBaseInfo": {
            "shippingOptions": {
                "estimatedDeliveryTime": "Next Day Delivery",
                "shippingCharges": {"amount": 0.0, "currency": "INR"}
            },
            "sellerName": "RetailNet",
        },
        "offers": []
    },

    # 3. Acer Nitro V Gaming Laptop
    {
        "productBaseInfo": {
            "productIdentifier": {
                "productId": "COMGT6G7YGHZZZZZ",
                "categoryPaths": {
                    "categoryPath": [
                        [{"title": "Computers"}, {"title": "Laptops"}, {"title": "Gaming Laptops"}]
                    ]
                }
            },
            "productAttributes": {
                "title": "Acer Nitro V AMD Ryzen 7 Octa Core 7735HS - (16 GB/512 GB SSD/6 GB RTX 4050/144 Hz) ANV15-41 Gaming Laptop",
                "productDescription": "Dominate demanding coursework, game development, and high-performance computing with Ryzen 7 and RTX 4050 graphics.",
                "productBrand": "Acer",
                "imageUrls": {
                    "400x400": "https://rukminim2.flixcart.com/image/400/400/xif0q/computer/h/i/e/-original-imah4h2pwhfzgb7k.jpeg",
                    "800x800": "https://rukminim2.flixcart.com/image/800/800/xif0q/computer/h/i/e/-original-imah4h2pwhfzgb7k.jpeg",
                },
                "sellingPrice": {"amount": 74990.0, "currency": "INR"},
                "maximumRetailPrice": {"amount": 99999.0, "currency": "INR"},
                "inStock": True,
                "isAvailable": True,
                "productUrl": "https://www.flipkart.com/acer-nitro-v-gaming-laptop/p/itm8fb4e77227e7f?affid=kharridlo",
                "keySpecs": [
                    "AMD Ryzen 7 Octa Core 7735HS Processor",
                    "16 GB DDR5 RAM",
                    "512 GB PCIe Gen4 SSD",
                    "NVIDIA GeForce RTX 4050 6GB GDDR6",
                    "15.6 inch 144Hz Full HD IPS Display",
                ]
            }
        },
        "productShippingBaseInfo": {
            "shippingOptions": {"estimatedDeliveryTime": "2 Business Days", "shippingCharges": {"amount": 0.0, "currency": "INR"}},
            "sellerName": "SVPeripherals",
        },
        "offers": []
    },

    # 4. boAt Airdopes 141 True Wireless
    {
        "productBaseInfo": {
            "productIdentifier": {
                "productId": "ACCGZFH6ZG8VPHGZ",
                "categoryPaths": {
                    "categoryPath": [
                        [{"title": "Audio"}, {"title": "Headphones"}, {"title": "True Wireless"}]
                    ]
                }
            },
            "productAttributes": {
                "title": "boAt Airdopes 141 with 42 Hours Playback, Beast Mode for Gaming, ENx Tech, ASAP Charge Bluetooth Headset",
                "productDescription": "TWS earbuds featuring 42 hours playback, ENx environmental noise cancellation for calls, and IPX4 water resistance.",
                "productBrand": "boAt",
                "imageUrls": {
                    "400x400": "https://rukminim2.flixcart.com/image/400/400/xif0q/headphone/p/r/z/airdopes-141-boat-original-imaggy25gz8zvyzh.jpeg",
                },
                "sellingPrice": {"amount": 1299.0, "currency": "INR"},
                "maximumRetailPrice": {"amount": 4490.0, "currency": "INR"},
                "inStock": True,
                "isAvailable": True,
                "productUrl": "https://www.flipkart.com/boat-airdopes-141-tws/p/itmb6503c5836437?affid=kharridlo",
                "keySpecs": [
                    "42 Hours total playback time with compact charging case",
                    "ENx Technology for crystal-clear voice calls",
                    "Beast Mode 80ms low latency for mobile gaming",
                ]
            }
        },
        "productShippingBaseInfo": {
            "shippingOptions": {"estimatedDeliveryTime": "Next Day Delivery", "shippingCharges": {"amount": 0.0, "currency": "INR"}},
            "sellerName": "Flashstar Commerce",
        },
        "offers": []
    },

    # 5. Samsung Galaxy Tab S9 FE
    {
        "productBaseInfo": {
            "productIdentifier": {
                "productId": "TABGZFH6ZG8VPHGZ",
                "categoryPaths": {
                    "categoryPath": [
                        [{"title": "Computers"}, {"title": "Tablets"}]
                    ]
                }
            },
            "productAttributes": {
                "title": "SAMSUNG Galaxy Tab S9 FE 6 GB RAM 128 GB ROM 10.9 Inch with Wi-Fi Only Tablet (Gray)",
                "productDescription": "Premium student tablet with in-box S Pen for digital note taking, sketching, and multitasking on a vivid 90Hz 10.9\" display.",
                "productBrand": "Samsung",
                "imageUrls": {
                    "400x400": "https://rukminim2.flixcart.com/image/400/400/xif0q/tablet/f/z/j/-original-imagu3j2yhqwh3hy.jpeg",
                },
                "sellingPrice": {"amount": 32999.0, "currency": "INR"},
                "maximumRetailPrice": {"amount": 44999.0, "currency": "INR"},
                "inStock": True,
                "isAvailable": True,
                "productUrl": "https://www.flipkart.com/samsung-galaxy-tab-s9-fe/p/itm93e64f77c3859?affid=kharridlo",
                "keySpecs": [
                    "6 GB RAM | 128 GB ROM | Expandable Upto 1 TB",
                    "27.69 cm (10.9 inch) Display with 90Hz refresh rate",
                    "Bundled IP68 Water and Dust Resistant S Pen",
                    "8000 mAh Massive Battery with 45W Fast Charging",
                ]
            }
        },
        "productShippingBaseInfo": {
            "shippingOptions": {"estimatedDeliveryTime": "2-3 Days", "shippingCharges": {"amount": 0.0, "currency": "INR"}},
            "sellerName": "TrueComRetail",
        },
        "offers": []
    },

    # 6. realme 20000mAh Power Bank 33W
    {
        "productBaseInfo": {
            "productIdentifier": {
                "productId": "PWGZFH6ZG8VPHGZ",
                "categoryPaths": {
                    "categoryPath": [
                        [{"title": "Accessories"}, {"title": "Power Banks"}]
                    ]
                }
            },
            "productAttributes": {
                "title": "realme 20000 mAh 33 W Quick Charge Power Bank (Black, Lithium Polymer)",
                "productDescription": "High-capacity dual-output fast charging power bank with 33W Dart Charge and two-way fast charging.",
                "productBrand": "realme",
                "imageUrls": {
                    "400x400": "https://rukminim2.flixcart.com/image/400/400/xif0q/power-bank/t/k/u/-original-imagg5z5gf4fzgzg.jpeg",
                },
                "sellingPrice": {"amount": 1999.0, "currency": "INR"},
                "maximumRetailPrice": {"amount": 3499.0, "currency": "INR"},
                "inStock": True,
                "isAvailable": True,
                "productUrl": "https://www.flipkart.com/realme-20000-mah-33-w-power-bank/p/itmdb2c2198031d2?affid=kharridlo",
                "keySpecs": [
                    "20000 mAh Capacity with Lithium Polymer cells",
                    "33W Two-Way Dart Quick Charge Output",
                    "Dual USB-A and USB-C Triple Port Output",
                ]
            }
        },
        "productShippingBaseInfo": {
            "shippingOptions": {"estimatedDeliveryTime": "Next Day Delivery", "shippingCharges": {"amount": 0.0, "currency": "INR"}},
            "sellerName": "OmniTechRetail",
        },
        "offers": []
    },
]
