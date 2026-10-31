import { jest } from '@jest/globals';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { runWithTenant } from '../../../common/tenant/tenant-context';
import { DIR } from '../../directory/directory.concepts';
import { TenantMemberships } from '../../directory/entities';
import {
  RefreshTokens,
  SecurityEvents,
  Sessions,
  UserGlobalRoles,
  Users,
} from '../../iam/entities';
import { AUTHZ_GOVERNANCE } from '../authz-governance.concepts';
import { AuthzGovernanceErrorReason as Reason } from '../authz-governance.error-reasons';
import { Roles, UserRoleAssignments } from '../entities';
import {
  AuthzUserLifecycleService,
  OFFBOARD_NOTE,
  OFFBOARD_SCOPED_NOTE,
  resolveGovernanceScope,
} from './authz-user-lifecycle.service';

// Fábrica de mocks con tipos sueltos: el contrato que se prueba es el del servicio, no el de jest.
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const ACTOR = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

interface Escena {
  status?: string | null;
  /** Último evento de ciclo de vida (más reciente primero). */
  events?: { eventTypeConceptId: string; detailJson?: unknown }[];
  /** Filas que afecta el UPDATE condicional de `iam.users`. */
  usersAffected?: number;
  revokedAssignments?: number;
}

function armar(e: Escena) {
  const tx: any = {
    findOne: mockFn(async (entity: unknown) =>
      entity === Users && e.status !== null
        ? { id: 'u-1', statusConceptId: e.status ?? CONCEPTS.USER_ACTIVE }
        : null,
    ),
    find: mockFn(async (entity: unknown) => {
      if (entity === SecurityEvents)
        return (e.events ?? []).map((x, i) => ({
          id: `ev-${i}`,
          recordedByUserId: 'admin-0',
          recordedAt: new Date(0),
          ...x,
        }));
      if (entity === Sessions) return [{ id: 's-1' }];
      return [];
    }),
    nativeUpdate: mockFn(async (entity: unknown) => {
      if (entity === Users) return e.usersAffected ?? 1;
      if (entity === UserRoleAssignments) return e.revokedAssignments ?? 0;
      return 1;
    }),
    create: mockFn((_entity: unknown, data: unknown) => data),
    flush: mockFn(async () => undefined),
  };
  const em: any = {
    ...tx,
    transactional: mockFn((cb: any) => cb(tx)),
  };
  const logger = { setContext: mockFn(), info: mockFn() };
  const service = new AuthzUserLifecycleService(em, logger as never);
  return { service, tx };
}

describe('AuthzUserLifecycleService', () => {
  it('suspende una cuenta activa: condiciona el UPDATE al estado, corta sesiones y deja el motivo', async () => {
    const { service, tx } = armar({});
    const r = await service.suspend('u-1', { reason: 'Licencia sin goce de sueldo' }, ACTOR);
    expect(r).toMatchObject({ userId: 'u-1', state: 'SUSPENDED', revokedAssignments: 0 });
    expect(tx.nativeUpdate).toHaveBeenCalledWith(
      Users,
      { id: 'u-1', statusConceptId: { $in: [CONCEPTS.USER_ACTIVE] } },
      expect.objectContaining({ statusConceptId: CONCEPTS.USER_LOCKED }),
    );
    expect(tx.nativeUpdate).toHaveBeenCalledWith(Sessions, expect.anything(), expect.anything());
    expect(tx.nativeUpdate).toHaveBeenCalledWith(RefreshTokens, expect.anything(), expect.anything());
    expect(tx.create).toHaveBeenCalledWith(
      SecurityEvents,
      expect.objectContaining({
        eventTypeConceptId: AUTHZ_GOVERNANCE.EVENT_USER_SUSPENDED,
        recordedByUserId: 'admin-1',
        detailJson: expect.objectContaining({ reason: 'Licencia sin goce de sueldo' }),
      }),
      { partial: true },
    );
    expect(tx.flush).toHaveBeenCalledTimes(1);
  });

  it('nadie se suspende a sí mismo', async () => {
    const { service, tx } = armar({});
    await expect(
      service.suspend('admin-1', { reason: 'me quiero ir un rato' }, ACTOR),
    ).rejects.toMatchObject({ reason: Reason.USER_LIFECYCLE_SELF_ACTION });
    expect(tx.nativeUpdate).not.toHaveBeenCalled();
  });

  it('si otro cambió el estado entre la lectura y la escritura, el UPDATE no afecta nada y es 409', async () => {
    const { service, tx } = armar({ usersAffected: 0 });
    const result = service.suspend('u-1', { reason: 'Investigación en curso' }, ACTOR);
    await expect(result).rejects.toBeInstanceOf(ConflictException);
    await expect(result).rejects.toMatchObject({ reason: Reason.USER_LIFECYCLE_NOT_ACTIVE });
    expect(tx.create).not.toHaveBeenCalled();
  });

  it('suspender una cuenta que ya no está activa es 409 y no escribe', async () => {
    const { service, tx } = armar({
      status: CONCEPTS.USER_LOCKED,
      events: [{ eventTypeConceptId: AUTHZ_GOVERNANCE.EVENT_USER_SUSPENDED }],
      usersAffected: 0,
    });
    await expect(
      service.suspend('u-1', { reason: 'Investigación en curso' }, ACTOR),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(tx.create).not.toHaveBeenCalled();
  });

  it('reactiva sólo lo que quedó suspendido por este servicio', async () => {
    const { service } = armar({
      status: CONCEPTS.USER_LOCKED,
      events: [{ eventTypeConceptId: AUTHZ_GOVERNANCE.EVENT_USER_SUSPENDED }],
    });
    const r = await service.reactivate('u-1', { reason: 'Volvió de su licencia' }, ACTOR);
    expect(r.state).toBe('ACTIVE');
  });

  it('una cuenta bloqueada por otra causa no se reactiva aquí (NOT_SUSPENDED)', async () => {
    const { service } = armar({ status: CONCEPTS.USER_LOCKED, events: [] });
    await expect(
      service.reactivate('u-1', { reason: 'Quiero que entre ya' }, ACTOR),
    ).rejects.toMatchObject({ reason: Reason.USER_LIFECYCLE_NOT_SUSPENDED });
  });

  it('una baja no se reactiva', async () => {
    const { service } = armar({
      status: CONCEPTS.USER_LOCKED,
      events: [{ eventTypeConceptId: AUTHZ_GOVERNANCE.EVENT_USER_OFFBOARDED }],
    });
    await expect(
      service.reactivate('u-1', { reason: 'Me arrepentí de la baja' }, ACTOR),
    ).rejects.toMatchObject({ reason: Reason.USER_LIFECYCLE_ALREADY_OFFBOARDED });
  });

  it('la baja bloquea, corta sesiones, revoca todos los roles activos y lo cuenta', async () => {
    const { service, tx } = armar({ revokedAssignments: 3 });
    const r = await service.offboard('u-1', { reason: 'Terminó su contrato' }, ACTOR);
    expect(r).toMatchObject({ state: 'OFFBOARDED', revokedAssignments: 3 });
    expect(tx.nativeUpdate).toHaveBeenCalledWith(
      UserRoleAssignments,
      { userId: 'u-1', statusConceptId: CONCEPTS.STATE_ACTIVE },
      expect.objectContaining({ statusConceptId: CONCEPTS.STATE_REVOKED }),
    );
  });

  it('dar de baja dos veces es 409', async () => {
    const { service } = armar({
      status: CONCEPTS.USER_LOCKED,
      events: [{ eventTypeConceptId: AUTHZ_GOVERNANCE.EVENT_USER_OFFBOARDED }],
    });
    await expect(
      service.offboard('u-1', { reason: 'Terminó su contrato' }, ACTOR),
    ).rejects.toMatchObject({ reason: Reason.USER_LIFECYCLE_ALREADY_OFFBOARDED });
  });

  it('una cuenta anonimizada no admite transiciones (422)', async () => {
    const { service } = armar({ status: CONCEPTS.USER_ANONYMIZED });
    await expect(
      service.suspend('u-1', { reason: 'Ya no debería importar' }, ACTOR),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });

  it('un usuario inexistente es 404 con su motivo', async () => {
    const { service } = armar({ status: null });
    await expect(
      service.suspend('u-1', { reason: 'No existe esa cuenta' }, ACTOR),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('el estado se lee del último evento: bloqueada sin eventos es LOCKED_OTHER', async () => {
    const { service } = armar({ status: CONCEPTS.USER_LOCKED, events: [] });
    const r = await service.lifecycleOf('u-1', ACTOR);
    expect(r.state).toBe('LOCKED_OTHER');
  });
});

/* ------------------------------------------------------------------------------------------------
 * Alcance de tenant y protección de SUPERADMIN.
 *
 * El doble de persistencia de abajo es una «base» en memoria que EVALÚA los criterios de cada
 * consulta (igualdad, `$in`, `$or`). Es deliberado: con mocks que devuelven lo mismo sin mirar el
 * filtro, quitar el `tenantId` del servicio no rompería ninguna prueba. Es un doble, no Postgres:
 * prueba que el servicio PIDE el filtro correcto, no que el SQL generado lo aplique.
 * ---------------------------------------------------------------------------------------------- */

type Row = Record<string, any>;

function matches(row: Row, where: Row): boolean {
  return Object.entries(where).every(([k, v]) => {
    if (k === '$or') return (v as Row[]).some((w) => matches(row, w));
    if (v === null) return row[k] === null || row[k] === undefined;
    if (v && typeof v === 'object' && !(v instanceof Date)) {
      const op = v as Record<string, unknown>;
      if ('$in' in op) return (op.$in as unknown[]).includes(row[k]);
      // SQL: `col <> x` no devuelve las filas con `col` nulo.
      if ('$ne' in op)
        return row[k] !== null && row[k] !== undefined && row[k] !== op.$ne;
    }
    return row[k] === v;
  });
}

const TA = '00000000-0000-4000-8000-0000000000a1';
const TB = '00000000-0000-4000-8000-0000000000b1';
const ACTIVE_MEMBERSHIP = DIR.MEMBERSHIP_ACTIVE;

/** Administrador de plataforma: rol global, sin ámbito de tenant. */
const PLATFORM = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;
const SUPER = { id: 'super-1', roles: ['SUPERADMIN'] } as any;
/** Administrador cuyo rol vale sólo en el tenant A. */
const SCOPED_A = {
  id: 'admin-a',
  roles: ['SECURITY_ADMIN'],
  scopedRoles: { [TA]: ['SECURITY_ADMIN'] },
  tenantIds: [TA],
} as any;

interface Db {
  users?: Row[];
  memberships?: Row[];
  assignments?: Row[];
  globalRoles?: Row[];
  roles?: Row[];
  events?: Row[];
}

function armarDb(db: Db) {
  const tables = new Map<unknown, Row[]>([
    [Users, db.users ?? []],
    [TenantMemberships, db.memberships ?? []],
    [UserRoleAssignments, db.assignments ?? []],
    [UserGlobalRoles, db.globalRoles ?? []],
    [Roles, db.roles ?? []],
    [SecurityEvents, db.events ?? []],
    [Sessions, []],
    [RefreshTokens, []],
  ]);
  const rows = (e: unknown) => tables.get(e) ?? [];
  const nativeUpdates: { entity: unknown; where: Row; data: Row }[] = [];
  const tx: any = {
    findOne: mockFn(
      async (e: unknown, where: Row) =>
        rows(e).find((r) => matches(r, where)) ?? null,
    ),
    find: mockFn(async (e: unknown, where: Row) =>
      rows(e).filter((r) => matches(r, where)),
    ),
    nativeUpdate: mockFn(async (e: unknown, where: Row, data: Row) => {
      nativeUpdates.push({ entity: e, where, data });
      const hit = rows(e).filter((r) => matches(r, where));
      hit.forEach((r) => Object.assign(r, data));
      return hit.length;
    }),
    create: mockFn((e: unknown, data: Row) => {
      rows(e).push(data);
      return data;
    }),
    flush: mockFn(async () => undefined),
  };
  const em: any = { ...tx, transactional: mockFn((cb: any) => cb(tx)) };
  const logger = { setContext: mockFn(), info: mockFn() };
  return {
    service: new AuthzUserLifecycleService(em, logger as never),
    tx,
    nativeUpdates,
    db,
  };
}

const usuario = (id: string, status: string = CONCEPTS.USER_ACTIVE): Row => ({
  id,
  statusConceptId: status,
});
const membresia = (
  userId: string,
  tenantId: string,
  status: string = ACTIVE_MEMBERSHIP,
): Row => ({
  userId,
  tenantId,
  statusConceptId: status,
});
const asignacion = (
  id: string,
  userId: string,
  tenantId?: string,
  roleId = 'role-x',
): Row => ({
  id,
  userId,
  roleId,
  tenantId,
  statusConceptId: CONCEPTS.STATE_ACTIVE,
});
const globalSuper = (userId: string): Row => ({
  userId,
  roleConceptId: CONCEPTS.ROLE_SUPERADMIN,
  stateConceptId: CONCEPTS.STATE_ACTIVE,
});
const REASON = { reason: 'Motivo de prueba suficiente' };

/** Corre `fn` como lo haría el interceptor: dentro del tenant del actor con alcance. */
const enTenant = <T>(tenantId: string, fn: () => T): T =>
  runWithTenant(tenantId, fn);

describe('resolveGovernanceScope', () => {
  it('actor de plataforma (rol global): sin alcance, aunque el request traiga un tenant', () => {
    expect(
      runWithTenant(TA, () => resolveGovernanceScope(PLATFORM)),
    ).toBeUndefined();
    expect(resolveGovernanceScope(SUPER)).toBeUndefined();
  });

  it('actor con alcance: el tenant del contexto verificado', () => {
    expect(enTenant(TA, () => resolveGovernanceScope(SCOPED_A))).toBe(TA);
  });

  it('un SUPERADMIN acotado a un tenant no es de plataforma', () => {
    const scopedSuper = {
      id: 's',
      roles: ['SUPERADMIN'],
      scopedRoles: { [TA]: ['SUPERADMIN'] },
    } as any;
    expect(enTenant(TA, () => resolveGovernanceScope(scopedSuper))).toBe(TA);
  });

  it('actor con alcance sin tenant en el contexto: falla cerrado, no cae a global', () => {
    expect(() => resolveGovernanceScope(SCOPED_A)).toThrow(
      PreconditionFailedException,
    );
  });

  it('actor sin ningún rol de gobierno y sin tenant: falla cerrado', () => {
    expect(() =>
      resolveGovernanceScope({ id: 'x', roles: ['USER'] } as any),
    ).toThrow(PreconditionFailedException);
  });
});

describe('AuthzUserLifecycleService · alcance de tenant (hallazgo ALTO 1)', () => {
  const escena = (): Db => ({
    users: [usuario('u-a'), usuario('u-b'), usuario('u-ambos')],
    memberships: [
      membresia('u-a', TA),
      membresia('u-b', TB),
      membresia('u-ambos', TA),
      membresia('u-ambos', TB),
    ],
    assignments: [
      asignacion('as-a', 'u-a', TA),
      asignacion('as-b', 'u-b', TB),
      asignacion('as-ambos-a', 'u-ambos', TA),
      asignacion('as-ambos-b', 'u-ambos', TB),
      asignacion('as-ambos-global', 'u-ambos', undefined),
    ],
  });

  const acciones: ['suspend' | 'reactivate' | 'offboard'][] = [
    ['suspend'],
    ['reactivate'],
    ['offboard'],
  ];

  it.each(acciones)(
    '%s: un actor con alcance sobre un usuario de OTRO tenant recibe el mismo 404 que si no existiera, y no se escribe nada',
    async (accion) => {
      const { service, nativeUpdates, tx } = armarDb(escena());
      const ajeno = await enTenant(TA, () =>
        service[accion]('u-b', REASON, SCOPED_A),
      ).catch((e) => e);
      const inexistente = await enTenant(TA, () =>
        service[accion]('u-nadie', REASON, SCOPED_A),
      ).catch((e) => e);
      expect(ajeno).toBeInstanceOf(ResourceNotFoundException);
      expect(ajeno).toMatchObject({
        reason: Reason.USER_LIFECYCLE_USER_NOT_FOUND,
      });
      // Indistinguible: mismo estado, mismo mensaje y mismo motivo (sólo cambia el id que el propio cliente envió).
      expect(inexistente).toBeInstanceOf(ResourceNotFoundException);
      expect(ajeno.getStatus()).toBe(inexistente.getStatus());
      expect(ajeno.message).toBe(inexistente.message);
      expect(ajeno.reason ?? ajeno.getResponse?.()?.reason).toBe(
        inexistente.reason ?? inexistente.getResponse?.()?.reason,
      );
      expect(nativeUpdates).toHaveLength(0);
      expect(tx.create).not.toHaveBeenCalled();
    },
  );

  it('lifecycleOf: un usuario de otro tenant es 404 y no revela su estado ni su historial', async () => {
    const d = escena();
    d.events = [
      {
        id: 'ev',
        userId: 'u-b',
        eventTypeConceptId: AUTHZ_GOVERNANCE.EVENT_USER_SUSPENDED,
        recordedAt: new Date(0),
      },
    ];
    const { service } = armarDb(d);
    await expect(
      enTenant(TA, () => service.lifecycleOf('u-b', SCOPED_A)),
    ).rejects.toMatchObject({
      reason: Reason.USER_LIFECYCLE_USER_NOT_FOUND,
    });
    await expect(
      enTenant(TA, () => service.lifecycleOf('u-a', SCOPED_A)),
    ).resolves.toMatchObject({ state: 'ACTIVE' });
  });

  it('un usuario sin membresía activa en el tenant (membresía inactiva) tampoco es alcanzable', async () => {
    const d = escena();
    d.memberships = [membresia('u-a', TA, CONCEPTS.STATE_REVOKED)];
    d.assignments = [];
    const { service } = armarDb(d);
    await expect(
      enTenant(TA, () => service.suspend('u-a', REASON, SCOPED_A)),
    ).rejects.toMatchObject({
      reason: Reason.USER_LIFECYCLE_USER_NOT_FOUND,
    });
  });

  it('un usuario del propio tenant sí se suspende', async () => {
    const { service, db } = armarDb(escena());
    const r = await enTenant(TA, () =>
      service.suspend('u-a', REASON, SCOPED_A),
    );
    expect(r).toMatchObject({ userId: 'u-a', state: 'SUSPENDED' });
    expect(db.users!.find((u) => u.id === 'u-a')!.statusConceptId).toBe(
      CONCEPTS.USER_LOCKED,
    );
  });

  it('la baja con alcance de una cuenta que vive sólo en su tenant revoca sus asignaciones, y el UPDATE lleva el tenant', async () => {
    const { service, db, nativeUpdates } = armarDb(escena());
    const r = await enTenant(TA, () =>
      service.offboard('u-a', REASON, SCOPED_A),
    );
    expect(r).toMatchObject({
      state: 'OFFBOARDED',
      revokedAssignments: 1,
      note: OFFBOARD_SCOPED_NOTE,
    });
    expect(db.assignments!.find((a) => a.id === 'as-a')!.statusConceptId).toBe(
      CONCEPTS.STATE_REVOKED,
    );
    const revocacion = nativeUpdates.find(
      (u) => u.entity === UserRoleAssignments,
    )!;
    expect(revocacion.where).toMatchObject({ userId: 'u-a', tenantId: TA });
  });

  it('la baja de un actor de plataforma revoca TODAS las asignaciones activas, de cualquier tenant', async () => {
    const { service, db } = armarDb(escena());
    const r = await service.offboard('u-ambos', REASON, PLATFORM);
    expect(r).toMatchObject({ revokedAssignments: 3, note: OFFBOARD_NOTE });
    expect(
      db
        .assignments!.filter((a) => a.userId === 'u-ambos')
        .every((a) => a.statusConceptId === CONCEPTS.STATE_REVOKED),
    ).toBe(true);
    expect(db.assignments!.find((a) => a.id === 'as-b')!.statusConceptId).toBe(
      CONCEPTS.STATE_ACTIVE,
    );
  });

  it('un actor de plataforma alcanza usuarios de cualquier tenant', async () => {
    const { service } = armarDb(escena());
    await expect(
      service.suspend('u-b', REASON, PLATFORM),
    ).resolves.toMatchObject({ state: 'SUSPENDED' });
  });

  it('un actor con alcance sin tenant en el contexto no opera (falla cerrado) y no escribe', async () => {
    const { service, nativeUpdates } = armarDb(escena());
    await expect(
      service.suspend('u-a', REASON, SCOPED_A),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
    expect(nativeUpdates).toHaveLength(0);
  });
});

describe('AuthzUserLifecycleService · sólo SUPERADMIN actúa sobre SUPERADMIN (hallazgo ALTO 1)', () => {
  const escena = (): Db => ({
    users: [
      usuario('u-super'),
      usuario('u-super-authz'),
      usuario('u-normal'),
      usuario('super-1'),
    ],
    memberships: [
      membresia('u-super', TA),
      membresia('u-super-authz', TA),
      membresia('u-normal', TA),
      membresia('super-1', TA),
    ],
    globalRoles: [globalSuper('u-super'), globalSuper('super-1')],
    roles: [
      {
        id: 'role-super',
        code: 'SUPERADMIN',
        stateConceptId: CONCEPTS.STATE_ACTIVE,
      },
    ],
    assignments: [
      asignacion('as-super', 'u-super-authz', TA, 'role-super'),
      asignacion('as-n', 'u-normal', TA),
    ],
  });
  const acciones: ['suspend' | 'reactivate' | 'offboard'][] = [
    ['suspend'],
    ['reactivate'],
    ['offboard'],
  ];

  it.each(acciones)(
    '%s: un administrador con alcance sobre un SUPERADMIN (rol global) de su propio tenant es 403 y no escribe',
    async (accion) => {
      const { service, nativeUpdates, tx } = armarDb(escena());
      await expect(
        enTenant(TA, () => service[accion]('u-super', REASON, SCOPED_A)),
      ).rejects.toMatchObject({
        reason: Reason.GOVERNANCE_TARGET_REQUIRES_SUPERADMIN,
      });
      expect(nativeUpdates).toHaveLength(0);
      expect(tx.create).not.toHaveBeenCalled();
    },
  );

  it.each(acciones)(
    '%s: un administrador de plataforma (no SUPERADMIN) sobre un SUPERADMIN es 403',
    async (accion) => {
      const { service, nativeUpdates } = armarDb(escena());
      await expect(
        service[accion]('u-super', REASON, PLATFORM),
      ).rejects.toMatchObject({
        reason: Reason.GOVERNANCE_TARGET_REQUIRES_SUPERADMIN,
      });
      expect(nativeUpdates).toHaveLength(0);
    },
  );

  it('también cuenta el SUPERADMIN que viene de una asignación de authz, no sólo el global de iam', async () => {
    const { service, nativeUpdates } = armarDb(escena());
    await expect(
      service.offboard('u-super-authz', REASON, PLATFORM),
    ).rejects.toMatchObject({
      reason: Reason.GOVERNANCE_TARGET_REQUIRES_SUPERADMIN,
    });
    expect(nativeUpdates).toHaveLength(0);
  });

  it('un SUPERADMIN sí puede suspender a otro SUPERADMIN (y no a sí mismo: eso ya estaba prohibido)', async () => {
    const { service } = armarDb(escena());
    await expect(
      service.suspend('u-super', REASON, SUPER),
    ).resolves.toMatchObject({ state: 'SUSPENDED' });
    await expect(
      service.suspend('super-1', REASON, SUPER),
    ).rejects.toMatchObject({
      reason: Reason.USER_LIFECYCLE_SELF_ACTION,
    });
  });

  it('un usuario común no se ve afectado por la protección', async () => {
    const { service } = armarDb(escena());
    await expect(
      enTenant(TA, () => service.suspend('u-normal', REASON, SCOPED_A)),
    ).resolves.toMatchObject({
      state: 'SUSPENDED',
    });
  });

  it('un SUPERADMIN acotado a un tenant no es comodín: no puede actuar sobre otro SUPERADMIN', async () => {
    const scopedSuper = {
      id: 'ss',
      roles: ['SUPERADMIN'],
      scopedRoles: { [TA]: ['SUPERADMIN'] },
      tenantIds: [TA],
    } as any;
    const { service } = armarDb(escena());
    await expect(
      enTenant(TA, () => service.suspend('u-super', REASON, scopedSuper)),
    ).rejects.toMatchObject({
      reason: Reason.GOVERNANCE_TARGET_REQUIRES_SUPERADMIN,
    });
  });
});

describe('AuthzUserLifecycleService · cuentas de varios tenants (409 USER_LIFECYCLE_MULTI_TENANT)', () => {
  const acciones: ['suspend' | 'reactivate' | 'offboard'][] = [
    ['suspend'],
    ['reactivate'],
    ['offboard'],
  ];
  const escena = (): Db => ({
    users: [
      usuario('u-solo'),
      usuario('u-memb-b'),
      usuario('u-asig-b'),
      usuario('u-asig-global'),
      usuario('u-memb-b-inactiva'),
    ],
    memberships: [
      membresia('u-solo', TA),
      membresia('u-memb-b', TA),
      membresia('u-memb-b', TB),
      membresia('u-asig-b', TA),
      membresia('u-asig-global', TA),
      membresia('u-memb-b-inactiva', TA),
      membresia('u-memb-b-inactiva', TB, CONCEPTS.STATE_REVOKED),
    ],
    assignments: [
      asignacion('as-solo', 'u-solo', TA),
      asignacion('as-asig-b', 'u-asig-b', TB),
      asignacion('as-asig-global', 'u-asig-global', undefined),
    ],
  });

  it.each(acciones)(
    '%s: con alcance, una cuenta con membresía activa en otro tenant es 409 y no escribe',
    async (accion) => {
      const { service, nativeUpdates, tx } = armarDb(escena());
      await expect(
        enTenant(TA, () => service[accion]('u-memb-b', REASON, SCOPED_A)),
      ).rejects.toMatchObject({ reason: Reason.USER_LIFECYCLE_MULTI_TENANT });
      await expect(
        enTenant(TA, () => service[accion]('u-memb-b', REASON, SCOPED_A)),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(nativeUpdates).toHaveLength(0);
      expect(tx.create).not.toHaveBeenCalled();
    },
  );

  it.each(['u-asig-b', 'u-asig-global'])(
    'con alcance, %s (asignación activa en otro tenant o global) también es 409',
    async (id) => {
      const { service, nativeUpdates } = armarDb(escena());
      await expect(
        enTenant(TA, () => service.suspend(id, REASON, SCOPED_A)),
      ).rejects.toMatchObject({ reason: Reason.USER_LIFECYCLE_MULTI_TENANT });
      expect(nativeUpdates).toHaveLength(0);
    },
  );

  it('una membresía INACTIVA en otro tenant no cuenta: la cuenta se suspende', async () => {
    const { service } = armarDb(escena());
    await expect(
      enTenant(TA, () =>
        service.suspend('u-memb-b-inactiva', REASON, SCOPED_A),
      ),
    ).resolves.toMatchObject({ state: 'SUSPENDED' });
  });

  it('una cuenta que vive sólo en su tenant sí se suspende', async () => {
    const { service } = armarDb(escena());
    await expect(
      enTenant(TA, () => service.suspend('u-solo', REASON, SCOPED_A)),
    ).resolves.toMatchObject({ state: 'SUSPENDED' });
  });

  it.each(acciones)(
    '%s: un administrador de plataforma sí actúa sobre una cuenta de varios tenants (la regla no lo toca)',
    async (accion) => {
      const d = escena();
      if (accion === 'reactivate') {
        d.users!.find((u) => u.id === 'u-memb-b')!.statusConceptId =
          CONCEPTS.USER_LOCKED;
        d.events = [
          {
            id: 'e1',
            userId: 'u-memb-b',
            eventTypeConceptId: AUTHZ_GOVERNANCE.EVENT_USER_SUSPENDED,
            recordedAt: new Date(0),
          },
        ];
      }
      const { service } = armarDb(d);
      await expect(
        service[accion]('u-memb-b', REASON, PLATFORM),
      ).resolves.toBeDefined();
    },
  );
});

describe('AuthzUserLifecycleService · administrador de plataforma como objetivo', () => {
  const acciones: ['suspend' | 'reactivate' | 'offboard'][] = [
    ['suspend'],
    ['reactivate'],
    ['offboard'],
  ];
  const escena = (): Db => ({
    users: [
      usuario('u-padmin'),
      usuario('u-padmin-b'),
      usuario('u-padmin-authz'),
      usuario('u-peer'),
    ],
    memberships: [
      membresia('u-padmin', TA),
      membresia('u-padmin-b', TA),
      membresia('u-padmin-b', TB),
      membresia('u-padmin-authz', TA),
      membresia('u-peer', TA),
    ],
    globalRoles: [
      {
        userId: 'u-padmin',
        roleConceptId: CONCEPTS.ROLE_SECURITY_ADMIN,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
      },
      {
        userId: 'u-padmin-b',
        roleConceptId: CONCEPTS.ROLE_SECURITY_ADMIN,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
      },
    ],
    roles: [
      {
        id: 'role-sec',
        code: 'SECURITY_ADMIN',
        stateConceptId: CONCEPTS.STATE_ACTIVE,
      },
    ],
    assignments: [
      asignacion('as-pa', 'u-padmin-authz', undefined, 'role-sec'),
      asignacion('as-peer', 'u-peer', TA, 'role-sec'),
    ],
  });

  it.each(acciones)(
    '%s: un administrador con alcance sobre un SECURITY_ADMIN global es 403 y no escribe',
    async (accion) => {
      const { service, nativeUpdates } = armarDb(escena());
      await expect(
        enTenant(TA, () => service[accion]('u-padmin', REASON, SCOPED_A)),
      ).rejects.toMatchObject({
        reason: Reason.GOVERNANCE_TARGET_REQUIRES_PLATFORM,
      });
      expect(nativeUpdates).toHaveLength(0);
    },
  );

  it('también cuenta el SECURITY_ADMIN que viene de una asignación de authz SIN tenant', async () => {
    const { service } = armarDb(escena());
    await expect(
      enTenant(TA, () => service.suspend('u-padmin-authz', REASON, SCOPED_A)),
    ).rejects.toMatchObject({
      reason: Reason.GOVERNANCE_TARGET_REQUIRES_PLATFORM,
    });
  });

  it('el 403 va antes que el 409: no se revela nada de las otras organizaciones de un administrador de plataforma', async () => {
    const { service } = armarDb(escena());
    await expect(
      enTenant(TA, () => service.suspend('u-padmin-b', REASON, SCOPED_A)),
    ).rejects.toMatchObject({
      reason: Reason.GOVERNANCE_TARGET_REQUIRES_PLATFORM,
    });
  });

  it('un SECURITY_ADMIN acotado al propio tenant (par) no es de plataforma: se puede suspender', async () => {
    const { service } = armarDb(escena());
    await expect(
      enTenant(TA, () => service.suspend('u-peer', REASON, SCOPED_A)),
    ).resolves.toMatchObject({ state: 'SUSPENDED' });
  });

  it('un administrador de plataforma sí actúa sobre otro administrador de plataforma', async () => {
    const { service } = armarDb(escena());
    await expect(
      service.suspend('u-padmin', REASON, PLATFORM),
    ).resolves.toMatchObject({ state: 'SUSPENDED' });
  });
});

describe('AuthzUserLifecycleService · historial con alcance', () => {
  const evento = (
    id: string,
    kind: string,
    tenantId: string | null | undefined,
    at: string,
  ): Row => ({
    id,
    userId: 'u-a',
    eventTypeConceptId: kind,
    detailJson: {
      reason: `motivo ${id}`,
      ...(tenantId === undefined ? {} : { tenantId }),
    },
    recordedAt: new Date(at),
    recordedByUserId: 'x',
  });
  const escena = (): Db => ({
    users: [usuario('u-a', CONCEPTS.USER_LOCKED)],
    memberships: [membresia('u-a', TA)],
    events: [
      evento(
        'ev-viejo-A',
        AUTHZ_GOVERNANCE.EVENT_USER_SUSPENDED,
        TA,
        '2026-01-01T00:00:00Z',
      ),
      evento(
        'ev-B',
        AUTHZ_GOVERNANCE.EVENT_USER_REACTIVATED,
        TB,
        '2026-02-01T00:00:00Z',
      ),
      evento(
        'ev-sin-sello',
        AUTHZ_GOVERNANCE.EVENT_USER_SUSPENDED,
        undefined,
        '2026-03-01T00:00:00Z',
      ),
      evento(
        'ev-plataforma',
        AUTHZ_GOVERNANCE.EVENT_USER_SUSPENDED,
        null,
        '2026-04-01T00:00:00Z',
      ),
    ],
  });
  // El doble de `find` no ordena: el servicio espera «más reciente primero».
  const desc = (d: Db): Db => ({
    ...d,
    events: [...d.events!].sort((a, b) => b.recordedAt - a.recordedAt),
  });

  it('con alcance, sólo se ven los eventos sellados con su tenant (ni los de otro, ni los sin sello, ni los de plataforma)', async () => {
    const { service } = armarDb(desc(escena()));
    const r = await enTenant(TA, () => service.lifecycleOf('u-a', SCOPED_A));
    expect(r.history.map((h) => h.id)).toEqual(['ev-viejo-A']);
    expect(JSON.stringify(r)).not.toContain('motivo ev-B');
    expect(JSON.stringify(r)).not.toContain('motivo ev-plataforma');
  });

  it('el estado de la cuenta sigue saliendo del último evento real, aunque no sea visible para el actor', async () => {
    const { service } = armarDb(desc(escena()));
    const r = await enTenant(TA, () => service.lifecycleOf('u-a', SCOPED_A));
    expect(r.state).toBe('SUSPENDED');
  });

  it('un actor de plataforma ve todo el historial', async () => {
    const { service } = armarDb(desc(escena()));
    const r = await service.lifecycleOf('u-a', PLATFORM);
    expect(r.history).toHaveLength(4);
  });

  it('cada acción sella el tenant de quien la hizo (null si fue la plataforma)', async () => {
    const con = armarDb({
      users: [usuario('u-a')],
      memberships: [membresia('u-a', TA)],
    });
    await enTenant(TA, () => con.service.suspend('u-a', REASON, SCOPED_A));
    expect(con.tx.create).toHaveBeenCalledWith(
      SecurityEvents,
      expect.objectContaining({
        detailJson: expect.objectContaining({ tenantId: TA }),
      }),
      { partial: true },
    );
    const sin = armarDb({
      users: [usuario('u-a')],
      memberships: [membresia('u-a', TA)],
    });
    await sin.service.suspend('u-a', REASON, PLATFORM);
    expect(sin.tx.create).toHaveBeenCalledWith(
      SecurityEvents,
      expect.objectContaining({
        detailJson: expect.objectContaining({ tenantId: null }),
      }),
      { partial: true },
    );
  });
});
