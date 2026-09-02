-- =========================================================================
-- Mantra Core Technologies · REDESA Health Ecosystem
-- v4.0.11 · profiles.persons.photo_file_id (FK a common.files)
--
-- Contexto: el commit eb50f79b, mergeado a dev por el PR #53
-- ("v4.0.11: persons.photo_file_id + fix del catálogo de datos"), añadió
-- `photo_file_id` a la entidad, a profiles.fk.ts y a profiles.idx.ts, pero el
-- patch que declara la columna nunca llegó a SQL/patches/.
--
-- Ojo con el falso negativo: la ausencia de esta columna NO rompe las lecturas,
-- porque MikroORM emite `select "p0".*`. Sólo revientan los INSERT/UPDATE que
-- la escriben, que sí listan columnas por nombre.
--
-- Aditivo e idempotente. Seguro de re-aplicar.
-- =========================================================================

ALTER TABLE profiles.persons ADD COLUMN IF NOT EXISTS photo_file_id uuid NULL;

-- Sin COMMENT ON COLUMN: ver la nota del patch de las cuatro partes del nombre.
-- Un comentario aquí sale como divergencia en el verificador de fidelidad.

CREATE INDEX IF NOT EXISTS ix_persons_photo_file_id
    ON profiles.persons USING btree (photo_file_id);

-- La FK se envuelve porque ADD CONSTRAINT no admite IF NOT EXISTS.
DO $$
BEGIN
    ALTER TABLE profiles.persons
        ADD CONSTRAINT fk_persons_photo_file_id
        FOREIGN KEY (photo_file_id) REFERENCES common.files (id)
        ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END
$$;
