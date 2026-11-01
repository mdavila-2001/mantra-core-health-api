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

El módulo tiene **6 controllers, 29 rutas HTTP, 21 entidad y 11 servicios** (incluye los ya documentados más abajo). La columna *Acceso* sale del código: `pública` = `@Public()`; un rol = `@Roles(...)`; `sesión` = sin ninguno de los dos, o sea que sólo exige sesión autenticada (guards globales `JwtAuthGuard`, `TenantScopeGuard`, `RolesGuard`, `VerifiedIdentityGuard`). La autorización por recurso (propiedad, tenant, vínculo) puede vivir además en el servicio y no se refleja acá.

Si una tabla narrativa más abajo difiere de ésta (prefijo del controller omitido, sufijos `:accion` de la spec en lugar de sub-rutas), manda ésta: sale del código.

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
| `GET /pharmacy-inventory/availability/medications` | sesión | `pharmacy-inventory-read` |
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

## Conexión de cada farmacia con su sistema (FAR-C9)

La llave `PHARMACY_CONNECTION_SECRET_KEY` debe conservarse y respaldarse bajo
custodia del responsable del entorno. Cambiarla o perderla impide descifrar las
credenciales existentes: no se regenera en cada arranque ni se rota sin un
procedimiento de recifrado o recarga de conexiones. Nunca se publica su valor.
Las pistas de claves de cuatro caracteres o menos se omiten. Las pistas
anteriores sin marca de cálculo seguro también se ocultan hasta recargar la
clave, sin descifrarla para mostrar la configuración.
Las URLs base no admiten usuario/contraseña, consulta ni fragmento: la clave
debe ir exclusivamente en su campo cifrado. Las URLs antiguas con esos
componentes no se devuelven en la vista ni se usan para enviar credenciales.
Para sanear una configuración antigua así, se deben cargar destino y clave válidos.
La consulta paginada de la cadena simulada comparte un presupuesto total de
tiempo entre todas sus páginas; no reinicia ese plazo por página ni reintenta.
El plazo incluye la resolución del destino. Las lecturas de catálogo y la
sincronización de una conexión propia usan ese mismo ERP y sus códigos externos;
la configuración global sólo se conserva para las conexiones anteriores sin ERP
propio. El stock consultado descuenta las reservas locales pendientes antes de
ofrecer unidades nuevas, bajo el candado de la sede. Esto no es una reserva
atómica en el sistema externo: ese contrato sólo expone consultas.
Los conteos agregados no se superponen a existencias por lote: se conserva el
rechazo `SITE_PRODUCT_KEPT_BY_LOTS` que exige recepciones y conteos por lote.
Una línea manual pendiente con posiciones por lote no admite actualmente una
confirmación positiva mediante `CONFIRMAR_STOCK`: contar los lotes no elimina
el rechazo al conteo agregado. El cliente no debe sustituir silenciosamente
esa declaración por una confirmación sin ajustes, aunque la compatibilidad API
sin ajustes conserve la reserva contra el libro existente.
La
sincronización de una conexión propia también descuenta las reservas locales;
el adaptador global anterior conserva su interpretación.

Cada farmacia configura en su pestaña Integración la conexión con su propio
sistema: tipo, dirección, clave, código de farmacia y código de cada sucursal.

- **Endpoints** (`PharmacyErpConnectionController`, rol de la farmacia o
  `SECURITY_ADMIN`): `GET`/`PUT /pharmacies/:pharmacyId/erp-connection`,
  `POST …/erp-connection/test` (prueba los datos del formulario sin guardarlos)
  y `POST …/erp-connection/test-saved` (prueba lo guardado y deja su estado).
- **Dónde se guarda**, sin columnas nuevas: el tipo es una fila de
  `integrations.external_providers` (`ALOVIDA_STANDARD`, `SIMULATED_CHAIN`, por
  el seed «tipos de sistema de farmacia»); la conexión, una
  `integrations.provider_connections` del tenant de la farmacia, apuntada por
  `pharmacy_integration_connections.connection_id`; dirección, códigos, últimos
  4 de la clave y último estado van en su `config_json`; la clave, cifrada en
  `provider_credentials.secret_ref` (`enc:v1:`, AES-256-GCM con
  `PHARMACY_CONNECTION_SECRET_KEY`). Sin esa variable la API arranca, y guardar
  o probar responde «falta configurar el cifrado de conexiones». La clave nunca
  vuelve: solo `••••` y sus últimos 4 caracteres.
- **La regla del modo** vive en un solo lugar:
  `domain/erp-connection/pharmacy-stock-mode.ts`. **Manual** (por defecto): las
  líneas del pedido entran «por confirmar» y la sucursal confirma con
  `CONFIRMAR_STOCK`. **Conectada**: al pedir se consulta en vivo el stock de la
  sucursal (3 s como máximo, sin reintentos); con stock se reserva y con 0 la
  línea queda sin stock. Si el sistema no responde o rechaza la clave, la
  conexión queda «con error» (`UNREACHABLE` o `AUTH_REJECTED`), el pedido sigue
  como manual y la siguiente llamada que funcione la deja activa otra vez.
- **Adaptadores**: uno por tipo, detrás de `ExternalPharmacyCatalogPort`
  (`infrastructure/adapters/pharmacy-catalog.factory.ts`). El contrato del
  **Estándar ALOVIDA** está publicado en
  [`docs/integrations/pharmacy-standard.openapi.yaml`](../../../docs/integrations/pharmacy-standard.openapi.yaml).
- **«Sincronizar ahora» (FAR-07)** sigue usando la configuración única del
  servidor (`PHARMACY_ERP_BASE_URL`) como respaldo: el pedido ya no depende de
  ella.

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
| `GET /pharmacy-inventory/availability/medications?medications=a,b&lat=&lng=&limit=` | Lo mismo por medicamento de una receta, en toda la red: un producto propio por medicamento en cada sede y los medicamentos que le faltan |

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

## Pruebas

```bash
corepack yarn test src/modules/pharmacy_inventory --runInBand --silent
```

La corrida dirigida de la revisión (2026-10-05) pasó 7 suites y 117 tests. Usa
dobles de repositorio y no demuestra claves foráneas, tenant ni pertenencia entre
farmacia, sede, ubicación, lote y producto.

## Revisión backend 2026-10-05

Los comandos administrativos aceptan relaciones de inventario sin alcance de
tenant, y los asientos de conteo/recall usan IDs de sede o ubicación como
farmacia: el movimiento de stock no está validado sobre PostgreSQL con FK
activas.
