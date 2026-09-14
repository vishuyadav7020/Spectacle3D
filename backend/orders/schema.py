from bson import ObjectId
from django.utils import timezone
from typing import Dict, List, Optional

ORDER_STATUSES = ["pending", "confirmed", "printing", "shipped", "delivered", "cancelled"]
PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded"]


class BaseSchema:
    @staticmethod
    def timestamps() -> Dict:
        return {
            "created_at": timezone.now(),
            "updated_at": timezone.now()
        }


class OrderItemSchema:
    @staticmethod
    def create_item(
        *,
        product_id: ObjectId,
        name: str,
        material: str,
        image_url: Optional[str],
        unit_price: float,
        quantity: int,
        variant_id: Optional[ObjectId] = None,
        color: Optional[str] = None,
    ) -> Dict:
        return {
            "product_id": product_id,
            "variant_id": variant_id,
            "name": name,  # Snapshot at order time — product may change/be deleted later
            "material": material,
            "color": color,
            "image_url": image_url,
            "unit_price": unit_price,
            "quantity": quantity,
            "subtotal": round(unit_price * quantity, 2),
        }


class ShippingAddressSchema:
    @staticmethod
    def create_address(
        *,
        first_name: str,
        last_name: str,
        street: str,
        city: str,
        state: str,
        zip_code: str,
        country: str,
        apt: str = None,
    ) -> Dict:
        return {
            "first_name": first_name,
            "last_name": last_name,
            "street": street,
            "apt": apt,
            "city": city,
            "state": state,
            "zip": zip_code,
            "country": country,
        }


class OrderSchema(BaseSchema):
    @staticmethod
    def create_order(
        *,
        user_id: ObjectId,
        items: List[Dict],
        shipping_address: Dict,
        shipping_method: str,
        subtotal: float,
        shipping_cost: float,
        tax: float,
        total: float,
        card_last4: str = "0000",
    ) -> Dict:
        return {
            "order_number": None,  # Set after insert, from the generated _id — see utils.set_order_number
            "user_id": user_id,
            "items": items,  # Array of OrderItemSchema.create_item() dicts

            "shipping_address": shipping_address,
            "shipping_method": shipping_method,  # standard, express

            "subtotal": subtotal,
            "shipping_cost": shipping_cost,
            "tax": tax,
            "total": total,

            # Payment — no real gateway integrated; this is a mock checkout.
            "payment_method": "card",
            "card_last4": card_last4,
            "payment_status": "paid",  # pending, paid, failed, refunded

            "status": "pending",  # pending, confirmed, printing, shipped, delivered, cancelled

            **BaseSchema.timestamps()
        }
