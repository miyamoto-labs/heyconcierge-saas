-- Add frozen flag to admin_users
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS frozen BOOLEAN DEFAULT false;
