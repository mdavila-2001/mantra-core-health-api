import { jest } from '@jest/globals';
import { DELEG } from '../delegated_access.concepts';
import { SharedAccessLinksRepository } from './shared-access-links.repository';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const LINK_A = '77777777-7777-4777-8777-777777777771';
const LINK_B = '77777777-7777-4777-8777-777777777772';
const LINK_C = '77777777-7777-4777-8777-777777777773';

/** Un `EntityManager` que solo responde la consulta cruda de conteo. */
function emReturning(rows: unknown[]) {
  const execute = mockFn().mockResolvedValue(rows);
  const transaction = { id: 'tx' };
  const em = {
    getConnection: mockFn(() => ({ execute })),
    getTransactionContext: mockFn(() => transaction),
    find: mockFn(),
  };
  return { em, execute, transaction };
}

/**
 * `uses` del listado sale de un `COUNT` agrupado en la base: el registro de
 * usos es append-only y no se carga en memoria.
 */
describe('SharedAccessLinksRepository.countOpenedByLinkIds', () => {
  const repo = new SharedAccessLinksRepository();

  it('cuenta con una sola consulta agrupada, filtrando OPEN/OPENED, sin cargar filas', async () => {
    const { em, execute, transaction } = emReturning([
      { shared_access_link_id: LINK_A, count: 3 },
      { shared_access_link_id: LINK_B, count: 1 },
    ]);

    const counts = await repo.countOpenedByLinkIds(em as never, [
      LINK_A,
      LINK_B,
      LINK_C,
    ]);

    expect(execute).toHaveBeenCalledTimes(1);
    const [sql, params, method, context] = execute.mock.calls[0] as [
      string,
      unknown[],
      string,
      unknown,
    ];
    const normalized = sql.replace(/\s+/g, ' ').toLowerCase();
    expect(normalized).toContain('count(*)');
    expect(normalized).toContain(
      'from delegated_access.shared_access_link_uses',
    );
    expect(normalized).toContain('group by shared_access_link_id');
    expect(normalized).toContain('shared_access_link_id in (?, ?, ?)');
    expect(params).toEqual([
      DELEG.SHARE_ACTION_OPEN,
      DELEG.SHARE_OUTCOME_OPENED,
      LINK_A,
      LINK_B,
      LINK_C,
    ]);
    expect(method).toBe('all');
    expect(context).toBe(transaction);
    expect(em.find).not.toHaveBeenCalled();

    expect(counts).toEqual(
      new Map([
        [LINK_A, 3],
        [LINK_B, 1],
      ]),
    );
    expect(counts.has(LINK_C)).toBe(false);
  });

  it('un conteo que llega como texto se convierte a número', async () => {
    const { em } = emReturning([{ shared_access_link_id: LINK_A, count: '7' }]);
    const counts = await repo.countOpenedByLinkIds(em as never, [LINK_A]);
    expect(counts.get(LINK_A)).toBe(7);
  });

  it('sin enlaces no consulta', async () => {
    const { em, execute } = emReturning([]);
    const counts = await repo.countOpenedByLinkIds(em as never, []);
    expect(counts.size).toBe(0);
    expect(execute).not.toHaveBeenCalled();
    expect(em.getConnection).not.toHaveBeenCalled();
  });
});
