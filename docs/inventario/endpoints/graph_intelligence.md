<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `graph_intelligence`

- **Bloque:** Datos y NoSQL (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)
- **Operaciones:** 15 (15 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 4 · MEDIO 10 · BAJO 1
- **Tablas distintas que tocan:** 19
- **Respuestas de error y detalle contractual:** `openapi/endpoints/graph-intelligence.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | POST | `/graph/access-scopes` | Definir un alcance de acceso al grafo | MEDIO | 5 | DATA_GOVERNANCE_ADMIN, COMPLIANCE_OFFICER, PLATFORM_ADMIN |
| 2 | PATCH | `/graph/access-scopes/{id}` | Ajustar o suspender el alcance de acceso | MEDIO | 4 | DATA_GOVERNANCE_ADMIN, COMPLIANCE_OFFICER, PLATFORM_ADMIN |
| 3 | POST | `/graph/analytics/community-detection` | Registrar las comunidades detectadas | ALTO | 6 | SYSTEM, GRAPH_ANALYTICS_WORKER, PLATFORM_ADMIN |
| 4 | POST | `/graph/analytics/risk-scoring` | Registrar puntajes de riesgo por nodo | MEDIO | 7 | SYSTEM, GRAPH_ANALYTICS_WORKER, PLATFORM_ADMIN |
| 5 | POST | `/graph/deletion-jobs` | Propagar el borrado al grafo (derecho al olvido) | ALTO | 17 | DATA_GOVERNANCE_ADMIN, SYSTEM, PLATFORM_ADMIN |
| 6 | POST | `/graph/edges/{id}/expire` | Expirar la arista y decaer su confianza | ALTO | 8 | SYSTEM, GRAPH_PROJECTION_WORKER, PLATFORM_ADMIN |
| 7 | POST | `/graph/paths` | Buscar el camino entre dos nodos | MEDIO | 10 | GRAPH_ANALYST, API_CONSUMER, COMPLIANCE_OFFICER, PLATFORM_ADMIN |
| 8 | POST | `/graph/projection-definitions/{id}/runs` | Arrancar una corrida de proyección | MEDIO | 3 | SYSTEM, GRAPH_ANALYST, PLATFORM_ADMIN |
| 9 | POST | `/graph/projection-runs/{id}/advance` | Avanzar el checkpoint de la corrida | MEDIO | 4 | SYSTEM, GRAPH_PROJECTION_WORKER, PLATFORM_ADMIN |
| 10 | POST | `/graph/projections/edges/upsert` | Proyectar una arista con su evidencia | MEDIO | 9 | SYSTEM, GRAPH_PROJECTION_WORKER, PLATFORM_ADMIN |
| 11 | POST | `/graph/projections/nodes/upsert` | Proyectar un nodo y sus identificadores | MEDIO | 5 | SYSTEM, GRAPH_PROJECTION_WORKER, PLATFORM_ADMIN |
| 12 | POST | `/graph/projections/reconcile` | Reconciliar la versión canónica del nodo | ALTO | 8 | SYSTEM, GRAPH_PROJECTION_WORKER, PLATFORM_ADMIN |
| 13 | PATCH | `/graph/rule-hits/{id}` | Mover el hallazgo por su triage | MEDIO | 4 | COMPLIANCE_OFFICER, GRAPH_ANALYST, PLATFORM_ADMIN |
| 14 | POST | `/graph/rules/{id}/evaluate` | Registrar los hallazgos de una regla | MEDIO | 7 | SYSTEM, GRAPH_ANALYTICS_WORKER, COMPLIANCE_OFFICER, PLATFORM_ADMIN |
| 15 | POST | `/graph/traverse` | Recorrer el grafo desde un nodo | BAJO | 7 | GRAPH_ANALYST, API_CONSUMER, COMPLIANCE_OFFICER, PLATFORM_ADMIN |

---

## 1. POST /graph/access-scopes

- **Origen:** CONTRATO
- **Nombre:** Definir un alcance de acceso al grafo
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `GraphQueryController.defineAccessScope` — `src/modules/graph_intelligence/controllers/graph-query.controller.ts:58`

### Qué es y para qué sirve (negocio)

Definir un alcance de acceso al grafo. Caso de uso UC-61-04: Alcance de acceso. Dentro del módulo (descripción del modelo, en inglés): «Supports multi-hop relationship analysis for referrals, organizational networks, counterparties, fraud, delegated access and lineage.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/graph_intelligence/README.md:68`) · MODELO (`Mantra Core Health Context/modules/diagram_61_graph_intelligence.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /graph/access-scopes` la atiende `GraphQueryController.defineAccessScope` (src/modules/graph_intelligence/controllers/graph-query.controller.ts:58). Exige sesión con alguno de los roles DATA_GOVERNANCE_ADMIN, COMPLIANCE_OFFICER, PLATFORM_ADMIN. Valida el cuerpo como `DefineAccessScopeDto` (7 campos, 6 obligatorios). Delega en `GraphTraversalService.defineAccessScope`. Crea filas en graph_intelligence.graph_access_scopes, messaging.domain_events, messaging.outbox_messages. Lee graph_intelligence.graph_access_scopes, messaging.outbox_messages. Publica GraphAccessScopeChanged.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: DATA_GOVERNANCE_ADMIN, COMPLIANCE_OFFICER, PLATFORM_ADMIN | `src/modules/graph_intelligence/controllers/graph-query.controller.ts:58` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:282` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:180` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:149` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `graph_intelligence.graph_access_scopes` | ESCRIBE | CREA | DIRECTA | GraphQueryController.defineAccessScope → GraphTraversalService.defineAccessScope → GraphAnalyticsRepository.createScope | `src/modules/graph_intelligence/repositories/graph-analytics.repository.ts:100` |
| `graph_intelligence.graph_access_scopes` | LEE | LEE | DIRECTA | GraphQueryController.defineAccessScope → GraphTraversalService.defineAccessScope → GraphAnalyticsRepository.findScopeByCodeForUpdate | `src/modules/graph_intelligence/repositories/graph-analytics.repository.ts:35` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | GraphQueryController.defineAccessScope → GraphTraversalService.defineAccessScope → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | GraphQueryController.defineAccessScope → GraphTraversalService.defineAccessScope → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | GraphQueryController.defineAccessScope → GraphTraversalService.defineAccessScope → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `GraphAccessScopeChanged` | `src/modules/graph_intelligence/services/graph-traversal.service.ts:151` |

### Cuerpo — DTO `DefineAccessScopeDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:518` |
| `scopeCode` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:526` |
| `allowedNodeTypes` | `array<string>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@IsString({ each: true })` | Tipos de nodo visitables | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:535` |
| `allowedRelationshipTypes` | `array<string>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@IsString({ each: true })` | Tipos de relación recorribles | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:544` |
| `purposeOfUseCodes` | `array<string>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@IsString({ each: true })` | Propósitos de uso admitidos | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:553` |
| `maxHops` | `number` | Sí | mínimo 1; máximo 6 | `@IsInt()` `@Min(1)` `@Max(MAX_HOPS_CEILING)` | Profundidad máxima | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:566` |
| `requiresPatientContext` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Si el traversal exige declarar el paciente sobre el que se hace | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:578` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "scopeCode": "CODIGO_EJEMPLO",
  "allowedNodeTypes": [
    "valor-ejemplo"
  ],
  "allowedRelationshipTypes": [
    "valor-ejemplo"
  ],
  "purposeOfUseCodes": [
    "CODIGO_EJEMPLO"
  ],
  "maxHops": 1
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "scopeCode": "CODIGO_EJEMPLO",
  "allowedNodeTypes": [
    "valor-ejemplo"
  ],
  "allowedRelationshipTypes": [
    "valor-ejemplo"
  ],
  "purposeOfUseCodes": [
    "CODIGO_EJEMPLO"
  ],
  "maxHops": 1,
  "requiresPatientContext": false
}
```

</details>

### Respuesta — `Promise<AccessScopeResponseDto>` · DTO `AccessScopeResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:648` |
| `scopeCode` | `string` | Sí | — | — | Valor de scope code mantenido por la instancia. | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:654` |
| `maxHops` | `number` | Sí | — | — | Valor de max hops mantenido por la instancia. | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:660` |
| `state` | `string` | Sí | — | — | Valor de state mantenido por la instancia. | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:666` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe un alcance con ese código para el tenant. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/graph_intelligence.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 61 — Inteligencia de grafo (relaciones, referidos y riesgo) — etapa `UC-61-04`

---

## 2. PATCH /graph/access-scopes/{id}

- **Origen:** CONTRATO
- **Nombre:** Ajustar o suspender el alcance de acceso
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `GraphQueryController.updateAccessScope` — `src/modules/graph_intelligence/controllers/graph-query.controller.ts:79`

### Qué es y para qué sirve (negocio)

Ajustar o suspender el alcance de acceso. Caso de uso UC-61-04: Alcance de acceso. Dentro del módulo (descripción del modelo, en inglés): «Supports multi-hop relationship analysis for referrals, organizational networks, counterparties, fraud, delegated access and lineage.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/graph_intelligence/README.md:68`) · MODELO (`Mantra Core Health Context/modules/diagram_61_graph_intelligence.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`PATCH /graph/access-scopes/{id}` la atiende `GraphQueryController.updateAccessScope` (src/modules/graph_intelligence/controllers/graph-query.controller.ts:79). Exige sesión con alguno de los roles DATA_GOVERNANCE_ADMIN, COMPLIANCE_OFFICER, PLATFORM_ADMIN. Valida el cuerpo como `UpdateAccessScopeDto` (6 campos, 0 obligatorios). Delega en `GraphTraversalService.updateAccessScope`. Crea filas en messaging.domain_events, messaging.outbox_messages. Lee graph_intelligence.graph_access_scopes, messaging.outbox_messages. Publica GraphAccessScopeChanged.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: DATA_GOVERNANCE_ADMIN, COMPLIANCE_OFFICER, PLATFORM_ADMIN | `src/modules/graph_intelligence/controllers/graph-query.controller.ts:79` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:282` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/graph_intelligence/controllers/graph-query.controller.ts:79` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:180` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:149` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `graph_intelligence.graph_access_scopes` | LEE | LEE | DIRECTA | GraphQueryController.updateAccessScope → GraphTraversalService.updateAccessScope → GraphAnalyticsRepository.findScopeById | `src/modules/graph_intelligence/repositories/graph-analytics.repository.ts:53` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | GraphQueryController.updateAccessScope → GraphTraversalService.updateAccessScope → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | GraphQueryController.updateAccessScope → GraphTraversalService.updateAccessScope → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | GraphQueryController.updateAccessScope → GraphTraversalService.updateAccessScope → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `GraphAccessScopeChanged` | `src/modules/graph_intelligence/services/graph-traversal.service.ts:214` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `UpdateAccessScopeDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `state` | `string` | No | valores: active, suspended | `@IsOptional()` `@IsIn(SCOPE_STATES)` | — | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:589` |
| `allowedNodeTypes` | `array<string>` | No | mínimo 1 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayMinSize(1)` `@IsString({ each: true })` | — | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:599` |
| `allowedRelationshipTypes` | `array<string>` | No | mínimo 1 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayMinSize(1)` `@IsString({ each: true })` | — | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:609` |
| `purposeOfUseCodes` | `array<string>` | No | mínimo 1 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayMinSize(1)` `@IsString({ each: true })` | — | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:619` |
| `maxHops` | `number` | No | mínimo 1; máximo 6 | `@IsOptional()` `@IsInt()` `@Min(1)` `@Max(MAX_HOPS_CEILING)` | — | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:629` |
| `requiresPatientContext` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | — | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:637` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "state": "active",
  "allowedNodeTypes": [
    "valor-ejemplo"
  ],
  "allowedRelationshipTypes": [
    "valor-ejemplo"
  ],
  "purposeOfUseCodes": [
    "CODIGO_EJEMPLO"
  ],
  "maxHops": 1,
  "requiresPatientContext": true
}
```

</details>

### Respuesta — `Promise<AccessScopeResponseDto>` · DTO `AccessScopeResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:648` |
| `scopeCode` | `string` | Sí | — | — | Valor de scope code mantenido por la instancia. | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:654` |
| `maxHops` | `number` | Sí | — | — | Valor de max hops mantenido por la instancia. | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:660` |
| `state` | `string` | Sí | — | — | Valor de state mantenido por la instancia. | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:666` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/graph_intelligence.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 61 — Inteligencia de grafo (relaciones, referidos y riesgo) — etapa `UC-61-04`

---

## 3. POST /graph/analytics/community-detection

- **Origen:** CONTRATO
- **Nombre:** Registrar las comunidades detectadas
- **Bloque:** Datos y NoSQL
- **Riesgo:** ALTO — Borra filas
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `GraphQueryController.detectCommunities` — `src/modules/graph_intelligence/controllers/graph-query.controller.ts:151`

### Qué es y para qué sirve (negocio)

Registrar las comunidades detectadas. Caso de uso UC-61-06: Comunidades. Dentro del módulo (descripción del modelo, en inglés): «Supports multi-hop relationship analysis for referrals, organizational networks, counterparties, fraud, delegated access and lineage.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/graph_intelligence/README.md:70`) · MODELO (`Mantra Core Health Context/modules/diagram_61_graph_intelligence.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /graph/analytics/community-detection` la atiende `GraphQueryController.detectCommunities` (src/modules/graph_intelligence/controllers/graph-query.controller.ts:151). Exige sesión con alguno de los roles SYSTEM, GRAPH_ANALYTICS_WORKER, PLATFORM_ADMIN. Valida el cuerpo como `DetectCommunitiesDto` (6 campos, 6 obligatorios). Delega en `GraphAnalyticsService.detectCommunities`. Crea filas en graph_intelligence.graph_communities, messaging.domain_events, messaging.outbox_messages. Borra de graph_intelligence.graph_communities. Lee graph_intelligence.graph_communities, messaging.outbox_messages. Publica GraphCommunitiesDetected.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, GRAPH_ANALYTICS_WORKER, PLATFORM_ADMIN | `src/modules/graph_intelligence/controllers/graph-query.controller.ts:151` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:282` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:180` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:149` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `graph_intelligence.graph_communities` | BORRA | BORRA | DIRECTA | GraphQueryController.detectCommunities → GraphAnalyticsService.detectCommunities → GraphAnalyticsRepository.deleteCommunities | `src/modules/graph_intelligence/repositories/graph-analytics.repository.ts:308` |
| `graph_intelligence.graph_communities` | ESCRIBE | CREA | DIRECTA | GraphQueryController.detectCommunities → GraphAnalyticsService.detectCommunities → GraphAnalyticsRepository.createCommunity | `src/modules/graph_intelligence/repositories/graph-analytics.repository.ts:292` |
| `graph_intelligence.graph_communities` | LEE | LEE | DIRECTA | GraphQueryController.detectCommunities → GraphAnalyticsService.detectCommunities → GraphAnalyticsRepository.findCommunitiesByAlgorithm | `src/modules/graph_intelligence/repositories/graph-analytics.repository.ts:253` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | GraphQueryController.detectCommunities → GraphAnalyticsService.detectCommunities → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | GraphQueryController.detectCommunities → GraphAnalyticsService.detectCommunities → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | GraphQueryController.detectCommunities → GraphAnalyticsService.detectCommunities → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `GraphCommunitiesDetected` | `src/modules/graph_intelligence/services/graph-analytics.service.ts:103` |

### Cuerpo — DTO `DetectCommunitiesDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:893` |
| `communityType` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:901` |
| `algorithmVersion` | `string` | Sí | longitud máxima 50 | `@IsString()` `@MaxLength(50)` | Versión del algoritmo que produjo el resultado | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:912` |
| `communities` | `array<CommunityInputDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => CommunityInputDto)` | — | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:922` |
| `communities[].memberNodeIds` | `array<string>` | Sí | formato uuid; mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@IsUUID('4', { each: true })` | — | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:874` |
| `communities[].score` | `number` | Sí | mínimo 0; máximo 1 | `@IsNumber()` `@Min(0)` `@Max(1)` | — | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:883` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "communityType": "valor-ejemplo",
  "algorithmVersion": "valor-ejemplo",
  "communities": [
    {
      "memberNodeIds": [
        "00000000-0000-4000-8000-000000000001"
      ],
      "score": 1
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "communityType": "valor-ejemplo",
  "algorithmVersion": "valor-ejemplo",
  "communities": [
    {
      "memberNodeIds": [
        "00000000-0000-4000-8000-000000000001"
      ],
      "score": 1
    }
  ]
}
```

</details>

### Respuesta — `Promise<CommunitiesResponseDto>` · DTO `CommunitiesResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `communityType` | `string` | Sí | — | — | Valor de community type mantenido por la instancia. | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:933` |
| `algorithmVersion` | `string` | Sí | — | — | Valor de algorithm version mantenido por la instancia. | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:939` |
| `written` | `number` | Sí | — | — | Comunidades escritas | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:945` |
| `replaced` | `number` | Sí | — | — | Comunidades de la misma versión que se reemplazaron | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:953` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/graph_intelligence.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 61 — Inteligencia de grafo (relaciones, referidos y riesgo) — etapa `UC-61-06`

---

## 4. POST /graph/analytics/risk-scoring

- **Origen:** CONTRATO
- **Nombre:** Registrar puntajes de riesgo por nodo
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `GraphQueryController.computeRiskScores` — `src/modules/graph_intelligence/controllers/graph-query.controller.ts:171`

### Qué es y para qué sirve (negocio)

Registrar puntajes de riesgo por nodo. Caso de uso UC-61-07: Puntajes de riesgo. Dentro del módulo (descripción del modelo, en inglés): «Supports multi-hop relationship analysis for referrals, organizational networks, counterparties, fraud, delegated access and lineage.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/graph_intelligence/README.md:71`) · MODELO (`Mantra Core Health Context/modules/diagram_61_graph_intelligence.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /graph/analytics/risk-scoring` la atiende `GraphQueryController.computeRiskScores` (src/modules/graph_intelligence/controllers/graph-query.controller.ts:171). Exige sesión con alguno de los roles SYSTEM, GRAPH_ANALYTICS_WORKER, PLATFORM_ADMIN. Valida el cuerpo como `ComputeRiskScoresDto` (8 campos, 6 obligatorios). Delega en `GraphAnalyticsService.computeRiskScores`. Crea filas en graph_intelligence.graph_risk_scores, messaging.domain_events, messaging.outbox_messages. Actualiza graph_intelligence.graph_risk_scores. Lee graph_intelligence.graph_nodes, graph_intelligence.graph_risk_scores, messaging.outbox_messages. Publica GraphRiskScoreComputed.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, GRAPH_ANALYTICS_WORKER, PLATFORM_ADMIN | `src/modules/graph_intelligence/controllers/graph-query.controller.ts:171` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:282` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:180` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:149` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `graph_intelligence.graph_nodes` | LEE | LEE | DIRECTA | GraphQueryController.computeRiskScores → GraphAnalyticsService.computeRiskScores → GraphProjectionRepository.findNodeById | `src/modules/graph_intelligence/repositories/graph-projection.repository.ts:174` |
| `graph_intelligence.graph_risk_scores` | ESCRIBE | ACTUALIZA | POR_TIPO | GraphQueryController.computeRiskScores → GraphAnalyticsService.computeRiskScores | `src/modules/graph_intelligence/services/graph-analytics.service.ts:188` |
| `graph_intelligence.graph_risk_scores` | ESCRIBE | CREA | DIRECTA | GraphQueryController.computeRiskScores → GraphAnalyticsService.computeRiskScores → GraphAnalyticsRepository.createRiskScore | `src/modules/graph_intelligence/repositories/graph-analytics.repository.ts:400` |
| `graph_intelligence.graph_risk_scores` | LEE | LEE | DIRECTA | GraphQueryController.computeRiskScores → GraphAnalyticsService.computeRiskScores → GraphAnalyticsRepository.findRiskScoreForUpdate | `src/modules/graph_intelligence/repositories/graph-analytics.repository.ts:355` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | GraphQueryController.computeRiskScores → GraphAnalyticsService.computeRiskScores → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | GraphQueryController.computeRiskScores → GraphAnalyticsService.computeRiskScores → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | GraphQueryController.computeRiskScores → GraphAnalyticsService.computeRiskScores → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `GraphRiskScoreComputed` | `src/modules/graph_intelligence/services/graph-analytics.service.ts:208` |

### Cuerpo — DTO `ComputeRiskScoresDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:1000` |
| `riskType` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:1008` |
| `modelVersion` | `string` | Sí | longitud máxima 50 | `@IsString()` `@MaxLength(50)` | — | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:1016` |
| `alertThreshold` | `number` | No | mínimo 0; máximo 1 | `@IsOptional()` `@IsNumber()` `@Min(0)` `@Max(1)` | Por encima de este puntaje se publica alerta | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:1030` |
| `scores` | `array<RiskScoreInputDto>` | Sí | mínimo 1 elemento(s); máximo 1000 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ArrayMaxSize(MAX_PROJECTION_BATCH)` `@ValidateNested({ each: true })` `@Type(() => RiskScoreInputDto)` | — | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:1041` |
| `scores[].nodeId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:969` |
| `scores[].score` | `number` | Sí | mínimo 0; máximo 1 | `@IsNumber()` `@Min(0)` `@Max(1)` | — | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:978` |
| `scores[].explanationRedacted` | `string` | No | longitud máxima 1000 | `@IsOptional()` `@IsString()` `@MaxLength(1000)` | Explicación ya redactada | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:990` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "riskType": "valor-ejemplo",
  "modelVersion": "valor-ejemplo",
  "scores": [
    {
      "nodeId": "00000000-0000-4000-8000-000000000001",
      "score": 1
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "riskType": "valor-ejemplo",
  "modelVersion": "valor-ejemplo",
  "alertThreshold": 1,
  "scores": [
    {
      "nodeId": "00000000-0000-4000-8000-000000000001",
      "score": 1,
      "explanationRedacted": "valor-ejemplo"
    }
  ]
}
```

</details>

### Respuesta — `Promise<RiskScoresResponseDto>` · DTO `RiskScoresResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `riskType` | `string` | Sí | — | — | Valor de risk type mantenido por la instancia. | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:1052` |
| `modelVersion` | `string` | Sí | — | — | Valor de model version mantenido por la instancia. | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:1058` |
| `created` | `number` | Sí | — | — | Puntajes creados | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:1064` |
| `updated` | `number` | Sí | — | — | Puntajes actualizados sobre uno anterior del mismo modelo | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:1072` |
| `alerted` | `number` | Sí | — | — | Puntajes que superaron el umbral y generaron alerta | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:1080` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Nodo no encontrado para ese tenant. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: No se puntúa un nodo que ya no está activo. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/graph_intelligence.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 61 — Inteligencia de grafo (relaciones, referidos y riesgo) — etapa `UC-61-07`

---

## 5. POST /graph/deletion-jobs

- **Origen:** CONTRATO
- **Nombre:** Propagar el borrado al grafo (derecho al olvido)
- **Bloque:** Datos y NoSQL
- **Riesgo:** ALTO — Borra filas
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `GraphQueryController.requestDeletion` — `src/modules/graph_intelligence/controllers/graph-query.controller.ts:240`

### Qué es y para qué sirve (negocio)

Propagar el borrado al grafo (derecho al olvido). Caso de uso UC-61-11: Derecho al olvido. Dentro del módulo (descripción del modelo, en inglés): «Supports multi-hop relationship analysis for referrals, organizational networks, counterparties, fraud, delegated access and lineage.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/graph_intelligence/README.md:75`) · MODELO (`Mantra Core Health Context/modules/diagram_61_graph_intelligence.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /graph/deletion-jobs` la atiende `GraphQueryController.requestDeletion` (src/modules/graph_intelligence/controllers/graph-query.controller.ts:240). Exige sesión con alguno de los roles DATA_GOVERNANCE_ADMIN, SYSTEM, PLATFORM_ADMIN. Valida el cuerpo como `RequestGraphDeletionDto` (3 campos, 3 obligatorios). Delega en `GraphAnalyticsService.requestDeletion`. Crea filas en graph_intelligence.graph_deletion_jobs, messaging.domain_events, messaging.outbox_messages. Actualiza graph_intelligence.graph_communities, graph_intelligence.graph_deletion_jobs. Borra de graph_intelligence.graph_edge_evidence, graph_intelligence.graph_edges, graph_intelligence.graph_node_identifiers, graph_intelligence.graph_nodes, graph_intelligence.graph_path_cache, graph_intelligence.graph_risk_scores. Lee graph_intelligence.graph_communities, graph_intelligence.graph_deletion_jobs, graph_intelligence.graph_edges, graph_intelligence.graph_nodes, graph_intelligence.graph_path_cache, messaging.outbox_messages. Publica GraphEntityPurged.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: DATA_GOVERNANCE_ADMIN, SYSTEM, PLATFORM_ADMIN | `src/modules/graph_intelligence/controllers/graph-query.controller.ts:240` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:282` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:180` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:149` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `graph_intelligence.graph_communities` | ESCRIBE | ACTUALIZA | POR_TIPO | GraphQueryController.requestDeletion → GraphAnalyticsService.requestDeletion | `src/modules/graph_intelligence/services/graph-analytics.service.ts:523` |
| `graph_intelligence.graph_communities` | LEE | LEE | DIRECTA | GraphQueryController.requestDeletion → GraphAnalyticsService.requestDeletion → GraphAnalyticsRepository.findCommunitiesByTenant | `src/modules/graph_intelligence/repositories/graph-analytics.repository.ts:322` |
| `graph_intelligence.graph_deletion_jobs` | ESCRIBE | ACTUALIZA | POR_TIPO | GraphQueryController.requestDeletion → GraphAnalyticsService.requestDeletion | `src/modules/graph_intelligence/services/graph-analytics.service.ts:532` |
| `graph_intelligence.graph_deletion_jobs` | ESCRIBE | CREA | DIRECTA | GraphQueryController.requestDeletion → GraphAnalyticsService.requestDeletion → GraphAnalyticsRepository.createDeletionJob | `src/modules/graph_intelligence/repositories/graph-analytics.repository.ts:576` |
| `graph_intelligence.graph_deletion_jobs` | LEE | LEE | DIRECTA | GraphQueryController.requestDeletion → GraphAnalyticsService.requestDeletion → GraphAnalyticsRepository.findActiveDeletionJob | `src/modules/graph_intelligence/repositories/graph-analytics.repository.ts:540` |
| `graph_intelligence.graph_edge_evidence` | BORRA | BORRA | DIRECTA | GraphQueryController.requestDeletion → GraphAnalyticsService.requestDeletion → GraphProjectionRepository.deleteEvidenceByEdges | `src/modules/graph_intelligence/repositories/graph-projection.repository.ts:480` |
| `graph_intelligence.graph_edges` | BORRA | BORRA | DIRECTA | GraphQueryController.requestDeletion → GraphAnalyticsService.requestDeletion → GraphProjectionRepository.deleteEdges | `src/modules/graph_intelligence/repositories/graph-projection.repository.ts:418` |
| `graph_intelligence.graph_edges` | LEE | LEE | DIRECTA | GraphQueryController.requestDeletion → GraphAnalyticsService.requestDeletion → GraphProjectionRepository.findEdgesTouchingNodes | `src/modules/graph_intelligence/repositories/graph-projection.repository.ts:404` |
| `graph_intelligence.graph_node_identifiers` | BORRA | BORRA | DIRECTA | GraphQueryController.requestDeletion → GraphAnalyticsService.requestDeletion → GraphProjectionRepository.deleteIdentifiersByNodes | `src/modules/graph_intelligence/repositories/graph-projection.repository.ts:319` |
| `graph_intelligence.graph_nodes` | BORRA | BORRA | DIRECTA | GraphQueryController.requestDeletion → GraphAnalyticsService.requestDeletion → GraphProjectionRepository.deleteNodes | `src/modules/graph_intelligence/repositories/graph-projection.repository.ts:234` |
| `graph_intelligence.graph_nodes` | LEE | LEE | DIRECTA | GraphQueryController.requestDeletion → GraphAnalyticsService.requestDeletion → GraphProjectionRepository.findNodeBySourceForUpdate | `src/modules/graph_intelligence/repositories/graph-projection.repository.ts:159` |
| `graph_intelligence.graph_path_cache` | BORRA | BORRA | DIRECTA | GraphQueryController.requestDeletion → GraphAnalyticsService.requestDeletion → GraphAnalyticsRepository.deleteCachedPathsTouchingNodes | `src/modules/graph_intelligence/repositories/graph-analytics.repository.ts:235` |
| `graph_intelligence.graph_path_cache` | LEE | LEE | DIRECTA | GraphQueryController.requestDeletion → GraphAnalyticsService.requestDeletion → GraphAnalyticsRepository.deleteCachedPathsTouchingNodes | `src/modules/graph_intelligence/repositories/graph-analytics.repository.ts:227` |
| `graph_intelligence.graph_risk_scores` | BORRA | BORRA | DIRECTA | GraphQueryController.requestDeletion → GraphAnalyticsService.requestDeletion → GraphAnalyticsRepository.deleteRiskScoresByNodes | `src/modules/graph_intelligence/repositories/graph-analytics.repository.ts:432` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | GraphQueryController.requestDeletion → GraphAnalyticsService.requestDeletion → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | GraphQueryController.requestDeletion → GraphAnalyticsService.requestDeletion → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | GraphQueryController.requestDeletion → GraphAnalyticsService.requestDeletion → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `GraphEntityPurged` | `src/modules/graph_intelligence/services/graph-analytics.service.ts:537` |

### Cuerpo — DTO `RequestGraphDeletionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:1349` |
| `sourceEntityType` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:1357` |
| `sourceEntityId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:1364` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "sourceEntityType": "valor-ejemplo",
  "sourceEntityId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "sourceEntityType": "valor-ejemplo",
  "sourceEntityId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<GraphDeletionResponseDto>` · DTO `GraphDeletionResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:1375` |
| `status` | `string` | Sí | — | — | Valor de status mantenido por la instancia. | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:1381` |
| `nodesDeleted` | `number` | Sí | — | — | Valor de nodes deleted mantenido por la instancia. | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:1387` |
| `edgesDeleted` | `number` | Sí | — | — | Valor de edges deleted mantenido por la instancia. | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:1393` |
| `identifiersDeleted` | `number` | Sí | — | — | Identificadores hasheados purgados | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:1399` |
| `riskScoresDeleted` | `number` | Sí | — | — | Puntajes de riesgo purgados | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:1405` |
| `communitiesUpdated` | `number` | Sí | — | — | Comunidades de las que se depuró el nodo | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:1411` |
| `invalidatedPaths` | `number` | Sí | — | — | Entradas de caché invalidadas | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:1417` |
| `duplicate` | `boolean` | Sí | — | — | Verdadero si ya había un job vivo para esa entidad | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:1425` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/graph_intelligence.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 61 — Inteligencia de grafo (relaciones, referidos y riesgo) — etapa `UC-61-11`

---

## 6. POST /graph/edges/{id}/expire

- **Origen:** CONTRATO
- **Nombre:** Expirar la arista y decaer su confianza
- **Bloque:** Datos y NoSQL
- **Riesgo:** ALTO — Borra filas
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `GraphProjectionController.expireEdge` — `src/modules/graph_intelligence/controllers/graph-projection.controller.ts:155`

### Qué es y para qué sirve (negocio)

Expirar la arista y decaer su confianza. Caso de uso UC-61-10: Expirar arista y decaer confianza. Dentro del módulo (descripción del modelo, en inglés): «Supports multi-hop relationship analysis for referrals, organizational networks, counterparties, fraud, delegated access and lineage.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/graph_intelligence/README.md:74`) · MODELO (`Mantra Core Health Context/modules/diagram_61_graph_intelligence.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /graph/edges/{id}/expire` la atiende `GraphProjectionController.expireEdge` (src/modules/graph_intelligence/controllers/graph-projection.controller.ts:155). Exige sesión con alguno de los roles SYSTEM, GRAPH_PROJECTION_WORKER, PLATFORM_ADMIN. Valida el cuerpo como `ExpireEdgeDto` (4 campos, 1 obligatorio). Delega en `GraphProjectionService.expireEdge`. Crea filas en graph_intelligence.graph_edge_evidence, messaging.domain_events, messaging.outbox_messages. Borra de graph_intelligence.graph_path_cache. Lee graph_intelligence.graph_edge_evidence, graph_intelligence.graph_edges, graph_intelligence.graph_path_cache, messaging.outbox_messages. Publica GraphEdgeExpired.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, GRAPH_PROJECTION_WORKER, PLATFORM_ADMIN | `src/modules/graph_intelligence/controllers/graph-projection.controller.ts:155` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:282` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/graph_intelligence/controllers/graph-projection.controller.ts:155` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:180` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:149` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `graph_intelligence.graph_edge_evidence` | ESCRIBE | CREA | DIRECTA | GraphProjectionController.expireEdge → GraphProjectionService.expireEdge → GraphProjectionRepository.createEvidence | `src/modules/graph_intelligence/repositories/graph-projection.repository.ts:431` |
| `graph_intelligence.graph_edge_evidence` | LEE | LEE | DIRECTA | GraphProjectionController.expireEdge → GraphProjectionService.expireEdge → GraphProjectionRepository.findEvidenceByHash | `src/modules/graph_intelligence/repositories/graph-projection.repository.ts:447` |
| `graph_intelligence.graph_edges` | LEE | LEE | DIRECTA | GraphProjectionController.expireEdge → GraphProjectionService.expireEdge → GraphProjectionRepository.findEdgeForUpdate | `src/modules/graph_intelligence/repositories/graph-projection.repository.ts:356` |
| `graph_intelligence.graph_path_cache` | BORRA | BORRA | DIRECTA | GraphProjectionController.expireEdge → GraphProjectionService.expireEdge → GraphAnalyticsRepository.deleteCachedPathsTouchingEdges | `src/modules/graph_intelligence/repositories/graph-analytics.repository.ts:208` |
| `graph_intelligence.graph_path_cache` | LEE | LEE | DIRECTA | GraphProjectionController.expireEdge → GraphProjectionService.expireEdge → GraphAnalyticsRepository.deleteCachedPathsTouchingEdges | `src/modules/graph_intelligence/repositories/graph-analytics.repository.ts:203` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | GraphProjectionController.expireEdge → GraphProjectionService.expireEdge → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | GraphProjectionController.expireEdge → GraphProjectionService.expireEdge → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | GraphProjectionController.expireEdge → GraphProjectionService.expireEdge → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `GraphEdgeExpired` | `src/modules/graph_intelligence/services/graph-projection.service.ts:522` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `ExpireEdgeDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `evidenceHash` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Hash del evento de cierre; deduplica el reenvío | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:1265` |
| `sourceReference` | `string` | No | longitud máxima 300 | `@IsOptional()` `@IsString()` `@MaxLength(300)` | — | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:1274` |
| `confidenceDelta` | `number` | No | mínimo -1; máximo 0 | `@IsOptional()` `@IsNumber()` `@Min(-1)` `@Max(0)` | Cuánto baja la confianza al cerrar; nunca positivo | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:1289` |
| `retired` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Si la arista se retira en vez de expirar naturalmente | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:1300` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "evidenceHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "evidenceHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "sourceReference": "valor-ejemplo",
  "confidenceDelta": -0.5,
  "retired": false
}
```

</details>

### Respuesta — `Promise<ExpireEdgeResponseDto>` · DTO `ExpireEdgeResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:1311` |
| `lifecycleState` | `string` | Sí | — | — | Valor de lifecycle state mantenido por la instancia. | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:1317` |
| `confidenceScore` | `number` | Sí | — | — | Valor de confidence score mantenido por la instancia. | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:1323` |
| `invalidatedPaths` | `number` | Sí | — | — | Entradas de caché de rutas invalidadas | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:1329` |
| `alreadyClosed` | `boolean` | Sí | — | — | Verdadero si la arista ya estaba cerrada | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:1335` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/graph_intelligence.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 61 — Inteligencia de grafo (relaciones, referidos y riesgo) — etapa `UC-61-10`

---

## 7. POST /graph/paths

- **Origen:** CONTRATO
- **Nombre:** Buscar el camino entre dos nodos
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `GraphQueryController.findPath` — `src/modules/graph_intelligence/controllers/graph-query.controller.ts:126`

### Qué es y para qué sirve (negocio)

Buscar el camino entre dos nodos. Caso de uso UC-61-05: Recorrido y rutas con scoping. Dentro del módulo (descripción del modelo, en inglés): «Supports multi-hop relationship analysis for referrals, organizational networks, counterparties, fraud, delegated access and lineage.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/graph_intelligence/README.md:69`) · MODELO (`Mantra Core Health Context/modules/diagram_61_graph_intelligence.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /graph/paths` la atiende `GraphQueryController.findPath` (src/modules/graph_intelligence/controllers/graph-query.controller.ts:126). Exige sesión con alguno de los roles GRAPH_ANALYST, API_CONSUMER, COMPLIANCE_OFFICER, PLATFORM_ADMIN. Valida el cuerpo como `FindPathDto` (8 campos, 5 obligatorios). Delega en `GraphTraversalService.findPath`. Crea filas en graph_intelligence.graph_path_cache. Actualiza graph_intelligence.graph_path_cache. Lee consent.consents, consent.privacy_restrictions, consent.processing_purposes, graph_intelligence.graph_access_scopes, graph_intelligence.graph_edges, graph_intelligence.graph_nodes, graph_intelligence.graph_path_cache, profiles.patient_profiles.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: GRAPH_ANALYST, API_CONSUMER, COMPLIANCE_OFFICER, PLATFORM_ADMIN | `src/modules/graph_intelligence/controllers/graph-query.controller.ts:126` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:282` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:180` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:149` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `consent.consents` | LEE | LEE | DIRECTA | GraphQueryController.findPath → GraphTraversalService.findPath → GraphTraversalService.requirePatientConsent → GraphConsentGate.assertAllowed | `src/modules/graph_intelligence/services/graph-consent-gate.service.ts:64` |
| `consent.privacy_restrictions` | LEE | LEE | DIRECTA | GraphQueryController.findPath → GraphTraversalService.findPath → GraphTraversalService.requirePatientConsent → GraphConsentGate.assertAllowed | `src/modules/graph_intelligence/services/graph-consent-gate.service.ts:78` |
| `consent.processing_purposes` | LEE | LEE | DIRECTA | GraphQueryController.findPath → GraphTraversalService.findPath → GraphTraversalService.requirePatientConsent → GraphConsentGate.assertAllowed | `src/modules/graph_intelligence/services/graph-consent-gate.service.ts:59` |
| `graph_intelligence.graph_access_scopes` | LEE | LEE | DIRECTA | GraphQueryController.findPath → GraphTraversalService.findPath → GraphTraversalService.requireActiveScope → GraphAnalyticsRepository.findScopeByCodeForUpdate | `src/modules/graph_intelligence/repositories/graph-analytics.repository.ts:35` |
| `graph_intelligence.graph_edges` | LEE | LEE | DIRECTA | GraphQueryController.findPath → GraphTraversalService.findPath → GraphTraversalService.walk → GraphProjectionRepository.findActiveEdgesFrom | `src/modules/graph_intelligence/repositories/graph-projection.repository.ts:395` |
| `graph_intelligence.graph_nodes` | LEE | LEE | DIRECTA | GraphQueryController.findPath → GraphTraversalService.findPath → GraphTraversalService.requireStartNode → GraphProjectionRepository.findNodeById | `src/modules/graph_intelligence/repositories/graph-projection.repository.ts:174` |
| `graph_intelligence.graph_path_cache` | ESCRIBE | ACTUALIZA | POR_TIPO | GraphQueryController.findPath → GraphTraversalService.findPath | `src/modules/graph_intelligence/services/graph-traversal.service.ts:386` |
| `graph_intelligence.graph_path_cache` | ESCRIBE | CREA | DIRECTA | GraphQueryController.findPath → GraphTraversalService.findPath → GraphAnalyticsRepository.createCachedPath | `src/modules/graph_intelligence/repositories/graph-analytics.repository.ts:184` |
| `graph_intelligence.graph_path_cache` | LEE | LEE | DIRECTA | GraphQueryController.findPath → GraphTraversalService.findPath → GraphAnalyticsRepository.findCachedPath | `src/modules/graph_intelligence/repositories/graph-analytics.repository.ts:137` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | GraphQueryController.findPath → GraphTraversalService.findPath → GraphTraversalService.requireStartPatientConsent → GraphTraversalService.patientIdsOf → GraphProjectionRepository.findPatientProfileIds | `src/modules/graph_intelligence/repositories/graph-projection.repository.ts:219` |

### Cuerpo — DTO `FindPathDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:680` |
| `scopeCode` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Alcance de acceso bajo el que se recorre | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:691` |
| `startNodeId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:698` |
| `purposeOfUse` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:706` |
| `relationshipFilter` | `array<string>` | No | — | `@IsOptional()` `@IsArray()` `@IsString({ each: true })` | Filtro de tipos de relación | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:718` |
| `maxHops` | `number` | No | mínimo 1; máximo 6 | `@IsOptional()` `@IsInt()` `@Min(1)` `@Max(MAX_HOPS_CEILING)` | — | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:728` |
| `patientProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Paciente del contexto; obligatorio si el alcance lo exige | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:739` |
| `endNodeId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:749` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "scopeCode": "CODIGO_EJEMPLO",
  "startNodeId": "00000000-0000-4000-8000-000000000001",
  "purposeOfUse": "valor-ejemplo",
  "endNodeId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "scopeCode": "CODIGO_EJEMPLO",
  "startNodeId": "00000000-0000-4000-8000-000000000001",
  "purposeOfUse": "valor-ejemplo",
  "relationshipFilter": [
    "valor-ejemplo"
  ],
  "maxHops": 1,
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "endNodeId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<PathResponseDto>` · DTO `PathResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `startNodeId` | `string` | Sí | formato uuid | — | Identificador asociado a start node. | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:826` |
| `endNodeId` | `string` | Sí | formato uuid | — | Identificador asociado a end node. | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:832` |
| `found` | `boolean` | Sí | — | — | Verdadero si existe camino dentro del alcance | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:838` |
| `pathNodes` | `array<string>` | Sí | formato uuid | — | Valor de path nodes mantenido por la instancia. | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:844` |
| `pathEdges` | `array<string>` | Sí | formato uuid | — | Valor de path edges mantenido por la instancia. | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:850` |
| `fromCache` | `boolean` | Sí | — | — | Verdadero si la ruta salió de la caché | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:856` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Alcance de acceso no encontrado.; ResourceNotFoundException: Nodo de partida no encontrado. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El alcance de acceso no está activo.; PreconditionFailedException: El alcance no admite ese propósito de uso.; PreconditionFailedException: El alcance exige declarar el paciente del contexto.; PreconditionFailedException: El nodo de partida queda fuera del alcance de acceso. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.FORBIDDEN} |

El árbol de decisión completo está en [flujos](../flujos/graph_intelligence.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 61 — Inteligencia de grafo (relaciones, referidos y riesgo) — etapa `UC-61-05`

---

## 8. POST /graph/projection-definitions/{id}/runs

- **Origen:** CONTRATO
- **Nombre:** Arrancar una corrida de proyección
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `GraphProjectionController.startProjectionRun` — `src/modules/graph_intelligence/controllers/graph-projection.controller.ts:112`

### Qué es y para qué sirve (negocio)

Arrancar una corrida de proyección. Caso de uso UC-61-03: Corrida incremental. Dentro del módulo (descripción del modelo, en inglés): «Supports multi-hop relationship analysis for referrals, organizational networks, counterparties, fraud, delegated access and lineage.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/graph_intelligence/README.md:67`) · MODELO (`Mantra Core Health Context/modules/diagram_61_graph_intelligence.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /graph/projection-definitions/{id}/runs` la atiende `GraphProjectionController.startProjectionRun` (src/modules/graph_intelligence/controllers/graph-projection.controller.ts:112). Exige sesión con alguno de los roles SYSTEM, GRAPH_ANALYST, PLATFORM_ADMIN. Valida el cuerpo como `StartProjectionRunDto` (1 campo, 0 obligatorios). Delega en `GraphProjectionService.startProjectionRun`. Crea filas en graph_intelligence.graph_projection_runs. Lee graph_intelligence.graph_projection_definitions, graph_intelligence.graph_projection_runs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, GRAPH_ANALYST, PLATFORM_ADMIN | `src/modules/graph_intelligence/controllers/graph-projection.controller.ts:112` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:282` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/graph_intelligence/controllers/graph-projection.controller.ts:112` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:180` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:149` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `graph_intelligence.graph_projection_definitions` | LEE | LEE | DIRECTA | GraphProjectionController.startProjectionRun → GraphProjectionService.startProjectionRun → GraphProjectionRepository.findDefinitionById | `src/modules/graph_intelligence/repositories/graph-projection.repository.ts:496` |
| `graph_intelligence.graph_projection_runs` | ESCRIBE | CREA | DIRECTA | GraphProjectionController.startProjectionRun → GraphProjectionService.startProjectionRun → GraphProjectionRepository.createRun | `src/modules/graph_intelligence/repositories/graph-projection.repository.ts:566` |
| `graph_intelligence.graph_projection_runs` | LEE | LEE | DIRECTA | GraphProjectionController.startProjectionRun → GraphProjectionService.startProjectionRun → GraphProjectionRepository.findRunningRunForUpdate | `src/modules/graph_intelligence/repositories/graph-projection.repository.ts:509` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `StartProjectionRunDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `sourceCheckpoint` | `string` | No | — | `@IsOptional()` `@IsNumberString({ no_symbols: true })` | Punto desde el que sigue la corrida; cadena por ser bigint | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:401` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "sourceCheckpoint": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<ProjectionRunResponseDto>` · DTO `ProjectionRunResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:472` |
| `status` | `string` | Sí | — | — | Valor de status mantenido por la instancia. | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:478` |
| `sourceCheckpoint` | `string` | No | — | — | Valor de source checkpoint mantenido por la instancia. | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:484` |
| `nodesWritten` | `string` | Sí | — | — | Valor de nodes written mantenido por la instancia. | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:490` |
| `edgesWritten` | `string` | Sí | — | — | Valor de edges written mantenido por la instancia. | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:496` |
| `alreadyRunning` | `boolean` | Sí | — | — | Verdadero si ya había una corrida viva y se devuelve ésa | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:504` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La definición de proyección no está activa. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/graph_intelligence.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 61 — Inteligencia de grafo (relaciones, referidos y riesgo) — etapa `UC-61-03`

---

## 9. POST /graph/projection-runs/{id}/advance

- **Origen:** CONTRATO
- **Nombre:** Avanzar el checkpoint de la corrida
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `GraphProjectionController.advanceProjectionRun` — `src/modules/graph_intelligence/controllers/graph-projection.controller.ts:134`

### Qué es y para qué sirve (negocio)

Avanzar el checkpoint de la corrida. Caso de uso UC-61-03: Corrida incremental. Dentro del módulo (descripción del modelo, en inglés): «Supports multi-hop relationship analysis for referrals, organizational networks, counterparties, fraud, delegated access and lineage.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/graph_intelligence/README.md:67`) · MODELO (`Mantra Core Health Context/modules/diagram_61_graph_intelligence.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /graph/projection-runs/{id}/advance` la atiende `GraphProjectionController.advanceProjectionRun` (src/modules/graph_intelligence/controllers/graph-projection.controller.ts:134). Exige sesión con alguno de los roles SYSTEM, GRAPH_PROJECTION_WORKER, PLATFORM_ADMIN. Valida el cuerpo como `AdvanceProjectionRunDto` (5 campos, 1 obligatorio). Delega en `GraphProjectionService.advanceProjectionRun`. Crea filas en messaging.domain_events, messaging.outbox_messages. Lee graph_intelligence.graph_projection_runs, messaging.outbox_messages. Publica GraphProjectionRunFinished.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, GRAPH_PROJECTION_WORKER, PLATFORM_ADMIN | `src/modules/graph_intelligence/controllers/graph-projection.controller.ts:134` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:282` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/graph_intelligence/controllers/graph-projection.controller.ts:134` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:180` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:149` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `graph_intelligence.graph_projection_runs` | LEE | LEE | DIRECTA | GraphProjectionController.advanceProjectionRun → GraphProjectionService.advanceProjectionRun → GraphProjectionRepository.findRunForUpdate | `src/modules/graph_intelligence/repositories/graph-projection.repository.ts:527` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | GraphProjectionController.advanceProjectionRun → GraphProjectionService.advanceProjectionRun → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | GraphProjectionController.advanceProjectionRun → GraphProjectionService.advanceProjectionRun → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | GraphProjectionController.advanceProjectionRun → GraphProjectionService.advanceProjectionRun → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `GraphProjectionRunFinished` | `src/modules/graph_intelligence/services/graph-projection.service.ts:425` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `AdvanceProjectionRunDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `sourceCheckpoint` | `string` | Sí | — | `@IsNumberString({ no_symbols: true })` | Nuevo punto alcanzado; cadena por ser bigint | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:411` |
| `nodesWritten` | `number` | No | mínimo 0; máximo 1000 | `@IsOptional()` `@IsInt()` `@Min(0)` `@Max(MAX_PROJECTION_BATCH)` | — | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:425` |
| `edgesWritten` | `number` | No | mínimo 0; máximo 1000 | `@IsOptional()` `@IsInt()` `@Min(0)` `@Max(MAX_PROJECTION_BATCH)` | — | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:439` |
| `finalBatch` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Si este lote cierra la corrida | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:450` |
| `failed` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Cierra la corrida como fallida | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:461` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "sourceCheckpoint": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "sourceCheckpoint": "valor-ejemplo",
  "nodesWritten": 0,
  "edgesWritten": 0,
  "finalBatch": false,
  "failed": false
}
```

</details>

### Respuesta — `Promise<ProjectionRunResponseDto>` · DTO `ProjectionRunResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:472` |
| `status` | `string` | Sí | — | — | Valor de status mantenido por la instancia. | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:478` |
| `sourceCheckpoint` | `string` | No | — | — | Valor de source checkpoint mantenido por la instancia. | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:484` |
| `nodesWritten` | `string` | Sí | — | — | Valor de nodes written mantenido por la instancia. | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:490` |
| `edgesWritten` | `string` | Sí | — | — | Valor de edges written mantenido por la instancia. | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:496` |
| `alreadyRunning` | `boolean` | Sí | — | — | Verdadero si ya había una corrida viva y se devuelve ésa | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:504` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: El checkpoint no puede retroceder. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La corrida ya no está en marcha. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/graph_intelligence.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 61 — Inteligencia de grafo (relaciones, referidos y riesgo) — etapa `UC-61-03`

---

## 10. POST /graph/projections/edges/upsert

- **Origen:** CONTRATO
- **Nombre:** Proyectar una arista con su evidencia
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `GraphProjectionController.upsertEdge` — `src/modules/graph_intelligence/controllers/graph-projection.controller.ts:71`

### Qué es y para qué sirve (negocio)

Proyectar una arista con su evidencia. Caso de uso UC-61-02: Proyectar arista con evidencia. Dentro del módulo (descripción del modelo, en inglés): «Supports multi-hop relationship analysis for referrals, organizational networks, counterparties, fraud, delegated access and lineage.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/graph_intelligence/README.md:66`) · MODELO (`Mantra Core Health Context/modules/diagram_61_graph_intelligence.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /graph/projections/edges/upsert` la atiende `GraphProjectionController.upsertEdge` (src/modules/graph_intelligence/controllers/graph-projection.controller.ts:71). Exige sesión con alguno de los roles SYSTEM, GRAPH_PROJECTION_WORKER, PLATFORM_ADMIN. Valida el cuerpo como `UpsertEdgeDto` (15 campos, 6 obligatorios). Delega en `GraphProjectionService.upsertEdge`. Crea filas en graph_intelligence.graph_edge_evidence, graph_intelligence.graph_edges, messaging.domain_events, messaging.outbox_messages. Actualiza graph_intelligence.graph_edges. Lee graph_intelligence.graph_edge_evidence, graph_intelligence.graph_edges, graph_intelligence.graph_nodes, messaging.outbox_messages. Publica GraphEdgeProjected.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, GRAPH_PROJECTION_WORKER, PLATFORM_ADMIN | `src/modules/graph_intelligence/controllers/graph-projection.controller.ts:71` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:282` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:180` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:149` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `graph_intelligence.graph_edge_evidence` | ESCRIBE | CREA | DIRECTA | GraphProjectionController.upsertEdge → GraphProjectionService.upsertEdge → GraphProjectionRepository.createEvidence | `src/modules/graph_intelligence/repositories/graph-projection.repository.ts:431` |
| `graph_intelligence.graph_edge_evidence` | LEE | LEE | DIRECTA | GraphProjectionController.upsertEdge → GraphProjectionService.upsertEdge → GraphProjectionRepository.findEvidenceByHash | `src/modules/graph_intelligence/repositories/graph-projection.repository.ts:447` |
| `graph_intelligence.graph_edges` | ESCRIBE | ACTUALIZA | POR_TIPO | GraphProjectionController.upsertEdge → GraphProjectionService.upsertEdge | `src/modules/graph_intelligence/services/graph-projection.service.ts:233` |
| `graph_intelligence.graph_edges` | ESCRIBE | CREA | DIRECTA | GraphProjectionController.upsertEdge → GraphProjectionService.upsertEdge → GraphProjectionRepository.createEdge | `src/modules/graph_intelligence/repositories/graph-projection.repository.ts:371` |
| `graph_intelligence.graph_edges` | LEE | LEE | DIRECTA | GraphProjectionController.upsertEdge → GraphProjectionService.upsertEdge → GraphProjectionRepository.findEdgeBySourceForUpdate | `src/modules/graph_intelligence/repositories/graph-projection.repository.ts:341` |
| `graph_intelligence.graph_nodes` | LEE | LEE | DIRECTA | GraphProjectionController.upsertEdge → GraphProjectionService.upsertEdge → GraphProjectionRepository.findNodeById | `src/modules/graph_intelligence/repositories/graph-projection.repository.ts:174` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | GraphProjectionController.upsertEdge → GraphProjectionService.upsertEdge → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | GraphProjectionController.upsertEdge → GraphProjectionService.upsertEdge → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | GraphProjectionController.upsertEdge → GraphProjectionService.upsertEdge → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `GraphEdgeProjected` | `src/modules/graph_intelligence/services/graph-projection.service.ts:267` |

### Cuerpo — DTO `UpsertEdgeDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:276` |
| `fromNodeId` | `string` | Sí | formato uuid | `@IsUUID()` | Nodo origen, ya proyectado | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:283` |
| `toNodeId` | `string` | Sí | formato uuid | `@IsUUID()` | Nodo destino, ya proyectado | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:290` |
| `relationshipType` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:298` |
| `directionality` | `string` | No | valores: directed, undirected | `@IsOptional()` `@IsIn(DIRECTIONALITIES)` | — | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:306` |
| `sourceEntityType` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:314` |
| `sourceEntityId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:321` |
| `effectiveFrom` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | — | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:329` |
| `properties` | `object` | No | — | `@IsOptional()` `@IsObject()` | — | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:337` |
| `evidence` | `array<EdgeEvidenceDto>` | No | — | `@IsOptional()` `@IsArray()` `@ValidateNested({ each: true })` `@Type(() => EdgeEvidenceDto)` | — | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:347` |
| `evidence[].evidenceType` | `string` | No | valores: source_event, manual_assertion, inference, termination | `@IsIn(EVIDENCE_TYPES)` | — | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:225` |
| `evidence[].sourceReference` | `string` | No | longitud máxima 300 | `@IsOptional()` `@IsString()` `@MaxLength(300)` | — | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:234` |
| `evidence[].evidenceHash` | `string` | No | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Hash de la evidencia; deduplica el reenvío | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:245` |
| `evidence[].observedAt` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | — | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:253` |
| `evidence[].confidenceDelta` | `number` | No | mínimo -1; máximo 1 | `@IsNumber()` `@Min(-1)` `@Max(1)` | Cuánto sube o baja la confianza de la arista | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:266` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "fromNodeId": "00000000-0000-4000-8000-000000000001",
  "toNodeId": "00000000-0000-4000-8000-000000000001",
  "relationshipType": "valor-ejemplo",
  "sourceEntityType": "valor-ejemplo",
  "sourceEntityId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "fromNodeId": "00000000-0000-4000-8000-000000000001",
  "toNodeId": "00000000-0000-4000-8000-000000000001",
  "relationshipType": "valor-ejemplo",
  "directionality": "directed",
  "sourceEntityType": "valor-ejemplo",
  "sourceEntityId": "00000000-0000-4000-8000-000000000001",
  "effectiveFrom": "2026-07-31T12:00:00.000Z",
  "properties": {},
  "evidence": [
    {
      "evidenceType": "source_event",
      "sourceReference": "valor-ejemplo",
      "evidenceHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      "observedAt": "2026-07-31T12:00:00.000Z",
      "confidenceDelta": 1
    }
  ]
}
```

</details>

### Respuesta — `Promise<EdgeResponseDto>` · DTO `EdgeResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:358` |
| `relationshipType` | `string` | Sí | — | — | Valor de relationship type mantenido por la instancia. | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:364` |
| `confidenceScore` | `number` | Sí | — | — | Valor de confidence score mantenido por la instancia. | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:370` |
| `lifecycleState` | `string` | Sí | — | — | Valor de lifecycle state mantenido por la instancia. | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:376` |
| `evidenceAdded` | `number` | Sí | — | — | Evidencias nuevas añadidas; las repetidas se descartan | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:384` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Los dos extremos de la arista tienen que estar proyectados antes que ella.; PreconditionFailedException: Una arista no puede cruzar dos tenants. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/graph_intelligence.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 61 — Inteligencia de grafo (relaciones, referidos y riesgo) — etapa `UC-61-02`

---

## 11. POST /graph/projections/nodes/upsert

- **Origen:** CONTRATO
- **Nombre:** Proyectar un nodo y sus identificadores
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `GraphProjectionController.upsertNode` — `src/modules/graph_intelligence/controllers/graph-projection.controller.ts:50`

### Qué es y para qué sirve (negocio)

Proyectar un nodo y sus identificadores. Caso de uso UC-61-01: Proyectar nodo + identificadores. Dentro del módulo (descripción del modelo, en inglés): «Supports multi-hop relationship analysis for referrals, organizational networks, counterparties, fraud, delegated access and lineage.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/graph_intelligence/README.md:65`) · MODELO (`Mantra Core Health Context/modules/diagram_61_graph_intelligence.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /graph/projections/nodes/upsert` la atiende `GraphProjectionController.upsertNode` (src/modules/graph_intelligence/controllers/graph-projection.controller.ts:50). Exige sesión con alguno de los roles SYSTEM, GRAPH_PROJECTION_WORKER, PLATFORM_ADMIN. Valida el cuerpo como `UpsertNodeDto` (13 campos, 6 obligatorios). Delega en `GraphProjectionService.upsertNode`. Crea filas en graph_intelligence.graph_node_identifiers, graph_intelligence.graph_nodes. Actualiza graph_intelligence.graph_nodes. Lee graph_intelligence.graph_node_identifiers, graph_intelligence.graph_nodes.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, GRAPH_PROJECTION_WORKER, PLATFORM_ADMIN | `src/modules/graph_intelligence/controllers/graph-projection.controller.ts:50` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:282` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:180` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:149` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `graph_intelligence.graph_node_identifiers` | ESCRIBE | CREA | DIRECTA | GraphProjectionController.upsertNode → GraphProjectionService.upsertNode → GraphProjectionRepository.createIdentifier | `src/modules/graph_intelligence/repositories/graph-projection.repository.ts:289` |
| `graph_intelligence.graph_node_identifiers` | LEE | LEE | DIRECTA | GraphProjectionController.upsertNode → GraphProjectionService.upsertNode → GraphProjectionRepository.findIdentifier | `src/modules/graph_intelligence/repositories/graph-projection.repository.ts:250` |
| `graph_intelligence.graph_nodes` | ESCRIBE | ACTUALIZA | POR_TIPO | GraphProjectionController.upsertNode → GraphProjectionService.upsertNode | `src/modules/graph_intelligence/services/graph-projection.service.ts:119` |
| `graph_intelligence.graph_nodes` | ESCRIBE | CREA | DIRECTA | GraphProjectionController.upsertNode → GraphProjectionService.upsertNode → GraphProjectionRepository.createNode | `src/modules/graph_intelligence/repositories/graph-projection.repository.ts:185` |
| `graph_intelligence.graph_nodes` | LEE | LEE | DIRECTA | GraphProjectionController.upsertNode → GraphProjectionService.upsertNode → GraphProjectionRepository.findNodeBySourceForUpdate | `src/modules/graph_intelligence/repositories/graph-projection.repository.ts:159` |

### Cuerpo — DTO `UpsertNodeDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:89` |
| `nodeType` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:97` |
| `sourceEntityType` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Tabla canónica de la que se proyecta | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:108` |
| `sourceEntityId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:115` |
| `sourceVersion` | `string` | Sí | — | `@IsNumberString({ no_symbols: true })` | Versión canónica del evento; cadena por ser bigint. Un valor menor no se aplica. | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:125` |
| `displayLabelRedacted` | `string` | Sí | longitud máxima 300 | `@IsString()` `@MaxLength(300)` | Etiqueta ya redactada; nunca el nombre completo | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:136` |
| `properties` | `object` | No | — | `@IsOptional()` `@IsObject()` | — | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:144` |
| `securityLabels` | `array<string>` | No | — | `@IsOptional()` `@IsArray()` `@IsString({ each: true })` | — | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:153` |
| `identifiers` | `array<NodeIdentifierDto>` | No | — | `@IsOptional()` `@IsArray()` `@ValidateNested({ each: true })` `@Type(() => NodeIdentifierDto)` | — | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:163` |
| `identifiers[].identifierSystem` | `string` | No | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Sistema del identificador, p. ej. `DNI` | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:51` |
| `identifiers[].identifierValueHash` | `string` | No | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Hash del identificador. **Nunca el valor en claro.** | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:62` |
| `identifiers[].identifierType` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:71` |
| `identifiers[].isPrimary` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | — | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:79` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "nodeType": "valor-ejemplo",
  "sourceEntityType": "valor-ejemplo",
  "sourceEntityId": "00000000-0000-4000-8000-000000000001",
  "sourceVersion": "valor-ejemplo",
  "displayLabelRedacted": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "nodeType": "valor-ejemplo",
  "sourceEntityType": "valor-ejemplo",
  "sourceEntityId": "00000000-0000-4000-8000-000000000001",
  "sourceVersion": "valor-ejemplo",
  "displayLabelRedacted": "valor-ejemplo",
  "properties": {},
  "securityLabels": [
    "valor-ejemplo"
  ],
  "identifiers": [
    {
      "identifierSystem": "valor-ejemplo",
      "identifierValueHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      "identifierType": "valor-ejemplo",
      "isPrimary": false
    }
  ]
}
```

</details>

### Respuesta — `Promise<NodeResponseDto>` · DTO `NodeResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:174` |
| `nodeType` | `string` | Sí | — | — | Valor de node type mantenido por la instancia. | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:180` |
| `sourceVersion` | `string` | Sí | — | — | Valor de source version mantenido por la instancia. | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:186` |
| `lifecycleState` | `string` | Sí | — | — | Valor de lifecycle state mantenido por la instancia. | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:192` |
| `identifiersAdded` | `number` | Sí | — | — | Identificadores nuevos añadidos en esta llamada | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:200` |
| `stale` | `boolean` | Sí | — | — | Verdadero si el evento traía una versión anterior y se descartó | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:209` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/graph_intelligence.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 61 — Inteligencia de grafo (relaciones, referidos y riesgo) — etapa `UC-61-01`

---

## 12. POST /graph/projections/reconcile

- **Origen:** CONTRATO
- **Nombre:** Reconciliar la versión canónica del nodo
- **Bloque:** Datos y NoSQL
- **Riesgo:** ALTO — Borra filas
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `GraphProjectionController.reconcileSourceVersion` — `src/modules/graph_intelligence/controllers/graph-projection.controller.ts:92`

### Qué es y para qué sirve (negocio)

Reconciliar la versión canónica del nodo. Caso de uso UC-61-12: Reconciliar versión fuente. Dentro del módulo (descripción del modelo, en inglés): «Supports multi-hop relationship analysis for referrals, organizational networks, counterparties, fraud, delegated access and lineage.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/graph_intelligence/README.md:76`) · MODELO (`Mantra Core Health Context/modules/diagram_61_graph_intelligence.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /graph/projections/reconcile` la atiende `GraphProjectionController.reconcileSourceVersion` (src/modules/graph_intelligence/controllers/graph-projection.controller.ts:92). Exige sesión con alguno de los roles SYSTEM, GRAPH_PROJECTION_WORKER, PLATFORM_ADMIN. Valida el cuerpo como `ReconcileSourceVersionDto` (8 campos, 4 obligatorios). Delega en `GraphProjectionService.reconcileSourceVersion`. Crea filas en graph_intelligence.graph_deletion_jobs. Actualiza graph_intelligence.graph_nodes, graph_intelligence.graph_risk_scores. Borra de graph_intelligence.graph_path_cache. Lee graph_intelligence.graph_deletion_jobs, graph_intelligence.graph_nodes, graph_intelligence.graph_path_cache, graph_intelligence.graph_risk_scores.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, GRAPH_PROJECTION_WORKER, PLATFORM_ADMIN | `src/modules/graph_intelligence/controllers/graph-projection.controller.ts:92` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:282` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:180` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:149` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `graph_intelligence.graph_deletion_jobs` | ESCRIBE | CREA | DIRECTA | GraphProjectionController.reconcileSourceVersion → GraphProjectionService.reconcileSourceVersion → GraphAnalyticsRepository.createDeletionJob | `src/modules/graph_intelligence/repositories/graph-analytics.repository.ts:576` |
| `graph_intelligence.graph_deletion_jobs` | LEE | LEE | DIRECTA | GraphProjectionController.reconcileSourceVersion → GraphProjectionService.reconcileSourceVersion → GraphAnalyticsRepository.findActiveDeletionJob | `src/modules/graph_intelligence/repositories/graph-analytics.repository.ts:540` |
| `graph_intelligence.graph_nodes` | ESCRIBE | ACTUALIZA | POR_TIPO | GraphProjectionController.reconcileSourceVersion → GraphProjectionService.reconcileSourceVersion | `src/modules/graph_intelligence/services/graph-projection.service.ts:629` |
| `graph_intelligence.graph_nodes` | LEE | LEE | DIRECTA | GraphProjectionController.reconcileSourceVersion → GraphProjectionService.reconcileSourceVersion → GraphProjectionRepository.findNodeBySourceForUpdate | `src/modules/graph_intelligence/repositories/graph-projection.repository.ts:159` |
| `graph_intelligence.graph_path_cache` | BORRA | BORRA | DIRECTA | GraphProjectionController.reconcileSourceVersion → GraphProjectionService.reconcileSourceVersion → GraphAnalyticsRepository.deleteCachedPathsTouchingNodes | `src/modules/graph_intelligence/repositories/graph-analytics.repository.ts:235` |
| `graph_intelligence.graph_path_cache` | LEE | LEE | DIRECTA | GraphProjectionController.reconcileSourceVersion → GraphProjectionService.reconcileSourceVersion → GraphAnalyticsRepository.deleteCachedPathsTouchingNodes | `src/modules/graph_intelligence/repositories/graph-analytics.repository.ts:227` |
| `graph_intelligence.graph_risk_scores` | ESCRIBE | ACTUALIZA | POR_TIPO | GraphProjectionController.reconcileSourceVersion → GraphProjectionService.reconcileSourceVersion | `src/modules/graph_intelligence/services/graph-projection.service.ts:649` |
| `graph_intelligence.graph_risk_scores` | LEE | LEE | DIRECTA | GraphProjectionController.reconcileSourceVersion → GraphProjectionService.reconcileSourceVersion → GraphAnalyticsRepository.findRiskScoresByNodesForUpdate | `src/modules/graph_intelligence/repositories/graph-analytics.repository.ts:413` |

### Cuerpo — DTO `ReconcileSourceVersionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:1439` |
| `sourceEntityType` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:1447` |
| `sourceEntityId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:1454` |
| `sourceVersion` | `string` | Sí | — | `@IsNumberString({ no_symbols: true })` | Versión canónica entrante; cadena por ser bigint | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:1463` |
| `deleted` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Si el evento es un borrado; crea el job de purga | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:1474` |
| `displayLabelRedacted` | `string` | No | longitud máxima 300 | `@IsOptional()` `@IsString()` `@MaxLength(300)` | — | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:1483` |
| `properties` | `object` | No | — | `@IsOptional()` `@IsObject()` | — | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:1491` |
| `securityLabels` | `array<string>` | No | — | `@IsOptional()` `@IsArray()` `@IsString({ each: true })` | — | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:1500` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "sourceEntityType": "valor-ejemplo",
  "sourceEntityId": "00000000-0000-4000-8000-000000000001",
  "sourceVersion": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "sourceEntityType": "valor-ejemplo",
  "sourceEntityId": "00000000-0000-4000-8000-000000000001",
  "sourceVersion": "valor-ejemplo",
  "deleted": false,
  "displayLabelRedacted": "valor-ejemplo",
  "properties": {},
  "securityLabels": [
    "valor-ejemplo"
  ]
}
```

</details>

### Respuesta — `Promise<ReconcileResponseDto>` · DTO `ReconcileResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `batchId` | `string` | Sí | formato uuid | — | Identificador asociado a batch. | sin fuente |
| `itemsProcessed` | `number` | Sí | — | — | Items procesados | sin fuente |
| `discrepancies` | `number` | Sí | — | — | Items marcados como discrepancia | sin fuente |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: El nodo no está proyectado. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/graph_intelligence.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 61 — Inteligencia de grafo (relaciones, referidos y riesgo) — etapa `UC-61-12`

---

## 13. PATCH /graph/rule-hits/{id}

- **Origen:** CONTRATO
- **Nombre:** Mover el hallazgo por su triage
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `GraphQueryController.triageRuleHit` — `src/modules/graph_intelligence/controllers/graph-query.controller.ts:218`

### Qué es y para qué sirve (negocio)

Mover el hallazgo por su triage. Caso de uso UC-61-09: Triage del hallazgo. Dentro del módulo (descripción del modelo, en inglés): «Supports multi-hop relationship analysis for referrals, organizational networks, counterparties, fraud, delegated access and lineage.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/graph_intelligence/README.md:73`) · MODELO (`Mantra Core Health Context/modules/diagram_61_graph_intelligence.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`PATCH /graph/rule-hits/{id}` la atiende `GraphQueryController.triageRuleHit` (src/modules/graph_intelligence/controllers/graph-query.controller.ts:218). Exige sesión con alguno de los roles COMPLIANCE_OFFICER, GRAPH_ANALYST, PLATFORM_ADMIN. Valida el cuerpo como `TriageRuleHitDto` (2 campos, 1 obligatorio). Delega en `GraphAnalyticsService.triageRuleHit`. Crea filas en messaging.domain_events, messaging.outbox_messages. Lee graph_intelligence.graph_rule_hits, messaging.outbox_messages. Publica GraphRuleHitResolved.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: COMPLIANCE_OFFICER, GRAPH_ANALYST, PLATFORM_ADMIN | `src/modules/graph_intelligence/controllers/graph-query.controller.ts:218` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:282` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/graph_intelligence/controllers/graph-query.controller.ts:218` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:180` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:149` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `graph_intelligence.graph_rule_hits` | LEE | LEE | DIRECTA | GraphQueryController.triageRuleHit → GraphAnalyticsService.triageRuleHit → GraphAnalyticsRepository.findHitForUpdate | `src/modules/graph_intelligence/repositories/graph-analytics.repository.ts:523` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | GraphQueryController.triageRuleHit → GraphAnalyticsService.triageRuleHit → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | GraphQueryController.triageRuleHit → GraphAnalyticsService.triageRuleHit → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | GraphQueryController.triageRuleHit → GraphAnalyticsService.triageRuleHit → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `GraphRuleHitResolved` | `src/modules/graph_intelligence/services/graph-analytics.service.ts:401` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `TriageRuleHitDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `status` | `string` | Sí | valores: open, in_review, resolved, dismissed | `@IsIn(HIT_STATUSES)` | — | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:1204` |
| `resolutionNote` | `string` | No | longitud máxima 1000 | `@IsOptional()` `@IsString()` `@MaxLength(1000)` | Desenlace; queda en el evento publicado | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:1216` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "status": "open"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "status": "open",
  "resolutionNote": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<RuleHitResponseDto>` · DTO `RuleHitResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:1227` |
| `status` | `string` | Sí | — | — | Valor de status mantenido por la instancia. | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:1233` |
| `resolvedAt` | `string` | No | formato date-time | — | Valor de resolved at mantenido por la instancia. | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:1239` |
| `unchanged` | `boolean` | Sí | — | — | Verdadero si el hallazgo ya estaba en ese estado | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:1247` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Esa transición del hallazgo no está permitida. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/graph_intelligence.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 61 — Inteligencia de grafo (relaciones, referidos y riesgo) — etapa `UC-61-09`

---

## 14. POST /graph/rules/{id}/evaluate

- **Origen:** CONTRATO
- **Nombre:** Registrar los hallazgos de una regla
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `GraphQueryController.evaluateRule` — `src/modules/graph_intelligence/controllers/graph-query.controller.ts:191`

### Qué es y para qué sirve (negocio)

Registrar los hallazgos de una regla. Caso de uso UC-61-08: Hallazgos de regla. Dentro del módulo (descripción del modelo, en inglés): «Supports multi-hop relationship analysis for referrals, organizational networks, counterparties, fraud, delegated access and lineage.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/graph_intelligence/README.md:72`) · MODELO (`Mantra Core Health Context/modules/diagram_61_graph_intelligence.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /graph/rules/{id}/evaluate` la atiende `GraphQueryController.evaluateRule` (src/modules/graph_intelligence/controllers/graph-query.controller.ts:191). Exige sesión con alguno de los roles SYSTEM, GRAPH_ANALYTICS_WORKER, COMPLIANCE_OFFICER, PLATFORM_ADMIN. Valida el cuerpo como `GraphIntelligenceEvaluateRuleDto` (6 campos, 4 obligatorios). Delega en `GraphAnalyticsService.evaluateRule`. Crea filas en graph_intelligence.graph_rule_hits, messaging.domain_events, messaging.outbox_messages. Lee graph_intelligence.graph_access_scopes, graph_intelligence.graph_rule_definitions, graph_intelligence.graph_rule_hits, messaging.outbox_messages. Publica GraphRuleHitDetected.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, GRAPH_ANALYTICS_WORKER, COMPLIANCE_OFFICER, PLATFORM_ADMIN | `src/modules/graph_intelligence/controllers/graph-query.controller.ts:191` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:282` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/graph_intelligence/controllers/graph-query.controller.ts:191` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:180` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:149` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `graph_intelligence.graph_access_scopes` | LEE | LEE | DIRECTA | GraphQueryController.evaluateRule → GraphAnalyticsService.evaluateRule → GraphAnalyticsRepository.findScopeByCodeForUpdate | `src/modules/graph_intelligence/repositories/graph-analytics.repository.ts:35` |
| `graph_intelligence.graph_rule_definitions` | LEE | LEE | DIRECTA | GraphQueryController.evaluateRule → GraphAnalyticsService.evaluateRule → GraphAnalyticsRepository.findRuleDefinitionById | `src/modules/graph_intelligence/repositories/graph-analytics.repository.ts:448` |
| `graph_intelligence.graph_rule_hits` | ESCRIBE | CREA | DIRECTA | GraphQueryController.evaluateRule → GraphAnalyticsService.evaluateRule → GraphAnalyticsRepository.createHit | `src/modules/graph_intelligence/repositories/graph-analytics.repository.ts:505` |
| `graph_intelligence.graph_rule_hits` | LEE | LEE | DIRECTA | GraphQueryController.evaluateRule → GraphAnalyticsService.evaluateRule → GraphAnalyticsRepository.findLiveHit | `src/modules/graph_intelligence/repositories/graph-analytics.repository.ts:462` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | GraphQueryController.evaluateRule → GraphAnalyticsService.evaluateRule → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | GraphQueryController.evaluateRule → GraphAnalyticsService.evaluateRule → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | GraphQueryController.evaluateRule → GraphAnalyticsService.evaluateRule → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `GraphRuleHitDetected` | `src/modules/graph_intelligence/services/graph-analytics.service.ts:315` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `GraphIntelligenceEvaluateRuleDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:1132` |
| `scopeCode` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Alcance bajo el que se evaluó el traversal | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:1143` |
| `matches` | `array<RuleMatchDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => RuleMatchDto)` | — | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:1153` |
| `matches[].primaryNodeId` | `string` | Sí | formato uuid | `@IsUUID()` | Nodo sobre el que se dispara el patrón | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:1099` |
| `matches[].relatedNodeIds` | `array<string>` | No | formato uuid | `@IsOptional()` `@IsArray()` `@IsUUID('4', { each: true })` | — | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:1108` |
| `matches[].evidenceEdgeIds` | `array<string>` | No | formato uuid | `@IsOptional()` `@IsArray()` `@IsUUID('4', { each: true })` | Aristas que sustentan el patrón | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:1121` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "scopeCode": "CODIGO_EJEMPLO",
  "matches": [
    {
      "primaryNodeId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "scopeCode": "CODIGO_EJEMPLO",
  "matches": [
    {
      "primaryNodeId": "00000000-0000-4000-8000-000000000001",
      "relatedNodeIds": [
        "00000000-0000-4000-8000-000000000001"
      ],
      "evidenceEdgeIds": [
        "00000000-0000-4000-8000-000000000001"
      ]
    }
  ]
}
```

</details>

### Respuesta — `Promise<EvaluateRuleResponseDto>` · DTO `EvaluateRuleResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `graphRuleDefinitionId` | `string` | Sí | formato uuid | — | Identificador asociado a graph rule definition. | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:1164` |
| `severity` | `string` | Sí | — | — | Valor de severity mantenido por la instancia. | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:1170` |
| `hitsOpened` | `number` | Sí | — | — | Hallazgos nuevos abiertos | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:1176` |
| `duplicatesSkipped` | `number` | Sí | — | — | Coincidencias descartadas por tener ya un hallazgo vivo | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:1184` |
| `hitIds` | `array<string>` | Sí | formato uuid | — | Valor de hit ids mantenido por la instancia. | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:1190` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La definición de regla no está activa.; PreconditionFailedException: La regla tiene que evaluarse bajo un alcance de acceso activo. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/graph_intelligence.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 61 — Inteligencia de grafo (relaciones, referidos y riesgo) — etapa `UC-61-08`

---

## 15. POST /graph/traverse

- **Origen:** CONTRATO
- **Nombre:** Recorrer el grafo desde un nodo
- **Bloque:** Datos y NoSQL
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `GraphQueryController.traverse` — `src/modules/graph_intelligence/controllers/graph-query.controller.ts:101`

### Qué es y para qué sirve (negocio)

Recorrer el grafo desde un nodo. Caso de uso UC-61-05: Recorrido y rutas con scoping. Dentro del módulo (descripción del modelo, en inglés): «Supports multi-hop relationship analysis for referrals, organizational networks, counterparties, fraud, delegated access and lineage.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/graph_intelligence/README.md:69`) · MODELO (`Mantra Core Health Context/modules/diagram_61_graph_intelligence.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /graph/traverse` la atiende `GraphQueryController.traverse` (src/modules/graph_intelligence/controllers/graph-query.controller.ts:101). Exige sesión con alguno de los roles GRAPH_ANALYST, API_CONSUMER, COMPLIANCE_OFFICER, PLATFORM_ADMIN. Valida el cuerpo como `TraverseDto` (7 campos, 4 obligatorios). Delega en `GraphTraversalService.traverse`. Lee consent.consents, consent.privacy_restrictions, consent.processing_purposes, graph_intelligence.graph_access_scopes, graph_intelligence.graph_edges, graph_intelligence.graph_nodes, profiles.patient_profiles.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: GRAPH_ANALYST, API_CONSUMER, COMPLIANCE_OFFICER, PLATFORM_ADMIN | `src/modules/graph_intelligence/controllers/graph-query.controller.ts:101` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:282` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:180` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:149` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `consent.consents` | LEE | LEE | DIRECTA | GraphQueryController.traverse → GraphTraversalService.traverse → GraphTraversalService.requirePatientConsent → GraphConsentGate.assertAllowed | `src/modules/graph_intelligence/services/graph-consent-gate.service.ts:64` |
| `consent.privacy_restrictions` | LEE | LEE | DIRECTA | GraphQueryController.traverse → GraphTraversalService.traverse → GraphTraversalService.requirePatientConsent → GraphConsentGate.assertAllowed | `src/modules/graph_intelligence/services/graph-consent-gate.service.ts:78` |
| `consent.processing_purposes` | LEE | LEE | DIRECTA | GraphQueryController.traverse → GraphTraversalService.traverse → GraphTraversalService.requirePatientConsent → GraphConsentGate.assertAllowed | `src/modules/graph_intelligence/services/graph-consent-gate.service.ts:59` |
| `graph_intelligence.graph_access_scopes` | LEE | LEE | DIRECTA | GraphQueryController.traverse → GraphTraversalService.traverse → GraphTraversalService.requireActiveScope → GraphAnalyticsRepository.findScopeByCodeForUpdate | `src/modules/graph_intelligence/repositories/graph-analytics.repository.ts:35` |
| `graph_intelligence.graph_edges` | LEE | LEE | DIRECTA | GraphQueryController.traverse → GraphTraversalService.traverse → GraphTraversalService.walk → GraphProjectionRepository.findActiveEdgesFrom | `src/modules/graph_intelligence/repositories/graph-projection.repository.ts:395` |
| `graph_intelligence.graph_nodes` | LEE | LEE | DIRECTA | GraphQueryController.traverse → GraphTraversalService.traverse → GraphTraversalService.requireStartNode → GraphProjectionRepository.findNodeById | `src/modules/graph_intelligence/repositories/graph-projection.repository.ts:174` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | GraphQueryController.traverse → GraphTraversalService.traverse → GraphTraversalService.requireStartPatientConsent → GraphTraversalService.patientIdsOf → GraphProjectionRepository.findPatientProfileIds | `src/modules/graph_intelligence/repositories/graph-projection.repository.ts:219` |

### Cuerpo — DTO `TraverseDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:680` |
| `scopeCode` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Alcance de acceso bajo el que se recorre | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:691` |
| `startNodeId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:698` |
| `purposeOfUse` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:706` |
| `relationshipFilter` | `array<string>` | No | — | `@IsOptional()` `@IsArray()` `@IsString({ each: true })` | Filtro de tipos de relación | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:718` |
| `maxHops` | `number` | No | mínimo 1; máximo 6 | `@IsOptional()` `@IsInt()` `@Min(1)` `@Max(MAX_HOPS_CEILING)` | — | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:728` |
| `patientProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Paciente del contexto; obligatorio si el alcance lo exige | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:739` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "scopeCode": "CODIGO_EJEMPLO",
  "startNodeId": "00000000-0000-4000-8000-000000000001",
  "purposeOfUse": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "scopeCode": "CODIGO_EJEMPLO",
  "startNodeId": "00000000-0000-4000-8000-000000000001",
  "purposeOfUse": "valor-ejemplo",
  "relationshipFilter": [
    "valor-ejemplo"
  ],
  "maxHops": 1,
  "patientProfileId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<TraverseResponseDto>` · DTO `TraverseResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `startNodeId` | `string` | Sí | formato uuid | — | Identificador asociado a start node. | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:789` |
| `nodes` | `array<VisitedNodeDto>` | Sí | — | — | Valor de nodes mantenido por la instancia. | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:795` |
| `nodes[].nodeId` | `string` | Sí | formato uuid | — | Identificador asociado a node. | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:760` |
| `nodes[].nodeType` | `string` | Sí | — | — | Valor de node type mantenido por la instancia. | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:766` |
| `nodes[].displayLabelRedacted` | `string` | Sí | — | — | Valor de display label redacted mantenido por la instancia. | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:772` |
| `nodes[].depth` | `number` | Sí | — | — | Saltos desde el nodo de partida | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:778` |
| `edgeCount` | `number` | Sí | — | — | Aristas recorridas | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:801` |
| `depthReached` | `number` | Sí | — | — | Profundidad efectiva alcanzada | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:807` |
| `truncated` | `boolean` | Sí | — | — | Verdadero si se alcanzó el tope de nodos y hay más | `src/modules/graph_intelligence/dto/graph-intelligence.dto.ts:815` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Alcance de acceso no encontrado.; ResourceNotFoundException: Nodo de partida no encontrado. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El alcance de acceso no está activo.; PreconditionFailedException: El alcance no admite ese propósito de uso.; PreconditionFailedException: El alcance exige declarar el paciente del contexto.; PreconditionFailedException: El nodo de partida queda fuera del alcance de acceso. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.FORBIDDEN} |

El árbol de decisión completo está en [flujos](../flujos/graph_intelligence.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 61 — Inteligencia de grafo (relaciones, referidos y riesgo) — etapa `UC-61-05`

---

