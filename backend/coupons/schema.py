from bson import ObjectId
from django.utils import timezone
from typing import Dict, Optional

DISCOUNT_TYPES = ["percentage", "fixed"]


class BaseSchema:
    @staticmethod
    def timestamps() -> Dict:
        return {
            "created_at": timezone.now(),
            "updated_at": timezone.now()
        }


class CouponSchema(BaseSchema):
    @staticmethod
    def create_coupon(
        *,
        code: str,
        description: str,
        discount_type: str,
        value: float,
        max_discount_amount: Optional[float] = None,
        min_order_value: float = 0,
        usage_limit: Optional[int] = None,
        usage_limit_per_user: int = 1,
        valid_from,
        valid_until=None,
        created_by: ObjectId = None,
    ) -> Dict:
        return {
            "code": code.strip().upper(),
            "description": description,
            "discount_type": discount_type,  # percentage, fixed
            "value": value,  # percent (0-100) if percentage, or a flat amount if fixed
            "max_discount_amount": max_discount_amount,  # caps a percentage discount's payout
            "min_order_value": min_order_value,
            "usage_limit": usage_limit,  # None = unlimited total redemptions
            "usage_limit_per_user": usage_limit_per_user,
            "used_count": 0,
            "valid_from": valid_from,
            "valid_until": valid_until,  # None = no expiry
            "is_active": True,
            "created_by": created_by,
            **BaseSchema.timestamps()
        }


class CouponRedemptionSchema:
    @staticmethod
    def create_redemption(
        *,
        coupon_id: ObjectId,
        user_id: ObjectId,
        order_id: ObjectId,
        discount_amount: float,
    ) -> Dict:
        return {
            "coupon_id": coupon_id,
            "user_id": user_id,
            "order_id": order_id,
            "discount_amount": discount_amount,
            "redeemed_at": timezone.now(),
        }
