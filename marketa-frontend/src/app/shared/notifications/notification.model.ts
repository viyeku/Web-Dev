export type NotificationKind = 'success' | 'error' | 'warning' | 'info';

export interface AppNotification {
  id: number;
  kind: NotificationKind;
  message: string;
}
