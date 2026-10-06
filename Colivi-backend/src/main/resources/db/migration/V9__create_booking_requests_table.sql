-- =============================================================================
-- V9__create_booking_requests_table.sql
-- Crea la tabla para las solicitudes de reserva de alojamiento.
-- =============================================================================

CREATE TABLE booking_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL,
    accommodation_listing_id UUID NOT NULL,
    start_date DATE NOT NULL,
    duration_months INT NOT NULL,
    message TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP,
    

    CONSTRAINT fk_booking_request_requester FOREIGN KEY (requester_id) REFERENCES "user" (id) ON DELETE CASCADE,
    CONSTRAINT fk_booking_request_listing FOREIGN KEY (accommodation_listing_id) REFERENCES accommodation_listing (id) ON DELETE CASCADE
);
