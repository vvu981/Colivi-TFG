-- =============================================================================
-- V10__add_end_date_to_booking_requests.sql
-- Reemplaza duration_months por end_date para validación estricta de solapamiento
-- =============================================================================

ALTER TABLE booking_requests ADD COLUMN end_date DATE;

-- Update existing records if any
UPDATE booking_requests 
SET end_date = start_date + (duration_months || ' months')::interval - interval '1 day';

-- Make it not null
ALTER TABLE booking_requests ALTER COLUMN end_date SET NOT NULL;

-- Drop old column
ALTER TABLE booking_requests DROP COLUMN duration_months;
