import type { SupportActionInput } from './support-permission-catalog';
import {
  TARGET_CONSTRAINTS,
  type ExpansionMode,
  type FixedSnapshot,
  type SupportTargetKind,
} from './support-targets';

/** Un permiso listo para expandir a filas de acceso efectivo. */
export interface ExpandableGrant {
  /** Id del permiso. */
  readonly grantId: string;
  /** Tipo de objetivo. */
  readonly targetKind: SupportTargetKind;
  /** Perfil del doctor del objetivo, si el tipo lo acota. */
  readonly practitionerProfileId?: string;
  /** Servicio del objetivo. */
  readonly healthcareServiceId?: string;
  /** Espacios contenidos en la ubicación del objetivo (ya resueltos). */
  readonly withinCareSpaceIds?: readonly string[];
  /** Modo de expansión. */
  readonly expansionMode: ExpansionMode;
  /** Foto congelada, solo `FIXED`. */
  readonly snapshot?: FixedSnapshot;
  /** Acciones del permiso: códigos antiguos (alias) o átomos, tal como figuran en la fila. */
  readonly actions: readonly SupportActionInput[];
}

/** Doctor (asignación de rol) de la organización. */
export interface ExpansionRole {
  /** Id de la asignación de rol. */
  readonly id: string;
  /** Perfil del doctor. */
  readonly practitionerProfileId: string;
  /** Servicio de la asignación, si declara uno. */
  readonly healthcareServiceId?: string;
}

/** Datos estructurales con los que se expande. */
export interface ExpansionStructure {
  /** Asignaciones de rol de la organización. */
  readonly roles: readonly ExpansionRole[];
  /** Dónde atiende cada asignación de rol. */
  readonly locationPairs: readonly {
    readonly practitionerRoleAssignmentId: string;
    readonly careSpaceId: string;
  }[];
}

/** Fila de acceso efectivo (sin persona ni organización). */
export interface ExpandedRow {
  /** Doctor (asignación de rol). */
  readonly practitionerRoleAssignmentId: string;
  /** Servicio, si el permiso lo acota. */
  readonly healthcareServiceId?: string;
  /** Espacio, si el permiso lo acota. */
  readonly careSpaceId?: string;
  /** Código de la acción. */
  readonly permissionCode: SupportActionInput;
  /** Permiso de origen. */
  readonly grantId: string;
}

/**
 * Expande un permiso a las filas «doctor × servicio × espacio × acción» que
 * lo materializan. Es una aproximación derivada para las consultas
 * (`access-lookup`, equipo del doctor): la decisión real la toma
 * `evaluateSupportAccess` sobre el permiso, no sobre estas filas.
 *
 * - Doctor acotado (`SPECIFIC`): todas las asignaciones de ese perfil.
 * - Doctor libre: los que ofrecen el servicio o atienden dentro de la ubicación.
 * - `ALL_*`: todos.
 * - Un permiso `FIXED` solo expande lo que su foto lista.
 *
 * @param grant - Permiso a expandir.
 * @param structure - Estructura actual de la organización.
 * @param acceptedProfileIds - Doctores que aceptaron a la persona; solo ellos cuentan.
 * @returns Las filas efectivas del permiso.
 */
export function expandGrant(
  grant: ExpandableGrant,
  structure: ExpansionStructure,
  acceptedProfileIds: ReadonlySet<string>,
): ExpandedRow[] {
  const c = TARGET_CONSTRAINTS[grant.targetKind];
  const frozen =
    grant.expansionMode === 'FIXED' ? (grant.snapshot?.rows ?? []) : undefined;
  const within = grant.withinCareSpaceIds
    ? new Set(grant.withinCareSpaceIds)
    : undefined;
  const pairsOf = (roleId: string): string[] =>
    structure.locationPairs
      .filter((p) => p.practitionerRoleAssignmentId === roleId)
      .map((p) => p.careSpaceId);

  const rows: ExpandedRow[] = [];
  for (const role of structure.roles) {
    if (!acceptedProfileIds.has(role.practitionerProfileId)) continue;
    if (
      frozen &&
      !frozen.some(
        (r) =>
          (!r.practitionerRoleAssignmentId && !r.practitionerProfileId) ||
          r.practitionerRoleAssignmentId === role.id ||
          r.practitionerProfileId === role.practitionerProfileId,
      )
    ) {
      continue;
    }
    if (c.practitioner === 'SPECIFIC') {
      if (role.practitionerProfileId !== grant.practitionerProfileId) continue;
    }
    if (c.practitioner === 'FREE') {
      const byService =
        c.service === 'SPECIFIC' &&
        role.healthcareServiceId === grant.healthcareServiceId;
      const byLocation =
        c.location === 'SPECIFIC' &&
        within !== undefined &&
        pairsOf(role.id).some((space) => within.has(space));
      const needsService = c.service === 'SPECIFIC';
      const needsLocation = c.location === 'SPECIFIC';
      const ok =
        (!needsService || byService) &&
        (!needsLocation || byLocation) &&
        (needsService || needsLocation);
      if (!ok) continue;
    }

    const spaces: (string | undefined)[] = [undefined];
    if (c.location !== 'FREE') {
      const mine = pairsOf(role.id).filter(
        (space) =>
          (!within || within.has(space)) &&
          (!frozen ||
            frozen.some((r) => !r.careSpaceId || r.careSpaceId === space)),
      );
      if (mine.length === 0 && c.location === 'SPECIFIC') continue;
      if (mine.length > 0) spaces.splice(0, spaces.length, ...mine);
    }
    const services: (string | undefined)[] =
      c.service === 'SPECIFIC' ? [grant.healthcareServiceId] : [undefined];

    for (const careSpaceId of spaces) {
      for (const healthcareServiceId of services) {
        for (const permissionCode of grant.actions) {
          rows.push({
            practitionerRoleAssignmentId: role.id,
            healthcareServiceId,
            careSpaceId,
            permissionCode,
            grantId: grant.grantId,
          });
        }
      }
    }
  }
  return rows;
}

/** Fila de la tabla derivada, con NULL en las dimensiones que el permiso no acota. */
export interface DerivedRow {
  /** Doctor (asignación de rol); ausente = cualquier profesional. */
  readonly practitionerRoleAssignmentId?: string;
  /** Servicio; ausente = cualquiera. */
  readonly healthcareServiceId?: string;
  /** Espacio; ausente = cualquiera. */
  readonly careSpaceId?: string;
  /** Código de la acción. */
  readonly permissionCode: SupportActionInput;
  /** Permiso de origen. */
  readonly grantId: string;
}

/** Lo que `deriveEffectiveRows` necesita saber de un permiso. */
export interface DerivableGrant {
  /** Id del permiso. */
  readonly grantId: string;
  /** Tipo de objetivo. */
  readonly targetKind: SupportTargetKind;
  /** Asignaciones de rol del doctor del objetivo (todas las de su perfil). */
  readonly practitionerRoleAssignmentIds: readonly string[];
  /** Servicio del objetivo. */
  readonly healthcareServiceId?: string;
  /** Espacios dentro de la ubicación del objetivo (ya resueltos). */
  readonly withinCareSpaceIds: readonly string[];
  /** Modo de expansión. */
  readonly expansionMode: ExpansionMode;
  /** Foto congelada, solo `FIXED`. */
  readonly snapshot?: FixedSnapshot;
  /** Acciones del permiso. */
  readonly actions: readonly SupportActionInput[];
}

/**
 * Filas de `effective_support_access` de un permiso, con la misma regla que la
 * función SQL de referencia del modelo: NULL en las dimensiones que el permiso
 * no acota, una fila por doctor y por espacio dentro de la ubicación, y las
 * filas congeladas tal cual para `FIXED`.
 *
 * @param grant - Permiso vigente.
 * @returns Las filas derivadas, una por combinación y acción.
 */
export function deriveEffectiveRows(grant: DerivableGrant): DerivedRow[] {
  const c = TARGET_CONSTRAINTS[grant.targetKind];
  let combos: {
    practitionerRoleAssignmentId?: string;
    healthcareServiceId?: string;
    careSpaceId?: string;
  }[];
  if (grant.expansionMode === 'FIXED') {
    combos = (grant.snapshot?.rows ?? []).map((r) => ({
      practitionerRoleAssignmentId: r.practitionerRoleAssignmentId,
      healthcareServiceId: r.healthcareServiceId,
      careSpaceId: r.careSpaceId,
    }));
  } else {
    const pras: (string | undefined)[] =
      c.practitioner === 'SPECIFIC'
        ? [...grant.practitionerRoleAssignmentIds]
        : [undefined];
    const services: (string | undefined)[] =
      c.service === 'SPECIFIC' ? [grant.healthcareServiceId] : [undefined];
    const spaces: (string | undefined)[] =
      c.location === 'SPECIFIC' ? [...grant.withinCareSpaceIds] : [undefined];
    combos = [];
    for (const practitionerRoleAssignmentId of pras) {
      for (const healthcareServiceId of services) {
        for (const careSpaceId of spaces) {
          combos.push({
            practitionerRoleAssignmentId,
            healthcareServiceId,
            careSpaceId,
          });
        }
      }
    }
  }
  return combos.flatMap((combo) =>
    grant.actions.map((permissionCode) => ({
      ...combo,
      permissionCode,
      grantId: grant.grantId,
    })),
  );
}
