# Plan — Contabilidad simple del doctor (P49) en la API

- Fecha: 2026-10-24 · Repos afectados: `mantra-core-health-api` · Predecesor: ninguno
- Rama: `claude/brave-cray-3s5grq` (base `41fcf8f0`, PR #842).
- Fuente de la especificación: `PENDIENTES-BACKEND.md` §P49 en `origin/mockup` del front (leída por `gh api`; el `git show` sobre el repo del front estaba vedado para este agente) y el cliente `src/app/core/data-access/simple-accounting/` del front.
- Resultado observable: `GET /accounting/practitioner/simple/summary|accounts|records|transactions` y sus `POST/PUT/DELETE` existen, sólo `PRACTITIONER` vinculado a la práctica, con el contrato que consume `SimpleAccountingClient`.
- Kill-test: `grep -c "practitioner/simple" openapi/openapi.json` sigue en 0, o el controller no devuelve 422 con motivo en castellano.

## Alcance
- IN: `src/modules/accounting/{controllers,services,dto,entities}`, catálogo ORM (`src/orm/catalog`), DDL en `database/SQL/16_accounting` + parche, OpenAPI/inventario/docs generados, pruebas unitarias.
- OUT: el modelo (`mantra-core-health-model`), el front, el libro mayor (`/accounting/journal-transactions`): la contabilidad simple NO genera asientos (spec §3).
- Ambigüedades registradas:
  1. La spec lista `records` además de `summary/accounts/transactions` (el pedido nombraba tres). Supuesto: se implementa `records` porque `DELETE accounts` → 409 «si la usa algún registro» y el cliente lo consume. Confirmar con quien pidió.
  2. No existe tabla alguna para esto. Supuesto: tablas nuevas `accounting.practitioner_simple_{accounts,records,transactions}`, con la misma vía que `siat_simulated_*` y `billing_invoice_claim_links` (DDL en `database/` + parche + entidad). **Debe subirse al modelo** (`.puml`) para que `db:vendor:check` cierre. Confirmar con Justin/Marcelo.
  3. `expectedFromInsurers` y `collected` se acotan al profesional (encuentros con `primary_practitioner_id` = el actor) y a la práctica. La spec no lo dice explícitamente.
  4. `collected` se mide por `invoices.issue_date` dentro del período; `patientsSeen`/`consultations` por `appointments.start_at` con estado `APPT_FULFILLED`.

## H1 — API
**CA:** Dado un PRACTITIONER vinculado, cuando llama a los 4 recursos, entonces obtiene el contrato del cliente; sin vinculación, 422 (igual que sus hermanos: `PreconditionFailedException`); validación → 422 en castellano; conflictos → 409.
**DoD:** `yarn typecheck`, `yarn lint`, jest del módulo accounting, `src/architecture`. **Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD | Estado |
|---|---|---|---|---|
| H1.S1.M1 | DDL + parche + entidades + catálogo ORM | 3 tablas declaradas | specs de ORM/fidelidad verdes | HECHO |
| H1.S2.M1 | DTOs | contrato del cliente | typecheck | HECHO |
| H1.S2.M2 | Servicio `PractitionerSimpleAccountingService` | reglas de la spec | jest del servicio | HECHO |
| H1.S2.M3 | Controller + módulo | rutas con `@Roles('PRACTITIONER')` | jest del controller | HECHO |
| H1.S3.M1 | OpenAPI + docs/modules regenerados (inventario/ revertido: arrastraba deriva ajena) | `/simple/` en openapi.json | scripts del repo | HECHO |
| H1.S3.M2 | Gates | exit 0 | typecheck/lint/jest/architecture | HECHO |

## Riesgos y bloqueos previstos
| Riesgo | Impacto | Mitigación |
|---|---|---|
| Sin Postgres en el entorno | no hay integración real | pruebas con dobles; declarado en el reporte como no cubierto |
| DDL sólo en la API | `db:vendor:check` diverge del modelo | declarado; subir al modelo |
