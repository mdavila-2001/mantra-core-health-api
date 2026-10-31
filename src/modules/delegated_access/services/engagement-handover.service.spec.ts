import { jest } from '@jest/globals';
import { runWithTenant } from '../../../common';
import { DIR } from '../../directory/directory.concepts';
import { DELEG } from '../delegated_access.concepts';
import { DelegatedAccessErrorReason as Reason } from '../delegated_access.error-reasons';
import { LifecycleRepository } from '../repositories/lifecycle.repository';
import { STATUS } from './concept-maps';
import { DelegationScopeService } from './delegation-scope.service';
import { EngagementHandoverService } from './engagement-handover.service';
import { memoryEm, orderLog } from './lifecycle.testing';

/** Mock laxo: evita el tipado estricto `Mock<never>` del runtime de jest. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const TENANT = 'org-1';
const ADMIN = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

interface Opts {
  conversations?: Array<{ id: string; practitionerProfileId: string }>;
  tasks?: string[];
  bookings?: Array<{ id: string; startAt: Date }>;
  supervised?: any[];
  replyers?: Record<string, string[]>;
  liveMembers?: string[];
  ownerEligible?: boolean;
  failReassign?: boolean;
}

function build(opts: Opts = {}) {
  const log = orderLog();
  const assignment: any = {
    id: 'eng-pablo',
    statusConceptId: STATUS.ACTIVE,
    tenantMembershipId: 'mem-pablo',
  };
  const record = {
    assignment,
    tenantId: TENANT,
    userId: 'pablo',
    membershipStatusConceptId: DIR.MEMBERSHIP_ACTIVE,
  };
  const { em, tables } = memoryEm(mockFn);
  const access = {
    findEngagements: mockFn(async (_e: any, f: any) => {
      if (f.ids && !f.ids.includes('eng-pablo')) return [];
      return [record];
    }),
  };
  const work = {
    findOpenConversations: mockFn().mockResolvedValue(opts.conversations ?? []),
    findOpenTaskIds: mockFn().mockResolvedValue(opts.tasks ?? []),
    findPendingBookings: mockFn().mockResolvedValue(opts.bookings ?? []),
    findSupervised: mockFn().mockResolvedValue(opts.supervised ?? []),
    reassignConversation: mockFn(
      async (_e: any, id: string, to: string | null) => {
        if (opts.failReassign) throw new Error('falló la reasignación');
        log.push(`conversation:${id}->${to}`);
        return true;
      },
    ),
    reassignTask: mockFn(async (_e: any, id: string, to: string | null) => {
      log.push(`task:${id}->${to}`);
      return true;
    }),
    setSupervisor: mockFn(async (_e: any, id: string, to: string) => {
      log.push(`supervisor:${id}->${to}`);
      return true;
    }),
  };
  const engagements = {
    end: mockFn(async () => {
      log.push('end');
      assignment.statusConceptId = STATUS.REVOKED;
      assignment.validTo = new Date();
      return { ok: true };
    }),
  };
  const policy = {
    replyersOfDoctor: mockFn(
      async (_t: string, profile: string) => opts.replyers?.[profile] ?? [],
    ),
  };
  const directory = {
    liveMemberUserIds: mockFn().mockResolvedValue(
      new Set(opts.liveMembers ?? ['ana']),
    ),
    ownerCandidate: mockFn(async (_e: any, userId: string) => ({
      userId,
      membershipLive: true,
      isSecurityAdmin: opts.ownerEligible !== false,
      isOrgDoctor: false,
      isLiveDelegatedAdmin: false,
    })),
  };
  const outbox = { publishDomainEvent: mockFn().mockResolvedValue({}) };
  const logger = {
    setContext: mockFn(),
    info: mockFn(),
    warn: mockFn(),
    error: mockFn(),
  };
  const service = new EngagementHandoverService(
    em,
    access as any,
    work as any,
    new LifecycleRepository(),
    engagements as any,
    policy as any,
    directory as any,
    outbox as any,
    new DelegationScopeService({} as any, {} as any, {} as any, {} as any),
    logger as any,
  );
  const inTenant = <T>(fn: () => T): T => runWithTenant(TENANT, fn);
  return {
    service,
    em,
    tables,
    assignment,
    log,
    work,
    engagements,
    policy,
    directory,
    outbox,
    logger,
    inTenant,
  };
}

const pabloWork: Opts = {
  conversations: [
    { id: 'c1', practitionerProfileId: 'perez' },
    { id: 'c2', practitionerProfileId: 'perez' },
    { id: 'c3', practitionerProfileId: 'mendez' },
  ],
  tasks: ['t1', 't2'],
  bookings: [{ id: 'b1', startAt: new Date('2026-11-05T09:00:00Z') }],
  replyers: { perez: ['ana'], mendez: [] },
};

describe('EngagementHandoverService.offboard · baja de Pablo (L-01)', () => {
  it('revoca primero y reasigna después: el orden es fijo y las marcas de tiempo lo demuestran (AC-8)', async () => {
    const t = build(pabloWork);
    const out: any = await t.inTenant(() =>
      t.service.offboard(
        'eng-pablo',
        { reason: 'Renuncia', handover: { defaultToUserId: 'ana' } },
        ADMIN,
      ),
    );
    expect(t.log.entries[0]).toBe('end');
    expect(t.log.entries.slice(1).sort()).toEqual(
      [
        'conversation:c1->ana',
        'conversation:c2->ana',
        'conversation:c3->null',
        'task:t1->ana',
        'task:t2->ana',
      ].sort(),
    );
    const items = t.tables.HandoverItems;
    expect(items).toHaveLength(6);
    const byStatus = (s: string) =>
      items.filter((i) => i.statusConceptId === s);
    expect(byStatus(DELEG.HANDOVER_REASSIGNED)).toHaveLength(5);
    expect(byStatus(DELEG.HANDOVER_RETURNED_TO_POOL)).toHaveLength(1);
    expect(byStatus(DELEG.HANDOVER_RETURNED_TO_POOL)[0].sourceId).toBe('c3');
    expect(out.revokedAt.getTime()).toBeGreaterThan(0);
    for (const i of items) {
      expect(i.reassignedAt.getTime()).toBeGreaterThanOrEqual(
        out.revokedAt.getTime(),
      );
    }
    expect(t.assignment.validTo.getTime()).toBeLessThanOrEqual(
      items[0].reassignedAt.getTime(),
    );
    const kase = t.tables.LifecycleCases[0];
    expect(kase.kindConceptId).toBe(DELEG.LIFECYCLE_LEAVER);
    expect(kase.statusConceptId).toBe(DELEG.LIFECYCLE_COMPLETED);
    expect(out.handover).toMatchObject({ status: 'COMPLETED', pending: 0 });
  });

  it('la cita pendiente NO cambia de dueño: solo queda un responsable de seguimiento con aviso (D-21)', async () => {
    const t = build(pabloWork);
    await t.inTenant(() =>
      t.service.offboard(
        'eng-pablo',
        { reason: 'Renuncia', handover: { defaultToUserId: 'ana' } },
        ADMIN,
      ),
    );
    const booking = t.tables.HandoverItems.find((i) => i.sourceId === 'b1');
    expect(booking.statusConceptId).toBe(DELEG.HANDOVER_REASSIGNED);
    expect(booking.toUserId).toBe('ana');
    expect(booking.itemKindConceptId).toBe(DELEG.HANDOVER_PENDING_BOOKING);
    // Ninguna escritura sobre la cita: el repositorio ni siquiera expone una.
    expect(
      Object.keys(t.work).some(
        (k) => /booking/i.test(k) && k.startsWith('reassign'),
      ),
    ).toBe(false);
    const done = t.outbox.publishDomainEvent.mock.calls
      .map((c: any[]) => c[1])
      .find(
        (e: any) =>
          e.eventType === 'delegated_access.lifecycle.handover_completed',
      );
    expect(done.payloadJson.followUpItemIds).toEqual([booking.id]);
    expect(done.payloadJson.followUpUserId).toBe('ana');
  });

  it('un fallo del traspaso no deshace la baja: el vínculo sigue revocado y el caso queda OPEN con lo pendiente', async () => {
    const t = build({ ...pabloWork, failReassign: true });
    const out: any = await t.inTenant(() =>
      t.service.offboard(
        'eng-pablo',
        { reason: 'Renuncia', handover: { defaultToUserId: 'ana' } },
        ADMIN,
      ),
    );
    expect(t.assignment.statusConceptId).toBe(STATUS.REVOKED);
    expect(out.handover.status).toBe('FAILED');
    expect(out.handover.pending).toBe(6);
    const kase = t.tables.LifecycleCases[0];
    expect(kase.statusConceptId).toBe(DELEG.LIFECYCLE_OPEN);
    expect(
      t.tables.HandoverItems.every(
        (i) => i.statusConceptId === DELEG.HANDOVER_PENDING,
      ),
    ).toBe(true);
    expect(t.logger.error).toHaveBeenCalled();
    // La baja se confirmó antes de intentar reasignar.
    expect(t.log.entries[0]).toBe('end');
  });

  it('handover null: baja igual de inmediata y todo queda pendiente en el caso abierto', async () => {
    const t = build(pabloWork);
    const out: any = await t.inTenant(() =>
      t.service.offboard(
        'eng-pablo',
        { reason: 'Renuncia', handover: null },
        ADMIN,
      ),
    );
    expect(t.log.entries).toEqual(['end']);
    expect(
      t.tables.HandoverItems.every(
        (i) => i.statusConceptId === DELEG.HANDOVER_PENDING,
      ),
    ).toBe(true);
    expect(t.tables.LifecycleCases[0].statusConceptId).toBe(
      DELEG.LIFECYCLE_OPEN,
    );
    expect(out.handover).toMatchObject({ status: 'PENDING', pending: 6 });
  });

  it('un destinatario que no es del equipo vivo: 422 HANDOVER_TARGET_INELIGIBLE y no se escribe nada', async () => {
    const t = build(pabloWork);
    const err: any = await t
      .inTenant(() =>
        t.service.offboard(
          'eng-pablo',
          { reason: 'Renuncia', handover: { defaultToUserId: 'rosa' } },
          ADMIN,
        ),
      )
      .catch((e) => e);
    expect(err.reason).toBe(Reason.HANDOVER_TARGET_INELIGIBLE);
    expect(t.engagements.end).not.toHaveBeenCalled();
    expect(t.tables.LifecycleCases ?? []).toHaveLength(0);
  });

  it('la guarda del administrador delegado corre antes de revocar', async () => {
    const t = build(pabloWork);
    const guard = mockFn().mockRejectedValue(
      Object.assign(new Error('fuera de alcance'), {
        reason: Reason.ADMIN_SCOPE_EXCEEDED,
      }),
    );
    await expect(
      t.inTenant(() =>
        t.service.offboard(
          'eng-pablo',
          { reason: 'x', handover: null },
          ADMIN,
          guard,
        ),
      ),
    ).rejects.toMatchObject({ reason: Reason.ADMIN_SCOPE_EXCEEDED });
    expect(t.engagements.end).not.toHaveBeenCalled();
  });
});

describe('EngagementHandoverService · cuentas que supervisaba Ricardo (L-02)', () => {
  const supervised = [{ id: 'eng-lucia', supervisorUserId: 'pablo' }];

  it('sin nuevo dueño: 422 HANDOVER_SUPERVISOR_REQUIRED y NADA cambió', async () => {
    const t = build({ supervised });
    const err: any = await t
      .inTenant(() =>
        t.service.offboard(
          'eng-pablo',
          { reason: 'Renuncia', handover: { defaultToUserId: 'ana' } },
          ADMIN,
        ),
      )
      .catch((e) => e);
    expect(err.reason).toBe(Reason.HANDOVER_SUPERVISOR_REQUIRED);
    expect(t.engagements.end).not.toHaveBeenCalled();
    expect(t.assignment.statusConceptId).toBe(STATUS.ACTIVE);
    expect(t.tables.LifecycleCases ?? []).toHaveLength(0);
  });

  it('un nuevo dueño que no es elegible (GP-8): 422 HANDOVER_TARGET_INELIGIBLE', async () => {
    const t = build({ supervised, ownerEligible: false, liveMembers: ['ana'] });
    const err: any = await t
      .inTenant(() =>
        t.service.offboard(
          'eng-pablo',
          { reason: 'x', handover: { supervisedTo: 'ana' } },
          ADMIN,
        ),
      )
      .catch((e) => e);
    expect(err.reason).toBe(Reason.HANDOVER_TARGET_INELIGIBLE);
    expect(t.engagements.end).not.toHaveBeenCalled();
  });

  it('con handover null la baja es inmediata y la cuenta queda sin dueño en un caso OPEN; asignar completa el caso', async () => {
    const t = build({ supervised });
    await t.inTenant(() =>
      t.service.offboard(
        'eng-pablo',
        { reason: 'Renuncia', handover: null },
        ADMIN,
      ),
    );
    const kase = t.tables.LifecycleCases[0];
    expect(kase.statusConceptId).toBe(DELEG.LIFECYCLE_OPEN);
    expect(t.work.setSupervisor).not.toHaveBeenCalled();
    const out: any = await t.inTenant(() =>
      t.service.assign(kase.id, { supervisedTo: 'ana' }, ADMIN),
    );
    expect(t.work.setSupervisor).toHaveBeenCalledWith(
      expect.anything(),
      'eng-lucia',
      'ana',
      'admin-1',
      expect.any(Date),
      // B-B6: solo si la cuenta sigue siendo de la organización y de quien se fue.
      { tenantId: expect.any(String), fromUserId: expect.any(String) },
    );
    expect(out.handover.status).toBe('COMPLETED');
    expect(kase.statusConceptId).toBe(DELEG.LIFECYCLE_COMPLETED);
  });
});

describe('EngagementHandoverService.assign y preview', () => {
  it('asignar sobre un caso ya completado o ajeno: 404 LIFECYCLE_CASE_NOT_FOUND', async () => {
    const t = build();
    await expect(
      t.inTenant(() =>
        t.service.assign('nada', { defaultToUserId: 'ana' }, ADMIN),
      ),
    ).rejects.toMatchObject({ reason: Reason.LIFECYCLE_CASE_NOT_FOUND });
  });

  it('la vista previa lista lo que la persona tiene en las manos, por tipo y sin datos del paciente', async () => {
    const t = build({
      ...pabloWork,
      supervised: [{ id: 'eng-lucia', supervisorUserId: 'pablo' }],
    });
    const out = await t.inTenant(() => t.service.preview('eng-pablo'));
    expect(out.counts).toEqual({
      CONVERSATION: 3,
      WORKFLOW_TASK: 2,
      SUPERVISED_ENGAGEMENT: 1,
      PENDING_BOOKING: 1,
    });
    expect(out.items).toHaveLength(7);
    expect(JSON.stringify(out)).not.toMatch(/patient|paciente/i);
  });
});
