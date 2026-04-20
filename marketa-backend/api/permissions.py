from rest_framework.permissions import SAFE_METHODS, BasePermission
from .models import UserProfile


def is_seller(user):
    if not user or not user.is_authenticated:
        return False

    profile, _ = UserProfile.objects.get_or_create(
        user=user,
        defaults={'role': UserProfile.SELLER if user.is_staff else UserProfile.BUYER}
    )
    return profile.role == UserProfile.SELLER


class IsSellerOwnerOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True

        return is_seller(request.user)

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True

        return obj.owner == request.user and is_seller(request.user)
