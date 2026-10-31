/**
 * Catálogo de sub-códigos de negocio estables del módulo `billing`.
 *
 * Cada miembro nombra una situación de negocio distinta, independiente del
 * `ErrorCode` HTTP genérico con el que viaja. Un cliente puede ramificar
 * sobre `reason` sin parsear el texto de `message`.
 */
export enum BillingErrorReason {
  // F5e (CONTRATO-F2-F5 §F5e).
  TARIFF_OVERLAP = 'TARIFF_OVERLAP',
  TARIFF_SERVICE_NOT_IN_PRACTICE = 'TARIFF_SERVICE_NOT_IN_PRACTICE',
  TARIFF_UNIT_MINUTES_REQUIRED = 'TARIFF_UNIT_MINUTES_REQUIRED',
  CHARGE_ALREADY_INVOICED = 'CHARGE_ALREADY_INVOICED',
  CHARGE_NOT_PENDING = 'CHARGE_NOT_PENDING',
  /** F5e: el cargo devengado no tiene precio (sin tarifa vigente): no se factura (422). */
  CHARGE_WITHOUT_PRICE = 'CHARGE_WITHOUT_PRICE',

  /** Ya existe un estado de cuenta de paciente para ese periodo. */
  PATIENT_STATEMENT_PERIOD_ALREADY_EXISTS = 'PATIENT_STATEMENT_PERIOD_ALREADY_EXISTS',

  /** La conciliación no indicó ningún pago (recibido o emitido) a conciliar. */
  RECONCILIATION_NO_PAYMENTS_SELECTED = 'RECONCILIATION_NO_PAYMENTS_SELECTED',

  /** El pago recibido referenciado en la conciliación no existe. */
  RECONCILIATION_PAYMENT_RECEIVED_NOT_FOUND = 'RECONCILIATION_PAYMENT_RECEIVED_NOT_FOUND',

  /** El pago recibido ya tenía un documento de conciliación asignado. */
  RECONCILIATION_PAYMENT_RECEIVED_ALREADY_CLEARED = 'RECONCILIATION_PAYMENT_RECEIVED_ALREADY_CLEARED',

  /** El pago emitido referenciado en la conciliación no existe. */
  RECONCILIATION_PAYMENT_MADE_NOT_FOUND = 'RECONCILIATION_PAYMENT_MADE_NOT_FOUND',

  /** El pago emitido ya tenía un documento de conciliación asignado. */
  RECONCILIATION_PAYMENT_MADE_ALREADY_CLEARED = 'RECONCILIATION_PAYMENT_MADE_ALREADY_CLEARED',

  /** El documento a contabilizar en el libro mayor no existe. */
  LEDGER_DOCUMENT_NOT_FOUND = 'LEDGER_DOCUMENT_NOT_FOUND',

  /** El documento ya tiene una transacción de libro mayor asociada. */
  LEDGER_DOCUMENT_ALREADY_POSTED = 'LEDGER_DOCUMENT_ALREADY_POSTED',

  /** El monto del pago a proveedor debe ser positivo. */
  PAYMENT_MADE_AMOUNT_NOT_POSITIVE = 'PAYMENT_MADE_AMOUNT_NOT_POSITIVE',

  /** La suma asignada más retención excede el monto del pago a proveedor. */
  PAYMENT_MADE_ALLOCATION_EXCEEDS_AMOUNT = 'PAYMENT_MADE_ALLOCATION_EXCEEDS_AMOUNT',

  /** La factura de proveedor referenciada por la asignación no existe. */
  PAYMENT_MADE_BILL_NOT_FOUND = 'PAYMENT_MADE_BILL_NOT_FOUND',

  /** La factura de proveedor no tiene saldo pendiente para asignar. */
  PAYMENT_MADE_BILL_NO_BALANCE = 'PAYMENT_MADE_BILL_NO_BALANCE',

  /** La asignación excede el saldo de la factura de proveedor. */
  PAYMENT_MADE_ALLOCATION_EXCEEDS_BILL_BALANCE = 'PAYMENT_MADE_ALLOCATION_EXCEEDS_BILL_BALANCE',

  /** Ya existe un snapshot de KPI calculado para esa marca temporal. */
  KPI_SNAPSHOT_ALREADY_COMPUTED = 'KPI_SNAPSHOT_ALREADY_COMPUTED',

  /** El proveedor de la factura a registrar no existe. */
  BILL_VENDOR_NOT_FOUND = 'BILL_VENDOR_NOT_FOUND',

  /** El proveedor no está activo y no puede recibir facturas. */
  BILL_VENDOR_NOT_ACTIVE = 'BILL_VENDOR_NOT_ACTIVE',

  /** Ya existe una factura con ese número para el proveedor en la práctica. */
  BILL_NUMBER_ALREADY_CAPTURED = 'BILL_NUMBER_ALREADY_CAPTURED',

  /** Línea con orden de compra sin su recepción de bienes (three-way match). */
  BILL_LINE_MISSING_GOODS_RECEIPT = 'BILL_LINE_MISSING_GOODS_RECEIPT',

  /** Ya existe una factura con ese número en la práctica. */
  INVOICE_NUMBER_ALREADY_EXISTS = 'INVOICE_NUMBER_ALREADY_EXISTS',

  /** El encuentro origen de la factura no existe, no es del paciente o es de otro tenant. */
  INVOICE_ENCOUNTER_NOT_FOUND = 'INVOICE_ENCOUNTER_NOT_FOUND',

  /** La orden de compra de la factura de proveedor no existe o es de otro tenant. */
  BILL_PURCHASE_ORDER_NOT_FOUND = 'BILL_PURCHASE_ORDER_NOT_FOUND',

  /** El contrato de la factura de proveedor no existe o es de otro tenant. */
  BILL_CONTRACT_NOT_FOUND = 'BILL_CONTRACT_NOT_FOUND',

  /** La factura original a revertir con nota de crédito no existe. */
  INVOICE_CREDIT_NOTE_ORIGINAL_NOT_FOUND = 'INVOICE_CREDIT_NOTE_ORIGINAL_NOT_FOUND',

  /** El monto de la nota de crédito excede el saldo de la factura original. */
  INVOICE_CREDIT_NOTE_EXCEEDS_BALANCE = 'INVOICE_CREDIT_NOTE_EXCEEDS_BALANCE',

  /** La factura origen de un plan de pagos no existe. */
  INVOICE_PAYMENT_PLAN_SOURCE_NOT_FOUND = 'INVOICE_PAYMENT_PLAN_SOURCE_NOT_FOUND',

  /** La factura origen de un plan de pagos no tiene saldo pendiente. */
  INVOICE_PAYMENT_PLAN_SOURCE_NO_BALANCE = 'INVOICE_PAYMENT_PLAN_SOURCE_NO_BALANCE',

  /** La suma de las cuotas del plan de pagos no iguala el saldo de la factura. */
  INVOICE_PAYMENT_PLAN_INSTALLMENTS_MISMATCH = 'INVOICE_PAYMENT_PLAN_INSTALLMENTS_MISMATCH',

  /** El reclamo ya tiene un reembolso registrado. */
  REIMBURSEMENT_CLAIM_ALREADY_LINKED = 'REIMBURSEMENT_CLAIM_ALREADY_LINKED',

  /** La factura referenciada por el reembolso no existe. */
  REIMBURSEMENT_INVOICE_NOT_FOUND = 'REIMBURSEMENT_INVOICE_NOT_FOUND',

  /** Ya existe un servicio con ese código en el catálogo de la práctica. */
  SERVICE_CATALOG_CODE_ALREADY_EXISTS = 'SERVICE_CATALOG_CODE_ALREADY_EXISTS',

  /** El servicio del catálogo referenciado no existe (actualización). */
  SERVICE_CATALOG_ITEM_NOT_FOUND = 'SERVICE_CATALOG_ITEM_NOT_FOUND',

  /** El precio de un servicio es 0: alta o corrección rechazada con 422 (FAC-06). */
  SERVICE_CATALOG_PRICE_NOT_POSITIVE = 'SERVICE_CATALOG_PRICE_NOT_POSITIVE',

  /** El servicio del catálogo no existe o no es visible para el tenant/práctica del actor. */
  SERVICE_CATALOG_ITEM_NOT_VISIBLE = 'SERVICE_CATALOG_ITEM_NOT_VISIBLE',

  /** El archivo propuesto como imagen del servicio no existe o el actor no puede usarlo (mismo 404 en todos los casos). */
  SERVICE_CATALOG_IMAGE_NOT_USABLE = 'SERVICE_CATALOG_IMAGE_NOT_USABLE',

  /** `expectedRowVersion` no coincide con la versión actual del servicio (409). */
  SERVICE_CATALOG_VERSION_MISMATCH = 'SERVICE_CATALOG_VERSION_MISMATCH',

  /** El monto del pago recibido debe ser positivo. */
  PAYMENT_RECEIVED_AMOUNT_NOT_POSITIVE = 'PAYMENT_RECEIVED_AMOUNT_NOT_POSITIVE',

  /** La suma asignada excede el monto del pago recibido. */
  PAYMENT_RECEIVED_ALLOCATION_EXCEEDS_AMOUNT = 'PAYMENT_RECEIVED_ALLOCATION_EXCEEDS_AMOUNT',

  /** La factura referenciada por la asignación del pago recibido no existe. */
  PAYMENT_RECEIVED_INVOICE_NOT_FOUND = 'PAYMENT_RECEIVED_INVOICE_NOT_FOUND',

  /** La factura no tiene saldo pendiente para asignar el pago recibido. */
  PAYMENT_RECEIVED_INVOICE_NO_BALANCE = 'PAYMENT_RECEIVED_INVOICE_NO_BALANCE',

  /** La asignación excede el saldo de la factura en el pago recibido. */
  PAYMENT_RECEIVED_ALLOCATION_EXCEEDS_INVOICE_BALANCE = 'PAYMENT_RECEIVED_ALLOCATION_EXCEEDS_INVOICE_BALANCE',

  /** Ya existe una corrida de dunning con ese número para el tenant. */
  DUNNING_RUN_NUMBER_ALREADY_EXISTS = 'DUNNING_RUN_NUMBER_ALREADY_EXISTS',

  /**
   * Un servicio con seguro no se factura al paciente por esta vía: se emite
   * desde la solicitud de seguro con la parte calculada por el servidor
   * (carril 16, REQ-16-029).
   */
  INVOICE_LINE_SERVICE_ALREADY_CLAIMED = 'INVOICE_LINE_SERVICE_ALREADY_CLAIMED',

  /**
   * La factura tiene una objeción abierta del paciente: el cobro queda en
   * pausa hasta que se resuelva (carril 16, REQ-16-032).
   */
  PAYMENT_RECEIVED_INVOICE_ON_HOLD = 'PAYMENT_RECEIVED_INVOICE_ON_HOLD',

  /**
   * La práctica indicada no existe o no pertenece al tenant del actor. Ambos
   * casos responden igual para no confirmar que el UUID existe en otra
   * organización.
   */
  BILLING_PRACTICE_NOT_FOUND = 'BILLING_PRACTICE_NOT_FOUND',

  /** Una asignación de cobro no es un importe positivo con a lo sumo dos decimales. */
  PAYMENT_RECEIVED_ALLOCATION_AMOUNT_INVALID = 'PAYMENT_RECEIVED_ALLOCATION_AMOUNT_INVALID',

  /** El descuento de una asignación de cobro no es un importe válido (cero o positivo). */
  PAYMENT_RECEIVED_DISCOUNT_AMOUNT_INVALID = 'PAYMENT_RECEIVED_DISCOUNT_AMOUNT_INVALID',

  /** Una asignación de pago a proveedor no es un importe positivo con a lo sumo dos decimales. */
  PAYMENT_MADE_ALLOCATION_AMOUNT_INVALID = 'PAYMENT_MADE_ALLOCATION_AMOUNT_INVALID',

  /** El descuento de una asignación de pago a proveedor no es un importe válido. */
  PAYMENT_MADE_DISCOUNT_AMOUNT_INVALID = 'PAYMENT_MADE_DISCOUNT_AMOUNT_INVALID',

  /** La retención de una asignación de pago a proveedor no es un importe válido. */
  PAYMENT_MADE_WITHHOLDING_AMOUNT_INVALID = 'PAYMENT_MADE_WITHHOLDING_AMOUNT_INVALID',

  /** Cantidad, precio, descuento o impuesto de una línea de factura no son importes válidos. */
  INVOICE_LINE_AMOUNT_INVALID = 'INVOICE_LINE_AMOUNT_INVALID',

  /** El descuento de una línea de factura supera su base (cantidad por precio). */
  INVOICE_LINE_DISCOUNT_EXCEEDS_BASE = 'INVOICE_LINE_DISCOUNT_EXCEEDS_BASE',

  /** Cantidad, precio o impuesto de una línea de nota de crédito no son importes válidos. */
  CREDIT_NOTE_LINE_AMOUNT_INVALID = 'CREDIT_NOTE_LINE_AMOUNT_INVALID',

  /** Cantidad, precio o impuesto de una línea de factura de proveedor no son importes válidos. */
  BILL_LINE_AMOUNT_INVALID = 'BILL_LINE_AMOUNT_INVALID',

  /** Una cuota del plan de pagos no es un importe positivo. */
  INVOICE_PAYMENT_PLAN_INSTALLMENT_AMOUNT_INVALID = 'INVOICE_PAYMENT_PLAN_INSTALLMENT_AMOUNT_INVALID',

  /** El monto del reembolso debe ser positivo. */
  REIMBURSEMENT_AMOUNT_NOT_POSITIVE = 'REIMBURSEMENT_AMOUNT_NOT_POSITIVE',

  /** La factura de un ítem de morosidad no existe o no es del tenant del actor. */
  DUNNING_INVOICE_NOT_FOUND = 'DUNNING_INVOICE_NOT_FOUND',

  /** `GET /patient-spending/me`: `from` es posterior a `to`. */
  PATIENT_SPENDING_RANGE_INVERTED = 'PATIENT_SPENDING_RANGE_INVERTED',

  /** `GET /patient-spending/me`: el rango pedido supera los tres años. */
  PATIENT_SPENDING_RANGE_TOO_LONG = 'PATIENT_SPENDING_RANGE_TOO_LONG',
}
