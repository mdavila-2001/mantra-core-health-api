/**
 * Fichas de inyección de los colaboradores. Son símbolos, no clases, para que
 * conectar el adaptador real (padrón, terminología, escritor clínico, auditoría
 * transaccional, tabla del lote) sea cambiar UN proveedor del módulo sin tocar
 * el servicio ni los puertos.
 */
export const CLINICAL_IMPORT_BATCHES = Symbol('CLINICAL_IMPORT_BATCHES');
export const CLINICAL_IMPORT_PATIENTS = Symbol('CLINICAL_IMPORT_PATIENTS');
export const CLINICAL_IMPORT_CODES = Symbol('CLINICAL_IMPORT_CODES');
export const CLINICAL_IMPORT_PRACTITIONERS = Symbol(
  'CLINICAL_IMPORT_PRACTITIONERS',
);
export const CLINICAL_IMPORT_WRITER = Symbol('CLINICAL_IMPORT_WRITER');
export const CLINICAL_IMPORT_AUDIT = Symbol('CLINICAL_IMPORT_AUDIT');
