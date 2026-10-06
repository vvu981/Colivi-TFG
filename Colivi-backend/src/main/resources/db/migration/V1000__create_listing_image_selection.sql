CREATE TABLE listing_image_selection (
    id UUID PRIMARY KEY,
    listing_id UUID NOT NULL,
    image_id UUID NOT NULL,
    display_order INTEGER NOT NULL,
    CONSTRAINT fk_listing_image_selection_listing FOREIGN KEY (listing_id) REFERENCES accommodation_listing(id) ON DELETE CASCADE,
    CONSTRAINT fk_listing_image_selection_image FOREIGN KEY (image_id) REFERENCES accommodation_image(id) ON DELETE CASCADE
);

CREATE INDEX idx_listing_image_selection_listing_id ON listing_image_selection(listing_id);
