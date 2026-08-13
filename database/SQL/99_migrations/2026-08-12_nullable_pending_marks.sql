-- Marcas de sucesos que todavía no han ocurrido: dejan de ser NOT NULL.
--
-- `released_at`, `verified_at` y `current_version_id` describen algo que pasa
-- DESPUÉS de crear la fila: un bloqueo de retención nace sin liberar, una
-- ubicación nace sin verificar y un manifiesto nace sin versión actual. Al
-- declararlas NOT NULL, toda alta de esas tablas fallaba con un 500 —el
-- servicio no tenía ningún valor honesto que poner— y la alternativa de
-- rellenarlas con la fecha del alta habría sido peor: afirmaría que el bloqueo
-- ya está liberado y que la copia ya está verificada.
--
-- Migración aditiva y reversible: sólo relaja la restricción, no toca datos.

ALTER TABLE object_storage.object_retention_locks
  ALTER COLUMN released_at DROP NOT NULL;

ALTER TABLE object_storage.object_legal_holds
  ALTER COLUMN released_at DROP NOT NULL;

ALTER TABLE object_storage.archive_manifests
  ALTER COLUMN verified_at DROP NOT NULL;

ALTER TABLE object_storage.object_locations
  ALTER COLUMN verified_at DROP NOT NULL;

ALTER TABLE object_storage.object_checksums
  ALTER COLUMN verified_at DROP NOT NULL;

ALTER TABLE object_storage.object_manifests
  ALTER COLUMN current_version_id DROP NOT NULL;

ALTER TABLE polyglot_storage.storage_capabilities
  ALTER COLUMN verified_at DROP NOT NULL;
