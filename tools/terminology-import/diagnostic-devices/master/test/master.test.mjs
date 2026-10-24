// Tests de la consolidación de equipos de diagnóstico (node:test, sin red ni base).
//   node --test "tools/terminology-import/diagnostic-devices/master/test/*.test.mjs"

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  FIELDS,
  readNdjsonGz,
  validateRow,
  writeNdjsonGzSharded,
} from '../lib/exchange.mjs';
import { classifyRegulation } from '../lib/cfr.mjs';
import {
  decidePcd,
  derivePanelParts,
  ivdPanelsFrom,
  parsePcd,
  pcdNode,
} from '../lib/fda-pcd.mjs';
import { aimlRows, fdaSubmissionUrl, parseCsv } from '../lib/own-sources.mjs';
import {
  comparePcdCopies,
  parseOpenfdaClassification,
} from '../lib/openfda-classification.mjs';
import { Taxonomy, emdnParent } from '../lib/taxonomy.mjs';
import {
  normalizeManufacturerName,
  resolveManufacturers,
} from '../lib/manufacturers.mjs';
import { consolidate, labelKey } from '../lib/consolidate.mjs';
import {
  locateRegion,
  readRegionManifest,
  readRegionRows,
} from '../lib/regions.mjs';
import {
  compareEmdnCopies,
  emdnGroupTitleDecision,
  emdnNodes,
  parseEmdn,
  parseEmdnTsv,
} from '../lib/emdn.mjs';

const FX = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');
const RETRIEVED = '2026-10-24T03:00:00Z';

/** Fila mínima válida del formato común (solo para tests). */
const row = (over = {}) => ({
  ...Object.fromEntries(FIELDS.map((f) => [f, null])),
  source: 'test-src',
  sourceRecordId: 'r1',
  sourceUrl: 'https://example.org/r1',
  sourceVersion: 'v1',
  retrievedAt: RETRIEVED,
  manufacturerName: 'Acme Medical, Inc.',
  ...over,
});

function pcdTaxonomy() {
  const rows = parsePcd(readFileSync(join(FX, 'foiclass.sample.txt'), 'utf8'));
  const ivd = ivdPanelsFrom(derivePanelParts(rows));
  const tax = new Taxonomy();
  for (const r of rows) tax.addNode(pcdNode(r, { source: 'fda-pcd' }, ivd));
  return { tax, rows, ivd };
}

// --- 21 CFR -----------------------------------------------------------------

test('classifyRegulation: subpartes diagnósticas, de monitoreo e IVD', () => {
  assert.deepEqual(
    (({ diagnostic, kind, subpart }) => ({ diagnostic, kind, subpart }))(
      classifyRegulation('892.1750'),
    ),
    { diagnostic: true, kind: 'diagnostic', subpart: 'B' },
  );
  assert.equal(classifyRegulation('870.2340').kind, 'monitoring');
  assert.equal(classifyRegulation('880.2910').kind, 'monitoring');
  assert.equal(classifyRegulation('862.2160').kind, 'ivd');
  assert.equal(classifyRegulation('862.2160').subpart, 'C');
  assert.equal(
    classifyRegulation('892.2050').subpart,
    'B',
    'image processing está en la subparte B (892.1000–892.2100)',
  );
});

test('classifyRegulation: lo no diagnóstico y lo que no se puede decidir', () => {
  assert.equal(classifyRegulation('878.4400').diagnostic, false);
  assert.equal(
    classifyRegulation('878.4400').basis,
    'cfr-non-diagnostic-subpart',
  );
  assert.equal(
    classifyRegulation('864.9175').diagnostic,
    false,
    'subparte J: establecimientos de sangre',
  );
  assert.equal(classifyRegulation('864.9175').basis, 'cfr-blood-establishment');
  assert.equal(classifyRegulation('610.40').basis, 'cfr-non-device-part');
  // 878.1830 es más nueva que la tabla verificada de la subparte B (hasta 878.1820): no se asigna por cercanía.
  assert.equal(classifyRegulation('878.1830').diagnostic, null);
  assert.equal(classifyRegulation('').basis, 'no-regulation');
  assert.equal(classifyRegulation('abc').basis, 'regulation-unparsable');
  // Una sección de parte IVD fuera de los rangos listados sigue siendo IVD (809.3).
  assert.equal(classifyRegulation('864.2220').diagnostic, true);
});

// --- FDA Product Classification ---------------------------------------------

test('parsePcd + pcdNode sobre el recorte real de foiclass', () => {
  const { tax, rows, ivd } = pcdTaxonomy();
  assert.equal(rows.length, 21);
  const n = (code) => tax.nodes.get(`fda-product-code|${code}`);
  assert.equal(n('JAK').name, 'System, X-Ray, Tomography, Computed');
  assert.equal(n('JAK').diagnostic, true);
  assert.equal(n('JAK').attributes.cfrSubpartTitle, 'Diagnostic Devices');
  assert.equal(n('DPS').branch, 'monitoring');
  assert.equal(n('JJE').branch, 'ivd');
  assert.equal(n('GEI').diagnostic, false);
  assert.equal(n('KSZ').diagnostic, false);
  assert.equal(n('QZS').diagnostic, null);
  // Panel TX: en el recorte todos sus códigos con regulación están en 862 → IVD.
  assert.ok(ivd.has('TX'));
  assert.equal(n('LAO').diagnostic, true);
  assert.equal(n('LAO').basis, 'fda-review-panel-ivd');
  // Panel CV sin regulación: sin criterio publicado.
  assert.equal(n('DSQ').diagnostic, null);
  assert.equal(n('DSQ').basis, 'no-regulation');
  // Panel MI tiene un código en la parte 610 (biológicos): no es panel «todo IVD».
  assert.ok(!ivd.has('MI'));
});

test('ivdPanelsFrom exige que TODOS los códigos con regulación del panel estén en 862/864/866', () => {
  assert.deepEqual(
    [
      ...ivdPanelsFrom({
        TX: { 862: 10 },
        CH: { 862: 10, 880: 1 },
        RA: { 892: 3 },
      }),
    ],
    ['TX'],
  );
});

// --- Formato de intercambio ---------------------------------------------------

test('validateRow: acepta una fila completa y rechaza lo incompleto', () => {
  assert.deepEqual(validateRow(row()), []);
  const { model: _m, ...sinModel } = row();
  assert.match(validateRow(sinModel).join(), /falta el campo model/);
  assert.match(
    validateRow(row({ manufacturerName: null })).join(),
    /manufacturerName no puede ser null/,
  );
  assert.match(
    validateRow(row({ authorizationDate: '03/30/2026' })).join(),
    /YYYY-MM-DD/,
  );
  assert.match(
    validateRow(row({ retrievedAt: '2026-10-24' })).join(),
    /retrievedAt/,
  );
  assert.match(
    validateRow(row({ manufacturerRegistryId: '3002807468' })).join(),
    /prefijo/,
  );
  assert.match(
    validateRow(row({ deviceTypeSystem: 'fda-product-code' })).join(),
    /sin deviceTypeCode ni deviceTypeName/,
  );
  assert.match(
    validateRow(row({ deviceTypeCode: 'JAK' })).join(),
    /sin deviceTypeSystem/,
  );
  assert.deepEqual(
    validateRow(
      row({
        deviceTypeSystem: 'jmdn',
        deviceTypeName: '汎用超音波画像診断装置',
      }),
    ),
    [],
    'nomenclatura publicada solo con nombre',
  );
  assert.deepEqual(
    validateRow(
      row({
        deviceTypeSystem: 'gmdn-pt',
        deviceTypeName: 'Haematology analyser IVD, automated',
      }),
    ),
    [],
  );
  assert.match(
    validateRow(
      row({ deviceTypeSystem: 'nomenclatura-rara', deviceTypeCode: 'X' }),
    ).join(),
    /desconocido/,
  );
});

test('writeNdjsonGzSharded parte sin cortar líneas y se relee igual', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'dx-shard-'));
  try {
    const rows = Array.from({ length: 3000 }, (_, i) => ({
      i,
      text: createHash('sha256').update(String(i)).digest('hex').repeat(4),
    }));
    const files = writeNdjsonGzSharded(dir, 'demo', rows, {
      maxBytes: 64 * 1024,
      rawChunkBytes: 200 * 1024,
    });
    assert.ok(files.length > 1, 'tiene que partir');
    assert.ok(
      files.every(
        (f) => /^demo-\d{4}\.ndjson\.gz$/.test(f.path) && f.bytes <= 64 * 1024,
      ),
    );
    assert.equal(
      files.reduce((n, f) => n + f.rows, 0),
      rows.length,
    );
    const back = [];
    for (const f of files)
      for await (const r of readNdjsonGz(join(dir, f.path))) back.push(r);
    assert.deepEqual(back, rows);
    // Reescribir con menos filas borra los fragmentos viejos.
    writeNdjsonGzSharded(dir, 'demo', rows.slice(0, 10));
    assert.deepEqual(readdirSync(dir), ['demo.ndjson.gz']);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// --- Lista FDA de dispositivos con IA -----------------------------------------

test('parseCsv respeta comillas con comas y saltos de línea', () => {
  assert.deepEqual(parseCsv('a,"b, c","d\n""e"""\r\nx,y,z\n'), [
    ['a', 'b, c', 'd\n"e"'],
    ['x', 'y', 'z'],
  ]);
});

test('aimlRows convierte el recorte real al formato común', () => {
  const { rows, errors } = aimlRows(
    readFileSync(join(FX, 'aiml.sample.csv'), 'utf8'),
    { retrievedAt: RETRIEVED },
  );
  assert.equal(errors.length, 0);
  assert.equal(rows.length, 5);
  for (const r of rows) assert.deepEqual(validateRow(r), [], r.sourceRecordId);
  const den = rows.find((r) => r.sourceRecordId === 'DEN230027');
  assert.equal(den.manufacturerName, 'Ankon Technologies co., ltd');
  assert.equal(den.authorizationDate, '2023-12-12');
  assert.equal(den.deviceTypeCode, 'QZF');
  assert.equal(den.deviceTypeName, null, 'la lista no trae el nombre del tipo');
  assert.equal(
    den.sourceUrl,
    'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/denovo.cfm?id=DEN230027',
  );
  assert.equal(
    fdaSubmissionUrl('K254207'),
    'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/pmn.cfm?ID=K254207',
  );
  assert.equal(
    fdaSubmissionUrl('P940029'),
    'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpma/pma.cfm?id=P940029',
  );
  assert.equal(
    rows.find((r) => r.sourceRecordId === 'K253574').brandName,
    'SOMATOM X.cite; SOMATOM X.ceed',
  );
});

// --- Taxonomía ----------------------------------------------------------------

test('emdnParent sigue la estructura publicada del código', () => {
  assert.equal(emdnParent('W0101060101'), 'W01010601');
  assert.equal(emdnParent('W0101'), 'W01');
  assert.equal(emdnParent('W01'), 'W');
  assert.equal(emdnParent('W'), null);
  assert.equal(
    emdnParent('W010'),
    null,
    'longitud que la estructura no admite',
  );
});

test('Taxonomy: EMDN W es IVD; los ancestros estructurales no reciben nombre inventado', () => {
  const tax = new Taxonomy();
  tax.addFromRow(
    row({
      deviceTypeSystem: 'emdn',
      deviceTypeCode: 'W0101060101',
      deviceTypeName: 'BLOOD GLUCOSE TEST STRIPS',
    }),
  );
  const leaf = tax.nodes.get('emdn|W0101060101');
  assert.equal(leaf.diagnostic, true);
  assert.equal(leaf.basis, 'emdn-category-w');
  assert.equal(tax.nodes.get('emdn|W01').name, null);
  assert.equal(tax.nodes.get('emdn|W').attributes.structural, true);
  tax.addFromRow(
    row({
      sourceRecordId: 'z',
      deviceTypeSystem: 'emdn',
      deviceTypeCode: 'Z1201',
      deviceTypeName: 'X',
    }),
  );
  assert.equal(
    tax.nodes.get('emdn|Z1201').diagnostic,
    null,
    'Z mezcla diagnóstico y terapia: sin criterio',
  );
});

test('Taxonomy: un mapeo publicado (misma fila con dos tipos) propaga la decisión solo si es unánime', () => {
  const { tax } = pcdTaxonomy();
  const gudid = (id, pc, gmdn) =>
    row({
      source: 'fda-gudid',
      sourceRecordId: id,
      deviceTypeSystem: 'fda-product-code',
      deviceTypeCode: pc,
      extra: {
        deviceTypes: [{ system: 'gmdn', code: gmdn, name: `GMDN ${gmdn}` }],
      },
    });
  tax.addFromRow(gudid('1', 'JAK', '37618'));
  tax.addFromRow(gudid('2', 'JAK', '37618'));
  tax.addFromRow(gudid('3', 'JAK', '11111'));
  tax.addFromRow(gudid('4', 'GEI', '11111'));
  assert.equal(tax.propagateByCrosswalk(), 2);
  assert.equal(tax.nodes.get('gmdn|37618').diagnostic, true);
  assert.equal(tax.nodes.get('gmdn|37618').basis, 'crosswalk-published');
  assert.equal(
    tax.crosswalks.get('gmdn|37618→fda-product-code|JAK').records,
    2,
  );
  assert.equal(tax.nodes.get('gmdn|11111').diagnostic, null);
  assert.equal(tax.nodes.get('gmdn|11111').basis, 'crosswalk-mixed');
  assert.equal(
    tax.decideRow(row({ deviceTypeSystem: 'gmdn', deviceTypeCode: '37618' }))
      .diagnostic,
    true,
  );
  assert.equal(
    tax.decideRow(
      row({ deviceTypeSystem: 'fda-product-code', deviceTypeCode: 'GEI' }),
    ).diagnostic,
    false,
  );
  assert.equal(tax.decideRow(row()).diagnostic, null);
});

// --- Fabricantes --------------------------------------------------------------

test('normalizeManufacturerName quita sufijos societarios y conserva el núcleo', () => {
  const k = (s) => normalizeManufacturerName(s).key;
  assert.equal(k('Siemens Healthcare GmbH'), 'SIEMENS HEALTHCARE');
  assert.equal(k('Roche Diagnostics GmbH & Co. KG'), 'ROCHE DIAGNOSTICS');
  assert.equal(
    k('Mindray Bio-Medical Electronics Co., Ltd.'),
    'MINDRAY BIO MEDICAL ELECTRONICS',
  );
  assert.equal(k('Grupo Médico S.A. de C.V.'), 'GRUPO MEDICO');
  assert.equal(k('The Cooper Companies, Inc.'), 'COOPER COMPANIES');
  assert.equal(k('シスメックス株式会社'), 'シスメックス');
  assert.equal(k('Inc'), 'INC', 'nunca deja la clave vacía');
  assert.notEqual(
    k('Sysmex Corporation'),
    k('シスメックス株式会社'),
    'sin transliterar: eso exige un id publicado',
  );
});

test('resolveManufacturers: fusiona por id publicado y por nombre+país; lo dudoso va a revisión', () => {
  const rows = [
    row({
      sourceRecordId: 'a',
      manufacturerName: 'Siemens Healthcare GmbH',
      manufacturerCountry: 'DE',
      manufacturerRegistryId: 'srn:DE-MF-000005678',
    }),
    row({
      sourceRecordId: 'b',
      manufacturerName: 'SIEMENS HEALTHINEERS AG',
      manufacturerCountry: 'DE',
      manufacturerRegistryId: 'srn:DE-MF-000005678',
    }),
    row({
      sourceRecordId: 'c',
      manufacturerName: 'Siemens Healthcare G.m.b.H.',
      manufacturerCountry: 'DE',
    }),
    row({
      sourceRecordId: 'd',
      manufacturerName: 'Acme Ltd',
      manufacturerCountry: 'GB',
      manufacturerRegistryId: 'lei:AAAAAAAAAAAAAAAAAA01',
    }),
    row({
      sourceRecordId: 'e',
      manufacturerName: 'ACME LIMITED',
      manufacturerCountry: 'GB',
      manufacturerRegistryId: 'lei:BBBBBBBBBBBBBBBBBB02',
    }),
    row({
      sourceRecordId: 'f',
      manufacturerName: 'Acme Ltd',
      manufacturerCountry: 'US',
    }),
  ];
  const { entities, entityOfRow, review } = resolveManufacturers(rows);
  const ent = (id) => entityOfRow.get(`test-src\u0000${id}`);
  assert.equal(ent('a'), ent('b'), 'mismo SRN');
  assert.equal(ent('a'), ent('c'), 'mismo nombre normalizado y país');
  assert.notEqual(
    ent('d'),
    ent('e'),
    'dos LEI distintos no se fusionan por nombre',
  );
  assert.notEqual(
    ent('d'),
    ent('f'),
    'mismo nombre en otro país: no se fusiona',
  );
  assert.ok(review.some((r) => r.kind === 'name-match-conflicting-ids'));
  assert.ok(
    review.some(
      (r) => r.kind === 'same-name-different-country' && r.key === 'ACME',
    ),
  );
  const siemens = entities.find((e) => e.id === ent('a'));
  assert.equal(siemens.anchor, 'srn:DE-MF-000005678');
  assert.deepEqual(
    new Set(siemens.merges.map((m) => m.rule)),
    new Set(['same-registry-id', 'same-name-same-country']),
  );
  // Ids estables entre corridas.
  assert.equal(
    resolveManufacturers(rows).entityOfRow.get('test-src\u0000a'),
    ent('a'),
  );
});

test('resolveManufacturers: grupos solo por relaciones publicadas', () => {
  const rows = [
    row({
      manufacturerName: 'Hija SA',
      manufacturerRegistryId: 'lei:CHILD0000000000000001',
    }),
    row({
      sourceRecordId: 'p',
      manufacturerName: 'Madre AG',
      manufacturerRegistryId: 'lei:PARENT000000000000001',
    }),
  ];
  const { entities } = resolveManufacturers(rows, {
    groupLinks: [
      {
        child: 'lei:CHILD0000000000000001',
        parent: 'lei:PARENT000000000000001',
        relation: 'IS_DIRECTLY_CONSOLIDATED_BY',
        source: 'gleif-rr',
        url: 'https://example.org/rr',
      },
    ],
  });
  const hija = entities.find((e) => e.displayName === 'Hija SA');
  assert.equal(hija.groups.length, 1);
  assert.equal(
    hija.groups[0].parentEntityId,
    entities.find((e) => e.displayName === 'Madre AG').id,
  );
  assert.equal(entities.length, 2, 'el grupo enlaza, no fusiona');
});

// --- Consolidación ----------------------------------------------------------------

test('consolidate: agrupa por marca+modelo y por UDI-DI, y conserva cada registro', () => {
  const { tax } = pcdTaxonomy();
  const base = {
    deviceTypeSystem: 'fda-product-code',
    deviceTypeCode: 'JAK',
    manufacturerName: 'Acme Imaging Inc.',
    manufacturerCountry: 'US',
  };
  const rows = [
    row({
      ...base,
      source: 'fda-gudid',
      sourceRecordId: 'g1',
      brandName: 'ACME CT™',
      model: 'X1',
      udiDi: '00812345000011',
    }),
    row({
      ...base,
      source: 'fda-510k',
      sourceRecordId: 'K000001',
      brandName: 'Acme  CT',
      model: 'x1',
    }),
    row({
      ...base,
      source: 'eudamed-udi',
      sourceRecordId: 'u1',
      brandName: 'ACME CT SCANNER',
      model: 'X-1',
      udiDi: '00812345000011',
      manufacturerName: 'Acme Imaging, Inc.',
    }),
    row({
      ...base,
      source: 'fda-gudid',
      sourceRecordId: 'g2',
      brandName: 'ACME CT',
      model: 'X2',
    }),
    row({
      ...base,
      source: 'fda-gudid',
      sourceRecordId: 'g3',
      deviceTypeCode: 'GEI',
      brandName: 'Bisturí',
      model: 'B',
    }),
    row({
      ...base,
      source: 'fda-gudid',
      sourceRecordId: 'g4',
      deviceTypeCode: 'DSQ',
      brandName: 'Bomba',
      model: 'B',
    }),
  ];
  for (const r of rows) tax.addFromRow(r);
  const resolution = resolveManufacturers(rows);
  const cat = consolidate(rows, tax, resolution);
  assert.equal(cat.included, 4);
  assert.equal(cat.excluded.notDiagnostic, 1);
  assert.equal(cat.excluded.undetermined, 1);
  assert.equal(cat.models.length, 2);
  const x1 = cat.models.find((m) => m.modelVariants.includes('X1'));
  assert.equal(
    x1.registrations.length,
    3,
    'GUDID + 510(k) por etiqueta, EUDAMED por UDI-DI',
  );
  assert.deepEqual(x1.jurisdictions, ['EU', 'US']);
  assert.deepEqual(x1.deviceTypes, ['fda-product-code|JAK']);
  assert.equal(cat.manufacturers.length, 1);
  assert.equal(labelKey('Acme  CT™'), 'ACME CT');
  // Mismo resultado y mismos ids si se corre otra vez.
  assert.deepEqual(
    consolidate(rows, tax, resolveManufacturers(rows)).models.map((m) => m.id),
    cat.models.map((m) => m.id),
  );
});

// --- Regiones -----------------------------------------------------------------------

test('regions: lee una carpeta out/ local y descarta el archivo cuyo sha256 no coincide', () => {
  const dir = mkdtempSync(join(tmpdir(), 'dx-region-'));
  try {
    const good = gzipSync(
      `${JSON.stringify(row())}\n${JSON.stringify(row({ sourceRecordId: 'r2' }))}\n`,
    );
    const bad = gzipSync(`${JSON.stringify(row({ sourceRecordId: 'r3' }))}\n`);
    writeFileSync(join(dir, 'test-src.ndjson.gz'), good);
    writeFileSync(join(dir, 'otro.ndjson.gz'), bad);
    const sha = (b) => createHash('sha256').update(b).digest('hex');
    writeFileSync(
      join(dir, 'manifest.json'),
      JSON.stringify({
        region: 'us',
        files: [
          {
            path: 'test-src.ndjson.gz',
            source: 'test-src',
            rows: 2,
            sha256: sha(good),
          },
          {
            path: 'otro.ndjson.gz',
            source: 'test-src',
            rows: 1,
            sha256: '0'.repeat(64),
          },
        ],
      }),
    );
    const loc = locateRegion('us', { dirOverride: dir });
    assert.equal(loc.kind, 'dir');
    const files = [];
    const got = [
      ...readRegionRows(loc, readRegionManifest(loc), {
        onFile: (f) => files.push(f),
      }),
    ];
    assert.deepEqual(
      got.map((r) => r.sourceRecordId),
      ['r1', 'r2'],
    );
    assert.deepEqual(
      files.map((f) => f.ok),
      [true, false],
    );
    assert.ok(statSync(join(dir, 'manifest.json')).size > 0);
    assert.equal(
      locateRegion('eu', { dirOverride: join(dir, 'no-existe') }).kind,
      'missing',
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// --- EMDN ---------------------------------------------------------------------------

test('EMDN: las dos copias reales se leen igual (comillas, saltos dentro de comillas, comillas sin escapar)', () => {
  const a = parseEmdn(readFileSync(join(FX, 'emdn.sample.csv'), 'utf8'));
  const b = parseEmdnTsv(readFileSync(join(FX, 'emdn.sample.tsv'), 'utf8'));
  assert.equal(a.length, 29);
  assert.equal(b.length, 30);
  const cmp = compareEmdnCopies(a, b);
  assert.deepEqual(cmp.onlyA, []);
  assert.deepEqual(cmp.onlyB, ['V020303'], 'TEATS falta en la copia CSV');
  assert.deepEqual(cmp.differ, []);
  assert.equal(
    a.find((r) => r.code === 'H01010102').term,
    'MULTIFILAMENT SYNTHETIC ABSORBABLE SUTURES',
  );
  assert.match(b.find((r) => r.code === 'H010101030303').term, /\("BARBED"\)$/);
});

test('EMDN: W es IVD, un título de grupo diagnóstico decide y uno mixto no', () => {
  const rows = parseEmdn(readFileSync(join(FX, 'emdn.sample.csv'), 'utf8'));
  const { nodes, problems } = emdnNodes(rows, { source: 'ec-emdn' });
  assert.deepEqual(problems, []);
  const n = (c) => nodes.find((x) => x.code === c);
  assert.equal(n('W0101060101').basis, 'emdn-category-w');
  assert.equal(n('L16').basis, 'emdn-group-title');
  assert.equal(n('L1601').diagnostic, true);
  assert.equal(
    n('Z1103').diagnostic,
    null,
    'DIAGNOSTIC AND INTERVENTIONAL: mixto',
  );
  assert.equal(n('Z1103').basis, 'emdn-group-title-mixed');
  assert.equal(n('Z110390').diagnostic, null);
  assert.equal(
    n('Z120302').basis,
    'emdn-group-title',
    'el subgrupo decide aunque el padre sea mixto',
  );
  assert.equal(
    n('Z12030202').basis,
    'emdn-group-title',
    'grupo no terminal con título propio',
  );
  assert.equal(n('W01').basis, 'emdn-category-w');
  assert.equal(n('Z11').diagnostic, null);
  assert.equal(n('H010101030303').diagnostic, null);
  assert.equal(
    emdnGroupTitleDecision('CARDIAC DIAGNOSTIC DEVICES').basis,
    'emdn-group-title',
  );
});

test('decideRow: clase IVD del regulador y alcance publicado de la fuente', () => {
  const tax = new Taxonomy();
  assert.equal(
    tax.decideRow(row({ riskClass: 'au:Class 3 - IVD' })).diagnostic,
    true,
  );
  assert.equal(tax.decideRow(row({ riskClass: 'eu-ivdr:C' })).diagnostic, true);
  assert.equal(
    tax.decideRow(row({ riskClass: 'au:Class IIa' })).diagnostic,
    null,
  );
  assert.equal(
    tax.decideRow(row({ riskClass: 'in:B' })).diagnostic,
    null,
    'India usa A–D para dispositivos e IVD',
  );
  assert.deepEqual(
    tax.decideRow(row({ source: 'cdc-livd-sars-cov-2' })).types,
    ['source-scope|cdc-livd-sars-cov-2'],
  );
});

test('decideRow: área de interés IVD de ANVISA, solo si todas lo son', () => {
  const tax = new Taxonomy();
  const anvisa = (areas) =>
    row({
      source: 'anvisa-produtos',
      deviceTypeSystem: 'br:anvisa-nome-tecnico',
      deviceTypeName: 'PROTEÍNA TOTAL',
      extra: { anvisaPetitions: { areas, primarySubjects: [] } },
    });
  assert.deepEqual(
    tax.decideRow(
      anvisa([
        'Dispositivos Médicos para Diagnóstico in Vitro',
        'Produtos para diagnóstico de uso in vitro',
      ]),
    ).types,
    ['ivd-interest-area|anvisa-produtos'],
  );
  assert.equal(
    tax.decideRow(
      anvisa([
        'Dispositivos Médicos',
        'Dispositivos Médicos para Diagnóstico in Vitro',
      ]),
    ).diagnostic,
    null,
  );
  assert.equal(
    tax.decideRow(anvisa(['Dispositivos Médicos'])).diagnostic,
    null,
  );
  assert.equal(tax.decideRow(anvisa([])).diagnostic, null);
});

test('suplemento del PCD: el código nuevo se decide por su regulación reconstruida', () => {
  const sup = JSON.parse(
    readFileSync(
      join(FX, '..', '..', 'data', 'fda-pcd-supplement.json'),
      'utf8',
    ),
  );
  const sjd = sup.rows.find((r) => r.PRODUCTCODE === 'SJD');
  assert.equal(sjd.REGULATIONNUMBER, '862.1354');
  const n = pcdNode(sjd, { source: 'fda-pcd' }, new Set());
  assert.equal(n.diagnostic, true);
  assert.equal(n.branch, 'ivd');
  assert.ok(
    sup.rows.every(
      (r) =>
        r.REGULATIONNUMBER === null ||
        /^\d{3}\.\d{4}$/.test(r.REGULATIONNUMBER),
    ),
    'sección a 4 dígitos',
  );
});

test('openFDA classification: misma forma que el foiclass y misma decisión', () => {
  const { meta, rows } = parseOpenfdaClassification(
    readFileSync(join(FX, 'openfda-classification.sample.json'), 'utf8'),
  );
  assert.equal(meta.last_updated, '2026-10-21');
  const byCode = Object.fromEntries(rows.map((r) => [r.PRODUCTCODE, r]));
  assert.equal(byCode.CGA.REGULATIONNUMBER, '862.1345');
  assert.equal(byCode.CGA.REVIEW_PANEL, 'CH');
  assert.equal(byCode.CGA.PHYSICALSTATE, '');
  assert.equal(decidePcd(byCode.CGA).diagnostic, true);
  assert.equal(decidePcd(byCode.EJY).diagnostic, false);
  // PNK: la copia fijada lo trae sin regulación; la oficial, con 864.1890.
  assert.equal(decidePcd(byCode.PNK).branch, 'ivd');
  const literal = parsePcd(
    readFileSync(join(FX, 'foiclass.sample.txt'), 'utf8'),
  );
  const cmp = comparePcdCopies(rows, literal);
  assert.deepEqual(cmp.onlyA, ['EJY', 'JJX', 'PNK']);
  assert.equal(cmp.diffs.name.length + cmp.diffs.regulation.length, 0);
});

test('mapeos: dos niveles de la clasificación TFDA no son un mapeo entre nomenclaturas', () => {
  const tax = new Taxonomy();
  tax.addFromRow(
    row({
      source: 'tfda-devices',
      deviceTypeSystem: 'tw:tfda-classification',
      deviceTypeCode: 'E.9999',
      deviceTypeName: '其他',
      extra: {
        deviceTypes: [
          { system: 'tw:tfda-category', code: 'E', name: '心臟血管醫學科學' },
        ],
      },
    }),
  );
  assert.equal(tax.crosswalks.size, 0);
});
