import { PreconditionFailedException } from '../../../common';
import { INS } from '../insurance.concepts';
import {
  validateLinkedClaimSettlement,
  matchesLinkedClaimSnapshot,
  type SettlementAdjudication,
  type LinkedOrderSnapshot,
} from './linked-claim-validation';

const claim = { totalAmount: '120.005', currencyConceptId: 'currency' };
const lines = [{ id: 'line', billedAmount: '120.005' }];
const version = {
  totalApprovedAmount: '80.001',
  totalPatientAmount: '20.002',
  totalDeniedAmount: '20.002',
};
const decision: SettlementAdjudication = {
  insuranceClaimLineId: 'line',
  decisionConceptId: INS.LINE_DECISION_APPROVED,
  approvedAmount: '80.001',
  patientAmount: '20.002',
  deniedAmount: '20.002',
  policyClauseReference: 'Cláusula 4: límite por prestación.',
};

describe('validateLinkedClaimSettlement', () => {
  it('concilia fracciones sin redondear y conserva excluido separado de paciente', () => {
    expect(() =>
      validateLinkedClaimSettlement(claim, lines, version, [decision]),
    ).not.toThrow();
  });
  it('concilia valores por su escala decimal y montos superiores a Number.MAX_SAFE_INTEGER', () => {
    const amount = '9007199254740993.001';
    expect(() =>
      validateLinkedClaimSettlement(
        { ...claim, totalAmount: amount },
        [{ id: 'line', billedAmount: amount }],
        {
          totalApprovedAmount: amount,
          totalPatientAmount: '0',
          totalDeniedAmount: '0.000',
        },
        [
          {
            ...decision,
            approvedAmount: amount,
            patientAmount: '0.0',
            deniedAmount: '0',
          },
        ],
      ),
    ).not.toThrow();
  });
  it.each([undefined, null, '-1', 'NaN', 'Infinity', '1e2', ' ', '0,1'])(
    'rechaza importe ausente o inválido %s',
    (value) => {
      expect(() =>
        validateLinkedClaimSettlement(claim, lines, version, [
          { ...decision, patientAmount: value },
        ]),
      ).toThrow(PreconditionFailedException);
    },
  );
  it('no convierte una denegación en deuda', () => {
    expect(() =>
      validateLinkedClaimSettlement(
        { ...claim, totalAmount: '100' },
        [{ id: 'line', billedAmount: '100' }],
        {
          totalApprovedAmount: '0',
          totalPatientAmount: '0',
          totalDeniedAmount: '100',
        },
        [
          {
            ...decision,
            decisionConceptId: INS.LINE_DECISION_DENIED,
            approvedAmount: '0',
            patientAmount: '0',
            deniedAmount: '100',
          },
        ],
      ),
    ).not.toThrow();
  });
  it('rechaza responsabilidades solapadas', () => {
    expect(() =>
      validateLinkedClaimSettlement(claim, lines, version, [
        { ...decision, patientAmount: '40.004' },
      ]),
    ).toThrow();
  });
  it('rechaza una adjudicación faltante', () => {
    expect(() =>
      validateLinkedClaimSettlement(
        claim,
        [...lines, { id: 'missing', billedAmount: '0' }],
        version,
        [decision],
      ),
    ).toThrow();
  });
  it('rechaza líneas ajenas o duplicadas aunque coincida la cantidad', () => {
    expect(() =>
      validateLinkedClaimSettlement(claim, lines, version, [
        { ...decision, insuranceClaimLineId: 'other' },
      ]),
    ).toThrow();
    expect(() =>
      validateLinkedClaimSettlement(
        claim,
        [...lines, { id: 'other', billedAmount: '0' }],
        version,
        [decision, decision],
      ),
    ).toThrow();
  });
  it.each(['', '   ', undefined])(
    'requiere cláusula legible para una exclusión aprobada: %s',
    (clause) => {
      expect(() =>
        validateLinkedClaimSettlement(claim, lines, version, [
          { ...decision, policyClauseReference: clause },
        ]),
      ).toThrow();
    },
  );
  it('rechaza cabecera que no coincide con sus líneas', () => {
    expect(() =>
      validateLinkedClaimSettlement(
        claim,
        lines,
        { ...version, totalPatientAmount: '20' },
        [decision],
      ),
    ).toThrow();
  });
  it('rechaza una denegación con monto aprobado', () => {
    expect(() =>
      validateLinkedClaimSettlement(claim, lines, version, [
        { ...decision, decisionConceptId: INS.LINE_DECISION_DENIED },
      ]),
    ).toThrow();
  });
});

describe('matchesLinkedClaimSnapshot', () => {
  const linkedClaim = {
    inventoryReservationId: 'order',
    billingProviderTypeConceptId: INS.BILLING_PROVIDER_TYPE_PHARMACY,
    billingProviderEntityId: 'pharmacy',
    currencyConceptId: 'currency',
    totalAmount: '120.005',
  };
  const sourceLines = [
    {
      inventoryReservationLineId: 'portion',
      serviceConceptId: 'medicine',
      quantity: '2',
      billedAmount: '120.005',
    },
  ];
  const snapshot: LinkedOrderSnapshot = {
    origin: 'PHARMACY',
    orderId: 'order',
    patientProfileId: 'patient',
    providerTenantId: 'tenant',
    billingProviderTypeConceptId: INS.BILLING_PROVIDER_TYPE_PHARMACY,
    billingProviderEntityId: 'pharmacy',
    currencyConceptId: 'currency',
    totalAmount: '120.005',
    validForSettlement: true,
    canSubmit: false,
    lines: sourceLines,
  };
  it('conserva una liquidación al dispensar, cuando los importes congelados siguen iguales', () => {
    expect(matchesLinkedClaimSnapshot(linkedClaim, sourceLines, snapshot)).toBe(
      true,
    );
  });
  it('retira vigencia por cancelación, sustitución o cambio económico', () => {
    expect(
      matchesLinkedClaimSnapshot(linkedClaim, sourceLines, {
        ...snapshot,
        validForSettlement: false,
      }),
    ).toBe(false);
    expect(
      matchesLinkedClaimSnapshot(linkedClaim, sourceLines, {
        ...snapshot,
        lines: [
          { ...sourceLines[0], inventoryReservationLineId: 'replacement' },
        ],
      }),
    ).toBe(false);
    expect(
      matchesLinkedClaimSnapshot(linkedClaim, sourceLines, {
        ...snapshot,
        totalAmount: '121',
      }),
    ).toBe(false);
  });
  it('rechaza otro prestador, moneda o doble origen', () => {
    expect(
      matchesLinkedClaimSnapshot(
        { ...linkedClaim, billingProviderEntityId: 'other' },
        sourceLines,
        snapshot,
      ),
    ).toBe(false);
    expect(
      matchesLinkedClaimSnapshot(
        { ...linkedClaim, currencyConceptId: 'usd' },
        sourceLines,
        snapshot,
      ),
    ).toBe(false);
    expect(
      matchesLinkedClaimSnapshot(
        { ...linkedClaim, serviceRequestId: 'diagnostic' },
        sourceLines,
        snapshot,
      ),
    ).toBe(false);
  });
});
