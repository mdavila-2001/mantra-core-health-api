<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `clinical`

Referencia exhaustiva de 24 operación(es) del módulo `clinical`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `clinical-encounters`, `clinical-observations`, `clinical-orders`, `clinical-prescription-policies`, `clinical-read`, `clinical-records`
- **Controladores:** `ClinicalEncountersController`, `ClinicalObservationsController`, `ClinicalOrdersController`, `ClinicalPrescriptionPoliciesController`, `ClinicalReadController`, `ClinicalRecordsController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [POST /clinical/allergy-intolerances](#1-post-clinical-allergy-intolerances) — Registrar una alergia con reacciones
2. [POST /clinical/care-episodes](#2-post-clinical-care-episodes) — Abrir un episodio de cuidado
3. [POST /clinical/conditions](#3-post-clinical-conditions) — Registrar una condición/diagnóstico
4. [POST /clinical/diagnostic-reports](#4-post-clinical-diagnostic-reports) — Emitir un reporte diagnóstico desde la orden
5. [POST /clinical/diagnostic-reports/{id}/release](#5-post-clinical-diagnostic-reports-id-release) — Liberar los resultados de un reporte diagnóstico
6. [POST /clinical/encounters/{id}/close](#6-post-clinical-encounters-id-close) — Cerrar un encuentro en curso (gatilla facturación)
7. [POST /clinical/encounters/check-in](#7-post-clinical-encounters-check-in) — Check-in de un encuentro con participantes y ubicación
8. [POST /clinical/immunizations](#8-post-clinical-immunizations) — Registrar una inmunización
9. [POST /clinical/medication-records](#9-post-clinical-medication-records) — Administrar/registrar medicación
10. [POST /clinical/medication-requests](#10-post-clinical-medication-requests) — Prescribir medicación
11. [POST /clinical/medication-requests/{id}/edit](#11-post-clinical-medication-requests-id-edit) — Editar ítems de una receta en borrador (DRAFT)
12. [POST /clinical/medication-requests/{id}/invalidate](#12-post-clinical-medication-requests-id-invalidate) — Invalidar una receta emitida
13. [POST /clinical/medication-requests/{id}/issue](#13-post-clinical-medication-requests-id-issue) — Emitir una receta (la vuelve inmutable)
14. [POST /clinical/medication-requests/{id}/renew](#14-post-clinical-medication-requests-id-renew) — Renovar una receta (crea una nueva copiando datos)
15. [POST /clinical/medication-requests/{id}/replace](#15-post-clinical-medication-requests-id-replace) — Reemplazar una receta emitida (crea la corrección)
16. [POST /clinical/medication-requests/{id}/sign](#16-post-clinical-medication-requests-id-sign) — Firmar una receta en borrador (DRAFT)
17. [POST /clinical/observations](#17-post-clinical-observations) — Registrar una observación con componentes y ejecutantes
18. [PATCH /clinical/observations/{id}/amend](#18-patch-clinical-observations-id-amend) — Corregir/enmendar una observación (value contract)
19. [GET /clinical/patients/{patientProfileId}/summary](#19-get-clinical-patients-patientprofileid-summary) — UC-39-20: historial clínico del paciente (condiciones, alergias, medicación, observaciones, encuentros)
20. [GET /clinical/prescription-signature-policies](#20-get-clinical-prescription-signature-policies) — Listar las políticas de firma de un tenant
21. [POST /clinical/prescription-signature-policies](#21-post-clinical-prescription-signature-policies) — Crear una política de firma de receta
22. [POST /clinical/prescription-signature-policies/{id}/deactivate](#22-post-clinical-prescription-signature-policies-id-deactivate) — Desactivar una política (cierra vigencia, sin borrado duro)
23. [POST /clinical/procedures](#23-post-clinical-procedures) — Registrar un procedimiento
24. [POST /clinical/service-requests](#24-post-clinical-service-requests) — Crear una orden de servicio

---

## 1. POST /clinical/allergy-intolerances

- **Módulo:** `clinical`
- **Etiqueta OpenAPI:** `clinical-records`
- **Nombre:** Registrar una alergia con reacciones
- **Operation ID:** `ClinicalRecordsController_createAllergy`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ClinicalRecordsController.createAllergy](../../src/modules/clinical/controllers/clinical-records.controller.ts)

### Descripción de negocio

Registrar una alergia con reacciones. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /clinical/allergy-intolerances` en `ClinicalRecordsController_createAllergy`. El controlador delega en `AllergyIntolerancesService.create`. Valida el body como `CreateAllergyIntoleranceDto` y consume `application/json`. El tipo de retorno estático es `Promise<AllergyIntoleranceResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateAllergyIntoleranceDto`; los campos opcionales se omiten.

```http
POST /clinical/allergy-intolerances HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "custodianTenantId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "substanceConceptId": "00000000-0000-4000-8000-000000000001"
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
| `custodianTenantId` | Sí | `string` | formato `uuid` | Tenant custodio (directory.tenants) | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | Sí | `string` | formato `uuid` | Paciente (profiles.patient_profiles) | `00000000-0000-4000-8000-000000000001` |
| `substanceConceptId` | Sí | `string` | formato `uuid` | Sustancia alergénica (concept id) | `00000000-0000-4000-8000-000000000001` |
| `typeConceptId` | No | `string` | formato `uuid` | Tipo (concept id) | `00000000-0000-4000-8000-000000000001` |
| `categoryConceptId` | No | `string` | formato `uuid` | Categoría (concept id) | `00000000-0000-4000-8000-000000000001` |
| `criticalityConceptId` | No | `string` | formato `uuid` | Criticidad (concept id) | `00000000-0000-4000-8000-000000000001` |
| `reactions` | No | `array<AllergyReactionInput>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"manifestationConceptId":"00000000-0000-4000-8000-000000000001","severityConceptId":"00000000-0000-4000-8000-000000000001","description":"Texto descriptivo de ejemplo"}]` |
| `reactions[].manifestationConceptId` | No | `string` | formato `uuid` | Manifestación (concept id) | `00000000-0000-4000-8000-000000000001` |
| `reactions[].severityConceptId` | No | `string` | formato `uuid` | Severidad (concept id) | `00000000-0000-4000-8000-000000000001` |
| `reactions[].description` | No | `string` | Sin restricción adicional declarada | Descripción libre | `Texto descriptivo de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /clinical/allergy-intolerances HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "custodianTenantId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "substanceConceptId": "00000000-0000-4000-8000-000000000001",
  "typeConceptId": "00000000-0000-4000-8000-000000000001",
  "categoryConceptId": "00000000-0000-4000-8000-000000000001",
  "criticalityConceptId": "00000000-0000-4000-8000-000000000001",
  "reactions": [
    {
      "manifestationConceptId": "00000000-0000-4000-8000-000000000001",
      "severityConceptId": "00000000-0000-4000-8000-000000000001",
      "description": "Texto descriptivo de ejemplo"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<AllergyIntoleranceResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<AllergyIntoleranceResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AllergyIntoleranceResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AllergyIntoleranceResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AllergyIntoleranceResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<AllergyIntoleranceResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AllergyIntoleranceResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AllergyIntoleranceResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AllergyIntoleranceResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AllergyIntoleranceResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "clinicalStatus": "00000000-0000-4000-8000-000000000001",
  "reactionIds": [
    "valor-ejemplo"
  ],
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | Sí | `string` | formato `uuid` | Identificador asociado a patient profile. | `00000000-0000-4000-8000-000000000001` |
| `clinicalStatus` | Sí | `string` | formato `uuid`; admite null | Estado clínico (concept id) | `00000000-0000-4000-8000-000000000001` |
| `reactionIds` | Sí | `array<string>` | Sin restricción adicional declarada | Ids de reacciones creadas | `["valor-ejemplo"]` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, PRACTITIONER. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | El paciente ya tiene una alergia activa a esa sustancia | Excepción explícita en src/modules/clinical/services/allergy-intolerances.service.ts |
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
  "path": "/clinical/allergy-intolerances"
}
```

---

## 2. POST /clinical/care-episodes

- **Módulo:** `clinical`
- **Etiqueta OpenAPI:** `clinical-encounters`
- **Nombre:** Abrir un episodio de cuidado
- **Operation ID:** `ClinicalEncountersController_openEpisode`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ClinicalEncountersController.openEpisode](../../src/modules/clinical/controllers/clinical-encounters.controller.ts)

### Descripción de negocio

Abrir un episodio de cuidado. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /clinical/care-episodes` en `ClinicalEncountersController_openEpisode`. El controlador delega en `CareEpisodesService.open`. Valida el body como `CreateCareEpisodeDto` y consume `application/json`. El tipo de retorno estático es `Promise<CareEpisodeResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateCareEpisodeDto`; los campos opcionales se omiten.

```http
POST /clinical/care-episodes HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001"
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
| `patientProfileId` | Sí | `string` | formato `uuid` | Paciente (profiles.patient_profiles) | `00000000-0000-4000-8000-000000000001` |
| `tenantId` | Sí | `string` | formato `uuid` | Tenant custodio (directory.tenants) | `00000000-0000-4000-8000-000000000001` |
| `responsiblePractitionerId` | No | `string` | formato `uuid` | Profesional responsable | `00000000-0000-4000-8000-000000000001` |
| `typeConceptId` | No | `string` | formato `uuid` | Tipo de episodio (concept id) | `00000000-0000-4000-8000-000000000001` |
| `startAt` | No | `string` | formato `date-time` | Inicio del episodio | `2026-07-31T12:00:00.000Z` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /clinical/care-episodes HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "responsiblePractitionerId": "00000000-0000-4000-8000-000000000001",
  "typeConceptId": "00000000-0000-4000-8000-000000000001",
  "startAt": "2026-07-31T12:00:00.000Z"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<CareEpisodeResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CareEpisodeResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CareEpisodeResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CareEpisodeResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CareEpisodeResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CareEpisodeResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CareEpisodeResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CareEpisodeResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CareEpisodeResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CareEpisodeResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001",
  "startAt": "2026-07-31T12:00:00.000Z",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | Sí | `string` | formato `uuid` | Identificador asociado a patient profile. | `00000000-0000-4000-8000-000000000001` |
| `tenantId` | Sí | `string` | formato `uuid` | Identificador asociado a tenant. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Estado del episodio (concept id) | `00000000-0000-4000-8000-000000000001` |
| `startAt` | Sí | `string` | formato `date-time`; admite null | Valor de start at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, PRACTITIONER. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | El paciente ya tiene un episodio activo | Excepción explícita en src/modules/clinical/services/care-episodes.service.ts |
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
  "path": "/clinical/care-episodes"
}
```

---

## 3. POST /clinical/conditions

- **Módulo:** `clinical`
- **Etiqueta OpenAPI:** `clinical-records`
- **Nombre:** Registrar una condición/diagnóstico
- **Operation ID:** `ClinicalRecordsController_createCondition`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ClinicalRecordsController.createCondition](../../src/modules/clinical/controllers/clinical-records.controller.ts)

### Descripción de negocio

Registrar una condición/diagnóstico. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /clinical/conditions` en `ClinicalRecordsController_createCondition`. El controlador delega en `ConditionsService.create`. Valida el body como `CreateConditionDto` y consume `application/json`. El tipo de retorno estático es `Promise<ConditionResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateConditionDto`; los campos opcionales se omiten.

```http
POST /clinical/conditions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "custodianTenantId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "codeConceptId": "00000000-0000-4000-8000-000000000001"
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
| `custodianTenantId` | Sí | `string` | formato `uuid` | Tenant custodio (directory.tenants) | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | Sí | `string` | formato `uuid` | Paciente (profiles.patient_profiles) | `00000000-0000-4000-8000-000000000001` |
| `encounterId` | No | `string` | formato `uuid` | Encuentro en curso | `00000000-0000-4000-8000-000000000001` |
| `codeConceptId` | Sí | `string` | formato `uuid` | Código de la condición/diagnóstico (concept id) | `00000000-0000-4000-8000-000000000001` |
| `categoryConceptId` | No | `string` | formato `uuid` | Categoría (concept id) | `00000000-0000-4000-8000-000000000001` |
| `severityConceptId` | No | `string` | formato `uuid` | Severidad (concept id) | `00000000-0000-4000-8000-000000000001` |
| `lateralityConceptId` | No | `string` | formato `uuid` | Lateralidad (concept id) | `00000000-0000-4000-8000-000000000001` |
| `onsetAt` | No | `string` | formato `date-time` | Inicio de la condición | `2026-07-31T12:00:00.000Z` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /clinical/conditions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "custodianTenantId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "encounterId": "00000000-0000-4000-8000-000000000001",
  "codeConceptId": "00000000-0000-4000-8000-000000000001",
  "categoryConceptId": "00000000-0000-4000-8000-000000000001",
  "severityConceptId": "00000000-0000-4000-8000-000000000001",
  "lateralityConceptId": "00000000-0000-4000-8000-000000000001",
  "onsetAt": "2026-07-31T12:00:00.000Z"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ConditionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ConditionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ConditionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ConditionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ConditionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ConditionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ConditionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ConditionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ConditionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ConditionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "clinicalStatus": "00000000-0000-4000-8000-000000000001",
  "verificationStatus": "00000000-0000-4000-8000-000000000001",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | Sí | `string` | formato `uuid` | Identificador asociado a patient profile. | `00000000-0000-4000-8000-000000000001` |
| `clinicalStatus` | Sí | `string` | formato `uuid`; admite null | Estado clínico (concept id) | `00000000-0000-4000-8000-000000000001` |
| `verificationStatus` | Sí | `string` | formato `uuid`; admite null | Estado de verificación (concept id) | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, PRACTITIONER. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | El paciente ya tiene esa condición activa | Excepción explícita en src/modules/clinical/services/conditions.service.ts |
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
  "path": "/clinical/conditions"
}
```

---

## 4. POST /clinical/diagnostic-reports

- **Módulo:** `clinical`
- **Etiqueta OpenAPI:** `clinical-orders`
- **Nombre:** Emitir un reporte diagnóstico desde la orden
- **Operation ID:** `ClinicalOrdersController_createDiagnosticReport`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ClinicalOrdersController.createDiagnosticReport](../../src/modules/clinical/controllers/clinical-orders.controller.ts)

### Descripción de negocio

Emitir un reporte diagnóstico desde la orden. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /clinical/diagnostic-reports` en `ClinicalOrdersController_createDiagnosticReport`. El controlador delega en `DiagnosticReportsService.create`. Valida el body como `CreateDiagnosticReportDto` y consume `application/json`. El tipo de retorno estático es `Promise<DiagnosticReportResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateDiagnosticReportDto`; los campos opcionales se omiten.

```http
POST /clinical/diagnostic-reports HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "custodianTenantId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "codeConceptId": "00000000-0000-4000-8000-000000000001"
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
| `custodianTenantId` | Sí | `string` | formato `uuid` | Tenant custodio (directory.tenants) | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | Sí | `string` | formato `uuid` | Paciente (profiles.patient_profiles) | `00000000-0000-4000-8000-000000000001` |
| `serviceRequestId` | No | `string` | formato `uuid` | Orden de servicio que origina el reporte | `00000000-0000-4000-8000-000000000001` |
| `encounterId` | No | `string` | formato `uuid` | Encuentro asociado | `00000000-0000-4000-8000-000000000001` |
| `codeConceptId` | Sí | `string` | formato `uuid` | Código del estudio (concept id) | `00000000-0000-4000-8000-000000000001` |
| `categoryConceptId` | No | `string` | formato `uuid` | Categoría (concept id) | `00000000-0000-4000-8000-000000000001` |
| `currentVersionId` | No | `string` | formato `uuid` | Versión actual del reporte | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /clinical/diagnostic-reports HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "custodianTenantId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "serviceRequestId": "00000000-0000-4000-8000-000000000001",
  "encounterId": "00000000-0000-4000-8000-000000000001",
  "codeConceptId": "00000000-0000-4000-8000-000000000001",
  "categoryConceptId": "00000000-0000-4000-8000-000000000001",
  "currentVersionId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<DiagnosticReportResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<DiagnosticReportResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<DiagnosticReportResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<DiagnosticReportResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<DiagnosticReportResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<DiagnosticReportResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<DiagnosticReportResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<DiagnosticReportResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<DiagnosticReportResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DiagnosticReportResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "lifecycleStatus": "00000000-0000-4000-8000-000000000001",
  "resultReleaseStatus": "00000000-0000-4000-8000-000000000001",
  "serviceRequestId": "00000000-0000-4000-8000-000000000001",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | Sí | `string` | formato `uuid` | Identificador asociado a patient profile. | `00000000-0000-4000-8000-000000000001` |
| `lifecycleStatus` | Sí | `string` | formato `uuid` | Estado de ciclo de vida (concept id) | `00000000-0000-4000-8000-000000000001` |
| `resultReleaseStatus` | Sí | `string` | formato `uuid`; admite null | Estado de liberación de resultados (concept id) | `00000000-0000-4000-8000-000000000001` |
| `serviceRequestId` | No | `string` | formato `uuid`; admite null | Identificador asociado a service request. | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, PRACTITIONER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Orden de servicio no encontrada | Excepción explícita en src/modules/clinical/services/diagnostic-reports.service.ts |
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
  "path": "/clinical/diagnostic-reports"
}
```

---

## 5. POST /clinical/diagnostic-reports/{id}/release

- **Módulo:** `clinical`
- **Etiqueta OpenAPI:** `clinical-orders`
- **Nombre:** Liberar los resultados de un reporte diagnóstico
- **Operation ID:** `ClinicalOrdersController_releaseDiagnosticReport`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ClinicalOrdersController.releaseDiagnosticReport](../../src/modules/clinical/controllers/clinical-orders.controller.ts)

### Descripción de negocio

Liberar los resultados de un reporte diagnóstico. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /clinical/diagnostic-reports/{id}/release` en `ClinicalOrdersController_releaseDiagnosticReport`. El controlador delega en `DiagnosticReportsService.release`. Valida el body como `ReleaseDiagnosticReportDto` y consume `application/json`. El tipo de retorno estático es `Promise<DiagnosticReportResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ReleaseDiagnosticReportDto`; los campos opcionales se omiten.

```http
POST /clinical/diagnostic-reports/00000000-0000-4000-8000-000000000001/release HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
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
| `expectedRowVersion` | No | `number` | mínimo 1 | row_version esperado (bloqueo optimista) | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /clinical/diagnostic-reports/00000000-0000-4000-8000-000000000001/release HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "expectedRowVersion": 1
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<DiagnosticReportResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<DiagnosticReportResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<DiagnosticReportResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<DiagnosticReportResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<DiagnosticReportResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<DiagnosticReportResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<DiagnosticReportResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<DiagnosticReportResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<DiagnosticReportResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<DiagnosticReportResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DiagnosticReportResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "lifecycleStatus": "00000000-0000-4000-8000-000000000001",
  "resultReleaseStatus": "00000000-0000-4000-8000-000000000001",
  "serviceRequestId": "00000000-0000-4000-8000-000000000001",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | Sí | `string` | formato `uuid` | Identificador asociado a patient profile. | `00000000-0000-4000-8000-000000000001` |
| `lifecycleStatus` | Sí | `string` | formato `uuid` | Estado de ciclo de vida (concept id) | `00000000-0000-4000-8000-000000000001` |
| `resultReleaseStatus` | Sí | `string` | formato `uuid`; admite null | Estado de liberación de resultados (concept id) | `00000000-0000-4000-8000-000000000001` |
| `serviceRequestId` | No | `string` | formato `uuid`; admite null | Identificador asociado a service request. | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, PRACTITIONER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Reporte diagnóstico no encontrado | Excepción explícita en src/modules/clinical/services/diagnostic-reports.service.ts |
| 409 | `CONCURRENCY_CONFLICT` | Versión del reporte desactualizada | Excepción explícita en src/modules/clinical/services/diagnostic-reports.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El reporte no está en estado liberable | Excepción explícita en src/modules/clinical/services/diagnostic-reports.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/clinical/diagnostic-reports/{id}/release"
}
```

---

## 6. POST /clinical/encounters/{id}/close

- **Módulo:** `clinical`
- **Etiqueta OpenAPI:** `clinical-encounters`
- **Nombre:** Cerrar un encuentro en curso (gatilla facturación)
- **Operation ID:** `ClinicalEncountersController_close`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ClinicalEncountersController.close](../../src/modules/clinical/controllers/clinical-encounters.controller.ts)

### Descripción de negocio

Cerrar un encuentro en curso (gatilla facturación). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /clinical/encounters/{id}/close` en `ClinicalEncountersController_close`. El controlador delega en `EncountersService.close`. Valida el body como `CloseEncounterDto` y consume `application/json`. El tipo de retorno estático es `Promise<EncounterResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CloseEncounterDto`; los campos opcionales se omiten.

```http
POST /clinical/encounters/00000000-0000-4000-8000-000000000001/close HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
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
| `expectedRowVersion` | No | `number` | mínimo 1 | row_version esperado (bloqueo optimista) | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /clinical/encounters/00000000-0000-4000-8000-000000000001/close HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "expectedRowVersion": 1
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<EncounterResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<EncounterResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<EncounterResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<EncounterResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<EncounterResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<EncounterResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<EncounterResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<EncounterResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<EncounterResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<EncounterResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `EncounterResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "episodeId": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001",
  "participantIds": [
    "valor-ejemplo"
  ],
  "locationIds": [
    "valor-ejemplo"
  ],
  "startAt": "2026-07-31T12:00:00.000Z",
  "endAt": "2026-07-31T12:00:00.000Z",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | Sí | `string` | formato `uuid` | Identificador asociado a patient profile. | `00000000-0000-4000-8000-000000000001` |
| `episodeId` | No | `string` | formato `uuid`; admite null | Identificador asociado a episode. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Estado del encuentro (concept id) | `00000000-0000-4000-8000-000000000001` |
| `participantIds` | Sí | `array<string>` | Sin restricción adicional declarada | Ids de participantes creados | `["valor-ejemplo"]` |
| `locationIds` | Sí | `array<string>` | Sin restricción adicional declarada | Ids de ubicaciones creadas | `["valor-ejemplo"]` |
| `startAt` | Sí | `string` | formato `date-time`; admite null | Valor de start at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `endAt` | Sí | `string` | formato `date-time`; admite null | Valor de end at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, PRACTITIONER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Encuentro no encontrado | Excepción explícita en src/modules/clinical/services/encounters.service.ts |
| 409 | `CONCURRENCY_CONFLICT` | Versión del encuentro desactualizada | Excepción explícita en src/modules/clinical/services/encounters.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El encuentro no está en curso | Excepción explícita en src/modules/clinical/services/encounters.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/clinical/encounters/{id}/close"
}
```

---

## 7. POST /clinical/encounters/check-in

- **Módulo:** `clinical`
- **Etiqueta OpenAPI:** `clinical-encounters`
- **Nombre:** Check-in de un encuentro con participantes y ubicación
- **Operation ID:** `ClinicalEncountersController_checkIn`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ClinicalEncountersController.checkIn](../../src/modules/clinical/controllers/clinical-encounters.controller.ts)

### Descripción de negocio

Check-in de un encuentro con participantes y ubicación. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /clinical/encounters/check-in` en `ClinicalEncountersController_checkIn`. El controlador delega en `EncountersService.checkIn`. Valida el body como `CheckInEncounterDto` y consume `application/json`. El tipo de retorno estático es `Promise<EncounterResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CheckInEncounterDto`; los campos opcionales se omiten.

```http
POST /clinical/encounters/check-in HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001"
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
| `patientProfileId` | Sí | `string` | formato `uuid` | Paciente (profiles.patient_profiles) | `00000000-0000-4000-8000-000000000001` |
| `tenantId` | Sí | `string` | formato `uuid` | Tenant custodio (directory.tenants) | `00000000-0000-4000-8000-000000000001` |
| `episodeId` | No | `string` | formato `uuid` | Episodio de cuidado asociado | `00000000-0000-4000-8000-000000000001` |
| `branchId` | No | `string` | formato `uuid` | Sucursal (directory.branches) | `00000000-0000-4000-8000-000000000001` |
| `primaryPractitionerId` | No | `string` | formato `uuid` | Profesional principal | `00000000-0000-4000-8000-000000000001` |
| `appointmentId` | No | `string` | formato `uuid` | Cita que origina el check-in | `00000000-0000-4000-8000-000000000001` |
| `classConceptId` | No | `string` | formato `uuid` | Clase del encuentro (concept id) | `00000000-0000-4000-8000-000000000001` |
| `typeConceptId` | No | `string` | formato `uuid` | Tipo del encuentro (concept id) | `00000000-0000-4000-8000-000000000001` |
| `reasonText` | No | `string` | Sin restricción adicional declarada | Motivo de consulta | `Texto descriptivo de ejemplo` |
| `participants` | No | `array<EncounterParticipantInput>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"practitionerProfileId":"00000000-0000-4000-8000-000000000001","roleConceptId":"00000000-0000-4000-8000-000000000001","isResponsible":true}]` |
| `participants[].practitionerProfileId` | No | `string` | formato `uuid` | Profesional participante | `00000000-0000-4000-8000-000000000001` |
| `participants[].roleConceptId` | No | `string` | formato `uuid` | Rol del participante (concept id) | `00000000-0000-4000-8000-000000000001` |
| `participants[].isResponsible` | No | `boolean` | Sin restricción adicional declarada | Marca al participante como responsable | `true` |
| `location` | No | `EncounterLocationInput` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"practiceSiteId":"00000000-0000-4000-8000-000000000001","clinicalUnitId":"00000000-0000-4000-8000-000000000001","careSpaceId":"00000000-0000-4000-8000-000000000001"}` |
| `location.practiceSiteId` | No | `string` | formato `uuid` | Sede de práctica (practice.practice_sites) | `00000000-0000-4000-8000-000000000001` |
| `location.clinicalUnitId` | No | `string` | formato `uuid` | Unidad clínica | `00000000-0000-4000-8000-000000000001` |
| `location.careSpaceId` | No | `string` | formato `uuid` | Espacio de atención (cama/consultorio) | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /clinical/encounters/check-in HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "episodeId": "00000000-0000-4000-8000-000000000001",
  "branchId": "00000000-0000-4000-8000-000000000001",
  "primaryPractitionerId": "00000000-0000-4000-8000-000000000001",
  "appointmentId": "00000000-0000-4000-8000-000000000001",
  "classConceptId": "00000000-0000-4000-8000-000000000001",
  "typeConceptId": "00000000-0000-4000-8000-000000000001",
  "reasonText": "Texto descriptivo de ejemplo",
  "participants": [
    {
      "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
      "roleConceptId": "00000000-0000-4000-8000-000000000001",
      "isResponsible": true
    }
  ],
  "location": {
    "practiceSiteId": "00000000-0000-4000-8000-000000000001",
    "clinicalUnitId": "00000000-0000-4000-8000-000000000001",
    "careSpaceId": "00000000-0000-4000-8000-000000000001"
  }
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<EncounterResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<EncounterResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<EncounterResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<EncounterResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<EncounterResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<EncounterResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<EncounterResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<EncounterResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<EncounterResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `EncounterResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "episodeId": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001",
  "participantIds": [
    "valor-ejemplo"
  ],
  "locationIds": [
    "valor-ejemplo"
  ],
  "startAt": "2026-07-31T12:00:00.000Z",
  "endAt": "2026-07-31T12:00:00.000Z",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | Sí | `string` | formato `uuid` | Identificador asociado a patient profile. | `00000000-0000-4000-8000-000000000001` |
| `episodeId` | No | `string` | formato `uuid`; admite null | Identificador asociado a episode. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Estado del encuentro (concept id) | `00000000-0000-4000-8000-000000000001` |
| `participantIds` | Sí | `array<string>` | Sin restricción adicional declarada | Ids de participantes creados | `["valor-ejemplo"]` |
| `locationIds` | Sí | `array<string>` | Sin restricción adicional declarada | Ids de ubicaciones creadas | `["valor-ejemplo"]` |
| `startAt` | Sí | `string` | formato `date-time`; admite null | Valor de start at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `endAt` | Sí | `string` | formato `date-time`; admite null | Valor de end at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, PRACTITIONER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Episodio de cuidado no encontrado | Excepción explícita en src/modules/clinical/services/encounters.service.ts |
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
  "path": "/clinical/encounters/check-in"
}
```

---

## 8. POST /clinical/immunizations

- **Módulo:** `clinical`
- **Etiqueta OpenAPI:** `clinical-records`
- **Nombre:** Registrar una inmunización
- **Operation ID:** `ClinicalRecordsController_createImmunization`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ClinicalRecordsController.createImmunization](../../src/modules/clinical/controllers/clinical-records.controller.ts)

### Descripción de negocio

Registrar una inmunización. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /clinical/immunizations` en `ClinicalRecordsController_createImmunization`. El controlador delega en `ImmunizationsService.create`. Valida el body como `CreateImmunizationDto` y consume `application/json`. El tipo de retorno estático es `Promise<ImmunizationResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateImmunizationDto`; los campos opcionales se omiten.

```http
POST /clinical/immunizations HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "custodianTenantId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "vaccineConceptId": "00000000-0000-4000-8000-000000000001"
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
| `custodianTenantId` | Sí | `string` | formato `uuid` | Tenant custodio (directory.tenants) | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | Sí | `string` | formato `uuid` | Paciente (profiles.patient_profiles) | `00000000-0000-4000-8000-000000000001` |
| `vaccineConceptId` | Sí | `string` | formato `uuid` | Vacuna (concept id) | `00000000-0000-4000-8000-000000000001` |
| `doseNumber` | No | `number` | mínimo 1 | Número de dosis | `1` |
| `lotNumber` | No | `string` | Sin restricción adicional declarada | Número de lote | `valor-ejemplo` |
| `routeConceptId` | No | `string` | formato `uuid` | Vía de administración (concept id) | `00000000-0000-4000-8000-000000000001` |
| `administeredAt` | No | `string` | formato `date-time` | Momento de administración | `2026-07-31T12:00:00.000Z` |
| `administeredByProfileId` | No | `string` | formato `uuid` | Profesional que administra | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /clinical/immunizations HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "custodianTenantId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "vaccineConceptId": "00000000-0000-4000-8000-000000000001",
  "doseNumber": 1,
  "lotNumber": "valor-ejemplo",
  "routeConceptId": "00000000-0000-4000-8000-000000000001",
  "administeredAt": "2026-07-31T12:00:00.000Z",
  "administeredByProfileId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ImmunizationResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ImmunizationResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ImmunizationResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ImmunizationResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ImmunizationResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ImmunizationResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ImmunizationResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ImmunizationResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ImmunizationResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ImmunizationResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001",
  "doseNumber": 1,
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | Sí | `string` | formato `uuid` | Identificador asociado a patient profile. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Estado (concept id) | `00000000-0000-4000-8000-000000000001` |
| `doseNumber` | No | `number` | admite null | Valor de dose number mantenido por la instancia. | `1` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, PRACTITIONER. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Esa dosis de la vacuna ya fue registrada | Excepción explícita en src/modules/clinical/services/immunizations.service.ts |
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
  "path": "/clinical/immunizations"
}
```

---

## 9. POST /clinical/medication-records

- **Módulo:** `clinical`
- **Etiqueta OpenAPI:** `clinical-records`
- **Nombre:** Administrar/registrar medicación
- **Operation ID:** `ClinicalRecordsController_administerMedication`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ClinicalRecordsController.administerMedication](../../src/modules/clinical/controllers/clinical-records.controller.ts)

### Descripción de negocio

Administrar/registrar medicación. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /clinical/medication-records` en `ClinicalRecordsController_administerMedication`. El controlador delega en `MedicationsService.administer`. Valida el body como `CreateMedicationRecordDto` y consume `application/json`. El tipo de retorno estático es `Promise<MedicationRecordResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateMedicationRecordDto`; los campos opcionales se omiten.

```http
POST /clinical/medication-records HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "custodianTenantId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "medicationConceptId": "00000000-0000-4000-8000-000000000001"
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
| `custodianTenantId` | Sí | `string` | formato `uuid` | Tenant custodio (directory.tenants) | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | Sí | `string` | formato `uuid` | Paciente (profiles.patient_profiles) | `00000000-0000-4000-8000-000000000001` |
| `requestId` | No | `string` | formato `uuid` | Prescripción que se administra | `00000000-0000-4000-8000-000000000001` |
| `medicationConceptId` | Sí | `string` | formato `uuid` | Medicamento (concept id) | `00000000-0000-4000-8000-000000000001` |
| `doseDecimal` | No | `number` | Sin restricción adicional declarada | Dosis administrada | `1` |
| `unitConceptId` | No | `string` | formato `uuid` | Unidad (concept id) | `00000000-0000-4000-8000-000000000001` |
| `administeredAt` | No | `string` | formato `date-time` | Momento de administración | `2026-07-31T12:00:00.000Z` |
| `isFinalDose` | No | `boolean` | Sin restricción adicional declarada | Marca la dosis final: cierra la prescripción | `true` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /clinical/medication-records HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "custodianTenantId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "requestId": "00000000-0000-4000-8000-000000000001",
  "medicationConceptId": "00000000-0000-4000-8000-000000000001",
  "doseDecimal": 1,
  "unitConceptId": "00000000-0000-4000-8000-000000000001",
  "administeredAt": "2026-07-31T12:00:00.000Z",
  "isFinalDose": true
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<MedicationRecordResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<MedicationRecordResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<MedicationRecordResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<MedicationRecordResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<MedicationRecordResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<MedicationRecordResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<MedicationRecordResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<MedicationRecordResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<MedicationRecordResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `MedicationRecordResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001",
  "requestId": "00000000-0000-4000-8000-000000000001",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | Sí | `string` | formato `uuid` | Identificador asociado a patient profile. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Estado (concept id) | `00000000-0000-4000-8000-000000000001` |
| `requestId` | No | `string` | formato `uuid`; admite null | Identificador asociado a request. | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, PRACTITIONER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Prescripción no encontrada | Excepción explícita en src/modules/clinical/services/medications.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La prescripción no está emitida (ISSUED) | Excepción explícita en src/modules/clinical/services/medications.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/clinical/medication-records"
}
```

---

## 10. POST /clinical/medication-requests

- **Módulo:** `clinical`
- **Etiqueta OpenAPI:** `clinical-records`
- **Nombre:** Prescribir medicación
- **Operation ID:** `ClinicalRecordsController_prescribeMedication`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ClinicalRecordsController.prescribeMedication](../../src/modules/clinical/controllers/clinical-records.controller.ts)

### Descripción de negocio

Prescribir medicación. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /clinical/medication-requests` en `ClinicalRecordsController_prescribeMedication`. El controlador delega en `MedicationsService.prescribe`. Valida el body como `CreateMedicationRequestDto` y consume `application/json`. El tipo de retorno estático es `Promise<MedicationRequestResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateMedicationRequestDto`; los campos opcionales se omiten.

```http
POST /clinical/medication-requests HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "custodianTenantId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "medicationConceptId": "00000000-0000-4000-8000-000000000001"
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
| `custodianTenantId` | Sí | `string` | formato `uuid` | Tenant custodio (directory.tenants) | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | Sí | `string` | formato `uuid` | Paciente (profiles.patient_profiles) | `00000000-0000-4000-8000-000000000001` |
| `encounterId` | No | `string` | formato `uuid` | Encuentro en curso | `00000000-0000-4000-8000-000000000001` |
| `medicationConceptId` | Sí | `string` | formato `uuid` | Medicamento (concept id) | `00000000-0000-4000-8000-000000000001` |
| `substanceAtcConceptId` | No | `string` | formato `uuid` | Sustancia ATC (concept id) | `00000000-0000-4000-8000-000000000001` |
| `prescriberProfileId` | No | `string` | formato `uuid` | Profesional prescriptor | `00000000-0000-4000-8000-000000000001` |
| `doseText` | No | `string` | Sin restricción adicional declarada | Dosis en texto libre | `valor-ejemplo` |
| `routeConceptId` | No | `string` | formato `uuid` | Vía de administración (concept id) | `00000000-0000-4000-8000-000000000001` |
| `frequencyText` | No | `string` | Sin restricción adicional declarada | Frecuencia en texto libre | `valor-ejemplo` |
| `quantityDecimal` | No | `number` | Sin restricción adicional declarada | Cantidad prescrita | `1` |
| `unitConceptId` | No | `string` | formato `uuid` | Unidad (concept id) | `00000000-0000-4000-8000-000000000001` |
| `validFrom` | No | `string` | formato `date-time` | Inicio de vigencia | `2026-07-31T12:00:00.000Z` |
| `validTo` | No | `string` | formato `date-time` | Fin de vigencia | `2026-07-31T12:00:00.000Z` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /clinical/medication-requests HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "custodianTenantId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "encounterId": "00000000-0000-4000-8000-000000000001",
  "medicationConceptId": "00000000-0000-4000-8000-000000000001",
  "substanceAtcConceptId": "00000000-0000-4000-8000-000000000001",
  "prescriberProfileId": "00000000-0000-4000-8000-000000000001",
  "doseText": "valor-ejemplo",
  "routeConceptId": "00000000-0000-4000-8000-000000000001",
  "frequencyText": "valor-ejemplo",
  "quantityDecimal": 1,
  "unitConceptId": "00000000-0000-4000-8000-000000000001",
  "validFrom": "2026-07-31T12:00:00.000Z",
  "validTo": "2026-07-31T12:00:00.000Z"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<MedicationRequestResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<MedicationRequestResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<MedicationRequestResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<MedicationRequestResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<MedicationRequestResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<MedicationRequestResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<MedicationRequestResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<MedicationRequestResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<MedicationRequestResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `MedicationRequestResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001",
  "replacesRequestId": "00000000-0000-4000-8000-000000000001",
  "replacedByRequestId": "00000000-0000-4000-8000-000000000001",
  "renewedFromRequestId": "00000000-0000-4000-8000-000000000001",
  "signedAt": "2026-07-31T12:00:00.000Z",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | Sí | `string` | formato `uuid` | Identificador asociado a patient profile. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Estado (concept id) | `00000000-0000-4000-8000-000000000001` |
| `replacesRequestId` | No | `string` | formato `uuid`; admite null | Receta a la que esta sustituye | `00000000-0000-4000-8000-000000000001` |
| `replacedByRequestId` | No | `string` | formato `uuid`; admite null | Receta que sustituye a esta | `00000000-0000-4000-8000-000000000001` |
| `renewedFromRequestId` | No | `string` | formato `uuid`; admite null | Receta de la que esta es renovación | `00000000-0000-4000-8000-000000000001` |
| `signedAt` | No | `string` | formato `date-time`; admite null | Instante de firma de la receta (nulo = sin firmar) | `2026-07-31T12:00:00.000Z` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, PRACTITIONER. | Roles/tenant/guards de autorización |
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
  "path": "/clinical/medication-requests"
}
```

---

## 11. POST /clinical/medication-requests/{id}/edit

- **Módulo:** `clinical`
- **Etiqueta OpenAPI:** `clinical-records`
- **Nombre:** Editar ítems de una receta en borrador (DRAFT)
- **Operation ID:** `ClinicalRecordsController_editMedicationDraft`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ClinicalRecordsController.editMedicationDraft](../../src/modules/clinical/controllers/clinical-records.controller.ts)

### Descripción de negocio

Editar ítems de una receta en borrador (DRAFT). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: CAN-RX: edita ítems clínicos de un borrador (solo DRAFT; comando, no PATCH genérico).

### Descripción del sistema

NestJS resuelve `POST /clinical/medication-requests/{id}/edit` en `ClinicalRecordsController_editMedicationDraft`. El controlador delega en `MedicationsService.editDraft`. Valida el body como `EditMedicationRequestDraftDto` y consume `application/json`. El tipo de retorno estático es `Promise<MedicationRequestResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `EditMedicationRequestDraftDto`; los campos opcionales se omiten.

```http
POST /clinical/medication-requests/00000000-0000-4000-8000-000000000001/edit HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
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
| `encounterId` | No | `string` | formato `uuid` | Encuentro en curso | `00000000-0000-4000-8000-000000000001` |
| `medicationConceptId` | No | `string` | formato `uuid` | Medicamento (concept id) | `00000000-0000-4000-8000-000000000001` |
| `substanceAtcConceptId` | No | `string` | formato `uuid` | Sustancia ATC (concept id) | `00000000-0000-4000-8000-000000000001` |
| `prescriberProfileId` | No | `string` | formato `uuid` | Profesional prescriptor | `00000000-0000-4000-8000-000000000001` |
| `doseText` | No | `string` | Sin restricción adicional declarada | Dosis en texto libre | `valor-ejemplo` |
| `routeConceptId` | No | `string` | formato `uuid` | Vía de administración (concept id) | `00000000-0000-4000-8000-000000000001` |
| `frequencyText` | No | `string` | Sin restricción adicional declarada | Frecuencia en texto libre | `valor-ejemplo` |
| `quantityDecimal` | No | `number` | Sin restricción adicional declarada | Cantidad prescrita | `1` |
| `unitConceptId` | No | `string` | formato `uuid` | Unidad (concept id) | `00000000-0000-4000-8000-000000000001` |
| `validFrom` | No | `string` | formato `date-time` | Inicio de vigencia | `2026-07-31T12:00:00.000Z` |
| `validTo` | No | `string` | formato `date-time` | Fin de vigencia | `2026-07-31T12:00:00.000Z` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /clinical/medication-requests/00000000-0000-4000-8000-000000000001/edit HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "encounterId": "00000000-0000-4000-8000-000000000001",
  "medicationConceptId": "00000000-0000-4000-8000-000000000001",
  "substanceAtcConceptId": "00000000-0000-4000-8000-000000000001",
  "prescriberProfileId": "00000000-0000-4000-8000-000000000001",
  "doseText": "valor-ejemplo",
  "routeConceptId": "00000000-0000-4000-8000-000000000001",
  "frequencyText": "valor-ejemplo",
  "quantityDecimal": 1,
  "unitConceptId": "00000000-0000-4000-8000-000000000001",
  "validFrom": "2026-07-31T12:00:00.000Z",
  "validTo": "2026-07-31T12:00:00.000Z"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<MedicationRequestResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<MedicationRequestResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<MedicationRequestResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<MedicationRequestResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<MedicationRequestResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<MedicationRequestResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<MedicationRequestResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<MedicationRequestResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<MedicationRequestResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<MedicationRequestResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `MedicationRequestResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001",
  "replacesRequestId": "00000000-0000-4000-8000-000000000001",
  "replacedByRequestId": "00000000-0000-4000-8000-000000000001",
  "renewedFromRequestId": "00000000-0000-4000-8000-000000000001",
  "signedAt": "2026-07-31T12:00:00.000Z",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | Sí | `string` | formato `uuid` | Identificador asociado a patient profile. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Estado (concept id) | `00000000-0000-4000-8000-000000000001` |
| `replacesRequestId` | No | `string` | formato `uuid`; admite null | Receta a la que esta sustituye | `00000000-0000-4000-8000-000000000001` |
| `replacedByRequestId` | No | `string` | formato `uuid`; admite null | Receta que sustituye a esta | `00000000-0000-4000-8000-000000000001` |
| `renewedFromRequestId` | No | `string` | formato `uuid`; admite null | Receta de la que esta es renovación | `00000000-0000-4000-8000-000000000001` |
| `signedAt` | No | `string` | formato `date-time`; admite null | Instante de firma de la receta (nulo = sin firmar) | `2026-07-31T12:00:00.000Z` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, PRACTITIONER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Receta no encontrada | Excepción explícita en src/modules/clinical/services/medications.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Solo un borrador (DRAFT) admite edición; una receta emitida es inmutable | Excepción explícita en src/modules/clinical/services/medications.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/clinical/medication-requests/{id}/edit"
}
```

---

## 12. POST /clinical/medication-requests/{id}/invalidate

- **Módulo:** `clinical`
- **Etiqueta OpenAPI:** `clinical-records`
- **Nombre:** Invalidar una receta emitida
- **Operation ID:** `ClinicalRecordsController_invalidateMedicationRequest`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ClinicalRecordsController.invalidateMedicationRequest](../../src/modules/clinical/controllers/clinical-records.controller.ts)

### Descripción de negocio

Invalidar una receta emitida. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: CAN-RX: invalida una receta emitida (motivo obligatorio; se conserva).

### Descripción del sistema

NestJS resuelve `POST /clinical/medication-requests/{id}/invalidate` en `ClinicalRecordsController_invalidateMedicationRequest`. El controlador delega en `MedicationsService.invalidate`. Valida el body como `InvalidateMedicationRequestDto` y consume `application/json`. El tipo de retorno estático es `Promise<MedicationRequestResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `InvalidateMedicationRequestDto`; los campos opcionales se omiten.

```http
POST /clinical/medication-requests/00000000-0000-4000-8000-000000000001/invalidate HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "reasonText": "Texto descriptivo de ejemplo"
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
| `reasonText` | Sí | `string` | Sin restricción adicional declarada | Motivo de la invalidación (obligatorio) | `Texto descriptivo de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /clinical/medication-requests/00000000-0000-4000-8000-000000000001/invalidate HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "reasonText": "Texto descriptivo de ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<MedicationRequestResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<MedicationRequestResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<MedicationRequestResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<MedicationRequestResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<MedicationRequestResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<MedicationRequestResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<MedicationRequestResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<MedicationRequestResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<MedicationRequestResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<MedicationRequestResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `MedicationRequestResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001",
  "replacesRequestId": "00000000-0000-4000-8000-000000000001",
  "replacedByRequestId": "00000000-0000-4000-8000-000000000001",
  "renewedFromRequestId": "00000000-0000-4000-8000-000000000001",
  "signedAt": "2026-07-31T12:00:00.000Z",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | Sí | `string` | formato `uuid` | Identificador asociado a patient profile. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Estado (concept id) | `00000000-0000-4000-8000-000000000001` |
| `replacesRequestId` | No | `string` | formato `uuid`; admite null | Receta a la que esta sustituye | `00000000-0000-4000-8000-000000000001` |
| `replacedByRequestId` | No | `string` | formato `uuid`; admite null | Receta que sustituye a esta | `00000000-0000-4000-8000-000000000001` |
| `renewedFromRequestId` | No | `string` | formato `uuid`; admite null | Receta de la que esta es renovación | `00000000-0000-4000-8000-000000000001` |
| `signedAt` | No | `string` | formato `date-time`; admite null | Instante de firma de la receta (nulo = sin firmar) | `2026-07-31T12:00:00.000Z` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, PRACTITIONER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Receta no encontrada | Excepción explícita en src/modules/clinical/services/medications.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Solo una receta emitida (ISSUED) puede invalidarse | Excepción explícita en src/modules/clinical/services/medications.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/clinical/medication-requests/{id}/invalidate"
}
```

---

## 13. POST /clinical/medication-requests/{id}/issue

- **Módulo:** `clinical`
- **Etiqueta OpenAPI:** `clinical-records`
- **Nombre:** Emitir una receta (la vuelve inmutable)
- **Operation ID:** `ClinicalRecordsController_issueMedicationRequest`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ClinicalRecordsController.issueMedicationRequest](../../src/modules/clinical/controllers/clinical-records.controller.ts)

### Descripción de negocio

Emitir una receta (la vuelve inmutable). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: CAN-RX: emite la receta (DRAFT → ISSUED) y sella su contenido.

### Descripción del sistema

NestJS resuelve `POST /clinical/medication-requests/{id}/issue` en `ClinicalRecordsController_issueMedicationRequest`. El controlador delega en `MedicationsService.issue`. No recibe body. El tipo de retorno estático es `Promise<MedicationRequestResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `idempotency-key` | header | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /clinical/medication-requests/00000000-0000-4000-8000-000000000001/issue HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
idempotency-key: valor-ejemplo
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
POST /clinical/medication-requests/00000000-0000-4000-8000-000000000001/issue HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
idempotency-key: valor-ejemplo
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<MedicationRequestResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<MedicationRequestResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<MedicationRequestResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<MedicationRequestResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<MedicationRequestResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<MedicationRequestResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<MedicationRequestResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<MedicationRequestResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<MedicationRequestResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `MedicationRequestResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001",
  "replacesRequestId": "00000000-0000-4000-8000-000000000001",
  "replacedByRequestId": "00000000-0000-4000-8000-000000000001",
  "renewedFromRequestId": "00000000-0000-4000-8000-000000000001",
  "signedAt": "2026-07-31T12:00:00.000Z",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | Sí | `string` | formato `uuid` | Identificador asociado a patient profile. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Estado (concept id) | `00000000-0000-4000-8000-000000000001` |
| `replacesRequestId` | No | `string` | formato `uuid`; admite null | Receta a la que esta sustituye | `00000000-0000-4000-8000-000000000001` |
| `replacedByRequestId` | No | `string` | formato `uuid`; admite null | Receta que sustituye a esta | `00000000-0000-4000-8000-000000000001` |
| `renewedFromRequestId` | No | `string` | formato `uuid`; admite null | Receta de la que esta es renovación | `00000000-0000-4000-8000-000000000001` |
| `signedAt` | No | `string` | formato `date-time`; admite null | Instante de firma de la receta (nulo = sin firmar) | `2026-07-31T12:00:00.000Z` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, PRACTITIONER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Receta no encontrada | Excepción explícita en src/modules/clinical/services/medications.service.ts |
| 409 | `CONFLICT` | La clave de idempotencia ya fue usada para emitir otra receta | Excepción explícita en src/modules/clinical/services/medications.service.ts |
| 422 | `PRECONDITION_FAILED` | Solo un borrador (DRAFT) puede emitirse | Excepción explícita en src/modules/clinical/services/medications.service.ts |
| 422 | `PRECONDITION_FAILED` | La política vigente exige firmar la receta antes de emitirla | Excepción explícita en src/modules/clinical/services/medications.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/clinical/medication-requests/{id}/issue"
}
```

---

## 14. POST /clinical/medication-requests/{id}/renew

- **Módulo:** `clinical`
- **Etiqueta OpenAPI:** `clinical-records`
- **Nombre:** Renovar una receta (crea una nueva copiando datos)
- **Operation ID:** `ClinicalRecordsController_renewMedicationRequest`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ClinicalRecordsController.renewMedicationRequest](../../src/modules/clinical/controllers/clinical-records.controller.ts)

### Descripción de negocio

Renovar una receta (crea una nueva copiando datos). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: CAN-RX: renueva una receta copiando datos y devuelve la nueva (DRAFT).

### Descripción del sistema

NestJS resuelve `POST /clinical/medication-requests/{id}/renew` en `ClinicalRecordsController_renewMedicationRequest`. El controlador delega en `MedicationsService.renew`. Valida el body como `RenewMedicationRequestDto` y consume `application/json`. El tipo de retorno estático es `Promise<MedicationRequestResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RenewMedicationRequestDto`; los campos opcionales se omiten.

```http
POST /clinical/medication-requests/00000000-0000-4000-8000-000000000001/renew HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
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
| `doseText` | No | `string` | Sin restricción adicional declarada | Dosis en texto libre | `valor-ejemplo` |
| `frequencyText` | No | `string` | Sin restricción adicional declarada | Frecuencia en texto libre | `valor-ejemplo` |
| `quantityDecimal` | No | `number` | Sin restricción adicional declarada | Cantidad prescrita | `1` |
| `validFrom` | No | `string` | formato `date-time` | Inicio de vigencia | `2026-07-31T12:00:00.000Z` |
| `validTo` | No | `string` | formato `date-time` | Fin de vigencia | `2026-07-31T12:00:00.000Z` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /clinical/medication-requests/00000000-0000-4000-8000-000000000001/renew HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "doseText": "valor-ejemplo",
  "frequencyText": "valor-ejemplo",
  "quantityDecimal": 1,
  "validFrom": "2026-07-31T12:00:00.000Z",
  "validTo": "2026-07-31T12:00:00.000Z"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<MedicationRequestResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<MedicationRequestResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<MedicationRequestResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<MedicationRequestResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<MedicationRequestResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<MedicationRequestResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<MedicationRequestResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<MedicationRequestResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<MedicationRequestResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<MedicationRequestResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `MedicationRequestResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001",
  "replacesRequestId": "00000000-0000-4000-8000-000000000001",
  "replacedByRequestId": "00000000-0000-4000-8000-000000000001",
  "renewedFromRequestId": "00000000-0000-4000-8000-000000000001",
  "signedAt": "2026-07-31T12:00:00.000Z",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | Sí | `string` | formato `uuid` | Identificador asociado a patient profile. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Estado (concept id) | `00000000-0000-4000-8000-000000000001` |
| `replacesRequestId` | No | `string` | formato `uuid`; admite null | Receta a la que esta sustituye | `00000000-0000-4000-8000-000000000001` |
| `replacedByRequestId` | No | `string` | formato `uuid`; admite null | Receta que sustituye a esta | `00000000-0000-4000-8000-000000000001` |
| `renewedFromRequestId` | No | `string` | formato `uuid`; admite null | Receta de la que esta es renovación | `00000000-0000-4000-8000-000000000001` |
| `signedAt` | No | `string` | formato `date-time`; admite null | Instante de firma de la receta (nulo = sin firmar) | `2026-07-31T12:00:00.000Z` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, PRACTITIONER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Receta no encontrada | Excepción explícita en src/modules/clinical/services/medications.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Solo una receta emitida o completada puede renovarse | Excepción explícita en src/modules/clinical/services/medications.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/clinical/medication-requests/{id}/renew"
}
```

---

## 15. POST /clinical/medication-requests/{id}/replace

- **Módulo:** `clinical`
- **Etiqueta OpenAPI:** `clinical-records`
- **Nombre:** Reemplazar una receta emitida (crea la corrección)
- **Operation ID:** `ClinicalRecordsController_replaceMedicationRequest`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ClinicalRecordsController.replaceMedicationRequest](../../src/modules/clinical/controllers/clinical-records.controller.ts)

### Descripción de negocio

Reemplazar una receta emitida (crea la corrección). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: CAN-RX: reemplaza una receta emitida y devuelve la nueva (DRAFT).

### Descripción del sistema

NestJS resuelve `POST /clinical/medication-requests/{id}/replace` en `ClinicalRecordsController_replaceMedicationRequest`. El controlador delega en `MedicationsService.replace`. Valida el body como `ReplaceMedicationRequestDto` y consume `application/json`. El tipo de retorno estático es `Promise<MedicationRequestResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ReplaceMedicationRequestDto`; los campos opcionales se omiten.

```http
POST /clinical/medication-requests/00000000-0000-4000-8000-000000000001/replace HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "reasonText": "Texto descriptivo de ejemplo"
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
| `reasonText` | Sí | `string` | Sin restricción adicional declarada | Motivo de la corrección/reemplazo (obligatorio) | `Texto descriptivo de ejemplo` |
| `medicationConceptId` | No | `string` | formato `uuid` | Medicamento (concept id) | `00000000-0000-4000-8000-000000000001` |
| `substanceAtcConceptId` | No | `string` | formato `uuid` | Sustancia ATC (concept id) | `00000000-0000-4000-8000-000000000001` |
| `doseText` | No | `string` | Sin restricción adicional declarada | Dosis en texto libre | `valor-ejemplo` |
| `routeConceptId` | No | `string` | formato `uuid` | Vía de administración (concept id) | `00000000-0000-4000-8000-000000000001` |
| `frequencyText` | No | `string` | Sin restricción adicional declarada | Frecuencia en texto libre | `valor-ejemplo` |
| `quantityDecimal` | No | `number` | Sin restricción adicional declarada | Cantidad prescrita | `1` |
| `unitConceptId` | No | `string` | formato `uuid` | Unidad (concept id) | `00000000-0000-4000-8000-000000000001` |
| `validFrom` | No | `string` | formato `date-time` | Inicio de vigencia | `2026-07-31T12:00:00.000Z` |
| `validTo` | No | `string` | formato `date-time` | Fin de vigencia | `2026-07-31T12:00:00.000Z` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /clinical/medication-requests/00000000-0000-4000-8000-000000000001/replace HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "reasonText": "Texto descriptivo de ejemplo",
  "medicationConceptId": "00000000-0000-4000-8000-000000000001",
  "substanceAtcConceptId": "00000000-0000-4000-8000-000000000001",
  "doseText": "valor-ejemplo",
  "routeConceptId": "00000000-0000-4000-8000-000000000001",
  "frequencyText": "valor-ejemplo",
  "quantityDecimal": 1,
  "unitConceptId": "00000000-0000-4000-8000-000000000001",
  "validFrom": "2026-07-31T12:00:00.000Z",
  "validTo": "2026-07-31T12:00:00.000Z"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<MedicationRequestResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<MedicationRequestResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<MedicationRequestResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<MedicationRequestResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<MedicationRequestResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<MedicationRequestResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<MedicationRequestResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<MedicationRequestResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<MedicationRequestResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<MedicationRequestResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `MedicationRequestResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001",
  "replacesRequestId": "00000000-0000-4000-8000-000000000001",
  "replacedByRequestId": "00000000-0000-4000-8000-000000000001",
  "renewedFromRequestId": "00000000-0000-4000-8000-000000000001",
  "signedAt": "2026-07-31T12:00:00.000Z",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | Sí | `string` | formato `uuid` | Identificador asociado a patient profile. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Estado (concept id) | `00000000-0000-4000-8000-000000000001` |
| `replacesRequestId` | No | `string` | formato `uuid`; admite null | Receta a la que esta sustituye | `00000000-0000-4000-8000-000000000001` |
| `replacedByRequestId` | No | `string` | formato `uuid`; admite null | Receta que sustituye a esta | `00000000-0000-4000-8000-000000000001` |
| `renewedFromRequestId` | No | `string` | formato `uuid`; admite null | Receta de la que esta es renovación | `00000000-0000-4000-8000-000000000001` |
| `signedAt` | No | `string` | formato `date-time`; admite null | Instante de firma de la receta (nulo = sin firmar) | `2026-07-31T12:00:00.000Z` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, PRACTITIONER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Receta no encontrada | Excepción explícita en src/modules/clinical/services/medications.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Solo una receta emitida (ISSUED) puede reemplazarse | Excepción explícita en src/modules/clinical/services/medications.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/clinical/medication-requests/{id}/replace"
}
```

---

## 16. POST /clinical/medication-requests/{id}/sign

- **Módulo:** `clinical`
- **Etiqueta OpenAPI:** `clinical-records`
- **Nombre:** Firmar una receta en borrador (DRAFT)
- **Operation ID:** `ClinicalRecordsController_signMedicationRequest`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ClinicalRecordsController.signMedicationRequest](../../src/modules/clinical/controllers/clinical-records.controller.ts)

### Descripción de negocio

Firmar una receta en borrador (DRAFT). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: REDESA D-05: firma la receta en borrador (aditivo; habilita emitir bajo política).

### Descripción del sistema

NestJS resuelve `POST /clinical/medication-requests/{id}/sign` en `ClinicalRecordsController_signMedicationRequest`. El controlador delega en `MedicationsService.sign`. No recibe body. El tipo de retorno estático es `Promise<MedicationRequestResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /clinical/medication-requests/00000000-0000-4000-8000-000000000001/sign HTTP/1.1
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
POST /clinical/medication-requests/00000000-0000-4000-8000-000000000001/sign HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<MedicationRequestResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<MedicationRequestResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<MedicationRequestResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<MedicationRequestResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<MedicationRequestResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<MedicationRequestResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<MedicationRequestResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<MedicationRequestResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<MedicationRequestResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `MedicationRequestResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001",
  "replacesRequestId": "00000000-0000-4000-8000-000000000001",
  "replacedByRequestId": "00000000-0000-4000-8000-000000000001",
  "renewedFromRequestId": "00000000-0000-4000-8000-000000000001",
  "signedAt": "2026-07-31T12:00:00.000Z",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | Sí | `string` | formato `uuid` | Identificador asociado a patient profile. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Estado (concept id) | `00000000-0000-4000-8000-000000000001` |
| `replacesRequestId` | No | `string` | formato `uuid`; admite null | Receta a la que esta sustituye | `00000000-0000-4000-8000-000000000001` |
| `replacedByRequestId` | No | `string` | formato `uuid`; admite null | Receta que sustituye a esta | `00000000-0000-4000-8000-000000000001` |
| `renewedFromRequestId` | No | `string` | formato `uuid`; admite null | Receta de la que esta es renovación | `00000000-0000-4000-8000-000000000001` |
| `signedAt` | No | `string` | formato `date-time`; admite null | Instante de firma de la receta (nulo = sin firmar) | `2026-07-31T12:00:00.000Z` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, PRACTITIONER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Receta no encontrada | Excepción explícita en src/modules/clinical/services/medications.service.ts |
| 422 | `PRECONDITION_FAILED` | Solo un borrador (DRAFT) puede firmarse antes de emitirse | Excepción explícita en src/modules/clinical/services/medications.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/clinical/medication-requests/{id}/sign"
}
```

---

## 17. POST /clinical/observations

- **Módulo:** `clinical`
- **Etiqueta OpenAPI:** `clinical-observations`
- **Nombre:** Registrar una observación con componentes y ejecutantes
- **Operation ID:** `ClinicalObservationsController_record`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ClinicalObservationsController.record](../../src/modules/clinical/controllers/clinical-observations.controller.ts)

### Descripción de negocio

Registrar una observación con componentes y ejecutantes. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /clinical/observations` en `ClinicalObservationsController_record`. El controlador delega en `ObservationsService.record`. Valida el body como `CreateObservationDto` y consume `application/json`. El tipo de retorno estático es `Promise<ObservationResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateObservationDto`; los campos opcionales se omiten.

```http
POST /clinical/observations HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "custodianTenantId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "codeConceptId": "00000000-0000-4000-8000-000000000001"
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
| `valueTypeConceptId` | No | `string` | formato `uuid` | Tipo de valor (concept id) | `00000000-0000-4000-8000-000000000001` |
| `valueDecimal` | No | `number` | Sin restricción adicional declarada | Valor decimal | `1` |
| `valueBoolean` | No | `boolean` | Sin restricción adicional declarada | Valor booleano | `true` |
| `valueText` | No | `string` | Sin restricción adicional declarada | Valor de texto | `valor-ejemplo` |
| `valueConceptId` | No | `string` | formato `uuid` | Valor codificado (concept id) | `00000000-0000-4000-8000-000000000001` |
| `quantityValue` | No | `number` | Sin restricción adicional declarada | Magnitud de la cantidad | `1` |
| `quantityUnitConceptId` | No | `string` | formato `uuid` | Unidad de la cantidad (concept id) | `00000000-0000-4000-8000-000000000001` |
| `custodianTenantId` | Sí | `string` | formato `uuid` | Tenant custodio (directory.tenants) | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | Sí | `string` | formato `uuid` | Paciente (profiles.patient_profiles) | `00000000-0000-4000-8000-000000000001` |
| `encounterId` | No | `string` | formato `uuid` | Encuentro en curso | `00000000-0000-4000-8000-000000000001` |
| `basedOnServiceRequestId` | No | `string` | formato `uuid` | Orden de servicio que la origina | `00000000-0000-4000-8000-000000000001` |
| `codeConceptId` | Sí | `string` | formato `uuid` | Código de la observación (concept id) | `00000000-0000-4000-8000-000000000001` |
| `categoryConceptId` | No | `string` | formato `uuid` | Categoría (concept id) | `00000000-0000-4000-8000-000000000001` |
| `interpretationConceptId` | No | `string` | formato `uuid` | Interpretación (concept id) | `00000000-0000-4000-8000-000000000001` |
| `methodConceptId` | No | `string` | formato `uuid` | Método (concept id) | `00000000-0000-4000-8000-000000000001` |
| `bodySiteConceptId` | No | `string` | formato `uuid` | Sitio anatómico (concept id) | `00000000-0000-4000-8000-000000000001` |
| `sourceDeviceId` | No | `string` | formato `uuid` | Dispositivo de origen | `00000000-0000-4000-8000-000000000001` |
| `effectiveStartAt` | No | `string` | formato `date-time` | Inicio de vigencia clínica | `2026-07-31T12:00:00.000Z` |
| `issuedAt` | No | `string` | formato `date-time` | Momento de emisión | `2026-07-31T12:00:00.000Z` |
| `components` | No | `array<ObservationComponentInput>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"valueTypeConceptId":"00000000-0000-4000-8000-000000000001","valueDecimal":1,"valueBoolean":true,"valueText":"valor-ejemplo","valueConceptId":"00000000-0000-4000-8000-000000000001","quantityValue":1,"quantityUnitConceptId":"00000000-0000-4000-8000-000000000001","codeConceptId":"00000000-0000-4000-8000-000000000001","interpretationConceptId":"00000000-0000-4000-8000-000000000001"}]` |
| `components[].valueTypeConceptId` | No | `string` | formato `uuid` | Tipo de valor (concept id) | `00000000-0000-4000-8000-000000000001` |
| `components[].valueDecimal` | No | `number` | Sin restricción adicional declarada | Valor decimal | `1` |
| `components[].valueBoolean` | No | `boolean` | Sin restricción adicional declarada | Valor booleano | `true` |
| `components[].valueText` | No | `string` | Sin restricción adicional declarada | Valor de texto | `valor-ejemplo` |
| `components[].valueConceptId` | No | `string` | formato `uuid` | Valor codificado (concept id) | `00000000-0000-4000-8000-000000000001` |
| `components[].quantityValue` | No | `number` | Sin restricción adicional declarada | Magnitud de la cantidad | `1` |
| `components[].quantityUnitConceptId` | No | `string` | formato `uuid` | Unidad de la cantidad (concept id) | `00000000-0000-4000-8000-000000000001` |
| `components[].codeConceptId` | No | `string` | formato `uuid` | Código del componente (concept id) | `00000000-0000-4000-8000-000000000001` |
| `components[].interpretationConceptId` | No | `string` | formato `uuid` | Interpretación (concept id) | `00000000-0000-4000-8000-000000000001` |
| `performers` | No | `array<ObservationPerformerInput>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"performerTypeConceptId":"00000000-0000-4000-8000-000000000001","performerId":"00000000-0000-4000-8000-000000000001","performerRoleConceptId":"00000000-0000-4000-8000-000000000001"}]` |
| `performers[].performerTypeConceptId` | No | `string` | formato `uuid` | Tipo de ejecutante (concept id) | `00000000-0000-4000-8000-000000000001` |
| `performers[].performerId` | No | `string` | formato `uuid` | Id del ejecutante (profesional/dispositivo) | `00000000-0000-4000-8000-000000000001` |
| `performers[].performerRoleConceptId` | No | `string` | formato `uuid` | Rol del ejecutante (concept id) | `00000000-0000-4000-8000-000000000001` |
| `referenceRanges` | No | `array<ObservationReferenceRangeInput>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"lowValue":1,"highValue":1,"unitConceptId":"00000000-0000-4000-8000-000000000001","text":"valor-ejemplo"}]` |
| `referenceRanges[].lowValue` | No | `number` | Sin restricción adicional declarada | Límite inferior | `1` |
| `referenceRanges[].highValue` | No | `number` | Sin restricción adicional declarada | Límite superior | `1` |
| `referenceRanges[].unitConceptId` | No | `string` | formato `uuid` | Unidad (concept id) | `00000000-0000-4000-8000-000000000001` |
| `referenceRanges[].text` | No | `string` | Sin restricción adicional declarada | Texto libre del rango | `valor-ejemplo` |
| `notes` | No | `array<string>` | Sin restricción adicional declarada | Notas de la observación | `["Texto descriptivo de ejemplo"]` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /clinical/observations HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "valueTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "valueDecimal": 1,
  "valueBoolean": true,
  "valueText": "valor-ejemplo",
  "valueConceptId": "00000000-0000-4000-8000-000000000001",
  "quantityValue": 1,
  "quantityUnitConceptId": "00000000-0000-4000-8000-000000000001",
  "custodianTenantId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "encounterId": "00000000-0000-4000-8000-000000000001",
  "basedOnServiceRequestId": "00000000-0000-4000-8000-000000000001",
  "codeConceptId": "00000000-0000-4000-8000-000000000001",
  "categoryConceptId": "00000000-0000-4000-8000-000000000001",
  "interpretationConceptId": "00000000-0000-4000-8000-000000000001",
  "methodConceptId": "00000000-0000-4000-8000-000000000001",
  "bodySiteConceptId": "00000000-0000-4000-8000-000000000001",
  "sourceDeviceId": "00000000-0000-4000-8000-000000000001",
  "effectiveStartAt": "2026-07-31T12:00:00.000Z",
  "issuedAt": "2026-07-31T12:00:00.000Z",
  "components": [
    {
      "valueTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "valueDecimal": 1,
      "valueBoolean": true,
      "valueText": "valor-ejemplo",
      "valueConceptId": "00000000-0000-4000-8000-000000000001",
      "quantityValue": 1,
      "quantityUnitConceptId": "00000000-0000-4000-8000-000000000001",
      "codeConceptId": "00000000-0000-4000-8000-000000000001",
      "interpretationConceptId": "00000000-0000-4000-8000-000000000001"
    }
  ],
  "performers": [
    {
      "performerTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "performerId": "00000000-0000-4000-8000-000000000001",
      "performerRoleConceptId": "00000000-0000-4000-8000-000000000001"
    }
  ],
  "referenceRanges": [
    {
      "lowValue": 1,
      "highValue": 1,
      "unitConceptId": "00000000-0000-4000-8000-000000000001",
      "text": "valor-ejemplo"
    }
  ],
  "notes": [
    "Texto descriptivo de ejemplo"
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ObservationResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ObservationResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ObservationResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ObservationResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ObservationResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ObservationResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ObservationResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ObservationResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ObservationResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ObservationResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "duplicate": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `duplicate` | Sí | `boolean` | Sin restricción adicional declarada | true si ya se había recogido el mismo contenido en la corrida | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, PRACTITIONER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Encuentro no encontrado | Excepción explícita en src/modules/clinical/services/observations.service.ts |
| 404 | `NOT_FOUND` | Orden de servicio no encontrada | Excepción explícita en src/modules/clinical/services/observations.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La observación requiere un valor (cantidad, decimal, texto, booleano o concepto) | Excepción explícita en src/modules/clinical/services/observations.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/clinical/observations"
}
```

---

## 18. PATCH /clinical/observations/{id}/amend

- **Módulo:** `clinical`
- **Etiqueta OpenAPI:** `clinical-observations`
- **Nombre:** Corregir/enmendar una observación (value contract)
- **Operation ID:** `ClinicalObservationsController_amend`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ClinicalObservationsController.amend](../../src/modules/clinical/controllers/clinical-observations.controller.ts)

### Descripción de negocio

Corregir/enmendar una observación (value contract). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `PATCH /clinical/observations/{id}/amend` en `ClinicalObservationsController_amend`. El controlador delega en `ObservationsService.amend`. Valida el body como `AmendObservationDto` y consume `application/json`. El tipo de retorno estático es `Promise<ObservationResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `AmendObservationDto`; los campos opcionales se omiten.

```http
PATCH /clinical/observations/00000000-0000-4000-8000-000000000001/amend HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "note": "valor-ejemplo"
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
| `valueTypeConceptId` | No | `string` | formato `uuid` | Tipo de valor (concept id) | `00000000-0000-4000-8000-000000000001` |
| `valueDecimal` | No | `number` | Sin restricción adicional declarada | Valor decimal | `1` |
| `valueBoolean` | No | `boolean` | Sin restricción adicional declarada | Valor booleano | `true` |
| `valueText` | No | `string` | Sin restricción adicional declarada | Valor de texto | `valor-ejemplo` |
| `valueConceptId` | No | `string` | formato `uuid` | Valor codificado (concept id) | `00000000-0000-4000-8000-000000000001` |
| `quantityValue` | No | `number` | Sin restricción adicional declarada | Magnitud de la cantidad | `1` |
| `quantityUnitConceptId` | No | `string` | formato `uuid` | Unidad de la cantidad (concept id) | `00000000-0000-4000-8000-000000000001` |
| `note` | Sí | `string` | Sin restricción adicional declarada | Nota que justifica la enmienda | `valor-ejemplo` |
| `expectedRowVersion` | No | `number` | mínimo 1 | row_version esperado (bloqueo optimista) | `1` |
| `interpretationConceptId` | No | `string` | formato `uuid` | Interpretación revisada (concept id) | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PATCH /clinical/observations/00000000-0000-4000-8000-000000000001/amend HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "valueTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "valueDecimal": 1,
  "valueBoolean": true,
  "valueText": "valor-ejemplo",
  "valueConceptId": "00000000-0000-4000-8000-000000000001",
  "quantityValue": 1,
  "quantityUnitConceptId": "00000000-0000-4000-8000-000000000001",
  "note": "valor-ejemplo",
  "expectedRowVersion": 1,
  "interpretationConceptId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ObservationResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ObservationResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ObservationResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ObservationResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ObservationResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ObservationResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ObservationResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ObservationResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ObservationResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ObservationResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ObservationResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "duplicate": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `duplicate` | Sí | `boolean` | Sin restricción adicional declarada | true si ya se había recogido el mismo contenido en la corrida | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, PRACTITIONER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Observación no encontrada | Excepción explícita en src/modules/clinical/services/observations.service.ts |
| 409 | `CONCURRENCY_CONFLICT` | Versión de la observación desactualizada | Excepción explícita en src/modules/clinical/services/observations.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La observación no admite enmienda en su estado | Excepción explícita en src/modules/clinical/services/observations.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/clinical/observations/{id}/amend"
}
```

---

## 19. GET /clinical/patients/{patientProfileId}/summary

- **Módulo:** `clinical`
- **Etiqueta OpenAPI:** `clinical-read`
- **Nombre:** UC-39-20: historial clínico del paciente (condiciones, alergias, medicación, observaciones, encuentros)
- **Operation ID:** `ClinicalReadController_getPatientSummary`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ClinicalReadController.getPatientSummary](../../src/modules/clinical/controllers/clinical-read.controller.ts)

### Descripción de negocio

UC-39-20: historial clínico del paciente (condiciones, alergias, medicación, observaciones, encuentros). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-39-20: historial clínico del paciente en una sola llamada.

### Descripción del sistema

NestJS resuelve `GET /clinical/patients/{patientProfileId}/summary` en `ClinicalReadController_getPatientSummary`. El controlador delega en `ClinicalReadService.getPatientSummary`. No recibe body. El tipo de retorno estático es `Promise<PatientClinicalSummaryResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `patientProfileId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `limit` | query | No | `number` | Sin restricción adicional declarada | Tope aplicado a cada bloque (por defecto 50) | `1` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /clinical/patients/00000000-0000-4000-8000-000000000001/summary HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CLINICIAN`, `PRACTITIONER`.
- Deben ser UUID válidos: `patientProfileId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /clinical/patients/00000000-0000-4000-8000-000000000001/summary?limit=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PatientClinicalSummaryResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<PatientClinicalSummaryResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<PatientClinicalSummaryResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<PatientClinicalSummaryResponseDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<PatientClinicalSummaryResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<PatientClinicalSummaryResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<PatientClinicalSummaryResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PatientClinicalSummaryResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "conditions": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "codeConceptId": "00000000-0000-4000-8000-000000000001",
      "categoryConceptId": "00000000-0000-4000-8000-000000000001",
      "clinicalStatusConceptId": "00000000-0000-4000-8000-000000000001",
      "verificationStatusConceptId": "00000000-0000-4000-8000-000000000001",
      "severityConceptId": "00000000-0000-4000-8000-000000000001",
      "encounterId": "00000000-0000-4000-8000-000000000001",
      "onsetAt": "2026-07-31T12:00:00.000Z",
      "resolvedAt": "2026-07-31T12:00:00.000Z",
      "createdAt": "2026-07-31T12:00:00.000Z"
    }
  ],
  "allergies": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "substanceConceptId": "00000000-0000-4000-8000-000000000001",
      "typeConceptId": "00000000-0000-4000-8000-000000000001",
      "categoryConceptId": "00000000-0000-4000-8000-000000000001",
      "criticalityConceptId": "00000000-0000-4000-8000-000000000001",
      "clinicalStatusConceptId": "00000000-0000-4000-8000-000000000001",
      "createdAt": "2026-07-31T12:00:00.000Z"
    }
  ],
  "medicationRequests": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "medicationConceptId": "00000000-0000-4000-8000-000000000001",
      "statusConceptId": "00000000-0000-4000-8000-000000000001",
      "prescriberProfileId": "00000000-0000-4000-8000-000000000001",
      "doseText": "valor-ejemplo",
      "frequencyText": "valor-ejemplo",
      "validFrom": "2026-07-31T12:00:00.000Z",
      "validTo": "2026-07-31T12:00:00.000Z",
      "signedAt": "2026-07-31T12:00:00.000Z",
      "issuedAt": "2026-07-31T12:00:00.000Z",
      "createdAt": "2026-07-31T12:00:00.000Z"
    }
  ],
  "observations": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "codeConceptId": "00000000-0000-4000-8000-000000000001",
      "statusConceptId": "00000000-0000-4000-8000-000000000001",
      "interpretationConceptId": "00000000-0000-4000-8000-000000000001",
      "valueDecimal": "valor-ejemplo",
      "valueText": "valor-ejemplo",
      "valueBoolean": true,
      "valueConceptId": "00000000-0000-4000-8000-000000000001",
      "quantityValue": "valor-ejemplo",
      "quantityUnitConceptId": "00000000-0000-4000-8000-000000000001",
      "effectiveStartAt": "2026-07-31T12:00:00.000Z",
      "encounterId": "00000000-0000-4000-8000-000000000001"
    }
  ],
  "encounters": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "episodeId": "00000000-0000-4000-8000-000000000001",
      "statusConceptId": "00000000-0000-4000-8000-000000000001",
      "classConceptId": "00000000-0000-4000-8000-000000000001",
      "primaryPractitionerId": "00000000-0000-4000-8000-000000000001",
      "reasonText": "Texto descriptivo de ejemplo",
      "startAt": "2026-07-31T12:00:00.000Z",
      "endAt": "2026-07-31T12:00:00.000Z"
    }
  ],
  "limit": 1,
  "truncated": [
    "valor-ejemplo"
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `patientProfileId` | Sí | `string` | formato `uuid` | Identificador asociado a patient profile. | `00000000-0000-4000-8000-000000000001` |
| `conditions` | Sí | `array<ConditionItemDto>` | Sin restricción adicional declarada | Valor de conditions mantenido por la instancia. | `[{"id":"00000000-0000-4000-8000-000000000001","codeConceptId":"00000000-0000-4000-8000-000000000001","categoryConceptId":"00000000-0000-4000-8000-000000000001","clinicalStatusConceptId":"00000000-0000-4000-8000-000000000001","verificationStatusConceptId":"00000000-0000-4000-8000-000000000001","severityConceptId":"00000000-0000-4000-8000-000000000001","encounterId":"00000000-0000-4000-8000-000000000001","onsetAt":"2026-07-31T12:00:00.000Z","resolvedAt":"2026-07-31T12:00:00.000Z","createdAt":"2026-07-31T12:00:00.000Z"}]` |
| `conditions[].id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `conditions[].codeConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a code concept. | `00000000-0000-4000-8000-000000000001` |
| `conditions[].categoryConceptId` | No | `string` | formato `uuid` | Identificador asociado a category concept. | `00000000-0000-4000-8000-000000000001` |
| `conditions[].clinicalStatusConceptId` | No | `string` | formato `uuid` | Identificador asociado a clinical status concept. | `00000000-0000-4000-8000-000000000001` |
| `conditions[].verificationStatusConceptId` | No | `string` | formato `uuid` | Identificador asociado a verification status concept. | `00000000-0000-4000-8000-000000000001` |
| `conditions[].severityConceptId` | No | `string` | formato `uuid` | Identificador asociado a severity concept. | `00000000-0000-4000-8000-000000000001` |
| `conditions[].encounterId` | No | `string` | formato `uuid` | Identificador asociado a encounter. | `00000000-0000-4000-8000-000000000001` |
| `conditions[].onsetAt` | No | `string` | formato `date-time` | Valor de onset at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `conditions[].resolvedAt` | No | `string` | formato `date-time` | Valor de resolved at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `conditions[].createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |
| `allergies` | Sí | `array<AllergyItemDto>` | Sin restricción adicional declarada | Valor de allergies mantenido por la instancia. | `[{"id":"00000000-0000-4000-8000-000000000001","substanceConceptId":"00000000-0000-4000-8000-000000000001","typeConceptId":"00000000-0000-4000-8000-000000000001","categoryConceptId":"00000000-0000-4000-8000-000000000001","criticalityConceptId":"00000000-0000-4000-8000-000000000001","clinicalStatusConceptId":"00000000-0000-4000-8000-000000000001","createdAt":"2026-07-31T12:00:00.000Z"}]` |
| `allergies[].id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `allergies[].substanceConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a substance concept. | `00000000-0000-4000-8000-000000000001` |
| `allergies[].typeConceptId` | No | `string` | formato `uuid` | Identificador asociado a type concept. | `00000000-0000-4000-8000-000000000001` |
| `allergies[].categoryConceptId` | No | `string` | formato `uuid` | Identificador asociado a category concept. | `00000000-0000-4000-8000-000000000001` |
| `allergies[].criticalityConceptId` | No | `string` | formato `uuid` | Identificador asociado a criticality concept. | `00000000-0000-4000-8000-000000000001` |
| `allergies[].clinicalStatusConceptId` | No | `string` | formato `uuid` | Identificador asociado a clinical status concept. | `00000000-0000-4000-8000-000000000001` |
| `allergies[].createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |
| `medicationRequests` | Sí | `array<MedicationRequestItemDto>` | Sin restricción adicional declarada | Valor de medication requests mantenido por la instancia. | `[{"id":"00000000-0000-4000-8000-000000000001","medicationConceptId":"00000000-0000-4000-8000-000000000001","statusConceptId":"00000000-0000-4000-8000-000000000001","prescriberProfileId":"00000000-0000-4000-8000-000000000001","doseText":"valor-ejemplo","frequencyText":"valor-ejemplo","validFrom":"2026-07-31T12:00:00.000Z","validTo":"2026-07-31T12:00:00.000Z","signedAt":"2026-07-31T12:00:00.000Z","issuedAt":"2026-07-31T12:00:00.000Z","createdAt":"2026-07-31T12:00:00.000Z"}]` |
| `medicationRequests[].id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `medicationRequests[].medicationConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a medication concept. | `00000000-0000-4000-8000-000000000001` |
| `medicationRequests[].statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `medicationRequests[].prescriberProfileId` | No | `string` | formato `uuid` | Identificador asociado a prescriber profile. | `00000000-0000-4000-8000-000000000001` |
| `medicationRequests[].doseText` | No | `string` | Sin restricción adicional declarada | Valor de dose text mantenido por la instancia. | `valor-ejemplo` |
| `medicationRequests[].frequencyText` | No | `string` | Sin restricción adicional declarada | Valor de frequency text mantenido por la instancia. | `valor-ejemplo` |
| `medicationRequests[].validFrom` | No | `string` | formato `date-time` | Valor de valid from mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `medicationRequests[].validTo` | No | `string` | formato `date-time` | Valor de valid to mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `medicationRequests[].signedAt` | No | `string` | formato `date-time` | Valor de signed at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `medicationRequests[].issuedAt` | No | `string` | formato `date-time` | Valor de issued at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `medicationRequests[].createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |
| `observations` | Sí | `array<ObservationItemDto>` | Sin restricción adicional declarada | Valor de observations mantenido por la instancia. | `[{"id":"00000000-0000-4000-8000-000000000001","codeConceptId":"00000000-0000-4000-8000-000000000001","statusConceptId":"00000000-0000-4000-8000-000000000001","interpretationConceptId":"00000000-0000-4000-8000-000000000001","valueDecimal":"valor-ejemplo","valueText":"valor-ejemplo","valueBoolean":true,"valueConceptId":"00000000-0000-4000-8000-000000000001","quantityValue":"valor-ejemplo","quantityUnitConceptId":"00000000-0000-4000-8000-000000000001","effectiveStartAt":"2026-07-31T12:00:00.000Z","encounterId":"00000000-0000-4000-8000-000000000001"}]` |
| `observations[].id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `observations[].codeConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a code concept. | `00000000-0000-4000-8000-000000000001` |
| `observations[].statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `observations[].interpretationConceptId` | No | `string` | formato `uuid` | Identificador asociado a interpretation concept. | `00000000-0000-4000-8000-000000000001` |
| `observations[].valueDecimal` | No | `string` | Sin restricción adicional declarada | Valor de value decimal mantenido por la instancia. | `valor-ejemplo` |
| `observations[].valueText` | No | `string` | Sin restricción adicional declarada | Valor de value text mantenido por la instancia. | `valor-ejemplo` |
| `observations[].valueBoolean` | No | `boolean` | Sin restricción adicional declarada | Valor de value boolean mantenido por la instancia. | `true` |
| `observations[].valueConceptId` | No | `string` | formato `uuid` | Identificador asociado a value concept. | `00000000-0000-4000-8000-000000000001` |
| `observations[].quantityValue` | No | `string` | Sin restricción adicional declarada | Valor de quantity value mantenido por la instancia. | `valor-ejemplo` |
| `observations[].quantityUnitConceptId` | No | `string` | formato `uuid` | Identificador asociado a quantity unit concept. | `00000000-0000-4000-8000-000000000001` |
| `observations[].effectiveStartAt` | No | `string` | formato `date-time` | Valor de effective start at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `observations[].encounterId` | No | `string` | formato `uuid` | Identificador asociado a encounter. | `00000000-0000-4000-8000-000000000001` |
| `encounters` | Sí | `array<EncounterItemDto>` | Sin restricción adicional declarada | Valor de encounters mantenido por la instancia. | `[{"id":"00000000-0000-4000-8000-000000000001","episodeId":"00000000-0000-4000-8000-000000000001","statusConceptId":"00000000-0000-4000-8000-000000000001","classConceptId":"00000000-0000-4000-8000-000000000001","primaryPractitionerId":"00000000-0000-4000-8000-000000000001","reasonText":"Texto descriptivo de ejemplo","startAt":"2026-07-31T12:00:00.000Z","endAt":"2026-07-31T12:00:00.000Z"}]` |
| `encounters[].id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `encounters[].episodeId` | No | `string` | formato `uuid` | Identificador asociado a episode. | `00000000-0000-4000-8000-000000000001` |
| `encounters[].statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `encounters[].classConceptId` | No | `string` | formato `uuid` | Identificador asociado a class concept. | `00000000-0000-4000-8000-000000000001` |
| `encounters[].primaryPractitionerId` | No | `string` | formato `uuid` | Identificador asociado a primary practitioner. | `00000000-0000-4000-8000-000000000001` |
| `encounters[].reasonText` | No | `string` | Sin restricción adicional declarada | Valor de reason text mantenido por la instancia. | `Texto descriptivo de ejemplo` |
| `encounters[].startAt` | No | `string` | formato `date-time` | Valor de start at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `encounters[].endAt` | No | `string` | formato `date-time` | Valor de end at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `limit` | Sí | `number` | Sin restricción adicional declarada | Tope aplicado a cada bloque | `1` |
| `truncated` | Sí | `array<string>` | Sin restricción adicional declarada | Qué bloques quedaron recortados por el tope | `["valor-ejemplo"]` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, PRACTITIONER. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/clinical/patients/{patientProfileId}/summary"
}
```

---

## 20. GET /clinical/prescription-signature-policies

- **Módulo:** `clinical`
- **Etiqueta OpenAPI:** `clinical-prescription-policies`
- **Nombre:** Listar las políticas de firma de un tenant
- **Operation ID:** `ClinicalPrescriptionPoliciesController_list`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ClinicalPrescriptionPoliciesController.list](../../src/modules/clinical/controllers/clinical-prescription-policies.controller.ts)

### Descripción de negocio

Listar las políticas de firma de un tenant. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Obtiene list.

### Descripción del sistema

NestJS resuelve `GET /clinical/prescription-signature-policies` en `ClinicalPrescriptionPoliciesController_list`. El controlador delega en `PrescriptionSignaturePoliciesService.list`. No recibe body. El tipo de retorno estático es `Promise<PrescriptionSignaturePolicyResponseDto[]>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `tenantId` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /clinical/prescription-signature-policies?tenantId=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CLINICIAN`, `SECURITY_ADMIN`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /clinical/prescription-signature-policies?tenantId=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PrescriptionSignaturePolicyResponseDto[]>` | No |
| 400 | Consulta completada correctamente. | `Promise<PrescriptionSignaturePolicyResponseDto[]>` | No |
| 401 | Consulta completada correctamente. | `Promise<PrescriptionSignaturePolicyResponseDto[]>` | No |
| 403 | Consulta completada correctamente. | `Promise<PrescriptionSignaturePolicyResponseDto[]>` | No |
| 429 | Consulta completada correctamente. | `Promise<PrescriptionSignaturePolicyResponseDto[]>` | No |
| 500 | Consulta completada correctamente. | `Promise<PrescriptionSignaturePolicyResponseDto[]>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PrescriptionSignaturePolicyResponseDto[]`. Ejemplo completo derivado de ese DTO:

```json
[
  {
    "id": "00000000-0000-4000-8000-000000000001",
    "tenantId": "00000000-0000-4000-8000-000000000001",
    "jurisdictionCode": "CODIGO_EJEMPLO",
    "medicationTypeConceptId": "00000000-0000-4000-8000-000000000001",
    "channelConceptId": "00000000-0000-4000-8000-000000000001",
    "signatureRequired": true,
    "effectiveFrom": "2026-07-31T12:00:00.000Z",
    "effectiveTo": "2026-07-31T12:00:00.000Z"
  }
]
```

Campos de la respuesta:

El DTO de respuesta no declara campos documentables.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/clinical/prescription-signature-policies"
}
```

---

## 21. POST /clinical/prescription-signature-policies

- **Módulo:** `clinical`
- **Etiqueta OpenAPI:** `clinical-prescription-policies`
- **Nombre:** Crear una política de firma de receta
- **Operation ID:** `ClinicalPrescriptionPoliciesController_create`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ClinicalPrescriptionPoliciesController.create](../../src/modules/clinical/controllers/clinical-prescription-policies.controller.ts)

### Descripción de negocio

Crear una política de firma de receta. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Crea create.

### Descripción del sistema

NestJS resuelve `POST /clinical/prescription-signature-policies` en `ClinicalPrescriptionPoliciesController_create`. El controlador delega en `PrescriptionSignaturePoliciesService.create`. Valida el body como `CreatePrescriptionSignaturePolicyDto` y consume `application/json`. El tipo de retorno estático es `Promise<PrescriptionSignaturePolicyResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreatePrescriptionSignaturePolicyDto`; los campos opcionales se omiten.

```http
POST /clinical/prescription-signature-policies HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "signatureRequired": true
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CLINICIAN`, `SECURITY_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | Sí | `string` | formato `uuid` | Tenant al que aplica la política (directory.tenants) | `00000000-0000-4000-8000-000000000001` |
| `jurisdictionCode` | No | `string` | longitud máxima 16 | Código de jurisdicción (comodín si se omite) | `CODIGO_EJEMPLO` |
| `medicationTypeConceptId` | No | `string` | formato `uuid` | Tipo de medicamento (concept id); comodín si se omite | `00000000-0000-4000-8000-000000000001` |
| `channelConceptId` | No | `string` | formato `uuid` | Canal de emisión (concept id); comodín si se omite | `00000000-0000-4000-8000-000000000001` |
| `signatureRequired` | Sí | `boolean` | Sin restricción adicional declarada | Si la firma es obligatoria cuando esta política aplica | `true` |
| `effectiveFrom` | No | `string` | formato `date-time` | Inicio de vigencia (por defecto, ahora) | `2026-07-31T12:00:00.000Z` |
| `effectiveTo` | No | `string` | formato `date-time` | Fin de vigencia (nulo = indefinido) | `2026-07-31T12:00:00.000Z` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /clinical/prescription-signature-policies HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "jurisdictionCode": "CODIGO_EJEMPLO",
  "medicationTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "channelConceptId": "00000000-0000-4000-8000-000000000001",
  "signatureRequired": true,
  "effectiveFrom": "2026-07-31T12:00:00.000Z",
  "effectiveTo": "2026-07-31T12:00:00.000Z"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<PrescriptionSignaturePolicyResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<PrescriptionSignaturePolicyResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PrescriptionSignaturePolicyResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PrescriptionSignaturePolicyResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PrescriptionSignaturePolicyResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<PrescriptionSignaturePolicyResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PrescriptionSignaturePolicyResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PrescriptionSignaturePolicyResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PrescriptionSignaturePolicyResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PrescriptionSignaturePolicyResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "jurisdictionCode": "CODIGO_EJEMPLO",
  "medicationTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "channelConceptId": "00000000-0000-4000-8000-000000000001",
  "signatureRequired": true,
  "effectiveFrom": "2026-07-31T12:00:00.000Z",
  "effectiveTo": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `tenantId` | Sí | `string` | formato `uuid` | Identificador asociado a tenant. | `00000000-0000-4000-8000-000000000001` |
| `jurisdictionCode` | No | `string` | admite null | Valor de jurisdiction code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `medicationTypeConceptId` | No | `string` | formato `uuid`; admite null | Identificador asociado a medication type concept. | `00000000-0000-4000-8000-000000000001` |
| `channelConceptId` | No | `string` | formato `uuid`; admite null | Identificador asociado a channel concept. | `00000000-0000-4000-8000-000000000001` |
| `signatureRequired` | Sí | `boolean` | Sin restricción adicional declarada | Valor de signature required mantenido por la instancia. | `true` |
| `effectiveFrom` | Sí | `string` | formato `date-time` | Valor de effective from mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `effectiveTo` | No | `string` | formato `date-time`; admite null | Valor de effective to mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, SECURITY_ADMIN. | Roles/tenant/guards de autorización |
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
  "path": "/clinical/prescription-signature-policies"
}
```

---

## 22. POST /clinical/prescription-signature-policies/{id}/deactivate

- **Módulo:** `clinical`
- **Etiqueta OpenAPI:** `clinical-prescription-policies`
- **Nombre:** Desactivar una política (cierra vigencia, sin borrado duro)
- **Operation ID:** `ClinicalPrescriptionPoliciesController_deactivate`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ClinicalPrescriptionPoliciesController.deactivate](../../src/modules/clinical/controllers/clinical-prescription-policies.controller.ts)

### Descripción de negocio

Desactivar una política (cierra vigencia, sin borrado duro). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Ejecuta la operación deactivate.

### Descripción del sistema

NestJS resuelve `POST /clinical/prescription-signature-policies/{id}/deactivate` en `ClinicalPrescriptionPoliciesController_deactivate`. El controlador delega en `PrescriptionSignaturePoliciesService.deactivate`. No recibe body. El tipo de retorno estático es `Promise<PrescriptionSignaturePolicyResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /clinical/prescription-signature-policies/00000000-0000-4000-8000-000000000001/deactivate HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CLINICIAN`, `SECURITY_ADMIN`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /clinical/prescription-signature-policies/00000000-0000-4000-8000-000000000001/deactivate HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PrescriptionSignaturePolicyResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<PrescriptionSignaturePolicyResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PrescriptionSignaturePolicyResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PrescriptionSignaturePolicyResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<PrescriptionSignaturePolicyResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PrescriptionSignaturePolicyResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PrescriptionSignaturePolicyResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PrescriptionSignaturePolicyResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PrescriptionSignaturePolicyResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PrescriptionSignaturePolicyResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "jurisdictionCode": "CODIGO_EJEMPLO",
  "medicationTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "channelConceptId": "00000000-0000-4000-8000-000000000001",
  "signatureRequired": true,
  "effectiveFrom": "2026-07-31T12:00:00.000Z",
  "effectiveTo": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `tenantId` | Sí | `string` | formato `uuid` | Identificador asociado a tenant. | `00000000-0000-4000-8000-000000000001` |
| `jurisdictionCode` | No | `string` | admite null | Valor de jurisdiction code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `medicationTypeConceptId` | No | `string` | formato `uuid`; admite null | Identificador asociado a medication type concept. | `00000000-0000-4000-8000-000000000001` |
| `channelConceptId` | No | `string` | formato `uuid`; admite null | Identificador asociado a channel concept. | `00000000-0000-4000-8000-000000000001` |
| `signatureRequired` | Sí | `boolean` | Sin restricción adicional declarada | Valor de signature required mantenido por la instancia. | `true` |
| `effectiveFrom` | Sí | `string` | formato `date-time` | Valor de effective from mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `effectiveTo` | No | `string` | formato `date-time`; admite null | Valor de effective to mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Política no encontrada | Excepción explícita en src/modules/clinical/services/prescription-signature-policies.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/clinical/prescription-signature-policies/{id}/deactivate"
}
```

---

## 23. POST /clinical/procedures

- **Módulo:** `clinical`
- **Etiqueta OpenAPI:** `clinical-records`
- **Nombre:** Registrar un procedimiento
- **Operation ID:** `ClinicalRecordsController_createProcedure`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ClinicalRecordsController.createProcedure](../../src/modules/clinical/controllers/clinical-records.controller.ts)

### Descripción de negocio

Registrar un procedimiento. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /clinical/procedures` en `ClinicalRecordsController_createProcedure`. El controlador delega en `ProceduresService.create`. Valida el body como `CreateProcedureDto` y consume `application/json`. El tipo de retorno estático es `Promise<ProcedureResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateProcedureDto`; los campos opcionales se omiten.

```http
POST /clinical/procedures HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "custodianTenantId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "codeConceptId": "00000000-0000-4000-8000-000000000001"
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
| `custodianTenantId` | Sí | `string` | formato `uuid` | Tenant custodio (directory.tenants) | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | Sí | `string` | formato `uuid` | Paciente (profiles.patient_profiles) | `00000000-0000-4000-8000-000000000001` |
| `encounterId` | No | `string` | formato `uuid` | Encuentro en curso | `00000000-0000-4000-8000-000000000001` |
| `codeConceptId` | Sí | `string` | formato `uuid` | Código del procedimiento (concept id) | `00000000-0000-4000-8000-000000000001` |
| `performerProfileId` | No | `string` | formato `uuid` | Profesional ejecutante | `00000000-0000-4000-8000-000000000001` |
| `serviceRequestId` | No | `string` | formato `uuid` | Orden de servicio que lo origina | `00000000-0000-4000-8000-000000000001` |
| `parentProcedureId` | No | `string` | formato `uuid` | Procedimiento padre (jerarquía) | `00000000-0000-4000-8000-000000000001` |
| `categoryConceptId` | No | `string` | formato `uuid` | Categoría (concept id) | `00000000-0000-4000-8000-000000000001` |
| `outcomeConceptId` | No | `string` | formato `uuid` | Resultado (concept id) | `00000000-0000-4000-8000-000000000001` |
| `practiceSiteId` | No | `string` | formato `uuid` | Sede de práctica | `00000000-0000-4000-8000-000000000001` |
| `careSpaceId` | No | `string` | formato `uuid` | Espacio de atención | `00000000-0000-4000-8000-000000000001` |
| `occurrenceStartAt` | No | `string` | formato `date-time` | Inicio de la ocurrencia | `2026-07-31T12:00:00.000Z` |
| `occurrenceEndAt` | No | `string` | formato `date-time` | Fin de la ocurrencia | `2026-07-31T12:00:00.000Z` |
| `operativeReportFileId` | No | `string` | formato `uuid` | Reporte operatorio (common.files) | `00000000-0000-4000-8000-000000000001` |
| `followUpText` | No | `string` | Sin restricción adicional declarada | Seguimiento en texto libre | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /clinical/procedures HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "custodianTenantId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "encounterId": "00000000-0000-4000-8000-000000000001",
  "codeConceptId": "00000000-0000-4000-8000-000000000001",
  "performerProfileId": "00000000-0000-4000-8000-000000000001",
  "serviceRequestId": "00000000-0000-4000-8000-000000000001",
  "parentProcedureId": "00000000-0000-4000-8000-000000000001",
  "categoryConceptId": "00000000-0000-4000-8000-000000000001",
  "outcomeConceptId": "00000000-0000-4000-8000-000000000001",
  "practiceSiteId": "00000000-0000-4000-8000-000000000001",
  "careSpaceId": "00000000-0000-4000-8000-000000000001",
  "occurrenceStartAt": "2026-07-31T12:00:00.000Z",
  "occurrenceEndAt": "2026-07-31T12:00:00.000Z",
  "operativeReportFileId": "00000000-0000-4000-8000-000000000001",
  "followUpText": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ProcedureResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ProcedureResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ProcedureResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ProcedureResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ProcedureResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ProcedureResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ProcedureResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ProcedureResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ProcedureResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ProcedureResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001",
  "serviceRequestId": "00000000-0000-4000-8000-000000000001",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | Sí | `string` | formato `uuid` | Identificador asociado a patient profile. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Estado (concept id) | `00000000-0000-4000-8000-000000000001` |
| `serviceRequestId` | No | `string` | formato `uuid`; admite null | Identificador asociado a service request. | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, PRACTITIONER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Orden de servicio no encontrada | Excepción explícita en src/modules/clinical/services/procedures.service.ts |
| 404 | `NOT_FOUND` | Procedimiento padre no encontrado | Excepción explícita en src/modules/clinical/services/procedures.service.ts |
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
  "path": "/clinical/procedures"
}
```

---

## 24. POST /clinical/service-requests

- **Módulo:** `clinical`
- **Etiqueta OpenAPI:** `clinical-orders`
- **Nombre:** Crear una orden de servicio
- **Operation ID:** `ClinicalOrdersController_createServiceRequest`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ClinicalOrdersController.createServiceRequest](../../src/modules/clinical/controllers/clinical-orders.controller.ts)

### Descripción de negocio

Crear una orden de servicio. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /clinical/service-requests` en `ClinicalOrdersController_createServiceRequest`. El controlador delega en `ServiceRequestsService.create`. Valida el body como `CreateServiceRequestDto` y consume `application/json`. El tipo de retorno estático es `Promise<ServiceRequestResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateServiceRequestDto`; los campos opcionales se omiten.

```http
POST /clinical/service-requests HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "custodianTenantId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "codeConceptId": "00000000-0000-4000-8000-000000000001"
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
| `custodianTenantId` | Sí | `string` | formato `uuid` | Tenant custodio (directory.tenants) | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | Sí | `string` | formato `uuid` | Paciente (profiles.patient_profiles) | `00000000-0000-4000-8000-000000000001` |
| `encounterId` | No | `string` | formato `uuid` | Encuentro en curso | `00000000-0000-4000-8000-000000000001` |
| `codeConceptId` | Sí | `string` | formato `uuid` | Código del servicio pedido (concept id) | `00000000-0000-4000-8000-000000000001` |
| `categoryConceptId` | No | `string` | formato `uuid` | Categoría (concept id) | `00000000-0000-4000-8000-000000000001` |
| `priorityConceptId` | No | `string` | formato `uuid` | Prioridad (concept id) | `00000000-0000-4000-8000-000000000001` |
| `requesterProfileId` | No | `string` | formato `uuid` | Profesional solicitante | `00000000-0000-4000-8000-000000000001` |
| `performerTenantId` | No | `string` | formato `uuid` | Tenant ejecutante | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /clinical/service-requests HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "custodianTenantId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "encounterId": "00000000-0000-4000-8000-000000000001",
  "codeConceptId": "00000000-0000-4000-8000-000000000001",
  "categoryConceptId": "00000000-0000-4000-8000-000000000001",
  "priorityConceptId": "00000000-0000-4000-8000-000000000001",
  "requesterProfileId": "00000000-0000-4000-8000-000000000001",
  "performerTenantId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ServiceRequestResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ServiceRequestResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ServiceRequestResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ServiceRequestResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ServiceRequestResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ServiceRequestResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ServiceRequestResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ServiceRequestResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ServiceRequestResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ServiceRequestResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001",
  "intent": "00000000-0000-4000-8000-000000000001",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | Sí | `string` | formato `uuid` | Identificador asociado a patient profile. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Estado (concept id) | `00000000-0000-4000-8000-000000000001` |
| `intent` | Sí | `string` | formato `uuid` | Intención (concept id) | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, PRACTITIONER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Encuentro no encontrado | Excepción explícita en src/modules/clinical/services/service-requests.service.ts |
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
  "path": "/clinical/service-requests"
}
```

---

