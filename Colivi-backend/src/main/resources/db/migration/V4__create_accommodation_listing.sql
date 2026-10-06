-- =============================================================================
-- V4__create_accommodation_listing.sql
-- Crea la tabla para publicaciones de alojamientos (accommodation_listing).
-- =============================================================================

CREATE TABLE accommodation_listing (
    id               UUID           NOT NULL DEFAULT gen_random_uuid(),
    accommodation_id UUID           NOT NULL,
    host_id          UUID           NOT NULL,
    title            VARCHAR(255)   NOT NULL,
    description      TEXT           NOT NULL,
    price_per_month  NUMERIC(19, 2) NOT NULL,
    status           VARCHAR(30)    NOT NULL,
    version          INTEGER,
    deleted_at       TIMESTAMP,
    created_at       TIMESTAMP      NOT NULL DEFAULT now(),

    CONSTRAINT pk_accommodation_listing PRIMARY KEY (id),
    CONSTRAINT fk_listing_accommodation FOREIGN KEY (accommodation_id) REFERENCES accommodation (id) ON DELETE CASCADE,
    CONSTRAINT fk_listing_host          FOREIGN KEY (host_id) REFERENCES "user" (id) ON DELETE CASCADE
);
