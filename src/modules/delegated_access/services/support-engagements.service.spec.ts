import { jest } from '@jest/globals';
import {
  RECERT_LAPSED_MARKER,
  RECERTIFICATION_GRACE_DAYS,
  SupportEngagementsService,
} from './support-engagements.service';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
  runWithTenant,
} from '../../../common';
import { DELEG } from '../delegated_access.concepts';
import { DelegatedAccessErrorReason as Reason } from '../delegated_access.error-reasons';
import { DelegationScopeService } from './delegation-scope.service';
import { namesRepoDouble } from './support-names.testing';
import { STATUS } from './concept-maps';
import { supportPermissionId } from '../domain';
import { DIR } from '../../directory/directory.concepts';

/** Mock laxo: evita el tipado estricto `Mock<never>` del runtime de jest. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const TENANT = 'tenant-1';
const ADMIN = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/** Construye el servicio con repositorios y colaboradores en doble. */
function build(assignmentOverrides: Record<string, unknown> = {}) {
  const assignment: any = {
    id: 'eng-1',
    statusConceptId: STATUS.ACTIVE,
    recertifyEveryMonths: 12,
    nextRecertificationAt: new Date('2026-01-01'),
    roleTemplateId: 'tpl',
    tenantMembershipId: 'mem-1',
    ...assignmentOverrides,
  };
  const record = {
    assignment,
    tenantId: TENANT,
    userId: 'user-ana',
    membershipStatusConceptId: DIR.MEMBERSHIP_ACTIVE,
  };
  const tx = {
    flush: mockFn().mockResolvedValue(undefined),
    execute: mockFn().mockResolvedValue(undefined),
  };
  const em = {
    transactional: mockFn((cb: any) => cb(tx)),
    fork: mockFn().mockReturnValue(tx),
  };
  const grantRows: any[] = [
    {
      id: 'g1',
      organizationUserAssignmentId: 'eng-1',
      statusConceptId: DELEG.SUPPORT_GRANT_ACTIVE,
    },
    {
      id: 'g2',
      organizationUserAssignmentId: 'eng-1',
      statusConceptId: DELEG.SUPPORT_GRANT_ACTIVE,
    },
  ];
  const delegates: any[] = [
    { id: 'd1', statusConceptId: STATUS.ACTIVE },
    { id: 'd2', statusConceptId: STATUS.SUSPENDED },
  ];
  const openRequest = {
    tenantId: TENANT,
    statusConceptId: DELEG.ENGAGEMENT_STATUS_PENDING,
  };
  const access = {
    findEngagements: mockFn().mockResolvedValue([record]),
    findGrantsWithActions: mockFn().mockResolvedValue([]),
  };
  const engagements = {
    findDelegations: mockFn().mockResolvedValue(delegates),
    findActiveDueBefore: mockFn().mockResolvedValue([assignment]),
    // Cierra o suspende la membresía STAFF cuando existe solo por el vínculo.
    syncSupportMembership: mockFn().mockResolvedValue(true),
  };
  const grants = {
    findByEngagement: mockFn().mockResolvedValue(grantRows),
    findById: mockFn().mockImplementation(
      async (_t: unknown, id: string) =>
        grantRows.find((g) => g.id === id) ?? null,
    ),
    create: mockFn().mockReturnValue({
      id: 'g-new',
      statusConceptId: DELEG.SUPPORT_GRANT_ACTIVE,
      createdAt: new Date(),
    }),
    addActions: mockFn(),
    findActions: mockFn().mockResolvedValue([]),
    removeActions: mockFn(),
  };
  const requests = {
    findByRequester: mockFn().mockResolvedValue([openRequest]),
  };
  const templates = {
    findById: mockFn().mockResolvedValue({ code: 'SECRETARY' }),
  };
  const events = { record: mockFn() };
  const targets = {
    assertTarget: mockFn().mockResolvedValue({}),
    buildSnapshot: mockFn().mockResolvedValue({
      rows: [{ careSpaceId: 'c1' }],
    }),
  };
  const effective = { refreshTenant: mockFn().mockResolvedValue({}) };
  const scope = new DelegationScopeService(
    {} as any,
    {} as any,
    {} as any,
    {} as any,
  );
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new SupportEngagementsService(
    em as any,
    access as any,
    engagements as any,
    grants as any,
    requests as any,
    templates as any,
    events as any,
    targets as any,
    effective as any,
    scope,
    logger as any,
    namesRepoDouble(mockFn) as any,
  );
  const inTenant = <T>(fn: () => T): T => runWithTenant(TENANT, fn);
  return {
    service,
    tx,
    assignment,
    record,
    access,
    engagements,
    grants,
    grantRows,
    delegates,
    openRequest,
    events,
    targets,
    effective,
    inTenant,
  };
}

describe('SupportEngagementsService', () => {
  describe('addGrant', () => {
    const dto = {
      targetKind: 'LOCATION',
      careSpaceId: 'piso-1',
      actions: ['schedule.view', 'schedule.check_in'],
      expansionMode: 'FIXED',
    } as any;

    it('crea el permiso con sus acciones, congela la foto si es FIXED y recalcula el acceso', async () => {
      const d = build();
      await d.inTenant(() => d.service.addGrant('eng-1', dto, ADMIN));
      const [[, data]] = d.grants.create.mock.calls;
      expect(data.expansionModeConceptId).toBe(DELEG.SUPPORT_EXPANSION_FIXED);
      expect(data.fixedSnapshot).toEqual({ rows: [{ careSpaceId: 'c1' }] });
      expect(data.statusConceptId).toBe(DELEG.SUPPORT_GRANT_ACTIVE);
      const [[, , permissionIds]] = d.grants.addActions.mock.calls;
      expect(permissionIds).toEqual([
        supportPermissionId('schedule.view'),
        supportPermissionId('schedule.check_in'),
      ]);
      expect(d.effective.refreshTenant).toHaveBeenCalledWith(
        TENANT,
        expect.objectContaining({ userId: 'user-ana' }),
      );
    });

    it('un permiso DYNAMIC no guarda foto', async () => {
      const d = build();
      await d.inTenant(() =>
        d.service.addGrant(
          'eng-1',
          { ...dto, expansionMode: undefined },
          ADMIN,
        ),
      );
      expect(d.targets.buildSnapshot).not.toHaveBeenCalled();
    });

    it('no otorga permisos en un vínculo que no está activo', async () => {
      const d = build({ statusConceptId: STATUS.REVOKED });
      await expect(
        d.inTenant(() => d.service.addGrant('eng-1', dto, ADMIN)),
      ).rejects.toMatchObject({ reason: Reason.SUPPORT_ENGAGEMENT_NOT_ACTIVE });
    });

    it('un vínculo de otra organización responde como inexistente', async () => {
      const d = build();
      d.access.findEngagements.mockResolvedValue([]);
      await expect(
        d.inTenant(() => d.service.addGrant('eng-x', dto, ADMIN)),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('updateGrant', () => {
    it('da de baja un permiso', async () => {
      const d = build();
      await d.inTenant(() =>
        d.service.updateGrant('eng-1', { grantId: 'g1', revoke: true }, ADMIN),
      );
      expect(d.grantRows[0].statusConceptId).toBe(DELEG.SUPPORT_GRANT_REVOKED);
      expect(d.grantRows[0].validTo).toBeInstanceOf(Date);
    });

    it('reemplaza las acciones y cambia la vigencia', async () => {
      const d = build();
      d.grants.findActions.mockResolvedValue([
        { permissionId: supportPermissionId('schedule.cancel') },
      ]);
      await d.inTenant(() =>
        d.service.updateGrant(
          'eng-1',
          {
            grantId: 'g1',
            actions: ['schedule.view'],
            validTo: '2027-01-01T00:00:00.000Z',
          },
          ADMIN,
        ),
      );
      expect(d.grants.removeActions).toHaveBeenCalled();
      const [[, , added]] = d.grants.addActions.mock.calls;
      expect(added).toEqual([supportPermissionId('schedule.view')]);
      expect(d.grantRows[0].validTo).toEqual(
        new Date('2027-01-01T00:00:00.000Z'),
      );
    });

    it('un permiso de otro vínculo no se toca', async () => {
      const d = build();
      d.grantRows[0].organizationUserAssignmentId = 'otro';
      await expect(
        d.inTenant(() =>
          d.service.updateGrant(
            'eng-1',
            { grantId: 'g1', revoke: true },
            ADMIN,
          ),
        ),
      ).rejects.toMatchObject({ reason: Reason.SUPPORT_GRANT_NOT_FOUND });
    });

    it('sin cambios que aplicar es una precondición fallida', async () => {
      const d = build();
      await expect(
        d.inTenant(() =>
          d.service.updateGrant('eng-1', { grantId: 'g1' }, ADMIN),
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('end (fin de vínculo)', () => {
    it('revoca en cascada: vínculo, permisos, delegaciones y solicitudes abiertas, con registro en el ledger', async () => {
      const d = build();
      await d.inTenant(() =>
        d.service.end('eng-1', { reason: 'Renunció' }, ADMIN),
      );
      expect(d.assignment.statusConceptId).toBe(STATUS.REVOKED);
      expect(d.assignment.endedReasonText).toBe('Renunció');
      expect(
        d.grantRows.every(
          (g) => g.statusConceptId === DELEG.SUPPORT_GRANT_REVOKED,
        ),
      ).toBe(true);
      expect(
        d.delegates.every((x) => x.statusConceptId === STATUS.REVOKED),
      ).toBe(true);
      expect(d.events.record).toHaveBeenCalledTimes(2);
      expect(d.openRequest.statusConceptId).toBe(
        DELEG.ENGAGEMENT_STATUS_CANCELLED,
      );
      expect(d.effective.refreshTenant).toHaveBeenCalled();
    });

    it('A2: al terminar el vínculo cierra la membresía STAFF que existía solo por él', async () => {
      const d = build();
      await d.inTenant(() => d.service.end('eng-1', { reason: 'x' }, ADMIN));
      expect(d.engagements.syncSupportMembership).toHaveBeenCalledWith(
        expect.anything(),
        'mem-1',
        'ENDED',
        expect.any(Date),
        'admin-1',
      );
    });

    it('no toca las citas: el servicio ni siquiera depende de la agenda', async () => {
      // Las citas siguen en pie y su gestión pasa a la recepción: el fin de
      // vínculo solo escribe vínculo, permisos, delegaciones y solicitudes.
      const d = build();
      await d.inTenant(() => d.service.end('eng-1', { reason: 'x' }, ADMIN));
      const written = [
        d.grants.create,
        d.grants.addActions,
        d.grants.removeActions,
      ];
      expect(written.every((fn) => fn.mock.calls.length === 0)).toBe(true);
    });

    it('es idempotente si ya estaba terminado', async () => {
      const d = build({ statusConceptId: STATUS.REVOKED });
      await expect(
        d.inTenant(() => d.service.end('eng-1', { reason: 'x' }, ADMIN)),
      ).resolves.toEqual({ ok: true });
      expect(d.events.record).not.toHaveBeenCalled();
    });
  });

  describe('recertify', () => {
    it('fija la próxima fecha con la periodicidad indicada', async () => {
      const d = build();
      await d.inTenant(() =>
        d.service.recertify('eng-1', { recertifyEveryMonths: 6 }, ADMIN),
      );
      expect(d.assignment.recertifyEveryMonths).toBe(6);
      const months =
        (d.assignment.nextRecertificationAt.getTime() - Date.now()) /
        (30 * 86_400_000);
      expect(months).toBeGreaterThan(5.5);
      expect(months).toBeLessThan(6.5);
    });

    it('reactiva el vínculo suspendido por no recertificar a tiempo', async () => {
      const d = build({
        statusConceptId: STATUS.SUSPENDED,
        endedReasonText: RECERT_LAPSED_MARKER,
      });
      await d.inTenant(() => d.service.recertify('eng-1', {}, ADMIN));
      // Renovar y reactivar es SOLO de la organización: período nuevo desde hoy.
      expect(d.assignment.nextRecertificationAt.getTime()).toBeGreaterThan(
        Date.now() + 11 * 30 * 86_400_000,
      );
      expect(d.assignment.statusConceptId).toBe(STATUS.ACTIVE);
      expect(d.assignment.endedReasonText).toBeUndefined();
      expect(d.delegates[1].statusConceptId).toBe(STATUS.ACTIVE);
      expect(d.engagements.syncSupportMembership).toHaveBeenCalledWith(
        expect.anything(),
        'mem-1',
        'ACTIVE',
        expect.any(Date),
        'admin-1',
      );
    });

    it('un vínculo terminado no se recertifica', async () => {
      const d = build({ statusConceptId: STATUS.REVOKED });
      await expect(
        d.inTenant(() => d.service.recertify('eng-1', {}, ADMIN)),
      ).rejects.toMatchObject({ reason: Reason.SUPPORT_ENGAGEMENT_NOT_ACTIVE });
    });
  });

  describe('confirmMine (la persona declara «sigo trabajando aquí»)', () => {
    const ANA = { id: 'user-ana', roles: ['USER'] } as any;
    const soon = () => new Date(Date.now() + 10 * 86_400_000);

    it('es solo una declaración: no renueva el período, no mueve la recertificación y no recalcula el acceso', async () => {
      const next = soon();
      const d = build({ nextRecertificationAt: next, recertifyEveryMonths: 6 });
      const res = await d.service.confirmMine('eng-1', ANA);
      expect(d.assignment.nextRecertificationAt).toBe(next);
      expect(d.assignment.recertifyEveryMonths).toBe(6);
      expect(d.assignment.statusConceptId).toBe(STATUS.ACTIVE);
      expect(d.tx.flush).not.toHaveBeenCalled();
      expect(d.effective.refreshTenant).not.toHaveBeenCalled();
      expect(d.engagements.syncSupportMembership).not.toHaveBeenCalled();
      expect(res).toMatchObject({ id: 'eng-1', status: 'ACTIVE' });
      expect(res.declaredAt).toBeInstanceOf(Date);
      expect(res).not.toHaveProperty('reactivated');
    });

    it('declarar dentro de los 15 días de gracia (vencido pero aún activo) tampoco renueva', async () => {
      const overdue = new Date(Date.now() - 5 * 86_400_000);
      const d = build({ nextRecertificationAt: overdue });
      const res = await d.service.confirmMine('eng-1', ANA);
      expect(d.assignment.nextRecertificationAt).toBe(overdue);
      expect(d.assignment.statusConceptId).toBe(STATUS.ACTIVE);
      expect(res.recertificationDue).toBe(true);
    });

    it('es idempotente: declarar dos veces no cambia nada', async () => {
      const next = soon();
      const d = build({ nextRecertificationAt: next });
      await d.service.confirmMine('eng-1', ANA);
      const again = await d.service.confirmMine('eng-1', ANA);
      expect(d.assignment.nextRecertificationAt).toBe(next);
      expect(again.declaredAt).toBeInstanceOf(Date);
    });

    it('ubica el vínculo SOLO entre los de la persona de la sesión', async () => {
      const d = build({ nextRecertificationAt: soon() });
      await d.service.confirmMine('eng-1', ANA);
      expect(d.access.findEngagements).toHaveBeenCalledWith(d.tx, {
        ids: ['eng-1'],
        userId: 'user-ana',
      });
    });

    it('con RLS: ubica lo propio con el contexto de sistema acotado y lee la vista DENTRO de la organización del vínculo', async () => {
      const before = process.env.RLS_ENFORCE;
      process.env.RLS_ENFORCE = 'true';
      try {
        const d = build({ nextRecertificationAt: soon() });
        const log: string[] = [];
        d.tx.execute.mockImplementation((sql: string, params?: unknown[]) => {
          log.push(params ? `${sql}|${String(params)}` : sql);
          return Promise.resolve([]);
        });
        d.access.findEngagements.mockImplementation(() => {
          log.push('FIND');
          return Promise.resolve([d.record]);
        });
        (d.service as any).activity.userNames.mockImplementation(() => {
          log.push('VIEW');
          return Promise.resolve(new Map());
        });
        await d.service.confirmMine('eng-1', ANA);
        const at = (needle: string): number =>
          log.findIndex((l) => l.includes(needle));
        expect(at("'app.system_context', 'true'")).toBeGreaterThanOrEqual(0);
        expect(at("'app.system_context', 'true'")).toBeLessThan(at('FIND'));
        const tenant = log.findIndex(
          (l) =>
            l ===
            `select set_config('app.current_tenant_id', ?, true)|${TENANT}`,
        );
        expect(tenant).toBeGreaterThan(at('FIND'));
        expect(tenant).toBeLessThan(at('VIEW'));
        // Nunca se renueva ni se reactiva, tampoco con RLS.
        expect(d.effective.refreshTenant).not.toHaveBeenCalled();
      } finally {
        if (before === undefined) delete process.env.RLS_ENFORCE;
        else process.env.RLS_ENFORCE = before;
      }
    });

    it('un vínculo ajeno responde como inexistente (404)', async () => {
      const d = build({ nextRecertificationAt: soon() });
      d.access.findEngagements.mockResolvedValue([]);
      await expect(d.service.confirmMine('eng-1', ANA)).rejects.toBeInstanceOf(
        ResourceNotFoundException,
      );
      d.access.findEngagements.mockResolvedValue([
        { ...d.record, userId: 'otra-persona' },
      ]);
      await expect(d.service.confirmMine('eng-1', ANA)).rejects.toMatchObject({
        reason: Reason.SUPPORT_ENGAGEMENT_NOT_FOUND,
      });
    });

    it('con el vínculo suspendido por recertificación solo registra la declaración: sigue suspendido', async () => {
      const lapsed = new Date('2026-01-01');
      const d = build({
        statusConceptId: STATUS.SUSPENDED,
        endedReasonText: RECERT_LAPSED_MARKER,
        nextRecertificationAt: lapsed,
      });
      const res = await d.service.confirmMine('eng-1', ANA);
      expect(d.assignment.statusConceptId).toBe(STATUS.SUSPENDED);
      expect(d.assignment.endedReasonText).toBe(RECERT_LAPSED_MARKER);
      expect(d.assignment.nextRecertificationAt).toBe(lapsed);
      expect(d.delegates[1].statusConceptId).toBe(STATUS.SUSPENDED);
      expect(d.engagements.syncSupportMembership).not.toHaveBeenCalled();
      expect(d.effective.refreshTenant).not.toHaveBeenCalled();
      expect(res.status).toBe('SUSPENDED');
      expect(res.declaredAt).toBeInstanceOf(Date);
    });

    it('un vínculo terminado, expirado o suspendido por otra causa responde 422', async () => {
      for (const over of [
        { statusConceptId: STATUS.REVOKED },
        { statusConceptId: STATUS.SUSPENDED, endedReasonText: 'OTRA_CAUSA' },
        { statusConceptId: STATUS.SUSPENDED },
        { statusConceptId: STATUS.EXPIRED },
      ]) {
        const d = build(over);
        await expect(d.service.confirmMine('eng-1', ANA)).rejects.toMatchObject(
          { reason: Reason.SUPPORT_ENGAGEMENT_NOT_ACTIVE },
        );
      }
    });

    it('un vínculo activo con la vigencia vencida, o con la membresía cerrada, tampoco', async () => {
      const expired = build({ validTo: new Date(Date.now() - 1000) });
      await expect(
        expired.service.confirmMine('eng-1', ANA),
      ).rejects.toMatchObject({ reason: Reason.SUPPORT_ENGAGEMENT_NOT_ACTIVE });
      const closed = build();
      (closed.record as any).membershipStatusConceptId = 'cerrada';
      await expect(
        closed.service.confirmMine('eng-1', ANA),
      ).rejects.toMatchObject({ reason: Reason.SUPPORT_ENGAGEMENT_NOT_ACTIVE });
    });

    it('lo que la persona declara lo ve la organización aparte (personConfirmedAt) sin tocar lastConfirmedBy', async () => {
      const d = build({
        nextRecertificationAt: new Date('2027-04-30T10:00:00Z'),
        recertifyEveryMonths: 6,
      });
      (d.service as any).activity.lastPersonConfirmations.mockResolvedValue(
        new Map([['eng-1', new Date('2026-10-30T10:00:02Z')]]),
      );
      const { items } = await d.inTenant(() => d.service.listForTenant());
      expect(items[0]).toMatchObject({
        personConfirmedAt: new Date('2026-10-30T10:00:02Z'),
        lastConfirmedAt: new Date('2026-10-30T10:00:00Z'),
        lastConfirmedBy: 'ORGANIZATION',
      });
    });
  });

  describe('vista del vínculo', () => {
    it('trae nombres, organización, dueño, período, última confirmación y quién la hizo', async () => {
      const d = build({
        nextRecertificationAt: new Date('2027-04-30T10:00:00Z'),
        recertifyEveryMonths: 6,
        ownerKindConceptId: DELEG.OWNER_KIND_PRIVATE_PRACTICE,
      });
      const names = (d.service as any).activity;
      names.userNames.mockResolvedValue(
        new Map([['user-ana', 'Ana Gutiérrez']]),
      );
      names.tenantNames.mockResolvedValue(
        new Map([[TENANT, 'Hospital Piloto Mantra']]),
      );
      names.lastActivity.mockResolvedValue(
        new Map([[`${TENANT}|user-ana`, new Date('2026-10-29T15:00:00Z')]]),
      );
      const { items } = await d.inTenant(() => d.service.listForTenant());
      expect(items[0]).toMatchObject({
        personName: 'Ana Gutiérrez',
        organizationName: 'Hospital Piloto Mantra',
        ownerKind: 'PRIVATE_PRACTICE',
        recertifyEveryMonths: 6,
        roleTemplateCode: 'SECRETARY',
        lastActivityAt: new Date('2026-10-29T15:00:00Z'),
        lastConfirmedAt: new Date('2026-10-30T10:00:00Z'),
        lastConfirmedBy: 'ORGANIZATION',
      });
    });

    it('un vínculo suspendido por recertificación dice cuándo debió suspenderse', async () => {
      const d = build({
        statusConceptId: STATUS.SUSPENDED,
        endedReasonText: RECERT_LAPSED_MARKER,
        nextRecertificationAt: new Date('2026-01-01T00:00:00Z'),
      });
      const { items } = await d.inTenant(() => d.service.listForTenant());
      expect(items[0].suspendedAt).toEqual(
        new Date(
          new Date('2026-01-01T00:00:00Z').getTime() +
            RECERTIFICATION_GRACE_DAYS * 86_400_000,
        ),
      );
    });
  });

  describe('suspendLapsedRecertifications', () => {
    it('suspende los vínculos a los 15 días de la fecha sin confirmar y refresca su organización', async () => {
      const d = build();
      const suspended = await d.service.suspendLapsedRecertifications();
      expect(suspended).toBe(1);
      expect(d.assignment.statusConceptId).toBe(STATUS.SUSPENDED);
      expect(d.assignment.endedReasonText).toBe(RECERT_LAPSED_MARKER);
      expect(d.delegates[0].statusConceptId).toBe(STATUS.SUSPENDED);
      expect(d.engagements.syncSupportMembership).toHaveBeenCalledWith(
        expect.anything(),
        'mem-1',
        'SUSPENDED',
        expect.any(Date),
        undefined,
      );
      const [[, , cutoff]] = d.engagements.findActiveDueBefore.mock.calls;
      const days = (Date.now() - cutoff.getTime()) / 86_400_000;
      expect(Math.round(days)).toBe(RECERTIFICATION_GRACE_DAYS);
      expect(d.effective.refreshTenant).toHaveBeenCalledWith(TENANT);
    });
  });

  describe('listMine', () => {
    it('lista solo los vínculos de la persona pedida', async () => {
      const d = build();
      const res = await d.service.listMine('user-ana');
      expect(d.access.findEngagements).toHaveBeenCalledWith(expect.anything(), {
        userId: 'user-ana',
      });
      expect(res.count).toBe(1);
      expect(res.items[0].roleTemplateCode).toBe('SECRETARY');
    });
  });
});
