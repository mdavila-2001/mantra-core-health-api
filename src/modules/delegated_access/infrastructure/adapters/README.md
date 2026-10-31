# Adaptadores — delegated_access

Los únicos archivos del módulo que conocen a otros contextos. Implementan los
puertos del PIP de `services/support-access-context.ports.ts` y se registran en
`delegated_access.module.ts`; el resto del módulo trabaja contra los puertos.

| Adaptador              | Puerto                        | De dónde lee                                                                                                                                                                                                                                                      |
| ---------------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PatientFactsAdapter`  | `SUPPORT_PATIENT_FACTS_PORT`  | `profiles` (edad), `insurance` (cobertura), `authz.care_relationships` y `profiles.patient_primary_practitioners` (equipo), `delegated_access.patient_restriction_flags` (banderas) y `scheduling` (citas). Dos consultas fijas para todos los pacientes pedidos. |
| `SessionInfoAdapter`   | `SUPPORT_SESSION_INFO_PORT`   | `iam.sessions` por `token_id`: inicio de la sesión y dispositivo.                                                                                                                                                                                                 |
| `NetworkPolicyAdapter` | `SUPPORT_NETWORK_POLICY_PORT` | `authz.ip_access_rules` con la función pura de `iam/domain/network-rules.ts`.                                                                                                                                                                                     |
| `DeviceAdapter`        | `SUPPORT_DEVICE_PORT`         | `iam.devices.trusted` de la persona.                                                                                                                                                                                                                              |
| `RedisPresenceAdapter` | `SUPPORT_PRESENCE_PORT`       | La clave `community:presence:<perfil>` (Redis); `community` importa a este módulo, así que no se usa su servicio.                                                                                                                                                 |
| `IamStepUpAdapter`     | `SUPPORT_STEP_UP_PORT`        | El sello del paso extra en Redis (`StepUpPort` de `iam`) sin importar `IamModule` (cerraría un ciclo de módulos). `StepUpUnavailableError` se traduce a «no se pudo comprobar» y la política niega con `STEP_UP_UNAVAILABLE`.                                     |
| `TenantZoneAdapter`    | `SUPPORT_TENANT_ZONE_PORT`    | `directory.tenants.time_zone`.                                                                                                                                                                                                                                    |

Todos fallan cerrado: ante un error devuelven «no se sabe» y la condición que lo
necesita queda indeterminada; nunca abren un permiso.
