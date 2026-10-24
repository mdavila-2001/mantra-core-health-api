import { MikroORM, type EntityManager } from '@mikro-orm/postgresql';
import { randomUUID } from 'node:crypto';
import {
  StorageReferenceRepository,
  bindStorageReferenceIds,
} from '../../src/common/storage/storage-reference.repository';
import {
  IdentityEvidenceLifecycleRepository,
  type IdentityEvidenceGraph,
} from '../../src/modules/identity_assurance/repositories/identity-evidence-lifecycle.repository';
import { StorageReferenceResolver } from '../../src/common/storage/storage-reference-resolver.service';
import type { FileStorageAdapter } from '../../src/common/storage/file-storage.adapter';

// Read-only reuse of the explicitly preserved synthetic unblocker DB. No DDL,
// inserts, cleanup, application bootstrap, storage adapter or destructive gate mock.
const pgTest =
  process.env.STORAGE_REFERENCE_PG_TEST === 'synthetic-readonly'
    ? describe
    : describe.skip;
pgTest('storage reference binding / real PostgreSQL incoming FK', () => {
  let orm: MikroORM;
  let sharedId: string;
  let singleId: string;
  let fixtureTenant: string;
  const repository = new StorageReferenceRepository();
  const target = {
    kind: 'KNOWN' as const,
    protocolVersion: 1 as const,
    bindingRevision: 'synthetic-only',
    backendIdentity: 'synthetic-only',
    physicalContainer: 'not-a-real-bucket',
    exactObjectKey: 'no-physical-io',
    versionSelector: { kind: 'UNVERSIONED' as const },
  };

  beforeAll(async () => {
    orm = await MikroORM.init({
      host: '127.0.0.1',
      port: 55482,
      user: 'unblocker_test',
      password: 'synthetic-local-only',
      dbName: 'unblocker_fileid_r2_clean',
      ensureDatabase: false,
      entities: [],
      discovery: { warnWhenNoEntities: false },
      pool: { min: 0, max: 2 },
      driverOptions: {
        connectionTimeoutMillis: 15000,
        query_timeout: 15000,
        statement_timeout: 15000,
      },
    });
    await readOnly(async (tx) => {
      const proof = await tx.getConnection().execute(
        `SELECT current_database() AS db,
        current_user AS role, current_setting('transaction_read_only') AS read_only`,
        [],
        'all',
        tx.getTransactionContext(),
      );
      expect(proof).toEqual([
        {
          db: 'unblocker_fileid_r2_clean',
          role: 'unblocker_test',
          read_only: 'on',
        },
      ]);
      const safe = await tx.getConnection().execute(
        `SELECT
        (SELECT bool_and(license_number LIKE 'SYNTHETIC-%') FROM profiles.jurisdiction_authorizations) AS licenses,
        (SELECT bool_and(original_name = 'SYNTHETIC-NO-PERSONAL-DATA.pdf') FROM common.files) AS files,
        (SELECT bool_and(storage_uri LIKE 'synthetic://unblocker/%') FROM common.file_versions) AS versions`,
        [],
        'all',
        tx.getTransactionContext(),
      );
      expect(safe).toEqual([{ licenses: true, files: true, versions: true }]);
      const refs = await tx.getConnection().execute(
        `SELECT a.file_id, f.tenant_id, count(*)::int AS count
        FROM profiles.jurisdiction_authorizations a JOIN common.files f ON f.id = a.file_id
        GROUP BY a.file_id, f.tenant_id ORDER BY a.file_id`,
        [],
        'all',
        tx.getTransactionContext(),
      );
      sharedId = refs.find((r) => r.count === 2)?.file_id as string;
      singleId = refs.find((r) => r.count === 1)?.file_id as string;
      fixtureTenant = refs.find((r) => r.file_id === sharedId)
        ?.tenant_id as string;
      expect(sharedId).toBeDefined();
      expect(singleId).toBeDefined();
      expect(fixtureTenant).toBeDefined();
    });
  });
  afterAll(async () => {
    if (orm) await orm.close(true);
  });

  async function readOnly<T>(
    work: (tx: EntityManager) => Promise<T>,
  ): Promise<T> {
    return orm.em.fork().transactional(async (tx) => {
      await tx
        .getConnection()
        .execute(
          'SET TRANSACTION READ ONLY',
          [],
          'all',
          tx.getTransactionContext(),
        );
      return work(tx);
    });
  }

  // The preserved DB intentionally contains only three canonical tables. Other
  // producer/opaque scans are controlled empty doubles; catalog/visibility and
  // reference-count SQL are executed by the REAL repository on REAL PostgreSQL.
  // This certifies array binding, NOT a complete lifecycle graph or a safe purge.
  function counterTransaction(tx: EntityManager): EntityManager {
    return {
      getTransactionContext: () => tx.getTransactionContext(),
      getConnection: () => ({
        execute: async (
          sql: string,
          params: unknown[],
          method: 'all',
          context: unknown,
        ) => {
          if (sql.includes('AS present')) return [{ present: false }];
          if (sql.includes('AS source')) return [];
          if (
            !sql.includes('pg_roles') &&
            !sql.includes('pg_constraint') &&
            !sql.includes('SELECT count(*)::text')
          )
            throw new Error(
              'Unexpected query outside the read-only binding test',
            );
          return tx
            .getConnection('write')
            .execute(sql, params, method, context as never);
        },
      }),
    } as unknown as EntityManager;
  }

  it('reproduces 22P02 with the old native JS-array binding (read-only)', async () => {
    await expect(
      readOnly((tx) =>
        tx
          .getConnection('write')
          .execute(
            'SELECT count(*) FROM profiles.jurisdiction_authorizations WHERE file_id = ANY(?::uuid[])',
            [[sharedId]],
            'all',
            tx.getTransactionContext(),
          ),
      ),
    ).rejects.toMatchObject({ code: '22P02' });
  });

  it('discovers the real validated FK to common.files, not a table-name exception', async () => {
    await readOnly(async (tx) => {
      const fk = await tx.getConnection().execute(
        `SELECT c.convalidated,
        pg_get_constraintdef(c.oid) AS definition FROM pg_constraint c
        WHERE c.conrelid = 'profiles.jurisdiction_authorizations'::regclass
          AND c.conname = 'fk_jurisdiction_authorizations_file_id'`,
        [],
        'all',
        tx.getTransactionContext(),
      );
      expect(fk).toEqual([
        {
          convalidated: true,
          definition: 'FOREIGN KEY (file_id) REFERENCES common.files(id)',
        },
      ]);
    });
  });

  it.each(['empty', 'single', 'multiple', 'duplicate', 'zero'] as const)(
    '%s IDs execute without 22P02 and count correctly',
    async (mode) => {
      const inputs = {
        empty: [],
        single: [sharedId],
        multiple: [sharedId, singleId],
        duplicate: [sharedId, sharedId],
        zero: [randomUUID()],
      };
      const expected = {
        empty: 0,
        single: 2,
        multiple: 3,
        duplicate: 2,
        zero: 0,
      };
      await readOnly(async (tx) => {
        const snapshot = await repository.snapshot(
          counterTransaction(tx),
          inputs[mode],
          [],
        );
        expect(snapshot.incomingReferences).toBe(expected[mode]);
      });
    },
  );

  it('a different tenant context cannot hide physical references owned by the fixture tenant', async () => {
    const otherTenant = randomUUID();
    expect(otherTenant).not.toBe(fixtureTenant);
    await readOnly(async (tx) => {
      await tx
        .getConnection()
        .execute(
          "SELECT set_config('app.tenant_id', ?, true)",
          [otherTenant],
          'all',
          tx.getTransactionContext(),
        );
      const snapshot = await repository.snapshot(
        counterTransaction(tx),
        [sharedId, singleId],
        [],
      );
      expect(snapshot.incomingReferences).toBe(3);
      expect(
        new StorageReferenceResolver(
          repository,
          {} as FileStorageAdapter,
        ).evaluate(target, snapshot),
      ).toEqual({ state: 'REFERENCED', validReferenceCount: 3 });
    });
  });

  it.each(['empty', 'single', 'multiple'] as const)(
    'round-trips %s UUID arrays through the shared binder',
    async (mode) => {
      const ids =
        mode === 'empty'
          ? []
          : mode === 'single'
            ? [sharedId]
            : [sharedId, singleId];
      await readOnly(async (tx) => {
        const rows = await tx
          .getConnection()
          .execute(
            'SELECT ?::uuid[] AS ids',
            [bindStorageReferenceIds(ids)],
            'all',
            tx.getTransactionContext(),
          );
        expect(rows).toEqual([{ ids }]);
      });
    },
  );

  it('the lifecycle planner discovers the same real FK before metadata retirement', async () => {
    const graph = {
      evidence: { id: randomUUID() },
      files: [{ id: sharedId }, { id: singleId }],
      versions: [],
      derivatives: [],
    } as unknown as IdentityEvidenceGraph;
    await readOnly(async (tx) => {
      expect(
        await new IdentityEvidenceLifecycleRepository().externalIncoming(
          tx,
          graph,
        ),
      ).toBe(3);
    });
  });

  it('ANY plus ALL preserves exclusion semantics using two independent scalar array parameters', async () => {
    await readOnly(async (tx) => {
      const query = (sql: string, params: unknown[]) =>
        tx
          .getConnection()
          .execute(sql, params, 'all', tx.getTransactionContext());
      const rows = await query(
        'SELECT id FROM profiles.jurisdiction_authorizations WHERE file_id = ANY(?::uuid[]) ORDER BY id',
        [bindStorageReferenceIds([sharedId, singleId])],
      );
      expect(rows).toHaveLength(3);
      const counts = await query(
        'SELECT count(*)::int AS count FROM profiles.jurisdiction_authorizations WHERE file_id = ANY(?::uuid[]) AND id <> ALL(?::uuid[])',
        [
          bindStorageReferenceIds([sharedId, singleId]),
          bindStorageReferenceIds([rows[0].id, rows[1].id]),
        ],
      );
      expect(counts).toEqual([{ count: 1 }]);
    });
  });

  it.each(
    [null, {}, [123], [null], ['not-uuid'], Array(1)].map((value) => [value]),
  )('invalid value/type %j returns UNKNOWN, not ZERO', async (invalid) => {
    await readOnly(async (tx) => {
      const decision = await new StorageReferenceResolver(
        repository,
        {} as FileStorageAdapter,
      ).resolve(counterTransaction(tx), target, invalid as string[], []);
      expect(decision).toEqual({
        state: 'UNKNOWN',
        reasonCode: 'REFERENCE_STATE_UNKNOWN',
      });
    });
  });
});
