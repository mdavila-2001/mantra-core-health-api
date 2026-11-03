#!/usr/bin/env node
// =============================================================================
// Equipos de diagnóstico · ROW · etapa 1: descargas → `out/` (formato común).
//
// Lee lo que `fetch-official.mjs` (portales oficiales) y `fetch-mirrors.mjs`
// (espejos fijados) dejaron en `$DX_DEVICES_BUILD_DIR` (sin red) y
// escribe `out/<source>[-NNNN].ndjson.gz` + `out/manifest.json`. Re-ejecutable:
// la misma entrada produce los mismos archivos y los mismos sha256.
//
// Uso: node tools/terminology-import/diagnostic-devices/row/build.mjs [--only anvisa-produtos,pmda-approvals]
// =============================================================================

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { TextDecoder } from 'node:util';
import { gzipSync } from 'node:zlib';

import { parseCsv } from '../../lib/medicine-catalog/common.mjs';
import {
  addPetitionLine,
  anvisaModelosRows,
  anvisaProdutosRows,
  anvisaUpdateStamp,
  freezePetitionIndex,
} from './lib/anvisa.mjs';
import { cdscoOfficialRows } from './lib/cdsco-official.mjs';
import { indexMdall, mdallRows } from './lib/hc-mdall.mjs';
import { readDelimitedRows } from './lib/lines.mjs';
import { PartWriter } from './lib/out.mjs';
import { parseJmdnPage } from './lib/jmdn.mjs';
import { extractPmdaDataset, pmdaRows } from './lib/pmda.mjs';
import { BUILD_DIR, OUT_DIR, ensureDir, readJson } from './lib/row.mjs';
import { invimaRows } from './lib/invima.mjs';
import { whoPqRows } from './lib/who-pq.mjs';
import { hsaClassARows, smdrRows } from './lib/hsa.mjs';
import { nmpaUdiRows, parseUdidXml } from './lib/nmpa-udi.mjs';
import { sahpraRows } from './lib/sahpra.mjs';
import { tfdaRows, tudidRows } from './lib/tfda.mjs';
import { daenDate, daenRows } from './lib/tga-daen.mjs';
import {
  GAPS,
  MIRRORS,
  OFFICIAL,
  OFFICIAL_DOWNLOADS,
  mirrorFileUrl,
  mirrorRef,
} from './sources.mjs';

const MIRRORS_DIR = join(BUILD_DIR, 'mirrors');
const EXTRACTED_DIR = join(BUILD_DIR, 'extracted');
const MANIFEST_PATH = join(OUT_DIR, 'manifest.json');
const OFFICIAL_DIR = join(BUILD_DIR, 'official');
const officialRetrieved = existsSync(join(OFFICIAL_DIR, 'retrieved.json'))
  ? readJson(join(OFFICIAL_DIR, 'retrieved.json'))
  : {};

const args = process.argv.slice(2);
const onlyIndex = args.indexOf('--only');
const only = onlyIndex >= 0 ? new Set(args[onlyIndex + 1].split(',')) : null;
const wants = (source) => only === null || only.has(source);

const retrieved = readJson(join(BUILD_DIR, 'retrieved.json'));
const mirrorPath = (repo, ...parts) =>
  join(MIRRORS_DIR, repo.replace('/', '__'), ...parts);
const retrievedAt = (repo) => {
  const r = retrieved[repo];
  if (r?.commit !== MIRRORS[repo].commit)
    throw new Error(`${repo}: falta correr fetch-mirrors.mjs`);
  return r.retrievedAt;
};
const short = (repo) => `${repo}@${MIRRORS[repo].commit.slice(0, 8)}`;

async function writeSource(source, sourceVersion, rows) {
  const writer = new PartWriter(OUT_DIR, source, sourceVersion);
  for (const row of rows) writer.add(row);
  return writer.finish();
}

/** Archivo oficial ya descargado por `fetch-official.mjs`: ruta local y cita. */
function officialFile(group, name) {
  const spec = OFFICIAL_DOWNLOADS[group].find((f) => f.name === name);
  const meta = officialRetrieved[spec.url];
  if (meta === undefined)
    throw new Error(`${name}: falta correr fetch-official.mjs --only ${group}`);
  return {
    path: join(OFFICIAL_DIR, meta.path),
    url: spec.url,
    retrievedAt: meta.retrievedAt,
    citation: {
      url: spec.url,
      lastModified: meta.lastModified,
      bytes: meta.bytes,
      sha256: meta.sha256,
    },
  };
}

const ANVISA_ENCODING = 'windows-1252';
const ANVISA_PETITION_FILES = [
  'CICLO_ANALISE_PETICOES_PROD_SAUDE_IN_VITRO.CSV',
  'CICLO_ANALISE_PETICOES_PRODUTO_SAUDE(CORRELATOS).CSV',
  'CICLO_ANALISE_PETICOES_PRODUTO_SAUDE.CSV',
];

let anvisaPetitionCache = null;
/** Índice proceso → áreas de interés y asuntos, de los tres archivos de peticiones. */
async function anvisaPetitions() {
  if (anvisaPetitionCache !== null) return anvisaPetitionCache;
  const index = new Map();
  const stats = {};
  for (const name of ANVISA_PETITION_FILES) {
    const file = officialFile('anvisa', name);
    const fileStats = {};
    for await (const line of readDelimitedRows(file.path, {
      encoding: ANVISA_ENCODING,
      strict: false,
      stats: fileStats,
    }))
      addPetitionLine(index, line);
    stats[name] = {
      badLines: fileStats.badLines,
      sha256: file.citation.sha256,
    };
  }
  anvisaPetitionCache = { index: freezePetitionIndex(index), stats };
  return anvisaPetitionCache;
}

async function readAnvisaLines(file) {
  const lines = [];
  for await (const line of readDelimitedRows(file.path, {
    encoding: ANVISA_ENCODING,
  }))
    lines.push(line);
  return lines;
}

const lastStamp = (lines) =>
  lines.reduce((max, l) => {
    const stamp = anvisaUpdateStamp(l.DT_ATUALIZACAO_DADO);
    return stamp !== null && (max === null || stamp > max) ? stamp : max;
  }, null);

async function buildAnvisaProdutos() {
  const file = officialFile('anvisa', 'TA_PRODUTO_SAUDE_SITE.csv');
  const lines = await readAnvisaLines(file);
  const petitions = await anvisaPetitions();
  const sourceVersion = `TA_PRODUTO_SAUDE_SITE.csv Last-Modified ${file.citation.lastModified} (DT_ATUALIZACAO_DADO ${lastStamp(lines)})`;
  const rows = anvisaProdutosRows(lines, {
    sourceUrl: file.url,
    sourceVersion,
    retrievedAt: file.retrievedAt,
    officialFile: file.citation,
    officialPortal: OFFICIAL.anvisa,
    petitionsByProcess: petitions.index,
  });
  return {
    files: await writeSource('anvisa-produtos', sourceVersion, rows),
    stats: {
      inputLines: lines.length,
      rows: rows.length,
      rowsWithPetitions: rows.filter((r) => r.extra.anvisaPetitions).length,
      petitionFiles: petitions.stats,
    },
  };
}

async function buildAnvisaModelos() {
  const site = officialFile('anvisa', 'TA_PRODUTO_SAUDE_SITE.csv');
  const processByRegistro = new Map();
  for await (const line of readDelimitedRows(site.path, {
    encoding: ANVISA_ENCODING,
  }))
    if (line.NUMERO_PROCESSO.trim() !== '')
      processByRegistro.set(
        line.NUMERO_REGISTRO_CADASTRO.trim(),
        line.NUMERO_PROCESSO.trim(),
      );
  const file = officialFile('anvisa', 'TA_PRODUTO_SAUDE_MODELO.csv');
  const lines = await readAnvisaLines(file);
  const petitions = await anvisaPetitions();
  const sourceVersion = `TA_PRODUTO_SAUDE_MODELO.csv Last-Modified ${file.citation.lastModified} (DT_ATUALIZACAO_DADO ${lastStamp(lines)})`;
  const stats = { inputLines: lines.length, rowsWithPetitions: 0 };
  function* counted() {
    for (const row of anvisaModelosRows(lines, {
      sourceUrl: file.url,
      sourceVersion,
      retrievedAt: file.retrievedAt,
      officialFile: file.citation,
      officialPortal: OFFICIAL.anvisa,
      petitionsByProcess: petitions.index,
      processByRegistro,
    })) {
      if (row.extra.anvisaPetitions) stats.rowsWithPetitions += 1;
      yield row;
    }
  }
  const files = await writeSource(
    'anvisa-produtos-modelos',
    sourceVersion,
    counted(),
  );
  return {
    files,
    stats: { ...stats, rows: files.reduce((n, f) => n + f.rows, 0) },
  };
}

async function buildPmda() {
  const repo = 'zoefcuk/pmda-medical-devices';
  const dataset = extractPmdaDataset(
    readFileSync(mirrorPath(repo, 'index.html'), 'utf8'),
  );
  const lastDate = dataset.rows
    .map((r) => r[dataset.columns.indexOf('approval_date')])
    .filter(Boolean)
    .sort()
    .pop();
  const sourceVersion = `承認品目一覧・認証品目リスト hasta ${lastDate} (espejo ${short(repo)})`;
  const jmdn = loadJmdn();
  const { rows, duplicates, withoutManufacturer } = pmdaRows(dataset, {
    sourceUrl: OFFICIAL.pmdaApprovals,
    sourceVersion,
    retrievedAt: retrievedAt(repo),
    mirror: mirrorRef(repo, 'index.html'),
    jmdnByName:
      jmdn === null ? null : new Map(jmdn.entries.map((e) => [e.name, e])),
  });
  return {
    files: await writeSource('pmda-approvals', sourceVersion, rows),
    stats: {
      inputRows: dataset.rows.length,
      rows: rows.length,
      duplicates,
      withoutManufacturer,
      rowsWithJmdn: rows.filter((r) => r.extra.deviceTypes).length,
      jmdnEntries: jmdn?.entries.length ?? 0,
    },
  };
}

/** Maestro JMDN de `fetch-pmda-jmdn.mjs`, o null si no se bajó. */
function loadJmdn() {
  const dir = join(OFFICIAL_DIR, 'pmda-jmdn');
  if (!existsSync(join(dir, 'index.json'))) return null;
  const index = readJson(join(dir, 'index.json'));
  const decoder = new TextDecoder('shift_jis');
  const entries = index.pages.flatMap((p) =>
    parseJmdnPage(decoder.decode(readFileSync(join(dir, p.name)))),
  );
  if (entries.length !== index.total)
    throw new Error(
      `JMDN: ${entries.length} fichas, se esperaban ${index.total}`,
    );
  entries.sort((a, b) => a.code.localeCompare(b.code));
  return {
    entries,
    index,
    meta: officialRetrieved[
      'https://www.std.pmda.go.jp/scripts/stdDB/JMDN/stdDB_jmdn_resr.cgi'
    ],
  };
}

/** Escribe el maestro JMDN como nomenclatura (no son filas de dispositivos). */
function writeJmdnNomenclature() {
  const jmdn = loadJmdn();
  if (jmdn === null) return null;
  const path = join(OUT_DIR, 'nomenclature-jmdn.json.gz');
  const body = {
    system: 'jmdn',
    source: 'https://www.std.pmda.go.jp/',
    retrievedAt: jmdn.meta?.retrievedAt ?? null,
    total: jmdn.entries.length,
    pages: jmdn.index.pages.map((p) => ({ name: p.name, sha256: p.sha256 })),
    entries: jmdn.entries,
  };
  writeFileSync(path, gzipSync(JSON.stringify(body) + '\n', { level: 9 }));
  return {
    path: 'nomenclature-jmdn.json.gz',
    system: 'jmdn',
    entries: jmdn.entries.length,
    sha256: createHash('sha256').update(readFileSync(path)).digest('hex'),
  };
}

async function buildMdall() {
  const repo = 'misterrPink1/symmetric';
  const dir = join(EXTRACTED_DIR, 'hc-mdall');
  const load = (name) => JSON.parse(readFileSync(join(dir, name), 'utf8'));
  const activeLicences = load('active_license.json');
  const archiveLicences = load('archive_license.json');
  const index = indexMdall({
    activeLicences,
    archiveLicences,
    companies: load('company.json'),
  });
  const refresh = [...activeLicences, ...archiveLicences]
    .map((l) => l.last_refresh_dt)
    .filter(Boolean)
    .sort()
    .pop();
  const sourceVersion = `MDALL last_refresh_dt ${refresh} (espejo ${short(repo)})`;
  const ctx = {
    sourceUrl: mirrorFileUrl(repo, 'datasets.zip'),
    sourceVersion,
    retrievedAt: retrievedAt(repo),
    mirror: mirrorRef(repo, 'datasets.zip'),
    officialPortal: OFFICIAL.hcMdall,
  };
  function* identifiers() {
    yield* load('active_device_identifier.json');
    yield* load('archive_device_identifier.json');
  }
  const stats = {};
  const files = await writeSource(
    'hc-mdall',
    sourceVersion,
    mdallRows(index, identifiers(), ctx, stats),
  );
  return {
    files,
    stats: {
      licences: index.licences.size,
      companies: index.companyById.size,
      ...stats,
      rows: files.reduce((n, f) => n + f.rows, 0),
    },
  };
}

async function buildDaen() {
  const repo = 'tobinsouth/MedicalDeviceNLP';
  const summariesDir = 'data/medical_device_summaries';
  const full = readFileSync(
    join(EXTRACTED_DIR, 'tga-daen', 'reports.jsonl'),
    'utf8',
  )
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line));
  const summaries = readdirSync(mirrorPath(repo, summariesDir))
    .filter((n) => n.endsWith('.csv'))
    .sort()
    .flatMap((n) =>
      parseCsv(readFileSync(mirrorPath(repo, summariesDir, n), 'utf8')),
    );
  const lastReport = [...full, ...summaries]
    .map((r) => daenDate(r['Report date']))
    .filter(Boolean)
    .sort()
    .pop();
  const sourceVersion = `DAEN reportes hasta ${lastReport} (espejo ${short(repo)})`;
  const { rows, withoutManufacturer } = daenRows(full, summaries, {
    sourceUrl: mirrorFileUrl(repo, 'data'),
    sourceVersion,
    retrievedAt: retrievedAt(repo),
    mirror: mirrorRef(repo, 'data/list_of_reports'),
    officialPortal: OFFICIAL.tgaDaen,
  });
  return {
    files: await writeSource('tga-daen', sourceVersion, rows),
    stats: {
      fullReports: full.length,
      summaryRows: summaries.length,
      rows: rows.length,
      withoutManufacturer,
    },
  };
}

const CDSCO_LISTS = [
  ['md', 'import', 'approved-md-import.json'],
  ['md', 'manufacturing', 'approved-md-manufacturing.json'],
  ['ivd', 'import', 'approved-ivd-import.json'],
  ['ivd', 'manufacturing', 'approved-ivd-manufacturing.json'],
];

async function buildCdsco() {
  const officialFiles = { md: {}, ivd: {} };
  const lists = CDSCO_LISTS.map(([category, type, name]) => {
    const file = officialFile('cdsco', name);
    officialFiles[category][type] = file.citation;
    return {
      category,
      records: JSON.parse(readFileSync(file.path, 'utf8')).aaData,
      retrievedAt: file.retrievedAt,
    };
  });
  const retrievedAt = lists.map((l) => l.retrievedAt).sort()[0];
  const sourceVersion = `List of Approved Devices (cdscomdonline.gov.in), descargada ${retrievedAt.slice(0, 10)}`;
  const { rows, stats } = cdscoOfficialRows(lists, {
    sourceUrl: OFFICIAL.cdscoApprovedDevices,
    sourceVersion,
    retrievedAt,
    officialFiles,
    officialPortal: OFFICIAL.cdsco,
  });
  return {
    files: await writeSource('cdsco-approved-devices', sourceVersion, rows),
    stats: {
      lists: Object.fromEntries(
        lists.map((l, i) => [CDSCO_LISTS[i][2], l.records.length]),
      ),
      rows: rows.length,
      ...stats,
    },
  };
}

let tfdaCache = null;
async function tfdaLicences() {
  if (tfdaCache !== null) return tfdaCache;
  const file = officialFile('tfda', 'export68-csv.zip');
  const dir = `${file.path}.d`;
  const [csvName] = readdirSync(dir).filter((n) => n.endsWith('.csv'));
  const lines = parseCsv(readFileSync(join(dir, csvName), 'utf8'));
  const meta = officialFile('tfda', 'dataset-9576.json');
  const modified = JSON.parse(readFileSync(meta.path, 'utf8')).result
    .modifiedDate;
  const sourceVersion = `醫療器材許可證資料集 (data.gov.tw 9576) modifiedDate ${modified}, ${csvName}`;
  const { rows, stats } = tfdaRows(lines, {
    sourceUrl: file.url,
    sourceVersion,
    retrievedAt: file.retrievedAt,
    officialFile: { ...file.citation, csv: csvName, datasetModified: modified },
    officialPortal: OFFICIAL.tfda,
  });
  tfdaCache = { rows, stats, sourceVersion, inputLines: lines.length };
  return tfdaCache;
}

async function buildTfdaTudid() {
  const licences = await tfdaLicences();
  const byLicence = new Map(licences.rows.map((r) => [r.authorizationId, r]));
  const file = officialFile('tfda', 'export197-csv.zip');
  const dir = `${file.path}.d`;
  const [csvName] = readdirSync(dir).filter((n) => n.endsWith('.csv'));
  const lines = parseCsv(readFileSync(join(dir, csvName), 'utf8'));
  const meta = officialFile('tfda', 'dataset-151955.json');
  const modified = JSON.parse(readFileSync(meta.path, 'utf8')).result
    .modifiedDate;
  const sourceVersion = `醫療器材單一識別碼(TUDID)資料集 (data.gov.tw 151955) modifiedDate ${modified}, ${csvName}`;
  const { rows, stats } = tudidRows(lines, byLicence, {
    sourceUrl: file.url,
    sourceVersion,
    retrievedAt: file.retrievedAt,
    officialFile: { ...file.citation, csv: csvName, datasetModified: modified },
    officialPortal: OFFICIAL.tfdaTudid,
  });
  return {
    files: await writeSource('tfda-tudid', sourceVersion, rows),
    stats: { inputLines: lines.length, rows: rows.length, ...stats },
  };
}

async function buildTfda() {
  const { rows, stats, sourceVersion, inputLines } = await tfdaLicences();
  return {
    files: await writeSource('tfda-devices', sourceVersion, rows),
    stats: { inputLines, rows: rows.length, ...stats },
  };
}

async function buildInvima() {
  const meta = officialRetrieved['https://www.datos.gov.co/d/y4qt-w6tk'];
  if (meta === undefined)
    throw new Error('INVIMA: falta correr fetch-official.mjs --only invima');
  const lines = meta.pages.flatMap((p) =>
    parseCsv(readFileSync(join(OFFICIAL_DIR, 'invima', p.name), 'utf8')),
  );
  const sourceVersion = `datos.gov.co y4qt-w6tk rowsUpdatedAt ${meta.rowsUpdatedAt}`;
  const { rows, stats } = invimaRows(lines, {
    sourceUrl: meta.dataset,
    sourceVersion,
    retrievedAt: meta.retrievedAt,
    officialFile: {
      dataset: meta.dataset,
      rowsUpdatedAt: meta.rowsUpdatedAt,
      license: meta.license,
    },
    officialPortal: 'https://www.datos.gov.co/',
  });
  return {
    files: await writeSource('invima-dispositivos', sourceVersion, rows),
    stats: {
      inputLines: lines.length,
      rows: rows.length,
      ...stats,
      pages: meta.pages,
    },
  };
}

async function buildWhoPq() {
  const file = officialFile('who-pq', 'who-pq-ivd.csv');
  const lines = parseCsv(readFileSync(file.path, 'utf8'));
  const sourceVersion = `WHO list of prequalified IVDs, export ${file.retrievedAt.slice(0, 10)}`;
  const { rows, duplicates } = whoPqRows(lines, {
    sourceUrl: OFFICIAL.whoPq,
    sourceVersion,
    retrievedAt: file.retrievedAt,
    officialFile: file.citation,
    officialPortal: OFFICIAL.whoPq,
  });
  return {
    files: await writeSource('who-pq-ivd', sourceVersion, rows),
    stats: { inputLines: lines.length, rows: rows.length, duplicates },
  };
}

function hsaFile(id) {
  const url = `https://data.gov.sg/datasets/${id}/view`;
  const meta = officialRetrieved[url];
  if (meta === undefined)
    throw new Error('HSA: falta correr fetch-official.mjs --only hsa');
  return { path: join(OFFICIAL_DIR, meta.path), url, meta };
}

async function buildHsaSmdr() {
  const { path, url, meta } = hsaFile('d_8cfe111e0a5a5cf5b598e78851e58ad4');
  const lines = parseCsv(readFileSync(path, 'utf8'));
  const sourceVersion = `Listing of Registered Medical Devices (data.gov.sg) lastUpdatedAt ${meta.lastUpdatedAt}, coverage to ${meta.coverageEnd}`;
  const { rows, stats } = smdrRows(lines, {
    sourceUrl: url,
    sourceVersion,
    retrievedAt: meta.retrievedAt,
    officialFile: {
      dataset: url,
      lastUpdatedAt: meta.lastUpdatedAt,
      bytes: meta.bytes,
      sha256: meta.sha256,
    },
    officialPortal: 'https://www.hsa.gov.sg/medical-devices',
  });
  return {
    files: await writeSource('hsa-smdr', sourceVersion, rows),
    stats: { inputLines: lines.length, rows: rows.length, ...stats },
  };
}

async function buildHsaClassA() {
  const { path, url, meta } = hsaFile('d_55a59f68de9275077a642024f13f7c3b');
  const lines = parseCsv(readFileSync(path, 'utf8'));
  const sourceVersion = `Class A Medical Devices (data.gov.sg) lastUpdatedAt ${meta.lastUpdatedAt}, coverage to ${meta.coverageEnd}`;
  const stats = {};
  const files = await writeSource(
    'hsa-class-a',
    sourceVersion,
    hsaClassARows(
      lines,
      {
        sourceUrl: url,
        sourceVersion,
        retrievedAt: meta.retrievedAt,
        officialFile: {
          dataset: url,
          lastUpdatedAt: meta.lastUpdatedAt,
          bytes: meta.bytes,
          sha256: meta.sha256,
        },
        officialPortal: 'https://www.hsa.gov.sg/medical-devices',
      },
      stats,
    ),
  );
  return {
    files,
    stats: {
      inputLines: lines.length,
      rows: files.reduce((n, f) => n + f.rows, 0),
      ...stats,
    },
  };
}

/** Los `<device>` de todos los XML del zip, en orden de parte (1…N). */
function* udidDevices(zip, header) {
  const members = execFileSync('unzip', ['-Z1', zip], { encoding: 'utf8' })
    .split('\n')
    .filter((n) => /^UDID_FULL_DOWNLOAD_PART\d+_Of_\d+_.*\.xml$/.test(n))
    .sort(
      (a, b) => Number(/PART(\d+)/.exec(a)[1]) - Number(/PART(\d+)/.exec(b)[1]),
    );
  header.parts = members.length;
  header.devices = 0;
  for (const name of members) {
    const xml = execFileSync('unzip', ['-p', zip, name], {
      maxBuffer: 256 * 1024 * 1024,
    }).toString('utf8');
    const parsed = parseUdidXml(xml);
    header.declaredParts ??= Number(parsed.header.downloadFileTotalParts);
    header.declaredRecords ??= Number(parsed.header.numberRecordsDatabase);
    header.creationDate ??= parsed.header.creationDate;
    header.devices += parsed.devices.length;
    yield* parsed.devices;
  }
}

async function buildNmpaUdi() {
  const file = officialFile('nmpa-udi', 'UDID_FULL_RELEASE_20261001.zip');
  const meta = officialRetrieved[file.url];
  const sourceVersion = 'UDID_FULL_RELEASE_20261001';
  const header = {};
  const stats = {};
  const files = await writeSource(
    'nmpa-udi',
    sourceVersion,
    nmpaUdiRows(
      udidDevices(file.path, header),
      {
        sourceUrl: OFFICIAL.nmpaUdi,
        sourceVersion,
        retrievedAt: file.retrievedAt,
        officialFile: {
          name: 'UDID_FULL_RELEASE_20261001.zip',
          bytes: meta.bytes,
          md5: meta.md5,
          sha256: meta.sha256,
        },
        officialPortal: OFFICIAL.nmpaUdi,
      },
      stats,
    ),
  );
  if (header.parts !== header.declaredParts)
    throw new Error(
      `nmpa-udi: ${header.parts} XML en el zip, el encabezado declara ${header.declaredParts}`,
    );
  return {
    files,
    stats: {
      xmlParts: header.parts,
      declaredRecords: header.declaredRecords,
      inputDevices: header.devices,
      creationDate: header.creationDate,
      rows: files.reduce((n, f) => n + f.rows, 0),
      ...stats,
    },
  };
}

const SAHPRA_LISTS = [
  [
    'antigen-self-test',
    'List-of-authorised-COVID19-Antigen-Self-test-kits_24052023.xlsx',
  ],
  [
    'antigen-professional',
    'List-of-authorised-COVID19-Professional-Antigen-test-kits_24052023.xlsx',
  ],
  ['molecular', 'List-of-authorised-Molecular-Test-Kits_24052023.xlsx'],
  ['serological', 'List-of-authorised-serological-test-kits-_31052022.xlsx'],
];

async function buildSahpra() {
  const dir = ensureDir(join(EXTRACTED_DIR, 'sahpra'));
  const lists = SAHPRA_LISTS.map(([key, name]) => {
    const file = officialFile('sahpra', name);
    const jsonl = join(dir, name.replace(/\.xlsx$/, '.jsonl'));
    const log = execFileSync(
      'python3',
      ['-I', join(import.meta.dirname, 'xlsx-to-jsonl.py'), file.path, jsonl],
      { encoding: 'utf8' },
    );
    const sheet = /hoja «([^»]+)»/.exec(log)?.[1] ?? null;
    return {
      key,
      sheet,
      rows: readFileSync(jsonl, 'utf8')
        .split('\n')
        .filter(Boolean)
        .map((line) => JSON.parse(line)),
      ctx: {
        sourceUrl: file.url,
        sourceVersion: `${name} (Last-Modified ${file.citation.lastModified})`,
        retrievedAt: file.retrievedAt,
        officialFile: file.citation,
        officialPortal: OFFICIAL.sahpraTestKits,
      },
    };
  });
  const { rows, stats } = sahpraRows(lists);
  const files = await writeSource(
    'sahpra-covid-ivd',
    'SAHPRA authorised COVID-19 test kit lists (24/05/2023; serological 31/05/2022)',
    rows,
  );
  return {
    files,
    stats: {
      lists: Object.fromEntries(lists.map((l) => [l.key, l.rows.length - 1])),
      rows: rows.length,
      ...stats,
    },
  };
}

const BUILDERS = {
  'anvisa-produtos': buildAnvisaProdutos,
  'anvisa-produtos-modelos': buildAnvisaModelos,
  'pmda-approvals': buildPmda,
  'hc-mdall': buildMdall,
  'tga-daen': buildDaen,
  'cdsco-approved-devices': buildCdsco,
  'tfda-devices': buildTfda,
  'tfda-tudid': buildTfdaTudid,
  'invima-dispositivos': buildInvima,
  'who-pq-ivd': buildWhoPq,
  'hsa-smdr': buildHsaSmdr,
  'hsa-class-a': buildHsaClassA,
  'nmpa-udi': buildNmpaUdi,
  'sahpra-covid-ivd': buildSahpra,
};

async function main() {
  ensureDir(OUT_DIR);
  const previous = existsSync(MANIFEST_PATH)
    ? readJson(MANIFEST_PATH)
    : { files: [], stats: {} };
  const files = [];
  const stats = {};
  for (const [source, build] of Object.entries(BUILDERS)) {
    if (!wants(source)) {
      files.push(...previous.files.filter((f) => f.source === source));
      if (previous.stats?.[source]) stats[source] = previous.stats[source];
      continue;
    }
    const started = Date.now();
    const result = await build();
    files.push(...result.files);
    stats[source] = result.stats;
    console.log(
      `${source}: ${JSON.stringify(result.stats)} → ${result.files.map((f) => f.path).join(', ')} (${((Date.now() - started) / 1000).toFixed(1)} s)`,
    );
  }
  const nomenclatures = [writeJmdnNomenclature()].filter(Boolean);
  const manifest = {
    region: 'row',
    generatedAt: new Date().toISOString(),
    formatVersion: 1,
    files,
    nomenclatures,
    stats,
    gaps: GAPS,
  };
  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n');
  console.log(
    `manifest → ${MANIFEST_PATH} (${files.reduce((n, f) => n + f.rows, 0)} filas en ${files.length} archivos)`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
