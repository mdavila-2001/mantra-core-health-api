import { jest } from '@jest/globals';
import { DELEG } from '../delegated_access.concepts';
import { AccessDecisionLog } from '../entities';
import { AccessDecisionLogRepository } from './access-decision-log.repository';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
const NOW = new Date('2026-11-02T12:00:00Z');

function build(rows: unknown[] = []) {
  const em: any = {
    find: mockFn().mockResolvedValue(rows),
    findOne: mockFn().mockResolvedValue(rows[0] ?? null),
    persist: mockFn(),
    create: mockFn((_e: unknown, data: unknown) => data),
  };
  return { repo: new AccessDecisionLogRepository(), em };
}

describe('AccessDecisionLogRepository (bitácora WORM)', () => {
  it('es de solo anexar: no expone ninguna operación que modifique o borre', () => {
    const metodos = Object.getOwnPropertyNames(
      AccessDecisionLogRepository.prototype,
    ).filter((m) => m !== 'constructor');
    for (const m of metodos)
      expect(m).not.toMatch(/update|remove|delete|revoke|edit|set/i);
    expect(metodos).toEqual(expect.arrayContaining(['append', 'findPage']));
  });

  it('anexa un asiento con identificadores y números, sin texto libre, y sin updated_at ni row_version', () => {
    const { repo, em } = build();

    const row: any = repo.append(em, {
      tenantId: 't1',
      userId: 'u1',
      permissionCode: 'billing.payment.refund',
      effectConceptId: DELEG.DECISION_EFFECT_CHALLENGE,
      reasonCode: 'APPROVAL_REQUIRED',
      grantId: 'g1',
      practitionerRoleAssignmentId: 'pr1',
      patientProfileId: 'p1',
      correlationId: 'c0',
      sessionId: 's1',
      ip: '10.0.0.5',
      detail: { unmet: ['approval'], repeat: 1 },
      recordedAt: NOW,
      recordedByUserId: 'u1',
    });

    expect(em.create.mock.calls[0][0]).toBe(AccessDecisionLog);
    expect(row).toMatchObject({
      tenantId: 't1',
      userId: 'u1',
      permissionCode: 'billing.payment.refund',
      effectConceptId: DELEG.DECISION_EFFECT_CHALLENGE,
      reasonCode: 'APPROVAL_REQUIRED',
      detailJson: { unmet: ['approval'], repeat: 1 },
      recordedAt: NOW,
    });
    expect(row).not.toHaveProperty('updatedAt');
    expect(row).not.toHaveProperty('rowVersion');
  });

  it('pagina por organización con filtros y los asientos recientes primero', async () => {
    const { repo, em } = build([]);

    await repo.findPage(
      em,
      't1',
      {
        userId: 'u1',
        effectConceptId: DELEG.DECISION_EFFECT_DENY,
        permissionCode: 'billing.receipt.void',
        from: new Date('2026-11-01T00:00:00Z'),
        to: NOW,
      },
      { limit: 50, offset: 100 },
    );

    const [entity, where, opts] = em.find.mock.calls[0];
    expect(entity).toBe(AccessDecisionLog);
    expect(where).toMatchObject({
      tenantId: 't1',
      userId: 'u1',
      effectConceptId: DELEG.DECISION_EFFECT_DENY,
      permissionCode: 'billing.receipt.void',
    });
    expect(where.recordedAt).toEqual({
      $gte: new Date('2026-11-01T00:00:00Z'),
      $lt: NOW,
    });
    expect(opts).toMatchObject({
      orderBy: { recordedAt: 'desc', id: 'desc' },
      limit: 50,
      offset: 100,
    });
  });

  it('busca un asiento equivalente reciente (misma persona, átomo, motivo y objetivo) para deduplicar sin actualizar', async () => {
    const { repo, em } = build([{ id: 'x' }]);

    const dup = await repo.findRecentEquivalent(em, {
      tenantId: 't1',
      userId: 'u1',
      permissionCode: 'agenda.appointment.cancel',
      effectConceptId: DELEG.DECISION_EFFECT_DENY,
      reasonCode: 'NO_GRANT',
      practitionerRoleAssignmentId: 'pr1',
      since: new Date(NOW.getTime() - 60_000),
    });

    expect(dup).toEqual({ id: 'x' });
    const [, where, opts] = em.findOne.mock.calls[0];
    expect(where).toMatchObject({
      tenantId: 't1',
      userId: 'u1',
      reasonCode: 'NO_GRANT',
      practitionerRoleAssignmentId: 'pr1',
      recordedAt: { $gte: new Date(NOW.getTime() - 60_000) },
    });
    expect(opts.orderBy).toEqual({ recordedAt: 'desc' });
  });

  it('lista por permiso (concesión) los asientos que la usaron', async () => {
    const { repo, em } = build([]);
    await repo.findByGrant(em, 't1', 'g1', 20);
    const [, where, opts] = em.find.mock.calls[0];
    expect(where).toEqual({ tenantId: 't1', grantId: 'g1' });
    expect(opts.limit).toBe(20);
  });
});
