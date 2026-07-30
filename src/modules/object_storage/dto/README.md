# DTOs de almacenamiento de objetos

Contratos de entrada y salida. La validación vive en `class-validator`; la documentación, en
`@nestjs/swagger`.

## Convenciones

- **No hay `*ConceptId`.** Los estados de este esquema son `varchar` y salen de
  `constants/object-storage.constants.ts`. El único vocabulario que el cliente elige es
  `RetentionLockMode` (`compliance` / `governance`), y se valida contra la constante, no contra un
  literal escrito a mano en el DTO.
- **Los `bigint` viajan como cadena**: `expectedSizeBytes`, `receivedSizeBytes`, `sizeBytes`,
  `recordCount`.
- Los SHA-256 se validan con `@Matches` contra un hexadecimal de 64 caracteres.
- Las fechas de entrada son ISO-8601; las de salida, `toISOString()`.

## Por caso de uso

| UC | Entrada | Salida |
| --- | --- | --- |
| 01 | `InitiateUploadDto` | `UploadResponseDto` |
| 02 | `CompleteUploadDto` (+ `EncryptionEnvelopeDto`) | `ObjectVersionResponseDto` |
| 03 | `CreateVersionDto` | `ObjectVersionResponseDto` |
| 04 | `CatalogDicomStudyDto` (+ `DicomSeriesDto`, `DicomInstanceDto`) | `CatalogDicomStudyResponseDto` |
| 05 | — (ruta + query) | `DicomInstanceAccessResponseDto` |
| 06 | `RegisterLargePayloadDto` | `LargePayloadResponseDto` |
| 07 | `ApplyRetentionLockDto` | `RetentionLockResponseDto` |
| 08 | `PlaceLegalHoldDto` · — | `LegalHoldResponseDto` |
| 09 | `IssueSignedUrlDto` | `SignedUrlResponseDto` |
| 10 | `RecordIntegrityCheckDto` | `IntegrityCheckResponseDto` |
| 11 | `BuildArchiveJobDto` | `ArchiveJobResponseDto` |
| 12 | `RequestDeletionDto` | `DeletionMarkerResponseDto` |

## Decisiones que no son obvias

- **`InitiateUploadDto.targetObjectKey` documenta que es opaca**: no debe llevar datos del paciente.
  Es la regla del caso de uso puesta donde un desarrollador la va a leer antes de construir la clave.
- **`EncryptionEnvelopeDto.encryptedDataKey`, nunca la clave en claro**: el sobre guarda la clave de
  datos cifrada con la maestra, y la maestra vive en el KMS.
- **`CompleteUploadDto.receivedSizeBytes` es obligatorio** aunque el tamaño ya se declarara al
  iniciar: el servicio compara los dos, y esa comparación es la que detecta la carga incompleta.
- **`ObjectVersionResponseDto` distingue `manifestCreated` de `duplicate`**: "objeto nuevo" y
  "contenido ya versionado" son cosas distintas y el cliente necesita ambas.
- **`DicomInstanceDto.objectManifestId` es obligatorio**: se cataloga una referencia a un píxel que
  ya existe. Sin él, el catálogo apuntaría a algo que nadie subió.
- **`CatalogDicomStudyResponseDto` devuelve `instancesAdded` y `instancesSkipped`**: el router DICOM
  necesita saber cuánto de su reenvío era nuevo.
- **`DicomInstanceAccessResponseDto` siempre trae `accessLogId`**, aceptado o denegado: el registro
  se escribe en ambos casos, y devolverlo permite correlacionar.
- **`RecordIntegrityCheckDto` no acepta el resultado**, sólo el hash recomputado: lo deriva el
  servicio. Dejar que el worker declare "pasó" permitiría marcar como bueno algo que no lo es.
- **`IssueSignedUrlDto.purposeOfUseCode` es obligatorio**: es acceso a datos almacenados, y sin
  propósito no hay forma de juzgar después si estaba justificado.
- **`SignedUrlResponseDto` no trae la URL firmada**, sino la URI, la versión de clave y la caducidad.
  Firmar es del adaptador de almacenamiento, que tiene la credencial (ver README del módulo).
- **`ApplyRetentionLockDto.lockMode` se valida contra `RETENTION_LOCK_MODE`**, la misma constante que
  usa el servicio: el DTO y la lógica no pueden desincronizarse.
- **`BuildArchiveJobDto.manifestHash` es obligatorio**: es lo que hace idempotente el lote.
- **`RequestDeletionDto.reason` es obligatorio**: un borrado sin motivo declarado no se puede
  defender después.

## Pruebas

Sin suite propia: los DTOs se validan por el `ValidationPipe` global y se ejercitan desde las
pruebas de servicio y de controlador.
