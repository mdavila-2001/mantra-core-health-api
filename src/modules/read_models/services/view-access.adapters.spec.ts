import { jest } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import {
  AuthzViewPermissionGate,
  ClinicalViewPatientAccess,
  DisabledViewFeatureFlags,
  TerminologyViewAudienceGate,
} from './view-access.adapters';
import { CONCEPTS } from '../../../common';
import { AUTHZ } from '../../authz/authz.concepts';
import {
  Roles,
  RolePermissions,
  UserPermissionGrants,
} from '../../authz/entities';
import {
  CatalogConcepts,
  ValueSetMembers,
  ValueSetVersions,
} from '../../terminology/entities';

const TENANT = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const OTHER_TENANT = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const PERMISSION = '11111111-1111-1111-1111-111111111111';
const user = { id: 'u-1', roles: ['CLINICIAN'] } as any;

/**
 * Un `EntityManager` simulado que responde `find` por entidad.
 *
 * @param byEntity - Filas por entidad (o función de las condiciones).
 * @returns El em simulado.
 */
function fakeEm(byEntity: Map<unknown, unknown>) {
  const em: any = {
    fork: mockFn(() => em),
    find: mockFn((entity: unknown, where: any) => {
      const rows = byEntity.get(entity);
      return Promise.resolve(
        typeof rows === 'function' ? (rows as any)(where) : (rows ?? []),
      );
    }),
  };
  return em;
}

describe('AuthzViewPermissionGate', () => {
  /**
   * Arma la compuerta con asignaciones y filas de authz dadas.
   *
   * @param options - Asignaciones, roles, bindings y excepciones del usuario.
   * @returns La compuerta.
   */
  function gate(options: {
    assignments?: { code: string; tenantId?: string }[];
    roles?: any[];
    bindings?: any[];
    grants?: any[];
  }) {
    const rows = new Map<unknown, unknown>([
      [Roles, options.roles ?? [{ id: 'role-1', code: 'CLINICIAN' }]],
      [RolePermissions, options.bindings ?? []],
      [UserPermissionGrants, options.grants ?? []],
    ]);
    const em = fakeEm(rows);
    const effectiveRoles = {
      scopedAssignmentsForUser: mockFn().mockResolvedValue(
        options.assignments ?? [{ code: 'CLINICIAN' }],
      ),
    };
    return {
      gate: new AuthzViewPermissionGate(em, effectiveRoles as any),
      em,
    };
  }

  it('concede con un ALLOW de rol y ningún DENY', async () => {
    const { gate: g } = gate({
      bindings: [{ effectConceptId: AUTHZ.EFFECT_ALLOW }],
    });

    expect(await g.holds(user, TENANT, PERMISSION)).toBe(true);
  });

  it('un DENY de rol gana sobre el ALLOW', async () => {
    const { gate: g } = gate({
      bindings: [
        { effectConceptId: AUTHZ.EFFECT_ALLOW },
        { effectConceptId: AUTHZ.EFFECT_DENY },
      ],
    });

    expect(await g.holds(user, TENANT, PERMISSION)).toBe(false);
  });

  it('un DENY individual vigente gana sobre el ALLOW del rol', async () => {
    const { gate: g } = gate({
      bindings: [{ effectConceptId: AUTHZ.EFFECT_ALLOW }],
      grants: [{ effectConceptId: AUTHZ.EFFECT_DENY }],
    });

    expect(await g.holds(user, TENANT, PERMISSION)).toBe(false);
  });

  it('una excepción de usuario vencida no cuenta', async () => {
    const { gate: g } = gate({
      assignments: [],
      grants: [
        {
          effectConceptId: AUTHZ.EFFECT_ALLOW,
          validTo: new Date(Date.now() - 1000),
        },
      ],
    });

    expect(await g.holds(user, TENANT, PERMISSION)).toBe(false);
  });

  it('una excepción de usuario vigente concede aunque no haya roles', async () => {
    const { gate: g } = gate({
      assignments: [],
      grants: [{ effectConceptId: AUTHZ.EFFECT_ALLOW }],
    });

    expect(await g.holds(user, TENANT, PERMISSION)).toBe(true);
  });

  it('la asignación acotada a otro tenant no cuenta; la global sí', async () => {
    const scoped = gate({
      assignments: [{ code: 'CLINICIAN', tenantId: OTHER_TENANT }],
      bindings: [{ effectConceptId: AUTHZ.EFFECT_ALLOW }],
    });
    expect(await scoped.gate.holds(user, TENANT, PERMISSION)).toBe(false);
    // Sin roles efectivos ni siquiera se consultan los bindings.
    expect(scoped.em.find).not.toHaveBeenCalledWith(
      RolePermissions,
      expect.anything(),
    );

    const global = gate({
      assignments: [{ code: 'CLINICIAN' }],
      bindings: [{ effectConceptId: AUTHZ.EFFECT_ALLOW }],
    });
    expect(await global.gate.holds(user, TENANT, PERMISSION)).toBe(true);
  });

  it('hereda los permisos del rol padre', async () => {
    const roles = new Map<unknown, unknown>([
      [
        Roles,
        (where: any) =>
          where.code
            ? [{ id: 'child', code: 'CLINICIAN', parentRoleId: 'parent' }]
            : [{ id: 'parent', code: 'BASE' }],
      ],
      [
        RolePermissions,
        (where: any) =>
          where.roleId.$in.includes('parent')
            ? [{ effectConceptId: AUTHZ.EFFECT_ALLOW }]
            : [],
      ],
    ]);
    const g = new AuthzViewPermissionGate(fakeEm(roles), {
      scopedAssignmentsForUser: mockFn().mockResolvedValue([
        { code: 'CLINICIAN' },
      ]),
    } as any);

    expect(await g.holds(user, TENANT, PERMISSION)).toBe(true);
  });

  it('sin ningún binding ni excepción: no concede', async () => {
    const { gate: g } = gate({});

    expect(await g.holds(user, TENANT, PERMISSION)).toBe(false);
  });

  it('sólo consulta roles activos y bindings activos del permiso pedido', async () => {
    const { gate: g, em } = gate({
      bindings: [{ effectConceptId: AUTHZ.EFFECT_ALLOW }],
    });

    await g.holds(user, TENANT, PERMISSION);

    expect(em.find).toHaveBeenCalledWith(Roles, {
      code: { $in: ['CLINICIAN'] },
      stateConceptId: CONCEPTS.STATE_ACTIVE,
      $or: [{ tenantId: null }, { tenantId: TENANT }],
    });
    expect(em.find).toHaveBeenCalledWith(RolePermissions, {
      roleId: { $in: ['role-1'] },
      permissionId: PERMISSION,
      stateConceptId: CONCEPTS.STATE_ACTIVE,
    });
  });
});

/**
 * Una base simulada que sí evalúa el `where` de lo que el adaptador consulta
 * (id, código, estado, usuario, permiso y ámbito de tenant), para que una
 * consulta sin esas condiciones devuelva las filas ajenas, como lo haría la base.
 *
 * @param rows - Filas de la tabla.
 * @returns Función de las condiciones a las filas que cumplen.
 */
function table(rows: any[]) {
  return (where: any) =>
    rows.filter((row) => {
      if (where.id?.$in && !where.id.$in.includes(row.id)) return false;
      if (where.code?.$in && !where.code.$in.includes(row.code)) return false;
      if (where.roleId?.$in && !where.roleId.$in.includes(row.roleId)) {
        return false;
      }
      for (const key of ['stateConceptId', 'userId', 'permissionId']) {
        if (where[key] !== undefined && row[key] !== where[key]) return false;
      }
      if (where.$or) {
        return where.$or.some((c: { tenantId: string | null }) =>
          c.tenantId === null
            ? (row.tenantId ?? null) === null
            : row.tenantId === c.tenantId,
        );
      }
      return true;
    });
}

describe('AuthzViewPermissionGate: ámbito de tenant y estado de los roles', () => {
  const ACTIVE = CONCEPTS.STATE_ACTIVE;
  const ALLOW = {
    permissionId: PERMISSION,
    effectConceptId: AUTHZ.EFFECT_ALLOW,
    stateConceptId: ACTIVE,
  };

  /**
   * Arma la compuerta sobre tablas que evalúan el `where`.
   *
   * @param tables - Roles, bindings y excepciones del usuario.
   * @returns La compuerta.
   */
  function gate(tables: {
    roles?: any[];
    bindings?: any[];
    grants?: any[];
    assignments?: { code: string; tenantId?: string }[];
  }) {
    const rows = new Map<unknown, unknown>([
      [Roles, table(tables.roles ?? [])],
      [RolePermissions, table(tables.bindings ?? [])],
      [UserPermissionGrants, table(tables.grants ?? [])],
    ]);
    return new AuthzViewPermissionGate(fakeEm(rows), {
      scopedAssignmentsForUser: mockFn().mockResolvedValue(
        tables.assignments ?? [],
      ),
    } as any);
  }

  const grant = (overrides: Record<string, unknown> = {}) => ({
    userId: user.id,
    permissionId: PERMISSION,
    stateConceptId: ACTIVE,
    effectConceptId: AUTHZ.EFFECT_ALLOW,
    ...overrides,
  });

  it('una excepción de usuario concedida en otro tenant no autoriza en el activo', async () => {
    const g = gate({ grants: [grant({ tenantId: OTHER_TENANT })] });

    expect(await g.holds(user, TENANT, PERMISSION)).toBe(false);
  });

  it('una excepción de usuario del tenant activo y una global sí autorizan', async () => {
    const own = gate({ grants: [grant({ tenantId: TENANT })] });
    const global = gate({ grants: [grant()] });

    expect(await own.holds(user, TENANT, PERMISSION)).toBe(true);
    expect(await global.holds(user, TENANT, PERMISSION)).toBe(true);
  });

  it('sin tenant activo sólo cuentan las excepciones globales', async () => {
    const scoped = gate({ grants: [grant({ tenantId: TENANT })] });
    const global = gate({ grants: [grant()] });

    expect(await scoped.holds(user, undefined, PERMISSION)).toBe(false);
    expect(await global.holds(user, undefined, PERMISSION)).toBe(true);
  });

  it('un rol de otro tenant con el mismo código no concede sus permisos', async () => {
    const g = gate({
      assignments: [{ code: 'CLINICIAN', tenantId: TENANT }],
      roles: [
        {
          id: 'foreign',
          code: 'CLINICIAN',
          tenantId: OTHER_TENANT,
          stateConceptId: ACTIVE,
        },
      ],
      bindings: [{ ...ALLOW, roleId: 'foreign' }],
    });

    expect(await g.holds(user, TENANT, PERMISSION)).toBe(false);
  });

  it('un rol del tenant activo y uno de sistema sí conceden', async () => {
    const own = gate({
      assignments: [{ code: 'CLINICIAN' }],
      roles: [
        {
          id: 'own',
          code: 'CLINICIAN',
          tenantId: TENANT,
          stateConceptId: ACTIVE,
        },
      ],
      bindings: [{ ...ALLOW, roleId: 'own' }],
    });
    const system = gate({
      assignments: [{ code: 'CLINICIAN' }],
      roles: [{ id: 'sys', code: 'CLINICIAN', stateConceptId: ACTIVE }],
      bindings: [{ ...ALLOW, roleId: 'sys' }],
    });

    expect(await own.holds(user, TENANT, PERMISSION)).toBe(true);
    expect(await system.holds(user, TENANT, PERMISSION)).toBe(true);
  });

  it('un rol padre que no está activo no concede sus permisos', async () => {
    const g = gate({
      assignments: [{ code: 'CLINICIAN' }],
      roles: [
        {
          id: 'child',
          code: 'CLINICIAN',
          parentRoleId: 'parent',
          stateConceptId: ACTIVE,
        },
        {
          id: 'parent',
          code: 'BASE',
          stateConceptId: CONCEPTS.STATE_REVOKED,
        },
      ],
      bindings: [{ ...ALLOW, roleId: 'parent' }],
    });

    expect(await g.holds(user, TENANT, PERMISSION)).toBe(false);
  });

  it('la herencia se corta en el primer padre inactivo: el abuelo activo tampoco concede', async () => {
    const g = gate({
      assignments: [{ code: 'CLINICIAN' }],
      roles: [
        {
          id: 'child',
          code: 'CLINICIAN',
          parentRoleId: 'parent',
          stateConceptId: ACTIVE,
        },
        {
          id: 'parent',
          code: 'MID',
          parentRoleId: 'grand',
          stateConceptId: CONCEPTS.STATE_REVOKED,
        },
        { id: 'grand', code: 'ROOT', stateConceptId: ACTIVE },
      ],
      bindings: [{ ...ALLOW, roleId: 'grand' }],
    });

    expect(await g.holds(user, TENANT, PERMISSION)).toBe(false);
  });

  it('un padre activo sigue heredando a través de la cadena', async () => {
    const g = gate({
      assignments: [{ code: 'CLINICIAN' }],
      roles: [
        {
          id: 'child',
          code: 'CLINICIAN',
          parentRoleId: 'parent',
          stateConceptId: ACTIVE,
        },
        {
          id: 'parent',
          code: 'MID',
          parentRoleId: 'grand',
          stateConceptId: ACTIVE,
        },
        { id: 'grand', code: 'ROOT', stateConceptId: ACTIVE },
      ],
      bindings: [{ ...ALLOW, roleId: 'grand' }],
    });

    expect(await g.holds(user, TENANT, PERMISSION)).toBe(true);
  });

  it('un padre de otro tenant no concede por herencia', async () => {
    const g = gate({
      assignments: [{ code: 'CLINICIAN' }],
      roles: [
        {
          id: 'child',
          code: 'CLINICIAN',
          parentRoleId: 'parent',
          stateConceptId: ACTIVE,
        },
        {
          id: 'parent',
          code: 'BASE',
          tenantId: OTHER_TENANT,
          stateConceptId: ACTIVE,
        },
      ],
      bindings: [{ ...ALLOW, roleId: 'parent' }],
    });

    expect(await g.holds(user, TENANT, PERMISSION)).toBe(false);
  });
});

describe('TerminologyViewAudienceGate', () => {
  /**
   * Arma la compuerta con versiones, miembros y conceptos dados.
   *
   * @param options - Filas de terminología.
   * @returns La compuerta.
   */
  function gate(options: {
    versions?: any[];
    members?: any[];
    concepts?: any[];
  }) {
    return new TerminologyViewAudienceGate(
      fakeEm(
        new Map<unknown, unknown>([
          [ValueSetVersions, options.versions ?? []],
          [ValueSetMembers, options.members ?? []],
          [CatalogConcepts, options.concepts ?? []],
        ]),
      ),
    );
  }

  it('pertenece si alguno de sus roles está incluido en la versión vigente', async () => {
    const g = gate({
      versions: [{ id: 'v1' }],
      members: [{ conceptId: 'c1', included: true }],
      concepts: [{ id: 'c1', code: 'CLINICIAN' }],
    });

    expect(await g.isInAudience(user, 'vs-1')).toBe(true);
  });

  it('no pertenece si su rol no está en el conjunto', async () => {
    const g = gate({
      versions: [{ id: 'v1' }],
      members: [{ conceptId: 'c1', included: true }],
      concepts: [{ id: 'c1', code: 'ACCOUNTANT' }],
    });

    expect(await g.isInAudience(user, 'vs-1')).toBe(false);
  });

  it('una versión vencida o futura no cuenta', async () => {
    const g = gate({
      versions: [
        { id: 'old', validTo: new Date(Date.now() - 1000) },
        { id: 'future', validFrom: new Date(Date.now() + 100000) },
      ],
      members: [{ conceptId: 'c1', included: true }],
      concepts: [{ id: 'c1', code: 'CLINICIAN' }],
    });

    expect(await g.isInAudience(user, 'vs-1')).toBe(false);
  });

  it('un usuario sin roles o un conjunto vacío no pertenece', async () => {
    expect(
      await gate({}).isInAudience({ id: 'x', roles: [] } as any, 'vs-1'),
    ).toBe(false);
    expect(
      await gate({ versions: [{ id: 'v1' }] }).isInAudience(user, 'vs'),
    ).toBe(false);
  });
});

describe('DisabledViewFeatureFlags', () => {
  it('sin proveedor de flags, un flag declarado está apagado (fail-closed)', async () => {
    expect(await new DisabledViewFeatureFlags().isEnabled()).toBe(false);
  });
});

describe('ClinicalViewPatientAccess', () => {
  it('permite si la política de la historia lo permite', async () => {
    const clinicalRead = {
      assertCanReadHistory: mockFn().mockResolvedValue(undefined),
    };
    const access = new ClinicalViewPatientAccess(clinicalRead as any);

    expect(await access.canAccess(user, 'pat-1')).toBe(true);
    expect(clinicalRead.assertCanReadHistory).toHaveBeenCalledWith(
      'pat-1',
      user,
    );
  });

  it('deniega ante el 403 de la política, y no disfraza otros errores', async () => {
    const clinicalRead = {
      assertCanReadHistory: mockFn().mockRejectedValue(
        new ForbiddenException(),
      ),
    };
    const access = new ClinicalViewPatientAccess(clinicalRead as any);
    expect(await access.canAccess(user, 'pat-1')).toBe(false);

    clinicalRead.assertCanReadHistory.mockRejectedValue(new Error('db down'));
    await expect(access.canAccess(user, 'pat-1')).rejects.toThrow('db down');
  });
});
