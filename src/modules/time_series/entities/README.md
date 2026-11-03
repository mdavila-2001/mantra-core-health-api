# src / modules / time series / entities

Entidades y relaciones que representan el modelo persistente.

## Contents

### Files

| Archivo | Responsabilidad |
| --- | --- |
| `ads_delivery_event_series.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `ai_runtime_metric_series.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `application_tracking_series.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `audit_access_metric_series.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `device_raw_reading_series.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `index.ts` | Public export barrel for this folder. |
| `ingestion_pipeline_metric_series.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `lab_analyzer_event_series.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `location_ping_series.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `normalized_vital_series.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `payment_gateway_metric_series.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `service_sli_series.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `telemetry_event_series.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |

## Maintenance guidelines

- Keep business rules outside transport adapters.
- Document decisions, preconditions, parameters, return values, and relevant errors with TSDoc.
- Update this index when a component is added, removed, or its responsibility changes.
