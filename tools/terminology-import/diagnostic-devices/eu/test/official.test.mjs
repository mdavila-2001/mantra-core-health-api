// Pruebas de la vía OFICIAL de la región EU (2026-10-27). Los fixtures son
// recortes de las respuestas/archivos reales: `udi-rows.json` (GET /udi del Data
// Lake), `reference-rows.json` (GET /reference), `actors-rows.json` (GET /actors,
// con e-mail, teléfono y PRRC enmascarados a mano) y `bdrdm-*.csv` (BD/RDM
// DISPO_RDM_1_20261026.csv).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { Readable } from 'node:stream';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { csvRows } from '../lib/csv-stream.mjs';
import { classifyEmdn } from '../lib/emdn-scope.mjs';
import { cleanEmdnHeaderCell, findEmdnHeaderRow } from '../lib/sources/emdn.mjs';
import {
  DATALAKE_ACTOR_PERSONAL_FIELDS,
  currentDatalakeActors,
  normalizeDatalakeActor,
} from '../lib/sources/eudamed-actors.mjs';
import {
  assertSafeNext,
  buildReferenceIndex,
  normalizeUdiRow,
  splitNomenclature,
} from '../lib/sources/eudamed-datalake.mjs';
import {
  assertColumnMap,
  loadColumnMap,
  manufacturerRegistryId,
  normalizeBdrdmRow,
} from '../lib/sources/it-bdrdm.mjs';

const FX = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'official');
const json = (n) => JSON.parse(readFileSync(join(FX, n), 'utf8'));
const T = '2026-10-27T23:00:00Z';

async function collect(text, delimiter = ';') {
  const out = [];
  for await (const r of csvRows(Readable.from([text]), { delimiter })) out.push(r);
  return out;
}

test('csvRows: comillas, separador dentro de comillas, comilla escapada, salto de línea dentro de comillas y CRLF', async () => {
  const rows = await collect('a;b;c\r\n1;"x;y";"he said ""hi"""\r\n2;"línea1\nlínea2";z\n');
  assert.deepEqual(rows, [
    ['a', 'b', 'c'],
    ['1', 'x;y', 'he said "hi"'],
    ['2', 'línea1\nlínea2', 'z'],
  ]);
});

test('csvRows: no depende de dónde se corte el flujo (chunks de 1 carácter)', async () => {
  const text = readFileSync(join(FX, 'bdrdm-head.csv'), 'utf8');
  const whole = await collect(text);
  const out = [];
  for await (const r of csvRows(Readable.from([...text]), { delimiter: ';' })) out.push(r);
  assert.deepEqual(out, whole);
  assert.equal(whole.length, 4);
  assert.equal(whole[0][0], 'tipologia_dm');
  assert.equal(whole[0].length, 17); // el encabezado real trae una columna vacía al final
  assert.equal(whole[1].length, 16);
});

test('BD/RDM real: el mapa de columnas verificado coincide con el encabezado y una fila W sale con id VAT', async () => {
  const [header, ...body] = await collect(readFileSync(join(FX, 'bdrdm-w.csv'), 'utf8').replace(/^/, readFileSync(join(FX, 'bdrdm-head.csv'), 'utf8').split('\n')[0] + '\n'));
  const map = loadColumnMap();
  const h = header.filter((x) => x !== '');
  assertColumnMap(map, h);
  const obj = (cells) => Object.fromEntries(h.map((k, i) => [k, cells[i] ?? '']));
  const r = normalizeBdrdmRow(obj(body[1]), map, { sourceUrl: 'https://www.dati.salute.gov.it/x.zip', sourceVersion: 'DISPO_RDM_1_20261026', retrievedAt: T });
  assert.equal(r.source, 'it-salute-bdrdm');
  assert.equal(r.sourceRecordId, '1:47797');
  assert.equal(r.deviceTypeSystem, 'cnd');
  assert.equal(r.deviceTypeCode, 'W02079017');
  assert.equal(r.deviceTypeName, 'OSMOMETRI');
  assert.equal(r.manufacturerName, 'FRESENIUS MEDICAL CARE AG & CO KGAA');
  assert.equal(r.manufacturerRegistryId, 'vat:811127677');
  assert.equal(r.brandName, 'AQUA UNO');
  assert.equal(r.model, '6312751');
  assert.equal(r.authorizationDate, '2008-10-16');
  assert.equal(r.manufacturerCountry, null); // la fuente no publica país: no se deduce del VAT
  assert.equal(r.extra.validityEndDate, undefined); // 9999-12-31 es un valor ficticio: no se exporta
  assert.equal(r.extra.endOfMarketingDate, '2009-06-16');
});

test('BD/RDM: el código fiscal de 16 caracteres (persona física) no se conserva; el de 11 dígitos sí', () => {
  assert.equal(manufacturerRegistryId(null, '03692810231'), 'it-cf:03692810231');
  assert.equal(manufacturerRegistryId(null, 'RSSMRA80A01H501U'), null);
  assert.equal(manufacturerRegistryId('DE 123456789', 'RSSMRA80A01H501U'), 'vat:DE123456789');
});

test('EMDN 2026: la fila de título no es la de encabezados y «(v.2026)» se quita', () => {
  const rows = [
    [null, null, 'EMDN_v.2026'],
    ['CATEGORY', 'CATEGORY DESCRIPTION (v.2026)', 'CODE', 'TERM EMDN (v.2026)', 'LEVEL', 'TERMINAL LEVEL (YES/NO)'],
    ['A', 'DEVICES FOR ADMINISTRATION, WITHDRAWAL AND COLLECTION', 'A', 'DEVICES FOR ADMINISTRATION, WITHDRAWAL AND COLLECTION', 1, 'NO'],
  ];
  assert.equal(findEmdnHeaderRow(rows), 1);
  assert.deepEqual(rows[1].map(cleanEmdnHeaderCell), ['CATEGORY', 'CATEGORY DESCRIPTION', 'CODE', 'TERM EMDN', 'LEVEL', 'TERMINAL LEVEL (YES/NO)']);
});

test('Data Lake real: NOMENCLATURE_CODE trae espacio inicial y varios códigos separados por coma', () => {
  const { rows } = json('udi-rows.json');
  assert.deepEqual(splitNomenclature(rows[0].NOMENCLATURE_CODE), ['W0599']);
  const multi = rows.find((r) => r.NOMENCLATURE_CODE.includes(','));
  assert.deepEqual(splitNomenclature(multi.NOMENCLATURE_CODE), ['V080202', 'Z12140401']);
});

test('Data Lake real: cada fila sale con UDI-DI, SRN, país del SRN, marca y alcance por código', () => {
  const { rows, retrievedAt } = json('udi-rows.json');
  const reference = buildReferenceIndex(json('reference-rows.json'));
  const recs = rows.map((row) =>
    normalizeUdiRow(row, { reference, emdnByCode: new Map(), actorsBySrn: new Map(), sourceUrl: `https://ec.europa.eu/tools/eudamed/api/devices/udiDiData/${row.UUID}?languageIso2Code=en`, retrievedAt }),
  );
  for (const r of recs) {
    assert.equal(r.source, 'eudamed-udi');
    assert.match(r.manufacturerRegistryId, /^srn:[A-Z]{2}-MF-\d{9}$/);
    assert.match(r.sourceUrl, /udiDiData\/[0-9a-f-]{36}/);
    assert.equal(r.deviceTypeSystem, 'emdn');
    assert.ok(r.udiDi);
  }
  assert.equal(recs[0].deviceTypeCode, 'W0599');
  assert.equal(classifyEmdn(recs[0].deviceTypeCode).inScope, true);
  assert.equal(classifyEmdn(recs[3].deviceTypeCode).inScope, true); // Z12040192: tipo Z120401 incluido
  assert.equal(recs[4].deviceTypeCode, 'V080202');
  assert.equal(recs[4].extra.deviceTypes[0].code, 'Z12140401');
});

test('Data Lake: assertSafeNext acepta que cambie el cursor $after y rechaza cualquier otro cambio', () => {
  const a = 'https://api.datalake.sante.service.ec.europa.eu/eudamed/udi?format=json&api-version=v1.0';
  const b = 'https://api.datalake.sante.service.ec.europa.eu/eudamed/udi?$after=AAA&format=json&api-version=v1.0';
  const c = 'https://api.datalake.sante.service.ec.europa.eu/eudamed/udi?$after=BBB&format=json&api-version=v1.0';
  assert.equal(assertSafeNext(b, a), b);
  assert.equal(assertSafeNext(c, b), c);
  assert.throws(() => assertSafeNext(b.replace('v1.0', 'v2.0'), a), /api-version/);
  assert.throws(() => assertSafeNext(b.replace('/eudamed/udi', '/eudamed/actors'), a), /fuera de la consulta/);
});

test('Actores del Data Lake: se conserva la organización y se descartan e-mail, teléfono y PRRC', () => {
  const rows = currentDatalakeActors(json('actors-rows.json'));
  const rec = normalizeDatalakeActor(rows[0], { retrievedAt: T, official: { url: 'u', sha256: 'h' } });
  assert.equal(rec.sourceRecordId, 'NL-MF-000027730');
  assert.equal(rec.manufacturerRegistryId, 'srn:NL-MF-000027730');
  assert.equal(rec.manufacturerCountry, 'NL');
  assert.equal(rec.extra.role, 'Manufacturer');
  const serialized = JSON.stringify(rec);
  for (const f of DATALAKE_ACTOR_PERSONAL_FIELDS) assert.ok(!serialized.includes(f), f);
  assert.ok(!serialized.includes('MASCARADO'));
});
