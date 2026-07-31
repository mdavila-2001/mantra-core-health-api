# Logs

> Fase 14. Derivado de `src/logging/pino-options.ts` y `src/common/filters/all-exceptions.filter.ts`
> — no es una convención aspiracional, es lo que el código realmente produce.

## Formato

JSON estructurado (pino), una línea por evento. Formato legible (`pino-pretty`) solo si
`LOG_PRETTY=true` **y** el paquete está instalado — si no, cae a JSON sin tumbar el proceso
(comprobación explícita en código, `isPrettyAvailable()`).

## Niveles

`fatal` · `error` · `warn` · `info` · `debug` · `trace` · `silent` (estándar pino), controlado por
`LOG_LEVEL` (default `info`), validado al arranque — un valor inválido aborta el proceso en vez de
degradar en silencio.

## Campos garantizados

| Campo | Origen | Siempre presente |
|---|---|---|
| `level`, `time`, `msg` | pino estándar | Sí |
| `req.id` | `pino-http`, reusado como `correlationId` del [modelo de error](../api/error-model.md) | En requests HTTP |
| Mensajes de request en español | `customReceivedMessage`/`customSuccessMessage`/`customErrorMessage` — "petición recibida"/"petición completada"/"petición fallida" | En requests HTTP |

**No se confirmó en esta fase** que `tenant`/`actor`/`operación` viajen como campos estructurados
explícitos en cada línea (más allá de lo que el propio objeto `req` serializado incluya) — brecha
a cerrar si se requiere una consulta de log por tenant sin parsear el body del request.

## Redacción de secretos — lista de denegación explícita

`pino-options.ts` recorta estas rutas **antes** de escribir la línea de log (`remove: true`, no
`[Redacted]` — se elimina la clave por completo, sin dejar rastro de que existió):

```
req.headers.authorization
req.headers.cookie
req.headers["set-cookie"]
res.headers["set-cookie"]
req.body.password
req.body.currentPassword
req.body.newPassword
req.body.token
req.body.refreshToken
req.body.secret
req.body.otp
```

Justificación explícita en el propio código: sin esto, el header `authorization` (un Bearer
válido) y las cookies de sesión terminarían en texto plano en el agregador de logs — "en un
sistema de salud eso es una fuga de credenciales."

**Brecha real:** la lista es explícita por ruta conocida, no una heurística genérica — un campo
sensible nuevo (p. ej. `req.body.ssn`, `req.body.mfaCode`) **no se redacta automáticamente** a
menos que se añada a `REDACT_PATHS`. Es una decisión de diseño consciente (denegación explícita >
heurística que podría fallar), pero exige disciplina: todo campo sensible nuevo en un DTO debe
evaluarse contra esta lista.

## Redacción de PHI — no verificada

**No hay evidencia en el código de logging de una redacción específica de PHI** (nombre de
paciente, diagnóstico, etc.) más allá de la lista de credenciales de arriba. Si un servicio loguea
accidentalmente un objeto de dominio completo (p. ej. `this.logger.info(patient)`), el PHI podría
llegar al log. No se verificó en esta fase si existe una disciplina de código que lo prevenga
sistemáticamente — brecha real, candidata a lint rule o code review checklist.

## Registro temprano garantizado

`bufferLogs: true` en `NestFactory.create()` retiene todo log emitido durante el arranque
(incluida la materialización de DDL en `OnApplicationBootstrap`) hasta que el logger definitivo
(pino) se fija — sin esto, esos logs tempranos saldrían por el logger por defecto de Nest, no por
el pipeline estructurado.

## Ver también

- [Modelo de error](../api/error-model.md) — `correlationId` es el puente entre el log del
  servidor y lo que ve el cliente.
- [Métricas](metrics.md), [Trazas](tracing.md).
