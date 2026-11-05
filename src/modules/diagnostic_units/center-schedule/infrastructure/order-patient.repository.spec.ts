import { describe, expect, it, jest } from '@jest/globals';
import { LABP } from '../../../diagnostics/lab-portal.concepts';
import { OrderPatientRepository } from './order-patient.repository';

function run(bookable?: boolean) {
  const execute = (jest.fn as any)().mockResolvedValue([]);
  const repo = new OrderPatientRepository();
  const call =
    bookable === undefined
      ? repo.findDiagnosticOrder({ execute } as never, 'o1', 'p1')
      : repo.findDiagnosticOrder({ execute } as never, 'o1', 'p1', bookable);
  return call.then(() => execute.mock.calls[0] as [string, unknown[]]);
}

describe('OrderPatientRepository.findDiagnosticOrder', () => {
  it('excludes orders the order performer cancelled or rejected', async () => {
    const [sql, params] = await run();
    expect(sql).toContain('diagnostics.service_request_performer_events');
    // Only the events of the order's own performer count, never a stranger's.
    expect(sql).toContain('e.custodian_tenant_id = sr.performer_tenant_id');
    expect(params.slice(-2)).toEqual([
      true,
      `{${LABP.PERFORMER_CANCELLED},${LABP.PERFORMER_REJECTED}}`,
    ]);
  });

  it('skips that check when the caller only cancels an existing appointment', async () => {
    const [, params] = await run(false);
    expect(params.at(-2)).toBe(false);
  });
});
