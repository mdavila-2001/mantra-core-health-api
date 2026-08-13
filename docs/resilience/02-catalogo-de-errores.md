# Catálogo de errores

Todos los códigos que la API puede devolver en el campo `code` del cuerpo de
error. Son **parte del contrato**: un cliente puede ramificar sobre `code` sin
parsear mensajes, que están pensados para humanos y pueden cambiar de redacción o
de idioma.

Fuente de verdad: [`src/common/errors/error-codes.ts`](https://github.com/mdavila-2001/mantra-core-health-redesa-api/blob/master/src/common/errors/error-codes.ts).
Este documento no puede divergir de ese enum; si lo hace, manda el código.

## Forma del cuerpo de error

Todo fallo, sin excepción, sale por `AllExceptionsFilter` con esta forma:

```json
{
  "code": "CONCURRENCY_CONFLICT",
  "message": "La operación entró en conflicto con otra concurrente; reintente",
  "correlationId": "9451",
  "details": { "constraint": "...", "table": "...", "column": "..." },
  "timestamp": "2026-08-06T14:22:31.004Z",
  "path": "/scheduling/appointments"
}
```

- `correlationId` — el `req.id` que asignó pino, normalizado a texto. Es lo que
  soporte necesita para encontrar la línea de log exacta.
- La cabecera `x-trace-id` acompaña a **toda** respuesta, incluidas las
  rechazadas por un guard antes de llegar a los interceptores.
- `details` sólo aparece cuando aporta algo accionable (violaciones de
  validación, columna y restricción implicadas). Nunca lleva SQL, stack ni
  nombres de host.

## Regla de exposición de los 5xx

Los 5xx se ocultan por defecto: son fallos no anticipados y su mensaje puede
llevar SQL, rutas o nombres internos. El cuerpo se sustituye por
`INTERNAL` / «Error interno del servidor» y el error completo queda sólo en el
log, localizable por `correlationId`.

**Cuatro códigos son la excepción** y conservan su cuerpo: `DEPENDENCY_UNAVAILABLE`,
`TIMEOUT`, `CIRCUIT_OPEN` y `CONCURRENCY_LIMIT`. No son «algo se rompió» sino
estados operativos que el filtro ha reconocido y cuyo texto está escrito para ser
leído por un cliente. La diferencia es práctica: **los cuatro significan
"reintenta"**, y un `INTERNAL` opaco significa lo contrario.

---

## Catálogo

### Errores de la petición (4xx)

#### `VALIDATION_FAILED`

| | |
| --- | --- |
| **HTTP** | 400 |
| **Origen** | `ValidationPipe` global; violación de `NOT NULL` (`23502`), `CHECK` (`23514`) o valor no perteneciente a un enum (`22P02`) |
| **Significado técnico** | El cuerpo o los parámetros no satisfacen el contrato |
| **Significado para el usuario** | «Revisá los datos del formulario» |
| **Recuperable** | Sí, corrigiendo la petición |
| **Automático** | No — reintentar sin cambiar nada nunca funciona |
| **Acción** | Corregir el cuerpo. `details.violations` lista los campos incumplidos |
| **Log** | `warn` (con la restricción de base bajo `integrity`, que **no** viaja al cliente) |

> **Cambio 2026-08-12.** La clave foránea inexistente (`23503`) salía por aquí
> con 422 y este mismo código, que el contrato publica como 400: el cliente
> recibía `VALIDATION_FAILED` tanto para "el cuerpo no cumple el DTO" como para
> "el identificador apunta a algo que no existe", y no podía distinguirlos. Pasó
> a `PRECONDITION_FAILED` (422). Además, `constraint`/`table`/`column` y el
> `detail` de PostgreSQL —que incluye el **valor** de la clave que falló— dejaron
> de enviarse al cliente: van al log, localizables por `correlationId`.

#### `PRECONDITION_FAILED` · referencia inexistente

| | |
| --- | --- |
| **HTTP** | 422 |
| **Origen** | Violación de clave foránea (`23503`), por SQLSTATE crudo o por `ForeignKeyConstraintViolationException` |
| **Significado técnico** | El cuerpo es válido en forma, pero uno de sus identificadores no corresponde a ninguna fila |
| **Significado para el usuario** | «El elemento seleccionado ya no existe» |
| **Recuperable** | Sí, con otro identificador; reintentar el mismo cuerpo nunca funciona |
| **Acción** | Volver a resolver el identificador (recargar el listado de origen) |
| **Log** | `warn`, con `integrity.constraint`/`integrity.table` para soporte |

#### `UNAUTHENTICATED`

| | |
| --- | --- |
| **HTTP** | 401 |
| **Origen** | `JwtAuthGuard` |
| **Significado** | Falta el token, está caducado o su firma no valida |
| **Acción** | Refrescar el token (`POST /iam/auth/refresh`) o volver a autenticarse |
| **Log** | `warn` |

#### `FORBIDDEN`

| | |
| --- | --- |
| **HTTP** | 403 |
| **Origen** | `RolesGuard`, `TenantContextInterceptor` |
| **Significado** | Autenticado, pero sin el rol necesario o fuera del tenant al que pertenece el recurso |
| **Acción** | Ninguna del lado del cliente: es un muro sin salida. Requiere que un administrador conceda el rol o la membresía |
| **Log** | `warn` |

#### `IDENTITY_VERIFICATION_REQUIRED`

| | |
| --- | --- |
| **HTTP** | 403 |
| **Origen** | `VerifiedIdentityGuard` |
| **Significado** | Autenticado y con rol suficiente, pero la identidad no está verificada |
| **Por qué es un código propio** | Los dos son 403 y para la persona son estados **opuestos**: rol insuficiente es un muro; identidad sin verificar es una puerta, y hay algo que puede hacer al respecto. Sin este código, el cliente sólo podía separarlos comparando el texto del mensaje, que este mismo contrato declara inestable |
| **Acción** | Ofrecer el flujo de verificación de identidad |
| **Log** | `warn` |

#### `NOT_FOUND`

| | |
| --- | --- |
| **HTTP** | 404 |
| **Origen** | `ResourceNotFoundException` de dominio |
| **Acción** | No reintentar. Verificar el identificador |
| **Log** | `warn` |

#### `CONFLICT`

| | |
| --- | --- |
| **HTTP** | 409 |
| **Origen** | `ConflictException` de dominio; `UniqueConstraintViolationException`; SQLSTATE `23505` |
| **Significado** | El recurso ya existe, o el estado actual no admite la operación |
| **Acción** | No reintentar sin cambiar la petición. Si viene de una clave de idempotencia, **el 409 es la respuesta correcta**: la operación original ya se ejecutó |
| **Log** | `warn` |

#### `PRECONDITION_FAILED`

| | |
| --- | --- |
| **HTTP** | 422 |
| **Origen** | `PreconditionFailedException` de dominio |
| **Significado** | La petición es sintácticamente válida pero viola una regla de negocio (p. ej. reservar un turno en el pasado) |
| **Acción** | No reintentar. El mensaje describe la regla |
| **Log** | `warn` |

#### `CONCURRENCY_CONFLICT`

| | |
| --- | --- |
| **HTTP** | 409 |
| **Origen** | Colisión de versión optimista de MikroORM; `DeadlockException`; SQLSTATE `40001` (fallo de serialización), `40P01` (interbloqueo), `55P03` (fila bloqueada) |
| **Significado** | La operación es **válida**; otra concurrente se le adelantó o entró en interbloqueo |
| **Recuperable** | Sí |
| **Automático** | **Sí — reintentar es la acción correcta** |
| **Acción** | Reintentar con backoff. Si viene de versión optimista, releer el recurso antes |
| **Por qué importa** | Hasta 2026-08-06 estos casos salían como `500 INTERNAL` y el cliente dejaba de reintentar justo cuando reintentar funcionaba. Ver [R-05](01-matriz-de-riesgos.md#r-05) |
| **Monitoreo** | Una tasa creciente indica contención real que conviene atacar en el diseño de la transacción, no en el cliente |
| **Log** | `warn` |

#### `PAYLOAD_TOO_LARGE`

| | |
| --- | --- |
| **HTTP** | 413 |
| **Origen** | `express.json({ limit: '1mb' })` |
| **Acción** | Las cargas grandes (imágenes, DICOM) van por el flujo de almacenamiento de objetos, no por el cuerpo JSON |
| **Log** | `warn` |

#### `RATE_LIMITED`

| | |
| --- | --- |
| **HTTP** | 429 |
| **Origen** | `ThrottlerGuard` (global: 300/min; estricto en login y refresh) |
| **Recuperable** | Sí, esperando |
| **Automático** | Sí, respetando `Retry-After` si viene |
| **Limitación conocida** | Almacenamiento en memoria por instancia: con N réplicas el límite efectivo es N × 300. Ver [R-13](01-matriz-de-riesgos.md#r-13) |
| **Log** | `warn` |

---

### Errores operativos (5xx, cuerpo expuesto)

Los cuatro significan **reintenta**. Los cuatro conservan su cuerpo.

#### `DEPENDENCY_UNAVAILABLE`

| | |
| --- | --- |
| **HTTP** | 503 |
| **Origen** | `AppReadinessService` (una de las 4 dependencias obligatorias caída); `ConnectionException` de MikroORM; SQLSTATE `53300` (sin conexiones), `53200` (sin memoria), `57P03` (base arrancando) |
| **Significado** | La dependencia no está accesible o no admite más trabajo ahora |
| **Automático** | Sí, con backoff |
| **Acción del operador** | `GET /readiness` de la API dice **cuál** dependencia y con qué latencia |
| **Log** | `error` |
| **Alerta** | Sí — si persiste más de 1 minuto |

#### `TIMEOUT`

| | |
| --- | --- |
| **HTTP** | 504 (408 en el caso de petición del cliente) |
| **Origen** | `OperationTimeoutError` del kernel de resiliencia; SQLSTATE `57014` (`statement_timeout`) |
| **Significado** | La operación excedió su plazo y se abortó |
| **Advertencia importante** | **No es sinónimo de fallo.** El trabajo puede haberse ejecutado del otro lado y sólo haberse perdido la respuesta. Un cliente que reintente **debe** hacerlo con la misma clave de idempotencia |
| **Automático** | Sí, con idempotencia; **no** sin ella |
| **Log** | `error` |

#### `CIRCUIT_OPEN`

| | |
| --- | --- |
| **HTTP** | 503 |
| **Origen** | `CircuitBreaker` de `common/resilience` |
| **Significado** | El cortacircuitos de una dependencia está abierto: se rechaza **sin intentar** la llamada |
| **Por qué no es un fallo** | Es un rechazo deliberado y barato para no sumar carga a algo que ya está caído. `details.retryAfterMs` indica cuándo volverá a probarse |
| **Automático** | Sí, esperando `retryAfterMs` |
| **Acción del operador** | `GET :9100/status` del worker afectado muestra el estado del circuito, su tasa de fallo y su ventana |
| **Log** | `warn` en cada transición de estado, incluida la de cierre — «el circuito volvió a cerrar a las 03:14» es la línea que fecha el fin de la degradación |
| **Alerta** | Sí — si lleva abierto más de 5 minutos |

#### `CONCURRENCY_LIMIT`

| | |
| --- | --- |
| **HTTP** | 503 |
| **Origen** | `Bulkhead` de `common/resilience` |
| **Significado** | El mamparo está lleno: hay demasiadas operaciones **en vuelo** |
| **Diferencia con `RATE_LIMITED`** | `RATE_LIMITED` cuenta peticiones por ventana de tiempo y protege la cuota del cliente. Esto cuenta operaciones simultáneas y protege el pool de conexiones y la memoria del proceso |
| **Automático** | Sí, con backoff |
| **Log** | `error` |

---

### Fallo no anticipado

#### `INTERNAL`

| | |
| --- | --- |
| **HTTP** | 500 |
| **Origen** | Cualquier excepción que el filtro no reconoce |
| **Cuerpo** | Siempre sanitizado: mensaje genérico, sin `details`, sin stack, sin SQL |
| **Recuperable** | Desconocido — por definición |
| **Acción del cliente** | Reportar el `correlationId` a soporte |
| **Acción del operador** | Buscar `correlationId` en el agregador de logs; ahí está el error completo con stack. La cabecera `x-trace-id` lleva a la traza en Jaeger |
| **Log** | `error` con `err` completo |
| **Alerta** | Sí — cualquier tasa sostenida de `INTERNAL` es un defecto sin diagnosticar, no un estado operativo |

---

## Errores que no llegan al cliente

Ocurren en los workers, que no atienden tráfico HTTP externo. Se listan porque
aparecen en los logs y en `GET :9100/status`.

| Situación | Dónde aparece | Qué significa | Acción |
| --- | --- | --- | --- |
| `Tick omitido: la ejecución anterior sigue en vuelo` | log `warn`, contador `skipped` | El intervalo del job está por debajo de lo que su trabajo tarda | Si es sostenido, subir el intervalo o escalar el worker |
| `Worker tick timed out` | log `error`, contador `timeouts` | El tick excedió `WORKER_TICK_TIMEOUT_MS` y se abortó | Investigar qué operación se bloqueó; la traza tiene el `executionId` |
| `Worker tick failed` | log `error`, `consecutiveFailures` | El tick falló por una causa que no es plazo | Si `consecutiveFailures` no baja, hay un fallo persistente |
| `Worker tick unit failed` | log `error` | Falló **un elemento** de un lote; el resto continuó | Diagnóstico por elemento |
| `Cortacircuitos de la API: X → Y` | log `warn` | Transición de estado del circuito | Ver `CIRCUIT_OPEN` |
| `Apagado: se agotó el plazo de drenaje…` | log `error` | Ticks cortados a la mitad durante el apagado | Los ticks que nombra son los primeros sitios donde buscar duplicados o registros reclamados por nadie |
| `El apagado excedió su plazo: se fuerza la salida` | log `fatal` | El drenaje se atascó; el proceso salió con código 1 | `pending` dice qué seguía en vuelo |
| `Excepción no capturada` / `Promesa rechazada sin manejador` | log `fatal` | Ver [R-06](01-matriz-de-riesgos.md#r-06) | Alerta inmediata |
| `PROVIDER_NOT_CONFIGURED` | log `error` del job | El adapter de proveedor externo no está conectado. **Falla visible en vez de fingir éxito** — es el comportamiento deseado | Configurar el proveedor o el emulador |
| `Puerto de la sonda del worker ocupado` | log `warn` | Dos workers en la misma máquina fuera de Docker. El worker funciona, pero sin sonda | Normal en desarrollo; en producción no debería ocurrir |

## Invariante

**No debe existir un error silencioso.** Todo camino de fallo de este sistema
termina en una de estas tres cosas: una respuesta HTTP con código estable, una
línea de log estructurada con su nivel, o un span marcado como fallido. La única
absorción deliberada de errores es la de `runTick` —un tick que lanza tumbaría el
scheduler entero de `@nestjs/schedule`, que no atrapa los errores de las funciones
que registra— y está compensada: el error se registra, el span se marca con
`recordException` y el contador de salud sube.
