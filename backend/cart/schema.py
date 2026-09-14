from bson import ObjectId
from django.utils import timezone
from typing import Dict, Optional


class BaseSchema:
    @staticmethod
    def timestamps() -> Dict:
        return {
            "created_at": timezone.now(),
            "updated_at": timezone.now()
        }


class CartItemSchema:
    @staticmethod
    def create_item(
        *,
        product_id: ObjectId,
        quantity: int,
        variant_id: Optional[ObjectId] = None,
    ) -> Dict:
        return {
            "_id": ObjectId(),
            "product_id": product_id,
            "variant_id": variant_id,
            "quantity": quantity,
            "added_at": timezone.now(),
        }


class CartSchema(BaseSchema):
    @staticmethod
    def create_cart(*, user_id: ObjectId) -> Dict:
        return {
            "user_id": user_id,
            "items": [],  # Array of CartItemSchema.create_item() dicts
            **BaseSchema.timestamps()
        }
