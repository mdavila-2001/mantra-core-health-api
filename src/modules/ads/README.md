# Módulo 43 — Publicidad, Assets, Entrega, Comercio y Optimización

Estructura de cuentas publicitarias y socios, conexión con plataformas externas, jerarquía de
campaña, cortafuegos de datos de evento, ingesta de entrega, conversiones, catálogo de productos,
experimentos, reglas automatizadas, moderación, facturación y captura de leads.

## Rutas HTTP y alcance (medido)

<!-- Medido el 2026-10-08 sobre origin/dev (dae4fd68). Repetir con:
  find src/modules/ads -name '*.controller.ts' | wc -l
  find src/modules/ads -name '*.controller.ts' -exec grep -hE "^\s*@(Get|Post|Put|Patch|Delete)\(" {} + | wc -l
  find src/modules/ads -name '*.entity.ts' | wc -l
  find src/modules/ads -name '*.service.ts' | wc -l
La tabla sale de los decoradores `@Controller`/`@Get`/`@Post`/`@Put`/`@Patch`/`@Delete`, `@Roles` y `@Public`. -->

El módulo tiene **1 controller, 18 rutas HTTP, 73 entidades y 4 servicios**. La columna *Acceso* sale del código: `pública` = `@Public()`; un rol = `@Roles(...)`; `sesión` = sin ninguno de los dos, o sea que sólo exige sesión autenticada (guards globales `JwtAuthGuard`, `TenantScopeGuard`, `RolesGuard`, `VerifiedIdentityGuard`). La autorización por recurso puede vivir además en el servicio y no se refleja acá.

Si una tabla narrativa más abajo difiere de ésta (prefijo del controller omitido, sufijos `:accion` de la spec en lugar de sub-rutas), manda ésta: sale del código.

Su `*.module.ts` no declara `imports` de otros módulos.

Entidades (`tableName`, 73 de 73 archivos `*.entity.ts`): `ad_account_users`, `ad_accounts`, `ad_billing_events`, `ad_creatives`, `ad_event_data_policies`, `ad_event_field_rules`, `ad_experiments`, `ad_identity_asset_assignments`, `ad_identity_assets`, `ad_invoice_lines`, `ad_invoices`, `ad_partners`, `ad_placements`, `ad_platform_connections`, `ad_policy_appeals`, `ad_policy_violations`, `ad_review_events`, `ad_sets`, `ad_sync_checkpoints`, `ad_sync_runs`, `ads`, `adset_learning_snapshots`, `attribution_settings`, `automated_rules`, `blocked_ad_events`, `brand_lift_studies`, `budget_schedules`, `business_managers`, `campaigns`, `catalog_feeds`, `catalog_products`, `collection_ads`, `conversion_attributions`, `conversion_datasets`, `conversion_event_custom_data`, `conversion_event_deduplication`, `conversion_event_delivery_attempts`, `conversion_event_user_data`, `creative_assets`, `custom_audiences`, `custom_conversions`, `dataset_connections`, `dataset_quality_snapshots`, `delivery_status_snapshots`, `dynamic_ad_templates`, `experiment_variants`, `external_ad_object_snapshots`, `feed_run_logs`, `frequency_caps`, `insight_breakdown_definitions`, `insight_fact_rows`, `insight_metric_definitions`, `insight_query_runs`, `insights_daily`, `lead_answers`, `lead_delivery_events`, `lead_form_questions`, `lead_forms`, `lead_submissions`, `lookalike_specs`, `offline_conversion_events`, `offline_conversion_sets`, `partner_relationships`, `pixel_events`, `product_catalogs`, `product_localizations`, `product_set_members`, `product_sets`, `rule_executions`, `saved_audiences`, `server_conversion_events`, `targeting_specs`, `tracking_pixels`.

| Método y ruta | Acceso | Controller |
| --- | --- | --- |
| `POST /ads/business-managers/:bmId/ad-accounts` | ADS_ADMIN, BUSINESS_ADMIN | `ads` |
| `POST /ads/business-managers/:bmId/partners` | ADS_ADMIN, BUSINESS_ADMIN | `ads` |
| `POST /ads/platform-connections` | ADS_ADMIN, BUSINESS_ADMIN | `ads` |
| `POST /ads/ad-accounts/:id/campaigns/launch` | AD_OPS, ADS_ADMIN | `ads` |
| `POST /ads/ad-accounts/:id/targeting` | AD_OPS, ADS_ADMIN | `ads` |
| `POST /ads/ad-sets/:id/identity` | AD_OPS, ADS_ADMIN | `ads` |
| `POST /ads/event-data-policies` | DATA_PRIVACY_OFFICER, ADS_ADMIN | `ads` |
| `POST /ads/ingest/insights` | SYSTEM | `ads` |
| `POST /ads/datasets/:id/events` | SYSTEM, ADS_ADMIN | `ads` |
| `POST /ads/offline-conversion-sets/upload` | AD_OPS, ADS_ADMIN | `ads` |
| `POST /ads/ad-accounts/:id/experiments` | AD_OPS, ADS_ADMIN | `ads` |
| `POST /ads/automated-rules/:id/evaluate` | SYSTEM, ADS_ADMIN | `ads` |
| `POST /ads/ads/:id/review-events` | POLICY_REVIEWER, SYSTEM, ADS_ADMIN | `ads` |
| `POST /ads/policy-violations/:id/appeals` | POLICY_REVIEWER, AD_OPS, ADS_ADMIN | `ads` |
| `POST /ads/catalogs/:id/feeds/:feedId/run` | SYSTEM, ADS_ADMIN | `ads` |
| `POST /ads/ad-accounts/:id/invoices/issue` | FINANCE, ADS_ADMIN | `ads` |
| `POST /ads/lead-forms/:id/submissions` | SYSTEM, AD_OPS, ADS_ADMIN | `ads` |
| `POST /ads/ad-sets/:id/budget-schedules` | AD_OPS, ADS_ADMIN | `ads` |

## Casos de uso cubiertos (16)

| UC | Endpoint | Descripción |
| --- | --- | --- |
| UC-43-01 | `POST /ads/business-managers/:bmId/ad-accounts` | Provisionar cuenta publicitaria |
| UC-43-02 | `POST /ads/business-managers/:bmId/partners` | Vincular socio y compartir assets |
| UC-43-03 | `POST /ads/platform-connections` | Conectar plataforma e importar identidades |
| UC-43-04 | `POST /ads/ad-accounts/:id/campaigns/launch` | Lanzar campaña completa |
| UC-43-05 | `POST /ads/ad-accounts/:id/targeting` · `POST /ads/ad-sets/:id/identity` | Segmentación e identidad |
| UC-43-06 | `POST /ads/event-data-policies` | Política de datos y reglas de campo |
| UC-43-07 | `POST /ads/ingest/insights` | Ingerir entrega y consolidar gasto |
| UC-43-08 | `POST /ads/datasets/:id/events` | Conversión server-side con dedup |
| UC-43-09 | `POST /ads/offline-conversion-sets/upload` | Conversiones offline con match |
| UC-43-10 | `POST /ads/ad-accounts/:id/experiments` | Experimento A/B |
| UC-43-11 | `POST /ads/automated-rules/:id/evaluate` | Aplicar regla automatizada |
| UC-43-12 | `POST /ads/ads/:id/review-events` · `POST /ads/policy-violations/:id/appeals` | Moderación y apelación |
| UC-43-13 | `POST /ads/catalogs/:id/feeds/:feedId/run` | Sincronizar catálogo |
| UC-43-14 | `POST /ads/ad-accounts/:id/invoices/issue` | Emitir factura de anuncios |
| UC-43-15 | `POST /ads/lead-forms/:id/submissions` | Recibir lead y entregar a CRM |
| UC-43-16 | `POST /ads/ad-sets/:id/budget-schedules` | Programar presupuesto y puja |

## Entidades

El módulo abarca 74 tablas de `ads.*`. Las que se escriben desde aquí:

- **Estructura**: `business_managers`, `ad_accounts`, `ad_account_users`, `ad_partners`,
  `partner_relationships`, `ad_platform_connections`, `ad_identity_assets`,
  `ad_identity_asset_assignments`, `ad_sync_checkpoints`, `ad_sync_runs`.
- **Campaña**: `campaigns`, `ad_sets`, `ad_placements`, `ad_creatives`, `creative_assets`, `ads`,
  `targeting_specs`, `custom_audiences`, `saved_audiences`, `lookalike_specs`, `budget_schedules`,
  `attribution_settings`, `adset_learning_snapshots`.
- **Datos**: `ad_event_data_policies`, `ad_event_field_rules`, `insight_query_runs`,
  `insight_fact_rows`, `insights_daily`, `delivery_status_snapshots`, `ad_billing_events`,
  `conversion_event_deduplication`, `server_conversion_events`, `conversion_event_user_data`,
  `conversion_event_custom_data`, `blocked_ad_events`, `conversion_event_delivery_attempts`,
  `offline_conversion_sets`, `offline_conversion_events`, `catalog_products`, `product_set_members`,
  `feed_run_logs`.
- **Optimización**: `ad_experiments`, `experiment_variants`, `rule_executions`, `ad_review_events`,
  `ad_policy_violations`, `ad_policy_appeals`, `ad_invoices`, `ad_invoice_lines`,
  `lead_submissions`, `lead_answers`, `lead_delivery_events`.

## Flujo general

```
business manager ── ad account (active, amount_spent=0) ── owner con rol admin
        │                    │
        ├─ partner ──> relación vigente (la anterior se cierra)
        └─ platform-connection ──> identidades importadas + sync run

campaña (paused) ── ad set (paused) ── creativo ── anuncio (pending_review)
                          │
                          ├─ identity ──> una asignación vigente por rol
                          └─ budget-schedule ──> tramo sin solape + aprendizaje reiniciado

política de datos (active) ── reglas de campo (block | hash | drop)
                                    │
conversión ── dedup ──> ¿primera? ── política ──> accepted | blocked
                    └─> duplicate_count++

ingesta ── fact rows (append-only) ── rollup diario (se reescribe)
                                            └─> amount_spent += delta ──> aviso al tocar el tope
                                            └─> factura del periodo (líneas por campaña)

feed ── upsert por retailer_product_id ──> item_count e product_count recalculados

review event ── approved ──> efectivo activo + infracciones cerradas
             └─ disapproved ──> infracción abierta + efectivo disapproved ──> apelación

lead form ── submission (idempotente por lead externo) ── respuestas cifradas ──> entrega a CRM
```

## Reglas de negocio

- **Todo nace pausado y en revisión**: la jerarquía completa se crea en una transacción, pero no
  entrega hasta que se active y la plataforma la apruebe. Una jerarquía a medias no debe gastar.
- **El tope de gasto se respeta antes de crear**: lanzar sobre una cuenta que ya lo agotó se
  rechaza, y programar un tramo por encima del tope también.
- **El rollup diario se reescribe, no se acumula**: reingerir el mismo día da el mismo número. El
  gasto de la cuenta sube sólo con el **delta** respecto de lo ya contabilizado.
- **Cortafuegos de datos de salud**: la política de evento decide qué campo se bloquea, se hashea o
  se descarta. Una regla `BLOCK` que aplique tumba el evento entero y lo registra en
  `blocked_ad_events`; sin consentimiento no se procesa lo que la política lo condiciona.
- **Deduplicación navegador/servidor**: el mismo `event_id` llega dos veces (pixel y CAPI) y sólo
  cuenta una; el segundo sube `duplicate_count`.
- **Sólo entra identificación tratada**: hashes, valores cifrados y claves de coincidencia ya
  hasheadas. La IP del lead se guarda hasheada.
- **Una identidad vigente por rol**: asignar otra cierra la anterior en la misma transacción.
- **Una relación de socio vigente**: vincular de nuevo cierra la vigencia previa.
- **El upsert del catálogo es idempotente** por `retailer_product_id`; `item_count` y
  `product_count` se recalculan, no se aceptan.
- **El experimento exige reparto 100 y un solo control**: sin control no hay contra qué comparar.
- **La factura deriva su total de las líneas**, que agregan el consumo por campaña del periodo.
  Facturar dos veces el mismo periodo se rechaza.
- **Un rechazo abre infracción y detiene la entrega**; aprobar cierra las infracciones abiertas. La
  apelación es única por infracción.
- **Cambiar presupuesto o puja reinicia el aprendizaje** del conjunto, y queda anotado.
- **Los webhooks son idempotentes** por identificador externo: revisión y lead reentregados no
  duplican efectos.

## Permisos

`ADS_ADMIN` cubre el módulo. `BUSINESS_ADMIN` provisiona cuentas, vincula socios y conecta
plataformas. `AD_OPS` lanza campañas, define segmentación, sube conversiones offline, crea
experimentos y programa presupuesto. `DATA_PRIVACY_OFFICER` publica la política de datos.
`POLICY_REVIEWER` registra revisiones y apela. `FINANCE` emite facturas. `SYSTEM` ejecuta la
ingesta, la evaluación de reglas, el feed del catálogo, las conversiones y los leads.

## Concurrencia

`FOR UPDATE` sobre cuenta publicitaria (el gasto es un contador compartido), campaña, conjunto,
anuncio, conexión, relación de socio vigente, asignación de identidad vigente, catálogo, feed,
entrada de deduplicación, infracción y regla. `FOR UPDATE SKIP LOCKED` en los conjuntos que evalúa
una regla. `row_version` aporta bloqueo optimista automático.

## Logs

`operation: 'ads.<área>.<acción>'`. Nivel `warn` cuando la cuenta alcanza su tope de gasto, cuando
la política bloquea un evento y cuando la plataforma rechaza un anuncio. Nunca se loguean payloads
de conversión, respuestas de leads ni identificadores de usuario.

## Pruebas

`yarn test --testPathPatterns=ads` — 99 pruebas de servicio + delegación del controlador.

## Pendiente

- **Empuje a la plataforma**: `ad_sync_runs` registra la importación, pero el *export* de la
  jerarquía (`CampaignLaunchRequested`, `AutomatedActionApplied`, `BudgetScheduleApplied`) se
  emitirá por outbox cuando exista el módulo 35. `external_campaign_ref`, `external_adset_ref` y
  `external_ad_ref` quedan sin poblar hasta que la plataforma responda.
- **Intento de pago de la factura**: `ad_invoices.payment_intent_id` queda sin poblar; crear el
  intento pertenece a payments, y el asiento contable al módulo 16 (misma frontera que el
  `journal_transaction_id` de ERP).
- **Entrega del lead al CRM**: se encola el intento (`lead_delivery_events` en `queued`) y
  `crm_lead_id` queda sin poblar hasta que el outbox cree el lead.
- **Entrega efectiva de conversiones**: `conversion_event_delivery_attempts` registra el primer
  intento en `queued`; el reintento con `retry_at` lo gobernará el worker de entrega.
- **Tamaño de audiencias**: `approximate_count` y `approximate_reach` nacen en cero; los publica la
  plataforma.
- **Localizaciones de producto**: `product_localizations` se poblará cuando el feed traiga
  variantes por idioma y país.
