from bson import ObjectId
from bson.errors import InvalidId

from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from products.mongo import products_collection
from .schema import CartSchema, CartItemSchema
from .mongo import carts_collection
from .utils import serialize_cart
from .serializers import CartItemAddSerializer, CartItemUpdateSerializer


def _object_id(value):
    try:
        return ObjectId(value)
    except (InvalidId, TypeError):
        return None


def _get_or_create_cart(user_id: ObjectId) -> dict:
    cart = carts_collection.find_one({"user_id": user_id})
    if cart is None:
        cart_doc = CartSchema.create_cart(user_id=user_id)
        result = carts_collection.insert_one(cart_doc)
        cart_doc["_id"] = result.inserted_id
        cart = cart_doc
    return cart


@method_decorator(csrf_exempt, name='dispatch')
class CartView(APIView):
    """View or clear the authenticated user's cart."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        cart = carts_collection.find_one({"user_id": ObjectId(request.user.id)})
        return Response(serialize_cart(cart), status=status.HTTP_200_OK)

    def delete(self, request):
        carts_collection.update_one(
            {"user_id": ObjectId(request.user.id)},
            {"$set": {"items": [], "updated_at": timezone.now()}},
            upsert=True,
        )
        return Response({"message": "Cart cleared."}, status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name='dispatch')
class CartItemListCreateView(APIView):
    """Add a product (optionally a specific variant) to the cart. If the same
    product/variant is already present, its quantity is increased instead of
    creating a duplicate line."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CartItemAddSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        product_oid = _object_id(data["product_id"])
        if product_oid is None:
            return Response({"error": "Invalid product id."}, status=status.HTTP_400_BAD_REQUEST)

        product = products_collection.find_one({"_id": product_oid})
        if product is None or not product.get("is_active", True) or product.get("status") != "published":
            return Response({"error": "Product not found."}, status=status.HTTP_404_NOT_FOUND)

        variant_oid = None
        if data.get("variant_id"):
            variant_oid = _object_id(data["variant_id"])
            variant = next(
                (v for v in product.get("variants", []) if v["_id"] == variant_oid and v.get("is_active")),
                None,
            )
            if variant is None:
                return Response({"error": "Variant not found."}, status=status.HTTP_400_BAD_REQUEST)

        user_id = ObjectId(request.user.id)
        cart = _get_or_create_cart(user_id)

        existing = next(
            (i for i in cart["items"] if i["product_id"] == product_oid and i.get("variant_id") == variant_oid),
            None,
        )

        if existing:
            carts_collection.update_one(
                {"_id": cart["_id"], "items._id": existing["_id"]},
                {
                    "$inc": {"items.$.quantity": data["quantity"]},
                    "$set": {"updated_at": timezone.now()},
                }
            )
        else:
            item = CartItemSchema.create_item(
                product_id=product_oid, variant_id=variant_oid, quantity=data["quantity"]
            )
            carts_collection.update_one(
                {"_id": cart["_id"]},
                {"$push": {"items": item}, "$set": {"updated_at": timezone.now()}}
            )

        cart = carts_collection.find_one({"_id": cart["_id"]})
        return Response(serialize_cart(cart), status=status.HTTP_201_CREATED)


@method_decorator(csrf_exempt, name='dispatch')
class CartItemDetailView(APIView):
    """Update the quantity of, or remove, a single cart line item."""

    permission_classes = [IsAuthenticated]

    def patch(self, request, item_id):
        item_oid = _object_id(item_id)
        if item_oid is None:
            return Response({"error": "Invalid item id."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = CartItemUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user_id = ObjectId(request.user.id)
        result = carts_collection.update_one(
            {"user_id": user_id, "items._id": item_oid},
            {
                "$set": {
                    "items.$.quantity": serializer.validated_data["quantity"],
                    "updated_at": timezone.now(),
                }
            }
        )
        if result.matched_count == 0:
            return Response({"error": "Cart item not found."}, status=status.HTTP_404_NOT_FOUND)

        cart = carts_collection.find_one({"user_id": user_id})
        return Response(serialize_cart(cart), status=status.HTTP_200_OK)

    def delete(self, request, item_id):
        item_oid = _object_id(item_id)
        if item_oid is None:
            return Response({"error": "Invalid item id."}, status=status.HTTP_400_BAD_REQUEST)

        user_id = ObjectId(request.user.id)

        existing = carts_collection.find_one(
            {"user_id": user_id, "items._id": item_oid},
            {"_id": 1}
        )
        if not existing:
            return Response({"error": "Cart item not found."}, status=status.HTTP_404_NOT_FOUND)

        carts_collection.update_one(
            {"user_id": user_id},
            {
                "$pull": {"items": {"_id": item_oid}},
                "$set": {"updated_at": timezone.now()},
            }
        )

        cart = carts_collection.find_one({"user_id": user_id})
        return Response(serialize_cart(cart), status=status.HTTP_200_OK)
