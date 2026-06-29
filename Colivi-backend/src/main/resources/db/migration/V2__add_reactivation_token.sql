-- =============================================================================
-- V2__add_reactivation_token.sql
-- Añade soporte para el flujo de reactivación de cuentas (soft-delete recovery).
--
-- Flujo:
--   1. El usuario solicita reactivar su cuenta → se genera un token UUID y se
--      persiste en estas columnas con un TTL de 24 horas.
--   2. El usuario hace clic en el enlace del correo → el backend valida el token
--      y su expiración, reactiva la cuenta y limpia ambas columnas (NULL).
-- =============================================================================

ALTER TABLE "user"
    ADD COLUMN reactivation_token            VARCHAR(36),
    ADD COLUMN reactivation_token_expires_at TIMESTAMP;

-- Índice parcial: solo cubre filas con token activo (reactivación en curso).
-- Optimiza la búsqueda por token sin penalizar las filas normales.
CREATE INDEX idx_user_reactivation_token
    ON "user" (reactivation_token)
    WHERE reactivation_token IS NOT NULL;
