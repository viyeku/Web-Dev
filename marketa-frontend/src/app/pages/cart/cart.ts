import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { formatPrice } from '../../shared/ui-utils';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
export class CartComponent implements OnInit {
  readonly cart = inject(CartService);
  readonly formatPrice = formatPrice;
  message = '';

  ngOnInit() {
    this.cart.loadCart();
  }

  checkout() {
    this.message = '';
    this.cart.checkout((ordersCreated) => {
      this.message = `Заказ оформлен. Создано позиций: ${ordersCreated}.`;
    });
  }

}
