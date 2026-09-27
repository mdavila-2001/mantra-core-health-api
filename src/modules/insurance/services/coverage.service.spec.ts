import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { CoverageService } from './coverage.service';

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
  const repo = { findByPatient: mockFn(() => Promise.resolve([])) };
  const catalog = {};
  const accountLinksRepo = {
    findActiveByUser: mockFn(() => Promise.resolve(null)),
  };
  const patientProfilesRepo = { findById: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn() };
  const service = new CoverageService(
    em as any,
    repo as any,
    catalog as any,
    accountLinksRepo as any,
    patientProfilesRepo as any,
    logger as any,
  );
  return { service, repo, accountLinksRepo, patientProfilesRepo };
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
