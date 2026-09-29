from django.urls import path

from .views import CartView, CartItemListCreateView, CartItemDetailView

urlpatterns = [
    path('', CartView.as_view(), name='cart_detail'),
    path('items/', CartItemListCreateView.as_view(), name='cart_item_create'),
    path('items/<str:item_id>/', CartItemDetailView.as_view(), name='cart_item_detail'),
]
