/**
 * Avisos del circuito de vinculación médico-paciente (FT-07-R05).
 *
 * Mismo criterio que `AffiliationNoticePort`: el servicio que pide o decide el
 * acceso no sabe que existe un canal in-app, sólo depende de esta interfaz.
 */
export type PractitionerAccessNoticeKind =
  /** Un profesional pidió acceso al expediente; va al paciente. */
  | 'ACCESS_REQUESTED'
  /** El paciente aceptó, con las especialidades que autorizó; va al profesional. */
  | 'ACCESS_ACCEPTED'
  /** El paciente rechazó la solicitud; va al profesional. */
  | 'ACCESS_DECLINED';

/** Un aviso del vínculo, listo para emitirse. */
export interface PractitionerAccessNotice {
  readonly kind: PractitionerAccessNoticeKind;
  /** Cuenta que lo recibe: el paciente si es ACCESS_REQUESTED, el profesional si no. */
  readonly recipientUserId: string;
  readonly tenantId?: string;
  /** Título corto, para la campana sin abrir nada. */
  readonly subject: string;
  readonly bodyText: string;
  /** La solicitud (consent id) a la que lleva el aviso. */
  readonly requestId: string;
}

/**
 * Qué pasó con el aviso. Nunca una excepción: que no salga un aviso no puede
 * impedir que la solicitud se cree o se decida.
 */
export interface PractitionerAccessNoticeResult {
  readonly delivered: boolean;
  readonly skippedReason?: string;
}

/** Emisor de avisos del vínculo médico-paciente. */
export interface PractitionerAccessNoticePort {
  emit(
    notice: PractitionerAccessNotice,
  ): Promise<PractitionerAccessNoticeResult>;
}

/** Token de inyección del emisor. */
export const PRACTITIONER_ACCESS_NOTICE_PORT = Symbol(
  'PRACTITIONER_ACCESS_NOTICE_PORT',
);
