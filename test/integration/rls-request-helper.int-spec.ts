import { randomUUID } from 'node:crypto';
import { MikroORM, type EntityManager } from '@mikro-orm/postgresql';
import pg from 'pg';

/**
 * E3: `withTenantRls` and `readWithSystemRls` (`src/common/tenant/rls-transaction.ts`)
 * run for real, through MikroORM, against forced RLS.
 *
 * The ORM connects as the runtime role (`DB_APP_USER`, no BYPASSRLS), so RLS applies
 * to the helper's own fork (`keepTransactionContext: false`), which is exactly what a
 * guard or an `@TenantAgnostic` route gets. A second plain `pg` client connects as the
 * owner only to seed and remove the fixture: two `payments.payment_debts` rows
 * (tenant A and tenant B), COMMITTED because the helper reads on another connection,
 * and deleted in `afterAll` (and defensively in `beforeAll`). Foreign keys are skipped
 * only for the seeding transaction, as the fixture references nothing real.
 *
 * Connection data comes ONLY from explicit variables: `DB_HOST`, `DB_PORT`, `DB_NAME`,
 * `DB_USER`, `DB_PASSWORD` (owner) and `DB_APP_USER`, `DB_APP_PASSWORD` (runtime role).
 * The repository dotenv is neutralised on purpose. If any is missing, including
 * `DB_APP_PASSWORD`, the whole suite is skipped.
 */
const REQUIRED = [
  'DB_HOST',
  'DB_PORT',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
  'DB_APP_USER',
  'DB_APP_PASSWORD',
];
const explicit = Object.fromEntries(
  REQUIRED.map((key) => [key, process.env[key]]),
) as Record<string, string | undefined>;
const suite = REQUIRED.every((key) => !!explicit[key])
  ? describe
  : describe.skip;

const TENANT_A = randomUUID();
const TENANT_B = randomUUID();
const TENANT_OTHER = randomUUID();
const DEBT_A = randomUUID();
const DEBT_B = randomUUID();

const INSERT_DEBT = `insert into payments.payment_debts
  (id, tenant_id, gateway_connection_id, debtor_business_partner_id,
   internal_debt_number, currency_code, total_amount, outstanding_amount,
   due_at, status_concept_id, created_at, updated_at)
 values (?, ?, ?, ?, ?, 'BOB', '1.000000', '1.000000',
         now() + interval '7 days', ?, now(), now())`;

/** The same statement with `pg` placeholders, for the owner client. */
let placeholder = 0;
const INSERT_DEBT_PG = INSERT_DEBT.replace(/\?/g, () => `$${++placeholder}`);

suite('E3 · withTenantRls / readWithSystemRls under forced RLS', () => {
  let orm: MikroORM;
  let owner: pg.Client;
  let helpers: typeof import('../../src/common/tenant/rls-transaction');
  const previousEnforce = process.env.RLS_ENFORCE;

  const countFixture = async (em: EntityManager): Promise<number> => {
    const [row] = await em.execute<{ n: number }[]>(
      'select count(*)::int as n from payments.payment_debts where id in (?, ?)',
      [DEBT_A, DEBT_B],
    );
    return row.n;
  };
  const removeFixture = () =>
    owner.query('delete from payments.payment_debts where id = any($1)', [
      [DEBT_A, DEBT_B],
    ]);

  beforeAll(async () => {
    process.env.DOTENV_CONFIG_PATH = 'no-such-file.env';
    process.env.RLS_ENFORCE = 'true';
    // Variable paths: a relative `import()` without extension does not resolve
    // under `moduleResolution: nodenext`.
    const configPath: string = '../../src/orm/config/orm.config';
    const envPath: string = '../../src/orm/config/orm.env';
    const helperPath: string = '../../src/common/tenant/rls-transaction';
    const { buildOrmConfig } = (await import(
      configPath
    )) as typeof import('../../src/orm/config/orm.config');
    const { loadOrmEnv } = (await import(
      envPath
    )) as typeof import('../../src/orm/config/orm.env');
    helpers = (await import(
      helperPath
    )) as typeof import('../../src/common/tenant/rls-transaction');

    orm = await MikroORM.init({
      ...buildOrmConfig(loadOrmEnv({ ...explicit })),
      entities: [],
      entitiesTs: [],
      metadataCache: { enabled: false },
      discovery: { warnWhenNoEntities: false },
    });

    owner = new pg.Client({
      host: explicit.DB_HOST,
      port: Number(explicit.DB_PORT),
      database: explicit.DB_NAME,
      user: explicit.DB_USER,
      password: explicit.DB_PASSWORD,
    });
    await owner.connect();
    await removeFixture();
    await owner.query('BEGIN');
    await owner.query("set local session_replication_role = 'replica'");
    for (const [id, tenant] of [
      [DEBT_A, TENANT_A],
      [DEBT_B, TENANT_B],
    ]) {
      await owner.query(INSERT_DEBT_PG, [
        id,
        tenant,
        randomUUID(),
        randomUUID(),
        `E3-${id.slice(0, 8)}`,
        randomUUID(),
      ]);
    }
    await owner.query('COMMIT');
  });

  afterAll(async () => {
    try {
      await removeFixture();
    } finally {
      await owner?.end();
      await orm?.close(true);
      if (previousEnforce === undefined) delete process.env.RLS_ENFORCE;
      else process.env.RLS_ENFORCE = previousEnforce;
    }
  });

  it('the runtime role sees nothing without a context (the problem)', async () => {
    expect(await countFixture(orm.em.fork())).toBe(0);
  });

  it('withTenantRls sees only the rows of its own tenant', async () => {
    expect(await helpers.withTenantRls(orm.em, TENANT_A, countFixture)).toBe(1);
    expect(await helpers.withTenantRls(orm.em, TENANT_B, countFixture)).toBe(1);
    expect(
      await helpers.withTenantRls(orm.em, TENANT_OTHER, countFixture),
    ).toBe(0);
  });

  it('withTenantRls { readOnly } still reads its tenant', async () => {
    expect(
      await helpers.withTenantRls(orm.em, TENANT_A, countFixture, {
        readOnly: true,
      }),
    ).toBe(1);
  });

  it('a plain fork() inside the work inherits the helper transaction (E1)', async () => {
    expect(
      await helpers.withTenantRls(orm.em, TENANT_A, (tx) =>
        countFixture(tx.fork()),
      ),
    ).toBe(1);
  });

  it('readWithSystemRls reads every tenant', async () => {
    expect(await helpers.readWithSystemRls(orm.em, countFixture)).toBe(2);
  });

  it('readWithSystemRls rejects a write: the transaction is READ ONLY', async () => {
    const id = randomUUID();
    await expect(
      helpers.readWithSystemRls(orm.em, (tx) =>
        tx.execute(INSERT_DEBT, [
          id,
          TENANT_A,
          randomUUID(),
          randomUUID(),
          `E3-${id.slice(0, 8)}`,
          randomUUID(),
        ]),
      ),
    ).rejects.toThrow(/read-only transaction/i);
    const [row] = await owner
      .query<{ n: number }>(
        'select count(*)::int as n from payments.payment_debts where id = $1',
        [id],
      )
      .then((r) => r.rows);
    expect(row.n).toBe(0);
  });

  it('withTenantRls { readOnly } also rejects a write', async () => {
    const id = randomUUID();
    await expect(
      helpers.withTenantRls(
        orm.em,
        TENANT_A,
        (tx) =>
          tx.execute(INSERT_DEBT, [
            id,
            TENANT_A,
            randomUUID(),
            randomUUID(),
            `E3-${id.slice(0, 8)}`,
            randomUUID(),
          ]),
        { readOnly: true },
      ),
    ).rejects.toThrow(/read-only transaction/i);
  });
});
