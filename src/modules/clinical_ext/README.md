# `clinical_ext` — coordinación y soporte clínico

El módulo implementa equipos de cuidado, reglas CDS, alertas, interacciones, plantillas de órdenes, referencias, brechas de cuidado, calendario de inmunización, encuentros virtuales y favoritos de prescripción. Tiene ocho controladores y **27 endpoints**. Este README describe el código de la rama actual.

## Rutas HTTP y alcance (medido)

<!-- Medido el 2026-10-08 sobre origin/dev (dae4fd68). Repetir con:
  find src/modules/clinical_ext -name '*.controller.ts' | wc -l
  find src/modules/clinical_ext -name '*.controller.ts' -exec grep -hE "^\s*@(Get|Post|Put|Patch|Delete)\(" {} + | wc -l
  find src/modules/clinical_ext -name '*.entity.ts' | wc -l
  find src/modules/clinical_ext -name '*.service.ts' | wc -l
La tabla sale de los decoradores `@Controller`/`@Get`/`@Post`/`@Put`/`@Patch`/`@Delete`, `@Roles` y `@Public`. -->

El módulo tiene **8 controllers, 27 rutas HTTP, 13 entidades y 8 servicios**. La columna *Acceso* sale del código: `pública` = `@Public()`; un rol = `@Roles(...)`; `sesión` = sin ninguno de los dos, o sea que sólo exige sesión autenticada (guards globales `JwtAuthGuard`, `TenantScopeGuard`, `RolesGuard`, `VerifiedIdentityGuard`). La autorización por recurso puede vivir además en el servicio y no se refleja acá.

Si una tabla narrativa más abajo difiere de ésta (prefijo del controller omitido, sufijos `:accion` de la spec en lugar de sub-rutas), manda ésta: sale del código.

Importa (`ClinicalModule`).

Entidades (`tableName`, 13 de 13 archivos `*.entity.ts`): `care_gaps`, `care_team_members`, `care_teams`, `cds_rules`, `clinical_alerts`, `drug_interactions`, `immunization_schedules`, `order_set_items`, `order_sets`, `prescription_favorites`, `reference_ranges`, `referrals`, `virtual_encounters`.

| Método y ruta | Acceso | Controller |
| --- | --- | --- |
| `POST /care-gaps/recompute` | CLINICIAN, PRACTITIONER | `care-gaps` |
| `PATCH /care-gaps/:id/close` | CLINICIAN, PRACTITIONER | `care-gaps` |
| `POST /patients/:id/immunization-plan/project` | CLINICIAN, PRACTITIONER | `care-gaps` |
| `POST /immunization-schedules` | SECURITY_ADMIN | `care-gaps` |
| `POST /care-teams` | CLINICIAN, PRACTITIONER | `care-teams` |
| `PATCH /care-teams/:id/members/:memberId/set-responsible` | CLINICIAN, PRACTITIONER | `care-teams` |
| `GET /care-teams` | CLINICIAN, PRACTITIONER | `care-teams` |
| `POST /cds-rules` | SECURITY_ADMIN | `cds` |
| `POST /cds-rules/:id/versions/publish` | SECURITY_ADMIN | `cds` |
| `POST /cds-rules/:id/versions/rollback` | SECURITY_ADMIN | `cds` |
| `POST /cds/evaluate` | CLINICIAN, PRACTITIONER | `cds` |
| `POST /cds/check-interactions` | CLINICIAN, PRACTITIONER | `cds` |
| `POST /drug-interactions` | SECURITY_ADMIN | `cds` |
| `PATCH /clinical-alerts/:id/acknowledge` | CLINICIAN, PRACTITIONER | `clinical-alerts` |
| `PATCH /clinical-alerts/:id/override` | CLINICIAN, PRACTITIONER | `clinical-alerts` |
| `POST /order-sets` | SECURITY_ADMIN | `order-sets` |
| `POST /order-sets/:id/apply` | CLINICIAN, PRACTITIONER | `order-sets` |
| `GET /prescription-favorites` | sesión | `prescription-favorites` |
| `POST /prescription-favorites` | sesión | `prescription-favorites` |
| `DELETE /prescription-favorites/:id` | sesión | `prescription-favorites` |
| `POST /referrals` | CLINICIAN, PRACTITIONER | `referrals` |
| `PATCH /referrals/:id/respond` | CLINICIAN, PRACTITIONER | `referrals` |
| `GET /referrals` | CLINICIAN, PRACTITIONER | `referrals` |
| `GET /referrals/me` | PATIENT | `referrals` |
| `POST /virtual-encounters` | CLINICIAN, PRACTITIONER | `virtual-encounters` |
| `PATCH /virtual-encounters/:id/join` | CLINICIAN, PRACTITIONER, PATIENT | `virtual-encounters` |
| `PATCH /virtual-encounters/:id/end` | CLINICIAN, PRACTITIONER | `virtual-encounters` |


## Endpoints (UC → ruta)

<!-- Medido el 2026-10-08 sobre origin/dev (dae4fd68). Repetir con:
  find src/modules/clinical_ext -name '*.controller.ts' | wc -l
  find src/modules/clinical_ext -name '*.controller.ts' -exec grep -hE "^\s*@(Get|Post|Put|Patch|Delete)\(" {} + | wc -l
  find src/modules/clinical_ext -name '*.entity.ts' | wc -l
  find src/modules/clinical_ext -name '*.service.ts' | wc -l
La tabla sale de los decoradores `@Controller`/`@Get`/`@Post`/`@Put`/`@Patch`/`@Delete`, `@Roles` y `@Public`. -->

El módulo tiene **8 controllers, 27 rutas HTTP, 13 entidades y 8 servicios**. La columna *Acceso* sale del código: `pública` = `@Public()`; un rol = `@Roles(...)`; `sesión` = sin ninguno de los dos, o sea que sólo exige sesión autenticada (guards globales `JwtAuthGuard`, `TenantScopeGuard`, `RolesGuard`, `VerifiedIdentityGuard`). La autorización por recurso puede vivir además en el servicio y no se refleja acá.

Si una tabla narrativa más abajo difiere de ésta (prefijo del controller omitido, sufijos `:accion` de la spec en lugar de sub-rutas), manda ésta: sale del código.

Importa (`ClinicalModule`).

Entidades (`tableName`, 13 de 13 archivos `*.entity.ts`): `care_gaps`, `care_team_members`, `care_teams`, `cds_rules`, `clinical_alerts`, `drug_interactions`, `immunization_schedules`, `order_set_items`, `order_sets`, `prescription_favorites`, `reference_ranges`, `referrals`, `virtual_encounters`.

| Método y ruta | Acceso | Controller |
| --- | --- | --- |
| `POST /care-gaps/recompute` | CLINICIAN, PRACTITIONER | `care-gaps` |
| `PATCH /care-gaps/:id/close` | CLINICIAN, PRACTITIONER | `care-gaps` |
| `POST /patients/:id/immunization-plan/project` | CLINICIAN, PRACTITIONER | `care-gaps` |
| `POST /immunization-schedules` | SECURITY_ADMIN | `care-gaps` |
| `POST /care-teams` | CLINICIAN, PRACTITIONER | `care-teams` |
| `PATCH /care-teams/:id/members/:memberId/set-responsible` | CLINICIAN, PRACTITIONER | `care-teams` |
| `GET /care-teams` | CLINICIAN, PRACTITIONER | `care-teams` |
| `POST /cds-rules` | SECURITY_ADMIN | `cds` |
| `POST /cds-rules/:id/versions/publish` | SECURITY_ADMIN | `cds` |
| `POST /cds-rules/:id/versions/rollback` | SECURITY_ADMIN | `cds` |
| `POST /cds/evaluate` | CLINICIAN, PRACTITIONER | `cds` |
| `POST /cds/check-interactions` | CLINICIAN, PRACTITIONER | `cds` |
| `POST /drug-interactions` | SECURITY_ADMIN | `cds` |
| `PATCH /clinical-alerts/:id/acknowledge` | CLINICIAN, PRACTITIONER | `clinical-alerts` |
| `PATCH /clinical-alerts/:id/override` | CLINICIAN, PRACTITIONER | `clinical-alerts` |
| `POST /order-sets` | SECURITY_ADMIN | `order-sets` |
| `POST /order-sets/:id/apply` | CLINICIAN, PRACTITIONER | `order-sets` |
| `GET /prescription-favorites` | sesión | `prescription-favorites` |
| `POST /prescription-favorites` | sesión | `prescription-favorites` |
| `DELETE /prescription-favorites/:id` | sesión | `prescription-favorites` |
| `POST /referrals` | CLINICIAN, PRACTITIONER | `referrals` |
| `PATCH /referrals/:id/respond` | CLINICIAN, PRACTITIONER | `referrals` |
| `GET /referrals` | CLINICIAN, PRACTITIONER | `referrals` |
| `GET /referrals/me` | PATIENT | `referrals` |
| `POST /virtual-encounters` | CLINICIAN, PRACTITIONER | `virtual-encounters` |
| `PATCH /virtual-encounters/:id/join` | CLINICIAN, PRACTITIONER, PATIENT | `virtual-encounters` |
| `PATCH /virtual-encounters/:id/end` | CLINICIAN, PRACTITIONER | `virtual-encounters` |

## Autenticación y autorización actuales

`JwtAuthGuard` y `TenantScopeGuard` se aplican globalmente; ninguna ruta de esta unidad tiene `@Public`. Los roles de la tabla son los declarados con `@Roles`. `ClinicalRecordAccessGuard` sólo aparece en las dos rutas CDS indicadas. Un rol clínico, por sí mismo, no verifica la relación del actor con cada paciente: los servicios de equipos, referencias, alertas, brechas y order sets lo comprueban dentro del servicio con `ClinicalReadService` (`assertCanReadHistory` / `assertCanWriteHistory`) después de cargar la fila. Un recurso de otro tenant o de un paciente que el actor no atiende responde igual que uno inexistente: 404, mismo mensaje y `reason`, sin `details`. El tenant sale de `requireTenantId()`; el del cuerpo sólo se contrasta (403 `CLINICAL_EXT_TENANT_SCOPE_REQUIRED`). `PATCH /referrals/:id/respond` sólo lo atiende el destinatario (`targetProfileId` o, sin profesional, `targetTenantId`). El servicio de encuentros virtuales comprueba participación en el encuentro, y favoritos deriva el perfil profesional de la cuenta mediante `ProfileOwnershipService`.

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
| `POST /order-sets/:id/apply` | `CLINICIAN`, `PRACTITIONER` | `ApplyOrderSetDto` | `ApplyOrderSetResponseDto` |
| `POST /referrals` | `CLINICIAN`, `PRACTITIONER` | `CreateReferralDto` | `ReferralResponseDto` |
| `PATCH /referrals/:id/respond` | `CLINICIAN`, `PRACTITIONER` | `RespondReferralDto` | `StatusResultDto` |
| `GET /referrals?patientProfileId=` | `CLINICIAN`, `PRACTITIONER` | query `patientProfileId` | `Referrals[]` |
| `GET /referrals/me` | `PATIENT` | — | `Referrals[]` |
| `POST /care-gaps/recompute` | `CLINICIAN`, `PRACTITIONER` | `RecomputeCareGapsDto` | `RecomputeCareGapsResponseDto` |
| `PATCH /care-gaps/:id/close` | `CLINICIAN`, `PRACTITIONER` | `CloseCareGapDto` | `StatusResultDto` |
| `POST /patients/:id/immunization-plan/project` | `CLINICIAN`, `PRACTITIONER` | `ProjectImmunizationPlanDto` | `ImmunizationPlanResponseDto` |
| `POST /immunization-schedules` | `SECURITY_ADMIN` | `CreateImmunizationScheduleDto` | `{ id }` |
| `POST /virtual-encounters` | `CLINICIAN`, `PRACTITIONER` | `CreateVirtualEncounterDto` | `VirtualEncounterResponseDto` |
| `PATCH /virtual-encounters/:id/join` | `CLINICIAN`, `PRACTITIONER`, `PATIENT` | — | `VirtualEncounterResponseDto` |
| `PATCH /virtual-encounters/:id/end` | `CLINICIAN`, `PRACTITIONER` | `EndVirtualEncounterDto` | `VirtualEncounterResponseDto` |
| `GET /prescription-favorites` | perfil profesional propio en servicio | — | `PrescriptionFavoriteResponseDto[]` |
| `POST /prescription-favorites` | perfil profesional propio en servicio | `CreatePrescriptionFavoriteDto` | `PrescriptionFavoriteResponseDto` |
| `DELETE /prescription-favorites/:id` | perfil profesional propio en servicio | — | sin cuerpo |

## Persistencia y límites de transacción

El schema `clinical_ext` contiene 13 tablas: `care_teams`, `care_team_members`, `cds_rules`, `clinical_alerts`, `drug_interactions`, `order_sets`, `order_set_items`, `referrals`, `care_gaps`, `immunization_schedules`, `virtual_encounters`, `reference_ranges` y `prescription_favorites`. El DDL versionado está en `database/SQL/18_clinical_ext`; las entidades están en `entities/`. Los servicios escriben mediante `EntityManager.transactional` y entregan el manager a repositorios sin estado. Las FK se representan como UUID planos. No se encontró publicación de evento/outbox dentro de los ocho servicios de esta unidad.

Las dependencias externas incluyen perfiles de paciente y profesional, `clinical.encounters`, `clinical.service_requests`, terminología y `ProfileOwnershipService`. La aplicación de order sets crea solicitudes clínicas: exige escritura sobre el paciente, un encuentro de ese paciente y del tenant activo, y toma el tenant custodio del encuentro.

## Semántica implementada

- Equipo: la transferencia de responsable marca un miembro activo y desmarca el anterior.
- CDS: `publish` incrementa `version` y reemplaza la lógica en la misma fila. El endpoint llamado `rollback` retira la regla activa; **no restaura** un snapshot previo. La evaluación usa reglas activas y puede generar alertas.
- Alerta: `active` pasa a `acknowledged` u `overridden`; el override de severidad alta exige motivo.
- Referencia: el servicio evita duplicados con una lectura previa; `respond` acepta o rechaza sólo desde `requested`. `GET /referrals/me` deriva el perfil de paciente de la cuenta.
- Referencia, duplicado: con encuentro de origen, una derivación es duplicada si coincide encuentro, destino (servicio; o profesional y especialidad; o, sin profesional ni servicio, la organización `targetTenantId`) y tipo; el mismo servicio con otro tipo **no** es duplicado (409 `REFERRAL_ALREADY_EXISTS` sólo con el mismo tipo; una fila sin tipo cuenta como `CONSULTATION`).
- Referencia, aviso a la paciente: con encuentro de origen, `POST /referrals` avisa por la campana (`ReferralNotifier`, categoría `NOTICE_REFERRAL_RECOMMENDED`, `payloadJson.kind = 'REFERRAL_RECOMMENDED'`). A un profesional: «… le recomienda consultar con …», `payloadJson.route = /directory/{targetProfileId}`, destino `PRACTITIONER_PROFILE`. A una organización (tenant destino sin profesional, indicado o tomado del servicio): asunto «Su médico le derivó a {organización}», cuerpo con el servicio si lo hay y **sin el motivo** (texto libre del médico; la paciente lo ve en «Mis derivaciones» por `referralId`); sin aviso si el tenant destino no existe o no está `TENANT_ACTIVE`; si la organización tiene ficha pública activa, `payloadJson.route = /o/{slug}` y destino `ORGANIZATION_PROFILE` con el id del tenant; si no la tiene, el aviso sale sin ruta ni destino. Sin encuentro, o sin profesional ni organización destino, no hay aviso. Un fallo del aviso se registra (sólo `referralId` y el tipo de error) y no deshace la derivación. El aviso lee con `em.fork()`, que en MikroORM 7 no hereda la transacción de la petición: con `RLS_ENFORCE=true` corre en otra conexión, sin `app.current_tenant_id` y sin ver la derivación todavía sin confirmar, así que no sale (ni el de profesional ni el de organización); `community.public_profiles` tiene `tenant_isolation` y, sin ese GUC o con el del tenant del médico, no devuelve la ficha de otra organización.
- Referencia, errores: las excepciones de este módulo llevan el sub-código en `reason` de primer nivel del cuerpo (`ClinicalExtErrorReason`). En `POST /referrals`: 404 `REFERRAL_TARGET_NOT_FOUND` (profesional destino inexistente), 404 `REFERRAL_SERVICE_NOT_FOUND`, 404 `REFERRAL_ENCOUNTER_NOT_FOUND` (inexistente, de otro paciente o de otra organización, sin distinguir), 404 `REFERRAL_TARGET_BRANCH_NOT_FOUND`, 409 `REFERRAL_ALREADY_EXISTS`, 422 `REFERRAL_TARGET_REQUIRED`, 422 `REFERRAL_SERVICE_INACTIVE` y 422 `REFERRAL_SERVICE_TARGET_MISMATCH`. Los tres 422 y `REFERRAL_TARGET_QUERY_TOO_SHORT` de `GET /referrals/targets` repiten además el código en `details.reason`, donde lo leían los clientes anteriores.
- Brecha: recomputo/proyección buscan una brecha abierta antes de insertar; cierre requiere estado abierto. La proyección calcula `dueDate` desde la fecha de nacimiento del perfil del paciente (fecha civil UTC); un `birthDate` del cuerpo sólo se contrasta y, si difiere, se rechaza con 422 `CARE_GAP_BIRTH_DATE_MISMATCH`. Las altas concurrentes de la misma brecha, referencia o sesión virtual se serializan con un cerrojo consultivo por clave lógica dentro de la transacción; el DDL no declara índices únicos para esas claves.
- Encuentro virtual: creación para un encuentro, unión de participantes y finalización; el servicio verifica relación del actor con el encuentro.
- Favorito: listado, creación y borrado vinculados al perfil profesional de la cuenta.

Las comprobaciones de duplicado mediante lectura previa carecen de índices únicos para brechas, referencias y encuentros virtuales en el DDL versionado.

## Pruebas y estado de revisión

Comando dirigido: `corepack yarn test src/modules/clinical_ext --runInBand --silent`. En la revisión del 2026-10-05 pasaron **15 suites y 88 tests**. Son pruebas unitarias con mocks; no verifican por sí solas RLS, permisos entre pacientes, esquema desplegado ni carreras en PostgreSQL. También existe `test/smoke/modules/clinical_ext.smoke.ts`, no ejecutado en esa revisión. Los sub-códigos estables del módulo están en `clinical_ext.error-reasons.ts`.
