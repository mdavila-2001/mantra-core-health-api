import { PreconditionFailedException, runWithTenant } from '../../common';
import { resolveVectorScope } from './vector-scope';

const TENANT_A = '11111111-1111-1111-1111-111111111111';
const TENANT_B = '22222222-2222-2222-2222-222222222222';

describe('resolveVectorScope', () => {
  it('con tenant en el contexto acota a ese tenant', () => {
    const actor = { id: 'u-1', roles: ['CLINICIAN'] } as any;

    expect(runWithTenant(TENANT_A, () => resolveVectorScope(actor))).toEqual({
      tenantId: TENANT_A,
    });
  });

  it('SYSTEM global sin tenant en contexto barre todos los tenants', () => {
    const worker = { id: 'svc', roles: ['SYSTEM'] } as any;

    expect(resolveVectorScope(worker)).toEqual({ tenantId: undefined });
  });

  it('SYSTEM concedido con ámbito de tenant no recibe el barrido global', () => {
    const scopedSystem = {
      id: 'u-2',
      roles: ['SYSTEM', 'CLINICIAN'],
      scopedRoles: { [TENANT_A]: ['SYSTEM'] },
    } as any;

    expect(() => resolveVectorScope(scopedSystem)).toThrow(
      PreconditionFailedException,
    );
  });

  it('SYSTEM con ámbito sigue acotado al tenant del contexto', () => {
    const scopedSystem = {
      id: 'u-2',
      roles: ['SYSTEM'],
      scopedRoles: { [TENANT_A]: ['SYSTEM'] },
    } as any;

    expect(
      runWithTenant(TENANT_B, () => resolveVectorScope(scopedSystem)),
    ).toEqual({ tenantId: TENANT_B });
  });

  it('un actor sin SYSTEM y sin tenant falla cerrado', () => {
    expect(() =>
      resolveVectorScope({ id: 'u-3', roles: ['CLINICIAN'] } as any),
    ).toThrow(PreconditionFailedException);
  });
});
