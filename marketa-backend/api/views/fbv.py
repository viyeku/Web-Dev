from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from ..models import Product, Category

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

@api_view(['GET'])
def get_stats(request):
    data = {
        "total_products": Product.objects.count(),
        "total_categories": Category.objects.count(),
    }
    return Response(data)