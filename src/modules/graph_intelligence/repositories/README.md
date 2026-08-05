# Repositorios — graph_intelligence

Dos repositorios. Ninguno abre transacción: los dos reciben el `EntityManager` transaccional del
servicio como primer parámetro.

| Repositorio | Tablas |
| --- | --- |
| `graph-projection.repository.ts` | `graph_nodes`, `graph_node_identifiers`, `graph_edges`, `graph_edge_evidence`, `graph_projection_definitions`, `graph_projection_runs` |
| `graph-analytics.repository.ts` | `graph_access_scopes`, `graph_path_cache`, `graph_communities`, `graph_risk_scores`, `graph_rule_definitions`, `graph_rule_hits`, `graph_deletion_jobs` |

El corte es entre lo que **escribe** el grafo desde los eventos canónicos y lo que **gobierna y
explota** lo ya escrito.

## Las claves primarias no se llaman `id`

`GraphNodes` usa `nodeId` y `GraphEdges` usa `edgeId`; el resto de entidades sí usan `id`. Es lo que
generó el modelo, y por eso las búsquedas por identificador de esas dos van con su nombre real
(`{ nodeId: id }`, `{ edgeId: id }`). Conviene tenerlo presente al añadir métodos.

## Las claves naturales

La idempotencia de toda la proyección se apoya en cuatro búsquedas:

| Método | Clave | Qué impide |
| --- | --- | --- |
| `findNodeBySourceForUpdate` | `(tenant, tipo fuente, id fuente)` | que el mismo evento cree dos nodos |
| `findEdgeBySourceForUpdate` | `(tenant, tipo fuente, id fuente, tipo de relación)` | lo mismo con las aristas |
| `findIdentifier` | `(nodo, sistema, **hash**)` | duplicar un identificador |
| `findEvidenceByHash` | `(arista, hash)` | que reprocesar suba la confianza dos veces |

`findIdentifier` busca por el **hash**, nunca por el valor: el módulo no guarda documentos de
identidad en claro, y buscar por el valor obligaría a tenerlo.

## Bloqueos

`FOR UPDATE` (`LockMode.PESSIMISTIC_WRITE`):

| Método | Por qué |
| --- | --- |
| `findNodeBySourceForUpdate` | dos eventos del mismo agregado compiten por la misma fila |
| `findEdgeBySourceForUpdate` · `findEdgeForUpdate` | proyectar y expirar la misma arista |
| `findScopeByCodeForUpdate` | alta, ajuste y lectura durante un traversal |
| `findRunForUpdate` | dos lotes de la misma corrida |
| `findHitForUpdate` | dos revisores moviendo el mismo hallazgo |
| `findRiskScoreForUpdate` · `findRiskScoresByNodesForUpdate` | recálculo y caducidad |
| `findDeletionJobForUpdate` | dos ejecuciones de la misma purga |

`findRunningRunForUpdate` es el único con `PESSIMISTIC_PARTIAL_WRITE` (`SKIP LOCKED`), y por un
motivo distinto al habitual: **no** es una cola. Dos disparos concurrentes de la misma definición no
deben esperarse — el segundo tiene que ver que ya hay una corriendo y rendirse. Con un `FOR UPDATE`
normal se quedaría bloqueado hasta que la primera terminase y entonces abriría una segunda corrida,
que es exactamente lo que se quiere evitar.

## Append-only

`graph_edge_evidence` sólo tiene `create*` y lecturas (más el borrado en cascada de la purga). La
evidencia es lo que justifica la confianza de una arista; poder editarla convertiría la confianza en
un número sin respaldo.

## La invalidación de caché, en memoria

`deleteCachedPathsTouchingEdges` y `deleteCachedPathsTouchingNodes` leen las entradas del tenant y
filtran en memoria en vez de usar los operadores de array de Postgres. Es deliberado: la caché es
pequeña por definición —tiene TTL— y así el módulo no depende de la sintaxis de arrays para una
invalidación que tiene que ser obviamente correcta. Si la caché creciera, el operador `&&` con su
índice GIN sería el cambio a hacer.

## Borrado físico

`deleteNodes`, `deleteEdges`, `deleteEvidenceByEdges`, `deleteIdentifiersByNodes`,
`deleteRiskScoresByNodes` y `deleteCommunities` usan `nativeDelete`. El derecho al olvido no se
cumple marcando una fila.

Todos devuelven `0` sin tocar la base si la lista de ids viene vacía: un `IN ()` sin elementos es un
error de sintaxis en Postgres, y componerlo sería fallar en el caso más común.

## `findActiveEdgesFrom` toma un nivel entero

Recibe **todos** los nodos de la frontera del recorrido, no uno. Con un nodo muy conectado, una
consulta por nodo serían cientos de viajes a la base para un solo salto.
