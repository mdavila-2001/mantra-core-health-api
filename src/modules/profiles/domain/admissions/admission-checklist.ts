import type {
  AdmissionEvidenceKind,
  AdmissionItemType,
  ProfessionGroup,
} from './admission-requirements.catalog';

/** Estado de la revisión de un ítem, como viaja por la API. */
export type ReviewState = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'INFO_REQUIRED';

/** Estado agregado de un requisito. */
export type RequirementState =
  /** Opcional y sin ítems: el médico no declaró nada. */
  | 'NOT_PROVIDED'
  /** Obligatorio y sin ítems: falta lo que hay que revisar. */
  | 'MISSING'
  | 'PENDING'
  | 'INFO_REQUIRED'
  | 'VERIFIED'
  | 'REJECTED';

/** Un requisito del catálogo, ya cargado. */
export interface ChecklistRequirement {
  readonly id: string;
  readonly code: string;
  readonly label: string;
  readonly description?: string;
  readonly itemType: AdmissionItemType;
  readonly itemSubtype?: string;
  readonly evidence: AdmissionEvidenceKind;
  readonly required: boolean;
  readonly requiresSourceUri: boolean;
  readonly professionGroup?: ProfessionGroup;
  readonly minItems?: number;
  readonly maxItems?: number;
  readonly sortOrder: number;
}

/** El estado de un ítem revisado, lo único que el cálculo necesita. */
export interface ChecklistItemState {
  readonly state: ReviewState;
}

/** Por qué un requisito impide verificar la admisión. */
export type ChecklistBlockReason =
  'MISSING' | 'REJECTED' | 'PENDING' | 'INFO_REQUIRED' | 'BELOW_MINIMUM';

/** Resultado de evaluar un requisito. */
export interface RequirementEvaluation {
  readonly state: RequirementState;
  readonly verified: number;
  readonly rejected: number;
  readonly unresolved: number;
  /** El requisito está cumplido (verificado y con los ítems mínimos). */
  readonly satisfied: boolean;
  /** Causa por la que impide verificar, o `null` si no la impide. */
  readonly blockedBy: ChecklistBlockReason | null;
}

/** Los requisitos que aplican a un grupo profesional (todos si no se acota). */
export function applicableRequirements<T extends ChecklistRequirement>(
  requirements: readonly T[],
  group: ProfessionGroup,
): T[] {
  return requirements
    .filter(
      (r) => r.professionGroup === undefined || r.professionGroup === group,
    )
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/**
 * Evalúa un requisito a partir del estado de sus ítems.
 *
 * Reglas (las decide el servidor; el cliente no promueve nada):
 * - Un obligatorio sin ítems está FALTANTE y bloquea.
 * - Con ítems sin resolver (pendientes o con información requerida) bloquea,
 *   sea obligatorio u opcional: se revisa todo lo que el médico subió.
 * - Resueltos todos: el requisito está VERIFICADO si al menos uno lo está (un
 *   título extra rechazado no tumba al que sí se verificó) y RECHAZADO si todos
 *   fueron rechazados. Un obligatorio RECHAZADO bloquea; un opcional rechazado no.
 * - Obligatorio verificado pero con menos ítems verificados que `minItems`
 *   bloquea (BELOW_MINIMUM).
 */
export function evaluateRequirement(
  requirement: Pick<ChecklistRequirement, 'required' | 'minItems'>,
  items: readonly ChecklistItemState[],
): RequirementEvaluation {
  const verified = items.filter((i) => i.state === 'VERIFIED').length;
  const rejected = items.filter((i) => i.state === 'REJECTED').length;
  const infoRequired = items.filter((i) => i.state === 'INFO_REQUIRED').length;
  const pending = items.filter((i) => i.state === 'PENDING').length;
  const unresolved = infoRequired + pending;

  if (items.length === 0) {
    return requirement.required
      ? {
          state: 'MISSING',
          verified,
          rejected,
          unresolved,
          satisfied: false,
          blockedBy: 'MISSING',
        }
      : {
          state: 'NOT_PROVIDED',
          verified,
          rejected,
          unresolved,
          satisfied: true,
          blockedBy: null,
        };
  }
  if (infoRequired > 0) {
    return {
      state: 'INFO_REQUIRED',
      verified,
      rejected,
      unresolved,
      satisfied: false,
      blockedBy: 'INFO_REQUIRED',
    };
  }
  if (pending > 0) {
    return {
      state: 'PENDING',
      verified,
      rejected,
      unresolved,
      satisfied: false,
      blockedBy: 'PENDING',
    };
  }
  if (verified > 0) {
    const min = requirement.minItems ?? 1;
    const belowMinimum = requirement.required && verified < min;
    return {
      state: 'VERIFIED',
      verified,
      rejected,
      unresolved,
      satisfied: !belowMinimum,
      blockedBy: belowMinimum ? 'BELOW_MINIMUM' : null,
    };
  }
  return {
    state: 'REJECTED',
    verified,
    rejected,
    unresolved,
    satisfied: !requirement.required,
    blockedBy: requirement.required ? 'REJECTED' : null,
  };
}

/** Un requisito con sus ítems, listo para evaluar. */
export interface ChecklistInput<I extends ChecklistItemState> {
  readonly requirement: ChecklistRequirement;
  readonly items: readonly I[];
}

/** Resumen del avance a nivel de requisito. */
export interface RequirementsSummary {
  readonly total: number;
  readonly verified: number;
  readonly rejected: number;
  readonly pending: number;
}

/** Un bloqueo concreto de la verificación. */
export interface ChecklistBlocker {
  readonly requirementCode: string;
  readonly label: string;
  readonly reason: ChecklistBlockReason;
}

/** Resultado de evaluar toda la lista. */
export interface ChecklistEvaluation<I extends ChecklistItemState> {
  readonly rows: ReadonlyArray<{
    readonly requirement: ChecklistRequirement;
    readonly items: readonly I[];
    readonly evaluation: RequirementEvaluation;
  }>;
  readonly summary: RequirementsSummary;
  readonly blockers: readonly ChecklistBlocker[];
  /** La admisión puede resolverse VERIFICADA. */
  readonly canVerify: boolean;
}

/**
 * Evalúa la lista completa.
 *
 * El resumen cuenta sólo los requisitos «en juego»: los obligatorios y los
 * opcionales que el médico declaró. Un opcional sin ítems no es avance ni
 * retraso.
 */
export function evaluateChecklist<I extends ChecklistItemState>(
  inputs: readonly ChecklistInput<I>[],
): ChecklistEvaluation<I> {
  const rows = inputs.map(({ requirement, items }) => ({
    requirement,
    items,
    evaluation: evaluateRequirement(requirement, items),
  }));

  let total = 0;
  let verified = 0;
  let rejected = 0;
  let pending = 0;
  const blockers: ChecklistBlocker[] = [];
  for (const { requirement, evaluation } of rows) {
    if (evaluation.state !== 'NOT_PROVIDED') {
      total += 1;
      if (evaluation.state === 'VERIFIED' && evaluation.satisfied)
        verified += 1;
      else if (evaluation.state === 'REJECTED') rejected += 1;
      else pending += 1;
    }
    if (evaluation.blockedBy) {
      blockers.push({
        requirementCode: requirement.code,
        label: requirement.label,
        reason: evaluation.blockedBy,
      });
    }
  }
  return {
    rows,
    summary: { total, verified, rejected, pending },
    blockers,
    // Falla cerrado: sin catálogo de requisitos no hay nada que verificar.
    canVerify: rows.length > 0 && blockers.length === 0,
  };
}
