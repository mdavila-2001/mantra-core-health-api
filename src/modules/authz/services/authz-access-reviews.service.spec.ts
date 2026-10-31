import { jest } from '@jest/globals';
import { CONCEPTS, PreconditionFailedException } from '../../../common';
import { runWithTenant } from '../../../common/tenant/tenant-context';
import { DIR } from '../../directory/directory.concepts';
import { TenantMemberships } from '../../directory/entities';
import { SecurityEvents, UserGlobalRoles, Users } from '../../iam/entities';
import { AUTHZ_GOVERNANCE } from '../authz-governance.concepts';
import { AuthzGovernanceErrorReason as Reason } from '../authz-governance.error-reasons';
import { Roles, UserRoleAssignments } from '../entities';
import { AuthzAccessReviewsService } from './authz-access-reviews.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
const ACTOR = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function armar(opts: { user?: boolean; matching?: number } = {}) {
  const tx: any = {
    findOne: mockFn(async (e: unknown) => (e === Users && opts.user !== false ? { id: 'u-1' } : null)),
    count: mockFn(async () => opts.matching ?? 0),
    create: mockFn((_e: unknown, d: any) => ({ id: 'ev-1', ...d })),
    flush: mockFn(async () => undefined),
  };
  const em: any = { ...tx, transactional: mockFn((cb: any) => cb(tx)) };
  return { service: new AuthzAccessReviewsService(em), tx };
}

describe('AuthzAccessReviewsService', () => {
  it('registra quién revisó, qué asignaciones, la decisión y el motivo', async () => {
    const id = '00000000-0000-4000-8000-000000000001';
    const { service, tx } = armar({ matching: 1 });
    const r = await service.record(
      'u-1',
      { decision: 'CERTIFIED', reason: 'Sus roles siguen vigentes', assignmentIds: [id, id] },
      ACTOR,
    );
    expect(r).toMatchObject({ decision: 'CERTIFIED', reviewerUserId: 'admin-1', assignmentIds: [id] });
    expect(tx.count).toHaveBeenCalledWith(UserRoleAssignments, {
      id: { $in: [id] },
      userId: 'u-1',
      statusConceptId: CONCEPTS.STATE_ACTIVE,
    });
    expect(tx.create).toHaveBeenCalledWith(
      SecurityEvents,
      expect.objectContaining({ eventTypeConceptId: AUTHZ_GOVERNANCE.EVENT_ACCESS_REVIEWED }),
      { partial: true },
    );
  });

  it('nadie revisa sus propios accesos', async () => {
    const { service, tx } = armar();
    await expect(
      service.record('admin-1', { decision: 'CERTIFIED', reason: 'Yo me apruebo', assignmentIds: [] }, ACTOR),
    ).rejects.toMatchObject({ reason: Reason.ACCESS_REVIEW_SELF_REVIEW });
    expect(tx.create).not.toHaveBeenCalled();
  });

  it('una asignación ajena o ya revocada rechaza la revisión entera', async () => {
    const { service, tx } = armar({ matching: 0 });
    await expect(
      service.record(
        'u-1',
        { decision: 'CERTIFIED', reason: 'Citó una asignación ajena', assignmentIds: ['00000000-0000-4000-8000-000000000002'] },
        ACTOR,
      ),
    ).rejects.toMatchObject({ reason: Reason.ACCESS_REVIEW_ASSIGNMENT_MISMATCH });
    expect(tx.create).not.toHaveBeenCalled();
  });

  it('un usuario inexistente es 404', async () => {
    const { service } = armar({ user: false });
    await expect(
      service.record('u-1', { decision: 'CERTIFIED', reason: 'No existe ese usuario', assignmentIds: [] }, ACTOR),
    ).rejects.toMatchObject({ reason: Reason.ACCESS_REVIEW_USER_NOT_FOUND });
  });
});

/* ------------------------------------------------------------------------------------------------
 * Alcance de tenant y protección de SUPERADMIN (hallazgo MEDIO 3 y la parte de revisión del ALTO 1).
 * Doble de persistencia en memoria que EVALÚA los criterios de cada consulta: no es Postgres, prueba
 * que el servicio PIDE el filtro correcto. Si se quita un filtro del servicio, estas pruebas fallan.
 * ---------------------------------------------------------------------------------------------- */

type Row = Record<string, any>;

function matches(row: Row, where: Row): boolean {
  return Object.entries(where).every(([k, v]) => {
    if (k === '$or') return (v as Row[]).some((w) => matches(row, w));
    if (v === null) return row[k] === null || row[k] === undefined;
    if (v && typeof v === 'object' && !(v instanceof Date) && '$in' in v)
      return (v as { $in: unknown[] }).$in.includes(row[k]);
    return row[k] === v;
  });
}

const TA = '00000000-0000-4000-8000-0000000000a1';
const TB = '00000000-0000-4000-8000-0000000000b1';
const PLATFORM = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;
const SUPER = { id: 'super-1', roles: ['SUPERADMIN'] } as any;
const SCOPED_A = {
  id: 'admin-a',
  roles: ['SECURITY_ADMIN'],
  scopedRoles: { [TA]: ['SECURITY_ADMIN'] },
  tenantIds: [TA],
} as any;
const enTenant = <T>(tenantId: string, fn: () => T): T =>
  runWithTenant(tenantId, fn);

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
  ]);
  const rows = (e: unknown) => tables.get(e) ?? [];
  const tx: any = {
    findOne: mockFn(
      async (e: unknown, w: Row) => rows(e).find((r) => matches(r, w)) ?? null,
    ),
    find: mockFn(async (e: unknown, w: Row, o?: Row) => {
      const hit = rows(e).filter((r) => matches(r, w));
      // Honra `orderBy: { recordedAt: 'DESC' }`: «la última revisión» depende del orden.
      if (o?.orderBy?.recordedAt === 'DESC')
        hit.sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime());
      return hit;
    }),
    count: mockFn(
      async (e: unknown, w: Row) => rows(e).filter((r) => matches(r, w)).length,
    ),
    create: mockFn((e: unknown, d: Row) => {
      const row = { id: 'ev-nuevo', ...d };
      rows(e).push(row);
      return row;
    }),
    flush: mockFn(async () => undefined),
  };
  const em: any = { ...tx, transactional: mockFn((cb: any) => cb(tx)) };
  return { service: new AuthzAccessReviewsService(em), tx };
}

const usuario = (id: string, displayName = id): Row => ({
  id,
  displayName,
  statusConceptId: CONCEPTS.USER_ACTIVE,
});
const membresia = (userId: string, tenantId: string): Row => ({
  userId,
  tenantId,
  statusConceptId: DIR.MEMBERSHIP_ACTIVE,
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
const revision = (
  userId: string,
  recordedAt: string,
  tenantId: string | null | undefined,
): Row => ({
  id: `rev-${userId}-${recordedAt}`,
  userId,
  eventTypeConceptId: AUTHZ_GOVERNANCE.EVENT_ACCESS_REVIEWED,
  detailJson: {
    decision: 'CERTIFIED',
    reason: 'ok',
    assignmentIds: [],
    ...(tenantId === undefined ? {} : { tenantId }),
  },
  recordedAt: new Date(recordedAt),
  recordedByUserId: 'rev-1',
});
const globalSuper = (userId: string): Row => ({
  userId,
  roleConceptId: CONCEPTS.ROLE_SUPERADMIN,
  stateConceptId: CONCEPTS.STATE_ACTIVE,
});
const REVIEW = {
  decision: 'CERTIFIED' as const,
  reason: 'Sus roles siguen vigentes',
  assignmentIds: [] as string[],
};

const escena = (): Db => ({
  users: [
    usuario('u-a', 'Ana'),
    usuario('u-b', 'Beto'),
    usuario('u-ambos', 'Carla'),
    usuario('u-super', 'Zoe'),
  ],
  memberships: [
    membresia('u-a', TA),
    membresia('u-b', TB),
    membresia('u-ambos', TA),
    membresia('u-ambos', TB),
    membresia('u-super', TA),
  ],
  assignments: [
    asignacion('as-a', 'u-a', TA),
    asignacion('as-b', 'u-b', TB),
    asignacion('as-ambos-a', 'u-ambos', TA),
    asignacion('as-ambos-b', 'u-ambos', TB),
    asignacion('as-ambos-global', 'u-ambos', undefined),
    asignacion('as-super', 'u-super', TA),
  ],
  globalRoles: [globalSuper('u-super')],
  events: [
    revision('u-ambos', '2026-03-01T00:00:00Z', TA),
    revision('u-ambos', '2026-05-01T00:00:00Z', TB),
    revision('u-ambos', '2026-06-01T00:00:00Z', null),
    revision('u-ambos', '2026-07-01T00:00:00Z', undefined),
    revision('u-b', '2026-04-01T00:00:00Z', TB),
  ],
});

describe('AuthzAccessReviewsService.record · alcance y SUPERADMIN', () => {
  it('con alcance, un usuario de OTRO tenant da el mismo 404 que uno inexistente y no se registra nada', async () => {
    const { service, tx } = armarDb(escena());
    const ajeno = await enTenant(TA, () =>
      service.record('u-b', REVIEW, SCOPED_A),
    ).catch((e) => e);
    const inexistente = await enTenant(TA, () =>
      service.record('u-nadie', REVIEW, SCOPED_A),
    ).catch((e) => e);
    expect(ajeno).toMatchObject({
      reason: Reason.ACCESS_REVIEW_USER_NOT_FOUND,
    });
    expect(ajeno.getStatus()).toBe(inexistente.getStatus());
    expect(ajeno.message).toBe(inexistente.message);
    expect(tx.create).not.toHaveBeenCalled();
  });

  it('con alcance, citar una asignación de otro tenant de un usuario propio rechaza la revisión entera', async () => {
    const { service, tx } = armarDb(escena());
    await expect(
      enTenant(TA, () =>
        service.record(
          'u-ambos',
          { ...REVIEW, assignmentIds: ['as-ambos-a', 'as-ambos-b'] },
          SCOPED_A,
        ),
      ),
    ).rejects.toMatchObject({
      reason: Reason.ACCESS_REVIEW_ASSIGNMENT_MISMATCH,
    });
    expect(tx.create).not.toHaveBeenCalled();
    expect(tx.count).toHaveBeenCalledWith(
      UserRoleAssignments,
      expect.objectContaining({ tenantId: TA }),
    );
  });

  it('con alcance, la revisión de un usuario propio se registra sellada con su tenant', async () => {
    const { service, tx } = armarDb(escena());
    const r = await enTenant(TA, () =>
      service.record(
        'u-ambos',
        { ...REVIEW, assignmentIds: ['as-ambos-a'] },
        SCOPED_A,
      ),
    );
    expect(r.reviewerUserId).toBe('admin-a');
    expect(tx.create).toHaveBeenCalledWith(
      SecurityEvents,
      expect.objectContaining({
        detailJson: expect.objectContaining({ tenantId: TA }),
      }),
      { partial: true },
    );
  });

  it('un actor de plataforma revisa a cualquier usuario y puede citar asignaciones de cualquier tenant', async () => {
    const { service } = armarDb(escena());
    await expect(
      service.record(
        'u-ambos',
        { ...REVIEW, assignmentIds: ['as-ambos-a', 'as-ambos-b'] },
        PLATFORM,
      ),
    ).resolves.toMatchObject({ decision: 'CERTIFIED' });
  });

  it('con alcance y sin tenant en el contexto falla cerrado', async () => {
    const { service, tx } = armarDb(escena());
    await expect(
      service.record('u-a', REVIEW, SCOPED_A),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
    expect(tx.create).not.toHaveBeenCalled();
  });

  it('un administrador con alcance no revisa a un SUPERADMIN de su tenant: 403 y no se registra nada', async () => {
    const { service, tx } = armarDb(escena());
    await expect(
      enTenant(TA, () => service.record('u-super', REVIEW, SCOPED_A)),
    ).rejects.toMatchObject({
      reason: Reason.GOVERNANCE_TARGET_REQUIRES_SUPERADMIN,
    });
    expect(tx.create).not.toHaveBeenCalled();
  });

  it('un administrador de plataforma (no SUPERADMIN) tampoco revisa a un SUPERADMIN', async () => {
    const { service, tx } = armarDb(escena());
    await expect(
      service.record('u-super', REVIEW, PLATFORM),
    ).rejects.toMatchObject({
      reason: Reason.GOVERNANCE_TARGET_REQUIRES_SUPERADMIN,
    });
    expect(tx.create).not.toHaveBeenCalled();
  });

  it('un SUPERADMIN sí revisa a otro SUPERADMIN', async () => {
    const { service } = armarDb(escena());
    await expect(
      service.record('u-super', REVIEW, SUPER),
    ).resolves.toMatchObject({ decision: 'CERTIFIED' });
  });
});

describe('AuthzAccessReviewsService.historyOf · alcance', () => {
  it('con alcance, el historial de un usuario de otro tenant es 404', async () => {
    const { service } = armarDb(escena());
    await expect(
      enTenant(TA, () => service.historyOf('u-b', SCOPED_A)),
    ).rejects.toMatchObject({
      reason: Reason.ACCESS_REVIEW_USER_NOT_FOUND,
    });
  });

  it('con alcance, sólo se ven las revisiones selladas con su tenant (ni las de otro tenant ni las sin sello)', async () => {
    const { service } = armarDb(escena());
    const h = await enTenant(TA, () => service.historyOf('u-ambos', SCOPED_A));
    expect(h.items.map((i) => i.reviewedAt.toISOString())).toEqual([
      '2026-03-01T00:00:00.000Z',
    ]);
  });

  it('un actor de plataforma ve todas', async () => {
    const { service } = armarDb(escena());
    const h = await service.historyOf('u-ambos', PLATFORM);
    expect(h.items).toHaveLength(4);
  });
});

describe('AuthzAccessReviewsService.due · alcance y SUPERADMIN (hallazgo MEDIO 3)', () => {
  it('con alcance, la cola sólo trae a quienes tienen asignaciones activas EN SU tenant, contadas sólo en su tenant', async () => {
    const { service } = armarDb(escena());
    const due = await enTenant(TA, () => service.due(SCOPED_A));
    const ids = due.items.map((i) => i.userId).sort();
    expect(ids).toEqual(['u-a', 'u-ambos']);
    expect(
      due.items.find((i) => i.userId === 'u-ambos')!.activeAssignments,
    ).toBe(1);
    expect(due.items.some((i) => i.userId === 'u-b')).toBe(false);
  });

  it('con alcance, «última revisión» sólo cuenta revisiones selladas con su tenant', async () => {
    const { service } = armarDb(escena());
    const due = await enTenant(TA, () => service.due(SCOPED_A));
    expect(
      due.items.find((i) => i.userId === 'u-ambos')!.lastReviewedAt,
    ).toEqual(new Date('2026-03-01T00:00:00Z'));
    expect(
      due.items.find((i) => i.userId === 'u-a')!.lastReviewedAt,
    ).toBeNull();
  });

  it('con alcance, `olderThanDays` no reintroduce a nadie de otro tenant', async () => {
    const { service } = armarDb(escena());
    const due = await enTenant(TA, () => service.due(SCOPED_A, 30));
    expect(due.items.map((i) => i.userId).sort()).toEqual(['u-a', 'u-ambos']);
  });

  it('con alcance y sin tenant en el contexto falla cerrado, sin consultar', async () => {
    const { service, tx } = armarDb(escena());
    await expect(service.due(SCOPED_A)).rejects.toBeInstanceOf(
      PreconditionFailedException,
    );
    expect(tx.find).not.toHaveBeenCalled();
  });

  it('un administrador con alcance no ve a un SUPERADMIN en su cola', async () => {
    const { service } = armarDb(escena());
    const due = await enTenant(TA, () => service.due(SCOPED_A));
    expect(due.items.some((i) => i.userId === 'u-super')).toBe(false);
  });

  it('un administrador de plataforma (no SUPERADMIN) ve la cola global sin los SUPERADMIN', async () => {
    const { service } = armarDb(escena());
    const due = await service.due(PLATFORM);
    expect(due.items.map((i) => i.userId).sort()).toEqual([
      'u-a',
      'u-ambos',
      'u-b',
    ]);
  });

  it('un SUPERADMIN ve la cola global completa, con la última revisión de cualquier tenant', async () => {
    const { service } = armarDb(escena());
    const due = await service.due(SUPER);
    expect(due.items.map((i) => i.userId).sort()).toEqual([
      'u-a',
      'u-ambos',
      'u-b',
      'u-super',
    ]);
    expect(
      due.items.find((i) => i.userId === 'u-ambos')!.activeAssignments,
    ).toBe(3);
    expect(
      due.items.find((i) => i.userId === 'u-ambos')!.lastReviewedAt,
    ).toEqual(new Date('2026-07-01T00:00:00Z'));
  });
});

describe('AuthzAccessReviewsService · administrador de plataforma como objetivo (con alcance)', () => {
  const conPadmin = (): Db => {
    const d = escena();
    d.users!.push(usuario('u-padmin', 'Yara'));
    d.memberships!.push(membresia('u-padmin', TA));
    d.assignments!.push(asignacion('as-padmin', 'u-padmin', TA));
    d.globalRoles!.push({
      userId: 'u-padmin',
      roleConceptId: CONCEPTS.ROLE_SECURITY_ADMIN,
      stateConceptId: CONCEPTS.STATE_ACTIVE,
    });
    return d;
  };

  it('record: un administrador con alcance no revisa a un SECURITY_ADMIN global: 403 y no se registra nada', async () => {
    const { service, tx } = armarDb(conPadmin());
    await expect(
      enTenant(TA, () => service.record('u-padmin', REVIEW, SCOPED_A)),
    ).rejects.toMatchObject({
      reason: Reason.GOVERNANCE_TARGET_REQUIRES_PLATFORM,
    });
    expect(tx.create).not.toHaveBeenCalled();
  });

  it('record: un administrador de plataforma sí lo revisa', async () => {
    const { service } = armarDb(conPadmin());
    await expect(
      service.record('u-padmin', REVIEW, PLATFORM),
    ).resolves.toMatchObject({ decision: 'CERTIFIED' });
  });

  it('due: con alcance no se ofrece en la cola; la plataforma sí lo ve', async () => {
    const { service } = armarDb(conPadmin());
    const scoped = await enTenant(TA, () => service.due(SCOPED_A));
    expect(scoped.items.some((i) => i.userId === 'u-padmin')).toBe(false);
    const plat = await service.due(PLATFORM);
    expect(plat.items.some((i) => i.userId === 'u-padmin')).toBe(true);
  });
});
