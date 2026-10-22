import { jest } from '@jest/globals';
import type { EntityManager } from '@mikro-orm/postgresql';
import { StorageReferenceRepository } from './storage-reference.repository';
import { StorageReferenceResolver } from './storage-reference-resolver.service';
import type { FileStorageAdapter } from './file-storage.adapter';

const fileId = '10000000-0000-4000-8000-000000000001';
const versionId = '20000000-0000-4000-8000-000000000002';

function build() {
  const execute = jest
    .fn<
      (
        sql: string,
        params: unknown[],
        method: string,
        context: unknown,
      ) => Promise<unknown[]>
    >()
    .mockImplementation(async (sql) => {
      if (sql.includes('pg_roles'))
        return [{ primary: true, global_visibility: true }];
      if (sql.includes('AS present')) return [{ present: false }];
      if (sql.includes('pg_constraint'))
        return [
          {
            schema_name: 'common',
            table_name: 'file_derivatives',
            column_name: 'source_file_version_id',
            target: 'file_versions',
            columns: 1,
          },
        ];
      if (sql.includes('count(*)')) return [{ count: '1' }];
      return [];
    });
  const context = { synthetic: true };
  const tx = {
    getTransactionContext: () => context,
    getConnection: () => ({ execute }),
  } as unknown as EntityManager;
  return { execute, tx, context, repository: new StorageReferenceRepository() };
}
describe('storage reference queries against a controlled metadata recorder', () => {
  it('scans all producers without tenant/status/version filters and counts incoming FK edges', async () => {
    const test = build();
    const result = await test.repository.snapshot(
      test.tx,
      [fileId],
      [versionId],
    );
    expect(result.incomingReferences).toBe(1);
    const queries = test.execute.mock.calls.map((call) => call[0]).join('\n');
    expect(queries).toContain('FROM common.file_versions');
    expect(queries).toContain('FROM audio_assets.audio_assets');
    expect(queries).toContain('FROM object_storage.object_locations');
    expect(queries).toContain('cross_store_consistency.deletion_targets');
    expect(queries).toContain(
      'EXISTS (SELECT 1 FROM object_storage.multipart_uploads)',
    );
    expect(queries).not.toMatch(
      /tenant_id\s*=|deleted_at\s+IS|latest\s*=|LIMIT/i,
    );
    expect(
      test.execute.mock.calls.every((call) => call[3] === test.context),
    ).toBe(true);
  });
  it('refuses a replica or restricted RLS view before counting', async () => {
    const test = build();
    test.execute.mockResolvedValueOnce([
      { primary: true, global_visibility: false },
    ]);
    await expect(test.repository.snapshot(test.tx, [], [])).rejects.toThrow(
      'GLOBAL_REFERENCE_VISIBILITY_UNPROVEN',
    );
    expect(test.execute).toHaveBeenCalledTimes(1);
  });
  it('does not convert malformed/missing count or composite FK to zero', async () => {
    const test = build();
    const original = test.execute.getMockImplementation()!;
    test.execute.mockImplementation(async (sql, ...args) =>
      sql.includes('pg_constraint')
        ? [
            {
              schema_name: 'common',
              table_name: 'files',
              column_name: 'id',
              target: 'files',
              columns: 2,
            },
          ]
        : original(sql, ...args),
    );
    await expect(
      test.repository.snapshot(test.tx, [fileId], []),
    ).rejects.toThrow('REFERENCE_CATALOG_UNKNOWN');
  });

  it.each([
    [[], null],
    [[versionId], `{${versionId}}`],
    [[versionId, fileId], `{${versionId},${fileId}}`],
  ])(
    'binds %j as one scalar UUID array (empty skips count)',
    async (ids, expected) => {
      const test = build();
      await test.repository.snapshot(test.tx, [], ids as string[]);
      const count = test.execute.mock.calls.filter(([sql]) =>
        sql.includes('count(*)'),
      );
      if (expected === null) expect(count).toHaveLength(0);
      else {
        expect(count).toHaveLength(1);
        expect(count[0][1]).toEqual([expected]);
        expect(count[0][0]).toContain('ANY(?::uuid[])');
      }
    },
  );

  it.each(
    [
      null,
      {},
      'uuid',
      [null],
      [123],
      [true],
      [''],
      ['not-a-uuid'],
      [`${fileId},${versionId}`],
      ['NULL'],
      [[fileId]],
      Array(1),
      ['00000000-0000-0000-0000-000000000000} OR true --'],
    ].map((invalid) => [invalid]),
  )(
    'invalid array/element %j fails closed, even without a matching version edge',
    async (invalid) => {
      const test = build();
      const resolver = new StorageReferenceResolver(
        test.repository,
        {} as FileStorageAdapter,
      );
      const result = await resolver.resolve(
        test.tx,
        {
          kind: 'KNOWN',
          protocolVersion: 1,
          bindingRevision: 'synthetic',
          backendIdentity: 'test',
          physicalContainer: 'test',
          exactObjectKey: 'test',
          versionSelector: { kind: 'UNVERSIONED' },
        },
        invalid as string[],
        [],
      );
      expect(result).toEqual({
        state: 'UNKNOWN',
        reasonCode: 'REFERENCE_STATE_UNKNOWN',
      });
      expect(test.execute).not.toHaveBeenCalled();
      await expect(
        test.repository.snapshot(test.tx, [], invalid as string[]),
      ).rejects.toThrow('REFERENCE_STATE_UNKNOWN');
    },
  );

  it('snapshots binding before awaits, so caller mutation cannot change the counted IDs', async () => {
    const test = build();
    const ids = [versionId];
    const pending = test.repository.snapshot(test.tx, [], ids);
    ids[0] = fileId;
    await pending;
    expect(
      test.execute.mock.calls.find(([sql]) => sql.includes('count(*)'))?.[1],
    ).toEqual([`{${versionId}}`]);
  });
});
