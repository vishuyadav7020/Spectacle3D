from bson import ObjectId
from bson.errors import InvalidId

from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from common.permissions import IsAdmin
from coupons.utils import validate_coupon, reserve_coupon_usage, release_coupon_usage, record_redemption
from products.mongo import products_collection
from users.mongo import users_collection
from .mongo import orders_collection
from .schema import OrderSchema, OrderItemSchema, ShippingAddressSchema
from .utils import serialize_order, make_order_number
from .serializers import OrderCreateSerializer, OrderStatusUpdateSerializer

DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100

SHIPPING_RATES = {"standard": 5.0, "express": 14.0}
TAX_RATE = 0.08


def _object_id(value):
    try:
        return ObjectId(value)
    except (InvalidId, TypeError):
        return None


def _paginate_params(request):
    try:
        page = max(int(request.query_params.get("page", 1)), 1)
    except ValueError:
        return None, None, "page must be an integer."
    try:
        page_size = min(
            max(int(request.query_params.get("page_size", DEFAULT_PAGE_SIZE)), 1),
            MAX_PAGE_SIZE,
        )
    except ValueError:
        return None, None, "page_size must be an integer."
    return page, page_size, None


def _rollback_stock(decremented):
    """Restores stock/total_sold for items already decremented earlier in a
    request that then failed a later step (insufficient stock on another
    item, or a coupon race)."""
    for prod_oid, var_oid, qty in decremented:
        if var_oid:
            products_collection.update_one(
                {"_id": prod_oid, "variants._id": var_oid},
                {"$inc": {"variants.$.stock_quantity": qty, "total_sold": -qty}},
            )
        else:
            products_collection.update_one(
                {"_id": prod_oid},
                {"$inc": {"stock_quantity": qty, "total_sold": -qty}},
            )


@method_decorator(csrf_exempt, name='dispatch')
class OrderListCreateView(APIView):
    """Authenticated: list your own orders, or place a new one."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        page, page_size, error = _paginate_params(request)
        if error:
            return Response({"error": error}, status=status.HTTP_400_BAD_REQUEST)

        query = {"user_id": ObjectId(request.user.id)}
        total = orders_collection.count_documents(query)
        cursor = (
            orders_collection.find(query)
            .sort("created_at", -1)
            .skip((page - 1) * page_size)
            .limit(page_size)
        )
        orders = [serialize_order(o) for o in cursor]

        return Response(
            {"count": total, "page": page, "page_size": page_size, "results": orders},
            status=status.HTTP_200_OK
        )

    def post(self, request):
        serializer = OrderCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # --- Resolve each line item against the real product, server-side.
        # Never trust client-sent prices/names — snapshot them from the DB. ---
        resolved_items = []
        for line in data["items"]:
            product_oid = _object_id(line["product_id"])
            if product_oid is None:
                return Response({"error": f"Invalid product id: {line['product_id']}"}, status=status.HTTP_400_BAD_REQUEST)

            product = products_collection.find_one({"_id": product_oid})
            if product is None or not product.get("is_active", True):
                return Response({"error": "One or more products are no longer available."}, status=status.HTTP_400_BAD_REQUEST)

            variant = None
            variant_oid = None
            if line.get("variant_id"):
                variant_oid = _object_id(line["variant_id"])
                variant = next((v for v in product.get("variants", []) if v["_id"] == variant_oid and v.get("is_active")), None)
                if variant is None:
                    return Response({"error": f"Variant not found for product '{product['name']}'."}, status=status.HTTP_400_BAD_REQUEST)

            unit_price = variant["price"] if variant else (product.get("discount_price") or product["base_price"])
            material = variant["material"] if variant else (product.get("material") or product["print_technology"])
            color = variant["color"] if variant else None

            resolved_items.append({
                "product": product,
                "product_oid": product_oid,
                "variant_oid": variant_oid,
                "quantity": line["quantity"],
                "unit_price": unit_price,
                "material": material,
                "color": color,
            })

        subtotal = round(sum(item["unit_price"] * item["quantity"] for item in resolved_items), 2)

        # --- Validate the coupon (if any) before touching stock — cheap to
        # reject here, since nothing has been mutated yet. ---
        coupon = None
        discount_amount = 0.0
        coupon_code = data.get("coupon_code")
        if coupon_code:
            coupon, discount_amount, error = validate_coupon(coupon_code, ObjectId(request.user.id), subtotal)
            if error:
                return Response({"error": error}, status=status.HTTP_400_BAD_REQUEST)

        # --- Decrement stock atomically per item; roll back on first failure. ---
        decremented = []  # (product_oid, variant_oid, quantity) already applied — for rollback
        for item in resolved_items:
            product = item["product"]
            if product.get("is_made_to_order", True):
                continue  # No fixed stock to track for made-to-order items.

            if item["variant_oid"]:
                result = products_collection.update_one(
                    {
                        "_id": item["product_oid"],
                        "variants._id": item["variant_oid"],
                        "variants.stock_quantity": {"$gte": item["quantity"]},
                    },
                    {"$inc": {"variants.$.stock_quantity": -item["quantity"], "total_sold": item["quantity"]}},
                )
            else:
                result = products_collection.update_one(
                    {"_id": item["product_oid"], "stock_quantity": {"$gte": item["quantity"]}},
                    {"$inc": {"stock_quantity": -item["quantity"], "total_sold": item["quantity"]}},
                )

            if result.modified_count == 0:
                # Insufficient stock — undo everything decremented so far this request.
                _rollback_stock(decremented)
                return Response(
                    {"error": f"Not enough stock for '{product['name']}'."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            decremented.append((item["product_oid"], item["variant_oid"], item["quantity"]))

        # --- Reserve the coupon's usage now that we're committed to the order.
        # A concurrent request may have exhausted it between validation and
        # here — if so, undo the stock we just decremented. ---
        if coupon and not reserve_coupon_usage(coupon):
            _rollback_stock(decremented)
            return Response(
                {"error": "This coupon was just used up. Please try again without it."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # --- Build order items + totals server-side. ---
        order_items = [
            OrderItemSchema.create_item(
                product_id=item["product_oid"],
                variant_id=item["variant_oid"],
                name=item["product"]["name"],
                material=item["material"],
                color=item["color"],
                image_url=(item["product"]["images"][0] if item["product"].get("images") else None),
                unit_price=item["unit_price"],
                quantity=item["quantity"],
            )
            for item in resolved_items
        ]

        shipping_cost = SHIPPING_RATES[data["shipping_method"]]
        taxable_subtotal = subtotal - discount_amount
        tax = round(taxable_subtotal * TAX_RATE, 2)
        total = round(taxable_subtotal + shipping_cost + tax, 2)

        addr = data["shipping_address"]
        shipping_address = ShippingAddressSchema.create_address(
            first_name=addr["first_name"],
            last_name=addr["last_name"],
            street=addr["street"],
            apt=addr.get("apt"),
            city=addr["city"],
            state=addr["state"],
            zip_code=addr["zip_code"],
            country=addr["country"],
        )

        order_doc = OrderSchema.create_order(
            user_id=ObjectId(request.user.id),
            items=order_items,
            shipping_address=shipping_address,
            shipping_method=data["shipping_method"],
            subtotal=subtotal,
            shipping_cost=shipping_cost,
            tax=tax,
            total=total,
            card_last4=data.get("card_last4", "0000"),
            coupon_id=coupon["_id"] if coupon else None,
            coupon_code=coupon["code"] if coupon else None,
            discount_amount=discount_amount,
        )

        result = orders_collection.insert_one(order_doc)
        order_doc["_id"] = result.inserted_id
        order_number = make_order_number(result.inserted_id)
        orders_collection.update_one({"_id": result.inserted_id}, {"$set": {"order_number": order_number}})
        order_doc["order_number"] = order_number

        if coupon:
            record_redemption(coupon["_id"], ObjectId(request.user.id), result.inserted_id, discount_amount)

        users_collection.update_one(
            {"_id": ObjectId(request.user.id)},
            {"$inc": {"total_orders": 1, "total_spent": total}}
        )

        return Response(serialize_order(order_doc), status=status.HTTP_201_CREATED)


@method_decorator(csrf_exempt, name='dispatch')
class OrderDetailView(APIView):
    """View a single order — the owner, or an admin."""

    permission_classes = [IsAuthenticated]

    def get(self, request, order_id):
        order_oid = _object_id(order_id)
        if order_oid is None:
            return Response({"error": "Invalid order id."}, status=status.HTTP_400_BAD_REQUEST)

        order = orders_collection.find_one({"_id": order_oid})
        if order is None:
            return Response({"error": "Order not found."}, status=status.HTTP_404_NOT_FOUND)

        is_owner = str(order["user_id"]) == str(request.user.id)
        is_admin = getattr(request.user, "role", None) == "admin"
        if not is_owner and not is_admin:
            return Response({"error": "Order not found."}, status=status.HTTP_404_NOT_FOUND)

        return Response(serialize_order(order), status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name='dispatch')
class AdminOrderListView(APIView):
    """Admin-only: list/search all orders."""

    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        page, page_size, error = _paginate_params(request)
        if error:
            return Response({"error": error}, status=status.HTTP_400_BAD_REQUEST)

        query = {}
        status_param = request.query_params.get("status")
        if status_param:
            query["status"] = status_param

        total = orders_collection.count_documents(query)
        cursor = (
            orders_collection.find(query)
            .sort("created_at", -1)
            .skip((page - 1) * page_size)
            .limit(page_size)
        )
        orders = [serialize_order(o) for o in cursor]

        return Response(
            {"count": total, "page": page, "page_size": page_size, "results": orders},
            status=status.HTTP_200_OK
        )


@method_decorator(csrf_exempt, name='dispatch')
class AdminOrderDetailView(APIView):
    """Admin-only: update an order's fulfillment status. Cancelling restores
    any stock that was decremented for non-made-to-order items, and frees up
    the coupon usage (if any) the order had consumed."""

    permission_classes = [IsAuthenticated, IsAdmin]

    def patch(self, request, order_id):
        order_oid = _object_id(order_id)
        if order_oid is None:
            return Response({"error": "Invalid order id."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = OrderStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        new_status = serializer.validated_data["status"]

        order = orders_collection.find_one({"_id": order_oid})
        if order is None:
            return Response({"error": "Order not found."}, status=status.HTTP_404_NOT_FOUND)

        if new_status == "cancelled" and order["status"] != "cancelled":
            for item in order["items"]:
                product = products_collection.find_one({"_id": item["product_id"]})
                if product and not product.get("is_made_to_order", True):
                    if item.get("variant_id"):
                        products_collection.update_one(
                            {"_id": item["product_id"], "variants._id": item["variant_id"]},
                            {"$inc": {"variants.$.stock_quantity": item["quantity"], "total_sold": -item["quantity"]}},
                        )
                    else:
                        products_collection.update_one(
                            {"_id": item["product_id"]},
                            {"$inc": {"stock_quantity": item["quantity"], "total_sold": -item["quantity"]}},
                        )

            if order.get("coupon_id"):
                release_coupon_usage(order["coupon_id"])

        orders_collection.update_one(
            {"_id": order_oid},
            {"$set": {"status": new_status, "updated_at": timezone.now()}}
        )

        updated = orders_collection.find_one({"_id": order_oid})
        return Response(serialize_order(updated), status=status.HTTP_200_OK)
