import 'reflect-metadata';
import { jest } from '@jest/globals';
import { ROLES_KEY } from '../../../../common/auth/roles.decorator';
import { AUDITED_KEY } from '../../../../common/audit-trail/audit-trail.decorators';
import { IamAccessRescueController } from './iam-access-rescue.controller';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

function build() {
  const ipRules = { clearForTenant: mockFn().mockResolvedValue(3) };
  const sessionPolicies = { clearForTenant: mockFn().mockResolvedValue(2) };
  const controller = new IamAccessRescueController(
    ipRules as any,
    sessionPolicies as any,
  );
  return { controller, ipRules, sessionPolicies };
}

const system = { id: 'system-1', roles: ['SYSTEM'] } as any;

/** El método del controlador como valor, para leer su metadata. */
const handlerOf = (method: string): object =>
  Object.getOwnPropertyDescriptor(IamAccessRescueController.prototype, method)
    ?.value as object;

describe('IamAccessRescueController (ruta de rescate de plataforma)', () => {
  it('es solo @Roles(SYSTEM) a nivel de clase: una organización no puede desbloquearse sola', () => {
    expect(Reflect.getMetadata(ROLES_KEY, IamAccessRescueController)).toEqual([
      'SYSTEM',
    ]);
    // Ningún método lo relaja con otro @Roles.
    for (const method of ['clearIpAccessRules', 'clearSessionPolicies']) {
      expect(Reflect.getMetadata(ROLES_KEY, handlerOf(method))).toBeUndefined();
    }
  });

  it('borra las reglas de red del tenant indicado en la ruta, a nombre de quien rescata', async () => {
    const d = build();
    await expect(
      d.controller.clearIpAccessRules('tenant-1', system),
    ).resolves.toEqual({ retired: 3 });
    expect(d.ipRules.clearForTenant).toHaveBeenCalledWith(
      'tenant-1',
      'system-1',
    );
  });

  it('borra las políticas de sesión del tenant indicado', async () => {
    const d = build();
    await expect(
      d.controller.clearSessionPolicies('tenant-1', system),
    ).resolves.toEqual({ retired: 2 });
    expect(d.sessionPolicies.clearForTenant).toHaveBeenCalledWith(
      'tenant-1',
      'system-1',
    );
  });

  it('cada ruta deja su PROPIA acción de auditoría, con el tenant de la ruta como recurso', () => {
    const optionsOf = (method: 'clearIpAccessRules' | 'clearSessionPolicies') =>
      Reflect.getMetadata(AUDITED_KEY, handlerOf(method));
    expect(optionsOf('clearIpAccessRules')).toEqual({
      action: 'IP_ACCESS_RULES_RESCUED',
      entity: 'ip_access_rule',
      entityId: 'param:tenantId',
    });
    expect(optionsOf('clearSessionPolicies')).toEqual({
      action: 'SESSION_POLICIES_RESCUED',
      entity: 'session_policy',
      entityId: 'param:tenantId',
    });
    // Distintas de las acciones de quien guarda las reglas normalmente.
    expect(optionsOf('clearIpAccessRules').action).not.toBe(
      'IP_ACCESS_RULES_REPLACED',
    );
  });
});
