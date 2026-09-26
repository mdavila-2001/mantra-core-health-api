/**
 * Enumeraciones de entrada expuestas por la API del módulo Common. Son claves
 * legibles que los servicios traducen a `*_concept_id` del catálogo (`CONCEPTS`);
 * no se persisten como texto.
 */

/** Tipo de propietario polimórfico (owner_type_concept_id). */
export enum OwnerType {
  USER = 'USER',
  PATIENT = 'PATIENT',
  TENANT = 'TENANT',
  /** Un diagnóstico puntual (`clinical.conditions`), no el paciente entero. */
  CONDITION = 'CONDITION',
  /** Un procedimiento puntual (`clinical.procedures`), incluida la odontología. */
  PROCEDURE = 'PROCEDURE',
  /** Una receta puntual (`clinical.medication_requests`) — P25. */
  MEDICATION_REQUEST = 'MEDICATION_REQUEST',
  /** Una alergia puntual (`clinical.allergy_intolerances`) — P25. */
  ALLERGY_INTOLERANCE = 'ALLERGY_INTOLERANCE',
  /** Un encuentro (`clinical.encounters`) — P25. */
  ENCOUNTER = 'ENCOUNTER',
}

/**
 * Tipos de dueño que son **historia clínica**: listar sus adjuntos es leer la
 * historia, y eso exige relación asistencial o titularidad. El listado
 * genérico (`GET /common/files/links`) no recibe al actor ni puede evaluar esa
 * política, así que para estos tipos responde 403 y el front lista por la ruta
 * clínica del recurso (BR-11 §1.C, cierre del IDOR para los tipos nuevos).
 *
 * `CONDITION` y `PROCEDURE` **no** están acá a propósito: el front los lista hoy
 * por el genérico y cerrar ese hueco preexistente es de otro carril (queda
 * registrado como observación, no se corrige de paso).
 */
export const CLINICAL_RECORD_OWNER_TYPES: ReadonlySet<OwnerType> = new Set([
  OwnerType.MEDICATION_REQUEST,
  OwnerType.ALLERGY_INTOLERANCE,
  OwnerType.ENCOUNTER,
]);

/** Tipo de identificador oficial. */
export enum IdentifierType {
  NATIONAL_ID = 'NATIONAL_ID',
  MRN = 'MRN',
  PASSPORT = 'PASSPORT',
}

/** Uso declarado de un identificador. */
export enum IdentifierUse {
  OFFICIAL = 'OFFICIAL',
  SECONDARY = 'SECONDARY',
}

/** Sistema de un punto de contacto. */
export enum ContactSystem {
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
}

/** Uso de un punto de contacto o dirección. */
export enum ContactUse {
  HOME = 'HOME',
  WORK = 'WORK',
}

/** Categoría funcional de un archivo. */
export enum FileCategory {
  DOCUMENT = 'DOCUMENT',
  IMAGE = 'IMAGE',
}

/** Sensibilidad de un archivo (PHI activa controles reforzados). */
export enum FileSensitivity {
  NORMAL = 'NORMAL',
  PHI = 'PHI',
}

/** Tipo de derivado generado a partir de una versión. */
export enum DerivativeType {
  THUMBNAIL = 'THUMBNAIL',
  OCR = 'OCR',
}

/** Rol del vínculo entre un archivo y un propietario. */
export enum LinkRole {
  ATTACHMENT = 'ATTACHMENT',
}

/** Visibilidad de un vínculo de archivo. */
export enum LinkVisibility {
  INTERNAL = 'INTERNAL',
}

/** Resultado del escaneo antimalware (callback interno). */
export enum ScanResult {
  CLEAN = 'CLEAN',
  INFECTED = 'INFECTED',
}
