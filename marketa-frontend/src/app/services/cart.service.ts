import { computed, Injectable, signal } from '@angular/core';
import { CartEntry, CartSummary, Product } from '../models';
import { NotificationService } from '../shared/notifications/notification.service';
import { extractApiError } from '../shared/ui-utils';
import { ApiService } from './api';

@Injectable({ providedIn: 'root' })
export class CartService {
  items = signal<CartEntry[]>([]);
  totalItems = signal(0);
  totalPrice = signal(0);
  loading = signal(false);

  itemCount = computed(() => this.totalItems());

  constructor(
    private api: ApiService,
    private notifications: NotificationService
  ) {}

  loadCart() {
    this.loading.set(true);
    this.api.getCart().subscribe({
      next: (cart) => this.applyCart(cart),
      error: () => {
        this.notifications.error('Не удалось загрузить корзину.');
        this.loading.set(false);
      },
    });
  }

  addToCart(product: Product) {
    this.api.addToCart(product.id).subscribe({
      next: (cart) => this.applyCart(cart),
      error: () => this.notifications.error('Не удалось добавить товар в корзину.'),
    });
  }

  updateQuantity(productOrId: Product | number, delta: number) {
    const productId = typeof productOrId === 'number' ? productOrId : productOrId.id;
    const entry = this.items().find((item) => item.product.id === productId);

    if (!entry) {
      if (typeof productOrId !== 'number' && delta > 0) {
        this.addToCart(productOrId);
      }
      return;
    }

    const nextQuantity = entry.quantity + delta;

    if (nextQuantity <= 0) {
      this.removeItem(entry.id);
      return;
    }

    this.api.updateCartItem(entry.id, nextQuantity).subscribe({
      next: (cart) => this.applyCart(cart),
      error: () => this.notifications.error('Не удалось обновить корзину.'),
    });
  }

  removeItem(itemId: number) {
    this.api.removeCartItem(itemId).subscribe({
      next: (cart) => this.applyCart(cart),
      error: () => this.notifications.error('Не удалось удалить товар из корзины.'),
    });
  }

  removeFromCart(productId: number) {
    const entry = this.items().find((item) => item.product.id === productId);
    if (entry) {
      this.removeItem(entry.id);
    }
  }

  checkout(onSuccess?: (ordersCreated: number) => void) {
    this.api.checkoutCart().subscribe({
      next: (result) => {
        this.applyCart(result.cart);
        onSuccess?.(result.orders_created);
      },
      error: (error) => {
        this.notifications.error(extractApiError(error) || 'Не удалось оформить заказ.');
      },
    });
  }

  getQuantity(productId: number): number {
    return this.items().find((entry) => entry.product.id === productId)?.quantity ?? 0;
  }

  clearLocalState() {
    this.items.set([]);
    this.totalItems.set(0);
    this.totalPrice.set(0);
  }

  private applyCart(cart: CartSummary) {
    this.items.set(cart.items);
    this.totalItems.set(cart.total_items);
    this.totalPrice.set(cart.total_price);
    this.loading.set(false);
  }
}
