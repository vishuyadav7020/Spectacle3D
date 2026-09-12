import secrets

from bson import ObjectId
from django.core.mail import send_mail
from rest_framework_simplejwt.settings import api_settings
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.utils import datetime_from_epoch
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken

OTP_LENGTH = 6
OTP_VALIDITY_MINUTES = 10


def generate_otp() -> str:
    return "".join(secrets.choice("0123456789") for _ in range(OTP_LENGTH))


def send_password_reset_otp_email(to_email: str, full_name: str, otp: str) -> None:
    send_mail(
        subject="Spectacle3D — Password reset code",
        message=(
            f"Hi {full_name},\n\n"
            f"Your password reset code is: {otp}\n"
            f"This code expires in {OTP_VALIDITY_MINUTES} minutes.\n\n"
            "If you didn't request this, you can safely ignore this email."
        ),
        from_email=None,
        recipient_list=[to_email],
        fail_silently=False,
    )


def normalize_email(email: str) -> str:
    return email.strip().lower()


def generate_tokens_for_user(user_id, role: str = "customer") -> dict:
    """Issues a JWT pair for a MongoDB-backed user (no Django ORM model involved)."""
    refresh = RefreshToken()
    refresh["user_id"] = str(user_id)
    refresh["role"] = role
    access = refresh.access_token

    return {"refresh": str(refresh), "access": str(access)}


def blacklist_token(token: RefreshToken) -> None:
    """Blacklists a refresh token without simplejwt's built-in blacklist(), which looks
    the user up via Django's ORM (User.objects.get(id=...)) and only catches
    User.DoesNotExist — it raises ValueError for our non-integer Mongo ObjectId user_ids."""
    payload = token.payload
    outstanding, _ = OutstandingToken.objects.get_or_create(
        jti=payload[api_settings.JTI_CLAIM],
        defaults={
            "token": str(token),
            "expires_at": datetime_from_epoch(payload["exp"]),
        },
    )
    BlacklistedToken.objects.get_or_create(token=outstanding)


def serialize_user(doc: dict) -> dict:
    """Converts a MongoDB user document into a JSON-safe dict, stripping sensitive fields."""
    if doc is None:
        return None

    data = dict(doc)
    data["id"] = str(data.pop("_id"))
    data.pop("password_hash", None)
    data.pop("refresh_tokens", None)
    data.pop("password_reset_otp_hash", None)
    data.pop("password_reset_otp_expires_at", None)

    for addr in data.get("addresses", []):
        if isinstance(addr.get("_id"), ObjectId):
            addr["id"] = str(addr.pop("_id"))

    data["wishlist"] = [str(item) for item in data.get("wishlist", [])]
    if data.get("cart") is not None:
        data["cart"] = str(data["cart"])

    for field in ("created_at", "updated_at", "last_login", "date_of_birth"):
        value = data.get(field)
        if hasattr(value, "isoformat"):
            data[field] = value.isoformat()

    return data
