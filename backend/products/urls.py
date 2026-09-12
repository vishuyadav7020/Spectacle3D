from django.urls import path

from .views import (
    ProductListCreateView,
    ProductDetailView,
    ProductVariantListCreateView,
    ProductVariantDetailView,
)

urlpatterns = [
    path('', ProductListCreateView.as_view(), name='product_list_create'),
    path('<str:product_id>/', ProductDetailView.as_view(), name='product_detail'),
    path('<str:product_id>/variants/', ProductVariantListCreateView.as_view(), name='product_variant_list_create'),
    path('<str:product_id>/variants/<str:variant_id>/', ProductVariantDetailView.as_view(), name='product_variant_detail'),
]
