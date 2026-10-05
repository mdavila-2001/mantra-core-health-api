/**
 * Catálogo de sub-códigos de negocio estables para el módulo `payments`.
 *
 * `DomainException` y sus subclases llevan un `code` genérico HTTP-level
 * (CONFLICT, NOT_FOUND, etc.) compartido por todo el API; `reason` dice
 * **cuál** error de ese tipo fue, dentro de este catálogo propio del módulo.
 * Un cliente puede ramificar sobre `reason` sin parsear `message`.
 */
export enum PaymentsErrorReason {
  /** La tarifa porcentual no trae `percentage`. */
  FEE_SCHEDULE_MISSING_PERCENTAGE = 'FEE_SCHEDULE_MISSING_PERCENTAGE',
  /** La tarifa fija no trae `fixedAmount`. */
  FEE_SCHEDULE_MISSING_FIXED_AMOUNT = 'FEE_SCHEDULE_MISSING_FIXED_AMOUNT',
  /** El importe neto calculado del payout no es positivo. */
  PAYOUT_NET_AMOUNT_NOT_POSITIVE = 'PAYOUT_NET_AMOUNT_NOT_POSITIVE',

  /** No existe la intención de pago referenciada. */
  PAYMENT_INTENT_NOT_FOUND = 'PAYMENT_INTENT_NOT_FOUND',
  /** La intención de pago ya fue cobrada (succeeded). */
  PAYMENT_INTENT_ALREADY_SUCCEEDED = 'PAYMENT_INTENT_ALREADY_SUCCEEDED',
  /** La intención de pago está cancelada. */
  PAYMENT_INTENT_CANCELED = 'PAYMENT_INTENT_CANCELED',
  /** La intención requiere una evaluación de riesgo antes de cobrar. */
  PAYMENT_INTENT_RISK_ASSESSMENT_MISSING = 'PAYMENT_INTENT_RISK_ASSESSMENT_MISSING',
  /** El motor de riesgo rechazó la intención. */
  PAYMENT_INTENT_RISK_DECLINED = 'PAYMENT_INTENT_RISK_DECLINED',
  /** El bloqueo de cambio exige monedas de origen y destino distintas. */
  FX_LOCK_SAME_CURRENCY = 'FX_LOCK_SAME_CURRENCY',
  /** Solo se puede bloquear el cambio de una intención pendiente. */
  FX_LOCK_INTENT_NOT_PENDING = 'FX_LOCK_INTENT_NOT_PENDING',
  /** La intención ya tiene un bloqueo de cambio vigente. */
  FX_LOCK_ALREADY_ACTIVE = 'FX_LOCK_ALREADY_ACTIVE',
  /** El reparto por importe no trae `amount`. */
  SPLIT_MISSING_AMOUNT = 'SPLIT_MISSING_AMOUNT',
  /** El reparto por porcentaje no trae `percentage`. */
  SPLIT_MISSING_PERCENTAGE = 'SPLIT_MISSING_PERCENTAGE',
  /** La suma de los repartos excede el importe de la intención. */
  SPLIT_EXCEEDS_INTENT_AMOUNT = 'SPLIT_EXCEEDS_INTENT_AMOUNT',

  /** No existe la deuda referenciada. */
  PAYMENT_DEBT_NOT_FOUND = 'PAYMENT_DEBT_NOT_FOUND',
  /** La deuda ya tiene un checkout abierto. */
  PAYMENT_DEBT_CHECKOUT_ALREADY_OPEN = 'PAYMENT_DEBT_CHECKOUT_ALREADY_OPEN',
  /** La deuda ya está saldada. */
  PAYMENT_DEBT_ALREADY_SETTLED = 'PAYMENT_DEBT_ALREADY_SETTLED',

  /** No existe la transacción de pago referenciada por la operación del gateway. */
  PAYMENT_TRANSACTION_NOT_FOUND = 'PAYMENT_TRANSACTION_NOT_FOUND',
  /** No existe transacción para la referencia de gateway informada en el callback. */
  GATEWAY_TRANSACTION_REF_NOT_FOUND = 'GATEWAY_TRANSACTION_REF_NOT_FOUND',
  /** La firma del webhook del gateway no es válida. */
  GATEWAY_WEBHOOK_SIGNATURE_INVALID = 'GATEWAY_WEBHOOK_SIGNATURE_INVALID',
  /** Solo se puede reembolsar una transacción capturada o liquidada. */
  REFUND_TRANSACTION_NOT_CAPTURED = 'REFUND_TRANSACTION_NOT_CAPTURED',
  /** El reembolso solicitado excede el importe capturado. */
  REFUND_EXCEEDS_CAPTURED_AMOUNT = 'REFUND_EXCEEDS_CAPTURED_AMOUNT',
  /** La transacción está liquidada; corresponde un reembolso en vez de una anulación. */
  CANCELLATION_TRANSACTION_ALREADY_SETTLED = 'CANCELLATION_TRANSACTION_ALREADY_SETTLED',
}
