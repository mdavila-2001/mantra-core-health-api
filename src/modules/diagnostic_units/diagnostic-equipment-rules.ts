import { PreconditionFailedException } from '../../common';
import { DUNIT } from './diagnostic_units.concepts';
import { DiagnosticUnitsErrorReason } from './diagnostic_units.error-reasons';

/**
 * Reglas puras del equipo de diagnóstico (F5a): el AE Title y el nombre de la estación DICOM
 * y los estados operativos. Sin base ni Nest: se prueban solas.
 */

/** Caracteres imprimibles ASCII (0x20–0x7E) y de 1 a 16: el valor representable de un AE (PS3.5 §6.2). */
const DICOM_SHORT_STRING = /^[\x20-\x7E]{1,16}$/;

/** Máximo de caracteres de un AE Title y de un Station Name. */
export const DICOM_NAME_MAX = 16;

/**
 * Normaliza y valida un AE Title. Los espacios de los extremos no son significativos en DICOM
 * y dos títulos que sólo difieren en ellos se verían iguales: se recortan antes de comparar
 * (el único `(sitio, ae_title)` de la base compara el texto tal cual).
 *
 * @param raw - Lo que mandó el cliente.
 * @returns El título recortado, o `null` si se pide quitarlo.
 * @throws PreconditionFailedException (422 `AE_TITLE_INVALID`).
 */
export function normalizeAeTitle(raw: string | null): string | null {
  if (raw === null) return null;
  const value = raw.trim();
  if (!DICOM_SHORT_STRING.test(value) || value.includes('\\')) {
    throw new PreconditionFailedException(
      'El AE Title debe tener de 1 a 16 caracteres imprimibles, sin barra invertida',
      { field: 'aeTitle', max: DICOM_NAME_MAX },
      DiagnosticUnitsErrorReason.AE_TITLE_INVALID,
    );
  }
  return value;
}

/**
 * Normaliza y valida el nombre de la estación (0040,0010), con las mismas reglas de forma que
 * el AE Title.
 *
 * @throws PreconditionFailedException (422 `STATION_NAME_INVALID`).
 */
export function normalizeStationName(raw: string | null): string | null {
  if (raw === null) return null;
  const value = raw.trim();
  if (!DICOM_SHORT_STRING.test(value) || value.includes('\\')) {
    throw new PreconditionFailedException(
      'El nombre de la estación debe tener de 1 a 16 caracteres imprimibles, sin barra invertida',
      { field: 'stationName', max: DICOM_NAME_MAX },
      DiagnosticUnitsErrorReason.STATION_NAME_INVALID,
    );
  }
  return value;
}

/** Los estados operativos que admite un equipo. */
export const EQUIPMENT_STATUSES: readonly string[] = [
  DUNIT.EQUIPMENT_OPERATIONAL,
  DUNIT.EQUIPMENT_MAINTENANCE,
  DUNIT.EQUIPMENT_OUT_OF_SERVICE,
];

/** Los estados en los que el equipo no puede atender estudios. */
export const EQUIPMENT_OUT_OF_SERVICE_STATUSES: readonly string[] = [
  DUNIT.EQUIPMENT_MAINTENANCE,
  DUNIT.EQUIPMENT_OUT_OF_SERVICE,
];

/**
 * El estado tiene que ser uno de los del equipo: antes cualquier concepto del catálogo pasaba
 * por «estado operativo».
 *
 * @throws PreconditionFailedException (422 `EQUIPMENT_STATUS_INVALID`).
 */
export function assertEquipmentStatus(conceptId: string): void {
  if (!EQUIPMENT_STATUSES.includes(conceptId)) {
    throw new PreconditionFailedException(
      'Estado operativo no válido para un equipo',
      { allowed: ['OPERATIONAL', 'MAINTENANCE', 'OUT_OF_SERVICE'] },
      DiagnosticUnitsErrorReason.EQUIPMENT_STATUS_INVALID,
    );
  }
}

/** ¿El equipo está fuera de servicio (mantenimiento o baja)? */
export function isOutOfService(conceptId: string): boolean {
  return EQUIPMENT_OUT_OF_SERVICE_STATUSES.includes(conceptId);
}
