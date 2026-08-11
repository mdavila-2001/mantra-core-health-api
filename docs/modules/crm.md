<!--
  ESPEJO AUTOGENERADO — no editar este archivo directamente.
  Fuente real: src/modules/crm/README.md
  Regenerar con: yarn docs:modules:sync (tools/docs/sync-module-docs.mjs)
  Este README es el contrato por dominio mantenido junto al código
  (ver ESTADO-Y-PENDIENTES.md, tabla "Mapa documental").
-->

# Módulo `crm`

**Fuente:** [`src/modules/crm/README.md`](https://github.com/mdavila-2001/mantra-core-health-redesa-api/blob/master/src/modules/crm/README.md)
· 1 controllers · 2 services · 2 repositories · 32 entidades · 1 DTO

---

# Módulo 49 — CRM

Gestión comercial y de servicio: cuentas y equipo, contactos con consentimiento de canal, leads,
oportunidades sobre pipeline, actividades polimórficas, alianzas y casos de soporte.

## Casos de uso cubiertos (15)

| UC | Endpoint | Descripción |
| --- | --- | --- |
| UC-49-01 | `POST /crm/accounts` | Crear cuenta con contacto principal |
| UC-49-02 | `POST /crm/accounts/:id/team-members` | Asignar equipo de cuenta |
| UC-49-03 | `POST /crm/leads` · `PATCH /crm/leads/:id/qualify` | Capturar y calificar lead |
| UC-49-04 | `POST /crm/leads/:id/convert` | Convertir lead en oportunidad |
| UC-49-05 | `POST /crm/activities` | Actividad polimórfica |
| UC-49-06 | (mismo endpoint) | Subtipos: tarea y nota |
| UC-49-07 | `POST /crm/opportunities/:id/advance-stage` | Avanzar etapa del pipeline |
| UC-49-08 | `POST /crm/opportunities/:id/win` | Ganar oportunidad |
| UC-49-09 | `POST /crm/opportunities/:id/lose` | Perder con motivo |
| UC-49-10 | `POST /crm/partnerships` | Alianza + acuerdo marco |
| UC-49-11 | `POST /crm/cases` | Abrir caso de servicio |
| UC-49-12 | `POST /crm/cases/:id/comments` · `PATCH /crm/cases/:id/status` | Comentar y transicionar |
| UC-49-13 | `POST /crm/cases/:id/resolve` | Resolver caso |
| UC-49-14 | `GET /crm/accounts/:id/360` | Vista 360 de la cuenta |
| UC-49-15 | `PATCH /crm/contacts/:id/channels/:cid/opt-in` | Consentimiento de canal |

## Entidades

`crm_accounts`, `account_team_members`, `contacts`, `contact_channel_endpoints`, `leads`,
`opportunities`, `pipeline_stages`, `opportunity_stage_history`, `crm_activities`, `crm_tasks`,
`crm_notes`, `partnerships`, `partnership_agreements`, `crm_cases`, `crm_case_comments`,
`crm_case_status_history`.

## Flujo general

```
lead (new) ── qualify ──> qualified ── convert ──> oportunidad (open)
                       └─ disqualified            ├─ advance-stage (histórico por movimiento)
                                                  ├─ win  -> won  (wonAt)
                                                  └─ lose -> lost (motivo)

cuenta ── team-members ── actividades (task | note | event | email | call)
      └─ casos (open -> in_progress -> resolved/closed, con historial)
      └─ 360: actividades + casos recientes

contacto ── canales ── opt-in/opt-out -> do_not_contact
```

## Reglas de negocio

- **Alta atómica de cuenta**: cuenta, contacto principal (si viene) y propietario del equipo se
  crean en la misma transacción; quien la crea queda como `OWNER`.
- **Equipo sin duplicados**: un usuario no puede figurar dos veces en la misma cuenta.
- **Conversión solo de leads calificados**: un lead `new` o `disqualified` no se convierte, y uno
  ya convertido no se vuelve a convertir (devuelve conflicto con la oportunidad existente).
- **Histórico del pipeline**: cada movimiento de etapa registra importe y probabilidad del momento
  en `opportunity_stage_history`; con solo la etapa actual el histórico no se puede reconstruir.
- **Cierre único**: una oportunidad ganada o perdida no se vuelve a cerrar.
- **Actividad + subtipo**: `crm_activities` guarda lo común; `TASK` y `NOTE` añaden su fila propia.
  `EVENT`, `EMAIL` y `CALL` no tienen tabla de subtipo. Una nota exige cuerpo.
- **Número de caso único por tenant**; toda transición queda en `crm_case_status_history` y los
  estados de cierre fijan `closed_at`. **Un caso cerrado no se reabre por esta vía** — hacerlo
  borraría la fecha sobre la que se miden los SLA.
- **Consentimiento de canal**: revocar activa `do_not_contact`, la bandera que marketing debe
  respetar antes de enviar nada.

## Permisos

`CRM_ADMIN` en todo; `CRM_AGENT` además en cuentas, leads, oportunidades, actividades, casos y
consentimiento. Equipo de cuenta y alianzas quedan restringidos a `CRM_ADMIN`.

## Concurrencia

`FOR UPDATE` sobre lead, oportunidad, caso y endpoint de contacto antes de mutarlos. `row_version`
da bloqueo optimista automático. La vista 360 usa `em.fork()`: es de solo lectura y no abre
transacción de escritura.

## Logs

`operation: 'crm.<área>.<acción>'`. Se registran identificadores y estados; nunca datos de contacto
(email, teléfono) ni el cuerpo de notas o comentarios.

## Pruebas

`yarn test --testPathPatterns=crm` — 36 pruebas de servicio + delegación del controlador.

## Pendiente

La vista 360 (UC-49-14) se compone en caliente desde las tablas fuente. En producción la sirve un
read model materializado por el outbox; queda pendiente del módulo 35.

