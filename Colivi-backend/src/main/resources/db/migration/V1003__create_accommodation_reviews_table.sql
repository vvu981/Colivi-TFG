-- =============================================================================
-- V1003__create_accommodation_reviews_table.sql
-- Crea la tabla para las reseñas y valoraciones de alojamientos condicionadas a estancias reales.
-- =============================================================================

CREATE TABLE accommodation_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_request_id UUID NOT NULL UNIQUE,
    listing_id UUID NOT NULL,
    author_id UUID NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    
    CONSTRAINT fk_review_booking_request FOREIGN KEY (booking_request_id) REFERENCES booking_requests(id) ON DELETE CASCADE,
    CONSTRAINT fk_review_listing FOREIGN KEY (listing_id) REFERENCES accommodation_listing(id) ON DELETE CASCADE,
    CONSTRAINT fk_review_author FOREIGN KEY (author_id) REFERENCES "user"(id) ON DELETE CASCADE
);

CREATE INDEX idx_accommodation_reviews_listing_id ON accommodation_reviews(listing_id, created_at DESC);
CREATE INDEX idx_accommodation_reviews_author_id ON accommodation_reviews(author_id);
