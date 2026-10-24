// Tests del importador de equipos de diagnóstico de Europa.
//   node --test "tools/terminology-import/diagnostic-devices/eu/test/*.test.mjs"
//
// TODOS los datos de estas pruebas son SINTÉTICOS: nombres «SINTETICO …»,
// SRN y UDI-DI de relleno. Solo la FORMA (nombres de campo, sobres de
// respuesta, estructura de códigos EMDN) copia los contratos verificados que
// citan los adaptadores. Nada de esto es un dispositivo real.

import assert from 'node:assert/strict';
import { mkdtempSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

import { buildCorpus, scopeOf } from '../lib/build-corpus.mjs';
import {
  DEVICE_FIELDS,
  RowError,
  dedupe,
  isoDate,
  makeDeviceRecord,
  parseCsv,
  readNdjsonGzParts,
  resolveHeaders,
  writeNdjsonGzParts,
} from '../lib/common.mjs';
import { assertTypePrefixesExist, classifyEmdn } from '../lib/emdn-scope.mjs';
import {
  conceptProperties,
  conceptRowId,
  propertyRowId,
} from '../lib/load-plan.mjs';
import { SOURCES, requiredHosts } from '../lib/sources.mjs';
import {
  discoverExcelLinks,
  levelFromCode,
  parentFromCode,
  parseEmdnRows,
} from '../lib/sources/emdn.mjs';
import {
  assertSafeNext,
  buildReferenceIndex,
  buildUrl,
  countryFromSrn,
  normalizeUdiRow,
  parsePage,
  riskClassWithScheme,
} from '../lib/sources/eudamed-datalake.mjs';
import {
  enrichWithCertificates,
  extractCertificates,
} from '../lib/sources/eudamed-portal.mjs';
import {
  assertColumnMap,
  normalizeBdrdmRow,
} from '../lib/sources/it-bdrdm.mjs';
import { normalizeBasicUdi } from '../lib/sources/swissdamed.mjs';

const T = '2026-10-24T00:00:00.000Z';
const PROV = {
  source: 'test-sintetico',
  sourceRecordId: 'r1',
  sourceUrl: 'https://example.invalid/r1',
  sourceVersion: 'test',
  retrievedAt: T,
  manufacturerName: 'SINTETICO SA',
};

// --- formato común (../README.md, definido por la sesión master) ------------

test('makeDeviceRecord: todos los campos presentes, vacíos → null, extra compacto', () => {
  const r = makeDeviceRecord({
    ...PROV,
    brandName: '  SINTETICO   Marca ',
    model: '',
    extra: { a: null, b: 'x' },
  });
  for (const f of DEVICE_FIELDS) assert.ok(f in r, f);
  assert.equal(r.brandName, 'SINTETICO Marca');
  assert.equal(r.model, null);
  assert.deepEqual(r.extra, { b: 'x' });
  assert.equal('id' in r, false);
});

test('makeDeviceRecord: aplica las reglas del formato común', () => {
  const bad = (patch, re) =>
    assert.throws(
      () => makeDeviceRecord({ ...PROV, ...patch }),
      (e) => e instanceof RowError && re.test(e.message),
    );
  bad({ sourceUrl: '' }, /sourceUrl no puede ser null/);
  bad({ sourceVersion: null }, /sourceVersion no puede ser null/);
  bad({ manufacturerName: ' ' }, /manufacturerName no puede ser null/);
  bad({ source: 'EUDAMED' }, /source inválido/);
  bad({ retrievedAt: '2026-10-24' }, /retrievedAt/);
  bad({ manufacturerCountry: 'Italia' }, /ISO alfa-2/);
  bad({ manufacturerRegistryId: 'DE-MF-000000001' }, /prefijo de esquema/);
  bad(
    { deviceTypeCode: 'W01', deviceTypeSystem: 'EMDN' },
    /deviceTypeSystem desconocido/,
  );
  bad({ deviceTypeCode: 'W01' }, /van juntos/);
  bad({ authorizationDate: '24/10/2026' }, /YYYY-MM-DD/);
  assert.equal(isoDate('2026-01-02T10:00:00Z'), '2026-01-02');
  assert.equal(isoDate('02/01/2026'), null);
});

test('dedupe: exacto por fila, UDI-DI y fabricante+modelo; nunca difuso', () => {
  const mk = (id, p) => makeDeviceRecord({ ...PROV, sourceRecordId: id, ...p });
  const { kept, duplicates } = dedupe([
    mk('a', { udiDi: '000SINTETICO1' }),
    mk('b', { udiDi: '000sintetico1' }),
    mk('c', { model: 'X 1' }),
    mk('d', { manufacturerName: 'sintetico  sa', model: 'x 1' }),
    mk('e', { model: 'X-1' }),
    mk('e', { model: 'otro' }),
  ]);
  assert.deepEqual(
    kept.map((k) => k.sourceRecordId),
    ['a', 'c', 'e'],
  );
  assert.deepEqual(
    duplicates.map((x) => x.key),
    ['udi', 'mf+model', 'row'],
  );
});

test('writeNdjsonGzParts: <base>-0001…, orden determinista, sha256, borra partes viejas', () => {
  const dir = mkdtempSync(join(tmpdir(), 'dx-eu-'));
  const rows = Array.from({ length: 50 }, (_, i) =>
    makeDeviceRecord({
      ...PROV,
      sourceRecordId: `r${String(i).padStart(2, '0')}`,
      brandName: 'SINTETICO '.repeat(20),
    }),
  );
  const parts = writeNdjsonGzParts('eudamed-udi', rows, { dir, maxBytes: 600 });
  assert.ok(parts.length > 1);
  assert.match(parts[0].path, /^eudamed-udi-0001\.ndjson\.gz$/);
  assert.match(parts[0].sha256, /^[0-9a-f]{64}$/);
  const back = readNdjsonGzParts('eudamed-udi', { dir });
  assert.equal(back.length, 50);
  const ids = back.map((r) => r.sourceRecordId);
  assert.deepEqual(ids, [...ids].sort());
  writeNdjsonGzParts('eudamed-udi', rows.slice(0, 1), { dir, maxBytes: 600 });
  assert.deepEqual(readdirSync(dir), ['eudamed-udi-0001.ndjson.gz']);
  writeNdjsonGzParts('eudamed-udi', [], { dir });
  assert.equal(readdirSync(dir).length, 0);
});

test('parseCsv: comillas, separador y BOM', () => {
  const { header, records } = parseCsv('﻿a;b\n"x;1";"di ""y"""\n', {
    delimiter: ';',
  });
  assert.deepEqual(header, ['a', 'b']);
  assert.deepEqual(records, [{ a: 'x;1', b: 'di "y"' }]);
});

test('resolveHeaders: alias exactos; si falta uno muestra los encabezados reales', () => {
  const spec = { code: { aliases: ['EMDN code'], required: true } };
  assert.deepEqual(resolveHeaders(['Emdn  Code'], spec, 'X'), {
    code: 'Emdn  Code',
  });
  assert.throws(
    () => resolveHeaders(['Codigo'], spec, 'X'),
    /Encabezados reales: \["Codigo"\]/,
  );
});

// --- EMDN --------------------------------------------------------------------

const EMDN_HEADER = [
  'CATEGORY',
  'CATEGORY DESCRIPTION',
  'EMDN CODE',
  'TERM',
  'LEVEL',
  'TERMINAL',
];
const emdnRow = (code, term, level, terminal) => ({
  CATEGORY: code[0],
  'CATEGORY DESCRIPTION': 'SINTETICO',
  'EMDN CODE': code,
  TERM: term,
  LEVEL: String(level),
  TERMINAL: terminal,
});
const EMDN_PROV = {
  sourceUrl: 'https://example.invalid/emdn.xlsx',
  sourceVersion: 'test',
  retrievedAt: T,
};

test('EMDN: nivel y padre salen de la estructura del código', () => {
  assert.equal(levelFromCode('W'), 1);
  assert.equal(levelFromCode('W02'), 2);
  assert.equal(levelFromCode('A020199'), 4);
  assert.equal(levelFromCode('Z12130580'), 5);
  assert.equal(levelFromCode('W0'), null);
  assert.equal(parentFromCode('W02'), 'W');
  assert.equal(parentFromCode('W020202'), 'W0202');
  assert.equal(parentFromCode('W'), null);
});

test('EMDN: parsea jerarquía, deduce terminal si falta y marca el alcance', () => {
  const c = parseEmdnRows(
    EMDN_HEADER,
    [
      emdnRow('W', 'SINTETICO categoria', 1, 'N'),
      emdnRow('W01', 'SINTETICO grupo', 2, 'N'),
      emdnRow('W0101', 'SINTETICO tipo', 3, 'Y'),
      emdnRow('Z', 'SINTETICO equipos', 1, 'N'),
      emdnRow('Z11', 'SINTETICO imagen', 2, 'Y'),
      emdnRow('L', 'SINTETICO instrumental', 1, 'Y'),
    ],
    EMDN_PROV,
  );
  const by = new Map(c.map((x) => [x.code, x]));
  assert.equal(by.get('W0101').parentCode, 'W01');
  assert.equal(by.get('W0101').terminal, true);
  assert.equal(by.get('W0101').source, 'ec-emdn');
  assert.equal(
    by.get('W0101').sourceUrl,
    'https://webgate.ec.europa.eu/dyna2/emdn/W0101',
  );
  assert.equal(by.get('W0101').scope.inScope, true);
  assert.equal(by.get('Z11').scope.rule, 'pendiente-revision:Z');
  assert.equal(by.get('L').scope.rule, 'categoria-excluida:L');
  const noTerminal = parseEmdnRows(
    ['EMDN CODE', 'TERM'],
    [
      { 'EMDN CODE': 'W', TERM: 'x' },
      { 'EMDN CODE': 'W01', TERM: 'y' },
    ],
    EMDN_PROV,
  );
  assert.deepEqual(
    noTerminal.map((x) => [x.code, x.terminal, x.terminalSource]),
    [
      ['W', false, 'deducido-sin-hijos'],
      ['W01', true, 'deducido-sin-hijos'],
    ],
  );
});

test('EMDN: huérfanos, nivel incoherente y repetidos fallan', () => {
  assert.throws(
    () =>
      parseEmdnRows(EMDN_HEADER, [emdnRow('W0101', 'x', 3, 'Y')], EMDN_PROV),
    /sin padre/,
  );
  assert.throws(
    () => parseEmdnRows(EMDN_HEADER, [emdnRow('W', 'x', 2, 'N')], EMDN_PROV),
    /Nivel declarado/,
  );
  assert.throws(
    () =>
      parseEmdnRows(
        EMDN_HEADER,
        [emdnRow('W', 'x', 1, 'N'), emdnRow('W', 'y', 1, 'N')],
        EMDN_PROV,
      ),
    /repetido/,
  );
});

test('EMDN: descubre enlaces a Excel en la página oficial', () => {
  const html =
    '<a href="/document/download/abc_en?filename=EMDN_V2_EN.xlsx">x</a><a href="/other.pdf">y</a>';
  assert.deepEqual(
    discoverExcelLinks(html, 'https://health.ec.europa.eu/page'),
    [
      'https://health.ec.europa.eu/document/download/abc_en?filename=EMDN_V2_EN.xlsx',
    ],
  );
});

// --- alcance -----------------------------------------------------------------

test('alcance: W entera; fuera de W solo tipos explícitos; excluidas con motivo', () => {
  assert.equal(classifyEmdn('W0204').inScope, true);
  assert.deepEqual(classifyEmdn('Z12130580'), {
    inScope: false,
    rule: 'pendiente-revision:Z',
  });
  assert.deepEqual(classifyEmdn('A020199'), {
    inScope: false,
    rule: 'categoria-excluida:A',
  });
  assert.deepEqual(classifyEmdn(null), {
    inScope: false,
    rule: 'sin-codigo-emdn',
  });
  const explicit = [
    { prefix: 'Z1101', motive: 'SINTETICO', verifiedAgainst: 'test' },
  ];
  assert.deepEqual(classifyEmdn('Z110101', explicit), {
    inScope: true,
    rule: 'tipo-incluido:Z1101',
  });
  assert.throws(
    () => assertTypePrefixesExist(new Set(['Z11']), explicit),
    /Z1101/,
  );
});

// --- EUDAMED Data Lake ---------------------------------------------------------

const REFERENCE_ROWS = [
  { CODE: 'RISK_CLASS_ID', ID: 7, LANGUAGE: 'en', VALUE: 'SINTETICO Class C' },
  {
    CODE: 'DEVICE_STATUS_TYPE_ID',
    ID: 1,
    LANGUAGE: 'en',
    VALUE: 'SINTETICO On the market',
  },
];
const UDI_ROW = {
  ID: 1,
  VERSION_NUMBER: 3,
  UUID: '00000000-0000-0000-0000-00000000sint',
  PRIMARY_DI: '00000000000017',
  BASIC_UDI: 'SINTETICOBASIC',
  TRADE_NAME: 'SINTETICO Marca',
  DEVICE_NAME: 'SINTETICO analizador',
  DEVICE_MODEL: null,
  REFERENCE: 'REF-SINT-1',
  MF_SRN: 'DE-MF-000000001',
  MF_NAME: 'SINTETICO GmbH',
  NOMENCLATURE_CODE: 'W0101',
  RISK_CLASS_ID: 7,
  DEVICE_STATUS_TYPE_ID: 1,
  APPLICABLE_LEGISLATION_ID: 99,
};

test('Data Lake: URL con parámetros ordenados, format y api-version', () => {
  assert.equal(
    buildUrl(
      'udi',
      { NOMENCLATURE_CODE: 'W0101', MF_SRN: 'X' },
      'https://h.invalid/eudamed',
    ),
    'https://h.invalid/eudamed/udi?MF_SRN=X&NOMENCLATURE_CODE=W0101&format=json&api-version=v1.0',
  );
});

test('Data Lake: sobre {value,nextLink} validado y nextLink sin cambiar la consulta', () => {
  assert.deepEqual(parsePage({ value: [], nextLink: null }), {
    rows: [],
    nextLink: null,
  });
  assert.throws(() => parsePage({ content: [] }), /sin arreglo «value»/);
  const first =
    'https://h.invalid/eudamed/udi?NOMENCLATURE_CODE=W0101&format=json';
  assert.ok(assertSafeNext(`${first}&$skip=100`, first));
  assert.throws(
    () =>
      assertSafeNext(
        'https://h.invalid/eudamed/udi?NOMENCLATURE_CODE=W02&format=json',
        first,
      ),
    /NOMENCLATURE_CODE/,
  );
  assert.throws(
    () => assertSafeNext('https://otro.invalid/eudamed/udi', first),
    /fuera de la consulta/,
  );
});

test('Data Lake: fila /udi → formato común (srn:, decodificación, país por actor o SRN)', () => {
  const ctx = {
    reference: buildReferenceIndex(REFERENCE_ROWS),
    emdnByCode: new Map([['W0101', { display: 'SINTETICO tipo' }]]),
    sourceUrl: 'https://h.invalid/eudamed/udi?NOMENCLATURE_CODE=W0101',
    retrievedAt: T,
  };
  const r = normalizeUdiRow(UDI_ROW, ctx);
  assert.equal(r.source, 'eudamed-udi');
  assert.equal(r.sourceRecordId, UDI_ROW.UUID);
  assert.equal(r.sourceVersion, 'eudamed-public-api-v1.0;record-version=3');
  assert.equal(r.udiDi, '00000000000017');
  assert.equal(r.deviceTypeSystem, 'emdn');
  assert.equal(r.deviceTypeName, 'SINTETICO tipo');
  assert.equal(r.manufacturerRegistryId, 'srn:DE-MF-000000001');
  assert.equal(r.manufacturerCountry, 'DE');
  assert.equal(r.extra.manufacturerCountrySource, 'prefijo-SRN');
  assert.equal(r.model, 'REF-SINT-1');
  assert.equal(r.extra.modelSource, 'REFERENCE');
  assert.equal(r.riskClass, 'eudamed:SINTETICO Class C');
  assert.equal(r.status, 'SINTETICO On the market');
  assert.equal(r.extra.legislation, 'APPLICABLE_LEGISLATION_ID:99');
  const withActor = normalizeUdiRow(
    { ...UDI_ROW, NOMENCLATURE_CODE: 'W0101 W0102' },
    {
      ...ctx,
      actorsBySrn: new Map([
        ['DE-MF-000000001', { ACT_COUNTRY_ISO2_CODE: 'at', NAME: 'SINTETICO' }],
      ]),
    },
  );
  assert.equal(withActor.manufacturerCountry, 'AT');
  assert.deepEqual(withActor.extra.deviceTypes, [
    { system: 'emdn', code: 'W0102', name: null },
  ]);
  assert.equal(countryFromSrn('XX-ZZ-1'), null);
  assert.throws(
    () => normalizeUdiRow({ ...UDI_ROW, MF_NAME: null }, ctx),
    RowError,
  );
});

test('Data Lake: clase con esquema solo si legislación y etiqueta encajan exactamente', () => {
  assert.equal(
    riskClassWithScheme('Class IIa', 'Regulation (EU) 2017/745 (MDR)'),
    'eu-mdr:IIa',
  );
  assert.equal(riskClassWithScheme('C', 'IVDR'), 'eu-ivdr:C');
  assert.equal(
    riskClassWithScheme('Class III', 'Directive 93/42/EEC'),
    'eu-mdd:III',
  );
  assert.equal(
    riskClassWithScheme('List A, Annex II', 'IVDD'),
    'eudamed:List A, Annex II',
  );
  assert.equal(riskClassWithScheme('Class IIa', null), 'eudamed:Class IIa');
  assert.equal(riskClassWithScheme(null, 'MDR'), null);
});

// --- EUDAMED portal (certificados) ---------------------------------------------

test('portal: certificados deduplicados por número+revisión y enriquecimiento', () => {
  const cert = {
    certificateNumber: 'SINT-0001',
    certificateRevision: '1',
    issueDate: '2025-01-02T00:00:00',
    certificateExpiry: '2030-01-01',
    notifiedBody: { srn: '0000', name: 'SINTETICO NB', countryIso2Code: 'DE' },
  };
  const data = { deviceCertificateInfoList: [cert, { ...cert, uuid: 'otro' }] };
  assert.equal(extractCertificates(data).length, 1);
  const base = makeDeviceRecord({ ...PROV });
  const e = enrichWithCertificates(
    base,
    data,
    'https://h.invalid/basicUdiData/x',
  );
  assert.equal(e.authorizationId, 'SINT-0001');
  assert.equal(e.authorizationDate, '2025-01-02');
  assert.equal(e.extra.certificates[0].notifiedBodyName, 'SINTETICO NB');
  assert.equal(enrichWithCertificates(base, {}, 'x'), base);
});

// --- swissdamed ----------------------------------------------------------------

test('swissdamed: un registro por UDI-DI, EMDN del detalle, marca en inglés; desactivado', () => {
  const item = {
    basicUdiDiCode: 'SINTBASIC',
    companyName: 'SINTETICO AG',
    deviceName: 'SINTETICO',
    deviceType: 'IVDR',
    riskClass: 'CLASS_C',
    udiDis: [
      {
        id: '11',
        udiDiCode: '0000000000011',
        marketStatus: 'ON_MARKET',
        lastModifiedAt: '2026-01-01',
        tradeNames: [
          { language: 'DE', textValue: 'SINTETICO de' },
          { language: 'EN', textValue: 'SINTETICO en' },
        ],
      },
      { udiDiCode: 'sin-id' },
    ],
  };
  const details = new Map([
    [
      '11',
      {
        udiDi: {
          nomenclatureCodes: [{ code: 'W0101', term: 'SINTETICO tipo' }],
        },
      },
    ],
  ]);
  const [r, ...rest] = normalizeBasicUdi(item, {
    retrievedAt: T,
    detailsById: details,
  });
  assert.equal(rest.length, 0);
  assert.equal(r.source, 'swissmedic-swissdamed');
  assert.equal(r.brandName, 'SINTETICO en');
  assert.equal(r.deviceTypeCode, 'W0101');
  assert.equal(r.riskClass, 'swissdamed:CLASS_C');
  assert.equal(
    r.sourceUrl,
    'https://swissdamed.ch/public/udi/udi-dis/11/details',
  );
  assert.equal(r.extra.tradeNames.length, 2);
  assert.equal(SOURCES.SWISSDAMED.autoFetch, false);
});

// --- Italia BD/RDM -------------------------------------------------------------

test('BD/RDM: sin mapeo verificado no normaliza y muestra el encabezado real', () => {
  assert.throws(
    () =>
      assertColumnMap({ verified: false, columns: {} }, ['progressivo_dm_ass']),
    /Encabezados reales: \["progressivo_dm_ass"\]/,
  );
  const map = {
    verified: true,
    columns: {
      recordNumber: 'n',
      recordType: 't',
      cndCode: 'cnd',
      manufacturerName: 'fab',
      registrationDate: 'd',
      brandName: null,
    },
  };
  assert.throws(() => assertColumnMap(map, ['n', 't', 'cnd', 'd']), /fab/);
  assertColumnMap(map, ['n', 't', 'cnd', 'fab', 'd']);
  const r = normalizeBdrdmRow(
    { n: '9', t: '1', cnd: 'W0101', fab: 'SINTETICO SpA', d: '2020-05-06' },
    map,
    {
      sourceUrl: 'https://example.invalid/bdrdm.csv',
      sourceVersion: 'test',
      retrievedAt: T,
    },
  );
  assert.equal(r.source, 'it-salute-bdrdm');
  assert.equal(r.sourceRecordId, '1:9');
  assert.equal(r.deviceTypeSystem, 'cnd');
  assert.equal(r.authorizationDate, '2020-05-06');
  assert.equal(r.brandName, null);
});

// --- ensamblado y cobertura ----------------------------------------------------

test('buildCorpus: exporta alcance y revisión, excluye el resto, deduplica y rechaza sin fabricante', () => {
  const emdnConcepts = parseEmdnRows(
    EMDN_HEADER,
    [
      emdnRow('W', 'SINTETICO', 1, 'N'),
      emdnRow('W01', 'SINTETICO', 2, 'N'),
      emdnRow('W0101', 'SINTETICO tipo', 3, 'Y'),
      emdnRow('W0102', 'SINTETICO tipo 2', 3, 'Y'),
      emdnRow('L', 'SINTETICO', 1, 'Y'),
      emdnRow('Z', 'SINTETICO', 1, 'Y'),
    ],
    EMDN_PROV,
  );
  const page = (rows) => ({
    rows,
    sourceUrl: 'https://h.invalid/udi',
    retrievedAt: T,
  });
  const { devices, coverage } = buildCorpus({
    emdnConcepts,
    referenceRows: REFERENCE_ROWS,
    udiPages: [
      page([
        UDI_ROW,
        { ...UDI_ROW, UUID: 'dup', VERSION_NUMBER: 4 },
        {
          ...UDI_ROW,
          UUID: 'l',
          PRIMARY_DI: '2',
          NOMENCLATURE_CODE: 'L',
          MF_SRN: 'IT-MF-000000002',
        },
        {
          ...UDI_ROW,
          UUID: 'z',
          PRIMARY_DI: '3',
          REFERENCE: 'REF-SINT-Z',
          NOMENCLATURE_CODE: 'Z',
        },
        { ...UDI_ROW, UUID: 'sin-fabricante', PRIMARY_DI: '4', MF_NAME: null },
      ]),
    ],
    actorRows: [
      {
        ACTOR_ID: 'DE-MF-000000001',
        NAME: 'SINTETICO GmbH',
        ACT_COUNTRY_ISO2_CODE: 'DE',
      },
    ],
    gaps: [{ source: 'test', reason: 'SINTETICO' }],
  });
  assert.deepEqual(
    devices.map((d) => [d.sourceRecordId, d.extra.dxScope]),
    [
      [UDI_ROW.UUID, 'categoria-incluida:W'],
      ['z', 'pendiente-revision:Z'],
    ],
  );
  assert.equal(
    devices[0].extra.manufacturerCountrySource,
    'eudamed-actors:ACT_COUNTRY_ISO2_CODE',
  );
  assert.equal(coverage.totalRead, 5);
  assert.equal(coverage.rejectedRows, 1);
  assert.equal(coverage.duplicatesDropped, 1);
  assert.equal(coverage.devicesInScope, 1);
  assert.equal(coverage.devicesPendingReview, 1);
  assert.deepEqual(coverage.excludedByRule, { 'categoria-excluida:L': 1 });
  assert.equal(coverage.distinctBrands, 1);
  assert.equal(coverage.emdn.inScopeTerminalWithoutDevices, 1);
  assert.equal(scopeOf(makeDeviceRecord({ ...PROV })).rule, 'sin-codigo-emdn');
});

// --- plan de carga y registro de fuentes ---------------------------------------

test('plan de carga: ids estables y propiedades sin nulos', () => {
  const [c] = parseEmdnRows(
    EMDN_HEADER,
    [emdnRow('W', 'SINTETICO', 1, 'N')],
    EMDN_PROV,
  );
  assert.equal(conceptRowId('v', 'W'), conceptRowId('v', 'W'));
  assert.notEqual(
    propertyRowId('a', 'emdn_level'),
    propertyRowId('a', 'emdn_terminal'),
  );
  const props = Object.fromEntries(conceptProperties(c));
  assert.equal(props.emdn_level, 1);
  assert.equal('emdn_parent_code' in props, false);
  assert.deepEqual(props.dx_device_scope, {
    inScope: true,
    rule: 'categoria-incluida:W',
  });
});

test('fuentes: cada una declara términos y los hosts requeridos incluyen EUDAMED', () => {
  for (const [k, s] of Object.entries(SOURCES)) {
    assert.ok(s.terms?.text, k);
    assert.equal(typeof s.terms.verified, 'boolean', k);
    assert.ok(new URL(s.probeUrl), k);
  }
  assert.ok(
    requiredHosts().includes('api.datalake.sante.service.ec.europa.eu'),
  );
});
