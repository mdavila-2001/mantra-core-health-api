# Servicios de proveedores de identidad

Lógica de negocio. Cada método público resuelve un caso de uso en **una transacción**.

## Servicios

Dos, porque el módulo tiene dos vidas distintas:

- **`AuthProvidersConfigService`** (UC-40-01 … 06, UC-40-11) — configuración: alta del proveedor,
  protocolo, claves, mapeos, vínculos y reglas. Lo opera un administrador, ocasionalmente.
- **`FederatedLoginService`** (UC-40-07 … 10, UC-40-12) — login: inicio, callback, vinculación y
  desvinculación. Lo opera el servicio de autenticación, en cada entrada.

Comparten repositorio y el mapa de entornos (`ENVIRONMENT_CONCEPT`), pero ni una regla: mezclarlos
pondría el camino caliente del login a cargar el mismo servicio que la administración.

## Reglas de negocio

### Configuración

- **Alta (01)**: código único, proveedor no global con tenant dueño, nace en borrador.
- **Protocolo (02)**: forma exigida por protocolo, una configuración activa por entorno —la anterior
  se deshabilita—, JWKS importado sin duplicar `kid` ya conocidos, y el borrador pasa a activo.
- **Clave (03)**: `kid` no repetido en el proveedor, vigencia no invertida.
- **Rotación (11)**: `kid` nuevo, las activas pasan a retirándose con `graceHours` (24 por defecto)
  o a retiradas si la gracia es cero.
- **Mapeo (04)**: exactamente un claim identificador, claims de origen sin repetir, reemplazo en
  bloque del mapeo anterior.
- **Vínculo (05)**: aprovisionar exige rol por defecto; revincular actualiza en lugar de duplicar;
  no se vincula un proveedor deshabilitado. El ordinal continúa los vínculos existentes.
- **Regla (06)**: prioridad única por proveedor; `DENY` no asigna rol ni tenant.

### Login

- **Inicio (07)**: proveedor activo, configuración activa del entorno (`PRODUCTION` si no se indica)
  con endpoint de autorización, y vínculo habilitado salvo proveedor global. `state` y `nonce` se
  generan nuevos en cada inicio y el intento queda registrado como `initiated`.
- **Callback (08)**: el `state` debe corresponder a un intento `initiated` del mismo proveedor;
  proveedor activo; claims requeridos presentes. Después decide la identidad (ver abajo).
- **Solicitud de vínculo (09)**: proveedor no deshabilitado, sujeto no vinculado y activo, sin otra
  solicitud pendiente del mismo usuario y sujeto.
- **Completar (10)**: solicitud pendiente y no caducada; una caducada se marca `expired` al
  detectarla; una identidad revocada se reactiva en vez de duplicarse.
- **Desvincular (12)**: sólo una identidad activa; queda revocada y con un intento `unlinked`.

## Cómo decide el callback

```
identidad del sujeto existe?
  ├─ sí, revocada ──────────────> failure(identity revoked)
  ├─ sí, activa ────────────────> success — actualiza lastLoginAt, correo, nombre y claims
  └─ no
       ├─ tenant sin vínculo habilitado ──> failure(no provision)
       ├─ correo fuera de dominios ───────> failure(domain not allowed)
       ├─ reglas deniegan o ninguna casa ─> failure(no provision)
       ├─ JIT + userId resuelto ──────────> identidad creada, success (provisioned)
       └─ resto ──────────────────────────> failure(no provision) + token de vinculación
```

El último caso registra un rechazo porque **no se autenticó a nadie**, y aun así devuelve el token:
el sujeto sí puede vincularse, sólo que hace falta una confirmación explícita.

## Evaluación de reglas

`evaluateRules` recorre las reglas por prioridad ascendente, salta las atadas a otro tenant y decide
con **la primera que case**. Si no casa ninguna, no se aprovisiona: denegar por omisión es lo único
seguro aquí. Sin reglas definidas, el vínculo del tenant es quien manda.

La condición (`condition_json`) es una comparación de igualdad claim a claim, comparando como cadena.
El caso de uso no declara nada más rico y no se inventa un lenguaje de expresiones.

## Lectura de claims

`readMapped` sólo lee el claim que el proveedor **declara** mapear a un atributo (`email`,
`displayName`). Sin mapeo no se adivina el nombre del claim: se devuelve indefinido. Un proveedor que
llame `mail` a su correo no debe funcionar por accidente.

## Tokens de vinculación

`randomBytes(32)` en base64url, hash SHA-256 en la tabla. El claro se devuelve una sola vez, en la
respuesta, y no se loguea. La caducidad por defecto es de 30 minutos.

## Dependencias

`EntityManager`, `AuthProvidersRepository` y `PinoLogger`.

## Transacciones y concurrencia

Un caso de uso equivale a una transacción, incluida la configuración completa del protocolo
(configuración + claves + activación del proveedor) y la rotación (clave nueva + retiro de las
salientes). Bloqueos: ver el README de `repositories/`.

## Excepciones

`ResourceNotFoundException` (proveedor, identidad o solicitud desconocidos),
`PreconditionFailedException` (proveedor no activo o deshabilitado, tenant sin vínculo, forma del
protocolo incompleta, vigencia invertida, mapeo sin identificador o con claims repetidos,
aprovisionamiento sin rol, `DENY` que asigna, `state` inválido, solicitud caducada o ya resuelta,
identidad ya revocada) y `ConflictException` (código, `kid` o prioridad repetidos, sujeto ya
vinculado, solicitud pendiente duplicada).

Los rechazos del callback **no** son excepciones: son un desenlace registrado con su motivo. Un 4xx
perdería el intento, que es justo lo que hay que auditar.

## Logs

`operation: 'auth-providers.<área>.<acción>'`. `warn` en rotación de clave, rechazo de login y
revocación de identidad. Nunca se loguean secretos, tokens ni claims.

## Pruebas

- `auth-providers-config.service.spec.ts` (40): borrador y activación, reemplazo de configuración,
  importación selectiva del JWKS, forma exigida por protocolo, gracia de la rotación, reemplazo en
  bloque del mapeo y sus invariantes, revínculo idempotente, prioridad única y `DENY` sin asignación.
- `federated-login.service.spec.ts` (44): construcción del `authorizeUrl`, unicidad de `state`/
  `nonce`, validación del `state` en el callback, cada motivo de rechazo, aprovisionamiento JIT,
  entrega del token de vinculación, orden y ámbito de las reglas, hash del token, caducidad de la
  solicitud, reactivación de una identidad revocada y revocación única.
