import json
import os
import sys

# Ensure app package is importable
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db.base import Base
from app.db.session import engine, SessionLocal
from app.models.product import Product
from app.models.inventory import Inventory


def seed_database():
    print(f"Connecting to database via engine: {engine.url.render_as_string(hide_password=True)}")

    # Ensure tables exist
    Base.metadata.create_all(bind=engine)
    print("Database schema verified (products and inventory tables ready).")

    # Locate synthetic catalog data
    catalog_path = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "..", "data", "synthetic_catalog.json")
    )
    if not os.path.exists(catalog_path):
        raise FileNotFoundError(f"Catalog file not found at {catalog_path}")

    with open(catalog_path, "r", encoding="utf-8") as f:
        products_data = json.load(f)

    db = SessionLocal()
    try:
        inserted_count = 0
        updated_count = 0

        for item in products_data:
            existing_product = db.query(Product).filter(Product.id == item["id"]).first()

            if existing_product:
                # Update existing fields
                existing_product.sku = item["sku"]
                existing_product.name = item["name"]
                existing_product.description = item["description"]
                existing_product.category = item["category"]
                existing_product.brand = item["brand"]
                existing_product.price_paise = item["price_paise"]
                existing_product.currency = item.get("currency", "INR")
                existing_product.specs = item.get("specs", {})
                existing_product.image_url = item.get("image_url")
                existing_product.is_active = True

                # Update or create inventory
                if existing_product.inventory:
                    existing_product.inventory.available_quantity = item.get("available_quantity", 10)
                    existing_product.inventory.reserved_quantity = item.get("reserved_quantity", 0)
                    existing_product.inventory.low_stock_threshold = item.get("low_stock_threshold", 5)
                else:
                    inv = Inventory(
                        product_id=existing_product.id,
                        available_quantity=item.get("available_quantity", 10),
                        reserved_quantity=item.get("reserved_quantity", 0),
                        low_stock_threshold=item.get("low_stock_threshold", 5),
                    )
                    db.add(inv)
                updated_count += 1
            else:
                # Insert new product
                new_product = Product(
                    id=item["id"],
                    sku=item["sku"],
                    name=item["name"],
                    description=item["description"],
                    category=item["category"],
                    brand=item["brand"],
                    price_paise=item["price_paise"],
                    currency=item.get("currency", "INR"),
                    specs=item.get("specs", {}),
                    image_url=item.get("image_url"),
                    is_active=True,
                )
                db.add(new_product)
                db.flush()

                new_inv = Inventory(
                    product_id=new_product.id,
                    available_quantity=item.get("available_quantity", 10),
                    reserved_quantity=item.get("reserved_quantity", 0),
                    low_stock_threshold=item.get("low_stock_threshold", 5),
                )
                db.add(new_inv)
                inserted_count += 1

        db.commit()
        print(f"Catalog seeding complete:")
        print(f"  - Products inserted: {inserted_count}")
        print(f"  - Products updated:  {updated_count}")
        print(f"  - Total in database: {db.query(Product).count()}")
    except Exception as e:
        db.rollback()
        print(f"Error during catalog seeding: {e}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
