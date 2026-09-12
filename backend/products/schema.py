from bson import ObjectId
from django.utils import timezone
from typing import Dict, List, Optional


class BaseSchema:
    @staticmethod
    def timestamps() -> Dict:
        return {
            "created_at": timezone.now(),
            "updated_at": timezone.now()
        }


class DimensionsSchema(BaseSchema):
    @staticmethod
    def create_dimensions(
        *,
        length_mm: float,
        width_mm: float,
        height_mm: float,
    ) -> Dict:
        return {
            "length_mm": length_mm,
            "width_mm": width_mm,
            "height_mm": height_mm,
        }


class VariantSchema(BaseSchema):
    @staticmethod
    def create_variant(
        *,
        material: str,
        color: str,
        price: float,
        stock_quantity: int = 0,
        sku: str = None,
    ) -> Dict:
        return {
            "_id": ObjectId(),
            "material": material,  # PLA, ABS, PETG, Resin, Nylon, TPU, etc.
            "color": color,
            "price": price,
            "stock_quantity": stock_quantity,
            "sku": sku,
            "is_active": True,
        }


class ProductSchema(BaseSchema):
    @staticmethod
    def create_product(
        *,
        name: str,
        description: str,
        category: str,
        base_price: float,
        print_technology: str = "FDM",  # FDM, SLA, SLS
        material: str = None,  # Default/primary material (PLA, ABS, PETG, Resin, Nylon, TPU, etc.)
        created_by: ObjectId = None,
    ) -> Dict:
        return {
            "name": name,
            "description": description,
            "category": category,  # e.g. Miniatures, Home Decor, Cosplay Props, Functional Parts, Gifts
            "tags": [],  # Array of search/filter tags

            # Media
            "images": [],  # Array of image URLs; first is treated as primary

            # 3D printing specifics
            "print_technology": print_technology,  # FDM, SLA, SLS
            "material": material,
            "available_colors": [],  # Array of color names/hex codes
            "dimensions": None,  # DimensionsSchema.create_dimensions() dict
            "weight_grams": None,
            "scale": None,  # e.g. "1:10" for miniatures
            "is_made_to_order": True,  # True = printed after order, False = ships from stock

            # Commerce (used when the product has no variants)
            "base_price": base_price,
            "discount_price": None,
            "currency": "INR",
            "sku": None,
            "stock_quantity": 0,

            # Variants (array of VariantSchema.create_variant() dicts)
            "variants": [],

            # Aggregated / derived (maintained by other apps, not product CRUD)
            "rating_avg": 0.0,
            "rating_count": 0,
            "total_sold": 0,

            # Meta
            "status": "draft",  # draft, published, archived
            "is_active": True,
            "created_by": created_by,  # ObjectId referencing the admin user who created it

            **BaseSchema.timestamps()
        }
