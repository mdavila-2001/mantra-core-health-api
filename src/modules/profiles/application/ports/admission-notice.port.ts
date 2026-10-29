/**
 * Avisos al médico durante la verificación de su alta.
 *
 * Mismo criterio que `AffiliationNoticePort`: quien decide no sabe que existe un
 * canal in-app ni un correo, y emitir **nunca** rompe la decisión (que ya está
 * tomada y escrita). El cuerpo del aviso es genérico a propósito: no lleva
 * motivos ni datos personales («hay novedades en su verificación» y la ruta
 * autenticada donde leerlas).
 */
export type AdmissionNoticeKind =
  | 'RECEIVED'
  | 'INFO_REQUIRED'
  | 'VERIFIED'
  | 'REJECTED'
  | 'SUSPENDED'
  | 'REINSTATED'
  | 'EXPIRED'
  | 'ABANDONED'
  | 'WITHDRAWN';

/** Un aviso listo para emitir. */
export interface AdmissionNotice {
  readonly kind: AdmissionNoticeKind;
  readonly admissionId: string;
  /** Estado en el que quedó la admisión (clave de rebote junto con el id). */
  readonly statusCode: string;
  /** Perfil profesional (= persona) a quien se avisa. */
  readonly practitionerProfileId: string;
}

/** Qué pasó con el aviso. Nunca una excepción. */
export interface AdmissionNoticeResult {
  readonly delivered: boolean;
  readonly skippedReason?: string;
}

/** Emisor de avisos de admisión. */
export interface AdmissionNoticePort {
  /** Emite el aviso (in-app y correo si hay canal). No lanza. */
  emit(notice: AdmissionNotice): Promise<AdmissionNoticeResult>;
}

/** Token de inyección del emisor. */
export const ADMISSION_NOTICE_PORT = Symbol('ADMISSION_NOTICE_PORT');
