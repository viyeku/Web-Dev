from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import ProductViewSet, CategoryListAPIView, api_root, health_check
from .views import CategoryViewSet # Добавь импорт для CategoryViewSet

router = DefaultRouter()
router.register(r'products', ProductViewSet)
# api/urls.py
router.register(r'categories', CategoryViewSet)

urlpatterns = [
    path('', api_root),
    path('health/', health_check),
    path('categories/', CategoryListAPIView.as_view()),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('', include(router.urls)), # Эндпоинты для CRUD продуктов
]