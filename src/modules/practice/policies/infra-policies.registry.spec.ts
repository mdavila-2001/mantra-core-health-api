import {
  INFRA_F3_POLICY_REGISTRATION,
  infraF3RegistryPolicy,
} from '../../clinical/policies/infra-f3.policy';
import { infraF4RegistryPolicy } from '../../procedures_perioperative/policies/infra-f4.policy';
import { infraPlanRegistryPolicy } from '../plan/policies/infra-plan.policy';
import { INFRA_F2_POLICY } from './infra-f2.policy';
import { InfraPolicyRegistry, type InfraRole } from './infra-policy';

const ALL_ROLES: readonly InfraRole[] = [
  'SUPERADMIN',
  'ORG_ADMIN',
  'BRANCH_ADMIN',
  'NURSE',
  'NURSE_SUPERVISOR',
  'ADMISSION',
  'HOUSEKEEPING',
  'HOUSEKEEPING_SUPERVISOR',
  'MAINTENANCE',
  'OR_MANAGER',
  'INFECTION_CONTROL',
  'BILLING',
];

const registry = (): InfraPolicyRegistry => {
  const r = new InfraPolicyRegistry();
  r.register(INFRA_F2_POLICY);
  r.register(infraF3RegistryPolicy());
  r.register(infraF4RegistryPolicy());
  r.register(infraPlanRegistryPolicy());
  return r;
};

const rolesOf = (r: InfraPolicyRegistry, action: string): InfraRole[] => [
  ...(r.rule(action)?.roles ?? []),
];

describe('registro de políticas de infraestructura (F2, F3, F4 y plano)', () => {
  it('registra las cuatro políticas, cada una con sus acciones y sin pisarse', () => {
    const r = registry();
    expect(r.all().map((p) => p.name)).toEqual(['F2', 'F3', 'F4', 'PLAN']);
    const seen = new Map<string, string>();
    for (const policy of r.all()) {
      for (const action of Object.keys(policy.rules)) {
        expect(seen.get(action)).toBeUndefined();
        seen.set(action, policy.name);
      }
    }
    expect(r.rule('adt.admit')).toBeDefined();
    expect(r.rule('OR_BLOCK_MANAGE')).toBeDefined();
    expect(r.rule('plan.edit')).toBeDefined();
    expect(r.rule('infra.board.view')).toBeDefined();
  });

  it('el registro de F3 apunta a la misma tabla que lee AdtAccessService', () => {
    const r = registry();
    for (const action of Object.keys(INFRA_F3_POLICY_REGISTRATION.actions)) {
      expect(r.rule(action)).toBeDefined();
    }
  });

  it('todo rol registrado es un rol de infraestructura conocido', () => {
    for (const policy of registry().all()) {
      for (const [action, rule] of Object.entries(policy.rules)) {
        for (const role of rule.roles) {
          expect(ALL_ROLES).toContain(role);
        }
        expect(rule.summary).toBeTruthy();
        expect(action).toBeTruthy();
      }
    }
  });

  it('separación de funciones (INV-44): Limpieza, Mantenimiento y Facturación no operan camas, y la estructura tampoco', () => {
    const r = registry();
    const operate = [
      'adt.admit',
      'adt.assign_bed',
      'adt.transfer',
      'adt.discharge',
      'adt.cancel',
      'adt.override',
    ];
    for (const action of operate) {
      const roles = rolesOf(r, action);
      for (const forbidden of [
        'HOUSEKEEPING',
        'HOUSEKEEPING_SUPERVISOR',
        'MAINTENANCE',
        'OR_MANAGER',
        'BILLING',
        'ORG_ADMIN',
        'BRANCH_ADMIN',
        'SUPERADMIN',
      ] as const) {
        expect(roles).not.toContain(forbidden);
      }
    }
  });

  it('el paciente no llega a Limpieza ni a Mantenimiento en el plano', () => {
    const roles = rolesOf(registry(), 'plan.patient');
    expect(roles).toEqual(
      expect.arrayContaining(['NURSE', 'NURSE_SUPERVISOR', 'ADMISSION']),
    );
    for (const forbidden of [
      'HOUSEKEEPING',
      'HOUSEKEEPING_SUPERVISOR',
      'MAINTENANCE',
      'OR_MANAGER',
      'BILLING',
    ] as const) {
      expect(roles).not.toContain(forbidden);
    }
  });

  it('editar el plano es de estructura: ningún rol operativo', () => {
    expect(rolesOf(registry(), 'plan.edit').sort()).toEqual(
      ['BRANCH_ADMIN', 'ORG_ADMIN', 'SUPERADMIN'].sort(),
    );
  });

  it('bloques de quirófano: sólo el jefe de quirófano (delegado) o el rol global PERIOP_ADMIN', () => {
    const rule = registry().rule('OR_BLOCK_MANAGE')!;
    expect(rule.roles).toEqual(['OR_MANAGER']);
    expect(rule.globalRoles).toEqual(['PERIOP_ADMIN']);
  });
});
