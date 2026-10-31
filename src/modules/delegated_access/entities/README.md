# src / modules / delegated access / entities

Entidades y relaciones que representan el modelo persistente.

## Contenido

### Archivos

| Archivo                                        | Responsabilidad                                             |
| ---------------------------------------------- | ----------------------------------------------------------- |
| `delegated_access_approval_requests.entity.ts` | Mapeo de una entidad persistente y sus relaciones.          |
| `delegated_access_grants.entity.ts`            | Mapeo de una entidad persistente y sus relaciones.          |
| `delegated_permission_set_items.entity.ts`     | Mapeo de una entidad persistente y sus relaciones.          |
| `delegated_permission_sets.entity.ts`          | Mapeo de una entidad persistente y sus relaciones.          |
| `delegation_events.entity.ts`                  | Mapeo de una entidad persistente y sus relaciones.          |
| `access_anomalies.entity.ts`                   | Anomalías de actividad (gobierno de accesos).               |
| `access_decision_log.entity.ts`                | Bitácora WORM de decisiones de acceso.                      |
| `access_review_campaigns.entity.ts`            | Campañas de certificación de accesos.                       |
| `access_review_items.entity.ts`                | Ítems de una campaña de certificación.                      |
| `four_eyes_requests.entity.ts`                 | Aprobaciones de cuatro ojos.                                |
| `governance_rules.entity.ts`                   | Reglas de gobierno de la organización (L1).                 |
| `grant_usage_stats.entity.ts`                  | Uso agregado por hora de un permiso.                        |
| `handover_items.entity.ts`                     | Traspaso de trabajo de quien se va.                         |
| `lifecycle_cases.entity.ts`                    | Casos de ciclo de vida (ingreso, cambio, baja, suspensión). |
| `patient_restriction_flags.entity.ts`          | Banderas de restricción de pacientes (VIP, confidencial).   |
| `sod_exceptions.entity.ts`                     | Excepciones con vencimiento a reglas SoD.                   |
| `sod_rules.entity.ts`                          | Reglas de segregación de funciones.                         |
| `index.ts`                                     | Punto de exportación pública de la carpeta.                 |
| `organization_user_assignments.entity.ts`      | Mapeo de una entidad persistente y sus relaciones.          |
| `practitioner_delegate_assignments.entity.ts`  | Mapeo de una entidad persistente y sus relaciones.          |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
