import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Product } from '../models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private apiUrl = 'http://127.0.0.1:8000/api/products/';

  // Добавляем свойство products как сигнал
  products = signal<Product[]>([]);

  loadProducts() {
    this.http.get<Product[]>(this.apiUrl).subscribe(data => {
      this.products.set(data);
    });
  }
}