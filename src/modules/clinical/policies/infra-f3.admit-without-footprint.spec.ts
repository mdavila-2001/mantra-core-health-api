import { describe, expect, it } from '@jest/globals';
import { allows, type InfraRole } from '../../practice/domain/ops/infra-scope';
import { INFRA_F3_POLICY } from './infra-f3.policy';

const rule = INFRA_F3_POLICY.actions['f3.adt.admit_without_footprint'];
const can = (roles: InfraRole[], globals: InfraRole[] = []) =>
  allows(rule, new Set(roles), false, globals, false);

describe('«Admisión crea el vínculo»: quién interna a un paciente sin huella previa', () => {
  it('admisión, supervisión de enfermería y admin de organización/sucursal (nivel sede)', () => {
    for (const r of [
      'ADMISSION',
      'NURSE_SUPERVISOR',
      'ORG_ADMIN',
      'SITE_ADMIN',
    ] as InfraRole[])
      expect(can([r])).toBe(true);
  });
  it('fail-closed: enfermería, plataforma suelta y roles globales no alcanzan', () => {
    expect(can(['NURSE'])).toBe(false);
    expect(can(['SUPERADMIN'])).toBe(false);
    expect(
      can([], ['BILLING', 'OR_MANAGER', 'PERIOP_STAFF', 'ACCOUNTING']),
    ).toBe(false);
  });
});
