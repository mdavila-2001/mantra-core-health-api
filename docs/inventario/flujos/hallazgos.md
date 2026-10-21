<!-- AUTOGENERADO por tools/inventario/flujos.mjs. No editar manualmente. -->

# Hallazgos de flujos

Cada hallazgo sale de cruzar los datos del inventario. Ninguno corrige código: dicen qué hay y qué hacer.

| ID | Severidad | Hallazgo | Cuenta |
|---|---|---|---|
| [FLU-01](#flu-01) | ALTA | Operaciones sin proceso asignado | 0 |
| [FLU-02](#flu-02) | ALTA | Escritura autenticada sin @Roles en el controlador | 87 |
| [FLU-03](#flu-03) | ALTA | Ruta pública que escribe en la base | 15 |
| [FLU-04](#flu-04) | MEDIA | Operación de riesgo ALTO sin ninguna prueba de integración | 84 |
| [FLU-05](#flu-05) | MEDIA | Proceso con operaciones de riesgo ALTO y ninguna prueba de integración | 16 |
| [FLU-06](#flu-06) | ALTA | Operaciones que el frontend llama y la API no tiene | 45 |
| [FLU-07](#flu-07) | INFO | Operaciones de la API que ningún cliente del frontend llama | 891 |
| [FLU-08](#flu-08) | MEDIA | Operaciones que existen en el código y el contrato OpenAPI no publica | 64 |
| [FLU-09](#flu-09) | BAJA | Máquinas de estado sin ninguna operación que las ejerza | 0 |
| [FLU-10](#flu-10) | BAJA | Operaciones que pueden terminar en un 500 por una excepción sin tipar | 35 |

## FLU-01

**Operaciones sin proceso asignado** — severidad ALTA — 0 caso(s).

**Qué hacer:** Asignarlas a un caso de uso en el README del módulo. Con cero filas no hay nada que hacer.

_Ninguno._

## FLU-02

**Escritura autenticada sin @Roles en el controlador** — severidad ALTA — 87 caso(s).

**Qué hacer:** Confirmar que la regla de acceso vive en el servicio o declarar los roles en el controlador. Hoy la API no las distingue de una sesión cualquiera.

| Dónde | Módulo | Detalle | Fuente |
|---|---|---|---|
| GET /audio-assets/{assetId}/content | audio_assets | escribe y el controlador no declara roles | `src/modules/audio_assets/controllers/audio-assets.controller.ts:39` |
| POST /audio-assets/resolve | audio_assets | escribe y el controlador no declara roles | `src/modules/audio_assets/controllers/audio-assets.controller.ts:28` |
| PATCH /care-gaps/{id}/close | clinical_ext | escribe y el controlador no declara roles | `src/modules/clinical_ext/controllers/care-gaps.controller.ts:52` |
| POST /care-gaps/recompute | clinical_ext | escribe y el controlador no declara roles | `src/modules/clinical_ext/controllers/care-gaps.controller.ts:41` |
| POST /cds/check-interactions | clinical_ext | escribe y el controlador no declara roles | `src/modules/clinical_ext/controllers/cds.controller.ts:89` |
| POST /cds/evaluate | clinical_ext | escribe y el controlador no declara roles | `src/modules/clinical_ext/controllers/cds.controller.ts:78` |
| POST /order-sets/{id}/apply | clinical_ext | escribe y el controlador no declara roles | `src/modules/clinical_ext/controllers/order-sets.controller.ts:50` |
| POST /patients/{id}/immunization-plan/project | clinical_ext | escribe y el controlador no declara roles | `src/modules/clinical_ext/controllers/care-gaps.controller.ts:64` |
| POST /prescription-favorites | clinical_ext | escribe y el controlador no declara roles | `src/modules/clinical_ext/controllers/prescription-favorites.controller.ts:57` |
| DELETE /prescription-favorites/{id} | clinical_ext | escribe y el controlador no declara roles | `src/modules/clinical_ext/controllers/prescription-favorites.controller.ts:68` |
| POST /common/addresses | common | escribe y el controlador no declara roles | `src/modules/common/controllers/common-addresses.controller.ts:21` |
| POST /common/contact-points | common | escribe y el controlador no declara roles | `src/modules/common/controllers/common-contact-points.controller.ts:33` |
| POST /common/contact-points/{id}/verify | common | escribe y el controlador no declara roles | `src/modules/common/controllers/common-contact-points.controller.ts:44` |
| POST /common/files | common | escribe y el controlador no declara roles | `src/modules/common/controllers/common-files.controller.ts:136` |
| DELETE /common/files/{id} | common | escribe y el controlador no declara roles | `src/modules/common/controllers/common-files.controller.ts:186` |
| POST /common/files/{id}/links | common | escribe y el controlador no declara roles | `src/modules/common/controllers/common-files.controller.ts:174` |
| POST /common/files/{id}/versions | common | escribe y el controlador no declara roles | `src/modules/common/controllers/common-files.controller.ts:149` |
| POST /common/files/{id}/versions/{vid}/derivatives | common | escribe y el controlador no declara roles | `src/modules/common/controllers/common-files.controller.ts:161` |
| POST /common/files/upload | common | escribe y el controlador no declara roles | `src/modules/common/controllers/common-files.controller.ts:70` |
| POST /common/identifiers | common | escribe y el controlador no declara roles | `src/modules/common/controllers/common-identifiers.controller.ts:21` |
| DELETE /community/blocks | community | escribe y el controlador no declara roles | `src/modules/community/controllers/community-social.controller.ts:245` |
| POST /community/blocks | community | escribe y el controlador no declara roles | `src/modules/community/controllers/community-social.controller.ts:205` |
| DELETE /community/bookmarks | community | escribe y el controlador no declara roles | `src/modules/community/controllers/community-social.controller.ts:234` |
| POST /community/bookmarks | community | escribe y el controlador no declara roles | `src/modules/community/controllers/community-social.controller.ts:183` |
| POST /community/comments | community | escribe y el controlador no declara roles | `src/modules/community/controllers/community-social.controller.ts:159` |
| POST /community/conversations | community | escribe y el controlador no declara roles | `src/modules/community/controllers/community-messaging.controller.ts:53` |
| POST /community/conversations/{conversationId}/messages | community | escribe y el controlador no declara roles | `src/modules/community/controllers/community-messaging.controller.ts:64` |
| POST /community/conversations/{conversationId}/read | community | escribe y el controlador no declara roles | `src/modules/community/controllers/community-messaging.controller.ts:76` |
| DELETE /community/follows | community | escribe y el controlador no declara roles | `src/modules/community/controllers/community-social.controller.ts:223` |
| POST /community/follows | community | escribe y el controlador no declara roles | `src/modules/community/controllers/community-social.controller.ts:194` |
| POST /community/groups | community | escribe y el controlador no declara roles | `src/modules/community/controllers/community-groups.controller.ts:72` |
| POST /community/groups/{groupId}/members | community | escribe y el controlador no declara roles | `src/modules/community/controllers/community-groups.controller.ts:83` |
| PATCH /community/groups/{groupId}/members/{memberId} | community | escribe y el controlador no declara roles | `src/modules/community/controllers/community-groups.controller.ts:95` |
| DELETE /community/groups/{groupId}/members/{memberProfileId} | community | escribe y el controlador no declara roles | `src/modules/community/controllers/community-groups.controller.ts:112` |
| POST /community/groups/{groupId}/posts | community | escribe y el controlador no declara roles | `src/modules/community/controllers/community-groups.controller.ts:123` |
| POST /community/moderation/decisions/{decisionId}/appeal | community | escribe y el controlador no declara roles | `src/modules/community/controllers/community-moderation.controller.ts:78` |
| POST /community/polls/{pollId}/votes | community | escribe y el controlador no declara roles | `src/modules/community/controllers/community-polls.controller.ts:52` |
| POST /community/posts/{postId}/polls | community | escribe y el controlador no declara roles | `src/modules/community/controllers/community-polls.controller.ts:40` |
| POST /community/profiles/{profileId}/posts | community | escribe y el controlador no declara roles | `src/modules/community/controllers/community-social.controller.ts:147` |
| POST /community/profiles/{profileId}/reviews | community | escribe y el controlador no declara roles | `src/modules/community/controllers/community-reviews.controller.ts:50` |
| POST /community/profiles/{profileId}/reviews/{reviewId}/responses | community | escribe y el controlador no declara roles | `src/modules/community/controllers/community-reviews.controller.ts:87` |
| PUT /community/profiles/me | community | escribe y el controlador no declara roles | `src/modules/community/controllers/community-social.controller.ts:112` |
| PUT /community/reactions | community | escribe y el controlador no declara roles | `src/modules/community/controllers/community-social.controller.ts:170` |
| POST /community/reports | community | escribe y el controlador no declara roles | `src/modules/community/controllers/community-moderation.controller.ts:54` |
| PATCH /tenants/{tenantId} | directory | escribe y el controlador no declara roles | `src/modules/directory/controllers/tenants.controller.ts:121` |
| POST /tenants/{tenantId}/branches | directory | escribe y el controlador no declara roles | `src/modules/directory/controllers/tenants.controller.ts:222` |
| POST /tenants/{tenantId}/memberships | directory | escribe y el controlador no declara roles | `src/modules/directory/controllers/tenants.controller.ts:236` |
| POST /tenants/{tenantId}/memberships/{membershipId}/branch-assignments | directory | escribe y el controlador no declara roles | `src/modules/directory/controllers/tenants.controller.ts:248` |
| POST /tenants/{tenantId}/memberships/{membershipId}/offboard | directory | escribe y el controlador no declara roles | `src/modules/directory/controllers/tenants.controller.ts:297` |
| PATCH /tenants/{tenantId}/memberships/{membershipId}/role | directory | escribe y el controlador no declara roles | `src/modules/directory/controllers/tenants.controller.ts:279` |
| POST /tenants/{tenantId}/memberships/{membershipId}/transfer | directory | escribe y el controlador no declara roles | `src/modules/directory/controllers/tenants.controller.ts:266` |
| POST /forms/field-definitions | forms | escribe y el controlador no declara roles | `src/modules/forms/controllers/forms-fields.controller.ts:39` |
| POST /forms/fields/{id}/dependencies | forms | escribe y el controlador no declara roles | `src/modules/forms/controllers/forms-fields.controller.ts:52` |
| PUT /forms/fields/{id}/localizations/{lang} | forms | escribe y el controlador no declara roles | `src/modules/forms/controllers/forms-fields.controller.ts:64` |
| POST /iam/auth/logout | iam | escribe y el controlador no declara roles | `src/modules/iam/controllers/iam-auth.controller.ts:328` |
| POST /iam/auth/logout-all | iam | escribe y el controlador no declara roles | `src/modules/iam/controllers/iam-auth.controller.ts:348` |
| POST /iam/users/{id}/devices | iam | escribe y el controlador no declara roles | `src/modules/iam/controllers/iam-users.controller.ts:318` |
| POST /iam/users/{id}/mfa-factors | iam | escribe y el controlador no declara roles | `src/modules/iam/controllers/iam-users.controller.ts:306` |
| POST /identity/me/identity-verification | identity_assurance | escribe y el controlador no declara roles | `src/modules/identity_assurance/controllers/identity-self-service.controller.ts:41` |
| POST /identity/me/practitioner/identity-verification | identity_assurance | escribe y el controlador no declara roles | `src/modules/identity_assurance/controllers/identity-self-service.controller.ts:54` |
| POST /identity/me/practitioner/license-verification | identity_assurance | escribe y el controlador no declara roles | `src/modules/identity_assurance/controllers/identity-self-service.controller.ts:67` |
| POST /identity/me/tenants/{tenantId}/verification | identity_assurance | escribe y el controlador no declara roles | `src/modules/identity_assurance/controllers/identity-self-service.controller.ts:78` |
| POST /integrations/messages:outbound | integrations | escribe y el controlador no declara roles | `src/modules/integrations/controllers/integrations-messages.controller.ts:52` |
| POST /pharma-labs/notices/{noticeId}/read | pharma_lab | escribe y el controlador no declara roles | `src/modules/pharma_lab/controllers/pharma-lab-notices.controller.ts:48` |
| POST /profiles/patients/{profileId}/related-persons | profiles | escribe y el controlador no declara roles | `src/modules/profiles/controllers/profiles-patients.controller.ts:362` |
| PATCH /profiles/patients/me | profiles | escribe y el controlador no declara roles | `src/modules/profiles/controllers/profiles-patients.controller.ts:127` |
| POST /profiles/practitioners/{profileId}/jurisdiction-authorizations | profiles | escribe y el controlador no declara roles | `src/modules/profiles/controllers/profiles-practitioners.controller.ts:277` |
| DELETE /profiles/practitioners/{profileId}/photo | profiles | escribe y el controlador no declara roles | `src/modules/profiles/controllers/profiles-practitioners.controller.ts:253` |
| PUT /profiles/practitioners/{profileId}/photo | profiles | escribe y el controlador no declara roles | `src/modules/profiles/controllers/profiles-practitioners.controller.ts:228` |
| POST /profiles/practitioners/{profileId}/specialties | profiles | escribe y el controlador no declara roles | `src/modules/profiles/controllers/profiles-practitioners.controller.ts:419` |
| PATCH /profiles/practitioners/me | profiles | escribe y el controlador no declara roles | `src/modules/profiles/controllers/profiles-practitioners.controller.ts:199` |
| POST /profiles/practitioners/me/affiliations | profiles | escribe y el controlador no declara roles | `src/modules/profiles/controllers/profiles-practitioners.controller.ts:357` |
| POST /profiles/practitioners/me/credentials | profiles | escribe y el controlador no declara roles | `src/modules/profiles/controllers/profiles-practitioners.controller.ts:378` |
| POST /tenants/{tenantId}/practitioner-requests/{affiliationId}/approve | profiles | escribe y el controlador no declara roles | `src/modules/profiles/controllers/tenant-practitioner-requests.controller.ts:69` |
| POST /tenants/{tenantId}/practitioner-requests/{affiliationId}/reject | profiles | escribe y el controlador no declara roles | `src/modules/profiles/controllers/tenant-practitioner-requests.controller.ts:81` |
| POST /tenants/{tenantId}/practitioner-requests/{affiliationId}/revoke | profiles | escribe y el controlador no declara roles | `src/modules/profiles/controllers/tenant-practitioner-requests.controller.ts:104` |
| PUT /views/{frontendPageViewId}/preferences | read_models | escribe y el controlador no declara roles | `src/modules/read_models/controllers/frontend-views.controller.ts:92` |
| POST /surveys/me/invitations/{id}/responses | surveys | escribe y el controlador no declara roles | `src/modules/surveys/controllers/surveys-patient.controller.ts:61` |
| POST /telemetry/activity-events | telemetry | escribe y el controlador no declara roles | `src/modules/telemetry/controllers/telemetry-events.controller.ts:41` |
| POST /telemetry/client-contexts | telemetry | escribe y el controlador no declara roles | `src/modules/telemetry/controllers/telemetry-events.controller.ts:53` |
| POST /telemetry/conversion-events | telemetry | escribe y el controlador no declara roles | `src/modules/telemetry/controllers/telemetry-events.controller.ts:77` |
| POST /telemetry/disclosure-acceptances | telemetry | escribe y el controlador no declara roles | `src/modules/telemetry/controllers/telemetry-consent.controller.ts:38` |
| POST /telemetry/session-journeys/{id}/close | telemetry | escribe y el controlador no declara roles | `src/modules/telemetry/controllers/telemetry-events.controller.ts:87` |
| POST /telemetry/tracking-consents | telemetry | escribe y el controlador no declara roles | `src/modules/telemetry/controllers/telemetry-consent.controller.ts:51` |
| POST /telemetry/tracking-consents/{id}/withdraw | telemetry | escribe y el controlador no declara roles | `src/modules/telemetry/controllers/telemetry-consent.controller.ts:73` |
| POST /telemetry/web-vitals | telemetry | escribe y el controlador no declara roles | `src/modules/telemetry/controllers/telemetry-events.controller.ts:65` |
| POST /terminology/ConceptMap/$translate | terminology | escribe y el controlador no declara roles | `src/modules/terminology/controllers/terminology-fhir.controller.ts:87` |

## FLU-03

**Ruta pública que escribe en la base** — severidad ALTA — 15 caso(s).

**Qué hacer:** Verificar que la autenticación alternativa (firma, token de un solo uso) esté en el handler. Una ruta pública que escribe es la superficie más expuesta.

| Dónde | Módulo | Detalle | Fuente |
|---|---|---|---|
| POST /iam/auth/activate | iam | ACTUALIZA iam.account_activations, ACTUALIZA iam.authentication_credentials, CREA iam.security_events, ACTUALIZA iam.users | `src/modules/iam/controllers/iam-auth.controller.ts:194` |
| POST /iam/auth/forgot-password | iam | ACTUALIZA iam.password_resets, CREA iam.password_resets, CREA iam.security_events, CREA messaging.notification_requests | `src/modules/iam/controllers/iam-auth.controller.ts:240` |
| POST /iam/auth/login | iam | ACTUALIZA iam.account_lockouts, CREA iam.account_lockouts, ACTUALIZA iam.refresh_tokens, CREA iam.refresh_tokens, CREA iam.security_events, ACTUALIZA iam.sessions, CREA iam.sessions, ACTUALIZA iam.users | `src/modules/iam/controllers/iam-auth.controller.ts:210` |
| POST /iam/auth/register-organization | iam | CREA directory.tenant_memberships, CREA directory.tenants, CREA iam.authentication_credentials, CREA iam.email_verifications, CREA iam.security_events, CREA iam.user_global_roles, CREA iam.users, CREA insurance.insurance_brokers, CREA insurance.insurance_carriers, CREA messaging.notification_requests | `src/modules/iam/controllers/iam-auth.controller.ts:115` |
| POST /iam/auth/register-patient | iam | CREA common.contact_points, CREA common.identifiers, CREA directory.tenant_memberships, CREA iam.authentication_credentials, CREA iam.email_verifications, CREA iam.security_events, CREA iam.user_global_roles, CREA iam.users, CREA messaging.notification_requests, CREA profiles.patient_profiles, CREA profiles.person_account_links, CREA profiles.person_profiles, CREA profiles.persons | `src/modules/iam/controllers/iam-auth.controller.ts:94` |
| POST /iam/auth/register-practitioner | iam | CREA authz.user_role_assignments, CREA common.contact_points, CREA common.identifiers, CREA directory.tenant_memberships, CREA iam.account_activations, CREA iam.authentication_credentials, CREA iam.email_verifications, CREA iam.security_events, CREA iam.user_global_roles, CREA iam.users, CREA messaging.notification_requests, CREA profiles.health_practitioner_profiles, CREA profiles.jurisdiction_authorizations, CREA profiles.person_account_links, CREA profiles.person_profiles, CREA profiles.persons, CREA profiles.practitioner_languages, CREA profiles.practitioner_specialties, CREA profiles.professional_credentials | `src/modules/iam/controllers/iam-auth.controller.ts:137` |
| POST /iam/auth/resend-verification | iam | CREA iam.email_verifications, CREA messaging.notification_requests | `src/modules/iam/controllers/iam-auth.controller.ts:167` |
| POST /iam/auth/reset-password | iam | ACTUALIZA iam.authentication_credentials, ACTUALIZA iam.password_resets, ACTUALIZA iam.refresh_tokens, CREA iam.security_events, ACTUALIZA iam.sessions | `src/modules/iam/controllers/iam-auth.controller.ts:260` |
| POST /iam/auth/token/refresh | iam | ACTUALIZA iam.refresh_tokens, CREA iam.refresh_tokens, CREA iam.security_events, ACTUALIZA iam.sessions | `src/modules/iam/controllers/iam-auth.controller.ts:275` |
| POST /iam/auth/verify-email | iam | ACTUALIZA iam.email_verifications, ACTUALIZA iam.users | `src/modules/iam/controllers/iam-auth.controller.ts:181` |
| POST /integrations/webhooks/inbound | integrations | CREA integrations.inbound_messages | `src/modules/integrations/controllers/integrations-webhooks.controller.ts:23` |
| GET /r/{code} | marketing | CREA marketing.marketing_touchpoints, ACTUALIZA marketing.tracked_links | `src/modules/marketing/controllers/tracked-link-redirect.controller.ts:36` |
| POST /webhooks/providers/{providerCode}/receipts | messaging | CREA messaging.delivery_receipts, ACTUALIZA messaging.notification_deliveries, ACTUALIZA messaging.notification_requests | `src/modules/messaging/controllers/provider-webhooks.controller.ts:33` |
| POST /payments/callbacks/{callbackPath} | payments | ACTUALIZA payments.payment_intents, ACTUALIZA payments.payment_transactions | `src/modules/payments/controllers/payments-operations.controller.ts:87` |
| POST /tracking/webhooks/carriers/{carrierCode} | tracking | ACTUALIZA tracking.shipments, ACTUALIZA tracking.trackable_subjects, CREA tracking.tracking_events | `src/modules/tracking/controllers/tracking.controller.ts:119` |

## FLU-04

**Operación de riesgo ALTO sin ninguna prueba de integración** — severidad MEDIA — 84 caso(s).

**Qué hacer:** Escribir la prueba de integración contra PostgreSQL real (regla 80.2.4). Las sin prueba alguna van primero.

| Dónde | Módulo | Detalle | Fuente |
|---|---|---|---|
| GET /audio-assets/{assetId}/content | audio_assets | ninguna prueba la menciona | `src/modules/audio_assets/controllers/audio-assets.controller.ts:39` |
| POST /audio-assets/resolve | audio_assets | ninguna prueba la menciona | `src/modules/audio_assets/controllers/audio-assets.controller.ts:28` |
| POST /audit/retention/apply | audit | sólo prueba de controlador | `src/modules/audit/controllers/audit.controller.ts:117` |
| PUT /auth-providers/identity-providers/{id}/attribute-mappings | auth_providers | sólo prueba de controlador | `src/modules/auth_providers/controllers/auth-providers.controller.ts:128` |
| PATCH /care-gaps/{id}/close | clinical_ext | sólo prueba de controlador | `src/modules/clinical_ext/controllers/care-gaps.controller.ts:52` |
| POST /care-gaps/recompute | clinical_ext | sólo prueba de controlador | `src/modules/clinical_ext/controllers/care-gaps.controller.ts:41` |
| POST /cds/check-interactions | clinical_ext | sólo prueba de controlador | `src/modules/clinical_ext/controllers/cds.controller.ts:89` |
| POST /cds/evaluate | clinical_ext | sólo prueba de controlador | `src/modules/clinical_ext/controllers/cds.controller.ts:78` |
| POST /order-sets/{id}/apply | clinical_ext | sólo prueba de controlador | `src/modules/clinical_ext/controllers/order-sets.controller.ts:50` |
| POST /patients/{id}/immunization-plan/project | clinical_ext | sólo prueba de controlador | `src/modules/clinical_ext/controllers/care-gaps.controller.ts:64` |
| POST /prescription-favorites | clinical_ext | ninguna prueba la menciona | `src/modules/clinical_ext/controllers/prescription-favorites.controller.ts:57` |
| DELETE /prescription-favorites/{id} | clinical_ext | ninguna prueba la menciona | `src/modules/clinical_ext/controllers/prescription-favorites.controller.ts:68` |
| DELETE /community/blocks | community | sólo prueba de controlador | `src/modules/community/controllers/community-social.controller.ts:245` |
| DELETE /community/bookmarks | community | sólo prueba de controlador | `src/modules/community/controllers/community-social.controller.ts:234` |
| POST /community/bookmarks | community | sólo prueba de controlador | `src/modules/community/controllers/community-social.controller.ts:183` |
| DELETE /community/follows | community | sólo prueba de controlador | `src/modules/community/controllers/community-social.controller.ts:223` |
| POST /community/groups | community | sólo prueba de controlador | `src/modules/community/controllers/community-groups.controller.ts:72` |
| POST /community/groups/{groupId}/members | community | sólo prueba de controlador | `src/modules/community/controllers/community-groups.controller.ts:83` |
| PATCH /community/groups/{groupId}/members/{memberId} | community | sólo prueba de controlador | `src/modules/community/controllers/community-groups.controller.ts:95` |
| DELETE /community/groups/{groupId}/members/{memberProfileId} | community | sólo prueba de controlador | `src/modules/community/controllers/community-groups.controller.ts:112` |
| POST /community/groups/{groupId}/posts | community | sólo prueba de controlador | `src/modules/community/controllers/community-groups.controller.ts:123` |
| POST /community/moderation/decisions/{decisionId}/appeal | community | sólo prueba de controlador | `src/modules/community/controllers/community-moderation.controller.ts:78` |
| POST /community/polls/{pollId}/votes | community | sólo prueba de controlador | `src/modules/community/controllers/community-polls.controller.ts:52` |
| POST /community/posts/{postId}/polls | community | sólo prueba de controlador | `src/modules/community/controllers/community-polls.controller.ts:40` |
| POST /community/profiles/{profileId}/reviews/{reviewId}/responses | community | sólo prueba de controlador | `src/modules/community/controllers/community-reviews.controller.ts:87` |
| POST /community/reports | community | sólo prueba de controlador | `src/modules/community/controllers/community-moderation.controller.ts:54` |
| POST /delegated-permission-sets/{id}/versions | delegated_access | sólo prueba de controlador | `src/modules/delegated_access/controllers/delegated-permission-sets.controller.ts:44` |
| PATCH /tenants/{tenantId} | directory | ninguna prueba la menciona | `src/modules/directory/controllers/tenants.controller.ts:121` |
| POST /tenants/{tenantId}/branches | directory | sólo prueba de controlador | `src/modules/directory/controllers/tenants.controller.ts:222` |
| POST /tenants/{tenantId}/memberships | directory | sólo prueba de controlador | `src/modules/directory/controllers/tenants.controller.ts:236` |
| POST /tenants/{tenantId}/memberships/{membershipId}/branch-assignments | directory | sólo prueba de controlador | `src/modules/directory/controllers/tenants.controller.ts:248` |
| POST /tenants/{tenantId}/memberships/{membershipId}/offboard | directory | sólo prueba de controlador | `src/modules/directory/controllers/tenants.controller.ts:297` |
| PATCH /tenants/{tenantId}/memberships/{membershipId}/role | directory | sólo prueba de controlador | `src/modules/directory/controllers/tenants.controller.ts:279` |
| POST /tenants/{tenantId}/memberships/{membershipId}/transfer | directory | sólo prueba de controlador | `src/modules/directory/controllers/tenants.controller.ts:266` |
| POST /forms/field-definitions | forms | ninguna prueba la menciona | `src/modules/forms/controllers/forms-fields.controller.ts:39` |
| POST /forms/fields/{id}/dependencies | forms | ninguna prueba la menciona | `src/modules/forms/controllers/forms-fields.controller.ts:52` |
| PUT /forms/fields/{id}/localizations/{lang} | forms | ninguna prueba la menciona | `src/modules/forms/controllers/forms-fields.controller.ts:64` |
| POST /graph/analytics/community-detection | graph_intelligence | ninguna prueba la menciona | `src/modules/graph_intelligence/controllers/graph-query.controller.ts:128` |
| POST /graph/deletion-jobs | graph_intelligence | ninguna prueba la menciona | `src/modules/graph_intelligence/controllers/graph-query.controller.ts:199` |
| POST /graph/edges/{id}/expire | graph_intelligence | ninguna prueba la menciona | `src/modules/graph_intelligence/controllers/graph-projection.controller.ts:126` |
| POST /graph/projections/reconcile | graph_intelligence | ninguna prueba la menciona | `src/modules/graph_intelligence/controllers/graph-projection.controller.ts:77` |
| POST /iam/auth/activate | iam | ninguna prueba la menciona | `src/modules/iam/controllers/iam-auth.controller.ts:194` |
| POST /iam/auth/forgot-password | iam | sólo prueba de controlador | `src/modules/iam/controllers/iam-auth.controller.ts:240` |
| POST /iam/auth/resend-verification | iam | ninguna prueba la menciona | `src/modules/iam/controllers/iam-auth.controller.ts:167` |
| POST /iam/auth/reset-password | iam | sólo prueba de controlador | `src/modules/iam/controllers/iam-auth.controller.ts:260` |
| POST /iam/auth/verify-email | iam | sólo prueba de controlador | `src/modules/iam/controllers/iam-auth.controller.ts:181` |
| POST /identity/me/practitioner/identity-verification | identity_assurance | ninguna prueba la menciona | `src/modules/identity_assurance/controllers/identity-self-service.controller.ts:54` |
| POST /identity/me/practitioner/license-verification | identity_assurance | ninguna prueba la menciona | `src/modules/identity_assurance/controllers/identity-self-service.controller.ts:67` |
| POST /identity/me/tenants/{tenantId}/verification | identity_assurance | ninguna prueba la menciona | `src/modules/identity_assurance/controllers/identity-self-service.controller.ts:78` |
| POST /integrations/messages:outbound | integrations | sólo prueba de controlador | `src/modules/integrations/controllers/integrations-messages.controller.ts:52` |
| POST /integrations/webhooks/inbound | integrations | ninguna prueba la menciona | `src/modules/integrations/controllers/integrations-webhooks.controller.ts:23` |
| POST /marketing/attribution/compute | marketing | sólo prueba de controlador | `src/modules/marketing/controllers/marketing.controller.ts:236` |
| GET /r/{code} | marketing | sólo prueba de controlador | `src/modules/marketing/controllers/tracked-link-redirect.controller.ts:36` |
| POST /webhooks/providers/{providerCode}/receipts | messaging | sólo prueba de controlador | `src/modules/messaging/controllers/provider-webhooks.controller.ts:33` |
| POST /payments/callbacks/{callbackPath} | payments | sólo prueba de controlador | `src/modules/payments/controllers/payments-operations.controller.ts:87` |
| POST /pharma-labs/{pharmaLabId}/medical-visitors | pharma_lab | ninguna prueba la menciona | `src/modules/pharma_lab/controllers/medical-visitors.controller.ts:48` |
| PUT /pharma-labs/{pharmaLabId}/medical-visitors/{medicalVisitorId}/products | pharma_lab | ninguna prueba la menciona | `src/modules/pharma_lab/controllers/medical-visitors.controller.ts:86` |
| PUT /pharma-labs/{pharmaLabId}/medical-visitors/{medicalVisitorId}/specialties | pharma_lab | ninguna prueba la menciona | `src/modules/pharma_lab/controllers/medical-visitors.controller.ts:98` |
| POST /pharma-labs/{pharmaLabId}/medical-visitors/{medicalVisitorId}/unlink | pharma_lab | ninguna prueba la menciona | `src/modules/pharma_lab/controllers/medical-visitors.controller.ts:115` |
| POST /pharma-labs/notices/{noticeId}/read | pharma_lab | ninguna prueba la menciona | `src/modules/pharma_lab/controllers/pharma-lab-notices.controller.ts:48` |
| PUT /visit-agenda/me | pharma_lab | ninguna prueba la menciona | `src/modules/pharma_lab/controllers/visit-agenda.controller.ts:39` |
| POST /profiles/practitioners/{profileId}/jurisdiction-authorizations | profiles | sólo prueba de controlador | `src/modules/profiles/controllers/profiles-practitioners.controller.ts:277` |
| DELETE /profiles/practitioners/{profileId}/photo | profiles | sólo prueba de controlador | `src/modules/profiles/controllers/profiles-practitioners.controller.ts:253` |
| PUT /profiles/practitioners/{profileId}/photo | profiles | sólo prueba de controlador | `src/modules/profiles/controllers/profiles-practitioners.controller.ts:228` |
| POST /profiles/practitioners/{profileId}/specialties | profiles | sólo prueba de controlador | `src/modules/profiles/controllers/profiles-practitioners.controller.ts:419` |
| PATCH /profiles/practitioners/me | profiles | ninguna prueba la menciona | `src/modules/profiles/controllers/profiles-practitioners.controller.ts:199` |
| POST /profiles/practitioners/me/credentials | profiles | ninguna prueba la menciona | `src/modules/profiles/controllers/profiles-practitioners.controller.ts:378` |
| POST /tenants/{tenantId}/practitioner-requests/{affiliationId}/reject | profiles | ninguna prueba la menciona | `src/modules/profiles/controllers/tenant-practitioner-requests.controller.ts:81` |
| POST /tenants/{tenantId}/practitioner-requests/{affiliationId}/revoke | profiles | ninguna prueba la menciona | `src/modules/profiles/controllers/tenant-practitioner-requests.controller.ts:104` |
| PUT /views/{frontendPageViewId}/preferences | read_models | sólo prueba de controlador | `src/modules/read_models/controllers/frontend-views.controller.ts:92` |
| DELETE /scheduling/exceptions/{id} | scheduling | ninguna prueba la menciona | `src/modules/scheduling/controllers/scheduling.controller.ts:490` |
| POST /surveys/me/invitations/{id}/responses | surveys | ninguna prueba la menciona | `src/modules/surveys/controllers/surveys-patient.controller.ts:61` |
| POST /telemetry/activity-events | telemetry | ninguna prueba la menciona | `src/modules/telemetry/controllers/telemetry-events.controller.ts:41` |
| POST /telemetry/client-contexts | telemetry | ninguna prueba la menciona | `src/modules/telemetry/controllers/telemetry-events.controller.ts:53` |
| POST /telemetry/conversion-events | telemetry | ninguna prueba la menciona | `src/modules/telemetry/controllers/telemetry-events.controller.ts:77` |
| POST /telemetry/disclosure-acceptances | telemetry | sólo prueba de controlador | `src/modules/telemetry/controllers/telemetry-consent.controller.ts:38` |
| POST /telemetry/session-journeys/{id}/close | telemetry | ninguna prueba la menciona | `src/modules/telemetry/controllers/telemetry-events.controller.ts:87` |
| POST /telemetry/tracking-consents | telemetry | sólo prueba de controlador | `src/modules/telemetry/controllers/telemetry-consent.controller.ts:51` |
| POST /telemetry/tracking-consents/{id}/withdraw | telemetry | sólo prueba de controlador | `src/modules/telemetry/controllers/telemetry-consent.controller.ts:73` |
| POST /telemetry/web-vitals | telemetry | ninguna prueba la menciona | `src/modules/telemetry/controllers/telemetry-events.controller.ts:65` |
| POST /terminology/ConceptMap/$translate | terminology | sólo prueba de controlador | `src/modules/terminology/controllers/terminology-fhir.controller.ts:87` |
| POST /terminology/ValueSet/{id}/$expand | terminology | sólo prueba de controlador | `src/modules/terminology/controllers/terminology-fhir.controller.ts:66` |
| POST /tracking/webhooks/carriers/{carrierCode} | tracking | sólo prueba de controlador | `src/modules/tracking/controllers/tracking.controller.ts:119` |
| POST /vector-rag/deletion-jobs | vector_rag | ninguna prueba la menciona | `src/modules/vector_rag/controllers/vector-runtime.controller.ts:162` |

## FLU-05

**Proceso con operaciones de riesgo ALTO y ninguna prueba de integración** — severidad MEDIA — 16 caso(s).

**Qué hacer:** Priorizar estos procesos al escribir pruebas: un fallo aquí rompe un flujo completo, no una operación.

| Dónde | Módulo | Detalle | Fuente |
|---|---|---|---|
| audio_assets | — | 2 operaciones de riesgo ALTO, 0 pruebas de integración en el proceso | `src/modules/audio_assets/README.md` |
| audit | — | 1 operaciones de riesgo ALTO, 0 pruebas de integración en el proceso | `src/modules/audit/README.md` |
| auth_providers | — | 1 operaciones de riesgo ALTO, 0 pruebas de integración en el proceso | `src/modules/auth_providers/README.md` |
| clinical_ext | — | 8 operaciones de riesgo ALTO, 0 pruebas de integración en el proceso | `src/modules/clinical_ext/README.md` |
| delegated_access | — | 1 operaciones de riesgo ALTO, 0 pruebas de integración en el proceso | `src/modules/delegated_access/README.md` |
| forms | — | 3 operaciones de riesgo ALTO, 0 pruebas de integración en el proceso | `src/modules/forms/README.md` |
| graph_intelligence | — | 4 operaciones de riesgo ALTO, 0 pruebas de integración en el proceso | `src/modules/graph_intelligence/README.md` |
| integrations | — | 2 operaciones de riesgo ALTO, 0 pruebas de integración en el proceso | `src/modules/integrations/README.md` |
| marketing | — | 2 operaciones de riesgo ALTO, 0 pruebas de integración en el proceso | `src/modules/marketing/README.md` |
| payments | — | 1 operaciones de riesgo ALTO, 0 pruebas de integración en el proceso | `src/modules/payments/README.md` |
| pharma_lab | — | 6 operaciones de riesgo ALTO, 0 pruebas de integración en el proceso | `src/modules/pharma_lab/README.md` |
| read_models | — | 1 operaciones de riesgo ALTO, 0 pruebas de integración en el proceso | `src/modules/read_models/README.md` |
| surveys | — | 1 operaciones de riesgo ALTO, 0 pruebas de integración en el proceso | `src/modules/surveys/README.md` |
| telemetry | — | 8 operaciones de riesgo ALTO, 0 pruebas de integración en el proceso | `src/modules/telemetry/README.md` |
| tracking | — | 1 operaciones de riesgo ALTO, 0 pruebas de integración en el proceso | `src/modules/tracking/README.md` |
| vector_rag | — | 1 operaciones de riesgo ALTO, 0 pruebas de integración en el proceso | `src/modules/vector_rag/README.md` |

## FLU-06

**Operaciones que el frontend llama y la API no tiene** — severidad ALTA — 45 caso(s).

**Qué hacer:** Cada fila es una pantalla que hoy falla (404) o depende de un mock. Decidir: implementar en la API, o retirar del cliente. No se corrige aquí.

| Dónde | Módulo | Detalle | Fuente |
|---|---|---|---|
| GET /accounting/balance-sheet | — | cliente AccountingClient | `src/app/core/data-access/accounting/accounting.client.ts` |
| GET /accounting/general-ledger | — | cliente AccountingClient | `src/app/core/data-access/accounting/accounting.client.ts` |
| GET /accounting/income-statement | — | cliente AccountingClient | `src/app/core/data-access/accounting/accounting.client.ts` |
| POST /authz/care-relationships/:id/respond | — | cliente AuthzClient | `src/app/core/data-access/authz/authz.client.ts` |
| POST /authz/care-relationships/request | — | cliente AuthzClient | `src/app/core/data-access/authz/authz.client.ts` |
| GET /authz/care-relationships/requests/mine | — | cliente AuthzClient | `src/app/core/data-access/authz/authz.client.ts` |
| PATCH /billing/service-catalog/:id | — | cliente ServicesCatalogClient | `src/app/core/data-access/services-catalog/services-catalog.client.ts` |
| GET /billing/service-catalog/procedure-specialties | — | cliente ServicesCatalogClient | `src/app/core/data-access/services-catalog/services-catalog.client.ts` |
| GET /billing/service-catalog/procedures | — | cliente ServicesCatalogClient | `src/app/core/data-access/services-catalog/services-catalog.client.ts` |
| POST /clinical/allergy-intolerances/:allergyId/attachments | — | cliente ClinicalClient | `src/app/core/data-access/clinical/clinical.client.ts` |
| POST /clinical/conditions/:conditionId/attachments | — | cliente ClinicalClient | `src/app/core/data-access/clinical/clinical.client.ts` |
| GET /clinical/me/medical-aspects | — | cliente ClinicalClient | `src/app/core/data-access/clinical/clinical.client.ts` |
| PUT /clinical/me/medical-aspects | — | cliente ClinicalClient | `src/app/core/data-access/clinical/clinical.client.ts` |
| POST /clinical/medication-requests/:requestId/attachments | — | cliente ClinicalClient | `src/app/core/data-access/clinical/clinical.client.ts` |
| POST /clinical/procedures/:procedureId/attachments | — | cliente ClinicalClient | `src/app/core/data-access/clinical/clinical.client.ts` |
| GET /community/comments/media/:fileId/content | — | cliente CommunityClient | `src/app/core/data-access/community/community.client.ts` |
| DELETE /forms/assignments/:assignmentId | — | cliente FormsClient | `src/app/core/data-access/forms/forms.client.ts` |
| PATCH /forms/assignments/:assignmentId | — | cliente FormsClient | `src/app/core/data-access/forms/forms.client.ts` |
| PUT /forms/assignments/order | — | cliente FormsClient | `src/app/core/data-access/forms/forms.client.ts` |
| PATCH /forms/field-definitions/:fieldId | — | cliente FormsClient | `src/app/core/data-access/forms/forms.client.ts` |
| GET /identity/me/verification-types | — | cliente IdentityClient | `src/app/core/data-access/identity/identity.client.ts` |
| GET /insurance-claims | — | cliente InsuranceClient | `src/app/core/data-access/insurance/insurance.client.ts` |
| GET /insurance-claims/:id | — | cliente InsuranceClient | `src/app/core/data-access/insurance/insurance.client.ts` |
| POST /practitioners/me/sites | — | cliente PracticeSitesClient | `src/app/core/data-access/practice-sites/practice-sites.client.ts` |
| DELETE /practitioners/me/sites/:siteId | — | cliente PracticeSitesClient | `src/app/core/data-access/practice-sites/practice-sites.client.ts` |
| DELETE /profiles/practitioners/me/credentials/:credentialId | — | cliente ProfilesClient | `src/app/core/data-access/profiles/profiles.client.ts` |
| GET /profiles/practitioners/specialty-counts | — | cliente ProfilesClient | `src/app/core/data-access/profiles/profiles.client.ts` |
| GET /quotations | — | cliente QuotationsClient | `src/app/core/data-access/quotations/quotations.client.ts` |
| POST /quotations | — | cliente QuotationsClient | `src/app/core/data-access/quotations/quotations.client.ts` |
| GET /quotations/:id | — | cliente QuotationsClient | `src/app/core/data-access/quotations/quotations.client.ts` |
| POST /quotations/simulate | — | cliente QuotationsClient | `src/app/core/data-access/quotations/quotations.client.ts` |
| POST /scheduling/bookings/:bookingId/:accion | — | cliente SchedulingClient | `src/app/core/data-access/scheduling/scheduling.client.ts` |
| PATCH /surveys/templates/:surveyId | — | cliente SurveysClient | `src/app/core/data-access/surveys/surveys.client.ts` |
| DELETE /surveys/templates/:surveyId/questions/:questionId | — | cliente SurveysClient | `src/app/core/data-access/surveys/surveys.client.ts` |
| PATCH /surveys/templates/:surveyId/questions/:questionId | — | cliente SurveysClient | `src/app/core/data-access/surveys/surveys.client.ts` |
| PUT /surveys/templates/:surveyId/questions/order | — | cliente SurveysClient | `src/app/core/data-access/surveys/surveys.client.ts` |
| POST /surveys/templates/:surveyId/versions | — | cliente SurveysClient | `src/app/core/data-access/surveys/surveys.client.ts` |
| GET assets | — | cliente AssetsLiabilitiesClient | `src/app/core/data-access/assets-liabilities/assets-liabilities.client.ts` |
| POST assets | — | cliente AssetsLiabilitiesClient | `src/app/core/data-access/assets-liabilities/assets-liabilities.client.ts` |
| PATCH assets/:assetId/automation | — | cliente AssetsLiabilitiesClient | `src/app/core/data-access/assets-liabilities/assets-liabilities.client.ts` |
| POST assets/:assetId/progress | — | cliente AssetsLiabilitiesClient | `src/app/core/data-access/assets-liabilities/assets-liabilities.client.ts` |
| GET liabilities | — | cliente AssetsLiabilitiesClient | `src/app/core/data-access/assets-liabilities/assets-liabilities.client.ts` |
| POST liabilities | — | cliente AssetsLiabilitiesClient | `src/app/core/data-access/assets-liabilities/assets-liabilities.client.ts` |
| PATCH liabilities/:liabilityId/automation | — | cliente AssetsLiabilitiesClient | `src/app/core/data-access/assets-liabilities/assets-liabilities.client.ts` |
| POST liabilities/:liabilityId/progress | — | cliente AssetsLiabilitiesClient | `src/app/core/data-access/assets-liabilities/assets-liabilities.client.ts` |

## FLU-07

**Operaciones de la API que ningún cliente del frontend llama** — severidad INFO — 891 caso(s).

**Qué hacer:** Informativo: pueden ser internas (workers), de otros consumidores (móvil, integraciones) o deuda. Confirmar con el responsable antes de retirar nada.

| Dónde | Módulo | Detalle | Fuente |
|---|---|---|---|
| POST /accounting/accounts | accounting | ningún cliente del frontend la declara | — |
| POST /accounting/accrual-objects | accounting | ningún cliente del frontend la declara | — |
| POST /accounting/accruals/run | accounting | ningún cliente del frontend la declara | — |
| POST /accounting/assets/capitalize | accounting | ningún cliente del frontend la declara | — |
| POST /accounting/clearing-documents | accounting | ningún cliente del frontend la declara | — |
| POST /accounting/depreciation/run | accounting | ningún cliente del frontend la declara | — |
| POST /accounting/exchange-rates | accounting | ningún cliente del frontend la declara | — |
| POST /accounting/fiscal-periods/{id}/lock | accounting | ningún cliente del frontend la declara | — |
| POST /accounting/fiscal-years | accounting | ningún cliente del frontend la declara | — |
| POST /accounting/journal-transactions/{id}/approve | accounting | ningún cliente del frontend la declara | — |
| POST /accounting/journal-transactions/{id}/classify | accounting | ningún cliente del frontend la declara | — |
| POST /accounting/journal-transactions/{id}/files | accounting | ningún cliente del frontend la declara | — |
| POST /accounting/journal-transactions/{id}/post | accounting | ningún cliente del frontend la declara | — |
| POST /accounting/journal-transactions/{id}/reverse | accounting | ningún cliente del frontend la declara | — |
| POST /accounting/journal-transactions/{id}/submit-review | accounting | ningún cliente del frontend la declara | — |
| POST /accounting/liabilities/{id}/payments | accounting | ningún cliente del frontend la declara | — |
| POST /accounting/open-items | accounting | ningún cliente del frontend la declara | — |
| POST /accounting/postings/determine-accounts | accounting | ningún cliente del frontend la declara | — |
| POST /ads/ad-accounts/{id}/campaigns/launch | ads | ningún cliente del frontend la declara | — |
| POST /ads/ad-accounts/{id}/experiments | ads | ningún cliente del frontend la declara | — |
| POST /ads/ad-accounts/{id}/invoices/issue | ads | ningún cliente del frontend la declara | — |
| POST /ads/ad-accounts/{id}/targeting | ads | ningún cliente del frontend la declara | — |
| POST /ads/ad-sets/{id}/budget-schedules | ads | ningún cliente del frontend la declara | — |
| POST /ads/ad-sets/{id}/identity | ads | ningún cliente del frontend la declara | — |
| POST /ads/ads/{id}/review-events | ads | ningún cliente del frontend la declara | — |
| POST /ads/automated-rules/{id}/evaluate | ads | ningún cliente del frontend la declara | — |
| POST /ads/business-managers/{bmId}/ad-accounts | ads | ningún cliente del frontend la declara | — |
| POST /ads/business-managers/{bmId}/partners | ads | ningún cliente del frontend la declara | — |
| POST /ads/catalogs/{id}/feeds/{feedId}/run | ads | ningún cliente del frontend la declara | — |
| POST /ads/datasets/{id}/events | ads | ningún cliente del frontend la declara | — |
| POST /ads/event-data-policies | ads | ningún cliente del frontend la declara | — |
| POST /ads/ingest/insights | ads | ningún cliente del frontend la declara | — |
| POST /ads/lead-forms/{id}/submissions | ads | ningún cliente del frontend la declara | — |
| POST /ads/offline-conversion-sets/upload | ads | ningún cliente del frontend la declara | — |
| POST /ads/platform-connections | ads | ningún cliente del frontend la declara | — |
| POST /ads/policy-violations/{id}/appeals | ads | ningún cliente del frontend la declara | — |
| GET / | app | ningún cliente del frontend la declara | — |
| GET /health | app | ningún cliente del frontend la declara | — |
| GET /health/data-sources | app | ningún cliente del frontend la declara | — |
| GET /health/data-sources/metrics | app | ningún cliente del frontend la declara | — |
| GET /liveness | app | ningún cliente del frontend la declara | — |
| GET /readiness | app | ningún cliente del frontend la declara | — |
| GET /audio-assets/{assetId}/content | audio_assets | ningún cliente del frontend la declara | — |
| POST /audio-assets/resolve | audio_assets | ningún cliente del frontend la declara | — |
| POST /internal/audio-assets/{assetId}/deprecate | audio_assets | ningún cliente del frontend la declara | — |
| POST /internal/audio-assets/{assetId}/generated | audio_assets | ningún cliente del frontend la declara | — |
| POST /internal/audio-assets/{assetId}/generation-failed | audio_assets | ningún cliente del frontend la declara | — |
| POST /internal/audio-assets/{assetId}/prepare-generation | audio_assets | ningún cliente del frontend la declara | — |
| POST /internal/audio-assets/garbage-collect | audio_assets | ningún cliente del frontend la declara | — |
| POST /internal/audio-assets/pregenerate | audio_assets | ningún cliente del frontend la declara | — |
| GET /internal/audio-assets/status | audio_assets | ningún cliente del frontend la declara | — |
| POST /internal/audio-assets/verify | audio_assets | ningún cliente del frontend la declara | — |
| POST /audit/anomaly/scan | audit | ningún cliente del frontend la declara | — |
| POST /audit/data-access | audit | ningún cliente del frontend la declara | — |
| POST /audit/events | audit | ningún cliente del frontend la declara | — |
| GET /audit/history/{entity}/{id} | audit | ningún cliente del frontend la declara | — |
| POST /audit/integrity/verify | audit | ningún cliente del frontend la declara | — |
| POST /audit/retention/apply | audit | ningún cliente del frontend la declara | — |
| POST /audit/third-party-access | audit | ningún cliente del frontend la declara | — |
| POST /compliance/audit-export | audit | ningún cliente del frontend la declara | — |
| POST /moderation/decisions | audit | ningún cliente del frontend la declara | — |
| POST /privacy/dsar | audit | ningún cliente del frontend la declara | — |
| PATCH /privacy/dsar/{id} | audit | ningún cliente del frontend la declara | — |
| POST /authz/care-relationships | authz | ningún cliente del frontend la declara | — |
| POST /authz/care-relationships/{id}/revoke | authz | ningún cliente del frontend la declara | — |
| DELETE /authz/clinical-access-grants/{grantId} | authz | ningún cliente del frontend la declara | — |
| POST /authz/decisions/evaluate | authz | ningún cliente del frontend la declara | — |
| POST /authz/legal-representations | authz | ningún cliente del frontend la declara | — |
| POST /authz/legal-representations/{id}/revoke | authz | ningún cliente del frontend la declara | — |
| POST /authz/patients/{patientProfileId}/break-the-glass | authz | ningún cliente del frontend la declara | — |
| POST /authz/patients/{patientProfileId}/clinical-access-grants | authz | ningún cliente del frontend la declara | — |
| POST /authz/pdp/cache/invalidate | authz | ningún cliente del frontend la declara | — |
| POST /authz/permission-categories | authz | ningún cliente del frontend la declara | — |
| POST /authz/permissions | authz | ningún cliente del frontend la declara | — |
| POST /authz/resource-scope-grants | authz | ningún cliente del frontend la declara | — |
| GET /authz/roles | authz | ningún cliente del frontend la declara | — |
| POST /authz/roles | authz | ningún cliente del frontend la declara | — |
| PUT /authz/roles/{roleId}/field-permissions | authz | ningún cliente del frontend la declara | — |
| PUT /authz/roles/{roleId}/permissions | authz | ningún cliente del frontend la declara | — |
| POST /authz/tenants/{tenantId}/access-policies | authz | ningún cliente del frontend la declara | — |
| POST /authz/users/{userId}/permission-grants | authz | ningún cliente del frontend la declara | — |
| POST /authz/users/{userId}/role-assignments | authz | ningún cliente del frontend la declara | — |
| POST /automation/agent-runs/{id}/approvals | automation | ningún cliente del frontend la declara | — |
| POST /automation/agent-runs/{id}/record-automations/{recordAutomationId}/execute | automation | ningún cliente del frontend la declara | — |
| POST /automation/agent-runs/{id}/steps | automation | ningún cliente del frontend la declara | — |
| POST /automation/agents | automation | ningún cliente del frontend la declara | — |
| POST /automation/agents/{id}/guardrails | automation | ningún cliente del frontend la declara | — |
| POST /automation/agents/{id}/memory | automation | ningún cliente del frontend la declara | — |
| POST /automation/agents/{id}/versions/{versionId}/tool-bindings | automation | ningún cliente del frontend la declara | — |
| POST /automation/agents/{id}/versions/publish | automation | ningún cliente del frontend la declara | — |
| POST /automation/approvals/{id}/decide | automation | ningún cliente del frontend la declara | — |
| POST /automation/guardrails | automation | ningún cliente del frontend la declara | — |
| POST /automation/runs/{workflowRunId}/agent-runs | automation | ningún cliente del frontend la declara | — |
| POST /automation/runs/{workflowRunId}/finalize | automation | ningún cliente del frontend la declara | — |
| POST /automation/tools | automation | ningún cliente del frontend la declara | — |
| POST /automation/triggers | automation | ningún cliente del frontend la declara | — |
| POST /automation/triggers/calendar/tick | automation | ningún cliente del frontend la declara | — |
| POST /automation/workflows | automation | ningún cliente del frontend la declara | — |
| POST /automation/workflows/{id}/runs | automation | ningún cliente del frontend la declara | — |
| POST /billing/bills | billing | ningún cliente del frontend la declara | — |
| POST /billing/documents/{id}:post-to-ledger | billing | ningún cliente del frontend la declara | — |
| POST /billing/dunning-runs:execute | billing | ningún cliente del frontend la declara | — |
| POST /billing/internal/dunning-runs/run-due | billing | ningún cliente del frontend la declara | — |
| POST /billing/invoices:issue-from-encounter | billing | ningún cliente del frontend la declara | — |
| POST /billing/invoices/{id}:credit-note | billing | ningún cliente del frontend la declara | — |
| POST /billing/kpi-snapshots:compute | billing | ningún cliente del frontend la declara | — |
| POST /billing/patient-statements:generate | billing | ningún cliente del frontend la declara | — |
| POST /billing/payment-plans | billing | ningún cliente del frontend la declara | — |
| POST /billing/payments-made:execute | billing | ningún cliente del frontend la declara | — |
| POST /billing/payments-received:apply | billing | ningún cliente del frontend la declara | — |
| POST /billing/reconciliation:clear | billing | ningún cliente del frontend la declara | — |
| POST /billing/reimbursements:link | billing | ningún cliente del frontend la declara | — |
| PATCH /charts/care-plans/{planId}/activities/{activityId} | chart | ningún cliente del frontend la declara | — |
| POST /charts/notes/{noteId}/amendments | chart | ningún cliente del frontend la declara | — |
| POST /charts/notes/{noteId}/versions/{versionId}/cosign | chart | ningún cliente del frontend la declara | — |
| POST /charts/notes/{noteId}/versions/{versionId}/sign | chart | ningún cliente del frontend la declara | — |
| POST /charts/notes/versions/{versionId}/exam-findings | chart | ningún cliente del frontend la declara | — |
| POST /charts/notes/versions/{versionId}/release | chart | ningún cliente del frontend la declara | — |
| POST /charts/notes/versions/{versionId}/withhold | chart | ningún cliente del frontend la declara | — |
| POST /clinical/immunizations | clinical | ningún cliente del frontend la declara | — |
| POST /clinical/medication-records | clinical | ningún cliente del frontend la declara | — |
| POST /clinical/medication-requests/{id}/edit | clinical | ningún cliente del frontend la declara | — |
| POST /clinical/medication-requests/{id}/invalidate | clinical | ningún cliente del frontend la declara | — |
| POST /clinical/medication-requests/{id}/renew | clinical | ningún cliente del frontend la declara | — |
| POST /clinical/medication-requests/{id}/replace | clinical | ningún cliente del frontend la declara | — |
| PATCH /clinical/observations/{id}/amend | clinical | ningún cliente del frontend la declara | — |
| GET /clinical/patients/{patientProfileId}/prescriptions | clinical | ningún cliente del frontend la declara | — |
| GET /clinical/patients/{patientProfileId}/prescriptions/history.pdf | clinical | ningún cliente del frontend la declara | — |
| GET /clinical/prescription-signature-policies | clinical | ningún cliente del frontend la declara | — |
| POST /clinical/prescription-signature-policies | clinical | ningún cliente del frontend la declara | — |
| POST /clinical/prescription-signature-policies/{id}/deactivate | clinical | ningún cliente del frontend la declara | — |
| GET /clinical/prescriptions/{id}/pdf | clinical | ningún cliente del frontend la declara | — |
| POST /clinical/procedures | clinical | ningún cliente del frontend la declara | — |
| PATCH /care-gaps/{id}/close | clinical_ext | ningún cliente del frontend la declara | — |
| POST /care-gaps/recompute | clinical_ext | ningún cliente del frontend la declara | — |
| GET /care-teams | clinical_ext | ningún cliente del frontend la declara | — |
| POST /care-teams | clinical_ext | ningún cliente del frontend la declara | — |
| PATCH /care-teams/{id}/members/{memberId}/set-responsible | clinical_ext | ningún cliente del frontend la declara | — |
| POST /cds-rules | clinical_ext | ningún cliente del frontend la declara | — |
| POST /cds-rules/{id}/versions/publish | clinical_ext | ningún cliente del frontend la declara | — |
| POST /cds-rules/{id}/versions/rollback | clinical_ext | ningún cliente del frontend la declara | — |
| POST /cds/evaluate | clinical_ext | ningún cliente del frontend la declara | — |
| PATCH /clinical-alerts/{id}/acknowledge | clinical_ext | ningún cliente del frontend la declara | — |
| PATCH /clinical-alerts/{id}/override | clinical_ext | ningún cliente del frontend la declara | — |
| POST /drug-interactions | clinical_ext | ningún cliente del frontend la declara | — |
| POST /immunization-schedules | clinical_ext | ningún cliente del frontend la declara | — |
| POST /order-sets | clinical_ext | ningún cliente del frontend la declara | — |
| POST /order-sets/{id}/apply | clinical_ext | ningún cliente del frontend la declara | — |
| POST /patients/{id}/immunization-plan/project | clinical_ext | ningún cliente del frontend la declara | — |
| GET /referrals | clinical_ext | ningún cliente del frontend la declara | — |
| POST /referrals | clinical_ext | ningún cliente del frontend la declara | — |
| PATCH /referrals/{id}/respond | clinical_ext | ningún cliente del frontend la declara | — |
| POST /virtual-encounters | clinical_ext | ningún cliente del frontend la declara | — |
| PATCH /virtual-encounters/{id}/end | clinical_ext | ningún cliente del frontend la declara | — |
| PATCH /virtual-encounters/{id}/join | clinical_ext | ningún cliente del frontend la declara | — |
| POST /common/contact-points | common | ningún cliente del frontend la declara | — |
| POST /common/contact-points/{id}/verify | common | ningún cliente del frontend la declara | — |
| POST /common/files | common | ningún cliente del frontend la declara | — |
| POST /common/files/{id}/versions | common | ningún cliente del frontend la declara | — |
| POST /common/files/{id}/versions/{vid}/derivatives | common | ningún cliente del frontend la declara | — |
| POST /common/identifiers | common | ningún cliente del frontend la declara | — |
| POST /internal/files/versions/{vid}/scan-result | common | ningún cliente del frontend la declara | — |
| GET /internal/files/versions/pending-scan | common | ningún cliente del frontend la declara | — |
| DESCONOCIDO / | community | ningún cliente del frontend la declara | — |
| DESCONOCIDO / | community | ningún cliente del frontend la declara | — |
| DESCONOCIDO / | community | ningún cliente del frontend la declara | — |
| POST /community/polls/{pollId}/votes | community | ningún cliente del frontend la declara | — |
| POST /community/posts/{postId}/polls | community | ningún cliente del frontend la declara | — |
| GET /community/profiles/me/stats | community | ningún cliente del frontend la declara | — |
| POST /community/public-profiles | community | ningún cliente del frontend la declara | — |
| GET /f/{slug} | community | ningún cliente del frontend la declara | — |
| GET /internal/community/feed/pending | community | ningún cliente del frontend la declara | — |
| POST /internal/community/feed/rebuild | community | ningún cliente del frontend la declara | — |
| GET /internal/community/search/health | community | ningún cliente del frontend la declara | — |
| POST /internal/community/search/reindex | community | ningún cliente del frontend la declara | — |
| POST /internal/community/verification/badges | community | ningún cliente del frontend la declara | — |
| POST /internal/community/verification/badges/{targetId}/revoke | community | ningún cliente del frontend la declara | — |
| POST /internal/community/verification/badges/expire-sweep | community | ningún cliente del frontend la declara | — |
| GET /l/{slug} | community | ningún cliente del frontend la declara | — |
| GET /o/{slug} | community | ningún cliente del frontend la declara | — |
| GET /p/{slug} | community | ningún cliente del frontend la declara | — |
| GET /public/comments/{commentId}/replies | community | ningún cliente del frontend la declara | — |
| GET /public/media/{id} | community | ningún cliente del frontend la declara | — |
| GET /public/nearby | community | ningún cliente del frontend la declara | — |
| GET /public/posts/{postId}/comments | community | ningún cliente del frontend la declara | — |
| GET /public/posts/{postId}/reactions | community | ningún cliente del frontend la declara | — |
| GET /public/search | community | ningún cliente del frontend la declara | — |
| GET /public/search/diagnostic-units | community | ningún cliente del frontend la declara | — |
| GET /public/search/insurers | community | ningún cliente del frontend la declara | — |
| GET /public/search/medications | community | ningún cliente del frontend la declara | — |
| GET /public/search/organizations | community | ningún cliente del frontend la declara | — |
| GET /public/search/pharmacies | community | ningún cliente del frontend la declara | — |
| GET /s/{slug} | community | ningún cliente del frontend la declara | — |
| POST /consent/consent-evidence | consent | ningún cliente del frontend la declara | — |
| POST /consent/consents | consent | ningún cliente del frontend la declara | — |
| PATCH /consent/consents/{id}/provisions | consent | ningún cliente del frontend la declara | — |
| POST /consent/consents/{id}/withdraw | consent | ningún cliente del frontend la declara | — |
| POST /consent/hipaa-authorizations | consent | ningún cliente del frontend la declara | — |
| POST /consent/hipaa-authorizations/{id}/revoke | consent | ningún cliente del frontend la declara | — |
| POST /consent/internal/expiration-sweep | consent | ningún cliente del frontend la declara | — |

_Se muestran 200 de 891; la lista completa está en `inventario/flujos/hallazgos.json`._

## FLU-08

**Operaciones que existen en el código y el contrato OpenAPI no publica** — severidad MEDIA — 64 caso(s).

**Qué hacer:** Regenerar el contrato o decidir si deben dejar de existir. Los clientes generados no las ven.

| Dónde | Módulo | Detalle | Fuente |
|---|---|---|---|
| GET /clinical/patients/{patientProfileId}/prescriptions | clinical | handler sin operación en openapi.json | `src/modules/clinical/controllers/clinical-prescriptions.controller.ts:50` |
| GET /clinical/patients/{patientProfileId}/prescriptions/history.pdf | clinical | handler sin operación en openapi.json | `src/modules/clinical/controllers/clinical-prescriptions.controller.ts:81` |
| GET /clinical/prescriptions/{id}/pdf | clinical | handler sin operación en openapi.json | `src/modules/clinical/controllers/clinical-prescriptions.controller.ts:113` |
| DESCONOCIDO / | community | handler sin operación en openapi.json | `src/modules/community/controllers/community-public.controller.ts:460` |
| DESCONOCIDO / | community | handler sin operación en openapi.json | `src/modules/community/controllers/community-public.controller.ts:467` |
| DESCONOCIDO / | community | handler sin operación en openapi.json | `src/modules/community/controllers/community-public.controller.ts:474` |
| GET /public/comments/{commentId}/replies | community | handler sin operación en openapi.json | `src/modules/community/controllers/community-public.controller.ts:137` |
| GET /public/posts/{postId}/comments | community | handler sin operación en openapi.json | `src/modules/community/controllers/community-public.controller.ts:116` |
| GET /public/posts/{postId}/reactions | community | handler sin operación en openapi.json | `src/modules/community/controllers/community-public.controller.ts:101` |
| POST /admin/catalog/annotations/{id}/review | data_catalog | handler sin operación en openapi.json | `src/modules/data_catalog/controllers/admin-catalog.controller.ts:211` |
| GET /admin/catalog/coverage | data_catalog | handler sin operación en openapi.json | `src/modules/data_catalog/controllers/admin-catalog.controller.ts:239` |
| GET /admin/catalog/objects | data_catalog | handler sin operación en openapi.json | `src/modules/data_catalog/controllers/admin-catalog.controller.ts:91` |
| GET /admin/catalog/objects/{id} | data_catalog | handler sin operación en openapi.json | `src/modules/data_catalog/controllers/admin-catalog.controller.ts:102` |
| PUT /admin/catalog/objects/{id}/annotation | data_catalog | handler sin operación en openapi.json | `src/modules/data_catalog/controllers/admin-catalog.controller.ts:187` |
| GET /admin/catalog/objects/{id}/changes | data_catalog | handler sin operación en openapi.json | `src/modules/data_catalog/controllers/admin-catalog.controller.ts:164` |
| GET /admin/catalog/objects/{id}/columns | data_catalog | handler sin operación en openapi.json | `src/modules/data_catalog/controllers/admin-catalog.controller.ts:115` |
| GET /admin/catalog/objects/{id}/evidence | data_catalog | handler sin operación en openapi.json | `src/modules/data_catalog/controllers/admin-catalog.controller.ts:126` |
| POST /admin/catalog/objects/{id}/evidence | data_catalog | handler sin operación en openapi.json | `src/modules/data_catalog/controllers/admin-catalog.controller.ts:137` |
| GET /admin/catalog/objects/{id}/history | data_catalog | handler sin operación en openapi.json | `src/modules/data_catalog/controllers/admin-catalog.controller.ts:153` |
| GET /admin/catalog/objects/{id}/impact | data_catalog | handler sin operación en openapi.json | `src/modules/data_catalog/controllers/admin-catalog.controller.ts:175` |
| GET /admin/catalog/scans | data_catalog | handler sin operación en openapi.json | `src/modules/data_catalog/controllers/admin-catalog.controller.ts:250` |
| POST /admin/catalog/scans | data_catalog | handler sin operación en openapi.json | `src/modules/data_catalog/controllers/admin-catalog.controller.ts:269` |
| GET /admin/catalog/scans/{id} | data_catalog | handler sin operación en openapi.json | `src/modules/data_catalog/controllers/admin-catalog.controller.ts:261` |
| GET /admin/catalog/schemas | data_catalog | handler sin operación en openapi.json | `src/modules/data_catalog/controllers/admin-catalog.controller.ts:79` |
| GET /admin/portal/catalogo/deriva | data_catalog | handler sin operación en openapi.json | `src/modules/data_catalog/controllers/admin-portal.controller.ts:168` |
| GET /admin/portal/catalogo/tablas | data_catalog | handler sin operación en openapi.json | `src/modules/data_catalog/controllers/admin-portal.controller.ts:153` |
| GET /admin/portal/catalogo/tablas/{schema}/{tabla} | data_catalog | handler sin operación en openapi.json | `src/modules/data_catalog/controllers/admin-portal.controller.ts:160` |
| GET /admin/portal/flujos | data_catalog | handler sin operación en openapi.json | `src/modules/data_catalog/controllers/admin-portal.controller.ts:126` |
| GET /admin/portal/flujos/{codigo} | data_catalog | handler sin operación en openapi.json | `src/modules/data_catalog/controllers/admin-portal.controller.ts:133` |
| GET /admin/portal/flujos/{codigo}/grafo | data_catalog | handler sin operación en openapi.json | `src/modules/data_catalog/controllers/admin-portal.controller.ts:145` |
| GET /admin/portal/flujos/hallazgos | data_catalog | handler sin operación en openapi.json | `src/modules/data_catalog/controllers/admin-portal.controller.ts:108` |
| GET /admin/portal/flujos/hallazgos/{id} | data_catalog | handler sin operación en openapi.json | `src/modules/data_catalog/controllers/admin-portal.controller.ts:115` |
| GET /admin/portal/flujos/mapa | data_catalog | handler sin operación en openapi.json | `src/modules/data_catalog/controllers/admin-portal.controller.ts:101` |
| GET /admin/portal/glosario | data_catalog | handler sin operación en openapi.json | `src/modules/data_catalog/controllers/admin-portal.controller.ts:192` |
| GET /admin/portal/linaje | data_catalog | handler sin operación en openapi.json | `src/modules/data_catalog/controllers/admin-portal.controller.ts:177` |
| GET /admin/portal/linaje/tablas/{schema}/{tabla} | data_catalog | handler sin operación en openapi.json | `src/modules/data_catalog/controllers/admin-portal.controller.ts:184` |
| GET /admin/portal/operaciones | data_catalog | handler sin operación en openapi.json | `src/modules/data_catalog/controllers/admin-portal.controller.ts:70` |
| GET /admin/portal/operaciones/{id} | data_catalog | handler sin operación en openapi.json | `src/modules/data_catalog/controllers/admin-portal.controller.ts:77` |
| GET /admin/portal/operaciones/{id}/arbol | data_catalog | handler sin operación en openapi.json | `src/modules/data_catalog/controllers/admin-portal.controller.ts:90` |
| GET /admin/portal/version | data_catalog | handler sin operación en openapi.json | `src/modules/data_catalog/controllers/admin-portal.controller.ts:63` |
| PUT /admin/tenants/{tenantId}/public-profile | directory | handler sin operación en openapi.json | `src/modules/directory/controllers/admin-tenants.controller.ts:148` |
| DESCONOCIDO /iam/auth | iam | handler sin operación en openapi.json | `src/modules/iam/controllers/iam-auth.controller.ts:311` |
| GET /insurance-carrier-catalog | insurance | handler sin operación en openapi.json | `src/modules/insurance/controllers/insurance-catalog.controller.ts:37` |
| GET /public/medications | pharmacy | handler sin operación en openapi.json | `src/modules/pharmacy/controllers/pharmacy-public.controller.ts:64` |
| GET /public/medications/{conceptId}/availability | pharmacy | handler sin operación en openapi.json | `src/modules/pharmacy/controllers/pharmacy-public.controller.ts:119` |
| POST /pharmacy/orders/{id}/accept-substitutions | pharmacy_inventory | handler sin operación en openapi.json | `src/modules/pharmacy_inventory/controllers/pharmacy-orders.controller.ts:192` |
| POST /pharmacy/orders/{id}/dispense | pharmacy_inventory | handler sin operación en openapi.json | `src/modules/pharmacy_inventory/controllers/pharmacy-orders.controller.ts:268` |
| POST /pharmacy/orders/{id}/prefer-original | pharmacy_inventory | handler sin operación en openapi.json | `src/modules/pharmacy_inventory/controllers/pharmacy-orders.controller.ts:211` |
| DELETE /profiles/patients/me/photo | profiles | handler sin operación en openapi.json | `src/modules/profiles/controllers/profiles-patients.controller.ts:171` |
| PUT /profiles/patients/me/photo | profiles | handler sin operación en openapi.json | `src/modules/profiles/controllers/profiles-patients.controller.ts:154` |
| POST /profiles/practitioners/{profileId}/affiliations | profiles | handler sin operación en openapi.json | `src/modules/profiles/controllers/profiles-practitioners.controller.ts:402` |
| POST /profiles/practitioners/me/credentials | profiles | handler sin operación en openapi.json | `src/modules/profiles/controllers/profiles-practitioners.controller.ts:378` |
| DESCONOCIDO /redis-runtime | redis_runtime | handler sin operación en openapi.json | `src/modules/redis_runtime/controllers/redis-runtime.controller.ts:44` |
| GET /scheduling/activity-types | scheduling | handler sin operación en openapi.json | `src/modules/scheduling/controllers/scheduling.controller.ts:406` |
| GET /scheduling/bookings/{id}/payment-state | scheduling | handler sin operación en openapi.json | `src/modules/scheduling/controllers/scheduling-bookings.controller.ts:256` |
| PUT /scheduling/bookings/{id}/payment-state | scheduling | handler sin operación en openapi.json | `src/modules/scheduling/controllers/scheduling-bookings.controller.ts:234` |
| GET /scheduling/exception-types | scheduling | handler sin operación en openapi.json | `src/modules/scheduling/controllers/scheduling.controller.ts:428` |
| PATCH /scheduling/exceptions/{id} | scheduling | handler sin operación en openapi.json | `src/modules/scheduling/controllers/scheduling.controller.ts:467` |
| POST /scheduling/resources/{id}/close-slots | scheduling | handler sin operación en openapi.json | `src/modules/scheduling/controllers/scheduling.controller.ts:352` |
| POST /scheduling/resources/{id}/shift-slots | scheduling | handler sin operación en openapi.json | `src/modules/scheduling/controllers/scheduling.controller.ts:379` |
| DELETE /scheduling/templates/{id} | scheduling | handler sin operación en openapi.json | `src/modules/scheduling/controllers/scheduling.controller.ts:261` |
| POST /scheduling/templates/{id}/reactivate | scheduling | handler sin operación en openapi.json | `src/modules/scheduling/controllers/scheduling.controller.ts:235` |
| DESCONOCIDO /search | search_platform | handler sin operación en openapi.json | `src/modules/search_platform/controllers/search-platform.controller.ts:102` |
| GET /terminology/concepts/glossary-graph | terminology | handler sin operación en openapi.json | `src/modules/terminology/controllers/terminology-concepts.controller.ts:202` |

## FLU-09

**Máquinas de estado sin ninguna operación que las ejerza** — severidad BAJA — 0 caso(s).

**Qué hacer:** Revisar si la máquina se usa desde un worker o si es código muerto.

_Ninguno._

## FLU-10

**Operaciones que pueden terminar en un 500 por una excepción sin tipar** — severidad BAJA — 35 caso(s).

**Qué hacer:** Cambiar el `new Error(...)` por una excepción del proyecto con estado y código estables (regla 96.4.4). El cliente hoy recibe INTERNAL sin poder distinguir la causa.

| Dónde | Módulo | Detalle | Fuente |
|---|---|---|---|
| GET /health/data-sources | app | DataSourceConfigurationError: No hay ninguna conexión registrada como «{name}». Registradas: {known}. (src/persistence/registry/connection.registry.ts:59) \| DataSourceConfigurationError: No hay ninguna conexión registrada como «{name}». Registradas: {known}. (src/persistence/registry/connection.registry.ts:59) | `src/persistence/health/data-sources.controller.ts:25` |
| GET /readiness | app | Error: MongoDB no confirmó el ping (src/modules/document_store/repositories/mongo-connection.provider.ts:60) \| Error: Redis no respondió PONG (src/modules/redis_runtime/services/redis-runtime.service.ts:61) \| Error: OpenSearch está en estado red (src/modules/search_platform/services/search-index.service.ts:174) | `src/app.controller.ts:63` |
| GET /audio-assets/{assetId}/content | audio_assets | Error: FILE_STORAGE_S3_BUCKET es obligatorio para FILE_STORAGE_ADAPTER=s3 (src/common/storage/s3-file-storage.adapter.ts:114) \| Error: S3 object body is empty (src/common/storage/s3-file-storage.adapter.ts:77) | `src/modules/audio_assets/controllers/audio-assets.controller.ts:39` |
| POST /audio-assets/resolve | audio_assets | Error: No se pudo materializar el asset de audio idempotente (src/modules/audio_assets/repositories/audio-assets.repository.ts:112) \| Error: Asset reutilizado no encontrado (src/modules/audio_assets/repositories/audio-assets.repository.ts:136) \| Error: No se pudo materializar el asset de audio idempotente (src/modules/audio_assets/repositories/audio-assets.repository.ts:112) | `src/modules/audio_assets/controllers/audio-assets.controller.ts:28` |
| POST /internal/audio-assets/{assetId}/prepare-generation | audio_assets | Error: Payload cifrado de audio inválido (src/modules/audio_assets/infrastructure/audio-value-cipher.service.ts:38) | `src/modules/audio_assets/controllers/audio-assets-internal.controller.ts:75` |
| POST /internal/audio-assets/garbage-collect | audio_assets | Error: FILE_STORAGE_S3_BUCKET es obligatorio para FILE_STORAGE_ADAPTER=s3 (src/common/storage/s3-file-storage.adapter.ts:114) | `src/modules/audio_assets/controllers/audio-assets-internal.controller.ts:58` |
| POST /internal/audio-assets/pregenerate | audio_assets | Error: La plantilla enumerada excede {MAX_ENUMERATED_COMBINATIONS} combinaciones (src/modules/audio_assets/application/pregenerate-audio-assets.use-case.ts:89) \| Error: No se pudo materializar el asset de audio idempotente (src/modules/audio_assets/repositories/audio-assets.repository.ts:112) \| Error: Asset reutilizado no encontrado (src/modules/audio_assets/repositories/audio-assets.repository.ts:136) | `src/modules/audio_assets/controllers/audio-assets-internal.controller.ts:41` |
| POST /internal/audio-assets/verify | audio_assets | Error: FILE_STORAGE_S3_BUCKET es obligatorio para FILE_STORAGE_ADAPTER=s3 (src/common/storage/s3-file-storage.adapter.ts:114) \| Error: FILE_STORAGE_S3_BUCKET es obligatorio para FILE_STORAGE_ADAPTER=s3 (src/common/storage/s3-file-storage.adapter.ts:114) \| Error: S3 object body is empty (src/common/storage/s3-file-storage.adapter.ts:77) | `src/modules/audio_assets/controllers/audio-assets-internal.controller.ts:52` |
| POST /clinical/conditions | clinical | Error: Entidad de historial no registrada: {entity} (src/modules/audit/repositories/history.repository.ts:161) | `src/modules/clinical/controllers/clinical-records.controller.ts:67` |
| POST /clinical/conditions/{id}/change-status | clinical | Error: Entidad de historial no registrada: {entity} (src/modules/audit/repositories/history.repository.ts:161) | `src/modules/clinical/controllers/clinical-records.controller.ts:78` |
| POST /clinical/medication-requests/{id}/invalidate | clinical | Error: Entidad de historial no registrada: {entity} (src/modules/audit/repositories/history.repository.ts:161) | `src/modules/clinical/controllers/clinical-records.controller.ts:158` |
| POST /clinical/medication-requests/{id}/issue | clinical | Error: Entidad de historial no registrada: {entity} (src/modules/audit/repositories/history.repository.ts:161) | `src/modules/clinical/controllers/clinical-records.controller.ts:146` |
| POST /clinical/medication-requests/{id}/replace | clinical | Error: Entidad de historial no registrada: {entity} (src/modules/audit/repositories/history.repository.ts:161) | `src/modules/clinical/controllers/clinical-records.controller.ts:170` |
| POST /cds/evaluate | clinical_ext | UnparseableCdsRuleError: logic_json no es un objeto (src/modules/clinical_ext/services/cds.service.ts:382) \| UnparseableCdsRuleError: op 'in' exige un array en value (src/modules/clinical_ext/services/cds.service.ts:431) \| UnparseableCdsRuleError: op '{op}' exige un número en value (src/modules/clinical_ext/services/cds.service.ts:443) | `src/modules/clinical_ext/controllers/cds.controller.ts:78` |
| GET /common/files/{id}/content | common | Error: FILE_STORAGE_S3_BUCKET es obligatorio para FILE_STORAGE_ADAPTER=s3 (src/common/storage/s3-file-storage.adapter.ts:114) \| Error: S3 object body is empty (src/common/storage/s3-file-storage.adapter.ts:77) | `src/modules/common/controllers/common-files.controller.ts:115` |
| POST /common/files/upload | common | Error: FILE_STORAGE_S3_BUCKET es obligatorio para FILE_STORAGE_ADAPTER=s3 (src/common/storage/s3-file-storage.adapter.ts:114) | `src/modules/common/controllers/common-files.controller.ts:70` |
| GET /internal/community/search/health | community | Error: OpenSearch está en estado red (src/modules/search_platform/services/search-index.service.ts:174) | `src/modules/community/controllers/community-search-index.controller.ts:72` |
| GET /public/media/{id} | community | Error: FILE_STORAGE_S3_BUCKET es obligatorio para FILE_STORAGE_ADAPTER=s3 (src/common/storage/s3-file-storage.adapter.ts:114) \| Error: S3 object body is empty (src/common/storage/s3-file-storage.adapter.ts:77) | `src/modules/community/controllers/community-public.controller.ts:379` |
| POST /admin/content-packs/{code}/apply | content_packs | Error: El catálogo del glosario declara el slug "{term.slug}" más de una vez (src/common/seed/glossary-seed.service.ts:244) \| Error: El directorio declara el código "{facility.code}" más de una vez (src/common/seed/bolivia-facilities-seed.service.ts:184) \| Error: El catálogo geográfico declara la sigla "{department.code}" más de una vez (src/common/seed/bo-geography-seed.service.ts:274) | `src/modules/content_packs/content-packs.controller.ts:69` |
| POST /admin/catalog/annotations/{id}/review | data_catalog | DomainException: {403} (src/modules/data_catalog/services/catalog-governance.service.ts:182) \| DomainException: {422} (src/modules/data_catalog/services/catalog-governance.service.ts:188) | `src/modules/data_catalog/controllers/admin-catalog.controller.ts:211` |
| PUT /admin/catalog/objects/{id}/annotation | data_catalog | DomainException: {422} (src/modules/data_catalog/services/catalog-governance.service.ts:77) | `src/modules/data_catalog/controllers/admin-catalog.controller.ts:187` |
| POST /procedure-cases/{id}/diagnoses | procedures_perioperative | Error: Entidad de historial no registrada: {entity} (src/modules/audit/repositories/history.repository.ts:161) | `src/modules/procedures_perioperative/controllers/periop.controller.ts:185` |
| POST /scheduling/appointments/direct | scheduling | Error: Entidad de historial no registrada: {entity} (src/modules/audit/repositories/history.repository.ts:161) | `src/modules/scheduling/controllers/scheduling.controller.ts:515` |
| POST /scheduling/bookings/{id}/accept | scheduling | Error: Entidad de historial no registrada: {entity} (src/modules/audit/repositories/history.repository.ts:161) \| Error: Entidad de historial no registrada: {entity} (src/modules/audit/repositories/history.repository.ts:161) | `src/modules/scheduling/controllers/scheduling-bookings.controller.ts:144` |
| POST /scheduling/bookings/{id}/cancel | scheduling | Error: Entidad de historial no registrada: {entity} (src/modules/audit/repositories/history.repository.ts:161) | `src/modules/scheduling/controllers/scheduling-bookings.controller.ts:327` |
| POST /scheduling/bookings/{id}/check-in | scheduling | Error: Entidad de historial no registrada: {entity} (src/modules/audit/repositories/history.repository.ts:161) | `src/modules/scheduling/controllers/scheduling-bookings.controller.ts:344` |
| POST /scheduling/bookings/{id}/complete | scheduling | Error: Entidad de historial no registrada: {entity} (src/modules/audit/repositories/history.repository.ts:161) | `src/modules/scheduling/controllers/scheduling-bookings.controller.ts:295` |
| POST /scheduling/bookings/{id}/delay | scheduling | Error: Entidad de historial no registrada: {entity} (src/modules/audit/repositories/history.repository.ts:161) | `src/modules/scheduling/controllers/scheduling-bookings.controller.ts:362` |
| PUT /scheduling/bookings/{id}/payment-state | scheduling | Error: Entidad de historial no registrada: {entity} (src/modules/audit/repositories/history.repository.ts:161) | `src/modules/scheduling/controllers/scheduling-bookings.controller.ts:234` |
| POST /scheduling/bookings/{id}/propose-schedule | scheduling | Error: Entidad de historial no registrada: {entity} (src/modules/audit/repositories/history.repository.ts:161) | `src/modules/scheduling/controllers/scheduling-bookings.controller.ts:190` |
| POST /scheduling/bookings/{id}/reject | scheduling | Error: Entidad de historial no registrada: {entity} (src/modules/audit/repositories/history.repository.ts:161) | `src/modules/scheduling/controllers/scheduling-bookings.controller.ts:206` |
| POST /scheduling/bookings/{id}/request-info | scheduling | Error: Entidad de historial no registrada: {entity} (src/modules/audit/repositories/history.repository.ts:161) | `src/modules/scheduling/controllers/scheduling-bookings.controller.ts:167` |
| POST /scheduling/bookings/{id}/reschedule | scheduling | Error: Entidad de historial no registrada: {entity} (src/modules/audit/repositories/history.repository.ts:161) | `src/modules/scheduling/controllers/scheduling-bookings.controller.ts:311` |
| POST /scheduling/bookings/{id}/start | scheduling | Error: Entidad de historial no registrada: {entity} (src/modules/audit/repositories/history.repository.ts:161) | `src/modules/scheduling/controllers/scheduling-bookings.controller.ts:276` |
| POST /scheduling/resources/{id}/delay | scheduling | Error: Entidad de historial no registrada: {entity} (src/modules/audit/repositories/history.repository.ts:161) | `src/modules/scheduling/controllers/scheduling.controller.ts:633` |

