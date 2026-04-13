import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Product } from '../models'; // Ensure this path is correct

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'http://localhost:8000/api/products/';
  
  // This is the 'products' signal the error mentioned
  products = signal<Product[]>([]);

  constructor(private http: HttpClient) {}

  /**
   * Fetches products from Django.
   * @param categoryId Optional ID to filter by category
   * @param search Optional string to search by name
   */
  getProducts(categoryId?: number, search?: string): void {
    let params = new HttpParams();
    
    if (categoryId) {
      params = params.set('category', categoryId.toString());
    }
    if (search) {
      params = params.set('search', search);
    }

    this.http.get<Product[]>(this.apiUrl, { params }).subscribe({
      next: (data) => {
        this.products.set(data); // Update the signal with new data
      },
      error: (err) => console.error('API Error:', err)
    });
  }
}