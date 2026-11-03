/**
 * Avisos del circuito del vínculo profesional–organización.
 *
 * ## Por qué un puerto y no llamar a mensajería directo
 *
 * Mismo criterio que `AgendaNoticePort` en scheduling: el servicio que decide
 * un vínculo no tiene por qué saber que existe un canal in-app, ni qué
 * categoría de notificación le corresponde. Depende de esta interfaz y el
 * módulo le inyecta el adaptador — que es lo que permite probar la decisión sin
 * levantar mensajería.
 */
export type AffiliationNoticeKind =
  /** La organización aceptó el vínculo. */
  | 'AFFILIATION_APPROVED'
  /** La organización lo rechazó, con su motivo. */
  | 'AFFILIATION_REJECTED'
  /** La organización dio de baja uno que ya había aprobado. */
  | 'AFFILIATION_REVOKED'
  /**
   * Un profesional pidió vincularse, y va **a la organización**.
   *
   * Es el único que no viaja al médico. Sin él, la bandeja de solicitudes
   * depende de que alguien entre a mirarla por las dudas — y nadie lo hace.
   */
  | 'AFFILIATION_REQUESTED';

/** Un aviso del vínculo, listo para emitirse. */
export interface AffiliationNotice {
  readonly kind: AffiliationNoticeKind;
  /** Cuenta del profesional que lo recibe. */
  readonly recipientUserId: string;
  /** Organización que decidió; la bandeja separa por tenant. */
  readonly tenantId: string;
  /** Título corto: es lo que se lee en la campana sin abrir nada. */
  readonly subject: string;
  /** Cuerpo, con el motivo cuando la organización lo dio. */
  readonly bodyText: string;
  /** El vínculo al que lleva el aviso. */
  readonly affiliationId: string;
}

/**
 * Qué pasó con el aviso.
 *
 * **Nunca una excepción**: que no salga un aviso no puede impedir que una
 * organización apruebe o rechace. La decisión ya está tomada y escrita.
 */
export interface AffiliationNoticeResult {
  readonly delivered: boolean;
  /** Por qué no se entregó: sin cuenta, preferencia en contra, canal caído. */
  readonly skippedReason?: string;
}

/** Emisor de avisos del vínculo. */
export interface AffiliationNoticePort {
  /** Emite un aviso. No lanza: los fallos vuelven en el resultado. */
  emit(notice: AffiliationNotice): Promise<AffiliationNoticeResult>;
}

/** Token de inyección del emisor. */
export const AFFILIATION_NOTICE_PORT = Symbol('AFFILIATION_NOTICE_PORT');
