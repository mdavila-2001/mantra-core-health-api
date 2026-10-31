import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SYSTEM_ROLE_SEED } from '../../common/seed/authz-clinical-roles-seed.service';
import { PLATFORM_ROLE_CODES } from '../data_catalog/services/permission-drift.service';
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

  describe('SUPPORT_STAFF (rol de ejecución del personal de apoyo)', () => {
    const rol = AUTHZ_PLATFORM_ROLE_SEED.find(
      (r) => r.code === 'SUPPORT_STAFF',
    );

    it('se siembra con id determinista en authz.roles, sin tocar el token', () => {
      expect(rol).toBeDefined();
      expect(rol?.id).toBe(clinicalRoleId('SUPPORT_STAFF'));
      expect(SYSTEM_ROLE_SEED.map((r) => r.code)).toContain('SUPPORT_STAFF');
      // El claim sigue saliendo del login (`withSupportStaffRole`): no es un rol global ni derivado.
      expect(PLATFORM_ROLE_CODES).not.toContain('SUPPORT_STAFF');
    });

    it('es de sistema y NO asignable: nadie lo recibe por existir ni por POST role-assignments', () => {
      expect(rol?.assignable).toBe(false);
      // Todo el resto de la semilla sigue siendo asignable (por omisión).
      for (const otro of AUTHZ_PLATFORM_ROLE_SEED)
        if (otro.code !== 'SUPPORT_STAFF')
          expect(otro.assignable ?? true).toBe(true);
    });

    it('no es asistencial (no queda sujeto al PDP clínico) y se acota a la organización', () => {
      expect(rol?.baseRole).toBe('STAFF');
      expect(rol?.scope).toBe('TENANT');
    });

    it('la lista de deriva de permisos ya no lo declara como «usado sin sembrar»', () => {
      const lista = JSON.parse(
        readFileSync(
          join(process.cwd(), 'tools/catalog/permission-drift-allowlist.json'),
          'utf8',
        ),
      ) as { roles?: string[] };
      expect(lista.roles ?? []).not.toContain('SUPPORT_STAFF');
    });
  });
});
