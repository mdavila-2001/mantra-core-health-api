# Módulo 16 — Accounting (Libro Mayor y Subledgers)

Contabilidad general: asientos por partida doble, reversas, calendario fiscal,
devengos, subledgers AR/AP, activos fijos, pasivos y tipos de cambio. Sigue el
patrón de capas de `iam` (controllers finos → services con `em.transactional` →
repositorios stateless con `em` como primer parámetro).

## Regla clave — partida doble balanceada

Un asiento **solo** se postea si `sum(DEBIT) == sum(CREDIT)`. La validación vive
en el servicio (`LedgerService.assertBalanced` / `PostingHelper.post`) y, si no
balancea, lanza `PreconditionFailedException` → **HTTP 422**, sin persistir nada
(todo dentro de una única `em.transactional`). Los importes se comparan en
centésimas enteras (`services/money.ts`) para evitar ruido de coma flotante.

## Endpoints (UC-16-01..14)

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

Guard global de auth. Todos los endpoints de escritura requieren
`@Roles('SECURITY_ADMIN')`; `@Public()` no se usa (no hay flujo anónimo).

## Logs

`PinoLogger` estructurado por operación (`accounting.journal.post`,
`accounting.depreciation.run`, ...). Nunca se registran importes sensibles como
secretos ni PHI.

## Tests

- Unit (Jest, mockean repos/em/posting): `services/*.spec.ts`,
  `controllers/*.spec.ts` — 14 suites / 120 casos (incluye
  `accounting-read.service.spec.ts` y `accounting-cockpit.controller.spec.ts`).
- Integration: `test/integration/fx14-cockpit-contable.int-spec.ts` siembra por
  la API (dos filas sin ruta de alta —`subledger_accounts` y `cost_centers`— nacen
  por `EntityManager`) y ejercita las seis lecturas contra la base real.
- Smoke (contrato transversal): `test/smoke/modules/accounting.smoke.ts`
  (`ACCOUNTING_SMOKE`), encadena cuentas → asiento → reversa/devengo/activo con
  `ctx.vars` y ejercita casos límite 401/400/404/409/422.
