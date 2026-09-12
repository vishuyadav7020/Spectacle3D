from rest_framework import serializers


class SignUpSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, write_only=True)


class SignInSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(min_length=8, write_only=True)


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()


class ResetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(min_length=6, max_length=6)
    new_password = serializers.CharField(min_length=8, write_only=True)


class ProfileUpdateSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=150, required=False)
    phone_number = serializers.CharField(max_length=20, required=False, allow_null=True)
    date_of_birth = serializers.DateField(required=False, allow_null=True)
    gender = serializers.ChoiceField(choices=["male", "female", "other"], required=False, allow_null=True)
    profile_photo = serializers.CharField(required=False, allow_null=True)


class AddressSerializer(serializers.Serializer):
    label = serializers.ChoiceField(choices=["Home", "Work", "Other"], default="Home")
    line1 = serializers.CharField(max_length=255)
    line2 = serializers.CharField(max_length=255, required=False, allow_null=True, allow_blank=True)
    city = serializers.CharField(max_length=100)
    state = serializers.CharField(max_length=100)
    pincode = serializers.CharField(max_length=20)
    country = serializers.CharField(max_length=100, default="India")
    is_default = serializers.BooleanField(default=False)


class AddressUpdateSerializer(serializers.Serializer):
    label = serializers.ChoiceField(choices=["Home", "Work", "Other"], required=False)
    line1 = serializers.CharField(max_length=255, required=False)
    line2 = serializers.CharField(max_length=255, required=False, allow_null=True, allow_blank=True)
    city = serializers.CharField(max_length=100, required=False)
    state = serializers.CharField(max_length=100, required=False)
    pincode = serializers.CharField(max_length=20, required=False)
    country = serializers.CharField(max_length=100, required=False)
    is_default = serializers.BooleanField(required=False)
