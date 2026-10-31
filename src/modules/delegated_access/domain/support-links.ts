/**
 * Vínculos de la secretaria (personal de apoyo hospitalario): reglas puras.
 *
 * Un **vínculo** es una de dos cosas, cada una en la tabla que ya la modelaba:
 *
 * - `LOCATION`: la secretaria trabaja en un hospital, una sede, un servicio o un
 *   piso. Fila de `delegated_access.organization_user_assignments`
 *   (`practice_site_id`, `clinical_unit_id`, `care_space_id`).
 * - `PRACTITIONER`: la secretaria asiste a un doctor en su vinculación con ese
 *   hospital. Fila de `practice.practitioner_support_assignments`.
 *
 * Todo vínculo nace `PENDING` y sólo **la otra parte** lo acepta: si lo pidió la
 * secretaria, decide el hospital (o el doctor, si es un vínculo con él); si lo
 * ofreció el hospital o el doctor, decide la secretaria. Hasta entonces no abre
 * nada: el acceso sale sólo de vínculos `ACTIVE`.
 */

/** Qué nombra el vínculo. */
export const SUPPORT_TARGET_KINDS = [
  'ORGANIZATION',
  'SITE',
  'SERVICE',
  'SPACE',
  'PRACTITIONER',
] as const;
/** Qué nombra el vínculo. */
export type SupportTargetKind = (typeof SUPPORT_TARGET_KINDS)[number];

/** Estado de un vínculo, igual para los dos tipos. */
export type SupportLinkStatus = 'PENDING' | 'ACTIVE' | 'REJECTED' | 'ENDED';

/** Quién inició o tiene que decidir un vínculo. */
export type SupportParty = 'SUPPORT_STAFF' | 'ORGANIZATION' | 'PRACTITIONER';

/** Tipo de tabla del vínculo. */
export type SupportLinkKind = 'LOCATION' | 'PRACTITIONER';

/** Vínculo leído de la base, ya normalizado. */
export interface SupportLinkRow {
  readonly id: string;
  readonly kind: SupportLinkKind;
  readonly tenantId: string;
  readonly organizationName: string | null;
  readonly supportUserId: string;
  readonly supportPersonId: string | null;
  readonly supportName: string | null;
  readonly status: SupportLinkStatus;
  readonly createdByUserId: string | null;
  readonly createdAt: Date;
  readonly practiceSiteId: string | null;
  readonly clinicalUnitId: string | null;
  readonly careSpaceId: string | null;
  readonly practitionerRoleAssignmentId: string | null;
  readonly practitionerProfileId: string | null;
  /** Cuenta del doctor, si la tiene (para saber si fue él quien ofreció). */
  readonly practitionerUserId: string | null;
  readonly targetName: string | null;
}

/** Qué nombra un vínculo de lugar, según qué columna trae. */
export function locationTargetKind(row: {
  readonly practiceSiteId: string | null;
  readonly clinicalUnitId: string | null;
  readonly careSpaceId: string | null;
}): SupportTargetKind {
  if (row.careSpaceId) return 'SPACE';
  if (row.clinicalUnitId) return 'SERVICE';
  if (row.practiceSiteId) return 'SITE';
  return 'ORGANIZATION';
}

/** Qué nombra un vínculo. */
export function targetKindOf(row: SupportLinkRow): SupportTargetKind {
  return row.kind === 'PRACTITIONER' ? 'PRACTITIONER' : locationTargetKind(row);
}

/**
 * Quién inició el vínculo, por quién escribió la fila.
 *
 * La secretaria sólo escribe filas a su nombre; el doctor sólo las de su
 * vinculación; cualquier otro autor es la administración del hospital.
 */
export function initiatorOf(row: SupportLinkRow): SupportParty {
  if (row.createdByUserId === row.supportUserId) return 'SUPPORT_STAFF';
  if (
    row.kind === 'PRACTITIONER' &&
    row.practitionerUserId !== null &&
    row.createdByUserId === row.practitionerUserId
  ) {
    return 'PRACTITIONER';
  }
  return 'ORGANIZATION';
}

/**
 * Quién tiene que decidir un vínculo pendiente, o `null` si ya está decidido.
 *
 * Lo pedido por la secretaria lo decide el hospital (lugar) o el doctor; lo
 * ofrecido por el hospital o el doctor lo decide ella.
 */
export function awaitingPartyOf(row: SupportLinkRow): SupportParty | null {
  if (row.status !== 'PENDING') return null;
  if (initiatorOf(row) !== 'SUPPORT_STAFF') return 'SUPPORT_STAFF';
  return row.kind === 'PRACTITIONER' ? 'PRACTITIONER' : 'ORGANIZATION';
}

/** Quién está decidiendo, ya resuelto contra el vínculo. */
export interface SupportDecider {
  /** El actor es la secretaria titular del vínculo. */
  readonly isSupportStaff: boolean;
  /** El actor administra el hospital del vínculo (OWNER/ADMIN o plataforma). */
  readonly isOrganizationAdmin: boolean;
  /** El actor es el doctor de la vinculación del vínculo. */
  readonly isPractitioner: boolean;
}

/**
 * Si el actor puede aceptar o rechazar este vínculo pendiente.
 *
 * Nadie decide lo que inició él mismo: la secretaria no se acepta sola y el
 * hospital no acepta lo que él ofreció. Un vínculo con un doctor pedido por la
 * secretaria lo puede aceptar el doctor **o** la administración del hospital,
 * que responde por su gente.
 */
export function mayDecide(row: SupportLinkRow, who: SupportDecider): boolean {
  const awaiting = awaitingPartyOf(row);
  if (awaiting === null) return false;
  if (awaiting === 'SUPPORT_STAFF') return who.isSupportStaff;
  if (awaiting === 'ORGANIZATION') return who.isOrganizationAdmin;
  return who.isPractitioner || who.isOrganizationAdmin;
}

/** Lo que la secretaria puede ver en un hospital donde trabaja. */
export interface SupportTenantScope {
  readonly tenantId: string;
  readonly organizationName: string | null;
  /** Hay un vínculo con el hospital entero (sin sede, servicio ni piso). */
  readonly wholeOrganization: boolean;
  readonly practiceSiteIds: string[];
  readonly clinicalUnitIds: string[];
  /** Pisos y demás espacios asignados (`practice.care_spaces`). */
  readonly careSpaceIds: string[];
  readonly practitioners: {
    readonly linkId: string;
    readonly practitionerRoleAssignmentId: string;
    readonly practitionerProfileId: string | null;
    readonly name: string | null;
  }[];
}

/**
 * Agrupa los vínculos ACTIVOS por hospital. Lo que no está acá, la secretaria
 * no lo ve: es la única fuente de su alcance.
 */
export function buildSupportScope(
  rows: readonly SupportLinkRow[],
): SupportTenantScope[] {
  const byTenant = new Map<
    string,
    {
      tenantId: string;
      organizationName: string | null;
      wholeOrganization: boolean;
      practiceSiteIds: Set<string>;
      clinicalUnitIds: Set<string>;
      careSpaceIds: Set<string>;
      practitioners: SupportTenantScope['practitioners'];
    }
  >();
  for (const row of rows) {
    if (row.status !== 'ACTIVE') continue;
    let entry = byTenant.get(row.tenantId);
    if (!entry) {
      entry = {
        tenantId: row.tenantId,
        organizationName: row.organizationName,
        wholeOrganization: false,
        practiceSiteIds: new Set(),
        clinicalUnitIds: new Set(),
        careSpaceIds: new Set(),
        practitioners: [],
      };
      byTenant.set(row.tenantId, entry);
    }
    if (row.kind === 'PRACTITIONER') {
      if (row.practitionerRoleAssignmentId) {
        entry.practitioners.push({
          linkId: row.id,
          practitionerRoleAssignmentId: row.practitionerRoleAssignmentId,
          practitionerProfileId: row.practitionerProfileId,
          name: row.targetName,
        });
      }
      continue;
    }
    switch (locationTargetKind(row)) {
      case 'SPACE':
        entry.careSpaceIds.add(row.careSpaceId as string);
        break;
      case 'SERVICE':
        entry.clinicalUnitIds.add(row.clinicalUnitId as string);
        break;
      case 'SITE':
        entry.practiceSiteIds.add(row.practiceSiteId as string);
        break;
      default:
        entry.wholeOrganization = true;
    }
  }
  return [...byTenant.values()].map((entry) => ({
    tenantId: entry.tenantId,
    organizationName: entry.organizationName,
    wholeOrganization: entry.wholeOrganization,
    practiceSiteIds: [...entry.practiceSiteIds],
    clinicalUnitIds: [...entry.clinicalUnitIds],
    careSpaceIds: [...entry.careSpaceIds],
    practitioners: entry.practitioners,
  }));
}

/**
 * Si el alcance cubre la agenda de esa vinculación de doctor en ese hospital.
 *
 * Sólo un vínculo ACTIVO con ese doctor la abre: trabajar en el hospital no da
 * la agenda de todos sus médicos.
 */
export function scopeCoversPractitioner(
  scope: readonly SupportTenantScope[],
  tenantId: string,
  practitionerRoleAssignmentId: string,
): boolean {
  return scope.some(
    (tenant) =>
      tenant.tenantId === tenantId &&
      tenant.practitioners.some(
        (p) => p.practitionerRoleAssignmentId === practitionerRoleAssignmentId,
      ),
  );
}
