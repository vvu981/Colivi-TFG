CREATE TABLE chore_series (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    home_id UUID NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    base_points INT NOT NULL DEFAULT 10,
    recurrence_type VARCHAR(30) NOT NULL,
    occurrences INT NOT NULL DEFAULT 1,
    custom_days_of_week VARCHAR(50),
    rotation_type VARCHAR(30) NOT NULL DEFAULT 'FIXED',
    last_assignee_index INT NOT NULL DEFAULT 0,
    version INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    CONSTRAINT fk_chore_series_home FOREIGN KEY (home_id) REFERENCES homes (id) ON DELETE CASCADE
);

CREATE TABLE chore_series_participants (
    series_id UUID NOT NULL,
    order_index INT NOT NULL,
    user_id UUID NOT NULL,
    PRIMARY KEY (series_id, order_index),
    CONSTRAINT fk_csp_series FOREIGN KEY (series_id) REFERENCES chore_series (id) ON DELETE CASCADE,
    CONSTRAINT fk_csp_user FOREIGN KEY (user_id) REFERENCES "user" (id) ON DELETE CASCADE
);

-- Backfill legacy series from chores table if present
INSERT INTO chore_series (id, home_id, title, description, base_points, recurrence_type, occurrences, rotation_type, last_assignee_index, created_at)
SELECT DISTINCT ON (c.series_id)
    c.series_id,
    c.home_id,
    c.title,
    c.description,
    COALESCE(c.base_points, 10),
    'WEEKLY',
    1,
    'FIXED',
    0,
    COALESCE(c.created_at, CURRENT_TIMESTAMP)
FROM chores c
WHERE c.series_id IS NOT NULL
ORDER BY c.series_id, c.created_at ASC
ON CONFLICT (id) DO NOTHING;

-- Backfill participants for legacy series
INSERT INTO chore_series_participants (series_id, order_index, user_id)
SELECT DISTINCT ON (c.series_id)
    c.series_id,
    0,
    c.assignee_id
FROM chores c
WHERE c.series_id IS NOT NULL
  AND c.assignee_id IS NOT NULL
  AND c.series_id IN (SELECT id FROM chore_series)
ORDER BY c.series_id, c.created_at ASC
ON CONFLICT (series_id, order_index) DO NOTHING;

-- Safeguard: ensure no orphan series_id remains before creating FK
UPDATE chores SET series_id = NULL
WHERE series_id IS NOT NULL
  AND series_id NOT IN (SELECT id FROM chore_series);

CREATE INDEX idx_chore_series_home ON chore_series (home_id);
CREATE INDEX idx_csp_user_id ON chore_series_participants (user_id);
ALTER TABLE chores ADD CONSTRAINT fk_chores_series FOREIGN KEY (series_id) REFERENCES chore_series (id) ON DELETE SET NULL;
CREATE INDEX idx_chores_home_status_due_date ON chores (home_id, status, due_date);

