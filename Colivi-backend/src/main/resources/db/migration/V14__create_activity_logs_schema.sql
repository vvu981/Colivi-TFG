CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY,
    home_id UUID NOT NULL,
    actor_id UUID NOT NULL,
    activity_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    metadata JSON,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_activity_logs_home FOREIGN KEY (home_id) REFERENCES homes (id) ON DELETE CASCADE,
    CONSTRAINT fk_activity_logs_actor FOREIGN KEY (actor_id) REFERENCES "user" (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_home_created_desc ON activity_logs (home_id, created_at DESC);
