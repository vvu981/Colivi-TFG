-- Eliminar la restricción de borrado en cascada para proteger la auditoría (Inmutabilidad)
ALTER TABLE activity_logs DROP CONSTRAINT fk_activity_logs_actor;
ALTER TABLE activity_logs ADD CONSTRAINT fk_activity_logs_actor FOREIGN KEY (actor_id) REFERENCES "user" (id);

-- Convertir la columna metadata a JSONB para mejorar el rendimiento de indexación y lecturas
ALTER TABLE activity_logs ALTER COLUMN metadata TYPE JSONB USING metadata::jsonb;
