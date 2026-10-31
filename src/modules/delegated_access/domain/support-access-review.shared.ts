import {
  PERMISSION_ATOM_BY_CODE,
  atomsOfAction,
  type PermissionSensitivity,
} from './support-permission-catalog';
import type { ReviewKind } from './support-reviewer-resolver';

/**
 * Piezas comunes de las campañas de certificación (CONTRATO-GOBIERNO §6.2):
 * valores por defecto, sensibilidad y «sin uso».
 */

export const DAY_MS = 86_400_000;

/** Acción para lo no certificado (`delegated_access:UNCERTIFIED_*`). */
export type UncertifiedAction = 'UNCERTIFIED_REVOKE' | 'UNCERTIFIED_ESCALATE';

/** Estado de un ítem (`delegated_access:REVIEW_ITEM_*` sin el prefijo). */
export type ReviewItemState =
  'PENDING' | 'CERTIFIED' | 'REVOKED' | 'ADJUSTED' | 'AUTO_REVOKED' | 'SKIPPED';

/** Decisión de un revisor. */
export type ReviewDecision = 'CERTIFY' | 'REVOKE' | 'ADJUST';

/** Valores por defecto de las campañas (los ajustes de la organización los reemplazan). */
export const REVIEW_DEFAULTS = {
  /** Un permiso sin `PERMIT` en estos días está «sin uso» (D-04/§6.1). */
  unusedDays: 60,
  /** Días de gracia tras el vencimiento (D-09). */
  graceDays: 7,
  reminderDaysBefore: [7, 3, 1] as readonly number[],
  escalateAfterDays: 3,
  /** Un administrador delegado no lanza campañas que vencen antes de estos días. */
  delegateMinDueDays: 7,
  /** …ni con menos de estos días de gracia (el barrido revoca a `fecha + gracia`). */
  delegateMinGraceDays: 3,
  /** Largo mínimo del comentario de una decisión que lo exige. */
  commentMinLength: 10,
  /** Recertificación mensual: se abren ítems a esta distancia del vencimiento. */
  recertificationHorizonDays: 30,
  /** Cadencia (D-08): 6 meses si hay átomo ALTA o CRÍTICA, si no 12. */
  highRiskCadenceMonths: 6,
  lowRiskCadenceMonths: 12,
  /** D-09: lo no certificado se revoca; las campañas de cambio de rol solo escalan. */
  defaultUncertifiedAction: (kind: ReviewKind): UncertifiedAction =>
    kind === 'MOVER' ? 'UNCERTIFIED_ESCALATE' : 'UNCERTIFIED_REVOKE',
} as const;

const SENSITIVITY_ORDER: readonly PermissionSensitivity[] = [
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL',
];

/** Posición de una sensibilidad (BAJA 0 … CRÍTICA 3). */
export function sensitivityRank(s: PermissionSensitivity): number {
  return SENSITIVITY_ORDER.indexOf(s);
}

const SENSITIVITY_ALIASES: Readonly<Record<string, PermissionSensitivity>> = {
  LOW: 'LOW',
  BAJA: 'LOW',
  MEDIUM: 'MEDIUM',
  MEDIA: 'MEDIUM',
  HIGH: 'HIGH',
  ALTA: 'HIGH',
  CRITICAL: 'CRITICAL',
  CRITICA: 'CRITICAL',
  CRÍTICA: 'CRITICAL',
};

/** Sensibilidad por su nombre del contrato (`ALTA`) o del catálogo (`HIGH`); `undefined` si no se reconoce. */
export function normalizeSensitivity(
  value: string | undefined | null,
): PermissionSensitivity | undefined {
  return value ? SENSITIVITY_ALIASES[value.trim().toUpperCase()] : undefined;
}

/** Mayor sensibilidad de una lista de átomos o alias; `null` si no hay ninguno conocido. */
export function maxSensitivityOf(
  codes: Iterable<string>,
): PermissionSensitivity | null {
  let best: PermissionSensitivity | null = null;
  for (const code of codes) {
    for (const { atom } of atomsOfAction(code)) {
      const s = PERMISSION_ATOM_BY_CODE.get(atom)?.sensitivity;
      if (s && (best === null || sensitivityRank(s) > sensitivityRank(best)))
        best = s;
    }
  }
  return best;
}

/**
 * ¿El permiso está sin uso? Sin `PERMIT` en `unusedDays` (60 por defecto) desde
 * el último uso o, si nunca se usó, desde que se creó; un permiso recién creado
 * no lo está. Sin ningún dato se considera sin uso.
 */
export function isGrantUnused(input: {
  readonly lastUsedAt?: Date | null;
  readonly createdAt?: Date | null;
  readonly now: Date;
  readonly unusedDays?: number;
}): boolean {
  const ref = input.lastUsedAt ?? input.createdAt;
  if (!ref) return true;
  return (
    input.now.getTime() - ref.getTime() >=
    (input.unusedDays ?? REVIEW_DEFAULTS.unusedDays) * DAY_MS
  );
}
