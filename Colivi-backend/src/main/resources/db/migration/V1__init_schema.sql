-- =============================================================================
-- V1__init_schema.sql
-- Migración inicial — Esquema completo de la plataforma Colivi
-- Ref: CLAUDE.md §4.1 Diagrama ER · §4.2 Índices · §4.3 Trigger · §4.4 ENUMs
-- =============================================================================

-- ─── ENUMERADOS ───────────────────────────────────────────────────────────────

CREATE TYPE user_role      AS ENUM ('ADMIN', 'USER');
CREATE TYPE listing_status AS ENUM ('PENDING', 'ACTIVE', 'REJECTED', 'FINISHED');
CREATE TYPE audit_action   AS ENUM ('CREATE', 'UPDATE', 'DELETE');
CREATE TYPE report_reason  AS ENUM ('SPAM', 'SCAM', 'INAPPROPRIATE', 'MISLEADING');
CREATE TYPE report_status  AS ENUM ('PENDING', 'REVIEWED', 'DISMISSED');

-- ─── TABLA: user ─────────────────────────────────────────────────────────────
-- Palabra reservada en PostgreSQL → se escapa con comillas dobles.
-- Los campos banned_at y deleted_at se mantienen para soft-delete y baneo permanente.
-- token_version (@Version JPA) garantiza control de concurrencia optimista.

CREATE TABLE "user" (
    id               UUID         NOT NULL DEFAULT gen_random_uuid(),
    nickname         VARCHAR(50)  NOT NULL,
    email            VARCHAR(255) NOT NULL,
    password_hash    TEXT         NOT NULL,
    first_name       VARCHAR(100) NOT NULL,
    last_name_1      VARCHAR(100) NOT NULL,
    last_name_2      VARCHAR(100),
    phone            VARCHAR(30),
    profile_pic_url  TEXT,
    role             user_role    NOT NULL DEFAULT 'USER',
    deleted_at       TIMESTAMP,
    banned_at        TIMESTAMP,
    banned_until     TIMESTAMP,
    ban_reason       TEXT,
    created_at       TIMESTAMP    NOT NULL DEFAULT now(),
    token_version    INTEGER      NOT NULL DEFAULT 1,

    CONSTRAINT pk_user              PRIMARY KEY (id),
    CONSTRAINT uq_user_nickname     UNIQUE (nickname),
    CONSTRAINT uq_user_email        UNIQUE (email)
);

-- ─── TABLA: audit_snapshot_log ───────────────────────────────────────────────
-- APPEND-ONLY. Ningún UPDATE ni DELETE puede prosperar (forzado por trigger).
-- Ref: CLAUDE.md §4.3

CREATE TABLE audit_snapshot_log (
    id               UUID         NOT NULL DEFAULT gen_random_uuid(),
    user_id          UUID         NOT NULL,
    entity_type      VARCHAR(50)  NOT NULL,   -- 'EXPENSE' | 'TASK'
    entity_id        UUID         NOT NULL,
    action_type      audit_action NOT NULL,
    snapshot_before  JSONB,
    snapshot_after   JSONB,
    server_timestamp TIMESTAMP    NOT NULL DEFAULT now(),

    CONSTRAINT pk_audit_snapshot_log PRIMARY KEY (id),
    CONSTRAINT fk_audit_user         FOREIGN KEY (user_id) REFERENCES "user" (id)
);

-- Trigger de inmutabilidad — bloquea UPDATE y DELETE sobre audit_snapshot_log
-- Ref: CLAUDE.md §4.3

CREATE OR REPLACE FUNCTION fn_block_audit_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION
        'VIOLACIÓN DE INTEGRIDAD: La tabla audit_snapshot_log es append-only. '
        'Operación % sobre el registro % está prohibida.',
        TG_OP, OLD.id;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_immutable
    BEFORE UPDATE OR DELETE ON audit_snapshot_log
    FOR EACH ROW EXECUTE FUNCTION fn_block_audit_mutation();

-- ─── ÍNDICES CRÍTICOS ────────────────────────────────────────────────────────
-- Ref: CLAUDE.md §4.2

-- Auditoría: consultas por entidad con orden cronológico descendente
CREATE INDEX idx_audit_entity
    ON audit_snapshot_log (entity_id, server_timestamp DESC);
