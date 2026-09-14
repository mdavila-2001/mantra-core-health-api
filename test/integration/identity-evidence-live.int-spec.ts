/** Explicitly opt-in real LOCAL_TEST preparation/journey. Never part of normal suites.
 * No reset, schema sync, mocks, manual DDL or direct call to storage.delete. */
import { describe, it, expect } from '@jest/globals';
import {
  readFileSync,
  writeFileSync,
  existsSync,
  realpathSync,
  lstatSync,
} from 'node:fs';
import { createHash } from 'node:crypto';
import { ValidationPipe, type INestApplication } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  fixtureSpec as spec,
  createIdentityFixture,
} from './identity-evidence-fixture';
import type { IdentityLifecycleConfig } from '../../src/modules/identity_assurance/identity-evidence-lifecycle.config';

const proofPath = process.env.IDENTITY_7_2_LIVE_PROOF;
const suite = proofPath ? describe : describe.skip;
interface Proof {
  mode: 'inspect' | 'prepare' | 'execute-approved';
  source: { apiBaseSha: string; diffHash: string; upstreamSha: string };
  fixtureHash: string;
  networkId: string;
  approval?: import('../../src/common/storage/storage-lifecycle.protocol').LocalSyntheticDispositionGrant;
}
type Snapshot = Record<string, unknown[]>;
interface FixtureState {
  sourceHash: string;
  fixtureHash: string;
  config: IdentityLifecycleConfig;
  baseline: Snapshot;
}
const hash = (value: unknown) =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex');
const load = <T>(path: string): Promise<T> => import(path) as Promise<T>;
suite('7.2 explicit local synthetic real-stack journey', () => {
  it('proves stack, optionally prepares fixture, and dispatches only with separate source-bound approval', async () => {
    const proof = JSON.parse(readFileSync(proofPath!, 'utf8')) as Proof;
    expect(['inspect', 'prepare', 'execute-approved']).toContain(proof.mode);
    expect(process.env.ENVIRONMENT_CLASS).toBe('LOCAL_TEST');
    expect(process.env.DB_HOST).toBe('127.0.0.1');
    expect(process.env.DB_PORT).toBe('55492');
    expect(process.env.DB_NAME).toBe('identity_evidence_7_2_test');
    expect(process.env.FILE_STORAGE_ADAPTER).toBe('local');
    expect(hash(spec)).toBe(proof.fixtureHash);
    const storageRoot = process.env.FILE_STORAGE_LOCAL_DIR!;
    expect(realpathSync(storageRoot)).toBe(storageRoot);
    expect(lstatSync(storageRoot).isSymbolicLink()).toBe(false);
    expect(existsSync('/app/.env')).toBe(false);
    const { NestFactory } = await import('@nestjs/core');
    const { MikroORM } = await import('@mikro-orm/postgresql');
    const appPath = '../../src/app.module';
    const { AppModule } = (await import(
      appPath
    )) as typeof import('../../src/app.module');
    const { SeedBootstrapService } = await load<
      typeof import('../../src/common/seed/seed-bootstrap.service')
    >('../../src/common/seed/seed-bootstrap.service');
    const { FILE_STORAGE_ADAPTER } = await load<
      typeof import('../../src/common/storage/file-storage.adapter')
    >('../../src/common/storage/file-storage.adapter');
    const { StoragePublicationService } = await load<
      typeof import('../../src/common/storage/storage-publication.service')
    >('../../src/common/storage/storage-publication.service');
    const { IdentityEvidenceLifecycleService } = await load<
      typeof import('../../src/modules/identity_assurance/services/identity-evidence-lifecycle.service')
    >(
      '../../src/modules/identity_assurance/services/identity-evidence-lifecycle.service',
    );
    const { IdentityEvidenceStoragePurgeService } = await load<
      typeof import('../../src/modules/identity_assurance/services/identity-evidence-storage-purge.service')
    >(
      '../../src/modules/identity_assurance/services/identity-evidence-storage-purge.service',
    );
    const { StorageReferenceRepository } = await load<
      typeof import('../../src/common/storage/storage-reference.repository')
    >('../../src/common/storage/storage-reference.repository');
    const { withLocalSyntheticDispositionGrant } = await load<
      typeof import('../../src/common/storage/storage-lifecycle.protocol')
    >('../../src/common/storage/storage-lifecycle.protocol');
    const { TokenService } = await load<
      typeof import('../../src/common/auth/token.service')
    >('../../src/common/auth/token.service');
    let app: INestApplication | undefined;
    const boot = async () => {
      const instance = await NestFactory.create(AppModule, {
        logger: ['error'],
        abortOnError: false,
      });
      app = instance;
      instance.useGlobalPipes(
        new ValidationPipe({
          whitelist: true,
          forbidNonWhitelisted: true,
          transform: true,
          transformOptions: { enableImplicitConversion: true },
        }),
      );
      await instance.listen(53072, '127.0.0.1');
      return instance;
    };
    const snapshot = async (em: EntityManager): Promise<Snapshot> => {
      const output: Snapshot = {};
      const entries: [string, string[]][] = [
        ['directory.tenants', spec.tenantIds],
        ['iam.users', spec.ownerUserIds],
        ['directory.tenant_memberships', spec.membershipIds],
        [
          'identity_assurance.identity_verification_cases',
          spec.graphs.map((g) => g.caseId),
        ],
        [
          'identity_assurance.identity_evidence_records',
          spec.graphs.map((g) => g.evidenceId),
        ],
        ['common.files', spec.graphs.map((g) => g.fileId)],
        ['common.file_versions', spec.graphs.map((g) => g.versionId)],
        ['system_ops.legal_holds', [spec.hold.id]],
        [
          'audit.identity_verification_access_log',
          spec.auditBaseline.rows.map((r) => r.id),
        ],
      ];
      for (const [table, ids] of entries)
        output[table] = await em
          .getConnection('write')
          .execute(
            `SELECT * FROM ${table} WHERE id::text IN (SELECT jsonb_array_elements_text(?::jsonb)) ORDER BY id`,
            [JSON.stringify(ids)],
          );
      output.revisions = await em
        .getConnection('write')
        .execute(
          'SELECT * FROM system_ops.record_revisions WHERE record_id::text IN (SELECT jsonb_array_elements_text(?::jsonb)) ORDER BY id',
          [JSON.stringify(spec.graphs.map((g) => g.evidenceId))],
        );
      return output;
    };
    try {
      const initial = await boot();
      let em = initial.get(MikroORM).em.fork();
      const db = await em
        .getConnection('write')
        .execute<{ db: string }[]>('SELECT current_database() AS db');
      expect(db[0].db).toBe('identity_evidence_7_2_test');
      for (const table of [
        'identity_assurance.identity_verification_cases',
        'identity_assurance.identity_evidence_records',
        'common.files',
        'common.file_versions',
        'common.file_derivatives',
        'common.file_links',
        'system_ops.legal_holds',
        'system_ops.entity_registry',
        'system_ops.retention_policies',
        'system_ops.record_revisions',
        'messaging.message_queues',
        'messaging.queued_jobs',
        'audit.identity_verification_access_log',
        'profiles.jurisdiction_authorizations',
        'object_storage.object_versions',
        'audio_assets.audio_assets',
      ]) {
        const rows = await em
          .getConnection('write')
          .execute<{ present: string | null }[]>(
            'SELECT to_regclass(?)::text AS present',
            [table],
          );
        expect(rows[0].present).not.toBeNull();
      }
      const fk = await em
        .getConnection('write')
        .execute<{ definition: string; convalidated: boolean }[]>(
          "SELECT pg_get_constraintdef(oid) AS definition,convalidated FROM pg_constraint WHERE contype='f' AND conrelid='profiles.jurisdiction_authorizations'::regclass AND confrelid='common.files'::regclass",
        );
      expect(fk).toHaveLength(1);
      expect(fk[0].convalidated).toBe(true);
      expect(fk[0].definition).toContain('FOREIGN KEY (file_id)');
      const ready = await fetch('http://127.0.0.1:53072/readiness');
      expect(ready.status).toBe(200);
      const readiness = (await ready.json()) as {
        checks: Record<string, { status: string }>;
      };
      expect(
        Object.values(readiness.checks).every((item) => item.status === 'up'),
      ).toBe(true);
      const truth = {
        API_RUNTIME_SHA: 'UNCOMMITTED',
        API_RUNTIME_BASE_SHA: proof.source.apiBaseSha,
        API_RUNTIME_DIFF_HASH: proof.source.diffHash,
        API_PORT: 53072,
        DB_TARGET:
          'isolated Docker postgres / identity_evidence_7_2_test via container loopback:55492',
        STORAGE_TARGET: storageRoot,
        ENVIRONMENT_CLASS: 'LOCAL_TEST',
        MOCKS_ENABLED: false,
        MOCK_BACKEND_ENABLED: false,
        REAL_API_REACHED: true,
        PRODUCTION_ENDPOINT_PRESENT: false,
        DB_SCHEMA_COMPLETE: true,
        STORAGE_ISOLATED: true,
        FRONT_RUNTIME_SHA: 'NOT_RUNNING',
        networkId: proof.networkId,
        fk,
      };
      console.log(
        JSON.stringify({ RUNTIME_TRUTH: truth, FIXTURE_CREATED: false }),
      );
      writeFileSync(
        '/proof/runtime-truth.json',
        JSON.stringify(truth, null, 2),
        { flag: 'wx' },
      );
      if (proof.mode === 'inspect') return;
      let state: FixtureState;
      if (proof.mode === 'prepare') {
        expect(existsSync('/bundle/fixture-state.json')).toBe(false);
        const seeds = await initial.get(SeedBootstrapService).run();
        expect(seeds.failed).toBe(0);
        const config = await createIdentityFixture(
          em,
          initial.get(StoragePublicationService),
        );
        const baseline = await snapshot(em);
        state = {
          sourceHash: proof.source.diffHash,
          fixtureHash: proof.fixtureHash,
          config,
          baseline,
        };
        writeFileSync(
          '/bundle/fixture-state.json',
          JSON.stringify(state, null, 2),
          { flag: 'wx' },
        );
      } else {
        state = JSON.parse(
          readFileSync('/bundle/fixture-state.json', 'utf8'),
        ) as FixtureState;
        expect(state.fixtureHash).toBe(proof.fixtureHash);
        expect(state.sourceHash).toBe(proof.source.diffHash);
        expect(hash(await snapshot(em))).toBe(hash(state.baseline));
      }
      await initial.close();
      app = undefined;
      process.env.IDENTITY_EVIDENCE_LIFECYCLE_CONFIG = JSON.stringify(
        state.config,
      );
      const current = await boot();
      em = current.get(MikroORM).em.fork();
      const storage =
        current.get<
          import('../../src/common/storage/file-storage.adapter').FileStorageAdapter
        >(FILE_STORAGE_ADAPTER);
      for (const g of spec.graphs) {
        const presence = await storage.inspect!(
          `file://local/${g.object.sha256}`,
        );
        expect(presence.state).toBe('PRESENT');
        expect(
          createHash('sha256')
            .update(await storage.retrieve(`file://local/${g.object.sha256}`))
            .digest('hex'),
        ).toBe(g.object.sha256);
      }
      const lifecycle = current.get(IdentityEvidenceLifecycleService);
      const execute = (name: string) => {
        const g = spec.graphs.find((g) => g.name === name)!;
        return lifecycle.execute(
          g.evidenceId,
          g.tenantId,
          spec.evidenceTypeConceptCode,
          'PURGE',
        );
      };
      expect(await execute('hold')).toMatchObject({
        status: 'DENIED',
        reasonCode: 'LEGAL_HOLD_ACTIVE_OR_UNKNOWN',
      });
      expect(await execute('shared_a')).toMatchObject({
        status: 'DENIED',
        reasonCode: 'REFERENCES_BLOCKED_OR_UNKNOWN',
      });
      expect(await execute('non_target')).toMatchObject({
        status: 'DENIED',
        reasonCode: 'MISSING_OR_DUPLICATE_BINDING',
      });
      expect(await execute('target')).toMatchObject({
        status: 'DESTRUCTIVE_BOUNDARY',
        reasonCode: 'DESTRUCTIVE_RUNTIME_GATE_BLOCKED',
      });
      await em.transactional(async (tx) => {
        const refs = await current
          .get(StorageReferenceRepository)
          .snapshot(tx, [spec.graphs[0].fileId], [spec.graphs[0].versionId]);
        expect(refs.opaqueReferencesPresent).toBe(false);
        expect(refs.incomingReferences).toBeGreaterThan(0);
      });
      expect(hash(await snapshot(em))).toBe(hash(state.baseline));
      const token = current
        .get(TokenService)
        .signAccessToken(
          spec.ownerUserIds[0],
          spec.runId,
          ['SYSTEM'],
          [spec.tenantIds[0]],
        );
      const download = () =>
        fetch(
          `http://127.0.0.1:53072/common/files/${spec.graphs[0].fileId}/download-url`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'x-tenant-id': spec.tenantIds[0],
            },
          },
        );
      expect((await download()).status).toBeLessThan(300);
      if (proof.mode === 'prepare') {
        writeFileSync(
          '/proof/fixture-ready.json',
          JSON.stringify({
            contains_real_personal_data: false,
            guards: 'PASS',
            destructiveRuntimeExecuted: false,
          }),
          { flag: 'wx' },
        );
        return;
      }
      expect(proof.approval).toBeDefined();
      await withLocalSyntheticDispositionGrant(proof.approval!, async () => {
        expect(await execute('target')).toMatchObject({
          status: 'METADATA_RETIRED',
        });
        await current.get(IdentityEvidenceStoragePurgeService).review();
      });
      const after = await snapshot(em);
      for (const table of [
        'directory.tenants',
        'iam.users',
        'directory.tenant_memberships',
        'identity_assurance.identity_verification_cases',
        'system_ops.legal_holds',
        'audit.identity_verification_access_log',
      ])
        expect(hash(after[table])).toBe(hash(state.baseline[table]));
      for (const [table, id] of [
        [
          'identity_assurance.identity_evidence_records',
          spec.graphs[0].evidenceId,
        ],
        ['common.files', spec.graphs[0].fileId],
        ['common.file_versions', spec.graphs[0].versionId],
      ])
        expect(hash(after[table])).toBe(
          hash(
            state.baseline[table].filter(
              (row) => (row as { id: string }).id !== id,
            ),
          ),
        );
      expect(
        (await storage.inspect!(`file://local/${spec.graphs[0].object.sha256}`))
          .state,
      ).toBe('ABSENT');
      for (const g of spec.graphs.slice(1))
        expect(
          createHash('sha256')
            .update(await storage.retrieve(`file://local/${g.object.sha256}`))
            .digest('hex'),
        ).toBe(g.object.sha256);
      const revisions = after.revisions as {
        data_snapshot: { outcome: string };
      }[];
      expect(revisions.map((r) => r.data_snapshot.outcome).sort()).toEqual([
        'METADATA_RETIRED',
        'PURGED',
      ]);
      expect((await download()).status).toBeGreaterThanOrEqual(400);
      const completed = hash(after);
      await withLocalSyntheticDispositionGrant(proof.approval!, async () => {
        await execute('target');
        expect(
          (await current.get(IdentityEvidenceStoragePurgeService).review())
            .inspected,
        ).toBe(0);
      });
      expect(hash(await snapshot(em))).toBe(completed);
      writeFileSync(
        '/proof/journey-result.json',
        JSON.stringify({
          status: 'PASS',
          contains_real_personal_data: false,
          destructiveRuntimeExecuted: true,
          baselineHash: hash(state.baseline),
          afterHash: completed,
        }),
        { flag: 'wx' },
      );
    } finally {
      await app?.close();
    }
  }, 600_000);
});
