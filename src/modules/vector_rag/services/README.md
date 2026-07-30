# Servicios — vector_rag

Cuatro servicios. Cada método público es un caso de uso completo dentro de un único
`em.transactional`.

| Servicio | UC | Qué hace |
| --- | --- | --- |
| `vector-governance.service.ts` | 01, 02, 03, 13 | qué modelos, qué colecciones, bajo qué política, hasta cuándo |
| `embedding-pipeline.service.ts` | 04, 05, 11 | encolar, ejecutar y migrar de modelo |
| `retrieval.service.ts` | 06, 07, 08, 09 | consultar con autorización por chunk |
| `vector-maintenance.service.ts` | 10, 12 | borrar lo derivado y reconciliar contra la fuente |

## VectorGovernanceService

- `registerModelVersion` (UC-59-01) — la aprobación para PHI se registra con `approvedAt`: es la
  decisión que después habilita crear colecciones con datos de paciente, y tiene que poder auditarse
  aparte del alta del modelo.
- `createCollection` (UC-59-02) — tres comprobaciones inseparables: modelo no retirado, modelo
  aprobado para PHI si la colección lo va a contener, y **dimensión y métrica tomadas del modelo**,
  no del cuerpo de la petición.
- `defineRagPolicy` / `publishRagPolicy` (UC-59-03) — la política nace en borrador y no gobierna
  nada; publicar es el momento en que la revisión de privacidad pasa a tener efecto, y por eso
  reenlazar las colecciones va en la misma transacción.
- `retireModelVersion` (UC-59-13) — marca `retired_at`, no borra. Se rechaza si hay jobs vivos.
- `updateCollectionLifecycle` (UC-59-13) — sellar congela los bindings; deprecar no. Pedir el estado
  que ya tiene devuelve sin tocar nada ni publicar evento.

## EmbeddingPipelineService

**Este servicio no calcula embeddings.** Los recibe ya calculados del worker. Lo que aporta es que el
corpus quede consistente y que reejecutar no duplique nada.

- `queueEmbeddingJob` (UC-59-04) — sólo sobre colección activa. Sin cabecera `Idempotency-Key`,
  `deriveScopeKey` la deriva por hash de `(colección, tipo, alcance)`: el mismo trabajo pedido dos
  veces produce la misma clave sin que el llamante tenga que acordarse.
- `runEmbeddingJob` (UC-59-05) — el método central. Documento, chunks y vectores en una sola
  transacción: un chunk sin su vector es invisible para la búsqueda y a la vez cuenta como presente
  en la reconciliación. Reejecutar es seguro en los tres niveles por sus claves naturales, y el
  contador `chunksSkipped` distingue "no hice nada porque ya estaba" de "no hice nada porque falló".
- `reEmbedCollection` (UC-59-11) — los vectores del modelo anterior pasan a `superseded`, no se
  borran: la colección sigue sirviendo búsquedas mientras corre la migración. La clave
  `(chunk, modelo)` es lo que permite esa convivencia sin colisión.

## RetrievalService

`decide()` es el corazón del módulo. Devuelve uno de cuatro valores y el **orden de las
comprobaciones no es arbitrario**: primero el ámbito de paciente —el fallo más grosero, mostrar el
expediente de otra persona—, después el consentimiento, y por último las etiquetas de seguridad, que
es el filtro más fino.

```
patientScopeRequired && documento de otro paciente ──> deny_scope
documento con PHI && consentRequired && sin directiva ──> deny_consent
alguna etiqueta fuera de las permitidas ──────────────> deny_label
                                                        allow
```

- `openSession` (UC-59-06) — exige política **publicada**. La consulta se guarda redactada y con su
  hash: el hash identifica la pregunta —para deduplicar y agrupar— sin conservar lo que el clínico
  escribió.
- `rankCandidates` (UC-59-07) — ordena por `rerankerScore ?? vectorScore` **antes** de decidir, para
  que el rango sea el del ranking y no el orden en que el worker mandó los candidatos. Guarda todos
  los candidatos con su decisión, también los denegados, y `deniedByReason` resume por qué.
  `topK` recorta **entre los autorizados**.
- `materializeEvidence` (UC-59-08) — sólo cita lo seleccionado y autorizado; la `sourceVersionId` se
  copia del documento en vez de recibirse, y el `evidenceHash` liga la cita a su texto para poder
  comprobar después que la respuesta citaba lo que decía citar.
- `captureFeedback` (UC-59-09) — un `safetyIssueCode` marca la sesión `flagged` y publica un segundo
  evento: un fallo de relevancia se agrega en una métrica, uno de seguridad tiene que llegar a
  alguien.

## VectorMaintenanceService

Los dos casos de uso responden a la misma verdad: **un embedding es un dato derivado**.

- `propagateDeletion` (UC-59-10) — borrado **físico** y en orden: embeddings, chunks, documentos. Al
  revés, un fallo a mitad dejaría chunks y vectores apuntando a un documento que ya no existe.
  `verified` significa que la pasada no llenó el lote, es decir, que no quedaba nada más: es la
  prueba de borrado que el módulo 62 espera.
- `reconcileCollection` (UC-59-12) — tres clases de deriva y una reparación distinta para cada una:
  lo que **falta** se re-embebe, lo **huérfano** se purga —es derivado de algo que dejó de existir— y
  lo **descuadrado** se re-embebe porque representa una versión que ya no es la buena. `autoRepair`
  es opcional: a veces lo que hace falta es saber cuánta deriva hay antes de decidir si conviene
  arreglarla ahora.

  El hash del manifiesto vectorial se calcula sobre los ids **ordenados**, para que dos ejecuciones
  con el mismo contenido en distinto orden den el mismo hash.

## Transacciones

Un caso de uso, una transacción. `OutboxService.publishDomainEvent(tx, …)` recibe la transacción
abierta y se enlista en ella.

## Errores

`ConflictException` (409) para códigos y versiones repetidas, modelo ya retirado y migración al mismo
modelo. `PreconditionFailedException` (422) para estados incompatibles, política sin publicar,
requisitos de la política y aprobación de PHI. `ResourceNotFoundException` (404) para referencias que
no resuelven.

## Logs

`operation: 'vector.<área>.<acción>'`. `warn` en retirada de modelo, re-embedding, sellado, borrado
propagado, deriva detectada y problema de seguridad. No se loguean textos de chunk, consultas ni
citas.
