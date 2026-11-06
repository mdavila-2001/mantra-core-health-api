import { BULK_IMPORT_PERMISSIONS } from '../bulk_import/bulk-import.constants';
import { CONCEPTS } from '../../common/constants/concepts';
import { AUTHZ } from './authz.concepts';
import {
  rolePermissionSeedId,
  seedPermissionRoleGrants,
} from './authz.permission-role-grants.seed';
import {
  PLATFORM_PERMISSION_SEED,
  clinicalRoleId,
  platformPermissionId,
} from './authz.seed';
import { Permissions, RolePermissions, Roles } from './entities';

/**
 * `em` en memoria: `findOne` / `create` / `flush` sobre tres tablas. Es un doble declarado: la
 * segunda corrida contra PostgreSQL real se ejerce aparte (ver el reporte de H5).
 */
function memoryEm(seed: {
  permissions?: Record<string, unknown>[];
  roles?: Record<string, unknown>[];
  rolePermissions?: Record<string, unknown>[];
}) {
  const tables = new Map<unknown, Record<string, unknown>[]>([
    [Permissions, [...(seed.permissions ?? [])]],
    [Roles, [...(seed.roles ?? [])]],
    [RolePermissions, [...(seed.rolePermissions ?? [])]],
  ]);
  const pending: [unknown, Record<string, unknown>][] = [];
  const em = {
    findOne: async (entity: unknown, where: Record<string, unknown>) =>
      (tables.get(entity) ?? []).find((row) =>
        Object.entries(where).every(([k, v]) => row[k] === v),
      ) ?? null,
    create: (entity: unknown, data: Record<string, unknown>) => {
      pending.push([entity, data]);
      return data;
    },
    flush: async () => {
      for (const [entity, data] of pending.splice(0))
        tables.get(entity)!.push(data);
    },
  };
  return { em: em as never, tables };
}

const PERM_USERS = platformPermissionId(BULK_IMPORT_PERMISSIONS.users);
const PERM_CLINICAL = platformPermissionId(BULK_IMPORT_PERMISSIONS.clinical);
const permissionRows = () => [
  { id: PERM_USERS, code: BULK_IMPORT_PERMISSIONS.users },
  { id: PERM_CLINICAL, code: BULK_IMPORT_PERMISSIONS.clinical },
];
const role = (code: string) => ({ id: clinicalRoleId(code), code });

describe('semilla de permisos del motor de cargas masivas (H5)', () => {
  describe('datos', () => {
    const bulk = PLATFORM_PERMISSION_SEED.filter((p) =>
      p.code.startsWith('bulk_import.'),
    );

    it('siembra exactamente los dos permisos que el motor consulta, con resource = código y acción EXECUTE', () => {
      expect(bulk.map((p) => p.code).sort()).toEqual(
        Object.values(BULK_IMPORT_PERMISSIONS).sort(),
      );
      for (const p of bulk) {
        expect(p.resource).toBe(p.code);
        expect(p.action).toBe('EXECUTE');
        expect(p.id).toBe(platformPermissionId(p.code));
      }
    });

    it('se conceden a SECURITY_ADMIN y PLATFORM_ADMIN, son peligrosos y admiten concesión directa', () => {
      for (const p of bulk) {
        expect(p.grantToRoleCodes).toEqual([
          'SECURITY_ADMIN',
          'PLATFORM_ADMIN',
        ]);
        expect(p.isDangerous).toBe(true);
        expect(p.allowDirectUserGrant).toBe(true);
      }
    });

    it('llevan procedencia registrada: catálogo interno, fuente, referencia, fecha y licencia', () => {
      for (const p of bulk) {
        expect(p.provenance).toMatchObject({ catalog: 'INTERNO' });
        expect(p.provenance?.source).toBeTruthy();
        expect(p.provenance?.reference).toContain('bulk-import.constants.ts');
        expect(p.provenance?.obtainedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(p.provenance?.license).toBeTruthy();
      }
    });

    it('códigos e ids de toda la semilla son únicos', () => {
      const codes = PLATFORM_PERMISSION_SEED.map((p) => p.code);
      const ids = PLATFORM_PERMISSION_SEED.map((p) => p.id);
      expect(new Set(codes).size).toBe(codes.length);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe('correcto', () => {
    it('concede ALLOW a PLATFORM_ADMIN sobre ambos permisos, con id determinista', async () => {
      const { em, tables } = memoryEm({
        permissions: permissionRows(),
        roles: [role('PLATFORM_ADMIN')],
      });
      const r = await seedPermissionRoleGrants(em, new Date('2026-10-31'));

      expect(r.inserted).toBe(2);
      const rows = tables.get(RolePermissions)!;
      expect(rows.map((x) => x.id).sort()).toEqual(
        [
          rolePermissionSeedId('PLATFORM_ADMIN', BULK_IMPORT_PERMISSIONS.users),
          rolePermissionSeedId(
            'PLATFORM_ADMIN',
            BULK_IMPORT_PERMISSIONS.clinical,
          ),
        ].sort(),
      );
      for (const row of rows) {
        expect(row.effectConceptId).toBe(AUTHZ.EFFECT_ALLOW);
        expect(row.stateConceptId).toBe(CONCEPTS.STATE_ACTIVE);
        expect(row.roleId).toBe(clinicalRoleId('PLATFORM_ADMIN'));
      }
    });

    it('si existe una fila authz.roles SECURITY_ADMIN, también la recibe', async () => {
      const { em, tables } = memoryEm({
        permissions: permissionRows(),
        roles: [role('PLATFORM_ADMIN'), role('SECURITY_ADMIN')],
      });
      const r = await seedPermissionRoleGrants(em);

      expect(r.inserted).toBe(4);
      expect(r.skippedMissingRole).toEqual([]);
      expect(tables.get(RolePermissions)).toHaveLength(4);
    });
  });

  describe('límite', () => {
    it('segunda corrida: 0 inserciones y las existentes se cuentan como presentes', async () => {
      const { em, tables } = memoryEm({
        permissions: permissionRows(),
        roles: [role('PLATFORM_ADMIN'), role('SECURITY_ADMIN')],
      });
      await seedPermissionRoleGrants(em);
      const second = await seedPermissionRoleGrants(em);

      expect(second).toEqual({
        inserted: 0,
        alreadyPresent: 4,
        skippedMissingRole: [],
      });
      expect(tables.get(RolePermissions)).toHaveLength(4);
    });

    it('una concesión revocada por un administrador no se vuelve a crear', async () => {
      const { em, tables } = memoryEm({
        permissions: permissionRows(),
        roles: [role('PLATFORM_ADMIN')],
        rolePermissions: [
          {
            roleId: clinicalRoleId('PLATFORM_ADMIN'),
            permissionId: PERM_USERS,
            stateConceptId: CONCEPTS.STATE_REVOKED,
          },
        ],
      });
      const r = await seedPermissionRoleGrants(em);

      expect(r.inserted).toBe(1); // sólo la clínica, que no tenía fila
      expect(r.alreadyPresent).toBe(1);
      expect(tables.get(RolePermissions)).toHaveLength(2);
    });

    it('si un administrador creó el permiso a mano con el mismo código, se concede ESE permiso', async () => {
      const manual = {
        id: 'permiso-manual',
        code: BULK_IMPORT_PERMISSIONS.users,
      };
      const { em, tables } = memoryEm({
        permissions: [
          manual,
          { id: PERM_CLINICAL, code: BULK_IMPORT_PERMISSIONS.clinical },
        ],
        roles: [role('PLATFORM_ADMIN')],
      });
      await seedPermissionRoleGrants(em);

      const ids = tables.get(RolePermissions)!.map((r) => r.permissionId);
      expect(ids).toContain('permiso-manual');
      expect(ids).not.toContain(PERM_USERS);
    });
  });

  describe('inválido', () => {
    it('SECURITY_ADMIN sin fila en authz.roles se omite y se informa, sin lanzar ni inventar el rol', async () => {
      const { em, tables } = memoryEm({
        permissions: permissionRows(),
        roles: [role('PLATFORM_ADMIN')],
      });
      const r = await seedPermissionRoleGrants(em);

      expect(r.skippedMissingRole.sort()).toEqual([
        `SECURITY_ADMIN:${BULK_IMPORT_PERMISSIONS.clinical}`,
        `SECURITY_ADMIN:${BULK_IMPORT_PERMISSIONS.users}`,
      ]);
      expect(tables.get(Roles)).toHaveLength(1);
    });

    it('sin los permisos persistidos no concede nada', async () => {
      const { em, tables } = memoryEm({ roles: [role('PLATFORM_ADMIN')] });
      const r = await seedPermissionRoleGrants(em);

      expect(r).toEqual({
        inserted: 0,
        alreadyPresent: 0,
        skippedMissingRole: [],
      });
      expect(tables.get(RolePermissions)).toHaveLength(0);
    });

    it('no toca los permisos que no declaran roles (el de resultado diagnóstico)', async () => {
      const { em, tables } = memoryEm({
        permissions: [
          ...permissionRows(),
          {
            id: platformPermissionId('DIAGNOSTIC_RESULT_READ'),
            code: 'DIAGNOSTIC_RESULT_READ',
          },
        ],
        roles: [role('PLATFORM_ADMIN')],
      });
      await seedPermissionRoleGrants(em);

      expect(
        tables
          .get(RolePermissions)!
          .every(
            (r) =>
              r.permissionId !== platformPermissionId('DIAGNOSTIC_RESULT_READ'),
          ),
      ).toBe(true);
    });
  });
});
