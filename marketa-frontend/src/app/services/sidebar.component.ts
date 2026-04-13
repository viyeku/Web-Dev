import { Component, OnInit } from '@angular/core';
import { CategoryService } from './category.service';
import { ApiService } from './api.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  
  constructor(
    public categoryService: CategoryService, // Для списка в меню
    private apiService: ApiService           // Для фильтрации товаров
  ) {}

  ngOnInit(): void {
    // Загружаем категории при инициализации приложения
    this.categoryService.fetchCategories();
  }

  // Метод для фильтрации товаров по категории
  selectCategory(id?: number): void {
    this.apiService.getProducts(id);
  }
}