from django.urls import path
from .views import UserSignInView

urlpatterns = [
    path('signin/', UserSignInView.as_view(), name='user_signin'),
]