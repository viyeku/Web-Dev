from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import (
    api_root, get_stats, logout_view,
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
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', logout_view),
    
    path('', include(router.urls)),
]