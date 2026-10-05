# Revisión del módulo `directory` — ALOVIDA

## Alcance y evidencia

Se revisaron tenants, subtenants, branches, membresías, asignaciones, perfiles públicos, representantes y documentos de afiliación. `corepack yarn test src/modules/directory --runInBand --silent` aprobó **14 suites y 192 pruebas**.

## Hallazgo confirmado

### DIR-01 — Media — Denegaciones de administración y precondiciones no llevan una razón de negocio estable

`TenantAdministrationService` aplica correctamente la membresía activa del actor en el tenant y distingue OWNER de ADMIN, pero lanza `ForbiddenException` de Nest para la falta de permiso ([`tenant-administration.service.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/directory/services/tenant-administration.service.ts#L58-L71), [`…100-L112`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/directory/services/tenant-administration.service.ts#L100-L112), [`…136-L148`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/directory/services/tenant-administration.service.ts#L136-L148)). Servicios de branches, memberships, perfiles de tipo y afiliaciones hacen lo mismo con `PreconditionFailedException` y `ConflictException` genéricos. El filtro HTTP puede conservar `403/422/409`, pero estas excepciones no suministran `details.reason`.

El cliente no puede diferenciar de forma programática miembro inexistente, miembro sin privilegio administrativo, intento de cambiar ownership o tenant inactivo sin depender del mensaje en castellano.

**Plan:** crear un catálogo `directory.error-reasons.ts` y un helper/excepción de dominio para `DIRECTORY_TENANT_MEMBERSHIP_REQUIRED`, `DIRECTORY_TENANT_ADMIN_REQUIRED`, `DIRECTORY_TENANT_OWNER_REQUIRED`, `DIRECTORY_TENANT_INACTIVE` y `DIRECTORY_LAST_OWNER_REQUIRED`. Migrar las rutas administrativas y sus tests HTTP con status, code y reason sin IDs en la respuesta.

| Caso | Prueba dirigida | Resultado esperado |
| --- | --- | --- |
| Correcto | OWNER activo crea branch e invita STAFF en su propio tenant | `201`, filas pertenecen al tenant solicitado |
| Límite | ADMIN intenta editar membresía STAFF del mismo tenant | operación permitida sin conceder OWNER |
| Error | STAFF o miembro de tenant B intenta administrar tenant A | no hay filas ni cambios |
| Falla catalogada | ADMIN intenta asignar OWNER o retirar al último OWNER | `403/FORBIDDEN/DIRECTORY_TENANT_OWNER_REQUIRED` o `422/PRECONDITION_FAILED/DIRECTORY_LAST_OWNER_REQUIRED` |

## Controles verificados

Las lecturas de tenant pasan por `assertCanRead`; las escrituras por `assertCanAdminister`; cambios de ownership requieren OWNER o plataforma. Las branches y membresías se validan dentro del tenant, y el offboarding/suspensión cierran relaciones en transacción. Las pruebas cubren estas reglas con mocks; faltan respuestas HTTP completas con el catálogo de reasons.
