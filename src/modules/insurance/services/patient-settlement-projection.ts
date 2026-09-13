import { mismosDecimales, PreconditionFailedException } from '../../../common';
import type { PatientSettlementProjection } from '../dto/patient-settlement.dto';
import type { InsuranceClaims } from '../entities';
import { INS } from '../insurance.concepts';
import { resolveInsuranceCurrencyCode } from '../insurance-currency';
import type { PatientSettlementBatch } from '../repositories/patient-settlement.repository';
import {
  matchesLinkedClaimSnapshot,
  validateLinkedClaimSettlement,
  type LinkedOrderSnapshot,
} from './linked-claim-validation';

const hidden = (
  insuranceSettlementAvailability: PatientSettlementProjection['insuranceSettlementAvailability'],
): PatientSettlementProjection => ({
  insuranceSettlement: null,
  insuranceSettlementAvailability,
});

/** Una EOB privada o sustituida nunca convierte importes en deuda confirmada. */
export function projectPatientSettlement(
  patientProfileId: string,
  claims: InsuranceClaims[],
  batch: PatientSettlementBatch,
  snapshots: ReadonlyMap<string, LinkedOrderSnapshot | null>,
): PatientSettlementProjection {
  if (!claims.length) return hidden('NOT_AVAILABLE');
  const active = claims.filter(
    (claim) =>
      claim.statusConceptId !== INS.CLAIM_REVERSED &&
      !batch.reversals.some((row) => row.insuranceClaimId === claim.id),
  );
  if (active.length !== 1) return hidden('UNDER_REVIEW');
  const claim = active[0];
  const snapshot = snapshots.get(claim.id) ?? null;
  const lines = batch.lines.filter(
    (line) => line.insuranceClaimId === claim.id,
  );
  const coverage = batch.coverages.find(
    (row) =>
      row.id === claim.patientCoverageId &&
      row.patientProfileId === patientProfileId,
  );
  const plan = batch.plans.find((row) => row.id === coverage?.insurancePlanId);
  const product = batch.products.find(
    (row) => row.id === plan?.insuranceProductId,
  );
  const carrier = batch.carriers.find(
    (row) => row.id === claim.insuranceCarrierId,
  );
  if (
    !coverage ||
    !carrier ||
    product?.insuranceCarrierId !== carrier.id ||
    plan?.currencyConceptId !== claim.currencyConceptId ||
    snapshot?.patientProfileId !== patientProfileId ||
    !matchesLinkedClaimSnapshot(claim, lines, snapshot)
  )
    return hidden('UNDER_REVIEW');

  const versions = batch.versions
    .filter((row) => row.insuranceClaimId === claim.id)
    .sort((a, b) => b.adjudicationVersion - a.adjudicationVersion);
  if (!versions.length) return hidden('PENDING_PUBLICATION');
  // La cadena debe ser lineal: duplicados, saltos o referencias ajenas son ambiguos.
  if (
    versions.some(
      (version, index) =>
        version.adjudicationVersion !== versions.length - index ||
        (version.supersedesVersionId ?? null) !==
          (versions[index + 1]?.id ?? null),
    )
  )
    return hidden('UNDER_REVIEW');
  const version = versions[0];
  const publications = batch.eobs.filter(
    (row) =>
      row.insuranceClaimId === claim.id &&
      row.patientProfileId === patientProfileId &&
      row.claimAdjudicationVersionId === version.id,
  );
  if (!publications.length) return hidden('PENDING_PUBLICATION');
  if (
    publications.length !== 1 ||
    publications[0].statusConceptId !== INS.EOB_PUBLISHED ||
    !publications[0].publishedAt
  )
    return hidden('UNDER_REVIEW');
  if (![INS.CLAIM_ADJUDICATED, INS.CLAIM_PAID].includes(claim.statusConceptId))
    return hidden('UNDER_REVIEW');
  const adjudications = batch.adjudications.filter(
    (row) => row.claimAdjudicationVersionId === version.id,
  );
  try {
    validateLinkedClaimSettlement(claim, lines, version, adjudications);
  } catch (error) {
    if (
      error instanceof PreconditionFailedException ||
      error instanceof RangeError
    )
      return hidden('UNDER_REVIEW');
    throw error;
  }
  const currencyCode = resolveInsuranceCurrencyCode(
    claim.currencyConceptId,
    batch.concepts.find((row) => row.id === claim.currencyConceptId)?.code,
  );
  if (
    !currencyCode ||
    claim.totalAmount == null ||
    version.totalApprovedAmount == null ||
    version.totalPatientAmount == null ||
    version.totalDeniedAmount == null
  )
    return hidden('UNDER_REVIEW');
  const exclusions = [];
  for (const row of adjudications) {
    if (
      row.decisionConceptId !== INS.LINE_DECISION_DENIED &&
      mismosDecimales(row.deniedAmount, '0')
    )
      continue;
    const line = lines.find(
      (candidate) => candidate.id === row.insuranceClaimLineId,
    );
    const itemId =
      line?.inventoryReservationLineId ??
      line?.diagnosticStudyOfferingId ??
      line?.serviceConceptId;
    const itemName = itemId ? batch.itemNames.get(itemId) : undefined;
    if (
      !line ||
      !itemId ||
      !itemName ||
      row.deniedAmount == null ||
      !row.policyClauseReference?.trim()
    )
      return hidden('UNDER_REVIEW');
    exclusions.push({
      claimLineId: line.id,
      itemId,
      itemName,
      amount: row.deniedAmount,
      policyClauseReference: row.policyClauseReference,
      denialRationale: row.denialRationale ?? null,
    });
  }
  const result = adjudications.every(
    (row) => row.decisionConceptId === INS.LINE_DECISION_DENIED,
  )
    ? 'DENIED'
    : adjudications.every(
          (row) => row.decisionConceptId === INS.LINE_DECISION_APPROVED,
        ) && mismosDecimales(version.totalDeniedAmount, '0')
      ? 'APPROVED'
      : 'PARTIALLY_APPROVED';
  return {
    insuranceSettlementAvailability: 'AVAILABLE',
    insuranceSettlement: {
      claimId: claim.id,
      claimIdentifier: claim.claimIdentifier,
      adjudicationVersionId: version.id,
      adjudicationVersion: version.adjudicationVersion,
      eobId: publications[0].id,
      carrierName: carrier.legalName,
      policyIdentifier: coverage.policyIdentifier ?? null,
      totalBilledAmount: claim.totalAmount,
      totalApprovedAmount: version.totalApprovedAmount,
      totalPatientAmount: version.totalPatientAmount,
      totalDeniedAmount: version.totalDeniedAmount,
      currencyCode,
      result,
      exclusions,
    },
  };
}
