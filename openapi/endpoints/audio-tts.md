<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `audio_tts`

Referencia exhaustiva de 8 operación(es) del módulo `audio_tts`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `audio-tts`, `audio-tts-internal`
- **Controladores:** `AudioTtsController`, `AudioTtsInternalController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [GET /audio-tts/assets/{assetId}](#1-get-audio-tts-assets-assetid) — Consultar un asset de audio
2. [GET /audio-tts/budget](#2-get-audio-tts-budget) — Consultar presupuesto del mes y estado de la cola
3. [POST /audio-tts/prewarm](#3-post-audio-tts-prewarm) — Pre-generar una plantilla sin variables
4. [POST /audio-tts/resolve](#4-post-audio-tts-resolve) — Resolver el audio de una plantilla
5. [POST /internal/audio-tts/assets/{assetId}/complete](#5-post-internal-audio-tts-assets-assetid-complete) — Reportar una generación correcta
6. [POST /internal/audio-tts/assets/{assetId}/fail](#6-post-internal-audio-tts-assets-assetid-fail) — Reportar una generación fallida
7. [POST /internal/audio-tts/jobs/claim](#7-post-internal-audio-tts-jobs-claim) — Reclamar un lote de trabajos de generación
8. [POST /internal/audio-tts/reconcile](#8-post-internal-audio-tts-reconcile) — Barrido de assets agotados y retención del cupo por actor

---

## 1. GET /audio-tts/assets/{assetId}

- **Módulo:** `audio_tts`
- **Etiqueta OpenAPI:** `audio-tts`
- **Nombre:** Consultar un asset de audio
- **Operation ID:** `AudioTtsController_findAsset`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AudioTtsController.findAsset](../../src/modules/audio_tts/controllers/audio-tts.controller.ts)

### Descripción de negocio

Pensado para volver tras un QUEUED. La URL de reproducción se firma en el momento y caduca.

Contexto declarado en el controlador: Estado de un asset ya conocido, para el cliente que recibió `QUEUED`.

### Descripción del sistema

NestJS resuelve `GET /audio-tts/assets/{assetId}` en `AudioTtsController_findAsset`. El controlador delega en `AudioAssetResolver.findAsset`, `AudioPlaybackService.playbackUrl`. No recibe body. El tipo de retorno estático es `Promise<AudioAssetResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `assetId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /audio-tts/assets/00000000-0000-4000-8000-000000000001 HTTP/1.1
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
GET /audio-tts/assets/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<AudioAssetResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<AudioAssetResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<AudioAssetResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<AudioAssetResponseDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<AudioAssetResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<AudioAssetResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<AudioAssetResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AudioAssetResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "assetId": "00000000-0000-4000-8000-000000000001",
  "status": "PENDING",
  "templateCode": "CODIGO_EJEMPLO",
  "playbackUrl": "valor-ejemplo",
  "lastErrorCode": "CODIGO_EJEMPLO"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `assetId` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | valores: `PENDING`, `GENERATING`, `READY`, `FAILED_RETRYABLE`, `FAILED_PERMANENT` | Valor de status mantenido por la instancia. | `PENDING` |
| `templateCode` | Sí | `string` | Sin restricción adicional declarada | Identificador asociado a template code. | `CODIGO_EJEMPLO` |
| `playbackUrl` | No | `string` | Sin restricción adicional declarada | URL firmada, solo si el asset está listo. | `valor-ejemplo` |
| `lastErrorCode` | No | `string` | Sin restricción adicional declarada | Último código de error, si falló. | `CODIGO_EJEMPLO` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/audio-tts/assets/{assetId}"
}
```

---

## 2. GET /audio-tts/budget

- **Módulo:** `audio_tts`
- **Etiqueta OpenAPI:** `audio-tts`
- **Nombre:** Consultar presupuesto del mes y estado de la cola
- **Operation ID:** `AudioTtsController_budget`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AudioTtsController.budget](../../src/modules/audio_tts/controllers/audio-tts.controller.ts)

### Descripción de negocio

Consultar presupuesto del mes y estado de la cola. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Estado del presupuesto y de la cola: lo que se mira antes de un despliegue.

### Descripción del sistema

NestJS resuelve `GET /audio-tts/budget` en `AudioTtsController_budget`. El controlador delega en `AudioQuotaRepository.readBudget`, `AudioQuotaRepository.monthlyUsage`, `AudioReconcileService.statusCounts`. No recibe body. El tipo de retorno estático es `Promise<AudioBudgetResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /audio-tts/budget HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `AUDIO_ADMIN`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /audio-tts/budget HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<AudioBudgetResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<AudioBudgetResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<AudioBudgetResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<AudioBudgetResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<AudioBudgetResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<AudioBudgetResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AudioBudgetResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "provider": "valor-ejemplo",
  "monthKey": "2026-08",
  "usableUnits": 1,
  "reservedUnits": 1,
  "settledUnits": 1,
  "recordedUnits": 1,
  "recordedGenerations": 1,
  "assetsByStatus": {
    "clave": "valor"
  }
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `provider` | Sí | `string` | Sin restricción adicional declarada | Valor de provider mantenido por la instancia. | `valor-ejemplo` |
| `monthKey` | Sí | `string` | Sin restricción adicional declarada | Valor de month key mantenido por la instancia. | `2026-08` |
| `usableUnits` | Sí | `number` | Sin restricción adicional declarada | Presupuesto gastable: el mensual menos el colchón de seguridad. | `1` |
| `reservedUnits` | Sí | `number` | Sin restricción adicional declarada | Unidades apartadas y aún no consumidas | `1` |
| `settledUnits` | Sí | `number` | Sin restricción adicional declarada | Unidades ya consumidas y confirmadas | `1` |
| `recordedUnits` | Sí | `number` | Sin restricción adicional declarada | Unidades imputadas asset por asset en el mes. Debe coincidir con settledUnits; la diferencia es deriva contable. | `1` |
| `recordedGenerations` | Sí | `number` | Sin restricción adicional declarada | Generaciones facturadas en el mes | `1` |
| `assetsByStatus` | Sí | `object` | Sin restricción adicional declarada | Assets por estado; una cola PENDING que crece indica worker parado | `{"clave":"valor"}` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, AUDIO_ADMIN. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/audio-tts/budget"
}
```

---

## 3. POST /audio-tts/prewarm

- **Módulo:** `audio_tts`
- **Etiqueta OpenAPI:** `audio-tts`
- **Nombre:** Pre-generar una plantilla sin variables
- **Operation ID:** `AudioTtsController_prewarm`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AudioTtsController.prewarm](../../src/modules/audio_tts/controllers/audio-tts.controller.ts)

### Descripción de negocio

Gasta cuota del proveedor. Solo admite plantillas sin variables y conserva las puertas de licencia y presupuesto.

Contexto declarado en el controlador: Pre-genera una plantilla sin variables. Es la operación que hay que ejecutar **antes** de abrir tráfico: sin fallbacks `READY`, toda degradación acaba en `UNAVAILABLE` y el flujo se queda sin audio incluso cuando el sistema funciona.

### Descripción del sistema

NestJS resuelve `POST /audio-tts/prewarm` en `AudioTtsController_prewarm`. El controlador delega en `AudioAssetResolver.prewarm`. Valida el body como `PrewarmAudioDto` y consume `application/json`. El tipo de retorno estático es `Promise<ResolveAudioResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `PrewarmAudioDto`; los campos opcionales se omiten.

```http
POST /audio-tts/prewarm HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "templateCode": "onboarding.fallback.generic"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `AUDIO_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `templateCode` | Sí | `string` | longitud máxima 160 | Sin descripción específica en el contrato OpenAPI. | `onboarding.fallback.generic` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /audio-tts/prewarm HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "templateCode": "onboarding.fallback.generic"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ResolveAudioResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ResolveAudioResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ResolveAudioResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ResolveAudioResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ResolveAudioResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ResolveAudioResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ResolveAudioResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ResolveAudioResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ResolveAudioResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ResolveAudioResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "status": "READY",
  "assetId": "00000000-0000-4000-8000-000000000001",
  "storageUri": "valor-ejemplo",
  "playbackUrl": "valor-ejemplo",
  "cacheHit": true,
  "reason": "Texto descriptivo de ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `status` | Sí | `string` | valores: `READY`, `QUEUED`, `FALLBACK`, `UNAVAILABLE` | READY (reproducir), QUEUED (seguir sin audio y volver a consultar), FALLBACK (audio genérico) o UNAVAILABLE (seguir sin audio). | `READY` |
| `assetId` | No | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `storageUri` | No | `string` | Sin restricción adicional declarada | URI canónica (s3:// o file://) | `valor-ejemplo` |
| `playbackUrl` | No | `string` | Sin restricción adicional declarada | URL firmada con expiración. Solo se emite si el audio está disponible; caduca, así que no debe persistirse. | `valor-ejemplo` |
| `cacheHit` | No | `boolean` | Sin restricción adicional declarada | true si se sirvió de caché sin gastar cuota | `true` |
| `reason` | No | `string` | Sin restricción adicional declarada | Código del motivo cuando hay degradación | `Texto descriptivo de ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, AUDIO_ADMIN. | Roles/tenant/guards de autorización |
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
  "path": "/audio-tts/prewarm"
}
```

---

## 4. POST /audio-tts/resolve

- **Módulo:** `audio_tts`
- **Etiqueta OpenAPI:** `audio-tts`
- **Nombre:** Resolver el audio de una plantilla
- **Operation ID:** `AudioTtsController_resolve`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AudioTtsController.resolve](../../src/modules/audio_tts/controllers/audio-tts.controller.ts)

### Descripción de negocio

Un acierto de caché no consume cuota. Estados: READY, QUEUED, FALLBACK, UNAVAILABLE — ninguno es un error.

Contexto declarado en el controlador: Resuelve el audio de una plantilla. Devuelve 200 en los cuatro estados, incluido `UNAVAILABLE`: la falta de audio no es un fallo de la petición, y responder 4xx/5xx obligaría a cada cliente a tratar como error una degradación prevista.

### Descripción del sistema

NestJS resuelve `POST /audio-tts/resolve` en `AudioTtsController_resolve`. El controlador delega en `AudioAssetResolver.resolve`. Valida el body como `ResolveAudioDto` y consume `application/json`. El tipo de retorno estático es `Promise<ResolveAudioResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ResolveAudioDto`; los campos opcionales se omiten.

```http
POST /audio-tts/resolve HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "templateCode": "onboarding.welcome.named"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `templateCode` | Sí | `string` | longitud máxima 160; patrón runtime `/^[a-z0-9][a-z0-9._-]*$/u` | Código de la plantilla, p. ej. onboarding.welcome.named | `onboarding.welcome.named` |
| `variables` | No | `object` | Sin restricción adicional declarada | Valores de las variables declaradas por la plantilla. Máximo 16, y cada valor pasa una lista blanca de caracteres. | `{"name":"María"}` |
| `language` | No | `string` | longitud máxima 20 | Etiqueta de idioma (BCP-47). Por defecto, la de la plantilla. | `es-419` |
| `correlationId` | No | `string` | longitud máxima 64 | Correlación con la petición de origen; viaja hasta el log del worker. | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /audio-tts/resolve HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "templateCode": "onboarding.welcome.named",
  "variables": {
    "name": "María"
  },
  "language": "es-419",
  "correlationId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ResolveAudioResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ResolveAudioResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ResolveAudioResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ResolveAudioResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ResolveAudioResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ResolveAudioResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ResolveAudioResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ResolveAudioResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ResolveAudioResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ResolveAudioResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "status": "READY",
  "assetId": "00000000-0000-4000-8000-000000000001",
  "storageUri": "valor-ejemplo",
  "playbackUrl": "valor-ejemplo",
  "cacheHit": true,
  "reason": "Texto descriptivo de ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `status` | Sí | `string` | valores: `READY`, `QUEUED`, `FALLBACK`, `UNAVAILABLE` | READY (reproducir), QUEUED (seguir sin audio y volver a consultar), FALLBACK (audio genérico) o UNAVAILABLE (seguir sin audio). | `READY` |
| `assetId` | No | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `storageUri` | No | `string` | Sin restricción adicional declarada | URI canónica (s3:// o file://) | `valor-ejemplo` |
| `playbackUrl` | No | `string` | Sin restricción adicional declarada | URL firmada con expiración. Solo se emite si el audio está disponible; caduca, así que no debe persistirse. | `valor-ejemplo` |
| `cacheHit` | No | `boolean` | Sin restricción adicional declarada | true si se sirvió de caché sin gastar cuota | `true` |
| `reason` | No | `string` | Sin restricción adicional declarada | Código del motivo cuando hay degradación | `Texto descriptivo de ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
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
  "path": "/audio-tts/resolve"
}
```

---

## 5. POST /internal/audio-tts/assets/{assetId}/complete

- **Módulo:** `audio_tts`
- **Etiqueta OpenAPI:** `audio-tts-internal`
- **Nombre:** Reportar una generación correcta
- **Operation ID:** `AudioTtsInternalController_complete`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AudioTtsInternalController.complete](../../src/modules/audio_tts/controllers/audio-tts-internal.controller.ts)

### Descripción de negocio

Idempotente: un segundo reporte del mismo asset responde applied=false y no vuelve a imputar consumo.

Contexto declarado en el controlador: Registra el audio generado, liquida la reserva e imputa el consumo.

### Descripción del sistema

NestJS resuelve `POST /internal/audio-tts/assets/{assetId}/complete` en `AudioTtsInternalController_complete`. El controlador delega en `AudioGenerationService.complete`. Valida el body como `CompleteAudioAssetDto` y consume `application/json`. El tipo de retorno estático es `Promise<AudioAssetOutcomeResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `assetId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CompleteAudioAssetDto`; los campos opcionales se omiten.

```http
POST /internal/audio-tts/assets/00000000-0000-4000-8000-000000000001/complete HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "storageUri": "valor-ejemplo",
  "mimeType": "audio/mpeg",
  "checksumSha256": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "bytes": 1,
  "usageUnits": 1,
  "provider": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `AUDIO_ADMIN`.
- Deben ser UUID válidos: `assetId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `storageUri` | Sí | `string` | longitud máxima 1024 | URI canónica devuelta por el almacenamiento | `valor-ejemplo` |
| `mimeType` | Sí | `string` | longitud máxima 128 | Sin descripción específica en el contrato OpenAPI. | `audio/mpeg` |
| `checksumSha256` | Sí | `string` | patrón runtime `/^[0-9a-f]{64}$/u` | SHA-256 hexadecimal del contenido almacenado | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |
| `bytes` | Sí | `number` | mínimo 0 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `usageUnits` | Sí | `number` | mínimo 0 | Unidades reportadas por el proveedor o estimadas | `1` |
| `provider` | Sí | `string` | longitud máxima 40 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /internal/audio-tts/assets/00000000-0000-4000-8000-000000000001/complete HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "storageUri": "valor-ejemplo",
  "mimeType": "audio/mpeg",
  "checksumSha256": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "bytes": 1,
  "usageUnits": 1,
  "provider": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<AudioAssetOutcomeResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<AudioAssetOutcomeResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AudioAssetOutcomeResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AudioAssetOutcomeResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<AudioAssetOutcomeResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AudioAssetOutcomeResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<AudioAssetOutcomeResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AudioAssetOutcomeResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AudioAssetOutcomeResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AudioAssetOutcomeResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AudioAssetOutcomeResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "assetId": "00000000-0000-4000-8000-000000000001",
  "status": "ok",
  "applied": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `assetId` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | Sin restricción adicional declarada | Estado resultante. | `ok` |
| `applied` | Sí | `boolean` | Sin restricción adicional declarada | false si el asset ya estaba READY: el reporte es un duplicado benigno | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, AUDIO_ADMIN. | Roles/tenant/guards de autorización |
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
  "path": "/internal/audio-tts/assets/{assetId}/complete"
}
```

---

## 6. POST /internal/audio-tts/assets/{assetId}/fail

- **Módulo:** `audio_tts`
- **Etiqueta OpenAPI:** `audio-tts-internal`
- **Nombre:** Reportar una generación fallida
- **Operation ID:** `AudioTtsInternalController_fail`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AudioTtsInternalController.fail](../../src/modules/audio_tts/controllers/audio-tts-internal.controller.ts)

### Descripción de negocio

Un fallo transitorio programa el siguiente intento; uno permanente cierra el asset y devuelve su reserva de presupuesto.

Contexto declarado en el controlador: Registra un fallo; programa el reintento o cierra y devuelve la reserva.

### Descripción del sistema

NestJS resuelve `POST /internal/audio-tts/assets/{assetId}/fail` en `AudioTtsInternalController_fail`. El controlador delega en `AudioGenerationService.fail`. Valida el body como `FailAudioAssetDto` y consume `application/json`. El tipo de retorno estático es `Promise<AudioAssetOutcomeResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `assetId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `FailAudioAssetDto`; los campos opcionales se omiten.

```http
POST /internal/audio-tts/assets/00000000-0000-4000-8000-000000000001/fail HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "ELEVENLABS_HTTP_429",
  "retryable": true
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `AUDIO_ADMIN`.
- Deben ser UUID válidos: `assetId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `code` | Sí | `string` | longitud máxima 120 | Sin descripción específica en el contrato OpenAPI. | `ELEVENLABS_HTTP_429` |
| `retryable` | Sí | `boolean` | Sin restricción adicional declarada | true solo si el fallo puede curarse solo. Un 401 reintentado no arregla la credencial y sí gasta los intentos del asset. | `true` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /internal/audio-tts/assets/00000000-0000-4000-8000-000000000001/fail HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "ELEVENLABS_HTTP_429",
  "retryable": true
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<AudioAssetOutcomeResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<AudioAssetOutcomeResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AudioAssetOutcomeResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AudioAssetOutcomeResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<AudioAssetOutcomeResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AudioAssetOutcomeResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<AudioAssetOutcomeResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AudioAssetOutcomeResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AudioAssetOutcomeResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AudioAssetOutcomeResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AudioAssetOutcomeResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "assetId": "00000000-0000-4000-8000-000000000001",
  "status": "ok",
  "applied": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `assetId` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | Sin restricción adicional declarada | Estado resultante. | `ok` |
| `applied` | Sí | `boolean` | Sin restricción adicional declarada | false si el asset ya estaba READY: el reporte es un duplicado benigno | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, AUDIO_ADMIN. | Roles/tenant/guards de autorización |
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
  "path": "/internal/audio-tts/assets/{assetId}/fail"
}
```

---

## 7. POST /internal/audio-tts/jobs/claim

- **Módulo:** `audio_tts`
- **Etiqueta OpenAPI:** `audio-tts-internal`
- **Nombre:** Reclamar un lote de trabajos de generación
- **Operation ID:** `AudioTtsInternalController_claim`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AudioTtsInternalController.claim](../../src/modules/audio_tts/controllers/audio-tts-internal.controller.ts)

### Descripción de negocio

Toma el lease, incrementa el intento y devuelve el texto ya descifrado. Revalida el presupuesto antes de entregar cada trabajo.

Contexto declarado en el controlador: Reclama un lote de trabajos con lease. Idempotente por construcción, no por clave: el `UPDATE … FOR UPDATE SKIP LOCKED` hace que dos llamadas simultáneas nunca reciban el mismo asset, así que reintentar esta llamada no puede duplicar una generación.

### Descripción del sistema

NestJS resuelve `POST /internal/audio-tts/jobs/claim` en `AudioTtsInternalController_claim`. El controlador delega en `AudioGenerationService.claim`. Valida el body como `ClaimAudioJobsDto` y consume `application/json`. El tipo de retorno estático es `Promise<ClaimAudioJobsResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ClaimAudioJobsDto`; los campos opcionales se omiten.

```http
POST /internal/audio-tts/jobs/claim HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "workerId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `AUDIO_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `workerId` | Sí | `string` | longitud máxima 120 | Identificador del proceso worker; queda en el lease para diagnóstico. | `00000000-0000-4000-8000-000000000001` |
| `limit` | No | `number` | mínimo 1; máximo 64 | Trabajos a reclamar. Se acota al lote configurado: un worker no puede pedir más de lo que el mamparo del proveedor admite. | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /internal/audio-tts/jobs/claim HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "workerId": "00000000-0000-4000-8000-000000000001",
  "limit": 1
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ClaimAudioJobsResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ClaimAudioJobsResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ClaimAudioJobsResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ClaimAudioJobsResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ClaimAudioJobsResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ClaimAudioJobsResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ClaimAudioJobsResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ClaimAudioJobsResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ClaimAudioJobsResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ClaimAudioJobsResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "jobs": [
    {
      "assetId": "00000000-0000-4000-8000-000000000001",
      "text": "valor-ejemplo",
      "language": "es-BO",
      "providerVoiceRef": "valor-ejemplo",
      "model": "valor-ejemplo",
      "outputFormat": "valor-ejemplo",
      "sampleRate": 1,
      "attempts": 1,
      "correlationId": "00000000-0000-4000-8000-000000000001"
    }
  ],
  "skipped": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `jobs` | Sí | `array<AudioGenerationJobDto>` | Sin restricción adicional declarada | Trabajos entregados. | `[{"assetId":"00000000-0000-4000-8000-000000000001","text":"valor-ejemplo","language":"es-BO","providerVoiceRef":"valor-ejemplo","model":"valor-ejemplo","outputFormat":"valor-ejemplo","sampleRate":1,"attempts":1,"correlationId":"00000000-0000-4000-8000-000000000001"}]` |
| `jobs[].assetId` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `jobs[].text` | Sí | `string` | Sin restricción adicional declarada | Texto renderizado, descifrado por la API | `valor-ejemplo` |
| `jobs[].language` | Sí | `string` | Sin restricción adicional declarada | Valor de language mantenido por la instancia. | `es-BO` |
| `jobs[].providerVoiceRef` | Sí | `string` | Sin restricción adicional declarada | Referencia de voz del proveedor. | `valor-ejemplo` |
| `jobs[].model` | Sí | `string` | Sin restricción adicional declarada | Valor de model mantenido por la instancia. | `valor-ejemplo` |
| `jobs[].outputFormat` | Sí | `string` | Sin restricción adicional declarada | Valor de output format mantenido por la instancia. | `valor-ejemplo` |
| `jobs[].sampleRate` | Sí | `number` | Sin restricción adicional declarada | Valor de sample rate mantenido por la instancia. | `1` |
| `jobs[].attempts` | Sí | `number` | Sin restricción adicional declarada | Intentos ya consumidos, incluido el actual. | `1` |
| `jobs[].correlationId` | No | `string` | Sin restricción adicional declarada | Identificador asociado a correlation. | `00000000-0000-4000-8000-000000000001` |
| `skipped` | Sí | `number` | Sin restricción adicional declarada | Assets reclamados que se cerraron sin generar: presupuesto agotado o texto no descifrable. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, AUDIO_ADMIN. | Roles/tenant/guards de autorización |
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
  "path": "/internal/audio-tts/jobs/claim"
}
```

---

## 8. POST /internal/audio-tts/reconcile

- **Módulo:** `audio_tts`
- **Etiqueta OpenAPI:** `audio-tts-internal`
- **Nombre:** Barrido de assets agotados y retención del cupo por actor
- **Operation ID:** `AudioTtsInternalController_reconcileOnce`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AudioTtsInternalController.reconcileOnce](../../src/modules/audio_tts/controllers/audio-tts-internal.controller.ts)

### Descripción de negocio

Barrido de assets agotados y retención del cupo por actor. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Barrido: cierra agotados, aplica retención y publica los encallados. Es la operación que evita que las reservas de los assets que murieron con su worker queden apartadas del presupuesto para siempre.

### Descripción del sistema

NestJS resuelve `POST /internal/audio-tts/reconcile` en `AudioTtsInternalController_reconcileOnce`. El controlador delega en `AudioReconcileService.runOnce`. No recibe body. El tipo de retorno estático es `Promise<AudioReconcileResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /internal/audio-tts/reconcile HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `AUDIO_ADMIN`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /internal/audio-tts/reconcile HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<AudioReconcileResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<AudioReconcileResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AudioReconcileResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AudioReconcileResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AudioReconcileResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AudioReconcileResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AudioReconcileResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AudioReconcileResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AudioReconcileResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "exhausted": 1,
  "releasedUnits": 1,
  "purgedActorDays": 1,
  "stalled": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `exhausted` | Sí | `number` | Sin restricción adicional declarada | Assets cerrados por agotar intentos. | `1` |
| `releasedUnits` | Sí | `number` | Sin restricción adicional declarada | Unidades devueltas al presupuesto. | `1` |
| `purgedActorDays` | Sí | `number` | Sin restricción adicional declarada | Filas del contador por actor borradas por retención. | `1` |
| `stalled` | Sí | `number` | Sin restricción adicional declarada | Pendientes sin progreso: si crece, el worker no está drenando | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, AUDIO_ADMIN. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/internal/audio-tts/reconcile"
}
```

---

