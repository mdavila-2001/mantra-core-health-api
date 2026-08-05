# src / modules / crm / entities

Entidades y relaciones que representan el modelo persistente.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `account_contact_relations.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `account_team_members.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `contact_channel_endpoints.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `contact_channels.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `contacts.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `crm_accounts.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `crm_activities.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `crm_activity_assignments.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `crm_activity_relations.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `crm_activity_reminders.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `crm_call_logs.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `crm_case_comments.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `crm_case_contacts.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `crm_case_milestones.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `crm_case_status_history.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `crm_cases.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `crm_email_messages.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `crm_email_recipients.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `crm_entitlements.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `crm_events.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `crm_notes.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `crm_recurrence_rules.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `crm_tasks.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `index.ts` | Punto de exportación pública de la carpeta. |
| `leads.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `opportunities.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `opportunity_contact_roles.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `opportunity_line_items.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `opportunity_stage_history.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `partnership_agreements.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `partnerships.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `pipeline_stages.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `pipelines.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
