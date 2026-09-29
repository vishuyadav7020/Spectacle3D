"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/users/', include('users.urls')),  # Include the users app URLs
    path('api/products/', include('products.urls')),  # Include the products app URLs
    path('api/products/', include('reviews.urls')),  # api/products/<id>/reviews/... — see reviews/urls.py
    path('api/orders/', include('orders.urls')),  # Include the orders app URLs
    path('api/cart/', include('cart.urls')),  # Include the cart app URLs
    path('api/coupons/', include('coupons.urls')),  # Include the coupons app URLs
]

if settings.DEBUG:
    # Serve uploaded product images locally in development. In production
    # this should be handled by the web server / a proper media host instead.
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
