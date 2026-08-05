# Repositorios — vector_rag

Tres repositorios. Ninguno abre transacción: todos reciben el `EntityManager` transaccional del
servicio como primer parámetro.

| Repositorio | Tablas |
| --- | --- |
| `vector-catalog.repository.ts` | `embedding_model_versions`, `vector_collections`, `vector_tenant_bindings`, `rag_access_policies`, `embedding_jobs` |
| `vector-corpus.repository.ts` | `vector_documents`, `vector_chunks`, `vector_embeddings`, `vector_deletion_jobs`, `vector_reconciliation_runs` |
| `retrieval.repository.ts` | `retrieval_sessions`, `retrieval_candidates`, `retrieval_evidence`, `retrieval_feedback_events` |

El corte es por qué gobierna cada uno: lo que decide qué está permitido, lo que guarda el corpus, y
lo que registra cada consulta.

## Las cinco claves naturales

Todo el módulo se apoya en búsquedas por clave natural para ser idempotente. Cada `find*` de esta
lista existe por un motivo concreto:

| Método | Clave | Qué impide |
| --- | --- | --- |
| `findDocument` | `(colección, documento fuente, versión fuente)` | que un reintento duplique el corpus |
| `findChunkByHash` | `(documento, hash)` | que el mismo texto se trocee dos veces |
| `findEmbedding` | `(chunk, versión de modelo)` | que el re-run reembeba, y a la vez permite convivencia old/new |
| `findOpenSessionByHash` | `(tenant, principal, hash de consulta)` | que un cliente que reintenta abra dos accesos |
| `findModelVersion` | `(proveedor, modelo, versión)` | registrar dos veces la misma versión |

## Bloqueos

`FOR UPDATE` (`LockMode.PESSIMISTIC_WRITE`):

| Método | Por qué |
| --- | --- |
| `findModelVersionForUpdate` | una colección no puede nacer atada a un modelo que se está retirando en la transacción de al lado |
| `findCollectionForUpdate` | reenlazar política, re-embeber y sellar compiten por la misma fila |
| `findPolicyByCodeForUpdate` | dos altas del mismo código |
| `findJobForUpdate` | dos lotes del mismo job |
| `findBindingsByCollectionForUpdate` | el sellado los congela todos a la vez |
| `findEmbeddingsByChunksAndModelForUpdate` | el re-embedding los marca como superados |
| `findSessionForUpdate` | abrir → ranquear → citar → feedback, cada paso mueve el estado |

`FOR UPDATE SKIP LOCKED` en dos:

- `findNextQueuedJobForUpdate` — la cola de jobs, en orden de llegada. Dos workers se reparten la
  cola en vez de pelearse por la misma fila.
- `findDocumentsForDeletion` — el barrido de purga. Esperar a un documento que otro proceso está
  tocando retrasaría todo el resto del borrado.

## Borrado físico

`deleteEmbeddingsByChunks`, `deleteChunks` y `deleteDocuments` usan `nativeDelete`, no un cambio de
estado. Es deliberado: un embedding es una representación del contenido, y guardarlo "marcado como
borrado" seguiría siendo guardar el dato de quien pidió que se borrara.

Los tres devuelven cuántas filas tocaron, que es lo que el servicio informa como prueba de borrado.

Todos devuelven `0` sin tocar la base si la lista de ids viene vacía: un `IN ()` sin elementos es un
error de sintaxis en Postgres, y componerlo sería fallar en el caso más común —que no haya nada que
borrar—.

## Append-only

`retrieval_candidates`, `retrieval_evidence` y `retrieval_feedback_events` sólo tienen `create*` y
lecturas. Son el registro de qué se consultó, qué se dejó ver y por qué; editable, no serviría para
auditar la respuesta que se le dio a un clínico.

`findSelectedCandidates` filtra por `selected: true` **y** `authorizationDecision: 'allow'`. Los dos:
`selected` sin `allow` sería un candidato que el ranking eligió pero la política rechazó, y citarlo
sería exactamente la fuga que el módulo existe para evitar.

## Arrays

`securityLabels`, `purposeOfUseCodes`, `allowedPrincipalTypes`, `allowedPurposeCodes` y
`allowedSecurityLabels` son columnas `varchar[]`, mapeadas con `type: 'array'` según la convención
del repositorio. Se comparan en memoria en el servicio, no con operadores de array en SQL: la
decisión de autorización tiene que quedar registrada por candidato, y eso obliga a evaluarla fila a
fila de todas formas.
