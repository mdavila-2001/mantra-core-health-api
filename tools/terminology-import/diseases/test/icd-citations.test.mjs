// CIE-11 MMS, citas (HPO, phenopacket-store, OMS 10→11), resolución de claves
// y reglas de deduplicación de la saturación, con extractos REALES (fixtures/).
//
//   node --test "tools/terminology-import/diseases/test/*.test.mjs"

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { computeCoverage } from '../coverage-report.mjs';
import { citeHpoAnnotations, citePhenopackets, icd10KeysFromWhoMap } from '../lib/citations.mjs';
import { mmsCode, parse11To10, parseSimpleTabulation } from '../lib/icd11.mjs';
import { buildIcd11Mms } from '../lib/records.mjs';
import { resolveXrefs } from '../lib/resolve.mjs';

const FX = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');
const meta = { url: 'fixture', retrievedAt: '2026-10-24T00:00:00.000Z' };

test('tabulación simple CIE-11: filas residuales sin URI de Fundación y notas de codificación multilínea', () => {
  const { version, rows } = parseSimpleTabulation(join(FX, 'icd11_simpletab_2026-01.sample.txt'));
  assert.equal(version, '2026 Jan 17 - 05:30 UTC');
  const by = new Map(rows.map((r) => [mmsCode(r), r]));
  assert.equal(by.get('chapter-01').title, 'Certain infectious or parasitic diseases');
  assert.equal(by.get('1A00').title, 'Cholera'); // sin los guiones de profundidad
  const residual = by.get('1A03.Y');
  assert.equal(residual.foundationUri, null);
  assert.equal(residual.isResidual, true);
  assert.equal(residual.linearizationUri, 'http://id.who.int/icd/release/11/mms/344162786/other');
  const lyme = by.get('1C1G');
  assert.match(lyme.codingNote, /^Use additional code if desired, to identify any associated condition\.\nUse additional code, if desired, to identify any sequelae/);
  assert.equal(lyme.parentUri, 'http://id.who.int/icd/entity/487269828');
  assert.ok([...by.keys()].some((k) => k.startsWith('mms-entity-')), 'bloque de la sección V sin código ni BlockId');
});

test('buildIcd11Mms: jerarquía capítulo → bloque → categoría y correspondencia OMS 11→10', () => {
  const { records } = buildIcd11Mms({ tabulation: join(FX, 'icd11_simpletab_2026-01.sample.txt'), map11To10: join(FX, 'icd11_map_11To10_2025-01.sample.txt') }, meta);
  const by = new Map(records.map((r) => [r.code, r]));
  assert.deepEqual(by.get('1A00').parents, ['BlockL2-1A0']);
  assert.deepEqual(by.get('BlockL2-1A0').parents, ['BlockL1-1A0']);
  assert.deepEqual(by.get('BlockL1-1A0').parents, ['chapter-01']);
  const to10 = by.get('1A00').xrefs.find((x) => x.cs === 'icd10-who');
  assert.deepEqual([to10.code, to10.equivalence], ['A00.9', null]);
  assert.equal(by.get('1A00').xrefs.find((x) => x.cs === 'icd11-foundation').code, '257068234');
  assert.equal(by.get('1A00').provenance.uri, 'http://id.who.int/icd/release/11/mms/257068234');
  assert.equal(parse11To10(join(FX, 'icd11_map_11To10_2025-01.sample.txt')).map.has('01'), false, 'el capítulo no es un código CIE-10');
});

test('OMS 10→11: un destino por código CIE-10; los destinos poscoordinados no se reducen', () => {
  const { version, postcoordinated, keys } = icd10KeysFromWhoMap(join(FX, 'icd11_map_10To11_2025-01.sample.txt'));
  assert.equal(version, '2025-Jan-24');
  const by = new Map(keys.map((k) => [k.code, k.targets]));
  assert.deepEqual(by.get('A00'), ['1A00']);
  assert.deepEqual(by.get('A01.0'), ['1A07.Z']);
  assert.equal(postcoordinated, 1);
  assert.deepEqual(by.get('A00.0'), []);
});

test('citas: anotaciones HPO (OMIM, ORPHA, DECIPHER) y diagnósticos de phenopacket-store', () => {
  const hpo = citeHpoAnnotations(join(FX, 'hpo_phenotype.sample.hpoa'));
  assert.deepEqual(hpo, [
    { cs: 'omim', code: '619340' },
    { cs: 'omim', code: '300425' },
    { cs: 'orphanet', code: '558' },
    { cs: 'decipher', code: '16' },
  ]);
  assert.deepEqual(citePhenopackets(join(FX, 'phenopackets')), [{ cs: 'omim', code: '614959' }]);
});

test('resolveXrefs: citas → claves con `citedBy`; un ORPHA citado que no existe queda sin resolver', () => {
  const orpha = { cs: 'orphanet', code: '558', status: 'active', properties: {}, xrefs: [{ cs: 'omim', code: '154700', equivalence: 'narrower', context: 'orphanet:BTNT' }] };
  const { keyRecords, citationStats } = resolveXrefs([orpha], { hpo: [{ cs: 'omim', code: '154700' }, { cs: 'orphanet', code: '558' }, { cs: 'orphanet', code: '999999' }] }, [
    { cs: 'icd10-who', code: 'Q87.4', citer: 'who', xrefs: [{ cs: 'icd11-mms', code: 'LD28.01', equivalence: null, context: 'who' }] },
  ]);
  const omim = keyRecords.find((k) => k.cs === 'omim');
  assert.deepEqual(omim.properties.disease_xref_key.citedBy, { orphanet: 1, hpo: 1 });
  assert.deepEqual(citationStats.hpo, { cited: 3, existing: 1, keys: 1, unresolved: 1 });
  assert.equal(keyRecords.find((k) => k.cs === 'icd10-who').xrefs[0].resolution, 'unresolved', 'sin CIE-11 cargada no hay destino');
});

test('saturación: deduplica por equivalencia o xref publicados; «más amplio/estrecho» no deduplica', () => {
  const rec = (cs, code, xrefs = []) => ({ cs, code, status: 'active', parents: [], designations: [], properties: {}, provenance: { version: 'v' }, xrefs });
  const bySystem = {
    mondo: [rec('mondo', 'MONDO:1', [{ cs: 'omim', code: '100000', equivalence: 'equivalent', resolution: 'key' }])],
    orphanet: [
      rec('orphanet', '1', [{ cs: 'mondo', code: 'MONDO:1', equivalence: 'equivalent', resolution: 'internal' }]),
      rec('orphanet', '2', [{ cs: 'mondo', code: 'MONDO:1', equivalence: 'wider', resolution: 'internal' }]),
    ],
    doid: [rec('doid', 'DOID:1', [{ cs: 'omim', code: '100000', equivalence: null, resolution: 'key' }])],
    omim: [rec('omim', '100000'), rec('omim', '200000')],
  };
  const { passes } = computeCoverage(bySystem, { 'hpo-annotations': [{ cs: 'omim', code: '100000' }, { cs: 'omim', code: '200000' }] }, {});
  const p = Object.fromEntries(passes.map((x) => [x.source, x.newConcepts]));
  assert.equal(p.mondo, 1);
  assert.equal(p.orphanet, 1, 'ORPHA:2 sólo es «más específico»: cuenta como nuevo');
  assert.equal(p.doid, 0, 'mismo OMIM que MONDO por xref publicado');
  assert.equal(p['hpo-annotations'], 1, 'OMIM 200000 no lo cita ninguna ontología');
});

test('instantánea versionada: gzip partido, SHA-256 en MANIFEST.json y lectura idéntica', async () => {
  const { mkdtempSync, readFileSync, writeFileSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { readSnapshot, writeSnapshot } = await import('../lib/snapshot.mjs');
  const dir = mkdtempSync(join(tmpdir(), 'diseases-snapshot-'));
  const extra = join(dir, 'extra.json');
  writeFileSync(extra, '{"a":1}\n');
  const rows = [{ cs: 'omim', code: '154700', display: '154700' }, { cs: 'omim', code: '219700', display: '219700' }];
  const files = writeSnapshot(new Map([['omim', rows]]), { 'extra-copy.json': extra }, { omim: 'xref-keys' }, dir);
  assert.deepEqual(files.map((f) => f.file), ['omim.part-01.ndjson.gz', 'extra-copy.json']);
  const { manifest, byCs } = readSnapshot(null, dir);
  assert.deepEqual(byCs.get('omim'), rows);
  assert.equal(manifest.versions.omim, 'xref-keys');
  // Una parte alterada no se lee.
  writeFileSync(join(dir, 'omim.part-01.ndjson.gz'), readFileSync(join(dir, 'omim.part-01.ndjson.gz')).subarray(1));
  assert.throws(() => readSnapshot(null, dir), /SHA-256 distinto/);
});
