import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { MedicationsService } from './medications.service';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { CLIN } from '../clinical.concepts';

const actor = { id: 'user-1', roles: [] } as any;

function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const requestsRepo = { findById: mockFn(), create: mockFn() };
  const recordsRepo = { create: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new MedicationsService(
    em as any,
    requestsRepo,
    recordsRepo as any,
    logger as any,
  );
  return { service, requestsRepo, recordsRepo };
}

describe('MedicationsService', () => {
  describe('prescribe (UC-08-10)', () => {
    it('prescribes an active medication order', async () => {
      const d = build();
      d.requestsRepo.create.mockReturnValue({
        id: 'mr1',
        patientProfileId: 'p1',
        statusConceptId: CLIN.MEDICATION_REQUEST_ACTIVE,
        createdAt: new Date(),
      });
      const res = await d.service.prescribe(
        {
          custodianTenantId: 't1',
          patientProfileId: 'p1',
          medicationConceptId: 'm1',
        },
        actor,
      );
      expect(res.status).toBe(CLIN.MEDICATION_REQUEST_ACTIVE);
    });
  });

  describe('administer (UC-08-11)', () => {
    it('records an administration and completes the request on the final dose', async () => {
      const d = build();
      const request = {
        id: 'mr1',
        statusConceptId: CLIN.MEDICATION_REQUEST_ACTIVE,
        updatedAt: new Date(),
      };
      d.requestsRepo.findById.mockResolvedValue(request);
      d.recordsRepo.create.mockReturnValue({
        id: 'rec1',
        patientProfileId: 'p1',
        statusConceptId: CLIN.MEDICATION_RECORD_COMPLETED,
        requestId: 'mr1',
        createdAt: new Date(),
      });

      const res = await d.service.administer(
        {
          custodianTenantId: 't1',
          patientProfileId: 'p1',
          medicationConceptId: 'm1',
          requestId: 'mr1',
          isFinalDose: true,
        },
        actor,
      );

      expect(request.statusConceptId).toBe(CLIN.MEDICATION_REQUEST_COMPLETED);
      expect(res.status).toBe(CLIN.MEDICATION_RECORD_COMPLETED);
    });

    it('throws when the referenced request is missing', async () => {
      const d = build();
      d.requestsRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.administer(
          {
            custodianTenantId: 't1',
            patientProfileId: 'p1',
            medicationConceptId: 'm1',
            requestId: 'missing',
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rejects administering against a non-active request', async () => {
      const d = build();
      d.requestsRepo.findById.mockResolvedValue({
        id: 'mr1',
        statusConceptId: CLIN.MEDICATION_REQUEST_COMPLETED,
      });
      await expect(
        d.service.administer(
          {
            custodianTenantId: 't1',
            patientProfileId: 'p1',
            medicationConceptId: 'm1',
            requestId: 'mr1',
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });
});
