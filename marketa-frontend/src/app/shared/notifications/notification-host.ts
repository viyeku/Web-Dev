import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { NotificationService } from './notification.service';

@Component({
  selector: 'app-notification-host',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-host.html',
  styleUrl: './notification-host.css',
})
export class NotificationHostComponent {
  readonly notifications = inject(NotificationService);
}
