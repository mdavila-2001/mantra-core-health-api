<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `medical_groups`

Referencia exhaustiva de 8 operación(es) del módulo `medical_groups`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `medical-groups`
- **Controladores:** `MedicalGroupsController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [GET /medical-groups](#1-get-medical-groups) — Listar grupos médicos (histórico/enviadas/recibidas)
2. [POST /medical-groups](#2-post-medical-groups) — Crear grupo médico
3. [GET /medical-groups/{id}](#3-get-medical-groups-id) — Consultar un grupo médico (formulario de sólo lectura)
4. [PATCH /medical-groups/{id}/exercise-notes](#4-patch-medical-groups-id-exercise-notes) — Subir/corregir las notas del procedimiento (NOTAS DEL EJERCICIO)
5. [POST /medical-groups/{id}/members/{memberId}/respond](#5-post-medical-groups-id-members-memberid-respond) — Aceptar o rechazar la invitación a un cargo del grupo
6. [POST /medical-groups/{id}/reschedule-requests](#6-post-medical-groups-id-reschedule-requests) — Solicitar cambio de horario
7. [POST /medical-groups/{id}/reschedule-requests/respond](#7-post-medical-groups-id-reschedule-requests-respond) — Resolver la solicitud de cambio de horario
8. [GET /medical-groups/patients/{patientProfileId}/conditions](#8-get-medical-groups-patients-patientprofileid-conditions) — Diagnósticos del paciente para el selector del formulario

---

## 1. GET /medical-groups

- **Módulo:** `medical_groups`
- **Etiqueta OpenAPI:** `medical-groups`
- **Nombre:** Listar grupos médicos (histórico/enviadas/recibidas)
- **Operation ID:** `MedicalGroupsController_list`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [MedicalGroupsController.list](../../src/modules/medical_groups/controllers/medical-groups.controller.ts)

### Descripción de negocio

Listar grupos médicos (histórico/enviadas/recibidas). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: AC-21-01/02/03: las tres pestañas comparten este mismo listado, por `tab`.

### Descripción del sistema

NestJS resuelve `GET /medical-groups` en `MedicalGroupsController_list`. El controlador delega en `MedicalGroupsService.list`. No recibe body. El tipo de retorno estático es `Promise<MedicalGroupPageDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `tab` | query | No | `string` | valores: `historico`, `enviadas`, `recibidas` | Sin descripción específica en OpenAPI. | `historico` |
| `cursor` | query | No | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |
| `limit` | query | No | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /medical-groups HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PRACTITIONER`, `CLINICIAN`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /medical-groups?tab=historico&cursor=valor-ejemplo&limit=valor-ejemplo HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<MedicalGroupPageDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<MedicalGroupPageDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<MedicalGroupPageDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<MedicalGroupPageDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<MedicalGroupPageDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<MedicalGroupPageDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `MedicalGroupPageDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "serviceCatalogId": "00000000-0000-4000-8000-000000000001",
      "scheduledAt": "2026-07-31T12:00:00.000Z",
      "locationText": "valor-ejemplo",
      "status": "PENDING_TEAM",
      "isCreator": true,
      "patientProfileId": "00000000-0000-4000-8000-000000000001",
      "pendingMembersCount": 1
    }
  ],
  "nextCursor": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<MedicalGroupListItemDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","serviceCatalogId":"00000000-0000-4000-8000-000000000001","scheduledAt":"2026-07-31T12:00:00.000Z","locationText":"valor-ejemplo","status":"PENDING_TEAM","isCreator":true,"patientProfileId":"00000000-0000-4000-8000-000000000001","pendingMembersCount":1}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].serviceCatalogId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].scheduledAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `items[].locationText` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].status` | Sí | `string` | valores: `PENDING_TEAM`, `SCHEDULED`, `RESCHEDULE_PENDING`, `CLOSED` | Sin descripción específica en el contrato OpenAPI. | `PENDING_TEAM` |
| `items[].isCreator` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `items[].patientProfileId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].pendingMembersCount` | Sí | `number` | Sin restricción adicional declarada | Cuántos cargos siguen sin responder (útil en enviadas/recibidas). | `1` |
| `nextCursor` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 401 | `UNAUTHENTICATED` | La cuenta no tiene un perfil profesional asociado | Excepción explícita en src/modules/medical_groups/services/medical-groups.service.ts |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PRACTITIONER, CLINICIAN. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/medical-groups"
}
```

---

## 2. POST /medical-groups

- **Módulo:** `medical_groups`
- **Etiqueta OpenAPI:** `medical-groups`
- **Nombre:** Crear grupo médico
- **Operation ID:** `MedicalGroupsController_create`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [MedicalGroupsController.create](../../src/modules/medical_groups/controllers/medical-groups.controller.ts)

### Descripción de negocio

Crear grupo médico. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: AC-21-04/05/08/09/10/11/12/13: crear grupo médico.

### Descripción del sistema

NestJS resuelve `POST /medical-groups` en `MedicalGroupsController_create`. El controlador delega en `MedicalGroupsService.create`. Valida el body como `CreateMedicalGroupDto` y consume `application/json`. El tipo de retorno estático es `Promise<MedicalGroupDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateMedicalGroupDto`; los campos opcionales se omiten.

```http
POST /medical-groups HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "serviceCatalogId": "00000000-0000-4000-8000-000000000001",
  "scheduledAt": "2026-07-31T12:00:00.000Z",
  "locationText": "valor-ejemplo",
  "members": [
    {
      "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
      "roleTitle": "valor-ejemplo",
      "agreedPaymentAmount": "500.00"
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PRACTITIONER`, `CLINICIAN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `serviceCatalogId` | Sí | `string` | formato `uuid` | billing.service_catalog | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | No | `string` | formato `uuid` | profiles.patient_profiles | `00000000-0000-4000-8000-000000000001` |
| `conditionId` | No | `string` | formato `uuid` | clinical.conditions | `00000000-0000-4000-8000-000000000001` |
| `scheduledAt` | Sí | `string` | formato `date-time` | Fecha y hora de realización, ISO 8601 | `2026-07-31T12:00:00.000Z` |
| `locationText` | Sí | `string` | longitud máxima 300 | Lugar de realización | `valor-ejemplo` |
| `notesText` | No | `string` | longitud máxima 4000 | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `additionalTermsText` | No | `string` | longitud máxima 4000 | Adicionales de términos y condiciones del solicitante, sobre el default del servicio | `valor-ejemplo` |
| `members` | Sí | `array<MedicalGroupMemberInputDto>` | mínimo 0 elemento(s) | El resto del equipo (cargo/función + pago). El creador se agrega solo como miembro aceptado. | `[{"practitionerProfileId":"00000000-0000-4000-8000-000000000001","roleTitle":"valor-ejemplo","agreedPaymentAmount":"500.00","agreedPaymentCurrencyConceptId":"00000000-0000-4000-8000-000000000001","additionalTermsText":"valor-ejemplo"}]` |
| `members[].practitionerProfileId` | Sí | `string` | formato `uuid` | Profesional invitado a este cargo | `00000000-0000-4000-8000-000000000001` |
| `members[].roleTitle` | Sí | `string` | longitud máxima 120 | Cargo/función dentro del grupo (p. ej. "Anestesiólogo") | `valor-ejemplo` |
| `members[].agreedPaymentAmount` | Sí | `string` | patrón runtime `PRICE_PATTERN` | Sin descripción específica en el contrato OpenAPI. | `500.00` |
| `members[].agreedPaymentCurrencyConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `members[].additionalTermsText` | No | `string` | longitud máxima 4000 | Adicionales de términos y condiciones opcionales para este cargo | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /medical-groups HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "serviceCatalogId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "conditionId": "00000000-0000-4000-8000-000000000001",
  "scheduledAt": "2026-07-31T12:00:00.000Z",
  "locationText": "valor-ejemplo",
  "notesText": "Texto descriptivo de ejemplo",
  "additionalTermsText": "valor-ejemplo",
  "members": [
    {
      "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
      "roleTitle": "valor-ejemplo",
      "agreedPaymentAmount": "500.00",
      "agreedPaymentCurrencyConceptId": "00000000-0000-4000-8000-000000000001",
      "additionalTermsText": "valor-ejemplo"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<MedicalGroupDto>` | No |
| 400 | Operación completada correctamente. | `Promise<MedicalGroupDto>` | No |
| 401 | Operación completada correctamente. | `Promise<MedicalGroupDto>` | No |
| 403 | Operación completada correctamente. | `Promise<MedicalGroupDto>` | No |
| 409 | Operación completada correctamente. | `Promise<MedicalGroupDto>` | No |
| 413 | Operación completada correctamente. | `Promise<MedicalGroupDto>` | No |
| 422 | Operación completada correctamente. | `Promise<MedicalGroupDto>` | No |
| 429 | Operación completada correctamente. | `Promise<MedicalGroupDto>` | No |
| 500 | Operación completada correctamente. | `Promise<MedicalGroupDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `MedicalGroupDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "serviceCatalogId": "00000000-0000-4000-8000-000000000001",
  "requestingPractitionerId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "conditionId": "00000000-0000-4000-8000-000000000001",
  "scheduledAt": "2026-07-31T12:00:00.000Z",
  "locationText": "valor-ejemplo",
  "notesText": "Texto descriptivo de ejemplo",
  "termsText": "valor-ejemplo",
  "status": "PENDING_TEAM",
  "exerciseNotesText": "Texto descriptivo de ejemplo",
  "exerciseNotesUpdatedAt": "2026-07-31T12:00:00.000Z",
  "proposedRescheduleAt": "2026-07-31T12:00:00.000Z",
  "proposedByPractitionerId": "00000000-0000-4000-8000-000000000001",
  "isRealized": true,
  "canEditExerciseNotes": true,
  "isClosed": true,
  "createdAt": "2026-07-31T12:00:00.000Z",
  "members": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
      "roleTitle": "valor-ejemplo",
      "agreedPaymentAmount": "valor-ejemplo",
      "agreedPaymentCurrencyConceptId": "00000000-0000-4000-8000-000000000001",
      "additionalTermsText": "valor-ejemplo",
      "isCreator": true,
      "invitationStatus": "PENDING",
      "respondedAt": "2026-07-31T12:00:00.000Z"
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `serviceCatalogId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `requestingPractitionerId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `conditionId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `scheduledAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `locationText` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `notesText` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `termsText` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `status` | Sí | `string` | valores: `PENDING_TEAM`, `SCHEDULED`, `RESCHEDULE_PENDING`, `CLOSED` | Sin descripción específica en el contrato OpenAPI. | `PENDING_TEAM` |
| `exerciseNotesText` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `exerciseNotesUpdatedAt` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `proposedRescheduleAt` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `proposedByPractitionerId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `isRealized` | Sí | `boolean` | Sin restricción adicional declarada | Derivado en el servidor: ya pasó la fecha de realización. | `true` |
| `canEditExerciseNotes` | Sí | `boolean` | Sin restricción adicional declarada | Derivado: todavía se pueden subir notas del procedimiento. | `true` |
| `isClosed` | Sí | `boolean` | Sin restricción adicional declarada | Derivado: pasó la ventana de una semana — expediente inmutable (AC-21-19). | `true` |
| `createdAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `members` | Sí | `array<MedicalGroupMemberDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","practitionerProfileId":"00000000-0000-4000-8000-000000000001","roleTitle":"valor-ejemplo","agreedPaymentAmount":"valor-ejemplo","agreedPaymentCurrencyConceptId":"00000000-0000-4000-8000-000000000001","additionalTermsText":"valor-ejemplo","isCreator":true,"invitationStatus":"PENDING","respondedAt":"2026-07-31T12:00:00.000Z"}]` |
| `members[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `members[].practitionerProfileId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `members[].roleTitle` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `members[].agreedPaymentAmount` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `members[].agreedPaymentCurrencyConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `members[].additionalTermsText` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `members[].isCreator` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `members[].invitationStatus` | Sí | `string` | valores: `PENDING`, `ACCEPTED`, `REJECTED` | Sin descripción específica en el contrato OpenAPI. | `PENDING` |
| `members[].respondedAt` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 401 | `UNAUTHENTICATED` | La cuenta no tiene un perfil profesional asociado | Excepción explícita en src/modules/medical_groups/services/medical-groups.service.ts |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PRACTITIONER, CLINICIAN. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | SIN_ACCESO_A_LA_HISTORIA | Excepción explícita en src/modules/clinical/services/clinical-read.service.ts |
| 404 | `NOT_FOUND` | Servicio médico no encontrado | Excepción explícita en src/modules/medical_groups/services/medical-groups.service.ts |
| 404 | `NOT_FOUND` | Paciente no encontrado | Excepción explícita en src/modules/medical_groups/services/medical-groups.service.ts |
| 404 | `NOT_FOUND` | Diagnóstico no encontrado | Excepción explícita en src/modules/medical_groups/services/medical-groups.service.ts |
| 404 | `NOT_FOUND` | Profesional no encontrado | Excepción explícita en src/modules/medical_groups/services/medical-groups.service.ts |
| 409 | `CONFLICT` | Un mismo profesional no puede repetirse (ni ser también el creador) | Excepción explícita en src/modules/medical_groups/services/medical-groups.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Seleccioná primero el paciente para poder elegir un diagnóstico | Excepción explícita en src/modules/medical_groups/services/medical-groups.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/medical-groups"
}
```

---

## 3. GET /medical-groups/{id}

- **Módulo:** `medical_groups`
- **Etiqueta OpenAPI:** `medical-groups`
- **Nombre:** Consultar un grupo médico (formulario de sólo lectura)
- **Operation ID:** `MedicalGroupsController_findOne`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [MedicalGroupsController.findOne](../../src/modules/medical_groups/controllers/medical-groups.controller.ts)

### Descripción de negocio

Consultar un grupo médico (formulario de sólo lectura). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /medical-groups/{id}` en `MedicalGroupsController_findOne`. El controlador delega en `MedicalGroupsService.findOne`. No recibe body. El tipo de retorno estático es `Promise<MedicalGroupDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /medical-groups/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PRACTITIONER`, `CLINICIAN`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /medical-groups/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<MedicalGroupDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<MedicalGroupDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<MedicalGroupDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<MedicalGroupDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<MedicalGroupDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<MedicalGroupDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<MedicalGroupDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `MedicalGroupDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "serviceCatalogId": "00000000-0000-4000-8000-000000000001",
  "requestingPractitionerId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "conditionId": "00000000-0000-4000-8000-000000000001",
  "scheduledAt": "2026-07-31T12:00:00.000Z",
  "locationText": "valor-ejemplo",
  "notesText": "Texto descriptivo de ejemplo",
  "termsText": "valor-ejemplo",
  "status": "PENDING_TEAM",
  "exerciseNotesText": "Texto descriptivo de ejemplo",
  "exerciseNotesUpdatedAt": "2026-07-31T12:00:00.000Z",
  "proposedRescheduleAt": "2026-07-31T12:00:00.000Z",
  "proposedByPractitionerId": "00000000-0000-4000-8000-000000000001",
  "isRealized": true,
  "canEditExerciseNotes": true,
  "isClosed": true,
  "createdAt": "2026-07-31T12:00:00.000Z",
  "members": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
      "roleTitle": "valor-ejemplo",
      "agreedPaymentAmount": "valor-ejemplo",
      "agreedPaymentCurrencyConceptId": "00000000-0000-4000-8000-000000000001",
      "additionalTermsText": "valor-ejemplo",
      "isCreator": true,
      "invitationStatus": "PENDING",
      "respondedAt": "2026-07-31T12:00:00.000Z"
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `serviceCatalogId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `requestingPractitionerId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `conditionId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `scheduledAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `locationText` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `notesText` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `termsText` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `status` | Sí | `string` | valores: `PENDING_TEAM`, `SCHEDULED`, `RESCHEDULE_PENDING`, `CLOSED` | Sin descripción específica en el contrato OpenAPI. | `PENDING_TEAM` |
| `exerciseNotesText` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `exerciseNotesUpdatedAt` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `proposedRescheduleAt` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `proposedByPractitionerId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `isRealized` | Sí | `boolean` | Sin restricción adicional declarada | Derivado en el servidor: ya pasó la fecha de realización. | `true` |
| `canEditExerciseNotes` | Sí | `boolean` | Sin restricción adicional declarada | Derivado: todavía se pueden subir notas del procedimiento. | `true` |
| `isClosed` | Sí | `boolean` | Sin restricción adicional declarada | Derivado: pasó la ventana de una semana — expediente inmutable (AC-21-19). | `true` |
| `createdAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `members` | Sí | `array<MedicalGroupMemberDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","practitionerProfileId":"00000000-0000-4000-8000-000000000001","roleTitle":"valor-ejemplo","agreedPaymentAmount":"valor-ejemplo","agreedPaymentCurrencyConceptId":"00000000-0000-4000-8000-000000000001","additionalTermsText":"valor-ejemplo","isCreator":true,"invitationStatus":"PENDING","respondedAt":"2026-07-31T12:00:00.000Z"}]` |
| `members[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `members[].practitionerProfileId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `members[].roleTitle` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `members[].agreedPaymentAmount` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `members[].agreedPaymentCurrencyConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `members[].additionalTermsText` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `members[].isCreator` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `members[].invitationStatus` | Sí | `string` | valores: `PENDING`, `ACCEPTED`, `REJECTED` | Sin descripción específica en el contrato OpenAPI. | `PENDING` |
| `members[].respondedAt` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PRACTITIONER, CLINICIAN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Grupo médico no encontrado | Excepción explícita en src/modules/medical_groups/services/medical-groups.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/medical-groups/{id}"
}
```

---

## 4. PATCH /medical-groups/{id}/exercise-notes

- **Módulo:** `medical_groups`
- **Etiqueta OpenAPI:** `medical-groups`
- **Nombre:** Subir/corregir las notas del procedimiento (NOTAS DEL EJERCICIO)
- **Operation ID:** `MedicalGroupsController_updateExerciseNotes`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [MedicalGroupsController.updateExerciseNotes](../../src/modules/medical_groups/controllers/medical-groups.controller.ts)

### Descripción de negocio

Subir/corregir las notas del procedimiento (NOTAS DEL EJERCICIO). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: AC-21-21/22: notas del procedimiento, hasta una semana después.

### Descripción del sistema

NestJS resuelve `PATCH /medical-groups/{id}/exercise-notes` en `MedicalGroupsController_updateExerciseNotes`. El controlador delega en `MedicalGroupsService.updateExerciseNotes`. Valida el body como `UpdateMedicalGroupExerciseNotesDto` y consume `application/json`. El tipo de retorno estático es `Promise<MedicalGroupDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `UpdateMedicalGroupExerciseNotesDto`; los campos opcionales se omiten.

```http
PATCH /medical-groups/00000000-0000-4000-8000-000000000001/exercise-notes HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "notesText": "Texto descriptivo de ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PRACTITIONER`, `CLINICIAN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `notesText` | Sí | `string` | longitud máxima 8000 | Notas del procedimiento ya realizado | `Texto descriptivo de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PATCH /medical-groups/00000000-0000-4000-8000-000000000001/exercise-notes HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "notesText": "Texto descriptivo de ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<MedicalGroupDto>` | No |
| 400 | Operación completada correctamente. | `Promise<MedicalGroupDto>` | No |
| 401 | Operación completada correctamente. | `Promise<MedicalGroupDto>` | No |
| 403 | Operación completada correctamente. | `Promise<MedicalGroupDto>` | No |
| 404 | Operación completada correctamente. | `Promise<MedicalGroupDto>` | No |
| 409 | Operación completada correctamente. | `Promise<MedicalGroupDto>` | No |
| 413 | Operación completada correctamente. | `Promise<MedicalGroupDto>` | No |
| 422 | Operación completada correctamente. | `Promise<MedicalGroupDto>` | No |
| 429 | Operación completada correctamente. | `Promise<MedicalGroupDto>` | No |
| 500 | Operación completada correctamente. | `Promise<MedicalGroupDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `MedicalGroupDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "serviceCatalogId": "00000000-0000-4000-8000-000000000001",
  "requestingPractitionerId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "conditionId": "00000000-0000-4000-8000-000000000001",
  "scheduledAt": "2026-07-31T12:00:00.000Z",
  "locationText": "valor-ejemplo",
  "notesText": "Texto descriptivo de ejemplo",
  "termsText": "valor-ejemplo",
  "status": "PENDING_TEAM",
  "exerciseNotesText": "Texto descriptivo de ejemplo",
  "exerciseNotesUpdatedAt": "2026-07-31T12:00:00.000Z",
  "proposedRescheduleAt": "2026-07-31T12:00:00.000Z",
  "proposedByPractitionerId": "00000000-0000-4000-8000-000000000001",
  "isRealized": true,
  "canEditExerciseNotes": true,
  "isClosed": true,
  "createdAt": "2026-07-31T12:00:00.000Z",
  "members": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
      "roleTitle": "valor-ejemplo",
      "agreedPaymentAmount": "valor-ejemplo",
      "agreedPaymentCurrencyConceptId": "00000000-0000-4000-8000-000000000001",
      "additionalTermsText": "valor-ejemplo",
      "isCreator": true,
      "invitationStatus": "PENDING",
      "respondedAt": "2026-07-31T12:00:00.000Z"
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `serviceCatalogId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `requestingPractitionerId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `conditionId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `scheduledAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `locationText` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `notesText` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `termsText` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `status` | Sí | `string` | valores: `PENDING_TEAM`, `SCHEDULED`, `RESCHEDULE_PENDING`, `CLOSED` | Sin descripción específica en el contrato OpenAPI. | `PENDING_TEAM` |
| `exerciseNotesText` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `exerciseNotesUpdatedAt` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `proposedRescheduleAt` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `proposedByPractitionerId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `isRealized` | Sí | `boolean` | Sin restricción adicional declarada | Derivado en el servidor: ya pasó la fecha de realización. | `true` |
| `canEditExerciseNotes` | Sí | `boolean` | Sin restricción adicional declarada | Derivado: todavía se pueden subir notas del procedimiento. | `true` |
| `isClosed` | Sí | `boolean` | Sin restricción adicional declarada | Derivado: pasó la ventana de una semana — expediente inmutable (AC-21-19). | `true` |
| `createdAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `members` | Sí | `array<MedicalGroupMemberDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","practitionerProfileId":"00000000-0000-4000-8000-000000000001","roleTitle":"valor-ejemplo","agreedPaymentAmount":"valor-ejemplo","agreedPaymentCurrencyConceptId":"00000000-0000-4000-8000-000000000001","additionalTermsText":"valor-ejemplo","isCreator":true,"invitationStatus":"PENDING","respondedAt":"2026-07-31T12:00:00.000Z"}]` |
| `members[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `members[].practitionerProfileId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `members[].roleTitle` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `members[].agreedPaymentAmount` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `members[].agreedPaymentCurrencyConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `members[].additionalTermsText` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `members[].isCreator` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `members[].invitationStatus` | Sí | `string` | valores: `PENDING`, `ACCEPTED`, `REJECTED` | Sin descripción específica en el contrato OpenAPI. | `PENDING` |
| `members[].respondedAt` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 401 | `UNAUTHENTICATED` | La cuenta no tiene un perfil profesional asociado | Excepción explícita en src/modules/medical_groups/services/medical-groups.service.ts |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PRACTITIONER, CLINICIAN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Grupo médico no encontrado | Excepción explícita en src/modules/medical_groups/services/medical-groups.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El expediente ya está cerrado y es inmutable | Excepción explícita en src/modules/medical_groups/services/medical-groups.service.ts |
| 422 | `PRECONDITION_FAILED` | Todavía no se realizó la cita: las notas del procedimiento se cargan después | Excepción explícita en src/modules/medical_groups/services/medical-groups.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/medical-groups/{id}/exercise-notes"
}
```

---

## 5. POST /medical-groups/{id}/members/{memberId}/respond

- **Módulo:** `medical_groups`
- **Etiqueta OpenAPI:** `medical-groups`
- **Nombre:** Aceptar o rechazar la invitación a un cargo del grupo
- **Operation ID:** `MedicalGroupsController_respondToInvitation`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [MedicalGroupsController.respondToInvitation](../../src/modules/medical_groups/controllers/medical-groups.controller.ts)

### Descripción de negocio

Aceptar o rechazar la invitación a un cargo del grupo. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: AC-21-02/03: responder una invitación (solicitud enviada/recibida).

### Descripción del sistema

NestJS resuelve `POST /medical-groups/{id}/members/{memberId}/respond` en `MedicalGroupsController_respondToInvitation`. El controlador delega en `MedicalGroupsService.respondToInvitation`. Valida el body como `RespondMedicalGroupInvitationDto` y consume `application/json`. El tipo de retorno estático es `Promise<MedicalGroupDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `memberId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RespondMedicalGroupInvitationDto`; los campos opcionales se omiten.

```http
POST /medical-groups/00000000-0000-4000-8000-000000000001/members/00000000-0000-4000-8000-000000000001/respond HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "decision": "ACCEPTED"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PRACTITIONER`, `CLINICIAN`.
- Deben ser UUID válidos: `id`, `memberId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `decision` | Sí | `string` | valores: `ACCEPTED`, `REJECTED` | Sin descripción específica en el contrato OpenAPI. | `ACCEPTED` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /medical-groups/00000000-0000-4000-8000-000000000001/members/00000000-0000-4000-8000-000000000001/respond HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "decision": "ACCEPTED"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<MedicalGroupDto>` | No |
| 400 | Operación completada correctamente. | `Promise<MedicalGroupDto>` | No |
| 401 | Operación completada correctamente. | `Promise<MedicalGroupDto>` | No |
| 403 | Operación completada correctamente. | `Promise<MedicalGroupDto>` | No |
| 404 | Operación completada correctamente. | `Promise<MedicalGroupDto>` | No |
| 409 | Operación completada correctamente. | `Promise<MedicalGroupDto>` | No |
| 413 | Operación completada correctamente. | `Promise<MedicalGroupDto>` | No |
| 422 | Operación completada correctamente. | `Promise<MedicalGroupDto>` | No |
| 429 | Operación completada correctamente. | `Promise<MedicalGroupDto>` | No |
| 500 | Operación completada correctamente. | `Promise<MedicalGroupDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `MedicalGroupDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "serviceCatalogId": "00000000-0000-4000-8000-000000000001",
  "requestingPractitionerId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "conditionId": "00000000-0000-4000-8000-000000000001",
  "scheduledAt": "2026-07-31T12:00:00.000Z",
  "locationText": "valor-ejemplo",
  "notesText": "Texto descriptivo de ejemplo",
  "termsText": "valor-ejemplo",
  "status": "PENDING_TEAM",
  "exerciseNotesText": "Texto descriptivo de ejemplo",
  "exerciseNotesUpdatedAt": "2026-07-31T12:00:00.000Z",
  "proposedRescheduleAt": "2026-07-31T12:00:00.000Z",
  "proposedByPractitionerId": "00000000-0000-4000-8000-000000000001",
  "isRealized": true,
  "canEditExerciseNotes": true,
  "isClosed": true,
  "createdAt": "2026-07-31T12:00:00.000Z",
  "members": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
      "roleTitle": "valor-ejemplo",
      "agreedPaymentAmount": "valor-ejemplo",
      "agreedPaymentCurrencyConceptId": "00000000-0000-4000-8000-000000000001",
      "additionalTermsText": "valor-ejemplo",
      "isCreator": true,
      "invitationStatus": "PENDING",
      "respondedAt": "2026-07-31T12:00:00.000Z"
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `serviceCatalogId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `requestingPractitionerId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `conditionId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `scheduledAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `locationText` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `notesText` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `termsText` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `status` | Sí | `string` | valores: `PENDING_TEAM`, `SCHEDULED`, `RESCHEDULE_PENDING`, `CLOSED` | Sin descripción específica en el contrato OpenAPI. | `PENDING_TEAM` |
| `exerciseNotesText` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `exerciseNotesUpdatedAt` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `proposedRescheduleAt` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `proposedByPractitionerId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `isRealized` | Sí | `boolean` | Sin restricción adicional declarada | Derivado en el servidor: ya pasó la fecha de realización. | `true` |
| `canEditExerciseNotes` | Sí | `boolean` | Sin restricción adicional declarada | Derivado: todavía se pueden subir notas del procedimiento. | `true` |
| `isClosed` | Sí | `boolean` | Sin restricción adicional declarada | Derivado: pasó la ventana de una semana — expediente inmutable (AC-21-19). | `true` |
| `createdAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `members` | Sí | `array<MedicalGroupMemberDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","practitionerProfileId":"00000000-0000-4000-8000-000000000001","roleTitle":"valor-ejemplo","agreedPaymentAmount":"valor-ejemplo","agreedPaymentCurrencyConceptId":"00000000-0000-4000-8000-000000000001","additionalTermsText":"valor-ejemplo","isCreator":true,"invitationStatus":"PENDING","respondedAt":"2026-07-31T12:00:00.000Z"}]` |
| `members[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `members[].practitionerProfileId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `members[].roleTitle` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `members[].agreedPaymentAmount` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `members[].agreedPaymentCurrencyConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `members[].additionalTermsText` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `members[].isCreator` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `members[].invitationStatus` | Sí | `string` | valores: `PENDING`, `ACCEPTED`, `REJECTED` | Sin descripción específica en el contrato OpenAPI. | `PENDING` |
| `members[].respondedAt` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 401 | `UNAUTHENTICATED` | La cuenta no tiene un perfil profesional asociado | Excepción explícita en src/modules/medical_groups/services/medical-groups.service.ts |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PRACTITIONER, CLINICIAN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Grupo médico no encontrado | Excepción explícita en src/modules/medical_groups/services/medical-groups.service.ts |
| 404 | `NOT_FOUND` | Solicitud no encontrada | Excepción explícita en src/modules/medical_groups/services/medical-groups.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Esta solicitud ya fue respondida | Excepción explícita en src/modules/medical_groups/services/medical-groups.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/medical-groups/{id}/members/{memberId}/respond"
}
```

---

## 6. POST /medical-groups/{id}/reschedule-requests

- **Módulo:** `medical_groups`
- **Etiqueta OpenAPI:** `medical-groups`
- **Nombre:** Solicitar cambio de horario
- **Operation ID:** `MedicalGroupsController_requestReschedule`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [MedicalGroupsController.requestReschedule](../../src/modules/medical_groups/controllers/medical-groups.controller.ts)

### Descripción de negocio

Solicitar cambio de horario. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: AC-21-17/18: "Solicitar cambio de horario".

### Descripción del sistema

NestJS resuelve `POST /medical-groups/{id}/reschedule-requests` en `MedicalGroupsController_requestReschedule`. El controlador delega en `MedicalGroupsService.requestReschedule`. Valida el body como `RequestMedicalGroupRescheduleDto` y consume `application/json`. El tipo de retorno estático es `Promise<MedicalGroupDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RequestMedicalGroupRescheduleDto`; los campos opcionales se omiten.

```http
POST /medical-groups/00000000-0000-4000-8000-000000000001/reschedule-requests HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "proposedAt": "2026-07-31T12:00:00.000Z"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PRACTITIONER`, `CLINICIAN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `proposedAt` | Sí | `string` | formato `date-time` | Nueva fecha propuesta, ISO 8601 | `2026-07-31T12:00:00.000Z` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /medical-groups/00000000-0000-4000-8000-000000000001/reschedule-requests HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "proposedAt": "2026-07-31T12:00:00.000Z"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<MedicalGroupDto>` | No |
| 400 | Operación completada correctamente. | `Promise<MedicalGroupDto>` | No |
| 401 | Operación completada correctamente. | `Promise<MedicalGroupDto>` | No |
| 403 | Operación completada correctamente. | `Promise<MedicalGroupDto>` | No |
| 404 | Operación completada correctamente. | `Promise<MedicalGroupDto>` | No |
| 409 | Operación completada correctamente. | `Promise<MedicalGroupDto>` | No |
| 413 | Operación completada correctamente. | `Promise<MedicalGroupDto>` | No |
| 422 | Operación completada correctamente. | `Promise<MedicalGroupDto>` | No |
| 429 | Operación completada correctamente. | `Promise<MedicalGroupDto>` | No |
| 500 | Operación completada correctamente. | `Promise<MedicalGroupDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `MedicalGroupDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "serviceCatalogId": "00000000-0000-4000-8000-000000000001",
  "requestingPractitionerId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "conditionId": "00000000-0000-4000-8000-000000000001",
  "scheduledAt": "2026-07-31T12:00:00.000Z",
  "locationText": "valor-ejemplo",
  "notesText": "Texto descriptivo de ejemplo",
  "termsText": "valor-ejemplo",
  "status": "PENDING_TEAM",
  "exerciseNotesText": "Texto descriptivo de ejemplo",
  "exerciseNotesUpdatedAt": "2026-07-31T12:00:00.000Z",
  "proposedRescheduleAt": "2026-07-31T12:00:00.000Z",
  "proposedByPractitionerId": "00000000-0000-4000-8000-000000000001",
  "isRealized": true,
  "canEditExerciseNotes": true,
  "isClosed": true,
  "createdAt": "2026-07-31T12:00:00.000Z",
  "members": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
      "roleTitle": "valor-ejemplo",
      "agreedPaymentAmount": "valor-ejemplo",
      "agreedPaymentCurrencyConceptId": "00000000-0000-4000-8000-000000000001",
      "additionalTermsText": "valor-ejemplo",
      "isCreator": true,
      "invitationStatus": "PENDING",
      "respondedAt": "2026-07-31T12:00:00.000Z"
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `serviceCatalogId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `requestingPractitionerId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `conditionId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `scheduledAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `locationText` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `notesText` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `termsText` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `status` | Sí | `string` | valores: `PENDING_TEAM`, `SCHEDULED`, `RESCHEDULE_PENDING`, `CLOSED` | Sin descripción específica en el contrato OpenAPI. | `PENDING_TEAM` |
| `exerciseNotesText` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `exerciseNotesUpdatedAt` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `proposedRescheduleAt` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `proposedByPractitionerId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `isRealized` | Sí | `boolean` | Sin restricción adicional declarada | Derivado en el servidor: ya pasó la fecha de realización. | `true` |
| `canEditExerciseNotes` | Sí | `boolean` | Sin restricción adicional declarada | Derivado: todavía se pueden subir notas del procedimiento. | `true` |
| `isClosed` | Sí | `boolean` | Sin restricción adicional declarada | Derivado: pasó la ventana de una semana — expediente inmutable (AC-21-19). | `true` |
| `createdAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `members` | Sí | `array<MedicalGroupMemberDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","practitionerProfileId":"00000000-0000-4000-8000-000000000001","roleTitle":"valor-ejemplo","agreedPaymentAmount":"valor-ejemplo","agreedPaymentCurrencyConceptId":"00000000-0000-4000-8000-000000000001","additionalTermsText":"valor-ejemplo","isCreator":true,"invitationStatus":"PENDING","respondedAt":"2026-07-31T12:00:00.000Z"}]` |
| `members[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `members[].practitionerProfileId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `members[].roleTitle` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `members[].agreedPaymentAmount` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `members[].agreedPaymentCurrencyConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `members[].additionalTermsText` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `members[].isCreator` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `members[].invitationStatus` | Sí | `string` | valores: `PENDING`, `ACCEPTED`, `REJECTED` | Sin descripción específica en el contrato OpenAPI. | `PENDING` |
| `members[].respondedAt` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 401 | `UNAUTHENTICATED` | La cuenta no tiene un perfil profesional asociado | Excepción explícita en src/modules/medical_groups/services/medical-groups.service.ts |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PRACTITIONER, CLINICIAN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Grupo médico no encontrado | Excepción explícita en src/modules/medical_groups/services/medical-groups.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El expediente ya está cerrado y es inmutable | Excepción explícita en src/modules/medical_groups/services/medical-groups.service.ts |
| 422 | `PRECONDITION_FAILED` | Sólo se puede solicitar cambio de horario sobre una cita programada y aún no realizada | Excepción explícita en src/modules/medical_groups/services/medical-groups.service.ts |
| 422 | `PRECONDITION_FAILED` | Fecha propuesta inválida | Excepción explícita en src/modules/medical_groups/services/medical-groups.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/medical-groups/{id}/reschedule-requests"
}
```

---

## 7. POST /medical-groups/{id}/reschedule-requests/respond

- **Módulo:** `medical_groups`
- **Etiqueta OpenAPI:** `medical-groups`
- **Nombre:** Resolver la solicitud de cambio de horario
- **Operation ID:** `MedicalGroupsController_respondToReschedule`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [MedicalGroupsController.respondToReschedule](../../src/modules/medical_groups/controllers/medical-groups.controller.ts)

### Descripción de negocio

Resolver la solicitud de cambio de horario. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: AC-21-19/20: el creador acepta o rechaza la fecha propuesta.

### Descripción del sistema

NestJS resuelve `POST /medical-groups/{id}/reschedule-requests/respond` en `MedicalGroupsController_respondToReschedule`. El controlador delega en `MedicalGroupsService.respondToReschedule`. Valida el body como `RespondMedicalGroupRescheduleDto` y consume `application/json`. El tipo de retorno estático es `Promise<MedicalGroupDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RespondMedicalGroupRescheduleDto`; los campos opcionales se omiten.

```http
POST /medical-groups/00000000-0000-4000-8000-000000000001/reschedule-requests/respond HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "decision": "ACCEPTED"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PRACTITIONER`, `CLINICIAN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `decision` | Sí | `string` | valores: `ACCEPTED`, `REJECTED` | Sin descripción específica en el contrato OpenAPI. | `ACCEPTED` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /medical-groups/00000000-0000-4000-8000-000000000001/reschedule-requests/respond HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "decision": "ACCEPTED"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<MedicalGroupDto>` | No |
| 400 | Operación completada correctamente. | `Promise<MedicalGroupDto>` | No |
| 401 | Operación completada correctamente. | `Promise<MedicalGroupDto>` | No |
| 403 | Operación completada correctamente. | `Promise<MedicalGroupDto>` | No |
| 404 | Operación completada correctamente. | `Promise<MedicalGroupDto>` | No |
| 409 | Operación completada correctamente. | `Promise<MedicalGroupDto>` | No |
| 413 | Operación completada correctamente. | `Promise<MedicalGroupDto>` | No |
| 422 | Operación completada correctamente. | `Promise<MedicalGroupDto>` | No |
| 429 | Operación completada correctamente. | `Promise<MedicalGroupDto>` | No |
| 500 | Operación completada correctamente. | `Promise<MedicalGroupDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `MedicalGroupDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "serviceCatalogId": "00000000-0000-4000-8000-000000000001",
  "requestingPractitionerId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "conditionId": "00000000-0000-4000-8000-000000000001",
  "scheduledAt": "2026-07-31T12:00:00.000Z",
  "locationText": "valor-ejemplo",
  "notesText": "Texto descriptivo de ejemplo",
  "termsText": "valor-ejemplo",
  "status": "PENDING_TEAM",
  "exerciseNotesText": "Texto descriptivo de ejemplo",
  "exerciseNotesUpdatedAt": "2026-07-31T12:00:00.000Z",
  "proposedRescheduleAt": "2026-07-31T12:00:00.000Z",
  "proposedByPractitionerId": "00000000-0000-4000-8000-000000000001",
  "isRealized": true,
  "canEditExerciseNotes": true,
  "isClosed": true,
  "createdAt": "2026-07-31T12:00:00.000Z",
  "members": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
      "roleTitle": "valor-ejemplo",
      "agreedPaymentAmount": "valor-ejemplo",
      "agreedPaymentCurrencyConceptId": "00000000-0000-4000-8000-000000000001",
      "additionalTermsText": "valor-ejemplo",
      "isCreator": true,
      "invitationStatus": "PENDING",
      "respondedAt": "2026-07-31T12:00:00.000Z"
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `serviceCatalogId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `requestingPractitionerId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `conditionId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `scheduledAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `locationText` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `notesText` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `termsText` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `status` | Sí | `string` | valores: `PENDING_TEAM`, `SCHEDULED`, `RESCHEDULE_PENDING`, `CLOSED` | Sin descripción específica en el contrato OpenAPI. | `PENDING_TEAM` |
| `exerciseNotesText` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `exerciseNotesUpdatedAt` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `proposedRescheduleAt` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `proposedByPractitionerId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `isRealized` | Sí | `boolean` | Sin restricción adicional declarada | Derivado en el servidor: ya pasó la fecha de realización. | `true` |
| `canEditExerciseNotes` | Sí | `boolean` | Sin restricción adicional declarada | Derivado: todavía se pueden subir notas del procedimiento. | `true` |
| `isClosed` | Sí | `boolean` | Sin restricción adicional declarada | Derivado: pasó la ventana de una semana — expediente inmutable (AC-21-19). | `true` |
| `createdAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `members` | Sí | `array<MedicalGroupMemberDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","practitionerProfileId":"00000000-0000-4000-8000-000000000001","roleTitle":"valor-ejemplo","agreedPaymentAmount":"valor-ejemplo","agreedPaymentCurrencyConceptId":"00000000-0000-4000-8000-000000000001","additionalTermsText":"valor-ejemplo","isCreator":true,"invitationStatus":"PENDING","respondedAt":"2026-07-31T12:00:00.000Z"}]` |
| `members[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `members[].practitionerProfileId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `members[].roleTitle` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `members[].agreedPaymentAmount` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `members[].agreedPaymentCurrencyConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `members[].additionalTermsText` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `members[].isCreator` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `members[].invitationStatus` | Sí | `string` | valores: `PENDING`, `ACCEPTED`, `REJECTED` | Sin descripción específica en el contrato OpenAPI. | `PENDING` |
| `members[].respondedAt` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 401 | `UNAUTHENTICATED` | Sólo quien creó la solicitud puede resolver el cambio de horario propuesto | Excepción explícita en src/modules/medical_groups/services/medical-groups.service.ts |
| 401 | `UNAUTHENTICATED` | La cuenta no tiene un perfil profesional asociado | Excepción explícita en src/modules/medical_groups/services/medical-groups.service.ts |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PRACTITIONER, CLINICIAN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Grupo médico no encontrado | Excepción explícita en src/modules/medical_groups/services/medical-groups.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | No hay ningún cambio de horario pendiente | Excepción explícita en src/modules/medical_groups/services/medical-groups.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/medical-groups/{id}/reschedule-requests/respond"
}
```

---

## 8. GET /medical-groups/patients/{patientProfileId}/conditions

- **Módulo:** `medical_groups`
- **Etiqueta OpenAPI:** `medical-groups`
- **Nombre:** Diagnósticos del paciente para el selector del formulario
- **Operation ID:** `MedicalGroupsController_listPatientConditions`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [MedicalGroupsController.listPatientConditions](../../src/modules/medical_groups/controllers/medical-groups.controller.ts)

### Descripción de negocio

Diagnósticos del paciente para el selector del formulario. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: AC-21-06/07: diagnósticos del paciente, más reciente primero.

### Descripción del sistema

NestJS resuelve `GET /medical-groups/patients/{patientProfileId}/conditions` en `MedicalGroupsController_listPatientConditions`. El controlador delega en `MedicalGroupsService.listPatientConditions`. No recibe body. El tipo de retorno estático es `Promise<MedicalGroupConditionOptionDto[]>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `patientProfileId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /medical-groups/patients/00000000-0000-4000-8000-000000000001/conditions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PRACTITIONER`, `CLINICIAN`.
- Deben ser UUID válidos: `patientProfileId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /medical-groups/patients/00000000-0000-4000-8000-000000000001/conditions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<MedicalGroupConditionOptionDto[]>` | No |
| 400 | Consulta completada correctamente. | `Promise<MedicalGroupConditionOptionDto[]>` | No |
| 401 | Consulta completada correctamente. | `Promise<MedicalGroupConditionOptionDto[]>` | No |
| 403 | Consulta completada correctamente. | `Promise<MedicalGroupConditionOptionDto[]>` | No |
| 404 | Consulta completada correctamente. | `Promise<MedicalGroupConditionOptionDto[]>` | No |
| 429 | Consulta completada correctamente. | `Promise<MedicalGroupConditionOptionDto[]>` | No |
| 500 | Consulta completada correctamente. | `Promise<MedicalGroupConditionOptionDto[]>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `MedicalGroupConditionOptionDto[]`. Ejemplo completo derivado de ese DTO:

```json
[
  {
    "id": "00000000-0000-4000-8000-000000000001",
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo",
    "onsetAt": "2026-07-31T12:00:00.000Z",
    "isMostRecent": true
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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PRACTITIONER, CLINICIAN. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | SIN_ACCESO_A_LA_HISTORIA | Excepción explícita en src/modules/clinical/services/clinical-read.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/medical-groups/patients/{patientProfileId}/conditions"
}
```

---

