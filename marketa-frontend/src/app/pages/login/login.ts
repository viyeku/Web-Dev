import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { FavoritesService } from '../../services/favorites.service';

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

  loginData = {
    username: '',
    password: '',
  };

  errorMessage = '';

  onLogin() {
    this.errorMessage = '';
    this.auth.login(this.loginData).subscribe({
      next: () => {
        this.cart.loadCart();
        this.favorites.loadFavorites();
        this.router.navigate(['/products']);
      },
      error: (error) => {
        if (error.status === 0) {
          this.errorMessage = 'Backend недоступен. Убедитесь, что Django запущен на http://localhost:8000.';
          return;
        }

        if (error.status === 401) {
          this.errorMessage = 'Неверный логин или пароль.';
          return;
        }

        this.errorMessage = 'Не удалось выполнить вход.';
      },
    });
  }
}
