<!-- AUTOGENERADO por tools/inventario/flujos.mjs. No editar manualmente. -->

# Flujos del módulo `lakehouse`

- **Procesos:** 1 · **Máquinas de estado:** 0
- **Operaciones:** 13 (12 con decisiones propias, 1 sin ellas)
- Inventario de endpoints del módulo: [lakehouse](../endpoints/lakehouse.md)

## Proceso: Módulo 63 — Lakehouse, productos de datos analíticos y releases de investigación

- **Código:** `lakehouse` · **Agrupación:** MIXTO · **Operaciones:** 13
- **Actores:** DATA_PLATFORM_ENGINEER · DATA_PRODUCT_OWNER · DATA_STEWARD · DEIDENTIFICATION_WORKER · DPO · PLATFORM_ADMIN · PRINCIPAL_INVESTIGATOR · RESEARCH_GOVERNANCE · SYSTEM · TRANSFORMATION_WORKER
- **Revisión:** AUTO_DETECTADA
- **Fuentes:** `src/modules/lakehouse/README.md`

### Para qué sirve

Zonas del lago, metastores, productos de datos con contrato versionado, datasets físicos con su esquema, corridas de transformación que materializan particiones inmutables con su linaje, control de calidad que cuarentena lo que no cumple, y releases de investigación de-identificados **que siempre caducan**.

_Fuente: `src/modules/lakehouse/README.md:3`_

### Flujo general declarado en el README

```text
CATÁLOGO
  zones ──────────────> raw · standardized · curated · research
  catalogs ───────────> metastore con formato por defecto
  data-products/:id/versions ──> upsert del producto + versión ACTIVE
                                 la vigente anterior queda SUPERSEDED
                                 del SLO salen las reglas de calidad
  datasets ───────────> exige versión de producto ACTIVA + zona y catálogo activos
                        + esquema 1 con su huella

EJECUCIÓN
  transformations/:defId/runs ──> una sola corrida viva por definición
        partición cuya huella ya existe ⇒ se salta
        archivo cuyo hash ya existe ⇒ se salta
        linaje en la MISMA transacción (UC-63-06)
  ingestion/curated-runs ───────> destino obligatoriamente en zona CURATED
                                  corrida de de-identificación en la misma tx
  datasets/:id/quality-runs ────> regla blocking incumplida ⇒ dataset QUARANTINED

INVESTIGACIÓN
  projects/:id/cohorts ─────────> upsert del proyecto + cohorte
                                  ventana ética coherente y vigente
  dataset-releases ─────────────> ventana ética comprobada AL SOLICITAR
                                  PHI ⇒ cohorte con perfil de de-identificación
    └─ /approve ────────────────> deid run + manifiesto + released, misma tx
                                  expiresAt NUNCA sobrevive a la aprobación ética
    └─ /revoke ─────────────────> expired (fin de plazo) ≠ revoked (decisión)
```

_Fuente: `src/modules/lakehouse/README.md:72`_

### Etapas y operaciones

| Etapa | Descripción | Operación | Quién actúa | Riesgo | Tablas |
|---|---|---|---|---|---|
| `UC-63-01` | Zona del data lake | POST /lakehouse/zones | DATA_PLATFORM_ENGINEER · PLATFORM_ADMIN | MEDIO | 5 |
| `UC-63-02` | Catálogo / metastore | POST /lakehouse/catalogs | DATA_PLATFORM_ENGINEER · PLATFORM_ADMIN | MEDIO | 5 |
| `UC-63-03` | Producto y versión con contrato y SLO | POST /lakehouse/data-products/{id}/versions | DATA_PRODUCT_OWNER · PLATFORM_ADMIN | MEDIO | 10 |
| `UC-63-04` | Dataset y versión de esquema | POST /lakehouse/datasets | DATA_PLATFORM_ENGINEER · PLATFORM_ADMIN | MEDIO | 9 |
| `UC-63-05` | Corrida: particiones y archivos | POST /lakehouse/transformations/{defId}/runs | SYSTEM · TRANSFORMATION_WORKER · PLATFORM_ADMIN | MEDIO | 13 |
| `UC-63-07` | Ingesta de salud de-identificada | POST /lakehouse/ingestion/curated-runs | SYSTEM · DEIDENTIFICATION_WORKER · PLATFORM_ADMIN | MEDIO | 12 |
| `UC-63-08` | Calidad y hallazgos | POST /lakehouse/datasets/{id}/quality-runs | DATA_STEWARD · SYSTEM · PLATFORM_ADMIN | MEDIO | 9 |
| `UC-63-09` | Proyecto y cohorte | POST /research/projects/{id}/cohorts | PRINCIPAL_INVESTIGATOR · RESEARCH_GOVERNANCE · PLATFORM_ADMIN | MEDIO | 8 |
| `UC-63-10` | Solicitar release | POST /research/dataset-releases | PRINCIPAL_INVESTIGATOR · PLATFORM_ADMIN | MEDIO | 8 |
| `UC-63-11` | Aprobar y materializar | POST /research/dataset-releases/{id}/approve | RESEARCH_GOVERNANCE · DPO · PLATFORM_ADMIN | MEDIO | 10 |
| `UC-63-12` | Expirar o revocar | POST /research/dataset-releases/{id}/revoke | RESEARCH_GOVERNANCE · DPO · SYSTEM · PLATFORM_ADMIN | MEDIO | 7 |
| `ctrl:ResearchController` | Operaciones de ResearchController que el README no asigna a un caso de uso | GET /research/dataset-releases/expired | RESEARCH_GOVERNANCE · DPO · SYSTEM · PLATFORM_ADMIN | BAJO | 2 |
|  |  | POST /research/deidentification-profiles | RESEARCH_GOVERNANCE · DPO · PRINCIPAL_INVESTIGATOR · PLATFORM_ADMIN | MEDIO | 1 |

### Diagrama — etapas `UC-63-01`, `UC-63-02`, `UC-63-03`…

```mermaid
flowchart LR
  a2(["DATA_PLATFORM_ENGINEER · PLATFORM_ADMIN"]):::actor
  a11(["DATA_PRODUCT_OWNER · PLATFORM_ADMIN"]):::actor
  a22(["SYSTEM · TRANSFORMATION_WORKER · PLATFORM_ADMIN"]):::actor
  a30(["SYSTEM · DEIDENTIFICATION_WORKER · PLATFORM_ADMIN"]):::actor
  a36(["DATA_STEWARD · SYSTEM · PLATFORM_ADMIN"]):::actor
  a43(["PRINCIPAL_INVESTIGATOR · RESEARCH_GOVERNANCE · PLATFORM_ADM…"]):::actor
  a49(["PRINCIPAL_INVESTIGATOR · PLATFORM_ADMIN"]):::actor
  a54(["RESEARCH_GOVERNANCE · DPO · PLATFORM_ADMIN"]):::actor
  a59(["RESEARCH_GOVERNANCE · DPO · SYSTEM · PLATFORM_ADMIN"]):::actor
  a64(["RESEARCH_GOVERNANCE · DPO · PRINCIPAL_INVESTIGATOR · PLATFO…"]):::actor
  t3[("lakehouse.data_lake_zones")]:::tabla
  t4[("messaging.domain_events")]:::tabla
  t5[("messaging.outbox_messages")]:::tabla
  e6>"LakeZoneDefined"]:::evento
  t8[("lakehouse.lakehouse_catalogs")]:::tabla
  e9>"LakehouseCatalogRegistered"]:::evento
  t12[("lakehouse.data_product_versions")]:::tabla
  t13[("lakehouse.data_products")]:::tabla
  e15>"DataProductVersionPublished"]:::evento
  t17[("lakehouse.lakehouse_datasets")]:::tabla
  t18[("lakehouse.lakehouse_schema_versions")]:::tabla
  e20>"LakehouseDatasetRegistered"]:::evento
  t23[("lakehouse.lakehouse_files")]:::tabla
  t24[("lakehouse.lakehouse_lineage_edges")]:::tabla
  t25[("lakehouse.lakehouse_partitions")]:::tabla
  e27>"TransformationRunCompleted"]:::evento
  e28>"LineageRecorded"]:::evento
  t31[("health_data.health_deidentification_profiles")]:::tabla
  t32[("health_data.health_deidentification_runs")]:::tabla
  e34>"HealthBatchDeidentified"]:::evento
  t37[("lakehouse.lakehouse_quality_issues")]:::tabla
  t38[("lakehouse.lakehouse_quality_rules")]:::tabla
  t39[("lakehouse.lakehouse_quality_runs")]:::tabla
  e41>"QualityRunEvaluated"]:::evento
  t44[("lakehouse.cohort_definitions")]:::tabla
  t45[("lakehouse.research_projects")]:::tabla
  e47>"CohortDefined"]:::evento
  t50[("lakehouse.dataset_release_requests")]:::tabla
  e52>"DatasetReleaseRequested"]:::evento
  t55[("lakehouse.dataset_release_manifests")]:::tabla
  e57>"DatasetReleaseMaterialized"]:::evento
  e61>"DatasetReleaseRevoked"]:::evento
  subgraph s0["UC-63-01 · Zona del data lake"]
    o1["POST /lakehouse/zones"]:::op
  end
  subgraph s1["UC-63-02 · Catálogo / metastore"]
    o7["POST /lakehouse/catalogs"]:::op
  end
  t14[("+4 tablas más")]
  subgraph s2["UC-63-03 · Producto y versión con contrato y SLO"]
    o10["POST /lakehouse/data-products/{id}/versions"]:::op
  end
  t19[("+3 tablas más")]
  subgraph s3["UC-63-04 · Dataset y versión de esquema"]
    o16["POST /lakehouse/datasets"]:::op
  end
  t26[("+7 tablas más")]
  subgraph s4["UC-63-05 · Corrida: particiones y archivos"]
    o21["POST /lakehouse/transformations/{defId}/runs"]:::op
  end
  t33[("+6 tablas más")]
  subgraph s5["UC-63-07 · Ingesta de salud de-identificada"]
    o29["POST /lakehouse/ingestion/curated-runs"]:::op
  end
  t40[("+3 tablas más")]
  subgraph s6["UC-63-08 · Calidad y hallazgos"]
    o35["POST /lakehouse/datasets/{id}/quality-runs"]:::op
  end
  t46[("+2 tablas más")]
  subgraph s7["UC-63-09 · Proyecto y cohorte"]
    o42["POST /research/projects/{id}/cohorts"]:::op
  end
  t51[("+2 tablas más")]
  subgraph s8["UC-63-10 · Solicitar release"]
    o48["POST /research/dataset-releases"]:::op
  end
  t56[("+4 tablas más")]
  subgraph s9["UC-63-11 · Aprobar y materializar"]
    o53["POST /research/dataset-releases/{id}/approve"]:::op
  end
  t60[("+1 tablas más")]
  subgraph s10["UC-63-12 · Expirar o revocar"]
    o58["POST /research/dataset-releases/{id}/revoke"]:::op
  end
  subgraph s11["ctrl:ResearchController · Operaciones de ResearchController que el README no as…"]
    o62["GET /research/dataset-releases/expired"]:::op
    o63["POST /research/deidentification-profiles"]:::op
  end
  a2 --> o1
  o1 -->|"CREA"| t3
  o1 -->|"LEE"| t3
  o1 -->|"CREA"| t4
  o1 -->|"CREA"| t5
  o1 -->|"LEE"| t5
  o1 -->|"evento"| e6
  a2 --> o7
  o7 -->|"CREA"| t8
  o7 -->|"LEE"| t8
  o7 -->|"CREA"| t4
  o7 -->|"CREA"| t5
  o7 -->|"LEE"| t5
  o7 -->|"evento"| e9
  a11 --> o10
  o10 -->|"ACTUALIZA"| t12
  o10 -->|"CREA"| t12
  o10 -->|"LEE"| t12
  o10 -->|"ACTUALIZA"| t13
  o10 -->|"CREA"| t13
  o10 -->|"LEE"| t13
  o10 -.-> t14
  o10 -->|"evento"| e15
  a2 --> o16
  o16 -->|"LEE"| t3
  o16 -->|"LEE"| t12
  o16 -->|"LEE"| t8
  o16 -->|"CREA"| t17
  o16 -->|"LEE"| t17
  o16 -->|"CREA"| t18
  o16 -.-> t19
  o16 -->|"evento"| e20
  a22 --> o21
  o21 -->|"LEE"| t17
  o21 -->|"CREA"| t23
  o21 -->|"LEE"| t23
  o21 -->|"CREA"| t24
  o21 -->|"CREA"| t25
  o21 -->|"LEE"| t25
  o21 -.-> t26
  o21 -->|"evento"| e27
  o21 -->|"evento"| e28
  a30 --> o29
  o29 -->|"LEE"| t31
  o29 -->|"CREA"| t32
  o29 -->|"LEE"| t3
  o29 -->|"LEE"| t17
  o29 -->|"CREA"| t23
  o29 -->|"LEE"| t23
  o29 -.-> t33
  o29 -->|"evento"| e34
  a36 --> o35
  o35 -->|"ACTUALIZA"| t17
  o35 -->|"LEE"| t17
  o35 -->|"CREA"| t37
  o35 -->|"LEE"| t38
  o35 -->|"ACTUALIZA"| t39
  o35 -->|"CREA"| t39
  o35 -.-> t40
  o35 -->|"evento"| e41
  a43 --> o42
  o42 -->|"CREA"| t44
  o42 -->|"LEE"| t44
  o42 -->|"ACTUALIZA"| t45
  o42 -->|"CREA"| t45
  o42 -->|"LEE"| t45
  o42 -->|"CREA"| t4
  o42 -.-> t46
  o42 -->|"evento"| e47
  a49 --> o48
  o48 -->|"LEE"| t44
  o48 -->|"LEE"| t12
  o48 -->|"LEE"| t13
  o48 -->|"CREA"| t50
  o48 -->|"LEE"| t45
  o48 -->|"CREA"| t4
  o48 -.-> t51
  o48 -->|"evento"| e52
  a54 --> o53
  o53 -->|"CREA"| t32
  o53 -->|"LEE"| t44
  o53 -->|"CREA"| t55
  o53 -->|"LEE"| t55
  o53 -->|"ACTUALIZA"| t50
  o53 -->|"LEE"| t50
  o53 -.-> t56
  o53 -->|"evento"| e57
  a59 --> o58
  o58 -->|"ACTUALIZA"| t55
  o58 -->|"LEE"| t55
  o58 -->|"ACTUALIZA"| t50
  o58 -->|"LEE"| t50
  o58 -->|"CREA"| t4
  o58 -->|"CREA"| t5
  o58 -.-> t60
  o58 -->|"evento"| e61
  a59 --> o62
  o62 -->|"LEE"| t55
  o62 -->|"LEE"| t50
  a64 --> o63
  o63 -->|"CREA"| t31
  classDef op fill:#fff,stroke:#446
  classDef actor fill:#eef,stroke:#66a
  classDef tabla fill:#ffd,stroke:#aa3
  classDef evento fill:#efe,stroke:#3a3
```

## Árbol de decisión por operación

Cada árbol se deriva del código del handler y de los métodos que invoca (hasta 4 niveles). Una rama que no decide, no escribe y no falla se poda. Los accesos y los efectos consecutivos se agrupan en un solo nodo.

### Operaciones con decisiones propias

#### 1. POST /lakehouse/catalogs

Registrar el catálogo / metastore

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe un catálogo con ese código. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a LakehouseCatalogService.registerCatalog"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a LakehouseCatalogRepository.findCatalogByCode"]:::llamada
  n4 --> n5
  n6[("LEE lakehouse.lakehouse_catalogs")]:::efecto
  n5 --> n6
  n7{"duplicate"}:::decision
  n6 --> n7
  n8(["409 CONFLICT Ya existe un catálogo con ese código."]):::error
  n7 -->|"sí"| n8
  n9["Llama a LakehouseCatalogRepository.createCatalog"]:::llamada
  n7 -->|"no"| n9
  n10[("CREA lakehouse.lakehouse_catalogs")]:::efecto
  n9 --> n10
  n11["Llama a OutboxService.publishDomainEvent"]:::llamada
  n10 --> n11
  n12["Llama a MessagingTraceService.runInProducerSpan"]:::llamada
  n11 --> n12
  n13["Transacción: startActiveSpan(…)"]:::transaccion
  n12 --> n13
  n14["Intenta"]:::intento
  n13 --> n14
  n15(["↩ (relanza el error capturado)"]):::error
  n14 -->|"si falla"| n15
  n16["Llama a OutboxService.persistDomainEvent"]:::llamada
  n14 --> n16
  n17["Llama a OutboxRepository.findOutboxByIdempotencyKey"]:::llamada
  n16 --> n17
  n18[("LEE messaging.outbox_messages")]:::efecto
  n17 --> n18
  n19["Llama a OutboxRepository.createDomainEvent"]:::llamada
  n18 --> n19
  n20[("CREA messaging.domain_events")]:::efecto
  n19 --> n20
  n21["Llama a OutboxRepository.createOutboxMessage"]:::llamada
  n20 --> n21
  n22[("CREA messaging.outbox_messages")]:::efecto
  n21 --> n22
  n23>"Evento LakehouseCatalogRegistered"]:::evento
  n22 --> n23
  n24(("201 Responde con éxito")):::ok
  n23 --> n24
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 2. POST /lakehouse/data-products/{id}/versions

Publicar el producto de datos y su versión

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe un producto con ese código para el tenant, con otro identificador.; ConflictException: El producto existente tiene otro código o pertenece a otro tenant.; ConflictException: Esa versión del producto ya está publicada.; ConflictException: Dos reglas de calidad comparten el mismo código. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a LakehouseCatalogService.publishProductVersion"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a LakehouseCatalogRepository.findProductForUpdate"]:::llamada
  n4 --> n5
  n6[("LEE lakehouse.data_products")]:::efecto
  n5 --> n6
  n7{"!product"}:::decision
  n6 --> n7
  n8["Llama a LakehouseCatalogRepository.findProductByCode"]:::llamada
  n7 -->|"sí"| n8
  n9[("LEE lakehouse.data_products")]:::efecto
  n8 --> n9
  n10{"byCode"}:::decision
  n9 --> n10
  n11(["409 CONFLICT Ya existe un producto con ese código para el tenant, con otro identificador."]):::error
  n10 -->|"sí"| n11
  n12["Llama a LakehouseCatalogRepository.createProduct"]:::llamada
  n10 -->|"no"| n12
  n13[("CREA lakehouse.data_products")]:::efecto
  n12 --> n13
  n14{"product.code !== dto.code || product.tenantId !== dto.tenantId"}:::decision
  n7 -->|"no"| n14
  n15(["409 CONFLICT El producto existente tiene otro código o pertenece a otro tenant."]):::error
  n14 -->|"sí"| n15
  n16[("ACTUALIZA lakehouse.data_products · ACTUALIZA lakehouse.data_products")]:::efecto
  n14 -->|"no"| n16
  n17{"dto.ownerTeamId"}:::decision
  n16 --> n17
  n18[("ACTUALIZA lakehouse.data_products")]:::efecto
  n17 -->|"sí"| n18
  n19[("ACTUALIZA lakehouse.data_products")]:::efecto
  n18 --> n19
  n17 -->|"no"| n19
  n20{"dto.businessPurpose"}:::decision
  n19 --> n20
  n21[("ACTUALIZA lakehouse.data_products")]:::efecto
  n20 -->|"sí"| n21
  n22{"dto.classificationCode"}:::decision
  n21 --> n22
  n20 -->|"no"| n22
  n23[("ACTUALIZA lakehouse.data_products")]:::efecto
  n22 -->|"sí"| n23
  n24[("ACTUALIZA lakehouse.data_products · ACTUALIZA lakehouse.data_products")]:::efecto
  n23 --> n24
  n22 -->|"no"| n24
  n25["Llama a LakehouseCatalogRepository.findProductVersion"]:::llamada
  n13 --> n25
  n24 --> n25
  n26[("LEE lakehouse.data_product_versions")]:::efecto
  n25 --> n26
  n27{"duplicateVersion"}:::decision
  n26 --> n27
  n28(["409 CONFLICT Esa versión del producto ya está publicada."]):::error
  n27 -->|"sí"| n28
  n29["Llama a LakehouseCatalogRepository.findActiveProductVersionForUpdate"]:::llamada
  n27 -->|"no"| n29
  n30[("LEE lakehouse.data_product_versions")]:::efecto
  n29 --> n30
  n31{"previous"}:::decision
  n30 --> n31
  n32[("ACTUALIZA lakehouse.data_product_versions · ACTUALIZA lakehouse.data_product_versions")]:::efecto
  n31 -->|"sí"| n32
  n33["Llama a LakehouseCatalogRepository.createProductVersion"]:::llamada
  n32 --> n33
  n31 -->|"no"| n33
  n34[("CREA lakehouse.data_product_versions")]:::efecto
  n33 --> n34
  n35["Repite: por cada const rule de dto.qualityRules ?? []"]:::bucle
  n34 --> n35
  n36{"seenRuleCodes.has(rule.ruleCode)"}:::decision
  n35 -->|"cada elemento"| n36
  n37(["409 CONFLICT Dos reglas de calidad comparten el mismo código."]):::error
  n36 -->|"sí"| n37
  n38["Llama a LakehouseCatalogRepository.createQualityRule"]:::llamada
  n36 -->|"no"| n38
  n39[("CREA lakehouse.lakehouse_quality_rules")]:::efecto
  n38 --> n39
  n40["Llama a OutboxService.publishDomainEvent"]:::llamada
  n39 --> n40
  n35 -->|"al terminar"| n40
  n41["Llama a MessagingTraceService.runInProducerSpan"]:::llamada
  n40 --> n41
  n42["Transacción: startActiveSpan(…)"]:::transaccion
  n41 --> n42
  n43["Intenta"]:::intento
  n42 --> n43
  n44(["↩ (relanza el error capturado)"]):::error
  n43 -->|"si falla"| n44
  n45["Llama a OutboxService.persistDomainEvent"]:::llamada
  n43 --> n45
  n46["Llama a OutboxRepository.findOutboxByIdempotencyKey"]:::llamada
  n45 --> n46
  n47[("LEE messaging.outbox_messages")]:::efecto
  n46 --> n47
  n48["Llama a OutboxRepository.createDomainEvent"]:::llamada
  n47 --> n48
  n49[("CREA messaging.domain_events")]:::efecto
  n48 --> n49
  n50["Llama a OutboxRepository.createOutboxMessage"]:::llamada
  n49 --> n50
  n51[("CREA messaging.outbox_messages")]:::efecto
  n50 --> n51
  n52>"Evento DataProductVersionPublished"]:::evento
  n51 --> n52
  n53(("201 Responde con éxito")):::ok
  n52 --> n53
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 3. POST /lakehouse/datasets

Registrar el dataset y su esquema inicial

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Versión de producto no encontrada.; ResourceNotFoundException: Zona no encontrada.; ResourceNotFoundException: Catálogo no encontrado. |
| 409 | `CONFLICT` | ConflictException: Ya hay un dataset registrado para esa tabla. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La versión del producto ya no es la vigente.; PreconditionFailedException: La zona no está activa.; PreconditionFailedException: El catálogo no está activo. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a LakehouseCatalogService.registerDataset"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a LakehouseCatalogRepository.findProductVersionById"]:::llamada
  n4 --> n5
  n6[("LEE lakehouse.data_product_versions")]:::efecto
  n5 --> n6
  n7{"!productVersion"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Versión de producto no encontrada."]):::error
  n7 -->|"sí"| n8
  n9{"productVersion.state !== 'active'"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED La versión del producto ya no es la vigente."]):::error
  n9 -->|"sí"| n10
  n11["Llama a LakehouseCatalogRepository.findZoneById"]:::llamada
  n9 -->|"no"| n11
  n12[("LEE lakehouse.data_lake_zones")]:::efecto
  n11 --> n12
  n13{"!zone"}:::decision
  n12 --> n13
  n14(["404 NOT_FOUND Zona no encontrada."]):::error
  n13 -->|"sí"| n14
  n15{"zone.state !== 'active'"}:::decision
  n13 -->|"no"| n15
  n16(["422 PRECONDITION_FAILED La zona no está activa."]):::error
  n15 -->|"sí"| n16
  n17["Llama a LakehouseCatalogRepository.findCatalogById"]:::llamada
  n15 -->|"no"| n17
  n18[("LEE lakehouse.lakehouse_catalogs")]:::efecto
  n17 --> n18
  n19{"!catalog"}:::decision
  n18 --> n19
  n20(["404 NOT_FOUND Catálogo no encontrado."]):::error
  n19 -->|"sí"| n20
  n21{"catalog.state !== 'active'"}:::decision
  n19 -->|"no"| n21
  n22(["422 PRECONDITION_FAILED El catálogo no está activo."]):::error
  n21 -->|"sí"| n22
  n23["Llama a LakehouseCatalogRepository.findDatasetByTable"]:::llamada
  n21 -->|"no"| n23
  n24[("LEE lakehouse.lakehouse_datasets")]:::efecto
  n23 --> n24
  n25{"duplicate"}:::decision
  n24 --> n25
  n26(["409 CONFLICT Ya hay un dataset registrado para esa tabla."]):::error
  n25 -->|"sí"| n26
  n27["Llama a LakehouseCatalogRepository.createDataset"]:::llamada
  n25 -->|"no"| n27
  n28[("CREA lakehouse.lakehouse_datasets")]:::efecto
  n27 --> n28
  n29["Llama a LakehouseCatalogRepository.createSchemaVersion"]:::llamada
  n28 --> n29
  n30[("CREA lakehouse.lakehouse_schema_versions")]:::efecto
  n29 --> n30
  n31["Llama a OutboxService.publishDomainEvent"]:::llamada
  n30 --> n31
  n32["Llama a MessagingTraceService.runInProducerSpan"]:::llamada
  n31 --> n32
  n33["Transacción: startActiveSpan(…)"]:::transaccion
  n32 --> n33
  n34["Intenta"]:::intento
  n33 --> n34
  n35(["↩ (relanza el error capturado)"]):::error
  n34 -->|"si falla"| n35
  n36["Llama a OutboxService.persistDomainEvent"]:::llamada
  n34 --> n36
  n37["Llama a OutboxRepository.findOutboxByIdempotencyKey"]:::llamada
  n36 --> n37
  n38[("LEE messaging.outbox_messages")]:::efecto
  n37 --> n38
  n39["Llama a OutboxRepository.createDomainEvent"]:::llamada
  n38 --> n39
  n40[("CREA messaging.domain_events")]:::efecto
  n39 --> n40
  n41["Llama a OutboxRepository.createOutboxMessage"]:::llamada
  n40 --> n41
  n42[("CREA messaging.outbox_messages")]:::efecto
  n41 --> n42
  n43>"Evento LakehouseDatasetRegistered"]:::evento
  n42 --> n43
  n44(("201 Responde con éxito")):::ok
  n43 --> n44
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 4. POST /lakehouse/datasets/{id}/quality-runs

Evaluar la calidad del dataset y abrir hallazgos

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Dataset no encontrado. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El hallazgo cita una regla que no está activa para la versión del producto. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a TransformationService.runQualityCheck"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a LakehouseCatalogRepository.findDatasetForUpdate"]:::llamada
  n4 --> n5
  n6[("LEE lakehouse.lakehouse_datasets")]:::efecto
  n5 --> n6
  n7{"!dataset"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Dataset no encontrado."]):::error
  n7 -->|"sí"| n8
  n9["Llama a LakehouseCatalogRepository.findActiveQualityRules"]:::llamada
  n7 -->|"no"| n9
  n10[("LEE lakehouse.lakehouse_quality_rules")]:::efecto
  n9 --> n10
  n11["Llama a LakehouseRuntimeRepository.createQualityRun"]:::llamada
  n10 --> n11
  n12[("CREA lakehouse.lakehouse_quality_runs")]:::efecto
  n11 --> n12
  n13["Repite: por cada const finding de dto.findings ?? []"]:::bucle
  n12 --> n13
  n14{"!rule"}:::decision
  n13 -->|"cada elemento"| n14
  n15(["422 PRECONDITION_FAILED El hallazgo cita una regla que no está activa para la versión del producto."]):::error
  n14 -->|"sí"| n15
  n16["Llama a LakehouseRuntimeRepository.createQualityIssue"]:::llamada
  n14 -->|"no"| n16
  n17[("CREA lakehouse.lakehouse_quality_issues")]:::efecto
  n16 --> n17
  n18[("ACTUALIZA lakehouse.lakehouse_quality_runs · ACTUALIZA lakehouse.lakehouse_quality_runs · ACTUALIZA lakehouse…")]:::efecto
  n17 --> n18
  n13 -->|"al terminar"| n18
  n19{"quarantine && dataset.lifecycleState !== 'quarantined'"}:::decision
  n18 --> n19
  n20[("ACTUALIZA lakehouse.lakehouse_datasets")]:::efecto
  n19 -->|"sí"| n20
  n21["Llama a OutboxService.publishDomainEvent"]:::llamada
  n20 --> n21
  n19 -->|"no"| n21
  n22["Llama a MessagingTraceService.runInProducerSpan"]:::llamada
  n21 --> n22
  n23["Transacción: startActiveSpan(…)"]:::transaccion
  n22 --> n23
  n24["Intenta"]:::intento
  n23 --> n24
  n25(["↩ (relanza el error capturado)"]):::error
  n24 -->|"si falla"| n25
  n26["Llama a OutboxService.persistDomainEvent"]:::llamada
  n24 --> n26
  n27["Llama a OutboxRepository.findOutboxByIdempotencyKey"]:::llamada
  n26 --> n27
  n28[("LEE messaging.outbox_messages")]:::efecto
  n27 --> n28
  n29["Llama a OutboxRepository.createDomainEvent"]:::llamada
  n28 --> n29
  n30[("CREA messaging.domain_events")]:::efecto
  n29 --> n30
  n31["Llama a OutboxRepository.createOutboxMessage"]:::llamada
  n30 --> n31
  n32[("CREA messaging.outbox_messages")]:::efecto
  n31 --> n32
  n33>"Evento QualityRunEvaluated"]:::evento
  n32 --> n33
  n34(("201 Responde con éxito")):::ok
  n33 --> n34
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 5. POST /lakehouse/ingestion/curated-runs

Ingerir dato de salud de-identificado en la zona curada

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Dataset objetivo no encontrado.; ResourceNotFoundException: Perfil de de-identificación no encontrado. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El dataset objetivo no está activo; no admite escrituras.; PreconditionFailedException: La ingesta de-identificada sólo puede escribir en la zona curated. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a TransformationService.ingestCurated"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a TransformationService.requireWritableDataset"]:::llamada
  n4 --> n5
  n6["Llama a LakehouseCatalogRepository.findDatasetById"]:::llamada
  n5 --> n6
  n7[("LEE lakehouse.lakehouse_datasets")]:::efecto
  n6 --> n7
  n8{"!dataset"}:::decision
  n7 --> n8
  n9(["404 NOT_FOUND Dataset objetivo no encontrado."]):::error
  n8 -->|"sí"| n9
  n10{"dataset.lifecycleState !== 'active'"}:::decision
  n8 -->|"no"| n10
  n11(["422 PRECONDITION_FAILED El dataset objetivo no está activo; no admite escrituras."]):::error
  n10 -->|"sí"| n11
  n12["Llama a LakehouseCatalogRepository.findZoneById"]:::llamada
  n10 -->|"no"| n12
  n13[("LEE lakehouse.data_lake_zones")]:::efecto
  n12 --> n13
  n14{"!zone || zone.zoneType !== 'curated'"}:::decision
  n13 --> n14
  n15(["422 PRECONDITION_FAILED La ingesta de-identificada sólo puede escribir en la zona curated."]):::error
  n14 -->|"sí"| n15
  n16["Llama a DataReleaseRepository.findDeidProfileById"]:::llamada
  n14 -->|"no"| n16
  n17[("LEE health_data.health_deidentification_profiles")]:::efecto
  n16 --> n17
  n18{"!profile"}:::decision
  n17 --> n18
  n19(["404 NOT_FOUND Perfil de de-identificación no encontrado."]):::error
  n18 -->|"sí"| n19
  n20["Llama a DataReleaseRepository.createDeidRun"]:::llamada
  n18 -->|"no"| n20
  n21[("CREA health_data.health_deidentification_runs")]:::efecto
  n20 --> n21
  n22["Llama a TransformationService.materialize"]:::llamada
  n21 --> n22
  n23["Repite: por cada const input$ de input.partitions"]:::bucle
  n22 --> n23
  n24["Llama a LakehouseRuntimeRepository.findPartitionByHash"]:::llamada
  n23 -->|"cada elemento"| n24
  n25[("LEE lakehouse.lakehouse_partitions")]:::efecto
  n24 --> n25
  n26["Llama a LakehouseRuntimeRepository.createPartition"]:::llamada
  n25 --> n26
  n27[("CREA lakehouse.lakehouse_partitions")]:::efecto
  n26 --> n27
  n28["Repite: por cada const file de input$.files"]:::bucle
  n27 --> n28
  n29["Llama a LakehouseRuntimeRepository.findFileByHash"]:::llamada
  n28 -->|"cada elemento"| n29
  n30[("LEE lakehouse.lakehouse_files")]:::efecto
  n29 --> n30
  n31["Llama a LakehouseRuntimeRepository.createFile"]:::llamada
  n30 --> n31
  n32[("CREA lakehouse.lakehouse_files")]:::efecto
  n31 --> n32
  n33{"input.runId"}:::decision
  n32 --> n33
  n28 -->|"al terminar"| n33
  n34["Repite: por cada const sourceDatasetId de input.sourceDatasetIds"]:::bucle
  n33 -->|"sí"| n34
  n35{"sourcePartitionIds.length === 0"}:::decision
  n34 -->|"cada elemento"| n35
  n36["Llama a LakehouseRuntimeRepository.createLineageEdge"]:::llamada
  n35 -->|"sí"| n36
  n37[("CREA lakehouse.lakehouse_lineage_edges")]:::efecto
  n36 --> n37
  n38["Repite: por cada const sourcePartitionId de sourcePartitionIds"]:::bucle
  n37 --> n38
  n35 -->|"no"| n38
  n39["Llama a LakehouseRuntimeRepository.createLineageEdge"]:::llamada
  n38 -->|"cada elemento"| n39
  n40[("CREA lakehouse.lakehouse_lineage_edges")]:::efecto
  n39 --> n40
  n41["Llama a OutboxService.publishDomainEvent"]:::llamada
  n40 --> n41
  n38 -->|"al terminar"| n41
  n34 -->|"al terminar"| n41
  n33 -->|"no"| n41
  n23 -->|"al terminar"| n41
  n42["Llama a MessagingTraceService.runInProducerSpan"]:::llamada
  n41 --> n42
  n43["Transacción: startActiveSpan(…)"]:::transaccion
  n42 --> n43
  n44["Intenta"]:::intento
  n43 --> n44
  n45(["↩ (relanza el error capturado)"]):::error
  n44 -->|"si falla"| n45
  n46["Llama a OutboxService.persistDomainEvent"]:::llamada
  n44 --> n46
  n47["Llama a OutboxRepository.findOutboxByIdempotencyKey"]:::llamada
  n46 --> n47
  n48[("LEE messaging.outbox_messages")]:::efecto
  n47 --> n48
  n49["Llama a OutboxRepository.createDomainEvent"]:::llamada
  n48 --> n49
  n50[("CREA messaging.domain_events")]:::efecto
  n49 --> n50
  n51["Llama a OutboxRepository.createOutboxMessage"]:::llamada
  n50 --> n51
  n52[("CREA messaging.outbox_messages")]:::efecto
  n51 --> n52
  n53>"Evento HealthBatchDeidentified"]:::evento
  n52 --> n53
  n54(("201 Responde con éxito")):::ok
  n53 --> n54
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 6. POST /lakehouse/transformations/{defId}/runs

Registrar la corrida con sus particiones, archivos y linaje

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Definición de transformación no encontrada.; ResourceNotFoundException: Dataset objetivo no encontrado. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La definición de transformación no está activa.; PreconditionFailedException: El dataset objetivo no está activo; no admite escrituras. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a TransformationService.runTransformation"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a LakehouseRuntimeRepository.findDefinitionById"]:::llamada
  n4 --> n5
  n6[("LEE lakehouse.transformation_definitions")]:::efecto
  n5 --> n6
  n7{"!definition"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Definición de transformación no encontrada."]):::error
  n7 -->|"sí"| n8
  n9{"definition.state !== 'active'"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED La definición de transformación no está activa."]):::error
  n9 -->|"sí"| n10
  n11["Llama a LakehouseRuntimeRepository.findLiveRunByTargetForUpdate"]:::llamada
  n9 -->|"no"| n11
  n12[("LEE lakehouse.transformation_runs")]:::efecto
  n11 --> n12
  n13["Llama a TransformationService.requireWritableDataset"]:::llamada
  n12 --> n13
  n14["Llama a LakehouseCatalogRepository.findDatasetById"]:::llamada
  n13 --> n14
  n15[("LEE lakehouse.lakehouse_datasets")]:::efecto
  n14 --> n15
  n16{"!dataset"}:::decision
  n15 --> n16
  n17(["404 NOT_FOUND Dataset objetivo no encontrado."]):::error
  n16 -->|"sí"| n17
  n18{"dataset.lifecycleState !== 'active'"}:::decision
  n16 -->|"no"| n18
  n19(["422 PRECONDITION_FAILED El dataset objetivo no está activo; no admite escrituras."]):::error
  n18 -->|"sí"| n19
  n20["Llama a LakehouseRuntimeRepository.createRun"]:::llamada
  n18 -->|"no"| n20
  n21[("CREA lakehouse.transformation_runs")]:::efecto
  n20 --> n21
  n22["Llama a TransformationService.materialize"]:::llamada
  n21 --> n22
  n23["Repite: por cada const input$ de input.partitions"]:::bucle
  n22 --> n23
  n24["Llama a LakehouseRuntimeRepository.findPartitionByHash"]:::llamada
  n23 -->|"cada elemento"| n24
  n25[("LEE lakehouse.lakehouse_partitions")]:::efecto
  n24 --> n25
  n26["Llama a LakehouseRuntimeRepository.createPartition"]:::llamada
  n25 --> n26
  n27[("CREA lakehouse.lakehouse_partitions")]:::efecto
  n26 --> n27
  n28["Repite: por cada const file de input$.files"]:::bucle
  n27 --> n28
  n29["Llama a LakehouseRuntimeRepository.findFileByHash"]:::llamada
  n28 -->|"cada elemento"| n29
  n30[("LEE lakehouse.lakehouse_files")]:::efecto
  n29 --> n30
  n31["Llama a LakehouseRuntimeRepository.createFile"]:::llamada
  n30 --> n31
  n32[("CREA lakehouse.lakehouse_files")]:::efecto
  n31 --> n32
  n33{"input.runId"}:::decision
  n32 --> n33
  n28 -->|"al terminar"| n33
  n34["Repite: por cada const sourceDatasetId de input.sourceDatasetIds"]:::bucle
  n33 -->|"sí"| n34
  n35{"sourcePartitionIds.length === 0"}:::decision
  n34 -->|"cada elemento"| n35
  n36["Llama a LakehouseRuntimeRepository.createLineageEdge"]:::llamada
  n35 -->|"sí"| n36
  n37[("CREA lakehouse.lakehouse_lineage_edges")]:::efecto
  n36 --> n37
  n38["Repite: por cada const sourcePartitionId de sourcePartitionIds"]:::bucle
  n37 --> n38
  n35 -->|"no"| n38
  n39["Llama a LakehouseRuntimeRepository.createLineageEdge"]:::llamada
  n38 -->|"cada elemento"| n39
  n40[("CREA lakehouse.lakehouse_lineage_edges")]:::efecto
  n39 --> n40
  n41[("ACTUALIZA lakehouse.transformation_runs · ACTUALIZA lakehouse.transformation_runs · ACTUALIZA lakehouse.trans…")]:::efecto
  n40 --> n41
  n38 -->|"al terminar"| n41
  n34 -->|"al terminar"| n41
  n33 -->|"no"| n41
  n23 -->|"al terminar"| n41
  n42["Llama a OutboxService.publishDomainEvent"]:::llamada
  n41 --> n42
  n43["Llama a MessagingTraceService.runInProducerSpan"]:::llamada
  n42 --> n43
  n44["Transacción: startActiveSpan(…)"]:::transaccion
  n43 --> n44
  n45["Intenta"]:::intento
  n44 --> n45
  n46(["↩ (relanza el error capturado)"]):::error
  n45 -->|"si falla"| n46
  n47["Llama a OutboxService.persistDomainEvent"]:::llamada
  n45 --> n47
  n48["Llama a OutboxRepository.findOutboxByIdempotencyKey"]:::llamada
  n47 --> n48
  n49[("LEE messaging.outbox_messages")]:::efecto
  n48 --> n49
  n50["Llama a OutboxRepository.createDomainEvent"]:::llamada
  n49 --> n50
  n51[("CREA messaging.domain_events")]:::efecto
  n50 --> n51
  n52["Llama a OutboxRepository.createOutboxMessage"]:::llamada
  n51 --> n52
  n53[("CREA messaging.outbox_messages")]:::efecto
  n52 --> n53
  n54>"Evento TransformationRunCompleted"]:::evento
  n53 --> n54
  n55{"result.lineageEdges › 0"}:::decision
  n54 --> n55
  n56["Llama a OutboxService.publishDomainEvent"]:::llamada
  n55 -->|"sí"| n56
  n57["Llama a MessagingTraceService.runInProducerSpan"]:::llamada
  n56 --> n57
  n58["Transacción: startActiveSpan(…)"]:::transaccion
  n57 --> n58
  n59["Intenta"]:::intento
  n58 --> n59
  n60(["↩ (relanza el error capturado)"]):::error
  n59 -->|"si falla"| n60
  n61["Llama a OutboxService.persistDomainEvent"]:::llamada
  n59 --> n61
  n62["Llama a OutboxRepository.findOutboxByIdempotencyKey"]:::llamada
  n61 --> n62
  n63[("LEE messaging.outbox_messages")]:::efecto
  n62 --> n63
  n64["Llama a OutboxRepository.createDomainEvent"]:::llamada
  n63 --> n64
  n65[("CREA messaging.domain_events")]:::efecto
  n64 --> n65
  n66["Llama a OutboxRepository.createOutboxMessage"]:::llamada
  n65 --> n66
  n67[("CREA messaging.outbox_messages")]:::efecto
  n66 --> n67
  n68>"Evento LineageRecorded"]:::evento
  n67 --> n68
  n69(("201 Responde con éxito")):::ok
  n68 --> n69
  n55 -->|"no"| n69
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 7. POST /lakehouse/zones

Definir una zona del data lake

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe una zona con ese código. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a LakehouseCatalogService.defineZone"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a LakehouseCatalogRepository.findZoneByCode"]:::llamada
  n4 --> n5
  n6[("LEE lakehouse.data_lake_zones")]:::efecto
  n5 --> n6
  n7{"duplicate"}:::decision
  n6 --> n7
  n8(["409 CONFLICT Ya existe una zona con ese código."]):::error
  n7 -->|"sí"| n8
  n9["Llama a LakehouseCatalogRepository.createZone"]:::llamada
  n7 -->|"no"| n9
  n10[("CREA lakehouse.data_lake_zones")]:::efecto
  n9 --> n10
  n11["Llama a OutboxService.publishDomainEvent"]:::llamada
  n10 --> n11
  n12["Llama a MessagingTraceService.runInProducerSpan"]:::llamada
  n11 --> n12
  n13["Transacción: startActiveSpan(…)"]:::transaccion
  n12 --> n13
  n14["Intenta"]:::intento
  n13 --> n14
  n15(["↩ (relanza el error capturado)"]):::error
  n14 -->|"si falla"| n15
  n16["Llama a OutboxService.persistDomainEvent"]:::llamada
  n14 --> n16
  n17["Llama a OutboxRepository.findOutboxByIdempotencyKey"]:::llamada
  n16 --> n17
  n18[("LEE messaging.outbox_messages")]:::efecto
  n17 --> n18
  n19["Llama a OutboxRepository.createDomainEvent"]:::llamada
  n18 --> n19
  n20[("CREA messaging.domain_events")]:::efecto
  n19 --> n20
  n21["Llama a OutboxRepository.createOutboxMessage"]:::llamada
  n20 --> n21
  n22[("CREA messaging.outbox_messages")]:::efecto
  n21 --> n22
  n23>"Evento LakeZoneDefined"]:::evento
  n22 --> n23
  n24(("201 Responde con éxito")):::ok
  n23 --> n24
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 8. POST /research/dataset-releases

Solicitar el release de un dataset para investigación

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Proyecto de investigación no encontrado.; ResourceNotFoundException: La cohorte no pertenece a ese proyecto.; ResourceNotFoundException: Versión de producto no encontrada. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El proyecto no está aprobado.; PreconditionFailedException: La ventana de aprobación ética del proyecto no está vigente.; PreconditionFailedException: La cohorte no está activa.; PreconditionFailedException: El producto contiene datos de paciente y la cohorte no declara perfil de de-identificación. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a ResearchReleaseService.requestRelease"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a ResearchRepository.findProjectById"]:::llamada
  n4 --> n5
  n6[("LEE lakehouse.research_projects")]:::efecto
  n5 --> n6
  n7{"!project"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Proyecto de investigación no encontrado."]):::error
  n7 -->|"sí"| n8
  n9{"project.state !== 'approved'"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED El proyecto no está aprobado."]):::error
  n9 -->|"sí"| n10
  n11{"project.approvedTo ‹= now || project.approvedFrom › now"}:::decision
  n9 -->|"no"| n11
  n12(["422 PRECONDITION_FAILED La ventana de aprobación ética del proyecto no está vigente."]):::error
  n11 -->|"sí"| n12
  n13["Llama a ResearchRepository.findCohortById"]:::llamada
  n11 -->|"no"| n13
  n14[("LEE lakehouse.cohort_definitions")]:::efecto
  n13 --> n14
  n15{"!cohort || cohort.researchProjectId !== project.id"}:::decision
  n14 --> n15
  n16(["404 NOT_FOUND La cohorte no pertenece a ese proyecto."]):::error
  n15 -->|"sí"| n16
  n17{"cohort.state !== 'active'"}:::decision
  n15 -->|"no"| n17
  n18(["422 PRECONDITION_FAILED La cohorte no está activa."]):::error
  n17 -->|"sí"| n18
  n19["Llama a LakehouseCatalogRepository.findProductVersionById"]:::llamada
  n17 -->|"no"| n19
  n20[("LEE lakehouse.data_product_versions")]:::efecto
  n19 --> n20
  n21{"!productVersion"}:::decision
  n20 --> n21
  n22(["404 NOT_FOUND Versión de producto no encontrada."]):::error
  n21 -->|"sí"| n22
  n23["Llama a LakehouseCatalogRepository.findProductForUpdate"]:::llamada
  n21 -->|"no"| n23
  n24[("LEE lakehouse.data_products")]:::efecto
  n23 --> n24
  n25{"product?.containsPhi && !cohort.deidentificationProfileId"}:::decision
  n24 --> n25
  n26(["422 PRECONDITION_FAILED El producto contiene datos de paciente y la cohorte no declara perfil de de-identific…"]):::error
  n25 -->|"sí"| n26
  n27["Llama a ResearchRepository.createReleaseRequest"]:::llamada
  n25 -->|"no"| n27
  n28[("CREA lakehouse.dataset_release_requests")]:::efecto
  n27 --> n28
  n29["Llama a OutboxService.publishDomainEvent"]:::llamada
  n28 --> n29
  n30["Llama a MessagingTraceService.runInProducerSpan"]:::llamada
  n29 --> n30
  n31["Transacción: startActiveSpan(…)"]:::transaccion
  n30 --> n31
  n32["Intenta"]:::intento
  n31 --> n32
  n33(["↩ (relanza el error capturado)"]):::error
  n32 -->|"si falla"| n33
  n34["Llama a OutboxService.persistDomainEvent"]:::llamada
  n32 --> n34
  n35["Llama a OutboxRepository.findOutboxByIdempotencyKey"]:::llamada
  n34 --> n35
  n36[("LEE messaging.outbox_messages")]:::efecto
  n35 --> n36
  n37["Llama a OutboxRepository.createDomainEvent"]:::llamada
  n36 --> n37
  n38[("CREA messaging.domain_events")]:::efecto
  n37 --> n38
  n39["Llama a OutboxRepository.createOutboxMessage"]:::llamada
  n38 --> n39
  n40[("CREA messaging.outbox_messages")]:::efecto
  n39 --> n40
  n41>"Evento DatasetReleaseRequested"]:::evento
  n40 --> n41
  n42(("201 Responde con éxito")):::ok
  n41 --> n42
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 9. POST /research/dataset-releases/{id}/approve

Aprobar y materializar el manifiesto de-identificado

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Solicitud de release no encontrada.; ResourceNotFoundException: Proyecto de investigación no encontrado. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La solicitud no está en un estado que admita aprobación.; PreconditionFailedException: La aprobación ética del proyecto caducó; el release no puede materializarse.; PreconditionFailedException: La cohorte no declara perfil de de-identificación. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a ResearchReleaseService.approveRelease"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a ResearchRepository.findReleaseRequestForUpdate"]:::llamada
  n4 --> n5
  n6[("LEE lakehouse.dataset_release_requests")]:::efecto
  n5 --> n6
  n7{"!request"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Solicitud de release no encontrada."]):::error
  n7 -->|"sí"| n8
  n9["Llama a ResearchRepository.findManifestByRequestForUpdate"]:::llamada
  n7 -->|"no"| n9
  n10[("LEE lakehouse.dataset_release_manifests")]:::efecto
  n9 --> n10
  n11{"!(APPROVABLE_RELEASE_STATUSES as readonly string[]).includes( request.status, )"}:::decision
  n10 --> n11
  n12(["422 PRECONDITION_FAILED La solicitud no está en un estado que admita aprobación."]):::error
  n11 -->|"sí"| n12
  n13["Llama a ResearchRepository.findProjectById"]:::llamada
  n11 -->|"no"| n13
  n14[("LEE lakehouse.research_projects")]:::efecto
  n13 --> n14
  n15{"!project"}:::decision
  n14 --> n15
  n16(["404 NOT_FOUND Proyecto de investigación no encontrado."]):::error
  n15 -->|"sí"| n16
  n17{"project.approvedTo ‹= now"}:::decision
  n15 -->|"no"| n17
  n18(["422 PRECONDITION_FAILED La aprobación ética del proyecto caducó; el release no puede materializarse."]):::error
  n17 -->|"sí"| n18
  n19["Llama a ResearchRepository.findCohortById"]:::llamada
  n17 -->|"no"| n19
  n20[("LEE lakehouse.cohort_definitions")]:::efecto
  n19 --> n20
  n21{"!cohort?.deidentificationProfileId"}:::decision
  n20 --> n21
  n22(["422 PRECONDITION_FAILED La cohorte no declara perfil de de-identificación."]):::error
  n21 -->|"sí"| n22
  n23["Llama a DataReleaseRepository.createDeidRun"]:::llamada
  n21 -->|"no"| n23
  n24[("CREA health_data.health_deidentification_runs")]:::efecto
  n23 --> n24
  n25["Llama a ResearchRepository.createManifest"]:::llamada
  n24 --> n25
  n26[("CREA lakehouse.dataset_release_manifests")]:::efecto
  n25 --> n26
  n27[("ACTUALIZA lakehouse.dataset_release_requests")]:::efecto
  n26 --> n27
  n28["Llama a OutboxService.publishDomainEvent"]:::llamada
  n27 --> n28
  n29["Llama a MessagingTraceService.runInProducerSpan"]:::llamada
  n28 --> n29
  n30["Transacción: startActiveSpan(…)"]:::transaccion
  n29 --> n30
  n31["Intenta"]:::intento
  n30 --> n31
  n32(["↩ (relanza el error capturado)"]):::error
  n31 -->|"si falla"| n32
  n33["Llama a OutboxService.persistDomainEvent"]:::llamada
  n31 --> n33
  n34["Llama a OutboxRepository.findOutboxByIdempotencyKey"]:::llamada
  n33 --> n34
  n35[("LEE messaging.outbox_messages")]:::efecto
  n34 --> n35
  n36["Llama a OutboxRepository.createDomainEvent"]:::llamada
  n35 --> n36
  n37[("CREA messaging.domain_events")]:::efecto
  n36 --> n37
  n38["Llama a OutboxRepository.createOutboxMessage"]:::llamada
  n37 --> n38
  n39[("CREA messaging.outbox_messages")]:::efecto
  n38 --> n39
  n40>"Evento DatasetReleaseMaterialized"]:::evento
  n39 --> n40
  n41(("201 Responde con éxito")):::ok
  n40 --> n41
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 10. POST /research/dataset-releases/{id}/revoke

Expirar o revocar el release

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Solicitud de release no encontrada. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a ResearchReleaseService.revokeRelease"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a ResearchRepository.findReleaseRequestForUpdate"]:::llamada
  n4 --> n5
  n6[("LEE lakehouse.dataset_release_requests")]:::efecto
  n5 --> n6
  n7{"!request"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Solicitud de release no encontrada."]):::error
  n7 -->|"sí"| n8
  n9["Llama a ResearchRepository.findManifestByRequestForUpdate"]:::llamada
  n7 -->|"no"| n9
  n10[("LEE lakehouse.dataset_release_manifests")]:::efecto
  n9 --> n10
  n11[("ACTUALIZA lakehouse.dataset_release_requests")]:::efecto
  n10 --> n11
  n12{"manifest"}:::decision
  n11 --> n12
  n13[("ACTUALIZA lakehouse.dataset_release_manifests")]:::efecto
  n12 -->|"sí"| n13
  n14["Llama a OutboxService.publishDomainEvent"]:::llamada
  n13 --> n14
  n12 -->|"no"| n14
  n15["Llama a MessagingTraceService.runInProducerSpan"]:::llamada
  n14 --> n15
  n16["Transacción: startActiveSpan(…)"]:::transaccion
  n15 --> n16
  n17["Intenta"]:::intento
  n16 --> n17
  n18(["↩ (relanza el error capturado)"]):::error
  n17 -->|"si falla"| n18
  n19["Llama a OutboxService.persistDomainEvent"]:::llamada
  n17 --> n19
  n20["Llama a OutboxRepository.findOutboxByIdempotencyKey"]:::llamada
  n19 --> n20
  n21[("LEE messaging.outbox_messages")]:::efecto
  n20 --> n21
  n22["Llama a OutboxRepository.createDomainEvent"]:::llamada
  n21 --> n22
  n23[("CREA messaging.domain_events")]:::efecto
  n22 --> n23
  n24["Llama a OutboxRepository.createOutboxMessage"]:::llamada
  n23 --> n24
  n25[("CREA messaging.outbox_messages")]:::efecto
  n24 --> n25
  n26>"Evento DatasetReleaseRevoked"]:::evento
  n25 --> n26
  n27(("200 Responde con éxito")):::ok
  n26 --> n27
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 11. GET /research/dataset-releases/expired

Listar releases con manifiesto vencido sin cerrar

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de consulta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a ResearchReleaseService.listExpiredReleases"]:::llamada
  n2 --> n3
  n4["Llama a ResearchRepository.findExpiredManifests"]:::llamada
  n3 --> n4
  n5[("LEE lakehouse.dataset_release_manifests")]:::efecto
  n4 --> n5
  n6["Repite: por cada const manifest de manifests"]:::bucle
  n5 --> n6
  n7["Llama a ResearchRepository.findReleaseRequestById"]:::llamada
  n6 -->|"cada elemento"| n7
  n8[("LEE lakehouse.dataset_release_requests")]:::efecto
  n7 --> n8
  n9(("200 Responde con éxito")):::ok
  n8 --> n9
  n6 -->|"al terminar"| n9
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 12. POST /research/projects/{id}/cohorts

Definir el proyecto de investigación y su cohorte

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe un proyecto con ese código para el tenant, con otro identificador.; ConflictException: El proyecto existente tiene otro código o pertenece a otro tenant.; ConflictException: Esa versión de la cohorte ya está definida. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La ventana de aprobación ética tiene que empezar antes de terminar.; PreconditionFailedException: La aprobación ética ya está caducada. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a ResearchReleaseService.defineCohort"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5{"approvedFrom ›= approvedTo"}:::decision
  n4 --> n5
  n6(["422 PRECONDITION_FAILED La ventana de aprobación ética tiene que empezar antes de terminar."]):::error
  n5 -->|"sí"| n6
  n7{"approvedTo ‹= new Date()"}:::decision
  n5 -->|"no"| n7
  n8(["422 PRECONDITION_FAILED La aprobación ética ya está caducada."]):::error
  n7 -->|"sí"| n8
  n9["Llama a ResearchRepository.findProjectForUpdate"]:::llamada
  n7 -->|"no"| n9
  n10[("LEE lakehouse.research_projects")]:::efecto
  n9 --> n10
  n11{"!project"}:::decision
  n10 --> n11
  n12["Llama a ResearchRepository.findProjectByCode"]:::llamada
  n11 -->|"sí"| n12
  n13[("LEE lakehouse.research_projects")]:::efecto
  n12 --> n13
  n14{"byCode"}:::decision
  n13 --> n14
  n15(["409 CONFLICT Ya existe un proyecto con ese código para el tenant, con otro identificador."]):::error
  n14 -->|"sí"| n15
  n16["Llama a ResearchRepository.createProject"]:::llamada
  n14 -->|"no"| n16
  n17[("CREA lakehouse.research_projects")]:::efecto
  n16 --> n17
  n18{"project.code !== dto.projectCode || project.tenantId !== dto.tenantId"}:::decision
  n11 -->|"no"| n18
  n19(["409 CONFLICT El proyecto existente tiene otro código o pertenece a otro tenant."]):::error
  n18 -->|"sí"| n19
  n20[("ACTUALIZA lakehouse.research_projects")]:::efecto
  n18 -->|"no"| n20
  n21{"dto.protocolReference"}:::decision
  n20 --> n21
  n22[("ACTUALIZA lakehouse.research_projects")]:::efecto
  n21 -->|"sí"| n22
  n23[("ACTUALIZA lakehouse.research_projects · ACTUALIZA lakehouse.research_projects · ACTUALIZA lakehouse.research_…")]:::efecto
  n22 --> n23
  n21 -->|"no"| n23
  n24["Llama a ResearchRepository.findCohortByVersion"]:::llamada
  n17 --> n24
  n23 --> n24
  n25[("LEE lakehouse.cohort_definitions")]:::efecto
  n24 --> n25
  n26{"duplicate"}:::decision
  n25 --> n26
  n27(["409 CONFLICT Esa versión de la cohorte ya está definida."]):::error
  n26 -->|"sí"| n27
  n28["Llama a ResearchRepository.createCohort"]:::llamada
  n26 -->|"no"| n28
  n29[("CREA lakehouse.cohort_definitions")]:::efecto
  n28 --> n29
  n30["Llama a OutboxService.publishDomainEvent"]:::llamada
  n29 --> n30
  n31["Llama a MessagingTraceService.runInProducerSpan"]:::llamada
  n30 --> n31
  n32["Transacción: startActiveSpan(…)"]:::transaccion
  n31 --> n32
  n33["Intenta"]:::intento
  n32 --> n33
  n34(["↩ (relanza el error capturado)"]):::error
  n33 -->|"si falla"| n34
  n35["Llama a OutboxService.persistDomainEvent"]:::llamada
  n33 --> n35
  n36["Llama a OutboxRepository.findOutboxByIdempotencyKey"]:::llamada
  n35 --> n36
  n37[("LEE messaging.outbox_messages")]:::efecto
  n36 --> n37
  n38["Llama a OutboxRepository.createDomainEvent"]:::llamada
  n37 --> n38
  n39[("CREA messaging.domain_events")]:::efecto
  n38 --> n39
  n40["Llama a OutboxRepository.createOutboxMessage"]:::llamada
  n39 --> n40
  n41[("CREA messaging.outbox_messages")]:::efecto
  n40 --> n41
  n42>"Evento CohortDefined"]:::evento
  n41 --> n42
  n43(("201 Responde con éxito")):::ok
  n42 --> n43
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

### Operaciones sin decisiones propias

Sólo comprueban el acceso y leen o escriben: no tienen ramas que dibujar. Su detalle está en la ficha de endpoints.

| Operación | Respuestas posibles | Tablas |
|---|---|---|
| POST /research/deidentification-profiles | 201, 400, 401, 403, 429 | 1 |
