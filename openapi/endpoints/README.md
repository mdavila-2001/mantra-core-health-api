<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Referencia ultra detallada de endpoints

Esta referencia documenta **1640 de 1640 operaciones HTTP** registradas en `openapi/openapi.json`, agrupadas en **72 módulos**. Cada endpoint incluye módulo, nombre, descripciones de negocio y sistema, parámetros, payload mínimo, restricciones, payload completo, respuesta exitosa y errores posibles.

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
| [accounting](accounting.md) | 46 | `accounting-accruals`, `accounting-assets`, `accounting-cockpit`, `accounting-collections`, `accounting-fiscal`, `accounting-fx`, `accounting-ledger`, `accounting-liabilities`, `accounting-practitioner`, `accounting-subledger` | 10 |
| [ads](ads.md) | 20 | `ads`, `ads-collections` | 2 |
| [app](app.md) | 6 | `app` | 2 |
| [audio_assets](audio-assets.md) | 10 | `audio-assets`, `audio-assets-internal` | 2 |
| [audit](audit.md) | 13 | `audit`, `audit-compliance`, `audit-moderation`, `audit-privacy` | 5 |
| [auth_providers](auth-providers.md) | 15 | `auth-providers`, `auth-providers-collections` | 2 |
| [authz](authz.md) | 36 | `authz-admin`, `authz-care-relationships`, `authz-catalog`, `authz-clinical`, `authz-collections`, `authz-grants`, `authz-me`, `authz-pdp`, `authz-policies`, `authz-roles` | 10 |
| [automation](automation.md) | 20 | `automation`, `automation-collections` | 3 |
| [billing](billing.md) | 35 | `billing-collections`, `billing-operations`, `billing-payables`, `billing-receivables`, `billing-service-catalog`, `billing-simulated` | 6 |
| [chart](chart.md) | 23 | `chart-care-plans`, `chart-documents`, `chart-encounters`, `chart-me`, `chart-notes`, `chart-read`, `chart-templates` | 7 |
| [clinical](clinical.md) | 44 | `clinical-collections`, `clinical-encounters`, `clinical-me`, `clinical-observations`, `clinical-orders`, `clinical-prescription-policies`, `clinical-prescriptions`, `clinical-prescriptions-public`, `clinical-read`, `clinical-records` | 10 |
| [clinical_ext](clinical-ext.md) | 30 | `clinical-ext-alerts`, `clinical-ext-care-gaps`, `clinical-ext-care-teams`, `clinical-ext-cds`, `clinical-ext-collections`, `clinical-ext-order-sets`, `clinical-ext-prescription-favorites`, `clinical-ext-referrals`, `clinical-ext-virtual-encounters` | 9 |
| [common](common.md) | 19 | `common/addresses`, `common/contact-points`, `common/files`, `common/identifiers`, `internal/files`, `internal/storage-lifecycle` | 6 |
| [community](community.md) | 99 | `community`, `community-collections`, `community-feed`, `community-groups`, `community-messaging`, `community-moderation`, `community-polls`, `community-public`, `community-ratings`, `community-reviews`, `community-social`, `community-timeline` | 15 |
| [consent](consent.md) | 28 | `consent-collections`, `consent-consents`, `consent-evidence`, `consent-hipaa-authorizations`, `consent-internal`, `consent-me`, `consent-patient-objections`, `consent-practitioner-access`, `consent-privacy-restrictions`, `consent-processing-legal-bases`, `consent-treatment-informed-consents` | 12 |
| [content_packs](content-packs.md) | 2 | `content-packs` | 1 |
| [crm](crm.md) | 22 | `crm`, `crm-collections` | 2 |
| [cross_store_consistency](cross-store-consistency.md) | 23 | `cross-store-consistency-collections`, `cross_store_consistency` | 3 |
| [data_catalog](data-catalog.md) | 37 | `admin-catalog`, `admin-portal`, `data-catalog-internal` | 3 |
| [delegated_access](delegated-access.md) | 12 | `delegated-access-authz`, `delegated-access-org`, `delegated-access-permission-sets`, `delegated-access-practitioner-delegates`, `delegated-access-requests` | 5 |
| [diagnostic_units](diagnostic-units.md) | 21 | `diagnostic-equipment`, `diagnostic-pricing`, `diagnostic-unit-accreditations`, `diagnostic-unit-sites`, `diagnostic-units` | 5 |
| [diagnostics](diagnostics.md) | 32 | `diagnostics-collections`, `diagnostics-imaging`, `diagnostics-laboratory`, `diagnostics-orders`, `diagnostics-patient-results`, `diagnostics-reception`, `diagnostics-reports`, `diagnostics-specimens` | 8 |
| [directory](directory.md) | 23 | `directory-admin-tenants`, `directory-tenants` | 3 |
| [document_store](document-store.md) | 5 | `document-store` | 1 |
| [education](education.md) | 15 | `education`, `education-collections` | 2 |
| [erp](erp.md) | 23 | `erp`, `erp-collections` | 2 |
| [forms](forms.md) | 25 | `forms-assignments`, `forms-definition-sets`, `forms-fields`, `forms-instances`, `forms-me`, `forms-values` | 6 |
| [geo](geo.md) | 12 | `geo-collections`, `geo-geofences`, `geo-tracked-subjects`, `geo-tracking-sessions`, `geo-trips` | 5 |
| [graph_intelligence](graph-intelligence.md) | 20 | `graph-intelligence-collections`, `graph_intelligence` | 3 |
| [health_context](health-context.md) | 13 | `health-context` | 1 |
| [health_data](health-data.md) | 16 | `fhir-r5`, `health-data` | 2 |
| [iam](iam.md) | 35 | `iam-auth`, `iam-users` | 3 |
| [identity_assurance](identity-assurance.md) | 29 | `identity-assertions`, `identity-authorities`, `identity-checks`, `identity-collections`, `identity-manual-review`, `identity-policies`, `identity-self-service`, `identity-verification-cases`, `identity_assurance` | 9 |
| [insurance](insurance.md) | 55 | `insurance`, `insurance-analytics`, `insurance-appeals`, `insurance-backbone`, `insurance-broker-commission`, `insurance-catalog`, `insurance-claims`, `insurance-claims-read`, `insurance-coverage`, `insurance-portability`, `insurance-portability-public`, `insurance-practitioner-settlement`, `insurance-prior-auth`, `insurance-read`, `insurance-reconciliation`, `insurer-patients`, `insurer-received-claims`, `my-insurance-claims` | 18 |
| [insurance-campaigns](insurance-campaigns.md) | 16 | `insurance-campaigns` | 0 |
| [integration_contracts](integration-contracts.md) | 12 | `integration-contracts`, `integration-exchanges` | 2 |
| [integrations](integrations.md) | 18 | `integrations-collections`, `integrations-connections`, `integrations-messages`, `integrations-providers`, `integrations-webhooks` | 5 |
| [lakehouse](lakehouse.md) | 17 | `lakehouse`, `lakehouse-collections` | 3 |
| [marketing](marketing.md) | 17 | `marketing`, `marketing-collections` | 3 |
| [medical_groups](medical-groups.md) | 8 | `medical-groups` | 1 |
| [messaging](messaging.md) | 18 | `messaging`, `messaging-collections`, `messaging-internal`, `messaging-webhooks` | 4 |
| [object_storage](object-storage.md) | 16 | `dicomweb`, `object-storage`, `object-storage-collections` | 3 |
| [ops_console](ops-console.md) | 9 | `ops-console` | 1 |
| [organization_extensions](organization-extensions.md) | 12 | `organization-extensions-collections`, `orgext-affiliations`, `orgext-data-boundaries`, `orgext-facility-licenses`, `orgext-hospitals` | 5 |
| [payments](payments.md) | 19 | `payments`, `payments-collections`, `payments-intents`, `payments-transactions` | 4 |
| [pharma_lab](pharma-lab.md) | 76 | `pharma-lab-catalog`, `pharma-lab-notices`, `pharma-lab-pharmacovigilance`, `pharma-lab-reference`, `pharma-lab-regulatory`, `pharma-lab-social-accounting`, `pharma-lab-visit-agenda`, `pharma-lab-visit-records`, `pharma-lab-visit-requests`, `pharma-lab-visit-surveys`, `pharma-lab-visitors`, `pharma-labs` | 12 |
| [pharmacy](pharmacy.md) | 24 | `pharmacy`, `pharmacy-directory`, `pharmacy-public` | 3 |
| [pharmacy_inventory](pharmacy-inventory.md) | 29 | `pharmacy-inventory`, `pharmacy-inventory-directory`, `pharmacy-inventory-internal`, `pharmacy-orders` | 6 |
| [platform_ops](platform-ops.md) | 20 | `platform-ops`, `platform-ops-collections` | 2 |
| [polyglot_storage](polyglot-storage.md) | 17 | `polyglot-finops`, `polyglot-governance`, `polyglot-ops`, `polyglot-storage-collections` | 4 |
| [practice](practice.md) | 30 | `practice` | 6 |
| [procedures_perioperative](procedures-perioperative.md) | 32 | `dental-procedures`, `procedure-cases` | 2 |
| [profiles](profiles.md) | 57 | `profiles-affiliations`, `profiles-patients`, `profiles-practitioners` | 5 |
| [promotions](promotions.md) | 20 | `loyalty`, `promotions`, `promotions-collections` | 3 |
| [public](public.md) | 2 | `public-catalog` | 1 |
| [qa_execution](qa-execution.md) | 9 | `qa-execution`, `qa-execution-internal` | 2 |
| [qa_lab](qa-lab.md) | 22 | `qa`, `qa-internal`, `qa-lab-collections`, `qa-lab-read` | 4 |
| [quotations](quotations.md) | 3 | `quotations` | 1 |
| [read_models](read-models.md) | 15 | `read-models`, `read-models-public`, `read-models-views` | 3 |
| [redis_runtime](redis-runtime.md) | 5 | `redis-runtime` | 1 |
| [reporting](reporting.md) | 18 | `reporting`, `reporting-collections` | 2 |
| [scheduling](scheduling.md) | 59 | `scheduling`, `scheduling-agenda`, `scheduling-bookings`, `scheduling-confirmation`, `scheduling-internal`, `scheduling-tenant-agenda` | 7 |
| [search_platform](search-platform.md) | 3 | `search_platform` | 1 |
| [surveys](surveys.md) | 17 | `surveys-assignments`, `surveys-patient`, `surveys-templates` | 3 |
| [system_context](system-context.md) | 15 | `system-context`, `system-context-collections` | 2 |
| [system_ops](system-ops.md) | 31 | `system-ops-assessments`, `system-ops-backup`, `system-ops-collections`, `system-ops-drafts`, `system-ops-governance`, `system-ops-legal-holds`, `system-ops-residency`, `system-ops-restore`, `system-ops-retention` | 9 |
| [telemetry](telemetry.md) | 22 | `telemetry-analytics`, `telemetry-consent`, `telemetry-events`, `telemetry-governance` | 4 |
| [terminology](terminology.md) | 26 | `terminology`, `terminology-collections` | 8 |
| [time_series](time-series.md) | 14 | `time_series` | 2 |
| [tracking](tracking.md) | 14 | `tracking`, `tracking-collections` | 2 |
| [vector_rag](vector-rag.md) | 22 | `vector-rag-collections`, `vector_rag` | 3 |
| [workflow](workflow.md) | 12 | `workflow`, `workflow-collections` | 4 |

## Regeneración y control de cobertura

```bash
yarn docs:endpoints:generate
```

La generación falla si la cantidad documentada difiere de las 1640 operaciones encontradas. Los archivos de esta carpeta son derivados; los cambios permanentes deben hacerse en decoradores, DTOs, controladores, servicios o en el generador.
