<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `audio_assets`

Referencia exhaustiva de 10 operación(es) del módulo `audio_assets`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `audio-assets`, `audio-assets-internal`
- **Controladores:** `AudioAssetsController`, `AudioAssetsInternalController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [GET /audio-assets/{assetId}/content](#1-get-audio-assets-assetid-content) — Entrega bytes de un asset READY desde storage propio
2. [POST /audio-assets/resolve](#2-post-audio-assets-resolve) — Resuelve un asset TTS desde caché o agenda su generación
3. [POST /internal/audio-assets/{assetId}/deprecate](#3-post-internal-audio-assets-assetid-deprecate) — Depreca un asset no-fallback sin eliminarlo inmediatamente
4. [POST /internal/audio-assets/{assetId}/generated](#4-post-internal-audio-assets-assetid-generated) — Registra un asset de audio generado
5. [POST /internal/audio-assets/{assetId}/generation-failed](#5-post-internal-audio-assets-assetid-generation-failed) — Registra un fallo de generación de audio
6. [POST /internal/audio-assets/{assetId}/prepare-generation](#6-post-internal-audio-assets-assetid-prepare-generation) — Prepara un asset de audio para generación
7. [POST /internal/audio-assets/garbage-collect](#7-post-internal-audio-assets-garbage-collect) — Elimina conservadoramente objetos de assets deprecados/permanentes
8. [POST /internal/audio-assets/pregenerate](#8-post-internal-audio-assets-pregenerate) — Pre-genera STATIC, ENUMERATED y fallbacks de forma idempotente
9. [GET /internal/audio-assets/status](#9-get-internal-audio-assets-status) — Diagnóstico de audio sin convertir TTS en dependencia de readiness
10. [POST /internal/audio-assets/verify](#10-post-internal-audio-assets-verify) — Verifica existencia y checksum de assets READY

---

## 1. GET /audio-assets/{assetId}/content

- **Módulo:** `audio_assets`
- **Etiqueta OpenAPI:** `audio-assets`
- **Nombre:** Entrega bytes de un asset READY desde storage propio
- **Operation ID:** `AudioAssetsController_contentById`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AudioAssetsController.contentById](../../src/modules/audio_assets/controllers/audio-assets.controller.ts)

### Descripción de negocio

Entrega bytes de un asset READY desde storage propio. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /audio-assets/{assetId}/content` en `AudioAssetsController_contentById`. El controlador delega en `AudioContentService.get`. No recibe body. El tipo de retorno estático es `Promise<StreamableFile>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `assetId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /audio-assets/00000000-0000-4000-8000-000000000001/content HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `assetId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /audio-assets/00000000-0000-4000-8000-000000000001/content HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<StreamableFile>` | No |
| 400 | Consulta completada correctamente. | `Promise<StreamableFile>` | No |
| 401 | Consulta completada correctamente. | `Promise<StreamableFile>` | No |
| 403 | Consulta completada correctamente. | `Promise<StreamableFile>` | No |
| 404 | Consulta completada correctamente. | `Promise<StreamableFile>` | No |
| 429 | Consulta completada correctamente. | `Promise<StreamableFile>` | No |
| 500 | Consulta completada correctamente. | `Promise<StreamableFile>` | No |

El controlador declara `StreamableFile`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Asset de audio listo no encontrado | Excepción explícita en src/modules/audio_assets/audio-content.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/audio-assets/{assetId}/content"
}
```

---

## 2. POST /audio-assets/resolve

- **Módulo:** `audio_assets`
- **Etiqueta OpenAPI:** `audio-assets`
- **Nombre:** Resuelve un asset TTS desde caché o agenda su generación
- **Operation ID:** `AudioAssetsController_resolve`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AudioAssetsController.resolve](../../src/modules/audio_assets/controllers/audio-assets.controller.ts)

### Descripción de negocio

Resuelve un asset TTS desde caché o agenda su generación. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /audio-assets/resolve` en `AudioAssetsController_resolve`. El controlador delega en `AudioAssetsFacade.resolve`. Valida el body como `ResolveAudioAssetDto` y consume `application/json`. El tipo de retorno estático es `no declarado`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ResolveAudioAssetDto`; los campos opcionales se omiten.

```http
POST /audio-assets/resolve HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "templateKey": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `templateKey` | Sí | `string` | longitud máxima 160 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `variables` | No | `object` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"clave":"valor"}` |
| `requestedVersion` | No | `number` | mínimo 1 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `correlationId` | No | `string` | longitud máxima 128 | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /audio-assets/resolve HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "templateKey": "valor-ejemplo",
  "variables": {
    "clave": "valor"
  },
  "requestedVersion": 1,
  "correlationId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `no declarado` | No |
| 400 | Operación completada correctamente. | `no declarado` | No |
| 401 | Operación completada correctamente. | `no declarado` | No |
| 403 | Operación completada correctamente. | `no declarado` | No |
| 409 | Operación completada correctamente. | `no declarado` | No |
| 413 | Operación completada correctamente. | `no declarado` | No |
| 422 | Operación completada correctamente. | `no declarado` | No |
| 429 | Operación completada correctamente. | `no declarado` | No |
| 500 | Operación completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Plantilla de audio no encontrada | Excepción explícita en src/modules/audio_assets/application/resolve-audio-asset.use-case.ts |
| 404 | `NOT_FOUND` | Cola no encontrada | Excepción explícita en src/modules/messaging/services/queues.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La cola no está activa | Excepción explícita en src/modules/messaging/services/queues.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/audio-assets/resolve"
}
```

---

## 3. POST /internal/audio-assets/{assetId}/deprecate

- **Módulo:** `audio_assets`
- **Etiqueta OpenAPI:** `audio-assets-internal`
- **Nombre:** Depreca un asset no-fallback sin eliminarlo inmediatamente
- **Operation ID:** `AudioAssetsInternalController_deprecate`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AudioAssetsInternalController.deprecate](../../src/modules/audio_assets/controllers/audio-assets-internal.controller.ts)

### Descripción de negocio

Depreca un asset no-fallback sin eliminarlo inmediatamente. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /internal/audio-assets/{assetId}/deprecate` en `AudioAssetsInternalController_deprecate`. El controlador delega en `AudioMaintenanceService.deprecate`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `assetId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /internal/audio-assets/00000000-0000-4000-8000-000000000001/deprecate HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`.
- Deben ser UUID válidos: `assetId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /internal/audio-assets/00000000-0000-4000-8000-000000000001/deprecate HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `no declarado` | No |
| 400 | Operación completada correctamente. | `no declarado` | No |
| 401 | Operación completada correctamente. | `no declarado` | No |
| 403 | Operación completada correctamente. | `no declarado` | No |
| 404 | Operación completada correctamente. | `no declarado` | No |
| 409 | Operación completada correctamente. | `no declarado` | No |
| 422 | Operación completada correctamente. | `no declarado` | No |
| 429 | Operación completada correctamente. | `no declarado` | No |
| 500 | Operación completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/internal/audio-assets/{assetId}/deprecate"
}
```

---

## 4. POST /internal/audio-assets/{assetId}/generated

- **Módulo:** `audio_assets`
- **Etiqueta OpenAPI:** `audio-assets-internal`
- **Nombre:** Registra un asset de audio generado
- **Operation ID:** `AudioAssetsInternalController_generated`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AudioAssetsInternalController.generated](../../src/modules/audio_assets/controllers/audio-assets-internal.controller.ts)

### Descripción de negocio

Registra un asset de audio generado. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /internal/audio-assets/{assetId}/generated` en `AudioAssetsInternalController_generated`. El controlador delega en `AudioGenerationUseCase.generated`. Valida el body como `GeneratedAudioAssetDto` y consume `application/json`. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `assetId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `GeneratedAudioAssetDto`; los campos opcionales se omiten.

```http
POST /internal/audio-assets/00000000-0000-4000-8000-000000000001/generated HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "storageUri": "valor-ejemplo",
  "checksumSha256": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "bytes": 1
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`.
- Deben ser UUID válidos: `assetId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `storageUri` | Sí | `string` | longitud máxima 1024 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `checksumSha256` | Sí | `string` | longitud máxima 64 | Sin descripción específica en el contrato OpenAPI. | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |
| `bytes` | Sí | `number` | mínimo 1 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `durationMs` | No | `number` | mínimo 0 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `credits` | No | `number` | mínimo 0 | Sin descripción específica en el contrato OpenAPI. | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /internal/audio-assets/00000000-0000-4000-8000-000000000001/generated HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "storageUri": "valor-ejemplo",
  "checksumSha256": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "bytes": 1,
  "durationMs": 1,
  "credits": 1
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `no declarado` | No |
| 400 | Operación completada correctamente. | `no declarado` | No |
| 401 | Operación completada correctamente. | `no declarado` | No |
| 403 | Operación completada correctamente. | `no declarado` | No |
| 404 | Operación completada correctamente. | `no declarado` | No |
| 409 | Operación completada correctamente. | `no declarado` | No |
| 413 | Operación completada correctamente. | `no declarado` | No |
| 422 | Operación completada correctamente. | `no declarado` | No |
| 429 | Operación completada correctamente. | `no declarado` | No |
| 500 | Operación completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/internal/audio-assets/{assetId}/generated"
}
```

---

## 5. POST /internal/audio-assets/{assetId}/generation-failed

- **Módulo:** `audio_assets`
- **Etiqueta OpenAPI:** `audio-assets-internal`
- **Nombre:** Registra un fallo de generación de audio
- **Operation ID:** `AudioAssetsInternalController_failed`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AudioAssetsInternalController.failed](../../src/modules/audio_assets/controllers/audio-assets-internal.controller.ts)

### Descripción de negocio

Registra un fallo de generación de audio. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /internal/audio-assets/{assetId}/generation-failed` en `AudioAssetsInternalController_failed`. El controlador delega en `AudioGenerationUseCase.failed`. Valida el body como `FailedAudioAssetDto` y consume `application/json`. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `assetId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `FailedAudioAssetDto`; los campos opcionales se omiten.

```http
POST /internal/audio-assets/00000000-0000-4000-8000-000000000001/generation-failed HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO",
  "retryable": true
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`.
- Deben ser UUID válidos: `assetId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `code` | Sí | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `retryable` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `durationMs` | No | `number` | mínimo 0 | Sin descripción específica en el contrato OpenAPI. | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /internal/audio-assets/00000000-0000-4000-8000-000000000001/generation-failed HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO",
  "retryable": true,
  "durationMs": 1
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `no declarado` | No |
| 400 | Operación completada correctamente. | `no declarado` | No |
| 401 | Operación completada correctamente. | `no declarado` | No |
| 403 | Operación completada correctamente. | `no declarado` | No |
| 404 | Operación completada correctamente. | `no declarado` | No |
| 409 | Operación completada correctamente. | `no declarado` | No |
| 413 | Operación completada correctamente. | `no declarado` | No |
| 422 | Operación completada correctamente. | `no declarado` | No |
| 429 | Operación completada correctamente. | `no declarado` | No |
| 500 | Operación completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Asset de audio no encontrado | Excepción explícita en src/modules/audio_assets/application/audio-generation.use-case.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/internal/audio-assets/{assetId}/generation-failed"
}
```

---

## 6. POST /internal/audio-assets/{assetId}/prepare-generation

- **Módulo:** `audio_assets`
- **Etiqueta OpenAPI:** `audio-assets-internal`
- **Nombre:** Prepara un asset de audio para generación
- **Operation ID:** `AudioAssetsInternalController_prepare`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AudioAssetsInternalController.prepare](../../src/modules/audio_assets/controllers/audio-assets-internal.controller.ts)

### Descripción de negocio

Prepara un asset de audio para generación. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /internal/audio-assets/{assetId}/prepare-generation` en `AudioAssetsInternalController_prepare`. El controlador delega en `AudioGenerationUseCase.prepare`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `assetId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /internal/audio-assets/00000000-0000-4000-8000-000000000001/prepare-generation HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`.
- Deben ser UUID válidos: `assetId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /internal/audio-assets/00000000-0000-4000-8000-000000000001/prepare-generation HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `no declarado` | No |
| 400 | Operación completada correctamente. | `no declarado` | No |
| 401 | Operación completada correctamente. | `no declarado` | No |
| 403 | Operación completada correctamente. | `no declarado` | No |
| 404 | Operación completada correctamente. | `no declarado` | No |
| 409 | Operación completada correctamente. | `no declarado` | No |
| 422 | Operación completada correctamente. | `no declarado` | No |
| 429 | Operación completada correctamente. | `no declarado` | No |
| 500 | Operación completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Asset de audio no encontrado | Excepción explícita en src/modules/audio_assets/application/audio-generation.use-case.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/internal/audio-assets/{assetId}/prepare-generation"
}
```

---

## 7. POST /internal/audio-assets/garbage-collect

- **Módulo:** `audio_assets`
- **Etiqueta OpenAPI:** `audio-assets-internal`
- **Nombre:** Elimina conservadoramente objetos de assets deprecados/permanentes
- **Operation ID:** `AudioAssetsInternalController_garbageCollect`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AudioAssetsInternalController.garbageCollect](../../src/modules/audio_assets/controllers/audio-assets-internal.controller.ts)

### Descripción de negocio

Elimina conservadoramente objetos de assets deprecados/permanentes. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /internal/audio-assets/garbage-collect` en `AudioAssetsInternalController_garbageCollect`. El controlador delega en `AudioMaintenanceService.garbageCollect`. Valida el body como `AudioMaintenanceDto` y consume `application/json`. El tipo de retorno estático es `no declarado`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `AudioMaintenanceDto`; los campos opcionales se omiten.

```http
POST /internal/audio-assets/garbage-collect HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `limit` | No | `number` | mínimo 1; máximo 1000 | Sin descripción específica en el contrato OpenAPI. | `250` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /internal/audio-assets/garbage-collect HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "limit": 250
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `no declarado` | No |
| 400 | Operación completada correctamente. | `no declarado` | No |
| 401 | Operación completada correctamente. | `no declarado` | No |
| 403 | Operación completada correctamente. | `no declarado` | No |
| 409 | Operación completada correctamente. | `no declarado` | No |
| 413 | Operación completada correctamente. | `no declarado` | No |
| 422 | Operación completada correctamente. | `no declarado` | No |
| 429 | Operación completada correctamente. | `no declarado` | No |
| 500 | Operación completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/internal/audio-assets/garbage-collect"
}
```

---

## 8. POST /internal/audio-assets/pregenerate

- **Módulo:** `audio_assets`
- **Etiqueta OpenAPI:** `audio-assets-internal`
- **Nombre:** Pre-genera STATIC, ENUMERATED y fallbacks de forma idempotente
- **Operation ID:** `AudioAssetsInternalController_pregenerateAssets`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AudioAssetsInternalController.pregenerateAssets](../../src/modules/audio_assets/controllers/audio-assets-internal.controller.ts)

### Descripción de negocio

Pre-genera STATIC, ENUMERATED y fallbacks de forma idempotente. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /internal/audio-assets/pregenerate` en `AudioAssetsInternalController_pregenerateAssets`. El controlador delega en `PregenerateAudioAssetsUseCase.execute`. Valida el body como `PregenerateAudioAssetsDto` y consume `application/json`. El tipo de retorno estático es `no declarado`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `PregenerateAudioAssetsDto`; los campos opcionales se omiten.

```http
POST /internal/audio-assets/pregenerate HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `templateKeys` | No | `array<string>` | longitud máxima 160 | Sin descripción específica en el contrato OpenAPI. | `["valor-ejemplo"]` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /internal/audio-assets/pregenerate HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "templateKeys": [
    "valor-ejemplo"
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `no declarado` | No |
| 400 | Operación completada correctamente. | `no declarado` | No |
| 401 | Operación completada correctamente. | `no declarado` | No |
| 403 | Operación completada correctamente. | `no declarado` | No |
| 409 | Operación completada correctamente. | `no declarado` | No |
| 413 | Operación completada correctamente. | `no declarado` | No |
| 422 | Operación completada correctamente. | `no declarado` | No |
| 429 | Operación completada correctamente. | `no declarado` | No |
| 500 | Operación completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Plantilla de audio no encontrada | Excepción explícita en src/modules/audio_assets/application/resolve-audio-asset.use-case.ts |
| 404 | `NOT_FOUND` | Cola no encontrada | Excepción explícita en src/modules/messaging/services/queues.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La cola no está activa | Excepción explícita en src/modules/messaging/services/queues.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/internal/audio-assets/pregenerate"
}
```

---

## 9. GET /internal/audio-assets/status

- **Módulo:** `audio_assets`
- **Etiqueta OpenAPI:** `audio-assets-internal`
- **Nombre:** Diagnóstico de audio sin convertir TTS en dependencia de readiness
- **Operation ID:** `AudioAssetsInternalController_status`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AudioAssetsInternalController.status](../../src/modules/audio_assets/controllers/audio-assets-internal.controller.ts)

### Descripción de negocio

Diagnóstico de audio sin convertir TTS en dependencia de readiness. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /internal/audio-assets/status` en `AudioAssetsInternalController_status`. El controlador delega en `AudioMaintenanceService.status`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /internal/audio-assets/status HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /internal/audio-assets/status HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | No |
| 400 | Consulta completada correctamente. | `no declarado` | No |
| 401 | Consulta completada correctamente. | `no declarado` | No |
| 403 | Consulta completada correctamente. | `no declarado` | No |
| 429 | Consulta completada correctamente. | `no declarado` | No |
| 500 | Consulta completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/internal/audio-assets/status"
}
```

---

## 10. POST /internal/audio-assets/verify

- **Módulo:** `audio_assets`
- **Etiqueta OpenAPI:** `audio-assets-internal`
- **Nombre:** Verifica existencia y checksum de assets READY
- **Operation ID:** `AudioAssetsInternalController_verify`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AudioAssetsInternalController.verify](../../src/modules/audio_assets/controllers/audio-assets-internal.controller.ts)

### Descripción de negocio

Verifica existencia y checksum de assets READY. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /internal/audio-assets/verify` en `AudioAssetsInternalController_verify`. El controlador delega en `AudioMaintenanceService.verify`. Valida el body como `AudioMaintenanceDto` y consume `application/json`. El tipo de retorno estático es `no declarado`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `AudioMaintenanceDto`; los campos opcionales se omiten.

```http
POST /internal/audio-assets/verify HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `limit` | No | `number` | mínimo 1; máximo 1000 | Sin descripción específica en el contrato OpenAPI. | `250` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /internal/audio-assets/verify HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "limit": 250
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `no declarado` | No |
| 400 | Operación completada correctamente. | `no declarado` | No |
| 401 | Operación completada correctamente. | `no declarado` | No |
| 403 | Operación completada correctamente. | `no declarado` | No |
| 409 | Operación completada correctamente. | `no declarado` | No |
| 413 | Operación completada correctamente. | `no declarado` | No |
| 422 | Operación completada correctamente. | `no declarado` | No |
| 429 | Operación completada correctamente. | `no declarado` | No |
| 500 | Operación completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/internal/audio-assets/verify"
}
```

---

