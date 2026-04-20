import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { NotificationService } from '../../shared/notifications/notification.service';
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
  private readonly notifications = inject(NotificationService);
  readonly formatPrice = formatPrice;

  ngOnInit() {
    this.cart.loadCart();
  }

  checkout() {
    this.cart.checkout((ordersCreated) => {
      this.notifications.success(`Заказ оформлен. Создано позиций: ${ordersCreated}.`);
    });
  }
}
