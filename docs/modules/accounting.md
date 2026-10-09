<!--
  ESPEJO AUTOGENERADO — no editar este archivo directamente.
  Fuente real: src/modules/accounting/README.md
  Regenerar con: yarn docs:modules:sync (tools/docs/sync-module-docs.mjs)
  Este README es el contrato por dominio mantenido junto al código
  (ver docs/progress/ESTADO-Y-PENDIENTES.md, tabla "Mapa documental").
-->

# Módulo `accounting`

**Fuente:** [`src/modules/accounting/README.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/accounting/README.md)
· 9 controllers · 10 services · 9 repositories · 42 entidades · 12 DTO

---

# Módulo 16 — Accounting (Libro Mayor y Subledgers)

Contabilidad general: asientos por partida doble, reversas, calendario fiscal,
devengos, subledgers AR/AP, activos fijos, pasivos y tipos de cambio. Sigue el
patrón de capas de `iam` (controllers finos → services con `em.transactional` →
repositorios stateless con `em` como primer parámetro).

## Rutas HTTP y alcance (medido)

<!-- Medido el 2026-10-08 sobre origin/dev (dae4fd68). Repetir con:
  find src/modules/accounting -name '*.controller.ts' | wc -l
  find src/modules/accounting -name '*.controller.ts' -exec grep -hE "^\s*@(Get|Post|Put|Patch|Delete)\(" {} + | wc -l
  find src/modules/accounting -name '*.entity.ts' | wc -l
  find src/modules/accounting -name '*.service.ts' | wc -l
La tabla sale de los decoradores `@Controller`/`@Get`/`@Post`/`@Put`/`@Patch`/`@Delete`, `@Roles` y `@Public`. -->

El módulo tiene **9 controllers, 45 rutas HTTP, 42 entidades y 10 servicios** (incluye los ya documentados más abajo). La columna *Acceso* sale del código: `pública` = `@Public()`; un rol = `@Roles(...)`; `sesión` = sin ninguno de los dos, o sea que sólo exige sesión autenticada (guards globales `JwtAuthGuard`, `TenantScopeGuard`, `RolesGuard`, `VerifiedIdentityGuard`). La autorización por recurso (propiedad, tenant, vínculo) puede vivir además en el servicio y no se refleja acá.

Si una tabla narrativa más abajo difiere de ésta (prefijo del controller omitido, sufijos `:accion` de la spec en lugar de sub-rutas), manda ésta: sale del código.

Importa (`accounting.module.ts`): `AuditModule`, `PracticeModule`, `BillingModule`, `MessagingModule`.

| Método y ruta | Acceso | Controller |
| --- | --- | --- |
| `POST /accounting/accrual-objects` | SECURITY_ADMIN | `accounting-accrual` |
| `POST /accounting/accruals/run` | SECURITY_ADMIN | `accounting-accrual` |
| `POST /accounting/assets/capitalize` | SECURITY_ADMIN | `accounting-asset` |
| `POST /accounting/depreciation/run` | SECURITY_ADMIN | `accounting-asset` |
| `GET /accounting/fiscal-years` | SECURITY_ADMIN, ACCOUNTING_APPROVER, PRACTITIONER | `accounting-cockpit` |
| `GET /accounting/open-items` | SECURITY_ADMIN, ACCOUNTING_APPROVER, PRACTITIONER | `accounting-cockpit` |
| `GET /accounting/dimensions` | SECURITY_ADMIN, ACCOUNTING_APPROVER, PRACTITIONER | `accounting-cockpit` |
| `GET /accounting/journal-transactions/:id/document-flow` | SECURITY_ADMIN, ACCOUNTING_APPROVER, PRACTITIONER | `accounting-cockpit` |
| `GET /accounting/assets` | SECURITY_ADMIN, ACCOUNTING_APPROVER, PRACTITIONER | `accounting-cockpit` |
| `GET /accounting/accrual-objects` | SECURITY_ADMIN, ACCOUNTING_APPROVER, PRACTITIONER | `accounting-cockpit` |
| `POST /accounting/exchange-rates` | SECURITY_ADMIN | `accounting-exchange-rate` |
| `POST /accounting/fiscal-years` | SECURITY_ADMIN | `accounting-fiscal` |
| `POST /accounting/fiscal-periods/:id/lock` | SECURITY_ADMIN | `accounting-fiscal` |
| `GET /accounting/accounts` | SECURITY_ADMIN, ACCOUNTING_APPROVER, PRACTITIONER | `accounting-ledger` |
| `GET /accounting/trial-balance` | SECURITY_ADMIN, ACCOUNTING_APPROVER, PRACTITIONER | `accounting-ledger` |
| `GET /accounting/journal-transactions` | SECURITY_ADMIN, ACCOUNTING_APPROVER, PRACTITIONER | `accounting-ledger` |
| `GET /accounting/general-ledger` | SECURITY_ADMIN, ACCOUNTING_APPROVER, PRACTITIONER | `accounting-ledger` |
| `GET /accounting/income-statement` | SECURITY_ADMIN, ACCOUNTING_APPROVER, PRACTITIONER | `accounting-ledger` |
| `GET /accounting/balance-sheet` | SECURITY_ADMIN, ACCOUNTING_APPROVER, PRACTITIONER | `accounting-ledger` |
| `GET /accounting/journal-transactions/:id` | SECURITY_ADMIN, ACCOUNTING_APPROVER, PRACTITIONER | `accounting-ledger` |
| `POST /accounting/accounts` | SECURITY_ADMIN | `accounting-ledger` |
| `POST /accounting/journal-transactions` | SECURITY_ADMIN | `accounting-ledger` |
| `POST /accounting/journal-transactions/drafts` | SECURITY_ADMIN, PRACTITIONER | `accounting-ledger` |
| `POST /accounting/journal-transactions/:id/classify` | SECURITY_ADMIN, PRACTITIONER | `accounting-ledger` |
| `POST /accounting/journal-transactions/:id/submit-review` | SECURITY_ADMIN, PRACTITIONER | `accounting-ledger` |
| `POST /accounting/journal-transactions/:id/approve` | SECURITY_ADMIN, ACCOUNTING_APPROVER | `accounting-ledger` |
| `POST /accounting/journal-transactions/:id/post` | SECURITY_ADMIN | `accounting-ledger` |
| `POST /accounting/postings/determine-accounts` | SECURITY_ADMIN | `accounting-ledger` |
| `POST /accounting/journal-transactions/:id/reverse` | SECURITY_ADMIN | `accounting-ledger` |
| `POST /accounting/journal-transactions/:id/files` | SECURITY_ADMIN, PRACTITIONER | `accounting-ledger` |
| `POST /accounting/liabilities/:id/payments` | SECURITY_ADMIN | `accounting-liability` |
| `GET /accounting/practitioner/paid-consultations` | PRACTITIONER | `accounting-practitioner` |
| `POST /accounting/practitioner/consultation-income` | PRACTITIONER | `accounting-practitioner` |
| `POST /accounting/practitioner/entries` | PRACTITIONER | `accounting-practitioner` |
| `GET /accounting/practitioner/assets` | PRACTITIONER | `accounting-practitioner` |
| `POST /accounting/practitioner/assets` | PRACTITIONER | `accounting-practitioner` |
| `PATCH /accounting/practitioner/assets/:id/automation` | PRACTITIONER | `accounting-practitioner` |
| `POST /accounting/practitioner/assets/:id/progress` | PRACTITIONER | `accounting-practitioner` |
| `GET /accounting/practitioner/liabilities` | PRACTITIONER | `accounting-practitioner` |
| `POST /accounting/practitioner/liabilities` | PRACTITIONER | `accounting-practitioner` |
| `GET /accounting/practitioner/liabilities/:id/schedule` | PRACTITIONER | `accounting-practitioner` |
| `PATCH /accounting/practitioner/liabilities/:id/automation` | PRACTITIONER | `accounting-practitioner` |
| `POST /accounting/practitioner/liabilities/:id/progress` | PRACTITIONER | `accounting-practitioner` |
| `POST /accounting/open-items` | SECURITY_ADMIN | `accounting-subledger` |
| `POST /accounting/clearing-documents` | SECURITY_ADMIN | `accounting-subledger` |

## Regla clave — partida doble balanceada

Un asiento **solo** se postea si `sum(DEBIT) == sum(CREDIT)`. La validación vive
en el servicio (`LedgerService.assertBalanced` / `PostingHelper.post`) y, si no
balancea, lanza `PreconditionFailedException` → **HTTP 422**, sin persistir nada
(todo dentro de una única `em.transactional`). Los importes se comparan en
centésimas enteras (`services/money.ts`) para evitar ruido de coma flotante. La
conversión de entrada sigue pasando por `Number`; los límites de precisión y de
alcance por práctica están documentados en la [revisión backend](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/docs/revision-backend-2026-10-04/modulos/accounting.md).

## Endpoints por caso de uso (UC-16-01..14, subconjunto)

Sólo los 14 casos de uso originales más el alta de cuenta. El módulo expone además el cockpit (6 lecturas, sección siguiente) y el auto-servicio contable del profesional (`/accounting/practitioner/*`, 12 rutas, rol `PRACTITIONER`, controller `accounting-practitioner`); la lista completa está en [Rutas HTTP](#rutas-http-y-alcance-medido).

| UC | Método y ruta | Descripción |
|----|---------------|-------------|
| 16-01 | `POST /accounting/journal-transactions` | Registrar y postear asiento balanceado (valida periodo ABIERTO) |
| 16-02 | `POST /accounting/postings/determine-accounts` | Determinar cuenta objetivo por reglas vigentes |
| 16-03 | `POST /accounting/journal-transactions/:id/reverse` | Reversar asiento posteado (líneas espejo) |
| 16-04 | `POST /accounting/fiscal-years` | Abrir ejercicio fiscal y sus periodos |
| 16-05 | `POST /accounting/fiscal-periods/:id/lock` | Cerrar/bloquear periodo fiscal |
| 16-06 | `POST /accounting/accrual-objects` | Crear objeto de devengo y cronograma (sum(planned)=total) |
| 16-07 | `POST /accounting/accruals/run` | Postear devengo periódico (idempotente por línea) |
| 16-08 | `POST /accounting/open-items` | Generar partida abierta en subledger |
| 16-09 | `POST /accounting/clearing-documents` | Compensar/clearing de partidas abiertas |
| 16-10 | `POST /accounting/assets/capitalize` | Capitalizar activo (alta + asiento de adquisición) |
| 16-11 | `POST /accounting/depreciation/run` | Ejecutar depreciación (batch, idempotente por activo/periodo) |
| 16-12 | `POST /accounting/liabilities/:id/payments` | Liquidar cuota de pasivo (principal + interés) |
| 16-13 | `POST /accounting/journal-transactions/:id/files` | Adjuntar documento soporte al asiento |
| 16-14 | `POST /accounting/exchange-rates` | Registrar (upsert) tipo de cambio |
| — | `POST /accounting/accounts` | Soporte: alta de cuenta del plan contable |

> Nota: la spec usa rutas de acción con dos puntos (`journal-transactions:post`).
> Como el proyecto corre sobre Express 5 (path-to-regexp 8, donde `:` es un
> parámetro), se adoptan sub-rutas por slash, la convención ya usada en el repo
> (`terminology/versions/:id/publish`, etc.).

## Lecturas del cockpit (subtarea 6.3)

Seis `GET`, proyecciones de solo lectura sobre lo que el módulo ya escribe —
ninguna cambia el comportamiento de las lecturas del mayor ni agrega DDL.
Roles `SECURITY_ADMIN, ACCOUNTING_APPROVER, PRACTITIONER` (el mismo trío de las
lecturas del mayor), controlador `AccountingCockpitController`, servicio
`AccountingReadService`.

| Ruta | Descripción |
|------|-------------|
| `GET /accounting/fiscal-years?practiceId=` | El ejercicio fiscal vigente (el que cubre hoy, o el más reciente) con sus periodos. 404 si la práctica no tiene ejercicios |
| `GET /accounting/open-items?practiceId=&side=` | Cartera abierta (excluye partidas saldadas) con antigüedad en cinco tramos fijos, siempre presentes |
| `GET /accounting/dimensions?practiceId=` | Debe/haber/resultado por centro de coste, centro de beneficio y segmento, sólo asientos POSTEADOS |
| `GET /accounting/journal-transactions/:id/document-flow` | El asiento, su origen si es una reversa, y su reversión si la tiene |
| `GET /accounting/assets?practiceId=` | Registro de activos fijos con la cuota de la próxima corrida de depreciación |
| `GET /accounting/accrual-objects?practiceId=` | Registro de devengos con el avance de cada cronograma |

**Alcance por práctica (D-1).** `open_items`, `subledger_accounts`,
`accrual_objects`, `profit_centers` y `segments` son tablas por `tenant_id`, no
por práctica: el `tenant_id` sale de la práctica ya verificada y se acota, donde
el esquema da un puente, contra las cuentas de esa práctica
(`subledger_accounts.reconciliation_account_id` / `accrual_objects.expense_account_id`
y `accrual_account_id` → `accounts.practice_id`). Para centros de beneficio y
segmentos **no hay puente**: se listan los del tenant completo.

**`SEGMENT` da `0.00` en casi todos los casos.** El camino de escritura del
módulo (`PostingHelper.post`) no imputa `segment_id` en `journal_entry_assignments`
al postear: sólo lo llena la reversa, copiando la asignación del asiento
original. No es un defecto de esta lectura.

**Derivaciones que no tienen columna propia:** `fiscal_periods` no tiene `name`
ni `period_number` (se derivan del `code` y de la posición dentro del ejercicio);
`accrual_objects` no tiene `name` (se repite `object_number`); `assets` no tiene
una FK a `asset_classes` (la clase sale de `asset_type_concept_id`).
`closedAt` de un periodo se omite siempre: no existe la columna.

**Tope interno.** `openItems` corta en 5 000 partidas por respuesta
(`OPEN_ITEMS_MAX`); `dimensions` agrega hasta 10 000 asientos POSTEADOS
(`DIMENSIONS_MAX_TRANSACTIONS`). Ninguna de las seis pagina: los tipos del
front no declaran cursor.

## Entidades (esquema `accounting`)

`journal_transactions`, `ledger_entries`, `journal_entry_assignments` (GOD NODE de
dimensiones), `accounting_document_links`, `account_determination_rules`,
`accounts`, `fiscal_years`, `fiscal_periods`, `accrual_objects`,
`accrual_schedule_lines`, `accrual_postings`, `subledger_accounts`, `open_items`,
`clearing_documents`, `clearing_items`, `assets`, `asset_components`,
`asset_valuations`, `asset_assignments`, `asset_postings`, `asset_depreciations`,
`liabilities`, `liability_schedules`, `liability_payments`, `liability_postings`,
`transaction_files`, `exchange_rates`.

El módulo mapea **42 entidades** (`find src/modules/accounting -name '*.entity.ts' | wc -l`); las 15 no listadas arriba son `account_groups`, `asset_classes`, `company_bank_accounts`, `controlling_areas`, `cost_center_maps`, `cost_centers`, `depreciation_areas`, `employee_payments`, `functional_areas`, `infrastructure_items`, `internal_orders`, `profit_centers`, `purchases`, `sales` y `segments`. Que una entidad esté mapeada no implica que algún servicio la escriba: eso no se verificó.

Las FK son columnas uuid planas: los servicios hacen `flush` del padre antes de
crear los hijos y cada `em.create` usa `{ partial: true }`. `rowVersion` nunca se
fija (DEFAULT en BD). `createdAt/updatedAt/createdBy` se pueblan con
`createdBy(actor.id)` / `touch(entity, actor.id)`.

## Conceptos

`accounting.concepts.ts` exporta `ACCOUNTING_CONCEPT_SEEDS` (para el agregador que
cablea el orquestador) e `ids` bajo `ACCT` (tipos de transacción, direcciones
DEBIT/CREDIT, estados de periodo, roles de subledger, componentes de pasivo,
monedas, etc.). Para columnas `*_concept_id` cuyo valor ya existe en el catálogo
transversal se usa `CONCEPTS.STATE_ACTIVE` / `CONCEPTS.FILE_CATEGORY_DOCUMENT`.

## Permisos

Guard global de auth, sin `@Public()`. Los comandos administrativos exigen
`SECURITY_ADMIN`; el flujo de borrador, clasificación y adjuntos admite además
`PRACTITIONER`, y la aprobación admite `ACCOUNTING_APPROVER`. El servicio
comprueba la vinculación activa del profesional para esas rutas. Los comandos
administrativos todavía requieren la política de alcance por práctica y
recurso descrita en la revisión.

## Logs

`PinoLogger` estructurado por operación (`accounting.journal.post`,
`accounting.depreciation.run`, ...). Nunca se registran importes sensibles como
secretos ni PHI.

## Tests

- Unit (Jest, mockean repos/em/posting): `services/*.spec.ts`,
  `controllers/*.spec.ts` — 16 suites / 150 casos en la corrida dirigida del
  2026-10-05 (incluye `accounting-read.service.spec.ts` y
  `accounting-cockpit.controller.spec.ts`).
- Integration: `test/integration/fx14-cockpit-contable.int-spec.ts` siembra por
  la API (dos filas sin ruta de alta —`subledger_accounts` y `cost_centers`— nacen
  por `EntityManager`) y ejercita las seis lecturas contra la base real.
- Smoke (contrato transversal): `test/smoke/modules/accounting.smoke.ts`
  (`ACCOUNTING_SMOKE`), encadena cuentas → asiento → reversa/devengo/activo con
  `ctx.vars` y ejercita casos límite 401/400/404/409/422.

## Límites conocidos

La [revisión estricta](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/docs/revision-backend-2026-10-04/modulos/accounting.md)
registra pendiente la validación de práctica/tenant y de recursos relacionados
en writes, la clave de número de asiento, la aritmética decimal exacta y los
topes de lotes. Las pruebas unitarias no sustituyen integración con PostgreSQL,
dos tenants ni pruebas de concurrencia.
