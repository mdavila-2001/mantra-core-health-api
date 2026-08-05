<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `pharmacy`

Referencia exhaustiva de 11 operación(es) del módulo `pharmacy`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `pharmacy`
- **Controladores:** `PharmacyController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [POST /pharmacies](#1-post-pharmacies) — Alta de farmacia con licencia inicial
2. [POST /pharmacies/{pharmacyId}/integration-connections](#2-post-pharmacies-pharmacyid-integration-connections) — Establecer conexión de integración externa
3. [POST /pharmacies/{pharmacyId}/integration-connections/{connId}/product-mappings](#3-post-pharmacies-pharmacyid-integration-connections-connid-product-mappings) — Mapear producto a código de proveedor externo
4. [POST /pharmacies/{pharmacyId}/licenses/{licenseId}/verify](#4-post-pharmacies-pharmacyid-licenses-licenseid-verify) — Verificar licencia y aprobar farmacia
5. [POST /pharmacies/{pharmacyId}/price-lists](#5-post-pharmacies-pharmacyid-price-lists) — Crear lista de precios (pública / por aseguradora)
6. [POST /pharmacies/{pharmacyId}/price-lists/{priceListId}/close](#6-post-pharmacies-pharmacyid-price-lists-pricelistid-close) — Cerrar/expirar lista de precios
7. [POST /pharmacies/{pharmacyId}/price-lists/{priceListId}/prices](#7-post-pharmacies-pharmacyid-price-lists-pricelistid-prices) — Fijar/versionar precio de producto
8. [POST /pharmacies/{pharmacyId}/products](#8-post-pharmacies-pharmacyid-products) — Publicar producto en catálogo con identificadores
9. [DELETE /pharmacies/{pharmacyId}/products/{productId}](#9-delete-pharmacies-pharmacyid-products-productid) — Retirar (soft-delete) producto del catálogo
10. [POST /pharmacies/{pharmacyId}/projections](#10-post-pharmacies-pharmacyid-projections) — Proyectar catálogo y precios a read-model
11. [POST /pharmacies/{pharmacyId}/sites](#11-post-pharmacies-pharmacyid-sites) — Registrar sede dispensadora

---

## 1. POST /pharmacies

- **Módulo:** `pharmacy`
- **Etiqueta OpenAPI:** `pharmacy`
- **Nombre:** Alta de farmacia con licencia inicial
- **Operation ID:** `PharmacyController_createPharmacy`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyController.createPharmacy](../../src/modules/pharmacy/controllers/pharmacy.controller.ts)

### Descripción de negocio

Alta de farmacia con licencia inicial. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /pharmacies` en `PharmacyController_createPharmacy`. El controlador delega en `PharmaciesService.createPharmacy`. Valida el body como `CreatePharmacyDto` y consume `application/json`. El tipo de retorno estático es `Promise<PharmacyResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreatePharmacyDto`; los campos opcionales se omiten.

```http
POST /pharmacies HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "legalName": "Nombre de ejemplo",
  "license": {
    "licenseNumber": "valor-ejemplo"
  }
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
| `tenantId` | Sí | `string` | formato `uuid` | Tenant propietario de la farmacia | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | longitud mínima 1; longitud máxima 100 | Código único de la farmacia por tenant | `CODIGO_EJEMPLO` |
| `legalName` | Sí | `string` | longitud mínima 1; longitud máxima 300 | Razón social | `Nombre de ejemplo` |
| `tradeName` | No | `string` | longitud máxima 300 | Nombre comercial | `Nombre de ejemplo` |
| `isRetail` | No | `boolean` | Sin restricción adicional declarada | Tenant no público / farmacia interna | `false` |
| `license` | Sí | `InitialLicenseDto` | Sin restricción adicional declarada | Licencia inicial de la farmacia | `{"licenseNumber":"valor-ejemplo","issuingAuthorityTenantId":"00000000-0000-4000-8000-000000000001","jurisdictionConceptId":"00000000-0000-4000-8000-000000000001","validFrom":"2026-07-31","validTo":"2026-07-31","evidenceFileId":"00000000-0000-4000-8000-000000000001"}` |
| `license.licenseNumber` | Sí | `string` | longitud máxima 200 | Número de licencia | `valor-ejemplo` |
| `license.issuingAuthorityTenantId` | No | `string` | formato `uuid` | Tenant de la autoridad emisora | `00000000-0000-4000-8000-000000000001` |
| `license.jurisdictionConceptId` | No | `string` | formato `uuid` | Concept id de la jurisdicción | `00000000-0000-4000-8000-000000000001` |
| `license.validFrom` | No | `string` | formato `date` | Inicio de vigencia | `2026-07-31` |
| `license.validTo` | No | `string` | formato `date` | Fin de vigencia | `2026-07-31` |
| `license.evidenceFileId` | No | `string` | formato `uuid` | Archivo de evidencia de la licencia | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /pharmacies HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "legalName": "Nombre de ejemplo",
  "tradeName": "Nombre de ejemplo",
  "isRetail": false,
  "license": {
    "licenseNumber": "valor-ejemplo",
    "issuingAuthorityTenantId": "00000000-0000-4000-8000-000000000001",
    "jurisdictionConceptId": "00000000-0000-4000-8000-000000000001",
    "validFrom": "2026-07-31",
    "validTo": "2026-07-31",
    "evidenceFileId": "00000000-0000-4000-8000-000000000001"
  }
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<PharmacyResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<PharmacyResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PharmacyResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PharmacyResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PharmacyResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<PharmacyResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PharmacyResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PharmacyResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PharmacyResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PharmacyResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "legalName": "Nombre de ejemplo",
  "status": "00000000-0000-4000-8000-000000000001",
  "verificationStatus": "00000000-0000-4000-8000-000000000001",
  "licenseId": "00000000-0000-4000-8000-000000000001",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Valor de code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `legalName` | Sí | `string` | Sin restricción adicional declarada | Valor de legal name mantenido por la instancia. | `Nombre de ejemplo` |
| `status` | Sí | `string` | formato `uuid` | Concept id del estado | `00000000-0000-4000-8000-000000000001` |
| `verificationStatus` | Sí | `string` | formato `uuid` | Concept id del estado de verificación | `00000000-0000-4000-8000-000000000001` |
| `licenseId` | Sí | `string` | formato `uuid` | Id de la licencia inicial creada | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Ya existe una farmacia con ese código en el tenant | Excepción explícita en src/modules/pharmacy/services/pharmacies.service.ts |
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
  "path": "/pharmacies"
}
```

---

## 2. POST /pharmacies/{pharmacyId}/integration-connections

- **Módulo:** `pharmacy`
- **Etiqueta OpenAPI:** `pharmacy`
- **Nombre:** Establecer conexión de integración externa
- **Operation ID:** `PharmacyController_createConnection`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyController.createConnection](../../src/modules/pharmacy/controllers/pharmacy.controller.ts)

### Descripción de negocio

Establecer conexión de integración externa. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /pharmacies/{pharmacyId}/integration-connections` en `PharmacyController_createConnection`. El controlador delega en `PharmacyIntegrationService.createConnection`. Valida el body como `CreateConnectionDto` y consume `application/json`. El tipo de retorno estático es `Promise<ConnectionResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateConnectionDto`; los campos opcionales se omiten.

```http
POST /pharmacies/00000000-0000-4000-8000-000000000001/integration-connections HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "integrationMode": "REALTIME"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `pharmacyId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `integrationMode` | Sí | `string` | valores: `REALTIME`, `BATCH` | Modo de integración | `REALTIME` |
| `connectionId` | No | `string` | formato `uuid` | Conexión de integración externa registrada; si se omite, la fila se auto-referencia | `00000000-0000-4000-8000-000000000001` |
| `pharmacySiteId` | No | `string` | formato `uuid` | Sede a la que aplica la conexión | `00000000-0000-4000-8000-000000000001` |
| `inventoryAuthorityConceptId` | No | `string` | formato `uuid` | Concept id de la autoridad de inventario | `00000000-0000-4000-8000-000000000001` |
| `supportsStockQuery` | No | `boolean` | Sin restricción adicional declarada | Soporta consulta de stock | `true` |
| `supportsPriceQuery` | No | `boolean` | Sin restricción adicional declarada | Soporta consulta de precio | `true` |
| `supportsReservation` | No | `boolean` | Sin restricción adicional declarada | Soporta reserva | `true` |
| `supportsDispenseConfirmation` | No | `boolean` | Sin restricción adicional declarada | Soporta confirmación de dispensación | `true` |
| `manualFallbackAllowed` | No | `boolean` | Sin restricción adicional declarada | Permite fallback manual | `true` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /pharmacies/00000000-0000-4000-8000-000000000001/integration-connections HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "integrationMode": "REALTIME",
  "connectionId": "00000000-0000-4000-8000-000000000001",
  "pharmacySiteId": "00000000-0000-4000-8000-000000000001",
  "inventoryAuthorityConceptId": "00000000-0000-4000-8000-000000000001",
  "supportsStockQuery": true,
  "supportsPriceQuery": true,
  "supportsReservation": true,
  "supportsDispenseConfirmation": true,
  "manualFallbackAllowed": true
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ConnectionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ConnectionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ConnectionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ConnectionResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ConnectionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ConnectionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ConnectionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ConnectionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ConnectionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ConnectionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ConnectionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "pharmacyId": "00000000-0000-4000-8000-000000000001",
  "connectionId": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `pharmacyId` | Sí | `string` | formato `uuid` | Identificador asociado a pharmacy. | `00000000-0000-4000-8000-000000000001` |
| `connectionId` | Sí | `string` | formato `uuid` | Identificador asociado a connection. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concept id del estado | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Farmacia no encontrada | Excepción explícita en src/modules/pharmacy/services/pharmacy-integration.service.ts |
| 409 | `CONFLICT` | Ya existe una conexión para esa integración | Excepción explícita en src/modules/pharmacy/services/pharmacy-integration.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La farmacia no está activa | Excepción explícita en src/modules/pharmacy/services/pharmacy-integration.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pharmacies/{pharmacyId}/integration-connections"
}
```

---

## 3. POST /pharmacies/{pharmacyId}/integration-connections/{connId}/product-mappings

- **Módulo:** `pharmacy`
- **Etiqueta OpenAPI:** `pharmacy`
- **Nombre:** Mapear producto a código de proveedor externo
- **Operation ID:** `PharmacyController_mapProduct`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyController.mapProduct](../../src/modules/pharmacy/controllers/pharmacy.controller.ts)

### Descripción de negocio

Mapear producto a código de proveedor externo. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /pharmacies/{pharmacyId}/integration-connections/{connId}/product-mappings` en `PharmacyController_mapProduct`. El controlador delega en `PharmacyIntegrationService.mapProduct`. Valida el body como `CreateMappingDto` y consume `application/json`. El tipo de retorno estático es `Promise<MappingResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `connId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateMappingDto`; los campos opcionales se omiten.

```http
POST /pharmacies/00000000-0000-4000-8000-000000000001/integration-connections/00000000-0000-4000-8000-000000000001/product-mappings HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "pharmacyProductId": "00000000-0000-4000-8000-000000000001",
  "externalProductCode": "CODIGO_EJEMPLO"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `pharmacyId`, `connId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `pharmacyProductId` | Sí | `string` | formato `uuid` | Producto a mapear | `00000000-0000-4000-8000-000000000001` |
| `externalProductCode` | Sí | `string` | longitud mínima 1; longitud máxima 200 | Código de producto en el sistema externo | `CODIGO_EJEMPLO` |
| `externalUnitCode` | No | `string` | longitud máxima 100 | Código de unidad en el sistema externo | `CODIGO_EJEMPLO` |
| `mappingVersion` | No | `string` | longitud máxima 100 | Versión del mapeo | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /pharmacies/00000000-0000-4000-8000-000000000001/integration-connections/00000000-0000-4000-8000-000000000001/product-mappings HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "pharmacyProductId": "00000000-0000-4000-8000-000000000001",
  "externalProductCode": "CODIGO_EJEMPLO",
  "externalUnitCode": "CODIGO_EJEMPLO",
  "mappingVersion": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<MappingResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<MappingResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<MappingResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<MappingResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<MappingResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<MappingResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<MappingResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<MappingResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<MappingResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<MappingResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `MappingResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "pharmacyIntegrationConnectionId": "00000000-0000-4000-8000-000000000001",
  "pharmacyProductId": "00000000-0000-4000-8000-000000000001",
  "externalProductCode": "CODIGO_EJEMPLO",
  "verificationStatus": "00000000-0000-4000-8000-000000000001",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `pharmacyIntegrationConnectionId` | Sí | `string` | formato `uuid` | Identificador asociado a pharmacy integration connection. | `00000000-0000-4000-8000-000000000001` |
| `pharmacyProductId` | Sí | `string` | formato `uuid` | Identificador asociado a pharmacy product. | `00000000-0000-4000-8000-000000000001` |
| `externalProductCode` | Sí | `string` | Sin restricción adicional declarada | Valor de external product code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `verificationStatus` | Sí | `string` | formato `uuid` | Concept id del estado de verificación | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Conexión no encontrada | Excepción explícita en src/modules/pharmacy/services/pharmacy-integration.service.ts |
| 404 | `NOT_FOUND` | Producto no encontrado | Excepción explícita en src/modules/pharmacy/services/pharmacy-integration.service.ts |
| 409 | `CONFLICT` | El producto ya está mapeado en esta conexión | Excepción explícita en src/modules/pharmacy/services/pharmacy-integration.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La conexión no está activa | Excepción explícita en src/modules/pharmacy/services/pharmacy-integration.service.ts |
| 422 | `PRECONDITION_FAILED` | La conexión no soporta consulta de stock ni de precio | Excepción explícita en src/modules/pharmacy/services/pharmacy-integration.service.ts |
| 422 | `PRECONDITION_FAILED` | El producto no está activo | Excepción explícita en src/modules/pharmacy/services/pharmacy-integration.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pharmacies/{pharmacyId}/integration-connections/{connId}/product-mappings"
}
```

---

## 4. POST /pharmacies/{pharmacyId}/licenses/{licenseId}/verify

- **Módulo:** `pharmacy`
- **Etiqueta OpenAPI:** `pharmacy`
- **Nombre:** Verificar licencia y aprobar farmacia
- **Operation ID:** `PharmacyController_verifyLicense`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyController.verifyLicense](../../src/modules/pharmacy/controllers/pharmacy.controller.ts)

### Descripción de negocio

Verificar licencia y aprobar farmacia. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /pharmacies/{pharmacyId}/licenses/{licenseId}/verify` en `PharmacyController_verifyLicense`. El controlador delega en `PharmaciesService.verifyLicense`. Valida el body como `PharmacyVerifyLicenseDto` y consume `application/json`. El tipo de retorno estático es `Promise<StatusResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `licenseId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `PharmacyVerifyLicenseDto`; los campos opcionales se omiten.

```http
POST /pharmacies/00000000-0000-4000-8000-000000000001/licenses/00000000-0000-4000-8000-000000000001/verify HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `pharmacyId`, `licenseId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `approve` | No | `boolean` | Sin restricción adicional declarada | true (por defecto) verifica; false rechaza la licencia | `true` |
| `evidenceFileId` | No | `string` | formato `uuid` | Archivo de evidencia usado en la verificación | `00000000-0000-4000-8000-000000000001` |
| `reason` | No | `string` | longitud máxima 500 | Motivo del rechazo (si aplica) | `Texto descriptivo de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /pharmacies/00000000-0000-4000-8000-000000000001/licenses/00000000-0000-4000-8000-000000000001/verify HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "approve": true,
  "evidenceFileId": "00000000-0000-4000-8000-000000000001",
  "reason": "Texto descriptivo de ejemplo"
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
| 404 | `NOT_FOUND` | Farmacia no encontrada | Excepción explícita en src/modules/pharmacy/services/pharmacies.service.ts |
| 404 | `NOT_FOUND` | Licencia no encontrada | Excepción explícita en src/modules/pharmacy/services/pharmacies.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La licencia no está pendiente de verificación | Excepción explícita en src/modules/pharmacy/services/pharmacies.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pharmacies/{pharmacyId}/licenses/{licenseId}/verify"
}
```

---

## 5. POST /pharmacies/{pharmacyId}/price-lists

- **Módulo:** `pharmacy`
- **Etiqueta OpenAPI:** `pharmacy`
- **Nombre:** Crear lista de precios (pública / por aseguradora)
- **Operation ID:** `PharmacyController_createPriceList`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyController.createPriceList](../../src/modules/pharmacy/controllers/pharmacy.controller.ts)

### Descripción de negocio

Crear lista de precios (pública / por aseguradora). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /pharmacies/{pharmacyId}/price-lists` en `PharmacyController_createPriceList`. El controlador delega en `PharmacyPricingService.createPriceList`. Valida el body como `CreatePriceListDto` y consume `application/json`. El tipo de retorno estático es `Promise<PriceListResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreatePriceListDto`; los campos opcionales se omiten.

```http
POST /pharmacies/00000000-0000-4000-8000-000000000001/price-lists HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO",
  "priceListType": "PUBLIC"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `pharmacyId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `code` | Sí | `string` | longitud mínima 1; longitud máxima 100 | Código único de lista por farmacia | `CODIGO_EJEMPLO` |
| `priceListType` | Sí | `string` | valores: `PUBLIC`, `INSURER` | Tipo de lista de precios | `PUBLIC` |
| `pharmacySiteId` | No | `string` | formato `uuid` | Sede a la que aplica la lista | `00000000-0000-4000-8000-000000000001` |
| `insurerTenantId` | No | `string` | formato `uuid` | Tenant aseguradora (obligatorio si tipo INSURER) | `00000000-0000-4000-8000-000000000001` |
| `currencyConceptId` | No | `string` | formato `uuid` | Concept id de la moneda | `00000000-0000-4000-8000-000000000001` |
| `validFrom` | No | `string` | formato `date-time` | Inicio de vigencia | `2026-07-31T12:00:00.000Z` |
| `validTo` | No | `string` | formato `date-time` | Fin de vigencia | `2026-07-31T12:00:00.000Z` |
| `publicVisibility` | No | `boolean` | Sin restricción adicional declarada | Visible públicamente | `true` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /pharmacies/00000000-0000-4000-8000-000000000001/price-lists HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO",
  "priceListType": "PUBLIC",
  "pharmacySiteId": "00000000-0000-4000-8000-000000000001",
  "insurerTenantId": "00000000-0000-4000-8000-000000000001",
  "currencyConceptId": "00000000-0000-4000-8000-000000000001",
  "validFrom": "2026-07-31T12:00:00.000Z",
  "validTo": "2026-07-31T12:00:00.000Z",
  "publicVisibility": true
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<PriceListResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<PriceListResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PriceListResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PriceListResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<PriceListResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PriceListResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<PriceListResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PriceListResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PriceListResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PriceListResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PriceListResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "pharmacyId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "priceListType": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `pharmacyId` | Sí | `string` | formato `uuid` | Identificador asociado a pharmacy. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Valor de code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `priceListType` | Sí | `string` | formato `uuid` | Concept id del tipo | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concept id del estado | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Farmacia no encontrada | Excepción explícita en src/modules/pharmacy/services/pharmacy-pricing.service.ts |
| 409 | `CONFLICT` | Ya existe una lista con ese código en la farmacia | Excepción explícita en src/modules/pharmacy/services/pharmacy-pricing.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La farmacia no está activa | Excepción explícita en src/modules/pharmacy/services/pharmacy-pricing.service.ts |
| 422 | `PRECONDITION_FAILED` | Una lista por aseguradora requiere insurerTenantId | Excepción explícita en src/modules/pharmacy/services/pharmacy-pricing.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pharmacies/{pharmacyId}/price-lists"
}
```

---

## 6. POST /pharmacies/{pharmacyId}/price-lists/{priceListId}/close

- **Módulo:** `pharmacy`
- **Etiqueta OpenAPI:** `pharmacy`
- **Nombre:** Cerrar/expirar lista de precios
- **Operation ID:** `PharmacyController_closePriceList`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyController.closePriceList](../../src/modules/pharmacy/controllers/pharmacy.controller.ts)

### Descripción de negocio

Cerrar/expirar lista de precios. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /pharmacies/{pharmacyId}/price-lists/{priceListId}/close` en `PharmacyController_closePriceList`. El controlador delega en `PharmacyPricingService.closePriceList`. No recibe body. El tipo de retorno estático es `Promise<StatusResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `priceListId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /pharmacies/00000000-0000-4000-8000-000000000001/price-lists/00000000-0000-4000-8000-000000000001/close HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `pharmacyId`, `priceListId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /pharmacies/00000000-0000-4000-8000-000000000001/price-lists/00000000-0000-4000-8000-000000000001/close HTTP/1.1
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
| 404 | `NOT_FOUND` | Lista de precios no encontrada | Excepción explícita en src/modules/pharmacy/services/pharmacy-pricing.service.ts |
| 422 | `PRECONDITION_FAILED` | La lista de precios no está activa | Excepción explícita en src/modules/pharmacy/services/pharmacy-pricing.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pharmacies/{pharmacyId}/price-lists/{priceListId}/close"
}
```

---

## 7. POST /pharmacies/{pharmacyId}/price-lists/{priceListId}/prices

- **Módulo:** `pharmacy`
- **Etiqueta OpenAPI:** `pharmacy`
- **Nombre:** Fijar/versionar precio de producto
- **Operation ID:** `PharmacyController_versionPrice`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyController.versionPrice](../../src/modules/pharmacy/controllers/pharmacy.controller.ts)

### Descripción de negocio

Fijar/versionar precio de producto. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /pharmacies/{pharmacyId}/price-lists/{priceListId}/prices` en `PharmacyController_versionPrice`. El controlador delega en `PharmacyPricingService.versionPrice`. Valida el body como `CreatePriceDto` y consume `application/json`. El tipo de retorno estático es `Promise<PriceResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `priceListId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreatePriceDto`; los campos opcionales se omiten.

```http
POST /pharmacies/00000000-0000-4000-8000-000000000001/price-lists/00000000-0000-4000-8000-000000000001/prices HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "pharmacyProductId": "00000000-0000-4000-8000-000000000001",
  "unitAmount": 12.5
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `pharmacyId`, `priceListId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `pharmacyProductId` | Sí | `string` | formato `uuid` | Producto al que se fija el precio | `00000000-0000-4000-8000-000000000001` |
| `unitAmount` | Sí | `number` | mínimo 0 | Importe unitario | `12.5` |
| `taxAmount` | No | `number` | mínimo 0 | Impuesto | `1.5` |
| `patientAmount` | No | `number` | mínimo 0 | Importe a cargo del paciente | `5` |
| `insurerAmount` | No | `number` | mínimo 0 | Importe a cargo de la aseguradora | `7.5` |
| `minimumQuantity` | No | `number` | mínimo 0 | Cantidad mínima | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /pharmacies/00000000-0000-4000-8000-000000000001/price-lists/00000000-0000-4000-8000-000000000001/prices HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "pharmacyProductId": "00000000-0000-4000-8000-000000000001",
  "unitAmount": 12.5,
  "taxAmount": 1.5,
  "patientAmount": 5,
  "insurerAmount": 7.5,
  "minimumQuantity": 1
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<PriceResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<PriceResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PriceResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PriceResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<PriceResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PriceResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<PriceResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PriceResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PriceResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PriceResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PriceResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "pharmacyPriceListId": "00000000-0000-4000-8000-000000000001",
  "pharmacyProductId": "00000000-0000-4000-8000-000000000001",
  "versionNumber": 1,
  "unitAmount": "valor-ejemplo",
  "status": "00000000-0000-4000-8000-000000000001",
  "effectiveFrom": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `pharmacyPriceListId` | Sí | `string` | formato `uuid` | Identificador asociado a pharmacy price list. | `00000000-0000-4000-8000-000000000001` |
| `pharmacyProductId` | Sí | `string` | formato `uuid` | Identificador asociado a pharmacy product. | `00000000-0000-4000-8000-000000000001` |
| `versionNumber` | Sí | `number` | Sin restricción adicional declarada | Nº de versión de este precio | `1` |
| `unitAmount` | Sí | `string` | Sin restricción adicional declarada | Importe unitario | `valor-ejemplo` |
| `status` | Sí | `string` | formato `uuid` | Concept id del estado | `00000000-0000-4000-8000-000000000001` |
| `effectiveFrom` | Sí | `string` | formato `date-time` | Valor de effective from mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Lista de precios no encontrada | Excepción explícita en src/modules/pharmacy/services/pharmacy-pricing.service.ts |
| 404 | `NOT_FOUND` | Producto no encontrado | Excepción explícita en src/modules/pharmacy/services/pharmacy-pricing.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La lista de precios no está activa | Excepción explícita en src/modules/pharmacy/services/pharmacy-pricing.service.ts |
| 422 | `PRECONDITION_FAILED` | El producto no está activo | Excepción explícita en src/modules/pharmacy/services/pharmacy-pricing.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pharmacies/{pharmacyId}/price-lists/{priceListId}/prices"
}
```

---

## 8. POST /pharmacies/{pharmacyId}/products

- **Módulo:** `pharmacy`
- **Etiqueta OpenAPI:** `pharmacy`
- **Nombre:** Publicar producto en catálogo con identificadores
- **Operation ID:** `PharmacyController_publishProduct`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyController.publishProduct](../../src/modules/pharmacy/controllers/pharmacy.controller.ts)

### Descripción de negocio

Publicar producto en catálogo con identificadores. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /pharmacies/{pharmacyId}/products` en `PharmacyController_publishProduct`. El controlador delega en `PharmacyProductsService.publishProduct`. Valida el body como `PharmacyCreateProductDto` y consume `application/json`. El tipo de retorno estático es `Promise<ProductResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `PharmacyCreateProductDto`; los campos opcionales se omiten.

```http
POST /pharmacies/00000000-0000-4000-8000-000000000001/products HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "productCode": "CODIGO_EJEMPLO"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `pharmacyId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `productCode` | Sí | `string` | longitud máxima 100 | Código único de producto por farmacia | `CODIGO_EJEMPLO` |
| `medicationConceptId` | No | `string` | formato `uuid` | Concept id del medicamento | `00000000-0000-4000-8000-000000000001` |
| `manufacturerTenantId` | No | `string` | formato `uuid` | Tenant fabricante | `00000000-0000-4000-8000-000000000001` |
| `brandName` | No | `string` | longitud máxima 300 | Marca comercial | `Nombre de ejemplo` |
| `genericName` | No | `string` | longitud máxima 300 | Nombre genérico | `Nombre de ejemplo` |
| `strengthText` | No | `string` | longitud máxima 200 | Concentración (texto libre) | `valor-ejemplo` |
| `dosageFormConceptId` | No | `string` | formato `uuid` | Concept id de la forma farmacéutica | `00000000-0000-4000-8000-000000000001` |
| `packageSizeText` | No | `string` | longitud máxima 200 | Tamaño de empaque (texto libre) | `valor-ejemplo` |
| `requiresPrescription` | No | `boolean` | Sin restricción adicional declarada | Requiere receta | `true` |
| `coldChainRequired` | No | `boolean` | Sin restricción adicional declarada | Requiere cadena de frío | `true` |
| `identifiers` | No | `array<ProductIdentifierDto>` | Sin restricción adicional declarada | Identificadores (GTIN/NDC) | `[{"identifierType":"GTIN","identifierValue":"valor-ejemplo","assigningAuthorityTenantId":"00000000-0000-4000-8000-000000000001","validFrom":"2026-07-31","validTo":"2026-07-31"}]` |
| `identifiers[].identifierType` | No | `string` | valores: `GTIN`, `NDC` | Tipo de identificador | `GTIN` |
| `identifiers[].identifierValue` | No | `string` | longitud mínima 1; longitud máxima 100 | Valor del identificador | `valor-ejemplo` |
| `identifiers[].assigningAuthorityTenantId` | No | `string` | formato `uuid` | Tenant de la autoridad que asigna el identificador | `00000000-0000-4000-8000-000000000001` |
| `identifiers[].validFrom` | No | `string` | formato `date` | Inicio de vigencia | `2026-07-31` |
| `identifiers[].validTo` | No | `string` | formato `date` | Fin de vigencia | `2026-07-31` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /pharmacies/00000000-0000-4000-8000-000000000001/products HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "productCode": "CODIGO_EJEMPLO",
  "medicationConceptId": "00000000-0000-4000-8000-000000000001",
  "manufacturerTenantId": "00000000-0000-4000-8000-000000000001",
  "brandName": "Nombre de ejemplo",
  "genericName": "Nombre de ejemplo",
  "strengthText": "valor-ejemplo",
  "dosageFormConceptId": "00000000-0000-4000-8000-000000000001",
  "packageSizeText": "valor-ejemplo",
  "requiresPrescription": true,
  "coldChainRequired": true,
  "identifiers": [
    {
      "identifierType": "GTIN",
      "identifierValue": "valor-ejemplo",
      "assigningAuthorityTenantId": "00000000-0000-4000-8000-000000000001",
      "validFrom": "2026-07-31",
      "validTo": "2026-07-31"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ProductResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ProductResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ProductResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ProductResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ProductResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ProductResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ProductResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ProductResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ProductResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ProductResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ProductResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "pharmacyId": "00000000-0000-4000-8000-000000000001",
  "productCode": "CODIGO_EJEMPLO",
  "status": "00000000-0000-4000-8000-000000000001",
  "identifierCount": 1,
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `pharmacyId` | Sí | `string` | formato `uuid` | Identificador asociado a pharmacy. | `00000000-0000-4000-8000-000000000001` |
| `productCode` | Sí | `string` | Sin restricción adicional declarada | Valor de product code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `status` | Sí | `string` | formato `uuid` | Concept id del estado | `00000000-0000-4000-8000-000000000001` |
| `identifierCount` | Sí | `number` | Sin restricción adicional declarada | Nº de identificadores registrados | `1` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Farmacia no encontrada | Excepción explícita en src/modules/pharmacy/services/pharmacy-products.service.ts |
| 409 | `CONFLICT` | Ya existe un producto con ese código en la farmacia | Excepción explícita en src/modules/pharmacy/services/pharmacy-products.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La farmacia no está activa | Excepción explícita en src/modules/pharmacy/services/pharmacy-products.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pharmacies/{pharmacyId}/products"
}
```

---

## 9. DELETE /pharmacies/{pharmacyId}/products/{productId}

- **Módulo:** `pharmacy`
- **Etiqueta OpenAPI:** `pharmacy`
- **Nombre:** Retirar (soft-delete) producto del catálogo
- **Operation ID:** `PharmacyController_retireProduct`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyController.retireProduct](../../src/modules/pharmacy/controllers/pharmacy.controller.ts)

### Descripción de negocio

Retirar (soft-delete) producto del catálogo. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `DELETE /pharmacies/{pharmacyId}/products/{productId}` en `PharmacyController_retireProduct`. El controlador delega en `PharmacyProductsService.retireProduct`. No recibe body. El tipo de retorno estático es `Promise<StatusResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `productId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
DELETE /pharmacies/00000000-0000-4000-8000-000000000001/products/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `pharmacyId`, `productId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
DELETE /pharmacies/00000000-0000-4000-8000-000000000001/products/00000000-0000-4000-8000-000000000001 HTTP/1.1
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
| 404 | `NOT_FOUND` | Producto no encontrado | Excepción explícita en src/modules/pharmacy/services/pharmacy-products.service.ts |
| 422 | `PRECONDITION_FAILED` | El producto no está activo | Excepción explícita en src/modules/pharmacy/services/pharmacy-products.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pharmacies/{pharmacyId}/products/{productId}"
}
```

---

## 10. POST /pharmacies/{pharmacyId}/projections

- **Módulo:** `pharmacy`
- **Etiqueta OpenAPI:** `pharmacy`
- **Nombre:** Proyectar catálogo y precios a read-model
- **Operation ID:** `PharmacyController_projectCatalog`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyController.projectCatalog](../../src/modules/pharmacy/controllers/pharmacy.controller.ts)

### Descripción de negocio

Proyectar catálogo y precios a read-model. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /pharmacies/{pharmacyId}/projections` en `PharmacyController_projectCatalog`. El controlador delega en `PharmacyCatalogService.projectCatalog`. No recibe body. El tipo de retorno estático es `Promise<CatalogProjectionDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /pharmacies/00000000-0000-4000-8000-000000000001/projections HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `pharmacyId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /pharmacies/00000000-0000-4000-8000-000000000001/projections HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<CatalogProjectionDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CatalogProjectionDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CatalogProjectionDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CatalogProjectionDto>` | No |
| 404 | Operación completada correctamente. | `Promise<CatalogProjectionDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CatalogProjectionDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CatalogProjectionDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CatalogProjectionDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CatalogProjectionDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CatalogProjectionDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "pharmacyId": "00000000-0000-4000-8000-000000000001",
  "productCount": 1,
  "entries": [
    {
      "productId": "00000000-0000-4000-8000-000000000001",
      "productCode": "CODIGO_EJEMPLO",
      "brandName": "Nombre de ejemplo",
      "prices": [
        {
          "priceListId": "00000000-0000-4000-8000-000000000001",
          "unitAmount": "valor-ejemplo",
          "versionNumber": 1
        }
      ]
    }
  ],
  "projectedAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `pharmacyId` | Sí | `string` | formato `uuid` | Identificador asociado a pharmacy. | `00000000-0000-4000-8000-000000000001` |
| `productCount` | Sí | `number` | Sin restricción adicional declarada | Nº de productos activos proyectados | `1` |
| `entries` | Sí | `array<CatalogEntryDto>` | Sin restricción adicional declarada | Valor de entries mantenido por la instancia. | `[{"productId":"00000000-0000-4000-8000-000000000001","productCode":"CODIGO_EJEMPLO","brandName":"Nombre de ejemplo","prices":[{"priceListId":"00000000-0000-4000-8000-000000000001","unitAmount":"valor-ejemplo","versionNumber":1}]}]` |
| `entries[].productId` | Sí | `string` | formato `uuid` | Identificador asociado a product. | `00000000-0000-4000-8000-000000000001` |
| `entries[].productCode` | Sí | `string` | Sin restricción adicional declarada | Valor de product code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `entries[].brandName` | No | `string` | Sin restricción adicional declarada | Valor de brand name mantenido por la instancia. | `Nombre de ejemplo` |
| `entries[].prices` | Sí | `array<CatalogPriceDto>` | Sin restricción adicional declarada | Valor de prices mantenido por la instancia. | `[{"priceListId":"00000000-0000-4000-8000-000000000001","unitAmount":"valor-ejemplo","versionNumber":1}]` |
| `entries[].prices[].priceListId` | Sí | `string` | formato `uuid` | Identificador asociado a price list. | `00000000-0000-4000-8000-000000000001` |
| `entries[].prices[].unitAmount` | Sí | `string` | Sin restricción adicional declarada | Valor de unit amount mantenido por la instancia. | `valor-ejemplo` |
| `entries[].prices[].versionNumber` | Sí | `number` | Sin restricción adicional declarada | Valor de version number mantenido por la instancia. | `1` |
| `projectedAt` | Sí | `string` | formato `date-time` | Valor de projected at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Farmacia no encontrada | Excepción explícita en src/modules/pharmacy/services/pharmacy-catalog.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pharmacies/{pharmacyId}/projections"
}
```

---

## 11. POST /pharmacies/{pharmacyId}/sites

- **Módulo:** `pharmacy`
- **Etiqueta OpenAPI:** `pharmacy`
- **Nombre:** Registrar sede dispensadora
- **Operation ID:** `PharmacyController_createSite`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyController.createSite](../../src/modules/pharmacy/controllers/pharmacy.controller.ts)

### Descripción de negocio

Registrar sede dispensadora. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /pharmacies/{pharmacyId}/sites` en `PharmacyController_createSite`. El controlador delega en `PharmacySitesService.createSite`. Valida el body como `PharmacyCreateSiteDto` y consume `application/json`. El tipo de retorno estático es `Promise<SiteResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `PharmacyCreateSiteDto`; los campos opcionales se omiten.

```http
POST /pharmacies/00000000-0000-4000-8000-000000000001/sites HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practiceSiteId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `pharmacyId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `practiceSiteId` | Sí | `string` | formato `uuid` | Sede física (practice.practice_sites) | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | longitud máxima 100 | Código único de sede por farmacia | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | longitud máxima 300 | Nombre de la sede | `Nombre de ejemplo` |
| `pharmacySiteTypeConceptId` | No | `string` | formato `uuid` | Concept id del tipo de sede | `00000000-0000-4000-8000-000000000001` |
| `dispensingModeConceptId` | No | `string` | formato `uuid` | Concept id del modo de dispensación | `00000000-0000-4000-8000-000000000001` |
| `controlledSubstanceCapabilityConceptId` | No | `string` | formato `uuid` | Concept id de capacidad de sustancias controladas | `00000000-0000-4000-8000-000000000001` |
| `homeDeliveryAvailable` | No | `boolean` | Sin restricción adicional declarada | Ofrece entrega a domicilio | `true` |
| `pickupAvailable` | No | `boolean` | Sin restricción adicional declarada | Ofrece retiro en tienda | `true` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /pharmacies/00000000-0000-4000-8000-000000000001/sites HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practiceSiteId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "pharmacySiteTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "dispensingModeConceptId": "00000000-0000-4000-8000-000000000001",
  "controlledSubstanceCapabilityConceptId": "00000000-0000-4000-8000-000000000001",
  "homeDeliveryAvailable": true,
  "pickupAvailable": true
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<SiteResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<SiteResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<SiteResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<SiteResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<SiteResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<SiteResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<SiteResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<SiteResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<SiteResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<SiteResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `SiteResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "status": "ok",
  "operationalStatus": "valor-ejemplo",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | Sin restricción adicional declarada | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `practiceId` | Sí | `string` | Sin restricción adicional declarada | Identificador asociado a practice. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Valor de code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `status` | Sí | `string` | Sin restricción adicional declarada | Valor de status mantenido por la instancia. | `ok` |
| `operationalStatus` | Sí | `string` | Sin restricción adicional declarada | Valor de operational status mantenido por la instancia. | `valor-ejemplo` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Farmacia no encontrada | Excepción explícita en src/modules/pharmacy/services/pharmacy-sites.service.ts |
| 409 | `CONFLICT` | Ya existe una sede con ese código en la farmacia | Excepción explícita en src/modules/pharmacy/services/pharmacy-sites.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La farmacia no está activa | Excepción explícita en src/modules/pharmacy/services/pharmacy-sites.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pharmacies/{pharmacyId}/sites"
}
```

---

