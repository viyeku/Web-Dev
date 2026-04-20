import { computed, Injectable, signal } from '@angular/core';
import { FavoriteEntry, Product } from '../models';
import { ApiService } from './api';

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  favorites = signal<FavoriteEntry[]>([]);
  ids = computed(() => this.favorites().map((favorite) => favorite.product.id));
  products = computed(() => this.favorites().map((favorite) => favorite.product));
  count = computed(() => this.favorites().length);
  errorMessage = signal('');

  constructor(private api: ApiService) {}

  loadFavorites() {
    this.api.listFavorites().subscribe({
      next: (favorites) => {
        this.favorites.set(favorites);
        this.errorMessage.set('');
      },
      error: () => this.errorMessage.set('Не удалось загрузить избранное.'),
    });
  }

  toggle(product: Product | number) {
    const productId = typeof product === 'number' ? product : product.id;

    if (this.isFavorite(productId)) {
      this.api.removeFavorite(productId).subscribe({
        next: () => {
          this.favorites.set(this.favorites().filter((favorite) => favorite.product.id !== productId));
          this.errorMessage.set('');
        },
        error: () => this.errorMessage.set('Не удалось убрать товар из избранного.'),
      });
      return;
    }

    this.api.addFavorite(productId).subscribe({
      next: (favorite) => {
        this.favorites.set([...this.favorites(), favorite]);
        this.errorMessage.set('');
      },
      error: () => this.errorMessage.set('Не удалось добавить товар в избранное.'),
    });
  }

  isFavorite(productId: number) {
    return this.ids().includes(productId);
  }

  clearLocalState() {
    this.favorites.set([]);
    this.errorMessage.set('');
  }
}
