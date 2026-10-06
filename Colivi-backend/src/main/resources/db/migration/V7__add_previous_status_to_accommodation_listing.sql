-- =============================================================================
-- V7__add_previous_status_to_accommodation_listing.sql
-- Añade la columna previous_status a la tabla accommodation_listing.
-- =============================================================================

ALTER TABLE accommodation_listing ADD COLUMN previous_status VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE';
