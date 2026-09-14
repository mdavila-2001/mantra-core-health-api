import {
  mismosDecimales,
  PreconditionFailedException,
  sumarDecimales,
} from '../../../common';
import { INS } from '../insurance.concepts';

type Amount = string | null | undefined;
export interface SettlementClaim {
  totalAmount?: Amount;
  currencyConceptId?: string | null;
}
export interface SettlementLine {
  id: string;
  billedAmount?: Amount;
}
export interface SettlementVersion {
  outcomeConceptId?: string | null;
  totalApprovedAmount?: Amount;
  totalPatientAmount?: Amount;
  totalDeniedAmount?: Amount;
}
export interface SettlementAdjudication {
  insuranceClaimLineId: string;
  decisionConceptId: string;
  approvedAmount?: Amount;
  patientAmount?: Amount;
  deniedAmount?: Amount;
  policyClauseReference?: string | null;
}

export function requireNonNegativeAmount(
  value: Amount,
): asserts value is string {
  if (typeof value !== 'string' || !/^\+?\d+(?:\.\d+)?$/.test(value)) {
    throw new PreconditionFailedException(
      'Se requiere un importe decimal explícito no negativo',
    );
  }
}

/** La misma conciliación protege la escritura, publicación y lectura privada. */
export function validateLinkedClaimSettlement(
  claim: SettlementClaim,
  lines: readonly SettlementLine[],
  version: SettlementVersion,
  adjudications: readonly SettlementAdjudication[],
): void {
  requireNonNegativeAmount(claim.totalAmount);
  if (
    !claim.currencyConceptId ||
    !lines.length ||
    lines.length !== adjudications.length
  )
    invalid();
  const byId = new Map(lines.map((line) => [line.id, line]));
  if (byId.size !== lines.length) invalid();
  const expectedOutcome = adjudications.every(
    (row) => row.decisionConceptId === INS.LINE_DECISION_DENIED,
  )
    ? INS.ADJ_OUTCOME_DENIED
    : INS.ADJ_OUTCOME_APPROVED;
  if (
    version.outcomeConceptId !== undefined &&
    version.outcomeConceptId !== expectedOutcome
  )
    invalid();
  const seen = new Set<string>();
  for (const row of adjudications) {
    const line = byId.get(row.insuranceClaimLineId);
    if (!line || seen.has(row.insuranceClaimLineId)) invalid();
    seen.add(row.insuranceClaimLineId);
    requireNonNegativeAmount(line.billedAmount);
    requireNonNegativeAmount(row.approvedAmount);
    requireNonNegativeAmount(row.patientAmount);
    requireNonNegativeAmount(row.deniedAmount);
    if (
      ![INS.LINE_DECISION_APPROVED, INS.LINE_DECISION_DENIED].includes(
        row.decisionConceptId,
      )
    )
      invalid();
    if (
      row.decisionConceptId === INS.LINE_DECISION_DENIED &&
      !mismosDecimales(row.approvedAmount, '0')
    )
      invalid();
    if (
      (row.decisionConceptId === INS.LINE_DECISION_DENIED ||
        !mismosDecimales(row.deniedAmount, '0')) &&
      !row.policyClauseReference?.trim()
    )
      invalid();
    if (
      !mismosDecimales(
        line.billedAmount,
        sumarDecimales([
          row.approvedAmount,
          row.patientAmount,
          row.deniedAmount,
        ]),
      )
    )
      invalid();
  }
  requireNonNegativeAmount(version.totalApprovedAmount);
  requireNonNegativeAmount(version.totalPatientAmount);
  requireNonNegativeAmount(version.totalDeniedAmount);
  if (
    !mismosDecimales(
      claim.totalAmount,
      sumarDecimales(lines.map((line) => line.billedAmount)),
    ) ||
    !mismosDecimales(
      version.totalApprovedAmount,
      sumarDecimales(adjudications.map((row) => row.approvedAmount)),
    ) ||
    !mismosDecimales(
      version.totalPatientAmount,
      sumarDecimales(adjudications.map((row) => row.patientAmount)),
    ) ||
    !mismosDecimales(
      version.totalDeniedAmount,
      sumarDecimales(adjudications.map((row) => row.deniedAmount)),
    )
  )
    invalid();
}

function invalid(): never {
  throw new PreconditionFailedException(
    'La liquidación debe incluir cada línea una vez, conciliar sus importes y fundamentar sus exclusiones',
  );
}

export interface LinkedOrderLine {
  inventoryReservationLineId?: string | null;
  diagnosticStudyOfferingId?: string | null;
  serviceConceptId?: string | null;
  quantity?: Amount;
  billedAmount?: Amount;
}
export interface LinkedOrderSnapshot {
  origin: 'PHARMACY' | 'DIAGNOSTIC';
  orderId: string;
  medicationRequestId?: string | null;
  patientProfileId: string;
  providerTenantId: string;
  billingProviderTypeConceptId: string;
  billingProviderEntityId: string;
  currencyConceptId?: string | null;
  totalAmount?: Amount;
  validForSettlement: boolean;
  canSubmit: boolean;
  lines: readonly LinkedOrderLine[];
}
export interface LinkedClaimSnapshotHeader extends SettlementClaim {
  inventoryReservationId?: string | null;
  serviceRequestId?: string | null;
  billingProviderTypeConceptId: string;
  billingProviderEntityId: string;
}

/** Las entregas parciales no alteran la cantidad originalmente facturada. */
export function matchesLinkedClaimSnapshot(
  claim: LinkedClaimSnapshotHeader,
  lines: readonly LinkedOrderLine[],
  snapshot: LinkedOrderSnapshot | null,
): boolean {
  if (
    !snapshot?.validForSettlement ||
    !snapshot.currencyConceptId ||
    claim.currencyConceptId !== snapshot.currencyConceptId ||
    claim.billingProviderTypeConceptId !==
      snapshot.billingProviderTypeConceptId ||
    claim.billingProviderEntityId !== snapshot.billingProviderEntityId ||
    (claim.inventoryReservationId ?? claim.serviceRequestId) !==
      snapshot.orderId ||
    Boolean(claim.inventoryReservationId) === Boolean(claim.serviceRequestId) ||
    lines.length !== snapshot.lines.length ||
    !lines.length
  )
    return false;
  try {
    if (!mismosDecimales(claim.totalAmount, snapshot.totalAmount)) return false;
    const identity = (line: LinkedOrderLine) =>
      line.inventoryReservationLineId ?? line.diagnosticStudyOfferingId;
    const byId = new Map(snapshot.lines.map((line) => [identity(line), line]));
    if (new Set(lines.map(identity)).size !== lines.length) return false;
    return lines.every((line) => {
      if (snapshot.origin === 'PHARMACY' && line.diagnosticStudyOfferingId)
        return false;
      if (snapshot.origin === 'DIAGNOSTIC' && line.inventoryReservationLineId)
        return false;
      const source = byId.get(identity(line));
      return (
        source !== undefined &&
        (line.serviceConceptId ?? null) === (source.serviceConceptId ?? null) &&
        mismosDecimales(line.quantity, source.quantity) &&
        mismosDecimales(line.billedAmount, source.billedAmount)
      );
    });
  } catch (error) {
    if (error instanceof RangeError) return false;
    throw error;
  }
}
