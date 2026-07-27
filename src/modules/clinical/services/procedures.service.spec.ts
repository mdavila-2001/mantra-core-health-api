import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ProceduresService } from './procedures.service';
import { ResourceNotFoundException } from '../../../common';
import { CLIN } from '../clinical.concepts';

const actor = { id: 'user-1', roles: [] } as any;

function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const proceduresRepo = { findById: mockFn(), create: mockFn() };
  const serviceRequestsRepo = { findById: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new ProceduresService(
    em as any,
    proceduresRepo,
    serviceRequestsRepo as any,
    logger as any,
  );
  return { service, proceduresRepo, serviceRequestsRepo };
}

describe('ProceduresService (UC-08-12)', () => {
  it('records a completed procedure and closes the source order', async () => {
    const d = build();
    const sr = {
      id: 'sr1',
      statusConceptId: CLIN.SERVICE_REQUEST_ACTIVE,
      updatedAt: new Date(),
    };
    d.serviceRequestsRepo.findById.mockResolvedValue(sr);
    d.proceduresRepo.create.mockReturnValue({
      id: 'proc1',
      patientProfileId: 'p1',
      statusConceptId: CLIN.PROCEDURE_COMPLETED,
      serviceRequestId: 'sr1',
      createdAt: new Date(),
    });
    const res = await d.service.create(
      {
        custodianTenantId: 't1',
        patientProfileId: 'p1',
        codeConceptId: 'code1',
        serviceRequestId: 'sr1',
      },
      actor,
    );
    expect(sr.statusConceptId).toBe(CLIN.SERVICE_REQUEST_COMPLETED);
    expect(res.status).toBe(CLIN.PROCEDURE_COMPLETED);
  });

  it('rejects when the source service request is missing', async () => {
    const d = build();
    d.serviceRequestsRepo.findById.mockResolvedValue(null);
    await expect(
      d.service.create(
        {
          custodianTenantId: 't1',
          patientProfileId: 'p1',
          codeConceptId: 'code1',
          serviceRequestId: 'missing',
        } as any,
        actor,
      ),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('rejects when the parent procedure does not exist', async () => {
    const d = build();
    d.proceduresRepo.findById.mockResolvedValue(null);
    await expect(
      d.service.create(
        {
          custodianTenantId: 't1',
          patientProfileId: 'p1',
          codeConceptId: 'code1',
          parentProcedureId: 'missing',
        } as any,
        actor,
      ),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });
});
