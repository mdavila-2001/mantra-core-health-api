<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `identity_assurance`

- **Bloque:** Identidad y Seguridad (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)
- **Operaciones:** 28 (28 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 5 · MEDIO 17 · BAJO 6
- **Tablas distintas que tocan:** 48
- **Respuestas de error y detalle contractual:** `openapi/endpoints/identity-assurance.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | POST | `/identity/assertions/{id}/revoke` | Revocar una aserción de identidad | MEDIO | 11 | SECURITY_ADMIN |
| 2 | POST | `/identity/authorities` | Registrar una autoridad de identidad | MEDIO | 1 | SECURITY_ADMIN |
| 3 | POST | `/identity/authorities/{id}/endpoints` | Publicar un endpoint de verificación de la autoridad | MEDIO | 4 | SECURITY_ADMIN |
| 4 | POST | `/identity/checks/{id}/attempts` | Ejecutar un intento contra la autoridad externa (idempotente) | MEDIO | 8 | SECURITY_ADMIN |
| 5 | POST | `/identity/checks/{id}/results` | Registrar el resultado inmutable del check (con supersede) | MEDIO | 24 | SECURITY_ADMIN |
| 6 | POST | `/identity/manual-review/{id}/decision` | Resolver una revisión manual (decisión) | MEDIO | 26 | SECURITY_ADMIN |
| 7 | POST | `/identity/me/identity-verification` | Solicitar la verificación de la propia identidad (paciente) | ALTO | 15 | sesión (sin roles) |
| 8 | POST | `/identity/me/practitioner/identity-verification` | Solicitar la verificación de la propia identidad (profesional) | ALTO | 16 | sesión (sin roles) |
| 9 | POST | `/identity/me/practitioner/license-verification` | Solicitar la verificación de la propia matrícula | ALTO | 17 | sesión (sin roles) |
| 10 | POST | `/identity/me/tenants/{tenantId}/verification` | Solicitar la verificación de una institución propia | ALTO | 15 | sesión (sin roles) |
| 11 | GET | `/identity/me/verification-cases` | Listar los casos de verificación propios | BAJO | 7 | sesión (sin roles) |
| 12 | GET | `/identity/me/verification-cases/{caseId}` | Consultar el estado de un caso propio | BAJO | 8 | sesión (sin roles) |
| 13 | GET | `/identity/me/verification-types` | Listar los tipos de solicitud de verificación disponibles | BAJO | 4 | sesión (sin roles) |
| 14 | GET | `/identity/verification-cases` | Listar los casos que esperan revisión | BAJO | 4 | SECURITY_ADMIN |
| 15 | POST | `/identity/verification-cases` | Iniciar un caso de verificación de identidad | MEDIO | 5 | SECURITY_ADMIN |
| 16 | GET | `/identity/verification-cases/{id}` | Consultar expediente y evidencias de un caso | BAJO | 5 | SECURITY_ADMIN |
| 17 | POST | `/identity/verification-cases/{id}/assertions` | Emitir una aserción de identidad con nivel de aseguramiento | MEDIO | 8 | SECURITY_ADMIN |
| 18 | POST | `/identity/verification-cases/{id}/checks:plan` | Planificar los checks requeridos del caso | MEDIO | 7 | SECURITY_ADMIN |
| 19 | POST | `/identity/verification-cases/{id}/evidence` | Aportar evidencia documental bajo consentimiento | MEDIO | 10 | SECURITY_ADMIN |
| 20 | POST | `/identity/verification-cases/{id}/fraud-signals` | Detectar y registrar una señal de fraude | MEDIO | 6 | SECURITY_ADMIN |
| 21 | POST | `/identity/verification-cases/{id}/manual-review` | Escalar el caso a revisión manual | MEDIO | 7 | SECURITY_ADMIN |
| 22 | POST | `/identity/verification-cases/expire-sweep` | Expirar por lote los casos vencidos (job programado) | MEDIO | 11 | SYSTEM, SECURITY_ADMIN |
| 23 | POST | `/identity/verification-policies` | Crear una política de verificación de identidad (IAL/AAL) | MEDIO | 1 | SECURITY_ADMIN |
| 24 | POST | `/internal/identity/checks/{id}/attempts` | Registrar el intento del worker contra la autoridad externa | MEDIO | 8 | SYSTEM, SECURITY_ADMIN |
| 25 | POST | `/internal/identity/checks/{id}/results` | Registrar el veredicto que devolvió la autoridad externa | MEDIO | 24 | SYSTEM, SECURITY_ADMIN |
| 26 | GET | `/internal/identity/checks/dispatchable` | Listar los checks que el worker debe atender en este tick | BAJO | 6 | SYSTEM, SECURITY_ADMIN |
| 27 | POST | `/internal/identity/evidence/lifecycle-scan` | Evaluate configured evidence lifecycle; destructive runtime remains blocked | ALTO | 36 | SYSTEM |
| 28 | POST | `/internal/identity/evidence/storage-purge-review` | Recheck retired evidence objects; never grants physical delete | MEDIO | 21 | SYSTEM |

---

## 1. POST /identity/assertions/{id}/revoke

- **Origen:** CONTRATO
- **Nombre:** Revocar una aserción de identidad
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IdentityAssertionsController.revoke` — `src/modules/identity_assurance/controllers/identity-assertions.controller.ts:33`

### Qué es y para qué sirve (negocio)

Revocar una aserción de identidad. Dentro del módulo (descripción del modelo, en inglés): «Verifies patients, practitioners, representatives and organization operators against authoritative ministries, civil registries, professional boards and government data platforms.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_27_identity_assurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /identity/assertions/{id}/revoke` la atiende `IdentityAssertionsController.revoke` (src/modules/identity_assurance/controllers/identity-assertions.controller.ts:33). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `RevokeAssertionDto` (4 campos, 0 obligatorios). Delega en `IdentityAssertionsService.revoke`. Crea filas en audit.verified_badges_history, identity_assurance.identity_fraud_signals. Actualiza community.public_profiles, community.verified_badges. Lee community.public_profiles, community.verified_badges, directory.tenant_memberships, identity_assurance.identity_assertions, identity_assurance.identity_verification_cases, profiles.jurisdiction_authorizations, profiles.person_account_links.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/identity_assurance/controllers/identity-assertions.controller.ts:33` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/identity_assurance/controllers/identity-assertions.controller.ts:33` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.verified_badges_history` | ESCRIBE | CREA | DIRECTA | IdentityAssertionsController.revoke → IdentityAssertionsService.revoke → IdentityVerificationEffectsService.applyRevoked → CommunityVerificationService.applyRevoked → CommunityVerificationService.revokeProfileBadges → VerifiedBadgesRepository.recordHistory | `src/modules/community/repositories/verified-badges.repository.ts:172` |
| `community.public_profiles` | ESCRIBE | ACTUALIZA | POR_TIPO | IdentityAssertionsController.revoke → IdentityAssertionsService.revoke → IdentityVerificationEffectsService.applyRevoked → CommunityVerificationService.applyRevoked → CommunityVerificationService.revokeProfileBadges | `src/modules/community/services/community-verification.service.ts:249` |
| `community.public_profiles` | LEE | LEE | DIRECTA | IdentityAssertionsController.revoke → IdentityAssertionsService.revoke → IdentityVerificationEffectsService.applyRevoked → CommunityVerificationService.applyRevoked → VerifiedBadgesRepository.findProfileByTarget | `src/modules/community/repositories/verified-badges.repository.ts:205` |
| `community.verified_badges` | ESCRIBE | ACTUALIZA | POR_TIPO | IdentityAssertionsController.revoke → IdentityAssertionsService.revoke → IdentityVerificationEffectsService.applyRevoked → CommunityVerificationService.applyRevoked → CommunityVerificationService.revokeProfileBadges → VerifiedBadgesRepository.revoke | `src/modules/community/repositories/verified-badges.repository.ts:140` |
| `community.verified_badges` | LEE | LEE | DIRECTA | IdentityAssertionsController.revoke → IdentityAssertionsService.revoke → IdentityVerificationEffectsService.applyRevoked → CommunityVerificationService.applyRevoked → CommunityVerificationService.revokeProfileBadges → VerifiedBadgesRepository.findAllBySubject | `src/modules/community/repositories/verified-badges.repository.ts:73` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | IdentityAssertionsController.revoke → IdentityAssertionsService.revoke → IdentityCaseScope.findAuthorizedCase → IdentityCaseScope.subjectInTenant | `src/modules/identity_assurance/services/identity-case-scope.service.ts:230` |
| `identity_assurance.identity_assertions` | LEE | LEE | DIRECTA | IdentityAssertionsController.revoke → IdentityAssertionsService.revoke → IdentityAssertionsRepository.findById | `src/modules/identity_assurance/repositories/identity-assertions.repository.ts:142` |
| `identity_assurance.identity_fraud_signals` | ESCRIBE | CREA | DIRECTA | IdentityAssertionsController.revoke → IdentityAssertionsService.revoke → IdentityFraudSignalsRepository.create | `src/modules/identity_assurance/repositories/identity-fraud-signals.repository.ts:52` |
| `identity_assurance.identity_verification_cases` | LEE | LEE | DIRECTA | IdentityAssertionsController.revoke → IdentityAssertionsService.revoke → IdentityCaseScope.findAuthorizedCase → IdentityVerificationCasesRepository.findById | `src/modules/identity_assurance/repositories/identity-cases.repository.ts:64` |
| `profiles.jurisdiction_authorizations` | LEE | LEE | DIRECTA | IdentityAssertionsController.revoke → IdentityAssertionsService.revoke → IdentityCaseScope.findAuthorizedCase → IdentityCaseScope.subjectInTenant | `src/modules/identity_assurance/services/identity-case-scope.service.ts:208` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | IdentityAssertionsController.revoke → IdentityAssertionsService.revoke → IdentityCaseScope.findAuthorizedCase → IdentityCaseScope.subjectInTenant | `src/modules/identity_assurance/services/identity-case-scope.service.ts:221` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `RevokeAssertionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `revocationReasonConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concepto: motivo de revocación (por defecto fraude) | `src/modules/identity_assurance/dto/revoke-assertion.dto.ts:15` |
| `fraudSignalTypeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concepto: tipo de señal de fraude a derivar (si la revocación es por fraude) | `src/modules/identity_assurance/dto/revoke-assertion.dto.ts:27` |
| `fraudSeverityConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concepto: severidad de la señal derivada | `src/modules/identity_assurance/dto/revoke-assertion.dto.ts:38` |
| `raiseFraudSignal` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | ¿Derivar una señal de fraude a partir de la revocación? | `src/modules/identity_assurance/dto/revoke-assertion.dto.ts:49` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "revocationReasonConceptId": "00000000-0000-4000-8000-000000000001",
  "fraudSignalTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "fraudSeverityConceptId": "00000000-0000-4000-8000-000000000001",
  "raiseFraudSignal": false
}
```

</details>

### Respuesta — `Promise<AssertionRevokedResponseDto>` · DTO `AssertionRevokedResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/identity_assurance/dto/identity-responses.dto.ts:240` |
| `revokedAt` | `string` | Sí | formato date-time | — | Valor de revoked at mantenido por la instancia. | `src/modules/identity_assurance/dto/identity-responses.dto.ts:244` |
| `caseStatus` | `string` | Sí | formato uuid | — | Valor de case status mantenido por la instancia. | `src/modules/identity_assurance/dto/identity-responses.dto.ts:248` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: La aserción ya está revocada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Para derivar una señal de fraude se requieren tipo y severidad |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/identity_assurance.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/identity_assurance/controllers/identity-endpoints.controller.spec.ts:81` |

### Flujos

- src / modules / identity assurance — etapa `ctrl:IdentityAssertionsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 2. POST /identity/authorities

- **Origen:** CONTRATO
- **Nombre:** Registrar una autoridad de identidad
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IdentityAuthoritiesController.register` — `src/modules/identity_assurance/controllers/identity-authorities.controller.ts:40`

### Qué es y para qué sirve (negocio)

Registrar una autoridad de identidad. Dentro del módulo (descripción del modelo, en inglés): «Verifies patients, practitioners, representatives and organization operators against authoritative ministries, civil registries, professional boards and government data platforms.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_27_identity_assurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /identity/authorities` la atiende `IdentityAuthoritiesController.register` (src/modules/identity_assurance/controllers/identity-authorities.controller.ts:40). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `RegisterAuthorityDto` (6 campos, 3 obligatorios). Delega en `IdentityAuthoritiesService.registerAuthority`. Crea filas en identity_assurance.identity_authorities.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/identity_assurance/controllers/identity-authorities.controller.ts:40` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `identity_assurance.identity_authorities` | ESCRIBE | CREA | DIRECTA | IdentityAuthoritiesController.register → IdentityAuthoritiesService.registerAuthority → IdentityAuthoritiesRepository.create | `src/modules/identity_assurance/repositories/identity-authorities.repository.ts:108` |

### Cuerpo — DTO `RegisterAuthorityDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Obsoleto: el tenant se deriva de la sesión (X-Tenant-Id). Si llega, debe coincidir con él; el servidor nunca lo toma como fuente de verdad. | `src/modules/identity_assurance/dto/create-authority.dto.ts:23` |
| `authorityCode` | `string` | Sí | longitud mínima 1; longitud máxima 100 | `@IsString()` `@MinLength(1)` `@MaxLength(100)` | Código único de la autoridad | `src/modules/identity_assurance/dto/create-authority.dto.ts:32` |
| `name` | `string` | Sí | longitud mínima 1; longitud máxima 200 | `@IsString()` `@MinLength(1)` `@MaxLength(200)` | Nombre legible de la autoridad | `src/modules/identity_assurance/dto/create-authority.dto.ts:44` |
| `authorityTypeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Concepto: tipo de autoridad | `src/modules/identity_assurance/dto/create-authority.dto.ts:51` |
| `jurisdictionConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concepto: jurisdicción | `src/modules/identity_assurance/dto/create-authority.dto.ts:62` |
| `assuranceFrameworkConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concepto: marco de aseguramiento (NIST/eIDAS) | `src/modules/identity_assurance/dto/create-authority.dto.ts:73` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "authorityCode": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "authorityTypeConceptId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "authorityCode": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "authorityTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "jurisdictionConceptId": "00000000-0000-4000-8000-000000000001",
  "assuranceFrameworkConceptId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<AuthorityResponseDto>` · DTO `AuthorityResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/identity_assurance/dto/identity-responses.dto.ts:8` |
| `authorityCode` | `string` | Sí | — | — | Valor de authority code mantenido por la instancia. | `src/modules/identity_assurance/dto/identity-responses.dto.ts:12` |
| `status` | `string` | Sí | formato uuid | — | Valor de status mantenido por la instancia. | `src/modules/identity_assurance/dto/identity-responses.dto.ts:16` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/identity_assurance/dto/identity-responses.dto.ts:20` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/identity_assurance.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/identity_assurance/controllers/identity-endpoints.controller.spec.ts:22` |

### Flujos

- src / modules / identity assurance — etapa `ctrl:IdentityAuthoritiesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 3. POST /identity/authorities/{id}/endpoints

- **Origen:** CONTRATO
- **Nombre:** Publicar un endpoint de verificación de la autoridad
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IdentityAuthoritiesController.addEndpoint` — `src/modules/identity_assurance/controllers/identity-authorities.controller.ts:57`

### Qué es y para qué sirve (negocio)

Publicar un endpoint de verificación de la autoridad. Dentro del módulo (descripción del modelo, en inglés): «Verifies patients, practitioners, representatives and organization operators against authoritative ministries, civil registries, professional boards and government data platforms.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_27_identity_assurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /identity/authorities/{id}/endpoints` la atiende `IdentityAuthoritiesController.addEndpoint` (src/modules/identity_assurance/controllers/identity-authorities.controller.ts:57). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateAuthorityEndpointDto` (5 campos, 2 obligatorios). Delega en `IdentityAuthoritiesService.addEndpoint`. Crea filas en identity_assurance.identity_authority_endpoints. Lee identity_assurance.identity_authorities, integrations.integration_endpoints, integrations.provider_connections.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/identity_assurance/controllers/identity-authorities.controller.ts:57` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/identity_assurance/controllers/identity-authorities.controller.ts:57` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `identity_assurance.identity_authorities` | LEE | LEE | DIRECTA | IdentityAuthoritiesController.addEndpoint → IdentityAuthoritiesService.addEndpoint → IdentityAuthoritiesRepository.findById | `src/modules/identity_assurance/repositories/identity-authorities.repository.ts:97` |
| `identity_assurance.identity_authority_endpoints` | ESCRIBE | CREA | DIRECTA | IdentityAuthoritiesController.addEndpoint → IdentityAuthoritiesService.addEndpoint → IdentityAuthorityEndpointsRepository.create | `src/modules/identity_assurance/repositories/identity-authorities.repository.ts:154` |
| `integrations.integration_endpoints` | LEE | LEE | DIRECTA | IdentityAuthoritiesController.addEndpoint → IdentityAuthoritiesService.addEndpoint → IdentityAuthoritiesService.assertEndpointInTenant | `src/modules/identity_assurance/services/identity-authorities.service.ts:153` |
| `integrations.provider_connections` | LEE | LEE | DIRECTA | IdentityAuthoritiesController.addEndpoint → IdentityAuthoritiesService.addEndpoint → IdentityAuthoritiesService.assertEndpointInTenant | `src/modules/identity_assurance/services/identity-authorities.service.ts:157` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateAuthorityEndpointDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `integrationEndpointId` | `string` | Sí | formato uuid | `@IsUUID()` | Endpoint de integración subyacente | `src/modules/identity_assurance/dto/create-authority-endpoint.dto.ts:14` |
| `capabilityConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Concepto: capacidad del endpoint | `src/modules/identity_assurance/dto/create-authority-endpoint.dto.ts:24` |
| `assuranceLevelConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concepto: nivel de aseguramiento del endpoint | `src/modules/identity_assurance/dto/create-authority-endpoint.dto.ts:35` |
| `requestContractVersion` | `string` | No | longitud máxima 50 | `@IsOptional()` `@IsString()` `@MaxLength(50)` | Versión del contrato de request | `src/modules/identity_assurance/dto/create-authority-endpoint.dto.ts:47` |
| `responseContractVersion` | `string` | No | longitud máxima 50 | `@IsOptional()` `@IsString()` `@MaxLength(50)` | Versión del contrato de response | `src/modules/identity_assurance/dto/create-authority-endpoint.dto.ts:59` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "integrationEndpointId": "00000000-0000-4000-8000-000000000001",
  "capabilityConceptId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "integrationEndpointId": "00000000-0000-4000-8000-000000000001",
  "capabilityConceptId": "00000000-0000-4000-8000-000000000001",
  "assuranceLevelConceptId": "00000000-0000-4000-8000-000000000001",
  "requestContractVersion": "valor-ejemplo",
  "responseContractVersion": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<AuthorityEndpointResponseDto>` · DTO `AuthorityEndpointResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/identity_assurance/dto/identity-responses.dto.ts:28` |
| `identityAuthorityId` | `string` | Sí | formato uuid | — | Identificador asociado a identity authority. | `src/modules/identity_assurance/dto/identity-responses.dto.ts:32` |
| `status` | `string` | Sí | formato uuid | — | Valor de status mantenido por la instancia. | `src/modules/identity_assurance/dto/identity-responses.dto.ts:36` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/identity_assurance/dto/identity-responses.dto.ts:40` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/identity_assurance.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/identity_assurance/controllers/identity-endpoints.controller.spec.ts:27` |

### Flujos

- src / modules / identity assurance — etapa `ctrl:IdentityAuthoritiesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 4. POST /identity/checks/{id}/attempts

- **Origen:** CONTRATO
- **Nombre:** Ejecutar un intento contra la autoridad externa (idempotente)
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IdentityChecksController.recordAttempt` — `src/modules/identity_assurance/controllers/identity-checks.controller.ts:38`

### Qué es y para qué sirve (negocio)

Ejecutar un intento contra la autoridad externa (idempotente). Dentro del módulo (descripción del modelo, en inglés): «Verifies patients, practitioners, representatives and organization operators against authoritative ministries, civil registries, professional boards and government data platforms.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_27_identity_assurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /identity/checks/{id}/attempts` la atiende `IdentityChecksController.recordAttempt` (src/modules/identity_assurance/controllers/identity-checks.controller.ts:38). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `IdentityAssuranceRecordAttemptDto` (7 campos, 1 obligatorio). Delega en `IdentityChecksService.recordAttempt`. Crea filas en identity_assurance.identity_verification_attempts. Actualiza identity_assurance.identity_checks. Lee directory.tenant_memberships, identity_assurance.identity_checks, identity_assurance.identity_verification_attempts, identity_assurance.identity_verification_cases, profiles.jurisdiction_authorizations, profiles.person_account_links.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/identity_assurance/controllers/identity-checks.controller.ts:38` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/identity_assurance/controllers/identity-checks.controller.ts:38` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | IdentityChecksController.recordAttempt → IdentityChecksService.recordAttempt → IdentityChecksService.loadCheck → IdentityCaseScope.findAuthorizedCase → IdentityCaseScope.subjectInTenant | `src/modules/identity_assurance/services/identity-case-scope.service.ts:230` |
| `identity_assurance.identity_checks` | ESCRIBE | ACTUALIZA | POR_TIPO | IdentityChecksController.recordAttempt → IdentityChecksService.recordAttempt | `src/modules/identity_assurance/services/identity-checks.service.ts:261` |
| `identity_assurance.identity_checks` | LEE | LEE | DIRECTA | IdentityChecksController.recordAttempt → IdentityChecksService.recordAttempt → IdentityChecksService.loadCheck → IdentityChecksRepository.findById | `src/modules/identity_assurance/repositories/identity-checks.repository.ts:141` |
| `identity_assurance.identity_verification_attempts` | ESCRIBE | CREA | DIRECTA | IdentityChecksController.recordAttempt → IdentityChecksService.recordAttempt → IdentityVerificationAttemptsRepository.create | `src/modules/identity_assurance/repositories/identity-checks.repository.ts:343` |
| `identity_assurance.identity_verification_attempts` | LEE | LEE | DIRECTA | IdentityChecksController.recordAttempt → IdentityChecksService.recordAttempt → IdentityVerificationAttemptsRepository.countByCase | `src/modules/identity_assurance/repositories/identity-checks.repository.ts:279` |
| `identity_assurance.identity_verification_cases` | LEE | LEE | DIRECTA | IdentityChecksController.recordAttempt → IdentityChecksService.recordAttempt → IdentityChecksService.loadCheck → IdentityCaseScope.findAuthorizedCase → IdentityVerificationCasesRepository.findById | `src/modules/identity_assurance/repositories/identity-cases.repository.ts:64` |
| `profiles.jurisdiction_authorizations` | LEE | LEE | DIRECTA | IdentityChecksController.recordAttempt → IdentityChecksService.recordAttempt → IdentityChecksService.loadCheck → IdentityCaseScope.findAuthorizedCase → IdentityCaseScope.subjectInTenant | `src/modules/identity_assurance/services/identity-case-scope.service.ts:208` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | IdentityChecksController.recordAttempt → IdentityChecksService.recordAttempt → IdentityChecksService.loadCheck → IdentityCaseScope.findAuthorizedCase → IdentityCaseScope.subjectInTenant | `src/modules/identity_assurance/services/identity-case-scope.service.ts:221` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `IdentityAssuranceRecordAttemptDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `identityAuthorityEndpointId` | `string` | Sí | formato uuid | `@IsUUID()` | Endpoint de autoridad usado en el intento | `src/modules/identity_assurance/dto/record-attempt.dto.ts:25` |
| `outcome` | `string` | No | valores: SUCCESS, PENDING, FAILED | `@IsOptional()` `@IsIn(['SUCCESS', 'PENDING', 'FAILED'])` | Resultado técnico del intento | `src/modules/identity_assurance/dto/record-attempt.dto.ts:37` |
| `idempotencyKey` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Clave de idempotencia del intento | `src/modules/identity_assurance/dto/record-attempt.dto.ts:49` |
| `requestMessageId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Mensaje saliente correlacionado | `src/modules/identity_assurance/dto/record-attempt.dto.ts:60` |
| `responseMessageId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Mensaje entrante correlacionado | `src/modules/identity_assurance/dto/record-attempt.dto.ts:71` |
| `technicalErrorCode` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Código de error técnico | `src/modules/identity_assurance/dto/record-attempt.dto.ts:83` |
| `retryEligible` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | ¿Es elegible para reintento? | `src/modules/identity_assurance/dto/record-attempt.dto.ts:91` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "identityAuthorityEndpointId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "identityAuthorityEndpointId": "00000000-0000-4000-8000-000000000001",
  "outcome": "SUCCESS",
  "idempotencyKey": "valor-ejemplo",
  "requestMessageId": "00000000-0000-4000-8000-000000000001",
  "responseMessageId": "00000000-0000-4000-8000-000000000001",
  "technicalErrorCode": "CODIGO_EJEMPLO",
  "retryEligible": true
}
```

</details>

### Respuesta — `Promise<AttemptResponseDto>` · DTO `AttemptResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/identity_assurance/dto/identity-responses.dto.ts:120` |
| `attemptNumber` | `number` | Sí | — | — | Valor de attempt number mantenido por la instancia. | `src/modules/identity_assurance/dto/identity-responses.dto.ts:124` |
| `outcome` | `string` | Sí | formato uuid | — | Valor de outcome mantenido por la instancia. | `src/modules/identity_assurance/dto/identity-responses.dto.ts:128` |
| `checkStatus` | `string` | Sí | formato uuid | — | Valor de check status mantenido por la instancia. | `src/modules/identity_assurance/dto/identity-responses.dto.ts:132` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Check de identidad no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/identity_assurance.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/identity_assurance/controllers/identity-endpoints.controller.spec.ts:49` |

### Flujos

- src / modules / identity assurance — etapa `ctrl:IdentityChecksController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 5. POST /identity/checks/{id}/results

- **Origen:** CONTRATO
- **Nombre:** Registrar el resultado inmutable del check (con supersede)
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IdentityChecksController.recordResult` — `src/modules/identity_assurance/controllers/identity-checks.controller.ts:58`

### Qué es y para qué sirve (negocio)

Registrar el resultado inmutable del check (con supersede). Dentro del módulo (descripción del modelo, en inglés): «Verifies patients, practitioners, representatives and organization operators against authoritative ministries, civil registries, professional boards and government data platforms.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_27_identity_assurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /identity/checks/{id}/results` la atiende `IdentityChecksController.recordResult` (src/modules/identity_assurance/controllers/identity-checks.controller.ts:58). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `RecordResultDto` (4 campos, 1 obligatorio). Delega en `IdentityChecksService.recordResult`. Crea filas en audit.verified_badges_history, community.verified_badges, identity_assurance.identity_assertions, identity_assurance.identity_check_results. Actualiza community.public_profiles, community.verified_badges, directory.tenants, identity_assurance.identity_checks, identity_assurance.identity_verification_attempts, identity_assurance.identity_verification_cases, profiles.health_practitioner_profiles, profiles.jurisdiction_authorizations. Lee community.public_profiles, community.verified_badges, directory.tenant_memberships, directory.tenants, identity_assurance.identity_authority_endpoints, identity_assurance.identity_check_results, identity_assurance.identity_checks, identity_assurance.identity_verification_attempts y 4 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/identity_assurance/controllers/identity-checks.controller.ts:58` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/identity_assurance/controllers/identity-checks.controller.ts:58` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.verified_badges_history` | ESCRIBE | CREA | DIRECTA | IdentityChecksController.recordResult → IdentityChecksService.recordResult → IdentityChecksService.settleCase → IdentityChecksService.verifyCase → IdentityVerificationEffectsService.applyVerified → IdentityVerificationEffectsService.activateLicense → CommunityVerificationService.applyVerified → VerifiedBadgesRepository.recordHistory | `src/modules/community/repositories/verified-badges.repository.ts:172` |
| `community.public_profiles` | ESCRIBE | ACTUALIZA | POR_TIPO | IdentityChecksController.recordResult → IdentityChecksService.recordResult → IdentityChecksService.settleCase → IdentityChecksService.verifyCase → IdentityVerificationEffectsService.applyVerified → IdentityVerificationEffectsService.activateLicense → CommunityVerificationService.applyVerified | `src/modules/community/services/community-verification.service.ts:175` |
| `community.public_profiles` | LEE | LEE | DIRECTA | IdentityChecksController.recordResult → IdentityChecksService.recordResult → IdentityChecksService.settleCase → IdentityChecksService.verifyCase → IdentityVerificationEffectsService.applyVerified → IdentityVerificationEffectsService.activateLicense → CommunityVerificationService.applyVerified → VerifiedBadgesRepository.findProfileByTarget | `src/modules/community/repositories/verified-badges.repository.ts:205` |
| `community.verified_badges` | ESCRIBE | ACTUALIZA | POR_TIPO | IdentityChecksController.recordResult → IdentityChecksService.recordResult → IdentityChecksService.settleCase → IdentityChecksService.verifyCase → IdentityVerificationEffectsService.applyVerified → IdentityVerificationEffectsService.activateLicense → CommunityVerificationService.applyVerified → VerifiedBadgesRepository.grant | `src/modules/community/repositories/verified-badges.repository.ts:94` |
| `community.verified_badges` | ESCRIBE | CREA | DIRECTA | IdentityChecksController.recordResult → IdentityChecksService.recordResult → IdentityChecksService.settleCase → IdentityChecksService.verifyCase → IdentityVerificationEffectsService.applyVerified → IdentityVerificationEffectsService.activateLicense → CommunityVerificationService.applyVerified → VerifiedBadgesRepository.grant | `src/modules/community/repositories/verified-badges.repository.ts:103` |
| `community.verified_badges` | LEE | LEE | DIRECTA | IdentityChecksController.recordResult → IdentityChecksService.recordResult → IdentityChecksService.settleCase → IdentityChecksService.verifyCase → IdentityVerificationEffectsService.applyVerified → IdentityVerificationEffectsService.activateLicense → CommunityVerificationService.applyVerified → VerifiedBadgesRepository.findActive | `src/modules/community/repositories/verified-badges.repository.ts:61` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | IdentityChecksController.recordResult → IdentityChecksService.recordResult → IdentityChecksService.loadCheck → IdentityCaseScope.findAuthorizedCase → IdentityCaseScope.subjectInTenant | `src/modules/identity_assurance/services/identity-case-scope.service.ts:230` |
| `directory.tenants` | ESCRIBE | ACTUALIZA | POR_TIPO | IdentityChecksController.recordResult → IdentityChecksService.recordResult → IdentityChecksService.settleCase → IdentityChecksService.verifyCase → IdentityVerificationEffectsService.applyVerified → IdentityVerificationEffectsService.verifyTenant | `src/modules/identity_assurance/services/identity-verification-effects.service.ts:249` |
| `directory.tenants` | LEE | LEE | DIRECTA | IdentityChecksController.recordResult → IdentityChecksService.recordResult → IdentityChecksService.settleCase → IdentityChecksService.verifyCase → IdentityVerificationEffectsService.applyVerified → IdentityVerificationEffectsService.verifyTenant → TenantsRepository.findById | `src/modules/directory/repositories/tenants.repository.ts:71` |
| `identity_assurance.identity_assertions` | ESCRIBE | CREA | DIRECTA | IdentityChecksController.recordResult → IdentityChecksService.recordResult → IdentityChecksService.settleCase → IdentityChecksService.verifyCase → IdentityChecksService.issueAssertion → IdentityAssertionsRepository.create | `src/modules/identity_assurance/repositories/identity-assertions.repository.ts:171` |
| `identity_assurance.identity_authority_endpoints` | LEE | LEE | DIRECTA | IdentityChecksController.recordResult → IdentityChecksService.recordResult → IdentityChecksService.settleCase → IdentityChecksService.verifyCase → IdentityChecksService.issueAssertion → IdentityAuthorityEndpointsRepository.findById | `src/modules/identity_assurance/repositories/identity-authorities.repository.ts:140` |
| `identity_assurance.identity_check_results` | ESCRIBE | CREA | DIRECTA | IdentityChecksController.recordResult → IdentityChecksService.recordResult → IdentityCheckResultsRepository.create | `src/modules/identity_assurance/repositories/identity-checks.repository.ts:398` |
| `identity_assurance.identity_check_results` | LEE | LEE | DIRECTA | IdentityChecksController.recordResult → IdentityChecksService.recordResult → IdentityCheckResultsRepository.findLatestByCheck | `src/modules/identity_assurance/repositories/identity-checks.repository.ts:383` |
| `identity_assurance.identity_checks` | ESCRIBE | ACTUALIZA | POR_TIPO | IdentityChecksController.recordResult → IdentityChecksService.recordResult | `src/modules/identity_assurance/services/identity-checks.service.ts:319` |
| `identity_assurance.identity_checks` | LEE | LEE | DIRECTA | IdentityChecksController.recordResult → IdentityChecksService.recordResult → IdentityChecksService.loadCheck → IdentityChecksRepository.findById | `src/modules/identity_assurance/repositories/identity-checks.repository.ts:141` |
| `identity_assurance.identity_verification_attempts` | ESCRIBE | ACTUALIZA | POR_TIPO | IdentityChecksController.recordResult → IdentityChecksService.recordResult → IdentityChecksService.completeInFlightAttempt | `src/modules/identity_assurance/services/identity-checks.service.ts:368` |
| `identity_assurance.identity_verification_attempts` | LEE | LEE | DIRECTA | IdentityChecksController.recordResult → IdentityChecksService.recordResult → IdentityVerificationAttemptsRepository.existsCompletedForCase | `src/modules/identity_assurance/repositories/identity-checks.repository.ts:289` |
| `identity_assurance.identity_verification_cases` | ESCRIBE | ACTUALIZA | POR_TIPO | IdentityChecksController.recordResult → IdentityChecksService.recordResult → IdentityChecksService.settleCase | `src/modules/identity_assurance/services/identity-checks.service.ts:411` |
| `identity_assurance.identity_verification_cases` | LEE | LEE | DIRECTA | IdentityChecksController.recordResult → IdentityChecksService.recordResult → IdentityChecksService.settleCase → IdentityVerificationCasesRepository.findById | `src/modules/identity_assurance/repositories/identity-cases.repository.ts:64` |
| `profiles.health_practitioner_profiles` | ESCRIBE | ACTUALIZA | POR_TIPO | IdentityChecksController.recordResult → IdentityChecksService.recordResult → IdentityChecksService.settleCase → IdentityChecksService.verifyCase → IdentityVerificationEffectsService.applyVerified → IdentityVerificationEffectsService.activateLicense | `src/modules/identity_assurance/services/identity-verification-effects.service.ts:198` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | IdentityChecksController.recordResult → IdentityChecksService.recordResult → IdentityChecksService.settleCase → IdentityChecksService.verifyCase → IdentityVerificationEffectsService.applyVerified → IdentityVerificationEffectsService.activateLicense → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.jurisdiction_authorizations` | ESCRIBE | ACTUALIZA | POR_TIPO | IdentityChecksController.recordResult → IdentityChecksService.recordResult → IdentityChecksService.settleCase → IdentityChecksService.verifyCase → IdentityVerificationEffectsService.applyVerified → IdentityVerificationEffectsService.activateLicense | `src/modules/identity_assurance/services/identity-verification-effects.service.ts:188` |
| `profiles.jurisdiction_authorizations` | LEE | LEE | DIRECTA | IdentityChecksController.recordResult → IdentityChecksService.recordResult → IdentityChecksService.loadCheck → IdentityCaseScope.findAuthorizedCase → IdentityCaseScope.subjectInTenant | `src/modules/identity_assurance/services/identity-case-scope.service.ts:208` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | IdentityChecksController.recordResult → IdentityChecksService.recordResult → IdentityChecksService.loadCheck → IdentityCaseScope.findAuthorizedCase → IdentityCaseScope.subjectInTenant | `src/modules/identity_assurance/services/identity-case-scope.service.ts:221` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `RecordResultDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `result` | `string` | Sí | valores: MATCH, NO_MATCH | `@IsIn(['MATCH', 'NO_MATCH'])` | Veredicto del check | `src/modules/identity_assurance/dto/record-result.dto.ts:25` |
| `matchScore` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Puntaje de coincidencia (0..1) | `src/modules/identity_assurance/dto/record-result.dto.ts:36` |
| `discrepancyCodes` | `array<string>` | No | — | `@IsOptional()` `@IsArray()` `@IsString({ each: true })` | Códigos de discrepancia detectados | `src/modules/identity_assurance/dto/record-result.dto.ts:48` |
| `sourceResponseHash` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Hash de la respuesta fuente | `src/modules/identity_assurance/dto/record-result.dto.ts:60` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "result": "MATCH"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "result": "MATCH",
  "matchScore": "0.98",
  "discrepancyCodes": [
    "CODIGO_EJEMPLO"
  ],
  "sourceResponseHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
}
```

</details>

### Respuesta — `Promise<CheckResultResponseDto>` · DTO `CheckResultResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/identity_assurance/dto/identity-responses.dto.ts:140` |
| `resultVersion` | `number` | Sí | — | — | Valor de result version mantenido por la instancia. | `src/modules/identity_assurance/dto/identity-responses.dto.ts:144` |
| `result` | `string` | Sí | formato uuid | — | Valor de result mantenido por la instancia. | `src/modules/identity_assurance/dto/identity-responses.dto.ts:148` |
| `checkStatus` | `string` | Sí | formato uuid | — | Valor de check status mantenido por la instancia. | `src/modules/identity_assurance/dto/identity-responses.dto.ts:152` |
| `caseStatus` | `string` | No | formato uuid | — | Estado del caso si este resultado lo resolvió | `src/modules/identity_assurance/dto/identity-responses.dto.ts:160` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Check de identidad no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: No existe un intento completado para registrar resultado; PreconditionFailedException: No se pudo determinar la autoridad que verificó el caso |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/identity_assurance.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/identity_assurance/controllers/identity-endpoints.controller.spec.ts:55` |

### Flujos

- src / modules / identity assurance — etapa `ctrl:IdentityChecksController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 6. POST /identity/manual-review/{id}/decision

- **Origen:** CONTRATO
- **Nombre:** Resolver una revisión manual (decisión)
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IdentityManualReviewController.decide` — `src/modules/identity_assurance/controllers/identity-manual-review.controller.ts:33`

### Qué es y para qué sirve (negocio)

Resolver una revisión manual (decisión). Dentro del módulo (descripción del modelo, en inglés): «Verifies patients, practitioners, representatives and organization operators against authoritative ministries, civil registries, professional boards and government data platforms.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_27_identity_assurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /identity/manual-review/{id}/decision` la atiende `IdentityManualReviewController.decide` (src/modules/identity_assurance/controllers/identity-manual-review.controller.ts:33). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `ReviewDecisionDto` (2 campos, 1 obligatorio). Delega en `IdentityManualReviewService.decide`. Crea filas en audit.verified_badges_history, community.verified_badges, identity_assurance.identity_assertions, identity_assurance.identity_check_results. Actualiza community.public_profiles, community.verified_badges, directory.tenants, identity_assurance.identity_checks, identity_assurance.identity_fraud_signals, identity_assurance.identity_verification_cases, profiles.health_practitioner_profiles, profiles.jurisdiction_authorizations. Lee community.public_profiles, community.verified_badges, directory.tenant_memberships, directory.tenants, identity_assurance.identity_authority_endpoints, identity_assurance.identity_check_results, identity_assurance.identity_checks, identity_assurance.identity_fraud_signals y 6 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/identity_assurance/controllers/identity-manual-review.controller.ts:33` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/identity_assurance/controllers/identity-manual-review.controller.ts:33` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.verified_badges_history` | ESCRIBE | CREA | DIRECTA | IdentityManualReviewController.decide → IdentityManualReviewService.decide → IdentityChecksService.settleManualApproval → IdentityChecksService.verifyCase → IdentityVerificationEffectsService.applyVerified → IdentityVerificationEffectsService.activateLicense → CommunityVerificationService.applyVerified → VerifiedBadgesRepository.recordHistory | `src/modules/community/repositories/verified-badges.repository.ts:172` |
| `community.public_profiles` | ESCRIBE | ACTUALIZA | POR_TIPO | IdentityManualReviewController.decide → IdentityManualReviewService.decide → IdentityChecksService.settleManualApproval → IdentityChecksService.verifyCase → IdentityVerificationEffectsService.applyVerified → IdentityVerificationEffectsService.activateLicense → CommunityVerificationService.applyVerified | `src/modules/community/services/community-verification.service.ts:175` |
| `community.public_profiles` | LEE | LEE | DIRECTA | IdentityManualReviewController.decide → IdentityManualReviewService.decide → IdentityChecksService.settleManualApproval → IdentityChecksService.verifyCase → IdentityVerificationEffectsService.applyVerified → IdentityVerificationEffectsService.activateLicense → CommunityVerificationService.applyVerified → VerifiedBadgesRepository.findProfileByTarget | `src/modules/community/repositories/verified-badges.repository.ts:205` |
| `community.verified_badges` | ESCRIBE | ACTUALIZA | POR_TIPO | IdentityManualReviewController.decide → IdentityManualReviewService.decide → IdentityChecksService.settleManualApproval → IdentityChecksService.verifyCase → IdentityVerificationEffectsService.applyVerified → IdentityVerificationEffectsService.activateLicense → CommunityVerificationService.applyVerified → VerifiedBadgesRepository.grant | `src/modules/community/repositories/verified-badges.repository.ts:94` |
| `community.verified_badges` | ESCRIBE | CREA | DIRECTA | IdentityManualReviewController.decide → IdentityManualReviewService.decide → IdentityChecksService.settleManualApproval → IdentityChecksService.verifyCase → IdentityVerificationEffectsService.applyVerified → IdentityVerificationEffectsService.activateLicense → CommunityVerificationService.applyVerified → VerifiedBadgesRepository.grant | `src/modules/community/repositories/verified-badges.repository.ts:103` |
| `community.verified_badges` | LEE | LEE | DIRECTA | IdentityManualReviewController.decide → IdentityManualReviewService.decide → IdentityChecksService.settleManualApproval → IdentityChecksService.verifyCase → IdentityVerificationEffectsService.applyVerified → IdentityVerificationEffectsService.activateLicense → CommunityVerificationService.applyVerified → VerifiedBadgesRepository.findActive | `src/modules/community/repositories/verified-badges.repository.ts:61` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | IdentityManualReviewController.decide → IdentityManualReviewService.decide → IdentityCaseScope.findAuthorizedCase → IdentityCaseScope.subjectInTenant | `src/modules/identity_assurance/services/identity-case-scope.service.ts:230` |
| `directory.tenants` | ESCRIBE | ACTUALIZA | POR_TIPO | IdentityManualReviewController.decide → IdentityManualReviewService.decide → IdentityChecksService.settleManualApproval → IdentityChecksService.verifyCase → IdentityVerificationEffectsService.applyVerified → IdentityVerificationEffectsService.verifyTenant | `src/modules/identity_assurance/services/identity-verification-effects.service.ts:249` |
| `directory.tenants` | LEE | LEE | DIRECTA | IdentityManualReviewController.decide → IdentityManualReviewService.decide → IdentityChecksService.settleManualApproval → IdentityChecksService.verifyCase → IdentityVerificationEffectsService.applyVerified → IdentityVerificationEffectsService.verifyTenant → TenantsRepository.findById | `src/modules/directory/repositories/tenants.repository.ts:71` |
| `identity_assurance.identity_assertions` | ESCRIBE | CREA | DIRECTA | IdentityManualReviewController.decide → IdentityManualReviewService.decide → IdentityChecksService.settleManualApproval → IdentityChecksService.verifyCase → IdentityChecksService.issueAssertion → IdentityAssertionsRepository.create | `src/modules/identity_assurance/repositories/identity-assertions.repository.ts:171` |
| `identity_assurance.identity_authority_endpoints` | LEE | LEE | DIRECTA | IdentityManualReviewController.decide → IdentityManualReviewService.decide → IdentityChecksService.settleManualApproval → IdentityChecksService.verifyCase → IdentityChecksService.issueAssertion → IdentityAuthorityEndpointsRepository.findById | `src/modules/identity_assurance/repositories/identity-authorities.repository.ts:140` |
| `identity_assurance.identity_check_results` | ESCRIBE | CREA | DIRECTA | IdentityManualReviewController.decide → IdentityManualReviewService.decide → IdentityChecksService.settleManualApproval → IdentityCheckResultsRepository.create | `src/modules/identity_assurance/repositories/identity-checks.repository.ts:398` |
| `identity_assurance.identity_check_results` | LEE | LEE | DIRECTA | IdentityManualReviewController.decide → IdentityManualReviewService.decide → IdentityChecksService.settleManualApproval → IdentityCheckResultsRepository.findLatestByCheck | `src/modules/identity_assurance/repositories/identity-checks.repository.ts:383` |
| `identity_assurance.identity_checks` | ESCRIBE | ACTUALIZA | POR_TIPO | IdentityManualReviewController.decide → IdentityManualReviewService.decide → IdentityChecksService.settleManualApproval | `src/modules/identity_assurance/services/identity-checks.service.ts:483` |
| `identity_assurance.identity_checks` | LEE | LEE | DIRECTA | IdentityManualReviewController.decide → IdentityManualReviewService.decide → IdentityChecksService.settleManualApproval → IdentityChecksRepository.findRequiredByCase | `src/modules/identity_assurance/repositories/identity-checks.repository.ts:238` |
| `identity_assurance.identity_fraud_signals` | ESCRIBE | ACTUALIZA | POR_TIPO | IdentityManualReviewController.decide → IdentityManualReviewService.decide → IdentityFraudSignalsRepository.resolveOpenForCase | `src/modules/identity_assurance/repositories/identity-fraud-signals.repository.ts:82` |
| `identity_assurance.identity_fraud_signals` | LEE | LEE | DIRECTA | IdentityManualReviewController.decide → IdentityManualReviewService.decide → IdentityFraudSignalsRepository.resolveOpenForCase | `src/modules/identity_assurance/repositories/identity-fraud-signals.repository.ts:76` |
| `identity_assurance.identity_manual_review_cases` | LEE | LEE | DIRECTA | IdentityManualReviewController.decide → IdentityManualReviewService.decide → IdentityManualReviewCasesRepository.findById | `src/modules/identity_assurance/repositories/identity-manual-review.repository.ts:48` |
| `identity_assurance.identity_verification_attempts` | LEE | LEE | DIRECTA | IdentityManualReviewController.decide → IdentityManualReviewService.decide → IdentityChecksService.settleManualApproval → IdentityChecksService.verifyCase → IdentityChecksService.issueAssertion → IdentityVerificationAttemptsRepository.findLatestCompletedByCase | `src/modules/identity_assurance/repositories/identity-checks.repository.ts:301` |
| `identity_assurance.identity_verification_cases` | ESCRIBE | ACTUALIZA | POR_TIPO | IdentityManualReviewController.decide → IdentityManualReviewService.decide → IdentityChecksService.settleManualApproval → IdentityChecksService.verifyCase | `src/modules/identity_assurance/services/identity-checks.service.ts:510` |
| `identity_assurance.identity_verification_cases` | LEE | LEE | DIRECTA | IdentityManualReviewController.decide → IdentityManualReviewService.decide → IdentityCaseScope.findAuthorizedCase → IdentityVerificationCasesRepository.findById | `src/modules/identity_assurance/repositories/identity-cases.repository.ts:64` |
| `profiles.health_practitioner_profiles` | ESCRIBE | ACTUALIZA | POR_TIPO | IdentityManualReviewController.decide → IdentityManualReviewService.decide → IdentityChecksService.settleManualApproval → IdentityChecksService.verifyCase → IdentityVerificationEffectsService.applyVerified → IdentityVerificationEffectsService.activateLicense | `src/modules/identity_assurance/services/identity-verification-effects.service.ts:198` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | IdentityManualReviewController.decide → IdentityManualReviewService.decide → IdentityChecksService.settleManualApproval → IdentityChecksService.verifyCase → IdentityVerificationEffectsService.applyVerified → IdentityVerificationEffectsService.activateLicense → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.jurisdiction_authorizations` | ESCRIBE | ACTUALIZA | POR_TIPO | IdentityManualReviewController.decide → IdentityManualReviewService.decide → IdentityChecksService.settleManualApproval → IdentityChecksService.verifyCase → IdentityVerificationEffectsService.applyVerified → IdentityVerificationEffectsService.activateLicense | `src/modules/identity_assurance/services/identity-verification-effects.service.ts:188` |
| `profiles.jurisdiction_authorizations` | LEE | LEE | DIRECTA | IdentityManualReviewController.decide → IdentityManualReviewService.decide → IdentityCaseScope.findAuthorizedCase → IdentityCaseScope.subjectInTenant | `src/modules/identity_assurance/services/identity-case-scope.service.ts:208` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | IdentityManualReviewController.decide → IdentityManualReviewService.decide → IdentityCaseScope.findAuthorizedCase → IdentityCaseScope.subjectInTenant | `src/modules/identity_assurance/services/identity-case-scope.service.ts:221` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `ReviewDecisionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `decision` | `string` | Sí | valores: APPROVED, REJECTED | `@IsIn(['APPROVED', 'REJECTED'])` | Decisión del revisor | `src/modules/identity_assurance/dto/review-decision.dto.ts:17` |
| `decisionReason` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | Motivo de la decisión | `src/modules/identity_assurance/dto/review-decision.dto.ts:26` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "decision": "APPROVED"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "decision": "APPROVED",
  "decisionReason": "Texto descriptivo de ejemplo"
}
```

</details>

### Respuesta — `Promise<ReviewDecisionResponseDto>` · DTO `ReviewDecisionResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/identity_assurance/dto/identity-responses.dto.ts:200` |
| `status` | `string` | Sí | formato uuid | — | Valor de status mantenido por la instancia. | `src/modules/identity_assurance/dto/identity-responses.dto.ts:204` |
| `caseStatus` | `string` | Sí | formato uuid | — | Valor de case status mantenido por la instancia. | `src/modules/identity_assurance/dto/identity-responses.dto.ts:208` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La revisión ya fue decidida; PreconditionFailedException: La revisión está asignada a otro revisor; PreconditionFailedException: La revisión quedó obsoleta: el caso ya no admite aprobación; PreconditionFailedException: No se pudo determinar la autoridad que verificó el caso |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/identity_assurance.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/identity-verification-cycle.int-spec.ts:178` |
| CONTROLADOR | `src/modules/identity_assurance/controllers/identity-endpoints.controller.spec.ts:68` |

### Flujos

- src / modules / identity assurance — etapa `ctrl:IdentityManualReviewController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 7. POST /identity/me/identity-verification

- **Origen:** CONTRATO
- **Nombre:** Solicitar la verificación de la propia identidad (paciente)
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IdentitySelfServiceController.requestPatientIdentity` — `src/modules/identity_assurance/controllers/identity-self-service.controller.ts:42`

### Qué es y para qué sirve (negocio)

Solicitar la verificación de la propia identidad (paciente). Dentro del módulo (descripción del modelo, en inglés): «Verifies patients, practitioners, representatives and organization operators against authoritative ministries, civil registries, professional boards and government data platforms.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_27_identity_assurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /identity/me/identity-verification` la atiende `IdentitySelfServiceController.requestPatientIdentity` (src/modules/identity_assurance/controllers/identity-self-service.controller.ts:42). Exige sesión; el controlador no declara roles. Valida el cuerpo como `IdentityAssuranceRequestVerificationDto` (6 campos, 0 obligatorios). Delega en `IdentitySelfServiceService.requestPatientIdentity`. Crea filas en identity_assurance.identity_checks, identity_assurance.identity_evidence_records, identity_assurance.identity_verification_cases, messaging.notification_requests. Lee common.file_versions, common.files, iam.authentication_credentials, iam.email_verifications, identity_assurance.identity_verification_cases, messaging.message_channels, messaging.message_templates, messaging.notification_requests y 3 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/identity_assurance/controllers/identity-self-service.controller.ts:42` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.file_versions` | LEE | LEE | DIRECTA | IdentitySelfServiceController.requestPatientIdentity → IdentitySelfServiceService.requestPatientIdentity → IdentitySelfServiceService.openVerification → IdentityEvidenceRecordsRepository.create → StoragePublicationService.guardFile | `src/common/storage/storage-publication.service.ts:190` |
| `common.files` | LEE | LEE | DIRECTA | IdentitySelfServiceController.requestPatientIdentity → IdentitySelfServiceService.requestPatientIdentity → IdentitySelfServiceService.openVerification → FilesRepository.findById | `src/modules/common/repositories/files.repository.ts:47` |
| `iam.authentication_credentials` | LEE | LEE | DIRECTA | IdentitySelfServiceController.requestPatientIdentity → IdentitySelfServiceService.requestPatientIdentity → IdentitySelfServiceService.openVerification → IdentitySelfServiceService.sendConfirmationEmail → IdentitySelfServiceService.findEmailForUser | `src/modules/identity_assurance/services/identity-self-service.service.ts:761` |
| `iam.email_verifications` | LEE | LEE | DIRECTA | IdentitySelfServiceController.requestPatientIdentity → IdentitySelfServiceService.requestPatientIdentity → IdentitySelfServiceService.openVerification → IdentitySelfServiceService.sendConfirmationEmail → IdentitySelfServiceService.findEmailForUser | `src/modules/identity_assurance/services/identity-self-service.service.ts:770` |
| `identity_assurance.identity_checks` | ESCRIBE | CREA | DIRECTA | IdentitySelfServiceController.requestPatientIdentity → IdentitySelfServiceService.requestPatientIdentity → IdentitySelfServiceService.openVerification → IdentityChecksRepository.create | `src/modules/identity_assurance/repositories/identity-checks.repository.ts:152` |
| `identity_assurance.identity_evidence_records` | ESCRIBE | CREA | DIRECTA | IdentitySelfServiceController.requestPatientIdentity → IdentitySelfServiceService.requestPatientIdentity → IdentitySelfServiceService.openVerification → IdentityEvidenceRecordsRepository.create | `src/modules/identity_assurance/repositories/identity-evidence.repository.ts:81` |
| `identity_assurance.identity_verification_cases` | ESCRIBE | CREA | DIRECTA | IdentitySelfServiceController.requestPatientIdentity → IdentitySelfServiceService.requestPatientIdentity → IdentitySelfServiceService.openVerification → IdentityVerificationCasesRepository.create | `src/modules/identity_assurance/repositories/identity-cases.repository.ts:75` |
| `identity_assurance.identity_verification_cases` | LEE | LEE | DIRECTA | IdentitySelfServiceController.requestPatientIdentity → IdentitySelfServiceService.requestPatientIdentity → IdentitySelfServiceService.openVerification → IdentityVerificationCasesRepository.countLiveForSubject | `src/modules/identity_assurance/repositories/identity-cases.repository.ts:111` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | IdentitySelfServiceController.requestPatientIdentity → IdentitySelfServiceService.requestPatientIdentity → IdentitySelfServiceService.openVerification → IdentitySelfServiceService.sendConfirmationEmail → NotificationsService.createRequest → NotificationsRepository.findChannelById | `src/modules/messaging/repositories/notifications.repository.ts:139` |
| `messaging.message_templates` | LEE | LEE | DIRECTA | IdentitySelfServiceController.requestPatientIdentity → IdentitySelfServiceService.requestPatientIdentity → IdentitySelfServiceService.openVerification → IdentitySelfServiceService.sendConfirmationEmail → NotificationsService.createRequest → NotificationsRepository.findTemplateById | `src/modules/messaging/repositories/notifications.repository.ts:153` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | IdentitySelfServiceController.requestPatientIdentity → IdentitySelfServiceService.requestPatientIdentity → IdentitySelfServiceService.openVerification → IdentitySelfServiceService.sendConfirmationEmail → NotificationsService.createRequest → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.notification_requests` | LEE | LEE | DIRECTA | IdentitySelfServiceController.requestPatientIdentity → IdentitySelfServiceService.requestPatientIdentity → IdentitySelfServiceService.openVerification → IdentitySelfServiceService.sendConfirmationEmail → NotificationsService.createRequest → NotificationsRepository.findLiveRequestByDebounceKey | `src/modules/messaging/repositories/notifications.repository.ts:388` |
| `messaging.queued_jobs` | LEE | LEE | DIRECTA | IdentitySelfServiceController.requestPatientIdentity → IdentitySelfServiceService.requestPatientIdentity → IdentitySelfServiceService.openVerification → IdentityEvidenceRecordsRepository.create → StoragePublicationService.guardFile → StorageLifecycleCoordinator.assertNoContender → QueuesRepository.findStorageIntents | `src/modules/messaging/repositories/queues.repository.ts:62` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | IdentitySelfServiceController.requestPatientIdentity → IdentitySelfServiceService.requestPatientIdentity → IdentitySelfServiceService.openVerification → IdentitySelfServiceService.sendConfirmationEmail → NotificationsService.createRequest → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | IdentitySelfServiceController.requestPatientIdentity → IdentitySelfServiceService.requestPatientIdentity → IdentitySelfServiceService.resolvePersonId → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |

### Cuerpo — DTO `IdentityAssuranceRequestVerificationDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `evidenceFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Archivo único para clientes anteriores. Los clientes nuevos envían frente, reverso y tres capturas del reto de vida. | `src/modules/identity_assurance/dto/request-verification.dto.ts:24` |
| `documentFrontFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/identity_assurance/dto/request-verification.dto.ts:29` |
| `documentBackFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/identity_assurance/dto/request-verification.dto.ts:34` |
| `livenessCenterFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/identity_assurance/dto/request-verification.dto.ts:39` |
| `livenessTurnLeftFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/identity_assurance/dto/request-verification.dto.ts:44` |
| `livenessTurnRightFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/identity_assurance/dto/request-verification.dto.ts:49` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "evidenceFileId": "00000000-0000-4000-8000-000000000001",
  "documentFrontFileId": "00000000-0000-4000-8000-000000000001",
  "documentBackFileId": "00000000-0000-4000-8000-000000000001",
  "livenessCenterFileId": "00000000-0000-4000-8000-000000000001",
  "livenessTurnLeftFileId": "00000000-0000-4000-8000-000000000001",
  "livenessTurnRightFileId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<VerificationRequestResponseDto>` · DTO `VerificationRequestResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `caseId` | `string` | Sí | formato uuid | — | Identificador asociado a case. | `src/modules/identity_assurance/dto/request-verification.dto.ts:74` |
| `checkId` | `string` | Sí | formato uuid | — | Identificador asociado a check. | `src/modules/identity_assurance/dto/request-verification.dto.ts:80` |
| `status` | `string` | Sí | formato uuid | — | Estado del caso recién abierto | `src/modules/identity_assurance/dto/request-verification.dto.ts:89` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Canal no encontrado; ResourceNotFoundException: Plantilla no encontrada |
| 409 | `CONFLICT` | ConflictException: Ya hay una verificación en curso para este sujeto |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta no tiene una persona vinculada; PreconditionFailedException: Envía el archivo histórico o las cinco evidencias nuevas, no ambos; PreconditionFailedException: La verificación requiere las cinco evidencias en el orden solicitado; PreconditionFailedException: Adjunta el frente, el reverso y las tres capturas de prueba de vida; PreconditionFailedException: Una evidencia no existe, no pertenece a esta cuenta o no está protegida; PreconditionFailedException: La notificación a una dirección externa también necesita el usuario destinatario / La notificación necesita el usuario destinatario; PreconditionFailedException: El canal no está activo; PreconditionFailedException: La plantilla no está publicada; PreconditionFailedException: La plantilla es de otro canal |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | StorageLifecycleDenied: FILE_NOT_LIVE; StorageLifecycleDenied: VERSION_UNKNOWN; StorageLifecycleDenied: PHYSICAL_IDENTITY_UNKNOWN |

El árbol de decisión completo está en [flujos](../flujos/identity_assurance.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/identity-verification-self-service.int-spec.ts:115` |

### Flujos

- src / modules / identity assurance — etapa `ctrl:IdentitySelfServiceController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 8. POST /identity/me/practitioner/identity-verification

- **Origen:** CONTRATO
- **Nombre:** Solicitar la verificación de la propia identidad (profesional)
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IdentitySelfServiceController.requestPractitionerIdentity` — `src/modules/identity_assurance/controllers/identity-self-service.controller.ts:60`

### Qué es y para qué sirve (negocio)

Solicitar la verificación de la propia identidad (profesional). Dentro del módulo (descripción del modelo, en inglés): «Verifies patients, practitioners, representatives and organization operators against authoritative ministries, civil registries, professional boards and government data platforms.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_27_identity_assurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /identity/me/practitioner/identity-verification` la atiende `IdentitySelfServiceController.requestPractitionerIdentity` (src/modules/identity_assurance/controllers/identity-self-service.controller.ts:60). Exige sesión; el controlador no declara roles. Valida el cuerpo como `IdentityAssuranceRequestVerificationDto` (6 campos, 0 obligatorios). Delega en `IdentitySelfServiceService.requestPractitionerIdentity`. Crea filas en identity_assurance.identity_checks, identity_assurance.identity_evidence_records, identity_assurance.identity_verification_cases, messaging.notification_requests. Lee common.file_versions, common.files, iam.authentication_credentials, iam.email_verifications, identity_assurance.identity_verification_cases, messaging.message_channels, messaging.message_templates, messaging.notification_requests y 4 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/identity_assurance/controllers/identity-self-service.controller.ts:60` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.file_versions` | LEE | LEE | DIRECTA | IdentitySelfServiceController.requestPractitionerIdentity → IdentitySelfServiceService.requestPractitionerIdentity → IdentitySelfServiceService.openVerification → IdentityEvidenceRecordsRepository.create → StoragePublicationService.guardFile | `src/common/storage/storage-publication.service.ts:190` |
| `common.files` | LEE | LEE | DIRECTA | IdentitySelfServiceController.requestPractitionerIdentity → IdentitySelfServiceService.requestPractitionerIdentity → IdentitySelfServiceService.openVerification → FilesRepository.findById | `src/modules/common/repositories/files.repository.ts:47` |
| `iam.authentication_credentials` | LEE | LEE | DIRECTA | IdentitySelfServiceController.requestPractitionerIdentity → IdentitySelfServiceService.requestPractitionerIdentity → IdentitySelfServiceService.openVerification → IdentitySelfServiceService.sendConfirmationEmail → IdentitySelfServiceService.findEmailForUser | `src/modules/identity_assurance/services/identity-self-service.service.ts:761` |
| `iam.email_verifications` | LEE | LEE | DIRECTA | IdentitySelfServiceController.requestPractitionerIdentity → IdentitySelfServiceService.requestPractitionerIdentity → IdentitySelfServiceService.openVerification → IdentitySelfServiceService.sendConfirmationEmail → IdentitySelfServiceService.findEmailForUser | `src/modules/identity_assurance/services/identity-self-service.service.ts:770` |
| `identity_assurance.identity_checks` | ESCRIBE | CREA | DIRECTA | IdentitySelfServiceController.requestPractitionerIdentity → IdentitySelfServiceService.requestPractitionerIdentity → IdentitySelfServiceService.openVerification → IdentityChecksRepository.create | `src/modules/identity_assurance/repositories/identity-checks.repository.ts:152` |
| `identity_assurance.identity_evidence_records` | ESCRIBE | CREA | DIRECTA | IdentitySelfServiceController.requestPractitionerIdentity → IdentitySelfServiceService.requestPractitionerIdentity → IdentitySelfServiceService.openVerification → IdentityEvidenceRecordsRepository.create | `src/modules/identity_assurance/repositories/identity-evidence.repository.ts:81` |
| `identity_assurance.identity_verification_cases` | ESCRIBE | CREA | DIRECTA | IdentitySelfServiceController.requestPractitionerIdentity → IdentitySelfServiceService.requestPractitionerIdentity → IdentitySelfServiceService.openVerification → IdentityVerificationCasesRepository.create | `src/modules/identity_assurance/repositories/identity-cases.repository.ts:75` |
| `identity_assurance.identity_verification_cases` | LEE | LEE | DIRECTA | IdentitySelfServiceController.requestPractitionerIdentity → IdentitySelfServiceService.requestPractitionerIdentity → IdentitySelfServiceService.openVerification → IdentityVerificationCasesRepository.countLiveForSubject | `src/modules/identity_assurance/repositories/identity-cases.repository.ts:111` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | IdentitySelfServiceController.requestPractitionerIdentity → IdentitySelfServiceService.requestPractitionerIdentity → IdentitySelfServiceService.openVerification → IdentitySelfServiceService.sendConfirmationEmail → NotificationsService.createRequest → NotificationsRepository.findChannelById | `src/modules/messaging/repositories/notifications.repository.ts:139` |
| `messaging.message_templates` | LEE | LEE | DIRECTA | IdentitySelfServiceController.requestPractitionerIdentity → IdentitySelfServiceService.requestPractitionerIdentity → IdentitySelfServiceService.openVerification → IdentitySelfServiceService.sendConfirmationEmail → NotificationsService.createRequest → NotificationsRepository.findTemplateById | `src/modules/messaging/repositories/notifications.repository.ts:153` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | IdentitySelfServiceController.requestPractitionerIdentity → IdentitySelfServiceService.requestPractitionerIdentity → IdentitySelfServiceService.openVerification → IdentitySelfServiceService.sendConfirmationEmail → NotificationsService.createRequest → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.notification_requests` | LEE | LEE | DIRECTA | IdentitySelfServiceController.requestPractitionerIdentity → IdentitySelfServiceService.requestPractitionerIdentity → IdentitySelfServiceService.openVerification → IdentitySelfServiceService.sendConfirmationEmail → NotificationsService.createRequest → NotificationsRepository.findLiveRequestByDebounceKey | `src/modules/messaging/repositories/notifications.repository.ts:388` |
| `messaging.queued_jobs` | LEE | LEE | DIRECTA | IdentitySelfServiceController.requestPractitionerIdentity → IdentitySelfServiceService.requestPractitionerIdentity → IdentitySelfServiceService.openVerification → IdentityEvidenceRecordsRepository.create → StoragePublicationService.guardFile → StorageLifecycleCoordinator.assertNoContender → QueuesRepository.findStorageIntents | `src/modules/messaging/repositories/queues.repository.ts:62` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | IdentitySelfServiceController.requestPractitionerIdentity → IdentitySelfServiceService.requestPractitionerIdentity → IdentitySelfServiceService.openVerification → IdentitySelfServiceService.sendConfirmationEmail → NotificationsService.createRequest → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | IdentitySelfServiceController.requestPractitionerIdentity → IdentitySelfServiceService.requestPractitionerIdentity → IdentitySelfServiceService.assertIsPractitioner → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | IdentitySelfServiceController.requestPractitionerIdentity → IdentitySelfServiceService.requestPractitionerIdentity → IdentitySelfServiceService.resolvePersonId → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |

### Cuerpo — DTO `IdentityAssuranceRequestVerificationDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `evidenceFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Archivo único para clientes anteriores. Los clientes nuevos envían frente, reverso y tres capturas del reto de vida. | `src/modules/identity_assurance/dto/request-verification.dto.ts:24` |
| `documentFrontFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/identity_assurance/dto/request-verification.dto.ts:29` |
| `documentBackFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/identity_assurance/dto/request-verification.dto.ts:34` |
| `livenessCenterFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/identity_assurance/dto/request-verification.dto.ts:39` |
| `livenessTurnLeftFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/identity_assurance/dto/request-verification.dto.ts:44` |
| `livenessTurnRightFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/identity_assurance/dto/request-verification.dto.ts:49` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "evidenceFileId": "00000000-0000-4000-8000-000000000001",
  "documentFrontFileId": "00000000-0000-4000-8000-000000000001",
  "documentBackFileId": "00000000-0000-4000-8000-000000000001",
  "livenessCenterFileId": "00000000-0000-4000-8000-000000000001",
  "livenessTurnLeftFileId": "00000000-0000-4000-8000-000000000001",
  "livenessTurnRightFileId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<VerificationRequestResponseDto>` · DTO `VerificationRequestResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `caseId` | `string` | Sí | formato uuid | — | Identificador asociado a case. | `src/modules/identity_assurance/dto/request-verification.dto.ts:74` |
| `checkId` | `string` | Sí | formato uuid | — | Identificador asociado a check. | `src/modules/identity_assurance/dto/request-verification.dto.ts:80` |
| `status` | `string` | Sí | formato uuid | — | Estado del caso recién abierto | `src/modules/identity_assurance/dto/request-verification.dto.ts:89` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Canal no encontrado; ResourceNotFoundException: Plantilla no encontrada |
| 409 | `CONFLICT` | ConflictException: Ya hay una verificación en curso para este sujeto |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta no tiene una persona vinculada; PreconditionFailedException: La cuenta no tiene un perfil profesional; PreconditionFailedException: Envía el archivo histórico o las cinco evidencias nuevas, no ambos; PreconditionFailedException: La verificación requiere las cinco evidencias en el orden solicitado; PreconditionFailedException: Adjunta el frente, el reverso y las tres capturas de prueba de vida; PreconditionFailedException: Una evidencia no existe, no pertenece a esta cuenta o no está protegida; PreconditionFailedException: La notificación a una dirección externa también necesita el usuario destinatario / La notificación necesita el usuario destinatario; PreconditionFailedException: El canal no está activo; PreconditionFailedException: La plantilla no está publicada; PreconditionFailedException: La plantilla es de otro canal |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | StorageLifecycleDenied: FILE_NOT_LIVE; StorageLifecycleDenied: VERSION_UNKNOWN; StorageLifecycleDenied: PHYSICAL_IDENTITY_UNKNOWN |

El árbol de decisión completo está en [flujos](../flujos/identity_assurance.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/practitioner-profile-identity-fields.int-spec.ts:223` |

### Flujos

- src / modules / identity assurance — etapa `ctrl:IdentitySelfServiceController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 9. POST /identity/me/practitioner/license-verification

- **Origen:** CONTRATO
- **Nombre:** Solicitar la verificación de la propia matrícula
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IdentitySelfServiceController.requestPractitionerLicense` — `src/modules/identity_assurance/controllers/identity-self-service.controller.ts:78`

### Qué es y para qué sirve (negocio)

Solicitar la verificación de la propia matrícula. Dentro del módulo (descripción del modelo, en inglés): «Verifies patients, practitioners, representatives and organization operators against authoritative ministries, civil registries, professional boards and government data platforms.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_27_identity_assurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /identity/me/practitioner/license-verification` la atiende `IdentitySelfServiceController.requestPractitionerLicense` (src/modules/identity_assurance/controllers/identity-self-service.controller.ts:78). Exige sesión; el controlador no declara roles. Valida el cuerpo como `IdentityAssuranceRequestLicenseVerificationDto` (7 campos, 0 obligatorios). Delega en `IdentitySelfServiceService.requestPractitionerLicense`. Crea filas en identity_assurance.identity_checks, identity_assurance.identity_evidence_records, identity_assurance.identity_verification_cases, messaging.notification_requests. Lee common.file_versions, common.files, iam.authentication_credentials, iam.email_verifications, identity_assurance.identity_verification_cases, messaging.message_channels, messaging.message_templates, messaging.notification_requests y 5 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/identity_assurance/controllers/identity-self-service.controller.ts:78` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.file_versions` | LEE | LEE | DIRECTA | IdentitySelfServiceController.requestPractitionerLicense → IdentitySelfServiceService.requestPractitionerLicense → IdentitySelfServiceService.openVerification → IdentityEvidenceRecordsRepository.create → StoragePublicationService.guardFile | `src/common/storage/storage-publication.service.ts:190` |
| `common.files` | LEE | LEE | DIRECTA | IdentitySelfServiceController.requestPractitionerLicense → IdentitySelfServiceService.requestPractitionerLicense → IdentitySelfServiceService.openVerification → FilesRepository.findById | `src/modules/common/repositories/files.repository.ts:47` |
| `iam.authentication_credentials` | LEE | LEE | DIRECTA | IdentitySelfServiceController.requestPractitionerLicense → IdentitySelfServiceService.requestPractitionerLicense → IdentitySelfServiceService.openVerification → IdentitySelfServiceService.sendConfirmationEmail → IdentitySelfServiceService.findEmailForUser | `src/modules/identity_assurance/services/identity-self-service.service.ts:761` |
| `iam.email_verifications` | LEE | LEE | DIRECTA | IdentitySelfServiceController.requestPractitionerLicense → IdentitySelfServiceService.requestPractitionerLicense → IdentitySelfServiceService.openVerification → IdentitySelfServiceService.sendConfirmationEmail → IdentitySelfServiceService.findEmailForUser | `src/modules/identity_assurance/services/identity-self-service.service.ts:770` |
| `identity_assurance.identity_checks` | ESCRIBE | CREA | DIRECTA | IdentitySelfServiceController.requestPractitionerLicense → IdentitySelfServiceService.requestPractitionerLicense → IdentitySelfServiceService.openVerification → IdentityChecksRepository.create | `src/modules/identity_assurance/repositories/identity-checks.repository.ts:152` |
| `identity_assurance.identity_evidence_records` | ESCRIBE | CREA | DIRECTA | IdentitySelfServiceController.requestPractitionerLicense → IdentitySelfServiceService.requestPractitionerLicense → IdentitySelfServiceService.openVerification → IdentityEvidenceRecordsRepository.create | `src/modules/identity_assurance/repositories/identity-evidence.repository.ts:81` |
| `identity_assurance.identity_verification_cases` | ESCRIBE | CREA | DIRECTA | IdentitySelfServiceController.requestPractitionerLicense → IdentitySelfServiceService.requestPractitionerLicense → IdentitySelfServiceService.openVerification → IdentityVerificationCasesRepository.create | `src/modules/identity_assurance/repositories/identity-cases.repository.ts:75` |
| `identity_assurance.identity_verification_cases` | LEE | LEE | DIRECTA | IdentitySelfServiceController.requestPractitionerLicense → IdentitySelfServiceService.requestPractitionerLicense → IdentitySelfServiceService.openVerification → IdentityVerificationCasesRepository.countLiveForSubject | `src/modules/identity_assurance/repositories/identity-cases.repository.ts:111` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | IdentitySelfServiceController.requestPractitionerLicense → IdentitySelfServiceService.requestPractitionerLicense → IdentitySelfServiceService.openVerification → IdentitySelfServiceService.sendConfirmationEmail → NotificationsService.createRequest → NotificationsRepository.findChannelById | `src/modules/messaging/repositories/notifications.repository.ts:139` |
| `messaging.message_templates` | LEE | LEE | DIRECTA | IdentitySelfServiceController.requestPractitionerLicense → IdentitySelfServiceService.requestPractitionerLicense → IdentitySelfServiceService.openVerification → IdentitySelfServiceService.sendConfirmationEmail → NotificationsService.createRequest → NotificationsRepository.findTemplateById | `src/modules/messaging/repositories/notifications.repository.ts:153` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | IdentitySelfServiceController.requestPractitionerLicense → IdentitySelfServiceService.requestPractitionerLicense → IdentitySelfServiceService.openVerification → IdentitySelfServiceService.sendConfirmationEmail → NotificationsService.createRequest → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.notification_requests` | LEE | LEE | DIRECTA | IdentitySelfServiceController.requestPractitionerLicense → IdentitySelfServiceService.requestPractitionerLicense → IdentitySelfServiceService.openVerification → IdentitySelfServiceService.sendConfirmationEmail → NotificationsService.createRequest → NotificationsRepository.findLiveRequestByDebounceKey | `src/modules/messaging/repositories/notifications.repository.ts:388` |
| `messaging.queued_jobs` | LEE | LEE | DIRECTA | IdentitySelfServiceController.requestPractitionerLicense → IdentitySelfServiceService.requestPractitionerLicense → IdentitySelfServiceService.openVerification → IdentityEvidenceRecordsRepository.create → StoragePublicationService.guardFile → StorageLifecycleCoordinator.assertNoContender → QueuesRepository.findStorageIntents | `src/modules/messaging/repositories/queues.repository.ts:62` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | IdentitySelfServiceController.requestPractitionerLicense → IdentitySelfServiceService.requestPractitionerLicense → IdentitySelfServiceService.openVerification → IdentitySelfServiceService.sendConfirmationEmail → NotificationsService.createRequest → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | IdentitySelfServiceController.requestPractitionerLicense → IdentitySelfServiceService.requestPractitionerLicense → IdentitySelfServiceService.assertIsPractitioner → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.jurisdiction_authorizations` | LEE | LEE | DIRECTA | IdentitySelfServiceController.requestPractitionerLicense → IdentitySelfServiceService.requestPractitionerLicense → JurisdictionAuthorizationsRepository.findById | `src/modules/profiles/infrastructure/repositories/jurisdiction-authorizations.repository.ts:65` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | IdentitySelfServiceController.requestPractitionerLicense → IdentitySelfServiceService.requestPractitionerLicense → IdentitySelfServiceService.resolvePersonId → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |

### Cuerpo — DTO `IdentityAssuranceRequestLicenseVerificationDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `evidenceFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Archivo único para clientes anteriores. Los clientes nuevos envían frente, reverso y tres capturas del reto de vida. | `src/modules/identity_assurance/dto/request-verification.dto.ts:24` |
| `documentFrontFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/identity_assurance/dto/request-verification.dto.ts:29` |
| `documentBackFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/identity_assurance/dto/request-verification.dto.ts:34` |
| `livenessCenterFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/identity_assurance/dto/request-verification.dto.ts:39` |
| `livenessTurnLeftFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/identity_assurance/dto/request-verification.dto.ts:44` |
| `livenessTurnRightFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/identity_assurance/dto/request-verification.dto.ts:49` |
| `jurisdictionAuthorizationId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Matrícula a verificar. Si se omite se usa la única del profesional. | `src/modules/identity_assurance/dto/request-verification.dto.ts:65` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "evidenceFileId": "00000000-0000-4000-8000-000000000001",
  "documentFrontFileId": "00000000-0000-4000-8000-000000000001",
  "documentBackFileId": "00000000-0000-4000-8000-000000000001",
  "livenessCenterFileId": "00000000-0000-4000-8000-000000000001",
  "livenessTurnLeftFileId": "00000000-0000-4000-8000-000000000001",
  "livenessTurnRightFileId": "00000000-0000-4000-8000-000000000001",
  "jurisdictionAuthorizationId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<VerificationRequestResponseDto>` · DTO `VerificationRequestResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `caseId` | `string` | Sí | formato uuid | — | Identificador asociado a case. | `src/modules/identity_assurance/dto/request-verification.dto.ts:74` |
| `checkId` | `string` | Sí | formato uuid | — | Identificador asociado a check. | `src/modules/identity_assurance/dto/request-verification.dto.ts:80` |
| `status` | `string` | Sí | formato uuid | — | Estado del caso recién abierto | `src/modules/identity_assurance/dto/request-verification.dto.ts:89` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Matrícula no encontrada; ResourceNotFoundException: Canal no encontrado; ResourceNotFoundException: Plantilla no encontrada |
| 409 | `CONFLICT` | ConflictException: Ya hay una verificación en curso para este sujeto |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta no tiene una persona vinculada; PreconditionFailedException: La cuenta no tiene un perfil profesional; PreconditionFailedException: Indique qué matrícula quiere verificar; PreconditionFailedException: La matrícula pertenece a otro profesional; PreconditionFailedException: Envía el archivo histórico o las cinco evidencias nuevas, no ambos; PreconditionFailedException: La verificación requiere las cinco evidencias en el orden solicitado; PreconditionFailedException: Adjunta el frente, el reverso y las tres capturas de prueba de vida; PreconditionFailedException: Una evidencia no existe, no pertenece a esta cuenta o no está protegida; PreconditionFailedException: La notificación a una dirección externa también necesita el usuario destinatario / La notificación necesita el usuario destinatario; PreconditionFailedException: El canal no está activo; PreconditionFailedException: La plantilla no está publicada; PreconditionFailedException: La plantilla es de otro canal |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | StorageLifecycleDenied: FILE_NOT_LIVE; StorageLifecycleDenied: VERSION_UNKNOWN; StorageLifecycleDenied: PHYSICAL_IDENTITY_UNKNOWN |

El árbol de decisión completo está en [flujos](../flujos/identity_assurance.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / identity assurance — etapa `ctrl:IdentitySelfServiceController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 10. POST /identity/me/tenants/{tenantId}/verification

- **Origen:** CONTRATO
- **Nombre:** Solicitar la verificación de una institución propia
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IdentitySelfServiceController.requestTenantVerification` — `src/modules/identity_assurance/controllers/identity-self-service.controller.ts:94`

### Qué es y para qué sirve (negocio)

Solicitar la verificación de una institución propia. Dentro del módulo (descripción del modelo, en inglés): «Verifies patients, practitioners, representatives and organization operators against authoritative ministries, civil registries, professional boards and government data platforms.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_27_identity_assurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /identity/me/tenants/{tenantId}/verification` la atiende `IdentitySelfServiceController.requestTenantVerification` (src/modules/identity_assurance/controllers/identity-self-service.controller.ts:94). Exige sesión; el controlador no declara roles. Valida el cuerpo como `IdentityAssuranceRequestVerificationDto` (6 campos, 0 obligatorios). Delega en `IdentitySelfServiceService.requestTenantVerification`. Crea filas en identity_assurance.identity_checks, identity_assurance.identity_evidence_records, identity_assurance.identity_verification_cases, messaging.notification_requests. Lee common.file_versions, common.files, directory.tenant_memberships, iam.authentication_credentials, iam.email_verifications, identity_assurance.identity_verification_cases, messaging.message_channels, messaging.message_templates y 3 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/identity_assurance/controllers/identity-self-service.controller.ts:94` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: tenantId | `src/modules/identity_assurance/controllers/identity-self-service.controller.ts:94` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.file_versions` | LEE | LEE | DIRECTA | IdentitySelfServiceController.requestTenantVerification → IdentitySelfServiceService.requestTenantVerification → IdentitySelfServiceService.openVerification → IdentityEvidenceRecordsRepository.create → StoragePublicationService.guardFile | `src/common/storage/storage-publication.service.ts:190` |
| `common.files` | LEE | LEE | DIRECTA | IdentitySelfServiceController.requestTenantVerification → IdentitySelfServiceService.requestTenantVerification → IdentitySelfServiceService.openVerification → FilesRepository.findById | `src/modules/common/repositories/files.repository.ts:47` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | IdentitySelfServiceController.requestTenantVerification → IdentitySelfServiceService.requestTenantVerification → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:70` |
| `iam.authentication_credentials` | LEE | LEE | DIRECTA | IdentitySelfServiceController.requestTenantVerification → IdentitySelfServiceService.requestTenantVerification → IdentitySelfServiceService.openVerification → IdentitySelfServiceService.sendConfirmationEmail → IdentitySelfServiceService.findEmailForUser | `src/modules/identity_assurance/services/identity-self-service.service.ts:761` |
| `iam.email_verifications` | LEE | LEE | DIRECTA | IdentitySelfServiceController.requestTenantVerification → IdentitySelfServiceService.requestTenantVerification → IdentitySelfServiceService.openVerification → IdentitySelfServiceService.sendConfirmationEmail → IdentitySelfServiceService.findEmailForUser | `src/modules/identity_assurance/services/identity-self-service.service.ts:770` |
| `identity_assurance.identity_checks` | ESCRIBE | CREA | DIRECTA | IdentitySelfServiceController.requestTenantVerification → IdentitySelfServiceService.requestTenantVerification → IdentitySelfServiceService.openVerification → IdentityChecksRepository.create | `src/modules/identity_assurance/repositories/identity-checks.repository.ts:152` |
| `identity_assurance.identity_evidence_records` | ESCRIBE | CREA | DIRECTA | IdentitySelfServiceController.requestTenantVerification → IdentitySelfServiceService.requestTenantVerification → IdentitySelfServiceService.openVerification → IdentityEvidenceRecordsRepository.create | `src/modules/identity_assurance/repositories/identity-evidence.repository.ts:81` |
| `identity_assurance.identity_verification_cases` | ESCRIBE | CREA | DIRECTA | IdentitySelfServiceController.requestTenantVerification → IdentitySelfServiceService.requestTenantVerification → IdentitySelfServiceService.openVerification → IdentityVerificationCasesRepository.create | `src/modules/identity_assurance/repositories/identity-cases.repository.ts:75` |
| `identity_assurance.identity_verification_cases` | LEE | LEE | DIRECTA | IdentitySelfServiceController.requestTenantVerification → IdentitySelfServiceService.requestTenantVerification → IdentitySelfServiceService.openVerification → IdentityVerificationCasesRepository.countLiveForSubject | `src/modules/identity_assurance/repositories/identity-cases.repository.ts:111` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | IdentitySelfServiceController.requestTenantVerification → IdentitySelfServiceService.requestTenantVerification → IdentitySelfServiceService.openVerification → IdentitySelfServiceService.sendConfirmationEmail → NotificationsService.createRequest → NotificationsRepository.findChannelById | `src/modules/messaging/repositories/notifications.repository.ts:139` |
| `messaging.message_templates` | LEE | LEE | DIRECTA | IdentitySelfServiceController.requestTenantVerification → IdentitySelfServiceService.requestTenantVerification → IdentitySelfServiceService.openVerification → IdentitySelfServiceService.sendConfirmationEmail → NotificationsService.createRequest → NotificationsRepository.findTemplateById | `src/modules/messaging/repositories/notifications.repository.ts:153` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | IdentitySelfServiceController.requestTenantVerification → IdentitySelfServiceService.requestTenantVerification → IdentitySelfServiceService.openVerification → IdentitySelfServiceService.sendConfirmationEmail → NotificationsService.createRequest → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.notification_requests` | LEE | LEE | DIRECTA | IdentitySelfServiceController.requestTenantVerification → IdentitySelfServiceService.requestTenantVerification → IdentitySelfServiceService.openVerification → IdentitySelfServiceService.sendConfirmationEmail → NotificationsService.createRequest → NotificationsRepository.findLiveRequestByDebounceKey | `src/modules/messaging/repositories/notifications.repository.ts:388` |
| `messaging.queued_jobs` | LEE | LEE | DIRECTA | IdentitySelfServiceController.requestTenantVerification → IdentitySelfServiceService.requestTenantVerification → IdentitySelfServiceService.openVerification → IdentityEvidenceRecordsRepository.create → StoragePublicationService.guardFile → StorageLifecycleCoordinator.assertNoContender → QueuesRepository.findStorageIntents | `src/modules/messaging/repositories/queues.repository.ts:62` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | IdentitySelfServiceController.requestTenantVerification → IdentitySelfServiceService.requestTenantVerification → IdentitySelfServiceService.openVerification → IdentitySelfServiceService.sendConfirmationEmail → NotificationsService.createRequest → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `tenantId` | path | Sí | `string` | — |

### Cuerpo — DTO `IdentityAssuranceRequestVerificationDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `evidenceFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Archivo único para clientes anteriores. Los clientes nuevos envían frente, reverso y tres capturas del reto de vida. | `src/modules/identity_assurance/dto/request-verification.dto.ts:24` |
| `documentFrontFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/identity_assurance/dto/request-verification.dto.ts:29` |
| `documentBackFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/identity_assurance/dto/request-verification.dto.ts:34` |
| `livenessCenterFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/identity_assurance/dto/request-verification.dto.ts:39` |
| `livenessTurnLeftFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/identity_assurance/dto/request-verification.dto.ts:44` |
| `livenessTurnRightFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/identity_assurance/dto/request-verification.dto.ts:49` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "evidenceFileId": "00000000-0000-4000-8000-000000000001",
  "documentFrontFileId": "00000000-0000-4000-8000-000000000001",
  "documentBackFileId": "00000000-0000-4000-8000-000000000001",
  "livenessCenterFileId": "00000000-0000-4000-8000-000000000001",
  "livenessTurnLeftFileId": "00000000-0000-4000-8000-000000000001",
  "livenessTurnRightFileId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<VerificationRequestResponseDto>` · DTO `VerificationRequestResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `caseId` | `string` | Sí | formato uuid | — | Identificador asociado a case. | `src/modules/identity_assurance/dto/request-verification.dto.ts:74` |
| `checkId` | `string` | Sí | formato uuid | — | Identificador asociado a check. | `src/modules/identity_assurance/dto/request-verification.dto.ts:80` |
| `status` | `string` | Sí | formato uuid | — | Estado del caso recién abierto | `src/modules/identity_assurance/dto/request-verification.dto.ts:89` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Canal no encontrado; ResourceNotFoundException: Plantilla no encontrada |
| 409 | `CONFLICT` | ConflictException: Ya hay una verificación en curso para este sujeto |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: No pertenece a esa institución; PreconditionFailedException: Sólo el titular o un administrador de la institución puede pedir su verificación; PreconditionFailedException: Envía el archivo histórico o las cinco evidencias nuevas, no ambos; PreconditionFailedException: La verificación requiere las cinco evidencias en el orden solicitado; PreconditionFailedException: Adjunta el frente, el reverso y las tres capturas de prueba de vida; PreconditionFailedException: Una evidencia no existe, no pertenece a esta cuenta o no está protegida; PreconditionFailedException: La notificación a una dirección externa también necesita el usuario destinatario / La notificación necesita el usuario destinatario; PreconditionFailedException: El canal no está activo; PreconditionFailedException: La plantilla no está publicada; PreconditionFailedException: La plantilla es de otro canal |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | StorageLifecycleDenied: FILE_NOT_LIVE; StorageLifecycleDenied: VERSION_UNKNOWN; StorageLifecycleDenied: PHYSICAL_IDENTITY_UNKNOWN |

El árbol de decisión completo está en [flujos](../flujos/identity_assurance.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / identity assurance — etapa `ctrl:IdentitySelfServiceController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 11. GET /identity/me/verification-cases

- **Origen:** CONTRATO
- **Nombre:** Listar los casos de verificación propios
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IdentitySelfServiceController.listOwnCases` — `src/modules/identity_assurance/controllers/identity-self-service.controller.ts:131`

### Qué es y para qué sirve (negocio)

Listar los casos de verificación propios. Dentro del módulo (descripción del modelo, en inglés): «Verifies patients, practitioners, representatives and organization operators against authoritative ministries, civil registries, professional boards and government data platforms.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_27_identity_assurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /identity/me/verification-cases` la atiende `IdentitySelfServiceController.listOwnCases` (src/modules/identity_assurance/controllers/identity-self-service.controller.ts:131). Exige sesión; el controlador no declara roles. Delega en `IdentitySelfServiceService.listOwnCases`. Lee identity_assurance.identity_check_results, identity_assurance.identity_checks, identity_assurance.identity_evidence_records, identity_assurance.identity_manual_review_cases, identity_assurance.identity_verification_cases, profiles.jurisdiction_authorizations, profiles.person_account_links.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/identity_assurance/controllers/identity-self-service.controller.ts:131` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `identity_assurance.identity_check_results` | LEE | LEE | DIRECTA | IdentitySelfServiceController.listOwnCases → IdentitySelfServiceService.listOwnCases → IdentitySelfServiceService.toStatusResponse → IdentityCheckResultsRepository.findLatestByCheck | `src/modules/identity_assurance/repositories/identity-checks.repository.ts:383` |
| `identity_assurance.identity_checks` | LEE | LEE | DIRECTA | IdentitySelfServiceController.listOwnCases → IdentitySelfServiceService.listOwnCases → IdentitySelfServiceService.toStatusResponse → IdentityChecksRepository.findRequiredByCase | `src/modules/identity_assurance/repositories/identity-checks.repository.ts:238` |
| `identity_assurance.identity_evidence_records` | LEE | LEE | DIRECTA | IdentitySelfServiceController.listOwnCases → IdentitySelfServiceService.listOwnCases → IdentitySelfServiceService.toStatusResponse → IdentityEvidenceRecordsRepository.findByCase | `src/modules/identity_assurance/repositories/identity-evidence.repository.ts:129` |
| `identity_assurance.identity_manual_review_cases` | LEE | LEE | DIRECTA | IdentitySelfServiceController.listOwnCases → IdentitySelfServiceService.listOwnCases → IdentitySelfServiceService.toStatusResponse → IdentityManualReviewCasesRepository.findLatestDecidedByCase | `src/modules/identity_assurance/repositories/identity-manual-review.repository.ts:110` |
| `identity_assurance.identity_verification_cases` | LEE | LEE | DIRECTA | IdentitySelfServiceController.listOwnCases → IdentitySelfServiceService.listOwnCases → IdentityVerificationCasesRepository.findBySubjects | `src/modules/identity_assurance/repositories/identity-cases.repository.ts:137` |
| `profiles.jurisdiction_authorizations` | LEE | LEE | DIRECTA | IdentitySelfServiceController.listOwnCases → IdentitySelfServiceService.listOwnCases → JurisdictionAuthorizationsRepository.findByPractitioner | `src/modules/profiles/infrastructure/repositories/jurisdiction-authorizations.repository.ts:107` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | IdentitySelfServiceController.listOwnCases → IdentitySelfServiceService.listOwnCases → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<VerificationStatusResponseDto[]>` · DTO `VerificationStatusResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/identity_assurance/dto/request-verification.dto.ts:147` |
| `status` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/identity_assurance/dto/request-verification.dto.ts:153` |
| `type` | `string` | Sí | — | — | Tipo de solicitud, derivado del sujeto del caso | `src/modules/identity_assurance/dto/request-verification.dto.ts:163` |
| `evidenceFileId` | `string` | No | formato uuid | — | Archivo de evidencia aportado con la solicitud (`common.files`). Se descarga con `GET /common/files/:id/content`, que ya exige ser quien lo subió o tener un rol revisor: no hace falta un endpoint de descarga propio. | `src/modules/identity_assurance/dto/request-verification.dto.ts:172` |
| `evidence` | `array<VerificationEvidenceDto>` | No | — | — | Evidencias asociadas al expediente, en el orden de captura. | `src/modules/identity_assurance/dto/request-verification.dto.ts:176` |
| `evidence[].id` | `string` | No | formato uuid | — | — | `src/modules/identity_assurance/dto/request-verification.dto.ts:95` |
| `evidence[].evidenceTypeConceptId` | `string` | No | formato uuid | — | — | `src/modules/identity_assurance/dto/request-verification.dto.ts:98` |
| `evidence[].evidenceFileId` | `string` | No | formato uuid | — | — | `src/modules/identity_assurance/dto/request-verification.dto.ts:101` |
| `evidence[].createdAt` | `string` | No | formato date-time | — | — | `src/modules/identity_assurance/dto/request-verification.dto.ts:104` |
| `evidence[].sequence` | `number` | No | — | — | — | `src/modules/identity_assurance/dto/request-verification.dto.ts:107` |
| `reasonText` | `string` | No | — | — | Motivo registrado por quien decidió el caso en revisión manual, cuando lo hubo. Un caso resuelto automáticamente (sin escalar) no tiene motivo de texto: el trace de `checks` es la explicación disponible en ese caso. | `src/modules/identity_assurance/dto/request-verification.dto.ts:184` |
| `checks` | `array<CaseCheckDto>` | No | — | — | Traza de los checks del caso, del planificado al más reciente. Sólo se completa en la consulta de detalle (`getOwnCaseStatus`); la lista no la trae para no pagar N+1 por fila que nadie mira. | `src/modules/identity_assurance/dto/request-verification.dto.ts:192` |
| `checks[].checkTypeConceptId` | `string` | No | formato uuid | — | Identificador asociado a check type concept. | `src/modules/identity_assurance/dto/request-verification.dto.ts:120` |
| `checks[].status` | `string` | No | formato uuid | — | Identificador asociado a status concept del check. | `src/modules/identity_assurance/dto/request-verification.dto.ts:126` |
| `checks[].resultConceptId` | `string` | No | formato uuid | — | Resultado del check, cuando ya corrió (`identity_check_results`). | `src/modules/identity_assurance/dto/request-verification.dto.ts:132` |
| `checks[].checkedAt` | `string` | No | formato date-time | — | Cuándo se registró ese resultado. | `src/modules/identity_assurance/dto/request-verification.dto.ts:138` |
| `openedAt` | `string` | No | formato date-time | — | Valor de opened at mantenido por la instancia. | `src/modules/identity_assurance/dto/request-verification.dto.ts:198` |
| `completedAt` | `string` | No | formato date-time | — | Valor de completed at mantenido por la instancia. | `src/modules/identity_assurance/dto/request-verification.dto.ts:204` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/identity_assurance.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/identity-verification-self-service.int-spec.ts:160` |

### Flujos

- src / modules / identity assurance — etapa `ctrl:IdentitySelfServiceController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 12. GET /identity/me/verification-cases/{caseId}

- **Origen:** CONTRATO
- **Nombre:** Consultar el estado de un caso propio
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IdentitySelfServiceController.getOwnCaseStatus` — `src/modules/identity_assurance/controllers/identity-self-service.controller.ts:139`

### Qué es y para qué sirve (negocio)

Consultar el estado de un caso propio. Dentro del módulo (descripción del modelo, en inglés): «Verifies patients, practitioners, representatives and organization operators against authoritative ministries, civil registries, professional boards and government data platforms.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_27_identity_assurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /identity/me/verification-cases/{caseId}` la atiende `IdentitySelfServiceController.getOwnCaseStatus` (src/modules/identity_assurance/controllers/identity-self-service.controller.ts:139). Exige sesión; el controlador no declara roles. Delega en `IdentitySelfServiceService.getOwnCaseStatus`. Lee directory.tenant_memberships, identity_assurance.identity_check_results, identity_assurance.identity_checks, identity_assurance.identity_evidence_records, identity_assurance.identity_manual_review_cases, identity_assurance.identity_verification_cases, profiles.jurisdiction_authorizations, profiles.person_account_links.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/identity_assurance/controllers/identity-self-service.controller.ts:139` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: caseId | `src/modules/identity_assurance/controllers/identity-self-service.controller.ts:139` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | IdentitySelfServiceController.getOwnCaseStatus → IdentitySelfServiceService.getOwnCaseStatus → IdentitySelfServiceService.isOwnSubject → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:70` |
| `identity_assurance.identity_check_results` | LEE | LEE | DIRECTA | IdentitySelfServiceController.getOwnCaseStatus → IdentitySelfServiceService.getOwnCaseStatus → IdentitySelfServiceService.toStatusResponse → IdentityCheckResultsRepository.findLatestByCheck | `src/modules/identity_assurance/repositories/identity-checks.repository.ts:383` |
| `identity_assurance.identity_checks` | LEE | LEE | DIRECTA | IdentitySelfServiceController.getOwnCaseStatus → IdentitySelfServiceService.getOwnCaseStatus → IdentitySelfServiceService.toStatusResponse → IdentityChecksRepository.findRequiredByCase | `src/modules/identity_assurance/repositories/identity-checks.repository.ts:238` |
| `identity_assurance.identity_evidence_records` | LEE | LEE | DIRECTA | IdentitySelfServiceController.getOwnCaseStatus → IdentitySelfServiceService.getOwnCaseStatus → IdentitySelfServiceService.toStatusResponse → IdentityEvidenceRecordsRepository.findByCase | `src/modules/identity_assurance/repositories/identity-evidence.repository.ts:129` |
| `identity_assurance.identity_manual_review_cases` | LEE | LEE | DIRECTA | IdentitySelfServiceController.getOwnCaseStatus → IdentitySelfServiceService.getOwnCaseStatus → IdentitySelfServiceService.toStatusResponse → IdentityManualReviewCasesRepository.findLatestDecidedByCase | `src/modules/identity_assurance/repositories/identity-manual-review.repository.ts:110` |
| `identity_assurance.identity_verification_cases` | LEE | LEE | DIRECTA | IdentitySelfServiceController.getOwnCaseStatus → IdentitySelfServiceService.getOwnCaseStatus → IdentityVerificationCasesRepository.findById | `src/modules/identity_assurance/repositories/identity-cases.repository.ts:64` |
| `profiles.jurisdiction_authorizations` | LEE | LEE | DIRECTA | IdentitySelfServiceController.getOwnCaseStatus → IdentitySelfServiceService.getOwnCaseStatus → IdentitySelfServiceService.isOwnSubject → JurisdictionAuthorizationsRepository.findById | `src/modules/profiles/infrastructure/repositories/jurisdiction-authorizations.repository.ts:65` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | IdentitySelfServiceController.getOwnCaseStatus → IdentitySelfServiceService.getOwnCaseStatus → IdentitySelfServiceService.isOwnSubject → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `caseId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<VerificationStatusResponseDto>` · DTO `VerificationStatusResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/identity_assurance/dto/request-verification.dto.ts:147` |
| `status` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/identity_assurance/dto/request-verification.dto.ts:153` |
| `type` | `string` | Sí | — | — | Tipo de solicitud, derivado del sujeto del caso | `src/modules/identity_assurance/dto/request-verification.dto.ts:163` |
| `evidenceFileId` | `string` | No | formato uuid | — | Archivo de evidencia aportado con la solicitud (`common.files`). Se descarga con `GET /common/files/:id/content`, que ya exige ser quien lo subió o tener un rol revisor: no hace falta un endpoint de descarga propio. | `src/modules/identity_assurance/dto/request-verification.dto.ts:172` |
| `evidence` | `array<VerificationEvidenceDto>` | No | — | — | Evidencias asociadas al expediente, en el orden de captura. | `src/modules/identity_assurance/dto/request-verification.dto.ts:176` |
| `evidence[].id` | `string` | No | formato uuid | — | — | `src/modules/identity_assurance/dto/request-verification.dto.ts:95` |
| `evidence[].evidenceTypeConceptId` | `string` | No | formato uuid | — | — | `src/modules/identity_assurance/dto/request-verification.dto.ts:98` |
| `evidence[].evidenceFileId` | `string` | No | formato uuid | — | — | `src/modules/identity_assurance/dto/request-verification.dto.ts:101` |
| `evidence[].createdAt` | `string` | No | formato date-time | — | — | `src/modules/identity_assurance/dto/request-verification.dto.ts:104` |
| `evidence[].sequence` | `number` | No | — | — | — | `src/modules/identity_assurance/dto/request-verification.dto.ts:107` |
| `reasonText` | `string` | No | — | — | Motivo registrado por quien decidió el caso en revisión manual, cuando lo hubo. Un caso resuelto automáticamente (sin escalar) no tiene motivo de texto: el trace de `checks` es la explicación disponible en ese caso. | `src/modules/identity_assurance/dto/request-verification.dto.ts:184` |
| `checks` | `array<CaseCheckDto>` | No | — | — | Traza de los checks del caso, del planificado al más reciente. Sólo se completa en la consulta de detalle (`getOwnCaseStatus`); la lista no la trae para no pagar N+1 por fila que nadie mira. | `src/modules/identity_assurance/dto/request-verification.dto.ts:192` |
| `checks[].checkTypeConceptId` | `string` | No | formato uuid | — | Identificador asociado a check type concept. | `src/modules/identity_assurance/dto/request-verification.dto.ts:120` |
| `checks[].status` | `string` | No | formato uuid | — | Identificador asociado a status concept del check. | `src/modules/identity_assurance/dto/request-verification.dto.ts:126` |
| `checks[].resultConceptId` | `string` | No | formato uuid | — | Resultado del check, cuando ya corrió (`identity_check_results`). | `src/modules/identity_assurance/dto/request-verification.dto.ts:132` |
| `checks[].checkedAt` | `string` | No | formato date-time | — | Cuándo se registró ese resultado. | `src/modules/identity_assurance/dto/request-verification.dto.ts:138` |
| `openedAt` | `string` | No | formato date-time | — | Valor de opened at mantenido por la instancia. | `src/modules/identity_assurance/dto/request-verification.dto.ts:198` |
| `completedAt` | `string` | No | formato date-time | — | Valor de completed at mantenido por la instancia. | `src/modules/identity_assurance/dto/request-verification.dto.ts:204` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Caso no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/identity_assurance.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / identity assurance — etapa `ctrl:IdentitySelfServiceController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 13. GET /identity/me/verification-types

- **Origen:** CONTRATO
- **Nombre:** Listar los tipos de solicitud de verificación disponibles
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IdentitySelfServiceController.listAvailableTypes` — `src/modules/identity_assurance/controllers/identity-self-service.controller.ts:116`

### Qué es y para qué sirve (negocio)

Listar los tipos de solicitud de verificación disponibles. Dentro del módulo (descripción del modelo, en inglés): «Verifies patients, practitioners, representatives and organization operators against authoritative ministries, civil registries, professional boards and government data platforms.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_27_identity_assurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /identity/me/verification-types` la atiende `IdentitySelfServiceController.listAvailableTypes` (src/modules/identity_assurance/controllers/identity-self-service.controller.ts:116). Exige sesión; el controlador no declara roles. Delega en `IdentitySelfServiceService.listAvailableTypes`. Lee identity_assurance.identity_verification_cases, profiles.health_practitioner_profiles, profiles.jurisdiction_authorizations, profiles.person_account_links.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/identity_assurance/controllers/identity-self-service.controller.ts:116` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `identity_assurance.identity_verification_cases` | LEE | LEE | DIRECTA | IdentitySelfServiceController.listAvailableTypes → IdentitySelfServiceService.listAvailableTypes → IdentityVerificationCasesRepository.countLiveForSubject | `src/modules/identity_assurance/repositories/identity-cases.repository.ts:111` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | IdentitySelfServiceController.listAvailableTypes → IdentitySelfServiceService.listAvailableTypes → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.jurisdiction_authorizations` | LEE | LEE | DIRECTA | IdentitySelfServiceController.listAvailableTypes → IdentitySelfServiceService.listAvailableTypes → JurisdictionAuthorizationsRepository.findByPractitioner | `src/modules/profiles/infrastructure/repositories/jurisdiction-authorizations.repository.ts:107` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | IdentitySelfServiceController.listAvailableTypes → IdentitySelfServiceService.listAvailableTypes → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<VerificationTypesResponseDto>` · DTO `VerificationTypesResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `types` | `array<VerificationTypeDto>` | Sí | — | — | — | `src/modules/identity_assurance/dto/request-verification.dto.ts:236` |
| `types[].code` | `string` | Sí | — | — | Código estable del tipo, el mismo que `VerificationStatusResponseDto.type`. | `src/modules/identity_assurance/dto/request-verification.dto.ts:211` |
| `types[].label` | `string` | Sí | — | — | Etiqueta legible para el selector de "nueva solicitud". | `src/modules/identity_assurance/dto/request-verification.dto.ts:215` |
| `types[].jurisdictionAuthorizationId` | `string` | No | formato uuid | — | Matrícula concreta a la que aplica este tipo, sólo para `PRACTITIONER_LICENSE`: un profesional puede tener más de una. | `src/modules/identity_assurance/dto/request-verification.dto.ts:222` |
| `types[].hasPendingRequest` | `boolean` | Sí | — | — | Ya hay una solicitud viva (abierta o en verificación) para este tipo concreto. El backend igual rechaza con 409 si se manda de todas formas: esto es lo que deja a la pantalla no ofrecer el envío desde antes. | `src/modules/identity_assurance/dto/request-verification.dto.ts:230` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/identity_assurance.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / identity assurance — etapa `ctrl:IdentitySelfServiceController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 14. GET /identity/verification-cases

- **Origen:** CONTRATO
- **Nombre:** Listar los casos que esperan revisión
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IdentityCasesController.listQueue` — `src/modules/identity_assurance/controllers/identity-cases.controller.ts:68`

### Qué es y para qué sirve (negocio)

Listar los casos que esperan revisión. Dentro del módulo (descripción del modelo, en inglés): «Verifies patients, practitioners, representatives and organization operators against authoritative ministries, civil registries, professional boards and government data platforms.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_27_identity_assurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /identity/verification-cases` la atiende `IdentityCasesController.listQueue` (src/modules/identity_assurance/controllers/identity-cases.controller.ts:68). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `IdentityCasesService.listQueue`. Lee directory.tenant_memberships, identity_assurance.identity_verification_cases, profiles.jurisdiction_authorizations, profiles.person_account_links.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/identity_assurance/controllers/identity-cases.controller.ts:68` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | IdentityCasesController.listQueue → IdentityCasesService.listQueue → IdentityCaseScope.filterToTenant → IdentityCaseScope.subjectInTenant | `src/modules/identity_assurance/services/identity-case-scope.service.ts:230` |
| `identity_assurance.identity_verification_cases` | LEE | LEE | DIRECTA | IdentityCasesController.listQueue → IdentityCasesService.listQueue → IdentityVerificationCasesRepository.findByStatuses | `src/modules/identity_assurance/repositories/identity-cases.repository.ts:165` |
| `profiles.jurisdiction_authorizations` | LEE | LEE | DIRECTA | IdentityCasesController.listQueue → IdentityCasesService.listQueue → IdentityCaseScope.filterToTenant → IdentityCaseScope.subjectInTenant | `src/modules/identity_assurance/services/identity-case-scope.service.ts:208` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | IdentityCasesController.listQueue → IdentityCasesService.listQueue → IdentityCaseScope.filterToTenant → IdentityCaseScope.subjectInTenant | `src/modules/identity_assurance/services/identity-case-scope.service.ts:221` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `status` | query | No | `string` | Concepto de estado a listar; por defecto, los que esperan revisión |
| `limit` | query | No | `number` | Casos por página (por defecto 50) |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<CaseQueueResponseDto>` · DTO `CaseQueueResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `cases` | `array<QueuedCaseDto>` | Sí | — | — | Valor de cases mantenido por la instancia. | `src/modules/identity_assurance/dto/case-queue.dto.ts:66` |
| `cases[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/identity_assurance/dto/case-queue.dto.ts:15` |
| `cases[].status` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/identity_assurance/dto/case-queue.dto.ts:21` |
| `cases[].subjectTypeConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a subject type concept. | `src/modules/identity_assurance/dto/case-queue.dto.ts:27` |
| `cases[].subjectEntityId` | `string` | Sí | formato uuid | — | Identificador asociado a subject entity. | `src/modules/identity_assurance/dto/case-queue.dto.ts:33` |
| `cases[].identityVerificationPolicyId` | `string` | Sí | formato uuid | — | Identificador asociado a identity verification policy. | `src/modules/identity_assurance/dto/case-queue.dto.ts:39` |
| `cases[].riskScore` | `string` | No | — | — | Valor de risk score mantenido por la instancia. | `src/modules/identity_assurance/dto/case-queue.dto.ts:45` |
| `cases[].openedAt` | `string` | No | formato date-time | — | Valor de opened at mantenido por la instancia. | `src/modules/identity_assurance/dto/case-queue.dto.ts:51` |
| `cases[].expiresAt` | `string` | No | formato date-time | — | Valor de expires at mantenido por la instancia. | `src/modules/identity_assurance/dto/case-queue.dto.ts:57` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/identity_assurance.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/identity-verification-cycle.int-spec.ts:36` |

### Flujos

- src / modules / identity assurance — etapa `ctrl:IdentityCasesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 15. POST /identity/verification-cases

- **Origen:** CONTRATO
- **Nombre:** Iniciar un caso de verificación de identidad
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IdentityCasesController.open` — `src/modules/identity_assurance/controllers/identity-cases.controller.ts:123`

### Qué es y para qué sirve (negocio)

Iniciar un caso de verificación de identidad. Dentro del módulo (descripción del modelo, en inglés): «Verifies patients, practitioners, representatives and organization operators against authoritative ministries, civil registries, professional boards and government data platforms.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_27_identity_assurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /identity/verification-cases` la atiende `IdentityCasesController.open` (src/modules/identity_assurance/controllers/identity-cases.controller.ts:123). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `OpenCaseDto` (6 campos, 3 obligatorios). Delega en `IdentityCasesService.openCase`. Crea filas en identity_assurance.identity_verification_cases. Lee directory.tenant_memberships, identity_assurance.identity_verification_policies, profiles.jurisdiction_authorizations, profiles.person_account_links.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/identity_assurance/controllers/identity-cases.controller.ts:123` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | IdentityCasesController.open → IdentityCasesService.openCase → IdentityCaseScope.assertSubjectInTenant → IdentityCaseScope.subjectInTenant | `src/modules/identity_assurance/services/identity-case-scope.service.ts:230` |
| `identity_assurance.identity_verification_cases` | ESCRIBE | CREA | DIRECTA | IdentityCasesController.open → IdentityCasesService.openCase → IdentityVerificationCasesRepository.create | `src/modules/identity_assurance/repositories/identity-cases.repository.ts:75` |
| `identity_assurance.identity_verification_policies` | LEE | LEE | DIRECTA | IdentityCasesController.open → IdentityCasesService.openCase → IdentityVerificationPoliciesRepository.findById | `src/modules/identity_assurance/repositories/identity-policies.repository.ts:75` |
| `profiles.jurisdiction_authorizations` | LEE | LEE | DIRECTA | IdentityCasesController.open → IdentityCasesService.openCase → IdentityCaseScope.assertSubjectInTenant → IdentityCaseScope.subjectInTenant | `src/modules/identity_assurance/services/identity-case-scope.service.ts:208` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | IdentityCasesController.open → IdentityCasesService.openCase → IdentityCaseScope.assertSubjectInTenant → IdentityCaseScope.subjectInTenant | `src/modules/identity_assurance/services/identity-case-scope.service.ts:221` |

### Cuerpo — DTO `OpenCaseDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `identityVerificationPolicyId` | `string` | Sí | formato uuid | `@IsUUID()` | Política de verificación vigente | `src/modules/identity_assurance/dto/open-case.dto.ts:14` |
| `subjectTypeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Concepto: tipo de sujeto | `src/modules/identity_assurance/dto/open-case.dto.ts:21` |
| `subjectEntityId` | `string` | Sí | formato uuid | `@IsUUID()` | Id de la entidad sujeto (paciente/profesional/representante) | `src/modules/identity_assurance/dto/open-case.dto.ts:31` |
| `requestedAssuranceLevelConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concepto: IAL/AAL solicitado (por defecto el de la política) | `src/modules/identity_assurance/dto/open-case.dto.ts:42` |
| `correlationId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Correlation id para idempotencia de apertura | `src/modules/identity_assurance/dto/open-case.dto.ts:53` |
| `expiresInHours` | `number` | No | mínimo 1 | `@IsOptional()` `@IsInt()` `@Min(1)` | TTL del caso en horas (por defecto 72) | `src/modules/identity_assurance/dto/open-case.dto.ts:65` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "identityVerificationPolicyId": "00000000-0000-4000-8000-000000000001",
  "subjectTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "subjectEntityId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "identityVerificationPolicyId": "00000000-0000-4000-8000-000000000001",
  "subjectTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "subjectEntityId": "00000000-0000-4000-8000-000000000001",
  "requestedAssuranceLevelConceptId": "00000000-0000-4000-8000-000000000001",
  "correlationId": "00000000-0000-4000-8000-000000000001",
  "expiresInHours": 72
}
```

</details>

### Respuesta — `Promise<CaseResponseDto>` · DTO `CaseResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/identity_assurance/dto/identity-responses.dto.ts:68` |
| `caseNumber` | `string` | Sí | — | — | Número del caso | sin fuente |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | sin fuente |
| `operatingRoomId` | `string` | Sí | formato uuid | — | Quirófano reservado | sin fuente |
| `milestoneId` | `string` | Sí | formato uuid | — | Hito de programación creado | sin fuente |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Política de verificación no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/identity_assurance.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/identity-verification-cycle.int-spec.ts:65` |
| CONTROLADOR | `src/modules/identity_assurance/controllers/identity-cases.controller.spec.ts:38` |

### Flujos

- src / modules / identity assurance — etapa `ctrl:IdentityCasesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 16. GET /identity/verification-cases/{id}

- **Origen:** CONTRATO
- **Nombre:** Consultar expediente y evidencias de un caso
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IdentityCasesController.getCaseDetail` — `src/modules/identity_assurance/controllers/identity-cases.controller.ts:90`

### Qué es y para qué sirve (negocio)

Consultar expediente y evidencias de un caso. Dentro del módulo (descripción del modelo, en inglés): «Verifies patients, practitioners, representatives and organization operators against authoritative ministries, civil registries, professional boards and government data platforms.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_27_identity_assurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /identity/verification-cases/{id}` la atiende `IdentityCasesController.getCaseDetail` (src/modules/identity_assurance/controllers/identity-cases.controller.ts:90). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `IdentityCasesService.getCaseDetail`. Lee directory.tenant_memberships, identity_assurance.identity_evidence_records, identity_assurance.identity_verification_cases, profiles.jurisdiction_authorizations, profiles.person_account_links.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/identity_assurance/controllers/identity-cases.controller.ts:90` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/identity_assurance/controllers/identity-cases.controller.ts:90` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | IdentityCasesController.getCaseDetail → IdentityCasesService.getCaseDetail → IdentityCaseScope.loadAuthorizedCase → IdentityCaseScope.findAuthorizedCase → IdentityCaseScope.subjectInTenant | `src/modules/identity_assurance/services/identity-case-scope.service.ts:230` |
| `identity_assurance.identity_evidence_records` | LEE | LEE | DIRECTA | IdentityCasesController.getCaseDetail → IdentityCasesService.getCaseDetail → IdentityEvidenceRecordsRepository.findByCase | `src/modules/identity_assurance/repositories/identity-evidence.repository.ts:129` |
| `identity_assurance.identity_verification_cases` | LEE | LEE | DIRECTA | IdentityCasesController.getCaseDetail → IdentityCasesService.getCaseDetail → IdentityCaseScope.loadAuthorizedCase → IdentityCaseScope.findAuthorizedCase → IdentityVerificationCasesRepository.findById | `src/modules/identity_assurance/repositories/identity-cases.repository.ts:64` |
| `profiles.jurisdiction_authorizations` | LEE | LEE | DIRECTA | IdentityCasesController.getCaseDetail → IdentityCasesService.getCaseDetail → IdentityCaseScope.loadAuthorizedCase → IdentityCaseScope.findAuthorizedCase → IdentityCaseScope.subjectInTenant | `src/modules/identity_assurance/services/identity-case-scope.service.ts:208` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | IdentityCasesController.getCaseDetail → IdentityCasesService.getCaseDetail → IdentityCaseScope.loadAuthorizedCase → IdentityCaseScope.findAuthorizedCase → IdentityCaseScope.subjectInTenant | `src/modules/identity_assurance/services/identity-case-scope.service.ts:221` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<VerificationCaseDetailDto>` · DTO `VerificationCaseDetailDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `evidence` | `array<VerificationEvidenceDto>` | Sí | — | — | — | `src/modules/identity_assurance/dto/case-queue.dto.ts:72` |
| `evidence[].id` | `string` | Sí | formato uuid | — | — | `src/modules/identity_assurance/dto/request-verification.dto.ts:95` |
| `evidence[].evidenceTypeConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/identity_assurance/dto/request-verification.dto.ts:98` |
| `evidence[].evidenceFileId` | `string` | No | formato uuid | — | — | `src/modules/identity_assurance/dto/request-verification.dto.ts:101` |
| `evidence[].createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/identity_assurance/dto/request-verification.dto.ts:104` |
| `evidence[].sequence` | `number` | Sí | — | — | — | `src/modules/identity_assurance/dto/request-verification.dto.ts:107` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/identity_assurance.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / identity assurance — etapa `ctrl:IdentityCasesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 17. POST /identity/verification-cases/{id}/assertions

- **Origen:** CONTRATO
- **Nombre:** Emitir una aserción de identidad con nivel de aseguramiento
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IdentityCasesController.issueAssertion` — `src/modules/identity_assurance/controllers/identity-cases.controller.ts:212`

### Qué es y para qué sirve (negocio)

Emitir una aserción de identidad con nivel de aseguramiento. Dentro del módulo (descripción del modelo, en inglés): «Verifies patients, practitioners, representatives and organization operators against authoritative ministries, civil registries, professional boards and government data platforms.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_27_identity_assurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /identity/verification-cases/{id}/assertions` la atiende `IdentityCasesController.issueAssertion` (src/modules/identity_assurance/controllers/identity-cases.controller.ts:212). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `IssueAssertionDto` (4 campos, 1 obligatorio). Delega en `IdentityCasesService.issueAssertion`. Crea filas en identity_assurance.identity_assertions. Actualiza identity_assurance.identity_verification_cases. Lee directory.tenant_memberships, identity_assurance.identity_authorities, identity_assurance.identity_checks, identity_assurance.identity_verification_cases, profiles.jurisdiction_authorizations, profiles.person_account_links.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/identity_assurance/controllers/identity-cases.controller.ts:212` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/identity_assurance/controllers/identity-cases.controller.ts:212` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | IdentityCasesController.issueAssertion → IdentityCasesService.issueAssertion → IdentityCaseScope.loadAuthorizedCase → IdentityCaseScope.findAuthorizedCase → IdentityCaseScope.subjectInTenant | `src/modules/identity_assurance/services/identity-case-scope.service.ts:230` |
| `identity_assurance.identity_assertions` | ESCRIBE | CREA | DIRECTA | IdentityCasesController.issueAssertion → IdentityCasesService.issueAssertion → IdentityAssertionsRepository.create | `src/modules/identity_assurance/repositories/identity-assertions.repository.ts:171` |
| `identity_assurance.identity_authorities` | LEE | LEE | DIRECTA | IdentityCasesController.issueAssertion → IdentityCasesService.issueAssertion → IdentityCaseScope.assertAuthorityInTenant | `src/modules/identity_assurance/services/identity-case-scope.service.ts:133` |
| `identity_assurance.identity_checks` | LEE | LEE | DIRECTA | IdentityCasesController.issueAssertion → IdentityCasesService.issueAssertion → IdentityChecksRepository.countByCaseAndStatus | `src/modules/identity_assurance/repositories/identity-checks.repository.ts:192` |
| `identity_assurance.identity_verification_cases` | ESCRIBE | ACTUALIZA | POR_TIPO | IdentityCasesController.issueAssertion → IdentityCasesService.issueAssertion | `src/modules/identity_assurance/services/identity-cases.service.ts:528` |
| `identity_assurance.identity_verification_cases` | LEE | LEE | DIRECTA | IdentityCasesController.issueAssertion → IdentityCasesService.issueAssertion → IdentityCaseScope.loadAuthorizedCase → IdentityCaseScope.findAuthorizedCase → IdentityVerificationCasesRepository.findById | `src/modules/identity_assurance/repositories/identity-cases.repository.ts:64` |
| `profiles.jurisdiction_authorizations` | LEE | LEE | DIRECTA | IdentityCasesController.issueAssertion → IdentityCasesService.issueAssertion → IdentityCaseScope.loadAuthorizedCase → IdentityCaseScope.findAuthorizedCase → IdentityCaseScope.subjectInTenant | `src/modules/identity_assurance/services/identity-case-scope.service.ts:208` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | IdentityCasesController.issueAssertion → IdentityCasesService.issueAssertion → IdentityCaseScope.loadAuthorizedCase → IdentityCaseScope.findAuthorizedCase → IdentityCaseScope.subjectInTenant | `src/modules/identity_assurance/services/identity-case-scope.service.ts:221` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `IssueAssertionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `issuerIdentityAuthorityId` | `string` | Sí | formato uuid | `@IsUUID()` | Autoridad emisora de la aserción | `src/modules/identity_assurance/dto/issue-assertion.dto.ts:14` |
| `assertionTypeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concepto: tipo de aserción (por defecto identidad) | `src/modules/identity_assurance/dto/issue-assertion.dto.ts:25` |
| `assuranceLevelConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concepto: nivel de aseguramiento alcanzado (por defecto el solicitado del caso) | `src/modules/identity_assurance/dto/issue-assertion.dto.ts:37` |
| `expiresInHours` | `number` | No | mínimo 1 | `@IsOptional()` `@IsInt()` `@Min(1)` | Vigencia de la aserción en horas (por defecto 8760 = 1 año) | `src/modules/identity_assurance/dto/issue-assertion.dto.ts:49` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "issuerIdentityAuthorityId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "issuerIdentityAuthorityId": "00000000-0000-4000-8000-000000000001",
  "assertionTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "assuranceLevelConceptId": "00000000-0000-4000-8000-000000000001",
  "expiresInHours": 8760
}
```

</details>

### Respuesta — `Promise<AssertionResponseDto>` · DTO `AssertionResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/identity_assurance/dto/identity-responses.dto.ts:216` |
| `assertionIdentifier` | `string` | No | — | — | Valor de assertion identifier mantenido por la instancia. | `src/modules/identity_assurance/dto/identity-responses.dto.ts:220` |
| `assuranceLevel` | `string` | Sí | formato uuid | — | Valor de assurance level mantenido por la instancia. | `src/modules/identity_assurance/dto/identity-responses.dto.ts:224` |
| `issuedAt` | `string` | No | formato date-time | — | Valor de issued at mantenido por la instancia. | `src/modules/identity_assurance/dto/identity-responses.dto.ts:228` |
| `caseStatus` | `string` | Sí | formato uuid | — | Valor de case status mantenido por la instancia. | `src/modules/identity_assurance/dto/identity-responses.dto.ts:232` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Solo un caso verificado puede emitir una aserción; PreconditionFailedException: No hay checks completados que sustenten la aserción; PreconditionFailedException: No se pudo determinar el nivel de aseguramiento |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/identity_assurance.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/identity_assurance/controllers/identity-cases.controller.spec.ts:88` |

### Flujos

- src / modules / identity assurance — etapa `ctrl:IdentityCasesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 18. POST /identity/verification-cases/{id}/checks:plan

- **Origen:** CONTRATO
- **Nombre:** Planificar los checks requeridos del caso
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IdentityCasesController.planChecks` — `src/modules/identity_assurance/controllers/identity-cases.controller.ts:158`

### Qué es y para qué sirve (negocio)

Planificar los checks requeridos del caso. Dentro del módulo (descripción del modelo, en inglés): «Verifies patients, practitioners, representatives and organization operators against authoritative ministries, civil registries, professional boards and government data platforms.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_27_identity_assurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /identity/verification-cases/{id}/checks:plan` la atiende `IdentityCasesController.planChecks` (src/modules/identity_assurance/controllers/identity-cases.controller.ts:158). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `PlanChecksDto` (4 campos, 2 obligatorios). Delega en `IdentityCasesService.planChecks`. Crea filas en identity_assurance.identity_checks. Actualiza identity_assurance.identity_verification_cases. Lee directory.tenant_memberships, identity_assurance.identity_authorities, identity_assurance.identity_verification_cases, profiles.jurisdiction_authorizations, profiles.person_account_links.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/identity_assurance/controllers/identity-cases.controller.ts:158` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/identity_assurance/controllers/identity-cases.controller.ts:158` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | IdentityCasesController.planChecks → IdentityCasesService.planChecks → IdentityCaseScope.loadAuthorizedCase → IdentityCaseScope.findAuthorizedCase → IdentityCaseScope.subjectInTenant | `src/modules/identity_assurance/services/identity-case-scope.service.ts:230` |
| `identity_assurance.identity_authorities` | LEE | LEE | DIRECTA | IdentityCasesController.planChecks → IdentityCasesService.planChecks → IdentityCaseScope.assertAuthorityInTenant | `src/modules/identity_assurance/services/identity-case-scope.service.ts:133` |
| `identity_assurance.identity_checks` | ESCRIBE | CREA | DIRECTA | IdentityCasesController.planChecks → IdentityCasesService.planChecks → IdentityChecksRepository.create | `src/modules/identity_assurance/repositories/identity-checks.repository.ts:152` |
| `identity_assurance.identity_verification_cases` | ESCRIBE | ACTUALIZA | POR_TIPO | IdentityCasesController.planChecks → IdentityCasesService.planChecks | `src/modules/identity_assurance/services/identity-cases.service.ts:352` |
| `identity_assurance.identity_verification_cases` | LEE | LEE | DIRECTA | IdentityCasesController.planChecks → IdentityCasesService.planChecks → IdentityCaseScope.loadAuthorizedCase → IdentityCaseScope.findAuthorizedCase → IdentityVerificationCasesRepository.findById | `src/modules/identity_assurance/repositories/identity-cases.repository.ts:64` |
| `profiles.jurisdiction_authorizations` | LEE | LEE | DIRECTA | IdentityCasesController.planChecks → IdentityCasesService.planChecks → IdentityCaseScope.loadAuthorizedCase → IdentityCaseScope.findAuthorizedCase → IdentityCaseScope.subjectInTenant | `src/modules/identity_assurance/services/identity-case-scope.service.ts:208` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | IdentityCasesController.planChecks → IdentityCasesService.planChecks → IdentityCaseScope.loadAuthorizedCase → IdentityCaseScope.findAuthorizedCase → IdentityCaseScope.subjectInTenant | `src/modules/identity_assurance/services/identity-case-scope.service.ts:221` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `PlanChecksDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `checks` | `array<PlanCheckItemDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => PlanCheckItemDto)` | Checks a planificar | `src/modules/identity_assurance/dto/plan-checks.dto.ts:54` |
| `checks[].checkTypeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Concepto: tipo de check | `src/modules/identity_assurance/dto/plan-checks.dto.ts:19` |
| `checks[].authorityId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Autoridad contra la que se ejecuta el check | `src/modules/identity_assurance/dto/plan-checks.dto.ts:30` |
| `checks[].required` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | ¿El check es obligatorio? | `src/modules/identity_assurance/dto/plan-checks.dto.ts:41` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "checks": [
    {
      "checkTypeConceptId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "checks": [
    {
      "checkTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "authorityId": "00000000-0000-4000-8000-000000000001",
      "required": true
    }
  ]
}
```

</details>

### Respuesta — `Promise<ChecksPlannedResponseDto>` · DTO `ChecksPlannedResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `caseId` | `string` | Sí | formato uuid | — | Identificador asociado a case. | `src/modules/identity_assurance/dto/identity-responses.dto.ts:104` |
| `checkIds` | `array<string>` | Sí | — | — | Valor de check ids mantenido por la instancia. | `src/modules/identity_assurance/dto/identity-responses.dto.ts:108` |
| `caseStatus` | `string` | Sí | formato uuid | — | Valor de case status mantenido por la instancia. | `src/modules/identity_assurance/dto/identity-responses.dto.ts:112` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Solo un caso abierto puede planificar checks |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/identity_assurance.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/identity-verification-cycle.int-spec.ts:83` |
| CONTROLADOR | `src/modules/identity_assurance/controllers/identity-cases.controller.spec.ts:58` |

### Flujos

- src / modules / identity assurance — etapa `ctrl:IdentityCasesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 19. POST /identity/verification-cases/{id}/evidence

- **Origen:** CONTRATO
- **Nombre:** Aportar evidencia documental bajo consentimiento
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IdentityCasesController.submitEvidence` — `src/modules/identity_assurance/controllers/identity-cases.controller.ts:140`

### Qué es y para qué sirve (negocio)

Aportar evidencia documental bajo consentimiento. Dentro del módulo (descripción del modelo, en inglés): «Verifies patients, practitioners, representatives and organization operators against authoritative ministries, civil registries, professional boards and government data platforms.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_27_identity_assurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /identity/verification-cases/{id}/evidence` la atiende `IdentityCasesController.submitEvidence` (src/modules/identity_assurance/controllers/identity-cases.controller.ts:140). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `SubmitEvidenceDto` (7 campos, 1 obligatorio). Delega en `IdentityCasesService.submitEvidence`. Crea filas en identity_assurance.identity_evidence_records. Lee common.file_versions, common.files, consent.consents, directory.tenant_memberships, identity_assurance.identity_authorities, identity_assurance.identity_verification_cases, messaging.queued_jobs, profiles.jurisdiction_authorizations y 1 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/identity_assurance/controllers/identity-cases.controller.ts:140` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/identity_assurance/controllers/identity-cases.controller.ts:140` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.file_versions` | LEE | LEE | DIRECTA | IdentityCasesController.submitEvidence → IdentityCasesService.submitEvidence → IdentityEvidenceRecordsRepository.create → StoragePublicationService.guardFile | `src/common/storage/storage-publication.service.ts:190` |
| `common.files` | LEE | LEE | DIRECTA | IdentityCasesController.submitEvidence → IdentityCasesService.submitEvidence → IdentityCaseScope.assertEvidenceReferences | `src/modules/identity_assurance/services/identity-case-scope.service.ts:164` |
| `consent.consents` | LEE | LEE | DIRECTA | IdentityCasesController.submitEvidence → IdentityCasesService.submitEvidence → IdentityCaseScope.assertEvidenceReferences | `src/modules/identity_assurance/services/identity-case-scope.service.ts:171` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | IdentityCasesController.submitEvidence → IdentityCasesService.submitEvidence → IdentityCaseScope.loadAuthorizedCase → IdentityCaseScope.findAuthorizedCase → IdentityCaseScope.subjectInTenant | `src/modules/identity_assurance/services/identity-case-scope.service.ts:230` |
| `identity_assurance.identity_authorities` | LEE | LEE | DIRECTA | IdentityCasesController.submitEvidence → IdentityCasesService.submitEvidence → IdentityCaseScope.assertAuthorityInTenant | `src/modules/identity_assurance/services/identity-case-scope.service.ts:133` |
| `identity_assurance.identity_evidence_records` | ESCRIBE | CREA | DIRECTA | IdentityCasesController.submitEvidence → IdentityCasesService.submitEvidence → IdentityEvidenceRecordsRepository.create | `src/modules/identity_assurance/repositories/identity-evidence.repository.ts:81` |
| `identity_assurance.identity_verification_cases` | LEE | LEE | DIRECTA | IdentityCasesController.submitEvidence → IdentityCasesService.submitEvidence → IdentityCaseScope.loadAuthorizedCase → IdentityCaseScope.findAuthorizedCase → IdentityVerificationCasesRepository.findById | `src/modules/identity_assurance/repositories/identity-cases.repository.ts:64` |
| `messaging.queued_jobs` | LEE | LEE | DIRECTA | IdentityCasesController.submitEvidence → IdentityCasesService.submitEvidence → IdentityEvidenceRecordsRepository.create → StoragePublicationService.guardFile → StorageLifecycleCoordinator.assertNoContender → QueuesRepository.findStorageIntents | `src/modules/messaging/repositories/queues.repository.ts:62` |
| `profiles.jurisdiction_authorizations` | LEE | LEE | DIRECTA | IdentityCasesController.submitEvidence → IdentityCasesService.submitEvidence → IdentityCaseScope.loadAuthorizedCase → IdentityCaseScope.findAuthorizedCase → IdentityCaseScope.subjectInTenant | `src/modules/identity_assurance/services/identity-case-scope.service.ts:208` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | IdentityCasesController.submitEvidence → IdentityCasesService.submitEvidence → IdentityCaseScope.loadAuthorizedCase → IdentityCaseScope.findAuthorizedCase → IdentityCaseScope.subjectInTenant | `src/modules/identity_assurance/services/identity-case-scope.service.ts:221` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `SubmitEvidenceDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `evidenceTypeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Concepto: tipo de evidencia | `src/modules/identity_assurance/dto/submit-evidence.dto.ts:11` |
| `issuerAuthorityId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Autoridad emisora de la evidencia | `src/modules/identity_assurance/dto/submit-evidence.dto.ts:22` |
| `evidenceIdentifierHash` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Hash del identificador de la evidencia (minimización de datos) | `src/modules/identity_assurance/dto/submit-evidence.dto.ts:35` |
| `evidenceFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Archivo de evidencia (common.files) | `src/modules/identity_assurance/dto/submit-evidence.dto.ts:46` |
| `encryptedEvidenceReference` | `string` | No | — | `@IsOptional()` `@IsString()` | Referencia cifrada al payload (object storage) | `src/modules/identity_assurance/dto/submit-evidence.dto.ts:56` |
| `evidenceQualityConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concepto: calidad de la evidencia | `src/modules/identity_assurance/dto/submit-evidence.dto.ts:67` |
| `collectedUnderConsentId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Consentimiento bajo el que se recolectó | `src/modules/identity_assurance/dto/submit-evidence.dto.ts:78` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "evidenceTypeConceptId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "evidenceTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "issuerAuthorityId": "00000000-0000-4000-8000-000000000001",
  "evidenceIdentifierHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "evidenceFileId": "00000000-0000-4000-8000-000000000001",
  "encryptedEvidenceReference": "valor-ejemplo",
  "evidenceQualityConceptId": "00000000-0000-4000-8000-000000000001",
  "collectedUnderConsentId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<EvidenceResponseDto>` · DTO `EvidenceResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `retrievalSessionId` | `string` | Sí | formato uuid | — | Identificador asociado a retrieval session. | sin fuente |
| `status` | `string` | Sí | — | — | Valor de status mantenido por la instancia. | sin fuente |
| `citations` | `number` | Sí | — | — | Citas materializadas | sin fuente |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El caso no admite evidencia en su estado actual |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | StorageLifecycleDenied: {identity.reasonCode}; StorageLifecycleDenied: FILE_NOT_LIVE; StorageLifecycleDenied: VERSION_UNKNOWN; StorageLifecycleDenied: PHYSICAL_IDENTITY_UNKNOWN; StorageLifecycleDenied: PRODUCER_OR_PURGE_IN_FLIGHT |

El árbol de decisión completo está en [flujos](../flujos/identity_assurance.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/identity_assurance/controllers/identity-cases.controller.spec.ts:44` |

### Flujos

- src / modules / identity assurance — etapa `ctrl:IdentityCasesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 20. POST /identity/verification-cases/{id}/fraud-signals

- **Origen:** CONTRATO
- **Nombre:** Detectar y registrar una señal de fraude
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IdentityCasesController.raiseFraudSignal` — `src/modules/identity_assurance/controllers/identity-cases.controller.ts:176`

### Qué es y para qué sirve (negocio)

Detectar y registrar una señal de fraude. Dentro del módulo (descripción del modelo, en inglés): «Verifies patients, practitioners, representatives and organization operators against authoritative ministries, civil registries, professional boards and government data platforms.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_27_identity_assurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /identity/verification-cases/{id}/fraud-signals` la atiende `IdentityCasesController.raiseFraudSignal` (src/modules/identity_assurance/controllers/identity-cases.controller.ts:176). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `RaiseFraudSignalDto` (5 campos, 2 obligatorios). Delega en `IdentityCasesService.raiseFraudSignal`. Crea filas en identity_assurance.identity_fraud_signals. Actualiza identity_assurance.identity_verification_cases. Lee directory.tenant_memberships, identity_assurance.identity_verification_cases, profiles.jurisdiction_authorizations, profiles.person_account_links.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/identity_assurance/controllers/identity-cases.controller.ts:176` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/identity_assurance/controllers/identity-cases.controller.ts:176` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | IdentityCasesController.raiseFraudSignal → IdentityCasesService.raiseFraudSignal → IdentityCaseScope.loadAuthorizedCase → IdentityCaseScope.findAuthorizedCase → IdentityCaseScope.subjectInTenant | `src/modules/identity_assurance/services/identity-case-scope.service.ts:230` |
| `identity_assurance.identity_fraud_signals` | ESCRIBE | CREA | DIRECTA | IdentityCasesController.raiseFraudSignal → IdentityCasesService.raiseFraudSignal → IdentityFraudSignalsRepository.create | `src/modules/identity_assurance/repositories/identity-fraud-signals.repository.ts:52` |
| `identity_assurance.identity_verification_cases` | ESCRIBE | ACTUALIZA | POR_TIPO | IdentityCasesController.raiseFraudSignal → IdentityCasesService.raiseFraudSignal | `src/modules/identity_assurance/services/identity-cases.service.ts:386` |
| `identity_assurance.identity_verification_cases` | LEE | LEE | DIRECTA | IdentityCasesController.raiseFraudSignal → IdentityCasesService.raiseFraudSignal → IdentityCaseScope.loadAuthorizedCase → IdentityCaseScope.findAuthorizedCase → IdentityVerificationCasesRepository.findById | `src/modules/identity_assurance/repositories/identity-cases.repository.ts:64` |
| `profiles.jurisdiction_authorizations` | LEE | LEE | DIRECTA | IdentityCasesController.raiseFraudSignal → IdentityCasesService.raiseFraudSignal → IdentityCaseScope.loadAuthorizedCase → IdentityCaseScope.findAuthorizedCase → IdentityCaseScope.subjectInTenant | `src/modules/identity_assurance/services/identity-case-scope.service.ts:208` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | IdentityCasesController.raiseFraudSignal → IdentityCasesService.raiseFraudSignal → IdentityCaseScope.loadAuthorizedCase → IdentityCaseScope.findAuthorizedCase → IdentityCaseScope.subjectInTenant | `src/modules/identity_assurance/services/identity-case-scope.service.ts:221` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `RaiseFraudSignalDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `signalTypeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Concepto: tipo de señal de fraude | `src/modules/identity_assurance/dto/raise-fraud-signal.dto.ts:20` |
| `severityConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Concepto: severidad de la señal | `src/modules/identity_assurance/dto/raise-fraud-signal.dto.ts:30` |
| `confidenceScore` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Puntaje de confianza (0..1) | `src/modules/identity_assurance/dto/raise-fraud-signal.dto.ts:41` |
| `sourceConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concepto: fuente de la señal | `src/modules/identity_assurance/dto/raise-fraud-signal.dto.ts:52` |
| `evidenceReference` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Referencia a la evidencia de la señal | `src/modules/identity_assurance/dto/raise-fraud-signal.dto.ts:64` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "signalTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "severityConceptId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "signalTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "severityConceptId": "00000000-0000-4000-8000-000000000001",
  "confidenceScore": "0.75",
  "sourceConceptId": "00000000-0000-4000-8000-000000000001",
  "evidenceReference": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<FraudSignalResponseDto>` · DTO `FraudSignalResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/identity_assurance/dto/identity-responses.dto.ts:168` |
| `resolution` | `string` | Sí | formato uuid | — | Valor de resolution mantenido por la instancia. | `src/modules/identity_assurance/dto/identity-responses.dto.ts:172` |
| `caseStatus` | `string` | Sí | formato uuid | — | Valor de case status mantenido por la instancia. | `src/modules/identity_assurance/dto/identity-responses.dto.ts:176` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/identity_assurance.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/identity_assurance/controllers/identity-cases.controller.spec.ts:68` |

### Flujos

- src / modules / identity assurance — etapa `ctrl:IdentityCasesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 21. POST /identity/verification-cases/{id}/manual-review

- **Origen:** CONTRATO
- **Nombre:** Escalar el caso a revisión manual
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IdentityCasesController.openManualReview` — `src/modules/identity_assurance/controllers/identity-cases.controller.ts:194`

### Qué es y para qué sirve (negocio)

Escalar el caso a revisión manual. Dentro del módulo (descripción del modelo, en inglés): «Verifies patients, practitioners, representatives and organization operators against authoritative ministries, civil registries, professional boards and government data platforms.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_27_identity_assurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /identity/verification-cases/{id}/manual-review` la atiende `IdentityCasesController.openManualReview` (src/modules/identity_assurance/controllers/identity-cases.controller.ts:194). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `OpenManualReviewDto` (2 campos, 1 obligatorio). Delega en `IdentityCasesService.openManualReview`. Crea filas en identity_assurance.identity_manual_review_cases. Actualiza identity_assurance.identity_verification_cases. Lee directory.tenant_memberships, identity_assurance.identity_manual_review_cases, identity_assurance.identity_verification_cases, profiles.jurisdiction_authorizations, profiles.person_account_links.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/identity_assurance/controllers/identity-cases.controller.ts:194` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/identity_assurance/controllers/identity-cases.controller.ts:194` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | IdentityCasesController.openManualReview → IdentityCasesService.openManualReview → IdentityCaseScope.loadAuthorizedCase → IdentityCaseScope.findAuthorizedCase → IdentityCaseScope.subjectInTenant | `src/modules/identity_assurance/services/identity-case-scope.service.ts:230` |
| `identity_assurance.identity_manual_review_cases` | ESCRIBE | CREA | DIRECTA | IdentityCasesController.openManualReview → IdentityCasesService.openManualReview → IdentityManualReviewCasesRepository.create | `src/modules/identity_assurance/repositories/identity-manual-review.repository.ts:81` |
| `identity_assurance.identity_manual_review_cases` | LEE | LEE | DIRECTA | IdentityCasesController.openManualReview → IdentityCasesService.openManualReview → IdentityManualReviewCasesRepository.countOpenByCase | `src/modules/identity_assurance/repositories/identity-manual-review.repository.ts:64` |
| `identity_assurance.identity_verification_cases` | ESCRIBE | ACTUALIZA | POR_TIPO | IdentityCasesController.openManualReview → IdentityCasesService.openManualReview | `src/modules/identity_assurance/services/identity-cases.service.ts:452` |
| `identity_assurance.identity_verification_cases` | LEE | LEE | DIRECTA | IdentityCasesController.openManualReview → IdentityCasesService.openManualReview → IdentityCaseScope.loadAuthorizedCase → IdentityCaseScope.findAuthorizedCase → IdentityVerificationCasesRepository.findById | `src/modules/identity_assurance/repositories/identity-cases.repository.ts:64` |
| `profiles.jurisdiction_authorizations` | LEE | LEE | DIRECTA | IdentityCasesController.openManualReview → IdentityCasesService.openManualReview → IdentityCaseScope.loadAuthorizedCase → IdentityCaseScope.findAuthorizedCase → IdentityCaseScope.subjectInTenant | `src/modules/identity_assurance/services/identity-case-scope.service.ts:208` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | IdentityCasesController.openManualReview → IdentityCasesService.openManualReview → IdentityCaseScope.loadAuthorizedCase → IdentityCaseScope.findAuthorizedCase → IdentityCaseScope.subjectInTenant | `src/modules/identity_assurance/services/identity-case-scope.service.ts:221` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `OpenManualReviewDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reviewReasonConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Concepto: motivo de la revisión | `src/modules/identity_assurance/dto/open-manual-review.dto.ts:14` |
| `assignedToUserId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Usuario revisor asignado (por defecto el actor) | `src/modules/identity_assurance/dto/open-manual-review.dto.ts:25` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "reviewReasonConceptId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "reviewReasonConceptId": "00000000-0000-4000-8000-000000000001",
  "assignedToUserId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<ManualReviewResponseDto>` · DTO `ManualReviewResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/identity_assurance/dto/identity-responses.dto.ts:184` |
| `status` | `string` | Sí | formato uuid | — | Valor de status mantenido por la instancia. | `src/modules/identity_assurance/dto/identity-responses.dto.ts:188` |
| `caseStatus` | `string` | Sí | formato uuid | — | Valor de case status mantenido por la instancia. | `src/modules/identity_assurance/dto/identity-responses.dto.ts:192` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: El caso ya tiene una revisión manual abierta |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El caso no es escalable a revisión manual |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/identity_assurance.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/identity-verification-cycle.int-spec.ts:165` |
| CONTROLADOR | `src/modules/identity_assurance/controllers/identity-cases.controller.spec.ts:78` |

### Flujos

- src / modules / identity assurance — etapa `ctrl:IdentityCasesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 22. POST /identity/verification-cases/expire-sweep

- **Origen:** CONTRATO
- **Nombre:** Expirar por lote los casos vencidos (job programado)
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IdentityCasesController.expireSweep` — `src/modules/identity_assurance/controllers/identity-cases.controller.ts:105`

### Qué es y para qué sirve (negocio)

Expirar por lote los casos vencidos (job programado). Dentro del módulo (descripción del modelo, en inglés): «Verifies patients, practitioners, representatives and organization operators against authoritative ministries, civil registries, professional boards and government data platforms.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_27_identity_assurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /identity/verification-cases/expire-sweep` la atiende `IdentityCasesController.expireSweep` (src/modules/identity_assurance/controllers/identity-cases.controller.ts:105). Exige sesión con alguno de los roles SYSTEM, SECURITY_ADMIN. Delega en `IdentityCasesService.expireSweep`. Crea filas en audit.verified_badges_history. Actualiza community.public_profiles, community.verified_badges, identity_assurance.identity_checks. Lee community.public_profiles, community.verified_badges, directory.tenant_memberships, identity_assurance.identity_checks, identity_assurance.identity_verification_cases, profiles.jurisdiction_authorizations, profiles.person_account_links.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, SECURITY_ADMIN | `src/modules/identity_assurance/controllers/identity-cases.controller.ts:105` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.verified_badges_history` | ESCRIBE | CREA | DIRECTA | IdentityCasesController.expireSweep → IdentityCasesService.expireSweep → IdentityVerificationEffectsService.applyRevoked → CommunityVerificationService.applyRevoked → CommunityVerificationService.revokeProfileBadges → VerifiedBadgesRepository.recordHistory | `src/modules/community/repositories/verified-badges.repository.ts:172` |
| `community.public_profiles` | ESCRIBE | ACTUALIZA | POR_TIPO | IdentityCasesController.expireSweep → IdentityCasesService.expireSweep → IdentityVerificationEffectsService.applyRevoked → CommunityVerificationService.applyRevoked → CommunityVerificationService.revokeProfileBadges | `src/modules/community/services/community-verification.service.ts:249` |
| `community.public_profiles` | LEE | LEE | DIRECTA | IdentityCasesController.expireSweep → IdentityCasesService.expireSweep → IdentityVerificationEffectsService.applyRevoked → CommunityVerificationService.applyRevoked → VerifiedBadgesRepository.findProfileByTarget | `src/modules/community/repositories/verified-badges.repository.ts:205` |
| `community.verified_badges` | ESCRIBE | ACTUALIZA | POR_TIPO | IdentityCasesController.expireSweep → IdentityCasesService.expireSweep → IdentityVerificationEffectsService.applyRevoked → CommunityVerificationService.applyRevoked → CommunityVerificationService.revokeProfileBadges → VerifiedBadgesRepository.revoke | `src/modules/community/repositories/verified-badges.repository.ts:140` |
| `community.verified_badges` | LEE | LEE | DIRECTA | IdentityCasesController.expireSweep → IdentityCasesService.expireSweep → IdentityVerificationEffectsService.applyRevoked → CommunityVerificationService.applyRevoked → CommunityVerificationService.revokeProfileBadges → VerifiedBadgesRepository.findAllBySubject | `src/modules/community/repositories/verified-badges.repository.ts:73` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | IdentityCasesController.expireSweep → IdentityCasesService.expireSweep → IdentityCaseScope.filterToTenant → IdentityCaseScope.subjectInTenant | `src/modules/identity_assurance/services/identity-case-scope.service.ts:230` |
| `identity_assurance.identity_checks` | ESCRIBE | ACTUALIZA | POR_TIPO | IdentityCasesController.expireSweep → IdentityCasesService.expireSweep | `src/modules/identity_assurance/services/identity-cases.service.ts:572` |
| `identity_assurance.identity_checks` | LEE | LEE | DIRECTA | IdentityCasesController.expireSweep → IdentityCasesService.expireSweep → IdentityChecksRepository.findPendingByCase | `src/modules/identity_assurance/repositories/identity-checks.repository.ts:173` |
| `identity_assurance.identity_verification_cases` | LEE | LEE | DIRECTA | IdentityCasesController.expireSweep → IdentityCasesService.expireSweep → IdentityVerificationCasesRepository.findExpirable | `src/modules/identity_assurance/repositories/identity-cases.repository.ts:179` |
| `profiles.jurisdiction_authorizations` | LEE | LEE | DIRECTA | IdentityCasesController.expireSweep → IdentityCasesService.expireSweep → IdentityCaseScope.filterToTenant → IdentityCaseScope.subjectInTenant | `src/modules/identity_assurance/services/identity-case-scope.service.ts:208` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | IdentityCasesController.expireSweep → IdentityCasesService.expireSweep → IdentityCaseScope.filterToTenant → IdentityCaseScope.subjectInTenant | `src/modules/identity_assurance/services/identity-case-scope.service.ts:221` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ExpireSweepResponseDto>` · DTO `ExpireSweepResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `expiredCount` | `number` | Sí | — | — | Valor de expired count mantenido por la instancia. | `src/modules/identity_assurance/dto/identity-responses.dto.ts:256` |
| `caseIds` | `array<string>` | Sí | — | — | Valor de case ids mantenido por la instancia. | `src/modules/identity_assurance/dto/identity-responses.dto.ts:260` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/identity_assurance.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/identity_assurance/controllers/identity-cases.controller.spec.ts:102` |

### Flujos

- src / modules / identity assurance — etapa `ctrl:IdentityCasesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 23. POST /identity/verification-policies

- **Origen:** CONTRATO
- **Nombre:** Crear una política de verificación de identidad (IAL/AAL)
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IdentityPoliciesController.create` — `src/modules/identity_assurance/controllers/identity-policies.controller.ts:31`

### Qué es y para qué sirve (negocio)

Crear una política de verificación de identidad (IAL/AAL). Dentro del módulo (descripción del modelo, en inglés): «Verifies patients, practitioners, representatives and organization operators against authoritative ministries, civil registries, professional boards and government data platforms.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_27_identity_assurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /identity/verification-policies` la atiende `IdentityPoliciesController.create` (src/modules/identity_assurance/controllers/identity-policies.controller.ts:31). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreatePolicyDto` (9 campos, 4 obligatorios). Delega en `IdentityPoliciesService.createPolicy`. Crea filas en identity_assurance.identity_verification_policies.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/identity_assurance/controllers/identity-policies.controller.ts:31` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `identity_assurance.identity_verification_policies` | ESCRIBE | CREA | DIRECTA | IdentityPoliciesController.create → IdentityPoliciesService.createPolicy → IdentityVerificationPoliciesRepository.create | `src/modules/identity_assurance/repositories/identity-policies.repository.ts:89` |

### Cuerpo — DTO `CreatePolicyDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `policyCode` | `string` | Sí | longitud mínima 1; longitud máxima 100 | `@IsString()` `@MinLength(1)` `@MaxLength(100)` | Código único de la política | `src/modules/identity_assurance/dto/create-policy.dto.ts:25` |
| `subjectTypeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Concepto: tipo de sujeto | `src/modules/identity_assurance/dto/create-policy.dto.ts:32` |
| `transactionRiskConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Concepto: riesgo de la transacción | `src/modules/identity_assurance/dto/create-policy.dto.ts:42` |
| `requiredIdentityAssuranceLevelConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Concepto: IAL requerido (NIST 800-63) | `src/modules/identity_assurance/dto/create-policy.dto.ts:52` |
| `requiredAuthenticatorAssuranceLevelConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concepto: AAL requerido | `src/modules/identity_assurance/dto/create-policy.dto.ts:63` |
| `requiredFederationAssuranceLevelConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concepto: FAL requerido | `src/modules/identity_assurance/dto/create-policy.dto.ts:74` |
| `evidenceRequirementsJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Requisitos de evidencia (JSON) | `src/modules/identity_assurance/dto/create-policy.dto.ts:82` |
| `fraudControlsJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Controles de fraude / umbrales (JSON) | `src/modules/identity_assurance/dto/create-policy.dto.ts:90` |
| `versionNumber` | `number` | No | mínimo 1 | `@IsOptional()` `@IsInt()` `@Min(1)` | Número de versión de la política | `src/modules/identity_assurance/dto/create-policy.dto.ts:102` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "policyCode": "CODIGO_EJEMPLO",
  "subjectTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "transactionRiskConceptId": "00000000-0000-4000-8000-000000000001",
  "requiredIdentityAssuranceLevelConceptId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "policyCode": "CODIGO_EJEMPLO",
  "subjectTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "transactionRiskConceptId": "00000000-0000-4000-8000-000000000001",
  "requiredIdentityAssuranceLevelConceptId": "00000000-0000-4000-8000-000000000001",
  "requiredAuthenticatorAssuranceLevelConceptId": "00000000-0000-4000-8000-000000000001",
  "requiredFederationAssuranceLevelConceptId": "00000000-0000-4000-8000-000000000001",
  "evidenceRequirementsJson": {},
  "fraudControlsJson": {},
  "versionNumber": 1
}
```

</details>

### Respuesta — `Promise<PolicyResponseDto>` · DTO `PolicyResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/identity_assurance/dto/identity-responses.dto.ts:48` |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | sin fuente |
| `state` | `string` | Sí | — | — | Valor de state mantenido por la instancia. | sin fuente |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/identity_assurance.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/identity_assurance/controllers/identity-endpoints.controller.spec.ts:40` |

### Flujos

- src / modules / identity assurance — etapa `ctrl:IdentityPoliciesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 24. POST /internal/identity/checks/{id}/attempts

- **Origen:** CONTRATO
- **Nombre:** Registrar el intento del worker contra la autoridad externa
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IdentityWorkerController.recordAttempt` — `src/modules/identity_assurance/controllers/identity-worker.controller.ts:110`

### Qué es y para qué sirve (negocio)

Registrar el intento del worker contra la autoridad externa. Dentro del módulo (descripción del modelo, en inglés): «Verifies patients, practitioners, representatives and organization operators against authoritative ministries, civil registries, professional boards and government data platforms.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_27_identity_assurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /internal/identity/checks/{id}/attempts` la atiende `IdentityWorkerController.recordAttempt` (src/modules/identity_assurance/controllers/identity-worker.controller.ts:110). Exige sesión con alguno de los roles SYSTEM, SECURITY_ADMIN. Valida el cuerpo como `IdentityAssuranceRecordAttemptDto` (7 campos, 1 obligatorio). Delega en `IdentityChecksService.recordAttempt`. Crea filas en identity_assurance.identity_verification_attempts. Actualiza identity_assurance.identity_checks. Lee directory.tenant_memberships, identity_assurance.identity_checks, identity_assurance.identity_verification_attempts, identity_assurance.identity_verification_cases, profiles.jurisdiction_authorizations, profiles.person_account_links.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, SECURITY_ADMIN | `src/modules/identity_assurance/controllers/identity-worker.controller.ts:110` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/identity_assurance/controllers/identity-worker.controller.ts:110` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | IdentityWorkerController.recordAttempt → IdentityChecksService.recordAttempt → IdentityChecksService.loadCheck → IdentityCaseScope.findAuthorizedCase → IdentityCaseScope.subjectInTenant | `src/modules/identity_assurance/services/identity-case-scope.service.ts:230` |
| `identity_assurance.identity_checks` | ESCRIBE | ACTUALIZA | POR_TIPO | IdentityWorkerController.recordAttempt → IdentityChecksService.recordAttempt | `src/modules/identity_assurance/services/identity-checks.service.ts:261` |
| `identity_assurance.identity_checks` | LEE | LEE | DIRECTA | IdentityWorkerController.recordAttempt → IdentityChecksService.recordAttempt → IdentityChecksService.loadCheck → IdentityChecksRepository.findById | `src/modules/identity_assurance/repositories/identity-checks.repository.ts:141` |
| `identity_assurance.identity_verification_attempts` | ESCRIBE | CREA | DIRECTA | IdentityWorkerController.recordAttempt → IdentityChecksService.recordAttempt → IdentityVerificationAttemptsRepository.create | `src/modules/identity_assurance/repositories/identity-checks.repository.ts:343` |
| `identity_assurance.identity_verification_attempts` | LEE | LEE | DIRECTA | IdentityWorkerController.recordAttempt → IdentityChecksService.recordAttempt → IdentityVerificationAttemptsRepository.countByCase | `src/modules/identity_assurance/repositories/identity-checks.repository.ts:279` |
| `identity_assurance.identity_verification_cases` | LEE | LEE | DIRECTA | IdentityWorkerController.recordAttempt → IdentityChecksService.recordAttempt → IdentityChecksService.loadCheck → IdentityCaseScope.findAuthorizedCase → IdentityVerificationCasesRepository.findById | `src/modules/identity_assurance/repositories/identity-cases.repository.ts:64` |
| `profiles.jurisdiction_authorizations` | LEE | LEE | DIRECTA | IdentityWorkerController.recordAttempt → IdentityChecksService.recordAttempt → IdentityChecksService.loadCheck → IdentityCaseScope.findAuthorizedCase → IdentityCaseScope.subjectInTenant | `src/modules/identity_assurance/services/identity-case-scope.service.ts:208` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | IdentityWorkerController.recordAttempt → IdentityChecksService.recordAttempt → IdentityChecksService.loadCheck → IdentityCaseScope.findAuthorizedCase → IdentityCaseScope.subjectInTenant | `src/modules/identity_assurance/services/identity-case-scope.service.ts:221` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `IdentityAssuranceRecordAttemptDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `identityAuthorityEndpointId` | `string` | Sí | formato uuid | `@IsUUID()` | Endpoint de autoridad usado en el intento | `src/modules/identity_assurance/dto/record-attempt.dto.ts:25` |
| `outcome` | `string` | No | valores: SUCCESS, PENDING, FAILED | `@IsOptional()` `@IsIn(['SUCCESS', 'PENDING', 'FAILED'])` | Resultado técnico del intento | `src/modules/identity_assurance/dto/record-attempt.dto.ts:37` |
| `idempotencyKey` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Clave de idempotencia del intento | `src/modules/identity_assurance/dto/record-attempt.dto.ts:49` |
| `requestMessageId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Mensaje saliente correlacionado | `src/modules/identity_assurance/dto/record-attempt.dto.ts:60` |
| `responseMessageId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Mensaje entrante correlacionado | `src/modules/identity_assurance/dto/record-attempt.dto.ts:71` |
| `technicalErrorCode` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Código de error técnico | `src/modules/identity_assurance/dto/record-attempt.dto.ts:83` |
| `retryEligible` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | ¿Es elegible para reintento? | `src/modules/identity_assurance/dto/record-attempt.dto.ts:91` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "identityAuthorityEndpointId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "identityAuthorityEndpointId": "00000000-0000-4000-8000-000000000001",
  "outcome": "SUCCESS",
  "idempotencyKey": "valor-ejemplo",
  "requestMessageId": "00000000-0000-4000-8000-000000000001",
  "responseMessageId": "00000000-0000-4000-8000-000000000001",
  "technicalErrorCode": "CODIGO_EJEMPLO",
  "retryEligible": true
}
```

</details>

### Respuesta — `Promise<AttemptResponseDto>` · DTO `AttemptResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/identity_assurance/dto/identity-responses.dto.ts:120` |
| `attemptNumber` | `number` | Sí | — | — | Valor de attempt number mantenido por la instancia. | `src/modules/identity_assurance/dto/identity-responses.dto.ts:124` |
| `outcome` | `string` | Sí | formato uuid | — | Valor de outcome mantenido por la instancia. | `src/modules/identity_assurance/dto/identity-responses.dto.ts:128` |
| `checkStatus` | `string` | Sí | formato uuid | — | Valor de check status mantenido por la instancia. | `src/modules/identity_assurance/dto/identity-responses.dto.ts:132` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Check de identidad no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/identity_assurance.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/identity-verification-self-service.int-spec.ts:128` |

### Flujos

- src / modules / identity assurance — etapa `ctrl:IdentityWorkerController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 25. POST /internal/identity/checks/{id}/results

- **Origen:** CONTRATO
- **Nombre:** Registrar el veredicto que devolvió la autoridad externa
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IdentityWorkerController.recordResult` — `src/modules/identity_assurance/controllers/identity-worker.controller.ts:133`

### Qué es y para qué sirve (negocio)

Registrar el veredicto que devolvió la autoridad externa. Dentro del módulo (descripción del modelo, en inglés): «Verifies patients, practitioners, representatives and organization operators against authoritative ministries, civil registries, professional boards and government data platforms.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_27_identity_assurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /internal/identity/checks/{id}/results` la atiende `IdentityWorkerController.recordResult` (src/modules/identity_assurance/controllers/identity-worker.controller.ts:133). Exige sesión con alguno de los roles SYSTEM, SECURITY_ADMIN. Valida el cuerpo como `RecordResultDto` (4 campos, 1 obligatorio). Delega en `IdentityChecksService.recordResult`. Crea filas en audit.verified_badges_history, community.verified_badges, identity_assurance.identity_assertions, identity_assurance.identity_check_results. Actualiza community.public_profiles, community.verified_badges, directory.tenants, identity_assurance.identity_checks, identity_assurance.identity_verification_attempts, identity_assurance.identity_verification_cases, profiles.health_practitioner_profiles, profiles.jurisdiction_authorizations. Lee community.public_profiles, community.verified_badges, directory.tenant_memberships, directory.tenants, identity_assurance.identity_authority_endpoints, identity_assurance.identity_check_results, identity_assurance.identity_checks, identity_assurance.identity_verification_attempts y 4 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, SECURITY_ADMIN | `src/modules/identity_assurance/controllers/identity-worker.controller.ts:133` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/identity_assurance/controllers/identity-worker.controller.ts:133` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.verified_badges_history` | ESCRIBE | CREA | DIRECTA | IdentityWorkerController.recordResult → IdentityChecksService.recordResult → IdentityChecksService.settleCase → IdentityChecksService.verifyCase → IdentityVerificationEffectsService.applyVerified → IdentityVerificationEffectsService.activateLicense → CommunityVerificationService.applyVerified → VerifiedBadgesRepository.recordHistory | `src/modules/community/repositories/verified-badges.repository.ts:172` |
| `community.public_profiles` | ESCRIBE | ACTUALIZA | POR_TIPO | IdentityWorkerController.recordResult → IdentityChecksService.recordResult → IdentityChecksService.settleCase → IdentityChecksService.verifyCase → IdentityVerificationEffectsService.applyVerified → IdentityVerificationEffectsService.activateLicense → CommunityVerificationService.applyVerified | `src/modules/community/services/community-verification.service.ts:175` |
| `community.public_profiles` | LEE | LEE | DIRECTA | IdentityWorkerController.recordResult → IdentityChecksService.recordResult → IdentityChecksService.settleCase → IdentityChecksService.verifyCase → IdentityVerificationEffectsService.applyVerified → IdentityVerificationEffectsService.activateLicense → CommunityVerificationService.applyVerified → VerifiedBadgesRepository.findProfileByTarget | `src/modules/community/repositories/verified-badges.repository.ts:205` |
| `community.verified_badges` | ESCRIBE | ACTUALIZA | POR_TIPO | IdentityWorkerController.recordResult → IdentityChecksService.recordResult → IdentityChecksService.settleCase → IdentityChecksService.verifyCase → IdentityVerificationEffectsService.applyVerified → IdentityVerificationEffectsService.activateLicense → CommunityVerificationService.applyVerified → VerifiedBadgesRepository.grant | `src/modules/community/repositories/verified-badges.repository.ts:94` |
| `community.verified_badges` | ESCRIBE | CREA | DIRECTA | IdentityWorkerController.recordResult → IdentityChecksService.recordResult → IdentityChecksService.settleCase → IdentityChecksService.verifyCase → IdentityVerificationEffectsService.applyVerified → IdentityVerificationEffectsService.activateLicense → CommunityVerificationService.applyVerified → VerifiedBadgesRepository.grant | `src/modules/community/repositories/verified-badges.repository.ts:103` |
| `community.verified_badges` | LEE | LEE | DIRECTA | IdentityWorkerController.recordResult → IdentityChecksService.recordResult → IdentityChecksService.settleCase → IdentityChecksService.verifyCase → IdentityVerificationEffectsService.applyVerified → IdentityVerificationEffectsService.activateLicense → CommunityVerificationService.applyVerified → VerifiedBadgesRepository.findActive | `src/modules/community/repositories/verified-badges.repository.ts:61` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | IdentityWorkerController.recordResult → IdentityChecksService.recordResult → IdentityChecksService.loadCheck → IdentityCaseScope.findAuthorizedCase → IdentityCaseScope.subjectInTenant | `src/modules/identity_assurance/services/identity-case-scope.service.ts:230` |
| `directory.tenants` | ESCRIBE | ACTUALIZA | POR_TIPO | IdentityWorkerController.recordResult → IdentityChecksService.recordResult → IdentityChecksService.settleCase → IdentityChecksService.verifyCase → IdentityVerificationEffectsService.applyVerified → IdentityVerificationEffectsService.verifyTenant | `src/modules/identity_assurance/services/identity-verification-effects.service.ts:249` |
| `directory.tenants` | LEE | LEE | DIRECTA | IdentityWorkerController.recordResult → IdentityChecksService.recordResult → IdentityChecksService.settleCase → IdentityChecksService.verifyCase → IdentityVerificationEffectsService.applyVerified → IdentityVerificationEffectsService.verifyTenant → TenantsRepository.findById | `src/modules/directory/repositories/tenants.repository.ts:71` |
| `identity_assurance.identity_assertions` | ESCRIBE | CREA | DIRECTA | IdentityWorkerController.recordResult → IdentityChecksService.recordResult → IdentityChecksService.settleCase → IdentityChecksService.verifyCase → IdentityChecksService.issueAssertion → IdentityAssertionsRepository.create | `src/modules/identity_assurance/repositories/identity-assertions.repository.ts:171` |
| `identity_assurance.identity_authority_endpoints` | LEE | LEE | DIRECTA | IdentityWorkerController.recordResult → IdentityChecksService.recordResult → IdentityChecksService.settleCase → IdentityChecksService.verifyCase → IdentityChecksService.issueAssertion → IdentityAuthorityEndpointsRepository.findById | `src/modules/identity_assurance/repositories/identity-authorities.repository.ts:140` |
| `identity_assurance.identity_check_results` | ESCRIBE | CREA | DIRECTA | IdentityWorkerController.recordResult → IdentityChecksService.recordResult → IdentityCheckResultsRepository.create | `src/modules/identity_assurance/repositories/identity-checks.repository.ts:398` |
| `identity_assurance.identity_check_results` | LEE | LEE | DIRECTA | IdentityWorkerController.recordResult → IdentityChecksService.recordResult → IdentityCheckResultsRepository.findLatestByCheck | `src/modules/identity_assurance/repositories/identity-checks.repository.ts:383` |
| `identity_assurance.identity_checks` | ESCRIBE | ACTUALIZA | POR_TIPO | IdentityWorkerController.recordResult → IdentityChecksService.recordResult | `src/modules/identity_assurance/services/identity-checks.service.ts:319` |
| `identity_assurance.identity_checks` | LEE | LEE | DIRECTA | IdentityWorkerController.recordResult → IdentityChecksService.recordResult → IdentityChecksService.loadCheck → IdentityChecksRepository.findById | `src/modules/identity_assurance/repositories/identity-checks.repository.ts:141` |
| `identity_assurance.identity_verification_attempts` | ESCRIBE | ACTUALIZA | POR_TIPO | IdentityWorkerController.recordResult → IdentityChecksService.recordResult → IdentityChecksService.completeInFlightAttempt | `src/modules/identity_assurance/services/identity-checks.service.ts:368` |
| `identity_assurance.identity_verification_attempts` | LEE | LEE | DIRECTA | IdentityWorkerController.recordResult → IdentityChecksService.recordResult → IdentityVerificationAttemptsRepository.existsCompletedForCase | `src/modules/identity_assurance/repositories/identity-checks.repository.ts:289` |
| `identity_assurance.identity_verification_cases` | ESCRIBE | ACTUALIZA | POR_TIPO | IdentityWorkerController.recordResult → IdentityChecksService.recordResult → IdentityChecksService.settleCase | `src/modules/identity_assurance/services/identity-checks.service.ts:411` |
| `identity_assurance.identity_verification_cases` | LEE | LEE | DIRECTA | IdentityWorkerController.recordResult → IdentityChecksService.recordResult → IdentityChecksService.settleCase → IdentityVerificationCasesRepository.findById | `src/modules/identity_assurance/repositories/identity-cases.repository.ts:64` |
| `profiles.health_practitioner_profiles` | ESCRIBE | ACTUALIZA | POR_TIPO | IdentityWorkerController.recordResult → IdentityChecksService.recordResult → IdentityChecksService.settleCase → IdentityChecksService.verifyCase → IdentityVerificationEffectsService.applyVerified → IdentityVerificationEffectsService.activateLicense | `src/modules/identity_assurance/services/identity-verification-effects.service.ts:198` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | IdentityWorkerController.recordResult → IdentityChecksService.recordResult → IdentityChecksService.settleCase → IdentityChecksService.verifyCase → IdentityVerificationEffectsService.applyVerified → IdentityVerificationEffectsService.activateLicense → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.jurisdiction_authorizations` | ESCRIBE | ACTUALIZA | POR_TIPO | IdentityWorkerController.recordResult → IdentityChecksService.recordResult → IdentityChecksService.settleCase → IdentityChecksService.verifyCase → IdentityVerificationEffectsService.applyVerified → IdentityVerificationEffectsService.activateLicense | `src/modules/identity_assurance/services/identity-verification-effects.service.ts:188` |
| `profiles.jurisdiction_authorizations` | LEE | LEE | DIRECTA | IdentityWorkerController.recordResult → IdentityChecksService.recordResult → IdentityChecksService.loadCheck → IdentityCaseScope.findAuthorizedCase → IdentityCaseScope.subjectInTenant | `src/modules/identity_assurance/services/identity-case-scope.service.ts:208` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | IdentityWorkerController.recordResult → IdentityChecksService.recordResult → IdentityChecksService.loadCheck → IdentityCaseScope.findAuthorizedCase → IdentityCaseScope.subjectInTenant | `src/modules/identity_assurance/services/identity-case-scope.service.ts:221` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `RecordResultDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `result` | `string` | Sí | valores: MATCH, NO_MATCH | `@IsIn(['MATCH', 'NO_MATCH'])` | Veredicto del check | `src/modules/identity_assurance/dto/record-result.dto.ts:25` |
| `matchScore` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Puntaje de coincidencia (0..1) | `src/modules/identity_assurance/dto/record-result.dto.ts:36` |
| `discrepancyCodes` | `array<string>` | No | — | `@IsOptional()` `@IsArray()` `@IsString({ each: true })` | Códigos de discrepancia detectados | `src/modules/identity_assurance/dto/record-result.dto.ts:48` |
| `sourceResponseHash` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Hash de la respuesta fuente | `src/modules/identity_assurance/dto/record-result.dto.ts:60` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "result": "MATCH"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "result": "MATCH",
  "matchScore": "0.98",
  "discrepancyCodes": [
    "CODIGO_EJEMPLO"
  ],
  "sourceResponseHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
}
```

</details>

### Respuesta — `Promise<CheckResultResponseDto>` · DTO `CheckResultResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/identity_assurance/dto/identity-responses.dto.ts:140` |
| `resultVersion` | `number` | Sí | — | — | Valor de result version mantenido por la instancia. | `src/modules/identity_assurance/dto/identity-responses.dto.ts:144` |
| `result` | `string` | Sí | formato uuid | — | Valor de result mantenido por la instancia. | `src/modules/identity_assurance/dto/identity-responses.dto.ts:148` |
| `checkStatus` | `string` | Sí | formato uuid | — | Valor de check status mantenido por la instancia. | `src/modules/identity_assurance/dto/identity-responses.dto.ts:152` |
| `caseStatus` | `string` | No | formato uuid | — | Estado del caso si este resultado lo resolvió | `src/modules/identity_assurance/dto/identity-responses.dto.ts:160` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Check de identidad no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: No existe un intento completado para registrar resultado; PreconditionFailedException: No se pudo determinar la autoridad que verificó el caso |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/identity_assurance.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/identity-verification-self-service.int-spec.ts:147` |

### Flujos

- src / modules / identity assurance — etapa `ctrl:IdentityWorkerController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 26. GET /internal/identity/checks/dispatchable

- **Origen:** CONTRATO
- **Nombre:** Listar los checks que el worker debe atender en este tick
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IdentityWorkerController.listDispatchable` — `src/modules/identity_assurance/controllers/identity-worker.controller.ts:97`

### Qué es y para qué sirve (negocio)

Listar los checks que el worker debe atender en este tick. Dentro del módulo (descripción del modelo, en inglés): «Verifies patients, practitioners, representatives and organization operators against authoritative ministries, civil registries, professional boards and government data platforms.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_27_identity_assurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /internal/identity/checks/dispatchable` la atiende `IdentityWorkerController.listDispatchable` (src/modules/identity_assurance/controllers/identity-worker.controller.ts:97). Exige sesión con alguno de los roles SYSTEM, SECURITY_ADMIN. Delega en `IdentityChecksService.listDispatchable`. Lee directory.tenant_memberships, identity_assurance.identity_checks, identity_assurance.identity_verification_attempts, identity_assurance.identity_verification_cases, profiles.jurisdiction_authorizations, profiles.person_account_links.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, SECURITY_ADMIN | `src/modules/identity_assurance/controllers/identity-worker.controller.ts:97` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_QUERY | limit (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | IdentityWorkerController.listDispatchable → IdentityChecksService.listDispatchable → IdentityChecksService.filterChecksToTenant → IdentityCaseScope.filterToTenant → IdentityCaseScope.subjectInTenant | `src/modules/identity_assurance/services/identity-case-scope.service.ts:230` |
| `identity_assurance.identity_checks` | LEE | LEE | DIRECTA | IdentityWorkerController.listDispatchable → IdentityChecksService.listDispatchable → IdentityChecksRepository.findDispatchable | `src/modules/identity_assurance/repositories/identity-checks.repository.ts:260` |
| `identity_assurance.identity_verification_attempts` | LEE | LEE | DIRECTA | IdentityWorkerController.listDispatchable → IdentityChecksService.listDispatchable → IdentityVerificationAttemptsRepository.findLatestByCase | `src/modules/identity_assurance/repositories/identity-checks.repository.ts:325` |
| `identity_assurance.identity_verification_cases` | LEE | LEE | DIRECTA | IdentityWorkerController.listDispatchable → IdentityChecksService.listDispatchable → IdentityChecksService.filterChecksToTenant → IdentityVerificationCasesRepository.findById | `src/modules/identity_assurance/repositories/identity-cases.repository.ts:64` |
| `profiles.jurisdiction_authorizations` | LEE | LEE | DIRECTA | IdentityWorkerController.listDispatchable → IdentityChecksService.listDispatchable → IdentityChecksService.filterChecksToTenant → IdentityCaseScope.filterToTenant → IdentityCaseScope.subjectInTenant | `src/modules/identity_assurance/services/identity-case-scope.service.ts:208` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | IdentityWorkerController.listDispatchable → IdentityChecksService.listDispatchable → IdentityChecksService.filterChecksToTenant → IdentityCaseScope.filterToTenant → IdentityCaseScope.subjectInTenant | `src/modules/identity_assurance/services/identity-case-scope.service.ts:221` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `limit` | query | Sí | `number` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<DispatchableChecksResponseDto>` · DTO `DispatchableChecksResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `checks` | `array<DispatchableCheckDto>` | Sí | — | — | Valor de checks mantenido por la instancia. | `src/modules/identity_assurance/dto/dispatchable-check.dto.ts:58` |
| `checks[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/identity_assurance/dto/dispatchable-check.dto.ts:12` |
| `checks[].identityVerificationCaseId` | `string` | Sí | formato uuid | — | Identificador asociado a identity verification case. | `src/modules/identity_assurance/dto/dispatchable-check.dto.ts:18` |
| `checks[].checkTypeConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a check type concept. | `src/modules/identity_assurance/dto/dispatchable-check.dto.ts:24` |
| `checks[].checkTypeCode` | `string` | Sí | — | — | Código legible del tipo de comprobación, tal como lo espera la autoridad externa (`IDENTITY_CARD`, `MEDICAL_LICENSE`, `INSTITUTION_DOCUMENT`). Se resuelve aquí y no en el worker para que el worker no tenga que conocer el catálogo de conceptos: su trabajo es hablar con el proveedor, no traducir identificadores internos. | `src/modules/identity_assurance/dto/dispatchable-check.dto.ts:35` |
| `checks[].identityAuthorityEndpointId` | `string` | Sí | formato uuid | — | Identificador asociado al endpoint de autoridad que atiende este check. | `src/modules/identity_assurance/dto/dispatchable-check.dto.ts:41` |
| `checks[].awaitingVerdict` | `boolean` | Sí | — | — | true si ya hay un intento en curso pendiente de veredicto | `src/modules/identity_assurance/dto/dispatchable-check.dto.ts:49` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/identity_assurance.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / identity assurance — etapa `ctrl:IdentityWorkerController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 27. POST /internal/identity/evidence/lifecycle-scan

- **Origen:** CONTRATO
- **Nombre:** Evaluate configured evidence lifecycle; destructive runtime remains blocked
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Borra filas
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IdentityWorkerController.lifecycleScan` — `src/modules/identity_assurance/controllers/identity-worker.controller.ts:79`

### Qué es y para qué sirve (negocio)

Evaluate configured evidence lifecycle; destructive runtime remains blocked. Dentro del módulo (descripción del modelo, en inglés): «Verifies patients, practitioners, representatives and organization operators against authoritative ministries, civil registries, professional boards and government data platforms.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_27_identity_assurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /internal/identity/evidence/lifecycle-scan` la atiende `IdentityWorkerController.lifecycleScan` (src/modules/identity_assurance/controllers/identity-worker.controller.ts:79). Exige sesión con alguno de los roles SYSTEM. Valida el cuerpo como `EvidenceLifecycleScanDto` (0 campos, 0 obligatorios). Delega en `IdentityEvidenceLifecycleService.scan`. Crea filas en messaging.queued_jobs, system_ops.record_revisions. Actualiza common.files, identity_assurance.identity_evidence_records. Borra de common.file_derivatives, common.file_versions, common.files, identity_assurance.identity_evidence_records. Lee audio_assets.audio_assets, common.file_derivatives, common.file_versions, common.files, consent.consents, cross_store_consistency.deletion_targets, directory.tenant_memberships, directory.tenants y 20 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM | `src/modules/identity_assurance/controllers/identity-worker.controller.ts:79` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audio_assets.audio_assets` | LEE | LEE | POR_SQL | IdentityWorkerController.lifecycleScan → IdentityEvidenceLifecycleService.scan → IdentityEvidenceLifecycleService.executeRule → IdentityEvidenceLifecycleService.execute → StorageReferenceRepository.snapshot | `src/common/storage/storage-reference.repository.ts:76` |
| `common.file_derivatives` | BORRA | BORRA | POR_SQL | IdentityWorkerController.lifecycleScan → IdentityEvidenceLifecycleService.scan → IdentityEvidenceLifecycleService.executeRule → IdentityEvidenceLifecycleService.execute → IdentityEvidenceDispositionExecutor.execute → IdentityEvidenceDispositionRepository.apply | `src/modules/identity_assurance/repositories/identity-evidence-disposition.repository.ts:142` |
| `common.file_derivatives` | LEE | LEE | DIRECTA | IdentityWorkerController.lifecycleScan → IdentityEvidenceLifecycleService.scan → IdentityEvidenceLifecycleService.executeRule → IdentityEvidenceLifecycleService.execute → IdentityEvidenceLifecycleRepository.graph | `src/modules/identity_assurance/repositories/identity-evidence-lifecycle.repository.ts:161` |
| `common.file_versions` | BORRA | BORRA | POR_SQL | IdentityWorkerController.lifecycleScan → IdentityEvidenceLifecycleService.scan → IdentityEvidenceLifecycleService.executeRule → IdentityEvidenceLifecycleService.execute → IdentityEvidenceDispositionExecutor.execute → IdentityEvidenceDispositionRepository.apply | `src/modules/identity_assurance/repositories/identity-evidence-disposition.repository.ts:147` |
| `common.file_versions` | LEE | LEE | DIRECTA | IdentityWorkerController.lifecycleScan → IdentityEvidenceLifecycleService.scan → IdentityEvidenceLifecycleService.executeRule → IdentityEvidenceLifecycleService.execute → IdentityEvidenceLifecycleRepository.graph | `src/modules/identity_assurance/repositories/identity-evidence-lifecycle.repository.ts:138` |
| `common.files` | BORRA | BORRA | POR_SQL | IdentityWorkerController.lifecycleScan → IdentityEvidenceLifecycleService.scan → IdentityEvidenceLifecycleService.executeRule → IdentityEvidenceLifecycleService.execute → IdentityEvidenceDispositionExecutor.execute → IdentityEvidenceDispositionRepository.apply | `src/modules/identity_assurance/repositories/identity-evidence-disposition.repository.ts:151` |
| `common.files` | ESCRIBE | ACTUALIZA | POR_SQL | IdentityWorkerController.lifecycleScan → IdentityEvidenceLifecycleService.scan → IdentityEvidenceLifecycleService.executeRule → IdentityEvidenceLifecycleService.execute → IdentityEvidenceDispositionExecutor.execute → IdentityEvidenceDispositionRepository.apply | `src/modules/identity_assurance/repositories/identity-evidence-disposition.repository.ts:129` |
| `common.files` | LEE | LEE | DIRECTA | IdentityWorkerController.lifecycleScan → IdentityEvidenceLifecycleService.scan → IdentityEvidenceLifecycleService.executeRule → IdentityEvidenceLifecycleService.execute → IdentityEvidenceLifecycleRepository.graph | `src/modules/identity_assurance/repositories/identity-evidence-lifecycle.repository.ts:176` |
| `consent.consents` | LEE | LEE | DIRECTA | IdentityWorkerController.lifecycleScan → IdentityEvidenceLifecycleService.scan → IdentityEvidenceLifecycleService.executeRule → IdentityEvidenceLifecycleService.execute → IdentityEvidenceLifecycleRepository.graph | `src/modules/identity_assurance/repositories/identity-evidence-lifecycle.repository.ts:287` |
| `cross_store_consistency.deletion_targets` | LEE | LEE | POR_SQL | IdentityWorkerController.lifecycleScan → IdentityEvidenceLifecycleService.scan → IdentityEvidenceLifecycleService.executeRule → IdentityEvidenceLifecycleService.execute → StorageReferenceRepository.snapshot | `src/common/storage/storage-reference.repository.ts:93` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | IdentityWorkerController.lifecycleScan → IdentityEvidenceLifecycleService.scan → IdentityEvidenceLifecycleService.executeRule → IdentityEvidenceLifecycleService.execute → IdentityEvidenceLifecycleRepository.graph | `src/modules/identity_assurance/repositories/identity-evidence-lifecycle.repository.ts:258` |
| `directory.tenants` | LEE | LEE | DIRECTA | IdentityWorkerController.lifecycleScan → IdentityEvidenceLifecycleService.scan → IdentityEvidenceLifecycleService.executeRule → IdentityEvidenceLifecycleService.execute → IdentityEvidenceLifecycleRepository.graph | `src/modules/identity_assurance/repositories/identity-evidence-lifecycle.repository.ts:221` |
| `identity_assurance.identity_evidence_records` | BORRA | BORRA | POR_SQL | IdentityWorkerController.lifecycleScan → IdentityEvidenceLifecycleService.scan → IdentityEvidenceLifecycleService.executeRule → IdentityEvidenceLifecycleService.execute → IdentityEvidenceDispositionExecutor.execute → IdentityEvidenceDispositionRepository.apply | `src/modules/identity_assurance/repositories/identity-evidence-disposition.repository.ts:124` |
| `identity_assurance.identity_evidence_records` | ESCRIBE | ACTUALIZA | POR_SQL | IdentityWorkerController.lifecycleScan → IdentityEvidenceLifecycleService.scan → IdentityEvidenceLifecycleService.executeRule → IdentityEvidenceLifecycleService.execute → IdentityEvidenceDispositionExecutor.execute → IdentityEvidenceDispositionRepository.apply | `src/modules/identity_assurance/repositories/identity-evidence-disposition.repository.ts:67` |
| `identity_assurance.identity_evidence_records` | LEE | LEE | DIRECTA | IdentityWorkerController.lifecycleScan → IdentityEvidenceLifecycleService.scan | `src/modules/identity_assurance/services/identity-evidence-lifecycle.service.ts:213` |
| `identity_assurance.identity_verification_attempts` | LEE | LEE | POR_SQL | IdentityWorkerController.lifecycleScan → IdentityEvidenceLifecycleService.scan → IdentityEvidenceLifecycleService.executeRule → IdentityEvidenceLifecycleService.execute → StorageReferenceRepository.snapshot | `src/common/storage/storage-reference.repository.ts:97` |
| `identity_assurance.identity_verification_cases` | LEE | LEE | DIRECTA | IdentityWorkerController.lifecycleScan → IdentityEvidenceLifecycleService.scan → IdentityEvidenceLifecycleService.executeRule → IdentityEvidenceLifecycleService.execute → IdentityEvidenceLifecycleRepository.graph | `src/modules/identity_assurance/repositories/identity-evidence-lifecycle.repository.ts:118` |
| `messaging.message_queues` | LEE | LEE | DIRECTA | IdentityWorkerController.lifecycleScan → IdentityEvidenceLifecycleService.scan → IdentityEvidenceLifecycleService.executeRule → IdentityEvidenceLifecycleService.execute → IdentityEvidenceDispositionExecutor.execute → IdentityEvidenceDispositionRepository.apply → StorageLifecycleCoordinator.preparePurgeRetirement → QueuesRepository.findQueueByCode | `src/modules/messaging/repositories/queues.repository.ts:77` |
| `messaging.queued_jobs` | ESCRIBE | CREA | DIRECTA | IdentityWorkerController.lifecycleScan → IdentityEvidenceLifecycleService.scan → IdentityEvidenceLifecycleService.executeRule → IdentityEvidenceLifecycleService.execute → IdentityEvidenceDispositionExecutor.execute → IdentityEvidenceDispositionRepository.apply → StorageLifecycleCoordinator.preparePurgeRetirement → QueuesRepository.createJob | `src/modules/messaging/repositories/queues.repository.ts:101` |
| `messaging.queued_jobs` | LEE | LEE | DIRECTA | IdentityWorkerController.lifecycleScan → IdentityEvidenceLifecycleService.scan → IdentityEvidenceLifecycleService.executeRule → IdentityEvidenceLifecycleService.execute → StorageLifecycleCoordinator.assertNoContender → QueuesRepository.findStorageIntents | `src/modules/messaging/repositories/queues.repository.ts:62` |
| `object_storage.multipart_uploads` | LEE | LEE | POR_SQL | IdentityWorkerController.lifecycleScan → IdentityEvidenceLifecycleService.scan → IdentityEvidenceLifecycleService.executeRule → IdentityEvidenceLifecycleService.execute → StorageReferenceRepository.snapshot | `src/common/storage/storage-reference.repository.ts:97` |
| `object_storage.object_legal_holds` | LEE | LEE | POR_SQL | IdentityWorkerController.lifecycleScan → IdentityEvidenceLifecycleService.scan → IdentityEvidenceLifecycleService.executeRule → IdentityEvidenceLifecycleService.execute → IdentityEvidenceHoldResolver.resolveWithObjects | `src/modules/system_ops/services/identity-evidence-hold-resolver.service.ts:65` |
| `object_storage.object_locations` | LEE | LEE | POR_SQL | IdentityWorkerController.lifecycleScan → IdentityEvidenceLifecycleService.scan → IdentityEvidenceLifecycleService.executeRule → IdentityEvidenceLifecycleService.execute → IdentityEvidenceHoldResolver.resolveWithObjects | `src/modules/system_ops/services/identity-evidence-hold-resolver.service.ts:65` |
| `object_storage.object_retention_locks` | LEE | LEE | POR_SQL | IdentityWorkerController.lifecycleScan → IdentityEvidenceLifecycleService.scan → IdentityEvidenceLifecycleService.executeRule → IdentityEvidenceLifecycleService.execute → IdentityEvidenceHoldResolver.resolveWithObjects | `src/modules/system_ops/services/identity-evidence-hold-resolver.service.ts:65` |
| `object_storage.object_versions` | LEE | LEE | POR_SQL | IdentityWorkerController.lifecycleScan → IdentityEvidenceLifecycleService.scan → IdentityEvidenceLifecycleService.executeRule → IdentityEvidenceLifecycleService.execute → IdentityEvidenceHoldResolver.resolveWithObjects | `src/modules/system_ops/services/identity-evidence-hold-resolver.service.ts:65` |
| `profiles.jurisdiction_authorizations` | LEE | LEE | DIRECTA | IdentityWorkerController.lifecycleScan → IdentityEvidenceLifecycleService.scan → IdentityEvidenceLifecycleService.executeRule → IdentityEvidenceLifecycleService.execute → IdentityEvidenceLifecycleRepository.graph | `src/modules/identity_assurance/repositories/identity-evidence-lifecycle.repository.ts:196` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | IdentityWorkerController.lifecycleScan → IdentityEvidenceLifecycleService.scan → IdentityEvidenceLifecycleService.executeRule → IdentityEvidenceLifecycleService.execute → IdentityEvidenceLifecycleRepository.graph | `src/modules/identity_assurance/repositories/identity-evidence-lifecycle.repository.ts:242` |
| `profiles.persons` | LEE | LEE | DIRECTA | IdentityWorkerController.lifecycleScan → IdentityEvidenceLifecycleService.scan → IdentityEvidenceLifecycleService.executeRule → IdentityEvidenceLifecycleService.execute → IdentityEvidenceLifecycleRepository.graph | `src/modules/identity_assurance/repositories/identity-evidence-lifecycle.repository.ts:235` |
| `system_ops.anonymization_rules` | LEE | LEE | DIRECTA | IdentityWorkerController.lifecycleScan → IdentityEvidenceLifecycleService.scan → IdentityEvidenceLifecycleService.executeRule → IdentityEvidenceLifecycleService.execute → IdentityLifecycleConfigResolver.resolve → GovernanceRepository.findAnonymizationRuleById | `src/modules/system_ops/repositories/governance.repository.ts:31` |
| `system_ops.entity_registry` | LEE | LEE | DIRECTA | IdentityWorkerController.lifecycleScan → IdentityEvidenceLifecycleService.scan → IdentityEvidenceLifecycleService.executeRule → IdentityEvidenceLifecycleService.execute → IdentityLifecycleConfigResolver.resolve | `src/modules/identity_assurance/identity-evidence-lifecycle.config.ts:160` |
| `system_ops.field_registry` | LEE | LEE | DIRECTA | IdentityWorkerController.lifecycleScan → IdentityEvidenceLifecycleService.scan → IdentityEvidenceLifecycleService.executeRule → IdentityEvidenceLifecycleService.execute → IdentityLifecycleConfigResolver.resolve → GovernanceRepository.findFieldById | `src/modules/system_ops/repositories/governance.repository.ts:259` |
| `system_ops.legal_holds` | LEE | LEE | DIRECTA | IdentityWorkerController.lifecycleScan → IdentityEvidenceLifecycleService.scan → IdentityEvidenceLifecycleService.executeRule → IdentityEvidenceLifecycleService.execute → IdentityEvidenceHoldResolver.resolveWithObjects → IdentityEvidenceHoldResolver.resolve → LegalHoldRepository.findForLifecycleGraph | `src/modules/system_ops/repositories/legal-hold.repository.ts:17` |
| `system_ops.record_revisions` | ESCRIBE | CREA | DIRECTA | IdentityWorkerController.lifecycleScan → IdentityEvidenceLifecycleService.scan → IdentityEvidenceLifecycleService.executeRule → IdentityEvidenceLifecycleService.execute → IdentityEvidenceDispositionExecutor.execute → RetentionExecutionRepository.createRevision | `src/modules/system_ops/repositories/retention-execution.repository.ts:88` |
| `system_ops.record_revisions` | LEE | LEE | DIRECTA | IdentityWorkerController.lifecycleScan → IdentityEvidenceLifecycleService.scan → IdentityEvidenceLifecycleService.executeRule → IdentityEvidenceLifecycleService.execute → IdentityEvidenceDispositionExecutor.execute | `src/modules/identity_assurance/services/identity-evidence-disposition.executor.ts:63` |
| `system_ops.retention_policies` | LEE | LEE | DIRECTA | IdentityWorkerController.lifecycleScan → IdentityEvidenceLifecycleService.scan → IdentityEvidenceLifecycleService.executeRule → IdentityEvidenceLifecycleService.execute → IdentityLifecycleConfigResolver.resolve → GovernanceRepository.findRetentionPolicyByCode | `src/modules/system_ops/repositories/governance.repository.ts:419` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | IdentityWorkerController.lifecycleScan → IdentityEvidenceLifecycleService.scan | `src/modules/identity_assurance/services/identity-evidence-lifecycle.service.ts:204` |

### Cuerpo — DTO `EvidenceLifecycleScanDto` · `application/json`

_El DTO no declara campos documentables, o no se pudo leer._

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

### Respuesta — `no declarado`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | StorageLifecycleDenied: LIFECYCLE_WIRING_MISSING; StorageLifecycleDenied: MISSING_CONFIGURATION; StorageLifecycleDenied: MISSING_OR_DUPLICATE_BINDING; StorageLifecycleDenied: CONFIGURATION_INVALID; StorageLifecycleDenied: REGISTRY_BINDING_INVALID; StorageLifecycleDenied: RETENTION_POLICY_INVALID; StorageLifecycleDenied: POLICY_DISPOSITION_MISMATCH; StorageLifecycleDenied: OPERATION_NOT_AUTHORIZED; StorageLifecycleDenied: DUPLICATE_FIELD_RULE; StorageLifecycleDenied: FIELD_RULE_BINDING_INVALID; StorageLifecycleDenied: FIELD_OPERATION_UNSUPPORTED; StorageLifecycleDenied: ANONYMIZATION_RULES_MISSING; StorageLifecycleDenied: PURGE_METADATA_RULE_MISSING; StorageLifecycleDenied: {identity.reasonCode}; StorageLifecycleDenied: TRANSACTION_REQUIRED; StorageLifecycleDenied: PHYSICAL_IDENTITY_UNKNOWN; StorageLifecycleDenied: EVIDENCE_NOT_FOUND; StorageLifecycleDenied: CASE_UNKNOWN; StorageLifecycleDenied: OWNER_UNKNOWN; StorageLifecycleDenied: SUBJECT_TYPE_UNKNOWN; StorageLifecycleDenied: TENANT_MISMATCH; StorageLifecycleDenied: OWNER_TENANT_UNPROVEN; StorageLifecycleDenied: TENANT_UNKNOWN; StorageLifecycleDenied: SUBJECT_UNKNOWN; StorageLifecycleDenied: TENANT_AMBIGUOUS; StorageLifecycleDenied: FILE_GRAPH_UNKNOWN; StorageLifecycleDenied: CROSS_TENANT_OR_OWNER_FILE; StorageLifecycleDenied: CURRENT_VERSION_UNKNOWN; StorageLifecycleDenied: CONSENT_OWNERSHIP_UNKNOWN; StorageLifecycleDenied: EXTERNAL_REFERENCE_UNKNOWN; StorageLifecycleDenied: PHYSICAL_METADATA_CONFLICT; StorageLifecycleDenied: PRODUCER_OR_PURGE_IN_FLIGHT; StorageLifecycleDenied: GLOBAL_REFERENCE_VISIBILITY_UNPROVEN; StorageLifecycleDenied: REFERENCE_STATE_UNKNOWN; StorageLifecycleDenied: REFERENCE_CATALOG_UNKNOWN |

El árbol de decisión completo está en [flujos](../flujos/identity_assurance.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / identity assurance — etapa `ctrl:IdentityWorkerController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 28. POST /internal/identity/evidence/storage-purge-review

- **Origen:** CONTRATO
- **Nombre:** Recheck retired evidence objects; never grants physical delete
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IdentityWorkerController.storagePurgeReview` — `src/modules/identity_assurance/controllers/identity-worker.controller.ts:63`

### Qué es y para qué sirve (negocio)

Recheck retired evidence objects; never grants physical delete. Dentro del módulo (descripción del modelo, en inglés): «Verifies patients, practitioners, representatives and organization operators against authoritative ministries, civil registries, professional boards and government data platforms.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_27_identity_assurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /internal/identity/evidence/storage-purge-review` la atiende `IdentityWorkerController.storagePurgeReview` (src/modules/identity_assurance/controllers/identity-worker.controller.ts:63). Exige sesión con alguno de los roles SYSTEM. Delega en `IdentityEvidenceStoragePurgeService.review`. Crea filas en system_ops.record_revisions. Actualiza messaging.queued_jobs. Lee audio_assets.audio_assets, common.file_versions, cross_store_consistency.deletion_targets, identity_assurance.identity_evidence_records, identity_assurance.identity_verification_attempts, identity_assurance.identity_verification_cases, messaging.queued_jobs, object_storage.multipart_uploads y 11 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM | `src/modules/identity_assurance/controllers/identity-worker.controller.ts:63` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audio_assets.audio_assets` | LEE | LEE | POR_SQL | IdentityWorkerController.storagePurgeReview → IdentityEvidenceStoragePurgeService.review → StorageReferenceResolver.resolve → StorageReferenceRepository.snapshot | `src/common/storage/storage-reference.repository.ts:76` |
| `common.file_versions` | LEE | LEE | POR_SQL | IdentityWorkerController.storagePurgeReview → IdentityEvidenceStoragePurgeService.review → StorageReferenceResolver.resolve → StorageReferenceRepository.snapshot | `src/common/storage/storage-reference.repository.ts:70` |
| `cross_store_consistency.deletion_targets` | LEE | LEE | POR_SQL | IdentityWorkerController.storagePurgeReview → IdentityEvidenceStoragePurgeService.review → StorageReferenceResolver.resolve → StorageReferenceRepository.snapshot | `src/common/storage/storage-reference.repository.ts:93` |
| `identity_assurance.identity_evidence_records` | LEE | LEE | POR_SQL | IdentityWorkerController.storagePurgeReview → IdentityEvidenceStoragePurgeService.review → StorageReferenceResolver.resolve → StorageReferenceRepository.snapshot | `src/common/storage/storage-reference.repository.ts:97` |
| `identity_assurance.identity_verification_attempts` | LEE | LEE | POR_SQL | IdentityWorkerController.storagePurgeReview → IdentityEvidenceStoragePurgeService.review → StorageReferenceResolver.resolve → StorageReferenceRepository.snapshot | `src/common/storage/storage-reference.repository.ts:97` |
| `identity_assurance.identity_verification_cases` | LEE | LEE | DIRECTA | IdentityWorkerController.storagePurgeReview → IdentityEvidenceStoragePurgeService.review | `src/modules/identity_assurance/services/identity-evidence-storage-purge.service.ts:129` |
| `messaging.queued_jobs` | ESCRIBE | ACTUALIZA | POR_TIPO | IdentityWorkerController.storagePurgeReview → IdentityEvidenceStoragePurgeService.review → StorageLifecycleCoordinator.dispatchPurge | `src/common/storage/storage-lifecycle-coordinator.service.ts:469` |
| `messaging.queued_jobs` | LEE | LEE | DIRECTA | IdentityWorkerController.storagePurgeReview → IdentityEvidenceStoragePurgeService.review → StorageLifecycleCoordinator.pendingPurges → QueuesRepository.findStorageIntents | `src/modules/messaging/repositories/queues.repository.ts:62` |
| `object_storage.multipart_uploads` | LEE | LEE | POR_SQL | IdentityWorkerController.storagePurgeReview → IdentityEvidenceStoragePurgeService.review → StorageReferenceResolver.resolve → StorageReferenceRepository.snapshot | `src/common/storage/storage-reference.repository.ts:97` |
| `object_storage.object_legal_holds` | LEE | LEE | POR_SQL | IdentityWorkerController.storagePurgeReview → IdentityEvidenceStoragePurgeService.review → IdentityEvidenceHoldResolver.resolveWithObjects | `src/modules/system_ops/services/identity-evidence-hold-resolver.service.ts:65` |
| `object_storage.object_locations` | LEE | LEE | POR_SQL | IdentityWorkerController.storagePurgeReview → IdentityEvidenceStoragePurgeService.review → IdentityEvidenceHoldResolver.resolveWithObjects | `src/modules/system_ops/services/identity-evidence-hold-resolver.service.ts:65` |
| `object_storage.object_retention_locks` | LEE | LEE | POR_SQL | IdentityWorkerController.storagePurgeReview → IdentityEvidenceStoragePurgeService.review → IdentityEvidenceHoldResolver.resolveWithObjects | `src/modules/system_ops/services/identity-evidence-hold-resolver.service.ts:65` |
| `object_storage.object_versions` | LEE | LEE | POR_SQL | IdentityWorkerController.storagePurgeReview → IdentityEvidenceStoragePurgeService.review → IdentityEvidenceHoldResolver.resolveWithObjects | `src/modules/system_ops/services/identity-evidence-hold-resolver.service.ts:65` |
| `system_ops.anonymization_rules` | LEE | LEE | DIRECTA | IdentityWorkerController.storagePurgeReview → IdentityEvidenceStoragePurgeService.review → IdentityLifecycleConfigResolver.resolve → GovernanceRepository.findAnonymizationRuleById | `src/modules/system_ops/repositories/governance.repository.ts:31` |
| `system_ops.entity_registry` | LEE | LEE | DIRECTA | IdentityWorkerController.storagePurgeReview → IdentityEvidenceStoragePurgeService.review → IdentityLifecycleConfigResolver.resolve | `src/modules/identity_assurance/identity-evidence-lifecycle.config.ts:160` |
| `system_ops.field_registry` | LEE | LEE | DIRECTA | IdentityWorkerController.storagePurgeReview → IdentityEvidenceStoragePurgeService.review → IdentityLifecycleConfigResolver.resolve → GovernanceRepository.findFieldById | `src/modules/system_ops/repositories/governance.repository.ts:259` |
| `system_ops.legal_holds` | LEE | LEE | DIRECTA | IdentityWorkerController.storagePurgeReview → IdentityEvidenceStoragePurgeService.review → IdentityEvidenceHoldResolver.resolveWithObjects → IdentityEvidenceHoldResolver.resolve → LegalHoldRepository.findForLifecycleGraph | `src/modules/system_ops/repositories/legal-hold.repository.ts:17` |
| `system_ops.record_revisions` | ESCRIBE | CREA | DIRECTA | IdentityWorkerController.storagePurgeReview → IdentityEvidenceStoragePurgeService.review → RetentionExecutionRepository.createRevision | `src/modules/system_ops/repositories/retention-execution.repository.ts:88` |
| `system_ops.record_revisions` | LEE | LEE | DIRECTA | IdentityWorkerController.storagePurgeReview → IdentityEvidenceStoragePurgeService.review | `src/modules/identity_assurance/services/identity-evidence-storage-purge.service.ts:143` |
| `system_ops.retention_policies` | LEE | LEE | DIRECTA | IdentityWorkerController.storagePurgeReview → IdentityEvidenceStoragePurgeService.review → IdentityLifecycleConfigResolver.resolve → GovernanceRepository.findRetentionPolicyByCode | `src/modules/system_ops/repositories/governance.repository.ts:419` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | IdentityWorkerController.storagePurgeReview → IdentityEvidenceStoragePurgeService.review → IdentityLifecycleConfigResolver.resolve | `src/modules/identity_assurance/identity-evidence-lifecycle.config.ts:184` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `no declarado`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: La URI no pertenece al almacenamiento local; ResourceNotFoundException: La URI de almacenamiento local está mal formada; ResourceNotFoundException: La URI no pertenece al bucket configurado; ResourceNotFoundException: La URI S3 está mal formada o fuera del prefijo permitido |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | StorageLifecycleDenied: LIFECYCLE_WIRING_MISSING; StorageLifecycleDenied: PURGE_INTENT_UNKNOWN; StorageLifecycleDenied: TRANSACTION_REQUIRED; StorageLifecycleDenied: GLOBAL_RESERVATION_VISIBILITY_UNPROVEN; StorageLifecycleDenied: PHYSICAL_IDENTITY_UNKNOWN; StorageLifecycleDenied: INTENT_ENVELOPE_UNKNOWN; StorageLifecycleDenied: DELETE_ATTEMPT_CHANGED; StorageLifecycleDenied: PRODUCER_OR_PURGE_IN_FLIGHT; StorageLifecycleDenied: PURGE_CONTEXT_UNKNOWN; StorageLifecycleDenied: PURGE_HOLD_COVERAGE_UNKNOWN; StorageLifecycleDenied: CUTOFF_UNKNOWN; StorageLifecycleDenied: MISSING_CONFIGURATION; StorageLifecycleDenied: MISSING_OR_DUPLICATE_BINDING; StorageLifecycleDenied: CONFIGURATION_INVALID; StorageLifecycleDenied: REGISTRY_BINDING_INVALID; StorageLifecycleDenied: RETENTION_POLICY_INVALID; StorageLifecycleDenied: POLICY_DISPOSITION_MISMATCH; StorageLifecycleDenied: OPERATION_NOT_AUTHORIZED; StorageLifecycleDenied: DUPLICATE_FIELD_RULE; StorageLifecycleDenied: FIELD_RULE_BINDING_INVALID; StorageLifecycleDenied: FIELD_OPERATION_UNSUPPORTED; StorageLifecycleDenied: ANONYMIZATION_RULES_MISSING; StorageLifecycleDenied: PURGE_METADATA_RULE_MISSING; StorageLifecycleDenied: PURGE_POLICY_CHANGED; StorageLifecycleDenied: CASE_OR_OWNER_CHANGED; StorageLifecycleDenied: RETIREMENT_UNPROVEN; StorageLifecycleDenied: LEGAL_HOLD_ACTIVE_OR_UNKNOWN; StorageLifecycleDenied: GLOBAL_REFERENCE_VISIBILITY_UNPROVEN; StorageLifecycleDenied: REFERENCE_STATE_UNKNOWN; StorageLifecycleDenied: REFERENCE_CATALOG_UNKNOWN; StorageLifecycleDenied: REFERENCES_BLOCKED_OR_UNKNOWN |

El árbol de decisión completo está en [flujos](../flujos/identity_assurance.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / identity assurance — etapa `ctrl:IdentityWorkerController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

