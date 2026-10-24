import {
  assertDestructiveRuntimeAuthorized,
  withLocalSyntheticDispositionGrant,
  type LocalSyntheticDispositionGrant,
} from './storage-lifecycle.protocol';

// Pure capability tests. No DB, filesystem, HTTP listener or native storage.
const keys = [
  'NODE_ENV',
  'ENVIRONMENT_CLASS',
  'DB_HOST',
  'DB_PORT',
  'DB_NAME',
  'FILE_STORAGE_ADAPTER',
  'FILE_STORAGE_LOCAL_DIR',
  'API_RUNTIME_BASE_SHA',
  'API_RUNTIME_DIFF_HASH',
];
let previous: Record<string, string | undefined>;
const grant = (): LocalSyntheticDispositionGrant => ({
  authorization: 'ENDER_APPROVED_7_2_SYNTHETIC_E2E',
  runId: '07200000-0000-4000-8000-000000000001',
  sourceSha: 'a'.repeat(40),
  diffHash: 'b'.repeat(64),
  fixtureHash: 'c'.repeat(64),
  expiresAt: Date.now() + 60_000,
  evidenceIds: ['07200000-0000-4000-8000-000000000301'],
  storageUris: [
    'file://local/608be925e4325484d28391eb8f89f660cd74e298fd6320bf6f992378d31a1911',
  ],
});
beforeEach(() => {
  previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  Object.assign(process.env, {
    NODE_ENV: 'test',
    ENVIRONMENT_CLASS: 'LOCAL_TEST',
    DB_HOST: '127.0.0.1',
    DB_PORT: '55492',
    DB_NAME: 'identity_evidence_7_2_test',
    FILE_STORAGE_ADAPTER: 'local',
    FILE_STORAGE_LOCAL_DIR: `/synthetic/mantra-7.2-${grant().runId}/objects`,
    API_RUNTIME_BASE_SHA: 'a'.repeat(40),
    API_RUNTIME_DIFF_HASH: 'b'.repeat(64),
  });
});
afterEach(() => {
  for (const key of keys)
    if (previous[key] === undefined) delete process.env[key];
    else process.env[key] = previous[key];
});
describe('explicit, narrowly scoped local synthetic runtime grant', () => {
  it('environment settings alone never authorize destruction', () => {
    expect(() =>
      assertDestructiveRuntimeAuthorized(grant().evidenceIds[0]),
    ).toThrow('DESTRUCTIVE_RUNTIME_GATE_BLOCKED');
  });
  it('only the approved target is allowed, and only while the action is active', async () => {
    const input = grant();
    let late!: () => void;
    await withLocalSyntheticDispositionGrant(input, async () => {
      assertDestructiveRuntimeAuthorized(input.evidenceIds[0]);
      assertDestructiveRuntimeAuthorized(input.storageUris[0]);
      expect(() => assertDestructiveRuntimeAuthorized()).toThrow(
        'DESTRUCTIVE_RUNTIME_GATE_BLOCKED',
      );
      expect(() =>
        assertDestructiveRuntimeAuthorized(
          '07200000-0000-4000-8000-000000000302',
        ),
      ).toThrow('DESTRUCTIVE_RUNTIME_GATE_BLOCKED');
      late = () => assertDestructiveRuntimeAuthorized(input.evidenceIds[0]);
    });
    expect(late).toThrow('DESTRUCTIVE_RUNTIME_GATE_BLOCKED');
  });
  it.each([
    'DB_HOST',
    'DB_PORT',
    'DB_NAME',
    'NODE_ENV',
    'ENVIRONMENT_CLASS',
    'FILE_STORAGE_LOCAL_DIR',
    'API_RUNTIME_DIFF_HASH',
  ])('mismatched %s denies before callback', async (key) => {
    process.env[key] = 'NOT_LOCAL_OR_NOT_APPROVED';
    let entered = false;
    await expect(
      withLocalSyntheticDispositionGrant(grant(), async () => {
        entered = true;
      }),
    ).rejects.toThrow('DESTRUCTIVE_RUNTIME_GATE_BLOCKED');
    expect(entered).toBe(false);
  });
  it('expiry and extended allowlists are never interpreted as an authorization', async () => {
    for (const input of [
      { ...grant(), expiresAt: 0 },
      { ...grant(), evidenceIds: [...grant().evidenceIds, 'other'] },
      { ...grant(), storageUris: ['s3://external/unsafe'] },
    ])
      await expect(
        withLocalSyntheticDispositionGrant(input, async () => undefined),
      ).rejects.toThrow('DESTRUCTIVE_RUNTIME_GATE_BLOCKED');
  });
  it('a changed environment, mutable caller grant or nested call cannot expand scope', async () => {
    const input = grant();
    await withLocalSyntheticDispositionGrant(input, async () => {
      input.evidenceIds.push('other');
      expect(() => assertDestructiveRuntimeAuthorized('other')).toThrow();
      await expect(
        withLocalSyntheticDispositionGrant(grant(), async () => undefined),
      ).rejects.toThrow();
      process.env.DB_HOST = 'external';
      expect(() =>
        assertDestructiveRuntimeAuthorized(input.evidenceIds[0]),
      ).toThrow();
    });
  });
  it('revokes inherited async contexts after the approved scope finishes', async () => {
    let release!: () => void;
    let late!: Promise<void>;
    await withLocalSyntheticDispositionGrant(grant(), async () => {
      late = new Promise<void>((resolve) => {
        release = resolve;
      }).then(() => {
        expect(() =>
          assertDestructiveRuntimeAuthorized(grant().evidenceIds[0]),
        ).toThrow('DESTRUCTIVE_RUNTIME_GATE_BLOCKED');
      });
    });
    release();
    await late;
  });
});
