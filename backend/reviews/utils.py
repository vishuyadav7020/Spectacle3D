from bson import ObjectId

from .mongo import reviews_collection
from products.mongo import products_collection


def serialize_review(doc: dict) -> dict:
    if doc is None:
        return None

    data = dict(doc)
    data["id"] = str(data.pop("_id"))
    data["product_id"] = str(data["product_id"])
    data["user_id"] = str(data["user_id"])

    for field in ("created_at", "updated_at"):
        value = data.get(field)
        if hasattr(value, "isoformat"):
            data[field] = value.isoformat()

    return data


def recalculate_product_rating(product_id: ObjectId) -> None:
    """Recomputes rating_avg/rating_count on the product from its current
    reviews. Called after any review create/update/delete."""
    pipeline = [
        {"$match": {"product_id": product_id}},
        {"$group": {"_id": None, "avg": {"$avg": "$rating"}, "count": {"$sum": 1}}},
    ]
    result = list(reviews_collection.aggregate(pipeline))
    avg = round(result[0]["avg"], 2) if result else 0.0
    count = result[0]["count"] if result else 0

    products_collection.update_one(
        {"_id": product_id},
        {"$set": {"rating_avg": avg, "rating_count": count}}
    )
