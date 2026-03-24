import { Routes } from '@angular/router';
import { ProductsComponent } from './pages/products/products';
import { LoginComponent } from './pages/login/login';
import { AccountComponent } from './pages/account/account';

export const routes: Routes = [
  { path: '', component: ProductsComponent },       // Главная страница со списком
  { path: 'login', component: LoginComponent },     // Страница логина
  { path: 'account', component: AccountComponent }, // Личный кабинет
  { path: '**', redirectTo: '' }                    // Если ввели бред — на главную
];