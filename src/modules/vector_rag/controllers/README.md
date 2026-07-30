# Controladores — vector_rag

Dos controladores, 15 endpoints para 13 casos de uso. Todos delegan en un servicio y no contienen
lógica.

## `VectorGovernanceController` (8)

| Método · ruta | UC | Código | Rol |
| --- | --- | --- | --- |
| `POST /vector-rag/embedding-model-versions` | 01 | 201 | `AI_GOVERNANCE_OFFICER`, `MLOPS_ENGINEER`, `PLATFORM_ADMIN` |
| `POST /vector-rag/embedding-model-versions/:id/retire` | 13 | 200 | ídem |
| `POST /vector-rag/collections` | 02 | 201 | `RAG_COLLECTION_ADMIN`, `PLATFORM_ADMIN` |
| `POST /vector-rag/rag-access-policies` | 03 | 201 | `PRIVACY_OFFICER`, `DPO`, `PLATFORM_ADMIN` |
| `PUT /vector-rag/rag-access-policies/:id/publish` | 03 | 200 | ídem |
| `POST /vector-rag/collections/:id/embedding-jobs` | 04 | 201 | `RAG_COLLECTION_ADMIN`, `PLATFORM_ADMIN` |
| `POST /vector-rag/collections/:id/re-embed` | 11 | 201 | `AI_GOVERNANCE_OFFICER`, `MLOPS_ENGINEER`, `PLATFORM_ADMIN` |
| `PUT /vector-rag/collections/:id/lifecycle` | 13 | 200 | `AI_GOVERNANCE_OFFICER`, `RAG_COLLECTION_ADMIN`, `PLATFORM_ADMIN` |

## `VectorRuntimeController` (7)

| Método · ruta | UC | Código | Rol |
| --- | --- | --- | --- |
| `POST /vector-rag/embedding-jobs/:id/run` | 05 | 200 | `SYSTEM`, `EMBEDDING_WORKER`, `PLATFORM_ADMIN` |
| `POST /vector-rag/retrieval-sessions` | 06 | 201 | `CLINICIAN`, `AGENT_RUNTIME`, `SYSTEM`, `PLATFORM_ADMIN` |
| `POST /vector-rag/retrieval-sessions/:id/search` | 07 | 200 | `SYSTEM`, `RETRIEVAL_WORKER`, `PLATFORM_ADMIN` |
| `POST /vector-rag/retrieval-sessions/:id/evidence` | 08 | 201 | ídem |
| `POST /vector-rag/retrieval-sessions/:id/feedback` | 09 | 201 | `CLINICIAN`, `AGENT_RUNTIME`, `PLATFORM_ADMIN` |
| `POST /vector-rag/deletion-jobs` | 10 | 201 | `PRIVACY_OFFICER`, `DPO`, `SYSTEM`, `PLATFORM_ADMIN` |
| `POST /vector-rag/collections/:id/reconciliation` | 12 | 201 | `SYSTEM`, `RECONCILIATION_WORKER`, `PLATFORM_ADMIN` |

## Quién puede hacer qué, y por qué importa

**Quien consulta no ranquea.** `CLINICIAN` abre la sesión y da feedback, pero `/search` es de
`RETRIEVAL_WORKER`. Si el mismo principal que pregunta pudiera decidir qué candidatos se le muestran,
la política de acceso no filtraría nada — sería una sugerencia.

**Quien crea colecciones no aprueba modelos.** `RAG_COLLECTION_ADMIN` monta colecciones;
`AI_GOVERNANCE_OFFICER` decide qué modelos existen y cuáles valen para datos de paciente. Es la
separación que impide que quien tiene prisa por indexar apruebe el modelo que le conviene.

**Quien borra es el DPO.** `/deletion-jobs` es de `PRIVACY_OFFICER` / `DPO` y `SYSTEM`, no del
administrador de colecciones.

## Códigos de estado

`201` en lo que crea una fila: modelo, colección, política, job, sesión, evidencia, feedback,
borrado, reconciliación.

`200` en lo que muta algo existente: retirar el modelo, publicar la política, ejecutar un lote del
job (el job ya existía), ranquear (la sesión ya existía) y cambiar el ciclo de vida.

## `PUT` en dos sitios

`PUT .../rag-access-policies/:id/publish` y `PUT .../collections/:id/lifecycle`. El caso de uso los
declara así, y encaja: las dos son idempotentes —publicar una política publicada, o pedir el estado
que ya tiene, no cambia nada—.

## Rutas planas

El caso de uso escribe `{id}:retire`. Nest 11 monta sobre `path-to-regexp` v8, que trata `:` como
inicio de parámetro en **cualquier** posición del segmento: `{id}:retire` declararía un parámetro
llamado `id}:retire` y la ruta no montaría.

## Las tres rutas bajo `collections/:id`

`embedding-jobs` y `re-embed` viven en el controlador de gobierno; `reconciliation`, en el de
ejecución. Nest las monta sin conflicto porque el último segmento es literal y distinto en las tres.
La separación es por quién las llama: las dos primeras las pide una persona, la tercera la ejecuta un
worker programado.

## `Idempotency-Key`

Sólo en `POST /collections/:id/embedding-jobs`, documentada con `@ApiHeader` como opcional. Si no
llega, el servicio la deriva del alcance del job — así que la cabecera es una comodidad, no un
requisito.

## Actor

Todas las rutas reciben `@CurrentUser()`. En el retrieval el actor **es** el principal de la sesión:
`openSession` lo usa como `principalId`, y `captureFeedback` como quien reporta. No se acepta un
`principalId` por el cuerpo — dejaría abrir sesiones a nombre de otro, y el histórico de acceso
dejaría de significar nada.

## Pruebas

15 pruebas de delegación en `vector-rag-controllers.spec.ts`.
