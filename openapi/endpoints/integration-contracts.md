<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `integration_contracts`

Referencia exhaustiva de 12 operación(es) del módulo `integration_contracts`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `integration-contracts`, `integration-exchanges`
- **Controladores:** `IntegrationContractsController`, `IntegrationExchangesController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [POST /integration/contracts](#1-post-integration-contracts) — Definir un contrato de integración
2. [POST /integration/contracts/{id}/auth-profiles](#2-post-integration-contracts-id-auth-profiles) — Configurar perfil de autenticación sender-constrained
3. [POST /integration/contracts/{id}/auth-profiles/{apId}/rotate](#3-post-integration-contracts-id-auth-profiles-apid-rotate) — Rotar las credenciales de un perfil de autenticación
4. [POST /integration/contracts/{id}/exchanges](#4-post-integration-contracts-id-exchanges) — Ejecutar un intercambio idempotente (inbound)
5. [POST /integration/contracts/{id}/exchanges/{recordId}/attempts](#5-post-integration-contracts-id-exchanges-recordid-attempts) — Registrar un intento de intercambio outbound
6. [POST /integration/contracts/{id}/retire](#6-post-integration-contracts-id-retire) — Retirar el contrato (soft-delete lógico)
7. [POST /integration/contracts/{id}/sync-cursors/{scope}/advance](#7-post-integration-contracts-id-sync-cursors-scope-advance) — Avanzar el cursor de sincronización
8. [POST /integration/contracts/{id}/versions](#8-post-integration-contracts-id-versions) — Publicar una nueva versión de contrato
9. [POST /integration/contracts/{id}/versions/{versionId}/activate](#9-post-integration-contracts-id-versions-versionid-activate) — Activar una versión y transicionar el estado del contrato
10. [POST /integration/contracts/{id}/webhook-subscriptions](#10-post-integration-contracts-id-webhook-subscriptions) — Suscribir un webhook al contrato
11. [POST /integration/exchanges/{recordId}/retry](#11-post-integration-exchanges-recordid-retry) — Reintentar un intercambio fallido
12. [POST /integration/webhooks/{subscriptionId}/deliveries](#12-post-integration-webhooks-subscriptionid-deliveries) — Entregar y verificar un webhook firmado

---

## 1. POST /integration/contracts

- **Módulo:** `integration_contracts`
- **Etiqueta OpenAPI:** `integration-contracts`
- **Nombre:** Definir un contrato de integración
- **Operation ID:** `IntegrationContractsController_createContract`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [IntegrationContractsController.createContract](../../src/modules/integration_contracts/controllers/integration-contracts.controller.ts)

### Descripción de negocio

Definir un contrato de integración. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /integration/contracts` en `IntegrationContractsController_createContract`. El controlador delega en `IntegrationContractsService.createContract`. Valida el body como `IntegrationContractsCreateContractDto` y consume `application/json`. El tipo de retorno estático es `Promise<ContractResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `IntegrationContractsCreateContractDto`; los campos opcionales se omiten.

```http
POST /integration/contracts HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "externalProviderId": "00000000-0000-4000-8000-000000000001",
  "contractCode": "CODIGO_EJEMPLO"
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
| `externalProviderId` | Sí | `string` | formato `uuid` | Proveedor externo dueño del contrato | `00000000-0000-4000-8000-000000000001` |
| `contractCode` | Sí | `string` | longitud máxima 100 | Código único del contrato por proveedor/tenant | `CODIGO_EJEMPLO` |
| `capabilityConceptId` | No | `string` | formato `uuid` | Concepto de capacidad del contrato | `00000000-0000-4000-8000-000000000001` |
| `dataClassificationConceptId` | No | `string` | formato `uuid` | Concepto de clasificación de datos | `00000000-0000-4000-8000-000000000001` |
| `legalBasisConceptId` | No | `string` | formato `uuid` | Concepto de base legal de tratamiento | `00000000-0000-4000-8000-000000000001` |
| `allowedPurposeValueSetId` | No | `string` | formato `uuid` | Value set de propósitos permitidos | `00000000-0000-4000-8000-000000000001` |
| `dataUseAgreementId` | No | `string` | formato `uuid` | Acuerdo de uso de datos (DUA) | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /integration/contracts HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ContractResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ContractResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ContractResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ContractResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ContractResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ContractResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ContractResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ContractResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ContractResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ContractResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "contractCode": "CODIGO_EJEMPLO",
  "externalProviderId": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `contractCode` | Sí | `string` | Sin restricción adicional declarada | Valor de contract code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `externalProviderId` | Sí | `string` | formato `uuid` | Identificador asociado a external provider. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concepto de estado del contrato | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | El código de contrato ya existe para el proveedor | Excepción explícita en src/modules/integration_contracts/services/integration-contracts.service.ts |
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
  "path": "/integration/contracts"
}
```

---

## 2. POST /integration/contracts/{id}/auth-profiles

- **Módulo:** `integration_contracts`
- **Etiqueta OpenAPI:** `integration-contracts`
- **Nombre:** Configurar perfil de autenticación sender-constrained
- **Operation ID:** `IntegrationContractsController_configureAuthProfile`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [IntegrationContractsController.configureAuthProfile](../../src/modules/integration_contracts/controllers/integration-contracts.controller.ts)

### Descripción de negocio

Configurar perfil de autenticación sender-constrained. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /integration/contracts/{id}/auth-profiles` en `IntegrationContractsController_configureAuthProfile`. El controlador delega en `IntegrationAuthProfilesService.configure`. Valida el body como `CreateAuthProfileDto` y consume `application/json`. El tipo de retorno estático es `Promise<AuthProfileResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateAuthProfileDto`; los campos opcionales se omiten.

```http
POST /integration/contracts/00000000-0000-4000-8000-000000000001/auth-profiles HTTP/1.1
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
| `authProfileConceptId` | No | `string` | formato `uuid` | Concepto de tipo de perfil de autenticación | `00000000-0000-4000-8000-000000000001` |
| `oauthIssuerUri` | No | `string` | longitud máxima 2048 | URI del emisor OAuth2 | `valor-ejemplo` |
| `clientIdentifier` | No | `string` | longitud máxima 255 | Identificador de cliente OAuth2 | `valor-ejemplo` |
| `credentialSecretReference` | No | `string` | longitud máxima 2048 | Referencia al secreto en secret-manager (nunca plaintext) | `valor-ejemplo` |
| `tokenBindingConceptId` | No | `string` | formato `uuid` | Concepto de token binding (DPoP/mTLS) | `00000000-0000-4000-8000-000000000001` |
| `mtlsCertificateReference` | No | `string` | longitud máxima 2048 | Referencia al certificado mTLS | `valor-ejemplo` |
| `dpopKeyReference` | No | `string` | longitud máxima 2048 | Referencia a la clave DPoP | `valor-ejemplo` |
| `scopesJson` | No | `object` | Sin restricción adicional declarada | Scopes OAuth2 en JSON | `{}` |
| `audience` | No | `string` | longitud máxima 255 | Audience del token | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /integration/contracts/00000000-0000-4000-8000-000000000001/auth-profiles HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<AuthProfileResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<AuthProfileResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AuthProfileResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AuthProfileResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<AuthProfileResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AuthProfileResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<AuthProfileResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AuthProfileResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AuthProfileResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AuthProfileResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AuthProfileResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "integrationContractId": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `integrationContractId` | Sí | `string` | formato `uuid` | Identificador asociado a integration contract. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concepto de estado del perfil | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Contrato no encontrado | Excepción explícita en src/modules/integration_contracts/services/integration-auth-profiles.service.ts |
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
  "path": "/integration/contracts/{id}/auth-profiles"
}
```

---

## 3. POST /integration/contracts/{id}/auth-profiles/{apId}/rotate

- **Módulo:** `integration_contracts`
- **Etiqueta OpenAPI:** `integration-contracts`
- **Nombre:** Rotar las credenciales de un perfil de autenticación
- **Operation ID:** `IntegrationContractsController_rotateCredential`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [IntegrationContractsController.rotateCredential](../../src/modules/integration_contracts/controllers/integration-contracts.controller.ts)

### Descripción de negocio

Rotar las credenciales de un perfil de autenticación. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-31-11 (rotación de credenciales).

### Descripción del sistema

NestJS resuelve `POST /integration/contracts/{id}/auth-profiles/{apId}/rotate` en `IntegrationContractsController_rotateCredential`. El controlador delega en `IntegrationAuthProfilesService.rotate`. Valida el body como `IntegrationContractsRotateCredentialDto` y consume `application/json`. El tipo de retorno estático es `Promise<StatusResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `apId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `IntegrationContractsRotateCredentialDto`; los campos opcionales se omiten.

```http
POST /integration/contracts/00000000-0000-4000-8000-000000000001/auth-profiles/00000000-0000-4000-8000-000000000001/rotate HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "credentialSecretReference": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `id`, `apId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `credentialSecretReference` | Sí | `string` | longitud máxima 2048 | Nueva referencia de secreto en secret-manager (nunca plaintext) | `valor-ejemplo` |
| `dpopKeyReference` | No | `string` | longitud máxima 2048 | Nueva referencia de clave DPoP | `valor-ejemplo` |
| `targetStatus` | No | `string` | valores: `ROTATED`, `REVOKED` | Estado destino del perfil tras rotar | `ROTATED` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /integration/contracts/00000000-0000-4000-8000-000000000001/auth-profiles/00000000-0000-4000-8000-000000000001/rotate HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "credentialSecretReference": "valor-ejemplo",
  "dpopKeyReference": "valor-ejemplo",
  "targetStatus": "ROTATED"
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
| 404 | `NOT_FOUND` | Perfil de autenticación no encontrado | Excepción explícita en src/modules/integration_contracts/services/integration-auth-profiles.service.ts |
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
  "path": "/integration/contracts/{id}/auth-profiles/{apId}/rotate"
}
```

---

## 4. POST /integration/contracts/{id}/exchanges

- **Módulo:** `integration_contracts`
- **Etiqueta OpenAPI:** `integration-contracts`
- **Nombre:** Ejecutar un intercambio idempotente (inbound)
- **Operation ID:** `IntegrationContractsController_executeExchange`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [IntegrationContractsController.executeExchange](../../src/modules/integration_contracts/controllers/integration-contracts.controller.ts)

### Descripción de negocio

Ejecutar un intercambio idempotente (inbound). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /integration/contracts/{id}/exchanges` en `IntegrationContractsController_executeExchange`. El controlador delega en `IntegrationExchangesService.executeExchange`. Valida el body como `ExecuteExchangeDto` y consume `application/json`. El tipo de retorno estático es `Promise<ExchangeRecordResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ExecuteExchangeDto`; los campos opcionales se omiten.

```http
POST /integration/contracts/00000000-0000-4000-8000-000000000001/exchanges HTTP/1.1
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
| `idempotencyKey` | No | `string` | longitud máxima 255 | Clave de idempotencia (alternativa al header idempotency-key) | `valor-ejemplo` |
| `messageTypeConceptId` | No | `string` | formato `uuid` | Concepto de tipo de mensaje | `00000000-0000-4000-8000-000000000001` |
| `businessIdentifier` | No | `string` | longitud máxima 255 | Identificador de negocio del mensaje | `valor-ejemplo` |
| `correlationId` | No | `string` | formato `uuid` | Correlación con otro flujo | `00000000-0000-4000-8000-000000000001` |
| `subjectTypeConceptId` | No | `string` | formato `uuid` | Concepto de tipo de sujeto | `00000000-0000-4000-8000-000000000001` |
| `subjectEntityId` | No | `string` | formato `uuid` | Id de la entidad sujeto | `00000000-0000-4000-8000-000000000001` |
| `requestHash` | No | `string` | longitud máxima 255 | Hash del request para detectar mismatch de payload | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |
| `payloadFileId` | No | `string` | formato `uuid` | Archivo de payload archivado | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /integration/contracts/00000000-0000-4000-8000-000000000001/exchanges HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ExchangeRecordResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ExchangeRecordResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ExchangeRecordResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ExchangeRecordResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ExchangeRecordResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ExchangeRecordResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ExchangeRecordResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ExchangeRecordResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ExchangeRecordResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ExchangeRecordResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ExchangeRecordResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "integrationContractVersionId": "00000000-0000-4000-8000-000000000001",
  "outcome": "00000000-0000-4000-8000-000000000001",
  "replayed": true,
  "responseReference": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `integrationContractVersionId` | Sí | `string` | formato `uuid` | Identificador asociado a integration contract version. | `00000000-0000-4000-8000-000000000001` |
| `outcome` | Sí | `string` | formato `uuid` | Concepto de resultado | `00000000-0000-4000-8000-000000000001` |
| `replayed` | Sí | `boolean` | Sin restricción adicional declarada | true si la respuesta se devuelve por replay idempotente | `true` |
| `responseReference` | No | `string` | Sin restricción adicional declarada | Referencia de respuesta previa (replay) | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Contrato no encontrado | Excepción explícita en src/modules/integration_contracts/services/integration-exchanges.service.ts |
| 409 | `CONFLICT` | La clave de idempotencia se reusó con un payload distinto | Excepción explícita en src/modules/integration_contracts/services/integration-exchanges.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Falta la clave de idempotencia (idempotency-key) | Excepción explícita en src/modules/integration_contracts/services/integration-exchanges.service.ts |
| 422 | `PRECONDITION_FAILED` | No hay versión ACTIVE del contrato | Excepción explícita en src/modules/integration_contracts/services/integration-exchanges.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/integration/contracts/{id}/exchanges"
}
```

---

## 5. POST /integration/contracts/{id}/exchanges/{recordId}/attempts

- **Módulo:** `integration_contracts`
- **Etiqueta OpenAPI:** `integration-contracts`
- **Nombre:** Registrar un intento de intercambio outbound
- **Operation ID:** `IntegrationContractsController_recordAttempt`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [IntegrationContractsController.recordAttempt](../../src/modules/integration_contracts/controllers/integration-contracts.controller.ts)

### Descripción de negocio

Registrar un intento de intercambio outbound. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /integration/contracts/{id}/exchanges/{recordId}/attempts` en `IntegrationContractsController_recordAttempt`. El controlador delega en `IntegrationExchangesService.recordAttempt`. Valida el body como `IntegrationContractsRecordAttemptDto` y consume `application/json`. El tipo de retorno estático es `Promise<ExchangeAttemptResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `recordId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `IntegrationContractsRecordAttemptDto`; los campos opcionales se omiten.

```http
POST /integration/contracts/00000000-0000-4000-8000-000000000001/exchanges/00000000-0000-4000-8000-000000000001/attempts HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "outcome": "SUCCESS"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `id`, `recordId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `outcome` | Sí | `string` | valores: `SUCCESS`, `FAILED` | Resultado del intento | `SUCCESS` |
| `endpointId` | No | `string` | formato `uuid` | Endpoint destino usado | `00000000-0000-4000-8000-000000000001` |
| `httpStatus` | No | `number` | mínimo 100; máximo 599 | Código de estado HTTP recibido | `100` |
| `providerErrorCode` | No | `string` | longitud máxima 255 | Código de error del proveedor | `CODIGO_EJEMPLO` |
| `retryDecision` | No | `string` | valores: `RETRYABLE`, `PERMANENT` | Decisión de reintento si falla | `RETRYABLE` |
| `responseHash` | No | `string` | longitud máxima 255 | Hash del response | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |
| `responseReference` | No | `string` | longitud máxima 255 | Referencia de respuesta idempotente | `valor-ejemplo` |
| `traceId` | No | `string` | longitud máxima 255 | Id de traza distribuida | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /integration/contracts/00000000-0000-4000-8000-000000000001/exchanges/00000000-0000-4000-8000-000000000001/attempts HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ExchangeAttemptResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ExchangeAttemptResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ExchangeAttemptResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ExchangeAttemptResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ExchangeAttemptResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ExchangeAttemptResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ExchangeAttemptResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ExchangeAttemptResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ExchangeAttemptResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ExchangeAttemptResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ExchangeAttemptResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "integrationExchangeRecordId": "00000000-0000-4000-8000-000000000001",
  "attemptNumber": 1,
  "outcome": "00000000-0000-4000-8000-000000000001",
  "recordOutcome": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `integrationExchangeRecordId` | Sí | `string` | formato `uuid` | Identificador asociado a integration exchange record. | `00000000-0000-4000-8000-000000000001` |
| `attemptNumber` | Sí | `number` | Sin restricción adicional declarada | Valor de attempt number mantenido por la instancia. | `1` |
| `outcome` | Sí | `string` | formato `uuid` | Concepto de resultado del intento | `00000000-0000-4000-8000-000000000001` |
| `recordOutcome` | Sí | `string` | formato `uuid` | Concepto de resultado del registro tras el intento | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Registro de intercambio no encontrado | Excepción explícita en src/modules/integration_contracts/services/integration-exchanges.service.ts |
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
  "path": "/integration/contracts/{id}/exchanges/{recordId}/attempts"
}
```

---

## 6. POST /integration/contracts/{id}/retire

- **Módulo:** `integration_contracts`
- **Etiqueta OpenAPI:** `integration-contracts`
- **Nombre:** Retirar el contrato (soft-delete lógico)
- **Operation ID:** `IntegrationContractsController_retireContract`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [IntegrationContractsController.retireContract](../../src/modules/integration_contracts/controllers/integration-contracts.controller.ts)

### Descripción de negocio

Retirar el contrato (soft-delete lógico). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-31-11 (retiro del contrato).

### Descripción del sistema

NestJS resuelve `POST /integration/contracts/{id}/retire` en `IntegrationContractsController_retireContract`. El controlador delega en `IntegrationContractsService.retireContract`. Valida el body como `RetireContractDto` y consume `application/json`. El tipo de retorno estático es `Promise<StatusResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RetireContractDto`; los campos opcionales se omiten.

```http
POST /integration/contracts/00000000-0000-4000-8000-000000000001/retire HTTP/1.1
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
| `reason` | No | `string` | longitud máxima 500 | Motivo del retiro (auditoría) | `Texto descriptivo de ejemplo` |
| `forceDeadLetter` | No | `boolean` | Sin restricción adicional declarada | Forzar dead-letter documentado de intercambios PENDING | `true` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /integration/contracts/00000000-0000-4000-8000-000000000001/retire HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "reason": "Texto descriptivo de ejemplo",
  "forceDeadLetter": true
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
| 404 | `NOT_FOUND` | Contrato no encontrado | Excepción explícita en src/modules/integration_contracts/services/integration-contracts.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El contrato ya está retirado | Excepción explícita en src/modules/integration_contracts/services/integration-contracts.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/integration/contracts/{id}/retire"
}
```

---

## 7. POST /integration/contracts/{id}/sync-cursors/{scope}/advance

- **Módulo:** `integration_contracts`
- **Etiqueta OpenAPI:** `integration-contracts`
- **Nombre:** Avanzar el cursor de sincronización
- **Operation ID:** `IntegrationContractsController_advanceCursor`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [IntegrationContractsController.advanceCursor](../../src/modules/integration_contracts/controllers/integration-contracts.controller.ts)

### Descripción de negocio

Avanzar el cursor de sincronización. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /integration/contracts/{id}/sync-cursors/{scope}/advance` en `IntegrationContractsController_advanceCursor`. El controlador delega en `IntegrationExchangesService.advanceCursor`. Valida el body como `AdvanceCursorDto` y consume `application/json`. El tipo de retorno estático es `Promise<SyncCursorResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `scope` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `AdvanceCursorDto`; los campos opcionales se omiten.

```http
POST /integration/contracts/00000000-0000-4000-8000-000000000001/sync-cursors/valor-ejemplo/advance HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "cursorValue": "valor-ejemplo"
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
| `cursorValue` | Sí | `string` | longitud mínima 1; longitud máxima 4096 | Nuevo valor del cursor (debe avanzar hacia adelante) | `valor-ejemplo` |
| `watermarkAt` | No | `string` | Sin restricción adicional declarada | Marca de agua del avance (ISO 8601) | `valor-ejemplo` |
| `lastSuccessfulExchangeId` | No | `string` | formato `uuid` | Último intercambio exitoso que valida el avance | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /integration/contracts/00000000-0000-4000-8000-000000000001/sync-cursors/valor-ejemplo/advance HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "cursorValue": "valor-ejemplo",
  "watermarkAt": "valor-ejemplo",
  "lastSuccessfulExchangeId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<SyncCursorResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<SyncCursorResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<SyncCursorResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<SyncCursorResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<SyncCursorResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<SyncCursorResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<SyncCursorResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<SyncCursorResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<SyncCursorResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<SyncCursorResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `SyncCursorResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "cursorScope": "valor-ejemplo",
  "cursorValue": "valor-ejemplo",
  "created": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `cursorScope` | Sí | `string` | Sin restricción adicional declarada | Valor de cursor scope mantenido por la instancia. | `valor-ejemplo` |
| `cursorValue` | Sí | `string` | Sin restricción adicional declarada | Valor de cursor value mantenido por la instancia. | `valor-ejemplo` |
| `created` | Sí | `boolean` | Sin restricción adicional declarada | true si se creó el cursor en esta operación | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Contrato no encontrado | Excepción explícita en src/modules/integration_contracts/services/integration-exchanges.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El cursor solo puede avanzar hacia adelante | Excepción explícita en src/modules/integration_contracts/services/integration-exchanges.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/integration/contracts/{id}/sync-cursors/{scope}/advance"
}
```

---

## 8. POST /integration/contracts/{id}/versions

- **Módulo:** `integration_contracts`
- **Etiqueta OpenAPI:** `integration-contracts`
- **Nombre:** Publicar una nueva versión de contrato
- **Operation ID:** `IntegrationContractsController_publishVersion`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [IntegrationContractsController.publishVersion](../../src/modules/integration_contracts/controllers/integration-contracts.controller.ts)

### Descripción de negocio

Publicar una nueva versión de contrato. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /integration/contracts/{id}/versions` en `IntegrationContractsController_publishVersion`. El controlador delega en `IntegrationContractsService.publishVersion`. Valida el body como `CreateContractVersionDto` y consume `application/json`. El tipo de retorno estático es `Promise<ContractVersionResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateContractVersionDto`; los campos opcionales se omiten.

```http
POST /integration/contracts/00000000-0000-4000-8000-000000000001/versions HTTP/1.1
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
| `requestSchemaFileId` | No | `string` | formato `uuid` | Archivo de esquema de request | `00000000-0000-4000-8000-000000000001` |
| `responseSchemaFileId` | No | `string` | formato `uuid` | Archivo de esquema de response | `00000000-0000-4000-8000-000000000001` |
| `openapiFileId` | No | `string` | formato `uuid` | Archivo OpenAPI | `00000000-0000-4000-8000-000000000001` |
| `mappingProfileId` | No | `string` | formato `uuid` | Perfil de mapeo asociado | `00000000-0000-4000-8000-000000000001` |
| `contractHash` | No | `string` | longitud máxima 200 | Hash del contrato para detectar drift de esquema | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |
| `effectiveFrom` | No | `string` | Sin restricción adicional declarada | Inicio de vigencia (ISO 8601) | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /integration/contracts/00000000-0000-4000-8000-000000000001/versions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "requestSchemaFileId": "00000000-0000-4000-8000-000000000001",
  "responseSchemaFileId": "00000000-0000-4000-8000-000000000001",
  "openapiFileId": "00000000-0000-4000-8000-000000000001",
  "mappingProfileId": "00000000-0000-4000-8000-000000000001",
  "contractHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "effectiveFrom": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ContractVersionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ContractVersionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ContractVersionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ContractVersionResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ContractVersionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ContractVersionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ContractVersionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ContractVersionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ContractVersionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ContractVersionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ContractVersionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "integrationContractId": "00000000-0000-4000-8000-000000000001",
  "versionNumber": 1,
  "status": "00000000-0000-4000-8000-000000000001",
  "effectiveFrom": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `integrationContractId` | Sí | `string` | formato `uuid` | Identificador asociado a integration contract. | `00000000-0000-4000-8000-000000000001` |
| `versionNumber` | Sí | `number` | Sin restricción adicional declarada | Valor de version number mantenido por la instancia. | `1` |
| `status` | Sí | `string` | formato `uuid` | Concepto de estado de la versión | `00000000-0000-4000-8000-000000000001` |
| `effectiveFrom` | No | `string` | formato `date-time` | Valor de effective from mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Contrato no encontrado | Excepción explícita en src/modules/integration_contracts/services/integration-contracts.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Solo se pueden publicar versiones en contratos DRAFT o ACTIVE | Excepción explícita en src/modules/integration_contracts/services/integration-contracts.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/integration/contracts/{id}/versions"
}
```

---

## 9. POST /integration/contracts/{id}/versions/{versionId}/activate

- **Módulo:** `integration_contracts`
- **Etiqueta OpenAPI:** `integration-contracts`
- **Nombre:** Activar una versión y transicionar el estado del contrato
- **Operation ID:** `IntegrationContractsController_activateVersion`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [IntegrationContractsController.activateVersion](../../src/modules/integration_contracts/controllers/integration-contracts.controller.ts)

### Descripción de negocio

Activar una versión y transicionar el estado del contrato. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /integration/contracts/{id}/versions/{versionId}/activate` en `IntegrationContractsController_activateVersion`. El controlador delega en `IntegrationContractsService.activateVersion`. Valida el body como `ActivateVersionDto` y consume `application/json`. El tipo de retorno estático es `Promise<StatusResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `versionId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ActivateVersionDto`; los campos opcionales se omiten.

```http
POST /integration/contracts/00000000-0000-4000-8000-000000000001/versions/00000000-0000-4000-8000-000000000001/activate HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `id`, `versionId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `effectiveFrom` | No | `string` | Sin restricción adicional declarada | Inicio de vigencia explícito (ISO 8601); por defecto now() | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /integration/contracts/00000000-0000-4000-8000-000000000001/versions/00000000-0000-4000-8000-000000000001/activate HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "effectiveFrom": "valor-ejemplo"
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
| 404 | `NOT_FOUND` | Contrato no encontrado | Excepción explícita en src/modules/integration_contracts/services/integration-contracts.service.ts |
| 404 | `NOT_FOUND` | Versión no encontrada para el contrato | Excepción explícita en src/modules/integration_contracts/services/integration-contracts.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Solo se puede activar una versión DRAFT | Excepción explícita en src/modules/integration_contracts/services/integration-contracts.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/integration/contracts/{id}/versions/{versionId}/activate"
}
```

---

## 10. POST /integration/contracts/{id}/webhook-subscriptions

- **Módulo:** `integration_contracts`
- **Etiqueta OpenAPI:** `integration-contracts`
- **Nombre:** Suscribir un webhook al contrato
- **Operation ID:** `IntegrationContractsController_subscribeWebhook`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [IntegrationContractsController.subscribeWebhook](../../src/modules/integration_contracts/controllers/integration-contracts.controller.ts)

### Descripción de negocio

Suscribir un webhook al contrato. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /integration/contracts/{id}/webhook-subscriptions` en `IntegrationContractsController_subscribeWebhook`. El controlador delega en `IntegrationWebhooksService.subscribe`. Valida el body como `IntegrationContractsCreateWebhookSubscriptionDto` y consume `application/json`. El tipo de retorno estático es `Promise<WebhookSubscriptionResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `IntegrationContractsCreateWebhookSubscriptionDto`; los campos opcionales se omiten.

```http
POST /integration/contracts/00000000-0000-4000-8000-000000000001/webhook-subscriptions HTTP/1.1
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
| `eventTypeConceptId` | No | `string` | formato `uuid` | Concepto de tipo de evento suscrito | `00000000-0000-4000-8000-000000000001` |
| `callbackUri` | No | `string` | longitud máxima 2048 | URI de callback con TLS | `valor-ejemplo` |
| `signingKeyReference` | No | `string` | longitud máxima 2048 | Referencia a la clave de firma en secret-manager | `valor-ejemplo` |
| `secretReference` | No | `string` | longitud máxima 2048 | Referencia al secreto en secret-manager | `valor-ejemplo` |
| `validFrom` | No | `string` | Sin restricción adicional declarada | Inicio de validez (ISO 8601) | `valor-ejemplo` |
| `validTo` | No | `string` | Sin restricción adicional declarada | Fin de validez (ISO 8601) | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /integration/contracts/00000000-0000-4000-8000-000000000001/webhook-subscriptions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "eventTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "callbackUri": "valor-ejemplo",
  "signingKeyReference": "valor-ejemplo",
  "secretReference": "valor-ejemplo",
  "validFrom": "valor-ejemplo",
  "validTo": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<WebhookSubscriptionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<WebhookSubscriptionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<WebhookSubscriptionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<WebhookSubscriptionResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<WebhookSubscriptionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<WebhookSubscriptionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<WebhookSubscriptionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<WebhookSubscriptionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<WebhookSubscriptionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<WebhookSubscriptionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `WebhookSubscriptionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "providerId": "00000000-0000-4000-8000-000000000001",
  "eventType": "valor-ejemplo",
  "state": "00000000-0000-4000-8000-000000000001",
  "updated": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `providerId` | Sí | `string` | formato `uuid` | Identificador asociado a provider. | `00000000-0000-4000-8000-000000000001` |
| `eventType` | Sí | `string` | Sin restricción adicional declarada | Valor de event type mantenido por la instancia. | `valor-ejemplo` |
| `state` | Sí | `string` | formato `uuid` | Concept id del estado | `00000000-0000-4000-8000-000000000001` |
| `updated` | Sí | `boolean` | Sin restricción adicional declarada | true si se actualizó una suscripción existente | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Contrato no encontrado | Excepción explícita en src/modules/integration_contracts/services/integration-webhooks.service.ts |
| 409 | `CONFLICT` | Ya existe una suscripción para ese evento y callback | Excepción explícita en src/modules/integration_contracts/services/integration-webhooks.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El contrato debe estar ACTIVE para suscribir webhooks | Excepción explícita en src/modules/integration_contracts/services/integration-webhooks.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/integration/contracts/{id}/webhook-subscriptions"
}
```

---

## 11. POST /integration/exchanges/{recordId}/retry

- **Módulo:** `integration_contracts`
- **Etiqueta OpenAPI:** `integration-exchanges`
- **Nombre:** Reintentar un intercambio fallido
- **Operation ID:** `IntegrationExchangesController_retry`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [IntegrationExchangesController.retry](../../src/modules/integration_contracts/controllers/integration-exchanges.controller.ts)

### Descripción de negocio

Reintentar un intercambio fallido. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /integration/exchanges/{recordId}/retry` en `IntegrationExchangesController_retry`. El controlador delega en `IntegrationExchangesService.retry`. Valida el body como `RetryExchangeDto` y consume `application/json`. El tipo de retorno estático es `Promise<ExchangeAttemptResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `recordId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RetryExchangeDto`; los campos opcionales se omiten.

```http
POST /integration/exchanges/00000000-0000-4000-8000-000000000001/retry HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `recordId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `outcome` | No | `string` | valores: `SUCCESS`, `FAILED` | Resultado del reintento (por defecto SUCCESS) | `SUCCESS` |
| `httpStatus` | No | `number` | mínimo 100; máximo 599 | Código de estado HTTP recibido | `100` |
| `traceId` | No | `string` | longitud máxima 255 | Id de traza distribuida | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /integration/exchanges/00000000-0000-4000-8000-000000000001/retry HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "outcome": "SUCCESS",
  "httpStatus": 100,
  "traceId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ExchangeAttemptResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ExchangeAttemptResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ExchangeAttemptResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ExchangeAttemptResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ExchangeAttemptResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ExchangeAttemptResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ExchangeAttemptResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ExchangeAttemptResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ExchangeAttemptResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ExchangeAttemptResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ExchangeAttemptResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "integrationExchangeRecordId": "00000000-0000-4000-8000-000000000001",
  "attemptNumber": 1,
  "outcome": "00000000-0000-4000-8000-000000000001",
  "recordOutcome": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `integrationExchangeRecordId` | Sí | `string` | formato `uuid` | Identificador asociado a integration exchange record. | `00000000-0000-4000-8000-000000000001` |
| `attemptNumber` | Sí | `number` | Sin restricción adicional declarada | Valor de attempt number mantenido por la instancia. | `1` |
| `outcome` | Sí | `string` | formato `uuid` | Concepto de resultado del intento | `00000000-0000-4000-8000-000000000001` |
| `recordOutcome` | Sí | `string` | formato `uuid` | Concepto de resultado del registro tras el intento | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Registro de intercambio no encontrado | Excepción explícita en src/modules/integration_contracts/services/integration-exchanges.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Solo se reintenta un intercambio con último intento FAILED | Excepción explícita en src/modules/integration_contracts/services/integration-exchanges.service.ts |
| 422 | `PRECONDITION_FAILED` | El último intento marcó fallo permanente (no reintentable) | Excepción explícita en src/modules/integration_contracts/services/integration-exchanges.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/integration/exchanges/{recordId}/retry"
}
```

---

## 12. POST /integration/webhooks/{subscriptionId}/deliveries

- **Módulo:** `integration_contracts`
- **Etiqueta OpenAPI:** `integration-exchanges`
- **Nombre:** Entregar y verificar un webhook firmado
- **Operation ID:** `IntegrationExchangesController_deliver`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [IntegrationExchangesController.deliver](../../src/modules/integration_contracts/controllers/integration-exchanges.controller.ts)

### Descripción de negocio

Entregar y verificar un webhook firmado. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /integration/webhooks/{subscriptionId}/deliveries` en `IntegrationExchangesController_deliver`. El controlador delega en `IntegrationWebhooksService.deliver`. Valida el body como `DeliverWebhookDto` y consume `application/json`. El tipo de retorno estático es `Promise<DeliveryEvidenceResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `subscriptionId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `DeliverWebhookDto`; los campos opcionales se omiten.

```http
POST /integration/webhooks/00000000-0000-4000-8000-000000000001/deliveries HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `subscriptionId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `outcome` | No | `string` | valores: `DELIVERED`, `FAILED` | Resultado de la entrega (por defecto DELIVERED) | `DELIVERED` |
| `signatureAlgorithm` | No | `string` | longitud máxima 100 | Algoritmo de firma HMAC | `valor-ejemplo` |
| `signatureVerified` | No | `boolean` | Sin restricción adicional declarada | true si la firma se verificó correctamente | `true` |
| `correlationId` | No | `string` | formato `uuid` | Correlación con el evento de negocio | `00000000-0000-4000-8000-000000000001` |
| `requestHash` | No | `string` | longitud máxima 255 | Hash del payload entregado | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |
| `acknowledged` | No | `boolean` | Sin restricción adicional declarada | true si el receptor confirmó la recepción (ACK) | `true` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /integration/webhooks/00000000-0000-4000-8000-000000000001/deliveries HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "outcome": "DELIVERED",
  "signatureAlgorithm": "valor-ejemplo",
  "signatureVerified": true,
  "correlationId": "00000000-0000-4000-8000-000000000001",
  "requestHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "acknowledged": true
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<DeliveryEvidenceResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<DeliveryEvidenceResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<DeliveryEvidenceResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<DeliveryEvidenceResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<DeliveryEvidenceResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<DeliveryEvidenceResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<DeliveryEvidenceResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<DeliveryEvidenceResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<DeliveryEvidenceResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<DeliveryEvidenceResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DeliveryEvidenceResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "integrationExchangeRecordId": "00000000-0000-4000-8000-000000000001",
  "outcome": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `integrationExchangeRecordId` | Sí | `string` | formato `uuid` | Identificador asociado a integration exchange record. | `00000000-0000-4000-8000-000000000001` |
| `outcome` | Sí | `string` | formato `uuid` | Concepto de resultado de la entrega | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Suscripción de webhook no encontrada | Excepción explícita en src/modules/integration_contracts/services/integration-webhooks.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La suscripción no está ACTIVE | Excepción explícita en src/modules/integration_contracts/services/integration-webhooks.service.ts |
| 422 | `PRECONDITION_FAILED` | La suscripción aún no es válida | Excepción explícita en src/modules/integration_contracts/services/integration-webhooks.service.ts |
| 422 | `PRECONDITION_FAILED` | La suscripción ya expiró | Excepción explícita en src/modules/integration_contracts/services/integration-webhooks.service.ts |
| 422 | `PRECONDITION_FAILED` | No hay versión ACTIVE del contrato para entregar | Excepción explícita en src/modules/integration_contracts/services/integration-webhooks.service.ts |
| 422 | `PRECONDITION_FAILED` | La suscripción no tiene callbackUri para entregar | Excepción explícita en src/modules/integration_contracts/services/integration-webhooks.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/integration/webhooks/{subscriptionId}/deliveries"
}
```

---

