<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `system_context`

- **Bloque:** Núcleo y Terminología (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)
- **Operaciones:** 13 (13 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 0 · MEDIO 10 · BAJO 3
- **Tablas distintas que tocan:** 9
- **Respuestas de error y detalle contractual:** `openapi/endpoints/system-context.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | POST | `/system-context/contexts` | Definir un contexto de sistema con su versión inicial | MEDIO | 4 | PLATFORM_ADMIN, GOVERNANCE |
| 2 | POST | `/system-context/contexts/{id}/bindings` | Vincular el contexto a un consumidor | MEDIO | 3 | MODULE_OWNER, PLATFORM_ADMIN |
| 3 | POST | `/system-context/contexts/{id}/refresh` | Refrescar el contexto y snapshotear su procedencia | MEDIO | 7 | SYSTEM, PLATFORM_ADMIN |
| 4 | POST | `/system-context/contexts/{id}/rollback` | Volver a una versión anterior del contexto | MEDIO | 4 | PLATFORM_ADMIN |
| 5 | POST | `/system-context/contexts/{id}/versions/{version}/activate` | Promover la versión a vigente | MEDIO | 4 | PLATFORM_ADMIN |
| 6 | GET | `/system-context/dynamic-enums` | Leer las opciones publicadas de una enumeración | BAJO | 4 | sesión (sin roles) |
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
- **Implementación:** `SystemContextController.createContext` — `src/modules/system_context/controllers/system-context.controller.ts:249`

### Qué es y para qué sirve (negocio)

Definir un contexto de sistema con su versión inicial. Caso de uso UC-45-06: Definir contexto + versión inicial. Dentro del módulo (descripción del modelo, en inglés): «Provides versioned system context for agents, modules and workflows, and database-driven enumerations resolved from governed terminology value sets.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/system_context/README.md:17`) · MODELO (`Mantra Core Health Context/modules/diagram_45_system_context.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /system-context/contexts` la atiende `SystemContextController.createContext` (src/modules/system_context/controllers/system-context.controller.ts:249). Exige sesión con alguno de los roles PLATFORM_ADMIN, GOVERNANCE. Valida el cuerpo como `CreateSystemContextDto` (11 campos, 5 obligatorios). Delega en `SystemContextsService.createContext`. Crea filas en system_context.system_context_versions, system_context.system_contexts. Actualiza system_context.system_contexts. Lee system_context.system_contexts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PLATFORM_ADMIN, GOVERNANCE | `src/modules/system_context/controllers/system-context.controller.ts:249` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `system_context.system_context_versions` | ESCRIBE | CREA | DIRECTA | SystemContextController.createContext → SystemContextsService.createContext → SystemContextRepository.createContextVersion | `src/modules/system_context/repositories/system-context.repository.ts:746` |
| `system_context.system_contexts` | ESCRIBE | ACTUALIZA | POR_TIPO | SystemContextController.createContext → SystemContextsService.createContext | `src/modules/system_context/services/system-contexts.service.ts:106` |
| `system_context.system_contexts` | ESCRIBE | CREA | DIRECTA | SystemContextController.createContext → SystemContextsService.createContext → SystemContextRepository.createContext | `src/modules/system_context/repositories/system-context.repository.ts:674` |
| `system_context.system_contexts` | LEE | LEE | DIRECTA | SystemContextController.createContext → SystemContextsService.createContext → SystemContextRepository.findContextByCode | `src/modules/system_context/repositories/system-context.repository.ts:730` |

### Cuerpo — DTO `CreateSystemContextDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `code` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Código único del contexto | `src/modules/system_context/dto/system-context.dto.ts:595` |
| `name` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | — | `src/modules/system_context/dto/system-context.dto.ts:603` |
| `description` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/system_context/dto/system-context.dto.ts:611` |
| `contextTypeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Tipo de contexto (catálogo abierto) | `src/modules/system_context/dto/system-context.dto.ts:621` |
| `scopeTypeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Ámbito del contexto (catálogo abierto) | `src/modules/system_context/dto/system-context.dto.ts:631` |
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/system_context/dto/system-context.dto.ts:639` |
| `countryConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/system_context/dto/system-context.dto.ts:647` |
| `localeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/system_context/dto/system-context.dto.ts:655` |
| `refreshPolicyConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Política de refresco (catálogo abierto) | `src/modules/system_context/dto/system-context.dto.ts:666` |
| `schemaVersion` | `string` | No | longitud máxima 50 | `@IsOptional()` `@IsString()` `@MaxLength(50)` | — | `src/modules/system_context/dto/system-context.dto.ts:675` |
| `contextJson` | `object` | Sí | — | `@IsObject()` | Contenido del contexto. Nunca secretos: sólo referencias gobernadas. | `src/modules/system_context/dto/system-context.dto.ts:685` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/system_context/dto/system-context.dto.ts:696` |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/system_context/dto/system-context.dto.ts:702` |
| `currentVersionId` | `string` | Sí | formato uuid | — | Versión 1, creada en la misma transacción | `src/modules/system_context/dto/system-context.dto.ts:711` |
| `contentHash` | `string` | Sí | — | — | Hash del contenido de la versión inicial | `src/modules/system_context/dto/system-context.dto.ts:717` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/system_context/dto/system-context.dto.ts:723` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe un contexto con ese código |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/system_context.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/system_context/controllers/system-context.controller.spec.ts:117` |

### Flujos

- Módulo 45 — Contexto de Sistema y Enumeraciones Dinámicas — etapa `UC-45-06`

---

## 2. POST /system-context/contexts/{id}/bindings

- **Origen:** CONTRATO
- **Nombre:** Vincular el contexto a un consumidor
- **Bloque:** Núcleo y Terminología
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SystemContextController.createContextBinding` — `src/modules/system_context/controllers/system-context.controller.ts:299`

### Qué es y para qué sirve (negocio)

Vincular el contexto a un consumidor. Caso de uso UC-45-10: Vincular contexto a un consumidor. Dentro del módulo (descripción del modelo, en inglés): «Provides versioned system context for agents, modules and workflows, and database-driven enumerations resolved from governed terminology value sets.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/system_context/README.md:21`) · MODELO (`Mantra Core Health Context/modules/diagram_45_system_context.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /system-context/contexts/{id}/bindings` la atiende `SystemContextController.createContextBinding` (src/modules/system_context/controllers/system-context.controller.ts:299). Exige sesión con alguno de los roles MODULE_OWNER, PLATFORM_ADMIN. Valida el cuerpo como `CreateContextBindingDto` (8 campos, 2 obligatorios). Delega en `SystemContextsService.createBinding`. Crea filas en system_context.system_context_bindings. Lee system_context.system_context_bindings, system_context.system_contexts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: MODULE_OWNER, PLATFORM_ADMIN | `src/modules/system_context/controllers/system-context.controller.ts:299` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/system_context/controllers/system-context.controller.ts:299` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `system_context.system_context_bindings` | ESCRIBE | CREA | DIRECTA | SystemContextController.createContextBinding → SystemContextsService.createBinding → SystemContextRepository.createContextBinding | `src/modules/system_context/repositories/system-context.repository.ts:1040` |
| `system_context.system_context_bindings` | LEE | LEE | DIRECTA | SystemContextController.createContextBinding → SystemContextsService.createBinding → SystemContextRepository.findContextBindingsForConsumer | `src/modules/system_context/repositories/system-context.repository.ts:1067` |
| `system_context.system_contexts` | LEE | LEE | DIRECTA | SystemContextController.createContextBinding → SystemContextsService.createBinding → SystemContextRepository.findContextById | `src/modules/system_context/repositories/system-context.repository.ts:704` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateContextBindingDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `consumerTypeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Naturaleza del consumidor (catálogo abierto) | `src/modules/system_context/dto/system-context.dto.ts:1016` |
| `consumerId` | `string` | Sí | formato uuid | `@IsUUID()` | Consumidor concreto | `src/modules/system_context/dto/system-context.dto.ts:1023` |
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/system_context/dto/system-context.dto.ts:1031` |
| `countryConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/system_context/dto/system-context.dto.ts:1039` |
| `activationRuleJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Condición de activación del binding | `src/modules/system_context/dto/system-context.dto.ts:1047` |
| `priority` | `number` | No | mínimo 1 | `@IsOptional()` `@IsInt()` `@Min(1)` | Desempata varios bindings; menor gana | `src/modules/system_context/dto/system-context.dto.ts:1059` |
| `validFrom` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | — | `src/modules/system_context/dto/system-context.dto.ts:1067` |
| `validTo` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | — | `src/modules/system_context/dto/system-context.dto.ts:1075` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/system_context/dto/system-context.dto.ts:1086` |
| `systemContextId` | `string` | Sí | formato uuid | — | Identificador asociado a system context. | `src/modules/system_context/dto/system-context.dto.ts:1092` |
| `priority` | `number` | Sí | — | — | Valor de priority mantenido por la instancia. | `src/modules/system_context/dto/system-context.dto.ts:1098` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/system_context/dto/system-context.dto.ts:1104` |

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
| CONTROLADOR | `src/modules/system_context/controllers/system-context.controller.spec.ts:156` |

### Flujos

- Módulo 45 — Contexto de Sistema y Enumeraciones Dinámicas — etapa `UC-45-10`

---

## 3. POST /system-context/contexts/{id}/refresh

- **Origen:** CONTRATO
- **Nombre:** Refrescar el contexto y snapshotear su procedencia
- **Bloque:** Núcleo y Terminología
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SystemContextController.refreshContext` — `src/modules/system_context/controllers/system-context.controller.ts:265`

### Qué es y para qué sirve (negocio)

Refrescar el contexto y snapshotear su procedencia. Caso de uso UC-45-07: Refresco idempotente con nueva versión. Dentro del módulo (descripción del modelo, en inglés): «Provides versioned system context for agents, modules and workflows, and database-driven enumerations resolved from governed terminology value sets.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/system_context/README.md:18`) · MODELO (`Mantra Core Health Context/modules/diagram_45_system_context.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /system-context/contexts/{id}/refresh` la atiende `SystemContextController.refreshContext` (src/modules/system_context/controllers/system-context.controller.ts:265). Exige sesión con alguno de los roles SYSTEM, PLATFORM_ADMIN. Valida el cuerpo como `RefreshSystemContextDto` (16 campos, 3 obligatorios). Delega en `SystemContextsService.refreshContext`. Crea filas en system_context.system_context_inputs, system_context.system_context_refresh_runs, system_context.system_context_versions. Actualiza system_context.system_context_refresh_runs. Lee system_context.system_context_refresh_runs, system_context.system_context_versions, system_context.system_contexts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, PLATFORM_ADMIN | `src/modules/system_context/controllers/system-context.controller.ts:265` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/system_context/controllers/system-context.controller.ts:265` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `system_context.system_context_inputs` | ESCRIBE | CREA | DIRECTA | SystemContextController.refreshContext → SystemContextsService.refreshContext → SystemContextRepository.createContextInput | `src/modules/system_context/repositories/system-context.repository.ts:887` |
| `system_context.system_context_refresh_runs` | ESCRIBE | ACTUALIZA | POR_TIPO | SystemContextController.refreshContext → SystemContextsService.refreshContext | `src/modules/system_context/services/system-contexts.service.ts:188` |
| `system_context.system_context_refresh_runs` | ESCRIBE | CREA | DIRECTA | SystemContextController.refreshContext → SystemContextsService.refreshContext → SystemContextRepository.createRefreshRun | `src/modules/system_context/repositories/system-context.repository.ts:959` |
| `system_context.system_context_refresh_runs` | LEE | LEE | DIRECTA | SystemContextController.refreshContext → SystemContextsService.refreshContext → SystemContextRepository.findRefreshRunByKey | `src/modules/system_context/repositories/system-context.repository.ts:979` |
| `system_context.system_context_versions` | ESCRIBE | CREA | DIRECTA | SystemContextController.refreshContext → SystemContextsService.refreshContext → SystemContextRepository.createContextVersion | `src/modules/system_context/repositories/system-context.repository.ts:746` |
| `system_context.system_context_versions` | LEE | LEE | DIRECTA | SystemContextController.refreshContext → SystemContextsService.refreshContext → SystemContextRepository.findLatestContextVersion | `src/modules/system_context/repositories/system-context.repository.ts:811` |
| `system_context.system_contexts` | LEE | LEE | DIRECTA | SystemContextController.refreshContext → SystemContextsService.refreshContext → SystemContextRepository.findContextForUpdate | `src/modules/system_context/repositories/system-context.repository.ts:712` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `RefreshSystemContextDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `idempotencyKey` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Clave de idempotencia de la corrida | `src/modules/system_context/dto/system-context.dto.ts:843` |
| `trigger` | `string` | Sí | valores: SCHEDULED, MANUAL, EVENT | `@IsIn(REFRESH_TRIGGERS)` | — | `src/modules/system_context/dto/system-context.dto.ts:850` |
| `contextJson` | `object` | Sí | — | `@IsObject()` | Contenido regenerado del contexto | `src/modules/system_context/dto/system-context.dto.ts:857` |
| `schemaVersion` | `string` | No | longitud máxima 50 | `@IsOptional()` `@IsString()` `@MaxLength(50)` | — | `src/modules/system_context/dto/system-context.dto.ts:866` |
| `generatedByAgentId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Agente que generó el contenido | `src/modules/system_context/dto/system-context.dto.ts:877` |
| `inputs` | `array<ContextInputDto>` | No | — | `@IsOptional()` `@IsArray()` `@ValidateNested({ each: true })` `@Type(() => ContextInputDto)` | Procedencia de lo recogido | `src/modules/system_context/dto/system-context.dto.ts:890` |
| `inputs[].sourceTypeConceptId` | `string` | No | formato uuid | `@IsUUID()` | Naturaleza de la fuente (catálogo abierto) | `src/modules/system_context/dto/system-context.dto.ts:742` |
| `inputs[].sourceSchemaName` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/system_context/dto/system-context.dto.ts:751` |
| `inputs[].sourceEntityName` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/system_context/dto/system-context.dto.ts:760` |
| `inputs[].sourceRecordId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/system_context/dto/system-context.dto.ts:768` |
| `inputs[].sourceVersionId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/system_context/dto/system-context.dto.ts:776` |
| `inputs[].sourceContentHash` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Hash del contenido de la fuente en el momento del snapshot | `src/modules/system_context/dto/system-context.dto.ts:787` |
| `inputs[].sourceFreshnessAt` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | Frescura del dato de origen | `src/modules/system_context/dto/system-context.dto.ts:798` |
| `inputs[].precedence` | `number` | No | mínimo 1 | `@IsOptional()` `@IsInt()` `@Min(1)` | Precedencia; menor gana ante colisión | `src/modules/system_context/dto/system-context.dto.ts:810` |
| `inputs[].required` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Si falta, la corrida falla | `src/modules/system_context/dto/system-context.dto.ts:821` |
| `inputs[].missing` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | true si la entrada no pudo recogerse | `src/modules/system_context/dto/system-context.dto.ts:829` |

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
| `runId` | `string` | Sí | formato uuid | — | Identificador asociado a run. | `src/modules/system_context/dto/system-context.dto.ts:901` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/system_context/dto/system-context.dto.ts:907` |
| `versionId` | `string` | No | formato uuid | — | Versión redactada, si hubo cambio | `src/modules/system_context/dto/system-context.dto.ts:916` |
| `versionNumber` | `number` | No | — | — | Número de la versión redactada | `src/modules/system_context/dto/system-context.dto.ts:922` |
| `contentHash` | `string` | Sí | — | — | Hash del contenido regenerado | `src/modules/system_context/dto/system-context.dto.ts:928` |
| `unchanged` | `boolean` | Sí | — | — | true si el contenido no cambió y no se redactó versión | `src/modules/system_context/dto/system-context.dto.ts:936` |
| `inputCount` | `number` | Sí | — | — | Entradas de procedencia registradas | `src/modules/system_context/dto/system-context.dto.ts:942` |
| `duplicate` | `boolean` | Sí | — | — | true si la corrida ya existía con esa clave | `src/modules/system_context/dto/system-context.dto.ts:948` |

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

El árbol de decisión completo está en [flujos](../flujos/system_context.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/system_context/controllers/system-context.controller.spec.ts:127` |

### Flujos

- Módulo 45 — Contexto de Sistema y Enumeraciones Dinámicas — etapa `UC-45-07`

---

## 4. POST /system-context/contexts/{id}/rollback

- **Origen:** CONTRATO
- **Nombre:** Volver a una versión anterior del contexto
- **Bloque:** Núcleo y Terminología
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SystemContextController.rollbackContext` — `src/modules/system_context/controllers/system-context.controller.ts:316`

### Qué es y para qué sirve (negocio)

Volver a una versión anterior del contexto. Caso de uso UC-45-12: Volver a una versión anterior. Dentro del módulo (descripción del modelo, en inglés): «Provides versioned system context for agents, modules and workflows, and database-driven enumerations resolved from governed terminology value sets.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/system_context/README.md:23`) · MODELO (`Mantra Core Health Context/modules/diagram_45_system_context.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /system-context/contexts/{id}/rollback` la atiende `SystemContextController.rollbackContext` (src/modules/system_context/controllers/system-context.controller.ts:316). Exige sesión con alguno de los roles PLATFORM_ADMIN. Valida el cuerpo como `RollbackContextDto` (3 campos, 2 obligatorios). Delega en `SystemContextsService.rollbackContext`. Actualiza system_context.system_context_versions, system_context.system_contexts. Lee system_context.system_context_versions, system_context.system_contexts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PLATFORM_ADMIN | `src/modules/system_context/controllers/system-context.controller.ts:316` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/system_context/controllers/system-context.controller.ts:316` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `system_context.system_context_versions` | ESCRIBE | ACTUALIZA | POR_TIPO | SystemContextController.rollbackContext → SystemContextsService.rollbackContext | `src/modules/system_context/services/system-contexts.service.ts:558` |
| `system_context.system_context_versions` | LEE | LEE | DIRECTA | SystemContextController.rollbackContext → SystemContextsService.rollbackContext → SystemContextRepository.findContextVersionForUpdate | `src/modules/system_context/repositories/system-context.repository.ts:793` |
| `system_context.system_contexts` | ESCRIBE | ACTUALIZA | POR_TIPO | SystemContextController.rollbackContext → SystemContextsService.rollbackContext | `src/modules/system_context/services/system-contexts.service.ts:565` |
| `system_context.system_contexts` | LEE | LEE | DIRECTA | SystemContextController.rollbackContext → SystemContextsService.rollbackContext → SystemContextRepository.findContextForUpdate | `src/modules/system_context/repositories/system-context.repository.ts:712` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `RollbackContextDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `targetVersionNumber` | `number` | Sí | mínimo 1 | `@IsInt()` `@Min(1)` | Versión a reactivar | `src/modules/system_context/dto/system-context.dto.ts:1119` |
| `reason` | `string` | Sí | — | `@IsString()` | Por qué se vuelve atrás | `src/modules/system_context/dto/system-context.dto.ts:1126` |
| `expectedContentHash` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Hash esperado de la versión objetivo | `src/modules/system_context/dto/system-context.dto.ts:1135` |

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
| `id` | `string` | Sí | formato uuid | — | Versión reactivada | `src/modules/system_context/dto/system-context.dto.ts:1146` |
| `versionNumber` | `number` | Sí | — | — | Valor de version number mantenido por la instancia. | `src/modules/system_context/dto/system-context.dto.ts:1152` |
| `supersededVersionId` | `string` | Sí | formato uuid | — | Versión que queda superseded | `src/modules/system_context/dto/system-context.dto.ts:1158` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/system_context/dto/system-context.dto.ts:1164` |

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
| CONTROLADOR | `src/modules/system_context/controllers/system-context.controller.spec.ts:170` |

### Flujos

- Módulo 45 — Contexto de Sistema y Enumeraciones Dinámicas — etapa `UC-45-12`

---

## 5. POST /system-context/contexts/{id}/versions/{version}/activate

- **Origen:** CONTRATO
- **Nombre:** Promover la versión a vigente
- **Bloque:** Núcleo y Terminología
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SystemContextController.activateContextVersion` — `src/modules/system_context/controllers/system-context.controller.ts:282`

### Qué es y para qué sirve (negocio)

Promover la versión a vigente. Caso de uso UC-45-09: Promover versión vigente. Dentro del módulo (descripción del modelo, en inglés): «Provides versioned system context for agents, modules and workflows, and database-driven enumerations resolved from governed terminology value sets.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/system_context/README.md:20`) · MODELO (`Mantra Core Health Context/modules/diagram_45_system_context.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /system-context/contexts/{id}/versions/{version}/activate` la atiende `SystemContextController.activateContextVersion` (src/modules/system_context/controllers/system-context.controller.ts:282). Exige sesión con alguno de los roles PLATFORM_ADMIN. Valida el cuerpo como `ActivateContextVersionDto` (1 campo, 0 obligatorios). Delega en `SystemContextsService.activateVersion`. Actualiza system_context.system_context_versions, system_context.system_contexts. Lee system_context.system_context_versions, system_context.system_contexts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PLATFORM_ADMIN | `src/modules/system_context/controllers/system-context.controller.ts:282` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/system_context/controllers/system-context.controller.ts:282` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `system_context.system_context_versions` | ESCRIBE | ACTUALIZA | POR_TIPO | SystemContextController.activateContextVersion → SystemContextsService.activateVersion | `src/modules/system_context/services/system-contexts.service.ts:375` |
| `system_context.system_context_versions` | LEE | LEE | DIRECTA | SystemContextController.activateContextVersion → SystemContextsService.activateVersion → SystemContextRepository.findContextVersionForUpdate | `src/modules/system_context/repositories/system-context.repository.ts:793` |
| `system_context.system_contexts` | ESCRIBE | ACTUALIZA | POR_TIPO | SystemContextController.activateContextVersion → SystemContextsService.activateVersion | `src/modules/system_context/services/system-contexts.service.ts:383` |
| `system_context.system_contexts` | LEE | LEE | DIRECTA | SystemContextController.activateContextVersion → SystemContextsService.activateVersion → SystemContextRepository.findContextForUpdate | `src/modules/system_context/repositories/system-context.repository.ts:712` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |
| `version` | path | Sí | `number` | — |

### Cuerpo — DTO `ActivateContextVersionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `expectedContentHash` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Hash esperado; si no coincide con el de la versión, no se activa | `src/modules/system_context/dto/system-context.dto.ts:967` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/system_context/dto/system-context.dto.ts:978` |
| `versionNumber` | `number` | Sí | — | — | Valor de version number mantenido por la instancia. | `src/modules/system_context/dto/system-context.dto.ts:984` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/system_context/dto/system-context.dto.ts:990` |
| `supersededVersionId` | `string` | No | formato uuid | — | Versión que queda superseded | `src/modules/system_context/dto/system-context.dto.ts:999` |

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
| CONTROLADOR | `src/modules/system_context/controllers/system-context.controller.spec.ts:141` |

### Flujos

- Módulo 45 — Contexto de Sistema y Enumeraciones Dinámicas — etapa `UC-45-09`

---

## 6. GET /system-context/dynamic-enums

- **Origen:** CONTRATO
- **Nombre:** Leer las opciones publicadas de una enumeración
- **Bloque:** Núcleo y Terminología
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SystemContextController.readEnum` — `src/modules/system_context/controllers/system-context.controller.ts:123`

### Qué es y para qué sirve (negocio)

Leer las opciones publicadas de una enumeración. Dentro del módulo (descripción del modelo, en inglés): «Provides versioned system context for agents, modules and workflows, and database-driven enumerations resolved from governed terminology value sets.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_45_system_context.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`GET /system-context/dynamic-enums` la atiende `SystemContextController.readEnum` (src/modules/system_context/controllers/system-context.controller.ts:123). Exige sesión; el controlador no declara roles. Delega en `DynamicEnumsService.readEnum`. Lee system_context.dynamic_enum_bindings, system_context.dynamic_enum_definitions, system_context.dynamic_enum_options, system_context.dynamic_enum_versions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/system_context/controllers/system-context.controller.ts:123` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `system_context.dynamic_enum_bindings` | LEE | LEE | DIRECTA | SystemContextController.readEnum → DynamicEnumsService.readEnum → DynamicEnumsService.definitionForTarget → SystemContextRepository.findEnumBindingByTarget | `src/modules/system_context/repositories/system-context.repository.ts:539` |
| `system_context.dynamic_enum_definitions` | LEE | LEE | DIRECTA | SystemContextController.readEnum → DynamicEnumsService.readEnum → SystemContextRepository.findEnumDefinitionByCode | `src/modules/system_context/repositories/system-context.repository.ts:243` |
| `system_context.dynamic_enum_options` | LEE | LEE | DIRECTA | SystemContextController.readEnum → DynamicEnumsService.readEnum → SystemContextRepository.findEnumOptions | `src/modules/system_context/repositories/system-context.repository.ts:435` |
| `system_context.dynamic_enum_versions` | LEE | LEE | DIRECTA | SystemContextController.readEnum → DynamicEnumsService.readEnum → SystemContextRepository.findPublishedEnumVersion | `src/modules/system_context/repositories/system-context.repository.ts:392` |

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
| `code` | `string` | Sí | — | — | Código estable de la enumeración. | `src/modules/system_context/dto/system-context.dto.ts:1219` |
| `name` | `string` | Sí | — | — | Nombre legible de la enumeración. | `src/modules/system_context/dto/system-context.dto.ts:1225` |
| `description` | `string` | No | — | — | Qué gobierna la enumeración. | `src/modules/system_context/dto/system-context.dto.ts:1231` |
| `definitionId` | `string` | Sí | formato uuid | — | Identificador de la definición. | `src/modules/system_context/dto/system-context.dto.ts:1237` |
| `valueSetId` | `string` | Sí | formato uuid | — | Conjunto de valores de terminología del que sale la enumeración. | `src/modules/system_context/dto/system-context.dto.ts:1243` |
| `versionId` | `string` | Sí | formato uuid | — | Versión publicada de la que salen las opciones. | `src/modules/system_context/dto/system-context.dto.ts:1249` |
| `valueSetVersionId` | `string` | Sí | formato uuid | — | Versión del value set que la versión vigente congeló. Es lo que hay que volver a mandar para redactar la siguiente: la entidad la exige y ninguna otra lectura la exponía. | `src/modules/system_context/dto/system-context.dto.ts:1258` |
| `schemaVersion` | `string` | Sí | — | — | Versión de esquema que la versión vigente declara. Se repite al redactar. | `src/modules/system_context/dto/system-context.dto.ts:1262` |
| `cacheToken` | `string` | No | — | — | Testigo de caché de la versión publicada. | `src/modules/system_context/dto/system-context.dto.ts:1268` |
| `allowCustomValue` | `boolean` | Sí | — | — | Si el campo admite un valor fuera del conjunto. | `src/modules/system_context/dto/system-context.dto.ts:1274` |
| `options` | `array<DynamicEnumOptionItemDto>` | Sí | — | — | Opciones habilitadas, en el orden en que se ofrecen. | `src/modules/system_context/dto/system-context.dto.ts:1280` |
| `options[].conceptId` | `string` | Sí | formato uuid | — | Concepto que respalda la opción; es el valor que se envía al escribir. | `src/modules/system_context/dto/system-context.dto.ts:1181` |
| `options[].code` | `string` | Sí | — | — | Código estable del concepto. | `src/modules/system_context/dto/system-context.dto.ts:1187` |
| `options[].display` | `string` | Sí | — | — | Rótulo legible de la opción. | `src/modules/system_context/dto/system-context.dto.ts:1193` |
| `options[].ordinal` | `number` | No | — | — | Posición en la que se ofrece, empezando en cero. | `src/modules/system_context/dto/system-context.dto.ts:1199` |
| `options[].isDefault` | `boolean` | Sí | — | — | Si la opción viene preseleccionada. | `src/modules/system_context/dto/system-context.dto.ts:1205` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | BadRequestException: Indique el campo destino (`target`) o el código de la enumeración (`code`); BadRequestException: El campo destino se escribe como `esquema.tabla.columna` |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Enumeración no encontrada; ResourceNotFoundException: La enumeración está retirada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La enumeración no tiene versión publicada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/system_context.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/system_context/controllers/system-context.controller.spec.ts:185` |

### Flujos

- Módulo 45 — Contexto de Sistema y Enumeraciones Dinámicas — etapa `ctrl:SystemContextController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 7. GET /system-context/dynamic-enums/bindings

- **Origen:** CONTRATO
- **Nombre:** Listar los amarres campo -> enumeración
- **Bloque:** Núcleo y Terminología
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SystemContextController.listEnumBindings` — `src/modules/system_context/controllers/system-context.controller.ts:87`

### Qué es y para qué sirve (negocio)

Listar los amarres campo -> enumeración. Dentro del módulo (descripción del modelo, en inglés): «Provides versioned system context for agents, modules and workflows, and database-driven enumerations resolved from governed terminology value sets.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_45_system_context.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`GET /system-context/dynamic-enums/bindings` la atiende `SystemContextController.listEnumBindings` (src/modules/system_context/controllers/system-context.controller.ts:87). Exige sesión; el controlador no declara roles. Delega en `DynamicEnumsService.listBindings`. Lee system_context.dynamic_enum_bindings, system_context.dynamic_enum_definitions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/system_context/controllers/system-context.controller.ts:87` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `system_context.dynamic_enum_bindings` | LEE | LEE | DIRECTA | SystemContextController.listEnumBindings → DynamicEnumsService.listBindings → SystemContextRepository.findActiveEnumBindings | `src/modules/system_context/repositories/system-context.repository.ts:578` |
| `system_context.dynamic_enum_definitions` | LEE | LEE | DIRECTA | SystemContextController.listEnumBindings → DynamicEnumsService.listBindings → SystemContextRepository.findEnumDefinitionsByIds | `src/modules/system_context/repositories/system-context.repository.ts:599` |

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
| `items` | `array<DynamicEnumBindingItemDto>` | Sí | — | — | Amarres activos, ordenados por campo. | `src/modules/system_context/dto/system-context.dto.ts:1359` |
| `items[].target` | `string` | Sí | — | — | Campo gobernado, en la forma `esquema.tabla.columna`. | `src/modules/system_context/dto/system-context.dto.ts:1294` |
| `items[].targetSchemaName` | `string` | Sí | — | — | Esquema de la tabla destino. | `src/modules/system_context/dto/system-context.dto.ts:1300` |
| `items[].targetEntityName` | `string` | Sí | — | — | Tabla destino. | `src/modules/system_context/dto/system-context.dto.ts:1306` |
| `items[].targetFieldName` | `string` | Sí | — | — | Columna destino. | `src/modules/system_context/dto/system-context.dto.ts:1312` |
| `items[].enumCode` | `string` | Sí | — | — | Código estable de la enumeración que lo gobierna. | `src/modules/system_context/dto/system-context.dto.ts:1318` |
| `items[].definitionId` | `string` | Sí | formato uuid | — | Identificador de la definición. | `src/modules/system_context/dto/system-context.dto.ts:1324` |
| `items[].valueSetId` | `string` | Sí | formato uuid | — | Conjunto de valores del que sale la enumeración. | `src/modules/system_context/dto/system-context.dto.ts:1330` |
| `items[].required` | `boolean` | Sí | — | — | Si el amarre declara el campo obligatorio. | `src/modules/system_context/dto/system-context.dto.ts:1336` |
| `items[].fallbackConceptId` | `string` | No | formato uuid | — | Concepto de reserva cuando la validación es permisiva. | `src/modules/system_context/dto/system-context.dto.ts:1342` |
| `items[].validationModeConceptId` | `string` | No | formato uuid | — | Modo de validación con el que se resuelve el valor propuesto. | `src/modules/system_context/dto/system-context.dto.ts:1348` |
| `count` | `number` | Sí | — | — | Cuántos amarres trae la respuesta. | `src/modules/system_context/dto/system-context.dto.ts:1365` |

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
| CONTROLADOR | `src/modules/system_context/controllers/system-context.controller.spec.ts:211` |

### Flujos

- Módulo 45 — Contexto de Sistema y Enumeraciones Dinámicas — etapa `ctrl:SystemContextController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 8. POST /system-context/dynamic-enums/definitions

- **Origen:** CONTRATO
- **Nombre:** Definir una enumeración dinámica ligada a un value set
- **Bloque:** Núcleo y Terminología
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SystemContextController.createEnumDefinition` — `src/modules/system_context/controllers/system-context.controller.ts:149`

### Qué es y para qué sirve (negocio)

Definir una enumeración dinámica ligada a un value set. Caso de uso UC-45-01: Definir enumeración ligada a un value set. Dentro del módulo (descripción del modelo, en inglés): «Provides versioned system context for agents, modules and workflows, and database-driven enumerations resolved from governed terminology value sets.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/system_context/README.md:12`) · MODELO (`Mantra Core Health Context/modules/diagram_45_system_context.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /system-context/dynamic-enums/definitions` la atiende `SystemContextController.createEnumDefinition` (src/modules/system_context/controllers/system-context.controller.ts:149). Exige sesión con alguno de los roles TERMINOLOGY_ENGINEER, PLATFORM_ADMIN. Valida el cuerpo como `CreateEnumDefinitionDto` (10 campos, 5 obligatorios). Delega en `DynamicEnumsService.createDefinition`. Crea filas en system_context.dynamic_enum_definitions. Lee system_context.dynamic_enum_definitions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: TERMINOLOGY_ENGINEER, PLATFORM_ADMIN | `src/modules/system_context/controllers/system-context.controller.ts:149` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `system_context.dynamic_enum_definitions` | ESCRIBE | CREA | DIRECTA | SystemContextController.createEnumDefinition → DynamicEnumsService.createDefinition → SystemContextRepository.createEnumDefinition | `src/modules/system_context/repositories/system-context.repository.ts:183` |
| `system_context.dynamic_enum_definitions` | LEE | LEE | DIRECTA | SystemContextController.createEnumDefinition → DynamicEnumsService.createDefinition → SystemContextRepository.findEnumDefinitionByCode | `src/modules/system_context/repositories/system-context.repository.ts:243` |

### Cuerpo — DTO `CreateEnumDefinitionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `code` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Código único global de la definición | `src/modules/system_context/dto/system-context.dto.ts:45` |
| `name` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | — | `src/modules/system_context/dto/system-context.dto.ts:53` |
| `description` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/system_context/dto/system-context.dto.ts:61` |
| `valueSetId` | `string` | Sí | formato uuid | `@IsUUID()` | Value set de terminología del que sale el enum | `src/modules/system_context/dto/system-context.dto.ts:71` |
| `scopeTypeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Ámbito de la definición (catálogo abierto) | `src/modules/system_context/dto/system-context.dto.ts:81` |
| `selectionModeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Modo de selección (catálogo abierto) | `src/modules/system_context/dto/system-context.dto.ts:91` |
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/system_context/dto/system-context.dto.ts:99` |
| `countryConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/system_context/dto/system-context.dto.ts:107` |
| `allowTenantExtension` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | El tenant puede añadir opciones propias | `src/modules/system_context/dto/system-context.dto.ts:118` |
| `allowCustomValue` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Se admite un valor fuera del catálogo | `src/modules/system_context/dto/system-context.dto.ts:129` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/system_context/dto/system-context.dto.ts:140` |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/system_context/dto/system-context.dto.ts:146` |
| `statusConceptId` | `string` | Sí | formato uuid | — | La definición nace en borrador | `src/modules/system_context/dto/system-context.dto.ts:155` |

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
| CONTROLADOR | `src/modules/system_context/controllers/system-context.controller.spec.ts:54` |

### Flujos

- Módulo 45 — Contexto de Sistema y Enumeraciones Dinámicas — etapa `UC-45-01`

---

## 9. POST /system-context/dynamic-enums/definitions/{defId}/bindings

- **Origen:** CONTRATO
- **Nombre:** Vincular la enumeración a un campo destino
- **Bloque:** Núcleo y Terminología
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SystemContextController.createEnumBinding` — `src/modules/system_context/controllers/system-context.controller.ts:199`

### Qué es y para qué sirve (negocio)

Vincular la enumeración a un campo destino. Caso de uso UC-45-04: Vincular el enum a un campo. Dentro del módulo (descripción del modelo, en inglés): «Provides versioned system context for agents, modules and workflows, and database-driven enumerations resolved from governed terminology value sets.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/system_context/README.md:15`) · MODELO (`Mantra Core Health Context/modules/diagram_45_system_context.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /system-context/dynamic-enums/definitions/{defId}/bindings` la atiende `SystemContextController.createEnumBinding` (src/modules/system_context/controllers/system-context.controller.ts:199). Exige sesión con alguno de los roles MODULE_OWNER, PLATFORM_ADMIN. Valida el cuerpo como `CreateEnumBindingDto` (7 campos, 4 obligatorios). Delega en `DynamicEnumsService.createBinding`. Crea filas en system_context.dynamic_enum_bindings. Lee system_context.dynamic_enum_bindings, system_context.dynamic_enum_definitions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: MODULE_OWNER, PLATFORM_ADMIN | `src/modules/system_context/controllers/system-context.controller.ts:199` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_RUTA | Deben ser UUID válidos: defId | `src/modules/system_context/controllers/system-context.controller.ts:199` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `system_context.dynamic_enum_bindings` | ESCRIBE | CREA | DIRECTA | SystemContextController.createEnumBinding → DynamicEnumsService.createBinding → SystemContextRepository.createEnumBinding | `src/modules/system_context/repositories/system-context.repository.ts:513` |
| `system_context.dynamic_enum_bindings` | LEE | LEE | DIRECTA | SystemContextController.createEnumBinding → DynamicEnumsService.createBinding → SystemContextRepository.findEnumBindingByTarget | `src/modules/system_context/repositories/system-context.repository.ts:539` |
| `system_context.dynamic_enum_definitions` | LEE | LEE | DIRECTA | SystemContextController.createEnumBinding → DynamicEnumsService.createBinding → SystemContextRepository.findEnumDefinitionById | `src/modules/system_context/repositories/system-context.repository.ts:214` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `defId` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateEnumBindingDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `targetSchemaName` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Esquema del campo destino | `src/modules/system_context/dto/system-context.dto.ts:355` |
| `targetEntityName` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Entidad del campo destino | `src/modules/system_context/dto/system-context.dto.ts:363` |
| `targetFieldName` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Campo gobernado por el enum | `src/modules/system_context/dto/system-context.dto.ts:371` |
| `systemContextId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Contexto que acota la resolución | `src/modules/system_context/dto/system-context.dto.ts:382` |
| `required` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | El campo no admite quedarse vacío | `src/modules/system_context/dto/system-context.dto.ts:393` |
| `fallbackConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concepto al que se cae en modo LENIENT; obligatorio en ese modo | `src/modules/system_context/dto/system-context.dto.ts:405` |
| `validationMode` | `string` | Sí | valores: STRICT, LENIENT | `@IsIn(VALIDATION_MODES)` | — | `src/modules/system_context/dto/system-context.dto.ts:412` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/system_context/dto/system-context.dto.ts:423` |
| `dynamicEnumDefinitionId` | `string` | Sí | formato uuid | — | Identificador asociado a dynamic enum definition. | `src/modules/system_context/dto/system-context.dto.ts:429` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/system_context/dto/system-context.dto.ts:435` |

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
| CONTROLADOR | `src/modules/system_context/controllers/system-context.controller.spec.ts:83` |

### Flujos

- Módulo 45 — Contexto de Sistema y Enumeraciones Dinámicas — etapa `UC-45-04`

---

## 10. POST /system-context/dynamic-enums/definitions/{defId}/retire

- **Origen:** CONTRATO
- **Nombre:** Retirar la definición (borrado lógico gobernado)
- **Bloque:** Núcleo y Terminología
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SystemContextController.retireEnumDefinition` — `src/modules/system_context/controllers/system-context.controller.ts:232`

### Qué es y para qué sirve (negocio)

Retirar la definición (borrado lógico gobernado). Caso de uso UC-45-11: Retiro gobernado de la definición. Dentro del módulo (descripción del modelo, en inglés): «Provides versioned system context for agents, modules and workflows, and database-driven enumerations resolved from governed terminology value sets.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/system_context/README.md:22`) · MODELO (`Mantra Core Health Context/modules/diagram_45_system_context.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /system-context/dynamic-enums/definitions/{defId}/retire` la atiende `SystemContextController.retireEnumDefinition` (src/modules/system_context/controllers/system-context.controller.ts:232). Exige sesión con alguno de los roles PLATFORM_ADMIN. Valida el cuerpo como `RetireEnumDefinitionDto` (1 campo, 1 obligatorio). Delega en `DynamicEnumsService.retireDefinition`. Actualiza system_context.dynamic_enum_bindings, system_context.dynamic_enum_definitions. Lee system_context.dynamic_enum_bindings, system_context.dynamic_enum_definitions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PLATFORM_ADMIN | `src/modules/system_context/controllers/system-context.controller.ts:232` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_RUTA | Deben ser UUID válidos: defId | `src/modules/system_context/controllers/system-context.controller.ts:232` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `system_context.dynamic_enum_bindings` | ESCRIBE | ACTUALIZA | POR_TIPO | SystemContextController.retireEnumDefinition → DynamicEnumsService.retireDefinition | `src/modules/system_context/services/dynamic-enums.service.ts:712` |
| `system_context.dynamic_enum_bindings` | LEE | LEE | DIRECTA | SystemContextController.retireEnumDefinition → DynamicEnumsService.retireDefinition → SystemContextRepository.findEnumBindingsForUpdate | `src/modules/system_context/repositories/system-context.repository.ts:609` |
| `system_context.dynamic_enum_definitions` | ESCRIBE | ACTUALIZA | POR_TIPO | SystemContextController.retireEnumDefinition → DynamicEnumsService.retireDefinition | `src/modules/system_context/services/dynamic-enums.service.ts:716` |
| `system_context.dynamic_enum_definitions` | LEE | LEE | DIRECTA | SystemContextController.retireEnumDefinition → DynamicEnumsService.retireDefinition → SystemContextRepository.findEnumDefinitionForUpdate | `src/modules/system_context/repositories/system-context.repository.ts:225` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `defId` | path | Sí | `string` | — |

### Cuerpo — DTO `RetireEnumDefinitionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reason` | `string` | Sí | — | `@IsString()` | Por qué se retira | `src/modules/system_context/dto/system-context.dto.ts:557` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/system_context/dto/system-context.dto.ts:568` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/system_context/dto/system-context.dto.ts:574` |
| `disabledBindings` | `number` | Sí | — | — | Bindings que quedan deshabilitados | `src/modules/system_context/dto/system-context.dto.ts:580` |

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
| CONTROLADOR | `src/modules/system_context/controllers/system-context.controller.spec.ts:103` |

### Flujos

- Módulo 45 — Contexto de Sistema y Enumeraciones Dinámicas — etapa `UC-45-11`

---

## 11. POST /system-context/dynamic-enums/definitions/{defId}/versions

- **Origen:** CONTRATO
- **Nombre:** Redactar una versión con su snapshot de opciones
- **Bloque:** Núcleo y Terminología
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SystemContextController.draftEnumVersion` — `src/modules/system_context/controllers/system-context.controller.ts:165`

### Qué es y para qué sirve (negocio)

Redactar una versión con su snapshot de opciones. Caso de uso UC-45-02: Redactar versión + snapshot de opciones. Dentro del módulo (descripción del modelo, en inglés): «Provides versioned system context for agents, modules and workflows, and database-driven enumerations resolved from governed terminology value sets.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/system_context/README.md:13`) · MODELO (`Mantra Core Health Context/modules/diagram_45_system_context.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /system-context/dynamic-enums/definitions/{defId}/versions` la atiende `SystemContextController.draftEnumVersion` (src/modules/system_context/controllers/system-context.controller.ts:165). Exige sesión con alguno de los roles TERMINOLOGY_ENGINEER, PLATFORM_ADMIN. Valida el cuerpo como `DraftEnumVersionDto` (10 campos, 6 obligatorios). Delega en `DynamicEnumsService.draftVersion`. Crea filas en system_context.dynamic_enum_options, system_context.dynamic_enum_versions. Lee system_context.dynamic_enum_definitions, system_context.dynamic_enum_versions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: TERMINOLOGY_ENGINEER, PLATFORM_ADMIN | `src/modules/system_context/controllers/system-context.controller.ts:165` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_RUTA | Deben ser UUID válidos: defId | `src/modules/system_context/controllers/system-context.controller.ts:165` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `system_context.dynamic_enum_definitions` | LEE | LEE | DIRECTA | SystemContextController.draftEnumVersion → DynamicEnumsService.draftVersion → SystemContextRepository.findEnumDefinitionForUpdate | `src/modules/system_context/repositories/system-context.repository.ts:225` |
| `system_context.dynamic_enum_options` | ESCRIBE | CREA | DIRECTA | SystemContextController.draftEnumVersion → DynamicEnumsService.draftVersion → SystemContextRepository.createEnumOption | `src/modules/system_context/repositories/system-context.repository.ts:406` |
| `system_context.dynamic_enum_versions` | ESCRIBE | CREA | DIRECTA | SystemContextController.draftEnumVersion → DynamicEnumsService.draftVersion → SystemContextRepository.createEnumVersion | `src/modules/system_context/repositories/system-context.repository.ts:284` |
| `system_context.dynamic_enum_versions` | LEE | LEE | DIRECTA | SystemContextController.draftEnumVersion → DynamicEnumsService.draftVersion → SystemContextRepository.findLatestEnumVersion | `src/modules/system_context/repositories/system-context.repository.ts:352` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `defId` | path | Sí | `string` | — |

### Cuerpo — DTO `DraftEnumVersionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `valueSetVersionId` | `string` | Sí | formato uuid | `@IsUUID()` | Versión del value set que se congela | `src/modules/system_context/dto/system-context.dto.ts:244` |
| `schemaVersion` | `string` | Sí | longitud máxima 50 | `@IsString()` `@MaxLength(50)` | — | `src/modules/system_context/dto/system-context.dto.ts:254` |
| `options` | `array<EnumOptionDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => EnumOptionDto)` | Snapshot ordenado de las opciones | `src/modules/system_context/dto/system-context.dto.ts:267` |
| `options[].conceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Concepto de terminología | `src/modules/system_context/dto/system-context.dto.ts:171` |
| `options[].code` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/system_context/dto/system-context.dto.ts:179` |
| `options[].display` | `string` | Sí | longitud máxima 300 | `@IsString()` `@MaxLength(300)` | — | `src/modules/system_context/dto/system-context.dto.ts:187` |
| `options[].ordinal` | `number` | No | mínimo 0 | `@IsOptional()` `@IsInt()` `@Min(0)` | Orden de presentación; por defecto, el del array | `src/modules/system_context/dto/system-context.dto.ts:198` |
| `options[].isDefault` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Sólo una opción puede serlo | `src/modules/system_context/dto/system-context.dto.ts:209` |
| `options[].enabled` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | — | `src/modules/system_context/dto/system-context.dto.ts:217` |
| `options[].metadataJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | — | `src/modules/system_context/dto/system-context.dto.ts:225` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/system_context/dto/system-context.dto.ts:278` |
| `versionNumber` | `number` | Sí | — | — | Valor de version number mantenido por la instancia. | `src/modules/system_context/dto/system-context.dto.ts:284` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/system_context/dto/system-context.dto.ts:290` |
| `optionIds` | `array<string>` | Sí | formato uuid | — | Valor de option ids mantenido por la instancia. | `src/modules/system_context/dto/system-context.dto.ts:296` |

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
| CONTROLADOR | `src/modules/system_context/controllers/system-context.controller.spec.ts:64` |

### Flujos

- Módulo 45 — Contexto de Sistema y Enumeraciones Dinámicas — etapa `UC-45-02`

---

## 12. POST /system-context/dynamic-enums/definitions/{defId}/versions/{version}/publish

- **Origen:** CONTRATO
- **Nombre:** Publicar la versión e invalidar la caché
- **Bloque:** Núcleo y Terminología
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SystemContextController.publishEnumVersion` — `src/modules/system_context/controllers/system-context.controller.ts:182`

### Qué es y para qué sirve (negocio)

Publicar la versión e invalidar la caché. Caso de uso UC-45-03: Publicar e invalidar caché. Dentro del módulo (descripción del modelo, en inglés): «Provides versioned system context for agents, modules and workflows, and database-driven enumerations resolved from governed terminology value sets.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/system_context/README.md:14`) · MODELO (`Mantra Core Health Context/modules/diagram_45_system_context.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /system-context/dynamic-enums/definitions/{defId}/versions/{version}/publish` la atiende `SystemContextController.publishEnumVersion` (src/modules/system_context/controllers/system-context.controller.ts:182). Exige sesión con alguno de los roles TERMINOLOGY_ENGINEER, PLATFORM_ADMIN. Delega en `DynamicEnumsService.publishVersion`. Actualiza system_context.dynamic_enum_definitions, system_context.dynamic_enum_versions. Lee system_context.dynamic_enum_definitions, system_context.dynamic_enum_options, system_context.dynamic_enum_versions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: TERMINOLOGY_ENGINEER, PLATFORM_ADMIN | `src/modules/system_context/controllers/system-context.controller.ts:182` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_RUTA | Deben ser UUID válidos: defId | `src/modules/system_context/controllers/system-context.controller.ts:182` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `system_context.dynamic_enum_definitions` | ESCRIBE | ACTUALIZA | POR_TIPO | SystemContextController.publishEnumVersion → DynamicEnumsService.publishVersion | `src/modules/system_context/services/dynamic-enums.service.ts:463` |
| `system_context.dynamic_enum_definitions` | LEE | LEE | DIRECTA | SystemContextController.publishEnumVersion → DynamicEnumsService.publishVersion → SystemContextRepository.findEnumDefinitionForUpdate | `src/modules/system_context/repositories/system-context.repository.ts:225` |
| `system_context.dynamic_enum_options` | LEE | LEE | DIRECTA | SystemContextController.publishEnumVersion → DynamicEnumsService.publishVersion → SystemContextRepository.countEnabledOptions | `src/modules/system_context/repositories/system-context.repository.ts:453` |
| `system_context.dynamic_enum_versions` | ESCRIBE | ACTUALIZA | POR_TIPO | SystemContextController.publishEnumVersion → DynamicEnumsService.publishVersion | `src/modules/system_context/services/dynamic-enums.service.ts:453` |
| `system_context.dynamic_enum_versions` | LEE | LEE | DIRECTA | SystemContextController.publishEnumVersion → DynamicEnumsService.publishVersion → SystemContextRepository.findEnumVersionForUpdate | `src/modules/system_context/repositories/system-context.repository.ts:334` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/system_context/dto/system-context.dto.ts:311` |
| `versionNumber` | `number` | Sí | — | — | Valor de version number mantenido por la instancia. | `src/modules/system_context/dto/system-context.dto.ts:317` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/system_context/dto/system-context.dto.ts:323` |
| `cacheToken` | `string` | Sí | — | — | Token nuevo; invalida la caché de la definición | `src/modules/system_context/dto/system-context.dto.ts:331` |
| `supersededVersionId` | `string` | No | formato uuid | — | Versión que queda superseded | `src/modules/system_context/dto/system-context.dto.ts:340` |

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
| CONTROLADOR | `src/modules/system_context/controllers/system-context.controller.spec.ts:73` |

### Flujos

- Módulo 45 — Contexto de Sistema y Enumeraciones Dinámicas — etapa `UC-45-03`

---

## 13. POST /system-context/dynamic-enums/resolve

- **Origen:** CONTRATO
- **Nombre:** Resolver y validar un valor de enumeración antes de escribirlo
- **Bloque:** Núcleo y Terminología
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SystemContextController.resolveEnumValue` — `src/modules/system_context/controllers/system-context.controller.ts:216`

### Qué es y para qué sirve (negocio)

Resolver y validar un valor de enumeración antes de escribirlo. Caso de uso UC-45-05: Resolver y validar un valor en escritura. Dentro del módulo (descripción del modelo, en inglés): «Provides versioned system context for agents, modules and workflows, and database-driven enumerations resolved from governed terminology value sets.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/system_context/README.md:16`) · MODELO (`Mantra Core Health Context/modules/diagram_45_system_context.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /system-context/dynamic-enums/resolve` la atiende `SystemContextController.resolveEnumValue` (src/modules/system_context/controllers/system-context.controller.ts:216). Exige sesión con alguno de los roles WRITE_SERVICE, MODULE_OWNER, PLATFORM_ADMIN. Valida el cuerpo como `ResolveEnumValueDto` (5 campos, 3 obligatorios). Delega en `DynamicEnumsService.resolveValue`. Lee system_context.dynamic_enum_bindings, system_context.dynamic_enum_options, system_context.dynamic_enum_versions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: WRITE_SERVICE, MODULE_OWNER, PLATFORM_ADMIN | `src/modules/system_context/controllers/system-context.controller.ts:216` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `system_context.dynamic_enum_bindings` | LEE | LEE | DIRECTA | SystemContextController.resolveEnumValue → DynamicEnumsService.resolveValue → SystemContextRepository.findEnumBindingByTarget | `src/modules/system_context/repositories/system-context.repository.ts:539` |
| `system_context.dynamic_enum_options` | LEE | LEE | DIRECTA | SystemContextController.resolveEnumValue → DynamicEnumsService.resolveValue → SystemContextRepository.findEnumOptions | `src/modules/system_context/repositories/system-context.repository.ts:435` |
| `system_context.dynamic_enum_versions` | LEE | LEE | DIRECTA | SystemContextController.resolveEnumValue → DynamicEnumsService.resolveValue → SystemContextRepository.findPublishedEnumVersion | `src/modules/system_context/repositories/system-context.repository.ts:392` |

### Cuerpo — DTO `ResolveEnumValueDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `targetSchemaName` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/system_context/dto/system-context.dto.ts:450` |
| `targetEntityName` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/system_context/dto/system-context.dto.ts:458` |
| `targetFieldName` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/system_context/dto/system-context.dto.ts:466` |
| `conceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Valor propuesto, por concepto | `src/modules/system_context/dto/system-context.dto.ts:477` |
| `code` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Valor propuesto, por código de la opción | `src/modules/system_context/dto/system-context.dto.ts:489` |

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
| `accepted` | `boolean` | Sí | — | — | true si el valor puede escribirse | `src/modules/system_context/dto/system-context.dto.ts:500` |
| `resolvedConceptId` | `string` | No | formato uuid | — | Concepto resuelto que debe persistirse | `src/modules/system_context/dto/system-context.dto.ts:509` |
| `resolvedCode` | `string` | No | — | — | Código de la opción resuelta | `src/modules/system_context/dto/system-context.dto.ts:515` |
| `usedFallback` | `boolean` | Sí | — | — | true si se cayó al concepto de reserva del binding | `src/modules/system_context/dto/system-context.dto.ts:523` |
| `validationModeConceptId` | `string` | Sí | formato uuid | — | Modo con el que se evaluó | `src/modules/system_context/dto/system-context.dto.ts:529` |
| `cacheToken` | `string` | Sí | — | — | Token de la versión resuelta; identifica la caché | `src/modules/system_context/dto/system-context.dto.ts:537` |
| `rejectionReason` | `string` | No | — | — | Por qué se rechazó | `src/modules/system_context/dto/system-context.dto.ts:543` |

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
| CONTROLADOR | `src/modules/system_context/controllers/system-context.controller.spec.ts:93` |

### Flujos

- Módulo 45 — Contexto de Sistema y Enumeraciones Dinámicas — etapa `UC-45-05`

---

