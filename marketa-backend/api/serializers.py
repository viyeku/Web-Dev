from rest_framework import serializers
from .models import Category, Product, Order, Review
from django.contrib.auth.models import User

class CategorySerializer(serializers.ModelSerializer):
    products_count = serializers.IntegerField(source='products.count', read_only=True)

    class Meta:
        model = Category
        fields = ('id', 'name', 'products_count')

class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    owner_username = serializers.CharField(source='owner.username', read_only=True)

    class Meta:
        model = Product
        fields = (
            'id', 'name', 'description', 'price', 'quantity', 
            'image',
            'is_active', 'category', 'category_name', 'owner', 
            'owner_username', 'created_at'
        )
        read_only_fields = ('owner', 'created_at')

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(write_only=True, required=True)

class MarketplaceStatSerializer(serializers.Serializer):
    total_products = serializers.IntegerField()
    active_products = serializers.IntegerField()
    total_categories = serializers.IntegerField()
    average_price = serializers.FloatField()

class ReviewSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.username', read_only=True)

    class Meta:
        model = Review
        fields = '__all__'
        read_only_fields = ('author',)