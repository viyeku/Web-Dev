import { CommonModule } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Product } from '../../models';
import { CartService } from '../../services/cart.service';
import { FavoritesService } from '../../services/favorites.service';
import { formatPrice, productImageUrl } from '../../shared/ui-utils';

type ProductCardMode = 'catalog' | 'favorites';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './product-card.html',
})
export class ProductCardComponent {
  @Input({ required: true }) product!: Product;
  @Input() mode: ProductCardMode = 'catalog';

  readonly cart = inject(CartService);
  readonly favorites = inject(FavoritesService);
  readonly formatPrice = formatPrice;
  readonly productImageUrl = productImageUrl;
}
