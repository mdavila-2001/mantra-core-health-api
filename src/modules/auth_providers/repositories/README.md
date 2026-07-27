# Repositorios de proveedores de identidad

Acceso a datos de `auth_providers.*`. Sin lógica de negocio: sólo lecturas, escrituras y el modo de
bloqueo que cada operación necesita.

## Repositorio

Uno solo, `AuthProvidersRepository`, sobre las nueve tablas del módulo. Todas cuelgan del proveedor
—configuración, claves, mapeos, vínculos, reglas, identidades, intentos y solicitudes—, así que
partirlo obligaría a que cada mitad conociera el mismo agregado.

## Lecturas con bloqueo

| Método | Modo | Por qué |
| --- | --- | --- |
| `findProviderForUpdate` | `FOR UPDATE` | Reconfigurar y rotar tocan el proveedor y sus hijos |
| `findProtocolConfigForUpdate` | `FOR UPDATE` | La configuración saliente se deshabilita al reemplazarla |
| `findActiveKeysForUpdate` | `FOR UPDATE` | Publicar la nueva y retirar las salientes deben ver el mismo conjunto |
| `findMappingsForUpdate` | `FOR UPDATE` | El mapeo se reemplaza en bloque |
| `findBindingForUpdate` | `FOR UPDATE` | Revincular actualiza el existente en vez de duplicarlo |
| `findIdentityForUpdate` | `FOR UPDATE` | Revocar |
| `findIdentityBySubjectForUpdate` | `FOR UPDATE` | El mismo sujeto debe resolver siempre al mismo usuario |
| `findLinkRequestByTokenHashForUpdate` | `FOR UPDATE` | Completar la solicitud la consume |

El resto son lecturas simples: catálogo del proveedor, comprobación de duplicados y evaluación de
reglas.

## Búsquedas por clave natural

- `findProviderByCode` — el login federado llega por el código del proveedor, no por su id.
- `findSigningKey(providerId, keyId)` — el `kid` es único dentro del proveedor.
- `findAttemptByRequestId(providerId, requestId)` — valida el `state` del callback contra un inicio
  real.
- `findLinkRequestByTokenHashForUpdate(hash)` — la solicitud se busca por el **hash** del token; el
  token en claro no se guarda.
- `findRuleByPriority(providerId, priority)` — la prioridad es única por proveedor.

## Orden de las reglas

`findActiveRules` devuelve las reglas activas ordenadas por `priority ASC`: el servicio decide con la
primera que case. El orden vive en la consulta, no en memoria, porque es parte de la semántica.

## Auditoría

Toda creación pasa por `createdBy(actorUserId)`. `createLoginAttempt` no la usa: la tabla es
append-only y lleva `occurred_at`/`recorded_at` propios, sin campos de modificación que auditar.

## `userId` opcional en la solicitud de vinculación

`createLinkRequest` acepta `userId` ausente: el callback abre solicitudes antes de que IAM haya
resuelto al usuario, y quien la completa aporta el suyo.

## Pruebas

Los repositorios no tienen suite propia; se ejercitan como dobles desde los servicios
(`auth-providers-config.service.spec.ts`, `federated-login.service.spec.ts`).
