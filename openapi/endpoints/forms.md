<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `forms`

Referencia exhaustiva de 21 operación(es) del módulo `forms`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `forms-assignments`, `forms-definition-sets`, `forms-fields`, `forms-instances`, `forms-me`, `forms-values`
- **Controladores:** `FormsAssignmentsController`, `FormsDefinitionSetsController`, `FormsFieldsController`, `FormsInstancesController`, `FormsMeController`, `FormsValuesController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [GET /forms/assignments](#1-get-forms-assignments) — Listar asignaciones de campo (globales y del tenant)
2. [POST /forms/assignments](#2-post-forms-assignments) — Asignar campos a un target con política de extensión
3. [GET /forms/assignments/budget](#3-get-forms-assignments-budget) — Presupuesto de extensión del target para el tenant actual
4. [GET /forms/definition-sets](#4-get-forms-definition-sets) — Listar los sets de definiciones visibles
5. [POST /forms/definition-sets](#5-post-forms-definition-sets) — Definir un set de campos dinámicos y su versión inicial
6. [GET /forms/definition-sets/{id}](#6-get-forms-definition-sets-id) — Leer un set con sus versiones, campos (reglas, dependencias, i18n) y secciones
7. [POST /forms/definition-sets/{id}/migrations/{migrationId}/run](#7-post-forms-definition-sets-id-migrations-migrationid-run) — Migrar valores entre versiones de schema
8. [POST /forms/definition-sets/{id}/versions/{ver}/publish](#8-post-forms-definition-sets-id-versions-ver-publish) — Componer miembros del set y publicar la versión
9. [POST /forms/field-definitions](#9-post-forms-field-definitions) — Declarar una definición de campo con reglas de validación
10. [POST /forms/fields/{id}/access-rules](#10-post-forms-fields-id-access-rules) — Definir reglas de acceso y enmascarado por campo
11. [POST /forms/fields/{id}/dependencies](#11-post-forms-fields-id-dependencies) — Definir dependencias condicionales entre campos
12. [PUT /forms/fields/{id}/localizations/{lang}](#12-put-forms-fields-id-localizations-lang) — Localizar (i18n) una definición de campo
13. [GET /forms/instances](#13-get-forms-instances) — Listar las instancias de formulario de un encuentro
14. [POST /forms/instances](#14-post-forms-instances) — Abrir una instancia de formulario para un recurso
15. [GET /forms/instances/{id}](#15-get-forms-instances-id) — Leer una instancia con sus valores vigentes, por tipo resuelto
16. [POST /forms/instances/{id}/close](#16-post-forms-instances-id-close) — Cerrar formulario y proyectar vista de recurso
17. [POST /forms/instances/{id}/values](#17-post-forms-instances-id-values) — Capturar valores de formulario (value[x] exclusivo)
18. [GET /forms/me/instances](#18-get-forms-me-instances) — Ver mis formularios clínicos
19. [GET /forms/me/instances/{id}](#19-get-forms-me-instances-id) — Leer un formulario propio con sus respuestas
20. [PATCH /forms/values/{id}](#20-patch-forms-values-id) — Corregir valor con supersede y snapshot inmutable
21. [POST /forms/values/import](#21-post-forms-values-import) — Registrar procedencia de valores importados (batch ETL)

---

## 1. GET /forms/assignments

- **Módulo:** `forms`
- **Etiqueta OpenAPI:** `forms-assignments`
- **Nombre:** Listar asignaciones de campo (globales y del tenant)
- **Operation ID:** `FormsAssignmentsController_listAssignments`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [FormsAssignmentsController.listAssignments](../../src/modules/forms/controllers/forms-assignments.controller.ts)

### Descripción de negocio

Listar asignaciones de campo (globales y del tenant). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Fase 1 de lecturas: asignaciones visibles, con secciones resueltas.

### Descripción del sistema

NestJS resuelve `GET /forms/assignments` en `FormsAssignmentsController_listAssignments`. El controlador delega en `FormsReadService.listAssignments`. No recibe body. El tipo de retorno estático es `Promise<FieldAssignmentListResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `targetResourceConceptId` | query | No | `string` | Sin restricción adicional declarada | Acotar por target | `00000000-0000-4000-8000-000000000001` |
| `fieldId` | query | No | `string` | Sin restricción adicional declarada | Acotar por campo | `00000000-0000-4000-8000-000000000001` |
| `sectionId` | query | No | `string` | Sin restricción adicional declarada | Acotar por sección | `00000000-0000-4000-8000-000000000001` |
| `limit` | query | No | `number` | Sin restricción adicional declarada | Tope del listado (por defecto 50) | `1` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /forms/assignments HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CLINICIAN`, `PRACTITIONER`, `SECURITY_ADMIN`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /forms/assignments?targetResourceConceptId=00000000-0000-4000-8000-000000000001&fieldId=00000000-0000-4000-8000-000000000001&sectionId=00000000-0000-4000-8000-000000000001&limit=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<FieldAssignmentListResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<FieldAssignmentListResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<FieldAssignmentListResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<FieldAssignmentListResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<FieldAssignmentListResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<FieldAssignmentListResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `FieldAssignmentListResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "fieldId": "00000000-0000-4000-8000-000000000001",
      "targetResourceConceptId": "00000000-0000-4000-8000-000000000001",
      "profileTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "tenantId": "00000000-0000-4000-8000-000000000001",
      "branchId": "00000000-0000-4000-8000-000000000001",
      "sectionId": "00000000-0000-4000-8000-000000000001",
      "required": true,
      "visible": true,
      "editable": true,
      "ordinal": 1,
      "validFrom": "2026-07-31T12:00:00.000Z",
      "validTo": "2026-07-31T12:00:00.000Z",
      "stateConceptId": "00000000-0000-4000-8000-000000000001"
    }
  ],
  "sections": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "code": "CODIGO_EJEMPLO",
      "name": "Nombre de ejemplo",
      "parentSectionId": "00000000-0000-4000-8000-000000000001",
      "ordinal": 1
    }
  ],
  "limit": 1,
  "truncated": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<FieldAssignmentItemDto>` | Sin restricción adicional declarada | Valor de items mantenido por la instancia. | `[{"id":"00000000-0000-4000-8000-000000000001","fieldId":"00000000-0000-4000-8000-000000000001","targetResourceConceptId":"00000000-0000-4000-8000-000000000001","profileTypeConceptId":"00000000-0000-4000-8000-000000000001","tenantId":"00000000-0000-4000-8000-000000000001","branchId":"00000000-0000-4000-8000-000000000001","sectionId":"00000000-0000-4000-8000-000000000001","required":true,"visible":true,"editable":true,"ordinal":1,"validFrom":"2026-07-31T12:00:00.000Z","validTo":"2026-07-31T12:00:00.000Z","stateConceptId":"00000000-0000-4000-8000-000000000001"}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `items[].fieldId` | Sí | `string` | formato `uuid` | Identificador asociado a field. | `00000000-0000-4000-8000-000000000001` |
| `items[].targetResourceConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a target resource concept. | `00000000-0000-4000-8000-000000000001` |
| `items[].profileTypeConceptId` | No | `string` | formato `uuid` | Identificador asociado a profile type concept. | `00000000-0000-4000-8000-000000000001` |
| `items[].tenantId` | No | `string` | formato `uuid` | Identificador asociado a tenant. | `00000000-0000-4000-8000-000000000001` |
| `items[].branchId` | No | `string` | formato `uuid` | Identificador asociado a branch. | `00000000-0000-4000-8000-000000000001` |
| `items[].sectionId` | Sí | `string` | formato `uuid` | Identificador asociado a section. | `00000000-0000-4000-8000-000000000001` |
| `items[].required` | Sí | `boolean` | Sin restricción adicional declarada | Valor de required mantenido por la instancia. | `true` |
| `items[].visible` | Sí | `boolean` | Sin restricción adicional declarada | Valor de visible mantenido por la instancia. | `true` |
| `items[].editable` | Sí | `boolean` | Sin restricción adicional declarada | Valor de editable mantenido por la instancia. | `true` |
| `items[].ordinal` | No | `number` | Sin restricción adicional declarada | Valor de ordinal mantenido por la instancia. | `1` |
| `items[].validFrom` | No | `string` | formato `date-time` | Valor de valid from mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `items[].validTo` | No | `string` | formato `date-time` | Valor de valid to mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `items[].stateConceptId` | No | `string` | formato `uuid` | Identificador asociado a state concept. | `00000000-0000-4000-8000-000000000001` |
| `sections` | Sí | `array<SectionItemDto>` | Sin restricción adicional declarada | Las secciones que las asignaciones referencian, resueltas | `[{"id":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","parentSectionId":"00000000-0000-4000-8000-000000000001","ordinal":1}]` |
| `sections[].id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `sections[].code` | Sí | `string` | Sin restricción adicional declarada | Valor de code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `sections[].name` | Sí | `string` | Sin restricción adicional declarada | Valor de name mantenido por la instancia. | `Nombre de ejemplo` |
| `sections[].parentSectionId` | No | `string` | formato `uuid` | Identificador asociado a parent section. | `00000000-0000-4000-8000-000000000001` |
| `sections[].ordinal` | No | `number` | Sin restricción adicional declarada | Valor de ordinal mantenido por la instancia. | `1` |
| `limit` | Sí | `number` | Sin restricción adicional declarada | Tope aplicado al listado | `1` |
| `truncated` | Sí | `boolean` | Sin restricción adicional declarada | true si quedaron asignaciones fuera del tope. Se declara, no se calla | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, PRACTITIONER, SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/forms/assignments"
}
```

---

## 2. POST /forms/assignments

- **Módulo:** `forms`
- **Etiqueta OpenAPI:** `forms-assignments`
- **Nombre:** Asignar campos a un target con política de extensión
- **Operation ID:** `FormsAssignmentsController_createAssignment`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [FormsAssignmentsController.createAssignment](../../src/modules/forms/controllers/forms-assignments.controller.ts)

### Descripción de negocio

Asignar campos a un target con política de extensión. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /forms/assignments` en `FormsAssignmentsController_createAssignment`. El controlador delega en `FormsAssignmentsService.createAssignment`. Valida el body como `CreateAssignmentDto` y consume `application/json`. El tipo de retorno estático es `Promise<IdResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateAssignmentDto`; los campos opcionales se omiten.

```http
POST /forms/assignments HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "fieldId": "00000000-0000-4000-8000-000000000001",
  "targetResourceConceptId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CLINICIAN`, `PRACTITIONER`, `SECURITY_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `fieldId` | Sí | `string` | formato `uuid` | Campo a asignar | `00000000-0000-4000-8000-000000000001` |
| `targetResourceConceptId` | Sí | `string` | formato `uuid` | Recurso destino (concept id) | `00000000-0000-4000-8000-000000000001` |
| `sectionId` | No | `string` | formato `uuid` | Sección destino; si se omite se aprovisiona una por defecto | `00000000-0000-4000-8000-000000000001` |
| `profileTypeConceptId` | No | `string` | formato `uuid` | Perfil objetivo (concept id) | `00000000-0000-4000-8000-000000000001` |
| `tenantId` | No | `string` | formato `uuid` | Tenant que crea la asignación | `00000000-0000-4000-8000-000000000001` |
| `branchId` | No | `string` | formato `uuid` | Branch destino | `00000000-0000-4000-8000-000000000001` |
| `required` | No | `boolean` | Sin restricción adicional declarada | ¿Requerido? | `false` |
| `visible` | No | `boolean` | Sin restricción adicional declarada | ¿Visible? | `true` |
| `editable` | No | `boolean` | Sin restricción adicional declarada | ¿Editable? | `true` |
| `ordinal` | No | `number` | Sin restricción adicional declarada | Orden de presentación | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /forms/assignments HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "fieldId": "00000000-0000-4000-8000-000000000001",
  "targetResourceConceptId": "00000000-0000-4000-8000-000000000001",
  "sectionId": "00000000-0000-4000-8000-000000000001",
  "profileTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "branchId": "00000000-0000-4000-8000-000000000001",
  "required": false,
  "visible": true,
  "editable": true,
  "ordinal": 1
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<IdResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `IdResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, PRACTITIONER, SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Sólo se pueden asignar campos dentro de la propia organización | Excepción explícita en src/modules/forms/services/forms-assignments.service.ts |
| 403 | `FORBIDDEN` | Este formulario no admite campos propios: no tiene política de extensión activa | Excepción explícita en src/modules/forms/services/forms-assignments.service.ts |
| 403 | `FORBIDDEN` | La política de este formulario no permite campos del tenant | Excepción explícita en src/modules/forms/services/forms-assignments.service.ts |
| 404 | `NOT_FOUND` | Campo no encontrado | Excepción explícita en src/modules/forms/services/forms-assignments.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Se excedió el presupuesto de campos del target | Excepción explícita en src/modules/forms/services/forms-assignments.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/forms/assignments"
}
```

---

## 3. GET /forms/assignments/budget

- **Módulo:** `forms`
- **Etiqueta OpenAPI:** `forms-assignments`
- **Nombre:** Presupuesto de extensión del target para el tenant actual
- **Operation ID:** `FormsAssignmentsController_getBudget`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [FormsAssignmentsController.getBudget](../../src/modules/forms/controllers/forms-assignments.controller.ts)

### Descripción de negocio

Presupuesto de extensión del target para el tenant actual. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Cuánto puede extender el tenant este target, antes de escribir nada. Va acá y no en un controlador propio porque es la misma regla que aplica el `POST` de al lado; separarlas es lo que hace que una diga que sí y la otra que no.

### Descripción del sistema

NestJS resuelve `GET /forms/assignments/budget` en `FormsAssignmentsController_getBudget`. El controlador delega en `FormsReadService.getExtensionBudget`. No recibe body. El tipo de retorno estático es `Promise<ExtensionBudgetResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `targetResourceConceptId` | query | Sí | `string` | Sin restricción adicional declarada | Target cuyo presupuesto se consulta | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /forms/assignments/budget?targetResourceConceptId=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CLINICIAN`, `PRACTITIONER`, `SECURITY_ADMIN`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /forms/assignments/budget?targetResourceConceptId=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ExtensionBudgetResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<ExtensionBudgetResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<ExtensionBudgetResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<ExtensionBudgetResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<ExtensionBudgetResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<ExtensionBudgetResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ExtensionBudgetResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "targetResourceConceptId": "00000000-0000-4000-8000-000000000001",
  "allowTenantFields": true,
  "maximumFields": 1,
  "used": 1,
  "remaining": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `targetResourceConceptId` | Sí | `string` | formato `uuid` | Target sobre el que se consultó el presupuesto. | `00000000-0000-4000-8000-000000000001` |
| `allowTenantFields` | Sí | `boolean` | Sin restricción adicional declarada | ¿La política deja que la organización cuelgue campos propios? Sin política activa es false | `true` |
| `maximumFields` | No | `number` | Sin restricción adicional declarada | Tope de la política; ausente significa sin tope declarado | `1` |
| `used` | Sí | `number` | Sin restricción adicional declarada | Campos activos que el tenant ya colgó | `1` |
| `remaining` | No | `number` | Sin restricción adicional declarada | Campos que quedan; ausente cuando no hay tope declarado | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, PRACTITIONER, SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/forms/assignments/budget"
}
```

---

## 4. GET /forms/definition-sets

- **Módulo:** `forms`
- **Etiqueta OpenAPI:** `forms-definition-sets`
- **Nombre:** Listar los sets de definiciones visibles
- **Operation ID:** `FormsDefinitionSetsController_listDefinitionSets`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [FormsDefinitionSetsController.listDefinitionSets](../../src/modules/forms/controllers/forms-definition-sets.controller.ts)

### Descripción de negocio

Listar los sets de definiciones visibles. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Fase 1 de lecturas: listar los sets visibles (globales y del tenant).

### Descripción del sistema

NestJS resuelve `GET /forms/definition-sets` en `FormsDefinitionSetsController_listDefinitionSets`. El controlador delega en `FormsReadService.listDefinitionSets`. No recibe body. El tipo de retorno estático es `Promise<DefinitionSetListResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `limit` | query | No | `number` | Sin restricción adicional declarada | Tope del listado (por defecto 50) | `1` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /forms/definition-sets HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CLINICIAN`, `PRACTITIONER`, `SECURITY_ADMIN`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /forms/definition-sets?limit=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<DefinitionSetListResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<DefinitionSetListResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<DefinitionSetListResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<DefinitionSetListResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<DefinitionSetListResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<DefinitionSetListResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DefinitionSetListResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "namespaceUri": "Nombre de ejemplo",
      "code": "CODIGO_EJEMPLO",
      "name": "Nombre de ejemplo",
      "ownerTenantId": "00000000-0000-4000-8000-000000000001",
      "targetDomainConceptId": "00000000-0000-4000-8000-000000000001",
      "statusConceptId": "00000000-0000-4000-8000-000000000001",
      "createdAt": "2026-07-31T12:00:00.000Z"
    }
  ],
  "limit": 1,
  "truncated": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<DefinitionSetItemDto>` | Sin restricción adicional declarada | Valor de items mantenido por la instancia. | `[{"id":"00000000-0000-4000-8000-000000000001","namespaceUri":"Nombre de ejemplo","code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","ownerTenantId":"00000000-0000-4000-8000-000000000001","targetDomainConceptId":"00000000-0000-4000-8000-000000000001","statusConceptId":"00000000-0000-4000-8000-000000000001","createdAt":"2026-07-31T12:00:00.000Z"}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `items[].namespaceUri` | Sí | `string` | Sin restricción adicional declarada | Valor de namespace uri mantenido por la instancia. | `Nombre de ejemplo` |
| `items[].code` | Sí | `string` | Sin restricción adicional declarada | Valor de code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `items[].name` | Sí | `string` | Sin restricción adicional declarada | Valor de name mantenido por la instancia. | `Nombre de ejemplo` |
| `items[].ownerTenantId` | No | `string` | formato `uuid` | Identificador asociado a owner tenant. | `00000000-0000-4000-8000-000000000001` |
| `items[].targetDomainConceptId` | No | `string` | formato `uuid` | Identificador asociado a target domain concept. | `00000000-0000-4000-8000-000000000001` |
| `items[].statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `items[].createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |
| `limit` | Sí | `number` | Sin restricción adicional declarada | Tope aplicado al listado | `1` |
| `truncated` | Sí | `boolean` | Sin restricción adicional declarada | true si quedaron sets fuera del tope. Se declara, no se calla | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, PRACTITIONER, SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/forms/definition-sets"
}
```

---

## 5. POST /forms/definition-sets

- **Módulo:** `forms`
- **Etiqueta OpenAPI:** `forms-definition-sets`
- **Nombre:** Definir un set de campos dinámicos y su versión inicial
- **Operation ID:** `FormsDefinitionSetsController_createDefinitionSet`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [FormsDefinitionSetsController.createDefinitionSet](../../src/modules/forms/controllers/forms-definition-sets.controller.ts)

### Descripción de negocio

Definir un set de campos dinámicos y su versión inicial. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /forms/definition-sets` en `FormsDefinitionSetsController_createDefinitionSet`. El controlador delega en `FormsSchemaService.createDefinitionSet`. Valida el body como `CreateDefinitionSetDto` y consume `application/json`. El tipo de retorno estático es `Promise<DefinitionSetResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateDefinitionSetDto`; los campos opcionales se omiten.

```http
POST /forms/definition-sets HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "namespaceUri": "Nombre de ejemplo",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `namespaceUri` | Sí | `string` | longitud mínima 1; longitud máxima 500 | URI de namespace único del set | `Nombre de ejemplo` |
| `code` | Sí | `string` | longitud mínima 1; longitud máxima 100 | Código estable del set | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | longitud mínima 1; longitud máxima 200 | Nombre legible | `Nombre de ejemplo` |
| `ownerTenantId` | No | `string` | formato `uuid` | Tenant propietario | `00000000-0000-4000-8000-000000000001` |
| `targetDomainConceptId` | No | `string` | formato `uuid` | Dominio destino (concept id) | `00000000-0000-4000-8000-000000000001` |
| `semanticVersion` | No | `string` | longitud máxima 50 | Versión semántica inicial | `1.0.0` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /forms/definition-sets HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "namespaceUri": "Nombre de ejemplo",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "ownerTenantId": "00000000-0000-4000-8000-000000000001",
  "targetDomainConceptId": "00000000-0000-4000-8000-000000000001",
  "semanticVersion": "1.0.0"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<DefinitionSetResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<DefinitionSetResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<DefinitionSetResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<DefinitionSetResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<DefinitionSetResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<DefinitionSetResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<DefinitionSetResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<DefinitionSetResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<DefinitionSetResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DefinitionSetResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "versionId": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `versionId` | Sí | `string` | formato `uuid` | Versión inicial (draft) creada | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Estado del set (concept id) | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | El namespace ya está en uso | Excepción explícita en src/modules/forms/services/forms-schema.service.ts |
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
  "path": "/forms/definition-sets"
}
```

---

## 6. GET /forms/definition-sets/{id}

- **Módulo:** `forms`
- **Etiqueta OpenAPI:** `forms-definition-sets`
- **Nombre:** Leer un set con sus versiones, campos (reglas, dependencias, i18n) y secciones
- **Operation ID:** `FormsDefinitionSetsController_getDefinitionSet`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [FormsDefinitionSetsController.getDefinitionSet](../../src/modules/forms/controllers/forms-definition-sets.controller.ts)

### Descripción de negocio

Leer un set con sus versiones, campos (reglas, dependencias, i18n) y secciones. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Fase 1 de lecturas: el esquema completo de un set, para render.

### Descripción del sistema

NestJS resuelve `GET /forms/definition-sets/{id}` en `FormsDefinitionSetsController_getDefinitionSet`. El controlador delega en `FormsReadService.getDefinitionSet`. No recibe body. El tipo de retorno estático es `Promise<DefinitionSetDetailResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /forms/definition-sets/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CLINICIAN`, `PRACTITIONER`, `SECURITY_ADMIN`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /forms/definition-sets/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<DefinitionSetDetailResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<DefinitionSetDetailResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<DefinitionSetDetailResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<DefinitionSetDetailResponseDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<DefinitionSetDetailResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<DefinitionSetDetailResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<DefinitionSetDetailResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DefinitionSetDetailResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "versions": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "semanticVersion": "valor-ejemplo",
      "schemaHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      "publicationStatusConceptId": "00000000-0000-4000-8000-000000000001",
      "compatibilityConceptId": "00000000-0000-4000-8000-000000000001",
      "effectiveFrom": "2026-07-31T12:00:00.000Z",
      "effectiveTo": "2026-07-31T12:00:00.000Z",
      "recordedAt": "2026-07-31T12:00:00.000Z",
      "members": [
        {
          "fieldId": "00000000-0000-4000-8000-000000000001",
          "sectionId": "00000000-0000-4000-8000-000000000001",
          "required": true,
          "ordinal": 1
        }
      ]
    }
  ],
  "fields": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "code": "CODIGO_EJEMPLO",
      "name": "Nombre de ejemplo",
      "dataType": "valor-ejemplo",
      "valueSetId": "00000000-0000-4000-8000-000000000001",
      "unitValueSetId": "00000000-0000-4000-8000-000000000001",
      "cardinalityMin": 1,
      "cardinalityMax": 1,
      "lengthMin": 1,
      "lengthMax": 1,
      "regex": "valor-ejemplo",
      "defaultValueJson": {
        "clave": "valor"
      },
      "stateConceptId": "00000000-0000-4000-8000-000000000001",
      "localizations": [
        {
          "languageConceptId": "00000000-0000-4000-8000-000000000001",
          "label": "valor-ejemplo",
          "helpText": "valor-ejemplo",
          "placeholder": "valor-ejemplo",
          "validationMessage": "valor-ejemplo"
        }
      ],
      "validationRules": [
        {
          "id": "00000000-0000-4000-8000-000000000001",
          "ruleTypeConceptId": "00000000-0000-4000-8000-000000000001",
          "operatorConceptId": "00000000-0000-4000-8000-000000000001",
          "parametersJson": {
            "clave": "valor"
          },
          "errorMessage": "valor-ejemplo",
          "severityConceptId": "00000000-0000-4000-8000-000000000001",
          "ordinal": 1,
          "active": true
        }
      ],
      "dependencies": [
        {
          "id": "00000000-0000-4000-8000-000000000001",
          "targetFieldId": "00000000-0000-4000-8000-000000000001",
          "sourceFieldId": "00000000-0000-4000-8000-000000000001",
          "operatorConceptId": "00000000-0000-4000-8000-000000000001",
          "behaviorConceptId": "00000000-0000-4000-8000-000000000001",
          "comparisonValueJson": {
            "clave": "valor"
          },
          "logicalGroup": "valor-ejemplo",
          "ordinal": 1
        }
      ]
    }
  ],
  "sections": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "code": "CODIGO_EJEMPLO",
      "name": "Nombre de ejemplo",
      "parentSectionId": "00000000-0000-4000-8000-000000000001",
      "ordinal": 1
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `versions` | Sí | `array<DefinitionSetVersionDto>` | Sin restricción adicional declarada | Valor de versions mantenido por la instancia. | `[{"id":"00000000-0000-4000-8000-000000000001","semanticVersion":"valor-ejemplo","schemaHash":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","publicationStatusConceptId":"00000000-0000-4000-8000-000000000001","compatibilityConceptId":"00000000-0000-4000-8000-000000000001","effectiveFrom":"2026-07-31T12:00:00.000Z","effectiveTo":"2026-07-31T12:00:00.000Z","recordedAt":"2026-07-31T12:00:00.000Z","members":[{"fieldId":"00000000-0000-4000-8000-000000000001","sectionId":"00000000-0000-4000-8000-000000000001","required":true,"ordinal":1}]}]` |
| `versions[].id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `versions[].semanticVersion` | Sí | `string` | Sin restricción adicional declarada | Valor de semantic version mantenido por la instancia. | `valor-ejemplo` |
| `versions[].schemaHash` | Sí | `string` | Sin restricción adicional declarada | Valor de schema hash mantenido por la instancia. | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |
| `versions[].publicationStatusConceptId` | No | `string` | formato `uuid` | Identificador asociado a publication status concept. | `00000000-0000-4000-8000-000000000001` |
| `versions[].compatibilityConceptId` | No | `string` | formato `uuid` | Identificador asociado a compatibility concept. | `00000000-0000-4000-8000-000000000001` |
| `versions[].effectiveFrom` | No | `string` | formato `date-time` | Valor de effective from mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `versions[].effectiveTo` | No | `string` | formato `date-time` | Valor de effective to mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `versions[].recordedAt` | Sí | `string` | formato `date-time` | Valor de recorded at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `versions[].members` | Sí | `array<SetMemberDto>` | Sin restricción adicional declarada | Campos que componen esta versión, en su orden | `[{"fieldId":"00000000-0000-4000-8000-000000000001","sectionId":"00000000-0000-4000-8000-000000000001","required":true,"ordinal":1}]` |
| `versions[].members[].fieldId` | Sí | `string` | formato `uuid` | Identificador asociado a field. | `00000000-0000-4000-8000-000000000001` |
| `versions[].members[].sectionId` | No | `string` | formato `uuid` | Identificador asociado a section. | `00000000-0000-4000-8000-000000000001` |
| `versions[].members[].required` | No | `boolean` | Sin restricción adicional declarada | Valor de required mantenido por la instancia. | `true` |
| `versions[].members[].ordinal` | No | `number` | Sin restricción adicional declarada | Valor de ordinal mantenido por la instancia. | `1` |
| `fields` | Sí | `array<FieldSchemaDto>` | Sin restricción adicional declarada | Las definiciones de todos los campos miembros, una sola vez aunque participen de varias versiones | `[{"id":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","dataType":"valor-ejemplo","valueSetId":"00000000-0000-4000-8000-000000000001","unitValueSetId":"00000000-0000-4000-8000-000000000001","cardinalityMin":1,"cardinalityMax":1,"lengthMin":1,"lengthMax":1,"regex":"valor-ejemplo","defaultValueJson":{"clave":"valor"},"stateConceptId":"00000000-0000-4000-8000-000000000001","localizations":[{"languageConceptId":"00000000-0000-4000-8000-000000000001","label":"valor-ejemplo","helpText":"valor-ejemplo","placeholder":"valor-ejemplo","validationMessage":"valor-ejemplo"}],"validationRules":[{"id":"00000000-0000-4000-8000-000000000001","ruleTypeConceptId":"00000000-0000-4000-8000-000000000001","operatorConceptId":"00000000-0000-4000-8000-000000000001","parametersJson":{"clave":"valor"},"errorMessage":"valor-ejemplo","severityConceptId":"00000000-0000-4000-8000-000000000001","ordinal":1,"active":true}],"dependencies":[{"id":"00000000-0000-4000-8000-000000000001","targetFieldId":"00000000-0000-4000-8000-000000000001","sourceFieldId":"00000000-0000-4000-8000-000000000001","operatorConceptId":"00000000-0000-4000-8000-000000000001","behaviorConceptId":"00000000-0000-4000-8000-000000000001","comparisonValueJson":{"clave":"valor"},"logicalGroup":"valor-ejemplo","ordinal":1}]}]` |
| `fields[].id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `fields[].code` | Sí | `string` | Sin restricción adicional declarada | Valor de code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `fields[].name` | Sí | `string` | Sin restricción adicional declarada | Valor de name mantenido por la instancia. | `Nombre de ejemplo` |
| `fields[].dataType` | Sí | `string` | Sin restricción adicional declarada | Tipo técnico que decide el control a dibujar | `valor-ejemplo` |
| `fields[].valueSetId` | No | `string` | formato `uuid` | Identificador asociado a value set. | `00000000-0000-4000-8000-000000000001` |
| `fields[].unitValueSetId` | No | `string` | formato `uuid` | Identificador asociado a unit value set. | `00000000-0000-4000-8000-000000000001` |
| `fields[].cardinalityMin` | No | `number` | Sin restricción adicional declarada | Valor de cardinality min mantenido por la instancia. | `1` |
| `fields[].cardinalityMax` | No | `number` | Sin restricción adicional declarada | Valor de cardinality max mantenido por la instancia. | `1` |
| `fields[].lengthMin` | No | `number` | Sin restricción adicional declarada | Valor de length min mantenido por la instancia. | `1` |
| `fields[].lengthMax` | No | `number` | Sin restricción adicional declarada | Valor de length max mantenido por la instancia. | `1` |
| `fields[].regex` | No | `string` | Sin restricción adicional declarada | Valor de regex mantenido por la instancia. | `valor-ejemplo` |
| `fields[].defaultValueJson` | No | `object` | Sin restricción adicional declarada | Valor de default value json mantenido por la instancia. | `{"clave":"valor"}` |
| `fields[].stateConceptId` | No | `string` | formato `uuid` | Identificador asociado a state concept. | `00000000-0000-4000-8000-000000000001` |
| `fields[].localizations` | Sí | `array<FieldLocalizationDto>` | Sin restricción adicional declarada | Valor de localizations mantenido por la instancia. | `[{"languageConceptId":"00000000-0000-4000-8000-000000000001","label":"valor-ejemplo","helpText":"valor-ejemplo","placeholder":"valor-ejemplo","validationMessage":"valor-ejemplo"}]` |
| `fields[].localizations[].languageConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a language concept. | `00000000-0000-4000-8000-000000000001` |
| `fields[].localizations[].label` | No | `string` | Sin restricción adicional declarada | Valor de label mantenido por la instancia. | `valor-ejemplo` |
| `fields[].localizations[].helpText` | No | `string` | Sin restricción adicional declarada | Valor de help text mantenido por la instancia. | `valor-ejemplo` |
| `fields[].localizations[].placeholder` | No | `string` | Sin restricción adicional declarada | Valor de placeholder mantenido por la instancia. | `valor-ejemplo` |
| `fields[].localizations[].validationMessage` | No | `string` | Sin restricción adicional declarada | Valor de validation message mantenido por la instancia. | `valor-ejemplo` |
| `fields[].validationRules` | Sí | `array<FieldValidationRuleDto>` | Sin restricción adicional declarada | Valor de validation rules mantenido por la instancia. | `[{"id":"00000000-0000-4000-8000-000000000001","ruleTypeConceptId":"00000000-0000-4000-8000-000000000001","operatorConceptId":"00000000-0000-4000-8000-000000000001","parametersJson":{"clave":"valor"},"errorMessage":"valor-ejemplo","severityConceptId":"00000000-0000-4000-8000-000000000001","ordinal":1,"active":true}]` |
| `fields[].validationRules[].id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `fields[].validationRules[].ruleTypeConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a rule type concept. | `00000000-0000-4000-8000-000000000001` |
| `fields[].validationRules[].operatorConceptId` | No | `string` | formato `uuid` | Identificador asociado a operator concept. | `00000000-0000-4000-8000-000000000001` |
| `fields[].validationRules[].parametersJson` | Sí | `object` | Sin restricción adicional declarada | Parámetros de la regla, tal como se declararon | `{"clave":"valor"}` |
| `fields[].validationRules[].errorMessage` | No | `string` | Sin restricción adicional declarada | Valor de error message mantenido por la instancia. | `valor-ejemplo` |
| `fields[].validationRules[].severityConceptId` | No | `string` | formato `uuid` | Identificador asociado a severity concept. | `00000000-0000-4000-8000-000000000001` |
| `fields[].validationRules[].ordinal` | No | `number` | Sin restricción adicional declarada | Valor de ordinal mantenido por la instancia. | `1` |
| `fields[].validationRules[].active` | No | `boolean` | Sin restricción adicional declarada | Valor de active mantenido por la instancia. | `true` |
| `fields[].dependencies` | Sí | `array<FieldDependencyDto>` | Sin restricción adicional declarada | Dependencias cuyo destino es este campo | `[{"id":"00000000-0000-4000-8000-000000000001","targetFieldId":"00000000-0000-4000-8000-000000000001","sourceFieldId":"00000000-0000-4000-8000-000000000001","operatorConceptId":"00000000-0000-4000-8000-000000000001","behaviorConceptId":"00000000-0000-4000-8000-000000000001","comparisonValueJson":{"clave":"valor"},"logicalGroup":"valor-ejemplo","ordinal":1}]` |
| `fields[].dependencies[].id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `fields[].dependencies[].targetFieldId` | Sí | `string` | formato `uuid` | Identificador asociado a target field. | `00000000-0000-4000-8000-000000000001` |
| `fields[].dependencies[].sourceFieldId` | Sí | `string` | formato `uuid` | Identificador asociado a source field. | `00000000-0000-4000-8000-000000000001` |
| `fields[].dependencies[].operatorConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a operator concept. | `00000000-0000-4000-8000-000000000001` |
| `fields[].dependencies[].behaviorConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a behavior concept. | `00000000-0000-4000-8000-000000000001` |
| `fields[].dependencies[].comparisonValueJson` | No | `object` | Sin restricción adicional declarada | Valor de comparison value json mantenido por la instancia. | `{"clave":"valor"}` |
| `fields[].dependencies[].logicalGroup` | No | `string` | Sin restricción adicional declarada | Valor de logical group mantenido por la instancia. | `valor-ejemplo` |
| `fields[].dependencies[].ordinal` | No | `number` | Sin restricción adicional declarada | Valor de ordinal mantenido por la instancia. | `1` |
| `sections` | Sí | `array<SectionItemDto>` | Sin restricción adicional declarada | Valor de sections mantenido por la instancia. | `[{"id":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","parentSectionId":"00000000-0000-4000-8000-000000000001","ordinal":1}]` |
| `sections[].id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `sections[].code` | Sí | `string` | Sin restricción adicional declarada | Valor de code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `sections[].name` | Sí | `string` | Sin restricción adicional declarada | Valor de name mantenido por la instancia. | `Nombre de ejemplo` |
| `sections[].parentSectionId` | No | `string` | formato `uuid` | Identificador asociado a parent section. | `00000000-0000-4000-8000-000000000001` |
| `sections[].ordinal` | No | `number` | Sin restricción adicional declarada | Valor de ordinal mantenido por la instancia. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, PRACTITIONER, SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Set de definiciones no encontrado | Excepción explícita en src/modules/forms/services/forms-read.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/forms/definition-sets/{id}"
}
```

---

## 7. POST /forms/definition-sets/{id}/migrations/{migrationId}/run

- **Módulo:** `forms`
- **Etiqueta OpenAPI:** `forms-definition-sets`
- **Nombre:** Migrar valores entre versiones de schema
- **Operation ID:** `FormsDefinitionSetsController_runMigration`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [FormsDefinitionSetsController.runMigration](../../src/modules/forms/controllers/forms-definition-sets.controller.ts)

### Descripción de negocio

Migrar valores entre versiones de schema. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /forms/definition-sets/{id}/migrations/{migrationId}/run` en `FormsDefinitionSetsController_runMigration`. El controlador delega en `FormsSchemaService.runMigration`. Valida el body como `RunMigrationDto` y consume `application/json`. El tipo de retorno estático es `Promise<MigrationRunResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `migrationId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RunMigrationDto`; los campos opcionales se omiten.

```http
POST /forms/definition-sets/00000000-0000-4000-8000-000000000001/migrations/00000000-0000-4000-8000-000000000001/run HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "fromVersionId": "00000000-0000-4000-8000-000000000001",
  "toVersionId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `id`, `migrationId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `fromVersionId` | Sí | `string` | formato `uuid` | Versión origen (publicada) | `00000000-0000-4000-8000-000000000001` |
| `toVersionId` | Sí | `string` | formato `uuid` | Versión destino (publicada) | `00000000-0000-4000-8000-000000000001` |
| `migrationTypeConceptId` | No | `string` | formato `uuid` | Tipo de migración (concept id) | `00000000-0000-4000-8000-000000000001` |
| `transformationExpression` | No | `string` | longitud máxima 4000 | Expresión de transformación | `valor-ejemplo` |
| `validationExpression` | No | `string` | longitud máxima 4000 | Expresión de validación | `valor-ejemplo` |
| `rollbackExpression` | No | `string` | longitud máxima 4000 | Expresión de rollback | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /forms/definition-sets/00000000-0000-4000-8000-000000000001/migrations/00000000-0000-4000-8000-000000000001/run HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "fromVersionId": "00000000-0000-4000-8000-000000000001",
  "toVersionId": "00000000-0000-4000-8000-000000000001",
  "migrationTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "transformationExpression": "valor-ejemplo",
  "validationExpression": "valor-ejemplo",
  "rollbackExpression": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<MigrationRunResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<MigrationRunResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<MigrationRunResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<MigrationRunResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<MigrationRunResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<MigrationRunResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<MigrationRunResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<MigrationRunResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<MigrationRunResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<MigrationRunResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `MigrationRunResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001",
  "migratedValues": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Estado final (concept id) | `00000000-0000-4000-8000-000000000001` |
| `migratedValues` | Sí | `number` | Sin restricción adicional declarada | Nº de valores migrados | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Set de definiciones no encontrado | Excepción explícita en src/modules/forms/services/forms-schema.service.ts |
| 404 | `NOT_FOUND` | Versión origen no válida | Excepción explícita en src/modules/forms/services/forms-schema.service.ts |
| 404 | `NOT_FOUND` | Versión destino no válida | Excepción explícita en src/modules/forms/services/forms-schema.service.ts |
| 409 | `CONFLICT` | La migración ya fue registrada | Excepción explícita en src/modules/forms/services/forms-schema.service.ts |
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
  "path": "/forms/definition-sets/{id}/migrations/{migrationId}/run"
}
```

---

## 8. POST /forms/definition-sets/{id}/versions/{ver}/publish

- **Módulo:** `forms`
- **Etiqueta OpenAPI:** `forms-definition-sets`
- **Nombre:** Componer miembros del set y publicar la versión
- **Operation ID:** `FormsDefinitionSetsController_publishVersion`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [FormsDefinitionSetsController.publishVersion](../../src/modules/forms/controllers/forms-definition-sets.controller.ts)

### Descripción de negocio

Componer miembros del set y publicar la versión. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /forms/definition-sets/{id}/versions/{ver}/publish` en `FormsDefinitionSetsController_publishVersion`. El controlador delega en `FormsSchemaService.publishVersion`. Valida el body como `FormsPublishVersionDto` y consume `application/json`. El tipo de retorno estático es `Promise<OkResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `ver` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `FormsPublishVersionDto`; los campos opcionales se omiten.

```http
POST /forms/definition-sets/00000000-0000-4000-8000-000000000001/versions/valor-ejemplo/publish HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "members": [
    {
      "fieldId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `id`, `ver`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `members` | Sí | `array<SetMemberInputDto>` | Sin restricción adicional declarada | Miembros a componer | `[{"fieldId":"00000000-0000-4000-8000-000000000001","sectionId":"00000000-0000-4000-8000-000000000001","required":true,"ordinal":1}]` |
| `members[].fieldId` | Sí | `string` | formato `uuid` | Definición de campo miembro | `00000000-0000-4000-8000-000000000001` |
| `members[].sectionId` | No | `string` | formato `uuid` | Sección a la que pertenece | `00000000-0000-4000-8000-000000000001` |
| `members[].required` | No | `boolean` | Sin restricción adicional declarada | ¿Campo requerido en el set? | `true` |
| `members[].ordinal` | No | `number` | mínimo 0 | Orden dentro del set | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /forms/definition-sets/00000000-0000-4000-8000-000000000001/versions/valor-ejemplo/publish HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "members": [
    {
      "fieldId": "00000000-0000-4000-8000-000000000001",
      "sectionId": "00000000-0000-4000-8000-000000000001",
      "required": true,
      "ordinal": 1
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<OkResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<OkResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<OkResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<OkResultDto>` | No |
| 404 | Operación completada correctamente. | `Promise<OkResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<OkResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<OkResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<OkResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<OkResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<OkResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `OkResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "ok": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `ok` | Sí | `boolean` | Sin restricción adicional declarada | true si la operación se aplicó | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Set de definiciones no encontrado | Excepción explícita en src/modules/forms/services/forms-schema.service.ts |
| 404 | `NOT_FOUND` | Versión no encontrada para el set | Excepción explícita en src/modules/forms/services/forms-schema.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La versión no está en borrador | Excepción explícita en src/modules/forms/services/forms-schema.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/forms/definition-sets/{id}/versions/{ver}/publish"
}
```

---

## 9. POST /forms/field-definitions

- **Módulo:** `forms`
- **Etiqueta OpenAPI:** `forms-fields`
- **Nombre:** Declarar una definición de campo con reglas de validación
- **Operation ID:** `FormsFieldsController_createFieldDefinition`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [FormsFieldsController.createFieldDefinition](../../src/modules/forms/controllers/forms-fields.controller.ts)

### Descripción de negocio

Declarar una definición de campo con reglas de validación. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /forms/field-definitions` en `FormsFieldsController_createFieldDefinition`. El controlador delega en `FormsFieldsService.createFieldDefinition`. Valida el body como `CreateFieldDefinitionDto` y consume `application/json`. El tipo de retorno estático es `Promise<IdResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateFieldDefinitionDto`; los campos opcionales se omiten.

```http
POST /forms/field-definitions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "dataType": "string"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `code` | Sí | `string` | longitud mínima 1; longitud máxima 100 | Código único del campo | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | longitud mínima 1; longitud máxima 200 | Nombre legible | `Nombre de ejemplo` |
| `dataType` | Sí | `string` | valores: `string`, `text`, `integer`, `decimal`, `boolean`, `date`, `datetime`, `time`, `uuid`, `json`, `binary`, `reference`, `code` | Tipo de dato técnico | `string` |
| `sensitivityConceptId` | No | `string` | formato `uuid` | Sensibilidad (concept id) | `00000000-0000-4000-8000-000000000001` |
| `semanticConceptId` | No | `string` | formato `uuid` | Concepto semántico (concept id) | `00000000-0000-4000-8000-000000000001` |
| `valueSetId` | No | `string` | formato `uuid` | Value set de valores permitidos | `00000000-0000-4000-8000-000000000001` |
| `unitValueSetId` | No | `string` | formato `uuid` | Value set de unidades | `00000000-0000-4000-8000-000000000001` |
| `cardinalityMin` | No | `number` | Sin restricción adicional declarada | Cardinalidad mínima | `1` |
| `cardinalityMax` | No | `number` | Sin restricción adicional declarada | Cardinalidad máxima | `1` |
| `regex` | No | `string` | longitud máxima 1000 | Expresión regular de validación | `valor-ejemplo` |
| `validationRules` | No | `array<ValidationRuleInputDto>` | Sin restricción adicional declarada | Reglas de validación | `[{"ruleType":"REQUIRED","operator":"EQ","parameters":{},"severity":"ERROR","errorMessage":"valor-ejemplo"}]` |
| `validationRules[].ruleType` | No | `string` | valores: `REQUIRED`, `RANGE`, `REGEX` | Sin descripción específica en el contrato OpenAPI. | `REQUIRED` |
| `validationRules[].operator` | No | `string` | valores: `EQ`, `NEQ`, `GT`, `LT` | Sin descripción específica en el contrato OpenAPI. | `EQ` |
| `validationRules[].parameters` | No | `object` | Sin restricción adicional declarada | Parámetros de la regla | `{}` |
| `validationRules[].severity` | No | `string` | valores: `ERROR`, `WARNING` | Sin descripción específica en el contrato OpenAPI. | `ERROR` |
| `validationRules[].errorMessage` | No | `string` | longitud máxima 500 | Mensaje de error asociado | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /forms/field-definitions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "dataType": "string",
  "sensitivityConceptId": "00000000-0000-4000-8000-000000000001",
  "semanticConceptId": "00000000-0000-4000-8000-000000000001",
  "valueSetId": "00000000-0000-4000-8000-000000000001",
  "unitValueSetId": "00000000-0000-4000-8000-000000000001",
  "cardinalityMin": 1,
  "cardinalityMax": 1,
  "regex": "valor-ejemplo",
  "validationRules": [
    {
      "ruleType": "REQUIRED",
      "operator": "EQ",
      "parameters": {},
      "severity": "ERROR",
      "errorMessage": "valor-ejemplo"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<IdResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `IdResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | El código de campo ya existe | Excepción explícita en src/modules/forms/services/forms-fields.service.ts |
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
  "path": "/forms/field-definitions"
}
```

---

## 10. POST /forms/fields/{id}/access-rules

- **Módulo:** `forms`
- **Etiqueta OpenAPI:** `forms-fields`
- **Nombre:** Definir reglas de acceso y enmascarado por campo
- **Operation ID:** `FormsFieldsController_createAccessRule`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [FormsFieldsController.createAccessRule](../../src/modules/forms/controllers/forms-fields.controller.ts)

### Descripción de negocio

Definir reglas de acceso y enmascarado por campo. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /forms/fields/{id}/access-rules` en `FormsFieldsController_createAccessRule`. El controlador delega en `FormsFieldsService.createAccessRule`. Valida el body como `CreateAccessRuleDto` y consume `application/json`. El tipo de retorno estático es `Promise<IdResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateAccessRuleDto`; los campos opcionales se omiten.

```http
POST /forms/fields/00000000-0000-4000-8000-000000000001/access-rules HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "purposeOfUseValueSetId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `purposeOfUseValueSetId` | Sí | `string` | formato `uuid` | Value set de propósitos de uso permitidos | `00000000-0000-4000-8000-000000000001` |
| `assignmentId` | No | `string` | formato `uuid` | Asignación concreta afectada | `00000000-0000-4000-8000-000000000001` |
| `readRoleValueSetId` | No | `string` | formato `uuid` | Value set de roles de lectura | `00000000-0000-4000-8000-000000000001` |
| `writeRoleValueSetId` | No | `string` | formato `uuid` | Value set de roles de escritura | `00000000-0000-4000-8000-000000000001` |
| `consentCategoryConceptId` | No | `string` | formato `uuid` | Categoría de consentimiento (concept id) | `00000000-0000-4000-8000-000000000001` |
| `maskStrategy` | No | `string` | valores: `NONE`, `REDACT`, `HASH` | Estrategia de enmascarado | `NONE` |
| `breakGlassAllowed` | No | `boolean` | Sin restricción adicional declarada | ¿Permite acceso break-glass? | `true` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /forms/fields/00000000-0000-4000-8000-000000000001/access-rules HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "purposeOfUseValueSetId": "00000000-0000-4000-8000-000000000001",
  "assignmentId": "00000000-0000-4000-8000-000000000001",
  "readRoleValueSetId": "00000000-0000-4000-8000-000000000001",
  "writeRoleValueSetId": "00000000-0000-4000-8000-000000000001",
  "consentCategoryConceptId": "00000000-0000-4000-8000-000000000001",
  "maskStrategy": "NONE",
  "breakGlassAllowed": true
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<IdResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `IdResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Campo no encontrado | Excepción explícita en src/modules/forms/services/forms-fields.service.ts |
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
  "path": "/forms/fields/{id}/access-rules"
}
```

---

## 11. POST /forms/fields/{id}/dependencies

- **Módulo:** `forms`
- **Etiqueta OpenAPI:** `forms-fields`
- **Nombre:** Definir dependencias condicionales entre campos
- **Operation ID:** `FormsFieldsController_addDependency`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [FormsFieldsController.addDependency](../../src/modules/forms/controllers/forms-fields.controller.ts)

### Descripción de negocio

Definir dependencias condicionales entre campos. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /forms/fields/{id}/dependencies` en `FormsFieldsController_addDependency`. El controlador delega en `FormsFieldsService.addDependency`. Valida el body como `CreateFieldDependencyDto` y consume `application/json`. El tipo de retorno estático es `Promise<IdResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateFieldDependencyDto`; los campos opcionales se omiten.

```http
POST /forms/fields/00000000-0000-4000-8000-000000000001/dependencies HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "sourceFieldId": "00000000-0000-4000-8000-000000000001",
  "operator": "EQ",
  "behavior": "SHOW"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `sourceFieldId` | Sí | `string` | formato `uuid` | Campo fuente que dispara la condición | `00000000-0000-4000-8000-000000000001` |
| `operator` | Sí | `string` | valores: `EQ`, `NEQ`, `GT`, `LT` | Operador de comparación | `EQ` |
| `behavior` | Sí | `string` | valores: `SHOW`, `HIDE`, `REQUIRE` | Comportamiento aplicado | `SHOW` |
| `comparisonValue` | No | `object` | Sin restricción adicional declarada | Valor de comparación (json) | `{}` |
| `logicalGroup` | No | `string` | longitud máxima 100 | Grupo lógico de la condición | `valor-ejemplo` |
| `ordinal` | No | `number` | mínimo 0 | Orden de evaluación | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /forms/fields/00000000-0000-4000-8000-000000000001/dependencies HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "sourceFieldId": "00000000-0000-4000-8000-000000000001",
  "operator": "EQ",
  "behavior": "SHOW",
  "comparisonValue": {},
  "logicalGroup": "valor-ejemplo",
  "ordinal": 1
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<IdResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `IdResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Campo destino no encontrado | Excepción explícita en src/modules/forms/services/forms-fields.service.ts |
| 404 | `NOT_FOUND` | Campo fuente no encontrado | Excepción explícita en src/modules/forms/services/forms-fields.service.ts |
| 409 | `CONFLICT` | La dependencia ya existe en ese grupo lógico | Excepción explícita en src/modules/forms/services/forms-fields.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Un campo no puede depender de sí mismo | Excepción explícita en src/modules/forms/services/forms-fields.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/forms/fields/{id}/dependencies"
}
```

---

## 12. PUT /forms/fields/{id}/localizations/{lang}

- **Módulo:** `forms`
- **Etiqueta OpenAPI:** `forms-fields`
- **Nombre:** Localizar (i18n) una definición de campo
- **Operation ID:** `FormsFieldsController_upsertLocalization`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [FormsFieldsController.upsertLocalization](../../src/modules/forms/controllers/forms-fields.controller.ts)

### Descripción de negocio

Localizar (i18n) una definición de campo. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `PUT /forms/fields/{id}/localizations/{lang}` en `FormsFieldsController_upsertLocalization`. El controlador delega en `FormsFieldsService.upsertLocalization`. Valida el body como `UpsertLocalizationDto` y consume `application/json`. El tipo de retorno estático es `Promise<IdResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `lang` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `UpsertLocalizationDto`; los campos opcionales se omiten.

```http
PUT /forms/fields/00000000-0000-4000-8000-000000000001/localizations/valor-ejemplo HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `label` | No | `string` | longitud máxima 200 | Etiqueta traducida | `valor-ejemplo` |
| `helpText` | No | `string` | longitud máxima 2000 | Texto de ayuda traducido | `valor-ejemplo` |
| `placeholder` | No | `string` | longitud máxima 200 | Placeholder traducido | `valor-ejemplo` |
| `validationMessage` | No | `string` | longitud máxima 500 | Mensaje de validación traducido | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PUT /forms/fields/00000000-0000-4000-8000-000000000001/localizations/valor-ejemplo HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "label": "valor-ejemplo",
  "helpText": "valor-ejemplo",
  "placeholder": "valor-ejemplo",
  "validationMessage": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `IdResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Campo no encontrado | Excepción explícita en src/modules/forms/services/forms-fields.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Idioma no soportado | Excepción explícita en src/modules/forms/services/forms-fields.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/forms/fields/{id}/localizations/{lang}"
}
```

---

## 13. GET /forms/instances

- **Módulo:** `forms`
- **Etiqueta OpenAPI:** `forms-instances`
- **Nombre:** Listar las instancias de formulario de un encuentro
- **Operation ID:** `FormsInstancesController_listInstances`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [FormsInstancesController.listInstances](../../src/modules/forms/controllers/forms-instances.controller.ts)

### Descripción de negocio

Listar las instancias de formulario de un encuentro. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Fase 1 de lecturas: los formularios de un encuentro.

### Descripción del sistema

NestJS resuelve `GET /forms/instances` en `FormsInstancesController_listInstances`. El controlador delega en `FormsReadService.listInstancesByEncounter`. No recibe body. El tipo de retorno estático es `Promise<FormInstanceListResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `encounter` | query | Sí | `string` | Sin restricción adicional declarada | Encuentro cuyos formularios se listan | `valor-ejemplo` |
| `limit` | query | No | `number` | Sin restricción adicional declarada | Tope del listado (por defecto 50) | `1` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /forms/instances?encounter=valor-ejemplo HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CLINICIAN`, `PRACTITIONER`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /forms/instances?encounter=valor-ejemplo&limit=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<FormInstanceListResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<FormInstanceListResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<FormInstanceListResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<FormInstanceListResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<FormInstanceListResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<FormInstanceListResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `FormInstanceListResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "encounterId": "00000000-0000-4000-8000-000000000001",
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "resourceId": "00000000-0000-4000-8000-000000000001",
      "resourceTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "schemaVersion": 1,
      "stateConceptId": "00000000-0000-4000-8000-000000000001",
      "closedAt": "2026-07-31T12:00:00.000Z",
      "createdAt": "2026-07-31T12:00:00.000Z"
    }
  ],
  "limit": 1,
  "truncated": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `encounterId` | Sí | `string` | formato `uuid` | Encuentro por el que se filtró el listado | `00000000-0000-4000-8000-000000000001` |
| `items` | Sí | `array<FormInstanceItemDto>` | Sin restricción adicional declarada | Valor de items mantenido por la instancia. | `[{"id":"00000000-0000-4000-8000-000000000001","resourceId":"00000000-0000-4000-8000-000000000001","resourceTypeConceptId":"00000000-0000-4000-8000-000000000001","schemaVersion":1,"stateConceptId":"00000000-0000-4000-8000-000000000001","closedAt":"2026-07-31T12:00:00.000Z","createdAt":"2026-07-31T12:00:00.000Z"}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `items[].resourceId` | Sí | `string` | formato `uuid` | Identificador asociado a resource. | `00000000-0000-4000-8000-000000000001` |
| `items[].resourceTypeConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a resource type concept. | `00000000-0000-4000-8000-000000000001` |
| `items[].schemaVersion` | Sí | `number` | Sin restricción adicional declarada | Valor de schema version mantenido por la instancia. | `1` |
| `items[].stateConceptId` | No | `string` | formato `uuid` | Identificador asociado a state concept. | `00000000-0000-4000-8000-000000000001` |
| `items[].closedAt` | No | `string` | formato `date-time` | Valor de closed at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `items[].createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |
| `limit` | Sí | `number` | Sin restricción adicional declarada | Tope aplicado al listado | `1` |
| `truncated` | Sí | `boolean` | Sin restricción adicional declarada | true si quedaron instancias fuera del tope. Se declara, no se calla | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, PRACTITIONER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | instanceId ? 'Instancia no encontrada' : 'Encuentro no encontrado' | Excepción explícita en src/modules/forms/services/forms-read.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/forms/instances"
}
```

---

## 14. POST /forms/instances

- **Módulo:** `forms`
- **Etiqueta OpenAPI:** `forms-instances`
- **Nombre:** Abrir una instancia de formulario para un recurso
- **Operation ID:** `FormsInstancesController_openInstance`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [FormsInstancesController.openInstance](../../src/modules/forms/controllers/forms-instances.controller.ts)

### Descripción de negocio

Abrir una instancia de formulario para un recurso. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /forms/instances` en `FormsInstancesController_openInstance`. El controlador delega en `FormsInstancesService.openInstance`. Valida el body como `OpenInstanceDto` y consume `application/json`. El tipo de retorno estático es `Promise<FormInstanceResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `OpenInstanceDto`; los campos opcionales se omiten.

```http
POST /forms/instances HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "resourceId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CLINICIAN`, `PRACTITIONER`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `resourceId` | Sí | `string` | formato `uuid` | Recurso al que se adjunta el formulario | `00000000-0000-4000-8000-000000000001` |
| `resourceTypeConceptId` | No | `string` | formato `uuid` | Tipo de recurso (concept id) | `00000000-0000-4000-8000-000000000001` |
| `tenantContextId` | No | `string` | formato `uuid` | Contexto de tenant | `00000000-0000-4000-8000-000000000001` |
| `definitionSetVersionId` | No | `string` | formato `uuid` | Versión publicada del set cuyo schema se congela | `00000000-0000-4000-8000-000000000001` |
| `schemaVersion` | No | `number` | mínimo 1 | Versión de schema explícita | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /forms/instances HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "resourceId": "00000000-0000-4000-8000-000000000001",
  "resourceTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "tenantContextId": "00000000-0000-4000-8000-000000000001",
  "definitionSetVersionId": "00000000-0000-4000-8000-000000000001",
  "schemaVersion": 1
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<FormInstanceResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<FormInstanceResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<FormInstanceResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<FormInstanceResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<FormInstanceResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<FormInstanceResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<FormInstanceResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<FormInstanceResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<FormInstanceResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `FormInstanceResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "schemaVersion": 1,
  "state": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `schemaVersion` | Sí | `number` | Sin restricción adicional declarada | Versión de schema congelada | `1` |
| `state` | Sí | `string` | formato `uuid` | Estado de la instancia (concept id) | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, PRACTITIONER. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Ya existe una instancia para el recurso y versión | Excepción explícita en src/modules/forms/services/forms-instances.service.ts |
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
  "path": "/forms/instances"
}
```

---

## 15. GET /forms/instances/{id}

- **Módulo:** `forms`
- **Etiqueta OpenAPI:** `forms-instances`
- **Nombre:** Leer una instancia con sus valores vigentes, por tipo resuelto
- **Operation ID:** `FormsInstancesController_getInstance`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [FormsInstancesController.getInstance](../../src/modules/forms/controllers/forms-instances.controller.ts)

### Descripción de negocio

Leer una instancia con sus valores vigentes, por tipo resuelto. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Fase 1 de lecturas: la instancia con sus valores vigentes.

### Descripción del sistema

NestJS resuelve `GET /forms/instances/{id}` en `FormsInstancesController_getInstance`. El controlador delega en `FormsReadService.getInstance`. No recibe body. El tipo de retorno estático es `Promise<FormInstanceDetailResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /forms/instances/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CLINICIAN`, `PRACTITIONER`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /forms/instances/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<FormInstanceDetailResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<FormInstanceDetailResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<FormInstanceDetailResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<FormInstanceDetailResponseDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<FormInstanceDetailResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<FormInstanceDetailResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<FormInstanceDetailResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `FormInstanceDetailResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "values": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "fieldId": "00000000-0000-4000-8000-000000000001",
      "dataType": "valor-ejemplo",
      "fieldName": "Nombre de ejemplo",
      "value": {
        "clave": "valor"
      },
      "unitConceptId": "00000000-0000-4000-8000-000000000001",
      "valueStatusConceptId": "00000000-0000-4000-8000-000000000001",
      "valueVersion": 1,
      "ordinal": 1,
      "effectiveFrom": "2026-07-31T12:00:00.000Z",
      "masked": true
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `values` | Sí | `array<FieldValueItemDto>` | Sin restricción adicional declarada | Valor de values mantenido por la instancia. | `[{"id":"00000000-0000-4000-8000-000000000001","fieldId":"00000000-0000-4000-8000-000000000001","dataType":"valor-ejemplo","fieldName":"Nombre de ejemplo","value":{"clave":"valor"},"unitConceptId":"00000000-0000-4000-8000-000000000001","valueStatusConceptId":"00000000-0000-4000-8000-000000000001","valueVersion":1,"ordinal":1,"effectiveFrom":"2026-07-31T12:00:00.000Z","masked":true}]` |
| `values[].id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `values[].fieldId` | Sí | `string` | formato `uuid` | Identificador asociado a field. | `00000000-0000-4000-8000-000000000001` |
| `values[].dataType` | No | `string` | Sin restricción adicional declarada | Tipo técnico del campo, si su definición sigue existiendo. Decide cómo re-dibujar el valor | `valor-ejemplo` |
| `values[].fieldName` | No | `string` | Sin restricción adicional declarada | Nombre del campo, si su definición sigue existiendo. Es la etiqueta con que una pantalla sin acceso a las plantillas puede re-pintar el valor | `Nombre de ejemplo` |
| `values[].value` | No | `object` | Sin restricción adicional declarada | El valor único, resuelto de la columna value[x] que su tipo determina. null cuando el campo está enmascarado | `{"clave":"valor"}` |
| `values[].unitConceptId` | No | `string` | formato `uuid` | Identificador asociado a unit concept. | `00000000-0000-4000-8000-000000000001` |
| `values[].valueStatusConceptId` | No | `string` | formato `uuid` | Identificador asociado a value status concept. | `00000000-0000-4000-8000-000000000001` |
| `values[].valueVersion` | No | `number` | Sin restricción adicional declarada | Valor de value version mantenido por la instancia. | `1` |
| `values[].ordinal` | Sí | `number` | Sin restricción adicional declarada | Valor de ordinal mantenido por la instancia. | `1` |
| `values[].effectiveFrom` | No | `string` | formato `date-time` | Valor de effective from mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `values[].masked` | Sí | `boolean` | Sin restricción adicional declarada | true si el campo tiene una regla de acceso activa que hoy no puede evaluarse: el valor no se expone (deny-by-default) | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, PRACTITIONER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Instancia no encontrada | Excepción explícita en src/modules/forms/services/forms-read.service.ts |
| 404 | `NOT_FOUND` | instanceId ? 'Instancia no encontrada' : 'Encuentro no encontrado' | Excepción explícita en src/modules/forms/services/forms-read.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/forms/instances/{id}"
}
```

---

## 16. POST /forms/instances/{id}/close

- **Módulo:** `forms`
- **Etiqueta OpenAPI:** `forms-instances`
- **Nombre:** Cerrar formulario y proyectar vista de recurso
- **Operation ID:** `FormsInstancesController_closeInstance`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [FormsInstancesController.closeInstance](../../src/modules/forms/controllers/forms-instances.controller.ts)

### Descripción de negocio

Cerrar formulario y proyectar vista de recurso. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /forms/instances/{id}/close` en `FormsInstancesController_closeInstance`. El controlador delega en `FormsInstancesService.closeInstance`. No recibe body. El tipo de retorno estático es `Promise<OkResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /forms/instances/00000000-0000-4000-8000-000000000001/close HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CLINICIAN`, `PRACTITIONER`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /forms/instances/00000000-0000-4000-8000-000000000001/close HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<OkResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<OkResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<OkResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<OkResultDto>` | No |
| 404 | Operación completada correctamente. | `Promise<OkResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<OkResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<OkResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<OkResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<OkResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `OkResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "ok": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `ok` | Sí | `boolean` | Sin restricción adicional declarada | true si la operación se aplicó | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, PRACTITIONER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Instancia no encontrada | Excepción explícita en src/modules/forms/services/forms-instances.service.ts |
| 422 | `PRECONDITION_FAILED` | La instancia no está abierta | Excepción explícita en src/modules/forms/services/forms-instances.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/forms/instances/{id}/close"
}
```

---

## 17. POST /forms/instances/{id}/values

- **Módulo:** `forms`
- **Etiqueta OpenAPI:** `forms-instances`
- **Nombre:** Capturar valores de formulario (value[x] exclusivo)
- **Operation ID:** `FormsInstancesController_captureValues`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [FormsInstancesController.captureValues](../../src/modules/forms/controllers/forms-instances.controller.ts)

### Descripción de negocio

Capturar valores de formulario (value[x] exclusivo). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /forms/instances/{id}/values` en `FormsInstancesController_captureValues`. El controlador delega en `FormsValuesService.captureValues`. Valida el body como `CaptureValuesDto` y consume `application/json`. El tipo de retorno estático es `Promise<IdListResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CaptureValuesDto`; los campos opcionales se omiten.

```http
POST /forms/instances/00000000-0000-4000-8000-000000000001/values HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "values": [
    {
      "fieldId": "00000000-0000-4000-8000-000000000001",
      "dataType": "string",
      "value": {}
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CLINICIAN`, `PRACTITIONER`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `values` | Sí | `array<FieldValueInputDto>` | mínimo 1 elemento(s) | Valores a capturar | `[{"fieldId":"00000000-0000-4000-8000-000000000001","dataType":"string","value":{},"assignmentId":"00000000-0000-4000-8000-000000000001","unitConceptId":"00000000-0000-4000-8000-000000000001","ordinal":0}]` |
| `values[].fieldId` | Sí | `string` | formato `uuid` | Campo al que corresponde el valor | `00000000-0000-4000-8000-000000000001` |
| `values[].dataType` | Sí | `string` | valores: `string`, `text`, `integer`, `decimal`, `boolean`, `date`, `datetime`, `time`, `uuid`, `json`, `binary`, `reference`, `code` | Tipo de dato (determina value[x]) | `string` |
| `values[].value` | Sí | `object` | Sin restricción adicional declarada | Valor tipado; se persiste en la columna value_* que corresponde | `{}` |
| `values[].assignmentId` | No | `string` | formato `uuid` | Asignación que autoriza el campo | `00000000-0000-4000-8000-000000000001` |
| `values[].unitConceptId` | No | `string` | formato `uuid` | Unidad (concept id) | `00000000-0000-4000-8000-000000000001` |
| `values[].ordinal` | No | `number` | mínimo 0 | Orden dentro del campo (cardinalidad) | `0` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /forms/instances/00000000-0000-4000-8000-000000000001/values HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "values": [
    {
      "fieldId": "00000000-0000-4000-8000-000000000001",
      "dataType": "string",
      "value": {},
      "assignmentId": "00000000-0000-4000-8000-000000000001",
      "unitConceptId": "00000000-0000-4000-8000-000000000001",
      "ordinal": 0
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<IdListResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<IdListResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<IdListResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<IdListResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<IdListResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<IdListResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<IdListResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<IdListResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<IdListResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<IdListResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `IdListResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "ids": [
    "valor-ejemplo"
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `ids` | Sí | `array<string>` | formato `uuid` | Valor de ids mantenido por la instancia. | `["valor-ejemplo"]` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, PRACTITIONER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Instancia no encontrada | Excepción explícita en src/modules/forms/services/forms-values.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La instancia no está abierta | Excepción explícita en src/modules/forms/services/forms-values.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/forms/instances/{id}/values"
}
```

---

## 18. GET /forms/me/instances

- **Módulo:** `forms`
- **Etiqueta OpenAPI:** `forms-me`
- **Nombre:** Ver mis formularios clínicos
- **Operation ID:** `FormsMeController_listMyInstances`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [FormsMeController.listMyInstances](../../src/modules/forms/controllers/forms-me.controller.ts)

### Descripción de negocio

Ver mis formularios clínicos. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Los formularios respondidos del paciente de la sesión.

### Descripción del sistema

NestJS resuelve `GET /forms/me/instances` en `FormsMeController_listMyInstances`. El controlador delega en `FormsReadService.listMyInstances`. No recibe body. El tipo de retorno estático es `Promise<MyFormInstanceListResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `limit` | query | No | `number` | Sin restricción adicional declarada | Tope del listado (por defecto 50) | `1` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /forms/me/instances HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /forms/me/instances?limit=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<MyFormInstanceListResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<MyFormInstanceListResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<MyFormInstanceListResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<MyFormInstanceListResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<MyFormInstanceListResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<MyFormInstanceListResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `MyFormInstanceListResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "resourceId": "00000000-0000-4000-8000-000000000001",
      "resourceTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "schemaVersion": 1,
      "stateConceptId": "00000000-0000-4000-8000-000000000001",
      "closedAt": "2026-07-31T12:00:00.000Z",
      "createdAt": "2026-07-31T12:00:00.000Z"
    }
  ],
  "limit": 1,
  "truncated": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<FormInstanceItemDto>` | Sin restricción adicional declarada | Valor de items mantenido por la instancia. | `[{"id":"00000000-0000-4000-8000-000000000001","resourceId":"00000000-0000-4000-8000-000000000001","resourceTypeConceptId":"00000000-0000-4000-8000-000000000001","schemaVersion":1,"stateConceptId":"00000000-0000-4000-8000-000000000001","closedAt":"2026-07-31T12:00:00.000Z","createdAt":"2026-07-31T12:00:00.000Z"}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `items[].resourceId` | Sí | `string` | formato `uuid` | Identificador asociado a resource. | `00000000-0000-4000-8000-000000000001` |
| `items[].resourceTypeConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a resource type concept. | `00000000-0000-4000-8000-000000000001` |
| `items[].schemaVersion` | Sí | `number` | Sin restricción adicional declarada | Valor de schema version mantenido por la instancia. | `1` |
| `items[].stateConceptId` | No | `string` | formato `uuid` | Identificador asociado a state concept. | `00000000-0000-4000-8000-000000000001` |
| `items[].closedAt` | No | `string` | formato `date-time` | Valor de closed at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `items[].createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |
| `limit` | Sí | `number` | Sin restricción adicional declarada | Tope aplicado al listado | `1` |
| `truncated` | Sí | `boolean` | Sin restricción adicional declarada | true si quedaron instancias fuera del tope. Se declara, no se calla | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 422 | `PRECONDITION_FAILED` | La sesión no tiene perfil de paciente asociado | Excepción explícita en src/modules/forms/services/forms-read.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/forms/me/instances"
}
```

---

## 19. GET /forms/me/instances/{id}

- **Módulo:** `forms`
- **Etiqueta OpenAPI:** `forms-me`
- **Nombre:** Leer un formulario propio con sus respuestas
- **Operation ID:** `FormsMeController_getMyInstance`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [FormsMeController.getMyInstance](../../src/modules/forms/controllers/forms-me.controller.ts)

### Descripción de negocio

Leer un formulario propio con sus respuestas. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Un formulario propio, con sus valores vigentes.

### Descripción del sistema

NestJS resuelve `GET /forms/me/instances/{id}` en `FormsMeController_getMyInstance`. El controlador delega en `FormsReadService.getMyInstance`. No recibe body. El tipo de retorno estático es `Promise<FormInstanceDetailResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /forms/me/instances/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /forms/me/instances/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<FormInstanceDetailResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<FormInstanceDetailResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<FormInstanceDetailResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<FormInstanceDetailResponseDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<FormInstanceDetailResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<FormInstanceDetailResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<FormInstanceDetailResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `FormInstanceDetailResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "values": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "fieldId": "00000000-0000-4000-8000-000000000001",
      "dataType": "valor-ejemplo",
      "fieldName": "Nombre de ejemplo",
      "value": {
        "clave": "valor"
      },
      "unitConceptId": "00000000-0000-4000-8000-000000000001",
      "valueStatusConceptId": "00000000-0000-4000-8000-000000000001",
      "valueVersion": 1,
      "ordinal": 1,
      "effectiveFrom": "2026-07-31T12:00:00.000Z",
      "masked": true
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `values` | Sí | `array<FieldValueItemDto>` | Sin restricción adicional declarada | Valor de values mantenido por la instancia. | `[{"id":"00000000-0000-4000-8000-000000000001","fieldId":"00000000-0000-4000-8000-000000000001","dataType":"valor-ejemplo","fieldName":"Nombre de ejemplo","value":{"clave":"valor"},"unitConceptId":"00000000-0000-4000-8000-000000000001","valueStatusConceptId":"00000000-0000-4000-8000-000000000001","valueVersion":1,"ordinal":1,"effectiveFrom":"2026-07-31T12:00:00.000Z","masked":true}]` |
| `values[].id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `values[].fieldId` | Sí | `string` | formato `uuid` | Identificador asociado a field. | `00000000-0000-4000-8000-000000000001` |
| `values[].dataType` | No | `string` | Sin restricción adicional declarada | Tipo técnico del campo, si su definición sigue existiendo. Decide cómo re-dibujar el valor | `valor-ejemplo` |
| `values[].fieldName` | No | `string` | Sin restricción adicional declarada | Nombre del campo, si su definición sigue existiendo. Es la etiqueta con que una pantalla sin acceso a las plantillas puede re-pintar el valor | `Nombre de ejemplo` |
| `values[].value` | No | `object` | Sin restricción adicional declarada | El valor único, resuelto de la columna value[x] que su tipo determina. null cuando el campo está enmascarado | `{"clave":"valor"}` |
| `values[].unitConceptId` | No | `string` | formato `uuid` | Identificador asociado a unit concept. | `00000000-0000-4000-8000-000000000001` |
| `values[].valueStatusConceptId` | No | `string` | formato `uuid` | Identificador asociado a value status concept. | `00000000-0000-4000-8000-000000000001` |
| `values[].valueVersion` | No | `number` | Sin restricción adicional declarada | Valor de value version mantenido por la instancia. | `1` |
| `values[].ordinal` | Sí | `number` | Sin restricción adicional declarada | Valor de ordinal mantenido por la instancia. | `1` |
| `values[].effectiveFrom` | No | `string` | formato `date-time` | Valor de effective from mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `values[].masked` | Sí | `boolean` | Sin restricción adicional declarada | true si el campo tiene una regla de acceso activa que hoy no puede evaluarse: el valor no se expone (deny-by-default) | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Instancia no encontrada | Excepción explícita en src/modules/forms/services/forms-read.service.ts |
| 422 | `PRECONDITION_FAILED` | La sesión no tiene perfil de paciente asociado | Excepción explícita en src/modules/forms/services/forms-read.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/forms/me/instances/{id}"
}
```

---

## 20. PATCH /forms/values/{id}

- **Módulo:** `forms`
- **Etiqueta OpenAPI:** `forms-values`
- **Nombre:** Corregir valor con supersede y snapshot inmutable
- **Operation ID:** `FormsValuesController_correctValue`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [FormsValuesController.correctValue](../../src/modules/forms/controllers/forms-values.controller.ts)

### Descripción de negocio

Corregir valor con supersede y snapshot inmutable. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `PATCH /forms/values/{id}` en `FormsValuesController_correctValue`. El controlador delega en `FormsValuesService.correctValue`. Valida el body como `CorrectValueDto` y consume `application/json`. El tipo de retorno estático es `Promise<IdResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CorrectValueDto`; los campos opcionales se omiten.

```http
PATCH /forms/values/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "dataType": "string",
  "value": {}
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CLINICIAN`, `PRACTITIONER`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `dataType` | Sí | `string` | valores: `string`, `text`, `integer`, `decimal`, `boolean`, `date`, `datetime`, `time`, `uuid`, `json`, `binary`, `reference`, `code` | Tipo de dato del valor corregido | `string` |
| `value` | Sí | `object` | Sin restricción adicional declarada | Nuevo valor tipado | `{}` |
| `reasonConceptId` | No | `string` | formato `uuid` | Motivo de la corrección (concept id) | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PATCH /forms/values/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "dataType": "string",
  "value": {},
  "reasonConceptId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `IdResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, PRACTITIONER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Valor no encontrado | Excepción explícita en src/modules/forms/services/forms-values.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El valor ya fue superado | Excepción explícita en src/modules/forms/services/forms-values.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/forms/values/{id}"
}
```

---

## 21. POST /forms/values/import

- **Módulo:** `forms`
- **Etiqueta OpenAPI:** `forms-values`
- **Nombre:** Registrar procedencia de valores importados (batch ETL)
- **Operation ID:** `FormsValuesController_importValues`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [FormsValuesController.importValues](../../src/modules/forms/controllers/forms-values.controller.ts)

### Descripción de negocio

Registrar procedencia de valores importados (batch ETL). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /forms/values/import` en `FormsValuesController_importValues`. El controlador delega en `FormsValuesService.importValues`. Valida el body como `ImportValuesDto` y consume `application/json`. El tipo de retorno estático es `Promise<IdListResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ImportValuesDto`; los campos opcionales se omiten.

```http
POST /forms/values/import HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "importBatchId": "00000000-0000-4000-8000-000000000001",
  "items": [
    {
      "formInstanceId": "00000000-0000-4000-8000-000000000001",
      "fieldId": "00000000-0000-4000-8000-000000000001",
      "dataType": "string",
      "value": {}
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CLINICIAN`, `PRACTITIONER`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `importBatchId` | Sí | `string` | formato `uuid` | Identificador del lote de importación | `00000000-0000-4000-8000-000000000001` |
| `items` | Sí | `array<ImportValueItemDto>` | mínimo 1 elemento(s) | Valores a importar | `[{"formInstanceId":"00000000-0000-4000-8000-000000000001","fieldId":"00000000-0000-4000-8000-000000000001","dataType":"string","value":{},"sourceSystemUri":"valor-ejemplo","sourceResourceType":"valor-ejemplo","sourceResourceId":"00000000-0000-4000-8000-000000000001","contentHash":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"}]` |
| `items[].formInstanceId` | Sí | `string` | formato `uuid` | Instancia de formulario destino | `00000000-0000-4000-8000-000000000001` |
| `items[].fieldId` | Sí | `string` | formato `uuid` | Campo destino | `00000000-0000-4000-8000-000000000001` |
| `items[].dataType` | Sí | `string` | valores: `string`, `text`, `integer`, `decimal`, `boolean`, `date`, `datetime`, `time`, `uuid`, `json`, `binary`, `reference`, `code` | Tipo de dato (determina value[x]) | `string` |
| `items[].value` | Sí | `object` | Sin restricción adicional declarada | Valor importado | `{}` |
| `items[].sourceSystemUri` | No | `string` | longitud máxima 500 | URI del sistema origen | `valor-ejemplo` |
| `items[].sourceResourceType` | No | `string` | longitud máxima 100 | Tipo de recurso origen | `valor-ejemplo` |
| `items[].sourceResourceId` | No | `string` | longitud máxima 200 | Id de recurso origen | `00000000-0000-4000-8000-000000000001` |
| `items[].contentHash` | No | `string` | longitud máxima 200 | Hash de contenido (idempotencia) | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /forms/values/import HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "importBatchId": "00000000-0000-4000-8000-000000000001",
  "items": [
    {
      "formInstanceId": "00000000-0000-4000-8000-000000000001",
      "fieldId": "00000000-0000-4000-8000-000000000001",
      "dataType": "string",
      "value": {},
      "sourceSystemUri": "valor-ejemplo",
      "sourceResourceType": "valor-ejemplo",
      "sourceResourceId": "00000000-0000-4000-8000-000000000001",
      "contentHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<IdListResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<IdListResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<IdListResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<IdListResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<IdListResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<IdListResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<IdListResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<IdListResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<IdListResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `IdListResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "ids": [
    "valor-ejemplo"
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `ids` | Sí | `array<string>` | formato `uuid` | Valor de ids mantenido por la instancia. | `["valor-ejemplo"]` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, PRACTITIONER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Instancia no encontrada | Excepción explícita en src/modules/forms/services/forms-values.service.ts |
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
  "path": "/forms/values/import"
}
```

---

