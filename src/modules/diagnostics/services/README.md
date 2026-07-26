# Servicios — Diagnostics

Poseen la unidad de trabajo (`em.transactional`), validan precondiciones y hacen
`flush` padre-antes-de-hijo. Estados desde `DIAG` (diagnostics.concepts.ts).

| Servicio | Casos de uso |
|----------|--------------|
| `DiagnosticsSpecimensService` | soporte specimen/container, UC-20-01, UC-20-02, UC-20-03 |
| `DiagnosticsLabService` | UC-20-04, soporte analyzer-run, UC-20-05, UC-20-06 |
| `DiagnosticsReportsService` | UC-20-07, UC-20-08, UC-20-09, UC-20-10 |
| `DiagnosticsImagingService` | soporte endpoint, UC-20-11, UC-20-13 |
| `DiagnosticsMediaQualityService` | UC-20-12, UC-20-14 |

Tests unitarios `*.service.spec.ts` mockean repos y `EntityManager`
(`transactional: (cb) => cb(tx)`): happy, not-found (404), conflict (409) y
precondición (422).
