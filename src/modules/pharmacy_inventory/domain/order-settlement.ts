/** Snapshot de la liquidación del seguro que farmacia puede exponer. */
export interface PatientInsuranceSettlementSnapshot {
  readonly claimId: string;
  readonly claimIdentifier: string;
  readonly adjudicationVersionId: string;
  readonly adjudicationVersion: number;
  readonly eobId: string;
  readonly carrierName: string;
  readonly policyIdentifier: string | null;
  readonly totalBilledAmount: string;
  readonly totalApprovedAmount: string;
  readonly totalPatientAmount: string;
  readonly totalDeniedAmount: string;
  readonly currencyCode: string;
  readonly result: 'APPROVED' | 'PARTIALLY_APPROVED' | 'DENIED';
  readonly exclusions: readonly PatientInsuranceSettlementExclusion[];
}

/** Importe de una línea excluida durante la adjudicación. */
export interface PatientInsuranceSettlementExclusion {
  readonly claimLineId: string;
  readonly itemId: string;
  readonly itemName: string;
  readonly amount: string;
  readonly policyClauseReference: string;
  readonly denialRationale: string | null;
}

/** Resultado de liquidación visible y disponibilidad del resultado. */
export interface PatientSettlementProjection {
  readonly insuranceSettlement: PatientInsuranceSettlementSnapshot | null;
  readonly insuranceSettlementAvailability:
    'AVAILABLE' | 'PENDING_PUBLICATION' | 'UNDER_REVIEW' | 'NOT_AVAILABLE';
}

/** Proyección vacía cuando la persona no tiene liquidación visible. */
export function unavailableSettlement(): PatientSettlementProjection {
  return {
    insuranceSettlement: null,
    insuranceSettlementAvailability: 'NOT_AVAILABLE',
  };
}
