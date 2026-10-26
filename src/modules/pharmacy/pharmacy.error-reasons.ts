/**
 * Catálogo de sub-códigos de negocio estables para `pharmacy`.
 *
 * `code` (en `DomainException`) dice el tipo HTTP del error; `reason` dice
 * cuál error concreto de ese tipo fue, dentro de este módulo. Un cliente
 * puede ramificar sobre `reason` sin parsear `message`.
 */
export enum PharmacyErrorReason {
  /**
   * La farmacia no existe o no pertenece al tenant activo del actor. Ambos
   * casos responden igual a propósito.
   */
  PHARMACY_NOT_AVAILABLE = 'PHARMACY_NOT_AVAILABLE',
  /**
   * La sede, la práctica o la aseguradora que referencia el cuerpo no existe
   * o no pertenece a la farmacia o al tenant autorizados.
   */
  PHARMACY_REFERENCE_NOT_AVAILABLE = 'PHARMACY_REFERENCE_NOT_AVAILABLE',
  /**
   * El turno de guardia no cumple la ventana: fin no posterior al inicio, más
   * de 72 h, ya terminado o declarado con más de 62 días de anticipación.
   */
  ON_CALL_SHIFT_WINDOW_INVALID = 'ON_CALL_SHIFT_WINDOW_INVALID',
  /** La sede ya tiene un turno activo que se solapa con el declarado. */
  ON_CALL_SHIFT_OVERLAP = 'ON_CALL_SHIFT_OVERLAP',
  /** El turno ya terminó o ya estaba cancelado: no se puede cancelar. */
  ON_CALL_SHIFT_NOT_CANCELLABLE = 'ON_CALL_SHIFT_NOT_CANCELLABLE',
}
