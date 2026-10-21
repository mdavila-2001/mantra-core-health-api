<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `identity_assurance`

- **Bloque:** Identidad y Seguridad (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)
- **Operaciones:** 24 (24 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 4 · MEDIO 16 · BAJO 4
- **Tablas distintas que tocan:** 19
- **Respuestas de error y detalle contractual:** `openapi/endpoints/identity-assurance.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | POST | `/identity/assertions/{id}/revoke` | Revocar una aserción de identidad | MEDIO | 11 | SECURITY_ADMIN |
| 2 | POST | `/identity/authorities` | Registrar una autoridad de identidad | MEDIO | 1 | SECURITY_ADMIN |
| 3 | POST | `/identity/authorities/{id}/endpoints` | Publicar un endpoint de verificación de la autoridad | MEDIO | 2 | SECURITY_ADMIN |
| 4 | POST | `/identity/checks/{id}/attempts` | Ejecutar un intento contra la autoridad externa (idempotente) | MEDIO | 4 | SECURITY_ADMIN |
| 5 | POST | `/identity/checks/{id}/results` | Registrar el resultado inmutable del check (con supersede) | MEDIO | 22 | SECURITY_ADMIN |
| 6 | POST | `/identity/manual-review/{id}/decision` | Resolver una revisión manual (decisión) | MEDIO | 25 | SECURITY_ADMIN |
| 7 | POST | `/identity/me/identity-verification` | Solicitar la verificación de la propia identidad (paciente) | ALTO | 5 | sesión (sin roles) |
| 8 | POST | `/identity/me/practitioner/identity-verification` | Solicitar la verificación de la propia identidad (profesional) | ALTO | 6 | sesión (sin roles) |
| 9 | POST | `/identity/me/practitioner/license-verification` | Solicitar la verificación de la propia matrícula | ALTO | 7 | sesión (sin roles) |
| 10 | POST | `/identity/me/tenants/{tenantId}/verification` | Solicitar la verificación de una institución propia | ALTO | 5 | sesión (sin roles) |
| 11 | GET | `/identity/me/verification-cases` | Listar los casos de verificación propios | BAJO | 3 | sesión (sin roles) |
| 12 | GET | `/identity/me/verification-cases/{caseId}` | Consultar el estado de un caso propio | BAJO | 4 | sesión (sin roles) |
| 13 | GET | `/identity/verification-cases` | Listar los casos que esperan revisión | BAJO | 1 | SECURITY_ADMIN |
| 14 | POST | `/identity/verification-cases` | Iniciar un caso de verificación de identidad | MEDIO | 2 | SECURITY_ADMIN |
| 15 | POST | `/identity/verification-cases/{id}/assertions` | Emitir una aserción de identidad con nivel de aseguramiento | MEDIO | 3 | SECURITY_ADMIN |
| 16 | POST | `/identity/verification-cases/{id}/checks:plan` | Planificar los checks requeridos del caso | MEDIO | 2 | SECURITY_ADMIN |
| 17 | POST | `/identity/verification-cases/{id}/evidence` | Aportar evidencia documental bajo consentimiento | MEDIO | 2 | SECURITY_ADMIN |
| 18 | POST | `/identity/verification-cases/{id}/fraud-signals` | Detectar y registrar una señal de fraude | MEDIO | 2 | SECURITY_ADMIN |
| 19 | POST | `/identity/verification-cases/{id}/manual-review` | Escalar el caso a revisión manual | MEDIO | 3 | SECURITY_ADMIN |
| 20 | POST | `/identity/verification-cases/expire-sweep` | Expirar por lote los casos vencidos (job programado) | MEDIO | 10 | SYSTEM, SECURITY_ADMIN |
| 21 | POST | `/identity/verification-policies` | Crear una política de verificación de identidad (IAL/AAL) | MEDIO | 1 | SECURITY_ADMIN |
| 22 | POST | `/internal/identity/checks/{id}/attempts` | Registrar el intento del worker contra la autoridad externa | MEDIO | 4 | SYSTEM, SECURITY_ADMIN |
| 23 | POST | `/internal/identity/checks/{id}/results` | Registrar el veredicto que devolvió la autoridad externa | MEDIO | 22 | SYSTEM, SECURITY_ADMIN |
| 24 | GET | `/internal/identity/checks/dispatchable` | Listar los checks que el worker debe atender en este tick | BAJO | 2 | SYSTEM, SECURITY_ADMIN |

---

## 1. POST /identity/assertions/{id}/revoke

- **Origen:** CONTRATO
- **Nombre:** Revocar una aserción de identidad
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IdentityAssertionsController.revoke` — `src/modules/identity_assurance/controllers/identity-assertions.controller.ts:28`

### Qué es y para qué sirve (negocio)

Revocar una aserción de identidad. Dentro del módulo (descripción del modelo, en inglés): «Verifies patients, practitioners, representatives and organization operators against authoritative ministries, civil registries, professional boards and government data platforms.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_27_identity_assurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /identity/assertions/{id}/revoke` la atiende `IdentityAssertionsController.revoke` (src/modules/identity_assurance/controllers/identity-assertions.controller.ts:28). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `RevokeAssertionDto` (4 campos, 0 obligatorios). Delega en `IdentityAssertionsService.revoke`. Crea filas en audit.verified_badges_history, identity_assurance.identity_fraud_signals. Actualiza community.public_profiles, community.verified_badges, identity_assurance.identity_assertions, identity_assurance.identity_verification_cases. Lee community.public_profiles, community.verified_badges, identity_assurance.identity_assertions, identity_assurance.identity_verification_cases, profiles.jurisdiction_authorizations.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/identity_assurance/controllers/identity-assertions.controller.ts:28` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/identity_assurance/controllers/identity-assertions.controller.ts:28` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.verified_badges_history` | ESCRIBE | CREA | DIRECTA | IdentityAssertionsController.revoke → IdentityAssertionsService.revoke → IdentityVerificationEffectsService.applyRevoked → CommunityVerificationService.applyRevoked → CommunityVerificationService.revokeProfileBadges → VerifiedBadgesRepository.recordHistory | `src/modules/community/repositories/verified-badges.repository.ts:172` |
| `community.public_profiles` | ESCRIBE | ACTUALIZA | POR_TIPO | IdentityAssertionsController.revoke → IdentityAssertionsService.revoke → IdentityVerificationEffectsService.applyRevoked → CommunityVerificationService.applyRevoked → CommunityVerificationService.revokeProfileBadges | `src/modules/community/services/community-verification.service.ts:249` |
| `community.public_profiles` | LEE | LEE | DIRECTA | IdentityAssertionsController.revoke → IdentityAssertionsService.revoke → IdentityVerificationEffectsService.applyRevoked → CommunityVerificationService.applyRevoked → VerifiedBadgesRepository.findProfileByTarget | `src/modules/community/repositories/verified-badges.repository.ts:205` |
| `community.verified_badges` | ESCRIBE | ACTUALIZA | POR_TIPO | IdentityAssertionsController.revoke → IdentityAssertionsService.revoke → IdentityVerificationEffectsService.applyRevoked → CommunityVerificationService.applyRevoked → CommunityVerificationService.revokeProfileBadges → VerifiedBadgesRepository.revoke | `src/modules/community/repositories/verified-badges.repository.ts:140` |
| `community.verified_badges` | LEE | LEE | DIRECTA | IdentityAssertionsController.revoke → IdentityAssertionsService.revoke → IdentityVerificationEffectsService.applyRevoked → CommunityVerificationService.applyRevoked → CommunityVerificationService.revokeProfileBadges → VerifiedBadgesRepository.findAllBySubject | `src/modules/community/repositories/verified-badges.repository.ts:73` |
| `identity_assurance.identity_assertions` | ESCRIBE | ACTUALIZA | POR_TIPO | IdentityAssertionsController.revoke → IdentityAssertionsService.revoke | `src/modules/identity_assurance/services/identity-assertions.service.ts:72` |
| `identity_assurance.identity_assertions` | LEE | LEE | DIRECTA | IdentityAssertionsController.revoke → IdentityAssertionsService.revoke → IdentityAssertionsRepository.findById | `src/modules/identity_assurance/repositories/identity-assertions.repository.ts:103` |
| `identity_assurance.identity_fraud_signals` | ESCRIBE | CREA | DIRECTA | IdentityAssertionsController.revoke → IdentityAssertionsService.revoke → IdentityFraudSignalsRepository.create | `src/modules/identity_assurance/repositories/identity-fraud-signals.repository.ts:52` |
| `identity_assurance.identity_verification_cases` | ESCRIBE | ACTUALIZA | POR_TIPO | IdentityAssertionsController.revoke → IdentityAssertionsService.revoke | `src/modules/identity_assurance/services/identity-assertions.service.ts:88` |
| `identity_assurance.identity_verification_cases` | LEE | LEE | DIRECTA | IdentityAssertionsController.revoke → IdentityAssertionsService.revoke → IdentityVerificationCasesRepository.findById | `src/modules/identity_assurance/repositories/identity-cases.repository.ts:64` |
| `profiles.jurisdiction_authorizations` | LEE | LEE | DIRECTA | IdentityAssertionsController.revoke → IdentityAssertionsService.revoke → IdentityVerificationEffectsService.applyRevoked → IdentityVerificationEffectsService.publicSubjectOf → JurisdictionAuthorizationsRepository.findById | `src/modules/profiles/repositories/jurisdiction-authorizations.repository.ts:60` |

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
| 404 | `NOT_FOUND` | ResourceNotFoundException: Aserción de identidad no encontrada; ResourceNotFoundException: Caso de verificación no encontrado |
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
- **Implementación:** `IdentityAuthoritiesController.register` — `src/modules/identity_assurance/controllers/identity-authorities.controller.ts:35`

### Qué es y para qué sirve (negocio)

Registrar una autoridad de identidad. Dentro del módulo (descripción del modelo, en inglés): «Verifies patients, practitioners, representatives and organization operators against authoritative ministries, civil registries, professional boards and government data platforms.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_27_identity_assurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /identity/authorities` la atiende `IdentityAuthoritiesController.register` (src/modules/identity_assurance/controllers/identity-authorities.controller.ts:35). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `RegisterAuthorityDto` (6 campos, 4 obligatorios). Delega en `IdentityAuthoritiesService.registerAuthority`. Crea filas en identity_assurance.identity_authorities.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/identity_assurance/controllers/identity-authorities.controller.ts:35` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `identity_assurance.identity_authorities` | ESCRIBE | CREA | DIRECTA | IdentityAuthoritiesController.register → IdentityAuthoritiesService.registerAuthority → IdentityAuthoritiesRepository.create | `src/modules/identity_assurance/repositories/identity-authorities.repository.ts:108` |

### Cuerpo — DTO `RegisterAuthorityDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | Tenant propietario de la autoridad | `src/modules/identity_assurance/dto/create-authority.dto.ts:20` |
| `authorityCode` | `string` | Sí | longitud mínima 1; longitud máxima 100 | `@IsString()` `@MinLength(1)` `@MaxLength(100)` | Código único de la autoridad | `src/modules/identity_assurance/dto/create-authority.dto.ts:29` |
| `name` | `string` | Sí | longitud mínima 1; longitud máxima 200 | `@IsString()` `@MinLength(1)` `@MaxLength(200)` | Nombre legible de la autoridad | `src/modules/identity_assurance/dto/create-authority.dto.ts:41` |
| `authorityTypeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Concepto: tipo de autoridad | `src/modules/identity_assurance/dto/create-authority.dto.ts:48` |
| `jurisdictionConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concepto: jurisdicción | `src/modules/identity_assurance/dto/create-authority.dto.ts:59` |
| `assuranceFrameworkConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concepto: marco de aseguramiento (NIST/eIDAS) | `src/modules/identity_assurance/dto/create-authority.dto.ts:70` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
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
- **Implementación:** `IdentityAuthoritiesController.addEndpoint` — `src/modules/identity_assurance/controllers/identity-authorities.controller.ts:47`

### Qué es y para qué sirve (negocio)

Publicar un endpoint de verificación de la autoridad. Dentro del módulo (descripción del modelo, en inglés): «Verifies patients, practitioners, representatives and organization operators against authoritative ministries, civil registries, professional boards and government data platforms.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_27_identity_assurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /identity/authorities/{id}/endpoints` la atiende `IdentityAuthoritiesController.addEndpoint` (src/modules/identity_assurance/controllers/identity-authorities.controller.ts:47). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateAuthorityEndpointDto` (5 campos, 2 obligatorios). Delega en `IdentityAuthoritiesService.addEndpoint`. Crea filas en identity_assurance.identity_authority_endpoints. Lee identity_assurance.identity_authorities.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/identity_assurance/controllers/identity-authorities.controller.ts:47` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/identity_assurance/controllers/identity-authorities.controller.ts:47` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `identity_assurance.identity_authorities` | LEE | LEE | DIRECTA | IdentityAuthoritiesController.addEndpoint → IdentityAuthoritiesService.addEndpoint → IdentityAuthoritiesRepository.findById | `src/modules/identity_assurance/repositories/identity-authorities.repository.ts:97` |
| `identity_assurance.identity_authority_endpoints` | ESCRIBE | CREA | DIRECTA | IdentityAuthoritiesController.addEndpoint → IdentityAuthoritiesService.addEndpoint → IdentityAuthorityEndpointsRepository.create | `src/modules/identity_assurance/repositories/identity-authorities.repository.ts:154` |

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
| 404 | `NOT_FOUND` | ResourceNotFoundException: Autoridad de identidad no encontrada |
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
- **Implementación:** `IdentityChecksController.recordAttempt` — `src/modules/identity_assurance/controllers/identity-checks.controller.ts:33`

### Qué es y para qué sirve (negocio)

Ejecutar un intento contra la autoridad externa (idempotente). Dentro del módulo (descripción del modelo, en inglés): «Verifies patients, practitioners, representatives and organization operators against authoritative ministries, civil registries, professional boards and government data platforms.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_27_identity_assurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /identity/checks/{id}/attempts` la atiende `IdentityChecksController.recordAttempt` (src/modules/identity_assurance/controllers/identity-checks.controller.ts:33). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `IdentityAssuranceRecordAttemptDto` (7 campos, 1 obligatorio). Delega en `IdentityChecksService.recordAttempt`. Crea filas en identity_assurance.identity_verification_attempts. Actualiza identity_assurance.identity_checks. Lee identity_assurance.identity_checks, identity_assurance.identity_verification_attempts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/identity_assurance/controllers/identity-checks.controller.ts:33` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/identity_assurance/controllers/identity-checks.controller.ts:33` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `identity_assurance.identity_checks` | ESCRIBE | ACTUALIZA | POR_TIPO | IdentityChecksController.recordAttempt → IdentityChecksService.recordAttempt | `src/modules/identity_assurance/services/identity-checks.service.ts:226` |
| `identity_assurance.identity_checks` | LEE | LEE | DIRECTA | IdentityChecksController.recordAttempt → IdentityChecksService.recordAttempt → IdentityChecksService.loadCheck → IdentityChecksRepository.findById | `src/modules/identity_assurance/repositories/identity-checks.repository.ts:141` |
| `identity_assurance.identity_verification_attempts` | ESCRIBE | CREA | DIRECTA | IdentityChecksController.recordAttempt → IdentityChecksService.recordAttempt → IdentityVerificationAttemptsRepository.create | `src/modules/identity_assurance/repositories/identity-checks.repository.ts:341` |
| `identity_assurance.identity_verification_attempts` | LEE | LEE | DIRECTA | IdentityChecksController.recordAttempt → IdentityChecksService.recordAttempt → IdentityVerificationAttemptsRepository.countByCase | `src/modules/identity_assurance/repositories/identity-checks.repository.ts:277` |

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
- **Implementación:** `IdentityChecksController.recordResult` — `src/modules/identity_assurance/controllers/identity-checks.controller.ts:48`

### Qué es y para qué sirve (negocio)

Registrar el resultado inmutable del check (con supersede). Dentro del módulo (descripción del modelo, en inglés): «Verifies patients, practitioners, representatives and organization operators against authoritative ministries, civil registries, professional boards and government data platforms.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_27_identity_assurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /identity/checks/{id}/results` la atiende `IdentityChecksController.recordResult` (src/modules/identity_assurance/controllers/identity-checks.controller.ts:48). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `RecordResultDto` (4 campos, 1 obligatorio). Delega en `IdentityChecksService.recordResult`. Crea filas en audit.verified_badges_history, community.verified_badges, identity_assurance.identity_assertions, identity_assurance.identity_check_results. Actualiza community.public_profiles, community.verified_badges, directory.tenants, identity_assurance.identity_checks, identity_assurance.identity_verification_attempts, identity_assurance.identity_verification_cases, profiles.health_practitioner_profiles, profiles.jurisdiction_authorizations. Lee community.public_profiles, community.verified_badges, directory.tenants, identity_assurance.identity_authority_endpoints, identity_assurance.identity_check_results, identity_assurance.identity_checks, identity_assurance.identity_verification_attempts, identity_assurance.identity_verification_cases y 2 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/identity_assurance/controllers/identity-checks.controller.ts:48` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/identity_assurance/controllers/identity-checks.controller.ts:48` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.verified_badges_history` | ESCRIBE | CREA | DIRECTA | IdentityChecksController.recordResult → IdentityChecksService.recordResult → IdentityChecksService.settleCase → IdentityChecksService.verifyCase → IdentityVerificationEffectsService.applyVerified → IdentityVerificationEffectsService.activateLicense → CommunityVerificationService.applyVerified → VerifiedBadgesRepository.recordHistory | `src/modules/community/repositories/verified-badges.repository.ts:172` |
| `community.public_profiles` | ESCRIBE | ACTUALIZA | POR_TIPO | IdentityChecksController.recordResult → IdentityChecksService.recordResult → IdentityChecksService.settleCase → IdentityChecksService.verifyCase → IdentityVerificationEffectsService.applyVerified → IdentityVerificationEffectsService.activateLicense → CommunityVerificationService.applyVerified | `src/modules/community/services/community-verification.service.ts:175` |
| `community.public_profiles` | LEE | LEE | DIRECTA | IdentityChecksController.recordResult → IdentityChecksService.recordResult → IdentityChecksService.settleCase → IdentityChecksService.verifyCase → IdentityVerificationEffectsService.applyVerified → IdentityVerificationEffectsService.activateLicense → CommunityVerificationService.applyVerified → VerifiedBadgesRepository.findProfileByTarget | `src/modules/community/repositories/verified-badges.repository.ts:205` |
| `community.verified_badges` | ESCRIBE | ACTUALIZA | POR_TIPO | IdentityChecksController.recordResult → IdentityChecksService.recordResult → IdentityChecksService.settleCase → IdentityChecksService.verifyCase → IdentityVerificationEffectsService.applyVerified → IdentityVerificationEffectsService.activateLicense → CommunityVerificationService.applyVerified → VerifiedBadgesRepository.grant | `src/modules/community/repositories/verified-badges.repository.ts:94` |
| `community.verified_badges` | ESCRIBE | CREA | DIRECTA | IdentityChecksController.recordResult → IdentityChecksService.recordResult → IdentityChecksService.settleCase → IdentityChecksService.verifyCase → IdentityVerificationEffectsService.applyVerified → IdentityVerificationEffectsService.activateLicense → CommunityVerificationService.applyVerified → VerifiedBadgesRepository.grant | `src/modules/community/repositories/verified-badges.repository.ts:103` |
| `community.verified_badges` | LEE | LEE | DIRECTA | IdentityChecksController.recordResult → IdentityChecksService.recordResult → IdentityChecksService.settleCase → IdentityChecksService.verifyCase → IdentityVerificationEffectsService.applyVerified → IdentityVerificationEffectsService.activateLicense → CommunityVerificationService.applyVerified → VerifiedBadgesRepository.findActive | `src/modules/community/repositories/verified-badges.repository.ts:61` |
| `directory.tenants` | ESCRIBE | ACTUALIZA | POR_TIPO | IdentityChecksController.recordResult → IdentityChecksService.recordResult → IdentityChecksService.settleCase → IdentityChecksService.verifyCase → IdentityVerificationEffectsService.applyVerified → IdentityVerificationEffectsService.verifyTenant | `src/modules/identity_assurance/services/identity-verification-effects.service.ts:249` |
| `directory.tenants` | LEE | LEE | DIRECTA | IdentityChecksController.recordResult → IdentityChecksService.recordResult → IdentityChecksService.settleCase → IdentityChecksService.verifyCase → IdentityVerificationEffectsService.applyVerified → IdentityVerificationEffectsService.verifyTenant → TenantsRepository.findById | `src/modules/directory/repositories/tenants.repository.ts:71` |
| `identity_assurance.identity_assertions` | ESCRIBE | CREA | DIRECTA | IdentityChecksController.recordResult → IdentityChecksService.recordResult → IdentityChecksService.settleCase → IdentityChecksService.verifyCase → IdentityChecksService.issueAssertion → IdentityAssertionsRepository.create | `src/modules/identity_assurance/repositories/identity-assertions.repository.ts:132` |
| `identity_assurance.identity_authority_endpoints` | LEE | LEE | DIRECTA | IdentityChecksController.recordResult → IdentityChecksService.recordResult → IdentityChecksService.settleCase → IdentityChecksService.verifyCase → IdentityChecksService.issueAssertion → IdentityAuthorityEndpointsRepository.findById | `src/modules/identity_assurance/repositories/identity-authorities.repository.ts:140` |
| `identity_assurance.identity_check_results` | ESCRIBE | CREA | DIRECTA | IdentityChecksController.recordResult → IdentityChecksService.recordResult → IdentityCheckResultsRepository.create | `src/modules/identity_assurance/repositories/identity-checks.repository.ts:396` |
| `identity_assurance.identity_check_results` | LEE | LEE | DIRECTA | IdentityChecksController.recordResult → IdentityChecksService.recordResult → IdentityCheckResultsRepository.findLatestByCheck | `src/modules/identity_assurance/repositories/identity-checks.repository.ts:381` |
| `identity_assurance.identity_checks` | ESCRIBE | ACTUALIZA | POR_TIPO | IdentityChecksController.recordResult → IdentityChecksService.recordResult | `src/modules/identity_assurance/services/identity-checks.service.ts:284` |
| `identity_assurance.identity_checks` | LEE | LEE | DIRECTA | IdentityChecksController.recordResult → IdentityChecksService.recordResult → IdentityChecksService.loadCheck → IdentityChecksRepository.findById | `src/modules/identity_assurance/repositories/identity-checks.repository.ts:141` |
| `identity_assurance.identity_verification_attempts` | ESCRIBE | ACTUALIZA | POR_TIPO | IdentityChecksController.recordResult → IdentityChecksService.recordResult → IdentityChecksService.completeInFlightAttempt | `src/modules/identity_assurance/services/identity-checks.service.ts:333` |
| `identity_assurance.identity_verification_attempts` | LEE | LEE | DIRECTA | IdentityChecksController.recordResult → IdentityChecksService.recordResult → IdentityVerificationAttemptsRepository.existsCompletedForCase | `src/modules/identity_assurance/repositories/identity-checks.repository.ts:287` |
| `identity_assurance.identity_verification_cases` | ESCRIBE | ACTUALIZA | POR_TIPO | IdentityChecksController.recordResult → IdentityChecksService.recordResult → IdentityChecksService.settleCase | `src/modules/identity_assurance/services/identity-checks.service.ts:376` |
| `identity_assurance.identity_verification_cases` | LEE | LEE | DIRECTA | IdentityChecksController.recordResult → IdentityChecksService.recordResult → IdentityChecksService.settleCase → IdentityVerificationCasesRepository.findById | `src/modules/identity_assurance/repositories/identity-cases.repository.ts:64` |
| `profiles.health_practitioner_profiles` | ESCRIBE | ACTUALIZA | POR_TIPO | IdentityChecksController.recordResult → IdentityChecksService.recordResult → IdentityChecksService.settleCase → IdentityChecksService.verifyCase → IdentityVerificationEffectsService.applyVerified → IdentityVerificationEffectsService.activateLicense | `src/modules/identity_assurance/services/identity-verification-effects.service.ts:198` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | IdentityChecksController.recordResult → IdentityChecksService.recordResult → IdentityChecksService.settleCase → IdentityChecksService.verifyCase → IdentityVerificationEffectsService.applyVerified → IdentityVerificationEffectsService.activateLicense → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/repositories/health-practitioner-profiles.repository.ts:64` |
| `profiles.jurisdiction_authorizations` | ESCRIBE | ACTUALIZA | POR_TIPO | IdentityChecksController.recordResult → IdentityChecksService.recordResult → IdentityChecksService.settleCase → IdentityChecksService.verifyCase → IdentityVerificationEffectsService.applyVerified → IdentityVerificationEffectsService.activateLicense | `src/modules/identity_assurance/services/identity-verification-effects.service.ts:188` |
| `profiles.jurisdiction_authorizations` | LEE | LEE | DIRECTA | IdentityChecksController.recordResult → IdentityChecksService.recordResult → IdentityChecksService.settleCase → IdentityChecksService.verifyCase → IdentityVerificationEffectsService.applyVerified → IdentityVerificationEffectsService.activateLicense → JurisdictionAuthorizationsRepository.findById | `src/modules/profiles/repositories/jurisdiction-authorizations.repository.ts:60` |

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
- **Implementación:** `IdentityManualReviewController.decide` — `src/modules/identity_assurance/controllers/identity-manual-review.controller.ts:28`

### Qué es y para qué sirve (negocio)

Resolver una revisión manual (decisión). Dentro del módulo (descripción del modelo, en inglés): «Verifies patients, practitioners, representatives and organization operators against authoritative ministries, civil registries, professional boards and government data platforms.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_27_identity_assurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /identity/manual-review/{id}/decision` la atiende `IdentityManualReviewController.decide` (src/modules/identity_assurance/controllers/identity-manual-review.controller.ts:28). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `ReviewDecisionDto` (2 campos, 1 obligatorio). Delega en `IdentityManualReviewService.decide`. Crea filas en audit.verified_badges_history, community.verified_badges, identity_assurance.identity_assertions, identity_assurance.identity_check_results. Actualiza community.public_profiles, community.verified_badges, directory.tenants, identity_assurance.identity_checks, identity_assurance.identity_fraud_signals, identity_assurance.identity_manual_review_cases, identity_assurance.identity_verification_cases, profiles.health_practitioner_profiles y 1 más. Lee community.public_profiles, community.verified_badges, directory.tenants, identity_assurance.identity_authority_endpoints, identity_assurance.identity_check_results, identity_assurance.identity_checks, identity_assurance.identity_fraud_signals, identity_assurance.identity_manual_review_cases y 4 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/identity_assurance/controllers/identity-manual-review.controller.ts:28` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/identity_assurance/controllers/identity-manual-review.controller.ts:28` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.verified_badges_history` | ESCRIBE | CREA | DIRECTA | IdentityManualReviewController.decide → IdentityManualReviewService.decide → IdentityChecksService.settleManualApproval → IdentityChecksService.verifyCase → IdentityVerificationEffectsService.applyVerified → IdentityVerificationEffectsService.activateLicense → CommunityVerificationService.applyVerified → VerifiedBadgesRepository.recordHistory | `src/modules/community/repositories/verified-badges.repository.ts:172` |
| `community.public_profiles` | ESCRIBE | ACTUALIZA | POR_TIPO | IdentityManualReviewController.decide → IdentityManualReviewService.decide → IdentityChecksService.settleManualApproval → IdentityChecksService.verifyCase → IdentityVerificationEffectsService.applyVerified → IdentityVerificationEffectsService.activateLicense → CommunityVerificationService.applyVerified | `src/modules/community/services/community-verification.service.ts:175` |
| `community.public_profiles` | LEE | LEE | DIRECTA | IdentityManualReviewController.decide → IdentityManualReviewService.decide → IdentityChecksService.settleManualApproval → IdentityChecksService.verifyCase → IdentityVerificationEffectsService.applyVerified → IdentityVerificationEffectsService.activateLicense → CommunityVerificationService.applyVerified → VerifiedBadgesRepository.findProfileByTarget | `src/modules/community/repositories/verified-badges.repository.ts:205` |
| `community.verified_badges` | ESCRIBE | ACTUALIZA | POR_TIPO | IdentityManualReviewController.decide → IdentityManualReviewService.decide → IdentityChecksService.settleManualApproval → IdentityChecksService.verifyCase → IdentityVerificationEffectsService.applyVerified → IdentityVerificationEffectsService.activateLicense → CommunityVerificationService.applyVerified → VerifiedBadgesRepository.grant | `src/modules/community/repositories/verified-badges.repository.ts:94` |
| `community.verified_badges` | ESCRIBE | CREA | DIRECTA | IdentityManualReviewController.decide → IdentityManualReviewService.decide → IdentityChecksService.settleManualApproval → IdentityChecksService.verifyCase → IdentityVerificationEffectsService.applyVerified → IdentityVerificationEffectsService.activateLicense → CommunityVerificationService.applyVerified → VerifiedBadgesRepository.grant | `src/modules/community/repositories/verified-badges.repository.ts:103` |
| `community.verified_badges` | LEE | LEE | DIRECTA | IdentityManualReviewController.decide → IdentityManualReviewService.decide → IdentityChecksService.settleManualApproval → IdentityChecksService.verifyCase → IdentityVerificationEffectsService.applyVerified → IdentityVerificationEffectsService.activateLicense → CommunityVerificationService.applyVerified → VerifiedBadgesRepository.findActive | `src/modules/community/repositories/verified-badges.repository.ts:61` |
| `directory.tenants` | ESCRIBE | ACTUALIZA | POR_TIPO | IdentityManualReviewController.decide → IdentityManualReviewService.decide → IdentityChecksService.settleManualApproval → IdentityChecksService.verifyCase → IdentityVerificationEffectsService.applyVerified → IdentityVerificationEffectsService.verifyTenant | `src/modules/identity_assurance/services/identity-verification-effects.service.ts:249` |
| `directory.tenants` | LEE | LEE | DIRECTA | IdentityManualReviewController.decide → IdentityManualReviewService.decide → IdentityChecksService.settleManualApproval → IdentityChecksService.verifyCase → IdentityVerificationEffectsService.applyVerified → IdentityVerificationEffectsService.verifyTenant → TenantsRepository.findById | `src/modules/directory/repositories/tenants.repository.ts:71` |
| `identity_assurance.identity_assertions` | ESCRIBE | CREA | DIRECTA | IdentityManualReviewController.decide → IdentityManualReviewService.decide → IdentityChecksService.settleManualApproval → IdentityChecksService.verifyCase → IdentityChecksService.issueAssertion → IdentityAssertionsRepository.create | `src/modules/identity_assurance/repositories/identity-assertions.repository.ts:132` |
| `identity_assurance.identity_authority_endpoints` | LEE | LEE | DIRECTA | IdentityManualReviewController.decide → IdentityManualReviewService.decide → IdentityChecksService.settleManualApproval → IdentityChecksService.verifyCase → IdentityChecksService.issueAssertion → IdentityAuthorityEndpointsRepository.findById | `src/modules/identity_assurance/repositories/identity-authorities.repository.ts:140` |
| `identity_assurance.identity_check_results` | ESCRIBE | CREA | DIRECTA | IdentityManualReviewController.decide → IdentityManualReviewService.decide → IdentityChecksService.settleManualApproval → IdentityCheckResultsRepository.create | `src/modules/identity_assurance/repositories/identity-checks.repository.ts:396` |
| `identity_assurance.identity_check_results` | LEE | LEE | DIRECTA | IdentityManualReviewController.decide → IdentityManualReviewService.decide → IdentityChecksService.settleManualApproval → IdentityCheckResultsRepository.findLatestByCheck | `src/modules/identity_assurance/repositories/identity-checks.repository.ts:381` |
| `identity_assurance.identity_checks` | ESCRIBE | ACTUALIZA | POR_TIPO | IdentityManualReviewController.decide → IdentityManualReviewService.decide → IdentityChecksService.settleManualApproval | `src/modules/identity_assurance/services/identity-checks.service.ts:448` |
| `identity_assurance.identity_checks` | LEE | LEE | DIRECTA | IdentityManualReviewController.decide → IdentityManualReviewService.decide → IdentityChecksService.settleManualApproval → IdentityChecksRepository.findRequiredByCase | `src/modules/identity_assurance/repositories/identity-checks.repository.ts:238` |
| `identity_assurance.identity_fraud_signals` | ESCRIBE | ACTUALIZA | POR_TIPO | IdentityManualReviewController.decide → IdentityManualReviewService.decide → IdentityFraudSignalsRepository.resolveOpenForCase | `src/modules/identity_assurance/repositories/identity-fraud-signals.repository.ts:82` |
| `identity_assurance.identity_fraud_signals` | LEE | LEE | DIRECTA | IdentityManualReviewController.decide → IdentityManualReviewService.decide → IdentityFraudSignalsRepository.resolveOpenForCase | `src/modules/identity_assurance/repositories/identity-fraud-signals.repository.ts:76` |
| `identity_assurance.identity_manual_review_cases` | ESCRIBE | ACTUALIZA | POR_TIPO | IdentityManualReviewController.decide → IdentityManualReviewService.decide | `src/modules/identity_assurance/services/identity-manual-review.service.ts:95` |
| `identity_assurance.identity_manual_review_cases` | LEE | LEE | DIRECTA | IdentityManualReviewController.decide → IdentityManualReviewService.decide → IdentityManualReviewCasesRepository.findById | `src/modules/identity_assurance/repositories/identity-manual-review.repository.ts:48` |
| `identity_assurance.identity_verification_attempts` | LEE | LEE | DIRECTA | IdentityManualReviewController.decide → IdentityManualReviewService.decide → IdentityChecksService.settleManualApproval → IdentityChecksService.verifyCase → IdentityChecksService.issueAssertion → IdentityVerificationAttemptsRepository.findLatestCompletedByCase | `src/modules/identity_assurance/repositories/identity-checks.repository.ts:299` |
| `identity_assurance.identity_verification_cases` | ESCRIBE | ACTUALIZA | POR_TIPO | IdentityManualReviewController.decide → IdentityManualReviewService.decide | `src/modules/identity_assurance/services/identity-manual-review.service.ts:108` |
| `identity_assurance.identity_verification_cases` | LEE | LEE | DIRECTA | IdentityManualReviewController.decide → IdentityManualReviewService.decide → IdentityVerificationCasesRepository.findById | `src/modules/identity_assurance/repositories/identity-cases.repository.ts:64` |
| `profiles.health_practitioner_profiles` | ESCRIBE | ACTUALIZA | POR_TIPO | IdentityManualReviewController.decide → IdentityManualReviewService.decide → IdentityChecksService.settleManualApproval → IdentityChecksService.verifyCase → IdentityVerificationEffectsService.applyVerified → IdentityVerificationEffectsService.activateLicense | `src/modules/identity_assurance/services/identity-verification-effects.service.ts:198` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | IdentityManualReviewController.decide → IdentityManualReviewService.decide → IdentityChecksService.settleManualApproval → IdentityChecksService.verifyCase → IdentityVerificationEffectsService.applyVerified → IdentityVerificationEffectsService.activateLicense → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/repositories/health-practitioner-profiles.repository.ts:64` |
| `profiles.jurisdiction_authorizations` | ESCRIBE | ACTUALIZA | POR_TIPO | IdentityManualReviewController.decide → IdentityManualReviewService.decide → IdentityChecksService.settleManualApproval → IdentityChecksService.verifyCase → IdentityVerificationEffectsService.applyVerified → IdentityVerificationEffectsService.activateLicense | `src/modules/identity_assurance/services/identity-verification-effects.service.ts:188` |
| `profiles.jurisdiction_authorizations` | LEE | LEE | DIRECTA | IdentityManualReviewController.decide → IdentityManualReviewService.decide → IdentityChecksService.settleManualApproval → IdentityChecksService.verifyCase → IdentityVerificationEffectsService.applyVerified → IdentityVerificationEffectsService.activateLicense → JurisdictionAuthorizationsRepository.findById | `src/modules/profiles/repositories/jurisdiction-authorizations.repository.ts:60` |

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
| 404 | `NOT_FOUND` | ResourceNotFoundException: Revisión manual no encontrada; ResourceNotFoundException: Caso de verificación no encontrado |
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
- **Implementación:** `IdentitySelfServiceController.requestPatientIdentity` — `src/modules/identity_assurance/controllers/identity-self-service.controller.ts:41`

### Qué es y para qué sirve (negocio)

Solicitar la verificación de la propia identidad (paciente). Dentro del módulo (descripción del modelo, en inglés): «Verifies patients, practitioners, representatives and organization operators against authoritative ministries, civil registries, professional boards and government data platforms.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_27_identity_assurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /identity/me/identity-verification` la atiende `IdentitySelfServiceController.requestPatientIdentity` (src/modules/identity_assurance/controllers/identity-self-service.controller.ts:41). Exige sesión; el controlador no declara roles. Valida el cuerpo como `IdentityAssuranceRequestVerificationDto` (1 campo, 1 obligatorio). Delega en `IdentitySelfServiceService.requestPatientIdentity`. Crea filas en identity_assurance.identity_checks, identity_assurance.identity_evidence_records, identity_assurance.identity_verification_cases. Lee identity_assurance.identity_verification_cases, profiles.person_account_links.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/identity_assurance/controllers/identity-self-service.controller.ts:41` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `identity_assurance.identity_checks` | ESCRIBE | CREA | DIRECTA | IdentitySelfServiceController.requestPatientIdentity → IdentitySelfServiceService.requestPatientIdentity → IdentitySelfServiceService.openVerification → IdentityChecksRepository.create | `src/modules/identity_assurance/repositories/identity-checks.repository.ts:152` |
| `identity_assurance.identity_evidence_records` | ESCRIBE | CREA | DIRECTA | IdentitySelfServiceController.requestPatientIdentity → IdentitySelfServiceService.requestPatientIdentity → IdentitySelfServiceService.openVerification → IdentityEvidenceRecordsRepository.create | `src/modules/identity_assurance/repositories/identity-evidence.repository.ts:68` |
| `identity_assurance.identity_verification_cases` | ESCRIBE | CREA | DIRECTA | IdentitySelfServiceController.requestPatientIdentity → IdentitySelfServiceService.requestPatientIdentity → IdentitySelfServiceService.openVerification → IdentityVerificationCasesRepository.create | `src/modules/identity_assurance/repositories/identity-cases.repository.ts:75` |
| `identity_assurance.identity_verification_cases` | LEE | LEE | DIRECTA | IdentitySelfServiceController.requestPatientIdentity → IdentitySelfServiceService.requestPatientIdentity → IdentitySelfServiceService.openVerification → IdentityVerificationCasesRepository.countLiveForSubject | `src/modules/identity_assurance/repositories/identity-cases.repository.ts:111` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | IdentitySelfServiceController.requestPatientIdentity → IdentitySelfServiceService.requestPatientIdentity → IdentitySelfServiceService.resolvePersonId → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/repositories/person-account-links.repository.ts:80` |

### Cuerpo — DTO `IdentityAssuranceRequestVerificationDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `evidenceFileId` | `string` | Sí | formato uuid | `@IsUUID()` | Archivo de evidencia ya subido a POST /common/files/upload | `src/modules/identity_assurance/dto/request-verification.dto.ts:21` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "evidenceFileId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "evidenceFileId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<VerificationRequestResponseDto>` · DTO `VerificationRequestResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `caseId` | `string` | Sí | formato uuid | — | Identificador asociado a case. | `src/modules/identity_assurance/dto/request-verification.dto.ts:46` |
| `checkId` | `string` | Sí | formato uuid | — | Identificador asociado a check. | `src/modules/identity_assurance/dto/request-verification.dto.ts:52` |
| `status` | `string` | Sí | formato uuid | — | Estado del caso recién abierto | `src/modules/identity_assurance/dto/request-verification.dto.ts:61` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya hay una verificación en curso para este sujeto |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta no tiene una persona vinculada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/identity_assurance.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/identity-verification-self-service.int-spec.ts:104` |

### Flujos

- src / modules / identity assurance — etapa `ctrl:IdentitySelfServiceController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 8. POST /identity/me/practitioner/identity-verification

- **Origen:** CONTRATO
- **Nombre:** Solicitar la verificación de la propia identidad (profesional)
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IdentitySelfServiceController.requestPractitionerIdentity` — `src/modules/identity_assurance/controllers/identity-self-service.controller.ts:54`

### Qué es y para qué sirve (negocio)

Solicitar la verificación de la propia identidad (profesional). Dentro del módulo (descripción del modelo, en inglés): «Verifies patients, practitioners, representatives and organization operators against authoritative ministries, civil registries, professional boards and government data platforms.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_27_identity_assurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /identity/me/practitioner/identity-verification` la atiende `IdentitySelfServiceController.requestPractitionerIdentity` (src/modules/identity_assurance/controllers/identity-self-service.controller.ts:54). Exige sesión; el controlador no declara roles. Valida el cuerpo como `IdentityAssuranceRequestVerificationDto` (1 campo, 1 obligatorio). Delega en `IdentitySelfServiceService.requestPractitionerIdentity`. Crea filas en identity_assurance.identity_checks, identity_assurance.identity_evidence_records, identity_assurance.identity_verification_cases. Lee identity_assurance.identity_verification_cases, profiles.health_practitioner_profiles, profiles.person_account_links.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/identity_assurance/controllers/identity-self-service.controller.ts:54` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `identity_assurance.identity_checks` | ESCRIBE | CREA | DIRECTA | IdentitySelfServiceController.requestPractitionerIdentity → IdentitySelfServiceService.requestPractitionerIdentity → IdentitySelfServiceService.openVerification → IdentityChecksRepository.create | `src/modules/identity_assurance/repositories/identity-checks.repository.ts:152` |
| `identity_assurance.identity_evidence_records` | ESCRIBE | CREA | DIRECTA | IdentitySelfServiceController.requestPractitionerIdentity → IdentitySelfServiceService.requestPractitionerIdentity → IdentitySelfServiceService.openVerification → IdentityEvidenceRecordsRepository.create | `src/modules/identity_assurance/repositories/identity-evidence.repository.ts:68` |
| `identity_assurance.identity_verification_cases` | ESCRIBE | CREA | DIRECTA | IdentitySelfServiceController.requestPractitionerIdentity → IdentitySelfServiceService.requestPractitionerIdentity → IdentitySelfServiceService.openVerification → IdentityVerificationCasesRepository.create | `src/modules/identity_assurance/repositories/identity-cases.repository.ts:75` |
| `identity_assurance.identity_verification_cases` | LEE | LEE | DIRECTA | IdentitySelfServiceController.requestPractitionerIdentity → IdentitySelfServiceService.requestPractitionerIdentity → IdentitySelfServiceService.openVerification → IdentityVerificationCasesRepository.countLiveForSubject | `src/modules/identity_assurance/repositories/identity-cases.repository.ts:111` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | IdentitySelfServiceController.requestPractitionerIdentity → IdentitySelfServiceService.requestPractitionerIdentity → IdentitySelfServiceService.assertIsPractitioner → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/repositories/health-practitioner-profiles.repository.ts:64` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | IdentitySelfServiceController.requestPractitionerIdentity → IdentitySelfServiceService.requestPractitionerIdentity → IdentitySelfServiceService.resolvePersonId → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/repositories/person-account-links.repository.ts:80` |

### Cuerpo — DTO `IdentityAssuranceRequestVerificationDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `evidenceFileId` | `string` | Sí | formato uuid | `@IsUUID()` | Archivo de evidencia ya subido a POST /common/files/upload | `src/modules/identity_assurance/dto/request-verification.dto.ts:21` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "evidenceFileId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "evidenceFileId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<VerificationRequestResponseDto>` · DTO `VerificationRequestResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `caseId` | `string` | Sí | formato uuid | — | Identificador asociado a case. | `src/modules/identity_assurance/dto/request-verification.dto.ts:46` |
| `checkId` | `string` | Sí | formato uuid | — | Identificador asociado a check. | `src/modules/identity_assurance/dto/request-verification.dto.ts:52` |
| `status` | `string` | Sí | formato uuid | — | Estado del caso recién abierto | `src/modules/identity_assurance/dto/request-verification.dto.ts:61` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya hay una verificación en curso para este sujeto |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta no tiene una persona vinculada; PreconditionFailedException: La cuenta no tiene un perfil profesional |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/identity_assurance.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / identity assurance — etapa `ctrl:IdentitySelfServiceController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 9. POST /identity/me/practitioner/license-verification

- **Origen:** CONTRATO
- **Nombre:** Solicitar la verificación de la propia matrícula
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IdentitySelfServiceController.requestPractitionerLicense` — `src/modules/identity_assurance/controllers/identity-self-service.controller.ts:67`

### Qué es y para qué sirve (negocio)

Solicitar la verificación de la propia matrícula. Dentro del módulo (descripción del modelo, en inglés): «Verifies patients, practitioners, representatives and organization operators against authoritative ministries, civil registries, professional boards and government data platforms.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_27_identity_assurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /identity/me/practitioner/license-verification` la atiende `IdentitySelfServiceController.requestPractitionerLicense` (src/modules/identity_assurance/controllers/identity-self-service.controller.ts:67). Exige sesión; el controlador no declara roles. Valida el cuerpo como `IdentityAssuranceRequestLicenseVerificationDto` (2 campos, 1 obligatorio). Delega en `IdentitySelfServiceService.requestPractitionerLicense`. Crea filas en identity_assurance.identity_checks, identity_assurance.identity_evidence_records, identity_assurance.identity_verification_cases. Lee identity_assurance.identity_verification_cases, profiles.health_practitioner_profiles, profiles.jurisdiction_authorizations, profiles.person_account_links.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/identity_assurance/controllers/identity-self-service.controller.ts:67` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `identity_assurance.identity_checks` | ESCRIBE | CREA | DIRECTA | IdentitySelfServiceController.requestPractitionerLicense → IdentitySelfServiceService.requestPractitionerLicense → IdentitySelfServiceService.openVerification → IdentityChecksRepository.create | `src/modules/identity_assurance/repositories/identity-checks.repository.ts:152` |
| `identity_assurance.identity_evidence_records` | ESCRIBE | CREA | DIRECTA | IdentitySelfServiceController.requestPractitionerLicense → IdentitySelfServiceService.requestPractitionerLicense → IdentitySelfServiceService.openVerification → IdentityEvidenceRecordsRepository.create | `src/modules/identity_assurance/repositories/identity-evidence.repository.ts:68` |
| `identity_assurance.identity_verification_cases` | ESCRIBE | CREA | DIRECTA | IdentitySelfServiceController.requestPractitionerLicense → IdentitySelfServiceService.requestPractitionerLicense → IdentitySelfServiceService.openVerification → IdentityVerificationCasesRepository.create | `src/modules/identity_assurance/repositories/identity-cases.repository.ts:75` |
| `identity_assurance.identity_verification_cases` | LEE | LEE | DIRECTA | IdentitySelfServiceController.requestPractitionerLicense → IdentitySelfServiceService.requestPractitionerLicense → IdentitySelfServiceService.openVerification → IdentityVerificationCasesRepository.countLiveForSubject | `src/modules/identity_assurance/repositories/identity-cases.repository.ts:111` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | IdentitySelfServiceController.requestPractitionerLicense → IdentitySelfServiceService.requestPractitionerLicense → IdentitySelfServiceService.assertIsPractitioner → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/repositories/health-practitioner-profiles.repository.ts:64` |
| `profiles.jurisdiction_authorizations` | LEE | LEE | DIRECTA | IdentitySelfServiceController.requestPractitionerLicense → IdentitySelfServiceService.requestPractitionerLicense → JurisdictionAuthorizationsRepository.findById | `src/modules/profiles/repositories/jurisdiction-authorizations.repository.ts:60` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | IdentitySelfServiceController.requestPractitionerLicense → IdentitySelfServiceService.requestPractitionerLicense → IdentitySelfServiceService.resolvePersonId → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/repositories/person-account-links.repository.ts:80` |

### Cuerpo — DTO `IdentityAssuranceRequestLicenseVerificationDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `evidenceFileId` | `string` | Sí | formato uuid | `@IsUUID()` | Archivo de evidencia ya subido a POST /common/files/upload | `src/modules/identity_assurance/dto/request-verification.dto.ts:21` |
| `jurisdictionAuthorizationId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Matrícula a verificar. Si se omite se usa la única del profesional. | `src/modules/identity_assurance/dto/request-verification.dto.ts:37` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "evidenceFileId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "evidenceFileId": "00000000-0000-4000-8000-000000000001",
  "jurisdictionAuthorizationId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<VerificationRequestResponseDto>` · DTO `VerificationRequestResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `caseId` | `string` | Sí | formato uuid | — | Identificador asociado a case. | `src/modules/identity_assurance/dto/request-verification.dto.ts:46` |
| `checkId` | `string` | Sí | formato uuid | — | Identificador asociado a check. | `src/modules/identity_assurance/dto/request-verification.dto.ts:52` |
| `status` | `string` | Sí | formato uuid | — | Estado del caso recién abierto | `src/modules/identity_assurance/dto/request-verification.dto.ts:61` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Matrícula no encontrada |
| 409 | `CONFLICT` | ConflictException: Ya hay una verificación en curso para este sujeto |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta no tiene una persona vinculada; PreconditionFailedException: La cuenta no tiene un perfil profesional; PreconditionFailedException: Indique qué matrícula quiere verificar; PreconditionFailedException: La matrícula pertenece a otro profesional |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

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
- **Implementación:** `IdentitySelfServiceController.requestTenantVerification` — `src/modules/identity_assurance/controllers/identity-self-service.controller.ts:78`

### Qué es y para qué sirve (negocio)

Solicitar la verificación de una institución propia. Dentro del módulo (descripción del modelo, en inglés): «Verifies patients, practitioners, representatives and organization operators against authoritative ministries, civil registries, professional boards and government data platforms.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_27_identity_assurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /identity/me/tenants/{tenantId}/verification` la atiende `IdentitySelfServiceController.requestTenantVerification` (src/modules/identity_assurance/controllers/identity-self-service.controller.ts:78). Exige sesión; el controlador no declara roles. Valida el cuerpo como `IdentityAssuranceRequestVerificationDto` (1 campo, 1 obligatorio). Delega en `IdentitySelfServiceService.requestTenantVerification`. Crea filas en identity_assurance.identity_checks, identity_assurance.identity_evidence_records, identity_assurance.identity_verification_cases. Lee directory.tenant_memberships, identity_assurance.identity_verification_cases.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/identity_assurance/controllers/identity-self-service.controller.ts:78` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: tenantId | `src/modules/identity_assurance/controllers/identity-self-service.controller.ts:78` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | IdentitySelfServiceController.requestTenantVerification → IdentitySelfServiceService.requestTenantVerification → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:70` |
| `identity_assurance.identity_checks` | ESCRIBE | CREA | DIRECTA | IdentitySelfServiceController.requestTenantVerification → IdentitySelfServiceService.requestTenantVerification → IdentitySelfServiceService.openVerification → IdentityChecksRepository.create | `src/modules/identity_assurance/repositories/identity-checks.repository.ts:152` |
| `identity_assurance.identity_evidence_records` | ESCRIBE | CREA | DIRECTA | IdentitySelfServiceController.requestTenantVerification → IdentitySelfServiceService.requestTenantVerification → IdentitySelfServiceService.openVerification → IdentityEvidenceRecordsRepository.create | `src/modules/identity_assurance/repositories/identity-evidence.repository.ts:68` |
| `identity_assurance.identity_verification_cases` | ESCRIBE | CREA | DIRECTA | IdentitySelfServiceController.requestTenantVerification → IdentitySelfServiceService.requestTenantVerification → IdentitySelfServiceService.openVerification → IdentityVerificationCasesRepository.create | `src/modules/identity_assurance/repositories/identity-cases.repository.ts:75` |
| `identity_assurance.identity_verification_cases` | LEE | LEE | DIRECTA | IdentitySelfServiceController.requestTenantVerification → IdentitySelfServiceService.requestTenantVerification → IdentitySelfServiceService.openVerification → IdentityVerificationCasesRepository.countLiveForSubject | `src/modules/identity_assurance/repositories/identity-cases.repository.ts:111` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `tenantId` | path | Sí | `string` | — |

### Cuerpo — DTO `IdentityAssuranceRequestVerificationDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `evidenceFileId` | `string` | Sí | formato uuid | `@IsUUID()` | Archivo de evidencia ya subido a POST /common/files/upload | `src/modules/identity_assurance/dto/request-verification.dto.ts:21` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "evidenceFileId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "evidenceFileId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<VerificationRequestResponseDto>` · DTO `VerificationRequestResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `caseId` | `string` | Sí | formato uuid | — | Identificador asociado a case. | `src/modules/identity_assurance/dto/request-verification.dto.ts:46` |
| `checkId` | `string` | Sí | formato uuid | — | Identificador asociado a check. | `src/modules/identity_assurance/dto/request-verification.dto.ts:52` |
| `status` | `string` | Sí | formato uuid | — | Estado del caso recién abierto | `src/modules/identity_assurance/dto/request-verification.dto.ts:61` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya hay una verificación en curso para este sujeto |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: No pertenece a esa institución; PreconditionFailedException: Sólo el titular o un administrador de la institución puede pedir su verificación |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

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
- **Implementación:** `IdentitySelfServiceController.listOwnCases` — `src/modules/identity_assurance/controllers/identity-self-service.controller.ts:96`

### Qué es y para qué sirve (negocio)

Listar los casos de verificación propios. Dentro del módulo (descripción del modelo, en inglés): «Verifies patients, practitioners, representatives and organization operators against authoritative ministries, civil registries, professional boards and government data platforms.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_27_identity_assurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /identity/me/verification-cases` la atiende `IdentitySelfServiceController.listOwnCases` (src/modules/identity_assurance/controllers/identity-self-service.controller.ts:96). Exige sesión; el controlador no declara roles. Delega en `IdentitySelfServiceService.listOwnCases`. Lee identity_assurance.identity_verification_cases, profiles.jurisdiction_authorizations, profiles.person_account_links.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/identity_assurance/controllers/identity-self-service.controller.ts:96` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `identity_assurance.identity_verification_cases` | LEE | LEE | DIRECTA | IdentitySelfServiceController.listOwnCases → IdentitySelfServiceService.listOwnCases → IdentityVerificationCasesRepository.findBySubjects | `src/modules/identity_assurance/repositories/identity-cases.repository.ts:137` |
| `profiles.jurisdiction_authorizations` | LEE | LEE | DIRECTA | IdentitySelfServiceController.listOwnCases → IdentitySelfServiceService.listOwnCases → JurisdictionAuthorizationsRepository.findByPractitioner | `src/modules/profiles/repositories/jurisdiction-authorizations.repository.ts:85` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | IdentitySelfServiceController.listOwnCases → IdentitySelfServiceService.listOwnCases → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/repositories/person-account-links.repository.ts:80` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<VerificationStatusResponseDto[]>` · DTO `VerificationStatusResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/identity_assurance/dto/request-verification.dto.ts:70` |
| `status` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/identity_assurance/dto/request-verification.dto.ts:76` |
| `openedAt` | `string` | No | formato date-time | — | Valor de opened at mantenido por la instancia. | `src/modules/identity_assurance/dto/request-verification.dto.ts:82` |
| `completedAt` | `string` | No | formato date-time | — | Valor de completed at mantenido por la instancia. | `src/modules/identity_assurance/dto/request-verification.dto.ts:88` |

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
| INTEGRACION | `test/integration/identity-verification-self-service.int-spec.ts:149` |

### Flujos

- src / modules / identity assurance — etapa `ctrl:IdentitySelfServiceController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 12. GET /identity/me/verification-cases/{caseId}

- **Origen:** CONTRATO
- **Nombre:** Consultar el estado de un caso propio
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IdentitySelfServiceController.getOwnCaseStatus` — `src/modules/identity_assurance/controllers/identity-self-service.controller.ts:104`

### Qué es y para qué sirve (negocio)

Consultar el estado de un caso propio. Dentro del módulo (descripción del modelo, en inglés): «Verifies patients, practitioners, representatives and organization operators against authoritative ministries, civil registries, professional boards and government data platforms.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_27_identity_assurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /identity/me/verification-cases/{caseId}` la atiende `IdentitySelfServiceController.getOwnCaseStatus` (src/modules/identity_assurance/controllers/identity-self-service.controller.ts:104). Exige sesión; el controlador no declara roles. Delega en `IdentitySelfServiceService.getOwnCaseStatus`. Lee directory.tenant_memberships, identity_assurance.identity_verification_cases, profiles.jurisdiction_authorizations, profiles.person_account_links.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/identity_assurance/controllers/identity-self-service.controller.ts:104` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: caseId | `src/modules/identity_assurance/controllers/identity-self-service.controller.ts:104` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | IdentitySelfServiceController.getOwnCaseStatus → IdentitySelfServiceService.getOwnCaseStatus → IdentitySelfServiceService.isOwnSubject → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:70` |
| `identity_assurance.identity_verification_cases` | LEE | LEE | DIRECTA | IdentitySelfServiceController.getOwnCaseStatus → IdentitySelfServiceService.getOwnCaseStatus → IdentityVerificationCasesRepository.findById | `src/modules/identity_assurance/repositories/identity-cases.repository.ts:64` |
| `profiles.jurisdiction_authorizations` | LEE | LEE | DIRECTA | IdentitySelfServiceController.getOwnCaseStatus → IdentitySelfServiceService.getOwnCaseStatus → IdentitySelfServiceService.isOwnSubject → JurisdictionAuthorizationsRepository.findById | `src/modules/profiles/repositories/jurisdiction-authorizations.repository.ts:60` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | IdentitySelfServiceController.getOwnCaseStatus → IdentitySelfServiceService.getOwnCaseStatus → IdentitySelfServiceService.isOwnSubject → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/repositories/person-account-links.repository.ts:80` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `caseId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<VerificationStatusResponseDto>` · DTO `VerificationStatusResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/identity_assurance/dto/request-verification.dto.ts:70` |
| `status` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/identity_assurance/dto/request-verification.dto.ts:76` |
| `openedAt` | `string` | No | formato date-time | — | Valor de opened at mantenido por la instancia. | `src/modules/identity_assurance/dto/request-verification.dto.ts:82` |
| `completedAt` | `string` | No | formato date-time | — | Valor de completed at mantenido por la instancia. | `src/modules/identity_assurance/dto/request-verification.dto.ts:88` |

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

## 13. GET /identity/verification-cases

- **Origen:** CONTRATO
- **Nombre:** Listar los casos que esperan revisión
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IdentityCasesController.listQueue` — `src/modules/identity_assurance/controllers/identity-cases.controller.ts:66`

### Qué es y para qué sirve (negocio)

Listar los casos que esperan revisión. Dentro del módulo (descripción del modelo, en inglés): «Verifies patients, practitioners, representatives and organization operators against authoritative ministries, civil registries, professional boards and government data platforms.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_27_identity_assurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /identity/verification-cases` la atiende `IdentityCasesController.listQueue` (src/modules/identity_assurance/controllers/identity-cases.controller.ts:66). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `IdentityCasesService.listQueue`. Lee identity_assurance.identity_verification_cases.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/identity_assurance/controllers/identity-cases.controller.ts:66` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `identity_assurance.identity_verification_cases` | LEE | LEE | DIRECTA | IdentityCasesController.listQueue → IdentityCasesService.listQueue → IdentityVerificationCasesRepository.findByStatuses | `src/modules/identity_assurance/repositories/identity-cases.repository.ts:163` |

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
| `cases` | `array<QueuedCaseDto>` | Sí | — | — | Valor de cases mantenido por la instancia. | `src/modules/identity_assurance/dto/case-queue.dto.ts:65` |
| `cases[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/identity_assurance/dto/case-queue.dto.ts:14` |
| `cases[].status` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/identity_assurance/dto/case-queue.dto.ts:20` |
| `cases[].subjectTypeConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a subject type concept. | `src/modules/identity_assurance/dto/case-queue.dto.ts:26` |
| `cases[].subjectEntityId` | `string` | Sí | formato uuid | — | Identificador asociado a subject entity. | `src/modules/identity_assurance/dto/case-queue.dto.ts:32` |
| `cases[].identityVerificationPolicyId` | `string` | Sí | formato uuid | — | Identificador asociado a identity verification policy. | `src/modules/identity_assurance/dto/case-queue.dto.ts:38` |
| `cases[].riskScore` | `string` | No | — | — | Valor de risk score mantenido por la instancia. | `src/modules/identity_assurance/dto/case-queue.dto.ts:44` |
| `cases[].openedAt` | `string` | No | formato date-time | — | Valor de opened at mantenido por la instancia. | `src/modules/identity_assurance/dto/case-queue.dto.ts:50` |
| `cases[].expiresAt` | `string` | No | formato date-time | — | Valor de expires at mantenido por la instancia. | `src/modules/identity_assurance/dto/case-queue.dto.ts:56` |

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

## 14. POST /identity/verification-cases

- **Origen:** CONTRATO
- **Nombre:** Iniciar un caso de verificación de identidad
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IdentityCasesController.open` — `src/modules/identity_assurance/controllers/identity-cases.controller.ts:101`

### Qué es y para qué sirve (negocio)

Iniciar un caso de verificación de identidad. Dentro del módulo (descripción del modelo, en inglés): «Verifies patients, practitioners, representatives and organization operators against authoritative ministries, civil registries, professional boards and government data platforms.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_27_identity_assurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /identity/verification-cases` la atiende `IdentityCasesController.open` (src/modules/identity_assurance/controllers/identity-cases.controller.ts:101). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `OpenCaseDto` (6 campos, 3 obligatorios). Delega en `IdentityCasesService.openCase`. Crea filas en identity_assurance.identity_verification_cases. Lee identity_assurance.identity_verification_policies.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/identity_assurance/controllers/identity-cases.controller.ts:101` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `identity_assurance.identity_verification_cases` | ESCRIBE | CREA | DIRECTA | IdentityCasesController.open → IdentityCasesService.openCase → IdentityVerificationCasesRepository.create | `src/modules/identity_assurance/repositories/identity-cases.repository.ts:75` |
| `identity_assurance.identity_verification_policies` | LEE | LEE | DIRECTA | IdentityCasesController.open → IdentityCasesService.openCase → IdentityVerificationPoliciesRepository.findById | `src/modules/identity_assurance/repositories/identity-policies.repository.ts:75` |

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

## 15. POST /identity/verification-cases/{id}/assertions

- **Origen:** CONTRATO
- **Nombre:** Emitir una aserción de identidad con nivel de aseguramiento
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IdentityCasesController.issueAssertion` — `src/modules/identity_assurance/controllers/identity-cases.controller.ts:165`

### Qué es y para qué sirve (negocio)

Emitir una aserción de identidad con nivel de aseguramiento. Dentro del módulo (descripción del modelo, en inglés): «Verifies patients, practitioners, representatives and organization operators against authoritative ministries, civil registries, professional boards and government data platforms.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_27_identity_assurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /identity/verification-cases/{id}/assertions` la atiende `IdentityCasesController.issueAssertion` (src/modules/identity_assurance/controllers/identity-cases.controller.ts:165). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `IssueAssertionDto` (4 campos, 1 obligatorio). Delega en `IdentityCasesService.issueAssertion`. Crea filas en identity_assurance.identity_assertions. Lee identity_assurance.identity_checks, identity_assurance.identity_verification_cases.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/identity_assurance/controllers/identity-cases.controller.ts:165` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/identity_assurance/controllers/identity-cases.controller.ts:165` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `identity_assurance.identity_assertions` | ESCRIBE | CREA | DIRECTA | IdentityCasesController.issueAssertion → IdentityCasesService.issueAssertion → IdentityAssertionsRepository.create | `src/modules/identity_assurance/repositories/identity-assertions.repository.ts:132` |
| `identity_assurance.identity_checks` | LEE | LEE | DIRECTA | IdentityCasesController.issueAssertion → IdentityCasesService.issueAssertion → IdentityChecksRepository.countByCaseAndStatus | `src/modules/identity_assurance/repositories/identity-checks.repository.ts:192` |
| `identity_assurance.identity_verification_cases` | LEE | LEE | DIRECTA | IdentityCasesController.issueAssertion → IdentityCasesService.issueAssertion → IdentityCasesService.loadCase → IdentityVerificationCasesRepository.findById | `src/modules/identity_assurance/repositories/identity-cases.repository.ts:64` |

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
| 404 | `NOT_FOUND` | ResourceNotFoundException: Caso de verificación no encontrado |
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

## 16. POST /identity/verification-cases/{id}/checks:plan

- **Origen:** CONTRATO
- **Nombre:** Planificar los checks requeridos del caso
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IdentityCasesController.planChecks` — `src/modules/identity_assurance/controllers/identity-cases.controller.ts:126`

### Qué es y para qué sirve (negocio)

Planificar los checks requeridos del caso. Dentro del módulo (descripción del modelo, en inglés): «Verifies patients, practitioners, representatives and organization operators against authoritative ministries, civil registries, professional boards and government data platforms.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_27_identity_assurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /identity/verification-cases/{id}/checks:plan` la atiende `IdentityCasesController.planChecks` (src/modules/identity_assurance/controllers/identity-cases.controller.ts:126). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `PlanChecksDto` (4 campos, 2 obligatorios). Delega en `IdentityCasesService.planChecks`. Crea filas en identity_assurance.identity_checks. Lee identity_assurance.identity_verification_cases.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/identity_assurance/controllers/identity-cases.controller.ts:126` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/identity_assurance/controllers/identity-cases.controller.ts:126` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `identity_assurance.identity_checks` | ESCRIBE | CREA | DIRECTA | IdentityCasesController.planChecks → IdentityCasesService.planChecks → IdentityChecksRepository.create | `src/modules/identity_assurance/repositories/identity-checks.repository.ts:152` |
| `identity_assurance.identity_verification_cases` | LEE | LEE | DIRECTA | IdentityCasesController.planChecks → IdentityCasesService.planChecks → IdentityCasesService.loadCase → IdentityVerificationCasesRepository.findById | `src/modules/identity_assurance/repositories/identity-cases.repository.ts:64` |

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
| 404 | `NOT_FOUND` | ResourceNotFoundException: Caso de verificación no encontrado |
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

## 17. POST /identity/verification-cases/{id}/evidence

- **Origen:** CONTRATO
- **Nombre:** Aportar evidencia documental bajo consentimiento
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IdentityCasesController.submitEvidence` — `src/modules/identity_assurance/controllers/identity-cases.controller.ts:113`

### Qué es y para qué sirve (negocio)

Aportar evidencia documental bajo consentimiento. Dentro del módulo (descripción del modelo, en inglés): «Verifies patients, practitioners, representatives and organization operators against authoritative ministries, civil registries, professional boards and government data platforms.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_27_identity_assurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /identity/verification-cases/{id}/evidence` la atiende `IdentityCasesController.submitEvidence` (src/modules/identity_assurance/controllers/identity-cases.controller.ts:113). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `SubmitEvidenceDto` (7 campos, 1 obligatorio). Delega en `IdentityCasesService.submitEvidence`. Crea filas en identity_assurance.identity_evidence_records. Lee identity_assurance.identity_verification_cases.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/identity_assurance/controllers/identity-cases.controller.ts:113` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/identity_assurance/controllers/identity-cases.controller.ts:113` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `identity_assurance.identity_evidence_records` | ESCRIBE | CREA | DIRECTA | IdentityCasesController.submitEvidence → IdentityCasesService.submitEvidence → IdentityEvidenceRecordsRepository.create | `src/modules/identity_assurance/repositories/identity-evidence.repository.ts:68` |
| `identity_assurance.identity_verification_cases` | LEE | LEE | DIRECTA | IdentityCasesController.submitEvidence → IdentityCasesService.submitEvidence → IdentityCasesService.loadCase → IdentityVerificationCasesRepository.findById | `src/modules/identity_assurance/repositories/identity-cases.repository.ts:64` |

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
| 404 | `NOT_FOUND` | ResourceNotFoundException: Caso de verificación no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El caso no admite evidencia en su estado actual |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/identity_assurance.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/identity_assurance/controllers/identity-cases.controller.spec.ts:44` |

### Flujos

- src / modules / identity assurance — etapa `ctrl:IdentityCasesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 18. POST /identity/verification-cases/{id}/fraud-signals

- **Origen:** CONTRATO
- **Nombre:** Detectar y registrar una señal de fraude
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IdentityCasesController.raiseFraudSignal` — `src/modules/identity_assurance/controllers/identity-cases.controller.ts:139`

### Qué es y para qué sirve (negocio)

Detectar y registrar una señal de fraude. Dentro del módulo (descripción del modelo, en inglés): «Verifies patients, practitioners, representatives and organization operators against authoritative ministries, civil registries, professional boards and government data platforms.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_27_identity_assurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /identity/verification-cases/{id}/fraud-signals` la atiende `IdentityCasesController.raiseFraudSignal` (src/modules/identity_assurance/controllers/identity-cases.controller.ts:139). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `RaiseFraudSignalDto` (5 campos, 2 obligatorios). Delega en `IdentityCasesService.raiseFraudSignal`. Crea filas en identity_assurance.identity_fraud_signals. Lee identity_assurance.identity_verification_cases.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/identity_assurance/controllers/identity-cases.controller.ts:139` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/identity_assurance/controllers/identity-cases.controller.ts:139` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `identity_assurance.identity_fraud_signals` | ESCRIBE | CREA | DIRECTA | IdentityCasesController.raiseFraudSignal → IdentityCasesService.raiseFraudSignal → IdentityFraudSignalsRepository.create | `src/modules/identity_assurance/repositories/identity-fraud-signals.repository.ts:52` |
| `identity_assurance.identity_verification_cases` | LEE | LEE | DIRECTA | IdentityCasesController.raiseFraudSignal → IdentityCasesService.raiseFraudSignal → IdentityCasesService.loadCase → IdentityVerificationCasesRepository.findById | `src/modules/identity_assurance/repositories/identity-cases.repository.ts:64` |

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
| 404 | `NOT_FOUND` | ResourceNotFoundException: Caso de verificación no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/identity_assurance.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/identity_assurance/controllers/identity-cases.controller.spec.ts:68` |

### Flujos

- src / modules / identity assurance — etapa `ctrl:IdentityCasesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 19. POST /identity/verification-cases/{id}/manual-review

- **Origen:** CONTRATO
- **Nombre:** Escalar el caso a revisión manual
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IdentityCasesController.openManualReview` — `src/modules/identity_assurance/controllers/identity-cases.controller.ts:152`

### Qué es y para qué sirve (negocio)

Escalar el caso a revisión manual. Dentro del módulo (descripción del modelo, en inglés): «Verifies patients, practitioners, representatives and organization operators against authoritative ministries, civil registries, professional boards and government data platforms.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_27_identity_assurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /identity/verification-cases/{id}/manual-review` la atiende `IdentityCasesController.openManualReview` (src/modules/identity_assurance/controllers/identity-cases.controller.ts:152). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `OpenManualReviewDto` (2 campos, 1 obligatorio). Delega en `IdentityCasesService.openManualReview`. Crea filas en identity_assurance.identity_manual_review_cases. Lee identity_assurance.identity_manual_review_cases, identity_assurance.identity_verification_cases.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/identity_assurance/controllers/identity-cases.controller.ts:152` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/identity_assurance/controllers/identity-cases.controller.ts:152` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `identity_assurance.identity_manual_review_cases` | ESCRIBE | CREA | DIRECTA | IdentityCasesController.openManualReview → IdentityCasesService.openManualReview → IdentityManualReviewCasesRepository.create | `src/modules/identity_assurance/repositories/identity-manual-review.repository.ts:81` |
| `identity_assurance.identity_manual_review_cases` | LEE | LEE | DIRECTA | IdentityCasesController.openManualReview → IdentityCasesService.openManualReview → IdentityManualReviewCasesRepository.countOpenByCase | `src/modules/identity_assurance/repositories/identity-manual-review.repository.ts:64` |
| `identity_assurance.identity_verification_cases` | LEE | LEE | DIRECTA | IdentityCasesController.openManualReview → IdentityCasesService.openManualReview → IdentityCasesService.loadCase → IdentityVerificationCasesRepository.findById | `src/modules/identity_assurance/repositories/identity-cases.repository.ts:64` |

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
| 404 | `NOT_FOUND` | ResourceNotFoundException: Caso de verificación no encontrado |
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

## 20. POST /identity/verification-cases/expire-sweep

- **Origen:** CONTRATO
- **Nombre:** Expirar por lote los casos vencidos (job programado)
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IdentityCasesController.expireSweep` — `src/modules/identity_assurance/controllers/identity-cases.controller.ts:88`

### Qué es y para qué sirve (negocio)

Expirar por lote los casos vencidos (job programado). Dentro del módulo (descripción del modelo, en inglés): «Verifies patients, practitioners, representatives and organization operators against authoritative ministries, civil registries, professional boards and government data platforms.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_27_identity_assurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /identity/verification-cases/expire-sweep` la atiende `IdentityCasesController.expireSweep` (src/modules/identity_assurance/controllers/identity-cases.controller.ts:88). Exige sesión con alguno de los roles SYSTEM, SECURITY_ADMIN. Delega en `IdentityCasesService.expireSweep`. Crea filas en audit.verified_badges_history. Actualiza community.public_profiles, community.verified_badges, identity_assurance.identity_checks, identity_assurance.identity_verification_cases. Lee community.public_profiles, community.verified_badges, identity_assurance.identity_checks, identity_assurance.identity_verification_cases, profiles.jurisdiction_authorizations.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, SECURITY_ADMIN | `src/modules/identity_assurance/controllers/identity-cases.controller.ts:88` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.verified_badges_history` | ESCRIBE | CREA | DIRECTA | IdentityCasesController.expireSweep → IdentityCasesService.expireSweep → IdentityVerificationEffectsService.applyRevoked → CommunityVerificationService.applyRevoked → CommunityVerificationService.revokeProfileBadges → VerifiedBadgesRepository.recordHistory | `src/modules/community/repositories/verified-badges.repository.ts:172` |
| `community.public_profiles` | ESCRIBE | ACTUALIZA | POR_TIPO | IdentityCasesController.expireSweep → IdentityCasesService.expireSweep → IdentityVerificationEffectsService.applyRevoked → CommunityVerificationService.applyRevoked → CommunityVerificationService.revokeProfileBadges | `src/modules/community/services/community-verification.service.ts:249` |
| `community.public_profiles` | LEE | LEE | DIRECTA | IdentityCasesController.expireSweep → IdentityCasesService.expireSweep → IdentityVerificationEffectsService.applyRevoked → CommunityVerificationService.applyRevoked → VerifiedBadgesRepository.findProfileByTarget | `src/modules/community/repositories/verified-badges.repository.ts:205` |
| `community.verified_badges` | ESCRIBE | ACTUALIZA | POR_TIPO | IdentityCasesController.expireSweep → IdentityCasesService.expireSweep → IdentityVerificationEffectsService.applyRevoked → CommunityVerificationService.applyRevoked → CommunityVerificationService.revokeProfileBadges → VerifiedBadgesRepository.revoke | `src/modules/community/repositories/verified-badges.repository.ts:140` |
| `community.verified_badges` | LEE | LEE | DIRECTA | IdentityCasesController.expireSweep → IdentityCasesService.expireSweep → IdentityVerificationEffectsService.applyRevoked → CommunityVerificationService.applyRevoked → CommunityVerificationService.revokeProfileBadges → VerifiedBadgesRepository.findAllBySubject | `src/modules/community/repositories/verified-badges.repository.ts:73` |
| `identity_assurance.identity_checks` | ESCRIBE | ACTUALIZA | POR_TIPO | IdentityCasesController.expireSweep → IdentityCasesService.expireSweep | `src/modules/identity_assurance/services/identity-cases.service.ts:484` |
| `identity_assurance.identity_checks` | LEE | LEE | DIRECTA | IdentityCasesController.expireSweep → IdentityCasesService.expireSweep → IdentityChecksRepository.findPendingByCase | `src/modules/identity_assurance/repositories/identity-checks.repository.ts:173` |
| `identity_assurance.identity_verification_cases` | ESCRIBE | ACTUALIZA | POR_TIPO | IdentityCasesController.expireSweep → IdentityCasesService.expireSweep | `src/modules/identity_assurance/services/identity-cases.service.ts:476` |
| `identity_assurance.identity_verification_cases` | LEE | LEE | DIRECTA | IdentityCasesController.expireSweep → IdentityCasesService.expireSweep → IdentityVerificationCasesRepository.findExpirable | `src/modules/identity_assurance/repositories/identity-cases.repository.ts:177` |
| `profiles.jurisdiction_authorizations` | LEE | LEE | DIRECTA | IdentityCasesController.expireSweep → IdentityCasesService.expireSweep → IdentityVerificationEffectsService.applyRevoked → IdentityVerificationEffectsService.publicSubjectOf → JurisdictionAuthorizationsRepository.findById | `src/modules/profiles/repositories/jurisdiction-authorizations.repository.ts:60` |

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

## 21. POST /identity/verification-policies

- **Origen:** CONTRATO
- **Nombre:** Crear una política de verificación de identidad (IAL/AAL)
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IdentityPoliciesController.create` — `src/modules/identity_assurance/controllers/identity-policies.controller.ts:26`

### Qué es y para qué sirve (negocio)

Crear una política de verificación de identidad (IAL/AAL). Dentro del módulo (descripción del modelo, en inglés): «Verifies patients, practitioners, representatives and organization operators against authoritative ministries, civil registries, professional boards and government data platforms.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_27_identity_assurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /identity/verification-policies` la atiende `IdentityPoliciesController.create` (src/modules/identity_assurance/controllers/identity-policies.controller.ts:26). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreatePolicyDto` (9 campos, 4 obligatorios). Delega en `IdentityPoliciesService.createPolicy`. Crea filas en identity_assurance.identity_verification_policies.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/identity_assurance/controllers/identity-policies.controller.ts:26` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

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

## 22. POST /internal/identity/checks/{id}/attempts

- **Origen:** CONTRATO
- **Nombre:** Registrar el intento del worker contra la autoridad externa
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IdentityWorkerController.recordAttempt` — `src/modules/identity_assurance/controllers/identity-worker.controller.ts:61`

### Qué es y para qué sirve (negocio)

Registrar el intento del worker contra la autoridad externa. Dentro del módulo (descripción del modelo, en inglés): «Verifies patients, practitioners, representatives and organization operators against authoritative ministries, civil registries, professional boards and government data platforms.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_27_identity_assurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /internal/identity/checks/{id}/attempts` la atiende `IdentityWorkerController.recordAttempt` (src/modules/identity_assurance/controllers/identity-worker.controller.ts:61). Exige sesión con alguno de los roles SYSTEM, SECURITY_ADMIN. Valida el cuerpo como `IdentityAssuranceRecordAttemptDto` (7 campos, 1 obligatorio). Delega en `IdentityChecksService.recordAttempt`. Crea filas en identity_assurance.identity_verification_attempts. Actualiza identity_assurance.identity_checks. Lee identity_assurance.identity_checks, identity_assurance.identity_verification_attempts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, SECURITY_ADMIN | `src/modules/identity_assurance/controllers/identity-worker.controller.ts:61` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/identity_assurance/controllers/identity-worker.controller.ts:61` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `identity_assurance.identity_checks` | ESCRIBE | ACTUALIZA | POR_TIPO | IdentityWorkerController.recordAttempt → IdentityChecksService.recordAttempt | `src/modules/identity_assurance/services/identity-checks.service.ts:226` |
| `identity_assurance.identity_checks` | LEE | LEE | DIRECTA | IdentityWorkerController.recordAttempt → IdentityChecksService.recordAttempt → IdentityChecksService.loadCheck → IdentityChecksRepository.findById | `src/modules/identity_assurance/repositories/identity-checks.repository.ts:141` |
| `identity_assurance.identity_verification_attempts` | ESCRIBE | CREA | DIRECTA | IdentityWorkerController.recordAttempt → IdentityChecksService.recordAttempt → IdentityVerificationAttemptsRepository.create | `src/modules/identity_assurance/repositories/identity-checks.repository.ts:341` |
| `identity_assurance.identity_verification_attempts` | LEE | LEE | DIRECTA | IdentityWorkerController.recordAttempt → IdentityChecksService.recordAttempt → IdentityVerificationAttemptsRepository.countByCase | `src/modules/identity_assurance/repositories/identity-checks.repository.ts:277` |

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
| INTEGRACION | `test/integration/identity-verification-self-service.int-spec.ts:117` |

### Flujos

- src / modules / identity assurance — etapa `ctrl:IdentityWorkerController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 23. POST /internal/identity/checks/{id}/results

- **Origen:** CONTRATO
- **Nombre:** Registrar el veredicto que devolvió la autoridad externa
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IdentityWorkerController.recordResult` — `src/modules/identity_assurance/controllers/identity-worker.controller.ts:79`

### Qué es y para qué sirve (negocio)

Registrar el veredicto que devolvió la autoridad externa. Dentro del módulo (descripción del modelo, en inglés): «Verifies patients, practitioners, representatives and organization operators against authoritative ministries, civil registries, professional boards and government data platforms.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_27_identity_assurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /internal/identity/checks/{id}/results` la atiende `IdentityWorkerController.recordResult` (src/modules/identity_assurance/controllers/identity-worker.controller.ts:79). Exige sesión con alguno de los roles SYSTEM, SECURITY_ADMIN. Valida el cuerpo como `RecordResultDto` (4 campos, 1 obligatorio). Delega en `IdentityChecksService.recordResult`. Crea filas en audit.verified_badges_history, community.verified_badges, identity_assurance.identity_assertions, identity_assurance.identity_check_results. Actualiza community.public_profiles, community.verified_badges, directory.tenants, identity_assurance.identity_checks, identity_assurance.identity_verification_attempts, identity_assurance.identity_verification_cases, profiles.health_practitioner_profiles, profiles.jurisdiction_authorizations. Lee community.public_profiles, community.verified_badges, directory.tenants, identity_assurance.identity_authority_endpoints, identity_assurance.identity_check_results, identity_assurance.identity_checks, identity_assurance.identity_verification_attempts, identity_assurance.identity_verification_cases y 2 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, SECURITY_ADMIN | `src/modules/identity_assurance/controllers/identity-worker.controller.ts:79` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/identity_assurance/controllers/identity-worker.controller.ts:79` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.verified_badges_history` | ESCRIBE | CREA | DIRECTA | IdentityWorkerController.recordResult → IdentityChecksService.recordResult → IdentityChecksService.settleCase → IdentityChecksService.verifyCase → IdentityVerificationEffectsService.applyVerified → IdentityVerificationEffectsService.activateLicense → CommunityVerificationService.applyVerified → VerifiedBadgesRepository.recordHistory | `src/modules/community/repositories/verified-badges.repository.ts:172` |
| `community.public_profiles` | ESCRIBE | ACTUALIZA | POR_TIPO | IdentityWorkerController.recordResult → IdentityChecksService.recordResult → IdentityChecksService.settleCase → IdentityChecksService.verifyCase → IdentityVerificationEffectsService.applyVerified → IdentityVerificationEffectsService.activateLicense → CommunityVerificationService.applyVerified | `src/modules/community/services/community-verification.service.ts:175` |
| `community.public_profiles` | LEE | LEE | DIRECTA | IdentityWorkerController.recordResult → IdentityChecksService.recordResult → IdentityChecksService.settleCase → IdentityChecksService.verifyCase → IdentityVerificationEffectsService.applyVerified → IdentityVerificationEffectsService.activateLicense → CommunityVerificationService.applyVerified → VerifiedBadgesRepository.findProfileByTarget | `src/modules/community/repositories/verified-badges.repository.ts:205` |
| `community.verified_badges` | ESCRIBE | ACTUALIZA | POR_TIPO | IdentityWorkerController.recordResult → IdentityChecksService.recordResult → IdentityChecksService.settleCase → IdentityChecksService.verifyCase → IdentityVerificationEffectsService.applyVerified → IdentityVerificationEffectsService.activateLicense → CommunityVerificationService.applyVerified → VerifiedBadgesRepository.grant | `src/modules/community/repositories/verified-badges.repository.ts:94` |
| `community.verified_badges` | ESCRIBE | CREA | DIRECTA | IdentityWorkerController.recordResult → IdentityChecksService.recordResult → IdentityChecksService.settleCase → IdentityChecksService.verifyCase → IdentityVerificationEffectsService.applyVerified → IdentityVerificationEffectsService.activateLicense → CommunityVerificationService.applyVerified → VerifiedBadgesRepository.grant | `src/modules/community/repositories/verified-badges.repository.ts:103` |
| `community.verified_badges` | LEE | LEE | DIRECTA | IdentityWorkerController.recordResult → IdentityChecksService.recordResult → IdentityChecksService.settleCase → IdentityChecksService.verifyCase → IdentityVerificationEffectsService.applyVerified → IdentityVerificationEffectsService.activateLicense → CommunityVerificationService.applyVerified → VerifiedBadgesRepository.findActive | `src/modules/community/repositories/verified-badges.repository.ts:61` |
| `directory.tenants` | ESCRIBE | ACTUALIZA | POR_TIPO | IdentityWorkerController.recordResult → IdentityChecksService.recordResult → IdentityChecksService.settleCase → IdentityChecksService.verifyCase → IdentityVerificationEffectsService.applyVerified → IdentityVerificationEffectsService.verifyTenant | `src/modules/identity_assurance/services/identity-verification-effects.service.ts:249` |
| `directory.tenants` | LEE | LEE | DIRECTA | IdentityWorkerController.recordResult → IdentityChecksService.recordResult → IdentityChecksService.settleCase → IdentityChecksService.verifyCase → IdentityVerificationEffectsService.applyVerified → IdentityVerificationEffectsService.verifyTenant → TenantsRepository.findById | `src/modules/directory/repositories/tenants.repository.ts:71` |
| `identity_assurance.identity_assertions` | ESCRIBE | CREA | DIRECTA | IdentityWorkerController.recordResult → IdentityChecksService.recordResult → IdentityChecksService.settleCase → IdentityChecksService.verifyCase → IdentityChecksService.issueAssertion → IdentityAssertionsRepository.create | `src/modules/identity_assurance/repositories/identity-assertions.repository.ts:132` |
| `identity_assurance.identity_authority_endpoints` | LEE | LEE | DIRECTA | IdentityWorkerController.recordResult → IdentityChecksService.recordResult → IdentityChecksService.settleCase → IdentityChecksService.verifyCase → IdentityChecksService.issueAssertion → IdentityAuthorityEndpointsRepository.findById | `src/modules/identity_assurance/repositories/identity-authorities.repository.ts:140` |
| `identity_assurance.identity_check_results` | ESCRIBE | CREA | DIRECTA | IdentityWorkerController.recordResult → IdentityChecksService.recordResult → IdentityCheckResultsRepository.create | `src/modules/identity_assurance/repositories/identity-checks.repository.ts:396` |
| `identity_assurance.identity_check_results` | LEE | LEE | DIRECTA | IdentityWorkerController.recordResult → IdentityChecksService.recordResult → IdentityCheckResultsRepository.findLatestByCheck | `src/modules/identity_assurance/repositories/identity-checks.repository.ts:381` |
| `identity_assurance.identity_checks` | ESCRIBE | ACTUALIZA | POR_TIPO | IdentityWorkerController.recordResult → IdentityChecksService.recordResult | `src/modules/identity_assurance/services/identity-checks.service.ts:284` |
| `identity_assurance.identity_checks` | LEE | LEE | DIRECTA | IdentityWorkerController.recordResult → IdentityChecksService.recordResult → IdentityChecksService.loadCheck → IdentityChecksRepository.findById | `src/modules/identity_assurance/repositories/identity-checks.repository.ts:141` |
| `identity_assurance.identity_verification_attempts` | ESCRIBE | ACTUALIZA | POR_TIPO | IdentityWorkerController.recordResult → IdentityChecksService.recordResult → IdentityChecksService.completeInFlightAttempt | `src/modules/identity_assurance/services/identity-checks.service.ts:333` |
| `identity_assurance.identity_verification_attempts` | LEE | LEE | DIRECTA | IdentityWorkerController.recordResult → IdentityChecksService.recordResult → IdentityVerificationAttemptsRepository.existsCompletedForCase | `src/modules/identity_assurance/repositories/identity-checks.repository.ts:287` |
| `identity_assurance.identity_verification_cases` | ESCRIBE | ACTUALIZA | POR_TIPO | IdentityWorkerController.recordResult → IdentityChecksService.recordResult → IdentityChecksService.settleCase | `src/modules/identity_assurance/services/identity-checks.service.ts:376` |
| `identity_assurance.identity_verification_cases` | LEE | LEE | DIRECTA | IdentityWorkerController.recordResult → IdentityChecksService.recordResult → IdentityChecksService.settleCase → IdentityVerificationCasesRepository.findById | `src/modules/identity_assurance/repositories/identity-cases.repository.ts:64` |
| `profiles.health_practitioner_profiles` | ESCRIBE | ACTUALIZA | POR_TIPO | IdentityWorkerController.recordResult → IdentityChecksService.recordResult → IdentityChecksService.settleCase → IdentityChecksService.verifyCase → IdentityVerificationEffectsService.applyVerified → IdentityVerificationEffectsService.activateLicense | `src/modules/identity_assurance/services/identity-verification-effects.service.ts:198` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | IdentityWorkerController.recordResult → IdentityChecksService.recordResult → IdentityChecksService.settleCase → IdentityChecksService.verifyCase → IdentityVerificationEffectsService.applyVerified → IdentityVerificationEffectsService.activateLicense → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/repositories/health-practitioner-profiles.repository.ts:64` |
| `profiles.jurisdiction_authorizations` | ESCRIBE | ACTUALIZA | POR_TIPO | IdentityWorkerController.recordResult → IdentityChecksService.recordResult → IdentityChecksService.settleCase → IdentityChecksService.verifyCase → IdentityVerificationEffectsService.applyVerified → IdentityVerificationEffectsService.activateLicense | `src/modules/identity_assurance/services/identity-verification-effects.service.ts:188` |
| `profiles.jurisdiction_authorizations` | LEE | LEE | DIRECTA | IdentityWorkerController.recordResult → IdentityChecksService.recordResult → IdentityChecksService.settleCase → IdentityChecksService.verifyCase → IdentityVerificationEffectsService.applyVerified → IdentityVerificationEffectsService.activateLicense → JurisdictionAuthorizationsRepository.findById | `src/modules/profiles/repositories/jurisdiction-authorizations.repository.ts:60` |

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
| INTEGRACION | `test/integration/identity-verification-self-service.int-spec.ts:136` |

### Flujos

- src / modules / identity assurance — etapa `ctrl:IdentityWorkerController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 24. GET /internal/identity/checks/dispatchable

- **Origen:** CONTRATO
- **Nombre:** Listar los checks que el worker debe atender en este tick
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IdentityWorkerController.listDispatchable` — `src/modules/identity_assurance/controllers/identity-worker.controller.ts:49`

### Qué es y para qué sirve (negocio)

Listar los checks que el worker debe atender en este tick. Dentro del módulo (descripción del modelo, en inglés): «Verifies patients, practitioners, representatives and organization operators against authoritative ministries, civil registries, professional boards and government data platforms.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_27_identity_assurance.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /internal/identity/checks/dispatchable` la atiende `IdentityWorkerController.listDispatchable` (src/modules/identity_assurance/controllers/identity-worker.controller.ts:49). Exige sesión con alguno de los roles SYSTEM, SECURITY_ADMIN. Delega en `IdentityChecksService.listDispatchable`. Lee identity_assurance.identity_checks, identity_assurance.identity_verification_attempts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, SECURITY_ADMIN | `src/modules/identity_assurance/controllers/identity-worker.controller.ts:49` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_QUERY | limit (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `identity_assurance.identity_checks` | LEE | LEE | DIRECTA | IdentityWorkerController.listDispatchable → IdentityChecksService.listDispatchable → IdentityChecksRepository.findDispatchable | `src/modules/identity_assurance/repositories/identity-checks.repository.ts:258` |
| `identity_assurance.identity_verification_attempts` | LEE | LEE | DIRECTA | IdentityWorkerController.listDispatchable → IdentityChecksService.listDispatchable → IdentityVerificationAttemptsRepository.findLatestByCase | `src/modules/identity_assurance/repositories/identity-checks.repository.ts:323` |

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

