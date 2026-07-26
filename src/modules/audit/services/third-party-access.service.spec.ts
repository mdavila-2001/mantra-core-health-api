import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ThirdPartyAccessService } from './third-party-access.service';
import { PreconditionFailedException } from '../../../common';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const tpaRepo = {
    recordDelegated: mockFn().mockReturnValue({ id: 'del1' }),
    recordInsurance: mockFn().mockReturnValue({ id: 'ins1' }),
    recordIdentity: mockFn().mockReturnValue({ id: 'idv1' }),
    recordPharmacy: mockFn().mockReturnValue({ id: 'ph1' }),
  };
  const auditLogRepo = { append: mockFn().mockResolvedValue({ id: 'a1' }) };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new ThirdPartyAccessService(
    em as any,
    tpaRepo as any,
    auditLogRepo as any,
    logger as any,
  );
  return { service, tpaRepo, auditLogRepo };
}

describe('ThirdPartyAccessService (UC-10-12)', () => {
  it('canal DELEGATED registra el log delegado + provenance', async () => {
    const d = build();
    const res = await d.service.record(
      { channel: 'DELEGATED', outcome: 'SUCCESS', delegatingPractitionerProfileId: 'pr1' } as any,
      actor,
    );
    expect(res).toMatchObject({ id: 'del1', channel: 'DELEGATED', auditLogId: 'a1' });
    expect(d.tpaRepo.recordDelegated).toHaveBeenCalled();
  });

  it('canal INSURANCE requiere aseguradora y paciente', async () => {
    const d = build();
    await expect(
      d.service.record({ channel: 'INSURANCE', outcome: 'SUCCESS' } as any, actor),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });

  it('canal PHARMACY registra el log de farmacia', async () => {
    const d = build();
    const res = await d.service.record(
      { channel: 'PHARMACY', outcome: 'SUCCESS', pharmacyId: 'ph-x' } as any,
      actor,
    );
    expect(res.id).toBe('ph1');
    expect(d.tpaRepo.recordPharmacy).toHaveBeenCalled();
  });
});
