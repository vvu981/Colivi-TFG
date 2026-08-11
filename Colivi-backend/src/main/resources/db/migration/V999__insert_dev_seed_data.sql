-- V999__insert_dev_seed_data.sql
-- Datos de prueba (Seed Data) para facilitar el desarrollo en el Frontend.
-- Inserta usuarios base, un hogar y un set de gastos.

-- ¡ATENCIÓN! Las contraseñas para todos los usuarios son: password123
-- Hash Bcrypt de "password123"
WITH const AS (
    SELECT '$2a$10$7HPtOW8.Q.52cmm6hhxUI.c8kVoY8iqjLomWRx5iLXyVDq88VMhXu' AS pwd
)
INSERT INTO "user" (id, nickname, email, password_hash, first_name, last_name_1, role) VALUES
    ('11111111-1111-1111-1111-111111111111', 'victor_admin', 'victor@colivi.com', (SELECT pwd FROM const), 'Victor', 'Admin', 'ADMIN'),
    ('22222222-2222-2222-2222-222222222222', 'ana_user', 'ana@colivi.com', (SELECT pwd FROM const), 'Ana', 'García', 'USER'),
    ('33333333-3333-3333-3333-333333333333', 'carlos_user', 'carlos@colivi.com', (SELECT pwd FROM const), 'Carlos', 'López', 'USER'),
    ('44444444-4444-4444-4444-444444444444', 'laura_user', 'laura@colivi.com', (SELECT pwd FROM const), 'Laura', 'Martínez', 'USER')
ON CONFLICT DO NOTHING;

-- Insertar Hogar
INSERT INTO homes (id, name, invitation_code) VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Piso Estudiantes Centro', 'PISO-CENTRO-2024')
ON CONFLICT DO NOTHING;

-- Insertar miembros del hogar
INSERT INTO home_members (home_id, user_id, role, status) VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'ADMIN', 'ACTIVE'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'MEMBER', 'ACTIVE'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', 'MEMBER', 'ACTIVE'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '44444444-4444-4444-4444-444444444444', 'MEMBER', 'ACTIVE')
ON CONFLICT DO NOTHING;

-- Insertar Gastos (Expenses)
INSERT INTO home_expenses (id, home_id, payer_id, description, total_amount) VALUES
    ('e1111111-e111-e111-e111-e11111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Compra Mercadona Semanal', 100.00),
    ('e2222222-e222-e222-e222-e22222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'Factura Luz Marzo', 40.00),
    ('e3333333-e333-e333-e333-e33333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', 'Cena de Pizzería', 80.00)
ON CONFLICT DO NOTHING;

-- Insertar Participantes de los Gastos
INSERT INTO home_expense_participants (expense_id, user_id, owed_amount) VALUES
    -- Gasto 1: 100€ dividido entre los 4 (25€ cada uno)
    ('e1111111-e111-e111-e111-e11111111111', '11111111-1111-1111-1111-111111111111', 25.00),
    ('e1111111-e111-e111-e111-e11111111111', '22222222-2222-2222-2222-222222222222', 25.00),
    ('e1111111-e111-e111-e111-e11111111111', '33333333-3333-3333-3333-333333333333', 25.00),
    ('e1111111-e111-e111-e111-e11111111111', '44444444-4444-4444-4444-444444444444', 25.00),

    -- Gasto 2: 40€ dividido entre Ana y Victor (20€ cada uno)
    ('e2222222-e222-e222-e222-e22222222222', '11111111-1111-1111-1111-111111111111', 20.00),
    ('e2222222-e222-e222-e222-e22222222222', '22222222-2222-2222-2222-222222222222', 20.00),

    -- Gasto 3: 80€ dividido entre Carlos y Laura (40€ cada uno)
    ('e3333333-e333-e333-e333-e33333333333', '33333333-3333-3333-3333-333333333333', 40.00),
    ('e3333333-e333-e333-e333-e33333333333', '44444444-4444-4444-4444-444444444444', 40.00)
ON CONFLICT DO NOTHING;
