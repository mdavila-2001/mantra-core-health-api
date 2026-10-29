import { PROF } from '../../profiles.concepts';
import { endOfDayLaPaz, toDateOnly } from './business-days';

/**
 * Estados de una admisión, con el código estable que viaja por la API.
 *
 * El código es **corto y en español** (`ENVIADA`) porque es lo que consume el
 * portal; el concepto de terminología (`ADMISSION_STATUS_SUBMITTED`) es la
 * identidad en la base. Este archivo es el único puente entre los dos.
 */
export const ADMISSION_STATUS_CODES = [
  'ENVIADA',
  'EN_REVISION',
  'INFORMACION_REQUERIDA',
  'VERIFICADA',
  'RECHAZADA',
  'SUSPENDIDA',
  'EXPIRADA',
  'RETIRADA',
  'ABANDONADA',
] as const;

/** Código de estado de una admisión. */
export type AdmissionStatusCode = (typeof ADMISSION_STATUS_CODES)[number];

/** Concepto de terminología de cada estado. */
export const ADMISSION_STATUS_CONCEPT: Readonly<
  Record<AdmissionStatusCode, string>
> = {
  ENVIADA: PROF.ADMISSION_STATUS_SUBMITTED,
  EN_REVISION: PROF.ADMISSION_STATUS_IN_REVIEW,
  INFORMACION_REQUERIDA: PROF.ADMISSION_STATUS_INFO_REQUIRED,
  VERIFICADA: PROF.ADMISSION_STATUS_VERIFIED,
  RECHAZADA: PROF.ADMISSION_STATUS_REJECTED,
  SUSPENDIDA: PROF.ADMISSION_STATUS_SUSPENDED,
  EXPIRADA: PROF.ADMISSION_STATUS_EXPIRED,
  RETIRADA: PROF.ADMISSION_STATUS_WITHDRAWN,
  ABANDONADA: PROF.ADMISSION_STATUS_ABANDONED,
};

/** Rótulo en español que ve la persona. */
export const ADMISSION_STATUS_LABEL: Readonly<
  Record<AdmissionStatusCode, string>
> = {
  ENVIADA: 'Enviada',
  EN_REVISION: 'En revisión',
  INFORMACION_REQUERIDA: 'Información requerida',
  VERIFICADA: 'Verificada',
  RECHAZADA: 'Rechazada',
  SUSPENDIDA: 'Suspendida',
  EXPIRADA: 'Expirada',
  RETIRADA: 'Retirada',
  ABANDONADA: 'Abandonada',
};

const CODE_BY_CONCEPT: ReadonlyMap<string, AdmissionStatusCode> = new Map(
  ADMISSION_STATUS_CODES.map((code) => [ADMISSION_STATUS_CONCEPT[code], code]),
);

/** El código de un estado a partir de su concepto; falla ante uno desconocido. */
export function admissionStatusCode(conceptId: string): AdmissionStatusCode {
  const code = CODE_BY_CONCEPT.get(conceptId);
  if (!code) {
    throw new Error(`Concepto de estado de admisión desconocido: ${conceptId}`);
  }
  return code;
}

/** Acciones que mueven la máquina de estados. */
export type AdmissionAction =
  | 'CLAIM'
  | 'REQUEST_INFO'
  | 'RESUBMIT'
  | 'VERIFY'
  | 'REJECT'
  | 'SUSPEND'
  | 'REINSTATE'
  | 'EXPIRE'
  | 'WITHDRAW'
  | 'RELEASE'
  | 'ABANDON';

/**
 * La máquina: acción → desde qué estados es válida → a cuál lleva.
 *
 * ENVIADA → EN_REVISION → (INFORMACION_REQUERIDA → ENVIADA | VERIFICADA |
 * RECHAZADA → ENVIADA por reenvío); VERIFICADA → EXPIRADA → ENVIADA;
 * VERIFICADA → SUSPENDIDA → VERIFICADA; ENVIADA / INFORMACION_REQUERIDA →
 * RETIRADA. Además: EN_REVISION → ENVIADA (soltar) e INFORMACION_REQUERIDA →
 * ABANDONADA (sin respuesta en su plazo; también reenviable). EXPIRADA es sólo
 * la vigencia vencida de una VERIFICADA; el abandono es otra cosa.
 */
export const ADMISSION_TRANSITIONS: Readonly<
  Record<
    AdmissionAction,
    { from: readonly AdmissionStatusCode[]; to: AdmissionStatusCode }
  >
> = {
  CLAIM: { from: ['ENVIADA'], to: 'EN_REVISION' },
  REQUEST_INFO: { from: ['EN_REVISION'], to: 'INFORMACION_REQUERIDA' },
  RESUBMIT: {
    from: ['INFORMACION_REQUERIDA', 'RECHAZADA', 'EXPIRADA', 'ABANDONADA'],
    to: 'ENVIADA',
  },
  VERIFY: { from: ['EN_REVISION'], to: 'VERIFICADA' },
  REJECT: { from: ['EN_REVISION'], to: 'RECHAZADA' },
  SUSPEND: { from: ['VERIFICADA'], to: 'SUSPENDIDA' },
  REINSTATE: { from: ['SUSPENDIDA'], to: 'VERIFICADA' },
  EXPIRE: { from: ['VERIFICADA'], to: 'EXPIRADA' },
  WITHDRAW: { from: ['ENVIADA', 'INFORMACION_REQUERIDA'], to: 'RETIRADA' },
  // Soltar una revisión tomada para que otro la tome (sin esto, una revisión
  // abandonada por su dueño bloquea la cola).
  RELEASE: { from: ['EN_REVISION'], to: 'ENVIADA' },
  // El solicitante no respondió dentro de su plazo.
  ABANDON: { from: ['INFORMACION_REQUERIDA'], to: 'ABANDONADA' },
};

/** ¿Es válida la acción desde este estado? */
export function canTransition(
  action: AdmissionAction,
  from: AdmissionStatusCode,
): boolean {
  return ADMISSION_TRANSITIONS[action].from.includes(from);
}

/** El estado al que lleva una acción. */
export function targetStatus(action: AdmissionAction): AdmissionStatusCode {
  return ADMISSION_TRANSITIONS[action].to;
}

/** Estados en los que la solicitud espera una acción de la plataforma. */
export const OPEN_FOR_REVIEW: readonly AdmissionStatusCode[] = [
  'ENVIADA',
  'EN_REVISION',
];

/**
 * Proyección sobre el perfil: `PRACT_VERIF_*` es la huella de la admisión
 * vigente. Sólo VERIFICADA es «verificado»; todo lo demás es «pendiente»
 * (ENVIADA ≡ PRACT_VERIF_PENDING). El perfil no tiene un tercer estado, y no se
 * cambia el significado de los conceptos existentes.
 */
export function profileVerificationFor(status: AdmissionStatusCode): string {
  return status === 'VERIFICADA'
    ? PROF.PRACT_VERIF_VERIFIED
    : PROF.PRACT_VERIF_PENDING;
}

/** Lo que el front pinta junto al nombre del profesional. */
export type PractitionerVerificationStatus =
  | 'VERIFIED'
  | 'IN_REVIEW'
  | 'UNVERIFIED'
  | 'SUSPENDED'
  | 'EXPIRED';

/** Objeto aditivo `verification` de los DTO de profesional. */
export interface PractitionerVerificationView {
  status: PractitionerVerificationStatus;
  verifiedAt: string | null;
  validUntil: string | null;
}

/**
 * Estado visible a partir de la admisión vigente (o de su ausencia).
 *
 * Una VERIFICADA cuya vigencia ya pasó se muestra `EXPIRED` aunque el barrido
 * todavía no la haya bajado: el check no puede sobrevivir al vencimiento por
 * estar el job atrasado.
 */
export function visibleVerification(
  admission:
    | {
        status: AdmissionStatusCode;
        decidedAt?: Date | null;
        validUntil?: Date | null;
      }
    | undefined,
  now: Date,
): PractitionerVerificationView {
  if (!admission) {
    return { status: 'UNVERIFIED', verifiedAt: null, validUntil: null };
  }
  const validUntil = admission.validUntil
    ? toDateOnly(admission.validUntil)
    : null;
  const verifiedAt =
    admission.status === 'VERIFICADA' ||
    admission.status === 'SUSPENDIDA' ||
    admission.status === 'EXPIRADA'
      ? (admission.decidedAt?.toISOString() ?? null)
      : null;
  switch (admission.status) {
    case 'VERIFICADA': {
      const lapsed =
        admission.validUntil !== undefined &&
        admission.validUntil !== null &&
        endOfDayLaPaz(admission.validUntil).getTime() < now.getTime();
      return {
        status: lapsed ? 'EXPIRED' : 'VERIFIED',
        verifiedAt,
        validUntil,
      };
    }
    case 'SUSPENDIDA':
      return { status: 'SUSPENDED', verifiedAt, validUntil };
    case 'EXPIRADA':
      return { status: 'EXPIRED', verifiedAt, validUntil };
    case 'ENVIADA':
    case 'EN_REVISION':
    case 'INFORMACION_REQUERIDA':
      return { status: 'IN_REVIEW', verifiedAt: null, validUntil: null };
    default:
      return { status: 'UNVERIFIED', verifiedAt: null, validUntil: null };
  }
}
