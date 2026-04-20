import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, timeout } from 'rxjs';
import { Product, ReviewEntry } from '../../models';
import { ApiService } from '../../services/api';
import { CartService } from '../../services/cart.service';
import { FavoritesService } from '../../services/favorites.service';
import { formatDateTime, formatPrice, productImageUrl } from '../../shared/ui-utils';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.css',
})
export class ProductDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly api = inject(ApiService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  readonly cart = inject(CartService);
  readonly favorites = inject(FavoritesService);
  readonly formatPrice = formatPrice;
  readonly formatDate = formatDateTime;
  readonly productImageUrl = productImageUrl;

  product: Product | null = null;
  reviews: ReviewEntry[] = [];
  loading = true;
  loadingReviews = false;
  savingReview = false;
  errorMessage = '';
  reviewErrorMessage = '';
  reviewMessage = '';
  reviewForm = {
    rating: 5,
    comment: '',
  };

  ngOnInit() {
    this.cart.loadCart();
    this.favorites.loadFavorites();

    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.loading = false;
      this.errorMessage = 'Товар не найден.';
      this.cdr.detectChanges();
      return;
    }

    this.api
      .getProduct(id)
      .pipe(
        timeout(8000),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (product) => {
          this.product = product;
          this.loadReviews(product.id);
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.product = null;
          this.errorMessage =
            error?.name === 'TimeoutError'
              ? 'Сервер слишком долго отвечает. Проверьте, что Django запущен.'
              : 'Не удалось загрузить товар.';
          this.cdr.detectChanges();
        },
      });
  }

  createReview() {
    if (!this.product) {
      return;
    }

    this.reviewMessage = '';
    this.reviewErrorMessage = '';

    if (this.reviewForm.rating < 1 || this.reviewForm.rating > 5) {
      this.reviewErrorMessage = 'Оценка должна быть от 1 до 5.';
      this.cdr.detectChanges();
      return;
    }

    if (!this.reviewForm.comment.trim()) {
      this.reviewErrorMessage = 'Напишите текст отзыва.';
      this.cdr.detectChanges();
      return;
    }

    this.savingReview = true;
    this.cdr.detectChanges();

    this.api
      .createReview(this.product.id, {
        rating: this.reviewForm.rating,
        comment: this.reviewForm.comment.trim(),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (review) => {
          this.reviews = [review, ...this.reviews];
          this.reviewForm = { rating: 5, comment: '' };
          this.reviewMessage = 'Отзыв добавлен.';
          this.savingReview = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.reviewErrorMessage = 'Не удалось добавить отзыв.';
          this.savingReview = false;
          this.cdr.detectChanges();
        },
      });
  }

  goBack() {
    if (window.history.length > 1) {
      this.location.back();
      return;
    }

    this.router.navigate(['/products']);
  }

  private loadReviews(productId: number) {
    this.loadingReviews = true;
    this.reviewErrorMessage = '';
    this.cdr.detectChanges();

    this.api
      .listReviews(productId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (reviews) => {
          this.reviews = reviews;
          this.loadingReviews = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.reviewErrorMessage = 'Не удалось загрузить отзывы.';
          this.loadingReviews = false;
          this.cdr.detectChanges();
        },
      });
  }
}
