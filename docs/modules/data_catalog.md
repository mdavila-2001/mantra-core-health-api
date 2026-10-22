<!--
  ESPEJO AUTOGENERADO — no editar este archivo directamente.
  Fuente real: src/modules/data_catalog/README.md
  Regenerar con: yarn docs:modules:sync (tools/docs/sync-module-docs.mjs)
  Este README es el contrato por dominio mantenido junto al código
  (ver docs/progress/ESTADO-Y-PENDIENTES.md, tabla "Mapa documental").
-->

# Módulo `data_catalog`

**Fuente:** [`src/modules/data_catalog/README.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/data_catalog/README.md)
· 2 controllers · 4 services · 2 repositories · 8 entidades · 4 DTO

---

# Módulo 67 — Catálogo de datos y portal administrativo

Dos mitades que no se mezclan. `admin/portal/*` sirve el **inventario generado** del sistema
(operaciones, flujos, catálogo estático, linaje, glosario) sin tocar la base. `admin/catalog/*` es
el **catálogo vivo**: lo que un escaneo de `pg_catalog` observa de la base primaria y lo que el
equipo de datos curó encima (fichas, evidencia, revisiones), sobre el esquema `data_catalog`.

## Rutas HTTP y alcance (medido)

<!-- Medido el 2026-10-08 sobre origin/dev (dae4fd68). Repetir con:
  find src/modules/data_catalog -name '*.controller.ts' | wc -l
  find src/modules/data_catalog -name '*.controller.ts' -exec grep -hE "^\s*@(Get|Post|Put|Patch|Delete)\(" {} + | wc -l
  find src/modules/data_catalog -name '*.entity.ts' | wc -l
  find src/modules/data_catalog -name '*.service.ts' | wc -l
La tabla sale de los decoradores `@Controller`/`@Get`/`@Post`/`@Put`/`@Patch`/`@Delete`, `@Roles` y `@Public`. -->

El módulo tiene **2 controllers, 22 rutas HTTP, 8 entidades y 3 servicios**. La columna *Acceso* sale del código: `pública` = `@Public()`; un rol = `@Roles(...)`; `sesión` = sin ninguno de los dos, o sea que sólo exige sesión autenticada (guards globales `JwtAuthGuard`, `TenantScopeGuard`, `RolesGuard`, `VerifiedIdentityGuard`). La autorización por recurso puede vivir además en el servicio y no se refleja acá.

Si una tabla narrativa más abajo difiere de ésta (prefijo del controller omitido, sufijos `:accion` de la spec en lugar de sub-rutas), manda ésta: sale del código.

Su `*.module.ts` no declara `imports` de otros módulos.

Entidades (`tableName`, 8 de 8 archivos `*.entity.ts`): `catalog_annotation_revisions`, `catalog_annotations`, `catalog_change_events`, `catalog_columns`, `catalog_evidence_items`, `catalog_objects`, `catalog_review_decisions`, `catalog_scan_runs`.

| Método y ruta | Acceso | Controller |
| --- | --- | --- |
| `POST /internal/catalog/scans/run-next` | SYSTEM | `data-catalog-internal` |
| `GET /admin/catalog/schemas` | ...CATALOG_READ_ROLES | `data-catalog` |
| `GET /admin/catalog/objects` | ...CATALOG_READ_ROLES | `data-catalog` |
| `GET /admin/catalog/objects/:objectId` | ...CATALOG_READ_ROLES | `data-catalog` |
| `GET /admin/catalog/objects/:objectId/columns` | ...CATALOG_READ_ROLES | `data-catalog` |
| `GET /admin/catalog/objects/:objectId/changes` | ...CATALOG_READ_ROLES | `data-catalog` |
| `GET /admin/catalog/objects/:objectId/impact` | ...CATALOG_READ_ROLES | `data-catalog` |
| `GET /admin/catalog/objects/:objectId/history` | ...CATALOG_READ_ROLES | `data-catalog` |
| `GET /admin/catalog/columns/:columnId/history` | ...CATALOG_READ_ROLES | `data-catalog` |
| `PUT /admin/catalog/objects/:objectId/annotation` | ...CATALOG_EDIT_ROLES | `data-catalog` |
| `PUT /admin/catalog/columns/:columnId/annotation` | ...CATALOG_EDIT_ROLES | `data-catalog` |
| `POST /admin/catalog/annotations/:annotationId/review` | ...CATALOG_REVIEW_ROLES | `data-catalog` |
| `GET /admin/catalog/objects/:objectId/evidence` | ...CATALOG_READ_ROLES | `data-catalog` |
| `POST /admin/catalog/objects/:objectId/evidence` | ...CATALOG_EDIT_ROLES | `data-catalog` |
| `GET /admin/catalog/columns/:columnId/evidence` | ...CATALOG_READ_ROLES | `data-catalog` |
| `POST /admin/catalog/columns/:columnId/evidence` | ...CATALOG_EDIT_ROLES | `data-catalog` |
| `GET /admin/catalog/coverage` | ...CATALOG_READ_ROLES | `data-catalog` |
| `POST /admin/catalog/scans` | ...CATALOG_SCAN_ROLES | `data-catalog` |
| `GET /admin/catalog/scans` | ...CATALOG_READ_ROLES | `data-catalog` |
| `GET /admin/catalog/scans/:scanId` | ...CATALOG_READ_ROLES | `data-catalog` |
| `GET /admin/catalog/scans/:scanId/changes` | ...CATALOG_READ_ROLES | `data-catalog` |
| `POST /admin/catalog/scans/:scanId/cancel` | ...CATALOG_SCAN_ROLES | `data-catalog` |

## Endpoints

## Casos de uso cubiertos (31)

| UC       | Endpoint                                           | Descripción                                             |
| -------- | -------------------------------------------------- | ------------------------------------------------------- |
| UC-67-01 | `GET /admin/portal/version`                        | Versión y huella del inventario servido                 |
| UC-67-02 | `GET /admin/portal/operaciones`                    | Listar operaciones del sistema, con filtros             |
| UC-67-03 | `GET /admin/portal/operaciones/:id`                | Ficha de una operación: tablas, DTO, requisitos, flujo  |
| UC-67-04 | `GET /admin/portal/operaciones/:id/arbol`          | Árbol de decisión de una operación                      |
| UC-67-05 | `GET /admin/portal/flujos`                         | Listar procesos                                         |
| UC-67-06 | `GET /admin/portal/flujos/mapa`                    | Mapa de procesos y hallazgos del recorrido              |
| UC-67-07 | `GET /admin/portal/flujos/hallazgos`               | Listar hallazgos del inventario de flujos               |
| UC-67-08 | `GET /admin/portal/flujos/hallazgos/:id`           | Un hallazgo                                             |
| UC-67-09 | `GET /admin/portal/flujos/:codigo`                 | Detalle de un proceso                                   |
| UC-67-10 | `GET /admin/portal/flujos/:codigo/grafo`           | Grafo de un proceso                                     |
| UC-67-11 | `GET /admin/portal/catalogo/tablas`                | Tablas del catálogo estático (modelo), paginadas        |
| UC-67-12 | `GET /admin/portal/catalogo/tablas/:schema/:tabla` | Ficha de una tabla: columnas, relaciones, índices       |
| UC-67-13 | `GET /admin/portal/catalogo/deriva`                | Deriva entre modelo, ORM y base desplegada              |
| UC-67-14 | `GET /admin/portal/linaje`                         | Grafo de linaje endpoint → tabla                        |
| UC-67-15 | `GET /admin/portal/linaje/tablas/:schema/:tabla`   | Linaje de una tabla                                     |
| UC-67-16 | `GET /admin/portal/glosario`                       | Glosario de dominio                                     |
| UC-67-17 | `GET /admin/catalog/schemas`                       | Schemas observados, con fichas y aprobaciones           |
| UC-67-18 | `GET /admin/catalog/objects`                       | Objetos observados, con filtros y cursor                |
| UC-67-19 | `GET /admin/catalog/objects/:id`                   | Ficha técnica, observación, ficha curada, cobertura     |
| UC-67-20 | `GET /admin/catalog/objects/:id/columns`           | Columnas observadas con su ficha                        |
| UC-67-21 | `GET /admin/catalog/objects/:id/evidence`          | Evidencia enlazada                                      |
| UC-67-22 | `POST /admin/catalog/objects/:id/evidence`         | Enlazar evidencia                                       |
| UC-67-23 | `GET /admin/catalog/objects/:id/history`           | Revisiones y decisiones de la ficha                     |
| UC-67-24 | `GET /admin/catalog/objects/:id/changes`           | Cambios que los escaneos detectaron                     |
| UC-67-25 | `GET /admin/catalog/objects/:id/impact`            | Análisis de impacto por claves foráneas observadas      |
| UC-67-26 | `PUT /admin/catalog/objects/:id/annotation`        | Crear o editar la ficha (con versión esperada)          |
| UC-67-27 | `POST /admin/catalog/annotations/:id/review`       | Aprobar o rechazar la revisión vigente                  |
| UC-67-28 | `GET /admin/catalog/coverage`                      | Cobertura del catálogo por dimensión                    |
| UC-67-29 | `GET /admin/catalog/scans`                         | Listar escaneos                                         |
| UC-67-30 | `GET /admin/catalog/scans/:id`                     | Un escaneo                                              |
| UC-67-31 | `POST /admin/catalog/scans`                        | Pedir un escaneo de la base primaria (202, idempotente) |

## Entidades

Generadas por `salud-db/gen_entities.py 67` del repo del modelo (el esquema fluye modelo → entidades,
nunca al revés): `catalog_scan_runs`, `catalog_objects`, `catalog_columns`, `catalog_change_events`,
`catalog_annotations`, `catalog_annotation_revisions`, `catalog_review_decisions`,
`catalog_evidence_items`. Las lecturas y escrituras del catálogo vivo van con SQL parametrizado por
`CatalogRepository`; las entidades quedan para el descubrimiento del ORM.

## Flujo general

```
POST /admin/catalog/scans (Idempotency-Key)
  └─ 202 QUEUED ── commit ──> escaneo fuera de la petición (lease de 300 s)
       └─ lee pg_catalog en una transacción de sólo lectura
            └─ planScan: compara con lo conocido -> altas / cambios / no observados / reaparecidos
                 └─ catalog_objects + catalog_columns + catalog_change_events (lo curado no se toca)

ficha de un objeto:   PUT annotation (expectedVersion) ──> revisión N inmutable
  └─ submit=true: exige propósito, razón de existir y grano de fila (o una pregunta abierta por campo)
       └─ NEEDS_REVIEW ──> POST review (otro usuario, con evidencia) ──> APPROVED | REJECTED
            └─ editar una ficha aprobada la devuelve a DRAFT: la aprobación deja de ser vigente
```

## Reglas de negocio

- **Un escaneo activo por fuente**: lo decide un índice único parcial, no un `if`. Dos pedidos
  simultáneos: uno se acepta (202) y el otro recibe 409. Un escaneo `RUNNING` cuyo lease venció
  se cierra como `FAILED` en el siguiente pedido.
- **Idempotencia**: la misma `Idempotency-Key` del mismo usuario devuelve el escaneo ya aceptado
  (`created: false`); no crea otro.
- **El escaneo no pisa lo curado**: sólo toca lo observado. Un objeto que desaparece pasa a
  `NOT_OBSERVED` (no se borra) y conserva su ficha; si reaparece, vuelve a `OBSERVED`.
- **Versión esperada**: editar exige `expectedVersion` (0 para crear). Si cambió, 409
  `CONCURRENCY_CONFLICT` con la versión vigente. La condición va en el `UPDATE`.
- **Enviar a revisión no admite relleno**: `purpose`, `existenceRationale` y `rowGrain` deben
  explicar (≥ 30 caracteres, y no repetir que la tabla «guarda datos») o declararse como pregunta
  abierta de ese campo; si no, 422 con las violaciones por campo.
- **Segregación**: quien escribió la revisión vigente no la decide (403 `SELF_REVIEW`). Un rechazo
  lleva motivo (≥ 10 caracteres) y una aprobación exige al menos una evidencia. Una revisión
  vieja es 409.
- **Cobertura calculada por el servidor**, sobre los objetos observados; sin objetos no hay
  porcentaje (`ratio: null`), nunca un 0 % ni un 100 % inventado. Una falta declarada como
  pregunta abierta cuenta como `DECLARED_DEBT`, distinta de `MISSING`.
- **Impacto**: sólo claves foráneas observadas; el tope es de 100 nodos y 5 de profundidad, y la
  respuesta dice si truncó y por qué. Declara su alcance: la ausencia de aristas no prueba
  ausencia de dependencias (código, vistas, jobs, reportes, integraciones).
- **Fechas** en ISO 8601 UTC; los cursores son opacos y conservan los microsegundos.

## Qué no cubre

- El inventario generado (`admin/portal/*`) se sirve tal como lo dejó `yarn inventario:*`; si el
  código cambió sin regenerarlo, `yarn inventario:verificar` lo detecta.
- Hay una sola fuente (`primary`, la base de la API). Otras bases requieren otro conector.
- `schemas.catalog.ts` no lista `data_catalog`, `medical_groups` ni `qa_execution`; regenerarlo
  (`yarn orm:catalog`) exige el vault externo y no se corrió en este trabajo.

## Pruebas

- Unitarias de reglas puras: `yarn test src/modules/data_catalog`.
- Contra PostgreSQL real (escaneo, concurrencia, segregación, autorización, contrato OpenAPI):
  `yarn test:integration test/integration/data-catalog-admin` con `DB_*` apuntando a una base con
  el esquema `data_catalog` aplicado.
