import {
  TARGET_CONSTRAINTS,
  isEmptySnapshotRow,
  type FixedSnapshot,
  type TargetDimension,
} from './support-targets';
import type {
  SupportAccessQuery,
  SupportGrantFacts,
} from './support-access.types';

/** ¿Está `now` dentro de la ventana `[from, to)`? Un extremo ausente no acota. */
export function withinWindow(now: Date, from?: Date, to?: Date): boolean {
  if (from && from.getTime() > now.getTime()) return false;
  if (to && to.getTime() <= now.getTime()) return false;
  return true;
}

/**
 * ¿El espacio `careSpaceId` está dentro de la ubicación del permiso? La ruta
 * materializada lista, de la sede a la sala, todos los ancestros del espacio,
 * así que «dentro de» es «el id de la ubicación aparece en la ruta».
 */
function locationCovers(
  grant: SupportGrantFacts,
  query: SupportAccessQuery,
): boolean {
  if (!query.careSpaceId) return false;
  const anchor = grant.careSpaceId ?? grant.practiceSiteId;
  if (!anchor) return false;
  if (query.careSpaceId === anchor) return true;
  if (grant.practiceSiteId && query.careSpaceSiteId === grant.practiceSiteId) {
    return true;
  }
  return query.careSpacePath?.includes(`/${anchor}/`) === true;
}

/** Regla `DYNAMIC` de una dimensión acotada a un objetivo concreto. */
function specificCovers(
  dimension: TargetDimension,
  grant: SupportGrantFacts,
  query: SupportAccessQuery,
): boolean {
  if (dimension === 'practitioner') {
    return (
      !!grant.practitionerProfileId &&
      grant.practitionerProfileId === query.practitionerProfileId
    );
  }
  if (dimension === 'service') {
    return (
      !!grant.healthcareServiceId &&
      grant.healthcareServiceId === query.healthcareServiceId
    );
  }
  return locationCovers(grant, query);
}

/** ¿Alguna fila congelada coincide con la cita en cada dimensión que fija? */
function snapshotCovers(
  snapshot: FixedSnapshot,
  query: SupportAccessQuery,
): boolean {
  return snapshot.rows.some((row) => {
    // Una fila sin dimensiones cubriría todo: un dato roto no abre nada.
    if (isEmptySnapshotRow(row)) return false;
    if (row.practitionerRoleAssignmentId || row.practitionerProfileId) {
      const byRole =
        !!row.practitionerRoleAssignmentId &&
        query.practitionerRoleAssignmentIds?.includes(
          row.practitionerRoleAssignmentId,
        ) === true;
      const byProfile =
        !!row.practitionerProfileId &&
        row.practitionerProfileId === query.practitionerProfileId;
      if (!byRole && !byProfile) return false;
    }
    if (
      row.healthcareServiceId &&
      row.healthcareServiceId !== query.healthcareServiceId
    ) {
      return false;
    }
    if (row.careSpaceId && row.careSpaceId !== query.careSpaceId) return false;
    return true;
  });
}

/**
 * ¿Este permiso cubre la cita? Cada dimensión acotada debe cubrirse (cruce);
 * las libres no cuentan; «todos» cubre cualquier valor. Un permiso `FIXED`
 * cubre solo lo que alguna fila de su foto congelada lista.
 */
export function grantCovers(
  grant: SupportGrantFacts,
  query: SupportAccessQuery,
): boolean {
  if (grant.expansionMode === 'FIXED') {
    // Un permiso congelado sin foto no cubre nada: no se infiere de un dato roto.
    return grant.snapshot ? snapshotCovers(grant.snapshot, query) : false;
  }
  const constraints = TARGET_CONSTRAINTS[grant.targetKind];
  for (const dimension of ['practitioner', 'service', 'location'] as const) {
    const constraint = constraints[dimension];
    if (constraint === 'FREE' || constraint === 'ANY') continue;
    if (!specificCovers(dimension, grant, query)) return false;
  }
  return true;
}
