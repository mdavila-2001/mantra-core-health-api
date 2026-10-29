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

## Endpoints (UC → ruta)

| UC        | Método y ruta                                        | Descripción                                |
| --------- | ---------------------------------------------------- | ------------------------------------------ |
| bootstrap | `POST /practices`                                    | Dar de alta la práctica raíz               |
| UC-14-01  | `POST /practices/:practiceId/sites`                  | Alta de sitio (op. status PLANNED)         |
| UC-14-02  | `POST /practices/:practiceId/accreditations`         | Registrar acreditación (PENDING)           |
| UC-14-03  | `POST /accreditations/:id/verify`                    | Verificar (→VERIFIED) o caducar (→EXPIRED) |
| UC-14-04  | `POST /sites/:siteId/clinical-units`                 | Crear unidad clínica jerárquica            |
| UC-14-05  | `POST /sites/:siteId/care-spaces`                    | Crear espacio de atención (AVAILABLE)      |
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

## Operación de espacios (infraestructura hospitalaria F2)

El estado operativo de una cama, habitación o sala son **tres ejes manuales
ortogonales** en `care_spaces` (disponibilidad en `operational_status_concept_id`,
higiene y aislamiento) más la **ocupación, que se deriva** de
`clinical.encounter_locations` y nunca se escribe. El resumen HL7 v2-0116
(`domain/bed-status-v2.ts`, primera regla que aplica) y «asignable» son funciones puras.

| Método y ruta | Qué hace |
| --- | --- |
| `GET /sites/:siteId/bed-board` | Tablero por unidad con recuentos derivados, `generatedAt`, `lastEventAt` y `X-Data-As-Of` |
| `GET /care-spaces/:id/operational-state` · `status-events` · `blocks` | Ficha operativa, historial A20 paginado y bloqueos |
| `POST /care-spaces/:id/availability` (`If-Match-Ops`) | Bloquear, desbloquear, mantenimiento (con fecha estimada), cerrar, reabrir |
| `POST /care-space-blocks/:id/end` · `cancel` | Terminar o cancelar un bloqueo; el fin de un mantenimiento abre una limpieza |
| `POST /care-spaces/:id/hygiene` · `isolation` (`If-Match-Ops`) | Marcar sucia o contaminada; marcar o levantar el aislamiento |
| `GET/POST /sites/:siteId/cleaning-orders` · `POST /cleaning-orders/:id/{assign,start,finish,inspect,cancel}` (`If-Match`) | Cola y máquina de la orden de limpieza |
| `POST /internal/practice/blocks-tick` (SYSTEM) | Aplica los bloqueos programados y avisa de los vencidos |

- **Versiones**: `ops_version` (`If-Match-Ops`, 412 `OPS_VERSION_MISMATCH`) es independiente de
  `row_version`: los ejes se escriben con SQL directo y compare-and-set, sin mover `row_version`.
- **Quién puede qué**: `InfrastructureAccessService.assertCan` resuelve tenant → sucursal →
  unidad/espacio. Otro tenant o un espacio fuera del alcance es 404; con alcance pero sin el rol de
  la acción, 403 `INFRA_ACTION_NOT_ALLOWED` con `details.requiredRoles`. Cada franja declara sus
  acciones en `policies/infra-<franja>.policy.ts` y las registra en `INFRA_POLICIES`.
- **Texto clínico**: el organismo del aislamiento y el motivo «condición del paciente» solo viajan a
  Enfermería, Admisión y Control de infecciones sobre el espacio (`services/ops-privacy.ts`); el
  outbox nunca los lleva. El paciente (iniciales, sexo, edad) solo viaja a Enfermería y Admisión.
- **Limpieza terminal**: tras contaminación o aislamiento la orden es terminal y solo una inspección
  PASS de un supervisor sobre una orden terminal apaga `terminal_cleaning_required`.
- **Puerto**: `CARE_SPACE_OPS_PORT` (`services/care-space-ops.port.ts`) lo llaman ADT y quirófano
  dentro de su transacción: estado operativo, `markDirtyFromSource`, `recordOccupancyChange`,
  `assertBookable`.
- **Configuración** (`practice_settings`): `infra.inspection_required` (por omisión `true`),
  `infra.hvac_validation_max_days` (365), `infra.aiir_min_air_changes` y
  `infra.cleaning_due_minutes` (opcionales). La inspección rige **después de una orden de
  limpieza** (`HYG_CLEAN` no es asignable hasta inspeccionar); no rige el estado de partida: un
  espacio que nace activo (`activate:true`) o se activa por el ciclo de vida queda en
  `HYG_INSPECTED` (lista para usar) y es asignable al instante. Tras el egreso queda `HYG_DIRTY`.
- **Eventos**: `practice.care_space.status_changed` (A20), `block_started|ended|cancelled|overdue` y
  `practice.cleaning_order.*`; contrato en `asyncapi/fragments/f2.yaml`.

## Permisos

Guard global de auth; todos los endpoints exigen `@Roles('SECURITY_ADMIN')`.

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
