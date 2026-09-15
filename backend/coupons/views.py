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
from .mongo import coupons_collection
from .schema import CouponSchema
from .utils import serialize_coupon, validate_coupon
from .serializers import CouponCreateSerializer, CouponUpdateSerializer, CouponValidateSerializer

DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100


def _object_id(value):
    try:
        return ObjectId(value)
    except (InvalidId, TypeError):
        return None


@method_decorator(csrf_exempt, name='dispatch')
class AdminCouponListCreateView(APIView):
    """Admin-only: list/search all coupons, or create a new one."""

    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        query = {}

        is_active_param = request.query_params.get("is_active")
        if is_active_param is not None:
            query["is_active"] = is_active_param.lower() == "true"

        search = request.query_params.get("search")
        if search:
            query["code"] = {"$regex": search, "$options": "i"}

        try:
            page = max(int(request.query_params.get("page", 1)), 1)
        except ValueError:
            return Response({"error": "page must be an integer."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            page_size = min(max(int(request.query_params.get("page_size", DEFAULT_PAGE_SIZE)), 1), MAX_PAGE_SIZE)
        except ValueError:
            return Response({"error": "page_size must be an integer."}, status=status.HTTP_400_BAD_REQUEST)

        total = coupons_collection.count_documents(query)
        cursor = (
            coupons_collection.find(query)
            .sort("created_at", -1)
            .skip((page - 1) * page_size)
            .limit(page_size)
        )
        coupons = [serialize_coupon(c) for c in cursor]

        return Response(
            {"count": total, "page": page, "page_size": page_size, "results": coupons},
            status=status.HTTP_200_OK
        )

    def post(self, request):
        serializer = CouponCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = dict(serializer.validated_data)
        data.setdefault("valid_from", timezone.now())

        if coupons_collection.find_one({"code": data["code"].strip().upper()}):
            return Response({"error": "A coupon with this code already exists."}, status=status.HTTP_400_BAD_REQUEST)

        coupon_doc = CouponSchema.create_coupon(
            code=data["code"],
            description=data.get("description", ""),
            discount_type=data["discount_type"],
            value=data["value"],
            max_discount_amount=data.get("max_discount_amount"),
            min_order_value=data.get("min_order_value", 0),
            usage_limit=data.get("usage_limit"),
            usage_limit_per_user=data.get("usage_limit_per_user", 1),
            valid_from=data["valid_from"],
            valid_until=data.get("valid_until"),
            created_by=ObjectId(request.user.id),
        )

        result = coupons_collection.insert_one(coupon_doc)
        coupon_doc["_id"] = result.inserted_id
        return Response(serialize_coupon(coupon_doc), status=status.HTTP_201_CREATED)


@method_decorator(csrf_exempt, name='dispatch')
class AdminCouponDetailView(APIView):
    """Admin-only: view, update, or delete a single coupon."""

    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request, coupon_id):
        coupon_oid = _object_id(coupon_id)
        if coupon_oid is None:
            return Response({"error": "Invalid coupon id."}, status=status.HTTP_400_BAD_REQUEST)

        coupon = coupons_collection.find_one({"_id": coupon_oid})
        if coupon is None:
            return Response({"error": "Coupon not found."}, status=status.HTTP_404_NOT_FOUND)

        return Response(serialize_coupon(coupon), status=status.HTTP_200_OK)

    def patch(self, request, coupon_id):
        coupon_oid = _object_id(coupon_id)
        if coupon_oid is None:
            return Response({"error": "Invalid coupon id."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = CouponUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updates = dict(serializer.validated_data)

        if not updates:
            return Response({"error": "No fields provided to update."}, status=status.HTTP_400_BAD_REQUEST)

        updates["updated_at"] = timezone.now()

        result = coupons_collection.update_one({"_id": coupon_oid}, {"$set": updates})
        if result.matched_count == 0:
            return Response({"error": "Coupon not found."}, status=status.HTTP_404_NOT_FOUND)

        coupon = coupons_collection.find_one({"_id": coupon_oid})
        return Response(serialize_coupon(coupon), status=status.HTTP_200_OK)

    def delete(self, request, coupon_id):
        coupon_oid = _object_id(coupon_id)
        if coupon_oid is None:
            return Response({"error": "Invalid coupon id."}, status=status.HTTP_400_BAD_REQUEST)

        result = coupons_collection.delete_one({"_id": coupon_oid})
        if result.deleted_count == 0:
            return Response({"error": "Coupon not found."}, status=status.HTTP_404_NOT_FOUND)

        return Response({"message": "Coupon deleted successfully."}, status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name='dispatch')
class CouponValidateView(APIView):
    """Authenticated: preview whether a coupon code applies to a given
    subtotal, without consuming a redemption — that only happens when the
    order is actually placed (see orders.views.OrderListCreateView)."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CouponValidateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        coupon, discount, error = validate_coupon(data["code"], ObjectId(request.user.id), data["subtotal"])
        if error:
            return Response({"error": error}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {
                "code": coupon["code"],
                "discount_amount": discount,
                "total_after_discount": round(data["subtotal"] - discount, 2),
            },
            status=status.HTTP_200_OK
        )
