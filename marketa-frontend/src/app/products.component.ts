import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, timeout } from 'rxjs';
import { ProductCardComponent } from './components/product-card/product-card';
import { Category, Product } from './models';
import { ApiService } from './services/api';
import { CartService } from './services/cart.service';
import { FavoritesService } from './services/favorites.service';
import { formatPrice } from './shared/ui-utils';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule, ProductCardComponent],
  templateUrl: './products.component.html',
})
export class ProductsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly cart = inject(CartService);
  readonly favorites = inject(FavoritesService);
  readonly formatPrice = formatPrice;

  categories: Category[] = [];
  products: Product[] = [];
  loading = true;
  errorMessage = '';
  searchTerm = '';
  selectedCategoryId: number | null = null;
  ordering = '-created_at';
  private requestId = 0;

  ngOnInit() {
    this.cart.loadCart();
    this.favorites.loadFavorites();
    this.loadCatalog();

    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        this.searchTerm = params.get('q') || '';
        this.loadProducts();
      });
  }

  loadCatalog() {
    this.api
      .listCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (categories) => {
          this.categories = categories;
          this.cdr.detectChanges();
        },
        error: () => {
          this.errorMessage = 'Не удалось загрузить категории.';
          this.cdr.detectChanges();
        },
      });
  }

  loadProducts() {
    const currentRequestId = ++this.requestId;
    this.loading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.api
      .listProducts({
        category: this.selectedCategoryId,
        search: this.searchTerm.trim() || undefined,
        ordering: this.ordering,
        isActive: true,
      })
      .pipe(
        timeout(8000),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          if (currentRequestId === this.requestId) {
            this.loading = false;
            this.cdr.detectChanges();
          }
        })
      )
      .subscribe({
        next: (products) => {
          if (currentRequestId === this.requestId) {
            this.products = products;
            this.cdr.detectChanges();
          }
        },
        error: (error) => {
          if (currentRequestId !== this.requestId) {
            return;
          }

          this.products = [];
          this.errorMessage =
            error?.name === 'TimeoutError'
              ? 'Сервер слишком долго отвечает. Проверьте, что Django запущен.'
              : 'Не удалось загрузить товары. Проверьте Django API.';
          this.cdr.detectChanges();
        },
      });
  }

  selectCategory(categoryId: number | null) {
    this.selectedCategoryId = categoryId;
    this.loadProducts();
  }

  changeOrdering(ordering: string) {
    this.ordering = ordering;
    this.loadProducts();
  }

  clearFilters() {
    this.selectedCategoryId = null;
    this.searchTerm = '';
    this.ordering = '-created_at';
    this.router.navigate(['/products']);
    this.loadProducts();
  }

  trackById(_: number, item: Product) {
    return item.id;
  }
}
