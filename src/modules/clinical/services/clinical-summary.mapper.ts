import type {
  AllergyIntolerances,
  CareEpisodes,
  Conditions,
  Encounters,
  MedicationRequests,
  Observations,
} from '../entities';
import type { PatientClinicalSummaryResponseDto } from '../dto';
import { verificationFromSnapshot } from './condition-verification';

type Summary = PatientClinicalSummaryResponseDto;

/** Snapshot lookup by condition id, as `HistoryRepository.latestBySource` returns it. */
type SnapshotById = ReadonlyMap<string, { dataSnapshot?: unknown } | undefined>;

/** Reactions of an allergy, already grouped by allergy id. */
export type ReactionsByAllergy = ReadonlyMap<
  string,
  Summary['allergies'][0]['reactions']
>;

/** `numeric` quantity of a prescription (text) to number; no quantity, absent. */
function quantityOf(value: string | null | undefined): number | undefined {
  if (value === null || value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function toConditionItem(
  row: Conditions,
  statusHistory: SnapshotById,
  verificationHistory: SnapshotById,
): Summary['conditions'][0] {
  const snapshot = statusHistory.get(row.id)?.dataSnapshot as
    Record<string, unknown> | undefined;
  const lastStatusChangeReasonText =
    typeof snapshot?.statusChangeReasonText === 'string'
      ? snapshot.statusChangeReasonText
      : undefined;
  return {
    id: row.id,
    codeConceptId: row.codeConceptId,
    categoryConceptId: row.categoryConceptId,
    clinicalStatusConceptId: row.clinicalStatusConceptId,
    verificationStatusConceptId: row.verificationStatusConceptId,
    severityConceptId: row.severityConceptId,
    encounterId: row.encounterId,
    clinicalCourseConceptId: row.clinicalCourseConceptId,
    lateralityConceptId: row.lateralityConceptId,
    onsetAt: row.onsetAt,
    expectedResolutionAt: row.expectedResolutionAt,
    resolvedAt: row.resolvedAt,
    noteText: row.noteText,
    lastStatusChangeReasonText,
    verification: verificationFromSnapshot(
      verificationHistory.get(row.id)?.dataSnapshot,
    ),
    ...(row.replacedByConditionId
      ? { replacedByConditionId: row.replacedByConditionId }
      : {}),
    createdAt: row.createdAt,
  };
}

export function toAllergyItem(
  row: AllergyIntolerances,
  reactions: ReactionsByAllergy,
): Summary['allergies'][0] {
  return {
    id: row.id,
    substanceConceptId: row.substanceConceptId,
    encounterId: row.encounterId,
    typeConceptId: row.typeConceptId,
    categoryConceptId: row.categoryConceptId,
    criticalityConceptId: row.criticalityConceptId,
    clinicalStatusConceptId: row.clinicalStatusConceptId,
    reactions: reactions.get(row.id) ?? [],
    createdAt: row.createdAt,
  };
}

export function toMedicationRequestItem(
  row: MedicationRequests,
): Summary['medicationRequests'][0] {
  return {
    id: row.id,
    medicationConceptId: row.medicationConceptId,
    statusConceptId: row.statusConceptId,
    prescriberProfileId: row.prescriberProfileId,
    encounterId: row.encounterId,
    formInstanceId: row.formInstanceId,
    doseText: row.doseText,
    frequencyText: row.frequencyText,
    quantityDecimal: quantityOf(row.quantityDecimal),
    validFrom: row.validFrom,
    validTo: row.validTo,
    patientInstructionsText: row.patientInstructionsText,
    indicationConditionId: row.indicationConditionId,
    indicationText: row.indicationText,
    // La receta que sustituyó a ésta (reemplazo de medicación): ausente si
    // no la hay, con el mismo criterio que `replacedByConditionId`.
    ...(row.replacedByRequestId
      ? { replacedByRequestId: row.replacedByRequestId }
      : {}),
    signedAt: row.signedAt,
    issuedAt: row.issuedAt,
    createdAt: row.createdAt,
  };
}

export function toObservationItem(
  row: Observations,
): Summary['observations'][0] {
  return {
    id: row.id,
    codeConceptId: row.codeConceptId,
    statusConceptId: row.statusConceptId,
    interpretationConceptId: row.interpretationConceptId,
    valueDecimal: row.valueDecimal,
    valueText: row.valueText,
    valueBoolean: row.valueBoolean,
    valueConceptId: row.valueConceptId,
    quantityValue: row.quantityValue,
    quantityUnitConceptId: row.quantityUnitConceptId,
    effectiveStartAt: row.effectiveStartAt,
    encounterId: row.encounterId,
  };
}

export function toEncounterItem(row: Encounters): Summary['encounters'][0] {
  return {
    id: row.id,
    episodeId: row.episodeId,
    statusConceptId: row.statusConceptId,
    classConceptId: row.classConceptId,
    primaryPractitionerId: row.primaryPractitionerId,
    reasonText: row.reasonText,
    startAt: row.startAt,
    endAt: row.endAt,
    rowVersion: row.rowVersion,
  };
}

export function toCareEpisodeItem(
  row: CareEpisodes,
): Summary['careEpisodes'][0] {
  return {
    id: row.id,
    tenantId: row.tenantId,
    typeConceptId: row.typeConceptId,
    statusConceptId: row.statusConceptId,
    responsiblePractitionerId: row.responsiblePractitionerId,
    startAt: row.startAt,
    endAt: row.endAt,
    createdAt: row.createdAt,
  };
}

/** Groups the reactions of a batch of allergies by allergy id. */
export function groupReactions(
  reactions: readonly {
    id: string;
    allergyId: string;
    manifestationConceptId: string;
    severityConceptId?: string;
    description?: string;
  }[],
): ReactionsByAllergy {
  const byAllergy = new Map<string, Summary['allergies'][0]['reactions']>();
  for (const reaction of reactions) {
    const list = byAllergy.get(reaction.allergyId) ?? [];
    list.push({
      id: reaction.id,
      manifestationConceptId: reaction.manifestationConceptId,
      severityConceptId: reaction.severityConceptId,
      description: reaction.description,
    });
    byAllergy.set(reaction.allergyId, list);
  }
  return byAllergy;
}
