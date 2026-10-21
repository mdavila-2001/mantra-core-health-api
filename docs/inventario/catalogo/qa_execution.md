<!-- AUTOGENERADO por tools/inventario/catalogo.mjs. No editar manualmente. -->

# Catálogo del schema `qa_execution`

- **Tablas:** 4 · **Columnas:** 66 (0 con descripción: 0.0 %) · **Índices:** 6
- **Dominio:** sin dato
- Método y límites del catálogo: [README del inventario](../README.md)

## Tablas

| Tabla | Propósito | Columnas | Índices | Operaciones | ORM |
|---|---|---|---|---|---|
| [execution_plans](#execution_plans) | Agrupa objetivos de ejecución en planes de control de calidad del producto de salud y permite asociar aprobaciones y eventos del plan. | 31 | 3 | 0 | SIN_ENTIDAD |
| [execution_targets](#execution_targets) | Define objetivos verificables para los planes de ejecución de calidad, vinculados a los componentes y flujos de la plataforma sanitaria. | 20 | 1 | 0 | SIN_ENTIDAD |
| [plan_approvals](#plan_approvals) | Registra aprobaciones de planes de ejecución de calidad, aportando control de revisión antes de correr verificaciones de la plataforma de salud. | 8 | 1 | 0 | SIN_ENTIDAD |
| [plan_events](#plan_events) | Deja una secuencia de eventos de los planes de calidad para auditar cambios y resultados durante la verificación de la plataforma sanitaria. | 7 | 1 | 0 | SIN_ENTIDAD |

## Diagrama entidad-relación

Las tablas se agrupan en familias por sus claves foráneas dentro del schema (máximo 40 por diagrama). Las FK hacia otros schemas se listan en la ficha de cada tabla.

### Familia 1 de 1 — 4 tablas

```mermaid
erDiagram
  qa_execution_execution_plans["qa_execution.execution_plans"] {
    uuid id PK
    uuid run_id FK
    uuid suite_id FK
    uuid environment_id FK
    uuid target_id FK
    uuid requested_by_user_id FK
    uuid created_by_user_id FK
    uuid updated_by_user_id FK
  }
  qa_execution_execution_targets["qa_execution.execution_targets"] {
    uuid id PK
    uuid environment_id FK
    uuid created_by_user_id FK
    uuid updated_by_user_id FK
  }
  qa_execution_plan_approvals["qa_execution.plan_approvals"] {
    uuid id PK
    uuid plan_id FK
    uuid approver_user_id FK
  }
  qa_execution_plan_events["qa_execution.plan_events"] {
    uuid id PK
    uuid plan_id FK
    uuid case_id FK
  }
  qa_execution_execution_plans }o--|| qa_execution_execution_targets : "target_id"
  qa_execution_plan_approvals }o--|| qa_execution_execution_plans : "plan_id"
  qa_execution_plan_events }o--|| qa_execution_execution_plans : "plan_id"
```

## Fichas

### execution_plans

#### Vista general

Agrupa objetivos de ejecución en planes de control de calidad del producto de salud y permite asociar aprobaciones y eventos del plan.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_68_qa_execution.puml:45: entity execution_plans {`
- **Dominio:** sin dato · **Diagrama:** `Mantra Core Health Context/modules/diagram_68_qa_execution.puml` · **DDL:** `SQL/68_qa_execution/02_tables.sql`
- **Entidad del ORM:** **sin entidad** (deriva)
- **Resumen:** 31 columnas · 3 índices · 7 FK salientes · 2 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | **SIN_ENTIDAD** |
| 2 | `run_id` | `uuid` | Clave foránea → qa_lab.test_runs.id; Obligatoria | _sin dato_ | **SIN_ENTIDAD** |
| 3 | `suite_id` | `uuid` | Clave foránea → qa_lab.test_suites.id; Obligatoria | _sin dato_ | **SIN_ENTIDAD** |
| 4 | `suite_version` | `integer` | Obligatoria | _sin dato_ | **SIN_ENTIDAD** |
| 5 | `environment_id` | `uuid` | Clave foránea → qa_lab.test_environments.id; Obligatoria | _sin dato_ | **SIN_ENTIDAD** |
| 6 | `target_id` | `uuid` | Clave foránea → qa_execution.execution_targets.id; Obligatoria | _sin dato_ | **SIN_ENTIDAD** |
| 7 | `plan_hash` | `varchar` | Obligatoria | _sin dato_ | **SIN_ENTIDAD** |
| 8 | `plan_json` | `jsonb` | Obligatoria | _sin dato_ | **SIN_ENTIDAD** |
| 9 | `limits_json` | `jsonb` | Obligatoria | _sin dato_ | **SIN_ENTIDAD** |
| 10 | `requires_approval` | `boolean` | Obligatoria | _sin dato_ | **SIN_ENTIDAD** |
| 11 | `approval_reasons` | `jsonb` | Opcional | _sin dato_ | **SIN_ENTIDAD** |
| 12 | `status` | `varchar` | Obligatoria | _sin dato_ | **SIN_ENTIDAD** |
| 13 | `requested_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | **SIN_ENTIDAD** |
| 14 | `idempotency_key` | `varchar` | Opcional | _sin dato_ | **SIN_ENTIDAD** |
| 15 | `lease_owner` | `varchar` | Opcional | _sin dato_ | **SIN_ENTIDAD** |
| 16 | `lease_expires_at` | `timestamptz` | Opcional | _sin dato_ | **SIN_ENTIDAD** |
| 17 | `attempt` | `integer` | Obligatoria | _sin dato_ | **SIN_ENTIDAD** |
| 18 | `cancel_requested_at` | `timestamptz` | Opcional | _sin dato_ | **SIN_ENTIDAD** |
| 19 | `started_at` | `timestamptz` | Opcional | _sin dato_ | **SIN_ENTIDAD** |
| 20 | `finished_at` | `timestamptz` | Opcional | _sin dato_ | **SIN_ENTIDAD** |
| 21 | `requests_sent` | `integer` | Obligatoria | _sin dato_ | **SIN_ENTIDAD** |
| 22 | `cases_passed` | `integer` | Obligatoria | _sin dato_ | **SIN_ENTIDAD** |
| 23 | `cases_failed` | `integer` | Obligatoria | _sin dato_ | **SIN_ENTIDAD** |
| 24 | `cases_not_run` | `integer` | Obligatoria | _sin dato_ | **SIN_ENTIDAD** |
| 25 | `error_code` | `varchar` | Opcional | _sin dato_ | **SIN_ENTIDAD** |
| 26 | `error_message` | `text` | Opcional | _sin dato_ | **SIN_ENTIDAD** |
| 27 | `created_at` | `timestamptz` | Obligatoria | _sin dato_ | **SIN_ENTIDAD** |
| 28 | `updated_at` | `timestamptz` | Obligatoria | _sin dato_ | **SIN_ENTIDAD** |
| 29 | `created_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | **SIN_ENTIDAD** |
| 30 | `updated_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | **SIN_ENTIDAD** |
| 31 | `row_version` | `integer = 1` | Obligatoria | _sin dato_ | **SIN_ENTIDAD** |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | target_id | qa_execution.execution_targets (id) | fk_execution_plans_target_id |
| hacia | run_id | qa_lab.test_runs (id) | fk_execution_plans_run_id |
| hacia | suite_id | qa_lab.test_suites (id) | fk_execution_plans_suite_id |
| hacia | environment_id | qa_lab.test_environments (id) | fk_execution_plans_environment_id |
| hacia | requested_by_user_id | iam.users (id) | fk_execution_plans_requested_by_user_id |
| hacia | created_by_user_id | iam.users (id) | fk_execution_plans_created_by_user_id |
| hacia | updated_by_user_id | iam.users (id) | fk_execution_plans_updated_by_user_id |
| desde | id | qa_execution.plan_approvals (plan_id) | fk_plan_approvals_plan_id |
| desde | id | qa_execution.plan_events (plan_id) | fk_plan_events_plan_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_qa_execution_plans_status_created` | no | status, created_at | _sin uso detectado estáticamente_ |
| `ix_qa_execution_plans_run_id` | no | run_id | Soporta la clave foránea fk_execution_plans_run_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ux_qa_execution_plans_idempotency` | sí | requested_by_user_id, idempotency_key donde WHERE idempotency_key IS NOT NULL | Garantiza que no se repita la combinación (requested_by_user_id, idempotency_key) _(DOCUMENTO)_; Soporta la clave foránea fk_execution_plans_requested_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_; Índice parcial: sólo indexa las filas donde WHERE idempotency_key IS NOT NULL _(ESTRUCTURAL)_ |

#### Restricciones

| Restricción | Tipo | Definición |
|---|---|---|
| `ux_qa_execution_plans_idempotency` | UNIQUE INDEX | UNIQUE INDEX ("requested_by_user_id", "idempotency_key") WHERE idempotency_key IS NOT NULL |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

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

### execution_targets

#### Vista general

Define objetivos verificables para los planes de ejecución de calidad, vinculados a los componentes y flujos de la plataforma sanitaria.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_68_qa_execution.puml:16: entity execution_targets {`
- **Dominio:** sin dato · **Diagrama:** `Mantra Core Health Context/modules/diagram_68_qa_execution.puml` · **DDL:** `SQL/68_qa_execution/02_tables.sql`
- **Entidad del ORM:** **sin entidad** (deriva)
- **Resumen:** 20 columnas · 1 índices · 3 FK salientes · 1 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | **SIN_ENTIDAD** |
| 2 | `environment_id` | `uuid` | Clave foránea → qa_lab.test_environments.id; Obligatoria | _sin dato_ | **SIN_ENTIDAD** |
| 3 | `scheme` | `varchar` | Obligatoria | _sin dato_ | **SIN_ENTIDAD** |
| 4 | `host` | `varchar` | Obligatoria | _sin dato_ | **SIN_ENTIDAD** |
| 5 | `port` | `integer` | Obligatoria | _sin dato_ | **SIN_ENTIDAD** |
| 6 | `allowed_path_prefixes` | `jsonb` | Obligatoria | _sin dato_ | **SIN_ENTIDAD** |
| 7 | `allow_private_network` | `boolean` | Obligatoria | _sin dato_ | **SIN_ENTIDAD** |
| 8 | `allow_mutations` | `boolean` | Obligatoria | _sin dato_ | **SIN_ENTIDAD** |
| 9 | `auth_secret_ref` | `varchar` | Opcional | _sin dato_ | **SIN_ENTIDAD** |
| 10 | `auth_header_name` | `varchar` | Opcional | _sin dato_ | **SIN_ENTIDAD** |
| 11 | `max_requests` | `integer` | Obligatoria | _sin dato_ | **SIN_ENTIDAD** |
| 12 | `max_duration_seconds` | `integer` | Obligatoria | _sin dato_ | **SIN_ENTIDAD** |
| 13 | `request_timeout_ms` | `integer` | Obligatoria | _sin dato_ | **SIN_ENTIDAD** |
| 14 | `min_interval_ms` | `integer` | Obligatoria | _sin dato_ | **SIN_ENTIDAD** |
| 15 | `status` | `varchar` | Obligatoria | _sin dato_ | **SIN_ENTIDAD** |
| 16 | `created_at` | `timestamptz` | Obligatoria | _sin dato_ | **SIN_ENTIDAD** |
| 17 | `updated_at` | `timestamptz` | Obligatoria | _sin dato_ | **SIN_ENTIDAD** |
| 18 | `created_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | **SIN_ENTIDAD** |
| 19 | `updated_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | **SIN_ENTIDAD** |
| 20 | `row_version` | `integer = 1` | Obligatoria | _sin dato_ | **SIN_ENTIDAD** |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | environment_id | qa_lab.test_environments (id) | fk_execution_targets_environment_id |
| hacia | created_by_user_id | iam.users (id) | fk_execution_targets_created_by_user_id |
| hacia | updated_by_user_id | iam.users (id) | fk_execution_targets_updated_by_user_id |
| desde | id | qa_execution.execution_plans (target_id) | fk_execution_plans_target_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ux_qa_execution_targets_environment` | sí | environment_id | Garantiza que no se repita la combinación (environment_id) _(DOCUMENTO)_; Soporta la clave foránea fk_execution_targets_environment_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |

#### Restricciones

| Restricción | Tipo | Definición |
|---|---|---|
| `ux_qa_execution_targets_environment` | UNIQUE INDEX | UNIQUE INDEX ("environment_id") |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

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

### plan_approvals

#### Vista general

Registra aprobaciones de planes de ejecución de calidad, aportando control de revisión antes de correr verificaciones de la plataforma de salud.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_68_qa_execution.puml:87: entity plan_approvals <<LOG>> {`
- **Dominio:** sin dato · **Diagrama:** `Mantra Core Health Context/modules/diagram_68_qa_execution.puml` · **DDL:** `SQL/68_qa_execution/02_tables.sql`
- **Entidad del ORM:** **sin entidad** (deriva)
- **Resumen:** 8 columnas · 1 índices · 2 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | **SIN_ENTIDAD** |
| 2 | `plan_id` | `uuid` | Clave foránea → qa_execution.execution_plans.id; Obligatoria | _sin dato_ | **SIN_ENTIDAD** |
| 3 | `plan_hash` | `varchar` | Obligatoria | _sin dato_ | **SIN_ENTIDAD** |
| 4 | `decision` | `varchar` | Obligatoria | _sin dato_ | **SIN_ENTIDAD** |
| 5 | `reason` | `text` | Obligatoria | _sin dato_ | **SIN_ENTIDAD** |
| 6 | `approver_user_id` | `uuid` | Clave foránea → iam.users.id; Obligatoria | _sin dato_ | **SIN_ENTIDAD** |
| 7 | `expires_at` | `timestamptz` | Obligatoria | _sin dato_ | **SIN_ENTIDAD** |
| 8 | `created_at` | `timestamptz` | Obligatoria | _sin dato_ | **SIN_ENTIDAD** |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | plan_id | qa_execution.execution_plans (id) | fk_plan_approvals_plan_id |
| hacia | approver_user_id | iam.users (id) | fk_plan_approvals_approver_user_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_qa_execution_plan_approvals_plan` | no | plan_id, created_at | Soporta la clave foránea fk_plan_approvals_plan_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

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

### plan_events

#### Vista general

Deja una secuencia de eventos de los planes de calidad para auditar cambios y resultados durante la verificación de la plataforma sanitaria.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_68_qa_execution.puml:104: entity plan_events <<LOG>> {`
- **Dominio:** sin dato · **Diagrama:** `Mantra Core Health Context/modules/diagram_68_qa_execution.puml` · **DDL:** `SQL/68_qa_execution/02_tables.sql`
- **Entidad del ORM:** **sin entidad** (deriva)
- **Resumen:** 7 columnas · 1 índices · 2 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | **SIN_ENTIDAD** |
| 2 | `plan_id` | `uuid` | Clave foránea → qa_execution.execution_plans.id; Obligatoria | _sin dato_ | **SIN_ENTIDAD** |
| 3 | `seq` | `integer` | Obligatoria | _sin dato_ | **SIN_ENTIDAD** |
| 4 | `kind` | `varchar` | Obligatoria | _sin dato_ | **SIN_ENTIDAD** |
| 5 | `case_id` | `uuid` | Clave foránea → qa_lab.test_cases.id; Opcional | _sin dato_ | **SIN_ENTIDAD** |
| 6 | `detail_json` | `jsonb` | Opcional | _sin dato_ | **SIN_ENTIDAD** |
| 7 | `created_at` | `timestamptz` | Obligatoria | _sin dato_ | **SIN_ENTIDAD** |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | plan_id | qa_execution.execution_plans (id) | fk_plan_events_plan_id |
| hacia | case_id | qa_lab.test_cases (id) | fk_plan_events_case_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ux_qa_execution_plan_events_seq` | sí | plan_id, seq | Garantiza que no se repita la combinación (plan_id, seq) _(DOCUMENTO)_; Soporta la clave foránea fk_plan_events_plan_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |

#### Restricciones

| Restricción | Tipo | Definición |
|---|---|---|
| `ux_qa_execution_plan_events_seq` | UNIQUE INDEX | UNIQUE INDEX ("plan_id", "seq") |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

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

