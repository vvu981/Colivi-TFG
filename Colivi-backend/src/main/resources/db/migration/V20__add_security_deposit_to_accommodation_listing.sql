-- Añade la columna de fianza (security_deposit) a los anuncios
ALTER TABLE accommodation_listing
ADD COLUMN security_deposit NUMERIC(10, 2) NOT NULL DEFAULT 0.00;
