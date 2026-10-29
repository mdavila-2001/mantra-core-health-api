import { FORMS } from '../infrastructure-catalog';
import type { PlanRow } from './floor-plans.repository';
import type { SignedBackgroundUrl } from './plan-background-url.service';
import type { FloorPlanMeta, FloorPlanSummary } from './floor-plan.types';

/**
 * Metadatos de un lienzo para la respuesta. El fondo lleva una URL firmada y
 * nunca el id del archivo.
 *
 * @param plan - Fila del lienzo.
 * @param background - URL firmada del fondo vigente, si hay.
 * @returns El DTO.
 */
export function toFloorPlanMeta(
  plan: PlanRow,
  background: SignedBackgroundUrl | null,
): FloorPlanMeta {
  return {
    id: plan.id,
    siteId: plan.siteId,
    code: plan.code,
    name: plan.name,
    anchor: toAnchor(plan),
    widthM: plan.widthM,
    heightM: plan.heightM,
    elevationM: plan.elevationM,
    northBearingDeg: plan.northBearingDeg,
    gridSizeM: plan.gridSizeM,
    snapToGrid: plan.snapToGrid,
    contactToleranceM: plan.contactToleranceM,
    background:
      plan.backgroundFileId && background && plan.backgroundScaleMPerPx !== null
        ? {
            scaleMPerPx: plan.backgroundScaleMPerPx,
            offsetXM: plan.backgroundOffsetXM,
            offsetYM: plan.backgroundOffsetYM,
            rotationDeg: plan.backgroundRotationDeg,
            opacity: plan.backgroundOpacity,
            url: background.url,
            urlExpiresAt: background.expiresAt,
          }
        : null,
    layoutVersion: plan.layoutVersion,
    layoutChangedAt: plan.layoutChangedAt,
    rowVersion: plan.rowVersion,
    validFrom: plan.validFrom,
    validTo: plan.validTo,
    retired: plan.retired,
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
  };
}

/** Ancla de un lienzo, o `null` si es el campus. */
export function toAnchor(plan: PlanRow): FloorPlanMeta['anchor'] {
  if (!plan.anchorSpaceId) return null;
  return {
    spaceId: plan.anchorSpaceId,
    code: plan.anchorCode ?? '',
    name: plan.anchorName ?? '',
    form: FORMS.byConceptId(plan.anchorFormConceptId)?.code ?? null,
  };
}

/** Resumen de un lienzo para el selector de la sede. */
export function toFloorPlanSummary(
  plan: PlanRow & { placed: number; unplaced: number; elements: number },
): FloorPlanSummary {
  return {
    id: plan.id,
    code: plan.code,
    name: plan.name,
    anchor: toAnchor(plan),
    widthM: plan.widthM,
    heightM: plan.heightM,
    elevationM: plan.elevationM,
    layoutVersion: plan.layoutVersion,
    validFrom: plan.validFrom,
    validTo: plan.validTo,
    counts: {
      placed: plan.placed,
      unplaced: plan.unplaced,
      elements: plan.elements,
    },
  };
}
