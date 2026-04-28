-- 000003_add_notification_settings.down.sql
ALTER TABLE users DROP COLUMN notifications_enabled;
ALTER TABLE users DROP COLUMN notifications_priority;
