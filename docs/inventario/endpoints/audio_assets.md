<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `audio_assets`

- **Bloque:** —
- **Operaciones:** 10 (10 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 2 · MEDIO 7 · BAJO 1
- **Tablas distintas que tocan:** 6
- **Respuestas de error y detalle contractual:** `openapi/endpoints/audio-assets.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | GET | `/audio-assets/{assetId}/content` | Entrega bytes de un asset READY desde storage propio | ALTO | 2 | sesión (sin roles) |
| 2 | POST | `/audio-assets/resolve` | Resuelve un asset TTS desde caché o agenda su generación | ALTO | 8 | sesión (sin roles) |
| 3 | POST | `/internal/audio-assets/{assetId}/deprecate` | Depreca un asset no-fallback sin eliminarlo inmediatamente | MEDIO | 4 | SYSTEM |
| 4 | POST | `/internal/audio-assets/{assetId}/generated` | Registra un asset de audio generado | MEDIO | 2 | SYSTEM |
| 5 | POST | `/internal/audio-assets/{assetId}/generation-failed` | Registra un fallo de generación de audio | MEDIO | 4 | SYSTEM |
| 6 | POST | `/internal/audio-assets/{assetId}/prepare-generation` | Prepara un asset de audio para generación | MEDIO | 5 | SYSTEM |
| 7 | POST | `/internal/audio-assets/garbage-collect` | Elimina conservadoramente objetos de assets deprecados/permanentes | MEDIO | 4 | SYSTEM |
| 8 | POST | `/internal/audio-assets/pregenerate` | Pre-genera STATIC, ENUMERATED y fallbacks de forma idempotente | MEDIO | 8 | SYSTEM |
| 9 | GET | `/internal/audio-assets/status` | Diagnóstico de audio sin convertir TTS en dependencia de readiness | BAJO | 1 | SYSTEM |
| 10 | POST | `/internal/audio-assets/verify` | Verifica existencia y checksum de assets READY | MEDIO | 3 | SYSTEM |

---

## 1. GET /audio-assets/{assetId}/content

- **Origen:** CONTRATO
- **Nombre:** Entrega bytes de un asset READY desde storage propio
- **Bloque:** —
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AudioAssetsController.contentById` — `src/modules/audio_assets/presentation/controllers/audio-assets.controller.ts:48`

### Qué es y para qué sirve (negocio)

Entrega bytes de un asset READY desde storage propio. Dentro del módulo (descripción del modelo, en inglés): «Cache-first text-to-speech for onboarding and other bounded experiences.»

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_64_audio_assets.puml:12`)

### Cómo se atiende (sistema)

`GET /audio-assets/{assetId}/content` la atiende `AudioAssetsController.contentById` (src/modules/audio_assets/presentation/controllers/audio-assets.controller.ts:48). Exige sesión; el controlador no declara roles. Delega en `AudioContentService.get`. Actualiza audio_assets.audio_assets. Lee audio_assets.audio_assets.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/audio_assets/presentation/controllers/audio-assets.controller.ts:48` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: assetId | `src/modules/audio_assets/presentation/controllers/audio-assets.controller.ts:48` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audio_assets.audio_assets` | ESCRIBE | ACTUALIZA | POR_SQL | AudioAssetsController.contentById → AudioContentService.get → AudioAssetsRepository.touchUsage | `src/modules/audio_assets/infrastructure/repositories/audio-assets.repository.ts:198` |
| `audio_assets.audio_assets` | LEE | LEE | DIRECTA | AudioAssetsController.contentById → AudioContentService.get → AudioAssetsRepository.findAssetById | `src/modules/audio_assets/infrastructure/repositories/audio-assets.repository.ts:58` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `assetId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<StreamableFile>`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Asset de audio listo no encontrado; ResourceNotFoundException: La URI no pertenece al almacenamiento local; ResourceNotFoundException: La URI de almacenamiento local está mal formada; ResourceNotFoundException: El contenido no está disponible en el almacenamiento local; ResourceNotFoundException: La URI no pertenece al bucket configurado; ResourceNotFoundException: La URI S3 está mal formada o fuera del prefijo permitido; ResourceNotFoundException: El contenido no está disponible en el almacenamiento configurado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.SERVICE_UNAVAILABLE}; Error: S3 object body is empty |

El árbol de decisión completo está en [flujos](../flujos/audio_assets.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Audio Assets — etapa `ctrl:AudioAssetsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 2. POST /audio-assets/resolve

- **Origen:** CONTRATO
- **Nombre:** Resuelve un asset TTS desde caché o agenda su generación
- **Bloque:** —
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AudioAssetsController.resolve` — `src/modules/audio_assets/presentation/controllers/audio-assets.controller.ts:32`

### Qué es y para qué sirve (negocio)

Resuelve un asset TTS desde caché o agenda su generación. Dentro del módulo (descripción del modelo, en inglés): «Cache-first text-to-speech for onboarding and other bounded experiences.»

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_64_audio_assets.puml:12`)

### Cómo se atiende (sistema)

`POST /audio-assets/resolve` la atiende `AudioAssetsController.resolve` (src/modules/audio_assets/presentation/controllers/audio-assets.controller.ts:32). Exige sesión; el controlador no declara roles. Valida el cuerpo como `ResolveAudioAssetDto` (4 campos, 1 obligatorio). Delega en `AudioAssetsFacade.resolve`. Crea filas en audio_assets.audio_assets, messaging.queued_jobs. Actualiza audio_assets.audio_assets. Lee audio_assets.audio_assets, audio_assets.audio_generation_usage, audio_assets.audio_templates, messaging.message_queues, messaging.queued_jobs. Encola audio-generation.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/audio_assets/presentation/controllers/audio-assets.controller.ts:32` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audio_assets.audio_assets` | ESCRIBE | ACTUALIZA | POR_SQL | AudioAssetsController.resolve → AudioAssetsFacade.resolve → ResolveAudioAssetUseCase.execute → ResolveAudioAssetUseCase.resolveRendered → AudioAssetsRepository.touchUsage | `src/modules/audio_assets/infrastructure/repositories/audio-assets.repository.ts:198` |
| `audio_assets.audio_assets` | ESCRIBE | CREA | POR_SQL | AudioAssetsController.resolve → AudioAssetsFacade.resolve → ResolveAudioAssetUseCase.execute → ResolveAudioAssetUseCase.resolveRendered → AudioAssetsRepository.createPendingOrGet | `src/modules/audio_assets/infrastructure/repositories/audio-assets.repository.ts:84` |
| `audio_assets.audio_assets` | LEE | LEE | DIRECTA | AudioAssetsController.resolve → AudioAssetsFacade.resolve → ResolveAudioAssetUseCase.execute → ResolveAudioAssetUseCase.resolveRendered → AudioAssetsRepository.findAssetByKey | `src/modules/audio_assets/infrastructure/repositories/audio-assets.repository.ts:55` |
| `audio_assets.audio_generation_usage` | LEE | LEE | DIRECTA | AudioAssetsController.resolve → AudioAssetsFacade.resolve → ResolveAudioAssetUseCase.execute → ResolveAudioAssetUseCase.resolveRendered → AudioBudgetPolicy.canGenerate → AudioAssetsRepository.estimatedUsage | `src/modules/audio_assets/infrastructure/repositories/audio-assets.repository.ts:205` |
| `audio_assets.audio_templates` | LEE | LEE | DIRECTA | AudioAssetsController.resolve → AudioAssetsFacade.resolve → ResolveAudioAssetUseCase.execute → AudioAssetsRepository.findTemplate | `src/modules/audio_assets/infrastructure/repositories/audio-assets.repository.ts:44` |
| `messaging.message_queues` | LEE | LEE | DIRECTA | AudioAssetsController.resolve → AudioAssetsFacade.resolve → ResolveAudioAssetUseCase.execute → ResolveAudioAssetUseCase.resolveRendered → AudioJobQueueAdapter.enqueue → QueuesService.enqueueJob → QueuesRepository.findQueueByCode | `src/modules/messaging/repositories/queues.repository.ts:77` |
| `messaging.queued_jobs` | ESCRIBE | CREA | DIRECTA | AudioAssetsController.resolve → AudioAssetsFacade.resolve → ResolveAudioAssetUseCase.execute → ResolveAudioAssetUseCase.resolveRendered → AudioJobQueueAdapter.enqueue → QueuesService.enqueueJob → QueuesRepository.createJob | `src/modules/messaging/repositories/queues.repository.ts:101` |
| `messaging.queued_jobs` | LEE | LEE | DIRECTA | AudioAssetsController.resolve → AudioAssetsFacade.resolve → ResolveAudioAssetUseCase.execute → ResolveAudioAssetUseCase.resolveRendered → AudioJobQueueAdapter.enqueue → QueuesService.enqueueJob → QueuesRepository.findJobByDedupeKey | `src/modules/messaging/repositories/queues.repository.ts:132` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Trabajo encolado | `audio-generation` | `src/modules/audio_assets/infrastructure/adapters/audio-job-queue.adapter.ts:22` |

### Cuerpo — DTO `ResolveAudioAssetDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `templateKey` | `string` | Sí | longitud máxima 160 | `@IsString()` `@MaxLength(160)` | — | `src/modules/audio_assets/presentation/dto/audio-assets.dto.ts:20` |
| `variables` | `object` | No | — | `@IsOptional()` `@IsObject()` | — | `src/modules/audio_assets/presentation/dto/audio-assets.dto.ts:27` |
| `requestedVersion` | `number` | No | mínimo 1 | `@IsOptional()` `@IsInt()` `@Min(1)` | — | `src/modules/audio_assets/presentation/dto/audio-assets.dto.ts:32` |
| `correlationId` | `string` | No | longitud máxima 128 | `@IsOptional()` `@IsString()` `@MaxLength(128)` | — | `src/modules/audio_assets/presentation/dto/audio-assets.dto.ts:37` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "templateKey": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "templateKey": "valor-ejemplo",
  "variables": {
    "clave": "valor"
  },
  "requestedVersion": 1,
  "correlationId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `no declarado`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Plantilla de audio no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | Error: No se pudo materializar el asset de audio idempotente; StorageLifecycleDenied: LIFECYCLE_WIRING_MISSING |

El árbol de decisión completo está en [flujos](../flujos/audio_assets.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Audio Assets — etapa `ctrl:AudioAssetsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 3. POST /internal/audio-assets/{assetId}/deprecate

- **Origen:** CONTRATO
- **Nombre:** Depreca un asset no-fallback sin eliminarlo inmediatamente
- **Bloque:** —
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AudioAssetsInternalController.deprecate` — `src/modules/audio_assets/presentation/controllers/audio-assets-internal.controller.ts:84`

### Qué es y para qué sirve (negocio)

Depreca un asset no-fallback sin eliminarlo inmediatamente. Dentro del módulo (descripción del modelo, en inglés): «Cache-first text-to-speech for onboarding and other bounded experiences.»

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_64_audio_assets.puml:12`)

### Cómo se atiende (sistema)

`POST /internal/audio-assets/{assetId}/deprecate` la atiende `AudioAssetsInternalController.deprecate` (src/modules/audio_assets/presentation/controllers/audio-assets-internal.controller.ts:84). Exige sesión con alguno de los roles SYSTEM. Delega en `AudioMaintenanceService.deprecate`. Crea filas en audio_assets.audio_generation_events. Actualiza audio_assets.audio_assets. Lee audio_assets.audio_assets.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM | `src/modules/audio_assets/presentation/controllers/audio-assets-internal.controller.ts:84` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: assetId | `src/modules/audio_assets/presentation/controllers/audio-assets-internal.controller.ts:84` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audio_assets.audio_assets` | ESCRIBE | ACTUALIZA | POR_TIPO | AudioAssetsInternalController.deprecate → AudioMaintenanceService.deprecate → AudioMaintenanceRepository.deprecate | `src/modules/audio_assets/infrastructure/repositories/audio-maintenance.repository.ts:33` |
| `audio_assets.audio_assets` | LEE | LEE | DIRECTA | AudioAssetsInternalController.deprecate → AudioMaintenanceService.deprecate → AudioAssetsRepository.findAssetById | `src/modules/audio_assets/infrastructure/repositories/audio-assets.repository.ts:58` |
| `audio_assets.audio_generation_events` | ESCRIBE | CREA | DIRECTA | AudioAssetsInternalController.deprecate → AudioMaintenanceService.deprecate → AudioAssetsRepository.appendEvent | `src/modules/audio_assets/infrastructure/repositories/audio-assets.repository.ts:289` |
| `audio_assets.audio_generation_events` | ESCRIBE | GUARDA | POR_TIPO | AudioAssetsInternalController.deprecate → AudioMaintenanceService.deprecate → AudioAssetsRepository.appendEvent | `src/modules/audio_assets/infrastructure/repositories/audio-assets.repository.ts:303` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `assetId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `no declarado`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/audio_assets.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/audio_assets/presentation/controllers/audio-assets-internal.controller.spec.ts:37` |

### Flujos

- Audio Assets — etapa `ctrl:AudioAssetsInternalController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 4. POST /internal/audio-assets/{assetId}/generated

- **Origen:** CONTRATO
- **Nombre:** Registra un asset de audio generado
- **Bloque:** —
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AudioAssetsInternalController.generated` — `src/modules/audio_assets/presentation/controllers/audio-assets-internal.controller.ts:108`

### Qué es y para qué sirve (negocio)

Registra un asset de audio generado. Dentro del módulo (descripción del modelo, en inglés): «Cache-first text-to-speech for onboarding and other bounded experiences.»

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_64_audio_assets.puml:12`)

### Cómo se atiende (sistema)

`POST /internal/audio-assets/{assetId}/generated` la atiende `AudioAssetsInternalController.generated` (src/modules/audio_assets/presentation/controllers/audio-assets-internal.controller.ts:108). Exige sesión con alguno de los roles SYSTEM. Valida el cuerpo como `GeneratedAudioAssetDto` (6 campos, 3 obligatorios). Delega en `AudioGenerationUseCase.generated`. Crea filas en audio_assets.audio_generation_events.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM | `src/modules/audio_assets/presentation/controllers/audio-assets-internal.controller.ts:108` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: assetId | `src/modules/audio_assets/presentation/controllers/audio-assets-internal.controller.ts:108` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audio_assets.audio_generation_events` | ESCRIBE | CREA | DIRECTA | AudioAssetsInternalController.generated → AudioGenerationUseCase.generated → AudioAssetsRepository.appendEvent | `src/modules/audio_assets/infrastructure/repositories/audio-assets.repository.ts:289` |
| `audio_assets.audio_generation_events` | ESCRIBE | GUARDA | POR_TIPO | AudioAssetsInternalController.generated → AudioGenerationUseCase.generated → AudioAssetsRepository.appendEvent | `src/modules/audio_assets/infrastructure/repositories/audio-assets.repository.ts:303` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `assetId` | path | Sí | `string` | — |

### Cuerpo — DTO `GeneratedAudioAssetDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `publication` | `object` | No | — | `@IsOptional()` `@IsObject()` | — | `src/modules/audio_assets/presentation/dto/audio-assets.dto.ts:51` |
| `storageUri` | `string` | Sí | longitud máxima 1024 | `@IsString()` `@MaxLength(1024)` | — | `src/modules/audio_assets/presentation/dto/audio-assets.dto.ts:52` |
| `checksumSha256` | `string` | Sí | longitud máxima 64 | `@IsString()` `@MaxLength(64)` | — | `src/modules/audio_assets/presentation/dto/audio-assets.dto.ts:53` |
| `bytes` | `number` | Sí | mínimo 1 | `@IsInt()` `@Min(1)` | — | `src/modules/audio_assets/presentation/dto/audio-assets.dto.ts:54` |
| `durationMs` | `number` | No | mínimo 0 | `@IsOptional()` `@IsInt()` `@Min(0)` | — | `src/modules/audio_assets/presentation/dto/audio-assets.dto.ts:55` |
| `credits` | `number` | No | mínimo 0 | `@IsOptional()` `@IsInt()` `@Min(0)` | — | `src/modules/audio_assets/presentation/dto/audio-assets.dto.ts:56` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "storageUri": "valor-ejemplo",
  "checksumSha256": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "bytes": 1
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "publication": {},
  "storageUri": "valor-ejemplo",
  "checksumSha256": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "bytes": 1,
  "durationMs": 1,
  "credits": 1
}
```

</details>

### Respuesta — `no declarado`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | StorageLifecycleDenied: PUBLICATION_PROOF_REQUIRED; StorageLifecycleDenied: PUBLICATION_TRANSACTION_REQUIRED |

El árbol de decisión completo está en [flujos](../flujos/audio_assets.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/audio_assets/presentation/controllers/audio-assets-internal.controller.spec.ts:40` |

### Flujos

- Audio Assets — etapa `ctrl:AudioAssetsInternalController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 5. POST /internal/audio-assets/{assetId}/generation-failed

- **Origen:** CONTRATO
- **Nombre:** Registra un fallo de generación de audio
- **Bloque:** —
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AudioAssetsInternalController.failed` — `src/modules/audio_assets/presentation/controllers/audio-assets-internal.controller.ts:123`

### Qué es y para qué sirve (negocio)

Registra un fallo de generación de audio. Dentro del módulo (descripción del modelo, en inglés): «Cache-first text-to-speech for onboarding and other bounded experiences.»

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_64_audio_assets.puml:12`)

### Cómo se atiende (sistema)

`POST /internal/audio-assets/{assetId}/generation-failed` la atiende `AudioAssetsInternalController.failed` (src/modules/audio_assets/presentation/controllers/audio-assets-internal.controller.ts:123). Exige sesión con alguno de los roles SYSTEM. Valida el cuerpo como `FailedAudioAssetDto` (3 campos, 2 obligatorios). Delega en `AudioGenerationUseCase.failed`. Crea filas en audio_assets.audio_generation_events. Actualiza audio_assets.audio_assets. Lee audio_assets.audio_assets.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM | `src/modules/audio_assets/presentation/controllers/audio-assets-internal.controller.ts:123` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: assetId | `src/modules/audio_assets/presentation/controllers/audio-assets-internal.controller.ts:123` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audio_assets.audio_assets` | ESCRIBE | ACTUALIZA | DIRECTA | AudioAssetsInternalController.failed → AudioGenerationUseCase.failed → AudioAssetsRepository.markFailed | `src/modules/audio_assets/infrastructure/repositories/audio-assets.repository.ts:257` |
| `audio_assets.audio_assets` | LEE | LEE | DIRECTA | AudioAssetsInternalController.failed → AudioGenerationUseCase.failed → AudioAssetsRepository.findAssetById | `src/modules/audio_assets/infrastructure/repositories/audio-assets.repository.ts:58` |
| `audio_assets.audio_generation_events` | ESCRIBE | CREA | DIRECTA | AudioAssetsInternalController.failed → AudioGenerationUseCase.failed → AudioAssetsRepository.appendEvent | `src/modules/audio_assets/infrastructure/repositories/audio-assets.repository.ts:289` |
| `audio_assets.audio_generation_events` | ESCRIBE | GUARDA | POR_TIPO | AudioAssetsInternalController.failed → AudioGenerationUseCase.failed → AudioAssetsRepository.appendEvent | `src/modules/audio_assets/infrastructure/repositories/audio-assets.repository.ts:303` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `assetId` | path | Sí | `string` | — |

### Cuerpo — DTO `FailedAudioAssetDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `code` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/audio_assets/presentation/dto/audio-assets.dto.ts:59` |
| `retryable` | `boolean` | Sí | — | `@IsBoolean()` | — | `src/modules/audio_assets/presentation/dto/audio-assets.dto.ts:60` |
| `durationMs` | `number` | No | mínimo 0 | `@IsOptional()` `@IsInt()` `@Min(0)` | — | `src/modules/audio_assets/presentation/dto/audio-assets.dto.ts:61` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "code": "CODIGO_EJEMPLO",
  "retryable": true
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "code": "CODIGO_EJEMPLO",
  "retryable": true,
  "durationMs": 1
}
```

</details>

### Respuesta — `no declarado`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Asset de audio no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/audio_assets.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/audio_assets/presentation/controllers/audio-assets-internal.controller.spec.ts:42` |

### Flujos

- Audio Assets — etapa `ctrl:AudioAssetsInternalController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 6. POST /internal/audio-assets/{assetId}/prepare-generation

- **Origen:** CONTRATO
- **Nombre:** Prepara un asset de audio para generación
- **Bloque:** —
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AudioAssetsInternalController.prepare` — `src/modules/audio_assets/presentation/controllers/audio-assets-internal.controller.ts:97`

### Qué es y para qué sirve (negocio)

Prepara un asset de audio para generación. Dentro del módulo (descripción del modelo, en inglés): «Cache-first text-to-speech for onboarding and other bounded experiences.»

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_64_audio_assets.puml:12`)

### Cómo se atiende (sistema)

`POST /internal/audio-assets/{assetId}/prepare-generation` la atiende `AudioAssetsInternalController.prepare` (src/modules/audio_assets/presentation/controllers/audio-assets-internal.controller.ts:97). Exige sesión con alguno de los roles SYSTEM. Delega en `AudioGenerationUseCase.prepare`. Crea filas en audio_assets.audio_generation_events. Actualiza audio_assets.audio_assets. Lee audio_assets.audio_assets, audio_assets.audio_generation_usage.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM | `src/modules/audio_assets/presentation/controllers/audio-assets-internal.controller.ts:97` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: assetId | `src/modules/audio_assets/presentation/controllers/audio-assets-internal.controller.ts:97` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audio_assets.audio_assets` | ESCRIBE | ACTUALIZA | DIRECTA | AudioAssetsInternalController.prepare → AudioGenerationUseCase.prepare → AudioAssetsRepository.markFallbackOnly | `src/modules/audio_assets/infrastructure/repositories/audio-assets.repository.ts:273` |
| `audio_assets.audio_assets` | LEE | LEE | DIRECTA | AudioAssetsInternalController.prepare → AudioGenerationUseCase.prepare → AudioAssetsRepository.findAssetById | `src/modules/audio_assets/infrastructure/repositories/audio-assets.repository.ts:58` |
| `audio_assets.audio_generation_events` | ESCRIBE | CREA | DIRECTA | AudioAssetsInternalController.prepare → AudioGenerationUseCase.prepare → AudioAssetsRepository.appendEvent | `src/modules/audio_assets/infrastructure/repositories/audio-assets.repository.ts:289` |
| `audio_assets.audio_generation_events` | ESCRIBE | GUARDA | POR_TIPO | AudioAssetsInternalController.prepare → AudioGenerationUseCase.prepare → AudioAssetsRepository.appendEvent | `src/modules/audio_assets/infrastructure/repositories/audio-assets.repository.ts:303` |
| `audio_assets.audio_generation_usage` | LEE | LEE | DIRECTA | AudioAssetsInternalController.prepare → AudioGenerationUseCase.prepare → AudioBudgetPolicy.canGenerate → AudioAssetsRepository.estimatedUsage | `src/modules/audio_assets/infrastructure/repositories/audio-assets.repository.ts:205` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `assetId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `no declarado`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Asset de audio no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | Error: Payload cifrado de audio inválido |

El árbol de decisión completo está en [flujos](../flujos/audio_assets.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/audio_assets/presentation/controllers/audio-assets-internal.controller.spec.ts:38` |

### Flujos

- Audio Assets — etapa `ctrl:AudioAssetsInternalController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 7. POST /internal/audio-assets/garbage-collect

- **Origen:** CONTRATO
- **Nombre:** Elimina conservadoramente objetos de assets deprecados/permanentes
- **Bloque:** —
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AudioAssetsInternalController.garbageCollect` — `src/modules/audio_assets/presentation/controllers/audio-assets-internal.controller.ts:71`

### Qué es y para qué sirve (negocio)

Elimina conservadoramente objetos de assets deprecados/permanentes. Dentro del módulo (descripción del modelo, en inglés): «Cache-first text-to-speech for onboarding and other bounded experiences.»

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_64_audio_assets.puml:12`)

### Cómo se atiende (sistema)

`POST /internal/audio-assets/garbage-collect` la atiende `AudioAssetsInternalController.garbageCollect` (src/modules/audio_assets/presentation/controllers/audio-assets-internal.controller.ts:71). Exige sesión con alguno de los roles SYSTEM. Valida el cuerpo como `AudioMaintenanceDto` (1 campo, 0 obligatorios). Delega en `AudioMaintenanceService.garbageCollect`. Crea filas en audio_assets.audio_generation_events. Actualiza audio_assets.audio_assets. Lee audio_assets.audio_assets.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM | `src/modules/audio_assets/presentation/controllers/audio-assets-internal.controller.ts:71` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audio_assets.audio_assets` | ESCRIBE | ACTUALIZA | POR_SQL | AudioAssetsInternalController.garbageCollect → AudioMaintenanceService.garbageCollect → AudioMaintenanceRepository.clearStorageReference | `src/modules/audio_assets/infrastructure/repositories/audio-maintenance.repository.ts:55` |
| `audio_assets.audio_assets` | LEE | LEE | DIRECTA | AudioAssetsInternalController.garbageCollect → AudioMaintenanceService.garbageCollect → AudioMaintenanceRepository.listGarbageCandidates | `src/modules/audio_assets/infrastructure/repositories/audio-maintenance.repository.ts:26` |
| `audio_assets.audio_generation_events` | ESCRIBE | CREA | DIRECTA | AudioAssetsInternalController.garbageCollect → AudioMaintenanceService.garbageCollect → AudioAssetsRepository.appendEvent | `src/modules/audio_assets/infrastructure/repositories/audio-assets.repository.ts:289` |
| `audio_assets.audio_generation_events` | ESCRIBE | GUARDA | POR_TIPO | AudioAssetsInternalController.garbageCollect → AudioMaintenanceService.garbageCollect → AudioAssetsRepository.appendEvent | `src/modules/audio_assets/infrastructure/repositories/audio-assets.repository.ts:303` |

### Cuerpo — DTO `AudioMaintenanceDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `limit` | `number` | No | mínimo 1; máximo 1000 | `@IsOptional()` `@IsInt()` `@Min(1)` `@Max(1000)` | — | `src/modules/audio_assets/presentation/dto/audio-assets.dto.ts:69` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "limit": 250
}
```

</details>

### Respuesta — `no declarado`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: La URI no pertenece al almacenamiento local; ResourceNotFoundException: La URI de almacenamiento local está mal formada; ResourceNotFoundException: La URI no pertenece al bucket configurado; ResourceNotFoundException: La URI S3 está mal formada o fuera del prefijo permitido |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | StorageLifecycleDenied: DELETE_PERMIT_REQUIRED; StorageLifecycleDenied: PHYSICAL_IDENTITY_UNKNOWN; DomainException: {HttpStatus.SERVICE_UNAVAILABLE} |

El árbol de decisión completo está en [flujos](../flujos/audio_assets.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/audio_assets/presentation/controllers/audio-assets-internal.controller.spec.ts:35` |

### Flujos

- Audio Assets — etapa `ctrl:AudioAssetsInternalController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 8. POST /internal/audio-assets/pregenerate

- **Origen:** CONTRATO
- **Nombre:** Pre-genera STATIC, ENUMERATED y fallbacks de forma idempotente
- **Bloque:** —
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AudioAssetsInternalController.pregenerateAssets` — `src/modules/audio_assets/presentation/controllers/audio-assets-internal.controller.ts:46`

### Qué es y para qué sirve (negocio)

Pre-genera STATIC, ENUMERATED y fallbacks de forma idempotente. Dentro del módulo (descripción del modelo, en inglés): «Cache-first text-to-speech for onboarding and other bounded experiences.»

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_64_audio_assets.puml:12`)

### Cómo se atiende (sistema)

`POST /internal/audio-assets/pregenerate` la atiende `AudioAssetsInternalController.pregenerateAssets` (src/modules/audio_assets/presentation/controllers/audio-assets-internal.controller.ts:46). Exige sesión con alguno de los roles SYSTEM. Valida el cuerpo como `PregenerateAudioAssetsDto` (1 campo, 0 obligatorios). Delega en `PregenerateAudioAssetsUseCase.execute`. Crea filas en audio_assets.audio_assets, messaging.queued_jobs. Actualiza audio_assets.audio_assets. Lee audio_assets.audio_assets, audio_assets.audio_generation_usage, audio_assets.audio_templates, messaging.message_queues, messaging.queued_jobs. Encola audio-generation.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM | `src/modules/audio_assets/presentation/controllers/audio-assets-internal.controller.ts:46` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audio_assets.audio_assets` | ESCRIBE | ACTUALIZA | POR_SQL | AudioAssetsInternalController.pregenerateAssets → PregenerateAudioAssetsUseCase.execute → ResolveAudioAssetUseCase.execute → ResolveAudioAssetUseCase.resolveRendered → AudioAssetsRepository.touchUsage | `src/modules/audio_assets/infrastructure/repositories/audio-assets.repository.ts:198` |
| `audio_assets.audio_assets` | ESCRIBE | CREA | POR_SQL | AudioAssetsInternalController.pregenerateAssets → PregenerateAudioAssetsUseCase.execute → ResolveAudioAssetUseCase.execute → ResolveAudioAssetUseCase.resolveRendered → AudioAssetsRepository.createPendingOrGet | `src/modules/audio_assets/infrastructure/repositories/audio-assets.repository.ts:84` |
| `audio_assets.audio_assets` | LEE | LEE | DIRECTA | AudioAssetsInternalController.pregenerateAssets → PregenerateAudioAssetsUseCase.execute → ResolveAudioAssetUseCase.execute → ResolveAudioAssetUseCase.resolveRendered → AudioAssetsRepository.findAssetByKey | `src/modules/audio_assets/infrastructure/repositories/audio-assets.repository.ts:55` |
| `audio_assets.audio_generation_usage` | LEE | LEE | DIRECTA | AudioAssetsInternalController.pregenerateAssets → PregenerateAudioAssetsUseCase.execute → ResolveAudioAssetUseCase.execute → ResolveAudioAssetUseCase.resolveRendered → AudioBudgetPolicy.canGenerate → AudioAssetsRepository.estimatedUsage | `src/modules/audio_assets/infrastructure/repositories/audio-assets.repository.ts:205` |
| `audio_assets.audio_templates` | LEE | LEE | DIRECTA | AudioAssetsInternalController.pregenerateAssets → PregenerateAudioAssetsUseCase.execute → ResolveAudioAssetUseCase.execute → AudioAssetsRepository.findTemplate | `src/modules/audio_assets/infrastructure/repositories/audio-assets.repository.ts:44` |
| `messaging.message_queues` | LEE | LEE | DIRECTA | AudioAssetsInternalController.pregenerateAssets → PregenerateAudioAssetsUseCase.execute → ResolveAudioAssetUseCase.execute → ResolveAudioAssetUseCase.resolveRendered → AudioJobQueueAdapter.enqueue → QueuesService.enqueueJob → QueuesRepository.findQueueByCode | `src/modules/messaging/repositories/queues.repository.ts:77` |
| `messaging.queued_jobs` | ESCRIBE | CREA | DIRECTA | AudioAssetsInternalController.pregenerateAssets → PregenerateAudioAssetsUseCase.execute → ResolveAudioAssetUseCase.execute → ResolveAudioAssetUseCase.resolveRendered → AudioJobQueueAdapter.enqueue → QueuesService.enqueueJob → QueuesRepository.createJob | `src/modules/messaging/repositories/queues.repository.ts:101` |
| `messaging.queued_jobs` | LEE | LEE | DIRECTA | AudioAssetsInternalController.pregenerateAssets → PregenerateAudioAssetsUseCase.execute → ResolveAudioAssetUseCase.execute → ResolveAudioAssetUseCase.resolveRendered → AudioJobQueueAdapter.enqueue → QueuesService.enqueueJob → QueuesRepository.findJobByDedupeKey | `src/modules/messaging/repositories/queues.repository.ts:132` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Trabajo encolado | `audio-generation` | `src/modules/audio_assets/infrastructure/adapters/audio-job-queue.adapter.ts:22` |

### Cuerpo — DTO `PregenerateAudioAssetsDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `templateKeys` | `array<string>` | No | longitud máxima 160 | `@IsOptional()` `@IsArray()` `@IsString({ each: true })` `@MaxLength(160, { each: true })` | — | `src/modules/audio_assets/presentation/dto/audio-assets.dto.ts:45` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "templateKeys": [
    "valor-ejemplo"
  ]
}
```

</details>

### Respuesta — `no declarado`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Plantilla de audio no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | Error: La plantilla enumerada excede {MAX_ENUMERATED_COMBINATIONS} combinaciones; Error: No se pudo materializar el asset de audio idempotente; StorageLifecycleDenied: LIFECYCLE_WIRING_MISSING |

El árbol de decisión completo está en [flujos](../flujos/audio_assets.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/audio_assets/presentation/controllers/audio-assets-internal.controller.spec.ts:29` |

### Flujos

- Audio Assets — etapa `ctrl:AudioAssetsInternalController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 9. GET /internal/audio-assets/status

- **Origen:** CONTRATO
- **Nombre:** Diagnóstico de audio sin convertir TTS en dependencia de readiness
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AudioAssetsInternalController.status` — `src/modules/audio_assets/presentation/controllers/audio-assets-internal.controller.ts:37`

### Qué es y para qué sirve (negocio)

Diagnóstico de audio sin convertir TTS en dependencia de readiness. Dentro del módulo (descripción del modelo, en inglés): «Cache-first text-to-speech for onboarding and other bounded experiences.»

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_64_audio_assets.puml:12`)

### Cómo se atiende (sistema)

`GET /internal/audio-assets/status` la atiende `AudioAssetsInternalController.status` (src/modules/audio_assets/presentation/controllers/audio-assets-internal.controller.ts:37). Exige sesión con alguno de los roles SYSTEM. Delega en `AudioMaintenanceService.status`. Lee audio_assets.audio_assets.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM | `src/modules/audio_assets/presentation/controllers/audio-assets-internal.controller.ts:37` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audio_assets.audio_assets` | LEE | LEE | POR_SQL | AudioAssetsInternalController.status → AudioMaintenanceService.status → AudioMaintenanceRepository.statusCounts | `src/modules/audio_assets/infrastructure/repositories/audio-maintenance.repository.ts:64` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `no declarado`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/audio_assets.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/audio_assets/presentation/controllers/audio-assets-internal.controller.spec.ts:28` |

### Flujos

- Audio Assets — etapa `ctrl:AudioAssetsInternalController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 10. POST /internal/audio-assets/verify

- **Origen:** CONTRATO
- **Nombre:** Verifica existencia y checksum de assets READY
- **Bloque:** —
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AudioAssetsInternalController.verify` — `src/modules/audio_assets/presentation/controllers/audio-assets-internal.controller.ts:61`

### Qué es y para qué sirve (negocio)

Verifica existencia y checksum de assets READY. Dentro del módulo (descripción del modelo, en inglés): «Cache-first text-to-speech for onboarding and other bounded experiences.»

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_64_audio_assets.puml:12`)

### Cómo se atiende (sistema)

`POST /internal/audio-assets/verify` la atiende `AudioAssetsInternalController.verify` (src/modules/audio_assets/presentation/controllers/audio-assets-internal.controller.ts:61). Exige sesión con alguno de los roles SYSTEM. Valida el cuerpo como `AudioMaintenanceDto` (1 campo, 0 obligatorios). Delega en `AudioMaintenanceService.verify`. Crea filas en audio_assets.audio_generation_events. Lee audio_assets.audio_assets.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM | `src/modules/audio_assets/presentation/controllers/audio-assets-internal.controller.ts:61` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audio_assets.audio_assets` | LEE | LEE | DIRECTA | AudioAssetsInternalController.verify → AudioMaintenanceService.verify → AudioMaintenanceRepository.listReady | `src/modules/audio_assets/infrastructure/repositories/audio-maintenance.repository.ts:9` |
| `audio_assets.audio_generation_events` | ESCRIBE | CREA | DIRECTA | AudioAssetsInternalController.verify → AudioMaintenanceService.verify → AudioAssetsRepository.appendEvent | `src/modules/audio_assets/infrastructure/repositories/audio-assets.repository.ts:289` |
| `audio_assets.audio_generation_events` | ESCRIBE | GUARDA | POR_TIPO | AudioAssetsInternalController.verify → AudioMaintenanceService.verify → AudioAssetsRepository.appendEvent | `src/modules/audio_assets/infrastructure/repositories/audio-assets.repository.ts:303` |

### Cuerpo — DTO `AudioMaintenanceDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `limit` | `number` | No | mínimo 1; máximo 1000 | `@IsOptional()` `@IsInt()` `@Min(1)` `@Max(1000)` | — | `src/modules/audio_assets/presentation/dto/audio-assets.dto.ts:69` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "limit": 250
}
```

</details>

### Respuesta — `no declarado`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: La URI no pertenece al almacenamiento local; ResourceNotFoundException: La URI de almacenamiento local está mal formada; ResourceNotFoundException: La URI no pertenece al bucket configurado; ResourceNotFoundException: La URI S3 está mal formada o fuera del prefijo permitido; ResourceNotFoundException: El contenido no está disponible en el almacenamiento local; ResourceNotFoundException: El contenido no está disponible en el almacenamiento configurado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.SERVICE_UNAVAILABLE}; Error: S3 object body is empty |

El árbol de decisión completo está en [flujos](../flujos/audio_assets.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/audio_assets/presentation/controllers/audio-assets-internal.controller.spec.ts:33` |

### Flujos

- Audio Assets — etapa `ctrl:AudioAssetsInternalController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

