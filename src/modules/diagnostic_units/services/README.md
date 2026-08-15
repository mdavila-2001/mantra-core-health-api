# Servicios — diagnostic_units

Lógica de dominio del módulo 23. Cada servicio inyecta `EntityManager`
(`@mikro-orm/postgresql`) y sus repositorios; posee la unidad de trabajo con
`em.transactional` (escrituras) o `em.fork` (lecturas). Las FK son columnas uuid,
así que se hace `flush` del padre antes de crear hijos. `rowVersion` nunca se
fija; la auditoría usa `createdBy`/`touch`. Excepciones de dominio:
`ResourceNotFoundException` (404), `ConflictException` (409),
`PreconditionFailedException` (422).

| Servicio | Casos de uso |
|---|---|
| `DiagnosticUnitsReadService` | directorio y perfil del tenant activo, con relaciones legibles y solo precios públicos vigentes |
| `DiagnosticUnitsService` | alta (01), sitios (02), verify-and-publish (03), especialidades (04), asignación de especialistas (10), acreditaciones + renovación (11), reproyección (12) |
| `DiagnosticStudiesService` | publicar oferta con componentes (05), retirar oferta (08) |
| `DiagnosticPricingService` | cronograma (06), versionar precio append-only (07), cerrar precio (08) |
| `DiagnosticEquipmentService` | registrar y actualizar equipamiento (09) |

Los `*.spec.ts` son pruebas unitarias (mockean repos y `EntityManager`) que
cubren happy path, not-found, conflicto y al menos un rechazo de regla de negocio.
