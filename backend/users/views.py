from django.shortcuts import render
from django.contrib.auth.hashers import make_password, check_password
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .schema import UserSchema
from .mongo import users_collection
from .utils import normalize_email
from common.mongo_base import db




@method_decorator(csrf_exempt, name='dispatch')
class UserSignUpView(APIView):

    def post(self, request):   #SignUp API

        data = request.data

        full_name = data.get("full_name")
        email = data.get("email")
        password = data.get("password")

        email = normalize_email(email)

        if not full_name or not email or not password:
            return Response(
                {"error": "full_name, email and password are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if users_collection.find_one({"email": email}):
            return Response(
                {"error": "A user with this email already exists."},
                status=status.HTTP_400_BAD_REQUEST
            )

        user_doc = UserSchema.create_user(
            full_name=full_name,
            email=email,
            password_hash=make_password(password),
            role="customer",
        )

        result = users_collection.insert_one(user_doc)

        return Response(
            {
                "message": "Registration successful. OTP sent to your email.",
                "user_id": str(result.inserted_id),
                "email": user_doc["email"],
            },
            status=status.HTTP_201_CREATED
        )


@method_decorator(csrf_exempt, name='dispatch')
class UserSignInView(APIView):

    def post(self, request):  #SignIn API

        data = request.data

        email = data.get("email")
        password = data.get("password")

        if not email or not password:
            return Response(
                {"error": "email and password are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = users_collection.find_one({"email": normalize_email(email)})

        if user is None:
            return Response(
                {"error": "User does not exist."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not check_password(password, user["password_hash"]):
            return Response(
                {"error": "Invalid password."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        else:
            return Response(
                {
                    "message": "Sign-in successful.",
                    "user_id": str(user["_id"]),
                    "email": user["email"],
                },
                status=status.HTTP_200_OK
            )
