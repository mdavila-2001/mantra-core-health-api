<!--
  ESPEJO AUTOGENERADO — no editar este archivo directamente.
  Fuente real: src/modules/accounting/README.md
  Regenerar con: yarn docs:modules:sync (tools/docs/sync-module-docs.mjs)
  Este README es el contrato por dominio mantenido junto al código
  (ver ESTADO-Y-PENDIENTES.md, tabla "Mapa documental").
-->

# Módulo `accounting`

**Fuente:** [`src/modules/accounting/README.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/modules/accounting/README.md)
· 8 controllers · 9 services · 9 repositories · 42 entidades · 11 DTO

---

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
  `controllers/*.spec.ts` — 9 suites / 49 casos.
- Smoke (contrato transversal): `test/smoke/modules/accounting.smoke.ts`
  (`ACCOUNTING_SMOKE`), encadena cuentas → asiento → reversa/devengo/activo con
  `ctx.vars` y ejercita casos límite 401/400/404/409/422.

