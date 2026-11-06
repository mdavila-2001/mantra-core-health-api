import type { LifecycleState } from '../structure/lifecycle';
import {
  AVAILABILITY_FOR_KIND,
  BLOCK_REASONS,
  KIND_PRECEDENCE,
  type AvailabilityCode,
  type BlockKindCode,
  type IsolationCode,
  type OccupancyCode,
} from './ops-catalog';
import type { Verdict } from './cleaning-rules';

/** Acciones de `POST /care-spaces/:id/availability`. */
export type AvailabilityAction =
  'block' | 'unblock' | 'start-maintenance' | 'close' | 'reopen';

/** Tipo de bloqueo que abre cada acción (las de cierre de bloqueo no abren). */
export function kindForAction(
  action: AvailabilityAction,
  requestedKind?: string,
): BlockKindCode | null {
  if (action === 'start-maintenance') return 'BLOCK_MAINTENANCE';
  if (action === 'close') return 'BLOCK_CLOSURE';
  if (action === 'block') {
    return requestedKind === 'BLOCK_ADMIN' ? 'BLOCK_ADMIN' : 'BLOCK_CLINICAL';
  }
  return null;
}

/** Tipos de bloqueo que termina cada acción de cierre. */
export function kindsEndedBy(action: AvailabilityAction): BlockKindCode[] {
  if (action === 'unblock') return ['BLOCK_CLINICAL', 'BLOCK_ADMIN'];
  if (action === 'reopen') return ['BLOCK_CLOSURE'];
  return [];
}

/**
 * Valida un bloqueo nuevo (CONTRATO-F2-F5 §F2.3, `POST …/availability`).
 * Orden: tipo pedido coherente → motivo presente → motivo del tipo → texto de
 * OTHER → fecha estimada de mantenimiento → ciclo de vida → ocupación.
 *
 * @param input - Pedido y estado actual.
 */
export function judgeBlockRequest(input: {
  action: AvailabilityAction;
  kindCode?: string;
  reasonCode?: string;
  reasonText?: string;
  expectedEndAt?: Date | null;
  startsAt?: Date | null;
  lifecycle: LifecycleState;
  occupancy: OccupancyCode;
}): Verdict & { kind?: BlockKindCode } {
  const kind = kindForAction(input.action, input.kindCode);
  if (!kind) return { ok: true };
  if (
    input.action === 'block' &&
    input.kindCode &&
    input.kindCode !== 'BLOCK_CLINICAL' &&
    input.kindCode !== 'BLOCK_ADMIN'
  ) {
    return {
      ok: false,
      reason: 'BLOCK_REASON_KIND_MISMATCH',
      details: { kindCode: input.kindCode },
    };
  }
  if (!input.reasonCode) return { ok: false, reason: 'BLOCK_REASON_REQUIRED' };
  const reason = BLOCK_REASONS[input.reasonCode];
  if (!reason || !reason.kinds.includes(kind)) {
    return {
      ok: false,
      reason: 'BLOCK_REASON_KIND_MISMATCH',
      details: { reasonCode: input.reasonCode, kindCode: kind },
    };
  }
  if (input.reasonCode === 'BLOCK_RSN_OTHER' && !input.reasonText?.trim())
    return { ok: false, reason: 'BLOCK_REASON_TEXT_REQUIRED' };
  if (kind === 'BLOCK_MAINTENANCE' && !input.expectedEndAt)
    return { ok: false, reason: 'BLOCK_EXPECTED_END_REQUIRED' };
  if (
    input.expectedEndAt &&
    input.expectedEndAt.getTime() <= (input.startsAt ?? new Date()).getTime()
  ) {
    return { ok: false, reason: 'BLOCK_EXPECTED_END_REQUIRED' };
  }
  if (input.lifecycle !== 'ACTIVE')
    return { ok: false, reason: 'SPACE_NOT_ACTIVE' };
  if (input.occupancy !== 'OCC_FREE')
    return { ok: false, reason: 'SPACE_OCCUPIED' };
  return { ok: true, kind };
}

/**
 * Disponibilidad derivada de los bloqueos vigentes (abiertos y ya
 * empezados): el tipo de mayor precedencia manda; sin bloqueos, AVAILABLE.
 *
 * @param openKinds - Tipos de los bloqueos vigentes.
 */
export function availabilityFromBlocks(
  openKinds: readonly BlockKindCode[],
): AvailabilityCode {
  for (const kind of KIND_PRECEDENCE) {
    if (openKinds.includes(kind)) return AVAILABILITY_FOR_KIND[kind];
  }
  return 'SPACE_OP_AVAILABLE';
}

/** Lo que exige cada aislamiento del espacio (§F2.2). */
export interface IsolationCapability {
  readonly functionCode: string | null;
  readonly pressureCode: string | null;
  readonly hvacValidatedOn: Date | null;
}

/**
 * ¿El espacio puede alojar el aislamiento? `ISO_AIRBORNE` exige función
 * `ISOLATION_AIIR`, presión negativa y validación HVAC dentro de
 * `maxHvacDays`; `ISO_PROTECTIVE` exige `PROTECTIVE_ENV` y presión positiva.
 * Las camas heredan la capacidad de su habitación (el llamador pasa la del
 * espacio o la de su padre `ROOM`).
 *
 * @param isolation - Aislamiento pedido.
 * @param cap - Capacidad del espacio.
 * @param maxHvacDays - `infra.hvac_validation_max_days`.
 * @param now - Referencia temporal.
 */
export function judgeIsolationCapability(
  isolation: IsolationCode,
  cap: IsolationCapability,
  maxHvacDays: number,
  now: Date,
): Verdict {
  const missing: string[] = [];
  if (isolation === 'ISO_AIRBORNE') {
    if (cap.functionCode !== 'SPACE_FN_ISOLATION_AIIR') missing.push('AIIR');
    if (cap.pressureCode !== 'PRESSURE_NEGATIVE')
      missing.push('NEGATIVE_PRESSURE');
    const limit = now.getTime() - maxHvacDays * 86_400_000;
    if (!cap.hvacValidatedOn || cap.hvacValidatedOn.getTime() < limit)
      missing.push('HVAC_VALIDATION');
  }
  if (isolation === 'ISO_PROTECTIVE') {
    if (cap.functionCode !== 'SPACE_FN_PROTECTIVE_ENV')
      missing.push('PROTECTIVE_ENV');
    if (cap.pressureCode !== 'PRESSURE_POSITIVE')
      missing.push('POSITIVE_PRESSURE');
  }
  return missing.length === 0
    ? { ok: true }
    : { ok: false, reason: 'ISOLATION_ROOM_NOT_CAPABLE', details: { missing } };
}
