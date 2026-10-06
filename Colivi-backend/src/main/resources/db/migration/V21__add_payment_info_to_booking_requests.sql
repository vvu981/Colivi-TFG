-- =============================================================================
-- V21__add_payment_info_to_booking_requests.sql
-- Adds transaction_id and payment_method to booking_requests
-- =============================================================================

ALTER TABLE booking_requests
ADD COLUMN transaction_id VARCHAR(100) NULL,
ADD COLUMN payment_method VARCHAR(30) NULL;
