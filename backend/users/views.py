from django.shortcuts import render
from .schema import UserSchema, AddressSchema
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
# Create your views here.

@method_decorator(csrf_exempt, name='dispatch')
class UserSignInView(APIView):

    def post(self, request):

        data = request.data

        existing_user = 
        user_doc = Userschema.create_user(
            full_name = data["full_name"],
            email = data["email"],  
            role = role

