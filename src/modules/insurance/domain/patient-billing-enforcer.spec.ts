import { splitCoveredAmount } from './coverage-split';
import {
  enforcePatientBilling,
  PATIENT_BILLING_REASON,
  type PatientBillingFacts,
} from './patient-billing-enforcer';

/**
 * Lo que se le factura al paciente por un servicio reclamado (carril 16,
 * REQ-16-028, 029, 030 y 033). Regla pura: sin base de datos.
 */

const CLAIM = 'claim-1';
const LINE = 'line-1';

function facts(
  overrides: Partial<PatientBillingFacts> = {},
): PatientBillingFacts {
  return {
    claimId: CLAIM,
    claimReversed: false,
    claimLine: { id: LINE, insuranceClaimId: CLAIM, billedAmount: '500.00' },
    alreadyInvoiced: false,
    serverPatientShare: '140.00',
    ...overrides,
  };
}

const rejected = (decision: ReturnType<typeof enforcePatientBilling>) => {
  if (decision.kind !== 'REJECT') throw new Error('se esperaba un rechazo');
  return decision;
};

const issued = (decision: ReturnType<typeof enforcePatientBilling>) => {
  if (decision.kind !== 'ISSUE') {
    throw new Error(`se esperaba emitir y fue ${decision.reason}`);
  }
  return decision;
};

const validConsent = {
  kind: 'VALID' as const,
  acceptedAt: new Date('2026-10-20T10:00:00Z'),
  acceptedByUserId: 'user-patient',
};

describe('enforcePatientBilling', () => {
  describe('con seguro: exactamente la parte calculada por el servidor', () => {
    it('500 Bs, copago 50, 80 % → factura 140 y la aseguradora 360', () => {
      expect(issued(enforcePatientBilling(facts()))).toEqual({
        kind: 'ISSUE',
        chargeKind: 'INSURED_SHARE',
        amount: '140.00',
        insurerAmount: '360.00',
        billedAmount: '500.00',
        consent: null,
      });
    });

    it('el cliente que confirma el mismo importe, aunque cambie la escala, pasa', () => {
      const decision = issued(
        enforcePatientBilling(facts({ declaredPatientAmount: '140' })),
      );
      expect(decision.amount).toBe('140.00');
    });

    it('escalas de relleno de la base (500.0000 / 140.0000) se normalizan', () => {
      const decision = issued(
        enforcePatientBilling(
          facts({
            serverPatientShare: '140.0000',
            claimLine: {
              id: LINE,
              insuranceClaimId: CLAIM,
              billedAmount: '500.0000',
            },
          }),
        ),
      );
      expect(decision).toMatchObject({
        amount: '140.00',
        insurerAmount: '360.00',
        billedAmount: '500.00',
      });
    });

    it('cobertura 100 % con copago: el paciente paga sólo el copago', () => {
      const split = splitCoveredAmount('500.00', {
        coveragePercent: '100',
        copayAmount: '30.00',
      });
      const decision = issued(
        enforcePatientBilling(
          facts({ serverPatientShare: split.patientAmount }),
        ),
      );
      expect(decision).toMatchObject({
        amount: '30.00',
        insurerAmount: '470.00',
      });
    });

    it('copago mayor que el monto: el paciente paga el monto y la aseguradora nada', () => {
      const split = splitCoveredAmount('40.00', {
        coveragePercent: '80',
        copayAmount: '50.00',
      });
      const decision = issued(
        enforcePatientBilling(
          facts({
            serverPatientShare: split.patientAmount,
            claimLine: {
              id: LINE,
              insuranceClaimId: CLAIM,
              billedAmount: '40.00',
            },
          }),
        ),
      );
      expect(decision).toMatchObject({
        amount: '40.00',
        insurerAmount: '0.00',
      });
    });

    it('centavos que obligan a redondear: el centavo sobrante queda con la aseguradora', () => {
      const split = splitCoveredAmount('33.33', {
        coveragePercent: '85',
        copayAmount: null,
      });
      const decision = issued(
        enforcePatientBilling(
          facts({
            serverPatientShare: split.patientAmount,
            claimLine: {
              id: LINE,
              insuranceClaimId: CLAIM,
              billedAmount: '33.33',
            },
          }),
        ),
      );
      expect(decision).toMatchObject({
        amount: '4.99',
        insurerAmount: '28.34',
      });
    });
  });

  describe('rechazos tipificados', () => {
    it('el cliente declara el monto completo de un servicio reclamado', () => {
      const decision = rejected(
        enforcePatientBilling(facts({ declaredPatientAmount: '500.00' })),
      );
      expect(decision).toMatchObject({
        reason: PATIENT_BILLING_REASON.PATIENT_INVOICE_AMOUNT_MISMATCH,
        details: {
          declaredPatientAmount: '500.00',
          expectedPatientAmount: '140.00',
        },
      });
    });

    it('un importe declarado que ni es dinero también es discrepancia', () => {
      const decision = rejected(
        enforcePatientBilling(facts({ declaredPatientAmount: 'abc' })),
      );
      expect(decision.reason).toBe(
        PATIENT_BILLING_REASON.PATIENT_INVOICE_AMOUNT_MISMATCH,
      );
    });

    it('un centavo de diferencia ya es discrepancia', () => {
      const decision = rejected(
        enforcePatientBilling(facts({ declaredPatientAmount: '140.01' })),
      );
      expect(decision.reason).toBe(
        PATIENT_BILLING_REASON.PATIENT_INVOICE_AMOUNT_MISMATCH,
      );
    });

    it('línea inexistente o de otro reclamo', () => {
      expect(
        rejected(enforcePatientBilling(facts({ claimLine: null }))).reason,
      ).toBe(PATIENT_BILLING_REASON.CLAIM_LINE_NOT_IN_CLAIM);
      expect(
        rejected(
          enforcePatientBilling(
            facts({
              claimLine: {
                id: LINE,
                insuranceClaimId: 'otro-reclamo',
                billedAmount: '500.00',
              },
            }),
          ),
        ).reason,
      ).toBe(PATIENT_BILLING_REASON.CLAIM_LINE_NOT_IN_CLAIM);
    });

    it('reclamo revertido', () => {
      expect(
        rejected(enforcePatientBilling(facts({ claimReversed: true }))).reason,
      ).toBe(PATIENT_BILLING_REASON.CLAIM_REVERSED_NO_PATIENT_CHARGE);
    });

    it('doble factura de la misma línea', () => {
      expect(
        rejected(enforcePatientBilling(facts({ alreadyInvoiced: true })))
          .reason,
      ).toBe(PATIENT_BILLING_REASON.PATIENT_INVOICE_ALREADY_ISSUED);
    });

    it('línea sin monto o con monto inválido', () => {
      for (const billedAmount of [null, 'abc', '1.234', '-5']) {
        const decision = rejected(
          enforcePatientBilling(
            facts({
              claimLine: { id: LINE, insuranceClaimId: CLAIM, billedAmount },
            }),
          ),
        );
        expect(decision.reason).toBe(
          PATIENT_BILLING_REASON.CLAIM_LINE_WITHOUT_AMOUNT,
        );
      }
    });

    it('una parte del paciente mayor que el monto no se factura', () => {
      const decision = rejected(
        enforcePatientBilling(facts({ serverPatientShare: '500.01' })),
      );
      expect(decision.reason).toBe(
        PATIENT_BILLING_REASON.PATIENT_SHARE_INVALID,
      );
    });

    it('una parte del paciente que no es dinero no se factura', () => {
      const decision = rejected(
        enforcePatientBilling(facts({ serverPatientShare: 'NaN' })),
      );
      expect(decision.reason).toBe(
        PATIENT_BILLING_REASON.PATIENT_SHARE_INVALID,
      );
    });

    it('cobertura total sin copago: no hay nada que cobrarle al paciente', () => {
      const decision = rejected(
        enforcePatientBilling(facts({ serverPatientShare: '0.00' })),
      );
      expect(decision.reason).toBe(
        PATIENT_BILLING_REASON.NOTHING_TO_CHARGE_PATIENT,
      );
    });
  });

  describe('orden de las comprobaciones', () => {
    it('una línea ajena se rechaza antes que cualquier otro motivo', () => {
      const decision = rejected(
        enforcePatientBilling(
          facts({
            claimLine: null,
            claimReversed: true,
            alreadyInvoiced: true,
            declaredPatientAmount: '1.00',
          }),
        ),
      );
      expect(decision.reason).toBe(
        PATIENT_BILLING_REASON.CLAIM_LINE_NOT_IN_CLAIM,
      );
    });

    it('la unicidad se mira antes que los importes', () => {
      const decision = rejected(
        enforcePatientBilling(
          facts({ alreadyInvoiced: true, declaredPatientAmount: '999.00' }),
        ),
      );
      expect(decision.reason).toBe(
        PATIENT_BILLING_REASON.PATIENT_INVOICE_ALREADY_ISSUED,
      );
    });

    it('el reclamo revertido gana a la doble factura', () => {
      const decision = rejected(
        enforcePatientBilling(
          facts({ claimReversed: true, alreadyInvoiced: true }),
        ),
      );
      expect(decision.reason).toBe(
        PATIENT_BILLING_REASON.CLAIM_REVERSED_NO_PATIENT_CHARGE,
      );
    });
  });

  describe('cobro particular (sin parte calculada) y consentimiento', () => {
    const privateFacts = (overrides: Partial<PatientBillingFacts> = {}) =>
      facts({ serverPatientShare: null, ...overrides });

    it('con aceptación válida: factura el monto completo y la aseguradora nada', () => {
      const decision = issued(
        enforcePatientBilling(privateFacts({ consent: validConsent })),
      );
      expect(decision).toEqual({
        kind: 'ISSUE',
        chargeKind: 'PRIVATE_FULL',
        amount: '500.00',
        insurerAmount: '0.00',
        billedAmount: '500.00',
        consent: validConsent,
      });
    });

    it('sin evaluar el consentimiento se trata como ausente', () => {
      const decision = rejected(enforcePatientBilling(privateFacts()));
      expect(decision).toMatchObject({
        reason: PATIENT_BILLING_REASON.PATIENT_CONSENT_REQUIRED,
        details: { consent: 'MISSING', expectedPatientAmount: '500.00' },
      });
    });

    it.each([
      [{ kind: 'MISSING' as const }, 'MISSING'],
      [
        { kind: 'AMOUNT_DIFFERS' as const, acceptedAmount: '499.99' },
        'AMOUNT_DIFFERS',
      ],
      [{ kind: 'NOT_BEFORE_CHARGE' as const }, 'NOT_BEFORE_CHARGE'],
    ])('aceptación %j → 422 por consentimiento', (consent, kind) => {
      const decision = rejected(
        enforcePatientBilling(privateFacts({ consent })),
      );
      expect(decision.reason).toBe(
        PATIENT_BILLING_REASON.PATIENT_CONSENT_REQUIRED,
      );
      expect(decision.details.consent).toBe(kind);
    });

    it('informa el importe aceptado cuando difiere del cobro', () => {
      const decision = rejected(
        enforcePatientBilling(
          privateFacts({
            consent: { kind: 'AMOUNT_DIFFERS', acceptedAmount: '499.99' },
          }),
        ),
      );
      expect(decision.details).toMatchObject({ acceptedAmount: '499.99' });
    });

    it('el cliente no puede declarar otro importe particular', () => {
      const decision = rejected(
        enforcePatientBilling(
          privateFacts({ consent: validConsent, declaredPatientAmount: '300' }),
        ),
      );
      expect(decision.reason).toBe(
        PATIENT_BILLING_REASON.PATIENT_INVOICE_AMOUNT_MISMATCH,
      );
    });

    it('con seguro no hace falta consentimiento', () => {
      const decision = issued(
        enforcePatientBilling(facts({ consent: { kind: 'MISSING' } })),
      );
      expect(decision.chargeKind).toBe('INSURED_SHARE');
    });
  });

  describe('propiedad: paciente + aseguradora = monto', () => {
    /** Generador congruencial lineal con semilla fija: reproducible. */
    function lcg(seed: number) {
      let state = seed >>> 0;
      return (max: number) => {
        state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
        // Bits altos: los bajos de un LCG alternan y no sirven para `next(2)`.
        return Math.floor((state / 2 ** 32) * max);
      };
    }
    const cents = (value: number) =>
      `${Math.floor(value / 100)}.${String(value % 100).padStart(2, '0')}`;

    it('20 000 casos: la factura y la aseguradora suman el monto exacto', () => {
      const next = lcg(20261024);
      let issuedCount = 0;
      for (let i = 0; i < 20_000; i += 1) {
        const billedCents = next(10_000_000);
        const billed = cents(billedCents);
        // 0–99.9999 %: el 100 exacto lo cubren los casos tabulares.
        const percent = `${next(100)}${next(2) ? `.${next(10_000)}` : ''}`;
        const usePercent = next(5) !== 0;
        let copay = next(3) === 0 ? null : cents(next(billedCents + 5_000));
        // Un beneficio sin porcentaje ni copago no se puede repartir.
        if (!usePercent && copay === null) copay = '0.00';
        const split = splitCoveredAmount(billed, {
          coveragePercent: usePercent ? percent : null,
          copayAmount: copay,
        });
        const decision = enforcePatientBilling(
          facts({
            serverPatientShare: split.patientAmount,
            claimLine: {
              id: LINE,
              insuranceClaimId: CLAIM,
              billedAmount: billed,
            },
          }),
        );
        if (decision.kind === 'REJECT') {
          expect(decision.reason).toBe(
            PATIENT_BILLING_REASON.NOTHING_TO_CHARGE_PATIENT,
          );
          expect(split.patientAmount).toBe('0.00');
          continue;
        }
        issuedCount += 1;
        const total = BigInt(decision.billedAmount.replace('.', ''));
        const patient = BigInt(decision.amount.replace('.', ''));
        const insurer = BigInt(decision.insurerAmount.replace('.', ''));
        expect(decision.amount).toBe(split.patientAmount);
        expect(decision.amount).toMatch(/^\d+\.\d{2}$/);
        expect(decision.insurerAmount).toMatch(/^\d+\.\d{2}$/);
        expect(patient + insurer).toBe(total);
        expect(patient >= 0n && patient <= total).toBe(true);
        expect(insurer >= 0n).toBe(true);
      }
      expect(issuedCount).toBeGreaterThan(10_000);
    });
  });
});
