import datetime
from django.utils import timezone
from typing import Dict, List, Optional


class BaseSchema:
    @staticmethod
    def timestamps() -> Dict:
        return {
            "created_at": timezone.now(),
            "updated_at": timezone.now()
        }


class AddressSchema(BaseSchema):
    @staticmethod
    def create_address(
        *,
        line1: str,
        city: str,
        state: str,
        pincode: str,
        label: str = "Home",  # Home, Work, Other
        line2: str = None,
        country: str = "India",
        is_default: bool = False,
    ) -> Dict:
        return {
            "label": label,  # Home, Work, Other
            "line1": line1,
            "line2": line2,
            "city": city,
            "state": state,
            "pincode": pincode,
            "country": country,
            "is_default": is_default,
        }


class UserSchema(BaseSchema):
    @staticmethod
    def create_user(
        *,
        full_name: str,
        email: str,
        password_hash: str,
        role: str = "customer",  # customer, admin
    ) -> Dict:
        return {
            "full_name": full_name,
            "email": email.lower(),
            "password_hash": password_hash,
            "role": role,  # customer, admin
            # Personal Info
            "phone_number": None,
            "profile_photo": None,
            "date_of_birth": None,
            "gender": None,  # male, female, other
            # Verification
            "status": "pending",  # pending, verified, rejected
            "is_verified": False,
            "is_active": True,
            # Address book
            "addresses": [],  # Array of AddressSchema dicts (see AddressSchema.create_address)
            # Customer specific
            "wishlist": [],  # Array of ObjectIds referencing products collection
            "cart": None,  # ObjectId referencing carts collection
            # Auth / session
            "last_login": None,
            "refresh_tokens": [],  # Array of active JWT refresh token jtis, if you track them
            # Stats
            "total_orders": 0,
            "total_spent": 0.0,
            **BaseSchema.timestamps()
        }

    @staticmethod
    def create_admin_user(
        *,
        full_name: str,
        email: str,
        password_hash: str,
    ) -> Dict:
        user = UserSchema.create_user(
            full_name=full_name,
            email=email,
            password_hash=password_hash,
            role="admin",
        )
        user.update({
            "status": "verified",
            "is_verified": True,
        })
        return user
