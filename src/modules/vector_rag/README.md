# Módulo 59 — Búsqueda vectorial, evidencia RAG y gobierno de embeddings

Modelos de embedding aprobados uno a uno, colecciones que sólo aceptan lo que su modelo permite,
políticas de acceso que se publican tras revisión de privacidad, y un retrieval en el que **cada
candidato recibe una decisión de autorización y todas se guardan** — también las denegadas.

## Casos de uso cubiertos (13)

| UC | Endpoint | Descripción |
| --- | --- | --- |
| UC-59-01 | `POST /vector-rag/embedding-model-versions` | Registrar y aprobar versión de modelo |
| UC-59-02 | `POST /vector-rag/collections` | Colección gobernada + binding de tenant |
| UC-59-03 | `POST /vector-rag/rag-access-policies` · `PUT .../:id/publish` | Definir y publicar política |
| UC-59-04 | `POST /vector-rag/collections/:id/embedding-jobs` | Encolar job de embedding |
| UC-59-05 | `POST /vector-rag/embedding-jobs/:id/run` | Chunking + embedding + upsert |
| UC-59-06 | `POST /vector-rag/retrieval-sessions` | Sesión consent-aware |
| UC-59-07 | `POST /vector-rag/retrieval-sessions/:id/search` | Ranquear y filtrar |
| UC-59-08 | `POST /vector-rag/retrieval-sessions/:id/evidence` | Evidencia citable |
| UC-59-09 | `POST /vector-rag/retrieval-sessions/:id/feedback` | Feedback de relevancia y seguridad |
| UC-59-10 | `POST /vector-rag/deletion-jobs` | Propagar borrado a embeddings |
| UC-59-11 | `POST /vector-rag/collections/:id/re-embed` | Re-embeber tras cambio de modelo |
| UC-59-12 | `POST /vector-rag/collections/:id/reconciliation` | Reconciliar canónico vs vectorial |
| UC-59-13 | `POST .../embedding-model-versions/:id/retire` · `PUT .../collections/:id/lifecycle` | Retirar y sellar |

15 endpoints para 13 casos de uso: UC-59-03 y UC-59-13 tienen dos cada uno.

## Estados en `varchar`, en minúsculas

Como `object_storage`, `polyglot_storage` y `time_series`, este esquema no usa `*_concept_id`. Todo
vive en `constants/vector-rag.constants.ts`.

## Por qué el rastro de recuperación es parte del modelo

`retrieval_sessions`, `retrieval_candidates`, `retrieval_evidence` y `retrieval_feedback_events` no
son telemetría opcional: son lo que permite **auditar por qué un asistente clínico respondió lo que
respondió**, y también qué se le ocultó. En un sistema regulado, una respuesta generada sin poder
reconstruir qué fragmentos la fundamentaron no es defendible.

`rag_access_policies` y `vector_tenant_bindings` acotan qué corpus puede ver cada principal y cada
tenant: la búsqueda vectorial no puede saltarse el aislamiento multi-tenant sólo porque el índice sea
global.

## Flujo general

```
GOBIERNO
  embedding-model-versions ──> modelo aprobado (y quizá aprobado para PHI)
  rag-access-policies ───────> política DRAFT
    └─ /publish ─────────────> PUBLISHED + reenlaza colecciones
  collections ───────────────> dimensión y métrica DEL MODELO
                               PHI exige modelo aprobado para PHI
                               + binding de tenant ACTIVE

INGESTA
  collections/:id/embedding-jobs ──> job QUEUED (idempotente por alcance)
    └─ embedding-jobs/:id/run ─────> documento + chunks + vectores, misma tx
                                     reejecutar no duplica en ningún nivel
                                     finalBatch ⇒ job COMPLETED

CONSULTA
  retrieval-sessions ──> exige política PUBLISHED, propósito admitido,
                         y —si la política lo pide— paciente y consentimiento
    └─ /search ────────> por cada candidato: allow · deny_scope · deny_consent · deny_label
                         TODAS se guardan; topK recorta entre los autorizados
    └─ /evidence ──────> sólo lo seleccionado y autorizado; versión fuente copiada
                         sesión COMPLETED
    └─ /feedback ──────> safety_issue ⇒ sesión FLAGGED + evento aparte

MANTENIMIENTO
  deletion-jobs ──────────────> borrado FÍSICO: embeddings → chunks → documentos
  collections/:id/reconciliation > falta / huérfano / descuadrado, y su reparación
  collections/:id/re-embed ───> modelo nuevo; los vectores viejos a `superseded`
  .../retire · /lifecycle ────> modelo retirado, colección sellada, bindings congelados
```

## Reglas de negocio

- **La dimensión y la métrica salen del modelo, no de la petición.** El vector que produce un modelo
  tiene la dimensión que tiene; declararla distinta no la cambia, sólo hace que el índice no sirva.
- **PHI exige modelo aprobado para PHI.** Mandar datos de paciente a un proveedor no aprobado es una
  fuga, no un error de configuración.
- **No se crean colecciones sobre un modelo retirado**: nacerían ya obsoletas.
- **Una política en borrador no gobierna nada.** Consultar bajo ella sería aplicar reglas de
  privacidad que nadie ha aprobado todavía.
- **Exigir consentimiento obliga a exigir ámbito de paciente.** Sin saber de quién es la consulta, el
  consentimiento no tiene nada que comprobar.
- **Sólo se encolan jobs sobre colección activa**: encolar contra una sellada deja trabajo que nunca
  debería ejecutarse, y el worker no tiene forma de saberlo.
- **Reejecutar un job es seguro en los tres niveles**: el documento se reencuentra por su versión
  fuente, el chunk por su hash y el embedding por `(chunk, modelo)`.
- **Un chunk sin su vector no puede existir.** Sería invisible para la búsqueda y, a la vez, contaría
  como presente en la reconciliación; por eso los tres niveles van en una sola transacción.
- **Un job no sigue si su modelo se retiró a mitad**: lo que produjera a partir de ahí ya no sería
  utilizable.
- **La autorización se evalúa por chunk y se registra, incluida la denegación.** Es la diferencia
  entre "la respuesta salió corta" y "salió corta porque faltaba el consentimiento de estos tres
  documentos".
- **Los tres motivos de denegación se distinguen.** `deny_scope`, `deny_consent` y `deny_label` son
  fallos distintos; colapsarlos en un `deny` genérico haría imposible saber qué arreglar.
- **`topK` recorta entre los autorizados, no antes de decidir.** Si recortara antes, un documento
  permitido podría quedar fuera por culpa de otros que ni siquiera se podían mostrar.
- **Sólo se cita lo seleccionado y autorizado**, y la versión fuente se copia del documento en vez de
  recibirse: una cita tiene que apuntar a la versión que se leyó, no a la que diga el llamante.
- **Un problema de seguridad marca la sesión y publica su propio evento.** Un fallo de relevancia se
  agrega en una métrica; uno de seguridad tiene que llegar a alguien.
- **El borrado es físico, no un cambio de estado.** Un embedding marcado como borrado sigue siendo el
  dato del paciente que pidió que se borrara, y el índice seguiría pudiendo devolverlo.
- **El orden del borrado es embeddings → chunks → documentos.** Al revés, un fallo a mitad dejaría
  chunks y vectores apuntando a un documento que ya no existe.
- **Al re-embeber, los vectores viejos pasan a `superseded`, no se borran.** Es lo que permite seguir
  sirviendo búsquedas mientras corre la migración; borrarlos primero dejaría la colección ciega.
- **Retirar un modelo no lo borra** y se rechaza si hay jobs vivos que dependen de él: retirarlo con
  un job a medias dejaría media colección con un modelo y media con otro.
- **Sellar congela los bindings.** Sin eso, "sellada" sería una etiqueta que no impide nada. Y volver
  a `active` no descongela: reabrir una colección sellada merece su propia decisión.

## Idempotencia, en cinco sitios distintos

| Dónde | Clave | Por qué |
| --- | --- | --- |
| Job de embedding | `(colección, tipo, alcance)`, derivada por hash | el mismo backfill pedido dos veces es el mismo trabajo |
| Documento | `(colección, documento fuente, versión fuente)` | un reintento no puede duplicar el corpus |
| Chunk | `(documento, hash del texto)` | el mismo texto trocea igual |
| Embedding | `(chunk, versión de modelo)` | hace idempotente el re-run **y** permite convivencia old/new |
| Sesión | `(tenant, principal, hash de consulta)` mientras esté abierta | un cliente que reintenta no abre dos accesos al histórico |

## Lo que este módulo no hace

**No calcula embeddings ni ejecuta la búsqueda ANN.** Los recibe ya calculados y ya ranqueados del
worker. Lo que aporta es el gobierno: qué modelo se puede usar, qué puede entrar en la colección,
quién puede ver cada chunk y qué queda registrado de todo ello.

## El índice HNSW y su deuda (heredada de la capa de esquema)

`vector_embeddings.embedding` es de tipo `vector` (pgvector). El índice HNSW que hace viable la
búsqueda por similitud lo crea la capa 07 del arranque, **pero hoy se omite**:

```
WARN Omitido "index:vector_rag.vector_embeddings.embedding": la columna no declara
     dimensión; el modelo la define como "vector" sin tamaño y HNSW exige una dimensión fija
```

El modelo declara la columna como `vector` a secas. pgvector admite esa forma para almacenar pero no
para indexar, y fijar aquí una dimensión (1536, 3072…) sería inventar una decisión que pertenece al
modelo y que además es irreversible sin recrear la tabla.

**Consecuencia operativa:** la búsqueda por similitud funciona, pero recorre el corpus entero.
Aceptable con volumen de desarrollo, inaceptable en producción. Queda registrado en cada arranque
para que no se olvide.

Cuando el modelo fije la dimensión: cambiar `columnType: 'vector'` por `'vector(N)'` en
`vector_embeddings.entity.ts` y la condición previa del catálogo se cumplirá sola.

## Permisos

`AI_GOVERNANCE_OFFICER` y `MLOPS_ENGINEER` aprueban y retiran modelos y ordenan re-embedding.
`RAG_COLLECTION_ADMIN` crea colecciones y encola trabajo. `PRIVACY_OFFICER` / `DPO` definen y
publican políticas y ordenan borrados. `CLINICIAN` y `AGENT_RUNTIME` abren sesiones y dan feedback.
`SYSTEM` y los workers ejecutan jobs, ranquean, citan y reconcilian. `PLATFORM_ADMIN` cubre todo.

**Quien consulta no ranquea.** `CLINICIAN` abre la sesión, pero el filtrado por autorización lo hace
`RETRIEVAL_WORKER`: si el mismo principal pudiera decidir qué se le muestra, la política no filtraría
nada.

Ninguna ruta es pública.

## Concurrencia

`FOR UPDATE` sobre el modelo al validar su aprobación —una colección no puede nacer atada a algo que
se está retirando en la transacción de al lado—, sobre la colección al reenlazar política, re-embeber
o sellar, sobre el job al ejecutarlo, sobre la sesión en cada paso del retrieval y sobre los
embeddings que se marcan como superados.

`FOR UPDATE SKIP LOCKED` en dos sitios: la cola de jobs (`findNextQueuedJobForUpdate`) y el barrido de
documentos a purgar. En los dos, esperar a una fila que otro proceso está tocando retrasaría a todas
las demás.

## Logs

`operation: 'vector.<área>.<acción>'`. Nivel `warn` en retirada de modelo, re-embedding, sellado,
borrado propagado, deriva detectada y problema de seguridad. No se loguean textos de chunk, consultas
ni citas.

## Pruebas

`yarn test --testPathPatterns=modules/vector_rag` — 94 pruebas (21 gobierno + 20 pipeline +
25 retrieval + 13 mantenimiento + 15 de delegación de los dos controladores).

## Divergencias con el caso de uso v3.9

- **Segmentos planos en vez de `:accion`.** El caso de uso escribe `{id}:retire`. Nest 11 monta sobre
  `path-to-regexp` v8, que trata `:` como inicio de parámetro en cualquier posición del segmento.
- **UC-59-05, 10 y 12 tienen endpoint público.** El caso de uso los marca como *workers internos*
  (`/workers/embedding/run`, `/workers/vector-deletion/run`, `/workers/vector-reconciliation/run`).
  Se publican bajo `/vector-rag/…` con rol de sistema, siguiendo la convención del resto del
  proyecto: el worker es un cliente autenticado más.
- **UC-59-03 publica con `PUT .../{id}/publish`** en vez de un `PUT` sobre el recurso completo. El
  caso de uso dice "PUT para publicar"; separar la publicación de la edición deja claro cuál de las
  dos tiene efecto sobre las consultas.

## Pendiente

- **Cálculo de embeddings y búsqueda ANN**: el worker los aporta. Este módulo no habla con ningún
  proveedor de modelos ni ejecuta `<=>` contra el índice.
- **Índice HNSW**: bloqueado por la dimensión sin fijar (ver arriba).
- **Redacción del texto**: los DTOs reciben `chunkTextRedacted`, `queryTextRedacted`,
  `quotedTextRedacted` y `commentRedacted` — el redactado ocurre antes, en el worker. Aquí se
  garantiza que el campo que llega es el que se persiste, no que esté efectivamente redactado.
- **`field_redaction_profile`**: se guarda en la política pero no se aplica. Aplicarlo exige el
  catálogo de perfiles de redacción, que el modelo no declara.
- **Comprobación del consentimiento contra `consent.consent_directives`** (UC-59-06, 07): se exige y
  se propaga el `consentDirectiveId`, pero no se contrasta contra el módulo 07, que es de la parte de
  Pablo. Hoy `deny_consent` se decide por la ausencia de la directiva, no por su contenido.
- **`redis_runtime.idempotency_entries`** (UC-59-04, 06): aquí lo cubren la clave de idempotencia del
  outbox y la búsqueda de sesión abierta por hash. Ese esquema es del módulo 56, **sin asignar**.
- **Detección fina de descuadre** (UC-59-12): hoy se detecta por documento con más de una versión
  activa. Comparar `content_hash` contra el manifiesto canónico exige que el manifiesto traiga los
  hashes, que el caso de uso menciona pero no define en la petición.
