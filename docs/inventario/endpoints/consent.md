<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `consent`

- **Bloque:** Identidad y Seguridad (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)
- **Operaciones:** 12 (12 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 0 · MEDIO 12 · BAJO 0
- **Tablas distintas que tocan:** 11
- **Respuestas de error y detalle contractual:** `openapi/endpoints/consent.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | POST | `/consent/consent-evidence` | Registrar evidencia inmutable de consentimiento | MEDIO | 1 | SECURITY_ADMIN |
| 2 | POST | `/consent/consents` | Capturar consentimiento de directiva de privacidad | MEDIO | 4 | SECURITY_ADMIN |
| 3 | PATCH | `/consent/consents/{id}/provisions` | Actualizar provisiones granulares (data class / actor / acción) | MEDIO | 5 | SECURITY_ADMIN |
| 4 | POST | `/consent/consents/{id}/withdraw` | Revocar/retirar consentimiento y disparar re-evaluación de accesos | MEDIO | 7 | SECURITY_ADMIN |
| 5 | POST | `/consent/hipaa-authorizations` | Otorgar autorización HIPAA de divulgación | MEDIO | 2 | SECURITY_ADMIN |
| 6 | POST | `/consent/hipaa-authorizations/{id}/revoke` | Revocar autorización HIPAA | MEDIO | 3 | SECURITY_ADMIN |
| 7 | POST | `/consent/internal/expiration-sweep` | Expirar consentimientos y autorizaciones vencidas (barrido) | MEDIO | 7 | SYSTEM, SECURITY_ADMIN |
| 8 | POST | `/consent/patient-objections` | Registrar objeción del paciente y materializar restricción | MEDIO | 4 | SECURITY_ADMIN |
| 9 | POST | `/consent/patient-objections/{id}/resolve` | Resolver objeción del paciente | MEDIO | 5 | SECURITY_ADMIN |
| 10 | POST | `/consent/privacy-restrictions` | Aplicar restricción de privacidad que afecta RLS clínico | MEDIO | 2 | SECURITY_ADMIN |
| 11 | POST | `/consent/processing-legal-bases` | Establecer/versionar base legal de procesamiento | MEDIO | 3 | SECURITY_ADMIN |
| 12 | POST | `/consent/treatment-informed-consents` | Capturar consentimiento informado de tratamiento | MEDIO | 2 | SECURITY_ADMIN |

---

## 1. POST /consent/consent-evidence

- **Origen:** CONTRATO
- **Nombre:** Registrar evidencia inmutable de consentimiento
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ConsentEvidenceController.record` — `src/modules/consent/controllers/consent-evidence.controller.ts:20`

### Qué es y para qué sirve (negocio)

Registrar evidencia inmutable de consentimiento. Caso de uso UC-07-10: Registrar evidencia inmutable (append-only). Dentro del módulo (descripción del modelo, en inglés): «Separates legal authority for processing from patient consent, HIPAA-style authorizations, treatment informed consent, privacy restrictions and objections.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/consent/README.md:21`) · MODELO (`Mantra Core Health Context/modules/diagram_07_consent.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /consent/consent-evidence` la atiende `ConsentEvidenceController.record` (src/modules/consent/controllers/consent-evidence.controller.ts:20). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateConsentEvidenceDto` (8 campos, 2 obligatorios). Delega en `ConsentEvidenceService.record`. Crea filas en consent.consent_evidence.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/consent/controllers/consent-evidence.controller.ts:20` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

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

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

## 2. POST /consent/consents

- **Origen:** CONTRATO
- **Nombre:** Capturar consentimiento de directiva de privacidad
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ConsentsController.capture` — `src/modules/consent/controllers/consents.controller.ts:38`

### Qué es y para qué sirve (negocio)

Capturar consentimiento de directiva de privacidad. Caso de uso UC-07-01: Capturar consentimiento de directiva de privacidad (+ provisiones + evento granted). Dentro del módulo (descripción del modelo, en inglés): «Separates legal authority for processing from patient consent, HIPAA-style authorizations, treatment informed consent, privacy restrictions and objections.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/consent/README.md:12`) · MODELO (`Mantra Core Health Context/modules/diagram_07_consent.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /consent/consents` la atiende `ConsentsController.capture` (src/modules/consent/controllers/consents.controller.ts:38). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateConsentDto` (21 campos, 2 obligatorios). Delega en `ConsentsService.capture`. Crea filas en consent.consent_events, consent.consent_provisions, consent.consents. Lee consent.consents.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/consent/controllers/consents.controller.ts:38` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `consent.consent_events` | ESCRIBE | CREA | DIRECTA | ConsentsController.capture → ConsentsService.capture → ConsentEventsRepository.record | `src/modules/consent/repositories/consent-events.repository.ts:55` |
| `consent.consent_provisions` | ESCRIBE | CREA | DIRECTA | ConsentsController.capture → ConsentsService.capture → ConsentsService.createProvision → ConsentProvisionsRepository.create | `src/modules/consent/repositories/consent-provisions.repository.ts:77` |
| `consent.consents` | ESCRIBE | CREA | DIRECTA | ConsentsController.capture → ConsentsService.capture → ConsentsRepository.create | `src/modules/consent/repositories/consents.repository.ts:115` |
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

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

## 3. PATCH /consent/consents/{id}/provisions

- **Origen:** CONTRATO
- **Nombre:** Actualizar provisiones granulares (data class / actor / acción)
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ConsentsController.amendProvisions` — `src/modules/consent/controllers/consents.controller.ts:68`

### Qué es y para qué sirve (negocio)

Actualizar provisiones granulares (data class / actor / acción). Caso de uso UC-07-09: Actualizar provisiones granulares (soft-close + insert). Dentro del módulo (descripción del modelo, en inglés): «Separates legal authority for processing from patient consent, HIPAA-style authorizations, treatment informed consent, privacy restrictions and objections.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/consent/README.md:20`) · MODELO (`Mantra Core Health Context/modules/diagram_07_consent.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`PATCH /consent/consents/{id}/provisions` la atiende `ConsentsController.amendProvisions` (src/modules/consent/controllers/consents.controller.ts:68). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `AmendProvisionsDto` (10 campos, 2 obligatorios). Delega en `ConsentsService.amendProvisions`. Crea filas en consent.consent_events, consent.consent_provisions. Actualiza consent.consent_provisions. Lee consent.consent_provisions, consent.consents.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/consent/controllers/consents.controller.ts:68` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/consent/controllers/consents.controller.ts:68` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

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

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

## 4. POST /consent/consents/{id}/withdraw

- **Origen:** CONTRATO
- **Nombre:** Revocar/retirar consentimiento y disparar re-evaluación de accesos
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ConsentsController.withdraw` — `src/modules/consent/controllers/consents.controller.ts:52`

### Qué es y para qué sirve (negocio)

Revocar/retirar consentimiento y disparar re-evaluación de accesos. Caso de uso UC-07-02: Retirar consentimiento y disparar re-evaluación de accesos. Dentro del módulo (descripción del modelo, en inglés): «Separates legal authority for processing from patient consent, HIPAA-style authorizations, treatment informed consent, privacy restrictions and objections.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/consent/README.md:13`) · MODELO (`Mantra Core Health Context/modules/diagram_07_consent.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /consent/consents/{id}/withdraw` la atiende `ConsentsController.withdraw` (src/modules/consent/controllers/consents.controller.ts:52). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `WithdrawConsentDto` (1 campo, 0 obligatorios). Delega en `ConsentsService.withdraw`. Crea filas en audit.audit_log, consent.consent_events. Actualiza authz.clinical_access_grants, consent.consents. Lee audit.audit_log, authz.clinical_access_grants, consent.consents.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/consent/controllers/consents.controller.ts:52` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/consent/controllers/consents.controller.ts:52` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | ConsentsController.withdraw → ConsentsService.withdraw → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:176` |
| `audit.audit_log` | LEE | LEE | DIRECTA | ConsentsController.withdraw → ConsentsService.withdraw → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:151` |
| `authz.clinical_access_grants` | ESCRIBE | ACTUALIZA | POR_TIPO | ConsentsController.withdraw → ConsentsService.withdraw → ClinicalAccessGrantsRepository.revokeForConsent | `src/modules/authz/repositories/clinical-access-grants.repository.ts:122` |
| `authz.clinical_access_grants` | LEE | LEE | DIRECTA | ConsentsController.withdraw → ConsentsService.withdraw → ClinicalAccessGrantsRepository.revokeForConsent → ClinicalAccessGrantsRepository.findActiveByConsent | `src/modules/authz/repositories/clinical-access-grants.repository.ts:102` |
| `consent.consent_events` | ESCRIBE | CREA | DIRECTA | ConsentsController.withdraw → ConsentsService.withdraw → ConsentEventsRepository.record | `src/modules/consent/repositories/consent-events.repository.ts:55` |
| `consent.consents` | ESCRIBE | ACTUALIZA | POR_TIPO | ConsentsController.withdraw → ConsentsService.withdraw | `src/modules/consent/services/consents.service.ts:157` |
| `consent.consents` | LEE | LEE | DIRECTA | ConsentsController.withdraw → ConsentsService.withdraw → ConsentsRepository.findById | `src/modules/consent/repositories/consents.repository.ts:78` |

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

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

## 5. POST /consent/hipaa-authorizations

- **Origen:** CONTRATO
- **Nombre:** Otorgar autorización HIPAA de divulgación
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `HipaaAuthorizationsController.grant` — `src/modules/consent/controllers/hipaa-authorizations.controller.ts:32`

### Qué es y para qué sirve (negocio)

Otorgar autorización HIPAA de divulgación. Caso de uso UC-07-04: Otorgar autorización HIPAA de divulgación. Dentro del módulo (descripción del modelo, en inglés): «Separates legal authority for processing from patient consent, HIPAA-style authorizations, treatment informed consent, privacy restrictions and objections.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/consent/README.md:15`) · MODELO (`Mantra Core Health Context/modules/diagram_07_consent.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /consent/hipaa-authorizations` la atiende `HipaaAuthorizationsController.grant` (src/modules/consent/controllers/hipaa-authorizations.controller.ts:32). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateHipaaAuthorizationDto` (8 campos, 5 obligatorios). Delega en `HipaaAuthorizationsService.grant`. Crea filas en consent.consent_events, consent.hipaa_authorizations.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/consent/controllers/hipaa-authorizations.controller.ts:32` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

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

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

## 6. POST /consent/hipaa-authorizations/{id}/revoke

- **Origen:** CONTRATO
- **Nombre:** Revocar autorización HIPAA
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `HipaaAuthorizationsController.revoke` — `src/modules/consent/controllers/hipaa-authorizations.controller.ts:44`

### Qué es y para qué sirve (negocio)

Revocar autorización HIPAA. Caso de uso UC-07-05: Revocar autorización HIPAA. Dentro del módulo (descripción del modelo, en inglés): «Separates legal authority for processing from patient consent, HIPAA-style authorizations, treatment informed consent, privacy restrictions and objections.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/consent/README.md:16`) · MODELO (`Mantra Core Health Context/modules/diagram_07_consent.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /consent/hipaa-authorizations/{id}/revoke` la atiende `HipaaAuthorizationsController.revoke` (src/modules/consent/controllers/hipaa-authorizations.controller.ts:44). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `HipaaAuthorizationsService.revoke`. Crea filas en consent.consent_events. Actualiza consent.hipaa_authorizations. Lee consent.hipaa_authorizations.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/consent/controllers/hipaa-authorizations.controller.ts:44` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/consent/controllers/hipaa-authorizations.controller.ts:44` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

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

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

## 7. POST /consent/internal/expiration-sweep

- **Origen:** CONTRATO
- **Nombre:** Expirar consentimientos y autorizaciones vencidas (barrido)
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ConsentSweepController.sweep` — `src/modules/consent/controllers/consent-sweep.controller.ts:24`

### Qué es y para qué sirve (negocio)

Expirar consentimientos y autorizaciones vencidas (barrido). Caso de uso UC-07-11: Barrido de expiraciones (worker). Dentro del módulo (descripción del modelo, en inglés): «Separates legal authority for processing from patient consent, HIPAA-style authorizations, treatment informed consent, privacy restrictions and objections.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/consent/README.md:22`) · MODELO (`Mantra Core Health Context/modules/diagram_07_consent.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /consent/internal/expiration-sweep` la atiende `ConsentSweepController.sweep` (src/modules/consent/controllers/consent-sweep.controller.ts:24). Exige sesión con alguno de los roles SYSTEM, SECURITY_ADMIN. Delega en `ConsentSweepService.sweep`. Crea filas en consent.consent_events. Actualiza consent.consents, consent.hipaa_authorizations, consent.privacy_restrictions. Lee consent.consents, consent.hipaa_authorizations, consent.privacy_restrictions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, SECURITY_ADMIN | `src/modules/consent/controllers/consent-sweep.controller.ts:24` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `consent.consent_events` | ESCRIBE | CREA | DIRECTA | ConsentSweepController.sweep → ConsentSweepService.sweep → ConsentEventsRepository.record | `src/modules/consent/repositories/consent-events.repository.ts:55` |
| `consent.consents` | ESCRIBE | ACTUALIZA | POR_TIPO | ConsentSweepController.sweep → ConsentSweepService.sweep | `src/modules/consent/services/consent-sweep.service.ts:59` |
| `consent.consents` | LEE | LEE | DIRECTA | ConsentSweepController.sweep → ConsentSweepService.sweep → ConsentsRepository.findExpirable | `src/modules/consent/repositories/consents.repository.ts:101` |
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

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

## 8. POST /consent/patient-objections

- **Origen:** CONTRATO
- **Nombre:** Registrar objeción del paciente y materializar restricción
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PatientObjectionsController.raise` — `src/modules/consent/controllers/patient-objections.controller.ts:33`

### Qué es y para qué sirve (negocio)

Registrar objeción del paciente y materializar restricción. Caso de uso UC-07-03: Registrar objeción y (opcional) materializar restricción (include UC-07-07). Dentro del módulo (descripción del modelo, en inglés): «Separates legal authority for processing from patient consent, HIPAA-style authorizations, treatment informed consent, privacy restrictions and objections.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/consent/README.md:14`) · MODELO (`Mantra Core Health Context/modules/diagram_07_consent.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /consent/patient-objections` la atiende `PatientObjectionsController.raise` (src/modules/consent/controllers/patient-objections.controller.ts:33). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreatePatientObjectionDto` (7 campos, 2 obligatorios). Delega en `PatientObjectionsService.raise`. Crea filas en consent.consent_events, consent.patient_objections, consent.privacy_restrictions. Lee consent.patient_objections.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/consent/controllers/patient-objections.controller.ts:33` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

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

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

## 9. POST /consent/patient-objections/{id}/resolve

- **Origen:** CONTRATO
- **Nombre:** Resolver objeción del paciente
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PatientObjectionsController.resolve` — `src/modules/consent/controllers/patient-objections.controller.ts:47`

### Qué es y para qué sirve (negocio)

Resolver objeción del paciente. Caso de uso UC-07-12: Resolver objeción (upheld/rejected). Dentro del módulo (descripción del modelo, en inglés): «Separates legal authority for processing from patient consent, HIPAA-style authorizations, treatment informed consent, privacy restrictions and objections.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/consent/README.md:23`) · MODELO (`Mantra Core Health Context/modules/diagram_07_consent.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /consent/patient-objections/{id}/resolve` la atiende `PatientObjectionsController.resolve` (src/modules/consent/controllers/patient-objections.controller.ts:47). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `ResolvePatientObjectionDto` (2 campos, 1 obligatorio). Delega en `PatientObjectionsService.resolve`. Crea filas en consent.consent_events. Actualiza consent.patient_objections, consent.privacy_restrictions. Lee consent.patient_objections, consent.privacy_restrictions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/consent/controllers/patient-objections.controller.ts:47` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/consent/controllers/patient-objections.controller.ts:47` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

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

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

## 10. POST /consent/privacy-restrictions

- **Origen:** CONTRATO
- **Nombre:** Aplicar restricción de privacidad que afecta RLS clínico
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PrivacyRestrictionsController.apply` — `src/modules/consent/controllers/privacy-restrictions.controller.ts:25`

### Qué es y para qué sirve (negocio)

Aplicar restricción de privacidad que afecta RLS clínico. Caso de uso UC-07-07: Aplicar restricción de privacidad que afecta RLS clínico. Dentro del módulo (descripción del modelo, en inglés): «Separates legal authority for processing from patient consent, HIPAA-style authorizations, treatment informed consent, privacy restrictions and objections.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/consent/README.md:18`) · MODELO (`Mantra Core Health Context/modules/diagram_07_consent.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /consent/privacy-restrictions` la atiende `PrivacyRestrictionsController.apply` (src/modules/consent/controllers/privacy-restrictions.controller.ts:25). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreatePrivacyRestrictionDto` (8 campos, 2 obligatorios). Delega en `PrivacyRestrictionsService.apply`. Crea filas en consent.consent_events, consent.privacy_restrictions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/consent/controllers/privacy-restrictions.controller.ts:25` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

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

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

## 11. POST /consent/processing-legal-bases

- **Origen:** CONTRATO
- **Nombre:** Establecer/versionar base legal de procesamiento
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProcessingLegalBasesController.version` — `src/modules/consent/controllers/processing-legal-bases.controller.ts:25`

### Qué es y para qué sirve (negocio)

Establecer/versionar base legal de procesamiento. Caso de uso UC-07-06: Establecer/versionar base legal (supersede la anterior). Dentro del módulo (descripción del modelo, en inglés): «Separates legal authority for processing from patient consent, HIPAA-style authorizations, treatment informed consent, privacy restrictions and objections.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/consent/README.md:17`) · MODELO (`Mantra Core Health Context/modules/diagram_07_consent.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /consent/processing-legal-bases` la atiende `ProcessingLegalBasesController.version` (src/modules/consent/controllers/processing-legal-bases.controller.ts:25). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateProcessingLegalBasisDto` (7 campos, 1 obligatorio). Delega en `ProcessingLegalBasesService.version`. Crea filas en consent.processing_legal_bases. Actualiza consent.processing_legal_bases. Lee consent.processing_legal_bases.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/consent/controllers/processing-legal-bases.controller.ts:25` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

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

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

## 12. POST /consent/treatment-informed-consents

- **Origen:** CONTRATO
- **Nombre:** Capturar consentimiento informado de tratamiento
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TreatmentInformedConsentsController.sign` — `src/modules/consent/controllers/treatment-informed-consents.controller.ts:25`

### Qué es y para qué sirve (negocio)

Capturar consentimiento informado de tratamiento. Caso de uso UC-07-08: Capturar consentimiento informado de tratamiento. Dentro del módulo (descripción del modelo, en inglés): «Separates legal authority for processing from patient consent, HIPAA-style authorizations, treatment informed consent, privacy restrictions and objections.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/consent/README.md:19`) · MODELO (`Mantra Core Health Context/modules/diagram_07_consent.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /consent/treatment-informed-consents` la atiende `TreatmentInformedConsentsController.sign` (src/modules/consent/controllers/treatment-informed-consents.controller.ts:25). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateTreatmentInformedConsentDto` (8 campos, 3 obligatorios). Delega en `TreatmentInformedConsentsService.sign`. Crea filas en consent.consent_events, consent.treatment_informed_consents.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/consent/controllers/treatment-informed-consents.controller.ts:25` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

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

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

