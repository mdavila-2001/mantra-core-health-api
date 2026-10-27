import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { CoverageService } from './coverage.service';
import { INS } from '../../domain/insurance.concepts';

const actor = { id: 'patient-user-1', roles: ['PATIENT'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 *
 * Sólo cubre {@link CoverageService.listMine} (CV-11): es la única capacidad
 * que agrega este cambio; el resto del servicio (alta de cobertura,
 * elegibilidad, COB) no se toca y no tiene spec dedicado en este diff.
 */
function build() {
  const em: any = { transactional: mockFn() };
  em.fork = mockFn(() => em);
  const repo = {
    findByPatient: mockFn(() => Promise.resolve([])),
    findOptionsByPatient: mockFn(() => Promise.resolve([])),
  };
  const catalog = {};
  const accountLinksRepo = {
    findActiveByUser: mockFn(() => Promise.resolve(null)),
  };
  const patientProfilesRepo = { findById: mockFn() };
  const patientAccounts = {
    findActiveAccountLink: accountLinksRepo.findActiveByUser,
    findPatientProfile: patientProfilesRepo.findById,
  };
  const logger = { setContext: mockFn(), info: mockFn() };
  const service = new CoverageService(
    em as any,
    repo as any,
    catalog as any,
    patientAccounts as any,
    logger as any,
  );
  return { service, repo, accountLinksRepo, patientProfilesRepo, logger };
}

describe('CoverageService.listMine (CV-11)', () => {
  it('returns an empty list when the account has no linked person', async () => {
    const d = build();
    const res = await d.service.listMine(actor);
    expect(res).toEqual([]);
    expect(d.repo.findByPatient).not.toHaveBeenCalled();
  });

  it('returns an empty list when the person has no patient profile', async () => {
    const d = build();
    d.accountLinksRepo.findActiveByUser.mockResolvedValue({
      personId: 'person-1',
    });
    d.patientProfilesRepo.findById.mockResolvedValue(null);
    const res = await d.service.listMine(actor);
    expect(res).toEqual([]);
  });

  it('resolves the patient from the account and maps the coverage fields', async () => {
    const d = build();
    d.accountLinksRepo.findActiveByUser.mockResolvedValue({
      personId: 'person-1',
    });
    d.patientProfilesRepo.findById.mockResolvedValue({ profileId: 'pp-own' });
    d.repo.findByPatient.mockResolvedValue([
      {
        id: 'cov-1',
        insurancePlanId: 'plan-1',
        memberIdentifier: 'M-1',
        coverageOrder: 1,
        verificationStatusConceptId: 'verify-pending',
        statusConceptId: 'coverage-active',
        createdAt: new Date('2026-01-01'),
      },
    ]);

    const res = await d.service.listMine(actor);

    expect(d.repo.findByPatient).toHaveBeenCalledWith(
      expect.anything(),
      'pp-own',
    );
    expect(res).toEqual([
      expect.objectContaining({
        id: 'cov-1',
        insurancePlanId: 'plan-1',
        memberIdentifier: 'M-1',
        status: 'coverage-active',
      }),
    ]);
  });
});

describe('CoverageService.listForPatient (carril 16, REQ-16-026)', () => {
  const PATIENT = '11111111-1111-4111-8111-111111111111';
  const billing = { id: 'billing-user-1', roles: ['BILLING'] } as any;

  /** Una cobertura vigente de la persona, con las columnas que lee el repositorio. */
  function row(overrides: Record<string, unknown> = {}) {
    return {
      coverage_id: 'coverage-1',
      carrier_id: 'carrier-1',
      carrier_name: 'Seguros Andina',
      plan_name: 'Plan Integral',
      status_concept_id: INS.COVERAGE_ACTIVE,
      plan_status_concept_id: INS.PLAN_ACTIVE,
      effective_from: '2020-01-01',
      effective_to: null,
      plan_effective_from: '2020-01-01',
      plan_effective_to: null,
      currency_code: null,
      currency_concept_id: null,
      ...overrides,
    };
  }

  it.each([['PATIENT'], ['PRACTITIONER'], ['SECURITY_ADMIN']])(
    'rechaza con 403 al rol %s y no lee nada',
    async (role) => {
      const d = build();
      await expect(
        d.service.listForPatient(PATIENT, { id: 'u', roles: [role] } as any),
      ).rejects.toThrow('Rol insuficiente');
      expect(d.repo.findOptionsByPatient).not.toHaveBeenCalled();
    },
  );

  it.each([['BILLING'], ['FINANCE'], ['SUPERADMIN']])(
    'deja leer al rol %s',
    async (role) => {
      const d = build();
      const res = await d.service.listForPatient(PATIENT, {
        id: 'u',
        roles: [role],
      } as any);
      expect(res).toEqual({ items: [] });
      expect(d.repo.findOptionsByPatient).toHaveBeenCalledWith(
        expect.anything(),
        PATIENT,
      );
    },
  );

  it('devuelve solo lo que la cotización usa: sin póliza ni afiliado', async () => {
    const d = build();
    d.repo.findOptionsByPatient.mockResolvedValueOnce([
      row({ policy_identifier: 'POL-1', member_identifier: 'AF-1' }),
    ] as never);
    const res = await d.service.listForPatient(PATIENT, billing);
    expect(res.items).toHaveLength(1);
    expect(Object.keys(res.items[0]!).sort()).toEqual([
      'carrierName',
      'currencyCode',
      'id',
      'insuranceCarrierId',
      'planName',
      'validityStatus',
    ]);
    expect(res.items[0]).toMatchObject({
      id: 'coverage-1',
      insuranceCarrierId: 'carrier-1',
      carrierName: 'Seguros Andina',
      planName: 'Plan Integral',
      validityStatus: 'CURRENT',
    });
  });

  it('marca la vigencia: vencida, por vencer e inactiva', async () => {
    const d = build();
    d.repo.findOptionsByPatient.mockResolvedValueOnce([
      row({ coverage_id: 'vencida', effective_to: '2020-12-31' }),
      row({ coverage_id: 'futura', effective_from: '2999-01-01' }),
      row({ coverage_id: 'inactiva', status_concept_id: 'otro-estado' }),
    ] as never);
    const res = await d.service.listForPatient(PATIENT, billing);
    expect(res.items.map((i) => [i.id, i.validityStatus])).toEqual([
      ['vencida', 'EXPIRED'],
      ['futura', 'UPCOMING'],
      ['inactiva', 'INACTIVE'],
    ]);
  });

  it('no registra en el log el número de póliza ni el de afiliado', async () => {
    const d = build();
    d.repo.findOptionsByPatient.mockResolvedValueOnce([
      row({ policy_identifier: 'POL-1', member_identifier: 'AF-1' }),
    ] as never);
    await d.service.listForPatient(PATIENT, billing);
    const logged = JSON.stringify(d.logger.info.mock.calls);
    expect(logged).not.toContain('POL-1');
    expect(logged).not.toContain('AF-1');
  });
});
