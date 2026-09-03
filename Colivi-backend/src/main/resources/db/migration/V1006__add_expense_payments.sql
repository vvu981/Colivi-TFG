-- V1006__add_expense_payments.sql
-- Añade columna is_payment para distinguir pagos directos entre convivientes de gastos comunes

ALTER TABLE home_expenses ADD COLUMN IF NOT EXISTS is_payment BOOLEAN NOT NULL DEFAULT FALSE;
