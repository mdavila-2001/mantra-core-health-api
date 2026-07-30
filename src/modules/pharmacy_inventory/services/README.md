# Servicios — pharmacy_inventory

Lógica de dominio. Inyectan `EntityManager` (`@mikro-orm/postgresql`) y envuelven
cada operación en `this.em.transactional(...)`. Los repos reciben el `tx` activo;
se hace `flush` padre-antes-de-hijo. Los `*_concept_id` provienen de `PINV`
(`pharmacy_inventory.concepts.ts`). El ledger es **append-only**: nunca se
actualiza ni borra un asiento; las reversas y liberaciones son asientos nuevos.

`available_quantity = on_hand - reserved - quarantine` se recalcula en cada
movimiento. Excepciones: `ResourceNotFoundException` (404), `ConflictException`
(409), `PreconditionFailedException` (422).

| Servicio | UCs | Notas |
| --- | --- | --- |
| `InventoryLocationsService` | bootstrap | Ubicación (parent de stock/ledger). |
| `PharmacyProcurementService` | 01, 02 (+bootstrap proveedor) | PO, recepción, ledger RECEIPT. |
| `InventoryReservationsService` | 04, 05 | Reserva y expiración (worker). |
| `MedicationDispensationsService` | 03, 11 | Dispensa y reversa compensatoria. |
| `InventoryCountService` | 06, 07 | Conteo cíclico y ajuste por varianza. |
| `InventoryRecallService` | 08, 09 | Hold de recall y liberación/write-off. |
| `InventoryTransfersService` | 10 | TRANSFER_OUT + TRANSFER_IN correlacionados. |
| `InventorySyncService` | 12 (+bootstrap lote) | Reconciliación ERP gobernada. |
