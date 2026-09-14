from bson import ObjectId
from django.utils import timezone
from typing import Dict


class BaseSchema:
    @staticmethod
    def timestamps() -> Dict:
        return {
            "created_at": timezone.now(),
            "updated_at": timezone.now()
        }


class ReviewSchema(BaseSchema):
    @staticmethod
    def create_review(
        *,
        product_id: ObjectId,
        user_id: ObjectId,
        user_name: str,
        rating: int,
        comment: str,
        is_verified_purchase: bool = False,
    ) -> Dict:
        return {
            "product_id": product_id,
            "user_id": user_id,
            "user_name": user_name,  # Snapshot — survives the user later renaming/deleting their account
            "rating": rating,  # 1-5
            "comment": comment,
            "is_verified_purchase": is_verified_purchase,
            **BaseSchema.timestamps()
        }
