import { Routes } from '@angular/router';
import { authGuard, loginRedirectGuard } from './auth.guard';
import { ProductsComponent } from './products.component';
import { LoginComponent } from './pages/login/login';
import { ProductDetailComponent } from './pages/product-detail/product-detail';
import { FavoritesComponent } from './pages/favorites/favorites';
import { MyProductsComponent } from './pages/my-products/my-products';
import { AccountComponent } from './pages/account/account';
import { RegisterComponent } from './pages/register/register';
import { CartComponent } from './pages/cart/cart';

export const routes: Routes = [
  { path: 'login', component: LoginComponent, canActivate: [loginRedirectGuard] },
  { path: 'register', component: RegisterComponent, canActivate: [loginRedirectGuard] },
  { path: 'products/:id', component: ProductDetailComponent, canActivate: [authGuard] },
  { path: 'products', component: ProductsComponent, canActivate: [authGuard] },
  { path: 'favorites', component: FavoritesComponent, canActivate: [authGuard] },
  { path: 'cart', component: CartComponent, canActivate: [authGuard] },
  { path: 'my-products', component: MyProductsComponent, canActivate: [authGuard] },
  { path: 'account', component: AccountComponent, canActivate: [authGuard] },
  { path: '', redirectTo: 'products', pathMatch: 'full' },
  { path: '**', redirectTo: 'products' },
];
