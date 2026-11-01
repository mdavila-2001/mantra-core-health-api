<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `read_models`

- **Bloque:** Auditoría y Reporting (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:36`)
- **Operaciones:** 15 (15 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 1 · MEDIO 9 · BAJO 5
- **Tablas distintas que tocan:** 35
- **Respuestas de error y detalle contractual:** `openapi/endpoints/read-models.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | POST | `/portals/{portalCode}/routes/{routeCode}/views` | Publicar el contrato de una vista de página | MEDIO | 12 | SECURITY_ADMIN |
| 2 | GET | `/portals/{portalCode}/routes/{routeCode}/views/{viewCode}/actions` | Derivar available_actions_json (estado + permiso + purpose) | BAJO | 25 | sesión (sin roles) |
| 3 | GET | `/portals/{portalCode}/routes/{routeCode}/views/{viewCode}/data` | Servir el read model al frontend (consent-aware, masking heredado) | BAJO | 30 | sesión (sin roles) |
| 4 | GET | `/public/{slug}` | Servir una proyección pública por slug | BAJO | 1 | pública |
| 5 | GET | `/public/directory` | Servir el directorio público (solo campos aprobados) | BAJO | 1 | pública |
| 6 | POST | `/read-models/{definitionId}/backfill` | Backfill inicial de una nueva materialized view | MEDIO | 2 | SECURITY_ADMIN |
| 7 | POST | `/read-models/{definitionId}/invalidate` | Invalidar y recomputar el read model tras cambio upstream | MEDIO | 2 | SECURITY_ADMIN |
| 8 | POST | `/read-models/{definitionId}/reconcile` | Reconciliar read model divergente contra la fuente canónica | MEDIO | 2 | SYSTEM, SECURITY_ADMIN |
| 9 | POST | `/read-models/{definitionId}/refresh` | Refrescar la materialized view (REFRESH CONCURRENTLY, manual) | MEDIO | 2 | SECURITY_ADMIN |
| 10 | POST | `/read-models/definitions` | Registrar y publicar un contrato de read model versionado | MEDIO | 3 | SECURITY_ADMIN |
| 11 | DELETE | `/read-models/definitions/{id}` | Retirar una versión de read model (guarda de FK) | MEDIO | 3 | SECURITY_ADMIN |
| 12 | POST | `/read-models/definitions/{id}/deprecate` | Deprecar una versión de read model | MEDIO | 2 | SECURITY_ADMIN |
| 13 | POST | `/read-models/definitions/{schema}/{object}/versions` | Versionar el esquema de un read model | MEDIO | 3 | SECURITY_ADMIN |
| 14 | GET | `/read-models/health` | Detectar y reportar staleness/degradación de las MV | BAJO | 2 | SYSTEM, SECURITY_ADMIN |
| 15 | PUT | `/views/{frontendPageViewId}/preferences` | Guardar preferencias de vista del usuario | ALTO | 5 | sesión (sin roles) |

---

## 1. POST /portals/{portalCode}/routes/{routeCode}/views

- **Origen:** CONTRATO
- **Nombre:** Publicar el contrato de una vista de página
- **Bloque:** Auditoría y Reporting
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `FrontendViewsController.publishViewContract` — `src/modules/read_models/controllers/frontend-views.controller.ts:53`

### Qué es y para qué sirve (negocio)

Publicar el contrato de una vista de página. Caso de uso UC-30-02: Publicar contrato de vista (upsert portal/route + view + hijos). Dentro del módulo (descripción del modelo, en inglés): «Provides frontend-ready, permission-aware read contracts.» Dominio: Auditoría y Reporting.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/read_models/README.md:84`) · MODELO (`Mantra Core Health Context/modules/diagram_30_read_models.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:36`)

### Cómo se atiende (sistema)

`POST /portals/{portalCode}/routes/{routeCode}/views` la atiende `FrontendViewsController.publishViewContract` (src/modules/read_models/controllers/frontend-views.controller.ts:53). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `PublishViewContractDto` (50 campos, 13 obligatorios). Delega en `FrontendViewsService.publishViewContract`. Crea filas en read_models.frontend_page_views, read_models.frontend_routes, read_models.frontend_view_actions, read_models.frontend_view_fields, read_models.frontend_view_kpis, read_models.frontend_view_sort_options, read_models.frontend_view_states, read_models.portal_surfaces. Lee read_models.frontend_page_views, read_models.frontend_routes, read_models.portal_surfaces, read_models.read_model_definitions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/read_models/controllers/frontend-views.controller.ts:53` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `read_models.frontend_page_views` | ESCRIBE | CREA | DIRECTA | FrontendViewsController.publishViewContract → FrontendViewsService.publishViewContract → FrontendPageViewsRepository.create | `src/modules/read_models/repositories/frontend-page-views.repository.ts:117` |
| `read_models.frontend_page_views` | LEE | LEE | DIRECTA | FrontendViewsController.publishViewContract → FrontendViewsService.publishViewContract → FrontendPageViewsRepository.findByRouteAndCode | `src/modules/read_models/repositories/frontend-page-views.repository.ts:97` |
| `read_models.frontend_routes` | ESCRIBE | CREA | DIRECTA | FrontendViewsController.publishViewContract → FrontendViewsService.publishViewContract → FrontendRoutesRepository.create | `src/modules/read_models/repositories/frontend-routes.repository.ts:98` |
| `read_models.frontend_routes` | LEE | LEE | DIRECTA | FrontendViewsController.publishViewContract → FrontendViewsService.publishViewContract → FrontendRoutesRepository.findBySurfaceAndCode | `src/modules/read_models/repositories/frontend-routes.repository.ts:86` |
| `read_models.frontend_view_actions` | ESCRIBE | CREA | DIRECTA | FrontendViewsController.publishViewContract → FrontendViewsService.publishViewContract → FrontendViewChildrenRepository.createAction | `src/modules/read_models/repositories/frontend-view-children.repository.ts:501` |
| `read_models.frontend_view_fields` | ESCRIBE | CREA | DIRECTA | FrontendViewsController.publishViewContract → FrontendViewsService.publishViewContract → FrontendViewChildrenRepository.createField | `src/modules/read_models/repositories/frontend-view-children.repository.ts:450` |
| `read_models.frontend_view_kpis` | ESCRIBE | CREA | DIRECTA | FrontendViewsController.publishViewContract → FrontendViewsService.publishViewContract → FrontendViewChildrenRepository.createKpi | `src/modules/read_models/repositories/frontend-view-children.repository.ts:517` |
| `read_models.frontend_view_sort_options` | ESCRIBE | CREA | DIRECTA | FrontendViewsController.publishViewContract → FrontendViewsService.publishViewContract → FrontendViewChildrenRepository.createSortOption | `src/modules/read_models/repositories/frontend-view-children.repository.ts:485` |
| `read_models.frontend_view_states` | ESCRIBE | CREA | DIRECTA | FrontendViewsController.publishViewContract → FrontendViewsService.publishViewContract → FrontendViewChildrenRepository.createState | `src/modules/read_models/repositories/frontend-view-children.repository.ts:533` |
| `read_models.portal_surfaces` | ESCRIBE | CREA | DIRECTA | FrontendViewsController.publishViewContract → FrontendViewsService.publishViewContract → PortalSurfacesRepository.create | `src/modules/read_models/repositories/portal-surfaces.repository.ts:76` |
| `read_models.portal_surfaces` | LEE | LEE | DIRECTA | FrontendViewsController.publishViewContract → FrontendViewsService.publishViewContract → PortalSurfacesRepository.findByCode | `src/modules/read_models/repositories/portal-surfaces.repository.ts:64` |
| `read_models.read_model_definitions` | LEE | LEE | DIRECTA | FrontendViewsController.publishViewContract → FrontendViewsService.publishViewContract → ReadModelDefinitionsRepository.findById | `src/modules/read_models/repositories/read-model-definitions.repository.ts:99` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `portalCode` | path | Sí | `string` | — |
| `routeCode` | path | Sí | `string` | — |

### Cuerpo — DTO `PublishViewContractDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `portalName` | `string` | Sí | longitud mínima 1; longitud máxima 200 | `@IsString()` `@MinLength(1)` `@MaxLength(200)` | Nombre de la superficie de portal | `src/modules/read_models/dto/publish-view-contract.dto.ts:355` |
| `portalType` | `string` | Sí | valores: INTERNAL, PUBLIC | `@IsIn(['INTERNAL', 'PUBLIC'])` | Tipo de portal | `src/modules/read_models/dto/publish-view-contract.dto.ts:362` |
| `routePattern` | `string` | Sí | longitud mínima 1; longitud máxima 300 | `@IsString()` `@MinLength(1)` `@MaxLength(300)` | Patrón de la ruta | `src/modules/read_models/dto/publish-view-contract.dto.ts:372` |
| `pageTitle` | `string` | Sí | longitud mínima 1; longitud máxima 200 | `@IsString()` `@MinLength(1)` `@MaxLength(200)` | Título de la página | `src/modules/read_models/dto/publish-view-contract.dto.ts:381` |
| `requiresPatientContext` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Requiere contexto de paciente | `src/modules/read_models/dto/publish-view-contract.dto.ts:389` |
| `requiresTenantContext` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Requiere contexto de tenant | `src/modules/read_models/dto/publish-view-contract.dto.ts:397` |
| `readModelDefinitionId` | `string` | Sí | formato uuid | `@IsUUID()` | Definición de read model ACTIVE a servir | `src/modules/read_models/dto/publish-view-contract.dto.ts:408` |
| `viewCode` | `string` | Sí | longitud mínima 1; longitud máxima 128 | `@IsString()` `@MinLength(1)` `@MaxLength(128)` | Código de la vista | `src/modules/read_models/dto/publish-view-contract.dto.ts:417` |
| `viewType` | `string` | Sí | valores: TABLE, DASHBOARD, DETAIL | `@IsIn(['TABLE', 'DASHBOARD', 'DETAIL'])` | Tipo de vista | `src/modules/read_models/dto/publish-view-contract.dto.ts:427` |
| `title` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Título de la vista | `src/modules/read_models/dto/publish-view-contract.dto.ts:436` |
| `supportsCursorPagination` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Soporta paginación por cursor | `src/modules/read_models/dto/publish-view-contract.dto.ts:444` |
| `supportsExport` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Soporta export | `src/modules/read_models/dto/publish-view-contract.dto.ts:452` |
| `fields` | `array<ViewFieldInputDto>` | Sí | — | `@IsArray()` `@ArrayNotEmpty()` `@ValidateNested({ each: true })` `@Type(() => ViewFieldInputDto)` | Campos de la vista | `src/modules/read_models/dto/publish-view-contract.dto.ts:463` |
| `fields[].fieldCode` | `string` | Sí | longitud mínima 1; longitud máxima 128 | `@IsString()` `@MinLength(1)` `@MaxLength(128)` | Código del campo | `src/modules/read_models/dto/publish-view-contract.dto.ts:43` |
| `fields[].sourceColumn` | `string` | Sí | longitud mínima 1; longitud máxima 128 | `@IsString()` `@MinLength(1)` `@MaxLength(128)` | Columna origen del read model | `src/modules/read_models/dto/publish-view-contract.dto.ts:55` |
| `fields[].label` | `string` | Sí | longitud mínima 1; longitud máxima 200 | `@IsString()` `@MinLength(1)` `@MaxLength(200)` | Etiqueta visible | `src/modules/read_models/dto/publish-view-contract.dto.ts:64` |
| `fields[].dataType` | `string` | Sí | valores: string, text, integer, decimal, boolean, date, datetime, time, uuid, json, binary, reference, code | `@IsIn(DATA_TYPES)` | Tipo técnico de dato | `src/modules/read_models/dto/publish-view-contract.dto.ts:74` |
| `fields[].formatMask` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Máscara de formato | `src/modules/read_models/dto/publish-view-contract.dto.ts:83` |
| `fields[].sensitive` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Campo sensible (masking heredado) | `src/modules/read_models/dto/publish-view-contract.dto.ts:91` |
| `fields[].permissionId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Permiso requerido para verlo | `src/modules/read_models/dto/publish-view-contract.dto.ts:102` |
| `fields[].ordinal` | `number` | Sí | mínimo 0 | `@IsInt()` `@Min(0)` | Orden del campo | `src/modules/read_models/dto/publish-view-contract.dto.ts:110` |
| `sortOptions` | `array<ViewSortOptionInputDto>` | No | — | `@IsOptional()` `@IsArray()` `@ValidateNested({ each: true })` `@Type(() => ViewSortOptionInputDto)` | Opciones de orden | `src/modules/read_models/dto/publish-view-contract.dto.ts:476` |
| `sortOptions[].sortCode` | `string` | No | longitud mínima 1; longitud máxima 128 | `@IsString()` `@MinLength(1)` `@MaxLength(128)` | Código de orden | `src/modules/read_models/dto/publish-view-contract.dto.ts:122` |
| `sortOptions[].label` | `string` | No | longitud mínima 1; longitud máxima 200 | `@IsString()` `@MinLength(1)` `@MaxLength(200)` | Etiqueta | `src/modules/read_models/dto/publish-view-contract.dto.ts:131` |
| `sortOptions[].sortExpression` | `string` | No | longitud mínima 1; longitud máxima 200 | `@IsString()` `@MinLength(1)` `@MaxLength(200)` | Expresión de orden | `src/modules/read_models/dto/publish-view-contract.dto.ts:140` |
| `sortOptions[].direction` | `string` | No | valores: ASC, DESC | `@IsIn(['ASC', 'DESC'])` | Dirección | `src/modules/read_models/dto/publish-view-contract.dto.ts:147` |
| `sortOptions[].nulls` | `string` | No | valores: FIRST, LAST | `@IsIn(['FIRST', 'LAST'])` | Posición de nulos | `src/modules/read_models/dto/publish-view-contract.dto.ts:154` |
| `sortOptions[].stableTieBreakerExpression` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Tie-breaker estable | `src/modules/read_models/dto/publish-view-contract.dto.ts:166` |
| `sortOptions[].ordinal` | `number` | No | mínimo 0 | `@IsInt()` `@Min(0)` | Orden | `src/modules/read_models/dto/publish-view-contract.dto.ts:174` |
| `actions` | `array<ViewActionInputDto>` | No | — | `@IsOptional()` `@IsArray()` `@ValidateNested({ each: true })` `@Type(() => ViewActionInputDto)` | Acciones de fila | `src/modules/read_models/dto/publish-view-contract.dto.ts:489` |
| `actions[].actionCode` | `string` | No | longitud mínima 1; longitud máxima 128 | `@IsString()` `@MinLength(1)` `@MaxLength(128)` | Código de acción | `src/modules/read_models/dto/publish-view-contract.dto.ts:186` |
| `actions[].label` | `string` | No | longitud mínima 1; longitud máxima 200 | `@IsString()` `@MinLength(1)` `@MaxLength(200)` | Etiqueta | `src/modules/read_models/dto/publish-view-contract.dto.ts:195` |
| `actions[].actionType` | `string` | No | valores: NAVIGATE, MUTATION | `@IsIn(['NAVIGATE', 'MUTATION'])` | Tipo de acción | `src/modules/read_models/dto/publish-view-contract.dto.ts:205` |
| `actions[].routeTemplate` | `string` | No | longitud máxima 300 | `@IsOptional()` `@IsString()` `@MaxLength(300)` | Plantilla de ruta | `src/modules/read_models/dto/publish-view-contract.dto.ts:214` |
| `actions[].requiredPermissionId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Permiso requerido | `src/modules/read_models/dto/publish-view-contract.dto.ts:222` |
| `actions[].allowedStates` | `array<string>` | No | — | `@IsOptional()` `@IsArray()` `@IsString({ each: true })` | Estados de fila en los que aplica | `src/modules/read_models/dto/publish-view-contract.dto.ts:231` |
| `actions[].idempotencyRequired` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Requiere idempotencia | `src/modules/read_models/dto/publish-view-contract.dto.ts:239` |
| `actions[].ordinal` | `number` | No | mínimo 0 | `@IsInt()` `@Min(0)` | Orden | `src/modules/read_models/dto/publish-view-contract.dto.ts:247` |
| `kpis` | `array<ViewKpiInputDto>` | No | — | `@IsOptional()` `@IsArray()` `@ValidateNested({ each: true })` `@Type(() => ViewKpiInputDto)` | KPIs | `src/modules/read_models/dto/publish-view-contract.dto.ts:499` |
| `kpis[].kpiCode` | `string` | No | longitud mínima 1; longitud máxima 128 | `@IsString()` `@MinLength(1)` `@MaxLength(128)` | Código del KPI | `src/modules/read_models/dto/publish-view-contract.dto.ts:259` |
| `kpis[].label` | `string` | No | longitud mínima 1; longitud máxima 200 | `@IsString()` `@MinLength(1)` `@MaxLength(200)` | Etiqueta | `src/modules/read_models/dto/publish-view-contract.dto.ts:268` |
| `kpis[].valueColumn` | `string` | No | longitud mínima 1; longitud máxima 128 | `@IsString()` `@MinLength(1)` `@MaxLength(128)` | Columna del valor | `src/modules/read_models/dto/publish-view-contract.dto.ts:277` |
| `kpis[].comparisonColumn` | `string` | No | longitud mínima 1; longitud máxima 128 | `@IsString()` `@MinLength(1)` `@MaxLength(128)` | Columna de comparación | `src/modules/read_models/dto/publish-view-contract.dto.ts:286` |
| `kpis[].formatMask` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Máscara de formato | `src/modules/read_models/dto/publish-view-contract.dto.ts:295` |
| `kpis[].ordinal` | `number` | No | mínimo 0 | `@IsInt()` `@Min(0)` | Orden | `src/modules/read_models/dto/publish-view-contract.dto.ts:303` |
| `states` | `array<ViewStateInputDto>` | No | — | `@IsOptional()` `@IsArray()` `@ValidateNested({ each: true })` `@Type(() => ViewStateInputDto)` | Estados de UI | `src/modules/read_models/dto/publish-view-contract.dto.ts:512` |
| `states[].stateType` | `string` | No | valores: LOADING, EMPTY, STALE, ERROR, FORBIDDEN | `@IsIn(['LOADING', 'EMPTY', 'STALE', 'ERROR', 'FORBIDDEN'])` | Tipo de estado | `src/modules/read_models/dto/publish-view-contract.dto.ts:316` |
| `states[].title` | `string` | No | longitud mínima 1; longitud máxima 200 | `@IsString()` `@MinLength(1)` `@MaxLength(200)` | Título | `src/modules/read_models/dto/publish-view-contract.dto.ts:325` |
| `states[].message` | `string` | No | longitud mínima 1; longitud máxima 500 | `@IsString()` `@MinLength(1)` `@MaxLength(500)` | Mensaje | `src/modules/read_models/dto/publish-view-contract.dto.ts:334` |
| `states[].retryAllowed` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Permite reintentar | `src/modules/read_models/dto/publish-view-contract.dto.ts:342` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "portalName": "Nombre de ejemplo",
  "portalType": "INTERNAL",
  "routePattern": "/crm/accounts",
  "pageTitle": "valor-ejemplo",
  "readModelDefinitionId": "00000000-0000-4000-8000-000000000001",
  "viewCode": "account_list",
  "viewType": "TABLE",
  "fields": [
    {
      "fieldCode": "display_name",
      "sourceColumn": "display_name",
      "label": "valor-ejemplo",
      "dataType": "string",
      "ordinal": 1
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "portalName": "Nombre de ejemplo",
  "portalType": "INTERNAL",
  "routePattern": "/crm/accounts",
  "pageTitle": "valor-ejemplo",
  "requiresPatientContext": true,
  "requiresTenantContext": true,
  "readModelDefinitionId": "00000000-0000-4000-8000-000000000001",
  "viewCode": "account_list",
  "viewType": "TABLE",
  "title": "valor-ejemplo",
  "supportsCursorPagination": true,
  "supportsExport": true,
  "fields": [
    {
      "fieldCode": "display_name",
      "sourceColumn": "display_name",
      "label": "valor-ejemplo",
      "dataType": "string",
      "formatMask": "valor-ejemplo",
      "sensitive": true,
      "permissionId": "00000000-0000-4000-8000-000000000001",
      "ordinal": 1
    }
  ],
  "sortOptions": [
    {
      "sortCode": "CODIGO_EJEMPLO",
      "label": "valor-ejemplo",
      "sortExpression": "created_at",
      "direction": "ASC",
      "nulls": "FIRST",
      "stableTieBreakerExpression": "id ASC",
      "ordinal": 1
    }
  ],
  "actions": [
    {
      "actionCode": "CODIGO_EJEMPLO",
      "label": "valor-ejemplo",
      "actionType": "NAVIGATE",
      "routeTemplate": "valor-ejemplo",
      "requiredPermissionId": "00000000-0000-4000-8000-000000000001",
      "allowedStates": [
        "valor-ejemplo"
      ],
      "idempotencyRequired": true,
      "ordinal": 1
    }
  ],
  "kpis": [
    {
      "kpiCode": "CODIGO_EJEMPLO",
      "label": "valor-ejemplo",
      "valueColumn": "valor-ejemplo",
      "comparisonColumn": "valor-ejemplo",
      "formatMask": "valor-ejemplo",
      "ordinal": 1
    }
  ],
  "states": [
    {
      "stateType": "LOADING",
      "title": "valor-ejemplo",
      "message": "valor-ejemplo",
      "retryAllowed": true
    }
  ]
}
```

</details>

### Respuesta — `Promise<ViewContractResponseDto>` · DTO `ViewContractResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Id de la vista de página | `src/modules/read_models/dto/read-model-responses.dto.ts:126` |
| `portalSurfaceId` | `string` | Sí | formato uuid | — | Identificador asociado a portal surface. | `src/modules/read_models/dto/read-model-responses.dto.ts:132` |
| `frontendRouteId` | `string` | Sí | formato uuid | — | Identificador asociado a frontend route. | `src/modules/read_models/dto/read-model-responses.dto.ts:138` |
| `viewCode` | `string` | Sí | — | — | Valor de view code mantenido por la instancia. | `src/modules/read_models/dto/read-model-responses.dto.ts:144` |
| `fieldCount` | `number` | Sí | — | — | Campos publicados | `src/modules/read_models/dto/read-model-responses.dto.ts:150` |
| `actionCount` | `number` | Sí | — | — | Acciones publicadas | `src/modules/read_models/dto/read-model-responses.dto.ts:156` |
| `status` | `string` | Sí | — | — | Estado (concept id) | `src/modules/read_models/dto/read-model-responses.dto.ts:162` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Definición de read model no encontrada |
| 409 | `CONFLICT` | ConflictException: La vista ya existe en esa ruta |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La definición de read model no está ACTIVE |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/read_models.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/read_models/controllers/frontend-views.controller.spec.ts:34` |

### Flujos

- Módulo 30 · Read Models (Frontend View Contracts & Read Models) — etapa `UC-30-02`

---

## 2. GET /portals/{portalCode}/routes/{routeCode}/views/{viewCode}/actions

- **Origen:** CONTRATO
- **Nombre:** Derivar available_actions_json (estado + permiso + purpose)
- **Bloque:** Auditoría y Reporting
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `FrontendViewsController.deriveActions` — `src/modules/read_models/controllers/frontend-views.controller.ts:113`

### Qué es y para qué sirve (negocio)

Derivar available_actions_json (estado + permiso + purpose). Caso de uso UC-30-11: Derivar available_actions_json (estado + permiso). Dentro del módulo (descripción del modelo, en inglés): «Provides frontend-ready, permission-aware read contracts.» Dominio: Auditoría y Reporting.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/read_models/README.md:93`) · MODELO (`Mantra Core Health Context/modules/diagram_30_read_models.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:36`)

### Cómo se atiende (sistema)

`GET /portals/{portalCode}/routes/{routeCode}/views/{viewCode}/actions` la atiende `FrontendViewsController.deriveActions` (src/modules/read_models/controllers/frontend-views.controller.ts:113). Exige sesión; el controlador no declara roles. Delega en `FrontendViewsService.deriveAvailableActions`. Lee authz.access_policies, authz.care_relationships, authz.clinical_access_grants, authz.field_permissions, authz.patient_legal_representations, authz.permissions, authz.resource_scope_grants, authz.role_permissions y 17 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/read_models/controllers/frontend-views.controller.ts:113` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_QUERY | purposeOfUse (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | patientProfileId (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.access_policies` | LEE | LEE | DIRECTA | FrontendViewsController.deriveActions → FrontendViewsService.deriveAvailableActions → ViewContractAuthorizer.authorizeView → ClinicalViewPatientAccess.canAccess → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AccessPoliciesRepository.findActiveForTarget | `src/modules/authz/repositories/access-policies.repository.ts:62` |
| `authz.care_relationships` | LEE | LEE | DIRECTA | FrontendViewsController.deriveActions → FrontendViewsService.deriveAvailableActions → ViewContractAuthorizer.authorizeView → ClinicalViewPatientAccess.canAccess → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → ClinicalReadService.hasCareCurrentRelation → CareRelationshipsRepository.findActiveForPractitionerPatient | `src/modules/authz/repositories/care-relationships.repository.ts:100` |
| `authz.clinical_access_grants` | LEE | LEE | DIRECTA | FrontendViewsController.deriveActions → FrontendViewsService.deriveAvailableActions → ViewContractAuthorizer.authorizeView → ClinicalViewPatientAccess.canAccess → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ClinicalAccessGrantsRepository.findActiveForUserPatient | `src/modules/authz/repositories/clinical-access-grants.repository.ts:105` |
| `authz.field_permissions` | LEE | LEE | DIRECTA | FrontendViewsController.deriveActions → FrontendViewsService.deriveAvailableActions → ViewContractAuthorizer.authorizeView → ClinicalViewPatientAccess.canAccess → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.computeMaskedFields → FieldPermissionsRepository.findForRoles | `src/modules/authz/repositories/field-permissions.repository.ts:61` |
| `authz.patient_legal_representations` | LEE | LEE | DIRECTA | FrontendViewsController.deriveActions → FrontendViewsService.deriveAvailableActions → ViewContractAuthorizer.authorizeView → ClinicalViewPatientAccess.canAccess → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PatientLegalRepresentationsRepository.findActiveForRepresentativePatient | `src/modules/authz/repositories/patient-legal-representations.repository.ts:96` |
| `authz.permissions` | LEE | LEE | DIRECTA | FrontendViewsController.deriveActions → FrontendViewsService.deriveAvailableActions → ViewContractAuthorizer.authorizeView → ClinicalViewPatientAccess.canAccess → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PermissionsRepository.findByResourceAction | `src/modules/authz/repositories/permissions.repository.ts:89` |
| `authz.resource_scope_grants` | LEE | LEE | DIRECTA | FrontendViewsController.deriveActions → FrontendViewsService.deriveAvailableActions → ViewContractAuthorizer.authorizeView → ClinicalViewPatientAccess.canAccess → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ResourceScopeGrantsRepository.findForSubjectResource | `src/modules/authz/repositories/resource-scope-grants.repository.ts:73` |
| `authz.role_permissions` | LEE | LEE | DIRECTA | FrontendViewsController.deriveActions → FrontendViewsService.deriveAvailableActions → ViewContractAuthorizer.authorizeView → AuthzViewPermissionGate.holds | `src/modules/read_models/services/view-access.adapters.ts:128` |
| `authz.roles` | LEE | LEE | DIRECTA | FrontendViewsController.deriveActions → FrontendViewsService.deriveAvailableActions → ViewContractAuthorizer.authorizeView → AuthzViewPermissionGate.holds | `src/modules/read_models/services/view-access.adapters.ts:104` |
| `authz.user_permission_grants` | LEE | LEE | DIRECTA | FrontendViewsController.deriveActions → FrontendViewsService.deriveAvailableActions → ViewContractAuthorizer.authorizeView → AuthzViewPermissionGate.holds | `src/modules/read_models/services/view-access.adapters.ts:139` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | FrontendViewsController.deriveActions → FrontendViewsService.deriveAvailableActions → ViewContractAuthorizer.authorizeView → AuthzViewPermissionGate.holds → AuthzEffectiveRolesService.scopedAssignmentsForUser → UserRoleAssignmentsRepository.findActiveForUser | `src/modules/authz/repositories/user-role-assignments.repository.ts:102` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | FrontendViewsController.deriveActions → FrontendViewsService.deriveAvailableActions → ViewContractAuthorizer.authorizeView → ClinicalViewPatientAccess.canAccess → ClinicalReadService.assertCanReadHistory → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.patient_portal_proxies` | LEE | LEE | DIRECTA | FrontendViewsController.deriveActions → FrontendViewsService.deriveAvailableActions → ViewContractAuthorizer.authorizeView → ClinicalViewPatientAccess.canAccess → ClinicalReadService.assertCanReadHistory → ClinicalReadService.assertOwnRecord → PatientRepresentationService.representsPatient → PatientPortalProxiesRepository.findActiveByProxyUserAndPatient | `src/modules/profiles/infrastructure/repositories/patient-portal-proxies.repository.ts:233` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | FrontendViewsController.deriveActions → FrontendViewsService.deriveAvailableActions → ViewContractAuthorizer.authorizeView → ClinicalViewPatientAccess.canAccess → ClinicalReadService.assertCanReadHistory → ClinicalReadService.assertOwnRecord → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | FrontendViewsController.deriveActions → FrontendViewsService.deriveAvailableActions → ViewContractAuthorizer.authorizeView → ClinicalViewPatientAccess.canAccess → ClinicalReadService.assertCanReadHistory → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `read_models.frontend_page_views` | LEE | LEE | DIRECTA | FrontendViewsController.deriveActions → FrontendViewsService.deriveAvailableActions → FrontendViewsService.resolveContract → FrontendPageViewsRepository.findByRouteAndCode | `src/modules/read_models/repositories/frontend-page-views.repository.ts:97` |
| `read_models.frontend_routes` | LEE | LEE | DIRECTA | FrontendViewsController.deriveActions → FrontendViewsService.deriveAvailableActions → FrontendViewsService.resolveContract → FrontendRoutesRepository.findBySurfaceAndCode | `src/modules/read_models/repositories/frontend-routes.repository.ts:86` |
| `read_models.frontend_view_actions` | LEE | LEE | DIRECTA | FrontendViewsController.deriveActions → FrontendViewsService.deriveAvailableActions → FrontendViewChildrenRepository.listActions | `src/modules/read_models/repositories/frontend-view-children.repository.ts:434` |
| `read_models.portal_surfaces` | LEE | LEE | DIRECTA | FrontendViewsController.deriveActions → FrontendViewsService.deriveAvailableActions → FrontendViewsService.resolveContract → PortalSurfacesRepository.findByCode | `src/modules/read_models/repositories/portal-surfaces.repository.ts:64` |
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | FrontendViewsController.deriveActions → FrontendViewsService.deriveAvailableActions → ViewContractAuthorizer.authorizeView → ClinicalViewPatientAccess.canAccess → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1031` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | FrontendViewsController.deriveActions → FrontendViewsService.deriveAvailableActions → ViewContractAuthorizer.authorizeView → ClinicalViewPatientAccess.canAccess → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → ClinicalReadService.attendsToday → SchedulingBookingsRepository.findConfirmedWithPatientBetween | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1057` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | FrontendViewsController.deriveActions → FrontendViewsService.deriveAvailableActions → ViewContractAuthorizer.authorizeView → ClinicalViewPatientAccess.canAccess → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1031` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | FrontendViewsController.deriveActions → FrontendViewsService.deriveAvailableActions → ViewContractAuthorizer.authorizeView → TerminologyViewAudienceGate.isInAudience | `src/modules/read_models/services/view-access.adapters.ts:191` |
| `terminology.value_set_members` | LEE | LEE | DIRECTA | FrontendViewsController.deriveActions → FrontendViewsService.deriveAvailableActions → ViewContractAuthorizer.authorizeView → TerminologyViewAudienceGate.isInAudience | `src/modules/read_models/services/view-access.adapters.ts:185` |
| `terminology.value_set_versions` | LEE | LEE | DIRECTA | FrontendViewsController.deriveActions → FrontendViewsService.deriveAvailableActions → ViewContractAuthorizer.authorizeView → TerminologyViewAudienceGate.isInAudience | `src/modules/read_models/services/view-access.adapters.ts:180` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `portalCode` | path | Sí | `string` | — |
| `routeCode` | path | Sí | `string` | — |
| `viewCode` | path | Sí | `string` | — |
| `purposeOfUse` | query | Sí | `string` | — |
| `patientProfileId` | query | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<AvailableActionDto[]>` · DTO `AvailableActionDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `actionCode` | `string` | Sí | — | — | Valor de action code mantenido por la instancia. | `src/modules/read_models/dto/read-model-responses.dto.ts:198` |
| `label` | `string` | Sí | — | — | Valor de label mantenido por la instancia. | `src/modules/read_models/dto/read-model-responses.dto.ts:204` |
| `actionType` | `string` | Sí | — | — | Tipo de acción (concept id) | `src/modules/read_models/dto/read-model-responses.dto.ts:210` |
| `enabled` | `boolean` | Sí | — | — | Habilitada para el estado + permisos del solicitante | `src/modules/read_models/dto/read-model-responses.dto.ts:218` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/read_models.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/read_models/controllers/frontend-views.controller.spec.ts:91` |

### Flujos

- Módulo 30 · Read Models (Frontend View Contracts & Read Models) — etapa `UC-30-11`

---

## 3. GET /portals/{portalCode}/routes/{routeCode}/views/{viewCode}/data

- **Origen:** CONTRATO
- **Nombre:** Servir el read model al frontend (consent-aware, masking heredado)
- **Bloque:** Auditoría y Reporting
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `FrontendViewsController.serveData` — `src/modules/read_models/controllers/frontend-views.controller.ts:72`

### Qué es y para qué sirve (negocio)

Servir el read model al frontend (consent-aware, masking heredado). Caso de uso UC-30-05: Devuelve contrato, masking y staleness; actualmente data queda vacío. Dentro del módulo (descripción del modelo, en inglés): «Provides frontend-ready, permission-aware read contracts.» Dominio: Auditoría y Reporting.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/read_models/README.md:87`) · MODELO (`Mantra Core Health Context/modules/diagram_30_read_models.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:36`)

### Cómo se atiende (sistema)

`GET /portals/{portalCode}/routes/{routeCode}/views/{viewCode}/data` la atiende `FrontendViewsController.serveData` (src/modules/read_models/controllers/frontend-views.controller.ts:72). Exige sesión; el controlador no declara roles. Delega en `FrontendViewsService.serveData`. Lee authz.access_policies, authz.care_relationships, authz.clinical_access_grants, authz.field_permissions, authz.patient_legal_representations, authz.permissions, authz.resource_scope_grants, authz.role_permissions y 22 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/read_models/controllers/frontend-views.controller.ts:72` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.access_policies` | LEE | LEE | DIRECTA | FrontendViewsController.serveData → FrontendViewsService.serveData → ViewContractAuthorizer.authorizeView → ClinicalViewPatientAccess.canAccess → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AccessPoliciesRepository.findActiveForTarget | `src/modules/authz/repositories/access-policies.repository.ts:62` |
| `authz.care_relationships` | LEE | LEE | DIRECTA | FrontendViewsController.serveData → FrontendViewsService.serveData → ViewContractAuthorizer.authorizeView → ClinicalViewPatientAccess.canAccess → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → ClinicalReadService.hasCareCurrentRelation → CareRelationshipsRepository.findActiveForPractitionerPatient | `src/modules/authz/repositories/care-relationships.repository.ts:100` |
| `authz.clinical_access_grants` | LEE | LEE | DIRECTA | FrontendViewsController.serveData → FrontendViewsService.serveData → ViewContractAuthorizer.authorizeView → ClinicalViewPatientAccess.canAccess → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ClinicalAccessGrantsRepository.findActiveForUserPatient | `src/modules/authz/repositories/clinical-access-grants.repository.ts:105` |
| `authz.field_permissions` | LEE | LEE | DIRECTA | FrontendViewsController.serveData → FrontendViewsService.serveData → ViewContractAuthorizer.authorizeView → ClinicalViewPatientAccess.canAccess → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.computeMaskedFields → FieldPermissionsRepository.findForRoles | `src/modules/authz/repositories/field-permissions.repository.ts:61` |
| `authz.patient_legal_representations` | LEE | LEE | DIRECTA | FrontendViewsController.serveData → FrontendViewsService.serveData → ViewContractAuthorizer.authorizeView → ClinicalViewPatientAccess.canAccess → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PatientLegalRepresentationsRepository.findActiveForRepresentativePatient | `src/modules/authz/repositories/patient-legal-representations.repository.ts:96` |
| `authz.permissions` | LEE | LEE | DIRECTA | FrontendViewsController.serveData → FrontendViewsService.serveData → ViewContractAuthorizer.authorizeView → ClinicalViewPatientAccess.canAccess → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PermissionsRepository.findByResourceAction | `src/modules/authz/repositories/permissions.repository.ts:89` |
| `authz.resource_scope_grants` | LEE | LEE | DIRECTA | FrontendViewsController.serveData → FrontendViewsService.serveData → ViewContractAuthorizer.authorizeView → ClinicalViewPatientAccess.canAccess → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ResourceScopeGrantsRepository.findForSubjectResource | `src/modules/authz/repositories/resource-scope-grants.repository.ts:73` |
| `authz.role_permissions` | LEE | LEE | DIRECTA | FrontendViewsController.serveData → FrontendViewsService.serveData → ViewContractAuthorizer.authorizeView → AuthzViewPermissionGate.holds | `src/modules/read_models/services/view-access.adapters.ts:128` |
| `authz.roles` | LEE | LEE | DIRECTA | FrontendViewsController.serveData → FrontendViewsService.serveData → ViewContractAuthorizer.authorizeView → AuthzViewPermissionGate.holds | `src/modules/read_models/services/view-access.adapters.ts:104` |
| `authz.user_permission_grants` | LEE | LEE | DIRECTA | FrontendViewsController.serveData → FrontendViewsService.serveData → ViewContractAuthorizer.authorizeView → AuthzViewPermissionGate.holds | `src/modules/read_models/services/view-access.adapters.ts:139` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | FrontendViewsController.serveData → FrontendViewsService.serveData → ViewContractAuthorizer.authorizeView → AuthzViewPermissionGate.holds → AuthzEffectiveRolesService.scopedAssignmentsForUser → UserRoleAssignmentsRepository.findActiveForUser | `src/modules/authz/repositories/user-role-assignments.repository.ts:102` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | FrontendViewsController.serveData → FrontendViewsService.serveData → ViewContractAuthorizer.authorizeView → ClinicalViewPatientAccess.canAccess → ClinicalReadService.assertCanReadHistory → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.patient_portal_proxies` | LEE | LEE | DIRECTA | FrontendViewsController.serveData → FrontendViewsService.serveData → ViewContractAuthorizer.authorizeView → ClinicalViewPatientAccess.canAccess → ClinicalReadService.assertCanReadHistory → ClinicalReadService.assertOwnRecord → PatientRepresentationService.representsPatient → PatientPortalProxiesRepository.findActiveByProxyUserAndPatient | `src/modules/profiles/infrastructure/repositories/patient-portal-proxies.repository.ts:233` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | FrontendViewsController.serveData → FrontendViewsService.serveData → ViewContractAuthorizer.authorizeView → ClinicalViewPatientAccess.canAccess → ClinicalReadService.assertCanReadHistory → ClinicalReadService.assertOwnRecord → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | FrontendViewsController.serveData → FrontendViewsService.serveData → ViewContractAuthorizer.authorizeView → ClinicalViewPatientAccess.canAccess → ClinicalReadService.assertCanReadHistory → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `read_models.frontend_page_views` | LEE | LEE | DIRECTA | FrontendViewsController.serveData → FrontendViewsService.serveData → FrontendViewsService.resolveContract → FrontendPageViewsRepository.findByRouteAndCode | `src/modules/read_models/repositories/frontend-page-views.repository.ts:97` |
| `read_models.frontend_routes` | LEE | LEE | DIRECTA | FrontendViewsController.serveData → FrontendViewsService.serveData → FrontendViewsService.resolveContract → FrontendRoutesRepository.findBySurfaceAndCode | `src/modules/read_models/repositories/frontend-routes.repository.ts:86` |
| `read_models.frontend_view_actions` | LEE | LEE | DIRECTA | FrontendViewsController.serveData → FrontendViewsService.serveData → FrontendViewChildrenRepository.listActions | `src/modules/read_models/repositories/frontend-view-children.repository.ts:434` |
| `read_models.frontend_view_fields` | LEE | LEE | DIRECTA | FrontendViewsController.serveData → FrontendViewsService.serveData → FrontendViewChildrenRepository.listFields | `src/modules/read_models/repositories/frontend-view-children.repository.ts:380` |
| `read_models.frontend_view_filters` | LEE | LEE | DIRECTA | FrontendViewsController.serveData → FrontendViewsService.serveData → FrontendViewChildrenRepository.listFilters | `src/modules/read_models/repositories/frontend-view-children.repository.ts:398` |
| `read_models.frontend_view_sort_options` | LEE | LEE | DIRECTA | FrontendViewsController.serveData → FrontendViewsService.serveData → FrontendViewChildrenRepository.listSortOptions | `src/modules/read_models/repositories/frontend-view-children.repository.ts:416` |
| `read_models.portal_surfaces` | LEE | LEE | DIRECTA | FrontendViewsController.serveData → FrontendViewsService.serveData → FrontendViewsService.resolveContract → PortalSurfacesRepository.findByCode | `src/modules/read_models/repositories/portal-surfaces.repository.ts:64` |
| `read_models.read_model_definitions` | LEE | LEE | DIRECTA | FrontendViewsController.serveData → FrontendViewsService.serveData → ReadModelDefinitionsRepository.findById | `src/modules/read_models/repositories/read-model-definitions.repository.ts:99` |
| `read_models.read_model_refresh_runs` | LEE | LEE | DIRECTA | FrontendViewsController.serveData → FrontendViewsService.serveData → ReadModelRefreshRunsRepository.findLatestByDefinition | `src/modules/read_models/repositories/read-model-refresh-runs.repository.ts:56` |
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | FrontendViewsController.serveData → FrontendViewsService.serveData → ViewContractAuthorizer.authorizeView → ClinicalViewPatientAccess.canAccess → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1031` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | FrontendViewsController.serveData → FrontendViewsService.serveData → ViewContractAuthorizer.authorizeView → ClinicalViewPatientAccess.canAccess → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → ClinicalReadService.attendsToday → SchedulingBookingsRepository.findConfirmedWithPatientBetween | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1057` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | FrontendViewsController.serveData → FrontendViewsService.serveData → ViewContractAuthorizer.authorizeView → ClinicalViewPatientAccess.canAccess → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1031` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | FrontendViewsController.serveData → FrontendViewsService.serveData → ViewContractAuthorizer.authorizeView → TerminologyViewAudienceGate.isInAudience | `src/modules/read_models/services/view-access.adapters.ts:191` |
| `terminology.value_set_members` | LEE | LEE | DIRECTA | FrontendViewsController.serveData → FrontendViewsService.serveData → ViewContractAuthorizer.authorizeView → TerminologyViewAudienceGate.isInAudience | `src/modules/read_models/services/view-access.adapters.ts:185` |
| `terminology.value_set_versions` | LEE | LEE | DIRECTA | FrontendViewsController.serveData → FrontendViewsService.serveData → ViewContractAuthorizer.authorizeView → TerminologyViewAudienceGate.isInAudience | `src/modules/read_models/services/view-access.adapters.ts:180` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `portalCode` | path | Sí | `string` | — |
| `routeCode` | path | Sí | `string` | — |
| `viewCode` | path | Sí | `string` | — |
| `patientProfileId` | query | No | `desconocido` | Paciente de las vistas con contexto de paciente |
| `purposeOfUse` | query | No | `desconocido` | Propósito de uso (concepto) que la ruta exige |
| `sort` | query | No | `desconocido` | Código de orden |
| `limit` | query | No | `desconocido` | Se recorta al máximo de página de la definición |
| `cursor` | query | No | `desconocido` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ServeViewDataResponseDto>` · DTO `ServeViewDataResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `frontendPageViewId` | `string` | Sí | formato uuid | — | Identificador asociado a frontend page view. | `src/modules/read_models/dto/read-model-responses.dto.ts:254` |
| `viewCode` | `string` | Sí | — | — | Valor de view code mantenido por la instancia. | `src/modules/read_models/dto/read-model-responses.dto.ts:260` |
| `fields` | `array<ServedFieldDto>` | Sí | — | — | Columnas servidas (con masking) | `src/modules/read_models/dto/read-model-responses.dto.ts:269` |
| `fields[].fieldCode` | `string` | Sí | — | — | Valor de field code mantenido por la instancia. | `src/modules/read_models/dto/read-model-responses.dto.ts:227` |
| `fields[].label` | `string` | Sí | — | — | Valor de label mantenido por la instancia. | `src/modules/read_models/dto/read-model-responses.dto.ts:233` |
| `fields[].dataType` | `string` | Sí | — | — | Valor de data type mantenido por la instancia. | `src/modules/read_models/dto/read-model-responses.dto.ts:239` |
| `fields[].masked` | `boolean` | Sí | — | — | Enmascarado por sensibilidad/permiso | `src/modules/read_models/dto/read-model-responses.dto.ts:245` |
| `data` | `array<object>` | Sí | — | — | Filas del read model (proyección) | `src/modules/read_models/dto/read-model-responses.dto.ts:278` |
| `availableActions` | `array<AvailableActionDto>` | Sí | — | — | Acciones disponibles derivadas | `src/modules/read_models/dto/read-model-responses.dto.ts:287` |
| `availableActions[].actionCode` | `string` | Sí | — | — | Valor de action code mantenido por la instancia. | `src/modules/read_models/dto/read-model-responses.dto.ts:198` |
| `availableActions[].label` | `string` | Sí | — | — | Valor de label mantenido por la instancia. | `src/modules/read_models/dto/read-model-responses.dto.ts:204` |
| `availableActions[].actionType` | `string` | Sí | — | — | Tipo de acción (concept id) | `src/modules/read_models/dto/read-model-responses.dto.ts:210` |
| `availableActions[].enabled` | `boolean` | Sí | — | — | Habilitada para el estado + permisos del solicitante | `src/modules/read_models/dto/read-model-responses.dto.ts:218` |
| `nextCursor` | `string` | No | admite null | — | Cursor de la siguiente página | `src/modules/read_models/dto/read-model-responses.dto.ts:293` |
| `refreshedAt` | `string` | No | formato date-time; admite null | — | Última materialización de la MV | `src/modules/read_models/dto/read-model-responses.dto.ts:299` |
| `stalenessSeconds` | `number` | Sí | — | — | Antigüedad en segundos respecto a la última materialización | `src/modules/read_models/dto/read-model-responses.dto.ts:307` |
| `generatedAt` | `string` | Sí | formato date-time | — | Marca de generación de la respuesta | `src/modules/read_models/dto/read-model-responses.dto.ts:313` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La proyección no está disponible |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/read_models.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/read_models/controllers/frontend-views.controller.spec.ts:46` |

### Flujos

- Módulo 30 · Read Models (Frontend View Contracts & Read Models) — etapa `UC-30-05`

---

## 4. GET /public/{slug}

- **Origen:** CONTRATO
- **Nombre:** Servir una proyección pública por slug
- **Bloque:** Auditoría y Reporting
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PublicProjectionsController.getBySlug` — `src/modules/read_models/controllers/public-projections.controller.ts:35`

### Qué es y para qué sirve (negocio)

Servir una proyección pública por slug. Caso de uso UC-30-10: Proyecciones públicas (sin PHI, sin sesión). Dentro del módulo (descripción del modelo, en inglés): «Provides frontend-ready, permission-aware read contracts.» Dominio: Auditoría y Reporting.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/read_models/README.md:92`) · MODELO (`Mantra Core Health Context/modules/diagram_30_read_models.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:36`)

### Cómo se atiende (sistema)

`GET /public/{slug}` la atiende `PublicProjectionsController.getBySlug` (src/modules/read_models/controllers/public-projections.controller.ts:35). Es una ruta pública: no exige token. Delega en `PublicProjectionsService.getBySlug`. Lee read_models.public_provider_directory.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/read_models/controllers/public-projections.controller.ts:35` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `read_models.public_provider_directory (vista u objeto no catalogado)` | LEE | LEE | POR_SQL | PublicProjectionsController.getBySlug → PublicProjectionsService.getBySlug | `src/modules/read_models/services/public-projections.service.ts:69` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `slug` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PublicProjectionResponseDto>` · DTO `PublicProjectionResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `slug` | `string` | Sí | — | — | Slug o consulta pública resuelta | `src/modules/read_models/dto/read-model-responses.dto.ts:376` |
| `records` | `array<object>` | Sí | — | — | Registros públicos aprobados | `src/modules/read_models/dto/read-model-responses.dto.ts:382` |
| `refreshedAt` | `string` | No | formato date-time; admite null | — | Última materialización de la MV pública | `src/modules/read_models/dto/read-model-responses.dto.ts:390` |
| `generatedAt` | `string` | Sí | formato date-time | — | Marca de generación de la respuesta | `src/modules/read_models/dto/read-model-responses.dto.ts:396` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/read_models.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/read_models/controllers/public-projections.controller.spec.ts:36` |

### Flujos

- Módulo 30 · Read Models (Frontend View Contracts & Read Models) — etapa `UC-30-10`

---

## 5. GET /public/directory

- **Origen:** CONTRATO
- **Nombre:** Servir el directorio público (solo campos aprobados)
- **Bloque:** Auditoría y Reporting
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PublicProjectionsController.searchDirectory` — `src/modules/read_models/controllers/public-projections.controller.ts:22`

### Qué es y para qué sirve (negocio)

Servir el directorio público (solo campos aprobados). Caso de uso UC-30-10: Proyecciones públicas (sin PHI, sin sesión). Dentro del módulo (descripción del modelo, en inglés): «Provides frontend-ready, permission-aware read contracts.» Dominio: Auditoría y Reporting.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/read_models/README.md:92`) · MODELO (`Mantra Core Health Context/modules/diagram_30_read_models.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:36`)

### Cómo se atiende (sistema)

`GET /public/directory` la atiende `PublicProjectionsController.searchDirectory` (src/modules/read_models/controllers/public-projections.controller.ts:22). Es una ruta pública: no exige token. Delega en `PublicProjectionsService.searchDirectory`. Lee read_models.public_provider_directory.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/read_models/controllers/public-projections.controller.ts:22` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `read_models.public_provider_directory (vista u objeto no catalogado)` | LEE | LEE | POR_SQL | PublicProjectionsController.searchDirectory → PublicProjectionsService.searchDirectory | `src/modules/read_models/services/public-projections.service.ts:130` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PublicProjectionResponseDto>` · DTO `PublicProjectionResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `slug` | `string` | Sí | — | — | Slug o consulta pública resuelta | `src/modules/read_models/dto/read-model-responses.dto.ts:376` |
| `records` | `array<object>` | Sí | — | — | Registros públicos aprobados | `src/modules/read_models/dto/read-model-responses.dto.ts:382` |
| `refreshedAt` | `string` | No | formato date-time; admite null | — | Última materialización de la MV pública | `src/modules/read_models/dto/read-model-responses.dto.ts:390` |
| `generatedAt` | `string` | Sí | formato date-time | — | Marca de generación de la respuesta | `src/modules/read_models/dto/read-model-responses.dto.ts:396` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/read_models.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/read_models/controllers/public-projections.controller.spec.ts:26` |

### Flujos

- Módulo 30 · Read Models (Frontend View Contracts & Read Models) — etapa `UC-30-10`

---

## 6. POST /read-models/{definitionId}/backfill

- **Origen:** CONTRATO
- **Nombre:** Backfill inicial de una nueva materialized view
- **Bloque:** Auditoría y Reporting
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ReadModelDefinitionsController.backfill` — `src/modules/read_models/controllers/read-model-definitions.controller.ts:119`

### Qué es y para qué sirve (negocio)

Backfill inicial de una nueva materialized view. Caso de uso UC-30-04: Backfill inicial (FULL) de la MV. Dentro del módulo (descripción del modelo, en inglés): «Provides frontend-ready, permission-aware read contracts.» Dominio: Auditoría y Reporting.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/read_models/README.md:86`) · MODELO (`Mantra Core Health Context/modules/diagram_30_read_models.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:36`)

### Cómo se atiende (sistema)

`POST /read-models/{definitionId}/backfill` la atiende `ReadModelDefinitionsController.backfill` (src/modules/read_models/controllers/read-model-definitions.controller.ts:119). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `ReadModelDefinitionsService.backfill`. Crea filas en read_models.read_model_refresh_runs. Lee read_models.read_model_definitions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/read_models/controllers/read-model-definitions.controller.ts:119` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: definitionId | `src/modules/read_models/controllers/read-model-definitions.controller.ts:119` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `read_models.read_model_definitions` | LEE | LEE | DIRECTA | ReadModelDefinitionsController.backfill → ReadModelDefinitionsService.backfill → ReadModelDefinitionsService.runRefresh → ReadModelDefinitionsRepository.findById | `src/modules/read_models/repositories/read-model-definitions.repository.ts:99` |
| `read_models.read_model_refresh_runs` | ESCRIBE | CREA | DIRECTA | ReadModelDefinitionsController.backfill → ReadModelDefinitionsService.backfill → ReadModelDefinitionsService.runRefresh → ReadModelRefreshRunsRepository.create | `src/modules/read_models/repositories/read-model-refresh-runs.repository.ts:71` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `definitionId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<RefreshRunResponseDto>` · DTO `RefreshRunResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `runId` | `string` | Sí | formato uuid | — | Identificador asociado a run. | sin fuente |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | sin fuente |
| `versionId` | `string` | No | formato uuid | — | Versión redactada, si hubo cambio | sin fuente |
| `versionNumber` | `number` | No | — | — | Número de la versión redactada | sin fuente |
| `contentHash` | `string` | Sí | — | — | Hash del contenido regenerado | sin fuente |
| `unchanged` | `boolean` | Sí | — | — | true si el contenido no cambió y no se redactó versión | sin fuente |
| `inputCount` | `number` | Sí | — | — | Entradas de procedencia registradas | sin fuente |
| `duplicate` | `boolean` | Sí | — | — | true si la corrida ya existía con esa clave | sin fuente |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Read model no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La operación requiere una materialized view; PreconditionFailedException: La versión está retirada; PreconditionFailedException: El nombre físico de la vista no es un identificador SQL válido |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/read_models.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/read_models/controllers/read-model-definitions.controller.spec.ts:61` |

### Flujos

- Módulo 30 · Read Models (Frontend View Contracts & Read Models) — etapa `UC-30-04`

---

## 7. POST /read-models/{definitionId}/invalidate

- **Origen:** CONTRATO
- **Nombre:** Invalidar y recomputar el read model tras cambio upstream
- **Bloque:** Auditoría y Reporting
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ReadModelDefinitionsController.invalidate` — `src/modules/read_models/controllers/read-model-definitions.controller.ts:136`

### Qué es y para qué sirve (negocio)

Invalidar y recomputar el read model tras cambio upstream. Caso de uso UC-30-06: Invalidar y recomputar tras cambio upstream. Dentro del módulo (descripción del modelo, en inglés): «Provides frontend-ready, permission-aware read contracts.» Dominio: Auditoría y Reporting.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/read_models/README.md:88`) · MODELO (`Mantra Core Health Context/modules/diagram_30_read_models.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:36`)

### Cómo se atiende (sistema)

`POST /read-models/{definitionId}/invalidate` la atiende `ReadModelDefinitionsController.invalidate` (src/modules/read_models/controllers/read-model-definitions.controller.ts:136). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `ReadModelDefinitionsService.invalidate`. Crea filas en read_models.read_model_refresh_runs. Lee read_models.read_model_definitions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/read_models/controllers/read-model-definitions.controller.ts:136` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: definitionId | `src/modules/read_models/controllers/read-model-definitions.controller.ts:136` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `read_models.read_model_definitions` | LEE | LEE | DIRECTA | ReadModelDefinitionsController.invalidate → ReadModelDefinitionsService.invalidate → ReadModelDefinitionsService.runRefresh → ReadModelDefinitionsRepository.findById | `src/modules/read_models/repositories/read-model-definitions.repository.ts:99` |
| `read_models.read_model_refresh_runs` | ESCRIBE | CREA | DIRECTA | ReadModelDefinitionsController.invalidate → ReadModelDefinitionsService.invalidate → ReadModelDefinitionsService.runRefresh → ReadModelRefreshRunsRepository.create | `src/modules/read_models/repositories/read-model-refresh-runs.repository.ts:71` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `definitionId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<RefreshRunResponseDto>` · DTO `RefreshRunResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `runId` | `string` | Sí | formato uuid | — | Identificador asociado a run. | sin fuente |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | sin fuente |
| `versionId` | `string` | No | formato uuid | — | Versión redactada, si hubo cambio | sin fuente |
| `versionNumber` | `number` | No | — | — | Número de la versión redactada | sin fuente |
| `contentHash` | `string` | Sí | — | — | Hash del contenido regenerado | sin fuente |
| `unchanged` | `boolean` | Sí | — | — | true si el contenido no cambió y no se redactó versión | sin fuente |
| `inputCount` | `number` | Sí | — | — | Entradas de procedencia registradas | sin fuente |
| `duplicate` | `boolean` | Sí | — | — | true si la corrida ya existía con esa clave | sin fuente |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Read model no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La operación requiere una materialized view; PreconditionFailedException: La versión está retirada; PreconditionFailedException: El nombre físico de la vista no es un identificador SQL válido |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/read_models.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/read_models/controllers/read-model-definitions.controller.spec.ts:62` |

### Flujos

- Módulo 30 · Read Models (Frontend View Contracts & Read Models) — etapa `UC-30-06`

---

## 8. POST /read-models/{definitionId}/reconcile

- **Origen:** CONTRATO
- **Nombre:** Reconciliar read model divergente contra la fuente canónica
- **Bloque:** Auditoría y Reporting
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ReadModelDefinitionsController.reconcile` — `src/modules/read_models/controllers/read-model-definitions.controller.ts:159`

### Qué es y para qué sirve (negocio)

Reconciliar read model divergente contra la fuente canónica. Caso de uso UC-30-07: Reconciliar la MV divergente (result REPAIRED). Dentro del módulo (descripción del modelo, en inglés): «Provides frontend-ready, permission-aware read contracts.» Dominio: Auditoría y Reporting.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/read_models/README.md:89`) · MODELO (`Mantra Core Health Context/modules/diagram_30_read_models.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:36`)

### Cómo se atiende (sistema)

`POST /read-models/{definitionId}/reconcile` la atiende `ReadModelDefinitionsController.reconcile` (src/modules/read_models/controllers/read-model-definitions.controller.ts:159). Exige sesión con alguno de los roles SYSTEM, SECURITY_ADMIN. Delega en `ReadModelDefinitionsService.reconcile`. Crea filas en read_models.read_model_refresh_runs. Lee read_models.read_model_definitions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, SECURITY_ADMIN | `src/modules/read_models/controllers/read-model-definitions.controller.ts:159` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: definitionId | `src/modules/read_models/controllers/read-model-definitions.controller.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `read_models.read_model_definitions` | LEE | LEE | DIRECTA | ReadModelDefinitionsController.reconcile → ReadModelDefinitionsService.reconcile → ReadModelDefinitionsService.runRefresh → ReadModelDefinitionsRepository.findById | `src/modules/read_models/repositories/read-model-definitions.repository.ts:99` |
| `read_models.read_model_refresh_runs` | ESCRIBE | CREA | DIRECTA | ReadModelDefinitionsController.reconcile → ReadModelDefinitionsService.reconcile → ReadModelDefinitionsService.runRefresh → ReadModelRefreshRunsRepository.create | `src/modules/read_models/repositories/read-model-refresh-runs.repository.ts:71` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `definitionId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<RefreshRunResponseDto>` · DTO `RefreshRunResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `runId` | `string` | Sí | formato uuid | — | Identificador asociado a run. | sin fuente |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | sin fuente |
| `versionId` | `string` | No | formato uuid | — | Versión redactada, si hubo cambio | sin fuente |
| `versionNumber` | `number` | No | — | — | Número de la versión redactada | sin fuente |
| `contentHash` | `string` | Sí | — | — | Hash del contenido regenerado | sin fuente |
| `unchanged` | `boolean` | Sí | — | — | true si el contenido no cambió y no se redactó versión | sin fuente |
| `inputCount` | `number` | Sí | — | — | Entradas de procedencia registradas | sin fuente |
| `duplicate` | `boolean` | Sí | — | — | true si la corrida ya existía con esa clave | sin fuente |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Read model no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La operación requiere una materialized view; PreconditionFailedException: La versión está retirada; PreconditionFailedException: El nombre físico de la vista no es un identificador SQL válido |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/read_models.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/read_models/controllers/read-model-definitions.controller.spec.ts:63` |

### Flujos

- Módulo 30 · Read Models (Frontend View Contracts & Read Models) — etapa `UC-30-07`

---

## 9. POST /read-models/{definitionId}/refresh

- **Origen:** CONTRATO
- **Nombre:** Refrescar la materialized view (REFRESH CONCURRENTLY, manual)
- **Bloque:** Auditoría y Reporting
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ReadModelDefinitionsController.refresh` — `src/modules/read_models/controllers/read-model-definitions.controller.ts:100`

### Qué es y para qué sirve (negocio)

Refrescar la materialized view (REFRESH CONCURRENTLY, manual). Caso de uso UC-30-03: Refresh manual de la MV (REFRESH CONCURRENTLY). Dentro del módulo (descripción del modelo, en inglés): «Provides frontend-ready, permission-aware read contracts.» Dominio: Auditoría y Reporting.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/read_models/README.md:85`) · MODELO (`Mantra Core Health Context/modules/diagram_30_read_models.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:36`)

### Cómo se atiende (sistema)

`POST /read-models/{definitionId}/refresh` la atiende `ReadModelDefinitionsController.refresh` (src/modules/read_models/controllers/read-model-definitions.controller.ts:100). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `ReadModelDefinitionsService.refresh`. Crea filas en read_models.read_model_refresh_runs. Lee read_models.read_model_definitions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/read_models/controllers/read-model-definitions.controller.ts:100` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: definitionId | `src/modules/read_models/controllers/read-model-definitions.controller.ts:100` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `read_models.read_model_definitions` | LEE | LEE | DIRECTA | ReadModelDefinitionsController.refresh → ReadModelDefinitionsService.refresh → ReadModelDefinitionsService.runRefresh → ReadModelDefinitionsRepository.findById | `src/modules/read_models/repositories/read-model-definitions.repository.ts:99` |
| `read_models.read_model_refresh_runs` | ESCRIBE | CREA | DIRECTA | ReadModelDefinitionsController.refresh → ReadModelDefinitionsService.refresh → ReadModelDefinitionsService.runRefresh → ReadModelRefreshRunsRepository.create | `src/modules/read_models/repositories/read-model-refresh-runs.repository.ts:71` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `definitionId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<RefreshRunResponseDto>` · DTO `RefreshRunResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `runId` | `string` | Sí | formato uuid | — | Identificador asociado a run. | sin fuente |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | sin fuente |
| `versionId` | `string` | No | formato uuid | — | Versión redactada, si hubo cambio | sin fuente |
| `versionNumber` | `number` | No | — | — | Número de la versión redactada | sin fuente |
| `contentHash` | `string` | Sí | — | — | Hash del contenido regenerado | sin fuente |
| `unchanged` | `boolean` | Sí | — | — | true si el contenido no cambió y no se redactó versión | sin fuente |
| `inputCount` | `number` | Sí | — | — | Entradas de procedencia registradas | sin fuente |
| `duplicate` | `boolean` | Sí | — | — | true si la corrida ya existía con esa clave | sin fuente |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Read model no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La operación requiere una materialized view; PreconditionFailedException: La versión está retirada; PreconditionFailedException: El nombre físico de la vista no es un identificador SQL válido |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/read_models.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/read_models/controllers/read-model-definitions.controller.spec.ts:60` |

### Flujos

- Módulo 30 · Read Models (Frontend View Contracts & Read Models) — etapa `UC-30-03`

---

## 10. POST /read-models/definitions

- **Origen:** CONTRATO
- **Nombre:** Registrar y publicar un contrato de read model versionado
- **Bloque:** Auditoría y Reporting
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ReadModelDefinitionsController.createDefinition` — `src/modules/read_models/controllers/read-model-definitions.controller.ts:46`

### Qué es y para qué sirve (negocio)

Registrar y publicar un contrato de read model versionado. Caso de uso UC-30-01: Registrar y publicar un contrato versionado + dependencias upstream. Dentro del módulo (descripción del modelo, en inglés): «Provides frontend-ready, permission-aware read contracts.» Dominio: Auditoría y Reporting.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/read_models/README.md:83`) · MODELO (`Mantra Core Health Context/modules/diagram_30_read_models.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:36`)

### Cómo se atiende (sistema)

`POST /read-models/definitions` la atiende `ReadModelDefinitionsController.createDefinition` (src/modules/read_models/controllers/read-model-definitions.controller.ts:46). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateReadModelDefinitionDto` (21 campos, 7 obligatorios). Delega en `ReadModelDefinitionsService.createDefinition`. Crea filas en read_models.read_model_definitions, read_models.read_model_dependencies. Lee read_models.read_model_definitions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/read_models/controllers/read-model-definitions.controller.ts:46` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `read_models.read_model_definitions` | ESCRIBE | CREA | DIRECTA | ReadModelDefinitionsController.createDefinition → ReadModelDefinitionsService.createDefinition → ReadModelDefinitionsRepository.create | `src/modules/read_models/repositories/read-model-definitions.repository.ts:180` |
| `read_models.read_model_definitions` | LEE | LEE | DIRECTA | ReadModelDefinitionsController.createDefinition → ReadModelDefinitionsService.createDefinition → ReadModelDefinitionsRepository.findBySchemaObjectVersion | `src/modules/read_models/repositories/read-model-definitions.repository.ts:117` |
| `read_models.read_model_dependencies` | ESCRIBE | CREA | DIRECTA | ReadModelDefinitionsController.createDefinition → ReadModelDefinitionsService.createDefinition → ReadModelDependenciesRepository.create | `src/modules/read_models/repositories/read-model-dependencies.repository.ts:61` |

### Cuerpo — DTO `CreateReadModelDefinitionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `schemaName` | `string` | Sí | longitud mínima 1; longitud máxima 128 | `@IsString()` `@MinLength(1)` `@MaxLength(128)` | Esquema físico | `src/modules/read_models/dto/create-read-model-definition.dto.ts:79` |
| `objectName` | `string` | Sí | longitud mínima 1; longitud máxima 128; patrón runtime /^[a-z0-9_]+$/ | `@IsString()` `@MinLength(1)` `@MaxLength(128)` `@Matches(/^[a-z0-9_]+$/, { message: 'objectName debe ser snake_case' })` | Nombre del objeto | `src/modules/read_models/dto/create-read-model-definition.dto.ts:92` |
| `objectType` | `string` | Sí | valores: VIEW, MATERIALIZED_VIEW | `@IsIn(['VIEW', 'MATERIALIZED_VIEW'])` | Tipo de objeto físico | `src/modules/read_models/dto/create-read-model-definition.dto.ts:102` |
| `owningModule` | `string` | No | longitud máxima 128 | `@IsOptional()` `@IsString()` `@MaxLength(128)` | Módulo dueño del contrato | `src/modules/read_models/dto/create-read-model-definition.dto.ts:111` |
| `purposeText` | `string` | No | longitud máxima 2000 | `@IsOptional()` `@IsString()` `@MaxLength(2000)` | Propósito legible del read model | `src/modules/read_models/dto/create-read-model-definition.dto.ts:120` |
| `refreshMode` | `string` | No | valores: CONCURRENT, SCHEDULED | `@IsOptional()` `@IsIn(['CONCURRENT', 'SCHEDULED'])` | Modo de refresh | `src/modules/read_models/dto/create-read-model-definition.dto.ts:131` |
| `maximumStalenessSeconds` | `number` | No | mínimo 0 | `@IsOptional()` `@IsInt()` `@Min(0)` | Máxima antigüedad tolerada en segundos | `src/modules/read_models/dto/create-read-model-definition.dto.ts:142` |
| `defaultPageSize` | `number` | No | mínimo 1 | `@IsOptional()` `@IsInt()` `@Min(1)` | Tamaño de página por defecto | `src/modules/read_models/dto/create-read-model-definition.dto.ts:151` |
| `maximumPageSize` | `number` | No | mínimo 1 | `@IsOptional()` `@IsInt()` `@Min(1)` | Tamaño de página máximo | `src/modules/read_models/dto/create-read-model-definition.dto.ts:160` |
| `stableCursorColumns` | `array<string>` | No | — | `@IsOptional()` `@IsArray()` `@IsString({ each: true })` | Columnas de cursor estable (tie-breaker determinista) | `src/modules/read_models/dto/create-read-model-definition.dto.ts:171` |
| `containsPii` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | La vista contiene PII | `src/modules/read_models/dto/create-read-model-definition.dto.ts:179` |
| `containsPhi` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | La vista contiene PHI | `src/modules/read_models/dto/create-read-model-definition.dto.ts:187` |
| `securityBarrierRequired` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Requiere security barrier | `src/modules/read_models/dto/create-read-model-definition.dto.ts:195` |
| `rowLevelSecurityRequired` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Requiere row-level security | `src/modules/read_models/dto/create-read-model-definition.dto.ts:203` |
| `versionNumber` | `number` | No | mínimo 1 | `@IsOptional()` `@IsInt()` `@Min(1)` | Número de versión inicial (por defecto 1) | `src/modules/read_models/dto/create-read-model-definition.dto.ts:214` |
| `dependencies` | `array<ReadModelDependencyInputDto>` | Sí | — | `@IsArray()` `@ArrayNotEmpty()` `@ValidateNested({ each: true })` `@Type(() => ReadModelDependencyInputDto)` | Dependencias upstream | `src/modules/read_models/dto/create-read-model-definition.dto.ts:227` |
| `dependencies[].sourceSchemaName` | `string` | Sí | longitud mínima 1; longitud máxima 128 | `@IsString()` `@MinLength(1)` `@MaxLength(128)` | Esquema de la fuente upstream | `src/modules/read_models/dto/create-read-model-definition.dto.ts:30` |
| `dependencies[].sourceObjectName` | `string` | Sí | longitud mínima 1; longitud máxima 128 | `@IsString()` `@MinLength(1)` `@MaxLength(128)` | Objeto (tabla/vista) de la fuente upstream | `src/modules/read_models/dto/create-read-model-definition.dto.ts:42` |
| `dependencies[].dependencyType` | `string` | Sí | valores: TABLE, VIEW | `@IsIn(['TABLE', 'VIEW'])` | Tipo de dependencia | `src/modules/read_models/dto/create-read-model-definition.dto.ts:49` |
| `dependencies[].selectedColumns` | `array<string>` | No | — | `@IsOptional()` `@IsArray()` `@IsString({ each: true })` | Columnas seleccionadas de la fuente | `src/modules/read_models/dto/create-read-model-definition.dto.ts:58` |
| `dependencies[].filteringRuleSummary` | `string` | No | longitud máxima 1000 | `@IsOptional()` `@IsString()` `@MaxLength(1000)` | Resumen de la regla de filtrado | `src/modules/read_models/dto/create-read-model-definition.dto.ts:67` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "schemaName": "read_models",
  "objectName": "crm_account_360_v",
  "objectType": "VIEW",
  "dependencies": [
    {
      "sourceSchemaName": "billing",
      "sourceObjectName": "bills",
      "dependencyType": "TABLE"
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "schemaName": "read_models",
  "objectName": "crm_account_360_v",
  "objectType": "VIEW",
  "owningModule": "valor-ejemplo",
  "purposeText": "valor-ejemplo",
  "refreshMode": "CONCURRENT",
  "maximumStalenessSeconds": 1,
  "defaultPageSize": 1,
  "maximumPageSize": 1,
  "stableCursorColumns": [
    "valor-ejemplo"
  ],
  "containsPii": true,
  "containsPhi": true,
  "securityBarrierRequired": true,
  "rowLevelSecurityRequired": true,
  "versionNumber": 1,
  "dependencies": [
    {
      "sourceSchemaName": "billing",
      "sourceObjectName": "bills",
      "dependencyType": "TABLE",
      "selectedColumns": [
        "valor-ejemplo"
      ],
      "filteringRuleSummary": "valor-ejemplo"
    }
  ]
}
```

</details>

### Respuesta — `Promise<ReadModelDefinitionResponseDto>` · DTO `ReadModelDefinitionResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/read_models/dto/read-model-responses.dto.ts:24` |
| `schemaName` | `string` | Sí | — | — | Valor de schema name mantenido por la instancia. | `src/modules/read_models/dto/read-model-responses.dto.ts:30` |
| `objectName` | `string` | Sí | — | — | Valor de object name mantenido por la instancia. | `src/modules/read_models/dto/read-model-responses.dto.ts:36` |
| `versionNumber` | `number` | Sí | — | — | Valor de version number mantenido por la instancia. | `src/modules/read_models/dto/read-model-responses.dto.ts:42` |
| `status` | `string` | Sí | — | — | Estado (concept id) | `src/modules/read_models/dto/read-model-responses.dto.ts:48` |
| `definitionHash` | `string` | Sí | — | — | Hash del DDL/contrato | `src/modules/read_models/dto/read-model-responses.dto.ts:54` |
| `dependencyCount` | `number` | Sí | — | — | Cantidad de dependencias declaradas | `src/modules/read_models/dto/read-model-responses.dto.ts:60` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/read_models/dto/read-model-responses.dto.ts:66` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe esa versión del read model |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/read_models.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/read_models/controllers/read-model-definitions.controller.spec.ts:41` |

### Flujos

- Módulo 30 · Read Models (Frontend View Contracts & Read Models) — etapa `UC-30-01`

---

## 11. DELETE /read-models/definitions/{id}

- **Origen:** CONTRATO
- **Nombre:** Retirar una versión de read model (guarda de FK)
- **Bloque:** Auditoría y Reporting
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ReadModelDefinitionsController.retire` — `src/modules/read_models/controllers/read-model-definitions.controller.ts:195`

### Qué es y para qué sirve (negocio)

Retirar una versión de read model (guarda de FK). Caso de uso UC-30-13: Deprecar (ACTIVE→DEPRECATED) y retirar (guarda de FK). Dentro del módulo (descripción del modelo, en inglés): «Provides frontend-ready, permission-aware read contracts.» Dominio: Auditoría y Reporting.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/read_models/README.md:95`) · MODELO (`Mantra Core Health Context/modules/diagram_30_read_models.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:36`)

### Cómo se atiende (sistema)

`DELETE /read-models/definitions/{id}` la atiende `ReadModelDefinitionsController.retire` (src/modules/read_models/controllers/read-model-definitions.controller.ts:195). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `ReadModelDefinitionsService.retire`. Actualiza read_models.read_model_definitions. Lee read_models.frontend_page_views, read_models.read_model_definitions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/read_models/controllers/read-model-definitions.controller.ts:195` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/read_models/controllers/read-model-definitions.controller.ts:195` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `read_models.frontend_page_views` | LEE | LEE | DIRECTA | ReadModelDefinitionsController.retire → ReadModelDefinitionsService.retire → FrontendPageViewsRepository.countByDefinition | `src/modules/read_models/repositories/frontend-page-views.repository.ts:105` |
| `read_models.read_model_definitions` | ESCRIBE | ACTUALIZA | POR_TIPO | ReadModelDefinitionsController.retire → ReadModelDefinitionsService.retire | `src/modules/read_models/services/read-model-definitions.service.ts:366` |
| `read_models.read_model_definitions` | LEE | LEE | DIRECTA | ReadModelDefinitionsController.retire → ReadModelDefinitionsService.retire → ReadModelDefinitionsRepository.findById | `src/modules/read_models/repositories/read-model-definitions.repository.ts:99` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<OperationResultDto>` · DTO `OperationResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `ok` | `boolean` | Sí | — | — | Indica éxito | `src/modules/read_models/dto/read-model-responses.dto.ts:9` |
| `status` | `string` | No | — | — | Nuevo estado del recurso (concept id) | `src/modules/read_models/dto/read-model-responses.dto.ts:15` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Read model no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: No se puede retirar: hay vistas apuntando a esta versión |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/read_models.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/read_models/controllers/read-model-definitions.controller.spec.ts:73` |

### Flujos

- Módulo 30 · Read Models (Frontend View Contracts & Read Models) — etapa `UC-30-13`

---

## 12. POST /read-models/definitions/{id}/deprecate

- **Origen:** CONTRATO
- **Nombre:** Deprecar una versión de read model
- **Bloque:** Auditoría y Reporting
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ReadModelDefinitionsController.deprecate` — `src/modules/read_models/controllers/read-model-definitions.controller.ts:178`

### Qué es y para qué sirve (negocio)

Deprecar una versión de read model. Caso de uso UC-30-13: Deprecar (ACTIVE→DEPRECATED) y retirar (guarda de FK). Dentro del módulo (descripción del modelo, en inglés): «Provides frontend-ready, permission-aware read contracts.» Dominio: Auditoría y Reporting.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/read_models/README.md:95`) · MODELO (`Mantra Core Health Context/modules/diagram_30_read_models.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:36`)

### Cómo se atiende (sistema)

`POST /read-models/definitions/{id}/deprecate` la atiende `ReadModelDefinitionsController.deprecate` (src/modules/read_models/controllers/read-model-definitions.controller.ts:178). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `ReadModelDefinitionsService.deprecate`. Actualiza read_models.read_model_definitions. Lee read_models.read_model_definitions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/read_models/controllers/read-model-definitions.controller.ts:178` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/read_models/controllers/read-model-definitions.controller.ts:178` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `read_models.read_model_definitions` | ESCRIBE | ACTUALIZA | POR_TIPO | ReadModelDefinitionsController.deprecate → ReadModelDefinitionsService.deprecate | `src/modules/read_models/services/read-model-definitions.service.ts:334` |
| `read_models.read_model_definitions` | LEE | LEE | DIRECTA | ReadModelDefinitionsController.deprecate → ReadModelDefinitionsService.deprecate → ReadModelDefinitionsRepository.findById | `src/modules/read_models/repositories/read-model-definitions.repository.ts:99` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<OperationResultDto>` · DTO `OperationResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `ok` | `boolean` | Sí | — | — | Indica éxito | `src/modules/read_models/dto/read-model-responses.dto.ts:9` |
| `status` | `string` | No | — | — | Nuevo estado del recurso (concept id) | `src/modules/read_models/dto/read-model-responses.dto.ts:15` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Read model no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La versión ya está retirada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/read_models.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/read_models/controllers/read-model-definitions.controller.spec.ts:72` |

### Flujos

- Módulo 30 · Read Models (Frontend View Contracts & Read Models) — etapa `UC-30-13`

---

## 13. POST /read-models/definitions/{schema}/{object}/versions

- **Origen:** CONTRATO
- **Nombre:** Versionar el esquema de un read model
- **Bloque:** Auditoría y Reporting
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ReadModelDefinitionsController.createVersion` — `src/modules/read_models/controllers/read-model-definitions.controller.ts:65`

### Qué es y para qué sirve (negocio)

Versionar el esquema de un read model. Caso de uso UC-30-08: Nueva versión N+1 en DRAFT (anterior sigue ACTIVE). Dentro del módulo (descripción del modelo, en inglés): «Provides frontend-ready, permission-aware read contracts.» Dominio: Auditoría y Reporting.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/read_models/README.md:90`) · MODELO (`Mantra Core Health Context/modules/diagram_30_read_models.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:36`)

### Cómo se atiende (sistema)

`POST /read-models/definitions/{schema}/{object}/versions` la atiende `ReadModelDefinitionsController.createVersion` (src/modules/read_models/controllers/read-model-definitions.controller.ts:65). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateReadModelVersionDto` (12 campos, 5 obligatorios). Delega en `ReadModelDefinitionsService.createVersion`. Crea filas en read_models.read_model_definitions, read_models.read_model_dependencies. Lee read_models.read_model_definitions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/read_models/controllers/read-model-definitions.controller.ts:65` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `read_models.read_model_definitions` | ESCRIBE | CREA | DIRECTA | ReadModelDefinitionsController.createVersion → ReadModelDefinitionsService.createVersion → ReadModelDefinitionsRepository.create | `src/modules/read_models/repositories/read-model-definitions.repository.ts:180` |
| `read_models.read_model_definitions` | LEE | LEE | DIRECTA | ReadModelDefinitionsController.createVersion → ReadModelDefinitionsService.createVersion → ReadModelDefinitionsRepository.findAllBySchemaObject | `src/modules/read_models/repositories/read-model-definitions.repository.ts:130` |
| `read_models.read_model_dependencies` | ESCRIBE | CREA | DIRECTA | ReadModelDefinitionsController.createVersion → ReadModelDefinitionsService.createVersion → ReadModelDependenciesRepository.create | `src/modules/read_models/repositories/read-model-dependencies.repository.ts:61` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `schema` | path | Sí | `string` | — |
| `object` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateReadModelVersionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `objectType` | `string` | Sí | valores: VIEW, MATERIALIZED_VIEW | `@IsIn(['VIEW', 'MATERIALIZED_VIEW'])` | Tipo de objeto físico | `src/modules/read_models/dto/create-read-model-version.dto.ts:32` |
| `refreshMode` | `string` | No | valores: CONCURRENT, SCHEDULED | `@IsOptional()` `@IsIn(['CONCURRENT', 'SCHEDULED'])` | Modo de refresh | `src/modules/read_models/dto/create-read-model-version.dto.ts:43` |
| `maximumStalenessSeconds` | `number` | No | mínimo 0 | `@IsOptional()` `@IsInt()` `@Min(0)` | Máxima antigüedad tolerada en segundos | `src/modules/read_models/dto/create-read-model-version.dto.ts:54` |
| `purposeText` | `string` | No | longitud máxima 2000 | `@IsOptional()` `@IsString()` `@MaxLength(2000)` | Propósito legible del read model | `src/modules/read_models/dto/create-read-model-version.dto.ts:63` |
| `containsPii` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | La vista contiene PII | `src/modules/read_models/dto/create-read-model-version.dto.ts:71` |
| `containsPhi` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | La vista contiene PHI | `src/modules/read_models/dto/create-read-model-version.dto.ts:79` |
| `dependencies` | `array<ReadModelDependencyInputDto>` | Sí | — | `@IsArray()` `@ArrayNotEmpty()` `@ValidateNested({ each: true })` `@Type(() => ReadModelDependencyInputDto)` | Dependencias upstream de la nueva versión | `src/modules/read_models/dto/create-read-model-version.dto.ts:92` |
| `dependencies[].sourceSchemaName` | `string` | Sí | longitud mínima 1; longitud máxima 128 | `@IsString()` `@MinLength(1)` `@MaxLength(128)` | Esquema de la fuente upstream | `src/modules/read_models/dto/create-read-model-definition.dto.ts:30` |
| `dependencies[].sourceObjectName` | `string` | Sí | longitud mínima 1; longitud máxima 128 | `@IsString()` `@MinLength(1)` `@MaxLength(128)` | Objeto (tabla/vista) de la fuente upstream | `src/modules/read_models/dto/create-read-model-definition.dto.ts:42` |
| `dependencies[].dependencyType` | `string` | Sí | valores: TABLE, VIEW | `@IsIn(['TABLE', 'VIEW'])` | Tipo de dependencia | `src/modules/read_models/dto/create-read-model-definition.dto.ts:49` |
| `dependencies[].selectedColumns` | `array<string>` | No | — | `@IsOptional()` `@IsArray()` `@IsString({ each: true })` | Columnas seleccionadas de la fuente | `src/modules/read_models/dto/create-read-model-definition.dto.ts:58` |
| `dependencies[].filteringRuleSummary` | `string` | No | longitud máxima 1000 | `@IsOptional()` `@IsString()` `@MaxLength(1000)` | Resumen de la regla de filtrado | `src/modules/read_models/dto/create-read-model-definition.dto.ts:67` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "objectType": "VIEW",
  "dependencies": [
    {
      "sourceSchemaName": "billing",
      "sourceObjectName": "bills",
      "dependencyType": "TABLE"
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "objectType": "VIEW",
  "refreshMode": "CONCURRENT",
  "maximumStalenessSeconds": 1,
  "purposeText": "valor-ejemplo",
  "containsPii": true,
  "containsPhi": true,
  "dependencies": [
    {
      "sourceSchemaName": "billing",
      "sourceObjectName": "bills",
      "dependencyType": "TABLE",
      "selectedColumns": [
        "valor-ejemplo"
      ],
      "filteringRuleSummary": "valor-ejemplo"
    }
  ]
}
```

</details>

### Respuesta — `Promise<ReadModelDefinitionResponseDto>` · DTO `ReadModelDefinitionResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/read_models/dto/read-model-responses.dto.ts:24` |
| `schemaName` | `string` | Sí | — | — | Valor de schema name mantenido por la instancia. | `src/modules/read_models/dto/read-model-responses.dto.ts:30` |
| `objectName` | `string` | Sí | — | — | Valor de object name mantenido por la instancia. | `src/modules/read_models/dto/read-model-responses.dto.ts:36` |
| `versionNumber` | `number` | Sí | — | — | Valor de version number mantenido por la instancia. | `src/modules/read_models/dto/read-model-responses.dto.ts:42` |
| `status` | `string` | Sí | — | — | Estado (concept id) | `src/modules/read_models/dto/read-model-responses.dto.ts:48` |
| `definitionHash` | `string` | Sí | — | — | Hash del DDL/contrato | `src/modules/read_models/dto/read-model-responses.dto.ts:54` |
| `dependencyCount` | `number` | Sí | — | — | Cantidad de dependencias declaradas | `src/modules/read_models/dto/read-model-responses.dto.ts:60` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/read_models/dto/read-model-responses.dto.ts:66` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: No existe una versión previa del read model |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: No hay una versión ACTIVE previa que respalde el corte de versión |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/read_models.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/read_models/controllers/read-model-definitions.controller.spec.ts:49` |

### Flujos

- Módulo 30 · Read Models (Frontend View Contracts & Read Models) — etapa `UC-30-08`

---

## 14. GET /read-models/health

- **Origen:** CONTRATO
- **Nombre:** Detectar y reportar staleness/degradación de las MV
- **Bloque:** Auditoría y Reporting
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ReadModelDefinitionsController.health` — `src/modules/read_models/controllers/read-model-definitions.controller.ts:90`

### Qué es y para qué sirve (negocio)

Detectar y reportar staleness/degradación de las MV. Caso de uso UC-30-12: Detectar staleness/degradación de las MV. Dentro del módulo (descripción del modelo, en inglés): «Provides frontend-ready, permission-aware read contracts.» Dominio: Auditoría y Reporting.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/read_models/README.md:94`) · MODELO (`Mantra Core Health Context/modules/diagram_30_read_models.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:36`)

### Cómo se atiende (sistema)

`GET /read-models/health` la atiende `ReadModelDefinitionsController.health` (src/modules/read_models/controllers/read-model-definitions.controller.ts:90). Exige sesión con alguno de los roles SYSTEM, SECURITY_ADMIN. Delega en `ReadModelDefinitionsService.health`. Lee read_models.read_model_definitions, read_models.read_model_refresh_runs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, SECURITY_ADMIN | `src/modules/read_models/controllers/read-model-definitions.controller.ts:90` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `read_models.read_model_definitions` | LEE | LEE | DIRECTA | ReadModelDefinitionsController.health → ReadModelDefinitionsService.health → ReadModelDefinitionsRepository.findAllNotRetired | `src/modules/read_models/repositories/read-model-definitions.repository.ts:164` |
| `read_models.read_model_refresh_runs` | LEE | LEE | DIRECTA | ReadModelDefinitionsController.health → ReadModelDefinitionsService.health → ReadModelRefreshRunsRepository.findLatestByDefinition | `src/modules/read_models/repositories/read-model-refresh-runs.repository.ts:56` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ReadModelHealthResponseDto>` · DTO `ReadModelHealthResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `generatedAt` | `string` | Sí | formato date-time | — | Valor de generated at mantenido por la instancia. | `src/modules/read_models/dto/read-model-responses.dto.ts:361` |
| `items` | `array<ReadModelHealthItemDto>` | Sí | — | — | Valor de items mantenido por la instancia. | `src/modules/read_models/dto/read-model-responses.dto.ts:367` |
| `items[].definitionId` | `string` | Sí | formato uuid | — | Identificador asociado a definition. | `src/modules/read_models/dto/read-model-responses.dto.ts:322` |
| `items[].schemaName` | `string` | Sí | — | — | Valor de schema name mantenido por la instancia. | `src/modules/read_models/dto/read-model-responses.dto.ts:328` |
| `items[].objectName` | `string` | Sí | — | — | Valor de object name mantenido por la instancia. | `src/modules/read_models/dto/read-model-responses.dto.ts:334` |
| `items[].lastRefreshedAt` | `string` | No | formato date-time; admite null | — | Valor de last refreshed at mantenido por la instancia. | `src/modules/read_models/dto/read-model-responses.dto.ts:340` |
| `items[].stalenessSeconds` | `number` | Sí | — | — | Valor de staleness seconds mantenido por la instancia. | `src/modules/read_models/dto/read-model-responses.dto.ts:346` |
| `items[].stale` | `boolean` | Sí | — | — | Excede maximum_staleness_seconds | `src/modules/read_models/dto/read-model-responses.dto.ts:352` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/read_models.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/read_models/controllers/read-model-definitions.controller.spec.ts:81` |

### Flujos

- Módulo 30 · Read Models (Frontend View Contracts & Read Models) — etapa `UC-30-12`

---

## 15. PUT /views/{frontendPageViewId}/preferences

- **Origen:** CONTRATO
- **Nombre:** Guardar preferencias de vista del usuario
- **Bloque:** Auditoría y Reporting
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `FrontendViewsController.upsertPreferences` — `src/modules/read_models/controllers/frontend-views.controller.ts:139`

### Qué es y para qué sirve (negocio)

Guardar preferencias de vista del usuario. Caso de uso UC-30-09: Preferencias de vista (validadas contra el allow-list). Dentro del módulo (descripción del modelo, en inglés): «Provides frontend-ready, permission-aware read contracts.» Dominio: Auditoría y Reporting.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/read_models/README.md:91`) · MODELO (`Mantra Core Health Context/modules/diagram_30_read_models.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:36`)

### Cómo se atiende (sistema)

`PUT /views/{frontendPageViewId}/preferences` la atiende `FrontendViewsController.upsertPreferences` (src/modules/read_models/controllers/frontend-views.controller.ts:139). Exige sesión; el controlador no declara roles. Valida el cuerpo como `UpsertViewPreferencesDto` (7 campos, 0 obligatorios). Delega en `FrontendViewsService.upsertPreferences`. Crea filas en read_models.user_view_preferences. Actualiza read_models.user_view_preferences. Lee read_models.frontend_page_views, read_models.frontend_view_fields, read_models.user_view_preferences.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/read_models/controllers/frontend-views.controller.ts:139` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: frontendPageViewId | `src/modules/read_models/controllers/frontend-views.controller.ts:139` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `read_models.frontend_page_views` | LEE | LEE | DIRECTA | FrontendViewsController.upsertPreferences → FrontendViewsService.upsertPreferences → FrontendPageViewsRepository.findById | `src/modules/read_models/repositories/frontend-page-views.repository.ts:81` |
| `read_models.frontend_view_fields` | LEE | LEE | DIRECTA | FrontendViewsController.upsertPreferences → FrontendViewsService.upsertPreferences → FrontendViewChildrenRepository.listFields | `src/modules/read_models/repositories/frontend-view-children.repository.ts:380` |
| `read_models.user_view_preferences` | ESCRIBE | ACTUALIZA | POR_TIPO | FrontendViewsController.upsertPreferences → FrontendViewsService.upsertPreferences | `src/modules/read_models/services/frontend-views.service.ts:488` |
| `read_models.user_view_preferences` | ESCRIBE | CREA | DIRECTA | FrontendViewsController.upsertPreferences → FrontendViewsService.upsertPreferences → UserViewPreferencesRepository.create | `src/modules/read_models/repositories/user-view-preferences.repository.ts:85` |
| `read_models.user_view_preferences` | LEE | LEE | DIRECTA | FrontendViewsController.upsertPreferences → FrontendViewsService.upsertPreferences → UserViewPreferencesRepository.findByUserAndView | `src/modules/read_models/repositories/user-view-preferences.repository.ts:70` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `frontendPageViewId` | path | Sí | `string` | — |

### Cuerpo — DTO `UpsertViewPreferencesDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `visibleFields` | `array<string>` | No | — | `@IsOptional()` `@IsArray()` `@IsString({ each: true })` | Campos visibles (subconjunto del allow-list del contrato) | `src/modules/read_models/dto/upsert-view-preferences.dto.ts:24` |
| `fieldOrder` | `array<string>` | No | — | `@IsOptional()` `@IsArray()` `@IsString({ each: true })` | Orden de campos | `src/modules/read_models/dto/upsert-view-preferences.dto.ts:33` |
| `activeFilter` | `object` | No | — | `@IsOptional()` | Filtros activos (mapa código -> valor) | `src/modules/read_models/dto/upsert-view-preferences.dto.ts:42` |
| `sortCode` | `string` | No | longitud máxima 128 | `@IsOptional()` `@IsString()` `@MaxLength(128)` | Código de orden preferido | `src/modules/read_models/dto/upsert-view-preferences.dto.ts:51` |
| `density` | `string` | No | valores: COMPACT, COMFORTABLE | `@IsOptional()` `@IsIn(['COMPACT', 'COMFORTABLE'])` | Densidad | `src/modules/read_models/dto/upsert-view-preferences.dto.ts:62` |
| `pageSize` | `number` | No | mínimo 1; máximo 500 | `@IsOptional()` `@IsInt()` `@Min(1)` `@Max(500)` | Tamaño de página preferido | `src/modules/read_models/dto/upsert-view-preferences.dto.ts:72` |
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsString()` | Tenant al que se asocia la preferencia | `src/modules/read_models/dto/upsert-view-preferences.dto.ts:83` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "visibleFields": [
    "valor-ejemplo"
  ],
  "fieldOrder": [
    "valor-ejemplo"
  ],
  "activeFilter": {},
  "sortCode": "CODIGO_EJEMPLO",
  "density": "COMPACT",
  "pageSize": 1,
  "tenantId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<ViewPreferencesResponseDto>` · DTO `ViewPreferencesResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/read_models/dto/read-model-responses.dto.ts:171` |
| `frontendPageViewId` | `string` | Sí | formato uuid | — | Identificador asociado a frontend page view. | `src/modules/read_models/dto/read-model-responses.dto.ts:177` |
| `created` | `boolean` | Sí | — | — | Se creó (true) o se actualizó (false) | `src/modules/read_models/dto/read-model-responses.dto.ts:183` |
| `status` | `string` | Sí | — | — | Estado (concept id) | `src/modules/read_models/dto/read-model-responses.dto.ts:189` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Vista no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La vista no está ACTIVE; PreconditionFailedException: visibleFields contiene columnas fuera del contrato |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/read_models.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/read_models/controllers/frontend-views.controller.spec.ts:105` |

### Flujos

- Módulo 30 · Read Models (Frontend View Contracts & Read Models) — etapa `UC-30-09`

---

