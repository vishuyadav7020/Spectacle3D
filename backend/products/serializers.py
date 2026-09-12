from rest_framework import serializers

PRINT_TECHNOLOGIES = ["FDM", "SLA", "SLS"]
PRODUCT_STATUSES = ["draft", "published", "archived"]


class DimensionsSerializer(serializers.Serializer):
    length_mm = serializers.FloatField(min_value=0)
    width_mm = serializers.FloatField(min_value=0)
    height_mm = serializers.FloatField(min_value=0)


class ProductCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=200)
    description = serializers.CharField()
    category = serializers.CharField(max_length=100)
    base_price = serializers.FloatField(min_value=0)
    print_technology = serializers.ChoiceField(choices=PRINT_TECHNOLOGIES, default="FDM")
    material = serializers.CharField(max_length=100, required=False, allow_null=True)

    tags = serializers.ListField(child=serializers.CharField(max_length=50), default=list)
    images = serializers.ListField(child=serializers.URLField(), default=list)
    available_colors = serializers.ListField(child=serializers.CharField(max_length=50), default=list)
    dimensions = DimensionsSerializer(required=False, allow_null=True)
    weight_grams = serializers.FloatField(min_value=0, required=False, allow_null=True)
    scale = serializers.CharField(max_length=50, required=False, allow_null=True)
    is_made_to_order = serializers.BooleanField(default=True)

    discount_price = serializers.FloatField(min_value=0, required=False, allow_null=True)
    currency = serializers.CharField(max_length=10, default="INR")
    sku = serializers.CharField(max_length=100, required=False, allow_null=True)
    stock_quantity = serializers.IntegerField(min_value=0, default=0)

    status = serializers.ChoiceField(choices=PRODUCT_STATUSES, default="draft")


class ProductUpdateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=200, required=False)
    description = serializers.CharField(required=False)
    category = serializers.CharField(max_length=100, required=False)
    print_technology = serializers.ChoiceField(choices=PRINT_TECHNOLOGIES, required=False)
    material = serializers.CharField(max_length=100, required=False, allow_null=True)

    tags = serializers.ListField(child=serializers.CharField(max_length=50), required=False)
    images = serializers.ListField(child=serializers.URLField(), required=False)
    available_colors = serializers.ListField(child=serializers.CharField(max_length=50), required=False)
    dimensions = DimensionsSerializer(required=False, allow_null=True)
    weight_grams = serializers.FloatField(min_value=0, required=False, allow_null=True)
    scale = serializers.CharField(max_length=50, required=False, allow_null=True)
    is_made_to_order = serializers.BooleanField(required=False)

    base_price = serializers.FloatField(min_value=0, required=False)
    discount_price = serializers.FloatField(min_value=0, required=False, allow_null=True)
    currency = serializers.CharField(max_length=10, required=False)
    sku = serializers.CharField(max_length=100, required=False, allow_null=True)
    stock_quantity = serializers.IntegerField(min_value=0, required=False)

    status = serializers.ChoiceField(choices=PRODUCT_STATUSES, required=False)
    is_active = serializers.BooleanField(required=False)


class VariantSerializer(serializers.Serializer):
    material = serializers.CharField(max_length=100)
    color = serializers.CharField(max_length=50)
    price = serializers.FloatField(min_value=0)
    stock_quantity = serializers.IntegerField(min_value=0, default=0)
    sku = serializers.CharField(max_length=100, required=False, allow_null=True)


class VariantUpdateSerializer(serializers.Serializer):
    material = serializers.CharField(max_length=100, required=False)
    color = serializers.CharField(max_length=50, required=False)
    price = serializers.FloatField(min_value=0, required=False)
    stock_quantity = serializers.IntegerField(min_value=0, required=False)
    sku = serializers.CharField(max_length=100, required=False, allow_null=True)
    is_active = serializers.BooleanField(required=False)
