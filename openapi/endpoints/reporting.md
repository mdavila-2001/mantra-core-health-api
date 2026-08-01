<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `reporting`

Referencia exhaustiva de 12 operación(es) del módulo `reporting`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `reporting`
- **Controladores:** `ReportingController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [POST /reporting/dashboards](#1-post-reporting-dashboards) — Componer un tablero con sus widgets
2. [POST /reporting/data-sources](#2-post-reporting-data-sources) — Registrar una fuente de datos gobernada
3. [POST /reporting/definitions](#3-post-reporting-definitions) — Autorar una definición con sus parámetros y columnas
4. [POST /reporting/definitions/{id}/deprecate](#4-post-reporting-definitions-id-deprecate) — Deprecar la definición y suspender sus programaciones
5. [POST /reporting/definitions/{id}/executions](#5-post-reporting-definitions-id-executions) — Encolar una corrida parametrizada
6. [POST /reporting/definitions/{id}/schedules](#6-post-reporting-definitions-id-schedules) — Programar la distribución periódica del reporte
7. [POST /reporting/definitions/{id}/versions/publish](#7-post-reporting-definitions-id-versions-publish) — Publicar una versión del reporte
8. [POST /reporting/executions/{id}/distributions](#8-post-reporting-executions-id-distributions) — Crear las distribuciones del reporte por destinatario
9. [POST /reporting/executions/{id}/retry](#9-post-reporting-executions-id-retry) — Devolver a la cola una corrida fallida
10. [POST /reporting/executions/{id}/snapshot](#10-post-reporting-executions-id-snapshot) — Registrar el artefacto materializado y cerrar la corrida
11. [POST /reporting/scheduler/tick](#11-post-reporting-scheduler-tick) — Disparar las programaciones vencidas
12. [POST /reporting/schedules/{id}/subscriptions](#12-post-reporting-schedules-id-subscriptions) — Suscribirse a una programación

---

## 1. POST /reporting/dashboards

- **Módulo:** `reporting`
- **Etiqueta OpenAPI:** `reporting`
- **Nombre:** Componer un tablero con sus widgets
- **Operation ID:** `ReportingController_createDashboard`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ReportingController.createDashboard](../../src/modules/reporting/controllers/reporting.controller.ts)

### Descripción de negocio

Componer un tablero con sus widgets. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /reporting/dashboards` en `ReportingController_createDashboard`. El controlador delega en `ReportingDefinitionsService.createDashboard`. Valida el body como `CreateDashboardDto` y consume `application/json`. El tipo de retorno estático es `Promise<DashboardResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateDashboardDto`; los campos opcionales se omiten.

```http
POST /reporting/dashboards HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `REPORTING_ADMIN`, `REPORT_AUTHOR`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | longitud máxima 100 | Código del tablero, único | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `description` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `layoutJson` | No | `object` | Sin restricción adicional declarada | Retícula del tablero | `{}` |
| `requiredPermissionId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `widgets` | Sí | `array<DashboardWidgetDto>` | mínimo 1 elemento(s) | Widgets del tablero, al menos uno | `[{"reportDefinitionId":"00000000-0000-4000-8000-000000000001","widgetType":"CHART","title":"valor-ejemplo","visualization":"BAR","configJson":{},"positionJson":{}}]` |
| `widgets[].reportDefinitionId` | No | `string` | formato `uuid` | Reporte del que se alimenta el widget | `00000000-0000-4000-8000-000000000001` |
| `widgets[].widgetType` | Sí | `string` | valores: `CHART`, `TABLE`, `METRIC` | Sin descripción específica en el contrato OpenAPI. | `CHART` |
| `widgets[].title` | Sí | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `widgets[].visualization` | No | `string` | valores: `BAR`, `LINE`, `PIE` | Obligatoria si el widget es CHART | `BAR` |
| `widgets[].configJson` | No | `object` | Sin restricción adicional declarada | Configuración del widget | `{}` |
| `widgets[].positionJson` | No | `object` | Sin restricción adicional declarada | Posición en la retícula del tablero | `{}` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /reporting/dashboards HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<DashboardResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<DashboardResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<DashboardResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<DashboardResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<DashboardResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<DashboardResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<DashboardResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<DashboardResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<DashboardResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DashboardResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "stateConceptId": "00000000-0000-4000-8000-000000000001",
  "widgetIds": [
    "valor-ejemplo"
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Valor de code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `stateConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a state concept. | `00000000-0000-4000-8000-000000000001` |
| `widgetIds` | Sí | `array<string>` | formato `uuid` | Valor de widget ids mantenido por la instancia. | `["valor-ejemplo"]` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: REPORTING_ADMIN, REPORT_AUTHOR. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Definición del widget no encontrada | Excepción explícita en src/modules/reporting/services/reporting-definitions.service.ts |
| 409 | `CONFLICT` | Ya existe un tablero con ese código | Excepción explícita en src/modules/reporting/services/reporting-definitions.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Un widget CHART necesita su tipo de gráfico | Excepción explícita en src/modules/reporting/services/reporting-definitions.service.ts |
| 422 | `PRECONDITION_FAILED` | El widget apunta a un reporte deprecado | Excepción explícita en src/modules/reporting/services/reporting-definitions.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/reporting/dashboards"
}
```

---

## 2. POST /reporting/data-sources

- **Módulo:** `reporting`
- **Etiqueta OpenAPI:** `reporting`
- **Nombre:** Registrar una fuente de datos gobernada
- **Operation ID:** `ReportingController_createDataSource`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ReportingController.createDataSource](../../src/modules/reporting/controllers/reporting.controller.ts)

### Descripción de negocio

Apunta a un read model declarado o a una vista nombrada, nunca a consulta libre.


### Descripción del sistema

NestJS resuelve `POST /reporting/data-sources` en `ReportingController_createDataSource`. El controlador delega en `ReportingDefinitionsService.createDataSource`. Valida el body como `CreateDataSourceDto` y consume `application/json`. El tipo de retorno estático es `Promise<DataSourceResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateDataSourceDto`; los campos opcionales se omiten.

```http
POST /reporting/data-sources HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "sourceType": "READ_MODEL"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `REPORTING_ADMIN`, `DATA_STEWARD`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | longitud máxima 100 | Código de la fuente, único | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `sourceType` | Sí | `string` | valores: `READ_MODEL`, `VIEW` | Sin descripción específica en el contrato OpenAPI. | `READ_MODEL` |
| `readModelDefinitionId` | No | `string` | formato `uuid` | Read model gobernado; obligatorio si el tipo es READ_MODEL | `00000000-0000-4000-8000-000000000001` |
| `viewName` | No | `string` | longitud máxima 200 | Vista de base de datos; obligatoria si el tipo es VIEW | `Nombre de ejemplo` |
| `specJson` | No | `object` | Sin restricción adicional declarada | Especificación de la fuente | `{}` |
| `rowSecurityJson` | No | `object` | Sin restricción adicional declarada | Reglas de seguridad por fila que la fuente impone a toda consulta | `{}` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /reporting/data-sources HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<DataSourceResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<DataSourceResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<DataSourceResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<DataSourceResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<DataSourceResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<DataSourceResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<DataSourceResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<DataSourceResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<DataSourceResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DataSourceResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "stateConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Valor de code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `stateConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a state concept. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: REPORTING_ADMIN, DATA_STEWARD. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Ya existe una fuente con ese código | Excepción explícita en src/modules/reporting/services/reporting-definitions.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Una fuente READ_MODEL necesita su read model gobernado | Excepción explícita en src/modules/reporting/services/reporting-definitions.service.ts |
| 422 | `PRECONDITION_FAILED` | Una fuente VIEW necesita el nombre de la vista | Excepción explícita en src/modules/reporting/services/reporting-definitions.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/reporting/data-sources"
}
```

---

## 3. POST /reporting/definitions

- **Módulo:** `reporting`
- **Etiqueta OpenAPI:** `reporting`
- **Nombre:** Autorar una definición con sus parámetros y columnas
- **Operation ID:** `ReportingController_createDefinition`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ReportingController.createDefinition](../../src/modules/reporting/controllers/reporting.controller.ts)

### Descripción de negocio

Nace en borrador; publicar una versión es lo que la activa.


### Descripción del sistema

NestJS resuelve `POST /reporting/definitions` en `ReportingController_createDefinition`. El controlador delega en `ReportingDefinitionsService.createDefinition`. Valida el body como `CreateDefinitionDto` y consume `application/json`. El tipo de retorno estático es `Promise<DefinitionResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateDefinitionDto`; los campos opcionales se omiten.

```http
POST /reporting/definitions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `REPORTING_ADMIN`, `REPORT_AUTHOR`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | longitud máxima 100 | Código del reporte, único | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `description` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `category` | No | `string` | valores: `CLINICAL`, `FINANCIAL`, `OPERATIONAL` | Sin descripción específica en el contrato OpenAPI. | `CLINICAL` |
| `dataSourceId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `querySpecJson` | No | `object` | Sin restricción adicional declarada | Consulta que ejecuta el reporte | `{}` |
| `defaultOutputFormat` | No | `string` | valores: `CSV`, `XLSX`, `PDF`, `JSON` | Sin descripción específica en el contrato OpenAPI. | `CSV` |
| `requiredPermissionId` | No | `string` | formato `uuid` | Permiso exigido para ejecutarlo; obligatorio si no es público | `00000000-0000-4000-8000-000000000001` |
| `isPublic` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `false` |
| `parameters` | No | `array<ReportParameterDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","dataType":"valor-ejemplo","required":false,"defaultValueJson":{},"valueSetId":"00000000-0000-4000-8000-000000000001"}]` |
| `parameters[].code` | No | `string` | longitud máxima 100 | Código del parámetro | `CODIGO_EJEMPLO` |
| `parameters[].name` | No | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `parameters[].dataType` | No | `string` | longitud máxima 50 | Tipo técnico del valor | `valor-ejemplo` |
| `parameters[].required` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `false` |
| `parameters[].defaultValueJson` | No | `object` | Sin restricción adicional declarada | Valor por defecto | `{}` |
| `parameters[].valueSetId` | No | `string` | formato `uuid` | Conjunto de valores admitidos | `00000000-0000-4000-8000-000000000001` |
| `columns` | Sí | `array<ReportColumnDto>` | mínimo 1 elemento(s) | Columnas del reporte, al menos una | `[{"code":"CODIGO_EJEMPLO","label":"valor-ejemplo","expression":"valor-ejemplo","dataType":"valor-ejemplo","aggregation":"SUM","formatMask":"valor-ejemplo","isVisible":true}]` |
| `columns[].code` | Sí | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `columns[].label` | Sí | `string` | longitud máxima 200 | Etiqueta que se muestra | `valor-ejemplo` |
| `columns[].expression` | No | `string` | Sin restricción adicional declarada | Expresión que calcula la columna | `valor-ejemplo` |
| `columns[].dataType` | No | `string` | longitud máxima 50 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `columns[].aggregation` | No | `string` | valores: `SUM`, `AVG`, `COUNT`, `MIN`, `MAX` | Sin descripción específica en el contrato OpenAPI. | `SUM` |
| `columns[].formatMask` | No | `string` | longitud máxima 100 | Máscara de formato | `valor-ejemplo` |
| `columns[].isVisible` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /reporting/definitions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<DefinitionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<DefinitionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<DefinitionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<DefinitionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<DefinitionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<DefinitionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<DefinitionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<DefinitionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<DefinitionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DefinitionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "stateConceptId": "00000000-0000-4000-8000-000000000001",
  "parameterIds": [
    "valor-ejemplo"
  ],
  "columnIds": [
    "valor-ejemplo"
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Valor de code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `stateConceptId` | Sí | `string` | formato `uuid` | La definición nace en borrador | `00000000-0000-4000-8000-000000000001` |
| `parameterIds` | Sí | `array<string>` | formato `uuid` | Valor de parameter ids mantenido por la instancia. | `["valor-ejemplo"]` |
| `columnIds` | Sí | `array<string>` | formato `uuid` | Valor de column ids mantenido por la instancia. | `["valor-ejemplo"]` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: REPORTING_ADMIN, REPORT_AUTHOR. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Fuente de datos no encontrada | Excepción explícita en src/modules/reporting/services/reporting-definitions.service.ts |
| 409 | `CONFLICT` | Ya existe una definición con ese código | Excepción explícita en src/modules/reporting/services/reporting-definitions.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Un reporte no público necesita declarar el permiso que exige | Excepción explícita en src/modules/reporting/services/reporting-definitions.service.ts |
| 422 | `PRECONDITION_FAILED` | La fuente de datos no está activa | Excepción explícita en src/modules/reporting/services/reporting-definitions.service.ts |
| 422 | `PRECONDITION_FAILED` | El código de ${kind} está repetido | Excepción explícita en src/modules/reporting/services/reporting-definitions.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/reporting/definitions"
}
```

---

## 4. POST /reporting/definitions/{id}/deprecate

- **Módulo:** `reporting`
- **Etiqueta OpenAPI:** `reporting`
- **Nombre:** Deprecar la definición y suspender sus programaciones
- **Operation ID:** `ReportingController_deprecateDefinition`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ReportingController.deprecateDefinition](../../src/modules/reporting/controllers/reporting.controller.ts)

### Descripción de negocio

Ambas cosas ocurren en la misma transacción, para no dejar disparos huérfanos.


### Descripción del sistema

NestJS resuelve `POST /reporting/definitions/{id}/deprecate` en `ReportingController_deprecateDefinition`. El controlador delega en `ReportingDefinitionsService.deprecateDefinition`. Valida el body como `DeprecateDefinitionDto` y consume `application/json`. El tipo de retorno estático es `Promise<DeprecateDefinitionResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `DeprecateDefinitionDto`; los campos opcionales se omiten.

```http
POST /reporting/definitions/00000000-0000-4000-8000-000000000001/deprecate HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "reason": "Texto descriptivo de ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `REPORTING_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `reason` | Sí | `string` | Sin restricción adicional declarada | Por qué se deja de usar el reporte | `Texto descriptivo de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /reporting/definitions/00000000-0000-4000-8000-000000000001/deprecate HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "reason": "Texto descriptivo de ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<DeprecateDefinitionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<DeprecateDefinitionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<DeprecateDefinitionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<DeprecateDefinitionResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<DeprecateDefinitionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<DeprecateDefinitionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<DeprecateDefinitionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<DeprecateDefinitionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<DeprecateDefinitionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<DeprecateDefinitionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DeprecateDefinitionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "stateConceptId": "00000000-0000-4000-8000-000000000001",
  "schedulesSuspended": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `stateConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a state concept. | `00000000-0000-4000-8000-000000000001` |
| `schedulesSuspended` | Sí | `number` | Sin restricción adicional declarada | Programaciones suspendidas junto con la definición | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: REPORTING_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Definición no encontrada | Excepción explícita en src/modules/reporting/services/reporting-definitions.service.ts |
| 409 | `CONFLICT` | La definición ya está deprecada | Excepción explícita en src/modules/reporting/services/reporting-definitions.service.ts |
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
  "path": "/reporting/definitions/{id}/deprecate"
}
```

---

## 5. POST /reporting/definitions/{id}/executions

- **Módulo:** `reporting`
- **Etiqueta OpenAPI:** `reporting`
- **Nombre:** Encolar una corrida parametrizada
- **Operation ID:** `ReportingController_createExecution`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ReportingController.createExecution](../../src/modules/reporting/controllers/reporting.controller.ts)

### Descripción de negocio

Se ejecuta contra la versión vigente; los parámetros se validan antes de encolar.


### Descripción del sistema

NestJS resuelve `POST /reporting/definitions/{id}/executions` en `ReportingController_createExecution`. El controlador delega en `ReportingRunsService.createExecution`. Valida el body como `CreateExecutionDto` y consume `application/json`. El tipo de retorno estático es `Promise<ExecutionResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateExecutionDto`; los campos opcionales se omiten.

```http
POST /reporting/definitions/00000000-0000-4000-8000-000000000001/executions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `REPORTING_ADMIN`, `REPORT_VIEWER`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `parametersJson` | No | `object` | Sin restricción adicional declarada | Valores de los parámetros, con la forma { "<código>": <valor> } | `{}` |
| `outputFormat` | No | `string` | valores: `CSV`, `XLSX`, `PDF`, `JSON` | Sin descripción específica en el contrato OpenAPI. | `CSV` |
| `tenantId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /reporting/definitions/00000000-0000-4000-8000-000000000001/executions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "parametersJson": {},
  "outputFormat": "CSV",
  "tenantId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ExecutionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ExecutionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ExecutionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ExecutionResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ExecutionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ExecutionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ExecutionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ExecutionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ExecutionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ExecutionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ExecutionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "reportVersionId": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "outputFormatConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `reportVersionId` | Sí | `string` | formato `uuid` | Versión con la que se ejecuta | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `outputFormatConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a output format concept. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: REPORTING_ADMIN, REPORT_VIEWER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Definición no encontrada | Excepción explícita en src/modules/reporting/services/reporting-runs.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La definición no está activa | Excepción explícita en src/modules/reporting/services/reporting-runs.service.ts |
| 422 | `PRECONDITION_FAILED` | La definición no tiene versión publicada | Excepción explícita en src/modules/reporting/services/reporting-runs.service.ts |
| 422 | `PRECONDITION_FAILED` | Faltan parámetros obligatorios del reporte | Excepción explícita en src/modules/reporting/services/reporting-runs.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/reporting/definitions/{id}/executions"
}
```

---

## 6. POST /reporting/definitions/{id}/schedules

- **Módulo:** `reporting`
- **Etiqueta OpenAPI:** `reporting`
- **Nombre:** Programar la distribución periódica del reporte
- **Operation ID:** `ReportingController_createSchedule`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ReportingController.createSchedule](../../src/modules/reporting/controllers/reporting.controller.ts)

### Descripción de negocio

Programar la distribución periódica del reporte. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /reporting/definitions/{id}/schedules` en `ReportingController_createSchedule`. El controlador delega en `ReportingRunsService.createSchedule`. Valida el body como `ReportingCreateScheduleDto` y consume `application/json`. El tipo de retorno estático es `Promise<ScheduleResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ReportingCreateScheduleDto`; los campos opcionales se omiten.

```http
POST /reporting/definitions/00000000-0000-4000-8000-000000000001/schedules HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "name": "Nombre de ejemplo",
  "cronExpression": "valor-ejemplo",
  "outputFormat": "CSV",
  "firstRunAt": "2026-07-31T12:00:00.000Z"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `REPORTING_ADMIN`, `REPORT_AUTHOR`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `name` | Sí | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `cronExpression` | Sí | `string` | longitud máxima 100 | Expresión cron de cinco campos | `valor-ejemplo` |
| `timeZone` | No | `string` | longitud máxima 100 | Zona horaria IANA | `UTC` |
| `parametersJson` | No | `object` | Sin restricción adicional declarada | Parámetros fijos de cada corrida programada | `{}` |
| `outputFormat` | Sí | `string` | valores: `CSV`, `XLSX`, `PDF`, `JSON` | Sin descripción específica en el contrato OpenAPI. | `CSV` |
| `firstRunAt` | Sí | `string` | formato `date-time` | Primera corrida. El cliente resuelve el cron; aquí se guarda el instante. | `2026-07-31T12:00:00.000Z` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /reporting/definitions/00000000-0000-4000-8000-000000000001/schedules HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ScheduleResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ScheduleResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ScheduleResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ScheduleResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ScheduleResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ScheduleResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ScheduleResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ScheduleResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ScheduleResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ScheduleResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ScheduleResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "name": "Nombre de ejemplo",
  "nextRunAt": "2026-07-31T12:00:00.000Z",
  "stateConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `name` | Sí | `string` | Sin restricción adicional declarada | Valor de name mantenido por la instancia. | `Nombre de ejemplo` |
| `nextRunAt` | Sí | `string` | formato `date-time` | Valor de next run at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `stateConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a state concept. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: REPORTING_ADMIN, REPORT_AUTHOR. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Definición no encontrada | Excepción explícita en src/modules/reporting/services/reporting-runs.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La definición no está activa | Excepción explícita en src/modules/reporting/services/reporting-runs.service.ts |
| 422 | `PRECONDITION_FAILED` | Faltan parámetros obligatorios del reporte | Excepción explícita en src/modules/reporting/services/reporting-runs.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/reporting/definitions/{id}/schedules"
}
```

---

## 7. POST /reporting/definitions/{id}/versions/publish

- **Módulo:** `reporting`
- **Etiqueta OpenAPI:** `reporting`
- **Nombre:** Publicar una versión del reporte
- **Operation ID:** `ReportingController_publishVersion`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ReportingController.publishVersion](../../src/modules/reporting/controllers/reporting.controller.ts)

### Descripción de negocio

La versión congela consulta y parámetros; la definición pasa a activa.


### Descripción del sistema

NestJS resuelve `POST /reporting/definitions/{id}/versions/publish` en `ReportingController_publishVersion`. El controlador delega en `ReportingDefinitionsService.publishVersion`. Valida el body como `PublishReportVersionDto` y consume `application/json`. El tipo de retorno estático es `Promise<ReportVersionResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `PublishReportVersionDto`; los campos opcionales se omiten.

```http
POST /reporting/definitions/00000000-0000-4000-8000-000000000001/versions/publish HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `REPORTING_ADMIN`, `REPORT_AUTHOR`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `changeNote` | No | `string` | Sin restricción adicional declarada | Qué cambió respecto de la versión anterior | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /reporting/definitions/00000000-0000-4000-8000-000000000001/versions/publish HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "changeNote": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ReportVersionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ReportVersionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ReportVersionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ReportVersionResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ReportVersionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ReportVersionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ReportVersionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ReportVersionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ReportVersionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ReportVersionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ReportVersionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "version": 1,
  "definitionStateConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `version` | Sí | `number` | Sin restricción adicional declarada | Valor de version mantenido por la instancia. | `1` |
| `definitionStateConceptId` | Sí | `string` | formato `uuid` | Estado en el que queda la definición | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: REPORTING_ADMIN, REPORT_AUTHOR. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Definición no encontrada | Excepción explícita en src/modules/reporting/services/reporting-definitions.service.ts |
| 409 | `CONFLICT` | Esa versión ya está publicada | Excepción explícita en src/modules/reporting/services/reporting-definitions.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Una definición deprecada no admite versiones | Excepción explícita en src/modules/reporting/services/reporting-definitions.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/reporting/definitions/{id}/versions/publish"
}
```

---

## 8. POST /reporting/executions/{id}/distributions

- **Módulo:** `reporting`
- **Etiqueta OpenAPI:** `reporting`
- **Nombre:** Crear las distribuciones del reporte por destinatario
- **Operation ID:** `ReportingController_dispatchDistributions`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ReportingController.dispatchDistributions](../../src/modules/reporting/controllers/reporting.controller.ts)

### Descripción de negocio

Una fila por destinatario; el envío real lo hace messaging.


### Descripción del sistema

NestJS resuelve `POST /reporting/executions/{id}/distributions` en `ReportingController_dispatchDistributions`. El controlador delega en `ReportingRunsService.dispatchDistributions`. Valida el body como `DispatchDistributionDto` y consume `application/json`. El tipo de retorno estático es `Promise<DispatchResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `DispatchDistributionDto`; los campos opcionales se omiten.

```http
POST /reporting/executions/00000000-0000-4000-8000-000000000001/distributions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `REPORTING_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `recipients` | No | `array<DistributionRecipientDto>` | Sin restricción adicional declarada | Destinatarios extra además de los suscritos a la programación | `[{"recipientType":"USER","recipientUserId":"00000000-0000-4000-8000-000000000001","recipientAddress":"valor-ejemplo","channelId":"00000000-0000-4000-8000-000000000001"}]` |
| `recipients[].recipientType` | No | `string` | valores: `USER`, `ADDRESS` | Sin descripción específica en el contrato OpenAPI. | `USER` |
| `recipients[].recipientUserId` | No | `string` | formato `uuid` | Obligatorio si el tipo es USER | `00000000-0000-4000-8000-000000000001` |
| `recipients[].recipientAddress` | No | `string` | longitud máxima 300 | Obligatorio si el tipo es ADDRESS | `valor-ejemplo` |
| `recipients[].channelId` | No | `string` | formato `uuid` | Canal por el que se entrega | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /reporting/executions/00000000-0000-4000-8000-000000000001/distributions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<DispatchResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<DispatchResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<DispatchResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<DispatchResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<DispatchResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<DispatchResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<DispatchResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<DispatchResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<DispatchResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<DispatchResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DispatchResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "eventId": "00000000-0000-4000-8000-000000000001",
  "dispatchedAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `eventId` | Sí | `string` | formato `uuid` | Evento de despacho registrado | `00000000-0000-4000-8000-000000000001` |
| `dispatchedAt` | Sí | `string` | formato `date-time` | Valor de dispatched at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, REPORTING_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Ejecución no encontrada | Excepción explícita en src/modules/reporting/services/reporting-runs.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Sólo se distribuye una ejecución que terminó con éxito | Excepción explícita en src/modules/reporting/services/reporting-runs.service.ts |
| 422 | `PRECONDITION_FAILED` | Un destinatario USER necesita su identificador | Excepción explícita en src/modules/reporting/services/reporting-runs.service.ts |
| 422 | `PRECONDITION_FAILED` | Un destinatario ADDRESS necesita su dirección | Excepción explícita en src/modules/reporting/services/reporting-runs.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/reporting/executions/{id}/distributions"
}
```

---

## 9. POST /reporting/executions/{id}/retry

- **Módulo:** `reporting`
- **Etiqueta OpenAPI:** `reporting`
- **Nombre:** Devolver a la cola una corrida fallida
- **Operation ID:** `ReportingController_retryExecution`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ReportingController.retryExecution](../../src/modules/reporting/controllers/reporting.controller.ts)

### Descripción de negocio

Limpia el error y, si se pide, reencola sus distribuciones.


### Descripción del sistema

NestJS resuelve `POST /reporting/executions/{id}/retry` en `ReportingController_retryExecution`. El controlador delega en `ReportingRunsService.retryExecution`. Valida el body como `RetryExecutionDto` y consume `application/json`. El tipo de retorno estático es `Promise<RetryExecutionResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RetryExecutionDto`; los campos opcionales se omiten.

```http
POST /reporting/executions/00000000-0000-4000-8000-000000000001/retry HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `REPORTING_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `requeueDistributions` | No | `boolean` | Sin restricción adicional declarada | Reencolar también las distribuciones que dependían de la corrida | `false` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /reporting/executions/00000000-0000-4000-8000-000000000001/retry HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "requeueDistributions": false
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<RetryExecutionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<RetryExecutionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<RetryExecutionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<RetryExecutionResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<RetryExecutionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<RetryExecutionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<RetryExecutionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<RetryExecutionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<RetryExecutionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<RetryExecutionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `RetryExecutionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "distributionsRequeued": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `distributionsRequeued` | Sí | `number` | Sin restricción adicional declarada | Distribuciones devueltas a pendiente | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, REPORTING_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Ejecución no encontrada | Excepción explícita en src/modules/reporting/services/reporting-runs.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Sólo se reintenta una ejecución fallida | Excepción explícita en src/modules/reporting/services/reporting-runs.service.ts |
| 422 | `PRECONDITION_FAILED` | La definición está deprecada: no se reintenta su corrida | Excepción explícita en src/modules/reporting/services/reporting-runs.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/reporting/executions/{id}/retry"
}
```

---

## 10. POST /reporting/executions/{id}/snapshot

- **Módulo:** `reporting`
- **Etiqueta OpenAPI:** `reporting`
- **Nombre:** Registrar el artefacto materializado y cerrar la corrida
- **Operation ID:** `ReportingController_materializeSnapshot`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ReportingController.materializeSnapshot](../../src/modules/reporting/controllers/reporting.controller.ts)

### Descripción de negocio

El hash del contenido permite reconocer artefactos idénticos.


### Descripción del sistema

NestJS resuelve `POST /reporting/executions/{id}/snapshot` en `ReportingController_materializeSnapshot`. El controlador delega en `ReportingRunsService.materializeSnapshot`. Valida el body como `MaterializeSnapshotDto` y consume `application/json`. El tipo de retorno estático es `Promise<SnapshotResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `MaterializeSnapshotDto`; los campos opcionales se omiten.

```http
POST /reporting/executions/00000000-0000-4000-8000-000000000001/snapshot HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "storageUri": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `storageUri` | Sí | `string` | Sin restricción adicional declarada | Ubicación del artefacto en el almacén de objetos | `valor-ejemplo` |
| `contentHash` | No | `string` | longitud máxima 128 | Hash del contenido, para deduplicar artefactos | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |
| `rowCount` | No | `number` | mínimo 0 | Filas del resultado | `1` |
| `sizeBytes` | No | `number` | mínimo 0 | Tamaño del artefacto en bytes | `1` |
| `outputFileId` | No | `string` | formato `uuid` | Archivo en `common.files` | `00000000-0000-4000-8000-000000000001` |
| `retentionDays` | No | `number` | mínimo 1 | Días de retención del artefacto | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /reporting/executions/00000000-0000-4000-8000-000000000001/snapshot HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "storageUri": "valor-ejemplo",
  "contentHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "rowCount": 1,
  "sizeBytes": 1,
  "outputFileId": "00000000-0000-4000-8000-000000000001",
  "retentionDays": 1
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<SnapshotResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<SnapshotResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<SnapshotResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<SnapshotResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<SnapshotResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<SnapshotResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<SnapshotResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<SnapshotResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<SnapshotResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<SnapshotResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `SnapshotResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "reportExecutionId": "00000000-0000-4000-8000-000000000001",
  "executionStatusConceptId": "00000000-0000-4000-8000-000000000001",
  "expiresAt": "2026-07-31T12:00:00.000Z",
  "contentDeduplicated": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `reportExecutionId` | Sí | `string` | formato `uuid` | Identificador asociado a report execution. | `00000000-0000-4000-8000-000000000001` |
| `executionStatusConceptId` | Sí | `string` | formato `uuid` | Estado en el que queda la ejecución | `00000000-0000-4000-8000-000000000001` |
| `expiresAt` | No | `string` | formato `date-time` | Valor de expires at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `contentDeduplicated` | Sí | `boolean` | Sin restricción adicional declarada | true si ya existía un artefacto con el mismo contenido | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Ejecución no encontrada | Excepción explícita en src/modules/reporting/services/reporting-runs.service.ts |
| 409 | `CONFLICT` | La ejecución ya está materializada | Excepción explícita en src/modules/reporting/services/reporting-runs.service.ts |
| 409 | `CONFLICT` | La ejecución ya tiene snapshot | Excepción explícita en src/modules/reporting/services/reporting-runs.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Una ejecución fallida se reintenta antes de materializar | Excepción explícita en src/modules/reporting/services/reporting-runs.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/reporting/executions/{id}/snapshot"
}
```

---

## 11. POST /reporting/scheduler/tick

- **Módulo:** `reporting`
- **Etiqueta OpenAPI:** `reporting`
- **Nombre:** Disparar las programaciones vencidas
- **Operation ID:** `ReportingController_schedulerTick`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ReportingController.schedulerTick](../../src/modules/reporting/controllers/reporting.controller.ts)

### Descripción de negocio

Toma con SKIP LOCKED: un disparo por ventana aunque los ticks se solapen.


### Descripción del sistema

NestJS resuelve `POST /reporting/scheduler/tick` en `ReportingController_schedulerTick`. El controlador delega en `ReportingRunsService.schedulerTick`. Valida el body como `SchedulerTickDto` y consume `application/json`. El tipo de retorno estático es `Promise<SchedulerTickResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `SchedulerTickDto`; los campos opcionales se omiten.

```http
POST /reporting/scheduler/tick HTTP/1.1
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
| `batchSize` | No | `number` | mínimo 1; máximo 500 | Programaciones a procesar por tick | `50` |
| `intervalMinutes` | No | `number` | mínimo 1 | Minutos hasta la siguiente corrida. El cálculo del cron vive fuera. | `1440` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /reporting/scheduler/tick HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "batchSize": 50,
  "intervalMinutes": 1440
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<SchedulerTickResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<SchedulerTickResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<SchedulerTickResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<SchedulerTickResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<SchedulerTickResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<SchedulerTickResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<SchedulerTickResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<SchedulerTickResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<SchedulerTickResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `SchedulerTickResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "scanned": 1,
  "queued": 1,
  "skipped": 1,
  "executionIds": [
    "valor-ejemplo"
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `scanned` | Sí | `number` | Sin restricción adicional declarada | Programaciones vencidas tomadas en este tick | `1` |
| `queued` | Sí | `number` | Sin restricción adicional declarada | Ejecuciones encoladas | `1` |
| `skipped` | Sí | `number` | Sin restricción adicional declarada | Programaciones omitidas por no tener versión publicada | `1` |
| `executionIds` | Sí | `array<string>` | formato `uuid` | Valor de execution ids mantenido por la instancia. | `["valor-ejemplo"]` |

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
  "path": "/reporting/scheduler/tick"
}
```

---

## 12. POST /reporting/schedules/{id}/subscriptions

- **Módulo:** `reporting`
- **Etiqueta OpenAPI:** `reporting`
- **Nombre:** Suscribirse a una programación
- **Operation ID:** `ReportingController_subscribe`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ReportingController.subscribe](../../src/modules/reporting/controllers/reporting.controller.ts)

### Descripción de negocio

El suscriptor es el usuario autenticado; volver a suscribirse reactiva.


### Descripción del sistema

NestJS resuelve `POST /reporting/schedules/{id}/subscriptions` en `ReportingController_subscribe`. El controlador delega en `ReportingRunsService.subscribe`. Valida el body como `SubscribeDto` y consume `application/json`. El tipo de retorno estático es `Promise<SubscriptionResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `SubscribeDto`; los campos opcionales se omiten.

```http
POST /reporting/schedules/00000000-0000-4000-8000-000000000001/subscriptions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "channelId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `REPORT_VIEWER`, `REPORTING_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `channelId` | Sí | `string` | formato `uuid` | Canal por el que se quiere recibir | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /reporting/schedules/00000000-0000-4000-8000-000000000001/subscriptions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "channelId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<SubscriptionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<SubscriptionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<SubscriptionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<SubscriptionResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<SubscriptionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<SubscriptionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<SubscriptionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<SubscriptionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<SubscriptionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<SubscriptionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `SubscriptionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "reportScheduleId": "00000000-0000-4000-8000-000000000001",
  "isActive": true,
  "reactivated": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `reportScheduleId` | Sí | `string` | formato `uuid` | Identificador asociado a report schedule. | `00000000-0000-4000-8000-000000000001` |
| `isActive` | Sí | `boolean` | Sin restricción adicional declarada | Valor de is active mantenido por la instancia. | `true` |
| `reactivated` | Sí | `boolean` | Sin restricción adicional declarada | true si la suscripción ya existía y se reactivó | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: REPORT_VIEWER, REPORTING_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Programación no encontrada | Excepción explícita en src/modules/reporting/services/reporting-runs.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La programación no está activa | Excepción explícita en src/modules/reporting/services/reporting-runs.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/reporting/schedules/{id}/subscriptions"
}
```

---

