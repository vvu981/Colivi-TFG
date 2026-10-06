-- V1005: Índice compuesto para optimizar ranking de moderación activa y resolución en cascada
CREATE INDEX IF NOT EXISTS idx_reports_target_type_id_status ON reports (target_type, target_id, status);
