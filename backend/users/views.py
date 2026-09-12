from datetime import datetime, timedelta

from bson import ObjectId
from bson.errors import InvalidId

from django.contrib.auth.hashers import make_password, check_password
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken

from .schema import UserSchema, AddressSchema
from .mongo import users_collection
from .utils import (
    normalize_email,
    serialize_user,
    generate_tokens_for_user,
    blacklist_token,
    generate_otp,
    send_password_reset_otp_email,
    OTP_VALIDITY_MINUTES,
)
from .serializers import (
    SignUpSerializer,
    SignInSerializer,
    ChangePasswordSerializer,
    ForgotPasswordSerializer,
    ResetPasswordSerializer,
    ProfileUpdateSerializer,
    AddressSerializer,
    AddressUpdateSerializer,
)


def _object_id(value):
    try:
        return ObjectId(value)
    except (InvalidId, TypeError):
        return None


@method_decorator(csrf_exempt, name='dispatch')
class UserSignUpView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = SignUpSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        email = normalize_email(data["email"]) # type: ignore

        if users_collection.find_one({"email": email}):
            return Response(
                {"error": "A user with this email already exists."},
                status=status.HTTP_400_BAD_REQUEST
            )

        user_doc = UserSchema.create_user(
            full_name=data["full_name"], # type: ignore
            email=email,
            password_hash=make_password(data["password"]),
            role="customer",
        )

        result = users_collection.insert_one(user_doc)
        user_doc["_id"] = result.inserted_id

        tokens = generate_tokens_for_user(user_doc["_id"], user_doc["role"])

        return Response(
            {
                "message": "Registration successful.",
                "user": serialize_user(user_doc),
                **tokens,
            },
            status=status.HTTP_201_CREATED
        )


@method_decorator(csrf_exempt, name='dispatch')
class UserSignInView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = SignInSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        user = users_collection.find_one({"email": normalize_email(data["email"])})

        if user is None or not check_password(data["password"], user["password_hash"]):
            return Response(
                {"error": "Invalid email or password."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not user.get("is_active", True):
            return Response(
                {"error": "This account has been deactivated."},
                status=status.HTTP_403_FORBIDDEN
            )

        users_collection.update_one(
            {"_id": user["_id"]},
            {"$set": {"last_login": timezone.now()}}
        )

        tokens = generate_tokens_for_user(user["_id"], user.get("role", "customer"))

        return Response(
            {
                "message": "Sign-in successful.",
                "user": serialize_user(user),
                **tokens,
            },
            status=status.HTTP_200_OK
        )


@method_decorator(csrf_exempt, name='dispatch')
class TokenRefreshView(APIView):
    """Mongo-aware replacement for simplejwt's TokenRefreshView, which looks the user up
    via Django's ORM (get_user_model().objects.get(id=...)) — incompatible with our
    ObjectId-keyed Mongo users."""

    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response({"error": "refresh token is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            refresh = RefreshToken(refresh_token)
        except TokenError as e:
            raise InvalidToken(e.args[0])

        user_oid = _object_id(refresh.get("user_id"))
        user = users_collection.find_one({"_id": user_oid}) if user_oid else None

        if user is None:
            return Response({"error": "User not found."}, status=status.HTTP_401_UNAUTHORIZED)
        if not user.get("is_active", True):
            return Response({"error": "This account has been deactivated."}, status=status.HTTP_403_FORBIDDEN)

        return Response({"access": str(refresh.access_token)}, status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name='dispatch')
class UserLogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response(
                {"error": "refresh token is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            token = RefreshToken(refresh_token)
            blacklist_token(token)
        except TokenError:
            return Response(
                {"error": "Invalid or expired refresh token."},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response({"message": "Logged out successfully."}, status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name='dispatch')
class UserProfileView(APIView):
    """CRUD for the authenticated user's own profile (no ORM model — reads/writes MongoDB directly)."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = users_collection.find_one({"_id": ObjectId(request.user.id)})
        if user is None:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(serialize_user(user), status=status.HTTP_200_OK)

    def patch(self, request):
        serializer = ProfileUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updates = serializer.validated_data

        if not updates:
            return Response(
                {"error": "No fields provided to update."},
                status=status.HTTP_400_BAD_REQUEST
            )

        updates["updated_at"] = timezone.now()

        result = users_collection.update_one(
            {"_id": ObjectId(request.user.id)},
            {"$set": updates}
        )
        if result.matched_count == 0:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        user = users_collection.find_one({"_id": ObjectId(request.user.id)})
        return Response(serialize_user(user), status=status.HTTP_200_OK)

    def delete(self, request):
        result = users_collection.delete_one({"_id": ObjectId(request.user.id)})
        if result.deleted_count == 0:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response({"message": "Account deleted successfully."}, status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name='dispatch')
class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        user = users_collection.find_one({"_id": ObjectId(request.user.id)})
        if user is None:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        if not check_password(data["old_password"], user["password_hash"]):
            return Response(
                {"error": "Old password is incorrect."},
                status=status.HTTP_400_BAD_REQUEST
            )

        users_collection.update_one(
            {"_id": user["_id"]},
            {"$set": {
                "password_hash": make_password(data["new_password"]),
                "updated_at": timezone.now(),
            }}
        )
        return Response({"message": "Password changed successfully."}, status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name='dispatch')
class ForgotPasswordView(APIView):
    """Requests a password-reset OTP by email. Always responds the same way
    regardless of whether the email is registered, to avoid leaking which
    emails have accounts."""

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = normalize_email(serializer.validated_data["email"])

        user = users_collection.find_one({"email": email})

        if user is not None:
            otp = generate_otp()
            users_collection.update_one(
                {"_id": user["_id"]},
                {"$set": {
                    "password_reset_otp_hash": make_password(otp),
                    # Stored as naive UTC to match how PyMongo reads datetimes back
                    # (BSON drops tzinfo), so the expiry comparison in ResetPasswordView works.
                    "password_reset_otp_expires_at": datetime.utcnow() + timedelta(minutes=OTP_VALIDITY_MINUTES),
                }}
            )
            send_password_reset_otp_email(user["email"], user["full_name"], otp)

        return Response(
            {"message": "If that email is registered, a reset code has been sent."},
            status=status.HTTP_200_OK
        )


@method_decorator(csrf_exempt, name='dispatch')
class ResetPasswordView(APIView):
    """Verifies the OTP from ForgotPasswordView and sets a new password."""

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        email = normalize_email(data["email"])

        invalid_response = Response(
            {"error": "Invalid or expired reset code."},
            status=status.HTTP_400_BAD_REQUEST
        )

        user = users_collection.find_one({"email": email})
        if user is None or not user.get("password_reset_otp_hash"):
            return invalid_response

        expires_at = user.get("password_reset_otp_expires_at")
        if expires_at is None or datetime.utcnow() > expires_at:
            return invalid_response

        if not check_password(data["otp"], user["password_reset_otp_hash"]):
            return invalid_response

        users_collection.update_one(
            {"_id": user["_id"]},
            {"$set": {
                "password_hash": make_password(data["new_password"]),
                "updated_at": timezone.now(),
                "password_reset_otp_hash": None,
                "password_reset_otp_expires_at": None,
            }}
        )

        return Response({"message": "Password reset successfully."}, status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name='dispatch')
class AddressListCreateView(APIView):
    """List / add addresses in the user's embedded address book."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = users_collection.find_one(
            {"_id": ObjectId(request.user.id)},
            {"addresses": 1}
        )
        addresses = user.get("addresses", []) if user else []
        for addr in addresses:
            addr["id"] = str(addr.pop("_id"))
        return Response(addresses, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = AddressSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        address = AddressSchema.create_address(**serializer.validated_data)

        user_id = ObjectId(request.user.id)

        if address["is_default"]:
            users_collection.update_one(
                {"_id": user_id},
                {"$set": {"addresses.$[].is_default": False}}
            )

        users_collection.update_one(
            {"_id": user_id},
            {
                "$push": {"addresses": address},
                "$set": {"updated_at": timezone.now()},
            }
        )

        response_address = dict(address)
        response_address["id"] = str(response_address.pop("_id"))
        return Response(response_address, status=status.HTTP_201_CREATED)


@method_decorator(csrf_exempt, name='dispatch')
class AddressDetailView(APIView):
    """Update / delete a single address inside the user's embedded address book."""

    permission_classes = [IsAuthenticated]

    def patch(self, request, address_id):
        addr_oid = _object_id(address_id)
        if addr_oid is None:
            return Response({"error": "Invalid address id."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = AddressUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updates = serializer.validated_data

        if not updates:
            return Response(
                {"error": "No fields provided to update."},
                status=status.HTTP_400_BAD_REQUEST
            )

        user_id = ObjectId(request.user.id)

        existing = users_collection.find_one(
            {"_id": user_id, "addresses._id": addr_oid},
            {"addresses.$": 1}
        )
        if not existing:
            return Response({"error": "Address not found."}, status=status.HTTP_404_NOT_FOUND)

        if updates.get("is_default"):
            users_collection.update_one(
                {"_id": user_id},
                {"$set": {"addresses.$[].is_default": False}}
            )

        set_fields = {f"addresses.$.{key}": value for key, value in updates.items()}
        set_fields["updated_at"] = timezone.now()

        users_collection.update_one(
            {"_id": user_id, "addresses._id": addr_oid},
            {"$set": set_fields}
        )

        updated = users_collection.find_one(
            {"_id": user_id, "addresses._id": addr_oid},
            {"addresses.$": 1}
        )
        address = updated["addresses"][0]
        address["id"] = str(address.pop("_id"))
        return Response(address, status=status.HTTP_200_OK)

    def delete(self, request, address_id):
        addr_oid = _object_id(address_id)
        if addr_oid is None:
            return Response({"error": "Invalid address id."}, status=status.HTTP_400_BAD_REQUEST)

        user_id = ObjectId(request.user.id)

        existing = users_collection.find_one(
            {"_id": user_id, "addresses._id": addr_oid},
            {"_id": 1}
        )
        if not existing:
            return Response({"error": "Address not found."}, status=status.HTTP_404_NOT_FOUND)

        users_collection.update_one(
            {"_id": user_id},
            {
                "$pull": {"addresses": {"_id": addr_oid}},
                "$set": {"updated_at": timezone.now()},
            }
        )

        return Response({"message": "Address deleted successfully."}, status=status.HTTP_200_OK)
