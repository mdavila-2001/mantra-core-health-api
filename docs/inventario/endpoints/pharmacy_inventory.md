<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `pharmacy_inventory`

- **Bloque:** Farmacia (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)
- **Operaciones:** 30 (30 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 2 · MEDIO 26 · BAJO 2
- **Tablas distintas que tocan:** 63
- **Respuestas de error y detalle contractual:** `openapi/endpoints/pharmacy-inventory.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | POST | `/internal/inventory-sync-batches` | Ingerir un lote de sincronización ERP | MEDIO | 7 | SECURITY_ADMIN |
| 2 | POST | `/internal/inventory-sync/{batchId}/reconcile` | Conciliar lote de sincronización externa (UC-25-12) | MEDIO | 6 | SECURITY_ADMIN |
| 3 | POST | `/internal/reservations/expire` | Liberar reservas y pedidos vencidos (UC-25-05) | MEDIO | 24 | SYSTEM, SECURITY_ADMIN |
| 4 | GET | `/pharmacy-inventory/availability` | Consultar qué sedes pueden surtir un conjunto de productos | BAJO | 10 | sesión (sin roles) |
| 5 | GET | `/pharmacy-inventory/sites/{siteId}/stock` | Consultar el stock disponible de una sede | BAJO | 6 | sesión (sin roles) |
| 6 | POST | `/pharmacy/{pharmacyId}/dispensations` | Dispensar una prescripción a un paciente (UC-25-03) | MEDIO | 19 | SECURITY_ADMIN |
| 7 | POST | `/pharmacy/{pharmacyId}/goods-receipts` | Recepcionar mercancía por lote (UC-25-02) | MEDIO | 19 | SECURITY_ADMIN |
| 8 | POST | `/pharmacy/{pharmacyId}/purchase-orders` | Emitir una orden de compra a proveedor (UC-25-01) | MEDIO | 8 | SECURITY_ADMIN |
| 9 | POST | `/pharmacy/{pharmacyId}/reservations` | Reservar stock para una prescripción (UC-25-04) | MEDIO | 13 | SECURITY_ADMIN |
| 10 | POST | `/pharmacy/{pharmacyId}/suppliers` | Registrar un proveedor de farmacia | MEDIO | 2 | SECURITY_ADMIN |
| 11 | POST | `/pharmacy/{pharmacyId}/transfers` | Transferir stock entre ubicaciones (UC-25-10) | MEDIO | 10 | SECURITY_ADMIN |
| 12 | POST | `/pharmacy/{siteId}/count-sessions` | Iniciar y congelar una sesión de conteo (UC-25-06) | MEDIO | 9 | SECURITY_ADMIN |
| 13 | POST | `/pharmacy/{siteId}/inventory-locations` | Crear una ubicación de inventario | MEDIO | 4 | SECURITY_ADMIN |
| 14 | POST | `/pharmacy/count-sessions/{id}/approve` | Aprobar conteo y ajustar ledger por varianza (UC-25-07) | MEDIO | 13 | SECURITY_ADMIN |
| 15 | POST | `/pharmacy/dispensations/{id}/reverse` | Reversar una dispensación (UC-25-11) | MEDIO | 10 | SECURITY_ADMIN |
| 16 | GET | `/pharmacy/orders` | Bandeja de pedidos de las farmacias del tenant (FAR-E2) | MEDIO | 34 | SECURITY_ADMIN, PHARMACY_STAFF |
| 17 | POST | `/pharmacy/orders` | Crear un pedido de farmacia (FAR-E1) | MEDIO | 27 | PATIENT |
| 18 | GET | `/pharmacy/orders/{id}` | Consultar un pedido de farmacia (FAR-E1) | ALTO | 49 | sesión (sin roles) |
| 19 | POST | `/pharmacy/orders/{id}/accept-substitutions` | Aceptar los genéricos propuestos (paciente) | MEDIO | 26 | PATIENT |
| 20 | POST | `/pharmacy/orders/{id}/cancel` | Cancelar un pedido de farmacia (FAR-E1) | MEDIO | 23 | PATIENT |
| 21 | POST | `/pharmacy/orders/{id}/confirm` | Confirmar el pedido (FAR-E2) | MEDIO | 37 | SECURITY_ADMIN, PHARMACY_STAFF |
| 22 | POST | `/pharmacy/orders/{id}/conversation` | Abrir el chat del pedido con la farmacia | ALTO | 11 | sesión (sin roles) |
| 23 | POST | `/pharmacy/orders/{id}/dispense` | Dispensar el pedido en el mostrador (FAR-E3) | MEDIO | 37 | SECURITY_ADMIN, PHARMACY_STAFF |
| 24 | POST | `/pharmacy/orders/{id}/prefer-original` | Preferir los productos originales (paciente) | MEDIO | 19 | PATIENT |
| 25 | POST | `/pharmacy/orders/{id}/ready` | Marcar el pedido listo para retiro (FAR-E2/E3) | MEDIO | 29 | SECURITY_ADMIN, PHARMACY_STAFF |
| 26 | POST | `/pharmacy/orders/{id}/reject` | Rechazar el pedido (FAR-E2) | MEDIO | 34 | SECURITY_ADMIN, PHARMACY_STAFF |
| 27 | POST | `/pharmacy/orders/{id}/review` | Abrir revisión del pedido (FAR-E2) | MEDIO | 29 | SECURITY_ADMIN, PHARMACY_STAFF |
| 28 | GET | `/pharmacy/orders/me` | Mis pedidos de farmacia, más nuevos primero (FAR-E1) | MEDIO | 48 | PATIENT |
| 29 | POST | `/pharmacy/recall-holds` | Aplicar retiro/recall de lote (UC-25-08) | MEDIO | 11 | SECURITY_ADMIN |
| 30 | POST | `/pharmacy/recall-holds/{id}/release` | Liberar recall y reactivar lote (UC-25-09) | MEDIO | 11 | SECURITY_ADMIN |

---

## 1. POST /internal/inventory-sync-batches

- **Origen:** CONTRATO
- **Nombre:** Ingerir un lote de sincronización ERP
- **Bloque:** Farmacia
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyInventoryInternalController.createSyncBatch` — `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-inventory-internal.controller.ts:76`

### Qué es y para qué sirve (negocio)

Ingerir un lote de sincronización ERP. Dentro del módulo (descripción del modelo, en inglés): «Prevents overselling and untraceable adjustments under concurrent manual, API, dispensing and receiving operations.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_25_pharmacy_inventory.puml:20`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`POST /internal/inventory-sync-batches` la atiende `PharmacyInventoryInternalController.createSyncBatch` (src/modules/pharmacy_inventory/presentation/controllers/pharmacy-inventory-internal.controller.ts:76). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateSyncBatchDto` (9 campos, 3 obligatorios). Delega en `InventorySyncService.createBatch`. Crea filas en pharmacy_inventory.pharmacy_inventory_sync_batches, pharmacy_inventory.pharmacy_inventory_sync_items. Lee pharmacy_inventory.pharmacy_inventory_sync_batches, pharmacy_inventory.pharmacy_inventory_sync_items, pharmacy.pharmacies, pharmacy.pharmacy_integration_connections, pharmacy.pharmacy_products.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-inventory-internal.controller.ts:76` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharmacy_inventory.pharmacy_inventory_sync_batches` | ESCRIBE | CREA | DIRECTA | PharmacyInventoryInternalController.createSyncBatch → InventorySyncService.createBatch → CreateInventorySyncBatchUseCase.execute → SyncRepository.createBatch | `src/modules/pharmacy_inventory/infrastructure/repositories/sync.repository.ts:129` |
| `pharmacy_inventory.pharmacy_inventory_sync_batches` | LEE | LEE | DIRECTA | PharmacyInventoryInternalController.createSyncBatch → InventorySyncService.createBatch → CreateInventorySyncBatchUseCase.execute → SyncRepository.findBatchById | `src/modules/pharmacy_inventory/infrastructure/repositories/sync.repository.ts:91` |
| `pharmacy_inventory.pharmacy_inventory_sync_items` | ESCRIBE | CREA | DIRECTA | PharmacyInventoryInternalController.createSyncBatch → InventorySyncService.createBatch → CreateInventorySyncBatchUseCase.execute → SyncRepository.createItem | `src/modules/pharmacy_inventory/infrastructure/repositories/sync.repository.ts:155` |
| `pharmacy_inventory.pharmacy_inventory_sync_items` | LEE | LEE | DIRECTA | PharmacyInventoryInternalController.createSyncBatch → InventorySyncService.createBatch → CreateInventorySyncBatchUseCase.execute → SyncRepository.findItemByIdempotencyKey | `src/modules/pharmacy_inventory/infrastructure/repositories/sync.repository.ts:115` |
| `pharmacy.pharmacies` | LEE | LEE | DIRECTA | PharmacyInventoryInternalController.createSyncBatch → InventorySyncService.createBatch → CreateInventorySyncBatchUseCase.execute → PharmacyInventoryScopePolicy.requireManagedConnection → PharmacyInventoryScopePolicy.requireManagedPharmacy → InventoryScopeRepository.findPharmacyInTenant | `src/modules/pharmacy_inventory/infrastructure/repositories/inventory-scope.repository.ts:33` |
| `pharmacy.pharmacy_integration_connections` | LEE | LEE | DIRECTA | PharmacyInventoryInternalController.createSyncBatch → InventorySyncService.createBatch → CreateInventorySyncBatchUseCase.execute → PharmacyInventoryScopePolicy.requireManagedConnection → InventoryScopeRepository.findConnection | `src/modules/pharmacy_inventory/infrastructure/repositories/inventory-scope.repository.ts:102` |
| `pharmacy.pharmacy_products` | LEE | LEE | DIRECTA | PharmacyInventoryInternalController.createSyncBatch → InventorySyncService.createBatch → CreateInventorySyncBatchUseCase.execute → PharmacyInventoryScopePolicy.requireProduct → InventoryScopeRepository.findProductInPharmacy | `src/modules/pharmacy_inventory/infrastructure/repositories/inventory-scope.repository.ts:73` |

### Cuerpo — DTO `CreateSyncBatchDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `pharmacyIntegrationConnectionId` | `string` | Sí | formato uuid | `@IsUUID()` | Conexión de integración de farmacia | `src/modules/pharmacy_inventory/presentation/dto/create-sync-batch.dto.ts:82` |
| `sourceBatchIdentifier` | `string` | Sí | longitud máxima 128 | `@IsString()` `@MaxLength(128)` | Identificador del lote en el sistema origen | `src/modules/pharmacy_inventory/presentation/dto/create-sync-batch.dto.ts:90` |
| `items` | `array<SyncItemDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => SyncItemDto)` | — | `src/modules/pharmacy_inventory/presentation/dto/create-sync-batch.dto.ts:100` |
| `items[].pharmacyProductId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Producto mapeado (si se conoce) | `src/modules/pharmacy_inventory/presentation/dto/create-sync-batch.dto.ts:25` |
| `items[].externalProductCode` | `string` | No | longitud máxima 128 | `@IsOptional()` `@IsString()` `@MaxLength(128)` | Código de producto externo | `src/modules/pharmacy_inventory/presentation/dto/create-sync-batch.dto.ts:34` |
| `items[].externalLocationCode` | `string` | No | longitud máxima 128 | `@IsOptional()` `@IsString()` `@MaxLength(128)` | Código de ubicación externa | `src/modules/pharmacy_inventory/presentation/dto/create-sync-batch.dto.ts:43` |
| `items[].externalLotNumber` | `string` | No | longitud máxima 128 | `@IsOptional()` `@IsString()` `@MaxLength(128)` | Número de lote externo | `src/modules/pharmacy_inventory/presentation/dto/create-sync-batch.dto.ts:52` |
| `items[].externalQuantity` | `number` | No | — | `@IsOptional()` `@IsNumber()` | Cantidad reportada por el ERP | `src/modules/pharmacy_inventory/presentation/dto/create-sync-batch.dto.ts:60` |
| `items[].idempotencyKey` | `string` | No | longitud máxima 128 | `@IsOptional()` `@IsString()` `@MaxLength(128)` | Clave de idempotencia del item | `src/modules/pharmacy_inventory/presentation/dto/create-sync-batch.dto.ts:69` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "pharmacyIntegrationConnectionId": "00000000-0000-4000-8000-000000000001",
  "sourceBatchIdentifier": "valor-ejemplo",
  "items": [
    {}
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<SyncBatchResponseDto>` · DTO `SyncBatchResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/pharmacy_inventory/presentation/dto/responses.dto.ts:169` |
| `itemIds` | `array<string>` | Sí | — | — | Ids de los items creados | `src/modules/pharmacy_inventory/presentation/dto/responses.dto.ts:175` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharmacy_inventory.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / pharmacy inventory — etapa `ctrl:PharmacyInventoryInternalController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 2. POST /internal/inventory-sync/{batchId}/reconcile

- **Origen:** CONTRATO
- **Nombre:** Conciliar lote de sincronización externa (UC-25-12)
- **Bloque:** Farmacia
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyInventoryInternalController.reconcile` — `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-inventory-internal.controller.ts:93`

### Qué es y para qué sirve (negocio)

Conciliar lote de sincronización externa (UC-25-12). Dentro del módulo (descripción del modelo, en inglés): «Prevents overselling and untraceable adjustments under concurrent manual, API, dispensing and receiving operations.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_25_pharmacy_inventory.puml:20`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`POST /internal/inventory-sync/{batchId}/reconcile` la atiende `PharmacyInventoryInternalController.reconcile` (src/modules/pharmacy_inventory/presentation/controllers/pharmacy-inventory-internal.controller.ts:93). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `InventorySyncService.reconcile`. Actualiza pharmacy_inventory.pharmacy_inventory_sync_batches, pharmacy_inventory.pharmacy_inventory_sync_items. Lee pharmacy_inventory.pharmacy_inventory_sync_batches, pharmacy_inventory.pharmacy_inventory_sync_items, pharmacy.pharmacies, pharmacy.pharmacy_integration_connections.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-inventory-internal.controller.ts:93` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: batchId | `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-inventory-internal.controller.ts:93` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharmacy_inventory.pharmacy_inventory_sync_batches` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyInventoryInternalController.reconcile → InventorySyncService.reconcile → ReconcileInventorySyncBatchUseCase.execute | `src/modules/pharmacy_inventory/application/inventory-sync/reconcile-inventory-sync-batch.use-case.ts:67` |
| `pharmacy_inventory.pharmacy_inventory_sync_batches` | LEE | LEE | DIRECTA | PharmacyInventoryInternalController.reconcile → InventorySyncService.reconcile → ReconcileInventorySyncBatchUseCase.execute → SyncRepository.findBatchById | `src/modules/pharmacy_inventory/infrastructure/repositories/sync.repository.ts:91` |
| `pharmacy_inventory.pharmacy_inventory_sync_items` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyInventoryInternalController.reconcile → InventorySyncService.reconcile → ReconcileInventorySyncBatchUseCase.execute | `src/modules/pharmacy_inventory/application/inventory-sync/reconcile-inventory-sync-batch.use-case.ts:56` |
| `pharmacy_inventory.pharmacy_inventory_sync_items` | LEE | LEE | DIRECTA | PharmacyInventoryInternalController.reconcile → InventorySyncService.reconcile → ReconcileInventorySyncBatchUseCase.execute → SyncRepository.findItems | `src/modules/pharmacy_inventory/infrastructure/repositories/sync.repository.ts:105` |
| `pharmacy.pharmacies` | LEE | LEE | DIRECTA | PharmacyInventoryInternalController.reconcile → InventorySyncService.reconcile → ReconcileInventorySyncBatchUseCase.execute → PharmacyInventoryScopePolicy.requireManagedConnection → PharmacyInventoryScopePolicy.requireManagedPharmacy → InventoryScopeRepository.findPharmacyInTenant | `src/modules/pharmacy_inventory/infrastructure/repositories/inventory-scope.repository.ts:33` |
| `pharmacy.pharmacy_integration_connections` | LEE | LEE | DIRECTA | PharmacyInventoryInternalController.reconcile → InventorySyncService.reconcile → ReconcileInventorySyncBatchUseCase.execute → PharmacyInventoryScopePolicy.requireManagedConnection → InventoryScopeRepository.findConnection | `src/modules/pharmacy_inventory/infrastructure/repositories/inventory-scope.repository.ts:102` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `batchId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ReconcileResponseDto>` · DTO `ReconcileResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `batchId` | `string` | Sí | formato uuid | — | Identificador asociado a batch. | `src/modules/pharmacy_inventory/presentation/dto/responses.dto.ts:148` |
| `itemsProcessed` | `number` | Sí | — | — | Items procesados | `src/modules/pharmacy_inventory/presentation/dto/responses.dto.ts:154` |
| `discrepancies` | `number` | Sí | — | — | Items marcados como discrepancia | `src/modules/pharmacy_inventory/presentation/dto/responses.dto.ts:160` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El lote no está en estado reconciliable |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharmacy_inventory.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / pharmacy inventory — etapa `ctrl:PharmacyInventoryInternalController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 3. POST /internal/reservations/expire

- **Origen:** CONTRATO
- **Nombre:** Liberar reservas y pedidos vencidos (UC-25-05)
- **Bloque:** Farmacia
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyInventoryInternalController.expireReservations` — `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-inventory-internal.controller.ts:56`

### Qué es y para qué sirve (negocio)

Liberar reservas y pedidos vencidos (UC-25-05). Dentro del módulo (descripción del modelo, en inglés): «Prevents overselling and untraceable adjustments under concurrent manual, API, dispensing and receiving operations.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_25_pharmacy_inventory.puml:20`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`POST /internal/reservations/expire` la atiende `PharmacyInventoryInternalController.expireReservations` (src/modules/pharmacy_inventory/presentation/controllers/pharmacy-inventory-internal.controller.ts:56). Exige sesión con alguno de los roles SYSTEM, SECURITY_ADMIN. Delega en `InventoryReservationsService.expire`, `PharmacyOrdersService.expireDue`. Crea filas en messaging.domain_events, messaging.in_app_notifications, messaging.notification_deliveries, messaging.notification_requests, messaging.outbox_messages, pharmacy_inventory.inventory_ledger_entries. Actualiza iam.devices, pharmacy_inventory.inventory_reservation_lines, pharmacy_inventory.inventory_reservations, pharmacy_inventory.inventory_stock_positions. Lee clinical.medication_requests, iam.devices, messaging.in_app_notifications, messaging.message_channels, messaging.messaging_providers, messaging.outbox_messages, messaging.provider_channel_configs, messaging.recipient_preferences y 6 más. Publica un evento calculado (null).

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, SECURITY_ADMIN | `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-inventory-internal.controller.ts:56` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.medication_requests` | LEE | LEE | DIRECTA | PharmacyInventoryInternalController.expireReservations → PharmacyOrdersService.expireDue → PharmacyOrdersUseCases.expireDue → PharmacyOrdersRepository.findPrescriberProfileId | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:290` |
| `iam.devices` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyInventoryInternalController.expireReservations → PharmacyOrdersService.expireDue → PharmacyOrdersUseCases.expireDue → PharmacyOrderNotificationsService.expiredToPrescriber → NotifyPharmacyOrderUseCase.expiredToPrescriber → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → WebPushService.pushToUser → WebPushService.sendTo → WebPushService.forget | `src/modules/messaging/services/web-push.service.ts:235` |
| `iam.devices` | LEE | LEE | DIRECTA | PharmacyInventoryInternalController.expireReservations → PharmacyOrdersService.expireDue → PharmacyOrdersUseCases.expireDue → PharmacyOrderNotificationsService.expiredToPrescriber → NotifyPharmacyOrderUseCase.expiredToPrescriber → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → WebPushService.pushToUser | `src/modules/messaging/services/web-push.service.ts:172` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | PharmacyInventoryInternalController.expireReservations → PharmacyOrdersService.expireDue → PharmacyOrdersUseCases.expireDue → MessagingDomainEventAdapter.publish → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.in_app_notifications` | ESCRIBE | CREA | DIRECTA | PharmacyInventoryInternalController.expireReservations → PharmacyOrdersService.expireDue → PharmacyOrdersUseCases.expireDue → PharmacyOrderNotificationsService.expiredToPrescriber → NotifyPharmacyOrderUseCase.expiredToPrescriber → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createInAppNotification | `src/modules/messaging/repositories/notifications.repository.ts:710` |
| `messaging.in_app_notifications` | LEE | LEE | DIRECTA | PharmacyInventoryInternalController.expireReservations → PharmacyOrdersService.expireDue → PharmacyOrdersUseCases.expireDue → PharmacyOrderNotificationsService.expiredToPrescriber → NotifyPharmacyOrderUseCase.expiredToPrescriber → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findUnreadInAppForResource | `src/modules/messaging/repositories/notifications.repository.ts:845` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | PharmacyInventoryInternalController.expireReservations → PharmacyOrdersService.expireDue → PharmacyOrdersUseCases.expireDue → PharmacyOrderNotificationsService.expiredToPrescriber → NotifyPharmacyOrderUseCase.expiredToPrescriber → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findActiveChannelByType | `src/modules/messaging/repositories/notifications.repository.ts:189` |
| `messaging.messaging_providers` | LEE | LEE | DIRECTA | PharmacyInventoryInternalController.expireReservations → PharmacyOrdersService.expireDue → PharmacyOrdersUseCases.expireDue → PharmacyOrderNotificationsService.expiredToPrescriber → NotifyPharmacyOrderUseCase.expiredToPrescriber → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findProviderById | `src/modules/messaging/repositories/notifications.repository.ts:437` |
| `messaging.notification_deliveries` | ESCRIBE | CREA | DIRECTA | PharmacyInventoryInternalController.expireReservations → PharmacyOrdersService.expireDue → PharmacyOrdersUseCases.expireDue → PharmacyOrderNotificationsService.expiredToPrescriber → NotifyPharmacyOrderUseCase.expiredToPrescriber → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createDelivery | `src/modules/messaging/repositories/notifications.repository.ts:514` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | PharmacyInventoryInternalController.expireReservations → PharmacyOrdersService.expireDue → PharmacyOrdersUseCases.expireDue → PharmacyOrderNotificationsService.expiredToPrescriber → NotifyPharmacyOrderUseCase.expiredToPrescriber → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | PharmacyInventoryInternalController.expireReservations → PharmacyOrdersService.expireDue → PharmacyOrdersUseCases.expireDue → MessagingDomainEventAdapter.publish → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | PharmacyInventoryInternalController.expireReservations → PharmacyOrdersService.expireDue → PharmacyOrdersUseCases.expireDue → MessagingDomainEventAdapter.publish → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |
| `messaging.provider_channel_configs` | LEE | LEE | DIRECTA | PharmacyInventoryInternalController.expireReservations → PharmacyOrdersService.expireDue → PharmacyOrdersUseCases.expireDue → PharmacyOrderNotificationsService.expiredToPrescriber → NotifyPharmacyOrderUseCase.expiredToPrescriber → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findChannelConfigs | `src/modules/messaging/repositories/notifications.repository.ts:405` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | PharmacyInventoryInternalController.expireReservations → PharmacyOrdersService.expireDue → PharmacyOrdersUseCases.expireDue → PharmacyOrderNotificationsService.expiredToPrescriber → NotifyPharmacyOrderUseCase.expiredToPrescriber → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `pharmacy_inventory.inventory_ledger_entries` | ESCRIBE | CREA | DIRECTA | PharmacyInventoryInternalController.expireReservations → InventoryReservationsService.expire → ExpireInventoryReservationsUseCase.execute → ReleaseConfirmedReservationLinesUseCase.execute → LedgerRepository.append | `src/modules/pharmacy_inventory/infrastructure/repositories/ledger.repository.ts:142` |
| `pharmacy_inventory.inventory_ledger_entries` | LEE | LEE | POR_SQL | PharmacyInventoryInternalController.expireReservations → InventoryReservationsService.expire → ExpireInventoryReservationsUseCase.execute → ReleaseConfirmedReservationLinesUseCase.execute → LedgerRepository.nextSequence | `src/modules/pharmacy_inventory/infrastructure/repositories/ledger.repository.ts:113` |
| `pharmacy_inventory.inventory_reservation_lines` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyInventoryInternalController.expireReservations → InventoryReservationsService.expire → ExpireInventoryReservationsUseCase.execute → ReleaseConfirmedReservationLinesUseCase.execute | `src/modules/pharmacy_inventory/application/inventory-reservations/release-confirmed-reservation-lines.use-case.ts:44` |
| `pharmacy_inventory.inventory_reservation_lines` | LEE | LEE | DIRECTA | PharmacyInventoryInternalController.expireReservations → InventoryReservationsService.expire → ExpireInventoryReservationsUseCase.execute → ReleaseConfirmedReservationLinesUseCase.execute → ReservationsRepository.findLinesByReservation | `src/modules/pharmacy_inventory/infrastructure/repositories/reservations.repository.ts:142` |
| `pharmacy_inventory.inventory_reservations` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyInventoryInternalController.expireReservations → InventoryReservationsService.expire → ExpireInventoryReservationsUseCase.execute | `src/modules/pharmacy_inventory/application/inventory-reservations/expire-inventory-reservations.use-case.ts:33` |
| `pharmacy_inventory.inventory_reservations` | LEE | LEE | DIRECTA | PharmacyInventoryInternalController.expireReservations → InventoryReservationsService.expire → ExpireInventoryReservationsUseCase.execute → ReservationsRepository.findExpired | `src/modules/pharmacy_inventory/infrastructure/repositories/reservations.repository.ts:125` |
| `pharmacy_inventory.inventory_stock_positions` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyInventoryInternalController.expireReservations → InventoryReservationsService.expire → ExpireInventoryReservationsUseCase.execute → ReleaseConfirmedReservationLinesUseCase.execute | `src/modules/pharmacy_inventory/application/inventory-reservations/release-confirmed-reservation-lines.use-case.ts:72` |
| `pharmacy_inventory.inventory_stock_positions` | LEE | LEE | DIRECTA | PharmacyInventoryInternalController.expireReservations → InventoryReservationsService.expire → ExpireInventoryReservationsUseCase.execute → ReleaseConfirmedReservationLinesUseCase.execute → StockPositionsRepository.findByKeyForUpdate | `src/modules/pharmacy_inventory/infrastructure/repositories/stock-positions.repository.ts:82` |
| `pharmacy.pharmacies` | LEE | LEE | DIRECTA | PharmacyInventoryInternalController.expireReservations → PharmacyOrdersService.expireDue → PharmacyOrdersUseCases.expireDue → PharmacyOrdersRepository.findPharmaciesByIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:265` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | PharmacyInventoryInternalController.expireReservations → PharmacyOrdersService.expireDue → PharmacyOrdersUseCases.expireDue → PharmacyOrderNotificationsService.expiredToPrescriber → NotifyPharmacyOrderUseCase.expiredToPrescriber → NotifyPharmacyOrderUseCase.emitToPerson → ProfilesPersonAccountLinksAdapter.findActiveByPerson → PersonAccountLinksRepository.findActiveByPerson | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:101` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | calculado: `null` | `src/modules/pharmacy_inventory/infrastructure/adapters/messaging-domain-event.adapter.ts:16` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ExpireReservationsResponseDto>` · DTO `ExpireReservationsResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `expiredCount` | `number` | Sí | — | — | Reservas y pedidos expirados en esta corrida | `src/modules/pharmacy_inventory/presentation/dto/responses.dto.ts:130` |
| `expiredOrderCount` | `number` | No | — | — | Pedidos de paciente vencidos en esta corrida | `src/modules/pharmacy_inventory/presentation/dto/responses.dto.ts:139` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharmacy_inventory.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / pharmacy inventory — etapa `ctrl:PharmacyInventoryInternalController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 4. GET /pharmacy-inventory/availability

- **Origen:** CONTRATO
- **Nombre:** Consultar qué sedes pueden surtir un conjunto de productos
- **Bloque:** Farmacia
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyInventoryReadController.availability` — `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-inventory-read.controller.ts:56`

### Qué es y para qué sirve (negocio)

Consultar qué sedes pueden surtir un conjunto de productos. Dentro del módulo (descripción del modelo, en inglés): «Prevents overselling and untraceable adjustments under concurrent manual, API, dispensing and receiving operations.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_25_pharmacy_inventory.puml:20`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`GET /pharmacy-inventory/availability` la atiende `PharmacyInventoryReadController.availability` (src/modules/pharmacy_inventory/presentation/controllers/pharmacy-inventory-read.controller.ts:56). Exige sesión; el controlador no declara roles. Delega en `PharmacyInventoryReadService.availability`. Lee common.addresses, pharmacy_inventory.inventory_locations, pharmacy_inventory.inventory_stock_positions, pharmacy.pharmacies, pharmacy.pharmacy_price_lists, pharmacy.pharmacy_product_prices, pharmacy.pharmacy_products, pharmacy.pharmacy_sites y 2 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-inventory-read.controller.ts:56` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_QUERY | products (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.addresses` | LEE | LEE | DIRECTA | PharmacyInventoryReadController.availability → PharmacyInventoryReadService.availability → ReadPharmacyInventoryUseCase.availability → ReadPharmacyInventoryUseCase.resolveAddresses → PharmacyDirectoryAdapter.findAddresses → PharmacyReadRepository.findAddresses | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:295` |
| `pharmacy_inventory.inventory_locations` | LEE | LEE | DIRECTA | PharmacyInventoryReadController.availability → PharmacyInventoryReadService.availability → ReadPharmacyInventoryUseCase.availability → InventoryReadRepository.findActiveLocationsBySites | `src/modules/pharmacy_inventory/infrastructure/repositories/inventory-read.repository.ts:21` |
| `pharmacy_inventory.inventory_stock_positions` | LEE | LEE | DIRECTA | PharmacyInventoryReadController.availability → PharmacyInventoryReadService.availability → ReadPharmacyInventoryUseCase.availability → InventoryReadRepository.findStockPositions | `src/modules/pharmacy_inventory/infrastructure/repositories/inventory-read.repository.ts:41` |
| `pharmacy.pharmacies` | LEE | LEE | DIRECTA | PharmacyInventoryReadController.availability → PharmacyInventoryReadService.availability → ReadPharmacyInventoryUseCase.availability → PharmacyDirectoryAdapter.findVisibleByTenant → PharmacyReadRepository.findVisibleByTenant | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:47` |
| `pharmacy.pharmacy_price_lists` | LEE | LEE | DIRECTA | PharmacyInventoryReadController.availability → PharmacyInventoryReadService.availability → ReadPharmacyInventoryUseCase.availability → PharmacyDirectoryAdapter.findCurrentPublicPriceLists → PharmacyReadRepository.findCurrentPublicPriceLists | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:226` |
| `pharmacy.pharmacy_product_prices` | LEE | LEE | DIRECTA | PharmacyInventoryReadController.availability → PharmacyInventoryReadService.availability → ReadPharmacyInventoryUseCase.availability → PharmacyDirectoryAdapter.findCurrentPrices → PharmacyReadRepository.findCurrentPrices | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:253` |
| `pharmacy.pharmacy_products` | LEE | LEE | DIRECTA | PharmacyInventoryReadController.availability → PharmacyInventoryReadService.availability → ReadPharmacyInventoryUseCase.availability → PharmacyDirectoryAdapter.findSellableProductsByIds → PharmacyReadRepository.findSellableProductsByIds | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:207` |
| `pharmacy.pharmacy_sites` | LEE | LEE | DIRECTA | PharmacyInventoryReadController.availability → PharmacyInventoryReadService.availability → ReadPharmacyInventoryUseCase.availability → PharmacyDirectoryAdapter.findActiveSites → PharmacyReadRepository.findActiveSites | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:78` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | PharmacyInventoryReadController.availability → PharmacyInventoryReadService.availability → ReadPharmacyInventoryUseCase.availability → ReadPharmacyInventoryUseCase.resolveAddresses → PharmacyDirectoryAdapter.findPracticeSites → PharmacyReadRepository.findPracticeSites | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:286` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | PharmacyInventoryReadController.availability → PharmacyInventoryReadService.availability → ReadPharmacyInventoryUseCase.availability → PharmacyDirectoryAdapter.findConcepts → PharmacyReadRepository.findConcepts | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:304` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `products` | query | Sí | `array<string>` | Productos solicitados: UUIDs separados por coma |
| `lat` | query | No | `string` | Latitud WGS84 desde donde medir distancia (va con lng) |
| `lng` | query | No | `string` | Longitud WGS84 desde donde medir distancia (va con lat) |
| `limit` | query | No | `number` | Tope de sedes servidas (por defecto 20) |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<AvailabilityResponseDto>` · DTO `AvailabilityResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `requestedProductIds` | `array<string>` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:340` |
| `items` | `array<AvailabilitySiteDto>` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:349` |
| `items[].siteId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:228` |
| `items[].siteName` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:234` |
| `items[].pharmacyId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:240` |
| `items[].pharmacyName` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:246` |
| `items[].addressText` | `object` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:252` |
| `items[].latitude` | `object` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:258` |
| `items[].longitude` | `object` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:264` |
| `items[].distanceKm` | `object` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:271` |
| `items[].homeDeliveryAvailable` | `object` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:277` |
| `items[].pickupAvailable` | `object` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:283` |
| `items[].complete` | `boolean` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:289` |
| `items[].availableCount` | `number` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:295` |
| `items[].missingProductIds` | `array<string>` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:301` |
| `items[].totalAmount` | `object` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:309` |
| `items[].currency` | `InventoryConceptDto` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:315` |
| `items[].currency.code` | `string` | No | — | — | — | sin fuente |
| `items[].currency.display` | `string` | No | — | — | — | sin fuente |
| `items[].stockUpdatedAt` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:325` |
| `items[].products` | `array<AvailabilityProductDto>` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:331` |
| `items[].products[].productId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:169` |
| `items[].products[].productCode` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:175` |
| `items[].products[].brandName` | `object` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:181` |
| `items[].products[].genericName` | `object` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:187` |
| `items[].products[].strengthText` | `object` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:193` |
| `items[].products[].packageSizeText` | `object` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:199` |
| `items[].products[].medication` | `InventoryConceptDto` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:205` |
| `items[].products[].medication.code` | `string` | No | — | — | — | sin fuente |
| `items[].products[].medication.display` | `string` | No | — | — | — | sin fuente |
| `items[].products[].availableQuantity` | `number` | Sí | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:213` |
| `items[].products[].price` | `AvailabilityPriceDto` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:219` |
| `items[].products[].price.unitAmount` | `string` | No | — | — | — | sin fuente |
| `items[].products[].price.patientAmount` | `object` | No | admite null | — | — | sin fuente |
| `items[].products[].price.currency` | `InventoryConceptDto` | No | admite null | — | — | sin fuente |
| `items[].products[].price.currency.code` | `string` | No | — | — | — | sin fuente |
| `items[].products[].price.currency.display` | `string` | No | — | — | — | sin fuente |
| `items[].products[].price.priceListCode` | `string` | No | — | — | — | sin fuente |
| `count` | `number` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:355` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios; BadRequestException: products es obligatorio: la disponibilidad se consulta para un pedido concreto |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharmacy_inventory.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-inventory-read.controller.spec.ts:20` |

### Flujos

- src / modules / pharmacy inventory — etapa `ctrl:PharmacyInventoryReadController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 5. GET /pharmacy-inventory/sites/{siteId}/stock

- **Origen:** CONTRATO
- **Nombre:** Consultar el stock disponible de una sede
- **Bloque:** Farmacia
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyInventoryReadController.getSiteStock` — `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-inventory-read.controller.ts:38`

### Qué es y para qué sirve (negocio)

Consultar el stock disponible de una sede. Dentro del módulo (descripción del modelo, en inglés): «Prevents overselling and untraceable adjustments under concurrent manual, API, dispensing and receiving operations.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_25_pharmacy_inventory.puml:20`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`GET /pharmacy-inventory/sites/{siteId}/stock` la atiende `PharmacyInventoryReadController.getSiteStock` (src/modules/pharmacy_inventory/presentation/controllers/pharmacy-inventory-read.controller.ts:38). Exige sesión; el controlador no declara roles. Delega en `PharmacyInventoryReadService.getSiteStock`. Lee pharmacy_inventory.inventory_locations, pharmacy_inventory.inventory_stock_positions, pharmacy.pharmacies, pharmacy.pharmacy_products, pharmacy.pharmacy_sites, terminology.catalog_concepts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-inventory-read.controller.ts:38` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: siteId | `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-inventory-read.controller.ts:38` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharmacy_inventory.inventory_locations` | LEE | LEE | DIRECTA | PharmacyInventoryReadController.getSiteStock → PharmacyInventoryReadService.getSiteStock → ReadPharmacyInventoryUseCase.getSiteStock → InventoryReadRepository.findActiveLocationsBySites | `src/modules/pharmacy_inventory/infrastructure/repositories/inventory-read.repository.ts:21` |
| `pharmacy_inventory.inventory_stock_positions` | LEE | LEE | DIRECTA | PharmacyInventoryReadController.getSiteStock → PharmacyInventoryReadService.getSiteStock → ReadPharmacyInventoryUseCase.getSiteStock → InventoryReadRepository.findStockPositions | `src/modules/pharmacy_inventory/infrastructure/repositories/inventory-read.repository.ts:41` |
| `pharmacy.pharmacies` | LEE | LEE | DIRECTA | PharmacyInventoryReadController.getSiteStock → PharmacyInventoryReadService.getSiteStock → ReadPharmacyInventoryUseCase.getSiteStock → PharmacyDirectoryAdapter.findVisibleById → PharmacyReadRepository.findVisibleById | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:64` |
| `pharmacy.pharmacy_products` | LEE | LEE | DIRECTA | PharmacyInventoryReadController.getSiteStock → PharmacyInventoryReadService.getSiteStock → ReadPharmacyInventoryUseCase.getSiteStock → PharmacyDirectoryAdapter.findActiveProductsByIds → PharmacyReadRepository.findActiveProductsByIds | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:191` |
| `pharmacy.pharmacy_sites` | LEE | LEE | DIRECTA | PharmacyInventoryReadController.getSiteStock → PharmacyInventoryReadService.getSiteStock → ReadPharmacyInventoryUseCase.getSiteStock → PharmacyDirectoryAdapter.findActiveSiteById → PharmacyReadRepository.findActiveSiteById | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:93` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | PharmacyInventoryReadController.getSiteStock → PharmacyInventoryReadService.getSiteStock → ReadPharmacyInventoryUseCase.getSiteStock → PharmacyDirectoryAdapter.findConcepts → PharmacyReadRepository.findConcepts | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:304` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `siteId` | path | Sí | `string` | — |
| `product` | query | No | `string` | Producto puntual, si se acota |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<SiteStockResponseDto>` · DTO `SiteStockResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `siteId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:103` |
| `siteName` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:109` |
| `pharmacyId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:115` |
| `pharmacyName` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:121` |
| `items` | `array<SiteStockItemDto>` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:127` |
| `items[].productId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:32` |
| `items[].productCode` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:38` |
| `items[].brandName` | `object` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:44` |
| `items[].genericName` | `object` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:50` |
| `items[].strengthText` | `object` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:56` |
| `items[].packageSizeText` | `object` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:62` |
| `items[].medication` | `InventoryConceptDto` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:68` |
| `items[].medication.code` | `string` | No | — | — | — | sin fuente |
| `items[].medication.display` | `string` | No | — | — | — | sin fuente |
| `items[].onHandQuantity` | `number` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:74` |
| `items[].reservedQuantity` | `number` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:80` |
| `items[].availableQuantity` | `number` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:88` |
| `items[].locationCount` | `number` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:94` |
| `count` | `number` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:133` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Sede de farmacia no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharmacy_inventory.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / pharmacy inventory — etapa `ctrl:PharmacyInventoryReadController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 6. POST /pharmacy/{pharmacyId}/dispensations

- **Origen:** CONTRATO
- **Nombre:** Dispensar una prescripción a un paciente (UC-25-03)
- **Bloque:** Farmacia
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyDispensingController.dispense` — `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-dispensing.controller.ts:38`

### Qué es y para qué sirve (negocio)

Dispensar una prescripción a un paciente (UC-25-03). Dentro del módulo (descripción del modelo, en inglés): «Prevents overselling and untraceable adjustments under concurrent manual, API, dispensing and receiving operations.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_25_pharmacy_inventory.puml:20`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`POST /pharmacy/{pharmacyId}/dispensations` la atiende `PharmacyDispensingController.dispense` (src/modules/pharmacy_inventory/presentation/controllers/pharmacy-dispensing.controller.ts:38). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateDispensationDto` (12 campos, 6 obligatorios). Delega en `MedicationDispensationsService.dispense`. Crea filas en pharmacy_inventory.inventory_ledger_entries, pharmacy_inventory.medication_dispensation_lines, pharmacy_inventory.medication_dispensations. Actualiza pharmacy_inventory.inventory_reservation_lines, pharmacy_inventory.inventory_reservations, pharmacy_inventory.inventory_stock_positions. Lee clinical.medication_requests, pharmacy_inventory.inventory_ledger_entries, pharmacy_inventory.inventory_locations, pharmacy_inventory.inventory_lots, pharmacy_inventory.inventory_reservation_lines, pharmacy_inventory.inventory_reservations, pharmacy_inventory.inventory_stock_positions, pharmacy_inventory.medication_dispensation_lines y 5 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-dispensing.controller.ts:38` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmacyId | `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-dispensing.controller.ts:38` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.medication_requests` | LEE | LEE | DIRECTA | PharmacyDispensingController.dispense → MedicationDispensationsService.dispense → DispenseMedicationUseCase.execute → PharmacyInventoryScopePolicy.requirePatientContext → InventoryScopeRepository.patientServedByPharmacy | `src/modules/pharmacy_inventory/infrastructure/repositories/inventory-scope.repository.ts:127` |
| `pharmacy_inventory.inventory_ledger_entries` | ESCRIBE | CREA | DIRECTA | PharmacyDispensingController.dispense → MedicationDispensationsService.dispense → DispenseMedicationUseCase.execute → LedgerRepository.append | `src/modules/pharmacy_inventory/infrastructure/repositories/ledger.repository.ts:142` |
| `pharmacy_inventory.inventory_ledger_entries` | LEE | LEE | DIRECTA | PharmacyDispensingController.dispense → MedicationDispensationsService.dispense → DispenseMedicationUseCase.execute → LedgerRepository.findEntryIdsBySource | `src/modules/pharmacy_inventory/infrastructure/repositories/ledger.repository.ts:125` |
| `pharmacy_inventory.inventory_locations` | LEE | LEE | DIRECTA | PharmacyDispensingController.dispense → MedicationDispensationsService.dispense → DispenseMedicationUseCase.execute → PharmacyInventoryScopePolicy.requireStockKey → PharmacyInventoryScopePolicy.requireLocation → InventoryScopeRepository.findLocationInSite | `src/modules/pharmacy_inventory/infrastructure/repositories/inventory-scope.repository.ts:56` |
| `pharmacy_inventory.inventory_lots` | LEE | LEE | DIRECTA | PharmacyDispensingController.dispense → MedicationDispensationsService.dispense → DispenseMedicationUseCase.execute → PharmacyInventoryScopePolicy.requireStockKey → PharmacyInventoryScopePolicy.requireLot → InventoryScopeRepository.findLot | `src/modules/pharmacy_inventory/infrastructure/repositories/inventory-scope.repository.ts:86` |
| `pharmacy_inventory.inventory_reservation_lines` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyDispensingController.dispense → MedicationDispensationsService.dispense → DispenseMedicationUseCase.execute | `src/modules/pharmacy_inventory/application/medication-dispensations/dispense-medication.use-case.ts:231` |
| `pharmacy_inventory.inventory_reservation_lines` | LEE | LEE | DIRECTA | PharmacyDispensingController.dispense → MedicationDispensationsService.dispense → DispenseMedicationUseCase.execute → ReservationsRepository.findLinesByReservation | `src/modules/pharmacy_inventory/infrastructure/repositories/reservations.repository.ts:142` |
| `pharmacy_inventory.inventory_reservations` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyDispensingController.dispense → MedicationDispensationsService.dispense → DispenseMedicationUseCase.execute | `src/modules/pharmacy_inventory/application/medication-dispensations/dispense-medication.use-case.ts:224` |
| `pharmacy_inventory.inventory_reservations` | LEE | LEE | DIRECTA | PharmacyDispensingController.dispense → MedicationDispensationsService.dispense → DispenseMedicationUseCase.execute → ReservationsRepository.findById | `src/modules/pharmacy_inventory/infrastructure/repositories/reservations.repository.ts:116` |
| `pharmacy_inventory.inventory_stock_positions` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyDispensingController.dispense → MedicationDispensationsService.dispense → DispenseMedicationUseCase.execute | `src/modules/pharmacy_inventory/application/medication-dispensations/dispense-medication.use-case.ts:197` |
| `pharmacy_inventory.inventory_stock_positions` | LEE | LEE | DIRECTA | PharmacyDispensingController.dispense → MedicationDispensationsService.dispense → DispenseMedicationUseCase.execute → StockPositionsRepository.findByKeyForUpdate | `src/modules/pharmacy_inventory/infrastructure/repositories/stock-positions.repository.ts:82` |
| `pharmacy_inventory.medication_dispensation_lines` | ESCRIBE | CREA | DIRECTA | PharmacyDispensingController.dispense → MedicationDispensationsService.dispense → DispenseMedicationUseCase.execute → DispensationsRepository.createLine | `src/modules/pharmacy_inventory/infrastructure/repositories/dispensations.repository.ts:177` |
| `pharmacy_inventory.medication_dispensation_lines` | LEE | LEE | DIRECTA | PharmacyDispensingController.dispense → MedicationDispensationsService.dispense → DispenseMedicationUseCase.execute → DispensationsRepository.findLines | `src/modules/pharmacy_inventory/infrastructure/repositories/dispensations.repository.ts:131` |
| `pharmacy_inventory.medication_dispensations` | ESCRIBE | CREA | DIRECTA | PharmacyDispensingController.dispense → MedicationDispensationsService.dispense → DispenseMedicationUseCase.execute → DispensationsRepository.create | `src/modules/pharmacy_inventory/infrastructure/repositories/dispensations.repository.ts:147` |
| `pharmacy_inventory.medication_dispensations` | LEE | LEE | DIRECTA | PharmacyDispensingController.dispense → MedicationDispensationsService.dispense → DispenseMedicationUseCase.execute → DispensationsRepository.findByIdempotencyKey | `src/modules/pharmacy_inventory/infrastructure/repositories/dispensations.repository.ts:117` |
| `pharmacy.pharmacies` | LEE | LEE | DIRECTA | PharmacyDispensingController.dispense → MedicationDispensationsService.dispense → DispenseMedicationUseCase.execute → PharmacyInventoryScopePolicy.requireManagedPharmacy → InventoryScopeRepository.findPharmacyInTenant | `src/modules/pharmacy_inventory/infrastructure/repositories/inventory-scope.repository.ts:33` |
| `pharmacy.pharmacy_products` | LEE | LEE | DIRECTA | PharmacyDispensingController.dispense → MedicationDispensationsService.dispense → DispenseMedicationUseCase.execute → PharmacyInventoryScopePolicy.requireStockKey → PharmacyInventoryScopePolicy.requireProduct → InventoryScopeRepository.findProductInPharmacy | `src/modules/pharmacy_inventory/infrastructure/repositories/inventory-scope.repository.ts:73` |
| `pharmacy.pharmacy_sites` | LEE | LEE | DIRECTA | PharmacyDispensingController.dispense → MedicationDispensationsService.dispense → DispenseMedicationUseCase.execute → PharmacyInventoryScopePolicy.requireSite → InventoryScopeRepository.findSiteInPharmacy | `src/modules/pharmacy_inventory/infrastructure/repositories/inventory-scope.repository.ts:47` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | PharmacyDispensingController.dispense → MedicationDispensationsService.dispense → DispenseMedicationUseCase.execute → PharmacyInventoryScopePolicy.requirePatientContext → InventoryScopeRepository.patientExists | `src/modules/pharmacy_inventory/infrastructure/repositories/inventory-scope.repository.ts:111` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateDispensationDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `pharmacySiteId` | `string` | Sí | formato uuid | `@IsUUID()` | Sede de farmacia | `src/modules/pharmacy_inventory/presentation/dto/create-dispensation.dto.ts:74` |
| `patientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Paciente | `src/modules/pharmacy_inventory/presentation/dto/create-dispensation.dto.ts:81` |
| `medicationRequestId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Solicitud de medicación | `src/modules/pharmacy_inventory/presentation/dto/create-dispensation.dto.ts:92` |
| `inventoryReservationId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Reserva a consumir | `src/modules/pharmacy_inventory/presentation/dto/create-dispensation.dto.ts:100` |
| `idempotencyKey` | `string` | No | — | `@IsOptional()` | Clave de idempotencia | `src/modules/pharmacy_inventory/presentation/dto/create-dispensation.dto.ts:107` |
| `lines` | `array<DispensationLineDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => DispensationLineDto)` | — | `src/modules/pharmacy_inventory/presentation/dto/create-dispensation.dto.ts:117` |
| `lines[].pharmacyProductId` | `string` | Sí | formato uuid | `@IsUUID()` | Producto de farmacia | `src/modules/pharmacy_inventory/presentation/dto/create-dispensation.dto.ts:20` |
| `lines[].inventoryLocationId` | `string` | Sí | formato uuid | `@IsUUID()` | Ubicación desde donde se dispensa | `src/modules/pharmacy_inventory/presentation/dto/create-dispensation.dto.ts:30` |
| `lines[].inventoryLotId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Lote dispensado | `src/modules/pharmacy_inventory/presentation/dto/create-dispensation.dto.ts:38` |
| `lines[].dispensedQuantity` | `number` | Sí | mínimo 0 | `@IsNumber()` `@Min(0)` | Cantidad dispensada | `src/modules/pharmacy_inventory/presentation/dto/create-dispensation.dto.ts:46` |
| `lines[].patientAmount` | `number` | No | mínimo 0 | `@IsOptional()` `@IsNumber()` `@Min(0)` | Monto a cargo del paciente | `src/modules/pharmacy_inventory/presentation/dto/create-dispensation.dto.ts:55` |
| `lines[].insurerAmount` | `number` | No | mínimo 0 | `@IsOptional()` `@IsNumber()` `@Min(0)` | Monto a cargo del asegurador | `src/modules/pharmacy_inventory/presentation/dto/create-dispensation.dto.ts:64` |

**Payload mínimo** (sólo los obligatorios):

```json
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

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<MovementResponseDto>` · DTO `MovementResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | — | Identificador único de la instancia. | `src/modules/pharmacy_inventory/presentation/dto/responses.dto.ts:66` |
| `inventoryItemId` | `string` | Sí | — | — | Identificador asociado a inventory item. | sin fuente |
| `quantityOnHand` | `string` | Sí | — | — | Valor de quantity on hand mantenido por la instancia. | sin fuente |
| `recordedAt` | `string` | Sí | formato date-time | — | Valor de recorded at mantenido por la instancia. | sin fuente |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La reserva es un pedido de paciente: se dispensa con su código de retiro por POST /pharmacy/orders/:id/dispense; PreconditionFailedException: Stock insuficiente para dispensar |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharmacy_inventory.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / pharmacy inventory — etapa `ctrl:PharmacyDispensingController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 7. POST /pharmacy/{pharmacyId}/goods-receipts

- **Origen:** CONTRATO
- **Nombre:** Recepcionar mercancía por lote (UC-25-02)
- **Bloque:** Farmacia
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyProcurementController.receiveGoods` — `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-procurement.controller.ts:81`

### Qué es y para qué sirve (negocio)

Recepcionar mercancía por lote (UC-25-02). Dentro del módulo (descripción del modelo, en inglés): «Prevents overselling and untraceable adjustments under concurrent manual, API, dispensing and receiving operations.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_25_pharmacy_inventory.puml:20`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`POST /pharmacy/{pharmacyId}/goods-receipts` la atiende `PharmacyProcurementController.receiveGoods` (src/modules/pharmacy_inventory/presentation/controllers/pharmacy-procurement.controller.ts:81). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `PharmacyInventoryCreateGoodsReceiptDto` (14 campos, 8 obligatorios). Delega en `PharmacyProcurementService.receiveGoods`. Crea filas en pharmacy_inventory.inventory_ledger_entries, pharmacy_inventory.inventory_lots, pharmacy_inventory.inventory_stock_positions, pharmacy_inventory.pharmacy_goods_receipt_lines, pharmacy_inventory.pharmacy_goods_receipts. Actualiza pharmacy_inventory.inventory_stock_positions, pharmacy_inventory.pharmacy_purchase_order_lines, pharmacy_inventory.pharmacy_purchase_orders. Lee pharmacy_inventory.inventory_ledger_entries, pharmacy_inventory.inventory_locations, pharmacy_inventory.inventory_lots, pharmacy_inventory.inventory_stock_positions, pharmacy_inventory.pharmacy_goods_receipt_lines, pharmacy_inventory.pharmacy_goods_receipts, pharmacy_inventory.pharmacy_purchase_order_lines, pharmacy_inventory.pharmacy_purchase_orders y 3 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-procurement.controller.ts:81` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmacyId | `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-procurement.controller.ts:81` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharmacy_inventory.inventory_ledger_entries` | ESCRIBE | CREA | DIRECTA | PharmacyProcurementController.receiveGoods → PharmacyProcurementService.receiveGoods → PharmacyProcurementUseCases.receiveGoods → LedgerRepository.append | `src/modules/pharmacy_inventory/infrastructure/repositories/ledger.repository.ts:142` |
| `pharmacy_inventory.inventory_ledger_entries` | LEE | LEE | DIRECTA | PharmacyProcurementController.receiveGoods → PharmacyProcurementService.receiveGoods → PharmacyProcurementUseCases.receiveGoods → LedgerRepository.findEntryIdsBySource | `src/modules/pharmacy_inventory/infrastructure/repositories/ledger.repository.ts:125` |
| `pharmacy_inventory.inventory_locations` | LEE | LEE | DIRECTA | PharmacyProcurementController.receiveGoods → PharmacyProcurementService.receiveGoods → PharmacyProcurementUseCases.receiveGoods → PharmacyInventoryScopePolicy.requireLocation → InventoryScopeRepository.findLocationInSite | `src/modules/pharmacy_inventory/infrastructure/repositories/inventory-scope.repository.ts:56` |
| `pharmacy_inventory.inventory_lots` | ESCRIBE | CREA | DIRECTA | PharmacyProcurementController.receiveGoods → PharmacyProcurementService.receiveGoods → PharmacyProcurementUseCases.receiveGoods → LotsRepository.create | `src/modules/pharmacy_inventory/infrastructure/repositories/lots.repository.ts:69` |
| `pharmacy_inventory.inventory_lots` | LEE | LEE | DIRECTA | PharmacyProcurementController.receiveGoods → PharmacyProcurementService.receiveGoods → PharmacyProcurementUseCases.receiveGoods → LotsRepository.findByProductAndNumber | `src/modules/pharmacy_inventory/infrastructure/repositories/lots.repository.ts:58` |
| `pharmacy_inventory.inventory_stock_positions` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyProcurementController.receiveGoods → PharmacyProcurementService.receiveGoods → PharmacyProcurementUseCases.receiveGoods | `src/modules/pharmacy_inventory/application/pharmacy-procurement/pharmacy-procurement.use-cases.ts:373` |
| `pharmacy_inventory.inventory_stock_positions` | ESCRIBE | CREA | DIRECTA | PharmacyProcurementController.receiveGoods → PharmacyProcurementService.receiveGoods → PharmacyProcurementUseCases.receiveGoods → StockPositionsRepository.create | `src/modules/pharmacy_inventory/infrastructure/repositories/stock-positions.repository.ts:112` |
| `pharmacy_inventory.inventory_stock_positions` | LEE | LEE | DIRECTA | PharmacyProcurementController.receiveGoods → PharmacyProcurementService.receiveGoods → PharmacyProcurementUseCases.receiveGoods → StockPositionsRepository.findByKeyForUpdate | `src/modules/pharmacy_inventory/infrastructure/repositories/stock-positions.repository.ts:82` |
| `pharmacy_inventory.pharmacy_goods_receipt_lines` | ESCRIBE | CREA | DIRECTA | PharmacyProcurementController.receiveGoods → PharmacyProcurementService.receiveGoods → PharmacyProcurementUseCases.receiveGoods → GoodsReceiptsRepository.createLine | `src/modules/pharmacy_inventory/infrastructure/repositories/goods-receipts.repository.ts:166` |
| `pharmacy_inventory.pharmacy_goods_receipt_lines` | LEE | LEE | DIRECTA | PharmacyProcurementController.receiveGoods → PharmacyProcurementService.receiveGoods → PharmacyProcurementUseCases.receiveGoods → GoodsReceiptsRepository.findLines | `src/modules/pharmacy_inventory/infrastructure/repositories/goods-receipts.repository.ts:123` |
| `pharmacy_inventory.pharmacy_goods_receipts` | ESCRIBE | CREA | DIRECTA | PharmacyProcurementController.receiveGoods → PharmacyProcurementService.receiveGoods → PharmacyProcurementUseCases.receiveGoods → GoodsReceiptsRepository.create | `src/modules/pharmacy_inventory/infrastructure/repositories/goods-receipts.repository.ts:139` |
| `pharmacy_inventory.pharmacy_goods_receipts` | LEE | LEE | DIRECTA | PharmacyProcurementController.receiveGoods → PharmacyProcurementService.receiveGoods → PharmacyProcurementUseCases.receiveGoods → GoodsReceiptsRepository.findByIdempotencyKey | `src/modules/pharmacy_inventory/infrastructure/repositories/goods-receipts.repository.ts:115` |
| `pharmacy_inventory.pharmacy_purchase_order_lines` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyProcurementController.receiveGoods → PharmacyProcurementService.receiveGoods → PharmacyProcurementUseCases.receiveGoods | `src/modules/pharmacy_inventory/application/pharmacy-procurement/pharmacy-procurement.use-cases.ts:405` |
| `pharmacy_inventory.pharmacy_purchase_order_lines` | LEE | LEE | DIRECTA | PharmacyProcurementController.receiveGoods → PharmacyProcurementService.receiveGoods → PharmacyProcurementUseCases.receiveGoods → PurchaseOrdersRepository.findLineById | `src/modules/pharmacy_inventory/infrastructure/repositories/purchase-orders.repository.ts:134` |
| `pharmacy_inventory.pharmacy_purchase_orders` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyProcurementController.receiveGoods → PharmacyProcurementService.receiveGoods → PharmacyProcurementUseCases.receiveGoods | `src/modules/pharmacy_inventory/application/pharmacy-procurement/pharmacy-procurement.use-cases.ts:415` |
| `pharmacy_inventory.pharmacy_purchase_orders` | LEE | LEE | DIRECTA | PharmacyProcurementController.receiveGoods → PharmacyProcurementService.receiveGoods → PharmacyProcurementUseCases.receiveGoods → PurchaseOrdersRepository.findById | `src/modules/pharmacy_inventory/infrastructure/repositories/purchase-orders.repository.ts:95` |
| `pharmacy.pharmacies` | LEE | LEE | DIRECTA | PharmacyProcurementController.receiveGoods → PharmacyProcurementService.receiveGoods → PharmacyProcurementUseCases.receiveGoods → PharmacyInventoryScopePolicy.requireManagedPharmacy → InventoryScopeRepository.findPharmacyInTenant | `src/modules/pharmacy_inventory/infrastructure/repositories/inventory-scope.repository.ts:33` |
| `pharmacy.pharmacy_products` | LEE | LEE | DIRECTA | PharmacyProcurementController.receiveGoods → PharmacyProcurementService.receiveGoods → PharmacyProcurementUseCases.receiveGoods → PharmacyInventoryScopePolicy.requireProduct → InventoryScopeRepository.findProductInPharmacy | `src/modules/pharmacy_inventory/infrastructure/repositories/inventory-scope.repository.ts:73` |
| `pharmacy.pharmacy_sites` | LEE | LEE | DIRECTA | PharmacyProcurementController.receiveGoods → PharmacyProcurementService.receiveGoods → PharmacyProcurementUseCases.receiveGoods → PharmacyInventoryScopePolicy.requireSite → InventoryScopeRepository.findSiteInPharmacy | `src/modules/pharmacy_inventory/infrastructure/repositories/inventory-scope.repository.ts:47` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | — |

### Cuerpo — DTO `PharmacyInventoryCreateGoodsReceiptDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `pharmacyPurchaseOrderId` | `string` | Sí | formato uuid | `@IsUUID()` | Orden de compra a recepcionar | `src/modules/pharmacy_inventory/presentation/dto/create-goods-receipt.dto.ts:98` |
| `pharmacySiteId` | `string` | Sí | formato uuid | `@IsUUID()` | Sede de farmacia | `src/modules/pharmacy_inventory/presentation/dto/create-goods-receipt.dto.ts:105` |
| `inventoryLocationId` | `string` | Sí | formato uuid | `@IsUUID()` | Ubicación destino del stock | `src/modules/pharmacy_inventory/presentation/dto/create-goods-receipt.dto.ts:112` |
| `supplierDeliveryReference` | `string` | No | longitud máxima 128 | `@IsOptional()` `@IsString()` `@MaxLength(128)` | Referencia de entrega del proveedor | `src/modules/pharmacy_inventory/presentation/dto/create-goods-receipt.dto.ts:121` |
| `idempotencyKey` | `string` | No | longitud máxima 128 | `@IsOptional()` `@IsString()` `@MaxLength(128)` | Clave de idempotencia | `src/modules/pharmacy_inventory/presentation/dto/create-goods-receipt.dto.ts:130` |
| `lines` | `array<GoodsReceiptLineDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => GoodsReceiptLineDto)` | — | `src/modules/pharmacy_inventory/presentation/dto/create-goods-receipt.dto.ts:140` |
| `lines[].pharmacyPurchaseOrderLineId` | `string` | Sí | formato uuid | `@IsUUID()` | Línea de la orden de compra | `src/modules/pharmacy_inventory/presentation/dto/create-goods-receipt.dto.ts:23` |
| `lines[].pharmacyProductId` | `string` | Sí | formato uuid | `@IsUUID()` | Producto de farmacia | `src/modules/pharmacy_inventory/presentation/dto/create-goods-receipt.dto.ts:30` |
| `lines[].lotNumber` | `string` | Sí | longitud máxima 128 | `@IsString()` `@MaxLength(128)` | Número de lote recibido | `src/modules/pharmacy_inventory/presentation/dto/create-goods-receipt.dto.ts:38` |
| `lines[].receivedQuantity` | `number` | Sí | mínimo 0 | `@IsNumber()` `@Min(0)` | Cantidad recibida | `src/modules/pharmacy_inventory/presentation/dto/create-goods-receipt.dto.ts:46` |
| `lines[].acceptedQuantity` | `number` | No | mínimo 0 | `@IsOptional()` `@IsNumber()` `@Min(0)` | Cantidad aceptada (default = recibida) | `src/modules/pharmacy_inventory/presentation/dto/create-goods-receipt.dto.ts:58` |
| `lines[].rejectedQuantity` | `number` | No | mínimo 0 | `@IsOptional()` `@IsNumber()` `@Min(0)` | Cantidad rechazada | `src/modules/pharmacy_inventory/presentation/dto/create-goods-receipt.dto.ts:67` |
| `lines[].unitCostAmount` | `number` | No | mínimo 0 | `@IsOptional()` `@IsNumber()` `@Min(0)` | Costo unitario | `src/modules/pharmacy_inventory/presentation/dto/create-goods-receipt.dto.ts:76` |
| `lines[].expiresAt` | `string` | No | formato date | `@IsOptional()` `@IsISO8601()` | Fecha de expiración del lote (ISO) | `src/modules/pharmacy_inventory/presentation/dto/create-goods-receipt.dto.ts:87` |

**Payload mínimo** (sólo los obligatorios):

```json
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

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<GoodsReceiptResponseDto>` · DTO `GoodsReceiptResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/pharmacy_inventory/presentation/dto/responses.dto.ts:39` |
| `receiptNumber` | `string` | Sí | — | — | Valor de receipt number mantenido por la instancia. | `src/modules/pharmacy_inventory/presentation/dto/responses.dto.ts:45` |
| `lotIds` | `array<string>` | Sí | — | — | Ids de lotes afectados | `src/modules/pharmacy_inventory/presentation/dto/responses.dto.ts:51` |
| `ledgerEntryIds` | `array<string>` | Sí | — | — | Ids de asientos del ledger | `src/modules/pharmacy_inventory/presentation/dto/responses.dto.ts:57` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La orden no admite recepción |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharmacy_inventory.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / pharmacy inventory — etapa `ctrl:PharmacyProcurementController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 8. POST /pharmacy/{pharmacyId}/purchase-orders

- **Origen:** CONTRATO
- **Nombre:** Emitir una orden de compra a proveedor (UC-25-01)
- **Bloque:** Farmacia
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyProcurementController.createPurchaseOrder` — `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-procurement.controller.ts:61`

### Qué es y para qué sirve (negocio)

Emitir una orden de compra a proveedor (UC-25-01). Dentro del módulo (descripción del modelo, en inglés): «Prevents overselling and untraceable adjustments under concurrent manual, API, dispensing and receiving operations.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_25_pharmacy_inventory.puml:20`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`POST /pharmacy/{pharmacyId}/purchase-orders` la atiende `PharmacyProcurementController.createPurchaseOrder` (src/modules/pharmacy_inventory/presentation/controllers/pharmacy-procurement.controller.ts:61). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `PharmacyInventoryCreatePurchaseOrderDto` (8 campos, 5 obligatorios). Delega en `PharmacyProcurementService.createPurchaseOrder`. Crea filas en pharmacy_inventory.pharmacy_purchase_order_lines, pharmacy_inventory.pharmacy_purchase_orders. Lee pharmacy_inventory.pharmacy_purchase_order_lines, pharmacy_inventory.pharmacy_purchase_orders, pharmacy_inventory.pharmacy_suppliers, pharmacy.pharmacies, pharmacy.pharmacy_products, pharmacy.pharmacy_sites.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-procurement.controller.ts:61` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmacyId | `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-procurement.controller.ts:61` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharmacy_inventory.pharmacy_purchase_order_lines` | ESCRIBE | CREA | DIRECTA | PharmacyProcurementController.createPurchaseOrder → PharmacyProcurementService.createPurchaseOrder → PharmacyProcurementUseCases.createPurchaseOrder → PurchaseOrdersRepository.createLine | `src/modules/pharmacy_inventory/infrastructure/repositories/purchase-orders.repository.ts:177` |
| `pharmacy_inventory.pharmacy_purchase_order_lines` | LEE | LEE | DIRECTA | PharmacyProcurementController.createPurchaseOrder → PharmacyProcurementService.createPurchaseOrder → PharmacyProcurementUseCases.createPurchaseOrder → PurchaseOrdersRepository.findLinesByOrder | `src/modules/pharmacy_inventory/infrastructure/repositories/purchase-orders.repository.ts:118` |
| `pharmacy_inventory.pharmacy_purchase_orders` | ESCRIBE | CREA | DIRECTA | PharmacyProcurementController.createPurchaseOrder → PharmacyProcurementService.createPurchaseOrder → PharmacyProcurementUseCases.createPurchaseOrder → PurchaseOrdersRepository.create | `src/modules/pharmacy_inventory/infrastructure/repositories/purchase-orders.repository.ts:148` |
| `pharmacy_inventory.pharmacy_purchase_orders` | LEE | LEE | DIRECTA | PharmacyProcurementController.createPurchaseOrder → PharmacyProcurementService.createPurchaseOrder → PharmacyProcurementUseCases.createPurchaseOrder → PurchaseOrdersRepository.findByIdempotencyKey | `src/modules/pharmacy_inventory/infrastructure/repositories/purchase-orders.repository.ts:104` |
| `pharmacy_inventory.pharmacy_suppliers` | LEE | LEE | DIRECTA | PharmacyProcurementController.createPurchaseOrder → PharmacyProcurementService.createPurchaseOrder → PharmacyProcurementUseCases.createPurchaseOrder → SuppliersRepository.findById | `src/modules/pharmacy_inventory/infrastructure/repositories/suppliers.repository.ts:49` |
| `pharmacy.pharmacies` | LEE | LEE | DIRECTA | PharmacyProcurementController.createPurchaseOrder → PharmacyProcurementService.createPurchaseOrder → PharmacyProcurementUseCases.createPurchaseOrder → PharmacyInventoryScopePolicy.requireManagedPharmacy → InventoryScopeRepository.findPharmacyInTenant | `src/modules/pharmacy_inventory/infrastructure/repositories/inventory-scope.repository.ts:33` |
| `pharmacy.pharmacy_products` | LEE | LEE | DIRECTA | PharmacyProcurementController.createPurchaseOrder → PharmacyProcurementService.createPurchaseOrder → PharmacyProcurementUseCases.createPurchaseOrder → PharmacyInventoryScopePolicy.requireProduct → InventoryScopeRepository.findProductInPharmacy | `src/modules/pharmacy_inventory/infrastructure/repositories/inventory-scope.repository.ts:73` |
| `pharmacy.pharmacy_sites` | LEE | LEE | DIRECTA | PharmacyProcurementController.createPurchaseOrder → PharmacyProcurementService.createPurchaseOrder → PharmacyProcurementUseCases.createPurchaseOrder → PharmacyInventoryScopePolicy.requireSite → InventoryScopeRepository.findSiteInPharmacy | `src/modules/pharmacy_inventory/infrastructure/repositories/inventory-scope.repository.ts:47` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | — |

### Cuerpo — DTO `PharmacyInventoryCreatePurchaseOrderDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `pharmacySiteId` | `string` | Sí | formato uuid | `@IsUUID()` | Sede de farmacia (pharmacy_sites) | `src/modules/pharmacy_inventory/presentation/dto/create-purchase-order.dto.ts:53` |
| `pharmacySupplierId` | `string` | Sí | formato uuid | `@IsUUID()` | Proveedor (pharmacy_suppliers) | `src/modules/pharmacy_inventory/presentation/dto/create-purchase-order.dto.ts:63` |
| `purchaseOrderNumber` | `string` | No | longitud máxima 64 | `@IsOptional()` `@IsString()` `@MaxLength(64)` | Número de orden; se autogenera si se omite | `src/modules/pharmacy_inventory/presentation/dto/create-purchase-order.dto.ts:74` |
| `idempotencyKey` | `string` | No | longitud máxima 128 | `@IsOptional()` `@IsString()` `@MaxLength(128)` | Clave de idempotencia | `src/modules/pharmacy_inventory/presentation/dto/create-purchase-order.dto.ts:83` |
| `lines` | `array<PurchaseOrderLineDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => PurchaseOrderLineDto)` | — | `src/modules/pharmacy_inventory/presentation/dto/create-purchase-order.dto.ts:93` |
| `lines[].pharmacyProductId` | `string` | Sí | formato uuid | `@IsUUID()` | Producto de farmacia | `src/modules/pharmacy_inventory/presentation/dto/create-purchase-order.dto.ts:22` |
| `lines[].orderedQuantity` | `number` | Sí | mínimo 0 | `@IsNumber()` `@Min(0)` | Cantidad ordenada | `src/modules/pharmacy_inventory/presentation/dto/create-purchase-order.dto.ts:30` |
| `lines[].unitCostAmount` | `number` | No | mínimo 0 | `@IsOptional()` `@IsNumber()` `@Min(0)` | Costo unitario | `src/modules/pharmacy_inventory/presentation/dto/create-purchase-order.dto.ts:39` |

**Payload mínimo** (sólo los obligatorios):

```json
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

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<PurchaseOrderResponseDto>` · DTO `PurchaseOrderResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/pharmacy_inventory/presentation/dto/responses.dto.ts:18` |
| `purchaseOrderNumber` | `string` | Sí | — | — | Valor de purchase order number mantenido por la instancia. | `src/modules/pharmacy_inventory/presentation/dto/responses.dto.ts:24` |
| `lineIds` | `array<string>` | Sí | — | — | Ids de las líneas creadas | `src/modules/pharmacy_inventory/presentation/dto/responses.dto.ts:30` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El proveedor no está activo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharmacy_inventory.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / pharmacy inventory — etapa `ctrl:PharmacyProcurementController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 9. POST /pharmacy/{pharmacyId}/reservations

- **Origen:** CONTRATO
- **Nombre:** Reservar stock para una prescripción (UC-25-04)
- **Bloque:** Farmacia
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyInventoryController.reserve` — `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-inventory.controller.ts:84`

### Qué es y para qué sirve (negocio)

Reservar stock para una prescripción (UC-25-04). Dentro del módulo (descripción del modelo, en inglés): «Prevents overselling and untraceable adjustments under concurrent manual, API, dispensing and receiving operations.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_25_pharmacy_inventory.puml:20`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`POST /pharmacy/{pharmacyId}/reservations` la atiende `PharmacyInventoryController.reserve` (src/modules/pharmacy_inventory/presentation/controllers/pharmacy-inventory.controller.ts:84). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateReservationDto` (10 campos, 5 obligatorios). Delega en `InventoryReservationsService.reserve`. Crea filas en pharmacy_inventory.inventory_ledger_entries, pharmacy_inventory.inventory_reservation_lines, pharmacy_inventory.inventory_reservations. Lee clinical.medication_requests, pharmacy_inventory.inventory_ledger_entries, pharmacy_inventory.inventory_locations, pharmacy_inventory.inventory_lots, pharmacy_inventory.inventory_reservations, pharmacy_inventory.inventory_stock_positions, pharmacy.pharmacies, pharmacy.pharmacy_products y 2 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-inventory.controller.ts:84` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmacyId | `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-inventory.controller.ts:84` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.medication_requests` | LEE | LEE | DIRECTA | PharmacyInventoryController.reserve → InventoryReservationsService.reserve → ReserveInventoryUseCase.execute → PharmacyInventoryScopePolicy.requirePatientContext → InventoryScopeRepository.patientServedByPharmacy | `src/modules/pharmacy_inventory/infrastructure/repositories/inventory-scope.repository.ts:127` |
| `pharmacy_inventory.inventory_ledger_entries` | ESCRIBE | CREA | DIRECTA | PharmacyInventoryController.reserve → InventoryReservationsService.reserve → ReserveInventoryUseCase.execute → LedgerRepository.append | `src/modules/pharmacy_inventory/infrastructure/repositories/ledger.repository.ts:142` |
| `pharmacy_inventory.inventory_ledger_entries` | LEE | LEE | POR_SQL | PharmacyInventoryController.reserve → InventoryReservationsService.reserve → ReserveInventoryUseCase.execute → LedgerRepository.nextSequence | `src/modules/pharmacy_inventory/infrastructure/repositories/ledger.repository.ts:113` |
| `pharmacy_inventory.inventory_locations` | LEE | LEE | DIRECTA | PharmacyInventoryController.reserve → InventoryReservationsService.reserve → ReserveInventoryUseCase.execute → PharmacyInventoryScopePolicy.requireStockKey → PharmacyInventoryScopePolicy.requireLocation → InventoryScopeRepository.findLocationInSite | `src/modules/pharmacy_inventory/infrastructure/repositories/inventory-scope.repository.ts:56` |
| `pharmacy_inventory.inventory_lots` | LEE | LEE | DIRECTA | PharmacyInventoryController.reserve → InventoryReservationsService.reserve → ReserveInventoryUseCase.execute → PharmacyInventoryScopePolicy.requireStockKey → PharmacyInventoryScopePolicy.requireLot → InventoryScopeRepository.findLot | `src/modules/pharmacy_inventory/infrastructure/repositories/inventory-scope.repository.ts:86` |
| `pharmacy_inventory.inventory_reservation_lines` | ESCRIBE | CREA | DIRECTA | PharmacyInventoryController.reserve → InventoryReservationsService.reserve → ReserveInventoryUseCase.execute → ReservationsRepository.createLine | `src/modules/pharmacy_inventory/infrastructure/repositories/reservations.repository.ts:188` |
| `pharmacy_inventory.inventory_reservations` | ESCRIBE | CREA | DIRECTA | PharmacyInventoryController.reserve → InventoryReservationsService.reserve → ReserveInventoryUseCase.execute → ReservationsRepository.create | `src/modules/pharmacy_inventory/infrastructure/repositories/reservations.repository.ts:158` |
| `pharmacy_inventory.inventory_reservations` | LEE | LEE | DIRECTA | PharmacyInventoryController.reserve → InventoryReservationsService.reserve → ReserveInventoryUseCase.execute → PharmacyInventoryScopePolicy.requirePatientContext → InventoryScopeRepository.patientServedByPharmacy | `src/modules/pharmacy_inventory/infrastructure/repositories/inventory-scope.repository.ts:133` |
| `pharmacy_inventory.inventory_stock_positions` | LEE | LEE | DIRECTA | PharmacyInventoryController.reserve → InventoryReservationsService.reserve → ReserveInventoryUseCase.execute → StockPositionsRepository.findByKeyForUpdate | `src/modules/pharmacy_inventory/infrastructure/repositories/stock-positions.repository.ts:82` |
| `pharmacy.pharmacies` | LEE | LEE | DIRECTA | PharmacyInventoryController.reserve → InventoryReservationsService.reserve → ReserveInventoryUseCase.execute → PharmacyInventoryScopePolicy.requireManagedPharmacy → InventoryScopeRepository.findPharmacyInTenant | `src/modules/pharmacy_inventory/infrastructure/repositories/inventory-scope.repository.ts:33` |
| `pharmacy.pharmacy_products` | LEE | LEE | DIRECTA | PharmacyInventoryController.reserve → InventoryReservationsService.reserve → ReserveInventoryUseCase.execute → PharmacyInventoryScopePolicy.requireStockKey → PharmacyInventoryScopePolicy.requireProduct → InventoryScopeRepository.findProductInPharmacy | `src/modules/pharmacy_inventory/infrastructure/repositories/inventory-scope.repository.ts:73` |
| `pharmacy.pharmacy_sites` | LEE | LEE | DIRECTA | PharmacyInventoryController.reserve → InventoryReservationsService.reserve → ReserveInventoryUseCase.execute → PharmacyInventoryScopePolicy.requireSite → InventoryScopeRepository.findSiteInPharmacy | `src/modules/pharmacy_inventory/infrastructure/repositories/inventory-scope.repository.ts:47` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | PharmacyInventoryController.reserve → InventoryReservationsService.reserve → ReserveInventoryUseCase.execute → PharmacyInventoryScopePolicy.requirePatientContext → InventoryScopeRepository.patientExists | `src/modules/pharmacy_inventory/infrastructure/repositories/inventory-scope.repository.ts:111` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateReservationDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `pharmacySiteId` | `string` | Sí | formato uuid | `@IsUUID()` | Sede de farmacia | `src/modules/pharmacy_inventory/presentation/dto/create-reservation.dto.ts:54` |
| `patientProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Paciente | `src/modules/pharmacy_inventory/presentation/dto/create-reservation.dto.ts:62` |
| `medicationRequestId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Solicitud de medicación | `src/modules/pharmacy_inventory/presentation/dto/create-reservation.dto.ts:73` |
| `quotationId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Cotización asociada | `src/modules/pharmacy_inventory/presentation/dto/create-reservation.dto.ts:81` |
| `expiresInMinutes` | `number` | No | mínimo 1 | `@IsOptional()` `@IsInt()` `@Min(1)` | Minutos hasta expiración (default 60) | `src/modules/pharmacy_inventory/presentation/dto/create-reservation.dto.ts:93` |
| `lines` | `array<ReservationLineDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => ReservationLineDto)` | — | `src/modules/pharmacy_inventory/presentation/dto/create-reservation.dto.ts:103` |
| `lines[].pharmacyProductId` | `string` | Sí | formato uuid | `@IsUUID()` | Producto de farmacia | `src/modules/pharmacy_inventory/presentation/dto/create-reservation.dto.ts:21` |
| `lines[].inventoryLocationId` | `string` | Sí | formato uuid | `@IsUUID()` | Ubicación de inventario | `src/modules/pharmacy_inventory/presentation/dto/create-reservation.dto.ts:28` |
| `lines[].inventoryLotId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Lote específico | `src/modules/pharmacy_inventory/presentation/dto/create-reservation.dto.ts:36` |
| `lines[].requestedQuantity` | `number` | Sí | mínimo 0 | `@IsNumber()` `@Min(0)` | Cantidad solicitada | `src/modules/pharmacy_inventory/presentation/dto/create-reservation.dto.ts:44` |

**Payload mínimo** (sólo los obligatorios):

```json
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

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<MovementResponseDto>` · DTO `MovementResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | — | Identificador único de la instancia. | `src/modules/pharmacy_inventory/presentation/dto/responses.dto.ts:66` |
| `inventoryItemId` | `string` | Sí | — | — | Identificador asociado a inventory item. | sin fuente |
| `quantityOnHand` | `string` | Sí | — | — | Valor de quantity on hand mantenido por la instancia. | sin fuente |
| `recordedAt` | `string` | Sí | formato date-time | — | Valor de recorded at mantenido por la instancia. | sin fuente |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Stock disponible insuficiente para reservar |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharmacy_inventory.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / pharmacy inventory — etapa `ctrl:PharmacyInventoryController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 10. POST /pharmacy/{pharmacyId}/suppliers

- **Origen:** CONTRATO
- **Nombre:** Registrar un proveedor de farmacia
- **Bloque:** Farmacia
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyProcurementController.createSupplier` — `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-procurement.controller.ts:43`

### Qué es y para qué sirve (negocio)

Registrar un proveedor de farmacia. Dentro del módulo (descripción del modelo, en inglés): «Prevents overselling and untraceable adjustments under concurrent manual, API, dispensing and receiving operations.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_25_pharmacy_inventory.puml:20`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`POST /pharmacy/{pharmacyId}/suppliers` la atiende `PharmacyProcurementController.createSupplier` (src/modules/pharmacy_inventory/presentation/controllers/pharmacy-procurement.controller.ts:43). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateSupplierDto` (3 campos, 1 obligatorio). Delega en `PharmacyProcurementService.createSupplier`. Crea filas en pharmacy_inventory.pharmacy_suppliers. Lee pharmacy.pharmacies.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-procurement.controller.ts:43` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmacyId | `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-procurement.controller.ts:43` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharmacy_inventory.pharmacy_suppliers` | ESCRIBE | CREA | DIRECTA | PharmacyProcurementController.createSupplier → PharmacyProcurementService.createSupplier → PharmacyProcurementUseCases.createSupplier → SuppliersRepository.create | `src/modules/pharmacy_inventory/infrastructure/repositories/suppliers.repository.ts:60` |
| `pharmacy.pharmacies` | LEE | LEE | DIRECTA | PharmacyProcurementController.createSupplier → PharmacyProcurementService.createSupplier → PharmacyProcurementUseCases.createSupplier → PharmacyInventoryScopePolicy.requireManagedPharmacy → InventoryScopeRepository.findPharmacyInTenant | `src/modules/pharmacy_inventory/infrastructure/repositories/inventory-scope.repository.ts:33` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateSupplierDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `supplierTenantId` | `string` | Sí | formato uuid | `@IsUUID()` | Tenant del proveedor (directory.tenants) | `src/modules/pharmacy_inventory/presentation/dto/create-supplier.dto.ts:14` |
| `supplierCode` | `string` | No | longitud máxima 64 | `@IsOptional()` `@IsString()` `@MaxLength(64)` | Código interno del proveedor | `src/modules/pharmacy_inventory/presentation/dto/create-supplier.dto.ts:23` |
| `businessPartnerId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Business partner ERP | `src/modules/pharmacy_inventory/presentation/dto/create-supplier.dto.ts:31` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "supplierTenantId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "supplierTenantId": "00000000-0000-4000-8000-000000000001",
  "supplierCode": "CODIGO_EJEMPLO",
  "businessPartnerId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<IdResponseDto>` · DTO `IdResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/pharmacy_inventory/presentation/dto/responses.dto.ts:9` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharmacy_inventory.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / pharmacy inventory — etapa `ctrl:PharmacyProcurementController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 11. POST /pharmacy/{pharmacyId}/transfers

- **Origen:** CONTRATO
- **Nombre:** Transferir stock entre ubicaciones (UC-25-10)
- **Bloque:** Farmacia
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyInventoryController.transfer` — `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-inventory.controller.ts:102`

### Qué es y para qué sirve (negocio)

Transferir stock entre ubicaciones (UC-25-10). Dentro del módulo (descripción del modelo, en inglés): «Prevents overselling and untraceable adjustments under concurrent manual, API, dispensing and receiving operations.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_25_pharmacy_inventory.puml:20`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`POST /pharmacy/{pharmacyId}/transfers` la atiende `PharmacyInventoryController.transfer` (src/modules/pharmacy_inventory/presentation/controllers/pharmacy-inventory.controller.ts:102). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateTransferDto` (6 campos, 5 obligatorios). Delega en `InventoryTransfersService.transfer`. Crea filas en pharmacy_inventory.inventory_ledger_entries, pharmacy_inventory.inventory_stock_positions. Actualiza pharmacy_inventory.inventory_stock_positions. Lee pharmacy_inventory.inventory_ledger_entries, pharmacy_inventory.inventory_locations, pharmacy_inventory.inventory_lots, pharmacy_inventory.inventory_stock_positions, pharmacy.pharmacies, pharmacy.pharmacy_products, pharmacy.pharmacy_sites.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-inventory.controller.ts:102` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmacyId | `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-inventory.controller.ts:102` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharmacy_inventory.inventory_ledger_entries` | ESCRIBE | CREA | DIRECTA | PharmacyInventoryController.transfer → InventoryTransfersService.transfer → TransferInventoryUseCase.execute → LedgerRepository.append | `src/modules/pharmacy_inventory/infrastructure/repositories/ledger.repository.ts:142` |
| `pharmacy_inventory.inventory_ledger_entries` | LEE | LEE | POR_SQL | PharmacyInventoryController.transfer → InventoryTransfersService.transfer → TransferInventoryUseCase.execute → LedgerRepository.nextSequence | `src/modules/pharmacy_inventory/infrastructure/repositories/ledger.repository.ts:113` |
| `pharmacy_inventory.inventory_locations` | LEE | LEE | DIRECTA | PharmacyInventoryController.transfer → InventoryTransfersService.transfer → TransferInventoryUseCase.execute → PharmacyInventoryScopePolicy.requireLocationInPharmacy → InventoryScopeRepository.findLocation | `src/modules/pharmacy_inventory/infrastructure/repositories/inventory-scope.repository.ts:64` |
| `pharmacy_inventory.inventory_lots` | LEE | LEE | DIRECTA | PharmacyInventoryController.transfer → InventoryTransfersService.transfer → TransferInventoryUseCase.execute → PharmacyInventoryScopePolicy.requireLot → InventoryScopeRepository.findLot | `src/modules/pharmacy_inventory/infrastructure/repositories/inventory-scope.repository.ts:86` |
| `pharmacy_inventory.inventory_stock_positions` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyInventoryController.transfer → InventoryTransfersService.transfer → TransferInventoryUseCase.execute | `src/modules/pharmacy_inventory/application/inventory-transfers/transfer-inventory.use-case.ts:125` |
| `pharmacy_inventory.inventory_stock_positions` | ESCRIBE | CREA | DIRECTA | PharmacyInventoryController.transfer → InventoryTransfersService.transfer → TransferInventoryUseCase.execute → StockPositionsRepository.create | `src/modules/pharmacy_inventory/infrastructure/repositories/stock-positions.repository.ts:112` |
| `pharmacy_inventory.inventory_stock_positions` | LEE | LEE | DIRECTA | PharmacyInventoryController.transfer → InventoryTransfersService.transfer → TransferInventoryUseCase.execute → StockPositionsRepository.findByKeyForUpdate | `src/modules/pharmacy_inventory/infrastructure/repositories/stock-positions.repository.ts:82` |
| `pharmacy.pharmacies` | LEE | LEE | DIRECTA | PharmacyInventoryController.transfer → InventoryTransfersService.transfer → TransferInventoryUseCase.execute → PharmacyInventoryScopePolicy.requireManagedPharmacy → InventoryScopeRepository.findPharmacyInTenant | `src/modules/pharmacy_inventory/infrastructure/repositories/inventory-scope.repository.ts:33` |
| `pharmacy.pharmacy_products` | LEE | LEE | DIRECTA | PharmacyInventoryController.transfer → InventoryTransfersService.transfer → TransferInventoryUseCase.execute → PharmacyInventoryScopePolicy.requireProduct → InventoryScopeRepository.findProductInPharmacy | `src/modules/pharmacy_inventory/infrastructure/repositories/inventory-scope.repository.ts:73` |
| `pharmacy.pharmacy_sites` | LEE | LEE | DIRECTA | PharmacyInventoryController.transfer → InventoryTransfersService.transfer → TransferInventoryUseCase.execute → PharmacyInventoryScopePolicy.requireSite → InventoryScopeRepository.findSiteInPharmacy | `src/modules/pharmacy_inventory/infrastructure/repositories/inventory-scope.repository.ts:47` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateTransferDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `pharmacySiteId` | `string` | Sí | formato uuid | `@IsUUID()` | Sede de farmacia | `src/modules/pharmacy_inventory/presentation/dto/create-transfer.dto.ts:11` |
| `pharmacyProductId` | `string` | Sí | formato uuid | `@IsUUID()` | Producto de farmacia | `src/modules/pharmacy_inventory/presentation/dto/create-transfer.dto.ts:18` |
| `fromLocationId` | `string` | Sí | formato uuid | `@IsUUID()` | Ubicación origen | `src/modules/pharmacy_inventory/presentation/dto/create-transfer.dto.ts:25` |
| `toLocationId` | `string` | Sí | formato uuid | `@IsUUID()` | Ubicación destino | `src/modules/pharmacy_inventory/presentation/dto/create-transfer.dto.ts:32` |
| `inventoryLotId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Lote específico | `src/modules/pharmacy_inventory/presentation/dto/create-transfer.dto.ts:40` |
| `quantity` | `number` | Sí | mínimo 0 | `@IsNumber()` `@Min(0)` | Cantidad a transferir | `src/modules/pharmacy_inventory/presentation/dto/create-transfer.dto.ts:48` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "pharmacySiteId": "00000000-0000-4000-8000-000000000001",
  "pharmacyProductId": "00000000-0000-4000-8000-000000000001",
  "fromLocationId": "00000000-0000-4000-8000-000000000001",
  "toLocationId": "00000000-0000-4000-8000-000000000001",
  "quantity": 1
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "pharmacySiteId": "00000000-0000-4000-8000-000000000001",
  "pharmacyProductId": "00000000-0000-4000-8000-000000000001",
  "fromLocationId": "00000000-0000-4000-8000-000000000001",
  "toLocationId": "00000000-0000-4000-8000-000000000001",
  "inventoryLotId": "00000000-0000-4000-8000-000000000001",
  "quantity": 1
}
```

</details>

### Respuesta — `Promise<TransferResponseDto>` · DTO `TransferResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `correlationId` | `string` | Sí | formato uuid | — | Identificador asociado a correlation. | `src/modules/pharmacy_inventory/presentation/dto/responses.dto.ts:108` |
| `outLedgerEntryId` | `string` | Sí | formato uuid | — | Identificador asociado a out ledger entry. | `src/modules/pharmacy_inventory/presentation/dto/responses.dto.ts:114` |
| `inLedgerEntryId` | `string` | Sí | formato uuid | — | Identificador asociado a in ledger entry. | `src/modules/pharmacy_inventory/presentation/dto/responses.dto.ts:120` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Stock disponible insuficiente en origen |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharmacy_inventory.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / pharmacy inventory — etapa `ctrl:PharmacyInventoryController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 12. POST /pharmacy/{siteId}/count-sessions

- **Origen:** CONTRATO
- **Nombre:** Iniciar y congelar una sesión de conteo (UC-25-06)
- **Bloque:** Farmacia
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyInventoryController.openCountSession` — `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-inventory.controller.ts:119`

### Qué es y para qué sirve (negocio)

Iniciar y congelar una sesión de conteo (UC-25-06). Dentro del módulo (descripción del modelo, en inglés): «Prevents overselling and untraceable adjustments under concurrent manual, API, dispensing and receiving operations.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_25_pharmacy_inventory.puml:20`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`POST /pharmacy/{siteId}/count-sessions` la atiende `PharmacyInventoryController.openCountSession` (src/modules/pharmacy_inventory/presentation/controllers/pharmacy-inventory.controller.ts:119). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateCountSessionDto` (5 campos, 3 obligatorios). Delega en `InventoryCountService.openSession`. Crea filas en pharmacy_inventory.inventory_count_lines, pharmacy_inventory.inventory_count_sessions. Lee pharmacy_inventory.inventory_count_sessions, pharmacy_inventory.inventory_locations, pharmacy_inventory.inventory_lots, pharmacy_inventory.inventory_stock_positions, pharmacy.pharmacies, pharmacy.pharmacy_products, pharmacy.pharmacy_sites.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-inventory.controller.ts:119` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: siteId | `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-inventory.controller.ts:119` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharmacy_inventory.inventory_count_lines` | ESCRIBE | CREA | DIRECTA | PharmacyInventoryController.openCountSession → InventoryCountService.openSession → OpenInventoryCountUseCase.execute → CountSessionsRepository.createLine | `src/modules/pharmacy_inventory/infrastructure/repositories/count-sessions.repository.ts:168` |
| `pharmacy_inventory.inventory_count_sessions` | ESCRIBE | CREA | DIRECTA | PharmacyInventoryController.openCountSession → InventoryCountService.openSession → OpenInventoryCountUseCase.execute → CountSessionsRepository.create | `src/modules/pharmacy_inventory/infrastructure/repositories/count-sessions.repository.ts:142` |
| `pharmacy_inventory.inventory_count_sessions` | LEE | LEE | DIRECTA | PharmacyInventoryController.openCountSession → InventoryCountService.openSession → OpenInventoryCountUseCase.execute → CountSessionsRepository.countOpenAtLocation | `src/modules/pharmacy_inventory/infrastructure/repositories/count-sessions.repository.ts:97` |
| `pharmacy_inventory.inventory_locations` | LEE | LEE | DIRECTA | PharmacyInventoryController.openCountSession → InventoryCountService.openSession → OpenInventoryCountUseCase.execute → PharmacyInventoryScopePolicy.requireLocation → InventoryScopeRepository.findLocationInSite | `src/modules/pharmacy_inventory/infrastructure/repositories/inventory-scope.repository.ts:56` |
| `pharmacy_inventory.inventory_lots` | LEE | LEE | DIRECTA | PharmacyInventoryController.openCountSession → InventoryCountService.openSession → OpenInventoryCountUseCase.execute → PharmacyInventoryScopePolicy.requireLot → InventoryScopeRepository.findLot | `src/modules/pharmacy_inventory/infrastructure/repositories/inventory-scope.repository.ts:86` |
| `pharmacy_inventory.inventory_stock_positions` | LEE | LEE | DIRECTA | PharmacyInventoryController.openCountSession → InventoryCountService.openSession → OpenInventoryCountUseCase.execute → StockPositionsRepository.findByKey | `src/modules/pharmacy_inventory/infrastructure/repositories/stock-positions.repository.ts:65` |
| `pharmacy.pharmacies` | LEE | LEE | DIRECTA | PharmacyInventoryController.openCountSession → InventoryCountService.openSession → OpenInventoryCountUseCase.execute → PharmacyInventoryScopePolicy.requireManagedSite → PharmacyInventoryScopePolicy.requireManagedPharmacy → InventoryScopeRepository.findPharmacyInTenant | `src/modules/pharmacy_inventory/infrastructure/repositories/inventory-scope.repository.ts:33` |
| `pharmacy.pharmacy_products` | LEE | LEE | DIRECTA | PharmacyInventoryController.openCountSession → InventoryCountService.openSession → OpenInventoryCountUseCase.execute → PharmacyInventoryScopePolicy.requireProduct → InventoryScopeRepository.findProductInPharmacy | `src/modules/pharmacy_inventory/infrastructure/repositories/inventory-scope.repository.ts:73` |
| `pharmacy.pharmacy_sites` | LEE | LEE | DIRECTA | PharmacyInventoryController.openCountSession → InventoryCountService.openSession → OpenInventoryCountUseCase.execute → PharmacyInventoryScopePolicy.requireManagedSite → InventoryScopeRepository.findSite | `src/modules/pharmacy_inventory/infrastructure/repositories/inventory-scope.repository.ts:38` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `siteId` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateCountSessionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `inventoryLocationId` | `string` | Sí | formato uuid | `@IsUUID()` | Ubicación a contar | `src/modules/pharmacy_inventory/presentation/dto/create-count-session.dto.ts:36` |
| `freeze` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Congelar movimientos durante el conteo | `src/modules/pharmacy_inventory/presentation/dto/create-count-session.dto.ts:46` |
| `items` | `array<CountSessionItemDto>` | Sí | — | `@IsArray()` `@ValidateNested({ each: true })` `@Type(() => CountSessionItemDto)` | Productos/lotes a contar | `src/modules/pharmacy_inventory/presentation/dto/create-count-session.dto.ts:58` |
| `items[].pharmacyProductId` | `string` | Sí | formato uuid | `@IsUUID()` | Producto de farmacia | `src/modules/pharmacy_inventory/presentation/dto/create-count-session.dto.ts:18` |
| `items[].inventoryLotId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Lote específico | `src/modules/pharmacy_inventory/presentation/dto/create-count-session.dto.ts:26` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "inventoryLocationId": "00000000-0000-4000-8000-000000000001",
  "items": [
    {
      "pharmacyProductId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<CountSessionResponseDto>` · DTO `CountSessionResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/pharmacy_inventory/presentation/dto/responses.dto.ts:87` |
| `lineIds` | `array<string>` | Sí | — | — | Ids de líneas de conteo | `src/modules/pharmacy_inventory/presentation/dto/responses.dto.ts:93` |
| `adjustments` | `number` | Sí | — | — | Número de ajustes generados | `src/modules/pharmacy_inventory/presentation/dto/responses.dto.ts:99` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe una sesión de conteo abierta en la ubicación |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharmacy_inventory.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / pharmacy inventory — etapa `ctrl:PharmacyInventoryController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 13. POST /pharmacy/{siteId}/inventory-locations

- **Origen:** CONTRATO
- **Nombre:** Crear una ubicación de inventario
- **Bloque:** Farmacia
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyInventoryController.createLocation` — `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-inventory.controller.ts:66`

### Qué es y para qué sirve (negocio)

Crear una ubicación de inventario. Dentro del módulo (descripción del modelo, en inglés): «Prevents overselling and untraceable adjustments under concurrent manual, API, dispensing and receiving operations.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_25_pharmacy_inventory.puml:20`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`POST /pharmacy/{siteId}/inventory-locations` la atiende `PharmacyInventoryController.createLocation` (src/modules/pharmacy_inventory/presentation/controllers/pharmacy-inventory.controller.ts:66). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateLocationDto` (4 campos, 2 obligatorios). Delega en `InventoryLocationsService.create`. Crea filas en pharmacy_inventory.inventory_locations. Lee pharmacy_inventory.inventory_locations, pharmacy.pharmacies, pharmacy.pharmacy_sites.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-inventory.controller.ts:66` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: siteId | `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-inventory.controller.ts:66` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharmacy_inventory.inventory_locations` | ESCRIBE | CREA | DIRECTA | PharmacyInventoryController.createLocation → InventoryLocationsService.create → CreateInventoryLocationUseCase.execute → LocationsRepository.create | `src/modules/pharmacy_inventory/infrastructure/repositories/locations.repository.ts:68` |
| `pharmacy_inventory.inventory_locations` | LEE | LEE | DIRECTA | PharmacyInventoryController.createLocation → InventoryLocationsService.create → CreateInventoryLocationUseCase.execute → PharmacyInventoryScopePolicy.requireLocation → InventoryScopeRepository.findLocationInSite | `src/modules/pharmacy_inventory/infrastructure/repositories/inventory-scope.repository.ts:56` |
| `pharmacy.pharmacies` | LEE | LEE | DIRECTA | PharmacyInventoryController.createLocation → InventoryLocationsService.create → CreateInventoryLocationUseCase.execute → PharmacyInventoryScopePolicy.requireManagedSite → PharmacyInventoryScopePolicy.requireManagedPharmacy → InventoryScopeRepository.findPharmacyInTenant | `src/modules/pharmacy_inventory/infrastructure/repositories/inventory-scope.repository.ts:33` |
| `pharmacy.pharmacy_sites` | LEE | LEE | DIRECTA | PharmacyInventoryController.createLocation → InventoryLocationsService.create → CreateInventoryLocationUseCase.execute → PharmacyInventoryScopePolicy.requireManagedSite → InventoryScopeRepository.findSite | `src/modules/pharmacy_inventory/infrastructure/repositories/inventory-scope.repository.ts:38` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `siteId` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateLocationDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `code` | `string` | Sí | longitud máxima 64 | `@IsString()` `@MaxLength(64)` | Código de la ubicación | `src/modules/pharmacy_inventory/presentation/dto/create-location.dto.ts:18` |
| `name` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Nombre legible de la ubicación | `src/modules/pharmacy_inventory/presentation/dto/create-location.dto.ts:26` |
| `parentLocationId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Ubicación padre (jerarquía) | `src/modules/pharmacy_inventory/presentation/dto/create-location.dto.ts:37` |
| `controlledAccess` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Requiere acceso controlado | `src/modules/pharmacy_inventory/presentation/dto/create-location.dto.ts:45` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "parentLocationId": "00000000-0000-4000-8000-000000000001",
  "controlledAccess": true
}
```

</details>

### Respuesta — `Promise<IdResponseDto>` · DTO `IdResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/pharmacy_inventory/presentation/dto/responses.dto.ts:9` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharmacy_inventory.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / pharmacy inventory — etapa `ctrl:PharmacyInventoryController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 14. POST /pharmacy/count-sessions/{id}/approve

- **Origen:** CONTRATO
- **Nombre:** Aprobar conteo y ajustar ledger por varianza (UC-25-07)
- **Bloque:** Farmacia
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyInventoryController.approveCountSession` — `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-inventory.controller.ts:139`

### Qué es y para qué sirve (negocio)

Aprobar conteo y ajustar ledger por varianza (UC-25-07). Dentro del módulo (descripción del modelo, en inglés): «Prevents overselling and untraceable adjustments under concurrent manual, API, dispensing and receiving operations.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_25_pharmacy_inventory.puml:20`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`POST /pharmacy/count-sessions/{id}/approve` la atiende `PharmacyInventoryController.approveCountSession` (src/modules/pharmacy_inventory/presentation/controllers/pharmacy-inventory.controller.ts:139). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `ApproveCountSessionDto` (3 campos, 3 obligatorios). Delega en `InventoryCountService.approve`. Crea filas en pharmacy_inventory.inventory_ledger_entries. Actualiza pharmacy_inventory.inventory_count_lines, pharmacy_inventory.inventory_count_sessions, pharmacy_inventory.inventory_stock_positions. Lee pharmacy_inventory.inventory_count_lines, pharmacy_inventory.inventory_count_sessions, pharmacy_inventory.inventory_ledger_entries, pharmacy_inventory.inventory_locations, pharmacy_inventory.inventory_lots, pharmacy_inventory.inventory_stock_positions, pharmacy.pharmacies, pharmacy.pharmacy_products y 1 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-inventory.controller.ts:139` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-inventory.controller.ts:139` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharmacy_inventory.inventory_count_lines` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyInventoryController.approveCountSession → InventoryCountService.approve → ApproveInventoryCountUseCase.execute | `src/modules/pharmacy_inventory/application/inventory-count/approve-inventory-count.use-case.ts:93` |
| `pharmacy_inventory.inventory_count_lines` | LEE | LEE | DIRECTA | PharmacyInventoryController.approveCountSession → InventoryCountService.approve → ApproveInventoryCountUseCase.execute → CountSessionsRepository.findLineById | `src/modules/pharmacy_inventory/infrastructure/repositories/count-sessions.repository.ts:128` |
| `pharmacy_inventory.inventory_count_sessions` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyInventoryController.approveCountSession → InventoryCountService.approve → ApproveInventoryCountUseCase.execute | `src/modules/pharmacy_inventory/application/inventory-count/approve-inventory-count.use-case.ts:134` |
| `pharmacy_inventory.inventory_count_sessions` | LEE | LEE | DIRECTA | PharmacyInventoryController.approveCountSession → InventoryCountService.approve → ApproveInventoryCountUseCase.execute → CountSessionsRepository.findById | `src/modules/pharmacy_inventory/infrastructure/repositories/count-sessions.repository.ts:88` |
| `pharmacy_inventory.inventory_ledger_entries` | ESCRIBE | CREA | DIRECTA | PharmacyInventoryController.approveCountSession → InventoryCountService.approve → ApproveInventoryCountUseCase.execute → LedgerRepository.append | `src/modules/pharmacy_inventory/infrastructure/repositories/ledger.repository.ts:142` |
| `pharmacy_inventory.inventory_ledger_entries` | LEE | LEE | POR_SQL | PharmacyInventoryController.approveCountSession → InventoryCountService.approve → ApproveInventoryCountUseCase.execute → LedgerRepository.nextSequence | `src/modules/pharmacy_inventory/infrastructure/repositories/ledger.repository.ts:113` |
| `pharmacy_inventory.inventory_locations` | LEE | LEE | DIRECTA | PharmacyInventoryController.approveCountSession → InventoryCountService.approve → ApproveInventoryCountUseCase.execute → PharmacyInventoryScopePolicy.assertStoredStockKey → InventoryScopeRepository.findLocationInSite | `src/modules/pharmacy_inventory/infrastructure/repositories/inventory-scope.repository.ts:56` |
| `pharmacy_inventory.inventory_lots` | LEE | LEE | DIRECTA | PharmacyInventoryController.approveCountSession → InventoryCountService.approve → ApproveInventoryCountUseCase.execute → PharmacyInventoryScopePolicy.assertStoredStockKey → InventoryScopeRepository.findLot | `src/modules/pharmacy_inventory/infrastructure/repositories/inventory-scope.repository.ts:86` |
| `pharmacy_inventory.inventory_stock_positions` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyInventoryController.approveCountSession → InventoryCountService.approve → ApproveInventoryCountUseCase.execute | `src/modules/pharmacy_inventory/application/inventory-count/approve-inventory-count.use-case.ts:122` |
| `pharmacy_inventory.inventory_stock_positions` | LEE | LEE | DIRECTA | PharmacyInventoryController.approveCountSession → InventoryCountService.approve → ApproveInventoryCountUseCase.execute → StockPositionsRepository.findByKeyForUpdate | `src/modules/pharmacy_inventory/infrastructure/repositories/stock-positions.repository.ts:82` |
| `pharmacy.pharmacies` | LEE | LEE | DIRECTA | PharmacyInventoryController.approveCountSession → InventoryCountService.approve → ApproveInventoryCountUseCase.execute → PharmacyInventoryScopePolicy.requireManagedSite → PharmacyInventoryScopePolicy.requireManagedPharmacy → InventoryScopeRepository.findPharmacyInTenant | `src/modules/pharmacy_inventory/infrastructure/repositories/inventory-scope.repository.ts:33` |
| `pharmacy.pharmacy_products` | LEE | LEE | DIRECTA | PharmacyInventoryController.approveCountSession → InventoryCountService.approve → ApproveInventoryCountUseCase.execute → PharmacyInventoryScopePolicy.assertStoredStockKey → InventoryScopeRepository.findProductInPharmacy | `src/modules/pharmacy_inventory/infrastructure/repositories/inventory-scope.repository.ts:73` |
| `pharmacy.pharmacy_sites` | LEE | LEE | DIRECTA | PharmacyInventoryController.approveCountSession → InventoryCountService.approve → ApproveInventoryCountUseCase.execute → PharmacyInventoryScopePolicy.requireManagedSite → InventoryScopeRepository.findSite | `src/modules/pharmacy_inventory/infrastructure/repositories/inventory-scope.repository.ts:38` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `ApproveCountSessionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `counts` | `array<CountResultDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => CountResultDto)` | — | `src/modules/pharmacy_inventory/presentation/dto/approve-count-session.dto.ts:40` |
| `counts[].lineId` | `string` | Sí | formato uuid | `@IsUUID()` | Línea de conteo | `src/modules/pharmacy_inventory/presentation/dto/approve-count-session.dto.ts:19` |
| `counts[].countedQuantity` | `number` | Sí | mínimo 0 | `@IsNumber()` `@Min(0)` | Cantidad efectivamente contada | `src/modules/pharmacy_inventory/presentation/dto/approve-count-session.dto.ts:27` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "counts": [
    {
      "lineId": "00000000-0000-4000-8000-000000000001",
      "countedQuantity": 1
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "counts": [
    {
      "lineId": "00000000-0000-4000-8000-000000000001",
      "countedQuantity": 1
    }
  ]
}
```

</details>

### Respuesta — `Promise<CountSessionResponseDto>` · DTO `CountSessionResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/pharmacy_inventory/presentation/dto/responses.dto.ts:87` |
| `lineIds` | `array<string>` | Sí | — | — | Ids de líneas de conteo | `src/modules/pharmacy_inventory/presentation/dto/responses.dto.ts:93` |
| `adjustments` | `number` | Sí | — | — | Número de ajustes generados | `src/modules/pharmacy_inventory/presentation/dto/responses.dto.ts:99` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Línea de conteo no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La sesión no está en estado aprobable |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharmacy_inventory.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / pharmacy inventory — etapa `ctrl:PharmacyInventoryController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 15. POST /pharmacy/dispensations/{id}/reverse

- **Origen:** CONTRATO
- **Nombre:** Reversar una dispensación (UC-25-11)
- **Bloque:** Farmacia
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyDispensingController.reverse` — `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-dispensing.controller.ts:58`

### Qué es y para qué sirve (negocio)

Reversar una dispensación (UC-25-11). Dentro del módulo (descripción del modelo, en inglés): «Prevents overselling and untraceable adjustments under concurrent manual, API, dispensing and receiving operations.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_25_pharmacy_inventory.puml:20`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`POST /pharmacy/dispensations/{id}/reverse` la atiende `PharmacyDispensingController.reverse` (src/modules/pharmacy_inventory/presentation/controllers/pharmacy-dispensing.controller.ts:58). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `ReverseDispensationDto` (2 campos, 0 obligatorios). Delega en `MedicationDispensationsService.reverse`. Crea filas en pharmacy_inventory.inventory_ledger_entries. Actualiza pharmacy_inventory.inventory_stock_positions, pharmacy_inventory.medication_dispensations. Lee pharmacy_inventory.inventory_ledger_entries, pharmacy_inventory.inventory_locations, pharmacy_inventory.inventory_stock_positions, pharmacy_inventory.medication_dispensation_lines, pharmacy_inventory.medication_dispensations, pharmacy.pharmacies, pharmacy.pharmacy_sites.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-dispensing.controller.ts:58` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-dispensing.controller.ts:58` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharmacy_inventory.inventory_ledger_entries` | ESCRIBE | CREA | DIRECTA | PharmacyDispensingController.reverse → MedicationDispensationsService.reverse → ReverseMedicationDispensationUseCase.execute → LedgerRepository.append | `src/modules/pharmacy_inventory/infrastructure/repositories/ledger.repository.ts:142` |
| `pharmacy_inventory.inventory_ledger_entries` | LEE | LEE | POR_SQL | PharmacyDispensingController.reverse → MedicationDispensationsService.reverse → ReverseMedicationDispensationUseCase.execute → LedgerRepository.nextSequence | `src/modules/pharmacy_inventory/infrastructure/repositories/ledger.repository.ts:113` |
| `pharmacy_inventory.inventory_locations` | LEE | LEE | DIRECTA | PharmacyDispensingController.reverse → MedicationDispensationsService.reverse → ReverseMedicationDispensationUseCase.execute → PharmacyInventoryScopePolicy.requireLocation → InventoryScopeRepository.findLocationInSite | `src/modules/pharmacy_inventory/infrastructure/repositories/inventory-scope.repository.ts:56` |
| `pharmacy_inventory.inventory_stock_positions` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyDispensingController.reverse → MedicationDispensationsService.reverse → ReverseMedicationDispensationUseCase.execute | `src/modules/pharmacy_inventory/application/medication-dispensations/reverse-medication-dispensation.use-case.ts:115` |
| `pharmacy_inventory.inventory_stock_positions` | LEE | LEE | DIRECTA | PharmacyDispensingController.reverse → MedicationDispensationsService.reverse → ReverseMedicationDispensationUseCase.execute → StockPositionsRepository.findByKeyForUpdate | `src/modules/pharmacy_inventory/infrastructure/repositories/stock-positions.repository.ts:82` |
| `pharmacy_inventory.medication_dispensation_lines` | LEE | LEE | DIRECTA | PharmacyDispensingController.reverse → MedicationDispensationsService.reverse → ReverseMedicationDispensationUseCase.execute → DispensationsRepository.findLines | `src/modules/pharmacy_inventory/infrastructure/repositories/dispensations.repository.ts:131` |
| `pharmacy_inventory.medication_dispensations` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyDispensingController.reverse → MedicationDispensationsService.reverse → ReverseMedicationDispensationUseCase.execute | `src/modules/pharmacy_inventory/application/medication-dispensations/reverse-medication-dispensation.use-case.ts:86` |
| `pharmacy_inventory.medication_dispensations` | LEE | LEE | DIRECTA | PharmacyDispensingController.reverse → MedicationDispensationsService.reverse → ReverseMedicationDispensationUseCase.execute → DispensationsRepository.findById | `src/modules/pharmacy_inventory/infrastructure/repositories/dispensations.repository.ts:108` |
| `pharmacy.pharmacies` | LEE | LEE | DIRECTA | PharmacyDispensingController.reverse → MedicationDispensationsService.reverse → ReverseMedicationDispensationUseCase.execute → PharmacyInventoryScopePolicy.requireManagedPharmacy → InventoryScopeRepository.findPharmacyInTenant | `src/modules/pharmacy_inventory/infrastructure/repositories/inventory-scope.repository.ts:33` |
| `pharmacy.pharmacy_sites` | LEE | LEE | DIRECTA | PharmacyDispensingController.reverse → MedicationDispensationsService.reverse → ReverseMedicationDispensationUseCase.execute → PharmacyInventoryScopePolicy.requireSite → InventoryScopeRepository.findSiteInPharmacy | `src/modules/pharmacy_inventory/infrastructure/repositories/inventory-scope.repository.ts:47` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `ReverseDispensationDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reason` | `string` | No | longitud máxima 256 | `@IsOptional()` `@IsString()` `@MaxLength(256)` | Motivo de la reversión | `src/modules/pharmacy_inventory/presentation/dto/reverse-dispensation.dto.ts:13` |
| `inventoryLocationId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Ubicación a la que se reintegra el stock | `src/modules/pharmacy_inventory/presentation/dto/reverse-dispensation.dto.ts:24` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "reason": "Texto descriptivo de ejemplo",
  "inventoryLocationId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<StatusResultDto>` · DTO `StatusResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `ok` | `boolean` | Sí | — | — | true si la operación se aplicó | sin fuente |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La dispensación no está en estado reversible |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharmacy_inventory.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / pharmacy inventory — etapa `ctrl:PharmacyDispensingController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 16. GET /pharmacy/orders

- **Origen:** CONTRATO
- **Nombre:** Bandeja de pedidos de las farmacias del tenant (FAR-E2)
- **Bloque:** Farmacia
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyOrdersController.listForTenant` — `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-orders.controller.ts:62`

### Qué es y para qué sirve (negocio)

Bandeja de pedidos de las farmacias del tenant (FAR-E2). Dentro del módulo (descripción del modelo, en inglés): «Prevents overselling and untraceable adjustments under concurrent manual, API, dispensing and receiving operations.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_25_pharmacy_inventory.puml:20`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`GET /pharmacy/orders` la atiende `PharmacyOrdersController.listForTenant` (src/modules/pharmacy_inventory/presentation/controllers/pharmacy-orders.controller.ts:62). Exige sesión con alguno de los roles SECURITY_ADMIN, PHARMACY_STAFF. Delega en `PharmacyOrdersService.listForPharmacyTenant`. Crea filas en messaging.domain_events, messaging.in_app_notifications, messaging.notification_deliveries, messaging.notification_requests, messaging.outbox_messages, pharmacy_inventory.inventory_ledger_entries. Actualiza iam.devices, pharmacy_inventory.inventory_reservation_lines, pharmacy_inventory.inventory_reservations, pharmacy_inventory.inventory_stock_positions. Lee clinical.medication_requests, common.addresses, community.public_profiles, directory.tenants, iam.devices, messaging.in_app_notifications, messaging.message_channels, messaging.messaging_providers y 16 más. Publica un evento calculado (null).

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PHARMACY_STAFF | `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-orders.controller.ts:62` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.medication_requests` | LEE | LEE | DIRECTA | PharmacyOrdersController.listForTenant → PharmacyOrdersService.listForPharmacyTenant → PharmacyOrdersUseCases.listForPharmacyTenant → PharmacyOrdersUseCases.expireDue → PharmacyOrdersRepository.findPrescriberProfileId | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:290` |
| `common.addresses` | LEE | LEE | DIRECTA | PharmacyOrdersController.listForTenant → PharmacyOrdersService.listForPharmacyTenant → PharmacyOrdersUseCases.listForPharmacyTenant → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findAddressesByIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:361` |
| `community.public_profiles` | LEE | LEE | DIRECTA | PharmacyOrdersController.listForTenant → PharmacyOrdersService.listForPharmacyTenant → PharmacyOrdersUseCases.listForPharmacyTenant → PharmacyOrdersUseCases.composeOrders → CommunityPharmacyOrderChatAdapter.findPharmacyShowcases → CommunityOrderChatService.findOrganizationShowcases → PublicProfilesRepository.listByIds | `src/modules/community/repositories/public-profiles.repository.ts:135` |
| `directory.tenants` | LEE | LEE | DIRECTA | PharmacyOrdersController.listForTenant → PharmacyOrdersService.listForPharmacyTenant → PharmacyOrdersUseCases.listForPharmacyTenant → PharmacyOrdersUseCases.composeOrders → CommunityPharmacyOrderChatAdapter.findPharmacyShowcases → CommunityOrderChatService.findOrganizationShowcases → CommunityOrganizationStaffService.verifiedActiveTenantIds | `src/modules/community/services/community-organization-staff.service.ts:283` |
| `iam.devices` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyOrdersController.listForTenant → PharmacyOrdersService.listForPharmacyTenant → PharmacyOrdersUseCases.listForPharmacyTenant → PharmacyOrdersUseCases.expireDue → PharmacyOrderNotificationsService.expiredToPrescriber → NotifyPharmacyOrderUseCase.expiredToPrescriber → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → WebPushService.pushToUser → WebPushService.sendTo → WebPushService.forget | `src/modules/messaging/services/web-push.service.ts:235` |
| `iam.devices` | LEE | LEE | DIRECTA | PharmacyOrdersController.listForTenant → PharmacyOrdersService.listForPharmacyTenant → PharmacyOrdersUseCases.listForPharmacyTenant → PharmacyOrdersUseCases.expireDue → PharmacyOrderNotificationsService.expiredToPrescriber → NotifyPharmacyOrderUseCase.expiredToPrescriber → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → WebPushService.pushToUser | `src/modules/messaging/services/web-push.service.ts:172` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.listForTenant → PharmacyOrdersService.listForPharmacyTenant → PharmacyOrdersUseCases.listForPharmacyTenant → PharmacyOrdersUseCases.expireDue → MessagingDomainEventAdapter.publish → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.in_app_notifications` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.listForTenant → PharmacyOrdersService.listForPharmacyTenant → PharmacyOrdersUseCases.listForPharmacyTenant → PharmacyOrdersUseCases.expireDue → PharmacyOrderNotificationsService.expiredToPrescriber → NotifyPharmacyOrderUseCase.expiredToPrescriber → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createInAppNotification | `src/modules/messaging/repositories/notifications.repository.ts:710` |
| `messaging.in_app_notifications` | LEE | LEE | DIRECTA | PharmacyOrdersController.listForTenant → PharmacyOrdersService.listForPharmacyTenant → PharmacyOrdersUseCases.listForPharmacyTenant → PharmacyOrdersUseCases.expireDue → PharmacyOrderNotificationsService.expiredToPrescriber → NotifyPharmacyOrderUseCase.expiredToPrescriber → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findUnreadInAppForResource | `src/modules/messaging/repositories/notifications.repository.ts:845` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | PharmacyOrdersController.listForTenant → PharmacyOrdersService.listForPharmacyTenant → PharmacyOrdersUseCases.listForPharmacyTenant → PharmacyOrdersUseCases.expireDue → PharmacyOrderNotificationsService.expiredToPrescriber → NotifyPharmacyOrderUseCase.expiredToPrescriber → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findActiveChannelByType | `src/modules/messaging/repositories/notifications.repository.ts:189` |
| `messaging.messaging_providers` | LEE | LEE | DIRECTA | PharmacyOrdersController.listForTenant → PharmacyOrdersService.listForPharmacyTenant → PharmacyOrdersUseCases.listForPharmacyTenant → PharmacyOrdersUseCases.expireDue → PharmacyOrderNotificationsService.expiredToPrescriber → NotifyPharmacyOrderUseCase.expiredToPrescriber → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findProviderById | `src/modules/messaging/repositories/notifications.repository.ts:437` |
| `messaging.notification_deliveries` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.listForTenant → PharmacyOrdersService.listForPharmacyTenant → PharmacyOrdersUseCases.listForPharmacyTenant → PharmacyOrdersUseCases.expireDue → PharmacyOrderNotificationsService.expiredToPrescriber → NotifyPharmacyOrderUseCase.expiredToPrescriber → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createDelivery | `src/modules/messaging/repositories/notifications.repository.ts:514` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.listForTenant → PharmacyOrdersService.listForPharmacyTenant → PharmacyOrdersUseCases.listForPharmacyTenant → PharmacyOrdersUseCases.expireDue → PharmacyOrderNotificationsService.expiredToPrescriber → NotifyPharmacyOrderUseCase.expiredToPrescriber → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.listForTenant → PharmacyOrdersService.listForPharmacyTenant → PharmacyOrdersUseCases.listForPharmacyTenant → PharmacyOrdersUseCases.expireDue → MessagingDomainEventAdapter.publish → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | PharmacyOrdersController.listForTenant → PharmacyOrdersService.listForPharmacyTenant → PharmacyOrdersUseCases.listForPharmacyTenant → PharmacyOrdersUseCases.expireDue → MessagingDomainEventAdapter.publish → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |
| `messaging.provider_channel_configs` | LEE | LEE | DIRECTA | PharmacyOrdersController.listForTenant → PharmacyOrdersService.listForPharmacyTenant → PharmacyOrdersUseCases.listForPharmacyTenant → PharmacyOrdersUseCases.expireDue → PharmacyOrderNotificationsService.expiredToPrescriber → NotifyPharmacyOrderUseCase.expiredToPrescriber → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findChannelConfigs | `src/modules/messaging/repositories/notifications.repository.ts:405` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | PharmacyOrdersController.listForTenant → PharmacyOrdersService.listForPharmacyTenant → PharmacyOrdersUseCases.listForPharmacyTenant → PharmacyOrdersUseCases.expireDue → PharmacyOrderNotificationsService.expiredToPrescriber → NotifyPharmacyOrderUseCase.expiredToPrescriber → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `pharmacy_inventory.inventory_ledger_entries` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.listForTenant → PharmacyOrdersService.listForPharmacyTenant → PharmacyOrdersUseCases.listForPharmacyTenant → PharmacyOrdersUseCases.expireDue → InventoryReservationsService.releaseConfirmedLines → ReleaseConfirmedReservationLinesUseCase.execute → LedgerRepository.append | `src/modules/pharmacy_inventory/infrastructure/repositories/ledger.repository.ts:142` |
| `pharmacy_inventory.inventory_ledger_entries` | LEE | LEE | POR_SQL | PharmacyOrdersController.listForTenant → PharmacyOrdersService.listForPharmacyTenant → PharmacyOrdersUseCases.listForPharmacyTenant → PharmacyOrdersUseCases.expireDue → InventoryReservationsService.releaseConfirmedLines → ReleaseConfirmedReservationLinesUseCase.execute → LedgerRepository.nextSequence | `src/modules/pharmacy_inventory/infrastructure/repositories/ledger.repository.ts:113` |
| `pharmacy_inventory.inventory_reservation_lines` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyOrdersController.listForTenant → PharmacyOrdersService.listForPharmacyTenant → PharmacyOrdersUseCases.listForPharmacyTenant → PharmacyOrdersUseCases.expireDue → InventoryReservationsService.releaseConfirmedLines → ReleaseConfirmedReservationLinesUseCase.execute | `src/modules/pharmacy_inventory/application/inventory-reservations/release-confirmed-reservation-lines.use-case.ts:44` |
| `pharmacy_inventory.inventory_reservation_lines` | LEE | LEE | DIRECTA | PharmacyOrdersController.listForTenant → PharmacyOrdersService.listForPharmacyTenant → PharmacyOrdersUseCases.listForPharmacyTenant → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findLinesByReservationIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:220` |
| `pharmacy_inventory.inventory_reservations` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyOrdersController.listForTenant → PharmacyOrdersService.listForPharmacyTenant → PharmacyOrdersUseCases.listForPharmacyTenant → PharmacyOrdersUseCases.expireDue | `src/modules/pharmacy_inventory/application/pharmacy-orders/pharmacy-orders.use-cases.ts:1696` |
| `pharmacy_inventory.inventory_reservations` | LEE | LEE | DIRECTA | PharmacyOrdersController.listForTenant → PharmacyOrdersService.listForPharmacyTenant → PharmacyOrdersUseCases.listForPharmacyTenant → PharmacyOrdersRepository.findOrdersForPharmacies | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:99` |
| `pharmacy_inventory.inventory_stock_positions` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyOrdersController.listForTenant → PharmacyOrdersService.listForPharmacyTenant → PharmacyOrdersUseCases.listForPharmacyTenant → PharmacyOrdersUseCases.expireDue → InventoryReservationsService.releaseConfirmedLines → ReleaseConfirmedReservationLinesUseCase.execute | `src/modules/pharmacy_inventory/application/inventory-reservations/release-confirmed-reservation-lines.use-case.ts:72` |
| `pharmacy_inventory.inventory_stock_positions` | LEE | LEE | DIRECTA | PharmacyOrdersController.listForTenant → PharmacyOrdersService.listForPharmacyTenant → PharmacyOrdersUseCases.listForPharmacyTenant → PharmacyOrdersUseCases.expireDue → InventoryReservationsService.releaseConfirmedLines → ReleaseConfirmedReservationLinesUseCase.execute → StockPositionsRepository.findByKeyForUpdate | `src/modules/pharmacy_inventory/infrastructure/repositories/stock-positions.repository.ts:82` |
| `pharmacy_inventory.pharmacy_order_substitutions` | LEE | LEE | DIRECTA | PharmacyOrdersController.listForTenant → PharmacyOrdersService.listForPharmacyTenant → PharmacyOrdersUseCases.listForPharmacyTenant → PharmacyOrdersUseCases.composeOrders → PharmacyOrderSubstitutionsRepository.findByReservationIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-order-substitutions.repository.ts:62` |
| `pharmacy.pharmacies` | LEE | LEE | DIRECTA | PharmacyOrdersController.listForTenant → PharmacyOrdersService.listForPharmacyTenant → PharmacyOrdersUseCases.listForPharmacyTenant → PharmacyOrdersRepository.findPharmaciesByTenant | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:116` |
| `pharmacy.pharmacy_products` | LEE | LEE | DIRECTA | PharmacyOrdersController.listForTenant → PharmacyOrdersService.listForPharmacyTenant → PharmacyOrdersUseCases.listForPharmacyTenant → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findProductsByIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:256` |
| `pharmacy.pharmacy_sites` | LEE | LEE | DIRECTA | PharmacyOrdersController.listForTenant → PharmacyOrdersService.listForPharmacyTenant → PharmacyOrdersUseCases.listForPharmacyTenant → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findSitesByIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:247` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | PharmacyOrdersController.listForTenant → PharmacyOrdersService.listForPharmacyTenant → PharmacyOrdersUseCases.listForPharmacyTenant → PharmacyOrdersUseCases.expireDue → PharmacyOrderNotificationsService.expiredToPrescriber → NotifyPharmacyOrderUseCase.expiredToPrescriber → NotifyPharmacyOrderUseCase.emitToPerson → ProfilesPersonAccountLinksAdapter.findActiveByPerson → PersonAccountLinksRepository.findActiveByPerson | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:101` |
| `profiles.person_profiles` | LEE | LEE | DIRECTA | PharmacyOrdersController.listForTenant → PharmacyOrdersService.listForPharmacyTenant → PharmacyOrdersUseCases.listForPharmacyTenant → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findPersonNamesByProfileIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:143` |
| `profiles.persons` | LEE | LEE | DIRECTA | PharmacyOrdersController.listForTenant → PharmacyOrdersService.listForPharmacyTenant → PharmacyOrdersUseCases.listForPharmacyTenant → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findPersonNamesByProfileIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:135` |
| `profiles.practitioner_specialties` | LEE | LEE | DIRECTA | PharmacyOrdersController.listForTenant → PharmacyOrdersService.listForPharmacyTenant → PharmacyOrdersUseCases.listForPharmacyTenant → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findPrimarySpecialtyConceptIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:331` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | PharmacyOrdersController.listForTenant → PharmacyOrdersService.listForPharmacyTenant → PharmacyOrdersUseCases.listForPharmacyTenant → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findConceptsByIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:370` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | calculado: `null` | `src/modules/pharmacy_inventory/infrastructure/adapters/messaging-domain-event.adapter.ts:16` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `status` | query | No | `string` | Código de estado (PINV_ORDER_*) |
| `siteId` | query | No | `string` | — |
| `from` | query | No | `string` | Instante ISO 8601 |
| `to` | query | No | `string` | Instante ISO 8601 |
| `limit` | query | No | `number` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PharmacyOrderListResponseDto>` · DTO `PharmacyOrderListResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<PharmacyOrderDto>` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:602` |
| `items[].reservationLines` | `array<PharmacyOrderReservationLineDto>` | Sí | — | — | Porciones confirmadas o entregadas vigentes para facturación | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:253` |
| `items[].reservationLines[].id` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:212` |
| `items[].reservationLines[].productId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:215` |
| `items[].reservationLines[].quantity` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:218` |
| `items[].reservationLines[].unitPriceAmount` | `string` | Sí | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:221` |
| `items[].reservationLines[].billedAmount` | `string` | Sí | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:224` |
| `items[].reservationLines[].currencyConceptId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:227` |
| `items[].insuranceSettlement` | `PatientInsuranceSettlementDto` | Sí | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:256` |
| `items[].insuranceSettlement.claimId` | `string` | Sí | formato uuid | — | — | sin fuente |
| `items[].insuranceSettlement.claimIdentifier` | `string` | Sí | — | — | — | sin fuente |
| `items[].insuranceSettlement.adjudicationVersionId` | `string` | Sí | formato uuid | — | — | sin fuente |
| `items[].insuranceSettlement.adjudicationVersion` | `number` | Sí | formato int32; mínimo 1 | — | — | sin fuente |
| `items[].insuranceSettlement.eobId` | `string` | Sí | formato uuid | — | — | sin fuente |
| `items[].insuranceSettlement.carrierName` | `string` | Sí | — | — | — | sin fuente |
| `items[].insuranceSettlement.policyIdentifier` | `string` | Sí | admite null | — | — | sin fuente |
| `items[].insuranceSettlement.totalBilledAmount` | `string` | Sí | — | — | Total facturado, decimal exacto | sin fuente |
| `items[].insuranceSettlement.totalApprovedAmount` | `string` | Sí | — | — | Aporte del seguro, decimal exacto | sin fuente |
| `items[].insuranceSettlement.totalPatientAmount` | `string` | Sí | — | — | Cargo confirmado al paciente, decimal exacto | sin fuente |
| `items[].insuranceSettlement.totalDeniedAmount` | `string` | Sí | — | — | Importe excluido sin asignar, decimal exacto | sin fuente |
| `items[].insuranceSettlement.currencyCode` | `string` | Sí | — | — | — | sin fuente |
| `items[].insuranceSettlement.result` | `string` | Sí | valores: APPROVED, PARTIALLY_APPROVED, DENIED | — | — | sin fuente |
| `items[].insuranceSettlement.exclusions` | `array<PatientInsuranceSettlementExclusionDto>` | Sí | — | — | — | sin fuente |
| `items[].insuranceSettlement.exclusions[].claimLineId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/patient-settlement.dto.ts:9` |
| `items[].insuranceSettlement.exclusions[].itemId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/patient-settlement.dto.ts:12` |
| `items[].insuranceSettlement.exclusions[].itemName` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/patient-settlement.dto.ts:15` |
| `items[].insuranceSettlement.exclusions[].amount` | `string` | Sí | — | — | Importe decimal exacto excluido | `src/modules/pharmacy_inventory/presentation/dto/patient-settlement.dto.ts:18` |
| `items[].insuranceSettlement.exclusions[].policyClauseReference` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/patient-settlement.dto.ts:21` |
| `items[].insuranceSettlement.exclusions[].denialRationale` | `string` | Sí | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/patient-settlement.dto.ts:24` |
| `items[].insuranceSettlementAvailability` | `string` | Sí | valores: AVAILABLE, PENDING_PUBLICATION, UNDER_REVIEW, NOT_AVAILABLE | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:261` |
| `items[].id` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:267` |
| `items[].status` | `InventoryConceptDto` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:273` |
| `items[].status.code` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:17` |
| `items[].status.display` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:23` |
| `items[].createdAt` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:279` |
| `items[].expiresAt` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:286` |
| `items[].siteId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:292` |
| `items[].siteName` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:298` |
| `items[].pharmacyId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:304` |
| `items[].pharmacyName` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:310` |
| `items[].medicationRequestId` | `string` | No | formato uuid; admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:316` |
| `items[].prescriber` | `PharmacyOrderPrescriberDto` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:328` |
| `items[].prescriber.name` | `string` | No | admite null | — | — | sin fuente |
| `items[].prescriber.specialty` | `string` | No | admite null | — | — | sin fuente |
| `items[].patientName` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:336` |
| `items[].deliveryMode` | `InventoryConceptDto` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:343` |
| `items[].deliveryMode.code` | `string` | No | — | — | — | sin fuente |
| `items[].deliveryMode.display` | `string` | No | — | — | — | sin fuente |
| `items[].deliveryAddressText` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:351` |
| `items[].pickupCode` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:362` |
| `items[].pharmacyPublicProfileId` | `string` | No | formato uuid; admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:373` |
| `items[].pharmacyPublicSlug` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:380` |
| `items[].totalAmount` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:391` |
| `items[].currency` | `InventoryConceptDto` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:397` |
| `items[].currency.code` | `string` | No | — | — | — | sin fuente |
| `items[].currency.display` | `string` | No | — | — | — | sin fuente |
| `items[].rejectionReasonText` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:404` |
| `items[].substitutions` | `array<PharmacyOrderSubstitutionDto>` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:412` |
| `items[].substitutions[].id` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:427` |
| `items[].substitutions[].originalProductId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:433` |
| `items[].substitutions[].originalName` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:439` |
| `items[].substitutions[].originalUnitPriceAmount` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:445` |
| `items[].substitutions[].proposedProductId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:451` |
| `items[].substitutions[].proposedName` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:457` |
| `items[].substitutions[].proposedUnitPriceAmount` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:463` |
| `items[].substitutions[].currency` | `InventoryConceptDto` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:469` |
| `items[].substitutions[].currency.code` | `string` | No | — | — | — | sin fuente |
| `items[].substitutions[].currency.display` | `string` | No | — | — | — | sin fuente |
| `items[].substitutions[].status` | `InventoryConceptDto` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:475` |
| `items[].substitutions[].status.code` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:17` |
| `items[].substitutions[].status.display` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:23` |
| `items[].substitutions[].decidedAt` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:481` |
| `items[].lines` | `array<PharmacyOrderLineDto>` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:418` |
| `items[].lines[].productId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:123` |
| `items[].lines[].medicationConceptId` | `string` | No | formato uuid; admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:129` |
| `items[].lines[].productCode` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:135` |
| `items[].lines[].brandName` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:141` |
| `items[].lines[].genericName` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:147` |
| `items[].lines[].strengthText` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:153` |
| `items[].lines[].packageSizeText` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:159` |
| `items[].lines[].medication` | `InventoryConceptDto` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:165` |
| `items[].lines[].medication.code` | `string` | No | — | — | — | sin fuente |
| `items[].lines[].medication.display` | `string` | No | — | — | — | sin fuente |
| `items[].lines[].requestedQuantity` | `number` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:171` |
| `items[].lines[].reservedQuantity` | `number` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:177` |
| `items[].lines[].fulfilledQuantity` | `number` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:184` |
| `items[].lines[].unitPriceAmount` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:193` |
| `items[].lines[].currency` | `InventoryConceptDto` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:199` |
| `items[].lines[].currency.code` | `string` | No | — | — | — | sin fuente |
| `items[].lines[].currency.display` | `string` | No | — | — | — | sin fuente |
| `items[].lines[].status` | `InventoryConceptDto` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:206` |
| `items[].lines[].status.code` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:17` |
| `items[].lines[].status.display` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:23` |
| `count` | `number` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:608` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Estado de pedido desconocido |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharmacy_inventory.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/support/copays-pharmacy-scenario.ts:233` |

### Flujos

- src / modules / pharmacy inventory — etapa `ctrl:PharmacyOrdersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 17. POST /pharmacy/orders

- **Origen:** CONTRATO
- **Nombre:** Crear un pedido de farmacia (FAR-E1)
- **Bloque:** Farmacia
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyOrdersController.create` — `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-orders.controller.ts:94`

### Qué es y para qué sirve (negocio)

Crear un pedido de farmacia (FAR-E1). Dentro del módulo (descripción del modelo, en inglés): «Prevents overselling and untraceable adjustments under concurrent manual, API, dispensing and receiving operations.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_25_pharmacy_inventory.puml:20`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`POST /pharmacy/orders` la atiende `PharmacyOrdersController.create` (src/modules/pharmacy_inventory/presentation/controllers/pharmacy-orders.controller.ts:94). Exige sesión con alguno de los roles PATIENT. Valida el cuerpo como `CreatePharmacyOrderDto` (7 campos, 4 obligatorios). Delega en `PharmacyOrdersService.create`. Crea filas en messaging.domain_events, messaging.outbox_messages, pharmacy_inventory.inventory_ledger_entries, pharmacy_inventory.inventory_reservation_lines, pharmacy_inventory.inventory_reservations. Actualiza pharmacy_inventory.inventory_reservations, pharmacy_inventory.inventory_stock_positions. Lee clinical.medication_requests, common.addresses, community.public_profiles, directory.tenants, messaging.outbox_messages, pharmacy_inventory.inventory_ledger_entries, pharmacy_inventory.inventory_locations, pharmacy_inventory.inventory_reservation_lines y 12 más. Publica un evento calculado (null).

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PATIENT | `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-orders.controller.ts:94` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.medication_requests` | LEE | LEE | DIRECTA | PharmacyOrdersController.create → PharmacyOrdersService.create → PharmacyOrdersUseCases.create → PharmacyOrdersRepository.findOwnMedicationRequest | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:278` |
| `common.addresses` | LEE | LEE | DIRECTA | PharmacyOrdersController.create → PharmacyOrdersService.create → PharmacyOrdersUseCases.create → PharmacyOrdersUseCases.readOwnOrder → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findAddressesByIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:361` |
| `community.public_profiles` | LEE | LEE | DIRECTA | PharmacyOrdersController.create → PharmacyOrdersService.create → PharmacyOrdersUseCases.create → PharmacyOrdersUseCases.readOwnOrder → PharmacyOrdersUseCases.composeOrders → CommunityPharmacyOrderChatAdapter.findPharmacyShowcases → CommunityOrderChatService.findOrganizationShowcases → PublicProfilesRepository.listByIds | `src/modules/community/repositories/public-profiles.repository.ts:135` |
| `directory.tenants` | LEE | LEE | DIRECTA | PharmacyOrdersController.create → PharmacyOrdersService.create → PharmacyOrdersUseCases.create → PharmacyOrdersUseCases.readOwnOrder → PharmacyOrdersUseCases.composeOrders → CommunityPharmacyOrderChatAdapter.findPharmacyShowcases → CommunityOrderChatService.findOrganizationShowcases → CommunityOrganizationStaffService.verifiedActiveTenantIds | `src/modules/community/services/community-organization-staff.service.ts:283` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.create → PharmacyOrdersService.create → PharmacyOrdersUseCases.create → MessagingDomainEventAdapter.publish → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.create → PharmacyOrdersService.create → PharmacyOrdersUseCases.create → MessagingDomainEventAdapter.publish → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | PharmacyOrdersController.create → PharmacyOrdersService.create → PharmacyOrdersUseCases.create → MessagingDomainEventAdapter.publish → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |
| `pharmacy_inventory.inventory_ledger_entries` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.create → PharmacyOrdersService.create → PharmacyOrdersUseCases.create → PharmacyOrdersUseCases.reserveOrderLines → PharmacyOrdersUseCases.reserveLineStock → LedgerRepository.append | `src/modules/pharmacy_inventory/infrastructure/repositories/ledger.repository.ts:142` |
| `pharmacy_inventory.inventory_ledger_entries` | LEE | LEE | POR_SQL | PharmacyOrdersController.create → PharmacyOrdersService.create → PharmacyOrdersUseCases.create → PharmacyOrdersUseCases.reserveOrderLines → PharmacyOrdersUseCases.reserveLineStock → LedgerRepository.nextSequence | `src/modules/pharmacy_inventory/infrastructure/repositories/ledger.repository.ts:113` |
| `pharmacy_inventory.inventory_locations` | LEE | LEE | DIRECTA | PharmacyOrdersController.create → PharmacyOrdersService.create → PharmacyOrdersUseCases.create → PharmacyOrdersUseCases.reserveOrderLines → InventoryReadRepository.findActiveLocationsBySites | `src/modules/pharmacy_inventory/infrastructure/repositories/inventory-read.repository.ts:21` |
| `pharmacy_inventory.inventory_reservation_lines` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.create → PharmacyOrdersService.create → PharmacyOrdersUseCases.create → PharmacyOrdersUseCases.reserveOrderLines → PharmacyOrdersUseCases.reserveLineStock → ReservationsRepository.createLine | `src/modules/pharmacy_inventory/infrastructure/repositories/reservations.repository.ts:188` |
| `pharmacy_inventory.inventory_reservation_lines` | LEE | LEE | DIRECTA | PharmacyOrdersController.create → PharmacyOrdersService.create → PharmacyOrdersUseCases.create → PharmacyOrdersRepository.findLinesByReservationIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:220` |
| `pharmacy_inventory.inventory_reservations` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.create → PharmacyOrdersService.create → PharmacyOrdersUseCases.create → ReservationsRepository.create | `src/modules/pharmacy_inventory/infrastructure/repositories/reservations.repository.ts:158` |
| `pharmacy_inventory.inventory_reservations` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyOrdersController.create → PharmacyOrdersService.create → PharmacyOrdersUseCases.create → PharmacyOrdersUseCases.sealFrozenTotal | `src/modules/pharmacy_inventory/application/pharmacy-orders/pharmacy-orders.use-cases.ts:2050` |
| `pharmacy_inventory.inventory_reservations` | LEE | LEE | DIRECTA | PharmacyOrdersController.create → PharmacyOrdersService.create → PharmacyOrdersUseCases.create → PharmacyOrdersRepository.findOrderByIdempotencyKey | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:182` |
| `pharmacy_inventory.inventory_stock_positions` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyOrdersController.create → PharmacyOrdersService.create → PharmacyOrdersUseCases.create → PharmacyOrdersUseCases.reserveOrderLines → PharmacyOrdersUseCases.reserveLineStock | `src/modules/pharmacy_inventory/application/pharmacy-orders/pharmacy-orders.use-cases.ts:2311` |
| `pharmacy_inventory.inventory_stock_positions` | LEE | LEE | DIRECTA | PharmacyOrdersController.create → PharmacyOrdersService.create → PharmacyOrdersUseCases.create → PharmacyOrdersUseCases.reserveOrderLines → InventoryReadRepository.findStockPositions | `src/modules/pharmacy_inventory/infrastructure/repositories/inventory-read.repository.ts:41` |
| `pharmacy_inventory.pharmacy_order_substitutions` | LEE | LEE | DIRECTA | PharmacyOrdersController.create → PharmacyOrdersService.create → PharmacyOrdersUseCases.create → PharmacyOrdersUseCases.readOwnOrder → PharmacyOrdersUseCases.composeOrders → PharmacyOrderSubstitutionsRepository.findByReservationIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-order-substitutions.repository.ts:62` |
| `pharmacy.pharmacies` | LEE | LEE | DIRECTA | PharmacyOrdersController.create → PharmacyOrdersService.create → PharmacyOrdersUseCases.create → PharmacyDirectoryAdapter.findVisibleById → PharmacyReadRepository.findVisibleById | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:64` |
| `pharmacy.pharmacy_price_lists` | LEE | LEE | DIRECTA | PharmacyOrdersController.create → PharmacyOrdersService.create → PharmacyOrdersUseCases.create → PharmacyOrdersUseCases.freezePricesFor → PharmacyDirectoryAdapter.findCurrentPublicPriceLists → PharmacyReadRepository.findCurrentPublicPriceLists | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:226` |
| `pharmacy.pharmacy_product_prices` | LEE | LEE | DIRECTA | PharmacyOrdersController.create → PharmacyOrdersService.create → PharmacyOrdersUseCases.create → PharmacyOrdersUseCases.freezePricesFor → PharmacyDirectoryAdapter.findCurrentPrices → PharmacyReadRepository.findCurrentPrices | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:253` |
| `pharmacy.pharmacy_products` | LEE | LEE | DIRECTA | PharmacyOrdersController.create → PharmacyOrdersService.create → PharmacyOrdersUseCases.create → PharmacyDirectoryAdapter.findSellableProductsByIds → PharmacyReadRepository.findSellableProductsByIds | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:207` |
| `pharmacy.pharmacy_sites` | LEE | LEE | DIRECTA | PharmacyOrdersController.create → PharmacyOrdersService.create → PharmacyOrdersUseCases.create → PharmacyDirectoryAdapter.findActiveSiteById → PharmacyReadRepository.findActiveSiteById | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:93` |
| `profiles.person_profiles` | LEE | LEE | DIRECTA | PharmacyOrdersController.create → PharmacyOrdersService.create → PharmacyOrdersUseCases.create → PharmacyOrdersUseCases.readOwnOrder → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findPersonNamesByProfileIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:143` |
| `profiles.persons` | LEE | LEE | DIRECTA | PharmacyOrdersController.create → PharmacyOrdersService.create → PharmacyOrdersUseCases.create → PharmacyOrdersUseCases.readOwnOrder → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findPersonNamesByProfileIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:135` |
| `profiles.practitioner_specialties` | LEE | LEE | DIRECTA | PharmacyOrdersController.create → PharmacyOrdersService.create → PharmacyOrdersUseCases.create → PharmacyOrdersUseCases.readOwnOrder → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findPrimarySpecialtyConceptIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:331` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | PharmacyOrdersController.create → PharmacyOrdersService.create → PharmacyOrdersUseCases.create → PharmacyOrdersUseCases.readOwnOrder → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findConceptsByIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:370` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | calculado: `null` | `src/modules/pharmacy_inventory/infrastructure/adapters/messaging-domain-event.adapter.ts:16` |

### Cuerpo — DTO `CreatePharmacyOrderDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `siteId` | `string` | Sí | formato uuid | `@IsUUID()` | Sede de farmacia | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:69` |
| `medicationRequestId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Receta (clinical.medication_requests) | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:80` |
| `deliveryMode` | `string` | No | valores: RETIRO, DOMICILIO, TRABAJO | `@IsOptional()` `@IsIn([...DELIVERY_MODES])` | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:91` |
| `idempotencyKey` | `string` | No | longitud máxima 120 | `@IsOptional()` `@IsString()` `@MaxLength(120)` | Clave de idempotencia; repetirla devuelve el mismo pedido | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:104` |
| `lines` | `array<PharmacyOrderLineInputDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => PharmacyOrderLineInputDto)` | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:114` |
| `lines[].productId` | `string` | Sí | formato uuid | `@IsUUID()` | Producto de farmacia | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:51` |
| `lines[].quantity` | `number` | Sí | mínimo 0; mayor que 0 | `@IsNumber()` `@IsPositive()` | Cantidad solicitada | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:59` |

**Payload mínimo** (sólo los obligatorios):

```json
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

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<PharmacyOrderDto>` · DTO `PharmacyOrderDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reservationLines` | `array<PharmacyOrderReservationLineDto>` | Sí | — | — | Porciones confirmadas o entregadas vigentes para facturación | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:253` |
| `reservationLines[].id` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:212` |
| `reservationLines[].productId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:215` |
| `reservationLines[].quantity` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:218` |
| `reservationLines[].unitPriceAmount` | `string` | Sí | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:221` |
| `reservationLines[].billedAmount` | `string` | Sí | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:224` |
| `reservationLines[].currencyConceptId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:227` |
| `insuranceSettlement` | `PatientInsuranceSettlementDto` | Sí | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:256` |
| `insuranceSettlement.claimId` | `string` | Sí | formato uuid | — | — | sin fuente |
| `insuranceSettlement.claimIdentifier` | `string` | Sí | — | — | — | sin fuente |
| `insuranceSettlement.adjudicationVersionId` | `string` | Sí | formato uuid | — | — | sin fuente |
| `insuranceSettlement.adjudicationVersion` | `number` | Sí | formato int32; mínimo 1 | — | — | sin fuente |
| `insuranceSettlement.eobId` | `string` | Sí | formato uuid | — | — | sin fuente |
| `insuranceSettlement.carrierName` | `string` | Sí | — | — | — | sin fuente |
| `insuranceSettlement.policyIdentifier` | `string` | Sí | admite null | — | — | sin fuente |
| `insuranceSettlement.totalBilledAmount` | `string` | Sí | — | — | Total facturado, decimal exacto | sin fuente |
| `insuranceSettlement.totalApprovedAmount` | `string` | Sí | — | — | Aporte del seguro, decimal exacto | sin fuente |
| `insuranceSettlement.totalPatientAmount` | `string` | Sí | — | — | Cargo confirmado al paciente, decimal exacto | sin fuente |
| `insuranceSettlement.totalDeniedAmount` | `string` | Sí | — | — | Importe excluido sin asignar, decimal exacto | sin fuente |
| `insuranceSettlement.currencyCode` | `string` | Sí | — | — | — | sin fuente |
| `insuranceSettlement.result` | `string` | Sí | valores: APPROVED, PARTIALLY_APPROVED, DENIED | — | — | sin fuente |
| `insuranceSettlement.exclusions` | `array<PatientInsuranceSettlementExclusionDto>` | Sí | — | — | — | sin fuente |
| `insuranceSettlement.exclusions[].claimLineId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/patient-settlement.dto.ts:9` |
| `insuranceSettlement.exclusions[].itemId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/patient-settlement.dto.ts:12` |
| `insuranceSettlement.exclusions[].itemName` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/patient-settlement.dto.ts:15` |
| `insuranceSettlement.exclusions[].amount` | `string` | Sí | — | — | Importe decimal exacto excluido | `src/modules/pharmacy_inventory/presentation/dto/patient-settlement.dto.ts:18` |
| `insuranceSettlement.exclusions[].policyClauseReference` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/patient-settlement.dto.ts:21` |
| `insuranceSettlement.exclusions[].denialRationale` | `string` | Sí | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/patient-settlement.dto.ts:24` |
| `insuranceSettlementAvailability` | `string` | Sí | valores: AVAILABLE, PENDING_PUBLICATION, UNDER_REVIEW, NOT_AVAILABLE | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:261` |
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:267` |
| `status` | `InventoryConceptDto` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:273` |
| `status.code` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:17` |
| `status.display` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:23` |
| `createdAt` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:279` |
| `expiresAt` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:286` |
| `siteId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:292` |
| `siteName` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:298` |
| `pharmacyId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:304` |
| `pharmacyName` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:310` |
| `medicationRequestId` | `string` | No | formato uuid; admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:316` |
| `prescriber` | `PharmacyOrderPrescriberDto` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:328` |
| `prescriber.name` | `string` | No | admite null | — | — | sin fuente |
| `prescriber.specialty` | `string` | No | admite null | — | — | sin fuente |
| `patientName` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:336` |
| `deliveryMode` | `InventoryConceptDto` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:343` |
| `deliveryMode.code` | `string` | No | — | — | — | sin fuente |
| `deliveryMode.display` | `string` | No | — | — | — | sin fuente |
| `deliveryAddressText` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:351` |
| `pickupCode` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:362` |
| `pharmacyPublicProfileId` | `string` | No | formato uuid; admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:373` |
| `pharmacyPublicSlug` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:380` |
| `totalAmount` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:391` |
| `currency` | `InventoryConceptDto` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:397` |
| `currency.code` | `string` | No | — | — | — | sin fuente |
| `currency.display` | `string` | No | — | — | — | sin fuente |
| `rejectionReasonText` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:404` |
| `substitutions` | `array<PharmacyOrderSubstitutionDto>` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:412` |
| `substitutions[].id` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:427` |
| `substitutions[].originalProductId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:433` |
| `substitutions[].originalName` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:439` |
| `substitutions[].originalUnitPriceAmount` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:445` |
| `substitutions[].proposedProductId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:451` |
| `substitutions[].proposedName` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:457` |
| `substitutions[].proposedUnitPriceAmount` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:463` |
| `substitutions[].currency` | `InventoryConceptDto` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:469` |
| `substitutions[].currency.code` | `string` | No | — | — | — | sin fuente |
| `substitutions[].currency.display` | `string` | No | — | — | — | sin fuente |
| `substitutions[].status` | `InventoryConceptDto` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:475` |
| `substitutions[].status.code` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:17` |
| `substitutions[].status.display` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:23` |
| `substitutions[].decidedAt` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:481` |
| `lines` | `array<PharmacyOrderLineDto>` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:418` |
| `lines[].productId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:123` |
| `lines[].medicationConceptId` | `string` | No | formato uuid; admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:129` |
| `lines[].productCode` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:135` |
| `lines[].brandName` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:141` |
| `lines[].genericName` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:147` |
| `lines[].strengthText` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:153` |
| `lines[].packageSizeText` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:159` |
| `lines[].medication` | `InventoryConceptDto` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:165` |
| `lines[].medication.code` | `string` | No | — | — | — | sin fuente |
| `lines[].medication.display` | `string` | No | — | — | — | sin fuente |
| `lines[].requestedQuantity` | `number` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:171` |
| `lines[].reservedQuantity` | `number` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:177` |
| `lines[].fulfilledQuantity` | `number` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:184` |
| `lines[].unitPriceAmount` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:193` |
| `lines[].currency` | `InventoryConceptDto` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:199` |
| `lines[].currency.code` | `string` | No | — | — | — | sin fuente |
| `lines[].currency.display` | `string` | No | — | — | — | sin fuente |
| `lines[].status` | `InventoryConceptDto` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:206` |
| `lines[].status.code` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:17` |
| `lines[].status.display` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:23` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Sede de farmacia no encontrada; ResourceNotFoundException: Receta no encontrada; ResourceNotFoundException: Producto no disponible en la sede |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta autenticada no tiene perfil de paciente; PreconditionFailedException: El pedido repite productos; use una línea por producto; PreconditionFailedException: El envío a domicilio o al trabajo llega con el carril de envío (FAR-E4); hoy solo RETIRO |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharmacy_inventory.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / pharmacy inventory — etapa `ctrl:PharmacyOrdersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 18. GET /pharmacy/orders/{id}

- **Origen:** CONTRATO
- **Nombre:** Consultar un pedido de farmacia (FAR-E1)
- **Bloque:** Farmacia
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyOrdersController.getOrder` — `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-orders.controller.ts:136`

### Qué es y para qué sirve (negocio)

Consultar un pedido de farmacia (FAR-E1). Dentro del módulo (descripción del modelo, en inglés): «Prevents overselling and untraceable adjustments under concurrent manual, API, dispensing and receiving operations.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_25_pharmacy_inventory.puml:20`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`GET /pharmacy/orders/{id}` la atiende `PharmacyOrdersController.getOrder` (src/modules/pharmacy_inventory/presentation/controllers/pharmacy-orders.controller.ts:136). Exige sesión; el controlador no declara roles. Delega en `PharmacyOrdersService.getOrder`. Crea filas en messaging.domain_events, messaging.in_app_notifications, messaging.notification_deliveries, messaging.notification_requests, messaging.outbox_messages, pharmacy_inventory.inventory_ledger_entries. Actualiza iam.devices, pharmacy_inventory.inventory_reservation_lines, pharmacy_inventory.inventory_reservations, pharmacy_inventory.inventory_stock_positions. Lee clinical.medication_requests, clinical.service_requests, common.addresses, community.public_profiles, diagnostic_units.diagnostic_study_offerings, diagnostic_units.diagnostic_units, directory.tenant_memberships, directory.tenants y 31 más. Publica un evento calculado (null).

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-orders.controller.ts:136` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-orders.controller.ts:136` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.medication_requests` | LEE | LEE | DIRECTA | PharmacyOrdersController.getOrder → PharmacyOrdersService.getOrder → PharmacyOrdersUseCases.getOrder → PharmacyOrdersUseCases.expireDue → PharmacyOrdersRepository.findPrescriberProfileId | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:290` |
| `clinical.service_requests` | LEE | LEE | DIRECTA | PharmacyOrdersController.getOrder → PharmacyOrdersService.getOrder → PharmacyOrdersUseCases.getOrder → InsurancePatientSettlementAdapter.forOrders → PatientSettlementService.forOrders → PatientSettlementRepository.ownedOrders | `src/modules/insurance/infrastructure/repositories/patient-settlement.repository.ts:58` |
| `common.addresses` | LEE | LEE | DIRECTA | PharmacyOrdersController.getOrder → PharmacyOrdersService.getOrder → PharmacyOrdersUseCases.getOrder → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findAddressesByIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:361` |
| `community.public_profiles` | LEE | LEE | DIRECTA | PharmacyOrdersController.getOrder → PharmacyOrdersService.getOrder → PharmacyOrdersUseCases.getOrder → PharmacyOrdersUseCases.composeOrders → CommunityPharmacyOrderChatAdapter.findPharmacyShowcases → CommunityOrderChatService.findOrganizationShowcases → PublicProfilesRepository.listByIds | `src/modules/community/repositories/public-profiles.repository.ts:135` |
| `diagnostic_units.diagnostic_study_offerings` | LEE | LEE | DIRECTA | PharmacyOrdersController.getOrder → PharmacyOrdersService.getOrder → PharmacyOrdersUseCases.getOrder → InsurancePatientSettlementAdapter.forOrders → PatientSettlementService.forOrders → PatientSettlementRepository.load | `src/modules/insurance/infrastructure/repositories/patient-settlement.repository.ts:137` |
| `diagnostic_units.diagnostic_units` | LEE | LEE | DIRECTA | PharmacyOrdersController.getOrder → PharmacyOrdersService.getOrder → PharmacyOrdersUseCases.getOrder → InsurancePatientSettlementAdapter.forOrders → PatientSettlementService.forOrders → LinkedClaimOrderService.loadSnapshots → LinkedClaimOrderService.resolveBatch → LinkedOrderDataRepository.findDiagnosticUnits | `src/modules/insurance/infrastructure/repositories/linked-order-data.repository.ts:139` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | PharmacyOrdersController.getOrder → PharmacyOrdersService.getOrder → PharmacyOrdersUseCases.getOrder → DirectoryTenantAdministrationAdapter.canAdminister → TenantAdministrationService.canAdminister → TenantAdministrationService.administersByMembership → TenantAdministrationService.activeMembershipOf → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `directory.tenants` | LEE | LEE | DIRECTA | PharmacyOrdersController.getOrder → PharmacyOrdersService.getOrder → PharmacyOrdersUseCases.getOrder → PharmacyOrdersUseCases.composeOrders → CommunityPharmacyOrderChatAdapter.findPharmacyShowcases → CommunityOrderChatService.findOrganizationShowcases → CommunityOrganizationStaffService.verifiedActiveTenantIds | `src/modules/community/services/community-organization-staff.service.ts:283` |
| `iam.devices` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyOrdersController.getOrder → PharmacyOrdersService.getOrder → PharmacyOrdersUseCases.getOrder → PharmacyOrdersUseCases.expireDue → PharmacyOrderNotificationsService.expiredToPrescriber → NotifyPharmacyOrderUseCase.expiredToPrescriber → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → WebPushService.pushToUser → WebPushService.sendTo → WebPushService.forget | `src/modules/messaging/services/web-push.service.ts:235` |
| `iam.devices` | LEE | LEE | DIRECTA | PharmacyOrdersController.getOrder → PharmacyOrdersService.getOrder → PharmacyOrdersUseCases.getOrder → PharmacyOrdersUseCases.expireDue → PharmacyOrderNotificationsService.expiredToPrescriber → NotifyPharmacyOrderUseCase.expiredToPrescriber → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → WebPushService.pushToUser | `src/modules/messaging/services/web-push.service.ts:172` |
| `insurance.claim_adjudication_versions` | LEE | LEE | DIRECTA | PharmacyOrdersController.getOrder → PharmacyOrdersService.getOrder → PharmacyOrdersUseCases.getOrder → InsurancePatientSettlementAdapter.forOrders → PatientSettlementService.forOrders → PatientSettlementRepository.load | `src/modules/insurance/infrastructure/repositories/patient-settlement.repository.ts:97` |
| `insurance.claim_line_adjudications` | LEE | LEE | DIRECTA | PharmacyOrdersController.getOrder → PharmacyOrdersService.getOrder → PharmacyOrdersUseCases.getOrder → InsurancePatientSettlementAdapter.forOrders → PatientSettlementService.forOrders → PatientSettlementRepository.load | `src/modules/insurance/infrastructure/repositories/patient-settlement.repository.ts:116` |
| `insurance.claim_reversals` | LEE | LEE | DIRECTA | PharmacyOrdersController.getOrder → PharmacyOrdersService.getOrder → PharmacyOrdersUseCases.getOrder → InsurancePatientSettlementAdapter.forOrders → PatientSettlementService.forOrders → PatientSettlementRepository.load | `src/modules/insurance/infrastructure/repositories/patient-settlement.repository.ts:104` |
| `insurance.insurance_carriers` | LEE | LEE | DIRECTA | PharmacyOrdersController.getOrder → PharmacyOrdersService.getOrder → PharmacyOrdersUseCases.getOrder → InsurancePatientSettlementAdapter.forOrders → PatientSettlementService.forOrders → PatientSettlementRepository.load | `src/modules/insurance/infrastructure/repositories/patient-settlement.repository.ts:110` |
| `insurance.insurance_claim_lines` | LEE | LEE | DIRECTA | PharmacyOrdersController.getOrder → PharmacyOrdersService.getOrder → PharmacyOrdersUseCases.getOrder → InsurancePatientSettlementAdapter.forOrders → PatientSettlementService.forOrders → PatientSettlementRepository.load | `src/modules/insurance/infrastructure/repositories/patient-settlement.repository.ts:96` |
| `insurance.insurance_claims` | LEE | LEE | DIRECTA | PharmacyOrdersController.getOrder → PharmacyOrdersService.getOrder → PharmacyOrdersUseCases.getOrder → InsurancePatientSettlementAdapter.forOrders → PatientSettlementService.forOrders → PatientSettlementRepository.load | `src/modules/insurance/infrastructure/repositories/patient-settlement.repository.ts:86` |
| `insurance.insurance_plans` | LEE | LEE | DIRECTA | PharmacyOrdersController.getOrder → PharmacyOrdersService.getOrder → PharmacyOrdersUseCases.getOrder → InsurancePatientSettlementAdapter.forOrders → PatientSettlementService.forOrders → PatientSettlementRepository.load | `src/modules/insurance/infrastructure/repositories/patient-settlement.repository.ts:105` |
| `insurance.insurance_products` | LEE | LEE | DIRECTA | PharmacyOrdersController.getOrder → PharmacyOrdersService.getOrder → PharmacyOrdersUseCases.getOrder → InsurancePatientSettlementAdapter.forOrders → PatientSettlementService.forOrders → PatientSettlementRepository.load | `src/modules/insurance/infrastructure/repositories/patient-settlement.repository.ts:121` |
| `insurance.patient_coverages` | LEE | LEE | DIRECTA | PharmacyOrdersController.getOrder → PharmacyOrdersService.getOrder → PharmacyOrdersUseCases.getOrder → InsurancePatientSettlementAdapter.forOrders → PatientSettlementService.forOrders → PatientSettlementRepository.load | `src/modules/insurance/infrastructure/repositories/patient-settlement.repository.ts:84` |
| `insurance.patient_explanations_of_benefit` | LEE | LEE | DIRECTA | PharmacyOrdersController.getOrder → PharmacyOrdersService.getOrder → PharmacyOrdersUseCases.getOrder → InsurancePatientSettlementAdapter.forOrders → PatientSettlementService.forOrders → PatientSettlementRepository.load | `src/modules/insurance/infrastructure/repositories/patient-settlement.repository.ts:100` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.getOrder → PharmacyOrdersService.getOrder → PharmacyOrdersUseCases.getOrder → PharmacyOrdersUseCases.expireDue → MessagingDomainEventAdapter.publish → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.in_app_notifications` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.getOrder → PharmacyOrdersService.getOrder → PharmacyOrdersUseCases.getOrder → PharmacyOrdersUseCases.expireDue → PharmacyOrderNotificationsService.expiredToPrescriber → NotifyPharmacyOrderUseCase.expiredToPrescriber → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createInAppNotification | `src/modules/messaging/repositories/notifications.repository.ts:710` |
| `messaging.in_app_notifications` | LEE | LEE | DIRECTA | PharmacyOrdersController.getOrder → PharmacyOrdersService.getOrder → PharmacyOrdersUseCases.getOrder → PharmacyOrdersUseCases.expireDue → PharmacyOrderNotificationsService.expiredToPrescriber → NotifyPharmacyOrderUseCase.expiredToPrescriber → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findUnreadInAppForResource | `src/modules/messaging/repositories/notifications.repository.ts:845` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | PharmacyOrdersController.getOrder → PharmacyOrdersService.getOrder → PharmacyOrdersUseCases.getOrder → PharmacyOrdersUseCases.expireDue → PharmacyOrderNotificationsService.expiredToPrescriber → NotifyPharmacyOrderUseCase.expiredToPrescriber → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findActiveChannelByType | `src/modules/messaging/repositories/notifications.repository.ts:189` |
| `messaging.messaging_providers` | LEE | LEE | DIRECTA | PharmacyOrdersController.getOrder → PharmacyOrdersService.getOrder → PharmacyOrdersUseCases.getOrder → PharmacyOrdersUseCases.expireDue → PharmacyOrderNotificationsService.expiredToPrescriber → NotifyPharmacyOrderUseCase.expiredToPrescriber → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findProviderById | `src/modules/messaging/repositories/notifications.repository.ts:437` |
| `messaging.notification_deliveries` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.getOrder → PharmacyOrdersService.getOrder → PharmacyOrdersUseCases.getOrder → PharmacyOrdersUseCases.expireDue → PharmacyOrderNotificationsService.expiredToPrescriber → NotifyPharmacyOrderUseCase.expiredToPrescriber → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createDelivery | `src/modules/messaging/repositories/notifications.repository.ts:514` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.getOrder → PharmacyOrdersService.getOrder → PharmacyOrdersUseCases.getOrder → PharmacyOrdersUseCases.expireDue → PharmacyOrderNotificationsService.expiredToPrescriber → NotifyPharmacyOrderUseCase.expiredToPrescriber → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.getOrder → PharmacyOrdersService.getOrder → PharmacyOrdersUseCases.getOrder → PharmacyOrdersUseCases.expireDue → MessagingDomainEventAdapter.publish → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | PharmacyOrdersController.getOrder → PharmacyOrdersService.getOrder → PharmacyOrdersUseCases.getOrder → PharmacyOrdersUseCases.expireDue → MessagingDomainEventAdapter.publish → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |
| `messaging.provider_channel_configs` | LEE | LEE | DIRECTA | PharmacyOrdersController.getOrder → PharmacyOrdersService.getOrder → PharmacyOrdersUseCases.getOrder → PharmacyOrdersUseCases.expireDue → PharmacyOrderNotificationsService.expiredToPrescriber → NotifyPharmacyOrderUseCase.expiredToPrescriber → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findChannelConfigs | `src/modules/messaging/repositories/notifications.repository.ts:405` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | PharmacyOrdersController.getOrder → PharmacyOrdersService.getOrder → PharmacyOrdersUseCases.getOrder → PharmacyOrdersUseCases.expireDue → PharmacyOrderNotificationsService.expiredToPrescriber → NotifyPharmacyOrderUseCase.expiredToPrescriber → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `pharmacy_inventory.inventory_ledger_entries` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.getOrder → PharmacyOrdersService.getOrder → PharmacyOrdersUseCases.getOrder → PharmacyOrdersUseCases.expireDue → InventoryReservationsService.releaseConfirmedLines → ReleaseConfirmedReservationLinesUseCase.execute → LedgerRepository.append | `src/modules/pharmacy_inventory/infrastructure/repositories/ledger.repository.ts:142` |
| `pharmacy_inventory.inventory_ledger_entries` | LEE | LEE | POR_SQL | PharmacyOrdersController.getOrder → PharmacyOrdersService.getOrder → PharmacyOrdersUseCases.getOrder → PharmacyOrdersUseCases.expireDue → InventoryReservationsService.releaseConfirmedLines → ReleaseConfirmedReservationLinesUseCase.execute → LedgerRepository.nextSequence | `src/modules/pharmacy_inventory/infrastructure/repositories/ledger.repository.ts:113` |
| `pharmacy_inventory.inventory_reservation_lines` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyOrdersController.getOrder → PharmacyOrdersService.getOrder → PharmacyOrdersUseCases.getOrder → PharmacyOrdersUseCases.expireDue → InventoryReservationsService.releaseConfirmedLines → ReleaseConfirmedReservationLinesUseCase.execute | `src/modules/pharmacy_inventory/application/inventory-reservations/release-confirmed-reservation-lines.use-case.ts:44` |
| `pharmacy_inventory.inventory_reservation_lines` | LEE | LEE | DIRECTA | PharmacyOrdersController.getOrder → PharmacyOrdersService.getOrder → PharmacyOrdersUseCases.getOrder → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findLinesByReservationIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:220` |
| `pharmacy_inventory.inventory_reservations` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyOrdersController.getOrder → PharmacyOrdersService.getOrder → PharmacyOrdersUseCases.getOrder → PharmacyOrdersUseCases.expireDue | `src/modules/pharmacy_inventory/application/pharmacy-orders/pharmacy-orders.use-cases.ts:1696` |
| `pharmacy_inventory.inventory_reservations` | LEE | LEE | DIRECTA | PharmacyOrdersController.getOrder → PharmacyOrdersService.getOrder → PharmacyOrdersUseCases.getOrder → PharmacyOrdersRepository.findOrderById | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:45` |
| `pharmacy_inventory.inventory_stock_positions` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyOrdersController.getOrder → PharmacyOrdersService.getOrder → PharmacyOrdersUseCases.getOrder → PharmacyOrdersUseCases.expireDue → InventoryReservationsService.releaseConfirmedLines → ReleaseConfirmedReservationLinesUseCase.execute | `src/modules/pharmacy_inventory/application/inventory-reservations/release-confirmed-reservation-lines.use-case.ts:72` |
| `pharmacy_inventory.inventory_stock_positions` | LEE | LEE | DIRECTA | PharmacyOrdersController.getOrder → PharmacyOrdersService.getOrder → PharmacyOrdersUseCases.getOrder → PharmacyOrdersUseCases.expireDue → InventoryReservationsService.releaseConfirmedLines → ReleaseConfirmedReservationLinesUseCase.execute → StockPositionsRepository.findByKeyForUpdate | `src/modules/pharmacy_inventory/infrastructure/repositories/stock-positions.repository.ts:82` |
| `pharmacy_inventory.pharmacy_order_substitutions` | LEE | LEE | DIRECTA | PharmacyOrdersController.getOrder → PharmacyOrdersService.getOrder → PharmacyOrdersUseCases.getOrder → PharmacyOrdersUseCases.composeOrders → PharmacyOrderSubstitutionsRepository.findByReservationIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-order-substitutions.repository.ts:62` |
| `pharmacy.pharmacies` | LEE | LEE | DIRECTA | PharmacyOrdersController.getOrder → PharmacyOrdersService.getOrder → PharmacyOrdersUseCases.getOrder → PharmacyOrdersRepository.findPharmaciesByIdsInTenant | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:235` |
| `pharmacy.pharmacy_products` | LEE | LEE | DIRECTA | PharmacyOrdersController.getOrder → PharmacyOrdersService.getOrder → PharmacyOrdersUseCases.getOrder → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findProductsByIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:256` |
| `pharmacy.pharmacy_sites` | LEE | LEE | DIRECTA | PharmacyOrdersController.getOrder → PharmacyOrdersService.getOrder → PharmacyOrdersUseCases.getOrder → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findSitesByIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:247` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | PharmacyOrdersController.getOrder → PharmacyOrdersService.getOrder → PharmacyOrdersUseCases.getOrder → InsurancePatientSettlementAdapter.forOrders → PatientSettlementService.forOrders → InsurancePatientAccountRepository.findPatientProfile | `src/modules/insurance/infrastructure/repositories/insurance-patient-account.repository.ts:34` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | PharmacyOrdersController.getOrder → PharmacyOrdersService.getOrder → PharmacyOrdersUseCases.getOrder → InsurancePatientSettlementAdapter.forOrders → PatientSettlementService.forOrders → InsurancePatientAccountRepository.findActiveAccountLink | `src/modules/insurance/infrastructure/repositories/insurance-patient-account.repository.ts:24` |
| `profiles.person_profiles` | LEE | LEE | DIRECTA | PharmacyOrdersController.getOrder → PharmacyOrdersService.getOrder → PharmacyOrdersUseCases.getOrder → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findPersonNamesByProfileIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:143` |
| `profiles.persons` | LEE | LEE | DIRECTA | PharmacyOrdersController.getOrder → PharmacyOrdersService.getOrder → PharmacyOrdersUseCases.getOrder → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findPersonNamesByProfileIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:135` |
| `profiles.practitioner_specialties` | LEE | LEE | DIRECTA | PharmacyOrdersController.getOrder → PharmacyOrdersService.getOrder → PharmacyOrdersUseCases.getOrder → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findPrimarySpecialtyConceptIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:331` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | PharmacyOrdersController.getOrder → PharmacyOrdersService.getOrder → PharmacyOrdersUseCases.getOrder → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findConceptsByIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:370` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | calculado: `null` | `src/modules/pharmacy_inventory/infrastructure/adapters/messaging-domain-event.adapter.ts:16` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PharmacyOrderDto>` · DTO `PharmacyOrderDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reservationLines` | `array<PharmacyOrderReservationLineDto>` | Sí | — | — | Porciones confirmadas o entregadas vigentes para facturación | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:253` |
| `reservationLines[].id` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:212` |
| `reservationLines[].productId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:215` |
| `reservationLines[].quantity` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:218` |
| `reservationLines[].unitPriceAmount` | `string` | Sí | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:221` |
| `reservationLines[].billedAmount` | `string` | Sí | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:224` |
| `reservationLines[].currencyConceptId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:227` |
| `insuranceSettlement` | `PatientInsuranceSettlementDto` | Sí | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:256` |
| `insuranceSettlement.claimId` | `string` | Sí | formato uuid | — | — | sin fuente |
| `insuranceSettlement.claimIdentifier` | `string` | Sí | — | — | — | sin fuente |
| `insuranceSettlement.adjudicationVersionId` | `string` | Sí | formato uuid | — | — | sin fuente |
| `insuranceSettlement.adjudicationVersion` | `number` | Sí | formato int32; mínimo 1 | — | — | sin fuente |
| `insuranceSettlement.eobId` | `string` | Sí | formato uuid | — | — | sin fuente |
| `insuranceSettlement.carrierName` | `string` | Sí | — | — | — | sin fuente |
| `insuranceSettlement.policyIdentifier` | `string` | Sí | admite null | — | — | sin fuente |
| `insuranceSettlement.totalBilledAmount` | `string` | Sí | — | — | Total facturado, decimal exacto | sin fuente |
| `insuranceSettlement.totalApprovedAmount` | `string` | Sí | — | — | Aporte del seguro, decimal exacto | sin fuente |
| `insuranceSettlement.totalPatientAmount` | `string` | Sí | — | — | Cargo confirmado al paciente, decimal exacto | sin fuente |
| `insuranceSettlement.totalDeniedAmount` | `string` | Sí | — | — | Importe excluido sin asignar, decimal exacto | sin fuente |
| `insuranceSettlement.currencyCode` | `string` | Sí | — | — | — | sin fuente |
| `insuranceSettlement.result` | `string` | Sí | valores: APPROVED, PARTIALLY_APPROVED, DENIED | — | — | sin fuente |
| `insuranceSettlement.exclusions` | `array<PatientInsuranceSettlementExclusionDto>` | Sí | — | — | — | sin fuente |
| `insuranceSettlement.exclusions[].claimLineId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/patient-settlement.dto.ts:9` |
| `insuranceSettlement.exclusions[].itemId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/patient-settlement.dto.ts:12` |
| `insuranceSettlement.exclusions[].itemName` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/patient-settlement.dto.ts:15` |
| `insuranceSettlement.exclusions[].amount` | `string` | Sí | — | — | Importe decimal exacto excluido | `src/modules/pharmacy_inventory/presentation/dto/patient-settlement.dto.ts:18` |
| `insuranceSettlement.exclusions[].policyClauseReference` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/patient-settlement.dto.ts:21` |
| `insuranceSettlement.exclusions[].denialRationale` | `string` | Sí | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/patient-settlement.dto.ts:24` |
| `insuranceSettlementAvailability` | `string` | Sí | valores: AVAILABLE, PENDING_PUBLICATION, UNDER_REVIEW, NOT_AVAILABLE | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:261` |
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:267` |
| `status` | `InventoryConceptDto` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:273` |
| `status.code` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:17` |
| `status.display` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:23` |
| `createdAt` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:279` |
| `expiresAt` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:286` |
| `siteId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:292` |
| `siteName` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:298` |
| `pharmacyId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:304` |
| `pharmacyName` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:310` |
| `medicationRequestId` | `string` | No | formato uuid; admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:316` |
| `prescriber` | `PharmacyOrderPrescriberDto` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:328` |
| `prescriber.name` | `string` | No | admite null | — | — | sin fuente |
| `prescriber.specialty` | `string` | No | admite null | — | — | sin fuente |
| `patientName` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:336` |
| `deliveryMode` | `InventoryConceptDto` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:343` |
| `deliveryMode.code` | `string` | No | — | — | — | sin fuente |
| `deliveryMode.display` | `string` | No | — | — | — | sin fuente |
| `deliveryAddressText` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:351` |
| `pickupCode` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:362` |
| `pharmacyPublicProfileId` | `string` | No | formato uuid; admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:373` |
| `pharmacyPublicSlug` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:380` |
| `totalAmount` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:391` |
| `currency` | `InventoryConceptDto` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:397` |
| `currency.code` | `string` | No | — | — | — | sin fuente |
| `currency.display` | `string` | No | — | — | — | sin fuente |
| `rejectionReasonText` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:404` |
| `substitutions` | `array<PharmacyOrderSubstitutionDto>` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:412` |
| `substitutions[].id` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:427` |
| `substitutions[].originalProductId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:433` |
| `substitutions[].originalName` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:439` |
| `substitutions[].originalUnitPriceAmount` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:445` |
| `substitutions[].proposedProductId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:451` |
| `substitutions[].proposedName` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:457` |
| `substitutions[].proposedUnitPriceAmount` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:463` |
| `substitutions[].currency` | `InventoryConceptDto` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:469` |
| `substitutions[].currency.code` | `string` | No | — | — | — | sin fuente |
| `substitutions[].currency.display` | `string` | No | — | — | — | sin fuente |
| `substitutions[].status` | `InventoryConceptDto` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:475` |
| `substitutions[].status.code` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:17` |
| `substitutions[].status.display` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:23` |
| `substitutions[].decidedAt` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:481` |
| `lines` | `array<PharmacyOrderLineDto>` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:418` |
| `lines[].productId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:123` |
| `lines[].medicationConceptId` | `string` | No | formato uuid; admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:129` |
| `lines[].productCode` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:135` |
| `lines[].brandName` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:141` |
| `lines[].genericName` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:147` |
| `lines[].strengthText` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:153` |
| `lines[].packageSizeText` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:159` |
| `lines[].medication` | `InventoryConceptDto` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:165` |
| `lines[].medication.code` | `string` | No | — | — | — | sin fuente |
| `lines[].medication.display` | `string` | No | — | — | — | sin fuente |
| `lines[].requestedQuantity` | `number` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:171` |
| `lines[].reservedQuantity` | `number` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:177` |
| `lines[].fulfilledQuantity` | `number` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:184` |
| `lines[].unitPriceAmount` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:193` |
| `lines[].currency` | `InventoryConceptDto` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:199` |
| `lines[].currency.code` | `string` | No | — | — | — | sin fuente |
| `lines[].currency.display` | `string` | No | — | — | — | sin fuente |
| `lines[].status` | `InventoryConceptDto` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:206` |
| `lines[].status.code` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:17` |
| `lines[].status.display` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:23` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharmacy_inventory.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/patient-coverage-copays.int-spec.ts:633` |

### Flujos

- src / modules / pharmacy inventory — etapa `ctrl:PharmacyOrdersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 19. POST /pharmacy/orders/{id}/accept-substitutions

- **Origen:** CONTRATO
- **Nombre:** Aceptar los genéricos propuestos (paciente)
- **Bloque:** Farmacia
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyOrdersController.acceptSubstitutions` — `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-orders.controller.ts:249`

### Qué es y para qué sirve (negocio)

Aceptar los genéricos propuestos (paciente). Dentro del módulo (descripción del modelo, en inglés): «Prevents overselling and untraceable adjustments under concurrent manual, API, dispensing and receiving operations.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_25_pharmacy_inventory.puml:20`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`POST /pharmacy/orders/{id}/accept-substitutions` la atiende `PharmacyOrdersController.acceptSubstitutions` (src/modules/pharmacy_inventory/presentation/controllers/pharmacy-orders.controller.ts:249). Exige sesión con alguno de los roles PATIENT. Delega en `PharmacyOrdersService.acceptSubstitutions`. Crea filas en messaging.domain_events, messaging.outbox_messages, pharmacy_inventory.inventory_ledger_entries, pharmacy_inventory.inventory_reservation_lines. Actualiza pharmacy_inventory.inventory_reservation_lines, pharmacy_inventory.inventory_reservations, pharmacy_inventory.inventory_stock_positions, pharmacy_inventory.pharmacy_order_substitutions. Lee clinical.medication_requests, common.addresses, community.public_profiles, directory.tenants, messaging.outbox_messages, pharmacy_inventory.inventory_ledger_entries, pharmacy_inventory.inventory_locations, pharmacy_inventory.inventory_reservation_lines y 10 más. Publica un evento calculado (null).

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PATIENT | `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-orders.controller.ts:249` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-orders.controller.ts:249` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.medication_requests` | LEE | LEE | DIRECTA | PharmacyOrdersController.acceptSubstitutions → PharmacyOrdersService.acceptSubstitutions → PharmacyOrdersUseCases.acceptSubstitutions → PharmacyOrdersUseCases.readOwnOrder → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findPrescriberProfileIdsByRequestIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:307` |
| `common.addresses` | LEE | LEE | DIRECTA | PharmacyOrdersController.acceptSubstitutions → PharmacyOrdersService.acceptSubstitutions → PharmacyOrdersUseCases.acceptSubstitutions → PharmacyOrdersUseCases.readOwnOrder → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findAddressesByIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:361` |
| `community.public_profiles` | LEE | LEE | DIRECTA | PharmacyOrdersController.acceptSubstitutions → PharmacyOrdersService.acceptSubstitutions → PharmacyOrdersUseCases.acceptSubstitutions → PharmacyOrdersUseCases.readOwnOrder → PharmacyOrdersUseCases.composeOrders → CommunityPharmacyOrderChatAdapter.findPharmacyShowcases → CommunityOrderChatService.findOrganizationShowcases → PublicProfilesRepository.listByIds | `src/modules/community/repositories/public-profiles.repository.ts:135` |
| `directory.tenants` | LEE | LEE | DIRECTA | PharmacyOrdersController.acceptSubstitutions → PharmacyOrdersService.acceptSubstitutions → PharmacyOrdersUseCases.acceptSubstitutions → PharmacyOrdersUseCases.readOwnOrder → PharmacyOrdersUseCases.composeOrders → CommunityPharmacyOrderChatAdapter.findPharmacyShowcases → CommunityOrderChatService.findOrganizationShowcases → CommunityOrganizationStaffService.verifiedActiveTenantIds | `src/modules/community/services/community-organization-staff.service.ts:283` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.acceptSubstitutions → PharmacyOrdersService.acceptSubstitutions → PharmacyOrdersUseCases.acceptSubstitutions → PharmacyOrdersUseCases.publishStaffEvent → MessagingDomainEventAdapter.publish → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.acceptSubstitutions → PharmacyOrdersService.acceptSubstitutions → PharmacyOrdersUseCases.acceptSubstitutions → PharmacyOrdersUseCases.publishStaffEvent → MessagingDomainEventAdapter.publish → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | PharmacyOrdersController.acceptSubstitutions → PharmacyOrdersService.acceptSubstitutions → PharmacyOrdersUseCases.acceptSubstitutions → PharmacyOrdersUseCases.publishStaffEvent → MessagingDomainEventAdapter.publish → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |
| `pharmacy_inventory.inventory_ledger_entries` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.acceptSubstitutions → PharmacyOrdersService.acceptSubstitutions → PharmacyOrdersUseCases.acceptSubstitutions → PharmacyOrdersUseCases.reserveLineStock → LedgerRepository.append | `src/modules/pharmacy_inventory/infrastructure/repositories/ledger.repository.ts:142` |
| `pharmacy_inventory.inventory_ledger_entries` | LEE | LEE | POR_SQL | PharmacyOrdersController.acceptSubstitutions → PharmacyOrdersService.acceptSubstitutions → PharmacyOrdersUseCases.acceptSubstitutions → PharmacyOrdersUseCases.reserveLineStock → LedgerRepository.nextSequence | `src/modules/pharmacy_inventory/infrastructure/repositories/ledger.repository.ts:113` |
| `pharmacy_inventory.inventory_locations` | LEE | LEE | DIRECTA | PharmacyOrdersController.acceptSubstitutions → PharmacyOrdersService.acceptSubstitutions → PharmacyOrdersUseCases.acceptSubstitutions → InventoryReadRepository.findActiveLocationsBySites | `src/modules/pharmacy_inventory/infrastructure/repositories/inventory-read.repository.ts:21` |
| `pharmacy_inventory.inventory_reservation_lines` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyOrdersController.acceptSubstitutions → PharmacyOrdersService.acceptSubstitutions → PharmacyOrdersUseCases.acceptSubstitutions → InventoryReservationsService.releaseConfirmedLines → ReleaseConfirmedReservationLinesUseCase.execute | `src/modules/pharmacy_inventory/application/inventory-reservations/release-confirmed-reservation-lines.use-case.ts:44` |
| `pharmacy_inventory.inventory_reservation_lines` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.acceptSubstitutions → PharmacyOrdersService.acceptSubstitutions → PharmacyOrdersUseCases.acceptSubstitutions → PharmacyOrdersUseCases.reserveLineStock → ReservationsRepository.createLine | `src/modules/pharmacy_inventory/infrastructure/repositories/reservations.repository.ts:188` |
| `pharmacy_inventory.inventory_reservation_lines` | LEE | LEE | DIRECTA | PharmacyOrdersController.acceptSubstitutions → PharmacyOrdersService.acceptSubstitutions → PharmacyOrdersUseCases.acceptSubstitutions → PharmacyOrdersRepository.findLinesByReservationIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:220` |
| `pharmacy_inventory.inventory_reservations` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyOrdersController.acceptSubstitutions → PharmacyOrdersService.acceptSubstitutions → PharmacyOrdersUseCases.acceptSubstitutions | `src/modules/pharmacy_inventory/application/pharmacy-orders/pharmacy-orders.use-cases.ts:1114` |
| `pharmacy_inventory.inventory_reservations` | LEE | LEE | DIRECTA | PharmacyOrdersController.acceptSubstitutions → PharmacyOrdersService.acceptSubstitutions → PharmacyOrdersUseCases.acceptSubstitutions → PharmacyOrdersUseCases.loadOwnOrderForUpdate → PharmacyOrdersRepository.findOrderByIdForUpdate | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:61` |
| `pharmacy_inventory.inventory_stock_positions` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyOrdersController.acceptSubstitutions → PharmacyOrdersService.acceptSubstitutions → PharmacyOrdersUseCases.acceptSubstitutions → PharmacyOrdersUseCases.reserveLineStock | `src/modules/pharmacy_inventory/application/pharmacy-orders/pharmacy-orders.use-cases.ts:2311` |
| `pharmacy_inventory.inventory_stock_positions` | LEE | LEE | DIRECTA | PharmacyOrdersController.acceptSubstitutions → PharmacyOrdersService.acceptSubstitutions → PharmacyOrdersUseCases.acceptSubstitutions → InventoryReadRepository.findStockPositions | `src/modules/pharmacy_inventory/infrastructure/repositories/inventory-read.repository.ts:41` |
| `pharmacy_inventory.pharmacy_order_substitutions` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyOrdersController.acceptSubstitutions → PharmacyOrdersService.acceptSubstitutions → PharmacyOrdersUseCases.acceptSubstitutions | `src/modules/pharmacy_inventory/application/pharmacy-orders/pharmacy-orders.use-cases.ts:1109` |
| `pharmacy_inventory.pharmacy_order_substitutions` | LEE | LEE | DIRECTA | PharmacyOrdersController.acceptSubstitutions → PharmacyOrdersService.acceptSubstitutions → PharmacyOrdersUseCases.acceptSubstitutions → PharmacyOrdersUseCases.pendingProposalsOf → PharmacyOrderSubstitutionsRepository.findByReservationIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-order-substitutions.repository.ts:62` |
| `pharmacy.pharmacies` | LEE | LEE | DIRECTA | PharmacyOrdersController.acceptSubstitutions → PharmacyOrdersService.acceptSubstitutions → PharmacyOrdersUseCases.acceptSubstitutions → PharmacyOrdersUseCases.loadOwnOrderForUpdate → PharmacyOrdersRepository.findPharmaciesByIdsInTenant | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:235` |
| `pharmacy.pharmacy_products` | LEE | LEE | DIRECTA | PharmacyOrdersController.acceptSubstitutions → PharmacyOrdersService.acceptSubstitutions → PharmacyOrdersUseCases.acceptSubstitutions → PharmacyOrdersUseCases.readOwnOrder → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findProductsByIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:256` |
| `pharmacy.pharmacy_sites` | LEE | LEE | DIRECTA | PharmacyOrdersController.acceptSubstitutions → PharmacyOrdersService.acceptSubstitutions → PharmacyOrdersUseCases.acceptSubstitutions → PharmacyOrdersUseCases.readOwnOrder → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findSitesByIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:247` |
| `profiles.person_profiles` | LEE | LEE | DIRECTA | PharmacyOrdersController.acceptSubstitutions → PharmacyOrdersService.acceptSubstitutions → PharmacyOrdersUseCases.acceptSubstitutions → PharmacyOrdersUseCases.readOwnOrder → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findPersonNamesByProfileIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:143` |
| `profiles.persons` | LEE | LEE | DIRECTA | PharmacyOrdersController.acceptSubstitutions → PharmacyOrdersService.acceptSubstitutions → PharmacyOrdersUseCases.acceptSubstitutions → PharmacyOrdersUseCases.readOwnOrder → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findPersonNamesByProfileIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:135` |
| `profiles.practitioner_specialties` | LEE | LEE | DIRECTA | PharmacyOrdersController.acceptSubstitutions → PharmacyOrdersService.acceptSubstitutions → PharmacyOrdersUseCases.acceptSubstitutions → PharmacyOrdersUseCases.readOwnOrder → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findPrimarySpecialtyConceptIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:331` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | PharmacyOrdersController.acceptSubstitutions → PharmacyOrdersService.acceptSubstitutions → PharmacyOrdersUseCases.acceptSubstitutions → PharmacyOrdersUseCases.readOwnOrder → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findConceptsByIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:370` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | calculado: `null` | `src/modules/pharmacy_inventory/infrastructure/adapters/messaging-domain-event.adapter.ts:16` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PharmacyOrderDto>` · DTO `PharmacyOrderDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reservationLines` | `array<PharmacyOrderReservationLineDto>` | Sí | — | — | Porciones confirmadas o entregadas vigentes para facturación | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:253` |
| `reservationLines[].id` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:212` |
| `reservationLines[].productId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:215` |
| `reservationLines[].quantity` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:218` |
| `reservationLines[].unitPriceAmount` | `string` | Sí | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:221` |
| `reservationLines[].billedAmount` | `string` | Sí | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:224` |
| `reservationLines[].currencyConceptId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:227` |
| `insuranceSettlement` | `PatientInsuranceSettlementDto` | Sí | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:256` |
| `insuranceSettlement.claimId` | `string` | Sí | formato uuid | — | — | sin fuente |
| `insuranceSettlement.claimIdentifier` | `string` | Sí | — | — | — | sin fuente |
| `insuranceSettlement.adjudicationVersionId` | `string` | Sí | formato uuid | — | — | sin fuente |
| `insuranceSettlement.adjudicationVersion` | `number` | Sí | formato int32; mínimo 1 | — | — | sin fuente |
| `insuranceSettlement.eobId` | `string` | Sí | formato uuid | — | — | sin fuente |
| `insuranceSettlement.carrierName` | `string` | Sí | — | — | — | sin fuente |
| `insuranceSettlement.policyIdentifier` | `string` | Sí | admite null | — | — | sin fuente |
| `insuranceSettlement.totalBilledAmount` | `string` | Sí | — | — | Total facturado, decimal exacto | sin fuente |
| `insuranceSettlement.totalApprovedAmount` | `string` | Sí | — | — | Aporte del seguro, decimal exacto | sin fuente |
| `insuranceSettlement.totalPatientAmount` | `string` | Sí | — | — | Cargo confirmado al paciente, decimal exacto | sin fuente |
| `insuranceSettlement.totalDeniedAmount` | `string` | Sí | — | — | Importe excluido sin asignar, decimal exacto | sin fuente |
| `insuranceSettlement.currencyCode` | `string` | Sí | — | — | — | sin fuente |
| `insuranceSettlement.result` | `string` | Sí | valores: APPROVED, PARTIALLY_APPROVED, DENIED | — | — | sin fuente |
| `insuranceSettlement.exclusions` | `array<PatientInsuranceSettlementExclusionDto>` | Sí | — | — | — | sin fuente |
| `insuranceSettlement.exclusions[].claimLineId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/patient-settlement.dto.ts:9` |
| `insuranceSettlement.exclusions[].itemId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/patient-settlement.dto.ts:12` |
| `insuranceSettlement.exclusions[].itemName` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/patient-settlement.dto.ts:15` |
| `insuranceSettlement.exclusions[].amount` | `string` | Sí | — | — | Importe decimal exacto excluido | `src/modules/pharmacy_inventory/presentation/dto/patient-settlement.dto.ts:18` |
| `insuranceSettlement.exclusions[].policyClauseReference` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/patient-settlement.dto.ts:21` |
| `insuranceSettlement.exclusions[].denialRationale` | `string` | Sí | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/patient-settlement.dto.ts:24` |
| `insuranceSettlementAvailability` | `string` | Sí | valores: AVAILABLE, PENDING_PUBLICATION, UNDER_REVIEW, NOT_AVAILABLE | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:261` |
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:267` |
| `status` | `InventoryConceptDto` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:273` |
| `status.code` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:17` |
| `status.display` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:23` |
| `createdAt` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:279` |
| `expiresAt` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:286` |
| `siteId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:292` |
| `siteName` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:298` |
| `pharmacyId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:304` |
| `pharmacyName` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:310` |
| `medicationRequestId` | `string` | No | formato uuid; admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:316` |
| `prescriber` | `PharmacyOrderPrescriberDto` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:328` |
| `prescriber.name` | `string` | No | admite null | — | — | sin fuente |
| `prescriber.specialty` | `string` | No | admite null | — | — | sin fuente |
| `patientName` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:336` |
| `deliveryMode` | `InventoryConceptDto` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:343` |
| `deliveryMode.code` | `string` | No | — | — | — | sin fuente |
| `deliveryMode.display` | `string` | No | — | — | — | sin fuente |
| `deliveryAddressText` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:351` |
| `pickupCode` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:362` |
| `pharmacyPublicProfileId` | `string` | No | formato uuid; admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:373` |
| `pharmacyPublicSlug` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:380` |
| `totalAmount` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:391` |
| `currency` | `InventoryConceptDto` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:397` |
| `currency.code` | `string` | No | — | — | — | sin fuente |
| `currency.display` | `string` | No | — | — | — | sin fuente |
| `rejectionReasonText` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:404` |
| `substitutions` | `array<PharmacyOrderSubstitutionDto>` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:412` |
| `substitutions[].id` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:427` |
| `substitutions[].originalProductId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:433` |
| `substitutions[].originalName` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:439` |
| `substitutions[].originalUnitPriceAmount` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:445` |
| `substitutions[].proposedProductId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:451` |
| `substitutions[].proposedName` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:457` |
| `substitutions[].proposedUnitPriceAmount` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:463` |
| `substitutions[].currency` | `InventoryConceptDto` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:469` |
| `substitutions[].currency.code` | `string` | No | — | — | — | sin fuente |
| `substitutions[].currency.display` | `string` | No | — | — | — | sin fuente |
| `substitutions[].status` | `InventoryConceptDto` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:475` |
| `substitutions[].status.code` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:17` |
| `substitutions[].status.display` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:23` |
| `substitutions[].decidedAt` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:481` |
| `lines` | `array<PharmacyOrderLineDto>` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:418` |
| `lines[].productId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:123` |
| `lines[].medicationConceptId` | `string` | No | formato uuid; admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:129` |
| `lines[].productCode` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:135` |
| `lines[].brandName` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:141` |
| `lines[].genericName` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:147` |
| `lines[].strengthText` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:153` |
| `lines[].packageSizeText` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:159` |
| `lines[].medication` | `InventoryConceptDto` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:165` |
| `lines[].medication.code` | `string` | No | — | — | — | sin fuente |
| `lines[].medication.display` | `string` | No | — | — | — | sin fuente |
| `lines[].requestedQuantity` | `number` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:171` |
| `lines[].reservedQuantity` | `number` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:177` |
| `lines[].fulfilledQuantity` | `number` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:184` |
| `lines[].unitPriceAmount` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:193` |
| `lines[].currency` | `InventoryConceptDto` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:199` |
| `lines[].currency.code` | `string` | No | — | — | — | sin fuente |
| `lines[].currency.display` | `string` | No | — | — | — | sin fuente |
| `lines[].status` | `InventoryConceptDto` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:206` |
| `lines[].status.code` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:17` |
| `lines[].status.display` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:23` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta autenticada no tiene perfil de paciente; PreconditionFailedException: El pedido no tiene una decisión de sustituciones pendiente; PreconditionFailedException: El pedido no tiene propuestas de sustitución en pie |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharmacy_inventory.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / pharmacy inventory — etapa `ctrl:PharmacyOrdersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 20. POST /pharmacy/orders/{id}/cancel

- **Origen:** CONTRATO
- **Nombre:** Cancelar un pedido de farmacia (FAR-E1)
- **Bloque:** Farmacia
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyOrdersController.cancel` — `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-orders.controller.ts:178`

### Qué es y para qué sirve (negocio)

Cancelar un pedido de farmacia (FAR-E1). Dentro del módulo (descripción del modelo, en inglés): «Prevents overselling and untraceable adjustments under concurrent manual, API, dispensing and receiving operations.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_25_pharmacy_inventory.puml:20`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`POST /pharmacy/orders/{id}/cancel` la atiende `PharmacyOrdersController.cancel` (src/modules/pharmacy_inventory/presentation/controllers/pharmacy-orders.controller.ts:178). Exige sesión con alguno de los roles PATIENT. Delega en `PharmacyOrdersService.cancel`. Crea filas en messaging.domain_events, messaging.outbox_messages, pharmacy_inventory.inventory_ledger_entries. Actualiza pharmacy_inventory.inventory_reservation_lines, pharmacy_inventory.inventory_reservations, pharmacy_inventory.inventory_stock_positions. Lee clinical.medication_requests, common.addresses, community.public_profiles, directory.tenants, messaging.outbox_messages, pharmacy_inventory.inventory_ledger_entries, pharmacy_inventory.inventory_reservation_lines, pharmacy_inventory.inventory_reservations y 9 más. Publica un evento calculado (null).

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PATIENT | `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-orders.controller.ts:178` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-orders.controller.ts:178` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.medication_requests` | LEE | LEE | DIRECTA | PharmacyOrdersController.cancel → PharmacyOrdersService.cancel → PharmacyOrdersUseCases.cancel → PharmacyOrdersUseCases.readOwnOrder → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findPrescriberProfileIdsByRequestIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:307` |
| `common.addresses` | LEE | LEE | DIRECTA | PharmacyOrdersController.cancel → PharmacyOrdersService.cancel → PharmacyOrdersUseCases.cancel → PharmacyOrdersUseCases.readOwnOrder → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findAddressesByIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:361` |
| `community.public_profiles` | LEE | LEE | DIRECTA | PharmacyOrdersController.cancel → PharmacyOrdersService.cancel → PharmacyOrdersUseCases.cancel → PharmacyOrdersUseCases.readOwnOrder → PharmacyOrdersUseCases.composeOrders → CommunityPharmacyOrderChatAdapter.findPharmacyShowcases → CommunityOrderChatService.findOrganizationShowcases → PublicProfilesRepository.listByIds | `src/modules/community/repositories/public-profiles.repository.ts:135` |
| `directory.tenants` | LEE | LEE | DIRECTA | PharmacyOrdersController.cancel → PharmacyOrdersService.cancel → PharmacyOrdersUseCases.cancel → PharmacyOrdersUseCases.readOwnOrder → PharmacyOrdersUseCases.composeOrders → CommunityPharmacyOrderChatAdapter.findPharmacyShowcases → CommunityOrderChatService.findOrganizationShowcases → CommunityOrganizationStaffService.verifiedActiveTenantIds | `src/modules/community/services/community-organization-staff.service.ts:283` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.cancel → PharmacyOrdersService.cancel → PharmacyOrdersUseCases.cancel → MessagingDomainEventAdapter.publish → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.cancel → PharmacyOrdersService.cancel → PharmacyOrdersUseCases.cancel → MessagingDomainEventAdapter.publish → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | PharmacyOrdersController.cancel → PharmacyOrdersService.cancel → PharmacyOrdersUseCases.cancel → MessagingDomainEventAdapter.publish → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |
| `pharmacy_inventory.inventory_ledger_entries` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.cancel → PharmacyOrdersService.cancel → PharmacyOrdersUseCases.cancel → InventoryReservationsService.releaseConfirmedLines → ReleaseConfirmedReservationLinesUseCase.execute → LedgerRepository.append | `src/modules/pharmacy_inventory/infrastructure/repositories/ledger.repository.ts:142` |
| `pharmacy_inventory.inventory_ledger_entries` | LEE | LEE | POR_SQL | PharmacyOrdersController.cancel → PharmacyOrdersService.cancel → PharmacyOrdersUseCases.cancel → InventoryReservationsService.releaseConfirmedLines → ReleaseConfirmedReservationLinesUseCase.execute → LedgerRepository.nextSequence | `src/modules/pharmacy_inventory/infrastructure/repositories/ledger.repository.ts:113` |
| `pharmacy_inventory.inventory_reservation_lines` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyOrdersController.cancel → PharmacyOrdersService.cancel → PharmacyOrdersUseCases.cancel → InventoryReservationsService.releaseConfirmedLines → ReleaseConfirmedReservationLinesUseCase.execute | `src/modules/pharmacy_inventory/application/inventory-reservations/release-confirmed-reservation-lines.use-case.ts:44` |
| `pharmacy_inventory.inventory_reservation_lines` | LEE | LEE | DIRECTA | PharmacyOrdersController.cancel → PharmacyOrdersService.cancel → PharmacyOrdersUseCases.cancel → InventoryReservationsService.releaseConfirmedLines → ReleaseConfirmedReservationLinesUseCase.execute → ReservationsRepository.findLinesByReservation | `src/modules/pharmacy_inventory/infrastructure/repositories/reservations.repository.ts:142` |
| `pharmacy_inventory.inventory_reservations` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyOrdersController.cancel → PharmacyOrdersService.cancel → PharmacyOrdersUseCases.cancel | `src/modules/pharmacy_inventory/application/pharmacy-orders/pharmacy-orders.use-cases.ts:740` |
| `pharmacy_inventory.inventory_reservations` | LEE | LEE | DIRECTA | PharmacyOrdersController.cancel → PharmacyOrdersService.cancel → PharmacyOrdersUseCases.cancel → PharmacyOrdersRepository.findOrderByIdForUpdate | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:61` |
| `pharmacy_inventory.inventory_stock_positions` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyOrdersController.cancel → PharmacyOrdersService.cancel → PharmacyOrdersUseCases.cancel → InventoryReservationsService.releaseConfirmedLines → ReleaseConfirmedReservationLinesUseCase.execute | `src/modules/pharmacy_inventory/application/inventory-reservations/release-confirmed-reservation-lines.use-case.ts:72` |
| `pharmacy_inventory.inventory_stock_positions` | LEE | LEE | DIRECTA | PharmacyOrdersController.cancel → PharmacyOrdersService.cancel → PharmacyOrdersUseCases.cancel → InventoryReservationsService.releaseConfirmedLines → ReleaseConfirmedReservationLinesUseCase.execute → StockPositionsRepository.findByKeyForUpdate | `src/modules/pharmacy_inventory/infrastructure/repositories/stock-positions.repository.ts:82` |
| `pharmacy_inventory.pharmacy_order_substitutions` | LEE | LEE | DIRECTA | PharmacyOrdersController.cancel → PharmacyOrdersService.cancel → PharmacyOrdersUseCases.cancel → PharmacyOrdersUseCases.readOwnOrder → PharmacyOrdersUseCases.composeOrders → PharmacyOrderSubstitutionsRepository.findByReservationIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-order-substitutions.repository.ts:62` |
| `pharmacy.pharmacies` | LEE | LEE | DIRECTA | PharmacyOrdersController.cancel → PharmacyOrdersService.cancel → PharmacyOrdersUseCases.cancel → PharmacyOrdersRepository.findPharmaciesByIdsInTenant | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:235` |
| `pharmacy.pharmacy_products` | LEE | LEE | DIRECTA | PharmacyOrdersController.cancel → PharmacyOrdersService.cancel → PharmacyOrdersUseCases.cancel → PharmacyOrdersUseCases.readOwnOrder → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findProductsByIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:256` |
| `pharmacy.pharmacy_sites` | LEE | LEE | DIRECTA | PharmacyOrdersController.cancel → PharmacyOrdersService.cancel → PharmacyOrdersUseCases.cancel → PharmacyOrdersUseCases.readOwnOrder → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findSitesByIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:247` |
| `profiles.person_profiles` | LEE | LEE | DIRECTA | PharmacyOrdersController.cancel → PharmacyOrdersService.cancel → PharmacyOrdersUseCases.cancel → PharmacyOrdersUseCases.readOwnOrder → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findPersonNamesByProfileIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:143` |
| `profiles.persons` | LEE | LEE | DIRECTA | PharmacyOrdersController.cancel → PharmacyOrdersService.cancel → PharmacyOrdersUseCases.cancel → PharmacyOrdersUseCases.readOwnOrder → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findPersonNamesByProfileIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:135` |
| `profiles.practitioner_specialties` | LEE | LEE | DIRECTA | PharmacyOrdersController.cancel → PharmacyOrdersService.cancel → PharmacyOrdersUseCases.cancel → PharmacyOrdersUseCases.readOwnOrder → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findPrimarySpecialtyConceptIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:331` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | PharmacyOrdersController.cancel → PharmacyOrdersService.cancel → PharmacyOrdersUseCases.cancel → PharmacyOrdersUseCases.readOwnOrder → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findConceptsByIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:370` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | calculado: `null` | `src/modules/pharmacy_inventory/infrastructure/adapters/messaging-domain-event.adapter.ts:16` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PharmacyOrderDto>` · DTO `PharmacyOrderDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reservationLines` | `array<PharmacyOrderReservationLineDto>` | Sí | — | — | Porciones confirmadas o entregadas vigentes para facturación | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:253` |
| `reservationLines[].id` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:212` |
| `reservationLines[].productId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:215` |
| `reservationLines[].quantity` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:218` |
| `reservationLines[].unitPriceAmount` | `string` | Sí | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:221` |
| `reservationLines[].billedAmount` | `string` | Sí | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:224` |
| `reservationLines[].currencyConceptId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:227` |
| `insuranceSettlement` | `PatientInsuranceSettlementDto` | Sí | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:256` |
| `insuranceSettlement.claimId` | `string` | Sí | formato uuid | — | — | sin fuente |
| `insuranceSettlement.claimIdentifier` | `string` | Sí | — | — | — | sin fuente |
| `insuranceSettlement.adjudicationVersionId` | `string` | Sí | formato uuid | — | — | sin fuente |
| `insuranceSettlement.adjudicationVersion` | `number` | Sí | formato int32; mínimo 1 | — | — | sin fuente |
| `insuranceSettlement.eobId` | `string` | Sí | formato uuid | — | — | sin fuente |
| `insuranceSettlement.carrierName` | `string` | Sí | — | — | — | sin fuente |
| `insuranceSettlement.policyIdentifier` | `string` | Sí | admite null | — | — | sin fuente |
| `insuranceSettlement.totalBilledAmount` | `string` | Sí | — | — | Total facturado, decimal exacto | sin fuente |
| `insuranceSettlement.totalApprovedAmount` | `string` | Sí | — | — | Aporte del seguro, decimal exacto | sin fuente |
| `insuranceSettlement.totalPatientAmount` | `string` | Sí | — | — | Cargo confirmado al paciente, decimal exacto | sin fuente |
| `insuranceSettlement.totalDeniedAmount` | `string` | Sí | — | — | Importe excluido sin asignar, decimal exacto | sin fuente |
| `insuranceSettlement.currencyCode` | `string` | Sí | — | — | — | sin fuente |
| `insuranceSettlement.result` | `string` | Sí | valores: APPROVED, PARTIALLY_APPROVED, DENIED | — | — | sin fuente |
| `insuranceSettlement.exclusions` | `array<PatientInsuranceSettlementExclusionDto>` | Sí | — | — | — | sin fuente |
| `insuranceSettlement.exclusions[].claimLineId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/patient-settlement.dto.ts:9` |
| `insuranceSettlement.exclusions[].itemId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/patient-settlement.dto.ts:12` |
| `insuranceSettlement.exclusions[].itemName` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/patient-settlement.dto.ts:15` |
| `insuranceSettlement.exclusions[].amount` | `string` | Sí | — | — | Importe decimal exacto excluido | `src/modules/pharmacy_inventory/presentation/dto/patient-settlement.dto.ts:18` |
| `insuranceSettlement.exclusions[].policyClauseReference` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/patient-settlement.dto.ts:21` |
| `insuranceSettlement.exclusions[].denialRationale` | `string` | Sí | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/patient-settlement.dto.ts:24` |
| `insuranceSettlementAvailability` | `string` | Sí | valores: AVAILABLE, PENDING_PUBLICATION, UNDER_REVIEW, NOT_AVAILABLE | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:261` |
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:267` |
| `status` | `InventoryConceptDto` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:273` |
| `status.code` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:17` |
| `status.display` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:23` |
| `createdAt` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:279` |
| `expiresAt` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:286` |
| `siteId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:292` |
| `siteName` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:298` |
| `pharmacyId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:304` |
| `pharmacyName` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:310` |
| `medicationRequestId` | `string` | No | formato uuid; admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:316` |
| `prescriber` | `PharmacyOrderPrescriberDto` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:328` |
| `prescriber.name` | `string` | No | admite null | — | — | sin fuente |
| `prescriber.specialty` | `string` | No | admite null | — | — | sin fuente |
| `patientName` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:336` |
| `deliveryMode` | `InventoryConceptDto` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:343` |
| `deliveryMode.code` | `string` | No | — | — | — | sin fuente |
| `deliveryMode.display` | `string` | No | — | — | — | sin fuente |
| `deliveryAddressText` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:351` |
| `pickupCode` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:362` |
| `pharmacyPublicProfileId` | `string` | No | formato uuid; admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:373` |
| `pharmacyPublicSlug` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:380` |
| `totalAmount` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:391` |
| `currency` | `InventoryConceptDto` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:397` |
| `currency.code` | `string` | No | — | — | — | sin fuente |
| `currency.display` | `string` | No | — | — | — | sin fuente |
| `rejectionReasonText` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:404` |
| `substitutions` | `array<PharmacyOrderSubstitutionDto>` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:412` |
| `substitutions[].id` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:427` |
| `substitutions[].originalProductId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:433` |
| `substitutions[].originalName` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:439` |
| `substitutions[].originalUnitPriceAmount` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:445` |
| `substitutions[].proposedProductId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:451` |
| `substitutions[].proposedName` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:457` |
| `substitutions[].proposedUnitPriceAmount` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:463` |
| `substitutions[].currency` | `InventoryConceptDto` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:469` |
| `substitutions[].currency.code` | `string` | No | — | — | — | sin fuente |
| `substitutions[].currency.display` | `string` | No | — | — | — | sin fuente |
| `substitutions[].status` | `InventoryConceptDto` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:475` |
| `substitutions[].status.code` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:17` |
| `substitutions[].status.display` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:23` |
| `substitutions[].decidedAt` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:481` |
| `lines` | `array<PharmacyOrderLineDto>` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:418` |
| `lines[].productId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:123` |
| `lines[].medicationConceptId` | `string` | No | formato uuid; admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:129` |
| `lines[].productCode` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:135` |
| `lines[].brandName` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:141` |
| `lines[].genericName` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:147` |
| `lines[].strengthText` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:153` |
| `lines[].packageSizeText` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:159` |
| `lines[].medication` | `InventoryConceptDto` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:165` |
| `lines[].medication.code` | `string` | No | — | — | — | sin fuente |
| `lines[].medication.display` | `string` | No | — | — | — | sin fuente |
| `lines[].requestedQuantity` | `number` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:171` |
| `lines[].reservedQuantity` | `number` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:177` |
| `lines[].fulfilledQuantity` | `number` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:184` |
| `lines[].unitPriceAmount` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:193` |
| `lines[].currency` | `InventoryConceptDto` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:199` |
| `lines[].currency.code` | `string` | No | — | — | — | sin fuente |
| `lines[].currency.display` | `string` | No | — | — | — | sin fuente |
| `lines[].status` | `InventoryConceptDto` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:206` |
| `lines[].status.code` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:17` |
| `lines[].status.display` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:23` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: El pedido ya está en un estado terminal y no puede cancelarse |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta autenticada no tiene perfil de paciente |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharmacy_inventory.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / pharmacy inventory — etapa `ctrl:PharmacyOrdersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 21. POST /pharmacy/orders/{id}/confirm

- **Origen:** CONTRATO
- **Nombre:** Confirmar el pedido (FAR-E2)
- **Bloque:** Farmacia
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyOrdersController.confirm` — `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-orders.controller.ts:224`

### Qué es y para qué sirve (negocio)

Confirmar el pedido (FAR-E2). Dentro del módulo (descripción del modelo, en inglés): «Prevents overselling and untraceable adjustments under concurrent manual, API, dispensing and receiving operations.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_25_pharmacy_inventory.puml:20`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`POST /pharmacy/orders/{id}/confirm` la atiende `PharmacyOrdersController.confirm` (src/modules/pharmacy_inventory/presentation/controllers/pharmacy-orders.controller.ts:224). Exige sesión con alguno de los roles SECURITY_ADMIN, PHARMACY_STAFF. Valida el cuerpo como `ConfirmPharmacyOrderDto` (4 campos, 0 obligatorios). Delega en `PharmacyOrdersService.confirm`. Crea filas en messaging.domain_events, messaging.in_app_notifications, messaging.notification_deliveries, messaging.notification_requests, messaging.outbox_messages, pharmacy_inventory.inventory_ledger_entries, pharmacy_inventory.pharmacy_order_substitutions. Actualiza iam.devices, pharmacy_inventory.inventory_reservation_lines, pharmacy_inventory.inventory_reservations, pharmacy_inventory.inventory_stock_positions. Lee clinical.medication_requests, common.addresses, community.public_profiles, directory.tenants, iam.devices, messaging.in_app_notifications, messaging.message_channels, messaging.messaging_providers y 18 más. Publica un evento calculado (null).

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PHARMACY_STAFF | `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-orders.controller.ts:224` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-orders.controller.ts:224` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.medication_requests` | LEE | LEE | DIRECTA | PharmacyOrdersController.confirm → PharmacyOrdersService.confirm → PharmacyOrdersUseCases.confirm → PharmacyOrdersUseCases.readOrderForTenant → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findPrescriberProfileIdsByRequestIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:307` |
| `common.addresses` | LEE | LEE | DIRECTA | PharmacyOrdersController.confirm → PharmacyOrdersService.confirm → PharmacyOrdersUseCases.confirm → PharmacyOrdersUseCases.readOrderForTenant → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findAddressesByIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:361` |
| `community.public_profiles` | LEE | LEE | DIRECTA | PharmacyOrdersController.confirm → PharmacyOrdersService.confirm → PharmacyOrdersUseCases.confirm → PharmacyOrdersUseCases.readOrderForTenant → PharmacyOrdersUseCases.composeOrders → CommunityPharmacyOrderChatAdapter.findPharmacyShowcases → CommunityOrderChatService.findOrganizationShowcases → PublicProfilesRepository.listByIds | `src/modules/community/repositories/public-profiles.repository.ts:135` |
| `directory.tenants` | LEE | LEE | DIRECTA | PharmacyOrdersController.confirm → PharmacyOrdersService.confirm → PharmacyOrdersUseCases.confirm → PharmacyOrdersUseCases.readOrderForTenant → PharmacyOrdersUseCases.composeOrders → CommunityPharmacyOrderChatAdapter.findPharmacyShowcases → CommunityOrderChatService.findOrganizationShowcases → CommunityOrganizationStaffService.verifiedActiveTenantIds | `src/modules/community/services/community-organization-staff.service.ts:283` |
| `iam.devices` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyOrdersController.confirm → PharmacyOrdersService.confirm → PharmacyOrdersUseCases.confirm → PharmacyOrderNotificationsService.substitutionsProposed → NotifyPharmacyOrderUseCase.substitutionsProposed → NotifyPharmacyOrderUseCase.emitToPatient → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → WebPushService.pushToUser → WebPushService.sendTo → WebPushService.forget | `src/modules/messaging/services/web-push.service.ts:235` |
| `iam.devices` | LEE | LEE | DIRECTA | PharmacyOrdersController.confirm → PharmacyOrdersService.confirm → PharmacyOrdersUseCases.confirm → PharmacyOrderNotificationsService.substitutionsProposed → NotifyPharmacyOrderUseCase.substitutionsProposed → NotifyPharmacyOrderUseCase.emitToPatient → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → WebPushService.pushToUser | `src/modules/messaging/services/web-push.service.ts:172` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.confirm → PharmacyOrdersService.confirm → PharmacyOrdersUseCases.confirm → PharmacyOrdersUseCases.publishStaffEvent → MessagingDomainEventAdapter.publish → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.in_app_notifications` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.confirm → PharmacyOrdersService.confirm → PharmacyOrdersUseCases.confirm → PharmacyOrderNotificationsService.substitutionsProposed → NotifyPharmacyOrderUseCase.substitutionsProposed → NotifyPharmacyOrderUseCase.emitToPatient → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createInAppNotification | `src/modules/messaging/repositories/notifications.repository.ts:710` |
| `messaging.in_app_notifications` | LEE | LEE | DIRECTA | PharmacyOrdersController.confirm → PharmacyOrdersService.confirm → PharmacyOrdersUseCases.confirm → PharmacyOrderNotificationsService.substitutionsProposed → NotifyPharmacyOrderUseCase.substitutionsProposed → NotifyPharmacyOrderUseCase.emitToPatient → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findUnreadInAppForResource | `src/modules/messaging/repositories/notifications.repository.ts:845` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | PharmacyOrdersController.confirm → PharmacyOrdersService.confirm → PharmacyOrdersUseCases.confirm → PharmacyOrderNotificationsService.substitutionsProposed → NotifyPharmacyOrderUseCase.substitutionsProposed → NotifyPharmacyOrderUseCase.emitToPatient → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findActiveChannelByType | `src/modules/messaging/repositories/notifications.repository.ts:189` |
| `messaging.messaging_providers` | LEE | LEE | DIRECTA | PharmacyOrdersController.confirm → PharmacyOrdersService.confirm → PharmacyOrdersUseCases.confirm → PharmacyOrderNotificationsService.substitutionsProposed → NotifyPharmacyOrderUseCase.substitutionsProposed → NotifyPharmacyOrderUseCase.emitToPatient → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findProviderById | `src/modules/messaging/repositories/notifications.repository.ts:437` |
| `messaging.notification_deliveries` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.confirm → PharmacyOrdersService.confirm → PharmacyOrdersUseCases.confirm → PharmacyOrderNotificationsService.substitutionsProposed → NotifyPharmacyOrderUseCase.substitutionsProposed → NotifyPharmacyOrderUseCase.emitToPatient → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createDelivery | `src/modules/messaging/repositories/notifications.repository.ts:514` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.confirm → PharmacyOrdersService.confirm → PharmacyOrdersUseCases.confirm → PharmacyOrderNotificationsService.substitutionsProposed → NotifyPharmacyOrderUseCase.substitutionsProposed → NotifyPharmacyOrderUseCase.emitToPatient → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.confirm → PharmacyOrdersService.confirm → PharmacyOrdersUseCases.confirm → PharmacyOrdersUseCases.publishStaffEvent → MessagingDomainEventAdapter.publish → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | PharmacyOrdersController.confirm → PharmacyOrdersService.confirm → PharmacyOrdersUseCases.confirm → PharmacyOrdersUseCases.publishStaffEvent → MessagingDomainEventAdapter.publish → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |
| `messaging.provider_channel_configs` | LEE | LEE | DIRECTA | PharmacyOrdersController.confirm → PharmacyOrdersService.confirm → PharmacyOrdersUseCases.confirm → PharmacyOrderNotificationsService.substitutionsProposed → NotifyPharmacyOrderUseCase.substitutionsProposed → NotifyPharmacyOrderUseCase.emitToPatient → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findChannelConfigs | `src/modules/messaging/repositories/notifications.repository.ts:405` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | PharmacyOrdersController.confirm → PharmacyOrdersService.confirm → PharmacyOrdersUseCases.confirm → PharmacyOrderNotificationsService.substitutionsProposed → NotifyPharmacyOrderUseCase.substitutionsProposed → NotifyPharmacyOrderUseCase.emitToPatient → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `pharmacy_inventory.inventory_ledger_entries` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.confirm → PharmacyOrdersService.confirm → PharmacyOrdersUseCases.confirm → InventoryReservationsService.releaseConfirmedLines → ReleaseConfirmedReservationLinesUseCase.execute → LedgerRepository.append | `src/modules/pharmacy_inventory/infrastructure/repositories/ledger.repository.ts:142` |
| `pharmacy_inventory.inventory_ledger_entries` | LEE | LEE | POR_SQL | PharmacyOrdersController.confirm → PharmacyOrdersService.confirm → PharmacyOrdersUseCases.confirm → InventoryReservationsService.releaseConfirmedLines → ReleaseConfirmedReservationLinesUseCase.execute → LedgerRepository.nextSequence | `src/modules/pharmacy_inventory/infrastructure/repositories/ledger.repository.ts:113` |
| `pharmacy_inventory.inventory_reservation_lines` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyOrdersController.confirm → PharmacyOrdersService.confirm → PharmacyOrdersUseCases.confirm → InventoryReservationsService.releaseConfirmedLines → ReleaseConfirmedReservationLinesUseCase.execute | `src/modules/pharmacy_inventory/application/inventory-reservations/release-confirmed-reservation-lines.use-case.ts:44` |
| `pharmacy_inventory.inventory_reservation_lines` | LEE | LEE | DIRECTA | PharmacyOrdersController.confirm → PharmacyOrdersService.confirm → PharmacyOrdersUseCases.confirm → PharmacyOrdersRepository.findLinesByReservationIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:220` |
| `pharmacy_inventory.inventory_reservations` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyOrdersController.confirm → PharmacyOrdersService.confirm → PharmacyOrdersUseCases.confirm | `src/modules/pharmacy_inventory/application/pharmacy-orders/pharmacy-orders.use-cases.ts:972` |
| `pharmacy_inventory.inventory_reservations` | LEE | LEE | DIRECTA | PharmacyOrdersController.confirm → PharmacyOrdersService.confirm → PharmacyOrdersUseCases.confirm → PharmacyOrdersUseCases.loadTenantOrderForUpdate → PharmacyOrdersRepository.findOrderByIdForUpdate | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:61` |
| `pharmacy_inventory.inventory_stock_positions` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyOrdersController.confirm → PharmacyOrdersService.confirm → PharmacyOrdersUseCases.confirm → InventoryReservationsService.releaseConfirmedLines → ReleaseConfirmedReservationLinesUseCase.execute | `src/modules/pharmacy_inventory/application/inventory-reservations/release-confirmed-reservation-lines.use-case.ts:72` |
| `pharmacy_inventory.inventory_stock_positions` | LEE | LEE | DIRECTA | PharmacyOrdersController.confirm → PharmacyOrdersService.confirm → PharmacyOrdersUseCases.confirm → InventoryReservationsService.releaseConfirmedLines → ReleaseConfirmedReservationLinesUseCase.execute → StockPositionsRepository.findByKeyForUpdate | `src/modules/pharmacy_inventory/infrastructure/repositories/stock-positions.repository.ts:82` |
| `pharmacy_inventory.pharmacy_order_substitutions` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.confirm → PharmacyOrdersService.confirm → PharmacyOrdersUseCases.confirm → PharmacyOrdersUseCases.persistProposals → PharmacyOrderSubstitutionsRepository.create | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-order-substitutions.repository.ts:74` |
| `pharmacy_inventory.pharmacy_order_substitutions` | LEE | LEE | DIRECTA | PharmacyOrdersController.confirm → PharmacyOrdersService.confirm → PharmacyOrdersUseCases.confirm → PharmacyOrdersUseCases.readOrderForTenant → PharmacyOrdersUseCases.composeOrders → PharmacyOrderSubstitutionsRepository.findByReservationIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-order-substitutions.repository.ts:62` |
| `pharmacy.pharmacies` | LEE | LEE | DIRECTA | PharmacyOrdersController.confirm → PharmacyOrdersService.confirm → PharmacyOrdersUseCases.confirm → PharmacyOrdersUseCases.loadTenantOrderForUpdate → PharmacyOrdersRepository.findPharmaciesByIdsInTenant | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:235` |
| `pharmacy.pharmacy_price_lists` | LEE | LEE | DIRECTA | PharmacyOrdersController.confirm → PharmacyOrdersService.confirm → PharmacyOrdersUseCases.confirm → PharmacyOrdersUseCases.persistProposals → PharmacyOrdersUseCases.freezePricesFor → PharmacyDirectoryAdapter.findCurrentPublicPriceLists → PharmacyReadRepository.findCurrentPublicPriceLists | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:226` |
| `pharmacy.pharmacy_product_prices` | LEE | LEE | DIRECTA | PharmacyOrdersController.confirm → PharmacyOrdersService.confirm → PharmacyOrdersUseCases.confirm → PharmacyOrdersUseCases.persistProposals → PharmacyOrdersUseCases.freezePricesFor → PharmacyDirectoryAdapter.findCurrentPrices → PharmacyReadRepository.findCurrentPrices | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:253` |
| `pharmacy.pharmacy_products` | LEE | LEE | DIRECTA | PharmacyOrdersController.confirm → PharmacyOrdersService.confirm → PharmacyOrdersUseCases.confirm → PharmacyOrdersUseCases.persistProposals → PharmacyOrdersRepository.findProductsByIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:256` |
| `pharmacy.pharmacy_sites` | LEE | LEE | DIRECTA | PharmacyOrdersController.confirm → PharmacyOrdersService.confirm → PharmacyOrdersUseCases.confirm → PharmacyOrdersUseCases.readOrderForTenant → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findSitesByIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:247` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | PharmacyOrdersController.confirm → PharmacyOrdersService.confirm → PharmacyOrdersUseCases.confirm → PharmacyOrderNotificationsService.substitutionsProposed → NotifyPharmacyOrderUseCase.substitutionsProposed → NotifyPharmacyOrderUseCase.emitToPatient → NotifyPharmacyOrderUseCase.emitToPerson → ProfilesPersonAccountLinksAdapter.findActiveByPerson → PersonAccountLinksRepository.findActiveByPerson | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:101` |
| `profiles.person_profiles` | LEE | LEE | DIRECTA | PharmacyOrdersController.confirm → PharmacyOrdersService.confirm → PharmacyOrdersUseCases.confirm → PharmacyOrdersUseCases.readOrderForTenant → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findPersonNamesByProfileIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:143` |
| `profiles.persons` | LEE | LEE | DIRECTA | PharmacyOrdersController.confirm → PharmacyOrdersService.confirm → PharmacyOrdersUseCases.confirm → PharmacyOrdersUseCases.readOrderForTenant → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findPersonNamesByProfileIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:135` |
| `profiles.practitioner_specialties` | LEE | LEE | DIRECTA | PharmacyOrdersController.confirm → PharmacyOrdersService.confirm → PharmacyOrdersUseCases.confirm → PharmacyOrdersUseCases.readOrderForTenant → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findPrimarySpecialtyConceptIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:331` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | PharmacyOrdersController.confirm → PharmacyOrdersService.confirm → PharmacyOrdersUseCases.confirm → PharmacyOrdersUseCases.readOrderForTenant → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findConceptsByIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:370` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | calculado: `null` | `src/modules/pharmacy_inventory/infrastructure/adapters/messaging-domain-event.adapter.ts:16` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `ConfirmPharmacyOrderDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `adjustments` | `array<ConfirmOrderAdjustmentDto>` | No | — | `@IsOptional()` `@IsArray()` `@ValidateNested({ each: true })` `@Type(() => ConfirmOrderAdjustmentDto)` | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:536` |
| `adjustments[].productId` | `string` | No | formato uuid | `@IsUUID()` | Producto de la línea ajustada | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:503` |
| `adjustments[].decision` | `string` | No | valores: NO_DISPONIBLE, PROPONER_GENERICO | `@IsIn([...CONFIRM_LINE_DECISIONS])` | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:510` |
| `adjustments[].proposedProductId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Producto propuesto (mismo concepto del vademécum) | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:523` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<PharmacyOrderDto>` · DTO `PharmacyOrderDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reservationLines` | `array<PharmacyOrderReservationLineDto>` | Sí | — | — | Porciones confirmadas o entregadas vigentes para facturación | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:253` |
| `reservationLines[].id` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:212` |
| `reservationLines[].productId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:215` |
| `reservationLines[].quantity` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:218` |
| `reservationLines[].unitPriceAmount` | `string` | Sí | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:221` |
| `reservationLines[].billedAmount` | `string` | Sí | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:224` |
| `reservationLines[].currencyConceptId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:227` |
| `insuranceSettlement` | `PatientInsuranceSettlementDto` | Sí | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:256` |
| `insuranceSettlement.claimId` | `string` | Sí | formato uuid | — | — | sin fuente |
| `insuranceSettlement.claimIdentifier` | `string` | Sí | — | — | — | sin fuente |
| `insuranceSettlement.adjudicationVersionId` | `string` | Sí | formato uuid | — | — | sin fuente |
| `insuranceSettlement.adjudicationVersion` | `number` | Sí | formato int32; mínimo 1 | — | — | sin fuente |
| `insuranceSettlement.eobId` | `string` | Sí | formato uuid | — | — | sin fuente |
| `insuranceSettlement.carrierName` | `string` | Sí | — | — | — | sin fuente |
| `insuranceSettlement.policyIdentifier` | `string` | Sí | admite null | — | — | sin fuente |
| `insuranceSettlement.totalBilledAmount` | `string` | Sí | — | — | Total facturado, decimal exacto | sin fuente |
| `insuranceSettlement.totalApprovedAmount` | `string` | Sí | — | — | Aporte del seguro, decimal exacto | sin fuente |
| `insuranceSettlement.totalPatientAmount` | `string` | Sí | — | — | Cargo confirmado al paciente, decimal exacto | sin fuente |
| `insuranceSettlement.totalDeniedAmount` | `string` | Sí | — | — | Importe excluido sin asignar, decimal exacto | sin fuente |
| `insuranceSettlement.currencyCode` | `string` | Sí | — | — | — | sin fuente |
| `insuranceSettlement.result` | `string` | Sí | valores: APPROVED, PARTIALLY_APPROVED, DENIED | — | — | sin fuente |
| `insuranceSettlement.exclusions` | `array<PatientInsuranceSettlementExclusionDto>` | Sí | — | — | — | sin fuente |
| `insuranceSettlement.exclusions[].claimLineId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/patient-settlement.dto.ts:9` |
| `insuranceSettlement.exclusions[].itemId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/patient-settlement.dto.ts:12` |
| `insuranceSettlement.exclusions[].itemName` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/patient-settlement.dto.ts:15` |
| `insuranceSettlement.exclusions[].amount` | `string` | Sí | — | — | Importe decimal exacto excluido | `src/modules/pharmacy_inventory/presentation/dto/patient-settlement.dto.ts:18` |
| `insuranceSettlement.exclusions[].policyClauseReference` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/patient-settlement.dto.ts:21` |
| `insuranceSettlement.exclusions[].denialRationale` | `string` | Sí | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/patient-settlement.dto.ts:24` |
| `insuranceSettlementAvailability` | `string` | Sí | valores: AVAILABLE, PENDING_PUBLICATION, UNDER_REVIEW, NOT_AVAILABLE | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:261` |
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:267` |
| `status` | `InventoryConceptDto` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:273` |
| `status.code` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:17` |
| `status.display` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:23` |
| `createdAt` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:279` |
| `expiresAt` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:286` |
| `siteId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:292` |
| `siteName` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:298` |
| `pharmacyId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:304` |
| `pharmacyName` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:310` |
| `medicationRequestId` | `string` | No | formato uuid; admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:316` |
| `prescriber` | `PharmacyOrderPrescriberDto` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:328` |
| `prescriber.name` | `string` | No | admite null | — | — | sin fuente |
| `prescriber.specialty` | `string` | No | admite null | — | — | sin fuente |
| `patientName` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:336` |
| `deliveryMode` | `InventoryConceptDto` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:343` |
| `deliveryMode.code` | `string` | No | — | — | — | sin fuente |
| `deliveryMode.display` | `string` | No | — | — | — | sin fuente |
| `deliveryAddressText` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:351` |
| `pickupCode` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:362` |
| `pharmacyPublicProfileId` | `string` | No | formato uuid; admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:373` |
| `pharmacyPublicSlug` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:380` |
| `totalAmount` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:391` |
| `currency` | `InventoryConceptDto` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:397` |
| `currency.code` | `string` | No | — | — | — | sin fuente |
| `currency.display` | `string` | No | — | — | — | sin fuente |
| `rejectionReasonText` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:404` |
| `substitutions` | `array<PharmacyOrderSubstitutionDto>` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:412` |
| `substitutions[].id` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:427` |
| `substitutions[].originalProductId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:433` |
| `substitutions[].originalName` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:439` |
| `substitutions[].originalUnitPriceAmount` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:445` |
| `substitutions[].proposedProductId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:451` |
| `substitutions[].proposedName` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:457` |
| `substitutions[].proposedUnitPriceAmount` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:463` |
| `substitutions[].currency` | `InventoryConceptDto` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:469` |
| `substitutions[].currency.code` | `string` | No | — | — | — | sin fuente |
| `substitutions[].currency.display` | `string` | No | — | — | — | sin fuente |
| `substitutions[].status` | `InventoryConceptDto` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:475` |
| `substitutions[].status.code` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:17` |
| `substitutions[].status.display` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:23` |
| `substitutions[].decidedAt` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:481` |
| `lines` | `array<PharmacyOrderLineDto>` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:418` |
| `lines[].productId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:123` |
| `lines[].medicationConceptId` | `string` | No | formato uuid; admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:129` |
| `lines[].productCode` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:135` |
| `lines[].brandName` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:141` |
| `lines[].genericName` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:147` |
| `lines[].strengthText` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:153` |
| `lines[].packageSizeText` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:159` |
| `lines[].medication` | `InventoryConceptDto` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:165` |
| `lines[].medication.code` | `string` | No | — | — | — | sin fuente |
| `lines[].medication.display` | `string` | No | — | — | — | sin fuente |
| `lines[].requestedQuantity` | `number` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:171` |
| `lines[].reservedQuantity` | `number` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:177` |
| `lines[].fulfilledQuantity` | `number` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:184` |
| `lines[].unitPriceAmount` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:193` |
| `lines[].currency` | `InventoryConceptDto` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:199` |
| `lines[].currency.code` | `string` | No | — | — | — | sin fuente |
| `lines[].currency.display` | `string` | No | — | — | — | sin fuente |
| `lines[].status` | `InventoryConceptDto` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:206` |
| `lines[].status.code` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:17` |
| `lines[].status.display` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:23` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Hay más de un ajuste para el mismo renglón; PreconditionFailedException: La transición no es legal para el estado actual del pedido; PreconditionFailedException: El ajuste refiere un producto que no está en el pedido; PreconditionFailedException: PROPONER_GENERICO exige el producto propuesto (proposedProductId); PreconditionFailedException: El producto propuesto no está disponible en esta farmacia; PreconditionFailedException: El producto propuesto no es del mismo medicamento que el original |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharmacy_inventory.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / pharmacy inventory — etapa `ctrl:PharmacyOrdersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 22. POST /pharmacy/orders/{id}/conversation

- **Origen:** CONTRATO
- **Nombre:** Abrir el chat del pedido con la farmacia
- **Bloque:** Farmacia
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyOrdersController.openConversation` — `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-orders.controller.ts:156`

### Qué es y para qué sirve (negocio)

Abrir el chat del pedido con la farmacia. Dentro del módulo (descripción del modelo, en inglés): «Prevents overselling and untraceable adjustments under concurrent manual, API, dispensing and receiving operations.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_25_pharmacy_inventory.puml:20`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`POST /pharmacy/orders/{id}/conversation` la atiende `PharmacyOrdersController.openConversation` (src/modules/pharmacy_inventory/presentation/controllers/pharmacy-orders.controller.ts:156). Exige sesión; el controlador no declara roles. Delega en `PharmacyOrdersService.openConversation`. Crea filas en community.conversation_participants, community.conversations. Lee community.conversation_participants, community.conversations, community.public_profiles, community.user_blocks, directory.tenant_memberships, directory.tenants, pharmacy_inventory.inventory_reservations, pharmacy.pharmacies y 1 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-orders.controller.ts:156` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-orders.controller.ts:156` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.conversation_participants` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.openConversation → PharmacyOrdersService.openConversation → PharmacyOrdersUseCases.openConversation → CommunityPharmacyOrderChatAdapter.openOrderConversation → CommunityOrderChatService.openOrderConversation → CommunityMessagingService.createSystemDirectConversation → CommunityMessagingService.createDirectConversation → ConversationsRepository.createParticipant | `src/modules/community/repositories/conversations.repository.ts:161` |
| `community.conversation_participants` | LEE | LEE | DIRECTA | PharmacyOrdersController.openConversation → PharmacyOrdersService.openConversation → PharmacyOrdersUseCases.openConversation → CommunityPharmacyOrderChatAdapter.openOrderConversation → CommunityOrderChatService.openOrderConversation → CommunityMessagingService.createSystemDirectConversation → CommunityMessagingService.createDirectConversation → ConversationsRepository.findDirectBetween | `src/modules/community/repositories/conversations.repository.ts:284` |
| `community.conversations` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.openConversation → PharmacyOrdersService.openConversation → PharmacyOrdersUseCases.openConversation → CommunityPharmacyOrderChatAdapter.openOrderConversation → CommunityOrderChatService.openOrderConversation → CommunityMessagingService.createSystemDirectConversation → CommunityMessagingService.createDirectConversation → ConversationsRepository.createConversation | `src/modules/community/repositories/conversations.repository.ts:136` |
| `community.conversations` | LEE | LEE | DIRECTA | PharmacyOrdersController.openConversation → PharmacyOrdersService.openConversation → PharmacyOrdersUseCases.openConversation → CommunityPharmacyOrderChatAdapter.openOrderConversation → CommunityOrderChatService.openOrderConversation → CommunityMessagingService.createSystemDirectConversation → CommunityMessagingService.createDirectConversation → ConversationsRepository.findDirectBetween | `src/modules/community/repositories/conversations.repository.ts:304` |
| `community.public_profiles` | LEE | LEE | DIRECTA | PharmacyOrdersController.openConversation → PharmacyOrdersService.openConversation → PharmacyOrdersUseCases.openConversation → CommunityPharmacyOrderChatAdapter.openOrderConversation → CommunityOrderChatService.openOrderConversation → PublicProfilesRepository.findByTarget | `src/modules/community/repositories/public-profiles.repository.ts:350` |
| `community.user_blocks` | LEE | LEE | DIRECTA | PharmacyOrdersController.openConversation → PharmacyOrdersService.openConversation → PharmacyOrdersUseCases.openConversation → CommunityPharmacyOrderChatAdapter.openOrderConversation → CommunityOrderChatService.openOrderConversation → CommunityMessagingService.createSystemDirectConversation → CommunityMessagingService.createDirectConversation → BlocksRepository.existsBetween | `src/modules/community/repositories/blocks.repository.ts:58` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | PharmacyOrdersController.openConversation → PharmacyOrdersService.openConversation → PharmacyOrdersUseCases.openConversation → CommunityPharmacyOrderChatAdapter.openOrderConversation → CommunityOrderChatService.openOrderConversation → CommunityMessagingService.createSystemDirectConversation → CommunityMessagingService.createDirectConversation → CommunityVisibilityService.assertActsAsProfile → CommunityVisibilityService.isHolder → CommunityOrganizationStaffService.canAdminister → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `directory.tenants` | LEE | LEE | DIRECTA | PharmacyOrdersController.openConversation → PharmacyOrdersService.openConversation → PharmacyOrdersUseCases.openConversation → CommunityPharmacyOrderChatAdapter.openOrderConversation → CommunityOrderChatService.openOrderConversation → CommunityOrderChatService.findOrganizationShowcases → CommunityOrganizationStaffService.verifiedActiveTenantIds | `src/modules/community/services/community-organization-staff.service.ts:283` |
| `pharmacy_inventory.inventory_reservations` | LEE | LEE | DIRECTA | PharmacyOrdersController.openConversation → PharmacyOrdersService.openConversation → PharmacyOrdersUseCases.openConversation → PharmacyOrdersRepository.findOrderById | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:45` |
| `pharmacy.pharmacies` | LEE | LEE | DIRECTA | PharmacyOrdersController.openConversation → PharmacyOrdersService.openConversation → PharmacyOrdersUseCases.openConversation → PharmacyOrdersRepository.findPharmaciesByIdsInTenant | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:235` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | PharmacyOrdersController.openConversation → PharmacyOrdersService.openConversation → PharmacyOrdersUseCases.openConversation → ProfilesPersonAccountLinksAdapter.findActiveByPerson → PersonAccountLinksRepository.findActiveByPerson | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:101` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PharmacyOrderConversationDto>` · DTO `PharmacyOrderConversationDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `conversationId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:615` |
| `pharmacyProfileId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:622` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El paciente todavía no tiene un perfil con el que conversar; PreconditionFailedException: La farmacia no tiene una vitrina activa con la que conversar |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharmacy_inventory.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / pharmacy inventory — etapa `ctrl:PharmacyOrdersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 23. POST /pharmacy/orders/{id}/dispense

- **Origen:** CONTRATO
- **Nombre:** Dispensar el pedido en el mostrador (FAR-E3)
- **Bloque:** Farmacia
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyOrdersController.dispense` — `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-orders.controller.ts:345`

### Qué es y para qué sirve (negocio)

Dispensar el pedido en el mostrador (FAR-E3). Dentro del módulo (descripción del modelo, en inglés): «Prevents overselling and untraceable adjustments under concurrent manual, API, dispensing and receiving operations.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_25_pharmacy_inventory.puml:20`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`POST /pharmacy/orders/{id}/dispense` la atiende `PharmacyOrdersController.dispense` (src/modules/pharmacy_inventory/presentation/controllers/pharmacy-orders.controller.ts:345). Exige sesión con alguno de los roles SECURITY_ADMIN, PHARMACY_STAFF. Valida el cuerpo como `DispensePharmacyOrderDto` (3 campos, 1 obligatorio). Delega en `PharmacyOrdersService.dispense`. Crea filas en messaging.domain_events, messaging.in_app_notifications, messaging.notification_deliveries, messaging.notification_requests, messaging.outbox_messages, pharmacy_inventory.inventory_ledger_entries, pharmacy_inventory.medication_dispensation_lines, pharmacy_inventory.medication_dispensations. Actualiza iam.devices, pharmacy_inventory.inventory_reservations, pharmacy_inventory.inventory_stock_positions. Lee clinical.medication_requests, common.addresses, community.public_profiles, directory.tenants, iam.devices, insurance.insurance_claims, messaging.in_app_notifications, messaging.message_channels y 18 más. Publica un evento calculado (null).

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PHARMACY_STAFF | `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-orders.controller.ts:345` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-orders.controller.ts:345` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.medication_requests` | LEE | LEE | DIRECTA | PharmacyOrdersController.dispense → PharmacyOrdersService.dispense → PharmacyOrdersUseCases.dispense → PharmacyOrdersRepository.findPrescriberProfileId | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:290` |
| `common.addresses` | LEE | LEE | DIRECTA | PharmacyOrdersController.dispense → PharmacyOrdersService.dispense → PharmacyOrdersUseCases.dispense → PharmacyOrdersUseCases.readOrderForTenant → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findAddressesByIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:361` |
| `community.public_profiles` | LEE | LEE | DIRECTA | PharmacyOrdersController.dispense → PharmacyOrdersService.dispense → PharmacyOrdersUseCases.dispense → PharmacyOrdersUseCases.readOrderForTenant → PharmacyOrdersUseCases.composeOrders → CommunityPharmacyOrderChatAdapter.findPharmacyShowcases → CommunityOrderChatService.findOrganizationShowcases → PublicProfilesRepository.listByIds | `src/modules/community/repositories/public-profiles.repository.ts:135` |
| `directory.tenants` | LEE | LEE | DIRECTA | PharmacyOrdersController.dispense → PharmacyOrdersService.dispense → PharmacyOrdersUseCases.dispense → PharmacyOrdersUseCases.readOrderForTenant → PharmacyOrdersUseCases.composeOrders → CommunityPharmacyOrderChatAdapter.findPharmacyShowcases → CommunityOrderChatService.findOrganizationShowcases → CommunityOrganizationStaffService.verifiedActiveTenantIds | `src/modules/community/services/community-organization-staff.service.ts:283` |
| `iam.devices` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyOrdersController.dispense → PharmacyOrdersService.dispense → PharmacyOrdersUseCases.dispense → PharmacyOrderNotificationsService.dispensedToPrescriber → NotifyPharmacyOrderUseCase.dispensedToPrescriber → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → WebPushService.pushToUser → WebPushService.sendTo → WebPushService.forget | `src/modules/messaging/services/web-push.service.ts:235` |
| `iam.devices` | LEE | LEE | DIRECTA | PharmacyOrdersController.dispense → PharmacyOrdersService.dispense → PharmacyOrdersUseCases.dispense → PharmacyOrderNotificationsService.dispensedToPrescriber → NotifyPharmacyOrderUseCase.dispensedToPrescriber → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → WebPushService.pushToUser | `src/modules/messaging/services/web-push.service.ts:172` |
| `insurance.insurance_claims` | LEE | LEE | DIRECTA | PharmacyOrdersController.dispense → PharmacyOrdersService.dispense → PharmacyOrdersUseCases.dispense → InsurancePatientSettlementAdapter.activeClaimForDispensation → PatientSettlementService.activeClaimForDispensation → PatientSettlementRepository.activeClaimForDispensation | `src/modules/insurance/infrastructure/repositories/patient-settlement.repository.ts:183` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.dispense → PharmacyOrdersService.dispense → PharmacyOrdersUseCases.dispense → PharmacyOrdersUseCases.publishStaffEvent → MessagingDomainEventAdapter.publish → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.in_app_notifications` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.dispense → PharmacyOrdersService.dispense → PharmacyOrdersUseCases.dispense → PharmacyOrderNotificationsService.dispensedToPrescriber → NotifyPharmacyOrderUseCase.dispensedToPrescriber → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createInAppNotification | `src/modules/messaging/repositories/notifications.repository.ts:710` |
| `messaging.in_app_notifications` | LEE | LEE | DIRECTA | PharmacyOrdersController.dispense → PharmacyOrdersService.dispense → PharmacyOrdersUseCases.dispense → PharmacyOrderNotificationsService.dispensedToPrescriber → NotifyPharmacyOrderUseCase.dispensedToPrescriber → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findUnreadInAppForResource | `src/modules/messaging/repositories/notifications.repository.ts:845` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | PharmacyOrdersController.dispense → PharmacyOrdersService.dispense → PharmacyOrdersUseCases.dispense → PharmacyOrderNotificationsService.dispensedToPrescriber → NotifyPharmacyOrderUseCase.dispensedToPrescriber → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findActiveChannelByType | `src/modules/messaging/repositories/notifications.repository.ts:189` |
| `messaging.messaging_providers` | LEE | LEE | DIRECTA | PharmacyOrdersController.dispense → PharmacyOrdersService.dispense → PharmacyOrdersUseCases.dispense → PharmacyOrderNotificationsService.dispensedToPrescriber → NotifyPharmacyOrderUseCase.dispensedToPrescriber → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findProviderById | `src/modules/messaging/repositories/notifications.repository.ts:437` |
| `messaging.notification_deliveries` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.dispense → PharmacyOrdersService.dispense → PharmacyOrdersUseCases.dispense → PharmacyOrderNotificationsService.dispensedToPrescriber → NotifyPharmacyOrderUseCase.dispensedToPrescriber → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createDelivery | `src/modules/messaging/repositories/notifications.repository.ts:514` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.dispense → PharmacyOrdersService.dispense → PharmacyOrdersUseCases.dispense → PharmacyOrderNotificationsService.dispensedToPrescriber → NotifyPharmacyOrderUseCase.dispensedToPrescriber → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.dispense → PharmacyOrdersService.dispense → PharmacyOrdersUseCases.dispense → PharmacyOrdersUseCases.publishStaffEvent → MessagingDomainEventAdapter.publish → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | PharmacyOrdersController.dispense → PharmacyOrdersService.dispense → PharmacyOrdersUseCases.dispense → PharmacyOrdersUseCases.publishStaffEvent → MessagingDomainEventAdapter.publish → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |
| `messaging.provider_channel_configs` | LEE | LEE | DIRECTA | PharmacyOrdersController.dispense → PharmacyOrdersService.dispense → PharmacyOrdersUseCases.dispense → PharmacyOrderNotificationsService.dispensedToPrescriber → NotifyPharmacyOrderUseCase.dispensedToPrescriber → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findChannelConfigs | `src/modules/messaging/repositories/notifications.repository.ts:405` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | PharmacyOrdersController.dispense → PharmacyOrdersService.dispense → PharmacyOrdersUseCases.dispense → PharmacyOrderNotificationsService.dispensedToPrescriber → NotifyPharmacyOrderUseCase.dispensedToPrescriber → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `pharmacy_inventory.inventory_ledger_entries` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.dispense → PharmacyOrdersService.dispense → PharmacyOrdersUseCases.dispense → LedgerRepository.append | `src/modules/pharmacy_inventory/infrastructure/repositories/ledger.repository.ts:142` |
| `pharmacy_inventory.inventory_ledger_entries` | LEE | LEE | POR_SQL | PharmacyOrdersController.dispense → PharmacyOrdersService.dispense → PharmacyOrdersUseCases.dispense → LedgerRepository.nextSequence | `src/modules/pharmacy_inventory/infrastructure/repositories/ledger.repository.ts:113` |
| `pharmacy_inventory.inventory_reservation_lines` | LEE | LEE | DIRECTA | PharmacyOrdersController.dispense → PharmacyOrdersService.dispense → PharmacyOrdersUseCases.dispense → PharmacyOrdersRepository.findLinesByReservationIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:220` |
| `pharmacy_inventory.inventory_reservations` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyOrdersController.dispense → PharmacyOrdersService.dispense → PharmacyOrdersUseCases.dispense | `src/modules/pharmacy_inventory/application/pharmacy-orders/pharmacy-orders.use-cases.ts:1553` |
| `pharmacy_inventory.inventory_reservations` | LEE | LEE | DIRECTA | PharmacyOrdersController.dispense → PharmacyOrdersService.dispense → PharmacyOrdersUseCases.dispense → PharmacyOrdersUseCases.loadTenantOrderForUpdate → PharmacyOrdersRepository.findOrderByIdForUpdate | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:61` |
| `pharmacy_inventory.inventory_stock_positions` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyOrdersController.dispense → PharmacyOrdersService.dispense → PharmacyOrdersUseCases.dispense | `src/modules/pharmacy_inventory/application/pharmacy-orders/pharmacy-orders.use-cases.ts:1527` |
| `pharmacy_inventory.inventory_stock_positions` | LEE | LEE | DIRECTA | PharmacyOrdersController.dispense → PharmacyOrdersService.dispense → PharmacyOrdersUseCases.dispense → StockPositionsRepository.findByKeyForUpdate | `src/modules/pharmacy_inventory/infrastructure/repositories/stock-positions.repository.ts:82` |
| `pharmacy_inventory.medication_dispensation_lines` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.dispense → PharmacyOrdersService.dispense → PharmacyOrdersUseCases.dispense → DispensationsRepository.createLine | `src/modules/pharmacy_inventory/infrastructure/repositories/dispensations.repository.ts:177` |
| `pharmacy_inventory.medication_dispensations` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.dispense → PharmacyOrdersService.dispense → PharmacyOrdersUseCases.dispense → DispensationsRepository.create | `src/modules/pharmacy_inventory/infrastructure/repositories/dispensations.repository.ts:147` |
| `pharmacy_inventory.medication_dispensations` | LEE | LEE | DIRECTA | PharmacyOrdersController.dispense → PharmacyOrdersService.dispense → PharmacyOrdersUseCases.dispense → DispensationsRepository.findByIdempotencyKey | `src/modules/pharmacy_inventory/infrastructure/repositories/dispensations.repository.ts:117` |
| `pharmacy_inventory.pharmacy_order_substitutions` | LEE | LEE | DIRECTA | PharmacyOrdersController.dispense → PharmacyOrdersService.dispense → PharmacyOrdersUseCases.dispense → PharmacyOrdersUseCases.readOrderForTenant → PharmacyOrdersUseCases.composeOrders → PharmacyOrderSubstitutionsRepository.findByReservationIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-order-substitutions.repository.ts:62` |
| `pharmacy.pharmacies` | LEE | LEE | DIRECTA | PharmacyOrdersController.dispense → PharmacyOrdersService.dispense → PharmacyOrdersUseCases.dispense → PharmacyOrdersUseCases.loadTenantOrderForUpdate → PharmacyOrdersRepository.findPharmaciesByIdsInTenant | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:235` |
| `pharmacy.pharmacy_products` | LEE | LEE | DIRECTA | PharmacyOrdersController.dispense → PharmacyOrdersService.dispense → PharmacyOrdersUseCases.dispense → PharmacyOrdersUseCases.readOrderForTenant → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findProductsByIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:256` |
| `pharmacy.pharmacy_sites` | LEE | LEE | DIRECTA | PharmacyOrdersController.dispense → PharmacyOrdersService.dispense → PharmacyOrdersUseCases.dispense → PharmacyOrdersUseCases.readOrderForTenant → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findSitesByIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:247` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | PharmacyOrdersController.dispense → PharmacyOrdersService.dispense → PharmacyOrdersUseCases.dispense → PharmacyOrderNotificationsService.dispensedToPrescriber → NotifyPharmacyOrderUseCase.dispensedToPrescriber → NotifyPharmacyOrderUseCase.emitToPerson → ProfilesPersonAccountLinksAdapter.findActiveByPerson → PersonAccountLinksRepository.findActiveByPerson | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:101` |
| `profiles.person_profiles` | LEE | LEE | DIRECTA | PharmacyOrdersController.dispense → PharmacyOrdersService.dispense → PharmacyOrdersUseCases.dispense → PharmacyOrdersUseCases.readOrderForTenant → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findPersonNamesByProfileIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:143` |
| `profiles.persons` | LEE | LEE | DIRECTA | PharmacyOrdersController.dispense → PharmacyOrdersService.dispense → PharmacyOrdersUseCases.dispense → PharmacyOrdersUseCases.readOrderForTenant → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findPersonNamesByProfileIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:135` |
| `profiles.practitioner_specialties` | LEE | LEE | DIRECTA | PharmacyOrdersController.dispense → PharmacyOrdersService.dispense → PharmacyOrdersUseCases.dispense → PharmacyOrdersUseCases.readOrderForTenant → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findPrimarySpecialtyConceptIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:331` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | PharmacyOrdersController.dispense → PharmacyOrdersService.dispense → PharmacyOrdersUseCases.dispense → PharmacyOrdersUseCases.readOrderForTenant → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findConceptsByIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:370` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | calculado: `null` | `src/modules/pharmacy_inventory/infrastructure/adapters/messaging-domain-event.adapter.ts:16` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `DispensePharmacyOrderDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `pickupCode` | `string` | Sí | longitud mínima 1; longitud máxima 20 | `@IsString()` `@IsNotEmpty()` `@MaxLength(20)` | Código de retiro que presenta la persona | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:565` |
| `productIds` | `array<string>` | No | formato uuid; mínimo 1 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayMinSize(1)` `@IsUUID('all', { each: true })` | Productos de esta entrega; omitido = todo el saldo en pie | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:580` |
| `idempotencyKey` | `string` | No | longitud máxima 120 | `@IsOptional()` `@IsString()` `@MaxLength(120)` | Clave de idempotencia; repetirla no duplica la entrega | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:593` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "pickupCode": "CODIGO_EJEMPLO"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "pickupCode": "CODIGO_EJEMPLO",
  "productIds": [
    "00000000-0000-4000-8000-000000000001"
  ],
  "idempotencyKey": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<PharmacyOrderDto>` · DTO `PharmacyOrderDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reservationLines` | `array<PharmacyOrderReservationLineDto>` | Sí | — | — | Porciones confirmadas o entregadas vigentes para facturación | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:253` |
| `reservationLines[].id` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:212` |
| `reservationLines[].productId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:215` |
| `reservationLines[].quantity` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:218` |
| `reservationLines[].unitPriceAmount` | `string` | Sí | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:221` |
| `reservationLines[].billedAmount` | `string` | Sí | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:224` |
| `reservationLines[].currencyConceptId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:227` |
| `insuranceSettlement` | `PatientInsuranceSettlementDto` | Sí | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:256` |
| `insuranceSettlement.claimId` | `string` | Sí | formato uuid | — | — | sin fuente |
| `insuranceSettlement.claimIdentifier` | `string` | Sí | — | — | — | sin fuente |
| `insuranceSettlement.adjudicationVersionId` | `string` | Sí | formato uuid | — | — | sin fuente |
| `insuranceSettlement.adjudicationVersion` | `number` | Sí | formato int32; mínimo 1 | — | — | sin fuente |
| `insuranceSettlement.eobId` | `string` | Sí | formato uuid | — | — | sin fuente |
| `insuranceSettlement.carrierName` | `string` | Sí | — | — | — | sin fuente |
| `insuranceSettlement.policyIdentifier` | `string` | Sí | admite null | — | — | sin fuente |
| `insuranceSettlement.totalBilledAmount` | `string` | Sí | — | — | Total facturado, decimal exacto | sin fuente |
| `insuranceSettlement.totalApprovedAmount` | `string` | Sí | — | — | Aporte del seguro, decimal exacto | sin fuente |
| `insuranceSettlement.totalPatientAmount` | `string` | Sí | — | — | Cargo confirmado al paciente, decimal exacto | sin fuente |
| `insuranceSettlement.totalDeniedAmount` | `string` | Sí | — | — | Importe excluido sin asignar, decimal exacto | sin fuente |
| `insuranceSettlement.currencyCode` | `string` | Sí | — | — | — | sin fuente |
| `insuranceSettlement.result` | `string` | Sí | valores: APPROVED, PARTIALLY_APPROVED, DENIED | — | — | sin fuente |
| `insuranceSettlement.exclusions` | `array<PatientInsuranceSettlementExclusionDto>` | Sí | — | — | — | sin fuente |
| `insuranceSettlement.exclusions[].claimLineId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/patient-settlement.dto.ts:9` |
| `insuranceSettlement.exclusions[].itemId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/patient-settlement.dto.ts:12` |
| `insuranceSettlement.exclusions[].itemName` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/patient-settlement.dto.ts:15` |
| `insuranceSettlement.exclusions[].amount` | `string` | Sí | — | — | Importe decimal exacto excluido | `src/modules/pharmacy_inventory/presentation/dto/patient-settlement.dto.ts:18` |
| `insuranceSettlement.exclusions[].policyClauseReference` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/patient-settlement.dto.ts:21` |
| `insuranceSettlement.exclusions[].denialRationale` | `string` | Sí | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/patient-settlement.dto.ts:24` |
| `insuranceSettlementAvailability` | `string` | Sí | valores: AVAILABLE, PENDING_PUBLICATION, UNDER_REVIEW, NOT_AVAILABLE | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:261` |
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:267` |
| `status` | `InventoryConceptDto` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:273` |
| `status.code` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:17` |
| `status.display` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:23` |
| `createdAt` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:279` |
| `expiresAt` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:286` |
| `siteId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:292` |
| `siteName` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:298` |
| `pharmacyId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:304` |
| `pharmacyName` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:310` |
| `medicationRequestId` | `string` | No | formato uuid; admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:316` |
| `prescriber` | `PharmacyOrderPrescriberDto` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:328` |
| `prescriber.name` | `string` | No | admite null | — | — | sin fuente |
| `prescriber.specialty` | `string` | No | admite null | — | — | sin fuente |
| `patientName` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:336` |
| `deliveryMode` | `InventoryConceptDto` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:343` |
| `deliveryMode.code` | `string` | No | — | — | — | sin fuente |
| `deliveryMode.display` | `string` | No | — | — | — | sin fuente |
| `deliveryAddressText` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:351` |
| `pickupCode` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:362` |
| `pharmacyPublicProfileId` | `string` | No | formato uuid; admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:373` |
| `pharmacyPublicSlug` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:380` |
| `totalAmount` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:391` |
| `currency` | `InventoryConceptDto` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:397` |
| `currency.code` | `string` | No | — | — | — | sin fuente |
| `currency.display` | `string` | No | — | — | — | sin fuente |
| `rejectionReasonText` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:404` |
| `substitutions` | `array<PharmacyOrderSubstitutionDto>` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:412` |
| `substitutions[].id` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:427` |
| `substitutions[].originalProductId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:433` |
| `substitutions[].originalName` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:439` |
| `substitutions[].originalUnitPriceAmount` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:445` |
| `substitutions[].proposedProductId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:451` |
| `substitutions[].proposedName` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:457` |
| `substitutions[].proposedUnitPriceAmount` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:463` |
| `substitutions[].currency` | `InventoryConceptDto` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:469` |
| `substitutions[].currency.code` | `string` | No | — | — | — | sin fuente |
| `substitutions[].currency.display` | `string` | No | — | — | — | sin fuente |
| `substitutions[].status` | `InventoryConceptDto` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:475` |
| `substitutions[].status.code` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:17` |
| `substitutions[].status.display` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:23` |
| `substitutions[].decidedAt` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:481` |
| `lines` | `array<PharmacyOrderLineDto>` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:418` |
| `lines[].productId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:123` |
| `lines[].medicationConceptId` | `string` | No | formato uuid; admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:129` |
| `lines[].productCode` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:135` |
| `lines[].brandName` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:141` |
| `lines[].genericName` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:147` |
| `lines[].strengthText` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:153` |
| `lines[].packageSizeText` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:159` |
| `lines[].medication` | `InventoryConceptDto` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:165` |
| `lines[].medication.code` | `string` | No | — | — | — | sin fuente |
| `lines[].medication.display` | `string` | No | — | — | — | sin fuente |
| `lines[].requestedQuantity` | `number` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:171` |
| `lines[].reservedQuantity` | `number` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:177` |
| `lines[].fulfilledQuantity` | `number` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:184` |
| `lines[].unitPriceAmount` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:193` |
| `lines[].currency` | `InventoryConceptDto` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:199` |
| `lines[].currency.code` | `string` | No | — | — | — | sin fuente |
| `lines[].currency.display` | `string` | No | — | — | — | sin fuente |
| `lines[].status` | `InventoryConceptDto` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:206` |
| `lines[].status.code` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:17` |
| `lines[].status.display` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:23` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: La clave de idempotencia ya se usó para otra entrega |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Solo un pedido listo para retiro puede dispensarse; PreconditionFailedException: El código de retiro no coincide. El pedido no se modificó.; PreconditionFailedException: La entrega refiere productos sin saldo en pie en este pedido; PreconditionFailedException: El pedido no tiene saldo en pie que entregar |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharmacy_inventory.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / pharmacy inventory — etapa `ctrl:PharmacyOrdersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 24. POST /pharmacy/orders/{id}/prefer-original

- **Origen:** CONTRATO
- **Nombre:** Preferir los productos originales (paciente)
- **Bloque:** Farmacia
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyOrdersController.preferOriginal` — `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-orders.controller.ts:273`

### Qué es y para qué sirve (negocio)

Preferir los productos originales (paciente). Dentro del módulo (descripción del modelo, en inglés): «Prevents overselling and untraceable adjustments under concurrent manual, API, dispensing and receiving operations.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_25_pharmacy_inventory.puml:20`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`POST /pharmacy/orders/{id}/prefer-original` la atiende `PharmacyOrdersController.preferOriginal` (src/modules/pharmacy_inventory/presentation/controllers/pharmacy-orders.controller.ts:273). Exige sesión con alguno de los roles PATIENT. Delega en `PharmacyOrdersService.preferOriginal`. Crea filas en messaging.domain_events, messaging.outbox_messages. Actualiza pharmacy_inventory.inventory_reservations, pharmacy_inventory.pharmacy_order_substitutions. Lee clinical.medication_requests, common.addresses, community.public_profiles, directory.tenants, messaging.outbox_messages, pharmacy_inventory.inventory_reservation_lines, pharmacy_inventory.inventory_reservations, pharmacy_inventory.pharmacy_order_substitutions y 7 más. Publica un evento calculado (null).

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PATIENT | `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-orders.controller.ts:273` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-orders.controller.ts:273` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.medication_requests` | LEE | LEE | DIRECTA | PharmacyOrdersController.preferOriginal → PharmacyOrdersService.preferOriginal → PharmacyOrdersUseCases.preferOriginal → PharmacyOrdersUseCases.readOwnOrder → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findPrescriberProfileIdsByRequestIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:307` |
| `common.addresses` | LEE | LEE | DIRECTA | PharmacyOrdersController.preferOriginal → PharmacyOrdersService.preferOriginal → PharmacyOrdersUseCases.preferOriginal → PharmacyOrdersUseCases.readOwnOrder → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findAddressesByIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:361` |
| `community.public_profiles` | LEE | LEE | DIRECTA | PharmacyOrdersController.preferOriginal → PharmacyOrdersService.preferOriginal → PharmacyOrdersUseCases.preferOriginal → PharmacyOrdersUseCases.readOwnOrder → PharmacyOrdersUseCases.composeOrders → CommunityPharmacyOrderChatAdapter.findPharmacyShowcases → CommunityOrderChatService.findOrganizationShowcases → PublicProfilesRepository.listByIds | `src/modules/community/repositories/public-profiles.repository.ts:135` |
| `directory.tenants` | LEE | LEE | DIRECTA | PharmacyOrdersController.preferOriginal → PharmacyOrdersService.preferOriginal → PharmacyOrdersUseCases.preferOriginal → PharmacyOrdersUseCases.readOwnOrder → PharmacyOrdersUseCases.composeOrders → CommunityPharmacyOrderChatAdapter.findPharmacyShowcases → CommunityOrderChatService.findOrganizationShowcases → CommunityOrganizationStaffService.verifiedActiveTenantIds | `src/modules/community/services/community-organization-staff.service.ts:283` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.preferOriginal → PharmacyOrdersService.preferOriginal → PharmacyOrdersUseCases.preferOriginal → PharmacyOrdersUseCases.publishStaffEvent → MessagingDomainEventAdapter.publish → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.preferOriginal → PharmacyOrdersService.preferOriginal → PharmacyOrdersUseCases.preferOriginal → PharmacyOrdersUseCases.publishStaffEvent → MessagingDomainEventAdapter.publish → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | PharmacyOrdersController.preferOriginal → PharmacyOrdersService.preferOriginal → PharmacyOrdersUseCases.preferOriginal → PharmacyOrdersUseCases.publishStaffEvent → MessagingDomainEventAdapter.publish → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |
| `pharmacy_inventory.inventory_reservation_lines` | LEE | LEE | DIRECTA | PharmacyOrdersController.preferOriginal → PharmacyOrdersService.preferOriginal → PharmacyOrdersUseCases.preferOriginal → PharmacyOrdersUseCases.readOwnOrder → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findLinesByReservationIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:220` |
| `pharmacy_inventory.inventory_reservations` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyOrdersController.preferOriginal → PharmacyOrdersService.preferOriginal → PharmacyOrdersUseCases.preferOriginal | `src/modules/pharmacy_inventory/application/pharmacy-orders/pharmacy-orders.use-cases.ts:1177` |
| `pharmacy_inventory.inventory_reservations` | LEE | LEE | DIRECTA | PharmacyOrdersController.preferOriginal → PharmacyOrdersService.preferOriginal → PharmacyOrdersUseCases.preferOriginal → PharmacyOrdersUseCases.loadOwnOrderForUpdate → PharmacyOrdersRepository.findOrderByIdForUpdate | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:61` |
| `pharmacy_inventory.pharmacy_order_substitutions` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyOrdersController.preferOriginal → PharmacyOrdersService.preferOriginal → PharmacyOrdersUseCases.preferOriginal | `src/modules/pharmacy_inventory/application/pharmacy-orders/pharmacy-orders.use-cases.ts:1172` |
| `pharmacy_inventory.pharmacy_order_substitutions` | LEE | LEE | DIRECTA | PharmacyOrdersController.preferOriginal → PharmacyOrdersService.preferOriginal → PharmacyOrdersUseCases.preferOriginal → PharmacyOrdersUseCases.pendingProposalsOf → PharmacyOrderSubstitutionsRepository.findByReservationIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-order-substitutions.repository.ts:62` |
| `pharmacy.pharmacies` | LEE | LEE | DIRECTA | PharmacyOrdersController.preferOriginal → PharmacyOrdersService.preferOriginal → PharmacyOrdersUseCases.preferOriginal → PharmacyOrdersUseCases.loadOwnOrderForUpdate → PharmacyOrdersRepository.findPharmaciesByIdsInTenant | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:235` |
| `pharmacy.pharmacy_products` | LEE | LEE | DIRECTA | PharmacyOrdersController.preferOriginal → PharmacyOrdersService.preferOriginal → PharmacyOrdersUseCases.preferOriginal → PharmacyOrdersUseCases.readOwnOrder → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findProductsByIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:256` |
| `pharmacy.pharmacy_sites` | LEE | LEE | DIRECTA | PharmacyOrdersController.preferOriginal → PharmacyOrdersService.preferOriginal → PharmacyOrdersUseCases.preferOriginal → PharmacyOrdersUseCases.readOwnOrder → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findSitesByIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:247` |
| `profiles.person_profiles` | LEE | LEE | DIRECTA | PharmacyOrdersController.preferOriginal → PharmacyOrdersService.preferOriginal → PharmacyOrdersUseCases.preferOriginal → PharmacyOrdersUseCases.readOwnOrder → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findPersonNamesByProfileIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:143` |
| `profiles.persons` | LEE | LEE | DIRECTA | PharmacyOrdersController.preferOriginal → PharmacyOrdersService.preferOriginal → PharmacyOrdersUseCases.preferOriginal → PharmacyOrdersUseCases.readOwnOrder → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findPersonNamesByProfileIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:135` |
| `profiles.practitioner_specialties` | LEE | LEE | DIRECTA | PharmacyOrdersController.preferOriginal → PharmacyOrdersService.preferOriginal → PharmacyOrdersUseCases.preferOriginal → PharmacyOrdersUseCases.readOwnOrder → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findPrimarySpecialtyConceptIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:331` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | PharmacyOrdersController.preferOriginal → PharmacyOrdersService.preferOriginal → PharmacyOrdersUseCases.preferOriginal → PharmacyOrdersUseCases.readOwnOrder → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findConceptsByIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:370` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | calculado: `null` | `src/modules/pharmacy_inventory/infrastructure/adapters/messaging-domain-event.adapter.ts:16` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PharmacyOrderDto>` · DTO `PharmacyOrderDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reservationLines` | `array<PharmacyOrderReservationLineDto>` | Sí | — | — | Porciones confirmadas o entregadas vigentes para facturación | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:253` |
| `reservationLines[].id` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:212` |
| `reservationLines[].productId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:215` |
| `reservationLines[].quantity` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:218` |
| `reservationLines[].unitPriceAmount` | `string` | Sí | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:221` |
| `reservationLines[].billedAmount` | `string` | Sí | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:224` |
| `reservationLines[].currencyConceptId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:227` |
| `insuranceSettlement` | `PatientInsuranceSettlementDto` | Sí | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:256` |
| `insuranceSettlement.claimId` | `string` | Sí | formato uuid | — | — | sin fuente |
| `insuranceSettlement.claimIdentifier` | `string` | Sí | — | — | — | sin fuente |
| `insuranceSettlement.adjudicationVersionId` | `string` | Sí | formato uuid | — | — | sin fuente |
| `insuranceSettlement.adjudicationVersion` | `number` | Sí | formato int32; mínimo 1 | — | — | sin fuente |
| `insuranceSettlement.eobId` | `string` | Sí | formato uuid | — | — | sin fuente |
| `insuranceSettlement.carrierName` | `string` | Sí | — | — | — | sin fuente |
| `insuranceSettlement.policyIdentifier` | `string` | Sí | admite null | — | — | sin fuente |
| `insuranceSettlement.totalBilledAmount` | `string` | Sí | — | — | Total facturado, decimal exacto | sin fuente |
| `insuranceSettlement.totalApprovedAmount` | `string` | Sí | — | — | Aporte del seguro, decimal exacto | sin fuente |
| `insuranceSettlement.totalPatientAmount` | `string` | Sí | — | — | Cargo confirmado al paciente, decimal exacto | sin fuente |
| `insuranceSettlement.totalDeniedAmount` | `string` | Sí | — | — | Importe excluido sin asignar, decimal exacto | sin fuente |
| `insuranceSettlement.currencyCode` | `string` | Sí | — | — | — | sin fuente |
| `insuranceSettlement.result` | `string` | Sí | valores: APPROVED, PARTIALLY_APPROVED, DENIED | — | — | sin fuente |
| `insuranceSettlement.exclusions` | `array<PatientInsuranceSettlementExclusionDto>` | Sí | — | — | — | sin fuente |
| `insuranceSettlement.exclusions[].claimLineId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/patient-settlement.dto.ts:9` |
| `insuranceSettlement.exclusions[].itemId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/patient-settlement.dto.ts:12` |
| `insuranceSettlement.exclusions[].itemName` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/patient-settlement.dto.ts:15` |
| `insuranceSettlement.exclusions[].amount` | `string` | Sí | — | — | Importe decimal exacto excluido | `src/modules/pharmacy_inventory/presentation/dto/patient-settlement.dto.ts:18` |
| `insuranceSettlement.exclusions[].policyClauseReference` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/patient-settlement.dto.ts:21` |
| `insuranceSettlement.exclusions[].denialRationale` | `string` | Sí | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/patient-settlement.dto.ts:24` |
| `insuranceSettlementAvailability` | `string` | Sí | valores: AVAILABLE, PENDING_PUBLICATION, UNDER_REVIEW, NOT_AVAILABLE | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:261` |
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:267` |
| `status` | `InventoryConceptDto` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:273` |
| `status.code` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:17` |
| `status.display` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:23` |
| `createdAt` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:279` |
| `expiresAt` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:286` |
| `siteId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:292` |
| `siteName` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:298` |
| `pharmacyId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:304` |
| `pharmacyName` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:310` |
| `medicationRequestId` | `string` | No | formato uuid; admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:316` |
| `prescriber` | `PharmacyOrderPrescriberDto` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:328` |
| `prescriber.name` | `string` | No | admite null | — | — | sin fuente |
| `prescriber.specialty` | `string` | No | admite null | — | — | sin fuente |
| `patientName` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:336` |
| `deliveryMode` | `InventoryConceptDto` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:343` |
| `deliveryMode.code` | `string` | No | — | — | — | sin fuente |
| `deliveryMode.display` | `string` | No | — | — | — | sin fuente |
| `deliveryAddressText` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:351` |
| `pickupCode` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:362` |
| `pharmacyPublicProfileId` | `string` | No | formato uuid; admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:373` |
| `pharmacyPublicSlug` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:380` |
| `totalAmount` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:391` |
| `currency` | `InventoryConceptDto` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:397` |
| `currency.code` | `string` | No | — | — | — | sin fuente |
| `currency.display` | `string` | No | — | — | — | sin fuente |
| `rejectionReasonText` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:404` |
| `substitutions` | `array<PharmacyOrderSubstitutionDto>` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:412` |
| `substitutions[].id` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:427` |
| `substitutions[].originalProductId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:433` |
| `substitutions[].originalName` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:439` |
| `substitutions[].originalUnitPriceAmount` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:445` |
| `substitutions[].proposedProductId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:451` |
| `substitutions[].proposedName` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:457` |
| `substitutions[].proposedUnitPriceAmount` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:463` |
| `substitutions[].currency` | `InventoryConceptDto` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:469` |
| `substitutions[].currency.code` | `string` | No | — | — | — | sin fuente |
| `substitutions[].currency.display` | `string` | No | — | — | — | sin fuente |
| `substitutions[].status` | `InventoryConceptDto` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:475` |
| `substitutions[].status.code` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:17` |
| `substitutions[].status.display` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:23` |
| `substitutions[].decidedAt` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:481` |
| `lines` | `array<PharmacyOrderLineDto>` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:418` |
| `lines[].productId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:123` |
| `lines[].medicationConceptId` | `string` | No | formato uuid; admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:129` |
| `lines[].productCode` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:135` |
| `lines[].brandName` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:141` |
| `lines[].genericName` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:147` |
| `lines[].strengthText` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:153` |
| `lines[].packageSizeText` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:159` |
| `lines[].medication` | `InventoryConceptDto` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:165` |
| `lines[].medication.code` | `string` | No | — | — | — | sin fuente |
| `lines[].medication.display` | `string` | No | — | — | — | sin fuente |
| `lines[].requestedQuantity` | `number` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:171` |
| `lines[].reservedQuantity` | `number` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:177` |
| `lines[].fulfilledQuantity` | `number` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:184` |
| `lines[].unitPriceAmount` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:193` |
| `lines[].currency` | `InventoryConceptDto` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:199` |
| `lines[].currency.code` | `string` | No | — | — | — | sin fuente |
| `lines[].currency.display` | `string` | No | — | — | — | sin fuente |
| `lines[].status` | `InventoryConceptDto` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:206` |
| `lines[].status.code` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:17` |
| `lines[].status.display` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:23` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta autenticada no tiene perfil de paciente; PreconditionFailedException: El pedido no tiene una decisión de sustituciones pendiente; PreconditionFailedException: El pedido no tiene propuestas de sustitución en pie |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharmacy_inventory.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / pharmacy inventory — etapa `ctrl:PharmacyOrdersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 25. POST /pharmacy/orders/{id}/ready

- **Origen:** CONTRATO
- **Nombre:** Marcar el pedido listo para retiro (FAR-E2/E3)
- **Bloque:** Farmacia
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyOrdersController.ready` — `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-orders.controller.ts:320`

### Qué es y para qué sirve (negocio)

Marcar el pedido listo para retiro (FAR-E2/E3). Dentro del módulo (descripción del modelo, en inglés): «Prevents overselling and untraceable adjustments under concurrent manual, API, dispensing and receiving operations.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_25_pharmacy_inventory.puml:20`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`POST /pharmacy/orders/{id}/ready` la atiende `PharmacyOrdersController.ready` (src/modules/pharmacy_inventory/presentation/controllers/pharmacy-orders.controller.ts:320). Exige sesión con alguno de los roles SECURITY_ADMIN, PHARMACY_STAFF. Delega en `PharmacyOrdersService.ready`. Crea filas en messaging.domain_events, messaging.in_app_notifications, messaging.notification_deliveries, messaging.notification_requests, messaging.outbox_messages. Actualiza iam.devices, pharmacy_inventory.inventory_reservations. Lee clinical.medication_requests, common.addresses, community.public_profiles, directory.tenants, iam.devices, messaging.in_app_notifications, messaging.message_channels, messaging.messaging_providers y 14 más. Publica un evento calculado (null).

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PHARMACY_STAFF | `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-orders.controller.ts:320` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-orders.controller.ts:320` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.medication_requests` | LEE | LEE | DIRECTA | PharmacyOrdersController.ready → PharmacyOrdersService.ready → PharmacyOrdersUseCases.ready → PharmacyOrdersUseCases.readOrderForTenant → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findPrescriberProfileIdsByRequestIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:307` |
| `common.addresses` | LEE | LEE | DIRECTA | PharmacyOrdersController.ready → PharmacyOrdersService.ready → PharmacyOrdersUseCases.ready → PharmacyOrdersUseCases.readOrderForTenant → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findAddressesByIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:361` |
| `community.public_profiles` | LEE | LEE | DIRECTA | PharmacyOrdersController.ready → PharmacyOrdersService.ready → PharmacyOrdersUseCases.ready → PharmacyOrdersUseCases.readOrderForTenant → PharmacyOrdersUseCases.composeOrders → CommunityPharmacyOrderChatAdapter.findPharmacyShowcases → CommunityOrderChatService.findOrganizationShowcases → PublicProfilesRepository.listByIds | `src/modules/community/repositories/public-profiles.repository.ts:135` |
| `directory.tenants` | LEE | LEE | DIRECTA | PharmacyOrdersController.ready → PharmacyOrdersService.ready → PharmacyOrdersUseCases.ready → PharmacyOrdersUseCases.readOrderForTenant → PharmacyOrdersUseCases.composeOrders → CommunityPharmacyOrderChatAdapter.findPharmacyShowcases → CommunityOrderChatService.findOrganizationShowcases → CommunityOrganizationStaffService.verifiedActiveTenantIds | `src/modules/community/services/community-organization-staff.service.ts:283` |
| `iam.devices` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyOrdersController.ready → PharmacyOrdersService.ready → PharmacyOrdersUseCases.ready → PharmacyOrderNotificationsService.orderReady → NotifyPharmacyOrderUseCase.orderReady → NotifyPharmacyOrderUseCase.emitToPatient → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → WebPushService.pushToUser → WebPushService.sendTo → WebPushService.forget | `src/modules/messaging/services/web-push.service.ts:235` |
| `iam.devices` | LEE | LEE | DIRECTA | PharmacyOrdersController.ready → PharmacyOrdersService.ready → PharmacyOrdersUseCases.ready → PharmacyOrderNotificationsService.orderReady → NotifyPharmacyOrderUseCase.orderReady → NotifyPharmacyOrderUseCase.emitToPatient → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → WebPushService.pushToUser | `src/modules/messaging/services/web-push.service.ts:172` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.ready → PharmacyOrdersService.ready → PharmacyOrdersUseCases.ready → PharmacyOrdersUseCases.publishStaffEvent → MessagingDomainEventAdapter.publish → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.in_app_notifications` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.ready → PharmacyOrdersService.ready → PharmacyOrdersUseCases.ready → PharmacyOrderNotificationsService.orderReady → NotifyPharmacyOrderUseCase.orderReady → NotifyPharmacyOrderUseCase.emitToPatient → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createInAppNotification | `src/modules/messaging/repositories/notifications.repository.ts:710` |
| `messaging.in_app_notifications` | LEE | LEE | DIRECTA | PharmacyOrdersController.ready → PharmacyOrdersService.ready → PharmacyOrdersUseCases.ready → PharmacyOrderNotificationsService.orderReady → NotifyPharmacyOrderUseCase.orderReady → NotifyPharmacyOrderUseCase.emitToPatient → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findUnreadInAppForResource | `src/modules/messaging/repositories/notifications.repository.ts:845` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | PharmacyOrdersController.ready → PharmacyOrdersService.ready → PharmacyOrdersUseCases.ready → PharmacyOrderNotificationsService.orderReady → NotifyPharmacyOrderUseCase.orderReady → NotifyPharmacyOrderUseCase.emitToPatient → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findActiveChannelByType | `src/modules/messaging/repositories/notifications.repository.ts:189` |
| `messaging.messaging_providers` | LEE | LEE | DIRECTA | PharmacyOrdersController.ready → PharmacyOrdersService.ready → PharmacyOrdersUseCases.ready → PharmacyOrderNotificationsService.orderReady → NotifyPharmacyOrderUseCase.orderReady → NotifyPharmacyOrderUseCase.emitToPatient → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findProviderById | `src/modules/messaging/repositories/notifications.repository.ts:437` |
| `messaging.notification_deliveries` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.ready → PharmacyOrdersService.ready → PharmacyOrdersUseCases.ready → PharmacyOrderNotificationsService.orderReady → NotifyPharmacyOrderUseCase.orderReady → NotifyPharmacyOrderUseCase.emitToPatient → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createDelivery | `src/modules/messaging/repositories/notifications.repository.ts:514` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.ready → PharmacyOrdersService.ready → PharmacyOrdersUseCases.ready → PharmacyOrderNotificationsService.orderReady → NotifyPharmacyOrderUseCase.orderReady → NotifyPharmacyOrderUseCase.emitToPatient → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.ready → PharmacyOrdersService.ready → PharmacyOrdersUseCases.ready → PharmacyOrdersUseCases.publishStaffEvent → MessagingDomainEventAdapter.publish → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | PharmacyOrdersController.ready → PharmacyOrdersService.ready → PharmacyOrdersUseCases.ready → PharmacyOrdersUseCases.publishStaffEvent → MessagingDomainEventAdapter.publish → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |
| `messaging.provider_channel_configs` | LEE | LEE | DIRECTA | PharmacyOrdersController.ready → PharmacyOrdersService.ready → PharmacyOrdersUseCases.ready → PharmacyOrderNotificationsService.orderReady → NotifyPharmacyOrderUseCase.orderReady → NotifyPharmacyOrderUseCase.emitToPatient → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findChannelConfigs | `src/modules/messaging/repositories/notifications.repository.ts:405` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | PharmacyOrdersController.ready → PharmacyOrdersService.ready → PharmacyOrdersUseCases.ready → PharmacyOrderNotificationsService.orderReady → NotifyPharmacyOrderUseCase.orderReady → NotifyPharmacyOrderUseCase.emitToPatient → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `pharmacy_inventory.inventory_reservation_lines` | LEE | LEE | DIRECTA | PharmacyOrdersController.ready → PharmacyOrdersService.ready → PharmacyOrdersUseCases.ready → PharmacyOrdersUseCases.readOrderForTenant → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findLinesByReservationIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:220` |
| `pharmacy_inventory.inventory_reservations` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyOrdersController.ready → PharmacyOrdersService.ready → PharmacyOrdersUseCases.ready | `src/modules/pharmacy_inventory/application/pharmacy-orders/pharmacy-orders.use-cases.ts:1301` |
| `pharmacy_inventory.inventory_reservations` | LEE | LEE | DIRECTA | PharmacyOrdersController.ready → PharmacyOrdersService.ready → PharmacyOrdersUseCases.ready → PharmacyOrdersUseCases.loadTenantOrderForUpdate → PharmacyOrdersRepository.findOrderByIdForUpdate | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:61` |
| `pharmacy_inventory.pharmacy_order_substitutions` | LEE | LEE | DIRECTA | PharmacyOrdersController.ready → PharmacyOrdersService.ready → PharmacyOrdersUseCases.ready → PharmacyOrdersUseCases.readOrderForTenant → PharmacyOrdersUseCases.composeOrders → PharmacyOrderSubstitutionsRepository.findByReservationIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-order-substitutions.repository.ts:62` |
| `pharmacy.pharmacies` | LEE | LEE | DIRECTA | PharmacyOrdersController.ready → PharmacyOrdersService.ready → PharmacyOrdersUseCases.ready → PharmacyOrdersUseCases.loadTenantOrderForUpdate → PharmacyOrdersRepository.findPharmaciesByIdsInTenant | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:235` |
| `pharmacy.pharmacy_products` | LEE | LEE | DIRECTA | PharmacyOrdersController.ready → PharmacyOrdersService.ready → PharmacyOrdersUseCases.ready → PharmacyOrdersUseCases.readOrderForTenant → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findProductsByIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:256` |
| `pharmacy.pharmacy_sites` | LEE | LEE | DIRECTA | PharmacyOrdersController.ready → PharmacyOrdersService.ready → PharmacyOrdersUseCases.ready → PharmacyOrdersUseCases.assertPickupOrder → PharmacyOrdersRepository.findSitesByIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:247` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | PharmacyOrdersController.ready → PharmacyOrdersService.ready → PharmacyOrdersUseCases.ready → PharmacyOrderNotificationsService.orderReady → NotifyPharmacyOrderUseCase.orderReady → NotifyPharmacyOrderUseCase.emitToPatient → NotifyPharmacyOrderUseCase.emitToPerson → ProfilesPersonAccountLinksAdapter.findActiveByPerson → PersonAccountLinksRepository.findActiveByPerson | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:101` |
| `profiles.person_profiles` | LEE | LEE | DIRECTA | PharmacyOrdersController.ready → PharmacyOrdersService.ready → PharmacyOrdersUseCases.ready → PharmacyOrdersUseCases.readOrderForTenant → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findPersonNamesByProfileIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:143` |
| `profiles.persons` | LEE | LEE | DIRECTA | PharmacyOrdersController.ready → PharmacyOrdersService.ready → PharmacyOrdersUseCases.ready → PharmacyOrdersUseCases.readOrderForTenant → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findPersonNamesByProfileIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:135` |
| `profiles.practitioner_specialties` | LEE | LEE | DIRECTA | PharmacyOrdersController.ready → PharmacyOrdersService.ready → PharmacyOrdersUseCases.ready → PharmacyOrdersUseCases.readOrderForTenant → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findPrimarySpecialtyConceptIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:331` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | PharmacyOrdersController.ready → PharmacyOrdersService.ready → PharmacyOrdersUseCases.ready → PharmacyOrdersUseCases.readOrderForTenant → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findConceptsByIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:370` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | calculado: `null` | `src/modules/pharmacy_inventory/infrastructure/adapters/messaging-domain-event.adapter.ts:16` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PharmacyOrderDto>` · DTO `PharmacyOrderDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reservationLines` | `array<PharmacyOrderReservationLineDto>` | Sí | — | — | Porciones confirmadas o entregadas vigentes para facturación | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:253` |
| `reservationLines[].id` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:212` |
| `reservationLines[].productId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:215` |
| `reservationLines[].quantity` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:218` |
| `reservationLines[].unitPriceAmount` | `string` | Sí | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:221` |
| `reservationLines[].billedAmount` | `string` | Sí | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:224` |
| `reservationLines[].currencyConceptId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:227` |
| `insuranceSettlement` | `PatientInsuranceSettlementDto` | Sí | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:256` |
| `insuranceSettlement.claimId` | `string` | Sí | formato uuid | — | — | sin fuente |
| `insuranceSettlement.claimIdentifier` | `string` | Sí | — | — | — | sin fuente |
| `insuranceSettlement.adjudicationVersionId` | `string` | Sí | formato uuid | — | — | sin fuente |
| `insuranceSettlement.adjudicationVersion` | `number` | Sí | formato int32; mínimo 1 | — | — | sin fuente |
| `insuranceSettlement.eobId` | `string` | Sí | formato uuid | — | — | sin fuente |
| `insuranceSettlement.carrierName` | `string` | Sí | — | — | — | sin fuente |
| `insuranceSettlement.policyIdentifier` | `string` | Sí | admite null | — | — | sin fuente |
| `insuranceSettlement.totalBilledAmount` | `string` | Sí | — | — | Total facturado, decimal exacto | sin fuente |
| `insuranceSettlement.totalApprovedAmount` | `string` | Sí | — | — | Aporte del seguro, decimal exacto | sin fuente |
| `insuranceSettlement.totalPatientAmount` | `string` | Sí | — | — | Cargo confirmado al paciente, decimal exacto | sin fuente |
| `insuranceSettlement.totalDeniedAmount` | `string` | Sí | — | — | Importe excluido sin asignar, decimal exacto | sin fuente |
| `insuranceSettlement.currencyCode` | `string` | Sí | — | — | — | sin fuente |
| `insuranceSettlement.result` | `string` | Sí | valores: APPROVED, PARTIALLY_APPROVED, DENIED | — | — | sin fuente |
| `insuranceSettlement.exclusions` | `array<PatientInsuranceSettlementExclusionDto>` | Sí | — | — | — | sin fuente |
| `insuranceSettlement.exclusions[].claimLineId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/patient-settlement.dto.ts:9` |
| `insuranceSettlement.exclusions[].itemId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/patient-settlement.dto.ts:12` |
| `insuranceSettlement.exclusions[].itemName` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/patient-settlement.dto.ts:15` |
| `insuranceSettlement.exclusions[].amount` | `string` | Sí | — | — | Importe decimal exacto excluido | `src/modules/pharmacy_inventory/presentation/dto/patient-settlement.dto.ts:18` |
| `insuranceSettlement.exclusions[].policyClauseReference` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/patient-settlement.dto.ts:21` |
| `insuranceSettlement.exclusions[].denialRationale` | `string` | Sí | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/patient-settlement.dto.ts:24` |
| `insuranceSettlementAvailability` | `string` | Sí | valores: AVAILABLE, PENDING_PUBLICATION, UNDER_REVIEW, NOT_AVAILABLE | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:261` |
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:267` |
| `status` | `InventoryConceptDto` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:273` |
| `status.code` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:17` |
| `status.display` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:23` |
| `createdAt` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:279` |
| `expiresAt` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:286` |
| `siteId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:292` |
| `siteName` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:298` |
| `pharmacyId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:304` |
| `pharmacyName` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:310` |
| `medicationRequestId` | `string` | No | formato uuid; admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:316` |
| `prescriber` | `PharmacyOrderPrescriberDto` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:328` |
| `prescriber.name` | `string` | No | admite null | — | — | sin fuente |
| `prescriber.specialty` | `string` | No | admite null | — | — | sin fuente |
| `patientName` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:336` |
| `deliveryMode` | `InventoryConceptDto` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:343` |
| `deliveryMode.code` | `string` | No | — | — | — | sin fuente |
| `deliveryMode.display` | `string` | No | — | — | — | sin fuente |
| `deliveryAddressText` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:351` |
| `pickupCode` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:362` |
| `pharmacyPublicProfileId` | `string` | No | formato uuid; admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:373` |
| `pharmacyPublicSlug` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:380` |
| `totalAmount` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:391` |
| `currency` | `InventoryConceptDto` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:397` |
| `currency.code` | `string` | No | — | — | — | sin fuente |
| `currency.display` | `string` | No | — | — | — | sin fuente |
| `rejectionReasonText` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:404` |
| `substitutions` | `array<PharmacyOrderSubstitutionDto>` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:412` |
| `substitutions[].id` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:427` |
| `substitutions[].originalProductId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:433` |
| `substitutions[].originalName` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:439` |
| `substitutions[].originalUnitPriceAmount` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:445` |
| `substitutions[].proposedProductId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:451` |
| `substitutions[].proposedName` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:457` |
| `substitutions[].proposedUnitPriceAmount` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:463` |
| `substitutions[].currency` | `InventoryConceptDto` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:469` |
| `substitutions[].currency.code` | `string` | No | — | — | — | sin fuente |
| `substitutions[].currency.display` | `string` | No | — | — | — | sin fuente |
| `substitutions[].status` | `InventoryConceptDto` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:475` |
| `substitutions[].status.code` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:17` |
| `substitutions[].status.display` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:23` |
| `substitutions[].decidedAt` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:481` |
| `lines` | `array<PharmacyOrderLineDto>` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:418` |
| `lines[].productId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:123` |
| `lines[].medicationConceptId` | `string` | No | formato uuid; admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:129` |
| `lines[].productCode` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:135` |
| `lines[].brandName` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:141` |
| `lines[].genericName` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:147` |
| `lines[].strengthText` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:153` |
| `lines[].packageSizeText` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:159` |
| `lines[].medication` | `InventoryConceptDto` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:165` |
| `lines[].medication.code` | `string` | No | — | — | — | sin fuente |
| `lines[].medication.display` | `string` | No | — | — | — | sin fuente |
| `lines[].requestedQuantity` | `number` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:171` |
| `lines[].reservedQuantity` | `number` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:177` |
| `lines[].fulfilledQuantity` | `number` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:184` |
| `lines[].unitPriceAmount` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:193` |
| `lines[].currency` | `InventoryConceptDto` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:199` |
| `lines[].currency.code` | `string` | No | — | — | — | sin fuente |
| `lines[].currency.display` | `string` | No | — | — | — | sin fuente |
| `lines[].status` | `InventoryConceptDto` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:206` |
| `lines[].status.code` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:17` |
| `lines[].status.display` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:23` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: No se pudo sellar un código de retiro único; reintente la operación |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La transición no es legal para el estado actual del pedido; PreconditionFailedException: El pedido no declara modalidad de entrega: no puede demostrarse que sea un retiro; PreconditionFailedException: El pedido es de envío: se cierra por el carril de envío, no por el mostrador; PreconditionFailedException: La sede no ofrece retiro en mostrador |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharmacy_inventory.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / pharmacy inventory — etapa `ctrl:PharmacyOrdersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 26. POST /pharmacy/orders/{id}/reject

- **Origen:** CONTRATO
- **Nombre:** Rechazar el pedido (FAR-E2)
- **Bloque:** Farmacia
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyOrdersController.reject` — `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-orders.controller.ts:294`

### Qué es y para qué sirve (negocio)

Rechazar el pedido (FAR-E2). Dentro del módulo (descripción del modelo, en inglés): «Prevents overselling and untraceable adjustments under concurrent manual, API, dispensing and receiving operations.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_25_pharmacy_inventory.puml:20`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`POST /pharmacy/orders/{id}/reject` la atiende `PharmacyOrdersController.reject` (src/modules/pharmacy_inventory/presentation/controllers/pharmacy-orders.controller.ts:294). Exige sesión con alguno de los roles SECURITY_ADMIN, PHARMACY_STAFF. Valida el cuerpo como `RejectPharmacyOrderDto` (1 campo, 1 obligatorio). Delega en `PharmacyOrdersService.reject`. Crea filas en messaging.domain_events, messaging.in_app_notifications, messaging.notification_deliveries, messaging.notification_requests, messaging.outbox_messages, pharmacy_inventory.inventory_ledger_entries. Actualiza iam.devices, pharmacy_inventory.inventory_reservation_lines, pharmacy_inventory.inventory_reservations, pharmacy_inventory.inventory_stock_positions. Lee clinical.medication_requests, common.addresses, community.public_profiles, directory.tenants, iam.devices, messaging.in_app_notifications, messaging.message_channels, messaging.messaging_providers y 16 más. Publica un evento calculado (null).

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PHARMACY_STAFF | `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-orders.controller.ts:294` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-orders.controller.ts:294` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.medication_requests` | LEE | LEE | DIRECTA | PharmacyOrdersController.reject → PharmacyOrdersService.reject → PharmacyOrdersUseCases.reject → PharmacyOrdersUseCases.readOrderForTenant → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findPrescriberProfileIdsByRequestIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:307` |
| `common.addresses` | LEE | LEE | DIRECTA | PharmacyOrdersController.reject → PharmacyOrdersService.reject → PharmacyOrdersUseCases.reject → PharmacyOrdersUseCases.readOrderForTenant → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findAddressesByIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:361` |
| `community.public_profiles` | LEE | LEE | DIRECTA | PharmacyOrdersController.reject → PharmacyOrdersService.reject → PharmacyOrdersUseCases.reject → PharmacyOrdersUseCases.readOrderForTenant → PharmacyOrdersUseCases.composeOrders → CommunityPharmacyOrderChatAdapter.findPharmacyShowcases → CommunityOrderChatService.findOrganizationShowcases → PublicProfilesRepository.listByIds | `src/modules/community/repositories/public-profiles.repository.ts:135` |
| `directory.tenants` | LEE | LEE | DIRECTA | PharmacyOrdersController.reject → PharmacyOrdersService.reject → PharmacyOrdersUseCases.reject → PharmacyOrdersUseCases.readOrderForTenant → PharmacyOrdersUseCases.composeOrders → CommunityPharmacyOrderChatAdapter.findPharmacyShowcases → CommunityOrderChatService.findOrganizationShowcases → CommunityOrganizationStaffService.verifiedActiveTenantIds | `src/modules/community/services/community-organization-staff.service.ts:283` |
| `iam.devices` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyOrdersController.reject → PharmacyOrdersService.reject → PharmacyOrdersUseCases.reject → PharmacyOrderNotificationsService.orderRejected → NotifyPharmacyOrderUseCase.orderRejected → NotifyPharmacyOrderUseCase.emitToPatient → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → WebPushService.pushToUser → WebPushService.sendTo → WebPushService.forget | `src/modules/messaging/services/web-push.service.ts:235` |
| `iam.devices` | LEE | LEE | DIRECTA | PharmacyOrdersController.reject → PharmacyOrdersService.reject → PharmacyOrdersUseCases.reject → PharmacyOrderNotificationsService.orderRejected → NotifyPharmacyOrderUseCase.orderRejected → NotifyPharmacyOrderUseCase.emitToPatient → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → WebPushService.pushToUser | `src/modules/messaging/services/web-push.service.ts:172` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.reject → PharmacyOrdersService.reject → PharmacyOrdersUseCases.reject → PharmacyOrdersUseCases.publishStaffEvent → MessagingDomainEventAdapter.publish → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.in_app_notifications` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.reject → PharmacyOrdersService.reject → PharmacyOrdersUseCases.reject → PharmacyOrderNotificationsService.orderRejected → NotifyPharmacyOrderUseCase.orderRejected → NotifyPharmacyOrderUseCase.emitToPatient → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createInAppNotification | `src/modules/messaging/repositories/notifications.repository.ts:710` |
| `messaging.in_app_notifications` | LEE | LEE | DIRECTA | PharmacyOrdersController.reject → PharmacyOrdersService.reject → PharmacyOrdersUseCases.reject → PharmacyOrderNotificationsService.orderRejected → NotifyPharmacyOrderUseCase.orderRejected → NotifyPharmacyOrderUseCase.emitToPatient → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findUnreadInAppForResource | `src/modules/messaging/repositories/notifications.repository.ts:845` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | PharmacyOrdersController.reject → PharmacyOrdersService.reject → PharmacyOrdersUseCases.reject → PharmacyOrderNotificationsService.orderRejected → NotifyPharmacyOrderUseCase.orderRejected → NotifyPharmacyOrderUseCase.emitToPatient → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findActiveChannelByType | `src/modules/messaging/repositories/notifications.repository.ts:189` |
| `messaging.messaging_providers` | LEE | LEE | DIRECTA | PharmacyOrdersController.reject → PharmacyOrdersService.reject → PharmacyOrdersUseCases.reject → PharmacyOrderNotificationsService.orderRejected → NotifyPharmacyOrderUseCase.orderRejected → NotifyPharmacyOrderUseCase.emitToPatient → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findProviderById | `src/modules/messaging/repositories/notifications.repository.ts:437` |
| `messaging.notification_deliveries` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.reject → PharmacyOrdersService.reject → PharmacyOrdersUseCases.reject → PharmacyOrderNotificationsService.orderRejected → NotifyPharmacyOrderUseCase.orderRejected → NotifyPharmacyOrderUseCase.emitToPatient → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createDelivery | `src/modules/messaging/repositories/notifications.repository.ts:514` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.reject → PharmacyOrdersService.reject → PharmacyOrdersUseCases.reject → PharmacyOrderNotificationsService.orderRejected → NotifyPharmacyOrderUseCase.orderRejected → NotifyPharmacyOrderUseCase.emitToPatient → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.reject → PharmacyOrdersService.reject → PharmacyOrdersUseCases.reject → PharmacyOrdersUseCases.publishStaffEvent → MessagingDomainEventAdapter.publish → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | PharmacyOrdersController.reject → PharmacyOrdersService.reject → PharmacyOrdersUseCases.reject → PharmacyOrdersUseCases.publishStaffEvent → MessagingDomainEventAdapter.publish → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |
| `messaging.provider_channel_configs` | LEE | LEE | DIRECTA | PharmacyOrdersController.reject → PharmacyOrdersService.reject → PharmacyOrdersUseCases.reject → PharmacyOrderNotificationsService.orderRejected → NotifyPharmacyOrderUseCase.orderRejected → NotifyPharmacyOrderUseCase.emitToPatient → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findChannelConfigs | `src/modules/messaging/repositories/notifications.repository.ts:405` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | PharmacyOrdersController.reject → PharmacyOrdersService.reject → PharmacyOrdersUseCases.reject → PharmacyOrderNotificationsService.orderRejected → NotifyPharmacyOrderUseCase.orderRejected → NotifyPharmacyOrderUseCase.emitToPatient → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `pharmacy_inventory.inventory_ledger_entries` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.reject → PharmacyOrdersService.reject → PharmacyOrdersUseCases.reject → InventoryReservationsService.releaseConfirmedLines → ReleaseConfirmedReservationLinesUseCase.execute → LedgerRepository.append | `src/modules/pharmacy_inventory/infrastructure/repositories/ledger.repository.ts:142` |
| `pharmacy_inventory.inventory_ledger_entries` | LEE | LEE | POR_SQL | PharmacyOrdersController.reject → PharmacyOrdersService.reject → PharmacyOrdersUseCases.reject → InventoryReservationsService.releaseConfirmedLines → ReleaseConfirmedReservationLinesUseCase.execute → LedgerRepository.nextSequence | `src/modules/pharmacy_inventory/infrastructure/repositories/ledger.repository.ts:113` |
| `pharmacy_inventory.inventory_reservation_lines` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyOrdersController.reject → PharmacyOrdersService.reject → PharmacyOrdersUseCases.reject → InventoryReservationsService.releaseConfirmedLines → ReleaseConfirmedReservationLinesUseCase.execute | `src/modules/pharmacy_inventory/application/inventory-reservations/release-confirmed-reservation-lines.use-case.ts:44` |
| `pharmacy_inventory.inventory_reservation_lines` | LEE | LEE | DIRECTA | PharmacyOrdersController.reject → PharmacyOrdersService.reject → PharmacyOrdersUseCases.reject → InventoryReservationsService.releaseConfirmedLines → ReleaseConfirmedReservationLinesUseCase.execute → ReservationsRepository.findLinesByReservation | `src/modules/pharmacy_inventory/infrastructure/repositories/reservations.repository.ts:142` |
| `pharmacy_inventory.inventory_reservations` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyOrdersController.reject → PharmacyOrdersService.reject → PharmacyOrdersUseCases.reject | `src/modules/pharmacy_inventory/application/pharmacy-orders/pharmacy-orders.use-cases.ts:1233` |
| `pharmacy_inventory.inventory_reservations` | LEE | LEE | DIRECTA | PharmacyOrdersController.reject → PharmacyOrdersService.reject → PharmacyOrdersUseCases.reject → PharmacyOrdersUseCases.loadTenantOrderForUpdate → PharmacyOrdersRepository.findOrderByIdForUpdate | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:61` |
| `pharmacy_inventory.inventory_stock_positions` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyOrdersController.reject → PharmacyOrdersService.reject → PharmacyOrdersUseCases.reject → InventoryReservationsService.releaseConfirmedLines → ReleaseConfirmedReservationLinesUseCase.execute | `src/modules/pharmacy_inventory/application/inventory-reservations/release-confirmed-reservation-lines.use-case.ts:72` |
| `pharmacy_inventory.inventory_stock_positions` | LEE | LEE | DIRECTA | PharmacyOrdersController.reject → PharmacyOrdersService.reject → PharmacyOrdersUseCases.reject → InventoryReservationsService.releaseConfirmedLines → ReleaseConfirmedReservationLinesUseCase.execute → StockPositionsRepository.findByKeyForUpdate | `src/modules/pharmacy_inventory/infrastructure/repositories/stock-positions.repository.ts:82` |
| `pharmacy_inventory.pharmacy_order_substitutions` | LEE | LEE | DIRECTA | PharmacyOrdersController.reject → PharmacyOrdersService.reject → PharmacyOrdersUseCases.reject → PharmacyOrdersUseCases.readOrderForTenant → PharmacyOrdersUseCases.composeOrders → PharmacyOrderSubstitutionsRepository.findByReservationIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-order-substitutions.repository.ts:62` |
| `pharmacy.pharmacies` | LEE | LEE | DIRECTA | PharmacyOrdersController.reject → PharmacyOrdersService.reject → PharmacyOrdersUseCases.reject → PharmacyOrdersUseCases.loadTenantOrderForUpdate → PharmacyOrdersRepository.findPharmaciesByIdsInTenant | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:235` |
| `pharmacy.pharmacy_products` | LEE | LEE | DIRECTA | PharmacyOrdersController.reject → PharmacyOrdersService.reject → PharmacyOrdersUseCases.reject → PharmacyOrdersUseCases.readOrderForTenant → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findProductsByIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:256` |
| `pharmacy.pharmacy_sites` | LEE | LEE | DIRECTA | PharmacyOrdersController.reject → PharmacyOrdersService.reject → PharmacyOrdersUseCases.reject → PharmacyOrdersUseCases.readOrderForTenant → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findSitesByIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:247` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | PharmacyOrdersController.reject → PharmacyOrdersService.reject → PharmacyOrdersUseCases.reject → PharmacyOrderNotificationsService.orderRejected → NotifyPharmacyOrderUseCase.orderRejected → NotifyPharmacyOrderUseCase.emitToPatient → NotifyPharmacyOrderUseCase.emitToPerson → ProfilesPersonAccountLinksAdapter.findActiveByPerson → PersonAccountLinksRepository.findActiveByPerson | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:101` |
| `profiles.person_profiles` | LEE | LEE | DIRECTA | PharmacyOrdersController.reject → PharmacyOrdersService.reject → PharmacyOrdersUseCases.reject → PharmacyOrdersUseCases.readOrderForTenant → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findPersonNamesByProfileIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:143` |
| `profiles.persons` | LEE | LEE | DIRECTA | PharmacyOrdersController.reject → PharmacyOrdersService.reject → PharmacyOrdersUseCases.reject → PharmacyOrdersUseCases.readOrderForTenant → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findPersonNamesByProfileIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:135` |
| `profiles.practitioner_specialties` | LEE | LEE | DIRECTA | PharmacyOrdersController.reject → PharmacyOrdersService.reject → PharmacyOrdersUseCases.reject → PharmacyOrdersUseCases.readOrderForTenant → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findPrimarySpecialtyConceptIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:331` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | PharmacyOrdersController.reject → PharmacyOrdersService.reject → PharmacyOrdersUseCases.reject → PharmacyOrdersUseCases.readOrderForTenant → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findConceptsByIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:370` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | calculado: `null` | `src/modules/pharmacy_inventory/infrastructure/adapters/messaging-domain-event.adapter.ts:16` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `RejectPharmacyOrderDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reason` | `string` | Sí | longitud mínima 1; longitud máxima 500 | `@IsString()` `@IsNotEmpty()` `@MaxLength(500)` | Motivo del rechazo (se persiste en el pedido) | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:551` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "reason": "Texto descriptivo de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "reason": "Texto descriptivo de ejemplo"
}
```

</details>

### Respuesta — `Promise<PharmacyOrderDto>` · DTO `PharmacyOrderDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reservationLines` | `array<PharmacyOrderReservationLineDto>` | Sí | — | — | Porciones confirmadas o entregadas vigentes para facturación | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:253` |
| `reservationLines[].id` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:212` |
| `reservationLines[].productId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:215` |
| `reservationLines[].quantity` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:218` |
| `reservationLines[].unitPriceAmount` | `string` | Sí | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:221` |
| `reservationLines[].billedAmount` | `string` | Sí | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:224` |
| `reservationLines[].currencyConceptId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:227` |
| `insuranceSettlement` | `PatientInsuranceSettlementDto` | Sí | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:256` |
| `insuranceSettlement.claimId` | `string` | Sí | formato uuid | — | — | sin fuente |
| `insuranceSettlement.claimIdentifier` | `string` | Sí | — | — | — | sin fuente |
| `insuranceSettlement.adjudicationVersionId` | `string` | Sí | formato uuid | — | — | sin fuente |
| `insuranceSettlement.adjudicationVersion` | `number` | Sí | formato int32; mínimo 1 | — | — | sin fuente |
| `insuranceSettlement.eobId` | `string` | Sí | formato uuid | — | — | sin fuente |
| `insuranceSettlement.carrierName` | `string` | Sí | — | — | — | sin fuente |
| `insuranceSettlement.policyIdentifier` | `string` | Sí | admite null | — | — | sin fuente |
| `insuranceSettlement.totalBilledAmount` | `string` | Sí | — | — | Total facturado, decimal exacto | sin fuente |
| `insuranceSettlement.totalApprovedAmount` | `string` | Sí | — | — | Aporte del seguro, decimal exacto | sin fuente |
| `insuranceSettlement.totalPatientAmount` | `string` | Sí | — | — | Cargo confirmado al paciente, decimal exacto | sin fuente |
| `insuranceSettlement.totalDeniedAmount` | `string` | Sí | — | — | Importe excluido sin asignar, decimal exacto | sin fuente |
| `insuranceSettlement.currencyCode` | `string` | Sí | — | — | — | sin fuente |
| `insuranceSettlement.result` | `string` | Sí | valores: APPROVED, PARTIALLY_APPROVED, DENIED | — | — | sin fuente |
| `insuranceSettlement.exclusions` | `array<PatientInsuranceSettlementExclusionDto>` | Sí | — | — | — | sin fuente |
| `insuranceSettlement.exclusions[].claimLineId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/patient-settlement.dto.ts:9` |
| `insuranceSettlement.exclusions[].itemId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/patient-settlement.dto.ts:12` |
| `insuranceSettlement.exclusions[].itemName` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/patient-settlement.dto.ts:15` |
| `insuranceSettlement.exclusions[].amount` | `string` | Sí | — | — | Importe decimal exacto excluido | `src/modules/pharmacy_inventory/presentation/dto/patient-settlement.dto.ts:18` |
| `insuranceSettlement.exclusions[].policyClauseReference` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/patient-settlement.dto.ts:21` |
| `insuranceSettlement.exclusions[].denialRationale` | `string` | Sí | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/patient-settlement.dto.ts:24` |
| `insuranceSettlementAvailability` | `string` | Sí | valores: AVAILABLE, PENDING_PUBLICATION, UNDER_REVIEW, NOT_AVAILABLE | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:261` |
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:267` |
| `status` | `InventoryConceptDto` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:273` |
| `status.code` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:17` |
| `status.display` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:23` |
| `createdAt` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:279` |
| `expiresAt` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:286` |
| `siteId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:292` |
| `siteName` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:298` |
| `pharmacyId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:304` |
| `pharmacyName` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:310` |
| `medicationRequestId` | `string` | No | formato uuid; admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:316` |
| `prescriber` | `PharmacyOrderPrescriberDto` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:328` |
| `prescriber.name` | `string` | No | admite null | — | — | sin fuente |
| `prescriber.specialty` | `string` | No | admite null | — | — | sin fuente |
| `patientName` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:336` |
| `deliveryMode` | `InventoryConceptDto` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:343` |
| `deliveryMode.code` | `string` | No | — | — | — | sin fuente |
| `deliveryMode.display` | `string` | No | — | — | — | sin fuente |
| `deliveryAddressText` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:351` |
| `pickupCode` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:362` |
| `pharmacyPublicProfileId` | `string` | No | formato uuid; admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:373` |
| `pharmacyPublicSlug` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:380` |
| `totalAmount` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:391` |
| `currency` | `InventoryConceptDto` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:397` |
| `currency.code` | `string` | No | — | — | — | sin fuente |
| `currency.display` | `string` | No | — | — | — | sin fuente |
| `rejectionReasonText` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:404` |
| `substitutions` | `array<PharmacyOrderSubstitutionDto>` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:412` |
| `substitutions[].id` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:427` |
| `substitutions[].originalProductId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:433` |
| `substitutions[].originalName` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:439` |
| `substitutions[].originalUnitPriceAmount` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:445` |
| `substitutions[].proposedProductId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:451` |
| `substitutions[].proposedName` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:457` |
| `substitutions[].proposedUnitPriceAmount` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:463` |
| `substitutions[].currency` | `InventoryConceptDto` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:469` |
| `substitutions[].currency.code` | `string` | No | — | — | — | sin fuente |
| `substitutions[].currency.display` | `string` | No | — | — | — | sin fuente |
| `substitutions[].status` | `InventoryConceptDto` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:475` |
| `substitutions[].status.code` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:17` |
| `substitutions[].status.display` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:23` |
| `substitutions[].decidedAt` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:481` |
| `lines` | `array<PharmacyOrderLineDto>` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:418` |
| `lines[].productId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:123` |
| `lines[].medicationConceptId` | `string` | No | formato uuid; admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:129` |
| `lines[].productCode` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:135` |
| `lines[].brandName` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:141` |
| `lines[].genericName` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:147` |
| `lines[].strengthText` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:153` |
| `lines[].packageSizeText` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:159` |
| `lines[].medication` | `InventoryConceptDto` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:165` |
| `lines[].medication.code` | `string` | No | — | — | — | sin fuente |
| `lines[].medication.display` | `string` | No | — | — | — | sin fuente |
| `lines[].requestedQuantity` | `number` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:171` |
| `lines[].reservedQuantity` | `number` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:177` |
| `lines[].fulfilledQuantity` | `number` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:184` |
| `lines[].unitPriceAmount` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:193` |
| `lines[].currency` | `InventoryConceptDto` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:199` |
| `lines[].currency.code` | `string` | No | — | — | — | sin fuente |
| `lines[].currency.display` | `string` | No | — | — | — | sin fuente |
| `lines[].status` | `InventoryConceptDto` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:206` |
| `lines[].status.code` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:17` |
| `lines[].status.display` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:23` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El rechazo exige un motivo en palabras; PreconditionFailedException: La transición no es legal para el estado actual del pedido |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharmacy_inventory.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / pharmacy inventory — etapa `ctrl:PharmacyOrdersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 27. POST /pharmacy/orders/{id}/review

- **Origen:** CONTRATO
- **Nombre:** Abrir revisión del pedido (FAR-E2)
- **Bloque:** Farmacia
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyOrdersController.openReview` — `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-orders.controller.ts:203`

### Qué es y para qué sirve (negocio)

Abrir revisión del pedido (FAR-E2). Dentro del módulo (descripción del modelo, en inglés): «Prevents overselling and untraceable adjustments under concurrent manual, API, dispensing and receiving operations.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_25_pharmacy_inventory.puml:20`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`POST /pharmacy/orders/{id}/review` la atiende `PharmacyOrdersController.openReview` (src/modules/pharmacy_inventory/presentation/controllers/pharmacy-orders.controller.ts:203). Exige sesión con alguno de los roles SECURITY_ADMIN, PHARMACY_STAFF. Delega en `PharmacyOrdersService.openReview`. Crea filas en messaging.domain_events, messaging.in_app_notifications, messaging.notification_deliveries, messaging.notification_requests, messaging.outbox_messages. Actualiza iam.devices, pharmacy_inventory.inventory_reservations. Lee clinical.medication_requests, common.addresses, community.public_profiles, directory.tenants, iam.devices, messaging.in_app_notifications, messaging.message_channels, messaging.messaging_providers y 14 más. Publica un evento calculado (null).

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PHARMACY_STAFF | `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-orders.controller.ts:203` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-orders.controller.ts:203` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.medication_requests` | LEE | LEE | DIRECTA | PharmacyOrdersController.openReview → PharmacyOrdersService.openReview → PharmacyOrdersUseCases.openReview → PharmacyOrdersUseCases.readOrderForTenant → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findPrescriberProfileIdsByRequestIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:307` |
| `common.addresses` | LEE | LEE | DIRECTA | PharmacyOrdersController.openReview → PharmacyOrdersService.openReview → PharmacyOrdersUseCases.openReview → PharmacyOrdersUseCases.readOrderForTenant → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findAddressesByIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:361` |
| `community.public_profiles` | LEE | LEE | DIRECTA | PharmacyOrdersController.openReview → PharmacyOrdersService.openReview → PharmacyOrdersUseCases.openReview → PharmacyOrdersUseCases.readOrderForTenant → PharmacyOrdersUseCases.composeOrders → CommunityPharmacyOrderChatAdapter.findPharmacyShowcases → CommunityOrderChatService.findOrganizationShowcases → PublicProfilesRepository.listByIds | `src/modules/community/repositories/public-profiles.repository.ts:135` |
| `directory.tenants` | LEE | LEE | DIRECTA | PharmacyOrdersController.openReview → PharmacyOrdersService.openReview → PharmacyOrdersUseCases.openReview → PharmacyOrdersUseCases.readOrderForTenant → PharmacyOrdersUseCases.composeOrders → CommunityPharmacyOrderChatAdapter.findPharmacyShowcases → CommunityOrderChatService.findOrganizationShowcases → CommunityOrganizationStaffService.verifiedActiveTenantIds | `src/modules/community/services/community-organization-staff.service.ts:283` |
| `iam.devices` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyOrdersController.openReview → PharmacyOrdersService.openReview → PharmacyOrdersUseCases.openReview → PharmacyOrderNotificationsService.orderUnderReview → NotifyPharmacyOrderUseCase.orderUnderReview → NotifyPharmacyOrderUseCase.emitToPatient → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → WebPushService.pushToUser → WebPushService.sendTo → WebPushService.forget | `src/modules/messaging/services/web-push.service.ts:235` |
| `iam.devices` | LEE | LEE | DIRECTA | PharmacyOrdersController.openReview → PharmacyOrdersService.openReview → PharmacyOrdersUseCases.openReview → PharmacyOrderNotificationsService.orderUnderReview → NotifyPharmacyOrderUseCase.orderUnderReview → NotifyPharmacyOrderUseCase.emitToPatient → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → WebPushService.pushToUser | `src/modules/messaging/services/web-push.service.ts:172` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.openReview → PharmacyOrdersService.openReview → PharmacyOrdersUseCases.openReview → PharmacyOrdersUseCases.publishStaffEvent → MessagingDomainEventAdapter.publish → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.in_app_notifications` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.openReview → PharmacyOrdersService.openReview → PharmacyOrdersUseCases.openReview → PharmacyOrderNotificationsService.orderUnderReview → NotifyPharmacyOrderUseCase.orderUnderReview → NotifyPharmacyOrderUseCase.emitToPatient → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createInAppNotification | `src/modules/messaging/repositories/notifications.repository.ts:710` |
| `messaging.in_app_notifications` | LEE | LEE | DIRECTA | PharmacyOrdersController.openReview → PharmacyOrdersService.openReview → PharmacyOrdersUseCases.openReview → PharmacyOrderNotificationsService.orderUnderReview → NotifyPharmacyOrderUseCase.orderUnderReview → NotifyPharmacyOrderUseCase.emitToPatient → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findUnreadInAppForResource | `src/modules/messaging/repositories/notifications.repository.ts:845` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | PharmacyOrdersController.openReview → PharmacyOrdersService.openReview → PharmacyOrdersUseCases.openReview → PharmacyOrderNotificationsService.orderUnderReview → NotifyPharmacyOrderUseCase.orderUnderReview → NotifyPharmacyOrderUseCase.emitToPatient → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findActiveChannelByType | `src/modules/messaging/repositories/notifications.repository.ts:189` |
| `messaging.messaging_providers` | LEE | LEE | DIRECTA | PharmacyOrdersController.openReview → PharmacyOrdersService.openReview → PharmacyOrdersUseCases.openReview → PharmacyOrderNotificationsService.orderUnderReview → NotifyPharmacyOrderUseCase.orderUnderReview → NotifyPharmacyOrderUseCase.emitToPatient → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findProviderById | `src/modules/messaging/repositories/notifications.repository.ts:437` |
| `messaging.notification_deliveries` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.openReview → PharmacyOrdersService.openReview → PharmacyOrdersUseCases.openReview → PharmacyOrderNotificationsService.orderUnderReview → NotifyPharmacyOrderUseCase.orderUnderReview → NotifyPharmacyOrderUseCase.emitToPatient → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createDelivery | `src/modules/messaging/repositories/notifications.repository.ts:514` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.openReview → PharmacyOrdersService.openReview → PharmacyOrdersUseCases.openReview → PharmacyOrderNotificationsService.orderUnderReview → NotifyPharmacyOrderUseCase.orderUnderReview → NotifyPharmacyOrderUseCase.emitToPatient → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.openReview → PharmacyOrdersService.openReview → PharmacyOrdersUseCases.openReview → PharmacyOrdersUseCases.publishStaffEvent → MessagingDomainEventAdapter.publish → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | PharmacyOrdersController.openReview → PharmacyOrdersService.openReview → PharmacyOrdersUseCases.openReview → PharmacyOrdersUseCases.publishStaffEvent → MessagingDomainEventAdapter.publish → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |
| `messaging.provider_channel_configs` | LEE | LEE | DIRECTA | PharmacyOrdersController.openReview → PharmacyOrdersService.openReview → PharmacyOrdersUseCases.openReview → PharmacyOrderNotificationsService.orderUnderReview → NotifyPharmacyOrderUseCase.orderUnderReview → NotifyPharmacyOrderUseCase.emitToPatient → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findChannelConfigs | `src/modules/messaging/repositories/notifications.repository.ts:405` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | PharmacyOrdersController.openReview → PharmacyOrdersService.openReview → PharmacyOrdersUseCases.openReview → PharmacyOrderNotificationsService.orderUnderReview → NotifyPharmacyOrderUseCase.orderUnderReview → NotifyPharmacyOrderUseCase.emitToPatient → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `pharmacy_inventory.inventory_reservation_lines` | LEE | LEE | DIRECTA | PharmacyOrdersController.openReview → PharmacyOrdersService.openReview → PharmacyOrdersUseCases.openReview → PharmacyOrdersUseCases.readOrderForTenant → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findLinesByReservationIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:220` |
| `pharmacy_inventory.inventory_reservations` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyOrdersController.openReview → PharmacyOrdersService.openReview → PharmacyOrdersUseCases.openReview | `src/modules/pharmacy_inventory/application/pharmacy-orders/pharmacy-orders.use-cases.ts:853` |
| `pharmacy_inventory.inventory_reservations` | LEE | LEE | DIRECTA | PharmacyOrdersController.openReview → PharmacyOrdersService.openReview → PharmacyOrdersUseCases.openReview → PharmacyOrdersUseCases.loadTenantOrderForUpdate → PharmacyOrdersRepository.findOrderByIdForUpdate | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:61` |
| `pharmacy_inventory.pharmacy_order_substitutions` | LEE | LEE | DIRECTA | PharmacyOrdersController.openReview → PharmacyOrdersService.openReview → PharmacyOrdersUseCases.openReview → PharmacyOrdersUseCases.readOrderForTenant → PharmacyOrdersUseCases.composeOrders → PharmacyOrderSubstitutionsRepository.findByReservationIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-order-substitutions.repository.ts:62` |
| `pharmacy.pharmacies` | LEE | LEE | DIRECTA | PharmacyOrdersController.openReview → PharmacyOrdersService.openReview → PharmacyOrdersUseCases.openReview → PharmacyOrdersUseCases.loadTenantOrderForUpdate → PharmacyOrdersRepository.findPharmaciesByIdsInTenant | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:235` |
| `pharmacy.pharmacy_products` | LEE | LEE | DIRECTA | PharmacyOrdersController.openReview → PharmacyOrdersService.openReview → PharmacyOrdersUseCases.openReview → PharmacyOrdersUseCases.readOrderForTenant → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findProductsByIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:256` |
| `pharmacy.pharmacy_sites` | LEE | LEE | DIRECTA | PharmacyOrdersController.openReview → PharmacyOrdersService.openReview → PharmacyOrdersUseCases.openReview → PharmacyOrdersUseCases.readOrderForTenant → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findSitesByIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:247` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | PharmacyOrdersController.openReview → PharmacyOrdersService.openReview → PharmacyOrdersUseCases.openReview → PharmacyOrderNotificationsService.orderUnderReview → NotifyPharmacyOrderUseCase.orderUnderReview → NotifyPharmacyOrderUseCase.emitToPatient → NotifyPharmacyOrderUseCase.emitToPerson → ProfilesPersonAccountLinksAdapter.findActiveByPerson → PersonAccountLinksRepository.findActiveByPerson | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:101` |
| `profiles.person_profiles` | LEE | LEE | DIRECTA | PharmacyOrdersController.openReview → PharmacyOrdersService.openReview → PharmacyOrdersUseCases.openReview → PharmacyOrdersUseCases.readOrderForTenant → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findPersonNamesByProfileIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:143` |
| `profiles.persons` | LEE | LEE | DIRECTA | PharmacyOrdersController.openReview → PharmacyOrdersService.openReview → PharmacyOrdersUseCases.openReview → PharmacyOrdersUseCases.readOrderForTenant → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findPersonNamesByProfileIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:135` |
| `profiles.practitioner_specialties` | LEE | LEE | DIRECTA | PharmacyOrdersController.openReview → PharmacyOrdersService.openReview → PharmacyOrdersUseCases.openReview → PharmacyOrdersUseCases.readOrderForTenant → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findPrimarySpecialtyConceptIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:331` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | PharmacyOrdersController.openReview → PharmacyOrdersService.openReview → PharmacyOrdersUseCases.openReview → PharmacyOrdersUseCases.readOrderForTenant → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findConceptsByIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:370` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | calculado: `null` | `src/modules/pharmacy_inventory/infrastructure/adapters/messaging-domain-event.adapter.ts:16` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PharmacyOrderDto>` · DTO `PharmacyOrderDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reservationLines` | `array<PharmacyOrderReservationLineDto>` | Sí | — | — | Porciones confirmadas o entregadas vigentes para facturación | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:253` |
| `reservationLines[].id` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:212` |
| `reservationLines[].productId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:215` |
| `reservationLines[].quantity` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:218` |
| `reservationLines[].unitPriceAmount` | `string` | Sí | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:221` |
| `reservationLines[].billedAmount` | `string` | Sí | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:224` |
| `reservationLines[].currencyConceptId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:227` |
| `insuranceSettlement` | `PatientInsuranceSettlementDto` | Sí | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:256` |
| `insuranceSettlement.claimId` | `string` | Sí | formato uuid | — | — | sin fuente |
| `insuranceSettlement.claimIdentifier` | `string` | Sí | — | — | — | sin fuente |
| `insuranceSettlement.adjudicationVersionId` | `string` | Sí | formato uuid | — | — | sin fuente |
| `insuranceSettlement.adjudicationVersion` | `number` | Sí | formato int32; mínimo 1 | — | — | sin fuente |
| `insuranceSettlement.eobId` | `string` | Sí | formato uuid | — | — | sin fuente |
| `insuranceSettlement.carrierName` | `string` | Sí | — | — | — | sin fuente |
| `insuranceSettlement.policyIdentifier` | `string` | Sí | admite null | — | — | sin fuente |
| `insuranceSettlement.totalBilledAmount` | `string` | Sí | — | — | Total facturado, decimal exacto | sin fuente |
| `insuranceSettlement.totalApprovedAmount` | `string` | Sí | — | — | Aporte del seguro, decimal exacto | sin fuente |
| `insuranceSettlement.totalPatientAmount` | `string` | Sí | — | — | Cargo confirmado al paciente, decimal exacto | sin fuente |
| `insuranceSettlement.totalDeniedAmount` | `string` | Sí | — | — | Importe excluido sin asignar, decimal exacto | sin fuente |
| `insuranceSettlement.currencyCode` | `string` | Sí | — | — | — | sin fuente |
| `insuranceSettlement.result` | `string` | Sí | valores: APPROVED, PARTIALLY_APPROVED, DENIED | — | — | sin fuente |
| `insuranceSettlement.exclusions` | `array<PatientInsuranceSettlementExclusionDto>` | Sí | — | — | — | sin fuente |
| `insuranceSettlement.exclusions[].claimLineId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/patient-settlement.dto.ts:9` |
| `insuranceSettlement.exclusions[].itemId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/patient-settlement.dto.ts:12` |
| `insuranceSettlement.exclusions[].itemName` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/patient-settlement.dto.ts:15` |
| `insuranceSettlement.exclusions[].amount` | `string` | Sí | — | — | Importe decimal exacto excluido | `src/modules/pharmacy_inventory/presentation/dto/patient-settlement.dto.ts:18` |
| `insuranceSettlement.exclusions[].policyClauseReference` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/patient-settlement.dto.ts:21` |
| `insuranceSettlement.exclusions[].denialRationale` | `string` | Sí | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/patient-settlement.dto.ts:24` |
| `insuranceSettlementAvailability` | `string` | Sí | valores: AVAILABLE, PENDING_PUBLICATION, UNDER_REVIEW, NOT_AVAILABLE | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:261` |
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:267` |
| `status` | `InventoryConceptDto` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:273` |
| `status.code` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:17` |
| `status.display` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:23` |
| `createdAt` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:279` |
| `expiresAt` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:286` |
| `siteId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:292` |
| `siteName` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:298` |
| `pharmacyId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:304` |
| `pharmacyName` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:310` |
| `medicationRequestId` | `string` | No | formato uuid; admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:316` |
| `prescriber` | `PharmacyOrderPrescriberDto` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:328` |
| `prescriber.name` | `string` | No | admite null | — | — | sin fuente |
| `prescriber.specialty` | `string` | No | admite null | — | — | sin fuente |
| `patientName` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:336` |
| `deliveryMode` | `InventoryConceptDto` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:343` |
| `deliveryMode.code` | `string` | No | — | — | — | sin fuente |
| `deliveryMode.display` | `string` | No | — | — | — | sin fuente |
| `deliveryAddressText` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:351` |
| `pickupCode` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:362` |
| `pharmacyPublicProfileId` | `string` | No | formato uuid; admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:373` |
| `pharmacyPublicSlug` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:380` |
| `totalAmount` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:391` |
| `currency` | `InventoryConceptDto` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:397` |
| `currency.code` | `string` | No | — | — | — | sin fuente |
| `currency.display` | `string` | No | — | — | — | sin fuente |
| `rejectionReasonText` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:404` |
| `substitutions` | `array<PharmacyOrderSubstitutionDto>` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:412` |
| `substitutions[].id` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:427` |
| `substitutions[].originalProductId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:433` |
| `substitutions[].originalName` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:439` |
| `substitutions[].originalUnitPriceAmount` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:445` |
| `substitutions[].proposedProductId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:451` |
| `substitutions[].proposedName` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:457` |
| `substitutions[].proposedUnitPriceAmount` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:463` |
| `substitutions[].currency` | `InventoryConceptDto` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:469` |
| `substitutions[].currency.code` | `string` | No | — | — | — | sin fuente |
| `substitutions[].currency.display` | `string` | No | — | — | — | sin fuente |
| `substitutions[].status` | `InventoryConceptDto` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:475` |
| `substitutions[].status.code` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:17` |
| `substitutions[].status.display` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:23` |
| `substitutions[].decidedAt` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:481` |
| `lines` | `array<PharmacyOrderLineDto>` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:418` |
| `lines[].productId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:123` |
| `lines[].medicationConceptId` | `string` | No | formato uuid; admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:129` |
| `lines[].productCode` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:135` |
| `lines[].brandName` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:141` |
| `lines[].genericName` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:147` |
| `lines[].strengthText` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:153` |
| `lines[].packageSizeText` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:159` |
| `lines[].medication` | `InventoryConceptDto` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:165` |
| `lines[].medication.code` | `string` | No | — | — | — | sin fuente |
| `lines[].medication.display` | `string` | No | — | — | — | sin fuente |
| `lines[].requestedQuantity` | `number` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:171` |
| `lines[].reservedQuantity` | `number` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:177` |
| `lines[].fulfilledQuantity` | `number` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:184` |
| `lines[].unitPriceAmount` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:193` |
| `lines[].currency` | `InventoryConceptDto` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:199` |
| `lines[].currency.code` | `string` | No | — | — | — | sin fuente |
| `lines[].currency.display` | `string` | No | — | — | — | sin fuente |
| `lines[].status` | `InventoryConceptDto` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:206` |
| `lines[].status.code` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:17` |
| `lines[].status.display` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:23` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La transición no es legal para el estado actual del pedido |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharmacy_inventory.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / pharmacy inventory — etapa `ctrl:PharmacyOrdersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 28. GET /pharmacy/orders/me

- **Origen:** CONTRATO
- **Nombre:** Mis pedidos de farmacia, más nuevos primero (FAR-E1)
- **Bloque:** Farmacia
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyOrdersController.listMine` — `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-orders.controller.ts:119`

### Qué es y para qué sirve (negocio)

Mis pedidos de farmacia, más nuevos primero (FAR-E1). Dentro del módulo (descripción del modelo, en inglés): «Prevents overselling and untraceable adjustments under concurrent manual, API, dispensing and receiving operations.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_25_pharmacy_inventory.puml:20`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`GET /pharmacy/orders/me` la atiende `PharmacyOrdersController.listMine` (src/modules/pharmacy_inventory/presentation/controllers/pharmacy-orders.controller.ts:119). Exige sesión con alguno de los roles PATIENT. Delega en `PharmacyOrdersService.listMine`. Crea filas en messaging.domain_events, messaging.in_app_notifications, messaging.notification_deliveries, messaging.notification_requests, messaging.outbox_messages, pharmacy_inventory.inventory_ledger_entries. Actualiza iam.devices, pharmacy_inventory.inventory_reservation_lines, pharmacy_inventory.inventory_reservations, pharmacy_inventory.inventory_stock_positions. Lee clinical.medication_requests, clinical.service_requests, common.addresses, community.public_profiles, diagnostic_units.diagnostic_study_offerings, diagnostic_units.diagnostic_units, directory.tenants, iam.devices y 30 más. Publica un evento calculado (null).

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PATIENT | `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-orders.controller.ts:119` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.medication_requests` | LEE | LEE | DIRECTA | PharmacyOrdersController.listMine → PharmacyOrdersService.listMine → PharmacyOrdersUseCases.listMine → PharmacyOrdersUseCases.expireDue → PharmacyOrdersRepository.findPrescriberProfileId | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:290` |
| `clinical.service_requests` | LEE | LEE | DIRECTA | PharmacyOrdersController.listMine → PharmacyOrdersService.listMine → PharmacyOrdersUseCases.listMine → InsurancePatientSettlementAdapter.forOrders → PatientSettlementService.forOrders → PatientSettlementRepository.ownedOrders | `src/modules/insurance/infrastructure/repositories/patient-settlement.repository.ts:58` |
| `common.addresses` | LEE | LEE | DIRECTA | PharmacyOrdersController.listMine → PharmacyOrdersService.listMine → PharmacyOrdersUseCases.listMine → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findAddressesByIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:361` |
| `community.public_profiles` | LEE | LEE | DIRECTA | PharmacyOrdersController.listMine → PharmacyOrdersService.listMine → PharmacyOrdersUseCases.listMine → PharmacyOrdersUseCases.composeOrders → CommunityPharmacyOrderChatAdapter.findPharmacyShowcases → CommunityOrderChatService.findOrganizationShowcases → PublicProfilesRepository.listByIds | `src/modules/community/repositories/public-profiles.repository.ts:135` |
| `diagnostic_units.diagnostic_study_offerings` | LEE | LEE | DIRECTA | PharmacyOrdersController.listMine → PharmacyOrdersService.listMine → PharmacyOrdersUseCases.listMine → InsurancePatientSettlementAdapter.forOrders → PatientSettlementService.forOrders → PatientSettlementRepository.load | `src/modules/insurance/infrastructure/repositories/patient-settlement.repository.ts:137` |
| `diagnostic_units.diagnostic_units` | LEE | LEE | DIRECTA | PharmacyOrdersController.listMine → PharmacyOrdersService.listMine → PharmacyOrdersUseCases.listMine → InsurancePatientSettlementAdapter.forOrders → PatientSettlementService.forOrders → LinkedClaimOrderService.loadSnapshots → LinkedClaimOrderService.resolveBatch → LinkedOrderDataRepository.findDiagnosticUnits | `src/modules/insurance/infrastructure/repositories/linked-order-data.repository.ts:139` |
| `directory.tenants` | LEE | LEE | DIRECTA | PharmacyOrdersController.listMine → PharmacyOrdersService.listMine → PharmacyOrdersUseCases.listMine → PharmacyOrdersUseCases.composeOrders → CommunityPharmacyOrderChatAdapter.findPharmacyShowcases → CommunityOrderChatService.findOrganizationShowcases → CommunityOrganizationStaffService.verifiedActiveTenantIds | `src/modules/community/services/community-organization-staff.service.ts:283` |
| `iam.devices` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyOrdersController.listMine → PharmacyOrdersService.listMine → PharmacyOrdersUseCases.listMine → PharmacyOrdersUseCases.expireDue → PharmacyOrderNotificationsService.expiredToPrescriber → NotifyPharmacyOrderUseCase.expiredToPrescriber → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → WebPushService.pushToUser → WebPushService.sendTo → WebPushService.forget | `src/modules/messaging/services/web-push.service.ts:235` |
| `iam.devices` | LEE | LEE | DIRECTA | PharmacyOrdersController.listMine → PharmacyOrdersService.listMine → PharmacyOrdersUseCases.listMine → PharmacyOrdersUseCases.expireDue → PharmacyOrderNotificationsService.expiredToPrescriber → NotifyPharmacyOrderUseCase.expiredToPrescriber → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → WebPushService.pushToUser | `src/modules/messaging/services/web-push.service.ts:172` |
| `insurance.claim_adjudication_versions` | LEE | LEE | DIRECTA | PharmacyOrdersController.listMine → PharmacyOrdersService.listMine → PharmacyOrdersUseCases.listMine → InsurancePatientSettlementAdapter.forOrders → PatientSettlementService.forOrders → PatientSettlementRepository.load | `src/modules/insurance/infrastructure/repositories/patient-settlement.repository.ts:97` |
| `insurance.claim_line_adjudications` | LEE | LEE | DIRECTA | PharmacyOrdersController.listMine → PharmacyOrdersService.listMine → PharmacyOrdersUseCases.listMine → InsurancePatientSettlementAdapter.forOrders → PatientSettlementService.forOrders → PatientSettlementRepository.load | `src/modules/insurance/infrastructure/repositories/patient-settlement.repository.ts:116` |
| `insurance.claim_reversals` | LEE | LEE | DIRECTA | PharmacyOrdersController.listMine → PharmacyOrdersService.listMine → PharmacyOrdersUseCases.listMine → InsurancePatientSettlementAdapter.forOrders → PatientSettlementService.forOrders → PatientSettlementRepository.load | `src/modules/insurance/infrastructure/repositories/patient-settlement.repository.ts:104` |
| `insurance.insurance_carriers` | LEE | LEE | DIRECTA | PharmacyOrdersController.listMine → PharmacyOrdersService.listMine → PharmacyOrdersUseCases.listMine → InsurancePatientSettlementAdapter.forOrders → PatientSettlementService.forOrders → PatientSettlementRepository.load | `src/modules/insurance/infrastructure/repositories/patient-settlement.repository.ts:110` |
| `insurance.insurance_claim_lines` | LEE | LEE | DIRECTA | PharmacyOrdersController.listMine → PharmacyOrdersService.listMine → PharmacyOrdersUseCases.listMine → InsurancePatientSettlementAdapter.forOrders → PatientSettlementService.forOrders → PatientSettlementRepository.load | `src/modules/insurance/infrastructure/repositories/patient-settlement.repository.ts:96` |
| `insurance.insurance_claims` | LEE | LEE | DIRECTA | PharmacyOrdersController.listMine → PharmacyOrdersService.listMine → PharmacyOrdersUseCases.listMine → InsurancePatientSettlementAdapter.forOrders → PatientSettlementService.forOrders → PatientSettlementRepository.load | `src/modules/insurance/infrastructure/repositories/patient-settlement.repository.ts:86` |
| `insurance.insurance_plans` | LEE | LEE | DIRECTA | PharmacyOrdersController.listMine → PharmacyOrdersService.listMine → PharmacyOrdersUseCases.listMine → InsurancePatientSettlementAdapter.forOrders → PatientSettlementService.forOrders → PatientSettlementRepository.load | `src/modules/insurance/infrastructure/repositories/patient-settlement.repository.ts:105` |
| `insurance.insurance_products` | LEE | LEE | DIRECTA | PharmacyOrdersController.listMine → PharmacyOrdersService.listMine → PharmacyOrdersUseCases.listMine → InsurancePatientSettlementAdapter.forOrders → PatientSettlementService.forOrders → PatientSettlementRepository.load | `src/modules/insurance/infrastructure/repositories/patient-settlement.repository.ts:121` |
| `insurance.patient_coverages` | LEE | LEE | DIRECTA | PharmacyOrdersController.listMine → PharmacyOrdersService.listMine → PharmacyOrdersUseCases.listMine → InsurancePatientSettlementAdapter.forOrders → PatientSettlementService.forOrders → PatientSettlementRepository.load | `src/modules/insurance/infrastructure/repositories/patient-settlement.repository.ts:84` |
| `insurance.patient_explanations_of_benefit` | LEE | LEE | DIRECTA | PharmacyOrdersController.listMine → PharmacyOrdersService.listMine → PharmacyOrdersUseCases.listMine → InsurancePatientSettlementAdapter.forOrders → PatientSettlementService.forOrders → PatientSettlementRepository.load | `src/modules/insurance/infrastructure/repositories/patient-settlement.repository.ts:100` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.listMine → PharmacyOrdersService.listMine → PharmacyOrdersUseCases.listMine → PharmacyOrdersUseCases.expireDue → MessagingDomainEventAdapter.publish → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.in_app_notifications` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.listMine → PharmacyOrdersService.listMine → PharmacyOrdersUseCases.listMine → PharmacyOrdersUseCases.expireDue → PharmacyOrderNotificationsService.expiredToPrescriber → NotifyPharmacyOrderUseCase.expiredToPrescriber → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createInAppNotification | `src/modules/messaging/repositories/notifications.repository.ts:710` |
| `messaging.in_app_notifications` | LEE | LEE | DIRECTA | PharmacyOrdersController.listMine → PharmacyOrdersService.listMine → PharmacyOrdersUseCases.listMine → PharmacyOrdersUseCases.expireDue → PharmacyOrderNotificationsService.expiredToPrescriber → NotifyPharmacyOrderUseCase.expiredToPrescriber → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findUnreadInAppForResource | `src/modules/messaging/repositories/notifications.repository.ts:845` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | PharmacyOrdersController.listMine → PharmacyOrdersService.listMine → PharmacyOrdersUseCases.listMine → PharmacyOrdersUseCases.expireDue → PharmacyOrderNotificationsService.expiredToPrescriber → NotifyPharmacyOrderUseCase.expiredToPrescriber → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findActiveChannelByType | `src/modules/messaging/repositories/notifications.repository.ts:189` |
| `messaging.messaging_providers` | LEE | LEE | DIRECTA | PharmacyOrdersController.listMine → PharmacyOrdersService.listMine → PharmacyOrdersUseCases.listMine → PharmacyOrdersUseCases.expireDue → PharmacyOrderNotificationsService.expiredToPrescriber → NotifyPharmacyOrderUseCase.expiredToPrescriber → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findProviderById | `src/modules/messaging/repositories/notifications.repository.ts:437` |
| `messaging.notification_deliveries` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.listMine → PharmacyOrdersService.listMine → PharmacyOrdersUseCases.listMine → PharmacyOrdersUseCases.expireDue → PharmacyOrderNotificationsService.expiredToPrescriber → NotifyPharmacyOrderUseCase.expiredToPrescriber → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createDelivery | `src/modules/messaging/repositories/notifications.repository.ts:514` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.listMine → PharmacyOrdersService.listMine → PharmacyOrdersUseCases.listMine → PharmacyOrdersUseCases.expireDue → PharmacyOrderNotificationsService.expiredToPrescriber → NotifyPharmacyOrderUseCase.expiredToPrescriber → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.listMine → PharmacyOrdersService.listMine → PharmacyOrdersUseCases.listMine → PharmacyOrdersUseCases.expireDue → MessagingDomainEventAdapter.publish → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | PharmacyOrdersController.listMine → PharmacyOrdersService.listMine → PharmacyOrdersUseCases.listMine → PharmacyOrdersUseCases.expireDue → MessagingDomainEventAdapter.publish → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |
| `messaging.provider_channel_configs` | LEE | LEE | DIRECTA | PharmacyOrdersController.listMine → PharmacyOrdersService.listMine → PharmacyOrdersUseCases.listMine → PharmacyOrdersUseCases.expireDue → PharmacyOrderNotificationsService.expiredToPrescriber → NotifyPharmacyOrderUseCase.expiredToPrescriber → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findChannelConfigs | `src/modules/messaging/repositories/notifications.repository.ts:405` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | PharmacyOrdersController.listMine → PharmacyOrdersService.listMine → PharmacyOrdersUseCases.listMine → PharmacyOrdersUseCases.expireDue → PharmacyOrderNotificationsService.expiredToPrescriber → NotifyPharmacyOrderUseCase.expiredToPrescriber → NotifyPharmacyOrderUseCase.emitToPerson → MessagingInAppNotificationAdapter.emit → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `pharmacy_inventory.inventory_ledger_entries` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.listMine → PharmacyOrdersService.listMine → PharmacyOrdersUseCases.listMine → PharmacyOrdersUseCases.expireDue → InventoryReservationsService.releaseConfirmedLines → ReleaseConfirmedReservationLinesUseCase.execute → LedgerRepository.append | `src/modules/pharmacy_inventory/infrastructure/repositories/ledger.repository.ts:142` |
| `pharmacy_inventory.inventory_ledger_entries` | LEE | LEE | POR_SQL | PharmacyOrdersController.listMine → PharmacyOrdersService.listMine → PharmacyOrdersUseCases.listMine → PharmacyOrdersUseCases.expireDue → InventoryReservationsService.releaseConfirmedLines → ReleaseConfirmedReservationLinesUseCase.execute → LedgerRepository.nextSequence | `src/modules/pharmacy_inventory/infrastructure/repositories/ledger.repository.ts:113` |
| `pharmacy_inventory.inventory_reservation_lines` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyOrdersController.listMine → PharmacyOrdersService.listMine → PharmacyOrdersUseCases.listMine → PharmacyOrdersUseCases.expireDue → InventoryReservationsService.releaseConfirmedLines → ReleaseConfirmedReservationLinesUseCase.execute | `src/modules/pharmacy_inventory/application/inventory-reservations/release-confirmed-reservation-lines.use-case.ts:44` |
| `pharmacy_inventory.inventory_reservation_lines` | LEE | LEE | DIRECTA | PharmacyOrdersController.listMine → PharmacyOrdersService.listMine → PharmacyOrdersUseCases.listMine → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findLinesByReservationIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:220` |
| `pharmacy_inventory.inventory_reservations` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyOrdersController.listMine → PharmacyOrdersService.listMine → PharmacyOrdersUseCases.listMine → PharmacyOrdersUseCases.expireDue | `src/modules/pharmacy_inventory/application/pharmacy-orders/pharmacy-orders.use-cases.ts:1696` |
| `pharmacy_inventory.inventory_reservations` | LEE | LEE | DIRECTA | PharmacyOrdersController.listMine → PharmacyOrdersService.listMine → PharmacyOrdersUseCases.listMine → PharmacyOrdersRepository.findOrdersByPatient | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:165` |
| `pharmacy_inventory.inventory_stock_positions` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyOrdersController.listMine → PharmacyOrdersService.listMine → PharmacyOrdersUseCases.listMine → PharmacyOrdersUseCases.expireDue → InventoryReservationsService.releaseConfirmedLines → ReleaseConfirmedReservationLinesUseCase.execute | `src/modules/pharmacy_inventory/application/inventory-reservations/release-confirmed-reservation-lines.use-case.ts:72` |
| `pharmacy_inventory.inventory_stock_positions` | LEE | LEE | DIRECTA | PharmacyOrdersController.listMine → PharmacyOrdersService.listMine → PharmacyOrdersUseCases.listMine → PharmacyOrdersUseCases.expireDue → InventoryReservationsService.releaseConfirmedLines → ReleaseConfirmedReservationLinesUseCase.execute → StockPositionsRepository.findByKeyForUpdate | `src/modules/pharmacy_inventory/infrastructure/repositories/stock-positions.repository.ts:82` |
| `pharmacy_inventory.pharmacy_order_substitutions` | LEE | LEE | DIRECTA | PharmacyOrdersController.listMine → PharmacyOrdersService.listMine → PharmacyOrdersUseCases.listMine → PharmacyOrdersUseCases.composeOrders → PharmacyOrderSubstitutionsRepository.findByReservationIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-order-substitutions.repository.ts:62` |
| `pharmacy.pharmacies` | LEE | LEE | DIRECTA | PharmacyOrdersController.listMine → PharmacyOrdersService.listMine → PharmacyOrdersUseCases.listMine → PharmacyOrdersUseCases.expireDue → PharmacyOrdersRepository.findPharmaciesByIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:265` |
| `pharmacy.pharmacy_products` | LEE | LEE | DIRECTA | PharmacyOrdersController.listMine → PharmacyOrdersService.listMine → PharmacyOrdersUseCases.listMine → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findProductsByIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:256` |
| `pharmacy.pharmacy_sites` | LEE | LEE | DIRECTA | PharmacyOrdersController.listMine → PharmacyOrdersService.listMine → PharmacyOrdersUseCases.listMine → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findSitesByIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:247` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | PharmacyOrdersController.listMine → PharmacyOrdersService.listMine → PharmacyOrdersUseCases.listMine → InsurancePatientSettlementAdapter.forOrders → PatientSettlementService.forOrders → InsurancePatientAccountRepository.findPatientProfile | `src/modules/insurance/infrastructure/repositories/insurance-patient-account.repository.ts:34` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | PharmacyOrdersController.listMine → PharmacyOrdersService.listMine → PharmacyOrdersUseCases.listMine → InsurancePatientSettlementAdapter.forOrders → PatientSettlementService.forOrders → InsurancePatientAccountRepository.findActiveAccountLink | `src/modules/insurance/infrastructure/repositories/insurance-patient-account.repository.ts:24` |
| `profiles.person_profiles` | LEE | LEE | DIRECTA | PharmacyOrdersController.listMine → PharmacyOrdersService.listMine → PharmacyOrdersUseCases.listMine → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findPersonNamesByProfileIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:143` |
| `profiles.persons` | LEE | LEE | DIRECTA | PharmacyOrdersController.listMine → PharmacyOrdersService.listMine → PharmacyOrdersUseCases.listMine → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findPersonNamesByProfileIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:135` |
| `profiles.practitioner_specialties` | LEE | LEE | DIRECTA | PharmacyOrdersController.listMine → PharmacyOrdersService.listMine → PharmacyOrdersUseCases.listMine → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findPrimarySpecialtyConceptIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:331` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | PharmacyOrdersController.listMine → PharmacyOrdersService.listMine → PharmacyOrdersUseCases.listMine → PharmacyOrdersUseCases.composeOrders → PharmacyOrdersRepository.findConceptsByIds | `src/modules/pharmacy_inventory/infrastructure/repositories/pharmacy-orders.repository.ts:370` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | calculado: `null` | `src/modules/pharmacy_inventory/infrastructure/adapters/messaging-domain-event.adapter.ts:16` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PharmacyOrderListResponseDto>` · DTO `PharmacyOrderListResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<PharmacyOrderDto>` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:602` |
| `items[].reservationLines` | `array<PharmacyOrderReservationLineDto>` | Sí | — | — | Porciones confirmadas o entregadas vigentes para facturación | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:253` |
| `items[].reservationLines[].id` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:212` |
| `items[].reservationLines[].productId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:215` |
| `items[].reservationLines[].quantity` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:218` |
| `items[].reservationLines[].unitPriceAmount` | `string` | Sí | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:221` |
| `items[].reservationLines[].billedAmount` | `string` | Sí | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:224` |
| `items[].reservationLines[].currencyConceptId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:227` |
| `items[].insuranceSettlement` | `PatientInsuranceSettlementDto` | Sí | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:256` |
| `items[].insuranceSettlement.claimId` | `string` | Sí | formato uuid | — | — | sin fuente |
| `items[].insuranceSettlement.claimIdentifier` | `string` | Sí | — | — | — | sin fuente |
| `items[].insuranceSettlement.adjudicationVersionId` | `string` | Sí | formato uuid | — | — | sin fuente |
| `items[].insuranceSettlement.adjudicationVersion` | `number` | Sí | formato int32; mínimo 1 | — | — | sin fuente |
| `items[].insuranceSettlement.eobId` | `string` | Sí | formato uuid | — | — | sin fuente |
| `items[].insuranceSettlement.carrierName` | `string` | Sí | — | — | — | sin fuente |
| `items[].insuranceSettlement.policyIdentifier` | `string` | Sí | admite null | — | — | sin fuente |
| `items[].insuranceSettlement.totalBilledAmount` | `string` | Sí | — | — | Total facturado, decimal exacto | sin fuente |
| `items[].insuranceSettlement.totalApprovedAmount` | `string` | Sí | — | — | Aporte del seguro, decimal exacto | sin fuente |
| `items[].insuranceSettlement.totalPatientAmount` | `string` | Sí | — | — | Cargo confirmado al paciente, decimal exacto | sin fuente |
| `items[].insuranceSettlement.totalDeniedAmount` | `string` | Sí | — | — | Importe excluido sin asignar, decimal exacto | sin fuente |
| `items[].insuranceSettlement.currencyCode` | `string` | Sí | — | — | — | sin fuente |
| `items[].insuranceSettlement.result` | `string` | Sí | valores: APPROVED, PARTIALLY_APPROVED, DENIED | — | — | sin fuente |
| `items[].insuranceSettlement.exclusions` | `array<PatientInsuranceSettlementExclusionDto>` | Sí | — | — | — | sin fuente |
| `items[].insuranceSettlement.exclusions[].claimLineId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/patient-settlement.dto.ts:9` |
| `items[].insuranceSettlement.exclusions[].itemId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/patient-settlement.dto.ts:12` |
| `items[].insuranceSettlement.exclusions[].itemName` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/patient-settlement.dto.ts:15` |
| `items[].insuranceSettlement.exclusions[].amount` | `string` | Sí | — | — | Importe decimal exacto excluido | `src/modules/pharmacy_inventory/presentation/dto/patient-settlement.dto.ts:18` |
| `items[].insuranceSettlement.exclusions[].policyClauseReference` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/patient-settlement.dto.ts:21` |
| `items[].insuranceSettlement.exclusions[].denialRationale` | `string` | Sí | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/patient-settlement.dto.ts:24` |
| `items[].insuranceSettlementAvailability` | `string` | Sí | valores: AVAILABLE, PENDING_PUBLICATION, UNDER_REVIEW, NOT_AVAILABLE | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:261` |
| `items[].id` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:267` |
| `items[].status` | `InventoryConceptDto` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:273` |
| `items[].status.code` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:17` |
| `items[].status.display` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:23` |
| `items[].createdAt` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:279` |
| `items[].expiresAt` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:286` |
| `items[].siteId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:292` |
| `items[].siteName` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:298` |
| `items[].pharmacyId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:304` |
| `items[].pharmacyName` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:310` |
| `items[].medicationRequestId` | `string` | No | formato uuid; admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:316` |
| `items[].prescriber` | `PharmacyOrderPrescriberDto` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:328` |
| `items[].prescriber.name` | `string` | No | admite null | — | — | sin fuente |
| `items[].prescriber.specialty` | `string` | No | admite null | — | — | sin fuente |
| `items[].patientName` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:336` |
| `items[].deliveryMode` | `InventoryConceptDto` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:343` |
| `items[].deliveryMode.code` | `string` | No | — | — | — | sin fuente |
| `items[].deliveryMode.display` | `string` | No | — | — | — | sin fuente |
| `items[].deliveryAddressText` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:351` |
| `items[].pickupCode` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:362` |
| `items[].pharmacyPublicProfileId` | `string` | No | formato uuid; admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:373` |
| `items[].pharmacyPublicSlug` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:380` |
| `items[].totalAmount` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:391` |
| `items[].currency` | `InventoryConceptDto` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:397` |
| `items[].currency.code` | `string` | No | — | — | — | sin fuente |
| `items[].currency.display` | `string` | No | — | — | — | sin fuente |
| `items[].rejectionReasonText` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:404` |
| `items[].substitutions` | `array<PharmacyOrderSubstitutionDto>` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:412` |
| `items[].substitutions[].id` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:427` |
| `items[].substitutions[].originalProductId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:433` |
| `items[].substitutions[].originalName` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:439` |
| `items[].substitutions[].originalUnitPriceAmount` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:445` |
| `items[].substitutions[].proposedProductId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:451` |
| `items[].substitutions[].proposedName` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:457` |
| `items[].substitutions[].proposedUnitPriceAmount` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:463` |
| `items[].substitutions[].currency` | `InventoryConceptDto` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:469` |
| `items[].substitutions[].currency.code` | `string` | No | — | — | — | sin fuente |
| `items[].substitutions[].currency.display` | `string` | No | — | — | — | sin fuente |
| `items[].substitutions[].status` | `InventoryConceptDto` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:475` |
| `items[].substitutions[].status.code` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:17` |
| `items[].substitutions[].status.display` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:23` |
| `items[].substitutions[].decidedAt` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:481` |
| `items[].lines` | `array<PharmacyOrderLineDto>` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:418` |
| `items[].lines[].productId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:123` |
| `items[].lines[].medicationConceptId` | `string` | No | formato uuid; admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:129` |
| `items[].lines[].productCode` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:135` |
| `items[].lines[].brandName` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:141` |
| `items[].lines[].genericName` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:147` |
| `items[].lines[].strengthText` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:153` |
| `items[].lines[].packageSizeText` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:159` |
| `items[].lines[].medication` | `InventoryConceptDto` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:165` |
| `items[].lines[].medication.code` | `string` | No | — | — | — | sin fuente |
| `items[].lines[].medication.display` | `string` | No | — | — | — | sin fuente |
| `items[].lines[].requestedQuantity` | `number` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:171` |
| `items[].lines[].reservedQuantity` | `number` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:177` |
| `items[].lines[].fulfilledQuantity` | `number` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:184` |
| `items[].lines[].unitPriceAmount` | `string` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:193` |
| `items[].lines[].currency` | `InventoryConceptDto` | No | admite null | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:199` |
| `items[].lines[].currency.code` | `string` | No | — | — | — | sin fuente |
| `items[].lines[].currency.display` | `string` | No | — | — | — | sin fuente |
| `items[].lines[].status` | `InventoryConceptDto` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:206` |
| `items[].lines[].status.code` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:17` |
| `items[].lines[].status.display` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/read-responses.dto.ts:23` |
| `count` | `number` | Sí | — | — | — | `src/modules/pharmacy_inventory/presentation/dto/pharmacy-orders.dto.ts:608` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta autenticada no tiene perfil de paciente |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharmacy_inventory.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/patient-coverage-copays.int-spec.ts:668` |

### Flujos

- src / modules / pharmacy inventory — etapa `ctrl:PharmacyOrdersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 29. POST /pharmacy/recall-holds

- **Origen:** CONTRATO
- **Nombre:** Aplicar retiro/recall de lote (UC-25-08)
- **Bloque:** Farmacia
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyInventoryController.createRecallHold` — `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-inventory.controller.ts:159`

### Qué es y para qué sirve (negocio)

Aplicar retiro/recall de lote (UC-25-08). Dentro del módulo (descripción del modelo, en inglés): «Prevents overselling and untraceable adjustments under concurrent manual, API, dispensing and receiving operations.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_25_pharmacy_inventory.puml:20`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`POST /pharmacy/recall-holds` la atiende `PharmacyInventoryController.createRecallHold` (src/modules/pharmacy_inventory/presentation/controllers/pharmacy-inventory.controller.ts:159). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateRecallHoldDto` (7 campos, 6 obligatorios). Delega en `InventoryRecallService.createHold`. Crea filas en pharmacy_inventory.inventory_ledger_entries, pharmacy_inventory.inventory_recall_holds. Actualiza pharmacy_inventory.inventory_lots, pharmacy_inventory.inventory_stock_positions. Lee pharmacy_inventory.inventory_ledger_entries, pharmacy_inventory.inventory_locations, pharmacy_inventory.inventory_lots, pharmacy_inventory.inventory_stock_positions, pharmacy.pharmacies, pharmacy.pharmacy_products, pharmacy.pharmacy_sites.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-inventory.controller.ts:159` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharmacy_inventory.inventory_ledger_entries` | ESCRIBE | CREA | DIRECTA | PharmacyInventoryController.createRecallHold → InventoryRecallService.createHold → CreateRecallHoldUseCase.execute → LedgerRepository.append | `src/modules/pharmacy_inventory/infrastructure/repositories/ledger.repository.ts:142` |
| `pharmacy_inventory.inventory_ledger_entries` | LEE | LEE | POR_SQL | PharmacyInventoryController.createRecallHold → InventoryRecallService.createHold → CreateRecallHoldUseCase.execute → LedgerRepository.nextSequence | `src/modules/pharmacy_inventory/infrastructure/repositories/ledger.repository.ts:113` |
| `pharmacy_inventory.inventory_locations` | LEE | LEE | DIRECTA | PharmacyInventoryController.createRecallHold → InventoryRecallService.createHold → CreateRecallHoldUseCase.execute → PharmacyInventoryScopePolicy.requireStockKey → PharmacyInventoryScopePolicy.requireLocation → InventoryScopeRepository.findLocationInSite | `src/modules/pharmacy_inventory/infrastructure/repositories/inventory-scope.repository.ts:56` |
| `pharmacy_inventory.inventory_lots` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyInventoryController.createRecallHold → InventoryRecallService.createHold → CreateRecallHoldUseCase.execute | `src/modules/pharmacy_inventory/application/inventory-recall/create-recall-hold.use-case.ts:80` |
| `pharmacy_inventory.inventory_lots` | LEE | LEE | DIRECTA | PharmacyInventoryController.createRecallHold → InventoryRecallService.createHold → CreateRecallHoldUseCase.execute → LotsRepository.findById | `src/modules/pharmacy_inventory/infrastructure/repositories/lots.repository.ts:49` |
| `pharmacy_inventory.inventory_recall_holds` | ESCRIBE | CREA | DIRECTA | PharmacyInventoryController.createRecallHold → InventoryRecallService.createHold → CreateRecallHoldUseCase.execute → RecallHoldsRepository.create | `src/modules/pharmacy_inventory/infrastructure/repositories/recall-holds.repository.ts:67` |
| `pharmacy_inventory.inventory_stock_positions` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyInventoryController.createRecallHold → InventoryRecallService.createHold → CreateRecallHoldUseCase.execute | `src/modules/pharmacy_inventory/application/inventory-recall/create-recall-hold.use-case.ts:105` |
| `pharmacy_inventory.inventory_stock_positions` | LEE | LEE | DIRECTA | PharmacyInventoryController.createRecallHold → InventoryRecallService.createHold → CreateRecallHoldUseCase.execute → StockPositionsRepository.findByKey | `src/modules/pharmacy_inventory/infrastructure/repositories/stock-positions.repository.ts:65` |
| `pharmacy.pharmacies` | LEE | LEE | DIRECTA | PharmacyInventoryController.createRecallHold → InventoryRecallService.createHold → CreateRecallHoldUseCase.execute → PharmacyInventoryScopePolicy.requireManagedPharmacy → InventoryScopeRepository.findPharmacyInTenant | `src/modules/pharmacy_inventory/infrastructure/repositories/inventory-scope.repository.ts:33` |
| `pharmacy.pharmacy_products` | LEE | LEE | DIRECTA | PharmacyInventoryController.createRecallHold → InventoryRecallService.createHold → CreateRecallHoldUseCase.execute → PharmacyInventoryScopePolicy.requireStockKey → PharmacyInventoryScopePolicy.requireProduct → InventoryScopeRepository.findProductInPharmacy | `src/modules/pharmacy_inventory/infrastructure/repositories/inventory-scope.repository.ts:73` |
| `pharmacy.pharmacy_sites` | LEE | LEE | DIRECTA | PharmacyInventoryController.createRecallHold → InventoryRecallService.createHold → CreateRecallHoldUseCase.execute → PharmacyInventoryScopePolicy.requireSite → InventoryScopeRepository.findSiteInPharmacy | `src/modules/pharmacy_inventory/infrastructure/repositories/inventory-scope.repository.ts:47` |

### Cuerpo — DTO `CreateRecallHoldDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `pharmacyId` | `string` | Sí | formato uuid | `@IsUUID()` | Farmacia (para el ledger) | `src/modules/pharmacy_inventory/presentation/dto/create-recall-hold.dto.ts:11` |
| `pharmacySiteId` | `string` | Sí | formato uuid | `@IsUUID()` | Sede de farmacia (para el ledger) | `src/modules/pharmacy_inventory/presentation/dto/create-recall-hold.dto.ts:21` |
| `pharmacyProductId` | `string` | Sí | formato uuid | `@IsUUID()` | Producto afectado | `src/modules/pharmacy_inventory/presentation/dto/create-recall-hold.dto.ts:28` |
| `inventoryLotId` | `string` | Sí | formato uuid | `@IsUUID()` | Lote a poner en cuarentena | `src/modules/pharmacy_inventory/presentation/dto/create-recall-hold.dto.ts:35` |
| `inventoryLocationId` | `string` | Sí | formato uuid | `@IsUUID()` | Ubicación del lote (para el ledger) | `src/modules/pharmacy_inventory/presentation/dto/create-recall-hold.dto.ts:45` |
| `recallReference` | `string` | Sí | longitud máxima 128 | `@IsString()` `@MaxLength(128)` | Referencia del recall (autoridad) | `src/modules/pharmacy_inventory/presentation/dto/create-recall-hold.dto.ts:53` |
| `sourceAuthorityTenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tenant de la autoridad emisora | `src/modules/pharmacy_inventory/presentation/dto/create-recall-hold.dto.ts:64` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "pharmacyId": "00000000-0000-4000-8000-000000000001",
  "pharmacySiteId": "00000000-0000-4000-8000-000000000001",
  "pharmacyProductId": "00000000-0000-4000-8000-000000000001",
  "inventoryLotId": "00000000-0000-4000-8000-000000000001",
  "inventoryLocationId": "00000000-0000-4000-8000-000000000001",
  "recallReference": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<IdResponseDto>` · DTO `IdResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/pharmacy_inventory/presentation/dto/responses.dto.ts:9` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharmacy_inventory.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / pharmacy inventory — etapa `ctrl:PharmacyInventoryController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 30. POST /pharmacy/recall-holds/{id}/release

- **Origen:** CONTRATO
- **Nombre:** Liberar recall y reactivar lote (UC-25-09)
- **Bloque:** Farmacia
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyInventoryController.releaseRecallHold` — `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-inventory.controller.ts:176`

### Qué es y para qué sirve (negocio)

Liberar recall y reactivar lote (UC-25-09). Dentro del módulo (descripción del modelo, en inglés): «Prevents overselling and untraceable adjustments under concurrent manual, API, dispensing and receiving operations.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_25_pharmacy_inventory.puml:20`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`POST /pharmacy/recall-holds/{id}/release` la atiende `PharmacyInventoryController.releaseRecallHold` (src/modules/pharmacy_inventory/presentation/controllers/pharmacy-inventory.controller.ts:176). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `ReleaseRecallHoldDto` (1 campo, 0 obligatorios). Delega en `InventoryRecallService.release`. Crea filas en pharmacy_inventory.inventory_ledger_entries. Actualiza pharmacy_inventory.inventory_recall_holds, pharmacy_inventory.inventory_stock_positions. Lee pharmacy_inventory.inventory_ledger_entries, pharmacy_inventory.inventory_locations, pharmacy_inventory.inventory_lots, pharmacy_inventory.inventory_recall_holds, pharmacy_inventory.inventory_stock_positions, pharmacy.pharmacies, pharmacy.pharmacy_products, pharmacy.pharmacy_sites.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-inventory.controller.ts:176` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/pharmacy_inventory/presentation/controllers/pharmacy-inventory.controller.ts:176` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharmacy_inventory.inventory_ledger_entries` | ESCRIBE | CREA | DIRECTA | PharmacyInventoryController.releaseRecallHold → InventoryRecallService.release → ReleaseRecallHoldUseCase.execute → LedgerRepository.append | `src/modules/pharmacy_inventory/infrastructure/repositories/ledger.repository.ts:142` |
| `pharmacy_inventory.inventory_ledger_entries` | LEE | LEE | POR_SQL | PharmacyInventoryController.releaseRecallHold → InventoryRecallService.release → ReleaseRecallHoldUseCase.execute → LedgerRepository.nextSequence | `src/modules/pharmacy_inventory/infrastructure/repositories/ledger.repository.ts:113` |
| `pharmacy_inventory.inventory_locations` | LEE | LEE | DIRECTA | PharmacyInventoryController.releaseRecallHold → InventoryRecallService.release → ReleaseRecallHoldUseCase.execute → PharmacyInventoryScopePolicy.resolveStoredLocation → InventoryScopeRepository.findLocation | `src/modules/pharmacy_inventory/infrastructure/repositories/inventory-scope.repository.ts:64` |
| `pharmacy_inventory.inventory_lots` | LEE | LEE | DIRECTA | PharmacyInventoryController.releaseRecallHold → InventoryRecallService.release → ReleaseRecallHoldUseCase.execute → LotsRepository.findById | `src/modules/pharmacy_inventory/infrastructure/repositories/lots.repository.ts:49` |
| `pharmacy_inventory.inventory_recall_holds` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyInventoryController.releaseRecallHold → InventoryRecallService.release → ReleaseRecallHoldUseCase.execute | `src/modules/pharmacy_inventory/application/inventory-recall/release-recall-hold.use-case.ts:98` |
| `pharmacy_inventory.inventory_recall_holds` | LEE | LEE | DIRECTA | PharmacyInventoryController.releaseRecallHold → InventoryRecallService.release → ReleaseRecallHoldUseCase.execute → RecallHoldsRepository.findById | `src/modules/pharmacy_inventory/infrastructure/repositories/recall-holds.repository.ts:56` |
| `pharmacy_inventory.inventory_stock_positions` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyInventoryController.releaseRecallHold → InventoryRecallService.release → ReleaseRecallHoldUseCase.execute | `src/modules/pharmacy_inventory/application/inventory-recall/release-recall-hold.use-case.ts:127` |
| `pharmacy_inventory.inventory_stock_positions` | LEE | LEE | DIRECTA | PharmacyInventoryController.releaseRecallHold → InventoryRecallService.release → ReleaseRecallHoldUseCase.execute → StockPositionsRepository.findByLot | `src/modules/pharmacy_inventory/infrastructure/repositories/stock-positions.repository.ts:98` |
| `pharmacy.pharmacies` | LEE | LEE | DIRECTA | PharmacyInventoryController.releaseRecallHold → InventoryRecallService.release → ReleaseRecallHoldUseCase.execute → PharmacyInventoryScopePolicy.requireManagedProduct → PharmacyInventoryScopePolicy.requireManagedPharmacy → InventoryScopeRepository.findPharmacyInTenant | `src/modules/pharmacy_inventory/infrastructure/repositories/inventory-scope.repository.ts:33` |
| `pharmacy.pharmacy_products` | LEE | LEE | DIRECTA | PharmacyInventoryController.releaseRecallHold → InventoryRecallService.release → ReleaseRecallHoldUseCase.execute → PharmacyInventoryScopePolicy.requireManagedProduct → InventoryScopeRepository.findProduct | `src/modules/pharmacy_inventory/infrastructure/repositories/inventory-scope.repository.ts:81` |
| `pharmacy.pharmacy_sites` | LEE | LEE | DIRECTA | PharmacyInventoryController.releaseRecallHold → InventoryRecallService.release → ReleaseRecallHoldUseCase.execute → PharmacyInventoryScopePolicy.resolveStoredLocation → InventoryScopeRepository.findSiteInPharmacy | `src/modules/pharmacy_inventory/infrastructure/repositories/inventory-scope.repository.ts:47` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `ReleaseRecallHoldDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `writeOff` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Si es true, el stock en cuarentena se da de baja (write-off) en vez de reintegrarse | `src/modules/pharmacy_inventory/presentation/dto/release-recall-hold.dto.ts:16` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "writeOff": false
}
```

</details>

### Respuesta — `Promise<StatusResultDto>` · DTO `StatusResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `ok` | `boolean` | Sí | — | — | true si la operación se aplicó | sin fuente |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El hold no está activo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharmacy_inventory.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / pharmacy inventory — etapa `ctrl:PharmacyInventoryController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

