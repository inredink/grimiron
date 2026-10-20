import { getDatabase } from './db';
import {
  NotificationCategory,
  NotificationStorageAdapter,
  setNotificationStorageAdapter,
} from '../notifications/notificationManager';

export const sqliteNotificationStorage: NotificationStorageAdapter = {
  savePendingNotification: (
    id: string,
    category: NotificationCategory,
    title: string,
    subtitle: string,
    detailsJson: string | null,
    createdAt: string
  ): void => {
    const db = getDatabase();
    db.runSync(
      `INSERT INTO pending_notifications (id, type, title, subtitle, details_json, created_at, is_dismissed)
       VALUES (?, ?, ?, ?, ?, ?, 0);`,
      [id, category, title, subtitle, detailsJson, createdAt]
    );
  },
};

export function initializeNotificationSqliteStorage(): void {
  setNotificationStorageAdapter(sqliteNotificationStorage);
}
