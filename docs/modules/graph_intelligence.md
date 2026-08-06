<!--
  ESPEJO AUTOGENERADO — no editar este archivo directamente.
  Fuente real: src/modules/graph_intelligence/README.md
  Regenerar con: yarn docs:modules:sync (tools/docs/sync-module-docs.mjs)
  Este README es el contrato por dominio mantenido junto al código
  (ver ESTADO-Y-PENDIENTES.md, tabla "Mapa documental").
-->

# Módulo `graph_intelligence`

**Fuente:** [`src/modules/graph_intelligence/README.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/modules/graph_intelligence/README.md)
· 2 controllers · 3 services · 2 repositories · 13 entidades · 1 DTO

---

# Módulo 61 — Inteligencia de grafo (relaciones, referidos y riesgo)

Proyección del grafo de relaciones desde los eventos canónicos, recorrido con scoping de seguridad
aplicado **dentro** del propio recorrido, analítica de comunidades y riesgo, reglas de fraude con
triage, y derecho al olvido propagado.

## La idea que gobierna el módulo entero

**El grafo es una proyección derivada, no la fuente de verdad.** Postgres lo es. De ahí salen todas
las decisiones de diseño:

- los upsert son idempotentes por clave natural, porque los eventos se reprocesan;
- un evento que llega tarde **nunca** pisa a uno posterior (guarda de `source_version`);
- el borrado en el grafo es consecuencia del borrado canónico, no una decisión propia;
- una divergencia se reconcilia contra la fuente, jamás al revés.

## Casos de uso cubiertos (12)

| UC | Endpoint | Descripción |
| --- | --- | --- |
| UC-61-01 | `POST /graph/projections/nodes/upsert` | Proyectar nodo + identificadores |
| UC-61-02 | `POST /graph/projections/edges/upsert` | Proyectar arista con evidencia |
| UC-61-03 | `POST /graph/projection-definitions/:id/runs` · `POST /graph/projection-runs/:id/advance` | Corrida incremental |
| UC-61-04 | `POST /graph/access-scopes` · `PATCH /graph/access-scopes/:id` | Alcance de acceso |
| UC-61-05 | `POST /graph/traverse` · `POST /graph/paths` | Recorrido y rutas con scoping |
| UC-61-06 | `POST /graph/analytics/community-detection` | Comunidades |
| UC-61-07 | `POST /graph/analytics/risk-scoring` | Puntajes de riesgo |
| UC-61-08 | `POST /graph/rules/:id/evaluate` | Hallazgos de regla |
| UC-61-09 | `PATCH /graph/rule-hits/:id` | Triage del hallazgo |
| UC-61-10 | `POST /graph/edges/:id/expire` | Expirar arista y decaer confianza |
| UC-61-11 | `POST /graph/deletion-jobs` | Derecho al olvido |
| UC-61-12 | `POST /graph/projections/reconcile` | Reconciliar versión fuente |

15 endpoints para 12 casos de uso: UC-61-03, 04 y 05 tienen dos cada uno.

## Estados en `varchar`, en minúsculas

Como los demás esquemas políglotas, éste no usa `*_concept_id`. Todo vive en
`constants/graph-intelligence.constants.ts`.

## Flujo general

```
PROYECCIÓN (todo lo llaman workers; nadie escribe el grafo a mano)
  projections/nodes/upsert ──> guarda de versión: si llega una anterior ⇒ stale, no se toca
                               identificadores SÓLO hasheados
  projections/edges/upsert ──> confianza = base + Σ deltas, acotada a [0,1]
                               evidencia repetida descartada por hash
  projection-definitions/:id/runs ──> una sola corrida viva por definición
    └─ projection-runs/:id/advance ─> checkpoint monótono; finalBatch cierra

GOBIERNO Y CONSULTA
  access-scopes ────> tipos de nodo, tipos de relación, propósitos, maxHops
    └─ PATCH ───────> cualquier cambio publica el evento que invalida cachés
  traverse / paths ─> alcance activo + propósito admitido + (paciente si se exige)
                      PODA POR SEGURIDAD dentro del recorrido
                      filtro pedido ∩ filtro del alcance
                      caché consultada DESPUÉS de validar

ANALÍTICA
  analytics/community-detection ──> reemplaza entera la versión del algoritmo
  analytics/risk-scoring ─────────> caduca; alerta sólo por encima del umbral
  rules/:id/evaluate ─────────────> dedup por (regla, nodo) mientras haya hallazgo vivo
    └─ rule-hits/:id ─────────────> open → in_review → resolved|dismissed, sin vuelta atrás

MANTENIMIENTO
  edges/:id/expire ──> no borra; invalida las rutas cacheadas que pasaban por ella
  deletion-jobs ─────> nodo + identificadores + aristas + evidencia + riesgo
                       + rutas cacheadas + pertenencia a comunidades
  projections/reconcile > actualiza, invalida rutas y CADUCA el riesgo
```

## Reglas de negocio

- **Un evento con `source_version` anterior se descarta** y se devuelve `stale: true`. Los eventos
  llegan sin orden garantizado; aplicar uno viejo devolvería el nodo a un estado que ya no es el
  canónico. La comparación es con `BigInt`, no con texto: `'10' < '9'` como cadena pero 10 > 9 como
  número, y ahí es donde una guarda ingenua falla.
- **Los identificadores entran sólo hasheados.** El grafo indexa relaciones, no documentos de
  identidad; guardar el valor en claro convertiría una proyección analítica en una copia del padrón.
- **La confianza se calcula, no se recibe.** `base + Σ deltas` acotada a `[0,1]`. Dejar que el
  llamante la declarara permitiría afirmar una relación con confianza 1 sin nada que la respalde, y
  las reglas de fraude la comparan contra un umbral.
- **Se recalcula desde la evidencia entera**, no incrementalmente: sumar sobre el valor guardado
  haría que un recorte en el tope se perdiera para siempre.
- **La evidencia repetida se descarta por su hash**: reprocesar el mismo evento no puede subir la
  confianza dos veces.
- **Una arista no cruza dos tenants**, y sus dos extremos tienen que estar proyectados antes que
  ella.
- **Reproyectar una arista cerrada la reabre**: el evento fuente dice que la relación vuelve a
  existir.
- **Una sola corrida viva por definición.** Dos a la vez escribirían los mismos nodos en desorden, y
  el checkpoint dejaría de decir hasta dónde se ha proyectado de verdad.
- **El checkpoint es monótono.** Retrocederlo haría que la siguiente corrida reprocesara eventos ya
  aplicados; aunque los upsert son idempotentes, el checkpoint dejaría de significar nada.
- **El scoping se aplica dentro del recorrido, no después.** Un nodo fuera de alcance no se visita,
  así que tampoco se recorren sus aristas ni se llega a lo que hay detrás. Filtrar al final daría el
  mismo listado pero habría revelado la topología por el camino.
- **El filtro pedido se intersecta con el del alcance**, no lo sustituye: pedir un tipo de relación
  que el alcance no permite no puede ampliarlo.
- **La caché se consulta después de validar el alcance.** Al revés, un actor sin permiso recibiría de
  la caché una ruta que no tiene derecho a ver.
- **Se cachea también la ausencia de camino**: recalcular una ausencia cuesta lo mismo que calcular
  una presencia, y es la consulta que más se repite.
- **El resultado de una versión de algoritmo se reemplaza entero.** Una detección parcial no es un
  resultado; mezclar dos ejecuciones daría comunidades que nunca coexistieron. Las versiones
  anteriores conviven, que es lo que permite comparar.
- **Cada puntaje de riesgo caduca.** Uno sin caducidad se queda pareciendo actual para siempre, y un
  panel que muestra un número de hace tres meses como si fuera de hoy es peor que no mostrar nada.
- **Sólo se alerta por encima del umbral.** Publicar todos los puntajes convertiría el canal de
  alertas en ruido y nadie miraría el que importa.
- **Los hallazgos se deduplican por `(regla, nodo principal)` mientras haya uno vivo.** Si no, una
  regla evaluada cada hora generaría veinticuatro alertas idénticas al día del mismo caso.
- **Un hallazgo cerrado no se reabre.** Si el patrón vuelve a darse, la regla genera uno nuevo, y así
  el histórico conserva cuántas veces ocurrió.
- **Expirar una arista no la borra.** La relación existió, y el histórico tiene que poder decirlo. Lo
  que cambia es que deja de recorrerse.
- **El borrado depura la pertenencia a comunidades.** Es lo que se olvida con más facilidad: un nodo
  borrado que sigue en `member_node_ids[]` deja su identificador vivo en un array, y el derecho al
  olvido no se cumple a medias.
- **La reconciliación caduca los puntajes de riesgo del nodo.** Un riesgo calculado sobre una versión
  anterior sigue siendo un número creíble; hay que forzar su recálculo en vez de dejarlo estar.

## Lo que este módulo no hace

**No calcula comunidades ni riesgo, y no evalúa expresiones de traversal.** Los recibe ya calculados
del worker de analítica. Lo que aporta es el versionado de los resultados, la deduplicación, la
caducidad y la purga completa.

## Permisos

`GRAPH_PROJECTION_WORKER` y `SYSTEM` proyectan, avanzan corridas, expiran aristas y reconcilian.
`DATA_GOVERNANCE_ADMIN` y `COMPLIANCE_OFFICER` definen alcances. `GRAPH_ANALYST` y `API_CONSUMER`
recorren y buscan rutas. `GRAPH_ANALYTICS_WORKER` registra comunidades, riesgo y hallazgos.
`COMPLIANCE_OFFICER` hace el triage. `DATA_GOVERNANCE_ADMIN` ordena el borrado. `PLATFORM_ADMIN`
cubre todo.

**Quien proyecta no consulta y quien consulta no proyecta.** El worker de proyección no aparece en
`/traverse`, y el analista no aparece en `/projections/*`: escribir el grafo y leerlo son
capacidades distintas, y quien puede escribirlo podría fabricar la relación que quiere encontrar.

Ninguna ruta es pública.

## Concurrencia

`FOR UPDATE` sobre el nodo y la arista por su clave de origen —dos eventos del mismo agregado
compiten—, sobre el alcance, la corrida, el hallazgo, el puntaje de riesgo y el job de borrado.

`FOR UPDATE SKIP LOCKED` en uno solo: `findRunningRunForUpdate`. Dos disparos concurrentes de la
misma definición no deben esperarse — el segundo tiene que ver que ya hay una corriendo y rendirse,
no bloquearse hasta que la primera termine.

## Logs

`operation: 'graph.<área>.<acción>'`. Nivel `warn` en hallazgo de regla, purga por derecho al olvido
y reconciliación de un borrado. No se loguean etiquetas de nodo, identificadores ni explicaciones de
riesgo.

## Pruebas

`yarn test --testPathPatterns=modules/graph_intelligence` — 87 pruebas (28 proyección + 19 recorrido
+ 25 analítica + 15 de delegación de los dos controladores).

## Divergencias con el caso de uso v3.9

- **Segmentos planos y sin prefijo `/internal`.** El caso de uso escribe
  `/internal/graph/projections/nodes/upsert`, `/internal/graph/edges/expire` y
  `/internal/graph/deletion-jobs/{id}/execute`. Se publican bajo `/graph/…` con rol de worker,
  siguiendo la convención del resto del proyecto: el worker es un cliente autenticado más.
- **UC-61-11 ejecuta la purga en la misma llamada.** El caso de uso separa `POST /graph/deletion-jobs`
  (solicitud) de `POST /internal/graph/deletion-jobs/{id}/execute` (ejecución). Aquí el job se crea y
  se ejecuta en una transacción, y devuelve el resultado verificado: partirlo en dos dejaría una
  ventana en la que el derecho al olvido está solicitado pero no cumplido, sin nada que garantice que
  la segunda llamada llegue.

## Pendiente

- **Cálculo real de comunidades y riesgo**, y evaluación de `traversal_expression`: el worker de
  analítica los aporta. Este módulo gobierna, versiona y registra.
- **Alta de `graph_projection_definitions` y `graph_rule_definitions`**: las dos tablas se leen pero
  ningún caso de uso del módulo 61 les da un endpoint de alta. No se ha inventado uno.
- **Comprobación de consentimiento contra `consent.consents` / `consent.privacy_restrictions`**
  (UC-61-05): el alcance exige `patientProfileId` cuando `requiresPatientContext`, pero no se
  contrasta contra el módulo 07, que es de la parte de Pablo.
- **`audit.audit_events`** en cambio de política de acceso, consulta al grafo y triage: el caso de uso
  lo pide. El registro de auditoría es del módulo 06.
- **`redis_runtime.*_cache_entries`** (UC-61-04, 12): la invalidación se publica por outbox
  (`GraphAccessScopeChanged`); quien la consume y vacía la caché de sesión es el worker. Ese esquema
  es del módulo 56, **sin asignar**.
- **Índice `MULTIVALUE` sobre `member_node_ids[]`**: la depuración de comunidades al borrar recorre
  las del tenant en memoria. Con volumen alto conviene el operador de arrays de Postgres, que exige
  el índice que el modelo declara pero el ORM no materializa.

