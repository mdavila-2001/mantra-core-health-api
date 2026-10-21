<!-- AUTOGENERADO por tools/inventario/flujos.mjs. No editar manualmente. -->

# Flujos del módulo `data_catalog`

- **Procesos:** 1 · **Máquinas de estado:** 0
- **Operaciones:** 31 (28 con decisiones propias, 3 sin ellas)
- Inventario de endpoints del módulo: [data_catalog](../endpoints/data_catalog.md)

## Proceso: Módulo 67 — Catálogo de datos y portal administrativo

- **Código:** `data_catalog` · **Agrupación:** CASO_DE_USO_README · **Operaciones:** 31
- **Actores:** DATA_PLATFORM_ADMIN · DPO · GOVERNANCE_ADMIN · PLATFORM_ADMIN · SECURITY_ADMIN
- **Revisión:** AUTO_DETECTADA
- **Fuentes:** `src/modules/data_catalog/README.md`

### Para qué sirve

Dos mitades que no se mezclan. `admin/portal/*` sirve el **inventario generado** del sistema (operaciones, flujos, catálogo estático, linaje, glosario) sin tocar la base. `admin/catalog/*` es el **catálogo vivo**: lo que un escaneo de `pg_catalog` observa de la base primaria y lo que el equipo de datos curó encima (fichas, evidencia, revisiones), sobre el esquema `data_catalog`.

_Fuente: `src/modules/data_catalog/README.md:3`_

### Flujo general declarado en el README

```text
POST /admin/catalog/scans (Idempotency-Key)
  └─ 202 QUEUED ── commit ──> escaneo fuera de la petición (lease de 300 s)
       └─ lee pg_catalog en una transacción de sólo lectura
            └─ planScan: compara con lo conocido -> altas / cambios / no observados / reaparecidos
                 └─ catalog_objects + catalog_columns + catalog_change_events (lo curado no se toca)

ficha de un objeto:   PUT annotation (expectedVersion) ──> revisión N inmutable
  └─ submit=true: exige propósito, razón de existir y grano de fila (o una pregunta abierta por campo)
       └─ NEEDS_REVIEW ──> POST review (otro usuario, con evidencia) ──> APPROVED | REJECTED
            └─ editar una ficha aprobada la devuelve a DRAFT: la aprobación deja de ser vigente
```

_Fuente: `src/modules/data_catalog/README.md:56`_

### Etapas y operaciones

| Etapa | Descripción | Operación | Quién actúa | Riesgo | Tablas |
|---|---|---|---|---|---|
| `UC-67-01` | Versión y huella del inventario servido | GET /admin/portal/version | SECURITY_ADMIN · PLATFORM_ADMIN · GOVERNANCE_ADMIN · DATA_PLATFORM_ADMIN · DPO | BAJO | 0 |
| `UC-67-02` | Listar operaciones del sistema, con filtros | GET /admin/portal/operaciones | SECURITY_ADMIN · PLATFORM_ADMIN · GOVERNANCE_ADMIN · DATA_PLATFORM_ADMIN · DPO | BAJO | 0 |
| `UC-67-03` | Ficha de una operación: tablas, DTO, requisitos, flujo | GET /admin/portal/operaciones/{id} | SECURITY_ADMIN · PLATFORM_ADMIN · GOVERNANCE_ADMIN · DATA_PLATFORM_ADMIN · DPO | BAJO | 0 |
| `UC-67-04` | Árbol de decisión de una operación | GET /admin/portal/operaciones/{id}/arbol | SECURITY_ADMIN · PLATFORM_ADMIN · GOVERNANCE_ADMIN · DATA_PLATFORM_ADMIN · DPO | BAJO | 0 |
| `UC-67-05` | Listar procesos | GET /admin/portal/flujos | SECURITY_ADMIN · PLATFORM_ADMIN · GOVERNANCE_ADMIN · DATA_PLATFORM_ADMIN · DPO | BAJO | 0 |
| `UC-67-06` | Mapa de procesos y hallazgos del recorrido | GET /admin/portal/flujos/mapa | SECURITY_ADMIN · PLATFORM_ADMIN · GOVERNANCE_ADMIN · DATA_PLATFORM_ADMIN · DPO | BAJO | 0 |
| `UC-67-07` | Listar hallazgos del inventario de flujos | GET /admin/portal/flujos/hallazgos | SECURITY_ADMIN · PLATFORM_ADMIN · GOVERNANCE_ADMIN · DATA_PLATFORM_ADMIN · DPO | BAJO | 0 |
| `UC-67-08` | Un hallazgo | GET /admin/portal/flujos/hallazgos/{id} | SECURITY_ADMIN · PLATFORM_ADMIN · GOVERNANCE_ADMIN · DATA_PLATFORM_ADMIN · DPO | BAJO | 0 |
| `UC-67-09` | Detalle de un proceso | GET /admin/portal/flujos/{codigo} | SECURITY_ADMIN · PLATFORM_ADMIN · GOVERNANCE_ADMIN · DATA_PLATFORM_ADMIN · DPO | BAJO | 0 |
| `UC-67-10` | Grafo de un proceso | GET /admin/portal/flujos/{codigo}/grafo | SECURITY_ADMIN · PLATFORM_ADMIN · GOVERNANCE_ADMIN · DATA_PLATFORM_ADMIN · DPO | BAJO | 0 |
| `UC-67-11` | Tablas del catálogo estático (modelo), paginadas | GET /admin/portal/catalogo/tablas | SECURITY_ADMIN · PLATFORM_ADMIN · GOVERNANCE_ADMIN · DATA_PLATFORM_ADMIN · DPO | BAJO | 0 |
| `UC-67-12` | Ficha de una tabla: columnas, relaciones, índices | GET /admin/portal/catalogo/tablas/{schema}/{tabla} | SECURITY_ADMIN · PLATFORM_ADMIN · GOVERNANCE_ADMIN · DATA_PLATFORM_ADMIN · DPO | BAJO | 0 |
| `UC-67-13` | Deriva entre modelo, ORM y base desplegada | GET /admin/portal/catalogo/deriva | SECURITY_ADMIN · PLATFORM_ADMIN · GOVERNANCE_ADMIN · DATA_PLATFORM_ADMIN · DPO | BAJO | 0 |
| `UC-67-14` | Grafo de linaje endpoint → tabla | GET /admin/portal/linaje | SECURITY_ADMIN · PLATFORM_ADMIN · GOVERNANCE_ADMIN · DATA_PLATFORM_ADMIN · DPO | BAJO | 0 |
| `UC-67-15` | Linaje de una tabla | GET /admin/portal/linaje/tablas/{schema}/{tabla} | SECURITY_ADMIN · PLATFORM_ADMIN · GOVERNANCE_ADMIN · DATA_PLATFORM_ADMIN · DPO | BAJO | 0 |
| `UC-67-16` | Glosario de dominio | GET /admin/portal/glosario | SECURITY_ADMIN · PLATFORM_ADMIN · GOVERNANCE_ADMIN · DATA_PLATFORM_ADMIN · DPO | BAJO | 0 |
| `UC-67-17` | Schemas observados, con fichas y aprobaciones | GET /admin/catalog/schemas | SECURITY_ADMIN · PLATFORM_ADMIN · GOVERNANCE_ADMIN · DATA_PLATFORM_ADMIN · DPO | BAJO | 2 |
| `UC-67-18` | Objetos observados, con filtros y cursor | GET /admin/catalog/objects | SECURITY_ADMIN · PLATFORM_ADMIN · GOVERNANCE_ADMIN · DATA_PLATFORM_ADMIN · DPO | BAJO | 3 |
| `UC-67-19` | Ficha técnica, observación, ficha curada, cobertura | GET /admin/catalog/objects/{id} | SECURITY_ADMIN · PLATFORM_ADMIN · GOVERNANCE_ADMIN · DATA_PLATFORM_ADMIN · DPO | BAJO | 5 |
| `UC-67-20` | Columnas observadas con su ficha | GET /admin/catalog/objects/{id}/columns | SECURITY_ADMIN · PLATFORM_ADMIN · GOVERNANCE_ADMIN · DATA_PLATFORM_ADMIN · DPO | BAJO | 4 |
| `UC-67-21` | Evidencia enlazada | GET /admin/catalog/objects/{id}/evidence | SECURITY_ADMIN · PLATFORM_ADMIN · GOVERNANCE_ADMIN · DATA_PLATFORM_ADMIN · DPO | BAJO | 3 |
| `UC-67-22` | Enlazar evidencia | POST /admin/catalog/objects/{id}/evidence | GOVERNANCE_ADMIN · DATA_PLATFORM_ADMIN | MEDIO | 3 |
| `UC-67-23` | Revisiones y decisiones de la ficha | GET /admin/catalog/objects/{id}/history | SECURITY_ADMIN · PLATFORM_ADMIN · GOVERNANCE_ADMIN · DATA_PLATFORM_ADMIN · DPO | BAJO | 5 |
| `UC-67-24` | Cambios que los escaneos detectaron | GET /admin/catalog/objects/{id}/changes | SECURITY_ADMIN · PLATFORM_ADMIN · GOVERNANCE_ADMIN · DATA_PLATFORM_ADMIN · DPO | BAJO | 4 |
| `UC-67-25` | Análisis de impacto por claves foráneas observadas | GET /admin/catalog/objects/{id}/impact | SECURITY_ADMIN · PLATFORM_ADMIN · GOVERNANCE_ADMIN · DATA_PLATFORM_ADMIN · DPO | BAJO | 4 |
| `UC-67-26` | Crear o editar la ficha (con versión esperada) | PUT /admin/catalog/objects/{id}/annotation | GOVERNANCE_ADMIN · DATA_PLATFORM_ADMIN | MEDIO | 6 |
| `UC-67-27` | Aprobar o rechazar la revisión vigente | POST /admin/catalog/annotations/{id}/review | GOVERNANCE_ADMIN · DATA_PLATFORM_ADMIN | MEDIO | 5 |
| `UC-67-28` | Cobertura del catálogo por dimensión | GET /admin/catalog/coverage | SECURITY_ADMIN · PLATFORM_ADMIN · GOVERNANCE_ADMIN · DATA_PLATFORM_ADMIN · DPO | BAJO | 3 |
| `UC-67-29` | Listar escaneos | GET /admin/catalog/scans | SECURITY_ADMIN · PLATFORM_ADMIN · GOVERNANCE_ADMIN · DATA_PLATFORM_ADMIN · DPO | BAJO | 1 |
| `UC-67-30` | Un escaneo | GET /admin/catalog/scans/{id} | SECURITY_ADMIN · PLATFORM_ADMIN · GOVERNANCE_ADMIN · DATA_PLATFORM_ADMIN · DPO | BAJO | 1 |
| `UC-67-31` | Pedir un escaneo de la base primaria (202, idempotente) | POST /admin/catalog/scans | GOVERNANCE_ADMIN · DATA_PLATFORM_ADMIN | MEDIO | 10 |

### Diagrama 1 de 2 — etapas `UC-67-01`, `UC-67-02`, `UC-67-03`…

```mermaid
flowchart LR
  a2(["SECURITY_ADMIN · PLATFORM_ADMIN · GOVERNANCE_ADMIN · DATA_P…"]):::actor
  t19[("data_catalog.catalog_annotations")]:::tabla
  t20[("data_catalog.catalog_objects")]:::tabla
  t22[("data_catalog.catalog_scan_runs")]:::tabla
  subgraph s0["UC-67-01 · Versión y huella del inventario servido"]
    o1["GET /admin/portal/version"]:::op
  end
  subgraph s1["UC-67-02 · Listar operaciones del sistema, con filtros"]
    o3["GET /admin/portal/operaciones"]:::op
  end
  subgraph s2["UC-67-03 · Ficha de una operación: tablas, DTO, requisitos, flujo"]
    o4["GET /admin/portal/operaciones/{id}"]:::op
  end
  subgraph s3["UC-67-04 · Árbol de decisión de una operación"]
    o5["GET /admin/portal/operaciones/{id}/arbol"]:::op
  end
  subgraph s4["UC-67-05 · Listar procesos"]
    o6["GET /admin/portal/flujos"]:::op
  end
  subgraph s5["UC-67-06 · Mapa de procesos y hallazgos del recorrido"]
    o7["GET /admin/portal/flujos/mapa"]:::op
  end
  subgraph s6["UC-67-07 · Listar hallazgos del inventario de flujos"]
    o8["GET /admin/portal/flujos/hallazgos"]:::op
  end
  subgraph s7["UC-67-08 · Un hallazgo"]
    o9["GET /admin/portal/flujos/hallazgos/{id}"]:::op
  end
  subgraph s8["UC-67-09 · Detalle de un proceso"]
    o10["GET /admin/portal/flujos/{codigo}"]:::op
  end
  subgraph s9["UC-67-10 · Grafo de un proceso"]
    o11["GET /admin/portal/flujos/{codigo}/grafo"]:::op
  end
  subgraph s10["UC-67-11 · Tablas del catálogo estático (modelo), paginadas"]
    o12["GET /admin/portal/catalogo/tablas"]:::op
  end
  subgraph s11["UC-67-12 · Ficha de una tabla: columnas, relaciones, índices"]
    o13["GET /admin/portal/catalogo/tablas/{schema}/{tabla}"]:::op
  end
  subgraph s12["UC-67-13 · Deriva entre modelo, ORM y base desplegada"]
    o14["GET /admin/portal/catalogo/deriva"]:::op
  end
  subgraph s13["UC-67-14 · Grafo de linaje endpoint → tabla"]
    o15["GET /admin/portal/linaje"]:::op
  end
  subgraph s14["UC-67-15 · Linaje de una tabla"]
    o16["GET /admin/portal/linaje/tablas/{schema}/{tabla}"]:::op
  end
  subgraph s15["UC-67-16 · Glosario de dominio"]
    o17["GET /admin/portal/glosario"]:::op
  end
  subgraph s16["UC-67-17 · Schemas observados, con fichas y aprobaciones"]
    o18["GET /admin/catalog/schemas"]:::op
  end
  subgraph s17["UC-67-18 · Objetos observados, con filtros y cursor"]
    o21["GET /admin/catalog/objects"]:::op
  end
  a2 --> o1
  a2 --> o3
  a2 --> o4
  a2 --> o5
  a2 --> o6
  a2 --> o7
  a2 --> o8
  a2 --> o9
  a2 --> o10
  a2 --> o11
  a2 --> o12
  a2 --> o13
  a2 --> o14
  a2 --> o15
  a2 --> o16
  a2 --> o17
  a2 --> o18
  o18 -->|"LEE"| t19
  o18 -->|"LEE"| t20
  a2 --> o21
  o21 -->|"LEE"| t19
  o21 -->|"LEE"| t20
  o21 -->|"LEE"| t22
  classDef op fill:#fff,stroke:#446
  classDef actor fill:#eef,stroke:#66a
  classDef tabla fill:#ffd,stroke:#aa3
  classDef evento fill:#efe,stroke:#3a3
```

### Diagrama 2 de 2 — etapas `UC-67-19`, `UC-67-20`, `UC-67-21`…

```mermaid
flowchart LR
  a2(["SECURITY_ADMIN · PLATFORM_ADMIN · GOVERNANCE_ADMIN · DATA_P…"]):::actor
  a12(["GOVERNANCE_ADMIN · DATA_PLATFORM_ADMIN"]):::actor
  t3[("data_catalog.catalog_annotations")]:::tabla
  t4[("data_catalog.catalog_evidence_items")]:::tabla
  t5[("data_catalog.catalog_objects")]:::tabla
  t6[("data_catalog.catalog_scan_runs")]:::tabla
  t7[("system_ops.entity_registry")]:::tabla
  t9[("data_catalog.catalog_columns")]:::tabla
  t14[("data_catalog.catalog_annotation_revisions")]:::tabla
  t15[("data_catalog.catalog_review_decisions")]:::tabla
  t17[("data_catalog.catalog_change_events")]:::tabla
  subgraph s0["UC-67-19 · Ficha técnica, observación, ficha curada, cobertura"]
    o1["GET /admin/catalog/objects/{id}"]:::op
  end
  subgraph s1["UC-67-20 · Columnas observadas con su ficha"]
    o8["GET /admin/catalog/objects/{id}/columns"]:::op
  end
  subgraph s2["UC-67-21 · Evidencia enlazada"]
    o10["GET /admin/catalog/objects/{id}/evidence"]:::op
  end
  subgraph s3["UC-67-22 · Enlazar evidencia"]
    o11["POST /admin/catalog/objects/{id}/evidence"]:::op
  end
  subgraph s4["UC-67-23 · Revisiones y decisiones de la ficha"]
    o13["GET /admin/catalog/objects/{id}/history"]:::op
  end
  subgraph s5["UC-67-24 · Cambios que los escaneos detectaron"]
    o16["GET /admin/catalog/objects/{id}/changes"]:::op
  end
  subgraph s6["UC-67-25 · Análisis de impacto por claves foráneas observadas"]
    o18["GET /admin/catalog/objects/{id}/impact"]:::op
  end
  subgraph s7["UC-67-26 · Crear o editar la ficha (con versión esperada)"]
    o19["PUT /admin/catalog/objects/{id}/annotation"]:::op
  end
  subgraph s8["UC-67-27 · Aprobar o rechazar la revisión vigente"]
    o20["POST /admin/catalog/annotations/{id}/review"]:::op
  end
  subgraph s9["UC-67-28 · Cobertura del catálogo por dimensión"]
    o21["GET /admin/catalog/coverage"]:::op
  end
  subgraph s10["UC-67-29 · Listar escaneos"]
    o22["GET /admin/catalog/scans"]:::op
  end
  subgraph s11["UC-67-30 · Un escaneo"]
    o23["GET /admin/catalog/scans/{id}"]:::op
  end
  t25[("+4 tablas más")]
  subgraph s12["UC-67-31 · Pedir un escaneo de la base primaria (202, idempotente)"]
    o24["POST /admin/catalog/scans"]:::op
  end
  a2 --> o1
  o1 -->|"LEE"| t3
  o1 -->|"LEE"| t4
  o1 -->|"LEE"| t5
  o1 -->|"LEE"| t6
  o1 -->|"LEE"| t7
  a2 --> o8
  o8 -->|"LEE"| t3
  o8 -->|"LEE"| t9
  o8 -->|"LEE"| t5
  o8 -->|"LEE"| t6
  a2 --> o10
  o10 -->|"LEE"| t4
  o10 -->|"LEE"| t5
  o10 -->|"LEE"| t6
  a12 --> o11
  o11 -->|"CREA"| t4
  o11 -->|"LEE"| t5
  o11 -->|"LEE"| t6
  a2 --> o13
  o13 -->|"LEE"| t14
  o13 -->|"LEE"| t3
  o13 -->|"LEE"| t5
  o13 -->|"LEE"| t15
  o13 -->|"LEE"| t6
  a2 --> o16
  o16 -->|"LEE"| t17
  o16 -->|"LEE"| t9
  o16 -->|"LEE"| t5
  o16 -->|"LEE"| t6
  a2 --> o18
  o18 -->|"LEE"| t3
  o18 -->|"LEE"| t9
  o18 -->|"LEE"| t5
  o18 -->|"LEE"| t6
  a12 --> o19
  o19 -->|"CREA"| t14
  o19 -->|"CREA"| t3
  o19 -->|"ACTUALIZA"| t3
  o19 -->|"LEE"| t3
  o19 -->|"LEE"| t5
  o19 -->|"LEE"| t6
  a12 --> o20
  o20 -->|"LEE"| t14
  o20 -->|"ACTUALIZA"| t3
  o20 -->|"LEE"| t3
  o20 -->|"LEE"| t4
  o20 -->|"CREA"| t15
  a2 --> o21
  o21 -->|"LEE"| t3
  o21 -->|"LEE"| t5
  o21 -->|"LEE"| t6
  a2 --> o22
  o22 -->|"LEE"| t6
  a2 --> o23
  o23 -->|"LEE"| t6
  a12 --> o24
  o24 -->|"CREA"| t17
  o24 -->|"CREA"| t9
  o24 -->|"ACTUALIZA"| t9
  o24 -->|"LEE"| t9
  o24 -->|"CREA"| t5
  o24 -->|"ACTUALIZA"| t5
  o24 -.-> t25
  classDef op fill:#fff,stroke:#446
  classDef actor fill:#eef,stroke:#66a
  classDef tabla fill:#ffd,stroke:#aa3
  classDef evento fill:#efe,stroke:#3a3
```

## Árbol de decisión por operación

Cada árbol se deriva del código del handler y de los métodos que invoca (hasta 4 niveles). Una rama que no decide, no escribe y no falla se poda. Los accesos y los efectos consecutivos se agrupan en un solo nodo.

### Operaciones con decisiones propias

#### 1. POST /admin/catalog/annotations/{id}/review



| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Ficha no encontrada |
| 409 | `CONCURRENCY_CONFLICT` | ConcurrencyConflictException: {message}; ConcurrencyConflictException: La ficha cambió mientras se revisaba |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: {message} |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {403}; DomainException: {422} |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a CatalogGovernanceService.review"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a CatalogRepository.annotationById"]:::llamada
  n4 --> n5
  n6[("LEE data_catalog.catalog_annotations")]:::efecto
  n5 --> n6
  n7{"!ficha"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Ficha no encontrada"]):::error
  n7 -->|"sí"| n8
  n9["Llama a CatalogRepository.revisionAuthor"]:::llamada
  n7 -->|"no"| n9
  n10[("LEE data_catalog.catalog_annotation_revisions")]:::efecto
  n9 --> n10
  n11["Llama a CatalogRepository.evidenceCount"]:::llamada
  n10 --> n11
  n12[("LEE data_catalog.catalog_evidence_items")]:::efecto
  n11 --> n12
  n13{"!veredicto.ok"}:::decision
  n12 --> n13
  n14{"según kind"}:::decision
  n13 -->|"sí"| n14
  n15(["409 CONCURRENCY_CONFLICT {message}"]):::error
  n14 -->|"'STALE_REVISION'"| n15
  n16(["500 INTERNAL {403}"]):::error
  n14 -->|"'SELF_REVIEW'"| n16
  n17(["500 INTERNAL {422}"]):::error
  n14 -->|"'REJECTION_NEEDS_REASON'"| n17
  n18(["422 PRECONDITION_FAILED {message}"]):::error
  n14 -->|"por defecto"| n18
  n19["Llama a CatalogRepository.decide"]:::llamada
  n13 -->|"no"| n19
  n20[("ACTUALIZA data_catalog.catalog_annotations · CREA data_catalog.catalog_review_decisions")]:::efecto
  n19 --> n20
  n21{"!decidida"}:::decision
  n20 --> n21
  n22(["409 CONCURRENCY_CONFLICT La ficha cambió mientras se revisaba"]):::error
  n21 -->|"sí"| n22
  n23["Llama a CatalogRepository.annotationById"]:::llamada
  n21 -->|"no"| n23
  n24[("LEE data_catalog.catalog_annotations")]:::efecto
  n23 --> n24
  n25(("200 Responde con éxito")):::ok
  n24 --> n25
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 2. GET /admin/catalog/objects



| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | BadRequestException: El cursor de paginación no es válido |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a CatalogReadService.objects"]:::llamada
  n2 --> n3
  n4{"cursor && (typeof cursor.s !== 'string' || typeof cursor.o !== 'string')"}:::decision
  n3 --> n4
  n5(["400 VALIDATION_FAILED El cursor de paginación no es válido"]):::error
  n4 -->|"sí"| n5
  n6["Llama a CatalogRepository.objects"]:::llamada
  n4 -->|"no"| n6
  n7[("LEE data_catalog.catalog_objects · LEE data_catalog.catalog_scan_runs · LEE data_catalog.catalog_annotations")]:::efecto
  n6 --> n7
  n8["Llama a CatalogRepository.annotationsOf"]:::llamada
  n7 --> n8
  n9[("LEE data_catalog.catalog_annotations")]:::efecto
  n8 --> n9
  n10(("200 Responde con éxito")):::ok
  n9 --> n10
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 3. GET /admin/catalog/objects/{id}



| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Objeto del catálogo no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a CatalogReadService.objectDetail"]:::llamada
  n2 --> n3
  n4["Llama a CatalogReadService.objeto"]:::llamada
  n3 --> n4
  n5["Llama a CatalogRepository.objectById"]:::llamada
  n4 --> n5
  n6[("LEE data_catalog.catalog_objects · LEE data_catalog.catalog_scan_runs")]:::efecto
  n5 --> n6
  n7{"!o"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Objeto del catálogo no encontrado"]):::error
  n7 -->|"sí"| n8
  n9["Llama a CatalogRepository.annotationOfObject"]:::llamada
  n7 -->|"no"| n9
  n10["Llama a CatalogRepository.annotationsOf"]:::llamada
  n9 --> n10
  n11[("LEE data_catalog.catalog_annotations")]:::efecto
  n10 --> n11
  n12["Llama a CatalogRepository.governance"]:::llamada
  n11 --> n12
  n13[("LEE system_ops.entity_registry")]:::efecto
  n12 --> n13
  n14["Llama a CatalogRepository.evidenceCount"]:::llamada
  n13 --> n14
  n15[("LEE data_catalog.catalog_evidence_items")]:::efecto
  n14 --> n15
  n16(("200 Responde con éxito")):::ok
  n15 --> n16
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 4. PUT /admin/catalog/objects/{id}/annotation



| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Objeto del catálogo no encontrado |
| 409 | `CONCURRENCY_CONFLICT` | ConcurrencyConflictException: La ficha cambió desde que se leyó |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {422} |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a CatalogGovernanceService.saveAnnotation"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a CatalogRepository.objectById"]:::llamada
  n4 --> n5
  n6[("LEE data_catalog.catalog_objects · LEE data_catalog.catalog_scan_runs")]:::efecto
  n5 --> n6
  n7{"!(await this.repo.objectById(tx, objectId))"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Objeto del catálogo no encontrado"]):::error
  n7 -->|"sí"| n8
  n9["Llama a CatalogRepository.annotationOfObject"]:::llamada
  n7 -->|"no"| n9
  n10["Llama a CatalogRepository.annotationsOf"]:::llamada
  n9 --> n10
  n11[("LEE data_catalog.catalog_annotations")]:::efecto
  n10 --> n11
  n12{"dto.expectedVersion !== version"}:::decision
  n11 --> n12
  n13(["409 CONCURRENCY_CONFLICT La ficha cambió desde que se leyó"]):::error
  n12 -->|"sí"| n13
  n14{"dto.submit"}:::decision
  n12 -->|"no"| n14
  n15{"violations.length"}:::decision
  n14 -->|"sí"| n15
  n16(["500 INTERNAL {422}"]):::error
  n15 -->|"sí"| n16
  n17{"!ficha"}:::decision
  n15 -->|"no"| n17
  n14 -->|"no"| n17
  n18["Intenta"]:::intento
  n17 -->|"sí"| n18
  n19["Llama a CatalogRepository.insertAnnotation"]:::llamada
  n18 --> n19
  n20[("CREA data_catalog.catalog_annotations")]:::efecto
  n19 --> n20
  n21["Llama a CatalogRepository.annotationById"]:::llamada
  n20 --> n21
  n22[("LEE data_catalog.catalog_annotations")]:::efecto
  n21 --> n22
  n23{"esUnicidad(error)"}:::decision
  n18 -->|"si falla"| n23
  n24(["409 CONCURRENCY_CONFLICT La ficha cambió desde que se leyó"]):::error
  n23 -->|"sí"| n24
  n25(["↩ (relanza el error capturado)"]):::error
  n23 -->|"no"| n25
  n26["Llama a CatalogRepository.updateAnnotation"]:::llamada
  n17 -->|"no"| n26
  n27[("ACTUALIZA data_catalog.catalog_annotations")]:::efecto
  n26 --> n27
  n28{"!ok"}:::decision
  n27 --> n28
  n29(["409 CONCURRENCY_CONFLICT La ficha cambió desde que se leyó"]):::error
  n28 -->|"sí"| n29
  n30["Llama a CatalogRepository.insertRevision"]:::llamada
  n22 --> n30
  n28 -->|"no"| n30
  n31[("CREA data_catalog.catalog_annotation_revisions")]:::efecto
  n30 --> n31
  n32["Llama a CatalogRepository.annotationById"]:::llamada
  n31 --> n32
  n33[("LEE data_catalog.catalog_annotations")]:::efecto
  n32 --> n33
  n34(("200 Responde con éxito")):::ok
  n33 --> n34
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 5. GET /admin/catalog/objects/{id}/changes



| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Objeto del catálogo no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a CatalogReadService.changes"]:::llamada
  n2 --> n3
  n4["Llama a CatalogReadService.objeto"]:::llamada
  n3 --> n4
  n5["Llama a CatalogRepository.objectById"]:::llamada
  n4 --> n5
  n6[("LEE data_catalog.catalog_objects · LEE data_catalog.catalog_scan_runs")]:::efecto
  n5 --> n6
  n7{"!o"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Objeto del catálogo no encontrado"]):::error
  n7 -->|"sí"| n8
  n9["Llama a CatalogRepository.changes"]:::llamada
  n7 -->|"no"| n9
  n10[("LEE data_catalog.catalog_change_events · LEE data_catalog.catalog_objects · LEE data_catalog.catalog_columns")]:::efecto
  n9 --> n10
  n11(("200 Responde con éxito")):::ok
  n10 --> n11
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 6. GET /admin/catalog/objects/{id}/columns



| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Objeto del catálogo no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a CatalogReadService.columns"]:::llamada
  n2 --> n3
  n4["Llama a CatalogReadService.objeto"]:::llamada
  n3 --> n4
  n5["Llama a CatalogRepository.objectById"]:::llamada
  n4 --> n5
  n6[("LEE data_catalog.catalog_objects · LEE data_catalog.catalog_scan_runs")]:::efecto
  n5 --> n6
  n7{"!o"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Objeto del catálogo no encontrado"]):::error
  n7 -->|"sí"| n8
  n9["Llama a CatalogRepository.columns"]:::llamada
  n7 -->|"no"| n9
  n10[("LEE data_catalog.catalog_columns")]:::efecto
  n9 --> n10
  n11["Llama a CatalogRepository.columnAnnotations"]:::llamada
  n10 --> n11
  n12[("LEE data_catalog.catalog_annotations")]:::efecto
  n11 --> n12
  n13(("200 Responde con éxito")):::ok
  n12 --> n13
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 7. GET /admin/catalog/objects/{id}/evidence



| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Objeto del catálogo no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a CatalogReadService.evidence"]:::llamada
  n2 --> n3
  n4["Llama a CatalogReadService.objeto"]:::llamada
  n3 --> n4
  n5["Llama a CatalogRepository.objectById"]:::llamada
  n4 --> n5
  n6[("LEE data_catalog.catalog_objects · LEE data_catalog.catalog_scan_runs")]:::efecto
  n5 --> n6
  n7{"!o"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Objeto del catálogo no encontrado"]):::error
  n7 -->|"sí"| n8
  n9["Llama a CatalogRepository.evidence"]:::llamada
  n7 -->|"no"| n9
  n10[("LEE data_catalog.catalog_evidence_items")]:::efecto
  n9 --> n10
  n11(("200 Responde con éxito")):::ok
  n10 --> n11
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 8. POST /admin/catalog/objects/{id}/evidence



| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Objeto del catálogo no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a CatalogGovernanceService.addEvidence"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a CatalogRepository.objectById"]:::llamada
  n4 --> n5
  n6[("LEE data_catalog.catalog_objects · LEE data_catalog.catalog_scan_runs")]:::efecto
  n5 --> n6
  n7{"!(await this.repo.objectById(tx, objectId))"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Objeto del catálogo no encontrado"]):::error
  n7 -->|"sí"| n8
  n9["Llama a CatalogRepository.addEvidence"]:::llamada
  n7 -->|"no"| n9
  n10[("CREA data_catalog.catalog_evidence_items")]:::efecto
  n9 --> n10
  n11(("201 Responde con éxito")):::ok
  n10 --> n11
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 9. GET /admin/catalog/objects/{id}/history



| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Objeto del catálogo no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a CatalogReadService.history"]:::llamada
  n2 --> n3
  n4["Llama a CatalogReadService.objeto"]:::llamada
  n3 --> n4
  n5["Llama a CatalogRepository.objectById"]:::llamada
  n4 --> n5
  n6[("LEE data_catalog.catalog_objects · LEE data_catalog.catalog_scan_runs")]:::efecto
  n5 --> n6
  n7{"!o"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Objeto del catálogo no encontrado"]):::error
  n7 -->|"sí"| n8
  n9["Llama a CatalogRepository.annotationOfObject"]:::llamada
  n7 -->|"no"| n9
  n10["Llama a CatalogRepository.annotationsOf"]:::llamada
  n9 --> n10
  n11[("LEE data_catalog.catalog_annotations")]:::efecto
  n10 --> n11
  n12["Llama a CatalogRepository.revisions"]:::llamada
  n11 --> n12
  n13[("LEE data_catalog.catalog_annotation_revisions")]:::efecto
  n12 --> n13
  n14["Llama a CatalogRepository.decisions"]:::llamada
  n13 --> n14
  n15[("LEE data_catalog.catalog_review_decisions")]:::efecto
  n14 --> n15
  n16(("200 Responde con éxito")):::ok
  n15 --> n16
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 10. GET /admin/catalog/objects/{id}/impact



| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Objeto del catálogo no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a CatalogReadService.impact"]:::llamada
  n2 --> n3
  n4["Llama a CatalogReadService.objeto"]:::llamada
  n3 --> n4
  n5["Llama a CatalogRepository.objectById"]:::llamada
  n4 --> n5
  n6[("LEE data_catalog.catalog_objects · LEE data_catalog.catalog_scan_runs")]:::efecto
  n5 --> n6
  n7{"!o"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Objeto del catálogo no encontrado"]):::error
  n7 -->|"sí"| n8
  n9["Llama a CatalogRepository.foreignKeyGraph"]:::llamada
  n7 -->|"no"| n9
  n10[("LEE data_catalog.catalog_columns · LEE data_catalog.catalog_objects")]:::efecto
  n9 --> n10
  n11["Llama a CatalogRepository.objectsByIds"]:::llamada
  n10 --> n11
  n12[("LEE data_catalog.catalog_objects · LEE data_catalog.catalog_scan_runs")]:::efecto
  n11 --> n12
  n13["Llama a CatalogRepository.annotationsOf"]:::llamada
  n12 --> n13
  n14[("LEE data_catalog.catalog_annotations")]:::efecto
  n13 --> n14
  n15(("200 Responde con éxito")):::ok
  n14 --> n15
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 11. POST /admin/catalog/scans



| HTTP | Código | Cuándo |
|---|---|---|
| 202 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya hay un escaneo en curso de esta fuente |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3{"!key || !IDEMPOTENCY_KEY.test(key)"}:::decision
  n2 --> n3
  n4(["↩ (relanza el error capturado)"]):::error
  n3 -->|"sí"| n4
  n5["Llama a CatalogScanService.request"]:::llamada
  n3 -->|"no"| n5
  n6["Transacción: transactional(…)"]:::transaccion
  n5 --> n6
  n7["Llama a CatalogRepository.failAbandoned"]:::llamada
  n6 --> n7
  n8[("ACTUALIZA data_catalog.catalog_scan_runs")]:::efecto
  n7 --> n8
  n9{"idempotencyKey"}:::decision
  n8 --> n9
  n10["Llama a CatalogRepository.scanByIdempotency"]:::llamada
  n9 -->|"sí"| n10
  n11[("LEE data_catalog.catalog_scan_runs")]:::efecto
  n10 --> n11
  n12["Llama a CatalogRepository.activeScan"]:::llamada
  n11 --> n12
  n9 -->|"no"| n12
  n13[("LEE data_catalog.catalog_scan_runs")]:::efecto
  n12 --> n13
  n14{"activo"}:::decision
  n13 --> n14
  n15(["409 CONFLICT Ya hay un escaneo en curso de esta fuente"]):::error
  n14 -->|"sí"| n15
  n16["Intenta"]:::intento
  n14 -->|"no"| n16
  n17["Llama a CatalogRepository.insertScan"]:::llamada
  n16 --> n17
  n18[("CREA data_catalog.catalog_scan_runs")]:::efecto
  n17 --> n18
  n19["Llama a CatalogRepository.scanById"]:::llamada
  n18 --> n19
  n20[("LEE data_catalog.catalog_scan_runs")]:::efecto
  n19 --> n20
  n21{"error instanceof Error && /ux_data_catalog_scan_runs_(one_active|idempotency)/.test( error.message, )"}:::decision
  n16 -->|"si falla"| n21
  n22(["409 CONFLICT Ya hay un escaneo en curso de esta fuente"]):::error
  n21 -->|"sí"| n22
  n23(["↩ (relanza el error capturado)"]):::error
  n21 -->|"no"| n23
  n24["Llama a CatalogScanService.start"]:::llamada
  n20 --> n24
  n25["Llama a CatalogScanService.run"]:::llamada
  n24 --> n25
  n26["Llama a CatalogRepository.claimScan"]:::llamada
  n25 --> n26
  n27[("ACTUALIZA data_catalog.catalog_scan_runs")]:::efecto
  n26 --> n27
  n28["Llama a CatalogRepository.scanById"]:::llamada
  n27 --> n28
  n29[("LEE data_catalog.catalog_scan_runs")]:::efecto
  n28 --> n29
  n30{"!tomado"}:::decision
  n29 --> n30
  n31["Llama a CatalogRepository.scanById"]:::llamada
  n30 -->|"sí"| n31
  n32[("LEE data_catalog.catalog_scan_runs")]:::efecto
  n31 --> n32
  n33["Intenta"]:::intento
  n32 --> n33
  n30 -->|"no"| n33
  n34["Transacción: transactional(…)"]:::transaccion
  n33 --> n34
  n35["Llama a CatalogRepository.knownObjects"]:::llamada
  n34 --> n35
  n36[("LEE data_catalog.catalog_objects · LEE data_catalog.catalog_columns · LEE data_catalog.catalog_objects")]:::efecto
  n35 --> n36
  n37["Llama a CatalogRepository.applyScan"]:::llamada
  n36 --> n37
  n38{"objetosNuevos.length"}:::decision
  n37 --> n38
  n39[("CREA data_catalog.catalog_objects")]:::efecto
  n38 -->|"sí"| n39
  n40{"objetosExistentes.length"}:::decision
  n39 --> n40
  n38 -->|"no"| n40
  n41[("ACTUALIZA data_catalog.catalog_objects")]:::efecto
  n40 -->|"sí"| n41
  n42{"columnasNuevas.length"}:::decision
  n41 --> n42
  n40 -->|"no"| n42
  n43[("CREA data_catalog.catalog_columns")]:::efecto
  n42 -->|"sí"| n43
  n44{"columnasExistentes.length"}:::decision
  n43 --> n44
  n42 -->|"no"| n44
  n45[("ACTUALIZA data_catalog.catalog_columns")]:::efecto
  n44 -->|"sí"| n45
  n46{"columnasFaltantes.length"}:::decision
  n45 --> n46
  n44 -->|"no"| n46
  n47[("ACTUALIZA data_catalog.catalog_columns")]:::efecto
  n46 -->|"sí"| n47
  n48{"plan.vanished.length"}:::decision
  n47 --> n48
  n46 -->|"no"| n48
  n49[("ACTUALIZA data_catalog.catalog_objects · ACTUALIZA data_catalog.catalog_columns")]:::efecto
  n48 -->|"sí"| n49
  n50{"eventos.length"}:::decision
  n49 --> n50
  n48 -->|"no"| n50
  n51[("CREA data_catalog.catalog_change_events")]:::efecto
  n50 -->|"sí"| n51
  n52["Llama a CatalogRepository.finishScan"]:::llamada
  n51 --> n52
  n50 -->|"no"| n52
  n53[("ACTUALIZA data_catalog.catalog_scan_runs")]:::efecto
  n52 --> n53
  n54["Llama a CatalogRepository.failScan"]:::llamada
  n33 -->|"si falla"| n54
  n55[("ACTUALIZA data_catalog.catalog_scan_runs")]:::efecto
  n54 --> n55
  n56["Llama a CatalogRepository.scanById"]:::llamada
  n53 --> n56
  n55 --> n56
  n57[("LEE data_catalog.catalog_scan_runs")]:::efecto
  n56 --> n57
  n58{"resultado.created && autorun"}:::decision
  n57 --> n58
  n59["Llama a CatalogScanService.start"]:::llamada
  n58 -->|"sí"| n59
  n60["Llama a CatalogScanService.run"]:::llamada
  n59 --> n60
  n61["Llama a CatalogRepository.claimScan"]:::llamada
  n60 --> n61
  n62[("ACTUALIZA data_catalog.catalog_scan_runs")]:::efecto
  n61 --> n62
  n63["Llama a CatalogRepository.scanById"]:::llamada
  n62 --> n63
  n64[("LEE data_catalog.catalog_scan_runs")]:::efecto
  n63 --> n64
  n65{"!tomado"}:::decision
  n64 --> n65
  n66["Llama a CatalogRepository.scanById"]:::llamada
  n65 -->|"sí"| n66
  n67[("LEE data_catalog.catalog_scan_runs")]:::efecto
  n66 --> n67
  n68["Intenta"]:::intento
  n67 --> n68
  n65 -->|"no"| n68
  n69["Transacción: transactional(…)"]:::transaccion
  n68 --> n69
  n70["Llama a CatalogRepository.knownObjects"]:::llamada
  n69 --> n70
  n71["… el resto del árbol (3 nodos) está en el JSON del inventario"]:::corte
  n70 --> n71
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 12. GET /admin/catalog/scans/{id}



| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Escaneo no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a CatalogReadService.scan"]:::llamada
  n2 --> n3
  n4["Llama a CatalogRepository.scanById"]:::llamada
  n3 --> n4
  n5[("LEE data_catalog.catalog_scan_runs")]:::efecto
  n4 --> n5
  n6{"!s"}:::decision
  n5 --> n6
  n7(["404 NOT_FOUND Escaneo no encontrado"]):::error
  n6 -->|"sí"| n7
  n8(("200 Responde con éxito")):::ok
  n6 -->|"no"| n8
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 13. GET /admin/portal/catalogo/deriva

Deriva entre el modelo, el ORM y la base.

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 503 | `DEPENDENCY_UNAVAILABLE` | ServiceUnavailableException: El inventario del portal no está disponible: falta {relative}. Se genera con `yarn inventario:endpoints`, `yarn inventario:flujos` y `yarn inventario:catalogo`…; ServiceUnavailableException: El inventario del portal está dañado: {relative} no es un JSON válido. Regenerarlo con `yarn inventario:verificar`. |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a PortalInventoryService.derivaDelCatalogo"]:::llamada
  n2 --> n3
  n4["Llama a InventoryRepository.catalogoIndice"]:::llamada
  n3 --> n4
  n5["Llama a InventoryRepository.read"]:::llamada
  n4 --> n5
  n6["Intenta"]:::intento
  n5 --> n6
  n7["Llama a InventoryRepository.raw"]:::llamada
  n6 --> n7
  n8{"!existsSync(file)"}:::decision
  n7 --> n8
  n9(["503 DEPENDENCY_UNAVAILABLE El inventario del portal no está disponible: falta {relative}. Se genera con `yarn…"]):::error
  n8 -->|"sí"| n9
  n10{"error instanceof ServiceUnavailableException"}:::decision
  n6 -->|"si falla"| n10
  n11(["↩ (relanza el error capturado)"]):::error
  n10 -->|"sí"| n11
  n12(["503 DEPENDENCY_UNAVAILABLE El inventario del portal está dañado: {relative} no es un JSON válido. Regenerarlo…"]):::error
  n10 -->|"no"| n12
  n13(("200 Responde con éxito")):::ok
  n8 -->|"no"| n13
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 14. GET /admin/portal/catalogo/tablas

Tablas del catálogo de datos del modelo.

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 503 | `DEPENDENCY_UNAVAILABLE` | ServiceUnavailableException: El inventario del portal no está disponible: falta {relative}. Se genera con `yarn inventario:endpoints`, `yarn inventario:flujos` y `yarn inventario:catalogo`…; ServiceUnavailableException: El inventario del portal está dañado: {relative} no es un JSON válido. Regenerarlo con `yarn inventario:verificar`. |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a PortalInventoryService.listarTablas"]:::llamada
  n2 --> n3
  n4["Llama a InventoryRepository.catalogoIndice"]:::llamada
  n3 --> n4
  n5["Llama a InventoryRepository.read"]:::llamada
  n4 --> n5
  n6["Intenta"]:::intento
  n5 --> n6
  n7["Llama a InventoryRepository.raw"]:::llamada
  n6 --> n7
  n8{"!existsSync(file)"}:::decision
  n7 --> n8
  n9(["503 DEPENDENCY_UNAVAILABLE El inventario del portal no está disponible: falta {relative}. Se genera con `yarn…"]):::error
  n8 -->|"sí"| n9
  n10{"error instanceof ServiceUnavailableException"}:::decision
  n6 -->|"si falla"| n10
  n11(["↩ (relanza el error capturado)"]):::error
  n10 -->|"sí"| n11
  n12(["503 DEPENDENCY_UNAVAILABLE El inventario del portal está dañado: {relative} no es un JSON válido. Regenerarlo…"]):::error
  n10 -->|"no"| n12
  n13(("200 Responde con éxito")):::ok
  n8 -->|"no"| n13
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 15. GET /admin/portal/catalogo/tablas/{schema}/{tabla}

Ficha de una tabla.

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | NotFoundException: Tabla no encontrada en el catálogo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 503 | `DEPENDENCY_UNAVAILABLE` | ServiceUnavailableException: El inventario del portal no está disponible: falta {relative}. Se genera con `yarn inventario:endpoints`, `yarn inventario:flujos` y `yarn inventario:catalogo`…; ServiceUnavailableException: El inventario del portal está dañado: {relative} no es un JSON válido. Regenerarlo con `yarn inventario:verificar`. |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a PortalInventoryService.fichaDeTabla"]:::llamada
  n2 --> n3
  n4["Llama a InventoryRepository.catalogoIndice"]:::llamada
  n3 --> n4
  n5["Llama a InventoryRepository.read"]:::llamada
  n4 --> n5
  n6["Intenta"]:::intento
  n5 --> n6
  n7["Llama a InventoryRepository.raw"]:::llamada
  n6 --> n7
  n8{"!existsSync(file)"}:::decision
  n7 --> n8
  n9(["503 DEPENDENCY_UNAVAILABLE El inventario del portal no está disponible: falta {relative}. Se genera con `yarn…"]):::error
  n8 -->|"sí"| n9
  n10{"error instanceof ServiceUnavailableException"}:::decision
  n6 -->|"si falla"| n10
  n11(["↩ (relanza el error capturado)"]):::error
  n10 -->|"sí"| n11
  n12(["503 DEPENDENCY_UNAVAILABLE El inventario del portal está dañado: {relative} no es un JSON válido. Regenerarlo…"]):::error
  n10 -->|"no"| n12
  n13{"!enIndice"}:::decision
  n8 -->|"no"| n13
  n14(["404 NOT_FOUND Tabla no encontrada en el catálogo"]):::error
  n13 -->|"sí"| n14
  n15["Llama a InventoryRepository.tablasDeSchema"]:::llamada
  n13 -->|"no"| n15
  n16["Llama a InventoryRepository.read"]:::llamada
  n15 --> n16
  n17["Intenta"]:::intento
  n16 --> n17
  n18["Llama a InventoryRepository.raw"]:::llamada
  n17 --> n18
  n19{"!existsSync(file)"}:::decision
  n18 --> n19
  n20(["503 DEPENDENCY_UNAVAILABLE El inventario del portal no está disponible: falta {relative}. Se genera con `yarn…"]):::error
  n19 -->|"sí"| n20
  n21{"error instanceof ServiceUnavailableException"}:::decision
  n17 -->|"si falla"| n21
  n22(["↩ (relanza el error capturado)"]):::error
  n21 -->|"sí"| n22
  n23(["503 DEPENDENCY_UNAVAILABLE El inventario del portal está dañado: {relative} no es un JSON válido. Regenerarlo…"]):::error
  n21 -->|"no"| n23
  n24{"!t"}:::decision
  n19 -->|"no"| n24
  n25(["404 NOT_FOUND Tabla no encontrada en el catálogo"]):::error
  n24 -->|"sí"| n25
  n26(("200 Responde con éxito")):::ok
  n24 -->|"no"| n26
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 16. GET /admin/portal/flujos

Procesos de negocio (por módulo y críticos).

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 503 | `DEPENDENCY_UNAVAILABLE` | ServiceUnavailableException: El inventario del portal no está disponible: falta {relative}. Se genera con `yarn inventario:endpoints`, `yarn inventario:flujos` y `yarn inventario:catalogo`…; ServiceUnavailableException: El inventario del portal está dañado: {relative} no es un JSON válido. Regenerarlo con `yarn inventario:verificar`. |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a PortalInventoryService.listarProcesos"]:::llamada
  n2 --> n3
  n4["Llama a InventoryRepository.procesos"]:::llamada
  n3 --> n4
  n5["Llama a InventoryRepository.read"]:::llamada
  n4 --> n5
  n6["Intenta"]:::intento
  n5 --> n6
  n7["Llama a InventoryRepository.raw"]:::llamada
  n6 --> n7
  n8{"!existsSync(file)"}:::decision
  n7 --> n8
  n9(["503 DEPENDENCY_UNAVAILABLE El inventario del portal no está disponible: falta {relative}. Se genera con `yarn…"]):::error
  n8 -->|"sí"| n9
  n10{"error instanceof ServiceUnavailableException"}:::decision
  n6 -->|"si falla"| n10
  n11(["↩ (relanza el error capturado)"]):::error
  n10 -->|"sí"| n11
  n12(["503 DEPENDENCY_UNAVAILABLE El inventario del portal está dañado: {relative} no es un JSON válido. Regenerarlo…"]):::error
  n10 -->|"no"| n12
  n13(("200 Responde con éxito")):::ok
  n8 -->|"no"| n13
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 17. GET /admin/portal/flujos/{codigo}

Detalle de un proceso con sus etapas y máquinas de estado.

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | NotFoundException: Proceso no encontrado en el inventario |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 503 | `DEPENDENCY_UNAVAILABLE` | ServiceUnavailableException: El inventario del portal está dañado: {relative} no es un JSON válido. Regenerarlo con `yarn inventario:verificar`.; ServiceUnavailableException: El inventario del portal no está disponible: falta {relative}. Se genera con `yarn inventario:endpoints`, `yarn inventario:flujos` y `yarn inventario:catalogo`… |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a PortalInventoryService.detalleDeProceso"]:::llamada
  n2 --> n3
  n4["Llama a PortalInventoryService.proceso"]:::llamada
  n3 --> n4
  n5["Llama a InventoryRepository.procesos"]:::llamada
  n4 --> n5
  n6["Llama a InventoryRepository.read"]:::llamada
  n5 --> n6
  n7["Intenta"]:::intento
  n6 --> n7
  n8{"error instanceof ServiceUnavailableException"}:::decision
  n7 -->|"si falla"| n8
  n9(["↩ (relanza el error capturado)"]):::error
  n8 -->|"sí"| n9
  n10(["503 DEPENDENCY_UNAVAILABLE El inventario del portal está dañado: {relative} no es un JSON válido. Regenerarlo…"]):::error
  n8 -->|"no"| n10
  n11{"!encontrado"}:::decision
  n7 --> n11
  n12(["404 NOT_FOUND Proceso no encontrado en el inventario"]):::error
  n11 -->|"sí"| n12
  n13["Llama a InventoryRepository.maquinas"]:::llamada
  n11 -->|"no"| n13
  n14["Llama a InventoryRepository.read"]:::llamada
  n13 --> n14
  n15["Intenta"]:::intento
  n14 --> n15
  n16["Llama a InventoryRepository.raw"]:::llamada
  n15 --> n16
  n17{"!existsSync(file)"}:::decision
  n16 --> n17
  n18(["503 DEPENDENCY_UNAVAILABLE El inventario del portal no está disponible: falta {relative}. Se genera con `yarn…"]):::error
  n17 -->|"sí"| n18
  n19{"error instanceof ServiceUnavailableException"}:::decision
  n15 -->|"si falla"| n19
  n20(["↩ (relanza el error capturado)"]):::error
  n19 -->|"sí"| n20
  n21(["503 DEPENDENCY_UNAVAILABLE El inventario del portal está dañado: {relative} no es un JSON válido. Regenerarlo…"]):::error
  n19 -->|"no"| n21
  n22(("200 Responde con éxito")):::ok
  n17 -->|"no"| n22
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 18. GET /admin/portal/flujos/{codigo}/grafo

Grafo de un proceso.

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | NotFoundException: Proceso no encontrado en el inventario |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 503 | `DEPENDENCY_UNAVAILABLE` | ServiceUnavailableException: El inventario del portal está dañado: {relative} no es un JSON válido. Regenerarlo con `yarn inventario:verificar`.; ServiceUnavailableException: El inventario del portal no está disponible: falta {relative}. Se genera con `yarn inventario:endpoints`, `yarn inventario:flujos` y `yarn inventario:catalogo`… |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a PortalInventoryService.grafoDeProceso"]:::llamada
  n2 --> n3
  n4["Llama a PortalInventoryService.proceso"]:::llamada
  n3 --> n4
  n5["Llama a InventoryRepository.procesos"]:::llamada
  n4 --> n5
  n6["Llama a InventoryRepository.read"]:::llamada
  n5 --> n6
  n7["Intenta"]:::intento
  n6 --> n7
  n8{"error instanceof ServiceUnavailableException"}:::decision
  n7 -->|"si falla"| n8
  n9(["↩ (relanza el error capturado)"]):::error
  n8 -->|"sí"| n9
  n10(["503 DEPENDENCY_UNAVAILABLE El inventario del portal está dañado: {relative} no es un JSON válido. Regenerarlo…"]):::error
  n8 -->|"no"| n10
  n11{"!encontrado"}:::decision
  n7 --> n11
  n12(["404 NOT_FOUND Proceso no encontrado en el inventario"]):::error
  n11 -->|"sí"| n12
  n13["Llama a InventoryRepository.grafo"]:::llamada
  n11 -->|"no"| n13
  n14["Llama a InventoryRepository.read"]:::llamada
  n13 --> n14
  n15["Intenta"]:::intento
  n14 --> n15
  n16["Llama a InventoryRepository.raw"]:::llamada
  n15 --> n16
  n17{"!existsSync(file)"}:::decision
  n16 --> n17
  n18(["503 DEPENDENCY_UNAVAILABLE El inventario del portal no está disponible: falta {relative}. Se genera con `yarn…"]):::error
  n17 -->|"sí"| n18
  n19{"error instanceof ServiceUnavailableException"}:::decision
  n15 -->|"si falla"| n19
  n20(["↩ (relanza el error capturado)"]):::error
  n19 -->|"sí"| n20
  n21(["503 DEPENDENCY_UNAVAILABLE El inventario del portal está dañado: {relative} no es un JSON válido. Regenerarlo…"]):::error
  n19 -->|"no"| n21
  n22(("200 Responde con éxito")):::ok
  n17 -->|"no"| n22
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 19. GET /admin/portal/flujos/hallazgos

Hallazgos que salen de cruzar flujos, riesgo, pruebas y consumidores.

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 503 | `DEPENDENCY_UNAVAILABLE` | ServiceUnavailableException: El inventario del portal no está disponible: falta {relative}. Se genera con `yarn inventario:endpoints`, `yarn inventario:flujos` y `yarn inventario:catalogo`…; ServiceUnavailableException: El inventario del portal está dañado: {relative} no es un JSON válido. Regenerarlo con `yarn inventario:verificar`. |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a PortalInventoryService.hallazgos"]:::llamada
  n2 --> n3
  n4["Llama a InventoryRepository.hallazgos"]:::llamada
  n3 --> n4
  n5["Llama a InventoryRepository.read"]:::llamada
  n4 --> n5
  n6["Intenta"]:::intento
  n5 --> n6
  n7["Llama a InventoryRepository.raw"]:::llamada
  n6 --> n7
  n8{"!existsSync(file)"}:::decision
  n7 --> n8
  n9(["503 DEPENDENCY_UNAVAILABLE El inventario del portal no está disponible: falta {relative}. Se genera con `yarn…"]):::error
  n8 -->|"sí"| n9
  n10{"error instanceof ServiceUnavailableException"}:::decision
  n6 -->|"si falla"| n10
  n11(["↩ (relanza el error capturado)"]):::error
  n10 -->|"sí"| n11
  n12(["503 DEPENDENCY_UNAVAILABLE El inventario del portal está dañado: {relative} no es un JSON válido. Regenerarlo…"]):::error
  n10 -->|"no"| n12
  n13(("200 Responde con éxito")):::ok
  n8 -->|"no"| n13
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 20. GET /admin/portal/flujos/hallazgos/{id}

Casos de un hallazgo, paginados.

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | NotFoundException: Hallazgo no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 503 | `DEPENDENCY_UNAVAILABLE` | ServiceUnavailableException: El inventario del portal no está disponible: falta {relative}. Se genera con `yarn inventario:endpoints`, `yarn inventario:flujos` y `yarn inventario:catalogo`…; ServiceUnavailableException: El inventario del portal está dañado: {relative} no es un JSON válido. Regenerarlo con `yarn inventario:verificar`. |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a PortalInventoryService.detalleDeHallazgo"]:::llamada
  n2 --> n3
  n4["Llama a InventoryRepository.hallazgos"]:::llamada
  n3 --> n4
  n5["Llama a InventoryRepository.read"]:::llamada
  n4 --> n5
  n6["Intenta"]:::intento
  n5 --> n6
  n7["Llama a InventoryRepository.raw"]:::llamada
  n6 --> n7
  n8{"!existsSync(file)"}:::decision
  n7 --> n8
  n9(["503 DEPENDENCY_UNAVAILABLE El inventario del portal no está disponible: falta {relative}. Se genera con `yarn…"]):::error
  n8 -->|"sí"| n9
  n10{"error instanceof ServiceUnavailableException"}:::decision
  n6 -->|"si falla"| n10
  n11(["↩ (relanza el error capturado)"]):::error
  n10 -->|"sí"| n11
  n12(["503 DEPENDENCY_UNAVAILABLE El inventario del portal está dañado: {relative} no es un JSON válido. Regenerarlo…"]):::error
  n10 -->|"no"| n12
  n13{"!h"}:::decision
  n8 -->|"no"| n13
  n14(["404 NOT_FOUND Hallazgo no encontrado"]):::error
  n13 -->|"sí"| n14
  n15(("200 Responde con éxito")):::ok
  n13 -->|"no"| n15
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 21. GET /admin/portal/flujos/mapa

Mapa de operaciones (ruta, proceso, riesgo, autorización, quién la llama, señales).

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 503 | `DEPENDENCY_UNAVAILABLE` | ServiceUnavailableException: El inventario del portal no está disponible: falta {relative}. Se genera con `yarn inventario:endpoints`, `yarn inventario:flujos` y `yarn inventario:catalogo`…; ServiceUnavailableException: El inventario del portal está dañado: {relative} no es un JSON válido. Regenerarlo con `yarn inventario:verificar`. |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a PortalInventoryService.mapa"]:::llamada
  n2 --> n3
  n4["Llama a InventoryRepository.mapa"]:::llamada
  n3 --> n4
  n5["Llama a InventoryRepository.read"]:::llamada
  n4 --> n5
  n6["Intenta"]:::intento
  n5 --> n6
  n7["Llama a InventoryRepository.raw"]:::llamada
  n6 --> n7
  n8{"!existsSync(file)"}:::decision
  n7 --> n8
  n9(["503 DEPENDENCY_UNAVAILABLE El inventario del portal no está disponible: falta {relative}. Se genera con `yarn…"]):::error
  n8 -->|"sí"| n9
  n10{"error instanceof ServiceUnavailableException"}:::decision
  n6 -->|"si falla"| n10
  n11(["↩ (relanza el error capturado)"]):::error
  n10 -->|"sí"| n11
  n12(["503 DEPENDENCY_UNAVAILABLE El inventario del portal está dañado: {relative} no es un JSON válido. Regenerarlo…"]):::error
  n10 -->|"no"| n12
  n13(("200 Responde con éxito")):::ok
  n8 -->|"no"| n13
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 22. GET /admin/portal/glosario

Glosario de los términos de la API y del frontend.

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 503 | `DEPENDENCY_UNAVAILABLE` | ServiceUnavailableException: El inventario del portal no está disponible: falta {relative}. Se genera con `yarn inventario:endpoints`, `yarn inventario:flujos` y `yarn inventario:catalogo`…; ServiceUnavailableException: El inventario del portal está dañado: {relative} no es un JSON válido. Regenerarlo con `yarn inventario:verificar`. |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a PortalInventoryService.glosario"]:::llamada
  n2 --> n3
  n4["Llama a InventoryRepository.glosario"]:::llamada
  n3 --> n4
  n5["Llama a InventoryRepository.read"]:::llamada
  n4 --> n5
  n6["Intenta"]:::intento
  n5 --> n6
  n7["Llama a InventoryRepository.raw"]:::llamada
  n6 --> n7
  n8{"!existsSync(file)"}:::decision
  n7 --> n8
  n9(["503 DEPENDENCY_UNAVAILABLE El inventario del portal no está disponible: falta {relative}. Se genera con `yarn…"]):::error
  n8 -->|"sí"| n9
  n10{"error instanceof ServiceUnavailableException"}:::decision
  n6 -->|"si falla"| n10
  n11(["↩ (relanza el error capturado)"]):::error
  n10 -->|"sí"| n11
  n12(["503 DEPENDENCY_UNAVAILABLE El inventario del portal está dañado: {relative} no es un JSON válido. Regenerarlo…"]):::error
  n10 -->|"no"| n12
  n13(("200 Responde con éxito")):::ok
  n8 -->|"no"| n13
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 23. GET /admin/portal/linaje

Métricas del linaje y dominios.

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 503 | `DEPENDENCY_UNAVAILABLE` | ServiceUnavailableException: El inventario del portal no está disponible: falta {relative}. Se genera con `yarn inventario:endpoints`, `yarn inventario:flujos` y `yarn inventario:catalogo`…; ServiceUnavailableException: El inventario del portal está dañado: {relative} no es un JSON válido. Regenerarlo con `yarn inventario:verificar`. |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a PortalInventoryService.linaje"]:::llamada
  n2 --> n3
  n4["Llama a InventoryRepository.linaje"]:::llamada
  n3 --> n4
  n5["Llama a InventoryRepository.read"]:::llamada
  n4 --> n5
  n6["Intenta"]:::intento
  n5 --> n6
  n7["Llama a InventoryRepository.raw"]:::llamada
  n6 --> n7
  n8{"!existsSync(file)"}:::decision
  n7 --> n8
  n9(["503 DEPENDENCY_UNAVAILABLE El inventario del portal no está disponible: falta {relative}. Se genera con `yarn…"]):::error
  n8 -->|"sí"| n9
  n10{"error instanceof ServiceUnavailableException"}:::decision
  n6 -->|"si falla"| n10
  n11(["↩ (relanza el error capturado)"]):::error
  n10 -->|"sí"| n11
  n12(["503 DEPENDENCY_UNAVAILABLE El inventario del portal está dañado: {relative} no es un JSON válido. Regenerarlo…"]):::error
  n10 -->|"no"| n12
  n13(("200 Responde con éxito")):::ok
  n8 -->|"no"| n13
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 24. GET /admin/portal/linaje/tablas/{schema}/{tabla}

Qué operaciones tocan una tabla y con qué tablas se relaciona.

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | NotFoundException: Tabla no encontrada en el linaje |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 503 | `DEPENDENCY_UNAVAILABLE` | ServiceUnavailableException: El inventario del portal no está disponible: falta {relative}. Se genera con `yarn inventario:endpoints`, `yarn inventario:flujos` y `yarn inventario:catalogo`…; ServiceUnavailableException: El inventario del portal está dañado: {relative} no es un JSON válido. Regenerarlo con `yarn inventario:verificar`. |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a PortalInventoryService.linajeDeTabla"]:::llamada
  n2 --> n3
  n4["Llama a InventoryRepository.linaje"]:::llamada
  n3 --> n4
  n5["Llama a InventoryRepository.read"]:::llamada
  n4 --> n5
  n6["Intenta"]:::intento
  n5 --> n6
  n7["Llama a InventoryRepository.raw"]:::llamada
  n6 --> n7
  n8{"!existsSync(file)"}:::decision
  n7 --> n8
  n9(["503 DEPENDENCY_UNAVAILABLE El inventario del portal no está disponible: falta {relative}. Se genera con `yarn…"]):::error
  n8 -->|"sí"| n9
  n10{"error instanceof ServiceUnavailableException"}:::decision
  n6 -->|"si falla"| n10
  n11(["↩ (relanza el error capturado)"]):::error
  n10 -->|"sí"| n11
  n12(["503 DEPENDENCY_UNAVAILABLE El inventario del portal está dañado: {relative} no es un JSON válido. Regenerarlo…"]):::error
  n10 -->|"no"| n12
  n13{"!l.nodos.some((n) =› n.id === `tabla:${id}`)"}:::decision
  n8 -->|"no"| n13
  n14(["404 NOT_FOUND Tabla no encontrada en el linaje"]):::error
  n13 -->|"sí"| n14
  n15(("200 Responde con éxito")):::ok
  n13 -->|"no"| n15
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 25. GET /admin/portal/operaciones

Catálogo de operaciones HTTP, con filtros y cursor.

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 503 | `DEPENDENCY_UNAVAILABLE` | ServiceUnavailableException: El inventario del portal está dañado: {relative} no es un JSON válido. Regenerarlo con `yarn inventario:verificar`.; ServiceUnavailableException: El inventario del portal no está disponible: falta el directorio {relative}. |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a PortalInventoryService.listarOperaciones"]:::llamada
  n2 --> n3
  n4["Llama a PortalInventoryService.senales"]:::llamada
  n3 --> n4
  n5["Llama a InventoryRepository.mapa"]:::llamada
  n4 --> n5
  n6["Llama a InventoryRepository.read"]:::llamada
  n5 --> n6
  n7["Intenta"]:::intento
  n6 --> n7
  n8{"error instanceof ServiceUnavailableException"}:::decision
  n7 -->|"si falla"| n8
  n9(["↩ (relanza el error capturado)"]):::error
  n8 -->|"sí"| n9
  n10(["503 DEPENDENCY_UNAVAILABLE El inventario del portal está dañado: {relative} no es un JSON válido. Regenerarlo…"]):::error
  n8 -->|"no"| n10
  n11["Llama a InventoryRepository.operaciones"]:::llamada
  n7 --> n11
  n12["Llama a InventoryRepository.readDirectory"]:::llamada
  n11 --> n12
  n13{"!existsSync(dir)"}:::decision
  n12 --> n13
  n14(["503 DEPENDENCY_UNAVAILABLE El inventario del portal no está disponible: falta el directorio {relative}."]):::error
  n13 -->|"sí"| n14
  n15["Llama a InventoryRepository.read"]:::llamada
  n13 -->|"no"| n15
  n16["Intenta"]:::intento
  n15 --> n16
  n17{"error instanceof ServiceUnavailableException"}:::decision
  n16 -->|"si falla"| n17
  n18(["↩ (relanza el error capturado)"]):::error
  n17 -->|"sí"| n18
  n19(["503 DEPENDENCY_UNAVAILABLE El inventario del portal está dañado: {relative} no es un JSON válido. Regenerarlo…"]):::error
  n17 -->|"no"| n19
  n20(("200 Responde con éxito")):::ok
  n16 --> n20
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 26. GET /admin/portal/operaciones/{id}

Ficha de una operación (negocio, contrato, datos, acceso, pruebas).

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | NotFoundException: Operación no encontrada en el inventario |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 503 | `DEPENDENCY_UNAVAILABLE` | ServiceUnavailableException: El inventario del portal no está disponible: falta el directorio {relative}.; ServiceUnavailableException: El inventario del portal está dañado: {relative} no es un JSON válido. Regenerarlo con `yarn inventario:verificar`. |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a PortalInventoryService.detalleDeOperacion"]:::llamada
  n2 --> n3
  n4["Llama a PortalInventoryService.operacion"]:::llamada
  n3 --> n4
  n5["Llama a InventoryRepository.operaciones"]:::llamada
  n4 --> n5
  n6["Llama a InventoryRepository.readDirectory"]:::llamada
  n5 --> n6
  n7{"!existsSync(dir)"}:::decision
  n6 --> n7
  n8(["503 DEPENDENCY_UNAVAILABLE El inventario del portal no está disponible: falta el directorio {relative}."]):::error
  n7 -->|"sí"| n8
  n9{"!encontrada"}:::decision
  n7 -->|"no"| n9
  n10(["404 NOT_FOUND Operación no encontrada en el inventario"]):::error
  n9 -->|"sí"| n10
  n11["Llama a PortalInventoryService.senales"]:::llamada
  n9 -->|"no"| n11
  n12["Llama a InventoryRepository.mapa"]:::llamada
  n11 --> n12
  n13["Llama a InventoryRepository.read"]:::llamada
  n12 --> n13
  n14["Intenta"]:::intento
  n13 --> n14
  n15{"error instanceof ServiceUnavailableException"}:::decision
  n14 -->|"si falla"| n15
  n16(["↩ (relanza el error capturado)"]):::error
  n15 -->|"sí"| n16
  n17(["503 DEPENDENCY_UNAVAILABLE El inventario del portal está dañado: {relative} no es un JSON válido. Regenerarlo…"]):::error
  n15 -->|"no"| n17
  n18(("200 Responde con éxito")):::ok
  n14 --> n18
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 27. GET /admin/portal/operaciones/{id}/arbol

Árbol de decisión de una operación.

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | NotFoundException: Operación no encontrada en el inventario; NotFoundException: La operación no tiene árbol de decisión |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 503 | `DEPENDENCY_UNAVAILABLE` | ServiceUnavailableException: El inventario del portal no está disponible: falta el directorio {relative}.; ServiceUnavailableException: El inventario del portal está dañado: {relative} no es un JSON válido. Regenerarlo con `yarn inventario:verificar`. |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a PortalInventoryService.arbolDeOperacion"]:::llamada
  n2 --> n3
  n4["Llama a PortalInventoryService.operacion"]:::llamada
  n3 --> n4
  n5["Llama a InventoryRepository.operaciones"]:::llamada
  n4 --> n5
  n6["Llama a InventoryRepository.readDirectory"]:::llamada
  n5 --> n6
  n7{"!existsSync(dir)"}:::decision
  n6 --> n7
  n8(["503 DEPENDENCY_UNAVAILABLE El inventario del portal no está disponible: falta el directorio {relative}."]):::error
  n7 -->|"sí"| n8
  n9{"!encontrada"}:::decision
  n7 -->|"no"| n9
  n10(["404 NOT_FOUND Operación no encontrada en el inventario"]):::error
  n9 -->|"sí"| n10
  n11["Llama a InventoryRepository.arboles"]:::llamada
  n9 -->|"no"| n11
  n12{"!this.cache.has(key)"}:::decision
  n11 --> n12
  n13["Llama a InventoryRepository.readDirectory"]:::llamada
  n12 -->|"sí"| n13
  n14{"!existsSync(dir)"}:::decision
  n13 --> n14
  n15(["503 DEPENDENCY_UNAVAILABLE El inventario del portal no está disponible: falta el directorio {relative}."]):::error
  n14 -->|"sí"| n15
  n16["Llama a InventoryRepository.read"]:::llamada
  n14 -->|"no"| n16
  n17["Intenta"]:::intento
  n16 --> n17
  n18{"error instanceof ServiceUnavailableException"}:::decision
  n17 -->|"si falla"| n18
  n19(["↩ (relanza el error capturado)"]):::error
  n18 -->|"sí"| n19
  n20(["503 DEPENDENCY_UNAVAILABLE El inventario del portal está dañado: {relative} no es un JSON válido. Regenerarlo…"]):::error
  n18 -->|"no"| n20
  n21{"!arbol"}:::decision
  n17 --> n21
  n12 -->|"no"| n21
  n22(["404 NOT_FOUND La operación no tiene árbol de decisión"]):::error
  n21 -->|"sí"| n22
  n23(("200 Responde con éxito")):::ok
  n21 -->|"no"| n23
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 28. GET /admin/portal/version

Versión del inventario que se está mostrando.

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 503 | `DEPENDENCY_UNAVAILABLE` | ServiceUnavailableException: El inventario del portal no está disponible: falta {relative}. Se genera con `yarn inventario:endpoints`, `yarn inventario:flujos` y `yarn inventario:catalogo`…; ServiceUnavailableException: El inventario del portal está dañado: {relative} no es un JSON válido. Regenerarlo con `yarn inventario:verificar`. |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a PortalInventoryService.version"]:::llamada
  n2 --> n3
  n4["Llama a InventoryRepository.version"]:::llamada
  n3 --> n4
  n5["Repite: por cada const f de [ 'endpoints/indice.json', 'catalogo/indice.json'…"]:::bucle
  n4 --> n5
  n6["Llama a InventoryRepository.raw"]:::llamada
  n5 -->|"cada elemento"| n6
  n7{"!existsSync(file)"}:::decision
  n6 --> n7
  n8(["503 DEPENDENCY_UNAVAILABLE El inventario del portal no está disponible: falta {relative}. Se genera con `yarn…"]):::error
  n7 -->|"sí"| n8
  n9["Llama a InventoryRepository.catalogoIndice"]:::llamada
  n7 -->|"no"| n9
  n5 -->|"al terminar"| n9
  n10["Llama a InventoryRepository.read"]:::llamada
  n9 --> n10
  n11["Intenta"]:::intento
  n10 --> n11
  n12{"error instanceof ServiceUnavailableException"}:::decision
  n11 -->|"si falla"| n12
  n13(["↩ (relanza el error capturado)"]):::error
  n12 -->|"sí"| n13
  n14(["503 DEPENDENCY_UNAVAILABLE El inventario del portal está dañado: {relative} no es un JSON válido. Regenerarlo…"]):::error
  n12 -->|"no"| n14
  n15["Llama a InventoryRepository.read"]:::llamada
  n11 --> n15
  n16["Intenta"]:::intento
  n15 --> n16
  n17["Llama a InventoryRepository.raw"]:::llamada
  n16 --> n17
  n18{"!existsSync(file)"}:::decision
  n17 --> n18
  n19(["503 DEPENDENCY_UNAVAILABLE El inventario del portal no está disponible: falta {relative}. Se genera con `yarn…"]):::error
  n18 -->|"sí"| n19
  n20{"error instanceof ServiceUnavailableException"}:::decision
  n16 -->|"si falla"| n20
  n21(["↩ (relanza el error capturado)"]):::error
  n20 -->|"sí"| n21
  n22(["503 DEPENDENCY_UNAVAILABLE El inventario del portal está dañado: {relative} no es un JSON válido. Regenerarlo…"]):::error
  n20 -->|"no"| n22
  n23["Llama a InventoryRepository.procesos"]:::llamada
  n18 -->|"no"| n23
  n24["Llama a InventoryRepository.read"]:::llamada
  n23 --> n24
  n25["Intenta"]:::intento
  n24 --> n25
  n26{"error instanceof ServiceUnavailableException"}:::decision
  n25 -->|"si falla"| n26
  n27(["↩ (relanza el error capturado)"]):::error
  n26 -->|"sí"| n27
  n28(["503 DEPENDENCY_UNAVAILABLE El inventario del portal está dañado: {relative} no es un JSON válido. Regenerarlo…"]):::error
  n26 -->|"no"| n28
  n29(("200 Responde con éxito")):::ok
  n25 --> n29
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
| GET /admin/catalog/coverage | 200, 401, 403, 429 | 3 |
| GET /admin/catalog/scans | 200, 401, 403, 429 | 1 |
| GET /admin/catalog/schemas | 200, 401, 403, 429 | 2 |
