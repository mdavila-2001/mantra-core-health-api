import type {
  ObservationReferenceRanges,
  Observations,
} from '../../clinical/entities';
import { DIAG } from '../diagnostics.concepts';
import type { DiagnosticResultValueDto, ResultValueKind } from '../dto';
import type {
  DiagnosticReleaseEvents,
  DiagnosticReportVersions,
} from '../entities';

/** Display label of a concept id, or null. */
export type ConceptDisplay = (id?: string | null) => string | null;

/** Code and display of each concept, as `ClinicalRefsRepository` returns them. */
export type ConceptLabels = Map<string, { code: string; display: string }>;

/**
 * The released version that is in force and the event that released it: a
 * version whose latest release event is the release action, any visibility
 * (hidden is for the patient, not for whoever attends). Of several, the
 * highest number wins (an amendment replaces the version it corrects).
 *
 * @param versions - Versions of the report.
 * @param releases - Their release events, newest first.
 */
export function currentRelease(
  versions: readonly DiagnosticReportVersions[],
  releases: readonly DiagnosticReleaseEvents[],
): { chosen?: DiagnosticReportVersions; release?: DiagnosticReleaseEvents } {
  // Newest first: the first event seen per version is its current decision.
  const lastEvent = new Map<string, DiagnosticReleaseEvents>();
  for (const event of releases) {
    const versionId = event.diagnosticReportVersionId;
    if (versionId === undefined || lastEvent.has(versionId)) continue;
    lastEvent.set(versionId, event);
  }
  let chosen: DiagnosticReportVersions | undefined;
  for (const version of versions) {
    const event = lastEvent.get(version.id);
    if (event?.actionConceptId !== DIAG.RELEASE_ACTION_RELEASE) continue;
    if (!chosen || version.versionNumber > chosen.versionNumber) {
      chosen = version;
    }
  }
  return { chosen, release: chosen ? lastEvent.get(chosen.id) : undefined };
}

/**
 * The first range of each observation that is not a component's: the one the
 * laboratory declared for the whole value.
 */
export function rangeByObservation(
  ranges: readonly ObservationReferenceRanges[],
): Map<string, ObservationReferenceRanges> {
  const out = new Map<string, ObservationReferenceRanges>();
  for (const range of ranges) {
    if (range.observationComponentId) continue;
    if (!out.has(range.observationId)) out.set(range.observationId, range);
  }
  return out;
}

/** Concept ids a set of observations and ranges needs labelled. */
export function conceptIdsOf(
  observations: readonly Observations[],
  ranges: Iterable<ObservationReferenceRanges>,
): string[] {
  const ids: string[] = [];
  for (const o of observations) {
    ids.push(o.codeConceptId);
    if (o.quantityUnitConceptId) ids.push(o.quantityUnitConceptId);
    if (o.interpretationConceptId) ids.push(o.interpretationConceptId);
    if (o.valueConceptId) ids.push(o.valueConceptId);
  }
  for (const range of ranges) {
    if (range.unitConceptId) ids.push(range.unitConceptId);
  }
  return ids;
}

/** One observation of the released version, shaped for whoever attends the patient. */
export function toResultValue(
  o: Observations,
  range: ObservationReferenceRanges | undefined,
  labels: ConceptLabels,
): DiagnosticResultValueDto {
  const display: ConceptDisplay = (id) =>
    id ? (labels.get(id)?.display ?? null) : null;
  const { value, valueKind } = valueOf(o, display);
  return {
    observationId: o.id,
    codeConceptId: o.codeConceptId,
    name: display(o.codeConceptId),
    value,
    valueKind,
    valueConceptId: o.valueConceptId ?? null,
    unitConceptId: o.quantityUnitConceptId ?? null,
    unit: display(o.quantityUnitConceptId),
    referenceRange: range
      ? {
          low: range.lowValue ?? null,
          high: range.highValue ?? null,
          text: range.text ?? null,
          unitConceptId: range.unitConceptId ?? null,
          unit: display(range.unitConceptId),
        }
      : null,
    interpretationConceptId: o.interpretationConceptId ?? null,
    interpretationCode: o.interpretationConceptId
      ? (labels.get(o.interpretationConceptId)?.code ?? null)
      : null,
    interpretation: display(o.interpretationConceptId),
    statusConceptId: o.statusConceptId,
    effectiveAt: o.effectiveStartAt ?? null,
  };
}

/**
 * The observation value as text, and which column it came from.
 *
 * An observation carries a single value type (`ObservationsService`
 * contract); the first one present in this order is taken.
 */
function valueOf(
  o: Observations,
  display: ConceptDisplay,
): { value: string | null; valueKind: ResultValueKind | null } {
  if (o.quantityValue != null)
    return { value: o.quantityValue, valueKind: 'QUANTITY' };
  if (o.valueDecimal != null)
    return { value: o.valueDecimal, valueKind: 'DECIMAL' };
  if (o.valueInteger != null)
    return { value: String(o.valueInteger), valueKind: 'INTEGER' };
  if (o.valueText != null) return { value: o.valueText, valueKind: 'TEXT' };
  if (o.valueBoolean != null)
    return { value: String(o.valueBoolean), valueKind: 'BOOLEAN' };
  if (o.valueConceptId)
    return { value: display(o.valueConceptId), valueKind: 'CONCEPT' };
  if (o.valueDatetime)
    return {
      value: new Date(o.valueDatetime).toISOString(),
      valueKind: 'DATETIME',
    };
  if (o.valueDate)
    return {
      value: new Date(o.valueDate).toISOString().slice(0, 10),
      valueKind: 'DATE',
    };
  return { value: null, valueKind: null };
}
