import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './account.html',
  styleUrl: './account.css'
})
export class AccountComponent {
  // Еще 2 контрола [(ngModel)] (Итого будет 4: username, password, email, bio)
  userProfile = {
    email: 'vilen@example.com',
    bio: 'Software Developer from Kazakhstan'
  };

  message: string = '';

  // Событие (click) №4
  updateProfile() {
    console.log('Данные обновлены:', this.userProfile);
    this.message = 'Профиль успешно обновлен!';
    
    // Скроем сообщение через 3 секунды
    setTimeout(() => this.message = '', 3000);
  }
}