-- =============================================================================
-- V5__add_updated_at_to_accommodation_listing.sql
-- Añade la columna updated_at a la tabla accommodation_listing.
-- =============================================================================

ALTER TABLE accommodation_listing ADD COLUMN updated_at TIMESTAMP;
