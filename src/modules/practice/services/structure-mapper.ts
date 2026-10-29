import type {
  CareSpaces,
  ClinicalUnits,
  PracticeSites,
  SpaceUnitAssignments,
} from '../entities';
import {
  ATTRIBUTES,
  FORMS,
  FUNCTIONS,
  REGULATORY,
  SPACE_LIFECYCLE,
  UNIT_LIFECYCLE,
  practiceConcept,
  type ConceptEntry,
} from '../infrastructure-catalog';
import { PRAC } from '../practice.concepts';
import type {
  CareSpaceNode,
  ClinicalUnitNode,
  ConceptRef,
  SiteSummary,
  SpaceUnitAssignmentView,
} from '../dto/infrastructure.types';

/** Estados operativos conocidos hoy (los demás ejes llegan con F2). */
const OPERATIONAL = new Map<string, ConceptEntry>(
  ['SPACE_OP_AVAILABLE', 'SPACE_OP_CLOSED'].map((code) => {
    const entry = practiceConcept(code);
    return [entry.id, entry];
  }),
);

/** `{code, display}` de una entrada, o `null`. */
export function ref(entry: ConceptEntry | undefined | null): ConceptRef | null {
  return entry ? { code: entry.code, display: entry.display } : null;
}

/** ISO de una fecha (o de un `Date` que llegó como texto), o `null`. */
export function iso(value: Date | string | null | undefined): string | null {
  if (value === undefined || value === null) return null;
  return value instanceof Date ? value.toISOString() : String(value);
}

/** Fecha sin hora (`AAAA-MM-DD`), o `null`. */
export function isoDate(
  value: Date | string | null | undefined,
): string | null {
  const full = iso(value);
  return full === null ? null : full.slice(0, 10);
}

/** Número de una columna `numeric` (llega como texto), o `null`. */
export function num(value: string | number | null | undefined): number | null {
  if (value === undefined || value === null || value === '') return null;
  return Number(value);
}

/** Nodo del árbol físico. */
export function toSpaceNode(
  space: CareSpaces,
  childCount: number,
): CareSpaceNode {
  return {
    id: space.id,
    parentId: space.parentSpaceId ?? null,
    code: space.code,
    name: space.name,
    form: ref(FORMS.byConceptId(space.formConceptId)),
    function: ref(FUNCTIONS.byConceptId(space.spaceTypeConceptId)),
    status: ref(SPACE_LIFECYCLE.byConceptId(space.statusConceptId)),
    operationalStatus: ref(
      OPERATIONAL.get(space.operationalStatusConceptId ?? ''),
    ),
    clinicalUnitId: space.clinicalUnitId ?? null,
    capacity: space.capacity ?? null,
    rowVersion: space.rowVersion,
    childCount,
  };
}

/** Nodo del árbol organizativo. */
export function toUnitNode(unit: ClinicalUnits): ClinicalUnitNode {
  return {
    id: unit.id,
    parentId: unit.parentUnitId ?? null,
    code: unit.code,
    name: unit.name,
    description: unit.description ?? null,
    status: ref(UNIT_LIFECYCLE.byConceptId(unit.statusConceptId)),
    responsibleUserId: unit.responsibleUserId ?? null,
    validFrom: iso(unit.validFrom),
    validTo: iso(unit.validTo),
    rowVersion: unit.rowVersion,
  };
}

/** Vínculo espacio ↔ unidad. */
export function toAssignmentView(
  row: SpaceUnitAssignments,
): SpaceUnitAssignmentView {
  return {
    id: row.id,
    careSpaceId: row.careSpaceId,
    clinicalUnitId: row.clinicalUnitId,
    role: ref(ATTRIBUTES.unitRole.byConceptId(row.roleConceptId)),
    validFrom: row.validFrom.toISOString(),
    validTo: iso(row.validTo),
  };
}

/** Resumen de la sede para la estructura. */
export function toSiteSummary(site: PracticeSites): SiteSummary {
  return {
    id: site.id,
    practiceId: site.practiceId,
    branchId: site.branchId ?? null,
    code: site.code,
    name: site.name,
    typology: ref(
      REGULATORY.typology.byConceptId(site.facilityTypologyConceptId),
    ),
    rowVersion: site.rowVersion,
  };
}

/** Hijos directos no clausurados por id de padre (para `childCount`). */
export function countChildren(
  spaces: readonly CareSpaces[],
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const space of spaces) {
    if (!space.parentSpaceId || space.statusConceptId === PRAC.SPACE_RETIRED)
      continue;
    counts.set(space.parentSpaceId, (counts.get(space.parentSpaceId) ?? 0) + 1);
  }
  return counts;
}
