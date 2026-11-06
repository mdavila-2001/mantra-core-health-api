<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `pharmacy_inventory`

Referencia exhaustiva de 47 operación(es) del módulo `pharmacy_inventory`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `pharmacy-inventory`, `pharmacy-inventory-directory`, `pharmacy-inventory-internal`, `pharmacy-orders`, `pharmacy-prescription-shares`
- **Controladores:** `PharmacyDispensingController`, `PharmacyIntegrationSyncController`, `PharmacyInventoryController`, `PharmacyInventoryInternalController`, `PharmacyInventoryManagementController`, `PharmacyInventoryReadController`, `PharmacyOrdersController`, `PharmacyPrescriptionSharesController`, `PharmacyProcurementController`, `PharmacySiteAvailabilityController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [POST /internal/inventory-sync-batches](#1-post-internal-inventory-sync-batches) — Ingerir un lote de sincronización ERP
2. [POST /internal/inventory-sync/{batchId}/reconcile](#2-post-internal-inventory-sync-batchid-reconcile) — Conciliar lote de sincronización externa (UC-25-12)
3. [POST /internal/reservations/expire](#3-post-internal-reservations-expire) — Liberar reservas y pedidos vencidos (UC-25-05)
4. [GET /pharmacies/{pharmacyId}/integration-connections](#4-get-pharmacies-pharmacyid-integration-connections) — Conexiones de integración de la farmacia
5. [GET /pharmacies/{pharmacyId}/integration-connections/{connectionId}/external-products](#5-get-pharmacies-pharmacyid-integration-connections-connectionid-external-products) — Catálogo del sistema de la farmacia, con el vínculo de cada código
6. [DELETE /pharmacies/{pharmacyId}/integration-connections/{connectionId}/external-system](#6-delete-pharmacies-pharmacyid-integration-connections-connectionid-external-system) — Quitar el sistema propio de la farmacia
7. [PUT /pharmacies/{pharmacyId}/integration-connections/{connectionId}/external-system](#7-put-pharmacies-pharmacyid-integration-connections-connectionid-external-system) — Configurar el sistema propio de la farmacia
8. [POST /pharmacies/{pharmacyId}/integration-connections/{connectionId}/external-system/test](#8-post-pharmacies-pharmacyid-integration-connections-connectionid-external-system-test) — Probar el sistema de la farmacia
9. [GET /pharmacies/{pharmacyId}/integration-connections/{connectionId}/product-mappings](#9-get-pharmacies-pharmacyid-integration-connections-connectionid-product-mappings) — Vínculos de productos de una conexión
10. [POST /pharmacies/{pharmacyId}/integration-connections/{connectionId}/sync](#10-post-pharmacies-pharmacyid-integration-connections-connectionid-sync) — Traer el stock del sistema de la farmacia y aplicarlo por sede
11. [GET /pharmacies/{pharmacyId}/integration-connections/{connectionId}/sync-batches](#11-get-pharmacies-pharmacyid-integration-connections-connectionid-sync-batches) — Últimas sincronizaciones de una conexión
12. [POST /pharmacies/{pharmacyId}/sites/{siteId}/availability/bulk](#12-post-pharmacies-pharmacyid-sites-siteid-availability-bulk) — Marcar en lote qué productos tiene una sucursal, y cuántos, con vista previa
13. [PUT /pharmacies/{pharmacyId}/sites/{siteId}/products/{productId}/availability](#13-put-pharmacies-pharmacyid-sites-siteid-products-productid-availability) — Marcar si una sucursal tiene un producto, y cuántas unidades
14. [GET /pharmacy-inventory/availability](#14-get-pharmacy-inventory-availability) — Consultar qué sedes pueden surtir un conjunto de productos
15. [GET /pharmacy-inventory/availability/medications](#15-get-pharmacy-inventory-availability-medications) — Consultar qué sedes de la red pueden surtir unos medicamentos
16. [GET /pharmacy-inventory/sites/{siteId}/stock](#16-get-pharmacy-inventory-sites-siteid-stock) — Consultar el stock disponible de una sede
17. [POST /pharmacy/{pharmacyId}/dispensations](#17-post-pharmacy-pharmacyid-dispensations) — Dispensar una prescripción a un paciente (UC-25-03)
18. [POST /pharmacy/{pharmacyId}/goods-receipts](#18-post-pharmacy-pharmacyid-goods-receipts) — Recepcionar mercancía por lote (UC-25-02)
19. [GET /pharmacy/{pharmacyId}/inventory/ledger](#19-get-pharmacy-pharmacyid-inventory-ledger) — Libro de movimientos (kardex), por secuencia de registro, la más reciente primero
20. [GET /pharmacy/{pharmacyId}/inventory/locations](#20-get-pharmacy-pharmacyid-inventory-locations) — Ubicaciones activas de las sedes de la farmacia
21. [GET /pharmacy/{pharmacyId}/inventory/lots](#21-get-pharmacy-pharmacyid-inventory-lots) — Lotes con su vencimiento, estados y existencia por sede
22. [GET /pharmacy/{pharmacyId}/inventory/positions](#22-get-pharmacy-pharmacyid-inventory-positions) — Existencias por sede, ubicación y lote, con su desglose
23. [POST /pharmacy/{pharmacyId}/purchase-orders](#23-post-pharmacy-pharmacyid-purchase-orders) — Emitir una orden de compra a proveedor (UC-25-01)
24. [POST /pharmacy/{pharmacyId}/reservations](#24-post-pharmacy-pharmacyid-reservations) — Reservar stock para una prescripción (UC-25-04)
25. [POST /pharmacy/{pharmacyId}/suppliers](#25-post-pharmacy-pharmacyid-suppliers) — Registrar un proveedor de farmacia
26. [POST /pharmacy/{pharmacyId}/transfers](#26-post-pharmacy-pharmacyid-transfers) — Transferir stock entre ubicaciones (UC-25-10)
27. [POST /pharmacy/{siteId}/count-sessions](#27-post-pharmacy-siteid-count-sessions) — Iniciar y congelar una sesión de conteo (UC-25-06)
28. [POST /pharmacy/{siteId}/inventory-locations](#28-post-pharmacy-siteid-inventory-locations) — Crear una ubicación de inventario
29. [POST /pharmacy/count-sessions/{id}/approve](#29-post-pharmacy-count-sessions-id-approve) — Aprobar conteo y ajustar ledger por varianza (UC-25-07)
30. [POST /pharmacy/dispensations/{id}/reverse](#30-post-pharmacy-dispensations-id-reverse) — Reversar una dispensación (UC-25-11)
31. [POST /pharmacy/inventory-locations/{id}/relocate](#31-post-pharmacy-inventory-locations-id-relocate) — Reubicar una ubicación de inventario (F5c)
32. [GET /pharmacy/orders](#32-get-pharmacy-orders) — Bandeja de pedidos de las farmacias del tenant (FAR-E2)
33. [POST /pharmacy/orders](#33-post-pharmacy-orders) — Crear un pedido de farmacia (FAR-E1)
34. [GET /pharmacy/orders/{id}](#34-get-pharmacy-orders-id) — Consultar un pedido de farmacia (FAR-E1)
35. [POST /pharmacy/orders/{id}/accept-substitutions](#35-post-pharmacy-orders-id-accept-substitutions) — Aceptar los genéricos propuestos (paciente)
36. [POST /pharmacy/orders/{id}/cancel](#36-post-pharmacy-orders-id-cancel) — Cancelar un pedido de farmacia (FAR-E1)
37. [POST /pharmacy/orders/{id}/confirm](#37-post-pharmacy-orders-id-confirm) — Confirmar el pedido (FAR-E2)
38. [POST /pharmacy/orders/{id}/conversation](#38-post-pharmacy-orders-id-conversation) — Abrir el chat del pedido con la farmacia
39. [POST /pharmacy/orders/{id}/dispense](#39-post-pharmacy-orders-id-dispense) — Dispensar el pedido en el mostrador (FAR-E3)
40. [POST /pharmacy/orders/{id}/prefer-original](#40-post-pharmacy-orders-id-prefer-original) — Preferir los productos originales (paciente)
41. [POST /pharmacy/orders/{id}/ready](#41-post-pharmacy-orders-id-ready) — Marcar el pedido listo para retiro (FAR-E2/E3)
42. [POST /pharmacy/orders/{id}/reject](#42-post-pharmacy-orders-id-reject) — Rechazar el pedido (FAR-E2)
43. [POST /pharmacy/orders/{id}/review](#43-post-pharmacy-orders-id-review) — Abrir revisión del pedido (FAR-E2)
44. [GET /pharmacy/orders/me](#44-get-pharmacy-orders-me) — Mis pedidos de farmacia, más nuevos primero (FAR-E1)
45. [GET /pharmacy/prescription-shares/{token}](#45-get-pharmacy-prescription-shares-token) — Abrir una receta compartida desde la farmacia (FAR-02)
46. [POST /pharmacy/recall-holds](#46-post-pharmacy-recall-holds) — Aplicar retiro/recall de lote (UC-25-08)
47. [POST /pharmacy/recall-holds/{id}/release](#47-post-pharmacy-recall-holds-id-release) — Liberar recall y reactivar lote (UC-25-09)

---

## 1. POST /internal/inventory-sync-batches

- **Módulo:** `pharmacy_inventory`
- **Etiqueta OpenAPI:** `pharmacy-inventory-internal`
- **Nombre:** Ingerir un lote de sincronización ERP
- **Operation ID:** `PharmacyInventoryInternalController_createSyncBatch`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyInventoryInternalController.createSyncBatch](../../src/modules/pharmacy_inventory/presentation/controllers/pharmacy-inventory-internal.controller.ts)

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
| 504 | Operación completada correctamente. | `Promise<SyncBatchResponseDto>` | No |

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
- **Implementación:** [PharmacyInventoryInternalController.reconcile](../../src/modules/pharmacy_inventory/presentation/controllers/pharmacy-inventory-internal.controller.ts)

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
| 504 | Operación completada correctamente. | `Promise<ReconcileResponseDto>` | No |

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
| 422 | `PRECONDITION_FAILED` | El lote no está en estado reconciliable | Excepción explícita en src/modules/pharmacy_inventory/application/inventory-sync/reconcile-inventory-sync-batch.use-case.ts |
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
- **Implementación:** [PharmacyInventoryInternalController.expireReservations](../../src/modules/pharmacy_inventory/presentation/controllers/pharmacy-inventory-internal.controller.ts)

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
| 504 | Operación completada correctamente. | `Promise<ExpireReservationsResponseDto>` | No |

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

## 4. GET /pharmacies/{pharmacyId}/integration-connections

- **Módulo:** `pharmacy_inventory`
- **Etiqueta OpenAPI:** `pharmacy-inventory`
- **Nombre:** Conexiones de integración de la farmacia
- **Operation ID:** `PharmacyIntegrationSyncController_listConnections`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyIntegrationSyncController.listConnections](../../src/modules/pharmacy_inventory/presentation/controllers/pharmacy-integration-sync.controller.ts)

### Descripción de negocio

Conexiones de integración de la farmacia. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /pharmacies/{pharmacyId}/integration-connections` en `PharmacyIntegrationSyncController_listConnections`. El controlador delega en `IntegrationReadService.connections`. No recibe body. El tipo de retorno estático es `Promise<IntegrationConnectionListDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /pharmacies/00000000-0000-4000-8000-000000000001/integration-connections HTTP/1.1
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
GET /pharmacies/00000000-0000-4000-8000-000000000001/integration-connections HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<IntegrationConnectionListDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<IntegrationConnectionListDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<IntegrationConnectionListDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<IntegrationConnectionListDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<IntegrationConnectionListDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<IntegrationConnectionListDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<IntegrationConnectionListDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<IntegrationConnectionListDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `IntegrationConnectionListDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "pharmacySiteId": {},
      "siteName": {},
      "integrationMode": "BATCH",
      "supportsStockQuery": true,
      "status": "ACTIVE",
      "providerConfigured": true,
      "system": {
        "format": "ALOVIDA_STANDARD",
        "baseUrl": "valor-ejemplo",
        "externalPharmacyCode": "CODIGO_EJEMPLO",
        "apiKeyConfigured": true,
        "configuredAt": "2026-07-31T12:00:00.000Z",
        "lastCheck": {
          "status": "ACTIVE",
          "errorReason": "AUTH_REJECTED",
          "checkedAt": "2026-07-31T12:00:00.000Z"
        }
      },
      "createdAt": "2026-07-31T12:00:00.000Z"
    }
  ],
  "providerConfigured": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<IntegrationConnectionDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","pharmacySiteId":{},"siteName":{},"integrationMode":"BATCH","supportsStockQuery":true,"status":"ACTIVE","providerConfigured":true,"system":{"format":"ALOVIDA_STANDARD","baseUrl":"valor-ejemplo","externalPharmacyCode":"CODIGO_EJEMPLO","apiKeyConfigured":true,"configuredAt":"2026-07-31T12:00:00.000Z","lastCheck":{"status":"ACTIVE","errorReason":"AUTH_REJECTED","checkedAt":"2026-07-31T12:00:00.000Z"}},"createdAt":"2026-07-31T12:00:00.000Z"}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].pharmacySiteId` | No | `object` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `items[].siteName` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `items[].integrationMode` | Sí | `string` | valores: `BATCH`, `REALTIME` | Sin descripción específica en el contrato OpenAPI. | `BATCH` |
| `items[].supportsStockQuery` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `items[].status` | Sí | `string` | valores: `ACTIVE`, `INACTIVE` | Sin descripción específica en el contrato OpenAPI. | `ACTIVE` |
| `items[].providerConfigured` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `items[].system` | Sí | `ExternalSystemSummaryDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"format":"ALOVIDA_STANDARD","baseUrl":"valor-ejemplo","externalPharmacyCode":"CODIGO_EJEMPLO","apiKeyConfigured":true,"configuredAt":"2026-07-31T12:00:00.000Z","lastCheck":{"status":"ACTIVE","errorReason":"AUTH_REJECTED","checkedAt":"2026-07-31T12:00:00.000Z"}}` |
| `items[].system.format` | Sí | `string` | valores: `ALOVIDA_STANDARD`, `SIMULATED_CHAIN` | Sin descripción específica en el contrato OpenAPI. | `ALOVIDA_STANDARD` |
| `items[].system.baseUrl` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].system.externalPharmacyCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].system.apiKeyConfigured` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `items[].system.configuredAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `items[].system.lastCheck` | No | `ExternalSystemLastCheckDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"status":"ACTIVE","errorReason":"AUTH_REJECTED","checkedAt":"2026-07-31T12:00:00.000Z"}` |
| `items[].system.lastCheck.status` | No | `string` | valores: `ACTIVE`, `ERROR` | Sin descripción específica en el contrato OpenAPI. | `ACTIVE` |
| `items[].system.lastCheck.errorReason` | No | `string` | valores: `AUTH_REJECTED`, `UNREACHABLE`; admite null | Sin descripción específica en el contrato OpenAPI. | `AUTH_REJECTED` |
| `items[].system.lastCheck.checkedAt` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `items[].createdAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `providerConfigured` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |

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
  "path": "/pharmacies/{pharmacyId}/integration-connections"
}
```

---

## 5. GET /pharmacies/{pharmacyId}/integration-connections/{connectionId}/external-products

- **Módulo:** `pharmacy_inventory`
- **Etiqueta OpenAPI:** `pharmacy-inventory`
- **Nombre:** Catálogo del sistema de la farmacia, con el vínculo de cada código
- **Operation ID:** `PharmacyIntegrationSyncController_listExternalProducts`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyIntegrationSyncController.listExternalProducts](../../src/modules/pharmacy_inventory/presentation/controllers/pharmacy-integration-sync.controller.ts)

### Descripción de negocio

Catálogo del sistema de la farmacia, con el vínculo de cada código. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /pharmacies/{pharmacyId}/integration-connections/{connectionId}/external-products` en `PharmacyIntegrationSyncController_listExternalProducts`. El controlador delega en `IntegrationReadService.externalProducts`. No recibe body. El tipo de retorno estático es `Promise<ExternalCatalogListDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `connectionId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /pharmacies/00000000-0000-4000-8000-000000000001/integration-connections/00000000-0000-4000-8000-000000000001/external-products HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PHARMACY_STAFF`.
- Deben ser UUID válidos: `pharmacyId`, `connectionId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /pharmacies/00000000-0000-4000-8000-000000000001/integration-connections/00000000-0000-4000-8000-000000000001/external-products HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ExternalCatalogListDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<ExternalCatalogListDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<ExternalCatalogListDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<ExternalCatalogListDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<ExternalCatalogListDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<ExternalCatalogListDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<ExternalCatalogListDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<ExternalCatalogListDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ExternalCatalogListDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "code": "CODIGO_EJEMPLO",
      "name": "Nombre de ejemplo",
      "presentation": {},
      "unitCode": {},
      "mappedProductId": {},
      "mappingStatus": "MAPPED",
      "mappedProductIds": [
        "00000000-0000-4000-8000-000000000001"
      ]
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<ExternalCatalogProductDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","presentation":{},"unitCode":{},"mappedProductId":{},"mappingStatus":"MAPPED","mappedProductIds":["00000000-0000-4000-8000-000000000001"]}]` |
| `items[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].presentation` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `items[].unitCode` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `items[].mappedProductId` | No | `object` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `items[].mappingStatus` | Sí | `string` | valores: `MAPPED`, `UNMAPPED`, `AMBIGUOUS` | Sin descripción específica en el contrato OpenAPI. | `MAPPED` |
| `items[].mappedProductIds` | Sí | `array<string>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `["00000000-0000-4000-8000-000000000001"]` |

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
  "path": "/pharmacies/{pharmacyId}/integration-connections/{connectionId}/external-products"
}
```

---

## 6. DELETE /pharmacies/{pharmacyId}/integration-connections/{connectionId}/external-system

- **Módulo:** `pharmacy_inventory`
- **Etiqueta OpenAPI:** `pharmacy-inventory`
- **Nombre:** Quitar el sistema propio de la farmacia
- **Operation ID:** `PharmacyIntegrationSyncController_removeExternalSystem`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyIntegrationSyncController.removeExternalSystem](../../src/modules/pharmacy_inventory/presentation/controllers/pharmacy-integration-sync.controller.ts)

### Descripción de negocio

Quitar el sistema propio de la farmacia. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Quita el sistema propio: la conexión vuelve al del servidor o a manual.

### Descripción del sistema

NestJS resuelve `DELETE /pharmacies/{pharmacyId}/integration-connections/{connectionId}/external-system` en `PharmacyIntegrationSyncController_removeExternalSystem`. El controlador delega en `ConfigureExternalSystemUseCase.remove`. No recibe body. El tipo de retorno estático es `Promise<void>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `connectionId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
DELETE /pharmacies/00000000-0000-4000-8000-000000000001/integration-connections/00000000-0000-4000-8000-000000000001/external-system HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PHARMACY_STAFF`.
- Deben ser UUID válidos: `pharmacyId`, `connectionId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
DELETE /pharmacies/00000000-0000-4000-8000-000000000001/integration-connections/00000000-0000-4000-8000-000000000001/external-system HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 204 | Operación completada sin cuerpo de respuesta. | `Promise<void>` | No |
| 400 | Operación completada correctamente. | `Promise<void>` | No |
| 401 | Operación completada correctamente. | `Promise<void>` | No |
| 403 | Operación completada correctamente. | `Promise<void>` | No |
| 404 | Operación completada correctamente. | `Promise<void>` | No |
| 409 | Operación completada correctamente. | `Promise<void>` | No |
| 422 | Operación completada correctamente. | `Promise<void>` | No |
| 429 | Operación completada correctamente. | `Promise<void>` | No |
| 500 | Operación completada correctamente. | `Promise<void>` | No |
| 504 | Operación completada correctamente. | `Promise<void>` | No |

La operación no devuelve body según el tipo TypeScript del controlador.

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
  "path": "/pharmacies/{pharmacyId}/integration-connections/{connectionId}/external-system"
}
```

---

## 7. PUT /pharmacies/{pharmacyId}/integration-connections/{connectionId}/external-system

- **Módulo:** `pharmacy_inventory`
- **Etiqueta OpenAPI:** `pharmacy-inventory`
- **Nombre:** Configurar el sistema propio de la farmacia
- **Operation ID:** `PharmacyIntegrationSyncController_configureExternalSystem`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyIntegrationSyncController.configureExternalSystem](../../src/modules/pharmacy_inventory/presentation/controllers/pharmacy-integration-sync.controller.ts)

### Descripción de negocio

Configurar el sistema propio de la farmacia. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: FAR-C9 · C9-3: la farmacia carga su sistema (formato, dirección, código y clave). Se prueba antes de guardar; si no responde, no queda nada.

### Descripción del sistema

NestJS resuelve `PUT /pharmacies/{pharmacyId}/integration-connections/{connectionId}/external-system` en `PharmacyIntegrationSyncController_configureExternalSystem`. El controlador delega en `ConfigureExternalSystemUseCase.save`. Valida el body como `ConfigureExternalSystemDto` y consume `application/json`. El tipo de retorno estático es `Promise<ExternalSystemResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `connectionId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ConfigureExternalSystemDto`; los campos opcionales se omiten.

```http
PUT /pharmacies/00000000-0000-4000-8000-000000000001/integration-connections/00000000-0000-4000-8000-000000000001/external-system HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "format": "ALOVIDA_STANDARD",
  "baseUrl": "valor-ejemplo",
  "externalPharmacyCode": "CODIGO_EJEMPLO",
  "apiKey": "valor-ejemplo"
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
| `format` | Sí | `string` | valores: `ALOVIDA_STANDARD`, `SIMULATED_CHAIN` | Sin descripción específica en el contrato OpenAPI. | `ALOVIDA_STANDARD` |
| `baseUrl` | Sí | `string` | longitud mínima 8; longitud máxima 500 | Dirección que la plataforma va a llamar (http o https) | `valor-ejemplo` |
| `externalPharmacyCode` | Sí | `string` | longitud mínima 1; longitud máxima 100 | Código de la farmacia (o de la cadena) en ese sistema | `CODIGO_EJEMPLO` |
| `apiKey` | Sí | `string` | longitud mínima 1; longitud máxima 500; solo escritura | Clave de la farmacia en ese sistema | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PUT /pharmacies/00000000-0000-4000-8000-000000000001/integration-connections/00000000-0000-4000-8000-000000000001/external-system HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "format": "ALOVIDA_STANDARD",
  "baseUrl": "valor-ejemplo",
  "externalPharmacyCode": "CODIGO_EJEMPLO",
  "apiKey": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ExternalSystemResponseDto>` | Sí |
| 400 | Operación completada correctamente. | `Promise<ExternalSystemResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ExternalSystemResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ExternalSystemResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ExternalSystemResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ExternalSystemResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ExternalSystemResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ExternalSystemResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ExternalSystemResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ExternalSystemResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<ExternalSystemResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ExternalSystemResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "system": {
    "format": "ALOVIDA_STANDARD",
    "baseUrl": "valor-ejemplo",
    "externalPharmacyCode": "CODIGO_EJEMPLO",
    "apiKeyConfigured": true,
    "configuredAt": "2026-07-31T12:00:00.000Z",
    "lastCheck": {
      "status": "ACTIVE",
      "errorReason": "AUTH_REJECTED",
      "checkedAt": "2026-07-31T12:00:00.000Z"
    }
  },
  "probe": "OK"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `system` | Sí | `ExternalSystemSummaryDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"format":"ALOVIDA_STANDARD","baseUrl":"valor-ejemplo","externalPharmacyCode":"CODIGO_EJEMPLO","apiKeyConfigured":true,"configuredAt":"2026-07-31T12:00:00.000Z","lastCheck":{"status":"ACTIVE","errorReason":"AUTH_REJECTED","checkedAt":"2026-07-31T12:00:00.000Z"}}` |
| `system.format` | Sí | `string` | valores: `ALOVIDA_STANDARD`, `SIMULATED_CHAIN` | Sin descripción específica en el contrato OpenAPI. | `ALOVIDA_STANDARD` |
| `system.baseUrl` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `system.externalPharmacyCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `system.apiKeyConfigured` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `system.configuredAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `system.lastCheck` | No | `ExternalSystemLastCheckDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"status":"ACTIVE","errorReason":"AUTH_REJECTED","checkedAt":"2026-07-31T12:00:00.000Z"}` |
| `system.lastCheck.status` | No | `string` | valores: `ACTIVE`, `ERROR` | Sin descripción específica en el contrato OpenAPI. | `ACTIVE` |
| `system.lastCheck.errorReason` | No | `string` | valores: `AUTH_REJECTED`, `UNREACHABLE`; admite null | Sin descripción específica en el contrato OpenAPI. | `AUTH_REJECTED` |
| `system.lastCheck.checkedAt` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `probe` | Sí | `string` | valores: `OK` | Sin descripción específica en el contrato OpenAPI. | `OK` |

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
  "path": "/pharmacies/{pharmacyId}/integration-connections/{connectionId}/external-system"
}
```

---

## 8. POST /pharmacies/{pharmacyId}/integration-connections/{connectionId}/external-system/test

- **Módulo:** `pharmacy_inventory`
- **Etiqueta OpenAPI:** `pharmacy-inventory`
- **Nombre:** Probar el sistema de la farmacia
- **Operation ID:** `PharmacyIntegrationSyncController_probeExternalSystem`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyIntegrationSyncController.probeExternalSystem](../../src/modules/pharmacy_inventory/presentation/controllers/pharmacy-integration-sync.controller.ts)

### Descripción de negocio

Probar el sistema de la farmacia. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Prueba el sistema que usa hoy la conexión.

### Descripción del sistema

NestJS resuelve `POST /pharmacies/{pharmacyId}/integration-connections/{connectionId}/external-system/test` en `PharmacyIntegrationSyncController_probeExternalSystem`. El controlador delega en `ConfigureExternalSystemUseCase.probe`. No recibe body. El tipo de retorno estático es `Promise<ExternalSystemProbeDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `connectionId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /pharmacies/00000000-0000-4000-8000-000000000001/integration-connections/00000000-0000-4000-8000-000000000001/external-system/test HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PHARMACY_STAFF`.
- Deben ser UUID válidos: `pharmacyId`, `connectionId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /pharmacies/00000000-0000-4000-8000-000000000001/integration-connections/00000000-0000-4000-8000-000000000001/external-system/test HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ExternalSystemProbeDto>` | Sí |
| 400 | Operación completada correctamente. | `Promise<ExternalSystemProbeDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ExternalSystemProbeDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ExternalSystemProbeDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ExternalSystemProbeDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ExternalSystemProbeDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ExternalSystemProbeDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ExternalSystemProbeDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ExternalSystemProbeDto>` | No |
| 504 | Operación completada correctamente. | `Promise<ExternalSystemProbeDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ExternalSystemProbeDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "status": "OK",
  "source": "PHARMACY"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `status` | Sí | `string` | valores: `OK` | Sin descripción específica en el contrato OpenAPI. | `OK` |
| `source` | Sí | `string` | valores: `PHARMACY`, `SERVER` | Sin descripción específica en el contrato OpenAPI. | `PHARMACY` |

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
  "path": "/pharmacies/{pharmacyId}/integration-connections/{connectionId}/external-system/test"
}
```

---

## 9. GET /pharmacies/{pharmacyId}/integration-connections/{connectionId}/product-mappings

- **Módulo:** `pharmacy_inventory`
- **Etiqueta OpenAPI:** `pharmacy-inventory`
- **Nombre:** Vínculos de productos de una conexión
- **Operation ID:** `PharmacyIntegrationSyncController_listMappings`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyIntegrationSyncController.listMappings](../../src/modules/pharmacy_inventory/presentation/controllers/pharmacy-integration-sync.controller.ts)

### Descripción de negocio

Vínculos de productos de una conexión. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /pharmacies/{pharmacyId}/integration-connections/{connectionId}/product-mappings` en `PharmacyIntegrationSyncController_listMappings`. El controlador delega en `IntegrationReadService.mappings`. No recibe body. El tipo de retorno estático es `Promise<IntegrationMappingListDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `connectionId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /pharmacies/00000000-0000-4000-8000-000000000001/integration-connections/00000000-0000-4000-8000-000000000001/product-mappings HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PHARMACY_STAFF`.
- Deben ser UUID válidos: `pharmacyId`, `connectionId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /pharmacies/00000000-0000-4000-8000-000000000001/integration-connections/00000000-0000-4000-8000-000000000001/product-mappings HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<IntegrationMappingListDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<IntegrationMappingListDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<IntegrationMappingListDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<IntegrationMappingListDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<IntegrationMappingListDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<IntegrationMappingListDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<IntegrationMappingListDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<IntegrationMappingListDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `IntegrationMappingListDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "externalProductCode": "CODIGO_EJEMPLO",
      "pharmacyProductId": "00000000-0000-4000-8000-000000000001",
      "productCode": {},
      "productName": {},
      "externalUnitCode": {},
      "createdAt": "2026-07-31T12:00:00.000Z"
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<IntegrationMappingDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","externalProductCode":"CODIGO_EJEMPLO","pharmacyProductId":"00000000-0000-4000-8000-000000000001","productCode":{},"productName":{},"externalUnitCode":{},"createdAt":"2026-07-31T12:00:00.000Z"}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].externalProductCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].pharmacyProductId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].productCode` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `items[].productName` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `items[].externalUnitCode` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `items[].createdAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

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
  "path": "/pharmacies/{pharmacyId}/integration-connections/{connectionId}/product-mappings"
}
```

---

## 10. POST /pharmacies/{pharmacyId}/integration-connections/{connectionId}/sync

- **Módulo:** `pharmacy_inventory`
- **Etiqueta OpenAPI:** `pharmacy-inventory`
- **Nombre:** Traer el stock del sistema de la farmacia y aplicarlo por sede
- **Operation ID:** `PharmacyIntegrationSyncController_syncNow`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyIntegrationSyncController.syncNow](../../src/modules/pharmacy_inventory/presentation/controllers/pharmacy-integration-sync.controller.ts)

### Descripción de negocio

Traer el stock del sistema de la farmacia y aplicarlo por sede. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /pharmacies/{pharmacyId}/integration-connections/{connectionId}/sync` en `PharmacyIntegrationSyncController_syncNow`. El controlador delega en `SyncExternalPharmacyCatalogUseCase.execute`. No recibe body. El tipo de retorno estático es `Promise<IntegrationSyncResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `connectionId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /pharmacies/00000000-0000-4000-8000-000000000001/integration-connections/00000000-0000-4000-8000-000000000001/sync HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PHARMACY_STAFF`.
- Deben ser UUID válidos: `pharmacyId`, `connectionId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /pharmacies/00000000-0000-4000-8000-000000000001/integration-connections/00000000-0000-4000-8000-000000000001/sync HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<IntegrationSyncResponseDto>` | Sí |
| 400 | Operación completada correctamente. | `Promise<IntegrationSyncResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<IntegrationSyncResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<IntegrationSyncResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<IntegrationSyncResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<IntegrationSyncResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<IntegrationSyncResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<IntegrationSyncResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<IntegrationSyncResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<IntegrationSyncResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `IntegrationSyncResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "batchId": "00000000-0000-4000-8000-000000000001",
  "received": 1,
  "mapped": 1,
  "unmappedLines": 1,
  "unmapped": [
    {
      "externalCode": "CODIGO_EJEMPLO",
      "name": "Nombre de ejemplo",
      "reason": "NO_MAPPING",
      "productIds": [
        "00000000-0000-4000-8000-000000000001"
      ]
    }
  ],
  "applied": 1,
  "sites": [
    {
      "siteId": "00000000-0000-4000-8000-000000000001",
      "siteCode": "CODIGO_EJEMPLO",
      "siteName": "Nombre de ejemplo",
      "received": 1,
      "mapped": 1,
      "unmapped": 1,
      "applied": 1,
      "unchanged": 1,
      "skipped": 1
    }
  ],
  "skipped": [
    {
      "siteId": "00000000-0000-4000-8000-000000000001",
      "siteCode": "CODIGO_EJEMPLO",
      "externalCode": "CODIGO_EJEMPLO",
      "productId": "00000000-0000-4000-8000-000000000001",
      "quantity": 1,
      "reason": "PRODUCT_NOT_AVAILABLE",
      "mappingUnitCode": {},
      "externalUnitCode": {}
    }
  ],
  "notSent": [
    {
      "siteId": "00000000-0000-4000-8000-000000000001",
      "siteCode": "CODIGO_EJEMPLO",
      "externalCode": "CODIGO_EJEMPLO",
      "productId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `batchId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `received` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `mapped` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `unmappedLines` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `unmapped` | Sí | `array<UnmappedExternalProductDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"externalCode":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","reason":"NO_MAPPING","productIds":["00000000-0000-4000-8000-000000000001"]}]` |
| `unmapped[].externalCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `unmapped[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `unmapped[].reason` | Sí | `string` | valores: `NO_MAPPING`, `AMBIGUOUS_MAPPING` | Sin descripción específica en el contrato OpenAPI. | `NO_MAPPING` |
| `unmapped[].productIds` | Sí | `array<string>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `["00000000-0000-4000-8000-000000000001"]` |
| `applied` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `sites` | Sí | `array<IntegrationSyncSiteDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"siteId":"00000000-0000-4000-8000-000000000001","siteCode":"CODIGO_EJEMPLO","siteName":"Nombre de ejemplo","received":1,"mapped":1,"unmapped":1,"applied":1,"unchanged":1,"skipped":1}]` |
| `sites[].siteId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `sites[].siteCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `sites[].siteName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `sites[].received` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `sites[].mapped` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `sites[].unmapped` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `sites[].applied` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `sites[].unchanged` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `sites[].skipped` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `skipped` | Sí | `array<IntegrationSyncSkippedDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"siteId":"00000000-0000-4000-8000-000000000001","siteCode":"CODIGO_EJEMPLO","externalCode":"CODIGO_EJEMPLO","productId":"00000000-0000-4000-8000-000000000001","quantity":1,"reason":"PRODUCT_NOT_AVAILABLE","mappingUnitCode":{},"externalUnitCode":{}}]` |
| `skipped[].siteId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `skipped[].siteCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `skipped[].externalCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `skipped[].productId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `skipped[].quantity` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `skipped[].reason` | Sí | `string` | valores: `PRODUCT_NOT_AVAILABLE`, `PRODUCT_NOT_PUBLISHED`, `PRODUCT_OUT_OF_STOCK_DECLARED`, `SITE_PRODUCT_KEPT_BY_LOTS`, `SITE_MARKED_NOT_AVAILABLE`, `UNIT_MISMATCH`, `UNIT_NOT_REPORTED` | Sin descripción específica en el contrato OpenAPI. | `PRODUCT_NOT_AVAILABLE` |
| `skipped[].mappingUnitCode` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `skipped[].externalUnitCode` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `notSent` | Sí | `array<IntegrationSyncNotSentDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"siteId":"00000000-0000-4000-8000-000000000001","siteCode":"CODIGO_EJEMPLO","externalCode":"CODIGO_EJEMPLO","productId":"00000000-0000-4000-8000-000000000001"}]` |
| `notSent[].siteId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `notSent[].siteCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `notSent[].externalCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `notSent[].productId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, PHARMACY_STAFF. | Roles/tenant/guards de autorización |
| 422 | `PRECONDITION_FAILED` | El lote no está en estado reconciliable | Excepción explícita en src/modules/pharmacy_inventory/application/inventory-sync/reconcile-inventory-sync-batch.use-case.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pharmacies/{pharmacyId}/integration-connections/{connectionId}/sync"
}
```

---

## 11. GET /pharmacies/{pharmacyId}/integration-connections/{connectionId}/sync-batches

- **Módulo:** `pharmacy_inventory`
- **Etiqueta OpenAPI:** `pharmacy-inventory`
- **Nombre:** Últimas sincronizaciones de una conexión
- **Operation ID:** `PharmacyIntegrationSyncController_listSyncBatches`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyIntegrationSyncController.listSyncBatches](../../src/modules/pharmacy_inventory/presentation/controllers/pharmacy-integration-sync.controller.ts)

### Descripción de negocio

Últimas sincronizaciones de una conexión. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /pharmacies/{pharmacyId}/integration-connections/{connectionId}/sync-batches` en `PharmacyIntegrationSyncController_listSyncBatches`. El controlador delega en `IntegrationReadService.syncBatches`. No recibe body. El tipo de retorno estático es `Promise<IntegrationSyncBatchListDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `connectionId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `limit` | query | No | `desconocido` | Sin restricción adicional declarada | Entre 1 y 20; por defecto 5 | `valor-ejemplo` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /pharmacies/00000000-0000-4000-8000-000000000001/integration-connections/00000000-0000-4000-8000-000000000001/sync-batches HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PHARMACY_STAFF`.
- Deben ser UUID válidos: `pharmacyId`, `connectionId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /pharmacies/00000000-0000-4000-8000-000000000001/integration-connections/00000000-0000-4000-8000-000000000001/sync-batches?limit=valor-ejemplo HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<IntegrationSyncBatchListDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<IntegrationSyncBatchListDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<IntegrationSyncBatchListDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<IntegrationSyncBatchListDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<IntegrationSyncBatchListDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<IntegrationSyncBatchListDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<IntegrationSyncBatchListDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<IntegrationSyncBatchListDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `IntegrationSyncBatchListDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "status": "RECEIVED",
      "receivedAt": {},
      "completedAt": {},
      "itemCount": 1,
      "discrepancies": 1
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<IntegrationSyncBatchDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","status":"RECEIVED","receivedAt":{},"completedAt":{},"itemCount":1,"discrepancies":1}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].status` | Sí | `string` | valores: `RECEIVED`, `COMPLETED` | Sin descripción específica en el contrato OpenAPI. | `RECEIVED` |
| `items[].receivedAt` | No | `object` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `items[].completedAt` | No | `object` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `items[].itemCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `items[].discrepancies` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |

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
  "path": "/pharmacies/{pharmacyId}/integration-connections/{connectionId}/sync-batches"
}
```

---

## 12. POST /pharmacies/{pharmacyId}/sites/{siteId}/availability/bulk

- **Módulo:** `pharmacy_inventory`
- **Etiqueta OpenAPI:** `pharmacy-inventory`
- **Nombre:** Marcar en lote qué productos tiene una sucursal, y cuántos, con vista previa
- **Operation ID:** `PharmacySiteAvailabilityController_bulkSiteAvailability`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacySiteAvailabilityController.bulkSiteAvailability](../../src/modules/pharmacy_inventory/presentation/controllers/pharmacy-site-availability.controller.ts)

### Descripción de negocio

Marcar en lote qué productos tiene una sucursal, y cuántos, con vista previa. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: El stock de una sucursal en lote, con el contrato de la carga masiva del catálogo: `{ mode, dryRun, rows }`, hasta 1000 filas `{ productCode, available, quantity? }`, una por producto de esa sede. La vista previa (`dryRun`) responde lo mismo sin escribir. 200 aunque haya filas rechazadas; cada una dice su motivo en `results`.

### Descripción del sistema

NestJS resuelve `POST /pharmacies/{pharmacyId}/sites/{siteId}/availability/bulk` en `PharmacySiteAvailabilityController_bulkSiteAvailability`. El controlador delega en `BulkSiteAvailabilityUseCase.execute`. Valida el body como `BulkRequestDto` y consume `application/json`. El tipo de retorno estático es `Promise<BulkResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `siteId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `BulkRequestDto`; los campos opcionales se omiten.

```http
POST /pharmacies/00000000-0000-4000-8000-000000000001/sites/00000000-0000-4000-8000-000000000001/availability/bulk HTTP/1.1
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
- Deben ser UUID válidos: `pharmacyId`, `siteId`.
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
POST /pharmacies/00000000-0000-4000-8000-000000000001/sites/00000000-0000-4000-8000-000000000001/availability/bulk HTTP/1.1
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
      ],
      "warnings": [
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
| `results` | Sí | `array<BulkRowResultDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"row":1,"outcome":"CREATED","id":"00000000-0000-4000-8000-000000000001","errors":[{"field":"valor-ejemplo","reason":"Texto descriptivo de ejemplo","message":"valor-ejemplo"}],"warnings":[{"field":"valor-ejemplo","reason":"Texto descriptivo de ejemplo","message":"valor-ejemplo"}]}]` |
| `results[].row` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `results[].outcome` | Sí | `string` | valores: `CREATED`, `UPDATED`, `REJECTED`, `UNCHANGED` | Sin descripción específica en el contrato OpenAPI. | `CREATED` |
| `results[].id` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `results[].errors` | No | `array<BulkRowErrorDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"field":"valor-ejemplo","reason":"Texto descriptivo de ejemplo","message":"valor-ejemplo"}]` |
| `results[].errors[].field` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `results[].errors[].reason` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `results[].errors[].message` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `results[].warnings` | No | `array<BulkRowErrorDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"field":"valor-ejemplo","reason":"Texto descriptivo de ejemplo","message":"valor-ejemplo"}]` |
| `results[].warnings[].field` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `results[].warnings[].reason` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `results[].warnings[].message` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

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
  "path": "/pharmacies/{pharmacyId}/sites/{siteId}/availability/bulk"
}
```

---

## 13. PUT /pharmacies/{pharmacyId}/sites/{siteId}/products/{productId}/availability

- **Módulo:** `pharmacy_inventory`
- **Etiqueta OpenAPI:** `pharmacy-inventory`
- **Nombre:** Marcar si una sucursal tiene un producto, y cuántas unidades
- **Operation ID:** `PharmacySiteAvailabilityController_setSiteAvailability`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacySiteAvailabilityController.setSiteAvailability](../../src/modules/pharmacy_inventory/presentation/controllers/pharmacy-site-availability.controller.ts)

### Descripción de negocio

Marcar si una sucursal tiene un producto, y cuántas unidades. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: «Lo tengo / No lo tengo» de un producto en una sede.

### Descripción del sistema

NestJS resuelve `PUT /pharmacies/{pharmacyId}/sites/{siteId}/products/{productId}/availability` en `PharmacySiteAvailabilityController_setSiteAvailability`. El controlador delega en `SetSiteProductAvailabilityUseCase.execute`. Valida el body como `SetSiteAvailabilityDto` y consume `application/json`. El tipo de retorno estático es `Promise<SiteAvailabilityResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `siteId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `productId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `SetSiteAvailabilityDto`; los campos opcionales se omiten.

```http
PUT /pharmacies/00000000-0000-4000-8000-000000000001/sites/00000000-0000-4000-8000-000000000001/products/00000000-0000-4000-8000-000000000001/availability HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "available": true
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PHARMACY_STAFF`.
- Deben ser UUID válidos: `pharmacyId`, `siteId`, `productId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `available` | Sí | `boolean` | Sin restricción adicional declarada | «Lo tengo» en esta sucursal | `true` |
| `quantity` | No | `number` | mínimo 0; máximo 1000000 | Sin descripción específica en el contrato OpenAPI. | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PUT /pharmacies/00000000-0000-4000-8000-000000000001/sites/00000000-0000-4000-8000-000000000001/products/00000000-0000-4000-8000-000000000001/availability HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "available": true,
  "quantity": 1
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<SiteAvailabilityResponseDto>` | Sí |
| 400 | Operación completada correctamente. | `Promise<SiteAvailabilityResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<SiteAvailabilityResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<SiteAvailabilityResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<SiteAvailabilityResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<SiteAvailabilityResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<SiteAvailabilityResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<SiteAvailabilityResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<SiteAvailabilityResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<SiteAvailabilityResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<SiteAvailabilityResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `SiteAvailabilityResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "siteId": "00000000-0000-4000-8000-000000000001",
  "productId": "00000000-0000-4000-8000-000000000001",
  "available": true,
  "quantity": 1,
  "stockUpdatedAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `siteId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `productId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `available` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `quantity` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `stockUpdatedAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

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
  "path": "/pharmacies/{pharmacyId}/sites/{siteId}/products/{productId}/availability"
}
```

---

## 14. GET /pharmacy-inventory/availability

- **Módulo:** `pharmacy_inventory`
- **Etiqueta OpenAPI:** `pharmacy-inventory-directory`
- **Nombre:** Consultar qué sedes pueden surtir un conjunto de productos
- **Operation ID:** `PharmacyInventoryReadController_availability`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyInventoryReadController.availability](../../src/modules/pharmacy_inventory/presentation/controllers/pharmacy-inventory-read.controller.ts)

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
| 504 | Consulta completada correctamente. | `Promise<AvailabilityResponseDto>` | No |

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
      "stockUpdatedAt": "valor-ejemplo",
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
| `items` | Sí | `array<AvailabilitySiteDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"siteId":"00000000-0000-4000-8000-000000000001","siteName":"Nombre de ejemplo","pharmacyId":"00000000-0000-4000-8000-000000000001","pharmacyName":"Nombre de ejemplo","addressText":{},"latitude":{},"longitude":{},"distanceKm":{},"homeDeliveryAvailable":{},"pickupAvailable":{},"complete":true,"availableCount":1,"missingProductIds":["00000000-0000-4000-8000-000000000001"],"totalAmount":{},"currency":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"stockUpdatedAt":"valor-ejemplo","products":[{"productId":"00000000-0000-4000-8000-000000000001","productCode":"CODIGO_EJEMPLO","brandName":{},"genericName":{},"strengthText":{},"packageSizeText":{},"medication":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"availableQuantity":1,"price":{"unitAmount":"valor-ejemplo","patientAmount":{},"currency":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"priceListCode":"CODIGO_EJEMPLO"}}]}]` |
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
| `items[].stockUpdatedAt` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
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
| `items[].products[].availableQuantity` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
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

## 15. GET /pharmacy-inventory/availability/medications

- **Módulo:** `pharmacy_inventory`
- **Etiqueta OpenAPI:** `pharmacy-inventory-directory`
- **Nombre:** Consultar qué sedes de la red pueden surtir unos medicamentos
- **Operation ID:** `PharmacyInventoryReadController_availabilityByMedication`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyInventoryReadController.availabilityByMedication](../../src/modules/pharmacy_inventory/presentation/controllers/pharmacy-inventory-read.controller.ts)

### Descripción de negocio

Por cada medicamento del vademécum considera todos los productos publicados y vendibles de todas las farmacias visibles, con la regla de existencias por sede. Cada sede devuelve un producto por medicamento que tiene disponible (el de menor precio para el paciente) y nombra los medicamentos que le faltan. Orden: las que tienen todos primero; después distancia, total y nombre, como la disponibilidad por producto.

Contexto declarado en el controlador: Qué sedes de toda la red pueden surtir unos medicamentos de una receta: una sola consulta por receta, no una por producto.

### Descripción del sistema

NestJS resuelve `GET /pharmacy-inventory/availability/medications` en `PharmacyInventoryReadController_availabilityByMedication`. El controlador delega en `PharmacyInventoryReadService.availabilityByMedication`. No recibe body. El tipo de retorno estático es `Promise<MedicationAvailabilityResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `medications` | query | Sí | `array<string>` | Sin restricción adicional declarada | Medicamentos solicitados (`medication_concept_id`): UUIDs separados por coma | `["valor-ejemplo"]` |
| `lat` | query | No | `string` | Sin restricción adicional declarada | Latitud WGS84 desde donde medir distancia (va con lng) | `valor-ejemplo` |
| `lng` | query | No | `string` | Sin restricción adicional declarada | Longitud WGS84 desde donde medir distancia (va con lat) | `valor-ejemplo` |
| `limit` | query | No | `number` | Sin restricción adicional declarada | Tope de sedes servidas (por defecto 20) | `1` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /pharmacy-inventory/availability/medications?medications=valor-ejemplo HTTP/1.1
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
GET /pharmacy-inventory/availability/medications?medications=valor-ejemplo&lat=valor-ejemplo&lng=valor-ejemplo&limit=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<MedicationAvailabilityResponseDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<MedicationAvailabilityResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<MedicationAvailabilityResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<MedicationAvailabilityResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<MedicationAvailabilityResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<MedicationAvailabilityResponseDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<MedicationAvailabilityResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `MedicationAvailabilityResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "requestedMedicationConceptIds": [
    "00000000-0000-4000-8000-000000000001"
  ],
  "unpublishedMedicationConceptIds": [
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
      "totalAmount": {},
      "currency": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "stockUpdatedAt": "valor-ejemplo",
      "missingMedicationConceptIds": [
        "00000000-0000-4000-8000-000000000001"
      ],
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
          },
          "medicationConceptId": "00000000-0000-4000-8000-000000000001"
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
| `requestedMedicationConceptIds` | Sí | `array<string>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `["00000000-0000-4000-8000-000000000001"]` |
| `unpublishedMedicationConceptIds` | Sí | `array<string>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `["00000000-0000-4000-8000-000000000001"]` |
| `items` | Sí | `array<MedicationAvailabilitySiteDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"siteId":"00000000-0000-4000-8000-000000000001","siteName":"Nombre de ejemplo","pharmacyId":"00000000-0000-4000-8000-000000000001","pharmacyName":"Nombre de ejemplo","addressText":{},"latitude":{},"longitude":{},"distanceKm":{},"homeDeliveryAvailable":{},"pickupAvailable":{},"complete":true,"availableCount":1,"totalAmount":{},"currency":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"stockUpdatedAt":"valor-ejemplo","missingMedicationConceptIds":["00000000-0000-4000-8000-000000000001"],"products":[{"productId":"00000000-0000-4000-8000-000000000001","productCode":"CODIGO_EJEMPLO","brandName":{},"genericName":{},"strengthText":{},"packageSizeText":{},"medication":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"availableQuantity":1,"price":{"unitAmount":"valor-ejemplo","patientAmount":{},"currency":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"priceListCode":"CODIGO_EJEMPLO"},"medicationConceptId":"00000000-0000-4000-8000-000000000001"}]}]` |
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
| `items[].totalAmount` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `items[].currency` | No | `InventoryConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `items[].currency.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].currency.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].stockUpdatedAt` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].missingMedicationConceptIds` | Sí | `array<string>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `["00000000-0000-4000-8000-000000000001"]` |
| `items[].products` | Sí | `array<MedicationAvailabilityProductDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"productId":"00000000-0000-4000-8000-000000000001","productCode":"CODIGO_EJEMPLO","brandName":{},"genericName":{},"strengthText":{},"packageSizeText":{},"medication":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"availableQuantity":1,"price":{"unitAmount":"valor-ejemplo","patientAmount":{},"currency":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"priceListCode":"CODIGO_EJEMPLO"},"medicationConceptId":"00000000-0000-4000-8000-000000000001"}]` |
| `items[].products[].productId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].products[].productCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].products[].brandName` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `items[].products[].genericName` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `items[].products[].strengthText` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `items[].products[].packageSizeText` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `items[].products[].medication` | No | `InventoryConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `items[].products[].medication.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].products[].medication.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].products[].availableQuantity` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `items[].products[].price` | No | `AvailabilityPriceDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"unitAmount":"valor-ejemplo","patientAmount":{},"currency":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"priceListCode":"CODIGO_EJEMPLO"}` |
| `items[].products[].price.unitAmount` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].products[].price.patientAmount` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `items[].products[].price.currency` | No | `InventoryConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `items[].products[].price.currency.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].products[].price.currency.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].products[].price.priceListCode` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].products[].medicationConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
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
  "path": "/pharmacy-inventory/availability/medications"
}
```

---

## 16. GET /pharmacy-inventory/sites/{siteId}/stock

- **Módulo:** `pharmacy_inventory`
- **Etiqueta OpenAPI:** `pharmacy-inventory-directory`
- **Nombre:** Consultar el stock disponible de una sede
- **Operation ID:** `PharmacyInventoryReadController_getSiteStock`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyInventoryReadController.getSiteStock](../../src/modules/pharmacy_inventory/presentation/controllers/pharmacy-inventory-read.controller.ts)

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
| 504 | Consulta completada correctamente. | `Promise<SiteStockResponseDto>` | No |

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
| 404 | `NOT_FOUND` | Sede de farmacia no encontrada | Excepción explícita en src/modules/pharmacy_inventory/application/pharmacy-inventory-read/read-pharmacy-inventory.use-case.ts |
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

## 17. POST /pharmacy/{pharmacyId}/dispensations

- **Módulo:** `pharmacy_inventory`
- **Etiqueta OpenAPI:** `pharmacy-inventory`
- **Nombre:** Dispensar una prescripción a un paciente (UC-25-03)
- **Operation ID:** `PharmacyDispensingController_dispense`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyDispensingController.dispense](../../src/modules/pharmacy_inventory/presentation/controllers/pharmacy-dispensing.controller.ts)

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
| 504 | Operación completada correctamente. | `Promise<MovementResponseDto>` | No |

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
| 409 | `CONFLICT` | Stock disponible insuficiente en el botiquín | Excepción explícita en src/modules/pharmacy_inventory/application/medication-dispensations/dispense-medication.use-case.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La reserva es un pedido de paciente: se dispensa con su código de retiro por POST /pharmacy/orders/:id/dispense | Excepción explícita en src/modules/pharmacy_inventory/application/medication-dispensations/dispense-medication.use-case.ts |
| 422 | `PRECONDITION_FAILED` | La reserva no está vigente | Excepción explícita en src/modules/pharmacy_inventory/application/medication-dispensations/dispense-medication.use-case.ts |
| 422 | `PRECONDITION_FAILED` | Stock insuficiente para dispensar | Excepción explícita en src/modules/pharmacy_inventory/application/medication-dispensations/dispense-medication.use-case.ts |
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

## 18. POST /pharmacy/{pharmacyId}/goods-receipts

- **Módulo:** `pharmacy_inventory`
- **Etiqueta OpenAPI:** `pharmacy-inventory`
- **Nombre:** Recepcionar mercancía por lote (UC-25-02)
- **Operation ID:** `PharmacyProcurementController_receiveGoods`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyProcurementController.receiveGoods](../../src/modules/pharmacy_inventory/presentation/controllers/pharmacy-procurement.controller.ts)

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
| `lines` | Sí | `array<GoodsReceiptLineDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"pharmacyPurchaseOrderLineId":"00000000-0000-4000-8000-000000000001","pharmacyProductId":"00000000-0000-4000-8000-000000000001","lotNumber":"valor-ejemplo","receivedQuantity":1,"acceptedQuantity":1,"rejectedQuantity":1,"unitCostAmount":1,"expiresAt":"2026-07-31"}]` |
| `lines[].pharmacyPurchaseOrderLineId` | Sí | `string` | formato `uuid` | Línea de la orden de compra | `00000000-0000-4000-8000-000000000001` |
| `lines[].pharmacyProductId` | Sí | `string` | formato `uuid` | Producto de farmacia | `00000000-0000-4000-8000-000000000001` |
| `lines[].lotNumber` | Sí | `string` | longitud máxima 128 | Número de lote recibido | `valor-ejemplo` |
| `lines[].receivedQuantity` | Sí | `number` | mínimo 0 | Cantidad recibida | `1` |
| `lines[].acceptedQuantity` | No | `number` | mínimo 0 | Cantidad aceptada (default = recibida) | `1` |
| `lines[].rejectedQuantity` | No | `number` | mínimo 0 | Cantidad rechazada | `1` |
| `lines[].unitCostAmount` | No | `number` | mínimo 0 | Costo unitario | `1` |
| `lines[].expiresAt` | No | `string` | formato `date` | Fecha de expiración del lote (ISO) | `2026-07-31` |

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
      "expiresAt": "2026-07-31"
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
| 504 | Operación completada correctamente. | `Promise<GoodsReceiptResponseDto>` | No |

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
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La orden no admite recepción | Excepción explícita en src/modules/pharmacy_inventory/application/pharmacy-procurement/pharmacy-procurement.use-cases.ts |
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

## 19. GET /pharmacy/{pharmacyId}/inventory/ledger

- **Módulo:** `pharmacy_inventory`
- **Etiqueta OpenAPI:** `pharmacy-inventory`
- **Nombre:** Libro de movimientos (kardex), por secuencia de registro, la más reciente primero
- **Operation ID:** `PharmacyInventoryManagementController_ledger`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyInventoryManagementController.ledger](../../src/modules/pharmacy_inventory/presentation/controllers/pharmacy-inventory-management.controller.ts)

### Descripción de negocio

Libro de movimientos (kardex), por secuencia de registro, la más reciente primero. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /pharmacy/{pharmacyId}/inventory/ledger` en `PharmacyInventoryManagementController_ledger`. El controlador delega en `ReadInventoryManagementUseCase.ledger`. No recibe body. El tipo de retorno estático es `Promise<PageResponseDto<InventoryLedgerItemDto>>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `page` | query | No | `number` | mínimo 1 | Página (1-based) | `1` |
| `pageSize` | query | No | `number` | mínimo 1; máximo 100 | Tamaño de página | `20` |
| `siteId` | query | No | `string` | formato `uuid` | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `productId` | query | No | `string` | formato `uuid` | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `lotId` | query | No | `string` | formato `uuid` | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `movementType` | query | No | `string` | valores: `pharmacy_inventory:MV_RECEIPT`, `pharmacy_inventory:MV_DISPENSE`, `pharmacy_inventory:MV_DISPENSE_REVERSAL`, `pharmacy_inventory:MV_RESERVE`, `pharmacy_inventory:MV_RESERVATION_RELEASE`, `pharmacy_inventory:MV_COUNT_ADJUSTMENT`, `pharmacy_inventory:MV_QUARANTINE_HOLD`, `pharmacy_inventory:MV_QUARANTINE_RELEASE`, `pharmacy_inventory:MV_WRITE_OFF`, `pharmacy_inventory:MV_TRANSFER_OUT`, `pharmacy_inventory:MV_TRANSFER_IN`, `pharmacy_inventory:MV_SYNC_ADJUSTMENT` | Código del tipo de movimiento, como sale en movementType.code | `pharmacy_inventory:MV_RECEIPT` |
| `from` | query | No | `string` | Sin restricción adicional declarada | Desde este instante (ISO 8601) | `valor-ejemplo` |
| `to` | query | No | `string` | Sin restricción adicional declarada | Hasta este instante (ISO 8601) | `valor-ejemplo` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /pharmacy/00000000-0000-4000-8000-000000000001/inventory/ledger HTTP/1.1
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
GET /pharmacy/00000000-0000-4000-8000-000000000001/inventory/ledger?page=1&pageSize=20&siteId=00000000-0000-4000-8000-000000000001&productId=00000000-0000-4000-8000-000000000001&lotId=00000000-0000-4000-8000-000000000001&movementType=pharmacy_inventory%3AMV_RECEIPT&from=valor-ejemplo&to=valor-ejemplo HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PageResponseDto<InventoryLedgerItemDto>>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<PageResponseDto<InventoryLedgerItemDto>>` | No |
| 401 | Consulta completada correctamente. | `Promise<PageResponseDto<InventoryLedgerItemDto>>` | No |
| 403 | Consulta completada correctamente. | `Promise<PageResponseDto<InventoryLedgerItemDto>>` | No |
| 404 | Consulta completada correctamente. | `Promise<PageResponseDto<InventoryLedgerItemDto>>` | No |
| 429 | Consulta completada correctamente. | `Promise<PageResponseDto<InventoryLedgerItemDto>>` | No |
| 500 | Consulta completada correctamente. | `Promise<PageResponseDto<InventoryLedgerItemDto>>` | No |
| 504 | Consulta completada correctamente. | `Promise<PageResponseDto<InventoryLedgerItemDto>>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PageResponseDto<InventoryLedgerItemDto>`. Ejemplo completo derivado de ese DTO:

```json
{
  "data": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "sequence": "valor-ejemplo",
      "occurredAt": "2026-07-31T12:00:00.000Z",
      "movementType": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo",
        "id": "00000000-0000-4000-8000-000000000001"
      },
      "product": {
        "id": "00000000-0000-4000-8000-000000000001",
        "name": "Nombre de ejemplo"
      },
      "site": {
        "id": "00000000-0000-4000-8000-000000000001",
        "name": "Nombre de ejemplo"
      },
      "location": {
        "id": "00000000-0000-4000-8000-000000000001",
        "code": "CODIGO_EJEMPLO",
        "name": "Nombre de ejemplo"
      },
      "lot": {
        "id": "00000000-0000-4000-8000-000000000001",
        "number": "valor-ejemplo",
        "expiresAt": "valor-ejemplo"
      },
      "quantityDelta": 1,
      "reservationDelta": 1,
      "quarantineDelta": 1,
      "sourceType": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "sourceId": "00000000-0000-4000-8000-000000000001",
      "unitCostAmount": "valor-ejemplo",
      "currencyCode": "BOB"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 1,
    "total": 1,
    "totalPages": 1
  }
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `data` | Sí | `array<InventoryLedgerItemDto>` | Sin restricción adicional declarada | Valor de data mantenido por la instancia. | `[{"id":"00000000-0000-4000-8000-000000000001","sequence":"valor-ejemplo","occurredAt":"2026-07-31T12:00:00.000Z","movementType":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo","id":"00000000-0000-4000-8000-000000000001"},"product":{"id":"00000000-0000-4000-8000-000000000001","name":"Nombre de ejemplo"},"site":{"id":"00000000-0000-4000-8000-000000000001","name":"Nombre de ejemplo"},"location":{"id":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo"},"lot":{"id":"00000000-0000-4000-8000-000000000001","number":"valor-ejemplo","expiresAt":"valor-ejemplo"},"quantityDelta":1,"reservationDelta":1,"quarantineDelta":1,"sourceType":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"sourceId":"00000000-0000-4000-8000-000000000001","unitCostAmount":"valor-ejemplo","currencyCode":"BOB"}]` |
| `data[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `data[].sequence` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `data[].occurredAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `data[].movementType` | Sí | `InventoryConceptRefDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo","id":"00000000-0000-4000-8000-000000000001"}` |
| `data[].movementType.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `data[].movementType.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `data[].movementType.id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `data[].product` | Sí | `InventoryNamedRefDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"id":"00000000-0000-4000-8000-000000000001","name":"Nombre de ejemplo"}` |
| `data[].product.id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `data[].product.name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `data[].site` | Sí | `InventoryNamedRefDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"id":"00000000-0000-4000-8000-000000000001","name":"Nombre de ejemplo"}` |
| `data[].site.id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `data[].site.name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `data[].location` | Sí | `InventoryLocationRefDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"id":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo"}` |
| `data[].location.id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `data[].location.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `data[].location.name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `data[].lot` | Sí | `InventoryLotRefDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"id":"00000000-0000-4000-8000-000000000001","number":"valor-ejemplo","expiresAt":"valor-ejemplo"}` |
| `data[].lot.id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `data[].lot.number` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `data[].lot.expiresAt` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `data[].quantityDelta` | Sí | `number` | Sin restricción adicional declarada | Variación de la existencia, con signo | `1` |
| `data[].reservationDelta` | Sí | `number` | Sin restricción adicional declarada | Variación de lo reservado, con signo | `1` |
| `data[].quarantineDelta` | Sí | `number` | Sin restricción adicional declarada | Variación de lo en cuarentena, con signo | `1` |
| `data[].sourceType` | Sí | `InventoryConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `data[].sourceType.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `data[].sourceType.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `data[].sourceId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `data[].unitCostAmount` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `data[].currencyCode` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `BOB` |
| `meta` | Sí | `PageMetaDto` | Sin restricción adicional declarada | Valor de meta mantenido por la instancia. | `{"page":1,"pageSize":1,"total":1,"totalPages":1}` |
| `meta.page` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `meta.pageSize` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `meta.total` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `meta.totalPages` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |

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
  "path": "/pharmacy/{pharmacyId}/inventory/ledger"
}
```

---

## 20. GET /pharmacy/{pharmacyId}/inventory/locations

- **Módulo:** `pharmacy_inventory`
- **Etiqueta OpenAPI:** `pharmacy-inventory`
- **Nombre:** Ubicaciones activas de las sedes de la farmacia
- **Operation ID:** `PharmacyInventoryManagementController_locations`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyInventoryManagementController.locations](../../src/modules/pharmacy_inventory/presentation/controllers/pharmacy-inventory-management.controller.ts)

### Descripción de negocio

Ubicaciones activas de las sedes de la farmacia. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /pharmacy/{pharmacyId}/inventory/locations` en `PharmacyInventoryManagementController_locations`. El controlador delega en `ReadInventoryManagementUseCase.locations`. No recibe body. El tipo de retorno estático es `Promise<InventoryLocationListDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `siteId` | query | No | `string` | formato `uuid` | Solo esta sede | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /pharmacy/00000000-0000-4000-8000-000000000001/inventory/locations HTTP/1.1
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
GET /pharmacy/00000000-0000-4000-8000-000000000001/inventory/locations?siteId=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<InventoryLocationListDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<InventoryLocationListDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<InventoryLocationListDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<InventoryLocationListDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<InventoryLocationListDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<InventoryLocationListDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<InventoryLocationListDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<InventoryLocationListDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `InventoryLocationListDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "siteId": "00000000-0000-4000-8000-000000000001",
      "siteName": "Nombre de ejemplo",
      "code": "CODIGO_EJEMPLO",
      "name": "Nombre de ejemplo"
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<InventoryLocationItemDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","siteId":"00000000-0000-4000-8000-000000000001","siteName":"Nombre de ejemplo","code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo"}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].siteId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].siteName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |

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
  "path": "/pharmacy/{pharmacyId}/inventory/locations"
}
```

---

## 21. GET /pharmacy/{pharmacyId}/inventory/lots

- **Módulo:** `pharmacy_inventory`
- **Etiqueta OpenAPI:** `pharmacy-inventory`
- **Nombre:** Lotes con su vencimiento, estados y existencia por sede
- **Operation ID:** `PharmacyInventoryManagementController_lots`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyInventoryManagementController.lots](../../src/modules/pharmacy_inventory/presentation/controllers/pharmacy-inventory-management.controller.ts)

### Descripción de negocio

Lotes con su vencimiento, estados y existencia por sede. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /pharmacy/{pharmacyId}/inventory/lots` en `PharmacyInventoryManagementController_lots`. El controlador delega en `ReadInventoryManagementUseCase.lots`. No recibe body. El tipo de retorno estático es `Promise<PageResponseDto<InventoryLotItemDto>>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `page` | query | No | `number` | mínimo 1 | Página (1-based) | `1` |
| `pageSize` | query | No | `number` | mínimo 1; máximo 100 | Tamaño de página | `20` |
| `siteId` | query | No | `string` | formato `uuid` | Solo lotes con posiciones en esta sede | `00000000-0000-4000-8000-000000000001` |
| `productId` | query | No | `string` | formato `uuid` | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `expiringBefore` | query | No | `string` | Sin restricción adicional declarada | Solo lotes que vencen antes de esta fecha (YYYY-MM-DD) | `2027-01-31` |
| `includeExpired` | query | No | `string` | valores: `true`, `false` | Incluir lotes ya vencidos (por defecto no) | `true` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /pharmacy/00000000-0000-4000-8000-000000000001/inventory/lots HTTP/1.1
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
GET /pharmacy/00000000-0000-4000-8000-000000000001/inventory/lots?page=1&pageSize=20&siteId=00000000-0000-4000-8000-000000000001&productId=00000000-0000-4000-8000-000000000001&expiringBefore=2027-01-31&includeExpired=true HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PageResponseDto<InventoryLotItemDto>>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<PageResponseDto<InventoryLotItemDto>>` | No |
| 401 | Consulta completada correctamente. | `Promise<PageResponseDto<InventoryLotItemDto>>` | No |
| 403 | Consulta completada correctamente. | `Promise<PageResponseDto<InventoryLotItemDto>>` | No |
| 404 | Consulta completada correctamente. | `Promise<PageResponseDto<InventoryLotItemDto>>` | No |
| 429 | Consulta completada correctamente. | `Promise<PageResponseDto<InventoryLotItemDto>>` | No |
| 500 | Consulta completada correctamente. | `Promise<PageResponseDto<InventoryLotItemDto>>` | No |
| 504 | Consulta completada correctamente. | `Promise<PageResponseDto<InventoryLotItemDto>>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PageResponseDto<InventoryLotItemDto>`. Ejemplo completo derivado de ese DTO:

```json
{
  "data": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "product": {
        "id": "00000000-0000-4000-8000-000000000001",
        "name": "Nombre de ejemplo"
      },
      "lotNumber": "valor-ejemplo",
      "expiresAt": "valor-ejemplo",
      "quarantineStatus": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "recallStatus": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "onHandTotal": 1,
      "bySite": [
        {
          "siteId": "00000000-0000-4000-8000-000000000001",
          "siteName": "Nombre de ejemplo",
          "onHand": 1
        }
      ]
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 1,
    "total": 1,
    "totalPages": 1
  }
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `data` | Sí | `array<InventoryLotItemDto>` | Sin restricción adicional declarada | Valor de data mantenido por la instancia. | `[{"id":"00000000-0000-4000-8000-000000000001","product":{"id":"00000000-0000-4000-8000-000000000001","name":"Nombre de ejemplo"},"lotNumber":"valor-ejemplo","expiresAt":"valor-ejemplo","quarantineStatus":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"recallStatus":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"onHandTotal":1,"bySite":[{"siteId":"00000000-0000-4000-8000-000000000001","siteName":"Nombre de ejemplo","onHand":1}]}]` |
| `data[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `data[].product` | Sí | `InventoryNamedRefDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"id":"00000000-0000-4000-8000-000000000001","name":"Nombre de ejemplo"}` |
| `data[].product.id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `data[].product.name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `data[].lotNumber` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `data[].expiresAt` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `data[].quarantineStatus` | Sí | `InventoryConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `data[].quarantineStatus.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `data[].quarantineStatus.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `data[].recallStatus` | Sí | `InventoryConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `data[].recallStatus.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `data[].recallStatus.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `data[].onHandTotal` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `data[].bySite` | Sí | `array<InventoryLotSiteStockDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"siteId":"00000000-0000-4000-8000-000000000001","siteName":"Nombre de ejemplo","onHand":1}]` |
| `data[].bySite[].siteId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `data[].bySite[].siteName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `data[].bySite[].onHand` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `meta` | Sí | `PageMetaDto` | Sin restricción adicional declarada | Valor de meta mantenido por la instancia. | `{"page":1,"pageSize":1,"total":1,"totalPages":1}` |
| `meta.page` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `meta.pageSize` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `meta.total` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `meta.totalPages` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |

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
  "path": "/pharmacy/{pharmacyId}/inventory/lots"
}
```

---

## 22. GET /pharmacy/{pharmacyId}/inventory/positions

- **Módulo:** `pharmacy_inventory`
- **Etiqueta OpenAPI:** `pharmacy-inventory`
- **Nombre:** Existencias por sede, ubicación y lote, con su desglose
- **Operation ID:** `PharmacyInventoryManagementController_positions`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyInventoryManagementController.positions](../../src/modules/pharmacy_inventory/presentation/controllers/pharmacy-inventory-management.controller.ts)

### Descripción de negocio

Existencias por sede, ubicación y lote, con su desglose. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /pharmacy/{pharmacyId}/inventory/positions` en `PharmacyInventoryManagementController_positions`. El controlador delega en `ReadInventoryManagementUseCase.positions`. No recibe body. El tipo de retorno estático es `Promise<PageResponseDto<InventoryPositionItemDto>>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `page` | query | No | `number` | mínimo 1 | Página (1-based) | `1` |
| `pageSize` | query | No | `number` | mínimo 1; máximo 100 | Tamaño de página | `20` |
| `siteId` | query | No | `string` | formato `uuid` | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `locationId` | query | No | `string` | formato `uuid` | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `productId` | query | No | `string` | formato `uuid` | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `lotId` | query | No | `string` | formato `uuid` | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `onlyWithStock` | query | No | `string` | valores: `true`, `false` | Solo posiciones con existencia física o en cuarentena | `true` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /pharmacy/00000000-0000-4000-8000-000000000001/inventory/positions HTTP/1.1
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
GET /pharmacy/00000000-0000-4000-8000-000000000001/inventory/positions?page=1&pageSize=20&siteId=00000000-0000-4000-8000-000000000001&locationId=00000000-0000-4000-8000-000000000001&productId=00000000-0000-4000-8000-000000000001&lotId=00000000-0000-4000-8000-000000000001&onlyWithStock=true HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PageResponseDto<InventoryPositionItemDto>>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<PageResponseDto<InventoryPositionItemDto>>` | No |
| 401 | Consulta completada correctamente. | `Promise<PageResponseDto<InventoryPositionItemDto>>` | No |
| 403 | Consulta completada correctamente. | `Promise<PageResponseDto<InventoryPositionItemDto>>` | No |
| 404 | Consulta completada correctamente. | `Promise<PageResponseDto<InventoryPositionItemDto>>` | No |
| 429 | Consulta completada correctamente. | `Promise<PageResponseDto<InventoryPositionItemDto>>` | No |
| 500 | Consulta completada correctamente. | `Promise<PageResponseDto<InventoryPositionItemDto>>` | No |
| 504 | Consulta completada correctamente. | `Promise<PageResponseDto<InventoryPositionItemDto>>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PageResponseDto<InventoryPositionItemDto>`. Ejemplo completo derivado de ese DTO:

```json
{
  "data": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "product": {
        "id": "00000000-0000-4000-8000-000000000001",
        "name": "Nombre de ejemplo"
      },
      "site": {
        "id": "00000000-0000-4000-8000-000000000001",
        "name": "Nombre de ejemplo"
      },
      "location": {
        "id": "00000000-0000-4000-8000-000000000001",
        "code": "CODIGO_EJEMPLO",
        "name": "Nombre de ejemplo"
      },
      "lot": {
        "id": "00000000-0000-4000-8000-000000000001",
        "number": "valor-ejemplo",
        "expiresAt": "valor-ejemplo"
      },
      "onHand": 1,
      "reserved": 1,
      "quarantine": 1,
      "available": 1
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 1,
    "total": 1,
    "totalPages": 1
  }
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `data` | Sí | `array<InventoryPositionItemDto>` | Sin restricción adicional declarada | Valor de data mantenido por la instancia. | `[{"id":"00000000-0000-4000-8000-000000000001","product":{"id":"00000000-0000-4000-8000-000000000001","name":"Nombre de ejemplo"},"site":{"id":"00000000-0000-4000-8000-000000000001","name":"Nombre de ejemplo"},"location":{"id":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo"},"lot":{"id":"00000000-0000-4000-8000-000000000001","number":"valor-ejemplo","expiresAt":"valor-ejemplo"},"onHand":1,"reserved":1,"quarantine":1,"available":1}]` |
| `data[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `data[].product` | Sí | `InventoryNamedRefDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"id":"00000000-0000-4000-8000-000000000001","name":"Nombre de ejemplo"}` |
| `data[].product.id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `data[].product.name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `data[].site` | Sí | `InventoryNamedRefDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"id":"00000000-0000-4000-8000-000000000001","name":"Nombre de ejemplo"}` |
| `data[].site.id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `data[].site.name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `data[].location` | Sí | `InventoryLocationRefDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"id":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo"}` |
| `data[].location.id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `data[].location.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `data[].location.name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `data[].lot` | Sí | `InventoryLotRefDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"id":"00000000-0000-4000-8000-000000000001","number":"valor-ejemplo","expiresAt":"valor-ejemplo"}` |
| `data[].lot.id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `data[].lot.number` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `data[].lot.expiresAt` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `data[].onHand` | Sí | `number` | Sin restricción adicional declarada | Existencia física | `1` |
| `data[].reserved` | Sí | `number` | Sin restricción adicional declarada | Reservado para dispensaciones y pedidos | `1` |
| `data[].quarantine` | Sí | `number` | Sin restricción adicional declarada | En cuarentena o retenido | `1` |
| `data[].available` | Sí | `number` | Sin restricción adicional declarada | Disponible para dispensar | `1` |
| `meta` | Sí | `PageMetaDto` | Sin restricción adicional declarada | Valor de meta mantenido por la instancia. | `{"page":1,"pageSize":1,"total":1,"totalPages":1}` |
| `meta.page` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `meta.pageSize` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `meta.total` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `meta.totalPages` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |

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
  "path": "/pharmacy/{pharmacyId}/inventory/positions"
}
```

---

## 23. POST /pharmacy/{pharmacyId}/purchase-orders

- **Módulo:** `pharmacy_inventory`
- **Etiqueta OpenAPI:** `pharmacy-inventory`
- **Nombre:** Emitir una orden de compra a proveedor (UC-25-01)
- **Operation ID:** `PharmacyProcurementController_createPurchaseOrder`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyProcurementController.createPurchaseOrder](../../src/modules/pharmacy_inventory/presentation/controllers/pharmacy-procurement.controller.ts)

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
| 504 | Operación completada correctamente. | `Promise<PurchaseOrderResponseDto>` | No |

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
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El proveedor no está activo | Excepción explícita en src/modules/pharmacy_inventory/application/pharmacy-procurement/pharmacy-procurement.use-cases.ts |
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

## 24. POST /pharmacy/{pharmacyId}/reservations

- **Módulo:** `pharmacy_inventory`
- **Etiqueta OpenAPI:** `pharmacy-inventory`
- **Nombre:** Reservar stock para una prescripción (UC-25-04)
- **Operation ID:** `PharmacyInventoryController_reserve`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyInventoryController.reserve](../../src/modules/pharmacy_inventory/presentation/controllers/pharmacy-inventory.controller.ts)

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
| 504 | Operación completada correctamente. | `Promise<MovementResponseDto>` | No |

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
| 422 | `PRECONDITION_FAILED` | Stock disponible insuficiente para reservar | Excepción explícita en src/modules/pharmacy_inventory/application/inventory-reservations/reserve-inventory.use-case.ts |
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

## 25. POST /pharmacy/{pharmacyId}/suppliers

- **Módulo:** `pharmacy_inventory`
- **Etiqueta OpenAPI:** `pharmacy-inventory`
- **Nombre:** Registrar un proveedor de farmacia
- **Operation ID:** `PharmacyProcurementController_createSupplier`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyProcurementController.createSupplier](../../src/modules/pharmacy_inventory/presentation/controllers/pharmacy-procurement.controller.ts)

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
| 504 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `IdResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |

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

## 26. POST /pharmacy/{pharmacyId}/transfers

- **Módulo:** `pharmacy_inventory`
- **Etiqueta OpenAPI:** `pharmacy-inventory`
- **Nombre:** Transferir stock entre ubicaciones (UC-25-10)
- **Operation ID:** `PharmacyInventoryController_transfer`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyInventoryController.transfer](../../src/modules/pharmacy_inventory/presentation/controllers/pharmacy-inventory.controller.ts)

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
| 504 | Operación completada correctamente. | `Promise<TransferResponseDto>` | No |

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
| 409 | `CONFLICT` | Stock disponible insuficiente en el botiquín | Excepción explícita en src/modules/pharmacy_inventory/application/inventory-transfers/transfer-inventory.use-case.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Stock disponible insuficiente en origen | Excepción explícita en src/modules/pharmacy_inventory/application/inventory-transfers/transfer-inventory.use-case.ts |
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

## 27. POST /pharmacy/{siteId}/count-sessions

- **Módulo:** `pharmacy_inventory`
- **Etiqueta OpenAPI:** `pharmacy-inventory`
- **Nombre:** Iniciar y congelar una sesión de conteo (UC-25-06)
- **Operation ID:** `PharmacyInventoryController_openCountSession`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyInventoryController.openCountSession](../../src/modules/pharmacy_inventory/presentation/controllers/pharmacy-inventory.controller.ts)

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
| 504 | Operación completada correctamente. | `Promise<CountSessionResponseDto>` | No |

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
| 409 | `CONFLICT` | Ya existe una sesión de conteo abierta en la ubicación | Excepción explícita en src/modules/pharmacy_inventory/application/inventory-count/open-inventory-count.use-case.ts |
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

## 28. POST /pharmacy/{siteId}/inventory-locations

- **Módulo:** `pharmacy_inventory`
- **Etiqueta OpenAPI:** `pharmacy-inventory`
- **Nombre:** Crear una ubicación de inventario
- **Operation ID:** `PharmacyInventoryController_createLocation`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyInventoryController.createLocation](../../src/modules/pharmacy_inventory/presentation/controllers/pharmacy-inventory.controller.ts)

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
| `careSpaceId` | No | `string` | formato `uuid` | Espacio físico (F5c) | `00000000-0000-4000-8000-000000000001` |
| `clinicalUnitId` | No | `string` | formato `uuid` | Unidad clínica (F5c) | `00000000-0000-4000-8000-000000000001` |
| `locationTypeCode` | No | `string` | valores: `SHELF`, `WARD_STOCK` | Sin descripción específica en el contrato OpenAPI. | `SHELF` |

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
  "controlledAccess": true,
  "careSpaceId": "00000000-0000-4000-8000-000000000001",
  "clinicalUnitId": "00000000-0000-4000-8000-000000000001",
  "locationTypeCode": "SHELF"
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
| 504 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `IdResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |

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

## 29. POST /pharmacy/count-sessions/{id}/approve

- **Módulo:** `pharmacy_inventory`
- **Etiqueta OpenAPI:** `pharmacy-inventory`
- **Nombre:** Aprobar conteo y ajustar ledger por varianza (UC-25-07)
- **Operation ID:** `PharmacyInventoryController_approveCountSession`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyInventoryController.approveCountSession](../../src/modules/pharmacy_inventory/presentation/controllers/pharmacy-inventory.controller.ts)

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
| 504 | Operación completada correctamente. | `Promise<CountSessionResponseDto>` | No |

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
| 404 | `NOT_FOUND` | Línea de conteo no encontrada | Excepción explícita en src/modules/pharmacy_inventory/application/inventory-count/approve-inventory-count.use-case.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La sesión no está en estado aprobable | Excepción explícita en src/modules/pharmacy_inventory/application/inventory-count/approve-inventory-count.use-case.ts |
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

## 30. POST /pharmacy/dispensations/{id}/reverse

- **Módulo:** `pharmacy_inventory`
- **Etiqueta OpenAPI:** `pharmacy-inventory`
- **Nombre:** Reversar una dispensación (UC-25-11)
- **Operation ID:** `PharmacyDispensingController_reverse`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyDispensingController.reverse](../../src/modules/pharmacy_inventory/presentation/controllers/pharmacy-dispensing.controller.ts)

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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La dispensación no está en estado reversible | Excepción explícita en src/modules/pharmacy_inventory/application/medication-dispensations/reverse-medication-dispensation.use-case.ts |
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

## 31. POST /pharmacy/inventory-locations/{id}/relocate

- **Módulo:** `pharmacy_inventory`
- **Etiqueta OpenAPI:** `pharmacy-inventory`
- **Nombre:** Reubicar una ubicación de inventario (F5c)
- **Operation ID:** `PharmacyInventoryController_relocateLocation`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyInventoryController.relocateLocation](../../src/modules/pharmacy_inventory/presentation/controllers/pharmacy-inventory.controller.ts)

### Descripción de negocio

Reubicar una ubicación de inventario (F5c). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: F5c: reubicar una ubicación en otro espacio (el stock la sigue).

### Descripción del sistema

NestJS resuelve `POST /pharmacy/inventory-locations/{id}/relocate` en `PharmacyInventoryController_relocateLocation`. El controlador delega en `InventoryLocationsService.relocate`. Valida el body como `RelocateLocationDto` y consume `application/json`. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RelocateLocationDto`; los campos opcionales se omiten.

```http
POST /pharmacy/inventory-locations/00000000-0000-4000-8000-000000000001/relocate HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "careSpaceId": "00000000-0000-4000-8000-000000000001"
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
| `careSpaceId` | Sí | `string` | formato `uuid` | Espacio destino | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /pharmacy/inventory-locations/00000000-0000-4000-8000-000000000001/relocate HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "careSpaceId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | No |
| 400 | Operación completada correctamente. | `no declarado` | No |
| 401 | Operación completada correctamente. | `no declarado` | No |
| 403 | Operación completada correctamente. | `no declarado` | No |
| 404 | Operación completada correctamente. | `no declarado` | No |
| 409 | Operación completada correctamente. | `no declarado` | No |
| 413 | Operación completada correctamente. | `no declarado` | No |
| 422 | Operación completada correctamente. | `no declarado` | No |
| 429 | Operación completada correctamente. | `no declarado` | No |
| 500 | Operación completada correctamente. | `no declarado` | No |
| 504 | Operación completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

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
  "path": "/pharmacy/inventory-locations/{id}/relocate"
}
```

---

## 32. GET /pharmacy/orders

- **Módulo:** `pharmacy_inventory`
- **Etiqueta OpenAPI:** `pharmacy-orders`
- **Nombre:** Bandeja de pedidos de las farmacias del tenant (FAR-E2)
- **Operation ID:** `PharmacyOrdersController_listForTenant`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyOrdersController.listForTenant](../../src/modules/pharmacy_inventory/presentation/controllers/pharmacy-orders.controller.ts)

### Descripción de negocio

Bandeja de pedidos de las farmacias del tenant (FAR-E2). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: FAR-E2: la bandeja del mostrador — los pedidos del tenant de la farmacia. `PHARMACY_STAFF` es el rol de runtime del personal de una farmacia (lo materializa el login por membresía en un tenant `PHARMACY`). La protección real es el tenant en el WHERE: una organización nunca ve pedidos de otra.

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
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PHARMACY_STAFF`.
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
| 504 | Consulta completada correctamente. | `Promise<PharmacyOrderListResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PharmacyOrderListResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "reservationLines": [
        {
          "id": "00000000-0000-4000-8000-000000000001",
          "productId": "00000000-0000-4000-8000-000000000001",
          "quantity": "valor-ejemplo",
          "unitPriceAmount": "valor-ejemplo",
          "billedAmount": "valor-ejemplo",
          "currencyConceptId": "00000000-0000-4000-8000-000000000001"
        }
      ],
      "insuranceSettlement": {
        "claimId": "00000000-0000-4000-8000-000000000001",
        "claimIdentifier": "valor-ejemplo",
        "adjudicationVersionId": "00000000-0000-4000-8000-000000000001",
        "adjudicationVersion": 1,
        "eobId": "00000000-0000-4000-8000-000000000001",
        "carrierName": "Nombre de ejemplo",
        "policyIdentifier": "valor-ejemplo",
        "totalBilledAmount": "valor-ejemplo",
        "totalApprovedAmount": "valor-ejemplo",
        "totalPatientAmount": "valor-ejemplo",
        "totalDeniedAmount": "valor-ejemplo",
        "currencyCode": "BOB",
        "result": "APPROVED",
        "exclusions": [
          {
            "claimLineId": "00000000-0000-4000-8000-000000000001",
            "itemId": "00000000-0000-4000-8000-000000000001",
            "itemName": "Nombre de ejemplo",
            "amount": "valor-ejemplo",
            "policyClauseReference": "valor-ejemplo",
            "denialRationale": "valor-ejemplo"
          }
        ]
      },
      "insuranceSettlementAvailability": "AVAILABLE",
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
      "prescriber": {
        "name": "Nombre de ejemplo",
        "specialty": "valor-ejemplo"
      },
      "patientName": "Nombre de ejemplo",
      "deliveryMode": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "deliveryAddressText": "valor-ejemplo",
      "pickupCode": "CODIGO_EJEMPLO",
      "pharmacyPublicProfileId": "00000000-0000-4000-8000-000000000001",
      "pharmacyPublicSlug": "valor-ejemplo",
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
| `items` | Sí | `array<PharmacyOrderDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"reservationLines":[{"id":"00000000-0000-4000-8000-000000000001","productId":"00000000-0000-4000-8000-000000000001","quantity":"valor-ejemplo","unitPriceAmount":"valor-ejemplo","billedAmount":"valor-ejemplo","currencyConceptId":"00000000-0000-4000-8000-000000000001"}],"insuranceSettlement":{"claimId":"00000000-0000-4000-8000-000000000001","claimIdentifier":"valor-ejemplo","adjudicationVersionId":"00000000-0000-4000-8000-000000000001","adjudicationVersion":1,"eobId":"00000000-0000-4000-8000-000000000001","carrierName":"Nombre de ejemplo","policyIdentifier":"valor-ejemplo","totalBilledAmount":"valor-ejemplo","totalApprovedAmount":"valor-ejemplo","totalPatientAmount":"valor-ejemplo","totalDeniedAmount":"valor-ejemplo","currencyCode":"BOB","result":"APPROVED","exclusions":[{"claimLineId":"00000000-0000-4000-8000-000000000001","itemId":"00000000-0000-4000-8000-000000000001","itemName":"Nombre de ejemplo","amount":"valor-ejemplo","policyClauseReference":"valor-ejemplo","denialRationale":"valor-ejemplo"}]},"insuranceSettlementAvailability":"AVAILABLE","id":"00000000-0000-4000-8000-000000000001","status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"createdAt":"valor-ejemplo","expiresAt":"valor-ejemplo","siteId":"00000000-0000-4000-8000-000000000001","siteName":"Nombre de ejemplo","pharmacyId":"00000000-0000-4000-8000-000000000001","pharmacyName":"Nombre de ejemplo","medicationRequestId":"00000000-0000-4000-8000-000000000001","prescriber":{"name":"Nombre de ejemplo","specialty":"valor-ejemplo"},"patientName":"Nombre de ejemplo","deliveryMode":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"deliveryAddressText":"valor-ejemplo","pickupCode":"CODIGO_EJEMPLO","pharmacyPublicProfileId":"00000000-0000-4000-8000-000000000001","pharmacyPublicSlug":"valor-ejemplo","totalAmount":"valor-ejemplo","currency":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"rejectionReasonText":"Texto descriptivo de ejemplo","substitutions":[{"id":"00000000-0000-4000-8000-000000000001","originalProductId":"00000000-0000-4000-8000-000000000001","originalName":"Nombre de ejemplo","originalUnitPriceAmount":"valor-ejemplo","proposedProductId":"00000000-0000-4000-8000-000000000001","proposedName":"Nombre de ejemplo","proposedUnitPriceAmount":"valor-ejemplo","currency":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"decidedAt":"valor-ejemplo"}],"lines":[{"productId":"00000000-0000-4000-8000-000000000001","medicationConceptId":"00000000-0000-4000-8000-000000000001","productCode":"CODIGO_EJEMPLO","brandName":"Nombre de ejemplo","genericName":"Nombre de ejemplo","strengthText":"valor-ejemplo","packageSizeText":"valor-ejemplo","medication":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"requestedQuantity":1,"reservedQuantity":1,"fulfilledQuantity":1,"unitPriceAmount":"valor-ejemplo","currency":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}}]}]` |
| `items[].reservationLines` | Sí | `array<PharmacyOrderReservationLineDto>` | Sin restricción adicional declarada | Porciones confirmadas o entregadas vigentes para facturación | `[{"id":"00000000-0000-4000-8000-000000000001","productId":"00000000-0000-4000-8000-000000000001","quantity":"valor-ejemplo","unitPriceAmount":"valor-ejemplo","billedAmount":"valor-ejemplo","currencyConceptId":"00000000-0000-4000-8000-000000000001"}]` |
| `items[].reservationLines[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].reservationLines[].productId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].reservationLines[].quantity` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].reservationLines[].unitPriceAmount` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].reservationLines[].billedAmount` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].reservationLines[].currencyConceptId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].insuranceSettlement` | Sí | `PatientInsuranceSettlementDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"claimId":"00000000-0000-4000-8000-000000000001","claimIdentifier":"valor-ejemplo","adjudicationVersionId":"00000000-0000-4000-8000-000000000001","adjudicationVersion":1,"eobId":"00000000-0000-4000-8000-000000000001","carrierName":"Nombre de ejemplo","policyIdentifier":"valor-ejemplo","totalBilledAmount":"valor-ejemplo","totalApprovedAmount":"valor-ejemplo","totalPatientAmount":"valor-ejemplo","totalDeniedAmount":"valor-ejemplo","currencyCode":"BOB","result":"APPROVED","exclusions":[{"claimLineId":"00000000-0000-4000-8000-000000000001","itemId":"00000000-0000-4000-8000-000000000001","itemName":"Nombre de ejemplo","amount":"valor-ejemplo","policyClauseReference":"valor-ejemplo","denialRationale":"valor-ejemplo"}]}` |
| `items[].insuranceSettlement.claimId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].insuranceSettlement.claimIdentifier` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].insuranceSettlement.adjudicationVersionId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].insuranceSettlement.adjudicationVersion` | Sí | `number` | formato `int32`; mínimo 1 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `items[].insuranceSettlement.eobId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].insuranceSettlement.carrierName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].insuranceSettlement.policyIdentifier` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].insuranceSettlement.totalBilledAmount` | Sí | `string` | Sin restricción adicional declarada | Total facturado, decimal exacto | `valor-ejemplo` |
| `items[].insuranceSettlement.totalApprovedAmount` | Sí | `string` | Sin restricción adicional declarada | Aporte del seguro, decimal exacto | `valor-ejemplo` |
| `items[].insuranceSettlement.totalPatientAmount` | Sí | `string` | Sin restricción adicional declarada | Cargo confirmado al paciente, decimal exacto | `valor-ejemplo` |
| `items[].insuranceSettlement.totalDeniedAmount` | Sí | `string` | Sin restricción adicional declarada | Importe excluido sin asignar, decimal exacto | `valor-ejemplo` |
| `items[].insuranceSettlement.currencyCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `BOB` |
| `items[].insuranceSettlement.result` | Sí | `string` | valores: `APPROVED`, `PARTIALLY_APPROVED`, `DENIED` | Sin descripción específica en el contrato OpenAPI. | `APPROVED` |
| `items[].insuranceSettlement.exclusions` | Sí | `array<PatientInsuranceSettlementExclusionDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"claimLineId":"00000000-0000-4000-8000-000000000001","itemId":"00000000-0000-4000-8000-000000000001","itemName":"Nombre de ejemplo","amount":"valor-ejemplo","policyClauseReference":"valor-ejemplo","denialRationale":"valor-ejemplo"}]` |
| `items[].insuranceSettlement.exclusions[].claimLineId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].insuranceSettlement.exclusions[].itemId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].insuranceSettlement.exclusions[].itemName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].insuranceSettlement.exclusions[].amount` | Sí | `string` | Sin restricción adicional declarada | Importe decimal exacto excluido | `valor-ejemplo` |
| `items[].insuranceSettlement.exclusions[].policyClauseReference` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].insuranceSettlement.exclusions[].denialRationale` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].insuranceSettlementAvailability` | Sí | `string` | valores: `AVAILABLE`, `PENDING_PUBLICATION`, `UNDER_REVIEW`, `NOT_AVAILABLE` | Sin descripción específica en el contrato OpenAPI. | `AVAILABLE` |
| `items[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].status` | Sí | `InventoryConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `items[].status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].createdAt` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].expiresAt` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].siteId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].siteName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].pharmacyId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].pharmacyName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].medicationRequestId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].prescriber` | No | `PharmacyOrderPrescriberDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"name":"Nombre de ejemplo","specialty":"valor-ejemplo"}` |
| `items[].prescriber.name` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].prescriber.specialty` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].patientName` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].deliveryMode` | No | `InventoryConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `items[].deliveryMode.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].deliveryMode.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].deliveryAddressText` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].pickupCode` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].pharmacyPublicProfileId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].pharmacyPublicSlug` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].totalAmount` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].currency` | No | `InventoryConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `items[].currency.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].currency.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].rejectionReasonText` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `items[].substitutions` | Sí | `array<PharmacyOrderSubstitutionDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","originalProductId":"00000000-0000-4000-8000-000000000001","originalName":"Nombre de ejemplo","originalUnitPriceAmount":"valor-ejemplo","proposedProductId":"00000000-0000-4000-8000-000000000001","proposedName":"Nombre de ejemplo","proposedUnitPriceAmount":"valor-ejemplo","currency":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"decidedAt":"valor-ejemplo"}]` |
| `items[].substitutions[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].substitutions[].originalProductId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].substitutions[].originalName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].substitutions[].originalUnitPriceAmount` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].substitutions[].proposedProductId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].substitutions[].proposedName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].substitutions[].proposedUnitPriceAmount` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].substitutions[].currency` | No | `InventoryConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `items[].substitutions[].currency.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].substitutions[].currency.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].substitutions[].status` | Sí | `InventoryConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `items[].substitutions[].status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].substitutions[].status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].substitutions[].decidedAt` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].lines` | Sí | `array<PharmacyOrderLineDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"productId":"00000000-0000-4000-8000-000000000001","medicationConceptId":"00000000-0000-4000-8000-000000000001","productCode":"CODIGO_EJEMPLO","brandName":"Nombre de ejemplo","genericName":"Nombre de ejemplo","strengthText":"valor-ejemplo","packageSizeText":"valor-ejemplo","medication":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"requestedQuantity":1,"reservedQuantity":1,"fulfilledQuantity":1,"unitPriceAmount":"valor-ejemplo","currency":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}}]` |
| `items[].lines[].productId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].lines[].medicationConceptId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].lines[].productCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].lines[].brandName` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].lines[].genericName` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].lines[].strengthText` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].lines[].packageSizeText` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].lines[].medication` | No | `InventoryConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `items[].lines[].medication.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].lines[].medication.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].lines[].requestedQuantity` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `items[].lines[].reservedQuantity` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `items[].lines[].fulfilledQuantity` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `items[].lines[].unitPriceAmount` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].lines[].currency` | No | `InventoryConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `items[].lines[].currency.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].lines[].currency.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].lines[].status` | Sí | `InventoryConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `items[].lines[].status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].lines[].status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, PHARMACY_STAFF. | Roles/tenant/guards de autorización |
| 422 | `PRECONDITION_FAILED` | Estado de pedido desconocido | Excepción explícita en src/modules/pharmacy_inventory/application/pharmacy-orders/pharmacy-orders.use-cases.ts |
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

## 33. POST /pharmacy/orders

- **Módulo:** `pharmacy_inventory`
- **Etiqueta OpenAPI:** `pharmacy-orders`
- **Nombre:** Crear un pedido de farmacia (FAR-E1)
- **Operation ID:** `PharmacyOrdersController_create`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyOrdersController.create](../../src/modules/pharmacy_inventory/presentation/controllers/pharmacy-orders.controller.ts)

### Descripción de negocio

El paciente sale del token. Reserva parcial: una línea sin stock queda SIN_STOCK y no tumba el pedido. Un producto que la sede ofrece por su catálogo, sin existencia propia, entra por confirmar (PINV_RES_LINE_PENDING_CONFIRMATION) sin reservar. Si ninguna línea tiene stock ni queda por confirmar: 422 PRODUCT_OUT_OF_STOCK y no se escribe nada. Repetir la misma idempotencyKey devuelve el pedido ya creado.

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
| 504 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PharmacyOrderDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "reservationLines": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "productId": "00000000-0000-4000-8000-000000000001",
      "quantity": "valor-ejemplo",
      "unitPriceAmount": "valor-ejemplo",
      "billedAmount": "valor-ejemplo",
      "currencyConceptId": "00000000-0000-4000-8000-000000000001"
    }
  ],
  "insuranceSettlement": {
    "claimId": "00000000-0000-4000-8000-000000000001",
    "claimIdentifier": "valor-ejemplo",
    "adjudicationVersionId": "00000000-0000-4000-8000-000000000001",
    "adjudicationVersion": 1,
    "eobId": "00000000-0000-4000-8000-000000000001",
    "carrierName": "Nombre de ejemplo",
    "policyIdentifier": "valor-ejemplo",
    "totalBilledAmount": "valor-ejemplo",
    "totalApprovedAmount": "valor-ejemplo",
    "totalPatientAmount": "valor-ejemplo",
    "totalDeniedAmount": "valor-ejemplo",
    "currencyCode": "BOB",
    "result": "APPROVED",
    "exclusions": [
      {
        "claimLineId": "00000000-0000-4000-8000-000000000001",
        "itemId": "00000000-0000-4000-8000-000000000001",
        "itemName": "Nombre de ejemplo",
        "amount": "valor-ejemplo",
        "policyClauseReference": "valor-ejemplo",
        "denialRationale": "valor-ejemplo"
      }
    ]
  },
  "insuranceSettlementAvailability": "AVAILABLE",
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
  "prescriber": {
    "name": "Nombre de ejemplo",
    "specialty": "valor-ejemplo"
  },
  "patientName": "Nombre de ejemplo",
  "deliveryMode": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "deliveryAddressText": "valor-ejemplo",
  "pickupCode": "CODIGO_EJEMPLO",
  "pharmacyPublicProfileId": "00000000-0000-4000-8000-000000000001",
  "pharmacyPublicSlug": "valor-ejemplo",
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
| `reservationLines` | Sí | `array<PharmacyOrderReservationLineDto>` | Sin restricción adicional declarada | Porciones confirmadas o entregadas vigentes para facturación | `[{"id":"00000000-0000-4000-8000-000000000001","productId":"00000000-0000-4000-8000-000000000001","quantity":"valor-ejemplo","unitPriceAmount":"valor-ejemplo","billedAmount":"valor-ejemplo","currencyConceptId":"00000000-0000-4000-8000-000000000001"}]` |
| `reservationLines[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `reservationLines[].productId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `reservationLines[].quantity` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `reservationLines[].unitPriceAmount` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `reservationLines[].billedAmount` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `reservationLines[].currencyConceptId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `insuranceSettlement` | Sí | `PatientInsuranceSettlementDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"claimId":"00000000-0000-4000-8000-000000000001","claimIdentifier":"valor-ejemplo","adjudicationVersionId":"00000000-0000-4000-8000-000000000001","adjudicationVersion":1,"eobId":"00000000-0000-4000-8000-000000000001","carrierName":"Nombre de ejemplo","policyIdentifier":"valor-ejemplo","totalBilledAmount":"valor-ejemplo","totalApprovedAmount":"valor-ejemplo","totalPatientAmount":"valor-ejemplo","totalDeniedAmount":"valor-ejemplo","currencyCode":"BOB","result":"APPROVED","exclusions":[{"claimLineId":"00000000-0000-4000-8000-000000000001","itemId":"00000000-0000-4000-8000-000000000001","itemName":"Nombre de ejemplo","amount":"valor-ejemplo","policyClauseReference":"valor-ejemplo","denialRationale":"valor-ejemplo"}]}` |
| `insuranceSettlement.claimId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `insuranceSettlement.claimIdentifier` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `insuranceSettlement.adjudicationVersionId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `insuranceSettlement.adjudicationVersion` | Sí | `number` | formato `int32`; mínimo 1 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `insuranceSettlement.eobId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `insuranceSettlement.carrierName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `insuranceSettlement.policyIdentifier` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `insuranceSettlement.totalBilledAmount` | Sí | `string` | Sin restricción adicional declarada | Total facturado, decimal exacto | `valor-ejemplo` |
| `insuranceSettlement.totalApprovedAmount` | Sí | `string` | Sin restricción adicional declarada | Aporte del seguro, decimal exacto | `valor-ejemplo` |
| `insuranceSettlement.totalPatientAmount` | Sí | `string` | Sin restricción adicional declarada | Cargo confirmado al paciente, decimal exacto | `valor-ejemplo` |
| `insuranceSettlement.totalDeniedAmount` | Sí | `string` | Sin restricción adicional declarada | Importe excluido sin asignar, decimal exacto | `valor-ejemplo` |
| `insuranceSettlement.currencyCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `BOB` |
| `insuranceSettlement.result` | Sí | `string` | valores: `APPROVED`, `PARTIALLY_APPROVED`, `DENIED` | Sin descripción específica en el contrato OpenAPI. | `APPROVED` |
| `insuranceSettlement.exclusions` | Sí | `array<PatientInsuranceSettlementExclusionDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"claimLineId":"00000000-0000-4000-8000-000000000001","itemId":"00000000-0000-4000-8000-000000000001","itemName":"Nombre de ejemplo","amount":"valor-ejemplo","policyClauseReference":"valor-ejemplo","denialRationale":"valor-ejemplo"}]` |
| `insuranceSettlement.exclusions[].claimLineId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `insuranceSettlement.exclusions[].itemId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `insuranceSettlement.exclusions[].itemName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `insuranceSettlement.exclusions[].amount` | Sí | `string` | Sin restricción adicional declarada | Importe decimal exacto excluido | `valor-ejemplo` |
| `insuranceSettlement.exclusions[].policyClauseReference` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `insuranceSettlement.exclusions[].denialRationale` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `insuranceSettlementAvailability` | Sí | `string` | valores: `AVAILABLE`, `PENDING_PUBLICATION`, `UNDER_REVIEW`, `NOT_AVAILABLE` | Sin descripción específica en el contrato OpenAPI. | `AVAILABLE` |
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `InventoryConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `createdAt` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `expiresAt` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `siteId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `siteName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `pharmacyId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `pharmacyName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `medicationRequestId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `prescriber` | No | `PharmacyOrderPrescriberDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"name":"Nombre de ejemplo","specialty":"valor-ejemplo"}` |
| `prescriber.name` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `prescriber.specialty` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `patientName` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `deliveryMode` | No | `InventoryConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `deliveryMode.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `deliveryMode.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `deliveryAddressText` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `pickupCode` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `pharmacyPublicProfileId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `pharmacyPublicSlug` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `totalAmount` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `currency` | No | `InventoryConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `currency.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `currency.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `rejectionReasonText` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `substitutions` | Sí | `array<PharmacyOrderSubstitutionDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","originalProductId":"00000000-0000-4000-8000-000000000001","originalName":"Nombre de ejemplo","originalUnitPriceAmount":"valor-ejemplo","proposedProductId":"00000000-0000-4000-8000-000000000001","proposedName":"Nombre de ejemplo","proposedUnitPriceAmount":"valor-ejemplo","currency":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"decidedAt":"valor-ejemplo"}]` |
| `substitutions[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `substitutions[].originalProductId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `substitutions[].originalName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `substitutions[].originalUnitPriceAmount` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `substitutions[].proposedProductId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `substitutions[].proposedName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `substitutions[].proposedUnitPriceAmount` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `substitutions[].currency` | No | `InventoryConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `substitutions[].currency.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `substitutions[].currency.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `substitutions[].status` | Sí | `InventoryConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `substitutions[].status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `substitutions[].status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `substitutions[].decidedAt` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines` | Sí | `array<PharmacyOrderLineDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"productId":"00000000-0000-4000-8000-000000000001","medicationConceptId":"00000000-0000-4000-8000-000000000001","productCode":"CODIGO_EJEMPLO","brandName":"Nombre de ejemplo","genericName":"Nombre de ejemplo","strengthText":"valor-ejemplo","packageSizeText":"valor-ejemplo","medication":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"requestedQuantity":1,"reservedQuantity":1,"fulfilledQuantity":1,"unitPriceAmount":"valor-ejemplo","currency":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}}]` |
| `lines[].productId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `lines[].medicationConceptId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `lines[].productCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `lines[].brandName` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `lines[].genericName` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `lines[].strengthText` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines[].packageSizeText` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines[].medication` | No | `InventoryConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `lines[].medication.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `lines[].medication.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines[].requestedQuantity` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `lines[].reservedQuantity` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `lines[].fulfilledQuantity` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `lines[].unitPriceAmount` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines[].currency` | No | `InventoryConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `lines[].currency.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `lines[].currency.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines[].status` | Sí | `InventoryConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `lines[].status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `lines[].status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PATIENT. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Sede de farmacia no encontrada | Excepción explícita en src/modules/pharmacy_inventory/application/pharmacy-orders/pharmacy-orders.use-cases.ts |
| 404 | `NOT_FOUND` | Receta no encontrada | Excepción explícita en src/modules/pharmacy_inventory/application/pharmacy-orders/pharmacy-orders.use-cases.ts |
| 404 | `NOT_FOUND` | Producto no disponible en la sede | Excepción explícita en src/modules/pharmacy_inventory/application/pharmacy-orders/pharmacy-orders.use-cases.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La cuenta autenticada no tiene perfil de paciente | Excepción explícita en src/modules/pharmacy_inventory/application/pharmacy-orders/pharmacy-orders.use-cases.ts |
| 422 | `PRECONDITION_FAILED` | El pedido repite productos; use una línea por producto | Excepción explícita en src/modules/pharmacy_inventory/application/pharmacy-orders/pharmacy-orders.use-cases.ts |
| 422 | `PRECONDITION_FAILED` | El envío a domicilio o al trabajo llega con el carril de envío (FAR-E4); hoy solo RETIRO | Excepción explícita en src/modules/pharmacy_inventory/application/pharmacy-orders/pharmacy-orders.use-cases.ts |
| 422 | `PRECONDITION_FAILED` | PRESCRIPTION_ORDER_MESSAGES[violation.reason] | Excepción explícita en src/modules/pharmacy_inventory/application/pharmacy-orders/prescription-order-guard.ts |
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

## 34. GET /pharmacy/orders/{id}

- **Módulo:** `pharmacy_inventory`
- **Etiqueta OpenAPI:** `pharmacy-orders`
- **Nombre:** Consultar un pedido de farmacia (FAR-E1)
- **Operation ID:** `PharmacyOrdersController_getOrder`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyOrdersController.getOrder](../../src/modules/pharmacy_inventory/presentation/controllers/pharmacy-orders.controller.ts)

### Descripción de negocio

Lo ve su titular, la plataforma o un OWNER/ADMIN activo del tenant de la farmacia; cualquier tercero recibe el mismo 404. La liquidación privada sólo se incluye para el titular.

Contexto declarado en el controlador: Titular, plataforma o OWNER/ADMIN activo del tenant; terceros: 404. La membresía se autoriza en el servicio; se mantiene el guard JWT global.

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
| 200 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<PharmacyOrderDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<PharmacyOrderDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PharmacyOrderDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "reservationLines": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "productId": "00000000-0000-4000-8000-000000000001",
      "quantity": "valor-ejemplo",
      "unitPriceAmount": "valor-ejemplo",
      "billedAmount": "valor-ejemplo",
      "currencyConceptId": "00000000-0000-4000-8000-000000000001"
    }
  ],
  "insuranceSettlement": {
    "claimId": "00000000-0000-4000-8000-000000000001",
    "claimIdentifier": "valor-ejemplo",
    "adjudicationVersionId": "00000000-0000-4000-8000-000000000001",
    "adjudicationVersion": 1,
    "eobId": "00000000-0000-4000-8000-000000000001",
    "carrierName": "Nombre de ejemplo",
    "policyIdentifier": "valor-ejemplo",
    "totalBilledAmount": "valor-ejemplo",
    "totalApprovedAmount": "valor-ejemplo",
    "totalPatientAmount": "valor-ejemplo",
    "totalDeniedAmount": "valor-ejemplo",
    "currencyCode": "BOB",
    "result": "APPROVED",
    "exclusions": [
      {
        "claimLineId": "00000000-0000-4000-8000-000000000001",
        "itemId": "00000000-0000-4000-8000-000000000001",
        "itemName": "Nombre de ejemplo",
        "amount": "valor-ejemplo",
        "policyClauseReference": "valor-ejemplo",
        "denialRationale": "valor-ejemplo"
      }
    ]
  },
  "insuranceSettlementAvailability": "AVAILABLE",
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
  "prescriber": {
    "name": "Nombre de ejemplo",
    "specialty": "valor-ejemplo"
  },
  "patientName": "Nombre de ejemplo",
  "deliveryMode": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "deliveryAddressText": "valor-ejemplo",
  "pickupCode": "CODIGO_EJEMPLO",
  "pharmacyPublicProfileId": "00000000-0000-4000-8000-000000000001",
  "pharmacyPublicSlug": "valor-ejemplo",
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
| `reservationLines` | Sí | `array<PharmacyOrderReservationLineDto>` | Sin restricción adicional declarada | Porciones confirmadas o entregadas vigentes para facturación | `[{"id":"00000000-0000-4000-8000-000000000001","productId":"00000000-0000-4000-8000-000000000001","quantity":"valor-ejemplo","unitPriceAmount":"valor-ejemplo","billedAmount":"valor-ejemplo","currencyConceptId":"00000000-0000-4000-8000-000000000001"}]` |
| `reservationLines[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `reservationLines[].productId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `reservationLines[].quantity` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `reservationLines[].unitPriceAmount` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `reservationLines[].billedAmount` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `reservationLines[].currencyConceptId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `insuranceSettlement` | Sí | `PatientInsuranceSettlementDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"claimId":"00000000-0000-4000-8000-000000000001","claimIdentifier":"valor-ejemplo","adjudicationVersionId":"00000000-0000-4000-8000-000000000001","adjudicationVersion":1,"eobId":"00000000-0000-4000-8000-000000000001","carrierName":"Nombre de ejemplo","policyIdentifier":"valor-ejemplo","totalBilledAmount":"valor-ejemplo","totalApprovedAmount":"valor-ejemplo","totalPatientAmount":"valor-ejemplo","totalDeniedAmount":"valor-ejemplo","currencyCode":"BOB","result":"APPROVED","exclusions":[{"claimLineId":"00000000-0000-4000-8000-000000000001","itemId":"00000000-0000-4000-8000-000000000001","itemName":"Nombre de ejemplo","amount":"valor-ejemplo","policyClauseReference":"valor-ejemplo","denialRationale":"valor-ejemplo"}]}` |
| `insuranceSettlement.claimId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `insuranceSettlement.claimIdentifier` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `insuranceSettlement.adjudicationVersionId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `insuranceSettlement.adjudicationVersion` | Sí | `number` | formato `int32`; mínimo 1 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `insuranceSettlement.eobId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `insuranceSettlement.carrierName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `insuranceSettlement.policyIdentifier` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `insuranceSettlement.totalBilledAmount` | Sí | `string` | Sin restricción adicional declarada | Total facturado, decimal exacto | `valor-ejemplo` |
| `insuranceSettlement.totalApprovedAmount` | Sí | `string` | Sin restricción adicional declarada | Aporte del seguro, decimal exacto | `valor-ejemplo` |
| `insuranceSettlement.totalPatientAmount` | Sí | `string` | Sin restricción adicional declarada | Cargo confirmado al paciente, decimal exacto | `valor-ejemplo` |
| `insuranceSettlement.totalDeniedAmount` | Sí | `string` | Sin restricción adicional declarada | Importe excluido sin asignar, decimal exacto | `valor-ejemplo` |
| `insuranceSettlement.currencyCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `BOB` |
| `insuranceSettlement.result` | Sí | `string` | valores: `APPROVED`, `PARTIALLY_APPROVED`, `DENIED` | Sin descripción específica en el contrato OpenAPI. | `APPROVED` |
| `insuranceSettlement.exclusions` | Sí | `array<PatientInsuranceSettlementExclusionDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"claimLineId":"00000000-0000-4000-8000-000000000001","itemId":"00000000-0000-4000-8000-000000000001","itemName":"Nombre de ejemplo","amount":"valor-ejemplo","policyClauseReference":"valor-ejemplo","denialRationale":"valor-ejemplo"}]` |
| `insuranceSettlement.exclusions[].claimLineId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `insuranceSettlement.exclusions[].itemId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `insuranceSettlement.exclusions[].itemName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `insuranceSettlement.exclusions[].amount` | Sí | `string` | Sin restricción adicional declarada | Importe decimal exacto excluido | `valor-ejemplo` |
| `insuranceSettlement.exclusions[].policyClauseReference` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `insuranceSettlement.exclusions[].denialRationale` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `insuranceSettlementAvailability` | Sí | `string` | valores: `AVAILABLE`, `PENDING_PUBLICATION`, `UNDER_REVIEW`, `NOT_AVAILABLE` | Sin descripción específica en el contrato OpenAPI. | `AVAILABLE` |
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `InventoryConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `createdAt` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `expiresAt` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `siteId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `siteName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `pharmacyId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `pharmacyName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `medicationRequestId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `prescriber` | No | `PharmacyOrderPrescriberDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"name":"Nombre de ejemplo","specialty":"valor-ejemplo"}` |
| `prescriber.name` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `prescriber.specialty` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `patientName` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `deliveryMode` | No | `InventoryConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `deliveryMode.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `deliveryMode.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `deliveryAddressText` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `pickupCode` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `pharmacyPublicProfileId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `pharmacyPublicSlug` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `totalAmount` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `currency` | No | `InventoryConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `currency.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `currency.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `rejectionReasonText` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `substitutions` | Sí | `array<PharmacyOrderSubstitutionDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","originalProductId":"00000000-0000-4000-8000-000000000001","originalName":"Nombre de ejemplo","originalUnitPriceAmount":"valor-ejemplo","proposedProductId":"00000000-0000-4000-8000-000000000001","proposedName":"Nombre de ejemplo","proposedUnitPriceAmount":"valor-ejemplo","currency":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"decidedAt":"valor-ejemplo"}]` |
| `substitutions[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `substitutions[].originalProductId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `substitutions[].originalName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `substitutions[].originalUnitPriceAmount` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `substitutions[].proposedProductId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `substitutions[].proposedName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `substitutions[].proposedUnitPriceAmount` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `substitutions[].currency` | No | `InventoryConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `substitutions[].currency.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `substitutions[].currency.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `substitutions[].status` | Sí | `InventoryConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `substitutions[].status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `substitutions[].status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `substitutions[].decidedAt` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines` | Sí | `array<PharmacyOrderLineDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"productId":"00000000-0000-4000-8000-000000000001","medicationConceptId":"00000000-0000-4000-8000-000000000001","productCode":"CODIGO_EJEMPLO","brandName":"Nombre de ejemplo","genericName":"Nombre de ejemplo","strengthText":"valor-ejemplo","packageSizeText":"valor-ejemplo","medication":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"requestedQuantity":1,"reservedQuantity":1,"fulfilledQuantity":1,"unitPriceAmount":"valor-ejemplo","currency":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}}]` |
| `lines[].productId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `lines[].medicationConceptId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `lines[].productCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `lines[].brandName` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `lines[].genericName` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `lines[].strengthText` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines[].packageSizeText` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines[].medication` | No | `InventoryConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `lines[].medication.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `lines[].medication.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines[].requestedQuantity` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `lines[].reservedQuantity` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `lines[].fulfilledQuantity` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `lines[].unitPriceAmount` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines[].currency` | No | `InventoryConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `lines[].currency.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `lines[].currency.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines[].status` | Sí | `InventoryConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `lines[].status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `lines[].status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

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
  "path": "/pharmacy/orders/{id}"
}
```

---

## 35. POST /pharmacy/orders/{id}/accept-substitutions

- **Módulo:** `pharmacy_inventory`
- **Etiqueta OpenAPI:** `pharmacy-orders`
- **Nombre:** Aceptar los genéricos propuestos (paciente)
- **Operation ID:** `PharmacyOrdersController_acceptSubstitutions`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyOrdersController.acceptSubstitutions](../../src/modules/pharmacy_inventory/presentation/controllers/pharmacy-orders.controller.ts)

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
| 504 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PharmacyOrderDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "reservationLines": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "productId": "00000000-0000-4000-8000-000000000001",
      "quantity": "valor-ejemplo",
      "unitPriceAmount": "valor-ejemplo",
      "billedAmount": "valor-ejemplo",
      "currencyConceptId": "00000000-0000-4000-8000-000000000001"
    }
  ],
  "insuranceSettlement": {
    "claimId": "00000000-0000-4000-8000-000000000001",
    "claimIdentifier": "valor-ejemplo",
    "adjudicationVersionId": "00000000-0000-4000-8000-000000000001",
    "adjudicationVersion": 1,
    "eobId": "00000000-0000-4000-8000-000000000001",
    "carrierName": "Nombre de ejemplo",
    "policyIdentifier": "valor-ejemplo",
    "totalBilledAmount": "valor-ejemplo",
    "totalApprovedAmount": "valor-ejemplo",
    "totalPatientAmount": "valor-ejemplo",
    "totalDeniedAmount": "valor-ejemplo",
    "currencyCode": "BOB",
    "result": "APPROVED",
    "exclusions": [
      {
        "claimLineId": "00000000-0000-4000-8000-000000000001",
        "itemId": "00000000-0000-4000-8000-000000000001",
        "itemName": "Nombre de ejemplo",
        "amount": "valor-ejemplo",
        "policyClauseReference": "valor-ejemplo",
        "denialRationale": "valor-ejemplo"
      }
    ]
  },
  "insuranceSettlementAvailability": "AVAILABLE",
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
  "prescriber": {
    "name": "Nombre de ejemplo",
    "specialty": "valor-ejemplo"
  },
  "patientName": "Nombre de ejemplo",
  "deliveryMode": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "deliveryAddressText": "valor-ejemplo",
  "pickupCode": "CODIGO_EJEMPLO",
  "pharmacyPublicProfileId": "00000000-0000-4000-8000-000000000001",
  "pharmacyPublicSlug": "valor-ejemplo",
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
| `reservationLines` | Sí | `array<PharmacyOrderReservationLineDto>` | Sin restricción adicional declarada | Porciones confirmadas o entregadas vigentes para facturación | `[{"id":"00000000-0000-4000-8000-000000000001","productId":"00000000-0000-4000-8000-000000000001","quantity":"valor-ejemplo","unitPriceAmount":"valor-ejemplo","billedAmount":"valor-ejemplo","currencyConceptId":"00000000-0000-4000-8000-000000000001"}]` |
| `reservationLines[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `reservationLines[].productId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `reservationLines[].quantity` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `reservationLines[].unitPriceAmount` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `reservationLines[].billedAmount` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `reservationLines[].currencyConceptId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `insuranceSettlement` | Sí | `PatientInsuranceSettlementDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"claimId":"00000000-0000-4000-8000-000000000001","claimIdentifier":"valor-ejemplo","adjudicationVersionId":"00000000-0000-4000-8000-000000000001","adjudicationVersion":1,"eobId":"00000000-0000-4000-8000-000000000001","carrierName":"Nombre de ejemplo","policyIdentifier":"valor-ejemplo","totalBilledAmount":"valor-ejemplo","totalApprovedAmount":"valor-ejemplo","totalPatientAmount":"valor-ejemplo","totalDeniedAmount":"valor-ejemplo","currencyCode":"BOB","result":"APPROVED","exclusions":[{"claimLineId":"00000000-0000-4000-8000-000000000001","itemId":"00000000-0000-4000-8000-000000000001","itemName":"Nombre de ejemplo","amount":"valor-ejemplo","policyClauseReference":"valor-ejemplo","denialRationale":"valor-ejemplo"}]}` |
| `insuranceSettlement.claimId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `insuranceSettlement.claimIdentifier` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `insuranceSettlement.adjudicationVersionId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `insuranceSettlement.adjudicationVersion` | Sí | `number` | formato `int32`; mínimo 1 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `insuranceSettlement.eobId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `insuranceSettlement.carrierName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `insuranceSettlement.policyIdentifier` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `insuranceSettlement.totalBilledAmount` | Sí | `string` | Sin restricción adicional declarada | Total facturado, decimal exacto | `valor-ejemplo` |
| `insuranceSettlement.totalApprovedAmount` | Sí | `string` | Sin restricción adicional declarada | Aporte del seguro, decimal exacto | `valor-ejemplo` |
| `insuranceSettlement.totalPatientAmount` | Sí | `string` | Sin restricción adicional declarada | Cargo confirmado al paciente, decimal exacto | `valor-ejemplo` |
| `insuranceSettlement.totalDeniedAmount` | Sí | `string` | Sin restricción adicional declarada | Importe excluido sin asignar, decimal exacto | `valor-ejemplo` |
| `insuranceSettlement.currencyCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `BOB` |
| `insuranceSettlement.result` | Sí | `string` | valores: `APPROVED`, `PARTIALLY_APPROVED`, `DENIED` | Sin descripción específica en el contrato OpenAPI. | `APPROVED` |
| `insuranceSettlement.exclusions` | Sí | `array<PatientInsuranceSettlementExclusionDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"claimLineId":"00000000-0000-4000-8000-000000000001","itemId":"00000000-0000-4000-8000-000000000001","itemName":"Nombre de ejemplo","amount":"valor-ejemplo","policyClauseReference":"valor-ejemplo","denialRationale":"valor-ejemplo"}]` |
| `insuranceSettlement.exclusions[].claimLineId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `insuranceSettlement.exclusions[].itemId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `insuranceSettlement.exclusions[].itemName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `insuranceSettlement.exclusions[].amount` | Sí | `string` | Sin restricción adicional declarada | Importe decimal exacto excluido | `valor-ejemplo` |
| `insuranceSettlement.exclusions[].policyClauseReference` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `insuranceSettlement.exclusions[].denialRationale` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `insuranceSettlementAvailability` | Sí | `string` | valores: `AVAILABLE`, `PENDING_PUBLICATION`, `UNDER_REVIEW`, `NOT_AVAILABLE` | Sin descripción específica en el contrato OpenAPI. | `AVAILABLE` |
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `InventoryConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `createdAt` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `expiresAt` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `siteId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `siteName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `pharmacyId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `pharmacyName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `medicationRequestId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `prescriber` | No | `PharmacyOrderPrescriberDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"name":"Nombre de ejemplo","specialty":"valor-ejemplo"}` |
| `prescriber.name` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `prescriber.specialty` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `patientName` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `deliveryMode` | No | `InventoryConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `deliveryMode.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `deliveryMode.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `deliveryAddressText` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `pickupCode` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `pharmacyPublicProfileId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `pharmacyPublicSlug` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `totalAmount` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `currency` | No | `InventoryConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `currency.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `currency.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `rejectionReasonText` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `substitutions` | Sí | `array<PharmacyOrderSubstitutionDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","originalProductId":"00000000-0000-4000-8000-000000000001","originalName":"Nombre de ejemplo","originalUnitPriceAmount":"valor-ejemplo","proposedProductId":"00000000-0000-4000-8000-000000000001","proposedName":"Nombre de ejemplo","proposedUnitPriceAmount":"valor-ejemplo","currency":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"decidedAt":"valor-ejemplo"}]` |
| `substitutions[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `substitutions[].originalProductId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `substitutions[].originalName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `substitutions[].originalUnitPriceAmount` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `substitutions[].proposedProductId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `substitutions[].proposedName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `substitutions[].proposedUnitPriceAmount` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `substitutions[].currency` | No | `InventoryConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `substitutions[].currency.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `substitutions[].currency.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `substitutions[].status` | Sí | `InventoryConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `substitutions[].status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `substitutions[].status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `substitutions[].decidedAt` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines` | Sí | `array<PharmacyOrderLineDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"productId":"00000000-0000-4000-8000-000000000001","medicationConceptId":"00000000-0000-4000-8000-000000000001","productCode":"CODIGO_EJEMPLO","brandName":"Nombre de ejemplo","genericName":"Nombre de ejemplo","strengthText":"valor-ejemplo","packageSizeText":"valor-ejemplo","medication":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"requestedQuantity":1,"reservedQuantity":1,"fulfilledQuantity":1,"unitPriceAmount":"valor-ejemplo","currency":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}}]` |
| `lines[].productId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `lines[].medicationConceptId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `lines[].productCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `lines[].brandName` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `lines[].genericName` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `lines[].strengthText` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines[].packageSizeText` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines[].medication` | No | `InventoryConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `lines[].medication.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `lines[].medication.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines[].requestedQuantity` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `lines[].reservedQuantity` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `lines[].fulfilledQuantity` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `lines[].unitPriceAmount` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines[].currency` | No | `InventoryConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `lines[].currency.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `lines[].currency.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines[].status` | Sí | `InventoryConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `lines[].status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `lines[].status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PATIENT. | Roles/tenant/guards de autorización |
| 422 | `PRECONDITION_FAILED` | La cuenta autenticada no tiene perfil de paciente | Excepción explícita en src/modules/pharmacy_inventory/application/pharmacy-orders/pharmacy-orders.use-cases.ts |
| 422 | `PRECONDITION_FAILED` | El pedido no tiene una decisión de sustituciones pendiente | Excepción explícita en src/modules/pharmacy_inventory/application/pharmacy-orders/pharmacy-orders.use-cases.ts |
| 422 | `PRECONDITION_FAILED` | El pedido no tiene propuestas de sustitución en pie | Excepción explícita en src/modules/pharmacy_inventory/application/pharmacy-orders/pharmacy-orders.use-cases.ts |
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

## 36. POST /pharmacy/orders/{id}/cancel

- **Módulo:** `pharmacy_inventory`
- **Etiqueta OpenAPI:** `pharmacy-orders`
- **Nombre:** Cancelar un pedido de farmacia (FAR-E1)
- **Operation ID:** `PharmacyOrdersController_cancel`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyOrdersController.cancel](../../src/modules/pharmacy_inventory/presentation/controllers/pharmacy-orders.controller.ts)

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
| 504 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PharmacyOrderDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "reservationLines": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "productId": "00000000-0000-4000-8000-000000000001",
      "quantity": "valor-ejemplo",
      "unitPriceAmount": "valor-ejemplo",
      "billedAmount": "valor-ejemplo",
      "currencyConceptId": "00000000-0000-4000-8000-000000000001"
    }
  ],
  "insuranceSettlement": {
    "claimId": "00000000-0000-4000-8000-000000000001",
    "claimIdentifier": "valor-ejemplo",
    "adjudicationVersionId": "00000000-0000-4000-8000-000000000001",
    "adjudicationVersion": 1,
    "eobId": "00000000-0000-4000-8000-000000000001",
    "carrierName": "Nombre de ejemplo",
    "policyIdentifier": "valor-ejemplo",
    "totalBilledAmount": "valor-ejemplo",
    "totalApprovedAmount": "valor-ejemplo",
    "totalPatientAmount": "valor-ejemplo",
    "totalDeniedAmount": "valor-ejemplo",
    "currencyCode": "BOB",
    "result": "APPROVED",
    "exclusions": [
      {
        "claimLineId": "00000000-0000-4000-8000-000000000001",
        "itemId": "00000000-0000-4000-8000-000000000001",
        "itemName": "Nombre de ejemplo",
        "amount": "valor-ejemplo",
        "policyClauseReference": "valor-ejemplo",
        "denialRationale": "valor-ejemplo"
      }
    ]
  },
  "insuranceSettlementAvailability": "AVAILABLE",
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
  "prescriber": {
    "name": "Nombre de ejemplo",
    "specialty": "valor-ejemplo"
  },
  "patientName": "Nombre de ejemplo",
  "deliveryMode": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "deliveryAddressText": "valor-ejemplo",
  "pickupCode": "CODIGO_EJEMPLO",
  "pharmacyPublicProfileId": "00000000-0000-4000-8000-000000000001",
  "pharmacyPublicSlug": "valor-ejemplo",
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
| `reservationLines` | Sí | `array<PharmacyOrderReservationLineDto>` | Sin restricción adicional declarada | Porciones confirmadas o entregadas vigentes para facturación | `[{"id":"00000000-0000-4000-8000-000000000001","productId":"00000000-0000-4000-8000-000000000001","quantity":"valor-ejemplo","unitPriceAmount":"valor-ejemplo","billedAmount":"valor-ejemplo","currencyConceptId":"00000000-0000-4000-8000-000000000001"}]` |
| `reservationLines[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `reservationLines[].productId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `reservationLines[].quantity` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `reservationLines[].unitPriceAmount` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `reservationLines[].billedAmount` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `reservationLines[].currencyConceptId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `insuranceSettlement` | Sí | `PatientInsuranceSettlementDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"claimId":"00000000-0000-4000-8000-000000000001","claimIdentifier":"valor-ejemplo","adjudicationVersionId":"00000000-0000-4000-8000-000000000001","adjudicationVersion":1,"eobId":"00000000-0000-4000-8000-000000000001","carrierName":"Nombre de ejemplo","policyIdentifier":"valor-ejemplo","totalBilledAmount":"valor-ejemplo","totalApprovedAmount":"valor-ejemplo","totalPatientAmount":"valor-ejemplo","totalDeniedAmount":"valor-ejemplo","currencyCode":"BOB","result":"APPROVED","exclusions":[{"claimLineId":"00000000-0000-4000-8000-000000000001","itemId":"00000000-0000-4000-8000-000000000001","itemName":"Nombre de ejemplo","amount":"valor-ejemplo","policyClauseReference":"valor-ejemplo","denialRationale":"valor-ejemplo"}]}` |
| `insuranceSettlement.claimId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `insuranceSettlement.claimIdentifier` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `insuranceSettlement.adjudicationVersionId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `insuranceSettlement.adjudicationVersion` | Sí | `number` | formato `int32`; mínimo 1 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `insuranceSettlement.eobId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `insuranceSettlement.carrierName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `insuranceSettlement.policyIdentifier` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `insuranceSettlement.totalBilledAmount` | Sí | `string` | Sin restricción adicional declarada | Total facturado, decimal exacto | `valor-ejemplo` |
| `insuranceSettlement.totalApprovedAmount` | Sí | `string` | Sin restricción adicional declarada | Aporte del seguro, decimal exacto | `valor-ejemplo` |
| `insuranceSettlement.totalPatientAmount` | Sí | `string` | Sin restricción adicional declarada | Cargo confirmado al paciente, decimal exacto | `valor-ejemplo` |
| `insuranceSettlement.totalDeniedAmount` | Sí | `string` | Sin restricción adicional declarada | Importe excluido sin asignar, decimal exacto | `valor-ejemplo` |
| `insuranceSettlement.currencyCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `BOB` |
| `insuranceSettlement.result` | Sí | `string` | valores: `APPROVED`, `PARTIALLY_APPROVED`, `DENIED` | Sin descripción específica en el contrato OpenAPI. | `APPROVED` |
| `insuranceSettlement.exclusions` | Sí | `array<PatientInsuranceSettlementExclusionDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"claimLineId":"00000000-0000-4000-8000-000000000001","itemId":"00000000-0000-4000-8000-000000000001","itemName":"Nombre de ejemplo","amount":"valor-ejemplo","policyClauseReference":"valor-ejemplo","denialRationale":"valor-ejemplo"}]` |
| `insuranceSettlement.exclusions[].claimLineId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `insuranceSettlement.exclusions[].itemId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `insuranceSettlement.exclusions[].itemName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `insuranceSettlement.exclusions[].amount` | Sí | `string` | Sin restricción adicional declarada | Importe decimal exacto excluido | `valor-ejemplo` |
| `insuranceSettlement.exclusions[].policyClauseReference` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `insuranceSettlement.exclusions[].denialRationale` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `insuranceSettlementAvailability` | Sí | `string` | valores: `AVAILABLE`, `PENDING_PUBLICATION`, `UNDER_REVIEW`, `NOT_AVAILABLE` | Sin descripción específica en el contrato OpenAPI. | `AVAILABLE` |
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `InventoryConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `createdAt` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `expiresAt` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `siteId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `siteName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `pharmacyId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `pharmacyName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `medicationRequestId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `prescriber` | No | `PharmacyOrderPrescriberDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"name":"Nombre de ejemplo","specialty":"valor-ejemplo"}` |
| `prescriber.name` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `prescriber.specialty` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `patientName` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `deliveryMode` | No | `InventoryConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `deliveryMode.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `deliveryMode.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `deliveryAddressText` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `pickupCode` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `pharmacyPublicProfileId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `pharmacyPublicSlug` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `totalAmount` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `currency` | No | `InventoryConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `currency.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `currency.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `rejectionReasonText` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `substitutions` | Sí | `array<PharmacyOrderSubstitutionDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","originalProductId":"00000000-0000-4000-8000-000000000001","originalName":"Nombre de ejemplo","originalUnitPriceAmount":"valor-ejemplo","proposedProductId":"00000000-0000-4000-8000-000000000001","proposedName":"Nombre de ejemplo","proposedUnitPriceAmount":"valor-ejemplo","currency":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"decidedAt":"valor-ejemplo"}]` |
| `substitutions[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `substitutions[].originalProductId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `substitutions[].originalName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `substitutions[].originalUnitPriceAmount` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `substitutions[].proposedProductId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `substitutions[].proposedName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `substitutions[].proposedUnitPriceAmount` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `substitutions[].currency` | No | `InventoryConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `substitutions[].currency.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `substitutions[].currency.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `substitutions[].status` | Sí | `InventoryConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `substitutions[].status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `substitutions[].status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `substitutions[].decidedAt` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines` | Sí | `array<PharmacyOrderLineDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"productId":"00000000-0000-4000-8000-000000000001","medicationConceptId":"00000000-0000-4000-8000-000000000001","productCode":"CODIGO_EJEMPLO","brandName":"Nombre de ejemplo","genericName":"Nombre de ejemplo","strengthText":"valor-ejemplo","packageSizeText":"valor-ejemplo","medication":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"requestedQuantity":1,"reservedQuantity":1,"fulfilledQuantity":1,"unitPriceAmount":"valor-ejemplo","currency":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}}]` |
| `lines[].productId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `lines[].medicationConceptId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `lines[].productCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `lines[].brandName` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `lines[].genericName` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `lines[].strengthText` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines[].packageSizeText` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines[].medication` | No | `InventoryConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `lines[].medication.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `lines[].medication.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines[].requestedQuantity` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `lines[].reservedQuantity` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `lines[].fulfilledQuantity` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `lines[].unitPriceAmount` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines[].currency` | No | `InventoryConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `lines[].currency.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `lines[].currency.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines[].status` | Sí | `InventoryConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `lines[].status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `lines[].status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PATIENT. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | El pedido ya está en un estado terminal y no puede cancelarse | Excepción explícita en src/modules/pharmacy_inventory/application/pharmacy-orders/pharmacy-orders.use-cases.ts |
| 422 | `PRECONDITION_FAILED` | La cuenta autenticada no tiene perfil de paciente | Excepción explícita en src/modules/pharmacy_inventory/application/pharmacy-orders/pharmacy-orders.use-cases.ts |
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

## 37. POST /pharmacy/orders/{id}/confirm

- **Módulo:** `pharmacy_inventory`
- **Etiqueta OpenAPI:** `pharmacy-orders`
- **Nombre:** Confirmar el pedido (FAR-E2)
- **Operation ID:** `PharmacyOrdersController_confirm`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyOrdersController.confirm](../../src/modules/pharmacy_inventory/presentation/controllers/pharmacy-orders.controller.ts)

### Descripción de negocio

Sella confirmed_at. Un ajuste NO_DISPONIBLE libera solo esa línea. PROPONER_GENERICO (con proposedProductId del mismo medicamento) persiste la propuesta con sus precios congelados y deja el pedido en ACEPTACION_PENDIENTE: decide el paciente. Una línea por confirmar (PINV_RES_LINE_PENDING_CONFIRMATION) se confirma con lo pedido, o con CONFIRMAR_STOCK y quantity (lo que la sede tiene para vender): se escribe la existencia de la sede y se reserva; con NO_DISPONIBLE o PROPONER_GENERICO queda sin stock. CONFIRMAR_STOCK sobre otra línea o sin quantity: 422 ORDER_LINE_NOT_PENDING_CONFIRMATION.

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
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PHARMACY_STAFF`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `adjustments` | No | `array<ConfirmOrderAdjustmentDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"productId":"00000000-0000-4000-8000-000000000001","decision":"NO_DISPONIBLE","proposedProductId":"00000000-0000-4000-8000-000000000001","quantity":1}]` |
| `adjustments[].productId` | No | `string` | formato `uuid` | Producto de la línea ajustada | `00000000-0000-4000-8000-000000000001` |
| `adjustments[].decision` | No | `string` | valores: `NO_DISPONIBLE`, `PROPONER_GENERICO`, `CONFIRMAR_STOCK` | Sin descripción específica en el contrato OpenAPI. | `NO_DISPONIBLE` |
| `adjustments[].proposedProductId` | No | `string` | formato `uuid` | Producto propuesto (mismo concepto del vademécum) | `00000000-0000-4000-8000-000000000001` |
| `adjustments[].quantity` | No | `number` | mínimo 1; máximo 1000000 | Unidades que la sede tiene para vender (con CONFIRMAR_STOCK, sobre una línea por confirmar) | `1` |

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
      "proposedProductId": "00000000-0000-4000-8000-000000000001",
      "quantity": 1
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
| 504 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PharmacyOrderDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "reservationLines": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "productId": "00000000-0000-4000-8000-000000000001",
      "quantity": "valor-ejemplo",
      "unitPriceAmount": "valor-ejemplo",
      "billedAmount": "valor-ejemplo",
      "currencyConceptId": "00000000-0000-4000-8000-000000000001"
    }
  ],
  "insuranceSettlement": {
    "claimId": "00000000-0000-4000-8000-000000000001",
    "claimIdentifier": "valor-ejemplo",
    "adjudicationVersionId": "00000000-0000-4000-8000-000000000001",
    "adjudicationVersion": 1,
    "eobId": "00000000-0000-4000-8000-000000000001",
    "carrierName": "Nombre de ejemplo",
    "policyIdentifier": "valor-ejemplo",
    "totalBilledAmount": "valor-ejemplo",
    "totalApprovedAmount": "valor-ejemplo",
    "totalPatientAmount": "valor-ejemplo",
    "totalDeniedAmount": "valor-ejemplo",
    "currencyCode": "BOB",
    "result": "APPROVED",
    "exclusions": [
      {
        "claimLineId": "00000000-0000-4000-8000-000000000001",
        "itemId": "00000000-0000-4000-8000-000000000001",
        "itemName": "Nombre de ejemplo",
        "amount": "valor-ejemplo",
        "policyClauseReference": "valor-ejemplo",
        "denialRationale": "valor-ejemplo"
      }
    ]
  },
  "insuranceSettlementAvailability": "AVAILABLE",
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
  "prescriber": {
    "name": "Nombre de ejemplo",
    "specialty": "valor-ejemplo"
  },
  "patientName": "Nombre de ejemplo",
  "deliveryMode": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "deliveryAddressText": "valor-ejemplo",
  "pickupCode": "CODIGO_EJEMPLO",
  "pharmacyPublicProfileId": "00000000-0000-4000-8000-000000000001",
  "pharmacyPublicSlug": "valor-ejemplo",
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
| `reservationLines` | Sí | `array<PharmacyOrderReservationLineDto>` | Sin restricción adicional declarada | Porciones confirmadas o entregadas vigentes para facturación | `[{"id":"00000000-0000-4000-8000-000000000001","productId":"00000000-0000-4000-8000-000000000001","quantity":"valor-ejemplo","unitPriceAmount":"valor-ejemplo","billedAmount":"valor-ejemplo","currencyConceptId":"00000000-0000-4000-8000-000000000001"}]` |
| `reservationLines[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `reservationLines[].productId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `reservationLines[].quantity` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `reservationLines[].unitPriceAmount` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `reservationLines[].billedAmount` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `reservationLines[].currencyConceptId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `insuranceSettlement` | Sí | `PatientInsuranceSettlementDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"claimId":"00000000-0000-4000-8000-000000000001","claimIdentifier":"valor-ejemplo","adjudicationVersionId":"00000000-0000-4000-8000-000000000001","adjudicationVersion":1,"eobId":"00000000-0000-4000-8000-000000000001","carrierName":"Nombre de ejemplo","policyIdentifier":"valor-ejemplo","totalBilledAmount":"valor-ejemplo","totalApprovedAmount":"valor-ejemplo","totalPatientAmount":"valor-ejemplo","totalDeniedAmount":"valor-ejemplo","currencyCode":"BOB","result":"APPROVED","exclusions":[{"claimLineId":"00000000-0000-4000-8000-000000000001","itemId":"00000000-0000-4000-8000-000000000001","itemName":"Nombre de ejemplo","amount":"valor-ejemplo","policyClauseReference":"valor-ejemplo","denialRationale":"valor-ejemplo"}]}` |
| `insuranceSettlement.claimId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `insuranceSettlement.claimIdentifier` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `insuranceSettlement.adjudicationVersionId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `insuranceSettlement.adjudicationVersion` | Sí | `number` | formato `int32`; mínimo 1 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `insuranceSettlement.eobId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `insuranceSettlement.carrierName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `insuranceSettlement.policyIdentifier` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `insuranceSettlement.totalBilledAmount` | Sí | `string` | Sin restricción adicional declarada | Total facturado, decimal exacto | `valor-ejemplo` |
| `insuranceSettlement.totalApprovedAmount` | Sí | `string` | Sin restricción adicional declarada | Aporte del seguro, decimal exacto | `valor-ejemplo` |
| `insuranceSettlement.totalPatientAmount` | Sí | `string` | Sin restricción adicional declarada | Cargo confirmado al paciente, decimal exacto | `valor-ejemplo` |
| `insuranceSettlement.totalDeniedAmount` | Sí | `string` | Sin restricción adicional declarada | Importe excluido sin asignar, decimal exacto | `valor-ejemplo` |
| `insuranceSettlement.currencyCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `BOB` |
| `insuranceSettlement.result` | Sí | `string` | valores: `APPROVED`, `PARTIALLY_APPROVED`, `DENIED` | Sin descripción específica en el contrato OpenAPI. | `APPROVED` |
| `insuranceSettlement.exclusions` | Sí | `array<PatientInsuranceSettlementExclusionDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"claimLineId":"00000000-0000-4000-8000-000000000001","itemId":"00000000-0000-4000-8000-000000000001","itemName":"Nombre de ejemplo","amount":"valor-ejemplo","policyClauseReference":"valor-ejemplo","denialRationale":"valor-ejemplo"}]` |
| `insuranceSettlement.exclusions[].claimLineId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `insuranceSettlement.exclusions[].itemId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `insuranceSettlement.exclusions[].itemName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `insuranceSettlement.exclusions[].amount` | Sí | `string` | Sin restricción adicional declarada | Importe decimal exacto excluido | `valor-ejemplo` |
| `insuranceSettlement.exclusions[].policyClauseReference` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `insuranceSettlement.exclusions[].denialRationale` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `insuranceSettlementAvailability` | Sí | `string` | valores: `AVAILABLE`, `PENDING_PUBLICATION`, `UNDER_REVIEW`, `NOT_AVAILABLE` | Sin descripción específica en el contrato OpenAPI. | `AVAILABLE` |
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `InventoryConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `createdAt` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `expiresAt` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `siteId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `siteName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `pharmacyId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `pharmacyName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `medicationRequestId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `prescriber` | No | `PharmacyOrderPrescriberDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"name":"Nombre de ejemplo","specialty":"valor-ejemplo"}` |
| `prescriber.name` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `prescriber.specialty` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `patientName` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `deliveryMode` | No | `InventoryConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `deliveryMode.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `deliveryMode.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `deliveryAddressText` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `pickupCode` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `pharmacyPublicProfileId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `pharmacyPublicSlug` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `totalAmount` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `currency` | No | `InventoryConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `currency.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `currency.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `rejectionReasonText` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `substitutions` | Sí | `array<PharmacyOrderSubstitutionDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","originalProductId":"00000000-0000-4000-8000-000000000001","originalName":"Nombre de ejemplo","originalUnitPriceAmount":"valor-ejemplo","proposedProductId":"00000000-0000-4000-8000-000000000001","proposedName":"Nombre de ejemplo","proposedUnitPriceAmount":"valor-ejemplo","currency":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"decidedAt":"valor-ejemplo"}]` |
| `substitutions[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `substitutions[].originalProductId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `substitutions[].originalName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `substitutions[].originalUnitPriceAmount` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `substitutions[].proposedProductId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `substitutions[].proposedName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `substitutions[].proposedUnitPriceAmount` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `substitutions[].currency` | No | `InventoryConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `substitutions[].currency.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `substitutions[].currency.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `substitutions[].status` | Sí | `InventoryConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `substitutions[].status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `substitutions[].status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `substitutions[].decidedAt` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines` | Sí | `array<PharmacyOrderLineDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"productId":"00000000-0000-4000-8000-000000000001","medicationConceptId":"00000000-0000-4000-8000-000000000001","productCode":"CODIGO_EJEMPLO","brandName":"Nombre de ejemplo","genericName":"Nombre de ejemplo","strengthText":"valor-ejemplo","packageSizeText":"valor-ejemplo","medication":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"requestedQuantity":1,"reservedQuantity":1,"fulfilledQuantity":1,"unitPriceAmount":"valor-ejemplo","currency":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}}]` |
| `lines[].productId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `lines[].medicationConceptId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `lines[].productCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `lines[].brandName` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `lines[].genericName` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `lines[].strengthText` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines[].packageSizeText` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines[].medication` | No | `InventoryConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `lines[].medication.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `lines[].medication.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines[].requestedQuantity` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `lines[].reservedQuantity` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `lines[].fulfilledQuantity` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `lines[].unitPriceAmount` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines[].currency` | No | `InventoryConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `lines[].currency.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `lines[].currency.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines[].status` | Sí | `InventoryConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `lines[].status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `lines[].status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, PHARMACY_STAFF. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El ajuste refiere un producto que no está en el pedido | Excepción explícita en src/modules/pharmacy_inventory/application/pharmacy-orders/pharmacy-orders.use-cases.ts |
| 422 | `PRECONDITION_FAILED` | Hay más de un ajuste para el mismo renglón | Excepción explícita en src/modules/pharmacy_inventory/application/pharmacy-orders/pharmacy-orders.use-cases.ts |
| 422 | `PRECONDITION_FAILED` | La transición no es legal para el estado actual del pedido | Excepción explícita en src/modules/pharmacy_inventory/application/pharmacy-orders/pharmacy-orders.use-cases.ts |
| 422 | `PRECONDITION_FAILED` | PROPONER_GENERICO exige el producto propuesto (proposedProductId) | Excepción explícita en src/modules/pharmacy_inventory/application/pharmacy-orders/pharmacy-orders.use-cases.ts |
| 422 | `PRECONDITION_FAILED` | El producto propuesto no está disponible en esta farmacia | Excepción explícita en src/modules/pharmacy_inventory/application/pharmacy-orders/pharmacy-orders.use-cases.ts |
| 422 | `PRECONDITION_FAILED` | El producto propuesto no es del mismo medicamento que el original | Excepción explícita en src/modules/pharmacy_inventory/application/pharmacy-orders/pharmacy-orders.use-cases.ts |
| 422 | `PRECONDITION_FAILED` | La sucursal lleva este producto por lotes: su existencia cambia con recepciones y conteos | Excepción explícita en src/modules/pharmacy_inventory/application/pharmacy-orders/pending-order-lines.ts |
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

## 38. POST /pharmacy/orders/{id}/conversation

- **Módulo:** `pharmacy_inventory`
- **Etiqueta OpenAPI:** `pharmacy-orders`
- **Nombre:** Abrir el chat del pedido con la farmacia
- **Operation ID:** `PharmacyOrdersController_openConversation`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyOrdersController.openConversation](../../src/modules/pharmacy_inventory/presentation/controllers/pharmacy-orders.controller.ts)

### Descripción de negocio

Idempotente: devuelve el mismo hilo directo entre el paciente titular y la vitrina pública de la farmacia. Lo piden el titular o el personal (PHARMACY_STAFF con membresía activa) de la farmacia del pedido; cualquier tercero recibe 404. 422 con reason ORGANIZATION_CHAT_PROFILE_UNAVAILABLE (farmacia sin vitrina activa/verificada), PATIENT_CHAT_PROFILE_MISSING (paciente sin perfil comunitario; no se crea) o bloqueo entre perfiles.

Contexto declarado en el controlador: El chat del pedido: abre o reutiliza el hilo paciente ↔ vitrina de la farmacia. Titular o personal de la farmacia del pedido; terceros: 404. La autorización por recurso vive en el servicio (como `GET :id`).

### Descripción del sistema

NestJS resuelve `POST /pharmacy/orders/{id}/conversation` en `PharmacyOrdersController_openConversation`. El controlador delega en `PharmacyOrdersService.openConversation`. No recibe body. El tipo de retorno estático es `Promise<PharmacyOrderConversationDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /pharmacy/orders/00000000-0000-4000-8000-000000000001/conversation HTTP/1.1
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
POST /pharmacy/orders/00000000-0000-4000-8000-000000000001/conversation HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PharmacyOrderConversationDto>` | Sí |
| 400 | Operación completada correctamente. | `Promise<PharmacyOrderConversationDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PharmacyOrderConversationDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PharmacyOrderConversationDto>` | No |
| 404 | Operación completada correctamente. | `Promise<PharmacyOrderConversationDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PharmacyOrderConversationDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PharmacyOrderConversationDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PharmacyOrderConversationDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PharmacyOrderConversationDto>` | No |
| 504 | Operación completada correctamente. | `Promise<PharmacyOrderConversationDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PharmacyOrderConversationDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "conversationId": "00000000-0000-4000-8000-000000000001",
  "pharmacyProfileId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `conversationId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `pharmacyProfileId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 422 | `PRECONDITION_FAILED` | El paciente todavía no tiene un perfil con el que conversar | Excepción explícita en src/modules/pharmacy_inventory/application/pharmacy-orders/pharmacy-orders.use-cases.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pharmacy/orders/{id}/conversation"
}
```

---

## 39. POST /pharmacy/orders/{id}/dispense

- **Módulo:** `pharmacy_inventory`
- **Etiqueta OpenAPI:** `pharmacy-orders`
- **Nombre:** Dispensar el pedido en el mostrador (FAR-E3)
- **Operation ID:** `PharmacyOrdersController_dispense`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyOrdersController.dispense](../../src/modules/pharmacy_inventory/presentation/controllers/pharmacy-orders.controller.ts)

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
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PHARMACY_STAFF`.
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
| 504 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PharmacyOrderDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "reservationLines": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "productId": "00000000-0000-4000-8000-000000000001",
      "quantity": "valor-ejemplo",
      "unitPriceAmount": "valor-ejemplo",
      "billedAmount": "valor-ejemplo",
      "currencyConceptId": "00000000-0000-4000-8000-000000000001"
    }
  ],
  "insuranceSettlement": {
    "claimId": "00000000-0000-4000-8000-000000000001",
    "claimIdentifier": "valor-ejemplo",
    "adjudicationVersionId": "00000000-0000-4000-8000-000000000001",
    "adjudicationVersion": 1,
    "eobId": "00000000-0000-4000-8000-000000000001",
    "carrierName": "Nombre de ejemplo",
    "policyIdentifier": "valor-ejemplo",
    "totalBilledAmount": "valor-ejemplo",
    "totalApprovedAmount": "valor-ejemplo",
    "totalPatientAmount": "valor-ejemplo",
    "totalDeniedAmount": "valor-ejemplo",
    "currencyCode": "BOB",
    "result": "APPROVED",
    "exclusions": [
      {
        "claimLineId": "00000000-0000-4000-8000-000000000001",
        "itemId": "00000000-0000-4000-8000-000000000001",
        "itemName": "Nombre de ejemplo",
        "amount": "valor-ejemplo",
        "policyClauseReference": "valor-ejemplo",
        "denialRationale": "valor-ejemplo"
      }
    ]
  },
  "insuranceSettlementAvailability": "AVAILABLE",
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
  "prescriber": {
    "name": "Nombre de ejemplo",
    "specialty": "valor-ejemplo"
  },
  "patientName": "Nombre de ejemplo",
  "deliveryMode": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "deliveryAddressText": "valor-ejemplo",
  "pickupCode": "CODIGO_EJEMPLO",
  "pharmacyPublicProfileId": "00000000-0000-4000-8000-000000000001",
  "pharmacyPublicSlug": "valor-ejemplo",
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
| `reservationLines` | Sí | `array<PharmacyOrderReservationLineDto>` | Sin restricción adicional declarada | Porciones confirmadas o entregadas vigentes para facturación | `[{"id":"00000000-0000-4000-8000-000000000001","productId":"00000000-0000-4000-8000-000000000001","quantity":"valor-ejemplo","unitPriceAmount":"valor-ejemplo","billedAmount":"valor-ejemplo","currencyConceptId":"00000000-0000-4000-8000-000000000001"}]` |
| `reservationLines[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `reservationLines[].productId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `reservationLines[].quantity` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `reservationLines[].unitPriceAmount` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `reservationLines[].billedAmount` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `reservationLines[].currencyConceptId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `insuranceSettlement` | Sí | `PatientInsuranceSettlementDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"claimId":"00000000-0000-4000-8000-000000000001","claimIdentifier":"valor-ejemplo","adjudicationVersionId":"00000000-0000-4000-8000-000000000001","adjudicationVersion":1,"eobId":"00000000-0000-4000-8000-000000000001","carrierName":"Nombre de ejemplo","policyIdentifier":"valor-ejemplo","totalBilledAmount":"valor-ejemplo","totalApprovedAmount":"valor-ejemplo","totalPatientAmount":"valor-ejemplo","totalDeniedAmount":"valor-ejemplo","currencyCode":"BOB","result":"APPROVED","exclusions":[{"claimLineId":"00000000-0000-4000-8000-000000000001","itemId":"00000000-0000-4000-8000-000000000001","itemName":"Nombre de ejemplo","amount":"valor-ejemplo","policyClauseReference":"valor-ejemplo","denialRationale":"valor-ejemplo"}]}` |
| `insuranceSettlement.claimId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `insuranceSettlement.claimIdentifier` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `insuranceSettlement.adjudicationVersionId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `insuranceSettlement.adjudicationVersion` | Sí | `number` | formato `int32`; mínimo 1 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `insuranceSettlement.eobId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `insuranceSettlement.carrierName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `insuranceSettlement.policyIdentifier` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `insuranceSettlement.totalBilledAmount` | Sí | `string` | Sin restricción adicional declarada | Total facturado, decimal exacto | `valor-ejemplo` |
| `insuranceSettlement.totalApprovedAmount` | Sí | `string` | Sin restricción adicional declarada | Aporte del seguro, decimal exacto | `valor-ejemplo` |
| `insuranceSettlement.totalPatientAmount` | Sí | `string` | Sin restricción adicional declarada | Cargo confirmado al paciente, decimal exacto | `valor-ejemplo` |
| `insuranceSettlement.totalDeniedAmount` | Sí | `string` | Sin restricción adicional declarada | Importe excluido sin asignar, decimal exacto | `valor-ejemplo` |
| `insuranceSettlement.currencyCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `BOB` |
| `insuranceSettlement.result` | Sí | `string` | valores: `APPROVED`, `PARTIALLY_APPROVED`, `DENIED` | Sin descripción específica en el contrato OpenAPI. | `APPROVED` |
| `insuranceSettlement.exclusions` | Sí | `array<PatientInsuranceSettlementExclusionDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"claimLineId":"00000000-0000-4000-8000-000000000001","itemId":"00000000-0000-4000-8000-000000000001","itemName":"Nombre de ejemplo","amount":"valor-ejemplo","policyClauseReference":"valor-ejemplo","denialRationale":"valor-ejemplo"}]` |
| `insuranceSettlement.exclusions[].claimLineId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `insuranceSettlement.exclusions[].itemId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `insuranceSettlement.exclusions[].itemName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `insuranceSettlement.exclusions[].amount` | Sí | `string` | Sin restricción adicional declarada | Importe decimal exacto excluido | `valor-ejemplo` |
| `insuranceSettlement.exclusions[].policyClauseReference` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `insuranceSettlement.exclusions[].denialRationale` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `insuranceSettlementAvailability` | Sí | `string` | valores: `AVAILABLE`, `PENDING_PUBLICATION`, `UNDER_REVIEW`, `NOT_AVAILABLE` | Sin descripción específica en el contrato OpenAPI. | `AVAILABLE` |
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `InventoryConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `createdAt` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `expiresAt` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `siteId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `siteName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `pharmacyId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `pharmacyName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `medicationRequestId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `prescriber` | No | `PharmacyOrderPrescriberDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"name":"Nombre de ejemplo","specialty":"valor-ejemplo"}` |
| `prescriber.name` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `prescriber.specialty` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `patientName` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `deliveryMode` | No | `InventoryConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `deliveryMode.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `deliveryMode.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `deliveryAddressText` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `pickupCode` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `pharmacyPublicProfileId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `pharmacyPublicSlug` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `totalAmount` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `currency` | No | `InventoryConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `currency.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `currency.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `rejectionReasonText` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `substitutions` | Sí | `array<PharmacyOrderSubstitutionDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","originalProductId":"00000000-0000-4000-8000-000000000001","originalName":"Nombre de ejemplo","originalUnitPriceAmount":"valor-ejemplo","proposedProductId":"00000000-0000-4000-8000-000000000001","proposedName":"Nombre de ejemplo","proposedUnitPriceAmount":"valor-ejemplo","currency":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"decidedAt":"valor-ejemplo"}]` |
| `substitutions[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `substitutions[].originalProductId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `substitutions[].originalName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `substitutions[].originalUnitPriceAmount` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `substitutions[].proposedProductId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `substitutions[].proposedName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `substitutions[].proposedUnitPriceAmount` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `substitutions[].currency` | No | `InventoryConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `substitutions[].currency.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `substitutions[].currency.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `substitutions[].status` | Sí | `InventoryConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `substitutions[].status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `substitutions[].status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `substitutions[].decidedAt` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines` | Sí | `array<PharmacyOrderLineDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"productId":"00000000-0000-4000-8000-000000000001","medicationConceptId":"00000000-0000-4000-8000-000000000001","productCode":"CODIGO_EJEMPLO","brandName":"Nombre de ejemplo","genericName":"Nombre de ejemplo","strengthText":"valor-ejemplo","packageSizeText":"valor-ejemplo","medication":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"requestedQuantity":1,"reservedQuantity":1,"fulfilledQuantity":1,"unitPriceAmount":"valor-ejemplo","currency":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}}]` |
| `lines[].productId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `lines[].medicationConceptId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `lines[].productCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `lines[].brandName` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `lines[].genericName` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `lines[].strengthText` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines[].packageSizeText` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines[].medication` | No | `InventoryConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `lines[].medication.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `lines[].medication.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines[].requestedQuantity` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `lines[].reservedQuantity` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `lines[].fulfilledQuantity` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `lines[].unitPriceAmount` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines[].currency` | No | `InventoryConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `lines[].currency.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `lines[].currency.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines[].status` | Sí | `InventoryConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `lines[].status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `lines[].status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, PHARMACY_STAFF. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | La clave de idempotencia ya se usó para otra entrega | Excepción explícita en src/modules/pharmacy_inventory/application/pharmacy-orders/pharmacy-orders.use-cases.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Solo un pedido listo para retiro puede dispensarse | Excepción explícita en src/modules/pharmacy_inventory/application/pharmacy-orders/pharmacy-orders.use-cases.ts |
| 422 | `PRECONDITION_FAILED` | El código de retiro no coincide. El pedido no se modificó. | Excepción explícita en src/modules/pharmacy_inventory/application/pharmacy-orders/pharmacy-orders.use-cases.ts |
| 422 | `PRECONDITION_FAILED` | La entrega refiere productos sin saldo en pie en este pedido | Excepción explícita en src/modules/pharmacy_inventory/application/pharmacy-orders/pharmacy-orders.use-cases.ts |
| 422 | `PRECONDITION_FAILED` | El pedido no tiene saldo en pie que entregar | Excepción explícita en src/modules/pharmacy_inventory/application/pharmacy-orders/pharmacy-orders.use-cases.ts |
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

## 40. POST /pharmacy/orders/{id}/prefer-original

- **Módulo:** `pharmacy_inventory`
- **Etiqueta OpenAPI:** `pharmacy-orders`
- **Nombre:** Preferir los productos originales (paciente)
- **Operation ID:** `PharmacyOrdersController_preferOriginal`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyOrdersController.preferOriginal](../../src/modules/pharmacy_inventory/presentation/controllers/pharmacy-orders.controller.ts)

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
| 504 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PharmacyOrderDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "reservationLines": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "productId": "00000000-0000-4000-8000-000000000001",
      "quantity": "valor-ejemplo",
      "unitPriceAmount": "valor-ejemplo",
      "billedAmount": "valor-ejemplo",
      "currencyConceptId": "00000000-0000-4000-8000-000000000001"
    }
  ],
  "insuranceSettlement": {
    "claimId": "00000000-0000-4000-8000-000000000001",
    "claimIdentifier": "valor-ejemplo",
    "adjudicationVersionId": "00000000-0000-4000-8000-000000000001",
    "adjudicationVersion": 1,
    "eobId": "00000000-0000-4000-8000-000000000001",
    "carrierName": "Nombre de ejemplo",
    "policyIdentifier": "valor-ejemplo",
    "totalBilledAmount": "valor-ejemplo",
    "totalApprovedAmount": "valor-ejemplo",
    "totalPatientAmount": "valor-ejemplo",
    "totalDeniedAmount": "valor-ejemplo",
    "currencyCode": "BOB",
    "result": "APPROVED",
    "exclusions": [
      {
        "claimLineId": "00000000-0000-4000-8000-000000000001",
        "itemId": "00000000-0000-4000-8000-000000000001",
        "itemName": "Nombre de ejemplo",
        "amount": "valor-ejemplo",
        "policyClauseReference": "valor-ejemplo",
        "denialRationale": "valor-ejemplo"
      }
    ]
  },
  "insuranceSettlementAvailability": "AVAILABLE",
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
  "prescriber": {
    "name": "Nombre de ejemplo",
    "specialty": "valor-ejemplo"
  },
  "patientName": "Nombre de ejemplo",
  "deliveryMode": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "deliveryAddressText": "valor-ejemplo",
  "pickupCode": "CODIGO_EJEMPLO",
  "pharmacyPublicProfileId": "00000000-0000-4000-8000-000000000001",
  "pharmacyPublicSlug": "valor-ejemplo",
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
| `reservationLines` | Sí | `array<PharmacyOrderReservationLineDto>` | Sin restricción adicional declarada | Porciones confirmadas o entregadas vigentes para facturación | `[{"id":"00000000-0000-4000-8000-000000000001","productId":"00000000-0000-4000-8000-000000000001","quantity":"valor-ejemplo","unitPriceAmount":"valor-ejemplo","billedAmount":"valor-ejemplo","currencyConceptId":"00000000-0000-4000-8000-000000000001"}]` |
| `reservationLines[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `reservationLines[].productId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `reservationLines[].quantity` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `reservationLines[].unitPriceAmount` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `reservationLines[].billedAmount` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `reservationLines[].currencyConceptId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `insuranceSettlement` | Sí | `PatientInsuranceSettlementDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"claimId":"00000000-0000-4000-8000-000000000001","claimIdentifier":"valor-ejemplo","adjudicationVersionId":"00000000-0000-4000-8000-000000000001","adjudicationVersion":1,"eobId":"00000000-0000-4000-8000-000000000001","carrierName":"Nombre de ejemplo","policyIdentifier":"valor-ejemplo","totalBilledAmount":"valor-ejemplo","totalApprovedAmount":"valor-ejemplo","totalPatientAmount":"valor-ejemplo","totalDeniedAmount":"valor-ejemplo","currencyCode":"BOB","result":"APPROVED","exclusions":[{"claimLineId":"00000000-0000-4000-8000-000000000001","itemId":"00000000-0000-4000-8000-000000000001","itemName":"Nombre de ejemplo","amount":"valor-ejemplo","policyClauseReference":"valor-ejemplo","denialRationale":"valor-ejemplo"}]}` |
| `insuranceSettlement.claimId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `insuranceSettlement.claimIdentifier` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `insuranceSettlement.adjudicationVersionId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `insuranceSettlement.adjudicationVersion` | Sí | `number` | formato `int32`; mínimo 1 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `insuranceSettlement.eobId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `insuranceSettlement.carrierName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `insuranceSettlement.policyIdentifier` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `insuranceSettlement.totalBilledAmount` | Sí | `string` | Sin restricción adicional declarada | Total facturado, decimal exacto | `valor-ejemplo` |
| `insuranceSettlement.totalApprovedAmount` | Sí | `string` | Sin restricción adicional declarada | Aporte del seguro, decimal exacto | `valor-ejemplo` |
| `insuranceSettlement.totalPatientAmount` | Sí | `string` | Sin restricción adicional declarada | Cargo confirmado al paciente, decimal exacto | `valor-ejemplo` |
| `insuranceSettlement.totalDeniedAmount` | Sí | `string` | Sin restricción adicional declarada | Importe excluido sin asignar, decimal exacto | `valor-ejemplo` |
| `insuranceSettlement.currencyCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `BOB` |
| `insuranceSettlement.result` | Sí | `string` | valores: `APPROVED`, `PARTIALLY_APPROVED`, `DENIED` | Sin descripción específica en el contrato OpenAPI. | `APPROVED` |
| `insuranceSettlement.exclusions` | Sí | `array<PatientInsuranceSettlementExclusionDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"claimLineId":"00000000-0000-4000-8000-000000000001","itemId":"00000000-0000-4000-8000-000000000001","itemName":"Nombre de ejemplo","amount":"valor-ejemplo","policyClauseReference":"valor-ejemplo","denialRationale":"valor-ejemplo"}]` |
| `insuranceSettlement.exclusions[].claimLineId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `insuranceSettlement.exclusions[].itemId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `insuranceSettlement.exclusions[].itemName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `insuranceSettlement.exclusions[].amount` | Sí | `string` | Sin restricción adicional declarada | Importe decimal exacto excluido | `valor-ejemplo` |
| `insuranceSettlement.exclusions[].policyClauseReference` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `insuranceSettlement.exclusions[].denialRationale` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `insuranceSettlementAvailability` | Sí | `string` | valores: `AVAILABLE`, `PENDING_PUBLICATION`, `UNDER_REVIEW`, `NOT_AVAILABLE` | Sin descripción específica en el contrato OpenAPI. | `AVAILABLE` |
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `InventoryConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `createdAt` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `expiresAt` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `siteId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `siteName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `pharmacyId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `pharmacyName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `medicationRequestId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `prescriber` | No | `PharmacyOrderPrescriberDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"name":"Nombre de ejemplo","specialty":"valor-ejemplo"}` |
| `prescriber.name` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `prescriber.specialty` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `patientName` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `deliveryMode` | No | `InventoryConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `deliveryMode.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `deliveryMode.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `deliveryAddressText` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `pickupCode` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `pharmacyPublicProfileId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `pharmacyPublicSlug` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `totalAmount` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `currency` | No | `InventoryConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `currency.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `currency.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `rejectionReasonText` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `substitutions` | Sí | `array<PharmacyOrderSubstitutionDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","originalProductId":"00000000-0000-4000-8000-000000000001","originalName":"Nombre de ejemplo","originalUnitPriceAmount":"valor-ejemplo","proposedProductId":"00000000-0000-4000-8000-000000000001","proposedName":"Nombre de ejemplo","proposedUnitPriceAmount":"valor-ejemplo","currency":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"decidedAt":"valor-ejemplo"}]` |
| `substitutions[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `substitutions[].originalProductId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `substitutions[].originalName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `substitutions[].originalUnitPriceAmount` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `substitutions[].proposedProductId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `substitutions[].proposedName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `substitutions[].proposedUnitPriceAmount` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `substitutions[].currency` | No | `InventoryConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `substitutions[].currency.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `substitutions[].currency.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `substitutions[].status` | Sí | `InventoryConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `substitutions[].status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `substitutions[].status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `substitutions[].decidedAt` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines` | Sí | `array<PharmacyOrderLineDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"productId":"00000000-0000-4000-8000-000000000001","medicationConceptId":"00000000-0000-4000-8000-000000000001","productCode":"CODIGO_EJEMPLO","brandName":"Nombre de ejemplo","genericName":"Nombre de ejemplo","strengthText":"valor-ejemplo","packageSizeText":"valor-ejemplo","medication":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"requestedQuantity":1,"reservedQuantity":1,"fulfilledQuantity":1,"unitPriceAmount":"valor-ejemplo","currency":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}}]` |
| `lines[].productId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `lines[].medicationConceptId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `lines[].productCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `lines[].brandName` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `lines[].genericName` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `lines[].strengthText` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines[].packageSizeText` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines[].medication` | No | `InventoryConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `lines[].medication.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `lines[].medication.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines[].requestedQuantity` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `lines[].reservedQuantity` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `lines[].fulfilledQuantity` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `lines[].unitPriceAmount` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines[].currency` | No | `InventoryConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `lines[].currency.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `lines[].currency.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines[].status` | Sí | `InventoryConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `lines[].status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `lines[].status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PATIENT. | Roles/tenant/guards de autorización |
| 422 | `PRECONDITION_FAILED` | La cuenta autenticada no tiene perfil de paciente | Excepción explícita en src/modules/pharmacy_inventory/application/pharmacy-orders/pharmacy-orders.use-cases.ts |
| 422 | `PRECONDITION_FAILED` | El pedido no tiene una decisión de sustituciones pendiente | Excepción explícita en src/modules/pharmacy_inventory/application/pharmacy-orders/pharmacy-orders.use-cases.ts |
| 422 | `PRECONDITION_FAILED` | El pedido no tiene propuestas de sustitución en pie | Excepción explícita en src/modules/pharmacy_inventory/application/pharmacy-orders/pharmacy-orders.use-cases.ts |
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

## 41. POST /pharmacy/orders/{id}/ready

- **Módulo:** `pharmacy_inventory`
- **Etiqueta OpenAPI:** `pharmacy-orders`
- **Nombre:** Marcar el pedido listo para retiro (FAR-E2/E3)
- **Operation ID:** `PharmacyOrdersController_ready`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyOrdersController.ready](../../src/modules/pharmacy_inventory/presentation/controllers/pharmacy-orders.controller.ts)

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
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PHARMACY_STAFF`.
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
| 504 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PharmacyOrderDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "reservationLines": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "productId": "00000000-0000-4000-8000-000000000001",
      "quantity": "valor-ejemplo",
      "unitPriceAmount": "valor-ejemplo",
      "billedAmount": "valor-ejemplo",
      "currencyConceptId": "00000000-0000-4000-8000-000000000001"
    }
  ],
  "insuranceSettlement": {
    "claimId": "00000000-0000-4000-8000-000000000001",
    "claimIdentifier": "valor-ejemplo",
    "adjudicationVersionId": "00000000-0000-4000-8000-000000000001",
    "adjudicationVersion": 1,
    "eobId": "00000000-0000-4000-8000-000000000001",
    "carrierName": "Nombre de ejemplo",
    "policyIdentifier": "valor-ejemplo",
    "totalBilledAmount": "valor-ejemplo",
    "totalApprovedAmount": "valor-ejemplo",
    "totalPatientAmount": "valor-ejemplo",
    "totalDeniedAmount": "valor-ejemplo",
    "currencyCode": "BOB",
    "result": "APPROVED",
    "exclusions": [
      {
        "claimLineId": "00000000-0000-4000-8000-000000000001",
        "itemId": "00000000-0000-4000-8000-000000000001",
        "itemName": "Nombre de ejemplo",
        "amount": "valor-ejemplo",
        "policyClauseReference": "valor-ejemplo",
        "denialRationale": "valor-ejemplo"
      }
    ]
  },
  "insuranceSettlementAvailability": "AVAILABLE",
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
  "prescriber": {
    "name": "Nombre de ejemplo",
    "specialty": "valor-ejemplo"
  },
  "patientName": "Nombre de ejemplo",
  "deliveryMode": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "deliveryAddressText": "valor-ejemplo",
  "pickupCode": "CODIGO_EJEMPLO",
  "pharmacyPublicProfileId": "00000000-0000-4000-8000-000000000001",
  "pharmacyPublicSlug": "valor-ejemplo",
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
| `reservationLines` | Sí | `array<PharmacyOrderReservationLineDto>` | Sin restricción adicional declarada | Porciones confirmadas o entregadas vigentes para facturación | `[{"id":"00000000-0000-4000-8000-000000000001","productId":"00000000-0000-4000-8000-000000000001","quantity":"valor-ejemplo","unitPriceAmount":"valor-ejemplo","billedAmount":"valor-ejemplo","currencyConceptId":"00000000-0000-4000-8000-000000000001"}]` |
| `reservationLines[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `reservationLines[].productId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `reservationLines[].quantity` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `reservationLines[].unitPriceAmount` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `reservationLines[].billedAmount` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `reservationLines[].currencyConceptId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `insuranceSettlement` | Sí | `PatientInsuranceSettlementDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"claimId":"00000000-0000-4000-8000-000000000001","claimIdentifier":"valor-ejemplo","adjudicationVersionId":"00000000-0000-4000-8000-000000000001","adjudicationVersion":1,"eobId":"00000000-0000-4000-8000-000000000001","carrierName":"Nombre de ejemplo","policyIdentifier":"valor-ejemplo","totalBilledAmount":"valor-ejemplo","totalApprovedAmount":"valor-ejemplo","totalPatientAmount":"valor-ejemplo","totalDeniedAmount":"valor-ejemplo","currencyCode":"BOB","result":"APPROVED","exclusions":[{"claimLineId":"00000000-0000-4000-8000-000000000001","itemId":"00000000-0000-4000-8000-000000000001","itemName":"Nombre de ejemplo","amount":"valor-ejemplo","policyClauseReference":"valor-ejemplo","denialRationale":"valor-ejemplo"}]}` |
| `insuranceSettlement.claimId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `insuranceSettlement.claimIdentifier` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `insuranceSettlement.adjudicationVersionId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `insuranceSettlement.adjudicationVersion` | Sí | `number` | formato `int32`; mínimo 1 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `insuranceSettlement.eobId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `insuranceSettlement.carrierName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `insuranceSettlement.policyIdentifier` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `insuranceSettlement.totalBilledAmount` | Sí | `string` | Sin restricción adicional declarada | Total facturado, decimal exacto | `valor-ejemplo` |
| `insuranceSettlement.totalApprovedAmount` | Sí | `string` | Sin restricción adicional declarada | Aporte del seguro, decimal exacto | `valor-ejemplo` |
| `insuranceSettlement.totalPatientAmount` | Sí | `string` | Sin restricción adicional declarada | Cargo confirmado al paciente, decimal exacto | `valor-ejemplo` |
| `insuranceSettlement.totalDeniedAmount` | Sí | `string` | Sin restricción adicional declarada | Importe excluido sin asignar, decimal exacto | `valor-ejemplo` |
| `insuranceSettlement.currencyCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `BOB` |
| `insuranceSettlement.result` | Sí | `string` | valores: `APPROVED`, `PARTIALLY_APPROVED`, `DENIED` | Sin descripción específica en el contrato OpenAPI. | `APPROVED` |
| `insuranceSettlement.exclusions` | Sí | `array<PatientInsuranceSettlementExclusionDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"claimLineId":"00000000-0000-4000-8000-000000000001","itemId":"00000000-0000-4000-8000-000000000001","itemName":"Nombre de ejemplo","amount":"valor-ejemplo","policyClauseReference":"valor-ejemplo","denialRationale":"valor-ejemplo"}]` |
| `insuranceSettlement.exclusions[].claimLineId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `insuranceSettlement.exclusions[].itemId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `insuranceSettlement.exclusions[].itemName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `insuranceSettlement.exclusions[].amount` | Sí | `string` | Sin restricción adicional declarada | Importe decimal exacto excluido | `valor-ejemplo` |
| `insuranceSettlement.exclusions[].policyClauseReference` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `insuranceSettlement.exclusions[].denialRationale` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `insuranceSettlementAvailability` | Sí | `string` | valores: `AVAILABLE`, `PENDING_PUBLICATION`, `UNDER_REVIEW`, `NOT_AVAILABLE` | Sin descripción específica en el contrato OpenAPI. | `AVAILABLE` |
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `InventoryConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `createdAt` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `expiresAt` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `siteId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `siteName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `pharmacyId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `pharmacyName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `medicationRequestId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `prescriber` | No | `PharmacyOrderPrescriberDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"name":"Nombre de ejemplo","specialty":"valor-ejemplo"}` |
| `prescriber.name` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `prescriber.specialty` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `patientName` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `deliveryMode` | No | `InventoryConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `deliveryMode.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `deliveryMode.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `deliveryAddressText` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `pickupCode` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `pharmacyPublicProfileId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `pharmacyPublicSlug` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `totalAmount` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `currency` | No | `InventoryConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `currency.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `currency.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `rejectionReasonText` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `substitutions` | Sí | `array<PharmacyOrderSubstitutionDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","originalProductId":"00000000-0000-4000-8000-000000000001","originalName":"Nombre de ejemplo","originalUnitPriceAmount":"valor-ejemplo","proposedProductId":"00000000-0000-4000-8000-000000000001","proposedName":"Nombre de ejemplo","proposedUnitPriceAmount":"valor-ejemplo","currency":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"decidedAt":"valor-ejemplo"}]` |
| `substitutions[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `substitutions[].originalProductId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `substitutions[].originalName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `substitutions[].originalUnitPriceAmount` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `substitutions[].proposedProductId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `substitutions[].proposedName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `substitutions[].proposedUnitPriceAmount` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `substitutions[].currency` | No | `InventoryConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `substitutions[].currency.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `substitutions[].currency.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `substitutions[].status` | Sí | `InventoryConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `substitutions[].status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `substitutions[].status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `substitutions[].decidedAt` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines` | Sí | `array<PharmacyOrderLineDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"productId":"00000000-0000-4000-8000-000000000001","medicationConceptId":"00000000-0000-4000-8000-000000000001","productCode":"CODIGO_EJEMPLO","brandName":"Nombre de ejemplo","genericName":"Nombre de ejemplo","strengthText":"valor-ejemplo","packageSizeText":"valor-ejemplo","medication":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"requestedQuantity":1,"reservedQuantity":1,"fulfilledQuantity":1,"unitPriceAmount":"valor-ejemplo","currency":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}}]` |
| `lines[].productId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `lines[].medicationConceptId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `lines[].productCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `lines[].brandName` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `lines[].genericName` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `lines[].strengthText` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines[].packageSizeText` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines[].medication` | No | `InventoryConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `lines[].medication.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `lines[].medication.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines[].requestedQuantity` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `lines[].reservedQuantity` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `lines[].fulfilledQuantity` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `lines[].unitPriceAmount` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines[].currency` | No | `InventoryConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `lines[].currency.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `lines[].currency.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines[].status` | Sí | `InventoryConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `lines[].status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `lines[].status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, PHARMACY_STAFF. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | No se pudo sellar un código de retiro único; reintente la operación | Excepción explícita en src/modules/pharmacy_inventory/application/pharmacy-orders/pharmacy-orders.use-cases.ts |
| 422 | `PRECONDITION_FAILED` | La transición no es legal para el estado actual del pedido | Excepción explícita en src/modules/pharmacy_inventory/application/pharmacy-orders/pharmacy-orders.use-cases.ts |
| 422 | `PRECONDITION_FAILED` | El pedido no declara modalidad de entrega: no puede demostrarse que sea un retiro | Excepción explícita en src/modules/pharmacy_inventory/application/pharmacy-orders/pharmacy-orders.use-cases.ts |
| 422 | `PRECONDITION_FAILED` | El pedido es de envío: se cierra por el carril de envío, no por el mostrador | Excepción explícita en src/modules/pharmacy_inventory/application/pharmacy-orders/pharmacy-orders.use-cases.ts |
| 422 | `PRECONDITION_FAILED` | La sede no ofrece retiro en mostrador | Excepción explícita en src/modules/pharmacy_inventory/application/pharmacy-orders/pharmacy-orders.use-cases.ts |
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

## 42. POST /pharmacy/orders/{id}/reject

- **Módulo:** `pharmacy_inventory`
- **Etiqueta OpenAPI:** `pharmacy-orders`
- **Nombre:** Rechazar el pedido (FAR-E2)
- **Operation ID:** `PharmacyOrdersController_reject`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyOrdersController.reject](../../src/modules/pharmacy_inventory/presentation/controllers/pharmacy-orders.controller.ts)

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
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PHARMACY_STAFF`.
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
| 504 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PharmacyOrderDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "reservationLines": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "productId": "00000000-0000-4000-8000-000000000001",
      "quantity": "valor-ejemplo",
      "unitPriceAmount": "valor-ejemplo",
      "billedAmount": "valor-ejemplo",
      "currencyConceptId": "00000000-0000-4000-8000-000000000001"
    }
  ],
  "insuranceSettlement": {
    "claimId": "00000000-0000-4000-8000-000000000001",
    "claimIdentifier": "valor-ejemplo",
    "adjudicationVersionId": "00000000-0000-4000-8000-000000000001",
    "adjudicationVersion": 1,
    "eobId": "00000000-0000-4000-8000-000000000001",
    "carrierName": "Nombre de ejemplo",
    "policyIdentifier": "valor-ejemplo",
    "totalBilledAmount": "valor-ejemplo",
    "totalApprovedAmount": "valor-ejemplo",
    "totalPatientAmount": "valor-ejemplo",
    "totalDeniedAmount": "valor-ejemplo",
    "currencyCode": "BOB",
    "result": "APPROVED",
    "exclusions": [
      {
        "claimLineId": "00000000-0000-4000-8000-000000000001",
        "itemId": "00000000-0000-4000-8000-000000000001",
        "itemName": "Nombre de ejemplo",
        "amount": "valor-ejemplo",
        "policyClauseReference": "valor-ejemplo",
        "denialRationale": "valor-ejemplo"
      }
    ]
  },
  "insuranceSettlementAvailability": "AVAILABLE",
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
  "prescriber": {
    "name": "Nombre de ejemplo",
    "specialty": "valor-ejemplo"
  },
  "patientName": "Nombre de ejemplo",
  "deliveryMode": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "deliveryAddressText": "valor-ejemplo",
  "pickupCode": "CODIGO_EJEMPLO",
  "pharmacyPublicProfileId": "00000000-0000-4000-8000-000000000001",
  "pharmacyPublicSlug": "valor-ejemplo",
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
| `reservationLines` | Sí | `array<PharmacyOrderReservationLineDto>` | Sin restricción adicional declarada | Porciones confirmadas o entregadas vigentes para facturación | `[{"id":"00000000-0000-4000-8000-000000000001","productId":"00000000-0000-4000-8000-000000000001","quantity":"valor-ejemplo","unitPriceAmount":"valor-ejemplo","billedAmount":"valor-ejemplo","currencyConceptId":"00000000-0000-4000-8000-000000000001"}]` |
| `reservationLines[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `reservationLines[].productId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `reservationLines[].quantity` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `reservationLines[].unitPriceAmount` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `reservationLines[].billedAmount` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `reservationLines[].currencyConceptId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `insuranceSettlement` | Sí | `PatientInsuranceSettlementDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"claimId":"00000000-0000-4000-8000-000000000001","claimIdentifier":"valor-ejemplo","adjudicationVersionId":"00000000-0000-4000-8000-000000000001","adjudicationVersion":1,"eobId":"00000000-0000-4000-8000-000000000001","carrierName":"Nombre de ejemplo","policyIdentifier":"valor-ejemplo","totalBilledAmount":"valor-ejemplo","totalApprovedAmount":"valor-ejemplo","totalPatientAmount":"valor-ejemplo","totalDeniedAmount":"valor-ejemplo","currencyCode":"BOB","result":"APPROVED","exclusions":[{"claimLineId":"00000000-0000-4000-8000-000000000001","itemId":"00000000-0000-4000-8000-000000000001","itemName":"Nombre de ejemplo","amount":"valor-ejemplo","policyClauseReference":"valor-ejemplo","denialRationale":"valor-ejemplo"}]}` |
| `insuranceSettlement.claimId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `insuranceSettlement.claimIdentifier` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `insuranceSettlement.adjudicationVersionId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `insuranceSettlement.adjudicationVersion` | Sí | `number` | formato `int32`; mínimo 1 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `insuranceSettlement.eobId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `insuranceSettlement.carrierName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `insuranceSettlement.policyIdentifier` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `insuranceSettlement.totalBilledAmount` | Sí | `string` | Sin restricción adicional declarada | Total facturado, decimal exacto | `valor-ejemplo` |
| `insuranceSettlement.totalApprovedAmount` | Sí | `string` | Sin restricción adicional declarada | Aporte del seguro, decimal exacto | `valor-ejemplo` |
| `insuranceSettlement.totalPatientAmount` | Sí | `string` | Sin restricción adicional declarada | Cargo confirmado al paciente, decimal exacto | `valor-ejemplo` |
| `insuranceSettlement.totalDeniedAmount` | Sí | `string` | Sin restricción adicional declarada | Importe excluido sin asignar, decimal exacto | `valor-ejemplo` |
| `insuranceSettlement.currencyCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `BOB` |
| `insuranceSettlement.result` | Sí | `string` | valores: `APPROVED`, `PARTIALLY_APPROVED`, `DENIED` | Sin descripción específica en el contrato OpenAPI. | `APPROVED` |
| `insuranceSettlement.exclusions` | Sí | `array<PatientInsuranceSettlementExclusionDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"claimLineId":"00000000-0000-4000-8000-000000000001","itemId":"00000000-0000-4000-8000-000000000001","itemName":"Nombre de ejemplo","amount":"valor-ejemplo","policyClauseReference":"valor-ejemplo","denialRationale":"valor-ejemplo"}]` |
| `insuranceSettlement.exclusions[].claimLineId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `insuranceSettlement.exclusions[].itemId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `insuranceSettlement.exclusions[].itemName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `insuranceSettlement.exclusions[].amount` | Sí | `string` | Sin restricción adicional declarada | Importe decimal exacto excluido | `valor-ejemplo` |
| `insuranceSettlement.exclusions[].policyClauseReference` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `insuranceSettlement.exclusions[].denialRationale` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `insuranceSettlementAvailability` | Sí | `string` | valores: `AVAILABLE`, `PENDING_PUBLICATION`, `UNDER_REVIEW`, `NOT_AVAILABLE` | Sin descripción específica en el contrato OpenAPI. | `AVAILABLE` |
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `InventoryConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `createdAt` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `expiresAt` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `siteId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `siteName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `pharmacyId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `pharmacyName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `medicationRequestId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `prescriber` | No | `PharmacyOrderPrescriberDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"name":"Nombre de ejemplo","specialty":"valor-ejemplo"}` |
| `prescriber.name` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `prescriber.specialty` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `patientName` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `deliveryMode` | No | `InventoryConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `deliveryMode.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `deliveryMode.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `deliveryAddressText` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `pickupCode` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `pharmacyPublicProfileId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `pharmacyPublicSlug` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `totalAmount` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `currency` | No | `InventoryConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `currency.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `currency.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `rejectionReasonText` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `substitutions` | Sí | `array<PharmacyOrderSubstitutionDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","originalProductId":"00000000-0000-4000-8000-000000000001","originalName":"Nombre de ejemplo","originalUnitPriceAmount":"valor-ejemplo","proposedProductId":"00000000-0000-4000-8000-000000000001","proposedName":"Nombre de ejemplo","proposedUnitPriceAmount":"valor-ejemplo","currency":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"decidedAt":"valor-ejemplo"}]` |
| `substitutions[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `substitutions[].originalProductId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `substitutions[].originalName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `substitutions[].originalUnitPriceAmount` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `substitutions[].proposedProductId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `substitutions[].proposedName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `substitutions[].proposedUnitPriceAmount` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `substitutions[].currency` | No | `InventoryConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `substitutions[].currency.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `substitutions[].currency.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `substitutions[].status` | Sí | `InventoryConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `substitutions[].status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `substitutions[].status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `substitutions[].decidedAt` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines` | Sí | `array<PharmacyOrderLineDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"productId":"00000000-0000-4000-8000-000000000001","medicationConceptId":"00000000-0000-4000-8000-000000000001","productCode":"CODIGO_EJEMPLO","brandName":"Nombre de ejemplo","genericName":"Nombre de ejemplo","strengthText":"valor-ejemplo","packageSizeText":"valor-ejemplo","medication":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"requestedQuantity":1,"reservedQuantity":1,"fulfilledQuantity":1,"unitPriceAmount":"valor-ejemplo","currency":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}}]` |
| `lines[].productId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `lines[].medicationConceptId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `lines[].productCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `lines[].brandName` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `lines[].genericName` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `lines[].strengthText` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines[].packageSizeText` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines[].medication` | No | `InventoryConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `lines[].medication.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `lines[].medication.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines[].requestedQuantity` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `lines[].reservedQuantity` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `lines[].fulfilledQuantity` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `lines[].unitPriceAmount` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines[].currency` | No | `InventoryConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `lines[].currency.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `lines[].currency.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines[].status` | Sí | `InventoryConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `lines[].status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `lines[].status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, PHARMACY_STAFF. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El rechazo exige un motivo en palabras | Excepción explícita en src/modules/pharmacy_inventory/application/pharmacy-orders/pharmacy-orders.use-cases.ts |
| 422 | `PRECONDITION_FAILED` | La transición no es legal para el estado actual del pedido | Excepción explícita en src/modules/pharmacy_inventory/application/pharmacy-orders/pharmacy-orders.use-cases.ts |
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

## 43. POST /pharmacy/orders/{id}/review

- **Módulo:** `pharmacy_inventory`
- **Etiqueta OpenAPI:** `pharmacy-orders`
- **Nombre:** Abrir revisión del pedido (FAR-E2)
- **Operation ID:** `PharmacyOrdersController_openReview`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyOrdersController.openReview](../../src/modules/pharmacy_inventory/presentation/controllers/pharmacy-orders.controller.ts)

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
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PHARMACY_STAFF`.
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
| 504 | Operación completada correctamente. | `Promise<PharmacyOrderDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PharmacyOrderDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "reservationLines": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "productId": "00000000-0000-4000-8000-000000000001",
      "quantity": "valor-ejemplo",
      "unitPriceAmount": "valor-ejemplo",
      "billedAmount": "valor-ejemplo",
      "currencyConceptId": "00000000-0000-4000-8000-000000000001"
    }
  ],
  "insuranceSettlement": {
    "claimId": "00000000-0000-4000-8000-000000000001",
    "claimIdentifier": "valor-ejemplo",
    "adjudicationVersionId": "00000000-0000-4000-8000-000000000001",
    "adjudicationVersion": 1,
    "eobId": "00000000-0000-4000-8000-000000000001",
    "carrierName": "Nombre de ejemplo",
    "policyIdentifier": "valor-ejemplo",
    "totalBilledAmount": "valor-ejemplo",
    "totalApprovedAmount": "valor-ejemplo",
    "totalPatientAmount": "valor-ejemplo",
    "totalDeniedAmount": "valor-ejemplo",
    "currencyCode": "BOB",
    "result": "APPROVED",
    "exclusions": [
      {
        "claimLineId": "00000000-0000-4000-8000-000000000001",
        "itemId": "00000000-0000-4000-8000-000000000001",
        "itemName": "Nombre de ejemplo",
        "amount": "valor-ejemplo",
        "policyClauseReference": "valor-ejemplo",
        "denialRationale": "valor-ejemplo"
      }
    ]
  },
  "insuranceSettlementAvailability": "AVAILABLE",
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
  "prescriber": {
    "name": "Nombre de ejemplo",
    "specialty": "valor-ejemplo"
  },
  "patientName": "Nombre de ejemplo",
  "deliveryMode": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "deliveryAddressText": "valor-ejemplo",
  "pickupCode": "CODIGO_EJEMPLO",
  "pharmacyPublicProfileId": "00000000-0000-4000-8000-000000000001",
  "pharmacyPublicSlug": "valor-ejemplo",
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
| `reservationLines` | Sí | `array<PharmacyOrderReservationLineDto>` | Sin restricción adicional declarada | Porciones confirmadas o entregadas vigentes para facturación | `[{"id":"00000000-0000-4000-8000-000000000001","productId":"00000000-0000-4000-8000-000000000001","quantity":"valor-ejemplo","unitPriceAmount":"valor-ejemplo","billedAmount":"valor-ejemplo","currencyConceptId":"00000000-0000-4000-8000-000000000001"}]` |
| `reservationLines[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `reservationLines[].productId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `reservationLines[].quantity` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `reservationLines[].unitPriceAmount` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `reservationLines[].billedAmount` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `reservationLines[].currencyConceptId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `insuranceSettlement` | Sí | `PatientInsuranceSettlementDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"claimId":"00000000-0000-4000-8000-000000000001","claimIdentifier":"valor-ejemplo","adjudicationVersionId":"00000000-0000-4000-8000-000000000001","adjudicationVersion":1,"eobId":"00000000-0000-4000-8000-000000000001","carrierName":"Nombre de ejemplo","policyIdentifier":"valor-ejemplo","totalBilledAmount":"valor-ejemplo","totalApprovedAmount":"valor-ejemplo","totalPatientAmount":"valor-ejemplo","totalDeniedAmount":"valor-ejemplo","currencyCode":"BOB","result":"APPROVED","exclusions":[{"claimLineId":"00000000-0000-4000-8000-000000000001","itemId":"00000000-0000-4000-8000-000000000001","itemName":"Nombre de ejemplo","amount":"valor-ejemplo","policyClauseReference":"valor-ejemplo","denialRationale":"valor-ejemplo"}]}` |
| `insuranceSettlement.claimId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `insuranceSettlement.claimIdentifier` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `insuranceSettlement.adjudicationVersionId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `insuranceSettlement.adjudicationVersion` | Sí | `number` | formato `int32`; mínimo 1 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `insuranceSettlement.eobId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `insuranceSettlement.carrierName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `insuranceSettlement.policyIdentifier` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `insuranceSettlement.totalBilledAmount` | Sí | `string` | Sin restricción adicional declarada | Total facturado, decimal exacto | `valor-ejemplo` |
| `insuranceSettlement.totalApprovedAmount` | Sí | `string` | Sin restricción adicional declarada | Aporte del seguro, decimal exacto | `valor-ejemplo` |
| `insuranceSettlement.totalPatientAmount` | Sí | `string` | Sin restricción adicional declarada | Cargo confirmado al paciente, decimal exacto | `valor-ejemplo` |
| `insuranceSettlement.totalDeniedAmount` | Sí | `string` | Sin restricción adicional declarada | Importe excluido sin asignar, decimal exacto | `valor-ejemplo` |
| `insuranceSettlement.currencyCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `BOB` |
| `insuranceSettlement.result` | Sí | `string` | valores: `APPROVED`, `PARTIALLY_APPROVED`, `DENIED` | Sin descripción específica en el contrato OpenAPI. | `APPROVED` |
| `insuranceSettlement.exclusions` | Sí | `array<PatientInsuranceSettlementExclusionDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"claimLineId":"00000000-0000-4000-8000-000000000001","itemId":"00000000-0000-4000-8000-000000000001","itemName":"Nombre de ejemplo","amount":"valor-ejemplo","policyClauseReference":"valor-ejemplo","denialRationale":"valor-ejemplo"}]` |
| `insuranceSettlement.exclusions[].claimLineId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `insuranceSettlement.exclusions[].itemId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `insuranceSettlement.exclusions[].itemName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `insuranceSettlement.exclusions[].amount` | Sí | `string` | Sin restricción adicional declarada | Importe decimal exacto excluido | `valor-ejemplo` |
| `insuranceSettlement.exclusions[].policyClauseReference` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `insuranceSettlement.exclusions[].denialRationale` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `insuranceSettlementAvailability` | Sí | `string` | valores: `AVAILABLE`, `PENDING_PUBLICATION`, `UNDER_REVIEW`, `NOT_AVAILABLE` | Sin descripción específica en el contrato OpenAPI. | `AVAILABLE` |
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `InventoryConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `createdAt` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `expiresAt` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `siteId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `siteName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `pharmacyId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `pharmacyName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `medicationRequestId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `prescriber` | No | `PharmacyOrderPrescriberDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"name":"Nombre de ejemplo","specialty":"valor-ejemplo"}` |
| `prescriber.name` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `prescriber.specialty` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `patientName` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `deliveryMode` | No | `InventoryConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `deliveryMode.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `deliveryMode.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `deliveryAddressText` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `pickupCode` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `pharmacyPublicProfileId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `pharmacyPublicSlug` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `totalAmount` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `currency` | No | `InventoryConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `currency.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `currency.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `rejectionReasonText` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `substitutions` | Sí | `array<PharmacyOrderSubstitutionDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","originalProductId":"00000000-0000-4000-8000-000000000001","originalName":"Nombre de ejemplo","originalUnitPriceAmount":"valor-ejemplo","proposedProductId":"00000000-0000-4000-8000-000000000001","proposedName":"Nombre de ejemplo","proposedUnitPriceAmount":"valor-ejemplo","currency":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"decidedAt":"valor-ejemplo"}]` |
| `substitutions[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `substitutions[].originalProductId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `substitutions[].originalName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `substitutions[].originalUnitPriceAmount` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `substitutions[].proposedProductId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `substitutions[].proposedName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `substitutions[].proposedUnitPriceAmount` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `substitutions[].currency` | No | `InventoryConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `substitutions[].currency.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `substitutions[].currency.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `substitutions[].status` | Sí | `InventoryConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `substitutions[].status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `substitutions[].status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `substitutions[].decidedAt` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines` | Sí | `array<PharmacyOrderLineDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"productId":"00000000-0000-4000-8000-000000000001","medicationConceptId":"00000000-0000-4000-8000-000000000001","productCode":"CODIGO_EJEMPLO","brandName":"Nombre de ejemplo","genericName":"Nombre de ejemplo","strengthText":"valor-ejemplo","packageSizeText":"valor-ejemplo","medication":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"requestedQuantity":1,"reservedQuantity":1,"fulfilledQuantity":1,"unitPriceAmount":"valor-ejemplo","currency":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}}]` |
| `lines[].productId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `lines[].medicationConceptId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `lines[].productCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `lines[].brandName` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `lines[].genericName` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `lines[].strengthText` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines[].packageSizeText` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines[].medication` | No | `InventoryConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `lines[].medication.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `lines[].medication.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines[].requestedQuantity` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `lines[].reservedQuantity` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `lines[].fulfilledQuantity` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `lines[].unitPriceAmount` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines[].currency` | No | `InventoryConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `lines[].currency.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `lines[].currency.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lines[].status` | Sí | `InventoryConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `lines[].status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `lines[].status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, PHARMACY_STAFF. | Roles/tenant/guards de autorización |
| 422 | `PRECONDITION_FAILED` | La transición no es legal para el estado actual del pedido | Excepción explícita en src/modules/pharmacy_inventory/application/pharmacy-orders/pharmacy-orders.use-cases.ts |
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

## 44. GET /pharmacy/orders/me

- **Módulo:** `pharmacy_inventory`
- **Etiqueta OpenAPI:** `pharmacy-orders`
- **Nombre:** Mis pedidos de farmacia, más nuevos primero (FAR-E1)
- **Operation ID:** `PharmacyOrdersController_listMine`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyOrdersController.listMine](../../src/modules/pharmacy_inventory/presentation/controllers/pharmacy-orders.controller.ts)

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
| 200 | Operación completada correctamente. | `Promise<PharmacyOrderListResponseDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<PharmacyOrderListResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<PharmacyOrderListResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<PharmacyOrderListResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<PharmacyOrderListResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<PharmacyOrderListResponseDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<PharmacyOrderListResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PharmacyOrderListResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "reservationLines": [
        {
          "id": "00000000-0000-4000-8000-000000000001",
          "productId": "00000000-0000-4000-8000-000000000001",
          "quantity": "valor-ejemplo",
          "unitPriceAmount": "valor-ejemplo",
          "billedAmount": "valor-ejemplo",
          "currencyConceptId": "00000000-0000-4000-8000-000000000001"
        }
      ],
      "insuranceSettlement": {
        "claimId": "00000000-0000-4000-8000-000000000001",
        "claimIdentifier": "valor-ejemplo",
        "adjudicationVersionId": "00000000-0000-4000-8000-000000000001",
        "adjudicationVersion": 1,
        "eobId": "00000000-0000-4000-8000-000000000001",
        "carrierName": "Nombre de ejemplo",
        "policyIdentifier": "valor-ejemplo",
        "totalBilledAmount": "valor-ejemplo",
        "totalApprovedAmount": "valor-ejemplo",
        "totalPatientAmount": "valor-ejemplo",
        "totalDeniedAmount": "valor-ejemplo",
        "currencyCode": "BOB",
        "result": "APPROVED",
        "exclusions": [
          {
            "claimLineId": "00000000-0000-4000-8000-000000000001",
            "itemId": "00000000-0000-4000-8000-000000000001",
            "itemName": "Nombre de ejemplo",
            "amount": "valor-ejemplo",
            "policyClauseReference": "valor-ejemplo",
            "denialRationale": "valor-ejemplo"
          }
        ]
      },
      "insuranceSettlementAvailability": "AVAILABLE",
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
      "prescriber": {
        "name": "Nombre de ejemplo",
        "specialty": "valor-ejemplo"
      },
      "patientName": "Nombre de ejemplo",
      "deliveryMode": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "deliveryAddressText": "valor-ejemplo",
      "pickupCode": "CODIGO_EJEMPLO",
      "pharmacyPublicProfileId": "00000000-0000-4000-8000-000000000001",
      "pharmacyPublicSlug": "valor-ejemplo",
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
| `items` | Sí | `array<PharmacyOrderDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"reservationLines":[{"id":"00000000-0000-4000-8000-000000000001","productId":"00000000-0000-4000-8000-000000000001","quantity":"valor-ejemplo","unitPriceAmount":"valor-ejemplo","billedAmount":"valor-ejemplo","currencyConceptId":"00000000-0000-4000-8000-000000000001"}],"insuranceSettlement":{"claimId":"00000000-0000-4000-8000-000000000001","claimIdentifier":"valor-ejemplo","adjudicationVersionId":"00000000-0000-4000-8000-000000000001","adjudicationVersion":1,"eobId":"00000000-0000-4000-8000-000000000001","carrierName":"Nombre de ejemplo","policyIdentifier":"valor-ejemplo","totalBilledAmount":"valor-ejemplo","totalApprovedAmount":"valor-ejemplo","totalPatientAmount":"valor-ejemplo","totalDeniedAmount":"valor-ejemplo","currencyCode":"BOB","result":"APPROVED","exclusions":[{"claimLineId":"00000000-0000-4000-8000-000000000001","itemId":"00000000-0000-4000-8000-000000000001","itemName":"Nombre de ejemplo","amount":"valor-ejemplo","policyClauseReference":"valor-ejemplo","denialRationale":"valor-ejemplo"}]},"insuranceSettlementAvailability":"AVAILABLE","id":"00000000-0000-4000-8000-000000000001","status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"createdAt":"valor-ejemplo","expiresAt":"valor-ejemplo","siteId":"00000000-0000-4000-8000-000000000001","siteName":"Nombre de ejemplo","pharmacyId":"00000000-0000-4000-8000-000000000001","pharmacyName":"Nombre de ejemplo","medicationRequestId":"00000000-0000-4000-8000-000000000001","prescriber":{"name":"Nombre de ejemplo","specialty":"valor-ejemplo"},"patientName":"Nombre de ejemplo","deliveryMode":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"deliveryAddressText":"valor-ejemplo","pickupCode":"CODIGO_EJEMPLO","pharmacyPublicProfileId":"00000000-0000-4000-8000-000000000001","pharmacyPublicSlug":"valor-ejemplo","totalAmount":"valor-ejemplo","currency":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"rejectionReasonText":"Texto descriptivo de ejemplo","substitutions":[{"id":"00000000-0000-4000-8000-000000000001","originalProductId":"00000000-0000-4000-8000-000000000001","originalName":"Nombre de ejemplo","originalUnitPriceAmount":"valor-ejemplo","proposedProductId":"00000000-0000-4000-8000-000000000001","proposedName":"Nombre de ejemplo","proposedUnitPriceAmount":"valor-ejemplo","currency":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"decidedAt":"valor-ejemplo"}],"lines":[{"productId":"00000000-0000-4000-8000-000000000001","medicationConceptId":"00000000-0000-4000-8000-000000000001","productCode":"CODIGO_EJEMPLO","brandName":"Nombre de ejemplo","genericName":"Nombre de ejemplo","strengthText":"valor-ejemplo","packageSizeText":"valor-ejemplo","medication":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"requestedQuantity":1,"reservedQuantity":1,"fulfilledQuantity":1,"unitPriceAmount":"valor-ejemplo","currency":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}}]}]` |
| `items[].reservationLines` | Sí | `array<PharmacyOrderReservationLineDto>` | Sin restricción adicional declarada | Porciones confirmadas o entregadas vigentes para facturación | `[{"id":"00000000-0000-4000-8000-000000000001","productId":"00000000-0000-4000-8000-000000000001","quantity":"valor-ejemplo","unitPriceAmount":"valor-ejemplo","billedAmount":"valor-ejemplo","currencyConceptId":"00000000-0000-4000-8000-000000000001"}]` |
| `items[].reservationLines[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].reservationLines[].productId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].reservationLines[].quantity` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].reservationLines[].unitPriceAmount` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].reservationLines[].billedAmount` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].reservationLines[].currencyConceptId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].insuranceSettlement` | Sí | `PatientInsuranceSettlementDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"claimId":"00000000-0000-4000-8000-000000000001","claimIdentifier":"valor-ejemplo","adjudicationVersionId":"00000000-0000-4000-8000-000000000001","adjudicationVersion":1,"eobId":"00000000-0000-4000-8000-000000000001","carrierName":"Nombre de ejemplo","policyIdentifier":"valor-ejemplo","totalBilledAmount":"valor-ejemplo","totalApprovedAmount":"valor-ejemplo","totalPatientAmount":"valor-ejemplo","totalDeniedAmount":"valor-ejemplo","currencyCode":"BOB","result":"APPROVED","exclusions":[{"claimLineId":"00000000-0000-4000-8000-000000000001","itemId":"00000000-0000-4000-8000-000000000001","itemName":"Nombre de ejemplo","amount":"valor-ejemplo","policyClauseReference":"valor-ejemplo","denialRationale":"valor-ejemplo"}]}` |
| `items[].insuranceSettlement.claimId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].insuranceSettlement.claimIdentifier` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].insuranceSettlement.adjudicationVersionId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].insuranceSettlement.adjudicationVersion` | Sí | `number` | formato `int32`; mínimo 1 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `items[].insuranceSettlement.eobId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].insuranceSettlement.carrierName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].insuranceSettlement.policyIdentifier` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].insuranceSettlement.totalBilledAmount` | Sí | `string` | Sin restricción adicional declarada | Total facturado, decimal exacto | `valor-ejemplo` |
| `items[].insuranceSettlement.totalApprovedAmount` | Sí | `string` | Sin restricción adicional declarada | Aporte del seguro, decimal exacto | `valor-ejemplo` |
| `items[].insuranceSettlement.totalPatientAmount` | Sí | `string` | Sin restricción adicional declarada | Cargo confirmado al paciente, decimal exacto | `valor-ejemplo` |
| `items[].insuranceSettlement.totalDeniedAmount` | Sí | `string` | Sin restricción adicional declarada | Importe excluido sin asignar, decimal exacto | `valor-ejemplo` |
| `items[].insuranceSettlement.currencyCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `BOB` |
| `items[].insuranceSettlement.result` | Sí | `string` | valores: `APPROVED`, `PARTIALLY_APPROVED`, `DENIED` | Sin descripción específica en el contrato OpenAPI. | `APPROVED` |
| `items[].insuranceSettlement.exclusions` | Sí | `array<PatientInsuranceSettlementExclusionDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"claimLineId":"00000000-0000-4000-8000-000000000001","itemId":"00000000-0000-4000-8000-000000000001","itemName":"Nombre de ejemplo","amount":"valor-ejemplo","policyClauseReference":"valor-ejemplo","denialRationale":"valor-ejemplo"}]` |
| `items[].insuranceSettlement.exclusions[].claimLineId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].insuranceSettlement.exclusions[].itemId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].insuranceSettlement.exclusions[].itemName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].insuranceSettlement.exclusions[].amount` | Sí | `string` | Sin restricción adicional declarada | Importe decimal exacto excluido | `valor-ejemplo` |
| `items[].insuranceSettlement.exclusions[].policyClauseReference` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].insuranceSettlement.exclusions[].denialRationale` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].insuranceSettlementAvailability` | Sí | `string` | valores: `AVAILABLE`, `PENDING_PUBLICATION`, `UNDER_REVIEW`, `NOT_AVAILABLE` | Sin descripción específica en el contrato OpenAPI. | `AVAILABLE` |
| `items[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].status` | Sí | `InventoryConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `items[].status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].createdAt` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].expiresAt` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].siteId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].siteName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].pharmacyId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].pharmacyName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].medicationRequestId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].prescriber` | No | `PharmacyOrderPrescriberDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"name":"Nombre de ejemplo","specialty":"valor-ejemplo"}` |
| `items[].prescriber.name` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].prescriber.specialty` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].patientName` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].deliveryMode` | No | `InventoryConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `items[].deliveryMode.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].deliveryMode.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].deliveryAddressText` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].pickupCode` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].pharmacyPublicProfileId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].pharmacyPublicSlug` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].totalAmount` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].currency` | No | `InventoryConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `items[].currency.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].currency.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].rejectionReasonText` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `items[].substitutions` | Sí | `array<PharmacyOrderSubstitutionDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","originalProductId":"00000000-0000-4000-8000-000000000001","originalName":"Nombre de ejemplo","originalUnitPriceAmount":"valor-ejemplo","proposedProductId":"00000000-0000-4000-8000-000000000001","proposedName":"Nombre de ejemplo","proposedUnitPriceAmount":"valor-ejemplo","currency":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"decidedAt":"valor-ejemplo"}]` |
| `items[].substitutions[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].substitutions[].originalProductId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].substitutions[].originalName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].substitutions[].originalUnitPriceAmount` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].substitutions[].proposedProductId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].substitutions[].proposedName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].substitutions[].proposedUnitPriceAmount` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].substitutions[].currency` | No | `InventoryConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `items[].substitutions[].currency.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].substitutions[].currency.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].substitutions[].status` | Sí | `InventoryConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `items[].substitutions[].status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].substitutions[].status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].substitutions[].decidedAt` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].lines` | Sí | `array<PharmacyOrderLineDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"productId":"00000000-0000-4000-8000-000000000001","medicationConceptId":"00000000-0000-4000-8000-000000000001","productCode":"CODIGO_EJEMPLO","brandName":"Nombre de ejemplo","genericName":"Nombre de ejemplo","strengthText":"valor-ejemplo","packageSizeText":"valor-ejemplo","medication":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"requestedQuantity":1,"reservedQuantity":1,"fulfilledQuantity":1,"unitPriceAmount":"valor-ejemplo","currency":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}}]` |
| `items[].lines[].productId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].lines[].medicationConceptId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].lines[].productCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].lines[].brandName` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].lines[].genericName` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].lines[].strengthText` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].lines[].packageSizeText` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].lines[].medication` | No | `InventoryConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `items[].lines[].medication.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].lines[].medication.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].lines[].requestedQuantity` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `items[].lines[].reservedQuantity` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `items[].lines[].fulfilledQuantity` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `items[].lines[].unitPriceAmount` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].lines[].currency` | No | `InventoryConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `items[].lines[].currency.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].lines[].currency.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].lines[].status` | Sí | `InventoryConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `items[].lines[].status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].lines[].status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PATIENT. | Roles/tenant/guards de autorización |
| 422 | `PRECONDITION_FAILED` | La cuenta autenticada no tiene perfil de paciente | Excepción explícita en src/modules/pharmacy_inventory/application/pharmacy-orders/pharmacy-orders.use-cases.ts |
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

## 45. GET /pharmacy/prescription-shares/{token}

- **Módulo:** `pharmacy_inventory`
- **Etiqueta OpenAPI:** `pharmacy-prescription-shares`
- **Nombre:** Abrir una receta compartida desde la farmacia (FAR-02)
- **Operation ID:** `PharmacyPrescriptionSharesController_open`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyPrescriptionSharesController.open](../../src/modules/pharmacy_inventory/presentation/controllers/pharmacy-prescription-shares.controller.ts)

### Descripción de negocio

Registra la apertura. Los ítems vigentes de la receta, cruzados por fármaco con los productos de las farmacias del tenant y su disponibilidad por sede. Del paciente, solo iniciales y los últimos 3 dígitos del documento.


### Descripción del sistema

NestJS resuelve `GET /pharmacy/prescription-shares/{token}` en `PharmacyPrescriptionSharesController_open`. El controlador delega en `OpenPrescriptionShareUseCase.execute`. No recibe body. El tipo de retorno estático es `Promise<PharmacyPrescriptionShareDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `token` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |
| `user-agent` | header | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /pharmacy/prescription-shares/valor-ejemplo HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
user-agent: valor-ejemplo
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PHARMACY_STAFF`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /pharmacy/prescription-shares/valor-ejemplo HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
user-agent: valor-ejemplo
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PharmacyPrescriptionShareDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<PharmacyPrescriptionShareDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<PharmacyPrescriptionShareDto>` | No |
| 403 | La sesión no es de una farmacia | `Promise<PharmacyPrescriptionShareDto>` | No |
| 404 | El enlace no existe, o el tenant no tiene farmacia | `Promise<PharmacyPrescriptionShareDto>` | No |
| 410 | Enlace vencido o revocado (`reason` `PRESCRIPTION_SHARE_EXPIRED` o `PRESCRIPTION_SHARE_REVOKED`) | `Promise<PharmacyPrescriptionShareDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<PharmacyPrescriptionShareDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<PharmacyPrescriptionShareDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<PharmacyPrescriptionShareDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PharmacyPrescriptionShareDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "shareId": "00000000-0000-4000-8000-000000000001",
  "issuedAt": "valor-ejemplo",
  "validTo": "valor-ejemplo",
  "prescriber": {
    "name": "Nombre de ejemplo",
    "license": {
      "number": "valor-ejemplo",
      "authority": "valor-ejemplo",
      "state": "ACTIVE"
    }
  },
  "patient": {
    "maskedName": "L. P. Q.",
    "documentLast3": "123"
  },
  "items": [
    {
      "medicationRequestId": "00000000-0000-4000-8000-000000000001",
      "medicationConceptId": "00000000-0000-4000-8000-000000000001",
      "display": "valor-ejemplo",
      "dosageText": "valor-ejemplo",
      "prescribedQuantity": 1,
      "unitCode": "CODIGO_EJEMPLO",
      "dispensedQuantity": 1,
      "remainingQuantity": 1,
      "matches": [
        {
          "pharmacyId": "00000000-0000-4000-8000-000000000001",
          "pharmacyProductId": "00000000-0000-4000-8000-000000000001",
          "name": "Nombre de ejemplo",
          "price": "valor-ejemplo",
          "currencyCode": "BOB",
          "requiresPrescription": true,
          "outOfStockDeclared": true,
          "sites": [
            {
              "siteId": "00000000-0000-4000-8000-000000000001",
              "siteName": "Nombre de ejemplo",
              "available": true,
              "quantity": 1,
              "stockUpdatedAt": "valor-ejemplo"
            }
          ]
        }
      ]
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `shareId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `issuedAt` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `validTo` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `prescriber` | Sí | `PharmacyPrescriptionPrescriberDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"name":"Nombre de ejemplo","license":{"number":"valor-ejemplo","authority":"valor-ejemplo","state":"ACTIVE"}}` |
| `prescriber.name` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `prescriber.license` | No | `PharmacyPrescriptionLicenseDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"number":"valor-ejemplo","authority":"valor-ejemplo","state":"ACTIVE"}` |
| `prescriber.license.number` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `prescriber.license.authority` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `prescriber.license.state` | No | `string` | valores: `ACTIVE`, `PENDING` | Sin descripción específica en el contrato OpenAPI. | `ACTIVE` |
| `patient` | Sí | `PharmacyPrescriptionPatientDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"maskedName":"L. P. Q.","documentLast3":"123"}` |
| `patient.maskedName` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `L. P. Q.` |
| `patient.documentLast3` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `123` |
| `items` | Sí | `array<PharmacyPrescriptionItemDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"medicationRequestId":"00000000-0000-4000-8000-000000000001","medicationConceptId":"00000000-0000-4000-8000-000000000001","display":"valor-ejemplo","dosageText":"valor-ejemplo","prescribedQuantity":1,"unitCode":"CODIGO_EJEMPLO","dispensedQuantity":1,"remainingQuantity":1,"matches":[{"pharmacyId":"00000000-0000-4000-8000-000000000001","pharmacyProductId":"00000000-0000-4000-8000-000000000001","name":"Nombre de ejemplo","price":"valor-ejemplo","currencyCode":"BOB","requiresPrescription":true,"outOfStockDeclared":true,"sites":[{"siteId":"00000000-0000-4000-8000-000000000001","siteName":"Nombre de ejemplo","available":true,"quantity":1,"stockUpdatedAt":"valor-ejemplo"}]}]}]` |
| `items[].medicationRequestId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].medicationConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].display` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].dosageText` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].prescribedQuantity` | No | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `items[].unitCode` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].dispensedQuantity` | No | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `items[].remainingQuantity` | No | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `items[].matches` | Sí | `array<PharmacyPrescriptionMatchDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"pharmacyId":"00000000-0000-4000-8000-000000000001","pharmacyProductId":"00000000-0000-4000-8000-000000000001","name":"Nombre de ejemplo","price":"valor-ejemplo","currencyCode":"BOB","requiresPrescription":true,"outOfStockDeclared":true,"sites":[{"siteId":"00000000-0000-4000-8000-000000000001","siteName":"Nombre de ejemplo","available":true,"quantity":1,"stockUpdatedAt":"valor-ejemplo"}]}]` |
| `items[].matches[].pharmacyId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].matches[].pharmacyProductId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].matches[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].matches[].price` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].matches[].currencyCode` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `BOB` |
| `items[].matches[].requiresPrescription` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `items[].matches[].outOfStockDeclared` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `items[].matches[].sites` | Sí | `array<PharmacyPrescriptionSiteDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"siteId":"00000000-0000-4000-8000-000000000001","siteName":"Nombre de ejemplo","available":true,"quantity":1,"stockUpdatedAt":"valor-ejemplo"}]` |
| `items[].matches[].sites[].siteId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].matches[].sites[].siteName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].matches[].sites[].available` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `items[].matches[].sites[].quantity` | No | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `items[].matches[].sites[].stockUpdatedAt` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PHARMACY_STAFF. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Esta organización no tiene una farmacia verificada. | Excepción explícita en src/modules/pharmacy_inventory/application/prescription-shares/open-prescription-share.use-case.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pharmacy/prescription-shares/{token}"
}
```

---

## 46. POST /pharmacy/recall-holds

- **Módulo:** `pharmacy_inventory`
- **Etiqueta OpenAPI:** `pharmacy-inventory`
- **Nombre:** Aplicar retiro/recall de lote (UC-25-08)
- **Operation ID:** `PharmacyInventoryController_createRecallHold`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyInventoryController.createRecallHold](../../src/modules/pharmacy_inventory/presentation/controllers/pharmacy-inventory.controller.ts)

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
| 504 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `IdResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |

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
  "path": "/pharmacy/recall-holds"
}
```

---

## 47. POST /pharmacy/recall-holds/{id}/release

- **Módulo:** `pharmacy_inventory`
- **Etiqueta OpenAPI:** `pharmacy-inventory`
- **Nombre:** Liberar recall y reactivar lote (UC-25-09)
- **Operation ID:** `PharmacyInventoryController_releaseRecallHold`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyInventoryController.releaseRecallHold](../../src/modules/pharmacy_inventory/presentation/controllers/pharmacy-inventory.controller.ts)

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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El hold no está activo | Excepción explícita en src/modules/pharmacy_inventory/application/inventory-recall/release-recall-hold.use-case.ts |
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

