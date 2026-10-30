import type {
  CareSpaces,
  ClinicalUnits,
  PracticeSites,
  SpaceUnitAssignments,
} from '../entities';
import { conceptRef } from '../domain/structure/structure-catalog';
import { descendantsOf } from '../domain/structure/structure-rules';
import { PRAC } from '../practice.concepts';
import type {
  CareSpaceDetailDto,
  CareSpaceNodeDto,
  ClinicalUnitNodeDto,
  EstablishmentSummaryDto,
  SpaceUnitAssignmentDto,
} from '../dto';

/**
 * Traducción de filas a los DTO del contrato (F1 §3). Sin acceso a datos: el
 * llamador trae las filas (una consulta por tabla y sede, nunca N+1).
 */

/** `numeric` llega como string desde Postgres. */
function num(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** `date` a `YYYY-MM-DD` (sin corrimiento por zona horaria). */
export function isoDate(
  value: Date | string | null | undefined,
): string | null {
  if (!value) return null;
  if (typeof value === 'string') return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}

/** Índice `parentId → hijos` de una lista de espacios. */
export function childrenIndex(
  spaces: readonly CareSpaces[],
): Map<string, CareSpaces[]> {
  const out = new Map<string, CareSpaces[]>();
  for (const s of spaces) {
    if (!s.parentSpaceId) continue;
    const list = out.get(s.parentSpaceId) ?? [];
    list.push(s);
    out.set(s.parentSpaceId, list);
  }
  return out;
}

/** Nodo del árbol físico. */
export function toSpaceNode(
  space: CareSpaces,
  children: Map<string, CareSpaces[]>,
): CareSpaceNodeDto {
  return {
    id: space.id,
    parentId: space.parentSpaceId ?? null,
    code: space.code,
    name: space.name,
    form: conceptRef(space.formConceptId),
    function: conceptRef(space.spaceTypeConceptId),
    status: conceptRef(space.statusConceptId),
    operationalStatus: conceptRef(space.operationalStatusConceptId),
    clinicalUnitId: space.clinicalUnitId ?? null,
    capacity: space.capacity ?? null,
    rowVersion: space.rowVersion,
    childCount: children.get(space.id)?.length ?? 0,
  };
}

/** Vínculo espacio ↔ unidad. */
export function toAssignment(a: SpaceUnitAssignments): SpaceUnitAssignmentDto {
  return {
    id: a.id,
    careSpaceId: a.careSpaceId,
    clinicalUnitId: a.clinicalUnitId,
    role: conceptRef(a.roleConceptId),
    validFrom: a.validFrom,
    validTo: a.validTo ?? null,
  };
}

/**
 * Detalle de un espacio (contrato §3, `CareSpaceDetail`).
 *
 * @param space - El espacio.
 * @param siteSpaces - Todos los espacios de su sede (para camino e hijos).
 * @param assignments - Vínculos vigentes del espacio.
 */
export function toSpaceDetail(
  space: CareSpaces,
  siteSpaces: readonly CareSpaces[],
  assignments: readonly SpaceUnitAssignments[],
): CareSpaceDetailDto {
  const children = childrenIndex(siteSpaces);
  const byId = new Map(siteSpaces.map((s) => [s.id, s]));
  const path: CareSpaceDetailDto['path'] = [];
  const seen = new Set<string>();
  let cursor = space.parentSpaceId ? byId.get(space.parentSpaceId) : undefined;
  while (cursor && !seen.has(cursor.id)) {
    seen.add(cursor.id);
    path.unshift({
      id: cursor.id,
      code: cursor.code,
      name: cursor.name,
      form: conceptRef(cursor.formConceptId),
    });
    cursor = cursor.parentSpaceId ? byId.get(cursor.parentSpaceId) : undefined;
  }
  const idsByParent = new Map(
    [...children.entries()].map(([k, v]) => [k, v.map((c) => c.id)]),
  );
  const descendants = descendantsOf(space.id, idsByParent)
    .map((id) => byId.get(id)!)
    .filter((s) => s.statusConceptId !== PRAC.SPACE_RETIRED);
  const beds = descendants.filter((s) => s.formConceptId === PRAC.LOC_FORM_BED);
  const direct = children.get(space.id) ?? [];
  return {
    ...toSpaceNode(space, children),
    practiceSiteId: space.practiceSiteId,
    description: space.description ?? null,
    floorNumber: space.floorNumber ?? null,
    areaM2: num(space.areaM2),
    asepsis: conceptRef(space.asepsisConceptId),
    pressure: conceptRef(space.pressureConceptId),
    airChangesPerHour: num(space.airChangesPerHour),
    hvacValidatedOn: isoDate(space.hvacValidatedOn),
    sexRestriction: conceptRef(space.sexRestrictionConceptId),
    ageGroup: conceptRef(space.ageGroupConceptId),
    bedCategory: conceptRef(space.bedCategoryConceptId),
    censable: space.censable ?? null,
    gln: space.gln ?? null,
    prepMinutes: space.prepMinutes ?? null,
    cleanupMinutes: space.cleanupMinutes ?? null,
    validFrom: space.validFrom ?? null,
    validTo: space.validTo ?? null,
    path,
    children: direct.map((c) => toSpaceNode(c, children)),
    assignments: assignments.map(toAssignment),
    derived: {
      beds: beds.length,
      censableBeds: beds.filter((b) => b.censable === true).length,
      activeChildren: direct.filter(
        (c) => c.statusConceptId === PRAC.SPACE_ACTIVE,
      ).length,
    },
  };
}

/** Nodo del árbol organizativo. */
export function toUnitNode(
  unit: ClinicalUnits,
  all: readonly ClinicalUnits[],
): ClinicalUnitNodeDto {
  return {
    id: unit.id,
    parentId: unit.parentUnitId ?? null,
    code: unit.code,
    name: unit.name,
    description: unit.description ?? null,
    status: conceptRef(unit.statusConceptId),
    responsibleUserId: unit.responsibleUserId ?? null,
    rowVersion: unit.rowVersion,
    childCount: all.filter((u) => u.parentUnitId === unit.id).length,
  };
}

/** Resumen del establecimiento. */
export function toEstablishment(
  site: PracticeSites,
  canWrite: boolean,
): EstablishmentSummaryDto {
  return {
    id: site.id,
    practiceId: site.practiceId,
    branchId: site.branchId ?? null,
    code: site.code,
    name: site.name,
    status: conceptRef(site.statusConceptId) ?? {
      code: site.statusConceptId,
      display: site.statusConceptId,
    },
    snisCode: site.snisCode ?? null,
    snisVerified: Boolean(site.snisVerifiedAt),
    subsector: conceptRef(site.subsectorConceptId),
    careLevel: conceptRef(site.careLevelConceptId),
    typology: conceptRef(site.facilityTypologyConceptId),
    sedes: conceptRef(site.sedesDepartmentConceptId),
    managingEntityName: site.managingEntityName ?? null,
    healthNetworkName: site.healthNetworkName ?? null,
    municipalityName: site.municipalityName ?? null,
    rowVersion: site.rowVersion,
    canWrite,
  };
}
