# database / NoSQL / 57 search platform opensearch

Agrupa los componentes relacionados con **57 search platform opensearch** y mantiene cohesionada esta responsabilidad del sistema.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `ads_insight_search_docs.mapping.json` | Configuración o datos estructurados de soporte. |
| `audit_event_search_docs.mapping.json` | Configuración o datos estructurados de soporte. |
| `authorized_patient_record_search_docs.mapping.json` | Configuración o datos estructurados de soporte. |
| `community_content_search_docs.mapping.json` | Configuración o datos estructurados de soporte. |
| `contract_search_docs.mapping.json` | Configuración o datos estructurados de soporte. |
| `crm_activity_search_docs.mapping.json` | Configuración o datos estructurados de soporte. |
| `education_content_search_docs.mapping.json` | Configuración o datos estructurados de soporte. |
| `medication_catalog_search_docs.mapping.json` | Configuración o datos estructurados de soporte. |
| `organization_directory_search_docs.mapping.json` | Configuración o datos estructurados de soporte. |
| `provider_directory_search_docs.mapping.json` | Configuración o datos estructurados de soporte. |
| `search_index_templates.mapping.json` | Configuración o datos estructurados de soporte. |
| `search_platform.index-config.md` | Implementación o recurso de soporte de esta carpeta. |
| `technical_log_search_docs.mapping.json` | Configuración o datos estructurados de soporte. |
| `terminology_search_docs.mapping.json` | Configuración o datos estructurados de soporte. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
