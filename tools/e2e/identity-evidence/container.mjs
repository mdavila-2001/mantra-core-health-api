import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createServer, connect } from 'node:net';
import { spawn } from 'node:child_process';
const proof = JSON.parse(readFileSync('/proof/input.json', 'utf8'));
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
if (
  existsSync('/app/.env') ||
  digest(readFileSync('/app/package.json')) !== proof.packageHash ||
  digest(readFileSync('/app/yarn.lock')) !== proof.lockHash
)
  throw new Error('DEPENDENCIES_OR_ENV_UNPROVEN');
for (const file of proof.source.files)
  if (digest(readFileSync(`/app/${file.path}`)) !== file.sha256)
    throw new Error(`SOURCE_CHANGED:${file.path}`);
// Keep PostgreSQL's grant target loopback, while all traffic remains inside the
// dedicated internal network. No listener is bound to a public interface.
const proxy = createServer((socket) => {
  const upstream = connect({ host: 'postgres', port: 5432 });
  socket.pipe(upstream).pipe(socket);
  upstream.on('error', () => socket.destroy());
  socket.on('error', () => upstream.destroy());
  socket.on('close', () => upstream.destroy());
});
await new Promise((ok, fail) => {
  proxy.once('error', fail);
  proxy.listen(55492, '127.0.0.1', ok);
});
const root = `/synthetic/mantra-7.2-${proof.fixture.runId ?? '07200000-0000-4000-8000-000000000001'}/objects`;
const env = {
  PATH: process.env.PATH,
  NODE_ENV: 'test',
  ENVIRONMENT_CLASS: 'LOCAL_TEST',
  DB_HOST: '127.0.0.1',
  DB_PORT: '55492',
  DB_NAME: 'identity_evidence_7_2_test',
  DB_USER: 'identity_7_2_test',
  DB_PASSWORD: 'SYNTHETIC-LOCAL-ONLY-7.2',
  DB_SSL: 'false',
  ORM_SCHEMA_SYNC: 'off',
  ORM_VERIFY_FIDELITY: 'false',
  MIKRO_ORM_DEBUG: 'false',
  MONGODB_URI: 'mongodb://mongodb:27017/identity_evidence_7_2_test',
  REDIS_HOST: 'redis',
  REDIS_PORT: '6379',
  OPENSEARCH_NODE: 'http://opensearch:9200',
  FILE_STORAGE_ADAPTER: 'local',
  FILE_STORAGE_LOCAL_DIR: root,
  FILE_STORAGE_LIFECYCLE_QUEUE_CODE: 'SYNTHETIC-7.2-STORAGE',
  FILE_STORAGE_LIFECYCLE_BINDING: JSON.stringify({
    schemaVersion: 1,
    revision: proof.fixtureHash,
    adapter: 'local',
    backendIdentity: `synthetic:${proof.networkId}`,
    configuredLocation: root,
    physicalContainer: root,
    versioning: 'UNVERSIONED',
    authorityVerified: true,
    aliasesVerified: true,
    producerCoverageVerified: true,
    legacyOperationsSettled: true,
    localFilesystemVerified: true,
  }),
  API_RUNTIME_BASE_SHA: proof.source.apiBaseSha,
  API_RUNTIME_DIFF_HASH: proof.source.diffHash,
  MOCKS_ENABLED: 'false',
  MOCK_BACKEND_ENABLED: 'false',
  SEED_ON_BOOT: 'false',
  SEED_CONTENT_ON_BOOT: 'false',
  BOOTSTRAP_ADMIN_ENABLED: 'false',
  VERIFICATION_BYPASS_ENABLED: 'false',
  JWT_SECRET: 'SYNTHETIC-LOCAL-ONLY-7.2-NOT-A-PRODUCTION-SECRET',
  LOG_LEVEL: 'warn',
  TELEMETRY_ENABLED: 'false',
  IDENTITY_7_2_LIVE_PROOF: '/proof/input.json',
};
const child = spawn(
  process.execPath,
  [
    '--experimental-vm-modules',
    'node_modules/jest-cli/bin/jest.js',
    '--config',
    'test/jest-integration.json',
    '--runInBand',
    '--runTestsByPath',
    'test/integration/identity-evidence-live.int-spec.ts',
  ],
  { env, stdio: 'inherit', cwd: '/app' },
);
const code = await new Promise((ok) => child.once('exit', ok));
proxy.close();
process.exitCode = code ?? 1;
