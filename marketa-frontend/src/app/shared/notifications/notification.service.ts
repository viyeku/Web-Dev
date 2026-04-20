import { Injectable, signal } from '@angular/core';
import { AppNotification, NotificationKind } from './notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  readonly notifications = signal<AppNotification[]>([]);
  private nextId = 1;
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();

  success(message: string, durationMs = 3500) {
    this.show('success', message, durationMs);
  }

  error(message: string, durationMs = 3500) {
    this.show('error', message, durationMs);
  }

  warning(message: string, durationMs = 3500) {
    this.show('warning', message, durationMs);
  }

  info(message: string, durationMs = 3500) {
    this.show('info', message, durationMs);
  }

  dismiss(id: number) {
    const timer = this.timers.get(id);

    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }

    this.notifications.update((items) => items.filter((item) => item.id !== id));
  }

  clear() {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }

    this.timers.clear();
    this.notifications.set([]);
  }

  private show(kind: NotificationKind, message: string, durationMs: number) {
    const notification: AppNotification = {
      id: this.nextId++,
      kind,
      message,
    };

    this.notifications.update((items) => [...items, notification]);

    if (durationMs > 0) {
      const timer = setTimeout(() => this.dismiss(notification.id), durationMs);
      this.timers.set(notification.id, timer);
    }
  }
}
