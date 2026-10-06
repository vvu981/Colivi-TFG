-- V1008__remove_expense_settlements.sql
-- Elimina acuerdos de liquidación y columna redundante settled_at para adoptar el modelo Tricount puro

DROP TABLE IF EXISTS home_settlement_agreements;
ALTER TABLE home_expenses DROP COLUMN IF EXISTS settled_at;
