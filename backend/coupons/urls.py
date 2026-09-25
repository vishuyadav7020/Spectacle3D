from django.urls import path

from .views import AdminCouponListCreateView, AdminCouponDetailView, CouponValidateView

urlpatterns = [
    # Customer: check a code before checkout
    path('validate/', CouponValidateView.as_view(), name='coupon_validate'),

    # Admin: manage coupons
    path('admin/', AdminCouponListCreateView.as_view(), name='admin_coupon_list_create'),
    path('admin/<str:coupon_id>/', AdminCouponDetailView.as_view(), name='admin_coupon_detail'),
]
