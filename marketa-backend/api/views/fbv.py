from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.db import transaction
from django.db.models import Avg, F, Sum
from ..models import Cart, CartItem, Category, Favorite, Order, Product, Review
from ..permissions import is_seller
from ..serializers import (
    CartItemSerializer, FavoriteSerializer, OrderHistorySerializer,
    ProductSerializer, RegisterSerializer, ReviewSerializer, UserSerializer
)

@api_view(['GET'])
def api_root(request):
    return Response({
        "message": "Welcome to Marketa API",
        "version": "1.0"
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    try:
        # Получаем refresh токен, который пришлет Angular
        refresh_token = request.data["refresh"]
        token = RefreshToken(refresh_token)
        # Отправляем его в черный список
        token.blacklist()
        return Response({"detail": "Successfully logged out."}, status=status.HTTP_205_RESET_CONTENT)
    except Exception as e:
        return Response({"error": "Invalid or missing token"}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def register_view(request):
    serializer = RegisterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()
    refresh = RefreshToken.for_user(user)

    return Response({
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "user": UserSerializer(user).data,
    }, status=status.HTTP_201_CREATED)

@api_view(['GET'])
def get_stats(request):
    data = {
        "total_products": Product.objects.filter(is_deleted=False).count(),
        "active_products": Product.objects.filter(is_active=True, is_deleted=False).count(),
        "total_categories": Category.objects.count(),
        "average_price": Product.objects.filter(is_deleted=False).aggregate(avg=Avg('price'))['avg'] or 0,
    }
    return Response(data)


def get_user_cart(user):
    cart, _ = Cart.objects.get_or_create(user=user)
    return cart


def touch_cart(cart):
    cart.save(update_fields=['updated_at'])


def serialize_cart(cart, request=None):
    items = cart.items.select_related('product', 'product__category', 'product__owner').all()
    total_items = sum(item.quantity for item in items)
    total_price = sum(item.product.price * item.quantity for item in items)

    return {
        "items": CartItemSerializer(items, many=True, context={'request': request}).data,
        "total_items": total_items,
        "total_price": float(total_price),
    }


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def cart_view(request):
    return Response(serialize_cart(get_user_cart(request.user), request))


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cart_add_view(request):
    product_id = request.data.get('product_id')
    try:
        quantity = int(request.data.get('quantity', 1))
    except (TypeError, ValueError):
        return Response({"error": "Quantity must be a number."}, status=status.HTTP_400_BAD_REQUEST)

    if quantity < 1:
        return Response({"error": "Quantity must be at least 1."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        product = Product.objects.get(pk=product_id, is_active=True, is_deleted=False)
    except Product.DoesNotExist:
        return Response({"error": "Product not found."}, status=status.HTTP_404_NOT_FOUND)

    cart = get_user_cart(request.user)
    item, created = CartItem.objects.get_or_create(
        cart=cart,
        product=product,
        defaults={'quantity': quantity}
    )

    if not created:
        item.quantity += quantity
        item.save()

    touch_cart(cart)
    return Response(serialize_cart(cart, request), status=status.HTTP_200_OK)


@api_view(['PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def cart_item_view(request, item_id):
    cart = get_user_cart(request.user)

    try:
        item = cart.items.get(pk=item_id)
    except CartItem.DoesNotExist:
        return Response({"error": "Cart item not found."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'DELETE':
        item.delete()
        touch_cart(cart)
        return Response(serialize_cart(cart, request))

    try:
        quantity = int(request.data.get('quantity', item.quantity))
    except (TypeError, ValueError):
        return Response({"error": "Quantity must be a number."}, status=status.HTTP_400_BAD_REQUEST)
    if quantity < 1:
        item.delete()
        touch_cart(cart)
        return Response(serialize_cart(cart, request))

    item.quantity = quantity
    item.save()
    touch_cart(cart)
    return Response(serialize_cart(cart, request))


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cart_checkout_view(request):
    cart = get_user_cart(request.user)
    items = list(cart.items.select_related('product'))

    if not items:
        return Response({"error": "Cart is empty."}, status=status.HTTP_400_BAD_REQUEST)

    with transaction.atomic():
        for item in items:
            product = item.product
            if product.quantity < item.quantity:
                return Response(
                    {"error": f"Not enough stock for {product.name}."},
                    status=status.HTTP_400_BAD_REQUEST
                )

        created_orders = []
        for item in items:
            product = item.product
            product.quantity -= item.quantity
            product.save(update_fields=['quantity'])
            created_orders.append(Order.objects.create(
                user=request.user,
                product=product,
                count=item.quantity,
                unit_price=product.price
            ))

        cart.items.all().delete()
        touch_cart(cart)

    return Response({
        "orders_created": len(created_orders),
        "cart": serialize_cart(cart, request),
    }, status=status.HTTP_201_CREATED)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def favorites_view(request):
    if request.method == 'GET':
        favorites = Favorite.objects.filter(user=request.user, product__is_deleted=False).select_related(
            'product', 'product__category', 'product__owner'
        )
        return Response(FavoriteSerializer(favorites, many=True, context={'request': request}).data)

    product_id = request.data.get('product_id')
    try:
        product = Product.objects.get(pk=product_id, is_active=True, is_deleted=False)
    except Product.DoesNotExist:
        return Response({"error": "Product not found."}, status=status.HTTP_404_NOT_FOUND)

    favorite, created = Favorite.objects.get_or_create(user=request.user, product=product)
    serializer = FavoriteSerializer(favorite, context={'request': request})
    return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def favorite_detail_view(request, product_id):
    Favorite.objects.filter(user=request.user, product_id=product_id).delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def order_history_view(request):
    orders = Order.objects.filter(user=request.user).select_related(
        'product', 'product__category', 'product__owner'
    ).order_by('-created_at')
    return Response(OrderHistorySerializer(orders, many=True, context={'request': request}).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def sales_history_view(request):
    if not is_seller(request.user):
        return Response({"error": "Only sellers can view sales history."}, status=status.HTTP_403_FORBIDDEN)

    orders = Order.objects.filter(product__owner=request.user).select_related(
        'user', 'product', 'product__category', 'product__owner'
    ).order_by('-created_at')
    return Response(OrderHistorySerializer(orders, many=True, context={'request': request}).data)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def product_reviews_view(request, product_id):
    try:
        product = Product.objects.get(pk=product_id, is_deleted=False)
    except Product.DoesNotExist:
        return Response({"error": "Product not found."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        reviews = Review.objects.filter(product=product).select_related('author').order_by('-created_at')
        return Response(ReviewSerializer(reviews, many=True).data)

    serializer = ReviewSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save(author=request.user, product=product)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def seller_stats_view(request):
    if not is_seller(request.user):
        return Response({"error": "Only sellers can view sales stats."}, status=status.HTTP_403_FORBIDDEN)

    products = Product.objects.filter(owner=request.user, is_deleted=False)
    orders = Order.objects.filter(product__owner=request.user).select_related('product')
    sold_quantity = orders.aggregate(total=Sum('count'))['total'] or 0
    sold_value = orders.aggregate(total=Sum(F('count') * F('unit_price')))['total'] or 0

    return Response({
        "products_count": products.count(),
        "sold_quantity": sold_quantity,
        "sold_value": float(sold_value),
        "products": ProductSerializer(products, many=True, context={'request': request}).data,
    })


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def me_view(request):
    user = request.user

    if request.method == 'GET':
        serializer = UserSerializer(user)
        return Response(serializer.data)

    serializer = UserSerializer(user, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)
