import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewEncapsulation, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import { CartService } from './services/cart.service';
import { FavoritesService } from './services/favorites.service';
import { NotificationHostComponent } from './shared/notifications/notification-host';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet, RouterLink, RouterLinkActive, NotificationHostComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
  encapsulation: ViewEncapsulation.None,
})
export class AppComponent implements OnInit {
  readonly auth = inject(AuthService);
  readonly cart = inject(CartService);
  readonly favorites = inject(FavoritesService);
  readonly router = inject(Router);
  searchTerm = '';

  ngOnInit() {
    this.auth.restoreSession().subscribe((user) => {
      if (user) {
        this.cart.loadCart();
        this.favorites.loadFavorites();
      }
    });
  }

  get showAppShell(): boolean {
    return this.auth.isAuthenticated() && !['/login', '/register'].includes(this.router.url);
  }

  get isCheckingSession(): boolean {
    return this.auth.hasToken() && !this.auth.profileLoaded();
  }

  logout() {
    this.auth.logout().subscribe(() => {
      this.cart.clearLocalState();
      this.favorites.clearLocalState();
      this.router.navigate(['/login']);
    });
  }

  search() {
    this.router.navigate(['/products'], {
      queryParams: { q: this.searchTerm.trim() || null },
    });
  }
}
