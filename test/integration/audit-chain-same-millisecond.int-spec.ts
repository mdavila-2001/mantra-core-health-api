import { jest } from '@jest/globals';
import pg from 'pg';
import { CONCEPTS, SEED } from '../../src/common';
import { AuditLogRepository } from '../../src/modules/audit/repositories/audit-log.repository';
import { bootstrapTestApp, type TestContext } from './harness';

/**
 * The WORM chain keeps one unambiguous order when several seals of the same
 * partition happen in the same millisecond (one transaction leaves several):
 * every link has a strictly later `recorded_at` than the previous one and
 * hangs from it. `audit.audit_log` is append-only, so the rows this test
 * leaves are permanent; they live in a throwaway tenant partition marked by
 * `entity`.
 */
const DB = {
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5434),
  user: process.env.DB_USER ?? 'mantra',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME ?? 'mantra_redesa_health',
};

describe('cadena de auditoría: asientos en el mismo milisegundo (DB real)', () => {
  let ctx: TestContext;
  let db: pg.Client;

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    db = new pg.Client(DB);
    await db.connect();
  });

  afterAll(async () => {
    await db.end();
    await ctx.app.close();
  });

  it('tres asientos de una transacción forman una cadena sin empates de instante', async () => {
    const repo = ctx.app.get(AuditLogRepository);
    const mark = `chain_probe_${Date.now()}`;
    const em = ctx.orm.em.fork();
    // Only `Date` is frozen: the clock reads the same millisecond for every
    // seal, the case that made the tip ambiguous. Timers keep running.
    jest.useFakeTimers({
      now: new Date(),
      doNotFake: [
        'setTimeout',
        'clearTimeout',
        'setInterval',
        'clearInterval',
        'setImmediate',
        'clearImmediate',
        'nextTick',
        'queueMicrotask',
        'performance',
        'hrtime',
        'requestAnimationFrame',
        'cancelAnimationFrame',
        'requestIdleCallback',
        'cancelIdleCallback',
      ],
    });
    try {
      await em.transactional(async (tx) => {
        for (let i = 0; i < 3; i += 1) {
          await repo.append(tx, {
            userId: SEED.systemWorkerUserId,
            tenantId: SEED.tenantId,
            action: 'CHAIN_PROBE',
            entity: mark,
            outcomeConceptId: CONCEPTS.OUTCOME_SUCCESS,
          });
          await tx.flush();
        }
      });
    } finally {
      jest.useRealTimers();
    }

    const { rows } = await db.query<{
      record_hash: string;
      previous_hash: string | null;
      recorded_at: Date;
    }>(
      `select record_hash, previous_hash, recorded_at from audit.audit_log
        where entity = $1 order by recorded_at, id`,
      [mark],
    );
    expect(rows).toHaveLength(3);
    expect(rows[1].previous_hash).toBe(rows[0].record_hash);
    expect(rows[2].previous_hash).toBe(rows[1].record_hash);
    expect(rows[1].recorded_at.getTime()).toBeGreaterThan(
      rows[0].recorded_at.getTime(),
    );
    expect(rows[2].recorded_at.getTime()).toBeGreaterThan(
      rows[1].recorded_at.getTime(),
    );
  });
});
