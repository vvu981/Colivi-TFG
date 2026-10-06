-- V1010__add_color_to_home_members.sql
-- Añade columna de color personal por hogar en home_members

ALTER TABLE home_members ADD COLUMN color VARCHAR(30) DEFAULT '#4F46E5';

-- Asignar colores iniciales diferenciados a los miembros de Ruzafa si ya existen
UPDATE home_members hm
SET color = CASE u.email
    WHEN 'miguel.fernandez@gmail.com' THEN '#2563EB'
    WHEN 'carmen.delgado@gmail.com' THEN '#7C3AED'
    WHEN 'javier.ramos@gmail.com' THEN '#059669'
    WHEN 'ainoa.garrido@gmail.com' THEN '#D97706'
    ELSE '#4F46E5'
END
FROM "user" u
WHERE hm.user_id = u.id;
