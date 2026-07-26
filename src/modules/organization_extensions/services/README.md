# Servicios — Organization Extensions

Poseen la unidad de trabajo (`em.transactional`), validan precondiciones y lanzan
excepciones de dominio (`ResourceNotFoundException` 404, `ConflictException` 409,
`PreconditionFailedException` 422). Hacen `flush` del padre antes de los hijos.

| Servicio | UCs | Responsabilidad |
|----------|-----|-----------------|
| `OrgextHospitalsService` | 01, 02, 03, 04 | Especializar/activar hospital, definir/retirar líneas de servicio |
| `OrgextFacilityLicensesService` | 05, 06 | Registrar y verificar/rechazar licencias |
| `OrgextAffiliationsService` | 07, 09 | Declarar (incluye guard de frontera) y terminar afiliaciones |
| `OrgextDataBoundariesService` | 08 | Definir frontera de datos (residencia/RLS) |

Tests unitarios en `*.service.spec.ts` (mockean repositorios y `em`).
