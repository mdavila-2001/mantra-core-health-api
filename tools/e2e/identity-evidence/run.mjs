// Host launcher. Preserves the internal Docker network; never exposes a public API.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { ROOT, sourceProof, hash, validateFixture } from './prepare.mjs';
const [mode, manifestPath, approvalPath] = process.argv.slice(2);
if (!['inspect', 'prepare', 'execute-approved'].includes(mode) || !manifestPath)
  throw new Error(
    'Usage: node tools/e2e/identity-evidence/run.mjs inspect|prepare|execute-approved <preparation.json> [approval.json]',
  );
const manifest = JSON.parse(readFileSync(resolve(manifestPath), 'utf8'));
const fixture = JSON.parse(
  readFileSync(
    join(ROOT, 'test/fixtures/identity-evidence-lifecycle.json'),
    'utf8',
  ),
);
validateFixture(fixture);
const source = sourceProof();
if (
  source.upstreamSha !== manifest.source.upstreamSha ||
  fixture.runId !== '07200000-0000-4000-8000-000000000001'
)
  throw new Error('BOOTSTRAP_SOURCE_CHANGED');
const docker = (...args) =>
  execFileSync('docker', args, {
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  }).trim();
const network = JSON.parse(
  docker('network', 'inspect', 'mantra-7-2-synthetic_default'),
)[0];
if (
  network.Internal !== true ||
  network.Labels['com.docker.compose.project'] !== 'mantra-7-2-synthetic'
)
  throw new Error('NETWORK_ISOLATION_UNKNOWN');
const services = [
  'postgres',
  'postgres-init',
  'mongodb',
  'redis',
  'opensearch',
].map(
  (name) => JSON.parse(docker('inspect', `mantra-7-2-synthetic-${name}-1`))[0],
);
for (const service of services) {
  if (
    service.Config.Labels['mantra.synthetic-only'] !== 'true' ||
    service.Config.Labels['mantra.task'] !== '7.2' ||
    Object.keys(service.NetworkSettings.Networks).some(
      (name) => name !== network.Name,
    )
  )
    throw new Error('SERVICE_PROVENANCE_UNKNOWN');
  for (const mount of service.Mounts.filter((m) => m.Type === 'volume')) {
    const volume = JSON.parse(docker('volume', 'inspect', mount.Name))[0];
    const consumers = docker(
      'ps',
      '-aq',
      '--no-trunc',
      '--filter',
      `volume=${mount.Name}`,
    ).split('\n');
    if (
      Date.parse(volume.CreatedAt) < Date.parse(network.Created) - 2000 ||
      consumers.length !== 1 ||
      consumers[0] !== service.Id
    )
      throw new Error('VOLUME_NOT_NEW_AND_EXCLUSIVE');
    if (
      !mount.Name.startsWith('mantra-7-2-synthetic_') &&
      !(
        mount.Destination === '/data/configdb' &&
        service.Config.Volumes?.['/data/configdb']
      )
    )
      throw new Error('UNRECOGNIZED_ANONYMOUS_VOLUME');
  }
}
const init = services[1];
if (init.State.Status !== 'exited' || init.State.ExitCode !== 0)
  throw new Error('CANONICAL_BOOTSTRAP_NOT_COMPLETE');
const image = JSON.parse(
  docker('image', 'inspect', 'mantra-bootstrap-v428-deps:local'),
)[0].Id;
const fixtureHash = hash(JSON.stringify(fixture));
let approval;
if (mode === 'execute-approved') {
  if (!approvalPath) throw new Error('SEPARATE_ENDER_APPROVAL_REQUIRED');
  approval = JSON.parse(readFileSync(resolve(approvalPath), 'utf8'));
  if (
    approval.authorization !== 'ENDER_APPROVED_7_2_SYNTHETIC_E2E' ||
    approval.runId !== fixture.runId ||
    approval.sourceSha !== source.apiBaseSha ||
    approval.diffHash !== source.diffHash ||
    approval.fixtureHash !== fixtureHash ||
    approval.expiresAt <= Date.now() ||
    approval.expiresAt > Date.now() + 600000
  )
    throw new Error('APPROVAL_NOT_BOUND_TO_CURRENT_SOURCE_AND_FIXTURE');
}
const attempt = join(manifest.directory, `attempt-${mode}-${Date.now()}`);
mkdirSync(attempt);
const runtime = {
  ...manifest,
  source,
  fixtureHash,
  mode,
  image,
  networkId: network.Id,
  containerIds: services.map((s) => s.Id),
  approval,
  packageHash: hash(readFileSync(join(ROOT, 'package.json'))),
  lockHash: hash(readFileSync(join(ROOT, 'yarn.lock'))),
};
writeFileSync(join(attempt, 'input.json'), JSON.stringify(runtime, null, 2), {
  flag: 'wx',
});
// Immutable copy of THIS worktree's code, never the unmerged PR or another worktree.
// Container-local extraction avoids thousands of Windows bind-mount reads and
// prevents a concurrent host edit from silently changing the running process.
const sourcePaths = [
  'src',
  'test',
  'tools',
  'tsconfig.json',
  'tsconfig.build.json',
  '.swcrc',
];
execFileSync('tar', [
  '-cf',
  join(attempt, 'source.tar'),
  '-C',
  ROOT,
  ...sourcePaths,
]);
const args = [
  'run',
  '--name',
  `mantra-7-2-api-${mode}-${Date.now()}`,
  '--network',
  network.Name,
  '--label',
  'mantra.synthetic-only=true',
  '--label',
  'mantra.task=7.2',
  '--mount',
  `type=bind,source=${attempt},target=/proof`,
  '--mount',
  `type=bind,source=${manifest.directory},target=/bundle`,
  '--mount',
  `type=bind,source=${manifest.storageRoot},target=/synthetic/mantra-7.2-${fixture.runId}/objects`,
  '--entrypoint',
  '/bin/sh',
  image,
  '-c',
  'tar -xf /proof/source.tar -C /app && exec node tools/e2e/identity-evidence/container.mjs',
];
console.log(
  JSON.stringify(
    {
      mode,
      proofDirectory: attempt,
      source: { ...source, files: source.files.length },
      fixtureHash,
      networkInternal: true,
      destructiveExecutionRequested: mode === 'execute-approved',
    },
    null,
    2,
  ),
);
execFileSync('docker', args, { stdio: 'inherit' });
