# Módulo 10 — Audit, Provenance and Version Histories

Auditoría WORM (append-only), cadena hash tamper-evidence, provenance
quién-qué-cuándo, historial de versiones point-in-time, DSAR, exportación de
evidencia, retención/archivado, detección de anomalías, moderación/gobernanza y
acceso de tercero gobernado.

## Rutas HTTP y alcance (medido)

<!-- Medido el 2026-10-08 sobre origin/dev (dae4fd68). Repetir con:
  find src/modules/audit -name '*.controller.ts' | wc -l
  find src/modules/audit -name '*.controller.ts' -exec grep -hE "^\s*@(Get|Post|Put|Patch|Delete)\(" {} + | wc -l
  find src/modules/audit -name '*.entity.ts' | wc -l
  find src/modules/audit -name '*.service.ts' | wc -l
La tabla sale de los decoradores `@Controller`/`@Get`/`@Post`/`@Put`/`@Patch`/`@Delete`, `@Roles` y `@Public`. -->

El módulo tiene **6 controllers, 14 rutas HTTP, 131 entidades y 8 servicios**. La columna _Acceso_ sale del código: `pública` = `@Public()`; un rol = `@Roles(...)`; `sesión` = sin ninguno de los dos, o sea que sólo exige sesión autenticada (guards globales `JwtAuthGuard`, `TenantScopeGuard`, `RolesGuard`, `VerifiedIdentityGuard`). La autorización por recurso puede vivir además en el servicio y no se refleja acá.

Si una tabla narrativa más abajo difiere de ésta (prefijo del controller omitido, sufijos `:accion` de la spec en lugar de sub-rutas), manda ésta: sale del código.

Su `*.module.ts` importa `RouteIndexModule`; para resolver al titular de la sesión provee sueltos `PersonAccountLinksRepository` y `PatientProfilesRepository` de `profiles`.

Entidades (`tableName`, 131 de 131 archivos `*.entity.ts`): `accounts_history`, `ad_accounts_history`, `ad_creatives_history`, `ad_experiments_history`, `ad_sets_history`, `ads_history`, `agent_versions_history`, `agents_history`, `allergy_intolerances_history`, `analytics_governance_log`, `appointment_bookings_history`, `assets_history`, `audit_log`, `automated_rules_history`, `bills_history`, `booking_policies_history`, `campaigns_history`, `care_plans_history`, `care_spaces_history`, `care_teams_history`, `catalog_products_history`, `cds_rules_history`, `certificates_history`, `clinical_alerts_history`, `clinical_note_headers_history`, `clinical_units_history`, `comments_history`, `conditions_history`, `connected_accounts_history`, `consents_history`, `contacts_history`, `contracts_history`, `conversations_history`, `coupons_history`, `course_versions_history`, `courses_history`, `crm_accounts_history`, `custom_audiences_history`, `custom_conversions_history`, `data_access_log`, `delegated_access_audit_log`, `departments_history`, `diagnostic_reports_history`, `diagnostic_study_prices_history`, `document_records_history`, `dsar_requests`, `employment_records_history`, `enrollments_history`, `event_subscriptions_history`, `federated_identities_history`, `groups_history`, `guardrail_policies_history`, `health_practitioner_profiles_history`, `identity_providers_history`, `identity_verification_access_log`, `imaging_studies_history`, `inbound_messages_history`, `informational_materials_history`, `insurance_claims_history`, `insurance_decision_access_log`, `integration_endpoints_history`, `invoices_history`, `journal_transactions_history`, `journeys_history`, `jurisdiction_authorizations_history`, `liabilities_history`, `loyalty_memberships_history`, `loyalty_programs_history`, `marketing_campaigns_history`, `medical_visitors_history`, `medication_requests_history`, `message_retries_history`, `message_templates_history`, `moderation_decisions_history`, `moderation_events`, `opportunities_history`, `order_sets_history`, `organization_affiliations_history`, `outbound_messages_history`, `partnership_agreements_history`, `partnerships_history`, `patient_content_access_log`, `patient_identity_links_history`, `patient_profiles_history`, `payment_intents_history`, `payment_mandates_history`, `payment_methods_history`, `payment_transactions_history`, `payouts_history`, `pharma_lab_staff_history`, `pharma_labs_history`, `pharma_products_history`, `pharmacovigilance_reports_history`, `pharmacy_inventory_access_log`, `pharmacy_product_prices_history`, `positions_history`, `practice_sites_history`, `practices_history`, `practitioner_role_assignments_history`, `product_catalogs_history`, `product_sets_history`, `professional_credentials_history`, `promotions_history`, `provider_channel_configs_history`, `provider_connections_history`, `provider_protocol_configs_history`, `provider_tenant_bindings_history`, `public_profiles_history`, `record_automations_history`, `referral_programs_history`, `referrals_history`, `regulatory_documents_history`, `report_definitions_history`, `report_schedules_history`, `schedule_templates_history`, `segments_history`, `service_reviews_history`, `shipments_history`, `social_posts_history`, `subscription_plans_history`, `subscriptions_history`, `tenants_history`, `test_cases_history`, `test_suites_history`, `topics_history`, `trackable_subjects_history`, `users_history`, `verified_badges_history`, `visit_requests_history`, `wallets_history`, `workflows_history`.

| Método y ruta                    | Acceso                       | Controller    |
| -------------------------------- | ---------------------------- | ------------- |
| `POST /audit/data-access`        | SECURITY_ADMIN               | `audit`       |
| `POST /audit/events`             | SECURITY_ADMIN               | `audit`       |
| `GET /audit/history/:entity/:id` | SECURITY_ADMIN               | `audit`       |
| `POST /audit/integrity/verify`   | SECURITY_ADMIN               | `audit`       |
| `POST /audit/retention/apply`    | SECURITY_ADMIN               | `audit`       |
| `POST /audit/anomaly/scan`       | SECURITY_ADMIN               | `audit`       |
| `POST /audit/third-party-access` | SECURITY_ADMIN               | `audit`       |
| `POST /compliance/audit-export`  | SECURITY_ADMIN               | `compliance`  |
| `POST /moderation/decisions`     | SECURITY_ADMIN               | `moderation`  |
| `POST /privacy/dsar`             | SECURITY_ADMIN               | `privacy`     |
| `PATCH /privacy/dsar/:id`        | SECURITY_ADMIN               | `privacy`     |
| `GET /audit/log`                 | AUDITOR, DPO, SECURITY_ADMIN | `audit-query` |
| `GET /audit/data-access`         | AUDITOR, DPO, SECURITY_ADMIN | `audit-query` |
| `GET /audit/me/data-access`      | PATIENT                      | `audit-me`    |

## Endpoints

| UC       | Método / Ruta                                     | Resumen                                                                          | Permiso          |
| -------- | ------------------------------------------------- | -------------------------------------------------------------------------------- | ---------------- |
| UC-10-01 | `POST /audit/data-access`                         | Registrar acceso/lectura clínica (accounting WORM) + provenance                  | `SECURITY_ADMIN` |
| UC-10-04 | `POST /audit/events`                              | Registrar provenance de un cambio y **sellar la cadena hash** (incluye UC-10-03) | `SECURITY_ADMIN` |
| UC-10-05 | `GET /audit/history/{entity}/{id}?as_of=`         | Consultar historial / línea de tiempo (audita la propia lectura)                 | `SECURITY_ADMIN` |
| UC-10-06 | `POST /audit/integrity/verify`                    | Verificar integridad tamper-evidence y atestar                                   | `SECURITY_ADMIN` |
| UC-10-07 | `POST /compliance/audit-export`                   | Exportar evidencia de auditoría (idempotente por `query_hash`)                   | `SECURITY_ADMIN` |
| UC-10-08 | `POST /privacy/dsar` · `PATCH /privacy/dsar/{id}` | Tramitar DSAR (máquina de estados)                                               | `SECURITY_ADMIN` |
| UC-10-09 | `POST /audit/retention/apply`                     | Aplicar retención / archivado / litigation-hold                                  | `SECURITY_ADMIN` |
| UC-10-10 | `POST /audit/anomaly/scan`                        | Detectar acceso anómalo                                                          | `SECURITY_ADMIN` |
| UC-10-11 | `POST /moderation/decisions`                      | Registrar decisión de moderación / gobernanza                                    | `SECURITY_ADMIN` |
| UC-10-12 | `POST /audit/third-party-access`                  | Registrar acceso delegado / de tercero gobernado                                 | `SECURITY_ADMIN` |

### Quién accedió a mi historia (PAC-HIST-004 / PAC-HIST-005)

`GET /audit/me/data-access` es el autoservicio del paciente sobre `audit.data_access_log`. La
vista de plataforma (`GET /audit/data-access`) sigue reservada a los roles de auditoría.

- **El sujeto sale de la cuenta.** El paciente se resuelve por el vínculo activo
  `person_account_links` → `patient_profiles`; no hay parámetro de paciente, de usuario ni de
  organización, así que la consulta no puede apuntar a otra historia. Una cuenta sin persona o sin
  perfil de paciente recibe `404` (`AUDIT_PATIENT_PROFILE_NOT_FOUND`).
- **Qué devuelve cada acceso:** `id`, `accessedAt`, `accessor` (`kind`: `SELF`, `PRACTITIONER` u
  `OTHER`; `displayName` de la persona vinculada a esa cuenta, `null` si no tiene o si es el propio
  titular), `operation`, `resourceType` (el tipo de dato) y `purpose` (la finalidad declarada).
  No devuelve contenido clínico, IP, identificador del recurso, organización, base legal ni el
  identificador de la cuenta de quien accedió.
- **Filtros:** `from`, `to` (rango semiabierto), `excludeOwn=true` (omite los accesos del propio
  titular) y paginación por cursor (`limit` 1–100, 25 por omisión; `nextCursor` opaco). Orden:
  más reciente primero.
- **Es en sí un acceso.** La ruta lleva `@AccessLogged({ resourceType: 'PATIENT_DATA_ACCESS_LOG',
patient: 'actor' })`: cada consulta deja su fila con finalidad `PATIENT_ACCESS`, y esa fila
  aparece como `SELF` en la consulta siguiente.
- **Alcance actual:** sólo el titular. El apoderado de `profiles.patient_portal_proxies` no consulta
  el registro de quien representa; su alcance (`scope_value_set_id`) no define hoy un valor para
  esto.

### Casos de uso sin endpoint HTTP

- **UC-10-02** (versionar aggregate) — patrón trigger `AFTER`/outbox en la tx del
  cambio de negocio; se inserta en `audit.<tabla>_history`. El helper de versionado
  vive en `ModerationRepository.recordHistory` y en la lectura de `HistoryRepository`.
- **UC-10-03** (sellar cadena hash) — plegado en línea al insertar `audit_log`
  (`AuditLogRepository.append`), expuesto vía `POST /audit/events`.
- **UC-10-13** (proyección cross-store a search/time_series) — consumidor de
  `messaging.outbox_events`; nunca modifica las tablas WORM de origen.

## Entidades y reglas de persistencia

- **Append-only (WORM)**: `audit_log`, `data_access_log`, `patient_content_access_log`,
  `analytics_governance_log`, `moderation_events`, `delegated_access_audit_log`,
  `insurance_decision_access_log`, `identity_verification_access_log`,
  `pharmacy_inventory_access_log` y todas las `*_history`. Solo tienen `recorded_at`
  / `recorded_by_user_id` (u `occurred_at`): no se fija `rowVersion` ni `updated_at`,
  no se hace `UPDATE` ni `DELETE` (las correcciones son filas nuevas).
- **Con ciclo de vida**: `dsar_requests` (tiene `row_version` optimista +
  `created_at`/`updated_at`); se usa `createdBy()`/`touch()` y nunca se fija
  `row_version`.
- **Cadena hash** (`audit_log`): cada fila enlaza con la anterior de su partición de
  tenant (`previous_hash`) y sella `record_hash = H(previous_hash || contenido ||
recorded_at)`. La verificación no cubre las cadenas que superan su corte de
  lectura.
- FKs planas uuid: MikroORM no ordena inserts → `await tx.flush()` entre padre e
  hijo (p. ej. `dsar_requests` antes de su gobernanza/provenance). `em.create(...,
{ partial: true })` en todos los inserts.

## Conceptos

Declarados en `audit.concepts.ts` con prefijo `audit` (`AUDIT_CONCEPT_SEEDS`, `AUD`).
Cubren acciones, bases legales, propósitos de uso, decisiones, gobernanza, tipos y
estados DSAR, jurisdicciones, tipos/acciones/razones de moderación y operaciones de
versionado. El resultado reutiliza los transversales `CONCEPTS.OUTCOME_SUCCESS/FAILURE`.

## Logs

Pino estructurado por operación (`audit.event.record`, `audit.integrity.verify`,
`audit.dsar.update`, …). Nunca se registran secretos ni PHI; solo ids y metadatos.

## Tests

- Unit: `services/*.service.spec.ts` (mockean repos/`em`) y `controllers/*.controller.spec.ts`
  (mockean servicios). `corepack yarn test src/modules/audit --runInBand --silent`:
  8 suites y 38 pruebas aprobadas durante la revisión.
- Smoke transversal: `test/smoke/modules/audit.smoke.ts` (`AUDIT_SMOKE`).
