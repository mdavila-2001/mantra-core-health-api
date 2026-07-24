import type { ExtensionSpec } from './catalog.types';

/**
 * Extensiones de PostgreSQL que el modelo físico necesita instaladas antes de
 * crear tabla alguna.
 *
 * Por qué van primero en la secuencia de arranque: una extensión aporta tipos y
 * operadores. Si `vector` no existe, la columna `vector_rag.vector_embeddings.
 * embedding` (tipo `vector`) no se puede ni declarar, y el CREATE TABLE falla
 * con un error de tipo desconocido que no dice nada útil. Instalarlas antes
 * convierte ese fallo tardío y críptico en un fallo temprano y explícito.
 *
 * `CREATE EXTENSION IF NOT EXISTS` es idempotente por definición, así que esta
 * capa se puede reejecutar en cada arranque sin efecto secundario.
 *
 * Nota sobre permisos: instalar una extensión exige rol superusuario o el
 * permiso explícito. En un PostgreSQL gestionado (RDS, Cloud SQL) el usuario de
 * la aplicación normalmente no lo tiene; por eso `required: false` en las que
 * solo habilitan capacidades opcionales, para que un entorno sin ellas siga
 * arrancando con el resto del modelo funcional.
 */
export const extensionCatalog: readonly ExtensionSpec[] = [
  {
    name: 'pgcrypto',
    purpose:
      'gen_random_uuid() y funciones de hash usadas por columnas *_hash del modelo',
    required: false,
  },
  {
    name: 'vector',
    purpose:
      'tipo vector y operadores de similitud del módulo 59 (vector_rag / RAG clínico)',
    required: false,
  },
  {
    name: 'timescaledb',
    purpose:
      'hypertables del módulo 58 (time_series): particionado temporal automático',
    required: false,
  },
  {
    name: 'pg_trgm',
    purpose:
      'índices GIN de similitud trigram para búsqueda por nombre en directory y profiles',
    required: false,
  },
];
