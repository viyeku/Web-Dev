import { Component, inject } from '@angular/core';
import { CartService } from './services/cart.service'; // Проверь путь к файлу!
import { CommonModule } from '@angular/common';
import { Product } from './models'; // Импортируем интерфейс

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './products.component.html'
})
export class ProductsComponent {
  // Используем public, чтобы html видел сервис
  public cartService = inject(CartService); 
  
  // Твои товары (позже заменим на данные из ApiService)
  products: Product[] = [
    { id: 1, name: 'iPhone 15', price: '450000', category: 'Smartphones', owner: 'vilen' },
    { id: 2, name: 'MacBook Air M2', price: '650000', category: 'PC', owner: 'vilen' }
  ];

  addToCart(p: Product) {
    this.cartService.addToCart(p);
  }

  // Метод для получения количества (если используешь логику с quantity)
  getInCartQty(id: number) {
    // В текущей реализации мы храним массив объектов. 
    // Считаем, сколько раз этот ID встречается в корзине:
    return this.cartService.items().filter(i => i.id === id).length;
  }
}