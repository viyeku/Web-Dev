import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { OrderHistoryEntry } from '../../models';
import { ApiService } from '../../services/api';
import { AuthService } from '../../services/auth.service';
import { formatDateTime, formatPrice } from '../../shared/ui-utils';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './account.html',
  styleUrl: './account.css',
})
export class AccountComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  readonly auth = inject(AuthService);
  readonly formatPrice = formatPrice;
  readonly formatDate = formatDateTime;

  form = {
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    role: '',
  };

  orders: OrderHistoryEntry[] = [];
  sales: OrderHistoryEntry[] = [];
  loadingOrders = false;
  loadingSales = false;
  message = '';
  errorMessage = '';
  historyErrorMessage = '';

  ngOnInit() {
    const user = this.auth.user();

    if (user) {
      this.patchForm();
      this.loadHistory();
      return;
    }

    this.auth
      .fetchProfile()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.patchForm();
          this.loadHistory();
          this.cdr.detectChanges();
        },
        error: () => {
          this.errorMessage = 'Не удалось загрузить профиль.';
          this.cdr.detectChanges();
        },
      });
  }

  updateProfile() {
    this.message = '';
    this.errorMessage = '';

    this.auth
      .updateProfile({
        email: this.form.email,
        first_name: this.form.first_name,
        last_name: this.form.last_name,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.message = 'Профиль обновлён.';
          this.cdr.detectChanges();
        },
        error: () => {
          this.errorMessage = 'Не удалось сохранить изменения.';
          this.cdr.detectChanges();
        },
      });
  }

  private loadHistory() {
    this.historyErrorMessage = '';
    this.loadingOrders = true;
    this.loadingSales = this.auth.canSell();
    this.cdr.detectChanges();

    this.api
      .listOrders()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (orders) => {
          this.orders = orders;
          this.loadingOrders = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.loadingOrders = false;
          this.historyErrorMessage = 'Не удалось загрузить историю заказов.';
          this.cdr.detectChanges();
        },
      });

    if (!this.auth.canSell()) {
      return;
    }

    this.api
      .listSales()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (sales) => {
          this.sales = sales;
          this.loadingSales = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.loadingSales = false;
          this.historyErrorMessage = 'Не удалось загрузить историю продаж.';
          this.cdr.detectChanges();
        },
      });
  }

  private patchForm() {
    const user = this.auth.user();
    if (!user) {
      return;
    }

    this.form = {
      username: user.username,
      email: user.email || '',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      role: user.role,
    };
  }
}
