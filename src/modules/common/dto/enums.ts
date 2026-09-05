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
}

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
