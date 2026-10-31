import type { EngagementRequestItems } from '../entities';
import type { SupportTargetKind } from '../domain';
import type { ItemDecisionDto } from '../dto';
import { TARGET_KIND_BY_CONCEPT } from './support-grant-facts';

/** Lo que una decisión sobre un ítem de solicitud realmente concede. */
export interface ItemEmission {
  readonly kind: SupportTargetKind;
  readonly refs: {
    readonly practitionerRoleAssignmentId?: string;
    readonly healthcareServiceId?: string;
    readonly careSpaceId?: string;
    readonly practiceSiteId?: string;
  };
  /** Átomos o alias que se concederán. */
  readonly actions: string[];
  readonly condition?: Record<string, unknown>;
  readonly validTo?: Date;
  readonly expansionMode: 'DYNAMIC' | 'FIXED';
}

/**
 * ÚNICA fuente de lo que se emite al aprobar un ítem: la usan `emitGrant` (para
 * escribir) y el techo del administrador delegado (para medir). Así no se puede
 * medir una cosa y conceder otra: el ajuste (`adjustment`) solo cuenta con
 * `ADJUSTED`; con `APPROVED` se concede lo propuesto (o `decision.actions`).
 *
 * @param item - Ítem de la solicitud.
 * @param decision - Decisión sobre el ítem.
 * @returns Objetivo, acciones, condición, vigencia y modo que se emitirán.
 */
export function emissionOf(
  item: EngagementRequestItems,
  decision: ItemDecisionDto,
): ItemEmission {
  const adjusted =
    decision.decision === 'ADJUSTED' ? decision.adjustment : undefined;
  const kind =
    adjusted?.targetKind ?? TARGET_KIND_BY_CONCEPT[item.targetKindConceptId];
  const refs = adjusted
    ? {
        practitionerRoleAssignmentId: adjusted.practitionerRoleAssignmentId,
        healthcareServiceId: adjusted.healthcareServiceId,
        careSpaceId: adjusted.careSpaceId,
        practiceSiteId: adjusted.practiceSiteId,
      }
    : {
        practitionerRoleAssignmentId: item.practitionerRoleAssignmentId,
        healthcareServiceId: item.healthcareServiceId,
        careSpaceId: item.careSpaceId,
        practiceSiteId: item.practiceSiteId,
      };
  const actions =
    decision.actions ??
    adjusted?.actions ??
    (item.proposedActionsJson as string[]);
  const condition = decision.condition ?? adjusted?.condition;
  return {
    kind,
    refs,
    actions,
    ...(condition ? { condition } : {}),
    ...(decision.validTo ? { validTo: new Date(decision.validTo) } : {}),
    expansionMode: decision.expansionMode ?? 'DYNAMIC',
  };
}
