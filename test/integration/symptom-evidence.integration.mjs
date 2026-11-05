// Ejecutar explícitamente contra una base local descartable con el DDL canónico aplicado:
// TEST_EVIDENCE_DATABASE_URL=postgres://.../evidence_test node --test test/integration/symptom-evidence.integration.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { bulkLoadRelationships, FREQUENCY_CODE_TO_STRENGTH_KEY } from '../../tools/terminology-import/lib/bulk-copy.mjs';
import { EVIDENCE_TIERS } from '../../tools/terminology-import/lib/glossary-es/strength.mjs';
import { canonicalEvidenceBatches } from '../../tools/terminology-import/symptoms/lib/evidence-contract.mjs';

test('evidencia canónica: clave natural, persistencia sin pérdida, idempotencia y rollback', async () => {
  assert.ok(process.env.TEST_EVIDENCE_DATABASE_URL, 'Falta TEST_EVIDENCE_DATABASE_URL');
  const url = new URL(process.env.TEST_EVIDENCE_DATABASE_URL);
  assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(url.hostname), 'Sólo se admite PostgreSQL local');
  assert.match(url.pathname, /(?:test|scratch|disposable)/i, 'Se requiere una base descartable');
  const client = new pg.Client({ connectionString: url.toString() });
  await client.connect();
  try {
    const source = randomUUID(), system = randomUUID(), version = randomUUID();
    await client.query('insert into terminology.terminology_sources(id,code,name,created_at,updated_at) values($1::uuid,$1::text,$1::text,now(),now())', [source]);
    await client.query("insert into terminology.code_systems(id,source_id,internal_code,name,canonical_url,created_at,updated_at) values($1::uuid,$2::uuid,$1::text,$1::text,$3,now(),now())", [system, source, `urn:test:${system}`]);
    await client.query("insert into terminology.code_system_versions(id,code_system_id,version,created_at,updated_at) values($1,$2,'2026-09-02',now(),now())", [version, system]);
    const concepts = new Map();
    async function concept(code) {
      const id = randomUUID();
      await client.query('insert into terminology.catalog_concepts(id,code_system_version_id,code,display,created_at,updated_at) values($1,$2,$3,$3,now(),now())', [id, version, code]);
      concepts.set(code, id);
      return id;
    }
    for (const [internalCode, codes] of [['VS_EVIDENCE_TIER', Object.keys(EVIDENCE_TIERS)], ['VS_RELATIONSHIP_FREQUENCY', Object.keys(FREQUENCY_CODE_TO_STRENGTH_KEY)]]) {
      const setId = randomUUID(), setVersion = randomUUID();
      await client.query('insert into terminology.value_sets(id,internal_code,name,canonical_url,created_at,updated_at) values($1,$2,$2,$3,now(),now())', [setId, internalCode, `urn:test:${setId}`]);
      await client.query("insert into terminology.value_set_versions(id,value_set_id,version,created_at,updated_at) values($1,$2,'test',now(),now())", [setVersion, setId]);
      for (const code of codes) {
        const id = await concept(code);
        await client.query('insert into terminology.value_set_members(id,value_set_version_id,concept_id,included,created_at,updated_at) values($1,$2,$3,true,now(),now())', [randomUUID(), setVersion, id]);
      }
    }
    const disease = await concept('synthetic-disease'), phenotype = await concept('synthetic-phenotype'), type = await concept('synthetic-symptom-type');
    const existingRelationshipId = randomUUID();
    await client.query('insert into terminology.concept_relationships(id,source_concept_id,target_concept_id,relationship_type_concept_id,created_at,updated_at) values($1,$2,$3,$4,now(),now())', [existingRelationshipId, disease, phenotype, type]);
    const plan = {
      relationships: [['planned-id-different-from-persisted', disease, phenotype, type, null]],
      evidence: [['e1', 'planned-id-different-from-persisted', source, 'record-one', '2026-09-02', 'https://example.test/ontology', '2026-10-24', false, '16/21', null, 16, 21, null, 'PCS', null, 'FEMALE', JSON.stringify(['PMID:123']), JSON.stringify({ source: 'hpoa', onset: 'HP:0003577', modifiers: ['HP:1'] })]],
    };
    const [{ rows }] = canonicalEvidenceBatches(plan);
    const batch = { terminologySourceId: source, codeSystemVersionId: version, rows };
    const first = await bulkLoadRelationships(client, batch);
    assert.equal(first.relationships.inserted, 0, 'Reutiliza la arista existente por clave natural');
    assert.equal(first.evidence.inserted, 1);
    const { rows: [stored] } = await client.query('select * from terminology.concept_relationship_evidence where terminology_source_id=$1', [source]);
    assert.equal(stored.concept_relationship_id, existingRelationshipId);
    assert.equal(stored.code_system_version_id, version);
    assert.equal(stored.frequency_concept_id, concepts.get('FREQUENT'));
    assert.equal(stored.frequency_numerator, 16);
    assert.equal(stored.frequency_denominator, 21);
    assert.equal(JSON.parse(stored.citation_text).sex, 'FEMALE');
    assert.deepEqual(JSON.parse(stored.citation_text).modifiers, ['HP:1']);
    const second = await bulkLoadRelationships(client, batch);
    assert.deepEqual(second.relationships, { inserted: 0, updated: 0 });
    assert.deepEqual(second.evidence, { inserted: 0, updated: 0 });
    const { rows: [derived] } = await client.query('select evidence_count from terminology.concept_relationships where id=$1', [existingRelationshipId]);
    assert.equal(derived.evidence_count, 1);
    await assert.rejects(bulkLoadRelationships(client, { ...batch, rows: [{ ...rows[0], evidenceTier: 'UNKNOWN', sourceReference: 'invalid-record' }] }), /UNKNOWN/);
    const { rows: [count] } = await client.query('select count(*)::int as n from terminology.concept_relationship_evidence where terminology_source_id=$1', [source]);
    assert.equal(count.n, 1, 'El lote inválido no escribe evidencia');
  } finally {
    await client.end();
  }
});
