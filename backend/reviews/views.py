from bson import ObjectId
from bson.errors import InvalidId

from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status

from orders.mongo import orders_collection
from products.mongo import products_collection
from .mongo import reviews_collection
from .schema import ReviewSchema
from .utils import serialize_review, recalculate_product_rating
from .serializers import ReviewCreateSerializer, ReviewUpdateSerializer

DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100

SORT_OPTIONS = {
    "newest": [("created_at", -1)],
    "oldest": [("created_at", 1)],
    "highest": [("rating", -1), ("created_at", -1)],
    "lowest": [("rating", 1), ("created_at", -1)],
}


def _object_id(value):
    try:
        return ObjectId(value)
    except (InvalidId, TypeError):
        return None


def _is_verified_purchase(user_id: ObjectId, product_id: ObjectId) -> bool:
    return orders_collection.find_one({
        "user_id": user_id,
        "items.product_id": product_id,
        "payment_status": "paid",
    }) is not None


@method_decorator(csrf_exempt, name='dispatch')
class ProductReviewListCreateView(APIView):
    """Public: browse a product's reviews. Authenticated: leave a review for a
    product you haven't already reviewed (one review per user per product)."""

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated()]
        return [AllowAny()]

    def get(self, request, product_id):
        product_oid = _object_id(product_id)
        if product_oid is None:
            return Response({"error": "Invalid product id."}, status=status.HTTP_400_BAD_REQUEST)

        sort = SORT_OPTIONS.get(request.query_params.get("sort", "newest"), SORT_OPTIONS["newest"])

        try:
            page = max(int(request.query_params.get("page", 1)), 1)
        except ValueError:
            return Response({"error": "page must be an integer."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            page_size = min(max(int(request.query_params.get("page_size", DEFAULT_PAGE_SIZE)), 1), MAX_PAGE_SIZE)
        except ValueError:
            return Response({"error": "page_size must be an integer."}, status=status.HTTP_400_BAD_REQUEST)

        query = {"product_id": product_oid}
        total = reviews_collection.count_documents(query)
        cursor = (
            reviews_collection.find(query)
            .sort(sort)
            .skip((page - 1) * page_size)
            .limit(page_size)
        )
        reviews = [serialize_review(r) for r in cursor]

        return Response(
            {"count": total, "page": page, "page_size": page_size, "results": reviews},
            status=status.HTTP_200_OK
        )

    def post(self, request, product_id):
        product_oid = _object_id(product_id)
        if product_oid is None:
            return Response({"error": "Invalid product id."}, status=status.HTTP_400_BAD_REQUEST)

        product = products_collection.find_one({"_id": product_oid})
        if product is None:
            return Response({"error": "Product not found."}, status=status.HTTP_404_NOT_FOUND)

        user_id = ObjectId(request.user.id)

        if reviews_collection.find_one({"product_id": product_oid, "user_id": user_id}):
            return Response(
                {"error": "You have already reviewed this product. Edit your existing review instead."},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = ReviewCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        review_doc = ReviewSchema.create_review(
            product_id=product_oid,
            user_id=user_id,
            user_name=request.user.doc.get("full_name") or request.user.email,
            rating=data["rating"],
            comment=data["comment"],
            is_verified_purchase=_is_verified_purchase(user_id, product_oid),
        )

        result = reviews_collection.insert_one(review_doc)
        review_doc["_id"] = result.inserted_id
        recalculate_product_rating(product_oid)

        return Response(serialize_review(review_doc), status=status.HTTP_201_CREATED)


@method_decorator(csrf_exempt, name='dispatch')
class ProductReviewDetailView(APIView):
    """Update your own review, or delete it (as its author or an admin)."""

    permission_classes = [IsAuthenticated]

    def patch(self, request, product_id, review_id):
        product_oid = _object_id(product_id)
        review_oid = _object_id(review_id)
        if product_oid is None or review_oid is None:
            return Response({"error": "Invalid id."}, status=status.HTTP_400_BAD_REQUEST)

        review = reviews_collection.find_one({"_id": review_oid, "product_id": product_oid})
        if review is None:
            return Response({"error": "Review not found."}, status=status.HTTP_404_NOT_FOUND)

        if str(review["user_id"]) != str(request.user.id):
            return Response({"error": "You can only edit your own review."}, status=status.HTTP_403_FORBIDDEN)

        serializer = ReviewUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updates = dict(serializer.validated_data)

        if not updates:
            return Response({"error": "No fields provided to update."}, status=status.HTTP_400_BAD_REQUEST)

        updates["updated_at"] = timezone.now()
        reviews_collection.update_one({"_id": review_oid}, {"$set": updates})
        recalculate_product_rating(product_oid)

        updated = reviews_collection.find_one({"_id": review_oid})
        return Response(serialize_review(updated), status=status.HTTP_200_OK)

    def delete(self, request, product_id, review_id):
        product_oid = _object_id(product_id)
        review_oid = _object_id(review_id)
        if product_oid is None or review_oid is None:
            return Response({"error": "Invalid id."}, status=status.HTTP_400_BAD_REQUEST)

        review = reviews_collection.find_one({"_id": review_oid, "product_id": product_oid})
        if review is None:
            return Response({"error": "Review not found."}, status=status.HTTP_404_NOT_FOUND)

        is_owner = str(review["user_id"]) == str(request.user.id)
        is_admin = getattr(request.user, "role", None) == "admin"
        if not is_owner and not is_admin:
            return Response({"error": "You can only delete your own review."}, status=status.HTTP_403_FORBIDDEN)

        reviews_collection.delete_one({"_id": review_oid})
        recalculate_product_rating(product_oid)

        return Response({"message": "Review deleted successfully."}, status=status.HTTP_200_OK)
