from rest_framework import serializers

from .schema import ORDER_STATUSES

SHIPPING_METHODS = ["standard", "express"]


class OrderItemInputSerializer(serializers.Serializer):
    product_id = serializers.CharField()
    variant_id = serializers.CharField(required=False, allow_null=True)
    quantity = serializers.IntegerField(min_value=1)


class ShippingAddressInputSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=100)
    last_name = serializers.CharField(max_length=100)
    street = serializers.CharField(max_length=255)
    apt = serializers.CharField(max_length=100, required=False, allow_null=True, allow_blank=True)
    city = serializers.CharField(max_length=100)
    state = serializers.CharField(max_length=100)
    zip_code = serializers.CharField(max_length=20)
    country = serializers.CharField(max_length=100)


class OrderCreateSerializer(serializers.Serializer):
    items = OrderItemInputSerializer(many=True, allow_empty=False)
    shipping_address = ShippingAddressInputSerializer()
    shipping_method = serializers.ChoiceField(choices=SHIPPING_METHODS, default="standard")
    # Only the last 4 digits are ever sent — never the full card number, since
    # there's no real payment gateway to justify collecting/transmitting it.
    card_last4 = serializers.CharField(max_length=4, min_length=1, required=False, default="0000")
    coupon_code = serializers.CharField(max_length=30, required=False, allow_null=True, allow_blank=True)


class OrderStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=ORDER_STATUSES)
