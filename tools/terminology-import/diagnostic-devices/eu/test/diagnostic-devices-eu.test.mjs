// Tests del importador de equipos de diagnóstico de Europa.
//   node --test "tools/terminology-import/diagnostic-devices/eu/test/*.test.mjs"
//
// TODOS los datos de estas pruebas son SINTÉTICOS: nombres «SINTETICO …»,
// SRN y UDI-DI de relleno. Solo la FORMA (nombres de campo, sobres de
// respuesta, estructura de códigos EMDN) copia los contratos verificados que
// citan los adaptadores. Nada de esto es un dispositivo real.

import assert from 'node:assert/strict';
import { mkdtempSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

import {
  buildCorpus,
  scopeOf,
  withCertificates,
} from '../lib/build-corpus.mjs';
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
  readFirstSheet,
} from '../lib/sources/emdn.mjs';
import {
  assertSafeNext,
  buildReferenceIndex,
  buildUrl,
  countryFromSrn,
  deviceDetailUrl,
  normalizeDatalakeActor,
  normalizeUdiRow,
  parsePage,
  riskClassWithScheme,
} from '../lib/sources/eudamed-datalake.mjs';
import {
  enrichWithCertificates,
  extractCertificates,
} from '../lib/sources/eudamed-portal.mjs';
import {
  findBaseUnit,
  firstbaseRiskClass,
  normalizeFirstbaseDoc,
} from '../lib/sources/eudamed-firstbase.mjs';
import {
  dlinrtRecordId,
  dlinrtRiskClass,
  assertDlinrtHeader,
  normalizeDlinrtRow,
} from '../lib/sources/dlinrt.mjs';
import {
  countryNameToIso,
  normalizeActorRow,
  parseSrnCell,
  selectCurrentVersions,
} from '../lib/sources/eudamed-actors.mjs';
import { MIRRORS } from '../lib/mirrors.mjs';
import {
  assertColumnMap,
  bdrdmManufacturerIds,
  loadColumnMap,
  normalizeBdrdmRow,
  readBdrdmCsv,
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
  assert.equal(by.get('Z11').scope.rule, 'no-diagnostico-tras-revision:Z');
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
    rule: 'no-diagnostico-tras-revision:Z',
  });
  assert.deepEqual(classifyEmdn('Z110401'), {
    inScope: true,
    rule: 'tipo-incluido:Z1104',
  });
  assert.deepEqual(classifyEmdn('Z110101'), {
    inScope: false,
    rule: 'no-diagnostico-tras-revision:Z',
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

test('buildCorpus: exporta solo lo que está en alcance, excluye el resto, deduplica y rechaza sin fabricante', () => {
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
          NOMENCLATURE_CODE: 'Z110401',
        },
        {
          ...UDI_ROW,
          UUID: 'rt',
          PRIMARY_DI: '5',
          REFERENCE: 'REF-SINT-RT',
          NOMENCLATURE_CODE: 'Z110101',
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
      ['z', 'tipo-incluido:Z1104'],
    ],
  );
  assert.equal(
    devices[0].extra.manufacturerCountrySource,
    'eudamed-actors:ACT_COUNTRY_ISO2_CODE',
  );
  assert.equal(coverage.totalRead, 6);
  assert.equal(coverage.rejectedRows, 1);
  assert.equal(coverage.duplicatesDropped, 1);
  assert.equal(coverage.devicesInScope, 2);
  assert.deepEqual(coverage.excludedByRule, {
    'categoria-excluida:L': 1,
    'no-diagnostico-tras-revision:Z': 1,
  });
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

// --- réplicas en git (EUDAMED vía eudamed2firstbase, DLinRT, actores) -------

const MIRROR = {
  repo: 'https://example.invalid/mirror',
  commit: '0123456789abcdef0123456789abcdef01234567',
  path: 'x.json',
  sha256: 'f'.repeat(64),
};
const gs1Base = (patch = {}) => ({
  IsTradeItemABaseUnit: true,
  Gtin: '00000000000024',
  TradeItemUnitDescriptorCode: { Value: 'BASE_UNIT_OR_EACH' },
  GdsnTradeItemClassification: {
    AdditionalTradeItemClassification: [
      {
        AdditionalTradeItemClassificationSystemCode: { Value: '76' },
        AdditionalTradeItemClassificationValue: [
          { AdditionalTradeItemClassificationCodeValue: 'EU_CLASS_IIA' },
        ],
      },
      {
        AdditionalTradeItemClassificationSystemCode: { Value: '88' },
        AdditionalTradeItemClassificationValue: [
          { AdditionalTradeItemClassificationCodeValue: 'Z110401' },
        ],
      },
    ],
  },
  RegulatedTradeItemModule: {
    RegulatoryInformation: [{ RegulatoryAct: 'MDR', RegulatoryAgency: 'EU' }],
  },
  MedicalDeviceTradeItemModule: {
    MedicalDeviceInformation: {
      EUMedicalDeviceStatusCode: { Value: 'ON_MARKET' },
    },
  },
  TradeItemDescriptionModule: {
    TradeItemDescriptionInformation: {
      TradeItemDescription: [
        { LanguageCode: 'de', Value: 'SINTETICO de' },
        { LanguageCode: 'en', Value: 'SINTETICO Eco' },
      ],
    },
  },
  AdditionalTradeItemIdentification: [
    {
      AdditionalTradeItemIdentificationTypeCode: 'MANUFACTURER_PART_NUMBER',
      Value: '00000000000024',
    },
  ],
  CertificationInformationModule: {
    CertificationInformation: [
      {
        AdditionalCertificationOrganisationIdentifier: [
          {
            AdditionalPartyIdentificationTypeCode: 'EU_NOTIFIED_BODY_NUMBER',
            Value: '0000',
          },
        ],
        CertificationAgency: 'SINTETICO NB',
        CertificationStandard: 'MDR_QUALITY_MANAGEMENT_SYSTEM',
        Certification: [
          {
            CertificationValue: 'SINT-CERT-1',
            CertificationIdentification: '01',
            CertificationEffectiveStartDateTime: '2025-02-10',
            CertificationEffectiveEndDateTime: '2029-02-23',
          },
        ],
      },
    ],
  },
  TradeItemContactInformation: [
    {
      ContactTypeCode: { Value: 'EMA' },
      ContactName: 'SINTETICO Co.',
      AdditionalPartyIdentification: [
        {
          AdditionalPartyIdentificationTypeCode: 'SRN',
          Value: 'KR-MF-000000001',
        },
      ],
    },
    {
      ContactTypeCode: { Value: 'EAR' },
      ContactName: 'SINTETICO AR',
      AdditionalPartyIdentification: [
        {
          AdditionalPartyIdentificationTypeCode: 'SRN',
          Value: 'IE-AR-000000001',
        },
      ],
    },
  ],
  GlobalModelInformation: [
    {
      GlobalModelNumber: 'SINTBASIC1',
      GlobalModelDescription: [
        { LanguageCode: 'en', Value: 'SINTETICO device' },
      ],
    },
  ],
  ...patch,
});

test('firstbase: unidad base anidada en el empaque y GTIN de los niveles superiores', () => {
  const draft = {
    TradeItem: {
      IsTradeItemABaseUnit: false,
      Gtin: '20000000000028',
      TradeItemUnitDescriptorCode: { Value: 'CASE' },
    },
    CatalogueItemChildItemLink: [
      {
        Quantity: 4,
        CatalogueItem: {
          TradeItem: {
            IsTradeItemABaseUnit: false,
            Gtin: '10000000000021',
            TradeItemUnitDescriptorCode: { Value: 'PACK_OR_INNER_PACK' },
          },
          CatalogueItemChildItemLink: [
            { Quantity: 10, CatalogueItem: { TradeItem: gs1Base() } },
          ],
        },
      },
    ],
  };
  const { base, packages } = findBaseUnit(draft);
  assert.equal(base.Gtin, '00000000000024');
  assert.deepEqual(
    packages.map((p) => p.gtin),
    ['20000000000028', '10000000000021'],
  );
});

test('firstbase: documento → fila común con EMDN 88, clase con esquema, certificado y réplica citada', () => {
  const r = normalizeFirstbaseDoc(
    { DraftItem: { TradeItem: gs1Base() } },
    {
      uuid: '11111111-2222-3333-4444-555555555555',
      emdnByCode: new Map([['Z110401', { display: 'SINTETICO ecógrafo' }]]),
      mirror: MIRROR,
      retrievedAt: T,
    },
  );
  assert.equal(r.source, 'eudamed-udi');
  assert.equal(
    r.sourceUrl,
    'https://ec.europa.eu/tools/eudamed/api/devices/udiDiData/11111111-2222-3333-4444-555555555555?languageIso2Code=en',
  );
  assert.match(r.sourceVersion, /via=eudamed2firstbase@01234567/);
  assert.equal(r.deviceTypeCode, 'Z110401');
  assert.equal(r.deviceTypeName, 'SINTETICO ecógrafo');
  assert.equal(r.manufacturerRegistryId, 'srn:KR-MF-000000001');
  assert.equal(r.manufacturerCountry, 'KR');
  assert.equal(r.brandName, 'SINTETICO Eco');
  // MANUFACTURER_PART_NUMBER igual al GTIN = relleno del convertidor, no un modelo.
  assert.equal(r.model, null);
  assert.equal(r.riskClass, 'eu-mdr:IIa');
  assert.equal(r.authorizationId, 'SINT-CERT-1');
  assert.equal(r.authorizationDate, '2025-02-10');
  assert.equal(r.extra.certificates[0].notifiedBodyNumber, '0000');
  assert.equal(r.extra.basicUdiDi, 'SINTBASIC1');
  assert.equal(r.extra.authorisedRepresentativeSrn, 'IE-AR-000000001');
  assert.equal(r.extra.mirror.commit, MIRROR.commit);
  const withModel = normalizeFirstbaseDoc(
    {
      DraftItem: {
        TradeItem: gs1Base({
          AdditionalTradeItemIdentification: [
            {
              AdditionalTradeItemIdentificationTypeCode:
                'MANUFACTURER_PART_NUMBER',
              Value: 'REF-1',
            },
            {
              AdditionalTradeItemIdentificationTypeCode: 'MODEL_NUMBER',
              Value: 'MOD-1',
            },
          ],
        }),
      },
    },
    { uuid: 'u2', mirror: MIRROR, retrievedAt: T },
  );
  assert.equal(withModel.model, 'MOD-1');
  assert.equal(withModel.extra.reference, 'REF-1');
});

test('firstbase: clases MDR/IVDR/legado con esquema; clase I marcada como posible defecto del convertidor', () => {
  assert.equal(firstbaseRiskClass('EU_CLASS_IIB', '76', 'MDR'), 'eu-mdr:IIb');
  assert.equal(firstbaseRiskClass('EU_CLASS_C', '76', 'IVDR'), 'eu-ivdr:C');
  assert.equal(
    firstbaseRiskClass('IVDD_GENERAL', '85', 'IVDD'),
    'eu-ivdd:IVDD_GENERAL',
  );
  assert.equal(
    firstbaseRiskClass('EU_CLASS_I', '76', null),
    'gs1-76:EU_CLASS_I',
  );
  const doc = gs1Base();
  doc.GdsnTradeItemClassification.AdditionalTradeItemClassification[0].AdditionalTradeItemClassificationValue[0].AdditionalTradeItemClassificationCodeValue =
    'EU_CLASS_I';
  const r = normalizeFirstbaseDoc(
    { DraftItem: { TradeItem: doc } },
    { uuid: 'u3', mirror: MIRROR, retrievedAt: T },
  );
  assert.equal(r.extra.riskClassMayBeConverterDefault, true);
});

test('DLinRT: UUID del UDI-DI desde detail_url, clase verbatim sin legislación', () => {
  const header = [
    'cnd_code',
    'cnd_term',
    'trade_name',
    'device_name',
    'device_model',
    'manufacturer_name',
    'manufacturer_srn',
    'risk_class',
    'legislation',
    'device_status',
    'basic_udi',
    'primary_di',
    'certificate_numbers',
    'notified_bodies',
    'query_url',
    'detail_url',
  ];
  assertDlinrtHeader(header);
  assert.throws(() => assertDlinrtHeader(['cnd_code']), /Encabezados reales/);
  const row = {
    cnd_code: 'Z11040192',
    cnd_term: 'SINTETICO software',
    trade_name: 'SINTETICO App',
    device_name: '',
    device_model: '',
    manufacturer_name: 'SINTETICO Ltd.',
    manufacturer_srn: 'TW-MF-000000001',
    risk_class: 'class-iia',
    legislation: '',
    device_status: 'on-the-market',
    basic_udi: 'SINTBASIC2',
    primary_di: '00000000000031',
    certificate_numbers: '',
    notified_bodies: '',
    query_url:
      'https://ec.europa.eu/tools/eudamed/api/devices/udiDiData?cndCode=Z11040192',
    detail_url:
      'https://ec.europa.eu/tools/eudamed/api/devices/basicUdiData/udiDiData/709aab48-067e-4234-80f4-3c419fc67092',
  };
  assert.equal(dlinrtRecordId(row), '709aab48-067e-4234-80f4-3c419fc67092');
  const r = normalizeDlinrtRow(row, { mirror: MIRROR, retrievedAt: T });
  assert.equal(r.sourceRecordId, '709aab48-067e-4234-80f4-3c419fc67092');
  assert.equal(r.riskClass, 'eudamed:class-iia');
  assert.equal(r.manufacturerCountry, 'TW');
  assert.equal(r.udiDi, '00000000000031');
  assert.equal(dlinrtRiskClass('class-iib', 'MDR'), 'eu-mdr:IIb');
});

test('actores: SRN con estado pegado, versión vigente por SRN, país exacto o por prefijo', () => {
  assert.deepEqual(parseSrnCell('AT-MF-000000001\r\nInactive'), {
    srn: 'AT-MF-000000001',
    status: 'Inactive',
  });
  assert.deepEqual(parseSrnCell('no-es-srn'), { srn: null, status: null });
  const rows = [
    {
      'Actor ID/SRN': 'AT-MF-000000001',
      Version: '1 (History)',
      Name: 'SINTETICO viejo',
      Country: 'Austria',
    },
    {
      'Actor ID/SRN': 'AT-MF-000000001',
      Version: '2 (Current)',
      Name: 'SINTETICO GmbH',
      Country: 'Austria',
    },
    {
      'Actor ID/SRN': 'KR-MF-000000002',
      Version: '1 (Current)',
      Name: 'SINTETICO Co.',
      Country: 'Republic of Korea',
    },
  ];
  const sel = selectCurrentVersions(rows);
  assert.deepEqual(
    sel.map((x) => [x.row.Name, x.versions]),
    [
      ['SINTETICO GmbH', 2],
      ['SINTETICO Co.', 1],
    ],
  );
  assert.equal(countryNameToIso('Austria'), 'AT');
  assert.equal(countryNameToIso('Republic of Korea'), null);
  const ctx = {
    sourceUrl: 'https://ec.europa.eu/tools/eudamed/',
    mirror: MIRROR,
    retrievedAt: T,
  };
  const at = normalizeActorRow(sel[0].row, { ...ctx, versions: 2 });
  assert.equal(at.manufacturerRegistryId, 'srn:AT-MF-000000001');
  assert.equal(at.manufacturerCountry, 'AT');
  assert.equal(at.extra.manufacturerCountrySource, 'nombre-de-pais-exacto');
  assert.equal('udiDi' in at, false);
  const kr = normalizeActorRow(sel[1].row, ctx);
  assert.equal(kr.manufacturerCountry, 'KR');
  assert.equal(kr.extra.manufacturerCountrySource, 'prefijo-SRN');
});

test('réplicas: cada una fija commit completo, licencia y fuente oficial', () => {
  for (const m of MIRRORS) {
    assert.match(m.commit, /^[0-9a-f]{40}$/, m.id);
    assert.ok(m.license && m.upstream && m.data, m.id);
    assert.ok(m.paths.length, m.id);
  }
});

// --- pasada 7: fuentes oficiales con la red abierta ---------------------------

test('dedupe: dos UDI-DI distintos con el mismo modelo se conservan los dos', () => {
  const mk = (id, p) => makeDeviceRecord({ ...PROV, sourceRecordId: id, ...p });
  const { kept, duplicates } = dedupe([
    mk('a', { udiDi: '000SINTETICO1', model: 'M1', brandName: 'B' }),
    mk('b', { udiDi: '000SINTETICO2', model: 'M1', brandName: 'B' }),
    // Sin UDI-DI: cae por fabricante + modelo + marca contra las de arriba.
    mk('c', { model: 'm1', brandName: 'b' }),
  ]);
  assert.deepEqual(
    kept.map((k) => k.sourceRecordId),
    ['a', 'b'],
  );
  assert.deepEqual(
    duplicates.map((x) => x.key),
    ['mf+model'],
  );
});

test('Data Lake: el filtro NOMENCLATURE_CODE conserva el espacio inicial y $after no rompe nextLink', () => {
  const first = buildUrl('udi', { NOMENCLATURE_CODE: ' W0101' });
  assert.match(first, /NOMENCLATURE_CODE=(%20|\+)W0101/);
  const next = `${first}&$after=abc`;
  assert.equal(assertSafeNext(next, first), next);
  const page2 = `${first}&$after=def`;
  assert.equal(assertSafeNext(page2, next), page2);
  assert.throws(() =>
    assertSafeNext(
      buildUrl('udi', { NOMENCLATURE_CODE: ' W0102' }) + '&$after=x',
      first,
    ),
  );
});

test('Data Lake: sourceUrl de cada UDI es la ficha pública por UUID', () => {
  assert.equal(
    deviceDetailUrl('00000000-0000-0000-0000-000000000001'),
    'https://ec.europa.eu/tools/eudamed/api/devices/udiDiData/00000000-0000-0000-0000-000000000001?languageIso2Code=en',
  );
});

test('Data Lake: actor → solo datos de la organización; nunca PRRC, correo ni teléfono', () => {
  const a = normalizeDatalakeActor(
    {
      ACTOR_ID: 'DE-MF-000000001',
      VERSION: 3,
      NAME: 'SINTETICO GmbH',
      ACTOR_TYPE: 'Manufacturer',
      STATUS: 'ACTIVE',
      ACT_COUNTRY_ISO2_CODE: 'de',
      ACT_ADDR_CITY_NAME: 'Sintetica',
      ACT_EMAIL: 'persona@example.invalid',
      ACT_PHONE: '+00 000',
      PRRC_NAME: 'Persona Sintetica',
      PRRC_EMAIL: 'prrc@example.invalid',
    },
    { sourceUrl: 'https://example.invalid/a', retrievedAt: T },
  );
  assert.equal(a.manufacturerRegistryId, 'srn:DE-MF-000000001');
  assert.equal(a.manufacturerCountry, 'DE');
  const text = JSON.stringify(a);
  for (const leak of ['persona@', 'prrc@', '+00 000', 'Persona Sintetica'])
    assert.ok(!text.includes(leak), `se filtró ${leak}`);
  assert.equal(
    normalizeDatalakeActor(
      { ACTOR_ID: 'no-es-srn' },
      { sourceUrl: 'x', retrievedAt: T },
    ),
    null,
  );
});

test('withCertificates: copia el certificado de la réplica por UUID sin pisar uno propio', () => {
  const certs = new Map([
    [
      'uuid-1',
      {
        authorizationId: 'CERT-SINTETICO-1',
        authorizationDate: '2024-01-02',
        certificates: [{ number: 'CERT-SINTETICO-1' }],
        mirror: 'replica@abc',
      },
    ],
  ]);
  const base = makeDeviceRecord({ ...PROV, sourceRecordId: 'uuid-1' });
  const r = withCertificates(base, certs);
  assert.equal(r.authorizationId, 'CERT-SINTETICO-1');
  assert.equal(r.extra.certificatesSource, 'replica@abc');
  const own = { ...base, authorizationId: 'PROPIO' };
  assert.equal(withCertificates(own, certs), own);
  const other = makeDeviceRecord({ ...PROV, sourceRecordId: 'uuid-2' });
  assert.equal(withCertificates(other, certs), other);
});

test('EMDN: el Excel oficial con fila de título y sufijo de versión se lee', async () => {
  const XLSX = (await import('xlsx')).default;
  const dir = mkdtempSync(join(tmpdir(), 'emdn-'));
  const file = join(dir, 'EMDN_sintetico.xlsx');
  const ws = XLSX.utils.aoa_to_sheet([
    ['EMDN_v.2026'],
    ['CODE', 'TERM EMDN (v.2026)', 'LEVEL', 'terminal level yes/no'],
    ['W', 'SINTETICO W', '1', 'NO'],
    ['W01', 'SINTETICO W01', '2', 'YES'],
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'EMDN');
  XLSX.writeFile(wb, file);
  const { header, records } = await readFirstSheet(file);
  assert.equal(header[0], 'CODE');
  assert.equal(records.length, 2);
  const concepts = parseEmdnRows(header, records, {
    sourceUrl: 'https://example.invalid/emdn.xlsx',
    sourceVersion: 'test',
    retrievedAt: T,
  });
  assert.deepEqual(
    concepts.map((c) => [c.code, c.display]),
    [
      ['W', 'SINTETICO W'],
      ['W01', 'SINTETICO W01'],
    ],
  );
});

test('BD/RDM: el mapeo verificado coincide con el encabezado oficial y normaliza fechas y ids', () => {
  const header = [
    'tipologia_dm',
    'progressivo_dm_ass',
    'data_prima_pubblicazione',
    'dm_riferimento',
    'gruppo_dm_simili',
    'iscrizione_repertorio',
    'data_inizio_validita',
    'data_fine_validita',
    'fabbricante_assemblatore',
    'cod_fiscale',
    'PARTITAIVA_VATNUMBER_MAND',
    'cod_catalogo_fabbr_ass',
    'denominazione_commerciale',
    'classificazione_cnd',
    'descrizione_cnd',
    'data_fine_commercio',
    '',
  ];
  const map = loadColumnMap();
  assert.equal(map.verified, true);
  assertColumnMap(map, header);
  const ctx = {
    sourceUrl: 'https://example.invalid/rdm_csv.zip',
    sourceVersion: 'test',
    retrievedAt: T,
  };
  const row = {
    tipologia_dm: '1',
    progressivo_dm_ass: '42',
    data_prima_pubblicazione: '2010-02-03 00:00:00',
    data_inizio_validita: '2011-04-05 00:00:00',
    data_fine_validita: '9999-12-31 00:00:00',
    iscrizione_repertorio: 'S',
    fabbricante_assemblatore: 'SINTETICO SRL',
    cod_fiscale: '00000000001',
    PARTITAIVA_VATNUMBER_MAND: '00000000001',
    cod_catalogo_fabbr_ass: 'CAT-1',
    denominazione_commerciale: 'SINTETICO TEST',
    classificazione_cnd: 'W0101',
    descrizione_cnd: 'SINTETICO',
    data_fine_commercio: '',
  };
  const r = normalizeBdrdmRow(row, map, ctx);
  assert.equal(r.sourceRecordId, '1:42');
  assert.equal(r.authorizationDate, '2010-02-03');
  assert.equal(r.manufacturerRegistryId, 'it-cf:00000000001');
  assert.deepEqual(r.extra.manufacturerIds, ['vat:00000000001']);
  assert.equal(r.model, 'CAT-1');
  assert.equal(r.brandName, 'SINTETICO TEST');
  assert.equal(r.extra.versionStartDate, '2011-04-05');
  assert.equal(
    r.extra.versionEndDate,
    undefined,
    '9999-12-31 es «vigente», no una fecha',
  );
  const cancelled = normalizeBdrdmRow(
    { ...row, data_fine_validita: '2020-01-01 00:00:00' },
    map,
    ctx,
  );
  assert.equal(cancelled.extra.versionEndDate, '2020-01-01');
});

test('BD/RDM: el código fiscal de persona física (16 caracteres) nunca se publica', () => {
  assert.deepEqual(bdrdmManufacturerIds('RSSMRA00A01H501U', ''), []);
  assert.deepEqual(bdrdmManufacturerIds('RSSMRA00A01H501U', '00000000001'), [
    'vat:00000000001',
  ]);
  assert.deepEqual(bdrdmManufacturerIds('00000000001', null), [
    'it-cf:00000000001',
  ]);
});

test('BD/RDM: lectura en streaming por lotes, con BOM, `;` final y comillas multilínea', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'bdrdm-'));
  const file = join(dir, 'rdm.csv');
  writeFileSync(file, '\uFEFFa;b;\n1;x;\n2;"y\nz";\n3;"w;v";\n');
  const batches = [];
  for await (const b of readBdrdmCsv(file, { batchLines: 2 })) batches.push(b);
  assert.equal(batches.length, 2);
  assert.deepEqual(batches[0].header.slice(0, 2), ['a', 'b']);
  const rows = batches.flatMap((b) => b.records);
  assert.deepEqual(
    rows.map((r) => [r.a, r.b]),
    [
      ['1', 'x'],
      ['2', 'y\nz'],
      ['3', 'w;v'],
    ],
  );
});
