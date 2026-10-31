import { targetWithin, type GrantTargetFacts } from './support-grant-targets';

/**
 * Cuatro ojos de los permisos con átomos CRÍTICA (`GRANT_CHANGE`, V-3): cuándo
 * una escritura necesita la aprobación de una segunda persona. Pide aprobación
 * quien da un átomo crítico que la persona no tenía, pero TAMBIÉN quien amplía
 * un átomo crítico ya concedido: sobre un objetivo que lo ya concedido no
 * cubre, o con una vigencia que lo ya aprobado no alcanza. Todo es puro y falla
 * cerrado: lo que no se puede probar «dentro» de lo ya aprobado cuenta como
 * ampliación.
 */

/** Por qué una escritura pide la aprobación de otra persona. */
export type CriticalApprovalReason =
  'NEW_CRITICAL_ATOMS' | 'SCOPE_WIDENED' | 'VALIDITY_EXTENDED';

/** Un permiso `ALLOW` vivo que la persona ya tiene (el estado actual, ya aprobado). */
export interface HeldCriticalGrant {
  /** Átomos que da (alias ya expandidos). */
  readonly atoms: readonly string[];
  /** Objetivo enriquecido (doctor, ruta del espacio, sede). */
  readonly target: GrantTargetFacts;
  /** Fin de vigencia; ausente = sin fin. */
  readonly validTo?: Date;
}

/** Lo que se quiere dejar escrito. */
export interface CriticalApprovalInput {
  /** Átomos CRÍTICA del permiso resultante. */
  readonly atoms: readonly string[];
  /** Objetivo del permiso resultante. */
  readonly target: GrantTargetFacts;
  /** Fin de vigencia del permiso resultante; ausente = sin fin. */
  readonly validTo?: Date;
  /** Permisos que la persona ya tiene vivos. */
  readonly held: readonly HeldCriticalGrant[];
}

/** Lo que obliga a pedir la aprobación. */
export interface CriticalApprovalNeed {
  /** Átomos que amplían (únicos, ordenados). */
  readonly atoms: string[];
  /** Motivos (únicos, en orden estable). */
  readonly reasons: CriticalApprovalReason[];
}

const REASON_ORDER: readonly CriticalApprovalReason[] = [
  'NEW_CRITICAL_ATOMS',
  'SCOPE_WIDENED',
  'VALIDITY_EXTENDED',
];

/**
 * Cota superior de lo que cubre un objetivo: un permiso `FIXED` congela lo que
 * cubre hoy, que nunca es más que su versión `DYNAMIC` con las mismas
 * referencias; sin foto no hay celdas y se mediría como «nada». Se mide con la
 * versión `DYNAMIC` (más amplia, nunca más estrecha).
 */
function upperBound(target: GrantTargetFacts): GrantTargetFacts {
  if (target.expansionMode !== 'FIXED' || target.snapshot) return target;
  return { ...target, expansionMode: 'DYNAMIC' };
}

/**
 * El objetivo que tendrá un permiso DESPUÉS de cambiarle el modo de expansión:
 * `FIXED` → `DYNAMIC` suelta la foto y el permiso sigue a toda la organización
 * (amplía); `DYNAMIC` → `FIXED` congela lo que cubre hoy (nunca amplía). Es la
 * medida que comparten la administración delegada (`TeamAdminPolicy`) y el
 * cuatro ojos de los permisos críticos.
 *
 * @param target - Objetivo actual del permiso.
 * @param expansionMode - Modo pedido (si cambia).
 * @returns El objetivo resultante.
 */
export function targetAfterExpansionChange(
  target: GrantTargetFacts,
  expansionMode: 'DYNAMIC' | 'FIXED' | undefined,
): GrantTargetFacts {
  if (!expansionMode || expansionMode === target.expansionMode) return target;
  const { snapshot: _snapshot, ...rest } = target;
  return expansionMode === 'DYNAMIC'
    ? { ...rest, expansionMode: 'DYNAMIC' }
    : { ...target, expansionMode: 'FIXED' };
}

/** ¿La vigencia propuesta cabe en la de lo ya concedido? */
function validityWithin(proposed: Date | undefined, held: Date | undefined) {
  if (!held) return true;
  return proposed !== undefined && proposed.getTime() <= held.getTime();
}

/**
 * Decide si escribir este permiso necesita la aprobación de otra persona.
 *
 * Por cada átomo crítico: sin ningún permiso vivo que lo dé → `NEW_CRITICAL_ATOMS`;
 * si ninguno lo da sobre un objetivo que CONTENGA al propuesto → `SCOPE_WIDENED`;
 * si alguno lo cubre pero ninguno de los que cubren llega a la vigencia
 * propuesta → `VALIDITY_EXTENDED`. La cobertura y la vigencia deben venir del
 * MISMO permiso (no se combina el alcance de uno con la vigencia de otro).
 *
 * @param input - Átomos críticos, objetivo y vigencia resultantes y lo ya concedido.
 * @returns Lo que obliga a pedir aprobación; `undefined` si nada se amplía.
 */
export function criticalApprovalNeed(
  input: CriticalApprovalInput,
): CriticalApprovalNeed | undefined {
  const proposed = upperBound(input.target);
  const atoms = new Set<string>();
  const reasons = new Set<CriticalApprovalReason>();
  for (const atom of [...new Set(input.atoms)].sort()) {
    const holders = input.held.filter((h) => h.atoms.includes(atom));
    if (holders.length === 0) {
      atoms.add(atom);
      reasons.add('NEW_CRITICAL_ATOMS');
      continue;
    }
    // Lo ya concedido se mide TAL CUAL (un `FIXED` sin foto no cubre nada).
    const covering = holders.filter((h) => targetWithin(proposed, h.target));
    if (covering.length === 0) {
      atoms.add(atom);
      reasons.add('SCOPE_WIDENED');
      continue;
    }
    if (!covering.some((h) => validityWithin(input.validTo, h.validTo))) {
      atoms.add(atom);
      reasons.add('VALIDITY_EXTENDED');
    }
  }
  if (atoms.size === 0) return undefined;
  return {
    atoms: [...atoms].sort(),
    reasons: REASON_ORDER.filter((r) => reasons.has(r)),
  };
}
