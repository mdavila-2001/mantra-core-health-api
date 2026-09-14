// Offline validation / supported canonical bootstrap preparation. No cleanup,
// schema shortcuts, fixture reuse or destructive execution mode.
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
export const ROOT = fileURLToPath(new URL('../../../', import.meta.url));
export const UPSTREAM_COMMIT = '7c4d99fb183e1726aa291065194e99249f3501b2';
export const REQUIRED_TABLES = [
  'identity_assurance.identity_verification_cases',
  'identity_assurance.identity_evidence_records',
  'common.files',
  'common.file_versions',
  'common.file_derivatives',
  'common.file_links',
  'system_ops.legal_holds',
  'system_ops.entity_registry',
  'system_ops.retention_policies',
  'system_ops.field_registry',
  'system_ops.anonymization_rules',
  'system_ops.record_revisions',
  'messaging.message_queues',
  'messaging.queued_jobs',
  'audit.identity_verification_access_log',
  'profiles.jurisdiction_authorizations',
];
export const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const git = (...args) =>
  execFileSync('git', args, {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  }).trim();
const requireFact = (value, reason) => {
  if (!value) throw new Error(reason);
};
export function validateFixture(spec) {
  requireFact(
    spec.contains_real_personal_data === false && spec.schemaVersion === 1,
    'FIXTURE_PROVENANCE_UNKNOWN',
  );
  requireFact(
    spec.runId === '07200000-0000-4000-8000-000000000001',
    'FIXTURE_RUN_UNKNOWN',
  );
  requireFact(
    spec.graphs.length === 5 &&
      new Set(spec.graphs.map((g) => g.name)).size === 5,
    'FIXTURE_GRAPH_INCOMPLETE',
  );
  const ids = [
    ...spec.tenantIds,
    ...spec.ownerUserIds,
    ...spec.membershipIds,
    spec.hold.id,
  ];
  requireFact(
    spec.tenantIds.length === 2 &&
      spec.ownerUserIds.length === 2 &&
      spec.membershipIds.length === 2,
    'TENANT_CONTROL_MISSING',
  );
  for (const graph of spec.graphs) {
    ids.push(graph.caseId, graph.evidenceId, graph.fileId, graph.versionId);
    const index = spec.tenantIds.indexOf(graph.tenantId);
    requireFact(
      index >= 0 &&
        graph.subjectId === graph.tenantId &&
        graph.ownerUserId === spec.ownerUserIds[index],
      'FIXTURE_OWNERSHIP_INVALID',
    );
    const name =
      graph.name === 'non_target'
        ? 'no-target'
        : graph.name.startsWith('shared_')
          ? 'shared'
          : graph.name;
    requireFact(
      graph.object.bytesUtf8 === `SYNTHETIC|7.2|${spec.runId}|${name}`,
      'NON_SYNTHETIC_BYTES',
    );
    const digest = hash(Buffer.from(graph.object.bytesUtf8, 'utf8'));
    requireFact(
      graph.object.sha256 === digest &&
        graph.object.keyRelativeToVerifiedRoot ===
          `${digest.slice(0, 2)}/${digest}`,
      'FIXTURE_HASH_MISMATCH',
    );
    requireFact(
      graph.externalReference === null && graph.consentId === null,
      'EXTERNAL_FIXTURE_REFERENCE',
    );
    const audit = spec.auditBaseline.rows.filter(
      (row) => row.verificationCaseId === graph.caseId,
    );
    requireFact(
      audit.length === 1 && audit[0].actorUserId === graph.ownerUserId,
      'AUDIT_BASELINE_MISSING',
    );
    ids.push(audit[0].id);
  }
  requireFact(
    ids.every((id) => /^07200000-0000-4000-8000-000000000\d{3}$/.test(id)) &&
      new Set(ids).size === ids.length,
    'FIXTURE_ID_COLLISION',
  );
  const [a, b] = ['shared_a', 'shared_b'].map((name) =>
    spec.graphs.find((g) => g.name === name),
  );
  requireFact(
    a && b && a.tenantId !== b.tenantId && a.object.sha256 === b.object.sha256,
    'SHARED_CONTROL_INVALID',
  );
  const held = spec.graphs.find((g) => g.name === 'hold');
  requireFact(
    spec.anonymizationTest?.evidenceId === spec.graphs[0].evidenceId &&
      spec.anonymizationTest.column === 'evidence_identifier_hash' &&
      spec.anonymizationTest.syntheticIdentifier ===
        'SYNTHETIC-7.2-IDENTIFIER-NOT-A-PERSON' &&
      spec.anonymizationTest.storageDisposition === 'PRESERVE',
    'ANONYMIZATION_CONTROL_INVALID',
  );
  requireFact(
    spec.hold.targetId === held.caseId &&
      spec.hold.tenantId === held.tenantId &&
      spec.hold.endsAt === null &&
      spec.hold.status === 'CONCEPTS.STATE_ACTIVE',
    'HOLD_CONTROL_INVALID',
  );
  return {
    status: 'PASS',
    contains_real_personal_data: false,
    graphs: 5,
    tenants: 2,
    objects: 4,
    auditRows: 5,
    recordIds: ids.length,
  };
}
export function sourceProof() {
  git('merge-base', '--is-ancestor', UPSTREAM_COMMIT, 'origin/dev');
  const upstreamSha = git('rev-parse', 'origin/dev');
  const patch = git(
    'show',
    `${upstreamSha}:database/SQL/patches/2026-09-13_v4212_jurisdiction_authorizations_file_id.sql`,
  );
  requireFact(
    patch.includes('FOREIGN KEY ("file_id")') &&
      patch.includes('REFERENCES "common"."files" ("id")'),
    'UPSTREAM_SCHEMA_UNPROVEN',
  );
  const integrationBaseSha = git('merge-base', 'HEAD', 'origin/dev');
  const ownPaths = [
    ...new Set(
      [
        ...git('diff', '--name-only', integrationBaseSha).split('\n'),
        ...git('ls-files', '--others', '--exclude-standard').split('\n'),
      ].filter(Boolean),
    ),
  ].sort();
  // Hash the executable snapshot even when the slice is already committed.
  // A clean tree must not produce an empty runtime provenance manifest.
  const paths = [
    ...new Set(
      [
        ...git(
          'ls-files',
          '--',
          'src',
          'test',
          'tools',
          'tsconfig.json',
          'tsconfig.build.json',
          '.swcrc',
        ).split('\n'),
        ...ownPaths.filter((path) => /^(src|test|tools)\//.test(path)),
      ].filter(Boolean),
    ),
  ].sort();
  const files = paths.map((path) => ({
    path,
    sha256: hash(readFileSync(join(ROOT, path))),
  }));
  const upstreamFiles = git(
    'diff',
    '--name-only',
    `${integrationBaseSha}..origin/dev`,
  ).split('\n');
  const overlap = ownPaths.filter((path) => upstreamFiles.includes(path));
  requireFact(overlap.length === 0, `UPSTREAM_OVERLAP:${overlap.join(',')}`);
  return {
    apiBaseSha: git('rev-parse', 'HEAD'),
    integrationBaseSha,
    upstreamSha,
    upstreamCommit: UPSTREAM_COMMIT,
    diffHash: hash(JSON.stringify(files)),
    files,
    upstreamOverlap: overlap,
  };
}
export function validateProjectName(project) {
  requireFact(
    /^mantra-7-2-synthetic(?:-[a-z0-9-]{1,24})?$/.test(project),
    'PROJECT_NOT_SCOPED_TO_SYNTHETIC_7_2',
  );
  return project;
}
export function composeSpec(bundle, project = 'mantra-7-2-synthetic') {
  const labels = { 'mantra.synthetic-only': 'true', 'mantra.task': '7.2' };
  const environment = {
    POSTGRES_DB: 'identity_evidence_7_2_test',
    POSTGRES_USER: 'identity_7_2_test',
    POSTGRES_PASSWORD: 'SYNTHETIC-LOCAL-ONLY-7.2',
  };
  return {
    name: validateProjectName(project),
    services: {
      postgres: {
        image: 'timescale/timescaledb-ha:pg18',
        environment,
        labels,
        ports: ['127.0.0.1:55492:5432'],
        volumes: ['pg_data:/home/postgres/pgdata/data'],
        healthcheck: {
          test: [
            'CMD-SHELL',
            'pg_isready -U identity_7_2_test -d identity_evidence_7_2_test',
          ],
          interval: '5s',
          timeout: '5s',
          retries: 20,
        },
      },
      'postgres-init': {
        image: 'timescale/timescaledb-ha:pg18',
        environment,
        labels,
        restart: 'no',
        entrypoint: ['bash', '/init/bin/init-postgres.sh'],
        volumes: [
          `${bundle}/database/SQL:/init/SQL:ro`,
          `${bundle}/database/NoSQL:/init/NoSQL:ro`,
          `${bundle}/docker/db-init:/init/bin:ro`,
        ],
        depends_on: { postgres: { condition: 'service_healthy' } },
      },
      mongodb: {
        image: 'mongo:8.2.12',
        labels,
        ports: ['127.0.0.1:57092:27017'],
        volumes: ['mongo_data:/data/db'],
      },
      redis: {
        image: 'redis:8.10-alpine',
        labels,
        ports: ['127.0.0.1:56392:6379'],
        volumes: ['redis_data:/data'],
      },
      opensearch: {
        image: 'opensearchproject/opensearch:3.8.0',
        labels,
        ports: ['127.0.0.1:59292:9200'],
        environment: {
          'discovery.type': 'single-node',
          DISABLE_INSTALL_DEMO_CONFIG: 'true',
          DISABLE_SECURITY_PLUGIN: 'true',
          OPENSEARCH_JAVA_OPTS: '-Xms512m -Xmx512m',
        },
        volumes: ['search_data:/usr/share/opensearch/data'],
      },
    },
    networks: { default: { internal: true } },
    volumes: {
      pg_data: { labels },
      mongo_data: { labels },
      redis_data: { labels },
      search_data: { labels },
    },
  };
}
function main() {
  const spec = JSON.parse(
    readFileSync(
      join(ROOT, 'test/fixtures/identity-evidence-lifecycle.json'),
      'utf8',
    ),
  );
  const fixture = validateFixture(spec);
  const mode = process.argv[2] ?? '--validate';
  const project = validateProjectName(
    process.argv[3] ?? 'mantra-7-2-synthetic',
  );
  requireFact(
    ['--validate', '--prepare'].includes(mode),
    'Usage: node tools/e2e/identity-evidence/prepare.mjs --validate|--prepare [mantra-7-2-synthetic-<suffix>]',
  );
  const source = sourceProof();
  if (mode === '--validate') {
    console.log(
      JSON.stringify(
        {
          fixture,
          source: { ...source, files: source.files.length },
          runtimeExecuted: false,
        },
        null,
        2,
      ),
    );
    return;
  }
  const docker = (...args) =>
    execFileSync('docker', args, { encoding: 'utf8' }).trim();
  requireFact(
    docker(
      'ps',
      '-aq',
      '--filter',
      `label=com.docker.compose.project=${project}`,
    ) === '',
    'EXISTING_STACK_DO_NOT_REUSE',
  );
  requireFact(
    docker('volume', 'ls', '-q', '--filter', `name=${project}_`) === '',
    'EXISTING_VOLUME_DO_NOT_REUSE',
  );
  requireFact(
    docker('network', 'ls', '-q', '--filter', `name=${project}_default`) === '',
    'EXISTING_NETWORK_DO_NOT_REUSE',
  );
  const directory = mkdtempSync(join(tmpdir(), 'mantra-7.2-'));
  const bundle = join(directory, 'canonical');
  mkdirSync(bundle);
  const archive = join(directory, 'canonical.tar');
  execFileSync(
    'git',
    [
      'archive',
      `--output=${archive}`,
      source.upstreamSha,
      'database/SQL',
      'database/NoSQL',
      'docker/db-init',
    ],
    { cwd: ROOT },
  );
  execFileSync('tar', ['-xf', archive, '-C', bundle]);
  const storageRoot = join(directory, `mantra-7.2-${spec.runId}`, 'objects');
  mkdirSync(storageRoot, { recursive: true });
  const compose = join(directory, 'compose.json');
  writeFileSync(
    compose,
    JSON.stringify(composeSpec(bundle.replaceAll('\\', '/'), project), null, 2),
    { flag: 'wx' },
  );
  const manifest = {
    project,
    source,
    fixture,
    fixtureHash: hash(JSON.stringify(spec)),
    directory,
    compose,
    storageRoot,
    db: {
      host: '127.0.0.1',
      port: 55492,
      database: 'identity_evidence_7_2_test',
    },
    API_PORT: 53072,
    ENVIRONMENT_CLASS: 'LOCAL_TEST',
    mocks: false,
    fixtureCreated: false,
    runtimeExecuted: false,
  };
  writeFileSync(
    join(directory, 'preparation.json'),
    JSON.stringify(manifest, null, 2),
    { flag: 'wx' },
  );
  console.log(
    JSON.stringify(
      {
        directory,
        compose,
        storageRoot,
        source: { ...source, files: source.files.length },
        fixture,
        nextCommand: [
          'docker',
          'compose',
          '-f',
          compose,
          'up',
          '-d',
          'postgres',
          'postgres-init',
          'mongodb',
          'redis',
          'opensearch',
        ],
      },
      null,
      2,
    ),
  );
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  main();
