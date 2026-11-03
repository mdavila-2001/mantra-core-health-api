import { jest } from '@jest/globals';
import { AUD } from '../../../audit/audit.concepts';
import { AuditPrescriptionShareAccessLogAdapter } from './audit-prescription-share-access-log.adapter';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

describe('AuditPrescriptionShareAccessLogAdapter', () => {
  it('writes the read with the patient and the share id, and flushes it before returning', async () => {
    const fork = { flush: mockFn(async () => undefined) };
    const uow = { fork: mockFn(() => fork) };
    const dataAccess = { record: mockFn() };
    const adapter = new AuditPrescriptionShareAccessLogAdapter(
      dataAccess as any,
    );

    await adapter.recordPharmacyRead(uow as any, {
      userId: 'user-ph',
      tenantId: 'tenant-ph',
      patientProfileId: 'patient-1',
      shareId: 'share-1',
    });

    expect(dataAccess.record).toHaveBeenCalledWith(fork, {
      userId: 'user-ph',
      actionConceptId: AUD.ACTION_READ,
      patientProfileId: 'patient-1',
      tenantId: 'tenant-ph',
      purpose: 'TREATMENT',
      resourceType: 'PRESCRIPTION_SHARE',
      resourceId: 'share-1',
      recordedByUserId: 'user-ph',
    });
    expect(fork.flush).toHaveBeenCalledTimes(1);
  });

  it('a failed write propagates: without the access row there is no read', async () => {
    const fork = { flush: mockFn(async () => Promise.reject(new Error('x'))) };
    const adapter = new AuditPrescriptionShareAccessLogAdapter({
      record: mockFn(),
    } as any);
    await expect(
      adapter.recordPharmacyRead({ fork: () => fork } as any, {
        userId: 'u',
        tenantId: 't',
        patientProfileId: 'p',
        shareId: 's',
      }),
    ).rejects.toThrow('x');
  });
});
