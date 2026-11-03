import 'dotenv/config';
import { MikroORM } from '@mikro-orm/postgresql';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ConflictException } from '../../src/common';
import { TerminologySeedService } from '../../src/common/seed/terminology-seed.service';
import { CONCEPTS } from '../../src/common/constants/concepts';
import { buildOrmConfig } from '../../src/orm/config/orm.config';
import { ACCT } from '../../src/modules/accounting/accounting.concepts';
import { AccountingErrorReason } from '../../src/modules/accounting/accounting.error-reasons';
import {
  AccountingControllingRepository,
  AccountsRepository,
  AccrualRepository,
  AssetRepository,
  FiscalRepository,
  JournalRepository,
  LiabilityRepository,
  SubledgerRepository,
} from '../../src/modules/accounting/repositories';
import { AccountingScopeService } from '../../src/modules/accounting/services/accounting-scope.service';
import { inTenant } from '../../src/modules/accounting/services/accounting-scope.testing';
import { LedgerService } from '../../src/modules/accounting/services/ledger.service';
import {
  assertDisposableResetTarget,
  assertPermanentResidueTarget,
  resolveResetTarget,
} from './disposable-database';

/**
 * Número de asiento único POR PRÁCTICA (ACC-02, API #778), contra la base real.
 *
 * La regla vive en la base —el índice único `(practice_id, transaction_number)`
 * de `accounting.journal_transactions`— y en la traducción de su violación a
 * `409 JOURNAL_TRANSACTION_NUMBER_ALREADY_EXISTS`; un doble no demostraría
 * ninguna de las dos. Se usan el `LedgerService`, el repositorio y el ORM
 * **reales** contra PostgreSQL; sólo se sustituyen la cadena de auditoría y la
 * resolución práctica→tenant, que son de otros módulos y tienen sus pruebas.
 *
 * Datos: sólo sintéticos (usuario, tenant, dos prácticas y sus cuentas, marcados
 * con `ACC02-<sufijo>`), creados y retirados por la prueba. Los conceptos que
 * faltan se materializan con el seed de terminología, como en el arranque.
 *
 * El bloque del parche cambia el índice de la tabla (lo devuelve al estado viejo
 * y aplica `2026-10-24_v4249_accounting_journal_number_per_practice.sql`), así que
 * es opt-in: exige `ALLOW_DESTRUCTIVE_DB_RESET=yes`, host local y una base
 * descartable (ver `disposable-database.ts`). Siempre termina con el parche
 * aplicado, que es el estado canónico del modelo.
 */
const PATCH_FILE = join(
  process.cwd(),
  'database/SQL/patches/2026-10-24_v4249_accounting_journal_number_per_practice.sql',
);
const NEW_INDEX = 'uq_journal_transactions_practice_id_transaction_number';
const OLD_INDEX = 'uq_journal_transactions_transaction_number';

const patchSuite =
  process.env.ALLOW_DESTRUCTIVE_DB_RESET === 'yes' ? describe : describe.skip;

describe('Número de asiento único por práctica (DB real)', () => {
  let orm: MikroORM;
  const mark = `ACC02-${randomUUID().slice(0, 8)}`;

  const ids = {
    user: randomUUID(),
    tenant: randomUUID(),
    practiceA: randomUUID(),
    practiceB: randomUUID(),
    accounts: {
      a1: randomUUID(),
      a2: randomUUID(),
      b1: randomUUID(),
      b2: randomUUID(),
    },
  };
  const practiceTenant: Record<string, string> = {
    [ids.practiceA]: ids.tenant,
    [ids.practiceB]: ids.tenant,
  };
  const actor = { id: ids.user, roles: ['SECURITY_ADMIN'] } as never;
  const logger = {
    setContext: () => undefined,
    info: () => undefined,
    warn: () => undefined,
    error: () => undefined,
  };
  let ledger: LedgerService;

  const run = (sql: string, params: unknown[] = []) =>
    orm.em.getConnection().execute(sql, params, 'run');
  const all = <T = Record<string, unknown>>(
    sql: string,
    params: unknown[] = [],
  ) => orm.em.getConnection().execute(sql, params, 'all') as Promise<T[]>;
  const sqlState = (error: unknown): string | undefined =>
    (error as { code?: string })?.code;
  const sqlConstraint = (error: unknown): string | undefined =>
    (error as { constraint?: string })?.constraint;

  async function rejected(promise: Promise<unknown>): Promise<any> {
    return promise.then(
      () => {
        throw new Error('debía rechazar');
      },
      (error: unknown) => error,
    );
  }

  /** Cuerpo de un asiento balanceado de dos líneas en la práctica indicada. */
  function body(practiceId: string, transactionNumber: string) {
    const [debit, credit] =
      practiceId === ids.practiceA
        ? [ids.accounts.a1, ids.accounts.a2]
        : [ids.accounts.b1, ids.accounts.b2];
    return {
      practiceId,
      transactionNumber,
      transactionDate: '2026-01-31',
      lines: [
        { accountId: debit, direction: 'DEBIT', amount: '100.00' },
        { accountId: credit, direction: 'CREDIT', amount: '100.00' },
      ],
    } as never;
  }

  /** Filas de cabecera de una práctica con ese número, por SQL directo. */
  const headers = (practiceId: string, number: string) =>
    all<{ id: string }>(
      `select id from accounting.journal_transactions
        where practice_id = ? and transaction_number = ?`,
      [practiceId, number],
    );

  /** Cabecera mínima por SQL directo (para el bloque del parche). */
  const insertHeader = (practiceId: string, number: string) =>
    run(
      `insert into accounting.journal_transactions
         (id, practice_id, transaction_number, transaction_type_concept_id,
          transaction_date, status_concept_id, created_at, updated_at)
       values (?, ?, ?, ?, '2026-01-31', ?, now(), now())`,
      [
        randomUUID(),
        practiceId,
        number,
        ACCT.TXN_TYPE_STANDARD,
        ACCT.TXN_POSTED,
      ],
    );

  const indexNames = async () =>
    (
      await all<{ indexname: string }>(
        `select indexname from pg_indexes
          where schemaname = 'accounting' and tablename = 'journal_transactions'
            and indexname like 'uq\\_%'
          order by indexname`,
      )
    ).map((r) => r.indexname);

  beforeAll(async () => {
    // Antes de abrir una conexión: la prueba crea y retira un tenant sintético y
    // deja historial de asientos en `audit.*`, que en una base con WORM no se
    // puede borrar. No corre contra una base compartida. No envía SQL.
    assertPermanentResidueTarget(resolveResetTarget(process.env), process.env);

    // Las globs de entidades apuntan a `dist/`; en jest se descubren desde `src/`.
    orm = await MikroORM.init({
      ...buildOrmConfig(),
      entities: ['src/modules/**/entities/*.entity.ts'],
    });

    const needed = [
      ACCT.TXN_TYPE_STANDARD,
      ACCT.TXN_DRAFT,
      ACCT.TXN_POSTED,
      ACCT.DIRECTION_DEBIT,
      ACCT.DIRECTION_CREDIT,
      CONCEPTS.USER_ACTIVE,
    ];
    const [{ n }] = await all<{ n: number }>(
      `select count(*)::int as n from terminology.catalog_concepts where id in (${needed.map(() => '?').join(', ')})`,
      needed,
    );
    if (n < needed.length) {
      await new TerminologySeedService(orm, logger as never).run();
    }

    const any = ACCT.TXN_POSTED;
    await run(
      `insert into iam.users (id, status_concept_id, display_name, created_at, updated_at)
       values (?, ?, ?, now(), now())`,
      [ids.user, CONCEPTS.USER_ACTIVE, mark],
    );
    await run(
      `insert into directory.tenants
         (id, code, tenant_type_concept_id, legal_name, legal_entity_type_concept_id,
          status_concept_id, verification_status_concept_id, created_at, updated_at)
       values (?, ?, ?, ?, ?, ?, ?, now(), now())`,
      [ids.tenant, mark, any, mark, any, any, any],
    );
    for (const [practice, suffix] of [
      [ids.practiceA, 'A'],
      [ids.practiceB, 'B'],
    ]) {
      await run(
        `insert into practice.practices
           (id, tenant_id, code, name, type_concept_id, admin_user_id, status_concept_id, created_at, updated_at)
         values (?, ?, ?, ?, ?, ?, ?, now(), now())`,
        [practice, ids.tenant, `${mark}-${suffix}`, mark, any, ids.user, any],
      );
    }
    for (const [account, practice, code] of [
      [ids.accounts.a1, ids.practiceA, 'A1'],
      [ids.accounts.a2, ids.practiceA, 'A2'],
      [ids.accounts.b1, ids.practiceB, 'B1'],
      [ids.accounts.b2, ids.practiceB, 'B2'],
    ]) {
      await run(
        `insert into accounting.accounts
           (id, practice_id, code, name, account_type_concept_id, normal_balance_concept_id,
            is_configurable, is_postable, status_concept_id, created_at, updated_at)
         values (?, ?, ?, ?, ?, ?, false, true, ?, now(), now())`,
        [account, practice, `${mark}-${code}`, mark, any, any, any],
      );
    }

    const lookup = {
      findTenantOfPractice: async (practiceId: string) =>
        practiceTenant[practiceId] ?? null,
      findActivePracticeIdsForPractitioner: async () => [],
    } as never;
    const journalRepo = new JournalRepository();
    const accountsRepo = new AccountsRepository();
    const scope = new AccountingScopeService(
      lookup,
      accountsRepo,
      new FiscalRepository(),
      journalRepo,
      new AccountingControllingRepository(),
      new SubledgerRepository(),
      new AccrualRepository(),
      new AssetRepository(),
      new LiabilityRepository(),
    );
    ledger = inTenant(
      new LedgerService(
        orm.em as never,
        journalRepo,
        accountsRepo,
        { record: async () => undefined } as never,
        lookup,
        scope,
        logger as never,
      ),
      ids.tenant,
    );
  });

  /**
   * Retira todo asiento de las dos prácticas sintéticas, con su historial, sus
   * líneas y sus asignaciones, en el orden que piden las FK.
   */
  async function purgeJournal(): Promise<void> {
    const practices = [ids.practiceA, ids.practiceB];
    const marks = practices.map(() => '?').join(', ');
    const own = `select id from accounting.journal_transactions where practice_id in (${marks})`;
    await run(
      `delete from audit.journal_transactions_history where journal_transaction_id in (${own})`,
      practices,
    );
    await run(
      `delete from accounting.journal_entry_assignments
        where ledger_entry_id in (
          select id from accounting.ledger_entries where transaction_id in (${own}))`,
      practices,
    );
    await run(
      `delete from accounting.ledger_entries where transaction_id in (${own})`,
      practices,
    );
    await run(
      `delete from accounting.journal_transactions where practice_id in (${marks})`,
      practices,
    );
  }

  afterAll(async () => {
    if (!orm) return;
    const practices = [ids.practiceA, ids.practiceB];
    const marks = practices.map(() => '?').join(', ');
    await purgeJournal();
    await run(
      `delete from accounting.accounts where practice_id in (${marks})`,
      practices,
    );
    await run(
      `delete from practice.practices where id in (${marks})`,
      practices,
    );
    await run('delete from directory.tenants where id = ?', [ids.tenant]);
    await run('delete from iam.users where id = ?', [ids.user]);
    await orm.close(true);
  });

  describe('forma del índice en la base', () => {
    it('la unicidad es (practice_id, transaction_number) y el índice global ya no existe', async () => {
      expect(await indexNames()).toEqual([NEW_INDEX]);
      const [row] = await all<{ columns: string }>(
        `select string_agg(a.attname, ',' order by k.ord) as columns
           from pg_index i
           join pg_class c on c.oid = i.indexrelid
           join pg_namespace n on n.oid = c.relnamespace
           cross join lateral unnest(i.indkey) with ordinality as k(attnum, ord)
           join pg_attribute a on a.attrelid = i.indrelid and a.attnum = k.attnum
          where n.nspname = 'accounting' and c.relname = ?
          group by i.indisunique`,
        [NEW_INDEX],
      );
      expect(row.columns).toBe('practice_id,transaction_number');
    });
  });

  describe('LedgerService.postJournal', () => {
    it('el mismo número en dos prácticas distintas se acepta en ambas', async () => {
      const number = `${mark}-DOS-PRACTICAS`;

      const a = await ledger.postJournal(body(ids.practiceA, number), actor);
      const b = await ledger.postJournal(body(ids.practiceB, number), actor);

      expect(a.transactionNumber).toBe(number);
      expect(b.transactionNumber).toBe(number);
      expect(a.id).not.toBe(b.id);
      expect(await headers(ids.practiceA, number)).toHaveLength(1);
      expect(await headers(ids.practiceB, number)).toHaveLength(1);
    });

    it('el mismo número dos veces en la misma práctica responde 409 y no deja una segunda cabecera', async () => {
      const number = `${mark}-MISMA-PRACTICA`;
      await ledger.postJournal(body(ids.practiceA, number), actor);

      const error = await rejected(
        ledger.postJournal(body(ids.practiceA, number), actor),
      );

      expect(error).toBeInstanceOf(ConflictException);
      expect(error.getStatus()).toBe(409);
      expect(error.reason).toBe(
        AccountingErrorReason.JOURNAL_TRANSACTION_NUMBER_ALREADY_EXISTS,
      );
      expect(error.details).toEqual({ transactionNumber: number });
      expect(await headers(ids.practiceA, number)).toHaveLength(1);
    });

    it('el borrador respeta la misma regla: otra práctica sí, la misma no', async () => {
      const number = `${mark}-BORRADOR`;
      await ledger.createDraft(body(ids.practiceA, number), actor);

      await expect(
        ledger.createDraft(body(ids.practiceB, number), actor),
      ).resolves.toMatchObject({ transactionNumber: number });
      const error = await rejected(
        ledger.createDraft(body(ids.practiceA, number), actor),
      );

      expect(error.reason).toBe(
        AccountingErrorReason.JOURNAL_TRANSACTION_NUMBER_ALREADY_EXISTS,
      );
    });

    it('dos altas simultáneas del mismo número en una práctica: una entra y la otra responde 409 catalogado', async () => {
      const number = `${mark}-CARRERA`;

      const outcomes = await Promise.allSettled([
        ledger.postJournal(body(ids.practiceB, number), actor),
        ledger.postJournal(body(ids.practiceB, number), actor),
      ]);

      const won = outcomes.filter((o) => o.status === 'fulfilled');
      const lost = outcomes.filter(
        (o): o is PromiseRejectedResult => o.status === 'rejected',
      );
      expect(won).toHaveLength(1);
      expect(lost).toHaveLength(1);
      expect(lost[0].reason).toBeInstanceOf(ConflictException);
      expect(lost[0].reason.reason).toBe(
        AccountingErrorReason.JOURNAL_TRANSACTION_NUMBER_ALREADY_EXISTS,
      );
      expect(await headers(ids.practiceB, number)).toHaveLength(1);
    });
  });

  describe('violación en la base sin pasar por el servicio', () => {
    it('el duplicado dentro de la práctica es 23505 contra el índice por práctica; en otra práctica entra', async () => {
      const number = `${mark}-SQL`;
      await insertHeader(ids.practiceA, number);

      await insertHeader(ids.practiceB, number);
      const error = await rejected(insertHeader(ids.practiceA, number));

      expect(sqlState(error)).toBe('23505');
      expect(sqlConstraint(error)).toBe(NEW_INDEX);
    });
  });

  patchSuite('parche 2026-10-24 sobre una base con el índice global', () => {
    const patch = readFileSync(PATCH_FILE, 'utf8');
    const duplicates = () =>
      all(
        `select practice_id, transaction_number, count(*)
           from accounting.journal_transactions
          group by 1, 2 having count(*) > 1`,
      );

    beforeAll(async () => {
      assertDisposableResetTarget(resolveResetTarget(process.env), process.env);
      // El índice global sólo se puede recrear sin asientos repetidos entre
      // prácticas, y los de los casos anteriores lo están a propósito.
      await purgeJournal();
    });

    // Pase lo que pase, la base queda en el estado canónico del modelo.
    afterAll(async () => {
      await run(patch);
    });

    it('antes del parche el mismo número en otra práctica falla; el parche se aplica dos veces sin error y lo habilita', async () => {
      const number = `${mark}-PARCHE`;
      await run(`drop index if exists accounting."${NEW_INDEX}"`);
      await run(
        `create unique index "${OLD_INDEX}" on accounting.journal_transactions (transaction_number)`,
      );
      expect(await indexNames()).toEqual([OLD_INDEX]);
      expect(await duplicates()).toEqual([]);

      await insertHeader(ids.practiceA, number);
      const before = await rejected(insertHeader(ids.practiceB, number));
      expect(sqlState(before)).toBe('23505');
      expect(sqlConstraint(before)).toBe(OLD_INDEX);

      await run(patch);
      await run(patch);

      expect(await indexNames()).toEqual([NEW_INDEX]);
      await insertHeader(ids.practiceB, number);
      expect(await duplicates()).toEqual([]);
      const after = await rejected(insertHeader(ids.practiceB, number));
      expect(sqlState(after)).toBe('23505');
      expect(sqlConstraint(after)).toBe(NEW_INDEX);
    });
  });
});
