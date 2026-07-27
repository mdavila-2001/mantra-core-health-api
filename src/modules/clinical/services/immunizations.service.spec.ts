import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ImmunizationsService } from './immunizations.service';
import { ConflictException } from '../../../common';
import { CLIN } from '../clinical.concepts';

const actor = { id: 'user-1', roles: [] } as any;

function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const immunizationsRepo = {
    findByPatientVaccineDose: mockFn(),
    create: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new ImmunizationsService(
    em as any,
    immunizationsRepo as any,
    logger as any,
  );
  return { service, immunizationsRepo };
}

describe('ImmunizationsService (UC-08-13)', () => {
  it('records a completed immunization', async () => {
    const d = build();
    d.immunizationsRepo.findByPatientVaccineDose.mockResolvedValue(null);
    d.immunizationsRepo.create.mockReturnValue({
      id: 'imm1',
      patientProfileId: 'p1',
      statusConceptId: CLIN.IMMUNIZATION_COMPLETED,
      doseNumber: 1,
      createdAt: new Date(),
    });
    const res = await d.service.create(
      {
        custodianTenantId: 't1',
        patientProfileId: 'p1',
        vaccineConceptId: 'v1',
        doseNumber: 1,
      },
      actor,
    );
    expect(res.status).toBe(CLIN.IMMUNIZATION_COMPLETED);
    expect(res.doseNumber).toBe(1);
  });

  it('rejects a duplicate dose', async () => {
    const d = build();
    d.immunizationsRepo.findByPatientVaccineDose.mockResolvedValue({
      id: 'existing',
    });
    await expect(
      d.service.create(
        {
          custodianTenantId: 't1',
          patientProfileId: 'p1',
          vaccineConceptId: 'v1',
          doseNumber: 1,
        } as any,
        actor,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
