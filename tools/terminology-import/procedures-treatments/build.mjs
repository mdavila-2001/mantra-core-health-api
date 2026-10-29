#!/usr/bin/env node
// =============================================================================
// Etapa 2 (normalización, sin red): caché → corpus NDJSON + cobertura.
//
// Salida en `../glossary-data-build/procedures-treatments/out/`:
//   procedures.ndjson   procedimientos referenciados (MAxO no farmacológico, NCIt)
//   assertions.ndjson   afirmaciones procedimiento → enfermedad / sitio, con tipo
//                       literal y procedencia por registro de origen
//   maps.ndjson         equivalencias publicadas (MONDO equivalentTo, xrefs de
//                       Uberon y de MAxO) para resolver contra otras sesiones
//   coverage.json       conteos por fuente, tipo, resolución y huecos
//
// Determinista: dos corridas sobre la misma caché dan archivos idénticos
// (filas ordenadas por id; la fecha de corrida no entra en los NDJSON).
// =============================================================================

import { existsSync, readFileSync } from 'node:fs';
import {
  cacheDir,
  conceptKey,
  outDir,
  parseTsv,
  readJson,
  readLines,
  writeJson,
  writeNdjson,
} from './lib/common.mjs';
import { headerVersion, oboStanzas } from './lib/obo.mjs';
import { uniqueById, withPublishedSiteAlternates } from './lib/records.mjs';
import { ctgovCorpus, ctgovStudies } from './lib/sources/ctgov.mjs';
import {
  expandTables,
  icd10pcsCorpus,
  parseOrderFile,
} from './lib/sources/icd10pcs.mjs';
import { readMeshDescriptors } from './lib/sources/mesh.mjs';
import { readNcitOwlZip } from './lib/sources/ncit-owl.mjs';
import { wikidataP924Corpus } from './lib/sources/wikidata.mjs';
import {
  PUBMED_SUBSETS,
  pubmedRecords,
  pubmedSubsetCorpus,
} from './lib/sources/pubmed.mjs';
import { execFileSync } from 'node:child_process';
import { BLOCKED_SOURCES } from './lib/sources.mjs';
import {
  maxoProcedureMaps,
  maxoProcedures,
  maxoSiteAssertions,
  poetAssertions,
  readMaxoTerms,
} from './lib/sources/maxo.mjs';
import { ncitProcedureAssertions, readNcit } from './lib/sources/ncit.mjs';
import {
  oboProcedureCorpus,
  readOboTerms,
} from './lib/sources/obo-procedures.mjs';
import { mondoMaps, readXrefs, uberonMaps } from './lib/sources/xrefs.mjs';

/** Metadatos de procedencia de una fuente descargada por `fetch.mjs`. */
function sourceMeta(key, file, version) {
  const metaPath = cacheDir(key, 'meta.json');
  if (!existsSync(metaPath))
    throw new Error(`Falta ${metaPath}: corra fetch.mjs ${key}`);
  const m = readJson(metaPath);
  const f = m.files[file];
  return {
    source: key,
    version,
    retrievedAt: m.retrievedAt,
    license: m.license,
    fileUrl: f.fileUrl,
    sha256: f.sha256,
    pin: m.commit ?? m.tag ?? m.lastModified,
  };
}

async function main() {
  const coverage = { sources: {}, skipped: {} };

  // --- MAxO + POET ---------------------------------------------------------------
  const maxoPath = cacheDir('maxo', 'maxo.obo');
  const { terms, header } = await readMaxoTerms(
    oboStanzas(readLines(maxoPath)),
  );
  const hv = headerVersion(header);
  const maxoMeta = sourceMeta(
    'maxo',
    'maxo.obo',
    `${hv.versionInfo ?? hv.dataVersion} (git ${readJson(cacheDir('maxo', 'meta.json')).commit.slice(0, 12)})`,
  );
  const maxoProcs = maxoProcedures(terms, maxoMeta);
  const maxoSites = maxoSiteAssertions(terms, maxoMeta);
  const maxoMaps = maxoProcedureMaps(terms, maxoMeta);

  const poetMetaRaw = readJson(cacheDir('maxo-annotations', 'meta.json'));
  const poetMeta = sourceMeta(
    'maxo-annotations',
    'annotations.tsv',
    `git ${poetMetaRaw.commit}`,
  );
  const poetRows = parseTsv(
    readFileSync(cacheDir('maxo-annotations', 'annotations.tsv'), 'utf8'),
  );
  const poet = poetAssertions(poetRows, terms, poetMeta);
  coverage.skipped['maxo-annotations'] = {
    rowsRead: poetRows.length,
    ...poet.skipped,
  };

  // --- NCIt OBO Edition ------------------------------------------------------------
  const ncitPath = cacheDir('ncit-obo', 'ncit.obo');
  const ncit = await readNcit(oboStanzas(readLines(ncitPath)));
  const ncitMeta = sourceMeta(
    'ncit-obo',
    'ncit.obo',
    `${ncit.version.versionInfo} (${ncit.version.dataVersion})`,
  );
  const ncitOut = ncitProcedureAssertions(ncit, ncitMeta);
  coverage.skipped['ncit-obo'] = {
    rolesRead: ncit.roles.length,
    ...ncitOut.skipped,
  };

  // --- OHD (procedimientos odontológicos) -----------------------------------------
  const ohdRead = await readOboTerms(
    oboStanzas(readLines(cacheDir('ohd', 'ohd.obo'))),
  );
  const ohdMeta = sourceMeta(
    'ohd',
    'ohd.obo',
    `${ohdRead.version.dataVersion} (git ${readJson(cacheDir('ohd', 'meta.json')).commit.slice(0, 12)})`,
  );
  const ohd = oboProcedureCorpus({
    terms: ohdRead.terms,
    prefix: 'OHD',
    root: 'OHD:0000002',
    system: 'ohd',
    category: 'dental',
    typePrefix: 'ohd',
    meta: ohdMeta,
  });

  // --- NCIt edición oficial (EVS) ---------------------------------------------------
  // Mismas reglas que la edición OBO; la misma relación con las dos fuentes queda
  // como dos afirmaciones de un mismo relationshipId.
  const ncitEvs = await readNcitOwlZip(
    cacheDir('ncit-evs', 'Thesaurus.OWL.zip'),
  );
  const ncitEvsMeta = sourceMeta(
    'ncit-evs',
    'Thesaurus.OWL.zip',
    ncitEvs.version.versionInfo,
  );
  const ncitEvsOut = ncitProcedureAssertions(ncitEvs, ncitEvsMeta);
  coverage.skipped['ncit-evs'] = {
    rolesRead: ncitEvs.roles.length,
    ...ncitEvsOut.skipped,
  };

  // --- ICD-10-PCS (CMS) ---------------------------------------------------------------
  const unzipText = (zip, entry, enc = 'utf8') =>
    execFileSync('unzip', ['-p', cacheDir('icd10pcs', zip), entry], {
      encoding: enc,
      maxBuffer: 1 << 30,
    });
  const pcsTables = expandTables(
    unzipText('icd10pcs-tables-index-2027.zip', 'icd10pcs_tables_2027.xml'),
  );
  const pcsOrder = parseOrderFile(
    unzipText('icd10pcs-order-2027.zip', 'icd10pcs_order_2027.txt', 'latin1'),
  );
  const pcsMeta = sourceMeta(
    'icd10pcs',
    'icd10pcs-tables-index-2027.zip',
    'FY2027 (tablas e índice, CMS)',
  );
  const pcs = icd10pcsCorpus(pcsTables.rows, pcsOrder, pcsMeta);
  coverage.skipped.icd10pcs = {
    codesDeclared: pcsTables.declared,
    codesExpanded: pcsTables.rows.length,
    ...pcs.skipped,
  };

  // --- MeSH + ClinicalTrials.gov ------------------------------------------------------
  const { descriptors: mesh, year: meshYear } = await readMeshDescriptors(
    cacheDir('mesh', 'desc2026.xml.gz'),
  );
  const meshMeta = sourceMeta(
    'mesh',
    'desc2026.xml.gz',
    `MeSH ${meshYear} (desc${meshYear}.xml)`,
  );
  let ctgov = {
    assertions: [],
    procedures: [],
    stats: { pending: 'falta cache/ctgov/meta.json: corra fetch-ctgov.mjs' },
  };
  let ctgovMeta = null;
  if (existsSync(cacheDir('ctgov', 'meta.json'))) {
    const m = readJson(cacheDir('ctgov', 'meta.json'));
    ctgovMeta = {
      source: 'ctgov',
      version: `API ${m.apiVersion}, datos ${m.dataTimestamp}`,
      retrievedAt: m.retrievedAt,
      license: m.license,
      fileUrl: 'https://clinicaltrials.gov/api/v2/studies',
      sha256: null,
      pin: m.dataTimestamp,
    };
    ctgov = ctgovCorpus(
      ctgovStudies(cacheDir('ctgov', 'pages')),
      mesh,
      ctgovMeta,
      meshMeta,
    );
  }
  coverage.skipped.ctgov = ctgov.stats;

  // --- Wikidata P924 (colaborativa, con referencia) ----------------------------------
  const wdMetaRaw = readJson(cacheDir('wikidata-p924', 'meta.json'));
  const wdMeta = {
    ...sourceMeta(
      'wikidata-p924',
      'p924.json',
      `consulta SPARQL del ${wdMetaRaw.retrievedAt}`,
    ),
    pin: wdMetaRaw.queriedAt,
  };
  const wd = wikidataP924Corpus(
    JSON.parse(readFileSync(cacheDir('wikidata-p924', 'p924.json'), 'utf8'))
      .results.bindings,
    mesh,
    wdMeta,
    meshMeta,
  );
  coverage.skipped['wikidata-p924'] = wd.skipped;

  // --- Subconjuntos de MEDLINE (indexación MeSH de NLM) -------------------------------
  // Revisiones Cochrane, guías de práctica clínica y ensayos aleatorizados: cada uno con su
  // tipo de relación literal; un subconjunto sin descargar queda como pendiente.
  const pubmed = { assertions: [], procedures: [], metas: [] };
  for (const [key, sub] of Object.entries(PUBMED_SUBSETS)) {
    if (!existsSync(cacheDir(sub.cache, 'meta.json'))) {
      coverage.skipped[sub.cache] = {
        pending: `falta cache/${sub.cache}/meta.json: corra fetch-pubmed.mjs --subset ${key}`,
      };
      continue;
    }
    const m = readJson(cacheDir(sub.cache, 'meta.json'));
    const subMeta = {
      source: sub.cache,
      version: `PubMed, consulta del ${m.retrievedAt} (${m.records} registros)`,
      retrievedAt: m.retrievedAt,
      license: m.license,
      fileUrl: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi',
      sha256: null,
      pin: m.retrievedAt,
    };
    const out = pubmedSubsetCorpus(
      pubmedRecords(cacheDir(sub.cache, 'pages')),
      mesh,
      subMeta,
      meshMeta,
      sub.typeCode,
    );
    coverage.skipped[sub.cache] = out.stats;
    pubmed.assertions.push(...out.assertions);
    pubmed.procedures.push(...out.procedures);
    pubmed.metas.push([sub.cache, subMeta]);
  }

  const assertions = [
    ...poet.assertions,
    ...maxoSites,
    ...ncitOut.assertions,
    ...ncitEvsOut.assertions,
    ...ohd.assertions,
    ...pcs.assertions,
    ...ctgov.assertions,
    ...wd.assertions,
    ...pubmed.assertions,
  ];
  // La edición oficial de NCIt va primero: si un procedimiento está en las dos, se queda su nombre vigente.
  const procedures = uniqueById([
    ...maxoProcs,
    ...ncitEvsOut.procedures,
    ...ncitOut.procedures,
    ...ohd.procedures,
    ...pcs.procedures,
    ...pcs.sites,
    ...ctgov.procedures,
    ...wd.procedures,
    ...pubmed.procedures,
  ]);

  // --- Equivalencias publicadas (solo para los códigos que se usan) ----------------
  const wantedMondo = new Set(
    assertions
      .filter((a) => a.object.system === 'mondo')
      .map((a) => a.object.code),
  );
  const wantedUberon = new Set(
    assertions
      .filter((a) => a.object.system === 'uberon')
      .map((a) => a.object.code),
  );
  const wantedNcit = new Set(
    assertions
      .filter((a) => a.kind === 'procedure-site' && a.object.system === 'ncit')
      .map((a) => a.object.code),
  );

  const mondoRead = await readXrefs(
    oboStanzas(readLines(cacheDir('mondo', 'mondo.obo'))),
    'MONDO',
  );
  const mondoMeta = sourceMeta(
    'mondo',
    'mondo.obo',
    mondoRead.version.dataVersion,
  );
  const uberonRead = await readXrefs(
    oboStanzas(readLines(cacheDir('uberon', 'uberon.obo'))),
    'UBERON',
  );
  const uberonMeta = sourceMeta(
    'uberon',
    'uberon.obo',
    uberonRead.version.dataVersion,
  );
  const maps = [
    ...maxoMaps,
    ...mondoMaps(mondoRead, mondoMeta, wantedMondo),
    ...uberonMaps(uberonRead, uberonMeta, { wantedUberon, wantedNcit }),
  ];

  const assertionsOut = withPublishedSiteAlternates(assertions, maps);

  // --- Escritura -------------------------------------------------------------------
  writeNdjson(outDir('procedures.ndjson'), procedures);
  writeNdjson(outDir('assertions.ndjson'), assertionsOut);
  writeNdjson(outDir('maps.ndjson'), maps);

  // --- Cobertura -------------------------------------------------------------------
  const count = (rows, f) =>
    rows.reduce((acc, r) => ((acc[f(r)] = (acc[f(r)] ?? 0) + 1), acc), {});
  const uniq = (rows, f) => new Set(rows.map(f)).size;
  for (const [key, meta] of [
    ['maxo', maxoMeta],
    ['maxo-annotations', poetMeta],
    ['ncit-obo', ncitMeta],
    ['ohd', ohdMeta],
    ['ncit-evs', ncitEvsMeta],
    ['icd10pcs', pcsMeta],
    ['mesh', meshMeta],
    ...(ctgovMeta ? [['ctgov', ctgovMeta]] : []),
    ['wikidata-p924', wdMeta],
    ...pubmed.metas,
    ['mondo', mondoMeta],
    ['uberon', uberonMeta],
  ]) {
    coverage.sources[key] = {
      version: meta.version,
      pin: meta.pin,
      sha256: meta.sha256,
      retrievedAt: meta.retrievedAt,
      license: meta.license,
    };
  }
  const byKind = (k) => assertions.filter((a) => a.kind === k);
  const mapIndex = new Map();
  for (const m of maps)
    (
      mapIndex.get(conceptKey(m.from)) ??
      mapIndex.set(conceptKey(m.from), []).get(conceptKey(m.from))
    ).push(m.to);
  const ncitToUberon = new Map();
  for (const m of maps)
    if (m.from.system === 'uberon' && m.to.system === 'ncit')
      (
        ncitToUberon.get(m.to.code) ??
        ncitToUberon.set(m.to.code, []).get(m.to.code)
      ).push(m.from.code);

  const diseases = [
    ...new Set(byKind('procedure-disease').map((a) => conceptKey(a.object))),
  ];
  const sites = [
    ...new Set(byKind('procedure-site').map((a) => conceptKey(a.object))),
  ];
  const expressible = (keys, systems) =>
    keys.filter((k) =>
      (mapIndex.get(k) ?? []).some((t) => systems.includes(t.system)),
    ).length;

  Object.assign(coverage, {
    procedures: {
      total: procedures.filter((p) => p.kind !== 'site').length,
      bySystem: count(
        procedures.filter((p) => p.kind !== 'site'),
        (p) => p.system,
      ),
      byCategory: count(
        procedures.filter((p) => p.kind !== 'site'),
        (p) => `${p.system}:${p.category}`,
      ),
      siteConceptsOwned: count(
        procedures.filter((p) => p.kind === 'site'),
        (p) => `${p.system}:${p.category}`,
      ),
    },
    assertions: {
      total: assertions.length,
      byKind: count(assertions, (a) => a.kind),
      byType: count(assertions, (a) => a.relationType.code),
      bySource: count(assertions, (a) => a.provenance.source),
      uniqueRelationships: uniq(assertions, (a) => a.relationshipId),
      uniqueRelationshipsByKind: {
        'procedure-disease': uniq(
          byKind('procedure-disease'),
          (a) => a.relationshipId,
        ),
        'procedure-site': uniq(
          byKind('procedure-site'),
          (a) => a.relationshipId,
        ),
      },
      proceduresWithDisease: uniq(byKind('procedure-disease'), (a) =>
        conceptKey(a.subject),
      ),
      proceduresWithSite: uniq(byKind('procedure-site'), (a) =>
        conceptKey(a.subject),
      ),
    },
    diseases: {
      linked: diseases.length,
      bySystem: count(diseases, (k) => k.split('|')[0]),
      withIcd10Equivalent: expressible(diseases, ['icd10', 'icd10cm']),
      withMeshEquivalent: expressible(diseases, ['mesh']),
      withOrphanetEquivalent: expressible(diseases, ['orphanet']),
      withoutAnyEquivalent: diseases.filter(
        (k) => k.startsWith('mondo|') && !(mapIndex.get(k) ?? []).length,
      ).length,
    },
    sites: {
      linked: sites.length,
      bySystem: count(sites, (k) => k.split('|')[0]),
      ncitSitesWithUberonXref: sites.filter(
        (k) => k.startsWith('ncit|') && ncitToUberon.has(k.split('|')[1]),
      ).length,
      ncitSitesWithUniqueUberonXref: sites.filter(
        (k) =>
          k.startsWith('ncit|') &&
          ncitToUberon.get(k.split('|')[1])?.length === 1,
      ).length,
      siteAssertionsWithUberonAlternate: assertionsOut.filter(
        (a) => a.objectAlternates?.length,
      ).length,
      siteAssertionsAmbiguousUberon: assertionsOut.filter(
        (a) => a.objectAlternatesAmbiguous,
      ).length,
      uberonSitesWithFmaXref: expressible(
        sites.filter((k) => k.startsWith('uberon|')),
        ['fma'],
      ),
    },
    maps: {
      total: maps.length,
      byType: count(
        maps,
        (m) => `${m.from.system}->${m.to.system} (${m.mapType})`,
      ),
    },
    universe: {
      maxoTermsActive: [...terms.values()].filter((t) => !t.obsolete).length,
      mondoTermsActive: mondoRead.xrefs.size,
      uberonTermsActive: uberonRead.xrefs.size,
      ncitProcedureRolesInEdition: ncit.roles.length,
    },
    gaps: Object.fromEntries(
      Object.entries(BLOCKED_SOURCES).map(([k, v]) => [
        k,
        {
          name: v.name,
          hosts: v.hosts,
          reason: 'política de red del entorno: 403 al CONNECT',
        },
      ]),
    ),
    network: existsSync(cacheDir('_network.json'))
      ? readJson(cacheDir('_network.json'))
      : null,
  });
  writeJson(outDir('coverage.json'), coverage);
  console.log(
    JSON.stringify(
      {
        procedures: coverage.procedures,
        assertions: coverage.assertions,
        diseases: coverage.diseases,
        sites: coverage.sites,
        maps: coverage.maps.total,
        skipped: coverage.skipped,
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error('ERROR FATAL en procedures-treatments/build:', err);
  process.exitCode = 1;
});
