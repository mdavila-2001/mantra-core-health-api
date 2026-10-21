<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `forms`

- **Bloque:** Clínico y Diagnóstico (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)
- **Operaciones:** 21 (21 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 3 · MEDIO 10 · BAJO 8
- **Tablas distintas que tocan:** 17
- **Respuestas de error y detalle contractual:** `openapi/endpoints/forms.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | GET | `/forms/assignments` | Listar asignaciones de campo (globales y del tenant) | BAJO | 2 | CLINICIAN, PRACTITIONER, SECURITY_ADMIN |
| 2 | POST | `/forms/assignments` | Asignar campos a un target con política de extensión | MEDIO | 5 | CLINICIAN, PRACTITIONER, SECURITY_ADMIN |
| 3 | GET | `/forms/assignments/budget` | Presupuesto de extensión del target para el tenant actual | BAJO | 2 | CLINICIAN, PRACTITIONER, SECURITY_ADMIN |
| 4 | GET | `/forms/definition-sets` | Listar los sets de definiciones visibles | BAJO | 1 | CLINICIAN, PRACTITIONER, SECURITY_ADMIN |
| 5 | POST | `/forms/definition-sets` | Definir un set de campos dinámicos y su versión inicial | MEDIO | 3 | SECURITY_ADMIN |
| 6 | GET | `/forms/definition-sets/{id}` | Leer un set con sus versiones, campos (reglas, dependencias, i18n) y secciones | BAJO | 8 | CLINICIAN, PRACTITIONER, SECURITY_ADMIN |
| 7 | POST | `/forms/definition-sets/{id}/migrations/{migrationId}/run` | Migrar valores entre versiones de schema | MEDIO | 4 | SECURITY_ADMIN |
| 8 | POST | `/forms/definition-sets/{id}/versions/{ver}/publish` | Componer miembros del set y publicar la versión | MEDIO | 5 | SECURITY_ADMIN |
| 9 | POST | `/forms/field-definitions` | Declarar una definición de campo con reglas de validación | ALTO | 3 | sesión (sin roles) |
| 10 | POST | `/forms/fields/{id}/access-rules` | Definir reglas de acceso y enmascarado por campo | MEDIO | 2 | SECURITY_ADMIN |
| 11 | POST | `/forms/fields/{id}/dependencies` | Definir dependencias condicionales entre campos | ALTO | 3 | sesión (sin roles) |
| 12 | PUT | `/forms/fields/{id}/localizations/{lang}` | Localizar (i18n) una definición de campo | ALTO | 4 | sesión (sin roles) |
| 13 | GET | `/forms/instances` | Listar las instancias de formulario de un encuentro | BAJO | 2 | CLINICIAN, PRACTITIONER |
| 14 | POST | `/forms/instances` | Abrir una instancia de formulario para un recurso | MEDIO | 3 | CLINICIAN, PRACTITIONER |
| 15 | GET | `/forms/instances/{id}` | Leer una instancia con sus valores vigentes, por tipo resuelto | BAJO | 5 | CLINICIAN, PRACTITIONER |
| 16 | POST | `/forms/instances/{id}/close` | Cerrar formulario y proyectar vista de recurso | MEDIO | 4 | CLINICIAN, PRACTITIONER |
| 17 | POST | `/forms/instances/{id}/values` | Capturar valores de formulario (value[x] exclusivo) | MEDIO | 3 | CLINICIAN, PRACTITIONER |
| 18 | GET | `/forms/me/instances` | Ver mis formularios clínicos | BAJO | 2 | sesión (sin roles) |
| 19 | GET | `/forms/me/instances/{id}` | Leer un formulario propio con sus respuestas | BAJO | 5 | sesión (sin roles) |
| 20 | PATCH | `/forms/values/{id}` | Corregir valor con supersede y snapshot inmutable | MEDIO | 4 | CLINICIAN, PRACTITIONER |
| 21 | POST | `/forms/values/import` | Registrar procedencia de valores importados (batch ETL) | MEDIO | 4 | CLINICIAN, PRACTITIONER |

---

## 1. GET /forms/assignments

- **Origen:** CONTRATO
- **Nombre:** Listar asignaciones de campo (globales y del tenant)
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `FormsAssignmentsController.listAssignments` — `src/modules/forms/controllers/forms-assignments.controller.ts:62`

### Qué es y para qué sirve (negocio)

Listar asignaciones de campo (globales y del tenant). Dentro del módulo (descripción del modelo, en inglés): «Lets each organization capture additional, validated information without custom software, adapting to local requirements while keeping data quality and a full change history.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_09_forms.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /forms/assignments` la atiende `FormsAssignmentsController.listAssignments` (src/modules/forms/controllers/forms-assignments.controller.ts:62). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER, SECURITY_ADMIN. Delega en `FormsReadService.listAssignments`. Lee forms.dynamic_field_sections, forms.field_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER, SECURITY_ADMIN | `src/modules/forms/controllers/forms-assignments.controller.ts:62` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `forms.dynamic_field_sections` | LEE | LEE | DIRECTA | FormsAssignmentsController.listAssignments → FormsReadService.listAssignments → AssignmentsRepository.findSectionsByIds | `src/modules/forms/repositories/assignments.repository.ts:242` |
| `forms.field_assignments` | LEE | LEE | DIRECTA | FormsAssignmentsController.listAssignments → FormsReadService.listAssignments → AssignmentsRepository.findAssignments | `src/modules/forms/repositories/assignments.repository.ts:214` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `targetResourceConceptId` | query | No | `string` | Acotar por target |
| `fieldId` | query | No | `string` | Acotar por campo |
| `sectionId` | query | No | `string` | Acotar por sección |
| `limit` | query | No | `number` | Tope del listado (por defecto 50) |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<FieldAssignmentListResponseDto>` · DTO `FieldAssignmentListResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<FieldAssignmentItemDto>` | Sí | — | — | Valor de items mantenido por la instancia. | `src/modules/forms/dto/read-responses.dto.ts:761` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/forms/dto/read-responses.dto.ts:674` |
| `items[].fieldId` | `string` | Sí | formato uuid | — | Identificador asociado a field. | `src/modules/forms/dto/read-responses.dto.ts:680` |
| `items[].targetResourceConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a target resource concept. | `src/modules/forms/dto/read-responses.dto.ts:686` |
| `items[].profileTypeConceptId` | `string` | No | formato uuid | — | Identificador asociado a profile type concept. | `src/modules/forms/dto/read-responses.dto.ts:692` |
| `items[].tenantId` | `string` | No | formato uuid | — | Identificador asociado a tenant. | `src/modules/forms/dto/read-responses.dto.ts:698` |
| `items[].branchId` | `string` | No | formato uuid | — | Identificador asociado a branch. | `src/modules/forms/dto/read-responses.dto.ts:704` |
| `items[].sectionId` | `string` | Sí | formato uuid | — | Identificador asociado a section. | `src/modules/forms/dto/read-responses.dto.ts:710` |
| `items[].required` | `boolean` | Sí | — | — | Valor de required mantenido por la instancia. | `src/modules/forms/dto/read-responses.dto.ts:716` |
| `items[].visible` | `boolean` | Sí | — | — | Valor de visible mantenido por la instancia. | `src/modules/forms/dto/read-responses.dto.ts:722` |
| `items[].editable` | `boolean` | Sí | — | — | Valor de editable mantenido por la instancia. | `src/modules/forms/dto/read-responses.dto.ts:728` |
| `items[].ordinal` | `number` | No | — | — | Valor de ordinal mantenido por la instancia. | `src/modules/forms/dto/read-responses.dto.ts:734` |
| `items[].validFrom` | `string` | No | formato date-time | — | Valor de valid from mantenido por la instancia. | `src/modules/forms/dto/read-responses.dto.ts:740` |
| `items[].validTo` | `string` | No | formato date-time | — | Valor de valid to mantenido por la instancia. | `src/modules/forms/dto/read-responses.dto.ts:746` |
| `items[].stateConceptId` | `string` | No | formato uuid | — | Identificador asociado a state concept. | `src/modules/forms/dto/read-responses.dto.ts:752` |
| `sections` | `array<SectionItemDto>` | Sí | — | — | Las secciones que las asignaciones referencian, resueltas | `src/modules/forms/dto/read-responses.dto.ts:770` |
| `sections[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/forms/dto/read-responses.dto.ts:417` |
| `sections[].code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/forms/dto/read-responses.dto.ts:423` |
| `sections[].name` | `string` | Sí | — | — | Valor de name mantenido por la instancia. | `src/modules/forms/dto/read-responses.dto.ts:429` |
| `sections[].parentSectionId` | `string` | No | formato uuid | — | Identificador asociado a parent section. | `src/modules/forms/dto/read-responses.dto.ts:435` |
| `sections[].ordinal` | `number` | No | — | — | Valor de ordinal mantenido por la instancia. | `src/modules/forms/dto/read-responses.dto.ts:441` |
| `limit` | `number` | Sí | — | — | Tope aplicado al listado | `src/modules/forms/dto/read-responses.dto.ts:776` |
| `truncated` | `boolean` | Sí | — | — | true si quedaron asignaciones fuera del tope. Se declara, no se calla | `src/modules/forms/dto/read-responses.dto.ts:785` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/forms.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Forms (09) — Dynamic Forms & Extensibility Governance — etapa `ctrl:FormsAssignmentsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 2. POST /forms/assignments

- **Origen:** CONTRATO
- **Nombre:** Asignar campos a un target con política de extensión
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `FormsAssignmentsController.createAssignment` — `src/modules/forms/controllers/forms-assignments.controller.ts:131`

### Qué es y para qué sirve (negocio)

Asignar campos a un target con política de extensión. Caso de uso UC-09-06: Asigna campo a target con enforcement de política. Dentro del módulo (descripción del modelo, en inglés): «Lets each organization capture additional, validated information without custom software, adapting to local requirements while keeping data quality and a full change history.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/forms/README.md:17`) · MODELO (`Mantra Core Health Context/modules/diagram_09_forms.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /forms/assignments` la atiende `FormsAssignmentsController.createAssignment` (src/modules/forms/controllers/forms-assignments.controller.ts:131). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER, SECURITY_ADMIN. Valida el cuerpo como `CreateAssignmentDto` (3 campos, 3 obligatorios). Delega en `FormsAssignmentsService.createAssignment`. Crea filas en forms.dynamic_field_sections, forms.field_assignments. Lee forms.dynamic_field_definitions, forms.extension_target_policies, forms.field_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER, SECURITY_ADMIN | `src/modules/forms/controllers/forms-assignments.controller.ts:131` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `forms.dynamic_field_definitions` | LEE | LEE | DIRECTA | FormsAssignmentsController.createAssignment → FormsAssignmentsService.createAssignment → FieldDefinitionsRepository.findFieldById | `src/modules/forms/repositories/field-definitions.repository.ts:237` |
| `forms.dynamic_field_sections` | ESCRIBE | CREA | DIRECTA | FormsAssignmentsController.createAssignment → FormsAssignmentsService.createAssignment → AssignmentsRepository.createSection | `src/modules/forms/repositories/assignments.repository.ts:159` |
| `forms.extension_target_policies` | LEE | LEE | DIRECTA | FormsAssignmentsController.createAssignment → FormsAssignmentsService.createAssignment → AssignmentsRepository.findActivePolicyForTenant | `src/modules/forms/repositories/assignments.repository.ts:113` |
| `forms.field_assignments` | ESCRIBE | CREA | DIRECTA | FormsAssignmentsController.createAssignment → FormsAssignmentsService.createAssignment → AssignmentsRepository.createAssignment | `src/modules/forms/repositories/assignments.repository.ts:178` |
| `forms.field_assignments` | LEE | LEE | DIRECTA | FormsAssignmentsController.createAssignment → FormsAssignmentsService.createAssignment → AssignmentsRepository.countActiveAssignments | `src/modules/forms/repositories/assignments.repository.ts:140` |

### Cuerpo — DTO `CreateAssignmentDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `surveyVersionId` | `string` | Sí | formato uuid | — | Versión publicada que se reparte | sin fuente |
| `targetType` | `string` | Sí | valores: APPOINTMENT, SERVICE, CARE_TYPE | — | Qué se evalúa: la reserva, el servicio o el tipo de atención | sin fuente |
| `targetId` | `string` | Sí | formato uuid | — | Identificador de la cosa evaluada, según `targetType` | sin fuente |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "surveyVersionId": "00000000-0000-4000-8000-000000000001",
  "targetType": "APPOINTMENT",
  "targetId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "surveyVersionId": "00000000-0000-4000-8000-000000000001",
  "targetType": "APPOINTMENT",
  "targetId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<IdResponseDto>` · DTO `IdResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/forms/dto/responses.dto.ts:9` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Sólo se pueden asignar campos dentro de la propia organización; ForbiddenException: Este formulario no admite campos propios: no tiene política de extensión activa; ForbiddenException: La política de este formulario no permite campos del tenant |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Campo no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Se excedió el presupuesto de campos del target |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/forms.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Forms (09) — Dynamic Forms & Extensibility Governance — etapa `UC-09-06`

---

## 3. GET /forms/assignments/budget

- **Origen:** CONTRATO
- **Nombre:** Presupuesto de extensión del target para el tenant actual
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `FormsAssignmentsController.getBudget` — `src/modules/forms/controllers/forms-assignments.controller.ts:110`

### Qué es y para qué sirve (negocio)

Presupuesto de extensión del target para el tenant actual. Dentro del módulo (descripción del modelo, en inglés): «Lets each organization capture additional, validated information without custom software, adapting to local requirements while keeping data quality and a full change history.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_09_forms.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /forms/assignments/budget` la atiende `FormsAssignmentsController.getBudget` (src/modules/forms/controllers/forms-assignments.controller.ts:110). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER, SECURITY_ADMIN. Delega en `FormsReadService.getExtensionBudget`. Lee forms.extension_target_policies, forms.field_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER, SECURITY_ADMIN | `src/modules/forms/controllers/forms-assignments.controller.ts:110` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_QUERY | targetResourceConceptId (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `forms.extension_target_policies` | LEE | LEE | DIRECTA | FormsAssignmentsController.getBudget → FormsReadService.getExtensionBudget → AssignmentsRepository.findActivePolicyForTenant | `src/modules/forms/repositories/assignments.repository.ts:113` |
| `forms.field_assignments` | LEE | LEE | DIRECTA | FormsAssignmentsController.getBudget → FormsReadService.getExtensionBudget → AssignmentsRepository.countActiveAssignments | `src/modules/forms/repositories/assignments.repository.ts:140` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `targetResourceConceptId` | query | Sí | `string` | Target cuyo presupuesto se consulta |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ExtensionBudgetResponseDto>` · DTO `ExtensionBudgetResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `targetResourceConceptId` | `string` | Sí | formato uuid | — | Target sobre el que se consultó el presupuesto. | `src/modules/forms/dto/read-responses.dto.ts:800` |
| `allowTenantFields` | `boolean` | Sí | — | — | ¿La política deja que la organización cuelgue campos propios? Sin política activa es false | `src/modules/forms/dto/read-responses.dto.ts:809` |
| `maximumFields` | `number` | No | — | — | Tope de la política; ausente significa sin tope declarado | `src/modules/forms/dto/read-responses.dto.ts:818` |
| `used` | `number` | Sí | — | — | Campos activos que el tenant ya colgó | `src/modules/forms/dto/read-responses.dto.ts:824` |
| `remaining` | `number` | No | — | — | Campos que quedan; ausente cuando no hay tope declarado | `src/modules/forms/dto/read-responses.dto.ts:833` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/forms.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Forms (09) — Dynamic Forms & Extensibility Governance — etapa `ctrl:FormsAssignmentsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 4. GET /forms/definition-sets

- **Origen:** CONTRATO
- **Nombre:** Listar los sets de definiciones visibles
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `FormsDefinitionSetsController.listDefinitionSets` — `src/modules/forms/controllers/forms-definition-sets.controller.ts:61`

### Qué es y para qué sirve (negocio)

Listar los sets de definiciones visibles. Dentro del módulo (descripción del modelo, en inglés): «Lets each organization capture additional, validated information without custom software, adapting to local requirements while keeping data quality and a full change history.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_09_forms.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /forms/definition-sets` la atiende `FormsDefinitionSetsController.listDefinitionSets` (src/modules/forms/controllers/forms-definition-sets.controller.ts:61). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER, SECURITY_ADMIN. Delega en `FormsReadService.listDefinitionSets`. Lee forms.field_definition_sets.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER, SECURITY_ADMIN | `src/modules/forms/controllers/forms-definition-sets.controller.ts:61` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `forms.field_definition_sets` | LEE | LEE | DIRECTA | FormsDefinitionSetsController.listDefinitionSets → FormsReadService.listDefinitionSets → DefinitionSetsRepository.findSets | `src/modules/forms/repositories/definition-sets.repository.ts:212` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `limit` | query | No | `number` | Tope del listado (por defecto 50) |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<DefinitionSetListResponseDto>` · DTO `DefinitionSetListResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<DefinitionSetItemDto>` | Sí | — | — | Valor de items mantenido por la instancia. | `src/modules/forms/dto/read-responses.dto.ts:67` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/forms/dto/read-responses.dto.ts:16` |
| `items[].namespaceUri` | `string` | Sí | — | — | Valor de namespace uri mantenido por la instancia. | `src/modules/forms/dto/read-responses.dto.ts:22` |
| `items[].code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/forms/dto/read-responses.dto.ts:28` |
| `items[].name` | `string` | Sí | — | — | Valor de name mantenido por la instancia. | `src/modules/forms/dto/read-responses.dto.ts:34` |
| `items[].ownerTenantId` | `string` | No | formato uuid | — | Identificador asociado a owner tenant. | `src/modules/forms/dto/read-responses.dto.ts:40` |
| `items[].targetDomainConceptId` | `string` | No | formato uuid | — | Identificador asociado a target domain concept. | `src/modules/forms/dto/read-responses.dto.ts:46` |
| `items[].statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/forms/dto/read-responses.dto.ts:52` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/forms/dto/read-responses.dto.ts:58` |
| `limit` | `number` | Sí | — | — | Tope aplicado al listado | `src/modules/forms/dto/read-responses.dto.ts:73` |
| `truncated` | `boolean` | Sí | — | — | true si quedaron sets fuera del tope. Se declara, no se calla | `src/modules/forms/dto/read-responses.dto.ts:82` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/forms.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Forms (09) — Dynamic Forms & Extensibility Governance — etapa `ctrl:FormsDefinitionSetsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 5. POST /forms/definition-sets

- **Origen:** CONTRATO
- **Nombre:** Definir un set de campos dinámicos y su versión inicial
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `FormsDefinitionSetsController.createDefinitionSet` — `src/modules/forms/controllers/forms-definition-sets.controller.ts:92`

### Qué es y para qué sirve (negocio)

Definir un set de campos dinámicos y su versión inicial. Caso de uso UC-09-01: Crea set + versión inicial (draft, inmutable). Dentro del módulo (descripción del modelo, en inglés): «Lets each organization capture additional, validated information without custom software, adapting to local requirements while keeping data quality and a full change history.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/forms/README.md:12`) · MODELO (`Mantra Core Health Context/modules/diagram_09_forms.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /forms/definition-sets` la atiende `FormsDefinitionSetsController.createDefinitionSet` (src/modules/forms/controllers/forms-definition-sets.controller.ts:92). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateDefinitionSetDto` (6 campos, 3 obligatorios). Delega en `FormsSchemaService.createDefinitionSet`. Crea filas en forms.field_definition_set_versions, forms.field_definition_sets. Lee forms.field_definition_sets.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/forms/controllers/forms-definition-sets.controller.ts:92` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `forms.field_definition_set_versions` | ESCRIBE | CREA | DIRECTA | FormsDefinitionSetsController.createDefinitionSet → FormsSchemaService.createDefinitionSet → DefinitionSetsRepository.createVersion | `src/modules/forms/repositories/definition-sets.repository.ts:175` |
| `forms.field_definition_sets` | ESCRIBE | CREA | DIRECTA | FormsDefinitionSetsController.createDefinitionSet → FormsSchemaService.createDefinitionSet → DefinitionSetsRepository.createSet | `src/modules/forms/repositories/definition-sets.repository.ts:142` |
| `forms.field_definition_sets` | LEE | LEE | DIRECTA | FormsDefinitionSetsController.createDefinitionSet → FormsSchemaService.createDefinitionSet → DefinitionSetsRepository.findSetByNamespace | `src/modules/forms/repositories/definition-sets.repository.ts:130` |

### Cuerpo — DTO `CreateDefinitionSetDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `namespaceUri` | `string` | Sí | longitud mínima 1; longitud máxima 500 | `@IsString()` `@MinLength(1)` `@MaxLength(500)` | URI de namespace único del set | `src/modules/forms/dto/create-definition-set.dto.ts:22` |
| `code` | `string` | Sí | longitud mínima 1; longitud máxima 100 | `@IsString()` `@MinLength(1)` `@MaxLength(100)` | Código estable del set | `src/modules/forms/dto/create-definition-set.dto.ts:31` |
| `name` | `string` | Sí | longitud mínima 1; longitud máxima 200 | `@IsString()` `@MinLength(1)` `@MaxLength(200)` | Nombre legible | `src/modules/forms/dto/create-definition-set.dto.ts:40` |
| `ownerTenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tenant propietario | `src/modules/forms/dto/create-definition-set.dto.ts:48` |
| `targetDomainConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Dominio destino (concept id) | `src/modules/forms/dto/create-definition-set.dto.ts:59` |
| `semanticVersion` | `string` | No | longitud máxima 50 | `@IsOptional()` `@IsString()` `@MaxLength(50)` | Versión semántica inicial | `src/modules/forms/dto/create-definition-set.dto.ts:71` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "namespaceUri": "Nombre de ejemplo",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "namespaceUri": "Nombre de ejemplo",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "ownerTenantId": "00000000-0000-4000-8000-000000000001",
  "targetDomainConceptId": "00000000-0000-4000-8000-000000000001",
  "semanticVersion": "1.0.0"
}
```

</details>

### Respuesta — `Promise<DefinitionSetResponseDto>` · DTO `DefinitionSetResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/forms/dto/responses.dto.ts:36` |
| `versionId` | `string` | Sí | formato uuid | — | Versión inicial (draft) creada | `src/modules/forms/dto/responses.dto.ts:45` |
| `status` | `string` | Sí | formato uuid | — | Estado del set (concept id) | `src/modules/forms/dto/responses.dto.ts:51` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: El namespace ya está en uso |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/forms.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Forms (09) — Dynamic Forms & Extensibility Governance — etapa `UC-09-01`

---

## 6. GET /forms/definition-sets/{id}

- **Origen:** CONTRATO
- **Nombre:** Leer un set con sus versiones, campos (reglas, dependencias, i18n) y secciones
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `FormsDefinitionSetsController.getDefinitionSet` — `src/modules/forms/controllers/forms-definition-sets.controller.ts:79`

### Qué es y para qué sirve (negocio)

Leer un set con sus versiones, campos (reglas, dependencias, i18n) y secciones. Dentro del módulo (descripción del modelo, en inglés): «Lets each organization capture additional, validated information without custom software, adapting to local requirements while keeping data quality and a full change history.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_09_forms.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /forms/definition-sets/{id}` la atiende `FormsDefinitionSetsController.getDefinitionSet` (src/modules/forms/controllers/forms-definition-sets.controller.ts:79). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER, SECURITY_ADMIN. Delega en `FormsReadService.getDefinitionSet`. Lee forms.dynamic_field_definitions, forms.dynamic_field_sections, forms.field_definition_localizations, forms.field_definition_set_versions, forms.field_definition_sets, forms.field_dependencies, forms.field_set_members, forms.field_validation_rules.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER, SECURITY_ADMIN | `src/modules/forms/controllers/forms-definition-sets.controller.ts:79` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/forms/controllers/forms-definition-sets.controller.ts:79` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `forms.dynamic_field_definitions` | LEE | LEE | DIRECTA | FormsDefinitionSetsController.getDefinitionSet → FormsReadService.getDefinitionSet → FieldDefinitionsRepository.findFieldsByIds | `src/modules/forms/repositories/field-definitions.repository.ts:403` |
| `forms.dynamic_field_sections` | LEE | LEE | DIRECTA | FormsDefinitionSetsController.getDefinitionSet → FormsReadService.getDefinitionSet → AssignmentsRepository.findSectionsByIds | `src/modules/forms/repositories/assignments.repository.ts:242` |
| `forms.field_definition_localizations` | LEE | LEE | DIRECTA | FormsDefinitionSetsController.getDefinitionSet → FormsReadService.getDefinitionSet → FieldDefinitionsRepository.findLocalizationsByFieldIds | `src/modules/forms/repositories/field-definitions.repository.ts:456` |
| `forms.field_definition_set_versions` | LEE | LEE | DIRECTA | FormsDefinitionSetsController.getDefinitionSet → FormsReadService.getDefinitionSet → DefinitionSetsRepository.findVersionsBySet | `src/modules/forms/repositories/definition-sets.repository.ts:235` |
| `forms.field_definition_sets` | LEE | LEE | DIRECTA | FormsDefinitionSetsController.getDefinitionSet → FormsReadService.getDefinitionSet → DefinitionSetsRepository.findSetById | `src/modules/forms/repositories/definition-sets.repository.ts:116` |
| `forms.field_dependencies` | LEE | LEE | DIRECTA | FormsDefinitionSetsController.getDefinitionSet → FormsReadService.getDefinitionSet → FieldDefinitionsRepository.findDependenciesByTargetFieldIds | `src/modules/forms/repositories/field-definitions.repository.ts:437` |
| `forms.field_set_members` | LEE | LEE | DIRECTA | FormsDefinitionSetsController.getDefinitionSet → FormsReadService.getDefinitionSet → DefinitionSetsRepository.findMembersByVersions | `src/modules/forms/repositories/definition-sets.repository.ts:255` |
| `forms.field_validation_rules` | LEE | LEE | DIRECTA | FormsDefinitionSetsController.getDefinitionSet → FormsReadService.getDefinitionSet → FieldDefinitionsRepository.findValidationRulesByFieldIds | `src/modules/forms/repositories/field-definitions.repository.ts:418` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<DefinitionSetDetailResponseDto>` · DTO `DefinitionSetDetailResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `versions` | `array<DefinitionSetVersionDto>` | Sí | — | — | Valor de versions mantenido por la instancia. | `src/modules/forms/dto/read-responses.dto.ts:450` |
| `versions[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/forms/dto/read-responses.dto.ts:91` |
| `versions[].semanticVersion` | `string` | Sí | — | — | Valor de semantic version mantenido por la instancia. | `src/modules/forms/dto/read-responses.dto.ts:97` |
| `versions[].schemaHash` | `string` | Sí | — | — | Valor de schema hash mantenido por la instancia. | `src/modules/forms/dto/read-responses.dto.ts:103` |
| `versions[].publicationStatusConceptId` | `string` | No | formato uuid | — | Identificador asociado a publication status concept. | `src/modules/forms/dto/read-responses.dto.ts:109` |
| `versions[].compatibilityConceptId` | `string` | No | formato uuid | — | Identificador asociado a compatibility concept. | `src/modules/forms/dto/read-responses.dto.ts:115` |
| `versions[].effectiveFrom` | `string` | No | formato date-time | — | Valor de effective from mantenido por la instancia. | `src/modules/forms/dto/read-responses.dto.ts:121` |
| `versions[].effectiveTo` | `string` | No | formato date-time | — | Valor de effective to mantenido por la instancia. | `src/modules/forms/dto/read-responses.dto.ts:127` |
| `versions[].recordedAt` | `string` | Sí | formato date-time | — | Valor de recorded at mantenido por la instancia. | `src/modules/forms/dto/read-responses.dto.ts:133` |
| `versions[].members` | `array<SetMemberDto>` | Sí | — | — | Campos que componen esta versión, en su orden | `src/modules/forms/dto/read-responses.dto.ts:142` |
| `versions[].members[].fieldId` | `string` | Sí | formato uuid | — | Identificador asociado a field. | `src/modules/forms/dto/read-responses.dto.ts:151` |
| `versions[].members[].sectionId` | `string` | No | formato uuid | — | Identificador asociado a section. | `src/modules/forms/dto/read-responses.dto.ts:157` |
| `versions[].members[].required` | `boolean` | No | — | — | Valor de required mantenido por la instancia. | `src/modules/forms/dto/read-responses.dto.ts:163` |
| `versions[].members[].ordinal` | `number` | No | — | — | Valor de ordinal mantenido por la instancia. | `src/modules/forms/dto/read-responses.dto.ts:169` |
| `fields` | `array<FieldSchemaDto>` | Sí | — | — | Las definiciones de todos los campos miembros, una sola vez aunque participen de varias versiones | `src/modules/forms/dto/read-responses.dto.ts:460` |
| `fields[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/forms/dto/read-responses.dto.ts:315` |
| `fields[].code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/forms/dto/read-responses.dto.ts:321` |
| `fields[].name` | `string` | Sí | — | — | Valor de name mantenido por la instancia. | `src/modules/forms/dto/read-responses.dto.ts:327` |
| `fields[].dataType` | `string` | Sí | — | — | Tipo técnico que decide el control a dibujar | `src/modules/forms/dto/read-responses.dto.ts:333` |
| `fields[].valueSetId` | `string` | No | formato uuid | — | Identificador asociado a value set. | `src/modules/forms/dto/read-responses.dto.ts:339` |
| `fields[].unitValueSetId` | `string` | No | formato uuid | — | Identificador asociado a unit value set. | `src/modules/forms/dto/read-responses.dto.ts:345` |
| `fields[].cardinalityMin` | `number` | No | — | — | Valor de cardinality min mantenido por la instancia. | `src/modules/forms/dto/read-responses.dto.ts:351` |
| `fields[].cardinalityMax` | `number` | No | — | — | Valor de cardinality max mantenido por la instancia. | `src/modules/forms/dto/read-responses.dto.ts:357` |
| `fields[].lengthMin` | `number` | No | — | — | Valor de length min mantenido por la instancia. | `src/modules/forms/dto/read-responses.dto.ts:363` |
| `fields[].lengthMax` | `number` | No | — | — | Valor de length max mantenido por la instancia. | `src/modules/forms/dto/read-responses.dto.ts:369` |
| `fields[].regex` | `string` | No | — | — | Valor de regex mantenido por la instancia. | `src/modules/forms/dto/read-responses.dto.ts:375` |
| `fields[].defaultValueJson` | `object` | No | — | — | Valor de default value json mantenido por la instancia. | `src/modules/forms/dto/read-responses.dto.ts:381` |
| `fields[].stateConceptId` | `string` | No | formato uuid | — | Identificador asociado a state concept. | `src/modules/forms/dto/read-responses.dto.ts:387` |
| `fields[].localizations` | `array<FieldLocalizationDto>` | Sí | — | — | Valor de localizations mantenido por la instancia. | `src/modules/forms/dto/read-responses.dto.ts:393` |
| `fields[].localizations[].languageConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a language concept. | `src/modules/forms/dto/read-responses.dto.ts:178` |
| `fields[].localizations[].label` | `string` | No | — | — | Valor de label mantenido por la instancia. | `src/modules/forms/dto/read-responses.dto.ts:184` |
| `fields[].localizations[].helpText` | `string` | No | — | — | Valor de help text mantenido por la instancia. | `src/modules/forms/dto/read-responses.dto.ts:190` |
| `fields[].localizations[].placeholder` | `string` | No | — | — | Valor de placeholder mantenido por la instancia. | `src/modules/forms/dto/read-responses.dto.ts:196` |
| `fields[].localizations[].validationMessage` | `string` | No | — | — | Valor de validation message mantenido por la instancia. | `src/modules/forms/dto/read-responses.dto.ts:202` |
| `fields[].validationRules` | `array<FieldValidationRuleDto>` | Sí | — | — | Valor de validation rules mantenido por la instancia. | `src/modules/forms/dto/read-responses.dto.ts:399` |
| `fields[].validationRules[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/forms/dto/read-responses.dto.ts:211` |
| `fields[].validationRules[].ruleTypeConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a rule type concept. | `src/modules/forms/dto/read-responses.dto.ts:217` |
| `fields[].validationRules[].operatorConceptId` | `string` | No | formato uuid | — | Identificador asociado a operator concept. | `src/modules/forms/dto/read-responses.dto.ts:223` |
| `fields[].validationRules[].parametersJson` | `object` | Sí | — | — | Parámetros de la regla, tal como se declararon | `src/modules/forms/dto/read-responses.dto.ts:231` |
| `fields[].validationRules[].errorMessage` | `string` | No | — | — | Valor de error message mantenido por la instancia. | `src/modules/forms/dto/read-responses.dto.ts:237` |
| `fields[].validationRules[].severityConceptId` | `string` | No | formato uuid | — | Identificador asociado a severity concept. | `src/modules/forms/dto/read-responses.dto.ts:243` |
| `fields[].validationRules[].ordinal` | `number` | No | — | — | Valor de ordinal mantenido por la instancia. | `src/modules/forms/dto/read-responses.dto.ts:249` |
| `fields[].validationRules[].active` | `boolean` | No | — | — | Valor de active mantenido por la instancia. | `src/modules/forms/dto/read-responses.dto.ts:255` |
| `fields[].dependencies` | `array<FieldDependencyDto>` | Sí | — | — | Dependencias cuyo destino es este campo | `src/modules/forms/dto/read-responses.dto.ts:408` |
| `fields[].dependencies[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/forms/dto/read-responses.dto.ts:264` |
| `fields[].dependencies[].targetFieldId` | `string` | Sí | formato uuid | — | Identificador asociado a target field. | `src/modules/forms/dto/read-responses.dto.ts:270` |
| `fields[].dependencies[].sourceFieldId` | `string` | Sí | formato uuid | — | Identificador asociado a source field. | `src/modules/forms/dto/read-responses.dto.ts:276` |
| `fields[].dependencies[].operatorConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a operator concept. | `src/modules/forms/dto/read-responses.dto.ts:282` |
| `fields[].dependencies[].behaviorConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a behavior concept. | `src/modules/forms/dto/read-responses.dto.ts:288` |
| `fields[].dependencies[].comparisonValueJson` | `object` | No | — | — | Valor de comparison value json mantenido por la instancia. | `src/modules/forms/dto/read-responses.dto.ts:294` |
| `fields[].dependencies[].logicalGroup` | `string` | No | — | — | Valor de logical group mantenido por la instancia. | `src/modules/forms/dto/read-responses.dto.ts:300` |
| `fields[].dependencies[].ordinal` | `number` | No | — | — | Valor de ordinal mantenido por la instancia. | `src/modules/forms/dto/read-responses.dto.ts:306` |
| `sections` | `array<SectionItemDto>` | Sí | — | — | Valor de sections mantenido por la instancia. | `src/modules/forms/dto/read-responses.dto.ts:466` |
| `sections[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/forms/dto/read-responses.dto.ts:417` |
| `sections[].code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/forms/dto/read-responses.dto.ts:423` |
| `sections[].name` | `string` | Sí | — | — | Valor de name mantenido por la instancia. | `src/modules/forms/dto/read-responses.dto.ts:429` |
| `sections[].parentSectionId` | `string` | No | formato uuid | — | Identificador asociado a parent section. | `src/modules/forms/dto/read-responses.dto.ts:435` |
| `sections[].ordinal` | `number` | No | — | — | Valor de ordinal mantenido por la instancia. | `src/modules/forms/dto/read-responses.dto.ts:441` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Set de definiciones no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/forms.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Forms (09) — Dynamic Forms & Extensibility Governance — etapa `ctrl:FormsDefinitionSetsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 7. POST /forms/definition-sets/{id}/migrations/{migrationId}/run

- **Origen:** CONTRATO
- **Nombre:** Migrar valores entre versiones de schema
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `FormsDefinitionSetsController.runMigration` — `src/modules/forms/controllers/forms-definition-sets.controller.ts:120`

### Qué es y para qué sirve (negocio)

Migrar valores entre versiones de schema. Caso de uso UC-09-13: Ejecuta migración entre versiones. Dentro del módulo (descripción del modelo, en inglés): «Lets each organization capture additional, validated information without custom software, adapting to local requirements while keeping data quality and a full change history.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/forms/README.md:24`) · MODELO (`Mantra Core Health Context/modules/diagram_09_forms.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /forms/definition-sets/{id}/migrations/{migrationId}/run` la atiende `FormsDefinitionSetsController.runMigration` (src/modules/forms/controllers/forms-definition-sets.controller.ts:120). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `RunMigrationDto` (6 campos, 2 obligatorios). Delega en `FormsSchemaService.runMigration`. Crea filas en forms.field_schema_migrations. Lee forms.field_definition_set_versions, forms.field_definition_sets, forms.field_schema_migrations.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/forms/controllers/forms-definition-sets.controller.ts:120` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id, migrationId | `src/modules/forms/controllers/forms-definition-sets.controller.ts:120` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `forms.field_definition_set_versions` | LEE | LEE | DIRECTA | FormsDefinitionSetsController.runMigration → FormsSchemaService.runMigration → DefinitionSetsRepository.findVersionById | `src/modules/forms/repositories/definition-sets.repository.ts:160` |
| `forms.field_definition_sets` | LEE | LEE | DIRECTA | FormsDefinitionSetsController.runMigration → FormsSchemaService.runMigration → DefinitionSetsRepository.findSetById | `src/modules/forms/repositories/definition-sets.repository.ts:116` |
| `forms.field_schema_migrations` | ESCRIBE | CREA | DIRECTA | FormsDefinitionSetsController.runMigration → FormsSchemaService.runMigration → MigrationsRepository.create | `src/modules/forms/repositories/migrations.repository.ts:76` |
| `forms.field_schema_migrations` | LEE | LEE | DIRECTA | FormsDefinitionSetsController.runMigration → FormsSchemaService.runMigration → MigrationsRepository.findById | `src/modules/forms/repositories/migrations.repository.ts:64` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |
| `migrationId` | path | Sí | `string` | — |

### Cuerpo — DTO `RunMigrationDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `fromVersionId` | `string` | Sí | formato uuid | `@IsUUID()` | Versión origen (publicada) | `src/modules/forms/dto/run-migration.dto.ts:11` |
| `toVersionId` | `string` | Sí | formato uuid | `@IsUUID()` | Versión destino (publicada) | `src/modules/forms/dto/run-migration.dto.ts:18` |
| `migrationTypeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tipo de migración (concept id) | `src/modules/forms/dto/run-migration.dto.ts:29` |
| `transformationExpression` | `string` | No | longitud máxima 4000 | `@IsOptional()` `@IsString()` `@MaxLength(4000)` | Expresión de transformación | `src/modules/forms/dto/run-migration.dto.ts:38` |
| `validationExpression` | `string` | No | longitud máxima 4000 | `@IsOptional()` `@IsString()` `@MaxLength(4000)` | Expresión de validación | `src/modules/forms/dto/run-migration.dto.ts:47` |
| `rollbackExpression` | `string` | No | longitud máxima 4000 | `@IsOptional()` `@IsString()` `@MaxLength(4000)` | Expresión de rollback | `src/modules/forms/dto/run-migration.dto.ts:56` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "fromVersionId": "00000000-0000-4000-8000-000000000001",
  "toVersionId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "fromVersionId": "00000000-0000-4000-8000-000000000001",
  "toVersionId": "00000000-0000-4000-8000-000000000001",
  "migrationTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "transformationExpression": "valor-ejemplo",
  "validationExpression": "valor-ejemplo",
  "rollbackExpression": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<MigrationRunResponseDto>` · DTO `MigrationRunResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/forms/dto/responses.dto.ts:84` |
| `status` | `string` | Sí | formato uuid | — | Estado final (concept id) | `src/modules/forms/dto/responses.dto.ts:90` |
| `migratedValues` | `number` | Sí | — | — | Nº de valores migrados | `src/modules/forms/dto/responses.dto.ts:96` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Set de definiciones no encontrado; ResourceNotFoundException: Versión origen no válida; ResourceNotFoundException: Versión destino no válida |
| 409 | `CONFLICT` | ConflictException: La migración ya fue registrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/forms.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Forms (09) — Dynamic Forms & Extensibility Governance — etapa `UC-09-13`

---

## 8. POST /forms/definition-sets/{id}/versions/{ver}/publish

- **Origen:** CONTRATO
- **Nombre:** Componer miembros del set y publicar la versión
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `FormsDefinitionSetsController.publishVersion` — `src/modules/forms/controllers/forms-definition-sets.controller.ts:106`

### Qué es y para qué sirve (negocio)

Componer miembros del set y publicar la versión. Caso de uso UC-09-03: Compone miembros y publica la versión. Dentro del módulo (descripción del modelo, en inglés): «Lets each organization capture additional, validated information without custom software, adapting to local requirements while keeping data quality and a full change history.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/forms/README.md:14`) · MODELO (`Mantra Core Health Context/modules/diagram_09_forms.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /forms/definition-sets/{id}/versions/{ver}/publish` la atiende `FormsDefinitionSetsController.publishVersion` (src/modules/forms/controllers/forms-definition-sets.controller.ts:106). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `FormsPublishVersionDto` (5 campos, 2 obligatorios). Delega en `FormsSchemaService.publishVersion`. Crea filas en forms.field_set_members. Actualiza forms.field_definition_set_versions, forms.field_definition_sets. Lee forms.field_definition_set_versions, forms.field_definition_sets.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/forms/controllers/forms-definition-sets.controller.ts:106` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id, ver | `src/modules/forms/controllers/forms-definition-sets.controller.ts:106` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `forms.field_definition_set_versions` | ESCRIBE | ACTUALIZA | POR_TIPO | FormsDefinitionSetsController.publishVersion → FormsSchemaService.publishVersion | `src/modules/forms/services/forms-schema.service.ts:164` |
| `forms.field_definition_set_versions` | LEE | LEE | DIRECTA | FormsDefinitionSetsController.publishVersion → FormsSchemaService.publishVersion → DefinitionSetsRepository.findVersionById | `src/modules/forms/repositories/definition-sets.repository.ts:160` |
| `forms.field_definition_sets` | ESCRIBE | ACTUALIZA | POR_TIPO | FormsDefinitionSetsController.publishVersion → FormsSchemaService.publishVersion | `src/modules/forms/services/forms-schema.service.ts:171` |
| `forms.field_definition_sets` | LEE | LEE | DIRECTA | FormsDefinitionSetsController.publishVersion → FormsSchemaService.publishVersion → DefinitionSetsRepository.findSetById | `src/modules/forms/repositories/definition-sets.repository.ts:116` |
| `forms.field_set_members` | ESCRIBE | CREA | DIRECTA | FormsDefinitionSetsController.publishVersion → FormsSchemaService.publishVersion → DefinitionSetsRepository.createMember | `src/modules/forms/repositories/definition-sets.repository.ts:191` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |
| `ver` | path | Sí | `string` | — |

### Cuerpo — DTO `FormsPublishVersionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `members` | `array<SetMemberInputDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => SetMemberInputDto)` | Miembros a componer | `src/modules/forms/dto/publish-version.dto.ts:66` |
| `members[].fieldId` | `string` | Sí | formato uuid | `@IsUUID()` | Definición de campo miembro | `src/modules/forms/dto/publish-version.dto.ts:21` |
| `members[].sectionId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Sección a la que pertenece | `src/modules/forms/dto/publish-version.dto.ts:32` |
| `members[].required` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | ¿Campo requerido en el set? | `src/modules/forms/dto/publish-version.dto.ts:40` |
| `members[].ordinal` | `number` | No | mínimo 0 | `@IsOptional()` `@IsInt()` `@Min(0)` | Orden dentro del set | `src/modules/forms/dto/publish-version.dto.ts:49` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "members": [
    {
      "fieldId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<OkResultDto>` · DTO `OkResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `ok` | `boolean` | Sí | — | — | true si la operación se aplicó | `src/modules/forms/dto/responses.dto.ts:27` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Set de definiciones no encontrado; ResourceNotFoundException: Versión no encontrada para el set |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La versión no está en borrador |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/forms.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Forms (09) — Dynamic Forms & Extensibility Governance — etapa `UC-09-03`

---

## 9. POST /forms/field-definitions

- **Origen:** CONTRATO
- **Nombre:** Declarar una definición de campo con reglas de validación
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `FormsFieldsController.createFieldDefinition` — `src/modules/forms/controllers/forms-fields.controller.ts:39`

### Qué es y para qué sirve (negocio)

Declarar una definición de campo con reglas de validación. Caso de uso UC-09-02: Declara campo con reglas de validación. Dentro del módulo (descripción del modelo, en inglés): «Lets each organization capture additional, validated information without custom software, adapting to local requirements while keeping data quality and a full change history.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/forms/README.md:13`) · MODELO (`Mantra Core Health Context/modules/diagram_09_forms.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /forms/field-definitions` la atiende `FormsFieldsController.createFieldDefinition` (src/modules/forms/controllers/forms-fields.controller.ts:39). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CreateFieldDefinitionDto` (16 campos, 3 obligatorios). Delega en `FormsFieldsService.createFieldDefinition`. Crea filas en forms.dynamic_field_definitions, forms.field_validation_rules. Lee forms.dynamic_field_definitions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/forms/controllers/forms-fields.controller.ts:39` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `forms.dynamic_field_definitions` | ESCRIBE | CREA | DIRECTA | FormsFieldsController.createFieldDefinition → FormsFieldsService.createFieldDefinition → FieldDefinitionsRepository.createField | `src/modules/forms/repositories/field-definitions.repository.ts:266` |
| `forms.dynamic_field_definitions` | LEE | LEE | DIRECTA | FormsFieldsController.createFieldDefinition → FormsFieldsService.createFieldDefinition → FieldDefinitionsRepository.findFieldByCode | `src/modules/forms/repositories/field-definitions.repository.ts:251` |
| `forms.field_validation_rules` | ESCRIBE | CREA | DIRECTA | FormsFieldsController.createFieldDefinition → FormsFieldsService.createFieldDefinition → FieldDefinitionsRepository.createValidationRule | `src/modules/forms/repositories/field-definitions.repository.ts:285` |

### Cuerpo — DTO `CreateFieldDefinitionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `code` | `string` | Sí | longitud mínima 1; longitud máxima 100 | `@IsString()` `@MinLength(1)` `@MaxLength(100)` | Código único del campo | `src/modules/forms/dto/create-field-definition.dto.ts:88` |
| `name` | `string` | Sí | longitud mínima 1; longitud máxima 200 | `@IsString()` `@MinLength(1)` `@MaxLength(200)` | Nombre legible | `src/modules/forms/dto/create-field-definition.dto.ts:97` |
| `dataType` | `string` | Sí | valores: string, text, integer, decimal, boolean, date, datetime, time, uuid, json, binary, reference, code | `@IsIn(TECHNICAL_DATA_TYPES)` | Tipo de dato técnico | `src/modules/forms/dto/create-field-definition.dto.ts:107` |
| `sensitivityConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Sensibilidad (concept id) | `src/modules/forms/dto/create-field-definition.dto.ts:118` |
| `semanticConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concepto semántico (concept id) | `src/modules/forms/dto/create-field-definition.dto.ts:129` |
| `valueSetId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Value set de valores permitidos | `src/modules/forms/dto/create-field-definition.dto.ts:140` |
| `unitValueSetId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Value set de unidades | `src/modules/forms/dto/create-field-definition.dto.ts:148` |
| `cardinalityMin` | `number` | No | — | `@IsOptional()` `@IsInt()` | Cardinalidad mínima | `src/modules/forms/dto/create-field-definition.dto.ts:156` |
| `cardinalityMax` | `number` | No | — | `@IsOptional()` `@IsInt()` | Cardinalidad máxima | `src/modules/forms/dto/create-field-definition.dto.ts:164` |
| `regex` | `string` | No | longitud máxima 1000 | `@IsOptional()` `@IsString()` `@MaxLength(1000)` | Expresión regular de validación | `src/modules/forms/dto/create-field-definition.dto.ts:173` |
| `validationRules` | `array<ValidationRuleInputDto>` | No | — | `@IsOptional()` `@IsArray()` `@ValidateNested({ each: true })` `@Type(() => ValidationRuleInputDto)` | Reglas de validación | `src/modules/forms/dto/create-field-definition.dto.ts:186` |
| `validationRules[].ruleType` | `string` | No | valores: REQUIRED, RANGE, REGEX | `@IsIn(['REQUIRED', 'RANGE', 'REGEX'])` | — | `src/modules/forms/dto/create-field-definition.dto.ts:44` |
| `validationRules[].operator` | `string` | No | valores: EQ, NEQ, GT, LT | `@IsOptional()` `@IsIn(['EQ', 'NEQ', 'GT', 'LT'])` | — | `src/modules/forms/dto/create-field-definition.dto.ts:52` |
| `validationRules[].parameters` | `object` | No | — | `@IsObject()` | Parámetros de la regla | `src/modules/forms/dto/create-field-definition.dto.ts:59` |
| `validationRules[].severity` | `string` | No | valores: ERROR, WARNING | `@IsOptional()` `@IsIn(['ERROR', 'WARNING'])` | — | `src/modules/forms/dto/create-field-definition.dto.ts:67` |
| `validationRules[].errorMessage` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | Mensaje de error asociado | `src/modules/forms/dto/create-field-definition.dto.ts:76` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "dataType": "string"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<IdResponseDto>` · DTO `IdResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/forms/dto/responses.dto.ts:9` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: El código de campo ya existe |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/forms.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Forms (09) — Dynamic Forms & Extensibility Governance — etapa `UC-09-02`

---

## 10. POST /forms/fields/{id}/access-rules

- **Origen:** CONTRATO
- **Nombre:** Definir reglas de acceso y enmascarado por campo
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `FormsFieldsController.createAccessRule` — `src/modules/forms/controllers/forms-fields.controller.ts:77`

### Qué es y para qué sirve (negocio)

Definir reglas de acceso y enmascarado por campo. Caso de uso UC-09-12: Define regla de acceso / enmascarado por campo. Dentro del módulo (descripción del modelo, en inglés): «Lets each organization capture additional, validated information without custom software, adapting to local requirements while keeping data quality and a full change history.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/forms/README.md:23`) · MODELO (`Mantra Core Health Context/modules/diagram_09_forms.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /forms/fields/{id}/access-rules` la atiende `FormsFieldsController.createAccessRule` (src/modules/forms/controllers/forms-fields.controller.ts:77). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateAccessRuleDto` (7 campos, 1 obligatorio). Delega en `FormsFieldsService.createAccessRule`. Crea filas en forms.field_value_access_rules. Lee forms.dynamic_field_definitions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/forms/controllers/forms-fields.controller.ts:77` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/forms/controllers/forms-fields.controller.ts:77` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `forms.dynamic_field_definitions` | LEE | LEE | DIRECTA | FormsFieldsController.createAccessRule → FormsFieldsService.createAccessRule → FieldDefinitionsRepository.findFieldById | `src/modules/forms/repositories/field-definitions.repository.ts:237` |
| `forms.field_value_access_rules` | ESCRIBE | CREA | DIRECTA | FormsFieldsController.createAccessRule → FormsFieldsService.createAccessRule → FieldDefinitionsRepository.createAccessRule | `src/modules/forms/repositories/field-definitions.repository.ts:383` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateAccessRuleDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `purposeOfUseValueSetId` | `string` | Sí | formato uuid | `@IsUUID()` | Value set de propósitos de uso permitidos | `src/modules/forms/dto/create-access-rule.dto.ts:14` |
| `assignmentId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Asignación concreta afectada | `src/modules/forms/dto/create-access-rule.dto.ts:25` |
| `readRoleValueSetId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Value set de roles de lectura | `src/modules/forms/dto/create-access-rule.dto.ts:36` |
| `writeRoleValueSetId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Value set de roles de escritura | `src/modules/forms/dto/create-access-rule.dto.ts:47` |
| `consentCategoryConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Categoría de consentimiento (concept id) | `src/modules/forms/dto/create-access-rule.dto.ts:58` |
| `maskStrategy` | `string` | No | valores: NONE, REDACT, HASH | `@IsOptional()` `@IsIn(['NONE', 'REDACT', 'HASH'])` | Estrategia de enmascarado | `src/modules/forms/dto/create-access-rule.dto.ts:69` |
| `breakGlassAllowed` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | ¿Permite acceso break-glass? | `src/modules/forms/dto/create-access-rule.dto.ts:77` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "purposeOfUseValueSetId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<IdResponseDto>` · DTO `IdResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/forms/dto/responses.dto.ts:9` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Campo no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/forms.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Forms (09) — Dynamic Forms & Extensibility Governance — etapa `UC-09-12`

---

## 11. POST /forms/fields/{id}/dependencies

- **Origen:** CONTRATO
- **Nombre:** Definir dependencias condicionales entre campos
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `FormsFieldsController.addDependency` — `src/modules/forms/controllers/forms-fields.controller.ts:52`

### Qué es y para qué sirve (negocio)

Definir dependencias condicionales entre campos. Caso de uso UC-09-04: Define dependencia condicional entre campos. Dentro del módulo (descripción del modelo, en inglés): «Lets each organization capture additional, validated information without custom software, adapting to local requirements while keeping data quality and a full change history.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/forms/README.md:15`) · MODELO (`Mantra Core Health Context/modules/diagram_09_forms.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /forms/fields/{id}/dependencies` la atiende `FormsFieldsController.addDependency` (src/modules/forms/controllers/forms-fields.controller.ts:52). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CreateFieldDependencyDto` (6 campos, 3 obligatorios). Delega en `FormsFieldsService.addDependency`. Crea filas en forms.field_dependencies. Lee forms.dynamic_field_definitions, forms.field_dependencies.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/forms/controllers/forms-fields.controller.ts:52` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/forms/controllers/forms-fields.controller.ts:52` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `forms.dynamic_field_definitions` | LEE | LEE | DIRECTA | FormsFieldsController.addDependency → FormsFieldsService.addDependency → FieldDefinitionsRepository.findFieldById | `src/modules/forms/repositories/field-definitions.repository.ts:237` |
| `forms.field_dependencies` | ESCRIBE | CREA | DIRECTA | FormsFieldsController.addDependency → FormsFieldsService.addDependency → FieldDefinitionsRepository.createDependency | `src/modules/forms/repositories/field-definitions.repository.ts:326` |
| `forms.field_dependencies` | LEE | LEE | DIRECTA | FormsFieldsController.addDependency → FormsFieldsService.addDependency → FieldDefinitionsRepository.findDependency | `src/modules/forms/repositories/field-definitions.repository.ts:307` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateFieldDependencyDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `sourceFieldId` | `string` | Sí | formato uuid | `@IsUUID()` | Campo fuente que dispara la condición | `src/modules/forms/dto/create-field-dependency.dto.ts:22` |
| `operator` | `string` | Sí | valores: EQ, NEQ, GT, LT | `@IsIn(['EQ', 'NEQ', 'GT', 'LT'])` | Operador de comparación | `src/modules/forms/dto/create-field-dependency.dto.ts:32` |
| `behavior` | `string` | Sí | valores: SHOW, HIDE, REQUIRE | `@IsIn(['SHOW', 'HIDE', 'REQUIRE'])` | Comportamiento aplicado | `src/modules/forms/dto/create-field-dependency.dto.ts:42` |
| `comparisonValue` | `object` | No | — | `@IsOptional()` | Valor de comparación (json) | `src/modules/forms/dto/create-field-dependency.dto.ts:52` |
| `logicalGroup` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Grupo lógico de la condición | `src/modules/forms/dto/create-field-dependency.dto.ts:64` |
| `ordinal` | `number` | No | mínimo 0 | `@IsOptional()` `@IsInt()` `@Min(0)` | Orden de evaluación | `src/modules/forms/dto/create-field-dependency.dto.ts:73` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "sourceFieldId": "00000000-0000-4000-8000-000000000001",
  "operator": "EQ",
  "behavior": "SHOW"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "sourceFieldId": "00000000-0000-4000-8000-000000000001",
  "operator": "EQ",
  "behavior": "SHOW",
  "comparisonValue": {},
  "logicalGroup": "valor-ejemplo",
  "ordinal": 1
}
```

</details>

### Respuesta — `Promise<IdResponseDto>` · DTO `IdResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/forms/dto/responses.dto.ts:9` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Campo destino no encontrado; ResourceNotFoundException: Campo fuente no encontrado |
| 409 | `CONFLICT` | ConflictException: La dependencia ya existe en ese grupo lógico |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Un campo no puede depender de sí mismo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/forms.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Forms (09) — Dynamic Forms & Extensibility Governance — etapa `UC-09-04`

---

## 12. PUT /forms/fields/{id}/localizations/{lang}

- **Origen:** CONTRATO
- **Nombre:** Localizar (i18n) una definición de campo
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `FormsFieldsController.upsertLocalization` — `src/modules/forms/controllers/forms-fields.controller.ts:64`

### Qué es y para qué sirve (negocio)

Localizar (i18n) una definición de campo. Caso de uso UC-09-05: Upsert de localización i18n (es/en). Dentro del módulo (descripción del modelo, en inglés): «Lets each organization capture additional, validated information without custom software, adapting to local requirements while keeping data quality and a full change history.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/forms/README.md:16`) · MODELO (`Mantra Core Health Context/modules/diagram_09_forms.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`PUT /forms/fields/{id}/localizations/{lang}` la atiende `FormsFieldsController.upsertLocalization` (src/modules/forms/controllers/forms-fields.controller.ts:64). Exige sesión; el controlador no declara roles. Valida el cuerpo como `UpsertLocalizationDto` (4 campos, 0 obligatorios). Delega en `FormsFieldsService.upsertLocalization`. Crea filas en forms.field_definition_localizations. Actualiza forms.field_definition_localizations. Lee forms.dynamic_field_definitions, forms.field_definition_localizations.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/forms/controllers/forms-fields.controller.ts:64` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/forms/controllers/forms-fields.controller.ts:64` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `forms.dynamic_field_definitions` | LEE | LEE | DIRECTA | FormsFieldsController.upsertLocalization → FormsFieldsService.upsertLocalization → FieldDefinitionsRepository.findFieldById | `src/modules/forms/repositories/field-definitions.repository.ts:237` |
| `forms.field_definition_localizations` | ESCRIBE | ACTUALIZA | POR_TIPO | FormsFieldsController.upsertLocalization → FormsFieldsService.upsertLocalization | `src/modules/forms/services/forms-fields.service.ts:214` |
| `forms.field_definition_localizations` | ESCRIBE | CREA | DIRECTA | FormsFieldsController.upsertLocalization → FormsFieldsService.upsertLocalization → FieldDefinitionsRepository.createLocalization | `src/modules/forms/repositories/field-definitions.repository.ts:364` |
| `forms.field_definition_localizations` | LEE | LEE | DIRECTA | FormsFieldsController.upsertLocalization → FormsFieldsService.upsertLocalization → FieldDefinitionsRepository.findLocalization | `src/modules/forms/repositories/field-definitions.repository.ts:346` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |
| `lang` | path | Sí | `string` | — |

### Cuerpo — DTO `UpsertLocalizationDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `label` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Etiqueta traducida | `src/modules/forms/dto/upsert-localization.dto.ts:13` |
| `helpText` | `string` | No | longitud máxima 2000 | `@IsOptional()` `@IsString()` `@MaxLength(2000)` | Texto de ayuda traducido | `src/modules/forms/dto/upsert-localization.dto.ts:22` |
| `placeholder` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Placeholder traducido | `src/modules/forms/dto/upsert-localization.dto.ts:31` |
| `validationMessage` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | Mensaje de validación traducido | `src/modules/forms/dto/upsert-localization.dto.ts:43` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "label": "valor-ejemplo",
  "helpText": "valor-ejemplo",
  "placeholder": "valor-ejemplo",
  "validationMessage": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<IdResponseDto>` · DTO `IdResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/forms/dto/responses.dto.ts:9` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Campo no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Idioma no soportado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/forms.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Forms (09) — Dynamic Forms & Extensibility Governance — etapa `UC-09-05`

---

## 13. GET /forms/instances

- **Origen:** CONTRATO
- **Nombre:** Listar las instancias de formulario de un encuentro
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `FormsInstancesController.listInstances` — `src/modules/forms/controllers/forms-instances.controller.ts:68`

### Qué es y para qué sirve (negocio)

Listar las instancias de formulario de un encuentro. Dentro del módulo (descripción del modelo, en inglés): «Lets each organization capture additional, validated information without custom software, adapting to local requirements while keeping data quality and a full change history.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_09_forms.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /forms/instances` la atiende `FormsInstancesController.listInstances` (src/modules/forms/controllers/forms-instances.controller.ts:68). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Delega en `FormsReadService.listInstancesByEncounter`. Lee clinical.encounters, forms.form_instances.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/forms/controllers/forms-instances.controller.ts:68` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_QUERY | encounter (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.encounters` | LEE | LEE | DIRECTA | FormsInstancesController.listInstances → FormsReadService.listInstancesByEncounter → FormsReadService.loadOwnEncounter | `src/modules/forms/services/forms-read.service.ts:597` |
| `forms.form_instances` | LEE | LEE | DIRECTA | FormsInstancesController.listInstances → FormsReadService.listInstancesByEncounter → FormInstancesRepository.findByResourceId | `src/modules/forms/repositories/form-instances.repository.ts:102` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `encounter` | query | Sí | `string` | Encuentro cuyos formularios se listan |
| `limit` | query | No | `number` | Tope del listado (por defecto 50) |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<FormInstanceListResponseDto>` · DTO `FormInstanceListResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `encounterId` | `string` | Sí | formato uuid | — | Encuentro por el que se filtró el listado | `src/modules/forms/dto/read-responses.dto.ts:523` |
| `items` | `array<FormInstanceItemDto>` | Sí | — | — | Valor de items mantenido por la instancia. | `src/modules/forms/dto/read-responses.dto.ts:529` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/forms/dto/read-responses.dto.ts:475` |
| `items[].resourceId` | `string` | Sí | formato uuid | — | Identificador asociado a resource. | `src/modules/forms/dto/read-responses.dto.ts:481` |
| `items[].resourceTypeConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a resource type concept. | `src/modules/forms/dto/read-responses.dto.ts:487` |
| `items[].schemaVersion` | `number` | Sí | — | — | Valor de schema version mantenido por la instancia. | `src/modules/forms/dto/read-responses.dto.ts:493` |
| `items[].stateConceptId` | `string` | No | formato uuid | — | Identificador asociado a state concept. | `src/modules/forms/dto/read-responses.dto.ts:499` |
| `items[].closedAt` | `string` | No | formato date-time | — | Valor de closed at mantenido por la instancia. | `src/modules/forms/dto/read-responses.dto.ts:505` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/forms/dto/read-responses.dto.ts:511` |
| `limit` | `number` | Sí | — | — | Tope aplicado al listado | `src/modules/forms/dto/read-responses.dto.ts:535` |
| `truncated` | `boolean` | Sí | — | — | true si quedaron instancias fuera del tope. Se declara, no se calla | `src/modules/forms/dto/read-responses.dto.ts:544` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Instancia no encontrada / Encuentro no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/forms.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Forms (09) — Dynamic Forms & Extensibility Governance — etapa `ctrl:FormsInstancesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 14. POST /forms/instances

- **Origen:** CONTRATO
- **Nombre:** Abrir una instancia de formulario para un recurso
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `FormsInstancesController.openInstance` — `src/modules/forms/controllers/forms-instances.controller.ts:101`

### Qué es y para qué sirve (negocio)

Abrir una instancia de formulario para un recurso. Caso de uso UC-09-07: Abre instancia de formulario para un recurso. Dentro del módulo (descripción del modelo, en inglés): «Lets each organization capture additional, validated information without custom software, adapting to local requirements while keeping data quality and a full change history.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/forms/README.md:18`) · MODELO (`Mantra Core Health Context/modules/diagram_09_forms.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /forms/instances` la atiende `FormsInstancesController.openInstance` (src/modules/forms/controllers/forms-instances.controller.ts:101). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `OpenInstanceDto` (5 campos, 1 obligatorio). Delega en `FormsInstancesService.openInstance`. Crea filas en forms.form_instances. Lee clinical.encounters, forms.form_instances.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/forms/controllers/forms-instances.controller.ts:101` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.encounters` | LEE | LEE | DIRECTA | FormsInstancesController.openInstance → FormsInstancesService.openInstance → FormsInstancesService.tipoDelRecurso | `src/modules/forms/services/forms-instances.service.ts:61` |
| `forms.form_instances` | ESCRIBE | CREA | DIRECTA | FormsInstancesController.openInstance → FormsInstancesService.openInstance → FormInstancesRepository.create | `src/modules/forms/repositories/form-instances.repository.ts:77` |
| `forms.form_instances` | LEE | LEE | DIRECTA | FormsInstancesController.openInstance → FormsInstancesService.openInstance → FormInstancesRepository.findByResourceAndVersion | `src/modules/forms/repositories/form-instances.repository.ts:62` |

### Cuerpo — DTO `OpenInstanceDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `resourceId` | `string` | Sí | formato uuid | `@IsUUID()` | Recurso al que se adjunta el formulario | `src/modules/forms/dto/open-instance.dto.ts:14` |
| `resourceTypeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tipo de recurso (concept id) | `src/modules/forms/dto/open-instance.dto.ts:25` |
| `tenantContextId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Contexto de tenant | `src/modules/forms/dto/open-instance.dto.ts:33` |
| `definitionSetVersionId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Versión publicada del set cuyo schema se congela | `src/modules/forms/dto/open-instance.dto.ts:44` |
| `schemaVersion` | `number` | No | mínimo 1 | `@IsOptional()` `@IsInt()` `@Min(1)` | Versión de schema explícita | `src/modules/forms/dto/open-instance.dto.ts:56` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "resourceId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "resourceId": "00000000-0000-4000-8000-000000000001",
  "resourceTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "tenantContextId": "00000000-0000-4000-8000-000000000001",
  "definitionSetVersionId": "00000000-0000-4000-8000-000000000001",
  "schemaVersion": 1
}
```

</details>

### Respuesta — `Promise<FormInstanceResponseDto>` · DTO `FormInstanceResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/forms/dto/responses.dto.ts:60` |
| `schemaVersion` | `number` | Sí | — | — | Versión de schema congelada | `src/modules/forms/dto/responses.dto.ts:66` |
| `state` | `string` | Sí | formato uuid | — | Estado de la instancia (concept id) | `src/modules/forms/dto/responses.dto.ts:75` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe una instancia para el recurso y versión |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/forms.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Forms (09) — Dynamic Forms & Extensibility Governance — etapa `UC-09-07`

---

## 15. GET /forms/instances/{id}

- **Origen:** CONTRATO
- **Nombre:** Leer una instancia con sus valores vigentes, por tipo resuelto
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `FormsInstancesController.getInstance` — `src/modules/forms/controllers/forms-instances.controller.ts:90`

### Qué es y para qué sirve (negocio)

Leer una instancia con sus valores vigentes, por tipo resuelto. Dentro del módulo (descripción del modelo, en inglés): «Lets each organization capture additional, validated information without custom software, adapting to local requirements while keeping data quality and a full change history.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_09_forms.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /forms/instances/{id}` la atiende `FormsInstancesController.getInstance` (src/modules/forms/controllers/forms-instances.controller.ts:90). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Delega en `FormsReadService.getInstance`. Lee clinical.encounters, forms.dynamic_field_definitions, forms.field_value_access_rules, forms.field_values, forms.form_instances.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/forms/controllers/forms-instances.controller.ts:90` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/forms/controllers/forms-instances.controller.ts:90` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.encounters` | LEE | LEE | DIRECTA | FormsInstancesController.getInstance → FormsReadService.getInstance → FormsReadService.loadOwnEncounter | `src/modules/forms/services/forms-read.service.ts:597` |
| `forms.dynamic_field_definitions` | LEE | LEE | DIRECTA | FormsInstancesController.getInstance → FormsReadService.getInstance → FormsReadService.composeInstanceDetail → FieldDefinitionsRepository.findFieldsByIds | `src/modules/forms/repositories/field-definitions.repository.ts:403` |
| `forms.field_value_access_rules` | LEE | LEE | DIRECTA | FormsInstancesController.getInstance → FormsReadService.getInstance → FormsReadService.composeInstanceDetail → FieldDefinitionsRepository.findActiveAccessRulesByFieldIds | `src/modules/forms/repositories/field-definitions.repository.ts:480` |
| `forms.field_values` | LEE | LEE | DIRECTA | FormsInstancesController.getInstance → FormsReadService.getInstance → FormsReadService.composeInstanceDetail → FieldValuesRepository.findCurrentByInstance | `src/modules/forms/repositories/field-values.repository.ts:242` |
| `forms.form_instances` | LEE | LEE | DIRECTA | FormsInstancesController.getInstance → FormsReadService.getInstance → FormInstancesRepository.findById | `src/modules/forms/repositories/form-instances.repository.ts:45` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<FormInstanceDetailResponseDto>` · DTO `FormInstanceDetailResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `values` | `array<FieldValueItemDto>` | Sí | — | — | Valor de values mantenido por la instancia. | `src/modules/forms/dto/read-responses.dto.ts:665` |
| `values[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/forms/dto/read-responses.dto.ts:553` |
| `values[].fieldId` | `string` | Sí | formato uuid | — | Identificador asociado a field. | `src/modules/forms/dto/read-responses.dto.ts:559` |
| `values[].dataType` | `string` | No | — | — | Tipo técnico del campo, si su definición sigue existiendo. Decide cómo re-dibujar el valor | `src/modules/forms/dto/read-responses.dto.ts:569` |
| `values[].fieldName` | `string` | No | — | — | Nombre del campo, si su definición sigue existiendo. Es la etiqueta con que una pantalla sin acceso a las plantillas puede re-pintar el valor | `src/modules/forms/dto/read-responses.dto.ts:579` |
| `values[].value` | `object` | No | — | — | El valor único, resuelto de la columna value[x] que su tipo determina. null cuando el campo está enmascarado | `src/modules/forms/dto/read-responses.dto.ts:589` |
| `values[].unitConceptId` | `string` | No | formato uuid | — | Identificador asociado a unit concept. | `src/modules/forms/dto/read-responses.dto.ts:595` |
| `values[].valueStatusConceptId` | `string` | No | formato uuid | — | Identificador asociado a value status concept. | `src/modules/forms/dto/read-responses.dto.ts:601` |
| `values[].valueVersion` | `number` | No | — | — | Valor de value version mantenido por la instancia. | `src/modules/forms/dto/read-responses.dto.ts:607` |
| `values[].ordinal` | `number` | Sí | — | — | Valor de ordinal mantenido por la instancia. | `src/modules/forms/dto/read-responses.dto.ts:613` |
| `values[].effectiveFrom` | `string` | No | formato date-time | — | Valor de effective from mantenido por la instancia. | `src/modules/forms/dto/read-responses.dto.ts:619` |
| `values[].masked` | `boolean` | Sí | — | — | true si el campo tiene una regla de acceso activa que hoy no puede evaluarse: el valor no se expone (deny-by-default) | `src/modules/forms/dto/read-responses.dto.ts:628` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Instancia no encontrada; ResourceNotFoundException: Instancia no encontrada / Encuentro no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/forms.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Forms (09) — Dynamic Forms & Extensibility Governance — etapa `ctrl:FormsInstancesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 16. POST /forms/instances/{id}/close

- **Origen:** CONTRATO
- **Nombre:** Cerrar formulario y proyectar vista de recurso
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `FormsInstancesController.closeInstance` — `src/modules/forms/controllers/forms-instances.controller.ts:128`

### Qué es y para qué sirve (negocio)

Cerrar formulario y proyectar vista de recurso. Caso de uso UC-09-11: Cierra formulario y finaliza valores preliminares. Dentro del módulo (descripción del modelo, en inglés): «Lets each organization capture additional, validated information without custom software, adapting to local requirements while keeping data quality and a full change history.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/forms/README.md:22`) · MODELO (`Mantra Core Health Context/modules/diagram_09_forms.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /forms/instances/{id}/close` la atiende `FormsInstancesController.closeInstance` (src/modules/forms/controllers/forms-instances.controller.ts:128). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Delega en `FormsInstancesService.closeInstance`. Actualiza forms.field_values, forms.form_instances. Lee forms.field_values, forms.form_instances.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/forms/controllers/forms-instances.controller.ts:128` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/forms/controllers/forms-instances.controller.ts:128` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `forms.field_values` | ESCRIBE | ACTUALIZA | POR_TIPO | FormsInstancesController.closeInstance → FormsInstancesService.closeInstance | `src/modules/forms/services/forms-instances.service.ts:151` |
| `forms.field_values` | LEE | LEE | DIRECTA | FormsInstancesController.closeInstance → FormsInstancesService.closeInstance → FieldValuesRepository.findPreliminaryByInstance | `src/modules/forms/repositories/field-values.repository.ts:221` |
| `forms.form_instances` | ESCRIBE | ACTUALIZA | POR_TIPO | FormsInstancesController.closeInstance → FormsInstancesService.closeInstance | `src/modules/forms/services/forms-instances.service.ts:155` |
| `forms.form_instances` | LEE | LEE | DIRECTA | FormsInstancesController.closeInstance → FormsInstancesService.closeInstance → FormInstancesRepository.findById | `src/modules/forms/repositories/form-instances.repository.ts:45` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<OkResultDto>` · DTO `OkResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `ok` | `boolean` | Sí | — | — | true si la operación se aplicó | `src/modules/forms/dto/responses.dto.ts:27` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Instancia no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La instancia no está abierta |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/forms.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Forms (09) — Dynamic Forms & Extensibility Governance — etapa `UC-09-11`

---

## 17. POST /forms/instances/{id}/values

- **Origen:** CONTRATO
- **Nombre:** Capturar valores de formulario (value[x] exclusivo)
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `FormsInstancesController.captureValues` — `src/modules/forms/controllers/forms-instances.controller.ts:114`

### Qué es y para qué sirve (negocio)

Capturar valores de formulario (value[x] exclusivo). Caso de uso UC-09-08: Captura valores (value[x] exclusivo). Dentro del módulo (descripción del modelo, en inglés): «Lets each organization capture additional, validated information without custom software, adapting to local requirements while keeping data quality and a full change history.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/forms/README.md:19`) · MODELO (`Mantra Core Health Context/modules/diagram_09_forms.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /forms/instances/{id}/values` la atiende `FormsInstancesController.captureValues` (src/modules/forms/controllers/forms-instances.controller.ts:114). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `CaptureValuesDto` (7 campos, 4 obligatorios). Delega en `FormsValuesService.captureValues`. Crea filas en forms.field_value_audit, forms.field_values. Lee forms.form_instances.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/forms/controllers/forms-instances.controller.ts:114` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/forms/controllers/forms-instances.controller.ts:114` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `forms.field_value_audit` | ESCRIBE | CREA | DIRECTA | FormsInstancesController.captureValues → FormsValuesService.captureValues → FieldValuesRepository.createAudit | `src/modules/forms/repositories/field-values.repository.ts:279` |
| `forms.field_values` | ESCRIBE | CREA | DIRECTA | FormsInstancesController.captureValues → FormsValuesService.captureValues → FieldValuesRepository.create | `src/modules/forms/repositories/field-values.repository.ts:264` |
| `forms.form_instances` | LEE | LEE | DIRECTA | FormsInstancesController.captureValues → FormsValuesService.captureValues → FormInstancesRepository.findById | `src/modules/forms/repositories/form-instances.repository.ts:45` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CaptureValuesDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `values` | `array<FieldValueInputDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => FieldValueInputDto)` | Valores a capturar | `src/modules/forms/dto/capture-values.dto.ts:96` |
| `values[].fieldId` | `string` | Sí | formato uuid | `@IsUUID()` | Campo al que corresponde el valor | `src/modules/forms/dto/capture-values.dto.ts:29` |
| `values[].dataType` | `string` | Sí | valores: string, text, integer, decimal, boolean, date, datetime, time, uuid, json, binary, reference, code | `@IsIn(TECHNICAL_DATA_TYPES)` | Tipo de dato (determina value[x]) | `src/modules/forms/dto/capture-values.dto.ts:39` |
| `values[].value` | `object` | Sí | — | `@Allow()` | Valor tipado; se persiste en la columna value_* que corresponde | `src/modules/forms/dto/capture-values.dto.ts:49` |
| `values[].assignmentId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Asignación que autoriza el campo | `src/modules/forms/dto/capture-values.dto.ts:60` |
| `values[].unitConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Unidad (concept id) | `src/modules/forms/dto/capture-values.dto.ts:68` |
| `values[].ordinal` | `number` | No | mínimo 0 | `@IsOptional()` `@IsInt()` `@Min(0)` | Orden dentro del campo (cardinalidad) | `src/modules/forms/dto/capture-values.dto.ts:80` |

**Payload mínimo** (sólo los obligatorios):

```json
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

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<IdListResponseDto>` · DTO `IdListResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `ids` | `array<string>` | Sí | formato uuid | — | Valor de ids mantenido por la instancia. | `src/modules/forms/dto/responses.dto.ts:18` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Instancia no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La instancia no está abierta |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/forms.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Forms (09) — Dynamic Forms & Extensibility Governance — etapa `UC-09-08`

---

## 18. GET /forms/me/instances

- **Origen:** CONTRATO
- **Nombre:** Ver mis formularios clínicos
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `FormsMeController.listMyInstances` — `src/modules/forms/controllers/forms-me.controller.ts:46`

### Qué es y para qué sirve (negocio)

Ver mis formularios clínicos. Dentro del módulo (descripción del modelo, en inglés): «Lets each organization capture additional, validated information without custom software, adapting to local requirements while keeping data quality and a full change history.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_09_forms.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /forms/me/instances` la atiende `FormsMeController.listMyInstances` (src/modules/forms/controllers/forms-me.controller.ts:46). Exige sesión; el controlador no declara roles. Delega en `FormsReadService.listMyInstances`. Lee clinical.encounters, forms.form_instances.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/forms/controllers/forms-me.controller.ts:46` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.encounters` | LEE | LEE | DIRECTA | FormsMeController.listMyInstances → FormsReadService.listMyInstances | `src/modules/forms/services/forms-read.service.ts:343` |
| `forms.form_instances` | LEE | LEE | DIRECTA | FormsMeController.listMyInstances → FormsReadService.listMyInstances → FormInstancesRepository.findByResourceIds | `src/modules/forms/repositories/form-instances.repository.ts:128` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `limit` | query | No | `number` | Tope del listado (por defecto 50) |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<MyFormInstanceListResponseDto>` · DTO `MyFormInstanceListResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<FormInstanceItemDto>` | Sí | — | — | Valor de items mantenido por la instancia. | `src/modules/forms/dto/read-responses.dto.ts:641` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/forms/dto/read-responses.dto.ts:475` |
| `items[].resourceId` | `string` | Sí | formato uuid | — | Identificador asociado a resource. | `src/modules/forms/dto/read-responses.dto.ts:481` |
| `items[].resourceTypeConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a resource type concept. | `src/modules/forms/dto/read-responses.dto.ts:487` |
| `items[].schemaVersion` | `number` | Sí | — | — | Valor de schema version mantenido por la instancia. | `src/modules/forms/dto/read-responses.dto.ts:493` |
| `items[].stateConceptId` | `string` | No | formato uuid | — | Identificador asociado a state concept. | `src/modules/forms/dto/read-responses.dto.ts:499` |
| `items[].closedAt` | `string` | No | formato date-time | — | Valor de closed at mantenido por la instancia. | `src/modules/forms/dto/read-responses.dto.ts:505` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/forms/dto/read-responses.dto.ts:511` |
| `limit` | `number` | Sí | — | — | Tope aplicado al listado | `src/modules/forms/dto/read-responses.dto.ts:647` |
| `truncated` | `boolean` | Sí | — | — | true si quedaron instancias fuera del tope. Se declara, no se calla | `src/modules/forms/dto/read-responses.dto.ts:656` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La sesión no tiene perfil de paciente asociado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/forms.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Forms (09) — Dynamic Forms & Extensibility Governance — etapa `ctrl:FormsMeController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 19. GET /forms/me/instances/{id}

- **Origen:** CONTRATO
- **Nombre:** Leer un formulario propio con sus respuestas
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `FormsMeController.getMyInstance` — `src/modules/forms/controllers/forms-me.controller.ts:61`

### Qué es y para qué sirve (negocio)

Leer un formulario propio con sus respuestas. Dentro del módulo (descripción del modelo, en inglés): «Lets each organization capture additional, validated information without custom software, adapting to local requirements while keeping data quality and a full change history.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_09_forms.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /forms/me/instances/{id}` la atiende `FormsMeController.getMyInstance` (src/modules/forms/controllers/forms-me.controller.ts:61). Exige sesión; el controlador no declara roles. Delega en `FormsReadService.getMyInstance`. Lee clinical.encounters, forms.dynamic_field_definitions, forms.field_value_access_rules, forms.field_values, forms.form_instances.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/forms/controllers/forms-me.controller.ts:61` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/forms/controllers/forms-me.controller.ts:61` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.encounters` | LEE | LEE | DIRECTA | FormsMeController.getMyInstance → FormsReadService.getMyInstance | `src/modules/forms/services/forms-read.service.ts:390` |
| `forms.dynamic_field_definitions` | LEE | LEE | DIRECTA | FormsMeController.getMyInstance → FormsReadService.getMyInstance → FormsReadService.composeInstanceDetail → FieldDefinitionsRepository.findFieldsByIds | `src/modules/forms/repositories/field-definitions.repository.ts:403` |
| `forms.field_value_access_rules` | LEE | LEE | DIRECTA | FormsMeController.getMyInstance → FormsReadService.getMyInstance → FormsReadService.composeInstanceDetail → FieldDefinitionsRepository.findActiveAccessRulesByFieldIds | `src/modules/forms/repositories/field-definitions.repository.ts:480` |
| `forms.field_values` | LEE | LEE | DIRECTA | FormsMeController.getMyInstance → FormsReadService.getMyInstance → FormsReadService.composeInstanceDetail → FieldValuesRepository.findCurrentByInstance | `src/modules/forms/repositories/field-values.repository.ts:242` |
| `forms.form_instances` | LEE | LEE | DIRECTA | FormsMeController.getMyInstance → FormsReadService.getMyInstance → FormInstancesRepository.findById | `src/modules/forms/repositories/form-instances.repository.ts:45` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<FormInstanceDetailResponseDto>` · DTO `FormInstanceDetailResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `values` | `array<FieldValueItemDto>` | Sí | — | — | Valor de values mantenido por la instancia. | `src/modules/forms/dto/read-responses.dto.ts:665` |
| `values[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/forms/dto/read-responses.dto.ts:553` |
| `values[].fieldId` | `string` | Sí | formato uuid | — | Identificador asociado a field. | `src/modules/forms/dto/read-responses.dto.ts:559` |
| `values[].dataType` | `string` | No | — | — | Tipo técnico del campo, si su definición sigue existiendo. Decide cómo re-dibujar el valor | `src/modules/forms/dto/read-responses.dto.ts:569` |
| `values[].fieldName` | `string` | No | — | — | Nombre del campo, si su definición sigue existiendo. Es la etiqueta con que una pantalla sin acceso a las plantillas puede re-pintar el valor | `src/modules/forms/dto/read-responses.dto.ts:579` |
| `values[].value` | `object` | No | — | — | El valor único, resuelto de la columna value[x] que su tipo determina. null cuando el campo está enmascarado | `src/modules/forms/dto/read-responses.dto.ts:589` |
| `values[].unitConceptId` | `string` | No | formato uuid | — | Identificador asociado a unit concept. | `src/modules/forms/dto/read-responses.dto.ts:595` |
| `values[].valueStatusConceptId` | `string` | No | formato uuid | — | Identificador asociado a value status concept. | `src/modules/forms/dto/read-responses.dto.ts:601` |
| `values[].valueVersion` | `number` | No | — | — | Valor de value version mantenido por la instancia. | `src/modules/forms/dto/read-responses.dto.ts:607` |
| `values[].ordinal` | `number` | Sí | — | — | Valor de ordinal mantenido por la instancia. | `src/modules/forms/dto/read-responses.dto.ts:613` |
| `values[].effectiveFrom` | `string` | No | formato date-time | — | Valor de effective from mantenido por la instancia. | `src/modules/forms/dto/read-responses.dto.ts:619` |
| `values[].masked` | `boolean` | Sí | — | — | true si el campo tiene una regla de acceso activa que hoy no puede evaluarse: el valor no se expone (deny-by-default) | `src/modules/forms/dto/read-responses.dto.ts:628` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Instancia no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La sesión no tiene perfil de paciente asociado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/forms.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Forms (09) — Dynamic Forms & Extensibility Governance — etapa `ctrl:FormsMeController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 20. PATCH /forms/values/{id}

- **Origen:** CONTRATO
- **Nombre:** Corregir valor con supersede y snapshot inmutable
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `FormsValuesController.correctValue` — `src/modules/forms/controllers/forms-values.controller.ts:52`

### Qué es y para qué sirve (negocio)

Corregir valor con supersede y snapshot inmutable. Caso de uso UC-09-09: Corrige valor con supersede y snapshot inmutable. Dentro del módulo (descripción del modelo, en inglés): «Lets each organization capture additional, validated information without custom software, adapting to local requirements while keeping data quality and a full change history.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/forms/README.md:20`) · MODELO (`Mantra Core Health Context/modules/diagram_09_forms.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`PATCH /forms/values/{id}` la atiende `FormsValuesController.correctValue` (src/modules/forms/controllers/forms-values.controller.ts:52). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `CorrectValueDto` (3 campos, 2 obligatorios). Delega en `FormsValuesService.correctValue`. Crea filas en forms.field_value_audit, forms.field_values. Actualiza forms.field_values. Lee forms.field_values.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/forms/controllers/forms-values.controller.ts:52` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/forms/controllers/forms-values.controller.ts:52` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `forms.field_value_audit` | ESCRIBE | CREA | DIRECTA | FormsValuesController.correctValue → FormsValuesService.correctValue → FieldValuesRepository.createAudit | `src/modules/forms/repositories/field-values.repository.ts:279` |
| `forms.field_values` | ESCRIBE | ACTUALIZA | POR_TIPO | FormsValuesController.correctValue → FormsValuesService.correctValue | `src/modules/forms/services/forms-values.service.ts:150` |
| `forms.field_values` | ESCRIBE | CREA | DIRECTA | FormsValuesController.correctValue → FormsValuesService.correctValue → FieldValuesRepository.create | `src/modules/forms/repositories/field-values.repository.ts:264` |
| `forms.field_values` | LEE | LEE | DIRECTA | FormsValuesController.correctValue → FormsValuesService.correctValue → FieldValuesRepository.findById | `src/modules/forms/repositories/field-values.repository.ts:205` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CorrectValueDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `dataType` | `string` | Sí | valores: string, text, integer, decimal, boolean, date, datetime, time, uuid, json, binary, reference, code | `@IsIn(TECHNICAL_DATA_TYPES)` | Tipo de dato del valor corregido | `src/modules/forms/dto/correct-value.dto.ts:18` |
| `value` | `object` | Sí | — | `@Allow()` | Nuevo valor tipado | `src/modules/forms/dto/correct-value.dto.ts:25` |
| `reasonConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Motivo de la corrección (concept id) | `src/modules/forms/dto/correct-value.dto.ts:36` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "dataType": "string",
  "value": {}
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "dataType": "string",
  "value": {},
  "reasonConceptId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<IdResponseDto>` · DTO `IdResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/forms/dto/responses.dto.ts:9` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Valor no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El valor ya fue superado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/forms.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Forms (09) — Dynamic Forms & Extensibility Governance — etapa `UC-09-09`

---

## 21. POST /forms/values/import

- **Origen:** CONTRATO
- **Nombre:** Registrar procedencia de valores importados (batch ETL)
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `FormsValuesController.importValues` — `src/modules/forms/controllers/forms-values.controller.ts:39`

### Qué es y para qué sirve (negocio)

Registrar procedencia de valores importados (batch ETL). Caso de uso UC-09-10: Importa valores externos (batch ETL) con procedencia. Dentro del módulo (descripción del modelo, en inglés): «Lets each organization capture additional, validated information without custom software, adapting to local requirements while keeping data quality and a full change history.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/forms/README.md:21`) · MODELO (`Mantra Core Health Context/modules/diagram_09_forms.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /forms/values/import` la atiende `FormsValuesController.importValues` (src/modules/forms/controllers/forms-values.controller.ts:39). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `ImportValuesDto` (10 campos, 6 obligatorios). Delega en `FormsValuesService.importValues`. Crea filas en forms.field_value_audit, forms.field_value_provenance, forms.field_values. Lee forms.form_instances.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/forms/controllers/forms-values.controller.ts:39` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `forms.field_value_audit` | ESCRIBE | CREA | DIRECTA | FormsValuesController.importValues → FormsValuesService.importValues → FieldValuesRepository.createAudit | `src/modules/forms/repositories/field-values.repository.ts:279` |
| `forms.field_value_provenance` | ESCRIBE | CREA | DIRECTA | FormsValuesController.importValues → FormsValuesService.importValues → FieldValuesRepository.createProvenance | `src/modules/forms/repositories/field-values.repository.ts:298` |
| `forms.field_values` | ESCRIBE | CREA | DIRECTA | FormsValuesController.importValues → FormsValuesService.importValues → FieldValuesRepository.create | `src/modules/forms/repositories/field-values.repository.ts:264` |
| `forms.form_instances` | LEE | LEE | DIRECTA | FormsValuesController.importValues → FormsValuesService.importValues → FormInstancesRepository.findById | `src/modules/forms/repositories/form-instances.repository.ts:45` |

### Cuerpo — DTO `ImportValuesDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `importBatchId` | `string` | Sí | formato uuid | `@IsUUID()` | Identificador del lote de importación | `src/modules/forms/dto/import-values.dto.ts:111` |
| `items` | `array<ImportValueItemDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => ImportValueItemDto)` | Valores a importar | `src/modules/forms/dto/import-values.dto.ts:124` |
| `items[].formInstanceId` | `string` | Sí | formato uuid | `@IsUUID()` | Instancia de formulario destino | `src/modules/forms/dto/import-values.dto.ts:29` |
| `items[].fieldId` | `string` | Sí | formato uuid | `@IsUUID()` | Campo destino | `src/modules/forms/dto/import-values.dto.ts:36` |
| `items[].dataType` | `string` | Sí | valores: string, text, integer, decimal, boolean, date, datetime, time, uuid, json, binary, reference, code | `@IsIn(TECHNICAL_DATA_TYPES)` | Tipo de dato (determina value[x]) | `src/modules/forms/dto/import-values.dto.ts:46` |
| `items[].value` | `object` | Sí | — | `@Allow()` | Valor importado | `src/modules/forms/dto/import-values.dto.ts:53` |
| `items[].sourceSystemUri` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | URI del sistema origen | `src/modules/forms/dto/import-values.dto.ts:65` |
| `items[].sourceResourceType` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Tipo de recurso origen | `src/modules/forms/dto/import-values.dto.ts:77` |
| `items[].sourceResourceId` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Id de recurso origen | `src/modules/forms/dto/import-values.dto.ts:86` |
| `items[].contentHash` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Hash de contenido (idempotencia) | `src/modules/forms/dto/import-values.dto.ts:98` |

**Payload mínimo** (sólo los obligatorios):

```json
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

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<IdListResponseDto>` · DTO `IdListResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `ids` | `array<string>` | Sí | formato uuid | — | Valor de ids mantenido por la instancia. | `src/modules/forms/dto/responses.dto.ts:18` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Instancia no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/forms.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Forms (09) — Dynamic Forms & Extensibility Governance — etapa `UC-09-10`

---

