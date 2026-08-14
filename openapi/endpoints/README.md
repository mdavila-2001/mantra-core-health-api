<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Referencia ultra detallada de endpoints

Esta referencia documenta **966 de 966 operaciones HTTP** registradas en `openapi/openapi.json`, agrupadas en **62 módulos**. Cada endpoint incluye módulo, nombre, descripciones de negocio y sistema, parámetros, payload mínimo, restricciones, payload completo, respuesta exitosa y errores posibles.

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
| [accounting](accounting.md) | 24 | `accounting-accruals`, `accounting-assets`, `accounting-fiscal`, `accounting-fx`, `accounting-ledger`, `accounting-liabilities`, `accounting-subledger` | 7 |
| [ads](ads.md) | 18 | `ads` | 1 |
| [app](app.md) | 6 | `app` | 2 |
| [audio_assets](audio-assets.md) | 10 | `audio-assets`, `audio-assets-internal` | 2 |
| [audit](audit.md) | 11 | `audit`, `audit-compliance`, `audit-moderation`, `audit-privacy` | 4 |
| [auth_providers](auth-providers.md) | 12 | `auth-providers` | 1 |
| [authz](authz.md) | 21 | `authz-care-relationships`, `authz-catalog`, `authz-clinical`, `authz-grants`, `authz-pdp`, `authz-policies`, `authz-roles` | 7 |
| [automation](automation.md) | 17 | `automation` | 2 |
| [billing](billing.md) | 13 | `billing-operations`, `billing-payables`, `billing-receivables` | 3 |
| [chart](chart.md) | 16 | `chart-care-plans`, `chart-documents`, `chart-notes`, `chart-read`, `chart-templates` | 5 |
| [clinical](clinical.md) | 24 | `clinical-encounters`, `clinical-observations`, `clinical-orders`, `clinical-prescription-policies`, `clinical-read`, `clinical-records` | 6 |
| [clinical_ext](clinical-ext.md) | 23 | `clinical-ext-alerts`, `clinical-ext-care-gaps`, `clinical-ext-care-teams`, `clinical-ext-cds`, `clinical-ext-order-sets`, `clinical-ext-referrals`, `clinical-ext-virtual-encounters` | 7 |
| [common](common.md) | 14 | `common/addresses`, `common/contact-points`, `common/files`, `common/identifiers`, `internal/files` | 5 |
| [community](community.md) | 38 | `community-feed`, `community-groups`, `community-messaging`, `community-moderation`, `community-polls`, `community-reviews`, `community-social`, `community-timeline` | 8 |
| [consent](consent.md) | 12 | `consent-consents`, `consent-evidence`, `consent-hipaa-authorizations`, `consent-internal`, `consent-patient-objections`, `consent-privacy-restrictions`, `consent-processing-legal-bases`, `consent-treatment-informed-consents` | 8 |
| [crm](crm.md) | 16 | `crm` | 1 |
| [cross_store_consistency](cross-store-consistency.md) | 16 | `cross_store_consistency` | 2 |
| [delegated_access](delegated-access.md) | 11 | `delegated-access-authz`, `delegated-access-org`, `delegated-access-permission-sets`, `delegated-access-practitioner-delegates`, `delegated-access-requests` | 5 |
| [diagnostic_units](diagnostic-units.md) | 16 | `diagnostic-equipment`, `diagnostic-pricing`, `diagnostic-unit-accreditations`, `diagnostic-unit-sites`, `diagnostic-units` | 5 |
| [diagnostics](diagnostics.md) | 21 | `diagnostics-imaging`, `diagnostics-laboratory`, `diagnostics-orders`, `diagnostics-reports`, `diagnostics-specimens` | 5 |
| [directory](directory.md) | 16 | `directory-admin-tenants`, `directory-tenants` | 2 |
| [document_store](document-store.md) | 5 | `document-store` | 1 |
| [education](education.md) | 14 | `education` | 1 |
| [erp](erp.md) | 17 | `erp` | 1 |
| [forms](forms.md) | 13 | `forms-assignments`, `forms-definition-sets`, `forms-fields`, `forms-instances`, `forms-values` | 5 |
| [geo](geo.md) | 10 | `geo-geofences`, `geo-tracked-subjects`, `geo-tracking-sessions`, `geo-trips` | 4 |
| [graph_intelligence](graph-intelligence.md) | 15 | `graph_intelligence` | 2 |
| [health_context](health-context.md) | 13 | `health-context` | 1 |
| [health_data](health-data.md) | 16 | `fhir-r5`, `health-data` | 2 |
| [iam](iam.md) | 30 | `iam-auth`, `iam-users` | 2 |
| [identity_assurance](identity-assurance.md) | 24 | `identity-assertions`, `identity-authorities`, `identity-checks`, `identity-manual-review`, `identity-policies`, `identity-self-service`, `identity-verification-cases`, `identity_assurance` | 8 |
| [insurance](insurance.md) | 23 | `insurance-appeals`, `insurance-backbone`, `insurance-broker-commission`, `insurance-claims`, `insurance-coverage`, `insurance-prior-auth`, `insurance-reconciliation` | 7 |
| [integration_contracts](integration-contracts.md) | 12 | `integration-contracts`, `integration-exchanges` | 2 |
| [integrations](integrations.md) | 15 | `integrations-connections`, `integrations-messages`, `integrations-providers`, `integrations-webhooks` | 4 |
| [lakehouse](lakehouse.md) | 13 | `lakehouse` | 2 |
| [marketing](marketing.md) | 14 | `marketing` | 2 |
| [messaging](messaging.md) | 13 | `messaging`, `messaging-internal`, `messaging-webhooks` | 3 |
| [object_storage](object-storage.md) | 13 | `dicomweb`, `object-storage` | 2 |
| [organization_extensions](organization-extensions.md) | 9 | `orgext-affiliations`, `orgext-data-boundaries`, `orgext-facility-licenses`, `orgext-hospitals` | 4 |
| [payments](payments.md) | 14 | `payments`, `payments-intents`, `payments-transactions` | 3 |
| [pharmacy](pharmacy.md) | 11 | `pharmacy` | 1 |
| [pharmacy_inventory](pharmacy-inventory.md) | 15 | `pharmacy-inventory`, `pharmacy-inventory-internal` | 4 |
| [platform_ops](platform-ops.md) | 15 | `platform-ops` | 1 |
| [polyglot_storage](polyglot-storage.md) | 15 | `polyglot-finops`, `polyglot-governance`, `polyglot-ops` | 3 |
| [practice](practice.md) | 16 | `practice` | 5 |
| [procedures_perioperative](procedures-perioperative.md) | 31 | `dental-procedures`, `procedure-cases` | 2 |
| [profiles](profiles.md) | 18 | `profiles-patients`, `profiles-practitioners` | 2 |
| [promotions](promotions.md) | 15 | `loyalty`, `promotions` | 2 |
| [qa_lab](qa-lab.md) | 13 | `qa`, `qa-internal` | 2 |
| [read_models](read-models.md) | 15 | `read-models`, `read-models-public`, `read-models-views` | 3 |
| [redis_runtime](redis-runtime.md) | 5 | `redis-runtime` | 1 |
| [reporting](reporting.md) | 12 | `reporting` | 1 |
| [scheduling](scheduling.md) | 26 | `scheduling`, `scheduling-agenda`, `scheduling-bookings`, `scheduling-confirmation`, `scheduling-internal` | 5 |
| [search_platform](search-platform.md) | 3 | `search_platform` | 1 |
| [system_context](system-context.md) | 13 | `system-context` | 1 |
| [system_ops](system-ops.md) | 24 | `system-ops-assessments`, `system-ops-backup`, `system-ops-drafts`, `system-ops-governance`, `system-ops-legal-holds`, `system-ops-residency`, `system-ops-restore`, `system-ops-retention` | 8 |
| [telemetry](telemetry.md) | 13 | `telemetry-consent`, `telemetry-events`, `telemetry-governance` | 3 |
| [terminology](terminology.md) | 16 | `terminology` | 6 |
| [time_series](time-series.md) | 14 | `time_series` | 2 |
| [tracking](tracking.md) | 11 | `tracking` | 1 |
| [vector_rag](vector-rag.md) | 16 | `vector_rag` | 2 |
| [workflow](workflow.md) | 11 | `workflow` | 3 |

## Regeneración y control de cobertura

```bash
yarn docs:endpoints:generate
```

La generación falla si la cantidad documentada difiere de las 966 operaciones encontradas. Los archivos de esta carpeta son derivados; los cambios permanentes deben hacerse en decoradores, DTOs, controladores, servicios o en el generador.
