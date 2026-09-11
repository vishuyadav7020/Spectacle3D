from django.urls import path
from .views import UserSignInView, UserSignUpView

urlpatterns = [
    path('signup/', UserSignUpView.as_view(), name='user_signup'),
    path('signin/', UserSignInView.as_view(), name='user_signin'),
]