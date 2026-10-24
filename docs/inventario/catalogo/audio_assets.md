<!-- AUTOGENERADO por tools/inventario/catalogo.mjs. No editar manualmente. -->

# Catálogo del schema `audio_assets`

- **Tablas:** 4 · **Columnas:** 69 (2 con descripción: 2.9 %) · **Índices:** 10
- **Dominio:** sin dato
- Método y límites del catálogo: [README del inventario](../README.md)

## Tablas

| Tabla | Propósito | Columnas | Índices | Operaciones | ORM |
|---|---|---|---|---|---|
| [audio_assets](#audio_assets) | Cataloga audios sintetizados y cacheados a partir de plantillas aprobadas para reutilizar recursos de voz. | 33 | 6 | 24 | COINCIDE |
| [audio_generation_events](#audio_generation_events) | Traza generación de audio, su costo y resultado para gobernar consumo de proveedores de voz. | 13 | 2 | 12 | COINCIDE |
| [audio_generation_usage](#audio_generation_usage) | Acumula uso de síntesis de audio por período para controlar presupuesto y facturación de proveedores. | 10 | 1 | 3 | COINCIDE |
| [audio_templates](#audio_templates) | Define textos registrados que pueden convertirse a voz en experiencias acotadas como onboarding. | 13 | 1 | 2 | COINCIDE |

### Tablas sin relaciones dentro del schema

`audio_assets.audio_assets` · `audio_assets.audio_generation_events` · `audio_assets.audio_generation_usage` · `audio_assets.audio_templates`

## Fichas

### audio_assets

#### Vista general

Cataloga audios sintetizados y cacheados a partir de plantillas aprobadas para reutilizar recursos de voz.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_64_audio_assets.puml: audio_assets; BIZ note`
- **Dominio:** sin dato · **Diagrama:** `Mantra Core Health Context/modules/diagram_64_audio_assets.puml` · **DDL:** `SQL/64_audio_assets/02_tables.sql`
- **Entidad del ORM:** `AudioAssets` — `src/modules/audio_assets/entities/audio_assets.entity.ts`
- **Resumen:** 33 columnas · 6 índices · 1 FK salientes · 0 entrantes · 24 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `asset_key` | `char(64)` | Obligatoria | _sin dato_ | coincide |
| 3 | `tenant_id` | `uuid` | Clave foránea → directory.tenants.id; Opcional | Tenant propietario, o `NULL` cuando el audio es compartido por la plataforma. Sólo lo llevan los assets cuyo texto renderizado incluye un valor dinámico que puede identificar a una persona (`PERSON_NAME`, `SAFE_TEXT`). Los `STATIC`, los `FALLBACK` y los `ENUMERATED` —conjunto cerrado— siguen siendo compartidos, que es lo que permite pre-generarlos una sola vez para todos. Entra además en `asset_key` y en la búsqueda de binario reutilizable: sin eso, dos tenants compartirían la fila del audio del nombre de un paciente y un acierto de caché delataría que ese nombre existe en el otro tenant. _(JSDOC_ENTIDAD, `src/modules/audio_assets/entities/audio_assets.entity.ts:24`)_ | coincide |
| 4 | `template_key` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 5 | `template_version` | `integer` | Obligatoria | _sin dato_ | coincide |
| 6 | `strategy` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 7 | `language` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 8 | `normalized_value_hash` | `char(64)` | Opcional | _sin dato_ | coincide |
| 9 | `display_value_encrypted` | `text` | Obligatoria | _sin dato_ | coincide |
| 10 | `rendered_text_hash` | `char(64)` | Obligatoria | _sin dato_ | coincide |
| 11 | `provider` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 12 | `provider_model` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 13 | `voice_profile` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 14 | `voice_provider_ref` | `varchar` | Opcional | _sin dato_ | coincide |
| 15 | `voice_version` | `integer` | Obligatoria | _sin dato_ | coincide |
| 16 | `normalizer_version` | `integer` | Obligatoria | _sin dato_ | coincide |
| 17 | `audio_format` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 18 | `sample_rate` | `integer` | Opcional | _sin dato_ | coincide |
| 19 | `storage_provider` | `varchar` | Opcional | _sin dato_ | coincide |
| 20 | `storage_key` | `varchar` | Opcional | _sin dato_ | coincide |
| 21 | `bytes` | `integer` | Opcional | _sin dato_ | coincide |
| 22 | `duration_ms` | `integer` | Opcional | _sin dato_ | coincide |
| 23 | `checksum_sha256` | `char(64)` | Opcional | _sin dato_ | coincide |
| 24 | `generation_status` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 25 | `failure_code` | `varchar` | Opcional | _sin dato_ | coincide |
| 26 | `budget_reserved_units` | `integer` | Opcional | _sin dato_ | coincide |
| 27 | `budget_period_key` | `varchar(7)` | Opcional | Ventana mensual (`YYYY-MM`) contra la que se apartó la reserva. Se persiste porque la liquidación y la devolución ocurren **después**, y pueden caer en otro mes: un asset que reserva el día 31 y se genera el 1 imputaría su consumo a una ventana sin fila de reserva —el `UPDATE` no afectaría ninguna fila, el consumo se perdería y el mes anterior se quedaría con crédito apartado para siempre—. _(JSDOC_ENTIDAD, `src/modules/audio_assets/entities/audio_assets.entity.ts:129`)_ | coincide |
| 28 | `generated_at` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 29 | `last_used_at` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 30 | `use_count` | `integer` | Obligatoria | _sin dato_ | coincide |
| 31 | `metadata` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 32 | `created_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 33 | `updated_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | tenant_id | directory.tenants (id) | fk_audio_assets_tenant_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `uq_audio_assets_asset_key` | sí | asset_key | Garantiza que no se repita la combinación (asset_key) _(DOCUMENTO)_; 1 consulta(s) de repositorio filtran u ordenan por «asset_key», la primera columna del índice _(CONSULTA)_ |
| `ix_audio_assets_template_status` | no | template_key, template_version, generation_status | _sin uso detectado estáticamente_ |
| `ix_audio_assets_last_used_at` | no | last_used_at | _sin uso detectado estáticamente_ |
| `ix_audio_assets_synthesis_reuse` | no | rendered_text_hash, provider, provider_model, voice_version, generation_status | _sin uso detectado estáticamente_ |
| `ix_audio_assets_tenant_reuse` | no | tenant_id, rendered_text_hash, generation_status | Soporta la clave foránea fk_audio_assets_tenant_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_audio_assets_tenant_id` | no | tenant_id | Soporta la clave foránea fk_audio_assets_tenant_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |

#### Restricciones

| Restricción | Tipo | Definición |
|---|---|---|
| `uq_audio_assets_asset_key` | UNIQUE INDEX | UNIQUE INDEX ("asset_key") |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| GET /audio-assets/{assetId}/content | ACTUALIZA | POR_SQL |
| GET /audio-assets/{assetId}/content | LEE | DIRECTA |
| POST /audio-assets/resolve | ACTUALIZA | POR_SQL |
| POST /audio-assets/resolve | CREA | POR_SQL |
| POST /audio-assets/resolve | LEE | DIRECTA |
| POST /internal/audio-assets/{assetId}/deprecate | ACTUALIZA | POR_TIPO |
| POST /internal/audio-assets/{assetId}/deprecate | LEE | DIRECTA |
| POST /internal/audio-assets/{assetId}/generation-failed | ACTUALIZA | DIRECTA |
| POST /internal/audio-assets/{assetId}/generation-failed | LEE | DIRECTA |
| POST /internal/audio-assets/{assetId}/prepare-generation | ACTUALIZA | DIRECTA |
| POST /internal/audio-assets/{assetId}/prepare-generation | LEE | DIRECTA |
| POST /internal/audio-assets/garbage-collect | ACTUALIZA | POR_SQL |
| POST /internal/audio-assets/garbage-collect | LEE | DIRECTA |
| POST /internal/audio-assets/pregenerate | ACTUALIZA | POR_SQL |
| POST /internal/audio-assets/pregenerate | CREA | POR_SQL |
| POST /internal/audio-assets/pregenerate | LEE | DIRECTA |
| GET /internal/audio-assets/status | LEE | POR_SQL |
| POST /internal/audio-assets/verify | LEE | DIRECTA |
| POST /internal/storage-lifecycle/audio/{assetId}/abort | LEE | DIRECTA |
| POST /internal/storage-lifecycle/audio/{assetId}/begin | LEE | DIRECTA |
| POST /internal/storage-lifecycle/audio/{assetId}/dispatch | LEE | DIRECTA |
| POST /internal/identity/evidence/lifecycle-scan | LEE | POR_SQL |
| POST /internal/identity/evidence/storage-purge-review | LEE | POR_SQL |
| POST /internal/governance/retention-executions/run | LEE | POR_SQL |

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | no declarado | — |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### audio_generation_events

#### Vista general

Traza generación de audio, su costo y resultado para gobernar consumo de proveedores de voz.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_64_audio_assets.puml: audio_generation_events`
- **Dominio:** sin dato · **Diagrama:** `Mantra Core Health Context/modules/diagram_64_audio_assets.puml` · **DDL:** `SQL/64_audio_assets/02_tables.sql`
- **Entidad del ORM:** `AudioGenerationEvents` — `src/modules/audio_assets/entities/audio_generation_events.entity.ts`
- **Resumen:** 13 columnas · 2 índices · 0 FK salientes · 0 entrantes · 12 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `asset_key` | `char(64)` | Opcional | _sin dato_ | coincide |
| 3 | `event_type` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 4 | `provider` | `varchar` | Opcional | _sin dato_ | coincide |
| 5 | `template_key` | `varchar` | Opcional | _sin dato_ | coincide |
| 6 | `outcome` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 7 | `error_code` | `varchar` | Opcional | _sin dato_ | coincide |
| 8 | `duration_ms` | `integer` | Opcional | _sin dato_ | coincide |
| 9 | `estimated_cost_units` | `integer` | Opcional | _sin dato_ | coincide |
| 10 | `correlation_id` | `varchar` | Opcional | _sin dato_ | coincide |
| 11 | `trace_id` | `varchar` | Opcional | _sin dato_ | coincide |
| 12 | `metadata` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 13 | `created_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_audio_generation_events_asset_created` | no | asset_key, ("created_at" DESC) | _sin uso detectado estáticamente_ |
| `ix_audio_generation_events_template_created` | no | template_key, ("created_at" DESC) | _sin uso detectado estáticamente_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /internal/audio-assets/{assetId}/deprecate | CREA | DIRECTA |
| POST /internal/audio-assets/{assetId}/deprecate | GUARDA | POR_TIPO |
| POST /internal/audio-assets/{assetId}/generated | CREA | DIRECTA |
| POST /internal/audio-assets/{assetId}/generated | GUARDA | POR_TIPO |
| POST /internal/audio-assets/{assetId}/generation-failed | CREA | DIRECTA |
| POST /internal/audio-assets/{assetId}/generation-failed | GUARDA | POR_TIPO |
| POST /internal/audio-assets/{assetId}/prepare-generation | CREA | DIRECTA |
| POST /internal/audio-assets/{assetId}/prepare-generation | GUARDA | POR_TIPO |
| POST /internal/audio-assets/garbage-collect | CREA | DIRECTA |
| POST /internal/audio-assets/garbage-collect | GUARDA | POR_TIPO |
| POST /internal/audio-assets/verify | CREA | DIRECTA |
| POST /internal/audio-assets/verify | GUARDA | POR_TIPO |

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | no declarado | — |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### audio_generation_usage

#### Vista general

Acumula uso de síntesis de audio por período para controlar presupuesto y facturación de proveedores.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_64_audio_assets.puml: audio_generation_usage`
- **Dominio:** sin dato · **Diagrama:** `Mantra Core Health Context/modules/diagram_64_audio_assets.puml` · **DDL:** `SQL/64_audio_assets/02_tables.sql`
- **Entidad del ORM:** `AudioGenerationUsage` — `src/modules/audio_assets/entities/audio_generation_usage.entity.ts`
- **Resumen:** 10 columnas · 1 índices · 0 FK salientes · 0 entrantes · 3 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `period_key` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 3 | `provider` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 4 | `estimated_credits` | `integer` | Obligatoria | _sin dato_ | coincide |
| 5 | `consumed_credits` | `integer` | Opcional | _sin dato_ | coincide |
| 6 | `request_count` | `integer` | Obligatoria | _sin dato_ | coincide |
| 7 | `success_count` | `integer` | Obligatoria | _sin dato_ | coincide |
| 8 | `failure_count` | `integer` | Obligatoria | _sin dato_ | coincide |
| 9 | `created_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 10 | `updated_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `uq_audio_generation_usage_period_provider` | sí | period_key, provider | Garantiza que no se repita la combinación (period_key, provider) _(DOCUMENTO)_; 1 consulta(s) de repositorio filtran u ordenan por «period_key», la primera columna del índice _(CONSULTA)_ |

#### Restricciones

| Restricción | Tipo | Definición |
|---|---|---|
| `uq_audio_generation_usage_period_provider` | UNIQUE INDEX | UNIQUE INDEX ("period_key", "provider") |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /audio-assets/resolve | LEE | DIRECTA |
| POST /internal/audio-assets/{assetId}/prepare-generation | LEE | DIRECTA |
| POST /internal/audio-assets/pregenerate | LEE | DIRECTA |

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | no declarado | — |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### audio_templates

#### Vista general

Define textos registrados que pueden convertirse a voz en experiencias acotadas como onboarding.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_64_audio_assets.puml: audio_templates; BIZ note`
- **Dominio:** sin dato · **Diagrama:** `Mantra Core Health Context/modules/diagram_64_audio_assets.puml` · **DDL:** `SQL/64_audio_assets/02_tables.sql`
- **Entidad del ORM:** `AudioTemplates` — `src/modules/audio_assets/entities/audio_templates.entity.ts`
- **Resumen:** 13 columnas · 1 índices · 0 FK salientes · 0 entrantes · 2 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `template_key` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 3 | `version` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `strategy` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 5 | `language` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 6 | `text_template` | `text` | Obligatoria | _sin dato_ | coincide |
| 7 | `fallback_text` | `text` | Opcional | _sin dato_ | coincide |
| 8 | `dynamic_fields_json` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 9 | `voice_profile` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 10 | `enabled` | `boolean` | Obligatoria | _sin dato_ | coincide |
| 11 | `metadata` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 12 | `created_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 13 | `updated_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `uq_audio_templates_key_version` | sí | template_key, version | Garantiza que no se repita la combinación (template_key, version) _(DOCUMENTO)_; 3 consulta(s) de repositorio filtran u ordenan por «template_key», la primera columna del índice _(CONSULTA)_ |

#### Restricciones

| Restricción | Tipo | Definición |
|---|---|---|
| `uq_audio_templates_key_version` | UNIQUE INDEX | UNIQUE INDEX ("template_key", "version") |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /audio-assets/resolve | LEE | DIRECTA |
| POST /internal/audio-assets/pregenerate | LEE | DIRECTA |

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | no declarado | — |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

