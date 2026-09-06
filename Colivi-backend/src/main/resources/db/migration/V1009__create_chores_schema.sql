CREATE TABLE chores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    series_id UUID,
    home_id UUID NOT NULL,
    assignee_id UUID NOT NULL,
    completed_by_id UUID,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    base_points INT NOT NULL DEFAULT 10,
    due_date DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    completed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_chores_home FOREIGN KEY (home_id) REFERENCES homes (id) ON DELETE CASCADE,
    CONSTRAINT fk_chores_assignee FOREIGN KEY (assignee_id) REFERENCES "user" (id) ON DELETE CASCADE,
    CONSTRAINT fk_chores_completed_by FOREIGN KEY (completed_by_id) REFERENCES "user" (id) ON DELETE SET NULL
);

CREATE INDEX idx_chores_home_id ON chores (home_id);
CREATE INDEX idx_chores_series_id ON chores (series_id);
CREATE INDEX idx_chores_assignee_id ON chores (assignee_id);
CREATE INDEX idx_chores_due_date ON chores (due_date);
CREATE INDEX idx_chores_status ON chores (status);
CREATE INDEX idx_chores_home_due_date ON chores (home_id, due_date);
