from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    """Restricts access to users whose role is 'admin' (see users.schema.UserSchema).
    Works with MongoUser (users.authentication) rather than Django's ORM User model."""

    message = "Only an admin can perform this action."

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and getattr(user, "role", None) == "admin")
