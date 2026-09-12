from bson import ObjectId
from bson.errors import InvalidId

from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import AuthenticationFailed

from .mongo import users_collection


class MongoUser:
    """Wraps a MongoDB user document so it satisfies DRF's request.user contract."""

    def __init__(self, doc):
        self.doc = doc
        self.id = str(doc["_id"])
        self.pk = self.id
        self.email = doc.get("email")
        self.role = doc.get("role", "customer")
        self.is_active = doc.get("is_active", True)

    @property
    def is_authenticated(self):
        return True

    @property
    def is_anonymous(self):
        return False

    def __str__(self):
        return self.email or self.id


class MongoJWTAuthentication(JWTAuthentication):
    """Validates the JWT as usual, then resolves the user_id claim against MongoDB
    instead of Django's ORM (our users live in MongoDB, not auth.User)."""

    def get_user(self, validated_token):
        user_id = validated_token.get("user_id")
        if user_id is None:
            raise AuthenticationFailed("Token contained no recognizable user identification.")

        try:
            doc = users_collection.find_one({"_id": ObjectId(user_id)})
        except (InvalidId, TypeError):
            raise AuthenticationFailed("Invalid user identification in token.")

        if doc is None:
            raise AuthenticationFailed("User not found.", code="user_not_found")

        if not doc.get("is_active", True):
            raise AuthenticationFailed("This account has been deactivated.", code="user_inactive")

        return MongoUser(doc)
