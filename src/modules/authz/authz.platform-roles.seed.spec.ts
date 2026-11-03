import { SYSTEM_ROLE_SEED } from '../../common/seed/authz-clinical-roles-seed.service';
import { PLATFORM_ROLE_CODES } from '../data_catalog/infrastructure/adapters/iam-platform-role-codes.adapter';
import {
  AUTHZ_PLATFORM_ROLE_CODES,
  AUTHZ_PLATFORM_ROLE_SEED,
} from './authz.platform-roles.seed';
import { clinicalRoleId } from './authz.seed';

describe('roles de plataforma, negocio y servicio sembrados en authz', () => {
  it('cada rol tiene id determinista por su código y nombre', () => {
    for (const rol of AUTHZ_PLATFORM_ROLE_SEED) {
      expect(rol.id).toBe(clinicalRoleId(rol.code));
      expect(rol.name.trim().length).toBeGreaterThan(0);
    }
  });

  it('los códigos son únicos dentro del archivo y en toda la semilla de sistema', () => {
    expect(new Set(AUTHZ_PLATFORM_ROLE_CODES).size).toBe(
      AUTHZ_PLATFORM_ROLE_CODES.length,
    );
    const todos = SYSTEM_ROLE_SEED.map((rol) => rol.code);
    expect(new Set(todos).size).toBe(todos.length);
    const ids = SYSTEM_ROLE_SEED.map((rol) => rol.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('ninguno es asistencial: no queda sujeto al PDP clínico', () => {
    for (const rol of AUTHZ_PLATFORM_ROLE_SEED)
      expect(rol.baseRole).not.toBe('CLINICAL');
  });

  it('no siembra los roles que existen por otra vía (iam, SYSTEM, derivados del login)', () => {
    for (const codigo of PLATFORM_ROLE_CODES)
      expect(AUTHZ_PLATFORM_ROLE_CODES).not.toContain(codigo);
    expect(PLATFORM_ROLE_CODES).toContain('PHARMACY_STAFF');
  });

  it('las cuentas de servicio y la plataforma son globales: se asignan sin tenant', () => {
    const porCodigo = new Map(
      AUTHZ_PLATFORM_ROLE_SEED.map((rol) => [rol.code, rol]),
    );
    for (const codigo of [
      'PLATFORM_ADMIN',
      'SRE',
      'SYSTEM_WORKER',
      'WRITE_SERVICE',
      'AUTH_SERVICE',
      'TERMINOLOGY_ENGINEER',
    ])
      expect(porCodigo.get(codigo)?.scope).toBe('GLOBAL');
    expect(porCodigo.get('CASHIER')?.scope).toBe('TENANT');
    expect(porCodigo.get('LEARNER')?.scope).toBe('SELF');
  });
});
