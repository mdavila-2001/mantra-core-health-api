import type { InfraRole } from '../policies/infra-policy';

/**
 * Qué texto libre de la operación es dato clínico y quién lo ve.
 *
 * Limpieza y Mantenimiento necesitan el **tipo** de aislamiento (las precauciones),
 * no el diagnóstico: el organismo y el motivo clínico son sólo de Enfermería,
 * Admisión y Control de infecciones sobre el espacio (`matriz-de-permisos` §3,
 * «Limpieza ve únicamente el eje de higiene»; CONTRATO-F2-F5 §F2.3, «sin datos de
 * paciente»). Las administraciones de estructura tampoco lo ven: no operan camas
 * (INV-44).
 */
export const CLINICAL_TEXT_ROLES: readonly InfraRole[] = [
  'NURSE',
  'ADMISSION',
  'INFECTION_CONTROL',
];

/** Motivos de bloqueo cuyo texto libre describe al paciente. */
const CLINICAL_REASON_CODES: ReadonlySet<string> = new Set([
  'BLOCK_RSN_PATIENT_CONDITION',
]);

/**
 * ¿El texto libre de este cambio es clínico? Lo es el de cualquier cambio del eje de
 * aislamiento y el del motivo «condición del paciente».
 *
 * @param axisCode - Eje del evento (`AXIS_ISOLATION`…), si aplica.
 * @param reasonCode - Motivo del bloqueo (`BLOCK_RSN_*`), si aplica.
 */
export function isClinicalText(
  axisCode: string | null | undefined,
  reasonCode: string | null | undefined,
): boolean {
  return (
    axisCode === 'AXIS_ISOLATION' ||
    (reasonCode !== null &&
      reasonCode !== undefined &&
      CLINICAL_REASON_CODES.has(reasonCode))
  );
}

/**
 * Texto libre visible: el original para quien tiene rol clínico sobre el espacio, o
 * `null`. El outbox **nunca** lleva texto clínico (se llama con `clinicalVisible = false`).
 */
export function visibleText(
  text: string | null | undefined,
  clinicalText: boolean,
  clinicalVisible: boolean,
): string | null {
  if (text === null || text === undefined) return null;
  return clinicalText && !clinicalVisible ? null : text;
}
