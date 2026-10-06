ALTER TABLE accommodation_listing
ADD COLUMN is_promoted BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX idx_accommodation_listing_is_promoted
    ON accommodation_listing (is_promoted)
    WHERE is_promoted = TRUE;
