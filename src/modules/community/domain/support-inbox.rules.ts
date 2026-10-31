/** Estado de una conversación en la bandeja del equipo. */
export type AssignmentState = 'NEW' | 'TAKEN' | 'WAITING_DOCTOR' | 'RESOLVED';

/** Saltos permitidos: lo que no figura aquí no se puede. */
const TRANSITIONS: Readonly<
  Record<AssignmentState, readonly AssignmentState[]>
> = {
  // Una conversación nueva puede pasar directo al doctor si es clínica.
  NEW: ['TAKEN', 'WAITING_DOCTOR'],
  TAKEN: ['WAITING_DOCTOR', 'RESOLVED'],
  WAITING_DOCTOR: ['TAKEN', 'RESOLVED'],
  // Una resuelta se reabre tomándola otra vez.
  RESOLVED: ['TAKEN'],
};

/**
 * ¿Se puede pasar de un estado a otro?
 *
 * @param from - Estado actual.
 * @param to - Estado pedido.
 * @returns `true` si el salto es válido.
 */
export function canTransition(
  from: AssignmentState,
  to: AssignmentState,
): boolean {
  return TRANSITIONS[from].includes(to);
}

/** Horas por defecto para responder una conversación. */
export const DEFAULT_SLA_HOURS = 24;

/**
 * Horas de plazo configuradas (`SUPPORT_INBOX_SLA_HOURS`); un valor inválido
 * deja el de por defecto.
 *
 * @param env - Variables de entorno.
 * @returns Horas de plazo.
 */
export function slaHoursFromEnv(
  env: Readonly<Record<string, string | undefined>>,
): number {
  const parsed = Number(env.SUPPORT_INBOX_SLA_HOURS);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_SLA_HOURS;
}

/**
 * Vencimiento del plazo de respuesta.
 *
 * @param now - Instante de la asignación.
 * @param hours - Horas de plazo.
 * @returns El instante en que vence.
 */
export function defaultSlaDueAt(now: Date, hours: number): Date {
  return new Date(now.getTime() + hours * 3600 * 1000);
}

/** Lo que `planTake` necesita saber de la asignación actual. */
export interface TakeInput {
  /** Estado actual (`NEW` si no hay asignación). */
  readonly status: AssignmentState;
  /** Quien la tiene ahora, si alguien. */
  readonly assignedUserId?: string;
}

/** Resultado de intentar tomar una conversación. */
export type TakePlan =
  | {
      readonly ok: true;
      readonly status: AssignmentState;
      readonly referredToDoctor: boolean;
    }
  | { readonly ok: false; readonly reason: 'ALREADY_TAKEN' };

/**
 * Qué pasa al tomar una conversación: queda a nombre de quien la toma, salvo que
 * la tenga otra persona; y si el último mensaje del paciente parece clínico no
 * queda tomada sino derivada al doctor.
 *
 * @param current - Asignación actual.
 * @param userId - Quien la toma.
 * @param hints - Si el último mensaje del paciente parece clínico.
 * @returns El plan o el motivo del rechazo.
 */
export function planTake(
  current: TakeInput,
  userId: string,
  hints: { readonly clinicalSuspected: boolean },
): TakePlan {
  if (
    current.status === 'TAKEN' &&
    current.assignedUserId &&
    current.assignedUserId !== userId
  ) {
    return { ok: false, reason: 'ALREADY_TAKEN' };
  }
  if (hints.clinicalSuspected) {
    return { ok: true, status: 'WAITING_DOCTOR', referredToDoctor: true };
  }
  return { ok: true, status: 'TAKEN', referredToDoctor: false };
}

/**
 * Saltos que admite quien pide un estado concreto (`status` sin `action`), el de
 * las pantallas del equipo: además de los de {@link canTransition}, soltar una
 * conversación (`NEW`) y resolver una que nadie tomó. Reabrir una resuelta sigue
 * siendo tomarla (o que el paciente vuelva a escribir).
 */
const SET_STATUS_EXTRA: Readonly<
  Record<AssignmentState, readonly AssignmentState[]>
> = {
  NEW: ['RESOLVED'],
  TAKEN: ['NEW'],
  WAITING_DOCTOR: ['NEW'],
  RESOLVED: [],
};

/**
 * ¿Se puede pasar de un estado a otro cuando el pedido trae el estado final?
 *
 * @param from - Estado actual.
 * @param to - Estado pedido.
 * @returns `true` si el salto es válido.
 */
export function canSetStatus(
  from: AssignmentState,
  to: AssignmentState,
): boolean {
  return canTransition(from, to) || SET_STATUS_EXTRA[from].includes(to);
}

/**
 * ¿La conversación la tiene otra persona del equipo? Una resuelta o una nueva no
 * tienen dueña: quien la tomó antes ya no la retiene.
 *
 * @param current - Asignación actual.
 * @param userId - Quien pide.
 * @returns `true` si otra persona la tiene.
 */
export function heldByOther(current: TakeInput, userId: string): boolean {
  return (
    (current.status === 'TAKEN' || current.status === 'WAITING_DOCTOR') &&
    !!current.assignedUserId &&
    current.assignedUserId !== userId
  );
}

/** Resultado de intentar responder en nombre del doctor. */
export type ReplyPlan =
  | {
      readonly ok: true;
      readonly status: AssignmentState;
      readonly assignedUserId: string;
    }
  | {
      readonly ok: false;
      readonly reason: 'HELD_BY_OTHER' | 'CLINICAL_REQUIRES_DERIVATION';
    };

/**
 * Qué pasa cuando una persona de apoyo responde en nombre del doctor:
 *
 *  - si otra persona tiene la conversación, no responde (409);
 *  - si el paciente tiene un mensaje clínico sin responder y la conversación no
 *    se derivó al doctor, no responde (422): lo clínico lo contesta el doctor;
 *  - responder es hacerse cargo: queda a su nombre. Una conversación derivada
 *    sigue derivada (el doctor la tiene pendiente) y conserva a quien la derivó.
 *
 * @param current - Asignación actual (`NEW` si no hay).
 * @param userId - Quien responde.
 * @param hints - Si hay un mensaje clínico del paciente sin responder.
 * @returns El plan o el motivo del rechazo.
 */
export function planReply(
  current: TakeInput,
  userId: string,
  hints: { readonly openClinical: boolean },
): ReplyPlan {
  if (heldByOther(current, userId))
    return { ok: false, reason: 'HELD_BY_OTHER' };
  if (hints.openClinical && current.status !== 'WAITING_DOCTOR') {
    return { ok: false, reason: 'CLINICAL_REQUIRES_DERIVATION' };
  }
  if (current.status === 'WAITING_DOCTOR') {
    return {
      ok: true,
      status: 'WAITING_DOCTOR',
      assignedUserId: current.assignedUserId ?? userId,
    };
  }
  return { ok: true, status: 'TAKEN', assignedUserId: userId };
}

/**
 * ¿Una conversación resuelta se reabre cuando alguien escribe? Solo si escribe
 * el paciente: que el doctor o su equipo respondan no la reabre.
 *
 * @param status - Estado actual.
 * @param senderIsPatient - Quien escribió es el paciente (no el doctor ni su equipo).
 * @returns `true` si pasa a `NEW`.
 */
export function reopensOnMessage(
  status: AssignmentState,
  senderIsPatient: boolean,
): boolean {
  return status === 'RESOLVED' && senderIsPatient;
}

/**
 * ¿Algún mensaje del paciente aún sin responder parece clínico?
 *
 * @param unansweredPatientTexts - Textos del paciente posteriores a la última respuesta del doctor o su equipo.
 * @param isClinical - Heurística de contenido clínico.
 * @returns `true` si hay alguno clínico.
 */
export function hasOpenClinical(
  unansweredPatientTexts: readonly (string | null | undefined)[],
  isClinical: (text: string) => boolean,
): boolean {
  return unansweredPatientTexts.some((text) => !!text && isClinical(text));
}
