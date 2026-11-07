<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Referencia ultra detallada de endpoints

Esta referencia documenta **2022 de 2022 operaciones HTTP** registradas en `openapi/openapi.json`, agrupadas en **79 módulos**. Cada endpoint incluye módulo, nombre, descripciones de negocio y sistema, parámetros, payload mínimo, restricciones, payload completo, respuesta exitosa y errores posibles.

## Cómo interpretar la referencia

- **Fuente contractual:** rutas, métodos, parámetros, seguridad, DTOs de entrada y status exitosos proceden de `openapi.json`.
- **Fuente de implementación:** controlador, roles, UUID pipes, servicio delegado, tipo TypeScript de retorno y excepciones explícitas se extraen del AST de `src/`.
- **Payload mínimo:** contiene solo propiedades marcadas como obligatorias. Si el objeto no tiene campos obligatorios, `{}` es el body estructural mínimo; las reglas de negocio todavía pueden exigir coherencia entre campos opcionales.
- **Payload completo:** incluye todos los campos documentados. Es un ejemplo sintáctico; UUID, códigos de catálogo y referencias deben existir en el tenant real.
- **Respuestas:** el OpenAPI actual no enlaza schemas de respuesta. Cuando el retorno TypeScript coincide con un DTO Swagger, esta referencia lo muestra como evidencia de implementación, señalando expresamente la brecha contractual.
- **Errores:** se combinan errores transversales reales con excepciones detectadas en los servicios alcanzables desde el controlador. No todos los errores son alcanzables en todas las ramas de ejecución.

## Reglas transversales

- Autenticación JWT Bearer por defecto; solo las operaciones con `security: []` son públicas.
- Validación global con transformación implícita, `whitelist: true` y `forbidNonWhitelisted: true`.
- Límite de body JSON/urlencoded: 1 MB. Archivos grandes siguen flujos de almacenamiento de objetos.
- Rate limit global: 300 solicitudes cada 60 segundos por instancia; autenticación aplica límites más estrictos.
- Aislamiento multi-tenant mediante el contexto del actor y, cuando corresponda, `X-Tenant-Id`.
- Errores normalizados como `{ code, message, correlationId?, details?, timestamp, path }`.
- Respuestas trazables mediante la cabecera `x-trace-id`.

## Forma general del error

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Error de validación",
  "correlationId": "req-01J00000000000000000000000",
  "details": {
    "violations": [
      "email must be an email"
    ]
  },
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/ruta"
}
```

## Módulos

| Módulo | Endpoints | Etiquetas OpenAPI | Controladores |
|---|---:|---|---:|
| [accounting](accounting.md) | 68 | `accounting`, `accounting-accruals`, `accounting-assets`, `accounting-cockpit`, `accounting-fiscal`, `accounting-fx`, `accounting-ledger`, `accounting-liabilities`, `accounting-practitioner`, `accounting-report-templates`, `accounting-subledger` | 12 |
| [ads](ads.md) | 18 | `ads` | 1 |
| [app](app.md) | 7 | `app` | 2 |
| [audio_assets](audio-assets.md) | 10 | `audio-assets`, `audio-assets-internal` | 2 |
| [audit](audit.md) | 18 | `audit`, `audit-compliance`, `audit-me`, `audit-moderation`, `audit-privacy` | 6 |
| [auth_providers](auth-providers.md) | 12 | `auth-providers` | 1 |
| [authz](authz.md) | 49 | `authz-admin`, `authz-care-relationships`, `authz-catalog`, `authz-clinical`, `authz-governance`, `authz-grants`, `authz-me`, `authz-pdp`, `authz-policies`, `authz-practitioner-requests`, `authz-roles` | 13 |
| [automation](automation.md) | 17 | `automation` | 2 |
| [billing](billing.md) | 56 | `admin-catalogs-services`, `billing-operations`, `billing-payables`, `billing-receivables`, `billing-service-catalog`, `billing-simulated`, `billing-space-charges`, `patient-spending` | 8 |
| [bulk_import](bulk-import.md) | 7 | `bulk-import` | 1 |
| [chart](chart.md) | 23 | `chart-care-plans`, `chart-documents`, `chart-encounters`, `chart-me`, `chart-notes`, `chart-read`, `chart-templates` | 7 |
| [clinical](clinical.md) | 62 | `clinical-adt`, `clinical-census`, `clinical-encounters`, `clinical-me`, `clinical-observations`, `clinical-orders`, `clinical-prescription-expiry`, `clinical-prescription-policies`, `clinical-prescriptions`, `clinical-prescriptions-public`, `clinical-read`, `clinical-records` | 13 |
| [clinical_ext](clinical-ext.md) | 34 | `clinical-ext-alerts`, `clinical-ext-care-gaps`, `clinical-ext-care-teams`, `clinical-ext-cds`, `clinical-ext-order-sets`, `clinical-ext-prescription-favorites`, `clinical-ext-referrals`, `clinical-ext-virtual-encounters` | 8 |
| [common](common.md) | 19 | `common/addresses`, `common/contact-points`, `common/files`, `common/identifiers`, `internal/files`, `internal/storage-lifecycle` | 6 |
| [community](community.md) | 102 | `community`, `community-feed`, `community-groups`, `community-messaging`, `community-moderation`, `community-polls`, `community-public`, `community-ratings`, `community-reviews`, `community-social`, `community-timeline` | 15 |
| [consent](consent.md) | 28 | `consent-consents`, `consent-evidence`, `consent-hipaa-authorizations`, `consent-internal`, `consent-me`, `consent-patient-objections`, `consent-practitioner-access`, `consent-privacy-restrictions`, `consent-processing-legal-bases`, `consent-treatment-informed-consents` | 11 |
| [content_packs](content-packs.md) | 2 | `content-packs` | 1 |
| [crm](crm.md) | 16 | `crm` | 1 |
| [cross_store_consistency](cross-store-consistency.md) | 16 | `cross_store_consistency` | 2 |
| [data_catalog](data-catalog.md) | 50 | `admin-catalog`, `admin-portal`, `data-catalog-governance`, `data-catalog-internal` | 7 |
| [delegated_access](delegated-access.md) | 45 | `clinical-prescription-shares`, `clinical-prescription-shares-public`, `delegated-access-affiliation-invitations`, `delegated-access-authz`, `delegated-access-governance`, `delegated-access-org`, `delegated-access-permission-sets`, `delegated-access-practitioner-delegates`, `delegated-access-requests`, `delegated-access-support-staff` | 12 |
| [diagnostic_units](diagnostic-units.md) | 47 | `diagnostic-equipment`, `diagnostic-pricing`, `diagnostic-unit-accreditations`, `diagnostic-unit-sites`, `diagnostic-units`, `diagnostics-lab-portal`, `diagnostics-patient-results` | 9 |
| [diagnostics](diagnostics.md) | 63 | `diagnostics-imaging`, `diagnostics-lab-portal`, `diagnostics-laboratory`, `diagnostics-orders`, `diagnostics-patient-results`, `diagnostics-public`, `diagnostics-reception`, `diagnostics-report-drafts`, `diagnostics-reports`, `diagnostics-specimens` | 14 |
| [directory](directory.md) | 31 | `directory-admin-tenants`, `directory-tenants` | 6 |
| [document_store](document-store.md) | 5 | `document-store` | 1 |
| [education](education.md) | 14 | `education` | 1 |
| [erp](erp.md) | 17 | `erp` | 1 |
| [forms](forms.md) | 25 | `forms-assignments`, `forms-definition-sets`, `forms-fields`, `forms-instances`, `forms-me`, `forms-values` | 6 |
| [geo](geo.md) | 11 | `geo`, `geo-geofences`, `geo-tracked-subjects`, `geo-tracking-sessions`, `geo-trips` | 5 |
| [governance_admin](governance-admin.md) | 5 | `admin-governance-data-quality` | 1 |
| [graph_intelligence](graph-intelligence.md) | 15 | `graph_intelligence` | 2 |
| [health_context](health-context.md) | 13 | `health-context` | 1 |
| [health_data](health-data.md) | 16 | `fhir-r5`, `health-data` | 2 |
| [iam](iam.md) | 49 | `iam-auth`, `iam-onboarding-drafts`, `iam-users` | 6 |
| [identity_assurance](identity-assurance.md) | 28 | `identity-assertions`, `identity-authorities`, `identity-checks`, `identity-manual-review`, `identity-policies`, `identity-self-service`, `identity-verification-cases`, `identity_assurance` | 8 |
| [insurance](insurance.md) | 62 | `insurance`, `insurance-analytics`, `insurance-appeals`, `insurance-backbone`, `insurance-broker-commission`, `insurance-catalog`, `insurance-claims`, `insurance-claims-read`, `insurance-coverage`, `insurance-portability`, `insurance-portability-public`, `insurance-practitioner-requests`, `insurance-practitioner-settlement`, `insurance-prior-auth`, `insurance-read`, `insurance-reconciliation`, `insurer-patients`, `insurer-received-claims`, `my-insurance-claims` | 20 |
| [insurance-campaigns](insurance-campaigns.md) | 16 | `insurance-campaigns` | 0 |
| [integration_contracts](integration-contracts.md) | 12 | `integration-contracts`, `integration-exchanges` | 2 |
| [integrations](integrations.md) | 15 | `integrations-connections`, `integrations-messages`, `integrations-providers`, `integrations-webhooks` | 4 |
| [lakehouse](lakehouse.md) | 13 | `lakehouse` | 2 |
| [marketing](marketing.md) | 31 | `marketing`, `marketing-insights` | 5 |
| [medical_centers](medical-centers.md) | 2 | `medical-centers` | 1 |
| [medical_groups](medical-groups.md) | 14 | `medical-groups` | 1 |
| [messaging](messaging.md) | 23 | `messaging`, `messaging-internal`, `messaging-webhooks` | 5 |
| [object_storage](object-storage.md) | 14 | `dicomweb`, `object-storage` | 2 |
| [observability](observability.md) | 13 | `observability` | 1 |
| [ops_console](ops-console.md) | 11 | `ops-console` | 3 |
| [ops-console](ops-console.md) | 1 | `ops-console` | 0 |
| [organization_extensions](organization-extensions.md) | 9 | `orgext-affiliations`, `orgext-data-boundaries`, `orgext-facility-licenses`, `orgext-hospitals` | 4 |
| [payments](payments.md) | 18 | `payments`, `payments-gateway-dispatches`, `payments-gateway-webhooks`, `payments-intents`, `payments-transactions` | 5 |
| [pharma_lab](pharma-lab.md) | 76 | `pharma-lab-catalog`, `pharma-lab-notices`, `pharma-lab-pharmacovigilance`, `pharma-lab-reference`, `pharma-lab-regulatory`, `pharma-lab-social-accounting`, `pharma-lab-visit-agenda`, `pharma-lab-visit-records`, `pharma-lab-visit-requests`, `pharma-lab-visit-surveys`, `pharma-lab-visitors`, `pharma-labs` | 12 |
| [pharmacy](pharmacy.md) | 39 | `pharmacy`, `pharmacy-directory`, `pharmacy-public` | 4 |
| [pharmacy_inventory](pharmacy-inventory.md) | 47 | `pharmacy-inventory`, `pharmacy-inventory-directory`, `pharmacy-inventory-internal`, `pharmacy-orders`, `pharmacy-prescription-shares` | 10 |
| [platform_ops](platform-ops.md) | 20 | `ops-runtime-pieces`, `ops-tools`, `platform-ops` | 3 |
| [polyglot_storage](polyglot-storage.md) | 15 | `polyglot-finops`, `polyglot-governance`, `polyglot-ops` | 3 |
| [practice](practice.md) | 84 | `practice`, `practice-infrastructure`, `practice-operations` | 17 |
| [procedures_perioperative](procedures-perioperative.md) | 42 | `dental-procedures`, `procedure-cases`, `procedures-perioperative-or` | 3 |
| [profiles](profiles.md) | 85 | `admissions`, `profiles-affiliations`, `profiles-patients`, `profiles-practitioner-admission`, `profiles-practitioners`, `profiles-primary-practitioner` | 9 |
| [promotions](promotions.md) | 19 | `loyalty`, `promotions` | 2 |
| [public](public.md) | 4 | `public-catalog` | 1 |
| [qa_execution](qa-execution.md) | 9 | `qa-execution`, `qa-execution-internal` | 2 |
| [qa_lab](qa-lab.md) | 21 | `qa`, `qa-internal`, `qa-lab-read` | 3 |
| [quotations](quotations.md) | 3 | `quotations` | 1 |
| [read_models](read-models.md) | 15 | `read-models`, `read-models-public`, `read-models-views` | 3 |
| [redis_runtime](redis-runtime.md) | 5 | `redis-runtime` | 1 |
| [reporting](reporting.md) | 13 | `reporting`, `reporting-money` | 2 |
| [scheduling](scheduling.md) | 70 | `scheduling`, `scheduling-agenda`, `scheduling-bookings`, `scheduling-confirmation`, `scheduling-internal`, `scheduling-tenant-agenda` | 8 |
| [search_platform](search-platform.md) | 3 | `search_platform` | 1 |
| [study_catalog](study-catalog.md) | 2 | `study-catalog` | 1 |
| [surveys](surveys.md) | 23 | `surveys-assignments`, `surveys-catalog`, `surveys-insights`, `surveys-patient`, `surveys-service-assignments`, `surveys-templates` | 6 |
| [system_context](system-context.md) | 13 | `system-context` | 1 |
| [system_ops](system-ops.md) | 35 | `system-ops-assessments`, `system-ops-backup`, `system-ops-drafts`, `system-ops-governance`, `system-ops-legal-holds`, `system-ops-residency`, `system-ops-restore`, `system-ops-retention` | 11 |
| [telemetry](telemetry.md) | 35 | `telemetry-analytics`, `telemetry-client-errors`, `telemetry-consent`, `telemetry-events`, `telemetry-governance`, `telemetry-onboarding-analytics`, `telemetry-retention` | 10 |
| [terminology](terminology.md) | 31 | `admin-catalogs-glossary`, `terminology` | 8 |
| [time_series](time-series.md) | 14 | `time_series` | 2 |
| [tracking](tracking.md) | 11 | `tracking` | 1 |
| [ui_visibility](ui-visibility.md) | 9 | `admin-ui-visibility`, `me-ui-visibility` | 2 |
| [vector_rag](vector-rag.md) | 16 | `vector_rag` | 2 |
| [workflow](workflow.md) | 11 | `workflow` | 3 |

## Regeneración y control de cobertura

```bash
yarn docs:endpoints:generate
```

La generación falla si la cantidad documentada difiere de las 2022 operaciones encontradas. Los archivos de esta carpeta son derivados; los cambios permanentes deben hacerse en decoradores, DTOs, controladores, servicios o en el generador.
