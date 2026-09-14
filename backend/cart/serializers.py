from rest_framework import serializers


class CartItemAddSerializer(serializers.Serializer):
    product_id = serializers.CharField()
    variant_id = serializers.CharField(required=False, allow_null=True)
    quantity = serializers.IntegerField(min_value=1, default=1)


class CartItemUpdateSerializer(serializers.Serializer):
    quantity = serializers.IntegerField(min_value=1)
