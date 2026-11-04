import { randomUUID } from 'node:crypto';
import { MikroORM, type EntityManager } from '@mikro-orm/postgresql';

/**
 * Raw SQL and the request transaction (RLS tenant context), against a real DB.
 *
 * With the real MikroORM of the API, proves that:
 *   1. `em.execute(...)` (global em and transactional em) runs on the
 *      transaction connection: as `mantra_app`, with the tenant set, it sees a
 *      fixture row that is still uncommitted, and a foreign tenant does not.
 *   2. `em.getConnection().execute(...)` without a `ctx` argument leaves the
 *      transaction: another pool connection, so the uncommitted row is not
 *      there. This is why the lint rule forbids it. Passing
 *      `em.getTransactionContext()` as `ctx` is the equivalent explicit form.
 * If `em.execute` stopped using the transaction, case 1 would read 0 and fail.
 *
 * No residue: the owner opens ONE transaction, switches to `mantra_app` with
 * `SET LOCAL ROLE`, and the whole run ends in ROLLBACK. The fixture row goes in
 * `payments.payment_debts` (forced RLS) and is rolled back with it.
 *
 * The connection comes ONLY from explicit variables (DB_HOST, DB_PORT, DB_USER,
 * DB_PASSWORD, DB_NAME). The repository dotenv is neutralised on purpose so a
 * remote `.env` can never be picked up by accident; if any variable is missing
 * the whole spec is skipped.
 */
const REQUIRED = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const explicit = Object.fromEntries(
  REQUIRED.map((key) => [key, process.env[key]]),
) as Record<string, string | undefined>;
const configured = REQUIRED.every((key) => !!explicit[key]);

const suite = configured ? describe : describe.skip;

/** Thrown at the end of the transaction to force the ROLLBACK. */
class Rollback extends Error {}

suite('Raw SQL keeps the request transaction (RLS)', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    // Keep the repository dotenv from loading a remote .env, and drop any
    // runtime role: the owner connects, then switches role inside the tx.
    process.env.DOTENV_CONFIG_PATH = 'no-such-file.env';
    for (const key of ['DB_APP_USER', 'DB_APP_PASSWORD', 'DB_ROLE_PURPOSE']) {
      delete process.env[key];
    }
    // Variable paths: a relative `import()` without extension does not resolve
    // under `moduleResolution: nodenext`.
    const configPath: string = '../../src/orm/config/orm.config';
    const envPath: string = '../../src/orm/config/orm.env';
    const { buildOrmConfig } = (await import(
      configPath
    )) as typeof import('../../src/orm/config/orm.config');
    const { loadOrmEnv } = (await import(
      envPath
    )) as typeof import('../../src/orm/config/orm.env');
    const env = loadOrmEnv(
      Object.fromEntries(REQUIRED.map((key) => [key, explicit[key]])),
    );
    orm = await MikroORM.init({
      ...buildOrmConfig(env),
      entities: [],
      entitiesTs: [],
      metadataCache: { enabled: false },
      // At least two connections: the transaction one and a pool one.
      pool: { min: 0, max: 3 },
      discovery: { warnWhenNoEntities: false },
    });
  });

  afterAll(async () => {
    await orm?.close(true);
  });

  it('em.execute sees the uncommitted tenant row; getConnection() without ctx does not', async () => {
    const tenantId = randomUUID();
    const debtId = randomUUID();
    const seen: Record<
      'global' | 'tx' | 'withCtx' | 'withoutCtx' | 'otherTenant',
      number
    > = { global: -1, tx: -1, withCtx: -1, withoutCtx: -1, otherTenant: -1 };

    const sql =
      'select count(*)::int as n from payments.payment_debts where id = ?';
    const count = async (run: Promise<{ n: number }[]>) => (await run)[0].n;

    try {
      await orm.em.transactional(async (tx: EntityManager) => {
        // As owner. Foreign keys are skipped for this transaction only: the
        // fixture is rolled back and references nothing real.
        await tx.execute("set local session_replication_role = 'replica'");
        await tx.execute(
          `insert into payments.payment_debts
             (id, tenant_id, gateway_connection_id, debtor_business_partner_id,
              internal_debt_number, currency_code, total_amount,
              outstanding_amount, due_at, status_concept_id, created_at,
              updated_at)
           values (?, ?, ?, ?, ?, 'BOB', '1.000000', '1.000000',
                   now() + interval '7 days', ?, now(), now())`,
          [
            debtId,
            tenantId,
            randomUUID(),
            randomUUID(),
            `E2-${debtId.slice(0, 8)}`,
            randomUUID(),
          ],
        );
        await tx.execute("set local session_replication_role = 'origin'");
        await tx.execute('set local role mantra_app');
        await tx.execute(
          "select set_config('app.system_context', 'false', true)",
        );
        await tx.execute(
          "select set_config('app.current_tenant_id', ?, true)",
          [tenantId],
        );

        // The global em resolves the transaction through its async context.
        seen.global = await count(
          orm.em.execute<{ n: number }[]>(sql, [debtId]),
        );
        seen.tx = await count(tx.execute<{ n: number }[]>(sql, [debtId]));
        // The shape the lint rule forbids: no `ctx` argument.
        seen.withoutCtx = await count(
          orm.em.getConnection().execute<{ n: number }[]>(sql, [debtId], 'all'),
        );
        // The equivalent explicit form.
        seen.withCtx = await count(
          orm.em
            .getConnection()
            .execute<{ n: number }[]>(
              sql,
              [debtId],
              'all',
              tx.getTransactionContext(),
            ),
        );
        await tx.execute(
          "select set_config('app.current_tenant_id', ?, true)",
          [randomUUID()],
        );
        seen.otherTenant = await count(
          orm.em.execute<{ n: number }[]>(sql, [debtId]),
        );
        throw new Rollback();
      });
    } catch (error) {
      if (!(error instanceof Rollback)) throw error;
    }

    expect(seen.global).toBe(1);
    expect(seen.tx).toBe(1);
    expect(seen.withCtx).toBe(1);
    // Another pool connection never sees the uncommitted row.
    expect(seen.withoutCtx).toBe(0);
    expect(seen.otherTenant).toBe(0);
  });
});
