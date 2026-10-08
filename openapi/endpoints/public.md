<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `public`

Referencia exhaustiva de 2 operación(es) del módulo `public`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `public-catalog`
- **Controladores:** `PublicCatalogController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [GET /public/profiles/f/{slug}/products](#1-get-public-profiles-f-slug-products) — Productos que ofrece una farmacia, desde su ficha pública
2. [GET /public/profiles/o/{slug}/services](#2-get-public-profiles-o-slug-services) — Servicios que ofrece una organización, desde su ficha pública

---

## 1. GET /public/profiles/f/{slug}/products

- **Módulo:** `public`
- **Etiqueta OpenAPI:** `public-catalog`
- **Nombre:** Productos que ofrece una farmacia, desde su ficha pública
- **Operation ID:** `PublicCatalogController_pharmacyProducts`
- **Autenticación:** Pública
- **Implementación:** [PublicCatalogController.pharmacyProducts](../../src/modules/public/controllers/public-catalog.controller.ts)

### Descripción de negocio

Sin sesión. Marca, presentación, precio vigente de lista pública como texto (o null) y si hay stock; un agotado se lista igual. Un slug inexistente, oculto o de otro tipo responde 404.


### Descripción del sistema

NestJS resuelve `GET /public/profiles/f/{slug}/products` en `PublicCatalogController_pharmacyProducts`. El controlador delega en `PublicCatalogService.pharmacyProducts`. No recibe body. El tipo de retorno estático es `Promise<PublicPharmacyProductPageDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `slug` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |
| `cursor` | query | No | `string` | Sin restricción adicional declarada | Cursor opaco de la página anterior | `valor-ejemplo` |
| `limit` | query | No | `number` | mínimo 1; máximo 50 | Sin descripción específica en OpenAPI. | `20` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /public/profiles/f/valor-ejemplo/products HTTP/1.1
Host: localhost:3000
```

### Restricciones a considerar

- Endpoint público: no exige JWT según el contrato y `@Public()` del código.
- Rate limit particular: `Throttle(PUBLIC_RATE_LIMIT)`.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /public/profiles/f/valor-ejemplo/products?cursor=valor-ejemplo&limit=20 HTTP/1.1
Host: localhost:3000
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PublicPharmacyProductPageDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<PublicPharmacyProductPageDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<PublicPharmacyProductPageDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<PublicPharmacyProductPageDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<PublicPharmacyProductPageDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<PublicPharmacyProductPageDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<PublicPharmacyProductPageDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PublicPharmacyProductPageDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "genericName": "Nombre de ejemplo",
      "brandName": "Nombre de ejemplo",
      "presentation": "500 mg · caja x 10",
      "therapeuticGroup": "valor-ejemplo",
      "price": 12.5,
      "currency": "BOB",
      "inStock": true,
      "requiresPrescription": true
    }
  ],
  "nextCursor": "valor-ejemplo",
  "totalHint": 1,
  "generatedAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<PublicPharmacyProductDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","genericName":"Nombre de ejemplo","brandName":"Nombre de ejemplo","presentation":"500 mg · caja x 10","therapeuticGroup":"valor-ejemplo","price":12.5,"currency":"BOB","inStock":true,"requiresPrescription":true}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].genericName` | Sí | `string` | Sin restricción adicional declarada | El genérico: es por lo que busca quien lleva una receta. | `Nombre de ejemplo` |
| `items[].brandName` | Sí | `string` | admite null | La marca concreta, o `null` si vende el genérico. | `Nombre de ejemplo` |
| `items[].presentation` | Sí | `string` | admite null | Concentración y presentación publicadas, o `null`. | `500 mg · caja x 10` |
| `items[].therapeuticGroup` | Sí | `string` | admite null | Siempre `null` por ahora: el grupo terapéutico no es columna del modelo y derivarlo del ATC no está decidido. No se inventa. | `valor-ejemplo` |
| `items[].price` | Sí | `string` | admite null | Precio de esta farmacia, texto exacto. `null` = sin precio publicado. | `12.5` |
| `items[].currency` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `BOB` |
| `items[].inStock` | Sí | `boolean` | Sin restricción adicional declarada | Si lo tiene ahora. Un agotado se lista rotulado, no se esconde. | `true` |
| `items[].requiresPrescription` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `nextCursor` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `totalHint` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `generatedAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 404 | `NOT_FOUND` | No encontrado | Excepción explícita en src/modules/public/services/public-catalog.service.ts |
| 429 | `RATE_LIMITED` | Se excede el límite particular Throttle(PUBLIC_RATE_LIMIT). | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/public/profiles/f/{slug}/products"
}
```

---

## 2. GET /public/profiles/o/{slug}/services

- **Módulo:** `public`
- **Etiqueta OpenAPI:** `public-catalog`
- **Nombre:** Servicios que ofrece una organización, desde su ficha pública
- **Operation ID:** `PublicCatalogController_organizationServices`
- **Autenticación:** Pública
- **Implementación:** [PublicCatalogController.organizationServices](../../src/modules/public/controllers/public-catalog.controller.ts)

### Descripción de negocio

Sin sesión. Precio de referencia como texto, o null si no está definido. Un slug inexistente, oculto o de otro tipo responde 404.


### Descripción del sistema

NestJS resuelve `GET /public/profiles/o/{slug}/services` en `PublicCatalogController_organizationServices`. El controlador delega en `PublicCatalogService.organizationServices`. No recibe body. El tipo de retorno estático es `Promise<PublicOfferedServicePageDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `slug` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |
| `cursor` | query | No | `string` | Sin restricción adicional declarada | Cursor opaco de la página anterior | `valor-ejemplo` |
| `limit` | query | No | `number` | mínimo 1; máximo 50 | Sin descripción específica en OpenAPI. | `20` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /public/profiles/o/valor-ejemplo/services HTTP/1.1
Host: localhost:3000
```

### Restricciones a considerar

- Endpoint público: no exige JWT según el contrato y `@Public()` del código.
- Rate limit particular: `Throttle(PUBLIC_RATE_LIMIT)`.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /public/profiles/o/valor-ejemplo/services?cursor=valor-ejemplo&limit=20 HTTP/1.1
Host: localhost:3000
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PublicOfferedServicePageDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<PublicOfferedServicePageDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<PublicOfferedServicePageDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<PublicOfferedServicePageDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<PublicOfferedServicePageDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<PublicOfferedServicePageDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<PublicOfferedServicePageDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PublicOfferedServicePageDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "code": "CODIGO_EJEMPLO",
      "name": "Nombre de ejemplo",
      "description": "Texto descriptivo de ejemplo",
      "price": 150,
      "currency": "BOB",
      "isActive": true
    }
  ],
  "nextCursor": "valor-ejemplo",
  "totalHint": 1,
  "generatedAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<PublicOfferedServiceDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","description":"Texto descriptivo de ejemplo","price":150,"currency":"BOB","isActive":true}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].code` | Sí | `string` | Sin restricción adicional declarada | El código del catálogo. | `CODIGO_EJEMPLO` |
| `items[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].description` | Sí | `string` | admite null | Qué incluye, cuando la organización lo escribió. | `Texto descriptivo de ejemplo` |
| `items[].price` | Sí | `string` | admite null | Precio de referencia como texto exacto, o `null` si no hay uno definido (un `default_price` en cero es «Definí el precio», no «gratis»). | `150` |
| `items[].currency` | Sí | `string` | admite null | Código de la moneda (`BOB`), o `null` cuando no hay precio. | `BOB` |
| `items[].isActive` | Sí | `boolean` | Sin restricción adicional declarada | Un servicio dado de baja se sigue listando, rotulado. | `true` |
| `nextCursor` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `totalHint` | Sí | `number` | admite null | Sin conteo: contar todo el catálogo por pedido no se justifica. | `1` |
| `generatedAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 404 | `NOT_FOUND` | No encontrado | Excepción explícita en src/modules/public/services/public-catalog.service.ts |
| 429 | `RATE_LIMITED` | Se excede el límite particular Throttle(PUBLIC_RATE_LIMIT). | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/public/profiles/o/{slug}/services"
}
```

---

