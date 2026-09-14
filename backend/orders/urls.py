from django.urls import path

from .views import (
    OrderListCreateView,
    OrderDetailView,
    AdminOrderListView,
    AdminOrderDetailView,
)

urlpatterns = [
    # Admin: view/manage all orders — must come before <str:order_id>/ below,
    # otherwise Django matches "admin" itself as an order_id (a real bug this
    # ordering caused: GET /orders/admin/ hit OrderDetailView with
    # order_id="admin" instead of AdminOrderListView).
    path('admin/', AdminOrderListView.as_view(), name='admin_order_list'),
    path('admin/<str:order_id>/', AdminOrderDetailView.as_view(), name='admin_order_detail'),

    # Customer: place an order / view own order history
    path('', OrderListCreateView.as_view(), name='order_list_create'),
    path('<str:order_id>/', OrderDetailView.as_view(), name='order_detail'),
]
