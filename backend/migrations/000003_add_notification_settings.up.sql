-- 000003_add_notification_settings.up.sql
ALTER TABLE users ADD COLUMN notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE users ADD COLUMN notifications_priority TEXT NOT NULL DEFAULT 'medium' CHECK (notifications_priority IN ('low', 'medium', 'high', 'critical'));
