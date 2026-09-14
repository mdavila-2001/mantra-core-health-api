import { describe, expect, it } from '@jest/globals';
import { CONCEPTS } from '../../../common/constants/concepts';
import { DUNIT } from '../../diagnostic_units/diagnostic_units.concepts';
import { PHARM } from '../../pharmacy/pharmacy.concepts';
import { PINV } from '../../pharmacy_inventory/pharmacy_inventory.concepts';
import {
  ClaimAdjudicationVersions,
  ClaimLineAdjudications,
  ClaimReversals,
  InsuranceCarriers,
  InsuranceClaimLines,
  InsuranceClaims,
  InsurancePlans,
  InsuranceProducts,
  PatientCoverages,
  PatientExplanationsOfBenefit,
} from '../entities';
import { CatalogConcepts } from '../../terminology/entities';
import { INS } from '../insurance.concepts';
import type { PatientSettlementBatch } from '../repositories/patient-settlement.repository';
import type { LinkedOrderSnapshot } from './linked-claim-validation';
import { projectPatientSettlement } from './patient-settlement-projection';

function fixture(
  currencyConceptId = CONCEPTS.CURRENCY_BOB,
  currencyCode = 'BOB',
) {
  const claim: InsuranceClaims = Object.assign(new InsuranceClaims(), {
    id: 'claim',
    inventoryReservationId: 'order',
    patientCoverageId: 'coverage',
    insuranceCarrierId: 'carrier',
    billingProviderEntityId: 'pharmacy',
    billingProviderTypeConceptId: INS.BILLING_PROVIDER_TYPE_PHARMACY,
    currencyConceptId,
    totalAmount: '100.005',
    claimIdentifier: 'CLAIM-1',
    statusConceptId: INS.CLAIM_ADJUDICATED,
  });
  const line: InsuranceClaimLines = Object.assign(new InsuranceClaimLines(), {
    id: 'line',
    insuranceClaimId: claim.id,
    inventoryReservationLineId: 'portion',
    quantity: '1',
    billedAmount: '100.005',
  });
  const version: ClaimAdjudicationVersions = Object.assign(
    new ClaimAdjudicationVersions(),
    {
      id: 'version',
      insuranceClaimId: claim.id,
      adjudicationVersion: 1,
      totalApprovedAmount: '70.002',
      totalPatientAmount: '10.001',
      totalDeniedAmount: '20.002',
    },
  );
  const adjudication: ClaimLineAdjudications = Object.assign(
    new ClaimLineAdjudications(),
    {
      id: 'adjudication',
      claimAdjudicationVersionId: version.id,
      insuranceClaimLineId: line.id,
      decisionConceptId: INS.LINE_DECISION_APPROVED,
      approvedAmount: '70.002',
      patientAmount: '10.001',
      deniedAmount: '20.002',
      policyClauseReference: 'Cláusula 4.2: exclusión completa.',
    },
  );
  const eob: PatientExplanationsOfBenefit = Object.assign(
    new PatientExplanationsOfBenefit(),
    {
      id: 'eob',
      insuranceClaimId: claim.id,
      claimAdjudicationVersionId: version.id,
      patientProfileId: 'patient',
      statusConceptId: INS.EOB_PUBLISHED,
      publishedAt: new Date('2026-09-13T10:00:00Z'),
    },
  );
  const batch: PatientSettlementBatch = {
    claims: [claim],
    lines: [line],
    versions: [version],
    adjudications: [adjudication],
    eobs: [eob],
    reversals: [],
    coverages: [
      Object.assign(new PatientCoverages(), {
        id: 'coverage',
        patientProfileId: 'patient',
        insurancePlanId: 'plan',
        policyIdentifier: 'POL-1',
      }),
    ],
    plans: [
      Object.assign(new InsurancePlans(), {
        id: 'plan',
        insuranceProductId: 'product',
        currencyConceptId,
      }),
    ],
    products: [
      Object.assign(new InsuranceProducts(), {
        id: 'product',
        insuranceCarrierId: 'carrier',
      }),
    ],
    carriers: [
      Object.assign(new InsuranceCarriers(), {
        id: 'carrier',
        legalName: 'Seguro de prueba',
      }),
    ],
    concepts: [
      Object.assign(new CatalogConcepts(), {
        id: currencyConceptId,
        code: currencyCode,
      }),
    ],
    itemNames: new Map([['portion', 'Medicamento de prueba']]),
  };
  const snapshot: LinkedOrderSnapshot = {
    origin: 'PHARMACY',
    orderId: 'order',
    patientProfileId: 'patient',
    providerTenantId: 'provider',
    billingProviderTypeConceptId: claim.billingProviderTypeConceptId,
    billingProviderEntityId: 'pharmacy',
    currencyConceptId,
    totalAmount: '100.005',
    validForSettlement: true,
    canSubmit: false,
    lines: [line],
  };
  const snapshots = new Map([[claim.id, snapshot]]);
  return {
    claim,
    line,
    version,
    adjudication,
    eob,
    batch,
    snapshot,
    run: () =>
      projectPatientSettlement('patient', batch.claims, batch, snapshots),
  };
}

describe('Published patient settlement', () => {
  it.each([
    ['BOB', CONCEPTS.CURRENCY_BOB, 'BOB'],
    ['USD', CONCEPTS.CURRENCY_USD, 'USD'],
    ['diagnostic_units:CURRENCY_BOB', DUNIT.CURRENCY_BOB, 'BOB'],
    ['pharmacy:CURRENCY_USD', PHARM.CURRENCY_USD, 'USD'],
    ['pharmacy_inventory:CURRENCY_USD', PINV.CURRENCY_USD, 'USD'],
  ])(
    'resolves registered currency %s by its canonical identity',
    (code, id, expected) => {
      expect(fixture(id, code).run().insuranceSettlement).toMatchObject({
        currencyCode: expected,
        totalBilledAmount: '100.005',
        totalPatientAmount: '10.001',
      });
    },
  );
  it.each(['EUR', 'external:CURRENCY_USD'])(
    'preserves unknown registered currency %s without inferring a suffix',
    (code) => {
      const f = fixture('00000000-0000-4000-8000-000000000099', code);
      expect(f.run().insuranceSettlement?.currencyCode).toBe(code);
    },
  );
  it.each(['', '   '])(
    'does not infer a missing currency code from a known identity (%j)',
    (code) => {
      expect(fixture(PHARM.CURRENCY_USD, code).run()).toEqual({
        insuranceSettlementAvailability: 'UNDER_REVIEW',
        insuranceSettlement: null,
      });
    },
  );
  it('preserves a zero-valued settlement in the resolved legacy currency', () => {
    const f = fixture(PHARM.CURRENCY_USD, 'pharmacy:CURRENCY_USD');
    f.claim.totalAmount = '0';
    f.line.billedAmount = '0';
    f.snapshot.totalAmount = '0';
    Object.assign(f.adjudication, {
      approvedAmount: '0',
      patientAmount: '0',
      deniedAmount: '0',
      policyClauseReference: undefined,
    });
    Object.assign(f.version, {
      totalApprovedAmount: '0',
      totalPatientAmount: '0',
      totalDeniedAmount: '0',
    });
    expect(f.run()).toMatchObject({
      insuranceSettlementAvailability: 'AVAILABLE',
      insuranceSettlement: {
        currencyCode: 'USD',
        totalBilledAmount: '0',
        totalApprovedAmount: '0',
        totalPatientAmount: '0',
        totalDeniedAmount: '0',
        exclusions: [],
      },
    });
  });
  it('preserves exact amounts and distinguishes patient responsibility from excluded amounts', () => {
    expect(fixture().run()).toMatchObject({
      insuranceSettlementAvailability: 'AVAILABLE',
      insuranceSettlement: {
        totalPatientAmount: '10.001',
        totalDeniedAmount: '20.002',
        result: 'PARTIALLY_APPROVED',
        exclusions: [
          {
            amount: '20.002',
            policyClauseReference: 'Cláusula 4.2: exclusión completa.',
            denialRationale: null,
          },
        ],
      },
    });
  });
  it('keeps a denied amount unassigned even when patient responsibility is zero', () => {
    const f = fixture();
    Object.assign(f.adjudication, {
      decisionConceptId: INS.LINE_DECISION_DENIED,
      approvedAmount: '0',
      patientAmount: '0',
      deniedAmount: '100.005',
    });
    Object.assign(f.version, {
      totalApprovedAmount: '0',
      totalPatientAmount: '0',
      totalDeniedAmount: '100.005',
    });
    expect(f.run().insuranceSettlement).toMatchObject({
      result: 'DENIED',
      totalPatientAmount: '0',
      totalDeniedAmount: '100.005',
    });
  });
  it('derives approval without exclusions', () => {
    const f = fixture();
    Object.assign(f.adjudication, {
      approvedAmount: '100.005',
      patientAmount: '0',
      deniedAmount: '0',
      policyClauseReference: undefined,
    });
    Object.assign(f.version, {
      totalApprovedAmount: '100.005',
      totalPatientAmount: '0',
      totalDeniedAmount: '0',
    });
    expect(f.run().insuranceSettlement).toMatchObject({
      result: 'APPROVED',
      exclusions: [],
    });
  });
  it.each([
    [
      'foreign patient EOB',
      (f: ReturnType<typeof fixture>) => {
        f.eob.patientProfileId = 'other';
      },
      'PENDING_PUBLICATION',
    ],
    [
      'private adjudication',
      (f: ReturnType<typeof fixture>) => {
        f.batch.eobs = [];
      },
      'PENDING_PUBLICATION',
    ],
    [
      'no claim',
      (f: ReturnType<typeof fixture>) => {
        f.batch.claims = [];
      },
      'NOT_AVAILABLE',
    ],
    [
      'missing clause',
      (f: ReturnType<typeof fixture>) => {
        f.adjudication.policyClauseReference = '  ';
      },
      'UNDER_REVIEW',
    ],
    [
      'absent amount',
      (f: ReturnType<typeof fixture>) => {
        f.adjudication.patientAmount = undefined;
      },
      'UNDER_REVIEW',
    ],
    [
      'negative amount',
      (f: ReturnType<typeof fixture>) => {
        f.adjudication.patientAmount = '-1';
      },
      'UNDER_REVIEW',
    ],
    [
      'inconsistent totals',
      (f: ReturnType<typeof fixture>) => {
        f.version.totalPatientAmount = '10.002';
      },
      'UNDER_REVIEW',
    ],
    [
      'missing line',
      (f: ReturnType<typeof fixture>) => {
        f.batch.adjudications = [];
      },
      'UNDER_REVIEW',
    ],
    [
      'duplicate line',
      (f: ReturnType<typeof fixture>) => {
        f.batch.adjudications.push(f.adjudication);
      },
      'UNDER_REVIEW',
    ],
    [
      'changed economics',
      (f: ReturnType<typeof fixture>) => {
        f.snapshot.totalAmount = '101';
      },
      'UNDER_REVIEW',
    ],
    [
      'pending substitution',
      (f: ReturnType<typeof fixture>) => {
        f.snapshot.validForSettlement = false;
      },
      'UNDER_REVIEW',
    ],
    [
      'foreign insurer',
      (f: ReturnType<typeof fixture>) => {
        f.batch.products[0].insuranceCarrierId = 'other';
      },
      'UNDER_REVIEW',
    ],
    [
      'double origin',
      (f: ReturnType<typeof fixture>) => {
        f.claim.serviceRequestId = 'diagnostic';
      },
      'UNDER_REVIEW',
    ],
    [
      'reversed claim',
      (f: ReturnType<typeof fixture>) => {
        f.claim.statusConceptId = INS.CLAIM_REVERSED;
      },
      'UNDER_REVIEW',
    ],
    [
      'reversal evidence',
      (f: ReturnType<typeof fixture>) => {
        f.batch.reversals.push(
          Object.assign(new ClaimReversals(), { insuranceClaimId: f.claim.id }),
        );
      },
      'UNDER_REVIEW',
    ],
    [
      'withdrawn EOB',
      (f: ReturnType<typeof fixture>) => {
        f.eob.statusConceptId = 'withdrawn';
      },
      'UNDER_REVIEW',
    ],
    [
      'unknown currency',
      (f: ReturnType<typeof fixture>) => {
        f.batch.concepts = [];
      },
      'UNDER_REVIEW',
    ],
    [
      'duplicate publication',
      (f: ReturnType<typeof fixture>) => {
        f.batch.eobs.push(f.eob);
      },
      'UNDER_REVIEW',
    ],
  ] as const)(
    '%s suppresses definitive amounts',
    (_name, change, availability) => {
      const f = fixture();
      change(f);
      expect(f.run()).toEqual({
        insuranceSettlementAvailability: availability,
        insuranceSettlement: null,
      });
    },
  );
  it('withdraws the old publication while a new append-only version awaits publication', () => {
    const f = fixture();
    f.batch.versions.push(
      Object.assign(new ClaimAdjudicationVersions(), f.version, {
        id: 'version2',
        adjudicationVersion: 2,
        supersedesVersionId: 'version',
      }),
    );
    expect(f.run().insuranceSettlementAvailability).toBe('PENDING_PUBLICATION');
  });
  it('does not invalidate a settlement solely because the order was partially dispensed', () => {
    const f = fixture();
    f.snapshot.canSubmit = false;
    expect(f.run().insuranceSettlementAvailability).toBe('AVAILABLE');
  });
});
