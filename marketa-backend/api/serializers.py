from rest_framework import serializers
from .models import CartItem, Category, Favorite, Product, Order, Review, UserProfile
from django.contrib.auth.models import User
from django.db.models import F, Sum

class CategorySerializer(serializers.ModelSerializer):
    products_count = serializers.IntegerField(source='products.count', read_only=True)

    class Meta:
        model = Category
        fields = ('id', 'name', 'products_count')

class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    owner_username = serializers.CharField(source='owner.username', read_only=True)
    image_url = serializers.SerializerMethodField()
    sold_quantity = serializers.SerializerMethodField()
    sold_value = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            'id', 'name', 'description', 'price', 'quantity', 
            'image', 'image_url',
            'is_active', 'category', 'category_name', 'owner', 
            'owner_username', 'created_at', 'sold_quantity', 'sold_value'
        )
        read_only_fields = ('owner', 'created_at')

    def validate_price(self, value):
        if value < 0:
            raise serializers.ValidationError('Price cannot be negative.')
        return value

    def validate_quantity(self, value):
        if value < 0:
            raise serializers.ValidationError('Quantity cannot be negative.')
        return value

    def get_image_url(self, obj):
        request = self.context.get('request')
        if not obj.image:
            return None
        if request:
            return request.build_absolute_uri(obj.image.url)
        return obj.image.url

    def get_sold_quantity(self, obj):
        return obj.order_set.aggregate(total=Sum('count'))['total'] or 0

    def get_sold_value(self, obj):
        total = obj.order_set.aggregate(total=Sum(F('count') * F('unit_price')))['total'] or 0
        return float(total)

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(write_only=True, required=True)


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=5)
    role = serializers.ChoiceField(choices=UserProfile.ROLE_CHOICES, default=UserProfile.BUYER)

    class Meta:
        model = User
        fields = ('username', 'email', 'first_name', 'last_name', 'password', 'role')

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError('A user with this username already exists.')
        return value

    def create(self, validated_data):
        password = validated_data.pop('password')
        role = validated_data.pop('role', UserProfile.BUYER)
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        UserProfile.objects.create(user=user, role=role)
        return user

class MarketplaceStatSerializer(serializers.Serializer):
    total_products = serializers.IntegerField()
    active_products = serializers.IntegerField()
    total_categories = serializers.IntegerField()
    average_price = serializers.FloatField()


class SellerStatSerializer(serializers.Serializer):
    products_count = serializers.IntegerField()
    sold_quantity = serializers.IntegerField()
    sold_value = serializers.FloatField()

class ReviewSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.username', read_only=True)

    class Meta:
        model = Review
        fields = ('id', 'product', 'author', 'author_name', 'rating', 'comment', 'created_at')
        read_only_fields = ('id', 'product', 'author', 'author_name', 'created_at')


class FavoriteSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = Favorite
        fields = ('id', 'product', 'product_id', 'created_at')
        read_only_fields = ('id', 'created_at')


class CartItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.IntegerField(write_only=True)
    total_price = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = ('id', 'product', 'product_id', 'quantity', 'total_price')

    def get_total_price(self, obj):
        return float(obj.product.price * obj.quantity)


class CartSummarySerializer(serializers.Serializer):
    items = CartItemSerializer(many=True)
    total_items = serializers.IntegerField()
    total_price = serializers.FloatField()


class OrderHistorySerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    buyer_username = serializers.CharField(source='user.username', read_only=True)
    seller_username = serializers.CharField(source='product.owner.username', read_only=True)
    total_price = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = (
            'id', 'product', 'count', 'unit_price', 'created_at',
            'buyer_username', 'seller_username', 'total_price'
        )

    def get_total_price(self, obj):
        return float(obj.unit_price * obj.count)


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()
    can_sell = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'first_name', 'last_name',
            'full_name', 'role', 'can_sell', 'date_joined'
        )
        read_only_fields = ('id', 'username', 'date_joined')

    def get_full_name(self, obj):
        return obj.get_full_name().strip()

    def get_role(self, obj):
        profile, _ = UserProfile.objects.get_or_create(
            user=obj,
            defaults={'role': UserProfile.SELLER if obj.is_staff else UserProfile.BUYER}
        )
        return profile.role

    def get_can_sell(self, obj):
        return self.get_role(obj) == UserProfile.SELLER
