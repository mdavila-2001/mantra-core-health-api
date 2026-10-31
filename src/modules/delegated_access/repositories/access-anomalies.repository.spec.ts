import { jest } from '@jest/globals';
import { DELEG } from '../delegated_access.concepts';
import { AccessAnomalies } from '../entities';
import { AccessAnomaliesRepository } from './access-anomalies.repository';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
const NOW = new Date('2026-11-02T12:00:00Z');

function build(rows: unknown[] = []) {
  const em: any = {
    find: mockFn().mockResolvedValue(rows),
    findOne: mockFn().mockResolvedValue(rows[0] ?? null),
    execute: mockFn().mockResolvedValue([]),
    create: mockFn((_e: unknown, data: unknown) => data),
  };
  return { repo: new AccessAnomaliesRepository(), em };
}

const DETECTED = {
  tenantId: 't1',
  userId: 'u1',
  organizationUserAssignmentId: 'v1',
  kindConceptId: DELEG.ANOMALY_SEARCH_SPIKE,
  windowStart: new Date('2026-11-02T00:00:00Z'),
  windowEnd: NOW,
  observedValue: '42.00',
  baselineValue: '6.50',
  thresholdValue: '20.00',
  evidence: { searches: 42, distinctIps: 1 },
};

describe('AccessAnomaliesRepository', () => {
  it('el barrido es idempotente: INSERT … ON CONFLICT DO NOTHING sobre (organización, persona, tipo, inicio de ventana)', async () => {
    const { repo, em } = build();
    em.execute.mockResolvedValueOnce([{ id: 'nuevo' }]);

    const creada = await repo.createIfAbsent(em, DETECTED, 'sistema');

    expect(creada).toBe(true);
    const [sql, params] = em.execute.mock.calls[0];
    expect(sql).toContain('insert into "delegated_access"."access_anomalies"');
    expect(sql).toContain(
      'on conflict (tenant_id, user_id, kind_concept_id, window_start) do nothing',
    );
    expect(sql).toContain('returning id');
    expect(params).toEqual(
      expect.arrayContaining([
        't1',
        'u1',
        'v1',
        DELEG.ANOMALY_SEARCH_SPIKE,
        '42.00',
        '6.50',
        '20.00',
        DELEG.ANOMALY_OPEN,
      ]),
    );
    // La evidencia viaja como JSON con identificadores y números.
    expect(
      params.some(
        (p: unknown) => typeof p === 'string' && p.includes('"searches":42'),
      ),
    ).toBe(true);
  });

  it('si ya existía la misma ventana no crea otra', async () => {
    const { repo, em } = build();
    em.execute.mockResolvedValueOnce([]);
    expect(await repo.createIfAbsent(em, DETECTED)).toBe(false);
  });

  it('lista las anomalías de una organización por estado y tipo, las más nuevas primero', async () => {
    const { repo, em } = build([]);
    await repo.findByTenant(em, 't1', {
      statusConceptIds: [DELEG.ANOMALY_OPEN],
      kindConceptIds: [DELEG.ANOMALY_OFF_HOURS],
      limit: 30,
    });
    const [entity, where, opts] = em.find.mock.calls[0];
    expect(entity).toBe(AccessAnomalies);
    expect(where).toEqual({
      tenantId: 't1',
      statusConceptId: { $in: [DELEG.ANOMALY_OPEN] },
      kindConceptId: { $in: [DELEG.ANOMALY_OFF_HOURS] },
    });
    expect(opts).toMatchObject({
      orderBy: { createdAt: 'desc', id: 'desc' },
      limit: 30,
    });
  });

  it('busca por id acotado a la organización', async () => {
    const { repo, em } = build();
    await repo.findById(em, 't1', 'a1');
    expect(em.findOne.mock.calls[0][1]).toEqual({ tenantId: 't1', id: 'a1' });
  });

  it('reconoce, escala o descarta dejando quién y cuándo', () => {
    const { repo } = build();
    const row: any = { statusConceptId: DELEG.ANOMALY_OPEN };
    repo.resolve(row, {
      statusConceptId: DELEG.ANOMALY_DISMISSED,
      byUserId: 'admin-1',
      comment: 'Cierre mensual de caja, es normal',
      now: NOW,
    });
    expect(row).toMatchObject({
      statusConceptId: DELEG.ANOMALY_DISMISSED,
      acknowledgedByUserId: 'admin-1',
      acknowledgedAt: NOW,
      resolutionCommentText: 'Cierre mensual de caja, es normal',
      updatedByUserId: 'admin-1',
    });
  });

  it('cuenta las abiertas de una persona para el puntaje del tablero', async () => {
    const { repo, em } = build([{}, {}, {}]);
    const rows = await repo.findOpenByUser(em, 't1', 'u1');
    expect(rows).toHaveLength(3);
    expect(em.find.mock.calls[0][1]).toEqual({
      tenantId: 't1',
      userId: 'u1',
      statusConceptId: DELEG.ANOMALY_OPEN,
    });
  });
});
