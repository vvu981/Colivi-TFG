CREATE TABLE user_search_histories (
    id UUID PRIMARY KEY,
    user_id UUID,
    city VARCHAR(100),
    max_price NUMERIC(10, 2),
    accommodation_type VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Partial index for fast lookup of recent searches for a user
CREATE INDEX idx_user_search_histories_user_id_created_at
    ON user_search_histories (user_id, created_at DESC)
    WHERE user_id IS NOT NULL;
