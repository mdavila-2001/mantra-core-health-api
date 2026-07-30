# DTOs de contexto de salud

Contratos de entrada y salida. La validación vive en `class-validator`; la documentación, en
`@nestjs/swagger`.

## Convenciones

- Los identificadores de concepto viajan como UUID (`*ConceptId`). Sólo los vocabularios que el caso
  de uso enumera viajan como literal legible: disparador de corrida, estado de observación,
  desenlace de revisión, desenlace de corrida y modo de retiro. El resto —dominio, tipo de agente,
  tipo de fuente, nivel de confianza, tipo de revisión, país, zona horaria, métrica, unidad— es
  catálogo abierto.
- Los `numeric` (`confidenceScore`, `relevanceScore`) viajan como cadena, y los contadores `bigint`
  de la corrida también.
- Las fechas de entrada son ISO-8601 (`@IsISO8601`); las de salida, `toISOString()`.

## Vocabularios

| Tipo | Valores |
| --- | --- |
| `CollectionTrigger` | `SCHEDULED`, `MANUAL` |
| `ObservationStatus` | `ACCEPTED`, `REJECTED` |
| `ReviewOutcome` | `APPROVED`, `REJECTED` |
| `RunOutcome` | `SUCCEEDED`, `PARTIAL`, `FAILED` |
| `SupersedeMode` | `SUPERSEDED`, `EXPIRED` |

## Por caso de uso

| UC | Entrada | Salida |
| --- | --- | --- |
| 01 | `CreateAgentDto` | `AgentResponseDto` |
| 02 | `CreateSourceDto` | `SourceResponseDto` |
| 03 | `CreateScheduleDto` | `ScheduleResponseDto` |
| 04 | `CreateContextDto` | `ContextResponseDto` |
| 05 | `StartCollectionRunDto` | `CollectionRunResponseDto` |
| 06 | `RecordObservationDto` | `ObservationResponseDto` |
| 07 | `DraftContextVersionDto` (+ `ContextFactDto`, `FactEvidenceDto`) | `ContextVersionResponseDto` |
| 08 | `RecordQualityReviewDto` | `QualityReviewResponseDto` |
| 09 | — (sin cuerpo) | `PublishVersionResponseDto` |
| 10 | `FinishCollectionRunDto` | `FinishRunResponseDto` |
| 11 | `SupersedeVersionDto` | `SupersedeVersionResponseDto` |
| 12 | — (query) | `ResolvedContextResponseDto` (+ `ResolvedFactDto`) |

## Decisiones que no son obvias

- **`ContextFactDto.evidence` usa `@ArrayMinSize(1)`**: es la regla del módulo puesta donde antes
  falla. Un hecho sin evidencia no se acepta, y rechazarlo en validación ahorra llegar al servicio.
- **`DraftContextVersionDto.facts` también exige al menos uno**: una versión sin hechos no aporta
  nada que consumir ni que revisar.
- **`StartCollectionRunDto` tiene `agentId` y `countryConceptId` opcionales**: con programación se
  heredan de ella; sin programación son obligatorios, y eso lo comprueba el servicio porque depende
  de otro campo.
- **`StartCollectionRunDto.nextRunAt`**: la próxima marca la calcula el scheduler, que conoce el
  cron y la zona horaria; el módulo sólo la guarda.
- **`RecordObservationDto.status` lo declara quien recolecta**: el agente sabe si el documento le
  sirvió o no. El módulo cuenta ambas cosas y no reinterpreta su criterio.
- **`RecordObservationDto.extractedPayloadJson` documenta que es agregado de país**, nunca datos de
  paciente. Es la regla del caso de uso puesta donde un desarrollador la va a leer.
- **UC-44-09 no lleva cuerpo**: publicar no aporta datos, sólo identifica la versión, que ya está en
  la ruta.
- **`RecordQualityReviewDto.reviewerAgentId` es opcional**: su presencia es lo que distingue una
  revisión automática de una humana, y el servicio firma en consecuencia.
- **`FinishRunResponseDto` devuelve los contadores reconciliados**, no los que llevaba el run: son
  los que quedan en el histórico, y el worker necesita ver la diferencia.
- **`SupersedeVersionDto.replacementVersionId` es opcional en el DTO** pero obligatorio en modo
  `SUPERSEDED`: la dependencia entre campos no se expresa en `class-validator`, así que la comprueba
  el servicio.
- **`ResolvedContextResponseDto.stale`**: la versión caducada se devuelve marcada, no se oculta. Un
  404 le quitaría al consumidor la decisión de usar un dato viejo declarado como tal.
- **`ResolvedFactDto.evidenceObservationIds`** devuelve los identificadores de observación, no las
  observaciones enteras: el consumidor casi siempre quiere el dato con su respaldo comprobable, no
  el boletín completo.

## Pruebas

Sin suite propia: los DTOs se validan por el `ValidationPipe` global y se ejercitan desde las
pruebas de servicio y de controlador.
