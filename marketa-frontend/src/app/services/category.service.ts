import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';

export interface Category {
  id: number;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private apiUrl = 'http://localhost:8000/api/categories/';
  
  // Сигнал для хранения списка категорий
  categories = signal<Category[]>([]);

  constructor(private http: HttpClient) {}

  // Метод для загрузки данных из Django
  fetchCategories(): void {
    this.http.get<Category[]>(this.apiUrl).subscribe({
      next: (data) => this.categories.set(data),
      error: (err) => console.error('Ошибка загрузки категорий:', err)
    });
  }
}