/**
 * Catálogo de sub-códigos de negocio estables del módulo `billing`.
 *
 * Cada miembro nombra una situación de negocio distinta, independiente del
 * `ErrorCode` HTTP genérico con el que viaja. Un cliente puede ramificar
 * sobre `reason` sin parsear el texto de `message`.
 */
export enum BillingErrorReason {
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

  /** El servicio del catálogo no existe o no es visible para el tenant/práctica del actor. */
  SERVICE_CATALOG_ITEM_NOT_VISIBLE = 'SERVICE_CATALOG_ITEM_NOT_VISIBLE',

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
}
