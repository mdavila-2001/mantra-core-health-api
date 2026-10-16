#!/usr/bin/env node
// =============================================================================
// F9 · S2 — descarga SOLO lo que el corte necesita (sin MRCOC) y deja constancia.
//
//   node fetch-sources.mjs [--cache-dir <dir>]
//
// Idempotente: un archivo ya presente no se vuelve a bajar (se vuelve a hashear).
// Cortesía: 1 descarga a la vez, ≥1 s entre pedidos, User-Agent identificable.
// Escribe `<cache>/sources-manifest.json` con URL, bytes, sha256 y fecha de cada
// archivo; `build-articles.mjs` lo lee para citar versión y fecha de consulta.
// Nada se carga en ninguna base.
// =============================================================================

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createReadStream, existsSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { HttpClient, ensureDir } from '../../lib/glossary-es/common.mjs';
import { defaultCacheDir, parseArgs } from './lib/cli.mjs';

export const SOURCE_FILES = Object.freeze({
  'orphanet-es': { file: 'es_product1.xml', url: 'https://www.orphadata.com/data/xml/es_product1.xml' },
  'orphanet-prevalence': { file: 'es_product9_prev.xml', url: 'https://www.orphadata.com/data/xml/es_product9_prev.xml' },
  'orphanet-ages': { file: 'es_product9_ages.xml', url: 'https://www.orphadata.com/data/xml/es_product9_ages.xml' },
  'hpo-ontology': { file: 'hp.json', url: 'https://github.com/obophenotype/human-phenotype-ontology/releases/latest/download/hp.json' },
  'hpo-annotations': { file: 'phenotype.hpoa', url: 'https://github.com/obophenotype/human-phenotype-ontology/releases/latest/download/phenotype.hpoa' },
  'hpo-es': { file: 'hp-es.babelon.tsv', url: 'https://raw.githubusercontent.com/obophenotype/hpo-translations/main/babelon/hp-es.babelon.tsv' },
  mondo: { file: 'mondo.json', url: 'https://github.com/monarch-initiative/mondo/releases/latest/download/mondo.json' },
  // ICD-10-CM FY2025 (la CIE-10-ES 6.ª ed. incorpora los addenda hasta FY2025). Un zip: se extrae solo el tabular.
  'icd10cm-tabular': {
    file: 'icd-10-cm-tabular-2025.xml',
    url: 'https://ftp.cdc.gov/pub/Health_Statistics/NCHS/Publications/ICD10CM/2025/icd10cm-table-index-2025.zip',
    zipMember: 'icd-10-cm-tabular-2025.xml',
  },
  'disease-ontology': { file: 'doid.obo', url: 'https://raw.githubusercontent.com/DiseaseOntology/HumanDiseaseOntology/main/src/ontology/doid.obo' },
});

function sha256(path) {
  return new Promise((resolve, reject) => {
    const h = createHash('sha256');
    createReadStream(path).on('data', (d) => h.update(d)).on('error', reject).on('end', () => resolve(h.digest('hex')));
  });
}

export async function fetchSources(cacheDir) {
  const dir = ensureDir(join(cacheDir, 'files'));
  const http = new HttpClient({ concurrency: 1, minDelayMs: 1000 });
  const manifest = {};
  for (const [name, { file, url, zipMember }] of Object.entries(SOURCE_FILES)) {
    const path = join(dir, file);
    if (!existsSync(path)) {
      console.log(`[fetch] ${name}: ${url}`);
      if (zipMember) {
        const zip = join(dir, `${file}.zip`);
        await http.getFileCached(url, zip);
        writeFileSync(path, execFileSync('unzip', ['-p', zip, zipMember], { maxBuffer: 1 << 30 }));
        rmSync(zip);
      } else {
        await http.getFileCached(url, path);
      }
    } else {
      console.log(`[fetch] ${name}: ya en caché`);
    }
    const st = statSync(path);
    manifest[name] = { file, url, bytes: st.size, sha256: await sha256(path), retrievedAt: st.mtime.toISOString().slice(0, 10) };
  }
  writeFileSync(join(cacheDir, 'sources-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = parseArgs(process.argv.slice(2));
  const cacheDir = args['cache-dir'] ?? defaultCacheDir();
  const manifest = await fetchSources(cacheDir);
  console.log(`[fetch] ${Object.keys(manifest).length} fuentes en ${cacheDir}`);
}
