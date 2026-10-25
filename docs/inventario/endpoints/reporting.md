<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `reporting`

- **Bloque:** Auditoría y Reporting (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:36`)
- **Operaciones:** 12 (12 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 0 · MEDIO 12 · BAJO 0
- **Tablas distintas que tocan:** 12
- **Respuestas de error y detalle contractual:** `openapi/endpoints/reporting.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | POST | `/reporting/dashboards` | Componer un tablero con sus widgets | MEDIO | 4 | REPORTING_ADMIN, REPORT_AUTHOR |
| 2 | POST | `/reporting/data-sources` | Registrar una fuente de datos gobernada | MEDIO | 2 | REPORTING_ADMIN, DATA_STEWARD |
| 3 | POST | `/reporting/definitions` | Autorar una definición con sus parámetros y columnas | MEDIO | 5 | REPORTING_ADMIN, REPORT_AUTHOR |
| 4 | POST | `/reporting/definitions/{id}/deprecate` | Deprecar la definición y suspender sus programaciones | MEDIO | 3 | REPORTING_ADMIN |
| 5 | POST | `/reporting/definitions/{id}/executions` | Encolar una corrida parametrizada | MEDIO | 4 | REPORTING_ADMIN, REPORT_VIEWER |
| 6 | POST | `/reporting/definitions/{id}/schedules` | Programar la distribución periódica del reporte | MEDIO | 3 | REPORTING_ADMIN, REPORT_AUTHOR |
| 7 | POST | `/reporting/definitions/{id}/versions/publish` | Publicar una versión del reporte | MEDIO | 4 | REPORTING_ADMIN, REPORT_AUTHOR |
| 8 | POST | `/reporting/executions/{id}/distributions` | Crear las distribuciones del reporte por destinatario | MEDIO | 4 | SYSTEM, REPORTING_ADMIN |
| 9 | POST | `/reporting/executions/{id}/retry` | Devolver a la cola una corrida fallida | MEDIO | 4 | SYSTEM, REPORTING_ADMIN |
| 10 | POST | `/reporting/executions/{id}/snapshot` | Registrar el artefacto materializado y cerrar la corrida | MEDIO | 3 | SYSTEM |
| 11 | POST | `/reporting/scheduler/tick` | Disparar las programaciones vencidas | MEDIO | 5 | SYSTEM |
| 12 | POST | `/reporting/schedules/{id}/subscriptions` | Suscribirse a una programación | MEDIO | 4 | REPORT_VIEWER, REPORTING_ADMIN |

---

## 1. POST /reporting/dashboards

- **Origen:** CONTRATO
- **Nombre:** Componer un tablero con sus widgets
- **Bloque:** Auditoría y Reporting
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ReportingController.createDashboard` — `src/modules/reporting/controllers/reporting.controller.ts:250`

### Qué es y para qué sirve (negocio)

Componer un tablero con sus widgets. Caso de uso UC-39-10: Componer tablero con widgets. Dentro del módulo (descripción del modelo, en inglés): «A configuration-driven reporting engine so the application supports dynamic reports without code changes.» Dominio: Auditoría y Reporting.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/reporting/README.md:51`) · MODELO (`Mantra Core Health Context/modules/diagram_39_reporting.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:36`)

### Cómo se atiende (sistema)

`POST /reporting/dashboards` la atiende `ReportingController.createDashboard` (src/modules/reporting/controllers/reporting.controller.ts:250). Exige sesión con alguno de los roles REPORTING_ADMIN, REPORT_AUTHOR. Valida el cuerpo como `CreateDashboardDto` (13 campos, 5 obligatorios). Delega en `ReportingDefinitionsService.createDashboard`. Crea filas en reporting.dashboard_widgets, reporting.dashboards. Lee reporting.dashboards, reporting.report_definitions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: REPORTING_ADMIN, REPORT_AUTHOR | `src/modules/reporting/controllers/reporting.controller.ts:250` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `reporting.dashboard_widgets` | ESCRIBE | CREA | DIRECTA | ReportingController.createDashboard → ReportingDefinitionsService.createDashboard → ReportingDefinitionsRepository.createWidget | `src/modules/reporting/repositories/reporting-definitions.repository.ts:612` |
| `reporting.dashboards` | ESCRIBE | CREA | DIRECTA | ReportingController.createDashboard → ReportingDefinitionsService.createDashboard → ReportingDefinitionsRepository.createDashboard | `src/modules/reporting/repositories/reporting-definitions.repository.ts:534` |
| `reporting.dashboards` | LEE | LEE | DIRECTA | ReportingController.createDashboard → ReportingDefinitionsService.createDashboard → ReportingDefinitionsRepository.findDashboardByCode | `src/modules/reporting/repositories/reporting-definitions.repository.ts:561` |
| `reporting.report_definitions` | LEE | LEE | DIRECTA | ReportingController.createDashboard → ReportingDefinitionsService.createDashboard → ReportingDefinitionsRepository.findDefinitionById | `src/modules/reporting/repositories/reporting-definitions.repository.ts:225` |

### Cuerpo — DTO `CreateDashboardDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/reporting/dto/reporting.dto.ts:1006` |
| `code` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Código del tablero, único | `src/modules/reporting/dto/reporting.dto.ts:1014` |
| `name` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | — | `src/modules/reporting/dto/reporting.dto.ts:1022` |
| `description` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/reporting/dto/reporting.dto.ts:1030` |
| `layoutJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Retícula del tablero | `src/modules/reporting/dto/reporting.dto.ts:1038` |
| `requiredPermissionId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/reporting/dto/reporting.dto.ts:1046` |
| `widgets` | `array<DashboardWidgetDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => DashboardWidgetDto)` | Widgets del tablero, al menos uno | `src/modules/reporting/dto/reporting.dto.ts:1059` |
| `widgets[].reportDefinitionId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Reporte del que se alimenta el widget | `src/modules/reporting/dto/reporting.dto.ts:953` |
| `widgets[].widgetType` | `string` | Sí | valores: CHART, TABLE, METRIC | `@IsIn(WIDGET_TYPES)` | — | `src/modules/reporting/dto/reporting.dto.ts:960` |
| `widgets[].title` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | — | `src/modules/reporting/dto/reporting.dto.ts:968` |
| `widgets[].visualization` | `string` | No | valores: BAR, LINE, PIE | `@IsOptional()` `@IsIn(VISUALIZATIONS)` | Obligatoria si el widget es CHART | `src/modules/reporting/dto/reporting.dto.ts:979` |
| `widgets[].configJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Configuración del widget | `src/modules/reporting/dto/reporting.dto.ts:987` |
| `widgets[].positionJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Posición en la retícula del tablero | `src/modules/reporting/dto/reporting.dto.ts:995` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "widgets": [
    {
      "widgetType": "CHART",
      "title": "valor-ejemplo"
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "description": "Texto descriptivo de ejemplo",
  "layoutJson": {},
  "requiredPermissionId": "00000000-0000-4000-8000-000000000001",
  "widgets": [
    {
      "reportDefinitionId": "00000000-0000-4000-8000-000000000001",
      "widgetType": "CHART",
      "title": "valor-ejemplo",
      "visualization": "BAR",
      "configJson": {},
      "positionJson": {}
    }
  ]
}
```

</details>

### Respuesta — `Promise<DashboardResponseDto>` · DTO `DashboardResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/reporting/dto/reporting.dto.ts:1070` |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/reporting/dto/reporting.dto.ts:1076` |
| `stateConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a state concept. | `src/modules/reporting/dto/reporting.dto.ts:1082` |
| `widgetIds` | `array<string>` | Sí | formato uuid | — | Valor de widget ids mantenido por la instancia. | `src/modules/reporting/dto/reporting.dto.ts:1088` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe un tablero con ese código |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Un widget CHART necesita su tipo de gráfico; PreconditionFailedException: El widget apunta a un reporte deprecado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/reporting.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/reporting/controllers/reporting.controller.spec.ts:155` |

### Flujos

- Módulo 39 — Reportes, Distribución y Tableros — etapa `UC-39-10`

---

## 2. POST /reporting/data-sources

- **Origen:** CONTRATO
- **Nombre:** Registrar una fuente de datos gobernada
- **Bloque:** Auditoría y Reporting
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ReportingController.createDataSource` — `src/modules/reporting/controllers/reporting.controller.ts:62`

### Qué es y para qué sirve (negocio)

Registrar una fuente de datos gobernada. Caso de uso UC-39-01: Registrar fuente gobernada. Dentro del módulo (descripción del modelo, en inglés): «A configuration-driven reporting engine so the application supports dynamic reports without code changes.» Dominio: Auditoría y Reporting.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/reporting/README.md:42`) · MODELO (`Mantra Core Health Context/modules/diagram_39_reporting.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:36`)

### Cómo se atiende (sistema)

`POST /reporting/data-sources` la atiende `ReportingController.createDataSource` (src/modules/reporting/controllers/reporting.controller.ts:62). Exige sesión con alguno de los roles REPORTING_ADMIN, DATA_STEWARD. Valida el cuerpo como `CreateDataSourceDto` (8 campos, 3 obligatorios). Delega en `ReportingDefinitionsService.createDataSource`. Crea filas en reporting.report_data_sources. Lee reporting.report_data_sources.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: REPORTING_ADMIN, DATA_STEWARD | `src/modules/reporting/controllers/reporting.controller.ts:62` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `reporting.report_data_sources` | ESCRIBE | CREA | DIRECTA | ReportingController.createDataSource → ReportingDefinitionsService.createDataSource → ReportingDefinitionsRepository.createDataSource | `src/modules/reporting/repositories/reporting-definitions.repository.ts:134` |
| `reporting.report_data_sources` | LEE | LEE | DIRECTA | ReportingController.createDataSource → ReportingDefinitionsService.createDataSource → ReportingDefinitionsRepository.findDataSourceByCode | `src/modules/reporting/repositories/reporting-definitions.repository.ts:177` |

### Cuerpo — DTO `CreateDataSourceDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/reporting/dto/reporting.dto.ts:39` |
| `code` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Código de la fuente, único | `src/modules/reporting/dto/reporting.dto.ts:47` |
| `name` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | — | `src/modules/reporting/dto/reporting.dto.ts:55` |
| `sourceType` | `string` | Sí | valores: READ_MODEL, VIEW | `@IsIn(['READ_MODEL', 'VIEW'])` | — | `src/modules/reporting/dto/reporting.dto.ts:62` |
| `readModelDefinitionId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Read model gobernado; obligatorio si el tipo es READ_MODEL | `src/modules/reporting/dto/reporting.dto.ts:73` |
| `viewName` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Vista de base de datos; obligatoria si el tipo es VIEW | `src/modules/reporting/dto/reporting.dto.ts:85` |
| `specJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Especificación de la fuente | `src/modules/reporting/dto/reporting.dto.ts:93` |
| `rowSecurityJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Reglas de seguridad por fila que la fuente impone a toda consulta | `src/modules/reporting/dto/reporting.dto.ts:104` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "sourceType": "READ_MODEL"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "sourceType": "READ_MODEL",
  "readModelDefinitionId": "00000000-0000-4000-8000-000000000001",
  "viewName": "Nombre de ejemplo",
  "specJson": {},
  "rowSecurityJson": {}
}
```

</details>

### Respuesta — `Promise<DataSourceResponseDto>` · DTO `DataSourceResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/reporting/dto/reporting.dto.ts:115` |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/reporting/dto/reporting.dto.ts:121` |
| `stateConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a state concept. | `src/modules/reporting/dto/reporting.dto.ts:127` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe una fuente con ese código |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Una fuente READ_MODEL necesita su read model gobernado; PreconditionFailedException: Una fuente VIEW necesita el nombre de la vista |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/reporting.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/reporting/controllers/reporting.controller.spec.ts:53` |

### Flujos

- Módulo 39 — Reportes, Distribución y Tableros — etapa `UC-39-01`

---

## 3. POST /reporting/definitions

- **Origen:** CONTRATO
- **Nombre:** Autorar una definición con sus parámetros y columnas
- **Bloque:** Auditoría y Reporting
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ReportingController.createDefinition` — `src/modules/reporting/controllers/reporting.controller.ts:83`

### Qué es y para qué sirve (negocio)

Autorar una definición con sus parámetros y columnas. Caso de uso UC-39-02: Autorar definición con parámetros y columnas. Dentro del módulo (descripción del modelo, en inglés): «A configuration-driven reporting engine so the application supports dynamic reports without code changes.» Dominio: Auditoría y Reporting.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/reporting/README.md:43`) · MODELO (`Mantra Core Health Context/modules/diagram_39_reporting.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:36`)

### Cómo se atiende (sistema)

`POST /reporting/definitions` la atiende `ReportingController.createDefinition` (src/modules/reporting/controllers/reporting.controller.ts:83). Exige sesión con alguno de los roles REPORTING_ADMIN, REPORT_AUTHOR. Valida el cuerpo como `CreateDefinitionDto` (25 campos, 6 obligatorios). Delega en `ReportingDefinitionsService.createDefinition`. Crea filas en reporting.report_columns, reporting.report_definitions, reporting.report_parameters. Lee reporting.report_data_sources, reporting.report_definitions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: REPORTING_ADMIN, REPORT_AUTHOR | `src/modules/reporting/controllers/reporting.controller.ts:83` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `reporting.report_columns` | ESCRIBE | CREA | DIRECTA | ReportingController.createDefinition → ReportingDefinitionsService.createDefinition → ReportingDefinitionsRepository.createColumn | `src/modules/reporting/repositories/reporting-definitions.repository.ts:389` |
| `reporting.report_data_sources` | LEE | LEE | DIRECTA | ReportingController.createDefinition → ReportingDefinitionsService.createDefinition → ReportingDefinitionsRepository.findDataSourceById | `src/modules/reporting/repositories/reporting-definitions.repository.ts:163` |
| `reporting.report_definitions` | ESCRIBE | CREA | DIRECTA | ReportingController.createDefinition → ReportingDefinitionsService.createDefinition → ReportingDefinitionsRepository.createDefinition | `src/modules/reporting/repositories/reporting-definitions.repository.ts:193` |
| `reporting.report_definitions` | LEE | LEE | DIRECTA | ReportingController.createDefinition → ReportingDefinitionsService.createDefinition → ReportingDefinitionsRepository.findDefinitionByCode | `src/modules/reporting/repositories/reporting-definitions.repository.ts:257` |
| `reporting.report_parameters` | ESCRIBE | CREA | DIRECTA | ReportingController.createDefinition → ReportingDefinitionsService.createDefinition → ReportingDefinitionsRepository.createParameter | `src/modules/reporting/repositories/reporting-definitions.repository.ts:308` |

### Cuerpo — DTO `CreateDefinitionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/reporting/dto/reporting.dto.ts:269` |
| `code` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Código del reporte, único | `src/modules/reporting/dto/reporting.dto.ts:277` |
| `name` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | — | `src/modules/reporting/dto/reporting.dto.ts:285` |
| `description` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/reporting/dto/reporting.dto.ts:293` |
| `category` | `string` | No | valores: CLINICAL, FINANCIAL, OPERATIONAL | `@IsOptional()` `@IsIn(REPORT_CATEGORIES)` | — | `src/modules/reporting/dto/reporting.dto.ts:301` |
| `dataSourceId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/reporting/dto/reporting.dto.ts:308` |
| `querySpecJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Consulta que ejecuta el reporte | `src/modules/reporting/dto/reporting.dto.ts:316` |
| `defaultOutputFormat` | `string` | No | valores: CSV, XLSX, PDF, JSON | `@IsOptional()` `@IsIn(OUTPUT_FORMATS)` | — | `src/modules/reporting/dto/reporting.dto.ts:324` |
| `requiredPermissionId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Permiso exigido para ejecutarlo; obligatorio si no es público | `src/modules/reporting/dto/reporting.dto.ts:336` |
| `isPublic` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | — | `src/modules/reporting/dto/reporting.dto.ts:344` |
| `parameters` | `array<ReportParameterDto>` | No | — | `@IsOptional()` `@IsArray()` `@ValidateNested({ each: true })` `@Type(() => ReportParameterDto)` | — | `src/modules/reporting/dto/reporting.dto.ts:354` |
| `parameters[].code` | `string` | No | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Código del parámetro | `src/modules/reporting/dto/reporting.dto.ts:152` |
| `parameters[].name` | `string` | No | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | — | `src/modules/reporting/dto/reporting.dto.ts:160` |
| `parameters[].dataType` | `string` | No | longitud máxima 50 | `@IsString()` `@MaxLength(50)` | Tipo técnico del valor | `src/modules/reporting/dto/reporting.dto.ts:168` |
| `parameters[].required` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | — | `src/modules/reporting/dto/reporting.dto.ts:176` |
| `parameters[].defaultValueJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Valor por defecto | `src/modules/reporting/dto/reporting.dto.ts:184` |
| `parameters[].valueSetId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Conjunto de valores admitidos | `src/modules/reporting/dto/reporting.dto.ts:195` |
| `columns` | `array<ReportColumnDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => ReportColumnDto)` | Columnas del reporte, al menos una | `src/modules/reporting/dto/reporting.dto.ts:367` |
| `columns[].code` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/reporting/dto/reporting.dto.ts:208` |
| `columns[].label` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Etiqueta que se muestra | `src/modules/reporting/dto/reporting.dto.ts:216` |
| `columns[].expression` | `string` | No | — | `@IsOptional()` `@IsString()` | Expresión que calcula la columna | `src/modules/reporting/dto/reporting.dto.ts:224` |
| `columns[].dataType` | `string` | No | longitud máxima 50 | `@IsOptional()` `@IsString()` `@MaxLength(50)` | — | `src/modules/reporting/dto/reporting.dto.ts:233` |
| `columns[].aggregation` | `string` | No | valores: SUM, AVG, COUNT, MIN, MAX | `@IsOptional()` `@IsIn(AGGREGATIONS)` | — | `src/modules/reporting/dto/reporting.dto.ts:241` |
| `columns[].formatMask` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Máscara de formato | `src/modules/reporting/dto/reporting.dto.ts:250` |
| `columns[].isVisible` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | — | `src/modules/reporting/dto/reporting.dto.ts:258` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "dataSourceId": "00000000-0000-4000-8000-000000000001",
  "columns": [
    {
      "code": "CODIGO_EJEMPLO",
      "label": "valor-ejemplo"
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "description": "Texto descriptivo de ejemplo",
  "category": "CLINICAL",
  "dataSourceId": "00000000-0000-4000-8000-000000000001",
  "querySpecJson": {},
  "defaultOutputFormat": "CSV",
  "requiredPermissionId": "00000000-0000-4000-8000-000000000001",
  "isPublic": false,
  "parameters": [
    {
      "code": "CODIGO_EJEMPLO",
      "name": "Nombre de ejemplo",
      "dataType": "valor-ejemplo",
      "required": false,
      "defaultValueJson": {},
      "valueSetId": "00000000-0000-4000-8000-000000000001"
    }
  ],
  "columns": [
    {
      "code": "CODIGO_EJEMPLO",
      "label": "valor-ejemplo",
      "expression": "valor-ejemplo",
      "dataType": "valor-ejemplo",
      "aggregation": "SUM",
      "formatMask": "valor-ejemplo",
      "isVisible": true
    }
  ]
}
```

</details>

### Respuesta — `Promise<DefinitionResponseDto>` · DTO `DefinitionResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/reporting/dto/reporting.dto.ts:378` |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/reporting/dto/reporting.dto.ts:384` |
| `stateConceptId` | `string` | Sí | formato uuid | — | La definición nace en borrador | `src/modules/reporting/dto/reporting.dto.ts:393` |
| `parameterIds` | `array<string>` | Sí | formato uuid | — | Valor de parameter ids mantenido por la instancia. | `src/modules/reporting/dto/reporting.dto.ts:399` |
| `columnIds` | `array<string>` | Sí | formato uuid | — | Valor de column ids mantenido por la instancia. | `src/modules/reporting/dto/reporting.dto.ts:405` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe una definición con ese código |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Un reporte no público necesita declarar el permiso que exige; PreconditionFailedException: El código de {kind} está repetido; PreconditionFailedException: La fuente de datos no está activa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/reporting.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/reporting/controllers/reporting.controller.spec.ts:66` |

### Flujos

- Módulo 39 — Reportes, Distribución y Tableros — etapa `UC-39-02`

---

## 4. POST /reporting/definitions/{id}/deprecate

- **Origen:** CONTRATO
- **Nombre:** Deprecar la definición y suspender sus programaciones
- **Bloque:** Auditoría y Reporting
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ReportingController.deprecateDefinition` — `src/modules/reporting/controllers/reporting.controller.ts:288`

### Qué es y para qué sirve (negocio)

Deprecar la definición y suspender sus programaciones. Caso de uso UC-39-12: Deprecar definición. Dentro del módulo (descripción del modelo, en inglés): «A configuration-driven reporting engine so the application supports dynamic reports without code changes.» Dominio: Auditoría y Reporting.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/reporting/README.md:53`) · MODELO (`Mantra Core Health Context/modules/diagram_39_reporting.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:36`)

### Cómo se atiende (sistema)

`POST /reporting/definitions/{id}/deprecate` la atiende `ReportingController.deprecateDefinition` (src/modules/reporting/controllers/reporting.controller.ts:288). Exige sesión con alguno de los roles REPORTING_ADMIN. Valida el cuerpo como `DeprecateDefinitionDto` (1 campo, 1 obligatorio). Delega en `ReportingDefinitionsService.deprecateDefinition`. Actualiza reporting.report_schedules. Lee reporting.report_definitions, reporting.report_schedules.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: REPORTING_ADMIN | `src/modules/reporting/controllers/reporting.controller.ts:288` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/reporting/controllers/reporting.controller.ts:288` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `reporting.report_definitions` | LEE | LEE | DIRECTA | ReportingController.deprecateDefinition → ReportingDefinitionsService.deprecateDefinition → ReportingDefinitionsRepository.findDefinitionForUpdate | `src/modules/reporting/repositories/reporting-definitions.repository.ts:239` |
| `reporting.report_schedules` | ESCRIBE | ACTUALIZA | POR_TIPO | ReportingController.deprecateDefinition → ReportingDefinitionsService.deprecateDefinition | `src/modules/reporting/services/reporting-definitions.service.ts:497` |
| `reporting.report_schedules` | LEE | LEE | DIRECTA | ReportingController.deprecateDefinition → ReportingDefinitionsService.deprecateDefinition → ReportingRunsRepository.findSchedulesByDefinitionForUpdate | `src/modules/reporting/repositories/reporting-runs.repository.ts:335` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `DeprecateDefinitionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reason` | `string` | Sí | — | `@IsString()` | Por qué se deja de usar el reporte | `src/modules/reporting/dto/reporting.dto.ts:1144` |

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

### Respuesta — `Promise<DeprecateDefinitionResponseDto>` · DTO `DeprecateDefinitionResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/reporting/dto/reporting.dto.ts:1155` |
| `stateConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a state concept. | `src/modules/reporting/dto/reporting.dto.ts:1161` |
| `schedulesSuspended` | `number` | Sí | — | — | Programaciones suspendidas junto con la definición | `src/modules/reporting/dto/reporting.dto.ts:1169` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: La definición ya está deprecada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/reporting.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/reporting/controllers/reporting.controller.spec.ts:178` |

### Flujos

- Módulo 39 — Reportes, Distribución y Tableros — etapa `UC-39-12`

---

## 5. POST /reporting/definitions/{id}/executions

- **Origen:** CONTRATO
- **Nombre:** Encolar una corrida parametrizada
- **Bloque:** Auditoría y Reporting
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ReportingController.createExecution` — `src/modules/reporting/controllers/reporting.controller.ts:125`

### Qué es y para qué sirve (negocio)

Encolar una corrida parametrizada. Caso de uso UC-39-04: Encolar corrida parametrizada. Dentro del módulo (descripción del modelo, en inglés): «A configuration-driven reporting engine so the application supports dynamic reports without code changes.» Dominio: Auditoría y Reporting.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/reporting/README.md:45`) · MODELO (`Mantra Core Health Context/modules/diagram_39_reporting.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:36`)

### Cómo se atiende (sistema)

`POST /reporting/definitions/{id}/executions` la atiende `ReportingController.createExecution` (src/modules/reporting/controllers/reporting.controller.ts:125). Exige sesión con alguno de los roles REPORTING_ADMIN, REPORT_VIEWER. Valida el cuerpo como `CreateExecutionDto` (3 campos, 0 obligatorios). Delega en `ReportingRunsService.createExecution`. Crea filas en reporting.report_executions. Lee reporting.report_definitions, reporting.report_parameters, reporting.report_versions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: REPORTING_ADMIN, REPORT_VIEWER | `src/modules/reporting/controllers/reporting.controller.ts:125` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/reporting/controllers/reporting.controller.ts:125` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `reporting.report_definitions` | LEE | LEE | DIRECTA | ReportingController.createExecution → ReportingRunsService.createExecution → ReportingDefinitionsRepository.findDefinitionById | `src/modules/reporting/repositories/reporting-definitions.repository.ts:225` |
| `reporting.report_executions` | ESCRIBE | CREA | DIRECTA | ReportingController.createExecution → ReportingRunsService.createExecution → ReportingRunsRepository.createExecution | `src/modules/reporting/repositories/reporting-runs.repository.ts:124` |
| `reporting.report_parameters` | LEE | LEE | DIRECTA | ReportingController.createExecution → ReportingRunsService.createExecution → ReportingDefinitionsRepository.findParametersByDefinition | `src/modules/reporting/repositories/reporting-definitions.repository.ts:330` |
| `reporting.report_versions` | LEE | LEE | DIRECTA | ReportingController.createExecution → ReportingRunsService.createExecution → ReportingDefinitionsRepository.findActiveVersion | `src/modules/reporting/repositories/reporting-definitions.repository.ts:482` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateExecutionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `parametersJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Valores de los parámetros, con la forma { "<código>": <valor> } | `src/modules/reporting/dto/reporting.dto.ts:466` |
| `outputFormat` | `string` | No | valores: CSV, XLSX, PDF, JSON | `@IsOptional()` `@IsIn(OUTPUT_FORMATS)` | — | `src/modules/reporting/dto/reporting.dto.ts:474` |
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/reporting/dto/reporting.dto.ts:482` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "parametersJson": {},
  "outputFormat": "CSV",
  "tenantId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<ExecutionResponseDto>` · DTO `ExecutionResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/reporting/dto/reporting.dto.ts:493` |
| `reportVersionId` | `string` | Sí | formato uuid | — | Versión con la que se ejecuta | `src/modules/reporting/dto/reporting.dto.ts:499` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/reporting/dto/reporting.dto.ts:505` |
| `outputFormatConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a output format concept. | `src/modules/reporting/dto/reporting.dto.ts:511` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La definición no está activa; PreconditionFailedException: La definición no tiene versión publicada; PreconditionFailedException: Faltan parámetros obligatorios del reporte |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/reporting.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/reporting/controllers/reporting.controller.spec.ts:95` |

### Flujos

- Módulo 39 — Reportes, Distribución y Tableros — etapa `UC-39-04`

---

## 6. POST /reporting/definitions/{id}/schedules

- **Origen:** CONTRATO
- **Nombre:** Programar la distribución periódica del reporte
- **Bloque:** Auditoría y Reporting
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ReportingController.createSchedule` — `src/modules/reporting/controllers/reporting.controller.ts:169`

### Qué es y para qué sirve (negocio)

Programar la distribución periódica del reporte. Caso de uso UC-39-06: Programar distribución. Dentro del módulo (descripción del modelo, en inglés): «A configuration-driven reporting engine so the application supports dynamic reports without code changes.» Dominio: Auditoría y Reporting.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/reporting/README.md:47`) · MODELO (`Mantra Core Health Context/modules/diagram_39_reporting.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:36`)

### Cómo se atiende (sistema)

`POST /reporting/definitions/{id}/schedules` la atiende `ReportingController.createSchedule` (src/modules/reporting/controllers/reporting.controller.ts:169). Exige sesión con alguno de los roles REPORTING_ADMIN, REPORT_AUTHOR. Valida el cuerpo como `ReportingCreateScheduleDto` (7 campos, 4 obligatorios). Delega en `ReportingRunsService.createSchedule`. Crea filas en reporting.report_schedules. Lee reporting.report_definitions, reporting.report_parameters.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: REPORTING_ADMIN, REPORT_AUTHOR | `src/modules/reporting/controllers/reporting.controller.ts:169` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/reporting/controllers/reporting.controller.ts:169` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `reporting.report_definitions` | LEE | LEE | DIRECTA | ReportingController.createSchedule → ReportingRunsService.createSchedule → ReportingDefinitionsRepository.findDefinitionById | `src/modules/reporting/repositories/reporting-definitions.repository.ts:225` |
| `reporting.report_parameters` | LEE | LEE | DIRECTA | ReportingController.createSchedule → ReportingRunsService.createSchedule → ReportingDefinitionsRepository.findParametersByDefinition | `src/modules/reporting/repositories/reporting-definitions.repository.ts:330` |
| `reporting.report_schedules` | ESCRIBE | CREA | DIRECTA | ReportingController.createSchedule → ReportingRunsService.createSchedule → ReportingRunsRepository.createSchedule | `src/modules/reporting/repositories/reporting-runs.repository.ts:266` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `ReportingCreateScheduleDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/reporting/dto/reporting.dto.ts:632` |
| `name` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | — | `src/modules/reporting/dto/reporting.dto.ts:640` |
| `cronExpression` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Expresión cron de cinco campos | `src/modules/reporting/dto/reporting.dto.ts:651` |
| `timeZone` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Zona horaria IANA | `src/modules/reporting/dto/reporting.dto.ts:664` |
| `parametersJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Parámetros fijos de cada corrida programada | `src/modules/reporting/dto/reporting.dto.ts:674` |
| `outputFormat` | `string` | Sí | valores: CSV, XLSX, PDF, JSON | `@IsIn(OUTPUT_FORMATS)` | — | `src/modules/reporting/dto/reporting.dto.ts:681` |
| `firstRunAt` | `string` | Sí | formato date-time | `@IsISO8601()` | Primera corrida. El cliente resuelve el cron; aquí se guarda el instante. | `src/modules/reporting/dto/reporting.dto.ts:692` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "name": "Nombre de ejemplo",
  "cronExpression": "valor-ejemplo",
  "outputFormat": "CSV",
  "firstRunAt": "2026-07-31T12:00:00.000Z"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "name": "Nombre de ejemplo",
  "cronExpression": "valor-ejemplo",
  "timeZone": "UTC",
  "parametersJson": {},
  "outputFormat": "CSV",
  "firstRunAt": "2026-07-31T12:00:00.000Z"
}
```

</details>

### Respuesta — `Promise<ScheduleResponseDto>` · DTO `ScheduleResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/reporting/dto/reporting.dto.ts:703` |
| `name` | `string` | Sí | — | — | Valor de name mantenido por la instancia. | `src/modules/reporting/dto/reporting.dto.ts:709` |
| `nextRunAt` | `string` | Sí | formato date-time | — | Valor de next run at mantenido por la instancia. | `src/modules/reporting/dto/reporting.dto.ts:715` |
| `stateConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a state concept. | `src/modules/reporting/dto/reporting.dto.ts:721` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La definición no está activa; PreconditionFailedException: Faltan parámetros obligatorios del reporte |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/reporting.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/reporting/controllers/reporting.controller.spec.ts:117` |

### Flujos

- Módulo 39 — Reportes, Distribución y Tableros — etapa `UC-39-06`

---

## 7. POST /reporting/definitions/{id}/versions/publish

- **Origen:** CONTRATO
- **Nombre:** Publicar una versión del reporte
- **Bloque:** Auditoría y Reporting
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ReportingController.publishVersion` — `src/modules/reporting/controllers/reporting.controller.ts:103`

### Qué es y para qué sirve (negocio)

Publicar una versión del reporte. Caso de uso UC-39-03: Publicar versión. Dentro del módulo (descripción del modelo, en inglés): «A configuration-driven reporting engine so the application supports dynamic reports without code changes.» Dominio: Auditoría y Reporting.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/reporting/README.md:44`) · MODELO (`Mantra Core Health Context/modules/diagram_39_reporting.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:36`)

### Cómo se atiende (sistema)

`POST /reporting/definitions/{id}/versions/publish` la atiende `ReportingController.publishVersion` (src/modules/reporting/controllers/reporting.controller.ts:103). Exige sesión con alguno de los roles REPORTING_ADMIN, REPORT_AUTHOR. Valida el cuerpo como `PublishReportVersionDto` (1 campo, 0 obligatorios). Delega en `ReportingDefinitionsService.publishVersion`. Crea filas en reporting.report_versions. Lee reporting.report_definitions, reporting.report_parameters, reporting.report_versions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: REPORTING_ADMIN, REPORT_AUTHOR | `src/modules/reporting/controllers/reporting.controller.ts:103` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/reporting/controllers/reporting.controller.ts:103` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `reporting.report_definitions` | LEE | LEE | DIRECTA | ReportingController.publishVersion → ReportingDefinitionsService.publishVersion → ReportingDefinitionsRepository.findDefinitionForUpdate | `src/modules/reporting/repositories/reporting-definitions.repository.ts:239` |
| `reporting.report_parameters` | LEE | LEE | DIRECTA | ReportingController.publishVersion → ReportingDefinitionsService.publishVersion → ReportingDefinitionsRepository.findParametersByDefinition | `src/modules/reporting/repositories/reporting-definitions.repository.ts:330` |
| `reporting.report_versions` | ESCRIBE | CREA | DIRECTA | ReportingController.publishVersion → ReportingDefinitionsService.publishVersion → ReportingDefinitionsRepository.createVersion | `src/modules/reporting/repositories/reporting-definitions.repository.ts:445` |
| `reporting.report_versions` | LEE | LEE | DIRECTA | ReportingController.publishVersion → ReportingDefinitionsService.publishVersion → ReportingDefinitionsRepository.findVersion | `src/modules/reporting/repositories/reporting-definitions.repository.ts:473` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `PublishReportVersionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `changeNote` | `string` | No | — | `@IsOptional()` `@IsString()` | Qué cambió respecto de la versión anterior | `src/modules/reporting/dto/reporting.dto.ts:422` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "changeNote": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<ReportVersionResponseDto>` · DTO `ReportVersionResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/reporting/dto/reporting.dto.ts:433` |
| `version` | `number` | Sí | — | — | Valor de version mantenido por la instancia. | `src/modules/reporting/dto/reporting.dto.ts:439` |
| `definitionStateConceptId` | `string` | Sí | formato uuid | — | Estado en el que queda la definición | `src/modules/reporting/dto/reporting.dto.ts:448` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Esa versión ya está publicada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Una definición deprecada no admite versiones |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/reporting.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/reporting/controllers/reporting.controller.spec.ts:79` |

### Flujos

- Módulo 39 — Reportes, Distribución y Tableros — etapa `UC-39-03`

---

## 8. POST /reporting/executions/{id}/distributions

- **Origen:** CONTRATO
- **Nombre:** Crear las distribuciones del reporte por destinatario
- **Bloque:** Auditoría y Reporting
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ReportingController.dispatchDistributions` — `src/modules/reporting/controllers/reporting.controller.ts:207`

### Qué es y para qué sirve (negocio)

Crear las distribuciones del reporte por destinatario. Caso de uso UC-39-08: Crear distribuciones. Dentro del módulo (descripción del modelo, en inglés): «A configuration-driven reporting engine so the application supports dynamic reports without code changes.» Dominio: Auditoría y Reporting.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/reporting/README.md:49`) · MODELO (`Mantra Core Health Context/modules/diagram_39_reporting.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:36`)

### Cómo se atiende (sistema)

`POST /reporting/executions/{id}/distributions` la atiende `ReportingController.dispatchDistributions` (src/modules/reporting/controllers/reporting.controller.ts:207). Exige sesión con alguno de los roles SYSTEM, REPORTING_ADMIN. Valida el cuerpo como `DispatchDistributionDto` (5 campos, 0 obligatorios). Delega en `ReportingRunsService.dispatchDistributions`. Crea filas en reporting.report_distributions. Lee reporting.report_distributions, reporting.report_executions, reporting.report_subscriptions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, REPORTING_ADMIN | `src/modules/reporting/controllers/reporting.controller.ts:207` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/reporting/controllers/reporting.controller.ts:207` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `reporting.report_distributions` | ESCRIBE | CREA | DIRECTA | ReportingController.dispatchDistributions → ReportingRunsService.dispatchDistributions → ReportingRunsRepository.createDistribution | `src/modules/reporting/repositories/reporting-runs.repository.ts:388` |
| `reporting.report_distributions` | LEE | LEE | DIRECTA | ReportingController.dispatchDistributions → ReportingRunsService.dispatchDistributions → ReportingRunsRepository.findDistributionsByExecution | `src/modules/reporting/repositories/reporting-runs.repository.ts:409` |
| `reporting.report_executions` | LEE | LEE | DIRECTA | ReportingController.dispatchDistributions → ReportingRunsService.dispatchDistributions → ReportingRunsRepository.findExecutionById | `src/modules/reporting/repositories/reporting-runs.repository.ts:153` |
| `reporting.report_subscriptions` | LEE | LEE | DIRECTA | ReportingController.dispatchDistributions → ReportingRunsService.dispatchDistributions → ReportingRunsRepository.findActiveSubscriptions | `src/modules/reporting/repositories/reporting-runs.repository.ts:490` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `DispatchDistributionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `recipients` | `array<DistributionRecipientDto>` | No | — | `@IsOptional()` `@IsArray()` `@ValidateNested({ each: true })` `@Type(() => DistributionRecipientDto)` | Destinatarios extra además de los suscritos a la programación | `src/modules/reporting/dto/reporting.dto.ts:848` |
| `recipients[].recipientType` | `string` | No | valores: USER, ADDRESS | `@IsIn(['USER', 'ADDRESS'])` | — | `src/modules/reporting/dto/reporting.dto.ts:801` |
| `recipients[].recipientUserId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Obligatorio si el tipo es USER | `src/modules/reporting/dto/reporting.dto.ts:812` |
| `recipients[].recipientAddress` | `string` | No | longitud máxima 300 | `@IsOptional()` `@IsString()` `@MaxLength(300)` | Obligatorio si el tipo es ADDRESS | `src/modules/reporting/dto/reporting.dto.ts:824` |
| `recipients[].channelId` | `string` | No | formato uuid | `@IsUUID()` | Canal por el que se entrega | `src/modules/reporting/dto/reporting.dto.ts:831` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "recipients": [
    {
      "recipientType": "USER",
      "recipientUserId": "00000000-0000-4000-8000-000000000001",
      "recipientAddress": "valor-ejemplo",
      "channelId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

</details>

### Respuesta — `Promise<DispatchResponseDto>` · DTO `DispatchResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | sin fuente |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | sin fuente |
| `eventId` | `string` | Sí | formato uuid | — | Evento de despacho registrado | sin fuente |
| `dispatchedAt` | `string` | Sí | formato date-time | — | Valor de dispatched at mantenido por la instancia. | sin fuente |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Sólo se distribuye una ejecución que terminó con éxito; PreconditionFailedException: Un destinatario USER necesita su identificador; PreconditionFailedException: Un destinatario ADDRESS necesita su dirección |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/reporting.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/reporting/controllers/reporting.controller.spec.ts:135` |

### Flujos

- Módulo 39 — Reportes, Distribución y Tableros — etapa `UC-39-08`

---

## 9. POST /reporting/executions/{id}/retry

- **Origen:** CONTRATO
- **Nombre:** Devolver a la cola una corrida fallida
- **Bloque:** Auditoría y Reporting
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ReportingController.retryExecution` — `src/modules/reporting/controllers/reporting.controller.ts:267`

### Qué es y para qué sirve (negocio)

Devolver a la cola una corrida fallida. Caso de uso UC-39-11: Reintentar corrida fallida. Dentro del módulo (descripción del modelo, en inglés): «A configuration-driven reporting engine so the application supports dynamic reports without code changes.» Dominio: Auditoría y Reporting.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/reporting/README.md:52`) · MODELO (`Mantra Core Health Context/modules/diagram_39_reporting.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:36`)

### Cómo se atiende (sistema)

`POST /reporting/executions/{id}/retry` la atiende `ReportingController.retryExecution` (src/modules/reporting/controllers/reporting.controller.ts:267). Exige sesión con alguno de los roles SYSTEM, REPORTING_ADMIN. Valida el cuerpo como `RetryExecutionDto` (1 campo, 0 obligatorios). Delega en `ReportingRunsService.retryExecution`. Actualiza reporting.report_distributions. Lee reporting.report_definitions, reporting.report_distributions, reporting.report_executions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, REPORTING_ADMIN | `src/modules/reporting/controllers/reporting.controller.ts:267` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/reporting/controllers/reporting.controller.ts:267` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `reporting.report_definitions` | LEE | LEE | DIRECTA | ReportingController.retryExecution → ReportingRunsService.retryExecution → ReportingDefinitionsRepository.findDefinitionById | `src/modules/reporting/repositories/reporting-definitions.repository.ts:225` |
| `reporting.report_distributions` | ESCRIBE | ACTUALIZA | POR_TIPO | ReportingController.retryExecution → ReportingRunsService.retryExecution | `src/modules/reporting/services/reporting-runs.service.ts:631` |
| `reporting.report_distributions` | LEE | LEE | DIRECTA | ReportingController.retryExecution → ReportingRunsService.retryExecution → ReportingRunsRepository.findDistributionsByExecutionForUpdate | `src/modules/reporting/repositories/reporting-runs.repository.ts:423` |
| `reporting.report_executions` | LEE | LEE | DIRECTA | ReportingController.retryExecution → ReportingRunsService.retryExecution → ReportingRunsRepository.findExecutionForUpdate | `src/modules/reporting/repositories/reporting-runs.repository.ts:170` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `RetryExecutionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `requeueDistributions` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Reencolar también las distribuciones que dependían de la corrida | `src/modules/reporting/dto/reporting.dto.ts:1107` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "requeueDistributions": false
}
```

</details>

### Respuesta — `Promise<RetryExecutionResponseDto>` · DTO `RetryExecutionResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/reporting/dto/reporting.dto.ts:1118` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/reporting/dto/reporting.dto.ts:1124` |
| `distributionsRequeued` | `number` | Sí | — | — | Distribuciones devueltas a pendiente | `src/modules/reporting/dto/reporting.dto.ts:1130` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Sólo se reintenta una ejecución fallida; PreconditionFailedException: La definición está deprecada: no se reintenta su corrida |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/reporting.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/reporting/controllers/reporting.controller.spec.ts:168` |

### Flujos

- Módulo 39 — Reportes, Distribución y Tableros — etapa `UC-39-11`

---

## 10. POST /reporting/executions/{id}/snapshot

- **Origen:** CONTRATO
- **Nombre:** Registrar el artefacto materializado y cerrar la corrida
- **Bloque:** Auditoría y Reporting
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ReportingController.materializeSnapshot` — `src/modules/reporting/controllers/reporting.controller.ts:147`

### Qué es y para qué sirve (negocio)

Registrar el artefacto materializado y cerrar la corrida. Caso de uso UC-39-05: Materializar el artefacto. Dentro del módulo (descripción del modelo, en inglés): «A configuration-driven reporting engine so the application supports dynamic reports without code changes.» Dominio: Auditoría y Reporting.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/reporting/README.md:46`) · MODELO (`Mantra Core Health Context/modules/diagram_39_reporting.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:36`)

### Cómo se atiende (sistema)

`POST /reporting/executions/{id}/snapshot` la atiende `ReportingController.materializeSnapshot` (src/modules/reporting/controllers/reporting.controller.ts:147). Exige sesión con alguno de los roles SYSTEM. Valida el cuerpo como `MaterializeSnapshotDto` (6 campos, 1 obligatorio). Delega en `ReportingRunsService.materializeSnapshot`. Crea filas en reporting.report_snapshots. Lee reporting.report_executions, reporting.report_snapshots.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM | `src/modules/reporting/controllers/reporting.controller.ts:147` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/reporting/controllers/reporting.controller.ts:147` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `reporting.report_executions` | LEE | LEE | DIRECTA | ReportingController.materializeSnapshot → ReportingRunsService.materializeSnapshot → ReportingRunsRepository.findExecutionForUpdate | `src/modules/reporting/repositories/reporting-runs.repository.ts:170` |
| `reporting.report_snapshots` | ESCRIBE | CREA | DIRECTA | ReportingController.materializeSnapshot → ReportingRunsService.materializeSnapshot → ReportingRunsRepository.createSnapshot | `src/modules/reporting/repositories/reporting-runs.repository.ts:219` |
| `reporting.report_snapshots` | LEE | LEE | DIRECTA | ReportingController.materializeSnapshot → ReportingRunsService.materializeSnapshot → ReportingRunsRepository.findSnapshotByExecution | `src/modules/reporting/repositories/reporting-runs.repository.ts:245` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `MaterializeSnapshotDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `storageUri` | `string` | Sí | — | `@IsString()` | Ubicación del artefacto en el almacén de objetos | `src/modules/reporting/dto/reporting.dto.ts:527` |
| `contentHash` | `string` | No | longitud máxima 128 | `@IsOptional()` `@IsString()` `@MaxLength(128)` | Hash del contenido, para deduplicar artefactos | `src/modules/reporting/dto/reporting.dto.ts:538` |
| `rowCount` | `number` | No | mínimo 0 | `@IsOptional()` `@IsInt()` `@Min(0)` | Filas del resultado | `src/modules/reporting/dto/reporting.dto.ts:547` |
| `sizeBytes` | `number` | No | mínimo 0 | `@IsOptional()` `@IsInt()` `@Min(0)` | Tamaño del artefacto en bytes | `src/modules/reporting/dto/reporting.dto.ts:556` |
| `outputFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Archivo en `common.files` | `src/modules/reporting/dto/reporting.dto.ts:567` |
| `retentionDays` | `number` | No | mínimo 1 | `@IsOptional()` `@IsInt()` `@Min(1)` | Días de retención del artefacto | `src/modules/reporting/dto/reporting.dto.ts:576` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "storageUri": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "storageUri": "valor-ejemplo",
  "contentHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "rowCount": 1,
  "sizeBytes": 1,
  "outputFileId": "00000000-0000-4000-8000-000000000001",
  "retentionDays": 1
}
```

</details>

### Respuesta — `Promise<SnapshotResponseDto>` · DTO `SnapshotResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/reporting/dto/reporting.dto.ts:587` |
| `reportExecutionId` | `string` | Sí | formato uuid | — | Identificador asociado a report execution. | `src/modules/reporting/dto/reporting.dto.ts:593` |
| `executionStatusConceptId` | `string` | Sí | formato uuid | — | Estado en el que queda la ejecución | `src/modules/reporting/dto/reporting.dto.ts:602` |
| `expiresAt` | `string` | No | formato date-time | — | Valor de expires at mantenido por la instancia. | `src/modules/reporting/dto/reporting.dto.ts:608` |
| `contentDeduplicated` | `boolean` | Sí | — | — | true si ya existía un artefacto con el mismo contenido | `src/modules/reporting/dto/reporting.dto.ts:616` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: La ejecución ya está materializada; ConflictException: La ejecución ya tiene snapshot |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Una ejecución fallida se reintenta antes de materializar |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/reporting.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/reporting/controllers/reporting.controller.spec.ts:96` |

### Flujos

- Módulo 39 — Reportes, Distribución y Tableros — etapa `UC-39-05`

---

## 11. POST /reporting/scheduler/tick

- **Origen:** CONTRATO
- **Nombre:** Disparar las programaciones vencidas
- **Bloque:** Auditoría y Reporting
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ReportingController.schedulerTick` — `src/modules/reporting/controllers/reporting.controller.ts:187`

### Qué es y para qué sirve (negocio)

Disparar las programaciones vencidas. Caso de uso UC-39-07: Disparar corridas vencidas. Dentro del módulo (descripción del modelo, en inglés): «A configuration-driven reporting engine so the application supports dynamic reports without code changes.» Dominio: Auditoría y Reporting.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/reporting/README.md:48`) · MODELO (`Mantra Core Health Context/modules/diagram_39_reporting.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:36`)

### Cómo se atiende (sistema)

`POST /reporting/scheduler/tick` la atiende `ReportingController.schedulerTick` (src/modules/reporting/controllers/reporting.controller.ts:187). Exige sesión con alguno de los roles SYSTEM. Valida el cuerpo como `SchedulerTickDto` (2 campos, 0 obligatorios). Delega en `ReportingRunsService.schedulerTick`. Crea filas en reporting.report_executions. Actualiza reporting.report_schedules. Lee reporting.report_definitions, reporting.report_schedules, reporting.report_versions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM | `src/modules/reporting/controllers/reporting.controller.ts:187` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `reporting.report_definitions` | LEE | LEE | DIRECTA | ReportingController.schedulerTick → ReportingRunsService.schedulerTick → ReportingDefinitionsRepository.findDefinitionById | `src/modules/reporting/repositories/reporting-definitions.repository.ts:225` |
| `reporting.report_executions` | ESCRIBE | CREA | DIRECTA | ReportingController.schedulerTick → ReportingRunsService.schedulerTick → ReportingRunsRepository.createExecution | `src/modules/reporting/repositories/reporting-runs.repository.ts:124` |
| `reporting.report_schedules` | ESCRIBE | ACTUALIZA | POR_TIPO | ReportingController.schedulerTick → ReportingRunsService.schedulerTick | `src/modules/reporting/services/reporting-runs.service.ts:362` |
| `reporting.report_schedules` | LEE | LEE | DIRECTA | ReportingController.schedulerTick → ReportingRunsService.schedulerTick → ReportingRunsRepository.findDueSchedules | `src/modules/reporting/repositories/reporting-runs.repository.ts:314` |
| `reporting.report_versions` | LEE | LEE | DIRECTA | ReportingController.schedulerTick → ReportingRunsService.schedulerTick → ReportingDefinitionsRepository.findActiveVersion | `src/modules/reporting/repositories/reporting-definitions.repository.ts:482` |

### Cuerpo — DTO `SchedulerTickDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `batchSize` | `number` | No | mínimo 1; máximo 500 | `@IsOptional()` `@IsInt()` `@Min(1)` `@Max(500)` | Programaciones a procesar por tick | `src/modules/reporting/dto/reporting.dto.ts:741` |
| `intervalMinutes` | `number` | No | mínimo 1 | `@IsOptional()` `@IsInt()` `@Min(1)` | Minutos hasta la siguiente corrida. El cálculo del cron vive fuera. | `src/modules/reporting/dto/reporting.dto.ts:754` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "batchSize": 50,
  "intervalMinutes": 1440
}
```

</details>

### Respuesta — `Promise<SchedulerTickResponseDto>` · DTO `SchedulerTickResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `scanned` | `number` | Sí | — | — | Programaciones vencidas tomadas en este tick | `src/modules/reporting/dto/reporting.dto.ts:765` |
| `queued` | `number` | Sí | — | — | Ejecuciones encoladas | `src/modules/reporting/dto/reporting.dto.ts:771` |
| `skipped` | `number` | Sí | — | — | Programaciones omitidas por no tener versión publicada | `src/modules/reporting/dto/reporting.dto.ts:779` |
| `executionIds` | `array<string>` | Sí | formato uuid | — | Valor de execution ids mantenido por la instancia. | `src/modules/reporting/dto/reporting.dto.ts:785` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/reporting.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/reporting/controllers/reporting.controller.spec.ts:118` |

### Flujos

- Módulo 39 — Reportes, Distribución y Tableros — etapa `UC-39-07`

---

## 12. POST /reporting/schedules/{id}/subscriptions

- **Origen:** CONTRATO
- **Nombre:** Suscribirse a una programación
- **Bloque:** Auditoría y Reporting
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ReportingController.subscribe` — `src/modules/reporting/controllers/reporting.controller.ts:228`

### Qué es y para qué sirve (negocio)

Suscribirse a una programación. Caso de uso UC-39-09: Suscribirse. Dentro del módulo (descripción del modelo, en inglés): «A configuration-driven reporting engine so the application supports dynamic reports without code changes.» Dominio: Auditoría y Reporting.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/reporting/README.md:50`) · MODELO (`Mantra Core Health Context/modules/diagram_39_reporting.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:36`)

### Cómo se atiende (sistema)

`POST /reporting/schedules/{id}/subscriptions` la atiende `ReportingController.subscribe` (src/modules/reporting/controllers/reporting.controller.ts:228). Exige sesión con alguno de los roles REPORT_VIEWER, REPORTING_ADMIN. Valida el cuerpo como `SubscribeDto` (1 campo, 1 obligatorio). Delega en `ReportingRunsService.subscribe`. Crea filas en reporting.report_subscriptions. Actualiza reporting.report_subscriptions. Lee reporting.report_schedules, reporting.report_subscriptions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: REPORT_VIEWER, REPORTING_ADMIN | `src/modules/reporting/controllers/reporting.controller.ts:228` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/reporting/controllers/reporting.controller.ts:228` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `reporting.report_schedules` | LEE | LEE | DIRECTA | ReportingController.subscribe → ReportingRunsService.subscribe → ReportingRunsRepository.findScheduleById | `src/modules/reporting/repositories/reporting-runs.repository.ts:296` |
| `reporting.report_subscriptions` | ESCRIBE | ACTUALIZA | POR_TIPO | ReportingController.subscribe → ReportingRunsService.subscribe | `src/modules/reporting/services/reporting-runs.service.ts:546` |
| `reporting.report_subscriptions` | ESCRIBE | CREA | DIRECTA | ReportingController.subscribe → ReportingRunsService.subscribe → ReportingRunsRepository.createSubscription | `src/modules/reporting/repositories/reporting-runs.repository.ts:458` |
| `reporting.report_subscriptions` | LEE | LEE | DIRECTA | ReportingController.subscribe → ReportingRunsService.subscribe → ReportingRunsRepository.findSubscription | `src/modules/reporting/repositories/reporting-runs.repository.ts:478` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `SubscribeDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `channelId` | `string` | Sí | formato uuid | `@IsUUID()` | Canal por el que se quiere recibir | `src/modules/reporting/dto/reporting.dto.ts:894` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "channelId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "channelId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<SubscriptionResponseDto>` · DTO `SubscriptionResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/reporting/dto/reporting.dto.ts:905` |
| `reportScheduleId` | `string` | Sí | formato uuid | — | Identificador asociado a report schedule. | `src/modules/reporting/dto/reporting.dto.ts:911` |
| `isActive` | `boolean` | Sí | — | — | Valor de is active mantenido por la instancia. | `src/modules/reporting/dto/reporting.dto.ts:917` |
| `reactivated` | `boolean` | Sí | — | — | true si la suscripción ya existía y se reactivó | `src/modules/reporting/dto/reporting.dto.ts:925` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La programación no está activa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/reporting.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/reporting/controllers/reporting.controller.spec.ts:136` |

### Flujos

- Módulo 39 — Reportes, Distribución y Tableros — etapa `UC-39-09`

---

