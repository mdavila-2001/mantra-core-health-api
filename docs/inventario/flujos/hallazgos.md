<!-- AUTOGENERADO por tools/inventario/flujos.mjs. No editar manualmente. -->

# Hallazgos de flujos

Cada hallazgo sale de cruzar los datos del inventario. Ninguno corrige código: dicen qué hay y qué hacer.

| ID | Severidad | Hallazgo | Cuenta |
|---|---|---|---|
| [FLU-01](#flu-01) | ALTA | Operaciones sin proceso asignado | 0 |
| [FLU-02](#flu-02) | ALTA | Escritura autenticada sin @Roles en el controlador | 143 |
| [FLU-03](#flu-03) | ALTA | Ruta pública que escribe en la base | 17 |
| [FLU-04](#flu-04) | MEDIA | Operación de riesgo ALTO sin ninguna prueba de integración | 125 |
| [FLU-05](#flu-05) | MEDIA | Proceso con operaciones de riesgo ALTO y ninguna prueba de integración | 13 |
| [FLU-06](#flu-06) | ALTA | Operaciones que el frontend llama y la API no tiene | 4 |
| [FLU-07](#flu-07) | INFO | Operaciones de la API que ningún cliente del frontend llama | 1030 |
| [FLU-08](#flu-08) | MEDIA | Operaciones que existen en el código y el contrato OpenAPI no publica | 16 |
| [FLU-09](#flu-09) | BAJA | Máquinas de estado sin ninguna operación que las ejerza | 0 |
| [FLU-10](#flu-10) | BAJA | Operaciones que pueden terminar en un 500 por una excepción sin tipar | 81 |

## FLU-01

**Operaciones sin proceso asignado** — severidad ALTA — 0 caso(s).

**Qué hacer:** Asignarlas a un caso de uso en el README del módulo. Con cero filas no hay nada que hacer.

_Ninguno._

## FLU-02

**Escritura autenticada sin @Roles en el controlador** — severidad ALTA — 143 caso(s).

**Qué hacer:** Confirmar que la regla de acceso vive en el servicio o declarar los roles en el controlador. Hoy la API no las distingue de una sesión cualquiera.

| Dónde | Módulo | Detalle | Fuente |
|---|---|---|---|
| GET /audio-assets/{assetId}/content | audio_assets | escribe y el controlador no declara roles | `src/modules/audio_assets/controllers/audio-assets.controller.ts:39` |
| POST /audio-assets/resolve | audio_assets | escribe y el controlador no declara roles | `src/modules/audio_assets/controllers/audio-assets.controller.ts:28` |
| POST /billing/simulated/charges/{chargeId}/invoices | billing | escribe y el controlador no declara roles | `src/modules/billing/controllers/billing-simulated.controller.ts:101` |
| POST /billing/simulated/charges/{chargeId}/payment | billing | escribe y el controlador no declara roles | `src/modules/billing/controllers/billing-simulated.controller.ts:61` |
| POST /billing/simulated/invoices/{invoiceId}/annulment | billing | escribe y el controlador no declara roles | `src/modules/billing/controllers/billing-simulated.controller.ts:130` |
| POST /billing/simulated/invoices/{invoiceId}/annulment-reversal | billing | escribe y el controlador no declara roles | `src/modules/billing/controllers/billing-simulated.controller.ts:146` |
| POST /billing/simulated/invoices/{invoiceId}/email | billing | escribe y el controlador no declara roles | `src/modules/billing/controllers/billing-simulated.controller.ts:161` |
| GET /charts/me/documents | chart | escribe y el controlador no declara roles | `src/modules/chart/controllers/chart-me.controller.ts:68` |
| GET /charts/me/documents/{documentId}/files/{fileId}/content | chart | escribe y el controlador no declara roles | `src/modules/chart/controllers/chart-me.controller.ts:87` |
| GET /charts/me/notes | chart | escribe y el controlador no declara roles | `src/modules/chart/controllers/chart-me.controller.ts:53` |
| PUT /clinical/me/medical-aspects | clinical | escribe y el controlador no declara roles | `src/modules/clinical/controllers/clinical-medical-aspects.controller.ts:53` |
| PATCH /care-gaps/{id}/close | clinical_ext | escribe y el controlador no declara roles | `src/modules/clinical_ext/controllers/care-gaps.controller.ts:62` |
| POST /care-gaps/recompute | clinical_ext | escribe y el controlador no declara roles | `src/modules/clinical_ext/controllers/care-gaps.controller.ts:46` |
| POST /order-sets/{id}/apply | clinical_ext | escribe y el controlador no declara roles | `src/modules/clinical_ext/controllers/order-sets.controller.ts:60` |
| POST /patients/{id}/immunization-plan/project | clinical_ext | escribe y el controlador no declara roles | `src/modules/clinical_ext/controllers/care-gaps.controller.ts:79` |
| POST /prescription-favorites | clinical_ext | escribe y el controlador no declara roles | `src/modules/clinical_ext/controllers/prescription-favorites.controller.ts:57` |
| DELETE /prescription-favorites/{id} | clinical_ext | escribe y el controlador no declara roles | `src/modules/clinical_ext/controllers/prescription-favorites.controller.ts:73` |
| POST /common/addresses | common | escribe y el controlador no declara roles | `src/modules/common/controllers/common-addresses.controller.ts:21` |
| POST /common/contact-points | common | escribe y el controlador no declara roles | `src/modules/common/controllers/common-contact-points.controller.ts:33` |
| POST /common/contact-points/{id}/verify | common | escribe y el controlador no declara roles | `src/modules/common/controllers/common-contact-points.controller.ts:44` |
| POST /common/files | common | escribe y el controlador no declara roles | `src/modules/common/controllers/common-files.controller.ts:144` |
| DELETE /common/files/{id} | common | escribe y el controlador no declara roles | `src/modules/common/controllers/common-files.controller.ts:194` |
| POST /common/files/{id}/links | common | escribe y el controlador no declara roles | `src/modules/common/controllers/common-files.controller.ts:182` |
| POST /common/files/{id}/versions | common | escribe y el controlador no declara roles | `src/modules/common/controllers/common-files.controller.ts:157` |
| POST /common/files/{id}/versions/{vid}/derivatives | common | escribe y el controlador no declara roles | `src/modules/common/controllers/common-files.controller.ts:169` |
| POST /common/files/upload | common | escribe y el controlador no declara roles | `src/modules/common/controllers/common-files.controller.ts:71` |
| POST /common/identifiers | common | escribe y el controlador no declara roles | `src/modules/common/controllers/common-identifiers.controller.ts:21` |
| DELETE /community/blocks | community | escribe y el controlador no declara roles | `src/modules/community/controllers/community-social.controller.ts:253` |
| POST /community/blocks | community | escribe y el controlador no declara roles | `src/modules/community/controllers/community-social.controller.ts:213` |
| DELETE /community/bookmarks | community | escribe y el controlador no declara roles | `src/modules/community/controllers/community-social.controller.ts:242` |
| POST /community/bookmarks | community | escribe y el controlador no declara roles | `src/modules/community/controllers/community-social.controller.ts:191` |
| POST /community/comments | community | escribe y el controlador no declara roles | `src/modules/community/controllers/community-social.controller.ts:167` |
| POST /community/conversations | community | escribe y el controlador no declara roles | `src/modules/community/controllers/community-messaging.controller.ts:68` |
| POST /community/conversations/{conversationId}/messages | community | escribe y el controlador no declara roles | `src/modules/community/controllers/community-messaging.controller.ts:79` |
| DELETE /community/conversations/{conversationId}/messages/{messageId} | community | escribe y el controlador no declara roles | `src/modules/community/controllers/community-messaging.controller.ts:104` |
| PATCH /community/conversations/{conversationId}/messages/{messageId} | community | escribe y el controlador no declara roles | `src/modules/community/controllers/community-messaging.controller.ts:91` |
| DELETE /community/conversations/{conversationId}/pin | community | escribe y el controlador no declara roles | `src/modules/community/controllers/community-messaging.controller.ts:160` |
| POST /community/conversations/{conversationId}/pin | community | escribe y el controlador no declara roles | `src/modules/community/controllers/community-messaging.controller.ts:148` |
| POST /community/conversations/{conversationId}/read | community | escribe y el controlador no declara roles | `src/modules/community/controllers/community-messaging.controller.ts:122` |
| DELETE /community/follows | community | escribe y el controlador no declara roles | `src/modules/community/controllers/community-social.controller.ts:231` |
| POST /community/follows | community | escribe y el controlador no declara roles | `src/modules/community/controllers/community-social.controller.ts:202` |
| POST /community/groups | community | escribe y el controlador no declara roles | `src/modules/community/controllers/community-groups.controller.ts:77` |
| POST /community/groups/{groupId}/members | community | escribe y el controlador no declara roles | `src/modules/community/controllers/community-groups.controller.ts:88` |
| DELETE /community/groups/{groupId}/members/{member} | community | escribe y el controlador no declara roles | `src/modules/community/controllers/community-groups.controller.ts:127` |
| PATCH /community/groups/{groupId}/members/{member} | community | escribe y el controlador no declara roles | `src/modules/community/controllers/community-groups.controller.ts:100` |
| POST /community/groups/{groupId}/posts | community | escribe y el controlador no declara roles | `src/modules/community/controllers/community-groups.controller.ts:143` |
| POST /community/moderation/decisions/{decisionId}/appeal | community | escribe y el controlador no declara roles | `src/modules/community/controllers/community-moderation.controller.ts:80` |
| POST /community/polls/{pollId}/votes | community | escribe y el controlador no declara roles | `src/modules/community/controllers/community-polls.controller.ts:52` |
| POST /community/posts/{postId}/polls | community | escribe y el controlador no declara roles | `src/modules/community/controllers/community-polls.controller.ts:40` |
| POST /community/profiles/{profileId}/posts | community | escribe y el controlador no declara roles | `src/modules/community/controllers/community-social.controller.ts:155` |
| POST /community/profiles/{profileId}/reviews | community | escribe y el controlador no declara roles | `src/modules/community/controllers/community-reviews.controller.ts:50` |
| POST /community/profiles/{profileId}/reviews/{reviewId}/responses | community | escribe y el controlador no declara roles | `src/modules/community/controllers/community-reviews.controller.ts:87` |
| PUT /community/profiles/me | community | escribe y el controlador no declara roles | `src/modules/community/controllers/community-social.controller.ts:120` |
| PUT /community/ratings | community | escribe y el controlador no declara roles | `src/modules/community/controllers/party-ratings.controller.ts:45` |
| PUT /community/reactions | community | escribe y el controlador no declara roles | `src/modules/community/controllers/community-social.controller.ts:178` |
| POST /community/reports | community | escribe y el controlador no declara roles | `src/modules/community/controllers/community-moderation.controller.ts:56` |
| POST /diagnostics/accessions | diagnostics | escribe y el controlador no declara roles | `src/modules/diagnostics/controllers/diagnostics-specimens.controller.ts:104` |
| POST /diagnostics/analyzer-runs | diagnostics | escribe y el controlador no declara roles | `src/modules/diagnostics/controllers/diagnostics-lab.controller.ts:91` |
| POST /diagnostics/analyzer-runs/{id}/messages | diagnostics | escribe y el controlador no declara roles | `src/modules/diagnostics/controllers/diagnostics-lab.controller.ts:109` |
| POST /diagnostics/containers/{id}/custody-events | diagnostics | escribe y el controlador no declara roles | `src/modules/diagnostics/controllers/diagnostics-specimens.controller.ts:156` |
| POST /diagnostics/results/{observationId}/verifications | diagnostics | escribe y el controlador no declara roles | `src/modules/diagnostics/controllers/diagnostics-lab.controller.ts:128` |
| POST /diagnostics/specimens | diagnostics | escribe y el controlador no declara roles | `src/modules/diagnostics/controllers/diagnostics-specimens.controller.ts:57` |
| POST /diagnostics/specimens/{id}/containers | diagnostics | escribe y el controlador no declara roles | `src/modules/diagnostics/controllers/diagnostics-specimens.controller.ts:137` |
| POST /diagnostics/specimens/{id}/rejection | diagnostics | escribe y el controlador no declara roles | `src/modules/diagnostics/controllers/diagnostics-specimens.controller.ts:120` |
| POST /diagnostics/work-orders | diagnostics | escribe y el controlador no declara roles | `src/modules/diagnostics/controllers/diagnostics-lab.controller.ts:75` |
| PATCH /tenants/{tenantId} | directory | escribe y el controlador no declara roles | `src/modules/directory/controllers/tenants.controller.ts:123` |
| POST /tenants/{tenantId}/branches | directory | escribe y el controlador no declara roles | `src/modules/directory/controllers/tenants.controller.ts:224` |
| PATCH /tenants/{tenantId}/branches/{branchId} | directory | escribe y el controlador no declara roles | `src/modules/directory/controllers/tenants.controller.ts:238` |
| PUT /tenants/{tenantId}/logo | directory | escribe y el controlador no declara roles | `src/modules/directory/controllers/organization-logo.controller.ts:32` |
| POST /tenants/{tenantId}/memberships | directory | escribe y el controlador no declara roles | `src/modules/directory/controllers/tenants.controller.ts:255` |
| POST /tenants/{tenantId}/memberships/{membershipId}/branch-assignments | directory | escribe y el controlador no declara roles | `src/modules/directory/controllers/tenants.controller.ts:267` |
| POST /tenants/{tenantId}/memberships/{membershipId}/offboard | directory | escribe y el controlador no declara roles | `src/modules/directory/controllers/tenants.controller.ts:316` |
| PATCH /tenants/{tenantId}/memberships/{membershipId}/role | directory | escribe y el controlador no declara roles | `src/modules/directory/controllers/tenants.controller.ts:298` |
| POST /tenants/{tenantId}/memberships/{membershipId}/transfer | directory | escribe y el controlador no declara roles | `src/modules/directory/controllers/tenants.controller.ts:285` |
| POST /iam/auth/change-password | iam | escribe y el controlador no declara roles | `src/modules/iam/presentation/controllers/iam-account-security.controller.ts:44` |
| POST /iam/auth/logout | iam | escribe y el controlador no declara roles | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:444` |
| POST /iam/auth/logout-all | iam | escribe y el controlador no declara roles | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:464` |
| POST /iam/me/sessions/{id}/revoke | iam | escribe y el controlador no declara roles | `src/modules/iam/presentation/controllers/iam-account-security.controller.ts:66` |
| POST /iam/users/{id}/devices | iam | escribe y el controlador no declara roles | `src/modules/iam/presentation/controllers/iam-users.controller.ts:318` |
| POST /iam/users/{id}/mfa-factors | iam | escribe y el controlador no declara roles | `src/modules/iam/presentation/controllers/iam-users.controller.ts:306` |
| POST /identity/me/identity-verification | identity_assurance | escribe y el controlador no declara roles | `src/modules/identity_assurance/controllers/identity-self-service.controller.ts:42` |
| POST /identity/me/practitioner/identity-verification | identity_assurance | escribe y el controlador no declara roles | `src/modules/identity_assurance/controllers/identity-self-service.controller.ts:60` |
| POST /identity/me/practitioner/license-verification | identity_assurance | escribe y el controlador no declara roles | `src/modules/identity_assurance/controllers/identity-self-service.controller.ts:78` |
| POST /identity/me/tenants/{tenantId}/verification | identity_assurance | escribe y el controlador no declara roles | `src/modules/identity_assurance/controllers/identity-self-service.controller.ts:94` |
| GET /['insurance/campaigns', 'insurance-campaigns'] | insurance | escribe y el controlador no declara roles | `src/modules/insurance/presentation/controllers/insurance-campaigns.controller.ts:71` |
| POST /['insurance/campaigns', 'insurance-campaigns'] | insurance | escribe y el controlador no declara roles | `src/modules/insurance/presentation/controllers/insurance-campaigns.controller.ts:60` |
| GET /['insurance/campaigns', 'insurance-campaigns']/{id} | insurance | escribe y el controlador no declara roles | `src/modules/insurance/presentation/controllers/insurance-campaigns.controller.ts:142` |
| PATCH /['insurance/campaigns', 'insurance-campaigns']/{id} | insurance | escribe y el controlador no declara roles | `src/modules/insurance/presentation/controllers/insurance-campaigns.controller.ts:167` |
| PATCH /['insurance/campaigns', 'insurance-campaigns']/{id}/status | insurance | escribe y el controlador no declara roles | `src/modules/insurance/presentation/controllers/insurance-campaigns.controller.ts:153` |
| GET /['insurance/campaigns', 'insurance-campaigns']/my-benefits | insurance | escribe y el controlador no declara roles | `src/modules/insurance/presentation/controllers/insurance-campaigns.controller.ts:102` |
| GET /['insurance/campaigns', 'insurance-campaigns']/patient/{patientProfileId} | insurance | escribe y el controlador no declara roles | `src/modules/insurance/presentation/controllers/insurance-campaigns.controller.ts:123` |
| PUT /insurance-carriers/{id}/contact-channels | insurance | escribe y el controlador no declara roles | `src/modules/insurance/presentation/controllers/insurance-backbone.controller.ts:88` |
| POST /insurance-plans/{planId}/benefits | insurance | escribe y el controlador no declara roles | `src/modules/insurance/presentation/controllers/insurance-backbone.controller.ts:149` |
| PUT /insurance-plans/{planId}/benefits/{benefitId} | insurance | escribe y el controlador no declara roles | `src/modules/insurance/presentation/controllers/insurance-backbone.controller.ts:161` |
| PUT /insurance-plans/{planId}/benefits/{benefitId}/rules | insurance | escribe y el controlador no declara roles | `src/modules/insurance/presentation/controllers/insurance-backbone.controller.ts:173` |
| PUT /insurance-plans/{planId}/premium | insurance | escribe y el controlador no declara roles | `src/modules/insurance/presentation/controllers/insurance-backbone.controller.ts:190` |
| POST /insurance-products/{productId}/plans | insurance | escribe y el controlador no declara roles | `src/modules/insurance/presentation/controllers/insurance-backbone.controller.ts:130` |
| POST /insurance/patients/conversation | insurance | escribe y el controlador no declara roles | `src/modules/insurance/presentation/controllers/insurer-patients.controller.ts:66` |
| POST /insurance/patients/search | insurance | escribe y el controlador no declara roles | `src/modules/insurance/presentation/controllers/insurer-patients.controller.ts:31` |
| GET /insurance/portability/certificates/{certificateId}/json | insurance | escribe y el controlador no declara roles | `src/modules/insurance/presentation/controllers/insurance-portability.controller.ts:117` |
| GET /insurance/portability/certificates/{certificateId}/pdf | insurance | escribe y el controlador no declara roles | `src/modules/insurance/presentation/controllers/insurance-portability.controller.ts:79` |
| POST /insurance/portability/export | insurance | escribe y el controlador no declara roles | `src/modules/insurance/presentation/controllers/insurance-portability.controller.ts:57` |
| POST /insurance/received-claims/{id}/decision | insurance | escribe y el controlador no declara roles | `src/modules/insurance/presentation/controllers/insurer-received-claims.controller.ts:95` |
| POST /practitioner-settlement-batches | insurance | escribe y el controlador no declara roles | `src/modules/insurance/presentation/controllers/practitioner-settlement-batches.controller.ts:44` |
| POST /integrations/messages:outbound | integrations | escribe y el controlador no declara roles | `src/modules/integrations/controllers/integrations-messages.controller.ts:52` |
| POST /pharma-labs/notices/{noticeId}/read | pharma_lab | escribe y el controlador no declara roles | `src/modules/pharma_lab/controllers/pharma-lab-notices.controller.ts:48` |
| GET /pharmacy/orders/{id} | pharmacy_inventory | escribe y el controlador no declara roles | `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-orders.controller.ts:129` |
| POST /profiles/patients/{profileId}/related-persons | profiles | escribe y el controlador no declara roles | `src/modules/profiles/presentation/controllers/profiles-patients.controller.ts:532` |
| PATCH /profiles/patients/me | profiles | escribe y el controlador no declara roles | `src/modules/profiles/presentation/controllers/profiles-patients.controller.ts:147` |
| POST /profiles/patients/me/dependent-requests | profiles | escribe y el controlador no declara roles | `src/modules/profiles/presentation/controllers/profiles-dependent-requests.controller.ts:73` |
| POST /profiles/patients/me/dependent-requests/{id}/accept | profiles | escribe y el controlador no declara roles | `src/modules/profiles/presentation/controllers/profiles-dependent-requests.controller.ts:159` |
| POST /profiles/patients/me/dependent-requests/{id}/reject | profiles | escribe y el controlador no declara roles | `src/modules/profiles/presentation/controllers/profiles-dependent-requests.controller.ts:186` |
| POST /profiles/patients/me/dependents | profiles | escribe y el controlador no declara roles | `src/modules/profiles/presentation/controllers/profiles-patients.controller.ts:250` |
| POST /profiles/practitioners/{profileId}/jurisdiction-authorizations | profiles | escribe y el controlador no declara roles | `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:335` |
| DELETE /profiles/practitioners/{profileId}/photo | profiles | escribe y el controlador no declara roles | `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:301` |
| PUT /profiles/practitioners/{profileId}/photo | profiles | escribe y el controlador no declara roles | `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:271` |
| POST /profiles/practitioners/{profileId}/specialties | profiles | escribe y el controlador no declara roles | `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:609` |
| PATCH /profiles/practitioners/me | profiles | escribe y el controlador no declara roles | `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:237` |
| POST /profiles/practitioners/me/affiliations | profiles | escribe y el controlador no declara roles | `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:420` |
| DELETE /profiles/practitioners/me/affiliations/{affiliationId} | profiles | escribe y el controlador no declara roles | `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:471` |
| PATCH /profiles/practitioners/me/affiliations/{affiliationId} | profiles | escribe y el controlador no declara roles | `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:445` |
| POST /profiles/practitioners/me/credentials | profiles | escribe y el controlador no declara roles | `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:498` |
| DELETE /profiles/practitioners/me/credentials/{credentialId} | profiles | escribe y el controlador no declara roles | `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:558` |
| PATCH /profiles/practitioners/me/credentials/{credentialId} | profiles | escribe y el controlador no declara roles | `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:521` |
| DELETE /profiles/practitioners/me/jurisdiction-authorizations/{licenseId} | profiles | escribe y el controlador no declara roles | `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:724` |
| PUT /profiles/practitioners/me/signature-assets | profiles | escribe y el controlador no declara roles | `src/modules/profiles/presentation/controllers/practitioner-signature-assets.controller.ts:34` |
| DELETE /profiles/practitioners/me/specialties/{specialtyId} | profiles | escribe y el controlador no declara roles | `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:681` |
| PATCH /profiles/practitioners/me/specialties/{specialtyId} | profiles | escribe y el controlador no declara roles | `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:655` |
| PATCH /profiles/practitioners/me/specialties/{specialtyId}/primary | profiles | escribe y el controlador no declara roles | `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:631` |
| POST /tenants/{tenantId}/practitioner-requests/{affiliationId}/approve | profiles | escribe y el controlador no declara roles | `src/modules/profiles/presentation/controllers/tenant-practitioner-requests.controller.ts:73` |
| POST /tenants/{tenantId}/practitioner-requests/{affiliationId}/reject | profiles | escribe y el controlador no declara roles | `src/modules/profiles/presentation/controllers/tenant-practitioner-requests.controller.ts:90` |
| POST /tenants/{tenantId}/practitioner-requests/{affiliationId}/revoke | profiles | escribe y el controlador no declara roles | `src/modules/profiles/presentation/controllers/tenant-practitioner-requests.controller.ts:118` |
| PUT /views/{frontendPageViewId}/preferences | read_models | escribe y el controlador no declara roles | `src/modules/read_models/controllers/frontend-views.controller.ts:92` |
| POST /surveys/me/invitations/{id}/responses | surveys | escribe y el controlador no declara roles | `src/modules/surveys/controllers/surveys-patient.controller.ts:61` |
| POST /telemetry/activity-events | telemetry | escribe y el controlador no declara roles | `src/modules/telemetry/controllers/telemetry-events.controller.ts:41` |
| POST /telemetry/client-contexts | telemetry | escribe y el controlador no declara roles | `src/modules/telemetry/controllers/telemetry-events.controller.ts:53` |
| POST /telemetry/conversion-events | telemetry | escribe y el controlador no declara roles | `src/modules/telemetry/controllers/telemetry-events.controller.ts:77` |
| POST /telemetry/disclosure-acceptances | telemetry | escribe y el controlador no declara roles | `src/modules/telemetry/controllers/telemetry-consent.controller.ts:41` |
| POST /telemetry/session-journeys/{id}/close | telemetry | escribe y el controlador no declara roles | `src/modules/telemetry/controllers/telemetry-events.controller.ts:87` |
| POST /telemetry/tracking-consents | telemetry | escribe y el controlador no declara roles | `src/modules/telemetry/controllers/telemetry-consent.controller.ts:54` |
| POST /telemetry/tracking-consents/{id}/withdraw | telemetry | escribe y el controlador no declara roles | `src/modules/telemetry/controllers/telemetry-consent.controller.ts:86` |
| POST /telemetry/web-vitals | telemetry | escribe y el controlador no declara roles | `src/modules/telemetry/controllers/telemetry-events.controller.ts:65` |
| POST /terminology/ConceptMap/$translate | terminology | escribe y el controlador no declara roles | `src/modules/terminology/controllers/terminology-fhir.controller.ts:87` |

## FLU-03

**Ruta pública que escribe en la base** — severidad ALTA — 17 caso(s).

**Qué hacer:** Verificar que la autenticación alternativa (firma, token de un solo uso) esté en el handler. Una ruta pública que escribe es la superficie más expuesta.

| Dónde | Módulo | Detalle | Fuente |
|---|---|---|---|
| POST /iam/auth/activate | iam | ACTUALIZA iam.account_activations, ACTUALIZA iam.authentication_credentials, CREA iam.security_events, ACTUALIZA iam.users | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:299` |
| POST /iam/auth/forgot-password | iam | ACTUALIZA iam.password_resets, CREA iam.password_resets, CREA iam.security_events, CREA messaging.notification_requests | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:351` |
| POST /iam/auth/login | iam | ACTUALIZA iam.account_lockouts, CREA iam.account_lockouts, ACTUALIZA iam.refresh_tokens, CREA iam.refresh_tokens, CREA iam.security_events, ACTUALIZA iam.sessions, CREA iam.sessions, ACTUALIZA iam.users | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:318` |
| POST /iam/auth/register-organization | iam | CREA common.addresses, ACTUALIZA common.files, CREA diagnostic_units.diagnostic_study_offerings, CREA diagnostic_units.diagnostic_unit_sites, CREA diagnostic_units.diagnostic_units, CREA directory.branches, CREA directory.tenant_affiliation_documents, CREA directory.tenant_legal_representatives, CREA directory.tenant_memberships, CREA directory.tenants, CREA iam.authentication_credentials, CREA iam.email_verifications, CREA iam.security_events, CREA iam.user_global_roles, CREA iam.users, CREA insurance.insurance_brokers, CREA insurance.insurance_carriers, CREA messaging.notification_requests, CREA pharmacy.pharmacies, CREA practice.practice_sites, CREA practice.practices | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:133` |
| POST /iam/auth/register-patient | iam | CREA common.contact_points, CREA common.identifiers, CREA directory.tenant_memberships, CREA iam.authentication_credentials, CREA iam.email_verifications, CREA iam.security_events, CREA iam.user_global_roles, CREA iam.users, CREA messaging.notification_requests, CREA profiles.patient_profiles, CREA profiles.person_account_links, CREA profiles.person_profiles, CREA profiles.persons | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:109` |
| POST /iam/auth/register-practitioner | iam | CREA authz.user_role_assignments, CREA common.addresses, CREA common.contact_points, CREA common.file_versions, CREA common.files, ACTUALIZA common.files, CREA common.identifiers, CREA directory.tenant_memberships, CREA iam.account_activations, CREA iam.authentication_credentials, CREA iam.email_verifications, CREA iam.security_events, CREA iam.user_global_roles, CREA iam.users, CREA messaging.notification_requests, CREA messaging.queued_jobs, ACTUALIZA messaging.queued_jobs, CREA practice.practice_sites, CREA practice.practices, CREA practice.practitioner_role_assignments, CREA profiles.health_practitioner_profiles, CREA profiles.jurisdiction_authorizations, CREA profiles.person_account_links, CREA profiles.person_profiles, CREA profiles.persons, CREA profiles.practitioner_languages, CREA profiles.practitioner_specialties, CREA profiles.professional_credentials | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:233` |
| POST /iam/auth/resend-verification | iam | CREA iam.email_verifications, CREA messaging.notification_requests | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:266` |
| POST /iam/auth/reset-password | iam | ACTUALIZA iam.authentication_credentials, ACTUALIZA iam.password_resets, ACTUALIZA iam.refresh_tokens, CREA iam.security_events, ACTUALIZA iam.sessions | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:372` |
| POST /iam/auth/token/refresh | iam | ACTUALIZA iam.refresh_tokens, CREA iam.refresh_tokens, CREA iam.security_events, ACTUALIZA iam.sessions | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:388` |
| POST /iam/auth/upload-registration-document | iam | CREA common.file_versions, CREA common.files, CREA messaging.queued_jobs, ACTUALIZA messaging.queued_jobs | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:198` |
| POST /iam/auth/upload-registration-signature-image | iam | CREA common.file_versions, CREA common.files, CREA messaging.queued_jobs, ACTUALIZA messaging.queued_jobs | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:153` |
| POST /iam/auth/verify-email | iam | ACTUALIZA iam.email_verifications, ACTUALIZA iam.users | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:283` |
| POST /integrations/webhooks/inbound | integrations | CREA integrations.inbound_messages | `src/modules/integrations/controllers/integrations-webhooks.controller.ts:23` |
| GET /r/{code} | marketing | CREA marketing.marketing_touchpoints, ACTUALIZA marketing.tracked_links | `src/modules/marketing/controllers/tracked-link-redirect.controller.ts:36` |
| POST /webhooks/providers/{providerCode}/receipts | messaging | CREA messaging.delivery_receipts, ACTUALIZA messaging.notification_deliveries, ACTUALIZA messaging.notification_requests | `src/modules/messaging/controllers/provider-webhooks.controller.ts:33` |
| POST /payments/callbacks/{callbackPath} | payments | ACTUALIZA payments.payment_intents, ACTUALIZA payments.payment_transactions, CREA payments.payment_webhook_events | `src/modules/payments/controllers/payments-operations.controller.ts:94` |
| POST /tracking/webhooks/carriers/{carrierCode} | tracking | ACTUALIZA tracking.shipments, ACTUALIZA tracking.trackable_subjects, CREA tracking.tracking_events | `src/modules/tracking/controllers/tracking.controller.ts:120` |

## FLU-04

**Operación de riesgo ALTO sin ninguna prueba de integración** — severidad MEDIA — 125 caso(s).

**Qué hacer:** Escribir la prueba de integración contra PostgreSQL real (regla 80.2.4). Las sin prueba alguna van primero.

| Dónde | Módulo | Detalle | Fuente |
|---|---|---|---|
| GET /audio-assets/{assetId}/content | audio_assets | ninguna prueba la menciona | `src/modules/audio_assets/controllers/audio-assets.controller.ts:39` |
| POST /audio-assets/resolve | audio_assets | ninguna prueba la menciona | `src/modules/audio_assets/controllers/audio-assets.controller.ts:28` |
| POST /audit/retention/apply | audit | sólo prueba de controlador | `src/modules/audit/controllers/audit.controller.ts:117` |
| PUT /auth-providers/identity-providers/{id}/attribute-mappings | auth_providers | sólo prueba de controlador | `src/modules/auth_providers/controllers/auth-providers.controller.ts:128` |
| POST /billing/simulated/charges/{chargeId}/invoices | billing | ninguna prueba la menciona | `src/modules/billing/controllers/billing-simulated.controller.ts:101` |
| POST /billing/simulated/charges/{chargeId}/payment | billing | ninguna prueba la menciona | `src/modules/billing/controllers/billing-simulated.controller.ts:61` |
| POST /billing/simulated/invoices/{invoiceId}/annulment | billing | ninguna prueba la menciona | `src/modules/billing/controllers/billing-simulated.controller.ts:130` |
| POST /billing/simulated/invoices/{invoiceId}/annulment-reversal | billing | ninguna prueba la menciona | `src/modules/billing/controllers/billing-simulated.controller.ts:146` |
| POST /billing/simulated/invoices/{invoiceId}/email | billing | ninguna prueba la menciona | `src/modules/billing/controllers/billing-simulated.controller.ts:161` |
| GET /charts/me/documents | chart | sólo prueba de controlador | `src/modules/chart/controllers/chart-me.controller.ts:68` |
| GET /charts/me/documents/{documentId}/files/{fileId}/content | chart | sólo prueba de controlador | `src/modules/chart/controllers/chart-me.controller.ts:87` |
| GET /charts/me/notes | chart | sólo prueba de controlador | `src/modules/chart/controllers/chart-me.controller.ts:53` |
| PUT /clinical/me/medical-aspects | clinical | ninguna prueba la menciona | `src/modules/clinical/controllers/clinical-medical-aspects.controller.ts:53` |
| PATCH /care-gaps/{id}/close | clinical_ext | sólo prueba de controlador | `src/modules/clinical_ext/controllers/care-gaps.controller.ts:62` |
| POST /care-gaps/recompute | clinical_ext | sólo prueba de controlador | `src/modules/clinical_ext/controllers/care-gaps.controller.ts:46` |
| POST /order-sets/{id}/apply | clinical_ext | sólo prueba de controlador | `src/modules/clinical_ext/controllers/order-sets.controller.ts:60` |
| POST /patients/{id}/immunization-plan/project | clinical_ext | sólo prueba de controlador | `src/modules/clinical_ext/controllers/care-gaps.controller.ts:79` |
| POST /prescription-favorites | clinical_ext | ninguna prueba la menciona | `src/modules/clinical_ext/controllers/prescription-favorites.controller.ts:57` |
| DELETE /prescription-favorites/{id} | clinical_ext | ninguna prueba la menciona | `src/modules/clinical_ext/controllers/prescription-favorites.controller.ts:73` |
| DELETE /community/blocks | community | sólo prueba de controlador | `src/modules/community/controllers/community-social.controller.ts:253` |
| DELETE /community/bookmarks | community | sólo prueba de controlador | `src/modules/community/controllers/community-social.controller.ts:242` |
| POST /community/bookmarks | community | sólo prueba de controlador | `src/modules/community/controllers/community-social.controller.ts:191` |
| DELETE /community/conversations/{conversationId}/messages/{messageId} | community | sólo prueba de controlador | `src/modules/community/controllers/community-messaging.controller.ts:104` |
| PATCH /community/conversations/{conversationId}/messages/{messageId} | community | sólo prueba de controlador | `src/modules/community/controllers/community-messaging.controller.ts:91` |
| DELETE /community/conversations/{conversationId}/pin | community | sólo prueba de controlador | `src/modules/community/controllers/community-messaging.controller.ts:160` |
| POST /community/conversations/{conversationId}/pin | community | sólo prueba de controlador | `src/modules/community/controllers/community-messaging.controller.ts:148` |
| DELETE /community/follows | community | sólo prueba de controlador | `src/modules/community/controllers/community-social.controller.ts:231` |
| POST /community/groups | community | sólo prueba de controlador | `src/modules/community/controllers/community-groups.controller.ts:77` |
| POST /community/groups/{groupId}/members | community | sólo prueba de controlador | `src/modules/community/controllers/community-groups.controller.ts:88` |
| DELETE /community/groups/{groupId}/members/{member} | community | sólo prueba de controlador | `src/modules/community/controllers/community-groups.controller.ts:127` |
| PATCH /community/groups/{groupId}/members/{member} | community | sólo prueba de controlador | `src/modules/community/controllers/community-groups.controller.ts:100` |
| POST /community/groups/{groupId}/posts | community | sólo prueba de controlador | `src/modules/community/controllers/community-groups.controller.ts:143` |
| POST /community/moderation/decisions/{decisionId}/appeal | community | sólo prueba de controlador | `src/modules/community/controllers/community-moderation.controller.ts:80` |
| POST /community/polls/{pollId}/votes | community | sólo prueba de controlador | `src/modules/community/controllers/community-polls.controller.ts:52` |
| POST /community/posts/{postId}/polls | community | sólo prueba de controlador | `src/modules/community/controllers/community-polls.controller.ts:40` |
| POST /community/profiles/{profileId}/reviews/{reviewId}/responses | community | sólo prueba de controlador | `src/modules/community/controllers/community-reviews.controller.ts:87` |
| PUT /community/ratings | community | ninguna prueba la menciona | `src/modules/community/controllers/party-ratings.controller.ts:45` |
| POST /community/reports | community | sólo prueba de controlador | `src/modules/community/controllers/community-moderation.controller.ts:56` |
| POST /admin/content-packs/{code}/apply | content_packs | ninguna prueba la menciona | `src/modules/content_packs/content-packs.controller.ts:69` |
| POST /delegated-permission-sets/{id}/versions | delegated_access | sólo prueba de controlador | `src/modules/delegated_access/controllers/delegated-permission-sets.controller.ts:81` |
| POST /diagnostics/analyzer-runs | diagnostics | sólo prueba de controlador | `src/modules/diagnostics/controllers/diagnostics-lab.controller.ts:91` |
| POST /diagnostics/analyzer-runs/{id}/messages | diagnostics | sólo prueba de controlador | `src/modules/diagnostics/controllers/diagnostics-lab.controller.ts:109` |
| POST /diagnostics/containers/{id}/custody-events | diagnostics | sólo prueba de controlador | `src/modules/diagnostics/controllers/diagnostics-specimens.controller.ts:156` |
| POST /diagnostics/results/{observationId}/verifications | diagnostics | sólo prueba de controlador | `src/modules/diagnostics/controllers/diagnostics-lab.controller.ts:128` |
| POST /diagnostics/specimens/{id}/rejection | diagnostics | sólo prueba de controlador | `src/modules/diagnostics/controllers/diagnostics-specimens.controller.ts:120` |
| POST /diagnostics/work-orders | diagnostics | sólo prueba de controlador | `src/modules/diagnostics/controllers/diagnostics-lab.controller.ts:75` |
| PATCH /tenants/{tenantId} | directory | ninguna prueba la menciona | `src/modules/directory/controllers/tenants.controller.ts:123` |
| POST /tenants/{tenantId}/branches | directory | sólo prueba de controlador | `src/modules/directory/controllers/tenants.controller.ts:224` |
| PATCH /tenants/{tenantId}/branches/{branchId} | directory | ninguna prueba la menciona | `src/modules/directory/controllers/tenants.controller.ts:238` |
| PUT /tenants/{tenantId}/logo | directory | ninguna prueba la menciona | `src/modules/directory/controllers/organization-logo.controller.ts:32` |
| POST /tenants/{tenantId}/memberships | directory | sólo prueba de controlador | `src/modules/directory/controllers/tenants.controller.ts:255` |
| POST /tenants/{tenantId}/memberships/{membershipId}/branch-assignments | directory | sólo prueba de controlador | `src/modules/directory/controllers/tenants.controller.ts:267` |
| POST /tenants/{tenantId}/memberships/{membershipId}/offboard | directory | sólo prueba de controlador | `src/modules/directory/controllers/tenants.controller.ts:316` |
| PATCH /tenants/{tenantId}/memberships/{membershipId}/role | directory | sólo prueba de controlador | `src/modules/directory/controllers/tenants.controller.ts:298` |
| POST /tenants/{tenantId}/memberships/{membershipId}/transfer | directory | sólo prueba de controlador | `src/modules/directory/controllers/tenants.controller.ts:285` |
| POST /graph/analytics/community-detection | graph_intelligence | ninguna prueba la menciona | `src/modules/graph_intelligence/controllers/graph-query.controller.ts:128` |
| POST /graph/deletion-jobs | graph_intelligence | ninguna prueba la menciona | `src/modules/graph_intelligence/controllers/graph-query.controller.ts:199` |
| POST /graph/edges/{id}/expire | graph_intelligence | ninguna prueba la menciona | `src/modules/graph_intelligence/controllers/graph-projection.controller.ts:126` |
| POST /graph/projections/reconcile | graph_intelligence | ninguna prueba la menciona | `src/modules/graph_intelligence/controllers/graph-projection.controller.ts:77` |
| POST /iam/auth/activate | iam | ninguna prueba la menciona | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:299` |
| POST /iam/auth/change-password | iam | ninguna prueba la menciona | `src/modules/iam/presentation/controllers/iam-account-security.controller.ts:44` |
| POST /iam/auth/forgot-password | iam | sólo prueba de controlador | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:351` |
| POST /iam/auth/resend-verification | iam | ninguna prueba la menciona | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:266` |
| POST /iam/auth/reset-password | iam | sólo prueba de controlador | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:372` |
| POST /iam/auth/verify-email | iam | sólo prueba de controlador | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:283` |
| POST /iam/me/sessions/{id}/revoke | iam | ninguna prueba la menciona | `src/modules/iam/presentation/controllers/iam-account-security.controller.ts:66` |
| POST /identity/me/practitioner/identity-verification | identity_assurance | ninguna prueba la menciona | `src/modules/identity_assurance/controllers/identity-self-service.controller.ts:60` |
| POST /identity/me/practitioner/license-verification | identity_assurance | ninguna prueba la menciona | `src/modules/identity_assurance/controllers/identity-self-service.controller.ts:78` |
| POST /identity/me/tenants/{tenantId}/verification | identity_assurance | ninguna prueba la menciona | `src/modules/identity_assurance/controllers/identity-self-service.controller.ts:94` |
| POST /internal/identity/evidence/lifecycle-scan | identity_assurance | ninguna prueba la menciona | `src/modules/identity_assurance/controllers/identity-worker.controller.ts:79` |
| GET /['insurance/campaigns', 'insurance-campaigns'] | insurance | ninguna prueba la menciona | `src/modules/insurance/presentation/controllers/insurance-campaigns.controller.ts:71` |
| POST /['insurance/campaigns', 'insurance-campaigns'] | insurance | ninguna prueba la menciona | `src/modules/insurance/presentation/controllers/insurance-campaigns.controller.ts:60` |
| GET /['insurance/campaigns', 'insurance-campaigns']/{id} | insurance | ninguna prueba la menciona | `src/modules/insurance/presentation/controllers/insurance-campaigns.controller.ts:142` |
| PATCH /['insurance/campaigns', 'insurance-campaigns']/{id} | insurance | ninguna prueba la menciona | `src/modules/insurance/presentation/controllers/insurance-campaigns.controller.ts:167` |
| PATCH /['insurance/campaigns', 'insurance-campaigns']/{id}/status | insurance | ninguna prueba la menciona | `src/modules/insurance/presentation/controllers/insurance-campaigns.controller.ts:153` |
| GET /['insurance/campaigns', 'insurance-campaigns']/my-benefits | insurance | ninguna prueba la menciona | `src/modules/insurance/presentation/controllers/insurance-campaigns.controller.ts:102` |
| GET /['insurance/campaigns', 'insurance-campaigns']/patient/{patientProfileId} | insurance | ninguna prueba la menciona | `src/modules/insurance/presentation/controllers/insurance-campaigns.controller.ts:123` |
| PUT /insurance-carriers/{id}/contact-channels | insurance | ninguna prueba la menciona | `src/modules/insurance/presentation/controllers/insurance-backbone.controller.ts:88` |
| PUT /insurance-plans/{planId}/premium | insurance | ninguna prueba la menciona | `src/modules/insurance/presentation/controllers/insurance-backbone.controller.ts:190` |
| GET /insurance/portability/certificates/{certificateId}/pdf | insurance | ninguna prueba la menciona | `src/modules/insurance/presentation/controllers/insurance-portability.controller.ts:79` |
| POST /insurance/received-claims/{id}/decision | insurance | sólo prueba de controlador | `src/modules/insurance/presentation/controllers/insurer-received-claims.controller.ts:95` |
| POST /practitioner-settlement-batches | insurance | ninguna prueba la menciona | `src/modules/insurance/presentation/controllers/practitioner-settlement-batches.controller.ts:44` |
| POST /integrations/messages:outbound | integrations | sólo prueba de controlador | `src/modules/integrations/controllers/integrations-messages.controller.ts:52` |
| POST /integrations/webhooks/inbound | integrations | ninguna prueba la menciona | `src/modules/integrations/controllers/integrations-webhooks.controller.ts:23` |
| POST /marketing/attribution/compute | marketing | sólo prueba de controlador | `src/modules/marketing/controllers/marketing.controller.ts:236` |
| GET /r/{code} | marketing | sólo prueba de controlador | `src/modules/marketing/controllers/tracked-link-redirect.controller.ts:36` |
| POST /webhooks/providers/{providerCode}/receipts | messaging | sólo prueba de controlador | `src/modules/messaging/controllers/provider-webhooks.controller.ts:33` |
| POST /pharma-labs/{pharmaLabId}/medical-visitors | pharma_lab | ninguna prueba la menciona | `src/modules/pharma_lab/controllers/medical-visitors.controller.ts:51` |
| PUT /pharma-labs/{pharmaLabId}/medical-visitors/{medicalVisitorId}/products | pharma_lab | ninguna prueba la menciona | `src/modules/pharma_lab/controllers/medical-visitors.controller.ts:89` |
| PUT /pharma-labs/{pharmaLabId}/medical-visitors/{medicalVisitorId}/specialties | pharma_lab | ninguna prueba la menciona | `src/modules/pharma_lab/controllers/medical-visitors.controller.ts:101` |
| POST /pharma-labs/{pharmaLabId}/medical-visitors/{medicalVisitorId}/unlink | pharma_lab | ninguna prueba la menciona | `src/modules/pharma_lab/controllers/medical-visitors.controller.ts:118` |
| POST /pharma-labs/notices/{noticeId}/read | pharma_lab | ninguna prueba la menciona | `src/modules/pharma_lab/controllers/pharma-lab-notices.controller.ts:48` |
| PUT /visit-agenda/me | pharma_lab | ninguna prueba la menciona | `src/modules/pharma_lab/controllers/visit-agenda.controller.ts:39` |
| POST /profiles/practitioners/{profileId}/jurisdiction-authorizations | profiles | sólo prueba de controlador | `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:335` |
| DELETE /profiles/practitioners/{profileId}/photo | profiles | sólo prueba de controlador | `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:301` |
| PUT /profiles/practitioners/{profileId}/photo | profiles | sólo prueba de controlador | `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:271` |
| POST /profiles/practitioners/{profileId}/specialties | profiles | sólo prueba de controlador | `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:609` |
| DELETE /profiles/practitioners/me/affiliations/{affiliationId} | profiles | ninguna prueba la menciona | `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:471` |
| PATCH /profiles/practitioners/me/affiliations/{affiliationId} | profiles | ninguna prueba la menciona | `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:445` |
| DELETE /profiles/practitioners/me/credentials/{credentialId} | profiles | ninguna prueba la menciona | `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:558` |
| DELETE /profiles/practitioners/me/jurisdiction-authorizations/{licenseId} | profiles | ninguna prueba la menciona | `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:724` |
| PUT /profiles/practitioners/me/signature-assets | profiles | sólo prueba de controlador | `src/modules/profiles/presentation/controllers/practitioner-signature-assets.controller.ts:34` |
| DELETE /profiles/practitioners/me/specialties/{specialtyId} | profiles | ninguna prueba la menciona | `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:681` |
| PATCH /profiles/practitioners/me/specialties/{specialtyId} | profiles | ninguna prueba la menciona | `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:655` |
| PATCH /profiles/practitioners/me/specialties/{specialtyId}/primary | profiles | sólo prueba de controlador | `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:631` |
| POST /tenants/{tenantId}/practitioner-requests/{affiliationId}/reject | profiles | ninguna prueba la menciona | `src/modules/profiles/presentation/controllers/tenant-practitioner-requests.controller.ts:90` |
| POST /tenants/{tenantId}/practitioner-requests/{affiliationId}/revoke | profiles | ninguna prueba la menciona | `src/modules/profiles/presentation/controllers/tenant-practitioner-requests.controller.ts:118` |
| PUT /views/{frontendPageViewId}/preferences | read_models | sólo prueba de controlador | `src/modules/read_models/controllers/frontend-views.controller.ts:92` |
| DELETE /scheduling/exceptions/{id} | scheduling | ninguna prueba la menciona | `src/modules/scheduling/presentation/controllers/scheduling.controller.ts:576` |
| PATCH /scheduling/templates/{id} | scheduling | sólo prueba de controlador | `src/modules/scheduling/presentation/controllers/scheduling.controller.ts:286` |
| POST /surveys/me/invitations/{id}/responses | surveys | ninguna prueba la menciona | `src/modules/surveys/controllers/surveys-patient.controller.ts:61` |
| DELETE /surveys/templates/{id}/questions/{questionId} | surveys | ninguna prueba la menciona | `src/modules/surveys/controllers/surveys-templates.controller.ts:139` |
| POST /internal/governance/retention-executions/run | system_ops | ninguna prueba la menciona | `src/modules/system_ops/controllers/retention-execution.controller.ts:23` |
| POST /telemetry/activity-events | telemetry | ninguna prueba la menciona | `src/modules/telemetry/controllers/telemetry-events.controller.ts:41` |
| POST /telemetry/client-contexts | telemetry | ninguna prueba la menciona | `src/modules/telemetry/controllers/telemetry-events.controller.ts:53` |
| POST /telemetry/conversion-events | telemetry | ninguna prueba la menciona | `src/modules/telemetry/controllers/telemetry-events.controller.ts:77` |
| POST /telemetry/disclosure-acceptances | telemetry | sólo prueba de controlador | `src/modules/telemetry/controllers/telemetry-consent.controller.ts:41` |
| POST /telemetry/session-journeys/{id}/close | telemetry | ninguna prueba la menciona | `src/modules/telemetry/controllers/telemetry-events.controller.ts:87` |
| POST /telemetry/tracking-consents | telemetry | sólo prueba de controlador | `src/modules/telemetry/controllers/telemetry-consent.controller.ts:54` |
| POST /telemetry/tracking-consents/{id}/withdraw | telemetry | sólo prueba de controlador | `src/modules/telemetry/controllers/telemetry-consent.controller.ts:86` |
| POST /telemetry/web-vitals | telemetry | ninguna prueba la menciona | `src/modules/telemetry/controllers/telemetry-events.controller.ts:65` |
| POST /terminology/ConceptMap/$translate | terminology | sólo prueba de controlador | `src/modules/terminology/controllers/terminology-fhir.controller.ts:87` |
| POST /terminology/ValueSet/{id}/$expand | terminology | sólo prueba de controlador | `src/modules/terminology/controllers/terminology-fhir.controller.ts:66` |
| POST /tracking/webhooks/carriers/{carrierCode} | tracking | sólo prueba de controlador | `src/modules/tracking/controllers/tracking.controller.ts:120` |
| POST /vector-rag/deletion-jobs | vector_rag | ninguna prueba la menciona | `src/modules/vector_rag/controllers/vector-runtime.controller.ts:162` |

## FLU-05

**Proceso con operaciones de riesgo ALTO y ninguna prueba de integración** — severidad MEDIA — 13 caso(s).

**Qué hacer:** Priorizar estos procesos al escribir pruebas: un fallo aquí rompe un flujo completo, no una operación.

| Dónde | Módulo | Detalle | Fuente |
|---|---|---|---|
| audio_assets | — | 2 operaciones de riesgo ALTO, 0 pruebas de integración en el proceso | `src/modules/audio_assets/README.md` |
| audit | — | 1 operaciones de riesgo ALTO, 0 pruebas de integración en el proceso | `src/modules/audit/README.md` |
| auth_providers | — | 1 operaciones de riesgo ALTO, 0 pruebas de integración en el proceso | `src/modules/auth_providers/README.md` |
| content_packs | — | 1 operaciones de riesgo ALTO, 0 pruebas de integración en el proceso | `src/modules/content_packs/README.md` |
| graph_intelligence | — | 4 operaciones de riesgo ALTO, 0 pruebas de integración en el proceso | `src/modules/graph_intelligence/README.md` |
| integrations | — | 2 operaciones de riesgo ALTO, 0 pruebas de integración en el proceso | `src/modules/integrations/README.md` |
| marketing | — | 2 operaciones de riesgo ALTO, 0 pruebas de integración en el proceso | `src/modules/marketing/README.md` |
| pharma_lab | — | 6 operaciones de riesgo ALTO, 0 pruebas de integración en el proceso | `src/modules/pharma_lab/README.md` |
| read_models | — | 1 operaciones de riesgo ALTO, 0 pruebas de integración en el proceso | `src/modules/read_models/README.md` |
| surveys | — | 2 operaciones de riesgo ALTO, 0 pruebas de integración en el proceso | `src/modules/surveys/README.md` |
| telemetry | — | 8 operaciones de riesgo ALTO, 0 pruebas de integración en el proceso | `src/modules/telemetry/README.md` |
| tracking | — | 1 operaciones de riesgo ALTO, 0 pruebas de integración en el proceso | `src/modules/tracking/README.md` |
| vector_rag | — | 1 operaciones de riesgo ALTO, 0 pruebas de integración en el proceso | `src/modules/vector_rag/README.md` |

## FLU-06

**Operaciones que el frontend llama y la API no tiene** — severidad ALTA — 4 caso(s).

**Qué hacer:** Cada fila es una pantalla que hoy falla (404) o depende de un mock. Decidir: implementar en la API, o retirar del cliente. No se corrige aquí.

| Dónde | Módulo | Detalle | Fuente |
|---|---|---|---|
| POST /accounting/journal-transactions/:transactionId/:action | — | cliente AccountingClient | `src/app/core/data-access/accounting/accounting.client.ts` |
| GET /community/conversations/:conversationId | — | cliente CommunityClient | `src/app/core/data-access/community/community.client.ts` |
| GET /public/profiles/f/:slug/branch-availability | — | cliente PublicCatalogClient | `src/app/core/data-access/public-catalog/public-catalog.client.ts` |
| POST /scheduling/bookings/:bookingId/:accion | — | cliente SchedulingClient | `src/app/core/data-access/scheduling/scheduling.client.ts` |

## FLU-07

**Operaciones de la API que ningún cliente del frontend llama** — severidad INFO — 1030 caso(s).

**Qué hacer:** Informativo: pueden ser internas (workers), de otros consumidores (móvil, integraciones) o deuda. Confirmar con el responsable antes de retirar nada.

| Dónde | Módulo | Detalle | Fuente |
|---|---|---|---|
| POST /accounting/accounts | accounting | ningún cliente del frontend la declara | — |
| POST /accounting/accrual-objects | accounting | ningún cliente del frontend la declara | — |
| POST /accounting/assets/capitalize | accounting | ningún cliente del frontend la declara | — |
| POST /accounting/exchange-rates | accounting | ningún cliente del frontend la declara | — |
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
| GET /accounting/practitioner/liabilities/{id}/schedule | accounting | ningún cliente del frontend la declara | — |
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
| GET /authz/me/access | authz | ningún cliente del frontend la declara | — |
| POST /authz/me/care-relationships/{id}/revoke | authz | ningún cliente del frontend la declara | — |
| POST /authz/me/clinical-access-grants/{grantId}/revoke | authz | ningún cliente del frontend la declara | — |
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
| GET /billing/invoices | billing | ningún cliente del frontend la declara | — |
| POST /billing/invoices:issue-from-encounter | billing | ningún cliente del frontend la declara | — |
| GET /billing/invoices/{id} | billing | ningún cliente del frontend la declara | — |
| POST /billing/invoices/{id}:credit-note | billing | ningún cliente del frontend la declara | — |
| POST /billing/kpi-snapshots:compute | billing | ningún cliente del frontend la declara | — |
| GET /billing/patient-statements | billing | ningún cliente del frontend la declara | — |
| POST /billing/patient-statements:generate | billing | ningún cliente del frontend la declara | — |
| POST /billing/payment-plans | billing | ningún cliente del frontend la declara | — |
| POST /billing/payments-made:execute | billing | ningún cliente del frontend la declara | — |
| POST /billing/payments-received:apply | billing | ningún cliente del frontend la declara | — |
| POST /billing/reconciliation:clear | billing | ningún cliente del frontend la declara | — |
| POST /billing/reimbursements:link | billing | ningún cliente del frontend la declara | — |
| GET /billing/simulated/catalogs | billing | ningún cliente del frontend la declara | — |
| GET /billing/simulated/charges | billing | ningún cliente del frontend la declara | — |
| POST /billing/simulated/charges/{chargeId}/instances/{instanceId}/payments | billing | ningún cliente del frontend la declara | — |
| POST /billing/simulated/charges/{chargeId}/invoices | billing | ningún cliente del frontend la declara | — |
| POST /billing/simulated/charges/{chargeId}/payment | billing | ningún cliente del frontend la declara | — |
| GET /billing/simulated/invoices/{invoiceId} | billing | ningún cliente del frontend la declara | — |
| POST /billing/simulated/invoices/{invoiceId}/annulment | billing | ningún cliente del frontend la declara | — |
| POST /billing/simulated/invoices/{invoiceId}/annulment-reversal | billing | ningún cliente del frontend la declara | — |
| POST /billing/simulated/invoices/{invoiceId}/email | billing | ningún cliente del frontend la declara | — |
| GET /billing/simulated/my-invoices | billing | ningún cliente del frontend la declara | — |
| GET /billing/simulated/my-invoices/{invoiceId} | billing | ningún cliente del frontend la declara | — |
| GET /billing/simulated/outbox | billing | ningún cliente del frontend la declara | — |
| GET /billing/simulated/status | billing | ningún cliente del frontend la declara | — |
| PATCH /charts/care-plans/{planId}/activities/{activityId} | chart | ningún cliente del frontend la declara | — |
| GET /charts/documents/{documentId}/files/{fileId}/content | chart | ningún cliente del frontend la declara | — |
| GET /charts/encounters/{id}/pdf | chart | ningún cliente del frontend la declara | — |
| GET /charts/me/documents | chart | ningún cliente del frontend la declara | — |
| GET /charts/me/documents/{documentId}/files/{fileId}/content | chart | ningún cliente del frontend la declara | — |
| GET /charts/me/encounters/{id}/pdf | chart | ningún cliente del frontend la declara | — |
| GET /charts/me/notes | chart | ningún cliente del frontend la declara | — |
| GET /charts/notes | chart | ningún cliente del frontend la declara | — |
| POST /charts/notes/{noteId}/amendments | chart | ningún cliente del frontend la declara | — |
| POST /charts/notes/{noteId}/versions/{versionId}/cosign | chart | ningún cliente del frontend la declara | — |
| POST /charts/notes/{noteId}/versions/{versionId}/sign | chart | ningún cliente del frontend la declara | — |
| POST /charts/notes/versions/{versionId}/exam-findings | chart | ningún cliente del frontend la declara | — |
| POST /charts/notes/versions/{versionId}/release | chart | ningún cliente del frontend la declara | — |
| POST /charts/notes/versions/{versionId}/withhold | chart | ningún cliente del frontend la declara | — |
| GET /clinical/allergy-intolerances/{id}/attachments | clinical | ningún cliente del frontend la declara | — |
| POST /clinical/conditions/{id}/verification | clinical | ningún cliente del frontend la declara | — |
| GET /clinical/encounters/{id}/attachments | clinical | ningún cliente del frontend la declara | — |
| POST /clinical/encounters/{id}/attachments | clinical | ningún cliente del frontend la declara | — |
| POST /clinical/immunizations | clinical | ningún cliente del frontend la declara | — |
| POST /clinical/medication-records | clinical | ningún cliente del frontend la declara | — |
| GET /clinical/medication-requests/{id}/attachments | clinical | ningún cliente del frontend la declara | — |
| POST /clinical/medication-requests/{id}/invalidate | clinical | ningún cliente del frontend la declara | — |
| POST /clinical/medication-requests/{id}/renew | clinical | ningún cliente del frontend la declara | — |
| POST /clinical/medication-requests/{id}/replace | clinical | ningún cliente del frontend la declara | — |
| PATCH /clinical/observations/{id}/amend | clinical | ningún cliente del frontend la declara | — |
| GET /clinical/prescription-signature-policies | clinical | ningún cliente del frontend la declara | — |
| POST /clinical/prescription-signature-policies | clinical | ningún cliente del frontend la declara | — |
| POST /clinical/prescription-signature-policies/{id}/deactivate | clinical | ningún cliente del frontend la declara | — |
| POST /clinical/procedures | clinical | ningún cliente del frontend la declara | — |
| GET /public/prescriptions/{id}/verify | clinical | ningún cliente del frontend la declara | — |
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
| GET /prescription-favorites | clinical_ext | ningún cliente del frontend la declara | — |
| POST /prescription-favorites | clinical_ext | ningún cliente del frontend la declara | — |
| DELETE /prescription-favorites/{id} | clinical_ext | ningún cliente del frontend la declara | — |
| GET /referrals | clinical_ext | ningún cliente del frontend la declara | — |
| POST /referrals | clinical_ext | ningún cliente del frontend la declara | — |
| PATCH /referrals/{id}/respond | clinical_ext | ningún cliente del frontend la declara | — |
| GET /referrals/me | clinical_ext | ningún cliente del frontend la declara | — |
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
| POST /internal/storage-lifecycle/audio/{assetId}/abort | common | ningún cliente del frontend la declara | — |
| POST /internal/storage-lifecycle/audio/{assetId}/begin | common | ningún cliente del frontend la declara | — |
| POST /internal/storage-lifecycle/audio/{assetId}/dispatch | common | ningún cliente del frontend la declara | — |
| POST /internal/storage-lifecycle/recover | common | ningún cliente del frontend la declara | — |
| DESCONOCIDO / | community | ningún cliente del frontend la declara | — |
| DESCONOCIDO / | community | ningún cliente del frontend la declara | — |
| DESCONOCIDO / | community | ningún cliente del frontend la declara | — |
| DESCONOCIDO / | community | ningún cliente del frontend la declara | — |

_Se muestran 200 de 1030; la lista completa está en `inventario/flujos/hallazgos.json`._

## FLU-08

**Operaciones que existen en el código y el contrato OpenAPI no publica** — severidad MEDIA — 16 caso(s).

**Qué hacer:** Regenerar el contrato o decidir si deben dejar de existir. Los clientes generados no las ven.

| Dónde | Módulo | Detalle | Fuente |
|---|---|---|---|
| DESCONOCIDO / | community | handler sin operación en openapi.json | `src/modules/community/controllers/community-public.controller.ts:577` |
| DESCONOCIDO / | community | handler sin operación en openapi.json | `src/modules/community/controllers/community-public.controller.ts:584` |
| DESCONOCIDO / | community | handler sin operación en openapi.json | `src/modules/community/controllers/community-public.controller.ts:597` |
| DESCONOCIDO / | community | handler sin operación en openapi.json | `src/modules/community/controllers/community-public.controller.ts:602` |
| DESCONOCIDO /iam/auth | iam | handler sin operación en openapi.json | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:427` |
| GET /['insurance/campaigns', 'insurance-campaigns'] | insurance | handler sin operación en openapi.json | `src/modules/insurance/presentation/controllers/insurance-campaigns.controller.ts:71` |
| POST /['insurance/campaigns', 'insurance-campaigns'] | insurance | handler sin operación en openapi.json | `src/modules/insurance/presentation/controllers/insurance-campaigns.controller.ts:60` |
| GET /['insurance/campaigns', 'insurance-campaigns']/{id} | insurance | handler sin operación en openapi.json | `src/modules/insurance/presentation/controllers/insurance-campaigns.controller.ts:142` |
| PATCH /['insurance/campaigns', 'insurance-campaigns']/{id} | insurance | handler sin operación en openapi.json | `src/modules/insurance/presentation/controllers/insurance-campaigns.controller.ts:167` |
| PATCH /['insurance/campaigns', 'insurance-campaigns']/{id}/status | insurance | handler sin operación en openapi.json | `src/modules/insurance/presentation/controllers/insurance-campaigns.controller.ts:153` |
| GET /['insurance/campaigns', 'insurance-campaigns']/active | insurance | handler sin operación en openapi.json | `src/modules/insurance/presentation/controllers/insurance-campaigns.controller.ts:87` |
| GET /['insurance/campaigns', 'insurance-campaigns']/my-benefits | insurance | handler sin operación en openapi.json | `src/modules/insurance/presentation/controllers/insurance-campaigns.controller.ts:102` |
| GET /['insurance/campaigns', 'insurance-campaigns']/patient/{patientProfileId} | insurance | handler sin operación en openapi.json | `src/modules/insurance/presentation/controllers/insurance-campaigns.controller.ts:123` |
| DESCONOCIDO / | promotions | handler sin operación en openapi.json | `src/modules/promotions/controllers/loyalty.controller.ts:175` |
| DESCONOCIDO /redis-runtime | redis_runtime | handler sin operación en openapi.json | `src/modules/redis_runtime/controllers/redis-runtime.controller.ts:44` |
| DESCONOCIDO /search | search_platform | handler sin operación en openapi.json | `src/modules/search_platform/controllers/search-platform.controller.ts:102` |

## FLU-09

**Máquinas de estado sin ninguna operación que las ejerza** — severidad BAJA — 0 caso(s).

**Qué hacer:** Revisar si la máquina se usa desde un worker o si es código muerto.

_Ninguno._

## FLU-10

**Operaciones que pueden terminar en un 500 por una excepción sin tipar** — severidad BAJA — 81 caso(s).

**Qué hacer:** Cambiar el `new Error(...)` por una excepción del proyecto con estado y código estables (regla 96.4.4). El cliente hoy recibe INTERNAL sin poder distinguir la causa.

| Dónde | Módulo | Detalle | Fuente |
|---|---|---|---|
| GET /health/data-sources | app | DataSourceConfigurationError: No hay ninguna conexión registrada como «{name}». Registradas: {known}. (src/persistence/registry/connection.registry.ts:59) \| DataSourceConfigurationError: No hay ninguna conexión registrada como «{name}». Registradas: {known}. (src/persistence/registry/connection.registry.ts:59) | `src/persistence/health/data-sources.controller.ts:25` |
| GET /readiness | app | Error: MongoDB no confirmó el ping (src/modules/document_store/repositories/mongo-connection.provider.ts:60) \| Error: Redis no respondió PONG (src/modules/redis_runtime/services/redis-runtime.service.ts:61) \| Error: OpenSearch está en estado red (src/modules/search_platform/services/search-index.service.ts:174) | `src/app.controller.ts:63` |
| GET /audio-assets/{assetId}/content | audio_assets | Error: FILE_STORAGE_S3_BUCKET es obligatorio para FILE_STORAGE_ADAPTER=s3 (src/common/storage/s3-file-storage.adapter.ts:310) \| Error: S3 object body is empty (src/common/storage/s3-file-storage.adapter.ts:225) | `src/modules/audio_assets/controllers/audio-assets.controller.ts:39` |
| POST /audio-assets/resolve | audio_assets | Error: No se pudo materializar el asset de audio idempotente (src/modules/audio_assets/repositories/audio-assets.repository.ts:118) \| StorageLifecycleDenied: LIFECYCLE_WIRING_MISSING (src/modules/audio_assets/repositories/audio-assets.repository.ts:127) \| Error: No se pudo materializar el asset de audio idempotente (src/modules/audio_assets/repositories/audio-assets.repository.ts:118) | `src/modules/audio_assets/controllers/audio-assets.controller.ts:28` |
| POST /internal/audio-assets/{assetId}/generated | audio_assets | StorageLifecycleDenied: PUBLICATION_PROOF_REQUIRED (src/modules/audio_assets/application/audio-generation.use-case.ts:122) \| StorageLifecycleDenied: PUBLICATION_TRANSACTION_REQUIRED (src/modules/audio_assets/repositories/audio-assets.repository.ts:235) \| StorageLifecycleDenied: PUBLICATION_TRANSACTION_REQUIRED (src/modules/audio_assets/repositories/audio-assets.repository.ts:235) | `src/modules/audio_assets/controllers/audio-assets-internal.controller.ts:81` |
| POST /internal/audio-assets/{assetId}/prepare-generation | audio_assets | Error: Payload cifrado de audio inválido (src/modules/audio_assets/infrastructure/audio-value-cipher.service.ts:38) | `src/modules/audio_assets/controllers/audio-assets-internal.controller.ts:75` |
| POST /internal/audio-assets/garbage-collect | audio_assets | StorageLifecycleDenied: DELETE_PERMIT_REQUIRED (src/common/storage/local-disk-file-storage.adapter.ts:212) \| StorageLifecycleDenied: PHYSICAL_IDENTITY_UNKNOWN (src/common/storage/local-disk-file-storage.adapter.ts:215) \| Error: FILE_STORAGE_S3_BUCKET es obligatorio para FILE_STORAGE_ADAPTER=s3 (src/common/storage/s3-file-storage.adapter.ts:310) | `src/modules/audio_assets/controllers/audio-assets-internal.controller.ts:58` |
| POST /internal/audio-assets/pregenerate | audio_assets | Error: La plantilla enumerada excede {MAX_ENUMERATED_COMBINATIONS} combinaciones (src/modules/audio_assets/application/pregenerate-audio-assets.use-case.ts:89) \| Error: No se pudo materializar el asset de audio idempotente (src/modules/audio_assets/repositories/audio-assets.repository.ts:118) \| StorageLifecycleDenied: LIFECYCLE_WIRING_MISSING (src/modules/audio_assets/repositories/audio-assets.repository.ts:127) | `src/modules/audio_assets/controllers/audio-assets-internal.controller.ts:41` |
| POST /internal/audio-assets/verify | audio_assets | Error: FILE_STORAGE_S3_BUCKET es obligatorio para FILE_STORAGE_ADAPTER=s3 (src/common/storage/s3-file-storage.adapter.ts:310) \| Error: FILE_STORAGE_S3_BUCKET es obligatorio para FILE_STORAGE_ADAPTER=s3 (src/common/storage/s3-file-storage.adapter.ts:310) \| Error: S3 object body is empty (src/common/storage/s3-file-storage.adapter.ts:225) | `src/modules/audio_assets/controllers/audio-assets-internal.controller.ts:52` |
| GET /charts/documents/{documentId}/files/{fileId}/content | chart | Error: S3 object body is empty (src/common/storage/s3-file-storage.adapter.ts:225) | `src/modules/chart/controllers/chart-documents.controller.ts:79` |
| GET /charts/me/documents/{documentId}/files/{fileId}/content | chart | Error: S3 object body is empty (src/common/storage/s3-file-storage.adapter.ts:225) | `src/modules/chart/controllers/chart-me.controller.ts:87` |
| POST /clinical/allergy-intolerances/{id}/attachments | clinical | StorageLifecycleDenied: LIFECYCLE_WIRING_MISSING (src/modules/common/services/files.service.ts:568) \| StorageLifecycleDenied: {identity.reasonCode} (src/common/storage/storage-publication.service.ts:142) \| StorageLifecycleDenied: FILE_NOT_LIVE (src/common/storage/storage-publication.service.ts:189) | `src/modules/clinical/controllers/clinical-records.controller.ts:192` |
| POST /clinical/conditions | clinical | Error: Entidad de historial no registrada: {entity} (src/modules/audit/repositories/history.repository.ts:161) | `src/modules/clinical/controllers/clinical-records.controller.ts:92` |
| POST /clinical/conditions/{id}/attachments | clinical | StorageLifecycleDenied: LIFECYCLE_WIRING_MISSING (src/modules/common/services/files.service.ts:568) \| StorageLifecycleDenied: {identity.reasonCode} (src/common/storage/storage-publication.service.ts:142) \| StorageLifecycleDenied: FILE_NOT_LIVE (src/common/storage/storage-publication.service.ts:189) | `src/modules/clinical/controllers/clinical-records.controller.ts:158` |
| POST /clinical/conditions/{id}/change-status | clinical | Error: Entidad de historial no registrada: {entity} (src/modules/audit/repositories/history.repository.ts:161) | `src/modules/clinical/controllers/clinical-records.controller.ts:109` |
| POST /clinical/conditions/{id}/verification | clinical | Error: Entidad de historial no registrada: {entity} (src/modules/audit/repositories/history.repository.ts:161) | `src/modules/clinical/controllers/clinical-records.controller.ts:134` |
| POST /clinical/encounters/{id}/attachments | clinical | StorageLifecycleDenied: LIFECYCLE_WIRING_MISSING (src/modules/common/services/files.service.ts:568) \| StorageLifecycleDenied: {identity.reasonCode} (src/common/storage/storage-publication.service.ts:142) \| StorageLifecycleDenied: FILE_NOT_LIVE (src/common/storage/storage-publication.service.ts:189) | `src/modules/clinical/controllers/clinical-encounters.controller.ts:131` |
| POST /clinical/medication-requests | clinical | Error: Entidad de historial no registrada: {entity} (src/modules/audit/repositories/history.repository.ts:161) | `src/modules/clinical/controllers/clinical-records.controller.ts:227` |
| POST /clinical/medication-requests/{id}/attachments | clinical | StorageLifecycleDenied: LIFECYCLE_WIRING_MISSING (src/modules/common/services/files.service.ts:568) \| StorageLifecycleDenied: {identity.reasonCode} (src/common/storage/storage-publication.service.ts:142) \| StorageLifecycleDenied: FILE_NOT_LIVE (src/common/storage/storage-publication.service.ts:189) | `src/modules/clinical/controllers/clinical-records.controller.ts:247` |
| POST /clinical/medication-requests/{id}/edit | clinical | Error: Entidad de historial no registrada: {entity} (src/modules/audit/repositories/history.repository.ts:161) | `src/modules/clinical/controllers/clinical-records.controller.ts:299` |
| POST /clinical/medication-requests/{id}/invalidate | clinical | Error: Entidad de historial no registrada: {entity} (src/modules/audit/repositories/history.repository.ts:161) | `src/modules/clinical/controllers/clinical-records.controller.ts:349` |
| POST /clinical/medication-requests/{id}/issue | clinical | Error: Entidad de historial no registrada: {entity} (src/modules/audit/repositories/history.repository.ts:161) | `src/modules/clinical/controllers/clinical-records.controller.ts:332` |
| POST /clinical/medication-requests/{id}/renew | clinical | Error: Entidad de historial no registrada: {entity} (src/modules/audit/repositories/history.repository.ts:161) | `src/modules/clinical/controllers/clinical-records.controller.ts:385` |
| POST /clinical/medication-requests/{id}/replace | clinical | Error: Entidad de historial no registrada: {entity} (src/modules/audit/repositories/history.repository.ts:161) \| Error: Entidad de historial no registrada: {entity} (src/modules/audit/repositories/history.repository.ts:161) | `src/modules/clinical/controllers/clinical-records.controller.ts:366` |
| POST /clinical/medication-requests/{id}/sign | clinical | Error: Entidad de historial no registrada: {entity} (src/modules/audit/repositories/history.repository.ts:161) | `src/modules/clinical/controllers/clinical-records.controller.ts:316` |
| POST /clinical/procedures/{id}/attachments | clinical | StorageLifecycleDenied: LIFECYCLE_WIRING_MISSING (src/modules/common/services/files.service.ts:568) \| StorageLifecycleDenied: {identity.reasonCode} (src/common/storage/storage-publication.service.ts:142) \| StorageLifecycleDenied: FILE_NOT_LIVE (src/common/storage/storage-publication.service.ts:189) | `src/modules/clinical/controllers/clinical-records.controller.ts:426` |
| POST /cds-rules | clinical_ext | UnparseableCdsRuleError: logic_json no es un objeto (src/modules/clinical_ext/services/cds.service.ts:407) \| UnparseableCdsRuleError: op 'in' exige un array en value (src/modules/clinical_ext/services/cds.service.ts:482) \| UnparseableCdsRuleError: op '{op}' exige un número en value (src/modules/clinical_ext/services/cds.service.ts:494) | `src/modules/clinical_ext/controllers/cds.controller.ts:53` |
| POST /cds-rules/{id}/versions/publish | clinical_ext | UnparseableCdsRuleError: logic_json no es un objeto (src/modules/clinical_ext/services/cds.service.ts:407) \| UnparseableCdsRuleError: op 'in' exige un array en value (src/modules/clinical_ext/services/cds.service.ts:482) \| UnparseableCdsRuleError: op '{op}' exige un número en value (src/modules/clinical_ext/services/cds.service.ts:494) | `src/modules/clinical_ext/controllers/cds.controller.ts:70` |
| POST /cds/evaluate | clinical_ext | UnparseableCdsRuleError: logic_json no es un objeto (src/modules/clinical_ext/services/cds.service.ts:433) \| UnparseableCdsRuleError: op 'in' exige un array en value (src/modules/clinical_ext/services/cds.service.ts:482) \| UnparseableCdsRuleError: op '{op}' exige un número en value (src/modules/clinical_ext/services/cds.service.ts:494) | `src/modules/clinical_ext/controllers/cds.controller.ts:113` |
| POST /common/files | common | StorageLifecycleDenied: LIFECYCLE_WIRING_MISSING (src/modules/common/services/files.service.ts:568) \| StorageLifecycleDenied: {identity.reasonCode} (src/common/storage/storage-publication.service.ts:142) \| StorageLifecycleDenied: TRANSACTION_REQUIRED (src/common/storage/storage-lifecycle-coordinator.service.ts:60) | `src/modules/common/controllers/common-files.controller.ts:144` |
| DELETE /common/files/{id} | common | StorageLifecycleDenied: LIFECYCLE_WIRING_MISSING (src/modules/common/services/files.service.ts:568) \| StorageLifecycleDenied: {identity.reasonCode} (src/common/storage/storage-publication.service.ts:142) \| StorageLifecycleDenied: TRANSACTION_REQUIRED (src/common/storage/storage-lifecycle-coordinator.service.ts:60) | `src/modules/common/controllers/common-files.controller.ts:194` |
| GET /common/files/{id}/content | common | Error: FILE_STORAGE_S3_BUCKET es obligatorio para FILE_STORAGE_ADAPTER=s3 (src/common/storage/s3-file-storage.adapter.ts:310) \| Error: S3 object body is empty (src/common/storage/s3-file-storage.adapter.ts:225) | `src/modules/common/controllers/common-files.controller.ts:119` |
| POST /common/files/{id}/links | common | StorageLifecycleDenied: LIFECYCLE_WIRING_MISSING (src/modules/common/services/files.service.ts:568) \| StorageLifecycleDenied: {identity.reasonCode} (src/common/storage/storage-publication.service.ts:142) \| StorageLifecycleDenied: TRANSACTION_REQUIRED (src/common/storage/storage-lifecycle-coordinator.service.ts:60) | `src/modules/common/controllers/common-files.controller.ts:182` |
| POST /common/files/{id}/versions | common | StorageLifecycleDenied: LIFECYCLE_WIRING_MISSING (src/modules/common/services/files.service.ts:568) \| StorageLifecycleDenied: {identity.reasonCode} (src/common/storage/storage-publication.service.ts:142) \| StorageLifecycleDenied: TRANSACTION_REQUIRED (src/common/storage/storage-lifecycle-coordinator.service.ts:60) | `src/modules/common/controllers/common-files.controller.ts:157` |
| POST /common/files/{id}/versions/{vid}/derivatives | common | StorageLifecycleDenied: LIFECYCLE_WIRING_MISSING (src/modules/common/services/files.service.ts:568) \| StorageLifecycleDenied: {identity.reasonCode} (src/common/storage/storage-publication.service.ts:142) \| StorageLifecycleDenied: TRANSACTION_REQUIRED (src/common/storage/storage-lifecycle-coordinator.service.ts:60) | `src/modules/common/controllers/common-files.controller.ts:169` |
| POST /common/files/upload | common | StorageLifecycleDenied: LIFECYCLE_WIRING_MISSING (src/modules/common/services/file-upload.service.ts:450) \| StorageLifecycleDenied: PHYSICAL_IDENTITY_UNKNOWN (src/common/storage/storage-publication.service.ts:76) \| StorageLifecycleDenied: REMOTE_STATE_UNKNOWN (src/common/storage/storage-publication.service.ts:90) | `src/modules/common/controllers/common-files.controller.ts:71` |
| POST /internal/storage-lifecycle/audio/{assetId}/abort | common | StorageLifecycleDenied: RESERVATION_MISSING (src/common/storage/storage-lifecycle-coordinator.service.ts:649) \| StorageLifecycleDenied: PRODUCER_OWNERSHIP_UNKNOWN (src/common/storage/storage-worker-publication.service.ts:180) | `src/modules/common/controllers/internal-storage-lifecycle.controller.ts:39` |
| POST /internal/storage-lifecycle/audio/{assetId}/begin | common | StorageLifecycleDenied: PRODUCER_OWNERSHIP_UNKNOWN (src/common/storage/storage-worker-publication.service.ts:65) \| StorageLifecycleDenied: PHYSICAL_IDENTITY_UNKNOWN (src/common/storage/storage-worker-publication.service.ts:70) \| StorageLifecycleDenied: TRANSACTION_REQUIRED (src/common/storage/storage-lifecycle-coordinator.service.ts:60) | `src/modules/common/controllers/internal-storage-lifecycle.controller.ts:21` |
| POST /internal/storage-lifecycle/audio/{assetId}/dispatch | common | StorageLifecycleDenied: RESERVATION_MISSING (src/common/storage/storage-lifecycle-coordinator.service.ts:649) \| StorageLifecycleDenied: PRODUCER_OWNERSHIP_UNKNOWN (src/common/storage/storage-worker-publication.service.ts:180) \| StorageLifecycleDenied: DISPATCH_REPLAY (src/common/storage/storage-lifecycle-coordinator.service.ts:135) | `src/modules/common/controllers/internal-storage-lifecycle.controller.ts:31` |
| POST /internal/storage-lifecycle/recover | common | StorageLifecycleDenied: TRANSACTION_REQUIRED (src/common/storage/storage-lifecycle-coordinator.service.ts:702) \| StorageLifecycleDenied: GLOBAL_RESERVATION_VISIBILITY_UNPROVEN (src/common/storage/storage-lifecycle-coordinator.service.ts:714) \| StorageLifecycleDenied: INTENT_ENVELOPE_UNKNOWN (src/common/storage/storage-lifecycle-coordinator.service.ts:696) | `src/modules/common/controllers/internal-storage-lifecycle.controller.ts:47` |
| GET /community/comments/media/{fileId}/content | community | Error: FILE_STORAGE_S3_BUCKET es obligatorio para FILE_STORAGE_ADAPTER=s3 (src/common/storage/s3-file-storage.adapter.ts:310) \| Error: S3 object body is empty (src/common/storage/s3-file-storage.adapter.ts:225) | `src/modules/community/controllers/community-social.controller.ts:387` |
| GET /community/conversations/{conversationId}/attachments/{fileId}/content | community | Error: S3 object body is empty (src/common/storage/s3-file-storage.adapter.ts:225) | `src/modules/community/controllers/community-messaging.controller.ts:200` |
| GET /internal/community/search/health | community | Error: OpenSearch está en estado red (src/modules/search_platform/services/search-index.service.ts:174) | `src/modules/community/controllers/community-search-index.controller.ts:72` |
| GET /public/media/{id} | community | Error: FILE_STORAGE_S3_BUCKET es obligatorio para FILE_STORAGE_ADAPTER=s3 (src/common/storage/s3-file-storage.adapter.ts:310) \| Error: S3 object body is empty (src/common/storage/s3-file-storage.adapter.ts:225) | `src/modules/community/controllers/community-public.controller.ts:496` |
| POST /admin/content-packs/{code}/apply | content_packs | Error: El catálogo del glosario declara el slug "{term.slug}" más de una vez (src/common/seed/glossary-seed.service.ts:344) \| Error: El directorio declara el código "{facility.code}" más de una vez (src/common/seed/bolivia-facilities-seed.service.ts:184) \| Error: El catálogo geográfico declara la sigla "{department.code}" más de una vez (src/common/seed/bo-geography-seed.service.ts:247) | `src/modules/content_packs/content-packs.controller.ts:69` |
| POST /admin/catalog/annotations/{id}/review | data_catalog | DomainException: {403} (src/modules/data_catalog/services/catalog-governance.service.ts:182) \| DomainException: {422} (src/modules/data_catalog/services/catalog-governance.service.ts:188) | `src/modules/data_catalog/controllers/admin-catalog.controller.ts:201` |
| PUT /admin/catalog/objects/{id}/annotation | data_catalog | DomainException: {422} (src/modules/data_catalog/services/catalog-governance.service.ts:77) | `src/modules/data_catalog/controllers/admin-catalog.controller.ts:178` |
| GET /diagnostic-results/me/{reportId}/files/{fileId}/content | diagnostics | Error: S3 object body is empty (src/common/storage/s3-file-storage.adapter.ts:225) | `src/modules/diagnostics/controllers/diagnostics-patient-results.controller.ts:173` |
| GET /tenants/{tenantId}/logo/content | directory | Error: S3 object body is empty (src/common/storage/s3-file-storage.adapter.ts:225) | `src/modules/directory/controllers/organization-logo.controller.ts:44` |
| POST /iam/auth/register-practitioner | iam | StorageLifecycleDenied: LIFECYCLE_WIRING_MISSING (src/modules/common/services/file-upload.service.ts:408) \| StorageLifecycleDenied: LIFECYCLE_WIRING_MISSING (src/modules/common/services/attachable-file.service.ts:226) \| StorageLifecycleDenied: LIFECYCLE_WIRING_MISSING (src/modules/common/services/attachable-file.service.ts:226) | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:233` |
| POST /iam/auth/upload-registration-document | iam | StorageLifecycleDenied: LIFECYCLE_WIRING_MISSING (src/modules/common/services/file-upload.service.ts:450) \| StorageLifecycleDenied: PHYSICAL_IDENTITY_UNKNOWN (src/common/storage/storage-publication.service.ts:76) \| StorageLifecycleDenied: REMOTE_STATE_UNKNOWN (src/common/storage/storage-publication.service.ts:90) | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:198` |
| POST /iam/auth/upload-registration-signature-image | iam | StorageLifecycleDenied: LIFECYCLE_WIRING_MISSING (src/modules/common/services/file-upload.service.ts:450) \| StorageLifecycleDenied: PHYSICAL_IDENTITY_UNKNOWN (src/common/storage/storage-publication.service.ts:76) \| StorageLifecycleDenied: REMOTE_STATE_UNKNOWN (src/common/storage/storage-publication.service.ts:90) | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:153` |
| POST /iam/users/assisted-practitioner-registration | iam | StorageLifecycleDenied: LIFECYCLE_WIRING_MISSING (src/modules/common/services/file-upload.service.ts:408) \| StorageLifecycleDenied: LIFECYCLE_WIRING_MISSING (src/modules/common/services/attachable-file.service.ts:226) \| StorageLifecycleDenied: LIFECYCLE_WIRING_MISSING (src/modules/common/services/attachable-file.service.ts:226) | `src/modules/iam/presentation/controllers/iam-users.controller.ts:248` |
| POST /identity/me/identity-verification | identity_assurance | StorageLifecycleDenied: FILE_NOT_LIVE (src/common/storage/storage-publication.service.ts:189) \| StorageLifecycleDenied: VERSION_UNKNOWN (src/common/storage/storage-publication.service.ts:192) \| StorageLifecycleDenied: PHYSICAL_IDENTITY_UNKNOWN (src/common/storage/storage-publication.service.ts:199) | `src/modules/identity_assurance/controllers/identity-self-service.controller.ts:42` |
| POST /identity/me/practitioner/identity-verification | identity_assurance | StorageLifecycleDenied: FILE_NOT_LIVE (src/common/storage/storage-publication.service.ts:189) \| StorageLifecycleDenied: VERSION_UNKNOWN (src/common/storage/storage-publication.service.ts:192) \| StorageLifecycleDenied: PHYSICAL_IDENTITY_UNKNOWN (src/common/storage/storage-publication.service.ts:199) | `src/modules/identity_assurance/controllers/identity-self-service.controller.ts:60` |
| POST /identity/me/practitioner/license-verification | identity_assurance | StorageLifecycleDenied: FILE_NOT_LIVE (src/common/storage/storage-publication.service.ts:189) \| StorageLifecycleDenied: VERSION_UNKNOWN (src/common/storage/storage-publication.service.ts:192) \| StorageLifecycleDenied: PHYSICAL_IDENTITY_UNKNOWN (src/common/storage/storage-publication.service.ts:199) | `src/modules/identity_assurance/controllers/identity-self-service.controller.ts:78` |
| POST /identity/me/tenants/{tenantId}/verification | identity_assurance | StorageLifecycleDenied: FILE_NOT_LIVE (src/common/storage/storage-publication.service.ts:189) \| StorageLifecycleDenied: VERSION_UNKNOWN (src/common/storage/storage-publication.service.ts:192) \| StorageLifecycleDenied: PHYSICAL_IDENTITY_UNKNOWN (src/common/storage/storage-publication.service.ts:199) | `src/modules/identity_assurance/controllers/identity-self-service.controller.ts:94` |
| POST /identity/verification-cases/{id}/evidence | identity_assurance | StorageLifecycleDenied: {identity.reasonCode} (src/common/storage/storage-publication.service.ts:142) \| StorageLifecycleDenied: FILE_NOT_LIVE (src/common/storage/storage-publication.service.ts:189) \| StorageLifecycleDenied: VERSION_UNKNOWN (src/common/storage/storage-publication.service.ts:192) | `src/modules/identity_assurance/controllers/identity-cases.controller.ts:140` |
| POST /internal/identity/evidence/lifecycle-scan | identity_assurance | StorageLifecycleDenied: LIFECYCLE_WIRING_MISSING (src/modules/identity_assurance/controllers/identity-worker.controller.ts:92) \| StorageLifecycleDenied: MISSING_CONFIGURATION (src/modules/identity_assurance/identity-evidence-lifecycle.config.ts:128) \| StorageLifecycleDenied: MISSING_OR_DUPLICATE_BINDING (src/modules/identity_assurance/identity-evidence-lifecycle.config.ts:136) | `src/modules/identity_assurance/controllers/identity-worker.controller.ts:79` |
| POST /internal/identity/evidence/storage-purge-review | identity_assurance | StorageLifecycleDenied: LIFECYCLE_WIRING_MISSING (src/modules/identity_assurance/controllers/identity-worker.controller.ts:75) \| StorageLifecycleDenied: PURGE_INTENT_UNKNOWN (src/common/storage/storage-lifecycle-coordinator.service.ts:461) \| StorageLifecycleDenied: TRANSACTION_REQUIRED (src/common/storage/storage-lifecycle-coordinator.service.ts:60) | `src/modules/identity_assurance/controllers/identity-worker.controller.ts:63` |
| POST /insurance/portability/export | insurance | StorageLifecycleDenied: LIFECYCLE_WIRING_MISSING (src/modules/common/services/file-upload.service.ts:260) | `src/modules/insurance/presentation/controllers/insurance-portability.controller.ts:57` |
| POST /object-storage/objects/{manifestId}/versions | object_storage | ObjectContentUnavailableError: BACKEND_UNSUPPORTED (src/modules/object_storage/ports/s3-object-content.reader.ts:112) \| ObjectContentUnavailableError: SIZE_UNKNOWN (src/modules/object_storage/ports/s3-object-content.reader.ts:46) \| ObjectContentUnavailableError: PROVIDER_ERROR (src/modules/object_storage/ports/s3-object-content.reader.ts:56) | `src/modules/object_storage/controllers/object-storage.controller.ts:104` |
| POST /object-storage/uploads/{id}/complete | object_storage | ObjectContentUnavailableError: BACKEND_UNSUPPORTED (src/modules/object_storage/ports/s3-object-content.reader.ts:112) \| ObjectContentUnavailableError: SIZE_UNKNOWN (src/modules/object_storage/ports/s3-object-content.reader.ts:46) \| ObjectContentUnavailableError: PROVIDER_ERROR (src/modules/object_storage/ports/s3-object-content.reader.ts:56) | `src/modules/object_storage/controllers/object-storage.controller.ts:89` |
| GET /object-storage/versions/{versionId}/content/{token} | object_storage | ObjectContentUnavailableError: BODY_UNREADABLE (src/modules/object_storage/ports/s3-object-content.reader.ts:98) \| ObjectContentUnavailableError: NOT_FOUND / PROVIDER_ERROR (src/modules/object_storage/ports/s3-object-content.reader.ts:103) | `src/modules/object_storage/controllers/object-storage.controller.ts:223` |
| GET /admin/ops/traffic | ops_console | DomainException: {HttpStatus.UNPROCESSABLE_ENTITY} (src/modules/ops_console/ops-traffic.service.ts:93) | `src/modules/ops_console/ops-console.controller.ts:162` |
| GET /admin/ops/traffic/endpoints | ops_console | DomainException: {HttpStatus.UNPROCESSABLE_ENTITY} (src/modules/ops_console/ops-traffic.service.ts:93) | `src/modules/ops_console/ops-console.controller.ts:174` |
| POST /procedure-cases/{id}/diagnoses | procedures_perioperative | Error: Entidad de historial no registrada: {entity} (src/modules/audit/repositories/history.repository.ts:161) | `src/modules/procedures_perioperative/controllers/periop.controller.ts:188` |
| POST /admin/qa/plans/{planId}/approvals | qa_execution | DomainException: {HttpStatus.FORBIDDEN} (src/modules/qa_execution/services/qa-execution.service.ts:432) | `src/modules/qa_execution/controllers/qa-execution.controller.ts:129` |
| POST /scheduling/bookings/{id}/delay | scheduling | Error: Entidad de historial no registrada: {entity} (src/modules/audit/repositories/history.repository.ts:161) | `src/modules/scheduling/presentation/controllers/scheduling-bookings.controller.ts:413` |
| PUT /scheduling/bookings/{id}/payment-state | scheduling | Error: Entidad de historial no registrada: {entity} (src/modules/audit/repositories/history.repository.ts:161) | `src/modules/scheduling/presentation/controllers/scheduling-bookings.controller.ts:255` |
| POST /scheduling/bookings/{id}/reschedule | scheduling | Error: Entidad de historial no registrada: {entity} (src/modules/audit/repositories/history.repository.ts:161) | `src/modules/scheduling/presentation/controllers/scheduling-bookings.controller.ts:347` |
| POST /scheduling/resources/{id}/delay | scheduling | Error: Entidad de historial no registrada: {entity} (src/modules/audit/repositories/history.repository.ts:161) | `src/modules/scheduling/presentation/controllers/scheduling.controller.ts:814` |
| POST /internal/governance/retention-executions/run | system_ops | StorageLifecycleDenied: LIFECYCLE_WIRING_MISSING (src/modules/system_ops/services/retention-execution.service.ts:108) \| StorageLifecycleDenied: EXTERNAL_REFERENCE_UNKNOWN (src/modules/identity_assurance/services/identity-evidence-lifecycle.service.ts:80) \| StorageLifecycleDenied: PHYSICAL_IDENTITY_UNKNOWN (src/modules/identity_assurance/services/identity-evidence-lifecycle.service.ts:89) | `src/modules/system_ops/controllers/retention-execution.controller.ts:23` |
| GET /admin/analytics/funnels/{funnelId}/report | telemetry | DomainException: {HttpStatus.UNPROCESSABLE_ENTITY} (src/modules/telemetry/services/telemetry-analytics.service.ts:104) | `src/modules/telemetry/controllers/telemetry-analytics.controller.ts:153` |
| GET /admin/analytics/overview | telemetry | DomainException: {HttpStatus.UNPROCESSABLE_ENTITY} (src/modules/telemetry/services/telemetry-analytics.service.ts:104) | `src/modules/telemetry/controllers/telemetry-analytics.controller.ts:118` |
| GET /admin/analytics/pipeline-health | telemetry | DomainException: {HttpStatus.UNPROCESSABLE_ENTITY} (src/modules/telemetry/services/telemetry-analytics.service.ts:104) | `src/modules/telemetry/controllers/telemetry-analytics.controller.ts:166` |
| GET /admin/analytics/sessions | telemetry | DomainException: {HttpStatus.UNPROCESSABLE_ENTITY} (src/modules/telemetry/services/telemetry-analytics.service.ts:104) | `src/modules/telemetry/controllers/telemetry-analytics.controller.ts:176` |
| GET /admin/analytics/timeseries | telemetry | DomainException: {HttpStatus.UNPROCESSABLE_ENTITY} (src/modules/telemetry/services/telemetry-analytics.service.ts:104) | `src/modules/telemetry/controllers/telemetry-analytics.controller.ts:127` |
| GET /admin/analytics/web-vitals | telemetry | DomainException: {HttpStatus.UNPROCESSABLE_ENTITY} (src/modules/telemetry/services/telemetry-analytics.service.ts:104) | `src/modules/telemetry/controllers/telemetry-analytics.controller.ts:136` |
| GET /terminology/import-template | terminology | ImportFileRejectedException: {ErrorCode.IMPORT_PROFILE_UNKNOWN} (src/modules/terminology/services/import-template.service.ts:82) \| ImportFileRejectedException: {ErrorCode.IMPORT_FORMAT_UNSUPPORTED} (src/modules/terminology/services/import-template.service.ts:91) | `src/modules/terminology/controllers/terminology-import-template.controller.ts:34` |
| POST /terminology/versions/{versionId}/import-file | terminology | ImportFileRejectedException: {ErrorCode.IMPORT_PROFILE_UNKNOWN} (src/modules/terminology/services/concept-file-import.service.ts:284) \| ImportFileRejectedException: {ErrorCode.IMPORT_EMPTY_FILE} (src/modules/terminology/services/concept-file-import.service.ts:184) \| ImportFileRejectedException: {ErrorCode.IMPORT_FORMAT_UNSUPPORTED} (src/modules/terminology/services/concept-file-import.service.ts:309) | `src/modules/terminology/controllers/terminology-versions.controller.ts:112` |

