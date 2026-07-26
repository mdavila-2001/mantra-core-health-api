import { defineModuleConcepts } from '../../common/seed/concept-seed';

/**
 * Conceptos propios del módulo pharmacy_inventory (prefijo `pharmacy_inventory:`).
 *
 * El esquema es "concept-driven": estados, tipos y modos no son enums de columna
 * sino filas de `terminology.catalog_concepts` referenciadas por FK
 * (`*_concept_id`). Aquí se declaran solo los conceptos que los endpoints de
 * inventario de farmacia necesitan para que TODA columna `*_concept_id` NOT NULL
 * de sus inserts tenga un valor determinista.
 *
 * `PHARMACY_INVENTORY_CONCEPT_SEEDS` lo consume el agregador central del seed;
 * `PINV` es el mapa `nombre -> UUID` determinista que consumen los servicios.
 */
export const { seeds: PHARMACY_INVENTORY_CONCEPT_SEEDS, ids: PINV } = defineModuleConcepts(
  'pharmacy_inventory',
  {
    // --- Proveedores (pharmacy_suppliers.status_concept_id) ---
    SUPPLIER_ACTIVE: { code: 'PINV_SUPPLIER_ACTIVE', display: 'Supplier active' },
    SUPPLIER_INACTIVE: { code: 'PINV_SUPPLIER_INACTIVE', display: 'Supplier inactive' },
    PAYMENT_TERMS_NET30: { code: 'PINV_PAYMENT_TERMS_NET30', display: 'Net 30 payment terms' },

    // --- Ubicaciones de inventario (inventory_locations) ---
    LOCATION_ACTIVE: { code: 'PINV_LOCATION_ACTIVE', display: 'Inventory location active' },
    LOCATION_TYPE_SHELF: { code: 'PINV_LOCATION_TYPE_SHELF', display: 'Shelf location' },
    TEMPERATURE_ZONE_AMBIENT: { code: 'PINV_TEMP_ZONE_AMBIENT', display: 'Ambient temperature zone' },

    // --- Órdenes de compra (pharmacy_purchase_orders.status_concept_id) ---
    PO_DRAFT: { code: 'PINV_PO_DRAFT', display: 'Purchase order draft' },
    PO_ORDERED: { code: 'PINV_PO_ORDERED', display: 'Purchase order ordered' },
    PO_PARTIAL: { code: 'PINV_PO_PARTIAL', display: 'Purchase order partially received' },
    PO_RECEIVED: { code: 'PINV_PO_RECEIVED', display: 'Purchase order received' },

    // --- Líneas de orden de compra ---
    PO_LINE_ORDERED: { code: 'PINV_PO_LINE_ORDERED', display: 'PO line ordered' },
    PO_LINE_PARTIAL: { code: 'PINV_PO_LINE_PARTIAL', display: 'PO line partially received' },
    PO_LINE_RECEIVED: { code: 'PINV_PO_LINE_RECEIVED', display: 'PO line received' },

    // --- Recepción de mercancía (pharmacy_goods_receipts.status_concept_id) ---
    RECEIPT_POSTED: { code: 'PINV_RECEIPT_POSTED', display: 'Goods receipt posted' },

    // --- Lotes (inventory_lots) ---
    LOT_ACTIVE: { code: 'PINV_LOT_ACTIVE', display: 'Inventory lot active' },
    LOT_QUARANTINED: { code: 'PINV_LOT_QUARANTINED', display: 'Lot quarantined' },
    LOT_QUARANTINE_RELEASED: { code: 'PINV_LOT_QUARANTINE_RELEASED', display: 'Lot quarantine released' },
    LOT_RECALLED: { code: 'PINV_LOT_RECALLED', display: 'Lot recalled' },
    LOT_RECALL_CLEARED: { code: 'PINV_LOT_RECALL_CLEARED', display: 'Lot recall cleared' },

    // --- Seriales (inventory_serials.status_concept_id) ---
    SERIAL_AVAILABLE: { code: 'PINV_SERIAL_AVAILABLE', display: 'Serial available' },
    SERIAL_DISPENSED: { code: 'PINV_SERIAL_DISPENSED', display: 'Serial dispensed' },

    // --- Reservas (inventory_reservations.reservation_status_concept_id) ---
    RESERVATION_CONFIRMED: { code: 'PINV_RESERVATION_CONFIRMED', display: 'Reservation confirmed' },
    RESERVATION_FULFILLED: { code: 'PINV_RESERVATION_FULFILLED', display: 'Reservation fulfilled' },
    RESERVATION_EXPIRED: { code: 'PINV_RESERVATION_EXPIRED', display: 'Reservation expired' },
    RESERVATION_CANCELLED: { code: 'PINV_RESERVATION_CANCELLED', display: 'Reservation cancelled' },

    // --- Líneas de reserva ---
    RES_LINE_CONFIRMED: { code: 'PINV_RES_LINE_CONFIRMED', display: 'Reservation line confirmed' },
    RES_LINE_FULFILLED: { code: 'PINV_RES_LINE_FULFILLED', display: 'Reservation line fulfilled' },
    RES_LINE_RELEASED: { code: 'PINV_RES_LINE_RELEASED', display: 'Reservation line released' },

    // --- Dispensación (medication_dispensations.dispensation_status_concept_id) ---
    DISPENSE_DISPENSED: { code: 'PINV_DISPENSE_DISPENSED', display: 'Dispensation dispensed' },
    DISPENSE_REVERSED: { code: 'PINV_DISPENSE_REVERSED', display: 'Dispensation reversed' },

    // --- Conteo cíclico (inventory_count_sessions) ---
    COUNT_TYPE_CYCLE: { code: 'PINV_COUNT_TYPE_CYCLE', display: 'Cycle count' },
    COUNT_FREEZE_FULL: { code: 'PINV_COUNT_FREEZE_FULL', display: 'Full freeze mode' },
    COUNT_OPEN: { code: 'PINV_COUNT_OPEN', display: 'Count session open' },
    COUNT_FROZEN: { code: 'PINV_COUNT_FROZEN', display: 'Count session frozen' },
    COUNT_COUNTED: { code: 'PINV_COUNT_COUNTED', display: 'Count session counted' },
    COUNT_APPROVED: { code: 'PINV_COUNT_APPROVED', display: 'Count session approved' },
    VARIANCE_REASON_ADJUSTMENT: { code: 'PINV_VARIANCE_REASON_ADJUSTMENT', display: 'Count variance adjustment' },

    // --- Recall / hold (inventory_recall_holds) ---
    RECALL_CLASS_I: { code: 'PINV_RECALL_CLASS_I', display: 'Recall class I' },
    HOLD_ACTIVE: { code: 'PINV_HOLD_ACTIVE', display: 'Recall hold active' },
    HOLD_RELEASED: { code: 'PINV_HOLD_RELEASED', display: 'Recall hold released' },

    // --- Sincronización ERP (pharmacy_inventory_sync_batches / items) ---
    SYNC_DIRECTION_INBOUND: { code: 'PINV_SYNC_DIRECTION_INBOUND', display: 'Inbound sync' },
    BATCH_RECEIVED: { code: 'PINV_BATCH_RECEIVED', display: 'Sync batch received' },
    BATCH_COMPLETED: { code: 'PINV_BATCH_COMPLETED', display: 'Sync batch completed' },
    SYNC_ITEM_PENDING: { code: 'PINV_SYNC_ITEM_PENDING', display: 'Sync item pending' },
    SYNC_ITEM_MATCHED: { code: 'PINV_SYNC_ITEM_MATCHED', display: 'Sync item matched' },
    SYNC_ITEM_DISCREPANCY: { code: 'PINV_SYNC_ITEM_DISCREPANCY', display: 'Sync item discrepancy' },

    // --- Tipos de movimiento del ledger (inventory_ledger_entries.movement_type_concept_id) ---
    MV_RECEIPT: { code: 'PINV_MV_RECEIPT', display: 'Movement receipt' },
    MV_DISPENSE: { code: 'PINV_MV_DISPENSE', display: 'Movement dispense' },
    MV_DISPENSE_REVERSAL: { code: 'PINV_MV_DISPENSE_REVERSAL', display: 'Movement dispense reversal' },
    MV_RESERVE: { code: 'PINV_MV_RESERVE', display: 'Movement reserve' },
    MV_RESERVATION_RELEASE: { code: 'PINV_MV_RESERVATION_RELEASE', display: 'Movement reservation release' },
    MV_COUNT_ADJUSTMENT: { code: 'PINV_MV_COUNT_ADJUSTMENT', display: 'Movement count adjustment' },
    MV_QUARANTINE_HOLD: { code: 'PINV_MV_QUARANTINE_HOLD', display: 'Movement quarantine hold' },
    MV_QUARANTINE_RELEASE: { code: 'PINV_MV_QUARANTINE_RELEASE', display: 'Movement quarantine release' },
    MV_WRITE_OFF: { code: 'PINV_MV_WRITE_OFF', display: 'Movement write-off' },
    MV_TRANSFER_OUT: { code: 'PINV_MV_TRANSFER_OUT', display: 'Movement transfer out' },
    MV_TRANSFER_IN: { code: 'PINV_MV_TRANSFER_IN', display: 'Movement transfer in' },
    MV_SYNC_ADJUSTMENT: { code: 'PINV_MV_SYNC_ADJUSTMENT', display: 'Movement sync adjustment' },

    // --- Moneda por defecto ---
    CURRENCY_USD: { code: 'PINV_CURRENCY_USD', display: 'US Dollar' },
  },
);
