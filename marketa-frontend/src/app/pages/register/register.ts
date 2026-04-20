import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { FavoritesService } from '../../services/favorites.service';

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

  form = {
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    role: 'buyer' as const,
  };

  errorMessage = '';

  submit() {
    this.errorMessage = '';
    this.auth.register(this.form).subscribe({
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

        this.errorMessage =
          error?.error?.username?.[0] ||
          error?.error?.email?.[0] ||
          error?.error?.password?.[0] ||
          'Не удалось зарегистрироваться.';
      },
    });
  }
}
