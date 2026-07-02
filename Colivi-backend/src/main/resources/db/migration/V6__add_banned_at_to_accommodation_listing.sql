-- =============================================================================
-- V6__add_banned_at_to_accommodation_listing.sql
-- Añade la columna banned_at a la tabla accommodation_listing.
-- =============================================================================

ALTER TABLE accommodation_listing ADD COLUMN banned_at TIMESTAMP;
