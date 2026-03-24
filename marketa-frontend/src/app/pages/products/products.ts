import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './products.html', // проверь, чтобы имя файла совпадало
  styleUrl: './products.css'
})
export class ProductsComponent { // ДОЛЖНО БЫТЬ ТАК
  // твой код (продукты, фильтры и т.д.)
}