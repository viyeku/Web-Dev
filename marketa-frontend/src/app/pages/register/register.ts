import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { FavoritesService } from '../../services/favorites.service';
import { NotificationService } from '../../shared/notifications/notification.service';
import { extractApiError } from '../../shared/ui-utils';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class RegisterComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly cart = inject(CartService);
  private readonly favorites = inject(FavoritesService);
  private readonly notifications = inject(NotificationService);

  form = {
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    role: 'buyer' as const,
  };

  submit() {
    this.auth.register(this.form).subscribe({
      next: () => {
        this.cart.loadCart();
        this.favorites.loadFavorites();
        this.router.navigate(['/products']);
      },
      error: (error) => {
        if (error.status === 0) {
          this.notifications.error('Backend недоступен. Убедитесь, что Django запущен на http://localhost:8000.');
          return;
        }

        this.notifications.error(extractApiError(error) || 'Не удалось зарегистрироваться.');
      },
    });
  }
}
