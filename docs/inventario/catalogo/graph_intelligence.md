<!-- AUTOGENERADO por tools/inventario/catalogo.mjs. No editar manualmente. -->

# Catálogo del schema `graph_intelligence`

- **Tablas:** 13 · **Columnas:** 115 (12 con descripción: 10.4 %) · **Índices:** 29
- **Dominio:** Datos y NoSQL
- Método y límites del catálogo: [README del inventario](../README.md)

## Tablas

| Tabla | Propósito | Columnas | Índices | Operaciones | ORM |
|---|---|---|---|---|---|
| [graph_access_scopes](#graph_access_scopes) | Define alcances de acceso a proyecciones del grafo para limitar consultas por tenant y propósito. | 9 | 2 | 6 | COINCIDE |
| [graph_communities](#graph_communities) | Representa comunidades o agrupaciones detectadas en relaciones para análisis organizacional o de riesgo. | 7 | 2 | 5 | COINCIDE |
| [graph_deletion_jobs](#graph_deletion_jobs) | Coordina eliminación de nodos y aristas derivados cuando cambia el dato canónico o su permiso de uso. | 9 | 2 | 5 | COINCIDE |
| [graph_edge_evidence](#graph_edge_evidence) | Vincula evidencia de origen a aristas para explicar por qué existe cada relación proyectada. | 7 | 2 | 5 | COINCIDE |
| [graph_edges](#graph_edges) | Representa relaciones entre nodos para consultas multi-salto en proyecciones derivadas. | 13 | 4 | 8 | COINCIDE |
| [graph_node_identifiers](#graph_node_identifiers) | Relaciona nodos con identificadores de origen para resolver entidades proyectadas sin convertir el grafo en fuente canónica. | 6 | 2 | 3 | COINCIDE |
| [graph_nodes](#graph_nodes) | Representa nodos de proyecciones de relaciones para análisis de derivaciones, organizaciones, fraude y linaje. | 11 | 4 | 11 | COINCIDE |
| [graph_path_cache](#graph_path_cache) | Almacena rutas calculadas temporalmente para acelerar consultas repetidas del grafo. | 10 | 1 | 9 | COINCIDE |
| [graph_projection_definitions](#graph_projection_definitions) | Configura proyecciones de grafos que se derivan de datos canónicos PostgreSQL. | 8 | 2 | 1 | COINCIDE |
| [graph_projection_runs](#graph_projection_runs) | Registra construcción y actualización de proyecciones para mantener linaje y diagnóstico. | 9 | 2 | 3 | COINCIDE |
| [graph_risk_scores](#graph_risk_scores) | Conserva puntajes calculados sobre grafos para apoyar análisis de riesgos y relaciones. | 9 | 2 | 6 | COINCIDE |
| [graph_rule_definitions](#graph_rule_definitions) | Define reglas que evalúan patrones de relaciones dentro de proyecciones del grafo. | 8 | 2 | 1 | COINCIDE |
| [graph_rule_hits](#graph_rule_hits) | Registra ocurrencias de reglas sobre grafos para investigación y seguimiento. | 9 | 2 | 3 | COINCIDE |

### Tablas sin relaciones dentro del schema

`graph_intelligence.graph_access_scopes` · `graph_intelligence.graph_communities` · `graph_intelligence.graph_deletion_jobs` · `graph_intelligence.graph_edge_evidence` · `graph_intelligence.graph_edges` · `graph_intelligence.graph_node_identifiers` · `graph_intelligence.graph_nodes` · `graph_intelligence.graph_path_cache` · `graph_intelligence.graph_projection_definitions` · `graph_intelligence.graph_projection_runs` · `graph_intelligence.graph_risk_scores` · `graph_intelligence.graph_rule_definitions` · `graph_intelligence.graph_rule_hits`

## Fichas

### graph_access_scopes

#### Vista general

Define alcances de acceso a proyecciones del grafo para limitar consultas por tenant y propósito.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_61_graph_intelligence.puml: graph_access_scopes`
- **Dominio:** Datos y NoSQL · **Diagrama:** `Mantra Core Health Context/modules/diagram_61_graph_intelligence.puml` · **DDL:** `SQL/61_graph_intelligence/02_tables.sql`
- **Entidad del ORM:** `GraphAccessScopes` — `src/modules/graph_intelligence/entities/graph_access_scopes.entity.ts`
- **Resumen:** 9 columnas · 2 índices · 0 FK salientes · 0 entrantes · 6 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/graph_intelligence/entities/graph_access_scopes.entity.ts:12`)_ | coincide |
| 2 | `tenant_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 3 | `scope_code` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 4 | `allowed_node_types` | `varchar[]` | Obligatoria | _sin dato_ | coincide |
| 5 | `allowed_relationship_types` | `varchar[]` | Obligatoria | _sin dato_ | coincide |
| 6 | `purpose_of_use_codes` | `varchar[]` | Obligatoria | _sin dato_ | coincide |
| 7 | `max_hops` | `smallint` | Obligatoria | _sin dato_ | coincide |
| 8 | `requires_patient_context` | `boolean` | Obligatoria | _sin dato_ | coincide |
| 9 | `state` | `varchar` | Obligatoria | _sin dato_ | coincide |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `uq_graph_scope_code` | sí | tenant_id, scope_code | Garantiza que no se repita la combinación (tenant_id, scope_code) _(DOCUMENTO)_; 1 consulta(s) de repositorio filtran u ordenan por «tenant_id», la primera columna del índice _(CONSULTA)_ |
| `ix_graph_scope_state` | no | tenant_id, state | 1 consulta(s) de repositorio filtran u ordenan por «tenant_id», la primera columna del índice _(CONSULTA)_ |

#### Restricciones

| Restricción | Tipo | Definición |
|---|---|---|
| `uq_graph_scope_code` | UNIQUE INDEX | UNIQUE INDEX ("tenant_id", "scope_code") |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /graph/access-scopes | CREA | DIRECTA |
| POST /graph/access-scopes | LEE | DIRECTA |
| PATCH /graph/access-scopes/{id} | LEE | DIRECTA |
| POST /graph/paths | LEE | DIRECTA |
| POST /graph/rules/{id}/evaluate | LEE | DIRECTA |
| POST /graph/traverse | LEE | DIRECTA |

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

### graph_communities

#### Vista general

Representa comunidades o agrupaciones detectadas en relaciones para análisis organizacional o de riesgo.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_61_graph_intelligence.puml: graph_communities`
- **Dominio:** Datos y NoSQL · **Diagrama:** `Mantra Core Health Context/modules/diagram_61_graph_intelligence.puml` · **DDL:** `SQL/61_graph_intelligence/02_tables.sql`
- **Entidad del ORM:** `GraphCommunities` — `src/modules/graph_intelligence/entities/graph_communities.entity.ts`
- **Resumen:** 7 columnas · 2 índices · 0 FK salientes · 0 entrantes · 5 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/graph_intelligence/entities/graph_communities.entity.ts:12`)_ | coincide |
| 2 | `tenant_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 3 | `community_type` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 4 | `algorithm_version` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 5 | `member_node_ids` | `uuid[]` | Obligatoria | _sin dato_ | coincide |
| 6 | `score` | `double precision` | Obligatoria | _sin dato_ | coincide |
| 7 | `calculated_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `uq_graph_community_algorithm` | sí | tenant_id, community_type, algorithm_version, id | Garantiza que no se repita la combinación (tenant_id, community_type, algorithm_version, id) _(DOCUMENTO)_; 2 consulta(s) de repositorio filtran u ordenan por «tenant_id», la primera columna del índice _(CONSULTA)_ |
| `ix_graph_community_member` | no | member_node_ids | GIN para búsqueda textual gobernada _(DOCUMENTO)_ |

#### Restricciones

| Restricción | Tipo | Definición |
|---|---|---|
| `uq_graph_community_algorithm` | UNIQUE INDEX | UNIQUE INDEX ("tenant_id", "community_type", "algorithm_version", "id") |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /graph/analytics/community-detection | BORRA | DIRECTA |
| POST /graph/analytics/community-detection | CREA | DIRECTA |
| POST /graph/analytics/community-detection | LEE | DIRECTA |
| POST /graph/deletion-jobs | ACTUALIZA | POR_TIPO |
| POST /graph/deletion-jobs | LEE | DIRECTA |

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

### graph_deletion_jobs

#### Vista general

Coordina eliminación de nodos y aristas derivados cuando cambia el dato canónico o su permiso de uso.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_61_graph_intelligence.puml: graph_deletion_jobs`
- **Dominio:** Datos y NoSQL · **Diagrama:** `Mantra Core Health Context/modules/diagram_61_graph_intelligence.puml` · **DDL:** `SQL/61_graph_intelligence/02_tables.sql`
- **Entidad del ORM:** `GraphDeletionJobs` — `src/modules/graph_intelligence/entities/graph_deletion_jobs.entity.ts`
- **Resumen:** 9 columnas · 2 índices · 0 FK salientes · 0 entrantes · 5 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/graph_intelligence/entities/graph_deletion_jobs.entity.ts:12`)_ | coincide |
| 2 | `tenant_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 3 | `source_entity_type` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 4 | `source_entity_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 5 | `status` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 6 | `nodes_deleted` | `integer` | Obligatoria | _sin dato_ | coincide |
| 7 | `edges_deleted` | `integer` | Obligatoria | _sin dato_ | coincide |
| 8 | `requested_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 9 | `verified_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_graph_delete_status` | no | tenant_id, status, ("requested_at" ASC) | _sin uso detectado estáticamente_ |
| `uq_graph_delete_source_active` | sí | tenant_id, source_entity_type, source_entity_id, status | Garantiza que no se repita la combinación (tenant_id, source_entity_type, source_entity_id, status) _(DOCUMENTO)_; 1 consulta(s) de repositorio filtran u ordenan por «tenant_id», la primera columna del índice _(CONSULTA)_ |

#### Restricciones

| Restricción | Tipo | Definición |
|---|---|---|
| `uq_graph_delete_source_active` | UNIQUE INDEX | UNIQUE INDEX ("tenant_id", "source_entity_type", "source_entity_id", "status") |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /graph/deletion-jobs | ACTUALIZA | POR_TIPO |
| POST /graph/deletion-jobs | CREA | DIRECTA |
| POST /graph/deletion-jobs | LEE | DIRECTA |
| POST /graph/projections/reconcile | CREA | DIRECTA |
| POST /graph/projections/reconcile | LEE | DIRECTA |

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

### graph_edge_evidence

#### Vista general

Vincula evidencia de origen a aristas para explicar por qué existe cada relación proyectada.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_61_graph_intelligence.puml: graph_edge_evidence`
- **Dominio:** Datos y NoSQL · **Diagrama:** `Mantra Core Health Context/modules/diagram_61_graph_intelligence.puml` · **DDL:** `SQL/61_graph_intelligence/02_tables.sql`
- **Entidad del ORM:** `GraphEdgeEvidence` — `src/modules/graph_intelligence/entities/graph_edge_evidence.entity.ts`
- **Resumen:** 7 columnas · 2 índices · 0 FK salientes · 0 entrantes · 5 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/graph_intelligence/entities/graph_edge_evidence.entity.ts:12`)_ | coincide |
| 2 | `edge_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 3 | `evidence_type` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 4 | `source_reference` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 5 | `evidence_hash` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 6 | `observed_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 7 | `confidence_delta` | `double precision` | Obligatoria | _sin dato_ | coincide |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `uq_graph_edge_evidence_hash` | sí | edge_id, evidence_hash | Garantiza que no se repita la combinación (edge_id, evidence_hash) _(DOCUMENTO)_; 3 consulta(s) de repositorio filtran u ordenan por «edge_id», la primera columna del índice _(CONSULTA)_ |
| `ix_graph_edge_evidence_time` | no | edge_id, ("observed_at" DESC) | _sin uso detectado estáticamente_ |

#### Restricciones

| Restricción | Tipo | Definición |
|---|---|---|
| `uq_graph_edge_evidence_hash` | UNIQUE INDEX | UNIQUE INDEX ("edge_id", "evidence_hash") |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /graph/deletion-jobs | BORRA | DIRECTA |
| POST /graph/edges/{id}/expire | CREA | DIRECTA |
| POST /graph/edges/{id}/expire | LEE | DIRECTA |
| POST /graph/projections/edges/upsert | CREA | DIRECTA |
| POST /graph/projections/edges/upsert | LEE | DIRECTA |

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

### graph_edges

#### Vista general

Representa relaciones entre nodos para consultas multi-salto en proyecciones derivadas.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_61_graph_intelligence.puml: graph_edges`
- **Dominio:** Datos y NoSQL · **Diagrama:** `Mantra Core Health Context/modules/diagram_61_graph_intelligence.puml` · **DDL:** `SQL/61_graph_intelligence/02_tables.sql`
- **Entidad del ORM:** `GraphEdges` — `src/modules/graph_intelligence/entities/graph_edges.entity.ts`
- **Resumen:** 13 columnas · 4 índices · 0 FK salientes · 0 entrantes · 8 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `edge_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `tenant_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 3 | `from_node_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 4 | `to_node_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 5 | `relationship_type` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 6 | `directionality` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 7 | `effective_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 8 | `effective_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 9 | `confidence_score` | `double precision` | Obligatoria | _sin dato_ | coincide |
| 10 | `source_entity_type` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 11 | `source_entity_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 12 | `properties` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 13 | `lifecycle_state` | `varchar` | Obligatoria | _sin dato_ | coincide |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `uq_graph_edge_source` | sí | tenant_id, source_entity_type, source_entity_id, relationship_type | Garantiza que no se repita la combinación (tenant_id, source_entity_type, source_entity_id, relationship_type) _(DOCUMENTO)_; 1 consulta(s) de repositorio filtran u ordenan por «tenant_id», la primera columna del índice _(CONSULTA)_ |
| `ix_graph_edge_out` | no | tenant_id, from_node_id, relationship_type, ("effective_from" DESC) | _sin uso detectado estáticamente_ |
| `ix_graph_edge_in` | no | tenant_id, to_node_id, relationship_type, ("effective_from" DESC) | _sin uso detectado estáticamente_ |
| `ix_graph_edge_active` | no | tenant_id, relationship_type, lifecycle_state | 1 consulta(s) de repositorio filtran u ordenan por «tenant_id», la primera columna del índice _(CONSULTA)_ |

#### Restricciones

| Restricción | Tipo | Definición |
|---|---|---|
| `uq_graph_edge_source` | UNIQUE INDEX | UNIQUE INDEX ("tenant_id", "source_entity_type", "source_entity_id", "relationship_type") |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /graph/deletion-jobs | BORRA | DIRECTA |
| POST /graph/deletion-jobs | LEE | DIRECTA |
| POST /graph/edges/{id}/expire | LEE | DIRECTA |
| POST /graph/paths | LEE | DIRECTA |
| POST /graph/projections/edges/upsert | ACTUALIZA | POR_TIPO |
| POST /graph/projections/edges/upsert | CREA | DIRECTA |
| POST /graph/projections/edges/upsert | LEE | DIRECTA |
| POST /graph/traverse | LEE | DIRECTA |

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

### graph_node_identifiers

#### Vista general

Relaciona nodos con identificadores de origen para resolver entidades proyectadas sin convertir el grafo en fuente canónica.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_61_graph_intelligence.puml: graph_node_identifiers; BIZ note`
- **Dominio:** Datos y NoSQL · **Diagrama:** `Mantra Core Health Context/modules/diagram_61_graph_intelligence.puml` · **DDL:** `SQL/61_graph_intelligence/02_tables.sql`
- **Entidad del ORM:** `GraphNodeIdentifiers` — `src/modules/graph_intelligence/entities/graph_node_identifiers.entity.ts`
- **Resumen:** 6 columnas · 2 índices · 0 FK salientes · 0 entrantes · 3 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/graph_intelligence/entities/graph_node_identifiers.entity.ts:12`)_ | coincide |
| 2 | `node_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 3 | `identifier_system` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 4 | `identifier_value_hash` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 5 | `identifier_type` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 6 | `is_primary` | `boolean` | Obligatoria | _sin dato_ | coincide |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `uq_graph_identifier` | sí | node_id, identifier_system, identifier_value_hash | Garantiza que no se repita la combinación (node_id, identifier_system, identifier_value_hash) _(DOCUMENTO)_; 3 consulta(s) de repositorio filtran u ordenan por «node_id», la primera columna del índice _(CONSULTA)_ |
| `ix_graph_identifier_hash` | no | identifier_system, identifier_value_hash | 1 consulta(s) de repositorio filtran u ordenan por «identifier_system», la primera columna del índice _(CONSULTA)_ |

#### Restricciones

| Restricción | Tipo | Definición |
|---|---|---|
| `uq_graph_identifier` | UNIQUE INDEX | UNIQUE INDEX ("node_id", "identifier_system", "identifier_value_hash") |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /graph/deletion-jobs | BORRA | DIRECTA |
| POST /graph/projections/nodes/upsert | CREA | DIRECTA |
| POST /graph/projections/nodes/upsert | LEE | DIRECTA |

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

### graph_nodes

#### Vista general

Representa nodos de proyecciones de relaciones para análisis de derivaciones, organizaciones, fraude y linaje.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_61_graph_intelligence.puml: graph_nodes; BIZ note`
- **Dominio:** Datos y NoSQL · **Diagrama:** `Mantra Core Health Context/modules/diagram_61_graph_intelligence.puml` · **DDL:** `SQL/61_graph_intelligence/02_tables.sql`
- **Entidad del ORM:** `GraphNodes` — `src/modules/graph_intelligence/entities/graph_nodes.entity.ts`
- **Resumen:** 11 columnas · 4 índices · 0 FK salientes · 0 entrantes · 11 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `node_id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `tenant_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 3 | `node_type` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 4 | `source_entity_type` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 5 | `source_entity_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 6 | `source_version` | `bigint` | Obligatoria | _sin dato_ | coincide |
| 7 | `display_label_redacted` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 8 | `properties` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 9 | `security_labels` | `varchar[]` | Obligatoria | _sin dato_ | coincide |
| 10 | `lifecycle_state` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 11 | `updated_at` | `timestamptz` | Obligatoria | Fecha y hora de la última actualización. _(JSDOC_ESTANDAR, `src/modules/graph_intelligence/entities/graph_nodes.entity.ts:72`)_ | coincide |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `uq_graph_node_source` | sí | tenant_id, source_entity_type, source_entity_id | Garantiza que no se repita la combinación (tenant_id, source_entity_type, source_entity_id) _(DOCUMENTO)_; 1 consulta(s) de repositorio filtran u ordenan por «tenant_id», la primera columna del índice _(CONSULTA)_ |
| `ix_graph_node_type_state` | no | tenant_id, node_type, lifecycle_state | 1 consulta(s) de repositorio filtran u ordenan por «tenant_id», la primera columna del índice _(CONSULTA)_ |
| `lookup_graph_node_id` | no | node_id | 3 consulta(s) de repositorio filtran u ordenan por «node_id», la primera columna del índice _(CONSULTA)_ |
| `ft_graph_node_label` | no | (to_tsvector('simple', "display_label_redacted")) | GIN para búsqueda textual gobernada _(DOCUMENTO)_ |

#### Restricciones

| Restricción | Tipo | Definición |
|---|---|---|
| `uq_graph_node_source` | UNIQUE INDEX | UNIQUE INDEX ("tenant_id", "source_entity_type", "source_entity_id") |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /graph/analytics/risk-scoring | LEE | DIRECTA |
| POST /graph/deletion-jobs | BORRA | DIRECTA |
| POST /graph/deletion-jobs | LEE | DIRECTA |
| POST /graph/paths | LEE | DIRECTA |
| POST /graph/projections/edges/upsert | LEE | DIRECTA |
| POST /graph/projections/nodes/upsert | ACTUALIZA | POR_TIPO |
| POST /graph/projections/nodes/upsert | CREA | DIRECTA |
| POST /graph/projections/nodes/upsert | LEE | DIRECTA |
| POST /graph/projections/reconcile | ACTUALIZA | POR_TIPO |
| POST /graph/projections/reconcile | LEE | DIRECTA |
| POST /graph/traverse | LEE | DIRECTA |

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

### graph_path_cache

#### Vista general

Almacena rutas calculadas temporalmente para acelerar consultas repetidas del grafo.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_61_graph_intelligence.puml: graph_path_cache`
- **Dominio:** Datos y NoSQL · **Diagrama:** `Mantra Core Health Context/modules/diagram_61_graph_intelligence.puml` · **DDL:** `SQL/61_graph_intelligence/02_tables.sql`
- **Entidad del ORM:** `GraphPathCache` — `src/modules/graph_intelligence/entities/graph_path_cache.entity.ts`
- **Resumen:** 10 columnas · 1 índices · 0 FK salientes · 0 entrantes · 9 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/graph_intelligence/entities/graph_path_cache.entity.ts:12`)_ | coincide |
| 2 | `tenant_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 3 | `start_node_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 4 | `end_node_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 5 | `relationship_filter_hash` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 6 | `max_hops` | `smallint` | Obligatoria | _sin dato_ | coincide |
| 7 | `path_nodes` | `uuid[]` | Obligatoria | _sin dato_ | coincide |
| 8 | `path_edges` | `uuid[]` | Obligatoria | _sin dato_ | coincide |
| 9 | `calculated_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 10 | `expires_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `uq_graph_path_cache` | sí | tenant_id, start_node_id, end_node_id, relationship_filter_hash, max_hops | Garantiza que no se repita la combinación (tenant_id, start_node_id, end_node_id, relationship_filter_hash, max_hops) _(DOCUMENTO)_; 2 consulta(s) de repositorio filtran u ordenan por «tenant_id», la primera columna del índice _(CONSULTA)_ |

#### Restricciones

| Restricción | Tipo | Definición |
|---|---|---|
| `uq_graph_path_cache` | UNIQUE INDEX | UNIQUE INDEX ("tenant_id", "start_node_id", "end_node_id", "relationship_filter_hash", "max_hops") |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /graph/deletion-jobs | BORRA | DIRECTA |
| POST /graph/deletion-jobs | LEE | DIRECTA |
| POST /graph/edges/{id}/expire | BORRA | DIRECTA |
| POST /graph/edges/{id}/expire | LEE | DIRECTA |
| POST /graph/paths | ACTUALIZA | POR_TIPO |
| POST /graph/paths | CREA | DIRECTA |
| POST /graph/paths | LEE | DIRECTA |
| POST /graph/projections/reconcile | BORRA | DIRECTA |
| POST /graph/projections/reconcile | LEE | DIRECTA |

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

### graph_projection_definitions

#### Vista general

Configura proyecciones de grafos que se derivan de datos canónicos PostgreSQL.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_61_graph_intelligence.puml: graph_projection_definitions; BIZ note`
- **Dominio:** Datos y NoSQL · **Diagrama:** `Mantra Core Health Context/modules/diagram_61_graph_intelligence.puml` · **DDL:** `SQL/61_graph_intelligence/02_tables.sql`
- **Entidad del ORM:** `GraphProjectionDefinitions` — `src/modules/graph_intelligence/entities/graph_projection_definitions.entity.ts`
- **Resumen:** 8 columnas · 2 índices · 0 FK salientes · 0 entrantes · 1 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/graph_intelligence/entities/graph_projection_definitions.entity.ts:15`)_ | coincide |
| 2 | `tenant_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 3 | `code` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 4 | `source_dataset_codes` | `varchar[]` | Obligatoria | _sin dato_ | coincide |
| 5 | `node_mapping_rules` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 6 | `edge_mapping_rules` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 7 | `projection_version` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 8 | `state` | `varchar` | Obligatoria | _sin dato_ | coincide |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `uq_graph_projection_version` | sí | tenant_id, code, projection_version | Garantiza que no se repita la combinación (tenant_id, code, projection_version) _(DOCUMENTO)_ |
| `ix_graph_projection_state` | no | tenant_id, state | _sin uso detectado estáticamente_ |

#### Restricciones

| Restricción | Tipo | Definición |
|---|---|---|
| `uq_graph_projection_version` | UNIQUE INDEX | UNIQUE INDEX ("tenant_id", "code", "projection_version") |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /graph/projection-definitions/{id}/runs | LEE | DIRECTA |

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

### graph_projection_runs

#### Vista general

Registra construcción y actualización de proyecciones para mantener linaje y diagnóstico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_61_graph_intelligence.puml: graph_projection_runs`
- **Dominio:** Datos y NoSQL · **Diagrama:** `Mantra Core Health Context/modules/diagram_61_graph_intelligence.puml` · **DDL:** `SQL/61_graph_intelligence/02_tables.sql`
- **Entidad del ORM:** `GraphProjectionRuns` — `src/modules/graph_intelligence/entities/graph_projection_runs.entity.ts`
- **Resumen:** 9 columnas · 2 índices · 0 FK salientes · 0 entrantes · 3 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/graph_intelligence/entities/graph_projection_runs.entity.ts:12`)_ | coincide |
| 2 | `tenant_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 3 | `graph_projection_definition_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 4 | `status` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 5 | `source_checkpoint` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 6 | `nodes_written` | `bigint` | Obligatoria | _sin dato_ | coincide |
| 7 | `edges_written` | `bigint` | Obligatoria | _sin dato_ | coincide |
| 8 | `started_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 9 | `completed_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_graph_projection_run_status` | no | tenant_id, status, ("started_at" ASC) | _sin uso detectado estáticamente_ |
| `ix_graph_projection_run_definition` | no | graph_projection_definition_id, ("started_at" DESC) | _sin uso detectado estáticamente_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /graph/projection-definitions/{id}/runs | CREA | DIRECTA |
| POST /graph/projection-definitions/{id}/runs | LEE | DIRECTA |
| POST /graph/projection-runs/{id}/advance | LEE | DIRECTA |

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

### graph_risk_scores

#### Vista general

Conserva puntajes calculados sobre grafos para apoyar análisis de riesgos y relaciones.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_61_graph_intelligence.puml: graph_risk_scores`
- **Dominio:** Datos y NoSQL · **Diagrama:** `Mantra Core Health Context/modules/diagram_61_graph_intelligence.puml` · **DDL:** `SQL/61_graph_intelligence/02_tables.sql`
- **Entidad del ORM:** `GraphRiskScores` — `src/modules/graph_intelligence/entities/graph_risk_scores.entity.ts`
- **Resumen:** 9 columnas · 2 índices · 0 FK salientes · 0 entrantes · 6 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/graph_intelligence/entities/graph_risk_scores.entity.ts:12`)_ | coincide |
| 2 | `tenant_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 3 | `node_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 4 | `risk_type` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 5 | `score` | `double precision` | Obligatoria | _sin dato_ | coincide |
| 6 | `model_version` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 7 | `explanation_redacted` | `text` | Obligatoria | _sin dato_ | coincide |
| 8 | `calculated_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 9 | `expires_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `uq_graph_risk_node_type_model` | sí | tenant_id, node_id, risk_type, model_version | Garantiza que no se repita la combinación (tenant_id, node_id, risk_type, model_version) _(DOCUMENTO)_ |
| `ix_graph_risk_high` | no | tenant_id, risk_type, ("score" DESC) | _sin uso detectado estáticamente_ |

#### Restricciones

| Restricción | Tipo | Definición |
|---|---|---|
| `uq_graph_risk_node_type_model` | UNIQUE INDEX | UNIQUE INDEX ("tenant_id", "node_id", "risk_type", "model_version") |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /graph/analytics/risk-scoring | ACTUALIZA | POR_TIPO |
| POST /graph/analytics/risk-scoring | CREA | DIRECTA |
| POST /graph/analytics/risk-scoring | LEE | DIRECTA |
| POST /graph/deletion-jobs | BORRA | DIRECTA |
| POST /graph/projections/reconcile | ACTUALIZA | POR_TIPO |
| POST /graph/projections/reconcile | LEE | DIRECTA |

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

### graph_rule_definitions

#### Vista general

Define reglas que evalúan patrones de relaciones dentro de proyecciones del grafo.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_61_graph_intelligence.puml: graph_rule_definitions`
- **Dominio:** Datos y NoSQL · **Diagrama:** `Mantra Core Health Context/modules/diagram_61_graph_intelligence.puml` · **DDL:** `SQL/61_graph_intelligence/02_tables.sql`
- **Entidad del ORM:** `GraphRuleDefinitions` — `src/modules/graph_intelligence/entities/graph_rule_definitions.entity.ts`
- **Resumen:** 8 columnas · 2 índices · 0 FK salientes · 0 entrantes · 1 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/graph_intelligence/entities/graph_rule_definitions.entity.ts:12`)_ | coincide |
| 2 | `tenant_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 3 | `code` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 4 | `rule_type` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 5 | `traversal_expression` | `text` | Obligatoria | _sin dato_ | coincide |
| 6 | `severity` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 7 | `state` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 8 | `version` | `varchar` | Obligatoria | _sin dato_ | coincide |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `uq_graph_rule_version` | sí | tenant_id, code, version | Garantiza que no se repita la combinación (tenant_id, code, version) _(DOCUMENTO)_ |
| `ix_graph_rule_state` | no | tenant_id, state, severity | _sin uso detectado estáticamente_ |

#### Restricciones

| Restricción | Tipo | Definición |
|---|---|---|
| `uq_graph_rule_version` | UNIQUE INDEX | UNIQUE INDEX ("tenant_id", "code", "version") |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /graph/rules/{id}/evaluate | LEE | DIRECTA |

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

### graph_rule_hits

#### Vista general

Registra ocurrencias de reglas sobre grafos para investigación y seguimiento.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_61_graph_intelligence.puml: graph_rule_hits`
- **Dominio:** Datos y NoSQL · **Diagrama:** `Mantra Core Health Context/modules/diagram_61_graph_intelligence.puml` · **DDL:** `SQL/61_graph_intelligence/02_tables.sql`
- **Entidad del ORM:** `GraphRuleHits` — `src/modules/graph_intelligence/entities/graph_rule_hits.entity.ts`
- **Resumen:** 9 columnas · 2 índices · 0 FK salientes · 0 entrantes · 3 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/graph_intelligence/entities/graph_rule_hits.entity.ts:12`)_ | coincide |
| 2 | `tenant_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 3 | `graph_rule_definition_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 4 | `primary_node_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 5 | `related_node_ids` | `uuid[]` | Obligatoria | _sin dato_ | coincide |
| 6 | `evidence_edge_ids` | `uuid[]` | Obligatoria | _sin dato_ | coincide |
| 7 | `status` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 8 | `detected_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 9 | `resolved_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_graph_rule_hit_status` | no | tenant_id, status, ("detected_at" ASC) | _sin uso detectado estáticamente_ |
| `ix_graph_rule_hit_node` | no | tenant_id, primary_node_id, ("detected_at" DESC) | _sin uso detectado estáticamente_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| PATCH /graph/rule-hits/{id} | LEE | DIRECTA |
| POST /graph/rules/{id}/evaluate | CREA | DIRECTA |
| POST /graph/rules/{id}/evaluate | LEE | DIRECTA |

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

