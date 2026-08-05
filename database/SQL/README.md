# database / SQL

Agrupa los componentes relacionados con **sql** y mantiene cohesionada esta responsabilidad del sistema.

## Contenido

### Subcarpetas

- [`00_shared/`](./00_shared/README.md): componentes de 00 shared.
- [`01_iam/`](./01_iam/README.md): componentes de 01 iam.
- [`02_common/`](./02_common/README.md): componentes de 02 common.
- [`03_terminology/`](./03_terminology/README.md): componentes de 03 terminology.
- [`04_directory/`](./04_directory/README.md): componentes de 04 directory.
- [`05_profiles/`](./05_profiles/README.md): componentes de 05 profiles.
- [`06_authz/`](./06_authz/README.md): componentes de 06 authz.
- [`07_consent/`](./07_consent/README.md): componentes de 07 consent.
- [`08_clinical/`](./08_clinical/README.md): componentes de 08 clinical.
- [`09_forms/`](./09_forms/README.md): componentes de 09 forms.
- [`10_audit/`](./10_audit/README.md): componentes de 10 audit.
- [`11_system_ops/`](./11_system_ops/README.md): componentes de 11 system ops.
- [`12_integrations/`](./12_integrations/README.md): componentes de 12 integrations.
- [`13_geo/`](./13_geo/README.md): componentes de 13 geo.
- [`14_practice/`](./14_practice/README.md): componentes de 14 practice.
- [`15_chart/`](./15_chart/README.md): componentes de 15 chart.
- [`16_accounting/`](./16_accounting/README.md): componentes de 16 accounting.
- [`17_billing/`](./17_billing/README.md): componentes de 17 billing.
- [`18_clinical_ext/`](./18_clinical_ext/README.md): componentes de 18 clinical ext.
- [`19_community/`](./19_community/README.md): componentes de 19 community.
- [`20_diagnostics/`](./20_diagnostics/README.md): componentes de 20 diagnostics.
- [`22_organization_extensions/`](./22_organization_extensions/README.md): componentes de 22 organization extensions.
- [`23_diagnostic_units/`](./23_diagnostic_units/README.md): componentes de 23 diagnostic units.
- [`24_pharmacy/`](./24_pharmacy/README.md): componentes de 24 pharmacy.
- [`25_pharmacy_inventory/`](./25_pharmacy_inventory/README.md): componentes de 25 pharmacy inventory.
- [`26_insurance/`](./26_insurance/README.md): componentes de 26 insurance.
- [`27_identity_assurance/`](./27_identity_assurance/README.md): componentes de 27 identity assurance.
- [`28_telemetry/`](./28_telemetry/README.md): componentes de 28 telemetry.
- [`29_delegated_access/`](./29_delegated_access/README.md): componentes de 29 delegated access.
- [`30_read_models/`](./30_read_models/README.md): componentes de 30 read models.
- [`31_integration_contracts/`](./31_integration_contracts/README.md): componentes de 31 integration contracts.
- [`32_workflow/`](./32_workflow/README.md): componentes de 32 workflow.
- [`35_messaging/`](./35_messaging/README.md): componentes de 35 messaging.
- [`36_qa_lab/`](./36_qa_lab/README.md): componentes de 36 qa lab.
- [`37_tracking/`](./37_tracking/README.md): componentes de 37 tracking.
- [`38_erp/`](./38_erp/README.md): componentes de 38 erp.
- [`39_reporting/`](./39_reporting/README.md): componentes de 39 reporting.
- [`40_auth_providers/`](./40_auth_providers/README.md): componentes de 40 auth providers.
- [`41_scheduling/`](./41_scheduling/README.md): componentes de 41 scheduling.
- [`42_payments/`](./42_payments/README.md): componentes de 42 payments.
- [`43_ads/`](./43_ads/README.md): componentes de 43 ads.
- [`44_health_context/`](./44_health_context/README.md): componentes de 44 health context.
- [`45_system_context/`](./45_system_context/README.md): componentes de 45 system context.
- [`46_platform_ops/`](./46_platform_ops/README.md): componentes de 46 platform ops.
- [`47_education/`](./47_education/README.md): componentes de 47 education.
- [`48_automation/`](./48_automation/README.md): componentes de 48 automation.
- [`49_crm/`](./49_crm/README.md): componentes de 49 crm.
- [`50_marketing/`](./50_marketing/README.md): componentes de 50 marketing.
- [`51_promotions/`](./51_promotions/README.md): componentes de 51 promotions.
- [`52_health_data/`](./52_health_data/README.md): componentes de 52 health data.
- [`53_procedures_perioperative/`](./53_procedures_perioperative/README.md): componentes de 53 procedures perioperative.
- [`54_polyglot_storage/`](./54_polyglot_storage/README.md): componentes de 54 polyglot storage.
- [`60_object_storage/`](./60_object_storage/README.md): componentes de 60 object storage.
- [`61_graph_intelligence/`](./61_graph_intelligence/README.md): componentes de 61 graph intelligence.
- [`62_cross_store_consistency/`](./62_cross_store_consistency/README.md): componentes de 62 cross store consistency.
- [`63_lakehouse/`](./63_lakehouse/README.md): componentes de 63 lakehouse.
- [`99_migrations/`](./99_migrations/README.md): componentes de 99 migrations.
- [`99_rls/`](./99_rls/README.md): componentes de 99 rls.

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `_generation_report.md` | Implementación o recurso de soporte de esta carpeta. |
| `apply_all.sql` | Implementación o recurso de soporte de esta carpeta. |
| `apply_deferred.sql` | Implementación o recurso de soporte de esta carpeta. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
