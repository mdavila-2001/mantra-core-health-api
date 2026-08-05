# DTOs — Diagnostics

`class-validator` + `class-transformer` + `@nestjs/swagger`. Los request DTOs
validan tipos, uuids, longitudes y anidados (`@ValidateNested` + `@Type`). Los
`*_concept_id` que fija el servidor NO se piden aquí; sí los que aporta el cliente.

- `specimens.dto.ts`: CreateSpecimen, CreateAccession, RejectSpecimen, CreateContainer, ContainerCustodyEvent.
- `lab.dto.ts`: CreateWorkOrder (+ WorkOrderTestItem), CreateAnalyzerRun, IngestAnalyzerMessage, VerifyResult.
- `reports.dto.ts`: CreateReportVersion (+ ReportResultItem/ReportFileItem), ReleaseReportVersion, DetectCriticalResult, AcknowledgeCriticalResult.
- `imaging.dto.ts`: CreateImagingEndpoint, StoreImagingStudy (+ StowSeries/StowInstance), RecordDoseEvent.
- `media-quality.dto.ts`: AttachClinicalMedia (+ MediaAnnotationItem), CreateDataQualityEvent.
- `responses.dto.ts`: ResourceCreated, OperationResult, AccessionCreated, WorkOrderCreated, ImagingStudyStored.
