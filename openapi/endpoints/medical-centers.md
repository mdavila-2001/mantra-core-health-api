<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `medical_centers`

Referencia exhaustiva de 2 operación(es) del módulo `medical_centers`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `medical-centers`
- **Controladores:** `MedicalCentersController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [GET /medical-centers/search](#1-get-medical-centers-search) — Buscar centros médicos por procedimientos
2. [GET /medical-centers/search/for-my-orders](#2-get-medical-centers-search-for-my-orders) — Buscar centros médicos para mis órdenes

---

## 1. GET /medical-centers/search

- **Módulo:** `medical_centers`
- **Etiqueta OpenAPI:** `medical-centers`
- **Nombre:** Buscar centros médicos por procedimientos
- **Operation ID:** `MedicalCentersController_search`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [MedicalCentersController.search](../../src/modules/medical_centers/controllers/medical-centers.controller.ts)

### Descripción de negocio

Cada sede dice si ofrece todo lo pedido (`complete`) y cuáles le faltan. Completos primero, después por distancia en línea recta desde `lat`/`lng`, después por precio total y por nombre. Solo aparecen los que publicaron precio.

Contexto declarado en el controlador: Centros que ofrecen los procedimientos pedidos, completos primero.

### Descripción del sistema

NestJS resuelve `GET /medical-centers/search` en `MedicalCentersController_search`. El controlador delega en `MedicalCentersSearchService.search`. No recibe body. El tipo de retorno estático es `Promise<MedicalCenterPageDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `lat` | query | No | `number` | mínimo -90; máximo 90 | Sin descripción específica en OpenAPI. | `1` |
| `lng` | query | No | `number` | mínimo -180; máximo 180 | Sin descripción específica en OpenAPI. | `1` |
| `includePartial` | query | No | `boolean` | Sin restricción adicional declarada | Por defecto solo los centros que ofrecen todo lo pedido (`complete: true`). | `false` |
| `procedureConceptIds` | query | Sí | `string` | Sin restricción adicional declarada | Conceptos de procedimiento separados por coma (uuid). | `1f0c5b6e-2a1d-4c3e-9b8a-7d6e5f4a3b2c,2a1b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d` |
| `specialty` | query | No | `string` | longitud máxima 120 | Sin descripción específica en OpenAPI. | `valor-ejemplo` |
| `city` | query | No | `string` | longitud máxima 120 | Sin descripción específica en OpenAPI. | `valor-ejemplo` |
| `offset` | query | No | `number` | mínimo 0 | Sin descripción específica en OpenAPI. | `1` |
| `limit` | query | No | `number` | mínimo 1; máximo 100 | Sin descripción específica en OpenAPI. | `20` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /medical-centers/search?procedureConceptIds=1f0c5b6e-2a1d-4c3e-9b8a-7d6e5f4a3b2c%2C2a1b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d HTTP/1.1
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
GET /medical-centers/search?lat=1&lng=1&includePartial=false&procedureConceptIds=1f0c5b6e-2a1d-4c3e-9b8a-7d6e5f4a3b2c%2C2a1b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d&specialty=valor-ejemplo&city=valor-ejemplo&offset=1&limit=20 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<MedicalCenterPageDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<MedicalCenterPageDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<MedicalCenterPageDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<MedicalCenterPageDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<MedicalCenterPageDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<MedicalCenterPageDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<MedicalCenterPageDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `MedicalCenterPageDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "practiceId": "00000000-0000-4000-8000-000000000001",
      "practiceSiteId": "00000000-0000-4000-8000-000000000001",
      "name": "Nombre de ejemplo",
      "addressText": "valor-ejemplo",
      "latitude": 1,
      "longitude": 1,
      "distanceKm": 1,
      "complete": true,
      "missingProcedureConceptIds": [
        "00000000-0000-4000-8000-000000000001"
      ],
      "offers": [
        {
          "procedureConceptId": "00000000-0000-4000-8000-000000000001",
          "procedureDisplay": "valor-ejemplo",
          "price": 1,
          "currencyConceptId": "00000000-0000-4000-8000-000000000001",
          "referencePrice": 1,
          "referenceUnit": "UMA",
          "overMargin": true
        }
      ],
      "totalPrice": 1,
      "practitionerWorksHere": true,
      "suggestedByPractitioner": true
    }
  ],
  "total": 1,
  "limit": 1,
  "offset": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<MedicalCenterItemDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"practiceId":"00000000-0000-4000-8000-000000000001","practiceSiteId":"00000000-0000-4000-8000-000000000001","name":"Nombre de ejemplo","addressText":"valor-ejemplo","latitude":1,"longitude":1,"distanceKm":1,"complete":true,"missingProcedureConceptIds":["00000000-0000-4000-8000-000000000001"],"offers":[{"procedureConceptId":"00000000-0000-4000-8000-000000000001","procedureDisplay":"valor-ejemplo","price":1,"currencyConceptId":"00000000-0000-4000-8000-000000000001","referencePrice":1,"referenceUnit":"UMA","overMargin":true}],"totalPrice":1,"practitionerWorksHere":true,"suggestedByPractitioner":true}]` |
| `items[].practiceId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].practiceSiteId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].addressText` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].latitude` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `items[].longitude` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `items[].distanceKm` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `items[].complete` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `items[].missingProcedureConceptIds` | Sí | `array<string>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `["00000000-0000-4000-8000-000000000001"]` |
| `items[].offers` | Sí | `array<MedicalCenterOfferDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"procedureConceptId":"00000000-0000-4000-8000-000000000001","procedureDisplay":"valor-ejemplo","price":1,"currencyConceptId":"00000000-0000-4000-8000-000000000001","referencePrice":1,"referenceUnit":"UMA","overMargin":true}]` |
| `items[].offers[].procedureConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].offers[].procedureDisplay` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].offers[].price` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `items[].offers[].currencyConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].offers[].referencePrice` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `items[].offers[].referenceUnit` | Sí | `string` | valores: `UMA`, `USD`; admite null | Sin descripción específica en el contrato OpenAPI. | `UMA` |
| `items[].offers[].overMargin` | Sí | `boolean` | admite null | Sin descripción específica en el contrato OpenAPI. | `true` |
| `items[].totalPrice` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `items[].practitionerWorksHere` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `items[].suggestedByPractitioner` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `total` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `limit` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `offset` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |

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
  "path": "/medical-centers/search"
}
```

---

## 2. GET /medical-centers/search/for-my-orders

- **Módulo:** `medical_centers`
- **Etiqueta OpenAPI:** `medical-centers`
- **Nombre:** Buscar centros médicos para mis órdenes
- **Operation ID:** `MedicalCentersController_searchForMyOrders`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [MedicalCentersController.searchForMyOrders](../../src/modules/medical_centers/controllers/medical-centers.controller.ts)

### Descripción de negocio

Los procedimientos salen de las órdenes. Marca si el médico trabaja en la sede y si la sugirió, sin cambiar qué sedes aparecen ni su orden. Una orden ajena responde 404.

Contexto declarado en el controlador: Lo mismo, con los procedimientos tomados de las órdenes del titular.

### Descripción del sistema

NestJS resuelve `GET /medical-centers/search/for-my-orders` en `MedicalCentersController_searchForMyOrders`. El controlador delega en `MedicalCentersForMyOrdersService.searchForOrders`. No recibe body. El tipo de retorno estático es `Promise<MedicalCenterPageDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `lat` | query | No | `number` | mínimo -90; máximo 90 | Sin descripción específica en OpenAPI. | `1` |
| `lng` | query | No | `number` | mínimo -180; máximo 180 | Sin descripción específica en OpenAPI. | `1` |
| `includePartial` | query | No | `boolean` | Sin restricción adicional declarada | Por defecto solo los centros que ofrecen todo lo pedido (`complete: true`). | `false` |
| `serviceRequestIds` | query | Sí | `string` | Sin restricción adicional declarada | Ids de órdenes de servicio del titular, separados por coma. | `valor-ejemplo` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /medical-centers/search/for-my-orders?serviceRequestIds=valor-ejemplo HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PATIENT`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /medical-centers/search/for-my-orders?lat=1&lng=1&includePartial=false&serviceRequestIds=valor-ejemplo HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<MedicalCenterPageDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<MedicalCenterPageDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<MedicalCenterPageDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<MedicalCenterPageDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<MedicalCenterPageDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<MedicalCenterPageDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<MedicalCenterPageDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `MedicalCenterPageDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "practiceId": "00000000-0000-4000-8000-000000000001",
      "practiceSiteId": "00000000-0000-4000-8000-000000000001",
      "name": "Nombre de ejemplo",
      "addressText": "valor-ejemplo",
      "latitude": 1,
      "longitude": 1,
      "distanceKm": 1,
      "complete": true,
      "missingProcedureConceptIds": [
        "00000000-0000-4000-8000-000000000001"
      ],
      "offers": [
        {
          "procedureConceptId": "00000000-0000-4000-8000-000000000001",
          "procedureDisplay": "valor-ejemplo",
          "price": 1,
          "currencyConceptId": "00000000-0000-4000-8000-000000000001",
          "referencePrice": 1,
          "referenceUnit": "UMA",
          "overMargin": true
        }
      ],
      "totalPrice": 1,
      "practitionerWorksHere": true,
      "suggestedByPractitioner": true
    }
  ],
  "total": 1,
  "limit": 1,
  "offset": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<MedicalCenterItemDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"practiceId":"00000000-0000-4000-8000-000000000001","practiceSiteId":"00000000-0000-4000-8000-000000000001","name":"Nombre de ejemplo","addressText":"valor-ejemplo","latitude":1,"longitude":1,"distanceKm":1,"complete":true,"missingProcedureConceptIds":["00000000-0000-4000-8000-000000000001"],"offers":[{"procedureConceptId":"00000000-0000-4000-8000-000000000001","procedureDisplay":"valor-ejemplo","price":1,"currencyConceptId":"00000000-0000-4000-8000-000000000001","referencePrice":1,"referenceUnit":"UMA","overMargin":true}],"totalPrice":1,"practitionerWorksHere":true,"suggestedByPractitioner":true}]` |
| `items[].practiceId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].practiceSiteId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].addressText` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].latitude` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `items[].longitude` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `items[].distanceKm` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `items[].complete` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `items[].missingProcedureConceptIds` | Sí | `array<string>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `["00000000-0000-4000-8000-000000000001"]` |
| `items[].offers` | Sí | `array<MedicalCenterOfferDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"procedureConceptId":"00000000-0000-4000-8000-000000000001","procedureDisplay":"valor-ejemplo","price":1,"currencyConceptId":"00000000-0000-4000-8000-000000000001","referencePrice":1,"referenceUnit":"UMA","overMargin":true}]` |
| `items[].offers[].procedureConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].offers[].procedureDisplay` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].offers[].price` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `items[].offers[].currencyConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].offers[].referencePrice` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `items[].offers[].referenceUnit` | Sí | `string` | valores: `UMA`, `USD`; admite null | Sin descripción específica en el contrato OpenAPI. | `UMA` |
| `items[].offers[].overMargin` | Sí | `boolean` | admite null | Sin descripción específica en el contrato OpenAPI. | `true` |
| `items[].totalPrice` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `items[].practitionerWorksHere` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `items[].suggestedByPractitioner` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `total` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `limit` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `offset` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PATIENT. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Orden no encontrada | Excepción explícita en src/modules/medical_centers/services/medical-centers-for-my-orders.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/medical-centers/search/for-my-orders"
}
```

---

