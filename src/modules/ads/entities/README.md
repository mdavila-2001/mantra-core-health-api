# src / modules / ads / entities

Entidades y relaciones que representan el modelo persistente.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `ad_account_users.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `ad_accounts.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `ad_billing_events.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `ad_creatives.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `ad_event_data_policies.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `ad_event_field_rules.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `ad_experiments.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `ad_identity_asset_assignments.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `ad_identity_assets.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `ad_invoice_lines.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `ad_invoices.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `ad_partners.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `ad_placements.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `ad_platform_connections.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `ad_policy_appeals.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `ad_policy_violations.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `ad_review_events.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `ad_sets.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `ad_sync_checkpoints.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `ad_sync_runs.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `ads.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `adset_learning_snapshots.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `attribution_settings.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `automated_rules.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `blocked_ad_events.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `brand_lift_studies.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `budget_schedules.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `business_managers.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `campaigns.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `catalog_feeds.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `catalog_products.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `collection_ads.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `conversion_attributions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `conversion_datasets.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `conversion_event_custom_data.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `conversion_event_deduplication.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `conversion_event_delivery_attempts.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `conversion_event_user_data.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `creative_assets.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `custom_audiences.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `custom_conversions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `dataset_connections.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `dataset_quality_snapshots.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `delivery_status_snapshots.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `dynamic_ad_templates.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `experiment_variants.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `external_ad_object_snapshots.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `feed_run_logs.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `frequency_caps.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `index.ts` | Punto de exportación pública de la carpeta. |
| `insight_breakdown_definitions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `insight_fact_rows.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `insight_metric_definitions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `insight_query_runs.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `insights_daily.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `lead_answers.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `lead_delivery_events.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `lead_form_questions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `lead_forms.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `lead_submissions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `lookalike_specs.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `offline_conversion_events.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `offline_conversion_sets.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `partner_relationships.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `pixel_events.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `product_catalogs.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `product_localizations.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `product_set_members.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `product_sets.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `rule_executions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `saved_audiences.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `server_conversion_events.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `targeting_specs.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `tracking_pixels.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
