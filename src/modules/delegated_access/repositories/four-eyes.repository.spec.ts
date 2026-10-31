import { jest } from '@jest/globals';
import { DELEG } from '../delegated_access.concepts';
import { FourEyesRequests } from '../entities';
import { FourEyesRepository } from './four-eyes.repository';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
const NOW = new Date('2026-11-02T12:00:00Z');
const HASH = 'a'.repeat(64);

function build(rows: unknown[] = [], affected = 1) {
  const em: any = {
    find: mockFn().mockResolvedValue(rows),
    count: mockFn().mockResolvedValue(rows.length),
    findOne: mockFn().mockResolvedValue(rows[0] ?? null),
    create: mockFn((_e: unknown, data: unknown) => data),
    nativeUpdate: mockFn().mockResolvedValue(affected),
    execute: mockFn().mockResolvedValue([]),
    isInTransaction: mockFn().mockReturnValue(true),
    transactional: mockFn((fn: any) => fn(em)),
  };
  return { repo: new FourEyesRepository(), em };
}

describe('FourEyesRepository', () => {
  afterEach(() => {
    delete process.env.RLS_ENFORCE;
  });

  it('crea la solicitud pendiente con el cuerpo, su hash y la caducidad', () => {
    const { repo, em } = build();

    const row: any = repo.create(em, {
      tenantId: 't1',
      kindConceptId: DELEG.FOUR_EYES_KIND_ACTION,
      requesterUserId: 'u1',
      permissionCode: 'billing.payment.refund',
      approverKindConceptId: 'authz-second-approver',
      payload: { receiptId: 'c1' },
      payloadHash: HASH,
      payloadSchemaVersion: 1,
      reasonText: 'Cobro duplicado',
      expiresAt: new Date(NOW.getTime() + 3_600_000),
      actorUserId: 'u1',
    });

    expect(row).toMatchObject({
      tenantId: 't1',
      statusConceptId: DELEG.FOUR_EYES_PENDING,
      payloadJson: { receiptId: 'c1' },
      payloadHash: HASH,
      createdByUserId: 'u1',
    });
    expect(row.decidedAt).toBeUndefined();
    expect(row.decidedByUserId).toBeUndefined();
  });

  it('detecta un duplicado pendiente con la misma llave de unicidad parcial', async () => {
    const { repo, em } = build([{ id: 'f1' }]);

    const dup = await repo.findPendingDuplicate(em, {
      tenantId: 't1',
      kindConceptId: DELEG.FOUR_EYES_KIND_ACTION,
      requesterUserId: 'u1',
      permissionCode: undefined,
      payloadHash: HASH,
    });

    expect(dup).toEqual({ id: 'f1' });
    expect(em.findOne.mock.calls[0][0]).toBe(FourEyesRequests);
    expect(em.findOne.mock.calls[0][1]).toEqual({
      tenantId: 't1',
      kindConceptId: DELEG.FOUR_EYES_KIND_ACTION,
      requesterUserId: 'u1',
      permissionCode: null,
      payloadHash: HASH,
      statusConceptId: DELEG.FOUR_EYES_PENDING,
    });
  });

  it('la lista de pendientes de una organización va ordenada por caducidad', async () => {
    const { repo, em } = build([]);
    await repo.findPendingByTenant(em, 't1', 25);
    const [, where, opts] = em.find.mock.calls[0];
    expect(where).toEqual({
      tenantId: 't1',
      statusConceptId: DELEG.FOUR_EYES_PENDING,
    });
    expect(opts).toMatchObject({
      orderBy: { expiresAt: 'asc', id: 'asc' },
      limit: 25,
    });
  });

  it('N-3: el tope cuenta SOLO las pendientes vigentes de acción: no lo vencido ni los cambios administrativos', async () => {
    const { repo, em } = build([{}, {}, {}]);

    const open = await repo.countPendingByRequester(em, 't1', 'u1', NOW);

    expect(open).toBe(3);
    expect(em.count).toHaveBeenCalledWith(
      FourEyesRequests,
      expect.objectContaining({
        tenantId: 't1',
        requesterUserId: 'u1',
        statusConceptId: DELEG.FOUR_EYES_PENDING,
        kindConceptId: DELEG.FOUR_EYES_KIND_ACTION,
        expiresAt: { $gt: NOW },
      }),
    );
  });

  it('N-3: el cerrojo por solicitante es un advisory lock de la transacción, con la llave de organización y persona', async () => {
    const { repo, em } = build();

    await repo.lockRequesterQueue(em, 't1', 'u1');

    expect(em.execute).toHaveBeenCalledTimes(1);
    const [sql, params] = em.execute.mock.calls[0];
    expect(sql).toContain('pg_advisory_xact_lock');
    expect(params.join('|')).toContain('t1');
    expect(params.join('|')).toContain('u1');
  });

  it('CONSUMIR es atómico: una sola actualización condicionada a aprobada, no consumida y vigente', async () => {
    const { repo, em } = build([], 1);

    const ok = await repo.consume(em, 'f1', NOW);

    expect(ok).toBe(true);
    const [entity, where, data] = em.nativeUpdate.mock.calls[0];
    expect(entity).toBe(FourEyesRequests);
    expect(where).toMatchObject({
      id: 'f1',
      statusConceptId: DELEG.FOUR_EYES_APPROVED,
      consumedAt: null,
    });
    expect(JSON.stringify(where.$or)).toContain(NOW.toISOString());
    expect(data).toMatchObject({ consumedAt: NOW, updatedAt: NOW });
  });

  it('el segundo intento de consumir (0 filas afectadas) devuelve false', async () => {
    const { repo, em } = build([], 0);
    expect(await repo.consume(em, 'f1', NOW)).toBe(false);
  });

  it('el barrido de caducidad lee las pendientes vencidas de TODAS las organizaciones, con tope', async () => {
    const { repo, em } = build([{ id: 'f1', tenantId: 't9' }]);

    const out = await repo.findExpiredPendingAcrossTenants(em, NOW, 100);

    expect(out).toEqual([{ id: 'f1', tenantId: 't9' }]);
    const [, where, opts] = em.find.mock.calls[0];
    expect(where).toEqual({
      statusConceptId: DELEG.FOUR_EYES_PENDING,
      expiresAt: { $lte: NOW },
    });
    expect(opts.limit).toBe(100);
  });

  it('con RLS encendido el barrido abre el contexto de sistema solo mientras lee y lo devuelve', async () => {
    process.env.RLS_ENFORCE = 'true';
    const { repo, em } = build([]);
    em.execute.mockResolvedValueOnce([{ sc: 'false', tid: '' }]);

    await repo.findExpiredPendingAcrossTenants(em, NOW, 10);

    const sqls = em.execute.mock.calls.map((c: unknown[]) => String(c[0]));
    expect(
      sqls.some((s: string) => s.includes("'app.system_context', 'true'")),
    ).toBe(true);
    expect(
      sqls.filter((s: string) => s.includes('set_config')).length,
    ).toBeGreaterThanOrEqual(3);
  });

  it('marca como vencida sin tocar el resto', () => {
    const { repo } = build();
    const row: any = { statusConceptId: DELEG.FOUR_EYES_PENDING };
    repo.markExpired(row, NOW);
    expect(row.statusConceptId).toBe(DELEG.FOUR_EYES_EXPIRED);
    expect(row.updatedAt).toEqual(NOW);
  });
});
