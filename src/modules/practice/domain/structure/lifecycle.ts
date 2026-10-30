import type { Verdict } from './structure-rules';

/**
 * Máquina de estados del ciclo de vida administrativo (PLAN §2.2, primer eje):
 * planificado → activo ⇄ suspendido → retirado. Es la misma para espacios y
 * unidades; cambia el prefijo del código (`SPACE_` / `UNIT_`).
 */

/** Estado del ciclo de vida sin prefijo. */
export type LifecycleState = 'PLANNED' | 'ACTIVE' | 'SUSPENDED' | 'RETIRED';

/** Acción pedida en `POST …/lifecycle`. */
export type LifecycleAction = 'activate' | 'suspend' | 'reactivate' | 'retire';

/** Acciones válidas. */
export const LIFECYCLE_ACTIONS: readonly LifecycleAction[] = [
  'activate',
  'suspend',
  'reactivate',
  'retire',
];

const TRANSITIONS: Readonly<
  Record<
    LifecycleAction,
    { readonly from: readonly LifecycleState[]; readonly to: LifecycleState }
  >
> = {
  activate: { from: ['PLANNED'], to: 'ACTIVE' },
  suspend: { from: ['ACTIVE'], to: 'SUSPENDED' },
  reactivate: { from: ['SUSPENDED'], to: 'ACTIVE' },
  retire: { from: ['PLANNED', 'ACTIVE', 'SUSPENDED'], to: 'RETIRED' },
};

/** Acciones que exigen motivo (contrato §3). */
const REASON_REQUIRED: ReadonlySet<LifecycleAction> = new Set([
  'suspend',
  'retire',
]);

/**
 * Estado de destino de una acción, o el veredicto de por qué no.
 *
 * @param current - Estado actual.
 * @param action - Acción pedida.
 * @param reason - Motivo declarado.
 */
export function judgeTransition(
  current: LifecycleState,
  action: LifecycleAction,
  reason: string | undefined,
): Verdict & { to?: LifecycleState } {
  const t = TRANSITIONS[action];
  if (!t.from.includes(current)) {
    return {
      ok: false,
      reason: 'SPACE_INVALID_TRANSITION',
      details: { from: current, action, allowedFrom: [...t.from] },
    };
  }
  if (REASON_REQUIRED.has(action) && !reason?.trim()) {
    return {
      ok: false,
      reason: 'LIFECYCLE_REASON_REQUIRED',
      details: { action },
    };
  }
  return { ok: true, to: t.to };
}

/**
 * Un hijo no puede quedar «más activo» que su padre (invariante 5).
 *
 * @param target - Estado al que va el hijo.
 * @param parent - Estado del padre, o `null` si no tiene.
 */
export function judgeParentAllows(
  target: LifecycleState,
  parent: LifecycleState | null,
): Verdict {
  if (parent === null) return { ok: true };
  if (target === 'ACTIVE' && parent !== 'ACTIVE') {
    return {
      ok: false,
      reason: 'PARENT_NOT_ACTIVE',
      details: { parentStatus: parent },
    };
  }
  // Un hijo suspendido puede colgar de un padre activo o suspendido, nunca de
  // uno planificado (no estuvo activo) ni retirado.
  if (target === 'SUSPENDED' && parent !== 'ACTIVE' && parent !== 'SUSPENDED') {
    return {
      ok: false,
      reason: 'PARENT_NOT_ACTIVE',
      details: { parentStatus: parent },
    };
  }
  if (target === 'PLANNED' && parent !== 'ACTIVE' && parent !== 'PLANNED') {
    return {
      ok: false,
      reason: 'PARENT_NOT_ACTIVE',
      details: { parentStatus: parent },
    };
  }
  return { ok: true };
}

/** `SPACE_ACTIVE` → `ACTIVE`; `null` si no es de ciclo de vida. */
export function lifecycleStateOf(
  code: string | undefined | null,
): LifecycleState | null {
  const m = /^(?:SPACE|UNIT)_(PLANNED|ACTIVE|SUSPENDED|RETIRED)$/.exec(
    code ?? '',
  );
  return m ? (m[1] as LifecycleState) : null;
}
