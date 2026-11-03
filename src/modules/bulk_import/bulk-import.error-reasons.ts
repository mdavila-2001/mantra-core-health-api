/**
 * Catálogo de sub-códigos de negocio estables para `bulk_import`.
 *
 * `code` (en `DomainException`) dice el tipo HTTP del error; `reason` dice
 * cuál error concreto fue. Un cliente puede ramificar sobre `reason` sin
 * parsear `message`. Los mismos valores se usan como `code` de los hallazgos por
 * fila/campo de la vista previa y como motivo de las filas del informe.
 */
export enum BulkImportReason {
  // --- Del pedido -----------------------------------------------------------
  /** El tipo de carga pedido no existe. */
  KIND_UNKNOWN = 'KIND_UNKNOWN',
  /** El formato de la plantilla pedida no es `csv` ni `json`. */
  FORMAT_UNSUPPORTED = 'FORMAT_UNSUPPORTED',
  /** El archivo pesa más que el tope. */
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  /** El lote trae más filas que el tope. */
  ROW_LIMIT_EXCEEDED = 'ROW_LIMIT_EXCEEDED',
  /** No vino ni archivo ni filas, o vinieron las dos cosas. */
  SOURCE_AMBIGUOUS = 'SOURCE_AMBIGUOUS',
  /** La declaración del lote (origen, base legal, fecha, motivo) falta o es inválida. */
  DECLARATION_INVALID = 'DECLARATION_INVALID',
  /** Falta la cabecera `Idempotency-Key` o no es válida. */
  IDEMPOTENCY_KEY_REQUIRED = 'IDEMPOTENCY_KEY_REQUIRED',
  /** La clave de idempotencia ya confirmó otro lote. */
  IDEMPOTENCY_KEY_REUSED = 'IDEMPOTENCY_KEY_REUSED',

  /** Falta el permiso fino (`bulk_import.users` o `bulk_import.clinical`). */
  PERMISSION_REQUIRED = 'PERMISSION_REQUIRED',

  // --- Del lote -------------------------------------------------------------
  /** El lote no existe o es de otra organización (misma respuesta). */
  BATCH_NOT_AVAILABLE = 'BATCH_NOT_AVAILABLE',
  /** El lote no está en un estado desde el que se pueda confirmar. */
  BATCH_NOT_CONFIRMABLE = 'BATCH_NOT_CONFIRMABLE',
  /** El lote ya fue confirmado con otra clave. */
  BATCH_ALREADY_CONFIRMED = 'BATCH_ALREADY_CONFIRMED',
  /** El lote todavía no terminó: no hay informe. */
  REPORT_NOT_READY = 'REPORT_NOT_READY',
  /** La transición de estado perdió la carrera (otro proceso ya la hizo). */
  TRANSITION_LOST = 'TRANSITION_LOST',

  // --- Del archivo ----------------------------------------------------------
  /** El archivo no se pudo leer como CSV ni como JSON. */
  FILE_UNREADABLE = 'FILE_UNREADABLE',
  /** El archivo no trae filas. */
  FILE_EMPTY = 'FILE_EMPTY',
  /** Falta una columna obligatoria de la plantilla. */
  COLUMN_MISSING = 'COLUMN_MISSING',
  /** El JSON declara un `kind` distinto del pedido. */
  KIND_MISMATCH = 'KIND_MISMATCH',

  // --- De la fila y del campo ----------------------------------------------
  /** Falta un dato obligatorio. */
  REQUIRED = 'REQUIRED',
  /** El campo no figura en la plantilla (lista blanca). */
  UNKNOWN_FIELD = 'UNKNOWN_FIELD',
  /** El valor no tiene el tipo o el formato esperado. */
  INVALID_FORMAT = 'INVALID_FORMAT',
  /** El valor es más largo que el máximo. */
  TOO_LONG = 'TOO_LONG',
  /** El valor es más corto que el mínimo. */
  TOO_SHORT = 'TOO_SHORT',
  /** El valor está fuera del rango. */
  OUT_OF_RANGE = 'OUT_OF_RANGE',
  /** El valor no es uno de los admitidos. */
  NOT_ALLOWED_VALUE = 'NOT_ALLOWED_VALUE',
  /** La combinación de campos no es válida (regla entre campos). */
  FIELD_COMBINATION_INVALID = 'FIELD_COMBINATION_INVALID',
  /** La misma clave ya vino en una fila anterior del archivo. */
  DUPLICATE_IN_FILE = 'DUPLICATE_IN_FILE',

  // --- De la resolución (referencial) --------------------------------------
  /** Ningún paciente coincide con documento + fecha de nacimiento. */
  PATIENT_NOT_FOUND = 'PATIENT_NOT_FOUND',
  /** Más de un paciente coincide: nunca se adivina. */
  PATIENT_AMBIGUOUS = 'PATIENT_AMBIGUOUS',
  /** El paciente revocó el consentimiento. */
  CONSENT_REVOKED = 'CONSENT_REVOKED',
  /** El código clínico no existe en el sistema de terminología indicado. */
  CODE_NOT_FOUND = 'CODE_NOT_FOUND',
  /** El código clínico resuelve a más de un concepto. */
  CODE_AMBIGUOUS = 'CODE_AMBIGUOUS',
  /** El colaborador que resuelve pacientes o códigos no respondió. */
  RESOLUTION_UNAVAILABLE = 'RESOLUTION_UNAVAILABLE',
  /** El colaborador que escribe no está conectado a esta instalación. */
  EXECUTOR_NOT_CONNECTED = 'EXECUTOR_NOT_CONNECTED',
  /** El colaborador falló al escribir la fila. */
  WRITE_FAILED = 'WRITE_FAILED',
  /** Se agotó el plazo de la fila. */
  ROW_TIMEOUT = 'ROW_TIMEOUT',
  /** Se agotó el plazo del lote. */
  BATCH_TIMEOUT = 'BATCH_TIMEOUT',
  /** La fila ya existía igual: no se escribió. */
  ALREADY_LOADED = 'ALREADY_LOADED',
  /** La fila existía con otro contenido: se reporta y no se sobrescribe. */
  CONTENT_CONFLICT = 'CONTENT_CONFLICT',
}
