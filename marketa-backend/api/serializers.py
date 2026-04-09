from rest_framework import serializers
from .models import Product, Category

# 2 ModelSerializers
class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'

# 2 Простых Serializers (например, для логина или статы)
class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()

class StatSerializer(serializers.Serializer):
    total_count = serializers.IntegerField()