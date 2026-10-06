CREATE TABLE reports (
    id UUID PRIMARY KEY,
    reporter_id UUID, -- Opcional, permite nulos (GDPR)
    target_type VARCHAR(50) NOT NULL,
    target_id UUID NOT NULL,
    reason VARCHAR(50) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    admin_notes TEXT,
    resolver_id UUID,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE,
    resolved_at TIMESTAMP WITHOUT TIME ZONE,
    CONSTRAINT fk_reports_reporter FOREIGN KEY (reporter_id) REFERENCES "user" (id) ON DELETE SET NULL,
    CONSTRAINT fk_reports_resolver FOREIGN KEY (resolver_id) REFERENCES "user" (id) ON DELETE SET NULL
);

-- Índice único parcial para evitar que un usuario denuncie el mismo elemento repetidas veces mientras esté abierta.
CREATE UNIQUE INDEX idx_unique_active_report
    ON reports (reporter_id, target_type, target_id)
    WHERE status IN ('PENDING', 'INVESTIGATING');

-- Índices de rendimiento para las consultas de administración (búsqueda y filtrado)
CREATE INDEX idx_reports_status ON reports (status);
CREATE INDEX idx_reports_target_type ON reports (target_type);
CREATE INDEX idx_reports_target_id ON reports (target_id);
CREATE INDEX idx_reports_created_at ON reports (created_at);
