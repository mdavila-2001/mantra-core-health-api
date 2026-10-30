<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `pharmacy`

Referencia exhaustiva de 37 operación(es) del módulo `pharmacy`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `pharmacy`, `pharmacy-directory`, `pharmacy-public`
- **Controladores:** `PharmacyBulkController`, `PharmacyController`, `PharmacyPublicController`, `PharmacyReadController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [POST /pharmacies](#1-post-pharmacies) — Alta de farmacia con licencia inicial
2. [GET /pharmacies/{pharmacyId}/categories](#2-get-pharmacies-pharmacyid-categories) — Categorías de la farmacia (sólo su personal)
3. [POST /pharmacies/{pharmacyId}/categories](#3-post-pharmacies-pharmacyid-categories) — Crear una categoría de la farmacia
4. [DELETE /pharmacies/{pharmacyId}/categories/{categoryId}](#4-delete-pharmacies-pharmacyid-categories-categoryid) — Eliminar una categoría de la farmacia
5. [PATCH /pharmacies/{pharmacyId}/categories/{categoryId}](#5-patch-pharmacies-pharmacyid-categories-categoryid) — Renombrar una categoría de la farmacia
6. [POST /pharmacies/{pharmacyId}/categories/bulk](#6-post-pharmacies-pharmacyid-categories-bulk) — Cargar categorías en lote, con vista previa
7. [POST /pharmacies/{pharmacyId}/integration-connections](#7-post-pharmacies-pharmacyid-integration-connections) — Establecer conexión de integración externa
8. [POST /pharmacies/{pharmacyId}/integration-connections/{connectionId}/product-mappings](#8-post-pharmacies-pharmacyid-integration-connections-connectionid-product-mappings) — Mapear producto a código de proveedor externo
9. [PATCH /pharmacies/{pharmacyId}/inventory](#9-patch-pharmacies-pharmacyid-inventory) — Guardar el inventario declarado de varios productos (todo o nada)
10. [POST /pharmacies/{pharmacyId}/licenses/{licenseId}/verify](#10-post-pharmacies-pharmacyid-licenses-licenseid-verify) — Verificar licencia y aprobar farmacia
11. [POST /pharmacies/{pharmacyId}/on-call-shifts/{shiftId}/cancel](#11-post-pharmacies-pharmacyid-on-call-shifts-shiftid-cancel) — Cancelar un turno de guardia (deja de publicarse)
12. [GET /pharmacies/{pharmacyId}/opening-hours](#12-get-pharmacies-pharmacyid-opening-hours) — Horario declarado de las sedes: 24 h y turnos vigentes y próximos
13. [POST /pharmacies/{pharmacyId}/price-lists](#13-post-pharmacies-pharmacyid-price-lists) — Crear lista de precios (pública / por aseguradora)
14. [POST /pharmacies/{pharmacyId}/price-lists/{priceListId}/close](#14-post-pharmacies-pharmacyid-price-lists-pricelistid-close) — Cerrar/expirar lista de precios
15. [POST /pharmacies/{pharmacyId}/price-lists/{priceListId}/prices](#15-post-pharmacies-pharmacyid-price-lists-pricelistid-prices) — Fijar/versionar precio de producto
16. [POST /pharmacies/{pharmacyId}/prices/bulk](#16-post-pharmacies-pharmacyid-prices-bulk) — Cargar precios de venta en lote, con vista previa
17. [POST /pharmacies/{pharmacyId}/products](#17-post-pharmacies-pharmacyid-products) — Publicar producto en catálogo con identificadores
18. [DELETE /pharmacies/{pharmacyId}/products/{productId}](#18-delete-pharmacies-pharmacyid-products-productid) — Retirar (soft-delete) producto del catálogo
19. [PATCH /pharmacies/{pharmacyId}/products/{productId}](#19-patch-pharmacies-pharmacyid-products-productid) — Editar un producto del catálogo de la farmacia
20. [POST /pharmacies/{pharmacyId}/products/bulk](#20-post-pharmacies-pharmacyid-products-bulk) — Cargar productos en lote, con vista previa
21. [POST /pharmacies/{pharmacyId}/projections](#21-post-pharmacies-pharmacyid-projections) — Proyectar catálogo y precios a read-model
22. [POST /pharmacies/{pharmacyId}/sites](#22-post-pharmacies-pharmacyid-sites) — Registrar sede dispensadora
23. [POST /pharmacies/{pharmacyId}/sites/{siteId}/on-call-shifts](#23-post-pharmacies-pharmacyid-sites-siteid-on-call-shifts) — Registrar un turno de guardia de la sede
24. [PUT /pharmacies/{pharmacyId}/sites/{siteId}/open-24h](#24-put-pharmacies-pharmacyid-sites-siteid-open-24h) — Declarar si la sede abre las 24 horas
25. [POST /pharmacies/{pharmacyId}/sites/bulk](#25-post-pharmacies-pharmacyid-sites-bulk) — Cargar sucursales (sedes de venta) en lote, con vista previa
26. [GET /pharmacy/catalog-products](#26-get-pharmacy-catalog-products) — Buscar en el catálogo universal de medicamentos
27. [GET /pharmacy/pharmacies](#27-get-pharmacy-pharmacies) — Listar farmacias publicadas del tenant activo
28. [GET /pharmacy/pharmacies/{id}](#28-get-pharmacy-pharmacies-id) — Consultar el perfil de una farmacia
29. [GET /pharmacy/pharmacies/{id}/contacts](#29-get-pharmacy-pharmacies-id-contacts) — Representante legal y gerencias de la farmacia (sólo su personal)
30. [GET /pharmacy/pharmacies/{id}/licenses](#30-get-pharmacy-pharmacies-id-licenses) — Licencias de la farmacia (sólo su personal)
31. [GET /pharmacy/pharmacies/{id}/summary](#31-get-pharmacy-pharmacies-id-summary) — Resumen del catálogo de la farmacia (sólo su personal)
32. [GET /pharmacy/products](#32-get-pharmacy-products) — Buscar productos publicados por texto, medicamento o farmacia
33. [GET /pharmacy/sites](#33-get-pharmacy-sites) — Listar sedes publicadas, sueltas
34. [GET /pharmacy/sites/{siteId}/prices](#34-get-pharmacy-sites-siteid-prices) — Consultar los precios públicos vigentes de una sede
35. [GET /public/medications](#35-get-public-medications) — Vitrina pública de medicamentos con disponibilidad por farmacia
36. [GET /public/medications/{conceptId}/availability](#36-get-public-medications-conceptid-availability) — Farmacias que publican un medicamento, con precio y distancia
37. [GET /public/pharmacies/open-now](#37-get-public-pharmacies-open-now) — Farmacias abiertas ahora: 24 h o de turno vigente

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
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PHARMACY_STAFF`.
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
| 504 | Operación completada correctamente. | `Promise<PharmacyResponseDto>` | No |

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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, PHARMACY_STAFF. | Roles/tenant/guards de autorización |
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

## 2. GET /pharmacies/{pharmacyId}/categories

- **Módulo:** `pharmacy`
- **Etiqueta OpenAPI:** `pharmacy`
- **Nombre:** Categorías de la farmacia (sólo su personal)
- **Operation ID:** `PharmacyController_listCategories`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyController.listCategories](../../src/modules/pharmacy/controllers/pharmacy.controller.ts)

### Descripción de negocio

Categorías de la farmacia (sólo su personal). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: P47 D8: categorías de la farmacia, con cuántos productos vivos usan cada una.

### Descripción del sistema

NestJS resuelve `GET /pharmacies/{pharmacyId}/categories` en `PharmacyController_listCategories`. El controlador delega en `PharmacyCategoriesService.list`. No recibe body. El tipo de retorno estático es `Promise<PharmacyCategoryListDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /pharmacies/00000000-0000-4000-8000-000000000001/categories HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PHARMACY_STAFF`.
- Deben ser UUID válidos: `pharmacyId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /pharmacies/00000000-0000-4000-8000-000000000001/categories HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PharmacyCategoryListDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<PharmacyCategoryListDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<PharmacyCategoryListDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<PharmacyCategoryListDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<PharmacyCategoryListDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<PharmacyCategoryListDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<PharmacyCategoryListDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<PharmacyCategoryListDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PharmacyCategoryListDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "name": "Nombre de ejemplo",
      "productCount": 1
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<PharmacyCategoryItemDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","name":"Nombre de ejemplo","productCount":1}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].productCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, PHARMACY_STAFF. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pharmacies/{pharmacyId}/categories"
}
```

---

## 3. POST /pharmacies/{pharmacyId}/categories

- **Módulo:** `pharmacy`
- **Etiqueta OpenAPI:** `pharmacy`
- **Nombre:** Crear una categoría de la farmacia
- **Operation ID:** `PharmacyController_createCategory`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyController.createCategory](../../src/modules/pharmacy/controllers/pharmacy.controller.ts)

### Descripción de negocio

El nombre es único en la farmacia sin distinguir mayúsculas ni tildes (409).

Contexto declarado en el controlador: P47 D8: crea una categoría. 409 si el nombre ya existe.

### Descripción del sistema

NestJS resuelve `POST /pharmacies/{pharmacyId}/categories` en `PharmacyController_createCategory`. El controlador delega en `PharmacyCategoriesService.create`. Valida el body como `PharmacyCategoryNameDto` y consume `application/json`. El tipo de retorno estático es `Promise<PharmacyCategoryItemDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `PharmacyCategoryNameDto`; los campos opcionales se omiten.

```http
POST /pharmacies/00000000-0000-4000-8000-000000000001/categories HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "name": "Nombre de ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PHARMACY_STAFF`.
- Deben ser UUID válidos: `pharmacyId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `name` | Sí | `string` | longitud mínima 1; longitud máxima 60 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /pharmacies/00000000-0000-4000-8000-000000000001/categories HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "name": "Nombre de ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PharmacyCategoryItemDto>` | Sí |
| 400 | Operación completada correctamente. | `Promise<PharmacyCategoryItemDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PharmacyCategoryItemDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PharmacyCategoryItemDto>` | No |
| 404 | Operación completada correctamente. | `Promise<PharmacyCategoryItemDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PharmacyCategoryItemDto>` | No |
| 413 | Operación completada correctamente. | `Promise<PharmacyCategoryItemDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PharmacyCategoryItemDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PharmacyCategoryItemDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PharmacyCategoryItemDto>` | No |
| 504 | Operación completada correctamente. | `Promise<PharmacyCategoryItemDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PharmacyCategoryItemDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "name": "Nombre de ejemplo",
  "productCount": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `productCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, PHARMACY_STAFF. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Ya existe una categoría con ese nombre | Excepción explícita en src/modules/pharmacy/services/pharmacy-categories.service.ts |
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
  "path": "/pharmacies/{pharmacyId}/categories"
}
```

---

## 4. DELETE /pharmacies/{pharmacyId}/categories/{categoryId}

- **Módulo:** `pharmacy`
- **Etiqueta OpenAPI:** `pharmacy`
- **Nombre:** Eliminar una categoría de la farmacia
- **Operation ID:** `PharmacyController_deleteCategory`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyController.deleteCategory](../../src/modules/pharmacy/controllers/pharmacy.controller.ts)

### Descripción de negocio

Eliminar una categoría de la farmacia. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: P47 D8: elimina una categoría sin productos vivos (con productos, 409).

### Descripción del sistema

NestJS resuelve `DELETE /pharmacies/{pharmacyId}/categories/{categoryId}` en `PharmacyController_deleteCategory`. El controlador delega en `PharmacyCategoriesService.remove`. No recibe body. El tipo de retorno estático es `Promise<StatusResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `categoryId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
DELETE /pharmacies/00000000-0000-4000-8000-000000000001/categories/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PHARMACY_STAFF`.
- Deben ser UUID válidos: `pharmacyId`, `categoryId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
DELETE /pharmacies/00000000-0000-4000-8000-000000000001/categories/00000000-0000-4000-8000-000000000001 HTTP/1.1
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
| 504 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |

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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, PHARMACY_STAFF. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Categoría no encontrada | Excepción explícita en src/modules/pharmacy/services/pharmacy-categories.service.ts |
| 409 | `CONFLICT` | La categoría tiene productos: páselos a otra antes de eliminarla | Excepción explícita en src/modules/pharmacy/services/pharmacy-categories.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pharmacies/{pharmacyId}/categories/{categoryId}"
}
```

---

## 5. PATCH /pharmacies/{pharmacyId}/categories/{categoryId}

- **Módulo:** `pharmacy`
- **Etiqueta OpenAPI:** `pharmacy`
- **Nombre:** Renombrar una categoría de la farmacia
- **Operation ID:** `PharmacyController_renameCategory`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyController.renameCategory](../../src/modules/pharmacy/controllers/pharmacy.controller.ts)

### Descripción de negocio

Renombrar una categoría de la farmacia. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: P47 D8: renombra una categoría; los productos la siguen.

### Descripción del sistema

NestJS resuelve `PATCH /pharmacies/{pharmacyId}/categories/{categoryId}` en `PharmacyController_renameCategory`. El controlador delega en `PharmacyCategoriesService.rename`. Valida el body como `PharmacyCategoryNameDto` y consume `application/json`. El tipo de retorno estático es `Promise<PharmacyCategoryItemDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `categoryId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `PharmacyCategoryNameDto`; los campos opcionales se omiten.

```http
PATCH /pharmacies/00000000-0000-4000-8000-000000000001/categories/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "name": "Nombre de ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PHARMACY_STAFF`.
- Deben ser UUID válidos: `pharmacyId`, `categoryId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `name` | Sí | `string` | longitud mínima 1; longitud máxima 60 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PATCH /pharmacies/00000000-0000-4000-8000-000000000001/categories/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "name": "Nombre de ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PharmacyCategoryItemDto>` | Sí |
| 400 | Operación completada correctamente. | `Promise<PharmacyCategoryItemDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PharmacyCategoryItemDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PharmacyCategoryItemDto>` | No |
| 404 | Operación completada correctamente. | `Promise<PharmacyCategoryItemDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PharmacyCategoryItemDto>` | No |
| 413 | Operación completada correctamente. | `Promise<PharmacyCategoryItemDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PharmacyCategoryItemDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PharmacyCategoryItemDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PharmacyCategoryItemDto>` | No |
| 504 | Operación completada correctamente. | `Promise<PharmacyCategoryItemDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PharmacyCategoryItemDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "name": "Nombre de ejemplo",
  "productCount": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `productCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, PHARMACY_STAFF. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Categoría no encontrada | Excepción explícita en src/modules/pharmacy/services/pharmacy-categories.service.ts |
| 409 | `CONFLICT` | Ya existe una categoría con ese nombre | Excepción explícita en src/modules/pharmacy/services/pharmacy-categories.service.ts |
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
  "path": "/pharmacies/{pharmacyId}/categories/{categoryId}"
}
```

---

## 6. POST /pharmacies/{pharmacyId}/categories/bulk

- **Módulo:** `pharmacy`
- **Etiqueta OpenAPI:** `pharmacy`
- **Nombre:** Cargar categorías en lote, con vista previa
- **Operation ID:** `PharmacyBulkController_bulkCategories`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyBulkController.bulkCategories](../../src/modules/pharmacy/controllers/pharmacy-bulk.controller.ts)

### Descripción de negocio

Cargar categorías en lote, con vista previa. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /pharmacies/{pharmacyId}/categories/bulk` en `PharmacyBulkController_bulkCategories`. El controlador delega en `PharmacyBulkService.run`. Valida el body como `BulkRequestDto` y consume `application/json`. El tipo de retorno estático es `Promise<BulkResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `BulkRequestDto`; los campos opcionales se omiten.

```http
POST /pharmacies/00000000-0000-4000-8000-000000000001/categories/bulk HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "mode": "CREATE",
  "rows": [
    {
      "clave": "valor"
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PHARMACY_STAFF`.
- Deben ser UUID válidos: `pharmacyId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `mode` | Sí | `string` | valores: `CREATE`, `UPDATE`, `UPSERT` | Sin descripción específica en el contrato OpenAPI. | `CREATE` |
| `dryRun` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `false` |
| `rows` | Sí | `array<object>` | mínimo 1 elemento(s); máximo 1000 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"clave":"valor"}]` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /pharmacies/00000000-0000-4000-8000-000000000001/categories/bulk HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "mode": "CREATE",
  "dryRun": false,
  "rows": [
    {
      "clave": "valor"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<BulkResponseDto>` | Sí |
| 400 | Operación completada correctamente. | `Promise<BulkResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<BulkResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<BulkResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<BulkResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<BulkResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<BulkResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<BulkResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<BulkResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<BulkResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<BulkResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `BulkResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "dryRun": true,
  "results": [
    {
      "row": 1,
      "outcome": "CREATED",
      "id": "00000000-0000-4000-8000-000000000001",
      "errors": [
        {
          "field": "valor-ejemplo",
          "reason": "Texto descriptivo de ejemplo",
          "message": "valor-ejemplo"
        }
      ]
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `dryRun` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `results` | Sí | `array<BulkRowResultDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"row":1,"outcome":"CREATED","id":"00000000-0000-4000-8000-000000000001","errors":[{"field":"valor-ejemplo","reason":"Texto descriptivo de ejemplo","message":"valor-ejemplo"}]}]` |
| `results[].row` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `results[].outcome` | Sí | `string` | valores: `CREATED`, `UPDATED`, `REJECTED`, `UNCHANGED` | Sin descripción específica en el contrato OpenAPI. | `CREATED` |
| `results[].id` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `results[].errors` | No | `array<BulkRowErrorDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"field":"valor-ejemplo","reason":"Texto descriptivo de ejemplo","message":"valor-ejemplo"}]` |
| `results[].errors[].field` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `results[].errors[].reason` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `results[].errors[].message` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, PHARMACY_STAFF. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La farmacia no está activa | Excepción explícita en src/modules/pharmacy/services/pharmacy-bulk.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pharmacies/{pharmacyId}/categories/bulk"
}
```

---

## 7. POST /pharmacies/{pharmacyId}/integration-connections

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
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PHARMACY_STAFF`.
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
| 504 | Operación completada correctamente. | `Promise<ConnectionResponseDto>` | No |

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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, PHARMACY_STAFF. | Roles/tenant/guards de autorización |
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

## 8. POST /pharmacies/{pharmacyId}/integration-connections/{connectionId}/product-mappings

- **Módulo:** `pharmacy`
- **Etiqueta OpenAPI:** `pharmacy`
- **Nombre:** Mapear producto a código de proveedor externo
- **Operation ID:** `PharmacyController_mapProduct`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyController.mapProduct](../../src/modules/pharmacy/controllers/pharmacy.controller.ts)

### Descripción de negocio

Mapear producto a código de proveedor externo. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /pharmacies/{pharmacyId}/integration-connections/{connectionId}/product-mappings` en `PharmacyController_mapProduct`. El controlador delega en `PharmacyIntegrationService.mapProduct`. Valida el body como `CreateMappingDto` y consume `application/json`. El tipo de retorno estático es `Promise<MappingResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `connectionId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

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
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PHARMACY_STAFF`.
- Deben ser UUID válidos: `pharmacyId`, `connectionId`.
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
| 504 | Operación completada correctamente. | `Promise<MappingResponseDto>` | No |

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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, PHARMACY_STAFF. | Roles/tenant/guards de autorización |
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
  "path": "/pharmacies/{pharmacyId}/integration-connections/{connectionId}/product-mappings"
}
```

---

## 9. PATCH /pharmacies/{pharmacyId}/inventory

- **Módulo:** `pharmacy`
- **Etiqueta OpenAPI:** `pharmacy`
- **Nombre:** Guardar el inventario declarado de varios productos (todo o nada)
- **Operation ID:** `PharmacyController_updateInventory`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyController.updateInventory](../../src/modules/pharmacy/controllers/pharmacy.controller.ts)

### Descripción de negocio

Cada línea lleva `stock`/`minStock` **o** `inStock`: las dos juntas, ninguna, un producto repetido, ajeno o retirado es 422 y no se guarda ninguna. Es la declaración del catálogo, no el ledger de existencias.

Contexto declarado en el controlador: P47 D7: existencias de varios productos de una vez, todo o nada.

### Descripción del sistema

NestJS resuelve `PATCH /pharmacies/{pharmacyId}/inventory` en `PharmacyController_updateInventory`. El controlador delega en `PharmacyProductsService.updateInventory`. Valida el body como `PharmacyUpdateInventoryDto` y consume `application/json`. El tipo de retorno estático es `Promise<InventoryUpdatedDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `PharmacyUpdateInventoryDto`; los campos opcionales se omiten.

```http
PATCH /pharmacies/00000000-0000-4000-8000-000000000001/inventory HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "lines": [
    {
      "productId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PHARMACY_STAFF`.
- Deben ser UUID válidos: `pharmacyId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `lines` | Sí | `array<PharmacyInventoryLineDto>` | mínimo 1 elemento(s); máximo 500 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"productId":"00000000-0000-4000-8000-000000000001","stock":1,"minStock":1,"inStock":true}]` |
| `lines[].productId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `lines[].stock` | No | `number` | mínimo 0; máximo 1000000 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `lines[].minStock` | No | `number` | mínimo 0; máximo 1000000 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `lines[].inStock` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PATCH /pharmacies/00000000-0000-4000-8000-000000000001/inventory HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "lines": [
    {
      "productId": "00000000-0000-4000-8000-000000000001",
      "stock": 1,
      "minStock": 1,
      "inStock": true
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<InventoryUpdatedDto>` | Sí |
| 400 | Operación completada correctamente. | `Promise<InventoryUpdatedDto>` | No |
| 401 | Operación completada correctamente. | `Promise<InventoryUpdatedDto>` | No |
| 403 | Operación completada correctamente. | `Promise<InventoryUpdatedDto>` | No |
| 404 | Operación completada correctamente. | `Promise<InventoryUpdatedDto>` | No |
| 409 | Operación completada correctamente. | `Promise<InventoryUpdatedDto>` | No |
| 413 | Operación completada correctamente. | `Promise<InventoryUpdatedDto>` | No |
| 422 | Operación completada correctamente. | `Promise<InventoryUpdatedDto>` | No |
| 429 | Operación completada correctamente. | `Promise<InventoryUpdatedDto>` | No |
| 500 | Operación completada correctamente. | `Promise<InventoryUpdatedDto>` | No |
| 504 | Operación completada correctamente. | `Promise<InventoryUpdatedDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `InventoryUpdatedDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "updated": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `updated` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, PHARMACY_STAFF. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El inventario tiene líneas inválidas | Excepción explícita en src/modules/pharmacy/services/pharmacy-products.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pharmacies/{pharmacyId}/inventory"
}
```

---

## 10. POST /pharmacies/{pharmacyId}/licenses/{licenseId}/verify

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
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PHARMACY_STAFF`.
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
| 504 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |

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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, PHARMACY_STAFF. | Roles/tenant/guards de autorización |
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

## 11. POST /pharmacies/{pharmacyId}/on-call-shifts/{shiftId}/cancel

- **Módulo:** `pharmacy`
- **Etiqueta OpenAPI:** `pharmacy`
- **Nombre:** Cancelar un turno de guardia (deja de publicarse)
- **Operation ID:** `PharmacyController_cancelOnCallShift`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyController.cancelOnCallShift](../../src/modules/pharmacy/controllers/pharmacy.controller.ts)

### Descripción de negocio

Cancelar un turno de guardia (deja de publicarse). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: P34: cancelar un turno que todavía no terminó.

### Descripción del sistema

NestJS resuelve `POST /pharmacies/{pharmacyId}/on-call-shifts/{shiftId}/cancel` en `PharmacyController_cancelOnCallShift`. El controlador delega en `PharmacyOpeningHoursService.cancelShift`. No recibe body. El tipo de retorno estático es `Promise<OnCallShiftDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `shiftId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /pharmacies/00000000-0000-4000-8000-000000000001/on-call-shifts/00000000-0000-4000-8000-000000000001/cancel HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PHARMACY_STAFF`.
- Deben ser UUID válidos: `pharmacyId`, `shiftId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /pharmacies/00000000-0000-4000-8000-000000000001/on-call-shifts/00000000-0000-4000-8000-000000000001/cancel HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<OnCallShiftDto>` | Sí |
| 400 | Operación completada correctamente. | `Promise<OnCallShiftDto>` | No |
| 401 | Operación completada correctamente. | `Promise<OnCallShiftDto>` | No |
| 403 | Operación completada correctamente. | `Promise<OnCallShiftDto>` | No |
| 404 | Operación completada correctamente. | `Promise<OnCallShiftDto>` | No |
| 409 | Operación completada correctamente. | `Promise<OnCallShiftDto>` | No |
| 422 | Operación completada correctamente. | `Promise<OnCallShiftDto>` | No |
| 429 | Operación completada correctamente. | `Promise<OnCallShiftDto>` | No |
| 500 | Operación completada correctamente. | `Promise<OnCallShiftDto>` | No |
| 504 | Operación completada correctamente. | `Promise<OnCallShiftDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `OnCallShiftDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "siteId": "00000000-0000-4000-8000-000000000001",
  "startsAt": "2026-07-31T12:00:00.000Z",
  "endsAt": "2026-07-31T12:00:00.000Z",
  "startsAtLocal": "2026-10-26T20:00:00-04:00",
  "endsAtLocal": "2026-10-27T08:00:00-04:00",
  "timeZone": "America/La_Paz",
  "source": "PHARMACY",
  "status": "ACTIVE",
  "current": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador del turno. | `00000000-0000-4000-8000-000000000001` |
| `siteId` | Sí | `string` | formato `uuid` | Sede del turno. | `00000000-0000-4000-8000-000000000001` |
| `startsAt` | Sí | `string` | formato `date-time` | Inicio (instante UTC). | `2026-07-31T12:00:00.000Z` |
| `endsAt` | Sí | `string` | formato `date-time` | Fin, exclusivo (instante UTC). | `2026-07-31T12:00:00.000Z` |
| `startsAtLocal` | Sí | `string` | Sin restricción adicional declarada | Inicio en la hora local de la sede. | `2026-10-26T20:00:00-04:00` |
| `endsAtLocal` | Sí | `string` | Sin restricción adicional declarada | Fin en la hora local de la sede. | `2026-10-27T08:00:00-04:00` |
| `timeZone` | Sí | `string` | Sin restricción adicional declarada | Huso con que se escribió la hora local. | `America/La_Paz` |
| `source` | Sí | `string` | valores: `PHARMACY`, `PLATFORM` | Quién lo declaró. | `PHARMACY` |
| `status` | Sí | `string` | valores: `ACTIVE`, `CANCELLED` | Estado. | `ACTIVE` |
| `current` | Sí | `boolean` | Sin restricción adicional declarada | Si está vigente en `asOf`. | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, PHARMACY_STAFF. | Roles/tenant/guards de autorización |
| 422 | `PRECONDITION_FAILED` | El turno ya terminó o ya estaba cancelado | Excepción explícita en src/modules/pharmacy/services/pharmacy-opening-hours.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pharmacies/{pharmacyId}/on-call-shifts/{shiftId}/cancel"
}
```

---

## 12. GET /pharmacies/{pharmacyId}/opening-hours

- **Módulo:** `pharmacy`
- **Etiqueta OpenAPI:** `pharmacy`
- **Nombre:** Horario declarado de las sedes: 24 h y turnos vigentes y próximos
- **Operation ID:** `PharmacyController_getOpeningHours`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyController.getOpeningHours](../../src/modules/pharmacy/controllers/pharmacy.controller.ts)

### Descripción de negocio

Sólo el personal de la farmacia (o la plataforma). Los turnos ya terminados o cancelados no se listan. Las horas vienen en UTC y en la hora local de la sede (`timeZone`, `America/La_Paz` por defecto).

Contexto declarado en el controlador: P34: 24 h y turnos de guardia de cada sede (sólo su personal).

### Descripción del sistema

NestJS resuelve `GET /pharmacies/{pharmacyId}/opening-hours` en `PharmacyController_getOpeningHours`. El controlador delega en `PharmacyOpeningHoursService.getOpeningHours`. No recibe body. El tipo de retorno estático es `Promise<PharmacyOpeningHoursDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /pharmacies/00000000-0000-4000-8000-000000000001/opening-hours HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PHARMACY_STAFF`.
- Deben ser UUID válidos: `pharmacyId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /pharmacies/00000000-0000-4000-8000-000000000001/opening-hours HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PharmacyOpeningHoursDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<PharmacyOpeningHoursDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<PharmacyOpeningHoursDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<PharmacyOpeningHoursDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<PharmacyOpeningHoursDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<PharmacyOpeningHoursDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<PharmacyOpeningHoursDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<PharmacyOpeningHoursDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PharmacyOpeningHoursDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "pharmacyId": "00000000-0000-4000-8000-000000000001",
  "asOf": "2026-07-31T12:00:00.000Z",
  "sites": [
    {
      "siteId": "00000000-0000-4000-8000-000000000001",
      "siteName": "Nombre de ejemplo",
      "timeZone": "America/La_Paz",
      "open24h": true,
      "shifts": [
        {
          "id": "00000000-0000-4000-8000-000000000001",
          "siteId": "00000000-0000-4000-8000-000000000001",
          "startsAt": "2026-07-31T12:00:00.000Z",
          "endsAt": "2026-07-31T12:00:00.000Z",
          "startsAtLocal": "2026-10-26T20:00:00-04:00",
          "endsAtLocal": "2026-10-27T08:00:00-04:00",
          "timeZone": "America/La_Paz",
          "source": "PHARMACY",
          "status": "ACTIVE",
          "current": true
        }
      ]
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `pharmacyId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `asOf` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `sites` | Sí | `array<PharmacySiteOpeningHoursDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"siteId":"00000000-0000-4000-8000-000000000001","siteName":"Nombre de ejemplo","timeZone":"America/La_Paz","open24h":true,"shifts":[{"id":"00000000-0000-4000-8000-000000000001","siteId":"00000000-0000-4000-8000-000000000001","startsAt":"2026-07-31T12:00:00.000Z","endsAt":"2026-07-31T12:00:00.000Z","startsAtLocal":"2026-10-26T20:00:00-04:00","endsAtLocal":"2026-10-27T08:00:00-04:00","timeZone":"America/La_Paz","source":"PHARMACY","status":"ACTIVE","current":true}]}]` |
| `sites[].siteId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `sites[].siteName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `sites[].timeZone` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `America/La_Paz` |
| `sites[].open24h` | Sí | `boolean` | admite null | Sin descripción específica en el contrato OpenAPI. | `true` |
| `sites[].shifts` | Sí | `array<PharmacyOnCallShiftDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","siteId":"00000000-0000-4000-8000-000000000001","startsAt":"2026-07-31T12:00:00.000Z","endsAt":"2026-07-31T12:00:00.000Z","startsAtLocal":"2026-10-26T20:00:00-04:00","endsAtLocal":"2026-10-27T08:00:00-04:00","timeZone":"America/La_Paz","source":"PHARMACY","status":"ACTIVE","current":true}]` |
| `sites[].shifts[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `sites[].shifts[].siteId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `sites[].shifts[].startsAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `sites[].shifts[].endsAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `sites[].shifts[].startsAtLocal` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `2026-10-26T20:00:00-04:00` |
| `sites[].shifts[].endsAtLocal` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `2026-10-27T08:00:00-04:00` |
| `sites[].shifts[].timeZone` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `America/La_Paz` |
| `sites[].shifts[].source` | Sí | `string` | valores: `PHARMACY`, `PLATFORM` | Sin descripción específica en el contrato OpenAPI. | `PHARMACY` |
| `sites[].shifts[].status` | Sí | `string` | valores: `ACTIVE`, `CANCELLED` | Sin descripción específica en el contrato OpenAPI. | `ACTIVE` |
| `sites[].shifts[].current` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, PHARMACY_STAFF. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pharmacies/{pharmacyId}/opening-hours"
}
```

---

## 13. POST /pharmacies/{pharmacyId}/price-lists

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
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PHARMACY_STAFF`.
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
| 504 | Operación completada correctamente. | `Promise<PriceListResponseDto>` | No |

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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, PHARMACY_STAFF. | Roles/tenant/guards de autorización |
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

## 14. POST /pharmacies/{pharmacyId}/price-lists/{priceListId}/close

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
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PHARMACY_STAFF`.
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
| 504 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |

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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, PHARMACY_STAFF. | Roles/tenant/guards de autorización |
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

## 15. POST /pharmacies/{pharmacyId}/price-lists/{priceListId}/prices

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
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PHARMACY_STAFF`.
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
| 504 | Operación completada correctamente. | `Promise<PriceResponseDto>` | No |

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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, PHARMACY_STAFF. | Roles/tenant/guards de autorización |
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

## 16. POST /pharmacies/{pharmacyId}/prices/bulk

- **Módulo:** `pharmacy`
- **Etiqueta OpenAPI:** `pharmacy`
- **Nombre:** Cargar precios de venta en lote, con vista previa
- **Operation ID:** `PharmacyBulkController_bulkPrices`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyBulkController.bulkPrices](../../src/modules/pharmacy/controllers/pharmacy-bulk.controller.ts)

### Descripción de negocio

Cargar precios de venta en lote, con vista previa. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /pharmacies/{pharmacyId}/prices/bulk` en `PharmacyBulkController_bulkPrices`. El controlador delega en `PharmacyBulkService.run`. Valida el body como `BulkRequestDto` y consume `application/json`. El tipo de retorno estático es `Promise<BulkResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `BulkRequestDto`; los campos opcionales se omiten.

```http
POST /pharmacies/00000000-0000-4000-8000-000000000001/prices/bulk HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "mode": "CREATE",
  "rows": [
    {
      "clave": "valor"
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PHARMACY_STAFF`.
- Deben ser UUID válidos: `pharmacyId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `mode` | Sí | `string` | valores: `CREATE`, `UPDATE`, `UPSERT` | Sin descripción específica en el contrato OpenAPI. | `CREATE` |
| `dryRun` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `false` |
| `rows` | Sí | `array<object>` | mínimo 1 elemento(s); máximo 1000 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"clave":"valor"}]` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /pharmacies/00000000-0000-4000-8000-000000000001/prices/bulk HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "mode": "CREATE",
  "dryRun": false,
  "rows": [
    {
      "clave": "valor"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<BulkResponseDto>` | Sí |
| 400 | Operación completada correctamente. | `Promise<BulkResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<BulkResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<BulkResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<BulkResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<BulkResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<BulkResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<BulkResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<BulkResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<BulkResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<BulkResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `BulkResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "dryRun": true,
  "results": [
    {
      "row": 1,
      "outcome": "CREATED",
      "id": "00000000-0000-4000-8000-000000000001",
      "errors": [
        {
          "field": "valor-ejemplo",
          "reason": "Texto descriptivo de ejemplo",
          "message": "valor-ejemplo"
        }
      ]
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `dryRun` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `results` | Sí | `array<BulkRowResultDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"row":1,"outcome":"CREATED","id":"00000000-0000-4000-8000-000000000001","errors":[{"field":"valor-ejemplo","reason":"Texto descriptivo de ejemplo","message":"valor-ejemplo"}]}]` |
| `results[].row` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `results[].outcome` | Sí | `string` | valores: `CREATED`, `UPDATED`, `REJECTED`, `UNCHANGED` | Sin descripción específica en el contrato OpenAPI. | `CREATED` |
| `results[].id` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `results[].errors` | No | `array<BulkRowErrorDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"field":"valor-ejemplo","reason":"Texto descriptivo de ejemplo","message":"valor-ejemplo"}]` |
| `results[].errors[].field` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `results[].errors[].reason` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `results[].errors[].message` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, PHARMACY_STAFF. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La farmacia no está activa | Excepción explícita en src/modules/pharmacy/services/pharmacy-bulk.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pharmacies/{pharmacyId}/prices/bulk"
}
```

---

## 17. POST /pharmacies/{pharmacyId}/products

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
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PHARMACY_STAFF`.
- Deben ser UUID válidos: `pharmacyId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `productCode` | Sí | `string` | longitud máxima 100 | Código único de producto por farmacia | `CODIGO_EJEMPLO` |
| `catalogProductId` | No | `string` | formato `uuid` | Producto del catálogo universal de medicamentos (id de `GET /pharmacy/catalog-products`). Con él, marca, genérico, concentración, forma, presentación, receta y el medicamento del vademécum los deriva el servidor y mandarlos es un 400. | `00000000-0000-4000-8000-000000000001` |
| `catalogPresentationCode` | No | `string` | longitud máxima 100 | Presentación elegida del producto del catálogo (su `code`: CN, CUM…). Sólo con `catalogProductId`. | `CODIGO_EJEMPLO` |
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
| `unitPrice` | No | `number | string` | Sin restricción adicional declarada | Precio de venta en bolivianos (número o texto decimal, hasta 2 decimales). Se versiona en la lista pública `CATALOGO` de la farmacia. | `12.5` |
| `category` | No | `string` | longitud máxima 60 | Categoría de la vitrina, por nombre (sin distinguir mayúsculas ni tildes). Tiene que ser una de `GET /pharmacies/{pharmacyId}/categories`: otra es 422. | `valor-ejemplo` |
| `description` | No | `string` | longitud máxima 2000 | Descripción para el paciente | `Texto descriptivo de ejemplo` |
| `inStock` | No | `boolean` | Sin restricción adicional declarada | `false` = «no lo tengo» (sin conteo). Junto con `stock` es 422: dirían dos cosas a la vez. | `true` |
| `status` | No | `string` | valores: `PUBLISHED`, `DRAFT` | Estado: `PUBLISHED` (por defecto) o `DRAFT` (sólo lo ve la farmacia). `WITHDRAWN` no vale en el alta. | `PUBLISHED` |
| `stock` | No | `number` | mínimo 0; máximo 1000000 | Existencias declaradas (sin ellas el producto queda «sin conteo») | `1` |
| `minStock` | No | `number` | mínimo 0; máximo 1000000 | Umbral de alerta (sin él, 5) | `1` |
| `imageFileIds` | No | `array<string>` | máximo 3 elemento(s) | Hasta 3 imágenes (ids de `POST /common/files/upload`, categoría IMAGE, subidas por quien publica) | `["00000000-0000-4000-8000-000000000001"]` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /pharmacies/00000000-0000-4000-8000-000000000001/products HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "productCode": "CODIGO_EJEMPLO",
  "catalogProductId": "00000000-0000-4000-8000-000000000001",
  "catalogPresentationCode": "CODIGO_EJEMPLO",
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
  ],
  "unitPrice": 12.5,
  "category": "valor-ejemplo",
  "description": "Texto descriptivo de ejemplo",
  "inStock": true,
  "status": "PUBLISHED",
  "stock": 1,
  "minStock": 1,
  "imageFileIds": [
    "00000000-0000-4000-8000-000000000001"
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
| 504 | Operación completada correctamente. | `Promise<ProductResponseDto>` | No |

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
| 400 | `VALIDATION_FAILED` | catalogPresentationCode sólo se manda junto con catalogProductId | Excepción explícita en src/modules/pharmacy/services/pharmacy-products.service.ts |
| 400 | `VALIDATION_FAILED` | ${supplied.join(', ')} vienen del catálogo oficial y no se mandan con catalogProductId | Excepción explícita en src/modules/pharmacy/services/pharmacy-products.service.ts |
| 400 | `VALIDATION_FAILED` | El producto tiene más de una presentación: mande catalogPresentationCode | Excepción explícita en src/modules/pharmacy/services/pharmacy-products.service.ts |
| 400 | `VALIDATION_FAILED` | catalogPresentationCode no es una presentación de ese producto | Excepción explícita en src/modules/pharmacy/services/pharmacy-products.service.ts |
| 400 | `VALIDATION_FAILED` | unitPrice debe ser un importe positivo con hasta 2 decimales | Excepción explícita en src/modules/pharmacy/services/pharmacy-products.service.ts |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, PHARMACY_STAFF. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | ${labels.subject} no le pertenece | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 404 | `NOT_FOUND` | Producto del catálogo no encontrado | Excepción explícita en src/modules/pharmacy/services/pharmacy-products.service.ts |
| 404 | `NOT_FOUND` | labels.notFound | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 409 | `CONFLICT` | Ya existe un producto con ese código en la farmacia | Excepción explícita en src/modules/pharmacy/services/pharmacy-products.service.ts |
| 409 | `CONFLICT` | Ya cargó ese producto y presentación | Excepción explícita en src/modules/pharmacy/services/pharmacy-products.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La farmacia no está activa | Excepción explícita en src/modules/pharmacy/services/pharmacy-products.service.ts |
| 422 | `PRECONDITION_FAILED` | El registro sanitario de ese producto no está vigente | Excepción explícita en src/modules/pharmacy/services/pharmacy-products.service.ts |
| 422 | `PRECONDITION_FAILED` | La imagen del producto no es un archivo de imagen | Excepción explícita en src/modules/pharmacy/services/pharmacy-products.service.ts |
| 422 | `PRECONDITION_FAILED` | ${labels.subject} está borrado | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 422 | `PRECONDITION_FAILED` | ${labels.subject} no tiene una versión vigente | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 422 | `PRECONDITION_FAILED` | ${labels.subject} resultó infectado | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 422 | `PRECONDITION_FAILED` | ${labels.subject} no es de un formato admitido para este uso | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 422 | `PRECONDITION_FAILED` | La categoría no es una de las de su farmacia | Excepción explícita en src/modules/pharmacy/services/pharmacy-categories.service.ts |
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

## 18. DELETE /pharmacies/{pharmacyId}/products/{productId}

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
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PHARMACY_STAFF`.
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
| 504 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |

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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, PHARMACY_STAFF. | Roles/tenant/guards de autorización |
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

## 19. PATCH /pharmacies/{pharmacyId}/products/{productId}

- **Módulo:** `pharmacy`
- **Etiqueta OpenAPI:** `pharmacy`
- **Nombre:** Editar un producto del catálogo de la farmacia
- **Operation ID:** `PharmacyController_updateProduct`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyController.updateProduct](../../src/modules/pharmacy/controllers/pharmacy.controller.ts)

### Descripción de negocio

Marca, genérico, concentración, empaque y receta (no en un producto del catálogo universal: 400), y lo que administra la farmacia: precio (Bs, lista `CATALOGO`), categoría por nombre, descripción, existencias o «hay / no hay», estado e imágenes. Cada clave es opcional y `null` borra lo que lo admite. Un retirado sólo acepta `status` PUBLISHED/DRAFT (si no, 422). Devuelve el producto como la lectura de gestión.

Contexto declarado en el controlador: P47 §2.

### Descripción del sistema

NestJS resuelve `PATCH /pharmacies/{pharmacyId}/products/{productId}` en `PharmacyController_updateProduct`. El controlador delega en `PharmacyProductsService.updateProduct`. Valida el body como `PharmacyUpdateProductDto` y consume `application/json`. El tipo de retorno estático es `Promise<PharmacyProductReadDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `productId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `PharmacyUpdateProductDto`; los campos opcionales se omiten.

```http
PATCH /pharmacies/00000000-0000-4000-8000-000000000001/products/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PHARMACY_STAFF`.
- Deben ser UUID válidos: `pharmacyId`, `productId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `brandName` | No | `string` | longitud mínima 1; longitud máxima 300; admite null | Marca comercial; `null` la borra | `Nombre de ejemplo` |
| `genericName` | No | `string` | longitud mínima 1; longitud máxima 300; admite null | Nombre genérico; `null` lo borra | `Nombre de ejemplo` |
| `strengthText` | No | `string` | longitud mínima 1; longitud máxima 200; admite null | Concentración (texto libre); `null` la borra | `valor-ejemplo` |
| `packageSizeText` | No | `string` | longitud mínima 1; longitud máxima 200; admite null | Tamaño de empaque (texto libre); `null` lo borra | `valor-ejemplo` |
| `requiresPrescription` | No | `boolean` | admite null | Requiere receta; `null` lo borra | `true` |
| `unitPrice` | No | `number | string` | Sin restricción adicional declarada | Precio de venta en bolivianos (número o texto decimal, hasta 2 decimales); `null` lo quita. Se versiona en la lista pública `CATALOGO`. | `12.5` |
| `category` | No | `string` | longitud máxima 60; admite null | Categoría por nombre (una de la farmacia; otra es 422); `null` la quita | `valor-ejemplo` |
| `description` | No | `string` | longitud máxima 2000; admite null | Descripción para el paciente; `null` la borra | `Texto descriptivo de ejemplo` |
| `inStock` | No | `boolean` | Sin restricción adicional declarada | `false` = «no lo tengo»; `true` vuelve a tenerlo (si el conteo estaba en 0 queda «sin conteo»). Junto con `stock` es 422. | `true` |
| `status` | No | `string` | valores: `PUBLISHED`, `DRAFT`, `WITHDRAWN` | `PUBLISHED`, `DRAFT` o `WITHDRAWN` (retira como el DELETE). Un retirado sólo acepta volver a `PUBLISHED`/`DRAFT`. | `PUBLISHED` |
| `stock` | No | `number` | mínimo 0; máximo 1000000 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `minStock` | No | `number` | mínimo 0; máximo 1000000 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `imageFileIds` | No | `array<string>` | máximo 3 elemento(s) | Las imágenes, completas y en orden: reemplaza las anteriores. Hasta 3; una nueva tiene que ser un archivo IMAGE subido por quien edita. | `["00000000-0000-4000-8000-000000000001"]` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PATCH /pharmacies/00000000-0000-4000-8000-000000000001/products/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "brandName": "Nombre de ejemplo",
  "genericName": "Nombre de ejemplo",
  "strengthText": "valor-ejemplo",
  "packageSizeText": "valor-ejemplo",
  "requiresPrescription": true,
  "unitPrice": 12.5,
  "category": "valor-ejemplo",
  "description": "Texto descriptivo de ejemplo",
  "inStock": true,
  "status": "PUBLISHED",
  "stock": 1,
  "minStock": 1,
  "imageFileIds": [
    "00000000-0000-4000-8000-000000000001"
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PharmacyProductReadDto>` | Sí |
| 400 | Operación completada correctamente. | `Promise<PharmacyProductReadDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PharmacyProductReadDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PharmacyProductReadDto>` | No |
| 404 | Operación completada correctamente. | `Promise<PharmacyProductReadDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PharmacyProductReadDto>` | No |
| 413 | Operación completada correctamente. | `Promise<PharmacyProductReadDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PharmacyProductReadDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PharmacyProductReadDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PharmacyProductReadDto>` | No |
| 504 | Operación completada correctamente. | `Promise<PharmacyProductReadDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PharmacyProductReadDto`. Ejemplo completo derivado de ese DTO:

```json
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
  "requiresPrescription": {},
  "unitPrice": "12.50",
  "currency": "BOB",
  "inStock": true,
  "category": "valor-ejemplo",
  "description": "Texto descriptivo de ejemplo",
  "status": "PUBLISHED",
  "stock": 1,
  "minStock": 1,
  "outOfStockDeclared": true,
  "imageFileIds": [
    "00000000-0000-4000-8000-000000000001"
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `pharmacyId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `pharmacyName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `productCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `brandName` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `genericName` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `strengthText` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `packageSizeText` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `dosageForm` | No | `PharmacyConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `dosageForm.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `dosageForm.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `medication` | No | `PharmacyConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `medication.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `medication.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `requiresPrescription` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `unitPrice` | No | `string` | admite null | Precio vigente (lista `CATALOGO`, o el menor de sus listas públicas de mostrador). Texto exacto; `null` = sin precio. | `12.50` |
| `currency` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `BOB` |
| `inStock` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `category` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `description` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `status` | No | `string` | valores: `PUBLISHED`, `DRAFT`, `WITHDRAWN` | Sin descripción específica en el contrato OpenAPI. | `PUBLISHED` |
| `stock` | No | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `minStock` | No | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `outOfStockDeclared` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `imageFileIds` | No | `array<string>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `["00000000-0000-4000-8000-000000000001"]` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 400 | `VALIDATION_FAILED` | ${changed.join(', ')} vienen del catálogo oficial y no se editan | Excepción explícita en src/modules/pharmacy/services/pharmacy-products.service.ts |
| 400 | `VALIDATION_FAILED` | unitPrice debe ser un importe positivo con hasta 2 decimales | Excepción explícita en src/modules/pharmacy/services/pharmacy-products.service.ts |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, PHARMACY_STAFF. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | ${labels.subject} no le pertenece | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 404 | `NOT_FOUND` | Producto no encontrado | Excepción explícita en src/modules/pharmacy/services/pharmacy-products.service.ts |
| 404 | `NOT_FOUND` | labels.notFound | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El producto no está activo | Excepción explícita en src/modules/pharmacy/services/pharmacy-products.service.ts |
| 422 | `PRECONDITION_FAILED` | La imagen del producto no es un archivo de imagen | Excepción explícita en src/modules/pharmacy/services/pharmacy-products.service.ts |
| 422 | `PRECONDITION_FAILED` | ${labels.subject} está borrado | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 422 | `PRECONDITION_FAILED` | ${labels.subject} no tiene una versión vigente | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 422 | `PRECONDITION_FAILED` | ${labels.subject} resultó infectado | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 422 | `PRECONDITION_FAILED` | ${labels.subject} no es de un formato admitido para este uso | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 422 | `PRECONDITION_FAILED` | La categoría no es una de las de su farmacia | Excepción explícita en src/modules/pharmacy/services/pharmacy-categories.service.ts |
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

## 20. POST /pharmacies/{pharmacyId}/products/bulk

- **Módulo:** `pharmacy`
- **Etiqueta OpenAPI:** `pharmacy`
- **Nombre:** Cargar productos en lote, con vista previa
- **Operation ID:** `PharmacyBulkController_bulkProducts`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyBulkController.bulkProducts](../../src/modules/pharmacy/controllers/pharmacy-bulk.controller.ts)

### Descripción de negocio

Cargar productos en lote, con vista previa. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /pharmacies/{pharmacyId}/products/bulk` en `PharmacyBulkController_bulkProducts`. El controlador delega en `PharmacyBulkService.run`. Valida el body como `BulkRequestDto` y consume `application/json`. El tipo de retorno estático es `Promise<BulkResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `BulkRequestDto`; los campos opcionales se omiten.

```http
POST /pharmacies/00000000-0000-4000-8000-000000000001/products/bulk HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "mode": "CREATE",
  "rows": [
    {
      "clave": "valor"
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PHARMACY_STAFF`.
- Deben ser UUID válidos: `pharmacyId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `mode` | Sí | `string` | valores: `CREATE`, `UPDATE`, `UPSERT` | Sin descripción específica en el contrato OpenAPI. | `CREATE` |
| `dryRun` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `false` |
| `rows` | Sí | `array<object>` | mínimo 1 elemento(s); máximo 1000 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"clave":"valor"}]` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /pharmacies/00000000-0000-4000-8000-000000000001/products/bulk HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "mode": "CREATE",
  "dryRun": false,
  "rows": [
    {
      "clave": "valor"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<BulkResponseDto>` | Sí |
| 400 | Operación completada correctamente. | `Promise<BulkResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<BulkResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<BulkResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<BulkResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<BulkResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<BulkResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<BulkResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<BulkResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<BulkResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<BulkResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `BulkResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "dryRun": true,
  "results": [
    {
      "row": 1,
      "outcome": "CREATED",
      "id": "00000000-0000-4000-8000-000000000001",
      "errors": [
        {
          "field": "valor-ejemplo",
          "reason": "Texto descriptivo de ejemplo",
          "message": "valor-ejemplo"
        }
      ]
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `dryRun` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `results` | Sí | `array<BulkRowResultDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"row":1,"outcome":"CREATED","id":"00000000-0000-4000-8000-000000000001","errors":[{"field":"valor-ejemplo","reason":"Texto descriptivo de ejemplo","message":"valor-ejemplo"}]}]` |
| `results[].row` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `results[].outcome` | Sí | `string` | valores: `CREATED`, `UPDATED`, `REJECTED`, `UNCHANGED` | Sin descripción específica en el contrato OpenAPI. | `CREATED` |
| `results[].id` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `results[].errors` | No | `array<BulkRowErrorDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"field":"valor-ejemplo","reason":"Texto descriptivo de ejemplo","message":"valor-ejemplo"}]` |
| `results[].errors[].field` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `results[].errors[].reason` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `results[].errors[].message` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, PHARMACY_STAFF. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La farmacia no está activa | Excepción explícita en src/modules/pharmacy/services/pharmacy-bulk.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pharmacies/{pharmacyId}/products/bulk"
}
```

---

## 21. POST /pharmacies/{pharmacyId}/projections

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
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PHARMACY_STAFF`.
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
| 504 | Operación completada correctamente. | `Promise<CatalogProjectionDto>` | No |

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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, PHARMACY_STAFF. | Roles/tenant/guards de autorización |
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

## 22. POST /pharmacies/{pharmacyId}/sites

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
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PHARMACY_STAFF`.
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
| 504 | Operación completada correctamente. | `Promise<SiteResponseDto>` | No |

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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, PHARMACY_STAFF. | Roles/tenant/guards de autorización |
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

## 23. POST /pharmacies/{pharmacyId}/sites/{siteId}/on-call-shifts

- **Módulo:** `pharmacy`
- **Etiqueta OpenAPI:** `pharmacy`
- **Nombre:** Registrar un turno de guardia de la sede
- **Operation ID:** `PharmacyController_createOnCallShift`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyController.createOnCallShift](../../src/modules/pharmacy/controllers/pharmacy.controller.ts)

### Descripción de negocio

Horas ISO-8601 con desplazamiento obligatorio. Como mucho 72 h, no ya terminado, a no más de 62 días: si no, 422 `ON_CALL_SHIFT_WINDOW_INVALID`. Solapado con otro turno activo de la sede: 409 `ON_CALL_SHIFT_OVERLAP`.

Contexto declarado en el controlador: P34: registrar un turno de guardia de la sede.

### Descripción del sistema

NestJS resuelve `POST /pharmacies/{pharmacyId}/sites/{siteId}/on-call-shifts` en `PharmacyController_createOnCallShift`. El controlador delega en `PharmacyOpeningHoursService.createShift`. Valida el body como `PharmacyCreateOnCallShiftDto` y consume `application/json`. El tipo de retorno estático es `Promise<OnCallShiftDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `siteId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `PharmacyCreateOnCallShiftDto`; los campos opcionales se omiten.

```http
POST /pharmacies/00000000-0000-4000-8000-000000000001/sites/00000000-0000-4000-8000-000000000001/on-call-shifts HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "startsAt": "2026-10-26T20:00:00-04:00",
  "endsAt": "2026-10-27T08:00:00-04:00"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PHARMACY_STAFF`.
- Deben ser UUID válidos: `pharmacyId`, `siteId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `startsAt` | Sí | `string` | Sin restricción adicional declarada | Inicio, ISO-8601 con desplazamiento obligatorio (p. ej. `2026-10-26T20:00:00-04:00`) | `2026-10-26T20:00:00-04:00` |
| `endsAt` | Sí | `string` | Sin restricción adicional declarada | Fin (exclusivo), ISO-8601 con desplazamiento obligatorio. Como mucho 72 h después del inicio | `2026-10-27T08:00:00-04:00` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /pharmacies/00000000-0000-4000-8000-000000000001/sites/00000000-0000-4000-8000-000000000001/on-call-shifts HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "startsAt": "2026-10-26T20:00:00-04:00",
  "endsAt": "2026-10-27T08:00:00-04:00"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<OnCallShiftDto>` | Sí |
| 400 | Operación completada correctamente. | `Promise<OnCallShiftDto>` | No |
| 401 | Operación completada correctamente. | `Promise<OnCallShiftDto>` | No |
| 403 | Operación completada correctamente. | `Promise<OnCallShiftDto>` | No |
| 404 | Operación completada correctamente. | `Promise<OnCallShiftDto>` | No |
| 409 | Operación completada correctamente. | `Promise<OnCallShiftDto>` | No |
| 413 | Operación completada correctamente. | `Promise<OnCallShiftDto>` | No |
| 422 | Operación completada correctamente. | `Promise<OnCallShiftDto>` | No |
| 429 | Operación completada correctamente. | `Promise<OnCallShiftDto>` | No |
| 500 | Operación completada correctamente. | `Promise<OnCallShiftDto>` | No |
| 504 | Operación completada correctamente. | `Promise<OnCallShiftDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `OnCallShiftDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "siteId": "00000000-0000-4000-8000-000000000001",
  "startsAt": "2026-07-31T12:00:00.000Z",
  "endsAt": "2026-07-31T12:00:00.000Z",
  "startsAtLocal": "2026-10-26T20:00:00-04:00",
  "endsAtLocal": "2026-10-27T08:00:00-04:00",
  "timeZone": "America/La_Paz",
  "source": "PHARMACY",
  "status": "ACTIVE",
  "current": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador del turno. | `00000000-0000-4000-8000-000000000001` |
| `siteId` | Sí | `string` | formato `uuid` | Sede del turno. | `00000000-0000-4000-8000-000000000001` |
| `startsAt` | Sí | `string` | formato `date-time` | Inicio (instante UTC). | `2026-07-31T12:00:00.000Z` |
| `endsAt` | Sí | `string` | formato `date-time` | Fin, exclusivo (instante UTC). | `2026-07-31T12:00:00.000Z` |
| `startsAtLocal` | Sí | `string` | Sin restricción adicional declarada | Inicio en la hora local de la sede. | `2026-10-26T20:00:00-04:00` |
| `endsAtLocal` | Sí | `string` | Sin restricción adicional declarada | Fin en la hora local de la sede. | `2026-10-27T08:00:00-04:00` |
| `timeZone` | Sí | `string` | Sin restricción adicional declarada | Huso con que se escribió la hora local. | `America/La_Paz` |
| `source` | Sí | `string` | valores: `PHARMACY`, `PLATFORM` | Quién lo declaró. | `PHARMACY` |
| `status` | Sí | `string` | valores: `ACTIVE`, `CANCELLED` | Estado. | `ACTIVE` |
| `current` | Sí | `boolean` | Sin restricción adicional declarada | Si está vigente en `asOf`. | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, PHARMACY_STAFF. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La fecha del turno no es válida | Excepción explícita en src/modules/pharmacy/services/pharmacy-opening-hours.service.ts |
| 422 | `PRECONDITION_FAILED` | WINDOW_MESSAGES[problem] | Excepción explícita en src/modules/pharmacy/services/pharmacy-opening-hours.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pharmacies/{pharmacyId}/sites/{siteId}/on-call-shifts"
}
```

---

## 24. PUT /pharmacies/{pharmacyId}/sites/{siteId}/open-24h

- **Módulo:** `pharmacy`
- **Etiqueta OpenAPI:** `pharmacy`
- **Nombre:** Declarar si la sede abre las 24 horas
- **Operation ID:** `PharmacyController_setOpen24h`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyController.setOpen24h](../../src/modules/pharmacy/controllers/pharmacy.controller.ts)

### Descripción de negocio

`open24h: null` vuelve a «no declarado». Una sede de otra farmacia responde 404 igual que una inexistente.

Contexto declarado en el controlador: P34: la sede declara (o retira) que abre 24 h.

### Descripción del sistema

NestJS resuelve `PUT /pharmacies/{pharmacyId}/sites/{siteId}/open-24h` en `PharmacyController_setOpen24h`. El controlador delega en `PharmacyOpeningHoursService.setOpen24h`. Valida el body como `PharmacySetOpen24hDto` y consume `application/json`. El tipo de retorno estático es `Promise<SiteOpeningHoursDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `siteId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `PharmacySetOpen24hDto`; los campos opcionales se omiten.

```http
PUT /pharmacies/00000000-0000-4000-8000-000000000001/sites/00000000-0000-4000-8000-000000000001/open-24h HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "open24h": true
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PHARMACY_STAFF`.
- Deben ser UUID válidos: `pharmacyId`, `siteId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `open24h` | Sí | `boolean` | admite null | `true`: abre las 24 h · `false`: no · `null`: retira la declaración (vuelve a «no declarado») | `true` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PUT /pharmacies/00000000-0000-4000-8000-000000000001/sites/00000000-0000-4000-8000-000000000001/open-24h HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "open24h": true
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<SiteOpeningHoursDto>` | Sí |
| 400 | Operación completada correctamente. | `Promise<SiteOpeningHoursDto>` | No |
| 401 | Operación completada correctamente. | `Promise<SiteOpeningHoursDto>` | No |
| 403 | Operación completada correctamente. | `Promise<SiteOpeningHoursDto>` | No |
| 404 | Operación completada correctamente. | `Promise<SiteOpeningHoursDto>` | No |
| 409 | Operación completada correctamente. | `Promise<SiteOpeningHoursDto>` | No |
| 413 | Operación completada correctamente. | `Promise<SiteOpeningHoursDto>` | No |
| 422 | Operación completada correctamente. | `Promise<SiteOpeningHoursDto>` | No |
| 429 | Operación completada correctamente. | `Promise<SiteOpeningHoursDto>` | No |
| 500 | Operación completada correctamente. | `Promise<SiteOpeningHoursDto>` | No |
| 504 | Operación completada correctamente. | `Promise<SiteOpeningHoursDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `SiteOpeningHoursDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "siteId": "00000000-0000-4000-8000-000000000001",
  "siteName": "Nombre de ejemplo",
  "timeZone": "America/La_Paz",
  "open24h": true,
  "shifts": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "siteId": "00000000-0000-4000-8000-000000000001",
      "startsAt": "2026-07-31T12:00:00.000Z",
      "endsAt": "2026-07-31T12:00:00.000Z",
      "startsAtLocal": "2026-10-26T20:00:00-04:00",
      "endsAtLocal": "2026-10-27T08:00:00-04:00",
      "timeZone": "America/La_Paz",
      "source": "PHARMACY",
      "status": "ACTIVE",
      "current": true
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `siteId` | Sí | `string` | formato `uuid` | Sede. | `00000000-0000-4000-8000-000000000001` |
| `siteName` | Sí | `string` | Sin restricción adicional declarada | Nombre de la sede. | `Nombre de ejemplo` |
| `timeZone` | Sí | `string` | Sin restricción adicional declarada | Huso de la sede. | `America/La_Paz` |
| `open24h` | Sí | `boolean` | admite null | `null` = no lo declaró. | `true` |
| `shifts` | Sí | `array<OnCallShiftDto>` | Sin restricción adicional declarada | Turnos activos que todavía no terminaron, del más próximo al más lejano. | `[{"id":"00000000-0000-4000-8000-000000000001","siteId":"00000000-0000-4000-8000-000000000001","startsAt":"2026-07-31T12:00:00.000Z","endsAt":"2026-07-31T12:00:00.000Z","startsAtLocal":"2026-10-26T20:00:00-04:00","endsAtLocal":"2026-10-27T08:00:00-04:00","timeZone":"America/La_Paz","source":"PHARMACY","status":"ACTIVE","current":true}]` |
| `shifts[].id` | Sí | `string` | formato `uuid` | Identificador del turno. | `00000000-0000-4000-8000-000000000001` |
| `shifts[].siteId` | Sí | `string` | formato `uuid` | Sede del turno. | `00000000-0000-4000-8000-000000000001` |
| `shifts[].startsAt` | Sí | `string` | formato `date-time` | Inicio (instante UTC). | `2026-07-31T12:00:00.000Z` |
| `shifts[].endsAt` | Sí | `string` | formato `date-time` | Fin, exclusivo (instante UTC). | `2026-07-31T12:00:00.000Z` |
| `shifts[].startsAtLocal` | Sí | `string` | Sin restricción adicional declarada | Inicio en la hora local de la sede. | `2026-10-26T20:00:00-04:00` |
| `shifts[].endsAtLocal` | Sí | `string` | Sin restricción adicional declarada | Fin en la hora local de la sede. | `2026-10-27T08:00:00-04:00` |
| `shifts[].timeZone` | Sí | `string` | Sin restricción adicional declarada | Huso con que se escribió la hora local. | `America/La_Paz` |
| `shifts[].source` | Sí | `string` | valores: `PHARMACY`, `PLATFORM` | Quién lo declaró. | `PHARMACY` |
| `shifts[].status` | Sí | `string` | valores: `ACTIVE`, `CANCELLED` | Estado. | `ACTIVE` |
| `shifts[].current` | Sí | `boolean` | Sin restricción adicional declarada | Si está vigente en `asOf`. | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, PHARMACY_STAFF. | Roles/tenant/guards de autorización |
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
  "path": "/pharmacies/{pharmacyId}/sites/{siteId}/open-24h"
}
```

---

## 25. POST /pharmacies/{pharmacyId}/sites/bulk

- **Módulo:** `pharmacy`
- **Etiqueta OpenAPI:** `pharmacy`
- **Nombre:** Cargar sucursales (sedes de venta) en lote, con vista previa
- **Operation ID:** `PharmacyBulkController_bulkSites`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyBulkController.bulkSites](../../src/modules/pharmacy/controllers/pharmacy-bulk.controller.ts)

### Descripción de negocio

Cargar sucursales (sedes de venta) en lote, con vista previa. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /pharmacies/{pharmacyId}/sites/bulk` en `PharmacyBulkController_bulkSites`. El controlador delega en `PharmacyBulkService.run`. Valida el body como `BulkRequestDto` y consume `application/json`. El tipo de retorno estático es `Promise<BulkResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `BulkRequestDto`; los campos opcionales se omiten.

```http
POST /pharmacies/00000000-0000-4000-8000-000000000001/sites/bulk HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "mode": "CREATE",
  "rows": [
    {
      "clave": "valor"
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PHARMACY_STAFF`.
- Deben ser UUID válidos: `pharmacyId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `mode` | Sí | `string` | valores: `CREATE`, `UPDATE`, `UPSERT` | Sin descripción específica en el contrato OpenAPI. | `CREATE` |
| `dryRun` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `false` |
| `rows` | Sí | `array<object>` | mínimo 1 elemento(s); máximo 1000 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"clave":"valor"}]` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /pharmacies/00000000-0000-4000-8000-000000000001/sites/bulk HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "mode": "CREATE",
  "dryRun": false,
  "rows": [
    {
      "clave": "valor"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<BulkResponseDto>` | Sí |
| 400 | Operación completada correctamente. | `Promise<BulkResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<BulkResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<BulkResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<BulkResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<BulkResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<BulkResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<BulkResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<BulkResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<BulkResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<BulkResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `BulkResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "dryRun": true,
  "results": [
    {
      "row": 1,
      "outcome": "CREATED",
      "id": "00000000-0000-4000-8000-000000000001",
      "errors": [
        {
          "field": "valor-ejemplo",
          "reason": "Texto descriptivo de ejemplo",
          "message": "valor-ejemplo"
        }
      ]
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `dryRun` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `results` | Sí | `array<BulkRowResultDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"row":1,"outcome":"CREATED","id":"00000000-0000-4000-8000-000000000001","errors":[{"field":"valor-ejemplo","reason":"Texto descriptivo de ejemplo","message":"valor-ejemplo"}]}]` |
| `results[].row` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `results[].outcome` | Sí | `string` | valores: `CREATED`, `UPDATED`, `REJECTED`, `UNCHANGED` | Sin descripción específica en el contrato OpenAPI. | `CREATED` |
| `results[].id` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `results[].errors` | No | `array<BulkRowErrorDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"field":"valor-ejemplo","reason":"Texto descriptivo de ejemplo","message":"valor-ejemplo"}]` |
| `results[].errors[].field` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `results[].errors[].reason` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `results[].errors[].message` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, PHARMACY_STAFF. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La farmacia no está activa | Excepción explícita en src/modules/pharmacy/services/pharmacy-bulk.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pharmacies/{pharmacyId}/sites/bulk"
}
```

---

## 26. GET /pharmacy/catalog-products

- **Módulo:** `pharmacy`
- **Etiqueta OpenAPI:** `pharmacy-directory`
- **Nombre:** Buscar en el catálogo universal de medicamentos
- **Operation ID:** `PharmacyReadController_searchCatalogProducts`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyReadController.searchCatalogProducts](../../src/modules/pharmacy/controllers/pharmacy-read.controller.ts)

### Descripción de negocio

Buscar en el catálogo universal de medicamentos. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: El catálogo universal de medicamentos: lo que una farmacia busca para dar de alta un producto en vez de tipearlo. Registros sanitarios oficiales, uno por fuente; los que ya no están vigentes se listan con `selectable: false`.

### Descripción del sistema

NestJS resuelve `GET /pharmacy/catalog-products` en `PharmacyReadController_searchCatalogProducts`. El controlador delega en `MedicineCatalogSearchService.search`. No recibe body. El tipo de retorno estático es `Promise<CatalogProductPageDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `search` | query | No | `string` | longitud mínima 2; longitud máxima 100 | Nombre, principio activo, ATC, titular o nº de registro (mínimo 2 letras) | `valor-ejemplo` |
| `source` | query | No | `string` | valores: `agemed`, `cima`, `invima`, `anvisa` | Sin descripción específica en OpenAPI. | `agemed` |
| `atc` | query | No | `string` | Sin restricción adicional declarada | ATC nivel 5 exacto | `N02BE01` |
| `limit` | query | No | `number` | mínimo 1; máximo 50 | Sin descripción específica en OpenAPI. | `20` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /pharmacy/catalog-products HTTP/1.1
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
GET /pharmacy/catalog-products?search=valor-ejemplo&source=agemed&atc=N02BE01&limit=20 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<CatalogProductPageDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<CatalogProductPageDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<CatalogProductPageDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<CatalogProductPageDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<CatalogProductPageDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<CatalogProductPageDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<CatalogProductPageDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CatalogProductPageDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "source": "agemed",
      "sourceName": "Nombre de ejemplo",
      "code": "CODIGO_EJEMPLO",
      "display": "valor-ejemplo",
      "holder": "valor-ejemplo",
      "strengthText": "valor-ejemplo",
      "dosageForm": "valor-ejemplo",
      "requiresPrescription": true,
      "generic": true,
      "activeIngredients": [
        {
          "name": "Nombre de ejemplo",
          "amount": {},
          "unit": {}
        }
      ],
      "atc": [
        "valor-ejemplo"
      ],
      "presentations": [
        {
          "code": {},
          "name": "Nombre de ejemplo",
          "gtin": {},
          "active": {}
        }
      ],
      "regulatoryStatus": "ACTIVE",
      "selectable": true,
      "photo": {
        "url": "valor-ejemplo",
        "thumbUrl": {},
        "attribution": "valor-ejemplo"
      },
      "sourceUrl": "valor-ejemplo"
    }
  ],
  "limit": 1,
  "truncated": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<CatalogProductDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","source":"agemed","sourceName":"Nombre de ejemplo","code":"CODIGO_EJEMPLO","display":"valor-ejemplo","holder":"valor-ejemplo","strengthText":"valor-ejemplo","dosageForm":"valor-ejemplo","requiresPrescription":true,"generic":true,"activeIngredients":[{"name":"Nombre de ejemplo","amount":{},"unit":{}}],"atc":["valor-ejemplo"],"presentations":[{"code":{},"name":"Nombre de ejemplo","gtin":{},"active":{}}],"regulatoryStatus":"ACTIVE","selectable":true,"photo":{"url":"valor-ejemplo","thumbUrl":{},"attribution":"valor-ejemplo"},"sourceUrl":"valor-ejemplo"}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Id del concepto en la terminología; es lo que viaja como `catalogProductId` en el alta. | `00000000-0000-4000-8000-000000000001` |
| `items[].source` | Sí | `string` | valores: `agemed`, `cima`, `invima`, `anvisa` | Sin descripción específica en el contrato OpenAPI. | `agemed` |
| `items[].sourceName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].code` | Sí | `string` | Sin restricción adicional declarada | Id de origen en la fuente (nº de registro sanitario). | `CODIGO_EJEMPLO` |
| `items[].display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].holder` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].strengthText` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].dosageForm` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].requiresPrescription` | No | `boolean` | admite null | `null` = la fuente no lo declara. | `true` |
| `items[].generic` | No | `boolean` | admite null | Sin descripción específica en el contrato OpenAPI. | `true` |
| `items[].activeIngredients` | Sí | `array<CatalogIngredientDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"name":"Nombre de ejemplo","amount":{},"unit":{}}]` |
| `items[].activeIngredients[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].activeIngredients[].amount` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `items[].activeIngredients[].unit` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `items[].atc` | Sí | `array<string>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `["valor-ejemplo"]` |
| `items[].presentations` | Sí | `array<CatalogPresentationDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"code":{},"name":"Nombre de ejemplo","gtin":{},"active":{}}]` |
| `items[].presentations[].code` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `items[].presentations[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].presentations[].gtin` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `items[].presentations[].active` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `items[].regulatoryStatus` | Sí | `string` | valores: `ACTIVE`, `INACTIVE`, `SUSPENDED`, `REVOKED` | Sin descripción específica en el contrato OpenAPI. | `ACTIVE` |
| `items[].selectable` | Sí | `boolean` | Sin restricción adicional declarada | Sólo un registro vigente se puede elegir. | `true` |
| `items[].photo` | No | `CatalogPhotoDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"url":"valor-ejemplo","thumbUrl":{},"attribution":"valor-ejemplo"}` |
| `items[].photo.url` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].photo.thumbUrl` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `items[].photo.attribution` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].sourceUrl` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `limit` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `truncated` | Sí | `boolean` | Sin restricción adicional declarada | `true` si quedaron productos afuera del tope. | `true` |

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
  "path": "/pharmacy/catalog-products"
}
```

---

## 27. GET /pharmacy/pharmacies

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
| 504 | Consulta completada correctamente. | `Promise<PharmacyDirectoryResponseDto>` | No |

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

## 28. GET /pharmacy/pharmacies/{id}

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
| 504 | Consulta completada correctamente. | `Promise<PharmacyDetailDto>` | No |

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
  ],
  "taxId": {},
  "companyType": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "legalAddressText": {},
  "headquarters": {
    "latitude": 1,
    "longitude": 1
  }
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
| `taxId` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `companyType` | No | `PharmacyConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `companyType.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `companyType.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `legalAddressText` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `headquarters` | No | `PharmacyGeoPointDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"latitude":1,"longitude":1}` |
| `headquarters.latitude` | No | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `headquarters.longitude` | No | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |

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

## 29. GET /pharmacy/pharmacies/{id}/contacts

- **Módulo:** `pharmacy`
- **Etiqueta OpenAPI:** `pharmacy-directory`
- **Nombre:** Representante legal y gerencias de la farmacia (sólo su personal)
- **Operation ID:** `PharmacyReadController_getContacts`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyReadController.getContacts](../../src/modules/pharmacy/controllers/pharmacy-read.controller.ts)

### Descripción de negocio

Representante legal y gerencias de la farmacia (sólo su personal). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: El representante legal y las gerencias de la organización dueña de la farmacia. Mismo alcance que las licencias.

### Descripción del sistema

NestJS resuelve `GET /pharmacy/pharmacies/{id}/contacts` en `PharmacyReadController_getContacts`. El controlador delega en `PharmacyStaffReadService.getContacts`. No recibe body. El tipo de retorno estático es `Promise<PharmacyContactsResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /pharmacy/pharmacies/00000000-0000-4000-8000-000000000001/contacts HTTP/1.1
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
GET /pharmacy/pharmacies/00000000-0000-4000-8000-000000000001/contacts HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PharmacyContactsResponseDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<PharmacyContactsResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<PharmacyContactsResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<PharmacyContactsResponseDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<PharmacyContactsResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<PharmacyContactsResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<PharmacyContactsResponseDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<PharmacyContactsResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PharmacyContactsResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "legalRepresentative": {
    "role": "valor-ejemplo",
    "fullName": "Nombre de ejemplo",
    "email": {},
    "phone": {}
  },
  "executives": [
    {
      "role": "valor-ejemplo",
      "fullName": "Nombre de ejemplo",
      "email": {},
      "phone": {}
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `legalRepresentative` | No | `PharmacyContactPersonDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"role":"valor-ejemplo","fullName":"Nombre de ejemplo","email":{},"phone":{}}` |
| `legalRepresentative.role` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `legalRepresentative.fullName` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `legalRepresentative.email` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `legalRepresentative.phone` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `executives` | Sí | `array<PharmacyContactPersonDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"role":"valor-ejemplo","fullName":"Nombre de ejemplo","email":{},"phone":{}}]` |
| `executives[].role` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `executives[].fullName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `executives[].email` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `executives[].phone` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Se requiere pertenecer a la organización, o ser administrador de la plataforma | Excepción explícita en src/modules/directory/services/tenant-administration.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pharmacy/pharmacies/{id}/contacts"
}
```

---

## 30. GET /pharmacy/pharmacies/{id}/licenses

- **Módulo:** `pharmacy`
- **Etiqueta OpenAPI:** `pharmacy-directory`
- **Nombre:** Licencias de la farmacia (sólo su personal)
- **Operation ID:** `PharmacyReadController_listLicenses`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyReadController.listLicenses](../../src/modules/pharmacy/controllers/pharmacy-read.controller.ts)

### Descripción de negocio

Licencias de la farmacia (sólo su personal). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: La carpeta de licencias de la farmacia (`pharmacy_licenses`), con los días hasta el vencimiento contados por el servidor. Sin `@Roles`: el alcance no es un rol global sino **pertenecer a la organización dueña** (o ser de la plataforma), y eso lo decide el servicio. Quien no pertenece recibe el mismo 404 que un id inexistente.

### Descripción del sistema

NestJS resuelve `GET /pharmacy/pharmacies/{id}/licenses` en `PharmacyReadController_listLicenses`. El controlador delega en `PharmacyStaffReadService.listLicenses`. No recibe body. El tipo de retorno estático es `Promise<PharmacyLicenseListResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /pharmacy/pharmacies/00000000-0000-4000-8000-000000000001/licenses HTTP/1.1
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
GET /pharmacy/pharmacies/00000000-0000-4000-8000-000000000001/licenses HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PharmacyLicenseListResponseDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<PharmacyLicenseListResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<PharmacyLicenseListResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<PharmacyLicenseListResponseDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<PharmacyLicenseListResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<PharmacyLicenseListResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<PharmacyLicenseListResponseDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<PharmacyLicenseListResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PharmacyLicenseListResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "type": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "number": "valor-ejemplo",
      "siteId": {},
      "siteName": {},
      "jurisdiction": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "validFrom": {},
      "validTo": {},
      "daysToExpiry": {},
      "verificationStatus": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "evidenceFileId": {}
    }
  ],
  "count": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<PharmacyLicenseDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","type":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"number":"valor-ejemplo","siteId":{},"siteName":{},"jurisdiction":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"validFrom":{},"validTo":{},"daysToExpiry":{},"verificationStatus":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"evidenceFileId":{}}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].type` | No | `PharmacyConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `items[].type.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].type.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].number` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].siteId` | No | `object` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `items[].siteName` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `items[].jurisdiction` | No | `PharmacyConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `items[].jurisdiction.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].jurisdiction.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].validFrom` | No | `object` | formato `date`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `items[].validTo` | No | `object` | formato `date`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `items[].daysToExpiry` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `items[].verificationStatus` | No | `PharmacyConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `items[].verificationStatus.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].verificationStatus.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].evidenceFileId` | No | `object` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Se requiere pertenecer a la organización, o ser administrador de la plataforma | Excepción explícita en src/modules/directory/services/tenant-administration.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pharmacy/pharmacies/{id}/licenses"
}
```

---

## 31. GET /pharmacy/pharmacies/{id}/summary

- **Módulo:** `pharmacy`
- **Etiqueta OpenAPI:** `pharmacy-directory`
- **Nombre:** Resumen del catálogo de la farmacia (sólo su personal)
- **Operation ID:** `PharmacyReadController_getSummary`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyReadController.getSummary](../../src/modules/pharmacy/controllers/pharmacy-read.controller.ts)

### Descripción de negocio

Resumen del catálogo de la farmacia (sólo su personal). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: P47: los números del resumen del portal de la farmacia (sólo su personal).

### Descripción del sistema

NestJS resuelve `GET /pharmacy/pharmacies/{id}/summary` en `PharmacyReadController_getSummary`. El controlador delega en `PharmacyStaffReadService.getSummary`. No recibe body. El tipo de retorno estático es `Promise<PharmacySummaryDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /pharmacy/pharmacies/00000000-0000-4000-8000-000000000001/summary HTTP/1.1
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
GET /pharmacy/pharmacies/00000000-0000-4000-8000-000000000001/summary HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PharmacySummaryDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<PharmacySummaryDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<PharmacySummaryDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<PharmacySummaryDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<PharmacySummaryDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<PharmacySummaryDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<PharmacySummaryDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<PharmacySummaryDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PharmacySummaryDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "published": 1,
  "drafts": 1,
  "withdrawn": 1,
  "outOfStock": 1,
  "lowStock": 1,
  "inventoryValue": "valor-ejemplo",
  "byCategory": [
    {
      "category": "valor-ejemplo",
      "count": 1
    }
  ],
  "recentActivity": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "at": "valor-ejemplo",
      "kind": "valor-ejemplo",
      "text": "valor-ejemplo"
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `published` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `drafts` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `withdrawn` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `outOfStock` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `lowStock` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `inventoryValue` | Sí | `string` | Sin restricción adicional declarada | Valor del inventario, decimal en texto | `valor-ejemplo` |
| `byCategory` | Sí | `array<PharmacyCategoryCountDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"category":"valor-ejemplo","count":1}]` |
| `byCategory[].category` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `byCategory[].count` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `recentActivity` | Sí | `array<PharmacyRecentActivityDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","at":"valor-ejemplo","kind":"valor-ejemplo","text":"valor-ejemplo"}]` |
| `recentActivity[].id` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `recentActivity[].at` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `recentActivity[].kind` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `recentActivity[].text` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Se requiere pertenecer a la organización, o ser administrador de la plataforma | Excepción explícita en src/modules/directory/services/tenant-administration.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pharmacy/pharmacies/{id}/summary"
}
```

---

## 32. GET /pharmacy/products

- **Módulo:** `pharmacy`
- **Etiqueta OpenAPI:** `pharmacy-directory`
- **Nombre:** Buscar productos publicados por texto, medicamento o farmacia
- **Operation ID:** `PharmacyReadController_searchProducts`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyReadController.searchProducts](../../src/modules/pharmacy/controllers/pharmacy-read.controller.ts)

### Descripción de negocio

Buscar productos publicados por texto, medicamento o farmacia. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: E2: búsqueda de productos por texto, por medicamento o por farmacia.

### Descripción del sistema

NestJS resuelve `GET /pharmacy/products` en `PharmacyReadController_searchProducts`. El controlador delega en `PharmacyStaffReadService.listManagedProducts`, `PharmacyReadService.searchProducts`. No recibe body. El tipo de retorno estático es `Promise<PharmacyProductSearchResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `search` | query | No | `string` | Sin restricción adicional declarada | Texto a buscar en marca, genérico o código de producto | `valor-ejemplo` |
| `conceptId` | query | No | `string` | formato `uuid` | Medicamento del vademécum (medication_concept_id) | `00000000-0000-4000-8000-000000000001` |
| `pharmacyId` | query | No | `string` | formato `uuid` | Sólo lo publicado por esta farmacia (carril A, H5) | `00000000-0000-4000-8000-000000000001` |
| `managed` | query | No | `string` | valores: `true`, `false` | P47: con `true` (y `pharmacyId`) lista TODO el catálogo de esa farmacia —borradores y retirados— con estado, existencias, umbral e imágenes. Sólo su personal; cualquier otro, 404. | `true` |
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
GET /pharmacy/products?search=valor-ejemplo&conceptId=00000000-0000-4000-8000-000000000001&pharmacyId=00000000-0000-4000-8000-000000000001&managed=true&limit=1 HTTP/1.1
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
| 504 | Consulta completada correctamente. | `Promise<PharmacyProductSearchResponseDto>` | No |

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
      "requiresPrescription": {},
      "unitPrice": "12.50",
      "currency": "BOB",
      "inStock": true,
      "category": "valor-ejemplo",
      "description": "Texto descriptivo de ejemplo",
      "status": "PUBLISHED",
      "stock": 1,
      "minStock": 1,
      "outOfStockDeclared": true,
      "imageFileIds": [
        "00000000-0000-4000-8000-000000000001"
      ]
    }
  ],
  "limit": 1,
  "truncated": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<PharmacyProductReadDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","pharmacyId":"00000000-0000-4000-8000-000000000001","pharmacyName":"Nombre de ejemplo","productCode":"CODIGO_EJEMPLO","brandName":{},"genericName":{},"strengthText":{},"packageSizeText":{},"dosageForm":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"medication":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"requiresPrescription":{},"unitPrice":"12.50","currency":"BOB","inStock":true,"category":"valor-ejemplo","description":"Texto descriptivo de ejemplo","status":"PUBLISHED","stock":1,"minStock":1,"outOfStockDeclared":true,"imageFileIds":["00000000-0000-4000-8000-000000000001"]}]` |
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
| `items[].unitPrice` | No | `string` | admite null | Precio vigente (lista `CATALOGO`, o el menor de sus listas públicas de mostrador). Texto exacto; `null` = sin precio. | `12.50` |
| `items[].currency` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `BOB` |
| `items[].inStock` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `items[].category` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].description` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `items[].status` | No | `string` | valores: `PUBLISHED`, `DRAFT`, `WITHDRAWN` | Sin descripción específica en el contrato OpenAPI. | `PUBLISHED` |
| `items[].stock` | No | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `items[].minStock` | No | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `items[].outOfStockDeclared` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `items[].imageFileIds` | No | `array<string>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `["00000000-0000-4000-8000-000000000001"]` |
| `limit` | Sí | `number` | Sin restricción adicional declarada | Tope aplicado al listado | `1` |
| `truncated` | Sí | `boolean` | Sin restricción adicional declarada | true si quedaron productos fuera del tope. Se declara, no se calla | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Se requiere pertenecer a la organización, o ser administrador de la plataforma | Excepción explícita en src/modules/directory/services/tenant-administration.service.ts |
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

## 33. GET /pharmacy/sites

- **Módulo:** `pharmacy`
- **Etiqueta OpenAPI:** `pharmacy-directory`
- **Nombre:** Listar sedes publicadas, sueltas
- **Operation ID:** `PharmacyReadController_listSites`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyReadController.listSites](../../src/modules/pharmacy/controllers/pharmacy-read.controller.ts)

### Descripción de negocio

Listar sedes publicadas, sueltas. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Carril A (H4): las sedes publicadas, sueltas — lo que «elegir farmacia» necesita antes de que la persona haya buscado nada. Declarada **antes** de `sites/:siteId/prices` a propósito: aunque los segmentos no colisionan (uno es `/pharmacy/sites`, el otro `/pharmacy/sites/:siteId/prices`), el orden documenta la intención y evita que una futura ruta `sites/:algo` la tape sin que se note.

### Descripción del sistema

NestJS resuelve `GET /pharmacy/sites` en `PharmacyReadController_listSites`. El controlador delega en `PharmacyReadService.listSites`. No recibe body. El tipo de retorno estático es `Promise<PharmacySiteListResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `search` | query | No | `string` | Sin restricción adicional declarada | Texto a buscar en el nombre de la farmacia o la sede | `valor-ejemplo` |
| `lat` | query | No | `string` | Sin restricción adicional declarada | Latitud WGS84 desde donde medir distancia (va con lng) | `valor-ejemplo` |
| `lng` | query | No | `string` | Sin restricción adicional declarada | Longitud WGS84 desde donde medir distancia (va con lat) | `valor-ejemplo` |
| `limit` | query | No | `number` | Sin restricción adicional declarada | Tope del listado (por defecto 50) | `1` |
| `openNow` | query | No | `string` | valores: `true`, `false` | P34: `true` deja sólo las sedes abiertas ahora (24 h declaradas o de turno vigente) | `true` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /pharmacy/sites HTTP/1.1
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
GET /pharmacy/sites?search=valor-ejemplo&lat=valor-ejemplo&lng=valor-ejemplo&limit=1&openNow=true HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PharmacySiteListResponseDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<PharmacySiteListResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<PharmacySiteListResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<PharmacySiteListResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<PharmacySiteListResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<PharmacySiteListResponseDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<PharmacySiteListResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PharmacySiteListResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "siteId": "00000000-0000-4000-8000-000000000001",
      "siteName": "Nombre de ejemplo",
      "pharmacyId": "00000000-0000-4000-8000-000000000001",
      "pharmacyName": "Nombre de ejemplo",
      "addressText": {},
      "latitude": {},
      "longitude": {},
      "distanceKm": {},
      "homeDeliveryAvailable": {},
      "pickupAvailable": {},
      "productCount": 1,
      "open24h": true,
      "onCallUntil": "2026-07-31T12:00:00.000Z"
    }
  ],
  "count": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<PharmacySiteListItemDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"siteId":"00000000-0000-4000-8000-000000000001","siteName":"Nombre de ejemplo","pharmacyId":"00000000-0000-4000-8000-000000000001","pharmacyName":"Nombre de ejemplo","addressText":{},"latitude":{},"longitude":{},"distanceKm":{},"homeDeliveryAvailable":{},"pickupAvailable":{},"productCount":1,"open24h":true,"onCallUntil":"2026-07-31T12:00:00.000Z"}]` |
| `items[].siteId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].siteName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].pharmacyId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].pharmacyName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].addressText` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `items[].latitude` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `items[].longitude` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `items[].distanceKm` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `items[].homeDeliveryAvailable` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `items[].pickupAvailable` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `items[].productCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `items[].open24h` | No | `boolean` | admite null | Sin descripción específica en el contrato OpenAPI. | `true` |
| `items[].onCallUntil` | No | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |

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
  "path": "/pharmacy/sites"
}
```

---

## 34. GET /pharmacy/sites/{siteId}/prices

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
| 504 | Consulta completada correctamente. | `Promise<PharmacySitePricesResponseDto>` | No |

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
      "requiresPrescription": {},
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
| `items` | Sí | `array<PharmacySitePriceDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"productId":"00000000-0000-4000-8000-000000000001","productCode":"CODIGO_EJEMPLO","brandName":{},"genericName":{},"strengthText":{},"packageSizeText":{},"medication":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"requiresPrescription":{},"priceListId":"00000000-0000-4000-8000-000000000001","priceListCode":"CODIGO_EJEMPLO","currency":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"unitAmount":"valor-ejemplo","taxAmount":{},"patientAmount":{},"minimumQuantity":{},"effectiveFrom":"2026-07-31T12:00:00.000Z","effectiveTo":"2026-07-31T12:00:00.000Z"}]` |
| `items[].productId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].productCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].brandName` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `items[].genericName` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `items[].strengthText` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `items[].packageSizeText` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `items[].medication` | No | `PharmacyConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `items[].medication.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].medication.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].requiresPrescription` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
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

## 35. GET /public/medications

- **Módulo:** `pharmacy`
- **Etiqueta OpenAPI:** `pharmacy-public`
- **Nombre:** Vitrina pública de medicamentos con disponibilidad por farmacia
- **Operation ID:** `PharmacyPublicController_listMedications`
- **Autenticación:** Pública
- **Implementación:** [PharmacyPublicController.listMedications](../../src/modules/pharmacy/controllers/pharmacy-public.controller.ts)

### Descripción de negocio

Vitrina pública de medicamentos con disponibilidad por farmacia. Operación pública; no requiere JWT. Todas las respuestas de error usan el envelope ErrorResponse.

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
| 429 | Consulta completada correctamente. | `Promise<PublicMedicationPageDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<PublicMedicationPageDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<PublicMedicationPageDto>` | No |

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

## 36. GET /public/medications/{conceptId}/availability

- **Módulo:** `pharmacy`
- **Etiqueta OpenAPI:** `pharmacy-public`
- **Nombre:** Farmacias que publican un medicamento, con precio y distancia
- **Operation ID:** `PharmacyPublicController_getAvailability`
- **Autenticación:** Pública
- **Implementación:** [PharmacyPublicController.getAvailability](../../src/modules/pharmacy/controllers/pharmacy-public.controller.ts)

### Descripción de negocio

Farmacias que publican un medicamento, con precio y distancia. Operación pública; no requiere JWT. Todas las respuestas de error usan el envelope ErrorResponse.

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
| 404 | Consulta completada correctamente. | `Promise<PublicMedicationAvailabilityDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<PublicMedicationAvailabilityDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<PublicMedicationAvailabilityDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<PublicMedicationAvailabilityDto>` | No |

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

## 37. GET /public/pharmacies/open-now

- **Módulo:** `pharmacy`
- **Etiqueta OpenAPI:** `pharmacy-public`
- **Nombre:** Farmacias abiertas ahora: 24 h o de turno vigente
- **Operation ID:** `PharmacyPublicController_openNow`
- **Autenticación:** Pública
- **Implementación:** [PharmacyPublicController.openNow](../../src/modules/pharmacy/controllers/pharmacy-public.controller.ts)

### Descripción de negocio

Farmacias abiertas ahora: 24 h o de turno vigente. Operación pública; no requiere JWT. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: P34: qué farmacias están abiertas **ahora** — 24 h declaradas o de turno vigente —, sin sesión. Un turno vencido o cancelado nunca aparece (lo filtra la consulta, no el cliente). `asOf`/`asOfLocal` dicen con qué instante se decidió, en UTC y en la hora de Bolivia (`America/La_Paz`, UTC−4 todo el año).

### Descripción del sistema

NestJS resuelve `GET /public/pharmacies/open-now` en `PharmacyPublicController_openNow`. El controlador delega en `PharmacyOpeningHoursService.openNow`. No recibe body. El tipo de retorno estático es `Promise<PublicOpenNowPageDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `mode` | query | No | `string` | valores: `any`, `24h`, `on-call` | `any` (por defecto): 24 h o de turno · `24h`: sólo 24 h · `on-call`: sólo de turno | `any` |
| `city` | query | No | `string` | Sin restricción adicional declarada | Ciudad de la sede (sin distinguir mayúsculas) | `valor-ejemplo` |
| `lat` | query | No | `string` | Sin restricción adicional declarada | Latitud WGS84 para ordenar por distancia (va con lng) | `valor-ejemplo` |
| `lng` | query | No | `string` | Sin restricción adicional declarada | Longitud WGS84 para ordenar por distancia (va con lat) | `valor-ejemplo` |
| `cursor` | query | No | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |
| `limit` | query | No | `string` | Sin restricción adicional declarada | Tamaño de página (por defecto 20, máx. 50) | `valor-ejemplo` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /public/pharmacies/open-now HTTP/1.1
Host: localhost:3000
```

### Restricciones a considerar

- Endpoint público: no exige JWT según el contrato y `@Public()` del código.
- Rate limit particular: `Throttle(PUBLIC_RATE_LIMIT)`.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /public/pharmacies/open-now?mode=any&city=valor-ejemplo&lat=valor-ejemplo&lng=valor-ejemplo&cursor=valor-ejemplo&limit=valor-ejemplo HTTP/1.1
Host: localhost:3000
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PublicOpenNowPageDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<PublicOpenNowPageDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<PublicOpenNowPageDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<PublicOpenNowPageDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<PublicOpenNowPageDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PublicOpenNowPageDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "siteId": "00000000-0000-4000-8000-000000000001",
      "siteName": "Nombre de ejemplo",
      "pharmacyName": "Nombre de ejemplo",
      "pharmacySlug": "valor-ejemplo",
      "addressText": "valor-ejemplo",
      "city": "valor-ejemplo",
      "latitude": 1,
      "longitude": 1,
      "distanceKm": 1,
      "open24h": true,
      "onCall": {
        "startsAt": "2026-07-31T12:00:00.000Z",
        "endsAt": "2026-07-31T12:00:00.000Z",
        "endsAtLocal": "2026-10-27T08:00:00-04:00",
        "source": "PHARMACY"
      },
      "timeZone": "America/La_Paz"
    }
  ],
  "nextCursor": "valor-ejemplo",
  "asOf": "2026-07-31T12:00:00.000Z",
  "asOfLocal": "2026-10-26T03:00:00-04:00",
  "timeZone": "America/La_Paz"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<PublicOpenNowItemDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"siteId":"00000000-0000-4000-8000-000000000001","siteName":"Nombre de ejemplo","pharmacyName":"Nombre de ejemplo","pharmacySlug":"valor-ejemplo","addressText":"valor-ejemplo","city":"valor-ejemplo","latitude":1,"longitude":1,"distanceKm":1,"open24h":true,"onCall":{"startsAt":"2026-07-31T12:00:00.000Z","endsAt":"2026-07-31T12:00:00.000Z","endsAtLocal":"2026-10-27T08:00:00-04:00","source":"PHARMACY"},"timeZone":"America/La_Paz"}]` |
| `items[].siteId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].siteName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].pharmacyName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].pharmacySlug` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].addressText` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].city` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].latitude` | No | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `items[].longitude` | No | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `items[].distanceKm` | No | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `items[].open24h` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `items[].onCall` | No | `PublicOnCallNowDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"startsAt":"2026-07-31T12:00:00.000Z","endsAt":"2026-07-31T12:00:00.000Z","endsAtLocal":"2026-10-27T08:00:00-04:00","source":"PHARMACY"}` |
| `items[].onCall.startsAt` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `items[].onCall.endsAt` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `items[].onCall.endsAtLocal` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `2026-10-27T08:00:00-04:00` |
| `items[].onCall.source` | No | `string` | valores: `PHARMACY`, `PLATFORM` | Sin descripción específica en el contrato OpenAPI. | `PHARMACY` |
| `items[].timeZone` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `America/La_Paz` |
| `nextCursor` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `asOf` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `asOfLocal` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `2026-10-26T03:00:00-04:00` |
| `timeZone` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `America/La_Paz` |

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
  "path": "/public/pharmacies/open-now"
}
```

---

