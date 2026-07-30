# DTOs — Audit

`class-validator` + `class-transformer` + `@nestjs/swagger`. Los DTO de entrada
validan tipos, uuids, enums y longitudes; los de respuesta exponen solo campos
seguros (ids, hashes, timestamps) — nunca PHI ni secretos.

| Archivo | DTOs |
|---------|------|
| `data-access.dto.ts` | `RecordDataAccessDto`, `DataAccessResultDto` (UC-10-01) |
| `audit-event.dto.ts` | `RecordAuditEventDto`, `AuditEventResultDto` (UC-10-04/03) |
| `history.dto.ts` | `HistoryQueryDto`, `HistoryTimelineDto`, `HistoryRevisionDto` (UC-10-05) |
| `integrity.dto.ts` | `VerifyIntegrityDto`, `IntegrityReportDto` (UC-10-06) |
| `audit-export.dto.ts` | `CreateAuditExportDto`, `AuditExportResultDto` (UC-10-07) |
| `dsar.dto.ts` | `CreateDsarDto`, `UpdateDsarDto`, `DsarResponseDto` (UC-10-08) |
| `operations.dto.ts` | `RetentionApplyDto`/`RetentionResultDto` (UC-10-09), `AnomalyScanDto`/`AnomalyScanResultDto` (UC-10-10) |
| `moderation.dto.ts` | `CreateModerationDecisionDto`, `ModerationDecisionResultDto` (UC-10-11) |
| `third-party-access.dto.ts` | `RecordThirdPartyAccessDto`, `ThirdPartyAccessResultDto` (UC-10-12) |

Los enums de entrada (acciones, propósitos, tipos DSAR, canales…) se traducen a
`*_concept_id` en los servicios mediante mapas hacia `AUD` / `CONCEPTS`.
