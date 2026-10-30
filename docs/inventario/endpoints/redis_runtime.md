<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `redis_runtime`

- **Bloque:** —
- **Operaciones:** 6 (5 en el contrato, 1 sólo en el código)
- **Riesgo:** ALTO 0 · MEDIO 0 · BAJO 6
- **Tablas distintas que tocan:** 0
- **Respuestas de error y detalle contractual:** `openapi/endpoints/redis-runtime.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | DESCONOCIDO | `/redis-runtime` | Tenant del contexto; obligatorio para acotar cualquier operación. | BAJO | 0 | sesión (sin roles) |
| 2 | POST | `/redis-runtime/cache` | Escribir un valor en caché con TTL (namespaced por tenant) | BAJO | 0 | PLATFORM_OPERATOR |
| 3 | DELETE | `/redis-runtime/cache/{key}` | Borrar una clave de caché (namespaced por tenant) | BAJO | 0 | PLATFORM_OPERATOR |
| 4 | GET | `/redis-runtime/cache/{key}` | Leer un valor de caché por clave (namespaced por tenant) | BAJO | 0 | PLATFORM_OPERATOR |
| 5 | POST | `/redis-runtime/locks` | Adquirir un lock distribuido (SET NX PX + token) | BAJO | 0 | PLATFORM_OPERATOR |
| 6 | DELETE | `/redis-runtime/locks/{key}` | Liberar un lock si el token coincide (CAS) | BAJO | 0 | PLATFORM_OPERATOR |

---

## 1. DESCONOCIDO /redis-runtime

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** Tenant del contexto; obligatorio para acotar cualquier operación.
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `RedisRuntimeController.requireTenant` — `src/modules/redis_runtime/controllers/redis-runtime.controller.ts:44`

### Qué es y para qué sirve (negocio)

Tenant del contexto; obligatorio para acotar cualquier operación.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`DESCONOCIDO /redis-runtime` la atiende `RedisRuntimeController.requireTenant` (src/modules/redis_runtime/controllers/redis-runtime.controller.ts:44). Exige sesión; el controlador no declara roles. No toca tablas relacionales: el handler no invoca ningún servicio.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/redis_runtime/controllers/redis-runtime.controller.ts:44` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:278` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:145` |

### Tablas que afecta

No toca tablas relacionales: el handler no invoca ningún servicio. _(automática; fuente: `src/modules/redis_runtime/controllers/redis-runtime.controller.ts:44`)_

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `string`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere X-Tenant-Id para operar sobre el runtime |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/redis_runtime.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- MÓDULO 56 — `redis_runtime` — etapa `ctrl:RedisRuntimeController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 2. POST /redis-runtime/cache

- **Origen:** CONTRATO
- **Nombre:** Escribir un valor en caché con TTL (namespaced por tenant)
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `RedisRuntimeController.setCache` — `src/modules/redis_runtime/controllers/redis-runtime.controller.ts:64`

### Qué es y para qué sirve (negocio)

Escribir un valor en caché con TTL (namespaced por tenant).

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`POST /redis-runtime/cache` la atiende `RedisRuntimeController.setCache` (src/modules/redis_runtime/controllers/redis-runtime.controller.ts:64). Exige sesión con alguno de los roles PLATFORM_OPERATOR. Valida el cuerpo como `SetCacheDto` (3 campos, 3 obligatorios). Delega en `RedisRuntimeService.setWithTtl`. No toca tablas relacionales: opera sobre Redis, no sobre tablas relacionales.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PLATFORM_OPERATOR | `src/modules/redis_runtime/controllers/redis-runtime.controller.ts:64` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:278` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:145` |

### Tablas que afecta

No toca tablas relacionales: opera sobre Redis, no sobre tablas relacionales. _(automática; fuente: `docs/reports/system-inventory.md §2`)_

### Cuerpo — DTO `SetCacheDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `key` | `string` | Sí | longitud mínima 1; longitud máxima 200; patrón runtime REDIS_KEY_PATTERN | `@IsString()` `@MinLength(1)` `@MaxLength(200)` `@Matches(REDIS_KEY_PATTERN, { message: 'La clave sólo admite [A-Za-z0-9._:-]', })` | Clave lógica (se namespacea por tenant) | `src/modules/redis_runtime/dto/set-cache.dto.ts:34` |
| `value` | `string` | Sí | longitud máxima 65536 | `@IsString()` `@MaxLength(65536)` | Valor a almacenar (string) | `src/modules/redis_runtime/dto/set-cache.dto.ts:42` |
| `ttlSec` | `number` | Sí | mínimo 1; máximo 2592000 | `@IsInt()` `@Min(1)` `@Max(2592000)` | TTL en segundos | `src/modules/redis_runtime/dto/set-cache.dto.ts:51` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "key": "valor-ejemplo",
  "value": "valor-ejemplo",
  "ttlSec": 1
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "key": "valor-ejemplo",
  "value": "valor-ejemplo",
  "ttlSec": 1
}
```

</details>

### Respuesta — `Promise<CacheWriteResponseDto>` · DTO `CacheWriteResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `key` | `string` | Sí | — | — | Clave lógica escrita | `src/modules/redis_runtime/dto/redis-responses.dto.ts:8` |
| `ttlSec` | `number` | Sí | — | — | TTL aplicado en segundos | `src/modules/redis_runtime/dto/redis-responses.dto.ts:12` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere X-Tenant-Id para operar sobre el runtime |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Operación de runtime sin tenant en contexto; PreconditionFailedException: Clave de runtime vacía |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/redis_runtime.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/redis-runtime.int-spec.ts:31` |

### Flujos

- MÓDULO 56 — `redis_runtime` — etapa `ctrl:RedisRuntimeController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 3. DELETE /redis-runtime/cache/{key}

- **Origen:** CONTRATO
- **Nombre:** Borrar una clave de caché (namespaced por tenant)
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `RedisRuntimeController.deleteCache` — `src/modules/redis_runtime/controllers/redis-runtime.controller.ts:103`

### Qué es y para qué sirve (negocio)

Borrar una clave de caché (namespaced por tenant).

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`DELETE /redis-runtime/cache/{key}` la atiende `RedisRuntimeController.deleteCache` (src/modules/redis_runtime/controllers/redis-runtime.controller.ts:103). Exige sesión con alguno de los roles PLATFORM_OPERATOR. Delega en `RedisRuntimeService.del`. No toca tablas relacionales: opera sobre Redis, no sobre tablas relacionales.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PLATFORM_OPERATOR | `src/modules/redis_runtime/controllers/redis-runtime.controller.ts:103` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:278` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:145` |

### Tablas que afecta

No toca tablas relacionales: opera sobre Redis, no sobre tablas relacionales. _(automática; fuente: `docs/reports/system-inventory.md §2`)_

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `key` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<CacheDeleteResponseDto>` · DTO `CacheDeleteResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `key` | `string` | Sí | — | — | Valor de key mantenido por la instancia. | `src/modules/redis_runtime/dto/redis-responses.dto.ts:38` |
| `deleted` | `boolean` | Sí | — | — | La clave existía y fue borrada | `src/modules/redis_runtime/dto/redis-responses.dto.ts:43` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere X-Tenant-Id para operar sobre el runtime |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Operación de runtime sin tenant en contexto; PreconditionFailedException: Clave de runtime vacía |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/redis_runtime.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/redis-runtime.int-spec.ts:76` |

### Flujos

- MÓDULO 56 — `redis_runtime` — etapa `ctrl:RedisRuntimeController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 4. GET /redis-runtime/cache/{key}

- **Origen:** CONTRATO
- **Nombre:** Leer un valor de caché por clave (namespaced por tenant)
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `RedisRuntimeController.getCache` — `src/modules/redis_runtime/controllers/redis-runtime.controller.ts:86`

### Qué es y para qué sirve (negocio)

Leer un valor de caché por clave (namespaced por tenant).

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /redis-runtime/cache/{key}` la atiende `RedisRuntimeController.getCache` (src/modules/redis_runtime/controllers/redis-runtime.controller.ts:86). Exige sesión con alguno de los roles PLATFORM_OPERATOR. Delega en `RedisRuntimeService.get`. No toca tablas relacionales: opera sobre Redis, no sobre tablas relacionales.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PLATFORM_OPERATOR | `src/modules/redis_runtime/controllers/redis-runtime.controller.ts:86` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:278` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:145` |

### Tablas que afecta

No toca tablas relacionales: opera sobre Redis, no sobre tablas relacionales. _(automática; fuente: `docs/reports/system-inventory.md §2`)_

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `key` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<CacheReadResponseDto>` · DTO `CacheReadResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `key` | `string` | Sí | — | — | Valor de key mantenido por la instancia. | `src/modules/redis_runtime/dto/redis-responses.dto.ts:20` |
| `found` | `boolean` | Sí | — | — | Existe la clave y no ha expirado | `src/modules/redis_runtime/dto/redis-responses.dto.ts:25` |
| `value` | `string` | No | admite null | — | Valor si existe | `src/modules/redis_runtime/dto/redis-responses.dto.ts:30` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere X-Tenant-Id para operar sobre el runtime |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Operación de runtime sin tenant en contexto; PreconditionFailedException: Clave de runtime vacía |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/redis_runtime.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/redis-runtime.int-spec.ts:46` |

### Flujos

- MÓDULO 56 — `redis_runtime` — etapa `ctrl:RedisRuntimeController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 5. POST /redis-runtime/locks

- **Origen:** CONTRATO
- **Nombre:** Adquirir un lock distribuido (SET NX PX + token)
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `RedisRuntimeController.acquireLock` — `src/modules/redis_runtime/controllers/redis-runtime.controller.ts:128`

### Qué es y para qué sirve (negocio)

Adquirir un lock distribuido (SET NX PX + token).

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`POST /redis-runtime/locks` la atiende `RedisRuntimeController.acquireLock` (src/modules/redis_runtime/controllers/redis-runtime.controller.ts:128). Exige sesión con alguno de los roles PLATFORM_OPERATOR. Valida el cuerpo como `AcquireLockDto` (2 campos, 2 obligatorios). Delega en `RedisRuntimeService.acquireLock`. No toca tablas relacionales: opera sobre Redis, no sobre tablas relacionales.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PLATFORM_OPERATOR | `src/modules/redis_runtime/controllers/redis-runtime.controller.ts:128` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:278` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:145` |

### Tablas que afecta

No toca tablas relacionales: opera sobre Redis, no sobre tablas relacionales. _(automática; fuente: `docs/reports/system-inventory.md §2`)_

### Cuerpo — DTO `AcquireLockDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `key` | `string` | Sí | longitud mínima 1; longitud máxima 200; patrón runtime REDIS_KEY_PATTERN | `@IsString()` `@MinLength(1)` `@MaxLength(200)` `@Matches(REDIS_KEY_PATTERN, { message: 'La clave sólo admite [A-Za-z0-9._:-]', })` | Clave del recurso a bloquear (namespaced por tenant) | `src/modules/redis_runtime/dto/acquire-lock.dto.ts:28` |
| `ttlSec` | `number` | Sí | mínimo 1; máximo 3600 | `@IsInt()` `@Min(1)` `@Max(3600)` | Tiempo de vida del lock en segundos | `src/modules/redis_runtime/dto/acquire-lock.dto.ts:41` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "key": "valor-ejemplo",
  "ttlSec": 1
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "key": "valor-ejemplo",
  "ttlSec": 1
}
```

</details>

### Respuesta — `Promise<LockAcquireResponseDto>` · DTO `LockAcquireResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `key` | `string` | Sí | — | — | Valor de key mantenido por la instancia. | `src/modules/redis_runtime/dto/redis-responses.dto.ts:51` |
| `acquired` | `boolean` | Sí | — | — | Se obtuvo el lock | `src/modules/redis_runtime/dto/redis-responses.dto.ts:55` |
| `token` | `string` | No | — | — | Token del titular; requerido para liberar. Sólo si acquired=true | `src/modules/redis_runtime/dto/redis-responses.dto.ts:63` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere X-Tenant-Id para operar sobre el runtime |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Operación de runtime sin tenant en contexto; PreconditionFailedException: Clave de runtime vacía |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/redis_runtime.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/redis-runtime.int-spec.ts:91` |

### Flujos

- MÓDULO 56 — `redis_runtime` — etapa `ctrl:RedisRuntimeController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 6. DELETE /redis-runtime/locks/{key}

- **Origen:** CONTRATO
- **Nombre:** Liberar un lock si el token coincide (CAS)
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `RedisRuntimeController.releaseLock` — `src/modules/redis_runtime/controllers/redis-runtime.controller.ts:155`

### Qué es y para qué sirve (negocio)

Liberar un lock si el token coincide (CAS).

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`DELETE /redis-runtime/locks/{key}` la atiende `RedisRuntimeController.releaseLock` (src/modules/redis_runtime/controllers/redis-runtime.controller.ts:155). Exige sesión con alguno de los roles PLATFORM_OPERATOR. Delega en `RedisRuntimeService.releaseLock`. No toca tablas relacionales: opera sobre Redis, no sobre tablas relacionales.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PLATFORM_OPERATOR | `src/modules/redis_runtime/controllers/redis-runtime.controller.ts:155` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:278` |
| PARAMETRO_QUERY | token (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:145` |

### Tablas que afecta

No toca tablas relacionales: opera sobre Redis, no sobre tablas relacionales. _(automática; fuente: `docs/reports/system-inventory.md §2`)_

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `key` | path | Sí | `string` | — |
| `token` | query | Sí | `string` | Token devuelto al adquirir el lock (CAS de liberación) |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<LockReleaseResponseDto>` · DTO `LockReleaseResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `key` | `string` | Sí | — | — | Valor de key mantenido por la instancia. | `src/modules/redis_runtime/dto/redis-responses.dto.ts:71` |
| `released` | `boolean` | Sí | — | — | Se liberó el lock (el token coincidía) | `src/modules/redis_runtime/dto/redis-responses.dto.ts:76` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere X-Tenant-Id para operar sobre el runtime |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Operación de runtime sin tenant en contexto; PreconditionFailedException: Clave de runtime vacía |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/redis_runtime.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/redis-runtime.int-spec.ts:116` |

### Flujos

- MÓDULO 56 — `redis_runtime` — etapa `ctrl:RedisRuntimeController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

