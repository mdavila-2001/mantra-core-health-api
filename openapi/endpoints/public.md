<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `public`

Referencia exhaustiva de 4 operación(es) del módulo `public`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `public-catalog`
- **Controladores:** `PublicCatalogController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [POST /public/profiles/f/{slug}/branch-availability](#1-post-public-profiles-f-slug-branch-availability) — Disponibilidad de una receta en las sucursales de una farmacia
2. [GET /public/profiles/f/{slug}/branches](#2-get-public-profiles-f-slug-branches) — Sucursales de una farmacia, desde su ficha pública
3. [GET /public/profiles/f/{slug}/products](#3-get-public-profiles-f-slug-products) — Productos que ofrece una farmacia, desde su ficha pública
4. [GET /public/profiles/o/{slug}/services](#4-get-public-profiles-o-slug-services) — Servicios que ofrece una organización, desde su ficha pública

---

## 1. POST /public/profiles/f/{slug}/branch-availability

- **Módulo:** `public`
- **Etiqueta OpenAPI:** `public-catalog`
- **Nombre:** Disponibilidad de una receta en las sucursales de una farmacia
- **Operation ID:** `PublicCatalogController_pharmacyBranchAvailability`
- **Autenticación:** Pública
- **Implementación:** [PublicCatalogController.pharmacyBranchAvailability](../../src/modules/public/presentation/controllers/public-catalog.controller.ts)

### Descripción de negocio

Sin sesión. Cuerpo { items: string[] (1-20, texto libre), lat?, lng? }. Sólo cuenta lo que está en stock; un agotado es faltante. Orden del servidor: primero las completas, después la más cercana en línea recta. No guarda nada. Un slug inexistente, oculto o de otro tipo responde 404.

Contexto declarado en el controlador: P37 — qué sucursal tiene lo de una receta escrita a mano. `POST` aunque sea una lectura: los renglones de una receta son datos de salud y en la URL quedarían en historiales, proxies y logs de acceso. Nada se guarda. Responde 200, no 201: no crea ningún recurso.

### Descripción del sistema

NestJS resuelve `POST /public/profiles/f/{slug}/branch-availability` en `PublicCatalogController_pharmacyBranchAvailability`. El controlador delega en `PublicPharmacyBranchesService.availability`. Valida el body como `PublicPrescriptionAvailabilityDto` y consume `application/json`. El tipo de retorno estático es `Promise<PublicBranchAvailabilityResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `slug` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `PublicPrescriptionAvailabilityDto`; los campos opcionales se omiten.

```http
POST /public/profiles/f/valor-ejemplo/branch-availability HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "items": [
    "Paracetamol 500 mg",
    "Losartán"
  ]
}
```

### Restricciones a considerar

- Endpoint público: no exige JWT según el contrato y `@Public()` del código.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit particular: `Throttle(PUBLIC_RATE_LIMIT)`.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<string>` | longitud máxima PRESCRIPTION_ITEM_MAX_LENGTH; mínimo 1 elemento(s); máximo 20 elemento(s) | Texto libre: una receta de papel no trae ids de producto. Vacíos y repetidos (sin tildes) se ignoran. | `["Paracetamol 500 mg","Losartán"]` |
| `lat` | No | `number` | mínimo -90; máximo 90 | Sin descripción específica en el contrato OpenAPI. | `-17.78` |
| `lng` | No | `number` | mínimo -180; máximo 180 | Sin descripción específica en el contrato OpenAPI. | `-63.18` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /public/profiles/f/valor-ejemplo/branch-availability HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "items": [
    "Paracetamol 500 mg",
    "Losartán"
  ],
  "lat": -17.78,
  "lng": -63.18
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PublicBranchAvailabilityResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<PublicBranchAvailabilityResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PublicBranchAvailabilityResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PublicBranchAvailabilityResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<PublicBranchAvailabilityResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PublicBranchAvailabilityResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<PublicBranchAvailabilityResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PublicBranchAvailabilityResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PublicBranchAvailabilityResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PublicBranchAvailabilityResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<PublicBranchAvailabilityResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PublicBranchAvailabilityResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "branch": {
        "id": "00000000-0000-4000-8000-000000000001",
        "slug": "valor-ejemplo",
        "name": "Nombre de ejemplo",
        "siteName": "Nombre de ejemplo",
        "city": "valor-ejemplo",
        "addressText": "valor-ejemplo",
        "phone": "+59170000000",
        "openingHours": "valor-ejemplo",
        "description": "Texto descriptivo de ejemplo",
        "locationUrl": "valor-ejemplo",
        "location": {
          "lat": 1,
          "lng": 1
        },
        "locationAccuracy": "valor-ejemplo",
        "isCurrent": true
      },
      "matches": [
        {
          "term": "valor-ejemplo",
          "genericName": "Nombre de ejemplo",
          "brandName": "Nombre de ejemplo",
          "presentation": "valor-ejemplo",
          "price": 4.5,
          "currency": "BOB"
        }
      ],
      "missing": [
        "valor-ejemplo"
      ],
      "complete": true,
      "totalAmount": 12.5,
      "currency": "BOB",
      "distanceKm": 1
    }
  ],
  "count": 1,
  "generatedAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<PublicBranchAvailabilityDto>` | Sin restricción adicional declarada | Ya ordenadas: completas primero, después la más cercana. | `[{"branch":{"id":"00000000-0000-4000-8000-000000000001","slug":"valor-ejemplo","name":"Nombre de ejemplo","siteName":"Nombre de ejemplo","city":"valor-ejemplo","addressText":"valor-ejemplo","phone":"+59170000000","openingHours":"valor-ejemplo","description":"Texto descriptivo de ejemplo","locationUrl":"valor-ejemplo","location":{"lat":1,"lng":1},"locationAccuracy":"valor-ejemplo","isCurrent":true},"matches":[{"term":"valor-ejemplo","genericName":"Nombre de ejemplo","brandName":"Nombre de ejemplo","presentation":"valor-ejemplo","price":4.5,"currency":"BOB"}],"missing":["valor-ejemplo"],"complete":true,"totalAmount":12.5,"currency":"BOB","distanceKm":1}]` |
| `items[].branch` | Sí | `PublicPharmacyBranchDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"id":"00000000-0000-4000-8000-000000000001","slug":"valor-ejemplo","name":"Nombre de ejemplo","siteName":"Nombre de ejemplo","city":"valor-ejemplo","addressText":"valor-ejemplo","phone":"+59170000000","openingHours":"valor-ejemplo","description":"Texto descriptivo de ejemplo","locationUrl":"valor-ejemplo","location":{"lat":1,"lng":1},"locationAccuracy":"valor-ejemplo","isCurrent":true}` |
| `items[].branch.id` | Sí | `string` | formato `uuid` | La sede (`pharmacy.pharmacy_sites`): la clave de la sucursal. | `00000000-0000-4000-8000-000000000001` |
| `items[].branch.slug` | Sí | `string` | Sin restricción adicional declarada | El slug de la ficha pública; todas las sedes de un tenant lo comparten. | `valor-ejemplo` |
| `items[].branch.name` | Sí | `string` | Sin restricción adicional declarada | «Farmacorp · San Miguel». | `Nombre de ejemplo` |
| `items[].branch.siteName` | Sí | `string` | Sin restricción adicional declarada | Sólo la sucursal («San Miguel»). | `Nombre de ejemplo` |
| `items[].branch.city` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].branch.addressText` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].branch.phone` | Sí | `string` | admite null | Siempre `null` por ahora: la sede no tiene teléfono en el modelo. | `+59170000000` |
| `items[].branch.openingHours` | Sí | `string` | admite null | Siempre `null` por ahora: no hay horario estructurado; ver `description`. | `valor-ejemplo` |
| `items[].branch.description` | Sí | `string` | admite null | Lo que la cadena escribió de esa sucursal (horario, piso…), P54. | `Texto descriptivo de ejemplo` |
| `items[].branch.locationUrl` | Sí | `string` | admite null | Enlace de mapa `http(s)` que pegó la cadena, P54. | `valor-ejemplo` |
| `items[].branch.location` | Sí | `PublicGeoPointDto` | Sin restricción adicional declarada | Sin punto no hay pin ni distancia. | `{"lat":1,"lng":1}` |
| `items[].branch.location.lat` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `items[].branch.location.lng` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `items[].branch.locationAccuracy` | Sí | `string` | admite null | Siempre `null` por ahora: el modelo no guarda la precisión del punto. | `valor-ejemplo` |
| `items[].branch.isCurrent` | Sí | `boolean` | Sin restricción adicional declarada | `true` sólo si la cadena tiene una única sucursal: es la de la ficha. | `true` |
| `items[].matches` | Sí | `array<PublicBranchMatchDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"term":"valor-ejemplo","genericName":"Nombre de ejemplo","brandName":"Nombre de ejemplo","presentation":"valor-ejemplo","price":4.5,"currency":"BOB"}]` |
| `items[].matches[].term` | Sí | `string` | Sin restricción adicional declarada | Lo que la persona escribió. | `valor-ejemplo` |
| `items[].matches[].genericName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].matches[].brandName` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].matches[].presentation` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].matches[].price` | Sí | `string` | admite null | Texto exacto; `null` si no hay precio publicado. | `4.5` |
| `items[].matches[].currency` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `BOB` |
| `items[].missing` | Sí | `array<string>` | Sin restricción adicional declarada | Los renglones que no tiene o tiene agotados. | `["valor-ejemplo"]` |
| `items[].complete` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `items[].totalAmount` | Sí | `string` | admite null | Suma exacta de lo encontrado; `null` si no hay nada, falta un precio o mezclan monedas. | `12.5` |
| `items[].currency` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `BOB` |
| `items[].distanceKm` | Sí | `number` | admite null | En línea recta, una decimal; `null` sin ubicación de origen o sin punto. | `1` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `generatedAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 404 | `NOT_FOUND` | No encontrado | Excepción explícita en src/modules/public/application/services/public-pharmacy-branches.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se excede el límite particular Throttle(PUBLIC_RATE_LIMIT). | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/public/profiles/f/{slug}/branch-availability"
}
```

---

## 2. GET /public/profiles/f/{slug}/branches

- **Módulo:** `public`
- **Etiqueta OpenAPI:** `public-catalog`
- **Nombre:** Sucursales de una farmacia, desde su ficha pública
- **Operation ID:** `PublicCatalogController_pharmacyBranches`
- **Autenticación:** Pública
- **Implementación:** [PublicCatalogController.pharmacyBranches](../../src/modules/public/presentation/controllers/public-catalog.controller.ts)

### Descripción de negocio

Sin sesión. Sedes activas de las farmacias activas y verificadas del tenant dueño de la ficha, por ciudad y nombre, con su punto si lo tiene. Un slug inexistente, oculto o de otro tipo responde 404.

Contexto declarado en el controlador: P37 — las sucursales de la farmacia del slug. Una farmacia con una sola sede devuelve una, con `isCurrent: true`; una sin sedes publicadas devuelve la lista vacía (no 404: la ficha existe).

### Descripción del sistema

NestJS resuelve `GET /public/profiles/f/{slug}/branches` en `PublicCatalogController_pharmacyBranches`. El controlador delega en `PublicPharmacyBranchesService.branches`. No recibe body. El tipo de retorno estático es `Promise<PublicPharmacyBranchPageDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `slug` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /public/profiles/f/valor-ejemplo/branches HTTP/1.1
Host: localhost:3000
```

### Restricciones a considerar

- Endpoint público: no exige JWT según el contrato y `@Public()` del código.
- Rate limit particular: `Throttle(PUBLIC_RATE_LIMIT)`.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /public/profiles/f/valor-ejemplo/branches HTTP/1.1
Host: localhost:3000
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PublicPharmacyBranchPageDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<PublicPharmacyBranchPageDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<PublicPharmacyBranchPageDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<PublicPharmacyBranchPageDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<PublicPharmacyBranchPageDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<PublicPharmacyBranchPageDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<PublicPharmacyBranchPageDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<PublicPharmacyBranchPageDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PublicPharmacyBranchPageDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "slug": "valor-ejemplo",
      "name": "Nombre de ejemplo",
      "siteName": "Nombre de ejemplo",
      "city": "valor-ejemplo",
      "addressText": "valor-ejemplo",
      "phone": "+59170000000",
      "openingHours": "valor-ejemplo",
      "description": "Texto descriptivo de ejemplo",
      "locationUrl": "valor-ejemplo",
      "location": {
        "lat": 1,
        "lng": 1
      },
      "locationAccuracy": "valor-ejemplo",
      "isCurrent": true
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
| `items` | Sí | `array<PublicPharmacyBranchDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","slug":"valor-ejemplo","name":"Nombre de ejemplo","siteName":"Nombre de ejemplo","city":"valor-ejemplo","addressText":"valor-ejemplo","phone":"+59170000000","openingHours":"valor-ejemplo","description":"Texto descriptivo de ejemplo","locationUrl":"valor-ejemplo","location":{"lat":1,"lng":1},"locationAccuracy":"valor-ejemplo","isCurrent":true}]` |
| `items[].id` | Sí | `string` | formato `uuid` | La sede (`pharmacy.pharmacy_sites`): la clave de la sucursal. | `00000000-0000-4000-8000-000000000001` |
| `items[].slug` | Sí | `string` | Sin restricción adicional declarada | El slug de la ficha pública; todas las sedes de un tenant lo comparten. | `valor-ejemplo` |
| `items[].name` | Sí | `string` | Sin restricción adicional declarada | «Farmacorp · San Miguel». | `Nombre de ejemplo` |
| `items[].siteName` | Sí | `string` | Sin restricción adicional declarada | Sólo la sucursal («San Miguel»). | `Nombre de ejemplo` |
| `items[].city` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].addressText` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].phone` | Sí | `string` | admite null | Siempre `null` por ahora: la sede no tiene teléfono en el modelo. | `+59170000000` |
| `items[].openingHours` | Sí | `string` | admite null | Siempre `null` por ahora: no hay horario estructurado; ver `description`. | `valor-ejemplo` |
| `items[].description` | Sí | `string` | admite null | Lo que la cadena escribió de esa sucursal (horario, piso…), P54. | `Texto descriptivo de ejemplo` |
| `items[].locationUrl` | Sí | `string` | admite null | Enlace de mapa `http(s)` que pegó la cadena, P54. | `valor-ejemplo` |
| `items[].location` | Sí | `PublicGeoPointDto` | Sin restricción adicional declarada | Sin punto no hay pin ni distancia. | `{"lat":1,"lng":1}` |
| `items[].location.lat` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `items[].location.lng` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `items[].locationAccuracy` | Sí | `string` | admite null | Siempre `null` por ahora: el modelo no guarda la precisión del punto. | `valor-ejemplo` |
| `items[].isCurrent` | Sí | `boolean` | Sin restricción adicional declarada | `true` sólo si la cadena tiene una única sucursal: es la de la ficha. | `true` |
| `nextCursor` | Sí | `string` | admite null | Siempre `null`: la lista entera entra en una página (tope 200). | `valor-ejemplo` |
| `totalHint` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `generatedAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 404 | `NOT_FOUND` | No encontrado | Excepción explícita en src/modules/public/application/services/public-pharmacy-branches.service.ts |
| 429 | `RATE_LIMITED` | Se excede el límite particular Throttle(PUBLIC_RATE_LIMIT). | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/public/profiles/f/{slug}/branches"
}
```

---

## 3. GET /public/profiles/f/{slug}/products

- **Módulo:** `public`
- **Etiqueta OpenAPI:** `public-catalog`
- **Nombre:** Productos que ofrece una farmacia, desde su ficha pública
- **Operation ID:** `PublicCatalogController_pharmacyProducts`
- **Autenticación:** Pública
- **Implementación:** [PublicCatalogController.pharmacyProducts](../../src/modules/public/presentation/controllers/public-catalog.controller.ts)

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
| 404 | Consulta completada correctamente. | `Promise<PublicPharmacyProductPageDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<PublicPharmacyProductPageDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<PublicPharmacyProductPageDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<PublicPharmacyProductPageDto>` | No |

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
| 404 | `NOT_FOUND` | No encontrado | Excepción explícita en src/modules/public/application/services/public-catalog.service.ts |
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

## 4. GET /public/profiles/o/{slug}/services

- **Módulo:** `public`
- **Etiqueta OpenAPI:** `public-catalog`
- **Nombre:** Servicios que ofrece una organización, desde su ficha pública
- **Operation ID:** `PublicCatalogController_organizationServices`
- **Autenticación:** Pública
- **Implementación:** [PublicCatalogController.organizationServices](../../src/modules/public/presentation/controllers/public-catalog.controller.ts)

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
| 404 | Consulta completada correctamente. | `Promise<PublicOfferedServicePageDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<PublicOfferedServicePageDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<PublicOfferedServicePageDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<PublicOfferedServicePageDto>` | No |

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
| 404 | `NOT_FOUND` | No encontrado | Excepción explícita en src/modules/public/application/services/public-catalog.service.ts |
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

