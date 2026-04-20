from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import (
    api_root, cart_add_view, cart_checkout_view, cart_item_view, cart_view,
    favorite_detail_view, favorites_view, get_stats, logout_view, me_view,
    order_history_view, product_reviews_view, register_view, sales_history_view, seller_stats_view,
    CategoryListAPIView, ProductDetailAPIView,
    ProductViewSet
)

router = DefaultRouter()
router.register(r'products', ProductViewSet, basename='product')

urlpatterns = [
    path('', api_root, name='api-root'),
    path('stats/', get_stats, name='api-stats'),

    path('categories/', CategoryListAPIView.as_view(), name='category-list'),
    path('products-detail/<int:pk>/', ProductDetailAPIView.as_view(), name='product-manual-detail'),

    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('register/', register_view, name='register'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', logout_view),
    path('me/', me_view, name='me'),
    path('cart/', cart_view, name='cart'),
    path('cart/add/', cart_add_view, name='cart-add'),
    path('cart/items/<int:item_id>/', cart_item_view, name='cart-item'),
    path('cart/checkout/', cart_checkout_view, name='cart-checkout'),
    path('favorites/', favorites_view, name='favorites'),
    path('favorites/<int:product_id>/', favorite_detail_view, name='favorite-detail'),
    path('orders/', order_history_view, name='order-history'),
    path('sales/', sales_history_view, name='sales-history'),
    path('products/<int:product_id>/reviews/', product_reviews_view, name='product-reviews'),
    path('seller/stats/', seller_stats_view, name='seller-stats'),
    
    path('', include(router.urls)),
]
