# database / Mantra Core Health Context / modules

Agrupa los componentes relacionados con **modules** y mantiene cohesionada esta responsabilidad del sistema.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `diagram_00_platform.puml` | Implementación o recurso de soporte de esta carpeta. |
| `diagram_01_iam.puml` | Implementación o recurso de soporte de esta carpeta. |
| `diagram_02_common.puml` | Implementación o recurso de soporte de esta carpeta. |
| `diagram_03_terminology.puml` | Implementación o recurso de soporte de esta carpeta. |
| `diagram_04_directory.puml` | Implementación o recurso de soporte de esta carpeta. |
| `diagram_05_profiles.puml` | Implementación o recurso de soporte de esta carpeta. |
| `diagram_06_authz.puml` | Implementación o recurso de soporte de esta carpeta. |
| `diagram_07_consent.puml` | Implementación o recurso de soporte de esta carpeta. |
| `diagram_08_clinical.puml` | Implementación o recurso de soporte de esta carpeta. |
| `diagram_09_forms.puml` | Implementación o recurso de soporte de esta carpeta. |
| `diagram_10_audit.puml` | Implementación o recurso de soporte de esta carpeta. |
| `diagram_11_system_ops.puml` | Implementación o recurso de soporte de esta carpeta. |
| `diagram_12_integrations.puml` | Implementación o recurso de soporte de esta carpeta. |
| `diagram_13_geo.puml` | Implementación o recurso de soporte de esta carpeta. |
| `diagram_14_practice.puml` | Implementación o recurso de soporte de esta carpeta. |
| `diagram_15_chart.puml` | Implementación o recurso de soporte de esta carpeta. |
| `diagram_16_accounting.puml` | Implementación o recurso de soporte de esta carpeta. |
| `diagram_17_billing.puml` | Implementación o recurso de soporte de esta carpeta. |
| `diagram_18_clinical_ext.puml` | Implementación o recurso de soporte de esta carpeta. |
| `diagram_19_community.puml` | Implementación o recurso de soporte de esta carpeta. |
| `diagram_20_diagnostics.puml` | Implementación o recurso de soporte de esta carpeta. |
| `diagram_21_deployment.puml` | Implementación o recurso de soporte de esta carpeta. |
| `diagram_22_organization_extensions.puml` | Implementación o recurso de soporte de esta carpeta. |
| `diagram_23_diagnostic_units.puml` | Implementación o recurso de soporte de esta carpeta. |
| `diagram_24_pharmacy.puml` | Implementación o recurso de soporte de esta carpeta. |
| `diagram_25_pharmacy_inventory.puml` | Implementación o recurso de soporte de esta carpeta. |
| `diagram_26_insurance.puml` | Implementación o recurso de soporte de esta carpeta. |
| `diagram_27_identity_assurance.puml` | Implementación o recurso de soporte de esta carpeta. |
| `diagram_28_telemetry.puml` | Implementación o recurso de soporte de esta carpeta. |
| `diagram_29_delegated_access.puml` | Implementación o recurso de soporte de esta carpeta. |
| `diagram_30_read_models.puml` | Implementación o recurso de soporte de esta carpeta. |
| `diagram_31_integration_contracts.puml` | Implementación o recurso de soporte de esta carpeta. |
| `diagram_32_workflow.puml` | Implementación o recurso de soporte de esta carpeta. |
| `diagram_33_integrity.puml` | Implementación o recurso de soporte de esta carpeta. |
| `diagram_34_portal_catalog.puml` | Implementación o recurso de soporte de esta carpeta. |
| `diagram_35_messaging.puml` | Implementación o recurso de soporte de esta carpeta. |
| `diagram_36_qa_lab.puml` | Implementación o recurso de soporte de esta carpeta. |
| `diagram_37_tracking.puml` | Implementación o recurso de soporte de esta carpeta. |
| `diagram_38_erp.puml` | Implementación o recurso de soporte de esta carpeta. |
| `diagram_39_reporting.puml` | Implementación o recurso de soporte de esta carpeta. |
| `diagram_40_auth_providers.puml` | Implementación o recurso de soporte de esta carpeta. |
| `diagram_41_scheduling.puml` | Implementación o recurso de soporte de esta carpeta. |
| `diagram_42_payments.puml` | Implementación o recurso de soporte de esta carpeta. |
| `diagram_43_ads.puml` | Implementación o recurso de soporte de esta carpeta. |
| `diagram_44_health_context.puml` | Implementación o recurso de soporte de esta carpeta. |
| `diagram_45_system_context.puml` | Implementación o recurso de soporte de esta carpeta. |
| `diagram_46_platform_ops.puml` | Implementación o recurso de soporte de esta carpeta. |
| `diagram_47_education.puml` | Implementación o recurso de soporte de esta carpeta. |
| `diagram_48_automation.puml` | Implementación o recurso de soporte de esta carpeta. |
| `diagram_49_crm.puml` | Implementación o recurso de soporte de esta carpeta. |
| `diagram_50_marketing.puml` | Implementación o recurso de soporte de esta carpeta. |
| `diagram_51_promotions.puml` | Implementación o recurso de soporte de esta carpeta. |
| `diagram_52_health_data_platform.puml` | Implementación o recurso de soporte de esta carpeta. |
| `diagram_53_procedures_perioperative.puml` | Implementación o recurso de soporte de esta carpeta. |
| `diagram_54_polyglot_storage.puml` | Implementación o recurso de soporte de esta carpeta. |
| `diagram_55_document_store.puml` | Implementación o recurso de soporte de esta carpeta. |
| `diagram_56_redis_runtime.puml` | Implementación o recurso de soporte de esta carpeta. |
| `diagram_57_search_platform.puml` | Implementación o recurso de soporte de esta carpeta. |
| `diagram_58_time_series.puml` | Implementación o recurso de soporte de esta carpeta. |
| `diagram_59_vector_rag.puml` | Implementación o recurso de soporte de esta carpeta. |
| `diagram_60_object_storage.puml` | Implementación o recurso de soporte de esta carpeta. |
| `diagram_61_graph_intelligence.puml` | Implementación o recurso de soporte de esta carpeta. |
| `diagram_62_cross_store_consistency.puml` | Implementación o recurso de soporte de esta carpeta. |
| `diagram_63_lakehouse.puml` | Implementación o recurso de soporte de esta carpeta. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
