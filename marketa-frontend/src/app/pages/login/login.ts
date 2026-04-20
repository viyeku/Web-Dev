import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { FavoritesService } from '../../services/favorites.service';
import { NotificationService } from '../../shared/notifications/notification.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly cart = inject(CartService);
  private readonly favorites = inject(FavoritesService);
  private readonly notifications = inject(NotificationService);

  loginData = {
    username: '',
    password: '',
  };

  onLogin() {
    this.auth.login(this.loginData).subscribe({
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

        if (error.status === 401) {
          this.notifications.error('Неверный логин или пароль.');
          return;
        }

        this.notifications.error('Не удалось выполнить вход.');
      },
    });
  }
}
