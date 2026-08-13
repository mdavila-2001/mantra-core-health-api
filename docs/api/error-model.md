# Modelo de error

> Fase 5. Derivado directamente de `src/common/filters/all-exceptions.filter.ts` y
> `src/common/errors/{domain.exception,error-codes}.ts` — no es una plantilla genérica.

## Forma del cuerpo de error

Todo error HTTP de la API (excepción de dominio, excepción de Nest, o error no controlado)
se homogeneiza a través de `AllExceptionsFilter` (`@Catch()` global) en:

```json
{
  "code": "NOT_FOUND",
  "message": "Recurso no encontrado",
  "correlationId": "a1b2c3d4",
  "details": { "field": "practiceId" },
  "timestamp": "2026-07-29T22:00:00.000Z",
  "path": "/practice/sites/9f2c"
}
```

| Campo           | Tipo                        | Siempre presente                                          | Origen                                                                                                |
| --------------- | --------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `code`          | `string` (enum `ErrorCode`) | Sí                                                        | `src/common/errors/error-codes.ts`                                                                    |
| `message`       | `string`                    | Sí                                                        | Mensaje de negocio, pensado para humanos — no ramificar lógica de cliente sobre su texto, usar `code` |
| `correlationId` | `string`                    | Cuando `pino-http` asigna `req.id` o llega `x-request-id` | `AllExceptionsFilter.catch()`                                                                         |
| `details`       | `Record<string, unknown>`   | No — depende de la excepción concreta                     | Contexto adicional específico del error (p. ej. campo inválido)                                       |
| `timestamp`     | `string` (ISO 8601)         | Sí                                                        | `new Date().toISOString()` en el momento del error                                                    |
| `path`          | `string`                    | Sí                                                        | `request.url`                                                                                         |

## Códigos de error (`ErrorCode`)

| `code`                   | HTTP status | Excepción de dominio                 | Significado                                                                         |
| ------------------------ | ----------: | ------------------------------------ | ----------------------------------------------------------------------------------- |
| `VALIDATION_FAILED`      |         400 | (via `ValidationPipe` global)        | El body/query no cumple los DTO/`class-validator`                                   |
| `UNAUTHENTICATED`        |         401 | `UnauthorizedException` (dominio)    | JWT ausente o inválido                                                              |
| `FORBIDDEN`              |         403 | (via `RolesGuard`/PDP clínico)       | Rol o alcance clínico insuficiente                                                  |
| `NOT_FOUND`              |         404 | `ResourceNotFoundException`          | Recurso principal o relacionado inexistente                                         |
| `CONFLICT`               |         409 | `ConflictException`                  | Violación de unicidad o estado incompatible (duplicado, idempotencia)               |
| `PRECONDITION_FAILED`    |         422 | `PreconditionFailedException`        | Precondición de negocio no satisfecha (estado del agregado, consentimiento vigente) **o un identificador del cuerpo que no corresponde a ninguna fila** (clave foránea inexistente) |
| `CONCURRENCY_CONFLICT`   |         409 | (optimistic locking, `row_version`)  | Escritura concurrente sobre el mismo agregado                                       |
| `PAYLOAD_TOO_LARGE`      |         413 | Parser HTTP global                   | El cuerpo excede el límite permitido                                                |
| `RATE_LIMITED`           |         429 | `ThrottlerGuard` global o específico | Se excedió la cuota de solicitudes                                                  |
| `DEPENDENCY_UNAVAILABLE` |         503 | Sonda de readiness                   | PostgreSQL, MongoDB, Redis u OpenSearch no está disponible dentro del timeout       |
| `INTERNAL`               |         500 | —                                    | Error no anticipado                                                                 |

## Capturas reales

Cada cuerpo de abajo es la respuesta **literal** de la API, provocada contra una instancia
real el 2026-08-01. No son ejemplos redactados a mano: si algo no coincide con lo que
recibe el cliente, el que está mal es este documento.

### 400 · body que no cumple el DTO

`POST /iam/auth/login` → **400**

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Error de validación",
  "correlationId": "4",
  "details": {
    "violations": [
      "email must be an email"
    ]
  },
  "timestamp": "2026-08-01T11:12:53.099Z",
  "path": "/iam/auth/login"
}
```

### 400 · uuid mal formado en la ruta

`POST /iam/users/no-es-uuid/lock` → **400**

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Validation failed (uuid is expected)",
  "correlationId": "5",
  "timestamp": "2026-08-01T11:12:53.104Z",
  "path": "/iam/users/no-es-uuid/lock"
}
```

### 401 · sin token

`GET /terminology/concepts?q=X` → **401**

```json
{
  "code": "UNAUTHENTICATED",
  "message": "Unauthorized",
  "correlationId": "6",
  "timestamp": "2026-08-01T11:12:53.106Z",
  "path": "/terminology/concepts?q=X"
}
```

### 401 · token inválido

`GET /terminology/concepts?q=X` → **401**

```json
{
  "code": "UNAUTHENTICATED",
  "message": "Unauthorized",
  "correlationId": "7",
  "timestamp": "2026-08-01T11:12:53.108Z",
  "path": "/terminology/concepts?q=X"
}
```

### 403 · rol insuficiente para la operación

`POST /iam/users` → **403**

```json
{
  "code": "FORBIDDEN",
  "message": "Rol insuficiente para la operación",
  "correlationId": "10",
  "timestamp": "2026-08-01T11:12:53.221Z",
  "path": "/iam/users"
}
```

### 403 · el actor no pertenece a ningún tenant

`GET /terminology/concepts?q=X` → **403**

```json
{
  "code": "FORBIDDEN",
  "message": "El actor no pertenece a ningún tenant: indique X-Tenant-Id.",
  "correlationId": "13",
  "timestamp": "2026-08-01T11:12:53.285Z",
  "path": "/terminology/concepts?q=X"
}
```

### 404 · recurso inexistente

`POST /iam/users/00000000-0000-4000-8000-0000000000ff/lock` → **404**

```json
{
  "code": "NOT_FOUND",
  "message": "Usuario no encontrado",
  "correlationId": "14",
  "details": {
    "userId": "00000000-0000-4000-8000-0000000000ff"
  },
  "timestamp": "2026-08-01T11:12:53.288Z",
  "path": "/iam/users/00000000-0000-4000-8000-0000000000ff/lock"
}
```

### 404 · ruta inexistente

`GET /esta-ruta-no-existe` → **404**

```json
{
  "code": "NOT_FOUND",
  "message": "Cannot GET /esta-ruta-no-existe",
  "correlationId": "15",
  "timestamp": "2026-08-01T11:12:53.295Z",
  "path": "/esta-ruta-no-existe"
}
```

### 409 · valor único ya en uso

`POST /iam/users` → **409**

```json
{
  "code": "CONFLICT",
  "message": "El email ya tiene una credencial de contraseña activa",
  "correlationId": "17",
  "details": {
    "email": "dup-1785582773@example.test"
  },
  "timestamp": "2026-08-01T11:12:53.327Z",
  "path": "/iam/users"
}
```

### 422 · precondición de negocio

`POST /iam/auth/register-organization` → **422**

```json
{
  "code": "PRECONDITION_FAILED",
  "message": "Un tenant de tipo PAYER exige el bloque `payer`",
  "correlationId": "18",
  "details": {
    "tenantType": "PAYER"
  },
  "timestamp": "2026-08-01T11:12:53.356Z",
  "path": "/iam/auth/register-organization"
}
```

### 413 · cuerpo mayor que el límite de 1 MB

`POST /iam/auth/login` → **413**

```json
{
  "code": "PAYLOAD_TOO_LARGE",
  "message": "El cuerpo de la petición excede el tamaño máximo permitido",
  "timestamp": "2026-08-01T11:12:53.368Z",
  "path": "/iam/auth/login"
}
```

### 429 · límite de peticiones por minuto

`POST /iam/auth/login` → **429** · cabecera `Retry-After: 60`

```json
{
  "code": "RATE_LIMITED",
  "message": "ThrottlerException: Too Many Requests",
  "correlationId": "30",
  "timestamp": "2026-08-01T11:12:53.388Z",
  "path": "/iam/auth/login"
}
```

## Cómo consumirlo desde un cliente

Reglas para un interceptor de errores, en orden de importancia:

1. **Ramificar por `code`, nunca por `message`.** El `code` es un enum estable
   (`src/common/errors/error-codes.ts`); el mensaje está en español, pensado para humanos, y
   cambia sin previo aviso.
2. **`details` es opcional y su forma depende del código.** Hoy sólo `VALIDATION_FAILED` lo
   rellena de forma predecible, con `details.violations: string[]` — un mensaje por regla de
   `class-validator` incumplida. Los errores de negocio lo usan para identificar el recurso
   (`{ "userId": "…" }`), así que trátalo como `Record<string, unknown>` y no asumas claves.
   **Un error de integridad de la base no trae `details`**: la restricción, la tabla y el valor de
   la clave que falló describen el esquema y los datos, así que se registran en el log —localizables
   por `correlationId`— y no viajan en la respuesta.
3. **Un 404 puede no ser de negocio.** Una ruta inexistente devuelve el mismo envelope con
   `code: "NOT_FOUND"` y un mensaje de Express (`Cannot GET /…`). Si el cliente distingue "no
   existe el recurso" de "me equivoqué de URL", el discriminante es que el mensaje de negocio
   llega acompañado de `details`.
4. **`correlationId` es siempre una cadena**, aunque el generador de `pino-http` numere las
   peticiones: el filtro lo normaliza a texto porque es lo que declara el contrato. Conviene
   mostrarlo en la UI de error: es con lo que soporte encuentra la línea de log. **No siempre
   está**: el 413 lo omite, porque el cuerpo se rechaza en el parser antes de que la petición
   entre en el ciclo que asigna el id. Trátalo como `string | undefined`.
5. **429 sí trae `Retry-After`**, con los segundos que faltan para que se libere la ventana
   (`Retry-After: 60` en la captura). Es el valor a respetar antes de reintentar; no hace falta
   inventar un backoff.
6. **401 y 403 no son lo mismo.** 401 es "no hay sesión válida" → renovar token o ir al login.
   403 es "hay sesión pero no alcanza" → no reintentar, y sus dos variantes se distinguen por el
   mensaje: rol insuficiente frente a actor sin tenant.

## Códigos que no se pudieron capturar

Tres de los once códigos no aparecen abajo porque provocarlos exige romper algo a propósito:

- `CONCURRENCY_CONFLICT` (409) — exige dos escrituras simultáneas sobre el mismo agregado. Mismo
  envelope, con `message: "El recurso fue modificado por otra operación; reintente"`.
- `DEPENDENCY_UNAVAILABLE` (503) — lo emite la sonda de readiness cuando Postgres, Mongo, Redis u
  OpenSearch no responde.
- `INTERNAL` (500) — error no anticipado. Es el único cuyo cuerpo **no** lleva `details` ni
  información del fallo, por diseño: sólo `code`, mensaje genérico, `timestamp` y `path`.

## Regla de seguridad central

Los errores **5xx** (no anticipados) se registran en el log con el error completo (stack
incluido), pero el cuerpo devuelto al cliente **nunca** incluye stack trace, SQL ni mensaje
interno — solo `code: "INTERNAL"`, un mensaje genérico y el `correlationId` con el que soporte
localiza la línea de log real. Los errores `< 500` son fallos de negocio esperados y se registran
en `warn` con su contexto completo (fuente: comentario de diseño en
`src/common/filters/all-exceptions.filter.ts`).

## Excepciones de dominio (`src/common/errors/domain.exception.ts`)

Todas extienden `DomainException extends HttpException`, fijando `HttpStatus` + `ErrorCode` +
mensaje por defecto en español. Los servicios lanzan la subclase semántica
(`ResourceNotFoundException`, `ConflictException`, `PreconditionFailedException`,
`UnauthorizedException`, …) en vez de las excepciones genéricas de Nest, para que el contrato de
error sea uniforme entre los 57 módulos de negocio. Es, con diferencia, el patrón más reutilizado
del sistema: `ResourceNotFoundException` (386 usos), `PreconditionFailedException` (353) y
`ConflictException` (288) están entre los 10 nodos de mayor centralidad del grafo de dependencias
(`docs/reports/graphify-audit.md` §7).

## Estado en el contrato OpenAPI

El contrato generado declara `components.schemas.ErrorResponse` y diez respuestas reutilizables
para 400, 401, 403, 404, 409, 413, 422, 429, 500 y 503. El generador enlaza a cada operación únicamente
los estados transversales o de negocio aplicables según autenticación, método, parámetros de ruta y
presencia de cuerpo. Redocly valida las 872 operaciones sin advertencias de respuesta 4xx; el
envelope permanece centralizado para que cualquier evolución sea atómica.
