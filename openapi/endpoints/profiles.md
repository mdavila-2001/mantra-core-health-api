<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `profiles`

Referencia exhaustiva de 32 operación(es) del módulo `profiles`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `profiles-affiliations`, `profiles-patients`, `profiles-practitioners`
- **Controladores:** `ProfilesPatientsController`, `ProfilesPractitionersController`, `TenantPractitionerRequestsController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [POST /profiles/credentials/{credentialId}/verify](#1-post-profiles-credentials-credentialid-verify) — Verificar credencial profesional
2. [GET /profiles/patients](#2-get-profiles-patients) — UC-05-13: listado paginado de pacientes
3. [POST /profiles/patients](#3-post-profiles-patients) — Alta de persona y perfil de paciente
4. [GET /profiles/patients/{profileId}](#4-get-profiles-patients-profileid) — UC-05-14: ficha de filiación de un paciente (F-01)
5. [POST /profiles/patients/{profileId}/identity-links](#5-post-profiles-patients-profileid-identity-links) — Vincular identidad externa de paciente (MPI)
6. [POST /profiles/patients/{profileId}/portal-proxies](#6-post-profiles-patients-profileid-portal-proxies) — Otorgar proxy de portal a un representante
7. [POST /profiles/patients/{profileId}/related-persons](#7-post-profiles-patients-profileid-related-persons) — Registrar persona relacionada / contacto de emergencia
8. [GET /profiles/patients/me](#8-get-profiles-patients-me) — Consultar los propios datos de filiación
9. [PATCH /profiles/patients/me](#9-patch-profiles-patients-me) — Editar los propios datos de filiación
10. [GET /profiles/patients/me/summary](#10-get-profiles-patients-me-summary) — Consultar el resumen propio
11. [POST /profiles/patients/merge](#11-post-profiles-patients-merge) — Fusionar pacientes duplicados
12. [GET /profiles/patients/merge-events](#12-get-profiles-patients-merge-events) — Listar eventos de fusión de pacientes
13. [POST /profiles/patients/merge/{eventId}/reverse](#13-post-profiles-patients-merge-eventid-reverse) — Revertir una fusión de pacientes
14. [POST /profiles/persons/{personId}/account-links](#14-post-profiles-persons-personid-account-links) — Vincular cuenta de portal a una persona
15. [POST /profiles/persons/{personId}/decease](#15-post-profiles-persons-personid-decease) — Registrar defunción y anonimización de una persona
16. [GET /profiles/practitioners](#16-get-profiles-practitioners) — Listar profesionales para la guía, con sus especialidades
17. [POST /profiles/practitioners](#17-post-profiles-practitioners) — Alta de profesional de salud (workforce generalista)
18. [POST /profiles/practitioners/{profileId}/jurisdiction-authorizations](#18-post-profiles-practitioners-profileid-jurisdiction-authorizations) — Registrar/renovar autorización jurisdiccional (licencia)
19. [DELETE /profiles/practitioners/{profileId}/photo](#19-delete-profiles-practitioners-profileid-photo) — Quitar la foto del perfil profesional
20. [PUT /profiles/practitioners/{profileId}/photo](#20-put-profiles-practitioners-profileid-photo) — Fijar la foto del perfil profesional
21. [POST /profiles/practitioners/{profileId}/specialties](#21-post-profiles-practitioners-profileid-specialties) — Agregar especialidad con credencial de soporte
22. [GET /profiles/practitioners/{profileId}/summary](#22-get-profiles-practitioners-profileid-summary) — Consultar el perfil profesional de un colega (ficha de la guía)
23. [PATCH /profiles/practitioners/me](#23-patch-profiles-practitioners-me) — Editar la presentación del propio perfil profesional
24. [GET /profiles/practitioners/me/affiliations](#24-get-profiles-practitioners-me-affiliations) — Historial laboral propio (instituciones donde trabajó)
25. [POST /profiles/practitioners/me/affiliations](#25-post-profiles-practitioners-me-affiliations) — Registrar una afiliación institucional en el historial propio
26. [GET /profiles/practitioners/me/linkable-organizations](#26-get-profiles-practitioners-me-linkable-organizations) — Buscar instituciones del padrón para declarar una afiliación
27. [GET /profiles/practitioners/me/onboarding](#27-get-profiles-practitioners-me-onboarding) — Qué le falta al profesional para completar su alta
28. [GET /profiles/practitioners/me/summary](#28-get-profiles-practitioners-me-summary) — Consultar el perfil profesional propio (trayectoria y actividad)
29. [GET /tenants/{tenantId}/practitioner-requests](#29-get-tenants-tenantid-practitioner-requests) — Solicitudes de médicos que piden atender en la organización
30. [POST /tenants/{tenantId}/practitioner-requests/{affiliationId}/approve](#30-post-tenants-tenantid-practitioner-requests-affiliationid-approve) — Aprobar la solicitud de un profesional
31. [POST /tenants/{tenantId}/practitioner-requests/{affiliationId}/reject](#31-post-tenants-tenantid-practitioner-requests-affiliationid-reject) — Rechazar la solicitud de un profesional
32. [POST /tenants/{tenantId}/practitioner-requests/{affiliationId}/revoke](#32-post-tenants-tenantid-practitioner-requests-affiliationid-revoke) — Dar de baja un vínculo ya aprobado

---

## 1. POST /profiles/credentials/{credentialId}/verify

- **Módulo:** `profiles`
- **Etiqueta OpenAPI:** `profiles-practitioners`
- **Nombre:** Verificar credencial profesional
- **Operation ID:** `ProfilesPractitionersController_verifyCredential`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ProfilesPractitionersController.verifyCredential](../../src/modules/profiles/controllers/profiles-practitioners.controller.ts)

### Descripción de negocio

Verificar credencial profesional. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /profiles/credentials/{credentialId}/verify` en `ProfilesPractitionersController_verifyCredential`. El controlador delega en `ProfilesPractitionersService.verifyCredential`. Valida el body como `VerifyCredentialDto` y consume `application/json`. El tipo de retorno estático es `Promise<CredentialResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `credentialId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `VerifyCredentialDto`; los campos opcionales se omiten.

```http
POST /profiles/credentials/00000000-0000-4000-8000-000000000001/verify HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "decision": "VERIFIED"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `credentialId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `decision` | Sí | `string` | valores: `VERIFIED`, `REJECTED` | Resultado de la verificación | `VERIFIED` |
| `verificationSourceUri` | No | `string` | longitud máxima 2000 | URI de la fuente de verificación consultada (registro del colegio profesional, resolución de la autoridad). OBLIGATORIA cuando la decisión es VERIFIED: habilitar a un profesional sin declarar contra qué se comprobó su matrícula no deja rastro auditable. Para REJECTED es opcional, porque se puede rechazar por defectos de forma del propio documento sin consultar a nadie. | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /profiles/credentials/00000000-0000-4000-8000-000000000001/verify HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "decision": "VERIFIED",
  "verificationSourceUri": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<CredentialResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CredentialResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CredentialResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CredentialResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<CredentialResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CredentialResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CredentialResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CredentialResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CredentialResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CredentialResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CredentialResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "state": "00000000-0000-4000-8000-000000000001",
  "verifiedAt": "2026-07-31T12:00:00.000Z",
  "practitionerVerified": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `state` | Sí | `string` | formato `uuid` | Concept id del estado de la credencial | `00000000-0000-4000-8000-000000000001` |
| `verifiedAt` | No | `string` | formato `date-time` | Valor de verified at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `practitionerVerified` | Sí | `boolean` | Sin restricción adicional declarada | true si al verificar quedó habilitado todo el perfil profesional | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Credencial no encontrada | Excepción explícita en src/modules/profiles/services/profiles-practitioners.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Una credencial verificada debe declarar la fuente consultada | Excepción explícita en src/modules/profiles/services/profiles-practitioners.service.ts |
| 422 | `PRECONDITION_FAILED` | La credencial no está pendiente de verificación | Excepción explícita en src/modules/profiles/services/profiles-practitioners.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/profiles/credentials/{credentialId}/verify"
}
```

---

## 2. GET /profiles/patients

- **Módulo:** `profiles`
- **Etiqueta OpenAPI:** `profiles-patients`
- **Nombre:** UC-05-13: listado paginado de pacientes
- **Operation ID:** `ProfilesPatientsController_searchPatients`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ProfilesPatientsController.searchPatients](../../src/modules/profiles/controllers/profiles-patients.controller.ts)

### Descripción de negocio

UC-05-13: listado paginado de pacientes. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-05-13: listado de pacientes para el personal administrativo. Va declarado **después** de `patients/me/summary` a propósito: Nest resuelve las rutas por orden de declaración y `patients/:profileId` capturaría `patients/me` si fuera antes.

### Descripción del sistema

NestJS resuelve `GET /profiles/patients` en `ProfilesPatientsController_searchPatients`. El controlador delega en `ProfilesPatientsService.searchPatients`. No recibe body. El tipo de retorno estático es `Promise<SearchPatientsResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `q` | query | No | `string` | Sin restricción adicional declarada | Texto a buscar en el código de paciente o el nombre | `valor-ejemplo` |
| `cursor` | query | No | `string` | Sin restricción adicional declarada | Cursor opaco devuelto por la página anterior | `valor-ejemplo` |
| `limit` | query | No | `number` | Sin restricción adicional declarada | Tope de resultados (por defecto 50) | `1` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /profiles/patients HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /profiles/patients?q=valor-ejemplo&cursor=valor-ejemplo&limit=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<SearchPatientsResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<SearchPatientsResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<SearchPatientsResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<SearchPatientsResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<SearchPatientsResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<SearchPatientsResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `SearchPatientsResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "profileId": "00000000-0000-4000-8000-000000000001",
      "personId": "00000000-0000-4000-8000-000000000001",
      "patientCode": "CODIGO_EJEMPLO",
      "displayName": "Nombre de ejemplo",
      "birthDate": "2026-07-31",
      "personStatusConceptId": "00000000-0000-4000-8000-000000000001",
      "deceased": true
    }
  ],
  "count": 1,
  "limit": 1,
  "nextCursor": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<PatientListItemDto>` | Sin restricción adicional declarada | Valor de items mantenido por la instancia. | `[{"profileId":"00000000-0000-4000-8000-000000000001","personId":"00000000-0000-4000-8000-000000000001","patientCode":"CODIGO_EJEMPLO","displayName":"Nombre de ejemplo","birthDate":"2026-07-31","personStatusConceptId":"00000000-0000-4000-8000-000000000001","deceased":true}]` |
| `items[].profileId` | Sí | `string` | formato `uuid` | Identificador asociado a profile. | `00000000-0000-4000-8000-000000000001` |
| `items[].personId` | Sí | `string` | formato `uuid` | Identificador asociado a person. | `00000000-0000-4000-8000-000000000001` |
| `items[].patientCode` | Sí | `string` | Sin restricción adicional declarada | Código único de paciente | `CODIGO_EJEMPLO` |
| `items[].displayName` | No | `string` | Sin restricción adicional declarada | Nombre visible de la persona | `Nombre de ejemplo` |
| `items[].birthDate` | No | `string` | formato `date` | Valor de birth date mantenido por la instancia. | `2026-07-31` |
| `items[].personStatusConceptId` | No | `string` | formato `uuid` | Concept id del estado de la persona | `00000000-0000-4000-8000-000000000001` |
| `items[].deceased` | Sí | `boolean` | Sin restricción adicional declarada | Si la persona está registrada como fallecida. Es un booleano derivado y no un concepto: una lista de pacientes tiene que poder marcarlo sin resolver terminología | `true` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Cantidad devuelta en esta página | `1` |
| `limit` | Sí | `number` | Sin restricción adicional declarada | Tope de resultados aplicado | `1` |
| `nextCursor` | No | `string` | admite null | Cursor opaco para la página siguiente; `null` cuando no hay más | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/profiles/patients"
}
```

---

## 3. POST /profiles/patients

- **Módulo:** `profiles`
- **Etiqueta OpenAPI:** `profiles-patients`
- **Nombre:** Alta de persona y perfil de paciente
- **Operation ID:** `ProfilesPatientsController_registerPatient`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ProfilesPatientsController.registerPatient](../../src/modules/profiles/controllers/profiles-patients.controller.ts)

### Descripción de negocio

Alta de persona y perfil de paciente. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /profiles/patients` en `ProfilesPatientsController_registerPatient`. El controlador delega en `ProfilesPatientsService.registerPatient`. Valida el body como `CreatePatientDto` y consume `application/json`. El tipo de retorno estático es `Promise<PatientProfileResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreatePatientDto`; los campos opcionales se omiten.

```http
POST /profiles/patients HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "patientCode": "CODIGO_EJEMPLO"
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
| `patientCode` | Sí | `string` | longitud mínima 1; longitud máxima 100 | Código único de paciente (patient_code, UK) | `CODIGO_EJEMPLO` |
| `displayName` | No | `string` | longitud máxima 300 | Nombre visible de la persona | `Nombre de ejemplo` |
| `birthDate` | No | `string` | formato `date` | Fecha de nacimiento (ISO 8601) | `2026-07-31` |
| `administrativeGenderConceptId` | No | `string` | formato `uuid` | Concept id de género administrativo | `00000000-0000-4000-8000-000000000001` |
| `sexAtBirthConceptId` | No | `string` | formato `uuid` | Concept id de sexo al nacer | `00000000-0000-4000-8000-000000000001` |
| `masterPatientIndexCode` | No | `string` | longitud máxima 100 | Código MPI maestro (UK) | `CODIGO_EJEMPLO` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /profiles/patients HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "patientCode": "CODIGO_EJEMPLO",
  "displayName": "Nombre de ejemplo",
  "birthDate": "2026-07-31",
  "administrativeGenderConceptId": "00000000-0000-4000-8000-000000000001",
  "sexAtBirthConceptId": "00000000-0000-4000-8000-000000000001",
  "masterPatientIndexCode": "CODIGO_EJEMPLO"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<PatientProfileResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<PatientProfileResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PatientProfileResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PatientProfileResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PatientProfileResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<PatientProfileResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PatientProfileResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PatientProfileResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PatientProfileResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PatientProfileResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "profileId": "00000000-0000-4000-8000-000000000001",
  "personId": "00000000-0000-4000-8000-000000000001",
  "patientCode": "CODIGO_EJEMPLO",
  "recordLinkageStatus": "00000000-0000-4000-8000-000000000001",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `profileId` | Sí | `string` | formato `uuid` | Identificador asociado a profile. | `00000000-0000-4000-8000-000000000001` |
| `personId` | Sí | `string` | formato `uuid` | Identificador asociado a person. | `00000000-0000-4000-8000-000000000001` |
| `patientCode` | Sí | `string` | Sin restricción adicional declarada | Valor de patient code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `recordLinkageStatus` | Sí | `string` | formato `uuid` | Concept id del estado de vinculación | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | El patient_code ya está en uso | Excepción explícita en src/modules/profiles/services/profiles-patients.service.ts |
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
  "path": "/profiles/patients"
}
```

---

## 4. GET /profiles/patients/{profileId}

- **Módulo:** `profiles`
- **Etiqueta OpenAPI:** `profiles-patients`
- **Nombre:** UC-05-14: ficha de filiación de un paciente (F-01)
- **Operation ID:** `ProfilesPatientsController_getPatient`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ProfilesPatientsController.getPatient](../../src/modules/profiles/controllers/profiles-patients.controller.ts)

### Descripción de negocio

UC-05-14: ficha de filiación de un paciente (F-01). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-05-14: ficha de filiación del paciente (F-01).

### Descripción del sistema

NestJS resuelve `GET /profiles/patients/{profileId}` en `ProfilesPatientsController_getPatient`. El controlador delega en `ProfilesPatientsService.getPatientById`. No recibe body. El tipo de retorno estático es `Promise<PatientDetailResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `profileId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /profiles/patients/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `profileId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /profiles/patients/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PatientDetailResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<PatientDetailResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<PatientDetailResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<PatientDetailResponseDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<PatientDetailResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<PatientDetailResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<PatientDetailResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PatientDetailResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "profileId": "00000000-0000-4000-8000-000000000001",
  "personId": "00000000-0000-4000-8000-000000000001",
  "patientCode": "CODIGO_EJEMPLO",
  "masterPatientIndexCode": "CODIGO_EJEMPLO",
  "displayName": "Nombre de ejemplo",
  "birthDate": "2026-07-31",
  "administrativeGenderConceptId": "00000000-0000-4000-8000-000000000001",
  "sexAtBirthConceptId": "00000000-0000-4000-8000-000000000001",
  "genderIdentityConceptId": "00000000-0000-4000-8000-000000000001",
  "nationalityConceptId": "00000000-0000-4000-8000-000000000001",
  "preferredLanguageConceptId": "00000000-0000-4000-8000-000000000001",
  "personStatusConceptId": "00000000-0000-4000-8000-000000000001",
  "vitalStatusConceptId": "00000000-0000-4000-8000-000000000001",
  "deceasedAt": "2026-07-31T12:00:00.000Z",
  "aboGroupConceptId": "00000000-0000-4000-8000-000000000001",
  "rhFactorConceptId": "00000000-0000-4000-8000-000000000001",
  "insuranceStatusConceptId": "00000000-0000-4000-8000-000000000001",
  "clinicalLanguageConceptId": "00000000-0000-4000-8000-000000000001",
  "recordLinkageStatusConceptId": "00000000-0000-4000-8000-000000000001",
  "relatedPersons": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "displayName": "Nombre de ejemplo",
      "relationshipConceptId": "00000000-0000-4000-8000-000000000001",
      "isEmergencyContact": true,
      "isLegalGuardian": true
    }
  ],
  "createdAt": "2026-07-31T12:00:00.000Z",
  "updatedAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `profileId` | Sí | `string` | formato `uuid` | Identificador asociado a profile. | `00000000-0000-4000-8000-000000000001` |
| `personId` | Sí | `string` | formato `uuid` | Identificador asociado a person. | `00000000-0000-4000-8000-000000000001` |
| `patientCode` | Sí | `string` | Sin restricción adicional declarada | Valor de patient code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `masterPatientIndexCode` | No | `string` | Sin restricción adicional declarada | Valor de master patient index code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `displayName` | No | `string` | Sin restricción adicional declarada | Valor de display name mantenido por la instancia. | `Nombre de ejemplo` |
| `birthDate` | No | `string` | formato `date` | Valor de birth date mantenido por la instancia. | `2026-07-31` |
| `administrativeGenderConceptId` | No | `string` | formato `uuid` | Identificador asociado a administrative gender concept. | `00000000-0000-4000-8000-000000000001` |
| `sexAtBirthConceptId` | No | `string` | formato `uuid` | Identificador asociado a sex at birth concept. | `00000000-0000-4000-8000-000000000001` |
| `genderIdentityConceptId` | No | `string` | formato `uuid` | Identificador asociado a gender identity concept. | `00000000-0000-4000-8000-000000000001` |
| `nationalityConceptId` | No | `string` | formato `uuid` | Identificador asociado a nationality concept. | `00000000-0000-4000-8000-000000000001` |
| `preferredLanguageConceptId` | No | `string` | formato `uuid` | Identificador asociado a preferred language concept. | `00000000-0000-4000-8000-000000000001` |
| `personStatusConceptId` | No | `string` | formato `uuid` | Identificador asociado a person status concept. | `00000000-0000-4000-8000-000000000001` |
| `vitalStatusConceptId` | No | `string` | formato `uuid` | Identificador asociado a vital status concept. | `00000000-0000-4000-8000-000000000001` |
| `deceasedAt` | No | `string` | formato `date-time` | Valor de deceased at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `aboGroupConceptId` | No | `string` | formato `uuid` | Identificador asociado a abo group concept. | `00000000-0000-4000-8000-000000000001` |
| `rhFactorConceptId` | No | `string` | formato `uuid` | Identificador asociado a rh factor concept. | `00000000-0000-4000-8000-000000000001` |
| `insuranceStatusConceptId` | No | `string` | formato `uuid` | Identificador asociado a insurance status concept. | `00000000-0000-4000-8000-000000000001` |
| `clinicalLanguageConceptId` | No | `string` | formato `uuid` | Identificador asociado a clinical language concept. | `00000000-0000-4000-8000-000000000001` |
| `recordLinkageStatusConceptId` | No | `string` | formato `uuid` | Identificador asociado a record linkage status concept. | `00000000-0000-4000-8000-000000000001` |
| `relatedPersons` | Sí | `array<RelatedPersonItemDto>` | Sin restricción adicional declarada | Contactos y representantes registrados (UC-05-10) | `[{"id":"00000000-0000-4000-8000-000000000001","displayName":"Nombre de ejemplo","relationshipConceptId":"00000000-0000-4000-8000-000000000001","isEmergencyContact":true,"isLegalGuardian":true}]` |
| `relatedPersons[].id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `relatedPersons[].displayName` | No | `string` | Sin restricción adicional declarada | Valor de display name mantenido por la instancia. | `Nombre de ejemplo` |
| `relatedPersons[].relationshipConceptId` | No | `string` | formato `uuid` | Identificador asociado a relationship concept. | `00000000-0000-4000-8000-000000000001` |
| `relatedPersons[].isEmergencyContact` | Sí | `boolean` | Sin restricción adicional declarada | Valor de is emergency contact mantenido por la instancia. | `true` |
| `relatedPersons[].isLegalGuardian` | Sí | `boolean` | Sin restricción adicional declarada | Valor de is legal guardian mantenido por la instancia. | `true` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |
| `updatedAt` | Sí | `string` | formato `date-time` | Fecha y hora de la última actualización. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Paciente no encontrado | Excepción explícita en src/modules/profiles/services/profiles-patients.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/profiles/patients/{profileId}"
}
```

---

## 5. POST /profiles/patients/{profileId}/identity-links

- **Módulo:** `profiles`
- **Etiqueta OpenAPI:** `profiles-patients`
- **Nombre:** Vincular identidad externa de paciente (MPI)
- **Operation ID:** `ProfilesPatientsController_addIdentityLink`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ProfilesPatientsController.addIdentityLink](../../src/modules/profiles/controllers/profiles-patients.controller.ts)

### Descripción de negocio

Vincular identidad externa de paciente (MPI). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /profiles/patients/{profileId}/identity-links` en `ProfilesPatientsController_addIdentityLink`. El controlador delega en `ProfilesPatientsService.addIdentityLink`. Valida el body como `AddIdentityLinkDto` y consume `application/json`. El tipo de retorno estático es `Promise<IdentityLinkResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `profileId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `AddIdentityLinkDto`; los campos opcionales se omiten.

```http
POST /profiles/patients/00000000-0000-4000-8000-000000000001/identity-links HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "sourceTenantId": "00000000-0000-4000-8000-000000000001",
  "sourcePatientIdentifier": "valor-ejemplo",
  "confidenceScore": 1
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `profileId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `sourceTenantId` | Sí | `string` | formato `uuid` | Tenant origen de la identidad externa | `00000000-0000-4000-8000-000000000001` |
| `sourcePatientIdentifier` | Sí | `string` | longitud mínima 1; longitud máxima 200 | Identificador del paciente en el sistema origen | `valor-ejemplo` |
| `sourceSystemUri` | No | `string` | longitud máxima 2000 | URI del sistema origen | `valor-ejemplo` |
| `linkTypeConceptId` | No | `string` | formato `uuid` | Concept id del tipo de vínculo | `00000000-0000-4000-8000-000000000001` |
| `confidenceScore` | Sí | `number` | mínimo 0; máximo 1 | Puntuación de confianza [0..1] | `1` |
| `verified` | No | `boolean` | Sin restricción adicional declarada | Marca el vínculo como verificado | `true` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /profiles/patients/00000000-0000-4000-8000-000000000001/identity-links HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "sourceTenantId": "00000000-0000-4000-8000-000000000001",
  "sourcePatientIdentifier": "valor-ejemplo",
  "sourceSystemUri": "valor-ejemplo",
  "linkTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "confidenceScore": 1,
  "verified": true
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<IdentityLinkResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<IdentityLinkResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<IdentityLinkResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<IdentityLinkResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<IdentityLinkResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<IdentityLinkResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<IdentityLinkResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<IdentityLinkResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<IdentityLinkResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<IdentityLinkResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `IdentityLinkResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "verificationStatus": "00000000-0000-4000-8000-000000000001",
  "created": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | Sí | `string` | formato `uuid` | Identificador asociado a patient profile. | `00000000-0000-4000-8000-000000000001` |
| `verificationStatus` | Sí | `string` | formato `uuid` | Concept id del estado de verificación | `00000000-0000-4000-8000-000000000001` |
| `created` | Sí | `boolean` | Sin restricción adicional declarada | true si el registro se creó, false si se actualizó (upsert) | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Paciente no encontrado | Excepción explícita en src/modules/profiles/services/profiles-patients.service.ts |
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
  "path": "/profiles/patients/{profileId}/identity-links"
}
```

---

## 6. POST /profiles/patients/{profileId}/portal-proxies

- **Módulo:** `profiles`
- **Etiqueta OpenAPI:** `profiles-patients`
- **Nombre:** Otorgar proxy de portal a un representante
- **Operation ID:** `ProfilesPatientsController_grantPortalProxy`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ProfilesPatientsController.grantPortalProxy](../../src/modules/profiles/controllers/profiles-patients.controller.ts)

### Descripción de negocio

Otorgar proxy de portal a un representante. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /profiles/patients/{profileId}/portal-proxies` en `ProfilesPatientsController_grantPortalProxy`. El controlador delega en `ProfilesPatientsService.grantPortalProxy`. Valida el body como `GrantPortalProxyDto` y consume `application/json`. El tipo de retorno estático es `Promise<PortalProxyResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `profileId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `GrantPortalProxyDto`; los campos opcionales se omiten.

```http
POST /profiles/patients/00000000-0000-4000-8000-000000000001/portal-proxies HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "proxyUserId": "00000000-0000-4000-8000-000000000001",
  "scopeValueSetId": "00000000-0000-4000-8000-000000000001",
  "legalBasisRecordId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `profileId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `proxyUserId` | Sí | `string` | formato `uuid` | Usuario representante al que se delega el acceso | `00000000-0000-4000-8000-000000000001` |
| `relatedPersonId` | No | `string` | formato `uuid` | Persona relacionada que respalda el proxy (UC-05-10) | `00000000-0000-4000-8000-000000000001` |
| `scopeValueSetId` | Sí | `string` | formato `uuid` | Value set que gobierna el alcance delegado | `00000000-0000-4000-8000-000000000001` |
| `legalBasisRecordId` | Sí | `string` | formato `uuid` | Registro de base legal que respalda el acceso | `00000000-0000-4000-8000-000000000001` |
| `validFrom` | No | `string` | formato `date-time` | Vigente desde (ISO date-time) | `2026-07-31T12:00:00.000Z` |
| `validTo` | No | `string` | formato `date-time` | Vigente hasta (ISO date-time) | `2026-07-31T12:00:00.000Z` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /profiles/patients/00000000-0000-4000-8000-000000000001/portal-proxies HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "proxyUserId": "00000000-0000-4000-8000-000000000001",
  "relatedPersonId": "00000000-0000-4000-8000-000000000001",
  "scopeValueSetId": "00000000-0000-4000-8000-000000000001",
  "legalBasisRecordId": "00000000-0000-4000-8000-000000000001",
  "validFrom": "2026-07-31T12:00:00.000Z",
  "validTo": "2026-07-31T12:00:00.000Z"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<PortalProxyResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<PortalProxyResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PortalProxyResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PortalProxyResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<PortalProxyResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PortalProxyResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<PortalProxyResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PortalProxyResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PortalProxyResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PortalProxyResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PortalProxyResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "proxyUserId": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | Sí | `string` | formato `uuid` | Identificador asociado a patient profile. | `00000000-0000-4000-8000-000000000001` |
| `proxyUserId` | Sí | `string` | formato `uuid` | Identificador asociado a proxy user. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concept id del estado del proxy | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Paciente no encontrado | Excepción explícita en src/modules/profiles/services/profiles-patients.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La persona relacionada no pertenece al paciente | Excepción explícita en src/modules/profiles/services/profiles-patients.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/profiles/patients/{profileId}/portal-proxies"
}
```

---

## 7. POST /profiles/patients/{profileId}/related-persons

- **Módulo:** `profiles`
- **Etiqueta OpenAPI:** `profiles-patients`
- **Nombre:** Registrar persona relacionada / contacto de emergencia
- **Operation ID:** `ProfilesPatientsController_addRelatedPerson`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ProfilesPatientsController.addRelatedPerson](../../src/modules/profiles/controllers/profiles-patients.controller.ts)

### Descripción de negocio

Registrar persona relacionada / contacto de emergencia. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /profiles/patients/{profileId}/related-persons` en `ProfilesPatientsController_addRelatedPerson`. El controlador delega en `ProfilesPatientsService.addRelatedPerson`. Valida el body como `AddRelatedPersonDto` y consume `application/json`. El tipo de retorno estático es `Promise<RelatedPersonResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `profileId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `AddRelatedPersonDto`; los campos opcionales se omiten.

```http
POST /profiles/patients/00000000-0000-4000-8000-000000000001/related-persons HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `profileId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `personId` | No | `string` | formato `uuid` | Persona relacionada existente; si se omite se crea una nueva | `00000000-0000-4000-8000-000000000001` |
| `displayName` | No | `string` | longitud máxima 300 | Nombre visible (si se crea la persona relacionada) | `Nombre de ejemplo` |
| `birthDate` | No | `string` | formato `date` | Fecha de nacimiento (ISO date) | `2026-07-31` |
| `relationshipConceptId` | No | `string` | formato `uuid` | Concept id del parentesco/relación | `00000000-0000-4000-8000-000000000001` |
| `isEmergencyContact` | No | `boolean` | Sin restricción adicional declarada | Es contacto de emergencia | `false` |
| `isLegalGuardian` | No | `boolean` | Sin restricción adicional declarada | Es tutor legal (único activo por paciente) | `false` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /profiles/patients/00000000-0000-4000-8000-000000000001/related-persons HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "personId": "00000000-0000-4000-8000-000000000001",
  "displayName": "Nombre de ejemplo",
  "birthDate": "2026-07-31",
  "relationshipConceptId": "00000000-0000-4000-8000-000000000001",
  "isEmergencyContact": false,
  "isLegalGuardian": false
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<RelatedPersonResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<RelatedPersonResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<RelatedPersonResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<RelatedPersonResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<RelatedPersonResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<RelatedPersonResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<RelatedPersonResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<RelatedPersonResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<RelatedPersonResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<RelatedPersonResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `RelatedPersonResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "personId": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | Sí | `string` | formato `uuid` | Identificador asociado a patient profile. | `00000000-0000-4000-8000-000000000001` |
| `personId` | Sí | `string` | formato `uuid` | Identificador asociado a person. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concept id del estado | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Sólo el titular del perfil o la plataforma pueden modificarlo | Excepción explícita en src/modules/profiles/services/profile-ownership.service.ts |
| 404 | `NOT_FOUND` | Paciente no encontrado | Excepción explícita en src/modules/profiles/services/profiles-patients.service.ts |
| 404 | `NOT_FOUND` | Persona relacionada no encontrada | Excepción explícita en src/modules/profiles/services/profiles-patients.service.ts |
| 409 | `CONFLICT` | El paciente ya tiene un tutor legal activo | Excepción explícita en src/modules/profiles/services/profiles-patients.service.ts |
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
  "path": "/profiles/patients/{profileId}/related-persons"
}
```

---

## 8. GET /profiles/patients/me

- **Módulo:** `profiles`
- **Etiqueta OpenAPI:** `profiles-patients`
- **Nombre:** Consultar los propios datos de filiación
- **Operation ID:** `ProfilesPatientsController_getOwnProfile`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ProfilesPatientsController.getOwnProfile](../../src/modules/profiles/controllers/profiles-patients.controller.ts)

### Descripción de negocio

Consultar los propios datos de filiación. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Los propios datos de filiación, tal como los declaró el paciente. Es la lectura que faltaba para poder editarlos: el resumen devuelve el nombre ya compuesto, y con eso un formulario no puede corregir un apellido. Acá viajan sus partes, la fecha de nacimiento, el sexo al nacer, la ocupación, el teléfono vigente y el municipio del domicilio. Sin `@Roles` por lo mismo que el resumen: el sujeto lo resuelve el servidor desde la sesión y no hay parámetro que apunte a otro.

### Descripción del sistema

NestJS resuelve `GET /profiles/patients/me` en `ProfilesPatientsController_getOwnProfile`. El controlador delega en `ProfilesPatientsService.getOwnProfile`. No recibe body. El tipo de retorno estático es `Promise<OwnPatientProfileResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /profiles/patients/me HTTP/1.1
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
GET /profiles/patients/me HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Lo que el paciente declaró al registrarse. Los campos que no declaró llegan ausentes, no `null`. | `Promise<OwnPatientProfileResponseDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<OwnPatientProfileResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<OwnPatientProfileResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<OwnPatientProfileResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<OwnPatientProfileResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<OwnPatientProfileResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `OwnPatientProfileResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "personId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "name": "Nombre de ejemplo",
  "middleName": "Nombre de ejemplo",
  "lastName": "Nombre de ejemplo",
  "motherLastName": "Nombre de ejemplo",
  "displayName": "Nombre de ejemplo",
  "birthDate": "2026-07-31",
  "sexAtBirth": "MALE",
  "occupationFreeText": "valor-ejemplo",
  "phone": "+59170000000",
  "residenceMunicipalityConceptId": "00000000-0000-4000-8000-000000000001",
  "identityVerified": true,
  "patientCode": "CODIGO_EJEMPLO"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `personId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `name` | No | `string` | Sin restricción adicional declarada | Nombre de pila | `Nombre de ejemplo` |
| `middleName` | No | `string` | Sin restricción adicional declarada | Segundo nombre | `Nombre de ejemplo` |
| `lastName` | No | `string` | Sin restricción adicional declarada | Apellido paterno | `Nombre de ejemplo` |
| `motherLastName` | No | `string` | Sin restricción adicional declarada | Apellido materno | `Nombre de ejemplo` |
| `displayName` | No | `string` | Sin restricción adicional declarada | Nombre compuesto por el servidor a partir de las partes. No se edita directamente. | `Nombre de ejemplo` |
| `birthDate` | No | `string` | formato `date` | Fecha sin hora: serializarla como instante la desplazaría un día | `2026-07-31` |
| `sexAtBirth` | No | `string` | valores: `MALE`, `FEMALE`, `INTERSEX`, `UNKNOWN` | Sexo asignado al nacer. Se devuelve el código y no el concept id: es el mismo valor que acepta el alta, y así el formulario no tiene que resolver terminología. | `MALE` |
| `occupationFreeText` | No | `string` | Sin restricción adicional declarada | Ocupación declarada en texto libre | `valor-ejemplo` |
| `phone` | No | `string` | Sin restricción adicional declarada | Teléfono de contacto vigente (`common.contact_points`) | `+59170000000` |
| `residenceMunicipalityConceptId` | No | `string` | formato `uuid` | Municipio del domicilio vigente (catálogo VS_BO_MUNICIPALITY). El departamento lo deriva el servidor. | `00000000-0000-4000-8000-000000000001` |
| `identityVerified` | Sí | `boolean` | Sin restricción adicional declarada | Si el titular tiene una aserción de identidad vigente. Con `false` el perfil llega sin `patientCode`. | `true` |
| `patientCode` | No | `string` | Sin restricción adicional declarada | Código de paciente. Sólo con identidad verificada: ausente mientras `identityVerified` sea `false`. | `CODIGO_EJEMPLO` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Paciente no encontrado | Excepción explícita en src/modules/profiles/services/profiles-patients.service.ts |
| 422 | `PRECONDITION_FAILED` | La cuenta no tiene una persona vinculada | Excepción explícita en src/modules/profiles/services/profiles-patients.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/profiles/patients/me"
}
```

---

## 9. PATCH /profiles/patients/me

- **Módulo:** `profiles`
- **Etiqueta OpenAPI:** `profiles-patients`
- **Nombre:** Editar los propios datos de filiación
- **Operation ID:** `ProfilesPatientsController_updateOwnProfile`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ProfilesPatientsController.updateOwnProfile](../../src/modules/profiles/controllers/profiles-patients.controller.ts)

### Descripción de negocio

Editar los propios datos de filiación. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Editar los propios datos de filiación. Sin `@Roles` por lo mismo que la lectura. Lo editable es lo que la persona **declara** sobre sí misma; el documento de identidad, el correo, la contraseña, el código de paciente y los estados quedan fuera porque tienen su propio circuito.

### Descripción del sistema

NestJS resuelve `PATCH /profiles/patients/me` en `ProfilesPatientsController_updateOwnProfile`. El controlador delega en `ProfilesPatientsService.updateOwnProfile`. Valida el body como `UpdateOwnPatientProfileDto` y consume `application/json`. El tipo de retorno estático es `Promise<OwnPatientProfileResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `UpdateOwnPatientProfileDto`; los campos opcionales se omiten.

```http
PATCH /profiles/patients/me HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `name` | No | `string` | longitud mínima 1; longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `Lucía` |
| `middleName` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `Andrea` |
| `lastName` | No | `string` | longitud mínima 1; longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `Mamani` |
| `motherLastName` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `Quispe` |
| `birthDate` | No | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `sexAtBirth` | No | `string` | valores: `MALE`, `FEMALE`, `INTERSEX`, `UNKNOWN` | Sexo asignado al nacer | `MALE` |
| `occupationFreeText` | No | `string` | longitud máxima 200 | Ocupación en texto libre, para cuando no está en el catálogo. Cadena vacía para borrarla. | `valor-ejemplo` |
| `phone` | No | `string` | longitud máxima 40; patrón runtime `PHONE_PATTERN` | Teléfono de contacto en formato E.164 o nacional: dígitos, espacios, paréntesis, + y guion, mínimo 6 caracteres. Cadena vacía para quedarse sin teléfono. | `+59170000000` |
| `residenceMunicipalityConceptId` | No | `string` | formato `uuid` | Municipio de residencia (catálogo VS_BO_MUNICIPALITY) | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PATCH /profiles/patients/me HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "name": "Lucía",
  "middleName": "Andrea",
  "lastName": "Mamani",
  "motherLastName": "Quispe",
  "birthDate": "2026-07-31",
  "sexAtBirth": "MALE",
  "occupationFreeText": "valor-ejemplo",
  "phone": "+59170000000",
  "residenceMunicipalityConceptId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | El perfil releído. Un cuerpo vacío es válido y devuelve el perfil sin cambios. | `Promise<OwnPatientProfileResponseDto>` | Sí |
| 400 | Operación completada correctamente. | `Promise<OwnPatientProfileResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<OwnPatientProfileResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<OwnPatientProfileResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<OwnPatientProfileResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<OwnPatientProfileResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<OwnPatientProfileResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<OwnPatientProfileResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<OwnPatientProfileResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `OwnPatientProfileResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "personId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "name": "Nombre de ejemplo",
  "middleName": "Nombre de ejemplo",
  "lastName": "Nombre de ejemplo",
  "motherLastName": "Nombre de ejemplo",
  "displayName": "Nombre de ejemplo",
  "birthDate": "2026-07-31",
  "sexAtBirth": "MALE",
  "occupationFreeText": "valor-ejemplo",
  "phone": "+59170000000",
  "residenceMunicipalityConceptId": "00000000-0000-4000-8000-000000000001",
  "identityVerified": true,
  "patientCode": "CODIGO_EJEMPLO"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `personId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `name` | No | `string` | Sin restricción adicional declarada | Nombre de pila | `Nombre de ejemplo` |
| `middleName` | No | `string` | Sin restricción adicional declarada | Segundo nombre | `Nombre de ejemplo` |
| `lastName` | No | `string` | Sin restricción adicional declarada | Apellido paterno | `Nombre de ejemplo` |
| `motherLastName` | No | `string` | Sin restricción adicional declarada | Apellido materno | `Nombre de ejemplo` |
| `displayName` | No | `string` | Sin restricción adicional declarada | Nombre compuesto por el servidor a partir de las partes. No se edita directamente. | `Nombre de ejemplo` |
| `birthDate` | No | `string` | formato `date` | Fecha sin hora: serializarla como instante la desplazaría un día | `2026-07-31` |
| `sexAtBirth` | No | `string` | valores: `MALE`, `FEMALE`, `INTERSEX`, `UNKNOWN` | Sexo asignado al nacer. Se devuelve el código y no el concept id: es el mismo valor que acepta el alta, y así el formulario no tiene que resolver terminología. | `MALE` |
| `occupationFreeText` | No | `string` | Sin restricción adicional declarada | Ocupación declarada en texto libre | `valor-ejemplo` |
| `phone` | No | `string` | Sin restricción adicional declarada | Teléfono de contacto vigente (`common.contact_points`) | `+59170000000` |
| `residenceMunicipalityConceptId` | No | `string` | formato `uuid` | Municipio del domicilio vigente (catálogo VS_BO_MUNICIPALITY). El departamento lo deriva el servidor. | `00000000-0000-4000-8000-000000000001` |
| `identityVerified` | Sí | `boolean` | Sin restricción adicional declarada | Si el titular tiene una aserción de identidad vigente. Con `false` el perfil llega sin `patientCode`. | `true` |
| `patientCode` | No | `string` | Sin restricción adicional declarada | Código de paciente. Sólo con identidad verificada: ausente mientras `identityVerified` sea `false`. | `CODIGO_EJEMPLO` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Paciente no encontrado | Excepción explícita en src/modules/profiles/services/profiles-patients.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La cuenta no tiene una persona vinculada | Excepción explícita en src/modules/profiles/services/profiles-patients.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/profiles/patients/me"
}
```

---

## 10. GET /profiles/patients/me/summary

- **Módulo:** `profiles`
- **Etiqueta OpenAPI:** `profiles-patients`
- **Nombre:** Consultar el resumen propio
- **Operation ID:** `ProfilesPatientsController_getOwnSummary`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ProfilesPatientsController.getOwnSummary](../../src/modules/profiles/controllers/profiles-patients.controller.ts)

### Descripción de negocio

Consultar el resumen propio. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Resumen del propio paciente. No exige identidad verificada: verificarse es un trámite aparte, y el titular ve desde el alta lo que él mismo declaró. La verificación sólo decide si el resumen incluye el código de paciente, y eso lo resuelve el servicio (`identityVerified` en la respuesta).

### Descripción del sistema

NestJS resuelve `GET /profiles/patients/me/summary` en `ProfilesPatientsController_getOwnSummary`. El controlador delega en `ProfilesPatientsService.getOwnSummary`. No recibe body. El tipo de retorno estático es `Promise<PatientSummaryResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /profiles/patients/me/summary HTTP/1.1
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
GET /profiles/patients/me/summary HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PatientSummaryResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<PatientSummaryResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<PatientSummaryResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<PatientSummaryResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<PatientSummaryResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<PatientSummaryResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PatientSummaryResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "personId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "identityVerified": true,
  "patientCode": "CODIGO_EJEMPLO",
  "displayName": "Nombre de ejemplo",
  "birthDate": "2026-07-31T12:00:00.000Z",
  "personStatus": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `personId` | Sí | `string` | formato `uuid` | Identificador asociado a person. | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | Sí | `string` | formato `uuid` | Identificador asociado a patient profile. | `00000000-0000-4000-8000-000000000001` |
| `identityVerified` | Sí | `boolean` | Sin restricción adicional declarada | Si el titular tiene una aserción de identidad vigente. Con `false` el resumen llega sin `patientCode`. | `true` |
| `patientCode` | No | `string` | Sin restricción adicional declarada | Código de paciente. Sólo con identidad verificada: ausente mientras `identityVerified` sea `false`. | `CODIGO_EJEMPLO` |
| `displayName` | No | `string` | Sin restricción adicional declarada | Valor de display name mantenido por la instancia. | `Nombre de ejemplo` |
| `birthDate` | No | `string` | formato `date-time` | Valor de birth date mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `personStatus` | Sí | `string` | formato `uuid` | Identificador asociado a person status concept. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Paciente no encontrado | Excepción explícita en src/modules/profiles/services/profiles-patients.service.ts |
| 422 | `PRECONDITION_FAILED` | La cuenta no tiene una persona vinculada | Excepción explícita en src/modules/profiles/services/profiles-patients.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/profiles/patients/me/summary"
}
```

---

## 11. POST /profiles/patients/merge

- **Módulo:** `profiles`
- **Etiqueta OpenAPI:** `profiles-patients`
- **Nombre:** Fusionar pacientes duplicados
- **Operation ID:** `ProfilesPatientsController_mergePatients`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ProfilesPatientsController.mergePatients](../../src/modules/profiles/controllers/profiles-patients.controller.ts)

### Descripción de negocio

Fusionar pacientes duplicados. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /profiles/patients/merge` en `ProfilesPatientsController_mergePatients`. El controlador delega en `ProfilesPatientsService.mergePatients`. Valida el body como `MergePatientsDto` y consume `application/json`. El tipo de retorno estático es `Promise<MergeEventResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `MergePatientsDto`; los campos opcionales se omiten.

```http
POST /profiles/patients/merge HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "survivingPatientProfileId": "00000000-0000-4000-8000-000000000001",
  "mergedPatientProfileId": "00000000-0000-4000-8000-000000000001"
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
| `survivingPatientProfileId` | Sí | `string` | formato `uuid` | Perfil de paciente que sobrevive | `00000000-0000-4000-8000-000000000001` |
| `mergedPatientProfileId` | Sí | `string` | formato `uuid` | Perfil de paciente que se fusiona (perdedor) | `00000000-0000-4000-8000-000000000001` |
| `reasonConceptId` | No | `string` | formato `uuid` | Concept id de la razón de fusión | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /profiles/patients/merge HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "survivingPatientProfileId": "00000000-0000-4000-8000-000000000001",
  "mergedPatientProfileId": "00000000-0000-4000-8000-000000000001",
  "reasonConceptId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<MergeEventResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<MergeEventResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<MergeEventResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<MergeEventResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<MergeEventResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<MergeEventResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<MergeEventResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<MergeEventResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<MergeEventResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `MergeEventResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "survivingPatientProfileId": "00000000-0000-4000-8000-000000000001",
  "mergedPatientProfileId": "00000000-0000-4000-8000-000000000001",
  "decisionStatus": "00000000-0000-4000-8000-000000000001",
  "reversalOfEventId": "00000000-0000-4000-8000-000000000001",
  "recordedAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `survivingPatientProfileId` | Sí | `string` | formato `uuid` | Identificador asociado a surviving patient profile. | `00000000-0000-4000-8000-000000000001` |
| `mergedPatientProfileId` | Sí | `string` | formato `uuid` | Identificador asociado a merged patient profile. | `00000000-0000-4000-8000-000000000001` |
| `decisionStatus` | Sí | `string` | formato `uuid` | Concept id del estado de la decisión | `00000000-0000-4000-8000-000000000001` |
| `reversalOfEventId` | No | `string` | formato `uuid` | Evento original revertido (si aplica) | `00000000-0000-4000-8000-000000000001` |
| `recordedAt` | Sí | `string` | formato `date-time` | Valor de recorded at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Paciente sobreviviente no encontrado | Excepción explícita en src/modules/profiles/services/profiles-patients.service.ts |
| 404 | `NOT_FOUND` | Paciente a fusionar no encontrado | Excepción explícita en src/modules/profiles/services/profiles-patients.service.ts |
| 409 | `CONFLICT` | El paciente ya fue fusionado | Excepción explícita en src/modules/profiles/services/profiles-patients.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | No se puede fusionar un paciente consigo mismo | Excepción explícita en src/modules/profiles/services/profiles-patients.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/profiles/patients/merge"
}
```

---

## 12. GET /profiles/patients/merge-events

- **Módulo:** `profiles`
- **Etiqueta OpenAPI:** `profiles-patients`
- **Nombre:** Listar eventos de fusión de pacientes
- **Operation ID:** `ProfilesPatientsController_listMergeEvents`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ProfilesPatientsController.listMergeEvents](../../src/modules/profiles/controllers/profiles-patients.controller.ts)

### Descripción de negocio

Devuelve el `id` que exige POST /profiles/patients/merge/{eventId}/reverse. Sin esta lectura, una fusión sólo era reversible mientras la respuesta del POST siguiera a la vista.

Contexto declarado en el controlador: UC-05-09·L. Va **antes** que `patients/:profileId` en el archivo por lo de siempre con las rutas de Nest: se resuelven por orden de declaración, y `merge-events` encajaría en el parámetro y devolvería un 400 por uuid mal formado en vez de la lista.

### Descripción del sistema

NestJS resuelve `GET /profiles/patients/merge-events` en `ProfilesPatientsController_listMergeEvents`. El controlador delega en `ProfilesPatientsService.listMergeEvents`. No recibe body. El tipo de retorno estático es `Promise<ListMergeEventsResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `patientProfileId` | query | No | `string` | formato `uuid` | Paciente involucrado, de cualquiera de los dos lados | `00000000-0000-4000-8000-000000000001` |
| `limit` | query | No | `number` | máximo 200 | Sin descripción específica en OpenAPI. | `50` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /profiles/patients/merge-events HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /profiles/patients/merge-events?patientProfileId=00000000-0000-4000-8000-000000000001&limit=50 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ListMergeEventsResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<ListMergeEventsResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<ListMergeEventsResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<ListMergeEventsResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<ListMergeEventsResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<ListMergeEventsResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ListMergeEventsResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "survivingPatientProfileId": "00000000-0000-4000-8000-000000000001",
      "mergedPatientProfileId": "00000000-0000-4000-8000-000000000001",
      "decisionStatus": "00000000-0000-4000-8000-000000000001",
      "reversalOfEventId": "00000000-0000-4000-8000-000000000001",
      "recordedAt": "2026-07-31T12:00:00.000Z"
    }
  ],
  "count": 1,
  "limit": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<MergeEventResponseDto>` | Sin restricción adicional declarada | Eventos de esta página, del más reciente al más antiguo. | `[{"id":"00000000-0000-4000-8000-000000000001","survivingPatientProfileId":"00000000-0000-4000-8000-000000000001","mergedPatientProfileId":"00000000-0000-4000-8000-000000000001","decisionStatus":"00000000-0000-4000-8000-000000000001","reversalOfEventId":"00000000-0000-4000-8000-000000000001","recordedAt":"2026-07-31T12:00:00.000Z"}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `items[].survivingPatientProfileId` | Sí | `string` | formato `uuid` | Identificador asociado a surviving patient profile. | `00000000-0000-4000-8000-000000000001` |
| `items[].mergedPatientProfileId` | Sí | `string` | formato `uuid` | Identificador asociado a merged patient profile. | `00000000-0000-4000-8000-000000000001` |
| `items[].decisionStatus` | Sí | `string` | formato `uuid` | Concept id del estado de la decisión | `00000000-0000-4000-8000-000000000001` |
| `items[].reversalOfEventId` | No | `string` | formato `uuid` | Evento original revertido (si aplica) | `00000000-0000-4000-8000-000000000001` |
| `items[].recordedAt` | Sí | `string` | formato `date-time` | Valor de recorded at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Cantidad devuelta. | `1` |
| `limit` | Sí | `number` | Sin restricción adicional declarada | Tope aplicado. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/profiles/patients/merge-events"
}
```

---

## 13. POST /profiles/patients/merge/{eventId}/reverse

- **Módulo:** `profiles`
- **Etiqueta OpenAPI:** `profiles-patients`
- **Nombre:** Revertir una fusión de pacientes
- **Operation ID:** `ProfilesPatientsController_reverseMerge`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ProfilesPatientsController.reverseMerge](../../src/modules/profiles/controllers/profiles-patients.controller.ts)

### Descripción de negocio

Revertir una fusión de pacientes. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /profiles/patients/merge/{eventId}/reverse` en `ProfilesPatientsController_reverseMerge`. El controlador delega en `ProfilesPatientsService.reverseMerge`. Valida el body como `ReverseMergeDto` y consume `application/json`. El tipo de retorno estático es `Promise<MergeEventResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `eventId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ReverseMergeDto`; los campos opcionales se omiten.

```http
POST /profiles/patients/merge/00000000-0000-4000-8000-000000000001/reverse HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `eventId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `reasonConceptId` | No | `string` | formato `uuid` | Concept id de la razón de reversión | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /profiles/patients/merge/00000000-0000-4000-8000-000000000001/reverse HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "reasonConceptId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<MergeEventResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<MergeEventResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<MergeEventResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<MergeEventResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<MergeEventResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<MergeEventResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<MergeEventResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<MergeEventResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<MergeEventResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<MergeEventResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `MergeEventResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "survivingPatientProfileId": "00000000-0000-4000-8000-000000000001",
  "mergedPatientProfileId": "00000000-0000-4000-8000-000000000001",
  "decisionStatus": "00000000-0000-4000-8000-000000000001",
  "reversalOfEventId": "00000000-0000-4000-8000-000000000001",
  "recordedAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `survivingPatientProfileId` | Sí | `string` | formato `uuid` | Identificador asociado a surviving patient profile. | `00000000-0000-4000-8000-000000000001` |
| `mergedPatientProfileId` | Sí | `string` | formato `uuid` | Identificador asociado a merged patient profile. | `00000000-0000-4000-8000-000000000001` |
| `decisionStatus` | Sí | `string` | formato `uuid` | Concept id del estado de la decisión | `00000000-0000-4000-8000-000000000001` |
| `reversalOfEventId` | No | `string` | formato `uuid` | Evento original revertido (si aplica) | `00000000-0000-4000-8000-000000000001` |
| `recordedAt` | Sí | `string` | formato `date-time` | Valor de recorded at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Evento de fusión no encontrado | Excepción explícita en src/modules/profiles/services/profiles-patients.service.ts |
| 409 | `CONFLICT` | La fusión ya fue revertida | Excepción explícita en src/modules/profiles/services/profiles-patients.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Solo se puede revertir una fusión aprobada | Excepción explícita en src/modules/profiles/services/profiles-patients.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/profiles/patients/merge/{eventId}/reverse"
}
```

---

## 14. POST /profiles/persons/{personId}/account-links

- **Módulo:** `profiles`
- **Etiqueta OpenAPI:** `profiles-patients`
- **Nombre:** Vincular cuenta de portal a una persona
- **Operation ID:** `ProfilesPatientsController_linkAccount`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ProfilesPatientsController.linkAccount](../../src/modules/profiles/controllers/profiles-patients.controller.ts)

### Descripción de negocio

Vincular cuenta de portal a una persona. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /profiles/persons/{personId}/account-links` en `ProfilesPatientsController_linkAccount`. El controlador delega en `ProfilesPatientsService.linkAccount`. Valida el body como `LinkAccountDto` y consume `application/json`. El tipo de retorno estático es `Promise<AccountLinkResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `personId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `LinkAccountDto`; los campos opcionales se omiten.

```http
POST /profiles/persons/00000000-0000-4000-8000-000000000001/account-links HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "userId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `personId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `userId` | Sí | `string` | formato `uuid` | Usuario IAM a vincular con la persona | `00000000-0000-4000-8000-000000000001` |
| `linkTypeConceptId` | No | `string` | formato `uuid` | Concept id del tipo de vínculo (por defecto: self) | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /profiles/persons/00000000-0000-4000-8000-000000000001/account-links HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "userId": "00000000-0000-4000-8000-000000000001",
  "linkTypeConceptId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<AccountLinkResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<AccountLinkResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AccountLinkResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AccountLinkResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<AccountLinkResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AccountLinkResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<AccountLinkResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AccountLinkResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AccountLinkResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AccountLinkResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AccountLinkResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "personId": "00000000-0000-4000-8000-000000000001",
  "userId": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001",
  "validFrom": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `personId` | Sí | `string` | formato `uuid` | Identificador asociado a person. | `00000000-0000-4000-8000-000000000001` |
| `userId` | Sí | `string` | formato `uuid` | Identificador asociado a user. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concept id del estado del vínculo | `00000000-0000-4000-8000-000000000001` |
| `validFrom` | Sí | `string` | formato `date-time` | Valor de valid from mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Persona no encontrada | Excepción explícita en src/modules/profiles/services/profiles-patients.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La persona no está activa | Excepción explícita en src/modules/profiles/services/profiles-patients.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/profiles/persons/{personId}/account-links"
}
```

---

## 15. POST /profiles/persons/{personId}/decease

- **Módulo:** `profiles`
- **Etiqueta OpenAPI:** `profiles-patients`
- **Nombre:** Registrar defunción y anonimización de una persona
- **Operation ID:** `ProfilesPatientsController_decease`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ProfilesPatientsController.decease](../../src/modules/profiles/controllers/profiles-patients.controller.ts)

### Descripción de negocio

Registrar defunción y anonimización de una persona. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /profiles/persons/{personId}/decease` en `ProfilesPatientsController_decease`. El controlador delega en `ProfilesPatientsService.decease`. Valida el body como `DeceasePersonDto` y consume `application/json`. El tipo de retorno estático es `Promise<DeceaseResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `personId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `DeceasePersonDto`; los campos opcionales se omiten.

```http
POST /profiles/persons/00000000-0000-4000-8000-000000000001/decease HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `personId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `deceasedAt` | No | `string` | formato `date-time` | Momento de defunción (ISO date-time) | `2026-07-31T12:00:00.000Z` |
| `anonymize` | No | `boolean` | Sin restricción adicional declarada | Anonimiza la PII (borrado lógico del display_name) al registrar | `false` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /profiles/persons/00000000-0000-4000-8000-000000000001/decease HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "deceasedAt": "2026-07-31T12:00:00.000Z",
  "anonymize": false
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<DeceaseResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<DeceaseResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<DeceaseResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<DeceaseResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<DeceaseResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<DeceaseResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<DeceaseResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<DeceaseResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<DeceaseResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<DeceaseResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DeceaseResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "vitalStatus": "00000000-0000-4000-8000-000000000001",
  "personStatus": "00000000-0000-4000-8000-000000000001",
  "deceasedAt": "2026-07-31T12:00:00.000Z",
  "revokedAccountLinks": 1,
  "revokedProxies": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `vitalStatus` | Sí | `string` | formato `uuid` | Concept id del estado vital | `00000000-0000-4000-8000-000000000001` |
| `personStatus` | Sí | `string` | formato `uuid` | Concept id del estado de la persona | `00000000-0000-4000-8000-000000000001` |
| `deceasedAt` | No | `string` | formato `date-time` | Valor de deceased at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `revokedAccountLinks` | Sí | `number` | Sin restricción adicional declarada | Nº de vínculos de cuenta revocados | `1` |
| `revokedProxies` | Sí | `number` | Sin restricción adicional declarada | Nº de proxies de portal revocados | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Persona no encontrada | Excepción explícita en src/modules/profiles/services/profiles-patients.service.ts |
| 409 | `CONFLICT` | La persona ya está registrada como fallecida | Excepción explícita en src/modules/profiles/services/profiles-patients.service.ts |
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
  "path": "/profiles/persons/{personId}/decease"
}
```

---

## 16. GET /profiles/practitioners

- **Módulo:** `profiles`
- **Etiqueta OpenAPI:** `profiles-practitioners`
- **Nombre:** Listar profesionales para la guía, con sus especialidades
- **Operation ID:** `ProfilesPractitionersController_listPractitioners`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ProfilesPractitionersController.listPractitioners](../../src/modules/profiles/controllers/profiles-practitioners.controller.ts)

### Descripción de negocio

Listar profesionales para la guía, con sus especialidades. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: La guía de profesionales (carril R2-1). **Sin `@Roles`, siguiendo el criterio del propio módulo**: son datos profesionales de presentación —lo que una guía médica publica—, no PHI, y es el menú del PACIENTE el que la muestra. Exigir un rol dejaría la guía exactamente para quienes no la necesitan.

### Descripción del sistema

NestJS resuelve `GET /profiles/practitioners` en `ProfilesPractitionersController_listPractitioners`. El controlador delega en `ProfilesPractitionersService.listPractitioners`. No recibe body. El tipo de retorno estático es `Promise<ListPractitionersResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `specialtyConceptId` | query | No | `string` | Sin restricción adicional declarada | Filtra por especialidad vigente (concept id) | `00000000-0000-4000-8000-000000000001` |
| `cursor` | query | No | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |
| `limit` | query | No | `number` | Sin restricción adicional declarada | Tope de resultados (por defecto 50) | `1` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /profiles/practitioners HTTP/1.1
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
GET /profiles/practitioners?specialtyConceptId=00000000-0000-4000-8000-000000000001&cursor=valor-ejemplo&limit=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ListPractitionersResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<ListPractitionersResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<ListPractitionersResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<ListPractitionersResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<ListPractitionersResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<ListPractitionersResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ListPractitionersResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "profileId": "00000000-0000-4000-8000-000000000001",
      "practitionerCode": "CODIGO_EJEMPLO",
      "displayName": "Nombre de ejemplo",
      "professionalTitle": "valor-ejemplo",
      "photoFileId": "00000000-0000-4000-8000-000000000001",
      "verificationStatusConceptId": "00000000-0000-4000-8000-000000000001",
      "acceptsNewPatients": true,
      "telehealthAvailable": true,
      "specialties": [
        {
          "specialtyConceptId": "00000000-0000-4000-8000-000000000001",
          "isPrimary": true
        }
      ]
    }
  ],
  "count": 1,
  "limit": 1,
  "nextCursor": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<PractitionerListItemDto>` | Sin restricción adicional declarada | Las filas de esta página. | `[{"profileId":"00000000-0000-4000-8000-000000000001","practitionerCode":"CODIGO_EJEMPLO","displayName":"Nombre de ejemplo","professionalTitle":"valor-ejemplo","photoFileId":"00000000-0000-4000-8000-000000000001","verificationStatusConceptId":"00000000-0000-4000-8000-000000000001","acceptsNewPatients":true,"telehealthAvailable":true,"specialties":[{"specialtyConceptId":"00000000-0000-4000-8000-000000000001","isPrimary":true}]}]` |
| `items[].profileId` | Sí | `string` | formato `uuid` | Con este id se abre la ficha (`GET /profiles/practitioners/:id/summary`). | `00000000-0000-4000-8000-000000000001` |
| `items[].practitionerCode` | Sí | `string` | Sin restricción adicional declarada | Código único del profesional | `CODIGO_EJEMPLO` |
| `items[].displayName` | No | `string` | Sin restricción adicional declarada | Nombre visible de la persona | `Nombre de ejemplo` |
| `items[].professionalTitle` | No | `string` | Sin restricción adicional declarada | Título profesional declarado. | `valor-ejemplo` |
| `items[].photoFileId` | No | `string` | formato `uuid` | Archivo de la foto | `00000000-0000-4000-8000-000000000001` |
| `items[].verificationStatusConceptId` | Sí | `string` | formato `uuid` | Estado de verificación de la matrícula. | `00000000-0000-4000-8000-000000000001` |
| `items[].acceptsNewPatients` | Sí | `boolean` | Sin restricción adicional declarada | Si declara tomar pacientes nuevos. | `true` |
| `items[].telehealthAvailable` | Sí | `boolean` | Sin restricción adicional declarada | Si atiende por telemedicina. | `true` |
| `items[].specialties` | Sí | `array<PractitionerListSpecialtyDto>` | Sin restricción adicional declarada | Sus especialidades, la principal primero. | `[{"specialtyConceptId":"00000000-0000-4000-8000-000000000001","isPrimary":true}]` |
| `items[].specialties[].specialtyConceptId` | Sí | `string` | formato `uuid` | Concept id de la especialidad | `00000000-0000-4000-8000-000000000001` |
| `items[].specialties[].isPrimary` | Sí | `boolean` | Sin restricción adicional declarada | Si es la especialidad con la que se presenta. | `true` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Cantidad devuelta en esta página | `1` |
| `limit` | Sí | `number` | Sin restricción adicional declarada | Tope de resultados aplicado | `1` |
| `nextCursor` | No | `string` | admite null | Cursor opaco de la página siguiente; null si no hay más | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/profiles/practitioners"
}
```

---

## 17. POST /profiles/practitioners

- **Módulo:** `profiles`
- **Etiqueta OpenAPI:** `profiles-practitioners`
- **Nombre:** Alta de profesional de salud (workforce generalista)
- **Operation ID:** `ProfilesPractitionersController_onboardPractitioner`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ProfilesPractitionersController.onboardPractitioner](../../src/modules/profiles/controllers/profiles-practitioners.controller.ts)

### Descripción de negocio

Alta de profesional de salud (workforce generalista). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /profiles/practitioners` en `ProfilesPractitionersController_onboardPractitioner`. El controlador delega en `ProfilesPractitionersService.onboardPractitioner`. Valida el body como `CreatePractitionerDto` y consume `application/json`. El tipo de retorno estático es `Promise<PractitionerResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreatePractitionerDto`; los campos opcionales se omiten.

```http
POST /profiles/practitioners HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practitionerCode": "CODIGO_EJEMPLO",
  "licenseNumber": "valor-ejemplo",
  "credentialNumber": "valor-ejemplo"
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
| `practitionerCode` | Sí | `string` | longitud mínima 1; longitud máxima 100 | Código único de profesional (practitioner_code, UK) | `CODIGO_EJEMPLO` |
| `personId` | No | `string` | formato `uuid` | Persona existente a reutilizar; si se omite se crea una nueva | `00000000-0000-4000-8000-000000000001` |
| `displayName` | No | `string` | longitud máxima 300 | Nombre visible (si se crea la persona) | `Nombre de ejemplo` |
| `practitionerCategoryConceptId` | No | `string` | formato `uuid` | Concept id de categoría profesional | `00000000-0000-4000-8000-000000000001` |
| `professionalTitle` | No | `string` | longitud máxima 200 | Título profesional | `valor-ejemplo` |
| `specialtyConceptIds` | No | `array<string>` | formato `uuid`; máximo 3 elemento(s) | Especialidades del catálogo VS_MEDICAL_SPECIALTY. La primera es la principal. | `["00000000-0000-4000-8000-000000000001"]` |
| `professionalBio` | No | `string` | longitud máxima 4000 | Biografía profesional en prosa | `valor-ejemplo` |
| `acceptsNewPatients` | No | `boolean` | Sin restricción adicional declarada | Si acepta pacientes nuevos | `false` |
| `telehealthAvailable` | No | `boolean` | Sin restricción adicional declarada | Si atiende por telemedicina | `false` |
| `licenseNumber` | Sí | `string` | longitud mínima 1; longitud máxima 100 | Nº de licencia de la autorización jurisdiccional inicial | `valor-ejemplo` |
| `jurisdictionConceptId` | No | `string` | formato `uuid` | Concept id de jurisdicción de la licencia | `00000000-0000-4000-8000-000000000001` |
| `regulatoryAuthority` | No | `string` | longitud máxima 200 | Autoridad regulatoria emisora | `valor-ejemplo` |
| `credentialNumber` | Sí | `string` | longitud mínima 1; longitud máxima 100 | Nº de la credencial de soporte | `valor-ejemplo` |
| `credentialTypeConceptId` | No | `string` | formato `uuid` | Concept id del tipo de credencial | `00000000-0000-4000-8000-000000000001` |
| `credentialIssuingInstitutionText` | No | `string` | longitud máxima 300 | Institución que emitió la credencial de soporte | `valor-ejemplo` |
| `credentialIssueDate` | No | `string` | formato `date` | Fecha de emisión de la credencial de soporte (ISO) | `2026-07-31` |
| `languageConceptId` | No | `string` | formato `uuid` | Concept id del idioma clínico | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /profiles/practitioners HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practitionerCode": "CODIGO_EJEMPLO",
  "personId": "00000000-0000-4000-8000-000000000001",
  "displayName": "Nombre de ejemplo",
  "practitionerCategoryConceptId": "00000000-0000-4000-8000-000000000001",
  "professionalTitle": "valor-ejemplo",
  "specialtyConceptIds": [
    "00000000-0000-4000-8000-000000000001"
  ],
  "professionalBio": "valor-ejemplo",
  "acceptsNewPatients": false,
  "telehealthAvailable": false,
  "licenseNumber": "valor-ejemplo",
  "jurisdictionConceptId": "00000000-0000-4000-8000-000000000001",
  "regulatoryAuthority": "valor-ejemplo",
  "credentialNumber": "valor-ejemplo",
  "credentialTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "credentialIssuingInstitutionText": "valor-ejemplo",
  "credentialIssueDate": "2026-07-31",
  "languageConceptId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<PractitionerResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<PractitionerResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PractitionerResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PractitionerResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PractitionerResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<PractitionerResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PractitionerResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PractitionerResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PractitionerResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PractitionerResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "profileId": "00000000-0000-4000-8000-000000000001",
  "personId": "00000000-0000-4000-8000-000000000001",
  "practitionerCode": "CODIGO_EJEMPLO",
  "verificationStatus": "00000000-0000-4000-8000-000000000001",
  "practiceStatus": "00000000-0000-4000-8000-000000000001",
  "licenseId": "00000000-0000-4000-8000-000000000001",
  "credentialId": "00000000-0000-4000-8000-000000000001",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `profileId` | Sí | `string` | formato `uuid` | Identificador asociado a profile. | `00000000-0000-4000-8000-000000000001` |
| `personId` | Sí | `string` | formato `uuid` | Identificador asociado a person. | `00000000-0000-4000-8000-000000000001` |
| `practitionerCode` | Sí | `string` | Sin restricción adicional declarada | Valor de practitioner code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `verificationStatus` | Sí | `string` | formato `uuid` | Concept id del estado de verificación | `00000000-0000-4000-8000-000000000001` |
| `practiceStatus` | Sí | `string` | formato `uuid` | Concept id del estado de práctica | `00000000-0000-4000-8000-000000000001` |
| `licenseId` | Sí | `string` | formato `uuid` | Identificador asociado a license. | `00000000-0000-4000-8000-000000000001` |
| `credentialId` | Sí | `string` | formato `uuid` | Identificador asociado a credential. | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Persona no encontrada | Excepción explícita en src/modules/profiles/services/profiles-practitioners.service.ts |
| 409 | `CONFLICT` | El practitioner_code ya está en uso | Excepción explícita en src/modules/profiles/services/profiles-practitioners.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Un profesional puede declarar hasta ${MAX_SPECIALTIES_PER_PRACTITIONER} especialidades | Excepción explícita en src/modules/profiles/services/profiles-practitioners.service.ts |
| 422 | `PRECONDITION_FAILED` | La especialidad no pertenece al catálogo de especialidades médicas | Excepción explícita en src/modules/profiles/services/medical-specialty-catalog.service.ts |
| 422 | `PRECONDITION_FAILED` | El catálogo de especialidades médicas no está disponible | Excepción explícita en src/modules/profiles/services/medical-specialty-catalog.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/profiles/practitioners"
}
```

---

## 18. POST /profiles/practitioners/{profileId}/jurisdiction-authorizations

- **Módulo:** `profiles`
- **Etiqueta OpenAPI:** `profiles-practitioners`
- **Nombre:** Registrar/renovar autorización jurisdiccional (licencia)
- **Operation ID:** `ProfilesPractitionersController_addJurisdictionAuthorization`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ProfilesPractitionersController.addJurisdictionAuthorization](../../src/modules/profiles/controllers/profiles-practitioners.controller.ts)

### Descripción de negocio

Registrar/renovar autorización jurisdiccional (licencia). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /profiles/practitioners/{profileId}/jurisdiction-authorizations` en `ProfilesPractitionersController_addJurisdictionAuthorization`. El controlador delega en `ProfilesPractitionersService.addJurisdictionAuthorization`. Valida el body como `CreateJurisdictionAuthorizationDto` y consume `application/json`. El tipo de retorno estático es `Promise<JurisdictionAuthorizationResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `profileId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateJurisdictionAuthorizationDto`; los campos opcionales se omiten.

```http
POST /profiles/practitioners/00000000-0000-4000-8000-000000000001/jurisdiction-authorizations HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "licenseNumber": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `profileId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `licenseNumber` | Sí | `string` | longitud mínima 1; longitud máxima 100 | Nº de licencia | `valor-ejemplo` |
| `jurisdictionConceptId` | No | `string` | formato `uuid` | Concept id de jurisdicción | `00000000-0000-4000-8000-000000000001` |
| `regulatoryAuthority` | No | `string` | longitud máxima 200 | Autoridad regulatoria emisora | `valor-ejemplo` |
| `practiceScopeConceptId` | No | `string` | formato `uuid` | Concept id del alcance de práctica | `00000000-0000-4000-8000-000000000001` |
| `validFrom` | No | `string` | formato `date` | Vigente desde (ISO date) | `2026-07-31` |
| `validTo` | No | `string` | formato `date` | Vigente hasta (ISO date) | `2026-07-31` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /profiles/practitioners/00000000-0000-4000-8000-000000000001/jurisdiction-authorizations HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "licenseNumber": "valor-ejemplo",
  "jurisdictionConceptId": "00000000-0000-4000-8000-000000000001",
  "regulatoryAuthority": "valor-ejemplo",
  "practiceScopeConceptId": "00000000-0000-4000-8000-000000000001",
  "validFrom": "2026-07-31",
  "validTo": "2026-07-31"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<JurisdictionAuthorizationResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<JurisdictionAuthorizationResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<JurisdictionAuthorizationResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<JurisdictionAuthorizationResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<JurisdictionAuthorizationResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<JurisdictionAuthorizationResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<JurisdictionAuthorizationResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<JurisdictionAuthorizationResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<JurisdictionAuthorizationResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<JurisdictionAuthorizationResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `JurisdictionAuthorizationResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
  "licenseNumber": "valor-ejemplo",
  "state": "00000000-0000-4000-8000-000000000001",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `practitionerProfileId` | Sí | `string` | formato `uuid` | Identificador asociado a practitioner profile. | `00000000-0000-4000-8000-000000000001` |
| `licenseNumber` | Sí | `string` | Sin restricción adicional declarada | Valor de license number mantenido por la instancia. | `valor-ejemplo` |
| `state` | Sí | `string` | formato `uuid` | Concept id del estado de la licencia | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Sólo el titular del perfil profesional o la plataforma pueden modificarlo | Excepción explícita en src/modules/profiles/services/profile-ownership.service.ts |
| 404 | `NOT_FOUND` | Profesional no encontrado | Excepción explícita en src/modules/profiles/services/profiles-practitioners.service.ts |
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
  "path": "/profiles/practitioners/{profileId}/jurisdiction-authorizations"
}
```

---

## 19. DELETE /profiles/practitioners/{profileId}/photo

- **Módulo:** `profiles`
- **Etiqueta OpenAPI:** `profiles-practitioners`
- **Nombre:** Quitar la foto del perfil profesional
- **Operation ID:** `ProfilesPractitionersController_removePractitionerPhoto`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ProfilesPractitionersController.removePractitionerPhoto](../../src/modules/profiles/controllers/profiles-practitioners.controller.ts)

### Descripción de negocio

Quitar la foto del perfil profesional. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Quitar la foto del perfil profesional. Quita la referencia; el archivo no se toca. Quien quiera borrar el archivo del almacenamiento tiene el camino de `common/files`, que lleva su propio borrado lógico.

### Descripción del sistema

NestJS resuelve `DELETE /profiles/practitioners/{profileId}/photo` en `ProfilesPractitionersController_removePractitionerPhoto`. El controlador delega en `ProfilesPractitionersService.removePractitionerPhoto`. No recibe body. El tipo de retorno estático es `Promise<PractitionerProfileSummaryDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `profileId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
DELETE /profiles/practitioners/00000000-0000-4000-8000-000000000001/photo HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `profileId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
DELETE /profiles/practitioners/00000000-0000-4000-8000-000000000001/photo HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PractitionerProfileSummaryDto>` | No |
| 400 | Operación completada correctamente. | `Promise<PractitionerProfileSummaryDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PractitionerProfileSummaryDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PractitionerProfileSummaryDto>` | No |
| 404 | Operación completada correctamente. | `Promise<PractitionerProfileSummaryDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PractitionerProfileSummaryDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PractitionerProfileSummaryDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PractitionerProfileSummaryDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PractitionerProfileSummaryDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PractitionerProfileSummaryDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "profileId": "00000000-0000-4000-8000-000000000001",
  "personId": "00000000-0000-4000-8000-000000000001",
  "practitionerCode": "CODIGO_EJEMPLO",
  "displayName": "Nombre de ejemplo",
  "professionalTitle": "valor-ejemplo",
  "professionalBio": "valor-ejemplo",
  "photoFileId": "00000000-0000-4000-8000-000000000001",
  "email": "usuario@example.com",
  "phone": "+59170000000",
  "practitionerCategoryConceptId": "00000000-0000-4000-8000-000000000001",
  "verificationStatusConceptId": "00000000-0000-4000-8000-000000000001",
  "practiceStatusConceptId": "00000000-0000-4000-8000-000000000001",
  "acceptsNewPatients": true,
  "telehealthAvailable": true,
  "specialties": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "specialtyConceptId": "00000000-0000-4000-8000-000000000001",
      "isPrimary": true,
      "boardCertified": true,
      "practiceScopeText": "valor-ejemplo",
      "verificationStatusConceptId": "00000000-0000-4000-8000-000000000001",
      "validFrom": "2026-07-31T12:00:00.000Z",
      "validTo": "2026-07-31T12:00:00.000Z"
    }
  ],
  "credentials": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "credentialTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "number": "valor-ejemplo",
      "issuingInstitutionText": "valor-ejemplo",
      "issueDate": "2026-07-31T12:00:00.000Z",
      "expiryDate": "2026-07-31T12:00:00.000Z",
      "stateConceptId": "00000000-0000-4000-8000-000000000001",
      "verifiedAt": "2026-07-31T12:00:00.000Z",
      "verificationSourceUri": "valor-ejemplo"
    }
  ],
  "licenses": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "jurisdictionConceptId": "00000000-0000-4000-8000-000000000001",
      "licenseNumber": "valor-ejemplo",
      "regulatoryAuthority": "valor-ejemplo",
      "stateConceptId": "00000000-0000-4000-8000-000000000001",
      "validFrom": "2026-07-31T12:00:00.000Z",
      "validTo": "2026-07-31T12:00:00.000Z"
    }
  ],
  "languages": [
    {
      "languageConceptId": "00000000-0000-4000-8000-000000000001",
      "proficiencyConceptId": "00000000-0000-4000-8000-000000000001",
      "clinicalInterpretationAllowed": true
    }
  ],
  "affiliations": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
      "organizationName": "Nombre de ejemplo",
      "roleTitle": "valor-ejemplo",
      "departmentText": "valor-ejemplo",
      "practiceSiteId": "00000000-0000-4000-8000-000000000001",
      "affiliationTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "startDate": "2026-07-31",
      "endDate": "2026-07-31",
      "current": true,
      "status": "00000000-0000-4000-8000-000000000001",
      "statusKind": {},
      "decisionReasonText": "Texto descriptivo de ejemplo",
      "createdAt": "2026-07-31T12:00:00.000Z"
    }
  ],
  "activity": {
    "encounters": 1,
    "medicationRequests": 1,
    "clinicalNotes": 1,
    "documents": 1
  },
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `profileId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `personId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `practitionerCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `displayName` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `professionalTitle` | No | `string` | Sin restricción adicional declarada | «Médica cardióloga», «Kinesiólogo». Texto libre del propio profesional. | `valor-ejemplo` |
| `professionalBio` | No | `string` | Sin restricción adicional declarada | Presentación en prosa. Es lo que hace que un perfil se lea como una persona. | `valor-ejemplo` |
| `photoFileId` | No | `string` | formato `uuid` | Foto de perfil, si cargó una. Se resuelve por el módulo de archivos. | `00000000-0000-4000-8000-000000000001` |
| `email` | No | `string` | Sin restricción adicional declarada | Sólo en la lectura propia | `usuario@example.com` |
| `phone` | No | `string` | Sin restricción adicional declarada | Sólo en la lectura propia | `+59170000000` |
| `practitionerCategoryConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `verificationStatusConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `practiceStatusConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `acceptsNewPatients` | Sí | `boolean` | Sin restricción adicional declarada | Si toma pacientes nuevos. Cambia qué se le puede ofrecer a quien busca. | `true` |
| `telehealthAvailable` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `specialties` | Sí | `array<PractitionerSpecialtyDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","specialtyConceptId":"00000000-0000-4000-8000-000000000001","isPrimary":true,"boardCertified":true,"practiceScopeText":"valor-ejemplo","verificationStatusConceptId":"00000000-0000-4000-8000-000000000001","validFrom":"2026-07-31T12:00:00.000Z","validTo":"2026-07-31T12:00:00.000Z"}]` |
| `specialties[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `specialties[].specialtyConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `specialties[].isPrimary` | Sí | `boolean` | Sin restricción adicional declarada | Si es la especialidad con la que se presenta. Hay una sola vigente. | `true` |
| `specialties[].boardCertified` | Sí | `boolean` | Sin restricción adicional declarada | Certificación del colegio o consejo. Es un dato que la gente busca. | `true` |
| `specialties[].practiceScopeText` | No | `string` | Sin restricción adicional declarada | Alcance de práctica en palabras del propio profesional. | `valor-ejemplo` |
| `specialties[].verificationStatusConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `specialties[].validFrom` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `specialties[].validTo` | No | `string` | formato `date-time` | Presente sólo si dejó de ejercerla. | `2026-07-31T12:00:00.000Z` |
| `credentials` | Sí | `array<PractitionerCredentialDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","credentialTypeConceptId":"00000000-0000-4000-8000-000000000001","number":"valor-ejemplo","issuingInstitutionText":"valor-ejemplo","issueDate":"2026-07-31T12:00:00.000Z","expiryDate":"2026-07-31T12:00:00.000Z","stateConceptId":"00000000-0000-4000-8000-000000000001","verifiedAt":"2026-07-31T12:00:00.000Z","verificationSourceUri":"valor-ejemplo"}]` |
| `credentials[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `credentials[].credentialTypeConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `credentials[].number` | Sí | `string` | Sin restricción adicional declarada | Nº de título o certificado. | `valor-ejemplo` |
| `credentials[].issuingInstitutionText` | No | `string` | Sin restricción adicional declarada | Dónde se cursó, en texto libre: la institución no siempre es un tenant. | `valor-ejemplo` |
| `credentials[].issueDate` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `credentials[].expiryDate` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `credentials[].stateConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `credentials[].verifiedAt` | No | `string` | formato `date-time` | Cuándo se comprobó la credencial contra su fuente. Ausente significa «no verificada todavía», que no es lo mismo que «rechazada» —eso lo dice `stateConceptId`—. | `2026-07-31T12:00:00.000Z` |
| `credentials[].verificationSourceUri` | No | `string` | Sin restricción adicional declarada | Contra qué se comprobó la credencial (registro del colegio médico, portal de matrículas, etc). Ausente antes de verificar: es evidencia de la verificación, no del dato declarado. | `valor-ejemplo` |
| `licenses` | Sí | `array<PractitionerLicenseDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","jurisdictionConceptId":"00000000-0000-4000-8000-000000000001","licenseNumber":"valor-ejemplo","regulatoryAuthority":"valor-ejemplo","stateConceptId":"00000000-0000-4000-8000-000000000001","validFrom":"2026-07-31T12:00:00.000Z","validTo":"2026-07-31T12:00:00.000Z"}]` |
| `licenses[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `licenses[].jurisdictionConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `licenses[].licenseNumber` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `licenses[].regulatoryAuthority` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `licenses[].stateConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `licenses[].validFrom` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `licenses[].validTo` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `languages` | Sí | `array<PractitionerLanguageDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"languageConceptId":"00000000-0000-4000-8000-000000000001","proficiencyConceptId":"00000000-0000-4000-8000-000000000001","clinicalInterpretationAllowed":true}]` |
| `languages[].languageConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `languages[].proficiencyConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `languages[].clinicalInterpretationAllowed` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `affiliations` | Sí | `array<AffiliationResponseDto>` | Sin restricción adicional declarada | Historial laboral (UC-05-16): trayectoria, no PHI. Se devuelve un único array de la más reciente a la más antigua, con `current` ya derivado en cada fila — pantalla la agrupa en fases (formación/histórico/actual), la lectura no necesita decidir eso. | `[{"id":"00000000-0000-4000-8000-000000000001","practitionerProfileId":"00000000-0000-4000-8000-000000000001","organizationName":"Nombre de ejemplo","roleTitle":"valor-ejemplo","departmentText":"valor-ejemplo","practiceSiteId":"00000000-0000-4000-8000-000000000001","affiliationTypeConceptId":"00000000-0000-4000-8000-000000000001","startDate":"2026-07-31","endDate":"2026-07-31","current":true,"status":"00000000-0000-4000-8000-000000000001","statusKind":{},"decisionReasonText":"Texto descriptivo de ejemplo","createdAt":"2026-07-31T12:00:00.000Z"}]` |
| `affiliations[].id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `affiliations[].practitionerProfileId` | Sí | `string` | formato `uuid` | Identificador asociado a practitioner profile. | `00000000-0000-4000-8000-000000000001` |
| `affiliations[].organizationName` | Sí | `string` | Sin restricción adicional declarada | Institución. | `Nombre de ejemplo` |
| `affiliations[].roleTitle` | Sí | `string` | Sin restricción adicional declarada | Cargo. | `valor-ejemplo` |
| `affiliations[].departmentText` | No | `string` | admite null | Servicio o departamento. | `valor-ejemplo` |
| `affiliations[].practiceSiteId` | No | `string` | formato `uuid`; admite null | Sede de la plataforma, si la institución está dentro. | `00000000-0000-4000-8000-000000000001` |
| `affiliations[].affiliationTypeConceptId` | No | `string` | formato `uuid`; admite null | Tipo de vínculo. | `00000000-0000-4000-8000-000000000001` |
| `affiliations[].startDate` | Sí | `string` | formato `date` | Inicio del vínculo. | `2026-07-31` |
| `affiliations[].endDate` | No | `string` | formato `date`; admite null | Fin del vínculo, o `null` si sigue vigente. | `2026-07-31` |
| `affiliations[].current` | Sí | `boolean` | Sin restricción adicional declarada | Derivado de `endDate`: sin fin declarado, sigue vigente | `true` |
| `affiliations[].status` | Sí | `string` | formato `uuid` | Estado del registro (concept id). | `00000000-0000-4000-8000-000000000001` |
| `affiliations[].statusKind` | Sí | `object` | valores: `pendiente`, `declarado`, `aprobado`, `rechazado`, `revocado`, `desconocido` | El mismo estado, en algo sobre lo que una pantalla pueda ramificar. El concept id sigue viajando en `status` y es la verdad; esto es una derivación de conveniencia. Existe porque la alternativa era que el frontend comparara uuids escritos a mano, que es exactamente lo que el proyecto prohíbe: los conceptos se resuelven en el servidor. `desconocido` cuando el estado no es ninguno de los tres esperados. Es preferible a suponer: cuando exista el value set de estados —donde entra `declarado`— las pantallas que ya distinguen los casos conocidos no van a mentir sobre el nuevo, van a decir que no lo reconocen. | `{}` |
| `affiliations[].decisionReasonText` | No | `string` | admite null | Por qué la organización rechazó o dio de baja el vínculo. **Lo lee el profesional**, no es una nota interna. Un rechazo sin motivo es mudo para quien lo recibe, y quien lo escribe tiene que saber que se lee. `null` en cualquier otro estado. | `Texto descriptivo de ejemplo` |
| `affiliations[].createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |
| `activity` | Sí | `PractitionerActivityDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"encounters":1,"medicationRequests":1,"clinicalNotes":1,"documents":1}` |
| `activity.encounters` | Sí | `number` | Sin restricción adicional declarada | Encuentros que abrió. | `1` |
| `activity.medicationRequests` | Sí | `number` | Sin restricción adicional declarada | Recetas que prescribió. | `1` |
| `activity.clinicalNotes` | Sí | `number` | Sin restricción adicional declarada | Notas clínicas que redactó. | `1` |
| `activity.documents` | Sí | `number` | Sin restricción adicional declarada | Documentos que publicó en expedientes. | `1` |
| `createdAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Sólo el titular del perfil profesional o la plataforma pueden modificarlo | Excepción explícita en src/modules/profiles/services/profile-ownership.service.ts |
| 404 | `NOT_FOUND` | Profesional no encontrado | Excepción explícita en src/modules/profiles/services/profiles-practitioners.service.ts |
| 404 | `NOT_FOUND` | Perfil profesional no encontrado | Excepción explícita en src/modules/profiles/services/profiles-practitioners.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/profiles/practitioners/{profileId}/photo"
}
```

---

## 20. PUT /profiles/practitioners/{profileId}/photo

- **Módulo:** `profiles`
- **Etiqueta OpenAPI:** `profiles-practitioners`
- **Nombre:** Fijar la foto del perfil profesional
- **Operation ID:** `ProfilesPractitionersController_setPractitionerPhoto`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ProfilesPractitionersController.setPractitionerPhoto](../../src/modules/profiles/controllers/profiles-practitioners.controller.ts)

### Descripción de negocio

Fijar la foto del perfil profesional. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Fijar la foto del perfil profesional. Va con `:profileId` y no con `me` a propósito: la misma ruta sirve al titular y a la plataforma, y quién puede lo decide `ProfileOwnershipService` —titular o rol de plataforma— en vez de duplicarse en dos superficies que después divergen. Con `me` la intención de un administrador que arregla la ficha de otro no quedaría escrita en ningún lado. `PUT` porque el resultado no depende de cuántas veces se pida: el perfil queda con esa foto.

### Descripción del sistema

NestJS resuelve `PUT /profiles/practitioners/{profileId}/photo` en `ProfilesPractitionersController_setPractitionerPhoto`. El controlador delega en `ProfilesPractitionersService.setPractitionerPhoto`. Valida el body como `SetPractitionerPhotoDto` y consume `application/json`. El tipo de retorno estático es `Promise<PractitionerProfileSummaryDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `profileId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `SetPractitionerPhotoDto`; los campos opcionales se omiten.

```http
PUT /profiles/practitioners/00000000-0000-4000-8000-000000000001/photo HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "fileId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `profileId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `fileId` | Sí | `string` | formato `uuid` | Identificador del archivo ya subido que será la foto | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PUT /profiles/practitioners/00000000-0000-4000-8000-000000000001/photo HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "fileId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PractitionerProfileSummaryDto>` | No |
| 400 | Operación completada correctamente. | `Promise<PractitionerProfileSummaryDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PractitionerProfileSummaryDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PractitionerProfileSummaryDto>` | No |
| 404 | Operación completada correctamente. | `Promise<PractitionerProfileSummaryDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PractitionerProfileSummaryDto>` | No |
| 413 | Operación completada correctamente. | `Promise<PractitionerProfileSummaryDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PractitionerProfileSummaryDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PractitionerProfileSummaryDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PractitionerProfileSummaryDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PractitionerProfileSummaryDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "profileId": "00000000-0000-4000-8000-000000000001",
  "personId": "00000000-0000-4000-8000-000000000001",
  "practitionerCode": "CODIGO_EJEMPLO",
  "displayName": "Nombre de ejemplo",
  "professionalTitle": "valor-ejemplo",
  "professionalBio": "valor-ejemplo",
  "photoFileId": "00000000-0000-4000-8000-000000000001",
  "email": "usuario@example.com",
  "phone": "+59170000000",
  "practitionerCategoryConceptId": "00000000-0000-4000-8000-000000000001",
  "verificationStatusConceptId": "00000000-0000-4000-8000-000000000001",
  "practiceStatusConceptId": "00000000-0000-4000-8000-000000000001",
  "acceptsNewPatients": true,
  "telehealthAvailable": true,
  "specialties": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "specialtyConceptId": "00000000-0000-4000-8000-000000000001",
      "isPrimary": true,
      "boardCertified": true,
      "practiceScopeText": "valor-ejemplo",
      "verificationStatusConceptId": "00000000-0000-4000-8000-000000000001",
      "validFrom": "2026-07-31T12:00:00.000Z",
      "validTo": "2026-07-31T12:00:00.000Z"
    }
  ],
  "credentials": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "credentialTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "number": "valor-ejemplo",
      "issuingInstitutionText": "valor-ejemplo",
      "issueDate": "2026-07-31T12:00:00.000Z",
      "expiryDate": "2026-07-31T12:00:00.000Z",
      "stateConceptId": "00000000-0000-4000-8000-000000000001",
      "verifiedAt": "2026-07-31T12:00:00.000Z",
      "verificationSourceUri": "valor-ejemplo"
    }
  ],
  "licenses": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "jurisdictionConceptId": "00000000-0000-4000-8000-000000000001",
      "licenseNumber": "valor-ejemplo",
      "regulatoryAuthority": "valor-ejemplo",
      "stateConceptId": "00000000-0000-4000-8000-000000000001",
      "validFrom": "2026-07-31T12:00:00.000Z",
      "validTo": "2026-07-31T12:00:00.000Z"
    }
  ],
  "languages": [
    {
      "languageConceptId": "00000000-0000-4000-8000-000000000001",
      "proficiencyConceptId": "00000000-0000-4000-8000-000000000001",
      "clinicalInterpretationAllowed": true
    }
  ],
  "affiliations": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
      "organizationName": "Nombre de ejemplo",
      "roleTitle": "valor-ejemplo",
      "departmentText": "valor-ejemplo",
      "practiceSiteId": "00000000-0000-4000-8000-000000000001",
      "affiliationTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "startDate": "2026-07-31",
      "endDate": "2026-07-31",
      "current": true,
      "status": "00000000-0000-4000-8000-000000000001",
      "statusKind": {},
      "decisionReasonText": "Texto descriptivo de ejemplo",
      "createdAt": "2026-07-31T12:00:00.000Z"
    }
  ],
  "activity": {
    "encounters": 1,
    "medicationRequests": 1,
    "clinicalNotes": 1,
    "documents": 1
  },
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `profileId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `personId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `practitionerCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `displayName` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `professionalTitle` | No | `string` | Sin restricción adicional declarada | «Médica cardióloga», «Kinesiólogo». Texto libre del propio profesional. | `valor-ejemplo` |
| `professionalBio` | No | `string` | Sin restricción adicional declarada | Presentación en prosa. Es lo que hace que un perfil se lea como una persona. | `valor-ejemplo` |
| `photoFileId` | No | `string` | formato `uuid` | Foto de perfil, si cargó una. Se resuelve por el módulo de archivos. | `00000000-0000-4000-8000-000000000001` |
| `email` | No | `string` | Sin restricción adicional declarada | Sólo en la lectura propia | `usuario@example.com` |
| `phone` | No | `string` | Sin restricción adicional declarada | Sólo en la lectura propia | `+59170000000` |
| `practitionerCategoryConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `verificationStatusConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `practiceStatusConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `acceptsNewPatients` | Sí | `boolean` | Sin restricción adicional declarada | Si toma pacientes nuevos. Cambia qué se le puede ofrecer a quien busca. | `true` |
| `telehealthAvailable` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `specialties` | Sí | `array<PractitionerSpecialtyDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","specialtyConceptId":"00000000-0000-4000-8000-000000000001","isPrimary":true,"boardCertified":true,"practiceScopeText":"valor-ejemplo","verificationStatusConceptId":"00000000-0000-4000-8000-000000000001","validFrom":"2026-07-31T12:00:00.000Z","validTo":"2026-07-31T12:00:00.000Z"}]` |
| `specialties[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `specialties[].specialtyConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `specialties[].isPrimary` | Sí | `boolean` | Sin restricción adicional declarada | Si es la especialidad con la que se presenta. Hay una sola vigente. | `true` |
| `specialties[].boardCertified` | Sí | `boolean` | Sin restricción adicional declarada | Certificación del colegio o consejo. Es un dato que la gente busca. | `true` |
| `specialties[].practiceScopeText` | No | `string` | Sin restricción adicional declarada | Alcance de práctica en palabras del propio profesional. | `valor-ejemplo` |
| `specialties[].verificationStatusConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `specialties[].validFrom` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `specialties[].validTo` | No | `string` | formato `date-time` | Presente sólo si dejó de ejercerla. | `2026-07-31T12:00:00.000Z` |
| `credentials` | Sí | `array<PractitionerCredentialDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","credentialTypeConceptId":"00000000-0000-4000-8000-000000000001","number":"valor-ejemplo","issuingInstitutionText":"valor-ejemplo","issueDate":"2026-07-31T12:00:00.000Z","expiryDate":"2026-07-31T12:00:00.000Z","stateConceptId":"00000000-0000-4000-8000-000000000001","verifiedAt":"2026-07-31T12:00:00.000Z","verificationSourceUri":"valor-ejemplo"}]` |
| `credentials[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `credentials[].credentialTypeConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `credentials[].number` | Sí | `string` | Sin restricción adicional declarada | Nº de título o certificado. | `valor-ejemplo` |
| `credentials[].issuingInstitutionText` | No | `string` | Sin restricción adicional declarada | Dónde se cursó, en texto libre: la institución no siempre es un tenant. | `valor-ejemplo` |
| `credentials[].issueDate` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `credentials[].expiryDate` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `credentials[].stateConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `credentials[].verifiedAt` | No | `string` | formato `date-time` | Cuándo se comprobó la credencial contra su fuente. Ausente significa «no verificada todavía», que no es lo mismo que «rechazada» —eso lo dice `stateConceptId`—. | `2026-07-31T12:00:00.000Z` |
| `credentials[].verificationSourceUri` | No | `string` | Sin restricción adicional declarada | Contra qué se comprobó la credencial (registro del colegio médico, portal de matrículas, etc). Ausente antes de verificar: es evidencia de la verificación, no del dato declarado. | `valor-ejemplo` |
| `licenses` | Sí | `array<PractitionerLicenseDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","jurisdictionConceptId":"00000000-0000-4000-8000-000000000001","licenseNumber":"valor-ejemplo","regulatoryAuthority":"valor-ejemplo","stateConceptId":"00000000-0000-4000-8000-000000000001","validFrom":"2026-07-31T12:00:00.000Z","validTo":"2026-07-31T12:00:00.000Z"}]` |
| `licenses[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `licenses[].jurisdictionConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `licenses[].licenseNumber` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `licenses[].regulatoryAuthority` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `licenses[].stateConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `licenses[].validFrom` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `licenses[].validTo` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `languages` | Sí | `array<PractitionerLanguageDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"languageConceptId":"00000000-0000-4000-8000-000000000001","proficiencyConceptId":"00000000-0000-4000-8000-000000000001","clinicalInterpretationAllowed":true}]` |
| `languages[].languageConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `languages[].proficiencyConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `languages[].clinicalInterpretationAllowed` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `affiliations` | Sí | `array<AffiliationResponseDto>` | Sin restricción adicional declarada | Historial laboral (UC-05-16): trayectoria, no PHI. Se devuelve un único array de la más reciente a la más antigua, con `current` ya derivado en cada fila — pantalla la agrupa en fases (formación/histórico/actual), la lectura no necesita decidir eso. | `[{"id":"00000000-0000-4000-8000-000000000001","practitionerProfileId":"00000000-0000-4000-8000-000000000001","organizationName":"Nombre de ejemplo","roleTitle":"valor-ejemplo","departmentText":"valor-ejemplo","practiceSiteId":"00000000-0000-4000-8000-000000000001","affiliationTypeConceptId":"00000000-0000-4000-8000-000000000001","startDate":"2026-07-31","endDate":"2026-07-31","current":true,"status":"00000000-0000-4000-8000-000000000001","statusKind":{},"decisionReasonText":"Texto descriptivo de ejemplo","createdAt":"2026-07-31T12:00:00.000Z"}]` |
| `affiliations[].id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `affiliations[].practitionerProfileId` | Sí | `string` | formato `uuid` | Identificador asociado a practitioner profile. | `00000000-0000-4000-8000-000000000001` |
| `affiliations[].organizationName` | Sí | `string` | Sin restricción adicional declarada | Institución. | `Nombre de ejemplo` |
| `affiliations[].roleTitle` | Sí | `string` | Sin restricción adicional declarada | Cargo. | `valor-ejemplo` |
| `affiliations[].departmentText` | No | `string` | admite null | Servicio o departamento. | `valor-ejemplo` |
| `affiliations[].practiceSiteId` | No | `string` | formato `uuid`; admite null | Sede de la plataforma, si la institución está dentro. | `00000000-0000-4000-8000-000000000001` |
| `affiliations[].affiliationTypeConceptId` | No | `string` | formato `uuid`; admite null | Tipo de vínculo. | `00000000-0000-4000-8000-000000000001` |
| `affiliations[].startDate` | Sí | `string` | formato `date` | Inicio del vínculo. | `2026-07-31` |
| `affiliations[].endDate` | No | `string` | formato `date`; admite null | Fin del vínculo, o `null` si sigue vigente. | `2026-07-31` |
| `affiliations[].current` | Sí | `boolean` | Sin restricción adicional declarada | Derivado de `endDate`: sin fin declarado, sigue vigente | `true` |
| `affiliations[].status` | Sí | `string` | formato `uuid` | Estado del registro (concept id). | `00000000-0000-4000-8000-000000000001` |
| `affiliations[].statusKind` | Sí | `object` | valores: `pendiente`, `declarado`, `aprobado`, `rechazado`, `revocado`, `desconocido` | El mismo estado, en algo sobre lo que una pantalla pueda ramificar. El concept id sigue viajando en `status` y es la verdad; esto es una derivación de conveniencia. Existe porque la alternativa era que el frontend comparara uuids escritos a mano, que es exactamente lo que el proyecto prohíbe: los conceptos se resuelven en el servidor. `desconocido` cuando el estado no es ninguno de los tres esperados. Es preferible a suponer: cuando exista el value set de estados —donde entra `declarado`— las pantallas que ya distinguen los casos conocidos no van a mentir sobre el nuevo, van a decir que no lo reconocen. | `{}` |
| `affiliations[].decisionReasonText` | No | `string` | admite null | Por qué la organización rechazó o dio de baja el vínculo. **Lo lee el profesional**, no es una nota interna. Un rechazo sin motivo es mudo para quien lo recibe, y quien lo escribe tiene que saber que se lee. `null` en cualquier otro estado. | `Texto descriptivo de ejemplo` |
| `affiliations[].createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |
| `activity` | Sí | `PractitionerActivityDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"encounters":1,"medicationRequests":1,"clinicalNotes":1,"documents":1}` |
| `activity.encounters` | Sí | `number` | Sin restricción adicional declarada | Encuentros que abrió. | `1` |
| `activity.medicationRequests` | Sí | `number` | Sin restricción adicional declarada | Recetas que prescribió. | `1` |
| `activity.clinicalNotes` | Sí | `number` | Sin restricción adicional declarada | Notas clínicas que redactó. | `1` |
| `activity.documents` | Sí | `number` | Sin restricción adicional declarada | Documentos que publicó en expedientes. | `1` |
| `createdAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Sólo el titular del perfil profesional o la plataforma pueden modificarlo | Excepción explícita en src/modules/profiles/services/profile-ownership.service.ts |
| 403 | `FORBIDDEN` | ${labels.subject} no le pertenece | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 404 | `NOT_FOUND` | Profesional no encontrado | Excepción explícita en src/modules/profiles/services/profiles-practitioners.service.ts |
| 404 | `NOT_FOUND` | Perfil profesional no encontrado | Excepción explícita en src/modules/profiles/services/profiles-practitioners.service.ts |
| 404 | `NOT_FOUND` | labels.notFound | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | ${labels.subject} está borrado | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 422 | `PRECONDITION_FAILED` | ${labels.subject} no tiene una versión vigente | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 422 | `PRECONDITION_FAILED` | ${labels.subject} resultó infectado | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 422 | `PRECONDITION_FAILED` | ${labels.subject} no es de un formato admitido para este uso | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/profiles/practitioners/{profileId}/photo"
}
```

---

## 21. POST /profiles/practitioners/{profileId}/specialties

- **Módulo:** `profiles`
- **Etiqueta OpenAPI:** `profiles-practitioners`
- **Nombre:** Agregar especialidad con credencial de soporte
- **Operation ID:** `ProfilesPractitionersController_addSpecialty`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ProfilesPractitionersController.addSpecialty](../../src/modules/profiles/controllers/profiles-practitioners.controller.ts)

### Descripción de negocio

Agregar especialidad con credencial de soporte. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /profiles/practitioners/{profileId}/specialties` en `ProfilesPractitionersController_addSpecialty`. El controlador delega en `ProfilesPractitionersService.addSpecialty`. Valida el body como `AddSpecialtyDto` y consume `application/json`. El tipo de retorno estático es `Promise<SpecialtyResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `profileId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `AddSpecialtyDto`; los campos opcionales se omiten.

```http
POST /profiles/practitioners/00000000-0000-4000-8000-000000000001/specialties HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `profileId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `specialtyConceptId` | No | `string` | formato `uuid` | Concept id de la especialidad | `00000000-0000-4000-8000-000000000001` |
| `supportingCredentialId` | No | `string` | formato `uuid` | Credencial de soporte (debe pertenecer al profesional y estar verificada) | `00000000-0000-4000-8000-000000000001` |
| `specialtyRoleConceptId` | No | `string` | formato `uuid` | Concept id del rol de especialidad | `00000000-0000-4000-8000-000000000001` |
| `isPrimary` | No | `boolean` | Sin restricción adicional declarada | Marca la especialidad como primaria | `true` |
| `boardCertified` | No | `boolean` | Sin restricción adicional declarada | Certificada por junta (board certified) | `true` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /profiles/practitioners/00000000-0000-4000-8000-000000000001/specialties HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "specialtyConceptId": "00000000-0000-4000-8000-000000000001",
  "supportingCredentialId": "00000000-0000-4000-8000-000000000001",
  "specialtyRoleConceptId": "00000000-0000-4000-8000-000000000001",
  "isPrimary": true,
  "boardCertified": true
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<SpecialtyResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<SpecialtyResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<SpecialtyResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<SpecialtyResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<SpecialtyResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<SpecialtyResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<SpecialtyResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<SpecialtyResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<SpecialtyResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<SpecialtyResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `SpecialtyResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "specialtyConceptId": "00000000-0000-4000-8000-000000000001",
  "isPrimary": true,
  "verificationStatus": "00000000-0000-4000-8000-000000000001",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `specialtyConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a specialty concept. | `00000000-0000-4000-8000-000000000001` |
| `isPrimary` | Sí | `boolean` | Sin restricción adicional declarada | Valor de is primary mantenido por la instancia. | `true` |
| `verificationStatus` | Sí | `string` | formato `uuid` | Concept id del estado de verificación | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Sólo el titular del perfil profesional o la plataforma pueden modificarlo | Excepción explícita en src/modules/profiles/services/profile-ownership.service.ts |
| 404 | `NOT_FOUND` | Profesional no encontrado | Excepción explícita en src/modules/profiles/services/profiles-practitioners.service.ts |
| 409 | `CONFLICT` | El profesional ya tiene esa especialidad activa | Excepción explícita en src/modules/profiles/services/profiles-practitioners.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La credencial de soporte no pertenece al profesional | Excepción explícita en src/modules/profiles/services/profiles-practitioners.service.ts |
| 422 | `PRECONDITION_FAILED` | La credencial de soporte no está verificada | Excepción explícita en src/modules/profiles/services/profiles-practitioners.service.ts |
| 422 | `PRECONDITION_FAILED` | Falta indicar la especialidad | Excepción explícita en src/modules/profiles/services/profiles-practitioners.service.ts |
| 422 | `PRECONDITION_FAILED` | Un profesional puede declarar hasta ${MAX_SPECIALTIES_PER_PRACTITIONER} especialidades | Excepción explícita en src/modules/profiles/services/profiles-practitioners.service.ts |
| 422 | `PRECONDITION_FAILED` | La especialidad no pertenece al catálogo de especialidades médicas | Excepción explícita en src/modules/profiles/services/medical-specialty-catalog.service.ts |
| 422 | `PRECONDITION_FAILED` | El catálogo de especialidades médicas no está disponible | Excepción explícita en src/modules/profiles/services/medical-specialty-catalog.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/profiles/practitioners/{profileId}/specialties"
}
```

---

## 22. GET /profiles/practitioners/{profileId}/summary

- **Módulo:** `profiles`
- **Etiqueta OpenAPI:** `profiles-practitioners`
- **Nombre:** Consultar el perfil profesional de un colega (ficha de la guía)
- **Operation ID:** `ProfilesPractitionersController_getPractitionerSummary`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ProfilesPractitionersController.getPractitionerSummary](../../src/modules/profiles/controllers/profiles-practitioners.controller.ts)

### Descripción de negocio

Consultar el perfil profesional de un colega (ficha de la guía). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: El perfil de un colega — la ficha que abre la guía (R2-1). Mismo shape que `me/summary`: mismo contrato, cambia de dónde sale el sujeto. Sin `@Roles` por lo mismo que el listado. Va declarado DESPUÉS de las rutas `practitioners/me/*`: Nest resuelve por orden de declaración y el parámetro capturaría `me` (el pipe lo respondería 400).

### Descripción del sistema

NestJS resuelve `GET /profiles/practitioners/{profileId}/summary` en `ProfilesPractitionersController_getPractitionerSummary`. El controlador delega en `ProfilesPractitionersService.getPractitionerSummary`. No recibe body. El tipo de retorno estático es `Promise<PractitionerProfileSummaryDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `profileId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /profiles/practitioners/00000000-0000-4000-8000-000000000001/summary HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `profileId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /profiles/practitioners/00000000-0000-4000-8000-000000000001/summary HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PractitionerProfileSummaryDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<PractitionerProfileSummaryDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<PractitionerProfileSummaryDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<PractitionerProfileSummaryDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<PractitionerProfileSummaryDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<PractitionerProfileSummaryDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<PractitionerProfileSummaryDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PractitionerProfileSummaryDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "profileId": "00000000-0000-4000-8000-000000000001",
  "personId": "00000000-0000-4000-8000-000000000001",
  "practitionerCode": "CODIGO_EJEMPLO",
  "displayName": "Nombre de ejemplo",
  "professionalTitle": "valor-ejemplo",
  "professionalBio": "valor-ejemplo",
  "photoFileId": "00000000-0000-4000-8000-000000000001",
  "email": "usuario@example.com",
  "phone": "+59170000000",
  "practitionerCategoryConceptId": "00000000-0000-4000-8000-000000000001",
  "verificationStatusConceptId": "00000000-0000-4000-8000-000000000001",
  "practiceStatusConceptId": "00000000-0000-4000-8000-000000000001",
  "acceptsNewPatients": true,
  "telehealthAvailable": true,
  "specialties": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "specialtyConceptId": "00000000-0000-4000-8000-000000000001",
      "isPrimary": true,
      "boardCertified": true,
      "practiceScopeText": "valor-ejemplo",
      "verificationStatusConceptId": "00000000-0000-4000-8000-000000000001",
      "validFrom": "2026-07-31T12:00:00.000Z",
      "validTo": "2026-07-31T12:00:00.000Z"
    }
  ],
  "credentials": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "credentialTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "number": "valor-ejemplo",
      "issuingInstitutionText": "valor-ejemplo",
      "issueDate": "2026-07-31T12:00:00.000Z",
      "expiryDate": "2026-07-31T12:00:00.000Z",
      "stateConceptId": "00000000-0000-4000-8000-000000000001",
      "verifiedAt": "2026-07-31T12:00:00.000Z",
      "verificationSourceUri": "valor-ejemplo"
    }
  ],
  "licenses": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "jurisdictionConceptId": "00000000-0000-4000-8000-000000000001",
      "licenseNumber": "valor-ejemplo",
      "regulatoryAuthority": "valor-ejemplo",
      "stateConceptId": "00000000-0000-4000-8000-000000000001",
      "validFrom": "2026-07-31T12:00:00.000Z",
      "validTo": "2026-07-31T12:00:00.000Z"
    }
  ],
  "languages": [
    {
      "languageConceptId": "00000000-0000-4000-8000-000000000001",
      "proficiencyConceptId": "00000000-0000-4000-8000-000000000001",
      "clinicalInterpretationAllowed": true
    }
  ],
  "affiliations": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
      "organizationName": "Nombre de ejemplo",
      "roleTitle": "valor-ejemplo",
      "departmentText": "valor-ejemplo",
      "practiceSiteId": "00000000-0000-4000-8000-000000000001",
      "affiliationTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "startDate": "2026-07-31",
      "endDate": "2026-07-31",
      "current": true,
      "status": "00000000-0000-4000-8000-000000000001",
      "statusKind": {},
      "decisionReasonText": "Texto descriptivo de ejemplo",
      "createdAt": "2026-07-31T12:00:00.000Z"
    }
  ],
  "activity": {
    "encounters": 1,
    "medicationRequests": 1,
    "clinicalNotes": 1,
    "documents": 1
  },
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `profileId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `personId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `practitionerCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `displayName` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `professionalTitle` | No | `string` | Sin restricción adicional declarada | «Médica cardióloga», «Kinesiólogo». Texto libre del propio profesional. | `valor-ejemplo` |
| `professionalBio` | No | `string` | Sin restricción adicional declarada | Presentación en prosa. Es lo que hace que un perfil se lea como una persona. | `valor-ejemplo` |
| `photoFileId` | No | `string` | formato `uuid` | Foto de perfil, si cargó una. Se resuelve por el módulo de archivos. | `00000000-0000-4000-8000-000000000001` |
| `email` | No | `string` | Sin restricción adicional declarada | Sólo en la lectura propia | `usuario@example.com` |
| `phone` | No | `string` | Sin restricción adicional declarada | Sólo en la lectura propia | `+59170000000` |
| `practitionerCategoryConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `verificationStatusConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `practiceStatusConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `acceptsNewPatients` | Sí | `boolean` | Sin restricción adicional declarada | Si toma pacientes nuevos. Cambia qué se le puede ofrecer a quien busca. | `true` |
| `telehealthAvailable` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `specialties` | Sí | `array<PractitionerSpecialtyDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","specialtyConceptId":"00000000-0000-4000-8000-000000000001","isPrimary":true,"boardCertified":true,"practiceScopeText":"valor-ejemplo","verificationStatusConceptId":"00000000-0000-4000-8000-000000000001","validFrom":"2026-07-31T12:00:00.000Z","validTo":"2026-07-31T12:00:00.000Z"}]` |
| `specialties[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `specialties[].specialtyConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `specialties[].isPrimary` | Sí | `boolean` | Sin restricción adicional declarada | Si es la especialidad con la que se presenta. Hay una sola vigente. | `true` |
| `specialties[].boardCertified` | Sí | `boolean` | Sin restricción adicional declarada | Certificación del colegio o consejo. Es un dato que la gente busca. | `true` |
| `specialties[].practiceScopeText` | No | `string` | Sin restricción adicional declarada | Alcance de práctica en palabras del propio profesional. | `valor-ejemplo` |
| `specialties[].verificationStatusConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `specialties[].validFrom` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `specialties[].validTo` | No | `string` | formato `date-time` | Presente sólo si dejó de ejercerla. | `2026-07-31T12:00:00.000Z` |
| `credentials` | Sí | `array<PractitionerCredentialDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","credentialTypeConceptId":"00000000-0000-4000-8000-000000000001","number":"valor-ejemplo","issuingInstitutionText":"valor-ejemplo","issueDate":"2026-07-31T12:00:00.000Z","expiryDate":"2026-07-31T12:00:00.000Z","stateConceptId":"00000000-0000-4000-8000-000000000001","verifiedAt":"2026-07-31T12:00:00.000Z","verificationSourceUri":"valor-ejemplo"}]` |
| `credentials[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `credentials[].credentialTypeConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `credentials[].number` | Sí | `string` | Sin restricción adicional declarada | Nº de título o certificado. | `valor-ejemplo` |
| `credentials[].issuingInstitutionText` | No | `string` | Sin restricción adicional declarada | Dónde se cursó, en texto libre: la institución no siempre es un tenant. | `valor-ejemplo` |
| `credentials[].issueDate` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `credentials[].expiryDate` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `credentials[].stateConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `credentials[].verifiedAt` | No | `string` | formato `date-time` | Cuándo se comprobó la credencial contra su fuente. Ausente significa «no verificada todavía», que no es lo mismo que «rechazada» —eso lo dice `stateConceptId`—. | `2026-07-31T12:00:00.000Z` |
| `credentials[].verificationSourceUri` | No | `string` | Sin restricción adicional declarada | Contra qué se comprobó la credencial (registro del colegio médico, portal de matrículas, etc). Ausente antes de verificar: es evidencia de la verificación, no del dato declarado. | `valor-ejemplo` |
| `licenses` | Sí | `array<PractitionerLicenseDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","jurisdictionConceptId":"00000000-0000-4000-8000-000000000001","licenseNumber":"valor-ejemplo","regulatoryAuthority":"valor-ejemplo","stateConceptId":"00000000-0000-4000-8000-000000000001","validFrom":"2026-07-31T12:00:00.000Z","validTo":"2026-07-31T12:00:00.000Z"}]` |
| `licenses[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `licenses[].jurisdictionConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `licenses[].licenseNumber` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `licenses[].regulatoryAuthority` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `licenses[].stateConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `licenses[].validFrom` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `licenses[].validTo` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `languages` | Sí | `array<PractitionerLanguageDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"languageConceptId":"00000000-0000-4000-8000-000000000001","proficiencyConceptId":"00000000-0000-4000-8000-000000000001","clinicalInterpretationAllowed":true}]` |
| `languages[].languageConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `languages[].proficiencyConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `languages[].clinicalInterpretationAllowed` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `affiliations` | Sí | `array<AffiliationResponseDto>` | Sin restricción adicional declarada | Historial laboral (UC-05-16): trayectoria, no PHI. Se devuelve un único array de la más reciente a la más antigua, con `current` ya derivado en cada fila — pantalla la agrupa en fases (formación/histórico/actual), la lectura no necesita decidir eso. | `[{"id":"00000000-0000-4000-8000-000000000001","practitionerProfileId":"00000000-0000-4000-8000-000000000001","organizationName":"Nombre de ejemplo","roleTitle":"valor-ejemplo","departmentText":"valor-ejemplo","practiceSiteId":"00000000-0000-4000-8000-000000000001","affiliationTypeConceptId":"00000000-0000-4000-8000-000000000001","startDate":"2026-07-31","endDate":"2026-07-31","current":true,"status":"00000000-0000-4000-8000-000000000001","statusKind":{},"decisionReasonText":"Texto descriptivo de ejemplo","createdAt":"2026-07-31T12:00:00.000Z"}]` |
| `affiliations[].id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `affiliations[].practitionerProfileId` | Sí | `string` | formato `uuid` | Identificador asociado a practitioner profile. | `00000000-0000-4000-8000-000000000001` |
| `affiliations[].organizationName` | Sí | `string` | Sin restricción adicional declarada | Institución. | `Nombre de ejemplo` |
| `affiliations[].roleTitle` | Sí | `string` | Sin restricción adicional declarada | Cargo. | `valor-ejemplo` |
| `affiliations[].departmentText` | No | `string` | admite null | Servicio o departamento. | `valor-ejemplo` |
| `affiliations[].practiceSiteId` | No | `string` | formato `uuid`; admite null | Sede de la plataforma, si la institución está dentro. | `00000000-0000-4000-8000-000000000001` |
| `affiliations[].affiliationTypeConceptId` | No | `string` | formato `uuid`; admite null | Tipo de vínculo. | `00000000-0000-4000-8000-000000000001` |
| `affiliations[].startDate` | Sí | `string` | formato `date` | Inicio del vínculo. | `2026-07-31` |
| `affiliations[].endDate` | No | `string` | formato `date`; admite null | Fin del vínculo, o `null` si sigue vigente. | `2026-07-31` |
| `affiliations[].current` | Sí | `boolean` | Sin restricción adicional declarada | Derivado de `endDate`: sin fin declarado, sigue vigente | `true` |
| `affiliations[].status` | Sí | `string` | formato `uuid` | Estado del registro (concept id). | `00000000-0000-4000-8000-000000000001` |
| `affiliations[].statusKind` | Sí | `object` | valores: `pendiente`, `declarado`, `aprobado`, `rechazado`, `revocado`, `desconocido` | El mismo estado, en algo sobre lo que una pantalla pueda ramificar. El concept id sigue viajando en `status` y es la verdad; esto es una derivación de conveniencia. Existe porque la alternativa era que el frontend comparara uuids escritos a mano, que es exactamente lo que el proyecto prohíbe: los conceptos se resuelven en el servidor. `desconocido` cuando el estado no es ninguno de los tres esperados. Es preferible a suponer: cuando exista el value set de estados —donde entra `declarado`— las pantallas que ya distinguen los casos conocidos no van a mentir sobre el nuevo, van a decir que no lo reconocen. | `{}` |
| `affiliations[].decisionReasonText` | No | `string` | admite null | Por qué la organización rechazó o dio de baja el vínculo. **Lo lee el profesional**, no es una nota interna. Un rechazo sin motivo es mudo para quien lo recibe, y quien lo escribe tiene que saber que se lee. `null` en cualquier otro estado. | `Texto descriptivo de ejemplo` |
| `affiliations[].createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |
| `activity` | Sí | `PractitionerActivityDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"encounters":1,"medicationRequests":1,"clinicalNotes":1,"documents":1}` |
| `activity.encounters` | Sí | `number` | Sin restricción adicional declarada | Encuentros que abrió. | `1` |
| `activity.medicationRequests` | Sí | `number` | Sin restricción adicional declarada | Recetas que prescribió. | `1` |
| `activity.clinicalNotes` | Sí | `number` | Sin restricción adicional declarada | Notas clínicas que redactó. | `1` |
| `activity.documents` | Sí | `number` | Sin restricción adicional declarada | Documentos que publicó en expedientes. | `1` |
| `createdAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Perfil profesional no encontrado | Excepción explícita en src/modules/profiles/services/profiles-practitioners.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/profiles/practitioners/{profileId}/summary"
}
```

---

## 23. PATCH /profiles/practitioners/me

- **Módulo:** `profiles`
- **Etiqueta OpenAPI:** `profiles-practitioners`
- **Nombre:** Editar la presentación del propio perfil profesional
- **Operation ID:** `ProfilesPractitionersController_updateOwnPractitionerProfile`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ProfilesPractitionersController.updateOwnPractitionerProfile](../../src/modules/profiles/controllers/profiles-practitioners.controller.ts)

### Descripción de negocio

Editar la presentación del propio perfil profesional. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Editar el propio perfil profesional. Sin `@Roles` por lo mismo que la lectura: el sujeto lo resuelve el servidor desde la sesión y no hay parámetro que apunte a otro, así que lo único que se puede editar es lo propio. Lo editable es la **presentación** —título, biografía, disponibilidad—: el estado de verificación y el de práctica los mueve el trámite de la matrícula, y dejarlos acá convertiría el perfil en una declaración jurada de uno mismo.

### Descripción del sistema

NestJS resuelve `PATCH /profiles/practitioners/me` en `ProfilesPractitionersController_updateOwnPractitionerProfile`. El controlador delega en `ProfilesPractitionersService.updateOwnPractitionerProfile`. Valida el body como `UpdateOwnPractitionerProfileDto` y consume `application/json`. El tipo de retorno estático es `Promise<PractitionerProfileSummaryDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `UpdateOwnPractitionerProfileDto`; los campos opcionales se omiten.

```http
PATCH /profiles/practitioners/me HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `professionalTitle` | No | `string` | longitud máxima 200 | Título profesional | `valor-ejemplo` |
| `professionalBio` | No | `string` | longitud máxima 4000 | Biografía profesional | `valor-ejemplo` |
| `acceptsNewPatients` | No | `boolean` | Sin restricción adicional declarada | Si acepta pacientes nuevos | `true` |
| `telehealthAvailable` | No | `boolean` | Sin restricción adicional declarada | Si atiende por telemedicina | `true` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PATCH /profiles/practitioners/me HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "professionalTitle": "valor-ejemplo",
  "professionalBio": "valor-ejemplo",
  "acceptsNewPatients": true,
  "telehealthAvailable": true
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PractitionerProfileSummaryDto>` | No |
| 400 | Operación completada correctamente. | `Promise<PractitionerProfileSummaryDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PractitionerProfileSummaryDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PractitionerProfileSummaryDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PractitionerProfileSummaryDto>` | No |
| 413 | Operación completada correctamente. | `Promise<PractitionerProfileSummaryDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PractitionerProfileSummaryDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PractitionerProfileSummaryDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PractitionerProfileSummaryDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PractitionerProfileSummaryDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "profileId": "00000000-0000-4000-8000-000000000001",
  "personId": "00000000-0000-4000-8000-000000000001",
  "practitionerCode": "CODIGO_EJEMPLO",
  "displayName": "Nombre de ejemplo",
  "professionalTitle": "valor-ejemplo",
  "professionalBio": "valor-ejemplo",
  "photoFileId": "00000000-0000-4000-8000-000000000001",
  "email": "usuario@example.com",
  "phone": "+59170000000",
  "practitionerCategoryConceptId": "00000000-0000-4000-8000-000000000001",
  "verificationStatusConceptId": "00000000-0000-4000-8000-000000000001",
  "practiceStatusConceptId": "00000000-0000-4000-8000-000000000001",
  "acceptsNewPatients": true,
  "telehealthAvailable": true,
  "specialties": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "specialtyConceptId": "00000000-0000-4000-8000-000000000001",
      "isPrimary": true,
      "boardCertified": true,
      "practiceScopeText": "valor-ejemplo",
      "verificationStatusConceptId": "00000000-0000-4000-8000-000000000001",
      "validFrom": "2026-07-31T12:00:00.000Z",
      "validTo": "2026-07-31T12:00:00.000Z"
    }
  ],
  "credentials": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "credentialTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "number": "valor-ejemplo",
      "issuingInstitutionText": "valor-ejemplo",
      "issueDate": "2026-07-31T12:00:00.000Z",
      "expiryDate": "2026-07-31T12:00:00.000Z",
      "stateConceptId": "00000000-0000-4000-8000-000000000001",
      "verifiedAt": "2026-07-31T12:00:00.000Z",
      "verificationSourceUri": "valor-ejemplo"
    }
  ],
  "licenses": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "jurisdictionConceptId": "00000000-0000-4000-8000-000000000001",
      "licenseNumber": "valor-ejemplo",
      "regulatoryAuthority": "valor-ejemplo",
      "stateConceptId": "00000000-0000-4000-8000-000000000001",
      "validFrom": "2026-07-31T12:00:00.000Z",
      "validTo": "2026-07-31T12:00:00.000Z"
    }
  ],
  "languages": [
    {
      "languageConceptId": "00000000-0000-4000-8000-000000000001",
      "proficiencyConceptId": "00000000-0000-4000-8000-000000000001",
      "clinicalInterpretationAllowed": true
    }
  ],
  "affiliations": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
      "organizationName": "Nombre de ejemplo",
      "roleTitle": "valor-ejemplo",
      "departmentText": "valor-ejemplo",
      "practiceSiteId": "00000000-0000-4000-8000-000000000001",
      "affiliationTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "startDate": "2026-07-31",
      "endDate": "2026-07-31",
      "current": true,
      "status": "00000000-0000-4000-8000-000000000001",
      "statusKind": {},
      "decisionReasonText": "Texto descriptivo de ejemplo",
      "createdAt": "2026-07-31T12:00:00.000Z"
    }
  ],
  "activity": {
    "encounters": 1,
    "medicationRequests": 1,
    "clinicalNotes": 1,
    "documents": 1
  },
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `profileId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `personId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `practitionerCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `displayName` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `professionalTitle` | No | `string` | Sin restricción adicional declarada | «Médica cardióloga», «Kinesiólogo». Texto libre del propio profesional. | `valor-ejemplo` |
| `professionalBio` | No | `string` | Sin restricción adicional declarada | Presentación en prosa. Es lo que hace que un perfil se lea como una persona. | `valor-ejemplo` |
| `photoFileId` | No | `string` | formato `uuid` | Foto de perfil, si cargó una. Se resuelve por el módulo de archivos. | `00000000-0000-4000-8000-000000000001` |
| `email` | No | `string` | Sin restricción adicional declarada | Sólo en la lectura propia | `usuario@example.com` |
| `phone` | No | `string` | Sin restricción adicional declarada | Sólo en la lectura propia | `+59170000000` |
| `practitionerCategoryConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `verificationStatusConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `practiceStatusConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `acceptsNewPatients` | Sí | `boolean` | Sin restricción adicional declarada | Si toma pacientes nuevos. Cambia qué se le puede ofrecer a quien busca. | `true` |
| `telehealthAvailable` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `specialties` | Sí | `array<PractitionerSpecialtyDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","specialtyConceptId":"00000000-0000-4000-8000-000000000001","isPrimary":true,"boardCertified":true,"practiceScopeText":"valor-ejemplo","verificationStatusConceptId":"00000000-0000-4000-8000-000000000001","validFrom":"2026-07-31T12:00:00.000Z","validTo":"2026-07-31T12:00:00.000Z"}]` |
| `specialties[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `specialties[].specialtyConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `specialties[].isPrimary` | Sí | `boolean` | Sin restricción adicional declarada | Si es la especialidad con la que se presenta. Hay una sola vigente. | `true` |
| `specialties[].boardCertified` | Sí | `boolean` | Sin restricción adicional declarada | Certificación del colegio o consejo. Es un dato que la gente busca. | `true` |
| `specialties[].practiceScopeText` | No | `string` | Sin restricción adicional declarada | Alcance de práctica en palabras del propio profesional. | `valor-ejemplo` |
| `specialties[].verificationStatusConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `specialties[].validFrom` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `specialties[].validTo` | No | `string` | formato `date-time` | Presente sólo si dejó de ejercerla. | `2026-07-31T12:00:00.000Z` |
| `credentials` | Sí | `array<PractitionerCredentialDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","credentialTypeConceptId":"00000000-0000-4000-8000-000000000001","number":"valor-ejemplo","issuingInstitutionText":"valor-ejemplo","issueDate":"2026-07-31T12:00:00.000Z","expiryDate":"2026-07-31T12:00:00.000Z","stateConceptId":"00000000-0000-4000-8000-000000000001","verifiedAt":"2026-07-31T12:00:00.000Z","verificationSourceUri":"valor-ejemplo"}]` |
| `credentials[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `credentials[].credentialTypeConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `credentials[].number` | Sí | `string` | Sin restricción adicional declarada | Nº de título o certificado. | `valor-ejemplo` |
| `credentials[].issuingInstitutionText` | No | `string` | Sin restricción adicional declarada | Dónde se cursó, en texto libre: la institución no siempre es un tenant. | `valor-ejemplo` |
| `credentials[].issueDate` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `credentials[].expiryDate` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `credentials[].stateConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `credentials[].verifiedAt` | No | `string` | formato `date-time` | Cuándo se comprobó la credencial contra su fuente. Ausente significa «no verificada todavía», que no es lo mismo que «rechazada» —eso lo dice `stateConceptId`—. | `2026-07-31T12:00:00.000Z` |
| `credentials[].verificationSourceUri` | No | `string` | Sin restricción adicional declarada | Contra qué se comprobó la credencial (registro del colegio médico, portal de matrículas, etc). Ausente antes de verificar: es evidencia de la verificación, no del dato declarado. | `valor-ejemplo` |
| `licenses` | Sí | `array<PractitionerLicenseDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","jurisdictionConceptId":"00000000-0000-4000-8000-000000000001","licenseNumber":"valor-ejemplo","regulatoryAuthority":"valor-ejemplo","stateConceptId":"00000000-0000-4000-8000-000000000001","validFrom":"2026-07-31T12:00:00.000Z","validTo":"2026-07-31T12:00:00.000Z"}]` |
| `licenses[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `licenses[].jurisdictionConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `licenses[].licenseNumber` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `licenses[].regulatoryAuthority` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `licenses[].stateConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `licenses[].validFrom` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `licenses[].validTo` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `languages` | Sí | `array<PractitionerLanguageDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"languageConceptId":"00000000-0000-4000-8000-000000000001","proficiencyConceptId":"00000000-0000-4000-8000-000000000001","clinicalInterpretationAllowed":true}]` |
| `languages[].languageConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `languages[].proficiencyConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `languages[].clinicalInterpretationAllowed` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `affiliations` | Sí | `array<AffiliationResponseDto>` | Sin restricción adicional declarada | Historial laboral (UC-05-16): trayectoria, no PHI. Se devuelve un único array de la más reciente a la más antigua, con `current` ya derivado en cada fila — pantalla la agrupa en fases (formación/histórico/actual), la lectura no necesita decidir eso. | `[{"id":"00000000-0000-4000-8000-000000000001","practitionerProfileId":"00000000-0000-4000-8000-000000000001","organizationName":"Nombre de ejemplo","roleTitle":"valor-ejemplo","departmentText":"valor-ejemplo","practiceSiteId":"00000000-0000-4000-8000-000000000001","affiliationTypeConceptId":"00000000-0000-4000-8000-000000000001","startDate":"2026-07-31","endDate":"2026-07-31","current":true,"status":"00000000-0000-4000-8000-000000000001","statusKind":{},"decisionReasonText":"Texto descriptivo de ejemplo","createdAt":"2026-07-31T12:00:00.000Z"}]` |
| `affiliations[].id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `affiliations[].practitionerProfileId` | Sí | `string` | formato `uuid` | Identificador asociado a practitioner profile. | `00000000-0000-4000-8000-000000000001` |
| `affiliations[].organizationName` | Sí | `string` | Sin restricción adicional declarada | Institución. | `Nombre de ejemplo` |
| `affiliations[].roleTitle` | Sí | `string` | Sin restricción adicional declarada | Cargo. | `valor-ejemplo` |
| `affiliations[].departmentText` | No | `string` | admite null | Servicio o departamento. | `valor-ejemplo` |
| `affiliations[].practiceSiteId` | No | `string` | formato `uuid`; admite null | Sede de la plataforma, si la institución está dentro. | `00000000-0000-4000-8000-000000000001` |
| `affiliations[].affiliationTypeConceptId` | No | `string` | formato `uuid`; admite null | Tipo de vínculo. | `00000000-0000-4000-8000-000000000001` |
| `affiliations[].startDate` | Sí | `string` | formato `date` | Inicio del vínculo. | `2026-07-31` |
| `affiliations[].endDate` | No | `string` | formato `date`; admite null | Fin del vínculo, o `null` si sigue vigente. | `2026-07-31` |
| `affiliations[].current` | Sí | `boolean` | Sin restricción adicional declarada | Derivado de `endDate`: sin fin declarado, sigue vigente | `true` |
| `affiliations[].status` | Sí | `string` | formato `uuid` | Estado del registro (concept id). | `00000000-0000-4000-8000-000000000001` |
| `affiliations[].statusKind` | Sí | `object` | valores: `pendiente`, `declarado`, `aprobado`, `rechazado`, `revocado`, `desconocido` | El mismo estado, en algo sobre lo que una pantalla pueda ramificar. El concept id sigue viajando en `status` y es la verdad; esto es una derivación de conveniencia. Existe porque la alternativa era que el frontend comparara uuids escritos a mano, que es exactamente lo que el proyecto prohíbe: los conceptos se resuelven en el servidor. `desconocido` cuando el estado no es ninguno de los tres esperados. Es preferible a suponer: cuando exista el value set de estados —donde entra `declarado`— las pantallas que ya distinguen los casos conocidos no van a mentir sobre el nuevo, van a decir que no lo reconocen. | `{}` |
| `affiliations[].decisionReasonText` | No | `string` | admite null | Por qué la organización rechazó o dio de baja el vínculo. **Lo lee el profesional**, no es una nota interna. Un rechazo sin motivo es mudo para quien lo recibe, y quien lo escribe tiene que saber que se lee. `null` en cualquier otro estado. | `Texto descriptivo de ejemplo` |
| `affiliations[].createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |
| `activity` | Sí | `PractitionerActivityDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"encounters":1,"medicationRequests":1,"clinicalNotes":1,"documents":1}` |
| `activity.encounters` | Sí | `number` | Sin restricción adicional declarada | Encuentros que abrió. | `1` |
| `activity.medicationRequests` | Sí | `number` | Sin restricción adicional declarada | Recetas que prescribió. | `1` |
| `activity.clinicalNotes` | Sí | `number` | Sin restricción adicional declarada | Notas clínicas que redactó. | `1` |
| `activity.documents` | Sí | `number` | Sin restricción adicional declarada | Documentos que publicó en expedientes. | `1` |
| `createdAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Perfil profesional no encontrado | Excepción explícita en src/modules/profiles/services/profiles-practitioners.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La cuenta no tiene una persona vinculada | Excepción explícita en src/modules/profiles/services/profiles-practitioners.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/profiles/practitioners/me"
}
```

---

## 24. GET /profiles/practitioners/me/affiliations

- **Módulo:** `profiles`
- **Etiqueta OpenAPI:** `profiles-practitioners`
- **Nombre:** Historial laboral propio (instituciones donde trabajó)
- **Operation ID:** `ProfilesPractitionersController_listOwnAffiliations`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ProfilesPractitionersController.listOwnAffiliations](../../src/modules/profiles/controllers/profiles-practitioners.controller.ts)

### Descripción de negocio

Historial laboral propio (instituciones donde trabajó). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-05-16·L: el historial laboral propio. Va antes que las rutas con `:profileId` a propósito: `me` no es un uuid y `ParseUUIDPipe` lo rechazaría, pero el orden de declaración es lo que garantiza que ni siquiera llegue a intentarlo.

### Descripción del sistema

NestJS resuelve `GET /profiles/practitioners/me/affiliations` en `ProfilesPractitionersController_listOwnAffiliations`. El controlador delega en `ProfilesPractitionersService.listOwnAffiliations`. No recibe body. El tipo de retorno estático es `Promise<ListAffiliationsResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /profiles/practitioners/me/affiliations HTTP/1.1
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
GET /profiles/practitioners/me/affiliations HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ListAffiliationsResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<ListAffiliationsResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<ListAffiliationsResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<ListAffiliationsResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<ListAffiliationsResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<ListAffiliationsResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ListAffiliationsResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
      "organizationName": "Nombre de ejemplo",
      "roleTitle": "valor-ejemplo",
      "departmentText": "valor-ejemplo",
      "practiceSiteId": "00000000-0000-4000-8000-000000000001",
      "affiliationTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "startDate": "2026-07-31",
      "endDate": "2026-07-31",
      "current": true,
      "status": "00000000-0000-4000-8000-000000000001",
      "statusKind": {},
      "decisionReasonText": "Texto descriptivo de ejemplo",
      "createdAt": "2026-07-31T12:00:00.000Z"
    }
  ],
  "count": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<AffiliationResponseDto>` | Sin restricción adicional declarada | Las afiliaciones, de la más reciente a la más antigua. | `[{"id":"00000000-0000-4000-8000-000000000001","practitionerProfileId":"00000000-0000-4000-8000-000000000001","organizationName":"Nombre de ejemplo","roleTitle":"valor-ejemplo","departmentText":"valor-ejemplo","practiceSiteId":"00000000-0000-4000-8000-000000000001","affiliationTypeConceptId":"00000000-0000-4000-8000-000000000001","startDate":"2026-07-31","endDate":"2026-07-31","current":true,"status":"00000000-0000-4000-8000-000000000001","statusKind":{},"decisionReasonText":"Texto descriptivo de ejemplo","createdAt":"2026-07-31T12:00:00.000Z"}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `items[].practitionerProfileId` | Sí | `string` | formato `uuid` | Identificador asociado a practitioner profile. | `00000000-0000-4000-8000-000000000001` |
| `items[].organizationName` | Sí | `string` | Sin restricción adicional declarada | Institución. | `Nombre de ejemplo` |
| `items[].roleTitle` | Sí | `string` | Sin restricción adicional declarada | Cargo. | `valor-ejemplo` |
| `items[].departmentText` | No | `string` | admite null | Servicio o departamento. | `valor-ejemplo` |
| `items[].practiceSiteId` | No | `string` | formato `uuid`; admite null | Sede de la plataforma, si la institución está dentro. | `00000000-0000-4000-8000-000000000001` |
| `items[].affiliationTypeConceptId` | No | `string` | formato `uuid`; admite null | Tipo de vínculo. | `00000000-0000-4000-8000-000000000001` |
| `items[].startDate` | Sí | `string` | formato `date` | Inicio del vínculo. | `2026-07-31` |
| `items[].endDate` | No | `string` | formato `date`; admite null | Fin del vínculo, o `null` si sigue vigente. | `2026-07-31` |
| `items[].current` | Sí | `boolean` | Sin restricción adicional declarada | Derivado de `endDate`: sin fin declarado, sigue vigente | `true` |
| `items[].status` | Sí | `string` | formato `uuid` | Estado del registro (concept id). | `00000000-0000-4000-8000-000000000001` |
| `items[].statusKind` | Sí | `object` | valores: `pendiente`, `declarado`, `aprobado`, `rechazado`, `revocado`, `desconocido` | El mismo estado, en algo sobre lo que una pantalla pueda ramificar. El concept id sigue viajando en `status` y es la verdad; esto es una derivación de conveniencia. Existe porque la alternativa era que el frontend comparara uuids escritos a mano, que es exactamente lo que el proyecto prohíbe: los conceptos se resuelven en el servidor. `desconocido` cuando el estado no es ninguno de los tres esperados. Es preferible a suponer: cuando exista el value set de estados —donde entra `declarado`— las pantallas que ya distinguen los casos conocidos no van a mentir sobre el nuevo, van a decir que no lo reconocen. | `{}` |
| `items[].decisionReasonText` | No | `string` | admite null | Por qué la organización rechazó o dio de baja el vínculo. **Lo lee el profesional**, no es una nota interna. Un rechazo sin motivo es mudo para quien lo recibe, y quien lo escribe tiene que saber que se lee. `null` en cualquier otro estado. | `Texto descriptivo de ejemplo` |
| `items[].createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Cantidad devuelta. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Esta cuenta no tiene un perfil profesional asociado | Excepción explícita en src/modules/profiles/services/profile-ownership.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/profiles/practitioners/me/affiliations"
}
```

---

## 25. POST /profiles/practitioners/me/affiliations

- **Módulo:** `profiles`
- **Etiqueta OpenAPI:** `profiles-practitioners`
- **Nombre:** Registrar una afiliación institucional en el historial propio
- **Operation ID:** `ProfilesPractitionersController_addOwnAffiliation`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ProfilesPractitionersController.addOwnAffiliation](../../src/modules/profiles/controllers/profiles-practitioners.controller.ts)

### Descripción de negocio

El sujeto sale de la sesión: no hay forma de escribir el historial de otro.


### Descripción del sistema

NestJS resuelve `POST /profiles/practitioners/me/affiliations` en `ProfilesPractitionersController_addOwnAffiliation`. El controlador delega en `ProfilesPractitionersService.addOwnAffiliation`. Valida el body como `CreateAffiliationDto` y consume `application/json`. El tipo de retorno estático es `Promise<AffiliationResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateAffiliationDto`; los campos opcionales se omiten.

```http
POST /profiles/practitioners/me/affiliations HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "primaryTenantId": "00000000-0000-4000-8000-000000000001",
  "participatingTenantId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `primaryTenantId` | Sí | `string` | formato `uuid` | Tenant primario (organizador) | `00000000-0000-4000-8000-000000000001` |
| `participatingTenantId` | Sí | `string` | formato `uuid` | Tenant participante | `00000000-0000-4000-8000-000000000001` |
| `affiliationTypeConceptId` | No | `string` | formato `uuid` | Tipo de afiliación (concepto) | `00000000-0000-4000-8000-000000000001` |
| `hostPracticeSiteId` | No | `string` | formato `uuid` | Sitio de práctica anfitrión | `00000000-0000-4000-8000-000000000001` |
| `healthcareServiceId` | No | `string` | formato `uuid` | Servicio de salud implicado | `00000000-0000-4000-8000-000000000001` |
| `contractReference` | No | `string` | longitud máxima 200 | Referencia de contrato | `valor-ejemplo` |
| `dataUseAgreementId` | No | `string` | formato `uuid` | Acuerdo de uso de datos (DUA) firmado | `00000000-0000-4000-8000-000000000001` |
| `validFrom` | No | `string` | Sin restricción adicional declarada | Vigente desde (ISO date-time) | `valor-ejemplo` |
| `validTo` | No | `string` | Sin restricción adicional declarada | Vigente hasta (ISO date-time) | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /profiles/practitioners/me/affiliations HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "primaryTenantId": "00000000-0000-4000-8000-000000000001",
  "participatingTenantId": "00000000-0000-4000-8000-000000000001",
  "affiliationTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "hostPracticeSiteId": "00000000-0000-4000-8000-000000000001",
  "healthcareServiceId": "00000000-0000-4000-8000-000000000001",
  "contractReference": "valor-ejemplo",
  "dataUseAgreementId": "00000000-0000-4000-8000-000000000001",
  "validFrom": "valor-ejemplo",
  "validTo": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<AffiliationResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<AffiliationResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AffiliationResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AffiliationResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AffiliationResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<AffiliationResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AffiliationResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AffiliationResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AffiliationResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AffiliationResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
  "organizationName": "Nombre de ejemplo",
  "roleTitle": "valor-ejemplo",
  "departmentText": "valor-ejemplo",
  "practiceSiteId": "00000000-0000-4000-8000-000000000001",
  "affiliationTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "startDate": "2026-07-31",
  "endDate": "2026-07-31",
  "current": true,
  "status": "00000000-0000-4000-8000-000000000001",
  "statusKind": {},
  "decisionReasonText": "Texto descriptivo de ejemplo",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `practitionerProfileId` | Sí | `string` | formato `uuid` | Identificador asociado a practitioner profile. | `00000000-0000-4000-8000-000000000001` |
| `organizationName` | Sí | `string` | Sin restricción adicional declarada | Institución. | `Nombre de ejemplo` |
| `roleTitle` | Sí | `string` | Sin restricción adicional declarada | Cargo. | `valor-ejemplo` |
| `departmentText` | No | `string` | admite null | Servicio o departamento. | `valor-ejemplo` |
| `practiceSiteId` | No | `string` | formato `uuid`; admite null | Sede de la plataforma, si la institución está dentro. | `00000000-0000-4000-8000-000000000001` |
| `affiliationTypeConceptId` | No | `string` | formato `uuid`; admite null | Tipo de vínculo. | `00000000-0000-4000-8000-000000000001` |
| `startDate` | Sí | `string` | formato `date` | Inicio del vínculo. | `2026-07-31` |
| `endDate` | No | `string` | formato `date`; admite null | Fin del vínculo, o `null` si sigue vigente. | `2026-07-31` |
| `current` | Sí | `boolean` | Sin restricción adicional declarada | Derivado de `endDate`: sin fin declarado, sigue vigente | `true` |
| `status` | Sí | `string` | formato `uuid` | Estado del registro (concept id). | `00000000-0000-4000-8000-000000000001` |
| `statusKind` | Sí | `object` | valores: `pendiente`, `declarado`, `aprobado`, `rechazado`, `revocado`, `desconocido` | El mismo estado, en algo sobre lo que una pantalla pueda ramificar. El concept id sigue viajando en `status` y es la verdad; esto es una derivación de conveniencia. Existe porque la alternativa era que el frontend comparara uuids escritos a mano, que es exactamente lo que el proyecto prohíbe: los conceptos se resuelven en el servidor. `desconocido` cuando el estado no es ninguno de los tres esperados. Es preferible a suponer: cuando exista el value set de estados —donde entra `declarado`— las pantallas que ya distinguen los casos conocidos no van a mentir sobre el nuevo, van a decir que no lo reconocen. | `{}` |
| `decisionReasonText` | No | `string` | admite null | Por qué la organización rechazó o dio de baja el vínculo. **Lo lee el profesional**, no es una nota interna. Un rechazo sin motivo es mudo para quien lo recibe, y quien lo escribe tiene que saber que se lee. `null` en cualquier otro estado. | `Texto descriptivo de ejemplo` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Esta cuenta no tiene un perfil profesional asociado | Excepción explícita en src/modules/profiles/services/profile-ownership.service.ts |
| 404 | `NOT_FOUND` | La sede indicada no existe | Excepción explícita en src/modules/profiles/services/profiles-affiliations.service.ts |
| 409 | `CONFLICT` | Ese vínculo ya está en el historial laboral | Excepción explícita en src/modules/profiles/services/profiles-practitioners.service.ts |
| 409 | `CONFLICT` | Ya pediste vincularte a esa sede | Excepción explícita en src/modules/profiles/services/profiles-practitioners.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El fin del vínculo no puede ser anterior a su inicio | Excepción explícita en src/modules/profiles/services/profiles-practitioners.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/profiles/practitioners/me/affiliations"
}
```

---

## 26. GET /profiles/practitioners/me/linkable-organizations

- **Módulo:** `profiles`
- **Etiqueta OpenAPI:** `profiles-practitioners`
- **Nombre:** Buscar instituciones del padrón para declarar una afiliación
- **Operation ID:** `ProfilesPractitionersController_searchLinkableOrganizations`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ProfilesPractitionersController.searchLinkableOrganizations](../../src/modules/profiles/controllers/profiles-practitioners.controller.ts)

### Descripción de negocio

El padrón cubre sólo Santa Cruz: fuera de ahí, el alta admite el nombre escrito a mano.

Contexto declarado en el controlador: El buscador de instituciones para declarar dónde se trabaja. ## Por qué vive en el perfil y no en un módulo propio Es el paso previo de `POST practitioners/me/affiliations`, y el profesional declara dónde trabaja desde su perfil, no entrando por cada organización. Dejarlo acá mantiene el circuito entero en una sola superficie. ## Sin `@Roles`, igual que el resto del historial laboral Devuelve el padrón oficial de establecimientos: un catálogo público, sin `tenant_id` y sin PHI. Exigir un rol lo cerraría para el profesional que todavía no lo tiene, que es justo quien está completando su perfil.

### Descripción del sistema

NestJS resuelve `GET /profiles/practitioners/me/linkable-organizations` en `ProfilesPractitionersController_searchLinkableOrganizations`. El controlador delega en `LinkableOrganizationsService.buscar`. No recibe body. El tipo de retorno estático es `Promise<ListLinkableOrganizationsResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `q` | query | No | `string` | Sin restricción adicional declarada | Texto del nombre | `valor-ejemplo` |
| `municipality` | query | No | `string` | Sin restricción adicional declarada | Municipio exacto; distingue establecimientos homónimos | `valor-ejemplo` |
| `limit` | query | No | `number` | Sin restricción adicional declarada | Tope de resultados (por defecto 20) | `1` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /profiles/practitioners/me/linkable-organizations HTTP/1.1
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
GET /profiles/practitioners/me/linkable-organizations?q=valor-ejemplo&municipality=valor-ejemplo&limit=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ListLinkableOrganizationsResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<ListLinkableOrganizationsResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<ListLinkableOrganizationsResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<ListLinkableOrganizationsResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<ListLinkableOrganizationsResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<ListLinkableOrganizationsResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ListLinkableOrganizationsResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "facilityConceptId": "00000000-0000-4000-8000-000000000001",
      "code": "BO_EST_CLINICA_FOIANINI",
      "name": "CLINICA FOIANINI",
      "municipality": "valor-ejemplo",
      "type": "valor-ejemplo",
      "address": "valor-ejemplo"
    }
  ],
  "count": 1,
  "limit": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<LinkableOrganizationDto>` | Sin restricción adicional declarada | Los establecimientos que coinciden. | `[{"facilityConceptId":"00000000-0000-4000-8000-000000000001","code":"BO_EST_CLINICA_FOIANINI","name":"CLINICA FOIANINI","municipality":"valor-ejemplo","type":"valor-ejemplo","address":"valor-ejemplo"}]` |
| `items[].facilityConceptId` | Sí | `string` | formato `uuid` | El concepto del establecimiento en el catálogo. Es lo que se guardará como vínculo estructurado cuando `practitioner_affiliations` tenga columna donde anotarlo. Hasta entonces viaja igual: el cliente lo necesita para distinguir dos homónimos, y el contrato no cambia cuando la columna exista. | `00000000-0000-4000-8000-000000000001` |
| `items[].code` | Sí | `string` | Sin restricción adicional declarada | Código estable del establecimiento en el padrón. | `BO_EST_CLINICA_FOIANINI` |
| `items[].name` | Sí | `string` | Sin restricción adicional declarada | El nombre canónico, el del padrón. Es el valor que conviene guardar en `organization_name`: mientras cada médico escriba el nombre a mano, «CLINICA FOIANINI», «Clínica Ángel Foianini» y «Centro Médico Foianini» son tres instituciones distintas para el sistema, y son una sola en la realidad. | `CLINICA FOIANINI` |
| `items[].municipality` | No | `string` | admite null | Municipio donde está; lo que separa a los homónimos. | `valor-ejemplo` |
| `items[].type` | No | `string` | admite null | `CLINICA_PRIVADA`, `HOSPITAL`, `CAJA_SALUD`, `CENTRO_SALUD`, … | `valor-ejemplo` |
| `items[].address` | No | `string` | admite null | Dirección declarada en el padrón, cuando la trae. | `valor-ejemplo` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Cantidad devuelta | `1` |
| `limit` | Sí | `number` | Sin restricción adicional declarada | Tope de resultados aplicado | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/profiles/practitioners/me/linkable-organizations"
}
```

---

## 27. GET /profiles/practitioners/me/onboarding

- **Módulo:** `profiles`
- **Etiqueta OpenAPI:** `profiles-practitioners`
- **Nombre:** Qué le falta al profesional para completar su alta
- **Operation ID:** `ProfilesPractitionersController_getOwnOnboarding`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ProfilesPractitionersController.getOwnOnboarding](../../src/modules/profiles/controllers/profiles-practitioners.controller.ts)

### Descripción de negocio

El paso se DERIVA de los datos que ya existen (matrícula, especialidad, foto, afiliación o agenda propia): no hay columna de progreso, así que retomar sale gratis y los perfiles anteriores aparecen completos sin migrar.

Contexto declarado en el controlador: En qué punto del alta está el profesional de la sesión. Va **antes** de cualquier `practitioners/:profileId` por lo mismo que `me/summary`: Nest resuelve por orden de declaración y un parámetro capturaría `me`. Sin `@Roles`: el filtro real es tener perfil profesional, que es un dato de la cuenta y no un rol. Si no lo tiene, el servicio lo dice con un 422.

### Descripción del sistema

NestJS resuelve `GET /profiles/practitioners/me/onboarding` en `ProfilesPractitionersController_getOwnOnboarding`. El controlador delega en `ProfilesPractitionersService.getOwnOnboarding`. No recibe body. El tipo de retorno estático es `Promise<PractitionerOnboardingDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /profiles/practitioners/me/onboarding HTTP/1.1
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
GET /profiles/practitioners/me/onboarding HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PractitionerOnboardingDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<PractitionerOnboardingDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<PractitionerOnboardingDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<PractitionerOnboardingDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<PractitionerOnboardingDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<PractitionerOnboardingDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PractitionerOnboardingDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
  "steps": [
    {
      "key": {},
      "complete": true,
      "missing": [
        "valor-ejemplo"
      ]
    }
  ],
  "firstIncomplete": {}
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `practitionerProfileId` | Sí | `string` | formato `uuid` | El perfil consultado. | `00000000-0000-4000-8000-000000000001` |
| `steps` | Sí | `array<OnboardingStepDto>` | Sin restricción adicional declarada | Las cinco etapas, siempre las cinco y en orden. | `[{"key":{},"complete":true,"missing":["valor-ejemplo"]}]` |
| `steps[].key` | Sí | `object` | Sin restricción adicional declarada | Qué etapa es. | `{}` |
| `steps[].complete` | Sí | `boolean` | Sin restricción adicional declarada | Está cumplida con los datos que el profesional ya cargó. | `true` |
| `steps[].missing` | Sí | `array<string>` | Sin restricción adicional declarada | Qué falta, en claves estables que la pantalla traduce. Van en clave y no en prosa porque el texto es del front: acá se dice qué falta, no cómo se le pide a la persona. | `["valor-ejemplo"]` |
| `firstIncomplete` | Sí | `object` | valores: `done` | La primera etapa incompleta, o `done` si no queda ninguna. Es lo único que la pantalla necesita para decidir dónde aterrizar. | `{}` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 422 | `PRECONDITION_FAILED` | La cuenta no tiene una persona vinculada | Excepción explícita en src/modules/profiles/services/profiles-practitioners.service.ts |
| 422 | `PRECONDITION_FAILED` | La cuenta no tiene perfil profesional | Excepción explícita en src/modules/profiles/services/profiles-practitioners.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/profiles/practitioners/me/onboarding"
}
```

---

## 28. GET /profiles/practitioners/me/summary

- **Módulo:** `profiles`
- **Etiqueta OpenAPI:** `profiles-practitioners`
- **Nombre:** Consultar el perfil profesional propio (trayectoria y actividad)
- **Operation ID:** `ProfilesPractitionersController_getOwnPractitionerProfile`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ProfilesPractitionersController.getOwnPractitionerProfile](../../src/modules/profiles/controllers/profiles-practitioners.controller.ts)

### Descripción de negocio

Consultar el perfil profesional propio (trayectoria y actividad). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: El perfil profesional propio. **Sin `@Roles`, y no es un olvido.** Cualquier sesión autenticada puede pedirlo, porque lo único que puede pedir es *el suyo*: el sujeto lo resuelve el servidor desde el vínculo persona-cuenta y no hay parámetro que apunte a otro. Exigir `SECURITY_ADMIN` acá dejaría a los profesionales sin poder ver su propio perfil, que es exactamente para quienes existe. Tampoco lleva `@RequiresVerifiedIdentity`, a diferencia del resumen del paciente: la verificación de identidad de un profesional es la de su matrícula y **vive en este mismo perfil**. Exigirla para leerlo dejaría a quien todavía no la completó sin la pantalla donde se entera de qué le falta. Va declarado antes que cualquier `practitioners/:profileId`: Nest resuelve las rutas por orden de declaración y un parámetro capturaría `me`.

### Descripción del sistema

NestJS resuelve `GET /profiles/practitioners/me/summary` en `ProfilesPractitionersController_getOwnPractitionerProfile`. El controlador delega en `ProfilesPractitionersService.getOwnPractitionerProfile`. No recibe body. El tipo de retorno estático es `Promise<PractitionerProfileSummaryDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /profiles/practitioners/me/summary HTTP/1.1
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
GET /profiles/practitioners/me/summary HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PractitionerProfileSummaryDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<PractitionerProfileSummaryDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<PractitionerProfileSummaryDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<PractitionerProfileSummaryDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<PractitionerProfileSummaryDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<PractitionerProfileSummaryDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PractitionerProfileSummaryDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "profileId": "00000000-0000-4000-8000-000000000001",
  "personId": "00000000-0000-4000-8000-000000000001",
  "practitionerCode": "CODIGO_EJEMPLO",
  "displayName": "Nombre de ejemplo",
  "professionalTitle": "valor-ejemplo",
  "professionalBio": "valor-ejemplo",
  "photoFileId": "00000000-0000-4000-8000-000000000001",
  "email": "usuario@example.com",
  "phone": "+59170000000",
  "practitionerCategoryConceptId": "00000000-0000-4000-8000-000000000001",
  "verificationStatusConceptId": "00000000-0000-4000-8000-000000000001",
  "practiceStatusConceptId": "00000000-0000-4000-8000-000000000001",
  "acceptsNewPatients": true,
  "telehealthAvailable": true,
  "specialties": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "specialtyConceptId": "00000000-0000-4000-8000-000000000001",
      "isPrimary": true,
      "boardCertified": true,
      "practiceScopeText": "valor-ejemplo",
      "verificationStatusConceptId": "00000000-0000-4000-8000-000000000001",
      "validFrom": "2026-07-31T12:00:00.000Z",
      "validTo": "2026-07-31T12:00:00.000Z"
    }
  ],
  "credentials": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "credentialTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "number": "valor-ejemplo",
      "issuingInstitutionText": "valor-ejemplo",
      "issueDate": "2026-07-31T12:00:00.000Z",
      "expiryDate": "2026-07-31T12:00:00.000Z",
      "stateConceptId": "00000000-0000-4000-8000-000000000001",
      "verifiedAt": "2026-07-31T12:00:00.000Z",
      "verificationSourceUri": "valor-ejemplo"
    }
  ],
  "licenses": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "jurisdictionConceptId": "00000000-0000-4000-8000-000000000001",
      "licenseNumber": "valor-ejemplo",
      "regulatoryAuthority": "valor-ejemplo",
      "stateConceptId": "00000000-0000-4000-8000-000000000001",
      "validFrom": "2026-07-31T12:00:00.000Z",
      "validTo": "2026-07-31T12:00:00.000Z"
    }
  ],
  "languages": [
    {
      "languageConceptId": "00000000-0000-4000-8000-000000000001",
      "proficiencyConceptId": "00000000-0000-4000-8000-000000000001",
      "clinicalInterpretationAllowed": true
    }
  ],
  "affiliations": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
      "organizationName": "Nombre de ejemplo",
      "roleTitle": "valor-ejemplo",
      "departmentText": "valor-ejemplo",
      "practiceSiteId": "00000000-0000-4000-8000-000000000001",
      "affiliationTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "startDate": "2026-07-31",
      "endDate": "2026-07-31",
      "current": true,
      "status": "00000000-0000-4000-8000-000000000001",
      "statusKind": {},
      "decisionReasonText": "Texto descriptivo de ejemplo",
      "createdAt": "2026-07-31T12:00:00.000Z"
    }
  ],
  "activity": {
    "encounters": 1,
    "medicationRequests": 1,
    "clinicalNotes": 1,
    "documents": 1
  },
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `profileId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `personId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `practitionerCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `displayName` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `professionalTitle` | No | `string` | Sin restricción adicional declarada | «Médica cardióloga», «Kinesiólogo». Texto libre del propio profesional. | `valor-ejemplo` |
| `professionalBio` | No | `string` | Sin restricción adicional declarada | Presentación en prosa. Es lo que hace que un perfil se lea como una persona. | `valor-ejemplo` |
| `photoFileId` | No | `string` | formato `uuid` | Foto de perfil, si cargó una. Se resuelve por el módulo de archivos. | `00000000-0000-4000-8000-000000000001` |
| `email` | No | `string` | Sin restricción adicional declarada | Sólo en la lectura propia | `usuario@example.com` |
| `phone` | No | `string` | Sin restricción adicional declarada | Sólo en la lectura propia | `+59170000000` |
| `practitionerCategoryConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `verificationStatusConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `practiceStatusConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `acceptsNewPatients` | Sí | `boolean` | Sin restricción adicional declarada | Si toma pacientes nuevos. Cambia qué se le puede ofrecer a quien busca. | `true` |
| `telehealthAvailable` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `specialties` | Sí | `array<PractitionerSpecialtyDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","specialtyConceptId":"00000000-0000-4000-8000-000000000001","isPrimary":true,"boardCertified":true,"practiceScopeText":"valor-ejemplo","verificationStatusConceptId":"00000000-0000-4000-8000-000000000001","validFrom":"2026-07-31T12:00:00.000Z","validTo":"2026-07-31T12:00:00.000Z"}]` |
| `specialties[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `specialties[].specialtyConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `specialties[].isPrimary` | Sí | `boolean` | Sin restricción adicional declarada | Si es la especialidad con la que se presenta. Hay una sola vigente. | `true` |
| `specialties[].boardCertified` | Sí | `boolean` | Sin restricción adicional declarada | Certificación del colegio o consejo. Es un dato que la gente busca. | `true` |
| `specialties[].practiceScopeText` | No | `string` | Sin restricción adicional declarada | Alcance de práctica en palabras del propio profesional. | `valor-ejemplo` |
| `specialties[].verificationStatusConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `specialties[].validFrom` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `specialties[].validTo` | No | `string` | formato `date-time` | Presente sólo si dejó de ejercerla. | `2026-07-31T12:00:00.000Z` |
| `credentials` | Sí | `array<PractitionerCredentialDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","credentialTypeConceptId":"00000000-0000-4000-8000-000000000001","number":"valor-ejemplo","issuingInstitutionText":"valor-ejemplo","issueDate":"2026-07-31T12:00:00.000Z","expiryDate":"2026-07-31T12:00:00.000Z","stateConceptId":"00000000-0000-4000-8000-000000000001","verifiedAt":"2026-07-31T12:00:00.000Z","verificationSourceUri":"valor-ejemplo"}]` |
| `credentials[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `credentials[].credentialTypeConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `credentials[].number` | Sí | `string` | Sin restricción adicional declarada | Nº de título o certificado. | `valor-ejemplo` |
| `credentials[].issuingInstitutionText` | No | `string` | Sin restricción adicional declarada | Dónde se cursó, en texto libre: la institución no siempre es un tenant. | `valor-ejemplo` |
| `credentials[].issueDate` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `credentials[].expiryDate` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `credentials[].stateConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `credentials[].verifiedAt` | No | `string` | formato `date-time` | Cuándo se comprobó la credencial contra su fuente. Ausente significa «no verificada todavía», que no es lo mismo que «rechazada» —eso lo dice `stateConceptId`—. | `2026-07-31T12:00:00.000Z` |
| `credentials[].verificationSourceUri` | No | `string` | Sin restricción adicional declarada | Contra qué se comprobó la credencial (registro del colegio médico, portal de matrículas, etc). Ausente antes de verificar: es evidencia de la verificación, no del dato declarado. | `valor-ejemplo` |
| `licenses` | Sí | `array<PractitionerLicenseDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","jurisdictionConceptId":"00000000-0000-4000-8000-000000000001","licenseNumber":"valor-ejemplo","regulatoryAuthority":"valor-ejemplo","stateConceptId":"00000000-0000-4000-8000-000000000001","validFrom":"2026-07-31T12:00:00.000Z","validTo":"2026-07-31T12:00:00.000Z"}]` |
| `licenses[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `licenses[].jurisdictionConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `licenses[].licenseNumber` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `licenses[].regulatoryAuthority` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `licenses[].stateConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `licenses[].validFrom` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `licenses[].validTo` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `languages` | Sí | `array<PractitionerLanguageDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"languageConceptId":"00000000-0000-4000-8000-000000000001","proficiencyConceptId":"00000000-0000-4000-8000-000000000001","clinicalInterpretationAllowed":true}]` |
| `languages[].languageConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `languages[].proficiencyConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `languages[].clinicalInterpretationAllowed` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `affiliations` | Sí | `array<AffiliationResponseDto>` | Sin restricción adicional declarada | Historial laboral (UC-05-16): trayectoria, no PHI. Se devuelve un único array de la más reciente a la más antigua, con `current` ya derivado en cada fila — pantalla la agrupa en fases (formación/histórico/actual), la lectura no necesita decidir eso. | `[{"id":"00000000-0000-4000-8000-000000000001","practitionerProfileId":"00000000-0000-4000-8000-000000000001","organizationName":"Nombre de ejemplo","roleTitle":"valor-ejemplo","departmentText":"valor-ejemplo","practiceSiteId":"00000000-0000-4000-8000-000000000001","affiliationTypeConceptId":"00000000-0000-4000-8000-000000000001","startDate":"2026-07-31","endDate":"2026-07-31","current":true,"status":"00000000-0000-4000-8000-000000000001","statusKind":{},"decisionReasonText":"Texto descriptivo de ejemplo","createdAt":"2026-07-31T12:00:00.000Z"}]` |
| `affiliations[].id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `affiliations[].practitionerProfileId` | Sí | `string` | formato `uuid` | Identificador asociado a practitioner profile. | `00000000-0000-4000-8000-000000000001` |
| `affiliations[].organizationName` | Sí | `string` | Sin restricción adicional declarada | Institución. | `Nombre de ejemplo` |
| `affiliations[].roleTitle` | Sí | `string` | Sin restricción adicional declarada | Cargo. | `valor-ejemplo` |
| `affiliations[].departmentText` | No | `string` | admite null | Servicio o departamento. | `valor-ejemplo` |
| `affiliations[].practiceSiteId` | No | `string` | formato `uuid`; admite null | Sede de la plataforma, si la institución está dentro. | `00000000-0000-4000-8000-000000000001` |
| `affiliations[].affiliationTypeConceptId` | No | `string` | formato `uuid`; admite null | Tipo de vínculo. | `00000000-0000-4000-8000-000000000001` |
| `affiliations[].startDate` | Sí | `string` | formato `date` | Inicio del vínculo. | `2026-07-31` |
| `affiliations[].endDate` | No | `string` | formato `date`; admite null | Fin del vínculo, o `null` si sigue vigente. | `2026-07-31` |
| `affiliations[].current` | Sí | `boolean` | Sin restricción adicional declarada | Derivado de `endDate`: sin fin declarado, sigue vigente | `true` |
| `affiliations[].status` | Sí | `string` | formato `uuid` | Estado del registro (concept id). | `00000000-0000-4000-8000-000000000001` |
| `affiliations[].statusKind` | Sí | `object` | valores: `pendiente`, `declarado`, `aprobado`, `rechazado`, `revocado`, `desconocido` | El mismo estado, en algo sobre lo que una pantalla pueda ramificar. El concept id sigue viajando en `status` y es la verdad; esto es una derivación de conveniencia. Existe porque la alternativa era que el frontend comparara uuids escritos a mano, que es exactamente lo que el proyecto prohíbe: los conceptos se resuelven en el servidor. `desconocido` cuando el estado no es ninguno de los tres esperados. Es preferible a suponer: cuando exista el value set de estados —donde entra `declarado`— las pantallas que ya distinguen los casos conocidos no van a mentir sobre el nuevo, van a decir que no lo reconocen. | `{}` |
| `affiliations[].decisionReasonText` | No | `string` | admite null | Por qué la organización rechazó o dio de baja el vínculo. **Lo lee el profesional**, no es una nota interna. Un rechazo sin motivo es mudo para quien lo recibe, y quien lo escribe tiene que saber que se lee. `null` en cualquier otro estado. | `Texto descriptivo de ejemplo` |
| `affiliations[].createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |
| `activity` | Sí | `PractitionerActivityDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"encounters":1,"medicationRequests":1,"clinicalNotes":1,"documents":1}` |
| `activity.encounters` | Sí | `number` | Sin restricción adicional declarada | Encuentros que abrió. | `1` |
| `activity.medicationRequests` | Sí | `number` | Sin restricción adicional declarada | Recetas que prescribió. | `1` |
| `activity.clinicalNotes` | Sí | `number` | Sin restricción adicional declarada | Notas clínicas que redactó. | `1` |
| `activity.documents` | Sí | `number` | Sin restricción adicional declarada | Documentos que publicó en expedientes. | `1` |
| `createdAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Perfil profesional no encontrado | Excepción explícita en src/modules/profiles/services/profiles-practitioners.service.ts |
| 422 | `PRECONDITION_FAILED` | La cuenta no tiene una persona vinculada | Excepción explícita en src/modules/profiles/services/profiles-practitioners.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/profiles/practitioners/me/summary"
}
```

---

## 29. GET /tenants/{tenantId}/practitioner-requests

- **Módulo:** `profiles`
- **Etiqueta OpenAPI:** `profiles-affiliations`
- **Nombre:** Solicitudes de médicos que piden atender en la organización
- **Operation ID:** `TenantPractitionerRequestsController_list`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TenantPractitionerRequestsController.list](../../src/modules/profiles/controllers/tenant-practitioner-requests.controller.ts)

### Descripción de negocio

Sólo las de las sedes de esta organización y sólo para quien la administra. El filtro por organización va en la consulta.

Contexto declarado en el controlador: Las solicitudes pendientes de las sedes de la organización.

### Descripción del sistema

NestJS resuelve `GET /tenants/{tenantId}/practitioner-requests` en `TenantPractitionerRequestsController_list`. El controlador delega en `ProfilesAffiliationsService.listarSolicitudes`. No recibe body. El tipo de retorno estático es `Promise<AffiliationRequestListDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `tenantId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /tenants/00000000-0000-4000-8000-000000000001/practitioner-requests HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `tenantId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /tenants/00000000-0000-4000-8000-000000000001/practitioner-requests HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<AffiliationRequestListDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<AffiliationRequestListDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<AffiliationRequestListDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<AffiliationRequestListDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<AffiliationRequestListDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<AffiliationRequestListDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<AffiliationRequestListDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AffiliationRequestListDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
      "practitionerName": "Nombre de ejemplo",
      "practitionerLicense": "valor-ejemplo",
      "organizationName": "Nombre de ejemplo",
      "roleTitle": "valor-ejemplo",
      "practiceSiteId": "00000000-0000-4000-8000-000000000001",
      "startDate": "2026-07-31T12:00:00.000Z",
      "statusConceptId": "00000000-0000-4000-8000-000000000001",
      "createdAt": "2026-07-31T12:00:00.000Z"
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<AffiliationRequestDto>` | Sin restricción adicional declarada | Las solicitudes pendientes, de la más reciente a la más antigua. | `[{"id":"00000000-0000-4000-8000-000000000001","practitionerProfileId":"00000000-0000-4000-8000-000000000001","practitionerName":"Nombre de ejemplo","practitionerLicense":"valor-ejemplo","organizationName":"Nombre de ejemplo","roleTitle":"valor-ejemplo","practiceSiteId":"00000000-0000-4000-8000-000000000001","startDate":"2026-07-31T12:00:00.000Z","statusConceptId":"00000000-0000-4000-8000-000000000001","createdAt":"2026-07-31T12:00:00.000Z"}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Identificador de la solicitud, con el que se aprueba o rechaza. | `00000000-0000-4000-8000-000000000001` |
| `items[].practitionerProfileId` | Sí | `string` | formato `uuid` | Profesional que pide el vínculo. | `00000000-0000-4000-8000-000000000001` |
| `items[].practitionerName` | Sí | `string` | admite null | Cómo se llama quien pide, para poder decidir. Sin esto la bandeja mostraba cargo, institución y fecha, y ningún nombre: quien administra la organización tenía que aprobar o rechazar a un identificador. Nadie acepta a alguien que no sabe quién es —y si acepta igual, es peor—, así que el pedido viaja identificado. `null` si el profesional no tiene nombre cargado, que la pantalla debe contar como dato faltante y no como una persona anónima. | `Nombre de ejemplo` |
| `items[].practitionerLicense` | Sí | `string` | admite null | Matrícula del Ministerio, que es lo que lo habilita a ejercer. Es el dato con el que una organización verifica de verdad a quien le pide entrar: el nombre dice quién dice ser, la matrícula dice si puede. | `valor-ejemplo` |
| `items[].organizationName` | Sí | `string` | Sin restricción adicional declarada | Institución tal como la declaró el profesional. | `Nombre de ejemplo` |
| `items[].roleTitle` | Sí | `string` | Sin restricción adicional declarada | Cargo declarado. | `valor-ejemplo` |
| `items[].practiceSiteId` | Sí | `string` | formato `uuid`; admite null | Sede de la organización a la que apunta el pedido. | `00000000-0000-4000-8000-000000000001` |
| `items[].startDate` | Sí | `string` | formato `date-time` | Desde cuándo dice que el vínculo empieza. | `2026-07-31T12:00:00.000Z` |
| `items[].statusConceptId` | Sí | `string` | formato `uuid` | Estado del vínculo. | `00000000-0000-4000-8000-000000000001` |
| `items[].createdAt` | Sí | `string` | formato `date-time` | Cuándo se pidió. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma | Excepción explícita en src/modules/directory/services/tenant-administration.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/tenants/{tenantId}/practitioner-requests"
}
```

---

## 30. POST /tenants/{tenantId}/practitioner-requests/{affiliationId}/approve

- **Módulo:** `profiles`
- **Etiqueta OpenAPI:** `profiles-affiliations`
- **Nombre:** Aprobar la solicitud de un profesional
- **Operation ID:** `TenantPractitionerRequestsController_approve`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TenantPractitionerRequestsController.approve](../../src/modules/profiles/controllers/tenant-practitioner-requests.controller.ts)

### Descripción de negocio

Aprobar la solicitud de un profesional. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: La organización acepta el vínculo.

### Descripción del sistema

NestJS resuelve `POST /tenants/{tenantId}/practitioner-requests/{affiliationId}/approve` en `TenantPractitionerRequestsController_approve`. El controlador delega en `ProfilesAffiliationsService.aprobar`. No recibe body. El tipo de retorno estático es `Promise<void>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `tenantId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `affiliationId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /tenants/00000000-0000-4000-8000-000000000001/practitioner-requests/00000000-0000-4000-8000-000000000001/approve HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `tenantId`, `affiliationId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /tenants/00000000-0000-4000-8000-000000000001/practitioner-requests/00000000-0000-4000-8000-000000000001/approve HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 204 | Operación completada sin cuerpo de respuesta. | `Promise<void>` | No |
| 400 | Operación completada correctamente. | `Promise<void>` | No |
| 401 | Operación completada correctamente. | `Promise<void>` | No |
| 403 | Operación completada correctamente. | `Promise<void>` | No |
| 404 | Operación completada correctamente. | `Promise<void>` | No |
| 409 | Operación completada correctamente. | `Promise<void>` | No |
| 422 | Operación completada correctamente. | `Promise<void>` | No |
| 429 | Operación completada correctamente. | `Promise<void>` | No |
| 500 | Operación completada correctamente. | `Promise<void>` | No |

La operación no devuelve body según el tipo TypeScript del controlador.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma | Excepción explícita en src/modules/directory/services/tenant-administration.service.ts |
| 404 | `NOT_FOUND` | Solicitud no encontrada | Excepción explícita en src/modules/profiles/services/profiles-affiliations.service.ts |
| 422 | `PRECONDITION_FAILED` | decision.siNoEsta | Excepción explícita en src/modules/profiles/services/profiles-affiliations.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/tenants/{tenantId}/practitioner-requests/{affiliationId}/approve"
}
```

---

## 31. POST /tenants/{tenantId}/practitioner-requests/{affiliationId}/reject

- **Módulo:** `profiles`
- **Etiqueta OpenAPI:** `profiles-affiliations`
- **Nombre:** Rechazar la solicitud de un profesional
- **Operation ID:** `TenantPractitionerRequestsController_reject`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TenantPractitionerRequestsController.reject](../../src/modules/profiles/controllers/tenant-practitioner-requests.controller.ts)

### Descripción de negocio

Rechazar la solicitud de un profesional. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: La organización rechaza el vínculo, con motivo si quiere darlo.

### Descripción del sistema

NestJS resuelve `POST /tenants/{tenantId}/practitioner-requests/{affiliationId}/reject` en `TenantPractitionerRequestsController_reject`. El controlador delega en `ProfilesAffiliationsService.rechazar`. Valida el body como `RejectAffiliationDto` y consume `application/json`. El tipo de retorno estático es `Promise<void>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `tenantId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `affiliationId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RejectAffiliationDto`; los campos opcionales se omiten.

```http
POST /tenants/00000000-0000-4000-8000-000000000001/practitioner-requests/00000000-0000-4000-8000-000000000001/reject HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `tenantId`, `affiliationId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `reason` | No | `string` | longitud mínima 1; longitud máxima 500 | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /tenants/00000000-0000-4000-8000-000000000001/practitioner-requests/00000000-0000-4000-8000-000000000001/reject HTTP/1.1
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
| 204 | Operación completada sin cuerpo de respuesta. | `Promise<void>` | No |
| 400 | Operación completada correctamente. | `Promise<void>` | No |
| 401 | Operación completada correctamente. | `Promise<void>` | No |
| 403 | Operación completada correctamente. | `Promise<void>` | No |
| 404 | Operación completada correctamente. | `Promise<void>` | No |
| 409 | Operación completada correctamente. | `Promise<void>` | No |
| 413 | Operación completada correctamente. | `Promise<void>` | No |
| 422 | Operación completada correctamente. | `Promise<void>` | No |
| 429 | Operación completada correctamente. | `Promise<void>` | No |
| 500 | Operación completada correctamente. | `Promise<void>` | No |

La operación no devuelve body según el tipo TypeScript del controlador.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma | Excepción explícita en src/modules/directory/services/tenant-administration.service.ts |
| 404 | `NOT_FOUND` | Solicitud no encontrada | Excepción explícita en src/modules/profiles/services/profiles-affiliations.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | decision.siNoEsta | Excepción explícita en src/modules/profiles/services/profiles-affiliations.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/tenants/{tenantId}/practitioner-requests/{affiliationId}/reject"
}
```

---

## 32. POST /tenants/{tenantId}/practitioner-requests/{affiliationId}/revoke

- **Módulo:** `profiles`
- **Etiqueta OpenAPI:** `profiles-affiliations`
- **Nombre:** Dar de baja un vínculo ya aprobado
- **Operation ID:** `TenantPractitionerRequestsController_revoke`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TenantPractitionerRequestsController.revoke](../../src/modules/profiles/controllers/tenant-practitioner-requests.controller.ts)

### Descripción de negocio

Las citas ya confirmadas siguen en pie; lo que se corta es aceptar turnos nuevos y publicar agenda.

Contexto declarado en el controlador: La organización da de baja un vínculo que ya había aprobado. Faltaba: `AFFILIATION_REVOKED` existía desde v4.1.9 y no había forma de llegar a ese estado por la API. Aprobar era irreversible por omisión. **Las citas ya confirmadas no se cancelan.** Dejarlas caer en bloque plantaría a pacientes que tenían un turno prometido, por un trámite del que no fueron parte. Lo que sí ocurre desde ya: no puede aceptar turnos nuevos ni publicar más agenda acá.

### Descripción del sistema

NestJS resuelve `POST /tenants/{tenantId}/practitioner-requests/{affiliationId}/revoke` en `TenantPractitionerRequestsController_revoke`. El controlador delega en `ProfilesAffiliationsService.revocar`. Valida el body como `RejectAffiliationDto` y consume `application/json`. El tipo de retorno estático es `Promise<void>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `tenantId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `affiliationId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RejectAffiliationDto`; los campos opcionales se omiten.

```http
POST /tenants/00000000-0000-4000-8000-000000000001/practitioner-requests/00000000-0000-4000-8000-000000000001/revoke HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `tenantId`, `affiliationId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `reason` | No | `string` | longitud mínima 1; longitud máxima 500 | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /tenants/00000000-0000-4000-8000-000000000001/practitioner-requests/00000000-0000-4000-8000-000000000001/revoke HTTP/1.1
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
| 204 | Operación completada sin cuerpo de respuesta. | `Promise<void>` | No |
| 400 | Operación completada correctamente. | `Promise<void>` | No |
| 401 | Operación completada correctamente. | `Promise<void>` | No |
| 403 | Operación completada correctamente. | `Promise<void>` | No |
| 404 | Operación completada correctamente. | `Promise<void>` | No |
| 409 | Operación completada correctamente. | `Promise<void>` | No |
| 413 | Operación completada correctamente. | `Promise<void>` | No |
| 422 | Operación completada correctamente. | `Promise<void>` | No |
| 429 | Operación completada correctamente. | `Promise<void>` | No |
| 500 | Operación completada correctamente. | `Promise<void>` | No |

La operación no devuelve body según el tipo TypeScript del controlador.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma | Excepción explícita en src/modules/directory/services/tenant-administration.service.ts |
| 404 | `NOT_FOUND` | Solicitud no encontrada | Excepción explícita en src/modules/profiles/services/profiles-affiliations.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | decision.siNoEsta | Excepción explícita en src/modules/profiles/services/profiles-affiliations.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/tenants/{tenantId}/practitioner-requests/{affiliationId}/revoke"
}
```

---

