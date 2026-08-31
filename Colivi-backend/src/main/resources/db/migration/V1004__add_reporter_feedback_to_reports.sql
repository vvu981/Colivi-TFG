-- Añadir columna para registrar si el denunciante ya fue notificado/vio el agradecimiento tras la resolución
ALTER TABLE reports
ADD COLUMN reporter_notified BOOLEAN NOT NULL DEFAULT FALSE;

-- Índice para optimizar la consulta de feedback pendiente para el denunciante
CREATE INDEX idx_reports_pending_feedback
ON reports (reporter_id, status, reporter_notified)
WHERE status = 'RESOLVED' AND reporter_notified = FALSE;
