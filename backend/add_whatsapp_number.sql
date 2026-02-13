-- Add whatsapp_number column if it doesn't exist
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;

-- Update the test property with the Twilio sandbox number
UPDATE properties
SET whatsapp_number = 'whatsapp:+14155238886'
WHERE id IN (SELECT id FROM properties ORDER BY created_at DESC LIMIT 1);
