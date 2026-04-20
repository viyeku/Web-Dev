import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CartSummary,
  Category,
  FavoriteEntry,
  MarketplaceStats,
  OrderHistoryEntry,
  Product,
  ProductCreatePayload,
  ReviewCreatePayload,
  ReviewEntry,
  SellerStats,
} from '../models';
import { API_BASE_URL } from '../shared/app-constants';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly apiUrl = API_BASE_URL;

  constructor(private http: HttpClient) {}

  listProducts(filters?: {
    category?: number | null;
    search?: string;
    ordering?: string;
    isActive?: boolean;
  }): Observable<Product[]> {
    let params = new HttpParams();

    if (filters?.category) {
      params = params.set('category', String(filters.category));
    }
    if (filters?.search) {
      params = params.set('search', filters.search);
    }
    if (filters?.ordering) {
      params = params.set('ordering', filters.ordering);
    }
    if (filters?.isActive !== undefined) {
      params = params.set('is_active', String(filters.isActive));
    }

    return this.http.get<Product[]>(`${this.apiUrl}/products/`, { params });
  }

  getProduct(productId: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/products/${productId}/`);
  }

  listMyProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/products/mine/`);
  }

  createProduct(payload: ProductCreatePayload, image?: File | null): Observable<Product> {
    if (!image) {
      return this.http.post<Product>(`${this.apiUrl}/products/`, payload);
    }

    const formData = new FormData();
    formData.append('name', payload.name);
    formData.append('description', payload.description);
    formData.append('price', String(payload.price));
    formData.append('quantity', String(payload.quantity));
    formData.append('category', String(payload.category));
    formData.append('is_active', String(payload.is_active));
    formData.append('image', image);

    return this.http.post<Product>(`${this.apiUrl}/products/`, formData);
  }

  updateProduct(productId: number, payload: Partial<ProductCreatePayload>, image?: File | null): Observable<Product> {
    if (image) {
      const formData = new FormData();

      if (payload.name !== undefined) {
        formData.append('name', payload.name);
      }
      if (payload.description !== undefined) {
        formData.append('description', payload.description);
      }
      if (payload.price !== undefined) {
        formData.append('price', String(payload.price));
      }
      if (payload.quantity !== undefined) {
        formData.append('quantity', String(payload.quantity));
      }
      if (payload.category !== undefined && payload.category !== null) {
        formData.append('category', String(payload.category));
      }
      if (payload.is_active !== undefined) {
        formData.append('is_active', String(payload.is_active));
      }

      formData.append('image', image);
      return this.http.patch<Product>(`${this.apiUrl}/products/${productId}/`, formData);
    }

    return this.http.patch<Product>(`${this.apiUrl}/products/${productId}/`, payload);
  }

  listCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/categories/`);
  }

  getStats(): Observable<MarketplaceStats> {
    return this.http.get<MarketplaceStats>(`${this.apiUrl}/stats/`);
  }

  getCart(): Observable<CartSummary> {
    return this.http.get<CartSummary>(`${this.apiUrl}/cart/`);
  }

  addToCart(productId: number, quantity = 1): Observable<CartSummary> {
    return this.http.post<CartSummary>(`${this.apiUrl}/cart/add/`, { product_id: productId, quantity });
  }

  updateCartItem(itemId: number, quantity: number): Observable<CartSummary> {
    return this.http.patch<CartSummary>(`${this.apiUrl}/cart/items/${itemId}/`, { quantity });
  }

  removeCartItem(itemId: number): Observable<CartSummary> {
    return this.http.delete<CartSummary>(`${this.apiUrl}/cart/items/${itemId}/`);
  }

  checkoutCart(): Observable<{ orders_created: number; cart: CartSummary }> {
    return this.http.post<{ orders_created: number; cart: CartSummary }>(`${this.apiUrl}/cart/checkout/`, {});
  }

  listFavorites(): Observable<FavoriteEntry[]> {
    return this.http.get<FavoriteEntry[]>(`${this.apiUrl}/favorites/`);
  }

  addFavorite(productId: number): Observable<FavoriteEntry> {
    return this.http.post<FavoriteEntry>(`${this.apiUrl}/favorites/`, { product_id: productId });
  }

  removeFavorite(productId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/favorites/${productId}/`);
  }

  getSellerStats(): Observable<SellerStats> {
    return this.http.get<SellerStats>(`${this.apiUrl}/seller/stats/`);
  }

  listOrders(): Observable<OrderHistoryEntry[]> {
    return this.http.get<OrderHistoryEntry[]>(`${this.apiUrl}/orders/`);
  }

  listSales(): Observable<OrderHistoryEntry[]> {
    return this.http.get<OrderHistoryEntry[]>(`${this.apiUrl}/sales/`);
  }

  listReviews(productId: number): Observable<ReviewEntry[]> {
    return this.http.get<ReviewEntry[]>(`${this.apiUrl}/products/${productId}/reviews/`);
  }

  createReview(productId: number, payload: ReviewCreatePayload): Observable<ReviewEntry> {
    return this.http.post<ReviewEntry>(`${this.apiUrl}/products/${productId}/reviews/`, payload);
  }
}
