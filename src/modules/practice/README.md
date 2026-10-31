# Módulo Practice (14)

Care Organizations, Sites, Units, Spaces and Workforce. Modela la organización de
atención (`practice`), sus sedes (`practice_sites`), la estructura clínica
jerárquica (`clinical_units`, `care_spaces`), el catálogo de servicios
(`healthcare_services`), el personal (`practitioner_role_assignments`,
`practitioner_support_assignments`), acreditaciones (`practice_accreditations`),
ajustes (`practice_settings`) e inventario (`inventory_items`,
`inventory_movements`).

## Rutas HTTP y alcance (medido)

<!-- Medido el 2026-10-08 sobre origin/dev (dae4fd68). Repetir con:
  find src/modules/practice -name '*.controller.ts' | wc -l
  find src/modules/practice -name '*.controller.ts' -exec grep -hE "^\s*@(Get|Post|Put|Patch|Delete)\(" {} + | wc -l
  find src/modules/practice -name '*.entity.ts' | wc -l
  find src/modules/practice -name '*.service.ts' | wc -l
La tabla sale de los decoradores `@Controller`/`@Get`/`@Post`/`@Put`/`@Patch`/`@Delete`, `@Roles` y `@Public`. -->

El módulo tiene **6 controllers, 29 rutas HTTP, 11 entidad y 10 servicios**. La columna _Acceso_ sale del código: `pública` = `@Public()`; un rol = `@Roles(...)`; `sesión` = sin ninguno de los dos, o sea que sólo exige sesión autenticada (guards globales `JwtAuthGuard`, `TenantScopeGuard`, `RolesGuard`, `VerifiedIdentityGuard`). La autorización por recurso puede vivir además en el servicio y no se refleja acá.

Si una tabla narrativa más abajo difiere de ésta (prefijo del controller omitido, sufijos `:accion` de la spec en lugar de sub-rutas), manda ésta: sale del código.

Su `*.module.ts` no declara `imports` de otros módulos.

Entidades (`tableName`, 11 de 11 archivos `*.entity.ts`): `care_spaces`, `clinical_units`, `healthcare_services`, `inventory_items`, `inventory_movements`, `practice_accreditations`, `practice_settings`, `practice_sites`, `practices`, `practitioner_role_assignments`, `practitioner_support_assignments`.

| Método y ruta                             | Acceso          | Controller        |
| ----------------------------------------- | --------------- | ----------------- |
| `POST /accreditations/:id/verify`         | SECURITY_ADMIN  | `accreditations`  |
| `POST /inventory-items/:itemId/movements` | SECURITY_ADMIN  | `inventory-items` |
| `GET /practices` | sesión (el servicio exige un rol clínico o de programación, o ser OWNER/ADMIN de la organización) | `practices` |

| `GET /practices/:practiceId/organization` | SECURITY_ADMIN,
PERIOP_ADMIN,
SURGERY_SCHEDULER,
SCHEDULING_ADMIN,
PRACTITIONER,
CLINICIAN,
ACCOUNTING_APPROVER, | `practices` |
| `GET /practices/:practiceId/sites` | sesión (el servicio exige un rol de programación o ser OWNER/ADMIN de la organización) | `practices` |
| `GET /practices/:practiceId/role-assignments` | SECURITY_ADMIN | `practices` |
| `POST /practices` | SECURITY_ADMIN | `practices` |
| `POST /practices/:practiceId/sites` | SECURITY_ADMIN | `practices` |
| `DELETE /practices/:practiceId/sites/:siteId` | SECURITY_ADMIN | `practices` |
| `POST /practices/:practiceId/accreditations` | SECURITY_ADMIN | `practices` |
| `POST /practices/:practiceId/healthcare-services` | SECURITY_ADMIN | `practices` |
| `PUT /practices/:practiceId/settings/:settingKey` | SECURITY_ADMIN | `practices` |
| `POST /practices/:practiceId/role-assignments` | SECURITY_ADMIN | `practices` |
| `POST /practices/:practiceId/role-assignments/self-request` | PRACTITIONER | `practices` |
| `POST /practices/:practiceId/inventory-items` | SECURITY_ADMIN | `practices` |
| `GET /practitioners/me/role-assignments` | PRACTITIONER | `practitioner-sites` |
| `GET /practitioners/:profileId/sites` | SECURITY_ADMIN,
SCHEDULING_ADMIN,
SCHEDULING_AGENT,
PRACTITIONER,
CLINICIAN,
PATIENT, | `practitioner-sites` |
| `POST /practitioners/me/sites` | PRACTITIONER, CLINICIAN | `practitioner-sites` |
| `PATCH /practitioners/me/sites/:siteId` | PRACTITIONER, CLINICIAN | `practitioner-sites` |
| `PUT /practitioners/me/sites/:siteId/bank-qr` | PRACTITIONER, CLINICIAN | `practitioner-sites` |
| `DELETE /practitioners/me/sites/:siteId` | PRACTITIONER, CLINICIAN | `practitioner-sites` |
| `POST /role-assignments/:roleId/support-assignments` | SECURITY_ADMIN | `role-assignments` |
| `POST /role-assignments/:roleId/approve` | SECURITY_ADMIN | `role-assignments` |
| `POST /role-assignments/:roleId/reject` | SECURITY_ADMIN | `role-assignments` |
| `POST /role-assignments/:roleId/suspend` | SECURITY_ADMIN | `role-assignments` |
| `POST /role-assignments/:roleId/end` | SECURITY_ADMIN | `role-assignments` |
| `POST /sites/:siteId/clinical-units` | SECURITY_ADMIN | `sites` |
| `GET /sites/:siteId/care-spaces` | SECURITY_ADMIN,
SURGERY_SCHEDULER,
PERIOP_ADMIN,
SURGEON,
ANESTHESIOLOGIST,
PERIOP_NURSE,
SCHEDULING_ADMIN, | `sites` |
| `POST /sites/:siteId/care-spaces` | SECURITY_ADMIN | `sites` |

## Infraestructura hospitalaria (F1, 2026-10-30)

Contrato: `SALUD/Arquitectura/infraestructura-hospitalaria/CONTRATO-F0-F1.md` §3
(repo de documentación).

Todas exigen sesión y `X-Tenant-Id` (`requireTenantId()`); un recurso de otro
tenant responde **404**. Sin `@Roles`: la autorización vive en
`StructureAccessService`.

- **Lectura** = miembro activo del tenant o plataforma.
- **Estructura** = OWNER, ADMIN de toda la organización, admin de la sucursal
  de la sede (ADMIN con alcance BRANCH sobre `practice_sites.branch_id`) o
  plataforma (`SECURITY_ADMIN`/`SUPERADMIN`).
- **Organización** = OWNER, ADMIN de toda la organización o plataforma (el
  admin de sucursal sólo lee).
- **Plataforma** = `SECURITY_ADMIN`/`SUPERADMIN`.

| Método y ruta | Acceso | Controller | Errores de contrato (`reason`) |
| --- | --- | --- | --- |
| `GET /practice/infrastructure-catalog` | sesión | `infrastructure-catalog` | — |
| `GET /sites/:siteId/structure` | lectura | `site-infrastructure` | 404 |
| `POST /sites/:siteId/care-spaces` (extendido) | estructura | `sites` | 409 `SPACE_CODE_TAKEN`; 422 `SPACE_PARENT_RULE`, `FUNCTION_FORM_MISMATCH`, `TYPOLOGY_NOT_ALLOWED`, `SPACE_UNKNOWN_CODE`, `PARENT_NOT_ACTIVE`, `SITE_NOT_ACTIVE`; 404 `PARENT_NOT_FOUND`, `UNIT_NOT_FOUND` |
| `POST /sites/:siteId/care-spaces/bulk` | estructura | `site-infrastructure` | 422 `BULK_PATTERN_INVALID`, `BULK_LIMIT_EXCEEDED`, `IMPORT_INVALID_ROWS` |
| `POST /sites/:siteId/care-spaces/import?dryRun=` | estructura | `site-infrastructure` | 200 con `ok:false` y errores por línea |
| `GET /care-spaces/:id` | lectura | `care-spaces` | 404 |
| `PATCH /care-spaces/:id` (`If-Match`) | estructura | `care-spaces` | 428 `IF_MATCH_REQUIRED`; 412 `ROW_VERSION_MISMATCH`; 422 `SPACE_IMMUTABLE_FIELD`, `SPACE_RETIRED` |
| `POST /care-spaces/:id/move` (`If-Match`) | estructura | `care-spaces` | 428/412; 422 `SPACE_CYCLE`, `SPACE_PARENT_RULE` |
| `POST /care-spaces/:id/lifecycle` (`If-Match`) | estructura | `care-spaces` | 409 `SPACE_RETIRE_BLOCKED` (`details.blockers`), `SPACE_SUSPEND_BLOCKED`; 422 `LIFECYCLE_*`, `PARENT_NOT_ACTIVE` |
| `GET /care-spaces/:id/retire-check` | lectura | `care-spaces` | — |
| `GET /care-spaces/:id/history` (agregado, «Desvíos» WEB-F1) | lectura | `care-spaces` | 404 |
| `POST /care-spaces/:id/unit-assignments` | estructura | `care-spaces` | 409 `SPACE_OWNER_TAKEN`, `ASSIGNMENT_EXISTS` |
| `DELETE /care-spaces/:id/unit-assignments/:assignmentId` | estructura | `care-spaces` | 404 |
| `GET /sites/:siteId/clinical-units` | lectura | `site-infrastructure` | 404 |
| `GET /clinical-units/:id` | lectura | `clinical-units` | 404 |
| `PATCH /clinical-units/:id` (`If-Match`) | estructura | `clinical-units` | 428/412; 409 `UNIT_CODE_TAKEN`; 422 `UNIT_CYCLE`, `SPACE_IMMUTABLE_FIELD` |
| `POST /clinical-units/:id/lifecycle` (`If-Match`) | estructura | `clinical-units` | 409 `UNIT_RETIRE_BLOCKED`, `UNIT_SUSPEND_BLOCKED` |
| `GET /sites/:siteId/regulatory` | lectura | `site-infrastructure` | 404 |
| `PATCH /sites/:siteId/regulatory` (`If-Match` opcional) | organización | `site-infrastructure` | 409 `TYPOLOGY_CONFLICT`, `SNIS_CODE_UNAVAILABLE` |
| `POST /sites/:siteId/regulatory/verify-snis` | plataforma | `site-infrastructure` | 409 `SNIS_CODE_UNAVAILABLE`; 422 `SNIS_CODE_MISSING` |
| `GET /sites/:siteId/licenses` | lectura | `site-infrastructure` | 404 |
| `POST /sites/:siteId/licenses` | organización | `site-infrastructure` | 409 `LICENSE_NUMBER_TAKEN`; 422 `LICENSE_NOTES_UNSUPPORTED` |
| `PATCH /site-licenses/:id` (`If-Match` opcional) | organización (estado: plataforma) | `infrastructure-catalog` (`SiteLicensesController`) | 422 `LICENSE_STATUS_UNSUPPORTED` |
| `GET /sites/:siteId/capacity` | lectura | `site-infrastructure` | 404 |
| `POST /sites/:siteId/declared-capacities` | organización | `site-infrastructure` | 422 `SPACE_UNKNOWN_CODE` |

Reglas como datos (`domain/structure/`, puro): perfiles de función, reglas
padre→hijo (tabla `space_form_parent_rules`; la raíz es constante), reglas de
tipología (tabla `facility_typology_rules`, con la norma de origen en el
comentario), derivación de capacidad, máquina de ciclo de vida, patrones de
alta masiva y bloqueos de retiro. Los siembra `PracticeInfrastructureSeedService`
en `seed:boot` (paso núcleo), que además completa `form_concept_id` con
`LOC_FORM_ROOM` en los espacios anteriores.

Cada mutación: `@Audited`, revisión en `audit.{practice_sites,clinical_units,
care_spaces}_history` con `tenant_id` (las habilitaciones no tienen tabla de
historia en el modelo) y evento outbox `practice.*` (`asyncapi/asyncapi.yaml`,
`PracticeStructureEvent`). Los errores de FK compuesta de tenant (`23503`) se
traducen a 404 (`services/structure-write-errors.ts`).

Lectores de `practice_sites` fuera del módulo con RLS: inventario fijado en
`practice-sites-cross-tenant-readers.spec.ts`.

## Endpoints (UC → ruta)

| UC        | Método y ruta                                        | Descripción                                |
| --------- | ---------------------------------------------------- | ------------------------------------------ |
| bootstrap | `POST /practices`                                    | Dar de alta la práctica raíz               |
| UC-14-01  | `POST /practices/:practiceId/sites`                  | Alta de sitio (op. status PLANNED)         |
| UC-14-02  | `POST /practices/:practiceId/accreditations`         | Registrar acreditación (PENDING)           |
| UC-14-03  | `POST /accreditations/:id/verify`                    | Verificar (→VERIFIED) o caducar (→EXPIRED) |
| UC-14-04  | `POST /sites/:siteId/clinical-units`                 | Crear unidad clínica jerárquica            |
| UC-14-05  | `POST /sites/:siteId/care-spaces`                    | Crear espacio de atención (F1: PLANNED salvo `activate`; cuerpo de F0 sin forma/función: ACTIVO y AVAILABLE) |
| UC-14-06  | `POST /practices/:practiceId/healthcare-services`    | Publicar servicio de salud                 |
| UC-14-07  | `PUT /practices/:practiceId/settings/:settingKey`    | Configurar ajuste (upsert)                 |
| UC-14-08  | `POST /practices/:practiceId/role-assignments`       | Asignar rol de profesional                 |
| UC-14-09  | `POST /role-assignments/:roleId/support-assignments` | Adjuntar personal de apoyo                 |
| UC-14-10  | `POST /practices/:practiceId/inventory-items`        | Alta de insumo (stock 0)                   |
| UC-14-11  | `POST /inventory-items/:itemId/movements`            | Movimiento de stock (IN/OUT/ADJUST)        |
| UC-14-12  | `DELETE /practices/:practiceId/sites/:siteId`        | Desmantelar sitio en cascada               |

> `POST /practices` no es un UC numerado del PUML; la práctica es el agregado raíz
> que todos los demás casos presuponen (y su `practice_id` es una FK forzada), por
> lo que se expone un endpoint de bootstrap para poder crearla y encadenar recursos.

## Reglas de negocio

- **Transacciones**: cada escritura corre en `em.transactional`; el padre se hace
  `flush` antes de crear hijos (las FK son columnas uuid planas).
- **Estados server-side**: sitios/unidades/espacios/servicios/roles/acreditaciones/
  inventario nacen en su estado inicial fijado por el servidor (`PRAC.*`); el
  cliente nunca envía estados de ciclo de vida.
- **Coherencia jerárquica**: unidad padre y espacios/unidades referenciados deben
  pertenecer al mismo sitio; sitio y unidad de un servicio, a la misma práctica.
- **Unicidad**: código de sitio único por práctica; código de unidad/espacio único
  por sitio (validación en servicio → 409).
- **Inventario**: el movimiento ajusta `quantity_on_hand` en la misma transacción;
  las salidas exigen stock suficiente (invariante `>= 0` → 412). La tabla de
  movimientos es append-only (sin auditoría/versión).
- **Cascada (UC-14-12)**: sitio→RETIRED/CLOSED, unidades→RETIRED,
  espacios→RETIRED/CLOSED, servicios→SUSPENDED, roles→ENDED (`valid_to`=hoy).

## Permisos

Guard global de auth. Las rutas de estructura e infraestructura (F0/F1) no
llevan `@Roles`: autoriza el servicio (ver la sección de infraestructura). El
resto sigue con `@Roles('SECURITY_ADMIN')` según la tabla medida de arriba
(medición del 2026-10-08, anterior a F0/F1).

## Conceptos

`practice.concepts.ts` declara `PRACTICE_CONCEPT_SEEDS` (para el seed) y `PRAC`
(ids deterministas para los servicios). No se tocan archivos compartidos.

## Logs

Pino estructurado por operación (`practice.site.create`, `practice.inventory.movement.record`,
`practice.inventory.lowstock`, …). Nunca secretos ni PHI.

## Tests

- Unitarios: `services/*.service.spec.ts` (mockean repos/em) y
  `controllers/practice.controllers.spec.ts` (mockean servicios).
- Smoke (contrato transversal): `test/smoke/modules/practice.smoke.ts`
  (`PRACTICE_SMOKE`).

## Revisión ALOVIDA — 2026-10-05

Comando dirigido: `corepack yarn test src/modules/practice --runInBand --silent`.
En la revisión pasaron **11 suites y 106 pruebas**. Son pruebas unitarias con
mocks: no demuestran RLS ni aislamiento de escrituras por UUID entre dos
tenants.
