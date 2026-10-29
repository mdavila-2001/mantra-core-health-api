import { INFRA_F2_POLICY } from './infra-f2.policy';
import {
  IMPLIED_ROLES,
  InfraPolicyRegistry,
  type InfraRole,
} from './infra-policy';

const roles = (action: string): InfraRole[] => [
  ...(INFRA_F2_POLICY.rules[action]?.roles ?? []),
];

describe('política de F2 (CONTRATO-F2-F5 §F2.3 «Permisos F2»)', () => {
  it('ver el tablero: todos salvo Facturación', () => {
    expect(roles('infra.board.view').sort()).toEqual(
      [
        'SUPERADMIN',
        'ORG_ADMIN',
        'BRANCH_ADMIN',
        'NURSE',
        'ADMISSION',
        'HOUSEKEEPING',
        'MAINTENANCE',
        'OR_MANAGER',
      ].sort(),
    );
    expect(roles('infra.board.view')).not.toContain('BILLING');
  });

  it('bloqueo clínico: enfermería y jefe de quirófano (solo quirófanos); nadie de estructura ni Limpieza', () => {
    expect(roles('infra.block.clinical').sort()).toEqual([
      'NURSE',
      'OR_MANAGER',
    ]);
    expect(INFRA_F2_POLICY.rules['infra.block.clinical'].onlyFunctions).toEqual(
      {
        OR_MANAGER: ['OPERATING_ROOM'],
      },
    );
  });

  it('bloqueo administrativo, cierre y reapertura: superadmin, administraciones y jefe de quirófano', () => {
    expect(roles('infra.block.admin').sort()).toEqual(
      ['SUPERADMIN', 'ORG_ADMIN', 'BRANCH_ADMIN', 'OR_MANAGER'].sort(),
    );
  });

  it('mantenimiento: administraciones y Mantenimiento; el superadmin no', () => {
    expect(roles('infra.block.maintenance').sort()).toEqual(
      ['ORG_ADMIN', 'BRANCH_ADMIN', 'MAINTENANCE'].sort(),
    );
  });

  it('marcar sucia: enfermería, Limpieza y jefe de quirófano; contaminada: sin Limpieza', () => {
    expect(roles('infra.hygiene.mark-dirty').sort()).toEqual(
      ['NURSE', 'HOUSEKEEPING', 'OR_MANAGER'].sort(),
    );
    expect(roles('infra.hygiene.mark-contaminated').sort()).toEqual([
      'NURSE',
      'OR_MANAGER',
    ]);
  });

  it('aislamiento: solo enfermería', () => {
    expect(roles('infra.isolation.set')).toEqual(['NURSE']);
  });

  it('la cola: ven las administraciones, enfermería, admisión, Limpieza y jefe de quirófano; no el superadmin ni Mantenimiento', () => {
    expect(roles('infra.cleaning.list').sort()).toEqual(
      [
        'ORG_ADMIN',
        'BRANCH_ADMIN',
        'NURSE',
        'ADMISSION',
        'HOUSEKEEPING',
        'OR_MANAGER',
      ].sort(),
    );
  });

  it('iniciar y terminar: enfermería y Limpieza; inspeccionar una terminal: solo supervisores', () => {
    expect(roles('infra.cleaning.work').sort()).toEqual([
      'HOUSEKEEPING',
      'NURSE',
    ]);
    expect(roles('infra.cleaning.inspect-terminal').sort()).toEqual([
      'HOUSEKEEPING_SUPERVISOR',
      'NURSE_SUPERVISOR',
    ]);
    expect(roles('infra.cleaning.inspect')).not.toContain('HOUSEKEEPING');
  });

  it('separación de funciones (INV-44): las administraciones no operan camas y Limpieza no bloquea, no aísla ni asigna pacientes', () => {
    const operativas = [
      'infra.block.clinical',
      'infra.hygiene.mark-dirty',
      'infra.hygiene.mark-contaminated',
      'infra.isolation.set',
      'infra.cleaning.create',
      'infra.cleaning.work',
      'infra.cleaning.inspect',
    ];
    for (const action of operativas) {
      expect(roles(action)).not.toContain('ORG_ADMIN');
      expect(roles(action)).not.toContain('BRANCH_ADMIN');
      expect(roles(action)).not.toContain('BILLING');
    }
    for (const action of [
      'infra.block.clinical',
      'infra.block.admin',
      'infra.block.maintenance',
      'infra.isolation.set',
    ]) {
      expect(roles(action)).not.toContain('HOUSEKEEPING');
    }
  });

  it('todas las acciones llevan el prefijo infra. y el registro las resuelve; el supervisor hereda al operario', () => {
    const registry = new InfraPolicyRegistry();
    registry.register(INFRA_F2_POLICY);
    for (const action of Object.keys(INFRA_F2_POLICY.rules)) {
      expect(action).toMatch(/^infra\./);
      expect(registry.rule(action)).toBe(INFRA_F2_POLICY.rules[action]);
    }
    expect(registry.rule('infra.nada')).toBeUndefined();
    expect(IMPLIED_ROLES.NURSE_SUPERVISOR).toEqual(['NURSE']);
    expect(IMPLIED_ROLES.HOUSEKEEPING_SUPERVISOR).toEqual(['HOUSEKEEPING']);
  });

  it('una franja que registra la misma política no duplica reglas', () => {
    const registry = new InfraPolicyRegistry();
    registry.register(INFRA_F2_POLICY);
    registry.register(INFRA_F2_POLICY);
    expect(registry.all()).toHaveLength(1);
  });
});
