# Servicios — Audit

Los servicios poseen la unidad de trabajo (`em.transactional`): validan
precondiciones, escriben en las tablas WORM y sellan provenance/cadena hash en la
misma transacción, y mapean entidad → DTO de respuesta (sin filtrar campos internos).

| Servicio | UC | Responsabilidad |
|----------|----|-----------------|
| `AuditEventsService` | 01, 04, 06, 09, 10 | Acceso clínico, evento+sellado de cadena, verificación de integridad, retención y anomalías. |
| `AuditHistoryService` | 05 | Línea de tiempo / point-in-time; audita la propia lectura. |
| `ComplianceService` | 07, 08 | Exportación de evidencia y máquina de estados DSAR. |
| `ModerationService` | 11 | Decisión de moderación WORM + gobernanza + versionado opcional. |
| `ThirdPartyAccessService` | 12 | Acceso de tercero por canal (delegated/insurance/identity/pharmacy). |

Excepciones de dominio: `ConflictException` (query_hash duplicado),
`ResourceNotFoundException` (DSAR/entidad de historial no soportada),
`PreconditionFailedException` (transición DSAR terminal, FK de canal faltante).
