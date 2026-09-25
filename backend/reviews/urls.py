from django.urls import path

from .views import ProductReviewListCreateView, ProductReviewDetailView

urlpatterns = [
    # Mounted under api/products/ in backend/urls.py, alongside products.urls —
    # these two-segment-plus patterns don't collide with that app's <product_id>/
    # catch-all (a single-segment `str` path converter).
    path('<str:product_id>/reviews/', ProductReviewListCreateView.as_view(), name='product_review_list_create'),
    path('<str:product_id>/reviews/<str:review_id>/', ProductReviewDetailView.as_view(), name='product_review_detail'),
]
