import { PreconditionFailedException, runWithTenant } from '../../../common';
import { resolveReportingScope } from './reporting-scope';

const TENANT_A = '11111111-1111-1111-1111-111111111111';

describe('resolveReportingScope: alcance de SYSTEM', () => {
  it('SYSTEM global sin tenant en contexto es el barrido (sin alcance)', () => {
    const worker = { id: 'svc', roles: ['SYSTEM'] } as any;

    expect(resolveReportingScope(worker)).toBeUndefined();
  });

  it('SYSTEM global con tenant en contexto queda acotado a él', () => {
    const worker = { id: 'svc', roles: ['SYSTEM'] } as any;

    expect(runWithTenant(TENANT_A, () => resolveReportingScope(worker))).toBe(
      TENANT_A,
    );
  });

  it('SYSTEM concedido con ámbito de tenant no recibe el barrido global', () => {
    const scopedSystem = {
      id: 'u-2',
      roles: ['SYSTEM', 'REPORTING_ADMIN'],
      scopedRoles: { [TENANT_A]: ['SYSTEM'] },
    } as any;

    expect(() => resolveReportingScope(scopedSystem)).toThrow(
      PreconditionFailedException,
    );
  });

  it('un actor de tenant sin tenant activo falla cerrado', () => {
    expect(() =>
      resolveReportingScope({ id: 'u-3', roles: ['REPORTING_ADMIN'] } as any),
    ).toThrow(PreconditionFailedException);
  });
});
