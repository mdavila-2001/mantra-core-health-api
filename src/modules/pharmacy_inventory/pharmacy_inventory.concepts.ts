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
export const { seeds: PHARMACY_INVENTORY_CONCEPT_SEEDS, ids: PINV } =
  defineModuleConcepts('pharmacy_inventory', {
    // --- Proveedores (pharmacy_suppliers.status_concept_id) ---
    SUPPLIER_ACTIVE: {
      code: 'PINV_SUPPLIER_ACTIVE',
      display: 'Supplier active',
    },
    SUPPLIER_INACTIVE: {
      code: 'PINV_SUPPLIER_INACTIVE',
      display: 'Supplier inactive',
    },
    PAYMENT_TERMS_NET30: {
      code: 'PINV_PAYMENT_TERMS_NET30',
      display: 'Net 30 payment terms',
    },

    // --- Ubicaciones de inventario (inventory_locations) ---
    LOCATION_ACTIVE: {
      code: 'PINV_LOCATION_ACTIVE',
      display: 'Inventory location active',
    },
    LOCATION_TYPE_SHELF: {
      code: 'PINV_LOCATION_TYPE_SHELF',
      display: 'Shelf location',
    },
    TEMPERATURE_ZONE_AMBIENT: {
      code: 'PINV_TEMP_ZONE_AMBIENT',
      display: 'Ambient temperature zone',
    },

    // --- Órdenes de compra (pharmacy_purchase_orders.status_concept_id) ---
    PO_DRAFT: { code: 'PINV_PO_DRAFT', display: 'Purchase order draft' },
    PO_ORDERED: { code: 'PINV_PO_ORDERED', display: 'Purchase order ordered' },
    PO_PARTIAL: {
      code: 'PINV_PO_PARTIAL',
      display: 'Purchase order partially received',
    },
    PO_RECEIVED: {
      code: 'PINV_PO_RECEIVED',
      display: 'Purchase order received',
    },

    // --- Líneas de orden de compra ---
    PO_LINE_ORDERED: {
      code: 'PINV_PO_LINE_ORDERED',
      display: 'PO line ordered',
    },
    PO_LINE_PARTIAL: {
      code: 'PINV_PO_LINE_PARTIAL',
      display: 'PO line partially received',
    },
    PO_LINE_RECEIVED: {
      code: 'PINV_PO_LINE_RECEIVED',
      display: 'PO line received',
    },

    // --- Recepción de mercancía (pharmacy_goods_receipts.status_concept_id) ---
    RECEIPT_POSTED: {
      code: 'PINV_RECEIPT_POSTED',
      display: 'Goods receipt posted',
    },

    // --- Lotes (inventory_lots) ---
    LOT_ACTIVE: { code: 'PINV_LOT_ACTIVE', display: 'Inventory lot active' },
    LOT_QUARANTINED: {
      code: 'PINV_LOT_QUARANTINED',
      display: 'Lot quarantined',
    },
    LOT_QUARANTINE_RELEASED: {
      code: 'PINV_LOT_QUARANTINE_RELEASED',
      display: 'Lot quarantine released',
    },
    LOT_RECALLED: { code: 'PINV_LOT_RECALLED', display: 'Lot recalled' },
    LOT_RECALL_CLEARED: {
      code: 'PINV_LOT_RECALL_CLEARED',
      display: 'Lot recall cleared',
    },

    // --- Seriales (inventory_serials.status_concept_id) ---
    SERIAL_AVAILABLE: {
      code: 'PINV_SERIAL_AVAILABLE',
      display: 'Serial available',
    },
    SERIAL_DISPENSED: {
      code: 'PINV_SERIAL_DISPENSED',
      display: 'Serial dispensed',
    },

    // --- Reservas (inventory_reservations.reservation_status_concept_id) ---
    RESERVATION_CONFIRMED: {
      code: 'PINV_RESERVATION_CONFIRMED',
      display: 'Reservation confirmed',
    },
    RESERVATION_FULFILLED: {
      code: 'PINV_RESERVATION_FULFILLED',
      display: 'Reservation fulfilled',
    },
    RESERVATION_EXPIRED: {
      code: 'PINV_RESERVATION_EXPIRED',
      display: 'Reservation expired',
    },
    RESERVATION_CANCELLED: {
      code: 'PINV_RESERVATION_CANCELLED',
      display: 'Reservation cancelled',
    },

    // --- Líneas de reserva ---
    RES_LINE_CONFIRMED: {
      code: 'PINV_RES_LINE_CONFIRMED',
      display: 'Reservation line confirmed',
    },
    RES_LINE_FULFILLED: {
      code: 'PINV_RES_LINE_FULFILLED',
      display: 'Reservation line fulfilled',
    },
    RES_LINE_RELEASED: {
      code: 'PINV_RES_LINE_RELEASED',
      display: 'Reservation line released',
    },
    // Línea de pedido de paciente sin stock al crear: se registra con
    // reserved_quantity = 0 y NO tumba el pedido (FAR-E1, reserva parcial).
    RES_LINE_OUT_OF_STOCK: {
      code: 'PINV_RES_LINE_OUT_OF_STOCK',
      display: 'Reservation line out of stock',
    },

    // --- Pedidos de paciente (FAR-E1) ---
    // El pedido se materializa sobre `inventory_reservations`; lo que lo
    // distingue de una reserva de mostrador es su `reservation_status_concept_id`:
    // una fila con estado `PINV_ORDER_*` ES un pedido de paciente. El value set
    // completo son los 10 estados acordados con FAR-I2; el carril E1 solo
    // ejecuta creación (`ENVIADO`), cancelación (`CANCELADO`) y vencimiento
    // (`VENCIDO`) — los demás los transicionan E2/E3, pero se acuñan todos
    // para que la máquina de estados sea un dato completo desde el día uno.
    ORDER_ENVIADO: {
      code: 'PINV_ORDER_ENVIADO',
      display: 'Order submitted',
    },
    ORDER_EN_REVISION: {
      code: 'PINV_ORDER_EN_REVISION',
      display: 'Order under review',
    },
    ORDER_CONFIRMADO: {
      code: 'PINV_ORDER_CONFIRMADO',
      display: 'Order confirmed',
    },
    ORDER_ACEPTACION_PENDIENTE: {
      code: 'PINV_ORDER_ACEPTACION_PENDIENTE',
      display: 'Order awaiting patient acceptance',
    },
    ORDER_ACEPTADO: {
      code: 'PINV_ORDER_ACEPTADO',
      display: 'Order accepted by patient',
    },
    ORDER_LISTO_PARA_RETIRO: {
      code: 'PINV_ORDER_LISTO_PARA_RETIRO',
      display: 'Order ready for pickup',
    },
    ORDER_RETIRADO: {
      code: 'PINV_ORDER_RETIRADO',
      display: 'Order picked up',
    },
    ORDER_RECHAZADO: {
      code: 'PINV_ORDER_RECHAZADO',
      display: 'Order rejected',
    },
    ORDER_VENCIDO: {
      code: 'PINV_ORDER_VENCIDO',
      display: 'Order expired',
    },
    ORDER_CANCELADO: {
      code: 'PINV_ORDER_CANCELADO',
      display: 'Order cancelled',
    },

    // --- Modalidad de entrega (v4.2.1) ---
    // `inventory_reservations.delivery_mode_concept_id`: cómo llega el pedido a la
    // persona. Los dos envíos sólo son elegibles si tiene esa dirección cargada
    // (`delivery_address_id`), y el courier real es FAR-E4: hasta entonces la farmacia
    // coordina la entrega a mano.
    //
    // La columna es nullable porque la tabla la comparten las reservas de mostrador,
    // que no tienen modalidad; que todo pedido de paciente la lleve —y que la sede
    // pueda con ella (`pharmacy_sites.pickup_available`/`home_delivery_available`)— lo
    // hace cumplir el servicio, no el esquema.
    DELIVERY_RETIRO: {
      code: 'PINV_DELIVERY_RETIRO',
      display: 'Pickup at pharmacy site',
    },
    DELIVERY_DOMICILIO: {
      code: 'PINV_DELIVERY_DOMICILIO',
      display: 'Delivery to home address',
    },
    DELIVERY_TRABAJO: {
      code: 'PINV_DELIVERY_TRABAJO',
      display: 'Delivery to work address',
    },

    // --- Propuestas de sustitución (v4.2.1) ---
    // `pharmacy_order_substitutions.status_concept_id`. La farmacia propone el genérico
    // al revisar el pedido y la decisión es SIEMPRE del paciente. Es estado de la
    // PROPUESTA, no del pedido: el pedido entero está `ACEPTACION_PENDIENTE` mientras
    // quede una sin decidir, pero cada una se resuelve por separado.
    //
    // Aceptar mueve el pedido a `ACEPTADO` y aplica el genérico a la línea; preferir el
    // original lo devuelve a `CONFIRMADO` —la farmacia ya lo había revisado—, y en los
    // dos casos la fila SOBREVIVE como historia: la tabla es una bitácora de propuestas,
    // no un campo mutable, y por eso no hay único por línea.
    //
    // Se acuña el conjunto completo de una, como los diez `ORDER_*`: la máquina de
    // estados es un dato completo desde el día uno aunque el carril no la recorra entera.
    SUBSTITUTION_PROPUESTA: {
      code: 'PINV_SUBSTITUTION_PROPUESTA',
      display: 'Substitution proposed',
    },
    SUBSTITUTION_ACEPTADA: {
      code: 'PINV_SUBSTITUTION_ACEPTADA',
      display: 'Substitution accepted by patient',
    },
    SUBSTITUTION_RECHAZADA: {
      code: 'PINV_SUBSTITUTION_RECHAZADA',
      display: 'Substitution rejected, original kept',
    },
    // El pedido murió —venció o se canceló— con la propuesta todavía en pie. Sin este
    // estado quedaría `PROPUESTA` para siempre sobre un pedido que ya no existe.
    SUBSTITUTION_RETIRADA: {
      code: 'PINV_SUBSTITUTION_RETIRADA',
      display: 'Substitution withdrawn, order no longer live',
    },

    // --- Dispensación (medication_dispensations.dispensation_status_concept_id) ---
    DISPENSE_DISPENSED: {
      code: 'PINV_DISPENSE_DISPENSED',
      display: 'Dispensation dispensed',
    },
    DISPENSE_REVERSED: {
      code: 'PINV_DISPENSE_REVERSED',
      display: 'Dispensation reversed',
    },

    // --- Conteo cíclico (inventory_count_sessions) ---
    COUNT_TYPE_CYCLE: { code: 'PINV_COUNT_TYPE_CYCLE', display: 'Cycle count' },
    COUNT_FREEZE_FULL: {
      code: 'PINV_COUNT_FREEZE_FULL',
      display: 'Full freeze mode',
    },
    COUNT_OPEN: { code: 'PINV_COUNT_OPEN', display: 'Count session open' },
    COUNT_FROZEN: {
      code: 'PINV_COUNT_FROZEN',
      display: 'Count session frozen',
    },
    COUNT_COUNTED: {
      code: 'PINV_COUNT_COUNTED',
      display: 'Count session counted',
    },
    COUNT_APPROVED: {
      code: 'PINV_COUNT_APPROVED',
      display: 'Count session approved',
    },
    VARIANCE_REASON_ADJUSTMENT: {
      code: 'PINV_VARIANCE_REASON_ADJUSTMENT',
      display: 'Count variance adjustment',
    },

    // --- Recall / hold (inventory_recall_holds) ---
    RECALL_CLASS_I: { code: 'PINV_RECALL_CLASS_I', display: 'Recall class I' },
    HOLD_ACTIVE: { code: 'PINV_HOLD_ACTIVE', display: 'Recall hold active' },
    HOLD_RELEASED: {
      code: 'PINV_HOLD_RELEASED',
      display: 'Recall hold released',
    },

    // --- Sincronización ERP (pharmacy_inventory_sync_batches / items) ---
    SYNC_DIRECTION_INBOUND: {
      code: 'PINV_SYNC_DIRECTION_INBOUND',
      display: 'Inbound sync',
    },
    BATCH_RECEIVED: {
      code: 'PINV_BATCH_RECEIVED',
      display: 'Sync batch received',
    },
    BATCH_COMPLETED: {
      code: 'PINV_BATCH_COMPLETED',
      display: 'Sync batch completed',
    },
    SYNC_ITEM_PENDING: {
      code: 'PINV_SYNC_ITEM_PENDING',
      display: 'Sync item pending',
    },
    SYNC_ITEM_MATCHED: {
      code: 'PINV_SYNC_ITEM_MATCHED',
      display: 'Sync item matched',
    },
    SYNC_ITEM_DISCREPANCY: {
      code: 'PINV_SYNC_ITEM_DISCREPANCY',
      display: 'Sync item discrepancy',
    },

    // --- Tipos de movimiento del ledger (inventory_ledger_entries.movement_type_concept_id) ---
    MV_RECEIPT: { code: 'PINV_MV_RECEIPT', display: 'Movement receipt' },
    MV_DISPENSE: { code: 'PINV_MV_DISPENSE', display: 'Movement dispense' },
    MV_DISPENSE_REVERSAL: {
      code: 'PINV_MV_DISPENSE_REVERSAL',
      display: 'Movement dispense reversal',
    },
    MV_RESERVE: { code: 'PINV_MV_RESERVE', display: 'Movement reserve' },
    MV_RESERVATION_RELEASE: {
      code: 'PINV_MV_RESERVATION_RELEASE',
      display: 'Movement reservation release',
    },
    MV_COUNT_ADJUSTMENT: {
      code: 'PINV_MV_COUNT_ADJUSTMENT',
      display: 'Movement count adjustment',
    },
    MV_QUARANTINE_HOLD: {
      code: 'PINV_MV_QUARANTINE_HOLD',
      display: 'Movement quarantine hold',
    },
    MV_QUARANTINE_RELEASE: {
      code: 'PINV_MV_QUARANTINE_RELEASE',
      display: 'Movement quarantine release',
    },
    MV_WRITE_OFF: { code: 'PINV_MV_WRITE_OFF', display: 'Movement write-off' },
    MV_TRANSFER_OUT: {
      code: 'PINV_MV_TRANSFER_OUT',
      display: 'Movement transfer out',
    },
    MV_TRANSFER_IN: {
      code: 'PINV_MV_TRANSFER_IN',
      display: 'Movement transfer in',
    },
    MV_SYNC_ADJUSTMENT: {
      code: 'PINV_MV_SYNC_ADJUSTMENT',
      display: 'Movement sync adjustment',
    },

    // --- Moneda por defecto ---
    CURRENCY_USD: { code: 'PINV_CURRENCY_USD', display: 'US Dollar' },
  });
