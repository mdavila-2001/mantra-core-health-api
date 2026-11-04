import { randomUUID } from 'node:crypto';
import { MikroORM, type EntityManager } from '@mikro-orm/postgresql';

/**
 * E1 (RLS fork) against a real PostgreSQL: an argument-less `fork()` joins the
 * transaction of its caller, so it keeps the tenant context and the role.
 *
 * No residue: the owner opens ONE transaction, switches to `mantra_app` with
 * `SET LOCAL ROLE`, and the whole run ends in ROLLBACK. Nothing is written and
 * no schema, role or row is touched.
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

type Probe = { pid: number; tenant: string | null };

const PROBE_SQL =
  "select pg_backend_pid() as pid, current_setting('app.current_tenant_id', true) as tenant";

suite('E1 · fork() inherits the request transaction (RLS)', () => {
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
      discovery: { warnWhenNoEntities: false },
    });
  });

  afterAll(async () => {
    await orm?.close(true);
  });

  /** Runs `body` inside one owner transaction and always rolls it back. */
  async function inRolledBackTransaction(
    body: (tx: EntityManager) => Promise<void>,
  ): Promise<void> {
    try {
      await orm.em.fork().transactional(async (tx) => {
        await body(tx);
        throw new Rollback();
      });
    } catch (error) {
      if (!(error instanceof Rollback)) throw error;
    }
  }

  async function probe(em: EntityManager): Promise<Probe> {
    const [row] = await em.execute<Probe[]>(PROBE_SQL);
    return row;
  }

  it('fork() sees the same connection and tenant; fork(false) does not', async () => {
    const tenant = '00000000-0000-4000-8000-0000000000e1';
    let own: Probe | undefined;
    let viaRoot: Probe | undefined;
    let viaTx: Probe | undefined;
    let viaNested: Probe | undefined;
    let mine: Probe | undefined;
    await inRolledBackTransaction(async (tx) => {
      await tx.execute("select set_config('app.current_tenant_id', ?, true)", [
        tenant,
      ]);
      mine = await probe(tx);
      viaRoot = await probe(orm.em.fork());
      viaTx = await probe(tx.fork());
      viaNested = await probe(tx.fork().fork());
      own = await probe(tx.fork({ keepTransactionContext: false }));
    });

    expect(viaRoot).toEqual(mine);
    expect(viaTx).toEqual(mine);
    expect(viaNested).toEqual(mine);
    expect(mine?.tenant).toBe(tenant);
    expect(own?.pid).not.toBe(mine?.pid);
    expect(own?.tenant ?? '').toBe('');
  });

  it('a failed savepoint does not abort the outer transaction', async () => {
    let afterwards: unknown;
    let swallowed = false;
    await inRolledBackTransaction(async (tx) => {
      try {
        await tx
          .fork({ keepTransactionContext: true })
          .transactional((savepoint) => savepoint.execute('select 1/0'));
      } catch {
        swallowed = true;
      }
      afterwards = await tx.execute('select 1 as ok');
    });

    expect(swallowed).toBe(true);
    expect(afterwards).toEqual([{ ok: 1 }]);
  });

  it('a deferred fork does not join a savepoint of a finished transaction', async () => {
    let insideSavepoint: EntityManager | undefined;
    let whileLive: boolean | undefined;
    await inRolledBackTransaction(async (tx) => {
      await tx.fork({ keepTransactionContext: true }).transactional((sp) => {
        insideSavepoint = sp;
        whileLive = sp.fork().getTransactionContext() !== undefined;
      });
    });

    expect(whileLive).toBe(true);
    // The root is over, but its savepoint handle was never marked: the guard
    // has to look at the root.
    const late = insideSavepoint!.fork();
    expect(late.getTransactionContext()).toBeUndefined();
    await expect(late.execute('select 1 as ok')).resolves.toEqual([{ ok: 1 }]);
  });

  it('as mantra_app, the inherited fork sees the fixture row under forced RLS', async () => {
    const tenantId = randomUUID();
    const debtId = randomUUID();
    const seen: Record<'fork' | 'otherTenant' | 'ownConnection', number> = {
      fork: -1,
      otherTenant: -1,
      ownConnection: -1,
    };

    const countFixture = async (em: EntityManager) => {
      const [row] = await em.execute<{ n: number }[]>(
        'select count(*)::int as n from payments.payment_debts where id = ?',
        [debtId],
      );
      return row.n;
    };

    await inRolledBackTransaction(async (tx) => {
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
          `E1-${debtId.slice(0, 8)}`,
          randomUUID(),
        ],
      );
      await tx.execute("set local session_replication_role = 'origin'");
      await tx.execute('set local role mantra_app');
      await tx.execute(
        "select set_config('app.system_context', 'false', true)",
      );
      await tx.execute("select set_config('app.current_tenant_id', ?, true)", [
        tenantId,
      ]);

      seen.fork = await countFixture(tx.fork());
      // Another connection cannot see the uncommitted row at all.
      seen.ownConnection = await countFixture(
        tx.fork({ keepTransactionContext: false }),
      );
      await tx.execute("select set_config('app.current_tenant_id', ?, true)", [
        randomUUID(),
      ]);
      seen.otherTenant = await countFixture(tx.fork());
    });

    expect(seen.fork).toBe(1);
    expect(seen.otherTenant).toBe(0);
    expect(seen.ownConnection).toBe(0);
  });
});
