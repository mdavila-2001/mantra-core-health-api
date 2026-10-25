<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `auth_providers`

- **Bloque:** Identidad y Seguridad (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)
- **Operaciones:** 12 (12 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 1 · MEDIO 11 · BAJO 0
- **Tablas distintas que tocan:** 9
- **Respuestas de error y detalle contractual:** `openapi/endpoints/auth-providers.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | POST | `/auth-providers/account-link-requests` | Solicitar la vinculación de un sujeto externo | MEDIO | 4 | IDENTITY_ADMIN, AUTH_SERVICE |
| 2 | POST | `/auth-providers/account-link-requests/complete` | Completar la vinculación presentando el token | MEDIO | 6 | IDENTITY_ADMIN, AUTH_SERVICE |
| 3 | POST | `/auth-providers/federated-identities/{id}/unlink` | Desvincular una identidad federada | MEDIO | 3 | IDENTITY_ADMIN |
| 4 | POST | `/auth-providers/identity-providers` | Registrar un proveedor de identidad | MEDIO | 2 | IDENTITY_ADMIN |
| 5 | PUT | `/auth-providers/identity-providers/{id}/attribute-mappings` | Fijar el mapeo de atributos del proveedor | ALTO | 4 | IDENTITY_ADMIN |
| 6 | POST | `/auth-providers/identity-providers/{id}/protocol-configs` | Configurar el protocolo de un entorno e importar el JWKS | MEDIO | 7 | IDENTITY_ADMIN |
| 7 | POST | `/auth-providers/identity-providers/{id}/provisioning-rules` | Definir una regla de aprovisionamiento | MEDIO | 3 | IDENTITY_ADMIN |
| 8 | POST | `/auth-providers/identity-providers/{id}/signing-keys` | Publicar una clave de firma del proveedor | MEDIO | 3 | IDENTITY_ADMIN |
| 9 | POST | `/auth-providers/identity-providers/{id}/signing-keys/rotate` | Rotar la clave de firma | MEDIO | 4 | IDENTITY_ADMIN |
| 10 | POST | `/auth-providers/identity-providers/by-code/{code}/authorize` | Iniciar el login federado | MEDIO | 4 | IDENTITY_ADMIN, AUTH_SERVICE |
| 11 | POST | `/auth-providers/identity-providers/by-code/{code}/callback` | Procesar el callback del proveedor | MEDIO | 10 | IDENTITY_ADMIN, AUTH_SERVICE |
| 12 | POST | `/auth-providers/tenant-bindings` | Vincular el proveedor a un tenant | MEDIO | 4 | IDENTITY_ADMIN |

---

## 1. POST /auth-providers/account-link-requests

- **Origen:** CONTRATO
- **Nombre:** Solicitar la vinculación de un sujeto externo
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AuthProvidersController.requestAccountLink` — `src/modules/auth_providers/controllers/auth-providers.controller.ts:261`

### Qué es y para qué sirve (negocio)

Solicitar la vinculación de un sujeto externo. Caso de uso UC-40-09: Solicitar vinculación de cuenta. Dentro del módulo (descripción del modelo, en inglés): «Generic, provider-adaptable federated login and user provisioning.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/auth_providers/README.md:51`) · MODELO (`Mantra Core Health Context/modules/diagram_40_auth_providers.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /auth-providers/account-link-requests` la atiende `AuthProvidersController.requestAccountLink` (src/modules/auth_providers/controllers/auth-providers.controller.ts:261). Exige sesión con alguno de los roles IDENTITY_ADMIN, AUTH_SERVICE. Valida el cuerpo como `RequestAccountLinkDto` (3 campos, 2 obligatorios). Delega en `FederatedLoginService.requestAccountLink`. Crea filas en auth_providers.account_link_requests. Lee auth_providers.account_link_requests, auth_providers.federated_identities, auth_providers.identity_providers.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: IDENTITY_ADMIN, AUTH_SERVICE | `src/modules/auth_providers/controllers/auth-providers.controller.ts:261` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `auth_providers.account_link_requests` | ESCRIBE | CREA | DIRECTA | AuthProvidersController.requestAccountLink → FederatedLoginService.requestAccountLink → AuthProvidersRepository.createLinkRequest | `src/modules/auth_providers/repositories/auth-providers.repository.ts:954` |
| `auth_providers.account_link_requests` | LEE | LEE | DIRECTA | AuthProvidersController.requestAccountLink → FederatedLoginService.requestAccountLink → AuthProvidersRepository.findPendingLinkRequest | `src/modules/auth_providers/repositories/auth-providers.repository.ts:992` |
| `auth_providers.federated_identities` | LEE | LEE | DIRECTA | AuthProvidersController.requestAccountLink → FederatedLoginService.requestAccountLink → AuthProvidersRepository.findIdentityBySubject | `src/modules/auth_providers/repositories/auth-providers.repository.ts:876` |
| `auth_providers.identity_providers` | LEE | LEE | DIRECTA | AuthProvidersController.requestAccountLink → FederatedLoginService.requestAccountLink → AuthProvidersRepository.findProviderById | `src/modules/auth_providers/repositories/auth-providers.repository.ts:319` |

### Cuerpo — DTO `RequestAccountLinkDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `providerId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/auth_providers/dto/auth-providers.dto.ts:1039` |
| `externalSubject` | `string` | Sí | longitud máxima 300 | `@IsString()` `@MaxLength(300)` | Sujeto externo que se quiere vincular | `src/modules/auth_providers/dto/auth-providers.dto.ts:1050` |
| `expiresInMinutes` | `number` | No | mínimo 1; máximo 1440 | `@IsOptional()` `@IsInt()` `@Min(1)` `@Max(1440)` | Minutos de validez del token | `src/modules/auth_providers/dto/auth-providers.dto.ts:1063` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "providerId": "00000000-0000-4000-8000-000000000001",
  "externalSubject": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "providerId": "00000000-0000-4000-8000-000000000001",
  "externalSubject": "valor-ejemplo",
  "expiresInMinutes": 30
}
```

</details>

### Respuesta — `Promise<AccountLinkRequestResponseDto>` · DTO `AccountLinkRequestResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/auth_providers/dto/auth-providers.dto.ts:1074` |
| `linkToken` | `string` | Sí | — | — | Token de vinculación. Se devuelve una sola vez; sólo se guarda su hash. | `src/modules/auth_providers/dto/auth-providers.dto.ts:1083` |
| `expiresAt` | `string` | Sí | formato date-time | — | Valor de expires at mantenido por la instancia. | `src/modules/auth_providers/dto/auth-providers.dto.ts:1089` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/auth_providers/dto/auth-providers.dto.ts:1095` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Proveedor no encontrado |
| 409 | `CONFLICT` | ConflictException: El sujeto externo ya está vinculado; ConflictException: Ya hay una solicitud de vinculación pendiente |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El proveedor está deshabilitado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/auth_providers.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/auth_providers/controllers/auth-providers.controller.spec.ts:168` |

### Flujos

- Módulo 40 — Proveedores de Identidad y Login Federado — etapa `UC-40-09`

---

## 2. POST /auth-providers/account-link-requests/complete

- **Origen:** CONTRATO
- **Nombre:** Completar la vinculación presentando el token
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AuthProvidersController.completeAccountLink` — `src/modules/auth_providers/controllers/auth-providers.controller.ts:282`

### Qué es y para qué sirve (negocio)

Completar la vinculación presentando el token. Caso de uso UC-40-10: Completar vinculación. Dentro del módulo (descripción del modelo, en inglés): «Generic, provider-adaptable federated login and user provisioning.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/auth_providers/README.md:52`) · MODELO (`Mantra Core Health Context/modules/diagram_40_auth_providers.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /auth-providers/account-link-requests/complete` la atiende `AuthProvidersController.completeAccountLink` (src/modules/auth_providers/controllers/auth-providers.controller.ts:282). Exige sesión con alguno de los roles IDENTITY_ADMIN, AUTH_SERVICE. Valida el cuerpo como `CompleteAccountLinkDto` (4 campos, 1 obligatorio). Delega en `FederatedLoginService.completeAccountLink`. Crea filas en auth_providers.federated_identities, auth_providers.federated_login_attempts. Actualiza auth_providers.account_link_requests, auth_providers.federated_identities. Lee auth_providers.account_link_requests, auth_providers.federated_identities.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: IDENTITY_ADMIN, AUTH_SERVICE | `src/modules/auth_providers/controllers/auth-providers.controller.ts:282` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `auth_providers.account_link_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | AuthProvidersController.completeAccountLink → FederatedLoginService.completeAccountLink | `src/modules/auth_providers/services/federated-login.service.ts:508` |
| `auth_providers.account_link_requests` | LEE | LEE | DIRECTA | AuthProvidersController.completeAccountLink → FederatedLoginService.completeAccountLink → AuthProvidersRepository.findLinkRequestByTokenHashForUpdate | `src/modules/auth_providers/repositories/auth-providers.repository.ts:977` |
| `auth_providers.federated_identities` | ESCRIBE | ACTUALIZA | POR_TIPO | AuthProvidersController.completeAccountLink → FederatedLoginService.completeAccountLink | `src/modules/auth_providers/services/federated-login.service.ts:536` |
| `auth_providers.federated_identities` | ESCRIBE | CREA | DIRECTA | AuthProvidersController.completeAccountLink → FederatedLoginService.completeAccountLink → AuthProvidersRepository.createFederatedIdentity | `src/modules/auth_providers/repositories/auth-providers.repository.ts:797` |
| `auth_providers.federated_identities` | LEE | LEE | DIRECTA | AuthProvidersController.completeAccountLink → FederatedLoginService.completeAccountLink → AuthProvidersRepository.findIdentityBySubjectForUpdate | `src/modules/auth_providers/repositories/auth-providers.repository.ts:856` |
| `auth_providers.federated_login_attempts` | ESCRIBE | CREA | DIRECTA | AuthProvidersController.completeAccountLink → FederatedLoginService.completeAccountLink → AuthProvidersRepository.createLoginAttempt | `src/modules/auth_providers/repositories/auth-providers.repository.ts:886` |

### Cuerpo — DTO `CompleteAccountLinkDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `linkToken` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Token recibido al solicitar la vinculación | `src/modules/auth_providers/dto/auth-providers.dto.ts:1106` |
| `externalEmail` | `string` | No | longitud máxima 300 | `@IsOptional()` `@IsString()` `@MaxLength(300)` | Correo del sujeto externo | `src/modules/auth_providers/dto/auth-providers.dto.ts:1118` |
| `displayName` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/auth_providers/dto/auth-providers.dto.ts:1127` |
| `claims` | `object` | No | — | `@IsOptional()` `@IsObject()` | Claims con los que se completa la identidad | `src/modules/auth_providers/dto/auth-providers.dto.ts:1137` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "linkToken": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "linkToken": "valor-ejemplo",
  "externalEmail": "usuario@example.com",
  "displayName": "Nombre de ejemplo",
  "claims": {}
}
```

</details>

### Respuesta — `Promise<CompleteAccountLinkResponseDto>` · DTO `CompleteAccountLinkResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `requestId` | `string` | Sí | formato uuid | — | Solicitud completada | `src/modules/auth_providers/dto/auth-providers.dto.ts:1148` |
| `federatedIdentityId` | `string` | Sí | formato uuid | — | Identidad federada creada | `src/modules/auth_providers/dto/auth-providers.dto.ts:1154` |
| `userId` | `string` | Sí | formato uuid | — | Identificador asociado a user. | `src/modules/auth_providers/dto/auth-providers.dto.ts:1160` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/auth_providers/dto/auth-providers.dto.ts:1166` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Solicitud de vinculación no encontrada |
| 409 | `CONFLICT` | ConflictException: El sujeto externo ya está vinculado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La solicitud ya no está pendiente; PreconditionFailedException: La solicitud de vinculación caducó |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/auth_providers.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/auth_providers/controllers/auth-providers.controller.spec.ts:178` |

### Flujos

- Módulo 40 — Proveedores de Identidad y Login Federado — etapa `UC-40-10`

---

## 3. POST /auth-providers/federated-identities/{id}/unlink

- **Origen:** CONTRATO
- **Nombre:** Desvincular una identidad federada
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AuthProvidersController.unlinkIdentity` — `src/modules/auth_providers/controllers/auth-providers.controller.ts:299`

### Qué es y para qué sirve (negocio)

Desvincular una identidad federada. Caso de uso UC-40-12: Desvincular identidad. Dentro del módulo (descripción del modelo, en inglés): «Generic, provider-adaptable federated login and user provisioning.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/auth_providers/README.md:54`) · MODELO (`Mantra Core Health Context/modules/diagram_40_auth_providers.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /auth-providers/federated-identities/{id}/unlink` la atiende `AuthProvidersController.unlinkIdentity` (src/modules/auth_providers/controllers/auth-providers.controller.ts:299). Exige sesión con alguno de los roles IDENTITY_ADMIN. Valida el cuerpo como `UnlinkIdentityDto` (1 campo, 1 obligatorio). Delega en `FederatedLoginService.unlinkIdentity`. Crea filas en auth_providers.federated_login_attempts. Actualiza auth_providers.federated_identities. Lee auth_providers.federated_identities.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: IDENTITY_ADMIN | `src/modules/auth_providers/controllers/auth-providers.controller.ts:299` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/auth_providers/controllers/auth-providers.controller.ts:299` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `auth_providers.federated_identities` | ESCRIBE | ACTUALIZA | POR_TIPO | AuthProvidersController.unlinkIdentity → FederatedLoginService.unlinkIdentity | `src/modules/auth_providers/services/federated-login.service.ts:617` |
| `auth_providers.federated_identities` | LEE | LEE | DIRECTA | AuthProvidersController.unlinkIdentity → FederatedLoginService.unlinkIdentity → AuthProvidersRepository.findIdentityForUpdate | `src/modules/auth_providers/repositories/auth-providers.repository.ts:840` |
| `auth_providers.federated_login_attempts` | ESCRIBE | CREA | DIRECTA | AuthProvidersController.unlinkIdentity → FederatedLoginService.unlinkIdentity → AuthProvidersRepository.createLoginAttempt | `src/modules/auth_providers/repositories/auth-providers.repository.ts:886` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `UnlinkIdentityDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reason` | `string` | Sí | — | `@IsString()` | Por qué se desvincula | `src/modules/auth_providers/dto/auth-providers.dto.ts:1180` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "reason": "Texto descriptivo de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "reason": "Texto descriptivo de ejemplo"
}
```

</details>

### Respuesta — `Promise<UnlinkIdentityResponseDto>` · DTO `UnlinkIdentityResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/auth_providers/dto/auth-providers.dto.ts:1191` |
| `stateConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a state concept. | `src/modules/auth_providers/dto/auth-providers.dto.ts:1197` |
| `attemptId` | `string` | Sí | formato uuid | — | Registro del desenlace | `src/modules/auth_providers/dto/auth-providers.dto.ts:1203` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Identidad federada no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La identidad ya está revocada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/auth_providers.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/auth_providers/controllers/auth-providers.controller.spec.ts:188` |

### Flujos

- Módulo 40 — Proveedores de Identidad y Login Federado — etapa `UC-40-12`

---

## 4. POST /auth-providers/identity-providers

- **Origen:** CONTRATO
- **Nombre:** Registrar un proveedor de identidad
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AuthProvidersController.createProvider` — `src/modules/auth_providers/controllers/auth-providers.controller.ts:70`

### Qué es y para qué sirve (negocio)

Registrar un proveedor de identidad. Caso de uso UC-40-01: Registrar proveedor OIDC/SAML. Dentro del módulo (descripción del modelo, en inglés): «Generic, provider-adaptable federated login and user provisioning.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/auth_providers/README.md:43`) · MODELO (`Mantra Core Health Context/modules/diagram_40_auth_providers.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /auth-providers/identity-providers` la atiende `AuthProvidersController.createProvider` (src/modules/auth_providers/controllers/auth-providers.controller.ts:70). Exige sesión con alguno de los roles IDENTITY_ADMIN. Valida el cuerpo como `CreateProviderDto` (7 campos, 4 obligatorios). Delega en `AuthProvidersConfigService.createProvider`. Crea filas en auth_providers.identity_providers. Lee auth_providers.identity_providers.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: IDENTITY_ADMIN | `src/modules/auth_providers/controllers/auth-providers.controller.ts:70` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `auth_providers.identity_providers` | ESCRIBE | CREA | DIRECTA | AuthProvidersController.createProvider → AuthProvidersConfigService.createProvider → AuthProvidersRepository.createProvider | `src/modules/auth_providers/repositories/auth-providers.repository.ts:291` |
| `auth_providers.identity_providers` | LEE | LEE | DIRECTA | AuthProvidersController.createProvider → AuthProvidersConfigService.createProvider → AuthProvidersRepository.findProviderByCode | `src/modules/auth_providers/repositories/auth-providers.repository.ts:345` |

### Cuerpo — DTO `CreateProviderDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tenant dueño si no es global | `src/modules/auth_providers/dto/auth-providers.dto.ts:47` |
| `code` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Código del proveedor, único | `src/modules/auth_providers/dto/auth-providers.dto.ts:55` |
| `name` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | — | `src/modules/auth_providers/dto/auth-providers.dto.ts:63` |
| `protocol` | `string` | Sí | valores: OIDC, SAML, OAUTH2 | `@IsIn(IDP_PROTOCOLS)` | — | `src/modules/auth_providers/dto/auth-providers.dto.ts:70` |
| `category` | `string` | Sí | valores: ENTERPRISE, SOCIAL, GOVERNMENT | `@IsIn(IDP_CATEGORIES)` | — | `src/modules/auth_providers/dto/auth-providers.dto.ts:77` |
| `issuer` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | Emisor declarado por el proveedor | `src/modules/auth_providers/dto/auth-providers.dto.ts:89` |
| `isGlobal` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Disponible para todos los tenants sin vínculo explícito | `src/modules/auth_providers/dto/auth-providers.dto.ts:100` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "protocol": "OIDC",
  "category": "ENTERPRISE"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "protocol": "OIDC",
  "category": "ENTERPRISE",
  "issuer": "valor-ejemplo",
  "isGlobal": false
}
```

</details>

### Respuesta — `Promise<ProviderResponseDto>` · DTO `ProviderResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/auth_providers/dto/auth-providers.dto.ts:111` |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/auth_providers/dto/auth-providers.dto.ts:117` |
| `name` | `string` | Sí | — | — | Valor de name mantenido por la instancia. | sin fuente |
| `state` | `string` | Sí | formato uuid | — | Concept id del estado | sin fuente |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | sin fuente |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe un proveedor con ese código |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Un proveedor no global necesita el tenant al que pertenece |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/auth_providers.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/auth_providers/controllers/auth-providers.controller.spec.ts:54` |

### Flujos

- Módulo 40 — Proveedores de Identidad y Login Federado — etapa `UC-40-01`

---

## 5. PUT /auth-providers/identity-providers/{id}/attribute-mappings

- **Origen:** CONTRATO
- **Nombre:** Fijar el mapeo de atributos del proveedor
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Borra filas
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AuthProvidersController.setAttributeMappings` — `src/modules/auth_providers/controllers/auth-providers.controller.ts:153`

### Qué es y para qué sirve (negocio)

Fijar el mapeo de atributos del proveedor. Caso de uso UC-40-04: Mapeo de claims a atributos. Dentro del módulo (descripción del modelo, en inglés): «Generic, provider-adaptable federated login and user provisioning.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/auth_providers/README.md:46`) · MODELO (`Mantra Core Health Context/modules/diagram_40_auth_providers.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`PUT /auth-providers/identity-providers/{id}/attribute-mappings` la atiende `AuthProvidersController.setAttributeMappings` (src/modules/auth_providers/controllers/auth-providers.controller.ts:153). Exige sesión con alguno de los roles IDENTITY_ADMIN. Valida el cuerpo como `SetAttributeMappingsDto` (6 campos, 3 obligatorios). Delega en `AuthProvidersConfigService.setAttributeMappings`. Crea filas en auth_providers.provider_attribute_mappings. Borra de auth_providers.provider_attribute_mappings. Lee auth_providers.identity_providers, auth_providers.provider_attribute_mappings.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: IDENTITY_ADMIN | `src/modules/auth_providers/controllers/auth-providers.controller.ts:153` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/auth_providers/controllers/auth-providers.controller.ts:153` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `auth_providers.identity_providers` | LEE | LEE | DIRECTA | AuthProvidersController.setAttributeMappings → AuthProvidersConfigService.setAttributeMappings → AuthProvidersRepository.findProviderForUpdate | `src/modules/auth_providers/repositories/auth-providers.repository.ts:333` |
| `auth_providers.provider_attribute_mappings` | BORRA | BORRA | POR_TIPO | AuthProvidersController.setAttributeMappings → AuthProvidersConfigService.setAttributeMappings → AuthProvidersRepository.removeMappings | `src/modules/auth_providers/repositories/auth-providers.repository.ts:575` |
| `auth_providers.provider_attribute_mappings` | ESCRIBE | CREA | DIRECTA | AuthProvidersController.setAttributeMappings → AuthProvidersConfigService.setAttributeMappings → AuthProvidersRepository.createAttributeMapping | `src/modules/auth_providers/repositories/auth-providers.repository.ts:524` |
| `auth_providers.provider_attribute_mappings` | LEE | LEE | DIRECTA | AuthProvidersController.setAttributeMappings → AuthProvidersConfigService.setAttributeMappings → AuthProvidersRepository.findMappingsForUpdate | `src/modules/auth_providers/repositories/auth-providers.repository.ts:544` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `SetAttributeMappingsDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `mappings` | `array<AttributeMappingDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => AttributeMappingDto)` | Mapeo completo; reemplaza el anterior | `src/modules/auth_providers/dto/auth-providers.dto.ts:570` |
| `mappings[].sourceClaim` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Claim que envía el proveedor | `src/modules/auth_providers/dto/auth-providers.dto.ts:513` |
| `mappings[].targetAttribute` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Atributo del modelo al que se traduce | `src/modules/auth_providers/dto/auth-providers.dto.ts:524` |
| `mappings[].isIdentifier` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Es el claim que identifica al sujeto; sólo puede haber uno | `src/modules/auth_providers/dto/auth-providers.dto.ts:535` |
| `mappings[].required` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Sin este claim el login se rechaza | `src/modules/auth_providers/dto/auth-providers.dto.ts:546` |
| `mappings[].transformJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Transformación a aplicar al valor | `src/modules/auth_providers/dto/auth-providers.dto.ts:554` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "mappings": [
    {
      "sourceClaim": "valor-ejemplo",
      "targetAttribute": "valor-ejemplo"
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "mappings": [
    {
      "sourceClaim": "valor-ejemplo",
      "targetAttribute": "valor-ejemplo",
      "isIdentifier": false,
      "required": false,
      "transformJson": {}
    }
  ]
}
```

</details>

### Respuesta — `Promise<AttributeMappingsResponseDto>` · DTO `AttributeMappingsResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `providerId` | `string` | Sí | formato uuid | — | Identificador asociado a provider. | `src/modules/auth_providers/dto/auth-providers.dto.ts:581` |
| `mappingIds` | `array<string>` | Sí | formato uuid | — | Valor de mapping ids mantenido por la instancia. | `src/modules/auth_providers/dto/auth-providers.dto.ts:587` |
| `removed` | `number` | Sí | — | — | Mapeos anteriores retirados | `src/modules/auth_providers/dto/auth-providers.dto.ts:593` |
| `identifierClaim` | `string` | Sí | — | — | Claim que identifica al sujeto | `src/modules/auth_providers/dto/auth-providers.dto.ts:599` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Proveedor no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El mapeo necesita exactamente un claim identificador; PreconditionFailedException: El claim de origen está repetido en el mapeo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/auth_providers.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/auth_providers/controllers/auth-providers.controller.spec.ts:106` |

### Flujos

- Módulo 40 — Proveedores de Identidad y Login Federado — etapa `UC-40-04`

---

## 6. POST /auth-providers/identity-providers/{id}/protocol-configs

- **Origen:** CONTRATO
- **Nombre:** Configurar el protocolo de un entorno e importar el JWKS
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AuthProvidersController.configureProtocol` — `src/modules/auth_providers/controllers/auth-providers.controller.ts:91`

### Qué es y para qué sirve (negocio)

Configurar el protocolo de un entorno e importar el JWKS. Caso de uso UC-40-02: Configurar protocolo e importar JWKS. Dentro del módulo (descripción del modelo, en inglés): «Generic, provider-adaptable federated login and user provisioning.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/auth_providers/README.md:44`) · MODELO (`Mantra Core Health Context/modules/diagram_40_auth_providers.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /auth-providers/identity-providers/{id}/protocol-configs` la atiende `AuthProvidersController.configureProtocol` (src/modules/auth_providers/controllers/auth-providers.controller.ts:91). Exige sesión con alguno de los roles IDENTITY_ADMIN. Valida el cuerpo como `ConfigureProtocolDto` (20 campos, 1 obligatorio). Delega en `AuthProvidersConfigService.configureProtocol`. Crea filas en auth_providers.provider_protocol_configs, auth_providers.provider_signing_keys. Actualiza auth_providers.identity_providers, auth_providers.provider_protocol_configs. Lee auth_providers.identity_providers, auth_providers.provider_protocol_configs, auth_providers.provider_signing_keys.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: IDENTITY_ADMIN | `src/modules/auth_providers/controllers/auth-providers.controller.ts:91` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/auth_providers/controllers/auth-providers.controller.ts:91` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `auth_providers.identity_providers` | ESCRIBE | ACTUALIZA | POR_TIPO | AuthProvidersController.configureProtocol → AuthProvidersConfigService.configureProtocol | `src/modules/auth_providers/services/auth-providers-config.service.ts:235` |
| `auth_providers.identity_providers` | LEE | LEE | DIRECTA | AuthProvidersController.configureProtocol → AuthProvidersConfigService.configureProtocol → AuthProvidersRepository.findProviderForUpdate | `src/modules/auth_providers/repositories/auth-providers.repository.ts:333` |
| `auth_providers.provider_protocol_configs` | ESCRIBE | ACTUALIZA | POR_TIPO | AuthProvidersController.configureProtocol → AuthProvidersConfigService.configureProtocol | `src/modules/auth_providers/services/auth-providers-config.service.ts:185` |
| `auth_providers.provider_protocol_configs` | ESCRIBE | CREA | DIRECTA | AuthProvidersController.configureProtocol → AuthProvidersConfigService.configureProtocol → AuthProvidersRepository.createProtocolConfig | `src/modules/auth_providers/repositories/auth-providers.repository.ts:361` |
| `auth_providers.provider_protocol_configs` | LEE | LEE | DIRECTA | AuthProvidersController.configureProtocol → AuthProvidersConfigService.configureProtocol → AuthProvidersRepository.findProtocolConfigForUpdate | `src/modules/auth_providers/repositories/auth-providers.repository.ts:412` |
| `auth_providers.provider_signing_keys` | ESCRIBE | CREA | DIRECTA | AuthProvidersController.configureProtocol → AuthProvidersConfigService.configureProtocol → AuthProvidersRepository.createSigningKey | `src/modules/auth_providers/repositories/auth-providers.repository.ts:432` |
| `auth_providers.provider_signing_keys` | LEE | LEE | DIRECTA | AuthProvidersController.configureProtocol → AuthProvidersConfigService.configureProtocol → AuthProvidersRepository.findSigningKey | `src/modules/auth_providers/repositories/auth-providers.repository.ts:463` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `ConfigureProtocolDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `environment` | `string` | Sí | valores: DEVELOPMENT, STAGING, PRODUCTION | `@IsIn(IDP_ENVIRONMENTS)` | — | `src/modules/auth_providers/dto/auth-providers.dto.ts:191` |
| `clientId` | `string` | No | longitud máxima 300 | `@IsOptional()` `@IsString()` `@MaxLength(300)` | Identificador de cliente ante el proveedor | `src/modules/auth_providers/dto/auth-providers.dto.ts:203` |
| `clientSecretRef` | `string` | No | longitud máxima 300 | `@IsOptional()` `@IsString()` `@MaxLength(300)` | Referencia del secreto en el vault; el secreto nunca viaja aquí | `src/modules/auth_providers/dto/auth-providers.dto.ts:216` |
| `authorizeUrl` | `string` | No | — | `@IsOptional()` `@IsString()` | Endpoint de autorización | `src/modules/auth_providers/dto/auth-providers.dto.ts:224` |
| `tokenUrl` | `string` | No | — | `@IsOptional()` `@IsString()` | Endpoint de token | `src/modules/auth_providers/dto/auth-providers.dto.ts:232` |
| `userinfoUrl` | `string` | No | — | `@IsOptional()` `@IsString()` | Endpoint de información de usuario | `src/modules/auth_providers/dto/auth-providers.dto.ts:240` |
| `jwksUri` | `string` | No | — | `@IsOptional()` `@IsString()` | JWKS del proveedor | `src/modules/auth_providers/dto/auth-providers.dto.ts:248` |
| `metadataUrl` | `string` | No | — | `@IsOptional()` `@IsString()` | Documento de descubrimiento | `src/modules/auth_providers/dto/auth-providers.dto.ts:256` |
| `samlEntityId` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | Entity ID SAML | `src/modules/auth_providers/dto/auth-providers.dto.ts:265` |
| `samlAcsUrl` | `string` | No | — | `@IsOptional()` `@IsString()` | Assertion Consumer Service SAML | `src/modules/auth_providers/dto/auth-providers.dto.ts:273` |
| `scopes` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | Ámbitos solicitados | `src/modules/auth_providers/dto/auth-providers.dto.ts:282` |
| `responseType` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/auth_providers/dto/auth-providers.dto.ts:291` |
| `tokenEndpointAuth` | `string` | No | valores: CLIENT_SECRET_POST, CLIENT_SECRET_BASIC, PRIVATE_KEY_JWT | `@IsOptional()` `@IsIn(TOKEN_ENDPOINT_AUTHS)` | — | `src/modules/auth_providers/dto/auth-providers.dto.ts:299` |
| `pkceRequired` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Exigir PKCE; desactivarlo abre el flujo a interceptación del código | `src/modules/auth_providers/dto/auth-providers.dto.ts:311` |
| `extraConfigJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Configuración adicional del proveedor | `src/modules/auth_providers/dto/auth-providers.dto.ts:319` |
| `discoveredKeys` | `array<DiscoveredKeyDto>` | No | — | `@IsOptional()` `@IsArray()` `@ValidateNested({ each: true })` `@Type(() => DiscoveredKeyDto)` | Claves descubiertas en el JWKS del proveedor | `src/modules/auth_providers/dto/auth-providers.dto.ts:332` |
| `discoveredKeys[].keyId` | `string` | No | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Identificador de la clave en el JWKS | `src/modules/auth_providers/dto/auth-providers.dto.ts:158` |
| `discoveredKeys[].algorithm` | `string` | No | longitud máxima 50 | `@IsString()` `@MaxLength(50)` | Algoritmo de firma | `src/modules/auth_providers/dto/auth-providers.dto.ts:166` |
| `discoveredKeys[].publicKey` | `string` | No | — | `@IsString()` | Clave pública en formato PEM o JWK | `src/modules/auth_providers/dto/auth-providers.dto.ts:173` |
| `discoveredKeys[].certificate` | `string` | No | — | `@IsOptional()` `@IsString()` | Certificado asociado | `src/modules/auth_providers/dto/auth-providers.dto.ts:181` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "environment": "DEVELOPMENT"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "environment": "DEVELOPMENT",
  "clientId": "00000000-0000-4000-8000-000000000001",
  "clientSecretRef": "valor-ejemplo",
  "authorizeUrl": "valor-ejemplo",
  "tokenUrl": "valor-ejemplo",
  "userinfoUrl": "valor-ejemplo",
  "jwksUri": "valor-ejemplo",
  "metadataUrl": "valor-ejemplo",
  "samlEntityId": "00000000-0000-4000-8000-000000000001",
  "samlAcsUrl": "valor-ejemplo",
  "scopes": "valor-ejemplo",
  "responseType": "valor-ejemplo",
  "tokenEndpointAuth": "CLIENT_SECRET_POST",
  "pkceRequired": true,
  "extraConfigJson": {},
  "discoveredKeys": [
    {
      "keyId": "00000000-0000-4000-8000-000000000001",
      "algorithm": "valor-ejemplo",
      "publicKey": "valor-ejemplo",
      "certificate": "valor-ejemplo"
    }
  ]
}
```

</details>

### Respuesta — `Promise<ProtocolConfigResponseDto>` · DTO `ProtocolConfigResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/auth_providers/dto/auth-providers.dto.ts:343` |
| `providerId` | `string` | Sí | formato uuid | — | Identificador asociado a provider. | `src/modules/auth_providers/dto/auth-providers.dto.ts:349` |
| `environmentConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a environment concept. | `src/modules/auth_providers/dto/auth-providers.dto.ts:355` |
| `replaced` | `boolean` | Sí | — | — | true si sustituyó a una configuración existente | `src/modules/auth_providers/dto/auth-providers.dto.ts:363` |
| `importedKeyIds` | `array<string>` | Sí | formato uuid | — | Claves importadas del JWKS | `src/modules/auth_providers/dto/auth-providers.dto.ts:373` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Proveedor no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Una configuración SAML necesita entity ID y ACS URL; PreconditionFailedException: La configuración necesita el identificador de cliente; PreconditionFailedException: La configuración necesita los endpoints de autorización y token; PreconditionFailedException: Una configuración OIDC necesita JWKS o documento de descubrimiento |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/auth_providers.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/auth_providers/controllers/auth-providers.controller.spec.ts:64` |

### Flujos

- Módulo 40 — Proveedores de Identidad y Login Federado — etapa `UC-40-02`

---

## 7. POST /auth-providers/identity-providers/{id}/provisioning-rules

- **Origen:** CONTRATO
- **Nombre:** Definir una regla de aprovisionamiento
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AuthProvidersController.createProvisioningRule` — `src/modules/auth_providers/controllers/auth-providers.controller.ts:196`

### Qué es y para qué sirve (negocio)

Definir una regla de aprovisionamiento. Caso de uso UC-40-06: Regla de aprovisionamiento. Dentro del módulo (descripción del modelo, en inglés): «Generic, provider-adaptable federated login and user provisioning.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/auth_providers/README.md:48`) · MODELO (`Mantra Core Health Context/modules/diagram_40_auth_providers.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /auth-providers/identity-providers/{id}/provisioning-rules` la atiende `AuthProvidersController.createProvisioningRule` (src/modules/auth_providers/controllers/auth-providers.controller.ts:196). Exige sesión con alguno de los roles IDENTITY_ADMIN. Valida el cuerpo como `CreateProvisioningRuleDto` (6 campos, 2 obligatorios). Delega en `AuthProvidersConfigService.createProvisioningRule`. Crea filas en auth_providers.provisioning_rules. Lee auth_providers.identity_providers, auth_providers.provisioning_rules.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: IDENTITY_ADMIN | `src/modules/auth_providers/controllers/auth-providers.controller.ts:196` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/auth_providers/controllers/auth-providers.controller.ts:196` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `auth_providers.identity_providers` | LEE | LEE | DIRECTA | AuthProvidersController.createProvisioningRule → AuthProvidersConfigService.createProvisioningRule → AuthProvidersRepository.findProviderById | `src/modules/auth_providers/repositories/auth-providers.repository.ts:319` |
| `auth_providers.provisioning_rules` | ESCRIBE | CREA | DIRECTA | AuthProvidersController.createProvisioningRule → AuthProvidersConfigService.createProvisioningRule → AuthProvidersRepository.createProvisioningRule | `src/modules/auth_providers/repositories/auth-providers.repository.ts:706` |
| `auth_providers.provisioning_rules` | LEE | LEE | DIRECTA | AuthProvidersController.createProvisioningRule → AuthProvidersConfigService.createProvisioningRule → AuthProvidersRepository.findRuleByPriority | `src/modules/auth_providers/repositories/auth-providers.repository.ts:748` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateProvisioningRuleDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tenant al que aplica; si falta, a todos | `src/modules/auth_providers/dto/auth-providers.dto.ts:729` |
| `priority` | `number` | Sí | mínimo 1 | `@IsInt()` `@Min(1)` | Prioridad; la primera regla que case decide | `src/modules/auth_providers/dto/auth-providers.dto.ts:740` |
| `conditionJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Condición sobre los claims recibidos | `src/modules/auth_providers/dto/auth-providers.dto.ts:748` |
| `effect` | `string` | Sí | valores: ALLOW, DENY | `@IsIn(['ALLOW', 'DENY'])` | — | `src/modules/auth_providers/dto/auth-providers.dto.ts:755` |
| `assignRoleConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Rol a asignar; sólo con efecto ALLOW | `src/modules/auth_providers/dto/auth-providers.dto.ts:766` |
| `assignTenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tenant a asignar; sólo con efecto ALLOW | `src/modules/auth_providers/dto/auth-providers.dto.ts:777` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "priority": 1,
  "effect": "ALLOW"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "priority": 1,
  "conditionJson": {},
  "effect": "ALLOW",
  "assignRoleConceptId": "00000000-0000-4000-8000-000000000001",
  "assignTenantId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<ProvisioningRuleResponseDto>` · DTO `ProvisioningRuleResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/auth_providers/dto/auth-providers.dto.ts:788` |
| `priority` | `number` | Sí | — | — | Valor de priority mantenido por la instancia. | `src/modules/auth_providers/dto/auth-providers.dto.ts:794` |
| `effectConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a effect concept. | `src/modules/auth_providers/dto/auth-providers.dto.ts:800` |
| `isActive` | `boolean` | Sí | — | — | Valor de is active mantenido por la instancia. | `src/modules/auth_providers/dto/auth-providers.dto.ts:806` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Proveedor no encontrado |
| 409 | `CONFLICT` | ConflictException: Ya existe una regla con esa prioridad |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Una regla DENY no asigna rol ni tenant |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/auth_providers.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/auth_providers/controllers/auth-providers.controller.spec.ts:130` |

### Flujos

- Módulo 40 — Proveedores de Identidad y Login Federado — etapa `UC-40-06`

---

## 8. POST /auth-providers/identity-providers/{id}/signing-keys

- **Origen:** CONTRATO
- **Nombre:** Publicar una clave de firma del proveedor
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AuthProvidersController.publishSigningKey` — `src/modules/auth_providers/controllers/auth-providers.controller.ts:113`

### Qué es y para qué sirve (negocio)

Publicar una clave de firma del proveedor. Caso de uso UC-40-03: Publicar clave de firma. Dentro del módulo (descripción del modelo, en inglés): «Generic, provider-adaptable federated login and user provisioning.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/auth_providers/README.md:45`) · MODELO (`Mantra Core Health Context/modules/diagram_40_auth_providers.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /auth-providers/identity-providers/{id}/signing-keys` la atiende `AuthProvidersController.publishSigningKey` (src/modules/auth_providers/controllers/auth-providers.controller.ts:113). Exige sesión con alguno de los roles IDENTITY_ADMIN. Valida el cuerpo como `PublishSigningKeyDto` (6 campos, 3 obligatorios). Delega en `AuthProvidersConfigService.publishSigningKey`. Crea filas en auth_providers.provider_signing_keys. Lee auth_providers.identity_providers, auth_providers.provider_signing_keys.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: IDENTITY_ADMIN | `src/modules/auth_providers/controllers/auth-providers.controller.ts:113` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/auth_providers/controllers/auth-providers.controller.ts:113` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `auth_providers.identity_providers` | LEE | LEE | DIRECTA | AuthProvidersController.publishSigningKey → AuthProvidersConfigService.publishSigningKey → AuthProvidersRepository.findProviderById | `src/modules/auth_providers/repositories/auth-providers.repository.ts:319` |
| `auth_providers.provider_signing_keys` | ESCRIBE | CREA | DIRECTA | AuthProvidersController.publishSigningKey → AuthProvidersConfigService.publishSigningKey → AuthProvidersRepository.createSigningKey | `src/modules/auth_providers/repositories/auth-providers.repository.ts:432` |
| `auth_providers.provider_signing_keys` | LEE | LEE | DIRECTA | AuthProvidersController.publishSigningKey → AuthProvidersConfigService.publishSigningKey → AuthProvidersRepository.findSigningKey | `src/modules/auth_providers/repositories/auth-providers.repository.ts:463` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `PublishSigningKeyDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `keyId` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | — | `src/modules/auth_providers/dto/auth-providers.dto.ts:388` |
| `algorithm` | `string` | Sí | longitud máxima 50 | `@IsString()` `@MaxLength(50)` | — | `src/modules/auth_providers/dto/auth-providers.dto.ts:396` |
| `publicKey` | `string` | Sí | — | `@IsString()` | Clave pública en PEM o JWK | `src/modules/auth_providers/dto/auth-providers.dto.ts:403` |
| `certificate` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/auth_providers/dto/auth-providers.dto.ts:411` |
| `validFrom` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | Desde cuándo es válida | `src/modules/auth_providers/dto/auth-providers.dto.ts:422` |
| `validTo` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | — | `src/modules/auth_providers/dto/auth-providers.dto.ts:430` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "keyId": "00000000-0000-4000-8000-000000000001",
  "algorithm": "valor-ejemplo",
  "publicKey": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "keyId": "00000000-0000-4000-8000-000000000001",
  "algorithm": "valor-ejemplo",
  "publicKey": "valor-ejemplo",
  "certificate": "valor-ejemplo",
  "validFrom": "2026-07-31T12:00:00.000Z",
  "validTo": "2026-07-31T12:00:00.000Z"
}
```

</details>

### Respuesta — `Promise<SigningKeyResponseDto>` · DTO `SigningKeyResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/auth_providers/dto/auth-providers.dto.ts:441` |
| `keyId` | `string` | Sí | — | — | Identificador asociado a key. | `src/modules/auth_providers/dto/auth-providers.dto.ts:447` |
| `stateConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a state concept. | `src/modules/auth_providers/dto/auth-providers.dto.ts:453` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Proveedor no encontrado |
| 409 | `CONFLICT` | ConflictException: El proveedor ya tiene una clave con ese identificador |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La vigencia de la clave está invertida |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/auth_providers.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/auth_providers/controllers/auth-providers.controller.spec.ts:78` |

### Flujos

- Módulo 40 — Proveedores de Identidad y Login Federado — etapa `UC-40-03`

---

## 9. POST /auth-providers/identity-providers/{id}/signing-keys/rotate

- **Origen:** CONTRATO
- **Nombre:** Rotar la clave de firma
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AuthProvidersController.rotateSigningKey` — `src/modules/auth_providers/controllers/auth-providers.controller.ts:131`

### Qué es y para qué sirve (negocio)

Rotar la clave de firma. Caso de uso UC-40-11: Rotar clave de firma. Dentro del módulo (descripción del modelo, en inglés): «Generic, provider-adaptable federated login and user provisioning.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/auth_providers/README.md:53`) · MODELO (`Mantra Core Health Context/modules/diagram_40_auth_providers.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /auth-providers/identity-providers/{id}/signing-keys/rotate` la atiende `AuthProvidersController.rotateSigningKey` (src/modules/auth_providers/controllers/auth-providers.controller.ts:131). Exige sesión con alguno de los roles IDENTITY_ADMIN. Valida el cuerpo como `RotateSigningKeyDto` (7 campos, 3 obligatorios). Delega en `AuthProvidersConfigService.rotateSigningKey`. Crea filas en auth_providers.provider_signing_keys. Actualiza auth_providers.provider_signing_keys. Lee auth_providers.identity_providers, auth_providers.provider_signing_keys.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: IDENTITY_ADMIN | `src/modules/auth_providers/controllers/auth-providers.controller.ts:131` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/auth_providers/controllers/auth-providers.controller.ts:131` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `auth_providers.identity_providers` | LEE | LEE | DIRECTA | AuthProvidersController.rotateSigningKey → AuthProvidersConfigService.rotateSigningKey → AuthProvidersRepository.findProviderForUpdate | `src/modules/auth_providers/repositories/auth-providers.repository.ts:333` |
| `auth_providers.provider_signing_keys` | ESCRIBE | ACTUALIZA | POR_TIPO | AuthProvidersController.rotateSigningKey → AuthProvidersConfigService.rotateSigningKey | `src/modules/auth_providers/services/auth-providers-config.service.ts:385` |
| `auth_providers.provider_signing_keys` | ESCRIBE | CREA | DIRECTA | AuthProvidersController.rotateSigningKey → AuthProvidersConfigService.rotateSigningKey → AuthProvidersRepository.createSigningKey | `src/modules/auth_providers/repositories/auth-providers.repository.ts:432` |
| `auth_providers.provider_signing_keys` | LEE | LEE | DIRECTA | AuthProvidersController.rotateSigningKey → AuthProvidersConfigService.rotateSigningKey → AuthProvidersRepository.findSigningKey | `src/modules/auth_providers/repositories/auth-providers.repository.ts:463` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `RotateSigningKeyDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `keyId` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | — | `src/modules/auth_providers/dto/auth-providers.dto.ts:388` |
| `algorithm` | `string` | Sí | longitud máxima 50 | `@IsString()` `@MaxLength(50)` | — | `src/modules/auth_providers/dto/auth-providers.dto.ts:396` |
| `publicKey` | `string` | Sí | — | `@IsString()` | Clave pública en PEM o JWK | `src/modules/auth_providers/dto/auth-providers.dto.ts:403` |
| `certificate` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/auth_providers/dto/auth-providers.dto.ts:411` |
| `validFrom` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | Desde cuándo es válida | `src/modules/auth_providers/dto/auth-providers.dto.ts:422` |
| `validTo` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | — | `src/modules/auth_providers/dto/auth-providers.dto.ts:430` |
| `graceHours` | `number` | No | mínimo 0; máximo 720 | `@IsOptional()` `@IsInt()` `@Min(0)` `@Max(720)` | Horas que la clave saliente sigue aceptándose. Retirarla de golpe invalidaría los tokens en vuelo. | `src/modules/auth_providers/dto/auth-providers.dto.ts:470` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "keyId": "00000000-0000-4000-8000-000000000001",
  "algorithm": "valor-ejemplo",
  "publicKey": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "keyId": "00000000-0000-4000-8000-000000000001",
  "algorithm": "valor-ejemplo",
  "publicKey": "valor-ejemplo",
  "certificate": "valor-ejemplo",
  "validFrom": "2026-07-31T12:00:00.000Z",
  "validTo": "2026-07-31T12:00:00.000Z",
  "graceHours": 24
}
```

</details>

### Respuesta — `Promise<RotateKeyResponseDto>` · DTO `RotateKeyResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `newKeyId` | `string` | Sí | formato uuid | — | Clave nueva, activa | `src/modules/auth_providers/dto/auth-providers.dto.ts:481` |
| `retiringCount` | `number` | Sí | — | — | Claves que pasaron a retirándose | `src/modules/auth_providers/dto/auth-providers.dto.ts:487` |
| `graceUntil` | `string` | No | formato date-time | — | Hasta cuándo se aceptan las salientes | `src/modules/auth_providers/dto/auth-providers.dto.ts:496` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Proveedor no encontrado |
| 409 | `CONFLICT` | ConflictException: El proveedor ya tiene una clave con ese identificador |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/auth_providers.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/auth_providers/controllers/auth-providers.controller.spec.ts:92` |

### Flujos

- Módulo 40 — Proveedores de Identidad y Login Federado — etapa `UC-40-11`

---

## 10. POST /auth-providers/identity-providers/by-code/{code}/authorize

- **Origen:** CONTRATO
- **Nombre:** Iniciar el login federado
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AuthProvidersController.startLogin` — `src/modules/auth_providers/controllers/auth-providers.controller.ts:217`

### Qué es y para qué sirve (negocio)

Iniciar el login federado. Caso de uso UC-40-07: Iniciar login federado. Dentro del módulo (descripción del modelo, en inglés): «Generic, provider-adaptable federated login and user provisioning.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/auth_providers/README.md:49`) · MODELO (`Mantra Core Health Context/modules/diagram_40_auth_providers.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /auth-providers/identity-providers/by-code/{code}/authorize` la atiende `AuthProvidersController.startLogin` (src/modules/auth_providers/controllers/auth-providers.controller.ts:217). Exige sesión con alguno de los roles IDENTITY_ADMIN, AUTH_SERVICE. Valida el cuerpo como `StartLoginDto` (4 campos, 0 obligatorios). Delega en `FederatedLoginService.startLogin`. Crea filas en auth_providers.federated_login_attempts. Lee auth_providers.identity_providers, auth_providers.provider_protocol_configs, auth_providers.provider_tenant_bindings.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: IDENTITY_ADMIN, AUTH_SERVICE | `src/modules/auth_providers/controllers/auth-providers.controller.ts:217` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `auth_providers.federated_login_attempts` | ESCRIBE | CREA | DIRECTA | AuthProvidersController.startLogin → FederatedLoginService.startLogin → AuthProvidersRepository.createLoginAttempt | `src/modules/auth_providers/repositories/auth-providers.repository.ts:886` |
| `auth_providers.identity_providers` | LEE | LEE | DIRECTA | AuthProvidersController.startLogin → FederatedLoginService.startLogin → AuthProvidersRepository.findProviderByCode | `src/modules/auth_providers/repositories/auth-providers.repository.ts:345` |
| `auth_providers.provider_protocol_configs` | LEE | LEE | DIRECTA | AuthProvidersController.startLogin → FederatedLoginService.startLogin → AuthProvidersRepository.findProtocolConfig | `src/modules/auth_providers/repositories/auth-providers.repository.ts:393` |
| `auth_providers.provider_tenant_bindings` | LEE | LEE | DIRECTA | AuthProvidersController.startLogin → FederatedLoginService.startLogin → AuthProvidersRepository.findBinding | `src/modules/auth_providers/repositories/auth-providers.repository.ts:622` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `code` | path | Sí | `string` | — |

### Cuerpo — DTO `StartLoginDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tenant al que se quiere entrar | `src/modules/auth_providers/dto/auth-providers.dto.ts:824` |
| `environment` | `string` | No | valores: DEVELOPMENT, STAGING, PRODUCTION | `@IsOptional()` `@IsIn(IDP_ENVIRONMENTS)` | — | `src/modules/auth_providers/dto/auth-providers.dto.ts:832` |
| `ip` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | IP de origen; se registra en el intento | `src/modules/auth_providers/dto/auth-providers.dto.ts:844` |
| `userAgent` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | — | `src/modules/auth_providers/dto/auth-providers.dto.ts:853` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "environment": "PRODUCTION",
  "ip": "valor-ejemplo",
  "userAgent": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<StartLoginResponseDto>` · DTO `StartLoginResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `attemptId` | `string` | Sí | formato uuid | — | Intento de login registrado | `src/modules/auth_providers/dto/auth-providers.dto.ts:864` |
| `state` | `string` | Sí | — | — | Valor de `state` que el callback debe devolver | `src/modules/auth_providers/dto/auth-providers.dto.ts:872` |
| `nonce` | `string` | Sí | — | — | Nonce que liga la respuesta a esta petición | `src/modules/auth_providers/dto/auth-providers.dto.ts:878` |
| `authorizeUrl` | `string` | Sí | — | — | URL de autorización del proveedor | `src/modules/auth_providers/dto/auth-providers.dto.ts:884` |
| `pkceRequired` | `boolean` | Sí | — | — | true si el proveedor exige PKCE | `src/modules/auth_providers/dto/auth-providers.dto.ts:890` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Proveedor no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El proveedor no está activo; PreconditionFailedException: El proveedor no tiene configuración activa para ese entorno; PreconditionFailedException: La configuración no declara endpoint de autorización; PreconditionFailedException: El proveedor no está habilitado para ese tenant |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/auth_providers.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/auth_providers/controllers/auth-providers.controller.spec.ts:144` |

### Flujos

- Módulo 40 — Proveedores de Identidad y Login Federado — etapa `UC-40-07`

---

## 11. POST /auth-providers/identity-providers/by-code/{code}/callback

- **Origen:** CONTRATO
- **Nombre:** Procesar el callback del proveedor
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AuthProvidersController.processCallback` — `src/modules/auth_providers/controllers/auth-providers.controller.ts:239`

### Qué es y para qué sirve (negocio)

Procesar el callback del proveedor. Caso de uso UC-40-08: Procesar callback. Dentro del módulo (descripción del modelo, en inglés): «Generic, provider-adaptable federated login and user provisioning.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/auth_providers/README.md:50`) · MODELO (`Mantra Core Health Context/modules/diagram_40_auth_providers.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /auth-providers/identity-providers/by-code/{code}/callback` la atiende `AuthProvidersController.processCallback` (src/modules/auth_providers/controllers/auth-providers.controller.ts:239). Exige sesión con alguno de los roles IDENTITY_ADMIN, AUTH_SERVICE. Valida el cuerpo como `ProcessCallbackDto` (7 campos, 3 obligatorios). Delega en `FederatedLoginService.processCallback`. Crea filas en auth_providers.account_link_requests, auth_providers.federated_identities, auth_providers.federated_login_attempts. Actualiza auth_providers.federated_identities. Lee auth_providers.federated_identities, auth_providers.federated_login_attempts, auth_providers.identity_providers, auth_providers.provider_attribute_mappings, auth_providers.provider_tenant_bindings, auth_providers.provisioning_rules.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: IDENTITY_ADMIN, AUTH_SERVICE | `src/modules/auth_providers/controllers/auth-providers.controller.ts:239` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `auth_providers.account_link_requests` | ESCRIBE | CREA | DIRECTA | AuthProvidersController.processCallback → FederatedLoginService.processCallback → AuthProvidersRepository.createLinkRequest | `src/modules/auth_providers/repositories/auth-providers.repository.ts:954` |
| `auth_providers.federated_identities` | ESCRIBE | ACTUALIZA | POR_TIPO | AuthProvidersController.processCallback → FederatedLoginService.processCallback | `src/modules/auth_providers/services/federated-login.service.ts:282` |
| `auth_providers.federated_identities` | ESCRIBE | CREA | DIRECTA | AuthProvidersController.processCallback → FederatedLoginService.processCallback → AuthProvidersRepository.createFederatedIdentity | `src/modules/auth_providers/repositories/auth-providers.repository.ts:797` |
| `auth_providers.federated_identities` | LEE | LEE | DIRECTA | AuthProvidersController.processCallback → FederatedLoginService.processCallback → AuthProvidersRepository.findIdentityBySubjectForUpdate | `src/modules/auth_providers/repositories/auth-providers.repository.ts:856` |
| `auth_providers.federated_login_attempts` | ESCRIBE | CREA | DIRECTA | AuthProvidersController.processCallback → FederatedLoginService.processCallback → AuthProvidersRepository.createLoginAttempt | `src/modules/auth_providers/repositories/auth-providers.repository.ts:886` |
| `auth_providers.federated_login_attempts` | LEE | LEE | DIRECTA | AuthProvidersController.processCallback → FederatedLoginService.processCallback → AuthProvidersRepository.findAttemptByRequestId | `src/modules/auth_providers/repositories/auth-providers.repository.ts:911` |
| `auth_providers.identity_providers` | LEE | LEE | DIRECTA | AuthProvidersController.processCallback → FederatedLoginService.processCallback → AuthProvidersRepository.findProviderByCode | `src/modules/auth_providers/repositories/auth-providers.repository.ts:345` |
| `auth_providers.provider_attribute_mappings` | LEE | LEE | DIRECTA | AuthProvidersController.processCallback → FederatedLoginService.processCallback → AuthProvidersRepository.findMappingsByProvider | `src/modules/auth_providers/repositories/auth-providers.repository.ts:562` |
| `auth_providers.provider_tenant_bindings` | LEE | LEE | DIRECTA | AuthProvidersController.processCallback → FederatedLoginService.processCallback → AuthProvidersRepository.findBinding | `src/modules/auth_providers/repositories/auth-providers.repository.ts:622` |
| `auth_providers.provisioning_rules` | LEE | LEE | DIRECTA | AuthProvidersController.processCallback → FederatedLoginService.processCallback → AuthProvidersRepository.findActiveRules | `src/modules/auth_providers/repositories/auth-providers.repository.ts:728` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `code` | path | Sí | `string` | — |

### Cuerpo — DTO `ProcessCallbackDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `state` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | El `state` devuelto por el proveedor | `src/modules/auth_providers/dto/auth-providers.dto.ts:905` |
| `externalSubject` | `string` | Sí | longitud máxima 300 | `@IsString()` `@MaxLength(300)` | Identificador del sujeto en el proveedor | `src/modules/auth_providers/dto/auth-providers.dto.ts:916` |
| `claims` | `object` | Sí | — | `@IsObject()` | Claims recibidos del proveedor, ya verificados por quien llama | `src/modules/auth_providers/dto/auth-providers.dto.ts:926` |
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tenant en el que se entra | `src/modules/auth_providers/dto/auth-providers.dto.ts:937` |
| `userId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Usuario local ya resuelto por IAM. Este módulo no crea usuarios: sin él, el login sin identidad previa devuelve un token de vinculación. | `src/modules/auth_providers/dto/auth-providers.dto.ts:949` |
| `ip` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/auth_providers/dto/auth-providers.dto.ts:958` |
| `userAgent` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | — | `src/modules/auth_providers/dto/auth-providers.dto.ts:967` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "state": "valor-ejemplo",
  "externalSubject": "valor-ejemplo",
  "claims": {}
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "state": "valor-ejemplo",
  "externalSubject": "valor-ejemplo",
  "claims": {},
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "userId": "00000000-0000-4000-8000-000000000001",
  "ip": "valor-ejemplo",
  "userAgent": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<CallbackResponseDto>` · DTO `CallbackResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `federatedIdentityId` | `string` | No | formato uuid | — | Identidad federada resuelta | `src/modules/auth_providers/dto/auth-providers.dto.ts:981` |
| `userId` | `string` | No | formato uuid | — | Usuario local al que corresponde | `src/modules/auth_providers/dto/auth-providers.dto.ts:990` |
| `outcomeConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a outcome concept. | `src/modules/auth_providers/dto/auth-providers.dto.ts:996` |
| `failureReasonConceptId` | `string` | No | formato uuid | — | Motivo cuando el login se rechaza | `src/modules/auth_providers/dto/auth-providers.dto.ts:1005` |
| `provisioned` | `boolean` | Sí | — | — | true si la identidad se creó en este login | `src/modules/auth_providers/dto/auth-providers.dto.ts:1011` |
| `linkToken` | `string` | No | — | — | Token de vinculación cuando hace falta confirmar la cuenta | `src/modules/auth_providers/dto/auth-providers.dto.ts:1019` |
| `attemptId` | `string` | Sí | formato uuid | — | Intento registrado | `src/modules/auth_providers/dto/auth-providers.dto.ts:1025` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Proveedor no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El `state` no corresponde a un login iniciado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/auth_providers.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/auth_providers/controllers/auth-providers.controller.spec.ts:154` |

### Flujos

- Módulo 40 — Proveedores de Identidad y Login Federado — etapa `UC-40-08`

---

## 12. POST /auth-providers/tenant-bindings

- **Origen:** CONTRATO
- **Nombre:** Vincular el proveedor a un tenant
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AuthProvidersController.bindTenant` — `src/modules/auth_providers/controllers/auth-providers.controller.ts:175`

### Qué es y para qué sirve (negocio)

Vincular el proveedor a un tenant. Caso de uso UC-40-05: Vincular proveedor a tenant. Dentro del módulo (descripción del modelo, en inglés): «Generic, provider-adaptable federated login and user provisioning.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/auth_providers/README.md:47`) · MODELO (`Mantra Core Health Context/modules/diagram_40_auth_providers.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /auth-providers/tenant-bindings` la atiende `AuthProvidersController.bindTenant` (src/modules/auth_providers/controllers/auth-providers.controller.ts:175). Exige sesión con alguno de los roles IDENTITY_ADMIN. Valida el cuerpo como `BindTenantDto` (7 campos, 2 obligatorios). Delega en `AuthProvidersConfigService.bindTenant`. Crea filas en auth_providers.provider_tenant_bindings. Actualiza auth_providers.provider_tenant_bindings. Lee auth_providers.identity_providers, auth_providers.provider_tenant_bindings.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: IDENTITY_ADMIN | `src/modules/auth_providers/controllers/auth-providers.controller.ts:175` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `auth_providers.identity_providers` | LEE | LEE | DIRECTA | AuthProvidersController.bindTenant → AuthProvidersConfigService.bindTenant → AuthProvidersRepository.findProviderById | `src/modules/auth_providers/repositories/auth-providers.repository.ts:319` |
| `auth_providers.provider_tenant_bindings` | ESCRIBE | ACTUALIZA | POR_TIPO | AuthProvidersController.bindTenant → AuthProvidersConfigService.bindTenant | `src/modules/auth_providers/services/auth-providers-config.service.ts:534` |
| `auth_providers.provider_tenant_bindings` | ESCRIBE | CREA | DIRECTA | AuthProvidersController.bindTenant → AuthProvidersConfigService.bindTenant → AuthProvidersRepository.createBinding | `src/modules/auth_providers/repositories/auth-providers.repository.ts:591` |
| `auth_providers.provider_tenant_bindings` | LEE | LEE | DIRECTA | AuthProvidersController.bindTenant → AuthProvidersConfigService.bindTenant → AuthProvidersRepository.findBindingForUpdate | `src/modules/auth_providers/repositories/auth-providers.repository.ts:638` |

### Cuerpo — DTO `BindTenantDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `providerId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/auth_providers/dto/auth-providers.dto.ts:613` |
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/auth_providers/dto/auth-providers.dto.ts:620` |
| `isEnabled` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | — | `src/modules/auth_providers/dto/auth-providers.dto.ts:628` |
| `autoProvision` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Crear el usuario local automáticamente al primer login | `src/modules/auth_providers/dto/auth-providers.dto.ts:639` |
| `justInTimeProvisioning` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Aprovisionar en el momento del login, sin invitación previa | `src/modules/auth_providers/dto/auth-providers.dto.ts:650` |
| `defaultRoleConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Rol con el que se aprovisiona | `src/modules/auth_providers/dto/auth-providers.dto.ts:661` |
| `allowedEmailDomains` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | Dominios de correo admitidos, separados por coma | `src/modules/auth_providers/dto/auth-providers.dto.ts:673` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "providerId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "providerId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "isEnabled": true,
  "autoProvision": false,
  "justInTimeProvisioning": false,
  "defaultRoleConceptId": "00000000-0000-4000-8000-000000000001",
  "allowedEmailDomains": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<BindingResponseDto>` · DTO `BindingResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/auth_providers/dto/auth-providers.dto.ts:684` |
| `providerId` | `string` | Sí | formato uuid | — | Identificador asociado a provider. | `src/modules/auth_providers/dto/auth-providers.dto.ts:690` |
| `tenantId` | `string` | Sí | formato uuid | — | Identificador asociado a tenant. | `src/modules/auth_providers/dto/auth-providers.dto.ts:696` |
| `isEnabled` | `boolean` | Sí | — | — | Valor de is enabled mantenido por la instancia. | `src/modules/auth_providers/dto/auth-providers.dto.ts:702` |
| `updated` | `boolean` | Sí | — | — | true si el vínculo ya existía y se actualizó | `src/modules/auth_providers/dto/auth-providers.dto.ts:708` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Proveedor no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Aprovisionar automáticamente exige declarar el rol por defecto; PreconditionFailedException: El proveedor está deshabilitado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/auth_providers.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/auth_providers/controllers/auth-providers.controller.spec.ts:120` |

### Flujos

- Módulo 40 — Proveedores de Identidad y Login Federado — etapa `UC-40-05`

---

