-- =============================================================================
-- V3__create_accommodation_schema.sql
-- Crea las tablas para alojamientos (accommodation), comodidades (amenities)
-- y las imágenes asociadas (accommodationImage).
-- =============================================================================

-- ─── TABLA: accommodation ────────────────────────────────────────────────────
CREATE TABLE accommodation (
    id              UUID             NOT NULL DEFAULT gen_random_uuid(),
    address         VARCHAR(255),
    total_rooms     INTEGER,
    total_bathrooms INTEGER,
    free_rooms      INTEGER,
    square_meters   INTEGER,
    city            VARCHAR(100),
    country         VARCHAR(100),
    province        VARCHAR(100),
    latitude        DOUBLE PRECISION,
    longitude       DOUBLE PRECISION,
    deleted_at      TIMESTAMP,
    created_at      TIMESTAMP        NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP,
    owner_id        UUID             NOT NULL,

    CONSTRAINT pk_accommodation      PRIMARY KEY (id),
    CONSTRAINT fk_accommodation_user FOREIGN KEY (owner_id) REFERENCES "user" (id) ON DELETE CASCADE
);

-- ─── TABLA: accommodation_amenity ────────────────────────────────────────────
CREATE TABLE accommodation_amenity (
    accommodation_id UUID         NOT NULL,
    amenity_name     VARCHAR(50)  NOT NULL,

    CONSTRAINT pk_accommodation_amenity PRIMARY KEY (accommodation_id, amenity_name),
    CONSTRAINT fk_amenity_accommodation FOREIGN KEY (accommodation_id) REFERENCES accommodation (id) ON DELETE CASCADE
);

-- ─── TABLA: accommodation_image ──────────────────────────────────────────────
CREATE TABLE accommodation_image (
    id               UUID         NOT NULL DEFAULT gen_random_uuid(),
    image_url        TEXT,
    display_order    INTEGER,
    accommodation_id UUID         NOT NULL,

    CONSTRAINT pk_accommodation_image PRIMARY KEY (id),
    CONSTRAINT fk_image_accommodation FOREIGN KEY (accommodation_id) REFERENCES accommodation (id) ON DELETE CASCADE
);
