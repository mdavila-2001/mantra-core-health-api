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

El módulo tiene **3 controllers, 37 rutas HTTP, 8 entidades y 6 servicios**. La columna _Acceso_ sale del código: `pública` = `@Public()`; un rol = `@Roles(...)`; `sesión` = sin ninguno de los dos, o sea que sólo exige sesión autenticada (guards globales `JwtAuthGuard`, `TenantScopeGuard`, `RolesGuard`, `VerifiedIdentityGuard`). La autorización por recurso puede vivir además en el servicio y no se refleja acá.

Si una tabla narrativa más abajo difiere de ésta (prefijo del controller omitido, sufijos `:accion` de la spec en lugar de sub-rutas), manda ésta: sale del código.

Su `*.module.ts` importa sólo `RouteIndexModule` (para leer los roles de cada ruta en la deriva de permisos).

Entidades (`tableName`, 13 de 13 archivos `*.entity.ts`): `catalog_annotation_revisions`, `catalog_annotations`, `catalog_change_events`, `catalog_columns`, `catalog_evidence_items`, `catalog_objects`, `catalog_operation_impacts`, `catalog_operations`, `catalog_process_step_operations`, `catalog_process_steps`, `catalog_processes`, `catalog_review_decisions`, `catalog_scan_runs`.

Roles (`data_catalog.constants.ts`): `PORTAL_READ_ROLES` = `SECURITY_ADMIN`, `PLATFORM_ADMIN`, `GOVERNANCE_ADMIN`, `DATA_PLATFORM_ADMIN`, `DPO`, `AUDITOR`, `DATA_STEWARD`; `CATALOG_WRITE_ROLES` = `GOVERNANCE_ADMIN`, `DATA_PLATFORM_ADMIN`, `DATA_STEWARD`. Los cinco roles de `data_catalog.roles.ts` (todos de ámbito `GLOBAL`) los siembra la API; se asignan **sin tenant**.

| Método y ruta                                                                                              | Acceso                 | Controller              |
| ---------------------------------------------------------------------------------------------------------- | ---------------------- | ----------------------- |
| `POST /internal/catalog/scans/run-next`                                                                    | SYSTEM                 | `data-catalog-internal` |
| `POST /internal/catalog/inventory/import`                                                                  | SYSTEM                 | `data-catalog-internal` |
| `GET /admin/catalog/schemas`                                                                               | ...PORTAL_READ_ROLES   | `admin-catalog`         |
| `GET /admin/catalog/objects`                                                                               | ...PORTAL_READ_ROLES   | `admin-catalog`         |
| `GET /admin/catalog/objects/:id`                                                                           | ...PORTAL_READ_ROLES   | `admin-catalog`         |
| `GET /admin/catalog/objects/:id/columns`                                                                   | ...PORTAL_READ_ROLES   | `admin-catalog`         |
| `GET /admin/catalog/objects/:id/evidence`                                                                  | ...PORTAL_READ_ROLES   | `admin-catalog`         |
| `POST /admin/catalog/objects/:id/evidence`                                                                 | ...CATALOG_WRITE_ROLES | `admin-catalog`         |
| `GET /admin/catalog/columns/:id/evidence`                                                                  | ...PORTAL_READ_ROLES   | `admin-catalog`         |
| `POST /admin/catalog/columns/:id/evidence`                                                                 | ...CATALOG_WRITE_ROLES | `admin-catalog`         |
| `GET /admin/catalog/objects/:id/history`                                                                   | ...PORTAL_READ_ROLES   | `admin-catalog`         |
| `GET /admin/catalog/objects/:id/changes`                                                                   | ...PORTAL_READ_ROLES   | `admin-catalog`         |
| `GET /admin/catalog/objects/:id/impact`                                                                    | ...PORTAL_READ_ROLES   | `admin-catalog`         |
| `PUT /admin/catalog/objects/:id/annotation`                                                                | ...CATALOG_WRITE_ROLES | `admin-catalog`         |
| `PUT /admin/catalog/columns/:id/annotation`                                                                | ...CATALOG_WRITE_ROLES | `admin-catalog`         |
| `POST /admin/catalog/annotations/:id/review`                                                               | ...CATALOG_WRITE_ROLES | `admin-catalog`         |
| `POST /admin/catalog/classification/run`                                                                   | ...CATALOG_WRITE_ROLES | `admin-catalog`         |
| `GET /admin/catalog/permission-drift`                                                                      | ...PORTAL_READ_ROLES   | `admin-catalog`         |
| `GET /admin/catalog/coverage`                                                                              | ...PORTAL_READ_ROLES   | `admin-catalog`         |
| `GET /admin/catalog/scans`                                                                                 | ...PORTAL_READ_ROLES   | `admin-catalog`         |
| `GET /admin/catalog/scans/:id`                                                                             | ...PORTAL_READ_ROLES   | `admin-catalog`         |
| `POST /admin/catalog/scans`                                                                                | ...CATALOG_WRITE_ROLES | `admin-catalog`         |
| 16 rutas `GET /admin/portal/*` (versión, operaciones, flujos, catálogo estático, deriva, linaje, glosario) | ...PORTAL_READ_ROLES   | `admin-portal`          |

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

sonda (worker scan-tick, cada pocos segundos): POST /internal/catalog/scans/run-next
  ├─ cierra los escaneos abandonados (lease vencido) ── failAbandoned
  ├─ retoma el escaneo en cola, si lo hay
  └─ si no hay ninguno y pasaron PROBE_INTERVAL_MS desde que terminó el último → pide uno y lo ejecuta
       └─ al terminar bien: clasificación automática de las columnas nuevas o cambiadas

importación del inventario (worker scan-tick, tras un escaneo SUCCEEDED): POST /internal/catalog/inventory/import
  └─ pg_advisory_xact_lock: una importación a la vez
       └─ planImport: compara inventario/ con las cinco tablas -> altas / cambios / sin cambios / NOT_OBSERVED / reaparecidas
            └─ catalog_operations + catalog_operation_impacts + catalog_processes + catalog_process_steps + catalog_process_step_operations
               (todo en una transacción; lo que no cambió no se toca ni sube row_version)

columna: PUT columns/:id/annotation  /  POST columns/:id/evidence   (mismas reglas que la tabla)
clasificación automática ──> ficha de columna en AUTO_DETECTED (certeza) o NEEDS_REVIEW (duda)
  └─ una persona que guarda la ficha la saca de AUTO_DETECTED (queda DRAFT o NEEDS_REVIEW, origin MANUAL)
```

## Reglas de negocio

- **Un escaneo activo por fuente**: lo decide un índice único parcial, no un `if`. Dos pedidos
  simultáneos: uno se acepta (202) y el otro recibe 409. Un escaneo `RUNNING` cuyo lease venció
  se cierra como `FAILED` en el siguiente pedido.
- **La sonda no duplica**: `run-next` toma el escaneo con `claimScan` (atómico) y lo cierra con
  fencing: `finishScan`/`failScan` sólo actualizan si el escaneo sigue `RUNNING` **y** con el
  `lease_owner` de quien lo ejecuta. Con 0 filas la respuesta lleva `fenced: true`, lo aplicado se
  revierte y no se pisa lo que otro proceso cerró. Intervalo: `PROBE_INTERVAL_MS` (15 min, medido
  desde que terminó el último escaneo que llegó a ejecutarse). El disparo en proceso de
  `POST /admin/catalog/scans` se conserva: ambas vías compiten por `claimScan`.
- **El inventario se importa, no se reemplaza**: el detalle de cada operación (contrato, árboles,
  grafos, glosario) sigue saliendo de los archivos de `inventario/`, que viajan en la imagen; las
  cinco tablas `catalog_operation*` / `catalog_process*` guardan el índice consultable (qué
  operaciones existen, qué objetos tocan y con qué acceso, y los procesos que las agrupan) para
  cruzarlo con `catalog_objects`, las fichas y la sonda. `InventoryImportService` es **idempotente**:
  la huella (`technical_hash`) es de lo que se guarda, incluido el objeto resuelto de cada impacto,
  y una operación con la misma huella no se toca (ni `row_version` ni `updated_at`). Una operación
  que deja de aparecer queda `NOT_OBSERVED`, no se borra; si vuelve, vuelve a `OBSERVED`.
- **Orden: primero el escaneo.** Cada impacto apunta a un objeto de `catalog_objects`. Si la sonda
  aún no observó la tabla, el impacto se salta y se cuenta en `skippedUnresolved` (o en
  `skippedNotCataloged` si el inventario tampoco la tiene catalogada); como la huella incluye el
  objeto resuelto, la siguiente importación lo recupera sola. Sin `inventario/` en la instancia, la
  ruta responde 503.
- **Valores sin CHECK**: `risk_level` (`ALTO`/`MEDIO`/`BAJO`), `access_kind` (`LEE`/`ESCRIBE`/`BORRA`),
  `kind` de proceso (`MODULO`/`CRITICO`) y `observation_status` (`OBSERVED`/`NOT_OBSERVED`) no tienen
  CHECK en el modelo (decisión del parche v4.2.48): el importador escribe sólo esos valores y
  `import-plan.spec.ts` los fija contra los archivos del inventario.
- **Estados de revisión**: `AUTO_DETECTED` (lo detectó la clasificación automática y nadie lo curó),
  `DRAFT` (borrador **humano**), `NEEDS_REVIEW`, `APPROVED`, `REJECTED`. Sólo la clasificación
  automática crea `AUTO_DETECTED`, con `origin = AUTO_CLASSIFIER`. `AUTO_DETECTED` no se revisa:
  nadie la envió a revisión.
- **Clasificación automática** (`classification/`): una tabla de reglas por nombre y tipo de columna
  (los 18 identificadores de Safe Harbor → `PHI_IDENTIFIER`, datos clínicos → `PHI_SENSITIVE`,
  categorías del art. 11 de la LGPD → `PHI_SPECIAL`, contraseñas/tokens/secretos → `CREDENTIAL`).
  Ante duda, el nivel más alto y `NEEDS_REVIEW`; con certeza, `AUTO_DETECTED`. **Nunca baja un nivel
  y nunca pisa** una ficha `MANUAL` ni una que ya salió de `AUTO_DETECTED`. `confidence` y
  `classified_by` viajan en `catalog_annotation_revisions.content_json.classification`; la autora es
  la cuenta del worker. Se dispara al terminar cada escaneo y con `POST classification/run`.
- **Deriva de permisos** (`permission-drift/`): compara los `@Roles(...)` de las rutas (leídos al
  arrancar por `RouteMetadataService`) con los roles que siembran los `*.roles.ts` y con
  `authz.roles`. La lógica es pura (`computePermissionDrift`, `blockingDrift`) para que un script de
  CI la use con las mismas entradas.
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

## Dos entradas de menú, una fuente por pestaña

El front tiene hoy **dos entradas** («Catálogo de datos» y «Portal de inventario») porque la API tiene
**dos fuentes que no se fusionan** (decisión de la tanda F2: se documentan, no se unifican). Quien
consume sabe de dónde sale cada cifra y no debe sumar ni comparar una con otra:

| Entrada del front                             | Pestaña                             | Fuente (API)                                                                                           | Qué es                                                                                              |
| --------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| Catálogo de datos (`superadmin/data-catalog`) | Schemas, Cobertura, Objetos y ficha | `GET /admin/catalog/{schemas,coverage,objects,objects/:id…}`                                           | **Vivo**: lo que el último escaneo de `pg_catalog` observó + lo curado en `data_catalog.*`          |
| Portal de inventario (`superadmin/portal`)    | Operaciones, Flujos, Procesos       | `GET /admin/portal/{operaciones,flujos,…}`                                                             | **Estático**: JSON generado del código (`inventario/`), sin base de datos; 503 si falta             |
|                                               | Catálogo > Tablas                   | `GET /admin/portal/catalogo/tablas…`                                                                   | Estático (modelo `salud-db`), no lo observado                                                       |
|                                               | Catálogo > Dominios                 | `GET /admin/portal/glosario` + `linaje`                                                                | Estático (`glosario.json`); los dominios **declarados** viven en `GET /admin/governance/domains`    |
|                                               | Linaje                              | `GET /admin/portal/linaje…`                                                                            | Estático (endpoint → tabla); el impacto por FK observada es `GET /admin/catalog/objects/:id/impact` |
|                                               | Deriva (sistemas)                   | `GET /admin/portal/catalogo/deriva`                                                                    | Estático (modelo vs. ORM vs. base desplegada)                                                       |
|                                               | Revisión (sistemas)                 | `GET /admin/catalog/objects?reviewStatus=NEEDS_REVIEW` y `GET /admin/governance/review-queue`          | Vivo; la cola agrega objetos **y columnas**                                                         |
|                                               | Esquemas                            | `GET /admin/catalog/schemas` + `coverage`                                                              | Vivo                                                                                                |
| Gobierno y acceso                             | Datos personales                    | `GET /admin/catalog/pii/{summary,columns,reconciliation}`                                              | Vivo (clasificación) contra el registro **declarado** `system_ops.field_registry`                   |
|                                               | Auditoría                           | `GET /audit/log`, `/audit/data-access`, `/audit/data-access/summary`, `GET /privacy/dsar`              | Bitácora WORM (`audit.*`)                                                                           |
|                                               | Trabajos                            | `GET /admin/governance/jobs`                                                                           | Escaneos (`catalog_scan_runs`), clasificaciones (sello de auditoría) y retenciones                  |
|                                               | Políticas, cambios, registro        | `GET /admin/governance/{policies,change-log,entity-registry,domains,legal-holds,retention-executions}` | `system_ops.*` (declarado, no observado)                                                            |

Las lecturas de `admin/governance/*` viven aquí (`review-queue`, `jobs`) y en `system_ops` (el resto)
bajo el mismo prefijo; ambas usan `GOVERNANCE_VIEW_ROLES` (`common/auth/governance-read.roles.ts`) =
`PORTAL_READ_ROLES`.

## Roles de gobierno: dos nombres, alias SOLO de lectura

`GOVERNANCE_ADMIN` (sembrado aquí, `data_catalog.roles.ts`) y `DATA_GOVERNANCE_ADMIN` (sembrado por
`authz`, exigido por `cross_store_consistency` y `graph_intelligence`) son el mismo concepto con dos
nombres (decisión X-6), pero **el alias es explícito y sólo de lectura**: ambos nombres figuran en el
`@Roles` de cada `GET` de gobierno (`PORTAL_VIEW_ROLES`, `GOVERNANCE_VIEW_ROLES`,
`LEGAL_HOLD_VIEW_ROLES`, `AUDIT_SUMMARY_ROLES`). **No hay alias en `RolesGuard`**: en las rutas de
escritura cada nombre conserva sólo lo que ya autorizaba (un alias global ampliaba privilegios de
escritura en `cross_store_consistency`, `graph_intelligence`, el catálogo, `polyglot_storage` y
`workflow`). Ambas filas de `authz.roles` y los tokens vigentes no cambian.
Pruebas: `data_catalog.role-alias.spec.ts` (guard real sobre el `@Roles` real de cada handler de
escritura, en los dos sentidos) y `common/auth/role-aliases.spec.ts`.

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
