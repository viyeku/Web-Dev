import { Injectable, signal, computed } from '@angular/core';
import { Product } from '../models';

@Injectable({ providedIn: 'root' })
export class CartService {
  // Назовем так, чтобы и старые, и новые компоненты понимали
  items = signal<Product[]>([]);
  
  // Геттер для совместимости с кодом, который ищет cartItems
  get cartItems() {
    return this.items();
  }

  count = computed(() => this.items().length);

  addToCart(product: Product) {
    this.items.update(prev => [...prev, product]);
  }

  // Исправляем ошибку "not assignable to parameter of type number"
  // Теперь метод может принимать и объект, и число
  updateQuantity(itemOrId: any, delta: number) {
    const id = typeof itemOrId === 'object' ? itemOrId.id : itemOrId;
    console.log(`Обновляем товар ${id} на ${delta}`);
    // Здесь будет логика изменения количества
  }

  removeFromCart(productId: number) {
    this.items.update(prev => prev.filter(p => p.id !== productId));
  }
}