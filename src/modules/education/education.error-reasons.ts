/**
 * Sub-códigos de negocio estables para los errores de dominio de `education`.
 *
 * Van como tercer argumento de `DomainException` (y subclases): el `code`
 * dice la forma HTTP del error y `reason` cuál de las situaciones ocurrió.
 */
export enum EducationErrorReason {
  /**
   * El recurso (curso, cohorte, evaluación, inscripción, intento, lección o
   * certificado) no existe, pertenece a otro tenant o es de otro aprendiz. Se
   * responde igual en todos los casos para no confirmar que un UUID existe en
   * otra organización ni en la cuenta de otra persona.
   */
  EDUCATION_RESOURCE_OUT_OF_SCOPE = 'EDUCATION_RESOURCE_OUT_OF_SCOPE',
  /**
   * Un actor `LEARNER` intentó inscribir a otra persona. Un aprendiz solo se
   * inscribe a sí mismo; inscribir a terceros es una vía administrativa.
   */
  LEARNER_ENROLLMENT_OWNER_REQUIRED = 'LEARNER_ENROLLMENT_OWNER_REQUIRED',
  /** El intento de pago de una inscripción comprada no está confirmado (`PI_SUCCEEDED`). */
  ENROLLMENT_PAYMENT_NOT_CONFIRMED = 'ENROLLMENT_PAYMENT_NOT_CONFIRMED',
  /** Un aprendiz no puede inscribirse con una fuente administrativa (`ASSIGNED`, `PARTNER`). */
  ENROLLMENT_SOURCE_NOT_ALLOWED = 'ENROLLMENT_SOURCE_NOT_ALLOWED',
  /** El curso es de pago: el aprendiz sólo se inscribe con una compra confirmada. */
  ENROLLMENT_PAYMENT_REQUIRED = 'ENROLLMENT_PAYMENT_REQUIRED',
  /** Se envió un intento de pago en una inscripción que no es `PURCHASED`. */
  ENROLLMENT_PAYMENT_NOT_APPLICABLE = 'ENROLLMENT_PAYMENT_NOT_APPLICABLE',
  /**
   * El intento de pago no corresponde a esta compra: es de otro curso o de otro
   * recurso, lo creó otra persona, o su monto o moneda no cubren el precio.
   * Un único motivo para los cuatro casos: no es un oráculo de qué falló.
   */
  ENROLLMENT_PAYMENT_MISMATCH = 'ENROLLMENT_PAYMENT_MISMATCH',
  /**
   * El curso tiene precio pero no moneda: no hay con qué comparar el pago y la
   * compra se rechaza (falla cerrada); nunca se comparan montos de monedas
   * distintas.
   */
  COURSE_PRICE_WITHOUT_CURRENCY = 'COURSE_PRICE_WITHOUT_CURRENCY',
  /** El intento de pago ya respalda otra inscripción. */
  ENROLLMENT_PAYMENT_ALREADY_USED = 'ENROLLMENT_PAYMENT_ALREADY_USED',
}
