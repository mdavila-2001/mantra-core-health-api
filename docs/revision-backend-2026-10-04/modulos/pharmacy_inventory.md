# Revisión del módulo `pharmacy_inventory` — ALOVIDA

## 1. Alcance, método y límites

- Fecha: 2026-10-05. Unidad: `src/modules/pharmacy_inventory` (13.407 líneas TypeScript no spec).
- Lectura focal: controladores, servicios de reserva, transferencia, dispensación, compras, conteo y recall; DTOs; repositorios de lookup; entidades y DDL del ledger.
- Evidencia dinámica: `corepack yarn test src/modules/pharmacy_inventory --runInBand --silent` → **7 suites y 117 tests pasan**. Sus repositorios/ledger son doubles y no prueban FK, relaciones farmacia–sede–ubicación ni dos tenants.
- No cubierto: reconciliación ERP completa, pedidos de paciente en todos sus estados, worker de inventario y cada constraint/índice de base en un almacén vivo.

## 2. Resumen ejecutivo

| Severidad | Total | Hallazgos |
|---|---:|---|
| Crítica | 1 | PINV-01: operaciones administrativas escriben inventario de una farmacia arbitraria sin alcance del actor ni coherencia de relaciones. |
| Alta | 1 | PINV-02: conteo y liberación de recall usan IDs de sede/ubicación como `pharmacy_id` del ledger. |
| Media | 1 | PINV-03: líneas y lotes de entrada no tienen límite máximo. |

La cara de lectura pública sí obtiene `tenantId`, resuelve sede y farmacia visible y devuelve el mismo `404` cuando están fuera de alcance ([pharmacy-inventory-read.service.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/pharmacy_inventory/services/pharmacy-inventory-read.service.ts#L83-L98)). Ese control no se reutiliza en los writes administrativos revisados.

## 3. Mapa revisado

| Área | Rutas principales | Control observado |
|---|---|---|
| Stock | reservas, transferencias, ubicaciones y conteos bajo `/pharmacy` | Sólo `SECURITY_ADMIN`; los servicios reciben IDs de ruta/cuerpo sin resolver tenant. |
| Dispensación | `POST /pharmacy/:pharmacyId/dispensations`, reversión | Sólo `SECURITY_ADMIN`; reserva y dispensación se buscan globalmente por UUID. |
| Aprovisionamiento | proveedor, orden de compra, recepción | Sólo `SECURITY_ADMIN`; proveedor, orden, línea y ubicación se buscan globalmente. |
| Recall | aplicar/liberar hold | Sólo `SECURITY_ADMIN`; lote, hold y posiciones se buscan sin alcance de farmacia. |
| Ledger | `inventory_ledger_entries` | `pharmacy_id` referencia `pharmacy.pharmacies`; `pharmacy_site_id` y `inventory_location_id` son FK diferentes. |

Hay trabajo pendiente de integrar en `2372d42a` para endurecer DTOs de este módulo. Debe contrastarse antes de cerrar PINV-03 y no sustituye las comprobaciones de autorización ni de relaciones.

## 4. Hallazgos confirmados

### PINV-01 — Crítica — los writes de inventario no atan actor, farmacia, sede, ubicación, lote y producto

**Evidencia y refutación.** Los controladores aceptan `pharmacyId` o `siteId` y sólo requieren el rol global `SECURITY_ADMIN` ([pharmacy-inventory.controller.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/pharmacy_inventory/controllers/pharmacy-inventory.controller.ts#L60-L152), [pharmacy-procurement.controller.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/pharmacy_inventory/controllers/pharmacy-procurement.controller.ts#L37-L76), [pharmacy-dispensing.controller.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/pharmacy_inventory/controllers/pharmacy-dispensing.controller.ts#L33-L56)). En reserva se persisten `pharmacyId`, sede, paciente, solicitud y líneas recibidas sin buscar ni comparar sus dueños ([inventory-reservations.service.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/pharmacy_inventory/services/inventory-reservations.service.ts#L65-L153)). Transferencia busca las dos ubicaciones sólo por `id` y no verifica que pertenezcan a la farmacia/sede de ruta ni entre sí ([inventory-transfers.service.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/pharmacy_inventory/services/inventory-transfers.service.ts#L62-L150)); el repositorio confirma el lookup global ([locations.repository.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/pharmacy_inventory/repositories/locations.repository.ts#L48-L58)).

El patrón se repite al dispensar con reserva global ([medication-dispensations.service.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/pharmacy_inventory/services/medication-dispensations.service.ts#L111-L143)), al crear compra con proveedor global ([pharmacy-procurement.service.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/pharmacy_inventory/services/pharmacy-procurement.service.ts#L100-L154)), recibir con orden/ubicación/línea globales ([#L230-L304](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/pharmacy_inventory/services/pharmacy-procurement.service.ts#L230-L304)), y crear/liberar recalls ([inventory-recall.service.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/pharmacy_inventory/services/inventory-recall.service.ts#L70-L141), [#L145-L224](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/pharmacy_inventory/services/inventory-recall.service.ts#L145-L224)). La ruta de pedidos de paciente sí usa `requireTenantId()` y lookups acotados, por lo que es una implementación distinta y no refuta estos writes.

**Impacto y escenario.** Un administrador que conozca UUIDs de otra farmacia puede reservar, mover, cuarentenar, dispensar o vincular stock, pacientes y documentos de ámbitos distintos. Esto altera existencias y trazabilidad farmacéutica, y permite revelar/usar relaciones de paciente, receta y pedido ajenas.

**Plan de corrección.**

1. Introducir una política de alcance de farmacia que derive `tenantId` del contexto y resuelva farmacia, sede, ubicación, producto, lote, proveedor, orden y reserva dentro de esa cadena.
2. Pasar un objeto de alcance resuelto a reserva, transferencia, dispensación, compras, conteo y recall; dejar de aceptar la combinación de IDs como prueba de relación.
3. Cambiar repositorios `findById` usados por comandos a consultas con los IDs padres necesarios; comprobar que origen y destino de transferencia pertenecen a la misma farmacia o implementar explícitamente transferencias inter-farmacia.
4. Verificar paciente, receta y cotización antes de persistir una reserva/dispensación y devolver el mismo resultado para un UUID ajeno e inexistente.
5. Añadir tests de integración T1/T2 y constraints compuestas donde una relación pueda garantizarse en SQL.

| Caso | Tipo y preparación | Entrada | Resultado esperado |
|---|---|---|---|
| Correcto | Integración, admin T1 y cadena farmacia/sede/ubicación/producto T1 | reserva o transferencia íntegra T1 | un ledger y stock T1 coherentes. |
| Límite | Integración, dos ubicaciones T1 válidas | transferencia entre ambas | dos asientos correlacionados y saldo conservado. |
| Error | Integración, admin T1 combina farmacia T1 con ubicación/lote/proveedor T2 | comando de write | cero filas y cero actualización de stock. |
| Falla catalogada | E2E, recurso T2 por UUID | misma ruta | `404`, `RESOURCE_NOT_FOUND`, `PHARMACY_INVENTORY_RESOURCE_NOT_AVAILABLE`. |

### PINV-02 — Alta — conteo y recall escriben claves foráneas de farmacia con IDs de otro tipo

**Evidencia.** `InventoryLedgerEntries.pharmacyId` es FK a `pharmacy.pharmacies`, mientras `pharmacySiteId` e `inventoryLocationId` son FK separados ([inventory_ledger_entries.entity.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/pharmacy_inventory/entities/inventory_ledger_entries.entity.ts#L15-L31)). Al aprobar un conteo, el servicio usa `session.pharmacySiteId` tanto para `nextSequence` como para `pharmacyId` ([inventory-count.service.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/pharmacy_inventory/services/inventory-count.service.ts#L191-L208)); la sesión sólo almacena una sede, no una farmacia ([inventory_count_sessions.entity.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/pharmacy_inventory/entities/inventory_count_sessions.entity.ts#L15-L25)). Al liberar un recall, usa `pos.inventoryLocationId` como secuencia, farmacia y sede ([inventory-recall.service.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/pharmacy_inventory/services/inventory-recall.service.ts#L180-L205)); una posición también sólo contiene ubicación, producto y lote ([inventory_stock_positions.entity.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/pharmacy_inventory/entities/inventory_stock_positions.entity.ts#L18-L34)).

Con las FK del DDL activas, estos valores no pertenecen a `pharmacy.pharmacies` ni a `pharmacy.pharmacy_sites` por definición y el flush debe fallar; si las FK no están aplicadas, se graban asientos corruptos. Las pruebas verdes no contienen aserciones sobre estos argumentos ni usan la base real.

**Plan de corrección.** Resolver cada ubicación a su `pharmacySiteId` y después la sede a su `pharmacyId` antes de generar el asiento. Hacer que el repositorio de posiciones/ubicaciones devuelva ese contexto o reciba una consulta unida; validar que todas las posiciones de un recall coincidan con el producto/lote retenidos; pasar `pharmacyId` verdadero a `nextSequence` y al ledger. Ejecutar migración de reparación para asientos ya creados sólo tras mapear relaciones y reconciliar saldos.

| Caso | Tipo y preparación | Entrada | Resultado esperado |
|---|---|---|---|
| Correcto | Integración con FK habilitadas | aprobar conteo con varianza | asiento con farmacia y sede verdaderas; `200`. |
| Límite | Integración, recall con posiciones en dos sedes de una farmacia | liberar sin write-off | un asiento válido por posición y cuarentena en cero. |
| Error | Integración, posición/lote que no corresponde al hold | liberar recall | ninguna mutación fuera de la cadena del hold. |
| Falla catalogada | E2E, relación inconsistente | aprobar/liberar | `409`, `PRECONDITION_FAILED`, `PHARMACY_INVENTORY_SCOPE_INCONSISTENT`. |

### PINV-03 — Media — lotes de líneas sin máximo y cantidades cero aceptadas

**Evidencia.** Reservas, dispensaciones, recepciones, órdenes y sincronización sólo exigen `@ArrayMinSize(1)` sin `@ArrayMaxSize` ([create-reservation.dto.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/pharmacy_inventory/dto/create-reservation.dto.ts#L95-L103), [create-dispensation.dto.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/pharmacy_inventory/dto/create-dispensation.dto.ts#L109-L117), [create-goods-receipt.dto.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/pharmacy_inventory/dto/create-goods-receipt.dto.ts#L128-L136), [create-purchase-order.dto.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/pharmacy_inventory/dto/create-purchase-order.dto.ts#L85-L93), [create-sync-batch.dto.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/pharmacy_inventory/dto/create-sync-batch.dto.ts#L92-L100)). Las cantidades de reserva, transferencia y dispensación admiten `0` por usar `@Min(0)` ([create-reservation.dto.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/pharmacy_inventory/dto/create-reservation.dto.ts#L38-L45), [create-transfer.dto.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/pharmacy_inventory/dto/create-transfer.dto.ts#L42-L48), [create-dispensation.dto.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/pharmacy_inventory/dto/create-dispensation.dto.ts#L40-L65)).

**Plan.** Definir máximo por tipo de lote y `@Min(1)` donde una línea cero no tiene semántica. Deduplicar producto/lote/ubicación antes de bloquear stock para evitar repetir un mismo recurso en un request. Coordinar valores con el endurecimiento DTO pendiente.

| Caso | Tipo y preparación | Entrada | Resultado esperado |
|---|---|---|---|
| Correcto | Unit DTO | lote válido y cantidades positivas | valida. |
| Límite | Unit DTO | exactamente el máximo acordado | valida y genera una mutación por línea. |
| Error | Unit DTO | cantidad `0`, duplicado o máximo + 1 | no llama al servicio. |
| Falla catalogada | E2E | cuerpo con lote excesivo | `400`, `VALIDATION_FAILED`, `PHARMACY_INVENTORY_BATCH_TOO_LARGE`. |

## 5. Olas y regresión

| Ola | Hallazgos | Esfuerzo | Gate |
|---|---|---:|---|
| 0 | PINV-01 | L | integración con dos tenants y matriz completa de relaciones; revisar cada write contra UUID ajeno. |
| 0 | PINV-02 | M | PostgreSQL con FK reales, conteo con varianza, recall multiubicación y conciliación de ledger. |
| 2 | PINV-03 | S | DTO, duplicados y lotes máximos; contraste con `2372d42a`. |

Tras cada cambio ejecutar `corepack yarn test src/modules/pharmacy_inventory --runInBand --silent` y añadir las pruebas de integración que hoy faltan. Los 117 tests unitarios actuales no deben tratarse como prueba de aislamiento ni de integridad referencial.
