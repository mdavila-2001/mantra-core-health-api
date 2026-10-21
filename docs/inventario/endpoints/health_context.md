<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `health_context`

- **Bloque:** Núcleo y Terminología (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)
- **Operaciones:** 13 (13 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 0 · MEDIO 12 · BAJO 1
- **Tablas distintas que tocan:** 10
- **Respuestas de error y detalle contractual:** `openapi/endpoints/health-context.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | POST | `/health-context/agents` | Registrar un agente recolector gobernado | MEDIO | 2 | SOURCE_ADMIN, PLATFORM_ADMIN |
| 2 | POST | `/health-context/collection-runs` | Disparar una corrida de recolección | MEDIO | 5 | SYSTEM, CONTEXT_CURATOR, PLATFORM_ADMIN |
| 3 | POST | `/health-context/collection-runs/{id}/finish` | Cerrar la corrida conciliando sus contadores | MEDIO | 5 | SYSTEM, PLATFORM_ADMIN |
| 4 | POST | `/health-context/collection-runs/{id}/observations` | Registrar una observación inmutable de fuente | MEDIO | 5 | SYSTEM, PLATFORM_ADMIN |
| 5 | POST | `/health-context/contexts` | Crear el contexto de salud de un país | MEDIO | 2 | CONTEXT_CURATOR, PLATFORM_ADMIN |
| 6 | POST | `/health-context/contexts/{id}/versions` | Materializar una versión borrador con hechos y evidencia | MEDIO | 7 | SYSTEM, CONTEXT_CURATOR, PLATFORM_ADMIN |
| 7 | GET | `/health-context/contexts/resolve` | Resolver el contexto vigente para consumo | BAJO | 4 | CONTEXT_CONSUMER, CONTEXT_CURATOR, SYSTEM, PLATFORM_ADMIN |
| 8 | POST | `/health-context/internal/schedules/run-due` | Evaluar programaciones vencidas y encolar sus corridas | MEDIO | 5 | SYSTEM |
| 9 | POST | `/health-context/schedules` | Programar la recolección de contexto de un país | MEDIO | 2 | CONTEXT_CURATOR, PLATFORM_ADMIN |
| 10 | POST | `/health-context/sources` | Registrar una fuente de contexto de salud | MEDIO | 2 | SOURCE_ADMIN, PLATFORM_ADMIN |
| 11 | POST | `/health-context/versions/{id}/publish` | Publicar la versión aprobada y avanzar el contexto | MEDIO | 4 | CONTEXT_CURATOR, PLATFORM_ADMIN |
| 12 | POST | `/health-context/versions/{id}/quality-reviews` | Revisar la calidad de la versión | MEDIO | 3 | QUALITY_REVIEWER, SYSTEM, PLATFORM_ADMIN |
| 13 | POST | `/health-context/versions/{id}/supersede` | Retirar la versión vigente, con reemplazo o por caducidad | MEDIO | 4 | CONTEXT_CURATOR, PLATFORM_ADMIN |

---

## 1. POST /health-context/agents

- **Origen:** CONTRATO
- **Nombre:** Registrar un agente recolector gobernado
- **Bloque:** Núcleo y Terminología
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `HealthContextController.createAgent` — `src/modules/health_context/controllers/health-context.controller.ts:64`

### Qué es y para qué sirve (negocio)

Registrar un agente recolector gobernado. Caso de uso UC-44-01: Registrar agente recolector. Dentro del módulo (descripción del modelo, en inglés): «Stores country-level health-environment context collected periodically by governed agents.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/health_context/README.md:12`) · MODELO (`Mantra Core Health Context/modules/diagram_44_health_context.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /health-context/agents` la atiende `HealthContextController.createAgent` (src/modules/health_context/controllers/health-context.controller.ts:64). Exige sesión con alguno de los roles SOURCE_ADMIN, PLATFORM_ADMIN. Valida el cuerpo como `CreateAgentDto` (6 campos, 3 obligatorios). Delega en `ContextCollectionService.createAgent`. Crea filas en health_context.context_agents. Lee health_context.context_agents.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SOURCE_ADMIN, PLATFORM_ADMIN | `src/modules/health_context/controllers/health-context.controller.ts:64` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `health_context.context_agents` | ESCRIBE | CREA | DIRECTA | HealthContextController.createAgent → ContextCollectionService.createAgent → HealthContextRepository.createAgent | `src/modules/health_context/repositories/health-context.repository.ts:173` |
| `health_context.context_agents` | LEE | LEE | DIRECTA | HealthContextController.createAgent → ContextCollectionService.createAgent → HealthContextRepository.findAgentByCode | `src/modules/health_context/repositories/health-context.repository.ts:211` |

### Cuerpo — DTO `CreateAgentDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `code` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Código único del agente | `src/modules/health_context/dto/health-context.dto.ts:52` |
| `name` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | — | `src/modules/health_context/dto/health-context.dto.ts:60` |
| `agentTypeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Naturaleza del agente (catálogo abierto) | `src/modules/health_context/dto/health-context.dto.ts:70` |
| `providerId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Proveedor externo que lo opera | `src/modules/health_context/dto/health-context.dto.ts:81` |
| `implementationRef` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | Referencia a la implementación | `src/modules/health_context/dto/health-context.dto.ts:93` |
| `ownerTenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/health_context/dto/health-context.dto.ts:101` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "agentTypeConceptId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "agentTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "providerId": "00000000-0000-4000-8000-000000000001",
  "implementationRef": "valor-ejemplo",
  "ownerTenantId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<AgentResponseDto>` · DTO `AgentResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/health_context/dto/health-context.dto.ts:112` |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/health_context/dto/health-context.dto.ts:118` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/health_context/dto/health-context.dto.ts:124` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe un agente con ese código |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/health_context.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/health_context/controllers/health-context.controller.spec.ts:56` |

### Flujos

- Módulo 44 — Contexto de Salud por País — etapa `UC-44-01`

---

## 2. POST /health-context/collection-runs

- **Origen:** CONTRATO
- **Nombre:** Disparar una corrida de recolección
- **Bloque:** Núcleo y Terminología
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `HealthContextController.startCollectionRun` — `src/modules/health_context/controllers/health-context.controller.ts:137`

### Qué es y para qué sirve (negocio)

Disparar una corrida de recolección. Caso de uso UC-44-05: Disparar corrida idempotente. Dentro del módulo (descripción del modelo, en inglés): «Stores country-level health-environment context collected periodically by governed agents.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/health_context/README.md:16`) · MODELO (`Mantra Core Health Context/modules/diagram_44_health_context.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /health-context/collection-runs` la atiende `HealthContextController.startCollectionRun` (src/modules/health_context/controllers/health-context.controller.ts:137). Exige sesión con alguno de los roles SYSTEM, CONTEXT_CURATOR, PLATFORM_ADMIN. Valida el cuerpo como `StartCollectionRunDto` (6 campos, 2 obligatorios). Delega en `ContextCollectionService.startCollectionRun`. Crea filas en health_context.context_collection_runs. Actualiza health_context.country_context_schedules. Lee health_context.context_agents, health_context.context_collection_runs, health_context.country_context_schedules.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, CONTEXT_CURATOR, PLATFORM_ADMIN | `src/modules/health_context/controllers/health-context.controller.ts:137` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `health_context.context_agents` | LEE | LEE | DIRECTA | HealthContextController.startCollectionRun → ContextCollectionService.startCollectionRun → HealthContextRepository.findAgentById | `src/modules/health_context/repositories/health-context.repository.ts:197` |
| `health_context.context_collection_runs` | ESCRIBE | CREA | DIRECTA | HealthContextController.startCollectionRun → ContextCollectionService.startCollectionRun → HealthContextRepository.createCollectionRun | `src/modules/health_context/repositories/health-context.repository.ts:676` |
| `health_context.context_collection_runs` | LEE | LEE | DIRECTA | HealthContextController.startCollectionRun → ContextCollectionService.startCollectionRun → HealthContextRepository.findRunByIdempotencyKey | `src/modules/health_context/repositories/health-context.repository.ts:730` |
| `health_context.country_context_schedules` | ESCRIBE | ACTUALIZA | POR_TIPO | HealthContextController.startCollectionRun → ContextCollectionService.startCollectionRun | `src/modules/health_context/services/context-collection.service.ts:402` |
| `health_context.country_context_schedules` | LEE | LEE | DIRECTA | HealthContextController.startCollectionRun → ContextCollectionService.startCollectionRun → HealthContextRepository.findScheduleForUpdate | `src/modules/health_context/repositories/health-context.repository.ts:374` |

### Cuerpo — DTO `StartCollectionRunDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `idempotencyKey` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Clave de idempotencia de la corrida | `src/modules/health_context/dto/health-context.dto.ts:504` |
| `trigger` | `string` | Sí | valores: SCHEDULED, MANUAL | `@IsIn(COLLECTION_TRIGGERS)` | — | `src/modules/health_context/dto/health-context.dto.ts:511` |
| `scheduleId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Programación que la dispara | `src/modules/health_context/dto/health-context.dto.ts:522` |
| `agentId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Agente; por defecto, el de la programación | `src/modules/health_context/dto/health-context.dto.ts:533` |
| `countryConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | País; por defecto, el de la programación | `src/modules/health_context/dto/health-context.dto.ts:544` |
| `nextRunAt` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | Próxima ejecución recalculada | `src/modules/health_context/dto/health-context.dto.ts:555` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "idempotencyKey": "valor-ejemplo",
  "trigger": "SCHEDULED"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "idempotencyKey": "valor-ejemplo",
  "trigger": "SCHEDULED",
  "scheduleId": "00000000-0000-4000-8000-000000000001",
  "agentId": "00000000-0000-4000-8000-000000000001",
  "countryConceptId": "00000000-0000-4000-8000-000000000001",
  "nextRunAt": "2026-07-31T12:00:00.000Z"
}
```

</details>

### Respuesta — `Promise<CollectionRunResponseDto>` · DTO `CollectionRunResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/health_context/dto/health-context.dto.ts:566` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/health_context/dto/health-context.dto.ts:572` |
| `duplicate` | `boolean` | Sí | — | — | true si la clave ya se había usado y se devuelve la corrida previa | `src/modules/health_context/dto/health-context.dto.ts:581` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Programación no encontrada; ResourceNotFoundException: Agente no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La programación no está activa; PreconditionFailedException: La corrida necesita agente y país, o una programación de la que salgan; PreconditionFailedException: El agente no está activo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/health_context.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/health_context/controllers/health-context.controller.spec.ts:116` |

### Flujos

- Módulo 44 — Contexto de Salud por País — etapa `UC-44-05`

---

## 3. POST /health-context/collection-runs/{id}/finish

- **Origen:** CONTRATO
- **Nombre:** Cerrar la corrida conciliando sus contadores
- **Bloque:** Núcleo y Terminología
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `HealthContextController.finishCollectionRun` — `src/modules/health_context/controllers/health-context.controller.ts:217`

### Qué es y para qué sirve (negocio)

Cerrar la corrida conciliando sus contadores. Caso de uso UC-44-10: Cerrar corrida conciliando contadores. Dentro del módulo (descripción del modelo, en inglés): «Stores country-level health-environment context collected periodically by governed agents.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/health_context/README.md:21`) · MODELO (`Mantra Core Health Context/modules/diagram_44_health_context.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /health-context/collection-runs/{id}/finish` la atiende `HealthContextController.finishCollectionRun` (src/modules/health_context/controllers/health-context.controller.ts:217). Exige sesión con alguno de los roles SYSTEM, PLATFORM_ADMIN. Valida el cuerpo como `FinishCollectionRunDto` (3 campos, 1 obligatorio). Delega en `ContextCollectionService.finishCollectionRun`. Actualiza health_context.context_collection_runs, health_context.country_context_schedules. Lee health_context.context_collection_runs, health_context.context_source_observations, health_context.country_context_schedules.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, PLATFORM_ADMIN | `src/modules/health_context/controllers/health-context.controller.ts:217` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/health_context/controllers/health-context.controller.ts:217` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `health_context.context_collection_runs` | ESCRIBE | ACTUALIZA | POR_TIPO | HealthContextController.finishCollectionRun → ContextCollectionService.finishCollectionRun | `src/modules/health_context/services/context-collection.service.ts:586` |
| `health_context.context_collection_runs` | LEE | LEE | DIRECTA | HealthContextController.finishCollectionRun → ContextCollectionService.finishCollectionRun → HealthContextRepository.findRunForUpdate | `src/modules/health_context/repositories/health-context.repository.ts:718` |
| `health_context.context_source_observations` | LEE | LEE | DIRECTA | HealthContextController.finishCollectionRun → ContextCollectionService.finishCollectionRun → HealthContextRepository.findObservationsByRun | `src/modules/health_context/repositories/health-context.repository.ts:784` |
| `health_context.country_context_schedules` | ESCRIBE | ACTUALIZA | POR_TIPO | HealthContextController.finishCollectionRun → ContextCollectionService.finishCollectionRun | `src/modules/health_context/services/context-collection.service.ts:601` |
| `health_context.country_context_schedules` | LEE | LEE | DIRECTA | HealthContextController.finishCollectionRun → ContextCollectionService.finishCollectionRun → HealthContextRepository.findScheduleForUpdate | `src/modules/health_context/repositories/health-context.repository.ts:374` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `FinishCollectionRunDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `outcome` | `string` | Sí | valores: SUCCEEDED, PARTIAL, FAILED | `@IsIn(RUN_OUTCOMES)` | — | `src/modules/health_context/dto/health-context.dto.ts:1087` |
| `continuationCursorJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Cursor para continuar donde se quedó | `src/modules/health_context/dto/health-context.dto.ts:1095` |
| `errorSummary` | `string` | No | — | `@IsOptional()` `@IsString()` | Qué salió mal; obligatorio si la corrida falla | `src/modules/health_context/dto/health-context.dto.ts:1105` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "outcome": "SUCCEEDED"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "outcome": "SUCCEEDED",
  "continuationCursorJson": {},
  "errorSummary": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<FinishRunResponseDto>` · DTO `FinishRunResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/health_context/dto/health-context.dto.ts:1116` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/health_context/dto/health-context.dto.ts:1122` |
| `observationsRead` | `string` | Sí | — | — | Observaciones leídas, conciliadas contra la tabla | `src/modules/health_context/dto/health-context.dto.ts:1130` |
| `observationsAccepted` | `string` | Sí | — | — | Valor de observations accepted mantenido por la instancia. | `src/modules/health_context/dto/health-context.dto.ts:1136` |
| `observationsRejected` | `string` | Sí | — | — | Valor de observations rejected mantenido por la instancia. | `src/modules/health_context/dto/health-context.dto.ts:1142` |
| `sourceCount` | `number` | Sí | — | — | Fuentes distintas que aportaron observaciones | `src/modules/health_context/dto/health-context.dto.ts:1148` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Corrida no encontrada |
| 409 | `CONFLICT` | ConflictException: La corrida ya está cerrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Una corrida fallida debe declarar qué salió mal |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/health_context.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/health_context/controllers/health-context.controller.spec.ts:183` |

### Flujos

- Módulo 44 — Contexto de Salud por País — etapa `UC-44-10`

---

## 4. POST /health-context/collection-runs/{id}/observations

- **Origen:** CONTRATO
- **Nombre:** Registrar una observación inmutable de fuente
- **Bloque:** Núcleo y Terminología
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `HealthContextController.recordObservation` — `src/modules/health_context/controllers/health-context.controller.ts:153`

### Qué es y para qué sirve (negocio)

Registrar una observación inmutable de fuente. Caso de uso UC-44-06: Observación inmutable de fuente. Dentro del módulo (descripción del modelo, en inglés): «Stores country-level health-environment context collected periodically by governed agents.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/health_context/README.md:17`) · MODELO (`Mantra Core Health Context/modules/diagram_44_health_context.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /health-context/collection-runs/{id}/observations` la atiende `HealthContextController.recordObservation` (src/modules/health_context/controllers/health-context.controller.ts:153). Exige sesión con alguno de los roles SYSTEM, PLATFORM_ADMIN. Valida el cuerpo como `RecordObservationDto` (9 campos, 3 obligatorios). Delega en `ContextCollectionService.recordObservation`. Crea filas en health_context.context_source_observations. Actualiza health_context.context_collection_runs. Lee health_context.context_collection_runs, health_context.context_source_observations, health_context.health_context_sources.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, PLATFORM_ADMIN | `src/modules/health_context/controllers/health-context.controller.ts:153` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/health_context/controllers/health-context.controller.ts:153` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `health_context.context_collection_runs` | ESCRIBE | ACTUALIZA | POR_TIPO | HealthContextController.recordObservation → ContextCollectionService.recordObservation | `src/modules/health_context/services/context-collection.service.ts:520` |
| `health_context.context_collection_runs` | LEE | LEE | DIRECTA | HealthContextController.recordObservation → ContextCollectionService.recordObservation → HealthContextRepository.findRunForUpdate | `src/modules/health_context/repositories/health-context.repository.ts:718` |
| `health_context.context_source_observations` | ESCRIBE | CREA | DIRECTA | HealthContextController.recordObservation → ContextCollectionService.recordObservation → HealthContextRepository.createObservation | `src/modules/health_context/repositories/health-context.repository.ts:740` |
| `health_context.context_source_observations` | LEE | LEE | DIRECTA | HealthContextController.recordObservation → ContextCollectionService.recordObservation → HealthContextRepository.findObservationByHash | `src/modules/health_context/repositories/health-context.repository.ts:767` |
| `health_context.health_context_sources` | LEE | LEE | DIRECTA | HealthContextController.recordObservation → ContextCollectionService.recordObservation → HealthContextRepository.findSourceById | `src/modules/health_context/repositories/health-context.repository.ts:256` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `RecordObservationDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `sourceId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/health_context/dto/health-context.dto.ts:595` |
| `contentHash` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Hash del contenido recogido; permite deduplicar | `src/modules/health_context/dto/health-context.dto.ts:605` |
| `status` | `string` | Sí | valores: ACCEPTED, REJECTED | `@IsIn(OBSERVATION_STATUSES)` | — | `src/modules/health_context/dto/health-context.dto.ts:612` |
| `sourceLocator` | `string` | No | — | `@IsOptional()` `@IsString()` | Dónde se encontró el dato | `src/modules/health_context/dto/health-context.dto.ts:620` |
| `publishedAt` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | Cuándo lo publicó la fuente | `src/modules/health_context/dto/health-context.dto.ts:631` |
| `retrievedAt` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | Cuándo se recogió; por defecto, ahora | `src/modules/health_context/dto/health-context.dto.ts:642` |
| `mediaType` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/health_context/dto/health-context.dto.ts:651` |
| `rawPayloadFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Archivo con el payload crudo | `src/modules/health_context/dto/health-context.dto.ts:662` |
| `extractedPayloadJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Datos extraídos. Sólo agregado de país: nunca datos de paciente. | `src/modules/health_context/dto/health-context.dto.ts:673` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "sourceId": "00000000-0000-4000-8000-000000000001",
  "contentHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "status": "ACCEPTED"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "sourceId": "00000000-0000-4000-8000-000000000001",
  "contentHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "status": "ACCEPTED",
  "sourceLocator": "valor-ejemplo",
  "publishedAt": "2026-07-31T12:00:00.000Z",
  "retrievedAt": "2026-07-31T12:00:00.000Z",
  "mediaType": "valor-ejemplo",
  "rawPayloadFileId": "00000000-0000-4000-8000-000000000001",
  "extractedPayloadJson": {}
}
```

</details>

### Respuesta — `Promise<ObservationResponseDto>` · DTO `ObservationResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/health_context/dto/health-context.dto.ts:684` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/health_context/dto/health-context.dto.ts:690` |
| `duplicate` | `boolean` | Sí | — | — | true si ya se había recogido el mismo contenido en la corrida | `src/modules/health_context/dto/health-context.dto.ts:699` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Corrida no encontrada; ResourceNotFoundException: Fuente no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La corrida ya no está en curso; PreconditionFailedException: La fuente no está activa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/health_context.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/health_context/controllers/health-context.controller.spec.ts:129` |

### Flujos

- Módulo 44 — Contexto de Salud por País — etapa `UC-44-06`

---

## 5. POST /health-context/contexts

- **Origen:** CONTRATO
- **Nombre:** Crear el contexto de salud de un país
- **Bloque:** Núcleo y Terminología
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `HealthContextController.createContext` — `src/modules/health_context/controllers/health-context.controller.ts:122`

### Qué es y para qué sirve (negocio)

Crear el contexto de salud de un país. Caso de uso UC-44-04: Crear contexto de país (raíz). Dentro del módulo (descripción del modelo, en inglés): «Stores country-level health-environment context collected periodically by governed agents.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/health_context/README.md:15`) · MODELO (`Mantra Core Health Context/modules/diagram_44_health_context.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /health-context/contexts` la atiende `HealthContextController.createContext` (src/modules/health_context/controllers/health-context.controller.ts:122). Exige sesión con alguno de los roles CONTEXT_CURATOR, PLATFORM_ADMIN. Valida el cuerpo como `CreateContextDto` (5 campos, 4 obligatorios). Delega en `CountryContextService.createContext`. Crea filas en health_context.country_health_contexts. Lee health_context.country_health_contexts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CONTEXT_CURATOR, PLATFORM_ADMIN | `src/modules/health_context/controllers/health-context.controller.ts:122` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `health_context.country_health_contexts` | ESCRIBE | CREA | DIRECTA | HealthContextController.createContext → CountryContextService.createContext → HealthContextRepository.createContext | `src/modules/health_context/repositories/health-context.repository.ts:423` |
| `health_context.country_health_contexts` | LEE | LEE | DIRECTA | HealthContextController.createContext → CountryContextService.createContext → HealthContextRepository.findContextByKey | `src/modules/health_context/repositories/health-context.repository.ts:471` |

### Cuerpo — DTO `CreateContextDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `countryConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/health_context/dto/health-context.dto.ts:423` |
| `contextDomainConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Dominio del contexto (catálogo abierto) | `src/modules/health_context/dto/health-context.dto.ts:433` |
| `contextKey` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Clave del contexto dentro del dominio | `src/modules/health_context/dto/health-context.dto.ts:444` |
| `title` | `string` | Sí | longitud máxima 300 | `@IsString()` `@MaxLength(300)` | — | `src/modules/health_context/dto/health-context.dto.ts:452` |
| `description` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/health_context/dto/health-context.dto.ts:460` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "countryConceptId": "00000000-0000-4000-8000-000000000001",
  "contextDomainConceptId": "00000000-0000-4000-8000-000000000001",
  "contextKey": "valor-ejemplo",
  "title": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "countryConceptId": "00000000-0000-4000-8000-000000000001",
  "contextDomainConceptId": "00000000-0000-4000-8000-000000000001",
  "contextKey": "valor-ejemplo",
  "title": "valor-ejemplo",
  "description": "Texto descriptivo de ejemplo"
}
```

</details>

### Respuesta — `Promise<ContextResponseDto>` · DTO `ContextResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/health_context/dto/health-context.dto.ts:471` |
| `contextKey` | `string` | Sí | — | — | Valor de context key mantenido por la instancia. | `src/modules/health_context/dto/health-context.dto.ts:477` |
| `statusConceptId` | `string` | Sí | formato uuid | — | El contexto nace en borrador, sin versión vigente | `src/modules/health_context/dto/health-context.dto.ts:486` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe ese contexto para el país y el dominio |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/health_context.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/health_context/controllers/health-context.controller.spec.ts:103` |

### Flujos

- Módulo 44 — Contexto de Salud por País — etapa `UC-44-04`

---

## 6. POST /health-context/contexts/{id}/versions

- **Origen:** CONTRATO
- **Nombre:** Materializar una versión borrador con hechos y evidencia
- **Bloque:** Núcleo y Terminología
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `HealthContextController.draftContextVersion` — `src/modules/health_context/controllers/health-context.controller.ts:170`

### Qué es y para qué sirve (negocio)

Materializar una versión borrador con hechos y evidencia. Caso de uso UC-44-07: Versión borrador + hechos + evidencia. Dentro del módulo (descripción del modelo, en inglés): «Stores country-level health-environment context collected periodically by governed agents.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/health_context/README.md:18`) · MODELO (`Mantra Core Health Context/modules/diagram_44_health_context.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /health-context/contexts/{id}/versions` la atiende `HealthContextController.draftContextVersion` (src/modules/health_context/controllers/health-context.controller.ts:170). Exige sesión con alguno de los roles SYSTEM, CONTEXT_CURATOR, PLATFORM_ADMIN. Valida el cuerpo como `DraftContextVersionDto` (21 campos, 8 obligatorios). Delega en `CountryContextService.draftVersion`. Crea filas en health_context.context_fact_evidence, health_context.country_health_context_versions, health_context.health_context_facts. Lee health_context.context_collection_runs, health_context.context_source_observations, health_context.country_health_context_versions, health_context.country_health_contexts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, CONTEXT_CURATOR, PLATFORM_ADMIN | `src/modules/health_context/controllers/health-context.controller.ts:170` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/health_context/controllers/health-context.controller.ts:170` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `health_context.context_collection_runs` | LEE | LEE | DIRECTA | HealthContextController.draftContextVersion → CountryContextService.draftVersion → HealthContextRepository.findRunById | `src/modules/health_context/repositories/health-context.repository.ts:704` |
| `health_context.context_fact_evidence` | ESCRIBE | CREA | DIRECTA | HealthContextController.draftContextVersion → CountryContextService.draftVersion → HealthContextRepository.createFactEvidence | `src/modules/health_context/repositories/health-context.repository.ts:924` |
| `health_context.context_source_observations` | LEE | LEE | DIRECTA | HealthContextController.draftContextVersion → CountryContextService.draftVersion → HealthContextRepository.findObservationsByRun | `src/modules/health_context/repositories/health-context.repository.ts:784` |
| `health_context.country_health_context_versions` | ESCRIBE | CREA | DIRECTA | HealthContextController.draftContextVersion → CountryContextService.draftVersion → HealthContextRepository.createContextVersion | `src/modules/health_context/repositories/health-context.repository.ts:540` |
| `health_context.country_health_context_versions` | LEE | LEE | DIRECTA | HealthContextController.draftContextVersion → CountryContextService.draftVersion → HealthContextRepository.findLatestVersion | `src/modules/health_context/repositories/health-context.repository.ts:610` |
| `health_context.country_health_contexts` | LEE | LEE | DIRECTA | HealthContextController.draftContextVersion → CountryContextService.draftVersion → HealthContextRepository.findContextForUpdate | `src/modules/health_context/repositories/health-context.repository.ts:457` |
| `health_context.health_context_facts` | ESCRIBE | CREA | DIRECTA | HealthContextController.draftContextVersion → CountryContextService.draftVersion → HealthContextRepository.createFact | `src/modules/health_context/repositories/health-context.repository.ts:860` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `DraftContextVersionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `collectionRunId` | `string` | Sí | formato uuid | `@IsUUID()` | Corrida de la que salen las observaciones | `src/modules/health_context/dto/health-context.dto.ts:842` |
| `schemaVersion` | `string` | No | longitud máxima 50 | `@IsOptional()` `@IsString()` `@MaxLength(50)` | — | `src/modules/health_context/dto/health-context.dto.ts:851` |
| `summary` | `string` | No | longitud máxima 2000 | `@IsOptional()` `@IsString()` `@MaxLength(2000)` | — | `src/modules/health_context/dto/health-context.dto.ts:860` |
| `contextPayloadJson` | `object` | Sí | — | `@IsObject()` | Contenido del contexto en esta versión | `src/modules/health_context/dto/health-context.dto.ts:867` |
| `observedAt` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | A qué momento corresponde lo observado | `src/modules/health_context/dto/health-context.dto.ts:878` |
| `expiresAt` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | Cuándo caduca la vigencia | `src/modules/health_context/dto/health-context.dto.ts:889` |
| `confidenceScore` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Confianza global, como cadena decimal | `src/modules/health_context/dto/health-context.dto.ts:897` |
| `facts` | `array<ContextFactDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => ContextFactDto)` | Hechos con su evidencia | `src/modules/health_context/dto/health-context.dto.ts:910` |
| `facts[].factKey` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Clave del hecho dentro de la versión | `src/modules/health_context/dto/health-context.dto.ts:761` |
| `facts[].valueType` | `string` | Sí | longitud máxima 50 | `@IsString()` `@MaxLength(50)` | Tipo técnico del valor | `src/modules/health_context/dto/health-context.dto.ts:769` |
| `facts[].valueJson` | `object` | Sí | — | `@IsObject()` | Valor del hecho | `src/modules/health_context/dto/health-context.dto.ts:776` |
| `facts[].metricConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/health_context/dto/health-context.dto.ts:784` |
| `facts[].unitConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/health_context/dto/health-context.dto.ts:792` |
| `facts[].periodStart` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | — | `src/modules/health_context/dto/health-context.dto.ts:800` |
| `facts[].periodEnd` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | — | `src/modules/health_context/dto/health-context.dto.ts:808` |
| `facts[].confidenceScore` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Confianza, como cadena decimal | `src/modules/health_context/dto/health-context.dto.ts:816` |
| `facts[].evidence` | `array<FactEvidenceDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => FactEvidenceDto)` | Un hecho sin evidencia retenida no se acepta | `src/modules/health_context/dto/health-context.dto.ts:829` |
| `facts[].evidence[].sourceObservationId` | `string` | Sí | formato uuid | `@IsUUID()` | Observación que respalda el hecho | `src/modules/health_context/dto/health-context.dto.ts:718` |
| `facts[].evidence[].evidenceLocatorJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Dónde dentro de la observación está la evidencia | `src/modules/health_context/dto/health-context.dto.ts:728` |
| `facts[].evidence[].relevanceScore` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Relevancia, como cadena decimal | `src/modules/health_context/dto/health-context.dto.ts:736` |
| `facts[].evidence[].evidenceHash` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/health_context/dto/health-context.dto.ts:745` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "collectionRunId": "00000000-0000-4000-8000-000000000001",
  "contextPayloadJson": {},
  "facts": [
    {
      "factKey": "valor-ejemplo",
      "valueType": "valor-ejemplo",
      "valueJson": {},
      "evidence": [
        {
          "sourceObservationId": "00000000-0000-4000-8000-000000000001"
        }
      ]
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "collectionRunId": "00000000-0000-4000-8000-000000000001",
  "schemaVersion": "valor-ejemplo",
  "summary": "valor-ejemplo",
  "contextPayloadJson": {},
  "observedAt": "2026-07-31T12:00:00.000Z",
  "expiresAt": "2026-07-31T12:00:00.000Z",
  "confidenceScore": "valor-ejemplo",
  "facts": [
    {
      "factKey": "valor-ejemplo",
      "valueType": "valor-ejemplo",
      "valueJson": {},
      "metricConceptId": "00000000-0000-4000-8000-000000000001",
      "unitConceptId": "00000000-0000-4000-8000-000000000001",
      "periodStart": "2026-07-31T12:00:00.000Z",
      "periodEnd": "2026-07-31T12:00:00.000Z",
      "confidenceScore": "valor-ejemplo",
      "evidence": [
        {
          "sourceObservationId": "00000000-0000-4000-8000-000000000001",
          "evidenceLocatorJson": {},
          "relevanceScore": "valor-ejemplo",
          "evidenceHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
        }
      ]
    }
  ]
}
```

</details>

### Respuesta — `Promise<ContextVersionResponseDto>` · DTO `ContextVersionResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/health_context/dto/health-context.dto.ts:921` |
| `versionNumber` | `number` | Sí | — | — | Valor de version number mantenido por la instancia. | `src/modules/health_context/dto/health-context.dto.ts:927` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/health_context/dto/health-context.dto.ts:933` |
| `contentHash` | `string` | Sí | — | — | Valor de content hash mantenido por la instancia. | `src/modules/health_context/dto/health-context.dto.ts:939` |
| `factIds` | `array<string>` | Sí | formato uuid | — | Valor de fact ids mantenido por la instancia. | `src/modules/health_context/dto/health-context.dto.ts:945` |
| `evidenceCount` | `number` | Sí | — | — | Enlaces hecho → observación creados | `src/modules/health_context/dto/health-context.dto.ts:951` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Contexto no encontrado; ResourceNotFoundException: Corrida no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La clave del hecho está repetida en la versión; PreconditionFailedException: La corrida no está en un estado del que se pueda versionar; PreconditionFailedException: La corrida es de otro país; PreconditionFailedException: La evidencia debe apuntar a una observación aceptada de la misma corrida |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/health_context.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/health_context/controllers/health-context.controller.spec.ts:143` |

### Flujos

- Módulo 44 — Contexto de Salud por País — etapa `UC-44-07`

---

## 7. GET /health-context/contexts/resolve

- **Origen:** CONTRATO
- **Nombre:** Resolver el contexto vigente para consumo
- **Bloque:** Núcleo y Terminología
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `HealthContextController.resolveContext` — `src/modules/health_context/controllers/health-context.controller.ts:250`

### Qué es y para qué sirve (negocio)

Resolver el contexto vigente para consumo. Caso de uso UC-44-12: Resolver contexto vigente para consumo. Dentro del módulo (descripción del modelo, en inglés): «Stores country-level health-environment context collected periodically by governed agents.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/health_context/README.md:23`) · MODELO (`Mantra Core Health Context/modules/diagram_44_health_context.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`GET /health-context/contexts/resolve` la atiende `HealthContextController.resolveContext` (src/modules/health_context/controllers/health-context.controller.ts:250). Exige sesión con alguno de los roles CONTEXT_CONSUMER, CONTEXT_CURATOR, SYSTEM, PLATFORM_ADMIN. Delega en `CountryContextService.resolveContext`. Lee health_context.context_fact_evidence, health_context.country_health_context_versions, health_context.country_health_contexts, health_context.health_context_facts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CONTEXT_CONSUMER, CONTEXT_CURATOR, SYSTEM, PLATFORM_ADMIN | `src/modules/health_context/controllers/health-context.controller.ts:250` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_QUERY | country (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | domain (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | key (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `health_context.context_fact_evidence` | LEE | LEE | DIRECTA | HealthContextController.resolveContext → CountryContextService.resolveContext → HealthContextRepository.findEvidenceByFacts | `src/modules/health_context/repositories/health-context.repository.ts:950` |
| `health_context.country_health_context_versions` | LEE | LEE | DIRECTA | HealthContextController.resolveContext → CountryContextService.resolveContext → HealthContextRepository.findVersionById | `src/modules/health_context/repositories/health-context.repository.ts:578` |
| `health_context.country_health_contexts` | LEE | LEE | DIRECTA | HealthContextController.resolveContext → CountryContextService.resolveContext → HealthContextRepository.findContextByKey | `src/modules/health_context/repositories/health-context.repository.ts:471` |
| `health_context.health_context_facts` | LEE | LEE | DIRECTA | HealthContextController.resolveContext → CountryContextService.resolveContext → HealthContextRepository.findFactsByVersion | `src/modules/health_context/repositories/health-context.repository.ts:891` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `country` | query | Sí | `string` | Concepto de país |
| `domain` | query | Sí | `string` | Concepto de dominio del contexto |
| `key` | query | Sí | `string` | Clave del contexto dentro del dominio |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ResolvedContextResponseDto>` · DTO `ResolvedContextResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `contextId` | `string` | Sí | formato uuid | — | Identificador asociado a context. | `src/modules/health_context/dto/health-context.dto.ts:1290` |
| `versionId` | `string` | Sí | formato uuid | — | Identificador asociado a version. | `src/modules/health_context/dto/health-context.dto.ts:1296` |
| `versionNumber` | `number` | Sí | — | — | Valor de version number mantenido por la instancia. | `src/modules/health_context/dto/health-context.dto.ts:1302` |
| `contextPayloadJson` | `object` | Sí | — | — | Contenido de la versión vigente | `src/modules/health_context/dto/health-context.dto.ts:1308` |
| `observedAt` | `string` | No | formato date-time | — | Valor de observed at mantenido por la instancia. | `src/modules/health_context/dto/health-context.dto.ts:1314` |
| `expiresAt` | `string` | No | formato date-time | — | Valor de expires at mantenido por la instancia. | `src/modules/health_context/dto/health-context.dto.ts:1320` |
| `stale` | `boolean` | Sí | — | — | true si la versión vigente ya caducó | `src/modules/health_context/dto/health-context.dto.ts:1326` |
| `facts` | `array<ResolvedFactDto>` | Sí | — | — | Valor de facts mantenido por la instancia. | `src/modules/health_context/dto/health-context.dto.ts:1332` |
| `facts[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/health_context/dto/health-context.dto.ts:1233` |
| `facts[].factKey` | `string` | Sí | — | — | Valor de fact key mantenido por la instancia. | `src/modules/health_context/dto/health-context.dto.ts:1239` |
| `facts[].valueType` | `string` | Sí | — | — | Valor de value type mantenido por la instancia. | `src/modules/health_context/dto/health-context.dto.ts:1245` |
| `facts[].valueJson` | `object` | Sí | — | — | Valor del hecho | `src/modules/health_context/dto/health-context.dto.ts:1251` |
| `facts[].metricConceptId` | `string` | No | formato uuid | — | Identificador asociado a metric concept. | `src/modules/health_context/dto/health-context.dto.ts:1257` |
| `facts[].unitConceptId` | `string` | No | formato uuid | — | Identificador asociado a unit concept. | `src/modules/health_context/dto/health-context.dto.ts:1263` |
| `facts[].confidenceScore` | `string` | No | — | — | Valor de confidence score mantenido por la instancia. | `src/modules/health_context/dto/health-context.dto.ts:1269` |
| `facts[].evidenceObservationIds` | `array<string>` | Sí | formato uuid | — | Observaciones que respaldan el hecho | `src/modules/health_context/dto/health-context.dto.ts:1279` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Contexto no encontrado; ResourceNotFoundException: La versión vigente no existe |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El contexto no tiene versión vigente; PreconditionFailedException: La versión vigente no está publicada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/health_context.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/health_context/controllers/health-context.controller.spec.ts:210` |

### Flujos

- Módulo 44 — Contexto de Salud por País — etapa `UC-44-12`

---

## 8. POST /health-context/internal/schedules/run-due

- **Origen:** CONTRATO
- **Nombre:** Evaluar programaciones vencidas y encolar sus corridas
- **Bloque:** Núcleo y Terminología
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `HealthContextController.runDueSchedules` — `src/modules/health_context/controllers/health-context.controller.ts:107`

### Qué es y para qué sirve (negocio)

Evaluar programaciones vencidas y encolar sus corridas. Dentro del módulo (descripción del modelo, en inglés): «Stores country-level health-environment context collected periodically by governed agents.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_44_health_context.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /health-context/internal/schedules/run-due` la atiende `HealthContextController.runDueSchedules` (src/modules/health_context/controllers/health-context.controller.ts:107). Exige sesión con alguno de los roles SYSTEM. Valida el cuerpo como `RunDueSchedulesDto` (1 campo, 0 obligatorios). Delega en `ContextCollectionService.runDueSchedules`. Crea filas en health_context.context_collection_runs. Actualiza health_context.country_context_schedules. Lee health_context.context_agents, health_context.context_collection_runs, health_context.country_context_schedules.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM | `src/modules/health_context/controllers/health-context.controller.ts:107` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `health_context.context_agents` | LEE | LEE | DIRECTA | HealthContextController.runDueSchedules → ContextCollectionService.runDueSchedules → ContextCollectionService.runDueSchedule → HealthContextRepository.findAgentById | `src/modules/health_context/repositories/health-context.repository.ts:197` |
| `health_context.context_collection_runs` | ESCRIBE | CREA | DIRECTA | HealthContextController.runDueSchedules → ContextCollectionService.runDueSchedules → ContextCollectionService.runDueSchedule → HealthContextRepository.createCollectionRun | `src/modules/health_context/repositories/health-context.repository.ts:676` |
| `health_context.context_collection_runs` | LEE | LEE | DIRECTA | HealthContextController.runDueSchedules → ContextCollectionService.runDueSchedules → ContextCollectionService.runDueSchedule → HealthContextRepository.findRunByIdempotencyKey | `src/modules/health_context/repositories/health-context.repository.ts:730` |
| `health_context.country_context_schedules` | ESCRIBE | ACTUALIZA | POR_TIPO | HealthContextController.runDueSchedules → ContextCollectionService.runDueSchedules → ContextCollectionService.runDueSchedule | `src/modules/health_context/services/context-collection.service.ts:308` |
| `health_context.country_context_schedules` | LEE | LEE | DIRECTA | HealthContextController.runDueSchedules → ContextCollectionService.runDueSchedules → HealthContextRepository.claimDueSchedules | `src/modules/health_context/repositories/health-context.repository.ts:352` |

### Cuerpo — DTO `RunDueSchedulesDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `limit` | `number` | No | mínimo 1; máximo 100 | `@IsOptional()` `@IsInt()` `@Min(1)` `@Max(100)` | Tamaño máximo del lote de programaciones a evaluar | `src/modules/health_context/dto/health-context.dto.ts:354` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "limit": 20
}
```

</details>

### Respuesta — `Promise<RunDueSchedulesResponseDto>` · DTO `RunDueSchedulesResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `claimed` | `number` | Sí | — | — | Programaciones vencidas reclamadas en este lote | `src/modules/health_context/dto/health-context.dto.ts:397` |
| `queued` | `number` | Sí | — | — | Corridas efectivamente encoladas | `src/modules/health_context/dto/health-context.dto.ts:403` |
| `skipped` | `number` | Sí | — | — | Programaciones vencidas que no llegaron a encolar corrida | sin fuente |
| `results` | `array<DueScheduleRunResultDto>` | Sí | — | — | Valor de results mantenido por la instancia. | `src/modules/health_context/dto/health-context.dto.ts:409` |
| `results[].scheduleId` | `string` | Sí | formato uuid | — | Identificador asociado a schedule. | `src/modules/health_context/dto/health-context.dto.ts:363` |
| `results[].runId` | `string` | No | formato uuid | — | Corrida encolada, si la programación pudo dispararse | `src/modules/health_context/dto/health-context.dto.ts:372` |
| `results[].runNumber` | `string` | No | — | — | Número de la corrida encolada | sin fuente |
| `results[].nextRunAt` | `string` | No | formato date-time | — | Próxima marca calculada a partir del cron de la programación | `src/modules/health_context/dto/health-context.dto.ts:378` |
| `results[].skippedReason` | `string` | No | — | — | Motivo por el que esta marca no llegó a encolar una corrida | `src/modules/health_context/dto/health-context.dto.ts:386` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/health_context.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/health_context/controllers/health-context.controller.spec.ts:90` |

### Flujos

- Módulo 44 — Contexto de Salud por País — etapa `ctrl:HealthContextController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 9. POST /health-context/schedules

- **Origen:** CONTRATO
- **Nombre:** Programar la recolección de contexto de un país
- **Bloque:** Núcleo y Terminología
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `HealthContextController.createSchedule` — `src/modules/health_context/controllers/health-context.controller.ts:91`

### Qué es y para qué sirve (negocio)

Programar la recolección de contexto de un país. Caso de uso UC-44-03: Programar recolección de país. Dentro del módulo (descripción del modelo, en inglés): «Stores country-level health-environment context collected periodically by governed agents.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/health_context/README.md:14`) · MODELO (`Mantra Core Health Context/modules/diagram_44_health_context.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /health-context/schedules` la atiende `HealthContextController.createSchedule` (src/modules/health_context/controllers/health-context.controller.ts:91). Exige sesión con alguno de los roles CONTEXT_CURATOR, PLATFORM_ADMIN. Valida el cuerpo como `HealthContextCreateScheduleDto` (7 campos, 3 obligatorios). Delega en `ContextCollectionService.createSchedule`. Crea filas en health_context.country_context_schedules. Lee health_context.context_agents.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CONTEXT_CURATOR, PLATFORM_ADMIN | `src/modules/health_context/controllers/health-context.controller.ts:91` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `health_context.context_agents` | LEE | LEE | DIRECTA | HealthContextController.createSchedule → ContextCollectionService.createSchedule → HealthContextRepository.findAgentById | `src/modules/health_context/repositories/health-context.repository.ts:197` |
| `health_context.country_context_schedules` | ESCRIBE | CREA | DIRECTA | HealthContextController.createSchedule → ContextCollectionService.createSchedule → HealthContextRepository.createSchedule | `src/modules/health_context/repositories/health-context.repository.ts:323` |

### Cuerpo — DTO `HealthContextCreateScheduleDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `countryConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/health_context/dto/health-context.dto.ts:243` |
| `agentId` | `string` | Sí | formato uuid | `@IsUUID()` | Agente que ejecuta la recolección | `src/modules/health_context/dto/health-context.dto.ts:253` |
| `scheduleExpression` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Expresión cron de cinco campos | `src/modules/health_context/dto/health-context.dto.ts:264` |
| `timezoneConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/health_context/dto/health-context.dto.ts:272` |
| `lookbackDays` | `number` | No | mínimo 0 | `@IsOptional()` `@IsInt()` `@Min(0)` | Días hacia atrás que revisa cada corrida | `src/modules/health_context/dto/health-context.dto.ts:284` |
| `freshnessTtlSeconds` | `number` | No | mínimo 60 | `@IsOptional()` `@IsInt()` `@Min(60)` | Segundos que el contexto se considera fresco | `src/modules/health_context/dto/health-context.dto.ts:296` |
| `nextRunAt` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | Primera ejecución prevista | `src/modules/health_context/dto/health-context.dto.ts:307` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "countryConceptId": "00000000-0000-4000-8000-000000000001",
  "agentId": "00000000-0000-4000-8000-000000000001",
  "scheduleExpression": "0 3 * * *"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "countryConceptId": "00000000-0000-4000-8000-000000000001",
  "agentId": "00000000-0000-4000-8000-000000000001",
  "scheduleExpression": "0 3 * * *",
  "timezoneConceptId": "00000000-0000-4000-8000-000000000001",
  "lookbackDays": 1,
  "freshnessTtlSeconds": 60,
  "nextRunAt": "2026-07-31T12:00:00.000Z"
}
```

</details>

### Respuesta — `Promise<ScheduleResponseDto>` · DTO `ScheduleResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/health_context/dto/health-context.dto.ts:318` |
| `name` | `string` | Sí | — | — | Valor de name mantenido por la instancia. | sin fuente |
| `nextRunAt` | `string` | Sí | formato date-time | — | Valor de next run at mantenido por la instancia. | `src/modules/health_context/dto/health-context.dto.ts:330` |
| `stateConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a state concept. | sin fuente |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Agente no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La expresión de programación debe tener cinco campos; PreconditionFailedException: El agente no está activo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/health_context.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/health_context/controllers/health-context.controller.spec.ts:76` |

### Flujos

- Módulo 44 — Contexto de Salud por País — etapa `UC-44-03`

---

## 10. POST /health-context/sources

- **Origen:** CONTRATO
- **Nombre:** Registrar una fuente de contexto de salud
- **Bloque:** Núcleo y Terminología
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `HealthContextController.createSource` — `src/modules/health_context/controllers/health-context.controller.ts:76`

### Qué es y para qué sirve (negocio)

Registrar una fuente de contexto de salud. Caso de uso UC-44-02: Registrar fuente de contexto. Dentro del módulo (descripción del modelo, en inglés): «Stores country-level health-environment context collected periodically by governed agents.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/health_context/README.md:13`) · MODELO (`Mantra Core Health Context/modules/diagram_44_health_context.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /health-context/sources` la atiende `HealthContextController.createSource` (src/modules/health_context/controllers/health-context.controller.ts:76). Exige sesión con alguno de los roles SOURCE_ADMIN, PLATFORM_ADMIN. Valida el cuerpo como `CreateSourceDto` (8 campos, 4 obligatorios). Delega en `ContextCollectionService.createSource`. Crea filas en health_context.health_context_sources. Lee health_context.health_context_sources.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SOURCE_ADMIN, PLATFORM_ADMIN | `src/modules/health_context/controllers/health-context.controller.ts:76` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `health_context.health_context_sources` | ESCRIBE | CREA | DIRECTA | HealthContextController.createSource → ContextCollectionService.createSource → HealthContextRepository.createSource | `src/modules/health_context/repositories/health-context.repository.ts:227` |
| `health_context.health_context_sources` | LEE | LEE | DIRECTA | HealthContextController.createSource → ContextCollectionService.createSource → HealthContextRepository.findSourceByCode | `src/modules/health_context/repositories/health-context.repository.ts:270` |

### Cuerpo — DTO `CreateSourceDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `code` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Código único de la fuente | `src/modules/health_context/dto/health-context.dto.ts:139` |
| `name` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | — | `src/modules/health_context/dto/health-context.dto.ts:147` |
| `sourceTypeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Naturaleza de la fuente (catálogo abierto) | `src/modules/health_context/dto/health-context.dto.ts:157` |
| `trustTierConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Nivel de confianza; gobierna qué observaciones se aceptan | `src/modules/health_context/dto/health-context.dto.ts:167` |
| `ownerName` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Quién publica la fuente | `src/modules/health_context/dto/health-context.dto.ts:179` |
| `canonicalUrl` | `string` | No | — | `@IsOptional()` `@IsString()` | URL canónica de la fuente | `src/modules/health_context/dto/health-context.dto.ts:187` |
| `countryConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/health_context/dto/health-context.dto.ts:195` |
| `licenseText` | `string` | No | — | `@IsOptional()` `@IsString()` | Licencia bajo la que se puede usar el dato | `src/modules/health_context/dto/health-context.dto.ts:205` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "sourceTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "trustTierConceptId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "sourceTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "trustTierConceptId": "00000000-0000-4000-8000-000000000001",
  "ownerName": "Nombre de ejemplo",
  "canonicalUrl": "valor-ejemplo",
  "countryConceptId": "00000000-0000-4000-8000-000000000001",
  "licenseText": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<SourceResponseDto>` · DTO `SourceResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/health_context/dto/health-context.dto.ts:216` |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/health_context/dto/health-context.dto.ts:222` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/health_context/dto/health-context.dto.ts:228` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe una fuente con ese código |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/health_context.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/health_context/controllers/health-context.controller.spec.ts:66` |

### Flujos

- Módulo 44 — Contexto de Salud por País — etapa `UC-44-02`

---

## 11. POST /health-context/versions/{id}/publish

- **Origen:** CONTRATO
- **Nombre:** Publicar la versión aprobada y avanzar el contexto
- **Bloque:** Núcleo y Terminología
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `HealthContextController.publishVersion` — `src/modules/health_context/controllers/health-context.controller.ts:202`

### Qué es y para qué sirve (negocio)

Publicar la versión aprobada y avanzar el contexto. Caso de uso UC-44-09: Publicar y avanzar la versión vigente. Dentro del módulo (descripción del modelo, en inglés): «Stores country-level health-environment context collected periodically by governed agents.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/health_context/README.md:20`) · MODELO (`Mantra Core Health Context/modules/diagram_44_health_context.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /health-context/versions/{id}/publish` la atiende `HealthContextController.publishVersion` (src/modules/health_context/controllers/health-context.controller.ts:202). Exige sesión con alguno de los roles CONTEXT_CURATOR, PLATFORM_ADMIN. Delega en `CountryContextService.publishVersion`. Actualiza health_context.country_health_context_versions, health_context.country_health_contexts. Lee health_context.country_health_context_versions, health_context.country_health_contexts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CONTEXT_CURATOR, PLATFORM_ADMIN | `src/modules/health_context/controllers/health-context.controller.ts:202` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/health_context/controllers/health-context.controller.ts:202` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `health_context.country_health_context_versions` | ESCRIBE | ACTUALIZA | POR_TIPO | HealthContextController.publishVersion → CountryContextService.publishVersion | `src/modules/health_context/services/country-context.service.ts:369` |
| `health_context.country_health_context_versions` | LEE | LEE | DIRECTA | HealthContextController.publishVersion → CountryContextService.publishVersion → HealthContextRepository.findVersionForUpdate | `src/modules/health_context/repositories/health-context.repository.ts:592` |
| `health_context.country_health_contexts` | ESCRIBE | ACTUALIZA | POR_TIPO | HealthContextController.publishVersion → CountryContextService.publishVersion | `src/modules/health_context/services/country-context.service.ts:377` |
| `health_context.country_health_contexts` | LEE | LEE | DIRECTA | HealthContextController.publishVersion → CountryContextService.publishVersion → HealthContextRepository.findContextForUpdate | `src/modules/health_context/repositories/health-context.repository.ts:457` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PublishVersionResponseDto>` · DTO `PublishVersionResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | — | Id de la versión publicada | `src/modules/health_context/dto/health-context.dto.ts:1043` |
| `state` | `string` | Sí | — | — | Estado del ciclo de vida tras la publicación (código de concepto) | sin fuente |
| `publishedAt` | `string` | Sí | formato date-time | — | Instante de publicación | sin fuente |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Versión no encontrada; ResourceNotFoundException: Contexto no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Sólo se publica una versión aprobada en revisión de calidad |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/health_context.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/health_context/controllers/health-context.controller.spec.ts:170` |

### Flujos

- Módulo 44 — Contexto de Salud por País — etapa `UC-44-09`

---

## 12. POST /health-context/versions/{id}/quality-reviews

- **Origen:** CONTRATO
- **Nombre:** Revisar la calidad de la versión
- **Bloque:** Núcleo y Terminología
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `HealthContextController.recordQualityReview` — `src/modules/health_context/controllers/health-context.controller.ts:186`

### Qué es y para qué sirve (negocio)

Revisar la calidad de la versión. Caso de uso UC-44-08: Revisar calidad de la versión. Dentro del módulo (descripción del modelo, en inglés): «Stores country-level health-environment context collected periodically by governed agents.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/health_context/README.md:19`) · MODELO (`Mantra Core Health Context/modules/diagram_44_health_context.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /health-context/versions/{id}/quality-reviews` la atiende `HealthContextController.recordQualityReview` (src/modules/health_context/controllers/health-context.controller.ts:186). Exige sesión con alguno de los roles QUALITY_REVIEWER, SYSTEM, PLATFORM_ADMIN. Valida el cuerpo como `RecordQualityReviewDto` (5 campos, 2 obligatorios). Delega en `CountryContextService.recordQualityReview`. Crea filas en health_context.context_quality_reviews. Actualiza health_context.country_health_context_versions. Lee health_context.country_health_context_versions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: QUALITY_REVIEWER, SYSTEM, PLATFORM_ADMIN | `src/modules/health_context/controllers/health-context.controller.ts:186` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/health_context/controllers/health-context.controller.ts:186` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `health_context.context_quality_reviews` | ESCRIBE | CREA | DIRECTA | HealthContextController.recordQualityReview → CountryContextService.recordQualityReview → HealthContextRepository.createQualityReview | `src/modules/health_context/repositories/health-context.repository.ts:991` |
| `health_context.country_health_context_versions` | ESCRIBE | ACTUALIZA | POR_TIPO | HealthContextController.recordQualityReview → CountryContextService.recordQualityReview | `src/modules/health_context/services/country-context.service.ts:301` |
| `health_context.country_health_context_versions` | LEE | LEE | DIRECTA | HealthContextController.recordQualityReview → CountryContextService.recordQualityReview → HealthContextRepository.findVersionForUpdate | `src/modules/health_context/repositories/health-context.repository.ts:592` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `RecordQualityReviewDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reviewTypeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Tipo de revisión (catálogo abierto) | `src/modules/health_context/dto/health-context.dto.ts:968` |
| `outcome` | `string` | Sí | valores: APPROVED, REJECTED | `@IsIn(REVIEW_OUTCOMES)` | — | `src/modules/health_context/dto/health-context.dto.ts:975` |
| `reviewerAgentId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Agente revisor, si la revisión es automática | `src/modules/health_context/dto/health-context.dto.ts:986` |
| `issuesJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Problemas encontrados | `src/modules/health_context/dto/health-context.dto.ts:994` |
| `notes` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/health_context/dto/health-context.dto.ts:1002` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "reviewTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "outcome": "APPROVED"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "reviewTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "outcome": "APPROVED",
  "reviewerAgentId": "00000000-0000-4000-8000-000000000001",
  "issuesJson": {},
  "notes": "Texto descriptivo de ejemplo"
}
```

</details>

### Respuesta — `Promise<QualityReviewResponseDto>` · DTO `QualityReviewResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/health_context/dto/health-context.dto.ts:1013` |
| `contextVersionId` | `string` | Sí | formato uuid | — | Identificador asociado a context version. | `src/modules/health_context/dto/health-context.dto.ts:1019` |
| `versionStatusConceptId` | `string` | Sí | formato uuid | — | Estado en el que queda la versión | `src/modules/health_context/dto/health-context.dto.ts:1028` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Versión no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La versión no está en borrador |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/health_context.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/health_context/controllers/health-context.controller.spec.ts:157` |

### Flujos

- Módulo 44 — Contexto de Salud por País — etapa `UC-44-08`

---

## 13. POST /health-context/versions/{id}/supersede

- **Origen:** CONTRATO
- **Nombre:** Retirar la versión vigente, con reemplazo o por caducidad
- **Bloque:** Núcleo y Terminología
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `HealthContextController.supersedeVersion` — `src/modules/health_context/controllers/health-context.controller.ts:234`

### Qué es y para qué sirve (negocio)

Retirar la versión vigente, con reemplazo o por caducidad. Caso de uso UC-44-11: Sustituir o expirar la versión vigente. Dentro del módulo (descripción del modelo, en inglés): «Stores country-level health-environment context collected periodically by governed agents.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/health_context/README.md:22`) · MODELO (`Mantra Core Health Context/modules/diagram_44_health_context.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /health-context/versions/{id}/supersede` la atiende `HealthContextController.supersedeVersion` (src/modules/health_context/controllers/health-context.controller.ts:234). Exige sesión con alguno de los roles CONTEXT_CURATOR, PLATFORM_ADMIN. Valida el cuerpo como `SupersedeVersionDto` (3 campos, 2 obligatorios). Delega en `CountryContextService.supersedeVersion`. Actualiza health_context.country_health_context_versions, health_context.country_health_contexts. Lee health_context.country_health_context_versions, health_context.country_health_contexts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CONTEXT_CURATOR, PLATFORM_ADMIN | `src/modules/health_context/controllers/health-context.controller.ts:234` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/health_context/controllers/health-context.controller.ts:234` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `health_context.country_health_context_versions` | ESCRIBE | ACTUALIZA | POR_TIPO | HealthContextController.supersedeVersion → CountryContextService.supersedeVersion | `src/modules/health_context/services/country-context.service.ts:477` |
| `health_context.country_health_context_versions` | LEE | LEE | DIRECTA | HealthContextController.supersedeVersion → CountryContextService.supersedeVersion → HealthContextRepository.findVersionForUpdate | `src/modules/health_context/repositories/health-context.repository.ts:592` |
| `health_context.country_health_contexts` | ESCRIBE | ACTUALIZA | POR_TIPO | HealthContextController.supersedeVersion → CountryContextService.supersedeVersion | `src/modules/health_context/services/country-context.service.ts:490` |
| `health_context.country_health_contexts` | LEE | LEE | DIRECTA | HealthContextController.supersedeVersion → CountryContextService.supersedeVersion → HealthContextRepository.findContextForUpdate | `src/modules/health_context/repositories/health-context.repository.ts:457` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `SupersedeVersionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `mode` | `string` | Sí | valores: SUPERSEDED, EXPIRED | `@IsIn(SUPERSEDE_MODES)` | `EXPIRED` retira sin reemplazo y deja el contexto obsoleto | `src/modules/health_context/dto/health-context.dto.ts:1165` |
| `reason` | `string` | Sí | — | `@IsString()` | Por qué se retira | `src/modules/health_context/dto/health-context.dto.ts:1172` |
| `replacementVersionId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Versión que la sustituye; obligatoria en modo SUPERSEDED | `src/modules/health_context/dto/health-context.dto.ts:1183` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "mode": "SUPERSEDED",
  "reason": "Texto descriptivo de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "mode": "SUPERSEDED",
  "reason": "Texto descriptivo de ejemplo",
  "replacementVersionId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<SupersedeVersionResponseDto>` · DTO `SupersedeVersionResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Versión retirada | `src/modules/health_context/dto/health-context.dto.ts:1194` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/health_context/dto/health-context.dto.ts:1200` |
| `currentVersionId` | `string` | No | formato uuid | — | Versión que queda vigente | `src/modules/health_context/dto/health-context.dto.ts:1209` |
| `contextStatusConceptId` | `string` | Sí | formato uuid | — | Estado en el que queda el contexto | `src/modules/health_context/dto/health-context.dto.ts:1218` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Versión no encontrada; ResourceNotFoundException: Contexto no encontrado; ResourceNotFoundException: Versión de reemplazo no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Sustituir exige declarar la versión que reemplaza; PreconditionFailedException: La versión no está publicada; PreconditionFailedException: El reemplazo es de otro contexto; PreconditionFailedException: El reemplazo debe estar aprobado en revisión de calidad |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/health_context.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/health_context/controllers/health-context.controller.spec.ts:197` |

### Flujos

- Módulo 44 — Contexto de Salud por País — etapa `UC-44-11`

---

