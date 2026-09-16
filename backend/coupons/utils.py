from typing import Optional, Tuple

from bson import ObjectId
from django.utils import timezone

from .mongo import coupons_collection, coupon_redemptions_collection
from .schema import CouponRedemptionSchema


def serialize_coupon(doc: dict) -> dict:
    if doc is None:
        return None

    data = dict(doc)
    data["id"] = str(data.pop("_id"))
    if isinstance(data.get("created_by"), ObjectId):
        data["created_by"] = str(data["created_by"])

    for field in ("created_at", "updated_at", "valid_from", "valid_until"):
        value = data.get(field)
        if hasattr(value, "isoformat"):
            data[field] = value.isoformat()

    return data


def calculate_discount(coupon: dict, subtotal: float) -> float:
    if coupon["discount_type"] == "percentage":
        discount = subtotal * coupon["value"] / 100
        if coupon.get("max_discount_amount"):
            discount = min(discount, coupon["max_discount_amount"])
    else:
        discount = coupon["value"]
    return round(min(discount, subtotal), 2)


def validate_coupon(code: str, user_id: ObjectId, subtotal: float) -> Tuple[Optional[dict], float, Optional[str]]:
    """Read-only check of whether `code` applies to an order of `subtotal` for
    `user_id`. Does not consume a redemption — see reserve_coupon_usage for
    that. Returns (coupon, discount_amount, error_message)."""
    coupon = coupons_collection.find_one({"code": code.strip().upper()})
    if coupon is None or not coupon.get("is_active", True):
        return None, 0.0, "Invalid or inactive coupon code."

    now = timezone.now()
    if coupon.get("valid_from") and now < coupon["valid_from"]:
        return None, 0.0, "This coupon is not active yet."
    if coupon.get("valid_until") and now > coupon["valid_until"]:
        return None, 0.0, "This coupon has expired."

    if subtotal < coupon.get("min_order_value", 0):
        return None, 0.0, f"Minimum order value for this coupon is {coupon['min_order_value']}."

    usage_limit = coupon.get("usage_limit")
    if usage_limit is not None and coupon.get("used_count", 0) >= usage_limit:
        return None, 0.0, "This coupon has reached its usage limit."

    per_user_limit = coupon.get("usage_limit_per_user")
    if per_user_limit:
        used_by_user = coupon_redemptions_collection.count_documents(
            {"coupon_id": coupon["_id"], "user_id": user_id}
        )
        if used_by_user >= per_user_limit:
            return None, 0.0, "You have already used this coupon the maximum number of times."

    discount = calculate_discount(coupon, subtotal)
    if discount <= 0:
        return None, 0.0, "This coupon does not apply to your order."

    return coupon, discount, None


def reserve_coupon_usage(coupon: dict) -> bool:
    """Atomically consumes one use of the coupon's total usage_limit (if any).
    Call right before committing to the coupon in an order — returns False if
    a concurrent request exhausted it between validate_coupon() and this call."""
    query = {"_id": coupon["_id"]}
    usage_limit = coupon.get("usage_limit")
    if usage_limit is not None:
        query["$expr"] = {"$lt": ["$used_count", usage_limit]}

    result = coupons_collection.update_one(query, {"$inc": {"used_count": 1}})
    return result.modified_count == 1


def release_coupon_usage(coupon_id: ObjectId) -> None:
    """Undoes reserve_coupon_usage — used when the order it was reserved for
    fails to complete, or is later cancelled."""
    coupons_collection.update_one({"_id": coupon_id}, {"$inc": {"used_count": -1}})


def record_redemption(coupon_id: ObjectId, user_id: ObjectId, order_id: ObjectId, discount_amount: float) -> None:
    redemption = CouponRedemptionSchema.create_redemption(
        coupon_id=coupon_id, user_id=user_id, order_id=order_id, discount_amount=discount_amount
    )
    coupon_redemptions_collection.insert_one(redemption)
