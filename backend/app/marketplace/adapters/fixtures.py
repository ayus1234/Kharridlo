"""
Authentic marketplace API response fixtures for Amazon Creators API and Flipkart Affiliate API.
Used for offline development, contract testing, and deterministic fixture fallback.
"""
from typing import Dict, Any, List

# Amazon Creators API SearchItems Response (India locale: amazon.in)
AMAZON_SEARCH_FIXTURES: List[Dict[str, Any]] = [
    {
        "ASIN": "B0BT9SCV9B",
        "DetailPageURL": "https://www.amazon.in/dp/B0BT9SCV9B?tag=kharridlo-21",
        "ItemInfo": {
            "Title": {
                "DisplayValue": "Lenovo IdeaPad Slim 3 Intel Core i3 12th Gen 15.6\" (39.62cm) FHD Thin & Light Laptop",
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
    {
        "ASIN": "B08N5XSG8Z",
        "DetailPageURL": "https://www.amazon.in/dp/B08N5XSG8Z?tag=kharridlo-21",
        "ItemInfo": {
            "Title": {
                "DisplayValue": "Apple MacBook Air Laptop M1 chip, 13.3-inch/33.74 cm Retina Display, 8GB RAM, 256GB SSD",
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
                    "All-Day Battery Life – Go longer than ever with up to 18 hours of battery life.",
                    "Powerful Performance – Take on everything from professional-quality editing to action-packed gaming with ease.",
                    "Superfast Memory – 8GB of unified memory makes your entire system speedy and responsive.",
                    "Stunning Display – With a 13.3-inch/33.74 cm Retina display, images take on new levels of realism.",
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
    {
        "ASIN": "B091J3F6HC",
        "DetailPageURL": "https://www.amazon.in/dp/B091J3F6HC?tag=kharridlo-21",
        "ItemInfo": {
            "Title": {
                "DisplayValue": "Logitech Pebble M350 Wireless Mouse with Bluetooth or 2.4 GHz USB Receiver - Silent",
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
                    "Price": {
                        "Amount": 1495.0,
                        "Currency": "INR",
                        "Savings": {
                            "Amount": 500.0,
                            "Percentage": 25,
                        },
                    },
                    "SavingBasis": {
                        "Amount": 1995.0,
                        "Currency": "INR",
                    },
                    "Availability": {
                        "Type": "NOW",
                        "Message": "In stock",
                    },
                    "MerchantInfo": {
                        "Name": "Cloudtail India",
                    },
                }
            ]
        },
    },
]

# Flipkart Affiliate API 1.0 Search and Product Feed Fixtures
FLIPKART_SEARCH_FIXTURES: List[Dict[str, Any]] = [
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
    }
]
