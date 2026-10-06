CREATE INDEX IF NOT EXISTS idx_user_reactivation_expires ON "user" (reactivation_token_expires_at) WHERE reactivation_token_expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_password_reset_expires ON "user" (password_reset_token_expires_at) WHERE password_reset_token_expires_at IS NOT NULL;
