import { PROF } from '../../profiles.concepts';

/** Tipo de fuente consultada al verificar (código estable de la API). */
export const SOURCE_TYPE_CODES = [
  'REGISTRO_MINSALUD',
  'COLEGIO_MEDICO',
  'COLEGIO_ODONTOLOGOS',
  'SEDES',
  'SEGIP',
  'DOCUMENTO_APORTADO',
  'OTRO',
] as const;
export type SourceTypeCode = (typeof SOURCE_TYPE_CODES)[number];

/** Concepto y rótulo de cada tipo de fuente. */
export const SOURCE_TYPES: Readonly<
  Record<SourceTypeCode, { concept: string; label: string }>
> = {
  REGISTRO_MINSALUD: {
    concept: PROF.ADMISSION_SOURCE_MINSALUD_REGISTRY,
    label: 'Registro del Ministerio de Salud',
  },
  COLEGIO_MEDICO: {
    concept: PROF.ADMISSION_SOURCE_MEDICAL_COLLEGE,
    label: 'Colegio Médico',
  },
  COLEGIO_ODONTOLOGOS: {
    concept: PROF.ADMISSION_SOURCE_DENTAL_COLLEGE,
    label: 'Colegio de Odontólogos',
  },
  SEDES: {
    concept: PROF.ADMISSION_SOURCE_SEDES,
    label: 'Servicio Departamental de Salud (SEDES)',
  },
  SEGIP: { concept: PROF.ADMISSION_SOURCE_SEGIP, label: 'SEGIP' },
  DOCUMENTO_APORTADO: {
    concept: PROF.ADMISSION_SOURCE_SUBMITTED_DOCUMENT,
    label: 'Documento aportado por el solicitante',
  },
  OTRO: { concept: PROF.ADMISSION_SOURCE_OTHER, label: 'Otra fuente' },
};

/** Motivo estructurado de un rechazo o de una petición de información. */
export const REASON_CODES = [
  'ILEGIBLE',
  'VENCIDO',
  'NO_COINCIDE_NOMBRE',
  'NO_FIGURA_EN_REGISTRO',
  'DOCUMENTO_INCOMPLETO',
  'SOSPECHA_DE_FRAUDE',
  'OTRO',
] as const;
export type ReasonCode = (typeof REASON_CODES)[number];

/** Concepto y rótulo de cada motivo. */
export const REASONS: Readonly<
  Record<ReasonCode, { concept: string; label: string; staffOnly?: boolean }>
> = {
  ILEGIBLE: {
    concept: PROF.ADMISSION_REASON_ILLEGIBLE,
    label: 'Documento ilegible',
  },
  VENCIDO: {
    concept: PROF.ADMISSION_REASON_EXPIRED,
    label: 'Documento vencido',
  },
  NO_COINCIDE_NOMBRE: {
    concept: PROF.ADMISSION_REASON_NAME_MISMATCH,
    label: 'El nombre no coincide',
  },
  NO_FIGURA_EN_REGISTRO: {
    concept: PROF.ADMISSION_REASON_NOT_IN_REGISTRY,
    label: 'No figura en el registro',
  },
  DOCUMENTO_INCOMPLETO: {
    concept: PROF.ADMISSION_REASON_INCOMPLETE,
    label: 'Documento incompleto',
  },
  // Lo ve el personal; al solicitante se le muestra como «Otro».
  SOSPECHA_DE_FRAUDE: {
    concept: PROF.ADMISSION_REASON_SUSPECTED_FRAUD,
    label: 'Sospecha de fraude',
    staffOnly: true,
  },
  OTRO: { concept: PROF.ADMISSION_REASON_OTHER, label: 'Otro motivo' },
};

/** El código de fuente de un concepto, o `undefined`. */
export function sourceTypeOf(
  conceptId?: string | null,
): SourceTypeCode | undefined {
  return SOURCE_TYPE_CODES.find((c) => SOURCE_TYPES[c].concept === conceptId);
}

/** El código de motivo de un concepto, o `undefined`. */
export function reasonCodeOf(
  conceptId?: string | null,
): ReasonCode | undefined {
  return REASON_CODES.find((c) => REASONS[c].concept === conceptId);
}

/** Lo que ve el solicitante de un código de motivo (nunca el reservado al personal). */
export function applicantVisibleReason(
  code?: ReasonCode,
): ReasonCode | undefined {
  if (!code) return undefined;
  return REASONS[code].staffOnly ? 'OTRO' : code;
}

/** Tipos de evento de la bitácora, código ↔ concepto. */
export const EVENT_TYPES = {
  CREATED: PROF.ADMISSION_EVENT_CREATED,
  CLAIMED: PROF.ADMISSION_EVENT_CLAIMED,
  INFO_REQUESTED: PROF.ADMISSION_EVENT_INFO_REQUESTED,
  RESUBMITTED: PROF.ADMISSION_EVENT_RESUBMITTED,
  ITEM_VERIFIED: PROF.ADMISSION_EVENT_ITEM_VERIFIED,
  ITEM_REJECTED: PROF.ADMISSION_EVENT_ITEM_REJECTED,
  ITEM_INFO_REQUIRED: PROF.ADMISSION_EVENT_ITEM_INFO_REQUIRED,
  VERIFIED: PROF.ADMISSION_EVENT_VERIFIED,
  REJECTED: PROF.ADMISSION_EVENT_REJECTED,
  SUSPENDED: PROF.ADMISSION_EVENT_SUSPENDED,
  REINSTATED: PROF.ADMISSION_EVENT_REINSTATED,
  EXPIRED: PROF.ADMISSION_EVENT_EXPIRED,
  WITHDRAWN: PROF.ADMISSION_EVENT_WITHDRAWN,
  ABANDONED: PROF.ADMISSION_EVENT_ABANDONED,
  RELEASED: PROF.ADMISSION_EVENT_RELEASED,
  REASSIGNED: PROF.ADMISSION_EVENT_REASSIGNED,
  BACKFILLED: PROF.ADMISSION_EVENT_BACKFILLED,
} as const;
export type AdmissionEventCode = keyof typeof EVENT_TYPES;

/** El código de un evento a partir de su concepto. */
export function eventCodeOf(conceptId: string): AdmissionEventCode | undefined {
  return (Object.keys(EVENT_TYPES) as AdmissionEventCode[]).find(
    (c) => EVENT_TYPES[c] === conceptId,
  );
}
