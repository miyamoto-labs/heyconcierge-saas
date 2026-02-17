-- Add wifi_network column to property_config_sheets
ALTER TABLE property_config_sheets
ADD COLUMN IF NOT EXISTS wifi_network TEXT DEFAULT '';
