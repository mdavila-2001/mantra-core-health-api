import { mismosDecimales, sumarDecimales } from '../../../common';
import { INS } from '../insurance.concepts';
import type {
  ClaimAdjudicationVersions,
  ClaimLineAdjudications,
  InsuranceClaimLines,
  InsuranceClaims,
  PatientExplanationsOfBenefit,
} from '../entities';

/** Disponibilidad de la liquidación: idéntica semántica que `PatientSettlementProjection`. */
export type ClaimSettlementAvailability =
  'AVAILABLE' | 'PENDING_PUBLICATION' | 'UNDER_REVIEW' | 'NOT_AVAILABLE';

export interface ClaimSettlementExclusion {
  readonly claimLineId: string;
  readonly itemName: string | null;
  readonly amount: string;
  readonly policyClauseReference: string;
  readonly denialRationale: string | null;
}

export interface ClaimSettlementBreakdown {
  readonly availability: ClaimSettlementAvailability;
  readonly totalBilledAmount: string | null;
  readonly totalApprovedAmount: string | null;
  readonly totalPatientAmount: string | null;
  readonly totalDeniedAmount: string | null;
  /** `true` sólo cuando la ecuación de la §3 del contrato cuadra al centavo. */
  readonly reconciled: boolean;
  readonly exclusions: readonly ClaimSettlementExclusion[];
}

function notReconciled(
  availability: ClaimSettlementAvailability,
  billed: string | null,
): ClaimSettlementBreakdown {
  return {
    availability,
    totalBilledAmount: billed,
    totalApprovedAmount: null,
    totalPatientAmount: null,
    totalDeniedAmount: null,
    reconciled: false,
    exclusions: [],
  };
}

/**
 * Desglose conciliado de liquidación para el detalle del prestador (CA-3.1,
 * CA-3.3). Función pura: no consulta nada, sólo interpreta lo que ya cargó
 * `ClaimsReadService.getClaim`.
 *
 * Reglas (contrato §3–§5, `docs/contracts/insurer-practitioner-settlement-batches.md`):
 * - Sin versión vigente → `PENDING_PUBLICATION` (o `NOT_AVAILABLE` si tampoco
 *   hay líneas facturadas, lo que no debería ocurrir con un reclamo real).
 * - Versión vigente sin EOB publicada → `PENDING_PUBLICATION`.
 * - Reclamo revertido → `UNDER_REVIEW` (nunca se presenta un revertido como
 *   liquidación firme, aunque conserve una versión y una EOB viejas).
 * - Cualquier exclusión sin `policyClauseReference` no vacía, o un importe
 *   denegado nulo, o la ecuación total ≠ suma de líneas → `UNDER_REVIEW` con
 *   `reconciled: false` (los importes se muestran igual para que la pantalla
 *   pueda explicar el descuadre, salvo que falte alguno).
 */
export function buildClaimSettlementBreakdown(params: {
  readonly claim: Pick<InsuranceClaims, 'totalAmount' | 'statusConceptId'>;
  readonly lines: readonly InsuranceClaimLines[];
  readonly version: ClaimAdjudicationVersions | undefined;
  readonly adjudications: readonly ClaimLineAdjudications[];
  readonly eob: PatientExplanationsOfBenefit | undefined | null;
  readonly reversed: boolean;
  readonly itemNames: ReadonlyMap<string, string>;
}): ClaimSettlementBreakdown {
  const { claim, lines, version, adjudications, eob, reversed, itemNames } =
    params;
  const billed = sumarDecimales(lines.map((line) => line.billedAmount));

  if (reversed) return notReconciled('UNDER_REVIEW', billed);
  if (!version) return notReconciled('PENDING_PUBLICATION', billed);
  if (!eob || eob.statusConceptId !== INS.EOB_PUBLISHED || !eob.publishedAt) {
    return notReconciled('PENDING_PUBLICATION', billed);
  }
  if (
    ![INS.CLAIM_ADJUDICATED, INS.CLAIM_PAID].includes(claim.statusConceptId)
  ) {
    return notReconciled('UNDER_REVIEW', billed);
  }

  const { totalApprovedAmount, totalPatientAmount, totalDeniedAmount } =
    version;
  if (
    totalApprovedAmount == null ||
    totalPatientAmount == null ||
    totalDeniedAmount == null
  ) {
    return notReconciled('UNDER_REVIEW', billed);
  }

  const adjByLine = new Map(
    adjudications.map((row) => [row.insuranceClaimLineId, row]),
  );
  const exclusions: ClaimSettlementExclusion[] = [];
  let everyExclusionValid = true;
  for (const row of adjudications) {
    const isDenial =
      row.decisionConceptId === INS.LINE_DECISION_DENIED ||
      (row.deniedAmount != null && !mismosDecimales(row.deniedAmount, '0'));
    if (!isDenial) continue;
    if (row.deniedAmount == null || !row.policyClauseReference?.trim()) {
      everyExclusionValid = false;
      continue;
    }
    exclusions.push({
      claimLineId: row.insuranceClaimLineId,
      itemName: itemNames.get(row.insuranceClaimLineId) ?? null,
      amount: row.deniedAmount,
      policyClauseReference: row.policyClauseReference,
      denialRationale: row.denialRationale ?? null,
    });
  }
  if (!everyExclusionValid) return notReconciled('UNDER_REVIEW', billed);

  // Toda línea facturada tiene que tener su adjudicación: una línea huérfana
  // es exactamente el caso que un descuadre silencioso escondería.
  if (lines.length > 0 && adjByLine.size !== lines.length) {
    return notReconciled('UNDER_REVIEW', billed);
  }

  const equationTotal = sumarDecimales([
    totalApprovedAmount,
    totalPatientAmount,
    totalDeniedAmount,
  ]);
  const reconciled =
    billed != null &&
    equationTotal != null &&
    mismosDecimales(billed, equationTotal) &&
    (claim.totalAmount == null || mismosDecimales(billed, claim.totalAmount));

  return {
    availability: reconciled ? 'AVAILABLE' : 'UNDER_REVIEW',
    totalBilledAmount: billed,
    totalApprovedAmount,
    totalPatientAmount,
    totalDeniedAmount,
    reconciled,
    exclusions,
  };
}
