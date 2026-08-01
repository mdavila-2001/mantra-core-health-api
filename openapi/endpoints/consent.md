<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `consent`

Referencia exhaustiva de 12 operación(es) del módulo `consent`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `consent-consents`, `consent-evidence`, `consent-hipaa-authorizations`, `consent-internal`, `consent-patient-objections`, `consent-privacy-restrictions`, `consent-processing-legal-bases`, `consent-treatment-informed-consents`
- **Controladores:** `ConsentEvidenceController`, `ConsentSweepController`, `ConsentsController`, `HipaaAuthorizationsController`, `PatientObjectionsController`, `PrivacyRestrictionsController`, `ProcessingLegalBasesController`, `TreatmentInformedConsentsController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [POST /consent/consent-evidence](#1-post-consent-consent-evidence) — Registrar evidencia inmutable de consentimiento
2. [POST /consent/consents](#2-post-consent-consents) — Capturar consentimiento de directiva de privacidad
3. [PATCH /consent/consents/{id}/provisions](#3-patch-consent-consents-id-provisions) — Actualizar provisiones granulares (data class / actor / acción)
4. [POST /consent/consents/{id}/withdraw](#4-post-consent-consents-id-withdraw) — Revocar/retirar consentimiento y disparar re-evaluación de accesos
5. [POST /consent/hipaa-authorizations](#5-post-consent-hipaa-authorizations) — Otorgar autorización HIPAA de divulgación
6. [POST /consent/hipaa-authorizations/{id}/revoke](#6-post-consent-hipaa-authorizations-id-revoke) — Revocar autorización HIPAA
7. [POST /consent/internal/expiration-sweep](#7-post-consent-internal-expiration-sweep) — Expirar consentimientos y autorizaciones vencidas (barrido)
8. [POST /consent/patient-objections](#8-post-consent-patient-objections) — Registrar objeción del paciente y materializar restricción
9. [POST /consent/patient-objections/{id}/resolve](#9-post-consent-patient-objections-id-resolve) — Resolver objeción del paciente
10. [POST /consent/privacy-restrictions](#10-post-consent-privacy-restrictions) — Aplicar restricción de privacidad que afecta RLS clínico
11. [POST /consent/processing-legal-bases](#11-post-consent-processing-legal-bases) — Establecer/versionar base legal de procesamiento
12. [POST /consent/treatment-informed-consents](#12-post-consent-treatment-informed-consents) — Capturar consentimiento informado de tratamiento

---

## 1. POST /consent/consent-evidence

- **Módulo:** `consent`
- **Etiqueta OpenAPI:** `consent-evidence`
- **Nombre:** Registrar evidencia inmutable de consentimiento
- **Operation ID:** `ConsentEvidenceController_record`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ConsentEvidenceController.record](../../src/modules/consent/controllers/consent-evidence.controller.ts)

### Descripción de negocio

Registrar evidencia inmutable de consentimiento. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /consent/consent-evidence` en `ConsentEvidenceController_record`. El controlador delega en `ConsentEvidenceService.record`. Valida el body como `CreateConsentEvidenceDto` y consume `application/json`. El tipo de retorno estático es `Promise<ConsentEvidenceResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateConsentEvidenceDto`; los campos opcionales se omiten.

```http
POST /consent/consent-evidence HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "subjectType": "CONSENT",
  "subjectId": "00000000-0000-4000-8000-000000000001"
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
| `subjectType` | Sí | `string` | valores: `CONSENT`, `HIPAA`, `OBJECTION`, `RESTRICTION`, `TREATMENT` | Tipo de sujeto de la evidencia | `CONSENT` |
| `subjectId` | Sí | `string` | formato `uuid` | Id de la fila a la que refiere la evidencia | `00000000-0000-4000-8000-000000000001` |
| `evidenceTypeConceptId` | No | `string` | formato `uuid` | Tipo de evidencia (concept id); por defecto firma | `00000000-0000-4000-8000-000000000001` |
| `documentFileId` | No | `string` | formato `uuid` | Documento firmado (file id) | `00000000-0000-4000-8000-000000000001` |
| `signatureId` | No | `string` | formato `uuid` | Firma clínica asociada (signature id) | `00000000-0000-4000-8000-000000000001` |
| `capturedChannelConceptId` | No | `string` | formato `uuid` | Canal de captura (concept id) | `00000000-0000-4000-8000-000000000001` |
| `policySnapshotHash` | No | `string` | longitud máxima 200 | Hash del snapshot de política | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |
| `evidenceHash` | No | `string` | longitud máxima 200 | Hash de la evidencia (integridad reproducible) | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /consent/consent-evidence HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "subjectType": "CONSENT",
  "subjectId": "00000000-0000-4000-8000-000000000001",
  "evidenceTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "documentFileId": "00000000-0000-4000-8000-000000000001",
  "signatureId": "00000000-0000-4000-8000-000000000001",
  "capturedChannelConceptId": "00000000-0000-4000-8000-000000000001",
  "policySnapshotHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "evidenceHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ConsentEvidenceResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ConsentEvidenceResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ConsentEvidenceResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ConsentEvidenceResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ConsentEvidenceResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ConsentEvidenceResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ConsentEvidenceResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ConsentEvidenceResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ConsentEvidenceResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ConsentEvidenceResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "subjectId": "00000000-0000-4000-8000-000000000001",
  "recordedAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `subjectId` | Sí | `string` | formato `uuid` | Identificador asociado a subject. | `00000000-0000-4000-8000-000000000001` |
| `recordedAt` | Sí | `string` | formato `date-time` | Valor de recorded at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
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
  "path": "/consent/consent-evidence"
}
```

---

## 2. POST /consent/consents

- **Módulo:** `consent`
- **Etiqueta OpenAPI:** `consent-consents`
- **Nombre:** Capturar consentimiento de directiva de privacidad
- **Operation ID:** `ConsentsController_capture`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ConsentsController.capture](../../src/modules/consent/controllers/consents.controller.ts)

### Descripción de negocio

Capturar consentimiento de directiva de privacidad. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /consent/consents` en `ConsentsController_capture`. El controlador delega en `ConsentsService.capture`. Valida el body como `CreateConsentDto` y consume `application/json`. El tipo de retorno estático es `Promise<ConsentResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateConsentDto`; los campos opcionales se omiten.

```http
POST /consent/consents HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "processingPurposeId": "00000000-0000-4000-8000-000000000001"
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
| `patientProfileId` | Sí | `string` | formato `uuid` | Paciente titular de los datos (patient profile id) | `00000000-0000-4000-8000-000000000001` |
| `processingPurposeId` | Sí | `string` | formato `uuid` | Propósito de procesamiento activo (processing_purpose id) | `00000000-0000-4000-8000-000000000001` |
| `processingLegalBasisId` | No | `string` | formato `uuid` | Base legal de procesamiento vigente | `00000000-0000-4000-8000-000000000001` |
| `categoryConceptId` | No | `string` | formato `uuid` | Categoría del consentimiento (concept id); por defecto privacidad | `00000000-0000-4000-8000-000000000001` |
| `tenantId` | No | `string` | formato `uuid` | Tenant propietario | `00000000-0000-4000-8000-000000000001` |
| `grantedByUserId` | No | `string` | formato `uuid` | Usuario que otorga (si no es representante) | `00000000-0000-4000-8000-000000000001` |
| `grantedByRelatedPersonId` | No | `string` | formato `uuid` | Persona relacionada que otorga (representante legal) | `00000000-0000-4000-8000-000000000001` |
| `policyUri` | No | `string` | longitud máxima 2048 | URI de la política aceptada | `valor-ejemplo` |
| `policyVersion` | No | `string` | longitud máxima 100 | Versión de la política aceptada | `valor-ejemplo` |
| `validFrom` | No | `string` | Sin restricción adicional declarada | Inicio de vigencia (ISO-8601) | `valor-ejemplo` |
| `validTo` | No | `string` | Sin restricción adicional declarada | Fin de vigencia (ISO-8601) | `valor-ejemplo` |
| `provisions` | No | `array<ConsentProvisionInputDto>` | máximo 50 elemento(s) | Provisiones granulares iniciales | `[{"action":"PERMIT","dataClassConceptId":"00000000-0000-4000-8000-000000000001","actorUserId":"00000000-0000-4000-8000-000000000001","actorRoleConceptId":"00000000-0000-4000-8000-000000000001","purposeOfUseConceptId":"00000000-0000-4000-8000-000000000001","securityLabelConceptId":"00000000-0000-4000-8000-000000000001","validFrom":"valor-ejemplo","validTo":"valor-ejemplo","provisionTypeConceptId":"00000000-0000-4000-8000-000000000001"}]` |
| `provisions[].action` | No | `string` | valores: `PERMIT`, `DENY` | Acción de la provisión | `PERMIT` |
| `provisions[].dataClassConceptId` | No | `string` | formato `uuid` | Clase de datos afectada (concept id) | `00000000-0000-4000-8000-000000000001` |
| `provisions[].actorUserId` | No | `string` | formato `uuid` | Actor concreto autorizado/denegado (user id) | `00000000-0000-4000-8000-000000000001` |
| `provisions[].actorRoleConceptId` | No | `string` | formato `uuid` | Rol del actor (concept id) | `00000000-0000-4000-8000-000000000001` |
| `provisions[].purposeOfUseConceptId` | No | `string` | formato `uuid` | Propósito de uso (concept id) | `00000000-0000-4000-8000-000000000001` |
| `provisions[].securityLabelConceptId` | No | `string` | formato `uuid` | Etiqueta de seguridad (concept id) | `00000000-0000-4000-8000-000000000001` |
| `provisions[].validFrom` | No | `string` | Sin restricción adicional declarada | Inicio de vigencia (ISO-8601) | `valor-ejemplo` |
| `provisions[].validTo` | No | `string` | Sin restricción adicional declarada | Fin de vigencia (ISO-8601) | `valor-ejemplo` |
| `provisions[].provisionTypeConceptId` | No | `string` | Sin restricción adicional declarada | Tipo de provisión (concept id); por defecto la base | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /consent/consents HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "processingPurposeId": "00000000-0000-4000-8000-000000000001",
  "processingLegalBasisId": "00000000-0000-4000-8000-000000000001",
  "categoryConceptId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "grantedByUserId": "00000000-0000-4000-8000-000000000001",
  "grantedByRelatedPersonId": "00000000-0000-4000-8000-000000000001",
  "policyUri": "valor-ejemplo",
  "policyVersion": "valor-ejemplo",
  "validFrom": "valor-ejemplo",
  "validTo": "valor-ejemplo",
  "provisions": [
    {
      "action": "PERMIT",
      "dataClassConceptId": "00000000-0000-4000-8000-000000000001",
      "actorUserId": "00000000-0000-4000-8000-000000000001",
      "actorRoleConceptId": "00000000-0000-4000-8000-000000000001",
      "purposeOfUseConceptId": "00000000-0000-4000-8000-000000000001",
      "securityLabelConceptId": "00000000-0000-4000-8000-000000000001",
      "validFrom": "valor-ejemplo",
      "validTo": "valor-ejemplo",
      "provisionTypeConceptId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ConsentResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ConsentResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ConsentResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ConsentResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ConsentResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ConsentResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ConsentResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ConsentResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ConsentResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ConsentResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001",
  "processingPurposeId": "00000000-0000-4000-8000-000000000001",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | Sí | `string` | formato `uuid` | Identificador asociado a patient profile. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Estado (concept id) | `00000000-0000-4000-8000-000000000001` |
| `processingPurposeId` | Sí | `string` | formato `uuid` | Identificador asociado a processing purpose. | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Ya existe un consentimiento activo para este propósito | Excepción explícita en src/modules/consent/services/consents.service.ts |
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
  "path": "/consent/consents"
}
```

---

## 3. PATCH /consent/consents/{id}/provisions

- **Módulo:** `consent`
- **Etiqueta OpenAPI:** `consent-consents`
- **Nombre:** Actualizar provisiones granulares (data class / actor / acción)
- **Operation ID:** `ConsentsController_amendProvisions`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ConsentsController.amendProvisions](../../src/modules/consent/controllers/consents.controller.ts)

### Descripción de negocio

Actualizar provisiones granulares (data class / actor / acción). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `PATCH /consent/consents/{id}/provisions` en `ConsentsController_amendProvisions`. El controlador delega en `ConsentsService.amendProvisions`. Valida el body como `AmendProvisionsDto` y consume `application/json`. El tipo de retorno estático es `Promise<StatusResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `AmendProvisionsDto`; los campos opcionales se omiten.

```http
PATCH /consent/consents/00000000-0000-4000-8000-000000000001/provisions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "provisions": [
    {
      "action": "PERMIT"
    }
  ]
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
| `provisions` | Sí | `array<ConsentProvisionInputDto>` | mínimo 1 elemento(s); máximo 50 elemento(s) | Provisiones nuevas que reemplazan a las vigentes | `[{"action":"PERMIT","dataClassConceptId":"00000000-0000-4000-8000-000000000001","actorUserId":"00000000-0000-4000-8000-000000000001","actorRoleConceptId":"00000000-0000-4000-8000-000000000001","purposeOfUseConceptId":"00000000-0000-4000-8000-000000000001","securityLabelConceptId":"00000000-0000-4000-8000-000000000001","validFrom":"valor-ejemplo","validTo":"valor-ejemplo","provisionTypeConceptId":"00000000-0000-4000-8000-000000000001"}]` |
| `provisions[].action` | Sí | `string` | valores: `PERMIT`, `DENY` | Acción de la provisión | `PERMIT` |
| `provisions[].dataClassConceptId` | No | `string` | formato `uuid` | Clase de datos afectada (concept id) | `00000000-0000-4000-8000-000000000001` |
| `provisions[].actorUserId` | No | `string` | formato `uuid` | Actor concreto autorizado/denegado (user id) | `00000000-0000-4000-8000-000000000001` |
| `provisions[].actorRoleConceptId` | No | `string` | formato `uuid` | Rol del actor (concept id) | `00000000-0000-4000-8000-000000000001` |
| `provisions[].purposeOfUseConceptId` | No | `string` | formato `uuid` | Propósito de uso (concept id) | `00000000-0000-4000-8000-000000000001` |
| `provisions[].securityLabelConceptId` | No | `string` | formato `uuid` | Etiqueta de seguridad (concept id) | `00000000-0000-4000-8000-000000000001` |
| `provisions[].validFrom` | No | `string` | Sin restricción adicional declarada | Inicio de vigencia (ISO-8601) | `valor-ejemplo` |
| `provisions[].validTo` | No | `string` | Sin restricción adicional declarada | Fin de vigencia (ISO-8601) | `valor-ejemplo` |
| `provisions[].provisionTypeConceptId` | No | `string` | Sin restricción adicional declarada | Tipo de provisión (concept id); por defecto la base | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PATCH /consent/consents/00000000-0000-4000-8000-000000000001/provisions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "provisions": [
    {
      "action": "PERMIT",
      "dataClassConceptId": "00000000-0000-4000-8000-000000000001",
      "actorUserId": "00000000-0000-4000-8000-000000000001",
      "actorRoleConceptId": "00000000-0000-4000-8000-000000000001",
      "purposeOfUseConceptId": "00000000-0000-4000-8000-000000000001",
      "securityLabelConceptId": "00000000-0000-4000-8000-000000000001",
      "validFrom": "valor-ejemplo",
      "validTo": "valor-ejemplo",
      "provisionTypeConceptId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 404 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `StatusResultDto`. Ejemplo completo derivado de ese DTO:

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
| 404 | `NOT_FOUND` | Consentimiento no encontrado | Excepción explícita en src/modules/consent/services/consents.service.ts |
| 409 | `CONFLICT` | El consentimiento no está activo | Excepción explícita en src/modules/consent/services/consents.service.ts |
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
  "path": "/consent/consents/{id}/provisions"
}
```

---

## 4. POST /consent/consents/{id}/withdraw

- **Módulo:** `consent`
- **Etiqueta OpenAPI:** `consent-consents`
- **Nombre:** Revocar/retirar consentimiento y disparar re-evaluación de accesos
- **Operation ID:** `ConsentsController_withdraw`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ConsentsController.withdraw](../../src/modules/consent/controllers/consents.controller.ts)

### Descripción de negocio

Revocar/retirar consentimiento y disparar re-evaluación de accesos. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /consent/consents/{id}/withdraw` en `ConsentsController_withdraw`. El controlador delega en `ConsentsService.withdraw`. Valida el body como `WithdrawConsentDto` y consume `application/json`. El tipo de retorno estático es `Promise<StatusResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `WithdrawConsentDto`; los campos opcionales se omiten.

```http
POST /consent/consents/00000000-0000-4000-8000-000000000001/withdraw HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
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
| `withdrawalReasonConceptId` | No | `string` | formato `uuid` | Motivo de retiro (concept id) | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /consent/consents/00000000-0000-4000-8000-000000000001/withdraw HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "withdrawalReasonConceptId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 404 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `StatusResultDto`. Ejemplo completo derivado de ese DTO:

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
| 404 | `NOT_FOUND` | Consentimiento no encontrado | Excepción explícita en src/modules/consent/services/consents.service.ts |
| 409 | `CONFLICT` | El consentimiento no está activo | Excepción explícita en src/modules/consent/services/consents.service.ts |
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
  "path": "/consent/consents/{id}/withdraw"
}
```

---

## 5. POST /consent/hipaa-authorizations

- **Módulo:** `consent`
- **Etiqueta OpenAPI:** `consent-hipaa-authorizations`
- **Nombre:** Otorgar autorización HIPAA de divulgación
- **Operation ID:** `HipaaAuthorizationsController_grant`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [HipaaAuthorizationsController.grant](../../src/modules/consent/controllers/hipaa-authorizations.controller.ts)

### Descripción de negocio

Otorgar autorización HIPAA de divulgación. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /consent/hipaa-authorizations` en `HipaaAuthorizationsController_grant`. El controlador delega en `HipaaAuthorizationsService.grant`. Valida el body como `CreateHipaaAuthorizationDto` y consume `application/json`. El tipo de retorno estático es `Promise<HipaaAuthorizationResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateHipaaAuthorizationDto`; los campos opcionales se omiten.

```http
POST /consent/hipaa-authorizations HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "processingPurposeId": "00000000-0000-4000-8000-000000000001",
  "recipientDescription": "Texto descriptivo de ejemplo",
  "informationDescription": "Texto descriptivo de ejemplo",
  "expirationType": "DATE"
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
| `patientProfileId` | Sí | `string` | formato `uuid` | Paciente titular (patient profile id) | `00000000-0000-4000-8000-000000000001` |
| `processingPurposeId` | Sí | `string` | formato `uuid` | Propósito de procesamiento activo | `00000000-0000-4000-8000-000000000001` |
| `recipientDescription` | Sí | `string` | longitud máxima 500 | Descripción del destinatario de la divulgación | `Texto descriptivo de ejemplo` |
| `informationDescription` | Sí | `string` | longitud máxima 4000 | Descripción de la información a divulgar | `Texto descriptivo de ejemplo` |
| `expirationType` | Sí | `string` | valores: `DATE`, `EVENT` | Tipo de expiración | `DATE` |
| `expiresAt` | No | `string` | Sin restricción adicional declarada | Fecha de expiración (ISO-8601) si expirationType=DATE | `valor-ejemplo` |
| `expirationEventText` | No | `string` | longitud máxima 1000 | Evento de expiración si expirationType=EVENT | `valor-ejemplo` |
| `tenantId` | No | `string` | formato `uuid` | Tenant propietario | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /consent/hipaa-authorizations HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "processingPurposeId": "00000000-0000-4000-8000-000000000001",
  "recipientDescription": "Texto descriptivo de ejemplo",
  "informationDescription": "Texto descriptivo de ejemplo",
  "expirationType": "DATE",
  "expiresAt": "valor-ejemplo",
  "expirationEventText": "valor-ejemplo",
  "tenantId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<HipaaAuthorizationResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<HipaaAuthorizationResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<HipaaAuthorizationResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<HipaaAuthorizationResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<HipaaAuthorizationResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<HipaaAuthorizationResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<HipaaAuthorizationResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<HipaaAuthorizationResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<HipaaAuthorizationResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `HipaaAuthorizationResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | Sí | `string` | formato `uuid` | Identificador asociado a patient profile. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Estado (concept id) | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | expiresAt es obligatorio cuando expirationType=DATE | Excepción explícita en src/modules/consent/services/hipaa-authorizations.service.ts |
| 422 | `PRECONDITION_FAILED` | expirationEventText es obligatorio cuando expirationType=EVENT | Excepción explícita en src/modules/consent/services/hipaa-authorizations.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/consent/hipaa-authorizations"
}
```

---

## 6. POST /consent/hipaa-authorizations/{id}/revoke

- **Módulo:** `consent`
- **Etiqueta OpenAPI:** `consent-hipaa-authorizations`
- **Nombre:** Revocar autorización HIPAA
- **Operation ID:** `HipaaAuthorizationsController_revoke`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [HipaaAuthorizationsController.revoke](../../src/modules/consent/controllers/hipaa-authorizations.controller.ts)

### Descripción de negocio

Revocar autorización HIPAA. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /consent/hipaa-authorizations/{id}/revoke` en `HipaaAuthorizationsController_revoke`. El controlador delega en `HipaaAuthorizationsService.revoke`. No recibe body. El tipo de retorno estático es `Promise<StatusResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /consent/hipaa-authorizations/00000000-0000-4000-8000-000000000001/revoke HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /consent/hipaa-authorizations/00000000-0000-4000-8000-000000000001/revoke HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 404 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `StatusResultDto`. Ejemplo completo derivado de ese DTO:

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
| 404 | `NOT_FOUND` | Autorización HIPAA no encontrada | Excepción explícita en src/modules/consent/services/hipaa-authorizations.service.ts |
| 409 | `CONFLICT` | La autorización no está activa | Excepción explícita en src/modules/consent/services/hipaa-authorizations.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/consent/hipaa-authorizations/{id}/revoke"
}
```

---

## 7. POST /consent/internal/expiration-sweep

- **Módulo:** `consent`
- **Etiqueta OpenAPI:** `consent-internal`
- **Nombre:** Expirar consentimientos y autorizaciones vencidas (barrido)
- **Operation ID:** `ConsentSweepController_sweep`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ConsentSweepController.sweep](../../src/modules/consent/controllers/consent-sweep.controller.ts)

### Descripción de negocio

Expirar consentimientos y autorizaciones vencidas (barrido). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /consent/internal/expiration-sweep` en `ConsentSweepController_sweep`. El controlador delega en `ConsentSweepService.sweep`. No recibe body. El tipo de retorno estático es `Promise<ExpirationSweepResultDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /consent/internal/expiration-sweep HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `SECURITY_ADMIN`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /consent/internal/expiration-sweep HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ExpirationSweepResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ExpirationSweepResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ExpirationSweepResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ExpirationSweepResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ExpirationSweepResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ExpirationSweepResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ExpirationSweepResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ExpirationSweepResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ExpirationSweepResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "expiredConsents": 1,
  "expiredAuthorizations": 1,
  "expiredRestrictions": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `expiredConsents` | Sí | `number` | Sin restricción adicional declarada | Consentimientos expirados | `1` |
| `expiredAuthorizations` | Sí | `number` | Sin restricción adicional declarada | Autorizaciones HIPAA expiradas | `1` |
| `expiredRestrictions` | Sí | `number` | Sin restricción adicional declarada | Restricciones de privacidad expiradas | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/consent/internal/expiration-sweep"
}
```

---

## 8. POST /consent/patient-objections

- **Módulo:** `consent`
- **Etiqueta OpenAPI:** `consent-patient-objections`
- **Nombre:** Registrar objeción del paciente y materializar restricción
- **Operation ID:** `PatientObjectionsController_raise`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PatientObjectionsController.raise](../../src/modules/consent/controllers/patient-objections.controller.ts)

### Descripción de negocio

Registrar objeción del paciente y materializar restricción. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /consent/patient-objections` en `PatientObjectionsController_raise`. El controlador delega en `PatientObjectionsService.raise`. Valida el body como `CreatePatientObjectionDto` y consume `application/json`. El tipo de retorno estático es `Promise<PatientObjectionResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreatePatientObjectionDto`; los campos opcionales se omiten.

```http
POST /consent/patient-objections HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "processingPurposeId": "00000000-0000-4000-8000-000000000001"
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
| `patientProfileId` | Sí | `string` | formato `uuid` | Paciente titular (patient profile id) | `00000000-0000-4000-8000-000000000001` |
| `processingPurposeId` | Sí | `string` | formato `uuid` | Propósito de procesamiento objetado | `00000000-0000-4000-8000-000000000001` |
| `objectionTypeConceptId` | No | `string` | formato `uuid` | Tipo de objeción (concept id); por defecto objeción a procesamiento | `00000000-0000-4000-8000-000000000001` |
| `reasonText` | No | `string` | longitud máxima 4000 | Motivo textual de la objeción | `Texto descriptivo de ejemplo` |
| `tenantId` | No | `string` | formato `uuid` | Tenant propietario | `00000000-0000-4000-8000-000000000001` |
| `applyRestriction` | No | `boolean` | Sin restricción adicional declarada | Si true, materializa de inmediato una restricción de privacidad (include UC-07-07) | `false` |
| `restrictionDataClassConceptId` | No | `string` | formato `uuid` | Clase de datos de la restricción inmediata (concept id) | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /consent/patient-objections HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "processingPurposeId": "00000000-0000-4000-8000-000000000001",
  "objectionTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "reasonText": "Texto descriptivo de ejemplo",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "applyRestriction": false,
  "restrictionDataClassConceptId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<PatientObjectionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<PatientObjectionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PatientObjectionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PatientObjectionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PatientObjectionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<PatientObjectionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PatientObjectionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PatientObjectionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PatientObjectionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PatientObjectionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001",
  "restrictionId": "00000000-0000-4000-8000-000000000001",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | Sí | `string` | formato `uuid` | Identificador asociado a patient profile. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Estado (concept id) | `00000000-0000-4000-8000-000000000001` |
| `restrictionId` | Sí | `string` | admite null | Restricción de privacidad creada (si aplica) | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Ya existe una objeción abierta para este propósito | Excepción explícita en src/modules/consent/services/patient-objections.service.ts |
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
  "path": "/consent/patient-objections"
}
```

---

## 9. POST /consent/patient-objections/{id}/resolve

- **Módulo:** `consent`
- **Etiqueta OpenAPI:** `consent-patient-objections`
- **Nombre:** Resolver objeción del paciente
- **Operation ID:** `PatientObjectionsController_resolve`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PatientObjectionsController.resolve](../../src/modules/consent/controllers/patient-objections.controller.ts)

### Descripción de negocio

Resolver objeción del paciente. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /consent/patient-objections/{id}/resolve` en `PatientObjectionsController_resolve`. El controlador delega en `PatientObjectionsService.resolve`. Valida el body como `ResolvePatientObjectionDto` y consume `application/json`. El tipo de retorno estático es `Promise<StatusResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ResolvePatientObjectionDto`; los campos opcionales se omiten.

```http
POST /consent/patient-objections/00000000-0000-4000-8000-000000000001/resolve HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "resolution": "UPHELD"
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
| `resolution` | Sí | `string` | valores: `UPHELD`, `REJECTED` | Resultado de la resolución | `UPHELD` |
| `reasonConceptId` | No | `string` | formato `uuid` | Motivo de la resolución (concept id) | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /consent/patient-objections/00000000-0000-4000-8000-000000000001/resolve HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "resolution": "UPHELD",
  "reasonConceptId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 404 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `StatusResultDto`. Ejemplo completo derivado de ese DTO:

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
| 404 | `NOT_FOUND` | Objeción no encontrada | Excepción explícita en src/modules/consent/services/patient-objections.service.ts |
| 409 | `CONFLICT` | La objeción no está abierta | Excepción explícita en src/modules/consent/services/patient-objections.service.ts |
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
  "path": "/consent/patient-objections/{id}/resolve"
}
```

---

## 10. POST /consent/privacy-restrictions

- **Módulo:** `consent`
- **Etiqueta OpenAPI:** `consent-privacy-restrictions`
- **Nombre:** Aplicar restricción de privacidad que afecta RLS clínico
- **Operation ID:** `PrivacyRestrictionsController_apply`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PrivacyRestrictionsController.apply](../../src/modules/consent/controllers/privacy-restrictions.controller.ts)

### Descripción de negocio

Aplicar restricción de privacidad que afecta RLS clínico. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /consent/privacy-restrictions` en `PrivacyRestrictionsController_apply`. El controlador delega en `PrivacyRestrictionsService.apply`. Valida el body como `CreatePrivacyRestrictionDto` y consume `application/json`. El tipo de retorno estático es `Promise<PrivacyRestrictionResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreatePrivacyRestrictionDto`; los campos opcionales se omiten.

```http
POST /consent/privacy-restrictions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "dataClassConceptId": "00000000-0000-4000-8000-000000000001"
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
| `patientProfileId` | Sí | `string` | formato `uuid` | Paciente titular (patient profile id) | `00000000-0000-4000-8000-000000000001` |
| `dataClassConceptId` | Sí | `string` | formato `uuid` | Clase de datos restringida (concept id) | `00000000-0000-4000-8000-000000000001` |
| `restrictionTypeConceptId` | No | `string` | formato `uuid` | Tipo de restricción (concept id); por defecto bloqueo | `00000000-0000-4000-8000-000000000001` |
| `targetActorTypeConceptId` | No | `string` | formato `uuid` | Tipo de actor destino (concept id) | `00000000-0000-4000-8000-000000000001` |
| `targetActorId` | No | `string` | formato `uuid` | Actor destino concreto (id) | `00000000-0000-4000-8000-000000000001` |
| `reasonText` | No | `string` | longitud máxima 4000 | Motivo textual | `Texto descriptivo de ejemplo` |
| `validTo` | No | `string` | Sin restricción adicional declarada | Fin de vigencia (ISO-8601) | `valor-ejemplo` |
| `tenantId` | No | `string` | formato `uuid` | Tenant propietario | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /consent/privacy-restrictions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "dataClassConceptId": "00000000-0000-4000-8000-000000000001",
  "restrictionTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "targetActorTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "targetActorId": "00000000-0000-4000-8000-000000000001",
  "reasonText": "Texto descriptivo de ejemplo",
  "validTo": "valor-ejemplo",
  "tenantId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<PrivacyRestrictionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<PrivacyRestrictionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PrivacyRestrictionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PrivacyRestrictionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PrivacyRestrictionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<PrivacyRestrictionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PrivacyRestrictionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PrivacyRestrictionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PrivacyRestrictionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PrivacyRestrictionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | Sí | `string` | formato `uuid` | Identificador asociado a patient profile. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Estado (concept id) | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
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
  "path": "/consent/privacy-restrictions"
}
```

---

## 11. POST /consent/processing-legal-bases

- **Módulo:** `consent`
- **Etiqueta OpenAPI:** `consent-processing-legal-bases`
- **Nombre:** Establecer/versionar base legal de procesamiento
- **Operation ID:** `ProcessingLegalBasesController_version`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ProcessingLegalBasesController.version](../../src/modules/consent/controllers/processing-legal-bases.controller.ts)

### Descripción de negocio

Establecer/versionar base legal de procesamiento. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /consent/processing-legal-bases` en `ProcessingLegalBasesController_version`. El controlador delega en `ProcessingLegalBasesService.version`. Valida el body como `CreateProcessingLegalBasisDto` y consume `application/json`. El tipo de retorno estático es `Promise<ProcessingLegalBasisResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateProcessingLegalBasisDto`; los campos opcionales se omiten.

```http
POST /consent/processing-legal-bases HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "processingPurposeId": "00000000-0000-4000-8000-000000000001"
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
| `processingPurposeId` | Sí | `string` | formato `uuid` | Propósito de procesamiento activo | `00000000-0000-4000-8000-000000000001` |
| `jurisdictionConceptId` | No | `string` | formato `uuid` | Jurisdicción (concept id); por defecto Perú | `00000000-0000-4000-8000-000000000001` |
| `generalLegalBasisConceptId` | No | `string` | formato `uuid` | Base legal general (concept id); por defecto consentimiento | `00000000-0000-4000-8000-000000000001` |
| `specialCategoryConditionConceptId` | No | `string` | formato `uuid` | Condición de categoría especial (concept id) | `00000000-0000-4000-8000-000000000001` |
| `policyVersion` | No | `string` | longitud máxima 100 | Versión de la política | `valor-ejemplo` |
| `legalReferenceUri` | No | `string` | longitud máxima 2048 | URI de referencia legal | `valor-ejemplo` |
| `tenantId` | No | `string` | formato `uuid` | Tenant propietario | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /consent/processing-legal-bases HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "processingPurposeId": "00000000-0000-4000-8000-000000000001",
  "jurisdictionConceptId": "00000000-0000-4000-8000-000000000001",
  "generalLegalBasisConceptId": "00000000-0000-4000-8000-000000000001",
  "specialCategoryConditionConceptId": "00000000-0000-4000-8000-000000000001",
  "policyVersion": "valor-ejemplo",
  "legalReferenceUri": "valor-ejemplo",
  "tenantId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ProcessingLegalBasisResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ProcessingLegalBasisResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ProcessingLegalBasisResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ProcessingLegalBasisResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ProcessingLegalBasisResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ProcessingLegalBasisResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ProcessingLegalBasisResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ProcessingLegalBasisResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ProcessingLegalBasisResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ProcessingLegalBasisResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "processingPurposeId": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001",
  "supersededId": "00000000-0000-4000-8000-000000000001",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `processingPurposeId` | Sí | `string` | formato `uuid` | Identificador asociado a processing purpose. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Estado (concept id) | `00000000-0000-4000-8000-000000000001` |
| `supersededId` | Sí | `string` | admite null | Versión anterior cerrada (si la había) | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
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
  "path": "/consent/processing-legal-bases"
}
```

---

## 12. POST /consent/treatment-informed-consents

- **Módulo:** `consent`
- **Etiqueta OpenAPI:** `consent-treatment-informed-consents`
- **Nombre:** Capturar consentimiento informado de tratamiento
- **Operation ID:** `TreatmentInformedConsentsController_sign`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TreatmentInformedConsentsController.sign](../../src/modules/consent/controllers/treatment-informed-consents.controller.ts)

### Descripción de negocio

Capturar consentimiento informado de tratamiento. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /consent/treatment-informed-consents` en `TreatmentInformedConsentsController_sign`. El controlador delega en `TreatmentInformedConsentsService.sign`. Valida el body como `CreateTreatmentInformedConsentDto` y consume `application/json`. El tipo de retorno estático es `Promise<TreatmentInformedConsentResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateTreatmentInformedConsentDto`; los campos opcionales se omiten.

```http
POST /consent/treatment-informed-consents HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "encounterId": "00000000-0000-4000-8000-000000000001",
  "decision": "ACCEPTED"
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
| `patientProfileId` | Sí | `string` | formato `uuid` | Paciente titular (patient profile id) | `00000000-0000-4000-8000-000000000001` |
| `encounterId` | Sí | `string` | formato `uuid` | Encuentro clínico abierto (encounter id) | `00000000-0000-4000-8000-000000000001` |
| `decision` | Sí | `string` | valores: `ACCEPTED`, `DECLINED` | Decisión del paciente | `ACCEPTED` |
| `procedureCodeConceptId` | No | `string` | formato `uuid` | Código de procedimiento (concept id) | `00000000-0000-4000-8000-000000000001` |
| `informationVersion` | No | `string` | longitud máxima 100 | Versión del material informativo vigente | `valor-ejemplo` |
| `interpreterUserId` | No | `string` | formato `uuid` | Intérprete presente (user id) | `00000000-0000-4000-8000-000000000001` |
| `witnessUserId` | No | `string` | formato `uuid` | Testigo (user id) | `00000000-0000-4000-8000-000000000001` |
| `tenantId` | No | `string` | formato `uuid` | Tenant propietario | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /consent/treatment-informed-consents HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "encounterId": "00000000-0000-4000-8000-000000000001",
  "decision": "ACCEPTED",
  "procedureCodeConceptId": "00000000-0000-4000-8000-000000000001",
  "informationVersion": "valor-ejemplo",
  "interpreterUserId": "00000000-0000-4000-8000-000000000001",
  "witnessUserId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<TreatmentInformedConsentResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<TreatmentInformedConsentResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<TreatmentInformedConsentResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<TreatmentInformedConsentResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<TreatmentInformedConsentResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<TreatmentInformedConsentResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<TreatmentInformedConsentResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<TreatmentInformedConsentResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<TreatmentInformedConsentResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TreatmentInformedConsentResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001",
  "decision": "00000000-0000-4000-8000-000000000001",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | Sí | `string` | formato `uuid` | Identificador asociado a patient profile. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Estado (concept id) | `00000000-0000-4000-8000-000000000001` |
| `decision` | Sí | `string` | formato `uuid` | Decisión (concept id) | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
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
  "path": "/consent/treatment-informed-consents"
}
```

---

