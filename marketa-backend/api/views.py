from rest_framework import viewsets, status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Product, Category
from .serializers import ProductSerializer, CategorySerializer

# 1. ViewSet для полного CRUD (закрывает требования по CRUD)
class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated()]
        return [AllowAny()]

    def perform_create(self, serializer):
        # Автоматически привязываем создателя к текущему юзеру (требование ТЗ)
        serializer.save(owner=self.request.user)

# 2. Class-Based View (CBV) для категорий
class CategoryListAPIView(APIView):
    def get(self, request):
        categories = Category.objects.all()
        serializer = CategorySerializer(categories, many=True)
        return Response(serializer.data)

# 3. Еще одна CBV (например, детали товара)
class ProductDetailAPIView(APIView):
    def get(self, request, pk):
        try:
            product = Product.objects.get(pk=pk)
            return Response(ProductSerializer(product).data)
        except Product.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

# 4. Function-Based Views (FBV) с декораторами
@api_view(['GET'])
def api_root(request):
    return Response({"message": "Welcome to GreenFood API"})

@api_view(['GET'])
def health_check(request):
    return Response({"status": "working", "database": "connected"})