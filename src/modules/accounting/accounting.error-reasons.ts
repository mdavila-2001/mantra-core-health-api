/**
 * Catálogo de sub-códigos de negocio (`reason`) para las excepciones de
 * dominio lanzadas por el módulo `accounting`. `code` (en `DomainException`)
 * dice el tipo HTTP genérico del error; `reason` dice cuál, específicamente,
 * dentro de este módulo — para que un cliente pueda ramificar sin parsear
 * `message`.
 */
export enum AccountingErrorReason {
  // --- Calendario fiscal (fiscal.service.ts) ---
  /** Ya existe un ejercicio fiscal con ese código en la práctica. */
  FISCAL_YEAR_ALREADY_EXISTS = 'FISCAL_YEAR_ALREADY_EXISTS',
  FISCAL_PERIOD_NOT_FOUND = 'FISCAL_PERIOD_NOT_FOUND',
  /** El periodo existe pero no está en estado ABIERTO (no admite nuevos asientos). */
  FISCAL_PERIOD_NOT_OPEN = 'FISCAL_PERIOD_NOT_OPEN',

  // --- Pertenencia profesional↔práctica (Carril 18, varios servicios) ---
  /** El actor no tiene `practitionerProfileId` en el JWT. */
  PRACTITIONER_PROFILE_MISSING = 'PRACTITIONER_PROFILE_MISSING',
  /** El profesional no tiene vinculación ACTIVE con la práctica consultada/operada. */
  PRACTITIONER_PRACTICE_NOT_LINKED = 'PRACTITIONER_PRACTICE_NOT_LINKED',
  /** No hay lookup de vinculación disponible: se deniega por no poder verificar. */
  PRACTITIONER_LINK_VERIFICATION_UNAVAILABLE = 'PRACTITIONER_LINK_VERIFICATION_UNAVAILABLE',

  // --- Auto-servicio contable del profesional (practitioner-accounting.service.ts) ---
  INVOICE_NOT_FOUND = 'INVOICE_NOT_FOUND',
  /** La factura no pertenece a la práctica indicada. */
  INVOICE_PRACTICE_MISMATCH = 'INVOICE_PRACTICE_MISMATCH',
  /** La factura todavía no está en estado PAID. */
  INVOICE_NOT_PAID = 'INVOICE_NOT_PAID',
  /** La factura ya tiene un asiento contable asociado (`transactionId`). */
  INVOICE_ALREADY_POSTED = 'INVOICE_ALREADY_POSTED',
  /** La factura no está ligada a un encuentro clínico, no se puede confirmar al profesional. */
  INVOICE_NOT_LINKED_TO_ENCOUNTER = 'INVOICE_NOT_LINKED_TO_ENCOUNTER',
  /** La consulta de la factura no pertenece a este profesional. */
  INVOICE_CONSULTATION_NOT_OWNED = 'INVOICE_CONSULTATION_NOT_OWNED',
  /** La factura no registra un importe pagado (`paidTotal`). */
  INVOICE_PAID_AMOUNT_MISSING = 'INVOICE_PAID_AMOUNT_MISSING',

  // --- Subledgers / AR-AP (subledger.service.ts) ---
  SUBLEDGER_ACCOUNT_NOT_FOUND = 'SUBLEDGER_ACCOUNT_NOT_FOUND',
  OPEN_ITEM_NOT_FOUND = 'OPEN_ITEM_NOT_FOUND',
  OPEN_ITEM_ALREADY_CLEARED = 'OPEN_ITEM_ALREADY_CLEARED',
  /** El importe compensado es <= 0 o excede el saldo pendiente de la partida. */
  OPEN_ITEM_INVALID_CLEARED_AMOUNT = 'OPEN_ITEM_INVALID_CLEARED_AMOUNT',
  /** Las partidas incluidas en el clearing no comparten el mismo subledger. */
  OPEN_ITEM_SUBLEDGER_MISMATCH = 'OPEN_ITEM_SUBLEDGER_MISMATCH',
  CLEARING_NUMBER_ALREADY_EXISTS = 'CLEARING_NUMBER_ALREADY_EXISTS',

  // --- Posteo balanceado (posting.helper.ts, ledger.service.ts) ---
  /** La suma de débitos no iguala la de créditos del asiento. */
  JOURNAL_ENTRY_UNBALANCED = 'JOURNAL_ENTRY_UNBALANCED',
  /** El asiento no tiene ninguna línea con importe (debit <= 0). */
  JOURNAL_ENTRY_EMPTY_AMOUNT = 'JOURNAL_ENTRY_EMPTY_AMOUNT',

  // --- Libro mayor / asientos (ledger.service.ts, ledger-read.service.ts) ---
  JOURNAL_TRANSACTION_NUMBER_ALREADY_EXISTS = 'JOURNAL_TRANSACTION_NUMBER_ALREADY_EXISTS',
  LEDGER_TRANSACTION_NOT_FOUND = 'LEDGER_TRANSACTION_NOT_FOUND',
  LEDGER_TRANSACTION_ALREADY_REVERSED = 'LEDGER_TRANSACTION_ALREADY_REVERSED',
  /** No hay regla de determinación de cuentas vigente para el escenario pedido. */
  POSTING_RULE_NOT_FOUND = 'POSTING_RULE_NOT_FOUND',
  ACCOUNT_CODE_ALREADY_EXISTS = 'ACCOUNT_CODE_ALREADY_EXISTS',
  /** La transición de estado pedida no está permitida desde el estado actual. */
  JOURNAL_INVALID_STATE_TRANSITION = 'JOURNAL_INVALID_STATE_TRANSITION',
  /** El actor no porta ningún rol con autoridad para aprobar el asiento. */
  APPROVAL_ROLE_REQUIRED = 'APPROVAL_ROLE_REQUIRED',

  // --- Lectura del mayor (ledger-read.service.ts) ---
  PRACTICE_NOT_FOUND = 'PRACTICE_NOT_FOUND',
  ACCOUNT_NOT_FOUND_IN_PRACTICE = 'ACCOUNT_NOT_FOUND_IN_PRACTICE',

  // --- Pasivos (liability.service.ts) ---
  /** principal + interés declarados no igualan el importe total del pago. */
  LIABILITY_PAYMENT_COMPONENTS_MISMATCH = 'LIABILITY_PAYMENT_COMPONENTS_MISMATCH',
  LIABILITY_PAYMENT_AMOUNT_NOT_POSITIVE = 'LIABILITY_PAYMENT_AMOUNT_NOT_POSITIVE',
  LIABILITY_NOT_FOUND = 'LIABILITY_NOT_FOUND',
  /** El pasivo existe pero no está en estado ACTIVO (ya liquidado u otro). */
  LIABILITY_NOT_ACTIVE = 'LIABILITY_NOT_ACTIVE',
  LIABILITY_ACCOUNT_MISSING = 'LIABILITY_ACCOUNT_MISSING',
  LIABILITY_SCHEDULE_NOT_FOUND = 'LIABILITY_SCHEDULE_NOT_FOUND',

  // --- Devengos (accrual.service.ts) ---
  /** La suma del cronograma de devengo no iguala el importe total declarado. */
  ACCRUAL_SCHEDULE_TOTAL_MISMATCH = 'ACCRUAL_SCHEDULE_TOTAL_MISMATCH',
  ACCRUAL_OBJECT_NUMBER_ALREADY_EXISTS = 'ACCRUAL_OBJECT_NUMBER_ALREADY_EXISTS',
  ACCRUAL_OBJECT_NOT_FOUND = 'ACCRUAL_OBJECT_NOT_FOUND',
  /** El objeto de devengo no tiene configuradas las cuentas de gasto/devengo. */
  ACCRUAL_OBJECT_ACCOUNTS_MISSING = 'ACCRUAL_OBJECT_ACCOUNTS_MISSING',
  /** No hay líneas de cronograma en estado PENDING para el periodo pedido. */
  ACCRUAL_NO_PENDING_LINES_IN_PERIOD = 'ACCRUAL_NO_PENDING_LINES_IN_PERIOD',

  // --- Activos fijos (asset.service.ts) ---
  ASSET_CODE_ALREADY_EXISTS = 'ASSET_CODE_ALREADY_EXISTS',
  /** Ningún activo activo tiene un importe pendiente de depreciar en el periodo. */
  DEPRECIATION_NO_ELIGIBLE_ASSETS = 'DEPRECIATION_NO_ELIGIBLE_ASSETS',
}
