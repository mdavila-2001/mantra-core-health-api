<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `system_context`

- **Bloque:** Núcleo y Terminología (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)
- **Operaciones:** 13 (13 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 0 · MEDIO 10 · BAJO 3
- **Tablas distintas que tocan:** 10
- **Respuestas de error y detalle contractual:** `openapi/endpoints/system-context.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | POST | `/system-context/contexts` | Definir un contexto de sistema con su versión inicial | MEDIO | 4 | PLATFORM_ADMIN, GOVERNANCE |
| 2 | POST | `/system-context/contexts/{id}/bindings` | Vincular el contexto a un consumidor | MEDIO | 3 | MODULE_OWNER, PLATFORM_ADMIN |
| 3 | POST | `/system-context/contexts/{id}/refresh` | Refrescar el contexto y snapshotear su procedencia | MEDIO | 7 | SYSTEM, PLATFORM_ADMIN |
| 4 | POST | `/system-context/contexts/{id}/rollback` | Volver a una versión anterior del contexto | MEDIO | 4 | PLATFORM_ADMIN |
| 5 | POST | `/system-context/contexts/{id}/versions/{version}/activate` | Promover la versión a vigente | MEDIO | 4 | PLATFORM_ADMIN |
| 6 | GET | `/system-context/dynamic-enums` | Leer las opciones publicadas de una enumeración | BAJO | 5 | pública |
| 7 | GET | `/system-context/dynamic-enums/bindings` | Listar los amarres campo -> enumeración | BAJO | 2 | sesión (sin roles) |
| 8 | POST | `/system-context/dynamic-enums/definitions` | Definir una enumeración dinámica ligada a un value set | MEDIO | 2 | TERMINOLOGY_ENGINEER, PLATFORM_ADMIN |
| 9 | POST | `/system-context/dynamic-enums/definitions/{defId}/bindings` | Vincular la enumeración a un campo destino | MEDIO | 3 | MODULE_OWNER, PLATFORM_ADMIN |
| 10 | POST | `/system-context/dynamic-enums/definitions/{defId}/retire` | Retirar la definición (borrado lógico gobernado) | MEDIO | 4 | PLATFORM_ADMIN |
| 11 | POST | `/system-context/dynamic-enums/definitions/{defId}/versions` | Redactar una versión con su snapshot de opciones | MEDIO | 4 | TERMINOLOGY_ENGINEER, PLATFORM_ADMIN |
| 12 | POST | `/system-context/dynamic-enums/definitions/{defId}/versions/{version}/publish` | Publicar la versión e invalidar la caché | MEDIO | 5 | TERMINOLOGY_ENGINEER, PLATFORM_ADMIN |
| 13 | POST | `/system-context/dynamic-enums/resolve` | Resolver y validar un valor de enumeración antes de escribirlo | BAJO | 3 | WRITE_SERVICE, MODULE_OWNER, PLATFORM_ADMIN |

---

## 1. POST /system-context/contexts

- **Origen:** CONTRATO
- **Nombre:** Definir un contexto de sistema con su versión inicial
- **Bloque:** Núcleo y Terminología
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SystemContextController.createContext` — `src/modules/system_context/controllers/system-context.controller.ts:289`

### Qué es y para qué sirve (negocio)

Definir un contexto de sistema con su versión inicial. Caso de uso UC-45-06: Definir contexto + versión inicial. Dentro del módulo (descripción del modelo, en inglés): «Provides versioned system context for agents, modules and workflows, and database-driven enumerations resolved from governed terminology value sets.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/system_context/README.md:50`) · MODELO (`Mantra Core Health Context/modules/diagram_45_system_context.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /system-context/contexts` la atiende `SystemContextController.createContext` (src/modules/system_context/controllers/system-context.controller.ts:289). Exige sesión con alguno de los roles PLATFORM_ADMIN, GOVERNANCE. Valida el cuerpo como `CreateSystemContextDto` (11 campos, 5 obligatorios). Delega en `SystemContextsService.createContext`. Crea filas en system_context.system_context_versions, system_context.system_contexts. Actualiza system_context.system_contexts. Lee system_context.system_contexts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PLATFORM_ADMIN, GOVERNANCE | `src/modules/system_context/controllers/system-context.controller.ts:289` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `system_context.system_context_versions` | ESCRIBE | CREA | DIRECTA | SystemContextController.createContext → SystemContextsService.createContext → SystemContextRepository.createContextVersion | `src/modules/system_context/repositories/system-context.repository.ts:789` |
| `system_context.system_contexts` | ESCRIBE | ACTUALIZA | POR_TIPO | SystemContextController.createContext → SystemContextsService.createContext | `src/modules/system_context/services/system-contexts.service.ts:113` |
| `system_context.system_contexts` | ESCRIBE | CREA | DIRECTA | SystemContextController.createContext → SystemContextsService.createContext → SystemContextRepository.createContext | `src/modules/system_context/repositories/system-context.repository.ts:717` |
| `system_context.system_contexts` | LEE | LEE | DIRECTA | SystemContextController.createContext → SystemContextsService.createContext → SystemContextRepository.findContextByCode | `src/modules/system_context/repositories/system-context.repository.ts:773` |

### Cuerpo — DTO `CreateSystemContextDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `code` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Código único del contexto | `src/modules/system_context/dto/system-context.dto.ts:596` |
| `name` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | — | `src/modules/system_context/dto/system-context.dto.ts:604` |
| `description` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/system_context/dto/system-context.dto.ts:612` |
| `contextTypeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Tipo de contexto (catálogo abierto) | `src/modules/system_context/dto/system-context.dto.ts:622` |
| `scopeTypeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Ámbito del contexto (catálogo abierto) | `src/modules/system_context/dto/system-context.dto.ts:632` |
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/system_context/dto/system-context.dto.ts:640` |
| `countryConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/system_context/dto/system-context.dto.ts:648` |
| `localeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/system_context/dto/system-context.dto.ts:656` |
| `refreshPolicyConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Política de refresco (catálogo abierto) | `src/modules/system_context/dto/system-context.dto.ts:667` |
| `schemaVersion` | `string` | No | longitud máxima 50 | `@IsOptional()` `@IsString()` `@MaxLength(50)` | — | `src/modules/system_context/dto/system-context.dto.ts:676` |
| `contextJson` | `object` | Sí | — | `@IsObject()` | Contenido del contexto. Nunca secretos: sólo referencias gobernadas. | `src/modules/system_context/dto/system-context.dto.ts:686` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "contextTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "scopeTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "contextJson": {}
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "description": "Texto descriptivo de ejemplo",
  "contextTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "scopeTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "countryConceptId": "00000000-0000-4000-8000-000000000001",
  "localeConceptId": "00000000-0000-4000-8000-000000000001",
  "refreshPolicyConceptId": "00000000-0000-4000-8000-000000000001",
  "schemaVersion": "valor-ejemplo",
  "contextJson": {}
}
```

</details>

### Respuesta — `Promise<SystemContextResponseDto>` · DTO `SystemContextResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/system_context/dto/system-context.dto.ts:697` |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/system_context/dto/system-context.dto.ts:703` |
| `currentVersionId` | `string` | Sí | formato uuid | — | Versión 1, creada en la misma transacción | `src/modules/system_context/dto/system-context.dto.ts:712` |
| `contentHash` | `string` | Sí | — | — | Hash del contenido de la versión inicial | `src/modules/system_context/dto/system-context.dto.ts:718` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/system_context/dto/system-context.dto.ts:724` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe un contexto con ese código |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.PAYLOAD_TOO_LARGE} |

El árbol de decisión completo está en [flujos](../flujos/system_context.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/system_context/controllers/system-context.controller.spec.ts:128` |

### Flujos

- Módulo 45 — Contexto de Sistema y Enumeraciones Dinámicas — etapa `UC-45-06`

---

## 2. POST /system-context/contexts/{id}/bindings

- **Origen:** CONTRATO
- **Nombre:** Vincular el contexto a un consumidor
- **Bloque:** Núcleo y Terminología
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SystemContextController.createContextBinding` — `src/modules/system_context/controllers/system-context.controller.ts:354`

### Qué es y para qué sirve (negocio)

Vincular el contexto a un consumidor. Caso de uso UC-45-10: Vincular contexto a un consumidor. Dentro del módulo (descripción del modelo, en inglés): «Provides versioned system context for agents, modules and workflows, and database-driven enumerations resolved from governed terminology value sets.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/system_context/README.md:54`) · MODELO (`Mantra Core Health Context/modules/diagram_45_system_context.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /system-context/contexts/{id}/bindings` la atiende `SystemContextController.createContextBinding` (src/modules/system_context/controllers/system-context.controller.ts:354). Exige sesión con alguno de los roles MODULE_OWNER, PLATFORM_ADMIN. Valida el cuerpo como `CreateContextBindingDto` (8 campos, 2 obligatorios). Delega en `SystemContextsService.createBinding`. Crea filas en system_context.system_context_bindings. Lee system_context.system_context_bindings, system_context.system_contexts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: MODULE_OWNER, PLATFORM_ADMIN | `src/modules/system_context/controllers/system-context.controller.ts:354` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/system_context/controllers/system-context.controller.ts:354` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `system_context.system_context_bindings` | ESCRIBE | CREA | DIRECTA | SystemContextController.createContextBinding → SystemContextsService.createBinding → SystemContextRepository.createContextBinding | `src/modules/system_context/repositories/system-context.repository.ts:1116` |
| `system_context.system_context_bindings` | LEE | LEE | DIRECTA | SystemContextController.createContextBinding → SystemContextsService.createBinding → SystemContextRepository.findContextBindingsForConsumer | `src/modules/system_context/repositories/system-context.repository.ts:1143` |
| `system_context.system_contexts` | LEE | LEE | DIRECTA | SystemContextController.createContextBinding → SystemContextsService.createBinding → SystemContextRepository.findContextForUpdate | `src/modules/system_context/repositories/system-context.repository.ts:755` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateContextBindingDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `consumerTypeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Naturaleza del consumidor (catálogo abierto) | `src/modules/system_context/dto/system-context.dto.ts:1018` |
| `consumerId` | `string` | Sí | formato uuid | `@IsUUID()` | Consumidor concreto | `src/modules/system_context/dto/system-context.dto.ts:1025` |
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/system_context/dto/system-context.dto.ts:1033` |
| `countryConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/system_context/dto/system-context.dto.ts:1041` |
| `activationRuleJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Condición de activación del binding | `src/modules/system_context/dto/system-context.dto.ts:1049` |
| `priority` | `number` | No | mínimo 1 | `@IsOptional()` `@IsInt()` `@Min(1)` | Desempata varios bindings; menor gana | `src/modules/system_context/dto/system-context.dto.ts:1061` |
| `validFrom` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | — | `src/modules/system_context/dto/system-context.dto.ts:1069` |
| `validTo` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | — | `src/modules/system_context/dto/system-context.dto.ts:1077` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "consumerTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "consumerId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "consumerTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "consumerId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "countryConceptId": "00000000-0000-4000-8000-000000000001",
  "activationRuleJson": {},
  "priority": 1,
  "validFrom": "2026-07-31T12:00:00.000Z",
  "validTo": "2026-07-31T12:00:00.000Z"
}
```

</details>

### Respuesta — `Promise<ContextBindingResponseDto>` · DTO `ContextBindingResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/system_context/dto/system-context.dto.ts:1088` |
| `systemContextId` | `string` | Sí | formato uuid | — | Identificador asociado a system context. | `src/modules/system_context/dto/system-context.dto.ts:1094` |
| `priority` | `number` | Sí | — | — | Valor de priority mantenido por la instancia. | `src/modules/system_context/dto/system-context.dto.ts:1100` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/system_context/dto/system-context.dto.ts:1106` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Contexto no encontrado |
| 409 | `CONFLICT` | ConflictException: El consumidor ya tiene un binding en esa ventana |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La ventana de validez está invertida; PreconditionFailedException: El contexto no está activo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/system_context.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/system_context/controllers/system-context.controller.spec.ts:167` |

### Flujos

- Módulo 45 — Contexto de Sistema y Enumeraciones Dinámicas — etapa `UC-45-10`

---

## 3. POST /system-context/contexts/{id}/refresh

- **Origen:** CONTRATO
- **Nombre:** Refrescar el contexto y snapshotear su procedencia
- **Bloque:** Núcleo y Terminología
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SystemContextController.refreshContext` — `src/modules/system_context/controllers/system-context.controller.ts:310`

### Qué es y para qué sirve (negocio)

Refrescar el contexto y snapshotear su procedencia. Caso de uso UC-45-07: Refresco idempotente con nueva versión. Dentro del módulo (descripción del modelo, en inglés): «Provides versioned system context for agents, modules and workflows, and database-driven enumerations resolved from governed terminology value sets.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/system_context/README.md:51`) · MODELO (`Mantra Core Health Context/modules/diagram_45_system_context.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /system-context/contexts/{id}/refresh` la atiende `SystemContextController.refreshContext` (src/modules/system_context/controllers/system-context.controller.ts:310). Exige sesión con alguno de los roles SYSTEM, PLATFORM_ADMIN. Valida el cuerpo como `RefreshSystemContextDto` (16 campos, 3 obligatorios). Delega en `SystemContextsService.refreshContext`. Crea filas en system_context.system_context_inputs, system_context.system_context_refresh_runs, system_context.system_context_versions. Actualiza system_context.system_context_refresh_runs. Lee system_context.system_context_refresh_runs, system_context.system_context_versions, system_context.system_contexts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, PLATFORM_ADMIN | `src/modules/system_context/controllers/system-context.controller.ts:310` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/system_context/controllers/system-context.controller.ts:310` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `system_context.system_context_inputs` | ESCRIBE | CREA | DIRECTA | SystemContextController.refreshContext → SystemContextsService.refreshContext → SystemContextRepository.createContextInput | `src/modules/system_context/repositories/system-context.repository.ts:930` |
| `system_context.system_context_refresh_runs` | ESCRIBE | ACTUALIZA | POR_TIPO | SystemContextController.refreshContext → SystemContextsService.refreshContext | `src/modules/system_context/services/system-contexts.service.ts:206` |
| `system_context.system_context_refresh_runs` | ESCRIBE | CREA | DIRECTA | SystemContextController.refreshContext → SystemContextsService.refreshContext → SystemContextRepository.createRefreshRun | `src/modules/system_context/repositories/system-context.repository.ts:1002` |
| `system_context.system_context_refresh_runs` | LEE | LEE | DIRECTA | SystemContextController.refreshContext → SystemContextsService.refreshContext → SystemContextRepository.findRefreshRunByKey | `src/modules/system_context/repositories/system-context.repository.ts:1044` |
| `system_context.system_context_versions` | ESCRIBE | CREA | DIRECTA | SystemContextController.refreshContext → SystemContextsService.refreshContext → SystemContextRepository.createContextVersion | `src/modules/system_context/repositories/system-context.repository.ts:789` |
| `system_context.system_context_versions` | LEE | LEE | DIRECTA | SystemContextController.refreshContext → SystemContextsService.refreshContext → SystemContextRepository.findLatestContextVersion | `src/modules/system_context/repositories/system-context.repository.ts:854` |
| `system_context.system_contexts` | LEE | LEE | DIRECTA | SystemContextController.refreshContext → SystemContextsService.refreshContext → SystemContextRepository.findContextForUpdate | `src/modules/system_context/repositories/system-context.repository.ts:755` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `RefreshSystemContextDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `idempotencyKey` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Clave de idempotencia de la corrida | `src/modules/system_context/dto/system-context.dto.ts:844` |
| `trigger` | `string` | Sí | valores: SCHEDULED, MANUAL, EVENT | `@IsIn(REFRESH_TRIGGERS)` | — | `src/modules/system_context/dto/system-context.dto.ts:851` |
| `contextJson` | `object` | Sí | — | `@IsObject()` | Contenido regenerado del contexto | `src/modules/system_context/dto/system-context.dto.ts:858` |
| `schemaVersion` | `string` | No | longitud máxima 50 | `@IsOptional()` `@IsString()` `@MaxLength(50)` | — | `src/modules/system_context/dto/system-context.dto.ts:867` |
| `generatedByAgentId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Agente que generó el contenido | `src/modules/system_context/dto/system-context.dto.ts:878` |
| `inputs` | `array<ContextInputDto>` | No | máximo 500 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayMaxSize(500)` `@ValidateNested({ each: true })` `@Type(() => ContextInputDto)` | Procedencia de lo recogido | `src/modules/system_context/dto/system-context.dto.ts:892` |
| `inputs[].sourceTypeConceptId` | `string` | No | formato uuid | `@IsUUID()` | Naturaleza de la fuente (catálogo abierto) | `src/modules/system_context/dto/system-context.dto.ts:743` |
| `inputs[].sourceSchemaName` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/system_context/dto/system-context.dto.ts:752` |
| `inputs[].sourceEntityName` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/system_context/dto/system-context.dto.ts:761` |
| `inputs[].sourceRecordId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/system_context/dto/system-context.dto.ts:769` |
| `inputs[].sourceVersionId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/system_context/dto/system-context.dto.ts:777` |
| `inputs[].sourceContentHash` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Hash del contenido de la fuente en el momento del snapshot | `src/modules/system_context/dto/system-context.dto.ts:788` |
| `inputs[].sourceFreshnessAt` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | Frescura del dato de origen | `src/modules/system_context/dto/system-context.dto.ts:799` |
| `inputs[].precedence` | `number` | No | mínimo 1 | `@IsOptional()` `@IsInt()` `@Min(1)` | Precedencia; menor gana ante colisión | `src/modules/system_context/dto/system-context.dto.ts:811` |
| `inputs[].required` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Si falta, la corrida falla | `src/modules/system_context/dto/system-context.dto.ts:822` |
| `inputs[].missing` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | true si la entrada no pudo recogerse | `src/modules/system_context/dto/system-context.dto.ts:830` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "idempotencyKey": "valor-ejemplo",
  "trigger": "SCHEDULED",
  "contextJson": {}
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "idempotencyKey": "valor-ejemplo",
  "trigger": "SCHEDULED",
  "contextJson": {},
  "schemaVersion": "valor-ejemplo",
  "generatedByAgentId": "00000000-0000-4000-8000-000000000001",
  "inputs": [
    {
      "sourceTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "sourceSchemaName": "Nombre de ejemplo",
      "sourceEntityName": "Nombre de ejemplo",
      "sourceRecordId": "00000000-0000-4000-8000-000000000001",
      "sourceVersionId": "00000000-0000-4000-8000-000000000001",
      "sourceContentHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      "sourceFreshnessAt": "2026-07-31T12:00:00.000Z",
      "precedence": 1,
      "required": false,
      "missing": true
    }
  ]
}
```

</details>

### Respuesta — `Promise<RefreshRunResponseDto>` · DTO `RefreshRunResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `runId` | `string` | Sí | formato uuid | — | Identificador asociado a run. | `src/modules/system_context/dto/system-context.dto.ts:903` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/system_context/dto/system-context.dto.ts:909` |
| `versionId` | `string` | No | formato uuid | — | Versión redactada, si hubo cambio | `src/modules/system_context/dto/system-context.dto.ts:918` |
| `versionNumber` | `number` | No | — | — | Número de la versión redactada | `src/modules/system_context/dto/system-context.dto.ts:924` |
| `contentHash` | `string` | Sí | — | — | Hash del contenido regenerado | `src/modules/system_context/dto/system-context.dto.ts:930` |
| `unchanged` | `boolean` | Sí | — | — | true si el contenido no cambió y no se redactó versión | `src/modules/system_context/dto/system-context.dto.ts:938` |
| `inputCount` | `number` | Sí | — | — | Entradas de procedencia registradas | `src/modules/system_context/dto/system-context.dto.ts:944` |
| `duplicate` | `boolean` | Sí | — | — | true si la corrida ya existía con esa clave | `src/modules/system_context/dto/system-context.dto.ts:950` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Contexto no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El contexto no está activo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.PAYLOAD_TOO_LARGE}; DomainException: {HttpStatus.BAD_REQUEST} |

El árbol de decisión completo está en [flujos](../flujos/system_context.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/system_context/controllers/system-context.controller.spec.ts:138` |

### Flujos

- Módulo 45 — Contexto de Sistema y Enumeraciones Dinámicas — etapa `UC-45-07`

---

## 4. POST /system-context/contexts/{id}/rollback

- **Origen:** CONTRATO
- **Nombre:** Volver a una versión anterior del contexto
- **Bloque:** Núcleo y Terminología
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SystemContextController.rollbackContext` — `src/modules/system_context/controllers/system-context.controller.ts:376`

### Qué es y para qué sirve (negocio)

Volver a una versión anterior del contexto. Caso de uso UC-45-12: Volver a una versión anterior. Dentro del módulo (descripción del modelo, en inglés): «Provides versioned system context for agents, modules and workflows, and database-driven enumerations resolved from governed terminology value sets.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/system_context/README.md:56`) · MODELO (`Mantra Core Health Context/modules/diagram_45_system_context.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /system-context/contexts/{id}/rollback` la atiende `SystemContextController.rollbackContext` (src/modules/system_context/controllers/system-context.controller.ts:376). Exige sesión con alguno de los roles PLATFORM_ADMIN. Valida el cuerpo como `RollbackContextDto` (3 campos, 2 obligatorios). Delega en `SystemContextsService.rollbackContext`. Actualiza system_context.system_context_versions, system_context.system_contexts. Lee system_context.system_context_versions, system_context.system_contexts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PLATFORM_ADMIN | `src/modules/system_context/controllers/system-context.controller.ts:376` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/system_context/controllers/system-context.controller.ts:376` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `system_context.system_context_versions` | ESCRIBE | ACTUALIZA | POR_TIPO | SystemContextController.rollbackContext → SystemContextsService.rollbackContext | `src/modules/system_context/services/system-contexts.service.ts:586` |
| `system_context.system_context_versions` | LEE | LEE | DIRECTA | SystemContextController.rollbackContext → SystemContextsService.rollbackContext → SystemContextRepository.findContextVersionForUpdate | `src/modules/system_context/repositories/system-context.repository.ts:836` |
| `system_context.system_contexts` | ESCRIBE | ACTUALIZA | POR_TIPO | SystemContextController.rollbackContext → SystemContextsService.rollbackContext | `src/modules/system_context/services/system-contexts.service.ts:593` |
| `system_context.system_contexts` | LEE | LEE | DIRECTA | SystemContextController.rollbackContext → SystemContextsService.rollbackContext → SystemContextRepository.findContextForUpdate | `src/modules/system_context/repositories/system-context.repository.ts:755` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `RollbackContextDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `targetVersionNumber` | `number` | Sí | mínimo 1 | `@IsInt()` `@Min(1)` | Versión a reactivar | `src/modules/system_context/dto/system-context.dto.ts:1121` |
| `reason` | `string` | Sí | — | `@IsString()` | Por qué se vuelve atrás | `src/modules/system_context/dto/system-context.dto.ts:1128` |
| `expectedContentHash` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Hash esperado de la versión objetivo | `src/modules/system_context/dto/system-context.dto.ts:1137` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "targetVersionNumber": 1,
  "reason": "Texto descriptivo de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "targetVersionNumber": 1,
  "reason": "Texto descriptivo de ejemplo",
  "expectedContentHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
}
```

</details>

### Respuesta — `Promise<RollbackContextResponseDto>` · DTO `RollbackContextResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Versión reactivada | `src/modules/system_context/dto/system-context.dto.ts:1148` |
| `versionNumber` | `number` | Sí | — | — | Valor de version number mantenido por la instancia. | `src/modules/system_context/dto/system-context.dto.ts:1154` |
| `supersededVersionId` | `string` | Sí | formato uuid | — | Versión que queda superseded | `src/modules/system_context/dto/system-context.dto.ts:1160` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/system_context/dto/system-context.dto.ts:1166` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Contexto no encontrado; ResourceNotFoundException: Versión objetivo no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Sólo se puede volver a una versión que estuvo vigente; PreconditionFailedException: El contenido de la versión no es el esperado; PreconditionFailedException: El contexto no tiene versión vigente |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/system_context.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/system_context/controllers/system-context.controller.spec.ts:181` |

### Flujos

- Módulo 45 — Contexto de Sistema y Enumeraciones Dinámicas — etapa `UC-45-12`

---

## 5. POST /system-context/contexts/{id}/versions/{version}/activate

- **Origen:** CONTRATO
- **Nombre:** Promover la versión a vigente
- **Bloque:** Núcleo y Terminología
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SystemContextController.activateContextVersion` — `src/modules/system_context/controllers/system-context.controller.ts:332`

### Qué es y para qué sirve (negocio)

Promover la versión a vigente. Caso de uso UC-45-09: Promover versión vigente. Dentro del módulo (descripción del modelo, en inglés): «Provides versioned system context for agents, modules and workflows, and database-driven enumerations resolved from governed terminology value sets.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/system_context/README.md:53`) · MODELO (`Mantra Core Health Context/modules/diagram_45_system_context.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /system-context/contexts/{id}/versions/{version}/activate` la atiende `SystemContextController.activateContextVersion` (src/modules/system_context/controllers/system-context.controller.ts:332). Exige sesión con alguno de los roles PLATFORM_ADMIN. Valida el cuerpo como `ActivateContextVersionDto` (1 campo, 0 obligatorios). Delega en `SystemContextsService.activateVersion`. Actualiza system_context.system_context_versions, system_context.system_contexts. Lee system_context.system_context_versions, system_context.system_contexts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PLATFORM_ADMIN | `src/modules/system_context/controllers/system-context.controller.ts:332` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/system_context/controllers/system-context.controller.ts:332` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `system_context.system_context_versions` | ESCRIBE | ACTUALIZA | POR_TIPO | SystemContextController.activateContextVersion → SystemContextsService.activateVersion | `src/modules/system_context/services/system-contexts.service.ts:396` |
| `system_context.system_context_versions` | LEE | LEE | DIRECTA | SystemContextController.activateContextVersion → SystemContextsService.activateVersion → SystemContextRepository.findContextVersionForUpdate | `src/modules/system_context/repositories/system-context.repository.ts:836` |
| `system_context.system_contexts` | ESCRIBE | ACTUALIZA | POR_TIPO | SystemContextController.activateContextVersion → SystemContextsService.activateVersion | `src/modules/system_context/services/system-contexts.service.ts:404` |
| `system_context.system_contexts` | LEE | LEE | DIRECTA | SystemContextController.activateContextVersion → SystemContextsService.activateVersion → SystemContextRepository.findContextForUpdate | `src/modules/system_context/repositories/system-context.repository.ts:755` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |
| `version` | path | Sí | `number` | — |

### Cuerpo — DTO `ActivateContextVersionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `expectedContentHash` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Hash esperado; si no coincide con el de la versión, no se activa | `src/modules/system_context/dto/system-context.dto.ts:969` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "expectedContentHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
}
```

</details>

### Respuesta — `Promise<ActivateContextVersionResponseDto>` · DTO `ActivateContextVersionResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/system_context/dto/system-context.dto.ts:980` |
| `versionNumber` | `number` | Sí | — | — | Valor de version number mantenido por la instancia. | `src/modules/system_context/dto/system-context.dto.ts:986` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/system_context/dto/system-context.dto.ts:992` |
| `supersededVersionId` | `string` | No | formato uuid | — | Versión que queda superseded | `src/modules/system_context/dto/system-context.dto.ts:1001` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Contexto no encontrado; ResourceNotFoundException: Versión del contexto no encontrada |
| 409 | `CONFLICT` | ConflictException: La versión ya es la vigente |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El contexto no está activo; PreconditionFailedException: La versión no está en borrador; PreconditionFailedException: El contenido de la versión no es el esperado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/system_context.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/system_context/controllers/system-context.controller.spec.ts:152` |

### Flujos

- Módulo 45 — Contexto de Sistema y Enumeraciones Dinámicas — etapa `UC-45-09`

---

## 6. GET /system-context/dynamic-enums

- **Origen:** CONTRATO
- **Nombre:** Leer las opciones publicadas de una enumeración
- **Bloque:** Núcleo y Terminología
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SystemContextController.readEnum` — `src/modules/system_context/controllers/system-context.controller.ts:133`

### Qué es y para qué sirve (negocio)

Leer las opciones publicadas de una enumeración. Dentro del módulo (descripción del modelo, en inglés): «Provides versioned system context for agents, modules and workflows, and database-driven enumerations resolved from governed terminology value sets.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_45_system_context.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`GET /system-context/dynamic-enums` la atiende `SystemContextController.readEnum` (src/modules/system_context/controllers/system-context.controller.ts:133). Es una ruta pública: no exige token. Delega en `DynamicEnumsService.readEnum`. Lee system_context.dynamic_enum_bindings, system_context.dynamic_enum_definitions, system_context.dynamic_enum_options, system_context.dynamic_enum_versions, terminology.concept_designations.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/system_context/controllers/system-context.controller.ts:133` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `system_context.dynamic_enum_bindings` | LEE | LEE | DIRECTA | SystemContextController.readEnum → DynamicEnumsService.readEnum → DynamicEnumsService.definitionForTarget → SystemContextRepository.findEnumBindingByTarget | `src/modules/system_context/repositories/system-context.repository.ts:582` |
| `system_context.dynamic_enum_definitions` | LEE | LEE | DIRECTA | SystemContextController.readEnum → DynamicEnumsService.readEnum → SystemContextRepository.findEnumDefinitionByCode | `src/modules/system_context/repositories/system-context.repository.ts:244` |
| `system_context.dynamic_enum_options` | LEE | LEE | DIRECTA | SystemContextController.readEnum → DynamicEnumsService.readEnum → SystemContextRepository.findEnumOptions | `src/modules/system_context/repositories/system-context.repository.ts:436` |
| `system_context.dynamic_enum_versions` | LEE | LEE | DIRECTA | SystemContextController.readEnum → DynamicEnumsService.readEnum → SystemContextRepository.findPublishedEnumVersion | `src/modules/system_context/repositories/system-context.repository.ts:393` |
| `terminology.concept_designations` | LEE | LEE | DIRECTA | SystemContextController.readEnum → DynamicEnumsService.readEnum → SystemContextRepository.findSpanishDisplays | `src/modules/system_context/repositories/system-context.repository.ts:456` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `target` | query | No | `string` | Campo destino, como `profiles.persons.sex_at_birth_concept_id` |
| `code` | query | No | `string` | Código estable de la enumeración, como `sex-at-birth` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ReadDynamicEnumResponseDto>` · DTO `ReadDynamicEnumResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `code` | `string` | Sí | — | — | Código estable de la enumeración. | `src/modules/system_context/dto/system-context.dto.ts:1230` |
| `name` | `string` | Sí | — | — | Nombre legible de la enumeración. | `src/modules/system_context/dto/system-context.dto.ts:1236` |
| `description` | `string` | No | — | — | Qué gobierna la enumeración. | `src/modules/system_context/dto/system-context.dto.ts:1242` |
| `definitionId` | `string` | Sí | formato uuid | — | Identificador de la definición. | `src/modules/system_context/dto/system-context.dto.ts:1248` |
| `valueSetId` | `string` | Sí | formato uuid | — | Conjunto de valores de terminología del que sale la enumeración. | `src/modules/system_context/dto/system-context.dto.ts:1254` |
| `versionId` | `string` | Sí | formato uuid | — | Versión publicada de la que salen las opciones. | `src/modules/system_context/dto/system-context.dto.ts:1260` |
| `valueSetVersionId` | `string` | Sí | formato uuid | — | Versión del value set que la versión vigente congeló. Es lo que hay que volver a mandar para redactar la siguiente: la entidad la exige y ninguna otra lectura la exponía. | `src/modules/system_context/dto/system-context.dto.ts:1269` |
| `schemaVersion` | `string` | Sí | — | — | Versión de esquema que la versión vigente declara. Se repite al redactar. | `src/modules/system_context/dto/system-context.dto.ts:1273` |
| `cacheToken` | `string` | No | — | — | Testigo de caché de la versión publicada. | `src/modules/system_context/dto/system-context.dto.ts:1279` |
| `allowCustomValue` | `boolean` | Sí | — | — | Si el campo admite un valor fuera del conjunto. | `src/modules/system_context/dto/system-context.dto.ts:1285` |
| `options` | `array<DynamicEnumOptionItemDto>` | Sí | — | — | Opciones habilitadas, en el orden en que se ofrecen. | `src/modules/system_context/dto/system-context.dto.ts:1291` |
| `options[].conceptId` | `string` | Sí | formato uuid | — | Concepto que respalda la opción; es el valor que se envía al escribir. | `src/modules/system_context/dto/system-context.dto.ts:1183` |
| `options[].code` | `string` | Sí | — | — | Código estable del concepto. | `src/modules/system_context/dto/system-context.dto.ts:1189` |
| `options[].display` | `string` | Sí | — | — | Rótulo legible de la opción. | `src/modules/system_context/dto/system-context.dto.ts:1195` |
| `options[].displayEs` | `string` | No | — | — | Nombre en castellano (designación `ES` preferida del concepto), si existe. `display` es el rótulo del sistema de codificación y está en inglés («Complete blood count»); el selector prefiere éste cuando viene. | `src/modules/system_context/dto/system-context.dto.ts:1204` |
| `options[].ordinal` | `number` | No | — | — | Posición en la que se ofrece, empezando en cero. | `src/modules/system_context/dto/system-context.dto.ts:1210` |
| `options[].isDefault` | `boolean` | Sí | — | — | Si la opción viene preseleccionada. | `src/modules/system_context/dto/system-context.dto.ts:1216` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | BadRequestException: Indique el campo destino (`target`) o el código de la enumeración (`code`); BadRequestException: El campo destino se escribe como `esquema.tabla.columna` |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Enumeración no encontrada; ResourceNotFoundException: La enumeración está retirada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La enumeración no tiene versión publicada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/system_context.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/lab-reception-inbox.int-spec.ts:217` |
| CONTROLADOR | `src/modules/system_context/controllers/system-context.controller.spec.ts:196` |

### Flujos

- Módulo 45 — Contexto de Sistema y Enumeraciones Dinámicas — etapa `ctrl:SystemContextController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 7. GET /system-context/dynamic-enums/bindings

- **Origen:** CONTRATO
- **Nombre:** Listar los amarres campo -> enumeración
- **Bloque:** Núcleo y Terminología
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SystemContextController.listEnumBindings` — `src/modules/system_context/controllers/system-context.controller.ts:93`

### Qué es y para qué sirve (negocio)

Listar los amarres campo -> enumeración. Dentro del módulo (descripción del modelo, en inglés): «Provides versioned system context for agents, modules and workflows, and database-driven enumerations resolved from governed terminology value sets.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_45_system_context.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`GET /system-context/dynamic-enums/bindings` la atiende `SystemContextController.listEnumBindings` (src/modules/system_context/controllers/system-context.controller.ts:93). Exige sesión; el controlador no declara roles. Delega en `DynamicEnumsService.listBindings`. Lee system_context.dynamic_enum_bindings, system_context.dynamic_enum_definitions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/system_context/controllers/system-context.controller.ts:93` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `system_context.dynamic_enum_bindings` | LEE | LEE | DIRECTA | SystemContextController.listEnumBindings → DynamicEnumsService.listBindings → SystemContextRepository.findActiveEnumBindings | `src/modules/system_context/repositories/system-context.repository.ts:621` |
| `system_context.dynamic_enum_definitions` | LEE | LEE | DIRECTA | SystemContextController.listEnumBindings → DynamicEnumsService.listBindings → SystemContextRepository.findEnumDefinitionsByIds | `src/modules/system_context/repositories/system-context.repository.ts:642` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `schema` | query | No | `string` | Esquema al que acotar (por ejemplo, `profiles`) |
| `entity` | query | No | `string` | Tabla a la que acotar (por ejemplo, `persons`) |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ListDynamicEnumBindingsResponseDto>` · DTO `ListDynamicEnumBindingsResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<DynamicEnumBindingItemDto>` | Sí | — | — | Amarres activos, ordenados por campo. | `src/modules/system_context/dto/system-context.dto.ts:1370` |
| `items[].target` | `string` | Sí | — | — | Campo gobernado, en la forma `esquema.tabla.columna`. | `src/modules/system_context/dto/system-context.dto.ts:1305` |
| `items[].targetSchemaName` | `string` | Sí | — | — | Esquema de la tabla destino. | `src/modules/system_context/dto/system-context.dto.ts:1311` |
| `items[].targetEntityName` | `string` | Sí | — | — | Tabla destino. | `src/modules/system_context/dto/system-context.dto.ts:1317` |
| `items[].targetFieldName` | `string` | Sí | — | — | Columna destino. | `src/modules/system_context/dto/system-context.dto.ts:1323` |
| `items[].enumCode` | `string` | Sí | — | — | Código estable de la enumeración que lo gobierna. | `src/modules/system_context/dto/system-context.dto.ts:1329` |
| `items[].definitionId` | `string` | Sí | formato uuid | — | Identificador de la definición. | `src/modules/system_context/dto/system-context.dto.ts:1335` |
| `items[].valueSetId` | `string` | Sí | formato uuid | — | Conjunto de valores del que sale la enumeración. | `src/modules/system_context/dto/system-context.dto.ts:1341` |
| `items[].required` | `boolean` | Sí | — | — | Si el amarre declara el campo obligatorio. | `src/modules/system_context/dto/system-context.dto.ts:1347` |
| `items[].fallbackConceptId` | `string` | No | formato uuid | — | Concepto de reserva cuando la validación es permisiva. | `src/modules/system_context/dto/system-context.dto.ts:1353` |
| `items[].validationModeConceptId` | `string` | No | formato uuid | — | Modo de validación con el que se resuelve el valor propuesto. | `src/modules/system_context/dto/system-context.dto.ts:1359` |
| `count` | `number` | Sí | — | — | Cuántos amarres trae la respuesta. | `src/modules/system_context/dto/system-context.dto.ts:1376` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/system_context.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/system_context/controllers/system-context.controller.spec.ts:222` |

### Flujos

- Módulo 45 — Contexto de Sistema y Enumeraciones Dinámicas — etapa `ctrl:SystemContextController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 8. POST /system-context/dynamic-enums/definitions

- **Origen:** CONTRATO
- **Nombre:** Definir una enumeración dinámica ligada a un value set
- **Bloque:** Núcleo y Terminología
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SystemContextController.createEnumDefinition` — `src/modules/system_context/controllers/system-context.controller.ts:160`

### Qué es y para qué sirve (negocio)

Definir una enumeración dinámica ligada a un value set. Caso de uso UC-45-01: Definir enumeración ligada a un value set. Dentro del módulo (descripción del modelo, en inglés): «Provides versioned system context for agents, modules and workflows, and database-driven enumerations resolved from governed terminology value sets.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/system_context/README.md:45`) · MODELO (`Mantra Core Health Context/modules/diagram_45_system_context.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /system-context/dynamic-enums/definitions` la atiende `SystemContextController.createEnumDefinition` (src/modules/system_context/controllers/system-context.controller.ts:160). Exige sesión con alguno de los roles TERMINOLOGY_ENGINEER, PLATFORM_ADMIN. Valida el cuerpo como `CreateEnumDefinitionDto` (10 campos, 5 obligatorios). Delega en `DynamicEnumsService.createDefinition`. Crea filas en system_context.dynamic_enum_definitions. Lee system_context.dynamic_enum_definitions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: TERMINOLOGY_ENGINEER, PLATFORM_ADMIN | `src/modules/system_context/controllers/system-context.controller.ts:160` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `system_context.dynamic_enum_definitions` | ESCRIBE | CREA | DIRECTA | SystemContextController.createEnumDefinition → DynamicEnumsService.createDefinition → SystemContextRepository.createEnumDefinition | `src/modules/system_context/repositories/system-context.repository.ts:184` |
| `system_context.dynamic_enum_definitions` | LEE | LEE | DIRECTA | SystemContextController.createEnumDefinition → DynamicEnumsService.createDefinition → SystemContextRepository.findEnumDefinitionByCode | `src/modules/system_context/repositories/system-context.repository.ts:244` |

### Cuerpo — DTO `CreateEnumDefinitionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `code` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Código único global de la definición | `src/modules/system_context/dto/system-context.dto.ts:46` |
| `name` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | — | `src/modules/system_context/dto/system-context.dto.ts:54` |
| `description` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/system_context/dto/system-context.dto.ts:62` |
| `valueSetId` | `string` | Sí | formato uuid | `@IsUUID()` | Value set de terminología del que sale el enum | `src/modules/system_context/dto/system-context.dto.ts:72` |
| `scopeTypeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Ámbito de la definición (catálogo abierto) | `src/modules/system_context/dto/system-context.dto.ts:82` |
| `selectionModeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Modo de selección (catálogo abierto) | `src/modules/system_context/dto/system-context.dto.ts:92` |
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/system_context/dto/system-context.dto.ts:100` |
| `countryConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/system_context/dto/system-context.dto.ts:108` |
| `allowTenantExtension` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | El tenant puede añadir opciones propias | `src/modules/system_context/dto/system-context.dto.ts:119` |
| `allowCustomValue` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Se admite un valor fuera del catálogo | `src/modules/system_context/dto/system-context.dto.ts:130` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "valueSetId": "00000000-0000-4000-8000-000000000001",
  "scopeTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "selectionModeConceptId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "description": "Texto descriptivo de ejemplo",
  "valueSetId": "00000000-0000-4000-8000-000000000001",
  "scopeTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "selectionModeConceptId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "countryConceptId": "00000000-0000-4000-8000-000000000001",
  "allowTenantExtension": false,
  "allowCustomValue": false
}
```

</details>

### Respuesta — `Promise<EnumDefinitionResponseDto>` · DTO `EnumDefinitionResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/system_context/dto/system-context.dto.ts:141` |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/system_context/dto/system-context.dto.ts:147` |
| `statusConceptId` | `string` | Sí | formato uuid | — | La definición nace en borrador | `src/modules/system_context/dto/system-context.dto.ts:156` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe una enumeración con ese código |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/system_context.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/system_context/controllers/system-context.controller.spec.ts:65` |

### Flujos

- Módulo 45 — Contexto de Sistema y Enumeraciones Dinámicas — etapa `UC-45-01`

---

## 9. POST /system-context/dynamic-enums/definitions/{defId}/bindings

- **Origen:** CONTRATO
- **Nombre:** Vincular la enumeración a un campo destino
- **Bloque:** Núcleo y Terminología
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SystemContextController.createEnumBinding` — `src/modules/system_context/controllers/system-context.controller.ts:225`

### Qué es y para qué sirve (negocio)

Vincular la enumeración a un campo destino. Caso de uso UC-45-04: Vincular el enum a un campo. Dentro del módulo (descripción del modelo, en inglés): «Provides versioned system context for agents, modules and workflows, and database-driven enumerations resolved from governed terminology value sets.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/system_context/README.md:48`) · MODELO (`Mantra Core Health Context/modules/diagram_45_system_context.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /system-context/dynamic-enums/definitions/{defId}/bindings` la atiende `SystemContextController.createEnumBinding` (src/modules/system_context/controllers/system-context.controller.ts:225). Exige sesión con alguno de los roles MODULE_OWNER, PLATFORM_ADMIN. Valida el cuerpo como `CreateEnumBindingDto` (7 campos, 4 obligatorios). Delega en `DynamicEnumsService.createBinding`. Crea filas en system_context.dynamic_enum_bindings. Lee system_context.dynamic_enum_bindings, system_context.dynamic_enum_definitions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: MODULE_OWNER, PLATFORM_ADMIN | `src/modules/system_context/controllers/system-context.controller.ts:225` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: defId | `src/modules/system_context/controllers/system-context.controller.ts:225` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `system_context.dynamic_enum_bindings` | ESCRIBE | CREA | DIRECTA | SystemContextController.createEnumBinding → DynamicEnumsService.createBinding → SystemContextRepository.createEnumBinding | `src/modules/system_context/repositories/system-context.repository.ts:536` |
| `system_context.dynamic_enum_bindings` | LEE | LEE | DIRECTA | SystemContextController.createEnumBinding → DynamicEnumsService.createBinding → SystemContextRepository.findEnumBindingByTarget | `src/modules/system_context/repositories/system-context.repository.ts:582` |
| `system_context.dynamic_enum_definitions` | LEE | LEE | DIRECTA | SystemContextController.createEnumBinding → DynamicEnumsService.createBinding → SystemContextRepository.findEnumDefinitionById | `src/modules/system_context/repositories/system-context.repository.ts:215` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `defId` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateEnumBindingDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `targetSchemaName` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Esquema del campo destino | `src/modules/system_context/dto/system-context.dto.ts:356` |
| `targetEntityName` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Entidad del campo destino | `src/modules/system_context/dto/system-context.dto.ts:364` |
| `targetFieldName` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Campo gobernado por el enum | `src/modules/system_context/dto/system-context.dto.ts:372` |
| `systemContextId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Contexto que acota la resolución | `src/modules/system_context/dto/system-context.dto.ts:383` |
| `required` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | El campo no admite quedarse vacío | `src/modules/system_context/dto/system-context.dto.ts:394` |
| `fallbackConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concepto al que se cae en modo LENIENT; obligatorio en ese modo | `src/modules/system_context/dto/system-context.dto.ts:406` |
| `validationMode` | `string` | Sí | valores: STRICT, LENIENT | `@IsIn(VALIDATION_MODES)` | — | `src/modules/system_context/dto/system-context.dto.ts:413` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "targetSchemaName": "Nombre de ejemplo",
  "targetEntityName": "Nombre de ejemplo",
  "targetFieldName": "Nombre de ejemplo",
  "validationMode": "STRICT"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "targetSchemaName": "Nombre de ejemplo",
  "targetEntityName": "Nombre de ejemplo",
  "targetFieldName": "Nombre de ejemplo",
  "systemContextId": "00000000-0000-4000-8000-000000000001",
  "required": false,
  "fallbackConceptId": "00000000-0000-4000-8000-000000000001",
  "validationMode": "STRICT"
}
```

</details>

### Respuesta — `Promise<EnumBindingResponseDto>` · DTO `EnumBindingResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/system_context/dto/system-context.dto.ts:424` |
| `dynamicEnumDefinitionId` | `string` | Sí | formato uuid | — | Identificador asociado a dynamic enum definition. | `src/modules/system_context/dto/system-context.dto.ts:430` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/system_context/dto/system-context.dto.ts:436` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Enumeración no encontrada |
| 409 | `CONFLICT` | ConflictException: El campo ya está gobernado por otra enumeración |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El modo permisivo exige un concepto de reserva; PreconditionFailedException: La enumeración está retirada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/system_context.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/system_context/controllers/system-context.controller.spec.ts:94` |

### Flujos

- Módulo 45 — Contexto de Sistema y Enumeraciones Dinámicas — etapa `UC-45-04`

---

## 10. POST /system-context/dynamic-enums/definitions/{defId}/retire

- **Origen:** CONTRATO
- **Nombre:** Retirar la definición (borrado lógico gobernado)
- **Bloque:** Núcleo y Terminología
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SystemContextController.retireEnumDefinition` — `src/modules/system_context/controllers/system-context.controller.ts:267`

### Qué es y para qué sirve (negocio)

Retirar la definición (borrado lógico gobernado). Caso de uso UC-45-11: Retiro gobernado de la definición. Dentro del módulo (descripción del modelo, en inglés): «Provides versioned system context for agents, modules and workflows, and database-driven enumerations resolved from governed terminology value sets.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/system_context/README.md:55`) · MODELO (`Mantra Core Health Context/modules/diagram_45_system_context.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /system-context/dynamic-enums/definitions/{defId}/retire` la atiende `SystemContextController.retireEnumDefinition` (src/modules/system_context/controllers/system-context.controller.ts:267). Exige sesión con alguno de los roles PLATFORM_ADMIN. Valida el cuerpo como `RetireEnumDefinitionDto` (1 campo, 1 obligatorio). Delega en `DynamicEnumsService.retireDefinition`. Actualiza system_context.dynamic_enum_bindings, system_context.dynamic_enum_definitions. Lee system_context.dynamic_enum_bindings, system_context.dynamic_enum_definitions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PLATFORM_ADMIN | `src/modules/system_context/controllers/system-context.controller.ts:267` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: defId | `src/modules/system_context/controllers/system-context.controller.ts:267` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `system_context.dynamic_enum_bindings` | ESCRIBE | ACTUALIZA | POR_TIPO | SystemContextController.retireEnumDefinition → DynamicEnumsService.retireDefinition | `src/modules/system_context/services/dynamic-enums.service.ts:728` |
| `system_context.dynamic_enum_bindings` | LEE | LEE | DIRECTA | SystemContextController.retireEnumDefinition → DynamicEnumsService.retireDefinition → SystemContextRepository.findEnumBindingsForUpdate | `src/modules/system_context/repositories/system-context.repository.ts:652` |
| `system_context.dynamic_enum_definitions` | ESCRIBE | ACTUALIZA | POR_TIPO | SystemContextController.retireEnumDefinition → DynamicEnumsService.retireDefinition | `src/modules/system_context/services/dynamic-enums.service.ts:732` |
| `system_context.dynamic_enum_definitions` | LEE | LEE | DIRECTA | SystemContextController.retireEnumDefinition → DynamicEnumsService.retireDefinition → SystemContextRepository.findEnumDefinitionForUpdate | `src/modules/system_context/repositories/system-context.repository.ts:226` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `defId` | path | Sí | `string` | — |

### Cuerpo — DTO `RetireEnumDefinitionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reason` | `string` | Sí | — | `@IsString()` | Por qué se retira | `src/modules/system_context/dto/system-context.dto.ts:558` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "reason": "Texto descriptivo de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "reason": "Texto descriptivo de ejemplo"
}
```

</details>

### Respuesta — `Promise<RetireEnumDefinitionResponseDto>` · DTO `RetireEnumDefinitionResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/system_context/dto/system-context.dto.ts:569` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/system_context/dto/system-context.dto.ts:575` |
| `disabledBindings` | `number` | Sí | — | — | Bindings que quedan deshabilitados | `src/modules/system_context/dto/system-context.dto.ts:581` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Enumeración no encontrada |
| 409 | `CONFLICT` | ConflictException: La enumeración ya está retirada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Hay un campo obligatorio vinculado; migra su enumeración antes de retirarla |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/system_context.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/system_context/controllers/system-context.controller.spec.ts:114` |

### Flujos

- Módulo 45 — Contexto de Sistema y Enumeraciones Dinámicas — etapa `UC-45-11`

---

## 11. POST /system-context/dynamic-enums/definitions/{defId}/versions

- **Origen:** CONTRATO
- **Nombre:** Redactar una versión con su snapshot de opciones
- **Bloque:** Núcleo y Terminología
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SystemContextController.draftEnumVersion` — `src/modules/system_context/controllers/system-context.controller.ts:181`

### Qué es y para qué sirve (negocio)

Redactar una versión con su snapshot de opciones. Caso de uso UC-45-02: Redactar versión + snapshot de opciones. Dentro del módulo (descripción del modelo, en inglés): «Provides versioned system context for agents, modules and workflows, and database-driven enumerations resolved from governed terminology value sets.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/system_context/README.md:46`) · MODELO (`Mantra Core Health Context/modules/diagram_45_system_context.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /system-context/dynamic-enums/definitions/{defId}/versions` la atiende `SystemContextController.draftEnumVersion` (src/modules/system_context/controllers/system-context.controller.ts:181). Exige sesión con alguno de los roles TERMINOLOGY_ENGINEER, PLATFORM_ADMIN. Valida el cuerpo como `DraftEnumVersionDto` (10 campos, 6 obligatorios). Delega en `DynamicEnumsService.draftVersion`. Crea filas en system_context.dynamic_enum_options, system_context.dynamic_enum_versions. Lee system_context.dynamic_enum_definitions, system_context.dynamic_enum_versions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: TERMINOLOGY_ENGINEER, PLATFORM_ADMIN | `src/modules/system_context/controllers/system-context.controller.ts:181` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: defId | `src/modules/system_context/controllers/system-context.controller.ts:181` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `system_context.dynamic_enum_definitions` | LEE | LEE | DIRECTA | SystemContextController.draftEnumVersion → DynamicEnumsService.draftVersion → SystemContextRepository.findEnumDefinitionForUpdate | `src/modules/system_context/repositories/system-context.repository.ts:226` |
| `system_context.dynamic_enum_options` | ESCRIBE | CREA | DIRECTA | SystemContextController.draftEnumVersion → DynamicEnumsService.draftVersion → SystemContextRepository.createEnumOption | `src/modules/system_context/repositories/system-context.repository.ts:407` |
| `system_context.dynamic_enum_versions` | ESCRIBE | CREA | DIRECTA | SystemContextController.draftEnumVersion → DynamicEnumsService.draftVersion → SystemContextRepository.createEnumVersion | `src/modules/system_context/repositories/system-context.repository.ts:285` |
| `system_context.dynamic_enum_versions` | LEE | LEE | DIRECTA | SystemContextController.draftEnumVersion → DynamicEnumsService.draftVersion → SystemContextRepository.findLatestEnumVersion | `src/modules/system_context/repositories/system-context.repository.ts:353` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `defId` | path | Sí | `string` | — |

### Cuerpo — DTO `DraftEnumVersionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `valueSetVersionId` | `string` | Sí | formato uuid | `@IsUUID()` | Versión del value set que se congela | `src/modules/system_context/dto/system-context.dto.ts:245` |
| `schemaVersion` | `string` | Sí | longitud máxima 50 | `@IsString()` `@MaxLength(50)` | — | `src/modules/system_context/dto/system-context.dto.ts:255` |
| `options` | `array<EnumOptionDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => EnumOptionDto)` | Snapshot ordenado de las opciones | `src/modules/system_context/dto/system-context.dto.ts:268` |
| `options[].conceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Concepto de terminología | `src/modules/system_context/dto/system-context.dto.ts:172` |
| `options[].code` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/system_context/dto/system-context.dto.ts:180` |
| `options[].display` | `string` | Sí | longitud máxima 300 | `@IsString()` `@MaxLength(300)` | — | `src/modules/system_context/dto/system-context.dto.ts:188` |
| `options[].ordinal` | `number` | No | mínimo 0 | `@IsOptional()` `@IsInt()` `@Min(0)` | Orden de presentación; por defecto, el del array | `src/modules/system_context/dto/system-context.dto.ts:199` |
| `options[].isDefault` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Sólo una opción puede serlo | `src/modules/system_context/dto/system-context.dto.ts:210` |
| `options[].enabled` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | — | `src/modules/system_context/dto/system-context.dto.ts:218` |
| `options[].metadataJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | — | `src/modules/system_context/dto/system-context.dto.ts:226` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "valueSetVersionId": "00000000-0000-4000-8000-000000000001",
  "schemaVersion": "valor-ejemplo",
  "options": [
    {
      "conceptId": "00000000-0000-4000-8000-000000000001",
      "code": "CODIGO_EJEMPLO",
      "display": "valor-ejemplo"
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "valueSetVersionId": "00000000-0000-4000-8000-000000000001",
  "schemaVersion": "valor-ejemplo",
  "options": [
    {
      "conceptId": "00000000-0000-4000-8000-000000000001",
      "code": "CODIGO_EJEMPLO",
      "display": "valor-ejemplo",
      "ordinal": 1,
      "isDefault": false,
      "enabled": true,
      "metadataJson": {}
    }
  ]
}
```

</details>

### Respuesta — `Promise<EnumVersionResponseDto>` · DTO `EnumVersionResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/system_context/dto/system-context.dto.ts:279` |
| `versionNumber` | `number` | Sí | — | — | Valor de version number mantenido por la instancia. | `src/modules/system_context/dto/system-context.dto.ts:285` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/system_context/dto/system-context.dto.ts:291` |
| `optionIds` | `array<string>` | Sí | formato uuid | — | Valor de option ids mantenido por la instancia. | `src/modules/system_context/dto/system-context.dto.ts:297` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Enumeración no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Sólo una opción puede ser la de por defecto; PreconditionFailedException: La opción por defecto no puede estar deshabilitada; PreconditionFailedException: El código de opción está repetido; PreconditionFailedException: El concepto está repetido en las opciones; PreconditionFailedException: La enumeración está retirada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/system_context.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/system_context/controllers/system-context.controller.spec.ts:75` |

### Flujos

- Módulo 45 — Contexto de Sistema y Enumeraciones Dinámicas — etapa `UC-45-02`

---

## 12. POST /system-context/dynamic-enums/definitions/{defId}/versions/{version}/publish

- **Origen:** CONTRATO
- **Nombre:** Publicar la versión e invalidar la caché
- **Bloque:** Núcleo y Terminología
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SystemContextController.publishEnumVersion` — `src/modules/system_context/controllers/system-context.controller.ts:203`

### Qué es y para qué sirve (negocio)

Publicar la versión e invalidar la caché. Caso de uso UC-45-03: Publicar e invalidar caché. Dentro del módulo (descripción del modelo, en inglés): «Provides versioned system context for agents, modules and workflows, and database-driven enumerations resolved from governed terminology value sets.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/system_context/README.md:47`) · MODELO (`Mantra Core Health Context/modules/diagram_45_system_context.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /system-context/dynamic-enums/definitions/{defId}/versions/{version}/publish` la atiende `SystemContextController.publishEnumVersion` (src/modules/system_context/controllers/system-context.controller.ts:203). Exige sesión con alguno de los roles TERMINOLOGY_ENGINEER, PLATFORM_ADMIN. Delega en `DynamicEnumsService.publishVersion`. Actualiza system_context.dynamic_enum_definitions, system_context.dynamic_enum_versions. Lee system_context.dynamic_enum_definitions, system_context.dynamic_enum_options, system_context.dynamic_enum_versions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: TERMINOLOGY_ENGINEER, PLATFORM_ADMIN | `src/modules/system_context/controllers/system-context.controller.ts:203` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: defId | `src/modules/system_context/controllers/system-context.controller.ts:203` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `system_context.dynamic_enum_definitions` | ESCRIBE | ACTUALIZA | POR_TIPO | SystemContextController.publishEnumVersion → DynamicEnumsService.publishVersion | `src/modules/system_context/services/dynamic-enums.service.ts:469` |
| `system_context.dynamic_enum_definitions` | LEE | LEE | DIRECTA | SystemContextController.publishEnumVersion → DynamicEnumsService.publishVersion → SystemContextRepository.findEnumDefinitionForUpdate | `src/modules/system_context/repositories/system-context.repository.ts:226` |
| `system_context.dynamic_enum_options` | LEE | LEE | DIRECTA | SystemContextController.publishEnumVersion → DynamicEnumsService.publishVersion → SystemContextRepository.countEnabledOptions | `src/modules/system_context/repositories/system-context.repository.ts:476` |
| `system_context.dynamic_enum_versions` | ESCRIBE | ACTUALIZA | POR_TIPO | SystemContextController.publishEnumVersion → DynamicEnumsService.publishVersion | `src/modules/system_context/services/dynamic-enums.service.ts:459` |
| `system_context.dynamic_enum_versions` | LEE | LEE | DIRECTA | SystemContextController.publishEnumVersion → DynamicEnumsService.publishVersion → SystemContextRepository.findEnumVersionForUpdate | `src/modules/system_context/repositories/system-context.repository.ts:335` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `defId` | path | Sí | `string` | — |
| `version` | path | Sí | `number` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PublishEnumVersionResponseDto>` · DTO `PublishEnumVersionResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/system_context/dto/system-context.dto.ts:312` |
| `versionNumber` | `number` | Sí | — | — | Valor de version number mantenido por la instancia. | `src/modules/system_context/dto/system-context.dto.ts:318` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/system_context/dto/system-context.dto.ts:324` |
| `cacheToken` | `string` | Sí | — | — | Token nuevo; invalida la caché de la definición | `src/modules/system_context/dto/system-context.dto.ts:332` |
| `supersededVersionId` | `string` | No | formato uuid | — | Versión que queda superseded | `src/modules/system_context/dto/system-context.dto.ts:341` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Enumeración no encontrada; ResourceNotFoundException: Versión de la enumeración no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La enumeración está retirada; PreconditionFailedException: La versión no está en borrador; PreconditionFailedException: La versión no tiene ninguna opción habilitada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/system_context.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/system_context/controllers/system-context.controller.spec.ts:84` |

### Flujos

- Módulo 45 — Contexto de Sistema y Enumeraciones Dinámicas — etapa `UC-45-03`

---

## 13. POST /system-context/dynamic-enums/resolve

- **Origen:** CONTRATO
- **Nombre:** Resolver y validar un valor de enumeración antes de escribirlo
- **Bloque:** Núcleo y Terminología
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SystemContextController.resolveEnumValue` — `src/modules/system_context/controllers/system-context.controller.ts:247`

### Qué es y para qué sirve (negocio)

Resolver y validar un valor de enumeración antes de escribirlo. Caso de uso UC-45-05: Resolver y validar un valor en escritura. Dentro del módulo (descripción del modelo, en inglés): «Provides versioned system context for agents, modules and workflows, and database-driven enumerations resolved from governed terminology value sets.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/system_context/README.md:49`) · MODELO (`Mantra Core Health Context/modules/diagram_45_system_context.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /system-context/dynamic-enums/resolve` la atiende `SystemContextController.resolveEnumValue` (src/modules/system_context/controllers/system-context.controller.ts:247). Exige sesión con alguno de los roles WRITE_SERVICE, MODULE_OWNER, PLATFORM_ADMIN. Valida el cuerpo como `ResolveEnumValueDto` (5 campos, 3 obligatorios). Delega en `DynamicEnumsService.resolveValue`. Lee system_context.dynamic_enum_bindings, system_context.dynamic_enum_options, system_context.dynamic_enum_versions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: WRITE_SERVICE, MODULE_OWNER, PLATFORM_ADMIN | `src/modules/system_context/controllers/system-context.controller.ts:247` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `system_context.dynamic_enum_bindings` | LEE | LEE | DIRECTA | SystemContextController.resolveEnumValue → DynamicEnumsService.resolveValue → SystemContextRepository.findEnumBindingByTarget | `src/modules/system_context/repositories/system-context.repository.ts:582` |
| `system_context.dynamic_enum_options` | LEE | LEE | DIRECTA | SystemContextController.resolveEnumValue → DynamicEnumsService.resolveValue → SystemContextRepository.findEnumOptions | `src/modules/system_context/repositories/system-context.repository.ts:436` |
| `system_context.dynamic_enum_versions` | LEE | LEE | DIRECTA | SystemContextController.resolveEnumValue → DynamicEnumsService.resolveValue → SystemContextRepository.findPublishedEnumVersion | `src/modules/system_context/repositories/system-context.repository.ts:393` |

### Cuerpo — DTO `ResolveEnumValueDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `targetSchemaName` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/system_context/dto/system-context.dto.ts:451` |
| `targetEntityName` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/system_context/dto/system-context.dto.ts:459` |
| `targetFieldName` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/system_context/dto/system-context.dto.ts:467` |
| `conceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Valor propuesto, por concepto | `src/modules/system_context/dto/system-context.dto.ts:478` |
| `code` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Valor propuesto, por código de la opción | `src/modules/system_context/dto/system-context.dto.ts:490` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "targetSchemaName": "Nombre de ejemplo",
  "targetEntityName": "Nombre de ejemplo",
  "targetFieldName": "Nombre de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "targetSchemaName": "Nombre de ejemplo",
  "targetEntityName": "Nombre de ejemplo",
  "targetFieldName": "Nombre de ejemplo",
  "conceptId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO"
}
```

</details>

### Respuesta — `Promise<ResolveEnumValueResponseDto>` · DTO `ResolveEnumValueResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `accepted` | `boolean` | Sí | — | — | true si el valor puede escribirse | `src/modules/system_context/dto/system-context.dto.ts:501` |
| `resolvedConceptId` | `string` | No | formato uuid | — | Concepto resuelto que debe persistirse | `src/modules/system_context/dto/system-context.dto.ts:510` |
| `resolvedCode` | `string` | No | — | — | Código de la opción resuelta | `src/modules/system_context/dto/system-context.dto.ts:516` |
| `usedFallback` | `boolean` | Sí | — | — | true si se cayó al concepto de reserva del binding | `src/modules/system_context/dto/system-context.dto.ts:524` |
| `validationModeConceptId` | `string` | Sí | formato uuid | — | Modo con el que se evaluó | `src/modules/system_context/dto/system-context.dto.ts:530` |
| `cacheToken` | `string` | Sí | — | — | Token de la versión resuelta; identifica la caché | `src/modules/system_context/dto/system-context.dto.ts:538` |
| `rejectionReason` | `string` | No | — | — | Por qué se rechazó | `src/modules/system_context/dto/system-context.dto.ts:544` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: El campo no tiene enumeración vinculada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La enumeración no tiene versión publicada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/system_context.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/system_context/controllers/system-context.controller.spec.ts:104` |

### Flujos

- Módulo 45 — Contexto de Sistema y Enumeraciones Dinámicas — etapa `UC-45-05`

---

