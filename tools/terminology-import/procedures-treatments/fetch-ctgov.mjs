#!/usr/bin/env node
// =============================================================================
// Descarga de ClinicalTrials.gov (API v2) a la caché fuera de git.
//
// Solo estudios INTERVENCIONALES y solo los campos que usa el normalizador:
// NCT, tipo de estudio, estado, fases, intervenciones (tipo y nombre),
// condiciones declaradas, MeSH derivado por NLM de condiciones e
// intervenciones, y fecha de última actualización. Una página = un archivo
// gzip con la URL exacta del pedido; `meta.json` guarda el `dataTimestamp` que
// publica la API (la versión del corpus) y la fecha de descarga.
//
// Reanudable: si una página ya está en caché con su token, no se vuelve a pedir.
//
// Uso: node tools/terminology-import/procedures-treatments/fetch-ctgov.mjs
// =============================================================================

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gunzipSync, gzipSync } from 'node:zlib';
import { cacheDir, ensureDir, nowIso, writeJson } from './lib/common.mjs';

const API = 'https://clinicaltrials.gov/api/v2';
const FIELDS = [
  'protocolSection.identificationModule.nctId',
  'protocolSection.designModule.studyType',
  'protocolSection.designModule.phases',
  'protocolSection.statusModule.overallStatus',
  'protocolSection.statusModule.lastUpdatePostDateStruct',
  'protocolSection.armsInterventionsModule.interventions',
  'protocolSection.conditionsModule.conditions',
  'derivedSection.conditionBrowseModule.meshes',
  'derivedSection.interventionBrowseModule.meshes',
].join(',');
const DIR = ensureDir(cacheDir('ctgov', 'pages'));

function getJson(url) {
  for (let attempt = 1; ; attempt++) {
    try {
      const out = execFileSync(
        'curl',
        ['-sS', '--fail', '--max-time', '120', url],
        {
          encoding: 'utf8',
          maxBuffer: 256 << 20,
          stdio: ['ignore', 'pipe', 'pipe'],
        },
      );
      return JSON.parse(out);
    } catch (err) {
      if (attempt >= 6)
        throw new Error(
          `ClinicalTrials.gov falló tras ${attempt} intentos: ${url}\n${err.stderr ?? err.message}`,
        );
      execFileSync('sleep', [String(5 * attempt)]);
    }
  }
}

const version = getJson(`${API}/version`);
const retrievedAt = nowIso();
let token = null;
let page = 0;
let studies = 0;
let total = null;
do {
  page++;
  const file = join(DIR, `p${String(page).padStart(5, '0')}.json.gz`);
  const params = new URLSearchParams({
    format: 'json',
    pageSize: '1000',
    fields: FIELDS,
    'filter.advanced': 'AREA[StudyType]INTERVENTIONAL',
  });
  if (page === 1) params.set('countTotal', 'true');
  if (token) params.set('pageToken', token);
  const url = `${API}/studies?${params}`;
  let body;
  if (existsSync(file)) {
    const cached = JSON.parse(gunzipSync(readFileSync(file)).toString('utf8'));
    if (cached.url !== url)
      throw new Error(
        `Caché inconsistente en ${file}: borrar cache/ctgov y volver a correr`,
      );
    body = cached.body;
  } else {
    body = getJson(url);
    writeFileSync(file, gzipSync(JSON.stringify({ url, body })));
    execFileSync('sleep', ['1.3']); // < 50 pedidos por minuto
  }
  if (body.totalCount != null) total = body.totalCount;
  studies += body.studies.length;
  token = body.nextPageToken ?? null;
  if (page % 25 === 0 || !token)
    console.log(`[ctgov] página ${page}: ${studies}/${total ?? '?'} estudios`);
} while (token);

writeJson(cacheDir('ctgov', 'meta.json'), {
  source: 'ctgov',
  name: 'ClinicalTrials.gov API v2 (estudios intervencionales)',
  publisher: 'U.S. National Library of Medicine',
  license:
    'Dominio público (NLM); términos de uso de ClinicalTrials.gov: https://clinicaltrials.gov/about-site/terms-conditions',
  licenseUrl: 'https://clinicaltrials.gov/about-site/terms-conditions',
  homepage: 'https://clinicaltrials.gov/',
  apiVersion: version.apiVersion,
  dataTimestamp: version.dataTimestamp,
  retrievedAt,
  query: {
    filter: 'AREA[StudyType]INTERVENTIONAL',
    fields: FIELDS,
    pageSize: 1000,
  },
  pages: page,
  studies,
  totalCount: total,
});
console.log(
  JSON.stringify({
    pages: page,
    studies,
    totalCount: total,
    dataTimestamp: version.dataTimestamp,
  }),
);
