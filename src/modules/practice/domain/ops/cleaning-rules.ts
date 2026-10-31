import type {
  CleaningStatusCode,
  CleaningTypeCode,
  HygieneCode,
} from './ops-catalog';

/** Veredicto de una regla: `ok` o el `reason` del contrato con su detalle. */
export type Verdict =
  | { readonly ok: true }
  | {
      readonly ok: false;
      readonly reason: string;
      readonly details?: Record<string, unknown>;
    };

const OK: Verdict = { ok: true };

/** Transiciones de una orden de limpieza (CONTRATO-F2-F5 §F2.3). */
export type CleaningAction =
  'assign' | 'start' | 'finish' | 'inspect' | 'cancel';

/** Estados de origen permitidos y estado de destino por acción. */
const TRANSITIONS: Record<
  CleaningAction,
  { from: readonly CleaningStatusCode[]; to: CleaningStatusCode | null }
> = {
  assign: { from: ['CLN_PENDING', 'CLN_IN_PROGRESS'], to: null },
  start: { from: ['CLN_PENDING'], to: 'CLN_IN_PROGRESS' },
  finish: { from: ['CLN_IN_PROGRESS'], to: 'CLN_DONE' },
  inspect: { from: ['CLN_DONE'], to: 'CLN_INSPECTED' },
  cancel: {
    from: ['CLN_PENDING', 'CLN_IN_PROGRESS', 'CLN_DONE'],
    to: 'CLN_CANCELLED',
  },
};

/**
 * ¿Se puede aplicar `action` a una orden en `from`? 409
 * `CLEANING_ORDER_INVALID_TRANSITION` con `details.from/to` si no.
 *
 * @param from - Estado actual.
 * @param action - Acción pedida.
 * @param failed - Inspección rechazada (el destino es `CLN_REJECTED`).
 */
export function judgeCleaningTransition(
  from: CleaningStatusCode,
  action: CleaningAction,
  failed = false,
): Verdict & { to?: CleaningStatusCode } {
  const rule = TRANSITIONS[action];
  const to: CleaningStatusCode =
    action === 'inspect' && failed ? 'CLN_REJECTED' : (rule.to ?? from);
  if (!rule.from.includes(from)) {
    return {
      ok: false,
      reason: 'CLEANING_ORDER_INVALID_TRANSITION',
      details: { from, to, action },
    };
  }
  return { ok: true, to };
}

/** Higiene que deja cada transición (`null` = no cambia). */
export function hygieneAfter(
  action: CleaningAction,
  failed = false,
): HygieneCode | null {
  switch (action) {
    case 'start':
      return 'HYG_CLEANING';
    case 'finish':
      return 'HYG_CLEAN';
    case 'inspect':
      return failed ? 'HYG_DIRTY' : 'HYG_INSPECTED';
    default:
      return null;
  }
}

/**
 * Reglas de la inspección: quien terminó no inspecciona (422
 * `INSPECTION_BY_CLEANER_NOT_ALLOWED`), un FAIL exige motivo (422
 * `INSPECTION_REASON_REQUIRED`) y una orden terminal la inspecciona sólo un
 * supervisor (403 `TERMINAL_INSPECTION_REQUIRES_SUPERVISOR`).
 *
 * @param input - Datos de la inspección.
 */
export function judgeInspection(input: {
  inspectorUserId: string;
  finishedByUserId?: string | null;
  failed: boolean;
  reasonText?: string | null;
  terminal: boolean;
  inspectorIsSupervisor: boolean;
}): Verdict {
  if (
    input.finishedByUserId &&
    input.finishedByUserId === input.inspectorUserId
  )
    return { ok: false, reason: 'INSPECTION_BY_CLEANER_NOT_ALLOWED' };
  if (input.failed && !input.reasonText?.trim())
    return { ok: false, reason: 'INSPECTION_REASON_REQUIRED' };
  if (input.terminal && !input.inspectorIsSupervisor)
    return { ok: false, reason: 'TERMINAL_INSPECTION_REQUIRES_SUPERVISOR' };
  return OK;
}

/**
 * Pedido manual de orden: con limpieza terminal pendiente sólo vale
 * `CLEAN_TERMINAL` (422 `TERMINAL_CLEANING_REQUIRED`).
 *
 * @param type - Tipo pedido.
 * @param terminalRequired - Bandera del espacio.
 */
export function judgeManualCleaningType(
  type: CleaningTypeCode,
  terminalRequired: boolean,
): Verdict {
  if (terminalRequired && type !== 'CLEAN_TERMINAL')
    return { ok: false, reason: 'TERMINAL_CLEANING_REQUIRED' };
  return OK;
}

/**
 * Tipo efectivo: con limpieza terminal pendiente toda orden se fuerza a
 * TERMINAL (§F2.2, máquina de higiene).
 *
 * @param type - Tipo pedido o por defecto.
 * @param terminal - Bandera del espacio o del disparador.
 */
export function effectiveCleaningType(
  type: CleaningTypeCode,
  terminal: boolean,
): CleaningTypeCode {
  return terminal ? 'CLEAN_TERMINAL' : type;
}
