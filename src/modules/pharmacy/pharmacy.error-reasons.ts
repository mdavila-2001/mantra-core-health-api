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
  /** Carga masiva: la clave de la fila ya existe y el modo es `CREATE`. */
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  /** Carga masiva: la clave de la fila no existe y el modo es `UPDATE`. */
  NOT_FOUND = 'NOT_FOUND',
  /**
   * Carga masiva: la misma clave viene en más de una fila del pedido. Se
   * rechazan todas: elegir una por el orden sería decidir en silencio cuál vale.
   */
  DUPLICATE_IN_FILE = 'DUPLICATE_IN_FILE',
  /** Carga masiva de productos: el nombre no está en el catálogo de medicamentos. */
  MEDICATION_NOT_FOUND = 'MEDICATION_NOT_FOUND',
  /** Carga masiva de productos: el nombre coincide con más de un medicamento. */
  MEDICATION_AMBIGUOUS = 'MEDICATION_AMBIGUOUS',
  /** Carga masiva de productos: el medicamento viene del catálogo oficial, no se escribe. */
  MEDICATION_FROM_CATALOG = 'MEDICATION_FROM_CATALOG',
  /** El concepto no es un medicamento del catálogo con que se receta. */
  MEDICATION_NOT_IN_CATALOG = 'MEDICATION_NOT_IN_CATALOG',
  /** Aviso: el producto pide receta y no tiene medicamento vinculado. */
  MEDICATION_NOT_LINKED = 'MEDICATION_NOT_LINKED',
  /** Carga masiva: el producto de ese código está retirado. */
  PRODUCT_RETIRED = 'PRODUCT_RETIRED',
  /** Carga masiva: el producto del catálogo oficial ya está cargado con otro código. */
  CATALOG_PRODUCT_TAKEN = 'CATALOG_PRODUCT_TAKEN',
  /** Carga masiva de precios: no hay producto con ese código. */
  PRODUCT_NOT_FOUND = 'PRODUCT_NOT_FOUND',
  /**
   * El vínculo con el código externo no existe o es de otra conexión: ambos
   * casos responden igual.
   */
  EXTERNAL_MAPPING_NOT_AVAILABLE = 'EXTERNAL_MAPPING_NOT_AVAILABLE',
  /** El producto ya tiene un vínculo en esta conexión: se corrige ese. */
  EXTERNAL_MAPPING_PRODUCT_TAKEN = 'EXTERNAL_MAPPING_PRODUCT_TAKEN',
  /** La corrección de un vínculo no trae ningún campo. */
  EXTERNAL_MAPPING_EMPTY_UPDATE = 'EXTERNAL_MAPPING_EMPTY_UPDATE',
}
