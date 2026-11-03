import { BulkImportReason } from '../bulk-import.error-reasons';

/**
 * Texto de cada motivo en el informe.
 *
 * El informe y la vista previa **no repiten nunca el contenido de la fila**: dicen
 * qué falló, no con qué valor. Por eso el texto sale de este catálogo cerrado y
 * no del valor recibido.
 */
export const REASON_MESSAGES: Readonly<Record<BulkImportReason, string>> = {
  [BulkImportReason.KIND_UNKNOWN]: 'El tipo de carga no existe',
  [BulkImportReason.FORMAT_UNSUPPORTED]: 'El formato debe ser csv o json',
  [BulkImportReason.FILE_TOO_LARGE]: 'El archivo supera el tamaño máximo',
  [BulkImportReason.ROW_LIMIT_EXCEEDED]:
    'El lote supera la cantidad máxima de filas',
  [BulkImportReason.SOURCE_AMBIGUOUS]:
    'Envíe un archivo o filas, no ambos ni ninguno',
  [BulkImportReason.DECLARATION_INVALID]: 'La declaración del lote es inválida',
  [BulkImportReason.IDEMPOTENCY_KEY_REQUIRED]: 'Falta la clave de idempotencia',
  [BulkImportReason.IDEMPOTENCY_KEY_REUSED]:
    'La clave de idempotencia ya se usó en otro lote',
  [BulkImportReason.PERMISSION_REQUIRED]:
    'Falta el permiso para este tipo de carga',
  [BulkImportReason.BATCH_NOT_AVAILABLE]: 'El lote no existe',
  [BulkImportReason.BATCH_NOT_CONFIRMABLE]:
    'El lote no está en un estado confirmable',
  [BulkImportReason.BATCH_ALREADY_CONFIRMED]:
    'El lote ya fue confirmado con otra clave',
  [BulkImportReason.REPORT_NOT_READY]: 'El lote todavía no terminó',
  [BulkImportReason.TRANSITION_LOST]: 'Otro proceso cambió el estado del lote',
  [BulkImportReason.FILE_UNREADABLE]: 'No se pudo leer el archivo',
  [BulkImportReason.FILE_EMPTY]: 'El archivo no trae filas',
  [BulkImportReason.COLUMN_MISSING]: 'Falta una columna obligatoria',
  [BulkImportReason.KIND_MISMATCH]: 'El tipo del archivo no coincide',
  [BulkImportReason.REQUIRED]: 'Falta un dato obligatorio',
  [BulkImportReason.UNKNOWN_FIELD]:
    'Hay una columna que no figura en la plantilla',
  [BulkImportReason.INVALID_FORMAT]: 'Un valor no tiene el formato esperado',
  [BulkImportReason.TOO_LONG]: 'Un valor es más largo que el máximo',
  [BulkImportReason.TOO_SHORT]: 'Un valor es más corto que el mínimo',
  [BulkImportReason.OUT_OF_RANGE]: 'Un valor está fuera de rango',
  [BulkImportReason.NOT_ALLOWED_VALUE]: 'Un valor no es uno de los admitidos',
  [BulkImportReason.FIELD_COMBINATION_INVALID]:
    'La combinación de campos no es válida',
  [BulkImportReason.DUPLICATE_IN_FILE]:
    'La misma clave ya vino en una fila anterior',
  [BulkImportReason.PATIENT_NOT_FOUND]:
    'Ningún paciente coincide con el documento y la fecha de nacimiento',
  [BulkImportReason.PATIENT_AMBIGUOUS]:
    'Más de un paciente coincide; la fila no se enlaza',
  [BulkImportReason.CONSENT_REVOKED]: 'El paciente revocó el consentimiento',
  [BulkImportReason.CODE_NOT_FOUND]:
    'El código no existe en el sistema de codificación indicado',
  [BulkImportReason.CODE_AMBIGUOUS]: 'El código resuelve a más de un concepto',
  [BulkImportReason.RESOLUTION_UNAVAILABLE]:
    'No se pudo consultar la terminología o el padrón de pacientes',
  [BulkImportReason.EXECUTOR_NOT_CONNECTED]:
    'La escritura de este tipo de carga no está conectada en esta instalación',
  [BulkImportReason.WRITE_FAILED]: 'No se pudo escribir la fila',
  [BulkImportReason.ROW_TIMEOUT]: 'Se agotó el plazo de la fila',
  [BulkImportReason.BATCH_TIMEOUT]: 'Se agotó el plazo del lote',
  [BulkImportReason.ALREADY_LOADED]: 'El registro ya existía idéntico',
  [BulkImportReason.CONTENT_CONFLICT]:
    'El registro existe con otro contenido; no se sobrescribe',
};
