import { computed, Injectable, signal } from '@angular/core';
import { FavoriteEntry, Product } from '../models';
import { NotificationService } from '../shared/notifications/notification.service';
import { ApiService } from './api';

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  favorites = signal<FavoriteEntry[]>([]);
  ids = computed(() => this.favorites().map((favorite) => favorite.product.id));
  products = computed(() => this.favorites().map((favorite) => favorite.product));
  count = computed(() => this.favorites().length);

  constructor(
    private api: ApiService,
    private notifications: NotificationService
  ) {}

  loadFavorites() {
    this.api.listFavorites().subscribe({
      next: (favorites) => {
        this.favorites.set(favorites);
      },
      error: () => this.notifications.error('Не удалось загрузить избранное.'),
    });
  }

  toggle(product: Product | number) {
    const productId = typeof product === 'number' ? product : product.id;

    if (this.isFavorite(productId)) {
      this.api.removeFavorite(productId).subscribe({
        next: () => {
          this.favorites.set(this.favorites().filter((favorite) => favorite.product.id !== productId));
        },
        error: () => this.notifications.error('Не удалось убрать товар из избранного.'),
      });
      return;
    }

    this.api.addFavorite(productId).subscribe({
      next: (favorite) => {
        this.favorites.set([...this.favorites(), favorite]);
      },
      error: () => this.notifications.error('Не удалось добавить товар в избранное.'),
    });
  }

  isFavorite(productId: number) {
    return this.ids().includes(productId);
  }

  clearLocalState() {
    this.favorites.set([]);
  }
}
