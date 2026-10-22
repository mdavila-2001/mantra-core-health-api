<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `consent`

- **Bloque:** Identidad y Seguridad (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)
- **Operaciones:** 22 (22 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 0 · MEDIO 16 · BAJO 6
- **Tablas distintas que tocan:** 39
- **Respuestas de error y detalle contractual:** `openapi/endpoints/consent.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | POST | `/consent/consent-evidence` | Registrar evidencia inmutable de consentimiento | MEDIO | 1 | SECURITY_ADMIN |
| 2 | POST | `/consent/consents` | Capturar consentimiento de directiva de privacidad | MEDIO | 4 | SECURITY_ADMIN |
| 3 | PATCH | `/consent/consents/{id}/provisions` | Actualizar provisiones granulares (data class / actor / acción) | MEDIO | 5 | SECURITY_ADMIN |
| 4 | POST | `/consent/consents/{id}/withdraw` | Revocar/retirar consentimiento y disparar re-evaluación de accesos | MEDIO | 8 | SECURITY_ADMIN |
| 5 | GET | `/consent/encounters/{encounterId}/informed-consent` | Consentimientos informados registrados en el encuentro | BAJO | 20 | CLINICIAN, PRACTITIONER |
| 6 | POST | `/consent/encounters/{encounterId}/informed-consent` | Registrar el consentimiento informado del encuentro | MEDIO | 19 | CLINICIAN, PRACTITIONER |
| 7 | POST | `/consent/hipaa-authorizations` | Otorgar autorización HIPAA de divulgación | MEDIO | 2 | SECURITY_ADMIN |
| 8 | POST | `/consent/hipaa-authorizations/{id}/revoke` | Revocar autorización HIPAA | MEDIO | 3 | SECURITY_ADMIN |
| 9 | POST | `/consent/internal/expiration-sweep` | Expirar consentimientos y autorizaciones vencidas (barrido) | MEDIO | 7 | SYSTEM, SECURITY_ADMIN |
| 10 | GET | `/consent/me/consents` | Mis consentimientos (vigentes y retirados) | BAJO | 4 | PATIENT |
| 11 | POST | `/consent/me/consents/{id}/withdraw` | Retirar uno de mis consentimientos | MEDIO | 10 | PATIENT |
| 12 | GET | `/consent/me/hipaa-authorizations` | Mis autorizaciones de divulgación | BAJO | 4 | PATIENT |
| 13 | GET | `/consent/me/objections` | Mis objeciones (abiertas y resueltas) | BAJO | 4 | PATIENT |
| 14 | GET | `/consent/me/treatment-informed-consents` | Mis consentimientos informados de tratamiento | BAJO | 3 | PATIENT |
| 15 | POST | `/consent/patient-objections` | Registrar objeción del paciente y materializar restricción | MEDIO | 4 | SECURITY_ADMIN |
| 16 | POST | `/consent/patient-objections/{id}/resolve` | Resolver objeción del paciente | MEDIO | 5 | SECURITY_ADMIN |
| 17 | POST | `/consent/practitioner-access-requests` | Pedir acceso al expediente de un paciente encontrado en la búsqueda | MEDIO | 19 | PRACTITIONER, CLINICIAN |
| 18 | POST | `/consent/practitioner-access-requests/{id}/decision` | Aceptar (con las especialidades autorizadas) o rechazar la solicitud | MEDIO | 23 | PATIENT |
| 19 | GET | `/consent/practitioner-access-requests/mine` | Mis solicitudes de vínculo pendientes de decisión | BAJO | 4 | PATIENT |
| 20 | POST | `/consent/privacy-restrictions` | Aplicar restricción de privacidad que afecta RLS clínico | MEDIO | 2 | SECURITY_ADMIN |
| 21 | POST | `/consent/processing-legal-bases` | Establecer/versionar base legal de procesamiento | MEDIO | 3 | SECURITY_ADMIN |
| 22 | POST | `/consent/treatment-informed-consents` | Capturar consentimiento informado de tratamiento | MEDIO | 2 | SECURITY_ADMIN |

---

## 1. POST /consent/consent-evidence

- **Origen:** CONTRATO
- **Nombre:** Registrar evidencia inmutable de consentimiento
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ConsentEvidenceController.record` — `src/modules/consent/controllers/consent-evidence.controller.ts:25`

### Qué es y para qué sirve (negocio)

Registrar evidencia inmutable de consentimiento. Caso de uso UC-07-10: Registrar evidencia inmutable (append-only). Dentro del módulo (descripción del modelo, en inglés): «Separates legal authority for processing from patient consent, HIPAA-style authorizations, treatment informed consent, privacy restrictions and objections.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/consent/README.md:63`) · MODELO (`Mantra Core Health Context/modules/diagram_07_consent.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /consent/consent-evidence` la atiende `ConsentEvidenceController.record` (src/modules/consent/controllers/consent-evidence.controller.ts:25). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateConsentEvidenceDto` (8 campos, 2 obligatorios). Delega en `ConsentEvidenceService.record`. Crea filas en consent.consent_evidence.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/consent/controllers/consent-evidence.controller.ts:25` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `consent.consent_evidence` | ESCRIBE | CREA | DIRECTA | ConsentEvidenceController.record → ConsentEvidenceService.record → ConsentEvidenceRepository.create | `src/modules/consent/repositories/consent-evidence.repository.ts:60` |

### Cuerpo — DTO `CreateConsentEvidenceDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `subjectType` | `string` | Sí | valores: CONSENT, HIPAA, OBJECTION, RESTRICTION, TREATMENT | `@IsIn(['CONSENT', 'HIPAA', 'OBJECTION', 'RESTRICTION', 'TREATMENT'])` | Tipo de sujeto de la evidencia | `src/modules/consent/dto/create-consent-evidence.dto.ts:18` |
| `subjectId` | `string` | Sí | formato uuid | `@IsUUID()` | Id de la fila a la que refiere la evidencia | `src/modules/consent/dto/create-consent-evidence.dto.ts:28` |
| `evidenceTypeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tipo de evidencia (concept id); por defecto firma | `src/modules/consent/dto/create-consent-evidence.dto.ts:38` |
| `documentFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Documento firmado (file id) | `src/modules/consent/dto/create-consent-evidence.dto.ts:49` |
| `signatureId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Firma clínica asociada (signature id) | `src/modules/consent/dto/create-consent-evidence.dto.ts:60` |
| `capturedChannelConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Canal de captura (concept id) | `src/modules/consent/dto/create-consent-evidence.dto.ts:71` |
| `policySnapshotHash` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Hash del snapshot de política | `src/modules/consent/dto/create-consent-evidence.dto.ts:80` |
| `evidenceHash` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Hash de la evidencia (integridad reproducible) | `src/modules/consent/dto/create-consent-evidence.dto.ts:91` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "subjectType": "CONSENT",
  "subjectId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<ConsentEvidenceResponseDto>` · DTO `ConsentEvidenceResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/consent/dto/responses.dto.ts:201` |
| `subjectId` | `string` | Sí | formato uuid | — | Identificador asociado a subject. | `src/modules/consent/dto/responses.dto.ts:207` |
| `recordedAt` | `string` | Sí | formato date-time | — | Valor de recorded at mantenido por la instancia. | `src/modules/consent/dto/responses.dto.ts:213` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/consent.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Consent (07 — Privacy Directives, Legal Bases and Consent Evidence) — etapa `UC-07-10`

---

## 2. POST /consent/consents

- **Origen:** CONTRATO
- **Nombre:** Capturar consentimiento de directiva de privacidad
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ConsentsController.capture` — `src/modules/consent/controllers/consents.controller.ts:43`

### Qué es y para qué sirve (negocio)

Capturar consentimiento de directiva de privacidad. Caso de uso UC-07-01: Capturar consentimiento de directiva de privacidad (+ provisiones + evento granted). Dentro del módulo (descripción del modelo, en inglés): «Separates legal authority for processing from patient consent, HIPAA-style authorizations, treatment informed consent, privacy restrictions and objections.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/consent/README.md:54`) · MODELO (`Mantra Core Health Context/modules/diagram_07_consent.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /consent/consents` la atiende `ConsentsController.capture` (src/modules/consent/controllers/consents.controller.ts:43). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateConsentDto` (21 campos, 2 obligatorios). Delega en `ConsentsService.capture`. Crea filas en consent.consent_events, consent.consent_provisions, consent.consents. Lee consent.consents.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/consent/controllers/consents.controller.ts:43` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `consent.consent_events` | ESCRIBE | CREA | DIRECTA | ConsentsController.capture → ConsentsService.capture → ConsentEventsRepository.record | `src/modules/consent/repositories/consent-events.repository.ts:55` |
| `consent.consent_provisions` | ESCRIBE | CREA | DIRECTA | ConsentsController.capture → ConsentsService.capture → ConsentsService.createProvision → ConsentProvisionsRepository.create | `src/modules/consent/repositories/consent-provisions.repository.ts:77` |
| `consent.consents` | ESCRIBE | CREA | DIRECTA | ConsentsController.capture → ConsentsService.capture → ConsentsRepository.create | `src/modules/consent/repositories/consents.repository.ts:150` |
| `consent.consents` | LEE | LEE | DIRECTA | ConsentsController.capture → ConsentsService.capture → ConsentsRepository.findActiveByPurpose | `src/modules/consent/repositories/consents.repository.ts:88` |

### Cuerpo — DTO `CreateConsentDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `patientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Paciente titular de los datos (patient profile id) | `src/modules/consent/dto/create-consent.dto.ts:25` |
| `processingPurposeId` | `string` | Sí | formato uuid | `@IsUUID()` | Propósito de procesamiento activo (processing_purpose id) | `src/modules/consent/dto/create-consent.dto.ts:35` |
| `processingLegalBasisId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Base legal de procesamiento vigente | `src/modules/consent/dto/create-consent.dto.ts:46` |
| `categoryConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Categoría del consentimiento (concept id); por defecto privacidad | `src/modules/consent/dto/create-consent.dto.ts:57` |
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tenant propietario | `src/modules/consent/dto/create-consent.dto.ts:65` |
| `grantedByUserId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Usuario que otorga (si no es representante) | `src/modules/consent/dto/create-consent.dto.ts:76` |
| `grantedByRelatedPersonId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Persona relacionada que otorga (representante legal) | `src/modules/consent/dto/create-consent.dto.ts:87` |
| `policyUri` | `string` | No | longitud máxima 2048 | `@IsOptional()` `@IsString()` `@MaxLength(2048)` | URI de la política aceptada | `src/modules/consent/dto/create-consent.dto.ts:96` |
| `policyVersion` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Versión de la política aceptada | `src/modules/consent/dto/create-consent.dto.ts:105` |
| `validFrom` | `string` | No | — | `@IsOptional()` `@IsISO8601()` | Inicio de vigencia (ISO-8601) | `src/modules/consent/dto/create-consent.dto.ts:113` |
| `validTo` | `string` | No | — | `@IsOptional()` `@IsISO8601()` | Fin de vigencia (ISO-8601) | `src/modules/consent/dto/create-consent.dto.ts:121` |
| `provisions` | `array<ConsentProvisionInputDto>` | No | máximo 50 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayMaxSize(50)` `@ValidateNested({ each: true })` `@Type(() => ConsentProvisionInputDto)` | Provisiones granulares iniciales | `src/modules/consent/dto/create-consent.dto.ts:135` |
| `provisions[].action` | `string` | No | valores: PERMIT, DENY | `@IsIn(['PERMIT', 'DENY'])` | Acción de la provisión | `src/modules/consent/dto/consent-provision.dto.ts:20` |
| `provisions[].dataClassConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Clase de datos afectada (concept id) | `src/modules/consent/dto/consent-provision.dto.ts:31` |
| `provisions[].actorUserId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Actor concreto autorizado/denegado (user id) | `src/modules/consent/dto/consent-provision.dto.ts:42` |
| `provisions[].actorRoleConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Rol del actor (concept id) | `src/modules/consent/dto/consent-provision.dto.ts:53` |
| `provisions[].purposeOfUseConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Propósito de uso (concept id) | `src/modules/consent/dto/consent-provision.dto.ts:64` |
| `provisions[].securityLabelConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Etiqueta de seguridad (concept id) | `src/modules/consent/dto/consent-provision.dto.ts:75` |
| `provisions[].validFrom` | `string` | No | — | `@IsOptional()` `@IsISO8601()` | Inicio de vigencia (ISO-8601) | `src/modules/consent/dto/consent-provision.dto.ts:83` |
| `provisions[].validTo` | `string` | No | — | `@IsOptional()` `@IsISO8601()` | Fin de vigencia (ISO-8601) | `src/modules/consent/dto/consent-provision.dto.ts:91` |
| `provisions[].provisionTypeConceptId` | `string` | No | — | `@IsOptional()` `@IsString()` | Tipo de provisión (concept id); por defecto la base | `src/modules/consent/dto/consent-provision.dto.ts:101` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "processingPurposeId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<ConsentResponseDto>` · DTO `ConsentResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/consent/dto/responses.dto.ts:9` |
| `patientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a patient profile. | `src/modules/consent/dto/responses.dto.ts:15` |
| `status` | `string` | Sí | formato uuid | — | Estado (concept id) | `src/modules/consent/dto/responses.dto.ts:21` |
| `processingPurposeId` | `string` | Sí | formato uuid | — | Identificador asociado a processing purpose. | `src/modules/consent/dto/responses.dto.ts:27` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/consent/dto/responses.dto.ts:33` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe un consentimiento activo para este propósito |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/consent.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/patient-access-revocation.int-spec.ts:73` |

### Flujos

- Módulo Consent (07 — Privacy Directives, Legal Bases and Consent Evidence) — etapa `UC-07-01`
- Consentimiento y acceso clínico — etapa `P1`

---

## 3. PATCH /consent/consents/{id}/provisions

- **Origen:** CONTRATO
- **Nombre:** Actualizar provisiones granulares (data class / actor / acción)
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ConsentsController.amendProvisions` — `src/modules/consent/controllers/consents.controller.ts:83`

### Qué es y para qué sirve (negocio)

Actualizar provisiones granulares (data class / actor / acción). Caso de uso UC-07-09: Actualizar provisiones granulares (soft-close + insert). Dentro del módulo (descripción del modelo, en inglés): «Separates legal authority for processing from patient consent, HIPAA-style authorizations, treatment informed consent, privacy restrictions and objections.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/consent/README.md:62`) · MODELO (`Mantra Core Health Context/modules/diagram_07_consent.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`PATCH /consent/consents/{id}/provisions` la atiende `ConsentsController.amendProvisions` (src/modules/consent/controllers/consents.controller.ts:83). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `AmendProvisionsDto` (10 campos, 2 obligatorios). Delega en `ConsentsService.amendProvisions`. Crea filas en consent.consent_events, consent.consent_provisions. Actualiza consent.consent_provisions. Lee consent.consent_provisions, consent.consents.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/consent/controllers/consents.controller.ts:83` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/consent/controllers/consents.controller.ts:83` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `consent.consent_events` | ESCRIBE | CREA | DIRECTA | ConsentsController.amendProvisions → ConsentsService.amendProvisions → ConsentEventsRepository.record | `src/modules/consent/repositories/consent-events.repository.ts:55` |
| `consent.consent_provisions` | ESCRIBE | ACTUALIZA | POR_TIPO | ConsentsController.amendProvisions → ConsentsService.amendProvisions | `src/modules/consent/services/consents.service.ts:232` |
| `consent.consent_provisions` | ESCRIBE | CREA | DIRECTA | ConsentsController.amendProvisions → ConsentsService.amendProvisions → ConsentsService.createProvision → ConsentProvisionsRepository.create | `src/modules/consent/repositories/consent-provisions.repository.ts:77` |
| `consent.consent_provisions` | LEE | LEE | DIRECTA | ConsentsController.amendProvisions → ConsentsService.amendProvisions → ConsentProvisionsRepository.findOpenByConsent | `src/modules/consent/repositories/consent-provisions.repository.ts:66` |
| `consent.consents` | LEE | LEE | DIRECTA | ConsentsController.amendProvisions → ConsentsService.amendProvisions → ConsentsRepository.findById | `src/modules/consent/repositories/consents.repository.ts:78` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `AmendProvisionsDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `provisions` | `array<ConsentProvisionInputDto>` | Sí | mínimo 1 elemento(s); máximo 50 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ArrayMaxSize(50)` `@ValidateNested({ each: true })` `@Type(() => ConsentProvisionInputDto)` | Provisiones nuevas que reemplazan a las vigentes | `src/modules/consent/dto/amend-provisions.dto.ts:25` |
| `provisions[].action` | `string` | Sí | valores: PERMIT, DENY | `@IsIn(['PERMIT', 'DENY'])` | Acción de la provisión | `src/modules/consent/dto/consent-provision.dto.ts:20` |
| `provisions[].dataClassConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Clase de datos afectada (concept id) | `src/modules/consent/dto/consent-provision.dto.ts:31` |
| `provisions[].actorUserId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Actor concreto autorizado/denegado (user id) | `src/modules/consent/dto/consent-provision.dto.ts:42` |
| `provisions[].actorRoleConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Rol del actor (concept id) | `src/modules/consent/dto/consent-provision.dto.ts:53` |
| `provisions[].purposeOfUseConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Propósito de uso (concept id) | `src/modules/consent/dto/consent-provision.dto.ts:64` |
| `provisions[].securityLabelConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Etiqueta de seguridad (concept id) | `src/modules/consent/dto/consent-provision.dto.ts:75` |
| `provisions[].validFrom` | `string` | No | — | `@IsOptional()` `@IsISO8601()` | Inicio de vigencia (ISO-8601) | `src/modules/consent/dto/consent-provision.dto.ts:83` |
| `provisions[].validTo` | `string` | No | — | `@IsOptional()` `@IsISO8601()` | Fin de vigencia (ISO-8601) | `src/modules/consent/dto/consent-provision.dto.ts:91` |
| `provisions[].provisionTypeConceptId` | `string` | No | — | `@IsOptional()` `@IsString()` | Tipo de provisión (concept id); por defecto la base | `src/modules/consent/dto/consent-provision.dto.ts:101` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "provisions": [
    {
      "action": "PERMIT"
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<StatusResultDto>` · DTO `StatusResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `ok` | `boolean` | Sí | — | — | true si la operación se aplicó | `src/modules/consent/dto/responses.dto.ts:222` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Consentimiento no encontrado |
| 409 | `CONFLICT` | ConflictException: El consentimiento no está activo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/consent.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Consent (07 — Privacy Directives, Legal Bases and Consent Evidence) — etapa `UC-07-09`

---

## 4. POST /consent/consents/{id}/withdraw

- **Origen:** CONTRATO
- **Nombre:** Revocar/retirar consentimiento y disparar re-evaluación de accesos
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ConsentsController.withdraw` — `src/modules/consent/controllers/consents.controller.ts:62`

### Qué es y para qué sirve (negocio)

Revocar/retirar consentimiento y disparar re-evaluación de accesos. Caso de uso UC-07-02: Retirar consentimiento y disparar re-evaluación de accesos. Dentro del módulo (descripción del modelo, en inglés): «Separates legal authority for processing from patient consent, HIPAA-style authorizations, treatment informed consent, privacy restrictions and objections.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/consent/README.md:55`) · MODELO (`Mantra Core Health Context/modules/diagram_07_consent.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /consent/consents/{id}/withdraw` la atiende `ConsentsController.withdraw` (src/modules/consent/controllers/consents.controller.ts:62). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `WithdrawConsentDto` (1 campo, 0 obligatorios). Delega en `ConsentsService.withdraw`. Crea filas en audit.audit_log, consent.consent_events. Actualiza authz.clinical_access_grants, consent.consents. Lee audit.audit_log, authz.clinical_access_grants, consent.consents, iam.sessions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/consent/controllers/consents.controller.ts:62` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/consent/controllers/consents.controller.ts:62` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | ConsentsController.withdraw → ConsentsService.withdraw → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | ConsentsController.withdraw → ConsentsService.withdraw → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `authz.clinical_access_grants` | ESCRIBE | ACTUALIZA | POR_TIPO | ConsentsController.withdraw → ConsentsService.withdraw → ClinicalAccessGrantsRepository.revokeForConsent | `src/modules/authz/repositories/clinical-access-grants.repository.ts:134` |
| `authz.clinical_access_grants` | LEE | LEE | DIRECTA | ConsentsController.withdraw → ConsentsService.withdraw → ClinicalAccessGrantsRepository.revokeForConsent → ClinicalAccessGrantsRepository.findActiveByConsent | `src/modules/authz/repositories/clinical-access-grants.repository.ts:114` |
| `consent.consent_events` | ESCRIBE | CREA | DIRECTA | ConsentsController.withdraw → ConsentsService.withdraw → ConsentEventsRepository.record | `src/modules/consent/repositories/consent-events.repository.ts:55` |
| `consent.consents` | ESCRIBE | ACTUALIZA | POR_TIPO | ConsentsController.withdraw → ConsentsService.withdraw | `src/modules/consent/services/consents.service.ts:157` |
| `consent.consents` | LEE | LEE | DIRECTA | ConsentsController.withdraw → ConsentsService.withdraw → ConsentsRepository.findById | `src/modules/consent/repositories/consents.repository.ts:78` |
| `iam.sessions` | LEE | LEE | POR_SQL | ConsentsController.withdraw → ConsentsService.withdraw → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `WithdrawConsentDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `withdrawalReasonConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Motivo de retiro (concept id) | `src/modules/consent/dto/withdraw-consent.dto.ts:15` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "withdrawalReasonConceptId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<StatusResultDto>` · DTO `StatusResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `ok` | `boolean` | Sí | — | — | true si la operación se aplicó | `src/modules/consent/dto/responses.dto.ts:222` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Consentimiento no encontrado |
| 409 | `CONFLICT` | ConflictException: El consentimiento no está activo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/consent.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Consent (07 — Privacy Directives, Legal Bases and Consent Evidence) — etapa `UC-07-02`
- Consentimiento y acceso clínico — etapa `A1`

---

## 5. GET /consent/encounters/{encounterId}/informed-consent

- **Origen:** CONTRATO
- **Nombre:** Consentimientos informados registrados en el encuentro
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `EncounterInformedConsentsController.list` — `src/modules/consent/controllers/encounter-informed-consents.controller.ts:61`

### Qué es y para qué sirve (negocio)

Consentimientos informados registrados en el encuentro. Dentro del módulo (descripción del modelo, en inglés): «Separates legal authority for processing from patient consent, HIPAA-style authorizations, treatment informed consent, privacy restrictions and objections.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_07_consent.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /consent/encounters/{encounterId}/informed-consent` la atiende `EncounterInformedConsentsController.list` (src/modules/consent/controllers/encounter-informed-consents.controller.ts:61). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Delega en `EncounterInformedConsentsService.listForEncounter`. Lee authz.access_policies, authz.care_relationships, authz.clinical_access_grants, authz.field_permissions, authz.patient_legal_representations, authz.permissions, authz.resource_scope_grants, authz.role_permissions y 12 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/consent/controllers/encounter-informed-consents.controller.ts:61` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: encounterId | `src/modules/consent/controllers/encounter-informed-consents.controller.ts:61` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.access_policies` | LEE | LEE | DIRECTA | EncounterInformedConsentsController.list → EncounterInformedConsentsService.listForEncounter → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AccessPoliciesRepository.findActiveForTarget | `src/modules/authz/repositories/access-policies.repository.ts:62` |
| `authz.care_relationships` | LEE | LEE | DIRECTA | EncounterInformedConsentsController.list → EncounterInformedConsentsService.listForEncounter → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → ClinicalReadService.hasCareCurrentRelation → CareRelationshipsRepository.findActiveForPractitionerPatient | `src/modules/authz/repositories/care-relationships.repository.ts:81` |
| `authz.clinical_access_grants` | LEE | LEE | DIRECTA | EncounterInformedConsentsController.list → EncounterInformedConsentsService.listForEncounter → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ClinicalAccessGrantsRepository.findActiveForUserPatient | `src/modules/authz/repositories/clinical-access-grants.repository.ts:90` |
| `authz.field_permissions` | LEE | LEE | DIRECTA | EncounterInformedConsentsController.list → EncounterInformedConsentsService.listForEncounter → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.computeMaskedFields → FieldPermissionsRepository.findForRoles | `src/modules/authz/repositories/field-permissions.repository.ts:61` |
| `authz.patient_legal_representations` | LEE | LEE | DIRECTA | EncounterInformedConsentsController.list → EncounterInformedConsentsService.listForEncounter → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PatientLegalRepresentationsRepository.findActiveForRepresentativePatient | `src/modules/authz/repositories/patient-legal-representations.repository.ts:78` |
| `authz.permissions` | LEE | LEE | DIRECTA | EncounterInformedConsentsController.list → EncounterInformedConsentsService.listForEncounter → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PermissionsRepository.findByResourceAction | `src/modules/authz/repositories/permissions.repository.ts:89` |
| `authz.resource_scope_grants` | LEE | LEE | DIRECTA | EncounterInformedConsentsController.list → EncounterInformedConsentsService.listForEncounter → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ResourceScopeGrantsRepository.findForSubjectResource | `src/modules/authz/repositories/resource-scope-grants.repository.ts:73` |
| `authz.role_permissions` | LEE | LEE | DIRECTA | EncounterInformedConsentsController.list → EncounterInformedConsentsService.listForEncounter → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → RolePermissionsRepository.findActiveForRoles | `src/modules/authz/repositories/role-permissions.repository.ts:47` |
| `authz.roles` | LEE | LEE | DIRECTA | EncounterInformedConsentsController.list → EncounterInformedConsentsService.listForEncounter → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.resolveRoleInheritance → RolesRepository.findById | `src/modules/authz/repositories/roles.repository.ts:61` |
| `authz.user_permission_grants` | LEE | LEE | DIRECTA | EncounterInformedConsentsController.list → EncounterInformedConsentsService.listForEncounter → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserPermissionGrantsRepository.findActiveForUser | `src/modules/authz/repositories/user-permission-grants.repository.ts:85` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | EncounterInformedConsentsController.list → EncounterInformedConsentsService.listForEncounter → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserRoleAssignmentsRepository.findActiveForUser | `src/modules/authz/repositories/user-role-assignments.repository.ts:102` |
| `clinical.encounters` | LEE | LEE | DIRECTA | EncounterInformedConsentsController.list → EncounterInformedConsentsService.listForEncounter → EncountersRepository.findById | `src/modules/clinical/repositories/encounters.repository.ts:169` |
| `consent.treatment_informed_consents` | LEE | LEE | DIRECTA | EncounterInformedConsentsController.list → EncounterInformedConsentsService.listForEncounter | `src/modules/consent/services/encounter-informed-consents.service.ts:112` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | EncounterInformedConsentsController.list → EncounterInformedConsentsService.listForEncounter → ClinicalReadService.assertCanReadHistory → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.patient_portal_proxies` | LEE | LEE | DIRECTA | EncounterInformedConsentsController.list → EncounterInformedConsentsService.listForEncounter → ClinicalReadService.assertCanReadHistory → ClinicalReadService.assertOwnRecord → PatientRepresentationService.representsPatient → PatientPortalProxiesRepository.findActiveByProxyUserAndPatient | `src/modules/profiles/infrastructure/repositories/patient-portal-proxies.repository.ts:233` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | EncounterInformedConsentsController.list → EncounterInformedConsentsService.listForEncounter → ClinicalReadService.assertCanReadHistory → ClinicalReadService.assertOwnRecord → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | EncounterInformedConsentsController.list → EncounterInformedConsentsService.listForEncounter → ClinicalReadService.assertCanReadHistory → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | EncounterInformedConsentsController.list → EncounterInformedConsentsService.listForEncounter → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:969` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | EncounterInformedConsentsController.list → EncounterInformedConsentsService.listForEncounter → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → ClinicalReadService.attendsToday → SchedulingBookingsRepository.findConfirmedWithPatientBetween | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:995` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | EncounterInformedConsentsController.list → EncounterInformedConsentsService.listForEncounter → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:969` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `encounterId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<MyTreatmentConsentListDto>` · DTO `MyTreatmentConsentListDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<MyTreatmentConsentDto>` | Sí | — | — | Consentimientos informados del titular. | `src/modules/consent/dto/consent-me.dto.ts:241` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador del registro. | `src/modules/consent/dto/consent-me.dto.ts:175` |
| `items[].encounterId` | `string` | Sí | formato uuid | — | Encuentro en el que se firmó. | `src/modules/consent/dto/consent-me.dto.ts:181` |
| `items[].decision` | `string` | Sí | valores: ACCEPTED, DECLINED, OTHER | — | `ACCEPTED` o `DECLINED`. | `src/modules/consent/dto/consent-me.dto.ts:187` |
| `items[].informationVersion` | `string` | No | — | — | Versión del material informativo. | `src/modules/consent/dto/consent-me.dto.ts:193` |
| `items[].signedAt` | `string` | No | formato date-time | — | Cuándo se firmó. | `src/modules/consent/dto/consent-me.dto.ts:199` |
| `items[].withdrawnAt` | `string` | No | formato date-time | — | Cuándo se retiró. | `src/modules/consent/dto/consent-me.dto.ts:205` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: {WITHOUT_ACCESS_TO_HISTORY} |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Encuentro no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/consent.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Consent (07 — Privacy Directives, Legal Bases and Consent Evidence) — etapa `ctrl:EncounterInformedConsentsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 6. POST /consent/encounters/{encounterId}/informed-consent

- **Origen:** CONTRATO
- **Nombre:** Registrar el consentimiento informado del encuentro
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `EncounterInformedConsentsController.register` — `src/modules/consent/controllers/encounter-informed-consents.controller.ts:42`

### Qué es y para qué sirve (negocio)

Registrar el consentimiento informado del encuentro. Dentro del módulo (descripción del modelo, en inglés): «Separates legal authority for processing from patient consent, HIPAA-style authorizations, treatment informed consent, privacy restrictions and objections.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_07_consent.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /consent/encounters/{encounterId}/informed-consent` la atiende `EncounterInformedConsentsController.register` (src/modules/consent/controllers/encounter-informed-consents.controller.ts:42). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `RegisterEncounterInformedConsentDto` (5 campos, 1 obligatorio). Delega en `EncounterInformedConsentsService.register`. Crea filas en consent.consent_events, consent.treatment_informed_consents. Lee authz.access_policies, authz.care_relationships, authz.clinical_access_grants, authz.field_permissions, authz.patient_legal_representations, authz.permissions, authz.resource_scope_grants, authz.role_permissions y 9 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/consent/controllers/encounter-informed-consents.controller.ts:42` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: encounterId | `src/modules/consent/controllers/encounter-informed-consents.controller.ts:42` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.access_policies` | LEE | LEE | DIRECTA | EncounterInformedConsentsController.register → EncounterInformedConsentsService.register → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AccessPoliciesRepository.findActiveForTarget | `src/modules/authz/repositories/access-policies.repository.ts:62` |
| `authz.care_relationships` | LEE | LEE | DIRECTA | EncounterInformedConsentsController.register → EncounterInformedConsentsService.register → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → ClinicalReadService.hasCareCurrentRelation → CareRelationshipsRepository.findActiveForPractitionerPatient | `src/modules/authz/repositories/care-relationships.repository.ts:81` |
| `authz.clinical_access_grants` | LEE | LEE | DIRECTA | EncounterInformedConsentsController.register → EncounterInformedConsentsService.register → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ClinicalAccessGrantsRepository.findActiveForUserPatient | `src/modules/authz/repositories/clinical-access-grants.repository.ts:90` |
| `authz.field_permissions` | LEE | LEE | DIRECTA | EncounterInformedConsentsController.register → EncounterInformedConsentsService.register → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.computeMaskedFields → FieldPermissionsRepository.findForRoles | `src/modules/authz/repositories/field-permissions.repository.ts:61` |
| `authz.patient_legal_representations` | LEE | LEE | DIRECTA | EncounterInformedConsentsController.register → EncounterInformedConsentsService.register → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PatientLegalRepresentationsRepository.findActiveForRepresentativePatient | `src/modules/authz/repositories/patient-legal-representations.repository.ts:78` |
| `authz.permissions` | LEE | LEE | DIRECTA | EncounterInformedConsentsController.register → EncounterInformedConsentsService.register → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PermissionsRepository.findByResourceAction | `src/modules/authz/repositories/permissions.repository.ts:89` |
| `authz.resource_scope_grants` | LEE | LEE | DIRECTA | EncounterInformedConsentsController.register → EncounterInformedConsentsService.register → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ResourceScopeGrantsRepository.findForSubjectResource | `src/modules/authz/repositories/resource-scope-grants.repository.ts:73` |
| `authz.role_permissions` | LEE | LEE | DIRECTA | EncounterInformedConsentsController.register → EncounterInformedConsentsService.register → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → RolePermissionsRepository.findActiveForRoles | `src/modules/authz/repositories/role-permissions.repository.ts:47` |
| `authz.roles` | LEE | LEE | DIRECTA | EncounterInformedConsentsController.register → EncounterInformedConsentsService.register → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.resolveRoleInheritance → RolesRepository.findById | `src/modules/authz/repositories/roles.repository.ts:61` |
| `authz.user_permission_grants` | LEE | LEE | DIRECTA | EncounterInformedConsentsController.register → EncounterInformedConsentsService.register → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserPermissionGrantsRepository.findActiveForUser | `src/modules/authz/repositories/user-permission-grants.repository.ts:85` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | EncounterInformedConsentsController.register → EncounterInformedConsentsService.register → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserRoleAssignmentsRepository.findActiveForUser | `src/modules/authz/repositories/user-role-assignments.repository.ts:102` |
| `clinical.encounters` | LEE | LEE | DIRECTA | EncounterInformedConsentsController.register → EncounterInformedConsentsService.register → EncountersRepository.findById | `src/modules/clinical/repositories/encounters.repository.ts:169` |
| `consent.consent_events` | ESCRIBE | CREA | DIRECTA | EncounterInformedConsentsController.register → EncounterInformedConsentsService.register → TreatmentInformedConsentsService.sign → ConsentEventsRepository.record | `src/modules/consent/repositories/consent-events.repository.ts:55` |
| `consent.treatment_informed_consents` | ESCRIBE | CREA | DIRECTA | EncounterInformedConsentsController.register → EncounterInformedConsentsService.register → TreatmentInformedConsentsService.sign → TreatmentInformedConsentsRepository.create | `src/modules/consent/repositories/treatment-informed-consents.repository.ts:82` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | EncounterInformedConsentsController.register → EncounterInformedConsentsService.register → ClinicalReadService.assertCanWriteHistory → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | EncounterInformedConsentsController.register → EncounterInformedConsentsService.register → ClinicalReadService.assertCanWriteHistory → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | EncounterInformedConsentsController.register → EncounterInformedConsentsService.register → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:969` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | EncounterInformedConsentsController.register → EncounterInformedConsentsService.register → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → ClinicalReadService.attendsToday → SchedulingBookingsRepository.findConfirmedWithPatientBetween | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:995` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | EncounterInformedConsentsController.register → EncounterInformedConsentsService.register → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:969` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `encounterId` | path | Sí | `string` | — |

### Cuerpo — DTO `RegisterEncounterInformedConsentDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `decision` | `string` | Sí | valores: ACCEPTED, DECLINED | `@IsIn(['ACCEPTED', 'DECLINED'])` | Decisión del paciente | `src/modules/consent/dto/create-treatment-informed-consent.dto.ts:37` |
| `procedureCodeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Código de procedimiento (concept id) | `src/modules/consent/dto/create-treatment-informed-consent.dto.ts:48` |
| `informationVersion` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Versión del material informativo vigente | `src/modules/consent/dto/create-treatment-informed-consent.dto.ts:59` |
| `interpreterUserId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Intérprete presente (user id) | `src/modules/consent/dto/create-treatment-informed-consent.dto.ts:70` |
| `witnessUserId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Testigo (user id) | `src/modules/consent/dto/create-treatment-informed-consent.dto.ts:78` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "decision": "ACCEPTED"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "decision": "ACCEPTED",
  "procedureCodeConceptId": "00000000-0000-4000-8000-000000000001",
  "informationVersion": "valor-ejemplo",
  "interpreterUserId": "00000000-0000-4000-8000-000000000001",
  "witnessUserId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<TreatmentInformedConsentResponseDto>` · DTO `TreatmentInformedConsentResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/consent/dto/responses.dto.ts:168` |
| `patientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a patient profile. | `src/modules/consent/dto/responses.dto.ts:174` |
| `status` | `string` | Sí | formato uuid | — | Estado (concept id) | `src/modules/consent/dto/responses.dto.ts:180` |
| `decision` | `string` | Sí | formato uuid | — | Decisión (concept id) | `src/modules/consent/dto/responses.dto.ts:186` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/consent/dto/responses.dto.ts:192` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: {WITHOUT_ACCESS_TO_HISTORY} |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Encuentro no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/consent.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Consent (07 — Privacy Directives, Legal Bases and Consent Evidence) — etapa `ctrl:EncounterInformedConsentsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 7. POST /consent/hipaa-authorizations

- **Origen:** CONTRATO
- **Nombre:** Otorgar autorización HIPAA de divulgación
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `HipaaAuthorizationsController.grant` — `src/modules/consent/controllers/hipaa-authorizations.controller.ts:37`

### Qué es y para qué sirve (negocio)

Otorgar autorización HIPAA de divulgación. Caso de uso UC-07-04: Otorgar autorización HIPAA de divulgación. Dentro del módulo (descripción del modelo, en inglés): «Separates legal authority for processing from patient consent, HIPAA-style authorizations, treatment informed consent, privacy restrictions and objections.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/consent/README.md:57`) · MODELO (`Mantra Core Health Context/modules/diagram_07_consent.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /consent/hipaa-authorizations` la atiende `HipaaAuthorizationsController.grant` (src/modules/consent/controllers/hipaa-authorizations.controller.ts:37). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateHipaaAuthorizationDto` (8 campos, 5 obligatorios). Delega en `HipaaAuthorizationsService.grant`. Crea filas en consent.consent_events, consent.hipaa_authorizations.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/consent/controllers/hipaa-authorizations.controller.ts:37` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `consent.consent_events` | ESCRIBE | CREA | DIRECTA | HipaaAuthorizationsController.grant → HipaaAuthorizationsService.grant → ConsentEventsRepository.record | `src/modules/consent/repositories/consent-events.repository.ts:55` |
| `consent.hipaa_authorizations` | ESCRIBE | CREA | DIRECTA | HipaaAuthorizationsController.grant → HipaaAuthorizationsService.grant → HipaaAuthorizationsRepository.create | `src/modules/consent/repositories/hipaa-authorizations.repository.ts:91` |

### Cuerpo — DTO `CreateHipaaAuthorizationDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `patientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Paciente titular (patient profile id) | `src/modules/consent/dto/create-hipaa-authorization.dto.ts:24` |
| `processingPurposeId` | `string` | Sí | formato uuid | `@IsUUID()` | Propósito de procesamiento activo | `src/modules/consent/dto/create-hipaa-authorization.dto.ts:34` |
| `recipientDescription` | `string` | Sí | longitud máxima 500 | `@IsString()` `@MaxLength(500)` | Descripción del destinatario de la divulgación | `src/modules/consent/dto/create-hipaa-authorization.dto.ts:44` |
| `informationDescription` | `string` | Sí | longitud máxima 4000 | `@IsString()` `@MaxLength(4000)` | Descripción de la información a divulgar | `src/modules/consent/dto/create-hipaa-authorization.dto.ts:52` |
| `expirationType` | `string` | Sí | valores: DATE, EVENT | `@IsIn(['DATE', 'EVENT'])` | Tipo de expiración | `src/modules/consent/dto/create-hipaa-authorization.dto.ts:59` |
| `expiresAt` | `string` | No | — | `@IsOptional()` `@IsISO8601()` | Fecha de expiración (ISO-8601) si expirationType=DATE | `src/modules/consent/dto/create-hipaa-authorization.dto.ts:69` |
| `expirationEventText` | `string` | No | longitud máxima 1000 | `@IsOptional()` `@IsString()` `@MaxLength(1000)` | Evento de expiración si expirationType=EVENT | `src/modules/consent/dto/create-hipaa-authorization.dto.ts:80` |
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tenant propietario | `src/modules/consent/dto/create-hipaa-authorization.dto.ts:88` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "processingPurposeId": "00000000-0000-4000-8000-000000000001",
  "recipientDescription": "Texto descriptivo de ejemplo",
  "informationDescription": "Texto descriptivo de ejemplo",
  "expirationType": "DATE"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<HipaaAuthorizationResponseDto>` · DTO `HipaaAuthorizationResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/consent/dto/responses.dto.ts:42` |
| `patientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a patient profile. | `src/modules/consent/dto/responses.dto.ts:48` |
| `status` | `string` | Sí | formato uuid | — | Estado (concept id) | `src/modules/consent/dto/responses.dto.ts:54` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/consent/dto/responses.dto.ts:60` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: expiresAt es obligatorio cuando expirationType=DATE; PreconditionFailedException: expirationEventText es obligatorio cuando expirationType=EVENT |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/consent.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Consent (07 — Privacy Directives, Legal Bases and Consent Evidence) — etapa `UC-07-04`
- Consentimiento y acceso clínico — etapa `A3`

---

## 8. POST /consent/hipaa-authorizations/{id}/revoke

- **Origen:** CONTRATO
- **Nombre:** Revocar autorización HIPAA
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `HipaaAuthorizationsController.revoke` — `src/modules/consent/controllers/hipaa-authorizations.controller.ts:54`

### Qué es y para qué sirve (negocio)

Revocar autorización HIPAA. Caso de uso UC-07-05: Revocar autorización HIPAA. Dentro del módulo (descripción del modelo, en inglés): «Separates legal authority for processing from patient consent, HIPAA-style authorizations, treatment informed consent, privacy restrictions and objections.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/consent/README.md:58`) · MODELO (`Mantra Core Health Context/modules/diagram_07_consent.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /consent/hipaa-authorizations/{id}/revoke` la atiende `HipaaAuthorizationsController.revoke` (src/modules/consent/controllers/hipaa-authorizations.controller.ts:54). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `HipaaAuthorizationsService.revoke`. Crea filas en consent.consent_events. Actualiza consent.hipaa_authorizations. Lee consent.hipaa_authorizations.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/consent/controllers/hipaa-authorizations.controller.ts:54` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/consent/controllers/hipaa-authorizations.controller.ts:54` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `consent.consent_events` | ESCRIBE | CREA | DIRECTA | HipaaAuthorizationsController.revoke → HipaaAuthorizationsService.revoke → ConsentEventsRepository.record | `src/modules/consent/repositories/consent-events.repository.ts:55` |
| `consent.hipaa_authorizations` | ESCRIBE | ACTUALIZA | POR_TIPO | HipaaAuthorizationsController.revoke → HipaaAuthorizationsService.revoke | `src/modules/consent/services/hipaa-authorizations.service.ts:136` |
| `consent.hipaa_authorizations` | LEE | LEE | DIRECTA | HipaaAuthorizationsController.revoke → HipaaAuthorizationsService.revoke → HipaaAuthorizationsRepository.findById | `src/modules/consent/repositories/hipaa-authorizations.repository.ts:65` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<StatusResultDto>` · DTO `StatusResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `ok` | `boolean` | Sí | — | — | true si la operación se aplicó | `src/modules/consent/dto/responses.dto.ts:222` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Autorización HIPAA no encontrada |
| 409 | `CONFLICT` | ConflictException: La autorización no está activa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/consent.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Consent (07 — Privacy Directives, Legal Bases and Consent Evidence) — etapa `UC-07-05`
- Consentimiento y acceso clínico — etapa `A3`

---

## 9. POST /consent/internal/expiration-sweep

- **Origen:** CONTRATO
- **Nombre:** Expirar consentimientos y autorizaciones vencidas (barrido)
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ConsentSweepController.sweep` — `src/modules/consent/controllers/consent-sweep.controller.ts:29`

### Qué es y para qué sirve (negocio)

Expirar consentimientos y autorizaciones vencidas (barrido). Caso de uso UC-07-11: Barrido de expiraciones (worker). Dentro del módulo (descripción del modelo, en inglés): «Separates legal authority for processing from patient consent, HIPAA-style authorizations, treatment informed consent, privacy restrictions and objections.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/consent/README.md:64`) · MODELO (`Mantra Core Health Context/modules/diagram_07_consent.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /consent/internal/expiration-sweep` la atiende `ConsentSweepController.sweep` (src/modules/consent/controllers/consent-sweep.controller.ts:29). Exige sesión con alguno de los roles SYSTEM, SECURITY_ADMIN. Delega en `ConsentSweepService.sweep`. Crea filas en consent.consent_events. Actualiza consent.consents, consent.hipaa_authorizations, consent.privacy_restrictions. Lee consent.consents, consent.hipaa_authorizations, consent.privacy_restrictions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, SECURITY_ADMIN | `src/modules/consent/controllers/consent-sweep.controller.ts:29` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `consent.consent_events` | ESCRIBE | CREA | DIRECTA | ConsentSweepController.sweep → ConsentSweepService.sweep → ConsentEventsRepository.record | `src/modules/consent/repositories/consent-events.repository.ts:55` |
| `consent.consents` | ESCRIBE | ACTUALIZA | POR_TIPO | ConsentSweepController.sweep → ConsentSweepService.sweep | `src/modules/consent/services/consent-sweep.service.ts:59` |
| `consent.consents` | LEE | LEE | DIRECTA | ConsentSweepController.sweep → ConsentSweepService.sweep → ConsentsRepository.findExpirable | `src/modules/consent/repositories/consents.repository.ts:136` |
| `consent.hipaa_authorizations` | ESCRIBE | ACTUALIZA | POR_TIPO | ConsentSweepController.sweep → ConsentSweepService.sweep | `src/modules/consent/services/consent-sweep.service.ts:77` |
| `consent.hipaa_authorizations` | LEE | LEE | DIRECTA | ConsentSweepController.sweep → ConsentSweepService.sweep → HipaaAuthorizationsRepository.findExpirable | `src/modules/consent/repositories/hipaa-authorizations.repository.ts:74` |
| `consent.privacy_restrictions` | ESCRIBE | ACTUALIZA | POR_TIPO | ConsentSweepController.sweep → ConsentSweepService.sweep | `src/modules/consent/services/consent-sweep.service.ts:95` |
| `consent.privacy_restrictions` | LEE | LEE | DIRECTA | ConsentSweepController.sweep → ConsentSweepService.sweep → PrivacyRestrictionsRepository.findExpirable | `src/modules/consent/repositories/privacy-restrictions.repository.ts:86` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ExpirationSweepResultDto>` · DTO `ExpirationSweepResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `expiredConsents` | `number` | Sí | — | — | Consentimientos expirados | `src/modules/consent/dto/responses.dto.ts:231` |
| `expiredAuthorizations` | `number` | Sí | — | — | Autorizaciones HIPAA expiradas | `src/modules/consent/dto/responses.dto.ts:237` |
| `expiredRestrictions` | `number` | Sí | — | — | Restricciones de privacidad expiradas | `src/modules/consent/dto/responses.dto.ts:243` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/consent.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Consent (07 — Privacy Directives, Legal Bases and Consent Evidence) — etapa `UC-07-11`
- Consentimiento y acceso clínico — etapa `A4`

---

## 10. GET /consent/me/consents

- **Origen:** CONTRATO
- **Nombre:** Mis consentimientos (vigentes y retirados)
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ConsentMeController.listConsents` — `src/modules/consent/controllers/consent-me.controller.ts:47`

### Qué es y para qué sirve (negocio)

Mis consentimientos (vigentes y retirados). Dentro del módulo (descripción del modelo, en inglés): «Separates legal authority for processing from patient consent, HIPAA-style authorizations, treatment informed consent, privacy restrictions and objections.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_07_consent.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /consent/me/consents` la atiende `ConsentMeController.listConsents` (src/modules/consent/controllers/consent-me.controller.ts:47). Exige sesión con alguno de los roles PATIENT. Delega en `ConsentMeService.listConsents`. Lee consent.consents, consent.processing_purposes, profiles.patient_profiles, profiles.person_account_links.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PATIENT | `src/modules/consent/controllers/consent-me.controller.ts:47` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `consent.consents` | LEE | LEE | DIRECTA | ConsentMeController.listConsents → ConsentMeService.listConsents | `src/modules/consent/services/consent-me.service.ts:87` |
| `consent.processing_purposes` | LEE | LEE | DIRECTA | ConsentMeController.listConsents → ConsentMeService.listConsents → ConsentMeService.purposesById | `src/modules/consent/services/consent-me.service.ts:301` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | ConsentMeController.listConsents → ConsentMeService.listConsents → ConsentMeService.ownPatientProfileId → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ConsentMeController.listConsents → ConsentMeService.listConsents → ConsentMeService.ownPatientProfileId → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<MyConsentListDto>` · DTO `MyConsentListDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<MyConsentDto>` | Sí | — | — | Registros del titular, del más reciente al más antiguo. | `src/modules/consent/dto/consent-me.dto.ts:214` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador del consentimiento (el que se pasa a `withdraw`). | `src/modules/consent/dto/consent-me.dto.ts:34` |
| `items[].state` | `string` | Sí | valores: ACTIVE, WITHDRAWN, EXPIRED, OTHER | — | Estado legible. | `src/modules/consent/dto/consent-me.dto.ts:40` |
| `items[].purpose` | `ConsentPurposeDto` | Sí | — | — | Propósito del consentimiento. | `src/modules/consent/dto/consent-me.dto.ts:46` |
| `items[].purpose.id` | `string` | Sí | formato uuid | — | Identificador del propósito. | `src/modules/consent/dto/consent-me.dto.ts:13` |
| `items[].purpose.code` | `string` | No | — | — | Código estable del propósito. | `src/modules/consent/dto/consent-me.dto.ts:19` |
| `items[].purpose.name` | `string` | No | — | — | Nombre del propósito, para mostrarlo tal cual. | `src/modules/consent/dto/consent-me.dto.ts:25` |
| `items[].validFrom` | `string` | No | formato date-time | — | Inicio de la vigencia. | `src/modules/consent/dto/consent-me.dto.ts:52` |
| `items[].validTo` | `string` | No | formato date-time | — | Fin de la vigencia (se cierra al retirarlo). | `src/modules/consent/dto/consent-me.dto.ts:58` |
| `items[].withdrawnAt` | `string` | No | formato date-time | — | Cuándo se retiró, si se retiró. | `src/modules/consent/dto/consent-me.dto.ts:64` |
| `items[].policyVersion` | `string` | No | — | — | Versión de la política aceptada. | `src/modules/consent/dto/consent-me.dto.ts:70` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | Alta del registro. | `src/modules/consent/dto/consent-me.dto.ts:76` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/consent.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/patient-access-revocation.int-spec.ts:83` |

### Flujos

- Módulo Consent (07 — Privacy Directives, Legal Bases and Consent Evidence) — etapa `ctrl:ConsentMeController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 11. POST /consent/me/consents/{id}/withdraw

- **Origen:** CONTRATO
- **Nombre:** Retirar uno de mis consentimientos
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ConsentMeController.withdraw` — `src/modules/consent/controllers/consent-me.controller.ts:83`

### Qué es y para qué sirve (negocio)

Retirar uno de mis consentimientos. Dentro del módulo (descripción del modelo, en inglés): «Separates legal authority for processing from patient consent, HIPAA-style authorizations, treatment informed consent, privacy restrictions and objections.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_07_consent.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /consent/me/consents/{id}/withdraw` la atiende `ConsentMeController.withdraw` (src/modules/consent/controllers/consent-me.controller.ts:83). Exige sesión con alguno de los roles PATIENT. Valida el cuerpo como `WithdrawConsentDto` (1 campo, 0 obligatorios). Delega en `ConsentMeService.withdrawOwn`. Crea filas en audit.audit_log, consent.consent_events. Actualiza authz.clinical_access_grants, consent.consents. Lee audit.audit_log, authz.clinical_access_grants, consent.consents, iam.sessions, profiles.patient_profiles, profiles.person_account_links.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PATIENT | `src/modules/consent/controllers/consent-me.controller.ts:83` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/consent/controllers/consent-me.controller.ts:83` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | ConsentMeController.withdraw → ConsentMeService.withdrawOwn → ConsentsService.withdraw → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | ConsentMeController.withdraw → ConsentMeService.withdrawOwn → ConsentsService.withdraw → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `authz.clinical_access_grants` | ESCRIBE | ACTUALIZA | POR_TIPO | ConsentMeController.withdraw → ConsentMeService.withdrawOwn → ConsentsService.withdraw → ClinicalAccessGrantsRepository.revokeForConsent | `src/modules/authz/repositories/clinical-access-grants.repository.ts:134` |
| `authz.clinical_access_grants` | LEE | LEE | DIRECTA | ConsentMeController.withdraw → ConsentMeService.withdrawOwn → ConsentsService.withdraw → ClinicalAccessGrantsRepository.revokeForConsent → ClinicalAccessGrantsRepository.findActiveByConsent | `src/modules/authz/repositories/clinical-access-grants.repository.ts:114` |
| `consent.consent_events` | ESCRIBE | CREA | DIRECTA | ConsentMeController.withdraw → ConsentMeService.withdrawOwn → ConsentsService.withdraw → ConsentEventsRepository.record | `src/modules/consent/repositories/consent-events.repository.ts:55` |
| `consent.consents` | ESCRIBE | ACTUALIZA | POR_TIPO | ConsentMeController.withdraw → ConsentMeService.withdrawOwn → ConsentsService.withdraw | `src/modules/consent/services/consents.service.ts:157` |
| `consent.consents` | LEE | LEE | DIRECTA | ConsentMeController.withdraw → ConsentMeService.withdrawOwn | `src/modules/consent/services/consent-me.service.ts:251` |
| `iam.sessions` | LEE | LEE | POR_SQL | ConsentMeController.withdraw → ConsentMeService.withdrawOwn → ConsentsService.withdraw → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | ConsentMeController.withdraw → ConsentMeService.withdrawOwn → ConsentMeService.ownPatientProfileId → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ConsentMeController.withdraw → ConsentMeService.withdrawOwn → ConsentMeService.ownPatientProfileId → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `WithdrawConsentDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `withdrawalReasonConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Motivo de retiro (concept id) | `src/modules/consent/dto/withdraw-consent.dto.ts:15` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "withdrawalReasonConceptId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<StatusResultDto>` · DTO `StatusResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `ok` | `boolean` | Sí | — | — | true si la operación se aplicó | `src/modules/consent/dto/responses.dto.ts:222` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Consentimiento no encontrado |
| 409 | `CONFLICT` | ConflictException: El consentimiento no está activo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/consent.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/patient-access-revocation.int-spec.ts:91` |

### Flujos

- Módulo Consent (07 — Privacy Directives, Legal Bases and Consent Evidence) — etapa `ctrl:ConsentMeController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 12. GET /consent/me/hipaa-authorizations

- **Origen:** CONTRATO
- **Nombre:** Mis autorizaciones de divulgación
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ConsentMeController.listHipaaAuthorizations` — `src/modules/consent/controllers/consent-me.controller.ts:56`

### Qué es y para qué sirve (negocio)

Mis autorizaciones de divulgación. Dentro del módulo (descripción del modelo, en inglés): «Separates legal authority for processing from patient consent, HIPAA-style authorizations, treatment informed consent, privacy restrictions and objections.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_07_consent.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /consent/me/hipaa-authorizations` la atiende `ConsentMeController.listHipaaAuthorizations` (src/modules/consent/controllers/consent-me.controller.ts:56). Exige sesión con alguno de los roles PATIENT. Delega en `ConsentMeService.listHipaaAuthorizations`. Lee consent.hipaa_authorizations, consent.processing_purposes, profiles.patient_profiles, profiles.person_account_links.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PATIENT | `src/modules/consent/controllers/consent-me.controller.ts:56` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `consent.hipaa_authorizations` | LEE | LEE | DIRECTA | ConsentMeController.listHipaaAuthorizations → ConsentMeService.listHipaaAuthorizations | `src/modules/consent/services/consent-me.service.ts:128` |
| `consent.processing_purposes` | LEE | LEE | DIRECTA | ConsentMeController.listHipaaAuthorizations → ConsentMeService.listHipaaAuthorizations → ConsentMeService.purposesById | `src/modules/consent/services/consent-me.service.ts:301` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | ConsentMeController.listHipaaAuthorizations → ConsentMeService.listHipaaAuthorizations → ConsentMeService.ownPatientProfileId → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ConsentMeController.listHipaaAuthorizations → ConsentMeService.listHipaaAuthorizations → ConsentMeService.ownPatientProfileId → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<MyHipaaAuthorizationListDto>` · DTO `MyHipaaAuthorizationListDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<MyHipaaAuthorizationDto>` | Sí | — | — | Autorizaciones del titular. | `src/modules/consent/dto/consent-me.dto.ts:223` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador de la autorización. | `src/modules/consent/dto/consent-me.dto.ts:85` |
| `items[].state` | `string` | Sí | valores: ACTIVE, WITHDRAWN, EXPIRED, OTHER | — | Estado legible. | `src/modules/consent/dto/consent-me.dto.ts:91` |
| `items[].purpose` | `ConsentPurposeDto` | Sí | — | — | Propósito. | `src/modules/consent/dto/consent-me.dto.ts:97` |
| `items[].purpose.id` | `string` | Sí | formato uuid | — | Identificador del propósito. | `src/modules/consent/dto/consent-me.dto.ts:13` |
| `items[].purpose.code` | `string` | No | — | — | Código estable del propósito. | `src/modules/consent/dto/consent-me.dto.ts:19` |
| `items[].purpose.name` | `string` | No | — | — | Nombre del propósito, para mostrarlo tal cual. | `src/modules/consent/dto/consent-me.dto.ts:25` |
| `items[].recipientDescription` | `string` | Sí | — | — | A quién se divulga. | `src/modules/consent/dto/consent-me.dto.ts:103` |
| `items[].informationDescription` | `string` | Sí | — | — | Qué información se divulga. | `src/modules/consent/dto/consent-me.dto.ts:109` |
| `items[].expiresAt` | `string` | No | formato date-time | — | Cuándo vence. | `src/modules/consent/dto/consent-me.dto.ts:115` |
| `items[].signedAt` | `string` | No | formato date-time | — | Cuándo se firmó. | `src/modules/consent/dto/consent-me.dto.ts:121` |
| `items[].revokedAt` | `string` | No | formato date-time | — | Cuándo se revocó. | `src/modules/consent/dto/consent-me.dto.ts:127` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/consent.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Consent (07 — Privacy Directives, Legal Bases and Consent Evidence) — etapa `ctrl:ConsentMeController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 13. GET /consent/me/objections

- **Origen:** CONTRATO
- **Nombre:** Mis objeciones (abiertas y resueltas)
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ConsentMeController.listObjections` — `src/modules/consent/controllers/consent-me.controller.ts:65`

### Qué es y para qué sirve (negocio)

Mis objeciones (abiertas y resueltas). Dentro del módulo (descripción del modelo, en inglés): «Separates legal authority for processing from patient consent, HIPAA-style authorizations, treatment informed consent, privacy restrictions and objections.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_07_consent.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /consent/me/objections` la atiende `ConsentMeController.listObjections` (src/modules/consent/controllers/consent-me.controller.ts:65). Exige sesión con alguno de los roles PATIENT. Delega en `ConsentMeService.listObjections`. Lee consent.patient_objections, consent.processing_purposes, profiles.patient_profiles, profiles.person_account_links.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PATIENT | `src/modules/consent/controllers/consent-me.controller.ts:65` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `consent.patient_objections` | LEE | LEE | DIRECTA | ConsentMeController.listObjections → ConsentMeService.listObjections | `src/modules/consent/services/consent-me.service.ts:171` |
| `consent.processing_purposes` | LEE | LEE | DIRECTA | ConsentMeController.listObjections → ConsentMeService.listObjections → ConsentMeService.purposesById | `src/modules/consent/services/consent-me.service.ts:301` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | ConsentMeController.listObjections → ConsentMeService.listObjections → ConsentMeService.ownPatientProfileId → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ConsentMeController.listObjections → ConsentMeService.listObjections → ConsentMeService.ownPatientProfileId → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<MyObjectionListDto>` · DTO `MyObjectionListDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<MyObjectionDto>` | Sí | — | — | Objeciones del titular. | `src/modules/consent/dto/consent-me.dto.ts:232` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador de la objeción. | `src/modules/consent/dto/consent-me.dto.ts:136` |
| `items[].state` | `string` | Sí | valores: RAISED, RESOLVED, OTHER | — | `RAISED` si sigue abierta, `RESOLVED` si ya se resolvió. | `src/modules/consent/dto/consent-me.dto.ts:142` |
| `items[].purpose` | `ConsentPurposeDto` | Sí | — | — | Propósito objetado. | `src/modules/consent/dto/consent-me.dto.ts:148` |
| `items[].purpose.id` | `string` | Sí | formato uuid | — | Identificador del propósito. | `src/modules/consent/dto/consent-me.dto.ts:13` |
| `items[].purpose.code` | `string` | No | — | — | Código estable del propósito. | `src/modules/consent/dto/consent-me.dto.ts:19` |
| `items[].purpose.name` | `string` | No | — | — | Nombre del propósito, para mostrarlo tal cual. | `src/modules/consent/dto/consent-me.dto.ts:25` |
| `items[].reasonText` | `string` | No | — | — | Motivo declarado. | `src/modules/consent/dto/consent-me.dto.ts:154` |
| `items[].raisedAt` | `string` | No | formato date-time | — | Cuándo se planteó. | `src/modules/consent/dto/consent-me.dto.ts:160` |
| `items[].resolvedAt` | `string` | No | formato date-time | — | Cuándo se resolvió. | `src/modules/consent/dto/consent-me.dto.ts:166` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/consent.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Consent (07 — Privacy Directives, Legal Bases and Consent Evidence) — etapa `ctrl:ConsentMeController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 14. GET /consent/me/treatment-informed-consents

- **Origen:** CONTRATO
- **Nombre:** Mis consentimientos informados de tratamiento
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ConsentMeController.listTreatmentConsents` — `src/modules/consent/controllers/consent-me.controller.ts:74`

### Qué es y para qué sirve (negocio)

Mis consentimientos informados de tratamiento. Dentro del módulo (descripción del modelo, en inglés): «Separates legal authority for processing from patient consent, HIPAA-style authorizations, treatment informed consent, privacy restrictions and objections.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_07_consent.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /consent/me/treatment-informed-consents` la atiende `ConsentMeController.listTreatmentConsents` (src/modules/consent/controllers/consent-me.controller.ts:74). Exige sesión con alguno de los roles PATIENT. Delega en `ConsentMeService.listTreatmentConsents`. Lee consent.treatment_informed_consents, profiles.patient_profiles, profiles.person_account_links.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PATIENT | `src/modules/consent/controllers/consent-me.controller.ts:74` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `consent.treatment_informed_consents` | LEE | LEE | DIRECTA | ConsentMeController.listTreatmentConsents → ConsentMeService.listTreatmentConsents | `src/modules/consent/services/consent-me.service.ts:212` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | ConsentMeController.listTreatmentConsents → ConsentMeService.listTreatmentConsents → ConsentMeService.ownPatientProfileId → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ConsentMeController.listTreatmentConsents → ConsentMeService.listTreatmentConsents → ConsentMeService.ownPatientProfileId → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<MyTreatmentConsentListDto>` · DTO `MyTreatmentConsentListDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<MyTreatmentConsentDto>` | Sí | — | — | Consentimientos informados del titular. | `src/modules/consent/dto/consent-me.dto.ts:241` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador del registro. | `src/modules/consent/dto/consent-me.dto.ts:175` |
| `items[].encounterId` | `string` | Sí | formato uuid | — | Encuentro en el que se firmó. | `src/modules/consent/dto/consent-me.dto.ts:181` |
| `items[].decision` | `string` | Sí | valores: ACCEPTED, DECLINED, OTHER | — | `ACCEPTED` o `DECLINED`. | `src/modules/consent/dto/consent-me.dto.ts:187` |
| `items[].informationVersion` | `string` | No | — | — | Versión del material informativo. | `src/modules/consent/dto/consent-me.dto.ts:193` |
| `items[].signedAt` | `string` | No | formato date-time | — | Cuándo se firmó. | `src/modules/consent/dto/consent-me.dto.ts:199` |
| `items[].withdrawnAt` | `string` | No | formato date-time | — | Cuándo se retiró. | `src/modules/consent/dto/consent-me.dto.ts:205` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/consent.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Consent (07 — Privacy Directives, Legal Bases and Consent Evidence) — etapa `ctrl:ConsentMeController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 15. POST /consent/patient-objections

- **Origen:** CONTRATO
- **Nombre:** Registrar objeción del paciente y materializar restricción
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PatientObjectionsController.raise` — `src/modules/consent/controllers/patient-objections.controller.ts:38`

### Qué es y para qué sirve (negocio)

Registrar objeción del paciente y materializar restricción. Caso de uso UC-07-03: Registrar objeción y (opcional) materializar restricción (include UC-07-07). Dentro del módulo (descripción del modelo, en inglés): «Separates legal authority for processing from patient consent, HIPAA-style authorizations, treatment informed consent, privacy restrictions and objections.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/consent/README.md:56`) · MODELO (`Mantra Core Health Context/modules/diagram_07_consent.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /consent/patient-objections` la atiende `PatientObjectionsController.raise` (src/modules/consent/controllers/patient-objections.controller.ts:38). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreatePatientObjectionDto` (7 campos, 2 obligatorios). Delega en `PatientObjectionsService.raise`. Crea filas en consent.consent_events, consent.patient_objections, consent.privacy_restrictions. Lee consent.patient_objections.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/consent/controllers/patient-objections.controller.ts:38` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `consent.consent_events` | ESCRIBE | CREA | DIRECTA | PatientObjectionsController.raise → PatientObjectionsService.raise → ConsentEventsRepository.record | `src/modules/consent/repositories/consent-events.repository.ts:55` |
| `consent.patient_objections` | ESCRIBE | CREA | DIRECTA | PatientObjectionsController.raise → PatientObjectionsService.raise → PatientObjectionsRepository.create | `src/modules/consent/repositories/patient-objections.repository.ts:81` |
| `consent.patient_objections` | LEE | LEE | DIRECTA | PatientObjectionsController.raise → PatientObjectionsService.raise → PatientObjectionsRepository.findOpenByPurpose | `src/modules/consent/repositories/patient-objections.repository.ts:63` |
| `consent.privacy_restrictions` | ESCRIBE | CREA | DIRECTA | PatientObjectionsController.raise → PatientObjectionsService.raise → PrivacyRestrictionsRepository.create | `src/modules/consent/repositories/privacy-restrictions.repository.ts:103` |

### Cuerpo — DTO `CreatePatientObjectionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `patientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Paciente titular (patient profile id) | `src/modules/consent/dto/create-patient-objection.dto.ts:20` |
| `processingPurposeId` | `string` | Sí | formato uuid | `@IsUUID()` | Propósito de procesamiento objetado | `src/modules/consent/dto/create-patient-objection.dto.ts:30` |
| `objectionTypeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tipo de objeción (concept id); por defecto objeción a procesamiento | `src/modules/consent/dto/create-patient-objection.dto.ts:41` |
| `reasonText` | `string` | No | longitud máxima 4000 | `@IsOptional()` `@IsString()` `@MaxLength(4000)` | Motivo textual de la objeción | `src/modules/consent/dto/create-patient-objection.dto.ts:50` |
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tenant propietario | `src/modules/consent/dto/create-patient-objection.dto.ts:58` |
| `applyRestriction` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Si true, materializa de inmediato una restricción de privacidad (include UC-07-07) | `src/modules/consent/dto/create-patient-objection.dto.ts:70` |
| `restrictionDataClassConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Clase de datos de la restricción inmediata (concept id) | `src/modules/consent/dto/create-patient-objection.dto.ts:81` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "processingPurposeId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<PatientObjectionResponseDto>` · DTO `PatientObjectionResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/consent/dto/responses.dto.ts:69` |
| `patientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a patient profile. | `src/modules/consent/dto/responses.dto.ts:75` |
| `status` | `string` | Sí | formato uuid | — | Estado (concept id) | `src/modules/consent/dto/responses.dto.ts:81` |
| `restrictionId` | `string` | Sí | admite null | — | Restricción de privacidad creada (si aplica) | `src/modules/consent/dto/responses.dto.ts:90` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/consent/dto/responses.dto.ts:96` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe una objeción abierta para este propósito |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/consent.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Consent (07 — Privacy Directives, Legal Bases and Consent Evidence) — etapa `UC-07-03`
- Consentimiento y acceso clínico — etapa `A2`

---

## 16. POST /consent/patient-objections/{id}/resolve

- **Origen:** CONTRATO
- **Nombre:** Resolver objeción del paciente
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PatientObjectionsController.resolve` — `src/modules/consent/controllers/patient-objections.controller.ts:57`

### Qué es y para qué sirve (negocio)

Resolver objeción del paciente. Caso de uso UC-07-12: Resolver objeción (upheld/rejected). Dentro del módulo (descripción del modelo, en inglés): «Separates legal authority for processing from patient consent, HIPAA-style authorizations, treatment informed consent, privacy restrictions and objections.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/consent/README.md:65`) · MODELO (`Mantra Core Health Context/modules/diagram_07_consent.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /consent/patient-objections/{id}/resolve` la atiende `PatientObjectionsController.resolve` (src/modules/consent/controllers/patient-objections.controller.ts:57). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `ResolvePatientObjectionDto` (2 campos, 1 obligatorio). Delega en `PatientObjectionsService.resolve`. Crea filas en consent.consent_events. Actualiza consent.patient_objections, consent.privacy_restrictions. Lee consent.patient_objections, consent.privacy_restrictions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/consent/controllers/patient-objections.controller.ts:57` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/consent/controllers/patient-objections.controller.ts:57` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `consent.consent_events` | ESCRIBE | CREA | DIRECTA | PatientObjectionsController.resolve → PatientObjectionsService.resolve → ConsentEventsRepository.record | `src/modules/consent/repositories/consent-events.repository.ts:55` |
| `consent.patient_objections` | ESCRIBE | ACTUALIZA | POR_TIPO | PatientObjectionsController.resolve → PatientObjectionsService.resolve | `src/modules/consent/services/patient-objections.service.ts:174` |
| `consent.patient_objections` | LEE | LEE | DIRECTA | PatientObjectionsController.resolve → PatientObjectionsService.resolve → PatientObjectionsRepository.findById | `src/modules/consent/repositories/patient-objections.repository.ts:53` |
| `consent.privacy_restrictions` | ESCRIBE | ACTUALIZA | POR_TIPO | PatientObjectionsController.resolve → PatientObjectionsService.resolve | `src/modules/consent/services/patient-objections.service.ts:190` |
| `consent.privacy_restrictions` | LEE | LEE | DIRECTA | PatientObjectionsController.resolve → PatientObjectionsService.resolve → PrivacyRestrictionsRepository.findActiveByPatient | `src/modules/consent/repositories/privacy-restrictions.repository.ts:74` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `ResolvePatientObjectionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `resolution` | `string` | Sí | valores: UPHELD, REJECTED | `@IsIn(['UPHELD', 'REJECTED'])` | Resultado de la resolución | `src/modules/consent/dto/resolve-patient-objection.dto.ts:17` |
| `reasonConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Motivo de la resolución (concept id) | `src/modules/consent/dto/resolve-patient-objection.dto.ts:28` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "resolution": "UPHELD"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "resolution": "UPHELD",
  "reasonConceptId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<StatusResultDto>` · DTO `StatusResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `ok` | `boolean` | Sí | — | — | true si la operación se aplicó | `src/modules/consent/dto/responses.dto.ts:222` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Objeción no encontrada |
| 409 | `CONFLICT` | ConflictException: La objeción no está abierta |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/consent.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Consent (07 — Privacy Directives, Legal Bases and Consent Evidence) — etapa `UC-07-12`
- Consentimiento y acceso clínico — etapa `A2`

---

## 17. POST /consent/practitioner-access-requests

- **Origen:** CONTRATO
- **Nombre:** Pedir acceso al expediente de un paciente encontrado en la búsqueda
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PractitionerAccessRequestsController.request` — `src/modules/consent/controllers/practitioner-access-requests.controller.ts:36`

### Qué es y para qué sirve (negocio)

Pedir acceso al expediente de un paciente encontrado en la búsqueda. Dentro del módulo (descripción del modelo, en inglés): «Separates legal authority for processing from patient consent, HIPAA-style authorizations, treatment informed consent, privacy restrictions and objections.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_07_consent.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /consent/practitioner-access-requests` la atiende `PractitionerAccessRequestsController.request` (src/modules/consent/controllers/practitioner-access-requests.controller.ts:36). Exige sesión con alguno de los roles PRACTITIONER, CLINICIAN. Valida el cuerpo como `RequestPractitionerAccessDto` (3 campos, 2 obligatorios). Delega en `PractitionerAccessRequestsService.request`. Crea filas en audit.audit_log, consent.consent_events, consent.consent_provisions, consent.consents, messaging.in_app_notifications, messaging.notification_deliveries, messaging.notification_requests. Actualiza messaging.notification_requests. Lee audit.audit_log, consent.consents, iam.sessions, messaging.message_channels, messaging.message_templates, messaging.messaging_providers, messaging.notification_deliveries, messaging.notification_requests y 3 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER, CLINICIAN | `src/modules/consent/controllers/practitioner-access-requests.controller.ts:36` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | PractitionerAccessRequestsController.request → PractitionerAccessRequestsService.request → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | PractitionerAccessRequestsController.request → PractitionerAccessRequestsService.request → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `consent.consent_events` | ESCRIBE | CREA | DIRECTA | PractitionerAccessRequestsController.request → PractitionerAccessRequestsService.request → ConsentEventsRepository.record | `src/modules/consent/repositories/consent-events.repository.ts:55` |
| `consent.consent_provisions` | ESCRIBE | CREA | DIRECTA | PractitionerAccessRequestsController.request → PractitionerAccessRequestsService.request → ConsentProvisionsRepository.create | `src/modules/consent/repositories/consent-provisions.repository.ts:77` |
| `consent.consents` | ESCRIBE | CREA | DIRECTA | PractitionerAccessRequestsController.request → PractitionerAccessRequestsService.request → ConsentsRepository.create | `src/modules/consent/repositories/consents.repository.ts:150` |
| `consent.consents` | LEE | LEE | DIRECTA | PractitionerAccessRequestsController.request → PractitionerAccessRequestsService.request → ConsentsRepository.findByPatientCreatorCategory | `src/modules/consent/repositories/consents.repository.ts:105` |
| `iam.sessions` | LEE | LEE | POR_SQL | PractitionerAccessRequestsController.request → PractitionerAccessRequestsService.request → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `messaging.in_app_notifications` | ESCRIBE | CREA | DIRECTA | PractitionerAccessRequestsController.request → PractitionerAccessRequestsService.request → MessagingPractitionerAccessNoticeAdapter.emit → MessagingPractitionerAccessNoticeAdapter.issue → NotificationsService.deliverNotification → NotificationsRepository.createInAppNotification | `src/modules/messaging/repositories/notifications.repository.ts:710` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | PractitionerAccessRequestsController.request → PractitionerAccessRequestsService.request → MessagingPractitionerAccessNoticeAdapter.emit → MessagingPractitionerAccessNoticeAdapter.issue → NotificationsService.createRequest → NotificationsRepository.findChannelById | `src/modules/messaging/repositories/notifications.repository.ts:139` |
| `messaging.message_templates` | LEE | LEE | DIRECTA | PractitionerAccessRequestsController.request → PractitionerAccessRequestsService.request → MessagingPractitionerAccessNoticeAdapter.emit → MessagingPractitionerAccessNoticeAdapter.issue → NotificationsService.createRequest → NotificationsRepository.findTemplateById | `src/modules/messaging/repositories/notifications.repository.ts:153` |
| `messaging.messaging_providers` | LEE | LEE | DIRECTA | PractitionerAccessRequestsController.request → PractitionerAccessRequestsService.request → MessagingPractitionerAccessNoticeAdapter.emit → MessagingPractitionerAccessNoticeAdapter.issue → NotificationsService.deliverNotification → NotificationsRepository.findProviderById | `src/modules/messaging/repositories/notifications.repository.ts:437` |
| `messaging.notification_deliveries` | ESCRIBE | CREA | DIRECTA | PractitionerAccessRequestsController.request → PractitionerAccessRequestsService.request → MessagingPractitionerAccessNoticeAdapter.emit → MessagingPractitionerAccessNoticeAdapter.issue → NotificationsService.deliverNotification → NotificationsRepository.createDelivery | `src/modules/messaging/repositories/notifications.repository.ts:514` |
| `messaging.notification_deliveries` | LEE | LEE | DIRECTA | PractitionerAccessRequestsController.request → PractitionerAccessRequestsService.request → MessagingPractitionerAccessNoticeAdapter.emit → MessagingPractitionerAccessNoticeAdapter.issue → NotificationsService.deliverNotification → NotificationsRepository.countDeliveries | `src/modules/messaging/repositories/notifications.repository.ts:562` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | PractitionerAccessRequestsController.request → PractitionerAccessRequestsService.request → MessagingPractitionerAccessNoticeAdapter.emit → MessagingPractitionerAccessNoticeAdapter.issue → NotificationsService.createRequest → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.notification_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | PractitionerAccessRequestsController.request → PractitionerAccessRequestsService.request → MessagingPractitionerAccessNoticeAdapter.emit → MessagingPractitionerAccessNoticeAdapter.issue → NotificationsService.deliverNotification | `src/modules/messaging/services/notifications.service.ts:489` |
| `messaging.notification_requests` | LEE | LEE | DIRECTA | PractitionerAccessRequestsController.request → PractitionerAccessRequestsService.request → MessagingPractitionerAccessNoticeAdapter.emit → MessagingPractitionerAccessNoticeAdapter.issue → NotificationsService.createRequest → NotificationsRepository.findLiveRequestByDebounceKey | `src/modules/messaging/repositories/notifications.repository.ts:388` |
| `messaging.provider_channel_configs` | LEE | LEE | DIRECTA | PractitionerAccessRequestsController.request → PractitionerAccessRequestsService.request → MessagingPractitionerAccessNoticeAdapter.emit → MessagingPractitionerAccessNoticeAdapter.issue → NotificationsService.deliverNotification → NotificationsRepository.findChannelConfigs | `src/modules/messaging/repositories/notifications.repository.ts:405` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | PractitionerAccessRequestsController.request → PractitionerAccessRequestsService.request → MessagingPractitionerAccessNoticeAdapter.emit → MessagingPractitionerAccessNoticeAdapter.issue → NotificationsService.createRequest → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | PractitionerAccessRequestsController.request → PractitionerAccessRequestsService.request → PractitionerAccessRequestsService.resolveUserIdForPatient → PersonAccountLinksRepository.findActiveByPerson | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:101` |

### Cuerpo — DTO `RequestPractitionerAccessDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `patientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Paciente al que se pide acceso (patient profile id) | `src/modules/consent/dto/request-practitioner-access.dto.ts:25` |
| `specialtyConceptIds` | `array<string>` | Sí | formato uuid; mínimo 1 elemento(s); máximo 50 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ArrayMaxSize(50)` `@ArrayUnique()` `@IsUUID('4', { each: true })` | Especialidades/áreas para las que se pide acceso (concept ids del árbol de especialidades). El paciente decide cuáles de éstas autoriza — FT-07-R06. | `src/modules/consent/dto/request-practitioner-access.dto.ts:37` |
| `reasonText` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | Motivo declarado por el profesional (texto libre) | `src/modules/consent/dto/request-practitioner-access.dto.ts:45` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "specialtyConceptIds": [
    "valor-ejemplo"
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "specialtyConceptIds": [
    "valor-ejemplo"
  ],
  "reasonText": "Texto descriptivo de ejemplo"
}
```

</details>

### Respuesta — `Promise<PractitionerAccessRequestResponseDto>` · DTO `PractitionerAccessRequestResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Id del consent que representa la solicitud | `src/modules/consent/dto/practitioner-access-request-response.dto.ts:9` |
| `patientProfileId` | `string` | Sí | formato uuid | — | — | `src/modules/consent/dto/practitioner-access-request-response.dto.ts:12` |
| `requestedByUserId` | `string` | Sí | formato uuid | — | Profesional que pidió el acceso | `src/modules/consent/dto/practitioner-access-request-response.dto.ts:18` |
| `status` | `string` | Sí | formato uuid | — | Estado actual (concept id) | `src/modules/consent/dto/practitioner-access-request-response.dto.ts:21` |
| `requestedSpecialtyConceptIds` | `array<string>` | Sí | — | — | Especialidades pedidas (concept ids) | `src/modules/consent/dto/practitioner-access-request-response.dto.ts:27` |
| `authorizedSpecialtyConceptIds` | `array<string>` | Sí | — | — | Especialidades ya autorizadas por el paciente (vacío si aún no decidió) | `src/modules/consent/dto/practitioner-access-request-response.dto.ts:34` |
| `reasonText` | `string` | Sí | admite null | — | — | `src/modules/consent/dto/practitioner-access-request-response.dto.ts:37` |
| `requestedAt` | `string` | Sí | formato date-time | — | — | `src/modules/consent/dto/practitioner-access-request-response.dto.ts:40` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Canal no encontrado; ResourceNotFoundException: Plantilla no encontrada; ResourceNotFoundException: Solicitud de notificación no encontrada; ResourceNotFoundException: El proveedor configurado para el canal no existe |
| 409 | `CONFLICT` | ConflictException: Ya existe una solicitud pendiente o un vínculo activo con este paciente |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La notificación necesita destinatario interno o dirección de destino; PreconditionFailedException: El canal no está activo; PreconditionFailedException: La plantilla no está publicada; PreconditionFailedException: La plantilla es de otro canal; PreconditionFailedException: La notificación está suprimida; PreconditionFailedException: La notificación ya no admite intentos; PreconditionFailedException: El canal no tiene configuración de proveedor activa; PreconditionFailedException: Una notificación in-app necesita destinatario interno |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/consent.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Consent (07 — Privacy Directives, Legal Bases and Consent Evidence) — etapa `ctrl:PractitionerAccessRequestsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 18. POST /consent/practitioner-access-requests/{id}/decision

- **Origen:** CONTRATO
- **Nombre:** Aceptar (con las especialidades autorizadas) o rechazar la solicitud
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PractitionerAccessRequestsController.decide` — `src/modules/consent/controllers/practitioner-access-requests.controller.ts:68`

### Qué es y para qué sirve (negocio)

Aceptar (con las especialidades autorizadas) o rechazar la solicitud. Dentro del módulo (descripción del modelo, en inglés): «Separates legal authority for processing from patient consent, HIPAA-style authorizations, treatment informed consent, privacy restrictions and objections.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_07_consent.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /consent/practitioner-access-requests/{id}/decision` la atiende `PractitionerAccessRequestsController.decide` (src/modules/consent/controllers/practitioner-access-requests.controller.ts:68). Exige sesión con alguno de los roles PATIENT. Valida el cuerpo como `DecidePractitionerAccessRequestDto` (3 campos, 1 obligatorio). Delega en `PractitionerAccessRequestsService.decide`. Crea filas en audit.audit_log, authz.clinical_access_grants, consent.consent_events, messaging.in_app_notifications, messaging.notification_deliveries, messaging.notification_requests. Actualiza consent.consent_provisions, consent.consents, messaging.notification_requests. Lee audit.audit_log, authz.clinical_access_grants, consent.consent_provisions, consent.consents, iam.sessions, messaging.message_channels, messaging.message_templates, messaging.messaging_providers y 6 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PATIENT | `src/modules/consent/controllers/practitioner-access-requests.controller.ts:68` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/consent/controllers/practitioner-access-requests.controller.ts:68` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | PractitionerAccessRequestsController.decide → PractitionerAccessRequestsService.decide → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | PractitionerAccessRequestsController.decide → PractitionerAccessRequestsService.decide → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `authz.clinical_access_grants` | ESCRIBE | CREA | DIRECTA | PractitionerAccessRequestsController.decide → PractitionerAccessRequestsService.decide → ClinicalAccessGrantsRepository.create | `src/modules/authz/repositories/clinical-access-grants.repository.ts:152` |
| `authz.clinical_access_grants` | LEE | LEE | DIRECTA | PractitionerAccessRequestsController.decide → PractitionerAccessRequestsService.decide → ClinicalAccessGrantsRepository.findActive | `src/modules/authz/repositories/clinical-access-grants.repository.ts:77` |
| `consent.consent_events` | ESCRIBE | CREA | DIRECTA | PractitionerAccessRequestsController.decide → PractitionerAccessRequestsService.decide → ConsentEventsRepository.record | `src/modules/consent/repositories/consent-events.repository.ts:55` |
| `consent.consent_provisions` | ESCRIBE | ACTUALIZA | POR_TIPO | PractitionerAccessRequestsController.decide → PractitionerAccessRequestsService.decide | `src/modules/consent/services/practitioner-access-requests.service.ts:270` |
| `consent.consent_provisions` | LEE | LEE | DIRECTA | PractitionerAccessRequestsController.decide → PractitionerAccessRequestsService.decide → ConsentProvisionsRepository.findOpenByConsent | `src/modules/consent/repositories/consent-provisions.repository.ts:66` |
| `consent.consents` | ESCRIBE | ACTUALIZA | POR_TIPO | PractitionerAccessRequestsController.decide → PractitionerAccessRequestsService.decide | `src/modules/consent/services/practitioner-access-requests.service.ts:265` |
| `consent.consents` | LEE | LEE | DIRECTA | PractitionerAccessRequestsController.decide → PractitionerAccessRequestsService.decide → ConsentsRepository.findById | `src/modules/consent/repositories/consents.repository.ts:78` |
| `iam.sessions` | LEE | LEE | POR_SQL | PractitionerAccessRequestsController.decide → PractitionerAccessRequestsService.decide → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `messaging.in_app_notifications` | ESCRIBE | CREA | DIRECTA | PractitionerAccessRequestsController.decide → PractitionerAccessRequestsService.decide → MessagingPractitionerAccessNoticeAdapter.emit → MessagingPractitionerAccessNoticeAdapter.issue → NotificationsService.deliverNotification → NotificationsRepository.createInAppNotification | `src/modules/messaging/repositories/notifications.repository.ts:710` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | PractitionerAccessRequestsController.decide → PractitionerAccessRequestsService.decide → MessagingPractitionerAccessNoticeAdapter.emit → MessagingPractitionerAccessNoticeAdapter.issue → NotificationsService.createRequest → NotificationsRepository.findChannelById | `src/modules/messaging/repositories/notifications.repository.ts:139` |
| `messaging.message_templates` | LEE | LEE | DIRECTA | PractitionerAccessRequestsController.decide → PractitionerAccessRequestsService.decide → MessagingPractitionerAccessNoticeAdapter.emit → MessagingPractitionerAccessNoticeAdapter.issue → NotificationsService.createRequest → NotificationsRepository.findTemplateById | `src/modules/messaging/repositories/notifications.repository.ts:153` |
| `messaging.messaging_providers` | LEE | LEE | DIRECTA | PractitionerAccessRequestsController.decide → PractitionerAccessRequestsService.decide → MessagingPractitionerAccessNoticeAdapter.emit → MessagingPractitionerAccessNoticeAdapter.issue → NotificationsService.deliverNotification → NotificationsRepository.findProviderById | `src/modules/messaging/repositories/notifications.repository.ts:437` |
| `messaging.notification_deliveries` | ESCRIBE | CREA | DIRECTA | PractitionerAccessRequestsController.decide → PractitionerAccessRequestsService.decide → MessagingPractitionerAccessNoticeAdapter.emit → MessagingPractitionerAccessNoticeAdapter.issue → NotificationsService.deliverNotification → NotificationsRepository.createDelivery | `src/modules/messaging/repositories/notifications.repository.ts:514` |
| `messaging.notification_deliveries` | LEE | LEE | DIRECTA | PractitionerAccessRequestsController.decide → PractitionerAccessRequestsService.decide → MessagingPractitionerAccessNoticeAdapter.emit → MessagingPractitionerAccessNoticeAdapter.issue → NotificationsService.deliverNotification → NotificationsRepository.countDeliveries | `src/modules/messaging/repositories/notifications.repository.ts:562` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | PractitionerAccessRequestsController.decide → PractitionerAccessRequestsService.decide → MessagingPractitionerAccessNoticeAdapter.emit → MessagingPractitionerAccessNoticeAdapter.issue → NotificationsService.createRequest → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.notification_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | PractitionerAccessRequestsController.decide → PractitionerAccessRequestsService.decide → MessagingPractitionerAccessNoticeAdapter.emit → MessagingPractitionerAccessNoticeAdapter.issue → NotificationsService.deliverNotification | `src/modules/messaging/services/notifications.service.ts:489` |
| `messaging.notification_requests` | LEE | LEE | DIRECTA | PractitionerAccessRequestsController.decide → PractitionerAccessRequestsService.decide → MessagingPractitionerAccessNoticeAdapter.emit → MessagingPractitionerAccessNoticeAdapter.issue → NotificationsService.createRequest → NotificationsRepository.findLiveRequestByDebounceKey | `src/modules/messaging/repositories/notifications.repository.ts:388` |
| `messaging.provider_channel_configs` | LEE | LEE | DIRECTA | PractitionerAccessRequestsController.decide → PractitionerAccessRequestsService.decide → MessagingPractitionerAccessNoticeAdapter.emit → MessagingPractitionerAccessNoticeAdapter.issue → NotificationsService.deliverNotification → NotificationsRepository.findChannelConfigs | `src/modules/messaging/repositories/notifications.repository.ts:405` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | PractitionerAccessRequestsController.decide → PractitionerAccessRequestsService.decide → MessagingPractitionerAccessNoticeAdapter.emit → MessagingPractitionerAccessNoticeAdapter.issue → NotificationsService.createRequest → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | PractitionerAccessRequestsController.decide → PractitionerAccessRequestsService.decide → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | PractitionerAccessRequestsController.decide → PractitionerAccessRequestsService.decide → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `DecidePractitionerAccessRequestDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `decision` | `string` | Sí | valores: ACCEPTED, DECLINED | `@IsIn(['ACCEPTED', 'DECLINED'])` | — | `src/modules/consent/dto/decide-practitioner-access-request.dto.ts:24` |
| `authorizedSpecialtyConceptIds` | `array<string>` | No | formato uuid; máximo 50 elemento(s) | `@ValidateIf( (dto: DecidePractitionerAccessRequestDto) => dto.decision === 'ACCEPTED', )` `@IsArray()` `@ArrayMaxSize(50)` `@ArrayUnique()` `@IsUUID('4', { each: true })` | Subconjunto de las especialidades pedidas que el paciente autoriza. Obligatorio si decision = ACCEPTED. | `src/modules/consent/dto/decide-practitioner-access-request.dto.ts:43` |
| `validityMonths` | `number` | No | mínimo 1; máximo 60 | `@IsOptional()` `@IsInt()` `@Min(1)` `@Max(60)` | Meses de vigencia desde la aceptación (por defecto 12) | `src/modules/consent/dto/decide-practitioner-access-request.dto.ts:59` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "decision": "ACCEPTED"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "decision": "ACCEPTED",
  "authorizedSpecialtyConceptIds": [
    "valor-ejemplo"
  ],
  "validityMonths": 1
}
```

</details>

### Respuesta — `Promise<PractitionerAccessRequestResponseDto>` · DTO `PractitionerAccessRequestResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Id del consent que representa la solicitud | `src/modules/consent/dto/practitioner-access-request-response.dto.ts:9` |
| `patientProfileId` | `string` | Sí | formato uuid | — | — | `src/modules/consent/dto/practitioner-access-request-response.dto.ts:12` |
| `requestedByUserId` | `string` | Sí | formato uuid | — | Profesional que pidió el acceso | `src/modules/consent/dto/practitioner-access-request-response.dto.ts:18` |
| `status` | `string` | Sí | formato uuid | — | Estado actual (concept id) | `src/modules/consent/dto/practitioner-access-request-response.dto.ts:21` |
| `requestedSpecialtyConceptIds` | `array<string>` | Sí | — | — | Especialidades pedidas (concept ids) | `src/modules/consent/dto/practitioner-access-request-response.dto.ts:27` |
| `authorizedSpecialtyConceptIds` | `array<string>` | Sí | — | — | Especialidades ya autorizadas por el paciente (vacío si aún no decidió) | `src/modules/consent/dto/practitioner-access-request-response.dto.ts:34` |
| `reasonText` | `string` | Sí | admite null | — | — | `src/modules/consent/dto/practitioner-access-request-response.dto.ts:37` |
| `requestedAt` | `string` | Sí | formato date-time | — | — | `src/modules/consent/dto/practitioner-access-request-response.dto.ts:40` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Solicitud no encontrada; ResourceNotFoundException: Canal no encontrado; ResourceNotFoundException: Plantilla no encontrada; ResourceNotFoundException: Solicitud de notificación no encontrada; ResourceNotFoundException: El proveedor configurado para el canal no existe |
| 409 | `CONFLICT` | ConflictException: Esta solicitud ya fue decidida |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La solicitud no tiene profesional asociado; PreconditionFailedException: Sólo se pueden autorizar especialidades que el profesional pidió; PreconditionFailedException: Aceptar exige autorizar al menos una especialidad; si no autoriza ninguna, rechace la solicitud; PreconditionFailedException: La notificación necesita destinatario interno o dirección de destino; PreconditionFailedException: El canal no está activo; PreconditionFailedException: La plantilla no está publicada; PreconditionFailedException: La plantilla es de otro canal; PreconditionFailedException: La notificación está suprimida; PreconditionFailedException: La notificación ya no admite intentos; PreconditionFailedException: El canal no tiene configuración de proveedor activa; PreconditionFailedException: Una notificación in-app necesita destinatario interno |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/consent.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Consent (07 — Privacy Directives, Legal Bases and Consent Evidence) — etapa `ctrl:PractitionerAccessRequestsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 19. GET /consent/practitioner-access-requests/mine

- **Origen:** CONTRATO
- **Nombre:** Mis solicitudes de vínculo pendientes de decisión
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PractitionerAccessRequestsController.listMine` — `src/modules/consent/controllers/practitioner-access-requests.controller.ts:56`

### Qué es y para qué sirve (negocio)

Mis solicitudes de vínculo pendientes de decisión. Dentro del módulo (descripción del modelo, en inglés): «Separates legal authority for processing from patient consent, HIPAA-style authorizations, treatment informed consent, privacy restrictions and objections.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_07_consent.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /consent/practitioner-access-requests/mine` la atiende `PractitionerAccessRequestsController.listMine` (src/modules/consent/controllers/practitioner-access-requests.controller.ts:56). Exige sesión con alguno de los roles PATIENT. Delega en `PractitionerAccessRequestsService.listMineAsPatient`. Lee consent.consent_provisions, consent.consents, profiles.patient_profiles, profiles.person_account_links.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PATIENT | `src/modules/consent/controllers/practitioner-access-requests.controller.ts:56` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `consent.consent_provisions` | LEE | LEE | DIRECTA | PractitionerAccessRequestsController.listMine → PractitionerAccessRequestsService.listMineAsPatient → ConsentProvisionsRepository.findOpenByConsent | `src/modules/consent/repositories/consent-provisions.repository.ts:66` |
| `consent.consents` | LEE | LEE | DIRECTA | PractitionerAccessRequestsController.listMine → PractitionerAccessRequestsService.listMineAsPatient → ConsentsRepository.findPendingForPatient | `src/modules/consent/repositories/consents.repository.ts:119` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | PractitionerAccessRequestsController.listMine → PractitionerAccessRequestsService.listMineAsPatient → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | PractitionerAccessRequestsController.listMine → PractitionerAccessRequestsService.listMineAsPatient → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PractitionerAccessRequestResponseDto[]>` · DTO `PractitionerAccessRequestResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Id del consent que representa la solicitud | `src/modules/consent/dto/practitioner-access-request-response.dto.ts:9` |
| `patientProfileId` | `string` | Sí | formato uuid | — | — | `src/modules/consent/dto/practitioner-access-request-response.dto.ts:12` |
| `requestedByUserId` | `string` | Sí | formato uuid | — | Profesional que pidió el acceso | `src/modules/consent/dto/practitioner-access-request-response.dto.ts:18` |
| `status` | `string` | Sí | formato uuid | — | Estado actual (concept id) | `src/modules/consent/dto/practitioner-access-request-response.dto.ts:21` |
| `requestedSpecialtyConceptIds` | `array<string>` | Sí | — | — | Especialidades pedidas (concept ids) | `src/modules/consent/dto/practitioner-access-request-response.dto.ts:27` |
| `authorizedSpecialtyConceptIds` | `array<string>` | Sí | — | — | Especialidades ya autorizadas por el paciente (vacío si aún no decidió) | `src/modules/consent/dto/practitioner-access-request-response.dto.ts:34` |
| `reasonText` | `string` | Sí | admite null | — | — | `src/modules/consent/dto/practitioner-access-request-response.dto.ts:37` |
| `requestedAt` | `string` | Sí | formato date-time | — | — | `src/modules/consent/dto/practitioner-access-request-response.dto.ts:40` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/consent.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Consent (07 — Privacy Directives, Legal Bases and Consent Evidence) — etapa `ctrl:PractitionerAccessRequestsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 20. POST /consent/privacy-restrictions

- **Origen:** CONTRATO
- **Nombre:** Aplicar restricción de privacidad que afecta RLS clínico
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PrivacyRestrictionsController.apply` — `src/modules/consent/controllers/privacy-restrictions.controller.ts:30`

### Qué es y para qué sirve (negocio)

Aplicar restricción de privacidad que afecta RLS clínico. Caso de uso UC-07-07: Aplicar restricción de privacidad que afecta RLS clínico. Dentro del módulo (descripción del modelo, en inglés): «Separates legal authority for processing from patient consent, HIPAA-style authorizations, treatment informed consent, privacy restrictions and objections.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/consent/README.md:60`) · MODELO (`Mantra Core Health Context/modules/diagram_07_consent.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /consent/privacy-restrictions` la atiende `PrivacyRestrictionsController.apply` (src/modules/consent/controllers/privacy-restrictions.controller.ts:30). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreatePrivacyRestrictionDto` (8 campos, 2 obligatorios). Delega en `PrivacyRestrictionsService.apply`. Crea filas en consent.consent_events, consent.privacy_restrictions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/consent/controllers/privacy-restrictions.controller.ts:30` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `consent.consent_events` | ESCRIBE | CREA | DIRECTA | PrivacyRestrictionsController.apply → PrivacyRestrictionsService.apply → ConsentEventsRepository.record | `src/modules/consent/repositories/consent-events.repository.ts:55` |
| `consent.privacy_restrictions` | ESCRIBE | CREA | DIRECTA | PrivacyRestrictionsController.apply → PrivacyRestrictionsService.apply → PrivacyRestrictionsRepository.create | `src/modules/consent/repositories/privacy-restrictions.repository.ts:103` |

### Cuerpo — DTO `CreatePrivacyRestrictionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `patientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Paciente titular (patient profile id) | `src/modules/consent/dto/create-privacy-restriction.dto.ts:20` |
| `dataClassConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Clase de datos restringida (concept id) | `src/modules/consent/dto/create-privacy-restriction.dto.ts:30` |
| `restrictionTypeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tipo de restricción (concept id); por defecto bloqueo | `src/modules/consent/dto/create-privacy-restriction.dto.ts:40` |
| `targetActorTypeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tipo de actor destino (concept id) | `src/modules/consent/dto/create-privacy-restriction.dto.ts:51` |
| `targetActorId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Actor destino concreto (id) | `src/modules/consent/dto/create-privacy-restriction.dto.ts:62` |
| `reasonText` | `string` | No | longitud máxima 4000 | `@IsOptional()` `@IsString()` `@MaxLength(4000)` | Motivo textual | `src/modules/consent/dto/create-privacy-restriction.dto.ts:71` |
| `validTo` | `string` | No | — | `@IsOptional()` `@IsISO8601()` | Fin de vigencia (ISO-8601) | `src/modules/consent/dto/create-privacy-restriction.dto.ts:79` |
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tenant propietario | `src/modules/consent/dto/create-privacy-restriction.dto.ts:87` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "dataClassConceptId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<PrivacyRestrictionResponseDto>` · DTO `PrivacyRestrictionResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/consent/dto/responses.dto.ts:105` |
| `patientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a patient profile. | `src/modules/consent/dto/responses.dto.ts:111` |
| `status` | `string` | Sí | formato uuid | — | Estado (concept id) | `src/modules/consent/dto/responses.dto.ts:117` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/consent/dto/responses.dto.ts:123` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/consent.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Consent (07 — Privacy Directives, Legal Bases and Consent Evidence) — etapa `UC-07-07`

---

## 21. POST /consent/processing-legal-bases

- **Origen:** CONTRATO
- **Nombre:** Establecer/versionar base legal de procesamiento
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProcessingLegalBasesController.version` — `src/modules/consent/controllers/processing-legal-bases.controller.ts:30`

### Qué es y para qué sirve (negocio)

Establecer/versionar base legal de procesamiento. Caso de uso UC-07-06: Establecer/versionar base legal (supersede la anterior). Dentro del módulo (descripción del modelo, en inglés): «Separates legal authority for processing from patient consent, HIPAA-style authorizations, treatment informed consent, privacy restrictions and objections.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/consent/README.md:59`) · MODELO (`Mantra Core Health Context/modules/diagram_07_consent.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /consent/processing-legal-bases` la atiende `ProcessingLegalBasesController.version` (src/modules/consent/controllers/processing-legal-bases.controller.ts:30). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateProcessingLegalBasisDto` (7 campos, 1 obligatorio). Delega en `ProcessingLegalBasesService.version`. Crea filas en consent.processing_legal_bases. Actualiza consent.processing_legal_bases. Lee consent.processing_legal_bases.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/consent/controllers/processing-legal-bases.controller.ts:30` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `consent.processing_legal_bases` | ESCRIBE | ACTUALIZA | POR_TIPO | ProcessingLegalBasesController.version → ProcessingLegalBasesService.version | `src/modules/consent/services/processing-legal-bases.service.ts:61` |
| `consent.processing_legal_bases` | ESCRIBE | CREA | DIRECTA | ProcessingLegalBasesController.version → ProcessingLegalBasesService.version → ProcessingLegalBasesRepository.create | `src/modules/consent/repositories/processing-legal-bases.repository.ts:98` |
| `consent.processing_legal_bases` | LEE | LEE | DIRECTA | ProcessingLegalBasesController.version → ProcessingLegalBasesService.version → ProcessingLegalBasesRepository.findCurrentVersion | `src/modules/consent/repositories/processing-legal-bases.repository.ts:78` |

### Cuerpo — DTO `CreateProcessingLegalBasisDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `processingPurposeId` | `string` | Sí | formato uuid | `@IsUUID()` | Propósito de procesamiento activo | `src/modules/consent/dto/create-processing-legal-basis.dto.ts:14` |
| `jurisdictionConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Jurisdicción (concept id); por defecto Perú | `src/modules/consent/dto/create-processing-legal-basis.dto.ts:24` |
| `generalLegalBasisConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Base legal general (concept id); por defecto consentimiento | `src/modules/consent/dto/create-processing-legal-basis.dto.ts:34` |
| `specialCategoryConditionConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Condición de categoría especial (concept id) | `src/modules/consent/dto/create-processing-legal-basis.dto.ts:45` |
| `policyVersion` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Versión de la política | `src/modules/consent/dto/create-processing-legal-basis.dto.ts:54` |
| `legalReferenceUri` | `string` | No | longitud máxima 2048 | `@IsOptional()` `@IsString()` `@MaxLength(2048)` | URI de referencia legal | `src/modules/consent/dto/create-processing-legal-basis.dto.ts:63` |
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tenant propietario | `src/modules/consent/dto/create-processing-legal-basis.dto.ts:71` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "processingPurposeId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<ProcessingLegalBasisResponseDto>` · DTO `ProcessingLegalBasisResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/consent/dto/responses.dto.ts:132` |
| `processingPurposeId` | `string` | Sí | formato uuid | — | Identificador asociado a processing purpose. | `src/modules/consent/dto/responses.dto.ts:138` |
| `status` | `string` | Sí | formato uuid | — | Estado (concept id) | `src/modules/consent/dto/responses.dto.ts:144` |
| `supersededId` | `string` | Sí | admite null | — | Versión anterior cerrada (si la había) | `src/modules/consent/dto/responses.dto.ts:153` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/consent/dto/responses.dto.ts:159` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/consent.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Consent (07 — Privacy Directives, Legal Bases and Consent Evidence) — etapa `UC-07-06`

---

## 22. POST /consent/treatment-informed-consents

- **Origen:** CONTRATO
- **Nombre:** Capturar consentimiento informado de tratamiento
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TreatmentInformedConsentsController.sign` — `src/modules/consent/controllers/treatment-informed-consents.controller.ts:30`

### Qué es y para qué sirve (negocio)

Capturar consentimiento informado de tratamiento. Caso de uso UC-07-08: Capturar consentimiento informado de tratamiento. Dentro del módulo (descripción del modelo, en inglés): «Separates legal authority for processing from patient consent, HIPAA-style authorizations, treatment informed consent, privacy restrictions and objections.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/consent/README.md:61`) · MODELO (`Mantra Core Health Context/modules/diagram_07_consent.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /consent/treatment-informed-consents` la atiende `TreatmentInformedConsentsController.sign` (src/modules/consent/controllers/treatment-informed-consents.controller.ts:30). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateTreatmentInformedConsentDto` (8 campos, 3 obligatorios). Delega en `TreatmentInformedConsentsService.sign`. Crea filas en consent.consent_events, consent.treatment_informed_consents.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/consent/controllers/treatment-informed-consents.controller.ts:30` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `consent.consent_events` | ESCRIBE | CREA | DIRECTA | TreatmentInformedConsentsController.sign → TreatmentInformedConsentsService.sign → ConsentEventsRepository.record | `src/modules/consent/repositories/consent-events.repository.ts:55` |
| `consent.treatment_informed_consents` | ESCRIBE | CREA | DIRECTA | TreatmentInformedConsentsController.sign → TreatmentInformedConsentsService.sign → TreatmentInformedConsentsRepository.create | `src/modules/consent/repositories/treatment-informed-consents.repository.ts:82` |

### Cuerpo — DTO `CreateTreatmentInformedConsentDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `patientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Paciente titular (patient profile id) | `src/modules/consent/dto/create-treatment-informed-consent.dto.ts:17` |
| `encounterId` | `string` | Sí | formato uuid | `@IsUUID()` | Encuentro clínico abierto (encounter id) | `src/modules/consent/dto/create-treatment-informed-consent.dto.ts:27` |
| `decision` | `string` | Sí | valores: ACCEPTED, DECLINED | `@IsIn(['ACCEPTED', 'DECLINED'])` | Decisión del paciente | `src/modules/consent/dto/create-treatment-informed-consent.dto.ts:37` |
| `procedureCodeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Código de procedimiento (concept id) | `src/modules/consent/dto/create-treatment-informed-consent.dto.ts:48` |
| `informationVersion` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Versión del material informativo vigente | `src/modules/consent/dto/create-treatment-informed-consent.dto.ts:59` |
| `interpreterUserId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Intérprete presente (user id) | `src/modules/consent/dto/create-treatment-informed-consent.dto.ts:70` |
| `witnessUserId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Testigo (user id) | `src/modules/consent/dto/create-treatment-informed-consent.dto.ts:78` |
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tenant propietario | `src/modules/consent/dto/create-treatment-informed-consent.dto.ts:86` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "encounterId": "00000000-0000-4000-8000-000000000001",
  "decision": "ACCEPTED"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<TreatmentInformedConsentResponseDto>` · DTO `TreatmentInformedConsentResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/consent/dto/responses.dto.ts:168` |
| `patientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a patient profile. | `src/modules/consent/dto/responses.dto.ts:174` |
| `status` | `string` | Sí | formato uuid | — | Estado (concept id) | `src/modules/consent/dto/responses.dto.ts:180` |
| `decision` | `string` | Sí | formato uuid | — | Decisión (concept id) | `src/modules/consent/dto/responses.dto.ts:186` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/consent/dto/responses.dto.ts:192` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/consent.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Consent (07 — Privacy Directives, Legal Bases and Consent Evidence) — etapa `UC-07-08`

---

