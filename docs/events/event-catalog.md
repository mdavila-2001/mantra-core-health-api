# Catálogo de eventos

> Fase 12. **79 sitios reales** de `publishDomainEvent(...)` en 10 módulos productores
> (`grep -rn "eventType:" src/modules --include="*.ts"`, excluyendo specs). Cada evento se publica
> dentro de la misma transacción que el cambio de negocio que lo origina (ver
> [visión general](overview.md)). No es una lista aspiracional — cada fila referencia el servicio
> real que la emite.

## Convención de nombres — inconsistente, documentado tal cual

La mayoría de eventos usa `PascalCase` (`OrderPlaced`, `WorkflowRunStarted`). Dos módulos usan
`dot.case` en minúsculas (`authz.break_glass.activated`,
`periop.case.confirmation_blocked`). **No hay una convención única impuesta** — se documenta como
hallazgo real, no se normaliza aquí (normalizar nombres de evento en producción es un cambio de
contrato, fuera del alcance de este ejercicio documental).

## Esquema de payload — no tipado por evento

`payloadJson` es `Record<string, unknown>` en el productor y `unknown` en la entidad
(`domain_events.entity.ts`) — **no hay un JSON Schema por tipo de evento validado en código**. El
AsyncAPI (`asyncapi/asyncapi.yaml`) declara el sobre (envelope) real y verificable
(`eventType`, `aggregateType`, `aggregateId`, `payloadJson`, metadatos), y modela `payloadJson`
como `object` genérico — documentar el schema exacto de cada uno de los 79 eventos requeriría
inspeccionar cada call site individualmente.

## Catálogo por módulo productor

### `authz` (1 evento)

| Evento | Servicio productor |
|---|---|
| `authz.break_glass.activated` | `authz-clinical.service.ts` |

### `automation` (15 eventos)

| Evento | Servicio productor |
|---|---|
| `AgentMemoryUpserted` | `agent-catalog.service.ts` |
| `AgentRegistered` | `agent-catalog.service.ts` |
| `AgentStepRecorded` | `automation-execution.service.ts` |
| `AgentToolBound` | `agent-catalog.service.ts` |
| `AgentToolRegistered` | `agent-catalog.service.ts` |
| `AgentVersionPublished` | `agent-catalog.service.ts` |
| `ApprovalDecided` | `automation-execution.service.ts` |
| `ApprovalRequested` | `automation-execution.service.ts` |
| `GuardrailAttached` | `agent-catalog.service.ts` |
| `RecordAutomated` | `record-automation.service.ts` |
| `TriggerRegistered` | `automation-definition.service.ts` |
| `WorkflowDefined` | `automation-definition.service.ts` |
| `WorkflowRunCompleted` | `automation-execution.service.ts` |
| `WorkflowRunStarted` | `automation-execution.service.ts` |

### `clinical` (1 evento)

| Evento | Servicio productor |
|---|---|
| `ServiceRequestPlaced` | `service-requests.service.ts` |

Payload: sólo `serviceRequestId` y `statusConceptId` — ni paciente ni estudio viajan en el outbox
(MCH-027). El aviso al paciente no sale de este evento: se escribe en la misma transacción, bajo un
savepoint, desde `ClinicalNotificationsService.serviceRequestPlaced`.

### `cross_store_consistency` (8 eventos)

| Evento | Servicio productor |
|---|---|
| `CacheInvalidationRequested` | `storage-maintenance.service.ts` |
| `DataArchived` | `storage-maintenance.service.ts` |
| `DataMovementRequested` | `storage-maintenance.service.ts` |
| `DeletionRequestClosed` | `deletion.service.ts` |
| `DeletionRequested` | `deletion.service.ts` |
| `ProjectionDeadLettered` | `projection-delivery.service.ts` |
| `ProjectionDriftDetected` | `reconciliation.service.ts` |
| `ProjectionRepairRequested` | `reconciliation.service.ts` |

### `delegated_access` (1 evento)

| Evento | Servicio productor |
|---|---|
| `profiles.patient_portal_invitation.requested` | `support-patient-registration.service.ts` |

Nombre en `dot.case` y con el prefijo `profiles.` (el paciente es de `profiles`); lo publica
`delegated_access` al registrar un paciente con `POST /me/support-patients` y `inviteToPortal: true`,
dentro de la misma transacción del alta (constante `PATIENT_PORTAL_INVITATION_EVENT`). Versión `1`
(el productor no fija `eventVersion`, rige el valor por defecto). `aggregateType`: `patient_profile`;
`aggregateId`: el perfil del paciente recién creado.

Payload: sólo identificadores (`patientProfileId`, `tenantId`, `requestedByUserId`, la persona de
apoyo que lo pidió). Ni nombre, ni documento, ni teléfono, ni correo, ni token o contraseña viajan en
el outbox. Consumidores: ninguno hoy; nada en el código lo suscribe ni lo lee. El consumidor que
entregue la invitación deberá tomar el destino de la cuenta o del contacto verificado del paciente,
nunca del registro que escribió el mostrador (el paciente nace sin verificar).

### `graph_intelligence` (10 eventos)

| Evento | Servicio productor |
|---|---|
| `GraphAccessScopeChanged` | `graph-traversal.service.ts` |
| `GraphCommunitiesDetected` | `graph-analytics.service.ts` |
| `GraphEdgeExpired` | `graph-projection.service.ts` |
| `GraphEdgeProjected` | `graph-projection.service.ts` |
| `GraphEntityPurged` | `graph-analytics.service.ts` |
| `GraphProjectionRunFinished` | `graph-projection.service.ts` |
| `GraphRiskScoreComputed` | `graph-analytics.service.ts` |
| `GraphRuleHitDetected` | `graph-analytics.service.ts` |
| `GraphRuleHitResolved` | `graph-analytics.service.ts` |

### `insurance` (4 eventos de la protección al paciente)

Carril 16, REQ-16-034. `audit.audit_log` no tiene columnas de motivo ni de importes, así que lo que
la bitácora `@Audited` no puede guardar viaja en estos eventos. `aggregateType`:
`insurance.insurance_claims`; `aggregateId`: el reclamo.

| Evento | Servicio productor |
|---|---|
| `InsuranceClaimPatientChargeObjected` | `patient-charge-objection.service.ts` |
| `InsuranceClaimPatientInvoiceIssued` | `claim-patient-invoice.service.ts` |
| `InsuranceClaimPatientInvoiceRejected` | `claim-patient-invoice.service.ts` |
| `InsuranceClaimPatientObjectionRejected` | `patient-charge-objection.service.ts` |

Payload: sólo identificadores e importes (`claimId`, `claimLineId`, `invoiceId`, `patientProfileId`,
`practiceId`, motivo tipificado, importes decimales como cadena). Nunca texto libre ni datos
clínicos; la objeción del paciente viaja con un motivo cerrado, sin comentario. Los eventos de
rechazo se publican en su propia transacción: la del intento rechazado no se confirma.

> Este catálogo es previo al módulo de seguros y todavía no lista `InsuranceClaimDecided`
> (`insurer-received-claims.service.ts`); se documenta como omisión, no se corrige aquí.

### `lakehouse` (12 eventos)

| Evento | Servicio productor |
|---|---|
| `CohortDefined` | `research-release.service.ts` |
| `DataProductVersionPublished` | `lakehouse-catalog.service.ts` |
| `DatasetReleaseMaterialized` | `research-release.service.ts` |
| `DatasetReleaseRequested` | `research-release.service.ts` |
| `DatasetReleaseRevoked` | `research-release.service.ts` |
| `HealthBatchDeidentified` | `transformation.service.ts` |
| `LakehouseCatalogRegistered` | `lakehouse-catalog.service.ts` |
| `LakehouseDatasetRegistered` | `lakehouse-catalog.service.ts` |
| `LakeZoneDefined` | `lakehouse-catalog.service.ts` |
| `LineageRecorded` | `transformation.service.ts` |
| `QualityRunEvaluated` | `transformation.service.ts` |
| `TransformationRunCompleted` | `transformation.service.ts` |

### `messaging` (1 evento)

| Evento | Servicio productor |
|---|---|
| `OrderPlaced` | `outbox.service.ts` |

### `procedures_perioperative` (2 eventos)

| Evento | Servicio productor |
|---|---|
| `periop.case.confirmation_blocked` | `periop-cases.service.ts` |
| `periop.case.reacceptance_required` | `periop-reacceptance.service.ts` |

### `time_series` (9 eventos)

| Evento | Servicio productor |
|---|---|
| `AdsEventsIngested` | `series-ingest.service.ts` |
| `ChunksCompressed` | `timescale-admin.service.ts` |
| `ChunksDropped` | `timescale-admin.service.ts` |
| `DeviceRawReadingReceived` | `series-ingest.service.ts` |
| `GovernedBackfillApplied` | `series-ingest.service.ts` |
| `LocationPingsIngested` | `series-ingest.service.ts` |
| `RuntimeMetricsIngested` | `series-ingest.service.ts` |
| `SeriesBatchIngested` | `series-ingest.service.ts` |
| `VitalNormalizedAndPromoted` | `vital-normalization.service.ts` |

### `vector_rag` (16 eventos)

| Evento | Servicio productor |
|---|---|
| `CollectionReEmbedRequested` | `embedding-pipeline.service.ts` |
| `DriftDetected` | `vector-maintenance.service.ts` |
| `EmbeddingJobCompleted` | `embedding-pipeline.service.ts` |
| `EmbeddingJobQueued` | `embedding-pipeline.service.ts` |
| `EmbeddingModelRetired` | `vector-governance.service.ts` |
| `EmbeddingModelVersionApproved` | `vector-governance.service.ts` |
| `RagAccessPolicyPublished` | `vector-governance.service.ts` |
| `RetrievalCandidatesRanked` | `retrieval.service.ts` |
| `RetrievalEvidenceMaterialized` | `retrieval.service.ts` |
| `RetrievalFeedbackCaptured` | `retrieval.service.ts` |
| `RetrievalSafetyIssueRaised` | `retrieval.service.ts` |
| `RetrievalSessionOpened` | `retrieval.service.ts` |
| `VectorCollectionProvisioned` | `vector-governance.service.ts` |
| `VectorCollectionSealed` | `vector-governance.service.ts` |
| `VectorEmbeddingsPurged` | `vector-maintenance.service.ts` |
| `VectorReconciliationCompleted` | `vector-maintenance.service.ts` |

### `workflow` (6 eventos)

| Evento | Servicio productor |
|---|---|
| `StateMachineDefined` | `state-machine-definition.service.ts` |
| `StateMachineVersionPublished` | `state-machine-definition.service.ts` |
| `TransitionCompensated` | `transition-execution.service.ts` |
| `WorkflowInstanceStarted` | `workflow-instances.service.ts` |
| `WorkflowTaskCompleted` | `workflow-instances.service.ts` |
| `WorkflowTimedOut` | `workflow-instances.service.ts` |

## Consumidores

El mecanismo de suscripción (`event_subscriptions`, ver [visión general](overview.md)) filtra por
`aggregateType`/`filterJson` y determina el modo de entrega (directo vs. cola). **Qué suscriptor
real consume cada evento es configuración en `event_subscriptions`, no código estático** — no
verificable por lectura del repositorio sin datos de una base real. Se documenta el mecanismo, no
se inventa una lista de consumidores.

## Ver también

- [Visión general de eventos](overview.md)
- [Semántica de entrega](delivery-semantics.md)
- [Reintentos y cola muerta](retries-and-dlq.md)
- [`asyncapi/asyncapi.yaml`](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/asyncapi/asyncapi.yaml)
