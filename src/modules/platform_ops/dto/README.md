# DTOs de operaciones de plataforma

Contratos de entrada y salida. La validación vive en `class-validator`; la documentación, en
`@nestjs/swagger`.

## Convenciones

- Los identificadores de concepto viajan como UUID (`*ConceptId`). Los vocabularios que el cliente
  elige viajan como literales legibles y el servicio los traduce al concepto.
- **Los `bigint` y los `numeric` viajan como cadena**: contadores de evento, segundos de RTO/RPO,
  tasas de quema, porcentajes y valores de capacidad. Pasarlos por `number` los redondearía en el
  camino, y son justo los datos que deciden si un SLO se cumple.
- Las fechas de entrada son ISO-8601 (`@IsISO8601`); las de salida, `toISOString()`.
- Los `*ResponseDto` devuelven identificadores, estado y lo que el servicio **derivó**, no la entidad
  entera.

## Vocabularios

| Tipo | Valores |
| --- | --- |
| `ChangeType` | `STANDARD`, `NORMAL`, `EMERGENCY` |
| `ChangeRisk` | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` |
| `ApprovalDecision` | `APPROVED`, `REJECTED` |
| `ArtifactKind` | `CONTAINER_IMAGE`, `PACKAGE`, `BINARY`, `HELM_CHART`, `CONFIG_BUNDLE` |
| `OpsEnvironment` | `DEVELOPMENT`, `STAGING`, `PRODUCTION` |
| `DeployStrategy` | `ROLLING`, `BLUE_GREEN`, `CANARY`, `RECREATE` |
| `DeployOutcome` | `SUCCEEDED`, `FAILED` |
| `HealthRunStatus` | `PASS`, `WARN`, `FAIL`, `TIMEOUT`, `ERROR` |
| `HealthRunSource` | `SCHEDULER`, `PROBE`, `MANUAL` |
| `IncidentTransition` | `ACKNOWLEDGE`, `MITIGATE`, `RESOLVE`, `UPDATE` |
| `ResponderRole` | `COMMANDER`, `OPERATIONS`, `COMMUNICATIONS`, `SCRIBE` |
| `CommunicationType` | `STATUS_UPDATE`, `ESCALATION`, `RESOLUTION` |
| `CommunicationAudience` | `INTERNAL`, `CUSTOMERS`, `REGULATORS` |
| `ActionType` | `PREVENTIVE`, `CORRECTIVE`, `DETECTIVE`, `PROCESS` |
| `ImprovementPriority` | `LOW`, `MEDIUM`, `HIGH` |
| `CapacityMetric` | `CPU`, `MEMORY`, `STORAGE`, `THROUGHPUT`, `CONNECTIONS` |
| `ReviewDecision` | `GO`, `NO_GO` |
| `ExecutionMode` | `MANUAL`, `ASSISTED`, `AUTOMATED` |
| `ExecutionResult` | `SUCCESS`, `PARTIAL`, `FAILED`, `ABORTED` |

## Por caso de uso

| UC | Entrada | Salida |
| --- | --- | --- |
| 01 | `CreateChangeRequestDto` | `ChangeRequestResponseDto` |
| 02 | `RecordApprovalDto` | `ApprovalResponseDto` |
| 03 | `PublishArtifactDto` | `ArtifactResponseDto` |
| 04 | `CreateDeploymentDto` | `DeploymentResponseDto` |
| 05 | `RollbackDeploymentDto` | `RollbackResponseDto` |
| 06 | `RecordHealthRunDto` | `HealthRunResponseDto` |
| 07 | `UpdateIncidentDto` (+ `IncidentResponderDto`, `IncidentCommunicationDto`) | `IncidentResponseDto` |
| 08 | `OpenPostmortemDto` (+ `ActionItemDto`) | `PostmortemResponseDto` |
| 09 | `RecordSloMeasurementDto` | `SloMeasurementResponseDto` |
| 10 | `RecordBurnEventDto` | `BurnEventResponseDto` |
| 11 | `RecordCapacityMeasurementDto` | `CapacityMeasurementResponseDto` |
| 12 | `CompleteReadinessReviewDto` (+ `ResolvedFindingDto`) | `ReadinessReviewResponseDto` |
| 13 | `PublishRunbookVersionDto` · `RecordRunbookExecutionDto` | `RunbookVersionResponseDto` · `RunbookExecutionResponseDto` |
| 14 | `CompleteResilienceExerciseDto` | `ResilienceExerciseResponseDto` |

## Decisiones que no son obvias

- **`CreateChangeRequestDto` no lleva pasos de aprobación**: `change_requests` no tiene columna para
  guardarlos, así que los declara cada decisión (`RecordApprovalDto.requiredApprovalSteps`) en lugar
  de fingir que se persisten.
- **`PublishArtifactDto.contentHash` se valida con `@Matches`** contra un hexadecimal de 32 a 128
  caracteres: cubre MD5 hasta SHA-512 sin casarse con un algoritmo concreto.
- **`CreateDeploymentDto.outcome` es opcional**: sin él el despliegue queda en curso; el pipeline
  puede reportar el desenlace en la misma llamada porque suele conocerlo ya.
- **`DeploymentResponseDto.supersededDeploymentId`** dice qué despliegue dejó de ser vigente. Sin ese
  dato el llamante no sabría qué acaba de sustituir.
- **`RollbackDeploymentDto.targetDeploymentId` es opcional**: por defecto se vuelve al último
  correcto anterior, que es lo que se quiere el 90 % de las veces a las tres de la mañana.
- **`HealthRunResponseDto.consecutiveFailures`** devuelve la racha calculada: el probe no la lleva, y
  es lo que explica por qué se abrió (o no) el incidente.
- **`UpdateIncidentDto` mezcla transición, respondientes y comunicaciones** porque el caso de uso los
  declara en la misma transacción: reconocer un incidente y anunciarlo son el mismo gesto.
- **`IncidentTransition.UPDATE`** existe para añadir sin mover el estado; con `summary` deja una nota
  en el timeline.
- **`OpenPostmortemDto.actionItems` usa `@ArrayMinSize(1)`**: un postmortem sin acciones no cambia
  nada.
- **`SloMeasurementResponseDto.duplicate`** distingue la ventana recién medida de la que ya estaba:
  el evaluador reintenta y necesita saber cuál de las dos cosas pasó.
- **`RecordCapacityMeasurementDto` acepta el plan recomputado** (`demandForecastJson`,
  `scalingPolicyJson`): sólo se aplica si la utilización cruzó el guardrail.
- **`CompleteReadinessReviewDto.improvementOwnerUserId` es obligatorio**: lo que queda abierto entra
  al backlog, y una mejora sin dueño no la sigue nadie. Se usa sólo si el hallazgo no declara el suyo.
- **`RunbookVersionResponseDto` no devuelve checksum**: `runbook_versions` no tiene la columna en el
  modelo v4.0.7, y no se inventa un dato que no se persiste. Ver la divergencia en el README del
  módulo.
- **`CompleteResilienceExerciseDto` no acepta el resultado**: lo deriva el servicio comparando lo
  observado con el objetivo de recuperación.

## Pruebas

Sin suite propia: los DTOs se validan por el `ValidationPipe` global y se ejercitan desde las
pruebas de servicio y de controlador.
