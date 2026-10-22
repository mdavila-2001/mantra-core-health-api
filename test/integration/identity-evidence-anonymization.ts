import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import type { FileStorageAdapter } from '../../src/common/storage/file-storage.adapter';
import type { IdentityEvidenceLifecycleService } from '../../src/modules/identity_assurance/services/identity-evidence-lifecycle.service';
import { fixtureSpec as spec } from './identity-evidence-fixture';

export type FixtureSnapshot = Record<string, Record<string, unknown>[]>;

/** Shared assertion journey, NOT a disposition implementation or authorization path.
 * The caller supplies the real lifecycle service inside its existing approved scope;
 * controlled tests supply doubles. This helper never grants access or deletes bytes. */
export async function verifyAnonymizationControl(ports: {
  snapshot: () => Promise<FixtureSnapshot>;
  lifecycle: Pick<IdentityEvidenceLifecycleService, 'execute'>;
  storage: Pick<FileStorageAdapter, 'retrieve' | 'inspect'>;
}): Promise<FixtureSnapshot> {
  const evidenceTable = 'identity_assurance.identity_evidence_records';
  const target = spec.graphs.find((graph) => graph.name === 'target')!;
  assert.equal(spec.anonymizationTest.evidenceId, target.evidenceId);
  assert.equal(spec.anonymizationTest.storageDisposition, 'PRESERVE');
  const before = await ports.snapshot();
  const targetRows = before[evidenceTable].filter(
    (row) => row.id === target.evidenceId,
  );
  assert.equal(targetRows.length, 1);
  assert.equal(
    targetRows[0][spec.anonymizationTest.column],
    createHash('sha256')
      .update(spec.anonymizationTest.syntheticIdentifier)
      .digest('hex'),
  );
  assert.deepEqual(before.revisions, []); // A fresh fixture, never historical evidence.
  const proveBytesPreserved = async () => {
    assert.ok(ports.storage.inspect, 'STORAGE_INSPECTION_REQUIRED');
    for (const graph of spec.graphs) {
      const uri = `file://local/${graph.object.sha256}`;
      assert.equal((await ports.storage.inspect(uri)).state, 'PRESENT');
      assert.equal(
        createHash('sha256')
          .update(await ports.storage.retrieve(uri))
          .digest('hex'),
        graph.object.sha256,
      );
    }
  };
  await proveBytesPreserved();
  const execute = () =>
    ports.lifecycle.execute(
      target.evidenceId,
      target.tenantId,
      spec.evidenceTypeConceptCode,
      'ANONYMIZATION',
    );
  assert.deepEqual(await execute(), {
    status: 'ANONYMIZED',
    reasonCode: 'PHYSICAL_DISPOSITION_NOT_EXECUTED',
  });
  const after = await ports.snapshot();
  assert.deepEqual(Object.keys(after).sort(), Object.keys(before).sort());
  for (const [table, rows] of Object.entries(before)) {
    if (table === 'revisions') continue;
    assert.deepEqual(
      after[table],
      table === evidenceTable
        ? rows.map((row) =>
            row.id === target.evidenceId
              ? { ...row, [spec.anonymizationTest.column]: null }
              : row,
          )
        : rows,
      `ANONYMIZATION_CHANGED_UNAUTHORIZED_DATA:${table}`,
    );
  }
  assert.equal(after.revisions.length, 1);
  const revision = after.revisions[0];
  assert.equal(revision.record_id, target.evidenceId);
  assert.equal(revision.schema_name, 'identity_assurance');
  assert.equal(revision.table_name, 'identity_evidence_records');
  const receipt = revision.data_snapshot as Record<string, unknown>;
  assert.deepEqual(Object.keys(receipt).sort(), [
    'contractDigest',
    'operation',
    'outcome',
    'schemaVersion',
  ]);
  assert.equal(receipt.schemaVersion, 1);
  assert.equal(receipt.operation, 'ANONYMIZATION');
  assert.equal(receipt.outcome, 'ANONYMIZED');
  assert.match(String(receipt.contractDigest), /^[a-f0-9]{64}$/);
  await proveBytesPreserved();
  assert.deepEqual(await execute(), {
    status: 'DUPLICATE',
    reasonCode: 'DISPOSITION_ALREADY_RECORDED',
  });
  assert.deepEqual(
    await ports.snapshot(),
    after,
    'ANONYMIZATION_REPLAY_MUTATED_STATE',
  );
  await proveBytesPreserved();
  return after;
}
