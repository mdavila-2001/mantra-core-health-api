import { PreconditionFailedException, runWithTenant } from '../../../common';
import { resolveQaScope } from './qa-scope';

const TENANT_A = '11111111-1111-1111-1111-111111111111';

describe('resolveQaScope: alcance de SYSTEM', () => {
  it('SYSTEM global sin tenant en contexto es el barrido (sin alcance)', () => {
    const worker = { id: 'svc', roles: ['SYSTEM'] } as any;

    expect(resolveQaScope(worker)).toBeUndefined();
  });

  it('SYSTEM global con tenant en contexto queda acotado a él', () => {
    const worker = { id: 'svc', roles: ['SYSTEM'] } as any;

    expect(runWithTenant(TENANT_A, () => resolveQaScope(worker))).toBe(
      TENANT_A,
    );
  });

  it('SYSTEM concedido con ámbito de tenant no recibe el barrido global', () => {
    const scopedSystem = {
      id: 'u-2',
      roles: ['SYSTEM', 'QA_ADMIN'],
      scopedRoles: { [TENANT_A]: ['SYSTEM'] },
    } as any;

    expect(() => resolveQaScope(scopedSystem)).toThrow(
      PreconditionFailedException,
    );
  });

  it('un actor de tenant sin tenant activo falla cerrado', () => {
    expect(() =>
      resolveQaScope({ id: 'u-3', roles: ['QA_ADMIN'] } as any),
    ).toThrow(PreconditionFailedException);
  });
});
