import { withinWindow } from './support-access.coverage';
import {
  TARGET_CONSTRAINTS,
  isEmptySnapshotRow,
  type ExpansionMode,
  type FixedSnapshot,
  type SupportTargetKind,
} from './support-targets';
import {
  atomsOfAction,
  type SupportAtomCode,
} from './support-permission-catalog';

/**
 * A qué doctor, servicio y espacio apunta un permiso, y qué átomos da.
 * Son las piezas de las que dependen la segregación de funciones, la
 * resolución de revisores, el alcance del administrador delegado y las
 * campañas. Todo es puro y falla cerrado.
 */

/** Objetivo de un permiso de apoyo (`SupportGrantFacts` lo satisface tal cual). */
export interface GrantTargetFacts {
  readonly targetKind: SupportTargetKind;
  readonly expansionMode?: ExpansionMode;
  /** Perfil del doctor del objetivo. */
  readonly practitionerProfileId?: string;
  /** Asignación de rol del doctor (otra identidad del mismo doctor). */
  readonly practitionerRoleAssignmentId?: string;
  readonly healthcareServiceId?: string;
  readonly careSpaceId?: string;
  readonly practiceSiteId?: string;
  /** Ruta materializada del espacio (`/sede/edificio/piso/sala/`, con el propio id). */
  readonly careSpacePath?: string;
  /** Sede que contiene al espacio. */
  readonly careSpaceSiteId?: string;
  /** Foto congelada de un permiso `FIXED`. */
  readonly snapshot?: FixedSnapshot;
}

/** Un doctor o un servicio acotado: las identidades equivalentes del mismo objeto. */
export interface IdentityDim {
  readonly ids: readonly string[];
}

/** Una ubicación acotada: id, ruta materializada y sede, si se conocen. */
export interface LocationDim {
  readonly ids: readonly string[];
  readonly path?: string;
  readonly siteId?: string;
  /** `true` si es una sede (raíz: no tiene ancestros). */
  readonly isSite?: boolean;
}

/**
 * Cobertura de un permiso en las tres dimensiones. `null` = cualquier valor
 * (la dimensión es libre o «todos»); un objeto = solo ese objetivo.
 */
export interface TargetCell {
  readonly practitioner: IdentityDim | null;
  readonly service: IdentityDim | null;
  readonly location: LocationDim | null;
}

function ids(...values: Array<string | undefined>): string[] {
  return [...new Set(values.filter((v): v is string => !!v))];
}

/**
 * Descompone un permiso en celdas de cobertura. Un permiso `DYNAMIC` es una
 * sola celda; uno `FIXED`, una por fila de su foto (las filas vacías no
 * cuentan y un `FIXED` sin foto no cubre nada). Una dimensión acotada sin su
 * referencia (dato roto) queda con lista de ids vacía: no coincide con nada.
 *
 * @param target - Objetivo del permiso.
 * @returns Las celdas; vacío si el permiso no cubre nada.
 */
export function targetCells(target: GrantTargetFacts): readonly TargetCell[] {
  if (target.expansionMode === 'FIXED') {
    return (target.snapshot?.rows ?? [])
      .filter((row) => !isEmptySnapshotRow(row))
      .map((row) => {
        const practitioner = ids(
          row.practitionerProfileId,
          row.practitionerRoleAssignmentId,
        );
        return {
          practitioner: practitioner.length ? { ids: practitioner } : null,
          service: row.healthcareServiceId
            ? { ids: [row.healthcareServiceId] }
            : null,
          location: row.careSpaceId ? { ids: [row.careSpaceId] } : null,
        };
      });
  }
  const c = TARGET_CONSTRAINTS[target.targetKind];
  const location = target.careSpaceId ?? target.practiceSiteId;
  return [
    {
      practitioner:
        c.practitioner === 'SPECIFIC'
          ? {
              ids: ids(
                target.practitionerProfileId,
                target.practitionerRoleAssignmentId,
              ),
            }
          : null,
      service:
        c.service === 'SPECIFIC'
          ? { ids: ids(target.healthcareServiceId) }
          : null,
      location:
        c.location === 'SPECIFIC'
          ? {
              ids: ids(location),
              path: target.careSpacePath,
              siteId: target.careSpaceSiteId ?? target.practiceSiteId,
              isSite: !!target.practiceSiteId && !target.careSpaceId,
            }
          : null,
    },
  ];
}

/** Relación entre dos ubicaciones acotadas. */
export type LocationRelation =
  'EQUAL' | 'A_CONTAINS_B' | 'B_CONTAINS_A' | 'DISJOINT' | 'UNKNOWN';

function contains(outer: LocationDim, inner: LocationDim): boolean {
  return outer.ids.some(
    (id) =>
      inner.path?.includes(`/${id}/`) === true ||
      (outer.isSite === true && inner.siteId === id),
  );
}

/** ¿Se conoce el linaje completo de la ubicación (ruta propia o sede raíz)? */
function lineageKnown(dim: LocationDim): boolean {
  return dim.path !== undefined || dim.isSite === true;
}

/**
 * Relación entre dos ubicaciones por su ruta materializada. Sin ruta (y sin ser
 * sedes) dos ubicaciones distintas son `UNKNOWN`: no se puede probar que sean
 * ajenas ni que una contenga a la otra.
 */
export function locationRelation(
  a: LocationDim,
  b: LocationDim,
): LocationRelation {
  if (a.ids.some((id) => b.ids.includes(id))) return 'EQUAL';
  if (contains(a, b)) return 'A_CONTAINS_B';
  if (contains(b, a)) return 'B_CONTAINS_A';
  return lineageKnown(a) && lineageKnown(b) ? 'DISJOINT' : 'UNKNOWN';
}

function identitiesIntersect(a: IdentityDim, b: IdentityDim): boolean {
  return a.ids.some((id) => b.ids.includes(id));
}

function cellsOverlap(a: TargetCell, b: TargetCell): boolean {
  if (a.practitioner && b.practitioner) {
    if (!identitiesIntersect(a.practitioner, b.practitioner)) return false;
  }
  if (a.service && b.service) {
    if (!identitiesIntersect(a.service, b.service)) return false;
  }
  if (a.location && b.location) {
    // Lo desconocido se trata como solape: es el lado seguro para un conflicto.
    if (locationRelation(a.location, b.location) === 'DISJOINT') return false;
  }
  return true;
}

function cellWithin(managed: TargetCell, admin: TargetCell): boolean {
  if (admin.practitioner) {
    if (!managed.practitioner) return false;
    if (!identitiesIntersect(managed.practitioner, admin.practitioner)) {
      return false;
    }
  }
  if (admin.service) {
    if (!managed.service) return false;
    if (!identitiesIntersect(managed.service, admin.service)) return false;
  }
  if (admin.location) {
    if (!managed.location) return false;
    const relation = locationRelation(admin.location, managed.location);
    // Solo lo probado cuenta como «dentro»: igual o contenido por el delegado.
    if (relation !== 'EQUAL' && relation !== 'A_CONTAINS_B') return false;
  }
  return true;
}

/**
 * ¿Las coberturas de dos permisos se solapan? (`PERSON_OVERLAP` de SoD).
 * Dos permisos se solapan si alguna celda de uno comparte, en cada dimensión
 * acotada por ambos, el mismo doctor o servicio, o una ubicación igual o
 * contenida en la otra. Es simétrica; un permiso que no cubre nada no se
 * solapa con nada.
 *
 * @param a - Primer permiso.
 * @param b - Segundo permiso.
 */
export function grantsOverlap(
  a: GrantTargetFacts,
  b: GrantTargetFacts,
): boolean {
  const cb = targetCells(b);
  return targetCells(a).some((x) => cb.some((y) => cellsOverlap(x, y)));
}

/**
 * ¿Lo gestionado está dentro del alcance del administrador delegado? (§6.4).
 * Por dimensión: si el delegado la deja libre o en «todos» cubre cualquier
 * valor; si es específica, lo gestionado debe ser igual (doctor, servicio) o
 * estar contenido (ubicación, por ruta). Un gestionado más amplio que el
 * delegado NO está dentro. Todas las celdas de lo gestionado deben caber en
 * alguna celda del delegado; lo que no cubre nada nunca está «dentro».
 *
 * @param managed - Objetivo gestionado (la concesión de la persona).
 * @param adminGrant - Concesión `team.grants.assign` del delegado (su alcance).
 */
export function targetWithin(
  managed: GrantTargetFacts,
  adminGrant: GrantTargetFacts,
): boolean {
  const cm = targetCells(managed);
  const ca = targetCells(adminGrant);
  if (cm.length === 0 || ca.length === 0) return false;
  return cm.every((m) => ca.some((a) => cellWithin(m, a)));
}

/** Un permiso con sus acciones, vigencia y efecto. */
export interface AtomHoldingGrant extends GrantTargetFacts {
  readonly grantId: string;
  /** Átomos o alias heredados que incluye. */
  readonly actions: readonly string[];
  /** Átomos con condición propia (suman a `actions`). */
  readonly atomGrants?: ReadonlyArray<{ readonly atom: string }>;
  /** `ALLOW` (por defecto) o `DENY`. */
  readonly effect?: 'ALLOW' | 'DENY';
  /** `false` = revocado o suspendido. */
  readonly active?: boolean;
  readonly validFrom?: Date;
  readonly validTo?: Date;
}

/** ¿El permiso está vivo (activo y dentro de su vigencia) en `now`? */
export function isGrantLive(
  grant: Pick<AtomHoldingGrant, 'active' | 'validFrom' | 'validTo'>,
  now: Date,
): boolean {
  return (
    grant.active !== false && withinWindow(now, grant.validFrom, grant.validTo)
  );
}

/**
 * Átomos que da un permiso: los alias se expanden a su paquete, los
 * desconocidos se ignoran. Orden alfabético y sin repetidos.
 */
export function atomsOfGrant(
  grant: Pick<AtomHoldingGrant, 'actions' | 'atomGrants'>,
): SupportAtomCode[] {
  const out = new Set<SupportAtomCode>();
  for (const action of grant.actions) {
    for (const x of atomsOfAction(action)) out.add(x.atom);
  }
  for (const g of grant.atomGrants ?? []) {
    for (const x of atomsOfAction(g.atom)) out.add(x.atom);
  }
  return [...out].sort();
}

/**
 * Átomos efectivos de una persona: la unión de sus permisos `ALLOW` vivos. Las
 * `DENY` no restan: un conflicto o un puntaje es de capacidad, no de uso.
 */
export function effectiveAtoms(
  grants: readonly AtomHoldingGrant[],
  now: Date,
): SupportAtomCode[] {
  const out = new Set<SupportAtomCode>();
  for (const g of grants) {
    if (g.effect === 'DENY' || !isGrantLive(g, now)) continue;
    for (const atom of atomsOfGrant(g)) out.add(atom);
  }
  return [...out].sort();
}
