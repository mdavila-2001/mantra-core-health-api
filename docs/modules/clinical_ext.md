<!--
  ESPEJO AUTOGENERADO — no editar este archivo directamente.
  Fuente real: src/modules/clinical_ext/README.md
  Regenerar con: yarn docs:modules:sync (tools/docs/sync-module-docs.mjs)
  Este README es el contrato por dominio mantenido junto al código
  (ver ESTADO-Y-PENDIENTES.md, tabla "Mapa documental").
-->

# Módulo `clinical_ext`

**Fuente:** [`src/modules/clinical_ext/README.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/modules/clinical_ext/README.md)
· 8 controllers · 8 services · 12 repositories · 13 entidades · 9 DTO

---

# `clinical_ext` — coordinación y soporte clínico

El módulo implementa equipos de cuidado, reglas CDS, alertas, interacciones, plantillas de órdenes, referencias, brechas de cuidado, calendario de inmunización, encuentros virtuales y favoritos de prescripción. Tiene ocho controladores y **27 endpoints**. La [revisión del módulo](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/docs/revision-backend-2026-10-04/modulos/clinical_ext.md) documenta los hallazgos y las pruebas pendientes; este README describe el código de la rama actual.

## Autenticación y autorización actuales

`JwtAuthGuard` y `TenantScopeGuard` se aplican globalmente; ninguna ruta de esta unidad tiene `@Public`. Los roles de la tabla son los declarados con `@Roles`. `ClinicalRecordAccessGuard` sólo aparece en las dos rutas CDS indicadas. Un rol clínico, por sí mismo, no verifica la relación del actor con cada paciente. El servicio de encuentros virtuales sí comprueba participación en el encuentro, y favoritos deriva el perfil profesional de la cuenta mediante `ProfileOwnershipService`. Las brechas de autorización por recurso están detalladas en la revisión, en especial CE-01 y AUTHZ-T02.

La columna «entrada» nombra el DTO de cuerpo cuando lo hay; `:id` y otros parámetros de ruta usan `ParseUUIDPipe`. Las respuestas son los DTO o entidades retornados por el controlador. En rutas con varios roles, se admite cualquiera de los indicados.

| Método y ruta | Rol/guard local | Entrada | Respuesta |
|---|---|---|---|
| `POST /care-teams` | `CLINICIAN`, `PRACTITIONER` | `CreateCareTeamDto` | `CareTeamResponseDto` |
| `PATCH /care-teams/:id/members/:memberId/set-responsible` | `CLINICIAN`, `PRACTITIONER` | — | `StatusResultDto` |
| `GET /care-teams?patientProfileId=` | `CLINICIAN`, `PRACTITIONER` | query `patientProfileId` | `CareTeams[]` |
| `POST /cds-rules` | `SECURITY_ADMIN` | `CreateCdsRuleDto` | `CdsRuleResponseDto` |
| `POST /cds-rules/:id/versions/publish` | `SECURITY_ADMIN` | `PublishRuleVersionDto` | `CdsRuleResponseDto` |
| `POST /cds-rules/:id/versions/rollback` | `SECURITY_ADMIN` | — | `CdsRuleResponseDto` |
| `POST /cds/evaluate` | `CLINICIAN`, `PRACTITIONER` + `ClinicalRecordAccessGuard` | `EvaluateCdsDto` | `AlertBatchResponseDto` |
| `POST /cds/check-interactions` | `CLINICIAN`, `PRACTITIONER` + `ClinicalRecordAccessGuard` | `CheckInteractionsDto` | `AlertBatchResponseDto` |
| `POST /drug-interactions` | `SECURITY_ADMIN` | `CreateDrugInteractionDto` | `{ id }` |
| `PATCH /clinical-alerts/:id/acknowledge` | `CLINICIAN`, `PRACTITIONER` | — | `ClinicalAlertResponseDto` |
| `PATCH /clinical-alerts/:id/override` | `CLINICIAN`, `PRACTITIONER` | `OverrideAlertDto` | `ClinicalAlertResponseDto` |
| `POST /order-sets` | `SECURITY_ADMIN` | `CreateOrderSetDto` | `OrderSetResponseDto` |
| `POST /order-sets/:id/apply` | sólo guards globales | `ApplyOrderSetDto` | `ApplyOrderSetResponseDto` |
| `POST /referrals` | `CLINICIAN`, `PRACTITIONER` | `CreateReferralDto` | `ReferralResponseDto` |
| `PATCH /referrals/:id/respond` | `CLINICIAN`, `PRACTITIONER` | `RespondReferralDto` | `StatusResultDto` |
| `GET /referrals?patientProfileId=` | `CLINICIAN`, `PRACTITIONER` | query `patientProfileId` | `Referrals[]` |
| `GET /referrals/me` | `PATIENT` | — | `Referrals[]` |
| `POST /care-gaps/recompute` | sólo guards globales | `RecomputeCareGapsDto` | `RecomputeCareGapsResponseDto` |
| `PATCH /care-gaps/:id/close` | sólo guards globales | `CloseCareGapDto` | `StatusResultDto` |
| `POST /patients/:id/immunization-plan/project` | sólo guards globales | `ProjectImmunizationPlanDto` | `ImmunizationPlanResponseDto` |
| `POST /immunization-schedules` | `SECURITY_ADMIN` | `CreateImmunizationScheduleDto` | `{ id }` |
| `POST /virtual-encounters` | `CLINICIAN`, `PRACTITIONER` | `CreateVirtualEncounterDto` | `VirtualEncounterResponseDto` |
| `PATCH /virtual-encounters/:id/join` | `CLINICIAN`, `PRACTITIONER`, `PATIENT` | — | `VirtualEncounterResponseDto` |
| `PATCH /virtual-encounters/:id/end` | `CLINICIAN`, `PRACTITIONER` | `EndVirtualEncounterDto` | `VirtualEncounterResponseDto` |
| `GET /prescription-favorites` | perfil profesional propio en servicio | — | `PrescriptionFavoriteResponseDto[]` |
| `POST /prescription-favorites` | perfil profesional propio en servicio | `CreatePrescriptionFavoriteDto` | `PrescriptionFavoriteResponseDto` |
| `DELETE /prescription-favorites/:id` | perfil profesional propio en servicio | — | sin cuerpo |

## Persistencia y límites de transacción

El schema `clinical_ext` contiene 13 tablas: `care_teams`, `care_team_members`, `cds_rules`, `clinical_alerts`, `drug_interactions`, `order_sets`, `order_set_items`, `referrals`, `care_gaps`, `immunization_schedules`, `virtual_encounters`, `reference_ranges` y `prescription_favorites`. El DDL versionado está en `database/SQL/18_clinical_ext`; las entidades están en `entities/`. Los servicios escriben mediante `EntityManager.transactional` y entregan el manager a repositorios sin estado. Las FK se representan como UUID planos. No se encontró publicación de evento/outbox dentro de los ocho servicios de esta unidad.

Las dependencias externas incluyen perfiles de paciente y profesional, `clinical.encounters`, `clinical.service_requests`, terminología y `ProfileOwnershipService`. La aplicación de order sets crea solicitudes clínicas; la autorización y la consistencia entre paciente y encuentro son pendientes documentados como AUTHZ-T02 en el informe transversal.

## Semántica implementada

- Equipo: la transferencia de responsable marca un miembro activo y desmarca el anterior.
- CDS: `publish` incrementa `version` y reemplaza la lógica en la misma fila. El endpoint llamado `rollback` retira la regla activa; **no restaura** un snapshot previo. La evaluación usa reglas activas y puede generar alertas.
- Alerta: `active` pasa a `acknowledged` u `overridden`; el override de severidad alta exige motivo.
- Referencia: el servicio evita duplicados con una lectura previa; `respond` acepta o rechaza sólo desde `requested`. `GET /referrals/me` deriva el perfil de paciente de la cuenta.
- Brecha: recomputo/proyección buscan una brecha abierta antes de insertar; cierre requiere estado abierto. La proyección calcula `dueDate` desde `birthDate` enviado por el cliente.
- Encuentro virtual: creación para un encuentro, unión de participantes y finalización; el servicio verifica relación del actor con el encuentro.
- Favorito: listado, creación y borrado vinculados al perfil profesional de la cuenta.

Las comprobaciones de duplicado mediante lectura previa carecen de índices únicos para brechas, referencias y encuentros virtuales en el DDL versionado. Esta y las demás limitaciones, con evidencia y plan, constan en la [revisión](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/docs/revision-backend-2026-10-04/modulos/clinical_ext.md).

## Pruebas y estado de revisión

Comando dirigido: `corepack yarn test src/modules/clinical_ext --runInBand --silent`. En la revisión del 2026-10-05 pasaron **15 suites y 88 tests**. Son pruebas unitarias con mocks; no verifican por sí solas RLS, permisos entre pacientes, esquema desplegado ni carreras en PostgreSQL. También existe `test/smoke/modules/clinical_ext.smoke.ts`, no ejecutado en esa revisión. El módulo aún no tiene un catálogo propio de `details.reason` estables para sus errores de dominio.
