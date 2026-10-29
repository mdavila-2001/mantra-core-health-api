import { PRAC } from '../practice.concepts';
import { CareSpaceBlocksTickService } from './care-space-blocks-tick.service';
import { NOW, TENANT, fn, makeRow } from './ops.testing';

const bloque = (over: Record<string, unknown> = {}) => ({
  id: 'block-1',
  tenant_id: TENANT,
  care_space_id: 'space-1',
  kind_concept_id: PRAC.BLOCK_ADMIN,
  reason_concept_id: PRAC.BLOCK_RSN_ADMIN_DECISION,
  starts_at: new Date(NOW.getTime() - 60_000),
  expected_end_at: null,
  created_at: NOW,
  row_version: 1,
  ...over,
});

function build(
  opts: { due?: any[]; late?: any[]; state?: any; row?: any; fresh?: any } = {},
) {
  const tx = {
    execute: fn(async (sql: string) =>
      sql.includes('for update') ? [opts.fresh ?? bloque()] : [],
    ),
    flush: fn().mockResolvedValue(undefined),
  };
  const fork = {
    execute: fn(async (sql: string) =>
      sql.includes('operational_status_concept_id')
        ? (opts.due ?? [])
        : (opts.late ?? []),
    ),
  };
  const em = {
    fork: fn(() => fork),
    transactional: fn((cb: any) => cb(tx)),
  };
  const state = {
    loadSpace: fn().mockResolvedValue(opts.row ?? makeRow()),
    stateOf: fn().mockResolvedValue(
      opts.state ?? {
        availability: 'SPACE_OP_AVAILABLE',
        occupancy: 'OCC_FREE',
      },
    ),
  };
  const blocks = { applyToSpace: fn().mockResolvedValue({}) };
  const events = { publish: fn().mockResolvedValue(true) };
  const logger = { setContext: fn(), error: fn(), info: fn() };
  return {
    tx,
    fork,
    blocks,
    events,
    service: new CareSpaceBlocksTickService(
      em as any,
      state as any,
      blocks as any,
      events as any,
      logger as any,
    ),
    logger,
    em,
    state,
  };
}

const candidato = {
  id: 'block-1',
  tenant_id: TENANT,
  care_space_id: 'space-1',
};

describe('CareSpaceBlocksTickService.run · un bloqueo roto no frena a los demás', () => {
  it('si aplicar uno falla, se registra con ids (sin mensaje) y la pasada sigue con el siguiente', async () => {
    const d = build({
      due: [
        candidato,
        { ...candidato, id: 'block-2', care_space_id: 'space-2' },
      ],
    });
    d.blocks.applyToSpace
      .mockRejectedValueOnce(
        new TypeError('Cannot read properties of undefined'),
      )
      .mockResolvedValueOnce({});
    const res = await d.service.run(NOW);
    expect(res).toEqual({ applied: 1, deferred: 0, overdue: 0, failed: 1 });
    expect(d.blocks.applyToSpace).toHaveBeenCalledTimes(2);
    expect(d.logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        operation: 'practice.blocks_tick.apply',
        blockId: 'block-1',
        errorName: 'TypeError',
      }),
      expect.any(String),
    );
    expect(JSON.stringify(d.logger.error.mock.calls)).not.toContain(
      'Cannot read',
    );
  });
});

describe('CareSpaceBlocksTickService.run', () => {
  it('busca los bloqueos que ya empezaron, siguen abiertos y cuyo espacio figura disponible (sin columna «aplicado»)', async () => {
    const d = build();
    await d.service.run(NOW);
    const [sql, params] = d.fork.execute.mock.calls[0];
    expect(sql).toMatch(
      /b\.ended_at is null and b\.cancelled_at is null and b\.starts_at <= \?/,
    );
    expect(sql).toMatch(
      /operational_status_concept_id is null or cs\.operational_status_concept_id = \?/,
    );
    expect(params).toContain(PRAC.SPACE_OP_AVAILABLE);
  });

  it('aplica el bloqueo cuya hora llegó, en nombre del sistema', async () => {
    const d = build({ due: [candidato] });
    const res = await d.service.run(NOW);
    expect(res).toEqual({ applied: 1, deferred: 0, overdue: 0, failed: 0 });
    expect(d.blocks.applyToSpace).toHaveBeenCalledTimes(1);
    expect(d.blocks.applyToSpace.mock.calls[0][3]).toMatchObject({
      actorUserId: null,
      source: 'SRC_SYSTEM',
      action: 'BLOCK_TICK_APPLIED',
    });
  });

  it('con la cama ocupada lo difiere; si otro proceso ya lo aplicó o terminó, lo saltea', async () => {
    const ocupada = build({
      due: [candidato],
      state: { availability: 'SPACE_OP_AVAILABLE', occupancy: 'OCC_OCCUPIED' },
    });
    expect(await ocupada.service.run(NOW)).toEqual({
      applied: 0,
      deferred: 1,
      overdue: 0,
      failed: 0,
    });
    const yaAplicado = build({
      due: [candidato],
      state: { availability: 'SPACE_OP_BLOCKED_ADMIN', occupancy: 'OCC_FREE' },
    });
    expect(await yaAplicado.service.run(NOW)).toEqual({
      applied: 0,
      deferred: 0,
      overdue: 0,
      failed: 0,
    });
    const terminado = build({
      due: [candidato],
      fresh: bloque({ ended_at: NOW }),
    });
    expect(await terminado.service.run(NOW)).toEqual({
      applied: 0,
      deferred: 0,
      overdue: 0,
      failed: 0,
    });
    for (const d of [ocupada, yaAplicado, terminado])
      expect(d.blocks.applyToSpace).not.toHaveBeenCalled();
  });

  it('avisa del bloqueo vencido una sola vez: la clave de idempotencia lleva la fecha estimada', async () => {
    const vencido = bloque({
      expected_end_at: new Date(NOW.getTime() - 3_600_000),
    });
    const d = build({ late: [vencido] });
    expect((await d.service.run(NOW)).overdue).toBe(1);
    const evento = d.events.publish.mock.calls[0][1];
    expect(evento).toMatchObject({
      type: 'practice.care_space.block_overdue',
      aggregateId: 'block-1',
      uniqueRef: new Date(NOW.getTime() - 3_600_000).toISOString(),
      actorUserId: null,
    });
    expect(evento.payload.overdueMinutes).toBe(60);
    // el outbox responde «duplicado»: no se cuenta de nuevo
    d.events.publish.mockResolvedValue(false);
    expect((await d.service.run(NOW)).overdue).toBe(0);
  });
});
