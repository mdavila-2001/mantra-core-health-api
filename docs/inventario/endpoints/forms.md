<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `forms`

- **Bloque:** Clínico y Diagnóstico (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)
- **Operaciones:** 25 (25 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 0 · MEDIO 16 · BAJO 9
- **Tablas distintas que tocan:** 35
- **Respuestas de error y detalle contractual:** `openapi/endpoints/forms.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | GET | `/forms/assignments` | Listar asignaciones de campo (globales y del tenant) | BAJO | 2 | CLINICIAN, PRACTITIONER, SECURITY_ADMIN |
| 2 | POST | `/forms/assignments` | Asignar campos a un target con política de extensión | MEDIO | 5 | CLINICIAN, PRACTITIONER, SECURITY_ADMIN |
| 3 | DELETE | `/forms/assignments/{id}` | Quitar una asignación propia (baja lógica) | MEDIO | 2 | CLINICIAN, PRACTITIONER, SECURITY_ADMIN |
| 4 | PATCH | `/forms/assignments/{id}` | Editar una asignación propia | MEDIO | 2 | CLINICIAN, PRACTITIONER, SECURITY_ADMIN |
| 5 | GET | `/forms/assignments/budget` | Presupuesto de extensión del target para el tenant actual | BAJO | 2 | CLINICIAN, PRACTITIONER, SECURITY_ADMIN |
| 6 | PUT | `/forms/assignments/order` | Reordenar los campos propios de un formulario | BAJO | 1 | CLINICIAN, PRACTITIONER, SECURITY_ADMIN |
| 7 | GET | `/forms/definition-sets` | Listar los sets de definiciones visibles | BAJO | 1 | CLINICIAN, PRACTITIONER, SECURITY_ADMIN |
| 8 | POST | `/forms/definition-sets` | Definir un set de campos dinámicos y su versión inicial | MEDIO | 3 | SECURITY_ADMIN |
| 9 | GET | `/forms/definition-sets/{id}` | Leer un set con sus versiones, campos (reglas, dependencias, i18n) y secciones | BAJO | 8 | CLINICIAN, PRACTITIONER, SECURITY_ADMIN |
| 10 | POST | `/forms/definition-sets/{id}/migrations/{migrationId}/run` | Migrar valores entre versiones de schema | MEDIO | 4 | SECURITY_ADMIN |
| 11 | POST | `/forms/definition-sets/{id}/versions/{ver}/publish` | Componer miembros del set y publicar la versión | MEDIO | 5 | SECURITY_ADMIN |
| 12 | POST | `/forms/field-definitions` | Declarar una definición de campo con reglas de validación | MEDIO | 3 | CLINICIAN, PRACTITIONER, SECURITY_ADMIN |
| 13 | PATCH | `/forms/field-definitions/{id}` | Corregir el nombre o el tipo de un campo propio | MEDIO | 4 | CLINICIAN, PRACTITIONER, SECURITY_ADMIN |
| 14 | POST | `/forms/fields/{id}/access-rules` | Definir reglas de acceso y enmascarado por campo | MEDIO | 2 | SECURITY_ADMIN |
| 15 | POST | `/forms/fields/{id}/dependencies` | Definir dependencias condicionales entre campos | MEDIO | 3 | CLINICIAN, PRACTITIONER, SECURITY_ADMIN |
| 16 | PUT | `/forms/fields/{id}/localizations/{lang}` | Localizar (i18n) una definición de campo | MEDIO | 4 | CLINICIAN, PRACTITIONER, SECURITY_ADMIN |
| 17 | GET | `/forms/instances` | Listar las instancias de formulario de un encuentro | BAJO | 20 | CLINICIAN, PRACTITIONER |
| 18 | POST | `/forms/instances` | Abrir una instancia de formulario para un recurso | MEDIO | 3 | CLINICIAN, PRACTITIONER |
| 19 | GET | `/forms/instances/{id}` | Leer una instancia con sus valores vigentes, por tipo resuelto | BAJO | 23 | CLINICIAN, PRACTITIONER |
| 20 | POST | `/forms/instances/{id}/close` | Cerrar formulario y proyectar vista de recurso | MEDIO | 4 | CLINICIAN, PRACTITIONER |
| 21 | POST | `/forms/instances/{id}/values` | Capturar valores de formulario (value[x] exclusivo) | MEDIO | 4 | CLINICIAN, PRACTITIONER |
| 22 | GET | `/forms/me/instances` | Ver mis formularios clínicos | BAJO | 2 | sesión (sin roles) |
| 23 | GET | `/forms/me/instances/{id}` | Leer un formulario propio con sus respuestas | BAJO | 5 | sesión (sin roles) |
| 24 | PATCH | `/forms/values/{id}` | Corregir valor con supersede y snapshot inmutable | MEDIO | 5 | CLINICIAN, PRACTITIONER |
| 25 | POST | `/forms/values/import` | Registrar procedencia de valores importados (batch ETL) | MEDIO | 5 | CLINICIAN, PRACTITIONER |

---

## 1. GET /forms/assignments

- **Origen:** CONTRATO
- **Nombre:** Listar asignaciones de campo (globales y del tenant)
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `FormsAssignmentsController.listAssignments` — `src/modules/forms/controllers/forms-assignments.controller.ts:71`

### Qué es y para qué sirve (negocio)

Listar asignaciones de campo (globales y del tenant). Dentro del módulo (descripción del modelo, en inglés): «Lets each organization capture additional, validated information without custom software, adapting to local requirements while keeping data quality and a full change history.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_09_forms.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /forms/assignments` la atiende `FormsAssignmentsController.listAssignments` (src/modules/forms/controllers/forms-assignments.controller.ts:71). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER, SECURITY_ADMIN. Delega en `FormsReadService.listAssignments`. Lee forms.dynamic_field_sections, forms.field_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER, SECURITY_ADMIN | `src/modules/forms/controllers/forms-assignments.controller.ts:71` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `forms.dynamic_field_sections` | LEE | LEE | DIRECTA | FormsAssignmentsController.listAssignments → FormsReadService.listAssignments → AssignmentsRepository.findSectionsByIds | `src/modules/forms/repositories/assignments.repository.ts:298` |
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
- **Implementación:** `FormsAssignmentsController.createAssignment` — `src/modules/forms/controllers/forms-assignments.controller.ts:141`

### Qué es y para qué sirve (negocio)

Asignar campos a un target con política de extensión. Caso de uso UC-09-06: Asigna campo a target con enforcement de política. Dentro del módulo (descripción del modelo, en inglés): «Lets each organization capture additional, validated information without custom software, adapting to local requirements while keeping data quality and a full change history.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/forms/README.md:62`) · MODELO (`Mantra Core Health Context/modules/diagram_09_forms.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /forms/assignments` la atiende `FormsAssignmentsController.createAssignment` (src/modules/forms/controllers/forms-assignments.controller.ts:141). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER, SECURITY_ADMIN. Valida el cuerpo como `FormsCreateAssignmentDto` (10 campos, 2 obligatorios). Delega en `FormsAssignmentsService.createAssignment`. Crea filas en forms.dynamic_field_sections, forms.field_assignments. Lee forms.dynamic_field_definitions, forms.extension_target_policies, forms.field_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER, SECURITY_ADMIN | `src/modules/forms/controllers/forms-assignments.controller.ts:141` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `forms.dynamic_field_definitions` | LEE | LEE | DIRECTA | FormsAssignmentsController.createAssignment → FormsAssignmentsService.createAssignment → FieldDefinitionsRepository.findFieldById | `src/modules/forms/repositories/field-definitions.repository.ts:245` |
| `forms.dynamic_field_sections` | ESCRIBE | CREA | DIRECTA | FormsAssignmentsController.createAssignment → FormsAssignmentsService.createAssignment → AssignmentsRepository.createSection | `src/modules/forms/repositories/assignments.repository.ts:159` |
| `forms.extension_target_policies` | LEE | LEE | DIRECTA | FormsAssignmentsController.createAssignment → FormsAssignmentsService.createAssignment → AssignmentsRepository.findActivePolicyForTenant | `src/modules/forms/repositories/assignments.repository.ts:113` |
| `forms.field_assignments` | ESCRIBE | CREA | DIRECTA | FormsAssignmentsController.createAssignment → FormsAssignmentsService.createAssignment → AssignmentsRepository.createAssignment | `src/modules/forms/repositories/assignments.repository.ts:178` |
| `forms.field_assignments` | LEE | LEE | DIRECTA | FormsAssignmentsController.createAssignment → FormsAssignmentsService.createAssignment → AssignmentsRepository.countActiveAssignments | `src/modules/forms/repositories/assignments.repository.ts:140` |

### Cuerpo — DTO `FormsCreateAssignmentDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `fieldId` | `string` | Sí | formato uuid | — | Campo a asignar | sin fuente |
| `targetResourceConceptId` | `string` | Sí | formato uuid | — | Recurso destino (concept id) | sin fuente |
| `sectionId` | `string` | No | formato uuid | — | Sección destino; si se omite se aprovisiona una por defecto | sin fuente |
| `profileTypeConceptId` | `string` | No | formato uuid | — | Perfil objetivo (concept id) | sin fuente |
| `tenantId` | `string` | No | formato uuid | — | Tenant que crea la asignación | sin fuente |
| `branchId` | `string` | No | formato uuid | — | Branch destino | sin fuente |
| `required` | `boolean` | No | — | — | ¿Requerido? | sin fuente |
| `visible` | `boolean` | No | — | — | ¿Visible? | sin fuente |
| `editable` | `boolean` | No | — | — | ¿Editable? | sin fuente |
| `ordinal` | `number` | No | — | — | Orden de presentación | sin fuente |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "fieldId": "00000000-0000-4000-8000-000000000001",
  "targetResourceConceptId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

## 3. DELETE /forms/assignments/{id}

- **Origen:** CONTRATO
- **Nombre:** Quitar una asignación propia (baja lógica)
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `FormsAssignmentsController.retireAssignment` — `src/modules/forms/controllers/forms-assignments.controller.ts:198`

### Qué es y para qué sirve (negocio)

Quitar una asignación propia (baja lógica). Dentro del módulo (descripción del modelo, en inglés): «Lets each organization capture additional, validated information without custom software, adapting to local requirements while keeping data quality and a full change history.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_09_forms.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`DELETE /forms/assignments/{id}` la atiende `FormsAssignmentsController.retireAssignment` (src/modules/forms/controllers/forms-assignments.controller.ts:198). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER, SECURITY_ADMIN. Delega en `FormsAssignmentsService.retireAssignment`. Actualiza forms.field_assignments. Lee forms.field_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER, SECURITY_ADMIN | `src/modules/forms/controllers/forms-assignments.controller.ts:198` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/forms/controllers/forms-assignments.controller.ts:198` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `forms.field_assignments` | ESCRIBE | ACTUALIZA | POR_TIPO | FormsAssignmentsController.retireAssignment → FormsAssignmentsService.retireAssignment | `src/modules/forms/services/forms-assignments.service.ts:239` |
| `forms.field_assignments` | LEE | LEE | DIRECTA | FormsAssignmentsController.retireAssignment → FormsAssignmentsService.retireAssignment → FormsAssignmentsService.loadOwnedAssignment → AssignmentsRepository.findAssignmentById | `src/modules/forms/repositories/assignments.repository.ts:241` |

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
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Los campos del formulario estándar no se editan desde una organización; ForbiddenException: Sólo se pueden editar los campos propios de la organización |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Asignación no encontrada |
| 409 | `CONFLICT` | ConflictException: La asignación ya fue retirada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/forms.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Forms (09) — Dynamic Forms & Extensibility Governance — etapa `ctrl:FormsAssignmentsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 4. PATCH /forms/assignments/{id}

- **Origen:** CONTRATO
- **Nombre:** Editar una asignación propia
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `FormsAssignmentsController.updateAssignment` — `src/modules/forms/controllers/forms-assignments.controller.ts:180`

### Qué es y para qué sirve (negocio)

Editar una asignación propia. Dentro del módulo (descripción del modelo, en inglés): «Lets each organization capture additional, validated information without custom software, adapting to local requirements while keeping data quality and a full change history.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_09_forms.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`PATCH /forms/assignments/{id}` la atiende `FormsAssignmentsController.updateAssignment` (src/modules/forms/controllers/forms-assignments.controller.ts:180). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER, SECURITY_ADMIN. Valida el cuerpo como `UpdateAssignmentDto` (3 campos, 0 obligatorios). Delega en `FormsAssignmentsService.updateAssignment`. Actualiza forms.field_assignments. Lee forms.field_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER, SECURITY_ADMIN | `src/modules/forms/controllers/forms-assignments.controller.ts:180` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/forms/controllers/forms-assignments.controller.ts:180` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `forms.field_assignments` | ESCRIBE | ACTUALIZA | POR_TIPO | FormsAssignmentsController.updateAssignment → FormsAssignmentsService.updateAssignment | `src/modules/forms/services/forms-assignments.service.ts:205` |
| `forms.field_assignments` | LEE | LEE | DIRECTA | FormsAssignmentsController.updateAssignment → FormsAssignmentsService.updateAssignment → FormsAssignmentsService.loadOwnedAssignment → AssignmentsRepository.findAssignmentById | `src/modules/forms/repositories/assignments.repository.ts:241` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `UpdateAssignmentDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `required` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | ¿Requerido? | `src/modules/forms/dto/update-assignment.dto.ts:18` |
| `visible` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | ¿Visible? | `src/modules/forms/dto/update-assignment.dto.ts:26` |
| `editable` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | ¿Editable? | `src/modules/forms/dto/update-assignment.dto.ts:34` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "required": true,
  "visible": true,
  "editable": true
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
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Los campos del formulario estándar no se editan desde una organización; ForbiddenException: Sólo se pueden editar los campos propios de la organización |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Asignación no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/forms.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Forms (09) — Dynamic Forms & Extensibility Governance — etapa `ctrl:FormsAssignmentsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 5. GET /forms/assignments/budget

- **Origen:** CONTRATO
- **Nombre:** Presupuesto de extensión del target para el tenant actual
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `FormsAssignmentsController.getBudget` — `src/modules/forms/controllers/forms-assignments.controller.ts:120`

### Qué es y para qué sirve (negocio)

Presupuesto de extensión del target para el tenant actual. Dentro del módulo (descripción del modelo, en inglés): «Lets each organization capture additional, validated information without custom software, adapting to local requirements while keeping data quality and a full change history.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_09_forms.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /forms/assignments/budget` la atiende `FormsAssignmentsController.getBudget` (src/modules/forms/controllers/forms-assignments.controller.ts:120). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER, SECURITY_ADMIN. Delega en `FormsReadService.getExtensionBudget`. Lee forms.extension_target_policies, forms.field_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER, SECURITY_ADMIN | `src/modules/forms/controllers/forms-assignments.controller.ts:120` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_QUERY | targetResourceConceptId (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

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

## 6. PUT /forms/assignments/order

- **Origen:** CONTRATO
- **Nombre:** Reordenar los campos propios de un formulario
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `FormsAssignmentsController.reorderAssignments` — `src/modules/forms/controllers/forms-assignments.controller.ts:163`

### Qué es y para qué sirve (negocio)

Reordenar los campos propios de un formulario. Dentro del módulo (descripción del modelo, en inglés): «Lets each organization capture additional, validated information without custom software, adapting to local requirements while keeping data quality and a full change history.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_09_forms.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`PUT /forms/assignments/order` la atiende `FormsAssignmentsController.reorderAssignments` (src/modules/forms/controllers/forms-assignments.controller.ts:163). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER, SECURITY_ADMIN. Valida el cuerpo como `ReorderAssignmentsDto` (2 campos, 2 obligatorios). Delega en `FormsAssignmentsService.reorderAssignments`. Lee forms.field_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER, SECURITY_ADMIN | `src/modules/forms/controllers/forms-assignments.controller.ts:163` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `forms.field_assignments` | LEE | LEE | DIRECTA | FormsAssignmentsController.reorderAssignments → FormsAssignmentsService.reorderAssignments → AssignmentsRepository.findActiveOwnAssignmentsForTarget | `src/modules/forms/repositories/assignments.repository.ts:259` |

### Cuerpo — DTO `ReorderAssignmentsDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `targetResourceConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Recurso destino (concept id) | `src/modules/forms/dto/reorder-assignments.dto.ts:18` |
| `assignmentIds` | `array<string>` | Sí | formato uuid; mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ArrayUnique()` `@IsUUID('all', { each: true })` | Asignaciones propias en el orden final (sin repetidos) | `src/modules/forms/dto/reorder-assignments.dto.ts:32` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "targetResourceConceptId": "00000000-0000-4000-8000-000000000001",
  "assignmentIds": [
    "00000000-0000-4000-8000-000000000001"
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "targetResourceConceptId": "00000000-0000-4000-8000-000000000001",
  "assignmentIds": [
    "00000000-0000-4000-8000-000000000001"
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
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Hay asignaciones que no son campos propios y activos de este formulario |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/forms.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Forms (09) — Dynamic Forms & Extensibility Governance — etapa `ctrl:FormsAssignmentsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 7. GET /forms/definition-sets

- **Origen:** CONTRATO
- **Nombre:** Listar los sets de definiciones visibles
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `FormsDefinitionSetsController.listDefinitionSets` — `src/modules/forms/controllers/forms-definition-sets.controller.ts:62`

### Qué es y para qué sirve (negocio)

Listar los sets de definiciones visibles. Dentro del módulo (descripción del modelo, en inglés): «Lets each organization capture additional, validated information without custom software, adapting to local requirements while keeping data quality and a full change history.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_09_forms.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /forms/definition-sets` la atiende `FormsDefinitionSetsController.listDefinitionSets` (src/modules/forms/controllers/forms-definition-sets.controller.ts:62). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER, SECURITY_ADMIN. Delega en `FormsReadService.listDefinitionSets`. Lee forms.field_definition_sets.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER, SECURITY_ADMIN | `src/modules/forms/controllers/forms-definition-sets.controller.ts:62` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

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

## 8. POST /forms/definition-sets

- **Origen:** CONTRATO
- **Nombre:** Definir un set de campos dinámicos y su versión inicial
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `FormsDefinitionSetsController.createDefinitionSet` — `src/modules/forms/controllers/forms-definition-sets.controller.ts:93`

### Qué es y para qué sirve (negocio)

Definir un set de campos dinámicos y su versión inicial. Caso de uso UC-09-01: Crea set + versión inicial (draft, inmutable). Dentro del módulo (descripción del modelo, en inglés): «Lets each organization capture additional, validated information without custom software, adapting to local requirements while keeping data quality and a full change history.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/forms/README.md:57`) · MODELO (`Mantra Core Health Context/modules/diagram_09_forms.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /forms/definition-sets` la atiende `FormsDefinitionSetsController.createDefinitionSet` (src/modules/forms/controllers/forms-definition-sets.controller.ts:93). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateDefinitionSetDto` (6 campos, 3 obligatorios). Delega en `FormsSchemaService.createDefinitionSet`. Crea filas en forms.field_definition_set_versions, forms.field_definition_sets. Lee forms.field_definition_sets.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/forms/controllers/forms-definition-sets.controller.ts:93` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

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

## 9. GET /forms/definition-sets/{id}

- **Origen:** CONTRATO
- **Nombre:** Leer un set con sus versiones, campos (reglas, dependencias, i18n) y secciones
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `FormsDefinitionSetsController.getDefinitionSet` — `src/modules/forms/controllers/forms-definition-sets.controller.ts:80`

### Qué es y para qué sirve (negocio)

Leer un set con sus versiones, campos (reglas, dependencias, i18n) y secciones. Dentro del módulo (descripción del modelo, en inglés): «Lets each organization capture additional, validated information without custom software, adapting to local requirements while keeping data quality and a full change history.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_09_forms.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /forms/definition-sets/{id}` la atiende `FormsDefinitionSetsController.getDefinitionSet` (src/modules/forms/controllers/forms-definition-sets.controller.ts:80). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER, SECURITY_ADMIN. Delega en `FormsReadService.getDefinitionSet`. Lee forms.dynamic_field_definitions, forms.dynamic_field_sections, forms.field_definition_localizations, forms.field_definition_set_versions, forms.field_definition_sets, forms.field_dependencies, forms.field_set_members, forms.field_validation_rules.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER, SECURITY_ADMIN | `src/modules/forms/controllers/forms-definition-sets.controller.ts:80` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/forms/controllers/forms-definition-sets.controller.ts:80` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `forms.dynamic_field_definitions` | LEE | LEE | DIRECTA | FormsDefinitionSetsController.getDefinitionSet → FormsReadService.getDefinitionSet → FieldDefinitionsRepository.findFieldsByIds | `src/modules/forms/repositories/field-definitions.repository.ts:411` |
| `forms.dynamic_field_sections` | LEE | LEE | DIRECTA | FormsDefinitionSetsController.getDefinitionSet → FormsReadService.getDefinitionSet → AssignmentsRepository.findSectionsByIds | `src/modules/forms/repositories/assignments.repository.ts:298` |
| `forms.field_definition_localizations` | LEE | LEE | DIRECTA | FormsDefinitionSetsController.getDefinitionSet → FormsReadService.getDefinitionSet → FieldDefinitionsRepository.findLocalizationsByFieldIds | `src/modules/forms/repositories/field-definitions.repository.ts:464` |
| `forms.field_definition_set_versions` | LEE | LEE | DIRECTA | FormsDefinitionSetsController.getDefinitionSet → FormsReadService.getDefinitionSet → DefinitionSetsRepository.findVersionsBySet | `src/modules/forms/repositories/definition-sets.repository.ts:235` |
| `forms.field_definition_sets` | LEE | LEE | DIRECTA | FormsDefinitionSetsController.getDefinitionSet → FormsReadService.getDefinitionSet → DefinitionSetsRepository.findSetById | `src/modules/forms/repositories/definition-sets.repository.ts:116` |
| `forms.field_dependencies` | LEE | LEE | DIRECTA | FormsDefinitionSetsController.getDefinitionSet → FormsReadService.getDefinitionSet → FieldDefinitionsRepository.findDependenciesByTargetFieldIds | `src/modules/forms/repositories/field-definitions.repository.ts:445` |
| `forms.field_set_members` | LEE | LEE | DIRECTA | FormsDefinitionSetsController.getDefinitionSet → FormsReadService.getDefinitionSet → DefinitionSetsRepository.findMembersByVersions | `src/modules/forms/repositories/definition-sets.repository.ts:255` |
| `forms.field_validation_rules` | LEE | LEE | DIRECTA | FormsDefinitionSetsController.getDefinitionSet → FormsReadService.getDefinitionSet → FieldDefinitionsRepository.findValidationRulesByFieldIds | `src/modules/forms/repositories/field-definitions.repository.ts:426` |

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

## 10. POST /forms/definition-sets/{id}/migrations/{migrationId}/run

- **Origen:** CONTRATO
- **Nombre:** Migrar valores entre versiones de schema
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `FormsDefinitionSetsController.runMigration` — `src/modules/forms/controllers/forms-definition-sets.controller.ts:131`

### Qué es y para qué sirve (negocio)

Migrar valores entre versiones de schema. Caso de uso UC-09-13: Ejecuta migración entre versiones. Dentro del módulo (descripción del modelo, en inglés): «Lets each organization capture additional, validated information without custom software, adapting to local requirements while keeping data quality and a full change history.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/forms/README.md:69`) · MODELO (`Mantra Core Health Context/modules/diagram_09_forms.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /forms/definition-sets/{id}/migrations/{migrationId}/run` la atiende `FormsDefinitionSetsController.runMigration` (src/modules/forms/controllers/forms-definition-sets.controller.ts:131). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `RunMigrationDto` (6 campos, 2 obligatorios). Delega en `FormsSchemaService.runMigration`. Crea filas en forms.field_schema_migrations. Lee forms.field_definition_set_versions, forms.field_definition_sets, forms.field_schema_migrations.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/forms/controllers/forms-definition-sets.controller.ts:131` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id, migrationId | `src/modules/forms/controllers/forms-definition-sets.controller.ts:131` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

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

## 11. POST /forms/definition-sets/{id}/versions/{ver}/publish

- **Origen:** CONTRATO
- **Nombre:** Componer miembros del set y publicar la versión
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `FormsDefinitionSetsController.publishVersion` — `src/modules/forms/controllers/forms-definition-sets.controller.ts:112`

### Qué es y para qué sirve (negocio)

Componer miembros del set y publicar la versión. Caso de uso UC-09-03: Compone miembros y publica la versión. Dentro del módulo (descripción del modelo, en inglés): «Lets each organization capture additional, validated information without custom software, adapting to local requirements while keeping data quality and a full change history.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/forms/README.md:59`) · MODELO (`Mantra Core Health Context/modules/diagram_09_forms.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /forms/definition-sets/{id}/versions/{ver}/publish` la atiende `FormsDefinitionSetsController.publishVersion` (src/modules/forms/controllers/forms-definition-sets.controller.ts:112). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `FormsPublishVersionDto` (5 campos, 2 obligatorios). Delega en `FormsSchemaService.publishVersion`. Crea filas en forms.field_set_members. Actualiza forms.field_definition_set_versions, forms.field_definition_sets. Lee forms.field_definition_set_versions, forms.field_definition_sets.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/forms/controllers/forms-definition-sets.controller.ts:112` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id, ver | `src/modules/forms/controllers/forms-definition-sets.controller.ts:112` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

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

## 12. POST /forms/field-definitions

- **Origen:** CONTRATO
- **Nombre:** Declarar una definición de campo con reglas de validación
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `FormsFieldsController.createFieldDefinition` — `src/modules/forms/controllers/forms-fields.controller.ts:47`

### Qué es y para qué sirve (negocio)

Declarar una definición de campo con reglas de validación. Caso de uso UC-09-02: clínico, practitioner o SECURITY_ADMIN. Dentro del módulo (descripción del modelo, en inglés): «Lets each organization capture additional, validated information without custom software, adapting to local requirements while keeping data quality and a full change history.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/forms/README.md:58`) · MODELO (`Mantra Core Health Context/modules/diagram_09_forms.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /forms/field-definitions` la atiende `FormsFieldsController.createFieldDefinition` (src/modules/forms/controllers/forms-fields.controller.ts:47). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER, SECURITY_ADMIN. Valida el cuerpo como `CreateFieldDefinitionDto` (20 campos, 3 obligatorios). Delega en `FormsFieldsService.createFieldDefinition`. Crea filas en forms.dynamic_field_definitions, forms.field_validation_rules. Lee forms.dynamic_field_definitions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER, SECURITY_ADMIN | `src/modules/forms/controllers/forms-fields.controller.ts:47` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `forms.dynamic_field_definitions` | ESCRIBE | CREA | DIRECTA | FormsFieldsController.createFieldDefinition → FormsFieldsService.createFieldDefinition → FieldDefinitionsRepository.createField | `src/modules/forms/repositories/field-definitions.repository.ts:274` |
| `forms.dynamic_field_definitions` | LEE | LEE | DIRECTA | FormsFieldsController.createFieldDefinition → FormsFieldsService.createFieldDefinition → FieldDefinitionsRepository.findFieldByCode | `src/modules/forms/repositories/field-definitions.repository.ts:259` |
| `forms.field_validation_rules` | ESCRIBE | CREA | DIRECTA | FormsFieldsController.createFieldDefinition → FormsFieldsService.createFieldDefinition → FieldDefinitionsRepository.createValidationRule | `src/modules/forms/repositories/field-definitions.repository.ts:293` |

### Cuerpo — DTO `CreateFieldDefinitionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `code` | `string` | Sí | longitud mínima 1; longitud máxima 100 | `@IsString()` `@MinLength(1)` `@MaxLength(100)` | Código único del campo | `src/modules/forms/dto/create-field-definition.dto.ts:90` |
| `name` | `string` | Sí | longitud mínima 1; longitud máxima 200 | `@IsString()` `@MinLength(1)` `@MaxLength(200)` | Nombre legible | `src/modules/forms/dto/create-field-definition.dto.ts:99` |
| `dataType` | `string` | Sí | valores: string, text, integer, decimal, boolean, date, datetime, time, uuid, json, binary, reference, code | `@IsIn(TECHNICAL_DATA_TYPES)` | Tipo de dato técnico | `src/modules/forms/dto/create-field-definition.dto.ts:109` |
| `sensitivityConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Sensibilidad (concept id) | `src/modules/forms/dto/create-field-definition.dto.ts:120` |
| `semanticConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concepto semántico (concept id) | `src/modules/forms/dto/create-field-definition.dto.ts:131` |
| `valueSetId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Value set de valores permitidos | `src/modules/forms/dto/create-field-definition.dto.ts:142` |
| `unitValueSetId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Value set de unidades | `src/modules/forms/dto/create-field-definition.dto.ts:150` |
| `cardinalityMin` | `number` | No | — | `@IsOptional()` `@IsInt()` | Cardinalidad mínima | `src/modules/forms/dto/create-field-definition.dto.ts:158` |
| `cardinalityMax` | `number` | No | — | `@IsOptional()` `@IsInt()` | Cardinalidad máxima | `src/modules/forms/dto/create-field-definition.dto.ts:166` |
| `regex` | `string` | No | longitud máxima 1000 | `@IsOptional()` `@IsString()` `@MaxLength(1000)` | Expresión regular de validación | `src/modules/forms/dto/create-field-definition.dto.ts:175` |
| `validationRules` | `array<ValidationRuleInputDto>` | No | — | `@IsOptional()` `@IsArray()` `@ValidateNested({ each: true })` `@Type(() => ValidationRuleInputDto)` | Reglas de validación | `src/modules/forms/dto/create-field-definition.dto.ts:188` |
| `validationRules[].ruleType` | `string` | No | valores: REQUIRED, RANGE, REGEX | `@IsIn(['REQUIRED', 'RANGE', 'REGEX'])` | — | `src/modules/forms/dto/create-field-definition.dto.ts:46` |
| `validationRules[].operator` | `string` | No | valores: EQ, NEQ, GT, LT | `@IsOptional()` `@IsIn(['EQ', 'NEQ', 'GT', 'LT'])` | — | `src/modules/forms/dto/create-field-definition.dto.ts:54` |
| `validationRules[].parameters` | `object` | No | — | `@IsObject()` | Parámetros de la regla | `src/modules/forms/dto/create-field-definition.dto.ts:61` |
| `validationRules[].severity` | `string` | No | valores: ERROR, WARNING | `@IsOptional()` `@IsIn(['ERROR', 'WARNING'])` | — | `src/modules/forms/dto/create-field-definition.dto.ts:69` |
| `validationRules[].errorMessage` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | Mensaje de error asociado | `src/modules/forms/dto/create-field-definition.dto.ts:78` |
| `options` | `array<string>` | No | mínimo 2 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayMinSize(2, { message: 'Un campo de elección necesita al menos dos opciones', })` `@IsString({ each: true })` | Opciones propias de un campo de elección (dataType "code" sin valueSetId) | `src/modules/forms/dto/create-field-definition.dto.ts:206` |
| `multiple` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Admite varias respuestas en vez de una sola | `src/modules/forms/dto/create-field-definition.dto.ts:218` |
| `allowOther` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Ofrece «Otro», con texto libre | `src/modules/forms/dto/create-field-definition.dto.ts:230` |
| `description` | `string` | No | longitud máxima 1000 | `@IsOptional()` `@IsString()` `@MaxLength(1000)` | Ayuda que se lee bajo la pregunta (se sirve como "hint") | `src/modules/forms/dto/create-field-definition.dto.ts:242` |

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
  ],
  "options": [
    "valor-ejemplo",
    "valor-ejemplo"
  ],
  "multiple": false,
  "allowOther": false,
  "description": "Texto descriptivo de ejemplo"
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
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: `options` sólo aplica a dataType "code"; PreconditionFailedException: `allowOther` sólo aplica a dataType "code"; PreconditionFailedException: Un campo "code" declara valueSetId u options, no los dos; PreconditionFailedException: `allowOther` no aplica sobre un valueSetId: ese catálogo lo administra terminología; PreconditionFailedException: Un campo "code" sin valueSetId necesita al menos dos opciones; PreconditionFailedException: Una opción no puede estar vacía; PreconditionFailedException: Las opciones no pueden repetirse |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/forms.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Forms (09) — Dynamic Forms & Extensibility Governance — etapa `UC-09-02`

---

## 13. PATCH /forms/field-definitions/{id}

- **Origen:** CONTRATO
- **Nombre:** Corregir el nombre o el tipo de un campo propio
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `FormsFieldsController.updateFieldDefinition` — `src/modules/forms/controllers/forms-fields.controller.ts:71`

### Qué es y para qué sirve (negocio)

Corregir el nombre o el tipo de un campo propio. Dentro del módulo (descripción del modelo, en inglés): «Lets each organization capture additional, validated information without custom software, adapting to local requirements while keeping data quality and a full change history.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_09_forms.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`PATCH /forms/field-definitions/{id}` la atiende `FormsFieldsController.updateFieldDefinition` (src/modules/forms/controllers/forms-fields.controller.ts:71). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER, SECURITY_ADMIN. Valida el cuerpo como `UpdateFieldDefinitionDto` (8 campos, 0 obligatorios). Delega en `FormsFieldsService.updateFieldDefinition`. Actualiza forms.dynamic_field_definitions. Lee forms.dynamic_field_definitions, forms.field_assignments, forms.field_values.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER, SECURITY_ADMIN | `src/modules/forms/controllers/forms-fields.controller.ts:71` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/forms/controllers/forms-fields.controller.ts:71` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `forms.dynamic_field_definitions` | ESCRIBE | ACTUALIZA | POR_TIPO | FormsFieldsController.updateFieldDefinition → FormsFieldsService.updateFieldDefinition | `src/modules/forms/services/forms-fields.service.ts:214` |
| `forms.dynamic_field_definitions` | LEE | LEE | DIRECTA | FormsFieldsController.updateFieldDefinition → FormsFieldsService.updateFieldDefinition → FieldDefinitionsRepository.findFieldById | `src/modules/forms/repositories/field-definitions.repository.ts:245` |
| `forms.field_assignments` | LEE | LEE | DIRECTA | FormsFieldsController.updateFieldDefinition → FormsFieldsService.updateFieldDefinition → AssignmentsRepository.findAssignmentsByField | `src/modules/forms/repositories/assignments.repository.ts:282` |
| `forms.field_values` | LEE | LEE | DIRECTA | FormsFieldsController.updateFieldDefinition → FormsFieldsService.updateFieldDefinition → FieldValuesRepository.countByField | `src/modules/forms/repositories/field-values.repository.ts:222` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `UpdateFieldDefinitionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `name` | `string` | No | longitud mínima 1; longitud máxima 200 | `@IsOptional()` `@IsString()` `@MinLength(1)` `@MaxLength(200)` | Nombre legible del campo | `src/modules/forms/dto/update-field-definition.dto.ts:45` |
| `dataType` | `string` | No | valores: string, text, integer, decimal, boolean, date, datetime, time, uuid, json, binary, reference, code | `@IsOptional()` `@IsIn(TECHNICAL_DATA_TYPES)` | Tipo de dato técnico; con valores capturados no se cambia (409) | `src/modules/forms/dto/update-field-definition.dto.ts:57` |
| `options` | `array<string>` | No | mínimo 2 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayMinSize(2, { message: 'Un campo de elección necesita al menos dos opciones', })` `@IsString({ each: true })` | Opciones, reemplazadas enteras | `src/modules/forms/dto/update-field-definition.dto.ts:73` |
| `multiple` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Admite varias respuestas | `src/modules/forms/dto/update-field-definition.dto.ts:79` |
| `allowOther` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Ofrece «Otro», con texto libre | `src/modules/forms/dto/update-field-definition.dto.ts:85` |
| `description` | `object` | No | longitud máxima 1000; admite null | `@IsOptional()` `@IsString()` `@MaxLength(1000)` | Ayuda bajo la pregunta; null la quita | `src/modules/forms/dto/update-field-definition.dto.ts:98` |
| `cardinalityMin` | `object` | No | mínimo 0; admite null | `@IsOptional()` `@ValidateIf((_, value) => value !== null)` `@IsInt()` `@Min(0)` | Mínimo de respuestas; null quita el tope | `src/modules/forms/dto/update-field-definition.dto.ts:114` |
| `cardinalityMax` | `object` | No | mínimo 1; admite null | `@IsOptional()` `@ValidateIf((_, value) => value !== null)` `@IsInt()` `@Min(1)` | Máximo de respuestas; null quita el tope | `src/modules/forms/dto/update-field-definition.dto.ts:129` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "name": "Nombre de ejemplo",
  "dataType": "string",
  "options": [
    "valor-ejemplo",
    "valor-ejemplo"
  ],
  "multiple": true,
  "allowOther": true,
  "description": {},
  "cardinalityMin": {},
  "cardinalityMax": {}
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
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Sólo se pueden corregir los campos propios de la organización; los del estándar no se editan desde acá |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Campo no encontrado |
| 409 | `CONFLICT` | ConflictException: El campo ya tiene valores capturados: cambiar su tipo reescribiría la historia |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: `options` sólo aplica a dataType "code"; PreconditionFailedException: `allowOther` sólo aplica a dataType "code"; PreconditionFailedException: Un campo "code" declara valueSetId u options, no los dos; PreconditionFailedException: `allowOther` no aplica sobre un valueSetId: ese catálogo lo administra terminología; PreconditionFailedException: Un campo "code" sin valueSetId necesita al menos dos opciones; PreconditionFailedException: Una opción no puede estar vacía; PreconditionFailedException: Las opciones no pueden repetirse; PreconditionFailedException: No se puede quitar una opción que ya tiene respuestas capturadas; PreconditionFailedException: Los topes de respuestas sólo aplican a un campo de elección que admite varias; PreconditionFailedException: El mínimo de respuestas no puede superar al máximo; PreconditionFailedException: El tope de respuestas no puede superar la cantidad de opciones |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/forms.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Forms (09) — Dynamic Forms & Extensibility Governance — etapa `ctrl:FormsFieldsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 14. POST /forms/fields/{id}/access-rules

- **Origen:** CONTRATO
- **Nombre:** Definir reglas de acceso y enmascarado por campo
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `FormsFieldsController.createAccessRule` — `src/modules/forms/controllers/forms-fields.controller.ts:128`

### Qué es y para qué sirve (negocio)

Definir reglas de acceso y enmascarado por campo. Caso de uso UC-09-12: Define regla de acceso / enmascarado por campo. Dentro del módulo (descripción del modelo, en inglés): «Lets each organization capture additional, validated information without custom software, adapting to local requirements while keeping data quality and a full change history.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/forms/README.md:68`) · MODELO (`Mantra Core Health Context/modules/diagram_09_forms.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /forms/fields/{id}/access-rules` la atiende `FormsFieldsController.createAccessRule` (src/modules/forms/controllers/forms-fields.controller.ts:128). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateAccessRuleDto` (7 campos, 1 obligatorio). Delega en `FormsFieldsService.createAccessRule`. Crea filas en forms.field_value_access_rules. Lee forms.dynamic_field_definitions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/forms/controllers/forms-fields.controller.ts:128` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/forms/controllers/forms-fields.controller.ts:128` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `forms.dynamic_field_definitions` | LEE | LEE | DIRECTA | FormsFieldsController.createAccessRule → FormsFieldsService.createAccessRule → FieldDefinitionsRepository.findFieldById | `src/modules/forms/repositories/field-definitions.repository.ts:245` |
| `forms.field_value_access_rules` | ESCRIBE | CREA | DIRECTA | FormsFieldsController.createAccessRule → FormsFieldsService.createAccessRule → FieldDefinitionsRepository.createAccessRule | `src/modules/forms/repositories/field-definitions.repository.ts:391` |

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

## 15. POST /forms/fields/{id}/dependencies

- **Origen:** CONTRATO
- **Nombre:** Definir dependencias condicionales entre campos
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `FormsFieldsController.addDependency` — `src/modules/forms/controllers/forms-fields.controller.ts:89`

### Qué es y para qué sirve (negocio)

Definir dependencias condicionales entre campos. Caso de uso UC-09-04: Define dependencia condicional entre campos. Dentro del módulo (descripción del modelo, en inglés): «Lets each organization capture additional, validated information without custom software, adapting to local requirements while keeping data quality and a full change history.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/forms/README.md:60`) · MODELO (`Mantra Core Health Context/modules/diagram_09_forms.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /forms/fields/{id}/dependencies` la atiende `FormsFieldsController.addDependency` (src/modules/forms/controllers/forms-fields.controller.ts:89). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER, SECURITY_ADMIN. Valida el cuerpo como `CreateFieldDependencyDto` (6 campos, 3 obligatorios). Delega en `FormsFieldsService.addDependency`. Crea filas en forms.field_dependencies. Lee forms.dynamic_field_definitions, forms.field_dependencies.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER, SECURITY_ADMIN | `src/modules/forms/controllers/forms-fields.controller.ts:89` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/forms/controllers/forms-fields.controller.ts:89` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `forms.dynamic_field_definitions` | LEE | LEE | DIRECTA | FormsFieldsController.addDependency → FormsFieldsService.addDependency → FieldDefinitionsRepository.findFieldById | `src/modules/forms/repositories/field-definitions.repository.ts:245` |
| `forms.field_dependencies` | ESCRIBE | CREA | DIRECTA | FormsFieldsController.addDependency → FormsFieldsService.addDependency → FieldDefinitionsRepository.createDependency | `src/modules/forms/repositories/field-definitions.repository.ts:334` |
| `forms.field_dependencies` | LEE | LEE | DIRECTA | FormsFieldsController.addDependency → FormsFieldsService.addDependency → FieldDefinitionsRepository.findDependency | `src/modules/forms/repositories/field-definitions.repository.ts:315` |

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

## 16. PUT /forms/fields/{id}/localizations/{lang}

- **Origen:** CONTRATO
- **Nombre:** Localizar (i18n) una definición de campo
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `FormsFieldsController.upsertLocalization` — `src/modules/forms/controllers/forms-fields.controller.ts:108`

### Qué es y para qué sirve (negocio)

Localizar (i18n) una definición de campo. Caso de uso UC-09-05: Upsert de localización i18n (es/en). Dentro del módulo (descripción del modelo, en inglés): «Lets each organization capture additional, validated information without custom software, adapting to local requirements while keeping data quality and a full change history.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/forms/README.md:61`) · MODELO (`Mantra Core Health Context/modules/diagram_09_forms.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`PUT /forms/fields/{id}/localizations/{lang}` la atiende `FormsFieldsController.upsertLocalization` (src/modules/forms/controllers/forms-fields.controller.ts:108). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER, SECURITY_ADMIN. Valida el cuerpo como `UpsertLocalizationDto` (4 campos, 0 obligatorios). Delega en `FormsFieldsService.upsertLocalization`. Crea filas en forms.field_definition_localizations. Actualiza forms.field_definition_localizations. Lee forms.dynamic_field_definitions, forms.field_definition_localizations.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER, SECURITY_ADMIN | `src/modules/forms/controllers/forms-fields.controller.ts:108` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/forms/controllers/forms-fields.controller.ts:108` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `forms.dynamic_field_definitions` | LEE | LEE | DIRECTA | FormsFieldsController.upsertLocalization → FormsFieldsService.upsertLocalization → FieldDefinitionsRepository.findFieldById | `src/modules/forms/repositories/field-definitions.repository.ts:245` |
| `forms.field_definition_localizations` | ESCRIBE | ACTUALIZA | POR_TIPO | FormsFieldsController.upsertLocalization → FormsFieldsService.upsertLocalization | `src/modules/forms/services/forms-fields.service.ts:471` |
| `forms.field_definition_localizations` | ESCRIBE | CREA | DIRECTA | FormsFieldsController.upsertLocalization → FormsFieldsService.upsertLocalization → FieldDefinitionsRepository.createLocalization | `src/modules/forms/repositories/field-definitions.repository.ts:372` |
| `forms.field_definition_localizations` | LEE | LEE | DIRECTA | FormsFieldsController.upsertLocalization → FormsFieldsService.upsertLocalization → FieldDefinitionsRepository.findLocalization | `src/modules/forms/repositories/field-definitions.repository.ts:354` |

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

## 17. GET /forms/instances

- **Origen:** CONTRATO
- **Nombre:** Listar las instancias de formulario de un encuentro
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `FormsInstancesController.listInstances` — `src/modules/forms/controllers/forms-instances.controller.ts:72`

### Qué es y para qué sirve (negocio)

Listar las instancias de formulario de un encuentro. Dentro del módulo (descripción del modelo, en inglés): «Lets each organization capture additional, validated information without custom software, adapting to local requirements while keeping data quality and a full change history.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_09_forms.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /forms/instances` la atiende `FormsInstancesController.listInstances` (src/modules/forms/controllers/forms-instances.controller.ts:72). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Delega en `FormsReadService.listInstancesByEncounter`. Lee authz.access_policies, authz.care_relationships, authz.clinical_access_grants, authz.field_permissions, authz.patient_legal_representations, authz.permissions, authz.resource_scope_grants, authz.role_permissions y 12 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/forms/controllers/forms-instances.controller.ts:72` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_QUERY | encounter (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.access_policies` | LEE | LEE | DIRECTA | FormsInstancesController.listInstances → FormsReadService.listInstancesByEncounter → FormsReadService.loadReadableEncounter → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AccessPoliciesRepository.findActiveForTarget | `src/modules/authz/repositories/access-policies.repository.ts:62` |
| `authz.care_relationships` | LEE | LEE | DIRECTA | FormsInstancesController.listInstances → FormsReadService.listInstancesByEncounter → FormsReadService.loadReadableEncounter → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → ClinicalReadService.hasCareCurrentRelation → CareRelationshipsRepository.findActiveForPractitionerPatient | `src/modules/authz/repositories/care-relationships.repository.ts:100` |
| `authz.clinical_access_grants` | LEE | LEE | DIRECTA | FormsInstancesController.listInstances → FormsReadService.listInstancesByEncounter → FormsReadService.loadReadableEncounter → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ClinicalAccessGrantsRepository.findActiveForUserPatient | `src/modules/authz/repositories/clinical-access-grants.repository.ts:105` |
| `authz.field_permissions` | LEE | LEE | DIRECTA | FormsInstancesController.listInstances → FormsReadService.listInstancesByEncounter → FormsReadService.loadReadableEncounter → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.computeMaskedFields → FieldPermissionsRepository.findForRoles | `src/modules/authz/repositories/field-permissions.repository.ts:61` |
| `authz.patient_legal_representations` | LEE | LEE | DIRECTA | FormsInstancesController.listInstances → FormsReadService.listInstancesByEncounter → FormsReadService.loadReadableEncounter → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PatientLegalRepresentationsRepository.findActiveForRepresentativePatient | `src/modules/authz/repositories/patient-legal-representations.repository.ts:96` |
| `authz.permissions` | LEE | LEE | DIRECTA | FormsInstancesController.listInstances → FormsReadService.listInstancesByEncounter → FormsReadService.loadReadableEncounter → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PermissionsRepository.findByResourceAction | `src/modules/authz/repositories/permissions.repository.ts:89` |
| `authz.resource_scope_grants` | LEE | LEE | DIRECTA | FormsInstancesController.listInstances → FormsReadService.listInstancesByEncounter → FormsReadService.loadReadableEncounter → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ResourceScopeGrantsRepository.findForSubjectResource | `src/modules/authz/repositories/resource-scope-grants.repository.ts:73` |
| `authz.role_permissions` | LEE | LEE | DIRECTA | FormsInstancesController.listInstances → FormsReadService.listInstancesByEncounter → FormsReadService.loadReadableEncounter → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → RolePermissionsRepository.findActiveForRoles | `src/modules/authz/repositories/role-permissions.repository.ts:47` |
| `authz.roles` | LEE | LEE | DIRECTA | FormsInstancesController.listInstances → FormsReadService.listInstancesByEncounter → FormsReadService.loadReadableEncounter → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.resolveRoleInheritance → RolesRepository.findById | `src/modules/authz/repositories/roles.repository.ts:61` |
| `authz.user_permission_grants` | LEE | LEE | DIRECTA | FormsInstancesController.listInstances → FormsReadService.listInstancesByEncounter → FormsReadService.loadReadableEncounter → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserPermissionGrantsRepository.findActiveForUser | `src/modules/authz/repositories/user-permission-grants.repository.ts:85` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | FormsInstancesController.listInstances → FormsReadService.listInstancesByEncounter → FormsReadService.loadReadableEncounter → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserRoleAssignmentsRepository.findActiveForUser | `src/modules/authz/repositories/user-role-assignments.repository.ts:102` |
| `clinical.encounters` | LEE | LEE | DIRECTA | FormsInstancesController.listInstances → FormsReadService.listInstancesByEncounter → FormsReadService.loadReadableEncounter | `src/modules/forms/services/forms-read.service.ts:643` |
| `forms.form_instances` | LEE | LEE | DIRECTA | FormsInstancesController.listInstances → FormsReadService.listInstancesByEncounter → FormInstancesRepository.findByResourceId | `src/modules/forms/repositories/form-instances.repository.ts:102` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | FormsInstancesController.listInstances → FormsReadService.listInstancesByEncounter → FormsReadService.loadReadableEncounter → ClinicalReadService.assertCanReadHistory → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.patient_portal_proxies` | LEE | LEE | DIRECTA | FormsInstancesController.listInstances → FormsReadService.listInstancesByEncounter → FormsReadService.loadReadableEncounter → ClinicalReadService.assertCanReadHistory → ClinicalReadService.assertOwnRecord → PatientRepresentationService.representsPatient → PatientPortalProxiesRepository.findActiveByProxyUserAndPatient | `src/modules/profiles/infrastructure/repositories/patient-portal-proxies.repository.ts:233` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | FormsInstancesController.listInstances → FormsReadService.listInstancesByEncounter → FormsReadService.loadReadableEncounter → ClinicalReadService.assertCanReadHistory → ClinicalReadService.assertOwnRecord → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | FormsInstancesController.listInstances → FormsReadService.listInstancesByEncounter → FormsReadService.loadReadableEncounter → ClinicalReadService.assertCanReadHistory → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | FormsInstancesController.listInstances → FormsReadService.listInstancesByEncounter → FormsReadService.loadReadableEncounter → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:981` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | FormsInstancesController.listInstances → FormsReadService.listInstancesByEncounter → FormsReadService.loadReadableEncounter → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → ClinicalReadService.attendsToday → SchedulingBookingsRepository.findConfirmedWithPatientBetween | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1007` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | FormsInstancesController.listInstances → FormsReadService.listInstancesByEncounter → FormsReadService.loadReadableEncounter → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:981` |

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
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: {WITHOUT_ACCESS_TO_HISTORY} |
| 404 | `NOT_FOUND` | ResourceNotFoundException: {failure.message} |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/forms.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Forms (09) — Dynamic Forms & Extensibility Governance — etapa `ctrl:FormsInstancesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 18. POST /forms/instances

- **Origen:** CONTRATO
- **Nombre:** Abrir una instancia de formulario para un recurso
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `FormsInstancesController.openInstance` — `src/modules/forms/controllers/forms-instances.controller.ts:113`

### Qué es y para qué sirve (negocio)

Abrir una instancia de formulario para un recurso. Caso de uso UC-09-07: Abre instancia de formulario para un recurso. Dentro del módulo (descripción del modelo, en inglés): «Lets each organization capture additional, validated information without custom software, adapting to local requirements while keeping data quality and a full change history.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/forms/README.md:63`) · MODELO (`Mantra Core Health Context/modules/diagram_09_forms.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /forms/instances` la atiende `FormsInstancesController.openInstance` (src/modules/forms/controllers/forms-instances.controller.ts:113). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `OpenInstanceDto` (4 campos, 1 obligatorio). Delega en `FormsInstancesService.openInstance`. Crea filas en forms.form_instances. Lee clinical.encounters, forms.form_instances.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/forms/controllers/forms-instances.controller.ts:113` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.encounters` | LEE | LEE | DIRECTA | FormsInstancesController.openInstance → FormsInstancesService.openInstance → FormsInstancesService.resourceType | `src/modules/forms/services/forms-instances.service.ts:61` |
| `forms.form_instances` | ESCRIBE | CREA | DIRECTA | FormsInstancesController.openInstance → FormsInstancesService.openInstance → FormInstancesRepository.create | `src/modules/forms/repositories/form-instances.repository.ts:77` |
| `forms.form_instances` | LEE | LEE | DIRECTA | FormsInstancesController.openInstance → FormsInstancesService.openInstance → FormInstancesRepository.findByResourceAndVersion | `src/modules/forms/repositories/form-instances.repository.ts:62` |

### Cuerpo — DTO `OpenInstanceDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `resourceId` | `string` | Sí | formato uuid | `@IsUUID()` | Recurso al que se adjunta el formulario | `src/modules/forms/dto/open-instance.dto.ts:14` |
| `resourceTypeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tipo de recurso (concept id) | `src/modules/forms/dto/open-instance.dto.ts:25` |
| `tenantContextId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Contexto de tenant | `src/modules/forms/dto/open-instance.dto.ts:33` |
| `schemaVersion` | `number` | No | mínimo 1 | `@IsOptional()` `@IsInt()` `@Min(1)` | Versión de schema explícita | `src/modules/forms/dto/open-instance.dto.ts:50` |

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

## 19. GET /forms/instances/{id}

- **Origen:** CONTRATO
- **Nombre:** Leer una instancia con sus valores vigentes, por tipo resuelto
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `FormsInstancesController.getInstance` — `src/modules/forms/controllers/forms-instances.controller.ts:100`

### Qué es y para qué sirve (negocio)

Leer una instancia con sus valores vigentes, por tipo resuelto. Dentro del módulo (descripción del modelo, en inglés): «Lets each organization capture additional, validated information without custom software, adapting to local requirements while keeping data quality and a full change history.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_09_forms.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /forms/instances/{id}` la atiende `FormsInstancesController.getInstance` (src/modules/forms/controllers/forms-instances.controller.ts:100). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Delega en `FormsReadService.getInstance`. Lee authz.access_policies, authz.care_relationships, authz.clinical_access_grants, authz.field_permissions, authz.patient_legal_representations, authz.permissions, authz.resource_scope_grants, authz.role_permissions y 15 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/forms/controllers/forms-instances.controller.ts:100` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/forms/controllers/forms-instances.controller.ts:100` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.access_policies` | LEE | LEE | DIRECTA | FormsInstancesController.getInstance → FormsReadService.getInstance → FormsReadService.loadReadableEncounter → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AccessPoliciesRepository.findActiveForTarget | `src/modules/authz/repositories/access-policies.repository.ts:62` |
| `authz.care_relationships` | LEE | LEE | DIRECTA | FormsInstancesController.getInstance → FormsReadService.getInstance → FormsReadService.loadReadableEncounter → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → ClinicalReadService.hasCareCurrentRelation → CareRelationshipsRepository.findActiveForPractitionerPatient | `src/modules/authz/repositories/care-relationships.repository.ts:100` |
| `authz.clinical_access_grants` | LEE | LEE | DIRECTA | FormsInstancesController.getInstance → FormsReadService.getInstance → FormsReadService.loadReadableEncounter → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ClinicalAccessGrantsRepository.findActiveForUserPatient | `src/modules/authz/repositories/clinical-access-grants.repository.ts:105` |
| `authz.field_permissions` | LEE | LEE | DIRECTA | FormsInstancesController.getInstance → FormsReadService.getInstance → FormsReadService.loadReadableEncounter → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.computeMaskedFields → FieldPermissionsRepository.findForRoles | `src/modules/authz/repositories/field-permissions.repository.ts:61` |
| `authz.patient_legal_representations` | LEE | LEE | DIRECTA | FormsInstancesController.getInstance → FormsReadService.getInstance → FormsReadService.loadReadableEncounter → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PatientLegalRepresentationsRepository.findActiveForRepresentativePatient | `src/modules/authz/repositories/patient-legal-representations.repository.ts:96` |
| `authz.permissions` | LEE | LEE | DIRECTA | FormsInstancesController.getInstance → FormsReadService.getInstance → FormsReadService.loadReadableEncounter → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PermissionsRepository.findByResourceAction | `src/modules/authz/repositories/permissions.repository.ts:89` |
| `authz.resource_scope_grants` | LEE | LEE | DIRECTA | FormsInstancesController.getInstance → FormsReadService.getInstance → FormsReadService.loadReadableEncounter → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ResourceScopeGrantsRepository.findForSubjectResource | `src/modules/authz/repositories/resource-scope-grants.repository.ts:73` |
| `authz.role_permissions` | LEE | LEE | DIRECTA | FormsInstancesController.getInstance → FormsReadService.getInstance → FormsReadService.loadReadableEncounter → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → RolePermissionsRepository.findActiveForRoles | `src/modules/authz/repositories/role-permissions.repository.ts:47` |
| `authz.roles` | LEE | LEE | DIRECTA | FormsInstancesController.getInstance → FormsReadService.getInstance → FormsReadService.loadReadableEncounter → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.resolveRoleInheritance → RolesRepository.findById | `src/modules/authz/repositories/roles.repository.ts:61` |
| `authz.user_permission_grants` | LEE | LEE | DIRECTA | FormsInstancesController.getInstance → FormsReadService.getInstance → FormsReadService.loadReadableEncounter → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserPermissionGrantsRepository.findActiveForUser | `src/modules/authz/repositories/user-permission-grants.repository.ts:85` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | FormsInstancesController.getInstance → FormsReadService.getInstance → FormsReadService.loadReadableEncounter → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserRoleAssignmentsRepository.findActiveForUser | `src/modules/authz/repositories/user-role-assignments.repository.ts:102` |
| `clinical.encounters` | LEE | LEE | DIRECTA | FormsInstancesController.getInstance → FormsReadService.getInstance → FormsReadService.loadReadableEncounter | `src/modules/forms/services/forms-read.service.ts:643` |
| `forms.dynamic_field_definitions` | LEE | LEE | DIRECTA | FormsInstancesController.getInstance → FormsReadService.getInstance → FormsReadService.composeInstanceDetail → FieldDefinitionsRepository.findFieldsByIds | `src/modules/forms/repositories/field-definitions.repository.ts:411` |
| `forms.field_value_access_rules` | LEE | LEE | DIRECTA | FormsInstancesController.getInstance → FormsReadService.getInstance → FormsReadService.composeInstanceDetail → FieldDefinitionsRepository.findActiveAccessRulesByFieldIds | `src/modules/forms/repositories/field-definitions.repository.ts:488` |
| `forms.field_values` | LEE | LEE | DIRECTA | FormsInstancesController.getInstance → FormsReadService.getInstance → FormsReadService.composeInstanceDetail → FieldValuesRepository.findCurrentByInstance | `src/modules/forms/repositories/field-values.repository.ts:295` |
| `forms.form_instances` | LEE | LEE | DIRECTA | FormsInstancesController.getInstance → FormsReadService.getInstance → FormInstancesRepository.findById | `src/modules/forms/repositories/form-instances.repository.ts:45` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | FormsInstancesController.getInstance → FormsReadService.getInstance → FormsReadService.loadReadableEncounter → ClinicalReadService.assertCanReadHistory → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.patient_portal_proxies` | LEE | LEE | DIRECTA | FormsInstancesController.getInstance → FormsReadService.getInstance → FormsReadService.loadReadableEncounter → ClinicalReadService.assertCanReadHistory → ClinicalReadService.assertOwnRecord → PatientRepresentationService.representsPatient → PatientPortalProxiesRepository.findActiveByProxyUserAndPatient | `src/modules/profiles/infrastructure/repositories/patient-portal-proxies.repository.ts:233` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | FormsInstancesController.getInstance → FormsReadService.getInstance → FormsReadService.loadReadableEncounter → ClinicalReadService.assertCanReadHistory → ClinicalReadService.assertOwnRecord → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | FormsInstancesController.getInstance → FormsReadService.getInstance → FormsReadService.loadReadableEncounter → ClinicalReadService.assertCanReadHistory → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | FormsInstancesController.getInstance → FormsReadService.getInstance → FormsReadService.loadReadableEncounter → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:981` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | FormsInstancesController.getInstance → FormsReadService.getInstance → FormsReadService.loadReadableEncounter → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → ClinicalReadService.attendsToday → SchedulingBookingsRepository.findConfirmedWithPatientBetween | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1007` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | FormsInstancesController.getInstance → FormsReadService.getInstance → FormsReadService.loadReadableEncounter → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:981` |

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
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: {WITHOUT_ACCESS_TO_HISTORY} |
| 404 | `NOT_FOUND` | ResourceNotFoundException: {INSTANCE_NOT_FOUND.message}; ResourceNotFoundException: {failure.message} |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/forms.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Forms (09) — Dynamic Forms & Extensibility Governance — etapa `ctrl:FormsInstancesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 20. POST /forms/instances/{id}/close

- **Origen:** CONTRATO
- **Nombre:** Cerrar formulario y proyectar vista de recurso
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `FormsInstancesController.closeInstance` — `src/modules/forms/controllers/forms-instances.controller.ts:150`

### Qué es y para qué sirve (negocio)

Cerrar formulario y proyectar vista de recurso. Caso de uso UC-09-11: Cierra formulario y finaliza valores preliminares. Dentro del módulo (descripción del modelo, en inglés): «Lets each organization capture additional, validated information without custom software, adapting to local requirements while keeping data quality and a full change history.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/forms/README.md:67`) · MODELO (`Mantra Core Health Context/modules/diagram_09_forms.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /forms/instances/{id}/close` la atiende `FormsInstancesController.closeInstance` (src/modules/forms/controllers/forms-instances.controller.ts:150). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Delega en `FormsInstancesService.closeInstance`. Actualiza forms.field_values, forms.form_instances. Lee forms.field_values, forms.form_instances.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/forms/controllers/forms-instances.controller.ts:150` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/forms/controllers/forms-instances.controller.ts:150` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `forms.field_values` | ESCRIBE | ACTUALIZA | POR_TIPO | FormsInstancesController.closeInstance → FormsInstancesService.closeInstance | `src/modules/forms/services/forms-instances.service.ts:151` |
| `forms.field_values` | LEE | LEE | DIRECTA | FormsInstancesController.closeInstance → FormsInstancesService.closeInstance → FieldValuesRepository.findPreliminaryByInstance | `src/modules/forms/repositories/field-values.repository.ts:274` |
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

## 21. POST /forms/instances/{id}/values

- **Origen:** CONTRATO
- **Nombre:** Capturar valores de formulario (value[x] exclusivo)
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `FormsInstancesController.captureValues` — `src/modules/forms/controllers/forms-instances.controller.ts:131`

### Qué es y para qué sirve (negocio)

Capturar valores de formulario (value[x] exclusivo). Caso de uso UC-09-08: Captura valores (value[x] exclusivo). Dentro del módulo (descripción del modelo, en inglés): «Lets each organization capture additional, validated information without custom software, adapting to local requirements while keeping data quality and a full change history.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/forms/README.md:64`) · MODELO (`Mantra Core Health Context/modules/diagram_09_forms.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /forms/instances/{id}/values` la atiende `FormsInstancesController.captureValues` (src/modules/forms/controllers/forms-instances.controller.ts:131). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `CaptureValuesDto` (7 campos, 4 obligatorios). Delega en `FormsValuesService.captureValues`. Crea filas en forms.field_value_audit, forms.field_values. Lee forms.dynamic_field_definitions, forms.form_instances.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/forms/controllers/forms-instances.controller.ts:131` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/forms/controllers/forms-instances.controller.ts:131` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `forms.dynamic_field_definitions` | LEE | LEE | DIRECTA | FormsInstancesController.captureValues → FormsValuesService.captureValues → FormsValuesService.fieldsById → FieldDefinitionsRepository.findFieldsByIds | `src/modules/forms/repositories/field-definitions.repository.ts:411` |
| `forms.field_value_audit` | ESCRIBE | CREA | DIRECTA | FormsInstancesController.captureValues → FormsValuesService.captureValues → FieldValuesRepository.createAudit | `src/modules/forms/repositories/field-values.repository.ts:332` |
| `forms.field_values` | ESCRIBE | CREA | DIRECTA | FormsInstancesController.captureValues → FormsValuesService.captureValues → FieldValuesRepository.create | `src/modules/forms/repositories/field-values.repository.ts:317` |
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
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La instancia no está abierta; PreconditionFailedException: El campo no tiene opciones declaradas; PreconditionFailedException: El valor no está entre las opciones del campo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/forms.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Forms (09) — Dynamic Forms & Extensibility Governance — etapa `UC-09-08`

---

## 22. GET /forms/me/instances

- **Origen:** CONTRATO
- **Nombre:** Ver mis formularios clínicos
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `FormsMeController.listMyInstances` — `src/modules/forms/controllers/forms-me.controller.ts:47`

### Qué es y para qué sirve (negocio)

Ver mis formularios clínicos. Dentro del módulo (descripción del modelo, en inglés): «Lets each organization capture additional, validated information without custom software, adapting to local requirements while keeping data quality and a full change history.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_09_forms.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /forms/me/instances` la atiende `FormsMeController.listMyInstances` (src/modules/forms/controllers/forms-me.controller.ts:47). Exige sesión; el controlador no declara roles. Delega en `FormsReadService.listMyInstances`. Lee clinical.encounters, forms.form_instances.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/forms/controllers/forms-me.controller.ts:47` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.encounters` | LEE | LEE | DIRECTA | FormsMeController.listMyInstances → FormsReadService.listMyInstances | `src/modules/forms/services/forms-read.service.ts:383` |
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

## 23. GET /forms/me/instances/{id}

- **Origen:** CONTRATO
- **Nombre:** Leer un formulario propio con sus respuestas
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `FormsMeController.getMyInstance` — `src/modules/forms/controllers/forms-me.controller.ts:63`

### Qué es y para qué sirve (negocio)

Leer un formulario propio con sus respuestas. Dentro del módulo (descripción del modelo, en inglés): «Lets each organization capture additional, validated information without custom software, adapting to local requirements while keeping data quality and a full change history.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_09_forms.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /forms/me/instances/{id}` la atiende `FormsMeController.getMyInstance` (src/modules/forms/controllers/forms-me.controller.ts:63). Exige sesión; el controlador no declara roles. Delega en `FormsReadService.getMyInstance`. Lee clinical.encounters, forms.dynamic_field_definitions, forms.field_value_access_rules, forms.field_values, forms.form_instances.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/forms/controllers/forms-me.controller.ts:63` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/forms/controllers/forms-me.controller.ts:63` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.encounters` | LEE | LEE | DIRECTA | FormsMeController.getMyInstance → FormsReadService.getMyInstance | `src/modules/forms/services/forms-read.service.ts:430` |
| `forms.dynamic_field_definitions` | LEE | LEE | DIRECTA | FormsMeController.getMyInstance → FormsReadService.getMyInstance → FormsReadService.composeInstanceDetail → FieldDefinitionsRepository.findFieldsByIds | `src/modules/forms/repositories/field-definitions.repository.ts:411` |
| `forms.field_value_access_rules` | LEE | LEE | DIRECTA | FormsMeController.getMyInstance → FormsReadService.getMyInstance → FormsReadService.composeInstanceDetail → FieldDefinitionsRepository.findActiveAccessRulesByFieldIds | `src/modules/forms/repositories/field-definitions.repository.ts:488` |
| `forms.field_values` | LEE | LEE | DIRECTA | FormsMeController.getMyInstance → FormsReadService.getMyInstance → FormsReadService.composeInstanceDetail → FieldValuesRepository.findCurrentByInstance | `src/modules/forms/repositories/field-values.repository.ts:295` |
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

## 24. PATCH /forms/values/{id}

- **Origen:** CONTRATO
- **Nombre:** Corregir valor con supersede y snapshot inmutable
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `FormsValuesController.correctValue` — `src/modules/forms/controllers/forms-values.controller.ts:62`

### Qué es y para qué sirve (negocio)

Corregir valor con supersede y snapshot inmutable. Caso de uso UC-09-09: Corrige valor con supersede y snapshot inmutable. Dentro del módulo (descripción del modelo, en inglés): «Lets each organization capture additional, validated information without custom software, adapting to local requirements while keeping data quality and a full change history.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/forms/README.md:65`) · MODELO (`Mantra Core Health Context/modules/diagram_09_forms.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`PATCH /forms/values/{id}` la atiende `FormsValuesController.correctValue` (src/modules/forms/controllers/forms-values.controller.ts:62). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `CorrectValueDto` (3 campos, 2 obligatorios). Delega en `FormsValuesService.correctValue`. Crea filas en forms.field_value_audit, forms.field_values. Actualiza forms.field_values. Lee forms.dynamic_field_definitions, forms.field_values.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/forms/controllers/forms-values.controller.ts:62` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/forms/controllers/forms-values.controller.ts:62` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `forms.dynamic_field_definitions` | LEE | LEE | DIRECTA | FormsValuesController.correctValue → FormsValuesService.correctValue → FieldDefinitionsRepository.findFieldById | `src/modules/forms/repositories/field-definitions.repository.ts:245` |
| `forms.field_value_audit` | ESCRIBE | CREA | DIRECTA | FormsValuesController.correctValue → FormsValuesService.correctValue → FieldValuesRepository.createAudit | `src/modules/forms/repositories/field-values.repository.ts:332` |
| `forms.field_values` | ESCRIBE | ACTUALIZA | POR_TIPO | FormsValuesController.correctValue → FormsValuesService.correctValue | `src/modules/forms/services/forms-values.service.ts:217` |
| `forms.field_values` | ESCRIBE | CREA | DIRECTA | FormsValuesController.correctValue → FormsValuesService.correctValue → FieldValuesRepository.create | `src/modules/forms/repositories/field-values.repository.ts:317` |
| `forms.field_values` | LEE | LEE | DIRECTA | FormsValuesController.correctValue → FormsValuesService.correctValue → FieldValuesRepository.findById | `src/modules/forms/repositories/field-values.repository.ts:210` |

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
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El valor ya fue superado; PreconditionFailedException: El campo no tiene opciones declaradas; PreconditionFailedException: El valor no está entre las opciones del campo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/forms.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Forms (09) — Dynamic Forms & Extensibility Governance — etapa `UC-09-09`

---

## 25. POST /forms/values/import

- **Origen:** CONTRATO
- **Nombre:** Registrar procedencia de valores importados (batch ETL)
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `FormsValuesController.importValues` — `src/modules/forms/controllers/forms-values.controller.ts:44`

### Qué es y para qué sirve (negocio)

Registrar procedencia de valores importados (batch ETL). Caso de uso UC-09-10: Importa valores externos (batch ETL) con procedencia. Dentro del módulo (descripción del modelo, en inglés): «Lets each organization capture additional, validated information without custom software, adapting to local requirements while keeping data quality and a full change history.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/forms/README.md:66`) · MODELO (`Mantra Core Health Context/modules/diagram_09_forms.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /forms/values/import` la atiende `FormsValuesController.importValues` (src/modules/forms/controllers/forms-values.controller.ts:44). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `ImportValuesDto` (10 campos, 6 obligatorios). Delega en `FormsValuesService.importValues`. Crea filas en forms.field_value_audit, forms.field_value_provenance, forms.field_values. Lee forms.dynamic_field_definitions, forms.form_instances.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/forms/controllers/forms-values.controller.ts:44` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `forms.dynamic_field_definitions` | LEE | LEE | DIRECTA | FormsValuesController.importValues → FormsValuesService.importValues → FormsValuesService.fieldsById → FieldDefinitionsRepository.findFieldsByIds | `src/modules/forms/repositories/field-definitions.repository.ts:411` |
| `forms.field_value_audit` | ESCRIBE | CREA | DIRECTA | FormsValuesController.importValues → FormsValuesService.importValues → FieldValuesRepository.createAudit | `src/modules/forms/repositories/field-values.repository.ts:332` |
| `forms.field_value_provenance` | ESCRIBE | CREA | DIRECTA | FormsValuesController.importValues → FormsValuesService.importValues → FieldValuesRepository.createProvenance | `src/modules/forms/repositories/field-values.repository.ts:351` |
| `forms.field_values` | ESCRIBE | CREA | DIRECTA | FormsValuesController.importValues → FormsValuesService.importValues → FieldValuesRepository.create | `src/modules/forms/repositories/field-values.repository.ts:317` |
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
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El campo no tiene opciones declaradas; PreconditionFailedException: El valor no está entre las opciones del campo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/forms.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Forms (09) — Dynamic Forms & Extensibility Governance — etapa `UC-09-10`

---

