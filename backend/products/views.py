from bson import ObjectId
from bson.errors import InvalidId

from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status

from common.permissions import IsAdmin
from .schema import ProductSchema, VariantSchema, DimensionsSchema
from .mongo import products_collection
from .utils import serialize_product
from .serializers import (
    ProductCreateSerializer,
    ProductUpdateSerializer,
    VariantSerializer,
    VariantUpdateSerializer,
)

DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100


def _object_id(value):
    try:
        return ObjectId(value)
    except (InvalidId, TypeError):
        return None


def _is_admin(request):
    user = request.user
    return bool(user and user.is_authenticated and getattr(user, "role", None) == "admin")


@method_decorator(csrf_exempt, name='dispatch')
class ProductListCreateView(APIView):
    """Public browsing/search for published products; admin-only creation."""

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated(), IsAdmin()]
        return [AllowAny()]

    def get(self, request):
        query = {}
        is_admin = _is_admin(request)

        if not is_admin:
            query["status"] = "published"
            query["is_active"] = True
        else:
            status_param = request.query_params.get("status")
            if status_param:
                query["status"] = status_param

        category = request.query_params.get("category")
        if category:
            query["category"] = category

        material = request.query_params.get("material")
        if material:
            query["material"] = material

        search = request.query_params.get("search")
        if search:
            query["$or"] = [
                {"name": {"$regex": search, "$options": "i"}},
                {"description": {"$regex": search, "$options": "i"}},
                {"tags": {"$regex": search, "$options": "i"}},
            ]

        price_filter = {}
        min_price = request.query_params.get("min_price")
        max_price = request.query_params.get("max_price")
        if min_price is not None:
            try:
                price_filter["$gte"] = float(min_price)
            except ValueError:
                return Response({"error": "min_price must be a number."}, status=status.HTTP_400_BAD_REQUEST)
        if max_price is not None:
            try:
                price_filter["$lte"] = float(max_price)
            except ValueError:
                return Response({"error": "max_price must be a number."}, status=status.HTTP_400_BAD_REQUEST)
        if price_filter:
            query["base_price"] = price_filter

        try:
            page = max(int(request.query_params.get("page", 1)), 1)
        except ValueError:
            return Response({"error": "page must be an integer."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            page_size = min(max(int(request.query_params.get("page_size", DEFAULT_PAGE_SIZE)), 1), MAX_PAGE_SIZE)
        except ValueError:
            return Response({"error": "page_size must be an integer."}, status=status.HTTP_400_BAD_REQUEST)

        total = products_collection.count_documents(query)
        cursor = (
            products_collection.find(query)
            .sort("created_at", -1)
            .skip((page - 1) * page_size)
            .limit(page_size)
        )
        products = [serialize_product(doc) for doc in cursor]

        return Response(
            {
                "count": total,
                "page": page,
                "page_size": page_size,
                "results": products,
            },
            status=status.HTTP_200_OK
        )

    def post(self, request):
        serializer = ProductCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = dict(serializer.validated_data)

        dimensions = data.pop("dimensions", None)

        product_doc = ProductSchema.create_product(
            name=data.pop("name"),
            description=data.pop("description"),
            category=data.pop("category"),
            base_price=data.pop("base_price"),
            print_technology=data.pop("print_technology", "FDM"),
            material=data.pop("material", None),
            created_by=ObjectId(request.user.id),
        )

        if dimensions:
            product_doc["dimensions"] = DimensionsSchema.create_dimensions(**dimensions)

        # Remaining optional fields (tags, images, pricing, stock, status, ...)
        # overwrite the schema's defaults where the client provided them.
        product_doc.update(data)

        result = products_collection.insert_one(product_doc)
        product_doc["_id"] = result.inserted_id

        return Response(serialize_product(product_doc), status=status.HTTP_201_CREATED)


@method_decorator(csrf_exempt, name='dispatch')
class ProductDetailView(APIView):
    """Public product detail (published only); admin-only update/delete."""

    def get_permissions(self):
        if self.request.method in ("PATCH", "DELETE"):
            return [IsAuthenticated(), IsAdmin()]
        return [AllowAny()]

    def get(self, request, product_id):
        product_oid = _object_id(product_id)
        if product_oid is None:
            return Response({"error": "Invalid product id."}, status=status.HTTP_400_BAD_REQUEST)

        product = products_collection.find_one({"_id": product_oid})
        if product is None:
            return Response({"error": "Product not found."}, status=status.HTTP_404_NOT_FOUND)

        if not _is_admin(request) and (product.get("status") != "published" or not product.get("is_active", True)):
            return Response({"error": "Product not found."}, status=status.HTTP_404_NOT_FOUND)

        return Response(serialize_product(product), status=status.HTTP_200_OK)

    def patch(self, request, product_id):
        product_oid = _object_id(product_id)
        if product_oid is None:
            return Response({"error": "Invalid product id."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = ProductUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updates = dict(serializer.validated_data)

        if not updates:
            return Response({"error": "No fields provided to update."}, status=status.HTTP_400_BAD_REQUEST)

        if "dimensions" in updates:
            dimensions = updates.pop("dimensions")
            updates["dimensions"] = DimensionsSchema.create_dimensions(**dimensions) if dimensions else None

        updates["updated_at"] = timezone.now()

        result = products_collection.update_one({"_id": product_oid}, {"$set": updates})
        if result.matched_count == 0:
            return Response({"error": "Product not found."}, status=status.HTTP_404_NOT_FOUND)

        product = products_collection.find_one({"_id": product_oid})
        return Response(serialize_product(product), status=status.HTTP_200_OK)

    def delete(self, request, product_id):
        product_oid = _object_id(product_id)
        if product_oid is None:
            return Response({"error": "Invalid product id."}, status=status.HTTP_400_BAD_REQUEST)

        result = products_collection.delete_one({"_id": product_oid})
        if result.deleted_count == 0:
            return Response({"error": "Product not found."}, status=status.HTTP_404_NOT_FOUND)

        return Response({"message": "Product deleted successfully."}, status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name='dispatch')
class ProductVariantListCreateView(APIView):
    """Admin-only: add a material/color variant to a product."""

    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, product_id):
        product_oid = _object_id(product_id)
        if product_oid is None:
            return Response({"error": "Invalid product id."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = VariantSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        variant = VariantSchema.create_variant(**serializer.validated_data)

        result = products_collection.update_one(
            {"_id": product_oid},
            {
                "$push": {"variants": variant},
                "$set": {"updated_at": timezone.now()},
            }
        )
        if result.matched_count == 0:
            return Response({"error": "Product not found."}, status=status.HTTP_404_NOT_FOUND)

        response_variant = dict(variant)
        response_variant["id"] = str(response_variant.pop("_id"))
        return Response(response_variant, status=status.HTTP_201_CREATED)


@method_decorator(csrf_exempt, name='dispatch')
class ProductVariantDetailView(APIView):
    """Admin-only: update/delete a single variant inside a product."""

    permission_classes = [IsAuthenticated, IsAdmin]

    def patch(self, request, product_id, variant_id):
        product_oid = _object_id(product_id)
        variant_oid = _object_id(variant_id)
        if product_oid is None or variant_oid is None:
            return Response({"error": "Invalid id."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = VariantUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updates = serializer.validated_data

        if not updates:
            return Response({"error": "No fields provided to update."}, status=status.HTTP_400_BAD_REQUEST)

        existing = products_collection.find_one(
            {"_id": product_oid, "variants._id": variant_oid},
            {"variants.$": 1}
        )
        if not existing:
            return Response({"error": "Variant not found."}, status=status.HTTP_404_NOT_FOUND)

        set_fields = {f"variants.$.{key}": value for key, value in updates.items()}
        set_fields["updated_at"] = timezone.now()

        products_collection.update_one(
            {"_id": product_oid, "variants._id": variant_oid},
            {"$set": set_fields}
        )

        updated = products_collection.find_one(
            {"_id": product_oid, "variants._id": variant_oid},
            {"variants.$": 1}
        )
        variant = updated["variants"][0]
        variant["id"] = str(variant.pop("_id"))
        return Response(variant, status=status.HTTP_200_OK)

    def delete(self, request, product_id, variant_id):
        product_oid = _object_id(product_id)
        variant_oid = _object_id(variant_id)
        if product_oid is None or variant_oid is None:
            return Response({"error": "Invalid id."}, status=status.HTTP_400_BAD_REQUEST)

        existing = products_collection.find_one(
            {"_id": product_oid, "variants._id": variant_oid},
            {"_id": 1}
        )
        if not existing:
            return Response({"error": "Variant not found."}, status=status.HTTP_404_NOT_FOUND)

        products_collection.update_one(
            {"_id": product_oid},
            {
                "$pull": {"variants": {"_id": variant_oid}},
                "$set": {"updated_at": timezone.now()},
            }
        )

        return Response({"message": "Variant deleted successfully."}, status=status.HTTP_200_OK)
