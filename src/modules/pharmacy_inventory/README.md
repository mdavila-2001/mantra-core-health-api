# src / modules / pharmacy inventory

Inventario y operación de farmacia (schema `pharmacy_inventory`): ubicaciones, lotes, series y posiciones de stock con su libro de movimientos; conteos físicos, retiros de lote (recall), reservas y transferencias; sincronización de inventario externo; compras (proveedores, cotizaciones, órdenes y recepciones); dispensación de medicación y pedidos del paciente a la farmacia.

Entidades (21, `find src/modules/pharmacy_inventory -name '*.entity.ts' | wc -l`): `inventory_locations`, `inventory_lots`, `inventory_serials`, `inventory_stock_positions`, `inventory_ledger_entries`, `inventory_count_sessions`, `inventory_count_lines`, `inventory_recall_holds`, `inventory_reservations`, `inventory_reservation_lines`, `pharmacy_inventory_sync_batches`, `pharmacy_inventory_sync_items`, `pharmacy_suppliers`, `purchase_quotations`, `pharmacy_purchase_orders`, `pharmacy_purchase_order_lines`, `pharmacy_goods_receipts`, `pharmacy_goods_receipt_lines`, `medication_dispensations`, `medication_dispensation_lines`, `pharmacy_order_substitutions`.

## Rutas HTTP y alcance (medido)

<!-- Medido el 2026-10-08 sobre origin/dev (dae4fd68). Repetir con:
  find src/modules/pharmacy_inventory -name '*.controller.ts' | wc -l
  find src/modules/pharmacy_inventory -name '*.controller.ts' -exec grep -hE "^\s*@(Get|Post|Put|Patch|Delete)\(" {} + | wc -l
  find src/modules/pharmacy_inventory -name '*.entity.ts' | wc -l
  find src/modules/pharmacy_inventory -name '*.service.ts' | wc -l
La tabla sale de los decoradores `@Controller`/`@Get`/`@Post`/`@Put`/`@Patch`/`@Delete`, `@Roles` y `@Public`. -->

El módulo tiene **6 controllers, 29 rutas HTTP, 21 entidades y 11 servicios** (incluye los ya documentados más abajo). La columna *Acceso* sale del código: `pública` = `@Public()`; un rol = `@Roles(...)`; `sesión` = sin ninguno de los dos, o sea que sólo exige sesión autenticada (guards globales `JwtAuthGuard`, `TenantScopeGuard`, `RolesGuard`, `VerifiedIdentityGuard`). La autorización por recurso (propiedad, tenant, vínculo) puede vivir además en el servicio y no se refleja acá.

Importa (`pharmacy_inventory.module.ts`): `DirectoryAuthorizationModule`, `InsurancePatientSettlementModule`, `PharmacyModule`, `MessagingModule`.

| Método y ruta | Acceso | Controller |
| --- | --- | --- |
| `POST /pharmacy/:pharmacyId/dispensations` | SECURITY_ADMIN | `pharmacy-dispensing` |
| `POST /pharmacy/dispensations/:id/reverse` | SECURITY_ADMIN | `pharmacy-dispensing` |
| `POST /internal/reservations/expire` | SYSTEM, SECURITY_ADMIN | `pharmacy-inventory-internal` |
| `POST /internal/inventory-sync-batches` | SECURITY_ADMIN | `pharmacy-inventory-internal` |
| `POST /internal/inventory-sync/:batchId/reconcile` | SECURITY_ADMIN | `pharmacy-inventory-internal` |
| `GET /pharmacy-inventory/sites/:siteId/stock` | sesión | `pharmacy-inventory-read` |
| `GET /pharmacy-inventory/availability` | sesión | `pharmacy-inventory-read` |
| `POST /pharmacy/:siteId/inventory-locations` | SECURITY_ADMIN | `pharmacy-inventory` |
| `POST /pharmacy/:pharmacyId/reservations` | SECURITY_ADMIN | `pharmacy-inventory` |
| `POST /pharmacy/:pharmacyId/transfers` | SECURITY_ADMIN | `pharmacy-inventory` |
| `POST /pharmacy/:siteId/count-sessions` | SECURITY_ADMIN | `pharmacy-inventory` |
| `POST /pharmacy/count-sessions/:id/approve` | SECURITY_ADMIN | `pharmacy-inventory` |
| `POST /pharmacy/recall-holds` | SECURITY_ADMIN | `pharmacy-inventory` |
| `POST /pharmacy/recall-holds/:id/release` | SECURITY_ADMIN | `pharmacy-inventory` |
| `GET /pharmacy/orders` | SECURITY_ADMIN | `pharmacy-orders` |
| `POST /pharmacy/orders` | PATIENT | `pharmacy-orders` |
| `GET /pharmacy/orders/me` | PATIENT | `pharmacy-orders` |
| `GET /pharmacy/orders/:id` | sesión | `pharmacy-orders` |
| `POST /pharmacy/orders/:id/cancel` | PATIENT | `pharmacy-orders` |
| `POST /pharmacy/orders/:id/review` | SECURITY_ADMIN | `pharmacy-orders` |
| `POST /pharmacy/orders/:id/confirm` | SECURITY_ADMIN | `pharmacy-orders` |
| `POST /pharmacy/orders/:id/accept-substitutions` | PATIENT | `pharmacy-orders` |
| `POST /pharmacy/orders/:id/prefer-original` | PATIENT | `pharmacy-orders` |
| `POST /pharmacy/orders/:id/reject` | SECURITY_ADMIN | `pharmacy-orders` |
| `POST /pharmacy/orders/:id/ready` | SECURITY_ADMIN | `pharmacy-orders` |
| `POST /pharmacy/orders/:id/dispense` | SECURITY_ADMIN | `pharmacy-orders` |
| `POST /pharmacy/:pharmacyId/suppliers` | SECURITY_ADMIN | `pharmacy-procurement` |
| `POST /pharmacy/:pharmacyId/purchase-orders` | SECURITY_ADMIN | `pharmacy-procurement` |
| `POST /pharmacy/:pharmacyId/goods-receipts` | SECURITY_ADMIN | `pharmacy-procurement` |

## Contenido

### Subcarpetas

- [`controllers/`](./controllers/README.md): Adaptadores HTTP que validan solicitudes, aplican autorización y delegan la lógica en servicios.
- [`dto/`](./dto/README.md): Contratos de entrada y salida, validación y documentación de la API.
- [`entities/`](./entities/README.md): Entidades y relaciones que representan el modelo persistente.
- [`repositories/`](./repositories/README.md): Consultas y operaciones de persistencia aisladas de la lógica de negocio.
- [`services/`](./services/README.md): Casos de uso, reglas de negocio y coordinación transaccional.

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `pharmacy_inventory.concepts.ts` | Conceptos de terminología del módulo. |
| `pharmacy_inventory.module.ts` | Composición de dependencias del módulo NestJS. |

## Cara de lectura (carril E2 · `/pharmacy-inventory`)

| Método y ruta | Resumen |
| --- | --- |
| `GET /pharmacy-inventory/sites/{siteId}/stock?product=` | Stock disponible de una sede, agregado por producto sobre sus ubicaciones activas |
| `GET /pharmacy-inventory/availability?products=a,b&lat=&lng=&limit=` | Qué sedes pueden surtir un pedido: completas primero, luego distancia y precio |

La visibilidad es la del directorio de farmacias (módulo 24) y se **reutiliza**
—`PharmacyReadRepository` viene exportado por `PharmacyModule`— en vez de
repetir los filtros de publicación: sede activa de farmacia `ACTIVE` +
`VERIFIED` del tenant; lo demás responde el mismo `404`. El stock disponible es
la columna `available` que mantiene el ledger (descuenta reservas y
cuarentenas); acá sólo se agrega por sede, nunca se recalcula. La distancia es
Haversine sobre las coordenadas de `common.addresses` (vía
`practice_sites.address_id`); sin coordenadas —de la sede o de la consulta— no
se inventa: `distanceKm` va `null` y la sede ordena al final. El total de una
sede sólo existe si **todos** sus disponibles tienen precio publicado en la
misma moneda.

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
