from django.urls import path

from .views import (
    UserSignUpView,
    UserSignInView,
    UserLogoutView,
    TokenRefreshView,
    UserProfileView,
    ChangePasswordView,
    ForgotPasswordView,
    ResetPasswordView,
    AddressListCreateView,
    AddressDetailView,
    AdminUserListView,
    AdminUserDetailView,
)

urlpatterns = [
    # Auth
    path('signup/', UserSignUpView.as_view(), name='user_signup'),
    path('signin/', UserSignInView.as_view(), name='user_signin'),
    path('logout/', UserLogoutView.as_view(), name='user_logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Profile CRUD
    path('me/', UserProfileView.as_view(), name='user_profile'),
    path('me/change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('password/forgot/', ForgotPasswordView.as_view(), name='forgot_password'),
    path('password/reset/', ResetPasswordView.as_view(), name='reset_password'),

    # Address book CRUD
    path('addresses/', AddressListCreateView.as_view(), name='address_list_create'),
    path('addresses/<str:address_id>/', AddressDetailView.as_view(), name='address_detail'),

    # Admin: view/manage all users
    path('admin/', AdminUserListView.as_view(), name='admin_user_list'),
    path('admin/<str:user_id>/', AdminUserDetailView.as_view(), name='admin_user_detail'),
]
