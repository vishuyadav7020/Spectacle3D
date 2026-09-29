from rest_framework import serializers

from .schema import DISCOUNT_TYPES


class CouponCreateSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=30)
    description = serializers.CharField(max_length=255, required=False, allow_blank=True, default="")
    discount_type = serializers.ChoiceField(choices=DISCOUNT_TYPES)
    value = serializers.FloatField(min_value=0)
    max_discount_amount = serializers.FloatField(min_value=0, required=False, allow_null=True)
    min_order_value = serializers.FloatField(min_value=0, default=0)
    usage_limit = serializers.IntegerField(min_value=1, required=False, allow_null=True)
    usage_limit_per_user = serializers.IntegerField(min_value=1, default=1)
    valid_from = serializers.DateTimeField(required=False)
    valid_until = serializers.DateTimeField(required=False, allow_null=True)

    def validate(self, attrs):
        if attrs.get("discount_type") == "percentage" and attrs.get("value", 0) > 100:
            raise serializers.ValidationError("Percentage discount value cannot exceed 100.")
        return attrs


class CouponUpdateSerializer(serializers.Serializer):
    description = serializers.CharField(max_length=255, required=False, allow_blank=True)
    discount_type = serializers.ChoiceField(choices=DISCOUNT_TYPES, required=False)
    value = serializers.FloatField(min_value=0, required=False)
    max_discount_amount = serializers.FloatField(min_value=0, required=False, allow_null=True)
    min_order_value = serializers.FloatField(min_value=0, required=False)
    usage_limit = serializers.IntegerField(min_value=1, required=False, allow_null=True)
    usage_limit_per_user = serializers.IntegerField(min_value=1, required=False)
    valid_from = serializers.DateTimeField(required=False)
    valid_until = serializers.DateTimeField(required=False, allow_null=True)
    is_active = serializers.BooleanField(required=False)


class CouponValidateSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=30)
    subtotal = serializers.FloatField(min_value=0)
