import { jest } from '@jest/globals';
import { InvitationsRepository } from './invitations.repository';
import { TargetsRepository } from './targets.repository';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

/**
 * `em` double: queries must go through `em.execute` (the transaction the
 * request carries) and never through the raw pool connection, which would reach
 * RLS tables without the tenant.
 */
function build(rows: unknown[] = []) {
  const execute = mockFn().mockResolvedValue(rows);
  const em = {
    execute,
    getConnection: () => {
      throw new Error('SQL fuera de la transacción de la petición');
    },
  } as any;
  return { em, execute };
}

describe('SQL crudo de surveys · contexto de la petición (RLS)', () => {
  it('InvitationsRepository.listCardContext consulta por el em recibido', async () => {
    const b = build([]);

    const res = await new InvitationsRepository().listCardContext(b.em, [
      'inv-1',
    ]);

    expect(res.size).toBe(0);
    expect(b.execute).toHaveBeenCalledTimes(1);
  });

  it('TargetsRepository.listCompletedBookingsWithoutInvitation consulta por el em recibido', async () => {
    const b = build([{ id: 'bkg-1' }]);

    const ids =
      await new TargetsRepository().listCompletedBookingsWithoutInvitation(
        b.em,
        'ten-1',
        'completed',
        10,
      );

    expect(ids).toEqual(['bkg-1']);
    expect(b.execute).toHaveBeenCalledWith(expect.any(String), [
      'ten-1',
      'completed',
      10,
    ]);
  });
});
