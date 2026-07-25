# Repositorios — Audit

Repositorios **stateless**: cada método recibe el `EntityManager` activo como primer
parámetro, de modo que el servicio controla la transacción y el sellado ocurre en la
misma unidad de trabajo que el cambio de negocio. Ninguna regla de negocio vive aquí.

| Repositorio | Tabla(s) | Notas |
|-------------|----------|-------|
| `AuditLogRepository` | `audit_log` | WORM + cadena hash: `append()` sella `previous_hash`/`record_hash`; `findChain()` para verificar (UC-10-03/06). |
| `DataAccessLogRepository` | `data_access_log`, `patient_content_access_log` | Accounting WORM de acceso (UC-10-01); `countByUserSince` para anomalías (UC-10-10). |
| `AnalyticsGovernanceLogRepository` | `analytics_governance_log` | Gobernanza append-only; idempotencia por `query_hash` (UC-10-07/08/11). |
| `DsarRequestsRepository` | `dsar_requests` | Única tabla con ciclo de vida (`row_version`, `created_at`/`updated_at`). |
| `ModerationRepository` | `moderation_events`, `moderation_decisions_history` | Evento WORM + versionado append-only (UC-10-11). |
| `ThirdPartyAccessRepository` | `delegated_/insurance_/identity_/pharmacy_*_log` | Cuatro canales de acceso de tercero (UC-10-12). |
| `HistoryRepository` | `audit.<tabla>_history` | Solo lectura; registro de entidades soportadas; reconstrucción point-in-time (UC-10-05). |

Todos los inserts usan `em.create(..., { partial: true })` y las tablas WORM solo
fijan `recorded_at`/`recorded_by_user_id` (u `occurred_at`): no se fija `rowVersion`.
