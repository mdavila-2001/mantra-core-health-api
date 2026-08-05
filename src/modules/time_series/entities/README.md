# src / modules / time series / entities

Entidades y relaciones que representan el modelo persistente.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `ads_delivery_event_series.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `ai_runtime_metric_series.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `application_tracking_series.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `audit_access_metric_series.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `device_raw_reading_series.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `index.ts` | Punto de exportación pública de la carpeta. |
| `ingestion_pipeline_metric_series.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `lab_analyzer_event_series.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `location_ping_series.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `normalized_vital_series.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `payment_gateway_metric_series.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `service_sli_series.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `telemetry_event_series.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
