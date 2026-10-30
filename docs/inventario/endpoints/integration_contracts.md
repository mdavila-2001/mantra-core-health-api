<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `integration_contracts`

- **Bloque:** Integraciones y Contratos (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:33`)
- **Operaciones:** 12 (12 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 0 · MEDIO 12 · BAJO 0
- **Tablas distintas que tocan:** 9
- **Respuestas de error y detalle contractual:** `openapi/endpoints/integration-contracts.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | POST | `/integration/contracts` | Definir un contrato de integración | MEDIO | 2 | SECURITY_ADMIN |
| 2 | POST | `/integration/contracts/{id}/auth-profiles` | Configurar perfil de autenticación sender-constrained | MEDIO | 2 | SECURITY_ADMIN |
| 3 | POST | `/integration/contracts/{id}/auth-profiles/{apId}/rotate` | Rotar las credenciales de un perfil de autenticación | MEDIO | 3 | SECURITY_ADMIN |
| 4 | POST | `/integration/contracts/{id}/exchanges` | Ejecutar un intercambio idempotente (inbound) | MEDIO | 6 | SECURITY_ADMIN |
| 5 | POST | `/integration/contracts/{id}/exchanges/{recordId}/attempts` | Registrar un intento de intercambio outbound | MEDIO | 7 | SECURITY_ADMIN |
| 6 | POST | `/integration/contracts/{id}/retire` | Retirar el contrato (soft-delete lógico) | MEDIO | 3 | SECURITY_ADMIN |
| 7 | POST | `/integration/contracts/{id}/sync-cursors/{scope}/advance` | Avanzar el cursor de sincronización | MEDIO | 4 | SECURITY_ADMIN |
| 8 | POST | `/integration/contracts/{id}/versions` | Publicar una nueva versión de contrato | MEDIO | 3 | SECURITY_ADMIN |
| 9 | POST | `/integration/contracts/{id}/versions/{versionId}/activate` | Activar una versión y transicionar el estado del contrato | MEDIO | 3 | SECURITY_ADMIN |
| 10 | POST | `/integration/contracts/{id}/webhook-subscriptions` | Suscribir un webhook al contrato | MEDIO | 3 | SECURITY_ADMIN |
| 11 | POST | `/integration/exchanges/{recordId}/retry` | Reintentar un intercambio fallido | MEDIO | 7 | SECURITY_ADMIN |
| 12 | POST | `/integration/webhooks/{subscriptionId}/deliveries` | Entregar y verificar un webhook firmado | MEDIO | 5 | SECURITY_ADMIN |

---

## 1. POST /integration/contracts

- **Origen:** CONTRATO
- **Nombre:** Definir un contrato de integración
- **Bloque:** Integraciones y Contratos
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IntegrationContractsController.createContract` — `src/modules/integration_contracts/controllers/integration-contracts.controller.ts:71`

### Qué es y para qué sirve (negocio)

Definir un contrato de integración. Caso de uso UC-31-01: Definir contrato (DRAFT). Dentro del módulo (descripción del modelo, en inglés): «Supports ministries, government data centers, insurers, pharmacies, diagnostic units and other external systems through versioned contracts, sender-constrained authentication, idempotency and complete exchange evidence.» Dominio: Integraciones y Contratos.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/integration_contracts/README.md:45`) · MODELO (`Mantra Core Health Context/modules/diagram_31_integration_contracts.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:33`)

### Cómo se atiende (sistema)

`POST /integration/contracts` la atiende `IntegrationContractsController.createContract` (src/modules/integration_contracts/controllers/integration-contracts.controller.ts:71). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `IntegrationContractsCreateContractDto` (7 campos, 2 obligatorios). Delega en `IntegrationContractsService.createContract`. Crea filas en integration_contracts.integration_contracts. Lee integration_contracts.integration_contracts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/integration_contracts/controllers/integration-contracts.controller.ts:71` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:278` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:145` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `integration_contracts.integration_contracts` | ESCRIBE | CREA | DIRECTA | IntegrationContractsController.createContract → IntegrationContractsService.createContract → IntegrationContractsService.persistContract → ContractsRepository.create | `src/modules/integration_contracts/repositories/contracts.repository.ts:104` |
| `integration_contracts.integration_contracts` | LEE | LEE | DIRECTA | IntegrationContractsController.createContract → IntegrationContractsService.createContract → IntegrationContractsService.persistContract → ContractsRepository.findByCodeAndProvider | `src/modules/integration_contracts/repositories/contracts.repository.ts:95` |

### Cuerpo — DTO `IntegrationContractsCreateContractDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `externalProviderId` | `string` | Sí | formato uuid | `@IsUUID()` | Proveedor externo dueño del contrato | `src/modules/integration_contracts/dto/create-contract.dto.ts:21` |
| `contractCode` | `string` | Sí | longitud mínima 1; longitud máxima 100 | `@IsString()` `@MinLength(1)` `@MaxLength(100)` | Código único del contrato por proveedor/tenant | `src/modules/integration_contracts/dto/create-contract.dto.ts:33` |
| `capabilityConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concepto de capacidad del contrato | `src/modules/integration_contracts/dto/create-contract.dto.ts:44` |
| `dataClassificationConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concepto de clasificación de datos | `src/modules/integration_contracts/dto/create-contract.dto.ts:55` |
| `legalBasisConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concepto de base legal de tratamiento | `src/modules/integration_contracts/dto/create-contract.dto.ts:66` |
| `allowedPurposeValueSetId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Value set de propósitos permitidos | `src/modules/integration_contracts/dto/create-contract.dto.ts:77` |
| `dataUseAgreementId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Acuerdo de uso de datos (DUA) | `src/modules/integration_contracts/dto/create-contract.dto.ts:88` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "externalProviderId": "00000000-0000-4000-8000-000000000001",
  "contractCode": "CODIGO_EJEMPLO"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "externalProviderId": "00000000-0000-4000-8000-000000000001",
  "contractCode": "CODIGO_EJEMPLO",
  "capabilityConceptId": "00000000-0000-4000-8000-000000000001",
  "dataClassificationConceptId": "00000000-0000-4000-8000-000000000001",
  "legalBasisConceptId": "00000000-0000-4000-8000-000000000001",
  "allowedPurposeValueSetId": "00000000-0000-4000-8000-000000000001",
  "dataUseAgreementId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<ContractResponseDto>` · DTO `ContractResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/integration_contracts/dto/responses.dto.ts:9` |
| `contractCode` | `string` | Sí | — | — | Valor de contract code mantenido por la instancia. | `src/modules/integration_contracts/dto/responses.dto.ts:15` |
| `externalProviderId` | `string` | Sí | formato uuid | — | Identificador asociado a external provider. | `src/modules/integration_contracts/dto/responses.dto.ts:21` |
| `status` | `string` | Sí | formato uuid | — | Concepto de estado del contrato | `src/modules/integration_contracts/dto/responses.dto.ts:30` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/integration_contracts/dto/responses.dto.ts:36` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: El código de contrato ya existe para el proveedor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/integration_contracts.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/integration_contracts/controllers/integration-contracts.controller.spec.ts:54` |

### Flujos

- Módulo 31 — Governed Backend-to-Backend Contracts (`integration_contracts`) — etapa `UC-31-01`

---

## 2. POST /integration/contracts/{id}/auth-profiles

- **Origen:** CONTRATO
- **Nombre:** Configurar perfil de autenticación sender-constrained
- **Bloque:** Integraciones y Contratos
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IntegrationContractsController.configureAuthProfile` — `src/modules/integration_contracts/controllers/integration-contracts.controller.ts:124`

### Qué es y para qué sirve (negocio)

Configurar perfil de autenticación sender-constrained. Caso de uso UC-31-03: Configurar perfil de autenticación (ACTIVE). Dentro del módulo (descripción del modelo, en inglés): «Supports ministries, government data centers, insurers, pharmacies, diagnostic units and other external systems through versioned contracts, sender-constrained authentication, idempotency and complete exchange evidence.» Dominio: Integraciones y Contratos.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/integration_contracts/README.md:47`) · MODELO (`Mantra Core Health Context/modules/diagram_31_integration_contracts.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:33`)

### Cómo se atiende (sistema)

`POST /integration/contracts/{id}/auth-profiles` la atiende `IntegrationContractsController.configureAuthProfile` (src/modules/integration_contracts/controllers/integration-contracts.controller.ts:124). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateAuthProfileDto` (9 campos, 0 obligatorios). Delega en `IntegrationAuthProfilesService.configure`. Crea filas en integration_contracts.integration_auth_profiles. Lee integration_contracts.integration_contracts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/integration_contracts/controllers/integration-contracts.controller.ts:124` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:278` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/integration_contracts/controllers/integration-contracts.controller.ts:124` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:145` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `integration_contracts.integration_auth_profiles` | ESCRIBE | CREA | DIRECTA | IntegrationContractsController.configureAuthProfile → IntegrationAuthProfilesService.configure → AuthProfilesRepository.create | `src/modules/integration_contracts/repositories/auth-profiles.repository.ts:74` |
| `integration_contracts.integration_contracts` | LEE | LEE | DIRECTA | IntegrationContractsController.configureAuthProfile → IntegrationAuthProfilesService.configure → ContractsRepository.findByIdInTenant | `src/modules/integration_contracts/repositories/contracts.repository.ts:69` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateAuthProfileDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `authProfileConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concepto de tipo de perfil de autenticación | `src/modules/integration_contracts/dto/create-auth-profile.dto.ts:21` |
| `oauthIssuerUri` | `string` | No | longitud máxima 2048 | `@IsOptional()` `@IsString()` `@MaxLength(2048)` | URI del emisor OAuth2 | `src/modules/integration_contracts/dto/create-auth-profile.dto.ts:33` |
| `clientIdentifier` | `string` | No | longitud máxima 255 | `@IsOptional()` `@IsString()` `@MaxLength(255)` | Identificador de cliente OAuth2 | `src/modules/integration_contracts/dto/create-auth-profile.dto.ts:45` |
| `credentialSecretReference` | `string` | No | longitud máxima 2048 | `@IsOptional()` `@IsString()` `@MaxLength(2048)` | Referencia al secreto en secret-manager (nunca plaintext) | `src/modules/integration_contracts/dto/create-auth-profile.dto.ts:57` |
| `tokenBindingConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concepto de token binding (DPoP/mTLS) | `src/modules/integration_contracts/dto/create-auth-profile.dto.ts:68` |
| `mtlsCertificateReference` | `string` | No | longitud máxima 2048 | `@IsOptional()` `@IsString()` `@MaxLength(2048)` | Referencia al certificado mTLS | `src/modules/integration_contracts/dto/create-auth-profile.dto.ts:80` |
| `dpopKeyReference` | `string` | No | longitud máxima 2048 | `@IsOptional()` `@IsString()` `@MaxLength(2048)` | Referencia a la clave DPoP | `src/modules/integration_contracts/dto/create-auth-profile.dto.ts:92` |
| `scopesJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Scopes OAuth2 en JSON | `src/modules/integration_contracts/dto/create-auth-profile.dto.ts:100` |
| `audience` | `string` | No | longitud máxima 255 | `@IsOptional()` `@IsString()` `@MaxLength(255)` | Audience del token | `src/modules/integration_contracts/dto/create-auth-profile.dto.ts:109` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "authProfileConceptId": "00000000-0000-4000-8000-000000000001",
  "oauthIssuerUri": "valor-ejemplo",
  "clientIdentifier": "valor-ejemplo",
  "credentialSecretReference": "valor-ejemplo",
  "tokenBindingConceptId": "00000000-0000-4000-8000-000000000001",
  "mtlsCertificateReference": "valor-ejemplo",
  "dpopKeyReference": "valor-ejemplo",
  "scopesJson": {},
  "audience": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<AuthProfileResponseDto>` · DTO `AuthProfileResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/integration_contracts/dto/responses.dto.ts:81` |
| `integrationContractId` | `string` | Sí | formato uuid | — | Identificador asociado a integration contract. | `src/modules/integration_contracts/dto/responses.dto.ts:87` |
| `status` | `string` | Sí | formato uuid | — | Concepto de estado del perfil | `src/modules/integration_contracts/dto/responses.dto.ts:93` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/integration_contracts.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/integration_contracts/controllers/integration-contracts.controller.spec.ts:85` |

### Flujos

- Módulo 31 — Governed Backend-to-Backend Contracts (`integration_contracts`) — etapa `UC-31-03`

---

## 3. POST /integration/contracts/{id}/auth-profiles/{apId}/rotate

- **Origen:** CONTRATO
- **Nombre:** Rotar las credenciales de un perfil de autenticación
- **Bloque:** Integraciones y Contratos
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IntegrationContractsController.rotateCredential` — `src/modules/integration_contracts/controllers/integration-contracts.controller.ts:143`

### Qué es y para qué sirve (negocio)

Rotar las credenciales de un perfil de autenticación. Caso de uso UC-31-11: Rotar credenciales del perfil. Dentro del módulo (descripción del modelo, en inglés): «Supports ministries, government data centers, insurers, pharmacies, diagnostic units and other external systems through versioned contracts, sender-constrained authentication, idempotency and complete exchange evidence.» Dominio: Integraciones y Contratos.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/integration_contracts/README.md:56`) · MODELO (`Mantra Core Health Context/modules/diagram_31_integration_contracts.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:33`)

### Cómo se atiende (sistema)

`POST /integration/contracts/{id}/auth-profiles/{apId}/rotate` la atiende `IntegrationContractsController.rotateCredential` (src/modules/integration_contracts/controllers/integration-contracts.controller.ts:143). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `IntegrationContractsRotateCredentialDto` (3 campos, 1 obligatorio). Delega en `IntegrationAuthProfilesService.rotate`. Actualiza integration_contracts.integration_auth_profiles. Lee integration_contracts.integration_auth_profiles, integration_contracts.integration_contracts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/integration_contracts/controllers/integration-contracts.controller.ts:143` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:278` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id, apId | `src/modules/integration_contracts/controllers/integration-contracts.controller.ts:143` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:145` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `integration_contracts.integration_auth_profiles` | ESCRIBE | ACTUALIZA | POR_TIPO | IntegrationContractsController.rotateCredential → IntegrationAuthProfilesService.rotate | `src/modules/integration_contracts/services/integration-auth-profiles.service.ts:132` |
| `integration_contracts.integration_auth_profiles` | LEE | LEE | DIRECTA | IntegrationContractsController.rotateCredential → IntegrationAuthProfilesService.rotate → AuthProfilesRepository.findById | `src/modules/integration_contracts/repositories/auth-profiles.repository.ts:66` |
| `integration_contracts.integration_contracts` | LEE | LEE | DIRECTA | IntegrationContractsController.rotateCredential → IntegrationAuthProfilesService.rotate → ContractsRepository.findByIdInTenant | `src/modules/integration_contracts/repositories/contracts.repository.ts:69` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |
| `apId` | path | Sí | `string` | — |

### Cuerpo — DTO `IntegrationContractsRotateCredentialDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `credentialSecretReference` | `string` | Sí | longitud mínima 1; longitud máxima 2048 | `@IsString()` `@MinLength(1)` `@MaxLength(2048)` | Nueva referencia de secreto en secret-manager (nunca plaintext) | `src/modules/integration_contracts/dto/rotate-credential.dto.ts:24` |
| `dpopKeyReference` | `string` | No | longitud máxima 2048 | `@IsOptional()` `@IsString()` `@MaxLength(2048)` | Nueva referencia de clave DPoP | `src/modules/integration_contracts/dto/rotate-credential.dto.ts:36` |
| `targetStatus` | `string` | No | valores: ROTATED, REVOKED | `@IsOptional()` `@IsIn(['ROTATED', 'REVOKED'])` | Estado destino del perfil tras rotar | `src/modules/integration_contracts/dto/rotate-credential.dto.ts:47` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "credentialSecretReference": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "credentialSecretReference": "valor-ejemplo",
  "dpopKeyReference": "valor-ejemplo",
  "targetStatus": "ROTATED"
}
```

</details>

### Respuesta — `Promise<StatusResultDto>` · DTO `StatusResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `ok` | `boolean` | Sí | — | — | true si la operación se aplicó | `src/modules/integration_contracts/dto/responses.dto.ts:253` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/integration_contracts.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/integration_contracts/controllers/integration-contracts.controller.spec.ts:96` |

### Flujos

- Módulo 31 — Governed Backend-to-Backend Contracts (`integration_contracts`) — etapa `UC-31-11`

---

## 4. POST /integration/contracts/{id}/exchanges

- **Origen:** CONTRATO
- **Nombre:** Ejecutar un intercambio idempotente (inbound)
- **Bloque:** Integraciones y Contratos
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IntegrationContractsController.executeExchange` — `src/modules/integration_contracts/controllers/integration-contracts.controller.ts:180`

### Qué es y para qué sirve (negocio)

Ejecutar un intercambio idempotente (inbound). Caso de uso UC-31-05: Intercambio idempotente inbound (replay por clave). Dentro del módulo (descripción del modelo, en inglés): «Supports ministries, government data centers, insurers, pharmacies, diagnostic units and other external systems through versioned contracts, sender-constrained authentication, idempotency and complete exchange evidence.» Dominio: Integraciones y Contratos.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/integration_contracts/README.md:49`) · MODELO (`Mantra Core Health Context/modules/diagram_31_integration_contracts.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:33`)

### Cómo se atiende (sistema)

`POST /integration/contracts/{id}/exchanges` la atiende `IntegrationContractsController.executeExchange` (src/modules/integration_contracts/controllers/integration-contracts.controller.ts:180). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `ExecuteExchangeDto` (8 campos, 0 obligatorios). Delega en `IntegrationExchangesService.executeExchange`. Crea filas en integration_contracts.integration_exchange_attempts, integration_contracts.integration_exchange_records, integration_contracts.integration_idempotency_records. Lee integration_contracts.integration_contract_versions, integration_contracts.integration_contracts, integration_contracts.integration_idempotency_records.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/integration_contracts/controllers/integration-contracts.controller.ts:180` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:278` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/integration_contracts/controllers/integration-contracts.controller.ts:180` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:145` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `integration_contracts.integration_contract_versions` | LEE | LEE | DIRECTA | IntegrationContractsController.executeExchange → IntegrationExchangesService.executeExchange → ContractVersionsRepository.findActiveByContract | `src/modules/integration_contracts/repositories/contract-versions.repository.ts:83` |
| `integration_contracts.integration_contracts` | LEE | LEE | DIRECTA | IntegrationContractsController.executeExchange → IntegrationExchangesService.executeExchange → ContractsRepository.findByIdInTenant | `src/modules/integration_contracts/repositories/contracts.repository.ts:69` |
| `integration_contracts.integration_exchange_attempts` | ESCRIBE | CREA | DIRECTA | IntegrationContractsController.executeExchange → IntegrationExchangesService.executeExchange → ExchangeAttemptsRepository.create | `src/modules/integration_contracts/repositories/exchange-attempts.repository.ts:88` |
| `integration_contracts.integration_exchange_records` | ESCRIBE | CREA | DIRECTA | IntegrationContractsController.executeExchange → IntegrationExchangesService.executeExchange → ExchangeRecordsRepository.create | `src/modules/integration_contracts/repositories/exchange-records.repository.ts:90` |
| `integration_contracts.integration_idempotency_records` | ESCRIBE | CREA | DIRECTA | IntegrationContractsController.executeExchange → IntegrationExchangesService.executeExchange → IdempotencyRecordsRepository.create | `src/modules/integration_contracts/repositories/idempotency-records.repository.ts:61` |
| `integration_contracts.integration_idempotency_records` | LEE | LEE | DIRECTA | IntegrationContractsController.executeExchange → IntegrationExchangesService.executeExchange → IdempotencyRecordsRepository.findByKey | `src/modules/integration_contracts/repositories/idempotency-records.repository.ts:50` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `ExecuteExchangeDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `idempotencyKey` | `string` | No | longitud máxima 255 | `@IsOptional()` `@IsString()` `@MaxLength(255)` | Clave de idempotencia (alternativa al header idempotency-key) | `src/modules/integration_contracts/dto/execute-exchange.dto.ts:22` |
| `messageTypeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concepto de tipo de mensaje | `src/modules/integration_contracts/dto/execute-exchange.dto.ts:33` |
| `businessIdentifier` | `string` | No | longitud máxima 255 | `@IsOptional()` `@IsString()` `@MaxLength(255)` | Identificador de negocio del mensaje | `src/modules/integration_contracts/dto/execute-exchange.dto.ts:45` |
| `correlationId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Correlación con otro flujo | `src/modules/integration_contracts/dto/execute-exchange.dto.ts:56` |
| `subjectTypeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concepto de tipo de sujeto | `src/modules/integration_contracts/dto/execute-exchange.dto.ts:67` |
| `subjectEntityId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Id de la entidad sujeto | `src/modules/integration_contracts/dto/execute-exchange.dto.ts:78` |
| `requestHash` | `string` | No | longitud máxima 255 | `@IsOptional()` `@IsString()` `@MaxLength(255)` | Hash del request para detectar mismatch de payload | `src/modules/integration_contracts/dto/execute-exchange.dto.ts:90` |
| `payloadFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Archivo de payload archivado | `src/modules/integration_contracts/dto/execute-exchange.dto.ts:101` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "idempotencyKey": "valor-ejemplo",
  "messageTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "businessIdentifier": "valor-ejemplo",
  "correlationId": "00000000-0000-4000-8000-000000000001",
  "subjectTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "subjectEntityId": "00000000-0000-4000-8000-000000000001",
  "requestHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "payloadFileId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<ExchangeRecordResponseDto>` · DTO `ExchangeRecordResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/integration_contracts/dto/responses.dto.ts:126` |
| `integrationContractVersionId` | `string` | Sí | formato uuid | — | Identificador asociado a integration contract version. | `src/modules/integration_contracts/dto/responses.dto.ts:132` |
| `outcome` | `string` | Sí | formato uuid | — | Concepto de resultado | `src/modules/integration_contracts/dto/responses.dto.ts:138` |
| `replayed` | `boolean` | Sí | — | — | true si la respuesta se devuelve por replay idempotente | `src/modules/integration_contracts/dto/responses.dto.ts:146` |
| `responseReference` | `string` | No | — | — | Referencia de respuesta previa (replay) | `src/modules/integration_contracts/dto/responses.dto.ts:154` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: La clave de idempotencia se reusó con un payload distinto |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Falta la clave de idempotencia (idempotency-key); PreconditionFailedException: No hay versión ACTIVE del contrato |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/integration_contracts.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/integration_contracts/controllers/integration-contracts.controller.spec.ts:115` |

### Flujos

- Módulo 31 — Governed Backend-to-Backend Contracts (`integration_contracts`) — etapa `UC-31-05`

---

## 5. POST /integration/contracts/{id}/exchanges/{recordId}/attempts

- **Origen:** CONTRATO
- **Nombre:** Registrar un intento de intercambio outbound
- **Bloque:** Integraciones y Contratos
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IntegrationContractsController.recordAttempt` — `src/modules/integration_contracts/controllers/integration-contracts.controller.ts:203`

### Qué es y para qué sirve (negocio)

Registrar un intento de intercambio outbound. Caso de uso UC-31-06: Registrar intento outbound. Dentro del módulo (descripción del modelo, en inglés): «Supports ministries, government data centers, insurers, pharmacies, diagnostic units and other external systems through versioned contracts, sender-constrained authentication, idempotency and complete exchange evidence.» Dominio: Integraciones y Contratos.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/integration_contracts/README.md:50`) · MODELO (`Mantra Core Health Context/modules/diagram_31_integration_contracts.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:33`)

### Cómo se atiende (sistema)

`POST /integration/contracts/{id}/exchanges/{recordId}/attempts` la atiende `IntegrationContractsController.recordAttempt` (src/modules/integration_contracts/controllers/integration-contracts.controller.ts:203). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `IntegrationContractsRecordAttemptDto` (8 campos, 1 obligatorio). Delega en `IntegrationExchangesService.recordAttempt`. Crea filas en integration_contracts.integration_exchange_attempts. Actualiza integration_contracts.integration_idempotency_records. Lee integration_contracts.integration_contract_versions, integration_contracts.integration_contracts, integration_contracts.integration_exchange_attempts, integration_contracts.integration_exchange_records, integration_contracts.integration_idempotency_records.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/integration_contracts/controllers/integration-contracts.controller.ts:203` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:278` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id, recordId | `src/modules/integration_contracts/controllers/integration-contracts.controller.ts:203` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:145` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `integration_contracts.integration_contract_versions` | LEE | LEE | DIRECTA | IntegrationContractsController.recordAttempt → IntegrationExchangesService.recordAttempt → IntegrationExchangesService.resolveRecordInTenant → ContractVersionsRepository.findById | `src/modules/integration_contracts/repositories/contract-versions.repository.ts:57` |
| `integration_contracts.integration_contracts` | LEE | LEE | DIRECTA | IntegrationContractsController.recordAttempt → IntegrationExchangesService.recordAttempt → IntegrationExchangesService.resolveRecordInTenant → ContractsRepository.findByIdInTenant | `src/modules/integration_contracts/repositories/contracts.repository.ts:69` |
| `integration_contracts.integration_exchange_attempts` | ESCRIBE | CREA | DIRECTA | IntegrationContractsController.recordAttempt → IntegrationExchangesService.recordAttempt → ExchangeAttemptsRepository.create | `src/modules/integration_contracts/repositories/exchange-attempts.repository.ts:88` |
| `integration_contracts.integration_exchange_attempts` | LEE | LEE | DIRECTA | IntegrationContractsController.recordAttempt → IntegrationExchangesService.recordAttempt → ExchangeAttemptsRepository.maxAttemptNumber | `src/modules/integration_contracts/repositories/exchange-attempts.repository.ts:58` |
| `integration_contracts.integration_exchange_records` | LEE | LEE | DIRECTA | IntegrationContractsController.recordAttempt → IntegrationExchangesService.recordAttempt → IntegrationExchangesService.resolveRecordInTenant → ExchangeRecordsRepository.findByIdForUpdate | `src/modules/integration_contracts/repositories/exchange-records.repository.ts:78` |
| `integration_contracts.integration_idempotency_records` | ESCRIBE | ACTUALIZA | POR_TIPO | IntegrationContractsController.recordAttempt → IntegrationExchangesService.recordAttempt → IntegrationExchangesService.completeIdempotency | `src/modules/integration_contracts/services/integration-exchanges.service.ts:521` |
| `integration_contracts.integration_idempotency_records` | LEE | LEE | DIRECTA | IntegrationContractsController.recordAttempt → IntegrationExchangesService.recordAttempt → IntegrationExchangesService.completeIdempotency → IdempotencyRecordsRepository.findByKey | `src/modules/integration_contracts/repositories/idempotency-records.repository.ts:50` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |
| `recordId` | path | Sí | `string` | — |

### Cuerpo — DTO `IntegrationContractsRecordAttemptDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `outcome` | `string` | Sí | valores: SUCCESS, FAILED | `@IsIn(['SUCCESS', 'FAILED'])` | Resultado del intento | `src/modules/integration_contracts/dto/record-attempt.dto.ts:29` |
| `endpointId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Endpoint destino usado | `src/modules/integration_contracts/dto/record-attempt.dto.ts:40` |
| `httpStatus` | `number` | No | mínimo 100; máximo 599 | `@IsOptional()` `@IsInt()` `@Min(100)` `@Max(599)` | Código de estado HTTP recibido | `src/modules/integration_contracts/dto/record-attempt.dto.ts:54` |
| `providerErrorCode` | `string` | No | longitud máxima 255 | `@IsOptional()` `@IsString()` `@MaxLength(255)` | Código de error del proveedor | `src/modules/integration_contracts/dto/record-attempt.dto.ts:66` |
| `retryDecision` | `string` | No | valores: RETRYABLE, PERMANENT | `@IsOptional()` `@IsIn(['RETRYABLE', 'PERMANENT'])` | Decisión de reintento si falla | `src/modules/integration_contracts/dto/record-attempt.dto.ts:77` |
| `responseHash` | `string` | No | longitud máxima 255 | `@IsOptional()` `@IsString()` `@MaxLength(255)` | Hash del response | `src/modules/integration_contracts/dto/record-attempt.dto.ts:86` |
| `responseReference` | `string` | No | longitud máxima 255 | `@IsOptional()` `@IsString()` `@MaxLength(255)` | Referencia de respuesta idempotente | `src/modules/integration_contracts/dto/record-attempt.dto.ts:98` |
| `traceId` | `string` | No | longitud máxima 255 | `@IsOptional()` `@IsString()` `@MaxLength(255)` | Id de traza distribuida | `src/modules/integration_contracts/dto/record-attempt.dto.ts:110` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "outcome": "SUCCESS"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "outcome": "SUCCESS",
  "endpointId": "00000000-0000-4000-8000-000000000001",
  "httpStatus": 100,
  "providerErrorCode": "CODIGO_EJEMPLO",
  "retryDecision": "RETRYABLE",
  "responseHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "responseReference": "valor-ejemplo",
  "traceId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<ExchangeAttemptResponseDto>` · DTO `ExchangeAttemptResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/integration_contracts/dto/responses.dto.ts:163` |
| `integrationExchangeRecordId` | `string` | Sí | formato uuid | — | Identificador asociado a integration exchange record. | `src/modules/integration_contracts/dto/responses.dto.ts:169` |
| `attemptNumber` | `number` | Sí | — | — | Valor de attempt number mantenido por la instancia. | `src/modules/integration_contracts/dto/responses.dto.ts:175` |
| `outcome` | `string` | Sí | formato uuid | — | Concepto de resultado del intento | `src/modules/integration_contracts/dto/responses.dto.ts:184` |
| `recordOutcome` | `string` | Sí | formato uuid | — | Concepto de resultado del registro tras el intento | `src/modules/integration_contracts/dto/responses.dto.ts:193` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/integration_contracts.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/integration_contracts/controllers/integration-contracts.controller.spec.ts:127` |

### Flujos

- Módulo 31 — Governed Backend-to-Backend Contracts (`integration_contracts`) — etapa `UC-31-06`

---

## 6. POST /integration/contracts/{id}/retire

- **Origen:** CONTRATO
- **Nombre:** Retirar el contrato (soft-delete lógico)
- **Bloque:** Integraciones y Contratos
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IntegrationContractsController.retireContract` — `src/modules/integration_contracts/controllers/integration-contracts.controller.ts:239`

### Qué es y para qué sirve (negocio)

Retirar el contrato (soft-delete lógico). Caso de uso UC-31-11: Retirar contrato (soft-delete lógico). Dentro del módulo (descripción del modelo, en inglés): «Supports ministries, government data centers, insurers, pharmacies, diagnostic units and other external systems through versioned contracts, sender-constrained authentication, idempotency and complete exchange evidence.» Dominio: Integraciones y Contratos.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/integration_contracts/README.md:55`) · MODELO (`Mantra Core Health Context/modules/diagram_31_integration_contracts.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:33`)

### Cómo se atiende (sistema)

`POST /integration/contracts/{id}/retire` la atiende `IntegrationContractsController.retireContract` (src/modules/integration_contracts/controllers/integration-contracts.controller.ts:239). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `RetireContractDto` (2 campos, 0 obligatorios). Delega en `IntegrationContractsService.retireContract`. Actualiza integration_contracts.integration_contract_versions. Lee integration_contracts.integration_contract_versions, integration_contracts.integration_contracts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/integration_contracts/controllers/integration-contracts.controller.ts:239` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:278` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/integration_contracts/controllers/integration-contracts.controller.ts:239` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:145` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `integration_contracts.integration_contract_versions` | ESCRIBE | ACTUALIZA | POR_TIPO | IntegrationContractsController.retireContract → IntegrationContractsService.retireContract | `src/modules/integration_contracts/services/integration-contracts.service.ts:319` |
| `integration_contracts.integration_contract_versions` | LEE | LEE | DIRECTA | IntegrationContractsController.retireContract → IntegrationContractsService.retireContract → ContractVersionsRepository.findActiveVersions | `src/modules/integration_contracts/repositories/contract-versions.repository.ts:96` |
| `integration_contracts.integration_contracts` | LEE | LEE | DIRECTA | IntegrationContractsController.retireContract → IntegrationContractsService.retireContract → ContractsRepository.findByIdInTenantForUpdate | `src/modules/integration_contracts/repositories/contracts.repository.ts:81` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `RetireContractDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reason` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | Motivo del retiro (auditoría) | `src/modules/integration_contracts/dto/retire-contract.dto.ts:16` |
| `forceDeadLetter` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Forzar dead-letter documentado de intercambios PENDING | `src/modules/integration_contracts/dto/retire-contract.dto.ts:26` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "reason": "Texto descriptivo de ejemplo",
  "forceDeadLetter": true
}
```

</details>

### Respuesta — `Promise<StatusResultDto>` · DTO `StatusResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `ok` | `boolean` | Sí | — | — | true si la operación se aplicó | `src/modules/integration_contracts/dto/responses.dto.ts:253` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El contrato ya está retirado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/integration_contracts.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/integration_contracts/controllers/integration-contracts.controller.spec.ts:151` |

### Flujos

- Módulo 31 — Governed Backend-to-Backend Contracts (`integration_contracts`) — etapa `UC-31-11`

---

## 7. POST /integration/contracts/{id}/sync-cursors/{scope}/advance

- **Origen:** CONTRATO
- **Nombre:** Avanzar el cursor de sincronización
- **Bloque:** Integraciones y Contratos
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IntegrationContractsController.advanceCursor` — `src/modules/integration_contracts/controllers/integration-contracts.controller.ts:221`

### Qué es y para qué sirve (negocio)

Avanzar el cursor de sincronización. Caso de uso UC-31-08: Avanzar cursor de sincronización (monótono). Dentro del módulo (descripción del modelo, en inglés): «Supports ministries, government data centers, insurers, pharmacies, diagnostic units and other external systems through versioned contracts, sender-constrained authentication, idempotency and complete exchange evidence.» Dominio: Integraciones y Contratos.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/integration_contracts/README.md:52`) · MODELO (`Mantra Core Health Context/modules/diagram_31_integration_contracts.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:33`)

### Cómo se atiende (sistema)

`POST /integration/contracts/{id}/sync-cursors/{scope}/advance` la atiende `IntegrationContractsController.advanceCursor` (src/modules/integration_contracts/controllers/integration-contracts.controller.ts:221). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `AdvanceCursorDto` (3 campos, 1 obligatorio). Delega en `IntegrationExchangesService.advanceCursor`. Crea filas en integration_contracts.integration_sync_cursors. Actualiza integration_contracts.integration_sync_cursors. Lee integration_contracts.integration_contracts, integration_contracts.integration_sync_cursors.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/integration_contracts/controllers/integration-contracts.controller.ts:221` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:278` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/integration_contracts/controllers/integration-contracts.controller.ts:221` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:145` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `integration_contracts.integration_contracts` | LEE | LEE | DIRECTA | IntegrationContractsController.advanceCursor → IntegrationExchangesService.advanceCursor → ContractsRepository.findByIdInTenantForUpdate | `src/modules/integration_contracts/repositories/contracts.repository.ts:81` |
| `integration_contracts.integration_sync_cursors` | ESCRIBE | ACTUALIZA | POR_TIPO | IntegrationContractsController.advanceCursor → IntegrationExchangesService.advanceCursor | `src/modules/integration_contracts/services/integration-exchanges.service.ts:420` |
| `integration_contracts.integration_sync_cursors` | ESCRIBE | CREA | DIRECTA | IntegrationContractsController.advanceCursor → IntegrationExchangesService.advanceCursor → SyncCursorsRepository.create | `src/modules/integration_contracts/repositories/sync-cursors.repository.ts:54` |
| `integration_contracts.integration_sync_cursors` | LEE | LEE | DIRECTA | IntegrationContractsController.advanceCursor → IntegrationExchangesService.advanceCursor → SyncCursorsRepository.findByScope | `src/modules/integration_contracts/repositories/sync-cursors.repository.ts:42` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |
| `scope` | path | Sí | `string` | — |

### Cuerpo — DTO `AdvanceCursorDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `cursorValue` | `string` | Sí | longitud mínima 1; longitud máxima 4096 | `@IsString()` `@MinLength(1)` `@MaxLength(4096)` | Nuevo valor del cursor (debe avanzar hacia adelante) | `src/modules/integration_contracts/dto/advance-cursor.dto.ts:23` |
| `watermarkAt` | `string` | No | — | `@IsOptional()` `@IsISO8601()` | Marca de agua del avance (ISO 8601) | `src/modules/integration_contracts/dto/advance-cursor.dto.ts:31` |
| `lastSuccessfulExchangeId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Último intercambio exitoso que valida el avance | `src/modules/integration_contracts/dto/advance-cursor.dto.ts:42` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "cursorValue": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "cursorValue": "valor-ejemplo",
  "watermarkAt": "valor-ejemplo",
  "lastSuccessfulExchangeId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<SyncCursorResponseDto>` · DTO `SyncCursorResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/integration_contracts/dto/responses.dto.ts:202` |
| `cursorScope` | `string` | Sí | — | — | Valor de cursor scope mantenido por la instancia. | `src/modules/integration_contracts/dto/responses.dto.ts:208` |
| `cursorValue` | `string` | Sí | — | — | Valor de cursor value mantenido por la instancia. | `src/modules/integration_contracts/dto/responses.dto.ts:214` |
| `created` | `boolean` | Sí | — | — | true si se creó el cursor en esta operación | `src/modules/integration_contracts/dto/responses.dto.ts:220` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El cursor solo puede avanzar hacia adelante |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/integration_contracts.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/integration_contracts/controllers/integration-contracts.controller.spec.ts:139` |

### Flujos

- Módulo 31 — Governed Backend-to-Backend Contracts (`integration_contracts`) — etapa `UC-31-08`

---

## 8. POST /integration/contracts/{id}/versions

- **Origen:** CONTRATO
- **Nombre:** Publicar una nueva versión de contrato
- **Bloque:** Integraciones y Contratos
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IntegrationContractsController.publishVersion` — `src/modules/integration_contracts/controllers/integration-contracts.controller.ts:87`

### Qué es y para qué sirve (negocio)

Publicar una nueva versión de contrato. Caso de uso UC-31-02: Publicar versión (max+1, DRAFT). Dentro del módulo (descripción del modelo, en inglés): «Supports ministries, government data centers, insurers, pharmacies, diagnostic units and other external systems through versioned contracts, sender-constrained authentication, idempotency and complete exchange evidence.» Dominio: Integraciones y Contratos.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/integration_contracts/README.md:46`) · MODELO (`Mantra Core Health Context/modules/diagram_31_integration_contracts.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:33`)

### Cómo se atiende (sistema)

`POST /integration/contracts/{id}/versions` la atiende `IntegrationContractsController.publishVersion` (src/modules/integration_contracts/controllers/integration-contracts.controller.ts:87). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateContractVersionDto` (6 campos, 0 obligatorios). Delega en `IntegrationContractsService.publishVersion`. Crea filas en integration_contracts.integration_contract_versions. Lee integration_contracts.integration_contract_versions, integration_contracts.integration_contracts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/integration_contracts/controllers/integration-contracts.controller.ts:87` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:278` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/integration_contracts/controllers/integration-contracts.controller.ts:87` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:145` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `integration_contracts.integration_contract_versions` | ESCRIBE | CREA | DIRECTA | IntegrationContractsController.publishVersion → IntegrationContractsService.publishVersion → ContractVersionsRepository.create | `src/modules/integration_contracts/repositories/contract-versions.repository.ts:107` |
| `integration_contracts.integration_contract_versions` | LEE | LEE | DIRECTA | IntegrationContractsController.publishVersion → IntegrationContractsService.publishVersion → ContractVersionsRepository.maxVersionNumber | `src/modules/integration_contracts/repositories/contract-versions.repository.ts:65` |
| `integration_contracts.integration_contracts` | LEE | LEE | DIRECTA | IntegrationContractsController.publishVersion → IntegrationContractsService.publishVersion → ContractsRepository.findByIdInTenantForUpdate | `src/modules/integration_contracts/repositories/contracts.repository.ts:81` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateContractVersionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `requestSchemaFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Archivo de esquema de request | `src/modules/integration_contracts/dto/create-contract-version.dto.ts:21` |
| `responseSchemaFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Archivo de esquema de response | `src/modules/integration_contracts/dto/create-contract-version.dto.ts:32` |
| `openapiFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Archivo OpenAPI | `src/modules/integration_contracts/dto/create-contract-version.dto.ts:40` |
| `mappingProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Perfil de mapeo asociado | `src/modules/integration_contracts/dto/create-contract-version.dto.ts:51` |
| `contractHash` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Hash del contrato para detectar drift de esquema | `src/modules/integration_contracts/dto/create-contract-version.dto.ts:63` |
| `effectiveFrom` | `string` | No | — | `@IsOptional()` `@IsISO8601()` | Inicio de vigencia (ISO 8601) | `src/modules/integration_contracts/dto/create-contract-version.dto.ts:71` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "requestSchemaFileId": "00000000-0000-4000-8000-000000000001",
  "responseSchemaFileId": "00000000-0000-4000-8000-000000000001",
  "openapiFileId": "00000000-0000-4000-8000-000000000001",
  "mappingProfileId": "00000000-0000-4000-8000-000000000001",
  "contractHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "effectiveFrom": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<ContractVersionResponseDto>` · DTO `ContractVersionResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/integration_contracts/dto/responses.dto.ts:45` |
| `integrationContractId` | `string` | Sí | formato uuid | — | Identificador asociado a integration contract. | `src/modules/integration_contracts/dto/responses.dto.ts:51` |
| `versionNumber` | `number` | Sí | — | — | Valor de version number mantenido por la instancia. | `src/modules/integration_contracts/dto/responses.dto.ts:57` |
| `status` | `string` | Sí | formato uuid | — | Concepto de estado de la versión | `src/modules/integration_contracts/dto/responses.dto.ts:66` |
| `effectiveFrom` | `string` | No | formato date-time | — | Valor de effective from mantenido por la instancia. | `src/modules/integration_contracts/dto/responses.dto.ts:72` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Solo se pueden publicar versiones en contratos DRAFT o ACTIVE |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/integration_contracts.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/integration_contracts/controllers/integration-contracts.controller.spec.ts:62` |

### Flujos

- Módulo 31 — Governed Backend-to-Backend Contracts (`integration_contracts`) — etapa `UC-31-02`

---

## 9. POST /integration/contracts/{id}/versions/{versionId}/activate

- **Origen:** CONTRATO
- **Nombre:** Activar una versión y transicionar el estado del contrato
- **Bloque:** Integraciones y Contratos
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IntegrationContractsController.activateVersion` — `src/modules/integration_contracts/controllers/integration-contracts.controller.ts:104`

### Qué es y para qué sirve (negocio)

Activar una versión y transicionar el estado del contrato. Caso de uso UC-31-10: Activar versión y transicionar estado. Dentro del módulo (descripción del modelo, en inglés): «Supports ministries, government data centers, insurers, pharmacies, diagnostic units and other external systems through versioned contracts, sender-constrained authentication, idempotency and complete exchange evidence.» Dominio: Integraciones y Contratos.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/integration_contracts/README.md:54`) · MODELO (`Mantra Core Health Context/modules/diagram_31_integration_contracts.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:33`)

### Cómo se atiende (sistema)

`POST /integration/contracts/{id}/versions/{versionId}/activate` la atiende `IntegrationContractsController.activateVersion` (src/modules/integration_contracts/controllers/integration-contracts.controller.ts:104). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `ActivateVersionDto` (1 campo, 0 obligatorios). Delega en `IntegrationContractsService.activateVersion`. Actualiza integration_contracts.integration_contract_versions. Lee integration_contracts.integration_contract_versions, integration_contracts.integration_contracts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/integration_contracts/controllers/integration-contracts.controller.ts:104` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:278` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id, versionId | `src/modules/integration_contracts/controllers/integration-contracts.controller.ts:104` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:145` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `integration_contracts.integration_contract_versions` | ESCRIBE | ACTUALIZA | POR_TIPO | IntegrationContractsController.activateVersion → IntegrationContractsService.activateVersion | `src/modules/integration_contracts/services/integration-contracts.service.ts:260` |
| `integration_contracts.integration_contract_versions` | LEE | LEE | DIRECTA | IntegrationContractsController.activateVersion → IntegrationContractsService.activateVersion → ContractVersionsRepository.findById | `src/modules/integration_contracts/repositories/contract-versions.repository.ts:57` |
| `integration_contracts.integration_contracts` | LEE | LEE | DIRECTA | IntegrationContractsController.activateVersion → IntegrationContractsService.activateVersion → ContractsRepository.findByIdInTenantForUpdate | `src/modules/integration_contracts/repositories/contracts.repository.ts:81` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |
| `versionId` | path | Sí | `string` | — |

### Cuerpo — DTO `ActivateVersionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `effectiveFrom` | `string` | No | — | `@IsOptional()` `@IsISO8601()` | Inicio de vigencia explícito (ISO 8601); por defecto now() | `src/modules/integration_contracts/dto/activate-version.dto.ts:14` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "effectiveFrom": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<StatusResultDto>` · DTO `StatusResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `ok` | `boolean` | Sí | — | — | true si la operación se aplicó | `src/modules/integration_contracts/dto/responses.dto.ts:253` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Solo se puede activar una versión DRAFT |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/integration_contracts.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/integration_contracts/controllers/integration-contracts.controller.spec.ts:73` |

### Flujos

- Módulo 31 — Governed Backend-to-Backend Contracts (`integration_contracts`) — etapa `UC-31-10`

---

## 10. POST /integration/contracts/{id}/webhook-subscriptions

- **Origen:** CONTRATO
- **Nombre:** Suscribir un webhook al contrato
- **Bloque:** Integraciones y Contratos
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IntegrationContractsController.subscribeWebhook` — `src/modules/integration_contracts/controllers/integration-contracts.controller.ts:163`

### Qué es y para qué sirve (negocio)

Suscribir un webhook al contrato. Caso de uso UC-31-04: Suscribir webhook (contrato ACTIVE). Dentro del módulo (descripción del modelo, en inglés): «Supports ministries, government data centers, insurers, pharmacies, diagnostic units and other external systems through versioned contracts, sender-constrained authentication, idempotency and complete exchange evidence.» Dominio: Integraciones y Contratos.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/integration_contracts/README.md:48`) · MODELO (`Mantra Core Health Context/modules/diagram_31_integration_contracts.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:33`)

### Cómo se atiende (sistema)

`POST /integration/contracts/{id}/webhook-subscriptions` la atiende `IntegrationContractsController.subscribeWebhook` (src/modules/integration_contracts/controllers/integration-contracts.controller.ts:163). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `IntegrationContractsCreateWebhookSubscriptionDto` (6 campos, 0 obligatorios). Delega en `IntegrationWebhooksService.subscribe`. Crea filas en integration_contracts.contract_webhook_subscriptions. Lee integration_contracts.contract_webhook_subscriptions, integration_contracts.integration_contracts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/integration_contracts/controllers/integration-contracts.controller.ts:163` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:278` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/integration_contracts/controllers/integration-contracts.controller.ts:163` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:145` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `integration_contracts.contract_webhook_subscriptions` | ESCRIBE | CREA | DIRECTA | IntegrationContractsController.subscribeWebhook → IntegrationWebhooksService.subscribe → WebhookSubscriptionsRepository.create | `src/modules/integration_contracts/repositories/webhook-subscriptions.repository.ts:88` |
| `integration_contracts.contract_webhook_subscriptions` | LEE | LEE | DIRECTA | IntegrationContractsController.subscribeWebhook → IntegrationWebhooksService.subscribe → WebhookSubscriptionsRepository.findDuplicate | `src/modules/integration_contracts/repositories/webhook-subscriptions.repository.ts:64` |
| `integration_contracts.integration_contracts` | LEE | LEE | DIRECTA | IntegrationContractsController.subscribeWebhook → IntegrationWebhooksService.subscribe → ContractsRepository.findByIdInTenant | `src/modules/integration_contracts/repositories/contracts.repository.ts:69` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `IntegrationContractsCreateWebhookSubscriptionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `eventTypeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concepto de tipo de evento suscrito | `src/modules/integration_contracts/dto/create-webhook-subscription.dto.ts:23` |
| `callbackUri` | `string` | No | formato uri; longitud máxima 2048 | `@IsOptional()` `@IsUrl({ require_tld: false, protocols: ['https', 'http'] })` `@MaxLength(2048)` | URI de callback con TLS | `src/modules/integration_contracts/dto/create-webhook-subscription.dto.ts:35` |
| `signingKeyReference` | `string` | No | longitud máxima 2048 | `@IsOptional()` `@IsString()` `@MaxLength(2048)` | Referencia a la clave de firma en secret-manager | `src/modules/integration_contracts/dto/create-webhook-subscription.dto.ts:47` |
| `secretReference` | `string` | No | longitud máxima 2048 | `@IsOptional()` `@IsString()` `@MaxLength(2048)` | Referencia al secreto en secret-manager | `src/modules/integration_contracts/dto/create-webhook-subscription.dto.ts:59` |
| `validFrom` | `string` | No | — | `@IsOptional()` `@IsISO8601()` | Inicio de validez (ISO 8601) | `src/modules/integration_contracts/dto/create-webhook-subscription.dto.ts:67` |
| `validTo` | `string` | No | — | `@IsOptional()` `@IsISO8601()` | Fin de validez (ISO 8601) | `src/modules/integration_contracts/dto/create-webhook-subscription.dto.ts:75` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "eventTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "callbackUri": "https://example.com/recurso",
  "signingKeyReference": "valor-ejemplo",
  "secretReference": "valor-ejemplo",
  "validFrom": "valor-ejemplo",
  "validTo": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<WebhookSubscriptionResponseDto>` · DTO `WebhookSubscriptionResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/integration_contracts/dto/responses.dto.ts:102` |
| `providerId` | `string` | Sí | formato uuid | — | Identificador asociado a provider. | sin fuente |
| `eventType` | `string` | Sí | — | — | Valor de event type mantenido por la instancia. | sin fuente |
| `state` | `string` | Sí | formato uuid | — | Concept id del estado | sin fuente |
| `updated` | `boolean` | Sí | — | — | true si se actualizó una suscripción existente | sin fuente |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe una suscripción para ese evento y callback |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El contrato debe estar ACTIVE para suscribir webhooks |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/integration_contracts.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/integration_contracts/controllers/integration-contracts.controller.spec.ts:108` |

### Flujos

- Módulo 31 — Governed Backend-to-Backend Contracts (`integration_contracts`) — etapa `UC-31-04`

---

## 11. POST /integration/exchanges/{recordId}/retry

- **Origen:** CONTRATO
- **Nombre:** Reintentar un intercambio fallido
- **Bloque:** Integraciones y Contratos
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IntegrationExchangesController.retry` — `src/modules/integration_contracts/controllers/integration-exchanges.controller.ts:51`

### Qué es y para qué sirve (negocio)

Reintentar un intercambio fallido. Caso de uso UC-31-07: Reintentar intercambio fallido. Dentro del módulo (descripción del modelo, en inglés): «Supports ministries, government data centers, insurers, pharmacies, diagnostic units and other external systems through versioned contracts, sender-constrained authentication, idempotency and complete exchange evidence.» Dominio: Integraciones y Contratos.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/integration_contracts/README.md:51`) · MODELO (`Mantra Core Health Context/modules/diagram_31_integration_contracts.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:33`)

### Cómo se atiende (sistema)

`POST /integration/exchanges/{recordId}/retry` la atiende `IntegrationExchangesController.retry` (src/modules/integration_contracts/controllers/integration-exchanges.controller.ts:51). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `RetryExchangeDto` (3 campos, 0 obligatorios). Delega en `IntegrationExchangesService.retry`. Crea filas en integration_contracts.integration_exchange_attempts. Actualiza integration_contracts.integration_idempotency_records. Lee integration_contracts.integration_contract_versions, integration_contracts.integration_contracts, integration_contracts.integration_exchange_attempts, integration_contracts.integration_exchange_records, integration_contracts.integration_idempotency_records.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/integration_contracts/controllers/integration-exchanges.controller.ts:51` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:278` |
| PARAMETRO_RUTA | Deben ser UUID válidos: recordId | `src/modules/integration_contracts/controllers/integration-exchanges.controller.ts:51` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:145` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `integration_contracts.integration_contract_versions` | LEE | LEE | DIRECTA | IntegrationExchangesController.retry → IntegrationExchangesService.retry → IntegrationExchangesService.resolveRecordInTenant → ContractVersionsRepository.findById | `src/modules/integration_contracts/repositories/contract-versions.repository.ts:57` |
| `integration_contracts.integration_contracts` | LEE | LEE | DIRECTA | IntegrationExchangesController.retry → IntegrationExchangesService.retry → IntegrationExchangesService.resolveRecordInTenant → ContractsRepository.findByIdInTenant | `src/modules/integration_contracts/repositories/contracts.repository.ts:69` |
| `integration_contracts.integration_exchange_attempts` | ESCRIBE | CREA | DIRECTA | IntegrationExchangesController.retry → IntegrationExchangesService.retry → ExchangeAttemptsRepository.create | `src/modules/integration_contracts/repositories/exchange-attempts.repository.ts:88` |
| `integration_contracts.integration_exchange_attempts` | LEE | LEE | DIRECTA | IntegrationExchangesController.retry → IntegrationExchangesService.retry → ExchangeAttemptsRepository.lastAttempt | `src/modules/integration_contracts/repositories/exchange-attempts.repository.ts:75` |
| `integration_contracts.integration_exchange_records` | LEE | LEE | DIRECTA | IntegrationExchangesController.retry → IntegrationExchangesService.retry → IntegrationExchangesService.resolveRecordInTenant → ExchangeRecordsRepository.findByIdForUpdate | `src/modules/integration_contracts/repositories/exchange-records.repository.ts:78` |
| `integration_contracts.integration_idempotency_records` | ESCRIBE | ACTUALIZA | POR_TIPO | IntegrationExchangesController.retry → IntegrationExchangesService.retry → IntegrationExchangesService.completeIdempotency | `src/modules/integration_contracts/services/integration-exchanges.service.ts:521` |
| `integration_contracts.integration_idempotency_records` | LEE | LEE | DIRECTA | IntegrationExchangesController.retry → IntegrationExchangesService.retry → IntegrationExchangesService.completeIdempotency → IdempotencyRecordsRepository.findByKey | `src/modules/integration_contracts/repositories/idempotency-records.repository.ts:50` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `recordId` | path | Sí | `string` | — |

### Cuerpo — DTO `RetryExchangeDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `outcome` | `string` | No | valores: SUCCESS, FAILED | `@IsOptional()` `@IsIn(['SUCCESS', 'FAILED'])` | Resultado del reintento (por defecto SUCCESS) | `src/modules/integration_contracts/dto/retry-exchange.dto.ts:24` |
| `httpStatus` | `number` | No | mínimo 100; máximo 599 | `@IsOptional()` `@IsInt()` `@Min(100)` `@Max(599)` | Código de estado HTTP recibido | `src/modules/integration_contracts/dto/retry-exchange.dto.ts:38` |
| `traceId` | `string` | No | longitud máxima 255 | `@IsOptional()` `@IsString()` `@MaxLength(255)` | Id de traza distribuida | `src/modules/integration_contracts/dto/retry-exchange.dto.ts:50` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "outcome": "SUCCESS",
  "httpStatus": 100,
  "traceId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<ExchangeAttemptResponseDto>` · DTO `ExchangeAttemptResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/integration_contracts/dto/responses.dto.ts:163` |
| `integrationExchangeRecordId` | `string` | Sí | formato uuid | — | Identificador asociado a integration exchange record. | `src/modules/integration_contracts/dto/responses.dto.ts:169` |
| `attemptNumber` | `number` | Sí | — | — | Valor de attempt number mantenido por la instancia. | `src/modules/integration_contracts/dto/responses.dto.ts:175` |
| `outcome` | `string` | Sí | formato uuid | — | Concepto de resultado del intento | `src/modules/integration_contracts/dto/responses.dto.ts:184` |
| `recordOutcome` | `string` | Sí | formato uuid | — | Concepto de resultado del registro tras el intento | `src/modules/integration_contracts/dto/responses.dto.ts:193` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Solo se reintenta un intercambio con último intento FAILED; PreconditionFailedException: El último intento marcó fallo permanente (no reintentable) |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/integration_contracts.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/integration_contracts/controllers/integration-exchanges.controller.spec.ts:33` |

### Flujos

- Módulo 31 — Governed Backend-to-Backend Contracts (`integration_contracts`) — etapa `UC-31-07`

---

## 12. POST /integration/webhooks/{subscriptionId}/deliveries

- **Origen:** CONTRATO
- **Nombre:** Entregar y verificar un webhook firmado
- **Bloque:** Integraciones y Contratos
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IntegrationExchangesController.deliver` — `src/modules/integration_contracts/controllers/integration-exchanges.controller.ts:68`

### Qué es y para qué sirve (negocio)

Entregar y verificar un webhook firmado. Caso de uso UC-31-09: Entregar y verificar webhook firmado. Dentro del módulo (descripción del modelo, en inglés): «Supports ministries, government data centers, insurers, pharmacies, diagnostic units and other external systems through versioned contracts, sender-constrained authentication, idempotency and complete exchange evidence.» Dominio: Integraciones y Contratos.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/integration_contracts/README.md:53`) · MODELO (`Mantra Core Health Context/modules/diagram_31_integration_contracts.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:33`)

### Cómo se atiende (sistema)

`POST /integration/webhooks/{subscriptionId}/deliveries` la atiende `IntegrationExchangesController.deliver` (src/modules/integration_contracts/controllers/integration-exchanges.controller.ts:68). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `DeliverWebhookDto` (6 campos, 0 obligatorios). Delega en `IntegrationWebhooksService.deliver`. Crea filas en integration_contracts.integration_exchange_records, integration_contracts.webhook_delivery_evidence. Lee integration_contracts.contract_webhook_subscriptions, integration_contracts.integration_contract_versions, integration_contracts.integration_contracts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/integration_contracts/controllers/integration-exchanges.controller.ts:68` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:278` |
| PARAMETRO_RUTA | Deben ser UUID válidos: subscriptionId | `src/modules/integration_contracts/controllers/integration-exchanges.controller.ts:68` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:145` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `integration_contracts.contract_webhook_subscriptions` | LEE | LEE | DIRECTA | IntegrationExchangesController.deliver → IntegrationWebhooksService.deliver → WebhookSubscriptionsRepository.findById | `src/modules/integration_contracts/repositories/webhook-subscriptions.repository.ts:54` |
| `integration_contracts.integration_contract_versions` | LEE | LEE | DIRECTA | IntegrationExchangesController.deliver → IntegrationWebhooksService.deliver → ContractVersionsRepository.findActiveByContract | `src/modules/integration_contracts/repositories/contract-versions.repository.ts:83` |
| `integration_contracts.integration_contracts` | LEE | LEE | DIRECTA | IntegrationExchangesController.deliver → IntegrationWebhooksService.deliver → ContractsRepository.findByIdInTenant | `src/modules/integration_contracts/repositories/contracts.repository.ts:69` |
| `integration_contracts.integration_exchange_records` | ESCRIBE | CREA | DIRECTA | IntegrationExchangesController.deliver → IntegrationWebhooksService.deliver → ExchangeRecordsRepository.create | `src/modules/integration_contracts/repositories/exchange-records.repository.ts:90` |
| `integration_contracts.webhook_delivery_evidence` | ESCRIBE | CREA | DIRECTA | IntegrationExchangesController.deliver → IntegrationWebhooksService.deliver → DeliveryEvidenceRepository.create | `src/modules/integration_contracts/repositories/delivery-evidence.repository.ts:45` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `subscriptionId` | path | Sí | `string` | — |

### Cuerpo — DTO `DeliverWebhookDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `outcome` | `string` | No | valores: DELIVERED, FAILED | `@IsOptional()` `@IsIn(['DELIVERED', 'FAILED'])` | Resultado de la entrega (por defecto DELIVERED) | `src/modules/integration_contracts/dto/deliver-webhook.dto.ts:25` |
| `signatureAlgorithm` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Algoritmo de firma HMAC | `src/modules/integration_contracts/dto/deliver-webhook.dto.ts:37` |
| `signatureVerified` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | true si la firma se verificó correctamente | `src/modules/integration_contracts/dto/deliver-webhook.dto.ts:47` |
| `correlationId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Correlación con el evento de negocio | `src/modules/integration_contracts/dto/deliver-webhook.dto.ts:58` |
| `requestHash` | `string` | No | longitud máxima 255 | `@IsOptional()` `@IsString()` `@MaxLength(255)` | Hash del payload entregado | `src/modules/integration_contracts/dto/deliver-webhook.dto.ts:70` |
| `acknowledged` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | true si el receptor confirmó la recepción (ACK) | `src/modules/integration_contracts/dto/deliver-webhook.dto.ts:80` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "outcome": "DELIVERED",
  "signatureAlgorithm": "valor-ejemplo",
  "signatureVerified": true,
  "correlationId": "00000000-0000-4000-8000-000000000001",
  "requestHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "acknowledged": true
}
```

</details>

### Respuesta — `Promise<DeliveryEvidenceResponseDto>` · DTO `DeliveryEvidenceResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/integration_contracts/dto/responses.dto.ts:229` |
| `integrationExchangeRecordId` | `string` | Sí | formato uuid | — | Identificador asociado a integration exchange record. | `src/modules/integration_contracts/dto/responses.dto.ts:235` |
| `outcome` | `string` | Sí | formato uuid | — | Concepto de resultado de la entrega | `src/modules/integration_contracts/dto/responses.dto.ts:244` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La suscripción no está ACTIVE; PreconditionFailedException: La suscripción aún no es válida; PreconditionFailedException: La suscripción ya expiró; PreconditionFailedException: No hay versión ACTIVE del contrato para entregar; PreconditionFailedException: La suscripción no tiene callbackUri para entregar; PreconditionFailedException: El cuerpo del despacho excede el tamaño permitido |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/integration_contracts.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/integration_contracts/controllers/integration-exchanges.controller.spec.ts:42` |

### Flujos

- Módulo 31 — Governed Backend-to-Backend Contracts (`integration_contracts`) — etapa `UC-31-09`

---

