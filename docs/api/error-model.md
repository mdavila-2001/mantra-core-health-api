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

| Campo | Tipo | Siempre presente | Origen |
|---|---|---|---|
| `code` | `string` (enum `ErrorCode`) | Sí | `src/common/errors/error-codes.ts` |
| `message` | `string` | Sí | Mensaje de negocio, pensado para humanos — no ramificar lógica de cliente sobre su texto, usar `code` |
| `correlationId` | `string` | Cuando `pino-http` asigna `req.id` o llega `x-request-id` | `AllExceptionsFilter.catch()` |
| `details` | `Record<string, unknown>` | No — depende de la excepción concreta | Contexto adicional específico del error (p. ej. campo inválido) |
| `timestamp` | `string` (ISO 8601) | Sí | `new Date().toISOString()` en el momento del error |
| `path` | `string` | Sí | `request.url` |

## Códigos de error (`ErrorCode`)

| `code` | HTTP status | Excepción de dominio | Significado |
|---|---:|---|---|
| `VALIDATION_FAILED` | 400 | (via `ValidationPipe` global) | El body/query no cumple los DTO/`class-validator` |
| `UNAUTHENTICATED` | 401 | `UnauthorizedException` (dominio) | JWT ausente o inválido |
| `FORBIDDEN` | 403 | (via `RolesGuard`/PDP clínico) | Rol o alcance clínico insuficiente |
| `NOT_FOUND` | 404 | `ResourceNotFoundException` | Recurso principal o relacionado inexistente |
| `CONFLICT` | 409 | `ConflictException` | Violación de unicidad o estado incompatible (duplicado, idempotencia) |
| `PRECONDITION_FAILED` | 412 | `PreconditionFailedException` | Precondición de negocio no satisfecha (estado del agregado, consentimiento vigente) |
| `CONCURRENCY_CONFLICT` | 409/412 | (optimistic locking, `row_version`) | Escritura concurrente sobre el mismo agregado |
| `INTERNAL` | 500 | — | Error no anticipado |

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

El componente de error reutilizable (`components.schemas.ErrorResponse` o equivalente) **no está
todavía enlazado a las 841 operaciones individuales** vía `@ApiResponse` — ver
`docs/reports/openapi-generation-notes.md` §6 (`operation-4xx-response`, 841 warnings aceptados en
esta fase). Esta página describe la forma real; conectarla operación por operación queda como
mejora de contenido para una fase posterior.
