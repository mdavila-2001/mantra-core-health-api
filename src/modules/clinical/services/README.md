# Clinical — Servicios

Los servicios poseen la unidad de trabajo: inyectan `EntityManager`
(`@mikro-orm/postgresql`) y usan `em.transactional(async (tx) => {...})` para toda
escritura, con `tx.flush()` entre padre e hijo (FK son columnas uuid planas).
Estados/tipos vienen de `CLIN` (`clinical.concepts.ts`). Excepciones de dominio:
`ResourceNotFoundException` (404), `ConflictException` (409),
`PreconditionFailedException` (422), `ConcurrencyConflictException` (409).

| Servicio | UC | Responsabilidad |
|----------|----|-----------------|
| `CareEpisodesService` | 01 | Abre episodio; rechaza episodio activo duplicado |
| `EncountersService` | 02, 14 | Check-in (encuentro + participantes + ubicación); cierre con corte de periodos y bloqueo optimista |
| `ObservationsService` | 03, 04 | Registro (componentes/rangos/performers/notas, VALUE CONTRACT) y enmienda con transición de estado |
| `ServiceRequestsService` | 05 | Crea orden de servicio (intent order, status active) |
| `DiagnosticReportsService` | 06, 07 | Emite reporte (retenido, completa la orden) y libera resultados |
| `ConditionsService` | 08 | Registra condición; rechaza duplicado activo por código |
| `AllergyIntolerancesService` | 09 | Registra alergia + reacciones; rechaza duplicado por sustancia |
| `MedicationsService` | 10, 11 | Prescribe; registra administración y cierra la prescripción en la dosis final |
| `ProceduresService` | 12 | Registra procedimiento; completa la orden y valida el procedimiento padre |
| `ImmunizationsService` | 13 | Registra inmunización; rechaza doble dosis |

## Tests

`*.service.spec.ts` — unit, mockean repositorios y `em.transactional`
(`transactional: jest.fn((cb) => cb(tx))`). Cubren happy path (delegación,
flush padre-antes-de-hijo, estado resultante), not-found, conflicto/precondición y
concurrencia. Sin acceso real a BD.
