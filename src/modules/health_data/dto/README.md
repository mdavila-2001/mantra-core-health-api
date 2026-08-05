# DTOs de la plataforma de datos de salud

Contratos de entrada y salida. La validación vive en `class-validator`; la documentación, en
`@nestjs/swagger`.

## Convenciones

- Los identificadores de concepto viajan como UUID (`*ConceptId`). Sólo los vocabularios que el caso
  de uso enumera viajan como literal: severidad de hallazgo, decisión de emparejamiento y desenlace
  de la de-identificación. El resto —tipo de recurso, modo de ingesta, formato, tipo de relación,
  entidad de dominio, propósito de uso, tipo de exportación, tipo de evento, visibilidad— es catálogo
  abierto.
- **Los `bigint` viajan como cadena**: contadores de lote, de corrida de calidad, de
  de-identificación, recuento del manifiesto y tamaño en bytes. Los `numeric` (`confidenceScore`,
  `relevanceScore`) también.
- Las fechas de entrada son ISO-8601 (`@IsISO8601`); las de salida, `toISOString()`.

## Vocabularios

| Tipo | Valores |
| --- | --- |
| `IssueSeverity` | `FATAL`, `ERROR`, `WARNING`, `INFORMATION` (los de `OperationOutcome` de FHIR) |
| `MatchDecision` | `MATCH`, `NO_MATCH` |
| `DeidOutcome` | `COMPLETED`, `FAILED` |
| `ValidationResult` | `PASS`, `WARNING`, `ERROR` — **sólo de salida**: lo deriva el servicio |

## Por caso de uso

| UC | Entrada | Salida |
| --- | --- | --- |
| 01 | `OpenIngestionBatchDto` | `IngestionBatchResponseDto` |
| 02 | `RecordIngestionRecordDto` · `CloseIngestionBatchDto` | `IngestionRecordResponseDto` · `CloseBatchResponseDto` |
| 03 | `ProjectCanonicalResourceDto` | `CanonicalResourceVersionResponseDto` |
| 04 | `RegisterIdentifierDto` | `IdentifierResponseDto` |
| 05 | `CreateRelationshipDto` | `RelationshipResponseDto` |
| 06 | `CreateResourceBindingDto` | `ResourceBindingResponseDto` |
| 07 | `ValidateVersionDto` (+ `ValidationIssueDto`) | `ValidationRunResponseDto` |
| 08 | `RecordQualityRunDto` (+ `QualityFindingDto`) | `QualityRunResponseDto` |
| 09 | `ResolveMatchCandidateDto` | `MatchDecisionResponseDto` |
| 10 | `ProjectTimelineEntryDto` | `TimelineEntryResponseDto` |
| 11 | `RecordDeidRunDto` | `DeidRunResponseDto` |
| 12 | `ExportBundleDto` | `ExportJobResponseDto` |
| 13 | — (ruta + query) | `EverythingBundleResponseDto` (+ `EverythingEntryDto`) |
| 14 | `RetireResourceDto` | `RetireResourceResponseDto` |

## Decisiones que no son obvias

- **`ValidateVersionDto` no acepta el resultado**, sólo los hallazgos: lo deriva el servicio. Dejar
  que el llamante lo declare permitiría publicar como válido algo que el validador marcó con errores.
- **`RecordQualityRunDto` tampoco lo acepta**: sale de la severidad de las reglas incumplidas.
- **`QualityFindingDto.observedValueHash`, no el valor**: la incidencia debe poder deduplicarse y
  compararse sin guardar el dato clínico que la provocó.
- **`CanonicalResourceVersionResponseDto` tiene `versionId` y `versionNumber` opcionales**: cuando el
  payload es idéntico al vigente no hay versión nueva, y `unchanged: true` lo dice explícitamente.
  Devolver la versión anterior como si fuera nueva haría creer al worker que proyectó algo.
- **`CanonicalResourceVersionResponseDto.created`** distingue "recurso nuevo" de "versión nueva de un
  recurso que ya existía": el worker necesita ambos datos.
- **`RegisterIdentifierDto.isPrimary` por defecto `false`**: promover un identificador a principal es
  una decisión, no un efecto colateral de registrarlo.
- **`CreateRelationshipDto` sólo lleva el destino**: el origen es el `:id` de la ruta, y repetirlo
  abriría la puerta a que ambos no coincidieran.
- **`ExportBundleDto` exige `purposeOfUseConceptId` y `contentHash`**: el propósito porque es acceso a
  datos clínicos, y el hash porque es lo único que después prueba qué se entregó.
- **`ExportBundleDto` deja `patientProfileId` y `cohortDefinitionId` opcionales** pero el servicio
  exige uno: la dependencia entre campos no se expresa en `class-validator`.
- **`RecordDeidRunDto.sourceVersionIds`** existe para poder dibujar el linaje versión → manifiesto;
  sin él la salida no sería rastreable hasta su origen.
- **`RecordDeidRunDto` no lleva la clave de re-identificación**: vive en el vault y el módelo sólo
  guarda su referencia (`reidentification_key_secret_id` en el perfil).
- **`ProjectTimelineEntryDto.summaryRedacted` documenta que llega ya redactado**: aplicar el
  consentimiento es de `consent`, y este módulo no debe ver el dato en claro.
- **`EverythingBundleResponseDto.includedPatientProfileIds`** hace explícita la expansión por el
  clúster del MPI: quien recibe el Bundle debe saber de qué perfiles se compuso.
- **`EverythingBundleResponseDto.contentHash`** permite validar la frescura de una caché sin volver a
  pedir el Bundle entero.

## Pruebas

Sin suite propia: los DTOs se validan por el `ValidationPipe` global y se ejercitan desde las
pruebas de servicio y de controlador.
