from bson import ObjectId


def make_order_number(order_id: ObjectId) -> str:
    """Derives a human-readable order number from the Mongo _id — guaranteed
    unique since the _id already is, no separate counter needed."""
    return f"SPD-{str(order_id)[-6:].upper()}"


def serialize_order(doc: dict) -> dict:
    if doc is None:
        return None

    data = dict(doc)
    data["id"] = str(data.pop("_id"))
    data["user_id"] = str(data["user_id"])

    items = []
    for item in data.get("items", []):
        item = dict(item)
        item["product_id"] = str(item["product_id"])
        if item.get("variant_id"):
            item["variant_id"] = str(item["variant_id"])
        items.append(item)
    data["items"] = items

    for field in ("created_at", "updated_at"):
        value = data.get(field)
        if hasattr(value, "isoformat"):
            data[field] = value.isoformat()

    return data
