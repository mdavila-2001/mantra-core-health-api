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

  /** El reparto debe ser un importe estrictamente positivo. */
  SPLIT_AMOUNT_NOT_POSITIVE = 'SPLIT_AMOUNT_NOT_POSITIVE',
  /** El `tenantId` del cuerpo no coincide con el tenant activo de la petición. */
  PAYMENTS_TENANT_MISMATCH = 'PAYMENTS_TENANT_MISMATCH',
  /** El callback llegó por una ruta que no es un endpoint activo de la conexión de la transacción. */
  GATEWAY_CALLBACK_ENDPOINT_NOT_ALLOWED = 'GATEWAY_CALLBACK_ENDPOINT_NOT_ALLOWED',
  /** El callback no viene de una red permitida para el endpoint. */
  GATEWAY_CALLBACK_SOURCE_NOT_ALLOWED = 'GATEWAY_CALLBACK_SOURCE_NOT_ALLOWED',
  /** El callback no trae `timestamp` firmado o está fuera de la ventana de repetición del endpoint. */
  GATEWAY_CALLBACK_OUTSIDE_REPLAY_WINDOW = 'GATEWAY_CALLBACK_OUTSIDE_REPLAY_WINDOW',

  /** La intención se cobra por la pasarela: no admite una operación directa contra el proveedor. */
  PAYMENT_INTENT_VIA_GATEWAY = 'PAYMENT_INTENT_VIA_GATEWAY',
  /** La intención está en proceso por el camino de siempre y no tiene un cobro en la pasarela: no se despacha otro. */
  PAYMENT_INTENT_ALREADY_PROCESSING = 'PAYMENT_INTENT_ALREADY_PROCESSING',
  /** La última evaluación de riesgo pide revisión humana: con la pasarela activa no se cobra hasta que se resuelva. */
  PAYMENT_INTENT_RISK_REVIEW_PENDING = 'PAYMENT_INTENT_RISK_REVIEW_PENDING',
  /** La pasarela sólo cobra con la operación SALE (autoriza y captura en un paso). */
  PAYMENT_GATEWAY_OPERATION_NOT_SUPPORTED = 'PAYMENT_GATEWAY_OPERATION_NOT_SUPPORTED',
  /** La pasarela cobra el importe completo de la intención; no admite un importe parcial. */
  PAYMENT_GATEWAY_AMOUNT_MUST_MATCH_INTENT = 'PAYMENT_GATEWAY_AMOUNT_MUST_MATCH_INTENT',
  /** La pasarela sólo opera en bolivianos (D-06); la moneda de la intención no se puede enviar. */
  PAYMENT_GATEWAY_CURRENCY_NOT_SUPPORTED = 'PAYMENT_GATEWAY_CURRENCY_NOT_SUPPORTED',
  /** Con la pasarela activa, la intención exige `paymentMethodType`. */
  PAYMENT_GATEWAY_METHOD_REQUIRED = 'PAYMENT_GATEWAY_METHOD_REQUIRED',
  /** El importe no se expresa en unidades menores enteras (más decimales que la moneda o fuera de rango). */
  PAYMENT_GATEWAY_AMOUNT_NOT_REPRESENTABLE = 'PAYMENT_GATEWAY_AMOUNT_NOT_REPRESENTABLE',
  /** La vida pedida para la intención queda fuera de lo que admite la pasarela (60 s a 24 h). */
  PAYMENT_GATEWAY_EXPIRY_OUT_OF_RANGE = 'PAYMENT_GATEWAY_EXPIRY_OUT_OF_RANGE',
  /** La pasarela rechazó la creación del cobro con una respuesta definitiva del contrato. */
  PAYMENT_GATEWAY_REJECTED = 'PAYMENT_GATEWAY_REJECTED',
  /** No se sabe si la pasarela creó el cobro: reintentar con la misma `idempotencyKey`. */
  PAYMENT_GATEWAY_RESULT_AMBIGUOUS = 'PAYMENT_GATEWAY_RESULT_AMBIGUOUS',
  /** La pasarela no está disponible o no acepta las credenciales de la API. */
  PAYMENT_GATEWAY_UNAVAILABLE = 'PAYMENT_GATEWAY_UNAVAILABLE',
  /** La respuesta de la pasarela no coincide con lo pedido (importe distinto): no se asocia al cobro. */
  PAYMENT_GATEWAY_RESPONSE_MISMATCH = 'PAYMENT_GATEWAY_RESPONSE_MISMATCH',
  /** La deuda de la intención ya tiene otro cobro en vuelo en la pasarela: no se abre un segundo. */
  PAYMENT_GATEWAY_DEBT_HAS_OPEN_CHARGE = 'PAYMENT_GATEWAY_DEBT_HAS_OPEN_CHARGE',
  /** El importe de la intención excede el saldo pendiente de la deuda que cobra. */
  PAYMENT_GATEWAY_AMOUNT_EXCEEDS_DEBT = 'PAYMENT_GATEWAY_AMOUNT_EXCEEDS_DEBT',
  /** Los webhooks de la pasarela están desactivados (`payments.via_gateway` apagado). */
  GATEWAY_WEBHOOKS_DISABLED = 'GATEWAY_WEBHOOKS_DISABLED',
  /** El webhook no trae el cuerpo crudo necesario para verificar la firma. */
  GATEWAY_WEBHOOK_RAW_BODY_MISSING = 'GATEWAY_WEBHOOK_RAW_BODY_MISSING',
  /** El webhook es de otro modo (`test`/`live`) que la clave configurada. */
  GATEWAY_WEBHOOK_MODE_MISMATCH = 'GATEWAY_WEBHOOK_MODE_MISMATCH',
  /** El cuerpo del webhook no tiene la forma del contrato. */
  GATEWAY_WEBHOOK_MALFORMED = 'GATEWAY_WEBHOOK_MALFORMED',
  /** Más de una intención (de uno o varios tenants) tiene la misma referencia `pi_…`: no se aplica a ninguna. */
  GATEWAY_WEBHOOK_INTENT_REF_AMBIGUOUS = 'GATEWAY_WEBHOOK_INTENT_REF_AMBIGUOUS',
}
