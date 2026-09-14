import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, validateFixture, composeSpec } from './prepare.mjs';
const fixture = () =>
  JSON.parse(
    readFileSync(
      join(ROOT, 'test/fixtures/identity-evidence-lifecycle.json'),
      'utf8',
    ),
  );
test('synthetic graph IDs, bytes, hashes, cross-tenant shared object and WORM baseline are complete', () => {
  assert.deepEqual(validateFixture(fixture()), {
    status: 'PASS',
    contains_real_personal_data: false,
    graphs: 5,
    tenants: 2,
    objects: 4,
    auditRows: 5,
    recordIds: 32,
  });
});
for (const variant of [
  'real-data',
  'hash',
  'owner',
  'duplicate',
  'audit',
  'hold',
  'external',
  'shared',
])
  test(`rejects ${variant}`, () => {
    const f = fixture();
    if (variant === 'real-data') f.contains_real_personal_data = true;
    if (variant === 'hash') f.graphs[0].object.sha256 = 'a'.repeat(64);
    if (variant === 'owner') f.graphs[0].ownerUserId = f.ownerUserIds[1];
    if (variant === 'duplicate') f.graphs[0].versionId = f.graphs[0].fileId;
    if (variant === 'audit') f.auditBaseline.rows = [];
    if (variant === 'hold') f.hold.endsAt = '2001-01-01';
    if (variant === 'external') f.graphs[0].externalReference = 'external';
    if (variant === 'shared') f.graphs[4].tenantId = f.tenantIds[0];
    assert.throws(() => validateFixture(f));
  });
test('compose uses fresh project-scoped volumes, loopback ports and supported read-only bootstrap, not manual DDL', () => {
  const spec = composeSpec('/synthetic/canonical');
  assert.equal(spec.networks.default.internal, true);
  for (const service of Object.values(spec.services)) {
    assert.equal(service.labels['mantra.synthetic-only'], 'true');
    for (const port of service.ports ?? [])
      assert.match(port, /^127\.0\.0\.1:/);
  }
  assert.deepEqual(spec.services['postgres-init'].entrypoint, [
    'bash',
    '/init/bin/init-postgres.sh',
  ]);
  assert.ok(
    spec.services['postgres-init'].volumes.every((v) => v.endsWith(':ro')),
  );
  assert.ok(!JSON.stringify(spec).includes('external":true'));
});
