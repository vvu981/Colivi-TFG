-- V1006__add_expense_settlements.sql
-- Añade soporte para liquidación de gastos y registro de conformidad de convivientes

ALTER TABLE home_expenses ADD COLUMN IF NOT EXISTS settled_at TIMESTAMP;

CREATE TABLE IF NOT EXISTS home_settlement_agreements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    home_id UUID NOT NULL,
    user_id UUID NOT NULL,
    agreed_at TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT fk_settlement_agreements_home FOREIGN KEY (home_id) REFERENCES homes(id) ON DELETE CASCADE,
    CONSTRAINT fk_settlement_agreements_user FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE,
    CONSTRAINT uk_settlement_agreements_home_user UNIQUE (home_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_home_expenses_unsettled ON home_expenses(home_id, created_at DESC) WHERE deleted_at IS NULL AND settled_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_settlement_agreements_home_id ON home_settlement_agreements(home_id);
