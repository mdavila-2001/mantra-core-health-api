# vector_rag — Módulo 59 del modelo · pgvector

Almacén vectorial para recuperación aumentada (RAG) sobre corpus clínico y documental.
Catorce entidades, materializadas en este cambio.

## El flujo que modela

```
vector_documents          documento fuente registrado, con etiquetas de seguridad
   -> vector_chunks        troceado con texto redactado, hash y ruta de sección
      -> vector_embeddings vector + versión de modelo que lo generó
                           |
retrieval_sessions  -----> retrieval_candidates -> retrieval_evidence
                           (lo que se recuperó)     (lo que acabó citándose)
```

`embedding_jobs` y `vector_deletion_jobs` son las colas de trabajo; `embedding_model_versions`
fija con qué modelo se generó cada vector, que es lo que permite reindexar por lotes cuando
se cambia de modelo sin invalidar todo el corpus.

## Por qué el rastro de recuperación es parte del modelo

`retrieval_sessions`, `retrieval_candidates`, `retrieval_evidence` y
`retrieval_feedback_events` no son telemetría opcional: son lo que permite **auditar por qué
un asistente clínico respondió lo que respondió**. En un sistema regulado, una respuesta
generada sin poder reconstruir qué fragmentos la fundamentaron no es defendible.

`rag_access_policies` y `vector_tenant_bindings` acotan qué corpus puede ver cada
principal y cada tenant: la búsqueda vectorial no puede saltarse el aislamiento multi-tenant
solo porque el índice sea global.

## El índice HNSW y su deuda

`vector_embeddings.embedding` es de tipo `vector` (pgvector). El índice HNSW que hace viable
la búsqueda por similitud lo crea la capa 07 del arranque, **pero hoy se omite**:

```
WARN Omitido "index:vector_rag.vector_embeddings.embedding": la columna no declara
     dimensión; el modelo la define como "vector" sin tamaño y HNSW exige una dimensión fija
```

El modelo declara la columna como `vector` a secas. pgvector admite esa forma para almacenar
pero no para indexar. Fijar aquí una dimensión (1536, 3072...) sería inventar una decisión
que pertenece al modelo y que además es irreversible sin recrear la tabla.

**Consecuencia operativa:** la búsqueda por similitud funciona, pero recorre el corpus
entero. Aceptable con volumen de desarrollo, inaceptable en producción. Queda registrado en
cada arranque para que no se olvide.

Cuando el modelo fije la dimensión: cambiar `columnType: 'vector'` por `'vector(N)'` en
`vector_embeddings.entity.ts` y la condición previa del catálogo se cumplirá sola.

## Qué tener en cuenta

- **`chunk_text_redacted`** ya viene redactado. No es el texto original: el original vive en
  el object storage, y aquí solo entra lo que puede indexarse.
- **`embedding_hash` y `chunk_hash`** permiten deduplicar y detectar reprocesos sin comparar
  vectores.
- **Sin la extensión `vector` instalada**, el arranque no puede ni crear estas tablas. Es la
  única razón por la que la capa 01 va antes que la 04.
- **Los arrays** (`security_labels`, `purpose_of_use_codes`, `allowed_principal_types`) se
  mapean con `type: 'array'`, la convención del repositorio para columnas `varchar[]`.
