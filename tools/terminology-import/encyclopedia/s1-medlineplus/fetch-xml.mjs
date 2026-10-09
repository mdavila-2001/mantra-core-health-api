#!/usr/bin/env node
// =============================================================================
// Baja el XML de temas de salud MÁS RECIENTE que MedlinePlus ofrece en
// https://medlineplus.gov/xml.html (una descarga, ~30 MB; `/xml/` figura como
// Disallow para rastreadores, pero es el archivo que esa página ofrece para
// bajar, como ya hace `import-medlineplus-es.mjs`). Lo guarda con un sidecar
// `.meta.json` {url, retrievedAt, sha256}: la fecha de consulta es parte del dato.
// =============================================================================

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { HttpClient, nowIso, sha256File, writeJson } from '../../lib/glossary-es/common.mjs';
import { DEFAULTS, S1_USER_AGENT } from './lib/config.mjs';

const http = new HttpClient({ concurrency: 1, minDelayMs: 1000, headers: { 'User-Agent': S1_USER_AGENT } });
const { body } = await http.get('https://medlineplus.gov/xml.html');
const links = [...body.toString('utf8').matchAll(/href="(https:\/\/medlineplus\.gov\/xml\/mplus_topics_(\d{4}-\d{2}-\d{2})\.xml)"/g)]
  .map((m) => ({ url: m[1], date: m[2] }))
  .sort((a, b) => b.date.localeCompare(a.date));
if (!links.length) throw new Error('No se encontró mplus_topics_<fecha>.xml en https://medlineplus.gov/xml.html');
const latest = links[0];
const path = join(DEFAULTS.xmlDir, `mplus_topics_${latest.date}.xml`);
if (existsSync(path)) {
  console.log(`Ya está en caché: ${path}`);
} else {
  await http.getFileCached(latest.url, path);
  writeJson(`${path}.meta.json`, { url: latest.url, retrievedAt: nowIso(), sha256: sha256File(path) }, true);
  console.log(`Descargado ${latest.url}`);
}
console.log(readFileSync(`${path}.meta.json`, 'utf8'));
