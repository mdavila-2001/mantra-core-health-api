#!/usr/bin/env node
// =============================================================================
// Tratamientos farmacológicos · etapa 0b (fuentes abiertas por HTTP → caché).
//
// Baja cada fuente de `lib/open-sources.mjs` y deja en
// `glossary-data-build/cache/drug-treatments-http/<ruta>` los archivos que leen
// los parsers, más `manifest.json` (URL, fecha, SHA-256, bytes, ETag).
// Los crudos pesados (zip, desc2026.xml, volcado de DrugCentral) se extraen a
// archivos chicos; el SHA-256 del crudo queda en `derivedFrom`.
//
// Cortesía: User-Agent identificable, ≤ 2 pedidos/s por host, reintento con
// backoff (429/5xx), caché de cada respuesta para poder reanudar.
//
// Uso:
//   node tools/terminology-import/drug-treatments/fetch-open-sources.mjs --only medrt,mesh-concepts,rxclass
//   (sin --only baja todas)
// =============================================================================

import { execFileSync, spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { createReadStream, existsSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { HttpClient, USER_AGENT, cacheDir, ensureDir, nowIso, progressLogger } from '../lib/glossary-es/common.mjs';
import { HTTP_CACHE, downloadToFile, pathOf, readManifest, record, sha256Stream, writeManifest } from './lib/http-files.mjs';
import { parseEemlPage } from './lib/parsers-open.mjs';
import { readXlsxRows } from './lib/xlsx.mjs';
import { CROSSWALKS, SOURCES } from './lib/sources.mjs';

const RAW = cacheDir('drug-treatments-http-raw'); // crudos y respuestas de API (no se versionan)

const args = process.argv.slice(2);
const only = args.includes('--only') ? args[args.indexOf('--only') + 1].split(',') : null;

const manifest = readManifest();
const polite = new HttpClient({ concurrency: 1, minDelayMs: 500 });

function writeFileSyncEnsured(rel, text) {
  const abs = pathOf(rel);
  ensureDir(join(abs, '..'));
  writeFileSync(abs, text);
}

// --- MED-RT -----------------------------------------------------------------------

async function fetchMedrt() {
  const def = SOURCES.medrt;
  const zip = join(RAW, 'medrt', 'Core_MEDRT_XML.zip');
  const dl = await downloadToFile(def.urls.zip, zip);
  console.log(`[medrt] zip ${dl.bytes} bytes sha256 ${dl.sha256.slice(0, 12)} Last-Modified ${dl.lastModified}`);
  const names = execFileSync('unzip', ['-Z1', zip]).toString().split('\n').filter(Boolean);
  const xmlName = names.find((n) => /^Core_MEDRT_.*_XML\.xml$/.test(n));
  const docName = names.find((n) => /Documentation\.pdf$/.test(n));
  if (!xmlName || !docName) throw new Error(`MED-RT: el zip trae ${names.join(', ')}`);
  if (def.files.xml !== `medrt/${xmlName}`) throw new Error(`MED-RT: el zip trae ${xmlName}, el registro espera ${def.files.xml}. Actualizá lib/open-sources.mjs (versión nueva).`);
  for (const [name, rel] of [[xmlName, def.files.xml], [docName, def.files.doc]]) {
    ensureDir(join(pathOf(rel), '..'));
    writeFileSync(pathOf(rel), execFileSync('unzip', ['-p', zip, name], { maxBuffer: 1 << 30 }));
    record(manifest, rel, { source: 'medrt', url: def.urls.zip, etag: dl.etag, lastModified: dl.lastModified, derivedFrom: [{ url: def.urls.zip, sha256: dl.sha256, bytes: dl.bytes }], note: `unzip -p ${name}` });
  }
}

// --- MeSH: concepto → descriptor --------------------------------------------------

async function fetchMeshConcepts() {
  const def = CROSSWALKS['mesh-concepts'];
  const url = 'https://nlmpubs.nlm.nih.gov/projects/mesh/MESH_FILES/xmlmesh/desc2026.xml';
  const xml = join(RAW, 'mesh', 'desc2026.xml');
  const dl = await downloadToFile(url, xml);
  console.log(`[mesh] desc2026.xml ${dl.bytes} bytes`);
  const out = ['concept_ui\tdescriptor_ui\tpreferred_concept\tdescriptor_name'];
  let descriptor = null;
  let descriptorName = null;
  const rows = [];
  let waitingConcept = null;
  const rl = createInterface({ input: createReadStream(xml, { encoding: 'utf8' }), crlfDelay: Infinity });
  for await (const line of rl) {
    if (line.startsWith('<DescriptorRecord ')) {
      descriptor = null;
      descriptorName = null;
      continue;
    }
    if (descriptor === null) {
      const d = /^\s*<DescriptorUI>(D\d+)<\/DescriptorUI>/.exec(line);
      if (d) descriptor = d[1];
      continue;
    }
    if (descriptorName === null) {
      const n = /<String>([^<]*)<\/String>/.exec(line);
      if (n) descriptorName = n[1];
    }
    const c = /<Concept PreferredConceptYN="([YN])"/.exec(line);
    if (c) {
      waitingConcept = c[1];
      continue;
    }
    if (waitingConcept) {
      const u = /<ConceptUI>(M\d+)<\/ConceptUI>/.exec(line);
      if (u) {
        rows.push([u[1], descriptor, waitingConcept, descriptorName]);
        waitingConcept = null;
      }
    }
  }
  rows.sort((a, b) => a[0].localeCompare(b[0]));
  out.push(...rows.map((r) => r.join('\t')));
  writeFileSyncEnsured(def.files.concepts, out.join('\n') + '\n');
  record(manifest, def.files.concepts, { source: 'mesh-concepts', url, etag: dl.etag, lastModified: dl.lastModified, derivedFrom: [{ url, sha256: dl.sha256, bytes: dl.bytes }], note: 'DescriptorUI, DescriptorName (encabezado principal) + ConceptUI/PreferredConceptYN de cada DescriptorRecord' });
  console.log(`[mesh] ${out.length - 1} conceptos`);
}

// --- RxClass: RxCUI → ATC -----------------------------------------------------------

async function fetchRxclass() {
  const def = CROSSWALKS['rxclass-atc'];
  const base = 'https://rxnav.nlm.nih.gov/REST/rxclass';
  const all = await polite.getJsonCached(`${base}/allClasses.json?classTypes=ATC1-4`, join(RAW, 'rxclass', 'allClasses.json'));
  const classes = all.rxclassMinConceptList.rxclassMinConcept.filter((c) => /^[A-Z]\d{2}[A-Z]{2}$/.test(c.classId));
  console.log(`[rxclass] ${classes.length} clases ATC de nivel 4 (5 caracteres; de ${all.rxclassMinConceptList.rxclassMinConcept.length} de niveles 1-4)`);
  const progress = progressLogger('rxclass', 100);
  const rows = new Set();
  let done = 0;
  for (const cls of classes) {
    const json = await polite.getJsonCached(`${base}/classMembers.json?classId=${cls.classId}&relaSource=ATC`, join(RAW, 'rxclass', `members-${cls.classId}.json`));
    for (const m of json?.drugMemberGroup?.drugMember ?? []) {
      const attr = Object.fromEntries((m.nodeAttr ?? []).map((a) => [a.attrName, a.attrValue]));
      // SourceName (nombre ATC de la OMS) no se guarda: solo el código.
      rows.add(`${m.minConcept.rxcui}\t${m.minConcept.tty}\t${attr.SourceId}\t${attr.Relation ?? ''}\t${cls.classId}`);
    }
    progress(++done, classes.length);
  }
  const sorted = [...rows].sort();
  writeFileSyncEnsured(def.files.atc, ['rxcui\ttty\tatc_code\trelation\tatc_level4_class', ...sorted].join('\n') + '\n');
  record(manifest, def.files.atc, {
    source: 'rxclass-atc',
    url: `${base}/classMembers.json?classId=<ATC nivel 4>&relaSource=ATC`,
    note: `${classes.length} pedidos classMembers (uno por clase ATC de nivel 4 de allClasses.json?classTypes=ATC1-4); se descarta SourceName`,
  });
  console.log(`[rxclass] ${sorted.length} pares RxCUI→ATC`);
}

// --- ChEMBL: drug_indication + ATC de las moléculas --------------------------------

async function fetchChembl() {
  const def = SOURCES.chembl;
  const base = 'https://www.ebi.ac.uk/chembl/api/data';
  const status = await polite.getJsonCached(`${base}/status.json`, join(RAW, 'chembl', 'status.json'));
  if (status.chembl_db_version !== def.versionTag) throw new Error(`ChEMBL sirve ${status.chembl_db_version}, el registro espera ${def.versionTag}. Actualizá lib/open-sources.mjs.`);
  const pageSize = 1000;
  const records = [];
  for (let offset = 0; ; offset += pageSize) {
    const page = await polite.getJsonCached(`${base}/drug_indication.json?limit=${pageSize}&offset=${offset}`, join(RAW, 'chembl', `drug_indication-${String(offset).padStart(6, '0')}.json`));
    records.push(...page.drug_indications);
    console.log(`[chembl] drug_indication ${records.length}/${page.page_meta.total_count}`);
    if (!page.page_meta.next) {
      if (records.length !== page.page_meta.total_count) throw new Error(`ChEMBL: ${records.length} leídos de ${page.page_meta.total_count}`);
      break;
    }
  }
  records.sort((a, b) => a.drugind_id - b.drugind_id);
  const ids = new Set(records.map((r) => r.drugind_id));
  if (ids.size !== records.length) throw new Error('ChEMBL: drugind_id repetido');
  writeFileSyncEnsured(def.files.indications, records.map((r) => JSON.stringify(r)).join('\n') + '\n');
  record(manifest, def.files.indications, { source: 'chembl', url: `${base}/drug_indication.json`, note: `${records.length} registros, ${status.chembl_db_version} (${status.chembl_release_date}), páginas de ${pageSize}, ordenados por drugind_id` });

  // ATC por molécula (código solamente).
  const cw = CROSSWALKS['chembl-atc'];
  const molecules = [...new Set(records.flatMap((r) => [r.molecule_chembl_id, r.parent_molecule_chembl_id]).filter(Boolean))].sort();
  const rows = new Set();
  for (let i = 0; i < molecules.length; i += 80) {
    const chunk = molecules.slice(i, i + 80);
    const json = await polite.getJsonCached(
      `${base}/molecule.json?molecule_chembl_id__in=${chunk.join(',')}&only=molecule_chembl_id,atc_classifications&limit=1000`,
      join(RAW, 'chembl', `molecule-atc-${String(i).padStart(6, '0')}.json`),
    );
    if (json.page_meta.next) throw new Error(`ChEMBL molecule: más de una página para ${chunk[0]}…`);
    for (const m of json.molecules) for (const atc of m.atc_classifications ?? []) rows.add(`${m.molecule_chembl_id}\t${atc}`);
  }
  writeFileSyncEnsured(cw.files.atc, ['chembl_id\tatc_code', ...[...rows].sort()].join('\n') + '\n');
  record(manifest, cw.files.atc, { source: 'chembl-atc', url: `${base}/molecule.json?molecule_chembl_id__in=<80 ids>&only=molecule_chembl_id,atc_classifications`, note: `${molecules.length} moléculas consultadas (molecule_chembl_id y parent de cada indicación)` });
  console.log(`[chembl] ${rows.size} pares molécula→ATC de ${molecules.length} moléculas`);
}

// --- DrugCentral 2027: volcado → TSV (sin base de datos) ----------------------------

/** Salida de `pg_restore --data-only -f -`: bloques `COPY public.<tabla> (cols) FROM stdin;` … `\.` (formato texto). */
const unCopy = (v) =>
  v === '\\N'
    ? null
    : v.replace(/\\([\\tnrbfv]|[0-7]{1,3})/g, (m, c) => ({ '\\': '\\', t: '\t', n: '\n', r: '\r', b: '\b', f: '\f', v: '\v' })[c] ?? String.fromCharCode(parseInt(c, 8)));

async function* copyBlocks(dumpPath, tables) {
  const bin = ['PG_RESTORE', '/usr/lib/postgresql/16/bin/pg_restore'].map((x) => process.env[x] ?? x).find((x) => x.startsWith('/') && existsSync(x)) ?? 'pg_restore';
  const child = spawn(bin, ['--data-only', ...tables.flatMap((t) => ['-t', t]), '-f', '-', dumpPath], { stdio: ['ignore', 'pipe', 'inherit'] });
  const rl = createInterface({ input: child.stdout, crlfDelay: Infinity });
  let table = null;
  let cols = null;
  for await (const line of rl) {
    if (table === null) {
      const m = /^COPY public\.(\w+) \(([^)]*)\) FROM stdin;$/.exec(line);
      if (m) {
        table = m[1];
        cols = m[2].split(', ');
      }
    } else if (line === '\\.') {
      table = null;
    } else {
      const cells = line.split('\t').map(unCopy);
      yield { table, row: Object.fromEntries(cols.map((c, i) => [c, cells[i]])) };
    }
  }
  const code = await new Promise((r) => (child.exitCode !== null ? r(child.exitCode) : child.on('close', r)));
  if (code !== 0) throw new Error(`pg_restore terminó con código ${code}`);
}

const DC_IDENTIFIERS = new Set(['RXNORM', 'ChEMBL_ID', 'DRUGBANK_ID', 'UNII', 'MESH_DESCRIPTOR_UI', 'MESH_SUPPLEMENTAL_RECORD_UI', 'CHEBI']);

async function fetchDrugcentral() {
  const def = SOURCES.drugcentral;
  const dump = join(RAW, 'drugcentral', 'Drugcentral_2026-09-25.pgdump');
  const dl = await downloadIfNeeded(def.urls.dump, dump);
  console.log(`[drugcentral] volcado ${dl.bytes} bytes sha256 ${dl.sha256.slice(0, 12)}`);
  const lic = await downloadToFile('https://drugcentral.org/privacy', pathOf('drugcentral/license-privacy.html'));
  record(manifest, 'drugcentral/license-privacy.html', { source: 'drugcentral', url: 'https://drugcentral.org/privacy', note: 'página de licencia de DrugCentral (evidencia de la licencia; no la lee ningún parser)' });
  const out = { omop_relationship: [], identifier: [], struct2atc: [], structures: [] };
  const stats = { onlySnomed: 0, noCode: 0, controlCharsReplaced: 0 };
  // Un valor con tabulador o salto de línea (p. ej. un concept_name con «\n») se guarda con un espacio en su lugar: es lo único que cambia.
  const cell = (v) => {
    const t = String(v ?? '');
    if (/[\t\r\n]/.test(t)) stats.controlCharsReplaced++;
    return t.replace(/[\t\r\n]+/g, ' ').trim();
  };
  for await (const { table, row } of copyBlocks(dump, ['omop_relationship', 'identifier', 'struct2atc', 'structures'])) {
    if (table === 'omop_relationship') {
      // SNOMED CT (snomed_conceptid, snomed_full_name) no se guarda: Bolivia no es miembro de SNOMED International.
      if (!row.umls_cui) (row.snomed_conceptid ? stats.onlySnomed++ : stats.noCode++);
      out.omop_relationship.push([row.id, row.struct_id, row.concept_id, row.relationship_name, row.concept_name, row.umls_cui ?? '', row.cui_semantic_type ?? ''].map(cell).join('\t'));
    } else if (table === 'identifier' && DC_IDENTIFIERS.has(row.id_type)) {
      out.identifier.push([row.struct_id, row.id_type, row.identifier].map(cell).join('\t'));
    } else if (table === 'struct2atc') {
      out.struct2atc.push([row.struct_id, row.atc_code].join('\t'));
    } else if (table === 'structures') {
      out.structures.push([row.id, row.name ?? ''].map(cell).join('\t'));
    }
  }
  const numeric = (a, b) => Number(a.split('\t')[0]) - Number(b.split('\t')[0]) || a.localeCompare(b);
  const files = [
    [def.files.relationships, 'id\tstruct_id\tconcept_id\trelationship_name\tconcept_name\tumls_cui\tcui_semantic_type', out.omop_relationship.sort(numeric), 'omop_relationship sin columnas SNOMED CT'],
    [def.files.identifiers, 'struct_id\tid_type\tidentifier', out.identifier.sort(numeric), 'identifier: solo RXNORM, ChEMBL_ID, DRUGBANK_ID, UNII, MESH_*, CHEBI'],
    [def.files.atc, 'struct_id\tatc_code', out.struct2atc.sort(numeric), 'struct2atc: solo el código ATC (sin la tabla atc, que trae nombres de la OMS)'],
    [def.files.structures, 'id\tname', out.structures.sort(numeric), 'structures: solo id y name'],
  ];
  for (const [rel, head, rows, note] of files) {
    writeFileSyncEnsured(rel, [head, ...rows].join('\n') + '\n');
    record(manifest, rel, { source: 'drugcentral', url: def.urls.dump, derivedFrom: [{ url: def.urls.dump, sha256: dl.sha256, bytes: dl.bytes }], note: `pg_restore --data-only -t …; ${note}; ${rows.length} filas` });
    console.log(`[drugcentral] ${rel}: ${rows.length} filas`);
  }
  console.log(`[drugcentral] omop_relationship sin UMLS CUI: ${JSON.stringify(stats)}`);
  manifest.files[def.files.relationships].note += `; valores con tab/salto de línea reemplazados por espacio: ${stats.controlCharsReplaced}; sin UMLS CUI: ${stats.onlySnomed} solo con SNOMED CT (no se guarda), ${stats.noCode} sin ningún código`;
}

/** Como `downloadToFile`, pero si el archivo ya está completo (mismo tamaño que Content-Length) solo calcula su SHA-256. */
async function downloadIfNeeded(url, dest) {
  if (existsSync(dest)) {
    const head = await fetch(url, { method: 'HEAD', headers: { 'User-Agent': USER_AGENT } });
    const expected = Number(head.headers.get('content-length'));
    if (head.ok && expected > 0 && statSync(dest).size === expected) {
      return { sha256: await sha256Stream(dest), bytes: expected, etag: head.headers.get('etag'), lastModified: head.headers.get('last-modified') };
    }
  }
  return downloadToFile(url, dest);
}

// --- Wikidata: P2175 / P2176 e identificadores externos -----------------------------

const WD_ID_PROPS = ['P3345', 'P592', 'P715', 'P652', 'P267', 'P486', 'P683', 'P699', 'P5270', 'P2892', 'P494', 'P4229', 'P7329', 'P492', 'P1550', 'P1748'];
const qid = (iri) => iri.replace('http://www.wikidata.org/entity/', '');

async function sparql(query, cachePath) {
  const url = `https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(query)}`;
  const json = await slow.getJsonCached(url, cachePath);
  return json.results.bindings;
}
const slow = new HttpClient({ concurrency: 1, minDelayMs: 2500, maxRetries: 8 });

async function fetchWikidata() {
  const def = SOURCES.wikidata;
  const cw = CROSSWALKS['wikidata-ids'];
  const statements = [];
  for (const prop of ['P2176', 'P2175']) {
    for (let offset = 0; ; offset += 1500) {
      const rows = await sparql(
        `SELECT ?stmt ?s ?o ?rank (GROUP_CONCAT(DISTINCT ?ref; separator="|") AS ?refs) WHERE {
           ?s p:${prop} ?stmt . ?stmt ps:${prop} ?o ; wikibase:rank ?rank .
           OPTIONAL { ?stmt prov:wasDerivedFrom/pr:P248 ?ref }
         } GROUP BY ?stmt ?s ?o ?rank ORDER BY ?stmt LIMIT 1500 OFFSET ${offset}`,
        join(RAW, 'wikidata', `${prop}-${String(offset).padStart(6, '0')}.json`),
      );
      for (const r of rows) {
        statements.push({
          property: prop,
          statement: r.stmt.value.replace('http://www.wikidata.org/entity/statement/', ''),
          subject: qid(r.s.value),
          object: qid(r.o.value),
          rank: r.rank.value.replace('http://wikiba.se/ontology#', ''),
          statedIn: (r.refs?.value ?? '').split('|').filter(Boolean).map(qid).sort(),
        });
      }
      console.log(`[wikidata] ${prop} offset ${offset}: ${rows.length} (acumulado ${statements.length})`);
      if (rows.length < 1500) break;
    }
  }
  statements.sort((a, b) => a.property.localeCompare(b.property) || a.statement.localeCompare(b.statement));
  writeFileSyncEnsured(def.files.statements, statements.map((x) => JSON.stringify(x)).join('\n') + '\n');
  record(manifest, def.files.statements, { source: 'wikidata', url: def.urls.sparql, note: 'SELECT ?stmt ?s ?o ?rank refs(P248) de p:P2176 y p:P2175, paginado de a 1500, ORDER BY ?stmt' });

  // Ítems: los de las afirmaciones y todos los que tienen código ATC (P267).
  const atcItems = [];
  for (let offset = 0; ; offset += 5000) {
    const rows = await sparql(`SELECT DISTINCT ?item WHERE { ?item wdt:P267 ?a } ORDER BY ?item LIMIT 5000 OFFSET ${offset}`, join(RAW, 'wikidata', `atc-items-${offset}.json`));
    atcItems.push(...rows.map((r) => qid(r.item.value)));
    if (rows.length < 5000) break;
  }
  const items = [...new Set([...statements.flatMap((x) => [x.subject, x.object]), ...atcItems])].filter((q) => /^Q\d+$/.test(q)).sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));
  console.log(`[wikidata] ${statements.length} afirmaciones; ${items.length} ítems a describir (${atcItems.length} con ATC)`);
  const byItem = new Map(items.map((q) => [q, { qid: q, label: null, instanceOf: [], ids: {} }]));
  const progress = progressLogger('wikidata-items', 10);
  for (let i = 0; i < items.length; i += 120) {
    const chunk = items.slice(i, i + 120);
    const values = chunk.map((q) => `wd:${q}`).join(' ');
    const rows = await sparql(
      `SELECT ?item ?p ?v WHERE {
         VALUES ?item { ${values} }
         { VALUES ?p { ${WD_ID_PROPS.map((x) => `wdt:${x}`).join(' ')} wdt:P31 } ?item ?p ?v }
         UNION { ?item rdfs:label ?v FILTER(lang(?v) = "en") BIND(rdfs:label AS ?p) }
       }`,
      join(RAW, 'wikidata', `items-${String(i).padStart(6, '0')}.json`),
    );
    for (const r of rows) {
      const entry = byItem.get(qid(r.item.value));
      const p = r.p.value.replace('http://www.wikidata.org/prop/direct/', '');
      if (p.endsWith('rdf-schema#label')) entry.label = r.v.value;
      else if (p === 'P31') entry.instanceOf.push(qid(r.v.value));
      else (entry.ids[p] ??= []).push(r.v.value);
    }
    progress(Math.ceil((i + 1) / 120), Math.ceil(items.length / 120));
  }
  const lines = [...byItem.values()].map((e) => {
    for (const k of Object.keys(e.ids)) e.ids[k] = [...new Set(e.ids[k])].sort();
    e.instanceOf = [...new Set(e.instanceOf)].sort();
    return JSON.stringify(e);
  });
  writeFileSyncEnsured(cw.files.ids, lines.join('\n') + '\n');
  record(manifest, cw.files.ids, { source: 'wikidata-ids', url: def.urls.sparql, note: `${items.length} ítems: etiqueta en inglés, P31 y propiedades ${WD_ID_PROPS.join(', ')}` });
}

// --- WHO eEML ------------------------------------------------------------------------

async function fetchEeml() {
  const def = SOURCES.eeml;
  const front = await polite.getFileCached('https://list.essentialmeds.org/', join(RAW, 'eeml', 'index.html'));
  const ids = [...new Set([...front.toString('utf8').matchAll(/list\.essentialmeds\.org\/recommendations\/(\d+)/g)].map((m) => Number(m[1])))].sort((a, b) => a - b);
  console.log(`[eeml] ${ids.length} recomendaciones en la portada`);
  const progress = progressLogger('eeml', 100);
  const rows = [];
  let done = 0;
  for (const id of ids) {
    const html = (await polite.getFileCached(`${def.urls.site}${id}`, join(RAW, 'eeml', `rec-${id}.html`), { allow404: true })).toString('utf8');
    rows.push(parseEemlPage(html, id));
    progress(++done, ids.length);
  }
  writeFileSyncEnsured(def.files.recommendations, rows.map((r) => JSON.stringify(r)).join('\n') + '\n');
  record(manifest, def.files.recommendations, { source: 'eeml', url: def.urls.site, note: `${rows.length} páginas /recommendations/N (ids de la portada https://list.essentialmeds.org/); campos estructurados, sin formulaciones` });
}

// --- ClinicalTrials.gov API v2 --------------------------------------------------------

async function fetchClinicaltrials() {
  const def = SOURCES.clinicaltrials;
  const version = await polite.getJsonCached('https://clinicaltrials.gov/api/v2/version', join(RAW, 'clinicaltrials', 'version.json'));
  const fields = 'NCTId,Phase,OverallStatus,StudyType,InterventionType,ConditionMeshId,ConditionMeshTerm,InterventionMeshId,InterventionMeshTerm';
  const filter = 'AREA[InterventionType](DRUG OR BIOLOGICAL) AND AREA[StudyType]INTERVENTIONAL';
  const rows = new Map();
  let token = null;
  let page = 0;
  let total = null;
  do {
    const q = new URLSearchParams({ pageSize: '1000', fields, 'filter.advanced': filter, countTotal: 'true', ...(token ? { pageToken: token } : {}) });
    const json = await polite.getJsonCached(`${def.urls.api}?${q}`, join(RAW, 'clinicaltrials', `page-${String(page).padStart(4, '0')}.json`));
    total ??= json.totalCount;
    for (const st of json.studies) {
      const nct = st.protocolSection.identificationModule.nctId;
      const pairs = (m) => (m?.meshes ?? []).map((x) => [x.id, x.term]);
      rows.set(nct, {
        n: nct,
        p: st.protocolSection.designModule?.phases ?? [],
        s: st.protocolSection.statusModule?.overallStatus ?? null,
        t: [...new Set((st.protocolSection.armsInterventionsModule?.interventions ?? []).map((i) => i.type))].sort(),
        c: pairs(st.derivedSection?.conditionBrowseModule),
        i: pairs(st.derivedSection?.interventionBrowseModule),
      });
    }
    token = json.nextPageToken ?? null;
    page++;
    if (page % 20 === 0) console.log(`[clinicaltrials] página ${page}: ${rows.size}/${total}`);
  } while (token);
  if (rows.size !== total) throw new Error(`ClinicalTrials.gov: ${rows.size} estudios únicos de ${total}`);
  const sorted = [...rows.values()].sort((a, b) => a.n.localeCompare(b.n));
  writeFileSyncEnsured(def.files.studies, sorted.map((r) => JSON.stringify(r)).join('\n') + '\n');
  record(manifest, def.files.studies, { source: 'clinicaltrials', url: def.urls.api, note: `API ${version.apiVersion}, dataTimestamp ${version.dataTimestamp}; filtro ${filter}; campos ${fields}; ${rows.size} estudios; términos MeSH de conditionBrowseModule/interventionBrowseModule (los asigna ClinicalTrials.gov)` });
  console.log(`[clinicaltrials] ${rows.size} estudios`);
}

// --- CIViC (GraphQL) --------------------------------------------------------------------

async function graphql(url, query) {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'User-Agent': USER_AGENT }, body: JSON.stringify({ query }) });
    if (res.status === 429 || res.status >= 500) {
      if (attempt > 6) throw new Error(`HTTP ${res.status}: ${url}`);
      await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
      continue;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
    const json = await res.json();
    if (json.errors) throw new Error(`GraphQL: ${JSON.stringify(json.errors).slice(0, 300)}`);
    await new Promise((r) => setTimeout(r, 600));
    return json.data;
  }
}

async function fetchCivic() {
  const def = SOURCES.civic;
  const items = [];
  let after = null;
  let total = null;
  do {
    const data = await graphql(
      def.urls.graphql,
      `{ evidenceItems(first: 100, evidenceType: PREDICTIVE, status: ACCEPTED${after ? `, after: "${after}"` : ''}) {
           totalCount pageInfo { hasNextPage endCursor }
           nodes { id name evidenceDirection evidenceLevel evidenceRating significance therapyInteractionType variantOrigin
                   therapies { id name ncitId } disease { id name doid } molecularProfile { id name } source { citationId sourceType } } } }`,
    );
    const page = data.evidenceItems;
    total ??= page.totalCount;
    items.push(...page.nodes);
    after = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : null;
  } while (after);
  if (items.length !== total) throw new Error(`CIViC: ${items.length} leídos de ${total}`);
  items.sort((a, b) => a.id - b.id);
  writeFileSyncEnsured(def.files.evidence, items.map((x) => JSON.stringify(x)).join('\n') + '\n');
  record(manifest, def.files.evidence, { source: 'civic', url: def.urls.graphql, note: `evidenceItems(evidenceType: PREDICTIVE, status: ACCEPTED), ${items.length} items, páginas de 100, ordenados por id` });
  console.log(`[civic] ${items.length} evidencias`);
}

// --- EMA: informe de medicamentos (xlsx) → TSV --------------------------------------------

async function fetchEma() {
  const def = SOURCES.ema;
  const xlsx = join(RAW, 'ema', 'medicines.xlsx');
  const dl = await downloadToFile(def.urls.xlsx, xlsx);
  const rows = readXlsxRows(xlsx);
  const headIdx = rows.findIndex((r) => r.includes('Category') && r.includes('Name of medicine'));
  const head = rows[headIdx];
  const want = ['Category', 'Name of medicine', 'EMA product number', 'Medicine status', 'International non-proprietary name (INN) / common name', 'Active substance', 'Therapeutic area (MeSH)', 'ATC code (human)', 'Medicine URL'];
  const idx = want.map((w) => {
    const i = head.findIndex((h) => h === w);
    if (i < 0) throw new Error(`EMA: falta la columna «${w}»`);
    return i;
  });
  const clean = (v) => String(v ?? '').replace(/[\t\r\n]+/g, ' ').trim();
  const body = rows.slice(headIdx + 1).filter((r) => r.length > 0).map((r) => idx.map((i) => clean(r[i])).join('\t'));
  writeFileSyncEnsured(def.files.medicines, [want.join('\t'), ...body].join('\n') + '\n');
  record(manifest, def.files.medicines, { source: 'ema', url: def.urls.xlsx, etag: dl.etag, lastModified: dl.lastModified, derivedFrom: [{ url: def.urls.xlsx, sha256: dl.sha256, bytes: dl.bytes }], note: `hoja «Medicine», fila de cabecera ${headIdx + 1}; columnas ${want.length} (sin el texto de la indicación); ${body.length} filas` });
  console.log(`[ema] ${body.length} filas`);
}

// --- Open Targets: clinical_report (Parquet) → informes de la EMA ----------------------------------

async function fetchOpentargets() {
  const def = SOURCES.opentargets;
  const parquet = join(RAW, 'opentargets', 'clinical_report.parquet');
  const dl = await downloadToFile(def.urls.parquet, parquet);
  const dst = pathOf(def.files.reports);
  ensureDir(join(dst, '..'));
  const python = process.env.PYTHON ?? 'python3';
  execFileSync(python, ['-I', new URL('./extract-opentargets.py', import.meta.url).pathname, parquet, dst], { stdio: ['ignore', 'inherit', 'inherit'] });
  record(manifest, def.files.reports, { source: 'opentargets', url: def.urls.parquet, etag: dl.etag, lastModified: dl.lastModified, derivedFrom: [{ url: def.urls.parquet, sha256: dl.sha256, bytes: dl.bytes }], note: 'extract-opentargets.py (pyarrow): provider == EMA y type == INDICATION' });
}

const FETCHERS = { medrt: fetchMedrt, 'mesh-concepts': fetchMeshConcepts, rxclass: fetchRxclass, chembl: fetchChembl, drugcentral: fetchDrugcentral, wikidata: fetchWikidata, eeml: fetchEeml, clinicaltrials: fetchClinicaltrials, civic: fetchCivic, ema: fetchEma, opentargets: fetchOpentargets };

async function main() {
  ensureDir(HTTP_CACHE);
  const wanted = only ?? Object.keys(FETCHERS);
  for (const key of wanted) {
    if (!FETCHERS[key]) throw new Error(`fuente desconocida: ${key}. Disponibles: ${Object.keys(FETCHERS).join(', ')}`);
    console.log(`=== ${key} ${nowIso()}`);
    await FETCHERS[key]();
    writeManifest(manifest);
  }
  console.log(`Manifiesto: ${join(HTTP_CACHE, 'manifest.json')} · pedidos ${JSON.stringify(polite.stats)}`);
}

main().catch((err) => {
  console.error('ERROR FATAL en fetch-open-sources:', err);
  process.exitCode = 1;
});
