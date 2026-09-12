from bson import ObjectId


def serialize_product(doc: dict) -> dict:
    """Converts a MongoDB product document into a JSON-safe dict."""
    if doc is None:
        return None

    data = dict(doc)
    data["id"] = str(data.pop("_id"))

    if isinstance(data.get("created_by"), ObjectId):
        data["created_by"] = str(data["created_by"])

    for variant in data.get("variants", []):
        if isinstance(variant.get("_id"), ObjectId):
            variant["id"] = str(variant.pop("_id"))

    for field in ("created_at", "updated_at"):
        value = data.get(field)
        if hasattr(value, "isoformat"):
            data[field] = value.isoformat()

    return data
