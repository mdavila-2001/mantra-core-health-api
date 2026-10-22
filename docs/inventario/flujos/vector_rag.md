<!-- AUTOGENERADO por tools/inventario/flujos.mjs. No editar manualmente. -->

# Flujos del módulo `vector_rag`

- **Procesos:** 1 · **Máquinas de estado:** 0
- **Operaciones:** 16 (15 con decisiones propias, 1 sin ellas)
- Inventario de endpoints del módulo: [vector_rag](../endpoints/vector_rag.md)

## Proceso: Módulo 59 — Búsqueda vectorial, evidencia RAG y gobierno de embeddings

- **Código:** `vector_rag` · **Agrupación:** MIXTO · **Operaciones:** 16
- **Actores:** AGENT_RUNTIME · AI_GOVERNANCE_OFFICER · CLINICIAN · DPO · EMBEDDING_WORKER · MLOPS_ENGINEER · PLATFORM_ADMIN · PRIVACY_OFFICER · RAG_COLLECTION_ADMIN · RECONCILIATION_WORKER · RETRIEVAL_WORKER · SYSTEM
- **Revisión:** AUTO_DETECTADA
- **Fuentes:** `src/modules/vector_rag/README.md`

### Para qué sirve

Modelos de embedding aprobados uno a uno, colecciones que sólo aceptan lo que su modelo permite, políticas de acceso que se publican tras revisión de privacidad, y un retrieval en el que **cada candidato recibe una decisión de autorización y todas se guardan** — también las denegadas.

_Fuente: `src/modules/vector_rag/README.md:3`_

### Flujo general declarado en el README

```text
GOBIERNO
  embedding-model-versions ──> modelo aprobado (y quizá aprobado para PHI)
  rag-access-policies ───────> política DRAFT
    └─ /publish ─────────────> PUBLISHED + reenlaza colecciones
  collections ───────────────> dimensión y métrica DEL MODELO
                               PHI exige modelo aprobado para PHI
                               + binding de tenant ACTIVE

INGESTA
  collections/:id/embedding-jobs ──> job QUEUED (idempotente por alcance)
    └─ embedding-jobs/:id/run ─────> documento + chunks + vectores, misma tx
                                     reejecutar no duplica en ningún nivel
                                     finalBatch ⇒ job COMPLETED

CONSULTA
  retrieval-sessions ──> exige política PUBLISHED, propósito admitido,
                         y —si la política lo pide— paciente y consentimiento
    └─ /search ────────> por cada candidato: allow · deny_scope · deny_consent · deny_label
                         TODAS se guardan; topK recorta entre los autorizados
    └─ /evidence ──────> sólo lo seleccionado y autorizado; versión fuente copiada
                         sesión COMPLETED
    └─ /feedback ──────> safety_issue ⇒ sesión FLAGGED + evento aparte

MANTENIMIENTO
  deletion-jobs ──────────────> borrado FÍSICO: embeddings → chunks → documentos
  collections/:id/reconciliation > falta / huérfano / descuadrado, y su reparación
  collections/:id/re-embed ───> modelo nuevo; los vectores viejos a `superseded`
  .../retire · /lifecycle ────> modelo retirado, colección sellada, bindings congelados
```

_Fuente: `src/modules/vector_rag/README.md:79`_

### Etapas y operaciones

| Etapa | Descripción | Operación | Quién actúa | Riesgo | Tablas |
|---|---|---|---|---|---|
| `UC-59-01` | Registrar y aprobar versión de modelo | POST /vector-rag/embedding-model-versions | AI_GOVERNANCE_OFFICER · MLOPS_ENGINEER · PLATFORM_ADMIN | MEDIO | 5 |
| `UC-59-02` | Colección gobernada + binding de tenant | POST /vector-rag/collections | RAG_COLLECTION_ADMIN · PLATFORM_ADMIN | MEDIO | 9 |
| `UC-59-03` | Definir y publicar política | POST /vector-rag/rag-access-policies | PRIVACY_OFFICER · DPO · PLATFORM_ADMIN | MEDIO | 2 |
| `UC-59-04` | Encolar job de embedding | POST /vector-rag/collections/{id}/embedding-jobs | RAG_COLLECTION_ADMIN · PLATFORM_ADMIN | MEDIO | 5 |
| `UC-59-05` | Chunking + embedding + upsert | POST /vector-rag/embedding-jobs/{id}/run | SYSTEM · EMBEDDING_WORKER · PLATFORM_ADMIN | MEDIO | 13 |
| `UC-59-06` | Sesión consent-aware | POST /vector-rag/retrieval-sessions | CLINICIAN · AGENT_RUNTIME · SYSTEM · PLATFORM_ADMIN | MEDIO | 7 |
| `UC-59-07` | Ranquear y filtrar | POST /vector-rag/retrieval-sessions/{id}/search | SYSTEM · RETRIEVAL_WORKER · PLATFORM_ADMIN | MEDIO | 10 |
| `UC-59-08` | Evidencia citable | POST /vector-rag/retrieval-sessions/{id}/evidence | SYSTEM · RETRIEVAL_WORKER · PLATFORM_ADMIN | MEDIO | 9 |
| `UC-59-09` | Feedback de relevancia y seguridad | POST /vector-rag/retrieval-sessions/{id}/feedback | CLINICIAN · AGENT_RUNTIME · PLATFORM_ADMIN | MEDIO | 6 |
| `UC-59-10` | Propagar borrado a embeddings | POST /vector-rag/deletion-jobs | PRIVACY_OFFICER · DPO · SYSTEM · PLATFORM_ADMIN | ALTO | 10 |
| `UC-59-11` | Re-embeber tras cambio de modelo | POST /vector-rag/collections/{id}/re-embed | AI_GOVERNANCE_OFFICER · MLOPS_ENGINEER · PLATFORM_ADMIN | MEDIO | 11 |
| `UC-59-12` | Reconciliar canónico vs vectorial | POST /vector-rag/collections/{id}/reconciliation | SYSTEM · RECONCILIATION_WORKER · PLATFORM_ADMIN | MEDIO | 8 |
| `ctrl:VectorGovernanceController` | Operaciones de VectorGovernanceController que el README no asigna a un caso de uso | PUT /vector-rag/collections/{id}/lifecycle | AI_GOVERNANCE_OFFICER · RAG_COLLECTION_ADMIN · PLATFORM_ADMIN | MEDIO | 7 |
|  |  | POST /vector-rag/embedding-model-versions/{id}/retire | AI_GOVERNANCE_OFFICER · MLOPS_ENGINEER · PLATFORM_ADMIN | MEDIO | 7 |
|  |  | PUT /vector-rag/rag-access-policies/{id}/publish | PRIVACY_OFFICER · DPO · PLATFORM_ADMIN | MEDIO | 7 |
| `ctrl:VectorRuntimeController` | Operaciones de VectorRuntimeController que el README no asigna a un caso de uso | GET /vector-rag/embedding-jobs/pending | SYSTEM · EMBEDDING_WORKER · PLATFORM_ADMIN | BAJO | 1 |

### Diagrama — etapas `UC-59-01`, `UC-59-02`, `UC-59-03`…

```mermaid
flowchart LR
  a2(["AI_GOVERNANCE_OFFICER · MLOPS_ENGINEER · PLATFORM_ADMIN"]):::actor
  a8(["RAG_COLLECTION_ADMIN · PLATFORM_ADMIN"]):::actor
  a14(["PRIVACY_OFFICER · DPO · PLATFORM_ADMIN"]):::actor
  a19(["SYSTEM · EMBEDDING_WORKER · PLATFORM_ADMIN"]):::actor
  a23(["CLINICIAN · AGENT_RUNTIME · SYSTEM · PLATFORM_ADMIN"]):::actor
  a28(["SYSTEM · RETRIEVAL_WORKER · PLATFORM_ADMIN"]):::actor
  a37(["CLINICIAN · AGENT_RUNTIME · PLATFORM_ADMIN"]):::actor
  a42(["PRIVACY_OFFICER · DPO · SYSTEM · PLATFORM_ADMIN"]):::actor
  a51(["SYSTEM · RECONCILIATION_WORKER · PLATFORM_ADMIN"]):::actor
  a56(["AI_GOVERNANCE_OFFICER · RAG_COLLECTION_ADMIN · PLATFORM_ADM…"]):::actor
  t3[("messaging.domain_events")]:::tabla
  t4[("messaging.outbox_messages")]:::tabla
  t5[("vector_rag.embedding_model_versions")]:::tabla
  e6>"EmbeddingModelVersionApproved"]:::evento
  t9[("vector_rag.rag_access_policies")]:::tabla
  t10[("vector_rag.vector_collections")]:::tabla
  e12>"VectorCollectionProvisioned"]:::evento
  t16[("vector_rag.embedding_jobs")]:::tabla
  e17>"EmbeddingJobQueued"]:::evento
  e21>"EmbeddingJobCompleted"]:::evento
  t24[("vector_rag.retrieval_sessions")]:::tabla
  e26>"RetrievalSessionOpened"]:::evento
  t29[("vector_rag.retrieval_candidates")]:::tabla
  e31>"RetrievalCandidatesRanked"]:::evento
  t33[("vector_rag.retrieval_evidence")]:::tabla
  e35>"RetrievalEvidenceMaterialized"]:::evento
  t38[("vector_rag.retrieval_feedback_events")]:::tabla
  e39>"RetrievalFeedbackCaptured"]:::evento
  e40>"RetrievalSafetyIssueRaised"]:::evento
  t43[("vector_rag.vector_chunks")]:::tabla
  t44[("vector_rag.vector_deletion_jobs")]:::tabla
  e46>"VectorEmbeddingsPurged"]:::evento
  e49>"CollectionReEmbedRequested"]:::evento
  e53>"VectorReconciliationCompleted"]:::evento
  e54>"DriftDetected"]:::evento
  t57[("vector_rag.vector_tenant_bindings")]:::tabla
  e59>"VectorCollectionSealed"]:::evento
  e62>"EmbeddingModelRetired"]:::evento
  e65>"RagAccessPolicyPublished"]:::evento
  subgraph s0["UC-59-01 · Registrar y aprobar versión de modelo"]
    o1["POST /vector-rag/embedding-model-versions"]:::op
  end
  t11[("+3 tablas más")]
  subgraph s1["UC-59-02 · Colección gobernada + binding de tenant"]
    o7["POST /vector-rag/collections"]:::op
  end
  subgraph s2["UC-59-03 · Definir y publicar política"]
    o13["POST /vector-rag/rag-access-policies"]:::op
  end
  subgraph s3["UC-59-04 · Encolar job de embedding"]
    o15["POST /vector-rag/collections/{id}/embedding-jobs"]:::op
  end
  t20[("+7 tablas más")]
  subgraph s4["UC-59-05 · Chunking + embedding + upsert"]
    o18["POST /vector-rag/embedding-jobs/{id}/run"]:::op
  end
  t25[("+1 tablas más")]
  subgraph s5["UC-59-06 · Sesión consent-aware"]
    o22["POST /vector-rag/retrieval-sessions"]:::op
  end
  t30[("+4 tablas más")]
  subgraph s6["UC-59-07 · Ranquear y filtrar"]
    o27["POST /vector-rag/retrieval-sessions/{id}/search"]:::op
  end
  t34[("+3 tablas más")]
  subgraph s7["UC-59-08 · Evidencia citable"]
    o32["POST /vector-rag/retrieval-sessions/{id}/evidence"]:::op
  end
  subgraph s8["UC-59-09 · Feedback de relevancia y seguridad"]
    o36["POST /vector-rag/retrieval-sessions/{id}/feedback"]:::op
  end
  t45[("+4 tablas más")]
  subgraph s9["UC-59-10 · Propagar borrado a embeddings"]
    o41["POST /vector-rag/deletion-jobs"]:::op
  end
  t48[("+5 tablas más")]
  subgraph s10["UC-59-11 · Re-embeber tras cambio de modelo"]
    o47["POST /vector-rag/collections/{id}/re-embed"]:::op
  end
  t52[("+2 tablas más")]
  subgraph s11["UC-59-12 · Reconciliar canónico vs vectorial"]
    o50["POST /vector-rag/collections/{id}/reconciliation"]:::op
  end
  t58[("+1 tablas más")]
  t61[("+1 tablas más")]
  t64[("+1 tablas más")]
  subgraph s12["ctrl:VectorGovernanceController · Operaciones de VectorGovernanceController que…"]
    o55["PUT /vector-rag/collections/{id}/lifecycle"]:::op
    o60["POST /vector-rag/embedding-model-versions/{id}/retire"]:::op
    o63["PUT /vector-rag/rag-access-policies/{id}/publish"]:::op
  end
  subgraph s13["ctrl:VectorRuntimeController · Operaciones de VectorRuntimeController que el RE…"]
    o66["GET /vector-rag/embedding-jobs/pending"]:::op
  end
  a2 --> o1
  o1 -->|"CREA"| t3
  o1 -->|"CREA"| t4
  o1 -->|"LEE"| t4
  o1 -->|"CREA"| t5
  o1 -->|"LEE"| t5
  o1 -->|"evento"| e6
  a8 --> o7
  o7 -->|"CREA"| t3
  o7 -->|"CREA"| t4
  o7 -->|"LEE"| t4
  o7 -->|"LEE"| t5
  o7 -->|"LEE"| t9
  o7 -->|"CREA"| t10
  o7 -.-> t11
  o7 -->|"evento"| e12
  a14 --> o13
  o13 -->|"CREA"| t9
  o13 -->|"LEE"| t9
  a8 --> o15
  o15 -->|"CREA"| t3
  o15 -->|"CREA"| t4
  o15 -->|"LEE"| t4
  o15 -->|"CREA"| t16
  o15 -->|"LEE"| t10
  o15 -->|"evento"| e17
  a19 --> o18
  o18 -->|"CREA"| t3
  o18 -->|"CREA"| t4
  o18 -->|"LEE"| t4
  o18 -->|"ACTUALIZA"| t16
  o18 -->|"LEE"| t16
  o18 -->|"LEE"| t5
  o18 -.-> t20
  o18 -->|"evento"| e21
  a23 --> o22
  o22 -->|"CREA"| t3
  o22 -->|"CREA"| t4
  o22 -->|"LEE"| t4
  o22 -->|"LEE"| t9
  o22 -->|"CREA"| t24
  o22 -->|"LEE"| t24
  o22 -.-> t25
  o22 -->|"evento"| e26
  a28 --> o27
  o27 -->|"CREA"| t3
  o27 -->|"CREA"| t4
  o27 -->|"LEE"| t4
  o27 -->|"LEE"| t9
  o27 -->|"CREA"| t29
  o27 -->|"ACTUALIZA"| t24
  o27 -.-> t30
  o27 -->|"evento"| e31
  a28 --> o32
  o32 -->|"CREA"| t3
  o32 -->|"CREA"| t4
  o32 -->|"LEE"| t4
  o32 -->|"LEE"| t29
  o32 -->|"CREA"| t33
  o32 -->|"ACTUALIZA"| t24
  o32 -.-> t34
  o32 -->|"evento"| e35
  a37 --> o36
  o36 -->|"CREA"| t3
  o36 -->|"CREA"| t4
  o36 -->|"LEE"| t4
  o36 -->|"CREA"| t38
  o36 -->|"ACTUALIZA"| t24
  o36 -->|"LEE"| t24
  o36 -->|"evento"| e39
  o36 -->|"evento"| e40
  a42 --> o41
  o41 -->|"CREA"| t3
  o41 -->|"CREA"| t4
  o41 -->|"LEE"| t4
  o41 -->|"BORRA"| t43
  o41 -->|"LEE"| t43
  o41 -->|"ACTUALIZA"| t44
  o41 -.-> t45
  o41 -->|"evento"| e46
  a2 --> o47
  o47 -->|"CREA"| t3
  o47 -->|"CREA"| t4
  o47 -->|"LEE"| t4
  o47 -->|"CREA"| t16
  o47 -->|"LEE"| t5
  o47 -->|"LEE"| t43
  o47 -.-> t48
  o47 -->|"evento"| e49
  a51 --> o50
  o50 -->|"CREA"| t3
  o50 -->|"CREA"| t4
  o50 -->|"LEE"| t4
  o50 -->|"CREA"| t16
  o50 -->|"LEE"| t10
  o50 -->|"CREA"| t44
  o50 -.-> t52
  o50 -->|"evento"| e53
  o50 -->|"evento"| e54
  a56 --> o55
  o55 -->|"CREA"| t3
  o55 -->|"CREA"| t4
  o55 -->|"LEE"| t4
  o55 -->|"ACTUALIZA"| t10
  o55 -->|"LEE"| t10
  o55 -->|"ACTUALIZA"| t57
  o55 -.-> t58
  o55 -->|"evento"| e59
  a2 --> o60
  o60 -->|"CREA"| t3
  o60 -->|"CREA"| t4
  o60 -->|"LEE"| t4
  o60 -->|"LEE"| t16
  o60 -->|"ACTUALIZA"| t5
  o60 -->|"LEE"| t5
  o60 -.-> t61
  o60 -->|"evento"| e62
  a14 --> o63
  o63 -->|"CREA"| t3
  o63 -->|"CREA"| t4
  o63 -->|"LEE"| t4
  o63 -->|"ACTUALIZA"| t9
  o63 -->|"LEE"| t9
  o63 -->|"ACTUALIZA"| t10
  o63 -.-> t64
  o63 -->|"evento"| e65
  a19 --> o66
  o66 -->|"LEE"| t16
  classDef op fill:#fff,stroke:#446
  classDef actor fill:#eef,stroke:#66a
  classDef tabla fill:#ffd,stroke:#aa3
  classDef evento fill:#efe,stroke:#3a3
```

## Árbol de decisión por operación

Cada árbol se deriva del código del handler y de los métodos que invoca (hasta 4 niveles). Una rama que no decide, no escribe y no falla se poda. Los accesos y los efectos consecutivos se agrupan en un solo nodo.

### Operaciones con decisiones propias

#### 1. POST /vector-rag/collections

Crear una colección vectorial con su vínculo de tenant

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Versión de modelo no encontrada.; ResourceNotFoundException: Política de acceso RAG no encontrada. |
| 409 | `CONFLICT` | ConflictException: Ya existe una colección con ese código para el tenant.; ConflictException: El namespace ya está en uso por otro vínculo. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El modelo está retirado; no se pueden crear colecciones nuevas sobre él.; PreconditionFailedException: El modelo no está aprobado para datos de paciente. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a VectorGovernanceService.createCollection"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a VectorCatalogRepository.findCollectionByCode"]:::llamada
  n4 --> n5
  n6[("LEE vector_rag.vector_collections")]:::efecto
  n5 --> n6
  n7{"duplicate"}:::decision
  n6 --> n7
  n8(["409 CONFLICT Ya existe una colección con ese código para el tenant."]):::error
  n7 -->|"sí"| n8
  n9["Llama a VectorCatalogRepository.findBindingByNamespace"]:::llamada
  n7 -->|"no"| n9
  n10[("LEE vector_rag.vector_tenant_bindings")]:::efecto
  n9 --> n10
  n11{"namespaceTaken"}:::decision
  n10 --> n11
  n12(["409 CONFLICT El namespace ya está en uso por otro vínculo."]):::error
  n11 -->|"sí"| n12
  n13["Llama a VectorCatalogRepository.findModelVersionForUpdate"]:::llamada
  n11 -->|"no"| n13
  n14[("LEE vector_rag.embedding_model_versions")]:::efecto
  n13 --> n14
  n15{"!model"}:::decision
  n14 --> n15
  n16(["404 NOT_FOUND Versión de modelo no encontrada."]):::error
  n15 -->|"sí"| n16
  n17{"model.retiredAt"}:::decision
  n15 -->|"no"| n17
  n18(["422 PRECONDITION_FAILED El modelo está retirado; no se pueden crear colecciones nuevas sobre él."]):::error
  n17 -->|"sí"| n18
  n19{"containsPhi && !model.approvedForPhi"}:::decision
  n17 -->|"no"| n19
  n20(["422 PRECONDITION_FAILED El modelo no está aprobado para datos de paciente."]):::error
  n19 -->|"sí"| n20
  n21{"dto.accessPolicyId"}:::decision
  n19 -->|"no"| n21
  n22["Llama a VectorCatalogRepository.findPolicyById"]:::llamada
  n21 -->|"sí"| n22
  n23[("LEE vector_rag.rag_access_policies")]:::efecto
  n22 --> n23
  n24{"!policy"}:::decision
  n23 --> n24
  n25(["404 NOT_FOUND Política de acceso RAG no encontrada."]):::error
  n24 -->|"sí"| n25
  n26["Llama a VectorCatalogRepository.createCollection"]:::llamada
  n24 -->|"no"| n26
  n21 -->|"no"| n26
  n27[("CREA vector_rag.vector_collections")]:::efecto
  n26 --> n27
  n28["Llama a VectorCatalogRepository.createBinding"]:::llamada
  n27 --> n28
  n29[("CREA vector_rag.vector_tenant_bindings")]:::efecto
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
  n42>"Evento VectorCollectionProvisioned"]:::evento
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

#### 2. POST /vector-rag/collections/{id}/embedding-jobs

Encolar un job de embedding

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Colección no encontrada. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La colección no está activa; no admite jobs de embedding. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a EmbeddingPipelineService.queueEmbeddingJob"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a VectorCatalogRepository.findCollectionById"]:::llamada
  n4 --> n5
  n6[("LEE vector_rag.vector_collections")]:::efecto
  n5 --> n6
  n7{"!collection"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Colección no encontrada."]):::error
  n7 -->|"sí"| n8
  n9{"collection.lifecycleState !== 'active'"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED La colección no está activa; no admite jobs de embedding."]):::error
  n9 -->|"sí"| n10
  n11["Llama a VectorCatalogRepository.createJob"]:::llamada
  n9 -->|"no"| n11
  n12[("CREA vector_rag.embedding_jobs")]:::efecto
  n11 --> n12
  n13["Llama a OutboxService.publishDomainEvent"]:::llamada
  n12 --> n13
  n14["Llama a MessagingTraceService.runInProducerSpan"]:::llamada
  n13 --> n14
  n15["Transacción: startActiveSpan(…)"]:::transaccion
  n14 --> n15
  n16["Intenta"]:::intento
  n15 --> n16
  n17(["↩ (relanza el error capturado)"]):::error
  n16 -->|"si falla"| n17
  n18["Llama a OutboxService.persistDomainEvent"]:::llamada
  n16 --> n18
  n19["Llama a OutboxRepository.findOutboxByIdempotencyKey"]:::llamada
  n18 --> n19
  n20[("LEE messaging.outbox_messages")]:::efecto
  n19 --> n20
  n21["Llama a OutboxRepository.createDomainEvent"]:::llamada
  n20 --> n21
  n22[("CREA messaging.domain_events")]:::efecto
  n21 --> n22
  n23["Llama a OutboxRepository.createOutboxMessage"]:::llamada
  n22 --> n23
  n24[("CREA messaging.outbox_messages")]:::efecto
  n23 --> n24
  n25>"Evento EmbeddingJobQueued"]:::evento
  n24 --> n25
  n26(("201 Responde con éxito")):::ok
  n25 --> n26
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 3. PUT /vector-rag/collections/{id}/lifecycle

Sellar o deprecar la colección

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Colección no encontrada. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a VectorGovernanceService.updateCollectionLifecycle"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a VectorCatalogRepository.findCollectionForUpdate"]:::llamada
  n4 --> n5
  n6[("LEE vector_rag.vector_collections")]:::efecto
  n5 --> n6
  n7{"!collection"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Colección no encontrada."]):::error
  n7 -->|"sí"| n8
  n9[("ACTUALIZA vector_rag.vector_collections")]:::efecto
  n7 -->|"no"| n9
  n10{"dto.lifecycleState === 'sealed'"}:::decision
  n9 --> n10
  n11["Llama a VectorCatalogRepository.findBindingsByCollectionForUpdate"]:::llamada
  n10 -->|"sí"| n11
  n12[("LEE vector_rag.vector_tenant_bindings")]:::efecto
  n11 --> n12
  n13["Repite: por cada const binding de bindings"]:::bucle
  n12 --> n13
  n14[("ACTUALIZA vector_rag.vector_tenant_bindings")]:::efecto
  n13 -->|"cada elemento"| n14
  n15["Llama a OutboxService.publishDomainEvent"]:::llamada
  n14 --> n15
  n13 -->|"al terminar"| n15
  n10 -->|"no"| n15
  n16["Llama a MessagingTraceService.runInProducerSpan"]:::llamada
  n15 --> n16
  n17["Transacción: startActiveSpan(…)"]:::transaccion
  n16 --> n17
  n18["Intenta"]:::intento
  n17 --> n18
  n19(["↩ (relanza el error capturado)"]):::error
  n18 -->|"si falla"| n19
  n20["Llama a OutboxService.persistDomainEvent"]:::llamada
  n18 --> n20
  n21["Llama a OutboxRepository.findOutboxByIdempotencyKey"]:::llamada
  n20 --> n21
  n22[("LEE messaging.outbox_messages")]:::efecto
  n21 --> n22
  n23["Llama a OutboxRepository.createDomainEvent"]:::llamada
  n22 --> n23
  n24[("CREA messaging.domain_events")]:::efecto
  n23 --> n24
  n25["Llama a OutboxRepository.createOutboxMessage"]:::llamada
  n24 --> n25
  n26[("CREA messaging.outbox_messages")]:::efecto
  n25 --> n26
  n27>"Evento VectorCollectionSealed"]:::evento
  n26 --> n27
  n28(("200 Responde con éxito")):::ok
  n27 --> n28
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 4. POST /vector-rag/collections/{id}/re-embed

Migrar la colección a un modelo nuevo

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Colección no encontrada.; ResourceNotFoundException: Versión de modelo no encontrada. |
| 409 | `CONFLICT` | ConflictException: La colección ya usa esa versión de modelo. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La colección no está activa.; PreconditionFailedException: El modelo de destino está retirado.; PreconditionFailedException: El modelo de destino no está aprobado para datos de paciente. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a EmbeddingPipelineService.reEmbedCollection"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a VectorCatalogRepository.findCollectionForUpdate"]:::llamada
  n4 --> n5
  n6[("LEE vector_rag.vector_collections")]:::efecto
  n5 --> n6
  n7{"!collection"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Colección no encontrada."]):::error
  n7 -->|"sí"| n8
  n9{"collection.lifecycleState !== 'active'"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED La colección no está activa."]):::error
  n9 -->|"sí"| n10
  n11{"collection.embeddingModelVersionId === dto.embeddingModelVersionId"}:::decision
  n9 -->|"no"| n11
  n12(["409 CONFLICT La colección ya usa esa versión de modelo."]):::error
  n11 -->|"sí"| n12
  n13["Llama a VectorCatalogRepository.findModelVersionForUpdate"]:::llamada
  n11 -->|"no"| n13
  n14[("LEE vector_rag.embedding_model_versions")]:::efecto
  n13 --> n14
  n15{"!model"}:::decision
  n14 --> n15
  n16(["404 NOT_FOUND Versión de modelo no encontrada."]):::error
  n15 -->|"sí"| n16
  n17{"model.retiredAt"}:::decision
  n15 -->|"no"| n17
  n18(["422 PRECONDITION_FAILED El modelo de destino está retirado."]):::error
  n17 -->|"sí"| n18
  n19{"collection.containsPhi && !model.approvedForPhi"}:::decision
  n17 -->|"no"| n19
  n20(["422 PRECONDITION_FAILED El modelo de destino no está aprobado para datos de paciente."]):::error
  n19 -->|"sí"| n20
  n21{"dto.supersedePrevious !== false"}:::decision
  n19 -->|"no"| n21
  n22["Llama a VectorCorpusRepository.findActiveDocumentsByCollection"]:::llamada
  n21 -->|"sí"| n22
  n23[("LEE vector_rag.vector_documents")]:::efecto
  n22 --> n23
  n24["Llama a VectorCorpusRepository.findChunksByDocuments"]:::llamada
  n23 --> n24
  n25[("LEE vector_rag.vector_chunks")]:::efecto
  n24 --> n25
  n26["Llama a VectorCorpusRepository.findEmbeddingsByChunksAndModelForUpdate"]:::llamada
  n25 --> n26
  n27[("LEE vector_rag.vector_embeddings")]:::efecto
  n26 --> n27
  n28["Repite: por cada const embedding de embeddings"]:::bucle
  n27 --> n28
  n29[("ACTUALIZA vector_rag.vector_embeddings")]:::efecto
  n28 -->|"cada elemento"| n29
  n30[("ACTUALIZA vector_rag.vector_collections · ACTUALIZA vector_rag.vector_collections · ACTUALIZA vector_rag.vect…")]:::efecto
  n29 --> n30
  n28 -->|"al terminar"| n30
  n21 -->|"no"| n30
  n31["Llama a VectorCatalogRepository.createJob"]:::llamada
  n30 --> n31
  n32[("CREA vector_rag.embedding_jobs")]:::efecto
  n31 --> n32
  n33["Llama a OutboxService.publishDomainEvent"]:::llamada
  n32 --> n33
  n34["Llama a MessagingTraceService.runInProducerSpan"]:::llamada
  n33 --> n34
  n35["Transacción: startActiveSpan(…)"]:::transaccion
  n34 --> n35
  n36["Intenta"]:::intento
  n35 --> n36
  n37(["↩ (relanza el error capturado)"]):::error
  n36 -->|"si falla"| n37
  n38["Llama a OutboxService.persistDomainEvent"]:::llamada
  n36 --> n38
  n39["Llama a OutboxRepository.findOutboxByIdempotencyKey"]:::llamada
  n38 --> n39
  n40[("LEE messaging.outbox_messages")]:::efecto
  n39 --> n40
  n41["Llama a OutboxRepository.createDomainEvent"]:::llamada
  n40 --> n41
  n42[("CREA messaging.domain_events")]:::efecto
  n41 --> n42
  n43["Llama a OutboxRepository.createOutboxMessage"]:::llamada
  n42 --> n43
  n44[("CREA messaging.outbox_messages")]:::efecto
  n43 --> n44
  n45>"Evento CollectionReEmbedRequested"]:::evento
  n44 --> n45
  n46(("201 Responde con éxito")):::ok
  n45 --> n46
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 5. POST /vector-rag/collections/{id}/reconciliation

Reconciliar el manifiesto canónico contra el vectorial

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Colección no encontrada. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a VectorMaintenanceService.reconcileCollection"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a VectorCatalogRepository.findCollectionById"]:::llamada
  n4 --> n5
  n6[("LEE vector_rag.vector_collections")]:::efecto
  n5 --> n6
  n7{"!collection"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Colección no encontrada."]):::error
  n7 -->|"sí"| n8
  n9["Llama a VectorCorpusRepository.findActiveDocumentsByCollection"]:::llamada
  n7 -->|"no"| n9
  n10[("LEE vector_rag.vector_documents")]:::efecto
  n9 --> n10
  n11{"dto.autoRepair !== false && drift › 0"}:::decision
  n10 --> n11
  n12{"missing.length › 0 || mismatched.length › 0"}:::decision
  n11 -->|"sí"| n12
  n13["Llama a VectorCatalogRepository.createJob"]:::llamada
  n12 -->|"sí"| n13
  n14[("CREA vector_rag.embedding_jobs")]:::efecto
  n13 --> n14
  n15{"orphans.length › 0"}:::decision
  n14 --> n15
  n12 -->|"no"| n15
  n16["Llama a VectorCorpusRepository.createDeletionJob"]:::llamada
  n15 -->|"sí"| n16
  n17[("CREA vector_rag.vector_deletion_jobs")]:::efecto
  n16 --> n17
  n18["Llama a VectorCorpusRepository.createReconciliationRun"]:::llamada
  n17 --> n18
  n15 -->|"no"| n18
  n11 -->|"no"| n18
  n19[("CREA vector_rag.vector_reconciliation_runs")]:::efecto
  n18 --> n19
  n20["Llama a OutboxService.publishDomainEvent"]:::llamada
  n19 --> n20
  n21["Llama a MessagingTraceService.runInProducerSpan"]:::llamada
  n20 --> n21
  n22["Transacción: startActiveSpan(…)"]:::transaccion
  n21 --> n22
  n23["Intenta"]:::intento
  n22 --> n23
  n24(["↩ (relanza el error capturado)"]):::error
  n23 -->|"si falla"| n24
  n25["Llama a OutboxService.persistDomainEvent"]:::llamada
  n23 --> n25
  n26["Llama a OutboxRepository.findOutboxByIdempotencyKey"]:::llamada
  n25 --> n26
  n27[("LEE messaging.outbox_messages")]:::efecto
  n26 --> n27
  n28["Llama a OutboxRepository.createDomainEvent"]:::llamada
  n27 --> n28
  n29[("CREA messaging.domain_events")]:::efecto
  n28 --> n29
  n30["Llama a OutboxRepository.createOutboxMessage"]:::llamada
  n29 --> n30
  n31[("CREA messaging.outbox_messages")]:::efecto
  n30 --> n31
  n32>"Evento VectorReconciliationCompleted"]:::evento
  n31 --> n32
  n33{"drift › 0"}:::decision
  n32 --> n33
  n34["Llama a OutboxService.publishDomainEvent"]:::llamada
  n33 -->|"sí"| n34
  n35["Llama a MessagingTraceService.runInProducerSpan"]:::llamada
  n34 --> n35
  n36["Transacción: startActiveSpan(…)"]:::transaccion
  n35 --> n36
  n37["Intenta"]:::intento
  n36 --> n37
  n38(["↩ (relanza el error capturado)"]):::error
  n37 -->|"si falla"| n38
  n39["Llama a OutboxService.persistDomainEvent"]:::llamada
  n37 --> n39
  n40["Llama a OutboxRepository.findOutboxByIdempotencyKey"]:::llamada
  n39 --> n40
  n41[("LEE messaging.outbox_messages")]:::efecto
  n40 --> n41
  n42["Llama a OutboxRepository.createDomainEvent"]:::llamada
  n41 --> n42
  n43[("CREA messaging.domain_events")]:::efecto
  n42 --> n43
  n44["Llama a OutboxRepository.createOutboxMessage"]:::llamada
  n43 --> n44
  n45[("CREA messaging.outbox_messages")]:::efecto
  n44 --> n45
  n46>"Evento DriftDetected"]:::evento
  n45 --> n46
  n47(("201 Responde con éxito")):::ok
  n46 --> n47
  n33 -->|"no"| n47
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 6. POST /vector-rag/deletion-jobs

Propagar el borrado de la fuente a los embeddings

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Hay que declarar qué se borra: un documento fuente o un paciente. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a VectorMaintenanceService.propagateDeletion"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5{"!dto.sourceDocumentId && !dto.patientProfileId"}:::decision
  n4 --> n5
  n6(["422 PRECONDITION_FAILED Hay que declarar qué se borra: un documento fuente o un paciente."]):::error
  n5 -->|"sí"| n6
  n7["Llama a VectorCorpusRepository.createDeletionJob"]:::llamada
  n5 -->|"no"| n7
  n8[("CREA vector_rag.vector_deletion_jobs")]:::efecto
  n7 --> n8
  n9["Llama a VectorCorpusRepository.findDocumentsForDeletion"]:::llamada
  n8 --> n9
  n10[("LEE vector_rag.vector_documents")]:::efecto
  n9 --> n10
  n11["Llama a VectorCorpusRepository.findChunksByDocuments"]:::llamada
  n10 --> n11
  n12[("LEE vector_rag.vector_chunks")]:::efecto
  n11 --> n12
  n13["Llama a VectorCorpusRepository.deleteEmbeddingsByChunks"]:::llamada
  n12 --> n13
  n14[("BORRA vector_rag.vector_embeddings")]:::efecto
  n13 --> n14
  n15["Llama a VectorCorpusRepository.deleteChunks"]:::llamada
  n14 --> n15
  n16[("BORRA vector_rag.vector_chunks")]:::efecto
  n15 --> n16
  n17["Llama a VectorCorpusRepository.deleteDocuments"]:::llamada
  n16 --> n17
  n18[("BORRA vector_rag.vector_documents")]:::efecto
  n17 --> n18
  n19{"verified"}:::decision
  n18 --> n19
  n20[("ACTUALIZA vector_rag.vector_deletion_jobs · ACTUALIZA vector_rag.vector_deletion_jobs")]:::efecto
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
  n33>"Evento VectorEmbeddingsPurged"]:::evento
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

#### 7. POST /vector-rag/embedding-jobs/{id}/run

Ejecutar un lote del job de embedding

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Job de embedding no encontrado.; ResourceNotFoundException: Colección no encontrada.; ResourceNotFoundException: Versión de modelo no encontrada. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El job ya no está en cola ni en ejecución.; PreconditionFailedException: El modelo de la colección está retirado; el job no puede seguir.; PreconditionFailedException: La colección no admite datos de paciente y el documento los declara. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a EmbeddingPipelineService.runEmbeddingJob"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a VectorCatalogRepository.findJobForUpdate"]:::llamada
  n4 --> n5
  n6[("LEE vector_rag.embedding_jobs")]:::efecto
  n5 --> n6
  n7{"!job"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Job de embedding no encontrado."]):::error
  n7 -->|"sí"| n8
  n9{"!(ACTIVE_JOB_STATUSES as readonly string[]).includes(job.status)"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED El job ya no está en cola ni en ejecución."]):::error
  n9 -->|"sí"| n10
  n11["Llama a VectorCatalogRepository.findCollectionById"]:::llamada
  n9 -->|"no"| n11
  n12[("LEE vector_rag.vector_collections")]:::efecto
  n11 --> n12
  n13{"!collection"}:::decision
  n12 --> n13
  n14(["404 NOT_FOUND Colección no encontrada."]):::error
  n13 -->|"sí"| n14
  n15["Llama a VectorCatalogRepository.findModelVersionById"]:::llamada
  n13 -->|"no"| n15
  n16[("LEE vector_rag.embedding_model_versions")]:::efecto
  n15 --> n16
  n17{"!model"}:::decision
  n16 --> n17
  n18(["404 NOT_FOUND Versión de modelo no encontrada."]):::error
  n17 -->|"sí"| n18
  n19{"model.retiredAt"}:::decision
  n17 -->|"no"| n19
  n20(["422 PRECONDITION_FAILED El modelo de la colección está retirado; el job no puede seguir."]):::error
  n19 -->|"sí"| n20
  n21[("ACTUALIZA vector_rag.embedding_jobs")]:::efecto
  n19 -->|"no"| n21
  n22{"dto.failed === true"}:::decision
  n21 --> n22
  n23[("ACTUALIZA vector_rag.embedding_jobs · ACTUALIZA vector_rag.embedding_jobs")]:::efecto
  n22 -->|"sí"| n23
  n24["Repite: por cada const input de dto.documents ?? []"]:::bucle
  n23 --> n24
  n22 -->|"no"| n24
  n25{"input.containsPhi === true && !collection.containsPhi"}:::decision
  n24 -->|"cada elemento"| n25
  n26(["422 PRECONDITION_FAILED La colección no admite datos de paciente y el documento los declara."]):::error
  n25 -->|"sí"| n26
  n27["Llama a VectorCorpusRepository.findDocument"]:::llamada
  n25 -->|"no"| n27
  n28[("LEE vector_rag.vector_documents")]:::efecto
  n27 --> n28
  n29{"!document"}:::decision
  n28 --> n29
  n30["Llama a VectorCorpusRepository.createDocument"]:::llamada
  n29 -->|"sí"| n30
  n31[("CREA vector_rag.vector_documents")]:::efecto
  n30 --> n31
  n32["Repite: por cada const chunkInput de input.chunks"]:::bucle
  n31 --> n32
  n29 -->|"no"| n32
  n33["Llama a VectorCorpusRepository.findChunkByHash"]:::llamada
  n32 -->|"cada elemento"| n33
  n34[("LEE vector_rag.vector_chunks")]:::efecto
  n33 --> n34
  n35{"!chunk"}:::decision
  n34 --> n35
  n36["Llama a VectorCorpusRepository.createChunk"]:::llamada
  n35 -->|"sí"| n36
  n37[("CREA vector_rag.vector_chunks")]:::efecto
  n36 --> n37
  n38["Llama a VectorCorpusRepository.findEmbedding"]:::llamada
  n37 --> n38
  n35 -->|"no"| n38
  n39[("LEE vector_rag.vector_embeddings")]:::efecto
  n38 --> n39
  n40["Llama a VectorCorpusRepository.createEmbedding"]:::llamada
  n39 --> n40
  n41[("CREA vector_rag.vector_embeddings")]:::efecto
  n40 --> n41
  n42[("ACTUALIZA vector_rag.embedding_jobs")]:::efecto
  n41 --> n42
  n32 -->|"al terminar"| n42
  n24 -->|"al terminar"| n42
  n43{"dto.finalBatch === true"}:::decision
  n42 --> n43
  n44[("ACTUALIZA vector_rag.embedding_jobs · ACTUALIZA vector_rag.embedding_jobs")]:::efecto
  n43 -->|"sí"| n44
  n45["Llama a OutboxService.publishDomainEvent"]:::llamada
  n44 --> n45
  n46["Llama a MessagingTraceService.runInProducerSpan"]:::llamada
  n45 --> n46
  n47["Transacción: startActiveSpan(…)"]:::transaccion
  n46 --> n47
  n48["Intenta"]:::intento
  n47 --> n48
  n49(["↩ (relanza el error capturado)"]):::error
  n48 -->|"si falla"| n49
  n50["Llama a OutboxService.persistDomainEvent"]:::llamada
  n48 --> n50
  n51["Llama a OutboxRepository.findOutboxByIdempotencyKey"]:::llamada
  n50 --> n51
  n52[("LEE messaging.outbox_messages")]:::efecto
  n51 --> n52
  n53["Llama a OutboxRepository.createDomainEvent"]:::llamada
  n52 --> n53
  n54[("CREA messaging.domain_events")]:::efecto
  n53 --> n54
  n55["Llama a OutboxRepository.createOutboxMessage"]:::llamada
  n54 --> n55
  n56[("CREA messaging.outbox_messages")]:::efecto
  n55 --> n56
  n57>"Evento EmbeddingJobCompleted"]:::evento
  n56 --> n57
  n58(("200 Responde con éxito")):::ok
  n57 --> n58
  n43 -->|"no"| n58
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 8. POST /vector-rag/embedding-model-versions

Registrar y aprobar una versión de modelo de embedding

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Esa versión del modelo ya está registrada. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a VectorGovernanceService.registerModelVersion"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a VectorCatalogRepository.findModelVersion"]:::llamada
  n4 --> n5
  n6[("LEE vector_rag.embedding_model_versions")]:::efecto
  n5 --> n6
  n7{"existing"}:::decision
  n6 --> n7
  n8(["409 CONFLICT Esa versión del modelo ya está registrada."]):::error
  n7 -->|"sí"| n8
  n9["Llama a VectorCatalogRepository.createModelVersion"]:::llamada
  n7 -->|"no"| n9
  n10[("CREA vector_rag.embedding_model_versions")]:::efecto
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
  n23>"Evento EmbeddingModelVersionApproved"]:::evento
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

#### 9. POST /vector-rag/embedding-model-versions/{id}/retire

Retirar una versión de modelo

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Versión de modelo no encontrada. |
| 409 | `CONFLICT` | ConflictException: El modelo ya está retirado. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Hay jobs de embedding vivos que dependen del modelo. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a VectorGovernanceService.retireModelVersion"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a VectorCatalogRepository.findModelVersionForUpdate"]:::llamada
  n4 --> n5
  n6[("LEE vector_rag.embedding_model_versions")]:::efecto
  n5 --> n6
  n7{"!model"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Versión de modelo no encontrada."]):::error
  n7 -->|"sí"| n8
  n9{"model.retiredAt"}:::decision
  n7 -->|"no"| n9
  n10(["409 CONFLICT El modelo ya está retirado."]):::error
  n9 -->|"sí"| n10
  n11["Llama a VectorCatalogRepository.findCollectionsByModel"]:::llamada
  n9 -->|"no"| n11
  n12[("LEE vector_rag.vector_collections")]:::efecto
  n11 --> n12
  n13["Repite: por cada const collection de collections"]:::bucle
  n12 --> n13
  n14["Llama a VectorCatalogRepository.findActiveJobsByCollection"]:::llamada
  n13 -->|"cada elemento"| n14
  n15[("LEE vector_rag.embedding_jobs")]:::efecto
  n14 --> n15
  n16{"activeJobs.length › 0"}:::decision
  n15 --> n16
  n17(["422 PRECONDITION_FAILED Hay jobs de embedding vivos que dependen del modelo."]):::error
  n16 -->|"sí"| n17
  n18[("ACTUALIZA vector_rag.embedding_model_versions")]:::efecto
  n16 -->|"no"| n18
  n13 -->|"al terminar"| n18
  n19["Llama a OutboxService.publishDomainEvent"]:::llamada
  n18 --> n19
  n20["Llama a MessagingTraceService.runInProducerSpan"]:::llamada
  n19 --> n20
  n21["Transacción: startActiveSpan(…)"]:::transaccion
  n20 --> n21
  n22["Intenta"]:::intento
  n21 --> n22
  n23(["↩ (relanza el error capturado)"]):::error
  n22 -->|"si falla"| n23
  n24["Llama a OutboxService.persistDomainEvent"]:::llamada
  n22 --> n24
  n25["Llama a OutboxRepository.findOutboxByIdempotencyKey"]:::llamada
  n24 --> n25
  n26[("LEE messaging.outbox_messages")]:::efecto
  n25 --> n26
  n27["Llama a OutboxRepository.createDomainEvent"]:::llamada
  n26 --> n27
  n28[("CREA messaging.domain_events")]:::efecto
  n27 --> n28
  n29["Llama a OutboxRepository.createOutboxMessage"]:::llamada
  n28 --> n29
  n30[("CREA messaging.outbox_messages")]:::efecto
  n29 --> n30
  n31>"Evento EmbeddingModelRetired"]:::evento
  n30 --> n31
  n32(("200 Responde con éxito")):::ok
  n31 --> n32
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 10. POST /vector-rag/rag-access-policies

Definir una política de acceso RAG

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe una política con ese código para el tenant. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Exigir consentimiento obliga a exigir también el ámbito de paciente. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a VectorGovernanceService.defineRagPolicy"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a VectorCatalogRepository.findPolicyByCodeForUpdate"]:::llamada
  n4 --> n5
  n6[("LEE vector_rag.rag_access_policies")]:::efecto
  n5 --> n6
  n7{"duplicate"}:::decision
  n6 --> n7
  n8(["409 CONFLICT Ya existe una política con ese código para el tenant."]):::error
  n7 -->|"sí"| n8
  n9{"dto.consentRequired === true && dto.patientScopeRequired !== true"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED Exigir consentimiento obliga a exigir también el ámbito de paciente."]):::error
  n9 -->|"sí"| n10
  n11["Llama a VectorCatalogRepository.createPolicy"]:::llamada
  n9 -->|"no"| n11
  n12[("CREA vector_rag.rag_access_policies")]:::efecto
  n11 --> n12
  n13(("201 Responde con éxito")):::ok
  n12 --> n13
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 11. PUT /vector-rag/rag-access-policies/{id}/publish

Publicar la política y reenlazar colecciones

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Política de acceso RAG no encontrada.; ResourceNotFoundException: Colección no encontrada. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La colección pertenece a otro tenant que la política. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a VectorGovernanceService.publishRagPolicy"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a VectorCatalogRepository.findPolicyById"]:::llamada
  n4 --> n5
  n6[("LEE vector_rag.rag_access_policies")]:::efecto
  n5 --> n6
  n7{"!policy"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Política de acceso RAG no encontrada."]):::error
  n7 -->|"sí"| n8
  n9[("ACTUALIZA vector_rag.rag_access_policies")]:::efecto
  n7 -->|"no"| n9
  n10["Repite: por cada const collectionId de dto.rebindCollectionIds ?? []"]:::bucle
  n9 --> n10
  n11["Llama a VectorCatalogRepository.findCollectionForUpdate"]:::llamada
  n10 -->|"cada elemento"| n11
  n12[("LEE vector_rag.vector_collections")]:::efecto
  n11 --> n12
  n13{"!collection"}:::decision
  n12 --> n13
  n14(["404 NOT_FOUND Colección no encontrada."]):::error
  n13 -->|"sí"| n14
  n15{"collection.tenantId !== policy.tenantId"}:::decision
  n13 -->|"no"| n15
  n16(["422 PRECONDITION_FAILED La colección pertenece a otro tenant que la política."]):::error
  n15 -->|"sí"| n16
  n17[("ACTUALIZA vector_rag.vector_collections")]:::efecto
  n15 -->|"no"| n17
  n18["Llama a OutboxService.publishDomainEvent"]:::llamada
  n17 --> n18
  n10 -->|"al terminar"| n18
  n19["Llama a MessagingTraceService.runInProducerSpan"]:::llamada
  n18 --> n19
  n20["Transacción: startActiveSpan(…)"]:::transaccion
  n19 --> n20
  n21["Intenta"]:::intento
  n20 --> n21
  n22(["↩ (relanza el error capturado)"]):::error
  n21 -->|"si falla"| n22
  n23["Llama a OutboxService.persistDomainEvent"]:::llamada
  n21 --> n23
  n24["Llama a OutboxRepository.findOutboxByIdempotencyKey"]:::llamada
  n23 --> n24
  n25[("LEE messaging.outbox_messages")]:::efecto
  n24 --> n25
  n26["Llama a OutboxRepository.createDomainEvent"]:::llamada
  n25 --> n26
  n27[("CREA messaging.domain_events")]:::efecto
  n26 --> n27
  n28["Llama a OutboxRepository.createOutboxMessage"]:::llamada
  n27 --> n28
  n29[("CREA messaging.outbox_messages")]:::efecto
  n28 --> n29
  n30>"Evento RagAccessPolicyPublished"]:::evento
  n29 --> n30
  n31(("200 Responde con éxito")):::ok
  n30 --> n31
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 12. POST /vector-rag/retrieval-sessions

Abrir una sesión de retrieval gobernada por consentimiento

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Colección no encontrada.; ResourceNotFoundException: Política de acceso RAG no encontrada. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La colección está deprecada.; PreconditionFailedException: La colección no tiene política de acceso RAG; no se puede consultar.; PreconditionFailedException: La política de acceso RAG no está publicada.; PreconditionFailedException: La política no admite ese tipo de principal.; PreconditionFailedException: La política no admite ese propósito de uso.; PreconditionFailedException: La política exige declarar el paciente sobre el que se consulta.; PreconditionFailedException: La política exige una directiva de consentimiento vigente. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a RetrievalService.openSession"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a VectorCatalogRepository.findCollectionById"]:::llamada
  n4 --> n5
  n6[("LEE vector_rag.vector_collections")]:::efecto
  n5 --> n6
  n7{"!collection"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Colección no encontrada."]):::error
  n7 -->|"sí"| n8
  n9{"collection.lifecycleState === 'deprecated'"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED La colección está deprecada."]):::error
  n9 -->|"sí"| n10
  n11["Llama a RetrievalService.requirePublishedPolicy"]:::llamada
  n9 -->|"no"| n11
  n12{"!accessPolicyId"}:::decision
  n11 --> n12
  n13(["422 PRECONDITION_FAILED La colección no tiene política de acceso RAG; no se puede consultar."]):::error
  n12 -->|"sí"| n13
  n14["Llama a VectorCatalogRepository.findPolicyById"]:::llamada
  n12 -->|"no"| n14
  n15[("LEE vector_rag.rag_access_policies")]:::efecto
  n14 --> n15
  n16{"!policy"}:::decision
  n15 --> n16
  n17(["404 NOT_FOUND Política de acceso RAG no encontrada."]):::error
  n16 -->|"sí"| n17
  n18{"policy.state !== 'published'"}:::decision
  n16 -->|"no"| n18
  n19(["422 PRECONDITION_FAILED La política de acceso RAG no está publicada."]):::error
  n18 -->|"sí"| n19
  n20{"!policy.allowedPrincipalTypes.includes(dto.principalType)"}:::decision
  n18 -->|"no"| n20
  n21(["422 PRECONDITION_FAILED La política no admite ese tipo de principal."]):::error
  n20 -->|"sí"| n21
  n22{"!policy.allowedPurposeCodes.includes(dto.purposeOfUseCode)"}:::decision
  n20 -->|"no"| n22
  n23(["422 PRECONDITION_FAILED La política no admite ese propósito de uso."]):::error
  n22 -->|"sí"| n23
  n24{"policy.patientScopeRequired && !dto.patientProfileId"}:::decision
  n22 -->|"no"| n24
  n25(["422 PRECONDITION_FAILED La política exige declarar el paciente sobre el que se consulta."]):::error
  n24 -->|"sí"| n25
  n26{"policy.consentRequired && !dto.consentDirectiveId"}:::decision
  n24 -->|"no"| n26
  n27(["422 PRECONDITION_FAILED La política exige una directiva de consentimiento vigente."]):::error
  n26 -->|"sí"| n27
  n28["Llama a RetrievalRepository.findOpenSessionByHash"]:::llamada
  n26 -->|"no"| n28
  n29[("LEE vector_rag.retrieval_sessions")]:::efecto
  n28 --> n29
  n30["Llama a RetrievalRepository.createSession"]:::llamada
  n29 --> n30
  n31[("CREA vector_rag.retrieval_sessions")]:::efecto
  n30 --> n31
  n32["Llama a OutboxService.publishDomainEvent"]:::llamada
  n31 --> n32
  n33["Llama a MessagingTraceService.runInProducerSpan"]:::llamada
  n32 --> n33
  n34["Transacción: startActiveSpan(…)"]:::transaccion
  n33 --> n34
  n35["Intenta"]:::intento
  n34 --> n35
  n36(["↩ (relanza el error capturado)"]):::error
  n35 -->|"si falla"| n36
  n37["Llama a OutboxService.persistDomainEvent"]:::llamada
  n35 --> n37
  n38["Llama a OutboxRepository.findOutboxByIdempotencyKey"]:::llamada
  n37 --> n38
  n39[("LEE messaging.outbox_messages")]:::efecto
  n38 --> n39
  n40["Llama a OutboxRepository.createDomainEvent"]:::llamada
  n39 --> n40
  n41[("CREA messaging.domain_events")]:::efecto
  n40 --> n41
  n42["Llama a OutboxRepository.createOutboxMessage"]:::llamada
  n41 --> n42
  n43[("CREA messaging.outbox_messages")]:::efecto
  n42 --> n43
  n44>"Evento RetrievalSessionOpened"]:::evento
  n43 --> n44
  n45(("201 Responde con éxito")):::ok
  n44 --> n45
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 13. POST /vector-rag/retrieval-sessions/{id}/evidence

Materializar la evidencia citable

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Sesión de retrieval no encontrada. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La sesión tiene que estar ranqueada para materializar evidencia.; PreconditionFailedException: La sesión no tiene ningún candidato seleccionado y autorizado que citar.; PreconditionFailedException: Se intenta citar un chunk que no quedó seleccionado y autorizado. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a RetrievalService.materializeEvidence"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a RetrievalRepository.findSessionForUpdate"]:::llamada
  n4 --> n5
  n6[("LEE vector_rag.retrieval_sessions")]:::efecto
  n5 --> n6
  n7{"!session"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Sesión de retrieval no encontrada."]):::error
  n7 -->|"sí"| n8
  n9{"session.status !== 'ranked'"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED La sesión tiene que estar ranqueada para materializar evidencia."]):::error
  n9 -->|"sí"| n10
  n11["Llama a RetrievalRepository.findSelectedCandidates"]:::llamada
  n9 -->|"no"| n11
  n12[("LEE vector_rag.retrieval_candidates")]:::efecto
  n11 --> n12
  n13{"selectable.size === 0"}:::decision
  n12 --> n13
  n14(["422 PRECONDITION_FAILED La sesión no tiene ningún candidato seleccionado y autorizado que citar."]):::error
  n13 -->|"sí"| n14
  n15["Repite: por cada const citation de dto.citations"]:::bucle
  n13 -->|"no"| n15
  n16{"!selectable.has(citation.vectorChunkId)"}:::decision
  n15 -->|"cada elemento"| n16
  n17(["422 PRECONDITION_FAILED Se intenta citar un chunk que no quedó seleccionado y autorizado."]):::error
  n16 -->|"sí"| n17
  n18["Llama a VectorCorpusRepository.findChunkById"]:::llamada
  n16 -->|"no"| n18
  n19[("LEE vector_rag.vector_chunks")]:::efecto
  n18 --> n19
  n20["Llama a VectorCorpusRepository.findDocumentById"]:::llamada
  n19 --> n20
  n21[("LEE vector_rag.vector_documents")]:::efecto
  n20 --> n21
  n22["Llama a RetrievalRepository.createEvidence"]:::llamada
  n21 --> n22
  n23[("CREA vector_rag.retrieval_evidence")]:::efecto
  n22 --> n23
  n24[("ACTUALIZA vector_rag.retrieval_sessions · ACTUALIZA vector_rag.retrieval_sessions")]:::efecto
  n23 --> n24
  n15 -->|"al terminar"| n24
  n25["Llama a OutboxService.publishDomainEvent"]:::llamada
  n24 --> n25
  n26["Llama a MessagingTraceService.runInProducerSpan"]:::llamada
  n25 --> n26
  n27["Transacción: startActiveSpan(…)"]:::transaccion
  n26 --> n27
  n28["Intenta"]:::intento
  n27 --> n28
  n29(["↩ (relanza el error capturado)"]):::error
  n28 -->|"si falla"| n29
  n30["Llama a OutboxService.persistDomainEvent"]:::llamada
  n28 --> n30
  n31["Llama a OutboxRepository.findOutboxByIdempotencyKey"]:::llamada
  n30 --> n31
  n32[("LEE messaging.outbox_messages")]:::efecto
  n31 --> n32
  n33["Llama a OutboxRepository.createDomainEvent"]:::llamada
  n32 --> n33
  n34[("CREA messaging.domain_events")]:::efecto
  n33 --> n34
  n35["Llama a OutboxRepository.createOutboxMessage"]:::llamada
  n34 --> n35
  n36[("CREA messaging.outbox_messages")]:::efecto
  n35 --> n36
  n37>"Evento RetrievalEvidenceMaterialized"]:::evento
  n36 --> n37
  n38(("201 Responde con éxito")):::ok
  n37 --> n38
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 14. POST /vector-rag/retrieval-sessions/{id}/feedback

Capturar feedback de la sesión

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Sesión de retrieval no encontrada. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Sólo se puede dar feedback de una sesión completada. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a RetrievalService.captureFeedback"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a RetrievalRepository.findSessionForUpdate"]:::llamada
  n4 --> n5
  n6[("LEE vector_rag.retrieval_sessions")]:::efecto
  n5 --> n6
  n7{"!session"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Sesión de retrieval no encontrada."]):::error
  n7 -->|"sí"| n8
  n9{"session.status !== 'completed' && session.status !== 'flagged'"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED Sólo se puede dar feedback de una sesión completada."]):::error
  n9 -->|"sí"| n10
  n11["Llama a RetrievalRepository.createFeedback"]:::llamada
  n9 -->|"no"| n11
  n12[("CREA vector_rag.retrieval_feedback_events")]:::efecto
  n11 --> n12
  n13{"flagged"}:::decision
  n12 --> n13
  n14[("ACTUALIZA vector_rag.retrieval_sessions")]:::efecto
  n13 -->|"sí"| n14
  n15["Llama a OutboxService.publishDomainEvent"]:::llamada
  n14 --> n15
  n13 -->|"no"| n15
  n16["Llama a MessagingTraceService.runInProducerSpan"]:::llamada
  n15 --> n16
  n17["Transacción: startActiveSpan(…)"]:::transaccion
  n16 --> n17
  n18["Intenta"]:::intento
  n17 --> n18
  n19(["↩ (relanza el error capturado)"]):::error
  n18 -->|"si falla"| n19
  n20["Llama a OutboxService.persistDomainEvent"]:::llamada
  n18 --> n20
  n21["Llama a OutboxRepository.findOutboxByIdempotencyKey"]:::llamada
  n20 --> n21
  n22[("LEE messaging.outbox_messages")]:::efecto
  n21 --> n22
  n23["Llama a OutboxRepository.createDomainEvent"]:::llamada
  n22 --> n23
  n24[("CREA messaging.domain_events")]:::efecto
  n23 --> n24
  n25["Llama a OutboxRepository.createOutboxMessage"]:::llamada
  n24 --> n25
  n26[("CREA messaging.outbox_messages")]:::efecto
  n25 --> n26
  n27>"Evento RetrievalFeedbackCaptured"]:::evento
  n26 --> n27
  n28{"flagged"}:::decision
  n27 --> n28
  n29["Llama a OutboxService.publishDomainEvent"]:::llamada
  n28 -->|"sí"| n29
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
  n41>"Evento RetrievalSafetyIssueRaised"]:::evento
  n40 --> n41
  n42(("201 Responde con éxito")):::ok
  n41 --> n42
  n28 -->|"no"| n42
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 15. POST /vector-rag/retrieval-sessions/{id}/search

Ranquear los candidatos y filtrarlos por consentimiento y etiquetas

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Sesión de retrieval no encontrada.; ResourceNotFoundException: Chunk candidato no encontrado.; ResourceNotFoundException: Documento del chunk no encontrado.; ResourceNotFoundException: Política de acceso RAG no encontrada. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La sesión ya no está abierta.; PreconditionFailedException: La colección no tiene política de acceso RAG; no se puede consultar.; PreconditionFailedException: La política de acceso RAG no está publicada. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a RetrievalService.rankCandidates"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a RetrievalRepository.findSessionForUpdate"]:::llamada
  n4 --> n5
  n6[("LEE vector_rag.retrieval_sessions")]:::efecto
  n5 --> n6
  n7{"!session"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Sesión de retrieval no encontrada."]):::error
  n7 -->|"sí"| n8
  n9{"session.status !== 'open'"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED La sesión ya no está abierta."]):::error
  n9 -->|"sí"| n10
  n11["Repite: por cada const candidate de ordered.slice(0, MAX_CANDIDATES)"]:::bucle
  n9 -->|"no"| n11
  n12["Llama a VectorCorpusRepository.findChunkById"]:::llamada
  n11 -->|"cada elemento"| n12
  n13[("LEE vector_rag.vector_chunks")]:::efecto
  n12 --> n13
  n14{"!chunk"}:::decision
  n13 --> n14
  n15(["404 NOT_FOUND Chunk candidato no encontrado."]):::error
  n14 -->|"sí"| n15
  n16["Llama a VectorCorpusRepository.findDocumentById"]:::llamada
  n14 -->|"no"| n16
  n17[("LEE vector_rag.vector_documents")]:::efecto
  n16 --> n17
  n18{"!document"}:::decision
  n17 --> n18
  n19(["404 NOT_FOUND Documento del chunk no encontrado."]):::error
  n18 -->|"sí"| n19
  n20["Llama a RetrievalService.requirePublishedPolicy"]:::llamada
  n18 -->|"no"| n20
  n21{"!accessPolicyId"}:::decision
  n20 --> n21
  n22(["422 PRECONDITION_FAILED La colección no tiene política de acceso RAG; no se puede consultar."]):::error
  n21 -->|"sí"| n22
  n23["Llama a VectorCatalogRepository.findPolicyById"]:::llamada
  n21 -->|"no"| n23
  n24[("LEE vector_rag.rag_access_policies")]:::efecto
  n23 --> n24
  n25{"!policy"}:::decision
  n24 --> n25
  n26(["404 NOT_FOUND Política de acceso RAG no encontrada."]):::error
  n25 -->|"sí"| n26
  n27{"policy.state !== 'published'"}:::decision
  n25 -->|"no"| n27
  n28(["422 PRECONDITION_FAILED La política de acceso RAG no está publicada."]):::error
  n27 -->|"sí"| n28
  n29["Llama a VectorCatalogRepository.findCollectionById"]:::llamada
  n27 -->|"no"| n29
  n30[("LEE vector_rag.vector_collections")]:::efecto
  n29 --> n30
  n31["Repite: map(…)"]:::bucle
  n30 --> n31
  n11 -->|"al terminar"| n31
  n32["Llama a RetrievalRepository.createCandidate"]:::llamada
  n31 -->|"cada elemento"| n32
  n33[("CREA vector_rag.retrieval_candidates")]:::efecto
  n32 --> n33
  n34[("ACTUALIZA vector_rag.retrieval_sessions")]:::efecto
  n33 --> n34
  n31 -->|"al terminar"| n34
  n35["Llama a OutboxService.publishDomainEvent"]:::llamada
  n34 --> n35
  n36["Llama a MessagingTraceService.runInProducerSpan"]:::llamada
  n35 --> n36
  n37["Transacción: startActiveSpan(…)"]:::transaccion
  n36 --> n37
  n38["Intenta"]:::intento
  n37 --> n38
  n39(["↩ (relanza el error capturado)"]):::error
  n38 -->|"si falla"| n39
  n40["Llama a OutboxService.persistDomainEvent"]:::llamada
  n38 --> n40
  n41["Llama a OutboxRepository.findOutboxByIdempotencyKey"]:::llamada
  n40 --> n41
  n42[("LEE messaging.outbox_messages")]:::efecto
  n41 --> n42
  n43["Llama a OutboxRepository.createDomainEvent"]:::llamada
  n42 --> n43
  n44[("CREA messaging.domain_events")]:::efecto
  n43 --> n44
  n45["Llama a OutboxRepository.createOutboxMessage"]:::llamada
  n44 --> n45
  n46[("CREA messaging.outbox_messages")]:::efecto
  n45 --> n46
  n47>"Evento RetrievalCandidatesRanked"]:::evento
  n46 --> n47
  n48(("200 Responde con éxito")):::ok
  n47 --> n48
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
| GET /vector-rag/embedding-jobs/pending | 200, 400, 401, 403, 429 | 1 |
