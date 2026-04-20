from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from django.db.models import Q
from ..models import CartItem, Favorite, Product
from ..permissions import IsSellerOwnerOrReadOnly, is_seller
from ..serializers import ProductSerializer

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsSellerOwnerOrReadOnly]
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    ordering_fields = ['price', 'created_at', 'name']

    def get_queryset(self):
        queryset = Product.objects.filter(is_deleted=False)

        category_id = self.request.query_params.get('category')
        is_active = self.request.query_params.get('is_active')
        search = self.request.query_params.get('search')
        ordering = self.request.query_params.get('ordering')

        if category_id:
            queryset = queryset.filter(category_id=category_id)

        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')

        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search) |
                Q(owner__username__icontains=search) |
                Q(owner__first_name__icontains=search) |
                Q(owner__last_name__icontains=search)
            )

        if ordering in self.ordering_fields or ordering in [f'-{field}' for field in self.ordering_fields]:
            queryset = queryset.order_by(ordering)

        return queryset

    def get_permissions(self):
        if self.action == 'mine':
            return [IsAuthenticated()]
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsSellerOwnerOrReadOnly()]

    def perform_create(self, serializer):
        if not is_seller(self.request.user):
            raise PermissionDenied('Only sellers can publish products.')

        serializer.save(owner=self.request.user)

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.is_deleted = True
        instance.save(update_fields=['is_active', 'is_deleted'])

        # Product stays in DB for order/sales history, but disappears from active user lists.
        Favorite.objects.filter(product=instance).delete()
        CartItem.objects.filter(product=instance).delete()

    @action(detail=False, methods=['get'])
    def mine(self, request):
        queryset = self.filter_queryset(self.get_queryset().filter(owner=request.user))
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
