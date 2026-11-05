<!--
  ESPEJO AUTOGENERADO — no editar este archivo directamente.
  Fuente real: src/modules/crm/README.md
  Regenerar con: yarn docs:modules:sync (tools/docs/sync-module-docs.mjs)
  Este README es el contrato por dominio mantenido junto al código
  (ver README.md de la raíz, tabla "Arquitectura y mapa").
-->

# Módulo `crm`

**Fuente:** [`src/modules/crm/README.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/crm/README.md)
· 1 controllers · 2 services · 2 repositories · 32 entidades · 1 DTO

---

# CRM

Gestiona cuentas, contactos, equipos, leads, oportunidades, actividades, alianzas, casos y preferencias de contacto mediante `CrmController` bajo `/crm`.

Los roles `CRM_ADMIN` y `CRM_AGENT` habilitan las operaciones según la ruta. El tenant sale de `requireTenantId()`: el `tenantId` del cuerpo sólo se contrasta (403 `CRM_TENANT_SCOPE_REQUIRED` si difiere). Toda mutación o lectura por UUID carga la fila por `(id, tenantId)` y un recurso de otro tenant responde igual que uno inexistente (404, mismo mensaje y `reason`, sin `details`). Las referencias comerciales (cuenta, contacto, pipeline, etapa, sujeto de la actividad) se resuelven dentro del tenant antes de persistir, y la etapa tiene que ser del pipeline de la oportunidad (422 `CRM_STAGE_PIPELINE_MISMATCH`). `parentAccountId` apunta a `accounting.accounts` en el DDL y no se resuelve contra `crm_accounts`.

## Rutas HTTP y alcance (medido)

<!-- Medido el 2026-10-08 sobre origin/dev (dae4fd68). Repetir con:
  find src/modules/crm -name '*.controller.ts' | wc -l
  find src/modules/crm -name '*.controller.ts' -exec grep -hE "^\s*@(Get|Post|Put|Patch|Delete)\(" {} + | wc -l
  find src/modules/crm -name '*.entity.ts' | wc -l
  find src/modules/crm -name '*.service.ts' | wc -l
La tabla sale de los decoradores `@Controller`/`@Get`/`@Post`/`@Put`/`@Patch`/`@Delete`, `@Roles` y `@Public`. -->

El módulo tiene **1 controller, 16 rutas HTTP, 32 entidades y 2 servicios**. La columna *Acceso* sale del código: `pública` = `@Public()`; un rol = `@Roles(...)`; `sesión` = sin ninguno de los dos, o sea que sólo exige sesión autenticada (guards globales `JwtAuthGuard`, `TenantScopeGuard`, `RolesGuard`, `VerifiedIdentityGuard`). La autorización por recurso puede vivir además en el servicio y no se refleja acá.

Si una tabla narrativa más abajo difiere de ésta (prefijo del controller omitido, sufijos `:accion` de la spec en lugar de sub-rutas), manda ésta: sale del código.

Su `*.module.ts` no declara `imports` de otros módulos.

Entidades (`tableName`, 32 de 32 archivos `*.entity.ts`): `account_contact_relations`, `account_team_members`, `contact_channel_endpoints`, `contact_channels`, `contacts`, `crm_accounts`, `crm_activities`, `crm_activity_assignments`, `crm_activity_relations`, `crm_activity_reminders`, `crm_call_logs`, `crm_case_comments`, `crm_case_contacts`, `crm_case_milestones`, `crm_case_status_history`, `crm_cases`, `crm_email_messages`, `crm_email_recipients`, `crm_entitlements`, `crm_events`, `crm_notes`, `crm_recurrence_rules`, `crm_tasks`, `leads`, `opportunities`, `opportunity_contact_roles`, `opportunity_line_items`, `opportunity_stage_history`, `partnership_agreements`, `partnerships`, `pipeline_stages`, `pipelines`.

| Método y ruta | Acceso | Controller |
| --- | --- | --- |
| `POST /crm/accounts` | CRM_ADMIN, CRM_AGENT | `crm` |
| `POST /crm/accounts/:id/team-members` | CRM_ADMIN | `crm` |
| `GET /crm/accounts/:id/360` | CRM_ADMIN, CRM_AGENT | `crm` |
| `POST /crm/leads` | CRM_ADMIN, CRM_AGENT | `crm` |
| `PATCH /crm/leads/:id/qualify` | CRM_ADMIN, CRM_AGENT | `crm` |
| `POST /crm/leads/:id/convert` | CRM_ADMIN, CRM_AGENT | `crm` |
| `POST /crm/activities` | CRM_ADMIN, CRM_AGENT | `crm` |
| `POST /crm/opportunities/:id/advance-stage` | CRM_ADMIN, CRM_AGENT | `crm` |
| `POST /crm/opportunities/:id/win` | CRM_ADMIN, CRM_AGENT | `crm` |
| `POST /crm/opportunities/:id/lose` | CRM_ADMIN, CRM_AGENT | `crm` |
| `POST /crm/partnerships` | CRM_ADMIN | `crm` |
| `POST /crm/cases` | CRM_ADMIN, CRM_AGENT | `crm` |
| `POST /crm/cases/:id/comments` | CRM_ADMIN, CRM_AGENT | `crm` |
| `PATCH /crm/cases/:id/status` | CRM_ADMIN, CRM_AGENT | `crm` |
| `POST /crm/cases/:id/resolve` | CRM_ADMIN, CRM_AGENT | `crm` |
| `PATCH /crm/contacts/:id/channels/:cid/opt-in` | CRM_ADMIN, CRM_AGENT | `crm` |

## Rutas HTTP y alcance (medido)

<!-- Medido el 2026-10-08 sobre origin/dev (dae4fd68). Repetir con:
  find src/modules/crm -name '*.controller.ts' | wc -l
  find src/modules/crm -name '*.controller.ts' -exec grep -hE "^\s*@(Get|Post|Put|Patch|Delete)\(" {} + | wc -l
  find src/modules/crm -name '*.entity.ts' | wc -l
  find src/modules/crm -name '*.service.ts' | wc -l
La tabla sale de los decoradores `@Controller`/`@Get`/`@Post`/`@Put`/`@Patch`/`@Delete`, `@Roles` y `@Public`. -->

El módulo tiene **1 controller, 16 rutas HTTP, 32 entidades y 2 servicios**. La columna *Acceso* sale del código: `pública` = `@Public()`; un rol = `@Roles(...)`; `sesión` = sin ninguno de los dos, o sea que sólo exige sesión autenticada (guards globales `JwtAuthGuard`, `TenantScopeGuard`, `RolesGuard`, `VerifiedIdentityGuard`). La autorización por recurso puede vivir además en el servicio y no se refleja acá.

Si una tabla narrativa más abajo difiere de ésta (prefijo del controller omitido, sufijos `:accion` de la spec en lugar de sub-rutas), manda ésta: sale del código.

Su `*.module.ts` no declara `imports` de otros módulos.

Entidades (`tableName`, 32 de 32 archivos `*.entity.ts`): `account_contact_relations`, `account_team_members`, `contact_channel_endpoints`, `contact_channels`, `contacts`, `crm_accounts`, `crm_activities`, `crm_activity_assignments`, `crm_activity_relations`, `crm_activity_reminders`, `crm_call_logs`, `crm_case_comments`, `crm_case_contacts`, `crm_case_milestones`, `crm_case_status_history`, `crm_cases`, `crm_email_messages`, `crm_email_recipients`, `crm_entitlements`, `crm_events`, `crm_notes`, `crm_recurrence_rules`, `crm_tasks`, `leads`, `opportunities`, `opportunity_contact_roles`, `opportunity_line_items`, `opportunity_stage_history`, `partnership_agreements`, `partnerships`, `pipeline_stages`, `pipelines`.

| Método y ruta | Acceso | Controller |
| --- | --- | --- |
| `POST /crm/accounts` | CRM_ADMIN, CRM_AGENT | `crm` |
| `POST /crm/accounts/:id/team-members` | CRM_ADMIN | `crm` |
| `GET /crm/accounts/:id/360` | CRM_ADMIN, CRM_AGENT | `crm` |
| `POST /crm/leads` | CRM_ADMIN, CRM_AGENT | `crm` |
| `PATCH /crm/leads/:id/qualify` | CRM_ADMIN, CRM_AGENT | `crm` |
| `POST /crm/leads/:id/convert` | CRM_ADMIN, CRM_AGENT | `crm` |
| `POST /crm/activities` | CRM_ADMIN, CRM_AGENT | `crm` |
| `POST /crm/opportunities/:id/advance-stage` | CRM_ADMIN, CRM_AGENT | `crm` |
| `POST /crm/opportunities/:id/win` | CRM_ADMIN, CRM_AGENT | `crm` |
| `POST /crm/opportunities/:id/lose` | CRM_ADMIN, CRM_AGENT | `crm` |
| `POST /crm/partnerships` | CRM_ADMIN | `crm` |
| `POST /crm/cases` | CRM_ADMIN, CRM_AGENT | `crm` |
| `POST /crm/cases/:id/comments` | CRM_ADMIN, CRM_AGENT | `crm` |
| `PATCH /crm/cases/:id/status` | CRM_ADMIN, CRM_AGENT | `crm` |
| `POST /crm/cases/:id/resolve` | CRM_ADMIN, CRM_AGENT | `crm` |
| `PATCH /crm/contacts/:id/channels/:cid/opt-in` | CRM_ADMIN, CRM_AGENT | `crm` |

## Pruebas

`node --experimental-vm-modules node_modules/jest-cli/bin/jest.js src/modules/crm` cubre dos tenants para cada cadena de UUID (lead, oportunidad, caso, cuenta, contacto, canal) y el cruce de pipeline/etapa.
