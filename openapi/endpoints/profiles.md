<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `profiles`

Referencia exhaustiva de 16 operación(es) del módulo `profiles`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `profiles-patients`, `profiles-practitioners`
- **Controladores:** `ProfilesPatientsController`, `ProfilesPractitionersController`
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
8. [GET /profiles/patients/me/summary](#8-get-profiles-patients-me-summary) — Consultar el resumen propio (requiere identidad verificada)
9. [POST /profiles/patients/merge](#9-post-profiles-patients-merge) — Fusionar pacientes duplicados
10. [GET /profiles/patients/merge-events](#10-get-profiles-patients-merge-events) — Listar eventos de fusión de pacientes
11. [POST /profiles/patients/merge/{eventId}/reverse](#11-post-profiles-patients-merge-eventid-reverse) — Revertir una fusión de pacientes
12. [POST /profiles/persons/{personId}/account-links](#12-post-profiles-persons-personid-account-links) — Vincular cuenta de portal a una persona
13. [POST /profiles/persons/{personId}/decease](#13-post-profiles-persons-personid-decease) — Registrar defunción y anonimización de una persona
14. [POST /profiles/practitioners](#14-post-profiles-practitioners) — Alta de profesional de salud (workforce generalista)
15. [POST /profiles/practitioners/{profileId}/jurisdiction-authorizations](#15-post-profiles-practitioners-profileid-jurisdiction-authorizations) — Registrar/renovar autorización jurisdiccional (licencia)
16. [POST /profiles/practitioners/{profileId}/specialties](#16-post-profiles-practitioners-profileid-specialties) — Agregar especialidad con credencial de soporte

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

## 8. GET /profiles/patients/me/summary

- **Módulo:** `profiles`
- **Etiqueta OpenAPI:** `profiles-patients`
- **Nombre:** Consultar el resumen propio (requiere identidad verificada)
- **Operation ID:** `ProfilesPatientsController_getOwnSummary`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ProfilesPatientsController.getOwnSummary](../../src/modules/profiles/controllers/profiles-patients.controller.ts)

### Descripción de negocio

Consultar el resumen propio (requiere identidad verificada). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Resumen del propio paciente. Ejemplo de función que sólo se habilita con la identidad verificada: sin aserción vigente el guard responde 403.

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
| `patientCode` | Sí | `string` | Sin restricción adicional declarada | Valor de patient code mantenido por la instancia. | `CODIGO_EJEMPLO` |
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

## 9. POST /profiles/patients/merge

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

## 10. GET /profiles/patients/merge-events

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

## 11. POST /profiles/patients/merge/{eventId}/reverse

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

## 12. POST /profiles/persons/{personId}/account-links

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

## 13. POST /profiles/persons/{personId}/decease

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

## 14. POST /profiles/practitioners

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
| `licenseNumber` | Sí | `string` | longitud mínima 1; longitud máxima 100 | Nº de licencia de la autorización jurisdiccional inicial | `valor-ejemplo` |
| `jurisdictionConceptId` | No | `string` | formato `uuid` | Concept id de jurisdicción de la licencia | `00000000-0000-4000-8000-000000000001` |
| `regulatoryAuthority` | No | `string` | longitud máxima 200 | Autoridad regulatoria emisora | `valor-ejemplo` |
| `credentialNumber` | Sí | `string` | longitud mínima 1; longitud máxima 100 | Nº de la credencial de soporte | `valor-ejemplo` |
| `credentialTypeConceptId` | No | `string` | formato `uuid` | Concept id del tipo de credencial | `00000000-0000-4000-8000-000000000001` |
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
  "licenseNumber": "valor-ejemplo",
  "jurisdictionConceptId": "00000000-0000-4000-8000-000000000001",
  "regulatoryAuthority": "valor-ejemplo",
  "credentialNumber": "valor-ejemplo",
  "credentialTypeConceptId": "00000000-0000-4000-8000-000000000001",
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

## 15. POST /profiles/practitioners/{profileId}/jurisdiction-authorizations

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

## 16. POST /profiles/practitioners/{profileId}/specialties

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

