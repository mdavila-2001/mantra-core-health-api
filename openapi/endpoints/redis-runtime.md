<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `redis_runtime`

Referencia exhaustiva de 5 operación(es) del módulo `redis_runtime`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `redis-runtime`
- **Controladores:** `RedisRuntimeController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [POST /redis-runtime/cache](#1-post-redis-runtime-cache) — Escribir un valor en caché con TTL (namespaced por tenant)
2. [DELETE /redis-runtime/cache/{key}](#2-delete-redis-runtime-cache-key) — Borrar una clave de caché (namespaced por tenant)
3. [GET /redis-runtime/cache/{key}](#3-get-redis-runtime-cache-key) — Leer un valor de caché por clave (namespaced por tenant)
4. [POST /redis-runtime/locks](#4-post-redis-runtime-locks) — Adquirir un lock distribuido (SET NX PX + token)
5. [DELETE /redis-runtime/locks/{key}](#5-delete-redis-runtime-locks-key) — Liberar un lock si el token coincide (CAS)

---

## 1. POST /redis-runtime/cache

- **Módulo:** `redis_runtime`
- **Etiqueta OpenAPI:** `redis-runtime`
- **Nombre:** Escribir un valor en caché con TTL (namespaced por tenant)
- **Operation ID:** `RedisRuntimeController_setCache`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [RedisRuntimeController.setCache](../../src/modules/redis_runtime/controllers/redis-runtime.controller.ts)

### Descripción de negocio

Escribir un valor en caché con TTL (namespaced por tenant). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Actualiza set cache.

### Descripción del sistema

NestJS resuelve `POST /redis-runtime/cache` en `RedisRuntimeController_setCache`. El controlador delega en `RedisRuntimeService.setWithTtl`. Valida el body como `SetCacheDto` y consume `application/json`. El tipo de retorno estático es `Promise<CacheWriteResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `SetCacheDto`; los campos opcionales se omiten.

```http
POST /redis-runtime/cache HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "key": "valor-ejemplo",
  "value": "valor-ejemplo",
  "ttlSec": 1
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PLATFORM_OPERATOR`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `key` | Sí | `string` | longitud mínima 1; longitud máxima 200; patrón runtime `REDIS_KEY_PATTERN` | Clave lógica (se namespacea por tenant) | `valor-ejemplo` |
| `value` | Sí | `string` | longitud máxima 65536 | Valor a almacenar (string) | `valor-ejemplo` |
| `ttlSec` | Sí | `number` | mínimo 1; máximo 2592000 | TTL en segundos | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /redis-runtime/cache HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "key": "valor-ejemplo",
  "value": "valor-ejemplo",
  "ttlSec": 1
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<CacheWriteResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CacheWriteResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CacheWriteResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CacheWriteResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CacheWriteResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CacheWriteResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CacheWriteResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CacheWriteResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CacheWriteResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CacheWriteResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "key": "valor-ejemplo",
  "ttlSec": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `key` | Sí | `string` | Sin restricción adicional declarada | Clave lógica escrita | `valor-ejemplo` |
| `ttlSec` | Sí | `number` | Sin restricción adicional declarada | TTL aplicado en segundos | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PLATFORM_OPERATOR. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Operación de runtime sin tenant en contexto | Excepción explícita en src/modules/redis_runtime/services/redis-runtime.service.ts |
| 422 | `PRECONDITION_FAILED` | Clave de runtime vacía | Excepción explícita en src/modules/redis_runtime/services/redis-runtime.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/redis-runtime/cache"
}
```

---

## 2. DELETE /redis-runtime/cache/{key}

- **Módulo:** `redis_runtime`
- **Etiqueta OpenAPI:** `redis-runtime`
- **Nombre:** Borrar una clave de caché (namespaced por tenant)
- **Operation ID:** `RedisRuntimeController_deleteCache`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [RedisRuntimeController.deleteCache](../../src/modules/redis_runtime/controllers/redis-runtime.controller.ts)

### Descripción de negocio

Borrar una clave de caché (namespaced por tenant). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Elimina o desactiva delete cache.

### Descripción del sistema

NestJS resuelve `DELETE /redis-runtime/cache/{key}` en `RedisRuntimeController_deleteCache`. El controlador delega en `RedisRuntimeService.del`. No recibe body. El tipo de retorno estático es `Promise<CacheDeleteResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `key` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
DELETE /redis-runtime/cache/valor-ejemplo HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PLATFORM_OPERATOR`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
DELETE /redis-runtime/cache/valor-ejemplo HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<CacheDeleteResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CacheDeleteResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CacheDeleteResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CacheDeleteResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<CacheDeleteResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CacheDeleteResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CacheDeleteResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CacheDeleteResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CacheDeleteResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CacheDeleteResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "key": "valor-ejemplo",
  "deleted": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `key` | Sí | `string` | Sin restricción adicional declarada | Valor de key mantenido por la instancia. | `valor-ejemplo` |
| `deleted` | Sí | `boolean` | Sin restricción adicional declarada | La clave existía y fue borrada | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PLATFORM_OPERATOR. | Roles/tenant/guards de autorización |
| 422 | `PRECONDITION_FAILED` | Operación de runtime sin tenant en contexto | Excepción explícita en src/modules/redis_runtime/services/redis-runtime.service.ts |
| 422 | `PRECONDITION_FAILED` | Clave de runtime vacía | Excepción explícita en src/modules/redis_runtime/services/redis-runtime.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/redis-runtime/cache/{key}"
}
```

---

## 3. GET /redis-runtime/cache/{key}

- **Módulo:** `redis_runtime`
- **Etiqueta OpenAPI:** `redis-runtime`
- **Nombre:** Leer un valor de caché por clave (namespaced por tenant)
- **Operation ID:** `RedisRuntimeController_getCache`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [RedisRuntimeController.getCache](../../src/modules/redis_runtime/controllers/redis-runtime.controller.ts)

### Descripción de negocio

Leer un valor de caché por clave (namespaced por tenant). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Obtiene get cache.

### Descripción del sistema

NestJS resuelve `GET /redis-runtime/cache/{key}` en `RedisRuntimeController_getCache`. El controlador delega en `RedisRuntimeService.get`. No recibe body. El tipo de retorno estático es `Promise<CacheReadResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `key` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /redis-runtime/cache/valor-ejemplo HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PLATFORM_OPERATOR`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /redis-runtime/cache/valor-ejemplo HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<CacheReadResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<CacheReadResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<CacheReadResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<CacheReadResponseDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<CacheReadResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<CacheReadResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<CacheReadResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CacheReadResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "key": "valor-ejemplo",
  "found": true,
  "value": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `key` | Sí | `string` | Sin restricción adicional declarada | Valor de key mantenido por la instancia. | `valor-ejemplo` |
| `found` | Sí | `boolean` | Sin restricción adicional declarada | Existe la clave y no ha expirado | `true` |
| `value` | No | `string` | admite null | Valor si existe | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PLATFORM_OPERATOR. | Roles/tenant/guards de autorización |
| 422 | `PRECONDITION_FAILED` | Operación de runtime sin tenant en contexto | Excepción explícita en src/modules/redis_runtime/services/redis-runtime.service.ts |
| 422 | `PRECONDITION_FAILED` | Clave de runtime vacía | Excepción explícita en src/modules/redis_runtime/services/redis-runtime.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/redis-runtime/cache/{key}"
}
```

---

## 4. POST /redis-runtime/locks

- **Módulo:** `redis_runtime`
- **Etiqueta OpenAPI:** `redis-runtime`
- **Nombre:** Adquirir un lock distribuido (SET NX PX + token)
- **Operation ID:** `RedisRuntimeController_acquireLock`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [RedisRuntimeController.acquireLock](../../src/modules/redis_runtime/controllers/redis-runtime.controller.ts)

### Descripción de negocio

Adquirir un lock distribuido (SET NX PX + token). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Ejecuta la operación acquire lock.

### Descripción del sistema

NestJS resuelve `POST /redis-runtime/locks` en `RedisRuntimeController_acquireLock`. El controlador delega en `RedisRuntimeService.acquireLock`. Valida el body como `AcquireLockDto` y consume `application/json`. El tipo de retorno estático es `Promise<LockAcquireResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `AcquireLockDto`; los campos opcionales se omiten.

```http
POST /redis-runtime/locks HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "key": "valor-ejemplo",
  "ttlSec": 1
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PLATFORM_OPERATOR`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `key` | Sí | `string` | longitud mínima 1; longitud máxima 200; patrón runtime `REDIS_KEY_PATTERN` | Clave del recurso a bloquear (namespaced por tenant) | `valor-ejemplo` |
| `ttlSec` | Sí | `number` | mínimo 1; máximo 3600 | Tiempo de vida del lock en segundos | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /redis-runtime/locks HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "key": "valor-ejemplo",
  "ttlSec": 1
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<LockAcquireResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<LockAcquireResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<LockAcquireResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<LockAcquireResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<LockAcquireResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<LockAcquireResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<LockAcquireResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<LockAcquireResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<LockAcquireResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `LockAcquireResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "key": "valor-ejemplo",
  "acquired": true,
  "token": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `key` | Sí | `string` | Sin restricción adicional declarada | Valor de key mantenido por la instancia. | `valor-ejemplo` |
| `acquired` | Sí | `boolean` | Sin restricción adicional declarada | Se obtuvo el lock | `true` |
| `token` | No | `string` | Sin restricción adicional declarada | Token del titular; requerido para liberar. Sólo si acquired=true | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PLATFORM_OPERATOR. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Operación de runtime sin tenant en contexto | Excepción explícita en src/modules/redis_runtime/services/redis-runtime.service.ts |
| 422 | `PRECONDITION_FAILED` | Clave de runtime vacía | Excepción explícita en src/modules/redis_runtime/services/redis-runtime.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/redis-runtime/locks"
}
```

---

## 5. DELETE /redis-runtime/locks/{key}

- **Módulo:** `redis_runtime`
- **Etiqueta OpenAPI:** `redis-runtime`
- **Nombre:** Liberar un lock si el token coincide (CAS)
- **Operation ID:** `RedisRuntimeController_releaseLock`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [RedisRuntimeController.releaseLock](../../src/modules/redis_runtime/controllers/redis-runtime.controller.ts)

### Descripción de negocio

Liberar un lock si el token coincide (CAS). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Ejecuta la operación release lock.

### Descripción del sistema

NestJS resuelve `DELETE /redis-runtime/locks/{key}` en `RedisRuntimeController_releaseLock`. El controlador delega en `RedisRuntimeService.releaseLock`. No recibe body. El tipo de retorno estático es `Promise<LockReleaseResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `key` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |
| `token` | query | Sí | `string` | Sin restricción adicional declarada | Token devuelto al adquirir el lock (CAS de liberación) | `valor-ejemplo` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
DELETE /redis-runtime/locks/valor-ejemplo?token=valor-ejemplo HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PLATFORM_OPERATOR`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
DELETE /redis-runtime/locks/valor-ejemplo?token=valor-ejemplo HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<LockReleaseResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<LockReleaseResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<LockReleaseResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<LockReleaseResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<LockReleaseResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<LockReleaseResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<LockReleaseResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<LockReleaseResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<LockReleaseResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `LockReleaseResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "key": "valor-ejemplo",
  "released": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `key` | Sí | `string` | Sin restricción adicional declarada | Valor de key mantenido por la instancia. | `valor-ejemplo` |
| `released` | Sí | `boolean` | Sin restricción adicional declarada | Se liberó el lock (el token coincidía) | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PLATFORM_OPERATOR. | Roles/tenant/guards de autorización |
| 422 | `PRECONDITION_FAILED` | Operación de runtime sin tenant en contexto | Excepción explícita en src/modules/redis_runtime/services/redis-runtime.service.ts |
| 422 | `PRECONDITION_FAILED` | Clave de runtime vacía | Excepción explícita en src/modules/redis_runtime/services/redis-runtime.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/redis-runtime/locks/{key}"
}
```

---

