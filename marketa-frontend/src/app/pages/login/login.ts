import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  // Данные для [(ngModel)] — требование: 4 контрола (сделаем 2 тут, 2 в профиле)
  loginData = {
    username: '',
    password: ''
  };

  errorMessage: string = '';

  constructor(private router: Router) {}

  // Метод для (click) события
  onLogin() {
    if (this.loginData.username === 'admin' && this.loginData.password === '12345') {
      console.log('Успешный вход:', this.loginData);
      this.router.navigate(['/products']); // Перенаправление после входа
    } else {
      this.errorMessage = 'Неверный логин или пароль!';
    }
  }
}