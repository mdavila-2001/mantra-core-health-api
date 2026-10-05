# Revisión del módulo `profiles` — ALOVIDA

## Alcance y evidencia

Se revisaron alta y gobierno de perfiles, representación, solicitudes de dependiente, especialidades, afiliaciones, credenciales, vínculos de cuenta, fotos y búsquedas. `corepack yarn test src/modules/profiles --runInBand --silent` aprobó **29 suites y 535 pruebas**; produjo tres advertencias preexistentes de imports JSON. Las solicitudes de representación se resuelven desde la sesión, limitan frecuencia, enmascaran CI y responden `404` para solicitudes ajenas ([`profiles-dependent-requests.controller.ts`](../../../src/modules/profiles/controllers/profiles-dependent-requests.controller.ts#L43-L171), [`dependent-link-requests.service.ts`](../../../src/modules/profiles/services/dependent-link-requests.service.ts#L93-L260)).

## Hallazgo confirmado

### PROF-01 — Media — Fallas de perfiles sin `reason` de negocio estable

Servicios de perfiles importan y lanzan `ForbiddenException` o `BadRequestException` de Nest, por ejemplo cuando la cuenta no tiene perfil de paciente ([`dependent-link-requests.service.ts`](../../../src/modules/profiles/services/dependent-link-requests.service.ts#L108-L119), [`dependent-link-requests.service.ts`](../../../src/modules/profiles/services/dependent-link-requests.service.ts#L236-L247)), cuando no es dueño de un perfil ([`profile-ownership.service.ts`](../../../src/modules/profiles/services/profile-ownership.service.ts#L85-L155)) y cuando se declara teléfono de tutor sin nombre ([`guardian-related-person.ts`](../../../src/modules/profiles/services/guardian-related-person.ts#L78-L98)).

El filtro global conserva el HTTP status y asigna el `ErrorCode` genérico por defecto para toda `HttpException`, pero esas excepciones no incluyen `details.reason` ([`all-exceptions.filter.ts`](../../../src/common/filters/all-exceptions.filter.ts#L267-L342)). El cliente sólo puede diferenciar los escenarios leyendo el texto en castellano, que no es un contrato estable.

**Plan:** reemplazar estas excepciones por una excepción de dominio o un helper de `profiles` que conserve `403/FORBIDDEN` o `400/VALIDATION_FAILED` y adjunte reason catalogado. Propuesta: `PROFILE_PATIENT_ACCOUNT_REQUIRED`, `PROFILE_OWNERSHIP_REQUIRED`, `PROFILE_PRACTITIONER_ACCOUNT_REQUIRED` y `PROFILE_GUARDIAN_NAME_REQUIRED`. Añadir catálogo del módulo y migrar los tests de HTTP para afirmar status, code y reason.

| Caso | Prueba dirigida | Resultado esperado |
| --- | --- | --- |
| Correcto | Paciente propio solicita representación por perfil elegible | `201`, solicitud `PENDING` |
| Límite | Búsqueda de dependiente de menos de tres letras | `200`, lista vacía, sin enumeración |
| Error | Cuenta sin perfil de paciente busca candidatos | `403/FORBIDDEN/PROFILE_PATIENT_ACCOUNT_REQUIRED` |
| Falla catalogada | Tutor con teléfono sin nombre | `400/VALIDATION_FAILED/PROFILE_GUARDIAN_NAME_REQUIRED` |

## Controles a conservar

`ProfileOwnershipService` deriva la propiedad desde el vínculo activo de la cuenta, sin aceptar una identidad declarada por el cliente. Las solicitudes pendientes no habilitan representación: sólo las filas activas y vigentes se usan para permisos. Mantener estas reglas en la matriz de regresión de dos cuentas y dos pacientes.
