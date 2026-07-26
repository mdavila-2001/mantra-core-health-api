import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ServiceRequestsService } from './service-requests.service';
import { ResourceNotFoundException } from '../../../common';
import { CLIN } from '../clinical.concepts';

const actor = { id: 'user-1', roles: [] } as any;

function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const serviceRequestsRepo = { findById: mockFn(), create: mockFn() };
  const encountersRepo = { findById: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new ServiceRequestsService(
    em as any,
    serviceRequestsRepo as any,
    encountersRepo as any,
    logger as any,
  );
  return { service, serviceRequestsRepo, encountersRepo };
}

describe('ServiceRequestsService (UC-08-05)', () => {
  it('places a service request with order intent', async () => {
    const d = build();
    d.serviceRequestsRepo.create.mockReturnValue({
      id: 'sr1',
      patientProfileId: 'p1',
      statusConceptId: CLIN.SERVICE_REQUEST_ACTIVE,
      intentConceptId: CLIN.SERVICE_REQUEST_INTENT_ORDER,
      createdAt: new Date(),
    });
    const res = await d.service.create(
      { custodianTenantId: 't1', patientProfileId: 'p1', codeConceptId: 'code1' } as any,
      actor,
    );
    expect(res.status).toBe(CLIN.SERVICE_REQUEST_ACTIVE);
    expect(res.intent).toBe(CLIN.SERVICE_REQUEST_INTENT_ORDER);
  });

  it('rejects when the referenced encounter does not exist', async () => {
    const d = build();
    d.encountersRepo.findById.mockResolvedValue(null);
    await expect(
      d.service.create(
        {
          custodianTenantId: 't1',
          patientProfileId: 'p1',
          codeConceptId: 'code1',
          encounterId: 'missing',
        } as any,
        actor,
      ),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });
});
