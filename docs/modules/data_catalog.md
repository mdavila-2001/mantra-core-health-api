<!--
  ESPEJO AUTOGENERADO — no editar este archivo directamente.
  Fuente real: src/modules/data_catalog/README.md
  Regenerar con: yarn docs:modules:sync (tools/docs/sync-module-docs.mjs)
  Este README es el contrato por dominio mantenido junto al código
  (ver ESTADO-Y-PENDIENTES.md, tabla "Mapa documental").
-->

# Módulo `data_catalog`

**Fuente:** [`src/modules/data_catalog/README.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/modules/data_catalog/README.md)
· 2 controllers · 3 services · 2 repositories · 8 entidades · 1 DTO

---

# Módulo 67 — Catálogo de datos (portal administrativo)

Qué tablas y columnas existen, **por qué existen**, qué representa una fila, quién responde por
ellas, con qué evidencia y qué cambió. Separa los hechos técnicos observados en la base de la
semántica curada por personas, que un escaneo nunca pisa. Decisiones en
[ADR-0024](../../../docs/adr/ADR-0024-portal-admin-catalogo-de-datos.md).

## Endpoints

| Método y ruta | Rol | Descripción |
| --- | --- | --- |
| `GET /admin/catalog/schemas` | lectura | Resumen por schema: observados, no observados, con ficha, aprobados |
| `GET /admin/catalog/objects` | lectura | Inventario con cursor; filtros `schema`, `kind`, `observationStatus`, `reviewStatus` (`NONE` = sin ficha), `q`, `missing` |
| `GET /admin/catalog/objects/:id` | lectura | Ficha técnica + de negocio + cobertura + registro de gobierno (`system_ops.entity_registry`) |
| `GET /admin/catalog/objects/:id/columns` | lectura | Columnas (PK, FK compuesta, unicidad, nulabilidad) con sus fichas |
| `GET /admin/catalog/objects/:id/changes` | lectura | Historial técnico detectado por escaneos |
| `GET /admin/catalog/objects/:id/history` · `columns/:id/history` | lectura | Revisiones y decisiones de la ficha |
| `PUT /admin/catalog/objects/:id/annotation` · `columns/:id/annotation` | edición | Crear/editar ficha con `expectedVersion`; `submit: true` la envía a revisión |
| `POST /admin/catalog/annotations/:id/review` | revisión | Aprobar o rechazar la revisión vigente (`expectedRevisionNo`) |
| `GET/POST /admin/catalog/objects/:id/evidence` · `columns/:id/evidence` | lectura / edición | Evidencia verificable con procedencia |
| `GET /admin/catalog/coverage?schema=` | lectura | Cobertura explicada por dimensión |
| `POST /admin/catalog/scans` | escaneo | 202 tras aceptación durable; header `Idempotency-Key` opcional |
| `GET /admin/catalog/scans` · `scans/:id` · `scans/:id/changes` | lectura | Corridas, contadores, huella, limitaciones y diff |
| `POST /admin/catalog/scans/:id/cancel` | escaneo | En cola cancela ya; en marcha la confirma el runner |
| `POST /internal/catalog/scans/run-next` | `SYSTEM` | Lo llama el worker `data_catalog` |

Roles en `data-catalog.roles.ts`. Leer no implica editar, editar no implica revisar, y `DPO`
revisa pero no redacta.

## Entidades (schema `data_catalog`)

Técnicas: `catalog_scan_runs` (job + evidencia), `catalog_objects`, `catalog_columns`,
`catalog_change_events` (append-only). Semánticas: `catalog_annotations` (vigente),
`catalog_annotation_revisions` (inmutable), `catalog_review_decisions` (append-only),
`catalog_evidence_items`.

## Flujo

```
POST scans ──> QUEUED (durable) ──> worker: run-next ──> claim (SKIP LOCKED + lease)
                                                          │
                     introspección READ ONLY de pg_catalog ┘
                                                          │
                reconciliación ──> ADDED | CHANGED | NOT_OBSERVED | REAPPEARED
                                                          │
                                   SUCCEEDED + contadores + huella + limitaciones

PUT annotation (expectedVersion) ──> revisión N (DRAFT | NEEDS_REVIEW)
POST review (expectedRevisionNo)  ──> APPROVED (liga la aprobación a N) | REJECTED
PUT sobre algo aprobado            ──> revisión N+1 en NEEDS_REVIEW; lo aprobado queda en historial
```

## Reglas

- **Nada se borra.** Lo que un escaneo completo deja de ver pasa a `NOT_OBSERVED`; retirarlo es una
  decisión explícita. Un renombre se ve como baja + alta: reasignar historial lo decide una persona.
- **Dos escaneos idénticos no producen eventos** ni duplicados; las estadísticas (filas estimadas,
  bytes) se refrescan sin generar eventos porque no son estructura.
- **El alta o la reaparición de una tabla no emite un evento por columna**: el del objeto las implica.
- **Filas estimadas, no contadas**: `pg_class.reltuples`, con método y fecha. Nunca `count(*)`.
- **Un índice único parcial no hace única a la columna.**
- **Para enviar a revisión**, una ficha de tabla responde propósito, justificación de existencia y
  grano de fila, o declara cada faltante como pregunta abierta. El texto de relleno ("almacena los
  datos de…", la plantilla de la bóveda) se rechaza con 422: es un filtro grueso, complementario
  a la revisión humana.
- **Quien escribió una revisión no la aprueba**, sea cual sea su rol. Aprobar exige evidencia;
  rechazar exige comentario.
- **La cobertura** sin escaneo terminado es `UNKNOWN`; con denominador cero, `NOT_APPLICABLE`.
  Una aprobación vieja no cubre una revisión nueva.

## Operación

- Worker: `worker-data_catalog` (compose) / `yarn start:worker:data_catalog`. Sin él, las corridas
  quedan en `QUEUED`.
- Medido en local (Docker, 1 200 tablas × 17 columnas): primer escaneo 10,0 s, re-escaneo sin
  cambios 4,7 s. Lease: 5 min; tres reclamos sin terminar ⇒ `FAILED / MAX_ATTEMPTS_EXCEEDED`.
- Pruebas: dominio y autorización en `*.spec.ts`; PostgreSQL real en
  `test/integration/data-catalog.int-spec.ts` (opt-in `DATA_CATALOG_IT_DB_URL`).

