<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `pharmacy`

Referencia exhaustiva de 17 operación(es) del módulo `pharmacy`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `pharmacy`, `pharmacy-directory`, `pharmacy-public`
- **Controladores:** `PharmacyController`, `PharmacyPublicController`, `PharmacyReadController`
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
12. [GET /pharmacy/pharmacies](#12-get-pharmacy-pharmacies) — Listar farmacias publicadas del tenant activo
13. [GET /pharmacy/pharmacies/{id}](#13-get-pharmacy-pharmacies-id) — Consultar el perfil de una farmacia
14. [GET /pharmacy/products](#14-get-pharmacy-products) — Buscar productos publicados por texto o por medicamento
15. [GET /pharmacy/sites/{siteId}/prices](#15-get-pharmacy-sites-siteid-prices) — Consultar los precios públicos vigentes de una sede
16. [GET /public/medications](#16-get-public-medications) — Vitrina pública de medicamentos con disponibilidad por farmacia
17. [GET /public/medications/{conceptId}/availability](#17-get-public-medications-conceptid-availability) — Farmacias que publican un medicamento, con precio y distancia

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

## 12. GET /pharmacy/pharmacies

- **Módulo:** `pharmacy`
- **Etiqueta OpenAPI:** `pharmacy-directory`
- **Nombre:** Listar farmacias publicadas del tenant activo
- **Operation ID:** `PharmacyReadController_listPharmacies`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyReadController.listPharmacies](../../src/modules/pharmacy/controllers/pharmacy-read.controller.ts)

### Descripción de negocio

Listar farmacias publicadas del tenant activo. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: E2: el directorio de farmacias publicadas.

### Descripción del sistema

NestJS resuelve `GET /pharmacy/pharmacies` en `PharmacyReadController_listPharmacies`. El controlador delega en `PharmacyReadService.listPharmacies`. No recibe body. El tipo de retorno estático es `Promise<PharmacyDirectoryResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /pharmacy/pharmacies HTTP/1.1
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
GET /pharmacy/pharmacies HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PharmacyDirectoryResponseDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<PharmacyDirectoryResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<PharmacyDirectoryResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<PharmacyDirectoryResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<PharmacyDirectoryResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<PharmacyDirectoryResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PharmacyDirectoryResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "code": "CODIGO_EJEMPLO",
      "name": "Nombre de ejemplo",
      "legalName": "Nombre de ejemplo",
      "type": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "siteCount": 1,
      "productCount": 1,
      "homeDeliveryAvailable": {},
      "pickupAvailable": {}
    }
  ],
  "count": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<PharmacyDirectoryItemDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","legalName":"Nombre de ejemplo","type":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"siteCount":1,"productCount":1,"homeDeliveryAvailable":{},"pickupAvailable":{}}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].legalName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].type` | No | `PharmacyConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `items[].type.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].type.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].siteCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `items[].productCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `items[].homeDeliveryAvailable` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `items[].pickupAvailable` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |

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
  "path": "/pharmacy/pharmacies"
}
```

---

## 13. GET /pharmacy/pharmacies/{id}

- **Módulo:** `pharmacy`
- **Etiqueta OpenAPI:** `pharmacy-directory`
- **Nombre:** Consultar el perfil de una farmacia
- **Operation ID:** `PharmacyReadController_getPharmacy`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyReadController.getPharmacy](../../src/modules/pharmacy/controllers/pharmacy-read.controller.ts)

### Descripción de negocio

Consultar el perfil de una farmacia. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: E2: el perfil de una farmacia, con sus sedes y direcciones.

### Descripción del sistema

NestJS resuelve `GET /pharmacy/pharmacies/{id}` en `PharmacyReadController_getPharmacy`. El controlador delega en `PharmacyReadService.getPharmacy`. No recibe body. El tipo de retorno estático es `Promise<PharmacyDetailDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /pharmacy/pharmacies/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /pharmacy/pharmacies/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PharmacyDetailDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<PharmacyDetailDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<PharmacyDetailDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<PharmacyDetailDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<PharmacyDetailDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<PharmacyDetailDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<PharmacyDetailDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PharmacyDetailDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "legalName": "Nombre de ejemplo",
  "type": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "siteCount": 1,
  "productCount": 1,
  "homeDeliveryAvailable": {},
  "pickupAvailable": {},
  "sites": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "code": "CODIGO_EJEMPLO",
      "name": "Nombre de ejemplo",
      "addressText": {},
      "latitude": {},
      "longitude": {},
      "dispensingMode": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "homeDeliveryAvailable": {},
      "pickupAvailable": {}
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `legalName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `type` | No | `PharmacyConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `type.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `type.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `siteCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `productCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `homeDeliveryAvailable` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `pickupAvailable` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `sites` | Sí | `array<PharmacySiteReadDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","addressText":{},"latitude":{},"longitude":{},"dispensingMode":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"homeDeliveryAvailable":{},"pickupAvailable":{}}]` |
| `sites[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `sites[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `sites[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `sites[].addressText` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `sites[].latitude` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `sites[].longitude` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `sites[].dispensingMode` | No | `PharmacyConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `sites[].dispensingMode.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `sites[].dispensingMode.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `sites[].homeDeliveryAvailable` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `sites[].pickupAvailable` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Farmacia no encontrada | Excepción explícita en src/modules/pharmacy/services/pharmacy-read.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pharmacy/pharmacies/{id}"
}
```

---

## 14. GET /pharmacy/products

- **Módulo:** `pharmacy`
- **Etiqueta OpenAPI:** `pharmacy-directory`
- **Nombre:** Buscar productos publicados por texto o por medicamento
- **Operation ID:** `PharmacyReadController_searchProducts`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyReadController.searchProducts](../../src/modules/pharmacy/controllers/pharmacy-read.controller.ts)

### Descripción de negocio

Buscar productos publicados por texto o por medicamento. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: E2: búsqueda de productos por texto o por medicamento del vademécum.

### Descripción del sistema

NestJS resuelve `GET /pharmacy/products` en `PharmacyReadController_searchProducts`. El controlador delega en `PharmacyReadService.searchProducts`. No recibe body. El tipo de retorno estático es `Promise<PharmacyProductSearchResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `search` | query | No | `string` | Sin restricción adicional declarada | Texto a buscar en marca, genérico o código de producto | `valor-ejemplo` |
| `conceptId` | query | No | `string` | formato `uuid` | Medicamento del vademécum (medication_concept_id) | `00000000-0000-4000-8000-000000000001` |
| `limit` | query | No | `number` | Sin restricción adicional declarada | Tope del listado (por defecto 50) | `1` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /pharmacy/products HTTP/1.1
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
GET /pharmacy/products?search=valor-ejemplo&conceptId=00000000-0000-4000-8000-000000000001&limit=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PharmacyProductSearchResponseDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<PharmacyProductSearchResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<PharmacyProductSearchResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<PharmacyProductSearchResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<PharmacyProductSearchResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<PharmacyProductSearchResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PharmacyProductSearchResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "pharmacyId": "00000000-0000-4000-8000-000000000001",
      "pharmacyName": "Nombre de ejemplo",
      "productCode": "CODIGO_EJEMPLO",
      "brandName": {},
      "genericName": {},
      "strengthText": {},
      "packageSizeText": {},
      "dosageForm": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "medication": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "requiresPrescription": {}
    }
  ],
  "limit": 1,
  "truncated": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<PharmacyProductReadDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","pharmacyId":"00000000-0000-4000-8000-000000000001","pharmacyName":"Nombre de ejemplo","productCode":"CODIGO_EJEMPLO","brandName":{},"genericName":{},"strengthText":{},"packageSizeText":{},"dosageForm":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"medication":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"requiresPrescription":{}}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].pharmacyId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].pharmacyName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].productCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].brandName` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `items[].genericName` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `items[].strengthText` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `items[].packageSizeText` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `items[].dosageForm` | No | `PharmacyConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `items[].dosageForm.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].dosageForm.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].medication` | No | `PharmacyConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `items[].medication.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].medication.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].requiresPrescription` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `limit` | Sí | `number` | Sin restricción adicional declarada | Tope aplicado al listado | `1` |
| `truncated` | Sí | `boolean` | Sin restricción adicional declarada | true si quedaron productos fuera del tope. Se declara, no se calla | `true` |

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
  "path": "/pharmacy/products"
}
```

---

## 15. GET /pharmacy/sites/{siteId}/prices

- **Módulo:** `pharmacy`
- **Etiqueta OpenAPI:** `pharmacy-directory`
- **Nombre:** Consultar los precios públicos vigentes de una sede
- **Operation ID:** `PharmacyReadController_getSitePrices`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyReadController.getSitePrices](../../src/modules/pharmacy/controllers/pharmacy-read.controller.ts)

### Descripción de negocio

Consultar los precios públicos vigentes de una sede. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: E2: precios públicos vigentes de una sede.

### Descripción del sistema

NestJS resuelve `GET /pharmacy/sites/{siteId}/prices` en `PharmacyReadController_getSitePrices`. El controlador delega en `PharmacyReadService.getSitePrices`. No recibe body. El tipo de retorno estático es `Promise<PharmacySitePricesResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `siteId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `product` | query | No | `string` | formato `uuid` | Producto puntual, si se acota | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /pharmacy/sites/00000000-0000-4000-8000-000000000001/prices HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `siteId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /pharmacy/sites/00000000-0000-4000-8000-000000000001/prices?product=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PharmacySitePricesResponseDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<PharmacySitePricesResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<PharmacySitePricesResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<PharmacySitePricesResponseDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<PharmacySitePricesResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<PharmacySitePricesResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<PharmacySitePricesResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PharmacySitePricesResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "siteId": "00000000-0000-4000-8000-000000000001",
  "siteName": "Nombre de ejemplo",
  "pharmacyId": "00000000-0000-4000-8000-000000000001",
  "pharmacyName": "Nombre de ejemplo",
  "items": [
    {
      "productId": "00000000-0000-4000-8000-000000000001",
      "productCode": "CODIGO_EJEMPLO",
      "brandName": {},
      "genericName": {},
      "strengthText": {},
      "packageSizeText": {},
      "medication": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "priceListId": "00000000-0000-4000-8000-000000000001",
      "priceListCode": "CODIGO_EJEMPLO",
      "currency": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "unitAmount": "valor-ejemplo",
      "taxAmount": {},
      "patientAmount": {},
      "minimumQuantity": {},
      "effectiveFrom": "2026-07-31T12:00:00.000Z",
      "effectiveTo": "2026-07-31T12:00:00.000Z"
    }
  ],
  "count": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `siteId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `siteName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `pharmacyId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `pharmacyName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items` | Sí | `array<PharmacySitePriceDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"productId":"00000000-0000-4000-8000-000000000001","productCode":"CODIGO_EJEMPLO","brandName":{},"genericName":{},"strengthText":{},"packageSizeText":{},"medication":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"priceListId":"00000000-0000-4000-8000-000000000001","priceListCode":"CODIGO_EJEMPLO","currency":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"unitAmount":"valor-ejemplo","taxAmount":{},"patientAmount":{},"minimumQuantity":{},"effectiveFrom":"2026-07-31T12:00:00.000Z","effectiveTo":"2026-07-31T12:00:00.000Z"}]` |
| `items[].productId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].productCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].brandName` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `items[].genericName` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `items[].strengthText` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `items[].packageSizeText` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `items[].medication` | No | `PharmacyConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `items[].medication.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].medication.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].priceListId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].priceListCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].currency` | No | `PharmacyConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `items[].currency.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].currency.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].unitAmount` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].taxAmount` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `items[].patientAmount` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `items[].minimumQuantity` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `items[].effectiveFrom` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `items[].effectiveTo` | No | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Sede de farmacia no encontrada | Excepción explícita en src/modules/pharmacy/services/pharmacy-read.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pharmacy/sites/{siteId}/prices"
}
```

---

## 16. GET /public/medications

- **Módulo:** `pharmacy`
- **Etiqueta OpenAPI:** `pharmacy-public`
- **Nombre:** Vitrina pública de medicamentos con disponibilidad por farmacia
- **Operation ID:** `PharmacyPublicController_listMedications`
- **Autenticación:** Pública
- **Implementación:** [PharmacyPublicController.listMedications](../../src/modules/pharmacy/controllers/pharmacy-public.controller.ts)

### Descripción de negocio

Vitrina pública de medicamentos con disponibilidad por farmacia. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: La vitrina: un medicamento por tarjeta.

### Descripción del sistema

NestJS resuelve `GET /public/medications` en `PharmacyPublicController_listMedications`. El controlador delega en `PharmacyMarketplaceService.listMedications`. No recibe body. El tipo de retorno estático es `Promise<PublicMedicationPageDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `q` | query | No | `string` | Sin restricción adicional declarada | Texto a buscar en principio activo, marca o código ATC | `valor-ejemplo` |
| `group` | query | No | `string` | Sin restricción adicional declarada | Grupo terapéutico ATC de primer nivel, tal como lo lista `groups` | `valor-ejemplo` |
| `lat` | query | No | `string` | Sin restricción adicional declarada | Latitud WGS84 desde donde medir distancias (va con lng) | `valor-ejemplo` |
| `lng` | query | No | `string` | Sin restricción adicional declarada | Longitud WGS84 desde donde medir distancias (va con lat) | `valor-ejemplo` |
| `radiusKm` | query | No | `string` | Sin restricción adicional declarada | Radio en km; sólo se aplica si viajó el origen | `valor-ejemplo` |
| `limit` | query | No | `string` | Sin restricción adicional declarada | Tope de tarjetas (máx. 60) | `valor-ejemplo` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /public/medications HTTP/1.1
Host: localhost:3000
```

### Restricciones a considerar

- Endpoint público: no exige JWT según el contrato y `@Public()` del código.
- Rate limit particular: `Throttle(PUBLIC_RATE_LIMIT)`.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /public/medications?q=valor-ejemplo&group=valor-ejemplo&lat=valor-ejemplo&lng=valor-ejemplo&radiusKm=valor-ejemplo&limit=valor-ejemplo HTTP/1.1
Host: localhost:3000
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PublicMedicationPageDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<PublicMedicationPageDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<PublicMedicationPageDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<PublicMedicationPageDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<PublicMedicationPageDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<PublicMedicationPageDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PublicMedicationPageDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "conceptId": "00000000-0000-4000-8000-000000000001",
      "atcCode": "CODIGO_EJEMPLO",
      "genericName": "Nombre de ejemplo",
      "therapeuticGroup": "valor-ejemplo",
      "brands": [
        "valor-ejemplo"
      ],
      "presentations": [
        "valor-ejemplo"
      ],
      "requiresPrescription": true,
      "priceFrom": "valor-ejemplo",
      "priceTo": "valor-ejemplo",
      "currency": "BOB",
      "pharmacyCount": 1,
      "nearestKm": {}
    }
  ],
  "total": 1,
  "groups": [
    "valor-ejemplo"
  ],
  "generatedAt": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<PublicMedicationCardDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"conceptId":"00000000-0000-4000-8000-000000000001","atcCode":"CODIGO_EJEMPLO","genericName":"Nombre de ejemplo","therapeuticGroup":"valor-ejemplo","brands":["valor-ejemplo"],"presentations":["valor-ejemplo"],"requiresPrescription":true,"priceFrom":"valor-ejemplo","priceTo":"valor-ejemplo","currency":"BOB","pharmacyCount":1,"nearestKm":{}}]` |
| `items[].conceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].atcCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].genericName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].therapeuticGroup` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].brands` | Sí | `array<string>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `["valor-ejemplo"]` |
| `items[].presentations` | Sí | `array<string>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `["valor-ejemplo"]` |
| `items[].requiresPrescription` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `items[].priceFrom` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].priceTo` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].currency` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `BOB` |
| `items[].pharmacyCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `items[].nearestKm` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `total` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `groups` | Sí | `array<string>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `["valor-ejemplo"]` |
| `generatedAt` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 429 | `RATE_LIMITED` | Se excede el límite particular Throttle(PUBLIC_RATE_LIMIT). | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/public/medications"
}
```

---

## 17. GET /public/medications/{conceptId}/availability

- **Módulo:** `pharmacy`
- **Etiqueta OpenAPI:** `pharmacy-public`
- **Nombre:** Farmacias que publican un medicamento, con precio y distancia
- **Operation ID:** `PharmacyPublicController_getAvailability`
- **Autenticación:** Pública
- **Implementación:** [PharmacyPublicController.getAvailability](../../src/modules/pharmacy/controllers/pharmacy-public.controller.ts)

### Descripción de negocio

Farmacias que publican un medicamento, con precio y distancia. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Qué farmacias tienen ese medicamento, con precio y distancia.

### Descripción del sistema

NestJS resuelve `GET /public/medications/{conceptId}/availability` en `PharmacyPublicController_getAvailability`. El controlador delega en `PharmacyMarketplaceService.getAvailability`. No recibe body. El tipo de retorno estático es `Promise<PublicMedicationAvailabilityDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `conceptId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `lat` | query | No | `string` | Sin restricción adicional declarada | Latitud WGS84 del origen | `valor-ejemplo` |
| `lng` | query | No | `string` | Sin restricción adicional declarada | Longitud WGS84 del origen | `valor-ejemplo` |
| `radiusKm` | query | No | `string` | Sin restricción adicional declarada | Radio en km | `valor-ejemplo` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /public/medications/00000000-0000-4000-8000-000000000001/availability HTTP/1.1
Host: localhost:3000
```

### Restricciones a considerar

- Endpoint público: no exige JWT según el contrato y `@Public()` del código.
- Deben ser UUID válidos: `conceptId`.
- Rate limit particular: `Throttle(PUBLIC_RATE_LIMIT)`.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /public/medications/00000000-0000-4000-8000-000000000001/availability?lat=valor-ejemplo&lng=valor-ejemplo&radiusKm=valor-ejemplo HTTP/1.1
Host: localhost:3000
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PublicMedicationAvailabilityDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<PublicMedicationAvailabilityDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<PublicMedicationAvailabilityDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<PublicMedicationAvailabilityDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<PublicMedicationAvailabilityDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<PublicMedicationAvailabilityDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<PublicMedicationAvailabilityDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PublicMedicationAvailabilityDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "medication": {
    "conceptId": "00000000-0000-4000-8000-000000000001",
    "atcCode": "CODIGO_EJEMPLO",
    "genericName": "Nombre de ejemplo",
    "therapeuticGroup": "valor-ejemplo",
    "brands": [
      "valor-ejemplo"
    ],
    "presentations": [
      "valor-ejemplo"
    ],
    "requiresPrescription": true,
    "priceFrom": "valor-ejemplo",
    "priceTo": "valor-ejemplo",
    "currency": "BOB",
    "pharmacyCount": 1,
    "nearestKm": {}
  },
  "offers": [
    {
      "pharmacySlug": "valor-ejemplo",
      "pharmacyName": "Nombre de ejemplo",
      "addressText": {},
      "city": {},
      "latitude": 1,
      "longitude": 1,
      "distanceKm": {},
      "brandName": {},
      "presentation": {},
      "price": "valor-ejemplo",
      "currency": "BOB",
      "inStock": true,
      "homeDelivery": true,
      "pickup": true,
      "requiresPrescription": true
    }
  ],
  "generatedAt": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `medication` | Sí | `PublicMedicationCardDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"conceptId":"00000000-0000-4000-8000-000000000001","atcCode":"CODIGO_EJEMPLO","genericName":"Nombre de ejemplo","therapeuticGroup":"valor-ejemplo","brands":["valor-ejemplo"],"presentations":["valor-ejemplo"],"requiresPrescription":true,"priceFrom":"valor-ejemplo","priceTo":"valor-ejemplo","currency":"BOB","pharmacyCount":1,"nearestKm":{}}` |
| `medication.conceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `medication.atcCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `medication.genericName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `medication.therapeuticGroup` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `medication.brands` | Sí | `array<string>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `["valor-ejemplo"]` |
| `medication.presentations` | Sí | `array<string>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `["valor-ejemplo"]` |
| `medication.requiresPrescription` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `medication.priceFrom` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `medication.priceTo` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `medication.currency` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `BOB` |
| `medication.pharmacyCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `medication.nearestKm` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `offers` | Sí | `array<PublicMedicationOfferDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"pharmacySlug":"valor-ejemplo","pharmacyName":"Nombre de ejemplo","addressText":{},"city":{},"latitude":1,"longitude":1,"distanceKm":{},"brandName":{},"presentation":{},"price":"valor-ejemplo","currency":"BOB","inStock":true,"homeDelivery":true,"pickup":true,"requiresPrescription":true}]` |
| `offers[].pharmacySlug` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `offers[].pharmacyName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `offers[].addressText` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `offers[].city` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `offers[].latitude` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `offers[].longitude` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `offers[].distanceKm` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `offers[].brandName` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `offers[].presentation` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `offers[].price` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `offers[].currency` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `BOB` |
| `offers[].inStock` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `offers[].homeDelivery` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `offers[].pickup` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `offers[].requiresPrescription` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `generatedAt` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 404 | `NOT_FOUND` | Medicamento no encontrado | Excepción explícita en src/modules/pharmacy/services/pharmacy-marketplace.service.ts |
| 429 | `RATE_LIMITED` | Se excede el límite particular Throttle(PUBLIC_RATE_LIMIT). | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/public/medications/{conceptId}/availability"
}
```

---

