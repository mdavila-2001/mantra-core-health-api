/**
 * Catálogo de sub-códigos de negocio del módulo `chart`.
 *
 * Cada miembro nombra una situación de negocio distinta dentro del `code`
 * genérico (NOT_FOUND, PRECONDITION_FAILED…) que ya fija el `DomainException`.
 * Un cliente puede ramificar sobre `reason` sin parsear `message`.
 */
export enum ChartErrorReason {
  /**
   * El encuentro referenciado no existe, no es del paciente del expediente o
   * no es del tenant del actor. Los tres casos responden idéntico para no
   * confirmar que el UUID existe en otra historia u otra organización.
   */
  CHART_ENCOUNTER_OUT_OF_SCOPE = 'CHART_ENCOUNTER_OUT_OF_SCOPE',

  /** El encuentro ya está cerrado y sellado: no admite más escrituras. */
  CHART_ENCOUNTER_SEALED = 'CHART_ENCOUNTER_SEALED',

  /**
   * El diagnóstico referenciado por un plan de cuidado no existe o no es del
   * paciente del plan. Ambos casos responden idéntico.
   */
  CHART_CONDITION_OUT_OF_SCOPE = 'CHART_CONDITION_OUT_OF_SCOPE',
}
