import { NoPatientChargeAcceptanceAdapter } from '../../infrastructure/adapters/no-patient-charge-acceptance.adapter';
import type {
  PatientChargeAcceptance,
  PatientChargeAcceptancePort,
} from '../ports/patient-charge-acceptance.port';
import { PatientConsentValidator } from './patient-consent-validator';

/**
 * Aceptación previa del paciente para un cobro particular (carril 16,
 * REQ-16-030). La persistencia real está bloqueada hasta el cambio de modelo,
 * así que la regla se prueba contra un doble en memoria del puerto, declarado
 * como tal, en los tres niveles del contrato: correcto, límite e inválido.
 */

const PATIENT = 'patient-1';
const LINE = 'line-1';
const AT = new Date('2026-10-24T12:00:00Z');
const em = {} as never;

/** Doble en memoria del puerto: la aceptación más reciente por (paciente, línea). */
class InMemoryAcceptances implements PatientChargeAcceptancePort {
  private readonly rows = new Map<string, PatientChargeAcceptance>();
  readonly queries: Array<{ patientProfileId: string; claimLineId: string }> =
    [];

  accept(
    patientProfileId: string,
    claimLineId: string,
    row: PatientChargeAcceptance,
  ) {
    this.rows.set(`${patientProfileId}:${claimLineId}`, row);
  }

  async findLatestAcceptance(
    _em: unknown,
    query: { patientProfileId: string; claimLineId: string },
  ): Promise<PatientChargeAcceptance | null> {
    this.queries.push(query);
    return (
      this.rows.get(`${query.patientProfileId}:${query.claimLineId}`) ?? null
    );
  }
}

const acceptance = (
  overrides: Partial<PatientChargeAcceptance> = {},
): PatientChargeAcceptance => ({
  acceptedAmount: '500.00',
  acceptedAt: new Date('2026-10-24T10:00:00Z'),
  acceptedByUserId: 'user-patient',
  ...overrides,
});

const check = (
  validator: PatientConsentValidator,
  overrides: Partial<{ amount: string; at: Date; claimLineId: string }> = {},
) =>
  validator.check(em, {
    patientProfileId: PATIENT,
    claimLineId: LINE,
    amount: '500.00',
    at: AT,
    ...overrides,
  });

describe('PatientConsentValidator', () => {
  describe('nivel correcto', () => {
    it('aceptación previa por el mismo importe → válida, con fecha y usuario', async () => {
      const acceptances = new InMemoryAcceptances();
      acceptances.accept(PATIENT, LINE, acceptance());
      const outcome = await check(new PatientConsentValidator(acceptances));
      expect(outcome).toEqual({
        kind: 'VALID',
        acceptedAt: new Date('2026-10-24T10:00:00Z'),
        acceptedByUserId: 'user-patient',
      });
    });

    it('consulta por el paciente y la línea exactos', async () => {
      const acceptances = new InMemoryAcceptances();
      await check(new PatientConsentValidator(acceptances));
      expect(acceptances.queries).toEqual([
        { patientProfileId: PATIENT, claimLineId: LINE },
      ]);
    });
  });

  describe('nivel límite', () => {
    it('misma cantidad con otra escala (500 vs 500.0000) sigue siendo válida', async () => {
      const acceptances = new InMemoryAcceptances();
      acceptances.accept(PATIENT, LINE, acceptance({ acceptedAmount: '500' }));
      const outcome = await check(new PatientConsentValidator(acceptances), {
        amount: '500.0000',
      });
      expect(outcome.kind).toBe('VALID');
    });

    it('aceptar exactamente en el instante del cobro cuenta como previo', async () => {
      const acceptances = new InMemoryAcceptances();
      acceptances.accept(PATIENT, LINE, acceptance({ acceptedAt: AT }));
      expect((await check(new PatientConsentValidator(acceptances))).kind).toBe(
        'VALID',
      );
    });

    it('un milisegundo después del cobro ya no es previo', async () => {
      const acceptances = new InMemoryAcceptances();
      acceptances.accept(
        PATIENT,
        LINE,
        acceptance({ acceptedAt: new Date(AT.getTime() + 1) }),
      );
      expect((await check(new PatientConsentValidator(acceptances))).kind).toBe(
        'NOT_BEFORE_CHARGE',
      );
    });

    it('un centavo menos de lo cobrado no alcanza', async () => {
      const acceptances = new InMemoryAcceptances();
      acceptances.accept(
        PATIENT,
        LINE,
        acceptance({ acceptedAmount: '499.99' }),
      );
      expect(await check(new PatientConsentValidator(acceptances))).toEqual({
        kind: 'AMOUNT_DIFFERS',
        acceptedAmount: '499.99',
      });
    });
  });

  describe('nivel inválido', () => {
    it('sin aceptación → MISSING', async () => {
      const outcome = await check(
        new PatientConsentValidator(new InMemoryAcceptances()),
      );
      expect(outcome).toEqual({ kind: 'MISSING' });
    });

    it('la aceptación de otra línea no sirve', async () => {
      const acceptances = new InMemoryAcceptances();
      acceptances.accept(PATIENT, 'otra-linea', acceptance());
      expect((await check(new PatientConsentValidator(acceptances))).kind).toBe(
        'MISSING',
      );
    });

    it('la aceptación de otro paciente no sirve', async () => {
      const acceptances = new InMemoryAcceptances();
      acceptances.accept('otro-paciente', LINE, acceptance());
      expect((await check(new PatientConsentValidator(acceptances))).kind).toBe(
        'MISSING',
      );
    });

    it('un importe guardado que no es decimal no coincide, no rompe', async () => {
      const acceptances = new InMemoryAcceptances();
      acceptances.accept(PATIENT, LINE, acceptance({ acceptedAmount: 'abc' }));
      expect(await check(new PatientConsentValidator(acceptances))).toEqual({
        kind: 'AMOUNT_DIFFERS',
        acceptedAmount: 'abc',
      });
    });

    it('un fallo del puerto se propaga: no se asume que aceptó', async () => {
      const broken: PatientChargeAcceptancePort = {
        findLatestAcceptance: async () => {
          throw new Error('db down');
        },
      };
      await expect(check(new PatientConsentValidator(broken))).rejects.toThrow(
        'db down',
      );
    });
  });

  describe('adaptador provisional (persistencia BLOQUEADA)', () => {
    it('no encuentra nunca una aceptación: el cobro particular falla cerrado', async () => {
      const stub = new NoPatientChargeAcceptanceAdapter();
      await expect(stub.findLatestAcceptance()).resolves.toBeNull();
      const outcome = await check(new PatientConsentValidator(stub));
      expect(outcome).toEqual({ kind: 'MISSING' });
    });
  });
});
