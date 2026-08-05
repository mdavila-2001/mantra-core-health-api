<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `pharmacy_inventory`

Referencia exhaustiva de 15 operación(es) del módulo `pharmacy_inventory`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `pharmacy-inventory`, `pharmacy-inventory-internal`
- **Controladores:** `PharmacyDispensingController`, `PharmacyInventoryController`, `PharmacyInventoryInternalController`, `PharmacyProcurementController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [POST /internal/inventory-sync-batches](#1-post-internal-inventory-sync-batches) — Ingerir un lote de sincronización ERP
2. [POST /internal/inventory-sync/{batchId}/reconcile](#2-post-internal-inventory-sync-batchid-reconcile) — Conciliar lote de sincronización externa (UC-25-12)
3. [POST /internal/reservations/expire](#3-post-internal-reservations-expire) — Liberar reservas vencidas (UC-25-05)
4. [POST /pharmacy/{pharmacyId}/dispensations](#4-post-pharmacy-pharmacyid-dispensations) — Dispensar una prescripción a un paciente (UC-25-03)
5. [POST /pharmacy/{pharmacyId}/goods-receipts](#5-post-pharmacy-pharmacyid-goods-receipts) — Recepcionar mercancía por lote (UC-25-02)
6. [POST /pharmacy/{pharmacyId}/purchase-orders](#6-post-pharmacy-pharmacyid-purchase-orders) — Emitir una orden de compra a proveedor (UC-25-01)
7. [POST /pharmacy/{pharmacyId}/reservations](#7-post-pharmacy-pharmacyid-reservations) — Reservar stock para una prescripción (UC-25-04)
8. [POST /pharmacy/{pharmacyId}/suppliers](#8-post-pharmacy-pharmacyid-suppliers) — Registrar un proveedor de farmacia
9. [POST /pharmacy/{pharmacyId}/transfers](#9-post-pharmacy-pharmacyid-transfers) — Transferir stock entre ubicaciones (UC-25-10)
10. [POST /pharmacy/{siteId}/count-sessions](#10-post-pharmacy-siteid-count-sessions) — Iniciar y congelar una sesión de conteo (UC-25-06)
11. [POST /pharmacy/{siteId}/inventory-locations](#11-post-pharmacy-siteid-inventory-locations) — Crear una ubicación de inventario
12. [POST /pharmacy/count-sessions/{id}/approve](#12-post-pharmacy-count-sessions-id-approve) — Aprobar conteo y ajustar ledger por varianza (UC-25-07)
13. [POST /pharmacy/dispensations/{id}/reverse](#13-post-pharmacy-dispensations-id-reverse) — Reversar una dispensación (UC-25-11)
14. [POST /pharmacy/recall-holds](#14-post-pharmacy-recall-holds) — Aplicar retiro/recall de lote (UC-25-08)
15. [POST /pharmacy/recall-holds/{id}/release](#15-post-pharmacy-recall-holds-id-release) — Liberar recall y reactivar lote (UC-25-09)

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
- **Nombre:** Liberar reservas vencidas (UC-25-05)
- **Operation ID:** `PharmacyInventoryInternalController_expireReservations`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacyInventoryInternalController.expireReservations](../../src/modules/pharmacy_inventory/controllers/pharmacy-inventory-internal.controller.ts)

### Descripción de negocio

Liberar reservas vencidas (UC-25-05). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-25-05: liberar reservas expiradas.

### Descripción del sistema

NestJS resuelve `POST /internal/reservations/expire` en `PharmacyInventoryInternalController_expireReservations`. El controlador delega en `InventoryReservationsService.expire`. No recibe body. El tipo de retorno estático es `Promise<ExpireReservationsResponseDto>`.

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
  "expiredCount": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `expiredCount` | Sí | `number` | Sin restricción adicional declarada | Reservas expiradas en esta corrida | `1` |

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

## 4. POST /pharmacy/{pharmacyId}/dispensations

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

## 5. POST /pharmacy/{pharmacyId}/goods-receipts

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

## 6. POST /pharmacy/{pharmacyId}/purchase-orders

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

## 7. POST /pharmacy/{pharmacyId}/reservations

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

## 8. POST /pharmacy/{pharmacyId}/suppliers

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

## 9. POST /pharmacy/{pharmacyId}/transfers

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

## 10. POST /pharmacy/{siteId}/count-sessions

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

## 11. POST /pharmacy/{siteId}/inventory-locations

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

## 12. POST /pharmacy/count-sessions/{id}/approve

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

## 13. POST /pharmacy/dispensations/{id}/reverse

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

## 14. POST /pharmacy/recall-holds

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

## 15. POST /pharmacy/recall-holds/{id}/release

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

