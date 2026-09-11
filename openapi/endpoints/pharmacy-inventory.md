<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `pharmacy_inventory`

Referencia exhaustiva de 29 operación(es) del módulo `pharmacy_inventory`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `pharmacy-inventory`, `pharmacy-inventory-directory`, `pharmacy-inventory-internal`, `pharmacy-orders`
- **Controladores:** `PharmacyDispensingController`, `PharmacyInventoryController`, `PharmacyInventoryInternalController`, `PharmacyInventoryReadController`, `PharmacyOrdersController`, `PharmacyProcurementController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [POST /internal/inventory-sync-batches](#1-post-internal-inventory-sync-batches) — Ingerir un lote de sincronización ERP
2. [POST /internal/inventory-sync/{batchId}/reconcile](#2-post-internal-inventory-sync-batchid-reconcile) — Conciliar lote de sincronización externa (UC-25-12)
3. [POST /internal/reservations/expire](#3-post-internal-reservations-expire) — Liberar reservas y pedidos vencidos (UC-25-05)
4. [GET /pharmacy-inventory/availability](#4-get-pharmacy-inventory-availability) — Consultar qué sedes pueden surtir un conjunto de productos
5. [GET /pharmacy-inventory/sites/{siteId}/stock](#5-get-pharmacy-inventory-sites-siteid-stock) — Consultar el stock disponible de una sede
6. [POST /pharmacy/{pharmacyId}/dispensations](#6-post-pharmacy-pharmacyid-dispensations) — Dispensar una prescripción a un paciente (UC-25-03)
7. [POST /pharmacy/{pharmacyId}/goods-receipts](#7-post-pharmacy-pharmacyid-goods-receipts) — Recepcionar mercancía por lote (UC-25-02)
8. [POST /pharmacy/{pharmacyId}/purchase-orders](#8-post-pharmacy-pharmacyid-purchase-orders) — Emitir una orden de compra a proveedor (UC-25-01)
9. [POST /pharmacy/{pharmacyId}/reservations](#9-post-pharmacy-pharmacyid-reservations) — Reservar stock para una prescripción (UC-25-04)
10. [POST /pharmacy/{pharmacyId}/suppliers](#10-post-pharmacy-pharmacyid-suppliers) — Registrar un proveedor de farmacia
11. [POST /pharmacy/{pharmacyId}/transfers](#11-post-pharmacy-pharmacyid-transfers) — Transferir stock entre ubicaciones (UC-25-10)
12. [POST /pharmacy/{siteId}/count-sessions](#12-post-pharmacy-siteid-count-sessions) — Iniciar y congelar una sesión de conteo (UC-25-06)
13. [POST /pharmacy/{siteId}/inventory-locations](#13-post-pharmacy-siteid-inventory-locations) — Crear una ubicación de inventario
14. [POST /pharmacy/count-sessions/{id}/approve](#14-post-pharmacy-count-sessions-id-approve) — Aprobar conteo y ajustar ledger por varianza (UC-25-07)
15. [POST /pharmacy/dispensations/{id}/reverse](#15-post-pharmacy-dispensations-id-reverse) — Reversar una dispensación (UC-25-11)
16. [GET /pharmacy/orders](#16-get-pharmacy-orders) — Bandeja de pedidos de las farmacias del tenant (FAR-E2)
17. [POST /pharmacy/orders](#17-post-pharmacy-orders) — Crear un pedido de farmacia (FAR-E1)
18. [GET /pharmacy/orders/{id}](#18-get-pharmacy-orders-id) — Consultar un pedido de farmacia (FAR-E1)
19. [POST /pharmacy/orders/{id}/accept-substitutions](#19-post-pharmacy-orders-id-accept-substitutions) — Aceptar los genéricos propuestos (paciente)
20. [POST /pharmacy/orders/{id}/cancel](#20-post-pharmacy-orders-id-cancel) — Cancelar un pedido de farmacia (FAR-E1)
21. [POST /pharmacy/orders/{id}/confirm](#21-post-pharmacy-orders-id-confirm) — Confirmar el pedido (FAR-E2)
22. [POST /pharmacy/orders/{id}/dispense](#22-post-pharmacy-orders-id-dispense) — Dispensar el pedido en el mostrador (FAR-E3)
23. [POST /pharmacy/orders/{id}/prefer-original](#23-post-pharmacy-orders-id-prefer-original) — Preferir los productos originales (paciente)
24. [POST /pharmacy/orders/{id}/ready](#24-post-pharmacy-orders-id-ready) — Marcar el pedido listo para retiro (FAR-E2/E3)
25. [POST /pharmacy/orders/{id}/reject](#25-post-pharmacy-orders-id-reject) — Rechazar el pedido (FAR-E2)
26. [POST /pharmacy/orders/{id}/review](#26-post-pharmacy-orders-id-review) — Abrir revisión del pedido (FAR-E2)
27. [GET /pharmacy/orders/me](#27-get-pharmacy-orders-me) — Mis pedidos de farmacia, más nuevos primero (FAR-E1)
28. [POST /pharmacy/recall-holds](#28-post-pharmacy-recall-holds) — Aplicar retiro/recall de lote (UC-25-08)
29. [POST /pharmacy/recall-holds/{id}/release](#29-post-pharmacy-recall-holds-id-release) — Liberar recall y reactivar lote (UC-25-09)

---

## 1. POST /internal/inventory-sync-batches

- **Módulo:** `pharmacy_inventory`
- **Etiqueta OpenAPI:** `pharmacy-inventory-internal`
- **Nombre:** Ingerir un lote de sincronización ERP
- **Operation ID:** `PharmacyInventoryInternalController_createSyncBatch`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyInventoryInternalController.createSyncBatch](../../src/modules/pharmacy_inventory/controllers/pharmacy-inventory-internal.controller.ts)

### Descripción de negocio

Ingerir un lote de sincronización ERP. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Bootstrap: ingresar un lote de sincronización ERP.

### Descripción del sistema

NestJS resuelve `POST /internal/inventory-sync-batches` en `PharmacyInventoryInternalController_createSyncBatch`. El controlador delega en `InventorySyncService.createBatch`. Valida el body como `CreateSyncBatchDto` y consume `application/json`. El tipo de retorno estático es `Promise<SyncBatchResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateSyncBatchDto`; los campos opcionales se omiten.

```http
POST /internal/inventory-sync-batches HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "pharmacyIntegrationConnectionId": "00000000-0000-4000-8000-000000000001",
  "sourceBatchIdentifier": "valor-ejemplo",
  "items": [
    {}
  ]
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
| `pharmacyIntegrationConnectionId` | Sí | `string` | formato `uuid` | Conexión de integración de farmacia | `00000000-0000-4000-8000-000000000001` |
| `sourceBatchIdentifier` | Sí | `string` | longitud máxima 128 | Identificador del lote en el sistema origen | `valor-ejemplo` |
| `items` | Sí | `array<SyncItemDto>` | mínimo 1 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"pharmacyProductId":"00000000-0000-4000-8000-000000000001","externalProductCode":"CODIGO_EJEMPLO","externalLocationCode":"CODIGO_EJEMPLO","externalLotNumber":"valor-ejemplo","externalQuantity":1,"idempotencyKey":"valor-ejemplo"}]` |
| `items[].pharmacyProductId` | No | `string` | formato `uuid` | Producto mapeado (si se conoce) | `00000000-0000-4000-8000-000000000001` |
| `items[].externalProductCode` | No | `string` | longitud máxima 128 | Código de producto externo | `CODIGO_EJEMPLO` |
| `items[].externalLocationCode` | No | `string` | longitud máxima 128 | Código de ubicación externa | `CODIGO_EJEMPLO` |
| `items[].externalLotNumber` | No | `string` | longitud máxima 128 | Número de lote externo | `valor-ejemplo` |
| `items[].externalQuantity` | No | `number` | Sin restricción adicional declarada | Cantidad reportada por el ERP | `1` |
| `items[].idempotencyKey` | No | `string` | longitud máxima 128 | Clave de idempotencia del item | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /internal/inventory-sync-batches HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "pharmacyIntegrationConnectionId": "00000000-0000-4000-8000-000000000001",
  "sourceBatchIdentifier": "valor-ejemplo",
  "items": [
    {
      "pharmacyProductId": "00000000-0000-4000-8000-000000000001",
      "externalProductCode": "CODIGO_EJEMPLO",
      "externalLocationCode": "CODIGO_EJEMPLO",
      "externalLotNumber": "valor-ejemplo",
      "externalQuantity": 1,
      "idempotencyKey": "valor-ejemplo"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<SyncBatchResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<SyncBatchResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<SyncBatchResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<SyncBatchResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<SyncBatchResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<SyncBatchResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<SyncBatchResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<SyncBatchResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<SyncBatchResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `SyncBatchResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "itemIds": [
    "valor-ejemplo"
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `itemIds` | Sí | `array<string>` | Sin restricción adicional declarada | Ids de los items creados | `["valor-ejemplo"]` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
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
  "path": "/internal/inventory-sync-batches"
}
```

---

## 2. POST /internal/inventory-sync/{batchId}/reconcile

- **Módulo:** `pharmacy_inventory`
- **Etiqueta OpenAPI:** `pharmacy-inventory-internal`
- **Nombre:** Conciliar lote de sincronización externa (UC-25-12)
- **Operation ID:** `PharmacyInventoryInternalController_reconcile`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyInventoryInternalController.reconcile](../../src/modules/pharmacy_inventory/controllers/pharmacy-inventory-internal.controller.ts)

### Descripción de negocio

Conciliar lote de sincronización externa (UC-25-12). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-25-12: reconciliar un lote de sincronización.

### Descripción del sistema

NestJS resuelve `POST /internal/inventory-sync/{batchId}/reconcile` en `PharmacyInventoryInternalController_reconcile`. El controlador delega en `InventorySyncService.reconcile`. No recibe body. El tipo de retorno estático es `Promise<ReconcileResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `batchId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /internal/inventory-sync/00000000-0000-4000-8000-000000000001/reconcile HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `batchId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /internal/inventory-sync/00000000-0000-4000-8000-000000000001/reconcile HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ReconcileResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ReconcileResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ReconcileResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ReconcileResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ReconcileResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ReconcileResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ReconcileResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ReconcileResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ReconcileResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ReconcileResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "batchId": "00000000-0000-4000-8000-000000000001",
  "itemsProcessed": 1,
  "discrepancies": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `batchId` | Sí | `string` | formato `uuid` | Identificador asociado a batch. | `00000000-0000-4000-8000-000000000001` |
| `itemsProcessed` | Sí | `number` | Sin restricción adicional declarada | Items procesados | `1` |
| `discrepancies` | Sí | `number` | Sin restricción adicional declarada | Items marcados como discrepancia | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Lote de sincronización no encontrado | Excepción explícita en src/modules/pharmacy_inventory/services/inventory-sync.service.ts |
| 422 | `PRECONDITION_FAILED` | El lote no está en estado reconciliable | Excepción explícita en src/modules/pharmacy_inventory/services/inventory-sync.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/internal/inventory-sync/{batchId}/reconcile"
}
```

---

## 3. POST /internal/reservations/expire

- **Módulo:** `pharmacy_inventory`
- **Etiqueta OpenAPI:** `pharmacy-inventory-internal`
- **Nombre:** Liberar reservas y pedidos vencidos (UC-25-05)
- **Operation ID:** `PharmacyInventoryInternalController_expireReservations`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyInventoryInternalController.expireReservations](../../src/modules/pharmacy_inventory/controllers/pharmacy-inventory-internal.controller.ts)

### Descripción de negocio

Liberar reservas y pedidos vencidos (UC-25-05). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-25-05: liberar reservas expiradas. La misma corrida vence también los pedidos de paciente (FAR-E1) cuyo reloj de 48 h ya pasó — un solo worker, las dos colas.

### Descripción del sistema

NestJS resuelve `POST /internal/reservations/expire` en `PharmacyInventoryInternalController_expireReservations`. El controlador delega en `InventoryReservationsService.expire`, `PharmacyOrdersService.expireDue`. No recibe body. El tipo de retorno estático es `Promise<ExpireReservationsResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /internal/reservations/expire HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `SECURITY_ADMIN`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /internal/reservations/expire HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ExpireReservationsResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ExpireReservationsResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ExpireReservationsResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ExpireReservationsResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ExpireReservationsResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ExpireReservationsResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ExpireReservationsResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ExpireReservationsResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ExpireReservationsResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "expiredCount": 1,
  "expiredOrderCount": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `expiredCount` | Sí | `number` | Sin restricción adicional declarada | Reservas y pedidos expirados en esta corrida | `1` |
| `expiredOrderCount` | No | `number` | Sin restricción adicional declarada | Pedidos de paciente vencidos en esta corrida | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | El proveedor configurado para el canal in-app no existe | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 422 | `PRECONDITION_FAILED` | No hay canal in-app activo: falta correr el seed de mensajería | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 422 | `PRECONDITION_FAILED` | El canal in-app no tiene configuración de proveedor activa | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/internal/reservations/expire"
}
```

---

## 4. GET /pharmacy-inventory/availability

- **Módulo:** `pharmacy_inventory`
- **Etiqueta OpenAPI:** `pharmacy-inventory-directory`
- **Nombre:** Consultar qué sedes pueden surtir un conjunto de productos
- **Operation ID:** `PharmacyInventoryReadController_availability`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyInventoryReadController.availability](../../src/modules/pharmacy_inventory/controllers/pharmacy-inventory-read.controller.ts)

### Descripción de negocio

Consultar qué sedes pueden surtir un conjunto de productos. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: E2: qué sedes pueden surtir un pedido — completas primero, luego cerca y barato.

### Descripción del sistema

NestJS resuelve `GET /pharmacy-inventory/availability` en `PharmacyInventoryReadController_availability`. El controlador delega en `PharmacyInventoryReadService.availability`. No recibe body. El tipo de retorno estático es `Promise<AvailabilityResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `products` | query | Sí | `array<string>` | Sin restricción adicional declarada | Productos solicitados: UUIDs separados por coma | `["valor-ejemplo"]` |
| `lat` | query | No | `string` | Sin restricción adicional declarada | Latitud WGS84 desde donde medir distancia (va con lng) | `valor-ejemplo` |
| `lng` | query | No | `string` | Sin restricción adicional declarada | Longitud WGS84 desde donde medir distancia (va con lat) | `valor-ejemplo` |
| `limit` | query | No | `number` | Sin restricción adicional declarada | Tope de sedes servidas (por defecto 20) | `1` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /pharmacy-inventory/availability?products=valor-ejemplo HTTP/1.1
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
GET /pharmacy-inventory/availability?products=valor-ejemplo&lat=valor-ejemplo&lng=valor-ejemplo&limit=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<AvailabilityResponseDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<AvailabilityResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<AvailabilityResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<AvailabilityResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<AvailabilityResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<AvailabilityResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AvailabilityResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "requestedProductIds": [
    "00000000-0000-4000-8000-000000000001"
  ],
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
      "complete": true,
      "availableCount": 1,
      "missingProductIds": [
        "00000000-0000-4000-8000-000000000001"
      ],
      "totalAmount": {},
      "currency": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "products": [
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
          "availableQuantity": 1,
          "price": {
            "unitAmount": "valor-ejemplo",
            "patientAmount": {},
            "currency": {
              "code": "CODIGO_EJEMPLO",
              "display": "valor-ejemplo"
            },
            "priceListCode": "CODIGO_EJEMPLO"
          }
        }
      ]
    }
  ],
  "count": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `requestedProductIds` | Sí | `array<string>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `["00000000-0000-4000-8000-000000000001"]` |
| `items` | Sí | `array<AvailabilitySiteDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"siteId":"00000000-0000-4000-8000-000000000001","siteName":"Nombre de ejemplo","pharmacyId":"00000000-0000-4000-8000-000000000001","pharmacyName":"Nombre de ejemplo","addressText":{},"latitude":{},"longitude":{},"distanceKm":{},"homeDeliveryAvailable":{},"pickupAvailable":{},"complete":true,"availableCount":1,"missingProductIds":["00000000-0000-4000-8000-000000000001"],"totalAmount":{},"currency":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"products":[{"productId":"00000000-0000-4000-8000-000000000001","productCode":"CODIGO_EJEMPLO","brandName":{},"genericName":{},"strengthText":{},"packageSizeText":{},"medication":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"availableQuantity":1,"price":{"unitAmount":"valor-ejemplo","patientAmount":{},"currency":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"priceListCode":"CODIGO_EJEMPLO"}}]}]` |
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
| `items[].complete` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `items[].availableCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `items[].missingProductIds` | Sí | `array<string>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `["00000000-0000-4000-8000-000000000001"]` |
| `items[].totalAmount` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `items[].currency` | No | `InventoryConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `items[].currency.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].currency.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].products` | Sí | `array<AvailabilityProductDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"productId":"00000000-0000-4000-8000-000000000001","productCode":"CODIGO_EJEMPLO","brandName":{},"genericName":{},"strengthText":{},"packageSizeText":{},"medication":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"availableQuantity":1,"price":{"unitAmount":"valor-ejemplo","patientAmount":{},"currency":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"priceListCode":"CODIGO_EJEMPLO"}}]` |
| `items[].products[].productId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].products[].productCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].products[].brandName` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `items[].products[].genericName` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `items[].products[].strengthText` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `items[].products[].packageSizeText` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `items[].products[].medication` | No | `InventoryConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `items[].products[].medication.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].products[].medication.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].products[].availableQuantity` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `items[].products[].price` | No | `AvailabilityPriceDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"unitAmount":"valor-ejemplo","patientAmount":{},"currency":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"priceListCode":"CODIGO_EJEMPLO"}` |
| `items[].products[].price.unitAmount` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].products[].price.patientAmount` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `items[].products[].price.currency` | No | `InventoryConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `items[].products[].price.currency.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].products[].price.currency.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].products[].price.priceListCode` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
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
  "path": "/pharmacy-inventory/availability"
}
```

---

## 5. GET /pharmacy-inventory/sites/{siteId}/stock

- **Módulo:** `pharmacy_inventory`
- **Etiqueta OpenAPI:** `pharmacy-inventory-directory`
- **Nombre:** Consultar el stock disponible de una sede
- **Operation ID:** `PharmacyInventoryReadController_getSiteStock`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyInventoryReadController.getSiteStock](../../src/modules/pharmacy_inventory/controllers/pharmacy-inventory-read.controller.ts)

### Descripción de negocio

Consultar el stock disponible de una sede. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: E2: stock disponible de una sede, agregado por producto.

### Descripción del sistema

NestJS resuelve `GET /pharmacy-inventory/sites/{siteId}/stock` en `PharmacyInventoryReadController_getSiteStock`. El controlador delega en `PharmacyInventoryReadService.getSiteStock`. No recibe body. El tipo de retorno estático es `Promise<SiteStockResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `siteId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `product` | query | No | `string` | formato `uuid` | Producto puntual, si se acota | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /pharmacy-inventory/sites/00000000-0000-4000-8000-000000000001/stock HTTP/1.1
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
GET /pharmacy-inventory/sites/00000000-0000-4000-8000-000000000001/stock?product=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<SiteStockResponseDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<SiteStockResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<SiteStockResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<SiteStockResponseDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<SiteStockResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<SiteStockResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<SiteStockResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `SiteStockResponseDto`. Ejemplo completo derivado de ese DTO:

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
      "onHandQuantity": 1,
      "reservedQuantity": 1,
      "availableQuantity": 1,
      "locationCount": 1
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
| `items` | Sí | `array<SiteStockItemDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"productId":"00000000-0000-4000-8000-000000000001","productCode":"CODIGO_EJEMPLO","brandName":{},"genericName":{},"strengthText":{},"packageSizeText":{},"medication":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"onHandQuantity":1,"reservedQuantity":1,"availableQuantity":1,"locationCount":1}]` |
| `items[].productId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].productCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].brandName` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `items[].genericName` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `items[].strengthText` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `items[].packageSizeText` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `items[].medication` | No | `InventoryConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `items[].medication.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].medication.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].onHandQuantity` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `items[].reservedQuantity` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `items[].availableQuantity` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `items[].locationCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Sede de farmacia no encontrada | Excepción explícita en src/modules/pharmacy_inventory/services/pharmacy-inventory-read.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pharmacy-inventory/sites/{siteId}/stock"
}
```

---

## 6. POST /pharmacy/{pharmacyId}/dispensations

- **Módulo:** `pharmacy_inventory`
- **Etiqueta OpenAPI:** `pharmacy-inventory`
- **Nombre:** Dispensar una prescripción a un paciente (UC-25-03)
- **Operation ID:** `PharmacyDispensingController_dispense`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyDispensingController.dispense](../../src/modules/pharmacy_inventory/controllers/pharmacy-dispensing.controller.ts)

### Descripción de negocio

Dispensar una prescripción a un paciente (UC-25-03). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-25-03: dispensar prescripción a paciente.

### Descripción del sistema

NestJS resuelve `POST /pharmacy/{pharmacyId}/dispensations` en `PharmacyDispensingController_dispense`. El controlador delega en `MedicationDispensationsService.dispense`. Valida el body como `CreateDispensationDto` y consume `application/json`. El tipo de retorno estático es `Promise<MovementResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateDispensationDto`; los campos opcionales se omiten.

```http
POST /pharmacy/00000000-0000-4000-8000-000000000001/dispensations HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "pharmacySiteId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "lines": [
    {
      "pharmacyProductId": "00000000-0000-4000-8000-000000000001",
      "inventoryLocationId": "00000000-0000-4000-8000-000000000001",
      "dispensedQuantity": 1
    }
  ]
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
| `pharmacySiteId` | Sí | `string` | formato `uuid` | Sede de farmacia | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | Sí | `string` | formato `uuid` | Paciente | `00000000-0000-4000-8000-000000000001` |
| `medicationRequestId` | No | `string` | formato `uuid` | Solicitud de medicación | `00000000-0000-4000-8000-000000000001` |
| `inventoryReservationId` | No | `string` | formato `uuid` | Reserva a consumir | `00000000-0000-4000-8000-000000000001` |
| `idempotencyKey` | No | `string` | Sin restricción adicional declarada | Clave de idempotencia | `valor-ejemplo` |
| `lines` | Sí | `array<DispensationLineDto>` | mínimo 1 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"pharmacyProductId":"00000000-0000-4000-8000-000000000001","inventoryLocationId":"00000000-0000-4000-8000-000000000001","inventoryLotId":"00000000-0000-4000-8000-000000000001","dispensedQuantity":1,"patientAmount":1,"insurerAmount":1}]` |
| `lines[].pharmacyProductId` | Sí | `string` | formato `uuid` | Producto de farmacia | `00000000-0000-4000-8000-000000000001` |
| `lines[].inventoryLocationId` | Sí | `string` | formato `uuid` | Ubicación desde donde se dispensa | `00000000-0000-4000-8000-000000000001` |
| `lines[].inventoryLotId` | No | `string` | formato `uuid` | Lote dispensado | `00000000-0000-4000-8000-000000000001` |
| `lines[].dispensedQuantity` | Sí | `number` | mínimo 0 | Cantidad dispensada | `1` |
| `lines[].patientAmount` | No | `number` | mínimo 0 | Monto a cargo del paciente | `1` |
| `lines[].insurerAmount` | No | `number` | mínimo 0 | Monto a cargo del asegurador | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /pharmacy/00000000-0000-4000-8000-000000000001/dispensations HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "pharmacySiteId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "medicationRequestId": "00000000-0000-4000-8000-000000000001",
  "inventoryReservationId": "00000000-0000-4000-8000-000000000001",
  "idempotencyKey": "valor-ejemplo",
  "lines": [
    {
      "pharmacyProductId": "00000000-0000-4000-8000-000000000001",
      "inventoryLocationId": "00000000-0000-4000-8000-000000000001",
      "inventoryLotId": "00000000-0000-4000-8000-000000000001",
      "dispensedQuantity": 1,
      "patientAmount": 1,
      "insurerAmount": 1
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<MovementResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<MovementResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<MovementResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<MovementResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<MovementResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<MovementResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<MovementResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<MovementResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<MovementResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<MovementResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `MovementResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "inventoryItemId": "00000000-0000-4000-8000-000000000001",
  "quantityOnHand": "valor-ejemplo",
  "recordedAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | Sin restricción adicional declarada | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `inventoryItemId` | Sí | `string` | Sin restricción adicional declarada | Identificador asociado a inventory item. | `00000000-0000-4000-8000-000000000001` |
| `quantityOnHand` | Sí | `string` | Sin restricción adicional declarada | Valor de quantity on hand mantenido por la instancia. | `valor-ejemplo` |
| `recordedAt` | Sí | `string` | formato `date-time` | Valor de recorded at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Reserva no encontrada | Excepción explícita en src/modules/pharmacy_inventory/services/medication-dispensations.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La reserva es un pedido de paciente: se dispensa con su código de retiro por POST /pharmacy/orders/:id/dispense | Excepción explícita en src/modules/pharmacy_inventory/services/medication-dispensations.service.ts |
| 422 | `PRECONDITION_FAILED` | Stock insuficiente para dispensar | Excepción explícita en src/modules/pharmacy_inventory/services/medication-dispensations.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pharmacy/{pharmacyId}/dispensations"
}
```

---

## 7. POST /pharmacy/{pharmacyId}/goods-receipts

- **Módulo:** `pharmacy_inventory`
- **Etiqueta OpenAPI:** `pharmacy-inventory`
- **Nombre:** Recepcionar mercancía por lote (UC-25-02)
- **Operation ID:** `PharmacyProcurementController_receiveGoods`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyProcurementController.receiveGoods](../../src/modules/pharmacy_inventory/controllers/pharmacy-procurement.controller.ts)

### Descripción de negocio

Recepcionar mercancía por lote (UC-25-02). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-25-02: recepción de mercancía por lote.

### Descripción del sistema

NestJS resuelve `POST /pharmacy/{pharmacyId}/goods-receipts` en `PharmacyProcurementController_receiveGoods`. El controlador delega en `PharmacyProcurementService.receiveGoods`. Valida el body como `PharmacyInventoryCreateGoodsReceiptDto` y consume `application/json`. El tipo de retorno estático es `Promise<GoodsReceiptResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `PharmacyInventoryCreateGoodsReceiptDto`; los campos opcionales se omiten.

```http
POST /pharmacy/00000000-0000-4000-8000-000000000001/goods-receipts HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "pharmacyPurchaseOrderId": "00000000-0000-4000-8000-000000000001",
  "pharmacySiteId": "00000000-0000-4000-8000-000000000001",
  "inventoryLocationId": "00000000-0000-4000-8000-000000000001",
  "lines": [
    {
      "pharmacyPurchaseOrderLineId": "00000000-0000-4000-8000-000000000001",
      "pharmacyProductId": "00000000-0000-4000-8000-000000000001",
      "lotNumber": "valor-ejemplo",
      "receivedQuantity": 1
    }
  ]
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
| `pharmacyPurchaseOrderId` | Sí | `string` | formato `uuid` | Orden de compra a recepcionar | `00000000-0000-4000-8000-000000000001` |
| `pharmacySiteId` | Sí | `string` | formato `uuid` | Sede de farmacia | `00000000-0000-4000-8000-000000000001` |
| `inventoryLocationId` | Sí | `string` | formato `uuid` | Ubicación destino del stock | `00000000-0000-4000-8000-000000000001` |
| `supplierDeliveryReference` | No | `string` | Sin restricción adicional declarada | Referencia de entrega del proveedor | `valor-ejemplo` |
| `idempotencyKey` | No | `string` | Sin restricción adicional declarada | Clave de idempotencia | `valor-ejemplo` |
| `lines` | Sí | `array<GoodsReceiptLineDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"pharmacyPurchaseOrderLineId":"00000000-0000-4000-8000-000000000001","pharmacyProductId":"00000000-0000-4000-8000-000000000001","lotNumber":"valor-ejemplo","receivedQuantity":1,"acceptedQuantity":1,"rejectedQuantity":1,"unitCostAmount":1,"expiresAt":"valor-ejemplo"}]` |
| `lines[].pharmacyPurchaseOrderLineId` | Sí | `string` | formato `uuid` | Línea de la orden de compra | `00000000-0000-4000-8000-000000000001` |
| `lines[].pharmacyProductId` | Sí | `string` | formato `uuid` | Producto de farmacia | `00000000-0000-4000-8000-000000000001` |
| `lines[].lotNumber` | Sí | `string` | longitud máxima 128 | Número de lote recibido | `valor-ejemplo` |
| `lines[].receivedQuantity` | Sí | `number` | mínimo 0 | Cantidad recibida | `1` |
| `lines[].acceptedQuantity` | No | `number` | mínimo 0 | Cantidad aceptada (default = recibida) | `1` |
| `lines[].rejectedQuantity` | No | `number` | mínimo 0 | Cantidad rechazada | `1` |
| `lines[].unitCostAmount` | No | `number` | mínimo 0 | Costo unitario | `1` |
| `lines[].expiresAt` | No | `string` | Sin restricción adicional declarada | Fecha de expiración del lote (ISO) | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /pharmacy/00000000-0000-4000-8000-000000000001/goods-receipts HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "pharmacyPurchaseOrderId": "00000000-0000-4000-8000-000000000001",
  "pharmacySiteId": "00000000-0000-4000-8000-000000000001",
  "inventoryLocationId": "00000000-0000-4000-8000-000000000001",
  "supplierDeliveryReference": "valor-ejemplo",
  "idempotencyKey": "valor-ejemplo",
  "lines": [
    {
      "pharmacyPurchaseOrderLineId": "00000000-0000-4000-8000-000000000001",
      "pharmacyProductId": "00000000-0000-4000-8000-000000000001",
      "lotNumber": "valor-ejemplo",
      "receivedQuantity": 1,
      "acceptedQuantity": 1,
      "rejectedQuantity": 1,
      "unitCostAmount": 1,
      "expiresAt": "valor-ejemplo"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<GoodsReceiptResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<GoodsReceiptResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<GoodsReceiptResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<GoodsReceiptResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<GoodsReceiptResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<GoodsReceiptResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<GoodsReceiptResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<GoodsReceiptResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<GoodsReceiptResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<GoodsReceiptResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `GoodsReceiptResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "receiptNumber": "valor-ejemplo",
  "lotIds": [
    "valor-ejemplo"
  ],
  "ledgerEntryIds": [
    "valor-ejemplo"
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `receiptNumber` | Sí | `string` | Sin restricción adicional declarada | Valor de receipt number mantenido por la instancia. | `valor-ejemplo` |
| `lotIds` | Sí | `array<string>` | Sin restricción adicional declarada | Ids de lotes afectados | `["valor-ejemplo"]` |
| `ledgerEntryIds` | Sí | `array<string>` | Sin restricción adicional declarada | Ids de asientos del ledger | `["valor-ejemplo"]` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Orden de compra no encontrada | Excepción explícita en src/modules/pharmacy_inventory/services/pharmacy-procurement.service.ts |
| 404 | `NOT_FOUND` | Ubicación destino no encontrada | Excepción explícita en src/modules/pharmacy_inventory/services/pharmacy-procurement.service.ts |
| 404 | `NOT_FOUND` | Línea de orden no encontrada | Excepción explícita en src/modules/pharmacy_inventory/services/pharmacy-procurement.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La orden no admite recepción | Excepción explícita en src/modules/pharmacy_inventory/services/pharmacy-procurement.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pharmacy/{pharmacyId}/goods-receipts"
}
```

---

## 8. POST /pharmacy/{pharmacyId}/purchase-orders

- **Módulo:** `pharmacy_inventory`
- **Etiqueta OpenAPI:** `pharmacy-inventory`
- **Nombre:** Emitir una orden de compra a proveedor (UC-25-01)
- **Operation ID:** `PharmacyProcurementController_createPurchaseOrder`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyProcurementController.createPurchaseOrder](../../src/modules/pharmacy_inventory/controllers/pharmacy-procurement.controller.ts)

### Descripción de negocio

Emitir una orden de compra a proveedor (UC-25-01). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-25-01: emitir orden de compra.

### Descripción del sistema

NestJS resuelve `POST /pharmacy/{pharmacyId}/purchase-orders` en `PharmacyProcurementController_createPurchaseOrder`. El controlador delega en `PharmacyProcurementService.createPurchaseOrder`. Valida el body como `PharmacyInventoryCreatePurchaseOrderDto` y consume `application/json`. El tipo de retorno estático es `Promise<PurchaseOrderResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `PharmacyInventoryCreatePurchaseOrderDto`; los campos opcionales se omiten.

```http
POST /pharmacy/00000000-0000-4000-8000-000000000001/purchase-orders HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "pharmacySiteId": "00000000-0000-4000-8000-000000000001",
  "pharmacySupplierId": "00000000-0000-4000-8000-000000000001",
  "lines": [
    {
      "pharmacyProductId": "00000000-0000-4000-8000-000000000001",
      "orderedQuantity": 1
    }
  ]
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
| `pharmacySiteId` | Sí | `string` | formato `uuid` | Sede de farmacia (pharmacy_sites) | `00000000-0000-4000-8000-000000000001` |
| `pharmacySupplierId` | Sí | `string` | formato `uuid` | Proveedor (pharmacy_suppliers) | `00000000-0000-4000-8000-000000000001` |
| `purchaseOrderNumber` | No | `string` | Sin restricción adicional declarada | Número de orden; se autogenera si se omite | `valor-ejemplo` |
| `idempotencyKey` | No | `string` | Sin restricción adicional declarada | Clave de idempotencia | `valor-ejemplo` |
| `lines` | Sí | `array<PurchaseOrderLineDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"pharmacyProductId":"00000000-0000-4000-8000-000000000001","orderedQuantity":1,"unitCostAmount":1}]` |
| `lines[].pharmacyProductId` | Sí | `string` | formato `uuid` | Producto de farmacia | `00000000-0000-4000-8000-000000000001` |
| `lines[].orderedQuantity` | Sí | `number` | mínimo 0 | Cantidad ordenada | `1` |
| `lines[].unitCostAmount` | No | `number` | mínimo 0 | Costo unitario | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /pharmacy/00000000-0000-4000-8000-000000000001/purchase-orders HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "pharmacySiteId": "00000000-0000-4000-8000-000000000001",
  "pharmacySupplierId": "00000000-0000-4000-8000-000000000001",
  "purchaseOrderNumber": "valor-ejemplo",
  "idempotencyKey": "valor-ejemplo",
  "lines": [
    {
      "pharmacyProductId": "00000000-0000-4000-8000-000000000001",
      "orderedQuantity": 1,
      "unitCostAmount": 1
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<PurchaseOrderResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<PurchaseOrderResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PurchaseOrderResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PurchaseOrderResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<PurchaseOrderResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PurchaseOrderResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<PurchaseOrderResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PurchaseOrderResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PurchaseOrderResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PurchaseOrderResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PurchaseOrderResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "purchaseOrderNumber": "valor-ejemplo",
  "lineIds": [
    "valor-ejemplo"
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `purchaseOrderNumber` | Sí | `string` | Sin restricción adicional declarada | Valor de purchase order number mantenido por la instancia. | `valor-ejemplo` |
| `lineIds` | Sí | `array<string>` | Sin restricción adicional declarada | Ids de las líneas creadas | `["valor-ejemplo"]` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Proveedor no encontrado | Excepción explícita en src/modules/pharmacy_inventory/services/pharmacy-procurement.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El proveedor no está activo | Excepción explícita en src/modules/pharmacy_inventory/services/pharmacy-procurement.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pharmacy/{pharmacyId}/purchase-orders"
}
```

---

## 9. POST /pharmacy/{pharmacyId}/reservations

- **Módulo:** `pharmacy_inventory`
- **Etiqueta OpenAPI:** `pharmacy-inventory`
- **Nombre:** Reservar stock para una prescripción (UC-25-04)
- **Operation ID:** `PharmacyInventoryController_reserve`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyInventoryController.reserve](../../src/modules/pharmacy_inventory/controllers/pharmacy-inventory.controller.ts)

### Descripción de negocio

Reservar stock para una prescripción (UC-25-04). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-25-04: reservar stock.

### Descripción del sistema

NestJS resuelve `POST /pharmacy/{pharmacyId}/reservations` en `PharmacyInventoryController_reserve`. El controlador delega en `InventoryReservationsService.reserve`. Valida el body como `CreateReservationDto` y consume `application/json`. El tipo de retorno estático es `Promise<MovementResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateReservationDto`; los campos opcionales se omiten.

```http
POST /pharmacy/00000000-0000-4000-8000-000000000001/reservations HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "pharmacySiteId": "00000000-0000-4000-8000-000000000001",
  "lines": [
    {
      "pharmacyProductId": "00000000-0000-4000-8000-000000000001",
      "inventoryLocationId": "00000000-0000-4000-8000-000000000001",
      "requestedQuantity": 1
    }
  ]
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
| `pharmacySiteId` | Sí | `string` | formato `uuid` | Sede de farmacia | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | No | `string` | formato `uuid` | Paciente | `00000000-0000-4000-8000-000000000001` |
| `medicationRequestId` | No | `string` | formato `uuid` | Solicitud de medicación | `00000000-0000-4000-8000-000000000001` |
| `quotationId` | No | `string` | formato `uuid` | Cotización asociada | `00000000-0000-4000-8000-000000000001` |
| `expiresInMinutes` | No | `number` | mínimo 1 | Minutos hasta expiración (default 60) | `1` |
| `lines` | Sí | `array<ReservationLineDto>` | mínimo 1 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"pharmacyProductId":"00000000-0000-4000-8000-000000000001","inventoryLocationId":"00000000-0000-4000-8000-000000000001","inventoryLotId":"00000000-0000-4000-8000-000000000001","requestedQuantity":1}]` |
| `lines[].pharmacyProductId` | Sí | `string` | formato `uuid` | Producto de farmacia | `00000000-0000-4000-8000-000000000001` |
| `lines[].inventoryLocationId` | Sí | `string` | formato `uuid` | Ubicación de inventario | `00000000-0000-4000-8000-000000000001` |
| `lines[].inventoryLotId` | No | `string` | formato `uuid` | Lote específico | `00000000-0000-4000-8000-000000000001` |
| `lines[].requestedQuantity` | Sí | `number` | mínimo 0 | Cantidad solicitada | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /pharmacy/00000000-0000-4000-8000-000000000001/reservations HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "pharmacySiteId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "medicationRequestId": "00000000-0000-4000-8000-000000000001",
  "quotationId": "00000000-0000-4000-8000-000000000001",
  "expiresInMinutes": 1,
  "lines": [
    {
      "pharmacyProductId": "00000000-0000-4000-8000-000000000001",
      "inventoryLocationId": "00000000-0000-4000-8000-000000000001",
      "inventoryLotId": "00000000-0000-4000-8000-000000000001",
      "requestedQuantity": 1
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<MovementResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<MovementResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<MovementResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<MovementResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<MovementResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<MovementResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<MovementResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<MovementResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<MovementResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<MovementResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `MovementResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "inventoryItemId": "00000000-0000-4000-8000-000000000001",
  "quantityOnHand": "valor-ejemplo",
  "recordedAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | Sin restricción adicional declarada | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `inventoryItemId` | Sí | `string` | Sin restricción adicional declarada | Identificador asociado a inventory item. | `00000000-0000-4000-8000-000000000001` |
| `quantityOnHand` | Sí | `string` | Sin restricción adicional declarada | Valor de quantity on hand mantenido por la instancia. | `valor-ejemplo` |
| `recordedAt` | Sí | `string` | formato `date-time` | Valor de recorded at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Stock disponible insuficiente para reservar | Excepción explícita en src/modules/pharmacy_inventory/services/inventory-reservations.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pharmacy/{pharmacyId}/reservations"
}
```

---

## 10. POST /pharmacy/{pharmacyId}/suppliers

- **Módulo:** `pharmacy_inventory`
- **Etiqueta OpenAPI:** `pharmacy-inventory`
- **Nombre:** Registrar un proveedor de farmacia
- **Operation ID:** `PharmacyProcurementController_createSupplier`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyProcurementController.createSupplier](../../src/modules/pharmacy_inventory/controllers/pharmacy-procurement.controller.ts)

### Descripción de negocio

Registrar un proveedor de farmacia. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Bootstrap: alta de proveedor.

### Descripción del sistema

NestJS resuelve `POST /pharmacy/{pharmacyId}/suppliers` en `PharmacyProcurementController_createSupplier`. El controlador delega en `PharmacyProcurementService.createSupplier`. Valida el body como `CreateSupplierDto` y consume `application/json`. El tipo de retorno estático es `Promise<IdResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateSupplierDto`; los campos opcionales se omiten.

```http
POST /pharmacy/00000000-0000-4000-8000-000000000001/suppliers HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "supplierTenantId": "00000000-0000-4000-8000-000000000001"
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
| `supplierTenantId` | Sí | `string` | formato `uuid` | Tenant del proveedor (directory.tenants) | `00000000-0000-4000-8000-000000000001` |
| `supplierCode` | No | `string` | longitud máxima 64 | Código interno del proveedor | `CODIGO_EJEMPLO` |
| `businessPartnerId` | No | `string` | formato `uuid` | Business partner ERP | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /pharmacy/00000000-0000-4000-8000-000000000001/suppliers HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "supplierTenantId": "00000000-0000-4000-8000-000000000001",
  "supplierCode": "CODIGO_EJEMPLO",
  "businessPartnerId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<IdResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `IdResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
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
  "path": "/pharmacy/{pharmacyId}/suppliers"
}
```

---

## 11. POST /pharmacy/{pharmacyId}/transfers

- **Módulo:** `pharmacy_inventory`
- **Etiqueta OpenAPI:** `pharmacy-inventory`
- **Nombre:** Transferir stock entre ubicaciones (UC-25-10)
- **Operation ID:** `PharmacyInventoryController_transfer`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyInventoryController.transfer](../../src/modules/pharmacy_inventory/controllers/pharmacy-inventory.controller.ts)

### Descripción de negocio

Transferir stock entre ubicaciones (UC-25-10). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-25-10: transferir stock entre ubicaciones.

### Descripción del sistema

NestJS resuelve `POST /pharmacy/{pharmacyId}/transfers` en `PharmacyInventoryController_transfer`. El controlador delega en `InventoryTransfersService.transfer`. Valida el body como `CreateTransferDto` y consume `application/json`. El tipo de retorno estático es `Promise<TransferResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateTransferDto`; los campos opcionales se omiten.

```http
POST /pharmacy/00000000-0000-4000-8000-000000000001/transfers HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "pharmacySiteId": "00000000-0000-4000-8000-000000000001",
  "pharmacyProductId": "00000000-0000-4000-8000-000000000001",
  "fromLocationId": "00000000-0000-4000-8000-000000000001",
  "toLocationId": "00000000-0000-4000-8000-000000000001",
  "quantity": 1
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
| `pharmacySiteId` | Sí | `string` | formato `uuid` | Sede de farmacia | `00000000-0000-4000-8000-000000000001` |
| `pharmacyProductId` | Sí | `string` | formato `uuid` | Producto de farmacia | `00000000-0000-4000-8000-000000000001` |
| `fromLocationId` | Sí | `string` | formato `uuid` | Ubicación origen | `00000000-0000-4000-8000-000000000001` |
| `toLocationId` | Sí | `string` | formato `uuid` | Ubicación destino | `00000000-0000-4000-8000-000000000001` |
| `inventoryLotId` | No | `string` | formato `uuid` | Lote específico | `00000000-0000-4000-8000-000000000001` |
| `quantity` | Sí | `number` | mínimo 0 | Cantidad a transferir | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /pharmacy/00000000-0000-4000-8000-000000000001/transfers HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "pharmacySiteId": "00000000-0000-4000-8000-000000000001",
  "pharmacyProductId": "00000000-0000-4000-8000-000000000001",
  "fromLocationId": "00000000-0000-4000-8000-000000000001",
  "toLocationId": "00000000-0000-4000-8000-000000000001",
  "inventoryLotId": "00000000-0000-4000-8000-000000000001",
  "quantity": 1
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<TransferResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<TransferResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<TransferResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<TransferResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<TransferResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<TransferResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<TransferResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<TransferResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<TransferResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<TransferResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TransferResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "correlationId": "00000000-0000-4000-8000-000000000001",
  "outLedgerEntryId": "00000000-0000-4000-8000-000000000001",
  "inLedgerEntryId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `correlationId` | Sí | `string` | formato `uuid` | Identificador asociado a correlation. | `00000000-0000-4000-8000-000000000001` |
| `outLedgerEntryId` | Sí | `string` | formato `uuid` | Identificador asociado a out ledger entry. | `00000000-0000-4000-8000-000000000001` |
| `inLedgerEntryId` | Sí | `string` | formato `uuid` | Identificador asociado a in ledger entry. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Ubicación origen no encontrada | Excepción explícita en src/modules/pharmacy_inventory/services/inventory-transfers.service.ts |
| 404 | `NOT_FOUND` | Ubicación destino no encontrada | Excepción explícita en src/modules/pharmacy_inventory/services/inventory-transfers.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Stock disponible insuficiente en origen | Excepción explícita en src/modules/pharmacy_inventory/services/inventory-transfers.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pharmacy/{pharmacyId}/transfers"
}
```

---

## 12. POST /pharmacy/{siteId}/count-sessions

- **Módulo:** `pharmacy_inventory`
- **Etiqueta OpenAPI:** `pharmacy-inventory`
- **Nombre:** Iniciar y congelar una sesión de conteo (UC-25-06)
- **Operation ID:** `PharmacyInventoryController_openCountSession`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyInventoryController.openCountSession](../../src/modules/pharmacy_inventory/controllers/pharmacy-inventory.controller.ts)

### Descripción de negocio

Iniciar y congelar una sesión de conteo (UC-25-06). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-25-06: abrir sesión de conteo cíclico.

### Descripción del sistema

NestJS resuelve `POST /pharmacy/{siteId}/count-sessions` en `PharmacyInventoryController_openCountSession`. El controlador delega en `InventoryCountService.openSession`. Valida el body como `CreateCountSessionDto` y consume `application/json`. El tipo de retorno estático es `Promise<CountSessionResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `siteId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateCountSessionDto`; los campos opcionales se omiten.

```http
POST /pharmacy/00000000-0000-4000-8000-000000000001/count-sessions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "inventoryLocationId": "00000000-0000-4000-8000-000000000001",
  "items": [
    {
      "pharmacyProductId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `siteId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `inventoryLocationId` | Sí | `string` | formato `uuid` | Ubicación a contar | `00000000-0000-4000-8000-000000000001` |
| `freeze` | No | `boolean` | Sin restricción adicional declarada | Congelar movimientos durante el conteo | `true` |
| `items` | Sí | `array<CountSessionItemDto>` | Sin restricción adicional declarada | Productos/lotes a contar | `[{"pharmacyProductId":"00000000-0000-4000-8000-000000000001","inventoryLotId":"00000000-0000-4000-8000-000000000001"}]` |
| `items[].pharmacyProductId` | Sí | `string` | formato `uuid` | Producto de farmacia | `00000000-0000-4000-8000-000000000001` |
| `items[].inventoryLotId` | No | `string` | formato `uuid` | Lote específico | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /pharmacy/00000000-0000-4000-8000-000000000001/count-sessions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "inventoryLocationId": "00000000-0000-4000-8000-000000000001",
  "freeze": true,
  "items": [
    {
      "pharmacyProductId": "00000000-0000-4000-8000-000000000001",
      "inventoryLotId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<CountSessionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CountSessionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CountSessionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CountSessionResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<CountSessionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CountSessionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CountSessionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CountSessionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CountSessionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CountSessionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CountSessionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "lineIds": [
    "valor-ejemplo"
  ],
  "adjustments": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `lineIds` | Sí | `array<string>` | Sin restricción adicional declarada | Ids de líneas de conteo | `["valor-ejemplo"]` |
| `adjustments` | Sí | `number` | Sin restricción adicional declarada | Número de ajustes generados | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Ubicación no encontrada | Excepción explícita en src/modules/pharmacy_inventory/services/inventory-count.service.ts |
| 409 | `CONFLICT` | Ya existe una sesión de conteo abierta en la ubicación | Excepción explícita en src/modules/pharmacy_inventory/services/inventory-count.service.ts |
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
  "path": "/pharmacy/{siteId}/count-sessions"
}
```

---

## 13. POST /pharmacy/{siteId}/inventory-locations

- **Módulo:** `pharmacy_inventory`
- **Etiqueta OpenAPI:** `pharmacy-inventory`
- **Nombre:** Crear una ubicación de inventario
- **Operation ID:** `PharmacyInventoryController_createLocation`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyInventoryController.createLocation](../../src/modules/pharmacy_inventory/controllers/pharmacy-inventory.controller.ts)

### Descripción de negocio

Crear una ubicación de inventario. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Bootstrap: alta de ubicación de inventario.

### Descripción del sistema

NestJS resuelve `POST /pharmacy/{siteId}/inventory-locations` en `PharmacyInventoryController_createLocation`. El controlador delega en `InventoryLocationsService.create`. Valida el body como `CreateLocationDto` y consume `application/json`. El tipo de retorno estático es `Promise<IdResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `siteId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateLocationDto`; los campos opcionales se omiten.

```http
POST /pharmacy/00000000-0000-4000-8000-000000000001/inventory-locations HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `siteId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `code` | Sí | `string` | longitud máxima 64 | Código de la ubicación | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | longitud máxima 200 | Nombre legible de la ubicación | `Nombre de ejemplo` |
| `parentLocationId` | No | `string` | formato `uuid` | Ubicación padre (jerarquía) | `00000000-0000-4000-8000-000000000001` |
| `controlledAccess` | No | `boolean` | Sin restricción adicional declarada | Requiere acceso controlado | `true` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /pharmacy/00000000-0000-4000-8000-000000000001/inventory-locations HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "parentLocationId": "00000000-0000-4000-8000-000000000001",
  "controlledAccess": true
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<IdResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `IdResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
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
  "path": "/pharmacy/{siteId}/inventory-locations"
}
```

---

## 14. POST /pharmacy/count-sessions/{id}/approve

- **Módulo:** `pharmacy_inventory`
- **Etiqueta OpenAPI:** `pharmacy-inventory`
- **Nombre:** Aprobar conteo y ajustar ledger por varianza (UC-25-07)
- **Operation ID:** `PharmacyInventoryController_approveCountSession`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyInventoryController.approveCountSession](../../src/modules/pharmacy_inventory/controllers/pharmacy-inventory.controller.ts)

### Descripción de negocio

Aprobar conteo y ajustar ledger por varianza (UC-25-07). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-25-07: aprobar conteo y ajustar por varianza.

### Descripción del sistema

NestJS resuelve `POST /pharmacy/count-sessions/{id}/approve` en `PharmacyInventoryController_approveCountSession`. El controlador delega en `InventoryCountService.approve`. Valida el body como `ApproveCountSessionDto` y consume `application/json`. El tipo de retorno estático es `Promise<CountSessionResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ApproveCountSessionDto`; los campos opcionales se omiten.

```http
POST /pharmacy/count-sessions/00000000-0000-4000-8000-000000000001/approve HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "counts": [
    {
      "lineId": "00000000-0000-4000-8000-000000000001",
      "countedQuantity": 1
    }
  ]
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
| `counts` | Sí | `array<CountResultDto>` | mínimo 1 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"lineId":"00000000-0000-4000-8000-000000000001","countedQuantity":1}]` |
| `counts[].lineId` | Sí | `string` | formato `uuid` | Línea de conteo | `00000000-0000-4000-8000-000000000001` |
| `counts[].countedQuantity` | Sí | `number` | mínimo 0 | Cantidad efectivamente contada | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /pharmacy/count-sessions/00000000-0000-4000-8000-000000000001/approve HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "counts": [
    {
      "lineId": "00000000-0000-4000-8000-000000000001",
      "countedQuantity": 1
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<CountSessionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CountSessionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CountSessionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CountSessionResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<CountSessionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CountSessionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CountSessionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CountSessionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CountSessionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CountSessionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CountSessionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "lineIds": [
    "valor-ejemplo"
  ],
  "adjustments": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `lineIds` | Sí | `array<string>` | Sin restricción adicional declarada | Ids de líneas de conteo | `["valor-ejemplo"]` |
| `adjustments` | Sí | `number` | Sin restricción adicional declarada | Número de ajustes generados | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Sesión de conteo no encontrada | Excepción explícita en src/modules/pharmacy_inventory/services/inventory-count.service.ts |
| 404 | `NOT_FOUND` | Línea de conteo no encontrada | Excepción explícita en src/modules/pharmacy_inventory/services/inventory-count.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La sesión no está en estado aprobable | Excepción explícita en src/modules/pharmacy_inventory/services/inventory-count.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pharmacy/count-sessions/{id}/approve"
}
```

---

## 15. POST /pharmacy/dispensations/{id}/reverse

- **Módulo:** `pharmacy_inventory`
- **Etiqueta OpenAPI:** `pharmacy-inventory`
- **Nombre:** Reversar una dispensación (UC-25-11)
- **Operation ID:** `PharmacyDispensingController_reverse`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyDispensingController.reverse](../../src/modules/pharmacy_inventory/controllers/pharmacy-dispensing.controller.ts)

### Descripción de negocio

Reversar una dispensación (UC-25-11). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-25-11: reversar dispensación (devolución).

### Descripción del sistema

NestJS resuelve `POST /pharmacy/dispensations/{id}/reverse` en `PharmacyDispensingController_reverse`. El controlador delega en `MedicationDispensationsService.reverse`. Valida el body como `ReverseDispensationDto` y consume `application/json`. El tipo de retorno estático es `Promise<StatusResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ReverseDispensationDto`; los campos opcionales se omiten.

```http
POST /pharmacy/dispensations/00000000-0000-4000-8000-000000000001/reverse HTTP/1.1
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
| `reason` | No | `string` | longitud máxima 256 | Motivo de la reversión | `Texto descriptivo de ejemplo` |
| `inventoryLocationId` | No | `string` | formato `uuid` | Ubicación a la que se reintegra el stock | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /pharmacy/dispensations/00000000-0000-4000-8000-000000000001/reverse HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "reason": "Texto descriptivo de ejemplo",
  "inventoryLocationId": "00000000-0000-4000-8000-000000000001"
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
| 404 | `NOT_FOUND` | Dispensación no encontrada | Excepción explícita en src/modules/pharmacy_inventory/services/medication-dispensations.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La dispensación no está en estado reversible | Excepción explícita en src/modules/pharmacy_inventory/services/medication-dispensations.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pharmacy/dispensations/{id}/reverse"
}
```

---

## 16. GET /pharmacy/orders

- **Módulo:** `pharmacy_inventory`
- **Etiqueta OpenAPI:** `pharmacy-orders`
- **Nombre:** Bandeja de pedidos de las farmacias del tenant (FAR-E2)
- **Operation ID:** `PharmacyOrdersController_listForTenant`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyOrdersController.listForTenant](../../src/modules/pharmacy_inventory/controllers/pharmacy-orders.controller.ts)

### Descripción de negocio

Bandeja de pedidos de las farmacias del tenant (FAR-E2). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: FAR-E2: la bandeja del mostrador — los pedidos del tenant de la farmacia. `SECURITY_ADMIN` es **provisional**: no existe todavía un rol runtime de farmacia; cuando FAR-E2 lo defina, se reemplaza acá. La protección real es el tenant en el WHERE: una organización nunca ve pedidos de otra.

### Descripción del sistema

NestJS resuelve `GET /pharmacy/orders` en `PharmacyOrdersController_listForTenant`. El controlador delega en `PharmacyOrdersService.listForPharmacyTenant`. No recibe body. El tipo de retorno estático es `Promise<PharmacyOrderListResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `status` | query | No | `string` | Sin restricción adicional declarada | Código de estado (PINV_ORDER_*) | `ok` |
| `siteId` | query | No | `string` | formato `uuid` | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `from` | query | No | `string` | formato `date-time` | Instante ISO 8601 | `2026-07-31T12:00:00.000Z` |
| `to` | query | No | `string` | formato `date-time` | Instante ISO 8601 | `2026-07-31T12:00:00.000Z` |
| `limit` | query | No | `number` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `1` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /pharmacy/orders HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /pharmacy/orders?status=ok&siteId=00000000-0000-4000-8000-000000000001&from=2026-07-31T12%3A00%3A00.000Z&to=2026-07-31T12%3A00%3A00.000Z&limit=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PharmacyOrderListResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<PharmacyOrderListResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<PharmacyOrderListResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<PharmacyOrderListResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<PharmacyOrderListResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<PharmacyOrderListResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PharmacyOrderListResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "status": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "createdAt": "valor-ejemplo",
      "expiresAt": "valor-ejemplo",
      "siteId": "00000000-0000-4000-8000-000000000001",
      "siteName": "Nombre de ejemplo",
      "pharmacyId": "00000000-0000-4000-8000-000000000001",
      "pharmacyName": "Nombre de ejemplo",
      "medicationRequestId": "00000000-0000-4000-8000-000000000001",
      "patientName": "Nombre de ejemplo",
      "deliveryMode": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "pickupCode": "CODIGO_EJEMPLO",
      "totalAmount": "valor-ejemplo",
      "currency": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "rejectionReasonText": "Texto descriptivo de ejemplo",
      "substitutions": [
        {
          "id": "00000000-0000-4000-8000-000000000001",
          "originalProductId": "00000000-0000-4000-8000-000000000001",
          "originalName": "Nombre de ejemplo",
          "originalUnitPriceAmount": "valor-ejemplo",
          "proposedProductId": "00000000-0000-4000-8000-000000000001",
          "proposedName": "Nombre de ejemplo",
          "proposedUnitPriceAmount": "valor-ejemplo",
          "currency": {
            "code": "CODIGO_EJEMPLO",
            "display": "valor-ejemplo"
          },
          "status": {
            "code": "CODIGO_EJEMPLO",
            "display": "valor-ejemplo"
          },
          "decidedAt": "valor-ejemplo"
        }
      ],
      "lines": [
        {
          "productId": "00000000-0000-4000-8000-000000000001",
          "medicationConceptId": "00000000-0000-4000-8000-000000000001",
          "productCode": "CODIGO_EJEMPLO",
          "brandName": "Nombre de ejemplo",
          "genericName": "Nombre de ejemplo",
          "strengthText": "valor-ejemplo",
          "packageSizeText": "valor-ejemplo",
          "medication": {
            "code": "CODIGO_EJEMPLO",
            "display": "valor-ejemplo"
          },
          "requestedQuantity": 1,
          "reservedQuantity": 1,
          "fulfilledQuantity": 1,
          "unitPriceAmount": "valor-ejemplo",
          "currency": {
            "code": "CODIGO_EJEMPLO",
            "display": "valor-ejemplo"
          },
          "status": {
            "code": "CODIGO_EJEMPLO",
            "display": "valor-ejemplo"
          }
        }
      ]
    }
  ],
  "count": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<PharmacyOrderDto>` | Sin restricción adicional declarada | Pedidos del paciente, más nuevos primero. | `[{"id":"00000000-0000-4000-8000-000000000001","status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"createdAt":"valor-ejemplo","expiresAt":"valor-ejemplo","siteId":"00000000-0000-4000-8000-000000000001","siteName":"Nombre de ejemplo","pharmacyId":"00000000-0000-4000-8000-000000000001","pharmacyName":"Nombre de ejemplo","medicationRequestId":"00000000-0000-4000-8000-000000000001","patientName":"Nombre de ejemplo","deliveryMode":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"pickupCode":"CODIGO_EJEMPLO","totalAmount":"valor-ejemplo","currency":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"rejectionReasonText":"Texto descriptivo de ejemplo","substitutions":[{"id":"00000000-0000-4000-8000-000000000001","originalProductId":"00000000-0000-4000-8000-000000000001","originalName":"Nombre de ejemplo","originalUnitPriceAmount":"valor-ejemplo","proposedProductId":"00000000-0000-4000-8000-000000000001","proposedName":"Nombre de ejemplo","proposedUnitPriceAmount":"valor-ejemplo","currency":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"decidedAt":"valor-ejemplo"}],"lines":[{"productId":"00000000-0000-4000-8000-000000000001","medicationConceptId":"00000000-0000-4000-8000-000000000001","productCode":"CODIGO_EJEMPLO","brandName":"Nombre de ejemplo","genericName":"Nombre de ejemplo","strengthText":"valor-ejemplo","packageSizeText":"valor-ejemplo","medication":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"requestedQuantity":1,"reservedQuantity":1,"fulfilledQuantity":1,"unitPriceAmount":"valor-ejemplo","currency":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}}]}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Identificador único del pedido. | `00000000-0000-4000-8000-000000000001` |
| `items[].status` | Sí | `InventoryConceptDto` | Sin restricción adicional declarada | Estado del pedido (`PINV_ORDER_*`). | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `items[].status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].createdAt` | Sí | `string` | Sin restricción adicional declarada | Instante de creación, ISO 8601. | `valor-ejemplo` |
| `items[].expiresAt` | Sí | `string` | Sin restricción adicional declarada | Vencimiento vigente del pedido, ISO 8601 (48 h desde la creación; el carril E2 la renueva al dejarlo listo para retiro). | `valor-ejemplo` |
| `items[].siteId` | Sí | `string` | formato `uuid` | Identificador asociado a site. | `00000000-0000-4000-8000-000000000001` |
| `items[].siteName` | Sí | `string` | Sin restricción adicional declarada | Nombre de la sede. | `Nombre de ejemplo` |
| `items[].pharmacyId` | Sí | `string` | formato `uuid` | Identificador asociado a pharmacy. | `00000000-0000-4000-8000-000000000001` |
| `items[].pharmacyName` | Sí | `string` | Sin restricción adicional declarada | Nombre de la farmacia (comercial, o la razón social). | `Nombre de ejemplo` |
| `items[].medicationRequestId` | No | `string` | formato `uuid`; admite null | Receta que respalda el pedido, si la hay. | `00000000-0000-4000-8000-000000000001` |
| `items[].patientName` | No | `string` | admite null | Nombre pintable del paciente, resuelto en lote por el backend (la bandeja FAR-E2 lo necesita; cero UUIDs como copy). `null` si la persona no tiene nombre cargado. | `Nombre de ejemplo` |
| `items[].deliveryMode` | No | `InventoryConceptDto` | Sin restricción adicional declarada | Modalidad de entrega (`PINV_DELIVERY_*`), resuelta. `null` en pedidos anteriores al modelo v4.2.1, que no la declararon. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `items[].deliveryMode.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].deliveryMode.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].pickupCode` | No | `string` | admite null | Código de retiro del pedido, sellado al quedar `LISTO_PARA_RETIRO`. **Solo en la lectura del titular**: es la prueba de posesión con que la persona retira, así que la bandeja y las lecturas de staff lo sirven `null` — el mostrador no valida mirándolo, valida enviándolo en `POST /pharmacy/orders/:id/dispense`. | `CODIGO_EJEMPLO` |
| `items[].totalAmount` | No | `string` | admite null | Total CONGELADO del pedido con su moneda: suma de los precios congelados por el saldo reservado de cada renglón en pie. `null` si a algún renglón le falta precio publicado o si las listas mezclan monedas — una suma con huecos o que mezcla monedas afirma un costo que nadie publicó. Se re-congela cuando el pedido cambia (línea no disponible, sustitución aceptada); jamás se recalcula en una lectura. | `valor-ejemplo` |
| `items[].currency` | No | `InventoryConceptDto` | Sin restricción adicional declarada | Moneda del total congelado, resuelta. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `items[].currency.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].currency.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].rejectionReasonText` | No | `string` | admite null | Motivo del rechazo, en palabras, cuando el estado es `RECHAZADO` (v4.2.1 lo persiste). `null` en cualquier otro estado. | `Texto descriptivo de ejemplo` |
| `items[].substitutions` | Sí | `array<PharmacyOrderSubstitutionDto>` | Sin restricción adicional declarada | La historia de propuestas de sustitución del pedido, más nuevas primero. Las decididas conservan su estado y su `decidedAt`: son bitácora, no un campo mutable. | `[{"id":"00000000-0000-4000-8000-000000000001","originalProductId":"00000000-0000-4000-8000-000000000001","originalName":"Nombre de ejemplo","originalUnitPriceAmount":"valor-ejemplo","proposedProductId":"00000000-0000-4000-8000-000000000001","proposedName":"Nombre de ejemplo","proposedUnitPriceAmount":"valor-ejemplo","currency":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"decidedAt":"valor-ejemplo"}]` |
| `items[].substitutions[].id` | Sí | `string` | formato `uuid` | Identificador de la propuesta. | `00000000-0000-4000-8000-000000000001` |
| `items[].substitutions[].originalProductId` | Sí | `string` | formato `uuid` | Producto recetado/pedido. | `00000000-0000-4000-8000-000000000001` |
| `items[].substitutions[].originalName` | Sí | `string` | Sin restricción adicional declarada | Nombre pintable del original. | `Nombre de ejemplo` |
| `items[].substitutions[].originalUnitPriceAmount` | No | `string` | admite null | Precio congelado del original al proponer, o `null` sin precio publicado. | `valor-ejemplo` |
| `items[].substitutions[].proposedProductId` | Sí | `string` | formato `uuid` | Producto propuesto (mismo medicamento del vademécum). | `00000000-0000-4000-8000-000000000001` |
| `items[].substitutions[].proposedName` | Sí | `string` | Sin restricción adicional declarada | Nombre pintable del propuesto. | `Nombre de ejemplo` |
| `items[].substitutions[].proposedUnitPriceAmount` | No | `string` | admite null | Precio congelado del propuesto: la oferta que el paciente decidió. | `valor-ejemplo` |
| `items[].substitutions[].currency` | No | `InventoryConceptDto` | Sin restricción adicional declarada | Moneda de la oferta, resuelta. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `items[].substitutions[].currency.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].substitutions[].currency.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].substitutions[].status` | Sí | `InventoryConceptDto` | Sin restricción adicional declarada | Estado de la propuesta (`PINV_SUBSTITUTION_*`), resuelto. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `items[].substitutions[].status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].substitutions[].status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].substitutions[].decidedAt` | No | `string` | admite null | Cuándo se decidió (aceptó/rechazó/retiró), ISO 8601; `null` en pie. | `valor-ejemplo` |
| `items[].lines` | Sí | `array<PharmacyOrderLineDto>` | Sin restricción adicional declarada | Líneas del pedido. | `[{"productId":"00000000-0000-4000-8000-000000000001","medicationConceptId":"00000000-0000-4000-8000-000000000001","productCode":"CODIGO_EJEMPLO","brandName":"Nombre de ejemplo","genericName":"Nombre de ejemplo","strengthText":"valor-ejemplo","packageSizeText":"valor-ejemplo","medication":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"requestedQuantity":1,"reservedQuantity":1,"fulfilledQuantity":1,"unitPriceAmount":"valor-ejemplo","currency":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}}]` |
| `items[].lines[].productId` | Sí | `string` | formato `uuid` | Identificador asociado a product. | `00000000-0000-4000-8000-000000000001` |
| `items[].lines[].medicationConceptId` | No | `string` | formato `uuid`; admite null | Concepto de medicamento asociado al producto, cuando fue publicado. | `00000000-0000-4000-8000-000000000001` |
| `items[].lines[].productCode` | Sí | `string` | Sin restricción adicional declarada | Código interno del producto. | `CODIGO_EJEMPLO` |
| `items[].lines[].brandName` | No | `string` | admite null | Nombre comercial. | `Nombre de ejemplo` |
| `items[].lines[].genericName` | No | `string` | admite null | Nombre genérico. | `Nombre de ejemplo` |
| `items[].lines[].strengthText` | No | `string` | admite null | Concentración, legible. | `valor-ejemplo` |
| `items[].lines[].packageSizeText` | No | `string` | admite null | Presentación, legible. | `valor-ejemplo` |
| `items[].lines[].medication` | No | `InventoryConceptDto` | Sin restricción adicional declarada | Medicamento del vademécum, resuelto. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `items[].lines[].medication.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].lines[].medication.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].lines[].requestedQuantity` | Sí | `number` | Sin restricción adicional declarada | Cantidad solicitada por el paciente. | `1` |
| `items[].lines[].reservedQuantity` | Sí | `number` | Sin restricción adicional declarada | Cantidad efectivamente reservada; `0` cuando la línea quedó sin stock. | `1` |
| `items[].lines[].fulfilledQuantity` | Sí | `number` | Sin restricción adicional declarada | Cantidad ya entregada en el mostrador, acumulada entre entregas parciales (FAR-E3). El saldo por retirar es `reservedQuantity − fulfilledQuantity`. | `1` |
| `items[].lines[].unitPriceAmount` | No | `string` | admite null | Precio unitario CONGELADO del renglón (lo que paga el paciente), sellado al crear el pedido o al aceptar una sustitución. `null` si la sede no publicaba precio: el GET no recalcula — un precio congelado que se recalcula contra listas nuevas reescribe un pedido histórico. | `valor-ejemplo` |
| `items[].lines[].currency` | No | `InventoryConceptDto` | Sin restricción adicional declarada | Moneda del precio congelado, resuelta. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `items[].lines[].currency.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].lines[].currency.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].lines[].status` | Sí | `InventoryConceptDto` | Sin restricción adicional declarada | Estado de la línea (`PINV_RES_LINE_CONFIRMED` reservada, `PINV_RES_LINE_OUT_OF_STOCK` sin stock, `PINV_RES_LINE_RELEASED` liberada). | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `items[].lines[].status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].lines[].status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Cuántos pedidos se sirven. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | El proveedor configurado para el canal in-app no existe | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 422 | `PRECONDITION_FAILED` | Estado de pedido desconocido | Excepción explícita en src/modules/pharmacy_inventory/services/pharmacy-orders.service.ts |
| 422 | `PRECONDITION_FAILED` | No hay canal in-app activo: falta correr el seed de mensajería | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 422 | `PRECONDITION_FAILED` | El canal in-app no tiene configuración de proveedor activa | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pharmacy/orders"
}
```

---

## 17. POST /pharmacy/orders

- **Módulo:** `pharmacy_inventory`
- **Etiqueta OpenAPI:** `pharmacy-orders`
- **Nombre:** Crear un pedido de farmacia (FAR-E1)
- **Operation ID:** `PharmacyOrdersController_create`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyOrdersController.create](../../src/modules/pharmacy_inventory/controllers/pharmacy-orders.controller.ts)

### Descripción de negocio

El paciente sale del token. Reserva parcial: una línea sin stock queda SIN_STOCK y no tumba el pedido. Repetir la misma idempotencyKey devuelve el pedido ya creado.

Contexto declarado en el controlador: FAR-E1: crear el pedido (nace `ENVIADO`, vence a las 48 h).

### Descripción del sistema

NestJS resuelve `POST /pharmacy/orders` en `PharmacyOrdersController_create`. El controlador delega en `PharmacyOrdersService.create`. Valida el body como `CreatePharmacyOrderDto` y consume `application/json`. El tipo de retorno estático es `Promise<PharmacyOrderDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreatePharmacyOrderDto`; los campos opcionales se omiten.

```http
POST /pharmacy/orders HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "siteId": "00000000-0000-4000-8000-000000000001",
  "lines": [
    {
      "productId": "00000000-0000-4000-8000-000000000001",
      "quantity": 1
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PATIENT`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `siteId` | Sí | `string` | formato `uuid` | Sede de farmacia | `00000000-0000-4000-8000-000000000001` |
| `medicationRequestId` | No | `string` | formato `uuid` | Receta (clinical.medication_requests) | `00000000-0000-4000-8000-000000000001` |
| `deliveryMode` | No | `string` | valores: `RETIRO`, `DOMICILIO`, `TRABAJO` | Sin descripción específica en el contrato OpenAPI. | `RETIRO` |
| `idempotencyKey` | No | `string` | longitud máxima 120 | Clave de idempotencia; repetirla devuelve el mismo pedido | `valor-ejemplo` |
| `lines` | Sí | `array<PharmacyOrderLineInputDto>` | mínimo 1 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"productId":"00000000-0000-4000-8000-000000000001","quantity":1}]` |
| `lines[].productId` | Sí | `string` | formato `uuid` | Producto de farmacia | `00000000-0000-4000-8000-000000000001` |
| `lines[].quantity` | Sí | `number` | mínimo 0; mayor que 0 | Cantidad solicitada | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /pharmacy/orders HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "siteId": "00000000-0000-4000-8000-000000000001",
  "medicationRequestId": "00000000-0000-4000-8000-000000000001",
  "deliveryMode": "RETIRO",
  "idempotencyKey": "valor-ejemplo",
  "lines": [
    {
      "productId": "00000000-0000-4000-8000-000000000001",
      "quantity": 1
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 400 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 413 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PharmacyOrderDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "status": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "createdAt": "valor-ejemplo",
  "expiresAt": "valor-ejemplo",
  "siteId": "00000000-0000-4000-8000-000000000001",
  "siteName": "Nombre de ejemplo",
  "pharmacyId": "00000000-0000-4000-8000-000000000001",
  "pharmacyName": "Nombre de ejemplo",
  "medicationRequestId": "00000000-0000-4000-8000-000000000001",
  "patientName": "Nombre de ejemplo",
  "deliveryMode": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "pickupCode": "CODIGO_EJEMPLO",
  "totalAmount": "valor-ejemplo",
  "currency": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "rejectionReasonText": "Texto descriptivo de ejemplo",
  "substitutions": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "originalProductId": "00000000-0000-4000-8000-000000000001",
      "originalName": "Nombre de ejemplo",
      "originalUnitPriceAmount": "valor-ejemplo",
      "proposedProductId": "00000000-0000-4000-8000-000000000001",
      "proposedName": "Nombre de ejemplo",
      "proposedUnitPriceAmount": "valor-ejemplo",
      "currency": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "status": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "decidedAt": "valor-ejemplo"
    }
  ],
  "lines": [
    {
      "productId": "00000000-0000-4000-8000-000000000001",
      "medicationConceptId": "00000000-0000-4000-8000-000000000001",
      "productCode": "CODIGO_EJEMPLO",
      "brandName": "Nombre de ejemplo",
      "genericName": "Nombre de ejemplo",
      "strengthText": "valor-ejemplo",
      "packageSizeText": "valor-ejemplo",
      "medication": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "requestedQuantity": 1,
      "reservedQuantity": 1,
      "fulfilledQuantity": 1,
      "unitPriceAmount": "valor-ejemplo",
      "currency": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "status": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      }
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único del pedido. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `InventoryConceptDto` | Sin restricción adicional declarada | Estado del pedido (`PINV_ORDER_*`). | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `createdAt` | Sí | `string` | Sin restricción adicional declarada | Instante de creación, ISO 8601. | `valor-ejemplo` |
| `expiresAt` | Sí | `string` | Sin restricción adicional declarada | Vencimiento vigente del pedido, ISO 8601 (48 h desde la creación; el carril E2 la renueva al dejarlo listo para retiro). | `valor-ejemplo` |
| `siteId` | Sí | `string` | formato `uuid` | Identificador asociado a site. | `00000000-0000-4000-8000-000000000001` |
| `siteName` | Sí | `string` | Sin restricción adicional declarada | Nombre de la sede. | `Nombre de ejemplo` |
| `pharmacyId` | Sí | `string` | formato `uuid` | Identificador asociado a pharmacy. | `00000000-0000-4000-8000-000000000001` |
| `pharmacyName` | Sí | `string` | Sin restricción adicional declarada | Nombre de la farmacia (comercial, o la razón social). | `Nombre de ejemplo` |
| `medicationRequestId` | No | `string` | formato `uuid`; admite null | Receta que respalda el pedido, si la hay. | `00000000-0000-4000-8000-000000000001` |
| `patientName` | No | `string` | admite null | Nombre pintable del paciente, resuelto en lote por el backend (la bandeja FAR-E2 lo necesita; cero UUIDs como copy). `null` si la persona no tiene nombre cargado. | `Nombre de ejemplo` |
| `deliveryMode` | No | `InventoryConceptDto` | Sin restricción adicional declarada | Modalidad de entrega (`PINV_DELIVERY_*`), resuelta. `null` en pedidos anteriores al modelo v4.2.1, que no la declararon. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `deliveryMode.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `deliveryMode.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `pickupCode` | No | `string` | admite null | Código de retiro del pedido, sellado al quedar `LISTO_PARA_RETIRO`. **Solo en la lectura del titular**: es la prueba de posesión con que la persona retira, así que la bandeja y las lecturas de staff lo sirven `null` — el mostrador no valida mirándolo, valida enviándolo en `POST /pharmacy/orders/:id/dispense`. | `CODIGO_EJEMPLO` |
| `totalAmount` | No | `string` | admite null | Total CONGELADO del pedido con su moneda: suma de los precios congelados por el saldo reservado de cada renglón en pie. `null` si a algún renglón le falta precio publicado o si las listas mezclan monedas — una suma con huecos o que mezcla monedas afirma un costo que nadie publicó. Se re-congela cuando el pedido cambia (línea no disponible, sustitución aceptada); jamás se recalcula en una lectura. | `valor-ejemplo` |
| `currency` | No | `InventoryConceptDto` | Sin restricción adicional declarada | Moneda del total congelado, resuelta. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `currency.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `currency.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `rejectionReasonText` | No | `string` | admite null | Motivo del rechazo, en palabras, cuando el estado es `RECHAZADO` (v4.2.1 lo persiste). `null` en cualquier otro estado. | `Texto descriptivo de ejemplo` |
| `substitutions` | Sí | `array<PharmacyOrderSubstitutionDto>` | Sin restricción adicional declarada | La historia de propuestas de sustitución del pedido, más nuevas primero. Las decididas conservan su estado y su `decidedAt`: son bitácora, no un campo mutable. | `[{"id":"00000000-0000-4000-8000-000000000001","originalProductId":"00000000-0000-4000-8000-000000000001","originalName":"Nombre de ejemplo","originalUnitPriceAmount":"valor-ejemplo","proposedProductId":"00000000-0000-4000-8000-000000000001","proposedName":"Nombre de ejemplo","proposedUnitPriceAmount":"valor-ejemplo","currency":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"decidedAt":"valor-ejemplo"}]` |
| `substitutions[].id` | Sí | `string` | formato `uuid` | Identificador de la propuesta. | `00000000-0000-4000-8000-000000000001` |
| `substitutions[].originalProductId` | Sí | `string` | formato `uuid` | Producto recetado/pedido. | `00000000-0000-4000-8000-000000000001` |
| `substitutions[].originalName` | Sí | `string` | Sin restricción adicional declarada | Nombre pintable del original. | `Nombre de ejemplo` |
| `substitutions[].originalUnitPriceAmount` | No | `string` | admite null | Precio congelado del original al proponer, o `null` sin precio publicado. | `valor-ejemplo` |
| `substitutions[].proposedProductId` | Sí | `string` | formato `uuid` | Producto propuesto (mismo medicamento del vademécum). | `00000000-0000-4000-8000-000000000001` |
| `substitutions[].proposedName` | Sí | `string` | Sin restricción adicional declarada | Nombre pintable del propuesto. | `Nombre de ejemplo` |
| `substitutions[].proposedUnitPriceAmount` | No | `string` | admite null | Precio congelado del propuesto: la oferta que el paciente decidió. | `valor-ejemplo` |
| `substitutions[].currency` | No | `InventoryConceptDto` | Sin restricción adicional declarada | Moneda de la oferta, resuelta. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `substitutions[].currency.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `substitutions[].currency.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `substitutions[].status` | Sí | `InventoryConceptDto` | Sin restricción adicional declarada | Estado de la propuesta (`PINV_SUBSTITUTION_*`), resuelto. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `substitutions[].status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `substitutions[].status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `substitutions[].decidedAt` | No | `string` | admite null | Cuándo se decidió (aceptó/rechazó/retiró), ISO 8601; `null` en pie. | `valor-ejemplo` |
| `lines` | Sí | `array<PharmacyOrderLineDto>` | Sin restricción adicional declarada | Líneas del pedido. | `[{"productId":"00000000-0000-4000-8000-000000000001","medicationConceptId":"00000000-0000-4000-8000-000000000001","productCode":"CODIGO_EJEMPLO","brandName":"Nombre de ejemplo","genericName":"Nombre de ejemplo","strengthText":"valor-ejemplo","packageSizeText":"valor-ejemplo","medication":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"requestedQuantity":1,"reservedQuantity":1,"fulfilledQuantity":1,"unitPriceAmount":"valor-ejemplo","currency":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}}]` |
| `lines[].productId` | Sí | `string` | formato `uuid` | Identificador asociado a product. | `00000000-0000-4000-8000-000000000001` |
| `lines[].medicationConceptId` | No | `string` | formato `uuid`; admite null | Concepto de medicamento asociado al producto, cuando fue publicado. | `00000000-0000-4000-8000-000000000001` |
| `lines[].productCode` | Sí | `string` | Sin restricción adicional declarada | Código interno del producto. | `CODIGO_EJEMPLO` |
| `lines[].brandName` | No | `string` | admite null | Nombre comercial. | `Nombre de ejemplo` |
| `lines[].genericName` | No | `string` | admite null | Nombre genérico. | `Nombre de ejemplo` |
| `lines[].strengthText` | No | `string` | admite null | Concentración, legible. | `valor-ejemplo` |
| `lines[].packageSizeText` | No | `string` | admite null | Presentación, legible. | `valor-ejemplo` |
| `lines[].medication` | No | `InventoryConceptDto` | Sin restricción adicional declarada | Medicamento del vademécum, resuelto. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `lines[].medication.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `lines[].medication.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines[].requestedQuantity` | Sí | `number` | Sin restricción adicional declarada | Cantidad solicitada por el paciente. | `1` |
| `lines[].reservedQuantity` | Sí | `number` | Sin restricción adicional declarada | Cantidad efectivamente reservada; `0` cuando la línea quedó sin stock. | `1` |
| `lines[].fulfilledQuantity` | Sí | `number` | Sin restricción adicional declarada | Cantidad ya entregada en el mostrador, acumulada entre entregas parciales (FAR-E3). El saldo por retirar es `reservedQuantity − fulfilledQuantity`. | `1` |
| `lines[].unitPriceAmount` | No | `string` | admite null | Precio unitario CONGELADO del renglón (lo que paga el paciente), sellado al crear el pedido o al aceptar una sustitución. `null` si la sede no publicaba precio: el GET no recalcula — un precio congelado que se recalcula contra listas nuevas reescribe un pedido histórico. | `valor-ejemplo` |
| `lines[].currency` | No | `InventoryConceptDto` | Sin restricción adicional declarada | Moneda del precio congelado, resuelta. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `lines[].currency.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `lines[].currency.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines[].status` | Sí | `InventoryConceptDto` | Sin restricción adicional declarada | Estado de la línea (`PINV_RES_LINE_CONFIRMED` reservada, `PINV_RES_LINE_OUT_OF_STOCK` sin stock, `PINV_RES_LINE_RELEASED` liberada). | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `lines[].status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `lines[].status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PATIENT. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Sede de farmacia no encontrada | Excepción explícita en src/modules/pharmacy_inventory/services/pharmacy-orders.service.ts |
| 404 | `NOT_FOUND` | Receta no encontrada | Excepción explícita en src/modules/pharmacy_inventory/services/pharmacy-orders.service.ts |
| 404 | `NOT_FOUND` | Producto no disponible en la sede | Excepción explícita en src/modules/pharmacy_inventory/services/pharmacy-orders.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La cuenta autenticada no tiene perfil de paciente | Excepción explícita en src/modules/pharmacy_inventory/services/pharmacy-orders.service.ts |
| 422 | `PRECONDITION_FAILED` | El pedido repite productos; use una línea por producto | Excepción explícita en src/modules/pharmacy_inventory/services/pharmacy-orders.service.ts |
| 422 | `PRECONDITION_FAILED` | El envío a domicilio o al trabajo llega con el carril de envío (FAR-E4); hoy solo RETIRO | Excepción explícita en src/modules/pharmacy_inventory/services/pharmacy-orders.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pharmacy/orders"
}
```

---

## 18. GET /pharmacy/orders/{id}

- **Módulo:** `pharmacy_inventory`
- **Etiqueta OpenAPI:** `pharmacy-orders`
- **Nombre:** Consultar un pedido de farmacia (FAR-E1)
- **Operation ID:** `PharmacyOrdersController_getOrder`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyOrdersController.getOrder](../../src/modules/pharmacy_inventory/controllers/pharmacy-orders.controller.ts)

### Descripción de negocio

Lo ve su titular o el staff del tenant de la farmacia; cualquier tercero recibe el mismo 404.

Contexto declarado en el controlador: FAR-E1: un pedido (titular o staff del tenant; terceros: 404).

### Descripción del sistema

NestJS resuelve `GET /pharmacy/orders/{id}` en `PharmacyOrdersController_getOrder`. El controlador delega en `PharmacyOrdersService.getOrder`. No recibe body. El tipo de retorno estático es `Promise<PharmacyOrderDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /pharmacy/orders/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PATIENT`, `SECURITY_ADMIN`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /pharmacy/orders/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<PharmacyOrderDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PharmacyOrderDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "status": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "createdAt": "valor-ejemplo",
  "expiresAt": "valor-ejemplo",
  "siteId": "00000000-0000-4000-8000-000000000001",
  "siteName": "Nombre de ejemplo",
  "pharmacyId": "00000000-0000-4000-8000-000000000001",
  "pharmacyName": "Nombre de ejemplo",
  "medicationRequestId": "00000000-0000-4000-8000-000000000001",
  "patientName": "Nombre de ejemplo",
  "deliveryMode": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "pickupCode": "CODIGO_EJEMPLO",
  "totalAmount": "valor-ejemplo",
  "currency": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "rejectionReasonText": "Texto descriptivo de ejemplo",
  "substitutions": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "originalProductId": "00000000-0000-4000-8000-000000000001",
      "originalName": "Nombre de ejemplo",
      "originalUnitPriceAmount": "valor-ejemplo",
      "proposedProductId": "00000000-0000-4000-8000-000000000001",
      "proposedName": "Nombre de ejemplo",
      "proposedUnitPriceAmount": "valor-ejemplo",
      "currency": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "status": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "decidedAt": "valor-ejemplo"
    }
  ],
  "lines": [
    {
      "productId": "00000000-0000-4000-8000-000000000001",
      "medicationConceptId": "00000000-0000-4000-8000-000000000001",
      "productCode": "CODIGO_EJEMPLO",
      "brandName": "Nombre de ejemplo",
      "genericName": "Nombre de ejemplo",
      "strengthText": "valor-ejemplo",
      "packageSizeText": "valor-ejemplo",
      "medication": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "requestedQuantity": 1,
      "reservedQuantity": 1,
      "fulfilledQuantity": 1,
      "unitPriceAmount": "valor-ejemplo",
      "currency": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "status": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      }
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único del pedido. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `InventoryConceptDto` | Sin restricción adicional declarada | Estado del pedido (`PINV_ORDER_*`). | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `createdAt` | Sí | `string` | Sin restricción adicional declarada | Instante de creación, ISO 8601. | `valor-ejemplo` |
| `expiresAt` | Sí | `string` | Sin restricción adicional declarada | Vencimiento vigente del pedido, ISO 8601 (48 h desde la creación; el carril E2 la renueva al dejarlo listo para retiro). | `valor-ejemplo` |
| `siteId` | Sí | `string` | formato `uuid` | Identificador asociado a site. | `00000000-0000-4000-8000-000000000001` |
| `siteName` | Sí | `string` | Sin restricción adicional declarada | Nombre de la sede. | `Nombre de ejemplo` |
| `pharmacyId` | Sí | `string` | formato `uuid` | Identificador asociado a pharmacy. | `00000000-0000-4000-8000-000000000001` |
| `pharmacyName` | Sí | `string` | Sin restricción adicional declarada | Nombre de la farmacia (comercial, o la razón social). | `Nombre de ejemplo` |
| `medicationRequestId` | No | `string` | formato `uuid`; admite null | Receta que respalda el pedido, si la hay. | `00000000-0000-4000-8000-000000000001` |
| `patientName` | No | `string` | admite null | Nombre pintable del paciente, resuelto en lote por el backend (la bandeja FAR-E2 lo necesita; cero UUIDs como copy). `null` si la persona no tiene nombre cargado. | `Nombre de ejemplo` |
| `deliveryMode` | No | `InventoryConceptDto` | Sin restricción adicional declarada | Modalidad de entrega (`PINV_DELIVERY_*`), resuelta. `null` en pedidos anteriores al modelo v4.2.1, que no la declararon. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `deliveryMode.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `deliveryMode.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `pickupCode` | No | `string` | admite null | Código de retiro del pedido, sellado al quedar `LISTO_PARA_RETIRO`. **Solo en la lectura del titular**: es la prueba de posesión con que la persona retira, así que la bandeja y las lecturas de staff lo sirven `null` — el mostrador no valida mirándolo, valida enviándolo en `POST /pharmacy/orders/:id/dispense`. | `CODIGO_EJEMPLO` |
| `totalAmount` | No | `string` | admite null | Total CONGELADO del pedido con su moneda: suma de los precios congelados por el saldo reservado de cada renglón en pie. `null` si a algún renglón le falta precio publicado o si las listas mezclan monedas — una suma con huecos o que mezcla monedas afirma un costo que nadie publicó. Se re-congela cuando el pedido cambia (línea no disponible, sustitución aceptada); jamás se recalcula en una lectura. | `valor-ejemplo` |
| `currency` | No | `InventoryConceptDto` | Sin restricción adicional declarada | Moneda del total congelado, resuelta. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `currency.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `currency.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `rejectionReasonText` | No | `string` | admite null | Motivo del rechazo, en palabras, cuando el estado es `RECHAZADO` (v4.2.1 lo persiste). `null` en cualquier otro estado. | `Texto descriptivo de ejemplo` |
| `substitutions` | Sí | `array<PharmacyOrderSubstitutionDto>` | Sin restricción adicional declarada | La historia de propuestas de sustitución del pedido, más nuevas primero. Las decididas conservan su estado y su `decidedAt`: son bitácora, no un campo mutable. | `[{"id":"00000000-0000-4000-8000-000000000001","originalProductId":"00000000-0000-4000-8000-000000000001","originalName":"Nombre de ejemplo","originalUnitPriceAmount":"valor-ejemplo","proposedProductId":"00000000-0000-4000-8000-000000000001","proposedName":"Nombre de ejemplo","proposedUnitPriceAmount":"valor-ejemplo","currency":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"decidedAt":"valor-ejemplo"}]` |
| `substitutions[].id` | Sí | `string` | formato `uuid` | Identificador de la propuesta. | `00000000-0000-4000-8000-000000000001` |
| `substitutions[].originalProductId` | Sí | `string` | formato `uuid` | Producto recetado/pedido. | `00000000-0000-4000-8000-000000000001` |
| `substitutions[].originalName` | Sí | `string` | Sin restricción adicional declarada | Nombre pintable del original. | `Nombre de ejemplo` |
| `substitutions[].originalUnitPriceAmount` | No | `string` | admite null | Precio congelado del original al proponer, o `null` sin precio publicado. | `valor-ejemplo` |
| `substitutions[].proposedProductId` | Sí | `string` | formato `uuid` | Producto propuesto (mismo medicamento del vademécum). | `00000000-0000-4000-8000-000000000001` |
| `substitutions[].proposedName` | Sí | `string` | Sin restricción adicional declarada | Nombre pintable del propuesto. | `Nombre de ejemplo` |
| `substitutions[].proposedUnitPriceAmount` | No | `string` | admite null | Precio congelado del propuesto: la oferta que el paciente decidió. | `valor-ejemplo` |
| `substitutions[].currency` | No | `InventoryConceptDto` | Sin restricción adicional declarada | Moneda de la oferta, resuelta. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `substitutions[].currency.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `substitutions[].currency.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `substitutions[].status` | Sí | `InventoryConceptDto` | Sin restricción adicional declarada | Estado de la propuesta (`PINV_SUBSTITUTION_*`), resuelto. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `substitutions[].status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `substitutions[].status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `substitutions[].decidedAt` | No | `string` | admite null | Cuándo se decidió (aceptó/rechazó/retiró), ISO 8601; `null` en pie. | `valor-ejemplo` |
| `lines` | Sí | `array<PharmacyOrderLineDto>` | Sin restricción adicional declarada | Líneas del pedido. | `[{"productId":"00000000-0000-4000-8000-000000000001","medicationConceptId":"00000000-0000-4000-8000-000000000001","productCode":"CODIGO_EJEMPLO","brandName":"Nombre de ejemplo","genericName":"Nombre de ejemplo","strengthText":"valor-ejemplo","packageSizeText":"valor-ejemplo","medication":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"requestedQuantity":1,"reservedQuantity":1,"fulfilledQuantity":1,"unitPriceAmount":"valor-ejemplo","currency":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}}]` |
| `lines[].productId` | Sí | `string` | formato `uuid` | Identificador asociado a product. | `00000000-0000-4000-8000-000000000001` |
| `lines[].medicationConceptId` | No | `string` | formato `uuid`; admite null | Concepto de medicamento asociado al producto, cuando fue publicado. | `00000000-0000-4000-8000-000000000001` |
| `lines[].productCode` | Sí | `string` | Sin restricción adicional declarada | Código interno del producto. | `CODIGO_EJEMPLO` |
| `lines[].brandName` | No | `string` | admite null | Nombre comercial. | `Nombre de ejemplo` |
| `lines[].genericName` | No | `string` | admite null | Nombre genérico. | `Nombre de ejemplo` |
| `lines[].strengthText` | No | `string` | admite null | Concentración, legible. | `valor-ejemplo` |
| `lines[].packageSizeText` | No | `string` | admite null | Presentación, legible. | `valor-ejemplo` |
| `lines[].medication` | No | `InventoryConceptDto` | Sin restricción adicional declarada | Medicamento del vademécum, resuelto. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `lines[].medication.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `lines[].medication.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines[].requestedQuantity` | Sí | `number` | Sin restricción adicional declarada | Cantidad solicitada por el paciente. | `1` |
| `lines[].reservedQuantity` | Sí | `number` | Sin restricción adicional declarada | Cantidad efectivamente reservada; `0` cuando la línea quedó sin stock. | `1` |
| `lines[].fulfilledQuantity` | Sí | `number` | Sin restricción adicional declarada | Cantidad ya entregada en el mostrador, acumulada entre entregas parciales (FAR-E3). El saldo por retirar es `reservedQuantity − fulfilledQuantity`. | `1` |
| `lines[].unitPriceAmount` | No | `string` | admite null | Precio unitario CONGELADO del renglón (lo que paga el paciente), sellado al crear el pedido o al aceptar una sustitución. `null` si la sede no publicaba precio: el GET no recalcula — un precio congelado que se recalcula contra listas nuevas reescribe un pedido histórico. | `valor-ejemplo` |
| `lines[].currency` | No | `InventoryConceptDto` | Sin restricción adicional declarada | Moneda del precio congelado, resuelta. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `lines[].currency.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `lines[].currency.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines[].status` | Sí | `InventoryConceptDto` | Sin restricción adicional declarada | Estado de la línea (`PINV_RES_LINE_CONFIRMED` reservada, `PINV_RES_LINE_OUT_OF_STOCK` sin stock, `PINV_RES_LINE_RELEASED` liberada). | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `lines[].status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `lines[].status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PATIENT, SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | El proveedor configurado para el canal in-app no existe | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 422 | `PRECONDITION_FAILED` | No hay canal in-app activo: falta correr el seed de mensajería | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 422 | `PRECONDITION_FAILED` | El canal in-app no tiene configuración de proveedor activa | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pharmacy/orders/{id}"
}
```

---

## 19. POST /pharmacy/orders/{id}/accept-substitutions

- **Módulo:** `pharmacy_inventory`
- **Etiqueta OpenAPI:** `pharmacy-orders`
- **Nombre:** Aceptar los genéricos propuestos (paciente)
- **Operation ID:** `PharmacyOrdersController_acceptSubstitutions`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyOrdersController.acceptSubstitutions](../../src/modules/pharmacy_inventory/controllers/pharmacy-orders.controller.ts)

### Descripción de negocio

Devuelve el stock del original, reserva el propuesto con la misma contabilidad y re-congela el total con el precio de la oferta. La propuesta queda como historia (ACEPTADA + decided_at).

Contexto declarado en el controlador: FAR-E2/I2: el titular acepta los genéricos propuestos. Todo-o-nada, como los dos botones del front: `ACEPTACION_PENDIENTE → ACEPTADO`.

### Descripción del sistema

NestJS resuelve `POST /pharmacy/orders/{id}/accept-substitutions` en `PharmacyOrdersController_acceptSubstitutions`. El controlador delega en `PharmacyOrdersService.acceptSubstitutions`. No recibe body. El tipo de retorno estático es `Promise<PharmacyOrderDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /pharmacy/orders/00000000-0000-4000-8000-000000000001/accept-substitutions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PATIENT`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /pharmacy/orders/00000000-0000-4000-8000-000000000001/accept-substitutions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 400 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 404 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PharmacyOrderDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "status": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "createdAt": "valor-ejemplo",
  "expiresAt": "valor-ejemplo",
  "siteId": "00000000-0000-4000-8000-000000000001",
  "siteName": "Nombre de ejemplo",
  "pharmacyId": "00000000-0000-4000-8000-000000000001",
  "pharmacyName": "Nombre de ejemplo",
  "medicationRequestId": "00000000-0000-4000-8000-000000000001",
  "patientName": "Nombre de ejemplo",
  "deliveryMode": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "pickupCode": "CODIGO_EJEMPLO",
  "totalAmount": "valor-ejemplo",
  "currency": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "rejectionReasonText": "Texto descriptivo de ejemplo",
  "substitutions": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "originalProductId": "00000000-0000-4000-8000-000000000001",
      "originalName": "Nombre de ejemplo",
      "originalUnitPriceAmount": "valor-ejemplo",
      "proposedProductId": "00000000-0000-4000-8000-000000000001",
      "proposedName": "Nombre de ejemplo",
      "proposedUnitPriceAmount": "valor-ejemplo",
      "currency": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "status": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "decidedAt": "valor-ejemplo"
    }
  ],
  "lines": [
    {
      "productId": "00000000-0000-4000-8000-000000000001",
      "medicationConceptId": "00000000-0000-4000-8000-000000000001",
      "productCode": "CODIGO_EJEMPLO",
      "brandName": "Nombre de ejemplo",
      "genericName": "Nombre de ejemplo",
      "strengthText": "valor-ejemplo",
      "packageSizeText": "valor-ejemplo",
      "medication": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "requestedQuantity": 1,
      "reservedQuantity": 1,
      "fulfilledQuantity": 1,
      "unitPriceAmount": "valor-ejemplo",
      "currency": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "status": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      }
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único del pedido. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `InventoryConceptDto` | Sin restricción adicional declarada | Estado del pedido (`PINV_ORDER_*`). | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `createdAt` | Sí | `string` | Sin restricción adicional declarada | Instante de creación, ISO 8601. | `valor-ejemplo` |
| `expiresAt` | Sí | `string` | Sin restricción adicional declarada | Vencimiento vigente del pedido, ISO 8601 (48 h desde la creación; el carril E2 la renueva al dejarlo listo para retiro). | `valor-ejemplo` |
| `siteId` | Sí | `string` | formato `uuid` | Identificador asociado a site. | `00000000-0000-4000-8000-000000000001` |
| `siteName` | Sí | `string` | Sin restricción adicional declarada | Nombre de la sede. | `Nombre de ejemplo` |
| `pharmacyId` | Sí | `string` | formato `uuid` | Identificador asociado a pharmacy. | `00000000-0000-4000-8000-000000000001` |
| `pharmacyName` | Sí | `string` | Sin restricción adicional declarada | Nombre de la farmacia (comercial, o la razón social). | `Nombre de ejemplo` |
| `medicationRequestId` | No | `string` | formato `uuid`; admite null | Receta que respalda el pedido, si la hay. | `00000000-0000-4000-8000-000000000001` |
| `patientName` | No | `string` | admite null | Nombre pintable del paciente, resuelto en lote por el backend (la bandeja FAR-E2 lo necesita; cero UUIDs como copy). `null` si la persona no tiene nombre cargado. | `Nombre de ejemplo` |
| `deliveryMode` | No | `InventoryConceptDto` | Sin restricción adicional declarada | Modalidad de entrega (`PINV_DELIVERY_*`), resuelta. `null` en pedidos anteriores al modelo v4.2.1, que no la declararon. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `deliveryMode.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `deliveryMode.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `pickupCode` | No | `string` | admite null | Código de retiro del pedido, sellado al quedar `LISTO_PARA_RETIRO`. **Solo en la lectura del titular**: es la prueba de posesión con que la persona retira, así que la bandeja y las lecturas de staff lo sirven `null` — el mostrador no valida mirándolo, valida enviándolo en `POST /pharmacy/orders/:id/dispense`. | `CODIGO_EJEMPLO` |
| `totalAmount` | No | `string` | admite null | Total CONGELADO del pedido con su moneda: suma de los precios congelados por el saldo reservado de cada renglón en pie. `null` si a algún renglón le falta precio publicado o si las listas mezclan monedas — una suma con huecos o que mezcla monedas afirma un costo que nadie publicó. Se re-congela cuando el pedido cambia (línea no disponible, sustitución aceptada); jamás se recalcula en una lectura. | `valor-ejemplo` |
| `currency` | No | `InventoryConceptDto` | Sin restricción adicional declarada | Moneda del total congelado, resuelta. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `currency.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `currency.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `rejectionReasonText` | No | `string` | admite null | Motivo del rechazo, en palabras, cuando el estado es `RECHAZADO` (v4.2.1 lo persiste). `null` en cualquier otro estado. | `Texto descriptivo de ejemplo` |
| `substitutions` | Sí | `array<PharmacyOrderSubstitutionDto>` | Sin restricción adicional declarada | La historia de propuestas de sustitución del pedido, más nuevas primero. Las decididas conservan su estado y su `decidedAt`: son bitácora, no un campo mutable. | `[{"id":"00000000-0000-4000-8000-000000000001","originalProductId":"00000000-0000-4000-8000-000000000001","originalName":"Nombre de ejemplo","originalUnitPriceAmount":"valor-ejemplo","proposedProductId":"00000000-0000-4000-8000-000000000001","proposedName":"Nombre de ejemplo","proposedUnitPriceAmount":"valor-ejemplo","currency":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"decidedAt":"valor-ejemplo"}]` |
| `substitutions[].id` | Sí | `string` | formato `uuid` | Identificador de la propuesta. | `00000000-0000-4000-8000-000000000001` |
| `substitutions[].originalProductId` | Sí | `string` | formato `uuid` | Producto recetado/pedido. | `00000000-0000-4000-8000-000000000001` |
| `substitutions[].originalName` | Sí | `string` | Sin restricción adicional declarada | Nombre pintable del original. | `Nombre de ejemplo` |
| `substitutions[].originalUnitPriceAmount` | No | `string` | admite null | Precio congelado del original al proponer, o `null` sin precio publicado. | `valor-ejemplo` |
| `substitutions[].proposedProductId` | Sí | `string` | formato `uuid` | Producto propuesto (mismo medicamento del vademécum). | `00000000-0000-4000-8000-000000000001` |
| `substitutions[].proposedName` | Sí | `string` | Sin restricción adicional declarada | Nombre pintable del propuesto. | `Nombre de ejemplo` |
| `substitutions[].proposedUnitPriceAmount` | No | `string` | admite null | Precio congelado del propuesto: la oferta que el paciente decidió. | `valor-ejemplo` |
| `substitutions[].currency` | No | `InventoryConceptDto` | Sin restricción adicional declarada | Moneda de la oferta, resuelta. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `substitutions[].currency.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `substitutions[].currency.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `substitutions[].status` | Sí | `InventoryConceptDto` | Sin restricción adicional declarada | Estado de la propuesta (`PINV_SUBSTITUTION_*`), resuelto. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `substitutions[].status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `substitutions[].status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `substitutions[].decidedAt` | No | `string` | admite null | Cuándo se decidió (aceptó/rechazó/retiró), ISO 8601; `null` en pie. | `valor-ejemplo` |
| `lines` | Sí | `array<PharmacyOrderLineDto>` | Sin restricción adicional declarada | Líneas del pedido. | `[{"productId":"00000000-0000-4000-8000-000000000001","medicationConceptId":"00000000-0000-4000-8000-000000000001","productCode":"CODIGO_EJEMPLO","brandName":"Nombre de ejemplo","genericName":"Nombre de ejemplo","strengthText":"valor-ejemplo","packageSizeText":"valor-ejemplo","medication":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"requestedQuantity":1,"reservedQuantity":1,"fulfilledQuantity":1,"unitPriceAmount":"valor-ejemplo","currency":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}}]` |
| `lines[].productId` | Sí | `string` | formato `uuid` | Identificador asociado a product. | `00000000-0000-4000-8000-000000000001` |
| `lines[].medicationConceptId` | No | `string` | formato `uuid`; admite null | Concepto de medicamento asociado al producto, cuando fue publicado. | `00000000-0000-4000-8000-000000000001` |
| `lines[].productCode` | Sí | `string` | Sin restricción adicional declarada | Código interno del producto. | `CODIGO_EJEMPLO` |
| `lines[].brandName` | No | `string` | admite null | Nombre comercial. | `Nombre de ejemplo` |
| `lines[].genericName` | No | `string` | admite null | Nombre genérico. | `Nombre de ejemplo` |
| `lines[].strengthText` | No | `string` | admite null | Concentración, legible. | `valor-ejemplo` |
| `lines[].packageSizeText` | No | `string` | admite null | Presentación, legible. | `valor-ejemplo` |
| `lines[].medication` | No | `InventoryConceptDto` | Sin restricción adicional declarada | Medicamento del vademécum, resuelto. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `lines[].medication.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `lines[].medication.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines[].requestedQuantity` | Sí | `number` | Sin restricción adicional declarada | Cantidad solicitada por el paciente. | `1` |
| `lines[].reservedQuantity` | Sí | `number` | Sin restricción adicional declarada | Cantidad efectivamente reservada; `0` cuando la línea quedó sin stock. | `1` |
| `lines[].fulfilledQuantity` | Sí | `number` | Sin restricción adicional declarada | Cantidad ya entregada en el mostrador, acumulada entre entregas parciales (FAR-E3). El saldo por retirar es `reservedQuantity − fulfilledQuantity`. | `1` |
| `lines[].unitPriceAmount` | No | `string` | admite null | Precio unitario CONGELADO del renglón (lo que paga el paciente), sellado al crear el pedido o al aceptar una sustitución. `null` si la sede no publicaba precio: el GET no recalcula — un precio congelado que se recalcula contra listas nuevas reescribe un pedido histórico. | `valor-ejemplo` |
| `lines[].currency` | No | `InventoryConceptDto` | Sin restricción adicional declarada | Moneda del precio congelado, resuelta. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `lines[].currency.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `lines[].currency.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines[].status` | Sí | `InventoryConceptDto` | Sin restricción adicional declarada | Estado de la línea (`PINV_RES_LINE_CONFIRMED` reservada, `PINV_RES_LINE_OUT_OF_STOCK` sin stock, `PINV_RES_LINE_RELEASED` liberada). | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `lines[].status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `lines[].status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PATIENT. | Roles/tenant/guards de autorización |
| 422 | `PRECONDITION_FAILED` | La cuenta autenticada no tiene perfil de paciente | Excepción explícita en src/modules/pharmacy_inventory/services/pharmacy-orders.service.ts |
| 422 | `PRECONDITION_FAILED` | El pedido no tiene una decisión de sustituciones pendiente | Excepción explícita en src/modules/pharmacy_inventory/services/pharmacy-orders.service.ts |
| 422 | `PRECONDITION_FAILED` | El pedido no tiene propuestas de sustitución en pie | Excepción explícita en src/modules/pharmacy_inventory/services/pharmacy-orders.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pharmacy/orders/{id}/accept-substitutions"
}
```

---

## 20. POST /pharmacy/orders/{id}/cancel

- **Módulo:** `pharmacy_inventory`
- **Etiqueta OpenAPI:** `pharmacy-orders`
- **Nombre:** Cancelar un pedido de farmacia (FAR-E1)
- **Operation ID:** `PharmacyOrdersController_cancel`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyOrdersController.cancel](../../src/modules/pharmacy_inventory/controllers/pharmacy-orders.controller.ts)

### Descripción de negocio

Solo el titular, desde cualquier estado no terminal; un terminal responde 409 sin efectos.

Contexto declarado en el controlador: FAR-E1: cancelar el propio pedido (libera el stock reservado).

### Descripción del sistema

NestJS resuelve `POST /pharmacy/orders/{id}/cancel` en `PharmacyOrdersController_cancel`. El controlador delega en `PharmacyOrdersService.cancel`. No recibe body. El tipo de retorno estático es `Promise<PharmacyOrderDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /pharmacy/orders/00000000-0000-4000-8000-000000000001/cancel HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PATIENT`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /pharmacy/orders/00000000-0000-4000-8000-000000000001/cancel HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 400 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 404 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PharmacyOrderDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "status": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "createdAt": "valor-ejemplo",
  "expiresAt": "valor-ejemplo",
  "siteId": "00000000-0000-4000-8000-000000000001",
  "siteName": "Nombre de ejemplo",
  "pharmacyId": "00000000-0000-4000-8000-000000000001",
  "pharmacyName": "Nombre de ejemplo",
  "medicationRequestId": "00000000-0000-4000-8000-000000000001",
  "patientName": "Nombre de ejemplo",
  "deliveryMode": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "pickupCode": "CODIGO_EJEMPLO",
  "totalAmount": "valor-ejemplo",
  "currency": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "rejectionReasonText": "Texto descriptivo de ejemplo",
  "substitutions": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "originalProductId": "00000000-0000-4000-8000-000000000001",
      "originalName": "Nombre de ejemplo",
      "originalUnitPriceAmount": "valor-ejemplo",
      "proposedProductId": "00000000-0000-4000-8000-000000000001",
      "proposedName": "Nombre de ejemplo",
      "proposedUnitPriceAmount": "valor-ejemplo",
      "currency": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "status": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "decidedAt": "valor-ejemplo"
    }
  ],
  "lines": [
    {
      "productId": "00000000-0000-4000-8000-000000000001",
      "medicationConceptId": "00000000-0000-4000-8000-000000000001",
      "productCode": "CODIGO_EJEMPLO",
      "brandName": "Nombre de ejemplo",
      "genericName": "Nombre de ejemplo",
      "strengthText": "valor-ejemplo",
      "packageSizeText": "valor-ejemplo",
      "medication": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "requestedQuantity": 1,
      "reservedQuantity": 1,
      "fulfilledQuantity": 1,
      "unitPriceAmount": "valor-ejemplo",
      "currency": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "status": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      }
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único del pedido. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `InventoryConceptDto` | Sin restricción adicional declarada | Estado del pedido (`PINV_ORDER_*`). | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `createdAt` | Sí | `string` | Sin restricción adicional declarada | Instante de creación, ISO 8601. | `valor-ejemplo` |
| `expiresAt` | Sí | `string` | Sin restricción adicional declarada | Vencimiento vigente del pedido, ISO 8601 (48 h desde la creación; el carril E2 la renueva al dejarlo listo para retiro). | `valor-ejemplo` |
| `siteId` | Sí | `string` | formato `uuid` | Identificador asociado a site. | `00000000-0000-4000-8000-000000000001` |
| `siteName` | Sí | `string` | Sin restricción adicional declarada | Nombre de la sede. | `Nombre de ejemplo` |
| `pharmacyId` | Sí | `string` | formato `uuid` | Identificador asociado a pharmacy. | `00000000-0000-4000-8000-000000000001` |
| `pharmacyName` | Sí | `string` | Sin restricción adicional declarada | Nombre de la farmacia (comercial, o la razón social). | `Nombre de ejemplo` |
| `medicationRequestId` | No | `string` | formato `uuid`; admite null | Receta que respalda el pedido, si la hay. | `00000000-0000-4000-8000-000000000001` |
| `patientName` | No | `string` | admite null | Nombre pintable del paciente, resuelto en lote por el backend (la bandeja FAR-E2 lo necesita; cero UUIDs como copy). `null` si la persona no tiene nombre cargado. | `Nombre de ejemplo` |
| `deliveryMode` | No | `InventoryConceptDto` | Sin restricción adicional declarada | Modalidad de entrega (`PINV_DELIVERY_*`), resuelta. `null` en pedidos anteriores al modelo v4.2.1, que no la declararon. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `deliveryMode.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `deliveryMode.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `pickupCode` | No | `string` | admite null | Código de retiro del pedido, sellado al quedar `LISTO_PARA_RETIRO`. **Solo en la lectura del titular**: es la prueba de posesión con que la persona retira, así que la bandeja y las lecturas de staff lo sirven `null` — el mostrador no valida mirándolo, valida enviándolo en `POST /pharmacy/orders/:id/dispense`. | `CODIGO_EJEMPLO` |
| `totalAmount` | No | `string` | admite null | Total CONGELADO del pedido con su moneda: suma de los precios congelados por el saldo reservado de cada renglón en pie. `null` si a algún renglón le falta precio publicado o si las listas mezclan monedas — una suma con huecos o que mezcla monedas afirma un costo que nadie publicó. Se re-congela cuando el pedido cambia (línea no disponible, sustitución aceptada); jamás se recalcula en una lectura. | `valor-ejemplo` |
| `currency` | No | `InventoryConceptDto` | Sin restricción adicional declarada | Moneda del total congelado, resuelta. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `currency.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `currency.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `rejectionReasonText` | No | `string` | admite null | Motivo del rechazo, en palabras, cuando el estado es `RECHAZADO` (v4.2.1 lo persiste). `null` en cualquier otro estado. | `Texto descriptivo de ejemplo` |
| `substitutions` | Sí | `array<PharmacyOrderSubstitutionDto>` | Sin restricción adicional declarada | La historia de propuestas de sustitución del pedido, más nuevas primero. Las decididas conservan su estado y su `decidedAt`: son bitácora, no un campo mutable. | `[{"id":"00000000-0000-4000-8000-000000000001","originalProductId":"00000000-0000-4000-8000-000000000001","originalName":"Nombre de ejemplo","originalUnitPriceAmount":"valor-ejemplo","proposedProductId":"00000000-0000-4000-8000-000000000001","proposedName":"Nombre de ejemplo","proposedUnitPriceAmount":"valor-ejemplo","currency":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"decidedAt":"valor-ejemplo"}]` |
| `substitutions[].id` | Sí | `string` | formato `uuid` | Identificador de la propuesta. | `00000000-0000-4000-8000-000000000001` |
| `substitutions[].originalProductId` | Sí | `string` | formato `uuid` | Producto recetado/pedido. | `00000000-0000-4000-8000-000000000001` |
| `substitutions[].originalName` | Sí | `string` | Sin restricción adicional declarada | Nombre pintable del original. | `Nombre de ejemplo` |
| `substitutions[].originalUnitPriceAmount` | No | `string` | admite null | Precio congelado del original al proponer, o `null` sin precio publicado. | `valor-ejemplo` |
| `substitutions[].proposedProductId` | Sí | `string` | formato `uuid` | Producto propuesto (mismo medicamento del vademécum). | `00000000-0000-4000-8000-000000000001` |
| `substitutions[].proposedName` | Sí | `string` | Sin restricción adicional declarada | Nombre pintable del propuesto. | `Nombre de ejemplo` |
| `substitutions[].proposedUnitPriceAmount` | No | `string` | admite null | Precio congelado del propuesto: la oferta que el paciente decidió. | `valor-ejemplo` |
| `substitutions[].currency` | No | `InventoryConceptDto` | Sin restricción adicional declarada | Moneda de la oferta, resuelta. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `substitutions[].currency.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `substitutions[].currency.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `substitutions[].status` | Sí | `InventoryConceptDto` | Sin restricción adicional declarada | Estado de la propuesta (`PINV_SUBSTITUTION_*`), resuelto. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `substitutions[].status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `substitutions[].status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `substitutions[].decidedAt` | No | `string` | admite null | Cuándo se decidió (aceptó/rechazó/retiró), ISO 8601; `null` en pie. | `valor-ejemplo` |
| `lines` | Sí | `array<PharmacyOrderLineDto>` | Sin restricción adicional declarada | Líneas del pedido. | `[{"productId":"00000000-0000-4000-8000-000000000001","medicationConceptId":"00000000-0000-4000-8000-000000000001","productCode":"CODIGO_EJEMPLO","brandName":"Nombre de ejemplo","genericName":"Nombre de ejemplo","strengthText":"valor-ejemplo","packageSizeText":"valor-ejemplo","medication":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"requestedQuantity":1,"reservedQuantity":1,"fulfilledQuantity":1,"unitPriceAmount":"valor-ejemplo","currency":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}}]` |
| `lines[].productId` | Sí | `string` | formato `uuid` | Identificador asociado a product. | `00000000-0000-4000-8000-000000000001` |
| `lines[].medicationConceptId` | No | `string` | formato `uuid`; admite null | Concepto de medicamento asociado al producto, cuando fue publicado. | `00000000-0000-4000-8000-000000000001` |
| `lines[].productCode` | Sí | `string` | Sin restricción adicional declarada | Código interno del producto. | `CODIGO_EJEMPLO` |
| `lines[].brandName` | No | `string` | admite null | Nombre comercial. | `Nombre de ejemplo` |
| `lines[].genericName` | No | `string` | admite null | Nombre genérico. | `Nombre de ejemplo` |
| `lines[].strengthText` | No | `string` | admite null | Concentración, legible. | `valor-ejemplo` |
| `lines[].packageSizeText` | No | `string` | admite null | Presentación, legible. | `valor-ejemplo` |
| `lines[].medication` | No | `InventoryConceptDto` | Sin restricción adicional declarada | Medicamento del vademécum, resuelto. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `lines[].medication.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `lines[].medication.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines[].requestedQuantity` | Sí | `number` | Sin restricción adicional declarada | Cantidad solicitada por el paciente. | `1` |
| `lines[].reservedQuantity` | Sí | `number` | Sin restricción adicional declarada | Cantidad efectivamente reservada; `0` cuando la línea quedó sin stock. | `1` |
| `lines[].fulfilledQuantity` | Sí | `number` | Sin restricción adicional declarada | Cantidad ya entregada en el mostrador, acumulada entre entregas parciales (FAR-E3). El saldo por retirar es `reservedQuantity − fulfilledQuantity`. | `1` |
| `lines[].unitPriceAmount` | No | `string` | admite null | Precio unitario CONGELADO del renglón (lo que paga el paciente), sellado al crear el pedido o al aceptar una sustitución. `null` si la sede no publicaba precio: el GET no recalcula — un precio congelado que se recalcula contra listas nuevas reescribe un pedido histórico. | `valor-ejemplo` |
| `lines[].currency` | No | `InventoryConceptDto` | Sin restricción adicional declarada | Moneda del precio congelado, resuelta. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `lines[].currency.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `lines[].currency.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines[].status` | Sí | `InventoryConceptDto` | Sin restricción adicional declarada | Estado de la línea (`PINV_RES_LINE_CONFIRMED` reservada, `PINV_RES_LINE_OUT_OF_STOCK` sin stock, `PINV_RES_LINE_RELEASED` liberada). | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `lines[].status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `lines[].status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PATIENT. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | El pedido ya está en un estado terminal y no puede cancelarse | Excepción explícita en src/modules/pharmacy_inventory/services/pharmacy-orders.service.ts |
| 422 | `PRECONDITION_FAILED` | La cuenta autenticada no tiene perfil de paciente | Excepción explícita en src/modules/pharmacy_inventory/services/pharmacy-orders.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pharmacy/orders/{id}/cancel"
}
```

---

## 21. POST /pharmacy/orders/{id}/confirm

- **Módulo:** `pharmacy_inventory`
- **Etiqueta OpenAPI:** `pharmacy-orders`
- **Nombre:** Confirmar el pedido (FAR-E2)
- **Operation ID:** `PharmacyOrdersController_confirm`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyOrdersController.confirm](../../src/modules/pharmacy_inventory/controllers/pharmacy-orders.controller.ts)

### Descripción de negocio

Sella confirmed_at. Un ajuste NO_DISPONIBLE libera solo esa línea. PROPONER_GENERICO (con proposedProductId del mismo medicamento) persiste la propuesta con sus precios congelados y deja el pedido en ACEPTACION_PENDIENTE: decide el paciente.

Contexto declarado en el controlador: FAR-E2: confirmar, con genéricos propuestos si el mostrador los declara.

### Descripción del sistema

NestJS resuelve `POST /pharmacy/orders/{id}/confirm` en `PharmacyOrdersController_confirm`. El controlador delega en `PharmacyOrdersService.confirm`. Valida el body como `ConfirmPharmacyOrderDto` y consume `application/json`. El tipo de retorno estático es `Promise<PharmacyOrderDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ConfirmPharmacyOrderDto`; los campos opcionales se omiten.

```http
POST /pharmacy/orders/00000000-0000-4000-8000-000000000001/confirm HTTP/1.1
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
| `adjustments` | No | `array<ConfirmOrderAdjustmentDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"productId":"00000000-0000-4000-8000-000000000001","decision":"NO_DISPONIBLE","proposedProductId":"00000000-0000-4000-8000-000000000001"}]` |
| `adjustments[].productId` | No | `string` | formato `uuid` | Producto de la línea ajustada | `00000000-0000-4000-8000-000000000001` |
| `adjustments[].decision` | No | `string` | valores: `NO_DISPONIBLE`, `PROPONER_GENERICO` | Sin descripción específica en el contrato OpenAPI. | `NO_DISPONIBLE` |
| `adjustments[].proposedProductId` | No | `string` | formato `uuid` | Producto propuesto (mismo concepto del vademécum) | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /pharmacy/orders/00000000-0000-4000-8000-000000000001/confirm HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "adjustments": [
    {
      "productId": "00000000-0000-4000-8000-000000000001",
      "decision": "NO_DISPONIBLE",
      "proposedProductId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 400 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 404 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 413 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PharmacyOrderDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "status": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "createdAt": "valor-ejemplo",
  "expiresAt": "valor-ejemplo",
  "siteId": "00000000-0000-4000-8000-000000000001",
  "siteName": "Nombre de ejemplo",
  "pharmacyId": "00000000-0000-4000-8000-000000000001",
  "pharmacyName": "Nombre de ejemplo",
  "medicationRequestId": "00000000-0000-4000-8000-000000000001",
  "patientName": "Nombre de ejemplo",
  "deliveryMode": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "pickupCode": "CODIGO_EJEMPLO",
  "totalAmount": "valor-ejemplo",
  "currency": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "rejectionReasonText": "Texto descriptivo de ejemplo",
  "substitutions": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "originalProductId": "00000000-0000-4000-8000-000000000001",
      "originalName": "Nombre de ejemplo",
      "originalUnitPriceAmount": "valor-ejemplo",
      "proposedProductId": "00000000-0000-4000-8000-000000000001",
      "proposedName": "Nombre de ejemplo",
      "proposedUnitPriceAmount": "valor-ejemplo",
      "currency": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "status": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "decidedAt": "valor-ejemplo"
    }
  ],
  "lines": [
    {
      "productId": "00000000-0000-4000-8000-000000000001",
      "medicationConceptId": "00000000-0000-4000-8000-000000000001",
      "productCode": "CODIGO_EJEMPLO",
      "brandName": "Nombre de ejemplo",
      "genericName": "Nombre de ejemplo",
      "strengthText": "valor-ejemplo",
      "packageSizeText": "valor-ejemplo",
      "medication": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "requestedQuantity": 1,
      "reservedQuantity": 1,
      "fulfilledQuantity": 1,
      "unitPriceAmount": "valor-ejemplo",
      "currency": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "status": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      }
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único del pedido. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `InventoryConceptDto` | Sin restricción adicional declarada | Estado del pedido (`PINV_ORDER_*`). | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `createdAt` | Sí | `string` | Sin restricción adicional declarada | Instante de creación, ISO 8601. | `valor-ejemplo` |
| `expiresAt` | Sí | `string` | Sin restricción adicional declarada | Vencimiento vigente del pedido, ISO 8601 (48 h desde la creación; el carril E2 la renueva al dejarlo listo para retiro). | `valor-ejemplo` |
| `siteId` | Sí | `string` | formato `uuid` | Identificador asociado a site. | `00000000-0000-4000-8000-000000000001` |
| `siteName` | Sí | `string` | Sin restricción adicional declarada | Nombre de la sede. | `Nombre de ejemplo` |
| `pharmacyId` | Sí | `string` | formato `uuid` | Identificador asociado a pharmacy. | `00000000-0000-4000-8000-000000000001` |
| `pharmacyName` | Sí | `string` | Sin restricción adicional declarada | Nombre de la farmacia (comercial, o la razón social). | `Nombre de ejemplo` |
| `medicationRequestId` | No | `string` | formato `uuid`; admite null | Receta que respalda el pedido, si la hay. | `00000000-0000-4000-8000-000000000001` |
| `patientName` | No | `string` | admite null | Nombre pintable del paciente, resuelto en lote por el backend (la bandeja FAR-E2 lo necesita; cero UUIDs como copy). `null` si la persona no tiene nombre cargado. | `Nombre de ejemplo` |
| `deliveryMode` | No | `InventoryConceptDto` | Sin restricción adicional declarada | Modalidad de entrega (`PINV_DELIVERY_*`), resuelta. `null` en pedidos anteriores al modelo v4.2.1, que no la declararon. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `deliveryMode.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `deliveryMode.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `pickupCode` | No | `string` | admite null | Código de retiro del pedido, sellado al quedar `LISTO_PARA_RETIRO`. **Solo en la lectura del titular**: es la prueba de posesión con que la persona retira, así que la bandeja y las lecturas de staff lo sirven `null` — el mostrador no valida mirándolo, valida enviándolo en `POST /pharmacy/orders/:id/dispense`. | `CODIGO_EJEMPLO` |
| `totalAmount` | No | `string` | admite null | Total CONGELADO del pedido con su moneda: suma de los precios congelados por el saldo reservado de cada renglón en pie. `null` si a algún renglón le falta precio publicado o si las listas mezclan monedas — una suma con huecos o que mezcla monedas afirma un costo que nadie publicó. Se re-congela cuando el pedido cambia (línea no disponible, sustitución aceptada); jamás se recalcula en una lectura. | `valor-ejemplo` |
| `currency` | No | `InventoryConceptDto` | Sin restricción adicional declarada | Moneda del total congelado, resuelta. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `currency.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `currency.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `rejectionReasonText` | No | `string` | admite null | Motivo del rechazo, en palabras, cuando el estado es `RECHAZADO` (v4.2.1 lo persiste). `null` en cualquier otro estado. | `Texto descriptivo de ejemplo` |
| `substitutions` | Sí | `array<PharmacyOrderSubstitutionDto>` | Sin restricción adicional declarada | La historia de propuestas de sustitución del pedido, más nuevas primero. Las decididas conservan su estado y su `decidedAt`: son bitácora, no un campo mutable. | `[{"id":"00000000-0000-4000-8000-000000000001","originalProductId":"00000000-0000-4000-8000-000000000001","originalName":"Nombre de ejemplo","originalUnitPriceAmount":"valor-ejemplo","proposedProductId":"00000000-0000-4000-8000-000000000001","proposedName":"Nombre de ejemplo","proposedUnitPriceAmount":"valor-ejemplo","currency":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"decidedAt":"valor-ejemplo"}]` |
| `substitutions[].id` | Sí | `string` | formato `uuid` | Identificador de la propuesta. | `00000000-0000-4000-8000-000000000001` |
| `substitutions[].originalProductId` | Sí | `string` | formato `uuid` | Producto recetado/pedido. | `00000000-0000-4000-8000-000000000001` |
| `substitutions[].originalName` | Sí | `string` | Sin restricción adicional declarada | Nombre pintable del original. | `Nombre de ejemplo` |
| `substitutions[].originalUnitPriceAmount` | No | `string` | admite null | Precio congelado del original al proponer, o `null` sin precio publicado. | `valor-ejemplo` |
| `substitutions[].proposedProductId` | Sí | `string` | formato `uuid` | Producto propuesto (mismo medicamento del vademécum). | `00000000-0000-4000-8000-000000000001` |
| `substitutions[].proposedName` | Sí | `string` | Sin restricción adicional declarada | Nombre pintable del propuesto. | `Nombre de ejemplo` |
| `substitutions[].proposedUnitPriceAmount` | No | `string` | admite null | Precio congelado del propuesto: la oferta que el paciente decidió. | `valor-ejemplo` |
| `substitutions[].currency` | No | `InventoryConceptDto` | Sin restricción adicional declarada | Moneda de la oferta, resuelta. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `substitutions[].currency.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `substitutions[].currency.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `substitutions[].status` | Sí | `InventoryConceptDto` | Sin restricción adicional declarada | Estado de la propuesta (`PINV_SUBSTITUTION_*`), resuelto. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `substitutions[].status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `substitutions[].status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `substitutions[].decidedAt` | No | `string` | admite null | Cuándo se decidió (aceptó/rechazó/retiró), ISO 8601; `null` en pie. | `valor-ejemplo` |
| `lines` | Sí | `array<PharmacyOrderLineDto>` | Sin restricción adicional declarada | Líneas del pedido. | `[{"productId":"00000000-0000-4000-8000-000000000001","medicationConceptId":"00000000-0000-4000-8000-000000000001","productCode":"CODIGO_EJEMPLO","brandName":"Nombre de ejemplo","genericName":"Nombre de ejemplo","strengthText":"valor-ejemplo","packageSizeText":"valor-ejemplo","medication":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"requestedQuantity":1,"reservedQuantity":1,"fulfilledQuantity":1,"unitPriceAmount":"valor-ejemplo","currency":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}}]` |
| `lines[].productId` | Sí | `string` | formato `uuid` | Identificador asociado a product. | `00000000-0000-4000-8000-000000000001` |
| `lines[].medicationConceptId` | No | `string` | formato `uuid`; admite null | Concepto de medicamento asociado al producto, cuando fue publicado. | `00000000-0000-4000-8000-000000000001` |
| `lines[].productCode` | Sí | `string` | Sin restricción adicional declarada | Código interno del producto. | `CODIGO_EJEMPLO` |
| `lines[].brandName` | No | `string` | admite null | Nombre comercial. | `Nombre de ejemplo` |
| `lines[].genericName` | No | `string` | admite null | Nombre genérico. | `Nombre de ejemplo` |
| `lines[].strengthText` | No | `string` | admite null | Concentración, legible. | `valor-ejemplo` |
| `lines[].packageSizeText` | No | `string` | admite null | Presentación, legible. | `valor-ejemplo` |
| `lines[].medication` | No | `InventoryConceptDto` | Sin restricción adicional declarada | Medicamento del vademécum, resuelto. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `lines[].medication.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `lines[].medication.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines[].requestedQuantity` | Sí | `number` | Sin restricción adicional declarada | Cantidad solicitada por el paciente. | `1` |
| `lines[].reservedQuantity` | Sí | `number` | Sin restricción adicional declarada | Cantidad efectivamente reservada; `0` cuando la línea quedó sin stock. | `1` |
| `lines[].fulfilledQuantity` | Sí | `number` | Sin restricción adicional declarada | Cantidad ya entregada en el mostrador, acumulada entre entregas parciales (FAR-E3). El saldo por retirar es `reservedQuantity − fulfilledQuantity`. | `1` |
| `lines[].unitPriceAmount` | No | `string` | admite null | Precio unitario CONGELADO del renglón (lo que paga el paciente), sellado al crear el pedido o al aceptar una sustitución. `null` si la sede no publicaba precio: el GET no recalcula — un precio congelado que se recalcula contra listas nuevas reescribe un pedido histórico. | `valor-ejemplo` |
| `lines[].currency` | No | `InventoryConceptDto` | Sin restricción adicional declarada | Moneda del precio congelado, resuelta. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `lines[].currency.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `lines[].currency.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines[].status` | Sí | `InventoryConceptDto` | Sin restricción adicional declarada | Estado de la línea (`PINV_RES_LINE_CONFIRMED` reservada, `PINV_RES_LINE_OUT_OF_STOCK` sin stock, `PINV_RES_LINE_RELEASED` liberada). | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `lines[].status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `lines[].status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | El proveedor configurado para el canal in-app no existe | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El ajuste refiere un producto que no está en el pedido | Excepción explícita en src/modules/pharmacy_inventory/services/pharmacy-orders.service.ts |
| 422 | `PRECONDITION_FAILED` | Hay más de un ajuste para el mismo renglón | Excepción explícita en src/modules/pharmacy_inventory/services/pharmacy-orders.service.ts |
| 422 | `PRECONDITION_FAILED` | La transición no es legal para el estado actual del pedido | Excepción explícita en src/modules/pharmacy_inventory/services/pharmacy-orders.service.ts |
| 422 | `PRECONDITION_FAILED` | PROPONER_GENERICO exige el producto propuesto (proposedProductId) | Excepción explícita en src/modules/pharmacy_inventory/services/pharmacy-orders.service.ts |
| 422 | `PRECONDITION_FAILED` | El producto propuesto no está disponible en esta farmacia | Excepción explícita en src/modules/pharmacy_inventory/services/pharmacy-orders.service.ts |
| 422 | `PRECONDITION_FAILED` | El producto propuesto no es del mismo medicamento que el original | Excepción explícita en src/modules/pharmacy_inventory/services/pharmacy-orders.service.ts |
| 422 | `PRECONDITION_FAILED` | No hay canal in-app activo: falta correr el seed de mensajería | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 422 | `PRECONDITION_FAILED` | El canal in-app no tiene configuración de proveedor activa | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pharmacy/orders/{id}/confirm"
}
```

---

## 22. POST /pharmacy/orders/{id}/dispense

- **Módulo:** `pharmacy_inventory`
- **Etiqueta OpenAPI:** `pharmacy-orders`
- **Nombre:** Dispensar el pedido en el mostrador (FAR-E3)
- **Operation ID:** `PharmacyOrdersController_dispense`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyOrdersController.dispense](../../src/modules/pharmacy_inventory/controllers/pharmacy-orders.controller.ts)

### Descripción de negocio

Valida el código de retiro (insensible a mayúsculas; mismatch: 422 sin efectos) y entrega el saldo en pie — todo, o solo productIds. Acumula fulfilled_quantity por línea; con saldo cero el pedido pasa a RETIRADO. Repetir la idempotencyKey no duplica stock ni ledger.

Contexto declarado en el controlador: FAR-E3: la entrega en el mostrador, contra el código de retiro. Parcial acumulativa: mientras quede saldo el pedido sigue LISTO_PARA_RETIRO con el mismo código, y pasa a RETIRADO cuando la última línea se cubre.

### Descripción del sistema

NestJS resuelve `POST /pharmacy/orders/{id}/dispense` en `PharmacyOrdersController_dispense`. El controlador delega en `PharmacyOrdersService.dispense`. Valida el body como `DispensePharmacyOrderDto` y consume `application/json`. El tipo de retorno estático es `Promise<PharmacyOrderDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `DispensePharmacyOrderDto`; los campos opcionales se omiten.

```http
POST /pharmacy/orders/00000000-0000-4000-8000-000000000001/dispense HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "pickupCode": "CODIGO_EJEMPLO"
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
| `pickupCode` | Sí | `string` | longitud mínima 1; longitud máxima 20 | Código de retiro que presenta la persona | `CODIGO_EJEMPLO` |
| `productIds` | No | `array<string>` | formato `uuid`; mínimo 1 elemento(s) | Productos de esta entrega; omitido = todo el saldo en pie | `["00000000-0000-4000-8000-000000000001"]` |
| `idempotencyKey` | No | `string` | longitud máxima 120 | Clave de idempotencia; repetirla no duplica la entrega | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /pharmacy/orders/00000000-0000-4000-8000-000000000001/dispense HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "pickupCode": "CODIGO_EJEMPLO",
  "productIds": [
    "00000000-0000-4000-8000-000000000001"
  ],
  "idempotencyKey": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 400 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 404 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 413 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PharmacyOrderDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "status": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "createdAt": "valor-ejemplo",
  "expiresAt": "valor-ejemplo",
  "siteId": "00000000-0000-4000-8000-000000000001",
  "siteName": "Nombre de ejemplo",
  "pharmacyId": "00000000-0000-4000-8000-000000000001",
  "pharmacyName": "Nombre de ejemplo",
  "medicationRequestId": "00000000-0000-4000-8000-000000000001",
  "patientName": "Nombre de ejemplo",
  "deliveryMode": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "pickupCode": "CODIGO_EJEMPLO",
  "totalAmount": "valor-ejemplo",
  "currency": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "rejectionReasonText": "Texto descriptivo de ejemplo",
  "substitutions": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "originalProductId": "00000000-0000-4000-8000-000000000001",
      "originalName": "Nombre de ejemplo",
      "originalUnitPriceAmount": "valor-ejemplo",
      "proposedProductId": "00000000-0000-4000-8000-000000000001",
      "proposedName": "Nombre de ejemplo",
      "proposedUnitPriceAmount": "valor-ejemplo",
      "currency": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "status": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "decidedAt": "valor-ejemplo"
    }
  ],
  "lines": [
    {
      "productId": "00000000-0000-4000-8000-000000000001",
      "medicationConceptId": "00000000-0000-4000-8000-000000000001",
      "productCode": "CODIGO_EJEMPLO",
      "brandName": "Nombre de ejemplo",
      "genericName": "Nombre de ejemplo",
      "strengthText": "valor-ejemplo",
      "packageSizeText": "valor-ejemplo",
      "medication": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "requestedQuantity": 1,
      "reservedQuantity": 1,
      "fulfilledQuantity": 1,
      "unitPriceAmount": "valor-ejemplo",
      "currency": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "status": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      }
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único del pedido. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `InventoryConceptDto` | Sin restricción adicional declarada | Estado del pedido (`PINV_ORDER_*`). | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `createdAt` | Sí | `string` | Sin restricción adicional declarada | Instante de creación, ISO 8601. | `valor-ejemplo` |
| `expiresAt` | Sí | `string` | Sin restricción adicional declarada | Vencimiento vigente del pedido, ISO 8601 (48 h desde la creación; el carril E2 la renueva al dejarlo listo para retiro). | `valor-ejemplo` |
| `siteId` | Sí | `string` | formato `uuid` | Identificador asociado a site. | `00000000-0000-4000-8000-000000000001` |
| `siteName` | Sí | `string` | Sin restricción adicional declarada | Nombre de la sede. | `Nombre de ejemplo` |
| `pharmacyId` | Sí | `string` | formato `uuid` | Identificador asociado a pharmacy. | `00000000-0000-4000-8000-000000000001` |
| `pharmacyName` | Sí | `string` | Sin restricción adicional declarada | Nombre de la farmacia (comercial, o la razón social). | `Nombre de ejemplo` |
| `medicationRequestId` | No | `string` | formato `uuid`; admite null | Receta que respalda el pedido, si la hay. | `00000000-0000-4000-8000-000000000001` |
| `patientName` | No | `string` | admite null | Nombre pintable del paciente, resuelto en lote por el backend (la bandeja FAR-E2 lo necesita; cero UUIDs como copy). `null` si la persona no tiene nombre cargado. | `Nombre de ejemplo` |
| `deliveryMode` | No | `InventoryConceptDto` | Sin restricción adicional declarada | Modalidad de entrega (`PINV_DELIVERY_*`), resuelta. `null` en pedidos anteriores al modelo v4.2.1, que no la declararon. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `deliveryMode.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `deliveryMode.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `pickupCode` | No | `string` | admite null | Código de retiro del pedido, sellado al quedar `LISTO_PARA_RETIRO`. **Solo en la lectura del titular**: es la prueba de posesión con que la persona retira, así que la bandeja y las lecturas de staff lo sirven `null` — el mostrador no valida mirándolo, valida enviándolo en `POST /pharmacy/orders/:id/dispense`. | `CODIGO_EJEMPLO` |
| `totalAmount` | No | `string` | admite null | Total CONGELADO del pedido con su moneda: suma de los precios congelados por el saldo reservado de cada renglón en pie. `null` si a algún renglón le falta precio publicado o si las listas mezclan monedas — una suma con huecos o que mezcla monedas afirma un costo que nadie publicó. Se re-congela cuando el pedido cambia (línea no disponible, sustitución aceptada); jamás se recalcula en una lectura. | `valor-ejemplo` |
| `currency` | No | `InventoryConceptDto` | Sin restricción adicional declarada | Moneda del total congelado, resuelta. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `currency.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `currency.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `rejectionReasonText` | No | `string` | admite null | Motivo del rechazo, en palabras, cuando el estado es `RECHAZADO` (v4.2.1 lo persiste). `null` en cualquier otro estado. | `Texto descriptivo de ejemplo` |
| `substitutions` | Sí | `array<PharmacyOrderSubstitutionDto>` | Sin restricción adicional declarada | La historia de propuestas de sustitución del pedido, más nuevas primero. Las decididas conservan su estado y su `decidedAt`: son bitácora, no un campo mutable. | `[{"id":"00000000-0000-4000-8000-000000000001","originalProductId":"00000000-0000-4000-8000-000000000001","originalName":"Nombre de ejemplo","originalUnitPriceAmount":"valor-ejemplo","proposedProductId":"00000000-0000-4000-8000-000000000001","proposedName":"Nombre de ejemplo","proposedUnitPriceAmount":"valor-ejemplo","currency":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"decidedAt":"valor-ejemplo"}]` |
| `substitutions[].id` | Sí | `string` | formato `uuid` | Identificador de la propuesta. | `00000000-0000-4000-8000-000000000001` |
| `substitutions[].originalProductId` | Sí | `string` | formato `uuid` | Producto recetado/pedido. | `00000000-0000-4000-8000-000000000001` |
| `substitutions[].originalName` | Sí | `string` | Sin restricción adicional declarada | Nombre pintable del original. | `Nombre de ejemplo` |
| `substitutions[].originalUnitPriceAmount` | No | `string` | admite null | Precio congelado del original al proponer, o `null` sin precio publicado. | `valor-ejemplo` |
| `substitutions[].proposedProductId` | Sí | `string` | formato `uuid` | Producto propuesto (mismo medicamento del vademécum). | `00000000-0000-4000-8000-000000000001` |
| `substitutions[].proposedName` | Sí | `string` | Sin restricción adicional declarada | Nombre pintable del propuesto. | `Nombre de ejemplo` |
| `substitutions[].proposedUnitPriceAmount` | No | `string` | admite null | Precio congelado del propuesto: la oferta que el paciente decidió. | `valor-ejemplo` |
| `substitutions[].currency` | No | `InventoryConceptDto` | Sin restricción adicional declarada | Moneda de la oferta, resuelta. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `substitutions[].currency.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `substitutions[].currency.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `substitutions[].status` | Sí | `InventoryConceptDto` | Sin restricción adicional declarada | Estado de la propuesta (`PINV_SUBSTITUTION_*`), resuelto. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `substitutions[].status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `substitutions[].status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `substitutions[].decidedAt` | No | `string` | admite null | Cuándo se decidió (aceptó/rechazó/retiró), ISO 8601; `null` en pie. | `valor-ejemplo` |
| `lines` | Sí | `array<PharmacyOrderLineDto>` | Sin restricción adicional declarada | Líneas del pedido. | `[{"productId":"00000000-0000-4000-8000-000000000001","medicationConceptId":"00000000-0000-4000-8000-000000000001","productCode":"CODIGO_EJEMPLO","brandName":"Nombre de ejemplo","genericName":"Nombre de ejemplo","strengthText":"valor-ejemplo","packageSizeText":"valor-ejemplo","medication":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"requestedQuantity":1,"reservedQuantity":1,"fulfilledQuantity":1,"unitPriceAmount":"valor-ejemplo","currency":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}}]` |
| `lines[].productId` | Sí | `string` | formato `uuid` | Identificador asociado a product. | `00000000-0000-4000-8000-000000000001` |
| `lines[].medicationConceptId` | No | `string` | formato `uuid`; admite null | Concepto de medicamento asociado al producto, cuando fue publicado. | `00000000-0000-4000-8000-000000000001` |
| `lines[].productCode` | Sí | `string` | Sin restricción adicional declarada | Código interno del producto. | `CODIGO_EJEMPLO` |
| `lines[].brandName` | No | `string` | admite null | Nombre comercial. | `Nombre de ejemplo` |
| `lines[].genericName` | No | `string` | admite null | Nombre genérico. | `Nombre de ejemplo` |
| `lines[].strengthText` | No | `string` | admite null | Concentración, legible. | `valor-ejemplo` |
| `lines[].packageSizeText` | No | `string` | admite null | Presentación, legible. | `valor-ejemplo` |
| `lines[].medication` | No | `InventoryConceptDto` | Sin restricción adicional declarada | Medicamento del vademécum, resuelto. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `lines[].medication.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `lines[].medication.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines[].requestedQuantity` | Sí | `number` | Sin restricción adicional declarada | Cantidad solicitada por el paciente. | `1` |
| `lines[].reservedQuantity` | Sí | `number` | Sin restricción adicional declarada | Cantidad efectivamente reservada; `0` cuando la línea quedó sin stock. | `1` |
| `lines[].fulfilledQuantity` | Sí | `number` | Sin restricción adicional declarada | Cantidad ya entregada en el mostrador, acumulada entre entregas parciales (FAR-E3). El saldo por retirar es `reservedQuantity − fulfilledQuantity`. | `1` |
| `lines[].unitPriceAmount` | No | `string` | admite null | Precio unitario CONGELADO del renglón (lo que paga el paciente), sellado al crear el pedido o al aceptar una sustitución. `null` si la sede no publicaba precio: el GET no recalcula — un precio congelado que se recalcula contra listas nuevas reescribe un pedido histórico. | `valor-ejemplo` |
| `lines[].currency` | No | `InventoryConceptDto` | Sin restricción adicional declarada | Moneda del precio congelado, resuelta. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `lines[].currency.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `lines[].currency.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines[].status` | Sí | `InventoryConceptDto` | Sin restricción adicional declarada | Estado de la línea (`PINV_RES_LINE_CONFIRMED` reservada, `PINV_RES_LINE_OUT_OF_STOCK` sin stock, `PINV_RES_LINE_RELEASED` liberada). | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `lines[].status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `lines[].status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | El proveedor configurado para el canal in-app no existe | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 409 | `CONFLICT` | La clave de idempotencia ya se usó para otra entrega | Excepción explícita en src/modules/pharmacy_inventory/services/pharmacy-orders.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Solo un pedido listo para retiro puede dispensarse | Excepción explícita en src/modules/pharmacy_inventory/services/pharmacy-orders.service.ts |
| 422 | `PRECONDITION_FAILED` | El código de retiro no coincide. El pedido no se modificó. | Excepción explícita en src/modules/pharmacy_inventory/services/pharmacy-orders.service.ts |
| 422 | `PRECONDITION_FAILED` | La entrega refiere productos sin saldo en pie en este pedido | Excepción explícita en src/modules/pharmacy_inventory/services/pharmacy-orders.service.ts |
| 422 | `PRECONDITION_FAILED` | El pedido no tiene saldo en pie que entregar | Excepción explícita en src/modules/pharmacy_inventory/services/pharmacy-orders.service.ts |
| 422 | `PRECONDITION_FAILED` | No hay canal in-app activo: falta correr el seed de mensajería | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 422 | `PRECONDITION_FAILED` | El canal in-app no tiene configuración de proveedor activa | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pharmacy/orders/{id}/dispense"
}
```

---

## 23. POST /pharmacy/orders/{id}/prefer-original

- **Módulo:** `pharmacy_inventory`
- **Etiqueta OpenAPI:** `pharmacy-orders`
- **Nombre:** Preferir los productos originales (paciente)
- **Operation ID:** `PharmacyOrdersController_preferOriginal`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyOrdersController.preferOriginal](../../src/modules/pharmacy_inventory/controllers/pharmacy-orders.controller.ts)

### Descripción de negocio

Las propuestas quedan como historia (RECHAZADA + decided_at) y el pedido vuelve a la cola del mostrador como CONFIRMADO — el stock del original siguió reservado todo el tiempo.

Contexto declarado en el controlador: FAR-E2/I2: el titular prefiere los originales. `ACEPTACION_PENDIENTE → CONFIRMADO`; las líneas no se tocan.

### Descripción del sistema

NestJS resuelve `POST /pharmacy/orders/{id}/prefer-original` en `PharmacyOrdersController_preferOriginal`. El controlador delega en `PharmacyOrdersService.preferOriginal`. No recibe body. El tipo de retorno estático es `Promise<PharmacyOrderDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /pharmacy/orders/00000000-0000-4000-8000-000000000001/prefer-original HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PATIENT`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /pharmacy/orders/00000000-0000-4000-8000-000000000001/prefer-original HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 400 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 404 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PharmacyOrderDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "status": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "createdAt": "valor-ejemplo",
  "expiresAt": "valor-ejemplo",
  "siteId": "00000000-0000-4000-8000-000000000001",
  "siteName": "Nombre de ejemplo",
  "pharmacyId": "00000000-0000-4000-8000-000000000001",
  "pharmacyName": "Nombre de ejemplo",
  "medicationRequestId": "00000000-0000-4000-8000-000000000001",
  "patientName": "Nombre de ejemplo",
  "deliveryMode": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "pickupCode": "CODIGO_EJEMPLO",
  "totalAmount": "valor-ejemplo",
  "currency": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "rejectionReasonText": "Texto descriptivo de ejemplo",
  "substitutions": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "originalProductId": "00000000-0000-4000-8000-000000000001",
      "originalName": "Nombre de ejemplo",
      "originalUnitPriceAmount": "valor-ejemplo",
      "proposedProductId": "00000000-0000-4000-8000-000000000001",
      "proposedName": "Nombre de ejemplo",
      "proposedUnitPriceAmount": "valor-ejemplo",
      "currency": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "status": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "decidedAt": "valor-ejemplo"
    }
  ],
  "lines": [
    {
      "productId": "00000000-0000-4000-8000-000000000001",
      "medicationConceptId": "00000000-0000-4000-8000-000000000001",
      "productCode": "CODIGO_EJEMPLO",
      "brandName": "Nombre de ejemplo",
      "genericName": "Nombre de ejemplo",
      "strengthText": "valor-ejemplo",
      "packageSizeText": "valor-ejemplo",
      "medication": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "requestedQuantity": 1,
      "reservedQuantity": 1,
      "fulfilledQuantity": 1,
      "unitPriceAmount": "valor-ejemplo",
      "currency": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "status": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      }
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único del pedido. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `InventoryConceptDto` | Sin restricción adicional declarada | Estado del pedido (`PINV_ORDER_*`). | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `createdAt` | Sí | `string` | Sin restricción adicional declarada | Instante de creación, ISO 8601. | `valor-ejemplo` |
| `expiresAt` | Sí | `string` | Sin restricción adicional declarada | Vencimiento vigente del pedido, ISO 8601 (48 h desde la creación; el carril E2 la renueva al dejarlo listo para retiro). | `valor-ejemplo` |
| `siteId` | Sí | `string` | formato `uuid` | Identificador asociado a site. | `00000000-0000-4000-8000-000000000001` |
| `siteName` | Sí | `string` | Sin restricción adicional declarada | Nombre de la sede. | `Nombre de ejemplo` |
| `pharmacyId` | Sí | `string` | formato `uuid` | Identificador asociado a pharmacy. | `00000000-0000-4000-8000-000000000001` |
| `pharmacyName` | Sí | `string` | Sin restricción adicional declarada | Nombre de la farmacia (comercial, o la razón social). | `Nombre de ejemplo` |
| `medicationRequestId` | No | `string` | formato `uuid`; admite null | Receta que respalda el pedido, si la hay. | `00000000-0000-4000-8000-000000000001` |
| `patientName` | No | `string` | admite null | Nombre pintable del paciente, resuelto en lote por el backend (la bandeja FAR-E2 lo necesita; cero UUIDs como copy). `null` si la persona no tiene nombre cargado. | `Nombre de ejemplo` |
| `deliveryMode` | No | `InventoryConceptDto` | Sin restricción adicional declarada | Modalidad de entrega (`PINV_DELIVERY_*`), resuelta. `null` en pedidos anteriores al modelo v4.2.1, que no la declararon. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `deliveryMode.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `deliveryMode.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `pickupCode` | No | `string` | admite null | Código de retiro del pedido, sellado al quedar `LISTO_PARA_RETIRO`. **Solo en la lectura del titular**: es la prueba de posesión con que la persona retira, así que la bandeja y las lecturas de staff lo sirven `null` — el mostrador no valida mirándolo, valida enviándolo en `POST /pharmacy/orders/:id/dispense`. | `CODIGO_EJEMPLO` |
| `totalAmount` | No | `string` | admite null | Total CONGELADO del pedido con su moneda: suma de los precios congelados por el saldo reservado de cada renglón en pie. `null` si a algún renglón le falta precio publicado o si las listas mezclan monedas — una suma con huecos o que mezcla monedas afirma un costo que nadie publicó. Se re-congela cuando el pedido cambia (línea no disponible, sustitución aceptada); jamás se recalcula en una lectura. | `valor-ejemplo` |
| `currency` | No | `InventoryConceptDto` | Sin restricción adicional declarada | Moneda del total congelado, resuelta. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `currency.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `currency.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `rejectionReasonText` | No | `string` | admite null | Motivo del rechazo, en palabras, cuando el estado es `RECHAZADO` (v4.2.1 lo persiste). `null` en cualquier otro estado. | `Texto descriptivo de ejemplo` |
| `substitutions` | Sí | `array<PharmacyOrderSubstitutionDto>` | Sin restricción adicional declarada | La historia de propuestas de sustitución del pedido, más nuevas primero. Las decididas conservan su estado y su `decidedAt`: son bitácora, no un campo mutable. | `[{"id":"00000000-0000-4000-8000-000000000001","originalProductId":"00000000-0000-4000-8000-000000000001","originalName":"Nombre de ejemplo","originalUnitPriceAmount":"valor-ejemplo","proposedProductId":"00000000-0000-4000-8000-000000000001","proposedName":"Nombre de ejemplo","proposedUnitPriceAmount":"valor-ejemplo","currency":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"decidedAt":"valor-ejemplo"}]` |
| `substitutions[].id` | Sí | `string` | formato `uuid` | Identificador de la propuesta. | `00000000-0000-4000-8000-000000000001` |
| `substitutions[].originalProductId` | Sí | `string` | formato `uuid` | Producto recetado/pedido. | `00000000-0000-4000-8000-000000000001` |
| `substitutions[].originalName` | Sí | `string` | Sin restricción adicional declarada | Nombre pintable del original. | `Nombre de ejemplo` |
| `substitutions[].originalUnitPriceAmount` | No | `string` | admite null | Precio congelado del original al proponer, o `null` sin precio publicado. | `valor-ejemplo` |
| `substitutions[].proposedProductId` | Sí | `string` | formato `uuid` | Producto propuesto (mismo medicamento del vademécum). | `00000000-0000-4000-8000-000000000001` |
| `substitutions[].proposedName` | Sí | `string` | Sin restricción adicional declarada | Nombre pintable del propuesto. | `Nombre de ejemplo` |
| `substitutions[].proposedUnitPriceAmount` | No | `string` | admite null | Precio congelado del propuesto: la oferta que el paciente decidió. | `valor-ejemplo` |
| `substitutions[].currency` | No | `InventoryConceptDto` | Sin restricción adicional declarada | Moneda de la oferta, resuelta. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `substitutions[].currency.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `substitutions[].currency.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `substitutions[].status` | Sí | `InventoryConceptDto` | Sin restricción adicional declarada | Estado de la propuesta (`PINV_SUBSTITUTION_*`), resuelto. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `substitutions[].status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `substitutions[].status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `substitutions[].decidedAt` | No | `string` | admite null | Cuándo se decidió (aceptó/rechazó/retiró), ISO 8601; `null` en pie. | `valor-ejemplo` |
| `lines` | Sí | `array<PharmacyOrderLineDto>` | Sin restricción adicional declarada | Líneas del pedido. | `[{"productId":"00000000-0000-4000-8000-000000000001","medicationConceptId":"00000000-0000-4000-8000-000000000001","productCode":"CODIGO_EJEMPLO","brandName":"Nombre de ejemplo","genericName":"Nombre de ejemplo","strengthText":"valor-ejemplo","packageSizeText":"valor-ejemplo","medication":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"requestedQuantity":1,"reservedQuantity":1,"fulfilledQuantity":1,"unitPriceAmount":"valor-ejemplo","currency":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}}]` |
| `lines[].productId` | Sí | `string` | formato `uuid` | Identificador asociado a product. | `00000000-0000-4000-8000-000000000001` |
| `lines[].medicationConceptId` | No | `string` | formato `uuid`; admite null | Concepto de medicamento asociado al producto, cuando fue publicado. | `00000000-0000-4000-8000-000000000001` |
| `lines[].productCode` | Sí | `string` | Sin restricción adicional declarada | Código interno del producto. | `CODIGO_EJEMPLO` |
| `lines[].brandName` | No | `string` | admite null | Nombre comercial. | `Nombre de ejemplo` |
| `lines[].genericName` | No | `string` | admite null | Nombre genérico. | `Nombre de ejemplo` |
| `lines[].strengthText` | No | `string` | admite null | Concentración, legible. | `valor-ejemplo` |
| `lines[].packageSizeText` | No | `string` | admite null | Presentación, legible. | `valor-ejemplo` |
| `lines[].medication` | No | `InventoryConceptDto` | Sin restricción adicional declarada | Medicamento del vademécum, resuelto. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `lines[].medication.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `lines[].medication.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines[].requestedQuantity` | Sí | `number` | Sin restricción adicional declarada | Cantidad solicitada por el paciente. | `1` |
| `lines[].reservedQuantity` | Sí | `number` | Sin restricción adicional declarada | Cantidad efectivamente reservada; `0` cuando la línea quedó sin stock. | `1` |
| `lines[].fulfilledQuantity` | Sí | `number` | Sin restricción adicional declarada | Cantidad ya entregada en el mostrador, acumulada entre entregas parciales (FAR-E3). El saldo por retirar es `reservedQuantity − fulfilledQuantity`. | `1` |
| `lines[].unitPriceAmount` | No | `string` | admite null | Precio unitario CONGELADO del renglón (lo que paga el paciente), sellado al crear el pedido o al aceptar una sustitución. `null` si la sede no publicaba precio: el GET no recalcula — un precio congelado que se recalcula contra listas nuevas reescribe un pedido histórico. | `valor-ejemplo` |
| `lines[].currency` | No | `InventoryConceptDto` | Sin restricción adicional declarada | Moneda del precio congelado, resuelta. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `lines[].currency.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `lines[].currency.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines[].status` | Sí | `InventoryConceptDto` | Sin restricción adicional declarada | Estado de la línea (`PINV_RES_LINE_CONFIRMED` reservada, `PINV_RES_LINE_OUT_OF_STOCK` sin stock, `PINV_RES_LINE_RELEASED` liberada). | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `lines[].status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `lines[].status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PATIENT. | Roles/tenant/guards de autorización |
| 422 | `PRECONDITION_FAILED` | La cuenta autenticada no tiene perfil de paciente | Excepción explícita en src/modules/pharmacy_inventory/services/pharmacy-orders.service.ts |
| 422 | `PRECONDITION_FAILED` | El pedido no tiene una decisión de sustituciones pendiente | Excepción explícita en src/modules/pharmacy_inventory/services/pharmacy-orders.service.ts |
| 422 | `PRECONDITION_FAILED` | El pedido no tiene propuestas de sustitución en pie | Excepción explícita en src/modules/pharmacy_inventory/services/pharmacy-orders.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pharmacy/orders/{id}/prefer-original"
}
```

---

## 24. POST /pharmacy/orders/{id}/ready

- **Módulo:** `pharmacy_inventory`
- **Etiqueta OpenAPI:** `pharmacy-orders`
- **Nombre:** Marcar el pedido listo para retiro (FAR-E2/E3)
- **Operation ID:** `PharmacyOrdersController_ready`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyOrdersController.ready](../../src/modules/pharmacy_inventory/controllers/pharmacy-orders.controller.ts)

### Descripción de negocio

CONFIRMADO|ACEPTADO → LISTO_PARA_RETIRO. Solo pedidos con modalidad RETIRO y sede con mostrador; sella el código de retiro (una sola vez) y renueva expires_at +48 h. Un pedido de envío o sin modalidad responde 422 tipificado sin efectos.

Contexto declarado en el controlador: FAR-E2/E3: dejar listo en mostrador (habilitado por el modelo v4.2.1). Exige que el pedido sea demostrablemente un RETIRO y que la sede ofrezca mostrador; sella el código de retiro y renueva la reserva 48 h.

### Descripción del sistema

NestJS resuelve `POST /pharmacy/orders/{id}/ready` en `PharmacyOrdersController_ready`. El controlador delega en `PharmacyOrdersService.ready`. No recibe body. El tipo de retorno estático es `Promise<PharmacyOrderDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /pharmacy/orders/00000000-0000-4000-8000-000000000001/ready HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /pharmacy/orders/00000000-0000-4000-8000-000000000001/ready HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 400 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 404 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PharmacyOrderDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "status": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "createdAt": "valor-ejemplo",
  "expiresAt": "valor-ejemplo",
  "siteId": "00000000-0000-4000-8000-000000000001",
  "siteName": "Nombre de ejemplo",
  "pharmacyId": "00000000-0000-4000-8000-000000000001",
  "pharmacyName": "Nombre de ejemplo",
  "medicationRequestId": "00000000-0000-4000-8000-000000000001",
  "patientName": "Nombre de ejemplo",
  "deliveryMode": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "pickupCode": "CODIGO_EJEMPLO",
  "totalAmount": "valor-ejemplo",
  "currency": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "rejectionReasonText": "Texto descriptivo de ejemplo",
  "substitutions": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "originalProductId": "00000000-0000-4000-8000-000000000001",
      "originalName": "Nombre de ejemplo",
      "originalUnitPriceAmount": "valor-ejemplo",
      "proposedProductId": "00000000-0000-4000-8000-000000000001",
      "proposedName": "Nombre de ejemplo",
      "proposedUnitPriceAmount": "valor-ejemplo",
      "currency": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "status": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "decidedAt": "valor-ejemplo"
    }
  ],
  "lines": [
    {
      "productId": "00000000-0000-4000-8000-000000000001",
      "medicationConceptId": "00000000-0000-4000-8000-000000000001",
      "productCode": "CODIGO_EJEMPLO",
      "brandName": "Nombre de ejemplo",
      "genericName": "Nombre de ejemplo",
      "strengthText": "valor-ejemplo",
      "packageSizeText": "valor-ejemplo",
      "medication": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "requestedQuantity": 1,
      "reservedQuantity": 1,
      "fulfilledQuantity": 1,
      "unitPriceAmount": "valor-ejemplo",
      "currency": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "status": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      }
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único del pedido. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `InventoryConceptDto` | Sin restricción adicional declarada | Estado del pedido (`PINV_ORDER_*`). | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `createdAt` | Sí | `string` | Sin restricción adicional declarada | Instante de creación, ISO 8601. | `valor-ejemplo` |
| `expiresAt` | Sí | `string` | Sin restricción adicional declarada | Vencimiento vigente del pedido, ISO 8601 (48 h desde la creación; el carril E2 la renueva al dejarlo listo para retiro). | `valor-ejemplo` |
| `siteId` | Sí | `string` | formato `uuid` | Identificador asociado a site. | `00000000-0000-4000-8000-000000000001` |
| `siteName` | Sí | `string` | Sin restricción adicional declarada | Nombre de la sede. | `Nombre de ejemplo` |
| `pharmacyId` | Sí | `string` | formato `uuid` | Identificador asociado a pharmacy. | `00000000-0000-4000-8000-000000000001` |
| `pharmacyName` | Sí | `string` | Sin restricción adicional declarada | Nombre de la farmacia (comercial, o la razón social). | `Nombre de ejemplo` |
| `medicationRequestId` | No | `string` | formato `uuid`; admite null | Receta que respalda el pedido, si la hay. | `00000000-0000-4000-8000-000000000001` |
| `patientName` | No | `string` | admite null | Nombre pintable del paciente, resuelto en lote por el backend (la bandeja FAR-E2 lo necesita; cero UUIDs como copy). `null` si la persona no tiene nombre cargado. | `Nombre de ejemplo` |
| `deliveryMode` | No | `InventoryConceptDto` | Sin restricción adicional declarada | Modalidad de entrega (`PINV_DELIVERY_*`), resuelta. `null` en pedidos anteriores al modelo v4.2.1, que no la declararon. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `deliveryMode.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `deliveryMode.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `pickupCode` | No | `string` | admite null | Código de retiro del pedido, sellado al quedar `LISTO_PARA_RETIRO`. **Solo en la lectura del titular**: es la prueba de posesión con que la persona retira, así que la bandeja y las lecturas de staff lo sirven `null` — el mostrador no valida mirándolo, valida enviándolo en `POST /pharmacy/orders/:id/dispense`. | `CODIGO_EJEMPLO` |
| `totalAmount` | No | `string` | admite null | Total CONGELADO del pedido con su moneda: suma de los precios congelados por el saldo reservado de cada renglón en pie. `null` si a algún renglón le falta precio publicado o si las listas mezclan monedas — una suma con huecos o que mezcla monedas afirma un costo que nadie publicó. Se re-congela cuando el pedido cambia (línea no disponible, sustitución aceptada); jamás se recalcula en una lectura. | `valor-ejemplo` |
| `currency` | No | `InventoryConceptDto` | Sin restricción adicional declarada | Moneda del total congelado, resuelta. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `currency.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `currency.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `rejectionReasonText` | No | `string` | admite null | Motivo del rechazo, en palabras, cuando el estado es `RECHAZADO` (v4.2.1 lo persiste). `null` en cualquier otro estado. | `Texto descriptivo de ejemplo` |
| `substitutions` | Sí | `array<PharmacyOrderSubstitutionDto>` | Sin restricción adicional declarada | La historia de propuestas de sustitución del pedido, más nuevas primero. Las decididas conservan su estado y su `decidedAt`: son bitácora, no un campo mutable. | `[{"id":"00000000-0000-4000-8000-000000000001","originalProductId":"00000000-0000-4000-8000-000000000001","originalName":"Nombre de ejemplo","originalUnitPriceAmount":"valor-ejemplo","proposedProductId":"00000000-0000-4000-8000-000000000001","proposedName":"Nombre de ejemplo","proposedUnitPriceAmount":"valor-ejemplo","currency":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"decidedAt":"valor-ejemplo"}]` |
| `substitutions[].id` | Sí | `string` | formato `uuid` | Identificador de la propuesta. | `00000000-0000-4000-8000-000000000001` |
| `substitutions[].originalProductId` | Sí | `string` | formato `uuid` | Producto recetado/pedido. | `00000000-0000-4000-8000-000000000001` |
| `substitutions[].originalName` | Sí | `string` | Sin restricción adicional declarada | Nombre pintable del original. | `Nombre de ejemplo` |
| `substitutions[].originalUnitPriceAmount` | No | `string` | admite null | Precio congelado del original al proponer, o `null` sin precio publicado. | `valor-ejemplo` |
| `substitutions[].proposedProductId` | Sí | `string` | formato `uuid` | Producto propuesto (mismo medicamento del vademécum). | `00000000-0000-4000-8000-000000000001` |
| `substitutions[].proposedName` | Sí | `string` | Sin restricción adicional declarada | Nombre pintable del propuesto. | `Nombre de ejemplo` |
| `substitutions[].proposedUnitPriceAmount` | No | `string` | admite null | Precio congelado del propuesto: la oferta que el paciente decidió. | `valor-ejemplo` |
| `substitutions[].currency` | No | `InventoryConceptDto` | Sin restricción adicional declarada | Moneda de la oferta, resuelta. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `substitutions[].currency.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `substitutions[].currency.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `substitutions[].status` | Sí | `InventoryConceptDto` | Sin restricción adicional declarada | Estado de la propuesta (`PINV_SUBSTITUTION_*`), resuelto. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `substitutions[].status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `substitutions[].status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `substitutions[].decidedAt` | No | `string` | admite null | Cuándo se decidió (aceptó/rechazó/retiró), ISO 8601; `null` en pie. | `valor-ejemplo` |
| `lines` | Sí | `array<PharmacyOrderLineDto>` | Sin restricción adicional declarada | Líneas del pedido. | `[{"productId":"00000000-0000-4000-8000-000000000001","medicationConceptId":"00000000-0000-4000-8000-000000000001","productCode":"CODIGO_EJEMPLO","brandName":"Nombre de ejemplo","genericName":"Nombre de ejemplo","strengthText":"valor-ejemplo","packageSizeText":"valor-ejemplo","medication":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"requestedQuantity":1,"reservedQuantity":1,"fulfilledQuantity":1,"unitPriceAmount":"valor-ejemplo","currency":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}}]` |
| `lines[].productId` | Sí | `string` | formato `uuid` | Identificador asociado a product. | `00000000-0000-4000-8000-000000000001` |
| `lines[].medicationConceptId` | No | `string` | formato `uuid`; admite null | Concepto de medicamento asociado al producto, cuando fue publicado. | `00000000-0000-4000-8000-000000000001` |
| `lines[].productCode` | Sí | `string` | Sin restricción adicional declarada | Código interno del producto. | `CODIGO_EJEMPLO` |
| `lines[].brandName` | No | `string` | admite null | Nombre comercial. | `Nombre de ejemplo` |
| `lines[].genericName` | No | `string` | admite null | Nombre genérico. | `Nombre de ejemplo` |
| `lines[].strengthText` | No | `string` | admite null | Concentración, legible. | `valor-ejemplo` |
| `lines[].packageSizeText` | No | `string` | admite null | Presentación, legible. | `valor-ejemplo` |
| `lines[].medication` | No | `InventoryConceptDto` | Sin restricción adicional declarada | Medicamento del vademécum, resuelto. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `lines[].medication.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `lines[].medication.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines[].requestedQuantity` | Sí | `number` | Sin restricción adicional declarada | Cantidad solicitada por el paciente. | `1` |
| `lines[].reservedQuantity` | Sí | `number` | Sin restricción adicional declarada | Cantidad efectivamente reservada; `0` cuando la línea quedó sin stock. | `1` |
| `lines[].fulfilledQuantity` | Sí | `number` | Sin restricción adicional declarada | Cantidad ya entregada en el mostrador, acumulada entre entregas parciales (FAR-E3). El saldo por retirar es `reservedQuantity − fulfilledQuantity`. | `1` |
| `lines[].unitPriceAmount` | No | `string` | admite null | Precio unitario CONGELADO del renglón (lo que paga el paciente), sellado al crear el pedido o al aceptar una sustitución. `null` si la sede no publicaba precio: el GET no recalcula — un precio congelado que se recalcula contra listas nuevas reescribe un pedido histórico. | `valor-ejemplo` |
| `lines[].currency` | No | `InventoryConceptDto` | Sin restricción adicional declarada | Moneda del precio congelado, resuelta. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `lines[].currency.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `lines[].currency.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines[].status` | Sí | `InventoryConceptDto` | Sin restricción adicional declarada | Estado de la línea (`PINV_RES_LINE_CONFIRMED` reservada, `PINV_RES_LINE_OUT_OF_STOCK` sin stock, `PINV_RES_LINE_RELEASED` liberada). | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `lines[].status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `lines[].status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | El proveedor configurado para el canal in-app no existe | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 409 | `CONFLICT` | No se pudo sellar un código de retiro único; reintente la operación | Excepción explícita en src/modules/pharmacy_inventory/services/pharmacy-orders.service.ts |
| 422 | `PRECONDITION_FAILED` | La transición no es legal para el estado actual del pedido | Excepción explícita en src/modules/pharmacy_inventory/services/pharmacy-orders.service.ts |
| 422 | `PRECONDITION_FAILED` | El pedido no declara modalidad de entrega: no puede demostrarse que sea un retiro | Excepción explícita en src/modules/pharmacy_inventory/services/pharmacy-orders.service.ts |
| 422 | `PRECONDITION_FAILED` | El pedido es de envío: se cierra por el carril de envío, no por el mostrador | Excepción explícita en src/modules/pharmacy_inventory/services/pharmacy-orders.service.ts |
| 422 | `PRECONDITION_FAILED` | La sede no ofrece retiro en mostrador | Excepción explícita en src/modules/pharmacy_inventory/services/pharmacy-orders.service.ts |
| 422 | `PRECONDITION_FAILED` | No hay canal in-app activo: falta correr el seed de mensajería | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 422 | `PRECONDITION_FAILED` | El canal in-app no tiene configuración de proveedor activa | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pharmacy/orders/{id}/ready"
}
```

---

## 25. POST /pharmacy/orders/{id}/reject

- **Módulo:** `pharmacy_inventory`
- **Etiqueta OpenAPI:** `pharmacy-orders`
- **Nombre:** Rechazar el pedido (FAR-E2)
- **Operation ID:** `PharmacyOrdersController_reject`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyOrdersController.reject](../../src/modules/pharmacy_inventory/controllers/pharmacy-orders.controller.ts)

### Descripción de negocio

Libera el stock reservado. El motivo es obligatorio: se persiste en rejection_reason_text y viaja además en el evento y la campana.

Contexto declarado en el controlador: FAR-E2: rechazar con motivo (v4.2.1 lo persiste en el pedido).

### Descripción del sistema

NestJS resuelve `POST /pharmacy/orders/{id}/reject` en `PharmacyOrdersController_reject`. El controlador delega en `PharmacyOrdersService.reject`. Valida el body como `RejectPharmacyOrderDto` y consume `application/json`. El tipo de retorno estático es `Promise<PharmacyOrderDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RejectPharmacyOrderDto`; los campos opcionales se omiten.

```http
POST /pharmacy/orders/00000000-0000-4000-8000-000000000001/reject HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "reason": "Texto descriptivo de ejemplo"
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
| `reason` | Sí | `string` | longitud mínima 1; longitud máxima 500 | Motivo del rechazo (se persiste en el pedido) | `Texto descriptivo de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /pharmacy/orders/00000000-0000-4000-8000-000000000001/reject HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "reason": "Texto descriptivo de ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 400 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 404 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 413 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PharmacyOrderDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "status": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "createdAt": "valor-ejemplo",
  "expiresAt": "valor-ejemplo",
  "siteId": "00000000-0000-4000-8000-000000000001",
  "siteName": "Nombre de ejemplo",
  "pharmacyId": "00000000-0000-4000-8000-000000000001",
  "pharmacyName": "Nombre de ejemplo",
  "medicationRequestId": "00000000-0000-4000-8000-000000000001",
  "patientName": "Nombre de ejemplo",
  "deliveryMode": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "pickupCode": "CODIGO_EJEMPLO",
  "totalAmount": "valor-ejemplo",
  "currency": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "rejectionReasonText": "Texto descriptivo de ejemplo",
  "substitutions": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "originalProductId": "00000000-0000-4000-8000-000000000001",
      "originalName": "Nombre de ejemplo",
      "originalUnitPriceAmount": "valor-ejemplo",
      "proposedProductId": "00000000-0000-4000-8000-000000000001",
      "proposedName": "Nombre de ejemplo",
      "proposedUnitPriceAmount": "valor-ejemplo",
      "currency": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "status": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "decidedAt": "valor-ejemplo"
    }
  ],
  "lines": [
    {
      "productId": "00000000-0000-4000-8000-000000000001",
      "medicationConceptId": "00000000-0000-4000-8000-000000000001",
      "productCode": "CODIGO_EJEMPLO",
      "brandName": "Nombre de ejemplo",
      "genericName": "Nombre de ejemplo",
      "strengthText": "valor-ejemplo",
      "packageSizeText": "valor-ejemplo",
      "medication": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "requestedQuantity": 1,
      "reservedQuantity": 1,
      "fulfilledQuantity": 1,
      "unitPriceAmount": "valor-ejemplo",
      "currency": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "status": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      }
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único del pedido. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `InventoryConceptDto` | Sin restricción adicional declarada | Estado del pedido (`PINV_ORDER_*`). | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `createdAt` | Sí | `string` | Sin restricción adicional declarada | Instante de creación, ISO 8601. | `valor-ejemplo` |
| `expiresAt` | Sí | `string` | Sin restricción adicional declarada | Vencimiento vigente del pedido, ISO 8601 (48 h desde la creación; el carril E2 la renueva al dejarlo listo para retiro). | `valor-ejemplo` |
| `siteId` | Sí | `string` | formato `uuid` | Identificador asociado a site. | `00000000-0000-4000-8000-000000000001` |
| `siteName` | Sí | `string` | Sin restricción adicional declarada | Nombre de la sede. | `Nombre de ejemplo` |
| `pharmacyId` | Sí | `string` | formato `uuid` | Identificador asociado a pharmacy. | `00000000-0000-4000-8000-000000000001` |
| `pharmacyName` | Sí | `string` | Sin restricción adicional declarada | Nombre de la farmacia (comercial, o la razón social). | `Nombre de ejemplo` |
| `medicationRequestId` | No | `string` | formato `uuid`; admite null | Receta que respalda el pedido, si la hay. | `00000000-0000-4000-8000-000000000001` |
| `patientName` | No | `string` | admite null | Nombre pintable del paciente, resuelto en lote por el backend (la bandeja FAR-E2 lo necesita; cero UUIDs como copy). `null` si la persona no tiene nombre cargado. | `Nombre de ejemplo` |
| `deliveryMode` | No | `InventoryConceptDto` | Sin restricción adicional declarada | Modalidad de entrega (`PINV_DELIVERY_*`), resuelta. `null` en pedidos anteriores al modelo v4.2.1, que no la declararon. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `deliveryMode.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `deliveryMode.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `pickupCode` | No | `string` | admite null | Código de retiro del pedido, sellado al quedar `LISTO_PARA_RETIRO`. **Solo en la lectura del titular**: es la prueba de posesión con que la persona retira, así que la bandeja y las lecturas de staff lo sirven `null` — el mostrador no valida mirándolo, valida enviándolo en `POST /pharmacy/orders/:id/dispense`. | `CODIGO_EJEMPLO` |
| `totalAmount` | No | `string` | admite null | Total CONGELADO del pedido con su moneda: suma de los precios congelados por el saldo reservado de cada renglón en pie. `null` si a algún renglón le falta precio publicado o si las listas mezclan monedas — una suma con huecos o que mezcla monedas afirma un costo que nadie publicó. Se re-congela cuando el pedido cambia (línea no disponible, sustitución aceptada); jamás se recalcula en una lectura. | `valor-ejemplo` |
| `currency` | No | `InventoryConceptDto` | Sin restricción adicional declarada | Moneda del total congelado, resuelta. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `currency.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `currency.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `rejectionReasonText` | No | `string` | admite null | Motivo del rechazo, en palabras, cuando el estado es `RECHAZADO` (v4.2.1 lo persiste). `null` en cualquier otro estado. | `Texto descriptivo de ejemplo` |
| `substitutions` | Sí | `array<PharmacyOrderSubstitutionDto>` | Sin restricción adicional declarada | La historia de propuestas de sustitución del pedido, más nuevas primero. Las decididas conservan su estado y su `decidedAt`: son bitácora, no un campo mutable. | `[{"id":"00000000-0000-4000-8000-000000000001","originalProductId":"00000000-0000-4000-8000-000000000001","originalName":"Nombre de ejemplo","originalUnitPriceAmount":"valor-ejemplo","proposedProductId":"00000000-0000-4000-8000-000000000001","proposedName":"Nombre de ejemplo","proposedUnitPriceAmount":"valor-ejemplo","currency":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"decidedAt":"valor-ejemplo"}]` |
| `substitutions[].id` | Sí | `string` | formato `uuid` | Identificador de la propuesta. | `00000000-0000-4000-8000-000000000001` |
| `substitutions[].originalProductId` | Sí | `string` | formato `uuid` | Producto recetado/pedido. | `00000000-0000-4000-8000-000000000001` |
| `substitutions[].originalName` | Sí | `string` | Sin restricción adicional declarada | Nombre pintable del original. | `Nombre de ejemplo` |
| `substitutions[].originalUnitPriceAmount` | No | `string` | admite null | Precio congelado del original al proponer, o `null` sin precio publicado. | `valor-ejemplo` |
| `substitutions[].proposedProductId` | Sí | `string` | formato `uuid` | Producto propuesto (mismo medicamento del vademécum). | `00000000-0000-4000-8000-000000000001` |
| `substitutions[].proposedName` | Sí | `string` | Sin restricción adicional declarada | Nombre pintable del propuesto. | `Nombre de ejemplo` |
| `substitutions[].proposedUnitPriceAmount` | No | `string` | admite null | Precio congelado del propuesto: la oferta que el paciente decidió. | `valor-ejemplo` |
| `substitutions[].currency` | No | `InventoryConceptDto` | Sin restricción adicional declarada | Moneda de la oferta, resuelta. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `substitutions[].currency.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `substitutions[].currency.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `substitutions[].status` | Sí | `InventoryConceptDto` | Sin restricción adicional declarada | Estado de la propuesta (`PINV_SUBSTITUTION_*`), resuelto. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `substitutions[].status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `substitutions[].status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `substitutions[].decidedAt` | No | `string` | admite null | Cuándo se decidió (aceptó/rechazó/retiró), ISO 8601; `null` en pie. | `valor-ejemplo` |
| `lines` | Sí | `array<PharmacyOrderLineDto>` | Sin restricción adicional declarada | Líneas del pedido. | `[{"productId":"00000000-0000-4000-8000-000000000001","medicationConceptId":"00000000-0000-4000-8000-000000000001","productCode":"CODIGO_EJEMPLO","brandName":"Nombre de ejemplo","genericName":"Nombre de ejemplo","strengthText":"valor-ejemplo","packageSizeText":"valor-ejemplo","medication":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"requestedQuantity":1,"reservedQuantity":1,"fulfilledQuantity":1,"unitPriceAmount":"valor-ejemplo","currency":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}}]` |
| `lines[].productId` | Sí | `string` | formato `uuid` | Identificador asociado a product. | `00000000-0000-4000-8000-000000000001` |
| `lines[].medicationConceptId` | No | `string` | formato `uuid`; admite null | Concepto de medicamento asociado al producto, cuando fue publicado. | `00000000-0000-4000-8000-000000000001` |
| `lines[].productCode` | Sí | `string` | Sin restricción adicional declarada | Código interno del producto. | `CODIGO_EJEMPLO` |
| `lines[].brandName` | No | `string` | admite null | Nombre comercial. | `Nombre de ejemplo` |
| `lines[].genericName` | No | `string` | admite null | Nombre genérico. | `Nombre de ejemplo` |
| `lines[].strengthText` | No | `string` | admite null | Concentración, legible. | `valor-ejemplo` |
| `lines[].packageSizeText` | No | `string` | admite null | Presentación, legible. | `valor-ejemplo` |
| `lines[].medication` | No | `InventoryConceptDto` | Sin restricción adicional declarada | Medicamento del vademécum, resuelto. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `lines[].medication.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `lines[].medication.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines[].requestedQuantity` | Sí | `number` | Sin restricción adicional declarada | Cantidad solicitada por el paciente. | `1` |
| `lines[].reservedQuantity` | Sí | `number` | Sin restricción adicional declarada | Cantidad efectivamente reservada; `0` cuando la línea quedó sin stock. | `1` |
| `lines[].fulfilledQuantity` | Sí | `number` | Sin restricción adicional declarada | Cantidad ya entregada en el mostrador, acumulada entre entregas parciales (FAR-E3). El saldo por retirar es `reservedQuantity − fulfilledQuantity`. | `1` |
| `lines[].unitPriceAmount` | No | `string` | admite null | Precio unitario CONGELADO del renglón (lo que paga el paciente), sellado al crear el pedido o al aceptar una sustitución. `null` si la sede no publicaba precio: el GET no recalcula — un precio congelado que se recalcula contra listas nuevas reescribe un pedido histórico. | `valor-ejemplo` |
| `lines[].currency` | No | `InventoryConceptDto` | Sin restricción adicional declarada | Moneda del precio congelado, resuelta. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `lines[].currency.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `lines[].currency.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines[].status` | Sí | `InventoryConceptDto` | Sin restricción adicional declarada | Estado de la línea (`PINV_RES_LINE_CONFIRMED` reservada, `PINV_RES_LINE_OUT_OF_STOCK` sin stock, `PINV_RES_LINE_RELEASED` liberada). | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `lines[].status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `lines[].status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | El proveedor configurado para el canal in-app no existe | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El rechazo exige un motivo en palabras | Excepción explícita en src/modules/pharmacy_inventory/services/pharmacy-orders.service.ts |
| 422 | `PRECONDITION_FAILED` | La transición no es legal para el estado actual del pedido | Excepción explícita en src/modules/pharmacy_inventory/services/pharmacy-orders.service.ts |
| 422 | `PRECONDITION_FAILED` | No hay canal in-app activo: falta correr el seed de mensajería | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 422 | `PRECONDITION_FAILED` | El canal in-app no tiene configuración de proveedor activa | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pharmacy/orders/{id}/reject"
}
```

---

## 26. POST /pharmacy/orders/{id}/review

- **Módulo:** `pharmacy_inventory`
- **Etiqueta OpenAPI:** `pharmacy-orders`
- **Nombre:** Abrir revisión del pedido (FAR-E2)
- **Operation ID:** `PharmacyOrdersController_openReview`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyOrdersController.openReview](../../src/modules/pharmacy_inventory/controllers/pharmacy-orders.controller.ts)

### Descripción de negocio

El paciente ve que la farmacia está mirando su pedido. Transición ilegal: 422.

Contexto declarado en el controlador: FAR-E2: recepcionar — `ENVIADO → EN_REVISION` (el «visto»).

### Descripción del sistema

NestJS resuelve `POST /pharmacy/orders/{id}/review` en `PharmacyOrdersController_openReview`. El controlador delega en `PharmacyOrdersService.openReview`. No recibe body. El tipo de retorno estático es `Promise<PharmacyOrderDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /pharmacy/orders/00000000-0000-4000-8000-000000000001/review HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /pharmacy/orders/00000000-0000-4000-8000-000000000001/review HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 400 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 404 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PharmacyOrderDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "status": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "createdAt": "valor-ejemplo",
  "expiresAt": "valor-ejemplo",
  "siteId": "00000000-0000-4000-8000-000000000001",
  "siteName": "Nombre de ejemplo",
  "pharmacyId": "00000000-0000-4000-8000-000000000001",
  "pharmacyName": "Nombre de ejemplo",
  "medicationRequestId": "00000000-0000-4000-8000-000000000001",
  "patientName": "Nombre de ejemplo",
  "deliveryMode": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "pickupCode": "CODIGO_EJEMPLO",
  "totalAmount": "valor-ejemplo",
  "currency": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "rejectionReasonText": "Texto descriptivo de ejemplo",
  "substitutions": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "originalProductId": "00000000-0000-4000-8000-000000000001",
      "originalName": "Nombre de ejemplo",
      "originalUnitPriceAmount": "valor-ejemplo",
      "proposedProductId": "00000000-0000-4000-8000-000000000001",
      "proposedName": "Nombre de ejemplo",
      "proposedUnitPriceAmount": "valor-ejemplo",
      "currency": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "status": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "decidedAt": "valor-ejemplo"
    }
  ],
  "lines": [
    {
      "productId": "00000000-0000-4000-8000-000000000001",
      "medicationConceptId": "00000000-0000-4000-8000-000000000001",
      "productCode": "CODIGO_EJEMPLO",
      "brandName": "Nombre de ejemplo",
      "genericName": "Nombre de ejemplo",
      "strengthText": "valor-ejemplo",
      "packageSizeText": "valor-ejemplo",
      "medication": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "requestedQuantity": 1,
      "reservedQuantity": 1,
      "fulfilledQuantity": 1,
      "unitPriceAmount": "valor-ejemplo",
      "currency": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "status": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      }
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único del pedido. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `InventoryConceptDto` | Sin restricción adicional declarada | Estado del pedido (`PINV_ORDER_*`). | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `createdAt` | Sí | `string` | Sin restricción adicional declarada | Instante de creación, ISO 8601. | `valor-ejemplo` |
| `expiresAt` | Sí | `string` | Sin restricción adicional declarada | Vencimiento vigente del pedido, ISO 8601 (48 h desde la creación; el carril E2 la renueva al dejarlo listo para retiro). | `valor-ejemplo` |
| `siteId` | Sí | `string` | formato `uuid` | Identificador asociado a site. | `00000000-0000-4000-8000-000000000001` |
| `siteName` | Sí | `string` | Sin restricción adicional declarada | Nombre de la sede. | `Nombre de ejemplo` |
| `pharmacyId` | Sí | `string` | formato `uuid` | Identificador asociado a pharmacy. | `00000000-0000-4000-8000-000000000001` |
| `pharmacyName` | Sí | `string` | Sin restricción adicional declarada | Nombre de la farmacia (comercial, o la razón social). | `Nombre de ejemplo` |
| `medicationRequestId` | No | `string` | formato `uuid`; admite null | Receta que respalda el pedido, si la hay. | `00000000-0000-4000-8000-000000000001` |
| `patientName` | No | `string` | admite null | Nombre pintable del paciente, resuelto en lote por el backend (la bandeja FAR-E2 lo necesita; cero UUIDs como copy). `null` si la persona no tiene nombre cargado. | `Nombre de ejemplo` |
| `deliveryMode` | No | `InventoryConceptDto` | Sin restricción adicional declarada | Modalidad de entrega (`PINV_DELIVERY_*`), resuelta. `null` en pedidos anteriores al modelo v4.2.1, que no la declararon. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `deliveryMode.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `deliveryMode.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `pickupCode` | No | `string` | admite null | Código de retiro del pedido, sellado al quedar `LISTO_PARA_RETIRO`. **Solo en la lectura del titular**: es la prueba de posesión con que la persona retira, así que la bandeja y las lecturas de staff lo sirven `null` — el mostrador no valida mirándolo, valida enviándolo en `POST /pharmacy/orders/:id/dispense`. | `CODIGO_EJEMPLO` |
| `totalAmount` | No | `string` | admite null | Total CONGELADO del pedido con su moneda: suma de los precios congelados por el saldo reservado de cada renglón en pie. `null` si a algún renglón le falta precio publicado o si las listas mezclan monedas — una suma con huecos o que mezcla monedas afirma un costo que nadie publicó. Se re-congela cuando el pedido cambia (línea no disponible, sustitución aceptada); jamás se recalcula en una lectura. | `valor-ejemplo` |
| `currency` | No | `InventoryConceptDto` | Sin restricción adicional declarada | Moneda del total congelado, resuelta. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `currency.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `currency.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `rejectionReasonText` | No | `string` | admite null | Motivo del rechazo, en palabras, cuando el estado es `RECHAZADO` (v4.2.1 lo persiste). `null` en cualquier otro estado. | `Texto descriptivo de ejemplo` |
| `substitutions` | Sí | `array<PharmacyOrderSubstitutionDto>` | Sin restricción adicional declarada | La historia de propuestas de sustitución del pedido, más nuevas primero. Las decididas conservan su estado y su `decidedAt`: son bitácora, no un campo mutable. | `[{"id":"00000000-0000-4000-8000-000000000001","originalProductId":"00000000-0000-4000-8000-000000000001","originalName":"Nombre de ejemplo","originalUnitPriceAmount":"valor-ejemplo","proposedProductId":"00000000-0000-4000-8000-000000000001","proposedName":"Nombre de ejemplo","proposedUnitPriceAmount":"valor-ejemplo","currency":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"decidedAt":"valor-ejemplo"}]` |
| `substitutions[].id` | Sí | `string` | formato `uuid` | Identificador de la propuesta. | `00000000-0000-4000-8000-000000000001` |
| `substitutions[].originalProductId` | Sí | `string` | formato `uuid` | Producto recetado/pedido. | `00000000-0000-4000-8000-000000000001` |
| `substitutions[].originalName` | Sí | `string` | Sin restricción adicional declarada | Nombre pintable del original. | `Nombre de ejemplo` |
| `substitutions[].originalUnitPriceAmount` | No | `string` | admite null | Precio congelado del original al proponer, o `null` sin precio publicado. | `valor-ejemplo` |
| `substitutions[].proposedProductId` | Sí | `string` | formato `uuid` | Producto propuesto (mismo medicamento del vademécum). | `00000000-0000-4000-8000-000000000001` |
| `substitutions[].proposedName` | Sí | `string` | Sin restricción adicional declarada | Nombre pintable del propuesto. | `Nombre de ejemplo` |
| `substitutions[].proposedUnitPriceAmount` | No | `string` | admite null | Precio congelado del propuesto: la oferta que el paciente decidió. | `valor-ejemplo` |
| `substitutions[].currency` | No | `InventoryConceptDto` | Sin restricción adicional declarada | Moneda de la oferta, resuelta. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `substitutions[].currency.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `substitutions[].currency.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `substitutions[].status` | Sí | `InventoryConceptDto` | Sin restricción adicional declarada | Estado de la propuesta (`PINV_SUBSTITUTION_*`), resuelto. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `substitutions[].status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `substitutions[].status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `substitutions[].decidedAt` | No | `string` | admite null | Cuándo se decidió (aceptó/rechazó/retiró), ISO 8601; `null` en pie. | `valor-ejemplo` |
| `lines` | Sí | `array<PharmacyOrderLineDto>` | Sin restricción adicional declarada | Líneas del pedido. | `[{"productId":"00000000-0000-4000-8000-000000000001","medicationConceptId":"00000000-0000-4000-8000-000000000001","productCode":"CODIGO_EJEMPLO","brandName":"Nombre de ejemplo","genericName":"Nombre de ejemplo","strengthText":"valor-ejemplo","packageSizeText":"valor-ejemplo","medication":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"requestedQuantity":1,"reservedQuantity":1,"fulfilledQuantity":1,"unitPriceAmount":"valor-ejemplo","currency":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}}]` |
| `lines[].productId` | Sí | `string` | formato `uuid` | Identificador asociado a product. | `00000000-0000-4000-8000-000000000001` |
| `lines[].medicationConceptId` | No | `string` | formato `uuid`; admite null | Concepto de medicamento asociado al producto, cuando fue publicado. | `00000000-0000-4000-8000-000000000001` |
| `lines[].productCode` | Sí | `string` | Sin restricción adicional declarada | Código interno del producto. | `CODIGO_EJEMPLO` |
| `lines[].brandName` | No | `string` | admite null | Nombre comercial. | `Nombre de ejemplo` |
| `lines[].genericName` | No | `string` | admite null | Nombre genérico. | `Nombre de ejemplo` |
| `lines[].strengthText` | No | `string` | admite null | Concentración, legible. | `valor-ejemplo` |
| `lines[].packageSizeText` | No | `string` | admite null | Presentación, legible. | `valor-ejemplo` |
| `lines[].medication` | No | `InventoryConceptDto` | Sin restricción adicional declarada | Medicamento del vademécum, resuelto. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `lines[].medication.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `lines[].medication.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines[].requestedQuantity` | Sí | `number` | Sin restricción adicional declarada | Cantidad solicitada por el paciente. | `1` |
| `lines[].reservedQuantity` | Sí | `number` | Sin restricción adicional declarada | Cantidad efectivamente reservada; `0` cuando la línea quedó sin stock. | `1` |
| `lines[].fulfilledQuantity` | Sí | `number` | Sin restricción adicional declarada | Cantidad ya entregada en el mostrador, acumulada entre entregas parciales (FAR-E3). El saldo por retirar es `reservedQuantity − fulfilledQuantity`. | `1` |
| `lines[].unitPriceAmount` | No | `string` | admite null | Precio unitario CONGELADO del renglón (lo que paga el paciente), sellado al crear el pedido o al aceptar una sustitución. `null` si la sede no publicaba precio: el GET no recalcula — un precio congelado que se recalcula contra listas nuevas reescribe un pedido histórico. | `valor-ejemplo` |
| `lines[].currency` | No | `InventoryConceptDto` | Sin restricción adicional declarada | Moneda del precio congelado, resuelta. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `lines[].currency.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `lines[].currency.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines[].status` | Sí | `InventoryConceptDto` | Sin restricción adicional declarada | Estado de la línea (`PINV_RES_LINE_CONFIRMED` reservada, `PINV_RES_LINE_OUT_OF_STOCK` sin stock, `PINV_RES_LINE_RELEASED` liberada). | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `lines[].status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `lines[].status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | El proveedor configurado para el canal in-app no existe | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 422 | `PRECONDITION_FAILED` | La transición no es legal para el estado actual del pedido | Excepción explícita en src/modules/pharmacy_inventory/services/pharmacy-orders.service.ts |
| 422 | `PRECONDITION_FAILED` | No hay canal in-app activo: falta correr el seed de mensajería | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 422 | `PRECONDITION_FAILED` | El canal in-app no tiene configuración de proveedor activa | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pharmacy/orders/{id}/review"
}
```

---

## 27. GET /pharmacy/orders/me

- **Módulo:** `pharmacy_inventory`
- **Etiqueta OpenAPI:** `pharmacy-orders`
- **Nombre:** Mis pedidos de farmacia, más nuevos primero (FAR-E1)
- **Operation ID:** `PharmacyOrdersController_listMine`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyOrdersController.listMine](../../src/modules/pharmacy_inventory/controllers/pharmacy-orders.controller.ts)

### Descripción de negocio

Mis pedidos de farmacia, más nuevos primero (FAR-E1). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: FAR-E1: los pedidos del titular. Declarado antes que `:id` para que «me» nunca caiga en el parámetro.

### Descripción del sistema

NestJS resuelve `GET /pharmacy/orders/me` en `PharmacyOrdersController_listMine`. El controlador delega en `PharmacyOrdersService.listMine`. No recibe body. El tipo de retorno estático es `Promise<PharmacyOrderListResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /pharmacy/orders/me HTTP/1.1
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
GET /pharmacy/orders/me HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PharmacyOrderListResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<PharmacyOrderListResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<PharmacyOrderListResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<PharmacyOrderListResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<PharmacyOrderListResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<PharmacyOrderListResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PharmacyOrderListResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "status": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "createdAt": "valor-ejemplo",
      "expiresAt": "valor-ejemplo",
      "siteId": "00000000-0000-4000-8000-000000000001",
      "siteName": "Nombre de ejemplo",
      "pharmacyId": "00000000-0000-4000-8000-000000000001",
      "pharmacyName": "Nombre de ejemplo",
      "medicationRequestId": "00000000-0000-4000-8000-000000000001",
      "patientName": "Nombre de ejemplo",
      "deliveryMode": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "pickupCode": "CODIGO_EJEMPLO",
      "totalAmount": "valor-ejemplo",
      "currency": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "rejectionReasonText": "Texto descriptivo de ejemplo",
      "substitutions": [
        {
          "id": "00000000-0000-4000-8000-000000000001",
          "originalProductId": "00000000-0000-4000-8000-000000000001",
          "originalName": "Nombre de ejemplo",
          "originalUnitPriceAmount": "valor-ejemplo",
          "proposedProductId": "00000000-0000-4000-8000-000000000001",
          "proposedName": "Nombre de ejemplo",
          "proposedUnitPriceAmount": "valor-ejemplo",
          "currency": {
            "code": "CODIGO_EJEMPLO",
            "display": "valor-ejemplo"
          },
          "status": {
            "code": "CODIGO_EJEMPLO",
            "display": "valor-ejemplo"
          },
          "decidedAt": "valor-ejemplo"
        }
      ],
      "lines": [
        {
          "productId": "00000000-0000-4000-8000-000000000001",
          "medicationConceptId": "00000000-0000-4000-8000-000000000001",
          "productCode": "CODIGO_EJEMPLO",
          "brandName": "Nombre de ejemplo",
          "genericName": "Nombre de ejemplo",
          "strengthText": "valor-ejemplo",
          "packageSizeText": "valor-ejemplo",
          "medication": {
            "code": "CODIGO_EJEMPLO",
            "display": "valor-ejemplo"
          },
          "requestedQuantity": 1,
          "reservedQuantity": 1,
          "fulfilledQuantity": 1,
          "unitPriceAmount": "valor-ejemplo",
          "currency": {
            "code": "CODIGO_EJEMPLO",
            "display": "valor-ejemplo"
          },
          "status": {
            "code": "CODIGO_EJEMPLO",
            "display": "valor-ejemplo"
          }
        }
      ]
    }
  ],
  "count": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<PharmacyOrderDto>` | Sin restricción adicional declarada | Pedidos del paciente, más nuevos primero. | `[{"id":"00000000-0000-4000-8000-000000000001","status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"createdAt":"valor-ejemplo","expiresAt":"valor-ejemplo","siteId":"00000000-0000-4000-8000-000000000001","siteName":"Nombre de ejemplo","pharmacyId":"00000000-0000-4000-8000-000000000001","pharmacyName":"Nombre de ejemplo","medicationRequestId":"00000000-0000-4000-8000-000000000001","patientName":"Nombre de ejemplo","deliveryMode":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"pickupCode":"CODIGO_EJEMPLO","totalAmount":"valor-ejemplo","currency":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"rejectionReasonText":"Texto descriptivo de ejemplo","substitutions":[{"id":"00000000-0000-4000-8000-000000000001","originalProductId":"00000000-0000-4000-8000-000000000001","originalName":"Nombre de ejemplo","originalUnitPriceAmount":"valor-ejemplo","proposedProductId":"00000000-0000-4000-8000-000000000001","proposedName":"Nombre de ejemplo","proposedUnitPriceAmount":"valor-ejemplo","currency":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"decidedAt":"valor-ejemplo"}],"lines":[{"productId":"00000000-0000-4000-8000-000000000001","medicationConceptId":"00000000-0000-4000-8000-000000000001","productCode":"CODIGO_EJEMPLO","brandName":"Nombre de ejemplo","genericName":"Nombre de ejemplo","strengthText":"valor-ejemplo","packageSizeText":"valor-ejemplo","medication":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"requestedQuantity":1,"reservedQuantity":1,"fulfilledQuantity":1,"unitPriceAmount":"valor-ejemplo","currency":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}}]}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Identificador único del pedido. | `00000000-0000-4000-8000-000000000001` |
| `items[].status` | Sí | `InventoryConceptDto` | Sin restricción adicional declarada | Estado del pedido (`PINV_ORDER_*`). | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `items[].status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].createdAt` | Sí | `string` | Sin restricción adicional declarada | Instante de creación, ISO 8601. | `valor-ejemplo` |
| `items[].expiresAt` | Sí | `string` | Sin restricción adicional declarada | Vencimiento vigente del pedido, ISO 8601 (48 h desde la creación; el carril E2 la renueva al dejarlo listo para retiro). | `valor-ejemplo` |
| `items[].siteId` | Sí | `string` | formato `uuid` | Identificador asociado a site. | `00000000-0000-4000-8000-000000000001` |
| `items[].siteName` | Sí | `string` | Sin restricción adicional declarada | Nombre de la sede. | `Nombre de ejemplo` |
| `items[].pharmacyId` | Sí | `string` | formato `uuid` | Identificador asociado a pharmacy. | `00000000-0000-4000-8000-000000000001` |
| `items[].pharmacyName` | Sí | `string` | Sin restricción adicional declarada | Nombre de la farmacia (comercial, o la razón social). | `Nombre de ejemplo` |
| `items[].medicationRequestId` | No | `string` | formato `uuid`; admite null | Receta que respalda el pedido, si la hay. | `00000000-0000-4000-8000-000000000001` |
| `items[].patientName` | No | `string` | admite null | Nombre pintable del paciente, resuelto en lote por el backend (la bandeja FAR-E2 lo necesita; cero UUIDs como copy). `null` si la persona no tiene nombre cargado. | `Nombre de ejemplo` |
| `items[].deliveryMode` | No | `InventoryConceptDto` | Sin restricción adicional declarada | Modalidad de entrega (`PINV_DELIVERY_*`), resuelta. `null` en pedidos anteriores al modelo v4.2.1, que no la declararon. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `items[].deliveryMode.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].deliveryMode.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].pickupCode` | No | `string` | admite null | Código de retiro del pedido, sellado al quedar `LISTO_PARA_RETIRO`. **Solo en la lectura del titular**: es la prueba de posesión con que la persona retira, así que la bandeja y las lecturas de staff lo sirven `null` — el mostrador no valida mirándolo, valida enviándolo en `POST /pharmacy/orders/:id/dispense`. | `CODIGO_EJEMPLO` |
| `items[].totalAmount` | No | `string` | admite null | Total CONGELADO del pedido con su moneda: suma de los precios congelados por el saldo reservado de cada renglón en pie. `null` si a algún renglón le falta precio publicado o si las listas mezclan monedas — una suma con huecos o que mezcla monedas afirma un costo que nadie publicó. Se re-congela cuando el pedido cambia (línea no disponible, sustitución aceptada); jamás se recalcula en una lectura. | `valor-ejemplo` |
| `items[].currency` | No | `InventoryConceptDto` | Sin restricción adicional declarada | Moneda del total congelado, resuelta. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `items[].currency.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].currency.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].rejectionReasonText` | No | `string` | admite null | Motivo del rechazo, en palabras, cuando el estado es `RECHAZADO` (v4.2.1 lo persiste). `null` en cualquier otro estado. | `Texto descriptivo de ejemplo` |
| `items[].substitutions` | Sí | `array<PharmacyOrderSubstitutionDto>` | Sin restricción adicional declarada | La historia de propuestas de sustitución del pedido, más nuevas primero. Las decididas conservan su estado y su `decidedAt`: son bitácora, no un campo mutable. | `[{"id":"00000000-0000-4000-8000-000000000001","originalProductId":"00000000-0000-4000-8000-000000000001","originalName":"Nombre de ejemplo","originalUnitPriceAmount":"valor-ejemplo","proposedProductId":"00000000-0000-4000-8000-000000000001","proposedName":"Nombre de ejemplo","proposedUnitPriceAmount":"valor-ejemplo","currency":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"decidedAt":"valor-ejemplo"}]` |
| `items[].substitutions[].id` | Sí | `string` | formato `uuid` | Identificador de la propuesta. | `00000000-0000-4000-8000-000000000001` |
| `items[].substitutions[].originalProductId` | Sí | `string` | formato `uuid` | Producto recetado/pedido. | `00000000-0000-4000-8000-000000000001` |
| `items[].substitutions[].originalName` | Sí | `string` | Sin restricción adicional declarada | Nombre pintable del original. | `Nombre de ejemplo` |
| `items[].substitutions[].originalUnitPriceAmount` | No | `string` | admite null | Precio congelado del original al proponer, o `null` sin precio publicado. | `valor-ejemplo` |
| `items[].substitutions[].proposedProductId` | Sí | `string` | formato `uuid` | Producto propuesto (mismo medicamento del vademécum). | `00000000-0000-4000-8000-000000000001` |
| `items[].substitutions[].proposedName` | Sí | `string` | Sin restricción adicional declarada | Nombre pintable del propuesto. | `Nombre de ejemplo` |
| `items[].substitutions[].proposedUnitPriceAmount` | No | `string` | admite null | Precio congelado del propuesto: la oferta que el paciente decidió. | `valor-ejemplo` |
| `items[].substitutions[].currency` | No | `InventoryConceptDto` | Sin restricción adicional declarada | Moneda de la oferta, resuelta. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `items[].substitutions[].currency.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].substitutions[].currency.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].substitutions[].status` | Sí | `InventoryConceptDto` | Sin restricción adicional declarada | Estado de la propuesta (`PINV_SUBSTITUTION_*`), resuelto. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `items[].substitutions[].status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].substitutions[].status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].substitutions[].decidedAt` | No | `string` | admite null | Cuándo se decidió (aceptó/rechazó/retiró), ISO 8601; `null` en pie. | `valor-ejemplo` |
| `items[].lines` | Sí | `array<PharmacyOrderLineDto>` | Sin restricción adicional declarada | Líneas del pedido. | `[{"productId":"00000000-0000-4000-8000-000000000001","medicationConceptId":"00000000-0000-4000-8000-000000000001","productCode":"CODIGO_EJEMPLO","brandName":"Nombre de ejemplo","genericName":"Nombre de ejemplo","strengthText":"valor-ejemplo","packageSizeText":"valor-ejemplo","medication":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"requestedQuantity":1,"reservedQuantity":1,"fulfilledQuantity":1,"unitPriceAmount":"valor-ejemplo","currency":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}}]` |
| `items[].lines[].productId` | Sí | `string` | formato `uuid` | Identificador asociado a product. | `00000000-0000-4000-8000-000000000001` |
| `items[].lines[].medicationConceptId` | No | `string` | formato `uuid`; admite null | Concepto de medicamento asociado al producto, cuando fue publicado. | `00000000-0000-4000-8000-000000000001` |
| `items[].lines[].productCode` | Sí | `string` | Sin restricción adicional declarada | Código interno del producto. | `CODIGO_EJEMPLO` |
| `items[].lines[].brandName` | No | `string` | admite null | Nombre comercial. | `Nombre de ejemplo` |
| `items[].lines[].genericName` | No | `string` | admite null | Nombre genérico. | `Nombre de ejemplo` |
| `items[].lines[].strengthText` | No | `string` | admite null | Concentración, legible. | `valor-ejemplo` |
| `items[].lines[].packageSizeText` | No | `string` | admite null | Presentación, legible. | `valor-ejemplo` |
| `items[].lines[].medication` | No | `InventoryConceptDto` | Sin restricción adicional declarada | Medicamento del vademécum, resuelto. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `items[].lines[].medication.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].lines[].medication.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].lines[].requestedQuantity` | Sí | `number` | Sin restricción adicional declarada | Cantidad solicitada por el paciente. | `1` |
| `items[].lines[].reservedQuantity` | Sí | `number` | Sin restricción adicional declarada | Cantidad efectivamente reservada; `0` cuando la línea quedó sin stock. | `1` |
| `items[].lines[].fulfilledQuantity` | Sí | `number` | Sin restricción adicional declarada | Cantidad ya entregada en el mostrador, acumulada entre entregas parciales (FAR-E3). El saldo por retirar es `reservedQuantity − fulfilledQuantity`. | `1` |
| `items[].lines[].unitPriceAmount` | No | `string` | admite null | Precio unitario CONGELADO del renglón (lo que paga el paciente), sellado al crear el pedido o al aceptar una sustitución. `null` si la sede no publicaba precio: el GET no recalcula — un precio congelado que se recalcula contra listas nuevas reescribe un pedido histórico. | `valor-ejemplo` |
| `items[].lines[].currency` | No | `InventoryConceptDto` | Sin restricción adicional declarada | Moneda del precio congelado, resuelta. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `items[].lines[].currency.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].lines[].currency.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].lines[].status` | Sí | `InventoryConceptDto` | Sin restricción adicional declarada | Estado de la línea (`PINV_RES_LINE_CONFIRMED` reservada, `PINV_RES_LINE_OUT_OF_STOCK` sin stock, `PINV_RES_LINE_RELEASED` liberada). | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `items[].lines[].status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].lines[].status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Cuántos pedidos se sirven. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PATIENT. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | El proveedor configurado para el canal in-app no existe | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 422 | `PRECONDITION_FAILED` | La cuenta autenticada no tiene perfil de paciente | Excepción explícita en src/modules/pharmacy_inventory/services/pharmacy-orders.service.ts |
| 422 | `PRECONDITION_FAILED` | No hay canal in-app activo: falta correr el seed de mensajería | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 422 | `PRECONDITION_FAILED` | El canal in-app no tiene configuración de proveedor activa | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pharmacy/orders/me"
}
```

---

## 28. POST /pharmacy/recall-holds

- **Módulo:** `pharmacy_inventory`
- **Etiqueta OpenAPI:** `pharmacy-inventory`
- **Nombre:** Aplicar retiro/recall de lote (UC-25-08)
- **Operation ID:** `PharmacyInventoryController_createRecallHold`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyInventoryController.createRecallHold](../../src/modules/pharmacy_inventory/controllers/pharmacy-inventory.controller.ts)

### Descripción de negocio

Aplicar retiro/recall de lote (UC-25-08). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-25-08: aplicar recall/hold sobre un lote.

### Descripción del sistema

NestJS resuelve `POST /pharmacy/recall-holds` en `PharmacyInventoryController_createRecallHold`. El controlador delega en `InventoryRecallService.createHold`. Valida el body como `CreateRecallHoldDto` y consume `application/json`. El tipo de retorno estático es `Promise<IdResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateRecallHoldDto`; los campos opcionales se omiten.

```http
POST /pharmacy/recall-holds HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "pharmacyId": "00000000-0000-4000-8000-000000000001",
  "pharmacySiteId": "00000000-0000-4000-8000-000000000001",
  "pharmacyProductId": "00000000-0000-4000-8000-000000000001",
  "inventoryLotId": "00000000-0000-4000-8000-000000000001",
  "inventoryLocationId": "00000000-0000-4000-8000-000000000001",
  "recallReference": "valor-ejemplo"
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
| `pharmacyId` | Sí | `string` | formato `uuid` | Farmacia (para el ledger) | `00000000-0000-4000-8000-000000000001` |
| `pharmacySiteId` | Sí | `string` | formato `uuid` | Sede de farmacia (para el ledger) | `00000000-0000-4000-8000-000000000001` |
| `pharmacyProductId` | Sí | `string` | formato `uuid` | Producto afectado | `00000000-0000-4000-8000-000000000001` |
| `inventoryLotId` | Sí | `string` | formato `uuid` | Lote a poner en cuarentena | `00000000-0000-4000-8000-000000000001` |
| `inventoryLocationId` | Sí | `string` | formato `uuid` | Ubicación del lote (para el ledger) | `00000000-0000-4000-8000-000000000001` |
| `recallReference` | Sí | `string` | longitud máxima 128 | Referencia del recall (autoridad) | `valor-ejemplo` |
| `sourceAuthorityTenantId` | No | `string` | formato `uuid` | Tenant de la autoridad emisora | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /pharmacy/recall-holds HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "pharmacyId": "00000000-0000-4000-8000-000000000001",
  "pharmacySiteId": "00000000-0000-4000-8000-000000000001",
  "pharmacyProductId": "00000000-0000-4000-8000-000000000001",
  "inventoryLotId": "00000000-0000-4000-8000-000000000001",
  "inventoryLocationId": "00000000-0000-4000-8000-000000000001",
  "recallReference": "valor-ejemplo",
  "sourceAuthorityTenantId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<IdResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `IdResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Lote no encontrado | Excepción explícita en src/modules/pharmacy_inventory/services/inventory-recall.service.ts |
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
  "path": "/pharmacy/recall-holds"
}
```

---

## 29. POST /pharmacy/recall-holds/{id}/release

- **Módulo:** `pharmacy_inventory`
- **Etiqueta OpenAPI:** `pharmacy-inventory`
- **Nombre:** Liberar recall y reactivar lote (UC-25-09)
- **Operation ID:** `PharmacyInventoryController_releaseRecallHold`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyInventoryController.releaseRecallHold](../../src/modules/pharmacy_inventory/controllers/pharmacy-inventory.controller.ts)

### Descripción de negocio

Liberar recall y reactivar lote (UC-25-09). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-25-09: liberar recall y reactivar lote.

### Descripción del sistema

NestJS resuelve `POST /pharmacy/recall-holds/{id}/release` en `PharmacyInventoryController_releaseRecallHold`. El controlador delega en `InventoryRecallService.release`. Valida el body como `ReleaseRecallHoldDto` y consume `application/json`. El tipo de retorno estático es `Promise<StatusResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ReleaseRecallHoldDto`; los campos opcionales se omiten.

```http
POST /pharmacy/recall-holds/00000000-0000-4000-8000-000000000001/release HTTP/1.1
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
| `writeOff` | No | `boolean` | Sin restricción adicional declarada | Si es true, el stock en cuarentena se da de baja (write-off) en vez de reintegrarse | `false` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /pharmacy/recall-holds/00000000-0000-4000-8000-000000000001/release HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "writeOff": false
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
| 404 | `NOT_FOUND` | Hold de recall no encontrado | Excepción explícita en src/modules/pharmacy_inventory/services/inventory-recall.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El hold no está activo | Excepción explícita en src/modules/pharmacy_inventory/services/inventory-recall.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pharmacy/recall-holds/{id}/release"
}
```

---

