<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `profiles`

Referencia exhaustiva de 41 operación(es) del módulo `profiles`, derivada del contrato OpenAPI y del código TypeScript.

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
10. [DELETE /profiles/patients/me/photo](#10-delete-profiles-patients-me-photo) — Quitar la propia foto de perfil
11. [PUT /profiles/patients/me/photo](#11-put-profiles-patients-me-photo) — Fijar la propia foto de perfil
12. [GET /profiles/patients/me/summary](#12-get-profiles-patients-me-summary) — Consultar el resumen propio
13. [POST /profiles/patients/merge](#13-post-profiles-patients-merge) — Fusionar pacientes duplicados
14. [GET /profiles/patients/merge-events](#14-get-profiles-patients-merge-events) — Listar eventos de fusión de pacientes
15. [POST /profiles/patients/merge/{eventId}/reverse](#15-post-profiles-patients-merge-eventid-reverse) — Revertir una fusión de pacientes
16. [POST /profiles/persons/{personId}/account-links](#16-post-profiles-persons-personid-account-links) — Vincular cuenta de portal a una persona
17. [POST /profiles/persons/{personId}/decease](#17-post-profiles-persons-personid-decease) — Registrar defunción y anonimización de una persona
18. [GET /profiles/practitioners](#18-get-profiles-practitioners) — Listar profesionales para la guía, con sus especialidades
19. [POST /profiles/practitioners](#19-post-profiles-practitioners) — Alta de profesional de salud (workforce generalista)
20. [POST /profiles/practitioners/{profileId}/affiliations](#20-post-profiles-practitioners-profileid-affiliations) — Registrar un consultorio de un profesional sin cuenta
21. [POST /profiles/practitioners/{profileId}/jurisdiction-authorizations](#21-post-profiles-practitioners-profileid-jurisdiction-authorizations) — Registrar/renovar autorización jurisdiccional (licencia)
22. [DELETE /profiles/practitioners/{profileId}/photo](#22-delete-profiles-practitioners-profileid-photo) — Quitar la foto del perfil profesional
23. [PUT /profiles/practitioners/{profileId}/photo](#23-put-profiles-practitioners-profileid-photo) — Fijar la foto del perfil profesional
24. [POST /profiles/practitioners/{profileId}/specialties](#24-post-profiles-practitioners-profileid-specialties) — Agregar especialidad con credencial de soporte
25. [GET /profiles/practitioners/{profileId}/summary](#25-get-profiles-practitioners-profileid-summary) — Consultar el perfil profesional de un colega (ficha de la guía)
26. [PATCH /profiles/practitioners/me](#26-patch-profiles-practitioners-me) — Editar la presentación del propio perfil profesional
27. [GET /profiles/practitioners/me/affiliations](#27-get-profiles-practitioners-me-affiliations) — Historial laboral propio (instituciones donde trabajó)
28. [POST /profiles/practitioners/me/affiliations](#28-post-profiles-practitioners-me-affiliations) — Registrar una afiliación institucional en el historial propio
29. [DELETE /profiles/practitioners/me/affiliations/{affiliationId}](#29-delete-profiles-practitioners-me-affiliations-affiliationid) — Quitar una afiliación del historial laboral propio
30. [PATCH /profiles/practitioners/me/affiliations/{affiliationId}](#30-patch-profiles-practitioners-me-affiliations-affiliationid) — Corregir una afiliación del historial laboral propio
31. [POST /profiles/practitioners/me/credentials](#31-post-profiles-practitioners-me-credentials) — Agregar un título propio (diplomado, maestría, doctorado…)
32. [DELETE /profiles/practitioners/me/credentials/{credentialId}](#32-delete-profiles-practitioners-me-credentials-credentialid) — Retirar un título propio pendiente
33. [GET /profiles/practitioners/me/linkable-organizations](#33-get-profiles-practitioners-me-linkable-organizations) — Buscar instituciones del padrón para declarar una afiliación
34. [GET /profiles/practitioners/me/onboarding](#34-get-profiles-practitioners-me-onboarding) — Qué le falta al profesional para completar su alta
35. [PATCH /profiles/practitioners/me/specialties/{specialtyId}/primary](#35-patch-profiles-practitioners-me-specialties-specialtyid-primary) — Marcar una especialidad propia como la principal
36. [GET /profiles/practitioners/me/summary](#36-get-profiles-practitioners-me-summary) — Consultar el perfil profesional propio (trayectoria y actividad)
37. [GET /profiles/practitioners/specialty-counts](#37-get-profiles-practitioners-specialty-counts) — Contar profesionales visibles por especialidad
38. [GET /tenants/{tenantId}/practitioner-requests](#38-get-tenants-tenantid-practitioner-requests) — Solicitudes de médicos que piden atender en la organización
39. [POST /tenants/{tenantId}/practitioner-requests/{affiliationId}/approve](#39-post-tenants-tenantid-practitioner-requests-affiliationid-approve) — Aprobar la solicitud de un profesional
40. [POST /tenants/{tenantId}/practitioner-requests/{affiliationId}/reject](#40-post-tenants-tenantid-practitioner-requests-affiliationid-reject) — Rechazar la solicitud de un profesional
41. [POST /tenants/{tenantId}/practitioner-requests/{affiliationId}/revoke](#41-post-tenants-tenantid-practitioner-requests-affiliationid-revoke) — Dar de baja un vínculo ya aprobado

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

Contexto declarado en el controlador: UC-05-13: listado de pacientes. Va declarado **después** de `patients/me/summary` a propósito: Nest resuelve las rutas por orden de declaración y `patients/:profileId` capturaría `patients/me` si fuera antes. ## Quién puede buscar, y qué ve (TAREA-07, P-07-10 — 2026-09-02) Hasta acá el listado era exclusivo de `SECURITY_ADMIN`, con esta nota: «la lista de todas las historias de una organización es exactamente el dato que no debe existir como pantalla». El propietario pidió que quien atiende (`CLINICIAN`, `PRACTITIONER`) también pueda buscar. Una primera versión acotó ese acceso a la gente con actividad en su organización; se revirtió el mismo día porque la búsqueda no es sólo para consultar a quien ya se atendió — es para **registrar** a quien nunca se atendió, y acotar por actividad le impide precisamente eso. Hoy los cuatro roles ven el **mismo padrón sin acotar** (`resolvePatientSearchScope()`, en `patient-search-scope.ts`). Lo que reemplaza al acotamiento: `CLINICIAN`/`PRACTITIONER` deben aportar `q` o `nationalId` — sin ninguno de los dos, `422` (`requiereCriterioDeBusqueda()`); sin este freno, listar sin criterio sería enumerar el padrón, no buscar. `SECURITY_ADMIN`/`SUPERADMIN` siguen listando libremente. Encontrar a alguien acá **no** abre su expediente clínico: esa puerta la decide `ClinicalReadService` aparte (turno confirmado hoy o relación asistencial aceptada vigente).

### Descripción del sistema

NestJS resuelve `GET /profiles/patients` en `ProfilesPatientsController_searchPatients`. El controlador delega en `ProfilesPatientsService.searchPatients`. No recibe body. El tipo de retorno estático es `Promise<SearchPatientsResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `q` | query | No | `string` | Sin restricción adicional declarada | Texto a buscar en el código de paciente o el nombre | `valor-ejemplo` |
| `nationalId` | query | No | `string` | Sin restricción adicional declarada | Documento de identidad exacto (`common.identifiers.value`) | `00000000-0000-4000-8000-000000000001` |
| `issuerAdministrativeAreaConceptId` | query | No | `string` | formato `uuid` | Departamento que expidió el documento (VS_BO_DEPARTMENT); sólo tiene efecto junto a nationalId | `00000000-0000-4000-8000-000000000001` |
| `cursor` | query | No | `string` | Sin restricción adicional declarada | Cursor opaco devuelto por la página anterior | `valor-ejemplo` |
| `limit` | query | No | `number` | máximo 500 | Tope de resultados (por defecto 50) | `50` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /profiles/patients HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `SUPERADMIN`, `CLINICIAN`, `PRACTITIONER`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /profiles/patients?q=valor-ejemplo&nationalId=00000000-0000-4000-8000-000000000001&issuerAdministrativeAreaConceptId=00000000-0000-4000-8000-000000000001&cursor=valor-ejemplo&limit=50 HTTP/1.1
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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, SUPERADMIN, CLINICIAN, PRACTITIONER. | Roles/tenant/guards de autorización |
| 422 | `PRECONDITION_FAILED` | Buscá por nombre, código o documento: no se puede listar el padrón completo de pacientes | Excepción explícita en src/modules/profiles/services/profiles-patients.service.ts |
| 422 | `PRECONDITION_FAILED` | El departamento no pertenece al catálogo de departamentos de Bolivia | Excepción explícita en src/modules/profiles/services/administrative-area-catalog.service.ts |
| 422 | `PRECONDITION_FAILED` | El catálogo de departamentos no está disponible | Excepción explícita en src/modules/profiles/services/administrative-area-catalog.service.ts |
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
  "occupationConceptId": "00000000-0000-4000-8000-000000000001",
  "occupationFreeText": "valor-ejemplo",
  "workEmployerConceptId": "00000000-0000-4000-8000-000000000001",
  "workEmployerFreeText": "valor-ejemplo",
  "phone": "+59170000000",
  "residenceMunicipalityConceptId": "00000000-0000-4000-8000-000000000001",
  "identityVerified": true,
  "patientCode": "CODIGO_EJEMPLO",
  "nationalId": "00000000-0000-4000-8000-000000000001",
  "issuerAdministrativeAreaConceptId": "00000000-0000-4000-8000-000000000001",
  "taxId": "00000000-0000-4000-8000-000000000001",
  "taxHolderName": "Nombre de ejemplo",
  "email": "usuario@example.com",
  "photoFileId": "00000000-0000-4000-8000-000000000001",
  "homeAddress": {
    "lines": "valor-ejemplo",
    "city": "valor-ejemplo",
    "municipalityConceptId": "00000000-0000-4000-8000-000000000001",
    "latitude": 1,
    "longitude": 1
  },
  "workAddress": {
    "lines": "valor-ejemplo",
    "city": "valor-ejemplo",
    "municipalityConceptId": "00000000-0000-4000-8000-000000000001",
    "latitude": 1,
    "longitude": 1
  },
  "coverages": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "carrierName": "Nombre de ejemplo",
      "planName": "Nombre de ejemplo",
      "isPublic": true,
      "policyIdentifier": "valor-ejemplo",
      "memberIdentifier": "valor-ejemplo",
      "verified": true,
      "status": "ok",
      "statusCode": "CODIGO_EJEMPLO",
      "validityStatus": "CURRENT",
      "referenceDate": "2026-07-31",
      "effectiveFrom": "2026-07-31",
      "effectiveTo": "2026-07-31",
      "currencyCode": "BOB",
      "carrierWhatsappNumber": "valor-ejemplo",
      "carrierCallCenterPhone": "+59170000000",
      "benefits": [
        {
          "id": "00000000-0000-4000-8000-000000000001",
          "categoryCode": "CODIGO_EJEMPLO",
          "categoryName": "Nombre de ejemplo",
          "serviceConceptId": "00000000-0000-4000-8000-000000000001",
          "serviceName": "Nombre de ejemplo",
          "coveragePercent": "80.00",
          "copayAmount": "20.00",
          "deductibleAmount": "0.00",
          "statusCode": "CODIGO_EJEMPLO",
          "validityStatus": "CURRENT",
          "effectiveFrom": "2026-07-31",
          "effectiveTo": "2026-07-31"
        }
      ],
      "planId": "00000000-0000-4000-8000-000000000001",
      "coverageOrder": 1
    }
  ],
  "guardians": [
    {
      "displayName": "Nombre de ejemplo",
      "relationshipConceptId": "00000000-0000-4000-8000-000000000001",
      "isEmergencyContact": true,
      "isLegalGuardian": true,
      "phone": "+59170000000"
    }
  ]
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
| `occupationConceptId` | No | `string` | formato `uuid` | Ocupación elegida del catálogo (VS_BO_OCCUPATION) | `00000000-0000-4000-8000-000000000001` |
| `occupationFreeText` | No | `string` | Sin restricción adicional declarada | Ocupación declarada en texto libre | `valor-ejemplo` |
| `workEmployerConceptId` | No | `string` | formato `uuid` | Empresa donde trabaja, del catálogo (VS_BO_EMPLOYER) | `00000000-0000-4000-8000-000000000001` |
| `workEmployerFreeText` | No | `string` | Sin restricción adicional declarada | Empresa declarada en texto libre | `valor-ejemplo` |
| `phone` | No | `string` | Sin restricción adicional declarada | Teléfono de contacto vigente (`common.contact_points`) | `+59170000000` |
| `residenceMunicipalityConceptId` | No | `string` | formato `uuid` | Municipio del domicilio vigente (catálogo VS_BO_MUNICIPALITY). El departamento lo deriva el servidor. | `00000000-0000-4000-8000-000000000001` |
| `identityVerified` | Sí | `boolean` | Sin restricción adicional declarada | Si el titular tiene una aserción de identidad vigente. Con `false` el perfil llega sin `patientCode`. | `true` |
| `patientCode` | No | `string` | Sin restricción adicional declarada | Código de paciente. Sólo con identidad verificada: ausente mientras `identityVerified` sea `false`. | `CODIGO_EJEMPLO` |
| `nationalId` | No | `string` | Sin restricción adicional declarada | Documento de identidad. Es su usuario de acceso, así que no se edita desde acá. | `00000000-0000-4000-8000-000000000001` |
| `issuerAdministrativeAreaConceptId` | No | `string` | formato `uuid` | Departamento que emitió el documento (VS_BO_DEPARTMENT) | `00000000-0000-4000-8000-000000000001` |
| `taxId` | No | `string` | Sin restricción adicional declarada | NIT para facturación | `00000000-0000-4000-8000-000000000001` |
| `taxHolderName` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `email` | No | `string` | Sin restricción adicional declarada | Correo de contacto vigente | `usuario@example.com` |
| `photoFileId` | No | `string` | formato `uuid` | Foto de perfil (id de archivo en `common.files`) | `00000000-0000-4000-8000-000000000001` |
| `homeAddress` | No | `OwnAddressDto` | Sin restricción adicional declarada | Domicilio, con calle y punto en el mapa si los declaró | `{"lines":"valor-ejemplo","city":"valor-ejemplo","municipalityConceptId":"00000000-0000-4000-8000-000000000001","latitude":1,"longitude":1}` |
| `homeAddress.lines` | No | `string` | Sin restricción adicional declarada | Calle y número, tal como la escribió | `valor-ejemplo` |
| `homeAddress.city` | No | `string` | Sin restricción adicional declarada | Ciudad, derivada del municipio | `valor-ejemplo` |
| `homeAddress.municipalityConceptId` | No | `string` | formato `uuid` | Municipio (VS_BO_MUNICIPALITY) | `00000000-0000-4000-8000-000000000001` |
| `homeAddress.latitude` | No | `number` | Sin restricción adicional declarada | Latitud, si marcó el punto en el mapa | `1` |
| `homeAddress.longitude` | No | `number` | Sin restricción adicional declarada | Longitud; viaja siempre junto a la latitud | `1` |
| `workAddress` | No | `OwnAddressDto` | Sin restricción adicional declarada | Dirección de trabajo | `{"lines":"valor-ejemplo","city":"valor-ejemplo","municipalityConceptId":"00000000-0000-4000-8000-000000000001","latitude":1,"longitude":1}` |
| `workAddress.lines` | No | `string` | Sin restricción adicional declarada | Calle y número, tal como la escribió | `valor-ejemplo` |
| `workAddress.city` | No | `string` | Sin restricción adicional declarada | Ciudad, derivada del municipio | `valor-ejemplo` |
| `workAddress.municipalityConceptId` | No | `string` | formato `uuid` | Municipio (VS_BO_MUNICIPALITY) | `00000000-0000-4000-8000-000000000001` |
| `workAddress.latitude` | No | `number` | Sin restricción adicional declarada | Latitud, si marcó el punto en el mapa | `1` |
| `workAddress.longitude` | No | `number` | Sin restricción adicional declarada | Longitud; viaja siempre junto a la latitud | `1` |
| `coverages` | Sí | `array<OwnCoverageDto>` | Sin restricción adicional declarada | Seguros declarados. Vacío si no declaró ninguno. | `[{"id":"00000000-0000-4000-8000-000000000001","carrierName":"Nombre de ejemplo","planName":"Nombre de ejemplo","isPublic":true,"policyIdentifier":"valor-ejemplo","memberIdentifier":"valor-ejemplo","verified":true,"status":"ok","statusCode":"CODIGO_EJEMPLO","validityStatus":"CURRENT","referenceDate":"2026-07-31","effectiveFrom":"2026-07-31","effectiveTo":"2026-07-31","currencyCode":"BOB","carrierWhatsappNumber":"valor-ejemplo","carrierCallCenterPhone":"+59170000000","benefits":[{"id":"00000000-0000-4000-8000-000000000001","categoryCode":"CODIGO_EJEMPLO","categoryName":"Nombre de ejemplo","serviceConceptId":"00000000-0000-4000-8000-000000000001","serviceName":"Nombre de ejemplo","coveragePercent":"80.00","copayAmount":"20.00","deductibleAmount":"0.00","statusCode":"CODIGO_EJEMPLO","validityStatus":"CURRENT","effectiveFrom":"2026-07-31","effectiveTo":"2026-07-31"}],"planId":"00000000-0000-4000-8000-000000000001","coverageOrder":1}]` |
| `coverages[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `coverages[].carrierName` | Sí | `string` | Sin restricción adicional declarada | Aseguradora, en palabras | `Nombre de ejemplo` |
| `coverages[].planName` | No | `string` | Sin restricción adicional declarada | Plan contratado, en palabras | `Nombre de ejemplo` |
| `coverages[].isPublic` | Sí | `boolean` | Sin restricción adicional declarada | Si el seguro es público o privado | `true` |
| `coverages[].policyIdentifier` | No | `string` | Sin restricción adicional declarada | Número de póliza declarado | `valor-ejemplo` |
| `coverages[].memberIdentifier` | No | `string` | Sin restricción adicional declarada | Con qué documento figura afiliado | `valor-ejemplo` |
| `coverages[].verified` | Sí | `boolean` | Sin restricción adicional declarada | Si la plataforma confirmó la cobertura con la aseguradora | `true` |
| `coverages[].status` | No | `string` | Sin restricción adicional declarada | Estado legible de la cobertura | `ok` |
| `coverages[].statusCode` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `coverages[].validityStatus` | Sí | `string` | valores: `CURRENT`, `UPCOMING`, `EXPIRED`, `INACTIVE`, `UNKNOWN` | Sin descripción específica en el contrato OpenAPI. | `CURRENT` |
| `coverages[].referenceDate` | Sí | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `coverages[].effectiveFrom` | No | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `coverages[].effectiveTo` | No | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `coverages[].currencyCode` | No | `string` | Sin restricción adicional declarada | Código de moneda del plan | `BOB` |
| `coverages[].carrierWhatsappNumber` | No | `string` | Sin restricción adicional declarada | Canal oficial de WhatsApp de la aseguradora | `valor-ejemplo` |
| `coverages[].carrierCallCenterPhone` | No | `string` | Sin restricción adicional declarada | Call center oficial de la aseguradora | `+59170000000` |
| `coverages[].benefits` | Sí | `array<CoverageBenefitSummaryDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","categoryCode":"CODIGO_EJEMPLO","categoryName":"Nombre de ejemplo","serviceConceptId":"00000000-0000-4000-8000-000000000001","serviceName":"Nombre de ejemplo","coveragePercent":"80.00","copayAmount":"20.00","deductibleAmount":"0.00","statusCode":"CODIGO_EJEMPLO","validityStatus":"CURRENT","effectiveFrom":"2026-07-31","effectiveTo":"2026-07-31"}]` |
| `coverages[].benefits[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `coverages[].benefits[].categoryCode` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `coverages[].benefits[].categoryName` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `coverages[].benefits[].serviceConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `coverages[].benefits[].serviceName` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `coverages[].benefits[].coveragePercent` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `80.00` |
| `coverages[].benefits[].copayAmount` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `20.00` |
| `coverages[].benefits[].deductibleAmount` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `0.00` |
| `coverages[].benefits[].statusCode` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `coverages[].benefits[].validityStatus` | Sí | `string` | valores: `CURRENT`, `UPCOMING`, `EXPIRED`, `INACTIVE`, `UNKNOWN` | Sin descripción específica en el contrato OpenAPI. | `CURRENT` |
| `coverages[].benefits[].effectiveFrom` | No | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `coverages[].benefits[].effectiveTo` | No | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `coverages[].planId` | No | `string` | formato `uuid` | Plan de salud elegido | `00000000-0000-4000-8000-000000000001` |
| `coverages[].coverageOrder` | Sí | `number` | Sin restricción adicional declarada | Orden de la cobertura: 1 privada, 2 pública | `1` |
| `guardians` | Sí | `array<OwnGuardianDto>` | Sin restricción adicional declarada | Tutores y personas autorizadas, con su teléfono. | `[{"displayName":"Nombre de ejemplo","relationshipConceptId":"00000000-0000-4000-8000-000000000001","isEmergencyContact":true,"isLegalGuardian":true,"phone":"+59170000000"}]` |
| `guardians[].displayName` | No | `string` | Sin restricción adicional declarada | Cómo se llama | `Nombre de ejemplo` |
| `guardians[].relationshipConceptId` | No | `string` | formato `uuid` | Parentesco (concept id) | `00000000-0000-4000-8000-000000000001` |
| `guardians[].isEmergencyContact` | Sí | `boolean` | Sin restricción adicional declarada | Es a quien llamar en una urgencia | `true` |
| `guardians[].isLegalGuardian` | Sí | `boolean` | Sin restricción adicional declarada | Es su representante legal | `true` |
| `guardians[].phone` | No | `string` | Sin restricción adicional declarada | Su teléfono | `+59170000000` |

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
| `birthDate` | No | `object` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `sexAtBirth` | No | `string` | valores: `MALE`, `FEMALE`, `INTERSEX`, `UNKNOWN` | Sexo asignado al nacer | `MALE` |
| `occupationConceptId` | No | `string` | formato `uuid` | Ocupación del catálogo (VS_BO_OCCUPATION). Cadena vacía para borrarla. Si viene, el texto libre se descarta. | `00000000-0000-4000-8000-000000000001` |
| `occupationFreeText` | No | `string` | longitud máxima 200 | Ocupación en texto libre, para cuando no está en el catálogo. Cadena vacía para borrarla. | `valor-ejemplo` |
| `phone` | No | `string` | longitud máxima 40; patrón runtime `PHONE_PATTERN` | Teléfono de contacto en formato E.164 o nacional: dígitos, espacios, paréntesis, + y guion, mínimo 6 caracteres. Cadena vacía para quedarse sin teléfono. | `+59170000000` |
| `residenceMunicipalityConceptId` | No | `string` | formato `uuid` | Municipio de residencia (catálogo VS_BO_MUNICIPALITY) | `00000000-0000-4000-8000-000000000001` |
| `taxId` | No | `string` | longitud máxima 20 | NIT para facturación. Cadena vacía para quedarse sin NIT. | `00000000-0000-4000-8000-000000000001` |
| `taxHolderName` | No | `string` | longitud máxima 200 | Nombre o razón social del titular del NIT. Cadena vacía para quitarla. | `Nombre de ejemplo` |
| `homeAddressLines` | No | `string` | longitud máxima 300 | Domicilio, tal como lo escribe la persona. Vacío para quitarlo. | `valor-ejemplo` |
| `workAddressLines` | No | `string` | longitud máxima 300 | Dirección de trabajo. Vacío para quitarla. | `valor-ejemplo` |
| `issuerAdministrativeAreaConceptId` | No | `string` | formato `uuid` | Departamento que emitió el documento (VS_BO_DEPARTMENT) | `00000000-0000-4000-8000-000000000001` |
| `homeLatitude` | No | `object` | mínimo -90; máximo 90 | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `homeLongitude` | No | `object` | mínimo -180; máximo 180 | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `workMunicipalityConceptId` | No | `string` | formato `uuid` | Municipio del trabajo (catálogo VS_BO_MUNICIPALITY) | `00000000-0000-4000-8000-000000000001` |
| `workLatitude` | No | `object` | mínimo -90; máximo 90 | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `workLongitude` | No | `object` | mínimo -180; máximo 180 | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `workEmployerConceptId` | No | `string` | formato `uuid` | Empresa donde trabaja (VS_BO_EMPLOYER). Cadena vacía para borrarla. Si viene, el texto libre se descarta. | `00000000-0000-4000-8000-000000000001` |
| `workEmployerFreeText` | No | `string` | longitud máxima 200 | Empresa en texto libre. Cadena vacía para borrarla. Se descarta si viene el concepto. | `valor-ejemplo` |
| `guardianName` | No | `string` | longitud máxima 200 | Nombre del tutor o persona autorizada. No hay forma de quitarlo, sólo de declararlo o corregirlo. | `Nombre de ejemplo` |
| `guardianPhone` | No | `string` | longitud máxima 40; patrón runtime `PHONE_PATTERN` | Teléfono del tutor, en formato E.164 o nacional | `+59170000000` |
| `guardianRelationshipConceptId` | No | `string` | formato `uuid` | Parentesco del tutor o contacto de emergencia (conjunto related-person-relationship) | `00000000-0000-4000-8000-000000000001` |
| `privateInsurancePlanId` | No | `string` | formato `uuid` | Plan de la aseguradora privada declarada. Sólo si la persona no tenía ninguna ya. | `00000000-0000-4000-8000-000000000001` |
| `publicInsurancePlanId` | No | `string` | formato `uuid` | Plan del seguro público declarado. Sólo si la persona no tenía ninguno ya. | `00000000-0000-4000-8000-000000000001` |

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
  "birthDate": {},
  "sexAtBirth": "MALE",
  "occupationConceptId": "00000000-0000-4000-8000-000000000001",
  "occupationFreeText": "valor-ejemplo",
  "phone": "+59170000000",
  "residenceMunicipalityConceptId": "00000000-0000-4000-8000-000000000001",
  "taxId": "00000000-0000-4000-8000-000000000001",
  "taxHolderName": "Nombre de ejemplo",
  "homeAddressLines": "valor-ejemplo",
  "workAddressLines": "valor-ejemplo",
  "issuerAdministrativeAreaConceptId": "00000000-0000-4000-8000-000000000001",
  "homeLatitude": {},
  "homeLongitude": {},
  "workMunicipalityConceptId": "00000000-0000-4000-8000-000000000001",
  "workLatitude": {},
  "workLongitude": {},
  "workEmployerConceptId": "00000000-0000-4000-8000-000000000001",
  "workEmployerFreeText": "valor-ejemplo",
  "guardianName": "Nombre de ejemplo",
  "guardianPhone": "+59170000000",
  "guardianRelationshipConceptId": "00000000-0000-4000-8000-000000000001",
  "privateInsurancePlanId": "00000000-0000-4000-8000-000000000001",
  "publicInsurancePlanId": "00000000-0000-4000-8000-000000000001"
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
  "occupationConceptId": "00000000-0000-4000-8000-000000000001",
  "occupationFreeText": "valor-ejemplo",
  "workEmployerConceptId": "00000000-0000-4000-8000-000000000001",
  "workEmployerFreeText": "valor-ejemplo",
  "phone": "+59170000000",
  "residenceMunicipalityConceptId": "00000000-0000-4000-8000-000000000001",
  "identityVerified": true,
  "patientCode": "CODIGO_EJEMPLO",
  "nationalId": "00000000-0000-4000-8000-000000000001",
  "issuerAdministrativeAreaConceptId": "00000000-0000-4000-8000-000000000001",
  "taxId": "00000000-0000-4000-8000-000000000001",
  "taxHolderName": "Nombre de ejemplo",
  "email": "usuario@example.com",
  "photoFileId": "00000000-0000-4000-8000-000000000001",
  "homeAddress": {
    "lines": "valor-ejemplo",
    "city": "valor-ejemplo",
    "municipalityConceptId": "00000000-0000-4000-8000-000000000001",
    "latitude": 1,
    "longitude": 1
  },
  "workAddress": {
    "lines": "valor-ejemplo",
    "city": "valor-ejemplo",
    "municipalityConceptId": "00000000-0000-4000-8000-000000000001",
    "latitude": 1,
    "longitude": 1
  },
  "coverages": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "carrierName": "Nombre de ejemplo",
      "planName": "Nombre de ejemplo",
      "isPublic": true,
      "policyIdentifier": "valor-ejemplo",
      "memberIdentifier": "valor-ejemplo",
      "verified": true,
      "status": "ok",
      "statusCode": "CODIGO_EJEMPLO",
      "validityStatus": "CURRENT",
      "referenceDate": "2026-07-31",
      "effectiveFrom": "2026-07-31",
      "effectiveTo": "2026-07-31",
      "currencyCode": "BOB",
      "carrierWhatsappNumber": "valor-ejemplo",
      "carrierCallCenterPhone": "+59170000000",
      "benefits": [
        {
          "id": "00000000-0000-4000-8000-000000000001",
          "categoryCode": "CODIGO_EJEMPLO",
          "categoryName": "Nombre de ejemplo",
          "serviceConceptId": "00000000-0000-4000-8000-000000000001",
          "serviceName": "Nombre de ejemplo",
          "coveragePercent": "80.00",
          "copayAmount": "20.00",
          "deductibleAmount": "0.00",
          "statusCode": "CODIGO_EJEMPLO",
          "validityStatus": "CURRENT",
          "effectiveFrom": "2026-07-31",
          "effectiveTo": "2026-07-31"
        }
      ],
      "planId": "00000000-0000-4000-8000-000000000001",
      "coverageOrder": 1
    }
  ],
  "guardians": [
    {
      "displayName": "Nombre de ejemplo",
      "relationshipConceptId": "00000000-0000-4000-8000-000000000001",
      "isEmergencyContact": true,
      "isLegalGuardian": true,
      "phone": "+59170000000"
    }
  ]
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
| `occupationConceptId` | No | `string` | formato `uuid` | Ocupación elegida del catálogo (VS_BO_OCCUPATION) | `00000000-0000-4000-8000-000000000001` |
| `occupationFreeText` | No | `string` | Sin restricción adicional declarada | Ocupación declarada en texto libre | `valor-ejemplo` |
| `workEmployerConceptId` | No | `string` | formato `uuid` | Empresa donde trabaja, del catálogo (VS_BO_EMPLOYER) | `00000000-0000-4000-8000-000000000001` |
| `workEmployerFreeText` | No | `string` | Sin restricción adicional declarada | Empresa declarada en texto libre | `valor-ejemplo` |
| `phone` | No | `string` | Sin restricción adicional declarada | Teléfono de contacto vigente (`common.contact_points`) | `+59170000000` |
| `residenceMunicipalityConceptId` | No | `string` | formato `uuid` | Municipio del domicilio vigente (catálogo VS_BO_MUNICIPALITY). El departamento lo deriva el servidor. | `00000000-0000-4000-8000-000000000001` |
| `identityVerified` | Sí | `boolean` | Sin restricción adicional declarada | Si el titular tiene una aserción de identidad vigente. Con `false` el perfil llega sin `patientCode`. | `true` |
| `patientCode` | No | `string` | Sin restricción adicional declarada | Código de paciente. Sólo con identidad verificada: ausente mientras `identityVerified` sea `false`. | `CODIGO_EJEMPLO` |
| `nationalId` | No | `string` | Sin restricción adicional declarada | Documento de identidad. Es su usuario de acceso, así que no se edita desde acá. | `00000000-0000-4000-8000-000000000001` |
| `issuerAdministrativeAreaConceptId` | No | `string` | formato `uuid` | Departamento que emitió el documento (VS_BO_DEPARTMENT) | `00000000-0000-4000-8000-000000000001` |
| `taxId` | No | `string` | Sin restricción adicional declarada | NIT para facturación | `00000000-0000-4000-8000-000000000001` |
| `taxHolderName` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `email` | No | `string` | Sin restricción adicional declarada | Correo de contacto vigente | `usuario@example.com` |
| `photoFileId` | No | `string` | formato `uuid` | Foto de perfil (id de archivo en `common.files`) | `00000000-0000-4000-8000-000000000001` |
| `homeAddress` | No | `OwnAddressDto` | Sin restricción adicional declarada | Domicilio, con calle y punto en el mapa si los declaró | `{"lines":"valor-ejemplo","city":"valor-ejemplo","municipalityConceptId":"00000000-0000-4000-8000-000000000001","latitude":1,"longitude":1}` |
| `homeAddress.lines` | No | `string` | Sin restricción adicional declarada | Calle y número, tal como la escribió | `valor-ejemplo` |
| `homeAddress.city` | No | `string` | Sin restricción adicional declarada | Ciudad, derivada del municipio | `valor-ejemplo` |
| `homeAddress.municipalityConceptId` | No | `string` | formato `uuid` | Municipio (VS_BO_MUNICIPALITY) | `00000000-0000-4000-8000-000000000001` |
| `homeAddress.latitude` | No | `number` | Sin restricción adicional declarada | Latitud, si marcó el punto en el mapa | `1` |
| `homeAddress.longitude` | No | `number` | Sin restricción adicional declarada | Longitud; viaja siempre junto a la latitud | `1` |
| `workAddress` | No | `OwnAddressDto` | Sin restricción adicional declarada | Dirección de trabajo | `{"lines":"valor-ejemplo","city":"valor-ejemplo","municipalityConceptId":"00000000-0000-4000-8000-000000000001","latitude":1,"longitude":1}` |
| `workAddress.lines` | No | `string` | Sin restricción adicional declarada | Calle y número, tal como la escribió | `valor-ejemplo` |
| `workAddress.city` | No | `string` | Sin restricción adicional declarada | Ciudad, derivada del municipio | `valor-ejemplo` |
| `workAddress.municipalityConceptId` | No | `string` | formato `uuid` | Municipio (VS_BO_MUNICIPALITY) | `00000000-0000-4000-8000-000000000001` |
| `workAddress.latitude` | No | `number` | Sin restricción adicional declarada | Latitud, si marcó el punto en el mapa | `1` |
| `workAddress.longitude` | No | `number` | Sin restricción adicional declarada | Longitud; viaja siempre junto a la latitud | `1` |
| `coverages` | Sí | `array<OwnCoverageDto>` | Sin restricción adicional declarada | Seguros declarados. Vacío si no declaró ninguno. | `[{"id":"00000000-0000-4000-8000-000000000001","carrierName":"Nombre de ejemplo","planName":"Nombre de ejemplo","isPublic":true,"policyIdentifier":"valor-ejemplo","memberIdentifier":"valor-ejemplo","verified":true,"status":"ok","statusCode":"CODIGO_EJEMPLO","validityStatus":"CURRENT","referenceDate":"2026-07-31","effectiveFrom":"2026-07-31","effectiveTo":"2026-07-31","currencyCode":"BOB","carrierWhatsappNumber":"valor-ejemplo","carrierCallCenterPhone":"+59170000000","benefits":[{"id":"00000000-0000-4000-8000-000000000001","categoryCode":"CODIGO_EJEMPLO","categoryName":"Nombre de ejemplo","serviceConceptId":"00000000-0000-4000-8000-000000000001","serviceName":"Nombre de ejemplo","coveragePercent":"80.00","copayAmount":"20.00","deductibleAmount":"0.00","statusCode":"CODIGO_EJEMPLO","validityStatus":"CURRENT","effectiveFrom":"2026-07-31","effectiveTo":"2026-07-31"}],"planId":"00000000-0000-4000-8000-000000000001","coverageOrder":1}]` |
| `coverages[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `coverages[].carrierName` | Sí | `string` | Sin restricción adicional declarada | Aseguradora, en palabras | `Nombre de ejemplo` |
| `coverages[].planName` | No | `string` | Sin restricción adicional declarada | Plan contratado, en palabras | `Nombre de ejemplo` |
| `coverages[].isPublic` | Sí | `boolean` | Sin restricción adicional declarada | Si el seguro es público o privado | `true` |
| `coverages[].policyIdentifier` | No | `string` | Sin restricción adicional declarada | Número de póliza declarado | `valor-ejemplo` |
| `coverages[].memberIdentifier` | No | `string` | Sin restricción adicional declarada | Con qué documento figura afiliado | `valor-ejemplo` |
| `coverages[].verified` | Sí | `boolean` | Sin restricción adicional declarada | Si la plataforma confirmó la cobertura con la aseguradora | `true` |
| `coverages[].status` | No | `string` | Sin restricción adicional declarada | Estado legible de la cobertura | `ok` |
| `coverages[].statusCode` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `coverages[].validityStatus` | Sí | `string` | valores: `CURRENT`, `UPCOMING`, `EXPIRED`, `INACTIVE`, `UNKNOWN` | Sin descripción específica en el contrato OpenAPI. | `CURRENT` |
| `coverages[].referenceDate` | Sí | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `coverages[].effectiveFrom` | No | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `coverages[].effectiveTo` | No | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `coverages[].currencyCode` | No | `string` | Sin restricción adicional declarada | Código de moneda del plan | `BOB` |
| `coverages[].carrierWhatsappNumber` | No | `string` | Sin restricción adicional declarada | Canal oficial de WhatsApp de la aseguradora | `valor-ejemplo` |
| `coverages[].carrierCallCenterPhone` | No | `string` | Sin restricción adicional declarada | Call center oficial de la aseguradora | `+59170000000` |
| `coverages[].benefits` | Sí | `array<CoverageBenefitSummaryDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","categoryCode":"CODIGO_EJEMPLO","categoryName":"Nombre de ejemplo","serviceConceptId":"00000000-0000-4000-8000-000000000001","serviceName":"Nombre de ejemplo","coveragePercent":"80.00","copayAmount":"20.00","deductibleAmount":"0.00","statusCode":"CODIGO_EJEMPLO","validityStatus":"CURRENT","effectiveFrom":"2026-07-31","effectiveTo":"2026-07-31"}]` |
| `coverages[].benefits[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `coverages[].benefits[].categoryCode` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `coverages[].benefits[].categoryName` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `coverages[].benefits[].serviceConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `coverages[].benefits[].serviceName` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `coverages[].benefits[].coveragePercent` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `80.00` |
| `coverages[].benefits[].copayAmount` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `20.00` |
| `coverages[].benefits[].deductibleAmount` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `0.00` |
| `coverages[].benefits[].statusCode` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `coverages[].benefits[].validityStatus` | Sí | `string` | valores: `CURRENT`, `UPCOMING`, `EXPIRED`, `INACTIVE`, `UNKNOWN` | Sin descripción específica en el contrato OpenAPI. | `CURRENT` |
| `coverages[].benefits[].effectiveFrom` | No | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `coverages[].benefits[].effectiveTo` | No | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `coverages[].planId` | No | `string` | formato `uuid` | Plan de salud elegido | `00000000-0000-4000-8000-000000000001` |
| `coverages[].coverageOrder` | Sí | `number` | Sin restricción adicional declarada | Orden de la cobertura: 1 privada, 2 pública | `1` |
| `guardians` | Sí | `array<OwnGuardianDto>` | Sin restricción adicional declarada | Tutores y personas autorizadas, con su teléfono. | `[{"displayName":"Nombre de ejemplo","relationshipConceptId":"00000000-0000-4000-8000-000000000001","isEmergencyContact":true,"isLegalGuardian":true,"phone":"+59170000000"}]` |
| `guardians[].displayName` | No | `string` | Sin restricción adicional declarada | Cómo se llama | `Nombre de ejemplo` |
| `guardians[].relationshipConceptId` | No | `string` | formato `uuid` | Parentesco (concept id) | `00000000-0000-4000-8000-000000000001` |
| `guardians[].isEmergencyContact` | Sí | `boolean` | Sin restricción adicional declarada | Es a quien llamar en una urgencia | `true` |
| `guardians[].isLegalGuardian` | Sí | `boolean` | Sin restricción adicional declarada | Es su representante legal | `true` |
| `guardians[].phone` | No | `string` | Sin restricción adicional declarada | Su teléfono | `+59170000000` |

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

## 10. DELETE /profiles/patients/me/photo

- **Módulo:** `profiles`
- **Etiqueta OpenAPI:** `profiles-patients`
- **Nombre:** Quitar la propia foto de perfil
- **Operation ID:** `ProfilesPatientsController_removeOwnPhoto`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ProfilesPatientsController.removeOwnPhoto](../../src/modules/profiles/controllers/profiles-patients.controller.ts)

### Descripción de negocio

Quitar la propia foto de perfil. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Quitar la foto de perfil propia. Quita la referencia; el archivo no se toca. Idempotente.

### Descripción del sistema

NestJS resuelve `DELETE /profiles/patients/me/photo` en `ProfilesPatientsController_removeOwnPhoto`. El controlador delega en `ProfilesPatientsService.removeOwnPhoto`. No recibe body. El tipo de retorno estático es `Promise<OwnPatientProfileResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
DELETE /profiles/patients/me/photo HTTP/1.1
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
DELETE /profiles/patients/me/photo HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<OwnPatientProfileResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<OwnPatientProfileResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<OwnPatientProfileResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<OwnPatientProfileResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<OwnPatientProfileResponseDto>` | No |
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
  "occupationConceptId": "00000000-0000-4000-8000-000000000001",
  "occupationFreeText": "valor-ejemplo",
  "workEmployerConceptId": "00000000-0000-4000-8000-000000000001",
  "workEmployerFreeText": "valor-ejemplo",
  "phone": "+59170000000",
  "residenceMunicipalityConceptId": "00000000-0000-4000-8000-000000000001",
  "identityVerified": true,
  "patientCode": "CODIGO_EJEMPLO",
  "nationalId": "00000000-0000-4000-8000-000000000001",
  "issuerAdministrativeAreaConceptId": "00000000-0000-4000-8000-000000000001",
  "taxId": "00000000-0000-4000-8000-000000000001",
  "taxHolderName": "Nombre de ejemplo",
  "email": "usuario@example.com",
  "photoFileId": "00000000-0000-4000-8000-000000000001",
  "homeAddress": {
    "lines": "valor-ejemplo",
    "city": "valor-ejemplo",
    "municipalityConceptId": "00000000-0000-4000-8000-000000000001",
    "latitude": 1,
    "longitude": 1
  },
  "workAddress": {
    "lines": "valor-ejemplo",
    "city": "valor-ejemplo",
    "municipalityConceptId": "00000000-0000-4000-8000-000000000001",
    "latitude": 1,
    "longitude": 1
  },
  "coverages": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "carrierName": "Nombre de ejemplo",
      "planName": "Nombre de ejemplo",
      "isPublic": true,
      "policyIdentifier": "valor-ejemplo",
      "memberIdentifier": "valor-ejemplo",
      "verified": true,
      "status": "ok",
      "statusCode": "CODIGO_EJEMPLO",
      "validityStatus": "CURRENT",
      "referenceDate": "2026-07-31",
      "effectiveFrom": "2026-07-31",
      "effectiveTo": "2026-07-31",
      "currencyCode": "BOB",
      "carrierWhatsappNumber": "valor-ejemplo",
      "carrierCallCenterPhone": "+59170000000",
      "benefits": [
        {
          "id": "00000000-0000-4000-8000-000000000001",
          "categoryCode": "CODIGO_EJEMPLO",
          "categoryName": "Nombre de ejemplo",
          "serviceConceptId": "00000000-0000-4000-8000-000000000001",
          "serviceName": "Nombre de ejemplo",
          "coveragePercent": "80.00",
          "copayAmount": "20.00",
          "deductibleAmount": "0.00",
          "statusCode": "CODIGO_EJEMPLO",
          "validityStatus": "CURRENT",
          "effectiveFrom": "2026-07-31",
          "effectiveTo": "2026-07-31"
        }
      ],
      "planId": "00000000-0000-4000-8000-000000000001",
      "coverageOrder": 1
    }
  ],
  "guardians": [
    {
      "displayName": "Nombre de ejemplo",
      "relationshipConceptId": "00000000-0000-4000-8000-000000000001",
      "isEmergencyContact": true,
      "isLegalGuardian": true,
      "phone": "+59170000000"
    }
  ]
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
| `occupationConceptId` | No | `string` | formato `uuid` | Ocupación elegida del catálogo (VS_BO_OCCUPATION) | `00000000-0000-4000-8000-000000000001` |
| `occupationFreeText` | No | `string` | Sin restricción adicional declarada | Ocupación declarada en texto libre | `valor-ejemplo` |
| `workEmployerConceptId` | No | `string` | formato `uuid` | Empresa donde trabaja, del catálogo (VS_BO_EMPLOYER) | `00000000-0000-4000-8000-000000000001` |
| `workEmployerFreeText` | No | `string` | Sin restricción adicional declarada | Empresa declarada en texto libre | `valor-ejemplo` |
| `phone` | No | `string` | Sin restricción adicional declarada | Teléfono de contacto vigente (`common.contact_points`) | `+59170000000` |
| `residenceMunicipalityConceptId` | No | `string` | formato `uuid` | Municipio del domicilio vigente (catálogo VS_BO_MUNICIPALITY). El departamento lo deriva el servidor. | `00000000-0000-4000-8000-000000000001` |
| `identityVerified` | Sí | `boolean` | Sin restricción adicional declarada | Si el titular tiene una aserción de identidad vigente. Con `false` el perfil llega sin `patientCode`. | `true` |
| `patientCode` | No | `string` | Sin restricción adicional declarada | Código de paciente. Sólo con identidad verificada: ausente mientras `identityVerified` sea `false`. | `CODIGO_EJEMPLO` |
| `nationalId` | No | `string` | Sin restricción adicional declarada | Documento de identidad. Es su usuario de acceso, así que no se edita desde acá. | `00000000-0000-4000-8000-000000000001` |
| `issuerAdministrativeAreaConceptId` | No | `string` | formato `uuid` | Departamento que emitió el documento (VS_BO_DEPARTMENT) | `00000000-0000-4000-8000-000000000001` |
| `taxId` | No | `string` | Sin restricción adicional declarada | NIT para facturación | `00000000-0000-4000-8000-000000000001` |
| `taxHolderName` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `email` | No | `string` | Sin restricción adicional declarada | Correo de contacto vigente | `usuario@example.com` |
| `photoFileId` | No | `string` | formato `uuid` | Foto de perfil (id de archivo en `common.files`) | `00000000-0000-4000-8000-000000000001` |
| `homeAddress` | No | `OwnAddressDto` | Sin restricción adicional declarada | Domicilio, con calle y punto en el mapa si los declaró | `{"lines":"valor-ejemplo","city":"valor-ejemplo","municipalityConceptId":"00000000-0000-4000-8000-000000000001","latitude":1,"longitude":1}` |
| `homeAddress.lines` | No | `string` | Sin restricción adicional declarada | Calle y número, tal como la escribió | `valor-ejemplo` |
| `homeAddress.city` | No | `string` | Sin restricción adicional declarada | Ciudad, derivada del municipio | `valor-ejemplo` |
| `homeAddress.municipalityConceptId` | No | `string` | formato `uuid` | Municipio (VS_BO_MUNICIPALITY) | `00000000-0000-4000-8000-000000000001` |
| `homeAddress.latitude` | No | `number` | Sin restricción adicional declarada | Latitud, si marcó el punto en el mapa | `1` |
| `homeAddress.longitude` | No | `number` | Sin restricción adicional declarada | Longitud; viaja siempre junto a la latitud | `1` |
| `workAddress` | No | `OwnAddressDto` | Sin restricción adicional declarada | Dirección de trabajo | `{"lines":"valor-ejemplo","city":"valor-ejemplo","municipalityConceptId":"00000000-0000-4000-8000-000000000001","latitude":1,"longitude":1}` |
| `workAddress.lines` | No | `string` | Sin restricción adicional declarada | Calle y número, tal como la escribió | `valor-ejemplo` |
| `workAddress.city` | No | `string` | Sin restricción adicional declarada | Ciudad, derivada del municipio | `valor-ejemplo` |
| `workAddress.municipalityConceptId` | No | `string` | formato `uuid` | Municipio (VS_BO_MUNICIPALITY) | `00000000-0000-4000-8000-000000000001` |
| `workAddress.latitude` | No | `number` | Sin restricción adicional declarada | Latitud, si marcó el punto en el mapa | `1` |
| `workAddress.longitude` | No | `number` | Sin restricción adicional declarada | Longitud; viaja siempre junto a la latitud | `1` |
| `coverages` | Sí | `array<OwnCoverageDto>` | Sin restricción adicional declarada | Seguros declarados. Vacío si no declaró ninguno. | `[{"id":"00000000-0000-4000-8000-000000000001","carrierName":"Nombre de ejemplo","planName":"Nombre de ejemplo","isPublic":true,"policyIdentifier":"valor-ejemplo","memberIdentifier":"valor-ejemplo","verified":true,"status":"ok","statusCode":"CODIGO_EJEMPLO","validityStatus":"CURRENT","referenceDate":"2026-07-31","effectiveFrom":"2026-07-31","effectiveTo":"2026-07-31","currencyCode":"BOB","carrierWhatsappNumber":"valor-ejemplo","carrierCallCenterPhone":"+59170000000","benefits":[{"id":"00000000-0000-4000-8000-000000000001","categoryCode":"CODIGO_EJEMPLO","categoryName":"Nombre de ejemplo","serviceConceptId":"00000000-0000-4000-8000-000000000001","serviceName":"Nombre de ejemplo","coveragePercent":"80.00","copayAmount":"20.00","deductibleAmount":"0.00","statusCode":"CODIGO_EJEMPLO","validityStatus":"CURRENT","effectiveFrom":"2026-07-31","effectiveTo":"2026-07-31"}],"planId":"00000000-0000-4000-8000-000000000001","coverageOrder":1}]` |
| `coverages[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `coverages[].carrierName` | Sí | `string` | Sin restricción adicional declarada | Aseguradora, en palabras | `Nombre de ejemplo` |
| `coverages[].planName` | No | `string` | Sin restricción adicional declarada | Plan contratado, en palabras | `Nombre de ejemplo` |
| `coverages[].isPublic` | Sí | `boolean` | Sin restricción adicional declarada | Si el seguro es público o privado | `true` |
| `coverages[].policyIdentifier` | No | `string` | Sin restricción adicional declarada | Número de póliza declarado | `valor-ejemplo` |
| `coverages[].memberIdentifier` | No | `string` | Sin restricción adicional declarada | Con qué documento figura afiliado | `valor-ejemplo` |
| `coverages[].verified` | Sí | `boolean` | Sin restricción adicional declarada | Si la plataforma confirmó la cobertura con la aseguradora | `true` |
| `coverages[].status` | No | `string` | Sin restricción adicional declarada | Estado legible de la cobertura | `ok` |
| `coverages[].statusCode` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `coverages[].validityStatus` | Sí | `string` | valores: `CURRENT`, `UPCOMING`, `EXPIRED`, `INACTIVE`, `UNKNOWN` | Sin descripción específica en el contrato OpenAPI. | `CURRENT` |
| `coverages[].referenceDate` | Sí | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `coverages[].effectiveFrom` | No | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `coverages[].effectiveTo` | No | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `coverages[].currencyCode` | No | `string` | Sin restricción adicional declarada | Código de moneda del plan | `BOB` |
| `coverages[].carrierWhatsappNumber` | No | `string` | Sin restricción adicional declarada | Canal oficial de WhatsApp de la aseguradora | `valor-ejemplo` |
| `coverages[].carrierCallCenterPhone` | No | `string` | Sin restricción adicional declarada | Call center oficial de la aseguradora | `+59170000000` |
| `coverages[].benefits` | Sí | `array<CoverageBenefitSummaryDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","categoryCode":"CODIGO_EJEMPLO","categoryName":"Nombre de ejemplo","serviceConceptId":"00000000-0000-4000-8000-000000000001","serviceName":"Nombre de ejemplo","coveragePercent":"80.00","copayAmount":"20.00","deductibleAmount":"0.00","statusCode":"CODIGO_EJEMPLO","validityStatus":"CURRENT","effectiveFrom":"2026-07-31","effectiveTo":"2026-07-31"}]` |
| `coverages[].benefits[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `coverages[].benefits[].categoryCode` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `coverages[].benefits[].categoryName` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `coverages[].benefits[].serviceConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `coverages[].benefits[].serviceName` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `coverages[].benefits[].coveragePercent` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `80.00` |
| `coverages[].benefits[].copayAmount` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `20.00` |
| `coverages[].benefits[].deductibleAmount` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `0.00` |
| `coverages[].benefits[].statusCode` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `coverages[].benefits[].validityStatus` | Sí | `string` | valores: `CURRENT`, `UPCOMING`, `EXPIRED`, `INACTIVE`, `UNKNOWN` | Sin descripción específica en el contrato OpenAPI. | `CURRENT` |
| `coverages[].benefits[].effectiveFrom` | No | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `coverages[].benefits[].effectiveTo` | No | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `coverages[].planId` | No | `string` | formato `uuid` | Plan de salud elegido | `00000000-0000-4000-8000-000000000001` |
| `coverages[].coverageOrder` | Sí | `number` | Sin restricción adicional declarada | Orden de la cobertura: 1 privada, 2 pública | `1` |
| `guardians` | Sí | `array<OwnGuardianDto>` | Sin restricción adicional declarada | Tutores y personas autorizadas, con su teléfono. | `[{"displayName":"Nombre de ejemplo","relationshipConceptId":"00000000-0000-4000-8000-000000000001","isEmergencyContact":true,"isLegalGuardian":true,"phone":"+59170000000"}]` |
| `guardians[].displayName` | No | `string` | Sin restricción adicional declarada | Cómo se llama | `Nombre de ejemplo` |
| `guardians[].relationshipConceptId` | No | `string` | formato `uuid` | Parentesco (concept id) | `00000000-0000-4000-8000-000000000001` |
| `guardians[].isEmergencyContact` | Sí | `boolean` | Sin restricción adicional declarada | Es a quien llamar en una urgencia | `true` |
| `guardians[].isLegalGuardian` | Sí | `boolean` | Sin restricción adicional declarada | Es su representante legal | `true` |
| `guardians[].phone` | No | `string` | Sin restricción adicional declarada | Su teléfono | `+59170000000` |

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
  "path": "/profiles/patients/me/photo"
}
```

---

## 11. PUT /profiles/patients/me/photo

- **Módulo:** `profiles`
- **Etiqueta OpenAPI:** `profiles-patients`
- **Nombre:** Fijar la propia foto de perfil
- **Operation ID:** `ProfilesPatientsController_setOwnPhoto`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ProfilesPatientsController.setOwnPhoto](../../src/modules/profiles/controllers/profiles-patients.controller.ts)

### Descripción de negocio

Fijar la propia foto de perfil. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Fijar la foto de perfil propia. Sin `@Roles` por lo mismo que el resto de `patients/me/*`: el sujeto lo resuelve el servidor desde la sesión y no hay parámetro que apunte a otro. `PUT` porque el resultado no depende de cuántas veces se pida: la persona queda con esa foto.

### Descripción del sistema

NestJS resuelve `PUT /profiles/patients/me/photo` en `ProfilesPatientsController_setOwnPhoto`. El controlador delega en `ProfilesPatientsService.setOwnPhoto`. Valida el body como `SetOwnPatientPhotoDto` y consume `application/json`. El tipo de retorno estático es `Promise<OwnPatientProfileResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `SetOwnPatientPhotoDto`; los campos opcionales se omiten.

```http
PUT /profiles/patients/me/photo HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "fileId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `fileId` | Sí | `string` | formato `uuid` | Identificador del archivo ya subido que será la foto | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PUT /profiles/patients/me/photo HTTP/1.1
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
| 200 | Operación completada correctamente. | `Promise<OwnPatientProfileResponseDto>` | No |
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
  "occupationConceptId": "00000000-0000-4000-8000-000000000001",
  "occupationFreeText": "valor-ejemplo",
  "workEmployerConceptId": "00000000-0000-4000-8000-000000000001",
  "workEmployerFreeText": "valor-ejemplo",
  "phone": "+59170000000",
  "residenceMunicipalityConceptId": "00000000-0000-4000-8000-000000000001",
  "identityVerified": true,
  "patientCode": "CODIGO_EJEMPLO",
  "nationalId": "00000000-0000-4000-8000-000000000001",
  "issuerAdministrativeAreaConceptId": "00000000-0000-4000-8000-000000000001",
  "taxId": "00000000-0000-4000-8000-000000000001",
  "taxHolderName": "Nombre de ejemplo",
  "email": "usuario@example.com",
  "photoFileId": "00000000-0000-4000-8000-000000000001",
  "homeAddress": {
    "lines": "valor-ejemplo",
    "city": "valor-ejemplo",
    "municipalityConceptId": "00000000-0000-4000-8000-000000000001",
    "latitude": 1,
    "longitude": 1
  },
  "workAddress": {
    "lines": "valor-ejemplo",
    "city": "valor-ejemplo",
    "municipalityConceptId": "00000000-0000-4000-8000-000000000001",
    "latitude": 1,
    "longitude": 1
  },
  "coverages": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "carrierName": "Nombre de ejemplo",
      "planName": "Nombre de ejemplo",
      "isPublic": true,
      "policyIdentifier": "valor-ejemplo",
      "memberIdentifier": "valor-ejemplo",
      "verified": true,
      "status": "ok",
      "statusCode": "CODIGO_EJEMPLO",
      "validityStatus": "CURRENT",
      "referenceDate": "2026-07-31",
      "effectiveFrom": "2026-07-31",
      "effectiveTo": "2026-07-31",
      "currencyCode": "BOB",
      "carrierWhatsappNumber": "valor-ejemplo",
      "carrierCallCenterPhone": "+59170000000",
      "benefits": [
        {
          "id": "00000000-0000-4000-8000-000000000001",
          "categoryCode": "CODIGO_EJEMPLO",
          "categoryName": "Nombre de ejemplo",
          "serviceConceptId": "00000000-0000-4000-8000-000000000001",
          "serviceName": "Nombre de ejemplo",
          "coveragePercent": "80.00",
          "copayAmount": "20.00",
          "deductibleAmount": "0.00",
          "statusCode": "CODIGO_EJEMPLO",
          "validityStatus": "CURRENT",
          "effectiveFrom": "2026-07-31",
          "effectiveTo": "2026-07-31"
        }
      ],
      "planId": "00000000-0000-4000-8000-000000000001",
      "coverageOrder": 1
    }
  ],
  "guardians": [
    {
      "displayName": "Nombre de ejemplo",
      "relationshipConceptId": "00000000-0000-4000-8000-000000000001",
      "isEmergencyContact": true,
      "isLegalGuardian": true,
      "phone": "+59170000000"
    }
  ]
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
| `occupationConceptId` | No | `string` | formato `uuid` | Ocupación elegida del catálogo (VS_BO_OCCUPATION) | `00000000-0000-4000-8000-000000000001` |
| `occupationFreeText` | No | `string` | Sin restricción adicional declarada | Ocupación declarada en texto libre | `valor-ejemplo` |
| `workEmployerConceptId` | No | `string` | formato `uuid` | Empresa donde trabaja, del catálogo (VS_BO_EMPLOYER) | `00000000-0000-4000-8000-000000000001` |
| `workEmployerFreeText` | No | `string` | Sin restricción adicional declarada | Empresa declarada en texto libre | `valor-ejemplo` |
| `phone` | No | `string` | Sin restricción adicional declarada | Teléfono de contacto vigente (`common.contact_points`) | `+59170000000` |
| `residenceMunicipalityConceptId` | No | `string` | formato `uuid` | Municipio del domicilio vigente (catálogo VS_BO_MUNICIPALITY). El departamento lo deriva el servidor. | `00000000-0000-4000-8000-000000000001` |
| `identityVerified` | Sí | `boolean` | Sin restricción adicional declarada | Si el titular tiene una aserción de identidad vigente. Con `false` el perfil llega sin `patientCode`. | `true` |
| `patientCode` | No | `string` | Sin restricción adicional declarada | Código de paciente. Sólo con identidad verificada: ausente mientras `identityVerified` sea `false`. | `CODIGO_EJEMPLO` |
| `nationalId` | No | `string` | Sin restricción adicional declarada | Documento de identidad. Es su usuario de acceso, así que no se edita desde acá. | `00000000-0000-4000-8000-000000000001` |
| `issuerAdministrativeAreaConceptId` | No | `string` | formato `uuid` | Departamento que emitió el documento (VS_BO_DEPARTMENT) | `00000000-0000-4000-8000-000000000001` |
| `taxId` | No | `string` | Sin restricción adicional declarada | NIT para facturación | `00000000-0000-4000-8000-000000000001` |
| `taxHolderName` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `email` | No | `string` | Sin restricción adicional declarada | Correo de contacto vigente | `usuario@example.com` |
| `photoFileId` | No | `string` | formato `uuid` | Foto de perfil (id de archivo en `common.files`) | `00000000-0000-4000-8000-000000000001` |
| `homeAddress` | No | `OwnAddressDto` | Sin restricción adicional declarada | Domicilio, con calle y punto en el mapa si los declaró | `{"lines":"valor-ejemplo","city":"valor-ejemplo","municipalityConceptId":"00000000-0000-4000-8000-000000000001","latitude":1,"longitude":1}` |
| `homeAddress.lines` | No | `string` | Sin restricción adicional declarada | Calle y número, tal como la escribió | `valor-ejemplo` |
| `homeAddress.city` | No | `string` | Sin restricción adicional declarada | Ciudad, derivada del municipio | `valor-ejemplo` |
| `homeAddress.municipalityConceptId` | No | `string` | formato `uuid` | Municipio (VS_BO_MUNICIPALITY) | `00000000-0000-4000-8000-000000000001` |
| `homeAddress.latitude` | No | `number` | Sin restricción adicional declarada | Latitud, si marcó el punto en el mapa | `1` |
| `homeAddress.longitude` | No | `number` | Sin restricción adicional declarada | Longitud; viaja siempre junto a la latitud | `1` |
| `workAddress` | No | `OwnAddressDto` | Sin restricción adicional declarada | Dirección de trabajo | `{"lines":"valor-ejemplo","city":"valor-ejemplo","municipalityConceptId":"00000000-0000-4000-8000-000000000001","latitude":1,"longitude":1}` |
| `workAddress.lines` | No | `string` | Sin restricción adicional declarada | Calle y número, tal como la escribió | `valor-ejemplo` |
| `workAddress.city` | No | `string` | Sin restricción adicional declarada | Ciudad, derivada del municipio | `valor-ejemplo` |
| `workAddress.municipalityConceptId` | No | `string` | formato `uuid` | Municipio (VS_BO_MUNICIPALITY) | `00000000-0000-4000-8000-000000000001` |
| `workAddress.latitude` | No | `number` | Sin restricción adicional declarada | Latitud, si marcó el punto en el mapa | `1` |
| `workAddress.longitude` | No | `number` | Sin restricción adicional declarada | Longitud; viaja siempre junto a la latitud | `1` |
| `coverages` | Sí | `array<OwnCoverageDto>` | Sin restricción adicional declarada | Seguros declarados. Vacío si no declaró ninguno. | `[{"id":"00000000-0000-4000-8000-000000000001","carrierName":"Nombre de ejemplo","planName":"Nombre de ejemplo","isPublic":true,"policyIdentifier":"valor-ejemplo","memberIdentifier":"valor-ejemplo","verified":true,"status":"ok","statusCode":"CODIGO_EJEMPLO","validityStatus":"CURRENT","referenceDate":"2026-07-31","effectiveFrom":"2026-07-31","effectiveTo":"2026-07-31","currencyCode":"BOB","carrierWhatsappNumber":"valor-ejemplo","carrierCallCenterPhone":"+59170000000","benefits":[{"id":"00000000-0000-4000-8000-000000000001","categoryCode":"CODIGO_EJEMPLO","categoryName":"Nombre de ejemplo","serviceConceptId":"00000000-0000-4000-8000-000000000001","serviceName":"Nombre de ejemplo","coveragePercent":"80.00","copayAmount":"20.00","deductibleAmount":"0.00","statusCode":"CODIGO_EJEMPLO","validityStatus":"CURRENT","effectiveFrom":"2026-07-31","effectiveTo":"2026-07-31"}],"planId":"00000000-0000-4000-8000-000000000001","coverageOrder":1}]` |
| `coverages[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `coverages[].carrierName` | Sí | `string` | Sin restricción adicional declarada | Aseguradora, en palabras | `Nombre de ejemplo` |
| `coverages[].planName` | No | `string` | Sin restricción adicional declarada | Plan contratado, en palabras | `Nombre de ejemplo` |
| `coverages[].isPublic` | Sí | `boolean` | Sin restricción adicional declarada | Si el seguro es público o privado | `true` |
| `coverages[].policyIdentifier` | No | `string` | Sin restricción adicional declarada | Número de póliza declarado | `valor-ejemplo` |
| `coverages[].memberIdentifier` | No | `string` | Sin restricción adicional declarada | Con qué documento figura afiliado | `valor-ejemplo` |
| `coverages[].verified` | Sí | `boolean` | Sin restricción adicional declarada | Si la plataforma confirmó la cobertura con la aseguradora | `true` |
| `coverages[].status` | No | `string` | Sin restricción adicional declarada | Estado legible de la cobertura | `ok` |
| `coverages[].statusCode` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `coverages[].validityStatus` | Sí | `string` | valores: `CURRENT`, `UPCOMING`, `EXPIRED`, `INACTIVE`, `UNKNOWN` | Sin descripción específica en el contrato OpenAPI. | `CURRENT` |
| `coverages[].referenceDate` | Sí | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `coverages[].effectiveFrom` | No | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `coverages[].effectiveTo` | No | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `coverages[].currencyCode` | No | `string` | Sin restricción adicional declarada | Código de moneda del plan | `BOB` |
| `coverages[].carrierWhatsappNumber` | No | `string` | Sin restricción adicional declarada | Canal oficial de WhatsApp de la aseguradora | `valor-ejemplo` |
| `coverages[].carrierCallCenterPhone` | No | `string` | Sin restricción adicional declarada | Call center oficial de la aseguradora | `+59170000000` |
| `coverages[].benefits` | Sí | `array<CoverageBenefitSummaryDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","categoryCode":"CODIGO_EJEMPLO","categoryName":"Nombre de ejemplo","serviceConceptId":"00000000-0000-4000-8000-000000000001","serviceName":"Nombre de ejemplo","coveragePercent":"80.00","copayAmount":"20.00","deductibleAmount":"0.00","statusCode":"CODIGO_EJEMPLO","validityStatus":"CURRENT","effectiveFrom":"2026-07-31","effectiveTo":"2026-07-31"}]` |
| `coverages[].benefits[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `coverages[].benefits[].categoryCode` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `coverages[].benefits[].categoryName` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `coverages[].benefits[].serviceConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `coverages[].benefits[].serviceName` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `coverages[].benefits[].coveragePercent` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `80.00` |
| `coverages[].benefits[].copayAmount` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `20.00` |
| `coverages[].benefits[].deductibleAmount` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `0.00` |
| `coverages[].benefits[].statusCode` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `coverages[].benefits[].validityStatus` | Sí | `string` | valores: `CURRENT`, `UPCOMING`, `EXPIRED`, `INACTIVE`, `UNKNOWN` | Sin descripción específica en el contrato OpenAPI. | `CURRENT` |
| `coverages[].benefits[].effectiveFrom` | No | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `coverages[].benefits[].effectiveTo` | No | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `coverages[].planId` | No | `string` | formato `uuid` | Plan de salud elegido | `00000000-0000-4000-8000-000000000001` |
| `coverages[].coverageOrder` | Sí | `number` | Sin restricción adicional declarada | Orden de la cobertura: 1 privada, 2 pública | `1` |
| `guardians` | Sí | `array<OwnGuardianDto>` | Sin restricción adicional declarada | Tutores y personas autorizadas, con su teléfono. | `[{"displayName":"Nombre de ejemplo","relationshipConceptId":"00000000-0000-4000-8000-000000000001","isEmergencyContact":true,"isLegalGuardian":true,"phone":"+59170000000"}]` |
| `guardians[].displayName` | No | `string` | Sin restricción adicional declarada | Cómo se llama | `Nombre de ejemplo` |
| `guardians[].relationshipConceptId` | No | `string` | formato `uuid` | Parentesco (concept id) | `00000000-0000-4000-8000-000000000001` |
| `guardians[].isEmergencyContact` | Sí | `boolean` | Sin restricción adicional declarada | Es a quien llamar en una urgencia | `true` |
| `guardians[].isLegalGuardian` | Sí | `boolean` | Sin restricción adicional declarada | Es su representante legal | `true` |
| `guardians[].phone` | No | `string` | Sin restricción adicional declarada | Su teléfono | `+59170000000` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | ${labels.subject} no le pertenece | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 404 | `NOT_FOUND` | Paciente no encontrado | Excepción explícita en src/modules/profiles/services/profiles-patients.service.ts |
| 404 | `NOT_FOUND` | labels.notFound | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La cuenta no tiene una persona vinculada | Excepción explícita en src/modules/profiles/services/profiles-patients.service.ts |
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
  "path": "/profiles/patients/me/photo"
}
```

---

## 12. GET /profiles/patients/me/summary

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

## 13. POST /profiles/patients/merge

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

## 14. GET /profiles/patients/merge-events

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

## 15. POST /profiles/patients/merge/{eventId}/reverse

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

## 16. POST /profiles/persons/{personId}/account-links

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

## 17. POST /profiles/persons/{personId}/decease

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

## 18. GET /profiles/practitioners

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
| `withoutSpecialty` | query | No | `string` | Sin restricción adicional declarada | true = sólo quienes no declaran ninguna especialidad vigente | `valor-ejemplo` |
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
GET /profiles/practitioners?specialtyConceptId=00000000-0000-4000-8000-000000000001&withoutSpecialty=valor-ejemplo&cursor=valor-ejemplo&limit=1 HTTP/1.1
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
      "verified": true,
      "acceptsNewPatients": true,
      "telehealthAvailable": true,
      "specialties": [
        {
          "specialtyConceptId": "00000000-0000-4000-8000-000000000001",
          "isPrimary": true
        }
      ],
      "workplaces": [
        "valor-ejemplo"
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
| `items` | Sí | `array<PractitionerListItemDto>` | Sin restricción adicional declarada | Las filas de esta página. | `[{"profileId":"00000000-0000-4000-8000-000000000001","practitionerCode":"CODIGO_EJEMPLO","displayName":"Nombre de ejemplo","professionalTitle":"valor-ejemplo","photoFileId":"00000000-0000-4000-8000-000000000001","verificationStatusConceptId":"00000000-0000-4000-8000-000000000001","verified":true,"acceptsNewPatients":true,"telehealthAvailable":true,"specialties":[{"specialtyConceptId":"00000000-0000-4000-8000-000000000001","isPrimary":true}],"workplaces":["valor-ejemplo"]}]` |
| `items[].profileId` | Sí | `string` | formato `uuid` | Con este id se abre la ficha (`GET /profiles/practitioners/:id/summary`). | `00000000-0000-4000-8000-000000000001` |
| `items[].practitionerCode` | Sí | `string` | Sin restricción adicional declarada | Código único del profesional | `CODIGO_EJEMPLO` |
| `items[].displayName` | No | `string` | Sin restricción adicional declarada | Nombre visible de la persona | `Nombre de ejemplo` |
| `items[].professionalTitle` | No | `string` | Sin restricción adicional declarada | Título profesional declarado. | `valor-ejemplo` |
| `items[].photoFileId` | No | `string` | formato `uuid` | Archivo de la foto | `00000000-0000-4000-8000-000000000001` |
| `items[].verificationStatusConceptId` | Sí | `string` | formato `uuid` | Estado de verificación de la matrícula. | `00000000-0000-4000-8000-000000000001` |
| `items[].verified` | Sí | `boolean` | Sin restricción adicional declarada | Si la matrícula fue verificada | `true` |
| `items[].acceptsNewPatients` | Sí | `boolean` | Sin restricción adicional declarada | Si declara tomar pacientes nuevos. | `true` |
| `items[].telehealthAvailable` | Sí | `boolean` | Sin restricción adicional declarada | Si atiende por telemedicina. | `true` |
| `items[].specialties` | Sí | `array<PractitionerListSpecialtyDto>` | Sin restricción adicional declarada | Sus especialidades, la principal primero. | `[{"specialtyConceptId":"00000000-0000-4000-8000-000000000001","isPrimary":true}]` |
| `items[].specialties[].specialtyConceptId` | Sí | `string` | formato `uuid` | Concept id de la especialidad | `00000000-0000-4000-8000-000000000001` |
| `items[].specialties[].isPrimary` | Sí | `boolean` | Sin restricción adicional declarada | Si es la especialidad con la que se presenta. | `true` |
| `items[].workplaces` | Sí | `array<string>` | Sin restricción adicional declarada | Dónde atiende, en texto | `["valor-ejemplo"]` |
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

## 19. POST /profiles/practitioners

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
  "practitionerCode": "CODIGO_EJEMPLO"
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
| `licenseNumber` | No | `string` | longitud mínima 1; longitud máxima 100 | Nº de licencia de la autorización jurisdiccional inicial | `valor-ejemplo` |
| `jurisdictionConceptId` | No | `string` | formato `uuid` | Concept id de jurisdicción de la licencia | `00000000-0000-4000-8000-000000000001` |
| `regulatoryAuthority` | No | `string` | longitud máxima 200 | Autoridad regulatoria emisora | `valor-ejemplo` |
| `credentialNumber` | No | `string` | longitud mínima 1; longitud máxima 100 | Nº de la credencial de soporte | `valor-ejemplo` |
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
| `licenseId` | No | `string` | formato `uuid` | La autorización creada — **ausente** si el alta no trajo matrícula, que es el caso de una ficha de directorio. | `00000000-0000-4000-8000-000000000001` |
| `credentialId` | No | `string` | formato `uuid` | La credencial creada. Ausente por el mismo motivo que `licenseId`. | `00000000-0000-4000-8000-000000000001` |
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

## 20. POST /profiles/practitioners/{profileId}/affiliations

- **Módulo:** `profiles`
- **Etiqueta OpenAPI:** `profiles-practitioners`
- **Nombre:** Registrar un consultorio de un profesional sin cuenta
- **Operation ID:** `ProfilesPractitionersController_addAffiliationFor`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ProfilesPractitionersController.addAffiliationFor](../../src/modules/profiles/controllers/profiles-practitioners.controller.ts)

### Descripción de negocio

Mismas reglas que el alta propia: no repite un vínculo ya declarado y respeta el estado inicial según la sede.

Contexto declarado en el controlador: Un consultorio de OTRO profesional — las fichas de directorio. Los profesionales que publican las redes de las aseguradoras no tienen cuenta —no traen correo— y por eso no pueden declarar dónde atienden. Sin esta ruta, un médico con tres consultorios se veía sin ninguno. Pide rol administrativo: escribir el historial laboral de alguien que no está mirando es otra cosa que escribir el propio.

### Descripción del sistema

NestJS resuelve `POST /profiles/practitioners/{profileId}/affiliations` en `ProfilesPractitionersController_addAffiliationFor`. El controlador delega en `ProfilesPractitionersService.addAffiliationFor`. Valida el body como `CreateAffiliationDto` y consume `application/json`. El tipo de retorno estático es `Promise<AffiliationResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `profileId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateAffiliationDto`; los campos opcionales se omiten.

```http
POST /profiles/practitioners/00000000-0000-4000-8000-000000000001/affiliations HTTP/1.1
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
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `profileId`.
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
POST /profiles/practitioners/00000000-0000-4000-8000-000000000001/affiliations HTTP/1.1
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
| 404 | Operación completada correctamente. | `Promise<AffiliationResponseDto>` | No |
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
| `roleTitle` | No | `string` | admite null | Cargo, cuando el vínculo lo declara. | `valor-ejemplo` |
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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Esta cuenta no tiene un perfil profesional asociado | Excepción explícita en src/modules/profiles/services/profile-ownership.service.ts |
| 404 | `NOT_FOUND` | Profesional no encontrado | Excepción explícita en src/modules/profiles/services/profiles-practitioners.service.ts |
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
  "path": "/profiles/practitioners/{profileId}/affiliations"
}
```

---

## 21. POST /profiles/practitioners/{profileId}/jurisdiction-authorizations

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

## 22. DELETE /profiles/practitioners/{profileId}/photo

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
  "workEmail": "usuario@example.com",
  "personalEmail": "usuario@example.com",
  "mobilePhone": "+59170000000",
  "workMobilePhone": "+59170000000",
  "workLandline": "valor-ejemplo",
  "name": "Nombre de ejemplo",
  "middleName": "Nombre de ejemplo",
  "lastName": "Nombre de ejemplo",
  "motherLastName": "Nombre de ejemplo",
  "birthDate": "2026-07-31",
  "nationalId": "00000000-0000-4000-8000-000000000001",
  "issuerAdministrativeAreaConceptId": "00000000-0000-4000-8000-000000000001",
  "residenceMunicipalityConceptId": "00000000-0000-4000-8000-000000000001",
  "homeAddress": {
    "lines": "valor-ejemplo",
    "city": "valor-ejemplo",
    "municipalityConceptId": "00000000-0000-4000-8000-000000000001",
    "latitude": 1,
    "longitude": 1
  },
  "occupationConceptId": "00000000-0000-4000-8000-000000000001",
  "occupationFreeText": "valor-ejemplo",
  "workEmployerConceptId": "00000000-0000-4000-8000-000000000001",
  "workEmployerFreeText": "valor-ejemplo",
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
| `workEmail` | No | `string` | Sin restricción adicional declarada | Sólo en la lectura propia | `usuario@example.com` |
| `personalEmail` | No | `string` | Sin restricción adicional declarada | Sólo en la lectura propia | `usuario@example.com` |
| `mobilePhone` | No | `string` | Sin restricción adicional declarada | Sólo en la lectura propia | `+59170000000` |
| `workMobilePhone` | No | `string` | Sin restricción adicional declarada | Sólo en la lectura propia | `+59170000000` |
| `workLandline` | No | `string` | Sin restricción adicional declarada | Sólo en la lectura propia | `valor-ejemplo` |
| `name` | No | `string` | Sin restricción adicional declarada | Las cuatro partes, para poder corregir el nombre sin adivinar dónde cortarlo. | `Nombre de ejemplo` |
| `middleName` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `lastName` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `motherLastName` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `birthDate` | No | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `nationalId` | No | `string` | Sin restricción adicional declarada | Documento de identidad. **No editable desde el perfil**: es un identificador oficial y tiene su propio circuito de verificación. | `00000000-0000-4000-8000-000000000001` |
| `issuerAdministrativeAreaConceptId` | No | `string` | formato `uuid` | Departamento emisor (VS_BO_DEPARTMENT) | `00000000-0000-4000-8000-000000000001` |
| `residenceMunicipalityConceptId` | No | `string` | formato `uuid` | Municipio de residencia (VS_BO_MUNICIPALITY) | `00000000-0000-4000-8000-000000000001` |
| `homeAddress` | No | `OwnAddressDto` | Sin restricción adicional declarada | El domicilio, si lo declaró (ALV-009). Ausente y no un objeto vacío cuando no hay fila vigente — mismo criterio que `OwnPatientProfile`. | `{"lines":"valor-ejemplo","city":"valor-ejemplo","municipalityConceptId":"00000000-0000-4000-8000-000000000001","latitude":1,"longitude":1}` |
| `homeAddress.lines` | No | `string` | Sin restricción adicional declarada | Calle y número, tal como la escribió | `valor-ejemplo` |
| `homeAddress.city` | No | `string` | Sin restricción adicional declarada | Ciudad, derivada del municipio | `valor-ejemplo` |
| `homeAddress.municipalityConceptId` | No | `string` | formato `uuid` | Municipio (VS_BO_MUNICIPALITY) | `00000000-0000-4000-8000-000000000001` |
| `homeAddress.latitude` | No | `number` | Sin restricción adicional declarada | Latitud, si marcó el punto en el mapa | `1` |
| `homeAddress.longitude` | No | `number` | Sin restricción adicional declarada | Longitud; viaja siempre junto a la latitud | `1` |
| `occupationConceptId` | No | `string` | formato `uuid` | Ocupación elegida del catálogo (VS_BO_OCCUPATION) | `00000000-0000-4000-8000-000000000001` |
| `occupationFreeText` | No | `string` | Sin restricción adicional declarada | Ocupación declarada en texto libre | `valor-ejemplo` |
| `workEmployerConceptId` | No | `string` | formato `uuid` | Empresa donde trabaja, del catálogo (VS_BO_EMPLOYER) | `00000000-0000-4000-8000-000000000001` |
| `workEmployerFreeText` | No | `string` | Sin restricción adicional declarada | Empresa declarada en texto libre | `valor-ejemplo` |
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
| `affiliations` | Sí | `array<AffiliationResponseDto>` | Sin restricción adicional declarada | Historial laboral (UC-05-16): trayectoria, no PHI. Se devuelve un único array de la más reciente a la más antigua, con `current` ya derivado en cada fila — pantalla la agrupa en fases (formación/histórico/actual), la lectura no necesita decidir eso. | `[{"id":"00000000-0000-4000-8000-000000000001","practitionerProfileId":"00000000-0000-4000-8000-000000000001","organizationName":"Nombre de ejemplo","roleTitle":"valor-ejemplo","practiceSiteId":"00000000-0000-4000-8000-000000000001","affiliationTypeConceptId":"00000000-0000-4000-8000-000000000001","startDate":"2026-07-31","endDate":"2026-07-31","current":true,"status":"00000000-0000-4000-8000-000000000001","statusKind":{},"decisionReasonText":"Texto descriptivo de ejemplo","createdAt":"2026-07-31T12:00:00.000Z"}]` |
| `affiliations[].id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `affiliations[].practitionerProfileId` | Sí | `string` | formato `uuid` | Identificador asociado a practitioner profile. | `00000000-0000-4000-8000-000000000001` |
| `affiliations[].organizationName` | Sí | `string` | Sin restricción adicional declarada | Institución. | `Nombre de ejemplo` |
| `affiliations[].roleTitle` | No | `string` | admite null | Cargo, cuando el vínculo lo declara. | `valor-ejemplo` |
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

## 23. PUT /profiles/practitioners/{profileId}/photo

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
  "workEmail": "usuario@example.com",
  "personalEmail": "usuario@example.com",
  "mobilePhone": "+59170000000",
  "workMobilePhone": "+59170000000",
  "workLandline": "valor-ejemplo",
  "name": "Nombre de ejemplo",
  "middleName": "Nombre de ejemplo",
  "lastName": "Nombre de ejemplo",
  "motherLastName": "Nombre de ejemplo",
  "birthDate": "2026-07-31",
  "nationalId": "00000000-0000-4000-8000-000000000001",
  "issuerAdministrativeAreaConceptId": "00000000-0000-4000-8000-000000000001",
  "residenceMunicipalityConceptId": "00000000-0000-4000-8000-000000000001",
  "homeAddress": {
    "lines": "valor-ejemplo",
    "city": "valor-ejemplo",
    "municipalityConceptId": "00000000-0000-4000-8000-000000000001",
    "latitude": 1,
    "longitude": 1
  },
  "occupationConceptId": "00000000-0000-4000-8000-000000000001",
  "occupationFreeText": "valor-ejemplo",
  "workEmployerConceptId": "00000000-0000-4000-8000-000000000001",
  "workEmployerFreeText": "valor-ejemplo",
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
| `workEmail` | No | `string` | Sin restricción adicional declarada | Sólo en la lectura propia | `usuario@example.com` |
| `personalEmail` | No | `string` | Sin restricción adicional declarada | Sólo en la lectura propia | `usuario@example.com` |
| `mobilePhone` | No | `string` | Sin restricción adicional declarada | Sólo en la lectura propia | `+59170000000` |
| `workMobilePhone` | No | `string` | Sin restricción adicional declarada | Sólo en la lectura propia | `+59170000000` |
| `workLandline` | No | `string` | Sin restricción adicional declarada | Sólo en la lectura propia | `valor-ejemplo` |
| `name` | No | `string` | Sin restricción adicional declarada | Las cuatro partes, para poder corregir el nombre sin adivinar dónde cortarlo. | `Nombre de ejemplo` |
| `middleName` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `lastName` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `motherLastName` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `birthDate` | No | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `nationalId` | No | `string` | Sin restricción adicional declarada | Documento de identidad. **No editable desde el perfil**: es un identificador oficial y tiene su propio circuito de verificación. | `00000000-0000-4000-8000-000000000001` |
| `issuerAdministrativeAreaConceptId` | No | `string` | formato `uuid` | Departamento emisor (VS_BO_DEPARTMENT) | `00000000-0000-4000-8000-000000000001` |
| `residenceMunicipalityConceptId` | No | `string` | formato `uuid` | Municipio de residencia (VS_BO_MUNICIPALITY) | `00000000-0000-4000-8000-000000000001` |
| `homeAddress` | No | `OwnAddressDto` | Sin restricción adicional declarada | El domicilio, si lo declaró (ALV-009). Ausente y no un objeto vacío cuando no hay fila vigente — mismo criterio que `OwnPatientProfile`. | `{"lines":"valor-ejemplo","city":"valor-ejemplo","municipalityConceptId":"00000000-0000-4000-8000-000000000001","latitude":1,"longitude":1}` |
| `homeAddress.lines` | No | `string` | Sin restricción adicional declarada | Calle y número, tal como la escribió | `valor-ejemplo` |
| `homeAddress.city` | No | `string` | Sin restricción adicional declarada | Ciudad, derivada del municipio | `valor-ejemplo` |
| `homeAddress.municipalityConceptId` | No | `string` | formato `uuid` | Municipio (VS_BO_MUNICIPALITY) | `00000000-0000-4000-8000-000000000001` |
| `homeAddress.latitude` | No | `number` | Sin restricción adicional declarada | Latitud, si marcó el punto en el mapa | `1` |
| `homeAddress.longitude` | No | `number` | Sin restricción adicional declarada | Longitud; viaja siempre junto a la latitud | `1` |
| `occupationConceptId` | No | `string` | formato `uuid` | Ocupación elegida del catálogo (VS_BO_OCCUPATION) | `00000000-0000-4000-8000-000000000001` |
| `occupationFreeText` | No | `string` | Sin restricción adicional declarada | Ocupación declarada en texto libre | `valor-ejemplo` |
| `workEmployerConceptId` | No | `string` | formato `uuid` | Empresa donde trabaja, del catálogo (VS_BO_EMPLOYER) | `00000000-0000-4000-8000-000000000001` |
| `workEmployerFreeText` | No | `string` | Sin restricción adicional declarada | Empresa declarada en texto libre | `valor-ejemplo` |
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
| `affiliations` | Sí | `array<AffiliationResponseDto>` | Sin restricción adicional declarada | Historial laboral (UC-05-16): trayectoria, no PHI. Se devuelve un único array de la más reciente a la más antigua, con `current` ya derivado en cada fila — pantalla la agrupa en fases (formación/histórico/actual), la lectura no necesita decidir eso. | `[{"id":"00000000-0000-4000-8000-000000000001","practitionerProfileId":"00000000-0000-4000-8000-000000000001","organizationName":"Nombre de ejemplo","roleTitle":"valor-ejemplo","practiceSiteId":"00000000-0000-4000-8000-000000000001","affiliationTypeConceptId":"00000000-0000-4000-8000-000000000001","startDate":"2026-07-31","endDate":"2026-07-31","current":true,"status":"00000000-0000-4000-8000-000000000001","statusKind":{},"decisionReasonText":"Texto descriptivo de ejemplo","createdAt":"2026-07-31T12:00:00.000Z"}]` |
| `affiliations[].id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `affiliations[].practitionerProfileId` | Sí | `string` | formato `uuid` | Identificador asociado a practitioner profile. | `00000000-0000-4000-8000-000000000001` |
| `affiliations[].organizationName` | Sí | `string` | Sin restricción adicional declarada | Institución. | `Nombre de ejemplo` |
| `affiliations[].roleTitle` | No | `string` | admite null | Cargo, cuando el vínculo lo declara. | `valor-ejemplo` |
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

## 24. POST /profiles/practitioners/{profileId}/specialties

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

## 25. GET /profiles/practitioners/{profileId}/summary

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
  "workEmail": "usuario@example.com",
  "personalEmail": "usuario@example.com",
  "mobilePhone": "+59170000000",
  "workMobilePhone": "+59170000000",
  "workLandline": "valor-ejemplo",
  "name": "Nombre de ejemplo",
  "middleName": "Nombre de ejemplo",
  "lastName": "Nombre de ejemplo",
  "motherLastName": "Nombre de ejemplo",
  "birthDate": "2026-07-31",
  "nationalId": "00000000-0000-4000-8000-000000000001",
  "issuerAdministrativeAreaConceptId": "00000000-0000-4000-8000-000000000001",
  "residenceMunicipalityConceptId": "00000000-0000-4000-8000-000000000001",
  "homeAddress": {
    "lines": "valor-ejemplo",
    "city": "valor-ejemplo",
    "municipalityConceptId": "00000000-0000-4000-8000-000000000001",
    "latitude": 1,
    "longitude": 1
  },
  "occupationConceptId": "00000000-0000-4000-8000-000000000001",
  "occupationFreeText": "valor-ejemplo",
  "workEmployerConceptId": "00000000-0000-4000-8000-000000000001",
  "workEmployerFreeText": "valor-ejemplo",
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
| `workEmail` | No | `string` | Sin restricción adicional declarada | Sólo en la lectura propia | `usuario@example.com` |
| `personalEmail` | No | `string` | Sin restricción adicional declarada | Sólo en la lectura propia | `usuario@example.com` |
| `mobilePhone` | No | `string` | Sin restricción adicional declarada | Sólo en la lectura propia | `+59170000000` |
| `workMobilePhone` | No | `string` | Sin restricción adicional declarada | Sólo en la lectura propia | `+59170000000` |
| `workLandline` | No | `string` | Sin restricción adicional declarada | Sólo en la lectura propia | `valor-ejemplo` |
| `name` | No | `string` | Sin restricción adicional declarada | Las cuatro partes, para poder corregir el nombre sin adivinar dónde cortarlo. | `Nombre de ejemplo` |
| `middleName` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `lastName` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `motherLastName` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `birthDate` | No | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `nationalId` | No | `string` | Sin restricción adicional declarada | Documento de identidad. **No editable desde el perfil**: es un identificador oficial y tiene su propio circuito de verificación. | `00000000-0000-4000-8000-000000000001` |
| `issuerAdministrativeAreaConceptId` | No | `string` | formato `uuid` | Departamento emisor (VS_BO_DEPARTMENT) | `00000000-0000-4000-8000-000000000001` |
| `residenceMunicipalityConceptId` | No | `string` | formato `uuid` | Municipio de residencia (VS_BO_MUNICIPALITY) | `00000000-0000-4000-8000-000000000001` |
| `homeAddress` | No | `OwnAddressDto` | Sin restricción adicional declarada | El domicilio, si lo declaró (ALV-009). Ausente y no un objeto vacío cuando no hay fila vigente — mismo criterio que `OwnPatientProfile`. | `{"lines":"valor-ejemplo","city":"valor-ejemplo","municipalityConceptId":"00000000-0000-4000-8000-000000000001","latitude":1,"longitude":1}` |
| `homeAddress.lines` | No | `string` | Sin restricción adicional declarada | Calle y número, tal como la escribió | `valor-ejemplo` |
| `homeAddress.city` | No | `string` | Sin restricción adicional declarada | Ciudad, derivada del municipio | `valor-ejemplo` |
| `homeAddress.municipalityConceptId` | No | `string` | formato `uuid` | Municipio (VS_BO_MUNICIPALITY) | `00000000-0000-4000-8000-000000000001` |
| `homeAddress.latitude` | No | `number` | Sin restricción adicional declarada | Latitud, si marcó el punto en el mapa | `1` |
| `homeAddress.longitude` | No | `number` | Sin restricción adicional declarada | Longitud; viaja siempre junto a la latitud | `1` |
| `occupationConceptId` | No | `string` | formato `uuid` | Ocupación elegida del catálogo (VS_BO_OCCUPATION) | `00000000-0000-4000-8000-000000000001` |
| `occupationFreeText` | No | `string` | Sin restricción adicional declarada | Ocupación declarada en texto libre | `valor-ejemplo` |
| `workEmployerConceptId` | No | `string` | formato `uuid` | Empresa donde trabaja, del catálogo (VS_BO_EMPLOYER) | `00000000-0000-4000-8000-000000000001` |
| `workEmployerFreeText` | No | `string` | Sin restricción adicional declarada | Empresa declarada en texto libre | `valor-ejemplo` |
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
| `affiliations` | Sí | `array<AffiliationResponseDto>` | Sin restricción adicional declarada | Historial laboral (UC-05-16): trayectoria, no PHI. Se devuelve un único array de la más reciente a la más antigua, con `current` ya derivado en cada fila — pantalla la agrupa en fases (formación/histórico/actual), la lectura no necesita decidir eso. | `[{"id":"00000000-0000-4000-8000-000000000001","practitionerProfileId":"00000000-0000-4000-8000-000000000001","organizationName":"Nombre de ejemplo","roleTitle":"valor-ejemplo","practiceSiteId":"00000000-0000-4000-8000-000000000001","affiliationTypeConceptId":"00000000-0000-4000-8000-000000000001","startDate":"2026-07-31","endDate":"2026-07-31","current":true,"status":"00000000-0000-4000-8000-000000000001","statusKind":{},"decisionReasonText":"Texto descriptivo de ejemplo","createdAt":"2026-07-31T12:00:00.000Z"}]` |
| `affiliations[].id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `affiliations[].practitionerProfileId` | Sí | `string` | formato `uuid` | Identificador asociado a practitioner profile. | `00000000-0000-4000-8000-000000000001` |
| `affiliations[].organizationName` | Sí | `string` | Sin restricción adicional declarada | Institución. | `Nombre de ejemplo` |
| `affiliations[].roleTitle` | No | `string` | admite null | Cargo, cuando el vínculo lo declara. | `valor-ejemplo` |
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

## 26. PATCH /profiles/practitioners/me

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
| `name` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `middleName` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `lastName` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `motherLastName` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `birthDate` | No | `object` | formato `date`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `phone` | No | `string` | longitud máxima 40; patrón runtime `PATRON_TELEFONO` | Forma anterior de declarar el teléfono. Preferí workMobilePhone. | `+59170000000` |
| `personalEmail` | No | `string` | formato `email`; longitud máxima 320 | Sin descripción específica en el contrato OpenAPI. | `usuario@example.com` |
| `mobilePhone` | No | `string` | longitud máxima 40; patrón runtime `PATRON_TELEFONO` | Sin descripción específica en el contrato OpenAPI. | `+59170000000` |
| `workMobilePhone` | No | `string` | longitud máxima 40; patrón runtime `PATRON_TELEFONO` | Sin descripción específica en el contrato OpenAPI. | `+59170000000` |
| `workLandline` | No | `string` | longitud máxima 40; patrón runtime `PATRON_TELEFONO` | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `residenceMunicipalityConceptId` | No | `string` | formato `uuid` | Municipio de residencia (VS_BO_MUNICIPALITY) | `00000000-0000-4000-8000-000000000001` |
| `homeAddressLines` | No | `string` | longitud máxima 300 | Domicilio, tal como lo escribe la persona. Vacío para quitarlo. | `valor-ejemplo` |
| `homeLatitude` | No | `object` | mínimo -90; máximo 90 | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `homeLongitude` | No | `object` | mínimo -180; máximo 180 | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `occupationConceptId` | No | `string` | formato `uuid` | Ocupación del catálogo (VS_BO_OCCUPATION). Cadena vacía para borrarla. Si viene, el texto libre se descarta. | `00000000-0000-4000-8000-000000000001` |
| `occupationFreeText` | No | `string` | longitud máxima 200 | Ocupación en texto libre, para cuando no está en el catálogo. Cadena vacía para borrarla. | `valor-ejemplo` |
| `workEmployerConceptId` | No | `string` | formato `uuid` | Empresa donde trabaja (VS_BO_EMPLOYER). Cadena vacía para borrarla. Si viene, el texto libre se descarta. | `00000000-0000-4000-8000-000000000001` |
| `workEmployerFreeText` | No | `string` | longitud máxima 200 | Empresa en texto libre. Cadena vacía para borrarla. Se descarta si viene el concepto. | `valor-ejemplo` |

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
  "telehealthAvailable": true,
  "name": "Nombre de ejemplo",
  "middleName": "Nombre de ejemplo",
  "lastName": "Nombre de ejemplo",
  "motherLastName": "Nombre de ejemplo",
  "birthDate": {},
  "phone": "+59170000000",
  "personalEmail": "usuario@example.com",
  "mobilePhone": "+59170000000",
  "workMobilePhone": "+59170000000",
  "workLandline": "valor-ejemplo",
  "residenceMunicipalityConceptId": "00000000-0000-4000-8000-000000000001",
  "homeAddressLines": "valor-ejemplo",
  "homeLatitude": {},
  "homeLongitude": {},
  "occupationConceptId": "00000000-0000-4000-8000-000000000001",
  "occupationFreeText": "valor-ejemplo",
  "workEmployerConceptId": "00000000-0000-4000-8000-000000000001",
  "workEmployerFreeText": "valor-ejemplo"
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
  "workEmail": "usuario@example.com",
  "personalEmail": "usuario@example.com",
  "mobilePhone": "+59170000000",
  "workMobilePhone": "+59170000000",
  "workLandline": "valor-ejemplo",
  "name": "Nombre de ejemplo",
  "middleName": "Nombre de ejemplo",
  "lastName": "Nombre de ejemplo",
  "motherLastName": "Nombre de ejemplo",
  "birthDate": "2026-07-31",
  "nationalId": "00000000-0000-4000-8000-000000000001",
  "issuerAdministrativeAreaConceptId": "00000000-0000-4000-8000-000000000001",
  "residenceMunicipalityConceptId": "00000000-0000-4000-8000-000000000001",
  "homeAddress": {
    "lines": "valor-ejemplo",
    "city": "valor-ejemplo",
    "municipalityConceptId": "00000000-0000-4000-8000-000000000001",
    "latitude": 1,
    "longitude": 1
  },
  "occupationConceptId": "00000000-0000-4000-8000-000000000001",
  "occupationFreeText": "valor-ejemplo",
  "workEmployerConceptId": "00000000-0000-4000-8000-000000000001",
  "workEmployerFreeText": "valor-ejemplo",
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
| `workEmail` | No | `string` | Sin restricción adicional declarada | Sólo en la lectura propia | `usuario@example.com` |
| `personalEmail` | No | `string` | Sin restricción adicional declarada | Sólo en la lectura propia | `usuario@example.com` |
| `mobilePhone` | No | `string` | Sin restricción adicional declarada | Sólo en la lectura propia | `+59170000000` |
| `workMobilePhone` | No | `string` | Sin restricción adicional declarada | Sólo en la lectura propia | `+59170000000` |
| `workLandline` | No | `string` | Sin restricción adicional declarada | Sólo en la lectura propia | `valor-ejemplo` |
| `name` | No | `string` | Sin restricción adicional declarada | Las cuatro partes, para poder corregir el nombre sin adivinar dónde cortarlo. | `Nombre de ejemplo` |
| `middleName` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `lastName` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `motherLastName` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `birthDate` | No | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `nationalId` | No | `string` | Sin restricción adicional declarada | Documento de identidad. **No editable desde el perfil**: es un identificador oficial y tiene su propio circuito de verificación. | `00000000-0000-4000-8000-000000000001` |
| `issuerAdministrativeAreaConceptId` | No | `string` | formato `uuid` | Departamento emisor (VS_BO_DEPARTMENT) | `00000000-0000-4000-8000-000000000001` |
| `residenceMunicipalityConceptId` | No | `string` | formato `uuid` | Municipio de residencia (VS_BO_MUNICIPALITY) | `00000000-0000-4000-8000-000000000001` |
| `homeAddress` | No | `OwnAddressDto` | Sin restricción adicional declarada | El domicilio, si lo declaró (ALV-009). Ausente y no un objeto vacío cuando no hay fila vigente — mismo criterio que `OwnPatientProfile`. | `{"lines":"valor-ejemplo","city":"valor-ejemplo","municipalityConceptId":"00000000-0000-4000-8000-000000000001","latitude":1,"longitude":1}` |
| `homeAddress.lines` | No | `string` | Sin restricción adicional declarada | Calle y número, tal como la escribió | `valor-ejemplo` |
| `homeAddress.city` | No | `string` | Sin restricción adicional declarada | Ciudad, derivada del municipio | `valor-ejemplo` |
| `homeAddress.municipalityConceptId` | No | `string` | formato `uuid` | Municipio (VS_BO_MUNICIPALITY) | `00000000-0000-4000-8000-000000000001` |
| `homeAddress.latitude` | No | `number` | Sin restricción adicional declarada | Latitud, si marcó el punto en el mapa | `1` |
| `homeAddress.longitude` | No | `number` | Sin restricción adicional declarada | Longitud; viaja siempre junto a la latitud | `1` |
| `occupationConceptId` | No | `string` | formato `uuid` | Ocupación elegida del catálogo (VS_BO_OCCUPATION) | `00000000-0000-4000-8000-000000000001` |
| `occupationFreeText` | No | `string` | Sin restricción adicional declarada | Ocupación declarada en texto libre | `valor-ejemplo` |
| `workEmployerConceptId` | No | `string` | formato `uuid` | Empresa donde trabaja, del catálogo (VS_BO_EMPLOYER) | `00000000-0000-4000-8000-000000000001` |
| `workEmployerFreeText` | No | `string` | Sin restricción adicional declarada | Empresa declarada en texto libre | `valor-ejemplo` |
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
| `affiliations` | Sí | `array<AffiliationResponseDto>` | Sin restricción adicional declarada | Historial laboral (UC-05-16): trayectoria, no PHI. Se devuelve un único array de la más reciente a la más antigua, con `current` ya derivado en cada fila — pantalla la agrupa en fases (formación/histórico/actual), la lectura no necesita decidir eso. | `[{"id":"00000000-0000-4000-8000-000000000001","practitionerProfileId":"00000000-0000-4000-8000-000000000001","organizationName":"Nombre de ejemplo","roleTitle":"valor-ejemplo","practiceSiteId":"00000000-0000-4000-8000-000000000001","affiliationTypeConceptId":"00000000-0000-4000-8000-000000000001","startDate":"2026-07-31","endDate":"2026-07-31","current":true,"status":"00000000-0000-4000-8000-000000000001","statusKind":{},"decisionReasonText":"Texto descriptivo de ejemplo","createdAt":"2026-07-31T12:00:00.000Z"}]` |
| `affiliations[].id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `affiliations[].practitionerProfileId` | Sí | `string` | formato `uuid` | Identificador asociado a practitioner profile. | `00000000-0000-4000-8000-000000000001` |
| `affiliations[].organizationName` | Sí | `string` | Sin restricción adicional declarada | Institución. | `Nombre de ejemplo` |
| `affiliations[].roleTitle` | No | `string` | admite null | Cargo, cuando el vínculo lo declara. | `valor-ejemplo` |
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

## 27. GET /profiles/practitioners/me/affiliations

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
| `items` | Sí | `array<AffiliationResponseDto>` | Sin restricción adicional declarada | Las afiliaciones, de la más reciente a la más antigua. | `[{"id":"00000000-0000-4000-8000-000000000001","practitionerProfileId":"00000000-0000-4000-8000-000000000001","organizationName":"Nombre de ejemplo","roleTitle":"valor-ejemplo","practiceSiteId":"00000000-0000-4000-8000-000000000001","affiliationTypeConceptId":"00000000-0000-4000-8000-000000000001","startDate":"2026-07-31","endDate":"2026-07-31","current":true,"status":"00000000-0000-4000-8000-000000000001","statusKind":{},"decisionReasonText":"Texto descriptivo de ejemplo","createdAt":"2026-07-31T12:00:00.000Z"}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `items[].practitionerProfileId` | Sí | `string` | formato `uuid` | Identificador asociado a practitioner profile. | `00000000-0000-4000-8000-000000000001` |
| `items[].organizationName` | Sí | `string` | Sin restricción adicional declarada | Institución. | `Nombre de ejemplo` |
| `items[].roleTitle` | No | `string` | admite null | Cargo, cuando el vínculo lo declara. | `valor-ejemplo` |
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

## 28. POST /profiles/practitioners/me/affiliations

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
| `roleTitle` | No | `string` | admite null | Cargo, cuando el vínculo lo declara. | `valor-ejemplo` |
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
| 404 | `NOT_FOUND` | Profesional no encontrado | Excepción explícita en src/modules/profiles/services/profiles-practitioners.service.ts |
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

## 29. DELETE /profiles/practitioners/me/affiliations/{affiliationId}

- **Módulo:** `profiles`
- **Etiqueta OpenAPI:** `profiles-practitioners`
- **Nombre:** Quitar una afiliación del historial laboral propio
- **Operation ID:** `ProfilesPractitionersController_removeOwnAffiliation`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ProfilesPractitionersController.removeOwnAffiliation](../../src/modules/profiles/controllers/profiles-practitioners.controller.ts)

### Descripción de negocio

Borrado físico de una línea de currículum del titular. `404` si no existe o es de otro profesional.

Contexto declarado en el controlador: UC-05-16·B: quitar una línea del historial propio.

### Descripción del sistema

NestJS resuelve `DELETE /profiles/practitioners/me/affiliations/{affiliationId}` en `ProfilesPractitionersController_removeOwnAffiliation`. El controlador delega en `ProfilesPractitionersService.removeOwnAffiliation`. No recibe body. El tipo de retorno estático es `Promise<void>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `affiliationId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
DELETE /profiles/practitioners/me/affiliations/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `affiliationId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
DELETE /profiles/practitioners/me/affiliations/00000000-0000-4000-8000-000000000001 HTTP/1.1
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
| 403 | `FORBIDDEN` | Esta cuenta no tiene un perfil profesional asociado | Excepción explícita en src/modules/profiles/services/profile-ownership.service.ts |
| 404 | `NOT_FOUND` | Afiliación no encontrada | Excepción explícita en src/modules/profiles/services/profiles-practitioners.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/profiles/practitioners/me/affiliations/{affiliationId}"
}
```

---

## 30. PATCH /profiles/practitioners/me/affiliations/{affiliationId}

- **Módulo:** `profiles`
- **Etiqueta OpenAPI:** `profiles-practitioners`
- **Nombre:** Corregir una afiliación del historial laboral propio
- **Operation ID:** `ProfilesPractitionersController_updateOwnAffiliation`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ProfilesPractitionersController.updateOwnAffiliation](../../src/modules/profiles/controllers/profiles-practitioners.controller.ts)

### Descripción de negocio

Sólo el titular edita su historial; la sede no se cambia desde acá. `409` si la corrección la vuelve idéntica a otra línea; `422` si el fin queda antes del inicio.

Contexto declarado en el controlador: UC-05-16·E: corregir una línea del historial propio. El sujeto sigue saliendo de la sesión: el id de una afiliación ajena responde `404`, igual que uno inexistente.

### Descripción del sistema

NestJS resuelve `PATCH /profiles/practitioners/me/affiliations/{affiliationId}` en `ProfilesPractitionersController_updateOwnAffiliation`. El controlador delega en `ProfilesPractitionersService.updateOwnAffiliation`. Valida el body como `UpdateAffiliationDto` y consume `application/json`. El tipo de retorno estático es `Promise<AffiliationResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `affiliationId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `UpdateAffiliationDto`; los campos opcionales se omiten.

```http
PATCH /profiles/practitioners/me/affiliations/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `affiliationId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `organizationName` | No | `string` | Sin restricción adicional declarada | Hospital o entidad médica, tal como la declara el profesional | `Hospital Obrero N.º 1` |
| `roleTitle` | No | `string` | Sin restricción adicional declarada | Cargo ejercido, cuando aplica | `Médico de planta` |
| `affiliationTypeConceptId` | No | `string` | formato `uuid` | Tipo de vínculo laboral (concept id) | `00000000-0000-4000-8000-000000000001` |
| `startDate` | No | `string` | formato `date` | Inicio del vínculo | `2026-07-31` |
| `endDate` | No | `object` | formato `date`; admite null | Fin del vínculo. `null` lo vuelve vigente; omitido, se conserva | `{}` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PATCH /profiles/practitioners/me/affiliations/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "organizationName": "Hospital Obrero N.º 1",
  "roleTitle": "Médico de planta",
  "affiliationTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "startDate": "2026-07-31",
  "endDate": {}
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<AffiliationResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<AffiliationResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AffiliationResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AffiliationResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<AffiliationResponseDto>` | No |
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
| `roleTitle` | No | `string` | admite null | Cargo, cuando el vínculo lo declara. | `valor-ejemplo` |
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
| 404 | `NOT_FOUND` | Afiliación no encontrada | Excepción explícita en src/modules/profiles/services/profiles-practitioners.service.ts |
| 409 | `CONFLICT` | Ese vínculo ya está en el historial laboral | Excepción explícita en src/modules/profiles/services/profiles-practitioners.service.ts |
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
  "path": "/profiles/practitioners/me/affiliations/{affiliationId}"
}
```

---

## 31. POST /profiles/practitioners/me/credentials

- **Módulo:** `profiles`
- **Etiqueta OpenAPI:** `profiles-practitioners`
- **Nombre:** Agregar un título propio (diplomado, maestría, doctorado…)
- **Operation ID:** `ProfilesPractitionersController_addOwnCredential`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ProfilesPractitionersController.addOwnCredential](../../src/modules/profiles/controllers/profiles-practitioners.controller.ts)

### Descripción de negocio

Cada llamada agrega uno: el registro de procesos pide poder cargar varios de cada clase. Nace pendiente de verificación y admite el PDF o la foto del diploma, ya subido por POST /common/files/upload.

Contexto declarado en el controlador: Los títulos propios, uno por llamada. Va bajo `practitioners/me` y no bajo `practitioners/:profileId` porque el sujeto sale de la sesión: así no existe la forma de escribir la formación de otro profesional, ni siquiera equivocándose de id.

### Descripción del sistema

NestJS resuelve `POST /profiles/practitioners/me/credentials` en `ProfilesPractitionersController_addOwnCredential`. El controlador delega en `ProfilesPractitionersService.addOwnCredential`. Valida el body como `AddOwnCredentialDto` y consume `application/json`. El tipo de retorno estático es `Promise<OwnCredentialResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `AddOwnCredentialDto`; los campos opcionales se omiten.

```http
POST /profiles/practitioners/me/credentials HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "credentialTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "number": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `credentialTypeConceptId` | Sí | `string` | formato `uuid` | Concept id del tipo de credencial (título universitario, diplomado, maestría, doctorado o título de especialidad) | `00000000-0000-4000-8000-000000000001` |
| `number` | Sí | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `issuingInstitutionText` | No | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `issueDate` | No | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `fileId` | No | `string` | formato `uuid` | Archivo del diploma (debe haberlo subido el mismo usuario) | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /profiles/practitioners/me/credentials HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "credentialTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "number": "valor-ejemplo",
  "issuingInstitutionText": "valor-ejemplo",
  "issueDate": "2026-07-31",
  "fileId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<OwnCredentialResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<OwnCredentialResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<OwnCredentialResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<OwnCredentialResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<OwnCredentialResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<OwnCredentialResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<OwnCredentialResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<OwnCredentialResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<OwnCredentialResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `OwnCredentialResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "credentialTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "number": "valor-ejemplo",
  "issuingInstitutionText": "valor-ejemplo",
  "issueDate": "2026-07-31",
  "stateConceptId": "00000000-0000-4000-8000-000000000001",
  "fileId": "00000000-0000-4000-8000-000000000001",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `credentialTypeConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `number` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `issuingInstitutionText` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `issueDate` | No | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `stateConceptId` | Sí | `string` | formato `uuid` | `CRED_PENDING` recién creada: declararla no es haberla verificado. | `00000000-0000-4000-8000-000000000001` |
| `fileId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Esta cuenta no tiene un perfil profesional asociado | Excepción explícita en src/modules/profiles/services/profile-ownership.service.ts |
| 403 | `FORBIDDEN` | ${labels.subject} no le pertenece | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 404 | `NOT_FOUND` | labels.notFound | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Ese concepto no es un tipo de credencial profesional | Excepción explícita en src/modules/profiles/services/profiles-practitioners.service.ts |
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
  "path": "/profiles/practitioners/me/credentials"
}
```

---

## 32. DELETE /profiles/practitioners/me/credentials/{credentialId}

- **Módulo:** `profiles`
- **Etiqueta OpenAPI:** `profiles-practitioners`
- **Nombre:** Retirar un título propio pendiente
- **Operation ID:** `ProfilesPractitionersController_removeOwnCredential`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ProfilesPractitionersController.removeOwnCredential](../../src/modules/profiles/controllers/profiles-practitioners.controller.ts)

### Descripción de negocio

`404` si no existe o es de otro profesional. `422` si ya fue verificado o rechazado.

Contexto declarado en el controlador: Retirar un título propio cargado por error. Sólo mientras está **pendiente**: uno ya verificado o rechazado es un hecho de la autoridad que lo revisó, no algo que el titular deshace borrándolo. `404` si no existe o es de otro profesional —indistinguible, como el resto del módulo—.

### Descripción del sistema

NestJS resuelve `DELETE /profiles/practitioners/me/credentials/{credentialId}` en `ProfilesPractitionersController_removeOwnCredential`. El controlador delega en `ProfilesPractitionersService.removeOwnCredential`. No recibe body. El tipo de retorno estático es `Promise<void>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `credentialId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
DELETE /profiles/practitioners/me/credentials/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `credentialId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
DELETE /profiles/practitioners/me/credentials/00000000-0000-4000-8000-000000000001 HTTP/1.1
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
| 403 | `FORBIDDEN` | Esta cuenta no tiene un perfil profesional asociado | Excepción explícita en src/modules/profiles/services/profile-ownership.service.ts |
| 404 | `NOT_FOUND` | Título no encontrado | Excepción explícita en src/modules/profiles/services/profiles-practitioners.service.ts |
| 422 | `PRECONDITION_FAILED` | Ese título ya fue verificado o rechazado; no se puede retirar | Excepción explícita en src/modules/profiles/services/profiles-practitioners.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/profiles/practitioners/me/credentials/{credentialId}"
}
```

---

## 33. GET /profiles/practitioners/me/linkable-organizations

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

## 34. GET /profiles/practitioners/me/onboarding

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

## 35. PATCH /profiles/practitioners/me/specialties/{specialtyId}/primary

- **Módulo:** `profiles`
- **Etiqueta OpenAPI:** `profiles-practitioners`
- **Nombre:** Marcar una especialidad propia como la principal
- **Operation ID:** `ProfilesPractitionersController_setOwnPrimarySpecialty`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ProfilesPractitionersController.setOwnPrimarySpecialty](../../src/modules/profiles/controllers/profiles-practitioners.controller.ts)

### Descripción de negocio

Baja la primaria anterior y sube ésta, en la misma transacción. Idempotente: marcar la que ya lo es devuelve la especialidad sin escribir. `412` si la especialidad ya no se ejerce (`validTo`).

Contexto declarado en el controlador: UC-05-06·P: cambiar cuál de las especialidades propias es la principal. El sujeto sale de la sesión: el id de una especialidad ajena responde `404`, igual que uno inexistente.

### Descripción del sistema

NestJS resuelve `PATCH /profiles/practitioners/me/specialties/{specialtyId}/primary` en `ProfilesPractitionersController_setOwnPrimarySpecialty`. El controlador delega en `ProfilesPractitionersService.setOwnPrimarySpecialty`. No recibe body. El tipo de retorno estático es `Promise<SpecialtyResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `specialtyId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
PATCH /profiles/practitioners/me/specialties/00000000-0000-4000-8000-000000000001/primary HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `specialtyId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
PATCH /profiles/practitioners/me/specialties/00000000-0000-4000-8000-000000000001/primary HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<SpecialtyResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<SpecialtyResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<SpecialtyResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<SpecialtyResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<SpecialtyResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<SpecialtyResponseDto>` | No |
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
| 403 | `FORBIDDEN` | Esta cuenta no tiene un perfil profesional asociado | Excepción explícita en src/modules/profiles/services/profile-ownership.service.ts |
| 404 | `NOT_FOUND` | Especialidad no encontrada | Excepción explícita en src/modules/profiles/services/profiles-practitioners.service.ts |
| 422 | `PRECONDITION_FAILED` | Una especialidad que ya no ejercés no puede ser la principal | Excepción explícita en src/modules/profiles/services/profiles-practitioners.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/profiles/practitioners/me/specialties/{specialtyId}/primary"
}
```

---

## 36. GET /profiles/practitioners/me/summary

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
  "workEmail": "usuario@example.com",
  "personalEmail": "usuario@example.com",
  "mobilePhone": "+59170000000",
  "workMobilePhone": "+59170000000",
  "workLandline": "valor-ejemplo",
  "name": "Nombre de ejemplo",
  "middleName": "Nombre de ejemplo",
  "lastName": "Nombre de ejemplo",
  "motherLastName": "Nombre de ejemplo",
  "birthDate": "2026-07-31",
  "nationalId": "00000000-0000-4000-8000-000000000001",
  "issuerAdministrativeAreaConceptId": "00000000-0000-4000-8000-000000000001",
  "residenceMunicipalityConceptId": "00000000-0000-4000-8000-000000000001",
  "homeAddress": {
    "lines": "valor-ejemplo",
    "city": "valor-ejemplo",
    "municipalityConceptId": "00000000-0000-4000-8000-000000000001",
    "latitude": 1,
    "longitude": 1
  },
  "occupationConceptId": "00000000-0000-4000-8000-000000000001",
  "occupationFreeText": "valor-ejemplo",
  "workEmployerConceptId": "00000000-0000-4000-8000-000000000001",
  "workEmployerFreeText": "valor-ejemplo",
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
| `workEmail` | No | `string` | Sin restricción adicional declarada | Sólo en la lectura propia | `usuario@example.com` |
| `personalEmail` | No | `string` | Sin restricción adicional declarada | Sólo en la lectura propia | `usuario@example.com` |
| `mobilePhone` | No | `string` | Sin restricción adicional declarada | Sólo en la lectura propia | `+59170000000` |
| `workMobilePhone` | No | `string` | Sin restricción adicional declarada | Sólo en la lectura propia | `+59170000000` |
| `workLandline` | No | `string` | Sin restricción adicional declarada | Sólo en la lectura propia | `valor-ejemplo` |
| `name` | No | `string` | Sin restricción adicional declarada | Las cuatro partes, para poder corregir el nombre sin adivinar dónde cortarlo. | `Nombre de ejemplo` |
| `middleName` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `lastName` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `motherLastName` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `birthDate` | No | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `nationalId` | No | `string` | Sin restricción adicional declarada | Documento de identidad. **No editable desde el perfil**: es un identificador oficial y tiene su propio circuito de verificación. | `00000000-0000-4000-8000-000000000001` |
| `issuerAdministrativeAreaConceptId` | No | `string` | formato `uuid` | Departamento emisor (VS_BO_DEPARTMENT) | `00000000-0000-4000-8000-000000000001` |
| `residenceMunicipalityConceptId` | No | `string` | formato `uuid` | Municipio de residencia (VS_BO_MUNICIPALITY) | `00000000-0000-4000-8000-000000000001` |
| `homeAddress` | No | `OwnAddressDto` | Sin restricción adicional declarada | El domicilio, si lo declaró (ALV-009). Ausente y no un objeto vacío cuando no hay fila vigente — mismo criterio que `OwnPatientProfile`. | `{"lines":"valor-ejemplo","city":"valor-ejemplo","municipalityConceptId":"00000000-0000-4000-8000-000000000001","latitude":1,"longitude":1}` |
| `homeAddress.lines` | No | `string` | Sin restricción adicional declarada | Calle y número, tal como la escribió | `valor-ejemplo` |
| `homeAddress.city` | No | `string` | Sin restricción adicional declarada | Ciudad, derivada del municipio | `valor-ejemplo` |
| `homeAddress.municipalityConceptId` | No | `string` | formato `uuid` | Municipio (VS_BO_MUNICIPALITY) | `00000000-0000-4000-8000-000000000001` |
| `homeAddress.latitude` | No | `number` | Sin restricción adicional declarada | Latitud, si marcó el punto en el mapa | `1` |
| `homeAddress.longitude` | No | `number` | Sin restricción adicional declarada | Longitud; viaja siempre junto a la latitud | `1` |
| `occupationConceptId` | No | `string` | formato `uuid` | Ocupación elegida del catálogo (VS_BO_OCCUPATION) | `00000000-0000-4000-8000-000000000001` |
| `occupationFreeText` | No | `string` | Sin restricción adicional declarada | Ocupación declarada en texto libre | `valor-ejemplo` |
| `workEmployerConceptId` | No | `string` | formato `uuid` | Empresa donde trabaja, del catálogo (VS_BO_EMPLOYER) | `00000000-0000-4000-8000-000000000001` |
| `workEmployerFreeText` | No | `string` | Sin restricción adicional declarada | Empresa declarada en texto libre | `valor-ejemplo` |
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
| `affiliations` | Sí | `array<AffiliationResponseDto>` | Sin restricción adicional declarada | Historial laboral (UC-05-16): trayectoria, no PHI. Se devuelve un único array de la más reciente a la más antigua, con `current` ya derivado en cada fila — pantalla la agrupa en fases (formación/histórico/actual), la lectura no necesita decidir eso. | `[{"id":"00000000-0000-4000-8000-000000000001","practitionerProfileId":"00000000-0000-4000-8000-000000000001","organizationName":"Nombre de ejemplo","roleTitle":"valor-ejemplo","practiceSiteId":"00000000-0000-4000-8000-000000000001","affiliationTypeConceptId":"00000000-0000-4000-8000-000000000001","startDate":"2026-07-31","endDate":"2026-07-31","current":true,"status":"00000000-0000-4000-8000-000000000001","statusKind":{},"decisionReasonText":"Texto descriptivo de ejemplo","createdAt":"2026-07-31T12:00:00.000Z"}]` |
| `affiliations[].id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `affiliations[].practitionerProfileId` | Sí | `string` | formato `uuid` | Identificador asociado a practitioner profile. | `00000000-0000-4000-8000-000000000001` |
| `affiliations[].organizationName` | Sí | `string` | Sin restricción adicional declarada | Institución. | `Nombre de ejemplo` |
| `affiliations[].roleTitle` | No | `string` | admite null | Cargo, cuando el vínculo lo declara. | `valor-ejemplo` |
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

## 37. GET /profiles/practitioners/specialty-counts

- **Módulo:** `profiles`
- **Etiqueta OpenAPI:** `profiles-practitioners`
- **Nombre:** Contar profesionales visibles por especialidad
- **Operation ID:** `ProfilesPractitionersController_countPractitionersBySpecialty`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ProfilesPractitionersController.countPractitionersBySpecialty](../../src/modules/profiles/controllers/profiles-practitioners.controller.ts)

### Descripción de negocio

Contar profesionales visibles por especialidad. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: El recuento de la guía por especialidad (portada de especialidades). Sin `@Roles`, por lo mismo que el listado del que sale: es el dato con el que la guía del paciente dibuja «Cardiología · 12» sin traerse los 12. Va declarado ANTES de `practitioners/:profileId/summary` por la regla de este archivo: Nest resuelve por orden y el parámetro no debe capturar un literal.

### Descripción del sistema

NestJS resuelve `GET /profiles/practitioners/specialty-counts` en `ProfilesPractitionersController_countPractitionersBySpecialty`. El controlador delega en `ProfilesPractitionersService.countPractitionersBySpecialty`. No recibe body. El tipo de retorno estático es `Promise<ListSpecialtyCountsResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /profiles/practitioners/specialty-counts HTTP/1.1
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
GET /profiles/practitioners/specialty-counts HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ListSpecialtyCountsResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<ListSpecialtyCountsResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<ListSpecialtyCountsResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<ListSpecialtyCountsResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<ListSpecialtyCountsResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<ListSpecialtyCountsResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ListSpecialtyCountsResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "specialtyConceptId": "00000000-0000-4000-8000-000000000001",
      "practitionerCount": 1
    }
  ],
  "practitionerTotal": 1,
  "withoutSpecialtyCount": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<SpecialtyPractitionerCountDto>` | Sin restricción adicional declarada | Una fila por especialidad con al menos un profesional. Las que no tienen a nadie **no viajan**: una tarjeta que promete y abre vacía es peor que no estar. | `[{"specialtyConceptId":"00000000-0000-4000-8000-000000000001","practitionerCount":1}]` |
| `items[].specialtyConceptId` | Sí | `string` | Sin restricción adicional declarada | Concepto de la especialidad | `00000000-0000-4000-8000-000000000001` |
| `items[].practitionerCount` | Sí | `number` | Sin restricción adicional declarada | Profesionales visibles que la ejercen | `1` |
| `practitionerTotal` | Sí | `number` | Sin restricción adicional declarada | Profesionales visibles, sin repetir | `1` |
| `withoutSpecialtyCount` | Sí | `number` | Sin restricción adicional declarada | Visibles sin ninguna especialidad vigente | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/profiles/practitioners/specialty-counts"
}
```

---

## 38. GET /tenants/{tenantId}/practitioner-requests

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
| `items[].roleTitle` | No | `string` | admite null | Cargo declarado, cuando el vínculo lo tiene. Opcional desde ALV-007: un pedido de "atiendo en mi propio consultorio" no tiene cargo dentro de una jerarquía. | `valor-ejemplo` |
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

## 39. POST /tenants/{tenantId}/practitioner-requests/{affiliationId}/approve

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

## 40. POST /tenants/{tenantId}/practitioner-requests/{affiliationId}/reject

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

## 41. POST /tenants/{tenantId}/practitioner-requests/{affiliationId}/revoke

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

