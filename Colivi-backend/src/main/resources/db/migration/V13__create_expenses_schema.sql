-- V13__create_expenses_schema.sql
-- Creación del esquema para el módulo de Gastos Compartidos y Balances

CREATE TABLE home_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    home_id UUID NOT NULL,
    payer_id UUID NOT NULL,
    description VARCHAR(255) NOT NULL,
    total_amount NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    deleted_at TIMESTAMP,
    CONSTRAINT fk_home_expenses_home FOREIGN KEY (home_id) REFERENCES homes(id) ON DELETE CASCADE,
    CONSTRAINT fk_home_expenses_payer FOREIGN KEY (payer_id) REFERENCES "user"(id) ON DELETE CASCADE
);

CREATE TABLE home_expense_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_id UUID NOT NULL,
    user_id UUID NOT NULL,
    owed_amount NUMERIC(10,2) NOT NULL,
    CONSTRAINT fk_expense_participants_expense FOREIGN KEY (expense_id) REFERENCES home_expenses(id) ON DELETE CASCADE,
    CONSTRAINT fk_expense_participants_user FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE,
    CONSTRAINT uk_expense_participant UNIQUE (expense_id, user_id)
);

CREATE INDEX idx_home_expenses_home_id ON home_expenses(home_id);
CREATE INDEX idx_home_expenses_payer_id ON home_expenses(payer_id);
CREATE INDEX idx_home_expense_participants_expense_id ON home_expense_participants(expense_id);
CREATE INDEX idx_home_expense_participants_user_id ON home_expense_participants(user_id);
