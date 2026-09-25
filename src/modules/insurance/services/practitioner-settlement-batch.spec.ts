import { describe, expect, it } from '@jest/globals';
import { PreconditionFailedException } from '../../../common';
import {
  ClaimAdjudicationVersions,
  ClaimLineAdjudications,
  InsuranceClaimLines,
  InsuranceClaims,
  PatientExplanationsOfBenefit,
} from '../entities';
import { INS } from '../insurance.concepts';
import {
  addCivilDays,
  inferSettlementCadence,
  laPazMidnightUtc,
  resolveSettlementPeriod,
  selectSettlementClaims,
} from './practitioner-settlement-batch';

function claim(
  id: string,
  over: Record<string, unknown> = {},
): InsuranceClaims {
  return Object.assign(new InsuranceClaims(), {
    id,
    claimIdentifier: `CLM-${id}`,
    totalAmount: '100.00',
    currencyConceptId: 'bob',
    statusConceptId: INS.CLAIM_ADJUDICATED,
    ...over,
  });
}
function line(
  id: string,
  claimId: string,
  billedAmount = '100.00',
): InsuranceClaimLines {
  return Object.assign(new InsuranceClaimLines(), {
    id,
    insuranceClaimId: claimId,
    lineSequence: 1,
    billedAmount,
  });
}
function version(
  id: string,
  claimId: string,
  over: Record<string, unknown> = {},
): ClaimAdjudicationVersions {
  return Object.assign(new ClaimAdjudicationVersions(), {
    id,
    insuranceClaimId: claimId,
    adjudicationVersion: 1,
    totalApprovedAmount: '80.00',
    totalPatientAmount: '20.00',
    totalDeniedAmount: '0.00',
    ...over,
  });
}
function adjudication(
  lineId: string,
  versionId: string,
  over: Record<string, unknown> = {},
): ClaimLineAdjudications {
  return Object.assign(new ClaimLineAdjudications(), {
    id: `adj-${lineId}`,
    claimAdjudicationVersionId: versionId,
    insuranceClaimLineId: lineId,
    decisionConceptId: INS.LINE_DECISION_APPROVED,
    approvedAmount: '80.00',
    patientAmount: '20.00',
    deniedAmount: '0.00',
    ...over,
  });
}
function eob(
  id: string,
  versionId: string,
  publishedAt: Date,
): PatientExplanationsOfBenefit {
  return Object.assign(new PatientExplanationsOfBenefit(), {
    id,
    claimAdjudicationVersionId: versionId,
    statusConceptId: INS.EOB_PUBLISHED,
    publishedAt,
  });
}

describe('resolveSettlementPeriod', () => {
  it('WEEKLY suma seis días', () => {
    expect(resolveSettlementPeriod('WEEKLY', '2026-09-07')).toEqual({
      periodStart: '2026-09-07',
      periodEnd: '2026-09-13',
    });
  });
  it('BIWEEKLY primera quincena termina el 15', () => {
    expect(resolveSettlementPeriod('BIWEEKLY', '2026-09-01')).toEqual({
      periodStart: '2026-09-01',
      periodEnd: '2026-09-15',
    });
  });
  it('BIWEEKLY segunda quincena termina en el último día del mes (febrero, bisiesto)', () => {
    expect(resolveSettlementPeriod('BIWEEKLY', '2028-02-16')).toEqual({
      periodStart: '2028-02-16',
      periodEnd: '2028-02-29',
    });
  });
  it('MONTHLY termina en el último día del mes', () => {
    expect(resolveSettlementPeriod('MONTHLY', '2026-04-01')).toEqual({
      periodStart: '2026-04-01',
      periodEnd: '2026-04-30',
    });
  });
  it('un inicio de quincena desalineado responde 422', () => {
    expect(() => resolveSettlementPeriod('BIWEEKLY', '2026-09-10')).toThrow(
      PreconditionFailedException,
    );
  });
  it('un mes que no empieza el día 1 responde 422', () => {
    expect(() => resolveSettlementPeriod('MONTHLY', '2026-09-02')).toThrow(
      PreconditionFailedException,
    );
  });
});

describe('inferSettlementCadence', () => {
  it('reconoce las tres cadencias', () => {
    expect(inferSettlementCadence('2026-09-07', '2026-09-13')).toBe('WEEKLY');
    expect(inferSettlementCadence('2026-09-01', '2026-09-15')).toBe('BIWEEKLY');
    expect(inferSettlementCadence('2026-09-16', '2026-09-30')).toBe('BIWEEKLY');
    expect(inferSettlementCadence('2026-09-01', '2026-09-30')).toBe('MONTHLY');
  });
});

describe('addCivilDays / laPazMidnightUtc', () => {
  it('suma días civiles sin ambigüedad de zona horaria', () => {
    expect(addCivilDays('2026-02-28', 1)).toBe('2026-03-01');
  });
  it('la medianoche de La Paz es UTC-4 todo el año', () => {
    expect(laPazMidnightUtc('2026-09-01').toISOString()).toBe(
      '2026-09-01T04:00:00.000Z',
    );
  });
});

describe('selectSettlementClaims', () => {
  const period = { periodStart: '2026-09-01', periodEnd: '2026-09-30' };

  function baseParams(
    over: Partial<Parameters<typeof selectSettlementClaims>[0]> = {},
  ) {
    return {
      claims: [],
      linesByClaimId: new Map(),
      currentVersionByClaimId: new Map(),
      adjudicationsByVersionId: new Map(),
      eobByVersionId: new Map(),
      reversedClaimIds: new Set<string>(),
      previouslyIncludedItemByClaimId: new Map(),
      alreadyAdjustedClaimIds: new Set<string>(),
      period,
      ...over,
    };
  }

  describe('correcto', () => {
    it('incluye dos reclamos publicados dentro del período y suma sus totales', () => {
      const c1 = claim('c1');
      const c2 = claim('c2', { totalAmount: '50.00' });
      const l1 = line('l1', 'c1');
      const l2 = line('l2', 'c2', '50.00');
      const v1 = version('v1', 'c1');
      const v2 = version('v2', 'c2', {
        totalApprovedAmount: '40.00',
        totalPatientAmount: '10.00',
      });
      const result = selectSettlementClaims(
        baseParams({
          claims: [c1, c2],
          linesByClaimId: new Map([
            ['c1', [l1]],
            ['c2', [l2]],
          ]),
          currentVersionByClaimId: new Map([
            ['c1', v1],
            ['c2', v2],
          ]),
          adjudicationsByVersionId: new Map([
            ['v1', [adjudication('l1', 'v1')]],
            [
              'v2',
              [
                adjudication('l2', 'v2', {
                  approvedAmount: '40.00',
                  patientAmount: '10.00',
                }),
              ],
            ],
          ]),
          eobByVersionId: new Map([
            ['v1', eob('eob1', 'v1', new Date('2026-09-05T12:00:00Z'))],
            ['v2', eob('eob2', 'v2', new Date('2026-09-20T12:00:00Z'))],
          ]),
        }),
      );
      expect(result.included).toHaveLength(2);
      expect(result.excluded).toHaveLength(0);
      expect(result.currencyConceptId).toBe('bob');
      expect(result.totals).toEqual({
        totalBilledAmount: '150.00',
        totalApprovedAmount: '120.00',
        totalPatientAmount: '30.00',
        totalDeniedAmount: '0.00',
        totalReversalAdjustmentAmount: '0',
      });
    });
  });

  describe('límite', () => {
    it('una EOB publicada en el último instante del período entra; publicada un instante después queda OUT_OF_PERIOD', () => {
      const c1 = claim('c1');
      const c2 = claim('c2');
      const l1 = line('l1', 'c1');
      const l2 = line('l2', 'c2');
      const v1 = version('v1', 'c1');
      const v2 = version('v2', 'c2');
      const result = selectSettlementClaims(
        baseParams({
          claims: [c1, c2],
          linesByClaimId: new Map([
            ['c1', [l1]],
            ['c2', [l2]],
          ]),
          currentVersionByClaimId: new Map([
            ['c1', v1],
            ['c2', v2],
          ]),
          adjudicationsByVersionId: new Map([
            ['v1', [adjudication('l1', 'v1')]],
            ['v2', [adjudication('l2', 'v2')]],
          ]),
          eobByVersionId: new Map([
            // Último milisegundo civil del 30/09 en La Paz.
            ['v1', eob('eob1', 'v1', new Date('2026-10-01T03:59:59.999Z'))],
            // Un milisegundo después: ya es 01/10 en La Paz.
            ['v2', eob('eob2', 'v2', new Date('2026-10-01T04:00:00.000Z'))],
          ]),
        }),
      );
      expect(result.included.map((row) => row.claimId)).toEqual(['c1']);
      expect(result.excluded).toEqual([
        { claimId: 'c2', claimIdentifier: 'CLM-c2', reason: 'OUT_OF_PERIOD' },
      ]);
    });

    it('un reclamo revertido con ajuste pendiente aparece en reversalAdjustments y no en excluded', () => {
      const c1 = claim('c1', { statusConceptId: INS.CLAIM_REVERSED });
      const result = selectSettlementClaims(
        baseParams({
          claims: [c1],
          reversedClaimIds: new Set(['c1']),
          previouslyIncludedItemByClaimId: new Map([
            ['c1', { id: 'item-1', expectedAmount: '80.00' }],
          ]),
        }),
      );
      expect(result.included).toHaveLength(0);
      expect(result.excluded).toHaveLength(0);
      expect(result.reversalAdjustments).toEqual([
        {
          claimId: 'c1',
          claimIdentifier: 'CLM-c1',
          previousItemId: 'item-1',
          adjustmentAmount: '-80.00',
        },
      ]);
      expect(result.totals.totalReversalAdjustmentAmount).toBe('-80.00');
    });
  });

  describe('inválido', () => {
    it('un reclamo sin adjudicar (SUBMITTED) queda excluido con NOT_ADJUDICATED', () => {
      const c1 = claim('c1', { statusConceptId: INS.CLAIM_SUBMITTED });
      const result = selectSettlementClaims(baseParams({ claims: [c1] }));
      expect(result.excluded).toEqual([
        { claimId: 'c1', claimIdentifier: 'CLM-c1', reason: 'NOT_ADJUDICATED' },
      ]);
    });

    it('un reclamo revertido (nunca antes incluido) queda excluido con REVERSED, no genera ajuste', () => {
      const c1 = claim('c1', { statusConceptId: INS.CLAIM_REVERSED });
      const result = selectSettlementClaims(
        baseParams({ claims: [c1], reversedClaimIds: new Set(['c1']) }),
      );
      expect(result.excluded).toEqual([
        { claimId: 'c1', claimIdentifier: 'CLM-c1', reason: 'REVERSED' },
      ]);
      expect(result.reversalAdjustments).toHaveLength(0);
    });

    it('un reclamo adjudicado sin EOB publicada queda excluido con EOB_NOT_PUBLISHED', () => {
      const c1 = claim('c1');
      const v1 = version('v1', 'c1');
      const result = selectSettlementClaims(
        baseParams({
          claims: [c1],
          linesByClaimId: new Map([['c1', [line('l1', 'c1')]]]),
          currentVersionByClaimId: new Map([['c1', v1]]),
          adjudicationsByVersionId: new Map([
            ['v1', [adjudication('l1', 'v1')]],
          ]),
        }),
      );
      expect(result.excluded).toEqual([
        {
          claimId: 'c1',
          claimIdentifier: 'CLM-c1',
          reason: 'EOB_NOT_PUBLISHED',
        },
      ]);
    });

    it('un reclamo ya incluido en un lote anterior, sin revertir, es invisible (no aparece en ningún lado)', () => {
      const c1 = claim('c1');
      const result = selectSettlementClaims(
        baseParams({
          claims: [c1],
          previouslyIncludedItemByClaimId: new Map([
            ['c1', { id: 'item-1', expectedAmount: '80.00' }],
          ]),
        }),
      );
      expect(result.included).toHaveLength(0);
      expect(result.excluded).toHaveLength(0);
      expect(result.reversalAdjustments).toHaveLength(0);
    });

    it('un reclamo con exclusión sin cláusula (no conciliado) queda excluido con NOT_RECONCILED', () => {
      const c1 = claim('c1');
      const v1 = version('v1', 'c1', {
        totalApprovedAmount: '0.00',
        totalPatientAmount: '0.00',
        totalDeniedAmount: '100.00',
      });
      const result = selectSettlementClaims(
        baseParams({
          claims: [c1],
          linesByClaimId: new Map([['c1', [line('l1', 'c1')]]]),
          currentVersionByClaimId: new Map([['c1', v1]]),
          adjudicationsByVersionId: new Map([
            [
              'v1',
              [
                adjudication('l1', 'v1', {
                  decisionConceptId: INS.LINE_DECISION_DENIED,
                  approvedAmount: '0.00',
                  patientAmount: '0.00',
                  deniedAmount: '100.00',
                  policyClauseReference: '   ',
                }),
              ],
            ],
          ]),
          eobByVersionId: new Map([
            ['v1', eob('eob1', 'v1', new Date('2026-09-05T12:00:00Z'))],
          ]),
        }),
      );
      expect(result.excluded).toEqual([
        { claimId: 'c1', claimIdentifier: 'CLM-c1', reason: 'NOT_RECONCILED' },
      ]);
    });

    it('dos reclamos elegibles en monedas distintas: el segundo queda excluido con CURRENCY_MISMATCH', () => {
      const c1 = claim('c1', { currencyConceptId: 'bob' });
      const c2 = claim('c2', { currencyConceptId: 'usd' });
      const v1 = version('v1', 'c1');
      const v2 = version('v2', 'c2');
      const result = selectSettlementClaims(
        baseParams({
          claims: [c1, c2],
          linesByClaimId: new Map([
            ['c1', [line('l1', 'c1')]],
            ['c2', [line('l2', 'c2')]],
          ]),
          currentVersionByClaimId: new Map([
            ['c1', v1],
            ['c2', v2],
          ]),
          adjudicationsByVersionId: new Map([
            ['v1', [adjudication('l1', 'v1')]],
            ['v2', [adjudication('l2', 'v2')]],
          ]),
          eobByVersionId: new Map([
            ['v1', eob('eob1', 'v1', new Date('2026-09-05T12:00:00Z'))],
            ['v2', eob('eob2', 'v2', new Date('2026-09-06T12:00:00Z'))],
          ]),
        }),
      );
      expect(result.included.map((row) => row.claimId)).toEqual(['c1']);
      expect(result.excluded).toEqual([
        {
          claimId: 'c2',
          claimIdentifier: 'CLM-c2',
          reason: 'CURRENCY_MISMATCH',
        },
      ]);
    });
  });
});
