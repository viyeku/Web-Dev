// src/app/app.ts
import { Component, OnInit, inject } from '@angular/core';
import { ApiService } from './services/api';
import { CartService } from './services/cart.service'; // Убедись, что путь верный
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.html',
})
export class AppComponent implements OnInit {
  public api = inject(ApiService);
  public cart = inject(CartService); // Добавь public, чтобы HTML видел 'cart'

  ngOnInit() {
    this.api.loadProducts();
  }
}