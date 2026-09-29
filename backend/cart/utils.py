from products.mongo import products_collection


def _resolve_item(item: dict, product: dict) -> dict:
    """Resolves a stored cart line item against the live product/variant so
    price, stock, and availability are always current — never trusted from
    when the item was added."""
    variant = None
    if product and item.get("variant_id"):
        variant = next(
            (v for v in product.get("variants", []) if v["_id"] == item["variant_id"]),
            None,
        )

    unavailable = (
        product is None
        or not product.get("is_active", True)
        or product.get("status") != "published"
        or (item.get("variant_id") and variant is None)
        or (variant is not None and not variant.get("is_active", True))
    )

    base = {
        "id": str(item["_id"]),
        "product_id": str(item["product_id"]),
        "variant_id": str(item["variant_id"]) if item.get("variant_id") else None,
        "quantity": item["quantity"],
    }

    if unavailable:
        return {
            **base,
            "available": False,
            "name": product.get("name") if product else None,
            "material": None,
            "color": None,
            "image_url": None,
            "unit_price": None,
            "subtotal": None,
            "stock_quantity": 0,
        }

    unit_price = variant["price"] if variant else (product.get("discount_price") or product["base_price"])
    is_made_to_order = product.get("is_made_to_order", True)
    stock_quantity = None if is_made_to_order else (variant["stock_quantity"] if variant else product.get("stock_quantity", 0))

    return {
        **base,
        "available": is_made_to_order or (stock_quantity or 0) >= item["quantity"],
        "name": product["name"],
        "material": variant["material"] if variant else product.get("material"),
        "color": variant["color"] if variant else None,
        "image_url": product["images"][0] if product.get("images") else None,
        "unit_price": unit_price,
        "subtotal": round(unit_price * item["quantity"], 2),
        "stock_quantity": stock_quantity,
    }


def serialize_cart(cart_doc: dict) -> dict:
    """Converts a cart document into a JSON-safe dict with every line item
    resolved against current product data, plus computed totals."""
    if cart_doc is None:
        return {"id": None, "items": [], "item_count": 0, "subtotal": 0.0}

    items = cart_doc.get("items", [])
    product_ids = list({item["product_id"] for item in items})
    products = {p["_id"]: p for p in products_collection.find({"_id": {"$in": product_ids}})}

    resolved = [_resolve_item(item, products.get(item["product_id"])) for item in items]
    subtotal = round(sum(r["subtotal"] for r in resolved if r["subtotal"] is not None), 2)
    item_count = sum(r["quantity"] for r in resolved)

    return {
        "id": str(cart_doc["_id"]),
        "items": resolved,
        "item_count": item_count,
        "subtotal": subtotal,
    }
