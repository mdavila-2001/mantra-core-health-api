# Servicios — graph_intelligence

Tres servicios. Cada método público es un caso de uso completo dentro de un único
`em.transactional`.

| Servicio | UC | Qué hace |
| --- | --- | --- |
| `graph-projection.service.ts` | 01, 02, 03, 10, 12 | escribe el grafo desde los eventos canónicos |
| `graph-traversal.service.ts` | 04, 05 | gobierna el acceso y recorre |
| `graph-analytics.service.ts` | 06, 07, 08, 09, 11 | registra analítica y purga |

## GraphProjectionService

Dos reglas lo estructuran, y las dos vienen de que el grafo sea una proyección:

1. **Idempotencia por clave natural** — los eventos se reprocesan.
2. **Guarda de versión** — un evento que llega tarde nunca pisa a uno posterior.

- `upsertNode` (UC-61-01) — la comparación de versión usa `BigInt`. Es lo que evita el fallo sutil:
  `'10' < '9'` como texto pero 10 > 9 como número, y una guarda ingenua descartaría el evento bueno.
- `upsertEdge` (UC-61-02) — la confianza **se calcula**, no se recibe. `recalculateConfidence` suma
  desde la evidencia entera y no incrementalmente: sumar sobre el valor guardado haría que un recorte
  en el tope se perdiera para siempre —una vez que la suma pasa de 1, los deltas negativos
  posteriores partirían de 1 en vez del acumulado real—.
- `startProjectionRun` / `advanceProjectionRun` (UC-61-03) — una sola corrida viva; checkpoint
  monótono; los contadores se acumulan con `BigInt` porque son `bigint` en el modelo.
- `expireEdge` (UC-61-10) — no borra; invalida las rutas cacheadas que pasaban por la arista. Es
  idempotente sobre una arista ya cerrada.
- `reconcileSourceVersion` (UC-61-12) — tres efectos que van juntos: actualizar el nodo, invalidar
  rutas y **caducar los puntajes de riesgo**. Lo último es lo menos evidente: un riesgo calculado
  sobre una versión anterior sigue siendo un número creíble.

## GraphTraversalService

`walk()` es el corazón: recorrido en anchura con **poda por seguridad**. Un nodo fuera de alcance no
se visita, así que tampoco se recorren sus aristas ni se llega a lo que hay detrás. Filtrar al final
daría el mismo listado pero habría revelado la topología por el camino.

Cada nivel pide todas sus aristas de una vez (`findActiveEdgesFrom` con la frontera entera): con un
nodo muy conectado, una consulta por nodo serían cientos de viajes a la base para un solo salto.

- `effectiveRelationshipTypes` **intersecta** el filtro pedido con el del alcance. Pedir un tipo que
  el alcance no permite no puede ampliarlo.
- `hashFilter` hashea el filtro **efectivo**, no el pedido: dos consultas con filtros distintos que
  se reducen al mismo conjunto son la misma consulta y deben compartir entrada de caché.
- `findPath` consulta la caché **después** de validar el alcance. Al revés, un actor sin permiso
  recibiría de la caché una ruta que no tiene derecho a ver, y el filtro de seguridad sería un adorno
  que sólo se aplica cuando falla la caché.
- Se cachea también la **ausencia** de camino: recalcular una ausencia cuesta lo mismo que calcular
  una presencia, y es la consulta que más se repite.
- `updateAccessScope` publica el evento en **cualquier** cambio, también uno de estado: las cachés de
  sesión guardan qué puede ver cada actor, y sin invalidarlas suspender un alcance no suspendería
  nada hasta que expiraran solas.

## GraphAnalyticsService

Este servicio **no calcula** comunidades ni riesgo, y no evalúa expresiones de traversal: los recibe
ya calculados del worker.

- `detectCommunities` (UC-61-06) — reemplaza entero el resultado de la versión del algoritmo. Una
  detección parcial no es un resultado; mezclar dos ejecuciones daría comunidades que nunca
  coexistieron. Las versiones anteriores conviven.
- `computeRiskScores` (UC-61-07) — cada puntaje caduca; sólo se alerta por encima del umbral. Si no
  llega explicación nueva se conserva la anterior: vaciarla borraría el porqué de un puntaje que
  sigue vivo.
- `evaluateRule` (UC-61-08) — deduplica por `(regla, nodo principal)` mientras haya un hallazgo vivo.
  Cuando el anterior se cierra, un patrón que vuelve a darse **sí** abre uno nuevo.
- `triageRuleHit` (UC-61-09) — transiciones de `HIT_TRANSITIONS`; un hallazgo cerrado no se reabre.
- `requestDeletion` (UC-61-11) — la purga completa, en orden: rutas cacheadas, evidencia, aristas,
  riesgo, identificadores, **pertenencia a comunidades** y por último el nodo.

  La evidencia antes que la arista, o quedaría apuntando a una arista que ya no existe. Y la
  depuración de `member_node_ids[]` es lo que se olvida con más facilidad: un nodo borrado que sigue
  en el array de una comunidad deja su identificador vivo, y el derecho al olvido no se cumple a
  medias.

## Transacciones

Un caso de uso, una transacción. `OutboxService.publishDomainEvent(tx, …)` recibe la transacción
abierta y se enlista en ella.

## Errores

`ConflictException` (409) para código de alcance repetido, checkpoint que retrocede y transición de
hallazgo no permitida. `PreconditionFailedException` (422) para definición o alcance inactivo,
propósito no admitido, nodo fuera de alcance, arista entre tenants y extremos sin proyectar.
`ResourceNotFoundException` (404) para referencias que no resuelven.

## Logs

`operation: 'graph.<área>.<acción>'`. `warn` en hallazgo de regla, purga y reconciliación de un
borrado. No se loguean etiquetas de nodo, identificadores ni explicaciones de riesgo.
