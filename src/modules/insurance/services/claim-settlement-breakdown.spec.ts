import { describe, expect, it } from '@jest/globals';
import {
  ClaimAdjudicationVersions,
  ClaimLineAdjudications,
  InsuranceClaimLines,
  InsuranceClaims,
  PatientExplanationsOfBenefit,
} from '../entities';
import { INS } from '../insurance.concepts';
import { buildClaimSettlementBreakdown } from './claim-settlement-breakdown';

function claim(over: Record<string, unknown> = {}): InsuranceClaims {
  return Object.assign(new InsuranceClaims(), {
    id: 'claim',
    totalAmount: '300.00',
    statusConceptId: INS.CLAIM_ADJUDICATED,
    ...over,
  });
}

function line(
  id: string,
  billedAmount: string,
  over: Record<string, unknown> = {},
): InsuranceClaimLines {
  return Object.assign(new InsuranceClaimLines(), {
    id,
    insuranceClaimId: 'claim',
    lineSequence: 1,
    billedAmount,
    ...over,
  });
}

function version(
  over: Record<string, unknown> = {},
): ClaimAdjudicationVersions {
  return Object.assign(new ClaimAdjudicationVersions(), {
    id: 'version',
    insuranceClaimId: 'claim',
    adjudicationVersion: 1,
    ...over,
  });
}

function adjudication(
  lineId: string,
  over: Record<string, unknown> = {},
): ClaimLineAdjudications {
  return Object.assign(new ClaimLineAdjudications(), {
    id: `adj-${lineId}`,
    claimAdjudicationVersionId: 'version',
    insuranceClaimLineId: lineId,
    decisionConceptId: INS.LINE_DECISION_APPROVED,
    approvedAmount: '0',
    patientAmount: '0',
    deniedAmount: '0',
    ...over,
  });
}

function publishedEob(
  over: Record<string, unknown> = {},
): PatientExplanationsOfBenefit {
  return Object.assign(new PatientExplanationsOfBenefit(), {
    id: 'eob',
    insuranceClaimId: 'claim',
    claimAdjudicationVersionId: 'version',
    patientProfileId: 'patient',
    statusConceptId: INS.EOB_PUBLISHED,
    publishedAt: new Date('2026-09-01T00:00:00Z'),
    ...over,
  });
}

describe('buildClaimSettlementBreakdown', () => {
  describe('correct', () => {
    it('conciliates a partially approved claim into three separate amounts', () => {
      const l1 = line('l1', '180.00');
      const l2 = line('l2', '120.00');
      const result = buildClaimSettlementBreakdown({
        claim: claim(),
        lines: [l1, l2],
        version: version({
          totalApprovedAmount: '150.00',
          totalPatientAmount: '30.00',
          totalDeniedAmount: '120.00',
        }),
        adjudications: [
          adjudication('l1', {
            approvedAmount: '150.00',
            patientAmount: '30.00',
            deniedAmount: '0',
          }),
          adjudication('l2', {
            decisionConceptId: INS.LINE_DECISION_DENIED,
            approvedAmount: '0',
            patientAmount: '0',
            deniedAmount: '120.00',
            policyClauseReference:
              'Cláusula 12.3: estudios complementarios sin autorización previa',
          }),
        ],
        eob: publishedEob(),
        reversed: false,
        itemNames: new Map([['l2', 'ECG']]),
      });
      expect(result.availability).toBe('AVAILABLE');
      expect(result.reconciled).toBe(true);
      expect(result.totalBilledAmount).toBe('300.00');
      expect(result.totalApprovedAmount).toBe('150.00');
      expect(result.totalPatientAmount).toBe('30.00');
      expect(result.totalDeniedAmount).toBe('120.00');
      expect(result.exclusions).toEqual([
        {
          claimLineId: 'l2',
          itemName: 'ECG',
          amount: '120.00',
          policyClauseReference:
            'Cláusula 12.3: estudios complementarios sin autorización previa',
          denialRationale: null,
        },
      ]);
    });

    it('fully approved claim has no exclusions', () => {
      const l1 = line('l1', '250.00');
      const result = buildClaimSettlementBreakdown({
        claim: claim({ totalAmount: '250.00' }),
        lines: [l1],
        version: version({
          totalApprovedAmount: '250.00',
          totalPatientAmount: '0.00',
          totalDeniedAmount: '0.00',
        }),
        adjudications: [
          adjudication('l1', {
            approvedAmount: '250.00',
            patientAmount: '0.00',
          }),
        ],
        eob: publishedEob(),
        reversed: false,
        itemNames: new Map(),
      });
      expect(result.availability).toBe('AVAILABLE');
      expect(result.reconciled).toBe(true);
      expect(result.exclusions).toHaveLength(0);
    });
  });

  describe('límite', () => {
    it('reconciles across differing decimal scales without floating point', () => {
      const l1 = line('l1', '100.005');
      const result = buildClaimSettlementBreakdown({
        claim: claim({ totalAmount: '100.005' }),
        lines: [l1],
        version: version({
          totalApprovedAmount: '70.002',
          totalPatientAmount: '10.001',
          totalDeniedAmount: '20.002',
        }),
        adjudications: [
          adjudication('l1', {
            approvedAmount: '70.002',
            patientAmount: '10.001',
            deniedAmount: '20.002',
            policyClauseReference: 'Cláusula 4.2: exclusión completa.',
          }),
        ],
        eob: publishedEob(),
        reversed: false,
        itemNames: new Map(),
      });
      expect(result.reconciled).toBe(true);
      expect(result.totalBilledAmount).toBe('100.005');
    });

    it('a denial reduced to exactly zero is not treated as an exclusion', () => {
      const l1 = line('l1', '50.00');
      const result = buildClaimSettlementBreakdown({
        claim: claim({ totalAmount: '50.00' }),
        lines: [l1],
        version: version({
          totalApprovedAmount: '50.00',
          totalPatientAmount: '0.00',
          totalDeniedAmount: '0.00',
        }),
        adjudications: [
          adjudication('l1', {
            decisionConceptId: INS.LINE_DECISION_DENIED,
            approvedAmount: '50.00',
            patientAmount: '0.00',
            deniedAmount: '0.00',
          }),
        ],
        eob: publishedEob(),
        reversed: false,
        itemNames: new Map(),
      });
      // Decisión DENIED pero denied_amount === 0: sigue contando como
      // exclusión formal a efectos del contrato (línea rechazada), y por eso
      // exige cláusula igual. Sin ella, degrada.
      expect(result.availability).toBe('UNDER_REVIEW');
    });

    it('an amount beyond Number.MAX_SAFE_INTEGER still reconciles exactly', () => {
      const big = '90071992547409.91';
      const l1 = line('l1', big);
      const result = buildClaimSettlementBreakdown({
        claim: claim({ totalAmount: big }),
        lines: [l1],
        version: version({
          totalApprovedAmount: big,
          totalPatientAmount: '0.00',
          totalDeniedAmount: '0.00',
        }),
        adjudications: [
          adjudication('l1', { approvedAmount: big, patientAmount: '0.00' }),
        ],
        eob: publishedEob(),
        reversed: false,
        itemNames: new Map(),
      });
      expect(result.reconciled).toBe(true);
    });
  });

  describe('inválido', () => {
    it('a blank policyClauseReference degrades to UNDER_REVIEW', () => {
      const l1 = line('l1', '100.00');
      const result = buildClaimSettlementBreakdown({
        claim: claim({ totalAmount: '100.00' }),
        lines: [l1],
        version: version({
          totalApprovedAmount: '0.00',
          totalPatientAmount: '0.00',
          totalDeniedAmount: '100.00',
        }),
        adjudications: [
          adjudication('l1', {
            decisionConceptId: INS.LINE_DECISION_DENIED,
            deniedAmount: '100.00',
            policyClauseReference: '   ',
          }),
        ],
        eob: publishedEob(),
        reversed: false,
        itemNames: new Map(),
      });
      expect(result.availability).toBe('UNDER_REVIEW');
      expect(result.reconciled).toBe(false);
      expect(result.exclusions).toHaveLength(0);
    });

    it('a billed line without any adjudication degrades to UNDER_REVIEW', () => {
      const l1 = line('l1', '100.00');
      const l2 = line('l2', '50.00');
      const result = buildClaimSettlementBreakdown({
        claim: claim({ totalAmount: '150.00' }),
        lines: [l1, l2],
        version: version({
          totalApprovedAmount: '100.00',
          totalPatientAmount: '0.00',
          totalDeniedAmount: '0.00',
        }),
        adjudications: [adjudication('l1', { approvedAmount: '100.00' })],
        eob: publishedEob(),
        reversed: false,
        itemNames: new Map(),
      });
      expect(result.availability).toBe('UNDER_REVIEW');
    });

    it('version totals not matching the sum of billed lines degrades to UNDER_REVIEW', () => {
      const l1 = line('l1', '100.00');
      const result = buildClaimSettlementBreakdown({
        claim: claim({ totalAmount: '100.00' }),
        lines: [l1],
        version: version({
          totalApprovedAmount: '60.00',
          totalPatientAmount: '10.00',
          totalDeniedAmount: '0.00',
        }),
        adjudications: [
          adjudication('l1', {
            approvedAmount: '60.00',
            patientAmount: '10.00',
          }),
        ],
        eob: publishedEob(),
        reversed: false,
        itemNames: new Map(),
      });
      expect(result.availability).toBe('UNDER_REVIEW');
      expect(result.reconciled).toBe(false);
    });

    it('a reversed claim never shows a firm settlement, even with a version and EOB', () => {
      const l1 = line('l1', '100.00');
      const result = buildClaimSettlementBreakdown({
        claim: claim({ statusConceptId: INS.CLAIM_REVERSED }),
        lines: [l1],
        version: version({
          totalApprovedAmount: '100.00',
          totalPatientAmount: '0.00',
          totalDeniedAmount: '0.00',
        }),
        adjudications: [adjudication('l1', { approvedAmount: '100.00' })],
        eob: publishedEob(),
        reversed: true,
        itemNames: new Map(),
      });
      expect(result.availability).toBe('UNDER_REVIEW');
      expect(result.totalApprovedAmount).toBeNull();
    });

    it('without a published EOB the settlement is pending publication', () => {
      const l1 = line('l1', '100.00');
      const result = buildClaimSettlementBreakdown({
        claim: claim(),
        lines: [l1],
        version: version({
          totalApprovedAmount: '100.00',
          totalPatientAmount: '0.00',
          totalDeniedAmount: '0.00',
        }),
        adjudications: [adjudication('l1', { approvedAmount: '100.00' })],
        eob: null,
        reversed: false,
        itemNames: new Map(),
      });
      expect(result.availability).toBe('PENDING_PUBLICATION');
    });

    it('without any adjudication version yet, the settlement is pending publication', () => {
      const l1 = line('l1', '100.00');
      const result = buildClaimSettlementBreakdown({
        claim: claim({ statusConceptId: INS.CLAIM_SUBMITTED }),
        lines: [l1],
        version: undefined,
        adjudications: [],
        eob: undefined,
        reversed: false,
        itemNames: new Map(),
      });
      expect(result.availability).toBe('PENDING_PUBLICATION');
      expect(result.totalBilledAmount).toBe('100.00');
    });
  });
});
