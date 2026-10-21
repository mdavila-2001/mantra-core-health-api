<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `pharmacy_inventory`

- **Bloque:** Farmacia (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)
- **Operaciones:** 29 (26 en el contrato, 3 sólo en el código)
- **Riesgo:** ALTO 0 · MEDIO 27 · BAJO 2
- **Tablas distintas que tocan:** 40
- **Respuestas de error y detalle contractual:** `openapi/endpoints/pharmacy-inventory.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | POST | `/internal/inventory-sync-batches` | Ingerir un lote de sincronización ERP | MEDIO | 3 | SECURITY_ADMIN |
| 2 | POST | `/internal/inventory-sync/{batchId}/reconcile` | Conciliar lote de sincronización externa (UC-25-12) | MEDIO | 4 | SECURITY_ADMIN |
| 3 | POST | `/internal/reservations/expire` | Liberar reservas y pedidos vencidos (UC-25-05) | MEDIO | 22 | SYSTEM, SECURITY_ADMIN |
| 4 | GET | `/pharmacy-inventory/availability` | Consultar qué sedes pueden surtir un conjunto de productos | BAJO | 10 | sesión (sin roles) |
| 5 | GET | `/pharmacy-inventory/sites/{siteId}/stock` | Consultar el stock disponible de una sede | BAJO | 6 | sesión (sin roles) |
| 6 | POST | `/pharmacy/{pharmacyId}/dispensations` | Dispensar una prescripción a un paciente (UC-25-03) | MEDIO | 12 | SECURITY_ADMIN |
| 7 | POST | `/pharmacy/{pharmacyId}/goods-receipts` | Recepcionar mercancía por lote (UC-25-02) | MEDIO | 16 | SECURITY_ADMIN |
| 8 | POST | `/pharmacy/{pharmacyId}/purchase-orders` | Emitir una orden de compra a proveedor (UC-25-01) | MEDIO | 5 | SECURITY_ADMIN |
| 9 | POST | `/pharmacy/{pharmacyId}/reservations` | Reservar stock para una prescripción (UC-25-04) | MEDIO | 5 | SECURITY_ADMIN |
| 10 | POST | `/pharmacy/{pharmacyId}/suppliers` | Registrar un proveedor de farmacia | MEDIO | 1 | SECURITY_ADMIN |
| 11 | POST | `/pharmacy/{pharmacyId}/transfers` | Transferir stock entre ubicaciones (UC-25-10) | MEDIO | 6 | SECURITY_ADMIN |
| 12 | POST | `/pharmacy/{siteId}/count-sessions` | Iniciar y congelar una sesión de conteo (UC-25-06) | MEDIO | 5 | SECURITY_ADMIN |
| 13 | POST | `/pharmacy/{siteId}/inventory-locations` | Crear una ubicación de inventario | MEDIO | 1 | SECURITY_ADMIN |
| 14 | POST | `/pharmacy/count-sessions/{id}/approve` | Aprobar conteo y ajustar ledger por varianza (UC-25-07) | MEDIO | 8 | SECURITY_ADMIN |
| 15 | POST | `/pharmacy/dispensations/{id}/reverse` | Reversar una dispensación (UC-25-11) | MEDIO | 7 | SECURITY_ADMIN |
| 16 | GET | `/pharmacy/orders` | Bandeja de pedidos de las farmacias del tenant (FAR-E2) | MEDIO | 28 | SECURITY_ADMIN |
| 17 | POST | `/pharmacy/orders` | Crear un pedido de farmacia (FAR-E1) | MEDIO | 23 | PATIENT |
| 18 | GET | `/pharmacy/orders/{id}` | Consultar un pedido de farmacia (FAR-E1) | MEDIO | 28 | PATIENT, SECURITY_ADMIN |
| 19 | POST | `/pharmacy/orders/{id}/accept-substitutions` | FAR-E2/I2: el titular acepta los genéricos propuestos. Todo-o-nada, como los dos botones del front: `ACEPTACION_PENDIENTE → ACEPTADO`. | MEDIO | 21 | PATIENT |
| 20 | POST | `/pharmacy/orders/{id}/cancel` | Cancelar un pedido de farmacia (FAR-E1) | MEDIO | 18 | PATIENT |
| 21 | POST | `/pharmacy/orders/{id}/confirm` | Confirmar el pedido (FAR-E2) | MEDIO | 30 | SECURITY_ADMIN |
| 22 | POST | `/pharmacy/orders/{id}/dispense` | FAR-E3: la entrega en el mostrador, contra el código de retiro. Parcial acumulativa: mientras quede saldo el pedido sigue LISTO_PARA_RETIRO con el mismo código, y pasa a RETIRADO cuando la última línea se cubre. | MEDIO | 30 | SECURITY_ADMIN |
| 23 | POST | `/pharmacy/orders/{id}/prefer-original` | FAR-E2/I2: el titular prefiere los originales. `ACEPTACION_PENDIENTE → CONFIRMADO`; las líneas no se tocan. | MEDIO | 14 | PATIENT |
| 24 | POST | `/pharmacy/orders/{id}/ready` | Marcar el pedido listo para retiro (FAR-E2 — bloqueado) | MEDIO | 22 | SECURITY_ADMIN |
| 25 | POST | `/pharmacy/orders/{id}/reject` | Rechazar el pedido (FAR-E2) | MEDIO | 27 | SECURITY_ADMIN |
| 26 | POST | `/pharmacy/orders/{id}/review` | Abrir revisión del pedido (FAR-E2) | MEDIO | 22 | SECURITY_ADMIN |
| 27 | GET | `/pharmacy/orders/me` | Mis pedidos de farmacia, más nuevos primero (FAR-E1) | MEDIO | 28 | PATIENT |
| 28 | POST | `/pharmacy/recall-holds` | Aplicar retiro/recall de lote (UC-25-08) | MEDIO | 7 | SECURITY_ADMIN |
| 29 | POST | `/pharmacy/recall-holds/{id}/release` | Liberar recall y reactivar lote (UC-25-09) | MEDIO | 8 | SECURITY_ADMIN |

---

## 1. POST /internal/inventory-sync-batches

- **Origen:** CONTRATO
- **Nombre:** Ingerir un lote de sincronización ERP
- **Bloque:** Farmacia
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyInventoryInternalController.createSyncBatch` — `src/modules/pharmacy_inventory/controllers/pharmacy-inventory-internal.controller.ts:67`

### Qué es y para qué sirve (negocio)

Ingerir un lote de sincronización ERP. Dentro del módulo (descripción del modelo, en inglés): «Prevents overselling and untraceable adjustments under concurrent manual, API, dispensing and receiving operations.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_25_pharmacy_inventory.puml:20`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`POST /internal/inventory-sync-batches` la atiende `PharmacyInventoryInternalController.createSyncBatch` (src/modules/pharmacy_inventory/controllers/pharmacy-inventory-internal.controller.ts:67). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateSyncBatchDto` (9 campos, 3 obligatorios). Delega en `InventorySyncService.createBatch`. Crea filas en pharmacy_inventory.pharmacy_inventory_sync_batches, pharmacy_inventory.pharmacy_inventory_sync_items. Lee pharmacy_inventory.pharmacy_inventory_sync_items.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/pharmacy_inventory/controllers/pharmacy-inventory-internal.controller.ts:67` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharmacy_inventory.pharmacy_inventory_sync_batches` | ESCRIBE | CREA | DIRECTA | PharmacyInventoryInternalController.createSyncBatch → InventorySyncService.createBatch → SyncRepository.createBatch | `src/modules/pharmacy_inventory/repositories/sync.repository.ts:129` |
| `pharmacy_inventory.pharmacy_inventory_sync_items` | ESCRIBE | CREA | DIRECTA | PharmacyInventoryInternalController.createSyncBatch → InventorySyncService.createBatch → SyncRepository.createItem | `src/modules/pharmacy_inventory/repositories/sync.repository.ts:155` |
| `pharmacy_inventory.pharmacy_inventory_sync_items` | LEE | LEE | DIRECTA | PharmacyInventoryInternalController.createSyncBatch → InventorySyncService.createBatch → SyncRepository.findItemByIdempotencyKey | `src/modules/pharmacy_inventory/repositories/sync.repository.ts:115` |

### Cuerpo — DTO `CreateSyncBatchDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `pharmacyIntegrationConnectionId` | `string` | Sí | formato uuid | `@IsUUID()` | Conexión de integración de farmacia | `src/modules/pharmacy_inventory/dto/create-sync-batch.dto.ts:82` |
| `sourceBatchIdentifier` | `string` | Sí | longitud máxima 128 | `@IsString()` `@MaxLength(128)` | Identificador del lote en el sistema origen | `src/modules/pharmacy_inventory/dto/create-sync-batch.dto.ts:90` |
| `items` | `array<SyncItemDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => SyncItemDto)` | — | `src/modules/pharmacy_inventory/dto/create-sync-batch.dto.ts:100` |
| `items[].pharmacyProductId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Producto mapeado (si se conoce) | `src/modules/pharmacy_inventory/dto/create-sync-batch.dto.ts:25` |
| `items[].externalProductCode` | `string` | No | longitud máxima 128 | `@IsOptional()` `@IsString()` `@MaxLength(128)` | Código de producto externo | `src/modules/pharmacy_inventory/dto/create-sync-batch.dto.ts:34` |
| `items[].externalLocationCode` | `string` | No | longitud máxima 128 | `@IsOptional()` `@IsString()` `@MaxLength(128)` | Código de ubicación externa | `src/modules/pharmacy_inventory/dto/create-sync-batch.dto.ts:43` |
| `items[].externalLotNumber` | `string` | No | longitud máxima 128 | `@IsOptional()` `@IsString()` `@MaxLength(128)` | Número de lote externo | `src/modules/pharmacy_inventory/dto/create-sync-batch.dto.ts:52` |
| `items[].externalQuantity` | `number` | No | — | `@IsOptional()` `@IsNumber()` | Cantidad reportada por el ERP | `src/modules/pharmacy_inventory/dto/create-sync-batch.dto.ts:60` |
| `items[].idempotencyKey` | `string` | No | longitud máxima 128 | `@IsOptional()` `@IsString()` `@MaxLength(128)` | Clave de idempotencia del item | `src/modules/pharmacy_inventory/dto/create-sync-batch.dto.ts:69` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/pharmacy_inventory/dto/responses.dto.ts:169` |
| `itemIds` | `array<string>` | Sí | — | — | Ids de los items creados | `src/modules/pharmacy_inventory/dto/responses.dto.ts:175` |

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
- **Implementación:** `PharmacyInventoryInternalController.reconcile` — `src/modules/pharmacy_inventory/controllers/pharmacy-inventory-internal.controller.ts:79`

### Qué es y para qué sirve (negocio)

Conciliar lote de sincronización externa (UC-25-12). Dentro del módulo (descripción del modelo, en inglés): «Prevents overselling and untraceable adjustments under concurrent manual, API, dispensing and receiving operations.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_25_pharmacy_inventory.puml:20`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`POST /internal/inventory-sync/{batchId}/reconcile` la atiende `PharmacyInventoryInternalController.reconcile` (src/modules/pharmacy_inventory/controllers/pharmacy-inventory-internal.controller.ts:79). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `InventorySyncService.reconcile`. Actualiza pharmacy_inventory.pharmacy_inventory_sync_batches, pharmacy_inventory.pharmacy_inventory_sync_items. Lee pharmacy_inventory.pharmacy_inventory_sync_batches, pharmacy_inventory.pharmacy_inventory_sync_items.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/pharmacy_inventory/controllers/pharmacy-inventory-internal.controller.ts:79` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_RUTA | Deben ser UUID válidos: batchId | `src/modules/pharmacy_inventory/controllers/pharmacy-inventory-internal.controller.ts:79` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharmacy_inventory.pharmacy_inventory_sync_batches` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyInventoryInternalController.reconcile → InventorySyncService.reconcile | `src/modules/pharmacy_inventory/services/inventory-sync.service.ts:139` |
| `pharmacy_inventory.pharmacy_inventory_sync_batches` | LEE | LEE | DIRECTA | PharmacyInventoryInternalController.reconcile → InventorySyncService.reconcile → SyncRepository.findBatchById | `src/modules/pharmacy_inventory/repositories/sync.repository.ts:91` |
| `pharmacy_inventory.pharmacy_inventory_sync_items` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyInventoryInternalController.reconcile → InventorySyncService.reconcile | `src/modules/pharmacy_inventory/services/inventory-sync.service.ts:128` |
| `pharmacy_inventory.pharmacy_inventory_sync_items` | LEE | LEE | DIRECTA | PharmacyInventoryInternalController.reconcile → InventorySyncService.reconcile → SyncRepository.findItems | `src/modules/pharmacy_inventory/repositories/sync.repository.ts:105` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `batchId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ReconcileResponseDto>` · DTO `ReconcileResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `batchId` | `string` | Sí | formato uuid | — | Identificador asociado a batch. | `src/modules/pharmacy_inventory/dto/responses.dto.ts:148` |
| `itemsProcessed` | `number` | Sí | — | — | Items procesados | `src/modules/pharmacy_inventory/dto/responses.dto.ts:154` |
| `discrepancies` | `number` | Sí | — | — | Items marcados como discrepancia | `src/modules/pharmacy_inventory/dto/responses.dto.ts:160` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Lote de sincronización no encontrado |
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
- **Implementación:** `PharmacyInventoryInternalController.expireReservations` — `src/modules/pharmacy_inventory/controllers/pharmacy-inventory-internal.controller.ts:51`

### Qué es y para qué sirve (negocio)

Liberar reservas y pedidos vencidos (UC-25-05). Dentro del módulo (descripción del modelo, en inglés): «Prevents overselling and untraceable adjustments under concurrent manual, API, dispensing and receiving operations.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_25_pharmacy_inventory.puml:20`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`POST /internal/reservations/expire` la atiende `PharmacyInventoryInternalController.expireReservations` (src/modules/pharmacy_inventory/controllers/pharmacy-inventory-internal.controller.ts:51). Exige sesión con alguno de los roles SYSTEM, SECURITY_ADMIN. Delega en `InventoryReservationsService.expire`, `PharmacyOrdersService.expireDue`. Crea filas en messaging.domain_events, messaging.in_app_notifications, messaging.notification_deliveries, messaging.notification_requests, messaging.outbox_messages, pharmacy_inventory.inventory_ledger_entries. Actualiza pharmacy_inventory.inventory_reservation_lines, pharmacy_inventory.inventory_reservations, pharmacy_inventory.inventory_stock_positions. Lee clinical.medication_requests, messaging.in_app_notifications, messaging.message_channels, messaging.messaging_providers, messaging.outbox_messages, messaging.provider_channel_configs, messaging.recipient_preferences, pharmacy_inventory.inventory_ledger_entries y 5 más. Publica PharmacyOrderExpired.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, SECURITY_ADMIN | `src/modules/pharmacy_inventory/controllers/pharmacy-inventory-internal.controller.ts:51` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.medication_requests` | LEE | LEE | DIRECTA | PharmacyInventoryInternalController.expireReservations → PharmacyOrdersService.expireDue → PharmacyOrdersRepository.findPrescriberProfileId | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:276` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | PharmacyInventoryInternalController.expireReservations → PharmacyOrdersService.expireDue → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.in_app_notifications` | ESCRIBE | CREA | DIRECTA | PharmacyInventoryInternalController.expireReservations → PharmacyOrdersService.expireDue → PharmacyOrderNotificationsService.expiredToPrescriber → PharmacyOrderNotificationsService.emitToPerson → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createInAppNotification | `src/modules/messaging/repositories/notifications.repository.ts:710` |
| `messaging.in_app_notifications` | LEE | LEE | DIRECTA | PharmacyInventoryInternalController.expireReservations → PharmacyOrdersService.expireDue → PharmacyOrderNotificationsService.expiredToPrescriber → PharmacyOrderNotificationsService.emitToPerson → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findUnreadInAppForResource | `src/modules/messaging/repositories/notifications.repository.ts:845` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | PharmacyInventoryInternalController.expireReservations → PharmacyOrdersService.expireDue → PharmacyOrderNotificationsService.expiredToPrescriber → PharmacyOrderNotificationsService.emitToPerson → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findActiveChannelByType | `src/modules/messaging/repositories/notifications.repository.ts:189` |
| `messaging.messaging_providers` | LEE | LEE | DIRECTA | PharmacyInventoryInternalController.expireReservations → PharmacyOrdersService.expireDue → PharmacyOrderNotificationsService.expiredToPrescriber → PharmacyOrderNotificationsService.emitToPerson → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findProviderById | `src/modules/messaging/repositories/notifications.repository.ts:437` |
| `messaging.notification_deliveries` | ESCRIBE | CREA | DIRECTA | PharmacyInventoryInternalController.expireReservations → PharmacyOrdersService.expireDue → PharmacyOrderNotificationsService.expiredToPrescriber → PharmacyOrderNotificationsService.emitToPerson → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createDelivery | `src/modules/messaging/repositories/notifications.repository.ts:514` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | PharmacyInventoryInternalController.expireReservations → PharmacyOrdersService.expireDue → PharmacyOrderNotificationsService.expiredToPrescriber → PharmacyOrderNotificationsService.emitToPerson → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | PharmacyInventoryInternalController.expireReservations → PharmacyOrdersService.expireDue → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:164` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | PharmacyInventoryInternalController.expireReservations → PharmacyOrdersService.expireDue → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:188` |
| `messaging.provider_channel_configs` | LEE | LEE | DIRECTA | PharmacyInventoryInternalController.expireReservations → PharmacyOrdersService.expireDue → PharmacyOrderNotificationsService.expiredToPrescriber → PharmacyOrderNotificationsService.emitToPerson → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findChannelConfigs | `src/modules/messaging/repositories/notifications.repository.ts:405` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | PharmacyInventoryInternalController.expireReservations → PharmacyOrdersService.expireDue → PharmacyOrderNotificationsService.expiredToPrescriber → PharmacyOrderNotificationsService.emitToPerson → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `pharmacy_inventory.inventory_ledger_entries` | ESCRIBE | CREA | DIRECTA | PharmacyInventoryInternalController.expireReservations → InventoryReservationsService.expire → InventoryReservationsService.releaseConfirmedLines → LedgerRepository.append | `src/modules/pharmacy_inventory/repositories/ledger.repository.ts:138` |
| `pharmacy_inventory.inventory_ledger_entries` | LEE | LEE | POR_SQL | PharmacyInventoryInternalController.expireReservations → InventoryReservationsService.expire → InventoryReservationsService.releaseConfirmedLines → LedgerRepository.nextSequence | `src/modules/pharmacy_inventory/repositories/ledger.repository.ts:109` |
| `pharmacy_inventory.inventory_reservation_lines` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyInventoryInternalController.expireReservations → InventoryReservationsService.expire → InventoryReservationsService.releaseConfirmedLines | `src/modules/pharmacy_inventory/services/inventory-reservations.service.ts:238` |
| `pharmacy_inventory.inventory_reservation_lines` | LEE | LEE | DIRECTA | PharmacyInventoryInternalController.expireReservations → InventoryReservationsService.expire → InventoryReservationsService.releaseConfirmedLines → ReservationsRepository.findLinesByReservation | `src/modules/pharmacy_inventory/repositories/reservations.repository.ts:139` |
| `pharmacy_inventory.inventory_reservations` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyInventoryInternalController.expireReservations → InventoryReservationsService.expire | `src/modules/pharmacy_inventory/services/inventory-reservations.service.ts:179` |
| `pharmacy_inventory.inventory_reservations` | LEE | LEE | DIRECTA | PharmacyInventoryInternalController.expireReservations → InventoryReservationsService.expire → ReservationsRepository.findExpired | `src/modules/pharmacy_inventory/repositories/reservations.repository.ts:122` |
| `pharmacy_inventory.inventory_stock_positions` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyInventoryInternalController.expireReservations → InventoryReservationsService.expire → InventoryReservationsService.releaseConfirmedLines | `src/modules/pharmacy_inventory/services/inventory-reservations.service.ts:266` |
| `pharmacy_inventory.inventory_stock_positions` | LEE | LEE | DIRECTA | PharmacyInventoryInternalController.expireReservations → InventoryReservationsService.expire → InventoryReservationsService.releaseConfirmedLines → StockPositionsRepository.findByKeyForUpdate | `src/modules/pharmacy_inventory/repositories/stock-positions.repository.ts:82` |
| `pharmacy.pharmacies` | LEE | LEE | DIRECTA | PharmacyInventoryInternalController.expireReservations → PharmacyOrdersService.expireDue → PharmacyOrdersRepository.findPharmaciesByIds | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:251` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | PharmacyInventoryInternalController.expireReservations → PharmacyOrdersService.expireDue → PharmacyOrderNotificationsService.expiredToPrescriber → PharmacyOrderNotificationsService.emitToPerson → PersonAccountLinksRepository.findActiveByPerson | `src/modules/profiles/repositories/person-account-links.repository.ts:101` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `PharmacyOrderExpired` | `src/modules/pharmacy_inventory/services/pharmacy-orders.service.ts:1537` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ExpireReservationsResponseDto>` · DTO `ExpireReservationsResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `expiredCount` | `number` | Sí | — | — | Reservas y pedidos expirados en esta corrida | `src/modules/pharmacy_inventory/dto/responses.dto.ts:130` |
| `expiredOrderCount` | `number` | No | — | — | Pedidos de paciente vencidos en esta corrida | `src/modules/pharmacy_inventory/dto/responses.dto.ts:139` |

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
- **Implementación:** `PharmacyInventoryReadController.availability` — `src/modules/pharmacy_inventory/controllers/pharmacy-inventory-read.controller.ts:56`

### Qué es y para qué sirve (negocio)

Consultar qué sedes pueden surtir un conjunto de productos. Dentro del módulo (descripción del modelo, en inglés): «Prevents overselling and untraceable adjustments under concurrent manual, API, dispensing and receiving operations.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_25_pharmacy_inventory.puml:20`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`GET /pharmacy-inventory/availability` la atiende `PharmacyInventoryReadController.availability` (src/modules/pharmacy_inventory/controllers/pharmacy-inventory-read.controller.ts:56). Exige sesión; el controlador no declara roles. Delega en `PharmacyInventoryReadService.availability`. Lee common.addresses, pharmacy_inventory.inventory_locations, pharmacy_inventory.inventory_stock_positions, pharmacy.pharmacies, pharmacy.pharmacy_price_lists, pharmacy.pharmacy_product_prices, pharmacy.pharmacy_products, pharmacy.pharmacy_sites y 2 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/pharmacy_inventory/controllers/pharmacy-inventory-read.controller.ts:56` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_QUERY | products (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.addresses` | LEE | LEE | DIRECTA | PharmacyInventoryReadController.availability → PharmacyInventoryReadService.availability → PharmacyInventoryReadService.resolveAddresses → PharmacyReadRepository.findAddresses | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:217` |
| `pharmacy_inventory.inventory_locations` | LEE | LEE | DIRECTA | PharmacyInventoryReadController.availability → PharmacyInventoryReadService.availability → InventoryReadRepository.findActiveLocationsBySites | `src/modules/pharmacy_inventory/repositories/inventory-read.repository.ts:20` |
| `pharmacy_inventory.inventory_stock_positions` | LEE | LEE | DIRECTA | PharmacyInventoryReadController.availability → PharmacyInventoryReadService.availability → InventoryReadRepository.findStockPositions | `src/modules/pharmacy_inventory/repositories/inventory-read.repository.ts:40` |
| `pharmacy.pharmacies` | LEE | LEE | DIRECTA | PharmacyInventoryReadController.availability → PharmacyInventoryReadService.availability → PharmacyReadRepository.findVisibleByTenant | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:38` |
| `pharmacy.pharmacy_price_lists` | LEE | LEE | DIRECTA | PharmacyInventoryReadController.availability → PharmacyInventoryReadService.availability → PharmacyReadRepository.findCurrentPublicPriceLists | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:166` |
| `pharmacy.pharmacy_product_prices` | LEE | LEE | DIRECTA | PharmacyInventoryReadController.availability → PharmacyInventoryReadService.availability → PharmacyReadRepository.findCurrentPrices | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:193` |
| `pharmacy.pharmacy_products` | LEE | LEE | DIRECTA | PharmacyInventoryReadController.availability → PharmacyInventoryReadService.availability → PharmacyReadRepository.findActiveProductsByIds | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:148` |
| `pharmacy.pharmacy_sites` | LEE | LEE | DIRECTA | PharmacyInventoryReadController.availability → PharmacyInventoryReadService.availability → PharmacyReadRepository.findActiveSites | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:69` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | PharmacyInventoryReadController.availability → PharmacyInventoryReadService.availability → PharmacyInventoryReadService.resolveAddresses → PharmacyReadRepository.findPracticeSites | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:208` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | PharmacyInventoryReadController.availability → PharmacyInventoryReadService.availability → PharmacyReadRepository.findConcepts | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:226` |

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
| `requestedProductIds` | `array<string>` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:328` |
| `items` | `array<AvailabilitySiteDto>` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:337` |
| `items[].siteId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:226` |
| `items[].siteName` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:232` |
| `items[].pharmacyId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:238` |
| `items[].pharmacyName` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:244` |
| `items[].addressText` | `object` | No | admite null | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:250` |
| `items[].latitude` | `object` | No | admite null | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:256` |
| `items[].longitude` | `object` | No | admite null | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:262` |
| `items[].distanceKm` | `object` | No | admite null | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:269` |
| `items[].homeDeliveryAvailable` | `object` | No | admite null | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:275` |
| `items[].pickupAvailable` | `object` | No | admite null | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:281` |
| `items[].complete` | `boolean` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:287` |
| `items[].availableCount` | `number` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:293` |
| `items[].missingProductIds` | `array<string>` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:299` |
| `items[].totalAmount` | `object` | No | admite null | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:307` |
| `items[].currency` | `InventoryConceptDto` | No | admite null | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:313` |
| `items[].currency.code` | `string` | No | — | — | — | sin fuente |
| `items[].currency.display` | `string` | No | — | — | — | sin fuente |
| `items[].products` | `array<AvailabilityProductDto>` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:319` |
| `items[].products[].productId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:169` |
| `items[].products[].productCode` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:175` |
| `items[].products[].brandName` | `object` | No | admite null | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:181` |
| `items[].products[].genericName` | `object` | No | admite null | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:187` |
| `items[].products[].strengthText` | `object` | No | admite null | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:193` |
| `items[].products[].packageSizeText` | `object` | No | admite null | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:199` |
| `items[].products[].medication` | `InventoryConceptDto` | No | admite null | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:205` |
| `items[].products[].medication.code` | `string` | No | — | — | — | sin fuente |
| `items[].products[].medication.display` | `string` | No | — | — | — | sin fuente |
| `items[].products[].availableQuantity` | `number` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:211` |
| `items[].products[].price` | `AvailabilityPriceDto` | No | admite null | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:217` |
| `items[].products[].price.unitAmount` | `string` | No | — | — | — | sin fuente |
| `items[].products[].price.patientAmount` | `object` | No | admite null | — | — | sin fuente |
| `items[].products[].price.currency` | `InventoryConceptDto` | No | admite null | — | — | sin fuente |
| `items[].products[].price.currency.code` | `string` | No | — | — | — | sin fuente |
| `items[].products[].price.currency.display` | `string` | No | — | — | — | sin fuente |
| `items[].products[].price.priceListCode` | `string` | No | — | — | — | sin fuente |
| `count` | `number` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:343` |

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
| CONTROLADOR | `src/modules/pharmacy_inventory/controllers/pharmacy-inventory-read.controller.spec.ts:20` |

### Flujos

- src / modules / pharmacy inventory — etapa `ctrl:PharmacyInventoryReadController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 5. GET /pharmacy-inventory/sites/{siteId}/stock

- **Origen:** CONTRATO
- **Nombre:** Consultar el stock disponible de una sede
- **Bloque:** Farmacia
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyInventoryReadController.getSiteStock` — `src/modules/pharmacy_inventory/controllers/pharmacy-inventory-read.controller.ts:38`

### Qué es y para qué sirve (negocio)

Consultar el stock disponible de una sede. Dentro del módulo (descripción del modelo, en inglés): «Prevents overselling and untraceable adjustments under concurrent manual, API, dispensing and receiving operations.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_25_pharmacy_inventory.puml:20`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`GET /pharmacy-inventory/sites/{siteId}/stock` la atiende `PharmacyInventoryReadController.getSiteStock` (src/modules/pharmacy_inventory/controllers/pharmacy-inventory-read.controller.ts:38). Exige sesión; el controlador no declara roles. Delega en `PharmacyInventoryReadService.getSiteStock`. Lee pharmacy_inventory.inventory_locations, pharmacy_inventory.inventory_stock_positions, pharmacy.pharmacies, pharmacy.pharmacy_products, pharmacy.pharmacy_sites, terminology.catalog_concepts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/pharmacy_inventory/controllers/pharmacy-inventory-read.controller.ts:38` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_RUTA | Deben ser UUID válidos: siteId | `src/modules/pharmacy_inventory/controllers/pharmacy-inventory-read.controller.ts:38` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharmacy_inventory.inventory_locations` | LEE | LEE | DIRECTA | PharmacyInventoryReadController.getSiteStock → PharmacyInventoryReadService.getSiteStock → InventoryReadRepository.findActiveLocationsBySites | `src/modules/pharmacy_inventory/repositories/inventory-read.repository.ts:20` |
| `pharmacy_inventory.inventory_stock_positions` | LEE | LEE | DIRECTA | PharmacyInventoryReadController.getSiteStock → PharmacyInventoryReadService.getSiteStock → InventoryReadRepository.findStockPositions | `src/modules/pharmacy_inventory/repositories/inventory-read.repository.ts:40` |
| `pharmacy.pharmacies` | LEE | LEE | DIRECTA | PharmacyInventoryReadController.getSiteStock → PharmacyInventoryReadService.getSiteStock → PharmacyReadRepository.findVisibleById | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:55` |
| `pharmacy.pharmacy_products` | LEE | LEE | DIRECTA | PharmacyInventoryReadController.getSiteStock → PharmacyInventoryReadService.getSiteStock → PharmacyReadRepository.findActiveProductsByIds | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:148` |
| `pharmacy.pharmacy_sites` | LEE | LEE | DIRECTA | PharmacyInventoryReadController.getSiteStock → PharmacyInventoryReadService.getSiteStock → PharmacyReadRepository.findActiveSiteById | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:84` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | PharmacyInventoryReadController.getSiteStock → PharmacyInventoryReadService.getSiteStock → PharmacyReadRepository.findConcepts | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:226` |

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
| `siteId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:103` |
| `siteName` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:109` |
| `pharmacyId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:115` |
| `pharmacyName` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:121` |
| `items` | `array<SiteStockItemDto>` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:127` |
| `items[].productId` | `string` | Sí | formato uuid | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:32` |
| `items[].productCode` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:38` |
| `items[].brandName` | `object` | No | admite null | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:44` |
| `items[].genericName` | `object` | No | admite null | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:50` |
| `items[].strengthText` | `object` | No | admite null | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:56` |
| `items[].packageSizeText` | `object` | No | admite null | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:62` |
| `items[].medication` | `InventoryConceptDto` | No | admite null | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:68` |
| `items[].medication.code` | `string` | No | — | — | — | sin fuente |
| `items[].medication.display` | `string` | No | — | — | — | sin fuente |
| `items[].onHandQuantity` | `number` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:74` |
| `items[].reservedQuantity` | `number` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:80` |
| `items[].availableQuantity` | `number` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:88` |
| `items[].locationCount` | `number` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:94` |
| `count` | `number` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:133` |

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
- **Implementación:** `PharmacyDispensingController.dispense` — `src/modules/pharmacy_inventory/controllers/pharmacy-dispensing.controller.ts:33`

### Qué es y para qué sirve (negocio)

Dispensar una prescripción a un paciente (UC-25-03). Dentro del módulo (descripción del modelo, en inglés): «Prevents overselling and untraceable adjustments under concurrent manual, API, dispensing and receiving operations.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_25_pharmacy_inventory.puml:20`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`POST /pharmacy/{pharmacyId}/dispensations` la atiende `PharmacyDispensingController.dispense` (src/modules/pharmacy_inventory/controllers/pharmacy-dispensing.controller.ts:33). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateDispensationDto` (12 campos, 6 obligatorios). Delega en `MedicationDispensationsService.dispense`. Crea filas en pharmacy_inventory.inventory_ledger_entries, pharmacy_inventory.medication_dispensation_lines, pharmacy_inventory.medication_dispensations. Actualiza pharmacy_inventory.inventory_reservation_lines, pharmacy_inventory.inventory_reservations, pharmacy_inventory.inventory_stock_positions. Lee pharmacy_inventory.inventory_ledger_entries, pharmacy_inventory.inventory_reservation_lines, pharmacy_inventory.inventory_reservations, pharmacy_inventory.inventory_stock_positions, pharmacy_inventory.medication_dispensation_lines, pharmacy_inventory.medication_dispensations.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/pharmacy_inventory/controllers/pharmacy-dispensing.controller.ts:33` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmacyId | `src/modules/pharmacy_inventory/controllers/pharmacy-dispensing.controller.ts:33` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharmacy_inventory.inventory_ledger_entries` | ESCRIBE | CREA | DIRECTA | PharmacyDispensingController.dispense → MedicationDispensationsService.dispense → LedgerRepository.append | `src/modules/pharmacy_inventory/repositories/ledger.repository.ts:138` |
| `pharmacy_inventory.inventory_ledger_entries` | LEE | LEE | DIRECTA | PharmacyDispensingController.dispense → MedicationDispensationsService.dispense → LedgerRepository.findEntryIdsBySource | `src/modules/pharmacy_inventory/repositories/ledger.repository.ts:121` |
| `pharmacy_inventory.inventory_reservation_lines` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyDispensingController.dispense → MedicationDispensationsService.dispense | `src/modules/pharmacy_inventory/services/medication-dispensations.service.ts:231` |
| `pharmacy_inventory.inventory_reservation_lines` | LEE | LEE | DIRECTA | PharmacyDispensingController.dispense → MedicationDispensationsService.dispense → ReservationsRepository.findLinesByReservation | `src/modules/pharmacy_inventory/repositories/reservations.repository.ts:139` |
| `pharmacy_inventory.inventory_reservations` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyDispensingController.dispense → MedicationDispensationsService.dispense | `src/modules/pharmacy_inventory/services/medication-dispensations.service.ts:224` |
| `pharmacy_inventory.inventory_reservations` | LEE | LEE | DIRECTA | PharmacyDispensingController.dispense → MedicationDispensationsService.dispense → ReservationsRepository.findById | `src/modules/pharmacy_inventory/repositories/reservations.repository.ts:113` |
| `pharmacy_inventory.inventory_stock_positions` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyDispensingController.dispense → MedicationDispensationsService.dispense | `src/modules/pharmacy_inventory/services/medication-dispensations.service.ts:197` |
| `pharmacy_inventory.inventory_stock_positions` | LEE | LEE | DIRECTA | PharmacyDispensingController.dispense → MedicationDispensationsService.dispense → StockPositionsRepository.findByKeyForUpdate | `src/modules/pharmacy_inventory/repositories/stock-positions.repository.ts:82` |
| `pharmacy_inventory.medication_dispensation_lines` | ESCRIBE | CREA | DIRECTA | PharmacyDispensingController.dispense → MedicationDispensationsService.dispense → DispensationsRepository.createLine | `src/modules/pharmacy_inventory/repositories/dispensations.repository.ts:175` |
| `pharmacy_inventory.medication_dispensation_lines` | LEE | LEE | DIRECTA | PharmacyDispensingController.dispense → MedicationDispensationsService.dispense → DispensationsRepository.findLines | `src/modules/pharmacy_inventory/repositories/dispensations.repository.ts:130` |
| `pharmacy_inventory.medication_dispensations` | ESCRIBE | CREA | DIRECTA | PharmacyDispensingController.dispense → MedicationDispensationsService.dispense → DispensationsRepository.create | `src/modules/pharmacy_inventory/repositories/dispensations.repository.ts:146` |
| `pharmacy_inventory.medication_dispensations` | LEE | LEE | DIRECTA | PharmacyDispensingController.dispense → MedicationDispensationsService.dispense → DispensationsRepository.findByIdempotencyKey | `src/modules/pharmacy_inventory/repositories/dispensations.repository.ts:116` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateDispensationDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `pharmacySiteId` | `string` | Sí | formato uuid | `@IsUUID()` | Sede de farmacia | `src/modules/pharmacy_inventory/dto/create-dispensation.dto.ts:74` |
| `patientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Paciente | `src/modules/pharmacy_inventory/dto/create-dispensation.dto.ts:81` |
| `medicationRequestId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Solicitud de medicación | `src/modules/pharmacy_inventory/dto/create-dispensation.dto.ts:92` |
| `inventoryReservationId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Reserva a consumir | `src/modules/pharmacy_inventory/dto/create-dispensation.dto.ts:100` |
| `idempotencyKey` | `string` | No | — | `@IsOptional()` | Clave de idempotencia | `src/modules/pharmacy_inventory/dto/create-dispensation.dto.ts:107` |
| `lines` | `array<DispensationLineDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => DispensationLineDto)` | — | `src/modules/pharmacy_inventory/dto/create-dispensation.dto.ts:117` |
| `lines[].pharmacyProductId` | `string` | Sí | formato uuid | `@IsUUID()` | Producto de farmacia | `src/modules/pharmacy_inventory/dto/create-dispensation.dto.ts:20` |
| `lines[].inventoryLocationId` | `string` | Sí | formato uuid | `@IsUUID()` | Ubicación desde donde se dispensa | `src/modules/pharmacy_inventory/dto/create-dispensation.dto.ts:30` |
| `lines[].inventoryLotId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Lote dispensado | `src/modules/pharmacy_inventory/dto/create-dispensation.dto.ts:38` |
| `lines[].dispensedQuantity` | `number` | Sí | mínimo 0 | `@IsNumber()` `@Min(0)` | Cantidad dispensada | `src/modules/pharmacy_inventory/dto/create-dispensation.dto.ts:46` |
| `lines[].patientAmount` | `number` | No | mínimo 0 | `@IsOptional()` `@IsNumber()` `@Min(0)` | Monto a cargo del paciente | `src/modules/pharmacy_inventory/dto/create-dispensation.dto.ts:55` |
| `lines[].insurerAmount` | `number` | No | mínimo 0 | `@IsOptional()` `@IsNumber()` `@Min(0)` | Monto a cargo del asegurador | `src/modules/pharmacy_inventory/dto/create-dispensation.dto.ts:64` |

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
| `id` | `string` | Sí | — | — | Identificador único de la instancia. | `src/modules/pharmacy_inventory/dto/responses.dto.ts:66` |
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
| 404 | `NOT_FOUND` | ResourceNotFoundException: Reserva no encontrada |
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
- **Implementación:** `PharmacyProcurementController.receiveGoods` — `src/modules/pharmacy_inventory/controllers/pharmacy-procurement.controller.ts:66`

### Qué es y para qué sirve (negocio)

Recepcionar mercancía por lote (UC-25-02). Dentro del módulo (descripción del modelo, en inglés): «Prevents overselling and untraceable adjustments under concurrent manual, API, dispensing and receiving operations.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_25_pharmacy_inventory.puml:20`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`POST /pharmacy/{pharmacyId}/goods-receipts` la atiende `PharmacyProcurementController.receiveGoods` (src/modules/pharmacy_inventory/controllers/pharmacy-procurement.controller.ts:66). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `PharmacyInventoryCreateGoodsReceiptDto` (14 campos, 8 obligatorios). Delega en `PharmacyProcurementService.receiveGoods`. Crea filas en pharmacy_inventory.inventory_ledger_entries, pharmacy_inventory.inventory_lots, pharmacy_inventory.inventory_stock_positions, pharmacy_inventory.pharmacy_goods_receipt_lines, pharmacy_inventory.pharmacy_goods_receipts. Actualiza pharmacy_inventory.inventory_stock_positions, pharmacy_inventory.pharmacy_purchase_order_lines, pharmacy_inventory.pharmacy_purchase_orders. Lee pharmacy_inventory.inventory_ledger_entries, pharmacy_inventory.inventory_locations, pharmacy_inventory.inventory_lots, pharmacy_inventory.inventory_stock_positions, pharmacy_inventory.pharmacy_goods_receipt_lines, pharmacy_inventory.pharmacy_goods_receipts, pharmacy_inventory.pharmacy_purchase_order_lines, pharmacy_inventory.pharmacy_purchase_orders.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/pharmacy_inventory/controllers/pharmacy-procurement.controller.ts:66` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmacyId | `src/modules/pharmacy_inventory/controllers/pharmacy-procurement.controller.ts:66` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharmacy_inventory.inventory_ledger_entries` | ESCRIBE | CREA | DIRECTA | PharmacyProcurementController.receiveGoods → PharmacyProcurementService.receiveGoods → LedgerRepository.append | `src/modules/pharmacy_inventory/repositories/ledger.repository.ts:138` |
| `pharmacy_inventory.inventory_ledger_entries` | LEE | LEE | DIRECTA | PharmacyProcurementController.receiveGoods → PharmacyProcurementService.receiveGoods → LedgerRepository.findEntryIdsBySource | `src/modules/pharmacy_inventory/repositories/ledger.repository.ts:121` |
| `pharmacy_inventory.inventory_locations` | LEE | LEE | DIRECTA | PharmacyProcurementController.receiveGoods → PharmacyProcurementService.receiveGoods → LocationsRepository.findById | `src/modules/pharmacy_inventory/repositories/locations.repository.ts:57` |
| `pharmacy_inventory.inventory_lots` | ESCRIBE | CREA | DIRECTA | PharmacyProcurementController.receiveGoods → PharmacyProcurementService.receiveGoods → LotsRepository.create | `src/modules/pharmacy_inventory/repositories/lots.repository.ts:69` |
| `pharmacy_inventory.inventory_lots` | LEE | LEE | DIRECTA | PharmacyProcurementController.receiveGoods → PharmacyProcurementService.receiveGoods → LotsRepository.findByProductAndNumber | `src/modules/pharmacy_inventory/repositories/lots.repository.ts:58` |
| `pharmacy_inventory.inventory_stock_positions` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyProcurementController.receiveGoods → PharmacyProcurementService.receiveGoods | `src/modules/pharmacy_inventory/services/pharmacy-procurement.service.ts:341` |
| `pharmacy_inventory.inventory_stock_positions` | ESCRIBE | CREA | DIRECTA | PharmacyProcurementController.receiveGoods → PharmacyProcurementService.receiveGoods → StockPositionsRepository.create | `src/modules/pharmacy_inventory/repositories/stock-positions.repository.ts:112` |
| `pharmacy_inventory.inventory_stock_positions` | LEE | LEE | DIRECTA | PharmacyProcurementController.receiveGoods → PharmacyProcurementService.receiveGoods → StockPositionsRepository.findByKeyForUpdate | `src/modules/pharmacy_inventory/repositories/stock-positions.repository.ts:82` |
| `pharmacy_inventory.pharmacy_goods_receipt_lines` | ESCRIBE | CREA | DIRECTA | PharmacyProcurementController.receiveGoods → PharmacyProcurementService.receiveGoods → GoodsReceiptsRepository.createLine | `src/modules/pharmacy_inventory/repositories/goods-receipts.repository.ts:163` |
| `pharmacy_inventory.pharmacy_goods_receipt_lines` | LEE | LEE | DIRECTA | PharmacyProcurementController.receiveGoods → PharmacyProcurementService.receiveGoods → GoodsReceiptsRepository.findLines | `src/modules/pharmacy_inventory/repositories/goods-receipts.repository.ts:120` |
| `pharmacy_inventory.pharmacy_goods_receipts` | ESCRIBE | CREA | DIRECTA | PharmacyProcurementController.receiveGoods → PharmacyProcurementService.receiveGoods → GoodsReceiptsRepository.create | `src/modules/pharmacy_inventory/repositories/goods-receipts.repository.ts:136` |
| `pharmacy_inventory.pharmacy_goods_receipts` | LEE | LEE | DIRECTA | PharmacyProcurementController.receiveGoods → PharmacyProcurementService.receiveGoods → GoodsReceiptsRepository.findByIdempotencyKey | `src/modules/pharmacy_inventory/repositories/goods-receipts.repository.ts:112` |
| `pharmacy_inventory.pharmacy_purchase_order_lines` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyProcurementController.receiveGoods → PharmacyProcurementService.receiveGoods | `src/modules/pharmacy_inventory/services/pharmacy-procurement.service.ts:373` |
| `pharmacy_inventory.pharmacy_purchase_order_lines` | LEE | LEE | DIRECTA | PharmacyProcurementController.receiveGoods → PharmacyProcurementService.receiveGoods → PurchaseOrdersRepository.findLineById | `src/modules/pharmacy_inventory/repositories/purchase-orders.repository.ts:134` |
| `pharmacy_inventory.pharmacy_purchase_orders` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyProcurementController.receiveGoods → PharmacyProcurementService.receiveGoods | `src/modules/pharmacy_inventory/services/pharmacy-procurement.service.ts:383` |
| `pharmacy_inventory.pharmacy_purchase_orders` | LEE | LEE | DIRECTA | PharmacyProcurementController.receiveGoods → PharmacyProcurementService.receiveGoods → PurchaseOrdersRepository.findById | `src/modules/pharmacy_inventory/repositories/purchase-orders.repository.ts:95` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | — |

### Cuerpo — DTO `PharmacyInventoryCreateGoodsReceiptDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `pharmacyPurchaseOrderId` | `string` | Sí | formato uuid | `@IsUUID()` | Orden de compra a recepcionar | `src/modules/pharmacy_inventory/dto/create-goods-receipt.dto.ts:94` |
| `pharmacySiteId` | `string` | Sí | formato uuid | `@IsUUID()` | Sede de farmacia | `src/modules/pharmacy_inventory/dto/create-goods-receipt.dto.ts:101` |
| `inventoryLocationId` | `string` | Sí | formato uuid | `@IsUUID()` | Ubicación destino del stock | `src/modules/pharmacy_inventory/dto/create-goods-receipt.dto.ts:108` |
| `supplierDeliveryReference` | `string` | No | longitud máxima 128 | `@IsOptional()` `@IsString()` `@MaxLength(128)` | Referencia de entrega del proveedor | `src/modules/pharmacy_inventory/dto/create-goods-receipt.dto.ts:117` |
| `idempotencyKey` | `string` | No | longitud máxima 128 | `@IsOptional()` `@IsString()` `@MaxLength(128)` | Clave de idempotencia | `src/modules/pharmacy_inventory/dto/create-goods-receipt.dto.ts:126` |
| `lines` | `array<GoodsReceiptLineDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => GoodsReceiptLineDto)` | — | `src/modules/pharmacy_inventory/dto/create-goods-receipt.dto.ts:136` |
| `lines[].pharmacyPurchaseOrderLineId` | `string` | Sí | formato uuid | `@IsUUID()` | Línea de la orden de compra | `src/modules/pharmacy_inventory/dto/create-goods-receipt.dto.ts:22` |
| `lines[].pharmacyProductId` | `string` | Sí | formato uuid | `@IsUUID()` | Producto de farmacia | `src/modules/pharmacy_inventory/dto/create-goods-receipt.dto.ts:29` |
| `lines[].lotNumber` | `string` | Sí | longitud máxima 128 | `@IsString()` `@MaxLength(128)` | Número de lote recibido | `src/modules/pharmacy_inventory/dto/create-goods-receipt.dto.ts:37` |
| `lines[].receivedQuantity` | `number` | Sí | mínimo 0 | `@IsNumber()` `@Min(0)` | Cantidad recibida | `src/modules/pharmacy_inventory/dto/create-goods-receipt.dto.ts:45` |
| `lines[].acceptedQuantity` | `number` | No | mínimo 0 | `@IsOptional()` `@IsNumber()` `@Min(0)` | Cantidad aceptada (default = recibida) | `src/modules/pharmacy_inventory/dto/create-goods-receipt.dto.ts:57` |
| `lines[].rejectedQuantity` | `number` | No | mínimo 0 | `@IsOptional()` `@IsNumber()` `@Min(0)` | Cantidad rechazada | `src/modules/pharmacy_inventory/dto/create-goods-receipt.dto.ts:66` |
| `lines[].unitCostAmount` | `number` | No | mínimo 0 | `@IsOptional()` `@IsNumber()` `@Min(0)` | Costo unitario | `src/modules/pharmacy_inventory/dto/create-goods-receipt.dto.ts:75` |
| `lines[].expiresAt` | `string` | No | — | `@IsOptional()` `@IsString()` | Fecha de expiración del lote (ISO) | `src/modules/pharmacy_inventory/dto/create-goods-receipt.dto.ts:83` |

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
      "expiresAt": "valor-ejemplo"
    }
  ]
}
```

</details>

### Respuesta — `Promise<GoodsReceiptResponseDto>` · DTO `GoodsReceiptResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/pharmacy_inventory/dto/responses.dto.ts:39` |
| `receiptNumber` | `string` | Sí | — | — | Valor de receipt number mantenido por la instancia. | `src/modules/pharmacy_inventory/dto/responses.dto.ts:45` |
| `lotIds` | `array<string>` | Sí | — | — | Ids de lotes afectados | `src/modules/pharmacy_inventory/dto/responses.dto.ts:51` |
| `ledgerEntryIds` | `array<string>` | Sí | — | — | Ids de asientos del ledger | `src/modules/pharmacy_inventory/dto/responses.dto.ts:57` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Orden de compra no encontrada; ResourceNotFoundException: Ubicación destino no encontrada; ResourceNotFoundException: Línea de orden no encontrada |
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
- **Implementación:** `PharmacyProcurementController.createPurchaseOrder` — `src/modules/pharmacy_inventory/controllers/pharmacy-procurement.controller.ts:51`

### Qué es y para qué sirve (negocio)

Emitir una orden de compra a proveedor (UC-25-01). Dentro del módulo (descripción del modelo, en inglés): «Prevents overselling and untraceable adjustments under concurrent manual, API, dispensing and receiving operations.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_25_pharmacy_inventory.puml:20`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`POST /pharmacy/{pharmacyId}/purchase-orders` la atiende `PharmacyProcurementController.createPurchaseOrder` (src/modules/pharmacy_inventory/controllers/pharmacy-procurement.controller.ts:51). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `PharmacyInventoryCreatePurchaseOrderDto` (8 campos, 5 obligatorios). Delega en `PharmacyProcurementService.createPurchaseOrder`. Crea filas en pharmacy_inventory.pharmacy_purchase_order_lines, pharmacy_inventory.pharmacy_purchase_orders. Lee pharmacy_inventory.pharmacy_purchase_order_lines, pharmacy_inventory.pharmacy_purchase_orders, pharmacy_inventory.pharmacy_suppliers.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/pharmacy_inventory/controllers/pharmacy-procurement.controller.ts:51` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmacyId | `src/modules/pharmacy_inventory/controllers/pharmacy-procurement.controller.ts:51` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharmacy_inventory.pharmacy_purchase_order_lines` | ESCRIBE | CREA | DIRECTA | PharmacyProcurementController.createPurchaseOrder → PharmacyProcurementService.createPurchaseOrder → PurchaseOrdersRepository.createLine | `src/modules/pharmacy_inventory/repositories/purchase-orders.repository.ts:177` |
| `pharmacy_inventory.pharmacy_purchase_order_lines` | LEE | LEE | DIRECTA | PharmacyProcurementController.createPurchaseOrder → PharmacyProcurementService.createPurchaseOrder → PurchaseOrdersRepository.findLinesByOrder | `src/modules/pharmacy_inventory/repositories/purchase-orders.repository.ts:118` |
| `pharmacy_inventory.pharmacy_purchase_orders` | ESCRIBE | CREA | DIRECTA | PharmacyProcurementController.createPurchaseOrder → PharmacyProcurementService.createPurchaseOrder → PurchaseOrdersRepository.create | `src/modules/pharmacy_inventory/repositories/purchase-orders.repository.ts:148` |
| `pharmacy_inventory.pharmacy_purchase_orders` | LEE | LEE | DIRECTA | PharmacyProcurementController.createPurchaseOrder → PharmacyProcurementService.createPurchaseOrder → PurchaseOrdersRepository.findByIdempotencyKey | `src/modules/pharmacy_inventory/repositories/purchase-orders.repository.ts:104` |
| `pharmacy_inventory.pharmacy_suppliers` | LEE | LEE | DIRECTA | PharmacyProcurementController.createPurchaseOrder → PharmacyProcurementService.createPurchaseOrder → SuppliersRepository.findById | `src/modules/pharmacy_inventory/repositories/suppliers.repository.ts:49` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | — |

### Cuerpo — DTO `PharmacyInventoryCreatePurchaseOrderDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `pharmacySiteId` | `string` | Sí | formato uuid | `@IsUUID()` | Sede de farmacia (pharmacy_sites) | `src/modules/pharmacy_inventory/dto/create-purchase-order.dto.ts:53` |
| `pharmacySupplierId` | `string` | Sí | formato uuid | `@IsUUID()` | Proveedor (pharmacy_suppliers) | `src/modules/pharmacy_inventory/dto/create-purchase-order.dto.ts:63` |
| `purchaseOrderNumber` | `string` | No | longitud máxima 64 | `@IsOptional()` `@IsString()` `@MaxLength(64)` | Número de orden; se autogenera si se omite | `src/modules/pharmacy_inventory/dto/create-purchase-order.dto.ts:74` |
| `idempotencyKey` | `string` | No | longitud máxima 128 | `@IsOptional()` `@IsString()` `@MaxLength(128)` | Clave de idempotencia | `src/modules/pharmacy_inventory/dto/create-purchase-order.dto.ts:83` |
| `lines` | `array<PurchaseOrderLineDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => PurchaseOrderLineDto)` | — | `src/modules/pharmacy_inventory/dto/create-purchase-order.dto.ts:93` |
| `lines[].pharmacyProductId` | `string` | Sí | formato uuid | `@IsUUID()` | Producto de farmacia | `src/modules/pharmacy_inventory/dto/create-purchase-order.dto.ts:22` |
| `lines[].orderedQuantity` | `number` | Sí | mínimo 0 | `@IsNumber()` `@Min(0)` | Cantidad ordenada | `src/modules/pharmacy_inventory/dto/create-purchase-order.dto.ts:30` |
| `lines[].unitCostAmount` | `number` | No | mínimo 0 | `@IsOptional()` `@IsNumber()` `@Min(0)` | Costo unitario | `src/modules/pharmacy_inventory/dto/create-purchase-order.dto.ts:39` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/pharmacy_inventory/dto/responses.dto.ts:18` |
| `purchaseOrderNumber` | `string` | Sí | — | — | Valor de purchase order number mantenido por la instancia. | `src/modules/pharmacy_inventory/dto/responses.dto.ts:24` |
| `lineIds` | `array<string>` | Sí | — | — | Ids de las líneas creadas | `src/modules/pharmacy_inventory/dto/responses.dto.ts:30` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Proveedor no encontrado |
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
- **Implementación:** `PharmacyInventoryController.reserve` — `src/modules/pharmacy_inventory/controllers/pharmacy-inventory.controller.ts:74`

### Qué es y para qué sirve (negocio)

Reservar stock para una prescripción (UC-25-04). Dentro del módulo (descripción del modelo, en inglés): «Prevents overselling and untraceable adjustments under concurrent manual, API, dispensing and receiving operations.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_25_pharmacy_inventory.puml:20`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`POST /pharmacy/{pharmacyId}/reservations` la atiende `PharmacyInventoryController.reserve` (src/modules/pharmacy_inventory/controllers/pharmacy-inventory.controller.ts:74). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateReservationDto` (10 campos, 5 obligatorios). Delega en `InventoryReservationsService.reserve`. Crea filas en pharmacy_inventory.inventory_ledger_entries, pharmacy_inventory.inventory_reservation_lines, pharmacy_inventory.inventory_reservations. Lee pharmacy_inventory.inventory_ledger_entries, pharmacy_inventory.inventory_stock_positions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/pharmacy_inventory/controllers/pharmacy-inventory.controller.ts:74` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmacyId | `src/modules/pharmacy_inventory/controllers/pharmacy-inventory.controller.ts:74` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharmacy_inventory.inventory_ledger_entries` | ESCRIBE | CREA | DIRECTA | PharmacyInventoryController.reserve → InventoryReservationsService.reserve → LedgerRepository.append | `src/modules/pharmacy_inventory/repositories/ledger.repository.ts:138` |
| `pharmacy_inventory.inventory_ledger_entries` | LEE | LEE | POR_SQL | PharmacyInventoryController.reserve → InventoryReservationsService.reserve → LedgerRepository.nextSequence | `src/modules/pharmacy_inventory/repositories/ledger.repository.ts:109` |
| `pharmacy_inventory.inventory_reservation_lines` | ESCRIBE | CREA | DIRECTA | PharmacyInventoryController.reserve → InventoryReservationsService.reserve → ReservationsRepository.createLine | `src/modules/pharmacy_inventory/repositories/reservations.repository.ts:185` |
| `pharmacy_inventory.inventory_reservations` | ESCRIBE | CREA | DIRECTA | PharmacyInventoryController.reserve → InventoryReservationsService.reserve → ReservationsRepository.create | `src/modules/pharmacy_inventory/repositories/reservations.repository.ts:155` |
| `pharmacy_inventory.inventory_stock_positions` | LEE | LEE | DIRECTA | PharmacyInventoryController.reserve → InventoryReservationsService.reserve → StockPositionsRepository.findByKeyForUpdate | `src/modules/pharmacy_inventory/repositories/stock-positions.repository.ts:82` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateReservationDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `pharmacySiteId` | `string` | Sí | formato uuid | `@IsUUID()` | Sede de farmacia | `src/modules/pharmacy_inventory/dto/create-reservation.dto.ts:54` |
| `patientProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Paciente | `src/modules/pharmacy_inventory/dto/create-reservation.dto.ts:62` |
| `medicationRequestId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Solicitud de medicación | `src/modules/pharmacy_inventory/dto/create-reservation.dto.ts:73` |
| `quotationId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Cotización asociada | `src/modules/pharmacy_inventory/dto/create-reservation.dto.ts:81` |
| `expiresInMinutes` | `number` | No | mínimo 1 | `@IsOptional()` `@IsInt()` `@Min(1)` | Minutos hasta expiración (default 60) | `src/modules/pharmacy_inventory/dto/create-reservation.dto.ts:93` |
| `lines` | `array<ReservationLineDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => ReservationLineDto)` | — | `src/modules/pharmacy_inventory/dto/create-reservation.dto.ts:103` |
| `lines[].pharmacyProductId` | `string` | Sí | formato uuid | `@IsUUID()` | Producto de farmacia | `src/modules/pharmacy_inventory/dto/create-reservation.dto.ts:21` |
| `lines[].inventoryLocationId` | `string` | Sí | formato uuid | `@IsUUID()` | Ubicación de inventario | `src/modules/pharmacy_inventory/dto/create-reservation.dto.ts:28` |
| `lines[].inventoryLotId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Lote específico | `src/modules/pharmacy_inventory/dto/create-reservation.dto.ts:36` |
| `lines[].requestedQuantity` | `number` | Sí | mínimo 0 | `@IsNumber()` `@Min(0)` | Cantidad solicitada | `src/modules/pharmacy_inventory/dto/create-reservation.dto.ts:44` |

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
| `id` | `string` | Sí | — | — | Identificador único de la instancia. | `src/modules/pharmacy_inventory/dto/responses.dto.ts:66` |
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
- **Implementación:** `PharmacyProcurementController.createSupplier` — `src/modules/pharmacy_inventory/controllers/pharmacy-procurement.controller.ts:38`

### Qué es y para qué sirve (negocio)

Registrar un proveedor de farmacia. Dentro del módulo (descripción del modelo, en inglés): «Prevents overselling and untraceable adjustments under concurrent manual, API, dispensing and receiving operations.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_25_pharmacy_inventory.puml:20`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`POST /pharmacy/{pharmacyId}/suppliers` la atiende `PharmacyProcurementController.createSupplier` (src/modules/pharmacy_inventory/controllers/pharmacy-procurement.controller.ts:38). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateSupplierDto` (3 campos, 1 obligatorio). Delega en `PharmacyProcurementService.createSupplier`. Crea filas en pharmacy_inventory.pharmacy_suppliers.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/pharmacy_inventory/controllers/pharmacy-procurement.controller.ts:38` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmacyId | `src/modules/pharmacy_inventory/controllers/pharmacy-procurement.controller.ts:38` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharmacy_inventory.pharmacy_suppliers` | ESCRIBE | CREA | DIRECTA | PharmacyProcurementController.createSupplier → PharmacyProcurementService.createSupplier → SuppliersRepository.create | `src/modules/pharmacy_inventory/repositories/suppliers.repository.ts:60` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateSupplierDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `supplierTenantId` | `string` | Sí | formato uuid | `@IsUUID()` | Tenant del proveedor (directory.tenants) | `src/modules/pharmacy_inventory/dto/create-supplier.dto.ts:14` |
| `supplierCode` | `string` | No | longitud máxima 64 | `@IsOptional()` `@IsString()` `@MaxLength(64)` | Código interno del proveedor | `src/modules/pharmacy_inventory/dto/create-supplier.dto.ts:23` |
| `businessPartnerId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Business partner ERP | `src/modules/pharmacy_inventory/dto/create-supplier.dto.ts:31` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/pharmacy_inventory/dto/responses.dto.ts:9` |

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
- **Implementación:** `PharmacyInventoryController.transfer` — `src/modules/pharmacy_inventory/controllers/pharmacy-inventory.controller.ts:87`

### Qué es y para qué sirve (negocio)

Transferir stock entre ubicaciones (UC-25-10). Dentro del módulo (descripción del modelo, en inglés): «Prevents overselling and untraceable adjustments under concurrent manual, API, dispensing and receiving operations.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_25_pharmacy_inventory.puml:20`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`POST /pharmacy/{pharmacyId}/transfers` la atiende `PharmacyInventoryController.transfer` (src/modules/pharmacy_inventory/controllers/pharmacy-inventory.controller.ts:87). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateTransferDto` (6 campos, 5 obligatorios). Delega en `InventoryTransfersService.transfer`. Crea filas en pharmacy_inventory.inventory_ledger_entries, pharmacy_inventory.inventory_stock_positions. Actualiza pharmacy_inventory.inventory_stock_positions. Lee pharmacy_inventory.inventory_ledger_entries, pharmacy_inventory.inventory_locations, pharmacy_inventory.inventory_stock_positions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/pharmacy_inventory/controllers/pharmacy-inventory.controller.ts:87` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmacyId | `src/modules/pharmacy_inventory/controllers/pharmacy-inventory.controller.ts:87` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharmacy_inventory.inventory_ledger_entries` | ESCRIBE | CREA | DIRECTA | PharmacyInventoryController.transfer → InventoryTransfersService.transfer → LedgerRepository.append | `src/modules/pharmacy_inventory/repositories/ledger.repository.ts:138` |
| `pharmacy_inventory.inventory_ledger_entries` | LEE | LEE | POR_SQL | PharmacyInventoryController.transfer → InventoryTransfersService.transfer → LedgerRepository.nextSequence | `src/modules/pharmacy_inventory/repositories/ledger.repository.ts:109` |
| `pharmacy_inventory.inventory_locations` | LEE | LEE | DIRECTA | PharmacyInventoryController.transfer → InventoryTransfersService.transfer → LocationsRepository.findById | `src/modules/pharmacy_inventory/repositories/locations.repository.ts:57` |
| `pharmacy_inventory.inventory_stock_positions` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyInventoryController.transfer → InventoryTransfersService.transfer | `src/modules/pharmacy_inventory/services/inventory-transfers.service.ts:137` |
| `pharmacy_inventory.inventory_stock_positions` | ESCRIBE | CREA | DIRECTA | PharmacyInventoryController.transfer → InventoryTransfersService.transfer → StockPositionsRepository.create | `src/modules/pharmacy_inventory/repositories/stock-positions.repository.ts:112` |
| `pharmacy_inventory.inventory_stock_positions` | LEE | LEE | DIRECTA | PharmacyInventoryController.transfer → InventoryTransfersService.transfer → StockPositionsRepository.findByKeyForUpdate | `src/modules/pharmacy_inventory/repositories/stock-positions.repository.ts:82` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmacyId` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateTransferDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `pharmacySiteId` | `string` | Sí | formato uuid | `@IsUUID()` | Sede de farmacia | `src/modules/pharmacy_inventory/dto/create-transfer.dto.ts:11` |
| `pharmacyProductId` | `string` | Sí | formato uuid | `@IsUUID()` | Producto de farmacia | `src/modules/pharmacy_inventory/dto/create-transfer.dto.ts:18` |
| `fromLocationId` | `string` | Sí | formato uuid | `@IsUUID()` | Ubicación origen | `src/modules/pharmacy_inventory/dto/create-transfer.dto.ts:25` |
| `toLocationId` | `string` | Sí | formato uuid | `@IsUUID()` | Ubicación destino | `src/modules/pharmacy_inventory/dto/create-transfer.dto.ts:32` |
| `inventoryLotId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Lote específico | `src/modules/pharmacy_inventory/dto/create-transfer.dto.ts:40` |
| `quantity` | `number` | Sí | mínimo 0 | `@IsNumber()` `@Min(0)` | Cantidad a transferir | `src/modules/pharmacy_inventory/dto/create-transfer.dto.ts:48` |

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
| `correlationId` | `string` | Sí | formato uuid | — | Identificador asociado a correlation. | `src/modules/pharmacy_inventory/dto/responses.dto.ts:108` |
| `outLedgerEntryId` | `string` | Sí | formato uuid | — | Identificador asociado a out ledger entry. | `src/modules/pharmacy_inventory/dto/responses.dto.ts:114` |
| `inLedgerEntryId` | `string` | Sí | formato uuid | — | Identificador asociado a in ledger entry. | `src/modules/pharmacy_inventory/dto/responses.dto.ts:120` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Ubicación origen no encontrada; ResourceNotFoundException: Ubicación destino no encontrada |
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
- **Implementación:** `PharmacyInventoryController.openCountSession` — `src/modules/pharmacy_inventory/controllers/pharmacy-inventory.controller.ts:100`

### Qué es y para qué sirve (negocio)

Iniciar y congelar una sesión de conteo (UC-25-06). Dentro del módulo (descripción del modelo, en inglés): «Prevents overselling and untraceable adjustments under concurrent manual, API, dispensing and receiving operations.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_25_pharmacy_inventory.puml:20`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`POST /pharmacy/{siteId}/count-sessions` la atiende `PharmacyInventoryController.openCountSession` (src/modules/pharmacy_inventory/controllers/pharmacy-inventory.controller.ts:100). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateCountSessionDto` (5 campos, 3 obligatorios). Delega en `InventoryCountService.openSession`. Crea filas en pharmacy_inventory.inventory_count_lines, pharmacy_inventory.inventory_count_sessions. Lee pharmacy_inventory.inventory_count_sessions, pharmacy_inventory.inventory_locations, pharmacy_inventory.inventory_stock_positions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/pharmacy_inventory/controllers/pharmacy-inventory.controller.ts:100` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_RUTA | Deben ser UUID válidos: siteId | `src/modules/pharmacy_inventory/controllers/pharmacy-inventory.controller.ts:100` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharmacy_inventory.inventory_count_lines` | ESCRIBE | CREA | DIRECTA | PharmacyInventoryController.openCountSession → InventoryCountService.openSession → CountSessionsRepository.createLine | `src/modules/pharmacy_inventory/repositories/count-sessions.repository.ts:168` |
| `pharmacy_inventory.inventory_count_sessions` | ESCRIBE | CREA | DIRECTA | PharmacyInventoryController.openCountSession → InventoryCountService.openSession → CountSessionsRepository.create | `src/modules/pharmacy_inventory/repositories/count-sessions.repository.ts:142` |
| `pharmacy_inventory.inventory_count_sessions` | LEE | LEE | DIRECTA | PharmacyInventoryController.openCountSession → InventoryCountService.openSession → CountSessionsRepository.countOpenAtLocation | `src/modules/pharmacy_inventory/repositories/count-sessions.repository.ts:97` |
| `pharmacy_inventory.inventory_locations` | LEE | LEE | DIRECTA | PharmacyInventoryController.openCountSession → InventoryCountService.openSession → LocationsRepository.findById | `src/modules/pharmacy_inventory/repositories/locations.repository.ts:57` |
| `pharmacy_inventory.inventory_stock_positions` | LEE | LEE | DIRECTA | PharmacyInventoryController.openCountSession → InventoryCountService.openSession → StockPositionsRepository.findByKey | `src/modules/pharmacy_inventory/repositories/stock-positions.repository.ts:65` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `siteId` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateCountSessionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `inventoryLocationId` | `string` | Sí | formato uuid | `@IsUUID()` | Ubicación a contar | `src/modules/pharmacy_inventory/dto/create-count-session.dto.ts:36` |
| `freeze` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Congelar movimientos durante el conteo | `src/modules/pharmacy_inventory/dto/create-count-session.dto.ts:46` |
| `items` | `array<CountSessionItemDto>` | Sí | — | `@IsArray()` `@ValidateNested({ each: true })` `@Type(() => CountSessionItemDto)` | Productos/lotes a contar | `src/modules/pharmacy_inventory/dto/create-count-session.dto.ts:58` |
| `items[].pharmacyProductId` | `string` | Sí | formato uuid | `@IsUUID()` | Producto de farmacia | `src/modules/pharmacy_inventory/dto/create-count-session.dto.ts:18` |
| `items[].inventoryLotId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Lote específico | `src/modules/pharmacy_inventory/dto/create-count-session.dto.ts:26` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/pharmacy_inventory/dto/responses.dto.ts:87` |
| `lineIds` | `array<string>` | Sí | — | — | Ids de líneas de conteo | `src/modules/pharmacy_inventory/dto/responses.dto.ts:93` |
| `adjustments` | `number` | Sí | — | — | Número de ajustes generados | `src/modules/pharmacy_inventory/dto/responses.dto.ts:99` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Ubicación no encontrada |
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
- **Implementación:** `PharmacyInventoryController.createLocation` — `src/modules/pharmacy_inventory/controllers/pharmacy-inventory.controller.ts:61`

### Qué es y para qué sirve (negocio)

Crear una ubicación de inventario. Dentro del módulo (descripción del modelo, en inglés): «Prevents overselling and untraceable adjustments under concurrent manual, API, dispensing and receiving operations.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_25_pharmacy_inventory.puml:20`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`POST /pharmacy/{siteId}/inventory-locations` la atiende `PharmacyInventoryController.createLocation` (src/modules/pharmacy_inventory/controllers/pharmacy-inventory.controller.ts:61). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateLocationDto` (4 campos, 2 obligatorios). Delega en `InventoryLocationsService.create`. Crea filas en pharmacy_inventory.inventory_locations.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/pharmacy_inventory/controllers/pharmacy-inventory.controller.ts:61` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_RUTA | Deben ser UUID válidos: siteId | `src/modules/pharmacy_inventory/controllers/pharmacy-inventory.controller.ts:61` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharmacy_inventory.inventory_locations` | ESCRIBE | CREA | DIRECTA | PharmacyInventoryController.createLocation → InventoryLocationsService.create → LocationsRepository.create | `src/modules/pharmacy_inventory/repositories/locations.repository.ts:68` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `siteId` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateLocationDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `code` | `string` | Sí | longitud máxima 64 | `@IsString()` `@MaxLength(64)` | Código de la ubicación | `src/modules/pharmacy_inventory/dto/create-location.dto.ts:18` |
| `name` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Nombre legible de la ubicación | `src/modules/pharmacy_inventory/dto/create-location.dto.ts:26` |
| `parentLocationId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Ubicación padre (jerarquía) | `src/modules/pharmacy_inventory/dto/create-location.dto.ts:37` |
| `controlledAccess` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Requiere acceso controlado | `src/modules/pharmacy_inventory/dto/create-location.dto.ts:45` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/pharmacy_inventory/dto/responses.dto.ts:9` |

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
- **Implementación:** `PharmacyInventoryController.approveCountSession` — `src/modules/pharmacy_inventory/controllers/pharmacy-inventory.controller.ts:115`

### Qué es y para qué sirve (negocio)

Aprobar conteo y ajustar ledger por varianza (UC-25-07). Dentro del módulo (descripción del modelo, en inglés): «Prevents overselling and untraceable adjustments under concurrent manual, API, dispensing and receiving operations.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_25_pharmacy_inventory.puml:20`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`POST /pharmacy/count-sessions/{id}/approve` la atiende `PharmacyInventoryController.approveCountSession` (src/modules/pharmacy_inventory/controllers/pharmacy-inventory.controller.ts:115). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `ApproveCountSessionDto` (3 campos, 3 obligatorios). Delega en `InventoryCountService.approve`. Crea filas en pharmacy_inventory.inventory_ledger_entries. Actualiza pharmacy_inventory.inventory_count_lines, pharmacy_inventory.inventory_count_sessions, pharmacy_inventory.inventory_stock_positions. Lee pharmacy_inventory.inventory_count_lines, pharmacy_inventory.inventory_count_sessions, pharmacy_inventory.inventory_ledger_entries, pharmacy_inventory.inventory_stock_positions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/pharmacy_inventory/controllers/pharmacy-inventory.controller.ts:115` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/pharmacy_inventory/controllers/pharmacy-inventory.controller.ts:115` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharmacy_inventory.inventory_count_lines` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyInventoryController.approveCountSession → InventoryCountService.approve | `src/modules/pharmacy_inventory/services/inventory-count.service.ts:188` |
| `pharmacy_inventory.inventory_count_lines` | LEE | LEE | DIRECTA | PharmacyInventoryController.approveCountSession → InventoryCountService.approve → CountSessionsRepository.findLineById | `src/modules/pharmacy_inventory/repositories/count-sessions.repository.ts:128` |
| `pharmacy_inventory.inventory_count_sessions` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyInventoryController.approveCountSession → InventoryCountService.approve | `src/modules/pharmacy_inventory/services/inventory-count.service.ts:229` |
| `pharmacy_inventory.inventory_count_sessions` | LEE | LEE | DIRECTA | PharmacyInventoryController.approveCountSession → InventoryCountService.approve → CountSessionsRepository.findById | `src/modules/pharmacy_inventory/repositories/count-sessions.repository.ts:88` |
| `pharmacy_inventory.inventory_ledger_entries` | ESCRIBE | CREA | DIRECTA | PharmacyInventoryController.approveCountSession → InventoryCountService.approve → LedgerRepository.append | `src/modules/pharmacy_inventory/repositories/ledger.repository.ts:138` |
| `pharmacy_inventory.inventory_ledger_entries` | LEE | LEE | POR_SQL | PharmacyInventoryController.approveCountSession → InventoryCountService.approve → LedgerRepository.nextSequence | `src/modules/pharmacy_inventory/repositories/ledger.repository.ts:109` |
| `pharmacy_inventory.inventory_stock_positions` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyInventoryController.approveCountSession → InventoryCountService.approve | `src/modules/pharmacy_inventory/services/inventory-count.service.ts:217` |
| `pharmacy_inventory.inventory_stock_positions` | LEE | LEE | DIRECTA | PharmacyInventoryController.approveCountSession → InventoryCountService.approve → StockPositionsRepository.findByKeyForUpdate | `src/modules/pharmacy_inventory/repositories/stock-positions.repository.ts:82` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `ApproveCountSessionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `counts` | `array<CountResultDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => CountResultDto)` | — | `src/modules/pharmacy_inventory/dto/approve-count-session.dto.ts:40` |
| `counts[].lineId` | `string` | Sí | formato uuid | `@IsUUID()` | Línea de conteo | `src/modules/pharmacy_inventory/dto/approve-count-session.dto.ts:19` |
| `counts[].countedQuantity` | `number` | Sí | mínimo 0 | `@IsNumber()` `@Min(0)` | Cantidad efectivamente contada | `src/modules/pharmacy_inventory/dto/approve-count-session.dto.ts:27` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/pharmacy_inventory/dto/responses.dto.ts:87` |
| `lineIds` | `array<string>` | Sí | — | — | Ids de líneas de conteo | `src/modules/pharmacy_inventory/dto/responses.dto.ts:93` |
| `adjustments` | `number` | Sí | — | — | Número de ajustes generados | `src/modules/pharmacy_inventory/dto/responses.dto.ts:99` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Sesión de conteo no encontrada; ResourceNotFoundException: Línea de conteo no encontrada |
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
- **Implementación:** `PharmacyDispensingController.reverse` — `src/modules/pharmacy_inventory/controllers/pharmacy-dispensing.controller.ts:48`

### Qué es y para qué sirve (negocio)

Reversar una dispensación (UC-25-11). Dentro del módulo (descripción del modelo, en inglés): «Prevents overselling and untraceable adjustments under concurrent manual, API, dispensing and receiving operations.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_25_pharmacy_inventory.puml:20`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`POST /pharmacy/dispensations/{id}/reverse` la atiende `PharmacyDispensingController.reverse` (src/modules/pharmacy_inventory/controllers/pharmacy-dispensing.controller.ts:48). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `ReverseDispensationDto` (2 campos, 0 obligatorios). Delega en `MedicationDispensationsService.reverse`. Crea filas en pharmacy_inventory.inventory_ledger_entries. Actualiza pharmacy_inventory.inventory_stock_positions, pharmacy_inventory.medication_dispensations. Lee pharmacy_inventory.inventory_ledger_entries, pharmacy_inventory.inventory_stock_positions, pharmacy_inventory.medication_dispensation_lines, pharmacy_inventory.medication_dispensations.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/pharmacy_inventory/controllers/pharmacy-dispensing.controller.ts:48` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/pharmacy_inventory/controllers/pharmacy-dispensing.controller.ts:48` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharmacy_inventory.inventory_ledger_entries` | ESCRIBE | CREA | DIRECTA | PharmacyDispensingController.reverse → MedicationDispensationsService.reverse → LedgerRepository.append | `src/modules/pharmacy_inventory/repositories/ledger.repository.ts:138` |
| `pharmacy_inventory.inventory_ledger_entries` | LEE | LEE | POR_SQL | PharmacyDispensingController.reverse → MedicationDispensationsService.reverse → LedgerRepository.nextSequence | `src/modules/pharmacy_inventory/repositories/ledger.repository.ts:109` |
| `pharmacy_inventory.inventory_stock_positions` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyDispensingController.reverse → MedicationDispensationsService.reverse | `src/modules/pharmacy_inventory/services/medication-dispensations.service.ts:303` |
| `pharmacy_inventory.inventory_stock_positions` | LEE | LEE | DIRECTA | PharmacyDispensingController.reverse → MedicationDispensationsService.reverse → StockPositionsRepository.findByKeyForUpdate | `src/modules/pharmacy_inventory/repositories/stock-positions.repository.ts:82` |
| `pharmacy_inventory.medication_dispensation_lines` | LEE | LEE | DIRECTA | PharmacyDispensingController.reverse → MedicationDispensationsService.reverse → DispensationsRepository.findLines | `src/modules/pharmacy_inventory/repositories/dispensations.repository.ts:130` |
| `pharmacy_inventory.medication_dispensations` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyDispensingController.reverse → MedicationDispensationsService.reverse | `src/modules/pharmacy_inventory/services/medication-dispensations.service.ts:274` |
| `pharmacy_inventory.medication_dispensations` | LEE | LEE | DIRECTA | PharmacyDispensingController.reverse → MedicationDispensationsService.reverse → DispensationsRepository.findById | `src/modules/pharmacy_inventory/repositories/dispensations.repository.ts:107` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `ReverseDispensationDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reason` | `string` | No | longitud máxima 256 | `@IsOptional()` `@IsString()` `@MaxLength(256)` | Motivo de la reversión | `src/modules/pharmacy_inventory/dto/reverse-dispensation.dto.ts:13` |
| `inventoryLocationId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Ubicación a la que se reintegra el stock | `src/modules/pharmacy_inventory/dto/reverse-dispensation.dto.ts:24` |

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
| 404 | `NOT_FOUND` | ResourceNotFoundException: Dispensación no encontrada |
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
- **Implementación:** `PharmacyOrdersController.listForTenant` — `src/modules/pharmacy_inventory/controllers/pharmacy-orders.controller.ts:58`

### Qué es y para qué sirve (negocio)

Bandeja de pedidos de las farmacias del tenant (FAR-E2). Dentro del módulo (descripción del modelo, en inglés): «Prevents overselling and untraceable adjustments under concurrent manual, API, dispensing and receiving operations.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_25_pharmacy_inventory.puml:20`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`GET /pharmacy/orders` la atiende `PharmacyOrdersController.listForTenant` (src/modules/pharmacy_inventory/controllers/pharmacy-orders.controller.ts:58). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `PharmacyOrdersService.listForPharmacyTenant`. Crea filas en messaging.domain_events, messaging.in_app_notifications, messaging.notification_deliveries, messaging.notification_requests, messaging.outbox_messages, pharmacy_inventory.inventory_ledger_entries. Actualiza pharmacy_inventory.inventory_reservation_lines, pharmacy_inventory.inventory_reservations, pharmacy_inventory.inventory_stock_positions. Lee clinical.medication_requests, messaging.in_app_notifications, messaging.message_channels, messaging.messaging_providers, messaging.outbox_messages, messaging.provider_channel_configs, messaging.recipient_preferences, pharmacy_inventory.inventory_ledger_entries y 11 más. Publica PharmacyOrderExpired.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/pharmacy_inventory/controllers/pharmacy-orders.controller.ts:58` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.medication_requests` | LEE | LEE | DIRECTA | PharmacyOrdersController.listForTenant → PharmacyOrdersService.listForPharmacyTenant → PharmacyOrdersService.expireDue → PharmacyOrdersRepository.findPrescriberProfileId | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:276` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.listForTenant → PharmacyOrdersService.listForPharmacyTenant → PharmacyOrdersService.expireDue → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.in_app_notifications` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.listForTenant → PharmacyOrdersService.listForPharmacyTenant → PharmacyOrdersService.expireDue → PharmacyOrderNotificationsService.expiredToPrescriber → PharmacyOrderNotificationsService.emitToPerson → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createInAppNotification | `src/modules/messaging/repositories/notifications.repository.ts:710` |
| `messaging.in_app_notifications` | LEE | LEE | DIRECTA | PharmacyOrdersController.listForTenant → PharmacyOrdersService.listForPharmacyTenant → PharmacyOrdersService.expireDue → PharmacyOrderNotificationsService.expiredToPrescriber → PharmacyOrderNotificationsService.emitToPerson → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findUnreadInAppForResource | `src/modules/messaging/repositories/notifications.repository.ts:845` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | PharmacyOrdersController.listForTenant → PharmacyOrdersService.listForPharmacyTenant → PharmacyOrdersService.expireDue → PharmacyOrderNotificationsService.expiredToPrescriber → PharmacyOrderNotificationsService.emitToPerson → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findActiveChannelByType | `src/modules/messaging/repositories/notifications.repository.ts:189` |
| `messaging.messaging_providers` | LEE | LEE | DIRECTA | PharmacyOrdersController.listForTenant → PharmacyOrdersService.listForPharmacyTenant → PharmacyOrdersService.expireDue → PharmacyOrderNotificationsService.expiredToPrescriber → PharmacyOrderNotificationsService.emitToPerson → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findProviderById | `src/modules/messaging/repositories/notifications.repository.ts:437` |
| `messaging.notification_deliveries` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.listForTenant → PharmacyOrdersService.listForPharmacyTenant → PharmacyOrdersService.expireDue → PharmacyOrderNotificationsService.expiredToPrescriber → PharmacyOrderNotificationsService.emitToPerson → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createDelivery | `src/modules/messaging/repositories/notifications.repository.ts:514` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.listForTenant → PharmacyOrdersService.listForPharmacyTenant → PharmacyOrdersService.expireDue → PharmacyOrderNotificationsService.expiredToPrescriber → PharmacyOrderNotificationsService.emitToPerson → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.listForTenant → PharmacyOrdersService.listForPharmacyTenant → PharmacyOrdersService.expireDue → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:164` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | PharmacyOrdersController.listForTenant → PharmacyOrdersService.listForPharmacyTenant → PharmacyOrdersService.expireDue → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:188` |
| `messaging.provider_channel_configs` | LEE | LEE | DIRECTA | PharmacyOrdersController.listForTenant → PharmacyOrdersService.listForPharmacyTenant → PharmacyOrdersService.expireDue → PharmacyOrderNotificationsService.expiredToPrescriber → PharmacyOrderNotificationsService.emitToPerson → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findChannelConfigs | `src/modules/messaging/repositories/notifications.repository.ts:405` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | PharmacyOrdersController.listForTenant → PharmacyOrdersService.listForPharmacyTenant → PharmacyOrdersService.expireDue → PharmacyOrderNotificationsService.expiredToPrescriber → PharmacyOrderNotificationsService.emitToPerson → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `pharmacy_inventory.inventory_ledger_entries` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.listForTenant → PharmacyOrdersService.listForPharmacyTenant → PharmacyOrdersService.expireDue → InventoryReservationsService.releaseConfirmedLines → LedgerRepository.append | `src/modules/pharmacy_inventory/repositories/ledger.repository.ts:138` |
| `pharmacy_inventory.inventory_ledger_entries` | LEE | LEE | POR_SQL | PharmacyOrdersController.listForTenant → PharmacyOrdersService.listForPharmacyTenant → PharmacyOrdersService.expireDue → InventoryReservationsService.releaseConfirmedLines → LedgerRepository.nextSequence | `src/modules/pharmacy_inventory/repositories/ledger.repository.ts:109` |
| `pharmacy_inventory.inventory_reservation_lines` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyOrdersController.listForTenant → PharmacyOrdersService.listForPharmacyTenant → PharmacyOrdersService.expireDue → InventoryReservationsService.releaseConfirmedLines | `src/modules/pharmacy_inventory/services/inventory-reservations.service.ts:238` |
| `pharmacy_inventory.inventory_reservation_lines` | LEE | LEE | DIRECTA | PharmacyOrdersController.listForTenant → PharmacyOrdersService.listForPharmacyTenant → PharmacyOrdersService.composeOrders → PharmacyOrdersRepository.findLinesByReservationIds | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:212` |
| `pharmacy_inventory.inventory_reservations` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyOrdersController.listForTenant → PharmacyOrdersService.listForPharmacyTenant → PharmacyOrdersService.expireDue | `src/modules/pharmacy_inventory/services/pharmacy-orders.service.ts:1532` |
| `pharmacy_inventory.inventory_reservations` | LEE | LEE | DIRECTA | PharmacyOrdersController.listForTenant → PharmacyOrdersService.listForPharmacyTenant → PharmacyOrdersRepository.findOrdersForPharmacies | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:91` |
| `pharmacy_inventory.inventory_stock_positions` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyOrdersController.listForTenant → PharmacyOrdersService.listForPharmacyTenant → PharmacyOrdersService.expireDue → InventoryReservationsService.releaseConfirmedLines | `src/modules/pharmacy_inventory/services/inventory-reservations.service.ts:266` |
| `pharmacy_inventory.inventory_stock_positions` | LEE | LEE | DIRECTA | PharmacyOrdersController.listForTenant → PharmacyOrdersService.listForPharmacyTenant → PharmacyOrdersService.expireDue → InventoryReservationsService.releaseConfirmedLines → StockPositionsRepository.findByKeyForUpdate | `src/modules/pharmacy_inventory/repositories/stock-positions.repository.ts:82` |
| `pharmacy_inventory.pharmacy_order_substitutions` | LEE | LEE | DIRECTA | PharmacyOrdersController.listForTenant → PharmacyOrdersService.listForPharmacyTenant → PharmacyOrdersService.composeOrders → PharmacyOrderSubstitutionsRepository.findByReservationIds | `src/modules/pharmacy_inventory/repositories/pharmacy-order-substitutions.repository.ts:62` |
| `pharmacy.pharmacies` | LEE | LEE | DIRECTA | PharmacyOrdersController.listForTenant → PharmacyOrdersService.listForPharmacyTenant → PharmacyOrdersRepository.findPharmaciesByTenant | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:108` |
| `pharmacy.pharmacy_products` | LEE | LEE | DIRECTA | PharmacyOrdersController.listForTenant → PharmacyOrdersService.listForPharmacyTenant → PharmacyOrdersService.composeOrders → PharmacyOrdersRepository.findProductsByIds | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:242` |
| `pharmacy.pharmacy_sites` | LEE | LEE | DIRECTA | PharmacyOrdersController.listForTenant → PharmacyOrdersService.listForPharmacyTenant → PharmacyOrdersService.composeOrders → PharmacyOrdersRepository.findSitesByIds | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:233` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | PharmacyOrdersController.listForTenant → PharmacyOrdersService.listForPharmacyTenant → PharmacyOrdersService.expireDue → PharmacyOrderNotificationsService.expiredToPrescriber → PharmacyOrderNotificationsService.emitToPerson → PersonAccountLinksRepository.findActiveByPerson | `src/modules/profiles/repositories/person-account-links.repository.ts:101` |
| `profiles.person_profiles` | LEE | LEE | DIRECTA | PharmacyOrdersController.listForTenant → PharmacyOrdersService.listForPharmacyTenant → PharmacyOrdersService.composeOrders → PharmacyOrdersRepository.findPersonNamesByProfileIds | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:135` |
| `profiles.persons` | LEE | LEE | DIRECTA | PharmacyOrdersController.listForTenant → PharmacyOrdersService.listForPharmacyTenant → PharmacyOrdersService.composeOrders → PharmacyOrdersRepository.findPersonNamesByProfileIds | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:127` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | PharmacyOrdersController.listForTenant → PharmacyOrdersService.listForPharmacyTenant → PharmacyOrdersService.composeOrders → PharmacyOrdersRepository.findConceptsByIds | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:288` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `PharmacyOrderExpired` | `src/modules/pharmacy_inventory/services/pharmacy-orders.service.ts:1537` |

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
| `items` | `array<PharmacyOrderDto>` | Sí | — | — | Pedidos del paciente, más nuevos primero. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:501` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador único del pedido. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:204` |
| `items[].status` | `InventoryConceptDto` | Sí | — | — | Estado del pedido (`PINV_ORDER_*`). | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:210` |
| `items[].status.code` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `items[].status.display` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `items[].createdAt` | `string` | Sí | — | — | Instante de creación, ISO 8601. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:216` |
| `items[].expiresAt` | `string` | Sí | — | — | Vencimiento vigente del pedido, ISO 8601 (48 h desde la creación; el carril E2 la renueva al dejarlo listo para retiro). | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:223` |
| `items[].siteId` | `string` | Sí | formato uuid | — | Identificador asociado a site. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:229` |
| `items[].siteName` | `string` | Sí | — | — | Nombre de la sede. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:235` |
| `items[].pharmacyId` | `string` | Sí | formato uuid | — | Identificador asociado a pharmacy. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:241` |
| `items[].pharmacyName` | `string` | Sí | — | — | Nombre de la farmacia (comercial, o la razón social). | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:247` |
| `items[].medicationRequestId` | `string` | No | formato uuid; admite null | — | Receta que respalda el pedido, si la hay. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:253` |
| `items[].patientName` | `string` | No | admite null | — | Nombre pintable del paciente, resuelto en lote por el backend (la bandeja FAR-E2 lo necesita; cero UUIDs como copy). `null` si la persona no tiene nombre cargado. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:261` |
| `items[].deliveryMode` | `InventoryConceptDto` | No | — | — | Modalidad de entrega (`PINV_DELIVERY_*`), resuelta. `null` en pedidos anteriores al modelo v4.2.1, que no la declararon. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:268` |
| `items[].deliveryMode.code` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `items[].deliveryMode.display` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `items[].pickupCode` | `string` | No | admite null | — | Código de retiro del pedido, sellado al quedar `LISTO_PARA_RETIRO`. **Solo en la lectura del titular**: es la prueba de posesión con que la persona retira, así que la bandeja y las lecturas de staff lo sirven `null` — el mostrador no valida mirándolo, valida enviándolo en `POST /pharmacy/orders/:id/dispense`. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:279` |
| `items[].totalAmount` | `string` | No | admite null | — | Total CONGELADO del pedido con su moneda: suma de los precios congelados por el saldo reservado de cada renglón en pie. `null` si a algún renglón le falta precio publicado o si las listas mezclan monedas — una suma con huecos o que mezcla monedas afirma un costo que nadie publicó. Se re-congela cuando el pedido cambia (línea no disponible, sustitución aceptada); jamás se recalcula en una lectura. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:290` |
| `items[].currency` | `InventoryConceptDto` | No | — | — | Moneda del total congelado, resuelta. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:296` |
| `items[].currency.code` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `items[].currency.display` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `items[].rejectionReasonText` | `string` | No | admite null | — | Motivo del rechazo, en palabras, cuando el estado es `RECHAZADO` (v4.2.1 lo persiste). `null` en cualquier otro estado. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:303` |
| `items[].substitutions` | `array<PharmacyOrderSubstitutionDto>` | Sí | — | — | La historia de propuestas de sustitución del pedido, más nuevas primero. Las decididas conservan su estado y su `decidedAt`: son bitácora, no un campo mutable. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:311` |
| `items[].substitutions[].id` | `string` | Sí | formato uuid | — | Identificador de la propuesta. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:326` |
| `items[].substitutions[].originalProductId` | `string` | Sí | formato uuid | — | Producto recetado/pedido. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:332` |
| `items[].substitutions[].originalName` | `string` | Sí | — | — | Nombre pintable del original. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:338` |
| `items[].substitutions[].originalUnitPriceAmount` | `string` | No | admite null | — | Precio congelado del original al proponer, o `null` sin precio publicado. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:344` |
| `items[].substitutions[].proposedProductId` | `string` | Sí | formato uuid | — | Producto propuesto (mismo medicamento del vademécum). | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:350` |
| `items[].substitutions[].proposedName` | `string` | Sí | — | — | Nombre pintable del propuesto. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:356` |
| `items[].substitutions[].proposedUnitPriceAmount` | `string` | No | admite null | — | Precio congelado del propuesto: la oferta que el paciente decidió. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:362` |
| `items[].substitutions[].currency` | `InventoryConceptDto` | No | — | — | Moneda de la oferta, resuelta. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:368` |
| `items[].substitutions[].currency.code` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `items[].substitutions[].currency.display` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `items[].substitutions[].status` | `InventoryConceptDto` | Sí | — | — | Estado de la propuesta (`PINV_SUBSTITUTION_*`), resuelto. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:374` |
| `items[].substitutions[].status.code` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `items[].substitutions[].status.display` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `items[].substitutions[].decidedAt` | `string` | No | admite null | — | Cuándo se decidió (aceptó/rechazó/retiró), ISO 8601; `null` en pie. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:380` |
| `items[].lines` | `array<PharmacyOrderLineDto>` | Sí | — | — | Líneas del pedido. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:317` |
| `items[].lines[].productId` | `string` | Sí | formato uuid | — | Identificador asociado a product. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:118` |
| `items[].lines[].productCode` | `string` | Sí | — | — | Código interno del producto. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:124` |
| `items[].lines[].brandName` | `string` | No | admite null | — | Nombre comercial. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:130` |
| `items[].lines[].genericName` | `string` | No | admite null | — | Nombre genérico. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:136` |
| `items[].lines[].strengthText` | `string` | No | admite null | — | Concentración, legible. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:142` |
| `items[].lines[].packageSizeText` | `string` | No | admite null | — | Presentación, legible. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:148` |
| `items[].lines[].medication` | `InventoryConceptDto` | No | — | — | Medicamento del vademécum, resuelto. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:154` |
| `items[].lines[].medication.code` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `items[].lines[].medication.display` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `items[].lines[].requestedQuantity` | `number` | Sí | — | — | Cantidad solicitada por el paciente. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:160` |
| `items[].lines[].reservedQuantity` | `number` | Sí | — | — | Cantidad efectivamente reservada; `0` cuando la línea quedó sin stock. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:166` |
| `items[].lines[].fulfilledQuantity` | `number` | Sí | — | — | Cantidad ya entregada en el mostrador, acumulada entre entregas parciales (FAR-E3). El saldo por retirar es `reservedQuantity − fulfilledQuantity`. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:173` |
| `items[].lines[].unitPriceAmount` | `string` | No | admite null | — | Precio unitario CONGELADO del renglón (lo que paga el paciente), sellado al crear el pedido o al aceptar una sustitución. `null` si la sede no publicaba precio: el GET no recalcula — un precio congelado que se recalcula contra listas nuevas reescribe un pedido histórico. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:182` |
| `items[].lines[].currency` | `InventoryConceptDto` | No | — | — | Moneda del precio congelado, resuelta. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:188` |
| `items[].lines[].currency.code` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `items[].lines[].currency.display` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `items[].lines[].status` | `InventoryConceptDto` | Sí | — | — | Estado de la línea (`PINV_RES_LINE_CONFIRMED` reservada, `PINV_RES_LINE_OUT_OF_STOCK` sin stock, `PINV_RES_LINE_RELEASED` liberada). | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:195` |
| `items[].lines[].status.code` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `items[].lines[].status.display` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `count` | `number` | Sí | — | — | Cuántos pedidos se sirven. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:507` |

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

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / pharmacy inventory — etapa `ctrl:PharmacyOrdersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 17. POST /pharmacy/orders

- **Origen:** CONTRATO
- **Nombre:** Crear un pedido de farmacia (FAR-E1)
- **Bloque:** Farmacia
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyOrdersController.create` — `src/modules/pharmacy_inventory/controllers/pharmacy-orders.controller.ts:89`

### Qué es y para qué sirve (negocio)

Crear un pedido de farmacia (FAR-E1). Dentro del módulo (descripción del modelo, en inglés): «Prevents overselling and untraceable adjustments under concurrent manual, API, dispensing and receiving operations.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_25_pharmacy_inventory.puml:20`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`POST /pharmacy/orders` la atiende `PharmacyOrdersController.create` (src/modules/pharmacy_inventory/controllers/pharmacy-orders.controller.ts:89). Exige sesión con alguno de los roles PATIENT. Valida el cuerpo como `CreatePharmacyOrderDto` (6 campos, 4 obligatorios). Delega en `PharmacyOrdersService.create`. Crea filas en messaging.domain_events, messaging.outbox_messages, pharmacy_inventory.inventory_ledger_entries, pharmacy_inventory.inventory_reservation_lines, pharmacy_inventory.inventory_reservations. Actualiza pharmacy_inventory.inventory_reservations, pharmacy_inventory.inventory_stock_positions. Lee clinical.medication_requests, messaging.outbox_messages, pharmacy_inventory.inventory_ledger_entries, pharmacy_inventory.inventory_locations, pharmacy_inventory.inventory_reservation_lines, pharmacy_inventory.inventory_reservations, pharmacy_inventory.inventory_stock_positions, pharmacy_inventory.pharmacy_order_substitutions y 8 más. Publica PharmacyOrderSubmitted.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PATIENT | `src/modules/pharmacy_inventory/controllers/pharmacy-orders.controller.ts:89` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.medication_requests` | LEE | LEE | DIRECTA | PharmacyOrdersController.create → PharmacyOrdersService.create → PharmacyOrdersRepository.findOwnMedicationRequest | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:264` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.create → PharmacyOrdersService.create → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.create → PharmacyOrdersService.create → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:164` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | PharmacyOrdersController.create → PharmacyOrdersService.create → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:188` |
| `pharmacy_inventory.inventory_ledger_entries` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.create → PharmacyOrdersService.create → PharmacyOrdersService.reserveOrderLines → PharmacyOrdersService.reserveLineStock → LedgerRepository.append | `src/modules/pharmacy_inventory/repositories/ledger.repository.ts:138` |
| `pharmacy_inventory.inventory_ledger_entries` | LEE | LEE | POR_SQL | PharmacyOrdersController.create → PharmacyOrdersService.create → PharmacyOrdersService.reserveOrderLines → PharmacyOrdersService.reserveLineStock → LedgerRepository.nextSequence | `src/modules/pharmacy_inventory/repositories/ledger.repository.ts:109` |
| `pharmacy_inventory.inventory_locations` | LEE | LEE | DIRECTA | PharmacyOrdersController.create → PharmacyOrdersService.create → PharmacyOrdersService.reserveOrderLines → InventoryReadRepository.findActiveLocationsBySites | `src/modules/pharmacy_inventory/repositories/inventory-read.repository.ts:20` |
| `pharmacy_inventory.inventory_reservation_lines` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.create → PharmacyOrdersService.create → PharmacyOrdersService.reserveOrderLines → PharmacyOrdersService.reserveLineStock → ReservationsRepository.createLine | `src/modules/pharmacy_inventory/repositories/reservations.repository.ts:185` |
| `pharmacy_inventory.inventory_reservation_lines` | LEE | LEE | DIRECTA | PharmacyOrdersController.create → PharmacyOrdersService.create → PharmacyOrdersRepository.findLinesByReservationIds | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:212` |
| `pharmacy_inventory.inventory_reservations` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.create → PharmacyOrdersService.create → ReservationsRepository.create | `src/modules/pharmacy_inventory/repositories/reservations.repository.ts:155` |
| `pharmacy_inventory.inventory_reservations` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyOrdersController.create → PharmacyOrdersService.create → PharmacyOrdersService.sealFrozenTotal | `src/modules/pharmacy_inventory/services/pharmacy-orders.service.ts:1886` |
| `pharmacy_inventory.inventory_reservations` | LEE | LEE | DIRECTA | PharmacyOrdersController.create → PharmacyOrdersService.create → PharmacyOrdersRepository.findOrderByIdempotencyKey | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:174` |
| `pharmacy_inventory.inventory_stock_positions` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyOrdersController.create → PharmacyOrdersService.create → PharmacyOrdersService.reserveOrderLines → PharmacyOrdersService.reserveLineStock | `src/modules/pharmacy_inventory/services/pharmacy-orders.service.ts:2147` |
| `pharmacy_inventory.inventory_stock_positions` | LEE | LEE | DIRECTA | PharmacyOrdersController.create → PharmacyOrdersService.create → PharmacyOrdersService.reserveOrderLines → InventoryReadRepository.findStockPositions | `src/modules/pharmacy_inventory/repositories/inventory-read.repository.ts:40` |
| `pharmacy_inventory.pharmacy_order_substitutions` | LEE | LEE | DIRECTA | PharmacyOrdersController.create → PharmacyOrdersService.create → PharmacyOrdersService.readOwnOrder → PharmacyOrdersService.composeOrders → PharmacyOrderSubstitutionsRepository.findByReservationIds | `src/modules/pharmacy_inventory/repositories/pharmacy-order-substitutions.repository.ts:62` |
| `pharmacy.pharmacies` | LEE | LEE | DIRECTA | PharmacyOrdersController.create → PharmacyOrdersService.create → PharmacyReadRepository.findVisibleById | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:55` |
| `pharmacy.pharmacy_price_lists` | LEE | LEE | DIRECTA | PharmacyOrdersController.create → PharmacyOrdersService.create → PharmacyOrdersService.freezePricesFor → PharmacyReadRepository.findCurrentPublicPriceLists | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:166` |
| `pharmacy.pharmacy_product_prices` | LEE | LEE | DIRECTA | PharmacyOrdersController.create → PharmacyOrdersService.create → PharmacyOrdersService.freezePricesFor → PharmacyReadRepository.findCurrentPrices | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:193` |
| `pharmacy.pharmacy_products` | LEE | LEE | DIRECTA | PharmacyOrdersController.create → PharmacyOrdersService.create → PharmacyReadRepository.findActiveProductsByIds | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:148` |
| `pharmacy.pharmacy_sites` | LEE | LEE | DIRECTA | PharmacyOrdersController.create → PharmacyOrdersService.create → PharmacyReadRepository.findActiveSiteById | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:84` |
| `profiles.person_profiles` | LEE | LEE | DIRECTA | PharmacyOrdersController.create → PharmacyOrdersService.create → PharmacyOrdersService.readOwnOrder → PharmacyOrdersService.composeOrders → PharmacyOrdersRepository.findPersonNamesByProfileIds | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:135` |
| `profiles.persons` | LEE | LEE | DIRECTA | PharmacyOrdersController.create → PharmacyOrdersService.create → PharmacyOrdersService.readOwnOrder → PharmacyOrdersService.composeOrders → PharmacyOrdersRepository.findPersonNamesByProfileIds | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:127` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | PharmacyOrdersController.create → PharmacyOrdersService.create → PharmacyOrdersService.readOwnOrder → PharmacyOrdersService.composeOrders → PharmacyOrdersRepository.findConceptsByIds | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:288` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `PharmacyOrderSubmitted` | `src/modules/pharmacy_inventory/services/pharmacy-orders.service.ts:432` |

### Cuerpo — DTO `CreatePharmacyOrderDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `siteId` | `string` | Sí | formato uuid | `@IsUUID()` | Sede de farmacia | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:64` |
| `medicationRequestId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Receta (clinical.medication_requests) | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:75` |
| `idempotencyKey` | `string` | No | longitud máxima 120 | `@IsOptional()` `@IsString()` `@MaxLength(120)` | Clave de idempotencia; repetirla devuelve el mismo pedido | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:99` |
| `lines` | `array<PharmacyOrderLineInputDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => PharmacyOrderLineInputDto)` | — | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:109` |
| `lines[].productId` | `string` | Sí | formato uuid | `@IsUUID()` | Producto de farmacia | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:46` |
| `lines[].quantity` | `number` | Sí | mínimo 0; mayor que 0 | `@IsNumber()` `@IsPositive()` | Cantidad solicitada | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:54` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador único del pedido. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:204` |
| `status` | `InventoryConceptDto` | Sí | — | — | Estado del pedido (`PINV_ORDER_*`). | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:210` |
| `status.code` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `status.display` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `createdAt` | `string` | Sí | — | — | Instante de creación, ISO 8601. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:216` |
| `expiresAt` | `string` | Sí | — | — | Vencimiento vigente del pedido, ISO 8601 (48 h desde la creación; el carril E2 la renueva al dejarlo listo para retiro). | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:223` |
| `siteId` | `string` | Sí | formato uuid | — | Identificador asociado a site. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:229` |
| `siteName` | `string` | Sí | — | — | Nombre de la sede. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:235` |
| `pharmacyId` | `string` | Sí | formato uuid | — | Identificador asociado a pharmacy. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:241` |
| `pharmacyName` | `string` | Sí | — | — | Nombre de la farmacia (comercial, o la razón social). | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:247` |
| `medicationRequestId` | `string` | No | formato uuid; admite null | — | Receta que respalda el pedido, si la hay. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:253` |
| `patientName` | `string` | No | admite null | — | Nombre pintable del paciente, resuelto en lote por el backend (la bandeja FAR-E2 lo necesita; cero UUIDs como copy). `null` si la persona no tiene nombre cargado. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:261` |
| `deliveryMode` | `InventoryConceptDto` | No | — | — | Modalidad de entrega (`PINV_DELIVERY_*`), resuelta. `null` en pedidos anteriores al modelo v4.2.1, que no la declararon. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:268` |
| `deliveryMode.code` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `deliveryMode.display` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `pickupCode` | `string` | No | admite null | — | Código de retiro del pedido, sellado al quedar `LISTO_PARA_RETIRO`. **Solo en la lectura del titular**: es la prueba de posesión con que la persona retira, así que la bandeja y las lecturas de staff lo sirven `null` — el mostrador no valida mirándolo, valida enviándolo en `POST /pharmacy/orders/:id/dispense`. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:279` |
| `totalAmount` | `string` | No | admite null | — | Total CONGELADO del pedido con su moneda: suma de los precios congelados por el saldo reservado de cada renglón en pie. `null` si a algún renglón le falta precio publicado o si las listas mezclan monedas — una suma con huecos o que mezcla monedas afirma un costo que nadie publicó. Se re-congela cuando el pedido cambia (línea no disponible, sustitución aceptada); jamás se recalcula en una lectura. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:290` |
| `currency` | `InventoryConceptDto` | No | — | — | Moneda del total congelado, resuelta. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:296` |
| `currency.code` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `currency.display` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `rejectionReasonText` | `string` | No | admite null | — | Motivo del rechazo, en palabras, cuando el estado es `RECHAZADO` (v4.2.1 lo persiste). `null` en cualquier otro estado. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:303` |
| `substitutions` | `array<PharmacyOrderSubstitutionDto>` | Sí | — | — | La historia de propuestas de sustitución del pedido, más nuevas primero. Las decididas conservan su estado y su `decidedAt`: son bitácora, no un campo mutable. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:311` |
| `substitutions[].id` | `string` | Sí | formato uuid | — | Identificador de la propuesta. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:326` |
| `substitutions[].originalProductId` | `string` | Sí | formato uuid | — | Producto recetado/pedido. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:332` |
| `substitutions[].originalName` | `string` | Sí | — | — | Nombre pintable del original. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:338` |
| `substitutions[].originalUnitPriceAmount` | `string` | No | admite null | — | Precio congelado del original al proponer, o `null` sin precio publicado. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:344` |
| `substitutions[].proposedProductId` | `string` | Sí | formato uuid | — | Producto propuesto (mismo medicamento del vademécum). | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:350` |
| `substitutions[].proposedName` | `string` | Sí | — | — | Nombre pintable del propuesto. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:356` |
| `substitutions[].proposedUnitPriceAmount` | `string` | No | admite null | — | Precio congelado del propuesto: la oferta que el paciente decidió. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:362` |
| `substitutions[].currency` | `InventoryConceptDto` | No | — | — | Moneda de la oferta, resuelta. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:368` |
| `substitutions[].currency.code` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `substitutions[].currency.display` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `substitutions[].status` | `InventoryConceptDto` | Sí | — | — | Estado de la propuesta (`PINV_SUBSTITUTION_*`), resuelto. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:374` |
| `substitutions[].status.code` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `substitutions[].status.display` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `substitutions[].decidedAt` | `string` | No | admite null | — | Cuándo se decidió (aceptó/rechazó/retiró), ISO 8601; `null` en pie. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:380` |
| `lines` | `array<PharmacyOrderLineDto>` | Sí | — | — | Líneas del pedido. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:317` |
| `lines[].productId` | `string` | Sí | formato uuid | — | Identificador asociado a product. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:118` |
| `lines[].productCode` | `string` | Sí | — | — | Código interno del producto. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:124` |
| `lines[].brandName` | `string` | No | admite null | — | Nombre comercial. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:130` |
| `lines[].genericName` | `string` | No | admite null | — | Nombre genérico. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:136` |
| `lines[].strengthText` | `string` | No | admite null | — | Concentración, legible. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:142` |
| `lines[].packageSizeText` | `string` | No | admite null | — | Presentación, legible. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:148` |
| `lines[].medication` | `InventoryConceptDto` | No | — | — | Medicamento del vademécum, resuelto. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:154` |
| `lines[].medication.code` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `lines[].medication.display` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `lines[].requestedQuantity` | `number` | Sí | — | — | Cantidad solicitada por el paciente. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:160` |
| `lines[].reservedQuantity` | `number` | Sí | — | — | Cantidad efectivamente reservada; `0` cuando la línea quedó sin stock. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:166` |
| `lines[].fulfilledQuantity` | `number` | Sí | — | — | Cantidad ya entregada en el mostrador, acumulada entre entregas parciales (FAR-E3). El saldo por retirar es `reservedQuantity − fulfilledQuantity`. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:173` |
| `lines[].unitPriceAmount` | `string` | No | admite null | — | Precio unitario CONGELADO del renglón (lo que paga el paciente), sellado al crear el pedido o al aceptar una sustitución. `null` si la sede no publicaba precio: el GET no recalcula — un precio congelado que se recalcula contra listas nuevas reescribe un pedido histórico. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:182` |
| `lines[].currency` | `InventoryConceptDto` | No | — | — | Moneda del precio congelado, resuelta. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:188` |
| `lines[].currency.code` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `lines[].currency.display` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `lines[].status` | `InventoryConceptDto` | Sí | — | — | Estado de la línea (`PINV_RES_LINE_CONFIRMED` reservada, `PINV_RES_LINE_OUT_OF_STOCK` sin stock, `PINV_RES_LINE_RELEASED` liberada). | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:195` |
| `lines[].status.code` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `lines[].status.display` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |

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
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyOrdersController.getOrder` — `src/modules/pharmacy_inventory/controllers/pharmacy-orders.controller.ts:121`

### Qué es y para qué sirve (negocio)

Consultar un pedido de farmacia (FAR-E1). Dentro del módulo (descripción del modelo, en inglés): «Prevents overselling and untraceable adjustments under concurrent manual, API, dispensing and receiving operations.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_25_pharmacy_inventory.puml:20`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`GET /pharmacy/orders/{id}` la atiende `PharmacyOrdersController.getOrder` (src/modules/pharmacy_inventory/controllers/pharmacy-orders.controller.ts:121). Exige sesión con alguno de los roles PATIENT, SECURITY_ADMIN. Delega en `PharmacyOrdersService.getOrder`. Crea filas en messaging.domain_events, messaging.in_app_notifications, messaging.notification_deliveries, messaging.notification_requests, messaging.outbox_messages, pharmacy_inventory.inventory_ledger_entries. Actualiza pharmacy_inventory.inventory_reservation_lines, pharmacy_inventory.inventory_reservations, pharmacy_inventory.inventory_stock_positions. Lee clinical.medication_requests, messaging.in_app_notifications, messaging.message_channels, messaging.messaging_providers, messaging.outbox_messages, messaging.provider_channel_configs, messaging.recipient_preferences, pharmacy_inventory.inventory_ledger_entries y 11 más. Publica PharmacyOrderExpired.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PATIENT, SECURITY_ADMIN | `src/modules/pharmacy_inventory/controllers/pharmacy-orders.controller.ts:121` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/pharmacy_inventory/controllers/pharmacy-orders.controller.ts:121` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.medication_requests` | LEE | LEE | DIRECTA | PharmacyOrdersController.getOrder → PharmacyOrdersService.getOrder → PharmacyOrdersService.expireDue → PharmacyOrdersRepository.findPrescriberProfileId | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:276` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.getOrder → PharmacyOrdersService.getOrder → PharmacyOrdersService.expireDue → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.in_app_notifications` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.getOrder → PharmacyOrdersService.getOrder → PharmacyOrdersService.expireDue → PharmacyOrderNotificationsService.expiredToPrescriber → PharmacyOrderNotificationsService.emitToPerson → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createInAppNotification | `src/modules/messaging/repositories/notifications.repository.ts:710` |
| `messaging.in_app_notifications` | LEE | LEE | DIRECTA | PharmacyOrdersController.getOrder → PharmacyOrdersService.getOrder → PharmacyOrdersService.expireDue → PharmacyOrderNotificationsService.expiredToPrescriber → PharmacyOrderNotificationsService.emitToPerson → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findUnreadInAppForResource | `src/modules/messaging/repositories/notifications.repository.ts:845` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | PharmacyOrdersController.getOrder → PharmacyOrdersService.getOrder → PharmacyOrdersService.expireDue → PharmacyOrderNotificationsService.expiredToPrescriber → PharmacyOrderNotificationsService.emitToPerson → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findActiveChannelByType | `src/modules/messaging/repositories/notifications.repository.ts:189` |
| `messaging.messaging_providers` | LEE | LEE | DIRECTA | PharmacyOrdersController.getOrder → PharmacyOrdersService.getOrder → PharmacyOrdersService.expireDue → PharmacyOrderNotificationsService.expiredToPrescriber → PharmacyOrderNotificationsService.emitToPerson → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findProviderById | `src/modules/messaging/repositories/notifications.repository.ts:437` |
| `messaging.notification_deliveries` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.getOrder → PharmacyOrdersService.getOrder → PharmacyOrdersService.expireDue → PharmacyOrderNotificationsService.expiredToPrescriber → PharmacyOrderNotificationsService.emitToPerson → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createDelivery | `src/modules/messaging/repositories/notifications.repository.ts:514` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.getOrder → PharmacyOrdersService.getOrder → PharmacyOrdersService.expireDue → PharmacyOrderNotificationsService.expiredToPrescriber → PharmacyOrderNotificationsService.emitToPerson → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.getOrder → PharmacyOrdersService.getOrder → PharmacyOrdersService.expireDue → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:164` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | PharmacyOrdersController.getOrder → PharmacyOrdersService.getOrder → PharmacyOrdersService.expireDue → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:188` |
| `messaging.provider_channel_configs` | LEE | LEE | DIRECTA | PharmacyOrdersController.getOrder → PharmacyOrdersService.getOrder → PharmacyOrdersService.expireDue → PharmacyOrderNotificationsService.expiredToPrescriber → PharmacyOrderNotificationsService.emitToPerson → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findChannelConfigs | `src/modules/messaging/repositories/notifications.repository.ts:405` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | PharmacyOrdersController.getOrder → PharmacyOrdersService.getOrder → PharmacyOrdersService.expireDue → PharmacyOrderNotificationsService.expiredToPrescriber → PharmacyOrderNotificationsService.emitToPerson → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `pharmacy_inventory.inventory_ledger_entries` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.getOrder → PharmacyOrdersService.getOrder → PharmacyOrdersService.expireDue → InventoryReservationsService.releaseConfirmedLines → LedgerRepository.append | `src/modules/pharmacy_inventory/repositories/ledger.repository.ts:138` |
| `pharmacy_inventory.inventory_ledger_entries` | LEE | LEE | POR_SQL | PharmacyOrdersController.getOrder → PharmacyOrdersService.getOrder → PharmacyOrdersService.expireDue → InventoryReservationsService.releaseConfirmedLines → LedgerRepository.nextSequence | `src/modules/pharmacy_inventory/repositories/ledger.repository.ts:109` |
| `pharmacy_inventory.inventory_reservation_lines` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyOrdersController.getOrder → PharmacyOrdersService.getOrder → PharmacyOrdersService.expireDue → InventoryReservationsService.releaseConfirmedLines | `src/modules/pharmacy_inventory/services/inventory-reservations.service.ts:238` |
| `pharmacy_inventory.inventory_reservation_lines` | LEE | LEE | DIRECTA | PharmacyOrdersController.getOrder → PharmacyOrdersService.getOrder → PharmacyOrdersService.composeOrders → PharmacyOrdersRepository.findLinesByReservationIds | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:212` |
| `pharmacy_inventory.inventory_reservations` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyOrdersController.getOrder → PharmacyOrdersService.getOrder → PharmacyOrdersService.expireDue | `src/modules/pharmacy_inventory/services/pharmacy-orders.service.ts:1532` |
| `pharmacy_inventory.inventory_reservations` | LEE | LEE | DIRECTA | PharmacyOrdersController.getOrder → PharmacyOrdersService.getOrder → PharmacyOrdersRepository.findOrderById | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:37` |
| `pharmacy_inventory.inventory_stock_positions` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyOrdersController.getOrder → PharmacyOrdersService.getOrder → PharmacyOrdersService.expireDue → InventoryReservationsService.releaseConfirmedLines | `src/modules/pharmacy_inventory/services/inventory-reservations.service.ts:266` |
| `pharmacy_inventory.inventory_stock_positions` | LEE | LEE | DIRECTA | PharmacyOrdersController.getOrder → PharmacyOrdersService.getOrder → PharmacyOrdersService.expireDue → InventoryReservationsService.releaseConfirmedLines → StockPositionsRepository.findByKeyForUpdate | `src/modules/pharmacy_inventory/repositories/stock-positions.repository.ts:82` |
| `pharmacy_inventory.pharmacy_order_substitutions` | LEE | LEE | DIRECTA | PharmacyOrdersController.getOrder → PharmacyOrdersService.getOrder → PharmacyOrdersService.composeOrders → PharmacyOrderSubstitutionsRepository.findByReservationIds | `src/modules/pharmacy_inventory/repositories/pharmacy-order-substitutions.repository.ts:62` |
| `pharmacy.pharmacies` | LEE | LEE | DIRECTA | PharmacyOrdersController.getOrder → PharmacyOrdersService.getOrder → PharmacyOrdersService.expireDue → PharmacyOrdersRepository.findPharmaciesByIds | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:251` |
| `pharmacy.pharmacy_products` | LEE | LEE | DIRECTA | PharmacyOrdersController.getOrder → PharmacyOrdersService.getOrder → PharmacyOrdersService.composeOrders → PharmacyOrdersRepository.findProductsByIds | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:242` |
| `pharmacy.pharmacy_sites` | LEE | LEE | DIRECTA | PharmacyOrdersController.getOrder → PharmacyOrdersService.getOrder → PharmacyOrdersService.composeOrders → PharmacyOrdersRepository.findSitesByIds | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:233` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | PharmacyOrdersController.getOrder → PharmacyOrdersService.getOrder → PharmacyOrdersService.expireDue → PharmacyOrderNotificationsService.expiredToPrescriber → PharmacyOrderNotificationsService.emitToPerson → PersonAccountLinksRepository.findActiveByPerson | `src/modules/profiles/repositories/person-account-links.repository.ts:101` |
| `profiles.person_profiles` | LEE | LEE | DIRECTA | PharmacyOrdersController.getOrder → PharmacyOrdersService.getOrder → PharmacyOrdersService.composeOrders → PharmacyOrdersRepository.findPersonNamesByProfileIds | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:135` |
| `profiles.persons` | LEE | LEE | DIRECTA | PharmacyOrdersController.getOrder → PharmacyOrdersService.getOrder → PharmacyOrdersService.composeOrders → PharmacyOrdersRepository.findPersonNamesByProfileIds | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:127` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | PharmacyOrdersController.getOrder → PharmacyOrdersService.getOrder → PharmacyOrdersService.composeOrders → PharmacyOrdersRepository.findConceptsByIds | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:288` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `PharmacyOrderExpired` | `src/modules/pharmacy_inventory/services/pharmacy-orders.service.ts:1537` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PharmacyOrderDto>` · DTO `PharmacyOrderDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único del pedido. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:204` |
| `status` | `InventoryConceptDto` | Sí | — | — | Estado del pedido (`PINV_ORDER_*`). | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:210` |
| `status.code` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `status.display` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `createdAt` | `string` | Sí | — | — | Instante de creación, ISO 8601. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:216` |
| `expiresAt` | `string` | Sí | — | — | Vencimiento vigente del pedido, ISO 8601 (48 h desde la creación; el carril E2 la renueva al dejarlo listo para retiro). | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:223` |
| `siteId` | `string` | Sí | formato uuid | — | Identificador asociado a site. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:229` |
| `siteName` | `string` | Sí | — | — | Nombre de la sede. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:235` |
| `pharmacyId` | `string` | Sí | formato uuid | — | Identificador asociado a pharmacy. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:241` |
| `pharmacyName` | `string` | Sí | — | — | Nombre de la farmacia (comercial, o la razón social). | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:247` |
| `medicationRequestId` | `string` | No | formato uuid; admite null | — | Receta que respalda el pedido, si la hay. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:253` |
| `patientName` | `string` | No | admite null | — | Nombre pintable del paciente, resuelto en lote por el backend (la bandeja FAR-E2 lo necesita; cero UUIDs como copy). `null` si la persona no tiene nombre cargado. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:261` |
| `deliveryMode` | `InventoryConceptDto` | No | — | — | Modalidad de entrega (`PINV_DELIVERY_*`), resuelta. `null` en pedidos anteriores al modelo v4.2.1, que no la declararon. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:268` |
| `deliveryMode.code` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `deliveryMode.display` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `pickupCode` | `string` | No | admite null | — | Código de retiro del pedido, sellado al quedar `LISTO_PARA_RETIRO`. **Solo en la lectura del titular**: es la prueba de posesión con que la persona retira, así que la bandeja y las lecturas de staff lo sirven `null` — el mostrador no valida mirándolo, valida enviándolo en `POST /pharmacy/orders/:id/dispense`. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:279` |
| `totalAmount` | `string` | No | admite null | — | Total CONGELADO del pedido con su moneda: suma de los precios congelados por el saldo reservado de cada renglón en pie. `null` si a algún renglón le falta precio publicado o si las listas mezclan monedas — una suma con huecos o que mezcla monedas afirma un costo que nadie publicó. Se re-congela cuando el pedido cambia (línea no disponible, sustitución aceptada); jamás se recalcula en una lectura. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:290` |
| `currency` | `InventoryConceptDto` | No | — | — | Moneda del total congelado, resuelta. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:296` |
| `currency.code` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `currency.display` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `rejectionReasonText` | `string` | No | admite null | — | Motivo del rechazo, en palabras, cuando el estado es `RECHAZADO` (v4.2.1 lo persiste). `null` en cualquier otro estado. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:303` |
| `substitutions` | `array<PharmacyOrderSubstitutionDto>` | Sí | — | — | La historia de propuestas de sustitución del pedido, más nuevas primero. Las decididas conservan su estado y su `decidedAt`: son bitácora, no un campo mutable. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:311` |
| `substitutions[].id` | `string` | Sí | formato uuid | — | Identificador de la propuesta. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:326` |
| `substitutions[].originalProductId` | `string` | Sí | formato uuid | — | Producto recetado/pedido. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:332` |
| `substitutions[].originalName` | `string` | Sí | — | — | Nombre pintable del original. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:338` |
| `substitutions[].originalUnitPriceAmount` | `string` | No | admite null | — | Precio congelado del original al proponer, o `null` sin precio publicado. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:344` |
| `substitutions[].proposedProductId` | `string` | Sí | formato uuid | — | Producto propuesto (mismo medicamento del vademécum). | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:350` |
| `substitutions[].proposedName` | `string` | Sí | — | — | Nombre pintable del propuesto. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:356` |
| `substitutions[].proposedUnitPriceAmount` | `string` | No | admite null | — | Precio congelado del propuesto: la oferta que el paciente decidió. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:362` |
| `substitutions[].currency` | `InventoryConceptDto` | No | — | — | Moneda de la oferta, resuelta. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:368` |
| `substitutions[].currency.code` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `substitutions[].currency.display` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `substitutions[].status` | `InventoryConceptDto` | Sí | — | — | Estado de la propuesta (`PINV_SUBSTITUTION_*`), resuelto. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:374` |
| `substitutions[].status.code` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `substitutions[].status.display` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `substitutions[].decidedAt` | `string` | No | admite null | — | Cuándo se decidió (aceptó/rechazó/retiró), ISO 8601; `null` en pie. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:380` |
| `lines` | `array<PharmacyOrderLineDto>` | Sí | — | — | Líneas del pedido. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:317` |
| `lines[].productId` | `string` | Sí | formato uuid | — | Identificador asociado a product. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:118` |
| `lines[].productCode` | `string` | Sí | — | — | Código interno del producto. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:124` |
| `lines[].brandName` | `string` | No | admite null | — | Nombre comercial. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:130` |
| `lines[].genericName` | `string` | No | admite null | — | Nombre genérico. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:136` |
| `lines[].strengthText` | `string` | No | admite null | — | Concentración, legible. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:142` |
| `lines[].packageSizeText` | `string` | No | admite null | — | Presentación, legible. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:148` |
| `lines[].medication` | `InventoryConceptDto` | No | — | — | Medicamento del vademécum, resuelto. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:154` |
| `lines[].medication.code` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `lines[].medication.display` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `lines[].requestedQuantity` | `number` | Sí | — | — | Cantidad solicitada por el paciente. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:160` |
| `lines[].reservedQuantity` | `number` | Sí | — | — | Cantidad efectivamente reservada; `0` cuando la línea quedó sin stock. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:166` |
| `lines[].fulfilledQuantity` | `number` | Sí | — | — | Cantidad ya entregada en el mostrador, acumulada entre entregas parciales (FAR-E3). El saldo por retirar es `reservedQuantity − fulfilledQuantity`. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:173` |
| `lines[].unitPriceAmount` | `string` | No | admite null | — | Precio unitario CONGELADO del renglón (lo que paga el paciente), sellado al crear el pedido o al aceptar una sustitución. `null` si la sede no publicaba precio: el GET no recalcula — un precio congelado que se recalcula contra listas nuevas reescribe un pedido histórico. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:182` |
| `lines[].currency` | `InventoryConceptDto` | No | — | — | Moneda del precio congelado, resuelta. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:188` |
| `lines[].currency.code` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `lines[].currency.display` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `lines[].status` | `InventoryConceptDto` | Sí | — | — | Estado de la línea (`PINV_RES_LINE_CONFIRMED` reservada, `PINV_RES_LINE_OUT_OF_STOCK` sin stock, `PINV_RES_LINE_RELEASED` liberada). | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:195` |
| `lines[].status.code` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `lines[].status.display` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |

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

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / pharmacy inventory — etapa `ctrl:PharmacyOrdersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 19. POST /pharmacy/orders/{id}/accept-substitutions

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** FAR-E2/I2: el titular acepta los genéricos propuestos. Todo-o-nada, como los dos botones del front: `ACEPTACION_PENDIENTE → ACEPTADO`.
- **Bloque:** Farmacia
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyOrdersController.acceptSubstitutions` — `src/modules/pharmacy_inventory/controllers/pharmacy-orders.controller.ts:192`

### Qué es y para qué sirve (negocio)

FAR-E2/I2: el titular acepta los genéricos propuestos. Todo-o-nada, como los dos botones del front: `ACEPTACION_PENDIENTE → ACEPTADO`. Dentro del módulo (descripción del modelo, en inglés): «Prevents overselling and untraceable adjustments under concurrent manual, API, dispensing and receiving operations.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_25_pharmacy_inventory.puml:20`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`POST /pharmacy/orders/{id}/accept-substitutions` la atiende `PharmacyOrdersController.acceptSubstitutions` (src/modules/pharmacy_inventory/controllers/pharmacy-orders.controller.ts:192). Exige sesión con alguno de los roles PATIENT. Delega en `PharmacyOrdersService.acceptSubstitutions`. Crea filas en messaging.domain_events, messaging.outbox_messages, pharmacy_inventory.inventory_ledger_entries, pharmacy_inventory.inventory_reservation_lines. Actualiza pharmacy_inventory.inventory_reservation_lines, pharmacy_inventory.inventory_reservations, pharmacy_inventory.inventory_stock_positions, pharmacy_inventory.pharmacy_order_substitutions. Lee messaging.outbox_messages, pharmacy_inventory.inventory_ledger_entries, pharmacy_inventory.inventory_locations, pharmacy_inventory.inventory_reservation_lines, pharmacy_inventory.inventory_reservations, pharmacy_inventory.inventory_stock_positions, pharmacy_inventory.pharmacy_order_substitutions, pharmacy.pharmacies y 5 más. Publica un evento calculado (event.eventType).

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PATIENT | `src/modules/pharmacy_inventory/controllers/pharmacy-orders.controller.ts:192` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/pharmacy_inventory/controllers/pharmacy-orders.controller.ts:192` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.acceptSubstitutions → PharmacyOrdersService.acceptSubstitutions → PharmacyOrdersService.publishStaffEvent → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.acceptSubstitutions → PharmacyOrdersService.acceptSubstitutions → PharmacyOrdersService.publishStaffEvent → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:164` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | PharmacyOrdersController.acceptSubstitutions → PharmacyOrdersService.acceptSubstitutions → PharmacyOrdersService.publishStaffEvent → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:188` |
| `pharmacy_inventory.inventory_ledger_entries` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.acceptSubstitutions → PharmacyOrdersService.acceptSubstitutions → InventoryReservationsService.releaseConfirmedLines → LedgerRepository.append | `src/modules/pharmacy_inventory/repositories/ledger.repository.ts:138` |
| `pharmacy_inventory.inventory_ledger_entries` | LEE | LEE | POR_SQL | PharmacyOrdersController.acceptSubstitutions → PharmacyOrdersService.acceptSubstitutions → InventoryReservationsService.releaseConfirmedLines → LedgerRepository.nextSequence | `src/modules/pharmacy_inventory/repositories/ledger.repository.ts:109` |
| `pharmacy_inventory.inventory_locations` | LEE | LEE | DIRECTA | PharmacyOrdersController.acceptSubstitutions → PharmacyOrdersService.acceptSubstitutions → InventoryReadRepository.findActiveLocationsBySites | `src/modules/pharmacy_inventory/repositories/inventory-read.repository.ts:20` |
| `pharmacy_inventory.inventory_reservation_lines` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyOrdersController.acceptSubstitutions → PharmacyOrdersService.acceptSubstitutions → InventoryReservationsService.releaseConfirmedLines | `src/modules/pharmacy_inventory/services/inventory-reservations.service.ts:238` |
| `pharmacy_inventory.inventory_reservation_lines` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.acceptSubstitutions → PharmacyOrdersService.acceptSubstitutions → PharmacyOrdersService.reserveLineStock → ReservationsRepository.createLine | `src/modules/pharmacy_inventory/repositories/reservations.repository.ts:185` |
| `pharmacy_inventory.inventory_reservation_lines` | LEE | LEE | DIRECTA | PharmacyOrdersController.acceptSubstitutions → PharmacyOrdersService.acceptSubstitutions → PharmacyOrdersRepository.findLinesByReservationIds | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:212` |
| `pharmacy_inventory.inventory_reservations` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyOrdersController.acceptSubstitutions → PharmacyOrdersService.acceptSubstitutions | `src/modules/pharmacy_inventory/services/pharmacy-orders.service.ts:962` |
| `pharmacy_inventory.inventory_reservations` | LEE | LEE | DIRECTA | PharmacyOrdersController.acceptSubstitutions → PharmacyOrdersService.acceptSubstitutions → PharmacyOrdersService.loadOwnOrderForUpdate → PharmacyOrdersRepository.findOrderByIdForUpdate | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:53` |
| `pharmacy_inventory.inventory_stock_positions` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyOrdersController.acceptSubstitutions → PharmacyOrdersService.acceptSubstitutions → InventoryReservationsService.releaseConfirmedLines | `src/modules/pharmacy_inventory/services/inventory-reservations.service.ts:266` |
| `pharmacy_inventory.inventory_stock_positions` | LEE | LEE | DIRECTA | PharmacyOrdersController.acceptSubstitutions → PharmacyOrdersService.acceptSubstitutions → InventoryReadRepository.findStockPositions | `src/modules/pharmacy_inventory/repositories/inventory-read.repository.ts:40` |
| `pharmacy_inventory.pharmacy_order_substitutions` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyOrdersController.acceptSubstitutions → PharmacyOrdersService.acceptSubstitutions | `src/modules/pharmacy_inventory/services/pharmacy-orders.service.ts:957` |
| `pharmacy_inventory.pharmacy_order_substitutions` | LEE | LEE | DIRECTA | PharmacyOrdersController.acceptSubstitutions → PharmacyOrdersService.acceptSubstitutions → PharmacyOrdersService.pendingProposalsOf → PharmacyOrderSubstitutionsRepository.findByReservationIds | `src/modules/pharmacy_inventory/repositories/pharmacy-order-substitutions.repository.ts:62` |
| `pharmacy.pharmacies` | LEE | LEE | DIRECTA | PharmacyOrdersController.acceptSubstitutions → PharmacyOrdersService.acceptSubstitutions → PharmacyOrdersService.loadOwnOrderForUpdate → PharmacyOrdersRepository.findPharmaciesByIdsInTenant | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:224` |
| `pharmacy.pharmacy_products` | LEE | LEE | DIRECTA | PharmacyOrdersController.acceptSubstitutions → PharmacyOrdersService.acceptSubstitutions → PharmacyOrdersService.readOwnOrder → PharmacyOrdersService.composeOrders → PharmacyOrdersRepository.findProductsByIds | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:242` |
| `pharmacy.pharmacy_sites` | LEE | LEE | DIRECTA | PharmacyOrdersController.acceptSubstitutions → PharmacyOrdersService.acceptSubstitutions → PharmacyOrdersService.readOwnOrder → PharmacyOrdersService.composeOrders → PharmacyOrdersRepository.findSitesByIds | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:233` |
| `profiles.person_profiles` | LEE | LEE | DIRECTA | PharmacyOrdersController.acceptSubstitutions → PharmacyOrdersService.acceptSubstitutions → PharmacyOrdersService.readOwnOrder → PharmacyOrdersService.composeOrders → PharmacyOrdersRepository.findPersonNamesByProfileIds | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:135` |
| `profiles.persons` | LEE | LEE | DIRECTA | PharmacyOrdersController.acceptSubstitutions → PharmacyOrdersService.acceptSubstitutions → PharmacyOrdersService.readOwnOrder → PharmacyOrdersService.composeOrders → PharmacyOrdersRepository.findPersonNamesByProfileIds | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:127` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | PharmacyOrdersController.acceptSubstitutions → PharmacyOrdersService.acceptSubstitutions → PharmacyOrdersService.readOwnOrder → PharmacyOrdersService.composeOrders → PharmacyOrdersRepository.findConceptsByIds | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:288` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | calculado: `event.eventType` | `src/modules/pharmacy_inventory/services/pharmacy-orders.service.ts:1939` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PharmacyOrderDto>` · DTO `PharmacyOrderDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único del pedido. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:204` |
| `status` | `InventoryConceptDto` | Sí | — | — | Estado del pedido (`PINV_ORDER_*`). | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:210` |
| `status.code` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `status.display` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `createdAt` | `string` | Sí | — | — | Instante de creación, ISO 8601. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:216` |
| `expiresAt` | `string` | Sí | — | — | Vencimiento vigente del pedido, ISO 8601 (48 h desde la creación; el carril E2 la renueva al dejarlo listo para retiro). | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:223` |
| `siteId` | `string` | Sí | formato uuid | — | Identificador asociado a site. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:229` |
| `siteName` | `string` | Sí | — | — | Nombre de la sede. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:235` |
| `pharmacyId` | `string` | Sí | formato uuid | — | Identificador asociado a pharmacy. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:241` |
| `pharmacyName` | `string` | Sí | — | — | Nombre de la farmacia (comercial, o la razón social). | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:247` |
| `medicationRequestId` | `string` | No | formato uuid; admite null | — | Receta que respalda el pedido, si la hay. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:253` |
| `patientName` | `string` | No | admite null | — | Nombre pintable del paciente, resuelto en lote por el backend (la bandeja FAR-E2 lo necesita; cero UUIDs como copy). `null` si la persona no tiene nombre cargado. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:261` |
| `deliveryMode` | `InventoryConceptDto` | No | — | — | Modalidad de entrega (`PINV_DELIVERY_*`), resuelta. `null` en pedidos anteriores al modelo v4.2.1, que no la declararon. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:268` |
| `deliveryMode.code` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `deliveryMode.display` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `pickupCode` | `string` | No | admite null | — | Código de retiro del pedido, sellado al quedar `LISTO_PARA_RETIRO`. **Solo en la lectura del titular**: es la prueba de posesión con que la persona retira, así que la bandeja y las lecturas de staff lo sirven `null` — el mostrador no valida mirándolo, valida enviándolo en `POST /pharmacy/orders/:id/dispense`. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:279` |
| `totalAmount` | `string` | No | admite null | — | Total CONGELADO del pedido con su moneda: suma de los precios congelados por el saldo reservado de cada renglón en pie. `null` si a algún renglón le falta precio publicado o si las listas mezclan monedas — una suma con huecos o que mezcla monedas afirma un costo que nadie publicó. Se re-congela cuando el pedido cambia (línea no disponible, sustitución aceptada); jamás se recalcula en una lectura. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:290` |
| `currency` | `InventoryConceptDto` | No | — | — | Moneda del total congelado, resuelta. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:296` |
| `currency.code` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `currency.display` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `rejectionReasonText` | `string` | No | admite null | — | Motivo del rechazo, en palabras, cuando el estado es `RECHAZADO` (v4.2.1 lo persiste). `null` en cualquier otro estado. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:303` |
| `substitutions` | `array<PharmacyOrderSubstitutionDto>` | Sí | — | — | La historia de propuestas de sustitución del pedido, más nuevas primero. Las decididas conservan su estado y su `decidedAt`: son bitácora, no un campo mutable. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:311` |
| `substitutions[].id` | `string` | Sí | formato uuid | — | Identificador de la propuesta. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:326` |
| `substitutions[].originalProductId` | `string` | Sí | formato uuid | — | Producto recetado/pedido. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:332` |
| `substitutions[].originalName` | `string` | Sí | — | — | Nombre pintable del original. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:338` |
| `substitutions[].originalUnitPriceAmount` | `string` | No | admite null | — | Precio congelado del original al proponer, o `null` sin precio publicado. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:344` |
| `substitutions[].proposedProductId` | `string` | Sí | formato uuid | — | Producto propuesto (mismo medicamento del vademécum). | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:350` |
| `substitutions[].proposedName` | `string` | Sí | — | — | Nombre pintable del propuesto. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:356` |
| `substitutions[].proposedUnitPriceAmount` | `string` | No | admite null | — | Precio congelado del propuesto: la oferta que el paciente decidió. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:362` |
| `substitutions[].currency` | `InventoryConceptDto` | No | — | — | Moneda de la oferta, resuelta. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:368` |
| `substitutions[].currency.code` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `substitutions[].currency.display` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `substitutions[].status` | `InventoryConceptDto` | Sí | — | — | Estado de la propuesta (`PINV_SUBSTITUTION_*`), resuelto. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:374` |
| `substitutions[].status.code` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `substitutions[].status.display` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `substitutions[].decidedAt` | `string` | No | admite null | — | Cuándo se decidió (aceptó/rechazó/retiró), ISO 8601; `null` en pie. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:380` |
| `lines` | `array<PharmacyOrderLineDto>` | Sí | — | — | Líneas del pedido. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:317` |
| `lines[].productId` | `string` | Sí | formato uuid | — | Identificador asociado a product. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:118` |
| `lines[].productCode` | `string` | Sí | — | — | Código interno del producto. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:124` |
| `lines[].brandName` | `string` | No | admite null | — | Nombre comercial. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:130` |
| `lines[].genericName` | `string` | No | admite null | — | Nombre genérico. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:136` |
| `lines[].strengthText` | `string` | No | admite null | — | Concentración, legible. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:142` |
| `lines[].packageSizeText` | `string` | No | admite null | — | Presentación, legible. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:148` |
| `lines[].medication` | `InventoryConceptDto` | No | — | — | Medicamento del vademécum, resuelto. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:154` |
| `lines[].medication.code` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `lines[].medication.display` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `lines[].requestedQuantity` | `number` | Sí | — | — | Cantidad solicitada por el paciente. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:160` |
| `lines[].reservedQuantity` | `number` | Sí | — | — | Cantidad efectivamente reservada; `0` cuando la línea quedó sin stock. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:166` |
| `lines[].fulfilledQuantity` | `number` | Sí | — | — | Cantidad ya entregada en el mostrador, acumulada entre entregas parciales (FAR-E3). El saldo por retirar es `reservedQuantity − fulfilledQuantity`. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:173` |
| `lines[].unitPriceAmount` | `string` | No | admite null | — | Precio unitario CONGELADO del renglón (lo que paga el paciente), sellado al crear el pedido o al aceptar una sustitución. `null` si la sede no publicaba precio: el GET no recalcula — un precio congelado que se recalcula contra listas nuevas reescribe un pedido histórico. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:182` |
| `lines[].currency` | `InventoryConceptDto` | No | — | — | Moneda del precio congelado, resuelta. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:188` |
| `lines[].currency.code` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `lines[].currency.display` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `lines[].status` | `InventoryConceptDto` | Sí | — | — | Estado de la línea (`PINV_RES_LINE_CONFIRMED` reservada, `PINV_RES_LINE_OUT_OF_STOCK` sin stock, `PINV_RES_LINE_RELEASED` liberada). | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:195` |
| `lines[].status.code` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `lines[].status.display` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |

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
- **Implementación:** `PharmacyOrdersController.cancel` — `src/modules/pharmacy_inventory/controllers/pharmacy-orders.controller.ts:136`

### Qué es y para qué sirve (negocio)

Cancelar un pedido de farmacia (FAR-E1). Dentro del módulo (descripción del modelo, en inglés): «Prevents overselling and untraceable adjustments under concurrent manual, API, dispensing and receiving operations.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_25_pharmacy_inventory.puml:20`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`POST /pharmacy/orders/{id}/cancel` la atiende `PharmacyOrdersController.cancel` (src/modules/pharmacy_inventory/controllers/pharmacy-orders.controller.ts:136). Exige sesión con alguno de los roles PATIENT. Delega en `PharmacyOrdersService.cancel`. Crea filas en messaging.domain_events, messaging.outbox_messages, pharmacy_inventory.inventory_ledger_entries. Actualiza pharmacy_inventory.inventory_reservation_lines, pharmacy_inventory.inventory_reservations, pharmacy_inventory.inventory_stock_positions. Lee messaging.outbox_messages, pharmacy_inventory.inventory_ledger_entries, pharmacy_inventory.inventory_reservation_lines, pharmacy_inventory.inventory_reservations, pharmacy_inventory.inventory_stock_positions, pharmacy_inventory.pharmacy_order_substitutions, pharmacy.pharmacies, pharmacy.pharmacy_products y 4 más. Publica PharmacyOrderCancelled.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PATIENT | `src/modules/pharmacy_inventory/controllers/pharmacy-orders.controller.ts:136` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/pharmacy_inventory/controllers/pharmacy-orders.controller.ts:136` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.cancel → PharmacyOrdersService.cancel → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.cancel → PharmacyOrdersService.cancel → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:164` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | PharmacyOrdersController.cancel → PharmacyOrdersService.cancel → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:188` |
| `pharmacy_inventory.inventory_ledger_entries` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.cancel → PharmacyOrdersService.cancel → InventoryReservationsService.releaseConfirmedLines → LedgerRepository.append | `src/modules/pharmacy_inventory/repositories/ledger.repository.ts:138` |
| `pharmacy_inventory.inventory_ledger_entries` | LEE | LEE | POR_SQL | PharmacyOrdersController.cancel → PharmacyOrdersService.cancel → InventoryReservationsService.releaseConfirmedLines → LedgerRepository.nextSequence | `src/modules/pharmacy_inventory/repositories/ledger.repository.ts:109` |
| `pharmacy_inventory.inventory_reservation_lines` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyOrdersController.cancel → PharmacyOrdersService.cancel → InventoryReservationsService.releaseConfirmedLines | `src/modules/pharmacy_inventory/services/inventory-reservations.service.ts:238` |
| `pharmacy_inventory.inventory_reservation_lines` | LEE | LEE | DIRECTA | PharmacyOrdersController.cancel → PharmacyOrdersService.cancel → InventoryReservationsService.releaseConfirmedLines → ReservationsRepository.findLinesByReservation | `src/modules/pharmacy_inventory/repositories/reservations.repository.ts:139` |
| `pharmacy_inventory.inventory_reservations` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyOrdersController.cancel → PharmacyOrdersService.cancel | `src/modules/pharmacy_inventory/services/pharmacy-orders.service.ts:587` |
| `pharmacy_inventory.inventory_reservations` | LEE | LEE | DIRECTA | PharmacyOrdersController.cancel → PharmacyOrdersService.cancel → PharmacyOrdersRepository.findOrderByIdForUpdate | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:53` |
| `pharmacy_inventory.inventory_stock_positions` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyOrdersController.cancel → PharmacyOrdersService.cancel → InventoryReservationsService.releaseConfirmedLines | `src/modules/pharmacy_inventory/services/inventory-reservations.service.ts:266` |
| `pharmacy_inventory.inventory_stock_positions` | LEE | LEE | DIRECTA | PharmacyOrdersController.cancel → PharmacyOrdersService.cancel → InventoryReservationsService.releaseConfirmedLines → StockPositionsRepository.findByKeyForUpdate | `src/modules/pharmacy_inventory/repositories/stock-positions.repository.ts:82` |
| `pharmacy_inventory.pharmacy_order_substitutions` | LEE | LEE | DIRECTA | PharmacyOrdersController.cancel → PharmacyOrdersService.cancel → PharmacyOrdersService.readOwnOrder → PharmacyOrdersService.composeOrders → PharmacyOrderSubstitutionsRepository.findByReservationIds | `src/modules/pharmacy_inventory/repositories/pharmacy-order-substitutions.repository.ts:62` |
| `pharmacy.pharmacies` | LEE | LEE | DIRECTA | PharmacyOrdersController.cancel → PharmacyOrdersService.cancel → PharmacyOrdersRepository.findPharmaciesByIdsInTenant | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:224` |
| `pharmacy.pharmacy_products` | LEE | LEE | DIRECTA | PharmacyOrdersController.cancel → PharmacyOrdersService.cancel → PharmacyOrdersService.readOwnOrder → PharmacyOrdersService.composeOrders → PharmacyOrdersRepository.findProductsByIds | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:242` |
| `pharmacy.pharmacy_sites` | LEE | LEE | DIRECTA | PharmacyOrdersController.cancel → PharmacyOrdersService.cancel → PharmacyOrdersService.readOwnOrder → PharmacyOrdersService.composeOrders → PharmacyOrdersRepository.findSitesByIds | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:233` |
| `profiles.person_profiles` | LEE | LEE | DIRECTA | PharmacyOrdersController.cancel → PharmacyOrdersService.cancel → PharmacyOrdersService.readOwnOrder → PharmacyOrdersService.composeOrders → PharmacyOrdersRepository.findPersonNamesByProfileIds | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:135` |
| `profiles.persons` | LEE | LEE | DIRECTA | PharmacyOrdersController.cancel → PharmacyOrdersService.cancel → PharmacyOrdersService.readOwnOrder → PharmacyOrdersService.composeOrders → PharmacyOrdersRepository.findPersonNamesByProfileIds | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:127` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | PharmacyOrdersController.cancel → PharmacyOrdersService.cancel → PharmacyOrdersService.readOwnOrder → PharmacyOrdersService.composeOrders → PharmacyOrdersRepository.findConceptsByIds | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:288` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `PharmacyOrderCancelled` | `src/modules/pharmacy_inventory/services/pharmacy-orders.service.ts:592` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PharmacyOrderDto>` · DTO `PharmacyOrderDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único del pedido. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:204` |
| `status` | `InventoryConceptDto` | Sí | — | — | Estado del pedido (`PINV_ORDER_*`). | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:210` |
| `status.code` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `status.display` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `createdAt` | `string` | Sí | — | — | Instante de creación, ISO 8601. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:216` |
| `expiresAt` | `string` | Sí | — | — | Vencimiento vigente del pedido, ISO 8601 (48 h desde la creación; el carril E2 la renueva al dejarlo listo para retiro). | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:223` |
| `siteId` | `string` | Sí | formato uuid | — | Identificador asociado a site. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:229` |
| `siteName` | `string` | Sí | — | — | Nombre de la sede. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:235` |
| `pharmacyId` | `string` | Sí | formato uuid | — | Identificador asociado a pharmacy. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:241` |
| `pharmacyName` | `string` | Sí | — | — | Nombre de la farmacia (comercial, o la razón social). | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:247` |
| `medicationRequestId` | `string` | No | formato uuid; admite null | — | Receta que respalda el pedido, si la hay. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:253` |
| `patientName` | `string` | No | admite null | — | Nombre pintable del paciente, resuelto en lote por el backend (la bandeja FAR-E2 lo necesita; cero UUIDs como copy). `null` si la persona no tiene nombre cargado. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:261` |
| `deliveryMode` | `InventoryConceptDto` | No | — | — | Modalidad de entrega (`PINV_DELIVERY_*`), resuelta. `null` en pedidos anteriores al modelo v4.2.1, que no la declararon. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:268` |
| `deliveryMode.code` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `deliveryMode.display` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `pickupCode` | `string` | No | admite null | — | Código de retiro del pedido, sellado al quedar `LISTO_PARA_RETIRO`. **Solo en la lectura del titular**: es la prueba de posesión con que la persona retira, así que la bandeja y las lecturas de staff lo sirven `null` — el mostrador no valida mirándolo, valida enviándolo en `POST /pharmacy/orders/:id/dispense`. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:279` |
| `totalAmount` | `string` | No | admite null | — | Total CONGELADO del pedido con su moneda: suma de los precios congelados por el saldo reservado de cada renglón en pie. `null` si a algún renglón le falta precio publicado o si las listas mezclan monedas — una suma con huecos o que mezcla monedas afirma un costo que nadie publicó. Se re-congela cuando el pedido cambia (línea no disponible, sustitución aceptada); jamás se recalcula en una lectura. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:290` |
| `currency` | `InventoryConceptDto` | No | — | — | Moneda del total congelado, resuelta. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:296` |
| `currency.code` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `currency.display` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `rejectionReasonText` | `string` | No | admite null | — | Motivo del rechazo, en palabras, cuando el estado es `RECHAZADO` (v4.2.1 lo persiste). `null` en cualquier otro estado. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:303` |
| `substitutions` | `array<PharmacyOrderSubstitutionDto>` | Sí | — | — | La historia de propuestas de sustitución del pedido, más nuevas primero. Las decididas conservan su estado y su `decidedAt`: son bitácora, no un campo mutable. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:311` |
| `substitutions[].id` | `string` | Sí | formato uuid | — | Identificador de la propuesta. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:326` |
| `substitutions[].originalProductId` | `string` | Sí | formato uuid | — | Producto recetado/pedido. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:332` |
| `substitutions[].originalName` | `string` | Sí | — | — | Nombre pintable del original. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:338` |
| `substitutions[].originalUnitPriceAmount` | `string` | No | admite null | — | Precio congelado del original al proponer, o `null` sin precio publicado. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:344` |
| `substitutions[].proposedProductId` | `string` | Sí | formato uuid | — | Producto propuesto (mismo medicamento del vademécum). | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:350` |
| `substitutions[].proposedName` | `string` | Sí | — | — | Nombre pintable del propuesto. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:356` |
| `substitutions[].proposedUnitPriceAmount` | `string` | No | admite null | — | Precio congelado del propuesto: la oferta que el paciente decidió. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:362` |
| `substitutions[].currency` | `InventoryConceptDto` | No | — | — | Moneda de la oferta, resuelta. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:368` |
| `substitutions[].currency.code` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `substitutions[].currency.display` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `substitutions[].status` | `InventoryConceptDto` | Sí | — | — | Estado de la propuesta (`PINV_SUBSTITUTION_*`), resuelto. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:374` |
| `substitutions[].status.code` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `substitutions[].status.display` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `substitutions[].decidedAt` | `string` | No | admite null | — | Cuándo se decidió (aceptó/rechazó/retiró), ISO 8601; `null` en pie. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:380` |
| `lines` | `array<PharmacyOrderLineDto>` | Sí | — | — | Líneas del pedido. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:317` |
| `lines[].productId` | `string` | Sí | formato uuid | — | Identificador asociado a product. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:118` |
| `lines[].productCode` | `string` | Sí | — | — | Código interno del producto. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:124` |
| `lines[].brandName` | `string` | No | admite null | — | Nombre comercial. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:130` |
| `lines[].genericName` | `string` | No | admite null | — | Nombre genérico. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:136` |
| `lines[].strengthText` | `string` | No | admite null | — | Concentración, legible. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:142` |
| `lines[].packageSizeText` | `string` | No | admite null | — | Presentación, legible. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:148` |
| `lines[].medication` | `InventoryConceptDto` | No | — | — | Medicamento del vademécum, resuelto. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:154` |
| `lines[].medication.code` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `lines[].medication.display` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `lines[].requestedQuantity` | `number` | Sí | — | — | Cantidad solicitada por el paciente. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:160` |
| `lines[].reservedQuantity` | `number` | Sí | — | — | Cantidad efectivamente reservada; `0` cuando la línea quedó sin stock. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:166` |
| `lines[].fulfilledQuantity` | `number` | Sí | — | — | Cantidad ya entregada en el mostrador, acumulada entre entregas parciales (FAR-E3). El saldo por retirar es `reservedQuantity − fulfilledQuantity`. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:173` |
| `lines[].unitPriceAmount` | `string` | No | admite null | — | Precio unitario CONGELADO del renglón (lo que paga el paciente), sellado al crear el pedido o al aceptar una sustitución. `null` si la sede no publicaba precio: el GET no recalcula — un precio congelado que se recalcula contra listas nuevas reescribe un pedido histórico. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:182` |
| `lines[].currency` | `InventoryConceptDto` | No | — | — | Moneda del precio congelado, resuelta. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:188` |
| `lines[].currency.code` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `lines[].currency.display` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `lines[].status` | `InventoryConceptDto` | Sí | — | — | Estado de la línea (`PINV_RES_LINE_CONFIRMED` reservada, `PINV_RES_LINE_OUT_OF_STOCK` sin stock, `PINV_RES_LINE_RELEASED` liberada). | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:195` |
| `lines[].status.code` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `lines[].status.display` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |

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
- **Implementación:** `PharmacyOrdersController.confirm` — `src/modules/pharmacy_inventory/controllers/pharmacy-orders.controller.ts:172`

### Qué es y para qué sirve (negocio)

Confirmar el pedido (FAR-E2). Dentro del módulo (descripción del modelo, en inglés): «Prevents overselling and untraceable adjustments under concurrent manual, API, dispensing and receiving operations.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_25_pharmacy_inventory.puml:20`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`POST /pharmacy/orders/{id}/confirm` la atiende `PharmacyOrdersController.confirm` (src/modules/pharmacy_inventory/controllers/pharmacy-orders.controller.ts:172). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `ConfirmPharmacyOrderDto` (3 campos, 0 obligatorios). Delega en `PharmacyOrdersService.confirm`. Crea filas en messaging.domain_events, messaging.in_app_notifications, messaging.notification_deliveries, messaging.notification_requests, messaging.outbox_messages, pharmacy_inventory.inventory_ledger_entries, pharmacy_inventory.pharmacy_order_substitutions. Actualiza pharmacy_inventory.inventory_reservation_lines, pharmacy_inventory.inventory_reservations, pharmacy_inventory.inventory_stock_positions. Lee messaging.in_app_notifications, messaging.message_channels, messaging.messaging_providers, messaging.outbox_messages, messaging.provider_channel_configs, messaging.recipient_preferences, pharmacy_inventory.inventory_ledger_entries, pharmacy_inventory.inventory_reservation_lines y 12 más. Publica un evento calculado (event.eventType).

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/pharmacy_inventory/controllers/pharmacy-orders.controller.ts:172` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/pharmacy_inventory/controllers/pharmacy-orders.controller.ts:172` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.confirm → PharmacyOrdersService.confirm → PharmacyOrdersService.publishStaffEvent → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.in_app_notifications` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.confirm → PharmacyOrdersService.confirm → PharmacyOrderNotificationsService.substitutionsProposed → PharmacyOrderNotificationsService.emitToPatient → PharmacyOrderNotificationsService.emitToPerson → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createInAppNotification | `src/modules/messaging/repositories/notifications.repository.ts:710` |
| `messaging.in_app_notifications` | LEE | LEE | DIRECTA | PharmacyOrdersController.confirm → PharmacyOrdersService.confirm → PharmacyOrderNotificationsService.substitutionsProposed → PharmacyOrderNotificationsService.emitToPatient → PharmacyOrderNotificationsService.emitToPerson → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findUnreadInAppForResource | `src/modules/messaging/repositories/notifications.repository.ts:845` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | PharmacyOrdersController.confirm → PharmacyOrdersService.confirm → PharmacyOrderNotificationsService.substitutionsProposed → PharmacyOrderNotificationsService.emitToPatient → PharmacyOrderNotificationsService.emitToPerson → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findActiveChannelByType | `src/modules/messaging/repositories/notifications.repository.ts:189` |
| `messaging.messaging_providers` | LEE | LEE | DIRECTA | PharmacyOrdersController.confirm → PharmacyOrdersService.confirm → PharmacyOrderNotificationsService.substitutionsProposed → PharmacyOrderNotificationsService.emitToPatient → PharmacyOrderNotificationsService.emitToPerson → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findProviderById | `src/modules/messaging/repositories/notifications.repository.ts:437` |
| `messaging.notification_deliveries` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.confirm → PharmacyOrdersService.confirm → PharmacyOrderNotificationsService.substitutionsProposed → PharmacyOrderNotificationsService.emitToPatient → PharmacyOrderNotificationsService.emitToPerson → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createDelivery | `src/modules/messaging/repositories/notifications.repository.ts:514` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.confirm → PharmacyOrdersService.confirm → PharmacyOrderNotificationsService.substitutionsProposed → PharmacyOrderNotificationsService.emitToPatient → PharmacyOrderNotificationsService.emitToPerson → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.confirm → PharmacyOrdersService.confirm → PharmacyOrdersService.publishStaffEvent → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:164` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | PharmacyOrdersController.confirm → PharmacyOrdersService.confirm → PharmacyOrdersService.publishStaffEvent → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:188` |
| `messaging.provider_channel_configs` | LEE | LEE | DIRECTA | PharmacyOrdersController.confirm → PharmacyOrdersService.confirm → PharmacyOrderNotificationsService.substitutionsProposed → PharmacyOrderNotificationsService.emitToPatient → PharmacyOrderNotificationsService.emitToPerson → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findChannelConfigs | `src/modules/messaging/repositories/notifications.repository.ts:405` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | PharmacyOrdersController.confirm → PharmacyOrdersService.confirm → PharmacyOrderNotificationsService.substitutionsProposed → PharmacyOrderNotificationsService.emitToPatient → PharmacyOrderNotificationsService.emitToPerson → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `pharmacy_inventory.inventory_ledger_entries` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.confirm → PharmacyOrdersService.confirm → InventoryReservationsService.releaseConfirmedLines → LedgerRepository.append | `src/modules/pharmacy_inventory/repositories/ledger.repository.ts:138` |
| `pharmacy_inventory.inventory_ledger_entries` | LEE | LEE | POR_SQL | PharmacyOrdersController.confirm → PharmacyOrdersService.confirm → InventoryReservationsService.releaseConfirmedLines → LedgerRepository.nextSequence | `src/modules/pharmacy_inventory/repositories/ledger.repository.ts:109` |
| `pharmacy_inventory.inventory_reservation_lines` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyOrdersController.confirm → PharmacyOrdersService.confirm → InventoryReservationsService.releaseConfirmedLines | `src/modules/pharmacy_inventory/services/inventory-reservations.service.ts:238` |
| `pharmacy_inventory.inventory_reservation_lines` | LEE | LEE | DIRECTA | PharmacyOrdersController.confirm → PharmacyOrdersService.confirm → PharmacyOrdersRepository.findLinesByReservationIds | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:212` |
| `pharmacy_inventory.inventory_reservations` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyOrdersController.confirm → PharmacyOrdersService.confirm | `src/modules/pharmacy_inventory/services/pharmacy-orders.service.ts:819` |
| `pharmacy_inventory.inventory_reservations` | LEE | LEE | DIRECTA | PharmacyOrdersController.confirm → PharmacyOrdersService.confirm → PharmacyOrdersService.loadTenantOrderForUpdate → PharmacyOrdersRepository.findOrderByIdForUpdate | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:53` |
| `pharmacy_inventory.inventory_stock_positions` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyOrdersController.confirm → PharmacyOrdersService.confirm → InventoryReservationsService.releaseConfirmedLines | `src/modules/pharmacy_inventory/services/inventory-reservations.service.ts:266` |
| `pharmacy_inventory.inventory_stock_positions` | LEE | LEE | DIRECTA | PharmacyOrdersController.confirm → PharmacyOrdersService.confirm → InventoryReservationsService.releaseConfirmedLines → StockPositionsRepository.findByKeyForUpdate | `src/modules/pharmacy_inventory/repositories/stock-positions.repository.ts:82` |
| `pharmacy_inventory.pharmacy_order_substitutions` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.confirm → PharmacyOrdersService.confirm → PharmacyOrdersService.persistProposals → PharmacyOrderSubstitutionsRepository.create | `src/modules/pharmacy_inventory/repositories/pharmacy-order-substitutions.repository.ts:74` |
| `pharmacy_inventory.pharmacy_order_substitutions` | LEE | LEE | DIRECTA | PharmacyOrdersController.confirm → PharmacyOrdersService.confirm → PharmacyOrdersService.readOrderForTenant → PharmacyOrdersService.composeOrders → PharmacyOrderSubstitutionsRepository.findByReservationIds | `src/modules/pharmacy_inventory/repositories/pharmacy-order-substitutions.repository.ts:62` |
| `pharmacy.pharmacies` | LEE | LEE | DIRECTA | PharmacyOrdersController.confirm → PharmacyOrdersService.confirm → PharmacyOrdersService.loadTenantOrderForUpdate → PharmacyOrdersRepository.findPharmaciesByIdsInTenant | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:224` |
| `pharmacy.pharmacy_price_lists` | LEE | LEE | DIRECTA | PharmacyOrdersController.confirm → PharmacyOrdersService.confirm → PharmacyOrdersService.persistProposals → PharmacyOrdersService.freezePricesFor → PharmacyReadRepository.findCurrentPublicPriceLists | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:166` |
| `pharmacy.pharmacy_product_prices` | LEE | LEE | DIRECTA | PharmacyOrdersController.confirm → PharmacyOrdersService.confirm → PharmacyOrdersService.persistProposals → PharmacyOrdersService.freezePricesFor → PharmacyReadRepository.findCurrentPrices | `src/modules/pharmacy/repositories/pharmacy-read.repository.ts:193` |
| `pharmacy.pharmacy_products` | LEE | LEE | DIRECTA | PharmacyOrdersController.confirm → PharmacyOrdersService.confirm → PharmacyOrdersService.persistProposals → PharmacyOrdersRepository.findProductsByIds | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:242` |
| `pharmacy.pharmacy_sites` | LEE | LEE | DIRECTA | PharmacyOrdersController.confirm → PharmacyOrdersService.confirm → PharmacyOrdersService.readOrderForTenant → PharmacyOrdersService.composeOrders → PharmacyOrdersRepository.findSitesByIds | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:233` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | PharmacyOrdersController.confirm → PharmacyOrdersService.confirm → PharmacyOrderNotificationsService.substitutionsProposed → PharmacyOrderNotificationsService.emitToPatient → PharmacyOrderNotificationsService.emitToPerson → PersonAccountLinksRepository.findActiveByPerson | `src/modules/profiles/repositories/person-account-links.repository.ts:101` |
| `profiles.person_profiles` | LEE | LEE | DIRECTA | PharmacyOrdersController.confirm → PharmacyOrdersService.confirm → PharmacyOrdersService.readOrderForTenant → PharmacyOrdersService.composeOrders → PharmacyOrdersRepository.findPersonNamesByProfileIds | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:135` |
| `profiles.persons` | LEE | LEE | DIRECTA | PharmacyOrdersController.confirm → PharmacyOrdersService.confirm → PharmacyOrdersService.readOrderForTenant → PharmacyOrdersService.composeOrders → PharmacyOrdersRepository.findPersonNamesByProfileIds | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:127` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | PharmacyOrdersController.confirm → PharmacyOrdersService.confirm → PharmacyOrdersService.readOrderForTenant → PharmacyOrdersService.composeOrders → PharmacyOrdersRepository.findConceptsByIds | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:288` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | calculado: `event.eventType` | `src/modules/pharmacy_inventory/services/pharmacy-orders.service.ts:1939` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `ConfirmPharmacyOrderDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `adjustments` | `array<ConfirmOrderAdjustmentDto>` | No | — | `@IsOptional()` `@IsArray()` `@ValidateNested({ each: true })` `@Type(() => ConfirmOrderAdjustmentDto)` | — | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:435` |
| `adjustments[].productId` | `string` | No | formato uuid | `@IsUUID()` | Producto de la línea ajustada | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:402` |
| `adjustments[].decision` | `string` | No | valores: NO_DISPONIBLE, PROPONER_GENERICO | `@IsIn([...CONFIRM_LINE_DECISIONS])` | — | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:409` |

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
      "decision": "NO_DISPONIBLE"
    }
  ]
}
```

</details>

### Respuesta — `Promise<PharmacyOrderDto>` · DTO `PharmacyOrderDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único del pedido. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:204` |
| `status` | `InventoryConceptDto` | Sí | — | — | Estado del pedido (`PINV_ORDER_*`). | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:210` |
| `status.code` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `status.display` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `createdAt` | `string` | Sí | — | — | Instante de creación, ISO 8601. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:216` |
| `expiresAt` | `string` | Sí | — | — | Vencimiento vigente del pedido, ISO 8601 (48 h desde la creación; el carril E2 la renueva al dejarlo listo para retiro). | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:223` |
| `siteId` | `string` | Sí | formato uuid | — | Identificador asociado a site. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:229` |
| `siteName` | `string` | Sí | — | — | Nombre de la sede. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:235` |
| `pharmacyId` | `string` | Sí | formato uuid | — | Identificador asociado a pharmacy. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:241` |
| `pharmacyName` | `string` | Sí | — | — | Nombre de la farmacia (comercial, o la razón social). | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:247` |
| `medicationRequestId` | `string` | No | formato uuid; admite null | — | Receta que respalda el pedido, si la hay. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:253` |
| `patientName` | `string` | No | admite null | — | Nombre pintable del paciente, resuelto en lote por el backend (la bandeja FAR-E2 lo necesita; cero UUIDs como copy). `null` si la persona no tiene nombre cargado. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:261` |
| `deliveryMode` | `InventoryConceptDto` | No | — | — | Modalidad de entrega (`PINV_DELIVERY_*`), resuelta. `null` en pedidos anteriores al modelo v4.2.1, que no la declararon. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:268` |
| `deliveryMode.code` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `deliveryMode.display` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `pickupCode` | `string` | No | admite null | — | Código de retiro del pedido, sellado al quedar `LISTO_PARA_RETIRO`. **Solo en la lectura del titular**: es la prueba de posesión con que la persona retira, así que la bandeja y las lecturas de staff lo sirven `null` — el mostrador no valida mirándolo, valida enviándolo en `POST /pharmacy/orders/:id/dispense`. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:279` |
| `totalAmount` | `string` | No | admite null | — | Total CONGELADO del pedido con su moneda: suma de los precios congelados por el saldo reservado de cada renglón en pie. `null` si a algún renglón le falta precio publicado o si las listas mezclan monedas — una suma con huecos o que mezcla monedas afirma un costo que nadie publicó. Se re-congela cuando el pedido cambia (línea no disponible, sustitución aceptada); jamás se recalcula en una lectura. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:290` |
| `currency` | `InventoryConceptDto` | No | — | — | Moneda del total congelado, resuelta. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:296` |
| `currency.code` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `currency.display` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `rejectionReasonText` | `string` | No | admite null | — | Motivo del rechazo, en palabras, cuando el estado es `RECHAZADO` (v4.2.1 lo persiste). `null` en cualquier otro estado. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:303` |
| `substitutions` | `array<PharmacyOrderSubstitutionDto>` | Sí | — | — | La historia de propuestas de sustitución del pedido, más nuevas primero. Las decididas conservan su estado y su `decidedAt`: son bitácora, no un campo mutable. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:311` |
| `substitutions[].id` | `string` | Sí | formato uuid | — | Identificador de la propuesta. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:326` |
| `substitutions[].originalProductId` | `string` | Sí | formato uuid | — | Producto recetado/pedido. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:332` |
| `substitutions[].originalName` | `string` | Sí | — | — | Nombre pintable del original. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:338` |
| `substitutions[].originalUnitPriceAmount` | `string` | No | admite null | — | Precio congelado del original al proponer, o `null` sin precio publicado. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:344` |
| `substitutions[].proposedProductId` | `string` | Sí | formato uuid | — | Producto propuesto (mismo medicamento del vademécum). | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:350` |
| `substitutions[].proposedName` | `string` | Sí | — | — | Nombre pintable del propuesto. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:356` |
| `substitutions[].proposedUnitPriceAmount` | `string` | No | admite null | — | Precio congelado del propuesto: la oferta que el paciente decidió. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:362` |
| `substitutions[].currency` | `InventoryConceptDto` | No | — | — | Moneda de la oferta, resuelta. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:368` |
| `substitutions[].currency.code` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `substitutions[].currency.display` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `substitutions[].status` | `InventoryConceptDto` | Sí | — | — | Estado de la propuesta (`PINV_SUBSTITUTION_*`), resuelto. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:374` |
| `substitutions[].status.code` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `substitutions[].status.display` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `substitutions[].decidedAt` | `string` | No | admite null | — | Cuándo se decidió (aceptó/rechazó/retiró), ISO 8601; `null` en pie. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:380` |
| `lines` | `array<PharmacyOrderLineDto>` | Sí | — | — | Líneas del pedido. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:317` |
| `lines[].productId` | `string` | Sí | formato uuid | — | Identificador asociado a product. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:118` |
| `lines[].productCode` | `string` | Sí | — | — | Código interno del producto. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:124` |
| `lines[].brandName` | `string` | No | admite null | — | Nombre comercial. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:130` |
| `lines[].genericName` | `string` | No | admite null | — | Nombre genérico. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:136` |
| `lines[].strengthText` | `string` | No | admite null | — | Concentración, legible. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:142` |
| `lines[].packageSizeText` | `string` | No | admite null | — | Presentación, legible. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:148` |
| `lines[].medication` | `InventoryConceptDto` | No | — | — | Medicamento del vademécum, resuelto. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:154` |
| `lines[].medication.code` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `lines[].medication.display` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `lines[].requestedQuantity` | `number` | Sí | — | — | Cantidad solicitada por el paciente. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:160` |
| `lines[].reservedQuantity` | `number` | Sí | — | — | Cantidad efectivamente reservada; `0` cuando la línea quedó sin stock. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:166` |
| `lines[].fulfilledQuantity` | `number` | Sí | — | — | Cantidad ya entregada en el mostrador, acumulada entre entregas parciales (FAR-E3). El saldo por retirar es `reservedQuantity − fulfilledQuantity`. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:173` |
| `lines[].unitPriceAmount` | `string` | No | admite null | — | Precio unitario CONGELADO del renglón (lo que paga el paciente), sellado al crear el pedido o al aceptar una sustitución. `null` si la sede no publicaba precio: el GET no recalcula — un precio congelado que se recalcula contra listas nuevas reescribe un pedido histórico. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:182` |
| `lines[].currency` | `InventoryConceptDto` | No | — | — | Moneda del precio congelado, resuelta. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:188` |
| `lines[].currency.code` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `lines[].currency.display` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `lines[].status` | `InventoryConceptDto` | Sí | — | — | Estado de la línea (`PINV_RES_LINE_CONFIRMED` reservada, `PINV_RES_LINE_OUT_OF_STOCK` sin stock, `PINV_RES_LINE_RELEASED` liberada). | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:195` |
| `lines[].status.code` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `lines[].status.display` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |

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

## 22. POST /pharmacy/orders/{id}/dispense

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** FAR-E3: la entrega en el mostrador, contra el código de retiro. Parcial acumulativa: mientras quede saldo el pedido sigue LISTO_PARA_RETIRO con el mismo código, y pasa a RETIRADO cuando la última línea se cubre.
- **Bloque:** Farmacia
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyOrdersController.dispense` — `src/modules/pharmacy_inventory/controllers/pharmacy-orders.controller.ts:268`

### Qué es y para qué sirve (negocio)

FAR-E3: la entrega en el mostrador, contra el código de retiro. Parcial acumulativa: mientras quede saldo el pedido sigue LISTO_PARA_RETIRO con el mismo código, y pasa a RETIRADO cuando la última línea se cubre. Dentro del módulo (descripción del modelo, en inglés): «Prevents overselling and untraceable adjustments under concurrent manual, API, dispensing and receiving operations.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_25_pharmacy_inventory.puml:20`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`POST /pharmacy/orders/{id}/dispense` la atiende `PharmacyOrdersController.dispense` (src/modules/pharmacy_inventory/controllers/pharmacy-orders.controller.ts:268). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `DispensePharmacyOrderDto` (3 campos, 1 obligatorio). Delega en `PharmacyOrdersService.dispense`. Crea filas en messaging.domain_events, messaging.in_app_notifications, messaging.notification_deliveries, messaging.notification_requests, messaging.outbox_messages, pharmacy_inventory.inventory_ledger_entries, pharmacy_inventory.medication_dispensation_lines, pharmacy_inventory.medication_dispensations. Actualiza pharmacy_inventory.inventory_reservations, pharmacy_inventory.inventory_stock_positions. Lee clinical.medication_requests, messaging.in_app_notifications, messaging.message_channels, messaging.messaging_providers, messaging.outbox_messages, messaging.provider_channel_configs, messaging.recipient_preferences, pharmacy_inventory.inventory_ledger_entries y 12 más. Publica un evento calculado (event.eventType).

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/pharmacy_inventory/controllers/pharmacy-orders.controller.ts:268` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/pharmacy_inventory/controllers/pharmacy-orders.controller.ts:268` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.medication_requests` | LEE | LEE | DIRECTA | PharmacyOrdersController.dispense → PharmacyOrdersService.dispense → PharmacyOrdersRepository.findPrescriberProfileId | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:276` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.dispense → PharmacyOrdersService.dispense → PharmacyOrdersService.publishStaffEvent → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.in_app_notifications` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.dispense → PharmacyOrdersService.dispense → PharmacyOrderNotificationsService.dispensedToPrescriber → PharmacyOrderNotificationsService.emitToPerson → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createInAppNotification | `src/modules/messaging/repositories/notifications.repository.ts:710` |
| `messaging.in_app_notifications` | LEE | LEE | DIRECTA | PharmacyOrdersController.dispense → PharmacyOrdersService.dispense → PharmacyOrderNotificationsService.dispensedToPrescriber → PharmacyOrderNotificationsService.emitToPerson → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findUnreadInAppForResource | `src/modules/messaging/repositories/notifications.repository.ts:845` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | PharmacyOrdersController.dispense → PharmacyOrdersService.dispense → PharmacyOrderNotificationsService.dispensedToPrescriber → PharmacyOrderNotificationsService.emitToPerson → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findActiveChannelByType | `src/modules/messaging/repositories/notifications.repository.ts:189` |
| `messaging.messaging_providers` | LEE | LEE | DIRECTA | PharmacyOrdersController.dispense → PharmacyOrdersService.dispense → PharmacyOrderNotificationsService.dispensedToPrescriber → PharmacyOrderNotificationsService.emitToPerson → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findProviderById | `src/modules/messaging/repositories/notifications.repository.ts:437` |
| `messaging.notification_deliveries` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.dispense → PharmacyOrdersService.dispense → PharmacyOrderNotificationsService.dispensedToPrescriber → PharmacyOrderNotificationsService.emitToPerson → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createDelivery | `src/modules/messaging/repositories/notifications.repository.ts:514` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.dispense → PharmacyOrdersService.dispense → PharmacyOrderNotificationsService.dispensedToPrescriber → PharmacyOrderNotificationsService.emitToPerson → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.dispense → PharmacyOrdersService.dispense → PharmacyOrdersService.publishStaffEvent → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:164` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | PharmacyOrdersController.dispense → PharmacyOrdersService.dispense → PharmacyOrdersService.publishStaffEvent → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:188` |
| `messaging.provider_channel_configs` | LEE | LEE | DIRECTA | PharmacyOrdersController.dispense → PharmacyOrdersService.dispense → PharmacyOrderNotificationsService.dispensedToPrescriber → PharmacyOrderNotificationsService.emitToPerson → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findChannelConfigs | `src/modules/messaging/repositories/notifications.repository.ts:405` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | PharmacyOrdersController.dispense → PharmacyOrdersService.dispense → PharmacyOrderNotificationsService.dispensedToPrescriber → PharmacyOrderNotificationsService.emitToPerson → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `pharmacy_inventory.inventory_ledger_entries` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.dispense → PharmacyOrdersService.dispense → LedgerRepository.append | `src/modules/pharmacy_inventory/repositories/ledger.repository.ts:138` |
| `pharmacy_inventory.inventory_ledger_entries` | LEE | LEE | POR_SQL | PharmacyOrdersController.dispense → PharmacyOrdersService.dispense → LedgerRepository.nextSequence | `src/modules/pharmacy_inventory/repositories/ledger.repository.ts:109` |
| `pharmacy_inventory.inventory_reservation_lines` | LEE | LEE | DIRECTA | PharmacyOrdersController.dispense → PharmacyOrdersService.dispense → PharmacyOrdersRepository.findLinesByReservationIds | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:212` |
| `pharmacy_inventory.inventory_reservations` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyOrdersController.dispense → PharmacyOrdersService.dispense | `src/modules/pharmacy_inventory/services/pharmacy-orders.service.ts:1389` |
| `pharmacy_inventory.inventory_reservations` | LEE | LEE | DIRECTA | PharmacyOrdersController.dispense → PharmacyOrdersService.dispense → PharmacyOrdersService.loadTenantOrderForUpdate → PharmacyOrdersRepository.findOrderByIdForUpdate | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:53` |
| `pharmacy_inventory.inventory_stock_positions` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyOrdersController.dispense → PharmacyOrdersService.dispense | `src/modules/pharmacy_inventory/services/pharmacy-orders.service.ts:1363` |
| `pharmacy_inventory.inventory_stock_positions` | LEE | LEE | DIRECTA | PharmacyOrdersController.dispense → PharmacyOrdersService.dispense → StockPositionsRepository.findByKeyForUpdate | `src/modules/pharmacy_inventory/repositories/stock-positions.repository.ts:82` |
| `pharmacy_inventory.medication_dispensation_lines` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.dispense → PharmacyOrdersService.dispense → DispensationsRepository.createLine | `src/modules/pharmacy_inventory/repositories/dispensations.repository.ts:175` |
| `pharmacy_inventory.medication_dispensations` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.dispense → PharmacyOrdersService.dispense → DispensationsRepository.create | `src/modules/pharmacy_inventory/repositories/dispensations.repository.ts:146` |
| `pharmacy_inventory.medication_dispensations` | LEE | LEE | DIRECTA | PharmacyOrdersController.dispense → PharmacyOrdersService.dispense → DispensationsRepository.findByIdempotencyKey | `src/modules/pharmacy_inventory/repositories/dispensations.repository.ts:116` |
| `pharmacy_inventory.pharmacy_order_substitutions` | LEE | LEE | DIRECTA | PharmacyOrdersController.dispense → PharmacyOrdersService.dispense → PharmacyOrdersService.readOrderForTenant → PharmacyOrdersService.composeOrders → PharmacyOrderSubstitutionsRepository.findByReservationIds | `src/modules/pharmacy_inventory/repositories/pharmacy-order-substitutions.repository.ts:62` |
| `pharmacy.pharmacies` | LEE | LEE | DIRECTA | PharmacyOrdersController.dispense → PharmacyOrdersService.dispense → PharmacyOrdersService.loadTenantOrderForUpdate → PharmacyOrdersRepository.findPharmaciesByIdsInTenant | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:224` |
| `pharmacy.pharmacy_products` | LEE | LEE | DIRECTA | PharmacyOrdersController.dispense → PharmacyOrdersService.dispense → PharmacyOrdersService.readOrderForTenant → PharmacyOrdersService.composeOrders → PharmacyOrdersRepository.findProductsByIds | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:242` |
| `pharmacy.pharmacy_sites` | LEE | LEE | DIRECTA | PharmacyOrdersController.dispense → PharmacyOrdersService.dispense → PharmacyOrdersService.readOrderForTenant → PharmacyOrdersService.composeOrders → PharmacyOrdersRepository.findSitesByIds | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:233` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | PharmacyOrdersController.dispense → PharmacyOrdersService.dispense → PharmacyOrderNotificationsService.dispensedToPrescriber → PharmacyOrderNotificationsService.emitToPerson → PersonAccountLinksRepository.findActiveByPerson | `src/modules/profiles/repositories/person-account-links.repository.ts:101` |
| `profiles.person_profiles` | LEE | LEE | DIRECTA | PharmacyOrdersController.dispense → PharmacyOrdersService.dispense → PharmacyOrdersService.readOrderForTenant → PharmacyOrdersService.composeOrders → PharmacyOrdersRepository.findPersonNamesByProfileIds | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:135` |
| `profiles.persons` | LEE | LEE | DIRECTA | PharmacyOrdersController.dispense → PharmacyOrdersService.dispense → PharmacyOrdersService.readOrderForTenant → PharmacyOrdersService.composeOrders → PharmacyOrdersRepository.findPersonNamesByProfileIds | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:127` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | PharmacyOrdersController.dispense → PharmacyOrdersService.dispense → PharmacyOrdersService.readOrderForTenant → PharmacyOrdersService.composeOrders → PharmacyOrdersRepository.findConceptsByIds | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:288` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | calculado: `event.eventType` | `src/modules/pharmacy_inventory/services/pharmacy-orders.service.ts:1939` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `DispensePharmacyOrderDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `pickupCode` | `string` | Sí | longitud mínima 1; longitud máxima 20 | `@IsString()` `@IsNotEmpty()` `@MaxLength(20)` | Código de retiro que presenta la persona | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:464` |
| `productIds` | `array<string>` | No | formato uuid; mínimo 1 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayMinSize(1)` `@IsUUID('all', { each: true })` | Productos de esta entrega; omitido = todo el saldo en pie | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:479` |
| `idempotencyKey` | `string` | No | longitud máxima 120 | `@IsOptional()` `@IsString()` `@MaxLength(120)` | Clave de idempotencia; repetirla no duplica la entrega | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:492` |

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
    "valor-ejemplo"
  ],
  "idempotencyKey": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<PharmacyOrderDto>` · DTO `PharmacyOrderDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único del pedido. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:204` |
| `status` | `InventoryConceptDto` | Sí | — | — | Estado del pedido (`PINV_ORDER_*`). | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:210` |
| `status.code` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `status.display` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `createdAt` | `string` | Sí | — | — | Instante de creación, ISO 8601. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:216` |
| `expiresAt` | `string` | Sí | — | — | Vencimiento vigente del pedido, ISO 8601 (48 h desde la creación; el carril E2 la renueva al dejarlo listo para retiro). | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:223` |
| `siteId` | `string` | Sí | formato uuid | — | Identificador asociado a site. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:229` |
| `siteName` | `string` | Sí | — | — | Nombre de la sede. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:235` |
| `pharmacyId` | `string` | Sí | formato uuid | — | Identificador asociado a pharmacy. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:241` |
| `pharmacyName` | `string` | Sí | — | — | Nombre de la farmacia (comercial, o la razón social). | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:247` |
| `medicationRequestId` | `string` | No | formato uuid; admite null | — | Receta que respalda el pedido, si la hay. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:253` |
| `patientName` | `string` | No | admite null | — | Nombre pintable del paciente, resuelto en lote por el backend (la bandeja FAR-E2 lo necesita; cero UUIDs como copy). `null` si la persona no tiene nombre cargado. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:261` |
| `deliveryMode` | `InventoryConceptDto` | No | — | — | Modalidad de entrega (`PINV_DELIVERY_*`), resuelta. `null` en pedidos anteriores al modelo v4.2.1, que no la declararon. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:268` |
| `deliveryMode.code` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `deliveryMode.display` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `pickupCode` | `string` | No | admite null | — | Código de retiro del pedido, sellado al quedar `LISTO_PARA_RETIRO`. **Solo en la lectura del titular**: es la prueba de posesión con que la persona retira, así que la bandeja y las lecturas de staff lo sirven `null` — el mostrador no valida mirándolo, valida enviándolo en `POST /pharmacy/orders/:id/dispense`. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:279` |
| `totalAmount` | `string` | No | admite null | — | Total CONGELADO del pedido con su moneda: suma de los precios congelados por el saldo reservado de cada renglón en pie. `null` si a algún renglón le falta precio publicado o si las listas mezclan monedas — una suma con huecos o que mezcla monedas afirma un costo que nadie publicó. Se re-congela cuando el pedido cambia (línea no disponible, sustitución aceptada); jamás se recalcula en una lectura. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:290` |
| `currency` | `InventoryConceptDto` | No | — | — | Moneda del total congelado, resuelta. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:296` |
| `currency.code` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `currency.display` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `rejectionReasonText` | `string` | No | admite null | — | Motivo del rechazo, en palabras, cuando el estado es `RECHAZADO` (v4.2.1 lo persiste). `null` en cualquier otro estado. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:303` |
| `substitutions` | `array<PharmacyOrderSubstitutionDto>` | Sí | — | — | La historia de propuestas de sustitución del pedido, más nuevas primero. Las decididas conservan su estado y su `decidedAt`: son bitácora, no un campo mutable. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:311` |
| `substitutions[].id` | `string` | Sí | formato uuid | — | Identificador de la propuesta. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:326` |
| `substitutions[].originalProductId` | `string` | Sí | formato uuid | — | Producto recetado/pedido. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:332` |
| `substitutions[].originalName` | `string` | Sí | — | — | Nombre pintable del original. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:338` |
| `substitutions[].originalUnitPriceAmount` | `string` | No | admite null | — | Precio congelado del original al proponer, o `null` sin precio publicado. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:344` |
| `substitutions[].proposedProductId` | `string` | Sí | formato uuid | — | Producto propuesto (mismo medicamento del vademécum). | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:350` |
| `substitutions[].proposedName` | `string` | Sí | — | — | Nombre pintable del propuesto. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:356` |
| `substitutions[].proposedUnitPriceAmount` | `string` | No | admite null | — | Precio congelado del propuesto: la oferta que el paciente decidió. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:362` |
| `substitutions[].currency` | `InventoryConceptDto` | No | — | — | Moneda de la oferta, resuelta. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:368` |
| `substitutions[].currency.code` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `substitutions[].currency.display` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `substitutions[].status` | `InventoryConceptDto` | Sí | — | — | Estado de la propuesta (`PINV_SUBSTITUTION_*`), resuelto. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:374` |
| `substitutions[].status.code` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `substitutions[].status.display` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `substitutions[].decidedAt` | `string` | No | admite null | — | Cuándo se decidió (aceptó/rechazó/retiró), ISO 8601; `null` en pie. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:380` |
| `lines` | `array<PharmacyOrderLineDto>` | Sí | — | — | Líneas del pedido. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:317` |
| `lines[].productId` | `string` | Sí | formato uuid | — | Identificador asociado a product. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:118` |
| `lines[].productCode` | `string` | Sí | — | — | Código interno del producto. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:124` |
| `lines[].brandName` | `string` | No | admite null | — | Nombre comercial. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:130` |
| `lines[].genericName` | `string` | No | admite null | — | Nombre genérico. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:136` |
| `lines[].strengthText` | `string` | No | admite null | — | Concentración, legible. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:142` |
| `lines[].packageSizeText` | `string` | No | admite null | — | Presentación, legible. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:148` |
| `lines[].medication` | `InventoryConceptDto` | No | — | — | Medicamento del vademécum, resuelto. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:154` |
| `lines[].medication.code` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `lines[].medication.display` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `lines[].requestedQuantity` | `number` | Sí | — | — | Cantidad solicitada por el paciente. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:160` |
| `lines[].reservedQuantity` | `number` | Sí | — | — | Cantidad efectivamente reservada; `0` cuando la línea quedó sin stock. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:166` |
| `lines[].fulfilledQuantity` | `number` | Sí | — | — | Cantidad ya entregada en el mostrador, acumulada entre entregas parciales (FAR-E3). El saldo por retirar es `reservedQuantity − fulfilledQuantity`. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:173` |
| `lines[].unitPriceAmount` | `string` | No | admite null | — | Precio unitario CONGELADO del renglón (lo que paga el paciente), sellado al crear el pedido o al aceptar una sustitución. `null` si la sede no publicaba precio: el GET no recalcula — un precio congelado que se recalcula contra listas nuevas reescribe un pedido histórico. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:182` |
| `lines[].currency` | `InventoryConceptDto` | No | — | — | Moneda del precio congelado, resuelta. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:188` |
| `lines[].currency.code` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `lines[].currency.display` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `lines[].status` | `InventoryConceptDto` | Sí | — | — | Estado de la línea (`PINV_RES_LINE_CONFIRMED` reservada, `PINV_RES_LINE_OUT_OF_STOCK` sin stock, `PINV_RES_LINE_RELEASED` liberada). | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:195` |
| `lines[].status.code` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `lines[].status.display` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
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

## 23. POST /pharmacy/orders/{id}/prefer-original

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** FAR-E2/I2: el titular prefiere los originales. `ACEPTACION_PENDIENTE → CONFIRMADO`; las líneas no se tocan.
- **Bloque:** Farmacia
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyOrdersController.preferOriginal` — `src/modules/pharmacy_inventory/controllers/pharmacy-orders.controller.ts:211`

### Qué es y para qué sirve (negocio)

FAR-E2/I2: el titular prefiere los originales. `ACEPTACION_PENDIENTE → CONFIRMADO`; las líneas no se tocan. Dentro del módulo (descripción del modelo, en inglés): «Prevents overselling and untraceable adjustments under concurrent manual, API, dispensing and receiving operations.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_25_pharmacy_inventory.puml:20`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`POST /pharmacy/orders/{id}/prefer-original` la atiende `PharmacyOrdersController.preferOriginal` (src/modules/pharmacy_inventory/controllers/pharmacy-orders.controller.ts:211). Exige sesión con alguno de los roles PATIENT. Delega en `PharmacyOrdersService.preferOriginal`. Crea filas en messaging.domain_events, messaging.outbox_messages. Actualiza pharmacy_inventory.inventory_reservations, pharmacy_inventory.pharmacy_order_substitutions. Lee messaging.outbox_messages, pharmacy_inventory.inventory_reservation_lines, pharmacy_inventory.inventory_reservations, pharmacy_inventory.pharmacy_order_substitutions, pharmacy.pharmacies, pharmacy.pharmacy_products, pharmacy.pharmacy_sites, profiles.person_profiles y 2 más. Publica un evento calculado (event.eventType).

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PATIENT | `src/modules/pharmacy_inventory/controllers/pharmacy-orders.controller.ts:211` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/pharmacy_inventory/controllers/pharmacy-orders.controller.ts:211` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.preferOriginal → PharmacyOrdersService.preferOriginal → PharmacyOrdersService.publishStaffEvent → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.preferOriginal → PharmacyOrdersService.preferOriginal → PharmacyOrdersService.publishStaffEvent → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:164` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | PharmacyOrdersController.preferOriginal → PharmacyOrdersService.preferOriginal → PharmacyOrdersService.publishStaffEvent → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:188` |
| `pharmacy_inventory.inventory_reservation_lines` | LEE | LEE | DIRECTA | PharmacyOrdersController.preferOriginal → PharmacyOrdersService.preferOriginal → PharmacyOrdersService.readOwnOrder → PharmacyOrdersService.composeOrders → PharmacyOrdersRepository.findLinesByReservationIds | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:212` |
| `pharmacy_inventory.inventory_reservations` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyOrdersController.preferOriginal → PharmacyOrdersService.preferOriginal | `src/modules/pharmacy_inventory/services/pharmacy-orders.service.ts:1021` |
| `pharmacy_inventory.inventory_reservations` | LEE | LEE | DIRECTA | PharmacyOrdersController.preferOriginal → PharmacyOrdersService.preferOriginal → PharmacyOrdersService.loadOwnOrderForUpdate → PharmacyOrdersRepository.findOrderByIdForUpdate | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:53` |
| `pharmacy_inventory.pharmacy_order_substitutions` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyOrdersController.preferOriginal → PharmacyOrdersService.preferOriginal | `src/modules/pharmacy_inventory/services/pharmacy-orders.service.ts:1016` |
| `pharmacy_inventory.pharmacy_order_substitutions` | LEE | LEE | DIRECTA | PharmacyOrdersController.preferOriginal → PharmacyOrdersService.preferOriginal → PharmacyOrdersService.pendingProposalsOf → PharmacyOrderSubstitutionsRepository.findByReservationIds | `src/modules/pharmacy_inventory/repositories/pharmacy-order-substitutions.repository.ts:62` |
| `pharmacy.pharmacies` | LEE | LEE | DIRECTA | PharmacyOrdersController.preferOriginal → PharmacyOrdersService.preferOriginal → PharmacyOrdersService.loadOwnOrderForUpdate → PharmacyOrdersRepository.findPharmaciesByIdsInTenant | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:224` |
| `pharmacy.pharmacy_products` | LEE | LEE | DIRECTA | PharmacyOrdersController.preferOriginal → PharmacyOrdersService.preferOriginal → PharmacyOrdersService.readOwnOrder → PharmacyOrdersService.composeOrders → PharmacyOrdersRepository.findProductsByIds | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:242` |
| `pharmacy.pharmacy_sites` | LEE | LEE | DIRECTA | PharmacyOrdersController.preferOriginal → PharmacyOrdersService.preferOriginal → PharmacyOrdersService.readOwnOrder → PharmacyOrdersService.composeOrders → PharmacyOrdersRepository.findSitesByIds | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:233` |
| `profiles.person_profiles` | LEE | LEE | DIRECTA | PharmacyOrdersController.preferOriginal → PharmacyOrdersService.preferOriginal → PharmacyOrdersService.readOwnOrder → PharmacyOrdersService.composeOrders → PharmacyOrdersRepository.findPersonNamesByProfileIds | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:135` |
| `profiles.persons` | LEE | LEE | DIRECTA | PharmacyOrdersController.preferOriginal → PharmacyOrdersService.preferOriginal → PharmacyOrdersService.readOwnOrder → PharmacyOrdersService.composeOrders → PharmacyOrdersRepository.findPersonNamesByProfileIds | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:127` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | PharmacyOrdersController.preferOriginal → PharmacyOrdersService.preferOriginal → PharmacyOrdersService.readOwnOrder → PharmacyOrdersService.composeOrders → PharmacyOrdersRepository.findConceptsByIds | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:288` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | calculado: `event.eventType` | `src/modules/pharmacy_inventory/services/pharmacy-orders.service.ts:1939` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PharmacyOrderDto>` · DTO `PharmacyOrderDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único del pedido. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:204` |
| `status` | `InventoryConceptDto` | Sí | — | — | Estado del pedido (`PINV_ORDER_*`). | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:210` |
| `status.code` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `status.display` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `createdAt` | `string` | Sí | — | — | Instante de creación, ISO 8601. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:216` |
| `expiresAt` | `string` | Sí | — | — | Vencimiento vigente del pedido, ISO 8601 (48 h desde la creación; el carril E2 la renueva al dejarlo listo para retiro). | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:223` |
| `siteId` | `string` | Sí | formato uuid | — | Identificador asociado a site. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:229` |
| `siteName` | `string` | Sí | — | — | Nombre de la sede. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:235` |
| `pharmacyId` | `string` | Sí | formato uuid | — | Identificador asociado a pharmacy. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:241` |
| `pharmacyName` | `string` | Sí | — | — | Nombre de la farmacia (comercial, o la razón social). | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:247` |
| `medicationRequestId` | `string` | No | formato uuid; admite null | — | Receta que respalda el pedido, si la hay. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:253` |
| `patientName` | `string` | No | admite null | — | Nombre pintable del paciente, resuelto en lote por el backend (la bandeja FAR-E2 lo necesita; cero UUIDs como copy). `null` si la persona no tiene nombre cargado. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:261` |
| `deliveryMode` | `InventoryConceptDto` | No | — | — | Modalidad de entrega (`PINV_DELIVERY_*`), resuelta. `null` en pedidos anteriores al modelo v4.2.1, que no la declararon. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:268` |
| `deliveryMode.code` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `deliveryMode.display` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `pickupCode` | `string` | No | admite null | — | Código de retiro del pedido, sellado al quedar `LISTO_PARA_RETIRO`. **Solo en la lectura del titular**: es la prueba de posesión con que la persona retira, así que la bandeja y las lecturas de staff lo sirven `null` — el mostrador no valida mirándolo, valida enviándolo en `POST /pharmacy/orders/:id/dispense`. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:279` |
| `totalAmount` | `string` | No | admite null | — | Total CONGELADO del pedido con su moneda: suma de los precios congelados por el saldo reservado de cada renglón en pie. `null` si a algún renglón le falta precio publicado o si las listas mezclan monedas — una suma con huecos o que mezcla monedas afirma un costo que nadie publicó. Se re-congela cuando el pedido cambia (línea no disponible, sustitución aceptada); jamás se recalcula en una lectura. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:290` |
| `currency` | `InventoryConceptDto` | No | — | — | Moneda del total congelado, resuelta. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:296` |
| `currency.code` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `currency.display` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `rejectionReasonText` | `string` | No | admite null | — | Motivo del rechazo, en palabras, cuando el estado es `RECHAZADO` (v4.2.1 lo persiste). `null` en cualquier otro estado. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:303` |
| `substitutions` | `array<PharmacyOrderSubstitutionDto>` | Sí | — | — | La historia de propuestas de sustitución del pedido, más nuevas primero. Las decididas conservan su estado y su `decidedAt`: son bitácora, no un campo mutable. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:311` |
| `substitutions[].id` | `string` | Sí | formato uuid | — | Identificador de la propuesta. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:326` |
| `substitutions[].originalProductId` | `string` | Sí | formato uuid | — | Producto recetado/pedido. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:332` |
| `substitutions[].originalName` | `string` | Sí | — | — | Nombre pintable del original. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:338` |
| `substitutions[].originalUnitPriceAmount` | `string` | No | admite null | — | Precio congelado del original al proponer, o `null` sin precio publicado. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:344` |
| `substitutions[].proposedProductId` | `string` | Sí | formato uuid | — | Producto propuesto (mismo medicamento del vademécum). | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:350` |
| `substitutions[].proposedName` | `string` | Sí | — | — | Nombre pintable del propuesto. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:356` |
| `substitutions[].proposedUnitPriceAmount` | `string` | No | admite null | — | Precio congelado del propuesto: la oferta que el paciente decidió. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:362` |
| `substitutions[].currency` | `InventoryConceptDto` | No | — | — | Moneda de la oferta, resuelta. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:368` |
| `substitutions[].currency.code` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `substitutions[].currency.display` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `substitutions[].status` | `InventoryConceptDto` | Sí | — | — | Estado de la propuesta (`PINV_SUBSTITUTION_*`), resuelto. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:374` |
| `substitutions[].status.code` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `substitutions[].status.display` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `substitutions[].decidedAt` | `string` | No | admite null | — | Cuándo se decidió (aceptó/rechazó/retiró), ISO 8601; `null` en pie. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:380` |
| `lines` | `array<PharmacyOrderLineDto>` | Sí | — | — | Líneas del pedido. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:317` |
| `lines[].productId` | `string` | Sí | formato uuid | — | Identificador asociado a product. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:118` |
| `lines[].productCode` | `string` | Sí | — | — | Código interno del producto. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:124` |
| `lines[].brandName` | `string` | No | admite null | — | Nombre comercial. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:130` |
| `lines[].genericName` | `string` | No | admite null | — | Nombre genérico. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:136` |
| `lines[].strengthText` | `string` | No | admite null | — | Concentración, legible. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:142` |
| `lines[].packageSizeText` | `string` | No | admite null | — | Presentación, legible. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:148` |
| `lines[].medication` | `InventoryConceptDto` | No | — | — | Medicamento del vademécum, resuelto. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:154` |
| `lines[].medication.code` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `lines[].medication.display` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `lines[].requestedQuantity` | `number` | Sí | — | — | Cantidad solicitada por el paciente. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:160` |
| `lines[].reservedQuantity` | `number` | Sí | — | — | Cantidad efectivamente reservada; `0` cuando la línea quedó sin stock. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:166` |
| `lines[].fulfilledQuantity` | `number` | Sí | — | — | Cantidad ya entregada en el mostrador, acumulada entre entregas parciales (FAR-E3). El saldo por retirar es `reservedQuantity − fulfilledQuantity`. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:173` |
| `lines[].unitPriceAmount` | `string` | No | admite null | — | Precio unitario CONGELADO del renglón (lo que paga el paciente), sellado al crear el pedido o al aceptar una sustitución. `null` si la sede no publicaba precio: el GET no recalcula — un precio congelado que se recalcula contra listas nuevas reescribe un pedido histórico. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:182` |
| `lines[].currency` | `InventoryConceptDto` | No | — | — | Moneda del precio congelado, resuelta. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:188` |
| `lines[].currency.code` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `lines[].currency.display` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `lines[].status` | `InventoryConceptDto` | Sí | — | — | Estado de la línea (`PINV_RES_LINE_CONFIRMED` reservada, `PINV_RES_LINE_OUT_OF_STOCK` sin stock, `PINV_RES_LINE_RELEASED` liberada). | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:195` |
| `lines[].status.code` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `lines[].status.display` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |

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

## 24. POST /pharmacy/orders/{id}/ready

- **Origen:** CONTRATO
- **Nombre:** Marcar el pedido listo para retiro (FAR-E2 — bloqueado)
- **Bloque:** Farmacia
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyOrdersController.ready` — `src/modules/pharmacy_inventory/controllers/pharmacy-orders.controller.ts:248`

### Qué es y para qué sirve (negocio)

Marcar el pedido listo para retiro (FAR-E2 — bloqueado). Dentro del módulo (descripción del modelo, en inglés): «Prevents overselling and untraceable adjustments under concurrent manual, API, dispensing and receiving operations.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_25_pharmacy_inventory.puml:20`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`POST /pharmacy/orders/{id}/ready` la atiende `PharmacyOrdersController.ready` (src/modules/pharmacy_inventory/controllers/pharmacy-orders.controller.ts:248). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `PharmacyOrdersService.ready`. Crea filas en messaging.domain_events, messaging.in_app_notifications, messaging.notification_deliveries, messaging.notification_requests, messaging.outbox_messages. Actualiza pharmacy_inventory.inventory_reservations. Lee messaging.in_app_notifications, messaging.message_channels, messaging.messaging_providers, messaging.outbox_messages, messaging.provider_channel_configs, messaging.recipient_preferences, pharmacy_inventory.inventory_reservation_lines, pharmacy_inventory.inventory_reservations y 8 más. Publica un evento calculado (event.eventType).

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/pharmacy_inventory/controllers/pharmacy-orders.controller.ts:248` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/pharmacy_inventory/controllers/pharmacy-orders.controller.ts:248` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.ready → PharmacyOrdersService.ready → PharmacyOrdersService.publishStaffEvent → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.in_app_notifications` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.ready → PharmacyOrdersService.ready → PharmacyOrderNotificationsService.orderReady → PharmacyOrderNotificationsService.emitToPatient → PharmacyOrderNotificationsService.emitToPerson → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createInAppNotification | `src/modules/messaging/repositories/notifications.repository.ts:710` |
| `messaging.in_app_notifications` | LEE | LEE | DIRECTA | PharmacyOrdersController.ready → PharmacyOrdersService.ready → PharmacyOrderNotificationsService.orderReady → PharmacyOrderNotificationsService.emitToPatient → PharmacyOrderNotificationsService.emitToPerson → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findUnreadInAppForResource | `src/modules/messaging/repositories/notifications.repository.ts:845` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | PharmacyOrdersController.ready → PharmacyOrdersService.ready → PharmacyOrderNotificationsService.orderReady → PharmacyOrderNotificationsService.emitToPatient → PharmacyOrderNotificationsService.emitToPerson → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findActiveChannelByType | `src/modules/messaging/repositories/notifications.repository.ts:189` |
| `messaging.messaging_providers` | LEE | LEE | DIRECTA | PharmacyOrdersController.ready → PharmacyOrdersService.ready → PharmacyOrderNotificationsService.orderReady → PharmacyOrderNotificationsService.emitToPatient → PharmacyOrderNotificationsService.emitToPerson → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findProviderById | `src/modules/messaging/repositories/notifications.repository.ts:437` |
| `messaging.notification_deliveries` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.ready → PharmacyOrdersService.ready → PharmacyOrderNotificationsService.orderReady → PharmacyOrderNotificationsService.emitToPatient → PharmacyOrderNotificationsService.emitToPerson → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createDelivery | `src/modules/messaging/repositories/notifications.repository.ts:514` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.ready → PharmacyOrdersService.ready → PharmacyOrderNotificationsService.orderReady → PharmacyOrderNotificationsService.emitToPatient → PharmacyOrderNotificationsService.emitToPerson → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.ready → PharmacyOrdersService.ready → PharmacyOrdersService.publishStaffEvent → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:164` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | PharmacyOrdersController.ready → PharmacyOrdersService.ready → PharmacyOrdersService.publishStaffEvent → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:188` |
| `messaging.provider_channel_configs` | LEE | LEE | DIRECTA | PharmacyOrdersController.ready → PharmacyOrdersService.ready → PharmacyOrderNotificationsService.orderReady → PharmacyOrderNotificationsService.emitToPatient → PharmacyOrderNotificationsService.emitToPerson → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findChannelConfigs | `src/modules/messaging/repositories/notifications.repository.ts:405` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | PharmacyOrdersController.ready → PharmacyOrdersService.ready → PharmacyOrderNotificationsService.orderReady → PharmacyOrderNotificationsService.emitToPatient → PharmacyOrderNotificationsService.emitToPerson → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `pharmacy_inventory.inventory_reservation_lines` | LEE | LEE | DIRECTA | PharmacyOrdersController.ready → PharmacyOrdersService.ready → PharmacyOrdersService.readOrderForTenant → PharmacyOrdersService.composeOrders → PharmacyOrdersRepository.findLinesByReservationIds | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:212` |
| `pharmacy_inventory.inventory_reservations` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyOrdersController.ready → PharmacyOrdersService.ready | `src/modules/pharmacy_inventory/services/pharmacy-orders.service.ts:1140` |
| `pharmacy_inventory.inventory_reservations` | LEE | LEE | DIRECTA | PharmacyOrdersController.ready → PharmacyOrdersService.ready → PharmacyOrdersService.loadTenantOrderForUpdate → PharmacyOrdersRepository.findOrderByIdForUpdate | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:53` |
| `pharmacy_inventory.pharmacy_order_substitutions` | LEE | LEE | DIRECTA | PharmacyOrdersController.ready → PharmacyOrdersService.ready → PharmacyOrdersService.readOrderForTenant → PharmacyOrdersService.composeOrders → PharmacyOrderSubstitutionsRepository.findByReservationIds | `src/modules/pharmacy_inventory/repositories/pharmacy-order-substitutions.repository.ts:62` |
| `pharmacy.pharmacies` | LEE | LEE | DIRECTA | PharmacyOrdersController.ready → PharmacyOrdersService.ready → PharmacyOrdersService.loadTenantOrderForUpdate → PharmacyOrdersRepository.findPharmaciesByIdsInTenant | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:224` |
| `pharmacy.pharmacy_products` | LEE | LEE | DIRECTA | PharmacyOrdersController.ready → PharmacyOrdersService.ready → PharmacyOrdersService.readOrderForTenant → PharmacyOrdersService.composeOrders → PharmacyOrdersRepository.findProductsByIds | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:242` |
| `pharmacy.pharmacy_sites` | LEE | LEE | DIRECTA | PharmacyOrdersController.ready → PharmacyOrdersService.ready → PharmacyOrdersService.assertPickupOrder → PharmacyOrdersRepository.findSitesByIds | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:233` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | PharmacyOrdersController.ready → PharmacyOrdersService.ready → PharmacyOrderNotificationsService.orderReady → PharmacyOrderNotificationsService.emitToPatient → PharmacyOrderNotificationsService.emitToPerson → PersonAccountLinksRepository.findActiveByPerson | `src/modules/profiles/repositories/person-account-links.repository.ts:101` |
| `profiles.person_profiles` | LEE | LEE | DIRECTA | PharmacyOrdersController.ready → PharmacyOrdersService.ready → PharmacyOrdersService.readOrderForTenant → PharmacyOrdersService.composeOrders → PharmacyOrdersRepository.findPersonNamesByProfileIds | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:135` |
| `profiles.persons` | LEE | LEE | DIRECTA | PharmacyOrdersController.ready → PharmacyOrdersService.ready → PharmacyOrdersService.readOrderForTenant → PharmacyOrdersService.composeOrders → PharmacyOrdersRepository.findPersonNamesByProfileIds | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:127` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | PharmacyOrdersController.ready → PharmacyOrdersService.ready → PharmacyOrdersService.readOrderForTenant → PharmacyOrdersService.composeOrders → PharmacyOrdersRepository.findConceptsByIds | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:288` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | calculado: `event.eventType` | `src/modules/pharmacy_inventory/services/pharmacy-orders.service.ts:1939` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PharmacyOrderDto>` · DTO `PharmacyOrderDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único del pedido. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:204` |
| `status` | `InventoryConceptDto` | Sí | — | — | Estado del pedido (`PINV_ORDER_*`). | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:210` |
| `status.code` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `status.display` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `createdAt` | `string` | Sí | — | — | Instante de creación, ISO 8601. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:216` |
| `expiresAt` | `string` | Sí | — | — | Vencimiento vigente del pedido, ISO 8601 (48 h desde la creación; el carril E2 la renueva al dejarlo listo para retiro). | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:223` |
| `siteId` | `string` | Sí | formato uuid | — | Identificador asociado a site. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:229` |
| `siteName` | `string` | Sí | — | — | Nombre de la sede. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:235` |
| `pharmacyId` | `string` | Sí | formato uuid | — | Identificador asociado a pharmacy. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:241` |
| `pharmacyName` | `string` | Sí | — | — | Nombre de la farmacia (comercial, o la razón social). | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:247` |
| `medicationRequestId` | `string` | No | formato uuid; admite null | — | Receta que respalda el pedido, si la hay. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:253` |
| `patientName` | `string` | No | admite null | — | Nombre pintable del paciente, resuelto en lote por el backend (la bandeja FAR-E2 lo necesita; cero UUIDs como copy). `null` si la persona no tiene nombre cargado. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:261` |
| `deliveryMode` | `InventoryConceptDto` | No | — | — | Modalidad de entrega (`PINV_DELIVERY_*`), resuelta. `null` en pedidos anteriores al modelo v4.2.1, que no la declararon. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:268` |
| `deliveryMode.code` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `deliveryMode.display` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `pickupCode` | `string` | No | admite null | — | Código de retiro del pedido, sellado al quedar `LISTO_PARA_RETIRO`. **Solo en la lectura del titular**: es la prueba de posesión con que la persona retira, así que la bandeja y las lecturas de staff lo sirven `null` — el mostrador no valida mirándolo, valida enviándolo en `POST /pharmacy/orders/:id/dispense`. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:279` |
| `totalAmount` | `string` | No | admite null | — | Total CONGELADO del pedido con su moneda: suma de los precios congelados por el saldo reservado de cada renglón en pie. `null` si a algún renglón le falta precio publicado o si las listas mezclan monedas — una suma con huecos o que mezcla monedas afirma un costo que nadie publicó. Se re-congela cuando el pedido cambia (línea no disponible, sustitución aceptada); jamás se recalcula en una lectura. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:290` |
| `currency` | `InventoryConceptDto` | No | — | — | Moneda del total congelado, resuelta. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:296` |
| `currency.code` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `currency.display` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `rejectionReasonText` | `string` | No | admite null | — | Motivo del rechazo, en palabras, cuando el estado es `RECHAZADO` (v4.2.1 lo persiste). `null` en cualquier otro estado. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:303` |
| `substitutions` | `array<PharmacyOrderSubstitutionDto>` | Sí | — | — | La historia de propuestas de sustitución del pedido, más nuevas primero. Las decididas conservan su estado y su `decidedAt`: son bitácora, no un campo mutable. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:311` |
| `substitutions[].id` | `string` | Sí | formato uuid | — | Identificador de la propuesta. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:326` |
| `substitutions[].originalProductId` | `string` | Sí | formato uuid | — | Producto recetado/pedido. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:332` |
| `substitutions[].originalName` | `string` | Sí | — | — | Nombre pintable del original. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:338` |
| `substitutions[].originalUnitPriceAmount` | `string` | No | admite null | — | Precio congelado del original al proponer, o `null` sin precio publicado. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:344` |
| `substitutions[].proposedProductId` | `string` | Sí | formato uuid | — | Producto propuesto (mismo medicamento del vademécum). | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:350` |
| `substitutions[].proposedName` | `string` | Sí | — | — | Nombre pintable del propuesto. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:356` |
| `substitutions[].proposedUnitPriceAmount` | `string` | No | admite null | — | Precio congelado del propuesto: la oferta que el paciente decidió. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:362` |
| `substitutions[].currency` | `InventoryConceptDto` | No | — | — | Moneda de la oferta, resuelta. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:368` |
| `substitutions[].currency.code` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `substitutions[].currency.display` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `substitutions[].status` | `InventoryConceptDto` | Sí | — | — | Estado de la propuesta (`PINV_SUBSTITUTION_*`), resuelto. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:374` |
| `substitutions[].status.code` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `substitutions[].status.display` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `substitutions[].decidedAt` | `string` | No | admite null | — | Cuándo se decidió (aceptó/rechazó/retiró), ISO 8601; `null` en pie. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:380` |
| `lines` | `array<PharmacyOrderLineDto>` | Sí | — | — | Líneas del pedido. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:317` |
| `lines[].productId` | `string` | Sí | formato uuid | — | Identificador asociado a product. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:118` |
| `lines[].productCode` | `string` | Sí | — | — | Código interno del producto. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:124` |
| `lines[].brandName` | `string` | No | admite null | — | Nombre comercial. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:130` |
| `lines[].genericName` | `string` | No | admite null | — | Nombre genérico. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:136` |
| `lines[].strengthText` | `string` | No | admite null | — | Concentración, legible. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:142` |
| `lines[].packageSizeText` | `string` | No | admite null | — | Presentación, legible. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:148` |
| `lines[].medication` | `InventoryConceptDto` | No | — | — | Medicamento del vademécum, resuelto. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:154` |
| `lines[].medication.code` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `lines[].medication.display` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `lines[].requestedQuantity` | `number` | Sí | — | — | Cantidad solicitada por el paciente. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:160` |
| `lines[].reservedQuantity` | `number` | Sí | — | — | Cantidad efectivamente reservada; `0` cuando la línea quedó sin stock. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:166` |
| `lines[].fulfilledQuantity` | `number` | Sí | — | — | Cantidad ya entregada en el mostrador, acumulada entre entregas parciales (FAR-E3). El saldo por retirar es `reservedQuantity − fulfilledQuantity`. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:173` |
| `lines[].unitPriceAmount` | `string` | No | admite null | — | Precio unitario CONGELADO del renglón (lo que paga el paciente), sellado al crear el pedido o al aceptar una sustitución. `null` si la sede no publicaba precio: el GET no recalcula — un precio congelado que se recalcula contra listas nuevas reescribe un pedido histórico. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:182` |
| `lines[].currency` | `InventoryConceptDto` | No | — | — | Moneda del precio congelado, resuelta. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:188` |
| `lines[].currency.code` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `lines[].currency.display` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `lines[].status` | `InventoryConceptDto` | Sí | — | — | Estado de la línea (`PINV_RES_LINE_CONFIRMED` reservada, `PINV_RES_LINE_OUT_OF_STOCK` sin stock, `PINV_RES_LINE_RELEASED` liberada). | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:195` |
| `lines[].status.code` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `lines[].status.display` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |

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

## 25. POST /pharmacy/orders/{id}/reject

- **Origen:** CONTRATO
- **Nombre:** Rechazar el pedido (FAR-E2)
- **Bloque:** Farmacia
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyOrdersController.reject` — `src/modules/pharmacy_inventory/controllers/pharmacy-orders.controller.ts:227`

### Qué es y para qué sirve (negocio)

Rechazar el pedido (FAR-E2). Dentro del módulo (descripción del modelo, en inglés): «Prevents overselling and untraceable adjustments under concurrent manual, API, dispensing and receiving operations.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_25_pharmacy_inventory.puml:20`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`POST /pharmacy/orders/{id}/reject` la atiende `PharmacyOrdersController.reject` (src/modules/pharmacy_inventory/controllers/pharmacy-orders.controller.ts:227). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `RejectPharmacyOrderDto` (1 campo, 1 obligatorio). Delega en `PharmacyOrdersService.reject`. Crea filas en messaging.domain_events, messaging.in_app_notifications, messaging.notification_deliveries, messaging.notification_requests, messaging.outbox_messages, pharmacy_inventory.inventory_ledger_entries. Actualiza pharmacy_inventory.inventory_reservation_lines, pharmacy_inventory.inventory_reservations, pharmacy_inventory.inventory_stock_positions. Lee messaging.in_app_notifications, messaging.message_channels, messaging.messaging_providers, messaging.outbox_messages, messaging.provider_channel_configs, messaging.recipient_preferences, pharmacy_inventory.inventory_ledger_entries, pharmacy_inventory.inventory_reservation_lines y 10 más. Publica un evento calculado (event.eventType).

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/pharmacy_inventory/controllers/pharmacy-orders.controller.ts:227` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/pharmacy_inventory/controllers/pharmacy-orders.controller.ts:227` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.reject → PharmacyOrdersService.reject → PharmacyOrdersService.publishStaffEvent → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.in_app_notifications` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.reject → PharmacyOrdersService.reject → PharmacyOrderNotificationsService.orderRejected → PharmacyOrderNotificationsService.emitToPatient → PharmacyOrderNotificationsService.emitToPerson → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createInAppNotification | `src/modules/messaging/repositories/notifications.repository.ts:710` |
| `messaging.in_app_notifications` | LEE | LEE | DIRECTA | PharmacyOrdersController.reject → PharmacyOrdersService.reject → PharmacyOrderNotificationsService.orderRejected → PharmacyOrderNotificationsService.emitToPatient → PharmacyOrderNotificationsService.emitToPerson → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findUnreadInAppForResource | `src/modules/messaging/repositories/notifications.repository.ts:845` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | PharmacyOrdersController.reject → PharmacyOrdersService.reject → PharmacyOrderNotificationsService.orderRejected → PharmacyOrderNotificationsService.emitToPatient → PharmacyOrderNotificationsService.emitToPerson → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findActiveChannelByType | `src/modules/messaging/repositories/notifications.repository.ts:189` |
| `messaging.messaging_providers` | LEE | LEE | DIRECTA | PharmacyOrdersController.reject → PharmacyOrdersService.reject → PharmacyOrderNotificationsService.orderRejected → PharmacyOrderNotificationsService.emitToPatient → PharmacyOrderNotificationsService.emitToPerson → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findProviderById | `src/modules/messaging/repositories/notifications.repository.ts:437` |
| `messaging.notification_deliveries` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.reject → PharmacyOrdersService.reject → PharmacyOrderNotificationsService.orderRejected → PharmacyOrderNotificationsService.emitToPatient → PharmacyOrderNotificationsService.emitToPerson → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createDelivery | `src/modules/messaging/repositories/notifications.repository.ts:514` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.reject → PharmacyOrdersService.reject → PharmacyOrderNotificationsService.orderRejected → PharmacyOrderNotificationsService.emitToPatient → PharmacyOrderNotificationsService.emitToPerson → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.reject → PharmacyOrdersService.reject → PharmacyOrdersService.publishStaffEvent → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:164` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | PharmacyOrdersController.reject → PharmacyOrdersService.reject → PharmacyOrdersService.publishStaffEvent → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:188` |
| `messaging.provider_channel_configs` | LEE | LEE | DIRECTA | PharmacyOrdersController.reject → PharmacyOrdersService.reject → PharmacyOrderNotificationsService.orderRejected → PharmacyOrderNotificationsService.emitToPatient → PharmacyOrderNotificationsService.emitToPerson → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findChannelConfigs | `src/modules/messaging/repositories/notifications.repository.ts:405` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | PharmacyOrdersController.reject → PharmacyOrdersService.reject → PharmacyOrderNotificationsService.orderRejected → PharmacyOrderNotificationsService.emitToPatient → PharmacyOrderNotificationsService.emitToPerson → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `pharmacy_inventory.inventory_ledger_entries` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.reject → PharmacyOrdersService.reject → InventoryReservationsService.releaseConfirmedLines → LedgerRepository.append | `src/modules/pharmacy_inventory/repositories/ledger.repository.ts:138` |
| `pharmacy_inventory.inventory_ledger_entries` | LEE | LEE | POR_SQL | PharmacyOrdersController.reject → PharmacyOrdersService.reject → InventoryReservationsService.releaseConfirmedLines → LedgerRepository.nextSequence | `src/modules/pharmacy_inventory/repositories/ledger.repository.ts:109` |
| `pharmacy_inventory.inventory_reservation_lines` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyOrdersController.reject → PharmacyOrdersService.reject → InventoryReservationsService.releaseConfirmedLines | `src/modules/pharmacy_inventory/services/inventory-reservations.service.ts:238` |
| `pharmacy_inventory.inventory_reservation_lines` | LEE | LEE | DIRECTA | PharmacyOrdersController.reject → PharmacyOrdersService.reject → InventoryReservationsService.releaseConfirmedLines → ReservationsRepository.findLinesByReservation | `src/modules/pharmacy_inventory/repositories/reservations.repository.ts:139` |
| `pharmacy_inventory.inventory_reservations` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyOrdersController.reject → PharmacyOrdersService.reject | `src/modules/pharmacy_inventory/services/pharmacy-orders.service.ts:1072` |
| `pharmacy_inventory.inventory_reservations` | LEE | LEE | DIRECTA | PharmacyOrdersController.reject → PharmacyOrdersService.reject → PharmacyOrdersService.loadTenantOrderForUpdate → PharmacyOrdersRepository.findOrderByIdForUpdate | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:53` |
| `pharmacy_inventory.inventory_stock_positions` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyOrdersController.reject → PharmacyOrdersService.reject → InventoryReservationsService.releaseConfirmedLines | `src/modules/pharmacy_inventory/services/inventory-reservations.service.ts:266` |
| `pharmacy_inventory.inventory_stock_positions` | LEE | LEE | DIRECTA | PharmacyOrdersController.reject → PharmacyOrdersService.reject → InventoryReservationsService.releaseConfirmedLines → StockPositionsRepository.findByKeyForUpdate | `src/modules/pharmacy_inventory/repositories/stock-positions.repository.ts:82` |
| `pharmacy_inventory.pharmacy_order_substitutions` | LEE | LEE | DIRECTA | PharmacyOrdersController.reject → PharmacyOrdersService.reject → PharmacyOrdersService.readOrderForTenant → PharmacyOrdersService.composeOrders → PharmacyOrderSubstitutionsRepository.findByReservationIds | `src/modules/pharmacy_inventory/repositories/pharmacy-order-substitutions.repository.ts:62` |
| `pharmacy.pharmacies` | LEE | LEE | DIRECTA | PharmacyOrdersController.reject → PharmacyOrdersService.reject → PharmacyOrdersService.loadTenantOrderForUpdate → PharmacyOrdersRepository.findPharmaciesByIdsInTenant | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:224` |
| `pharmacy.pharmacy_products` | LEE | LEE | DIRECTA | PharmacyOrdersController.reject → PharmacyOrdersService.reject → PharmacyOrdersService.readOrderForTenant → PharmacyOrdersService.composeOrders → PharmacyOrdersRepository.findProductsByIds | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:242` |
| `pharmacy.pharmacy_sites` | LEE | LEE | DIRECTA | PharmacyOrdersController.reject → PharmacyOrdersService.reject → PharmacyOrdersService.readOrderForTenant → PharmacyOrdersService.composeOrders → PharmacyOrdersRepository.findSitesByIds | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:233` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | PharmacyOrdersController.reject → PharmacyOrdersService.reject → PharmacyOrderNotificationsService.orderRejected → PharmacyOrderNotificationsService.emitToPatient → PharmacyOrderNotificationsService.emitToPerson → PersonAccountLinksRepository.findActiveByPerson | `src/modules/profiles/repositories/person-account-links.repository.ts:101` |
| `profiles.person_profiles` | LEE | LEE | DIRECTA | PharmacyOrdersController.reject → PharmacyOrdersService.reject → PharmacyOrdersService.readOrderForTenant → PharmacyOrdersService.composeOrders → PharmacyOrdersRepository.findPersonNamesByProfileIds | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:135` |
| `profiles.persons` | LEE | LEE | DIRECTA | PharmacyOrdersController.reject → PharmacyOrdersService.reject → PharmacyOrdersService.readOrderForTenant → PharmacyOrdersService.composeOrders → PharmacyOrdersRepository.findPersonNamesByProfileIds | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:127` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | PharmacyOrdersController.reject → PharmacyOrdersService.reject → PharmacyOrdersService.readOrderForTenant → PharmacyOrdersService.composeOrders → PharmacyOrdersRepository.findConceptsByIds | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:288` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | calculado: `event.eventType` | `src/modules/pharmacy_inventory/services/pharmacy-orders.service.ts:1939` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `RejectPharmacyOrderDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reason` | `string` | Sí | longitud mínima 1; longitud máxima 500 | `@IsString()` `@IsNotEmpty()` `@MaxLength(500)` | Motivo del rechazo (no se persiste todavía) | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:450` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador único del pedido. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:204` |
| `status` | `InventoryConceptDto` | Sí | — | — | Estado del pedido (`PINV_ORDER_*`). | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:210` |
| `status.code` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `status.display` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `createdAt` | `string` | Sí | — | — | Instante de creación, ISO 8601. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:216` |
| `expiresAt` | `string` | Sí | — | — | Vencimiento vigente del pedido, ISO 8601 (48 h desde la creación; el carril E2 la renueva al dejarlo listo para retiro). | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:223` |
| `siteId` | `string` | Sí | formato uuid | — | Identificador asociado a site. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:229` |
| `siteName` | `string` | Sí | — | — | Nombre de la sede. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:235` |
| `pharmacyId` | `string` | Sí | formato uuid | — | Identificador asociado a pharmacy. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:241` |
| `pharmacyName` | `string` | Sí | — | — | Nombre de la farmacia (comercial, o la razón social). | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:247` |
| `medicationRequestId` | `string` | No | formato uuid; admite null | — | Receta que respalda el pedido, si la hay. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:253` |
| `patientName` | `string` | No | admite null | — | Nombre pintable del paciente, resuelto en lote por el backend (la bandeja FAR-E2 lo necesita; cero UUIDs como copy). `null` si la persona no tiene nombre cargado. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:261` |
| `deliveryMode` | `InventoryConceptDto` | No | — | — | Modalidad de entrega (`PINV_DELIVERY_*`), resuelta. `null` en pedidos anteriores al modelo v4.2.1, que no la declararon. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:268` |
| `deliveryMode.code` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `deliveryMode.display` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `pickupCode` | `string` | No | admite null | — | Código de retiro del pedido, sellado al quedar `LISTO_PARA_RETIRO`. **Solo en la lectura del titular**: es la prueba de posesión con que la persona retira, así que la bandeja y las lecturas de staff lo sirven `null` — el mostrador no valida mirándolo, valida enviándolo en `POST /pharmacy/orders/:id/dispense`. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:279` |
| `totalAmount` | `string` | No | admite null | — | Total CONGELADO del pedido con su moneda: suma de los precios congelados por el saldo reservado de cada renglón en pie. `null` si a algún renglón le falta precio publicado o si las listas mezclan monedas — una suma con huecos o que mezcla monedas afirma un costo que nadie publicó. Se re-congela cuando el pedido cambia (línea no disponible, sustitución aceptada); jamás se recalcula en una lectura. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:290` |
| `currency` | `InventoryConceptDto` | No | — | — | Moneda del total congelado, resuelta. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:296` |
| `currency.code` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `currency.display` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `rejectionReasonText` | `string` | No | admite null | — | Motivo del rechazo, en palabras, cuando el estado es `RECHAZADO` (v4.2.1 lo persiste). `null` en cualquier otro estado. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:303` |
| `substitutions` | `array<PharmacyOrderSubstitutionDto>` | Sí | — | — | La historia de propuestas de sustitución del pedido, más nuevas primero. Las decididas conservan su estado y su `decidedAt`: son bitácora, no un campo mutable. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:311` |
| `substitutions[].id` | `string` | Sí | formato uuid | — | Identificador de la propuesta. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:326` |
| `substitutions[].originalProductId` | `string` | Sí | formato uuid | — | Producto recetado/pedido. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:332` |
| `substitutions[].originalName` | `string` | Sí | — | — | Nombre pintable del original. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:338` |
| `substitutions[].originalUnitPriceAmount` | `string` | No | admite null | — | Precio congelado del original al proponer, o `null` sin precio publicado. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:344` |
| `substitutions[].proposedProductId` | `string` | Sí | formato uuid | — | Producto propuesto (mismo medicamento del vademécum). | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:350` |
| `substitutions[].proposedName` | `string` | Sí | — | — | Nombre pintable del propuesto. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:356` |
| `substitutions[].proposedUnitPriceAmount` | `string` | No | admite null | — | Precio congelado del propuesto: la oferta que el paciente decidió. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:362` |
| `substitutions[].currency` | `InventoryConceptDto` | No | — | — | Moneda de la oferta, resuelta. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:368` |
| `substitutions[].currency.code` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `substitutions[].currency.display` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `substitutions[].status` | `InventoryConceptDto` | Sí | — | — | Estado de la propuesta (`PINV_SUBSTITUTION_*`), resuelto. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:374` |
| `substitutions[].status.code` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `substitutions[].status.display` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `substitutions[].decidedAt` | `string` | No | admite null | — | Cuándo se decidió (aceptó/rechazó/retiró), ISO 8601; `null` en pie. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:380` |
| `lines` | `array<PharmacyOrderLineDto>` | Sí | — | — | Líneas del pedido. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:317` |
| `lines[].productId` | `string` | Sí | formato uuid | — | Identificador asociado a product. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:118` |
| `lines[].productCode` | `string` | Sí | — | — | Código interno del producto. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:124` |
| `lines[].brandName` | `string` | No | admite null | — | Nombre comercial. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:130` |
| `lines[].genericName` | `string` | No | admite null | — | Nombre genérico. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:136` |
| `lines[].strengthText` | `string` | No | admite null | — | Concentración, legible. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:142` |
| `lines[].packageSizeText` | `string` | No | admite null | — | Presentación, legible. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:148` |
| `lines[].medication` | `InventoryConceptDto` | No | — | — | Medicamento del vademécum, resuelto. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:154` |
| `lines[].medication.code` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `lines[].medication.display` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `lines[].requestedQuantity` | `number` | Sí | — | — | Cantidad solicitada por el paciente. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:160` |
| `lines[].reservedQuantity` | `number` | Sí | — | — | Cantidad efectivamente reservada; `0` cuando la línea quedó sin stock. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:166` |
| `lines[].fulfilledQuantity` | `number` | Sí | — | — | Cantidad ya entregada en el mostrador, acumulada entre entregas parciales (FAR-E3). El saldo por retirar es `reservedQuantity − fulfilledQuantity`. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:173` |
| `lines[].unitPriceAmount` | `string` | No | admite null | — | Precio unitario CONGELADO del renglón (lo que paga el paciente), sellado al crear el pedido o al aceptar una sustitución. `null` si la sede no publicaba precio: el GET no recalcula — un precio congelado que se recalcula contra listas nuevas reescribe un pedido histórico. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:182` |
| `lines[].currency` | `InventoryConceptDto` | No | — | — | Moneda del precio congelado, resuelta. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:188` |
| `lines[].currency.code` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `lines[].currency.display` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `lines[].status` | `InventoryConceptDto` | Sí | — | — | Estado de la línea (`PINV_RES_LINE_CONFIRMED` reservada, `PINV_RES_LINE_OUT_OF_STOCK` sin stock, `PINV_RES_LINE_RELEASED` liberada). | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:195` |
| `lines[].status.code` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `lines[].status.display` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |

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

## 26. POST /pharmacy/orders/{id}/review

- **Origen:** CONTRATO
- **Nombre:** Abrir revisión del pedido (FAR-E2)
- **Bloque:** Farmacia
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyOrdersController.openReview` — `src/modules/pharmacy_inventory/controllers/pharmacy-orders.controller.ts:156`

### Qué es y para qué sirve (negocio)

Abrir revisión del pedido (FAR-E2). Dentro del módulo (descripción del modelo, en inglés): «Prevents overselling and untraceable adjustments under concurrent manual, API, dispensing and receiving operations.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_25_pharmacy_inventory.puml:20`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`POST /pharmacy/orders/{id}/review` la atiende `PharmacyOrdersController.openReview` (src/modules/pharmacy_inventory/controllers/pharmacy-orders.controller.ts:156). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `PharmacyOrdersService.openReview`. Crea filas en messaging.domain_events, messaging.in_app_notifications, messaging.notification_deliveries, messaging.notification_requests, messaging.outbox_messages. Actualiza pharmacy_inventory.inventory_reservations. Lee messaging.in_app_notifications, messaging.message_channels, messaging.messaging_providers, messaging.outbox_messages, messaging.provider_channel_configs, messaging.recipient_preferences, pharmacy_inventory.inventory_reservation_lines, pharmacy_inventory.inventory_reservations y 8 más. Publica un evento calculado (event.eventType).

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/pharmacy_inventory/controllers/pharmacy-orders.controller.ts:156` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/pharmacy_inventory/controllers/pharmacy-orders.controller.ts:156` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.openReview → PharmacyOrdersService.openReview → PharmacyOrdersService.publishStaffEvent → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.in_app_notifications` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.openReview → PharmacyOrdersService.openReview → PharmacyOrderNotificationsService.orderUnderReview → PharmacyOrderNotificationsService.emitToPatient → PharmacyOrderNotificationsService.emitToPerson → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createInAppNotification | `src/modules/messaging/repositories/notifications.repository.ts:710` |
| `messaging.in_app_notifications` | LEE | LEE | DIRECTA | PharmacyOrdersController.openReview → PharmacyOrdersService.openReview → PharmacyOrderNotificationsService.orderUnderReview → PharmacyOrderNotificationsService.emitToPatient → PharmacyOrderNotificationsService.emitToPerson → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findUnreadInAppForResource | `src/modules/messaging/repositories/notifications.repository.ts:845` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | PharmacyOrdersController.openReview → PharmacyOrdersService.openReview → PharmacyOrderNotificationsService.orderUnderReview → PharmacyOrderNotificationsService.emitToPatient → PharmacyOrderNotificationsService.emitToPerson → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findActiveChannelByType | `src/modules/messaging/repositories/notifications.repository.ts:189` |
| `messaging.messaging_providers` | LEE | LEE | DIRECTA | PharmacyOrdersController.openReview → PharmacyOrdersService.openReview → PharmacyOrderNotificationsService.orderUnderReview → PharmacyOrderNotificationsService.emitToPatient → PharmacyOrderNotificationsService.emitToPerson → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findProviderById | `src/modules/messaging/repositories/notifications.repository.ts:437` |
| `messaging.notification_deliveries` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.openReview → PharmacyOrdersService.openReview → PharmacyOrderNotificationsService.orderUnderReview → PharmacyOrderNotificationsService.emitToPatient → PharmacyOrderNotificationsService.emitToPerson → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createDelivery | `src/modules/messaging/repositories/notifications.repository.ts:514` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.openReview → PharmacyOrdersService.openReview → PharmacyOrderNotificationsService.orderUnderReview → PharmacyOrderNotificationsService.emitToPatient → PharmacyOrderNotificationsService.emitToPerson → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.openReview → PharmacyOrdersService.openReview → PharmacyOrdersService.publishStaffEvent → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:164` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | PharmacyOrdersController.openReview → PharmacyOrdersService.openReview → PharmacyOrdersService.publishStaffEvent → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:188` |
| `messaging.provider_channel_configs` | LEE | LEE | DIRECTA | PharmacyOrdersController.openReview → PharmacyOrdersService.openReview → PharmacyOrderNotificationsService.orderUnderReview → PharmacyOrderNotificationsService.emitToPatient → PharmacyOrderNotificationsService.emitToPerson → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findChannelConfigs | `src/modules/messaging/repositories/notifications.repository.ts:405` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | PharmacyOrdersController.openReview → PharmacyOrdersService.openReview → PharmacyOrderNotificationsService.orderUnderReview → PharmacyOrderNotificationsService.emitToPatient → PharmacyOrderNotificationsService.emitToPerson → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `pharmacy_inventory.inventory_reservation_lines` | LEE | LEE | DIRECTA | PharmacyOrdersController.openReview → PharmacyOrdersService.openReview → PharmacyOrdersService.readOrderForTenant → PharmacyOrdersService.composeOrders → PharmacyOrdersRepository.findLinesByReservationIds | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:212` |
| `pharmacy_inventory.inventory_reservations` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyOrdersController.openReview → PharmacyOrdersService.openReview | `src/modules/pharmacy_inventory/services/pharmacy-orders.service.ts:700` |
| `pharmacy_inventory.inventory_reservations` | LEE | LEE | DIRECTA | PharmacyOrdersController.openReview → PharmacyOrdersService.openReview → PharmacyOrdersService.loadTenantOrderForUpdate → PharmacyOrdersRepository.findOrderByIdForUpdate | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:53` |
| `pharmacy_inventory.pharmacy_order_substitutions` | LEE | LEE | DIRECTA | PharmacyOrdersController.openReview → PharmacyOrdersService.openReview → PharmacyOrdersService.readOrderForTenant → PharmacyOrdersService.composeOrders → PharmacyOrderSubstitutionsRepository.findByReservationIds | `src/modules/pharmacy_inventory/repositories/pharmacy-order-substitutions.repository.ts:62` |
| `pharmacy.pharmacies` | LEE | LEE | DIRECTA | PharmacyOrdersController.openReview → PharmacyOrdersService.openReview → PharmacyOrdersService.loadTenantOrderForUpdate → PharmacyOrdersRepository.findPharmaciesByIdsInTenant | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:224` |
| `pharmacy.pharmacy_products` | LEE | LEE | DIRECTA | PharmacyOrdersController.openReview → PharmacyOrdersService.openReview → PharmacyOrdersService.readOrderForTenant → PharmacyOrdersService.composeOrders → PharmacyOrdersRepository.findProductsByIds | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:242` |
| `pharmacy.pharmacy_sites` | LEE | LEE | DIRECTA | PharmacyOrdersController.openReview → PharmacyOrdersService.openReview → PharmacyOrdersService.readOrderForTenant → PharmacyOrdersService.composeOrders → PharmacyOrdersRepository.findSitesByIds | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:233` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | PharmacyOrdersController.openReview → PharmacyOrdersService.openReview → PharmacyOrderNotificationsService.orderUnderReview → PharmacyOrderNotificationsService.emitToPatient → PharmacyOrderNotificationsService.emitToPerson → PersonAccountLinksRepository.findActiveByPerson | `src/modules/profiles/repositories/person-account-links.repository.ts:101` |
| `profiles.person_profiles` | LEE | LEE | DIRECTA | PharmacyOrdersController.openReview → PharmacyOrdersService.openReview → PharmacyOrdersService.readOrderForTenant → PharmacyOrdersService.composeOrders → PharmacyOrdersRepository.findPersonNamesByProfileIds | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:135` |
| `profiles.persons` | LEE | LEE | DIRECTA | PharmacyOrdersController.openReview → PharmacyOrdersService.openReview → PharmacyOrdersService.readOrderForTenant → PharmacyOrdersService.composeOrders → PharmacyOrdersRepository.findPersonNamesByProfileIds | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:127` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | PharmacyOrdersController.openReview → PharmacyOrdersService.openReview → PharmacyOrdersService.readOrderForTenant → PharmacyOrdersService.composeOrders → PharmacyOrdersRepository.findConceptsByIds | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:288` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | calculado: `event.eventType` | `src/modules/pharmacy_inventory/services/pharmacy-orders.service.ts:1939` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PharmacyOrderDto>` · DTO `PharmacyOrderDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único del pedido. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:204` |
| `status` | `InventoryConceptDto` | Sí | — | — | Estado del pedido (`PINV_ORDER_*`). | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:210` |
| `status.code` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `status.display` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `createdAt` | `string` | Sí | — | — | Instante de creación, ISO 8601. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:216` |
| `expiresAt` | `string` | Sí | — | — | Vencimiento vigente del pedido, ISO 8601 (48 h desde la creación; el carril E2 la renueva al dejarlo listo para retiro). | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:223` |
| `siteId` | `string` | Sí | formato uuid | — | Identificador asociado a site. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:229` |
| `siteName` | `string` | Sí | — | — | Nombre de la sede. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:235` |
| `pharmacyId` | `string` | Sí | formato uuid | — | Identificador asociado a pharmacy. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:241` |
| `pharmacyName` | `string` | Sí | — | — | Nombre de la farmacia (comercial, o la razón social). | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:247` |
| `medicationRequestId` | `string` | No | formato uuid; admite null | — | Receta que respalda el pedido, si la hay. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:253` |
| `patientName` | `string` | No | admite null | — | Nombre pintable del paciente, resuelto en lote por el backend (la bandeja FAR-E2 lo necesita; cero UUIDs como copy). `null` si la persona no tiene nombre cargado. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:261` |
| `deliveryMode` | `InventoryConceptDto` | No | — | — | Modalidad de entrega (`PINV_DELIVERY_*`), resuelta. `null` en pedidos anteriores al modelo v4.2.1, que no la declararon. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:268` |
| `deliveryMode.code` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `deliveryMode.display` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `pickupCode` | `string` | No | admite null | — | Código de retiro del pedido, sellado al quedar `LISTO_PARA_RETIRO`. **Solo en la lectura del titular**: es la prueba de posesión con que la persona retira, así que la bandeja y las lecturas de staff lo sirven `null` — el mostrador no valida mirándolo, valida enviándolo en `POST /pharmacy/orders/:id/dispense`. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:279` |
| `totalAmount` | `string` | No | admite null | — | Total CONGELADO del pedido con su moneda: suma de los precios congelados por el saldo reservado de cada renglón en pie. `null` si a algún renglón le falta precio publicado o si las listas mezclan monedas — una suma con huecos o que mezcla monedas afirma un costo que nadie publicó. Se re-congela cuando el pedido cambia (línea no disponible, sustitución aceptada); jamás se recalcula en una lectura. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:290` |
| `currency` | `InventoryConceptDto` | No | — | — | Moneda del total congelado, resuelta. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:296` |
| `currency.code` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `currency.display` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `rejectionReasonText` | `string` | No | admite null | — | Motivo del rechazo, en palabras, cuando el estado es `RECHAZADO` (v4.2.1 lo persiste). `null` en cualquier otro estado. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:303` |
| `substitutions` | `array<PharmacyOrderSubstitutionDto>` | Sí | — | — | La historia de propuestas de sustitución del pedido, más nuevas primero. Las decididas conservan su estado y su `decidedAt`: son bitácora, no un campo mutable. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:311` |
| `substitutions[].id` | `string` | Sí | formato uuid | — | Identificador de la propuesta. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:326` |
| `substitutions[].originalProductId` | `string` | Sí | formato uuid | — | Producto recetado/pedido. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:332` |
| `substitutions[].originalName` | `string` | Sí | — | — | Nombre pintable del original. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:338` |
| `substitutions[].originalUnitPriceAmount` | `string` | No | admite null | — | Precio congelado del original al proponer, o `null` sin precio publicado. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:344` |
| `substitutions[].proposedProductId` | `string` | Sí | formato uuid | — | Producto propuesto (mismo medicamento del vademécum). | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:350` |
| `substitutions[].proposedName` | `string` | Sí | — | — | Nombre pintable del propuesto. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:356` |
| `substitutions[].proposedUnitPriceAmount` | `string` | No | admite null | — | Precio congelado del propuesto: la oferta que el paciente decidió. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:362` |
| `substitutions[].currency` | `InventoryConceptDto` | No | — | — | Moneda de la oferta, resuelta. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:368` |
| `substitutions[].currency.code` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `substitutions[].currency.display` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `substitutions[].status` | `InventoryConceptDto` | Sí | — | — | Estado de la propuesta (`PINV_SUBSTITUTION_*`), resuelto. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:374` |
| `substitutions[].status.code` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `substitutions[].status.display` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `substitutions[].decidedAt` | `string` | No | admite null | — | Cuándo se decidió (aceptó/rechazó/retiró), ISO 8601; `null` en pie. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:380` |
| `lines` | `array<PharmacyOrderLineDto>` | Sí | — | — | Líneas del pedido. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:317` |
| `lines[].productId` | `string` | Sí | formato uuid | — | Identificador asociado a product. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:118` |
| `lines[].productCode` | `string` | Sí | — | — | Código interno del producto. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:124` |
| `lines[].brandName` | `string` | No | admite null | — | Nombre comercial. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:130` |
| `lines[].genericName` | `string` | No | admite null | — | Nombre genérico. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:136` |
| `lines[].strengthText` | `string` | No | admite null | — | Concentración, legible. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:142` |
| `lines[].packageSizeText` | `string` | No | admite null | — | Presentación, legible. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:148` |
| `lines[].medication` | `InventoryConceptDto` | No | — | — | Medicamento del vademécum, resuelto. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:154` |
| `lines[].medication.code` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `lines[].medication.display` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `lines[].requestedQuantity` | `number` | Sí | — | — | Cantidad solicitada por el paciente. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:160` |
| `lines[].reservedQuantity` | `number` | Sí | — | — | Cantidad efectivamente reservada; `0` cuando la línea quedó sin stock. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:166` |
| `lines[].fulfilledQuantity` | `number` | Sí | — | — | Cantidad ya entregada en el mostrador, acumulada entre entregas parciales (FAR-E3). El saldo por retirar es `reservedQuantity − fulfilledQuantity`. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:173` |
| `lines[].unitPriceAmount` | `string` | No | admite null | — | Precio unitario CONGELADO del renglón (lo que paga el paciente), sellado al crear el pedido o al aceptar una sustitución. `null` si la sede no publicaba precio: el GET no recalcula — un precio congelado que se recalcula contra listas nuevas reescribe un pedido histórico. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:182` |
| `lines[].currency` | `InventoryConceptDto` | No | — | — | Moneda del precio congelado, resuelta. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:188` |
| `lines[].currency.code` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `lines[].currency.display` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `lines[].status` | `InventoryConceptDto` | Sí | — | — | Estado de la línea (`PINV_RES_LINE_CONFIRMED` reservada, `PINV_RES_LINE_OUT_OF_STOCK` sin stock, `PINV_RES_LINE_RELEASED` liberada). | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:195` |
| `lines[].status.code` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `lines[].status.display` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |

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

## 27. GET /pharmacy/orders/me

- **Origen:** CONTRATO
- **Nombre:** Mis pedidos de farmacia, más nuevos primero (FAR-E1)
- **Bloque:** Farmacia
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyOrdersController.listMine` — `src/modules/pharmacy_inventory/controllers/pharmacy-orders.controller.ts:109`

### Qué es y para qué sirve (negocio)

Mis pedidos de farmacia, más nuevos primero (FAR-E1). Dentro del módulo (descripción del modelo, en inglés): «Prevents overselling and untraceable adjustments under concurrent manual, API, dispensing and receiving operations.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_25_pharmacy_inventory.puml:20`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`GET /pharmacy/orders/me` la atiende `PharmacyOrdersController.listMine` (src/modules/pharmacy_inventory/controllers/pharmacy-orders.controller.ts:109). Exige sesión con alguno de los roles PATIENT. Delega en `PharmacyOrdersService.listMine`. Crea filas en messaging.domain_events, messaging.in_app_notifications, messaging.notification_deliveries, messaging.notification_requests, messaging.outbox_messages, pharmacy_inventory.inventory_ledger_entries. Actualiza pharmacy_inventory.inventory_reservation_lines, pharmacy_inventory.inventory_reservations, pharmacy_inventory.inventory_stock_positions. Lee clinical.medication_requests, messaging.in_app_notifications, messaging.message_channels, messaging.messaging_providers, messaging.outbox_messages, messaging.provider_channel_configs, messaging.recipient_preferences, pharmacy_inventory.inventory_ledger_entries y 11 más. Publica PharmacyOrderExpired.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PATIENT | `src/modules/pharmacy_inventory/controllers/pharmacy-orders.controller.ts:109` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.medication_requests` | LEE | LEE | DIRECTA | PharmacyOrdersController.listMine → PharmacyOrdersService.listMine → PharmacyOrdersService.expireDue → PharmacyOrdersRepository.findPrescriberProfileId | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:276` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.listMine → PharmacyOrdersService.listMine → PharmacyOrdersService.expireDue → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.in_app_notifications` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.listMine → PharmacyOrdersService.listMine → PharmacyOrdersService.expireDue → PharmacyOrderNotificationsService.expiredToPrescriber → PharmacyOrderNotificationsService.emitToPerson → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createInAppNotification | `src/modules/messaging/repositories/notifications.repository.ts:710` |
| `messaging.in_app_notifications` | LEE | LEE | DIRECTA | PharmacyOrdersController.listMine → PharmacyOrdersService.listMine → PharmacyOrdersService.expireDue → PharmacyOrderNotificationsService.expiredToPrescriber → PharmacyOrderNotificationsService.emitToPerson → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findUnreadInAppForResource | `src/modules/messaging/repositories/notifications.repository.ts:845` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | PharmacyOrdersController.listMine → PharmacyOrdersService.listMine → PharmacyOrdersService.expireDue → PharmacyOrderNotificationsService.expiredToPrescriber → PharmacyOrderNotificationsService.emitToPerson → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findActiveChannelByType | `src/modules/messaging/repositories/notifications.repository.ts:189` |
| `messaging.messaging_providers` | LEE | LEE | DIRECTA | PharmacyOrdersController.listMine → PharmacyOrdersService.listMine → PharmacyOrdersService.expireDue → PharmacyOrderNotificationsService.expiredToPrescriber → PharmacyOrderNotificationsService.emitToPerson → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findProviderById | `src/modules/messaging/repositories/notifications.repository.ts:437` |
| `messaging.notification_deliveries` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.listMine → PharmacyOrdersService.listMine → PharmacyOrdersService.expireDue → PharmacyOrderNotificationsService.expiredToPrescriber → PharmacyOrderNotificationsService.emitToPerson → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createDelivery | `src/modules/messaging/repositories/notifications.repository.ts:514` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.listMine → PharmacyOrdersService.listMine → PharmacyOrdersService.expireDue → PharmacyOrderNotificationsService.expiredToPrescriber → PharmacyOrderNotificationsService.emitToPerson → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.listMine → PharmacyOrdersService.listMine → PharmacyOrdersService.expireDue → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:164` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | PharmacyOrdersController.listMine → PharmacyOrdersService.listMine → PharmacyOrdersService.expireDue → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:188` |
| `messaging.provider_channel_configs` | LEE | LEE | DIRECTA | PharmacyOrdersController.listMine → PharmacyOrdersService.listMine → PharmacyOrdersService.expireDue → PharmacyOrderNotificationsService.expiredToPrescriber → PharmacyOrderNotificationsService.emitToPerson → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findChannelConfigs | `src/modules/messaging/repositories/notifications.repository.ts:405` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | PharmacyOrdersController.listMine → PharmacyOrdersService.listMine → PharmacyOrdersService.expireDue → PharmacyOrderNotificationsService.expiredToPrescriber → PharmacyOrderNotificationsService.emitToPerson → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `pharmacy_inventory.inventory_ledger_entries` | ESCRIBE | CREA | DIRECTA | PharmacyOrdersController.listMine → PharmacyOrdersService.listMine → PharmacyOrdersService.expireDue → InventoryReservationsService.releaseConfirmedLines → LedgerRepository.append | `src/modules/pharmacy_inventory/repositories/ledger.repository.ts:138` |
| `pharmacy_inventory.inventory_ledger_entries` | LEE | LEE | POR_SQL | PharmacyOrdersController.listMine → PharmacyOrdersService.listMine → PharmacyOrdersService.expireDue → InventoryReservationsService.releaseConfirmedLines → LedgerRepository.nextSequence | `src/modules/pharmacy_inventory/repositories/ledger.repository.ts:109` |
| `pharmacy_inventory.inventory_reservation_lines` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyOrdersController.listMine → PharmacyOrdersService.listMine → PharmacyOrdersService.expireDue → InventoryReservationsService.releaseConfirmedLines | `src/modules/pharmacy_inventory/services/inventory-reservations.service.ts:238` |
| `pharmacy_inventory.inventory_reservation_lines` | LEE | LEE | DIRECTA | PharmacyOrdersController.listMine → PharmacyOrdersService.listMine → PharmacyOrdersService.composeOrders → PharmacyOrdersRepository.findLinesByReservationIds | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:212` |
| `pharmacy_inventory.inventory_reservations` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyOrdersController.listMine → PharmacyOrdersService.listMine → PharmacyOrdersService.expireDue | `src/modules/pharmacy_inventory/services/pharmacy-orders.service.ts:1532` |
| `pharmacy_inventory.inventory_reservations` | LEE | LEE | DIRECTA | PharmacyOrdersController.listMine → PharmacyOrdersService.listMine → PharmacyOrdersRepository.findOrdersByPatient | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:157` |
| `pharmacy_inventory.inventory_stock_positions` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyOrdersController.listMine → PharmacyOrdersService.listMine → PharmacyOrdersService.expireDue → InventoryReservationsService.releaseConfirmedLines | `src/modules/pharmacy_inventory/services/inventory-reservations.service.ts:266` |
| `pharmacy_inventory.inventory_stock_positions` | LEE | LEE | DIRECTA | PharmacyOrdersController.listMine → PharmacyOrdersService.listMine → PharmacyOrdersService.expireDue → InventoryReservationsService.releaseConfirmedLines → StockPositionsRepository.findByKeyForUpdate | `src/modules/pharmacy_inventory/repositories/stock-positions.repository.ts:82` |
| `pharmacy_inventory.pharmacy_order_substitutions` | LEE | LEE | DIRECTA | PharmacyOrdersController.listMine → PharmacyOrdersService.listMine → PharmacyOrdersService.composeOrders → PharmacyOrderSubstitutionsRepository.findByReservationIds | `src/modules/pharmacy_inventory/repositories/pharmacy-order-substitutions.repository.ts:62` |
| `pharmacy.pharmacies` | LEE | LEE | DIRECTA | PharmacyOrdersController.listMine → PharmacyOrdersService.listMine → PharmacyOrdersService.expireDue → PharmacyOrdersRepository.findPharmaciesByIds | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:251` |
| `pharmacy.pharmacy_products` | LEE | LEE | DIRECTA | PharmacyOrdersController.listMine → PharmacyOrdersService.listMine → PharmacyOrdersService.composeOrders → PharmacyOrdersRepository.findProductsByIds | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:242` |
| `pharmacy.pharmacy_sites` | LEE | LEE | DIRECTA | PharmacyOrdersController.listMine → PharmacyOrdersService.listMine → PharmacyOrdersService.composeOrders → PharmacyOrdersRepository.findSitesByIds | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:233` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | PharmacyOrdersController.listMine → PharmacyOrdersService.listMine → PharmacyOrdersService.expireDue → PharmacyOrderNotificationsService.expiredToPrescriber → PharmacyOrderNotificationsService.emitToPerson → PersonAccountLinksRepository.findActiveByPerson | `src/modules/profiles/repositories/person-account-links.repository.ts:101` |
| `profiles.person_profiles` | LEE | LEE | DIRECTA | PharmacyOrdersController.listMine → PharmacyOrdersService.listMine → PharmacyOrdersService.composeOrders → PharmacyOrdersRepository.findPersonNamesByProfileIds | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:135` |
| `profiles.persons` | LEE | LEE | DIRECTA | PharmacyOrdersController.listMine → PharmacyOrdersService.listMine → PharmacyOrdersService.composeOrders → PharmacyOrdersRepository.findPersonNamesByProfileIds | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:127` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | PharmacyOrdersController.listMine → PharmacyOrdersService.listMine → PharmacyOrdersService.composeOrders → PharmacyOrdersRepository.findConceptsByIds | `src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts:288` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `PharmacyOrderExpired` | `src/modules/pharmacy_inventory/services/pharmacy-orders.service.ts:1537` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PharmacyOrderListResponseDto>` · DTO `PharmacyOrderListResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<PharmacyOrderDto>` | Sí | — | — | Pedidos del paciente, más nuevos primero. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:501` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador único del pedido. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:204` |
| `items[].status` | `InventoryConceptDto` | Sí | — | — | Estado del pedido (`PINV_ORDER_*`). | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:210` |
| `items[].status.code` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `items[].status.display` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `items[].createdAt` | `string` | Sí | — | — | Instante de creación, ISO 8601. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:216` |
| `items[].expiresAt` | `string` | Sí | — | — | Vencimiento vigente del pedido, ISO 8601 (48 h desde la creación; el carril E2 la renueva al dejarlo listo para retiro). | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:223` |
| `items[].siteId` | `string` | Sí | formato uuid | — | Identificador asociado a site. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:229` |
| `items[].siteName` | `string` | Sí | — | — | Nombre de la sede. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:235` |
| `items[].pharmacyId` | `string` | Sí | formato uuid | — | Identificador asociado a pharmacy. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:241` |
| `items[].pharmacyName` | `string` | Sí | — | — | Nombre de la farmacia (comercial, o la razón social). | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:247` |
| `items[].medicationRequestId` | `string` | No | formato uuid; admite null | — | Receta que respalda el pedido, si la hay. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:253` |
| `items[].patientName` | `string` | No | admite null | — | Nombre pintable del paciente, resuelto en lote por el backend (la bandeja FAR-E2 lo necesita; cero UUIDs como copy). `null` si la persona no tiene nombre cargado. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:261` |
| `items[].deliveryMode` | `InventoryConceptDto` | No | — | — | Modalidad de entrega (`PINV_DELIVERY_*`), resuelta. `null` en pedidos anteriores al modelo v4.2.1, que no la declararon. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:268` |
| `items[].deliveryMode.code` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `items[].deliveryMode.display` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `items[].pickupCode` | `string` | No | admite null | — | Código de retiro del pedido, sellado al quedar `LISTO_PARA_RETIRO`. **Solo en la lectura del titular**: es la prueba de posesión con que la persona retira, así que la bandeja y las lecturas de staff lo sirven `null` — el mostrador no valida mirándolo, valida enviándolo en `POST /pharmacy/orders/:id/dispense`. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:279` |
| `items[].totalAmount` | `string` | No | admite null | — | Total CONGELADO del pedido con su moneda: suma de los precios congelados por el saldo reservado de cada renglón en pie. `null` si a algún renglón le falta precio publicado o si las listas mezclan monedas — una suma con huecos o que mezcla monedas afirma un costo que nadie publicó. Se re-congela cuando el pedido cambia (línea no disponible, sustitución aceptada); jamás se recalcula en una lectura. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:290` |
| `items[].currency` | `InventoryConceptDto` | No | — | — | Moneda del total congelado, resuelta. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:296` |
| `items[].currency.code` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `items[].currency.display` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `items[].rejectionReasonText` | `string` | No | admite null | — | Motivo del rechazo, en palabras, cuando el estado es `RECHAZADO` (v4.2.1 lo persiste). `null` en cualquier otro estado. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:303` |
| `items[].substitutions` | `array<PharmacyOrderSubstitutionDto>` | Sí | — | — | La historia de propuestas de sustitución del pedido, más nuevas primero. Las decididas conservan su estado y su `decidedAt`: son bitácora, no un campo mutable. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:311` |
| `items[].substitutions[].id` | `string` | Sí | formato uuid | — | Identificador de la propuesta. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:326` |
| `items[].substitutions[].originalProductId` | `string` | Sí | formato uuid | — | Producto recetado/pedido. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:332` |
| `items[].substitutions[].originalName` | `string` | Sí | — | — | Nombre pintable del original. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:338` |
| `items[].substitutions[].originalUnitPriceAmount` | `string` | No | admite null | — | Precio congelado del original al proponer, o `null` sin precio publicado. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:344` |
| `items[].substitutions[].proposedProductId` | `string` | Sí | formato uuid | — | Producto propuesto (mismo medicamento del vademécum). | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:350` |
| `items[].substitutions[].proposedName` | `string` | Sí | — | — | Nombre pintable del propuesto. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:356` |
| `items[].substitutions[].proposedUnitPriceAmount` | `string` | No | admite null | — | Precio congelado del propuesto: la oferta que el paciente decidió. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:362` |
| `items[].substitutions[].currency` | `InventoryConceptDto` | No | — | — | Moneda de la oferta, resuelta. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:368` |
| `items[].substitutions[].currency.code` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `items[].substitutions[].currency.display` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `items[].substitutions[].status` | `InventoryConceptDto` | Sí | — | — | Estado de la propuesta (`PINV_SUBSTITUTION_*`), resuelto. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:374` |
| `items[].substitutions[].status.code` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `items[].substitutions[].status.display` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `items[].substitutions[].decidedAt` | `string` | No | admite null | — | Cuándo se decidió (aceptó/rechazó/retiró), ISO 8601; `null` en pie. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:380` |
| `items[].lines` | `array<PharmacyOrderLineDto>` | Sí | — | — | Líneas del pedido. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:317` |
| `items[].lines[].productId` | `string` | Sí | formato uuid | — | Identificador asociado a product. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:118` |
| `items[].lines[].productCode` | `string` | Sí | — | — | Código interno del producto. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:124` |
| `items[].lines[].brandName` | `string` | No | admite null | — | Nombre comercial. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:130` |
| `items[].lines[].genericName` | `string` | No | admite null | — | Nombre genérico. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:136` |
| `items[].lines[].strengthText` | `string` | No | admite null | — | Concentración, legible. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:142` |
| `items[].lines[].packageSizeText` | `string` | No | admite null | — | Presentación, legible. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:148` |
| `items[].lines[].medication` | `InventoryConceptDto` | No | — | — | Medicamento del vademécum, resuelto. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:154` |
| `items[].lines[].medication.code` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `items[].lines[].medication.display` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `items[].lines[].requestedQuantity` | `number` | Sí | — | — | Cantidad solicitada por el paciente. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:160` |
| `items[].lines[].reservedQuantity` | `number` | Sí | — | — | Cantidad efectivamente reservada; `0` cuando la línea quedó sin stock. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:166` |
| `items[].lines[].fulfilledQuantity` | `number` | Sí | — | — | Cantidad ya entregada en el mostrador, acumulada entre entregas parciales (FAR-E3). El saldo por retirar es `reservedQuantity − fulfilledQuantity`. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:173` |
| `items[].lines[].unitPriceAmount` | `string` | No | admite null | — | Precio unitario CONGELADO del renglón (lo que paga el paciente), sellado al crear el pedido o al aceptar una sustitución. `null` si la sede no publicaba precio: el GET no recalcula — un precio congelado que se recalcula contra listas nuevas reescribe un pedido histórico. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:182` |
| `items[].lines[].currency` | `InventoryConceptDto` | No | — | — | Moneda del precio congelado, resuelta. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:188` |
| `items[].lines[].currency.code` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `items[].lines[].currency.display` | `string` | No | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `items[].lines[].status` | `InventoryConceptDto` | Sí | — | — | Estado de la línea (`PINV_RES_LINE_CONFIRMED` reservada, `PINV_RES_LINE_OUT_OF_STOCK` sin stock, `PINV_RES_LINE_RELEASED` liberada). | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:195` |
| `items[].lines[].status.code` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:17` |
| `items[].lines[].status.display` | `string` | Sí | — | — | — | `src/modules/pharmacy_inventory/dto/read-responses.dto.ts:23` |
| `count` | `number` | Sí | — | — | Cuántos pedidos se sirven. | `src/modules/pharmacy_inventory/dto/pharmacy-orders.dto.ts:507` |

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

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / pharmacy inventory — etapa `ctrl:PharmacyOrdersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 28. POST /pharmacy/recall-holds

- **Origen:** CONTRATO
- **Nombre:** Aplicar retiro/recall de lote (UC-25-08)
- **Bloque:** Farmacia
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyInventoryController.createRecallHold` — `src/modules/pharmacy_inventory/controllers/pharmacy-inventory.controller.ts:130`

### Qué es y para qué sirve (negocio)

Aplicar retiro/recall de lote (UC-25-08). Dentro del módulo (descripción del modelo, en inglés): «Prevents overselling and untraceable adjustments under concurrent manual, API, dispensing and receiving operations.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_25_pharmacy_inventory.puml:20`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`POST /pharmacy/recall-holds` la atiende `PharmacyInventoryController.createRecallHold` (src/modules/pharmacy_inventory/controllers/pharmacy-inventory.controller.ts:130). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateRecallHoldDto` (7 campos, 6 obligatorios). Delega en `InventoryRecallService.createHold`. Crea filas en pharmacy_inventory.inventory_ledger_entries, pharmacy_inventory.inventory_recall_holds. Actualiza pharmacy_inventory.inventory_lots, pharmacy_inventory.inventory_stock_positions. Lee pharmacy_inventory.inventory_ledger_entries, pharmacy_inventory.inventory_lots, pharmacy_inventory.inventory_stock_positions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/pharmacy_inventory/controllers/pharmacy-inventory.controller.ts:130` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharmacy_inventory.inventory_ledger_entries` | ESCRIBE | CREA | DIRECTA | PharmacyInventoryController.createRecallHold → InventoryRecallService.createHold → LedgerRepository.append | `src/modules/pharmacy_inventory/repositories/ledger.repository.ts:138` |
| `pharmacy_inventory.inventory_ledger_entries` | LEE | LEE | POR_SQL | PharmacyInventoryController.createRecallHold → InventoryRecallService.createHold → LedgerRepository.nextSequence | `src/modules/pharmacy_inventory/repositories/ledger.repository.ts:109` |
| `pharmacy_inventory.inventory_lots` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyInventoryController.createRecallHold → InventoryRecallService.createHold | `src/modules/pharmacy_inventory/services/inventory-recall.service.ts:103` |
| `pharmacy_inventory.inventory_lots` | LEE | LEE | DIRECTA | PharmacyInventoryController.createRecallHold → InventoryRecallService.createHold → LotsRepository.findById | `src/modules/pharmacy_inventory/repositories/lots.repository.ts:49` |
| `pharmacy_inventory.inventory_recall_holds` | ESCRIBE | CREA | DIRECTA | PharmacyInventoryController.createRecallHold → InventoryRecallService.createHold → RecallHoldsRepository.create | `src/modules/pharmacy_inventory/repositories/recall-holds.repository.ts:67` |
| `pharmacy_inventory.inventory_stock_positions` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyInventoryController.createRecallHold → InventoryRecallService.createHold | `src/modules/pharmacy_inventory/services/inventory-recall.service.ts:128` |
| `pharmacy_inventory.inventory_stock_positions` | LEE | LEE | DIRECTA | PharmacyInventoryController.createRecallHold → InventoryRecallService.createHold → StockPositionsRepository.findByKey | `src/modules/pharmacy_inventory/repositories/stock-positions.repository.ts:65` |

### Cuerpo — DTO `CreateRecallHoldDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `pharmacyId` | `string` | Sí | formato uuid | `@IsUUID()` | Farmacia (para el ledger) | `src/modules/pharmacy_inventory/dto/create-recall-hold.dto.ts:11` |
| `pharmacySiteId` | `string` | Sí | formato uuid | `@IsUUID()` | Sede de farmacia (para el ledger) | `src/modules/pharmacy_inventory/dto/create-recall-hold.dto.ts:21` |
| `pharmacyProductId` | `string` | Sí | formato uuid | `@IsUUID()` | Producto afectado | `src/modules/pharmacy_inventory/dto/create-recall-hold.dto.ts:28` |
| `inventoryLotId` | `string` | Sí | formato uuid | `@IsUUID()` | Lote a poner en cuarentena | `src/modules/pharmacy_inventory/dto/create-recall-hold.dto.ts:35` |
| `inventoryLocationId` | `string` | Sí | formato uuid | `@IsUUID()` | Ubicación del lote (para el ledger) | `src/modules/pharmacy_inventory/dto/create-recall-hold.dto.ts:45` |
| `recallReference` | `string` | Sí | longitud máxima 128 | `@IsString()` `@MaxLength(128)` | Referencia del recall (autoridad) | `src/modules/pharmacy_inventory/dto/create-recall-hold.dto.ts:53` |
| `sourceAuthorityTenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tenant de la autoridad emisora | `src/modules/pharmacy_inventory/dto/create-recall-hold.dto.ts:64` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/pharmacy_inventory/dto/responses.dto.ts:9` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Lote no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharmacy_inventory.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / pharmacy inventory — etapa `ctrl:PharmacyInventoryController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 29. POST /pharmacy/recall-holds/{id}/release

- **Origen:** CONTRATO
- **Nombre:** Liberar recall y reactivar lote (UC-25-09)
- **Bloque:** Farmacia
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacyInventoryController.releaseRecallHold` — `src/modules/pharmacy_inventory/controllers/pharmacy-inventory.controller.ts:142`

### Qué es y para qué sirve (negocio)

Liberar recall y reactivar lote (UC-25-09). Dentro del módulo (descripción del modelo, en inglés): «Prevents overselling and untraceable adjustments under concurrent manual, API, dispensing and receiving operations.» Dominio: Farmacia.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_25_pharmacy_inventory.puml:20`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:30`)

### Cómo se atiende (sistema)

`POST /pharmacy/recall-holds/{id}/release` la atiende `PharmacyInventoryController.releaseRecallHold` (src/modules/pharmacy_inventory/controllers/pharmacy-inventory.controller.ts:142). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `ReleaseRecallHoldDto` (1 campo, 0 obligatorios). Delega en `InventoryRecallService.release`. Crea filas en pharmacy_inventory.inventory_ledger_entries. Actualiza pharmacy_inventory.inventory_lots, pharmacy_inventory.inventory_recall_holds, pharmacy_inventory.inventory_stock_positions. Lee pharmacy_inventory.inventory_ledger_entries, pharmacy_inventory.inventory_lots, pharmacy_inventory.inventory_recall_holds, pharmacy_inventory.inventory_stock_positions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/pharmacy_inventory/controllers/pharmacy-inventory.controller.ts:142` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/pharmacy_inventory/controllers/pharmacy-inventory.controller.ts:142` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharmacy_inventory.inventory_ledger_entries` | ESCRIBE | CREA | DIRECTA | PharmacyInventoryController.releaseRecallHold → InventoryRecallService.release → LedgerRepository.append | `src/modules/pharmacy_inventory/repositories/ledger.repository.ts:138` |
| `pharmacy_inventory.inventory_ledger_entries` | LEE | LEE | POR_SQL | PharmacyInventoryController.releaseRecallHold → InventoryRecallService.release → LedgerRepository.nextSequence | `src/modules/pharmacy_inventory/repositories/ledger.repository.ts:109` |
| `pharmacy_inventory.inventory_lots` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyInventoryController.releaseRecallHold → InventoryRecallService.release | `src/modules/pharmacy_inventory/services/inventory-recall.service.ts:176` |
| `pharmacy_inventory.inventory_lots` | LEE | LEE | DIRECTA | PharmacyInventoryController.releaseRecallHold → InventoryRecallService.release → LotsRepository.findById | `src/modules/pharmacy_inventory/repositories/lots.repository.ts:49` |
| `pharmacy_inventory.inventory_recall_holds` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyInventoryController.releaseRecallHold → InventoryRecallService.release | `src/modules/pharmacy_inventory/services/inventory-recall.service.ts:168` |
| `pharmacy_inventory.inventory_recall_holds` | LEE | LEE | DIRECTA | PharmacyInventoryController.releaseRecallHold → InventoryRecallService.release → RecallHoldsRepository.findById | `src/modules/pharmacy_inventory/repositories/recall-holds.repository.ts:56` |
| `pharmacy_inventory.inventory_stock_positions` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacyInventoryController.releaseRecallHold → InventoryRecallService.release | `src/modules/pharmacy_inventory/services/inventory-recall.service.ts:207` |
| `pharmacy_inventory.inventory_stock_positions` | LEE | LEE | DIRECTA | PharmacyInventoryController.releaseRecallHold → InventoryRecallService.release → StockPositionsRepository.findByLot | `src/modules/pharmacy_inventory/repositories/stock-positions.repository.ts:98` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `ReleaseRecallHoldDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `writeOff` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Si es true, el stock en cuarentena se da de baja (write-off) en vez de reintegrarse | `src/modules/pharmacy_inventory/dto/release-recall-hold.dto.ts:16` |

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
| 404 | `NOT_FOUND` | ResourceNotFoundException: Hold de recall no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El hold no está activo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharmacy_inventory.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- src / modules / pharmacy inventory — etapa `ctrl:PharmacyInventoryController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

