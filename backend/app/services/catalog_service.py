from typing import Optional, List, Tuple
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from app.models.product import Product
from app.models.inventory import Inventory


class CatalogService:
    @staticmethod
    def get_product_by_id(db: Session, product_id: str) -> Optional[Product]:
        """Retrieve a product by its unique internal ID with inventory preloaded."""
        return (
            db.query(Product)
            .options(joinedload(Product.inventory))
            .filter(Product.id == product_id, Product.is_active == True)
            .first()
        )

    @staticmethod
    def get_product_by_sku(db: Session, sku: str) -> Optional[Product]:
        """Retrieve a product by its unique SKU with inventory preloaded."""
        return (
            db.query(Product)
            .options(joinedload(Product.inventory))
            .filter(Product.sku == sku, Product.is_active == True)
            .first()
        )

    @staticmethod
    def list_products(
        db: Session,
        category: Optional[str] = None,
        brand: Optional[str] = None,
        min_price_paise: Optional[int] = None,
        max_price_paise: Optional[int] = None,
        in_stock_only: bool = False,
        limit: int = 20,
        offset: int = 0,
    ) -> Tuple[List[Product], int]:
        """List active products with deterministic filtering and pagination."""
        query = db.query(Product).options(joinedload(Product.inventory)).filter(Product.is_active == True)

        if category:
            query = query.filter(Product.category.ilike(category))

        if brand:
            query = query.filter(Product.brand.ilike(brand))

        if min_price_paise is not None:
            query = query.filter(Product.price_paise >= min_price_paise)

        if max_price_paise is not None:
            query = query.filter(Product.price_paise <= max_price_paise)

        if in_stock_only:
            query = query.join(Product.inventory).filter(Inventory.available_quantity > 0)

        total = query.count()
        # Bound limits safely
        safe_limit = max(1, min(limit, 100))
        safe_offset = max(0, offset)

        products = query.order_by(Product.price_paise.asc()).offset(safe_offset).limit(safe_limit).all()
        return products, total

    @staticmethod
    def search_products(
        db: Session,
        query_text: str,
        limit: int = 20,
        offset: int = 0,
    ) -> Tuple[List[Product], int]:
        """Deterministic keyword search across product name, brand, category, description, and SKU."""
        term = f"%{query_text.strip()}%"
        query = (
            db.query(Product)
            .options(joinedload(Product.inventory))
            .filter(
                Product.is_active == True,
                or_(
                    Product.name.ilike(term),
                    Product.brand.ilike(term),
                    Product.category.ilike(term),
                    Product.description.ilike(term),
                    Product.sku.ilike(term),
                ),
            )
        )

        total = query.count()
        safe_limit = max(1, min(limit, 100))
        safe_offset = max(0, offset)

        products = query.order_by(Product.price_paise.asc()).offset(safe_offset).limit(safe_limit).all()
        return products, total

    @staticmethod
    def get_inventory(db: Session, product_id: str) -> Optional[Inventory]:
        """Retrieve real-time inventory state for a product."""
        return db.query(Inventory).filter(Inventory.product_id == product_id).first()
