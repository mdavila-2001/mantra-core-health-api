-- =========================================================================
-- Mantra Core Technologies · REDESA Health Ecosystem
-- v4.0.11 · profiles.persons: el nombre en sus cuatro partes
--
-- Contexto: el commit 3c0bb435 ("feat(profiles): el nombre de una persona, en
-- sus cuatro partes") añadió `name`, `middle_name`, `last_name` y
-- `mother_last_name` a la entidad y al DTO, pero el patch que las declara
-- nunca llegó a SQL/patches/. Una base construida desde SQL/ falla el alta de
-- paciente con:
--
--   InvalidFieldNameException: column "name" of relation "persons" does not exist
--
-- Las cuatro son NULLABLE a propósito: un recién nacido, una urgencia sin
-- identificar o un registro importado pueden llegar sin ninguna. `display_name`
-- se conserva como la forma derivada y lista para mostrar.
--
-- Tipos tomados de una base donde el alta ya funciona: varchar SIN longitud,
-- no varchar(255).
--
-- Aditivo e idempotente. Seguro de re-aplicar.
-- =========================================================================

ALTER TABLE profiles.persons ADD COLUMN IF NOT EXISTS name             varchar NULL;
ALTER TABLE profiles.persons ADD COLUMN IF NOT EXISTS middle_name      varchar NULL;
ALTER TABLE profiles.persons ADD COLUMN IF NOT EXISTS last_name        varchar NULL;
ALTER TABLE profiles.persons ADD COLUMN IF NOT EXISTS mother_last_name varchar NULL;

-- Sin COMMENT ON COLUMN a propósito: las entidades no declaran `comment`, así
-- que cualquier comentario aparece como divergencia en el verificador de
-- fidelidad (`comment on column ... is null` en el diff del dry-run). Ninguna
-- otra columna de la base los lleva.
