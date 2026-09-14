from django.urls import path

from .views import (
    ProductListCreateView,
    ProductDetailView,
    ProductImageUploadView,
    ProductVariantListCreateView,
    ProductVariantDetailView,
)

urlpatterns = [
    # More specific literal paths before the generic <str:product_id>/
    # catch-all below (see orders/urls.py for why ordering matters here).
    path('admin/upload-image/', ProductImageUploadView.as_view(), name='product_image_upload'),

    path('', ProductListCreateView.as_view(), name='product_list_create'),
    path('<str:product_id>/', ProductDetailView.as_view(), name='product_detail'),
    path('<str:product_id>/variants/', ProductVariantListCreateView.as_view(), name='product_variant_list_create'),
    path('<str:product_id>/variants/<str:variant_id>/', ProductVariantDetailView.as_view(), name='product_variant_detail'),
]
