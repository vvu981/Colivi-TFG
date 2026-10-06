-- =============================================================================
-- V11__add_version_to_accommodation.sql
-- Agrega columna version para concurrencia optimista a accommodation
-- =============================================================================

ALTER TABLE accommodation ADD COLUMN version INTEGER DEFAULT 0;
