import { jest } from '@jest/globals';
import { DelegatedAccessErrorReason as Reason } from '../delegated_access.error-reasons';
import { hashPayload } from '../domain';
import { GrantChangeExecutor } from './grant-change.executor';
import { FourEyesExecutors } from './four-eyes.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const payload = {
  op: 'ADD',
  engagementId: 'eng-1',
  assignmentRowVersion: 3,
  grant: { targetKind: 'ALL', actions: ['billing.receipt.void'] },
};
const approver = { id: 'otro-admin', roles: ['SECURITY_ADMIN'] } as any;

describe('GrantChangeExecutor (B-M3)', () => {
  it('se registra como el ejecutor de GRANT_CHANGE', () => {
    const registry = new FourEyesExecutors();
    new GrantChangeExecutor({} as any, registry).onModuleInit();
    expect(registry.get('GRANT_CHANGE')).toBeDefined();
    expect(registry.get('ACTION')).toBeUndefined();
  });

  it('N-1: registra también el detalle que ve quien aprueba, delegado en el servicio de vínculos', async () => {
    const registry = new FourEyesExecutors();
    const describeGrantChanges = mockFn().mockResolvedValue(new Map());
    new GrantChangeExecutor(
      { describeGrantChanges } as any,
      registry,
    ).onModuleInit();
    const rows = [{ id: 'fe-1', payloadJson: payload }] as any[];
    await registry.get('GRANT_CHANGE')!.describe!({} as any, rows);
    expect(describeGrantChanges).toHaveBeenCalledWith(expect.anything(), rows);
  });

  it('ejecuta con el cuerpo firmado, quien pidió y quien aprobó', async () => {
    const engagements = {
      executeApprovedGrantChange: mockFn().mockResolvedValue({
        grantId: 'g-1',
        op: 'ADD',
      }),
    };
    const executor = new GrantChangeExecutor(engagements as any);
    const out = await executor.execute(
      {} as any,
      {
        tenantId: 't-1',
        requesterUserId: 'admin-1',
        payloadJson: payload,
        payloadHash: hashPayload(payload),
      },
      approver,
    );
    expect(out).toEqual({ grantId: 'g-1', op: 'ADD' });
    expect(engagements.executeApprovedGrantChange).toHaveBeenCalledWith(
      expect.anything(),
      't-1',
      payload,
      'admin-1',
      approver,
    );
  });

  it('si el cuerpo ya no coincide con su hash: 409 FOUR_EYES_PAYLOAD_CHANGED y no escribe', async () => {
    const engagements = { executeApprovedGrantChange: mockFn() };
    const executor = new GrantChangeExecutor(engagements as any);
    await expect(
      executor.execute(
        {} as any,
        {
          tenantId: 't-1',
          requesterUserId: 'admin-1',
          payloadJson: { ...payload, op: 'UPDATE' },
          payloadHash: hashPayload(payload),
        },
        approver,
      ),
    ).rejects.toMatchObject({ reason: Reason.FOUR_EYES_PAYLOAD_CHANGED });
    expect(engagements.executeApprovedGrantChange).not.toHaveBeenCalled();
  });
});
