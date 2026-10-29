import { InfraPolicyRegistry } from '../../practice/policies/infra-policy';
import { INFRA_F5E_POLICY, InfraF5ePolicyInitializer } from './infra-f5.policy';

describe('política de F5e (matriz de permisos §6)', () => {
  const roles = (action: string) => INFRA_F5E_POLICY.rules[action].roles;

  it('Facturación hace todo; el administrador de organización configura tarifas y mira cargos, no los anula', () => {
    for (const action of Object.keys(INFRA_F5E_POLICY.rules))
      expect(roles(action)).toContain('BILLING');
    expect(roles('infra.tariff.write')).toEqual(['ORG_ADMIN', 'BILLING']);
    expect(roles('infra.charge.void')).toEqual(['BILLING']);
    expect(roles('infra.charge.invoice')).toEqual(['BILLING']);
  });

  it('el administrador de sucursal y el soporte de plataforma sólo leen', () => {
    for (const action of ['infra.tariff.view', 'infra.charge.view']) {
      expect(roles(action)).toEqual(
        expect.arrayContaining(['SUPERADMIN', 'BRANCH_ADMIN']),
      );
    }
    for (const action of [
      'infra.tariff.write',
      'infra.charge.void',
      'infra.charge.invoice',
    ]) {
      expect(roles(action)).not.toContain('SUPERADMIN');
      expect(roles(action)).not.toContain('BRANCH_ADMIN');
    }
  });

  it('Enfermería, Admisión, Limpieza, Mantenimiento y Jefe de quirófano no tienen ninguna acción de cobro', () => {
    const forbidden = [
      'NURSE',
      'NURSE_SUPERVISOR',
      'ADMISSION',
      'HOUSEKEEPING',
      'HOUSEKEEPING_SUPERVISOR',
      'MAINTENANCE',
      'OR_MANAGER',
      'INFECTION_CONTROL',
    ];
    for (const action of Object.keys(INFRA_F5E_POLICY.rules))
      for (const role of forbidden) expect(roles(action)).not.toContain(role);
  });

  it('el inicializador registra la política en INFRA_POLICIES', () => {
    const registry = new InfraPolicyRegistry();
    new InfraF5ePolicyInitializer(registry).onModuleInit();
    expect(registry.rule('infra.charge.void')?.roles).toEqual(['BILLING']);
  });
});
