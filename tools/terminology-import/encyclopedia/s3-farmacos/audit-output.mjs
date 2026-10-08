#!/usr/bin/env node
// =============================================================================
// S3 · auditoría independiente de la SALIDA ya escrita (no reutiliza `dose-guard.mjs`):
//   1. ninguna cadena de `articles.ndjson` ni de `rejected.ndjson` casa con los patrones de
//      dosis tal como los pide la ficha (número + mg/g/ml/UI/mcg/µg/%, «cada N horas», «dosis»);
//   2. ninguna sección con locator 4.2 y ningún texto con título de posología;
//   3. todas las imágenes están en los tres hosts de la CSP y con licencia admitida;
//   4. conteos por licencia y por host.
// Sale con código 1 si algo falla. Escribe `out/audit.json`.
// =============================================================================

import { createReadStream, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createInterface } from 'node:readline';
import { pathToFileURL } from 'node:url';
import { OUT_DIR } from './lib/paths.mjs';

export const SPEC_DOSE_PATTERNS = [
  // el número empieza donde empieza el token: «A11G» (código ATC) no es «11 g»
  ['number+unit', /(?<![A-Za-z\d])\d[\d.,]*\s*(?:mg|g|ml|ui|iu|mcg|µg|μg|ug|kg|%)(?![A-Za-z])/i],
  ['cada N horas', /\bcada\s+\d+\s*(?:horas|h)\b/i],
  ['dosis', /dosis/i],
  ['posologia', /posolog/i],
];
const ALLOWED_HOSTS = new Set(['upload.wikimedia.org', 'thumb.wikimedia.org', 'cima.aemps.es']);
const ALLOWED_LICENSE = /^(public domain|pd[\s-]|cc0|cc[\s-]by(?:[\s-]sa)?\b|aemps\/cima)/i;

function* strings(value, path = '$') {
  if (typeof value === 'string') yield [path, value];
  else if (Array.isArray(value)) for (const [i, v] of value.entries()) yield* strings(v, `${path}[${i}]`);
  else if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) yield* strings(v, `${path}.${k}`);
}

async function scan(file, onLine) {
  const rl = createInterface({ input: createReadStream(file, { encoding: 'utf8' }), crlfDelay: Infinity });
  let n = 0;
  for await (const line of rl) {
    if (!line.trim()) continue;
    onLine(JSON.parse(line), ++n);
  }
  return n;
}

export async function audit(outDir = OUT_DIR) {
  const report = { articles: 0, rejectedLines: 0, doseHits: [], section42: 0, imageHosts: {}, imageLicenses: {}, badImages: [], badImageCount: 0 };
  const hit = (file, line, path, pattern, text) => report.doseHits.push({ file, line, path, pattern, excerpt: text.slice(0, 100) });

  report.articles = await scan(join(outDir, 'articles.ndjson'), (a, ln) => {
    for (const [path, s] of strings(a)) {
      if (/^https?:\/\//.test(s)) continue;
      for (const [id, re] of SPEC_DOSE_PATTERNS) if (re.test(s)) hit('articles', ln, path, id, s);
    }
    for (const s of a.sections) if (/^4\.2\b/.test(s.locator ?? '')) report.section42++;
    for (const img of a.images) {
      const hosts = [img.url, img.thumbUrl].map((u) => new URL(u).hostname);
      for (const h of hosts) report.imageHosts[h] = (report.imageHosts[h] ?? 0) + 1;
      report.imageLicenses[img.license] = (report.imageLicenses[img.license] ?? 0) + 1;
      if (!hosts.every((h) => ALLOWED_HOSTS.has(h)) || !ALLOWED_LICENSE.test(img.license) || /\b(nc|nd)\b/i.test(img.license)) {
        report.badImageCount++;
        report.badImages.push({ line: ln, url: img.url, license: img.license });
      }
    }
  });
  report.rejectedLines = await scan(join(outDir, 'rejected.ndjson'), (r, ln) => {
    for (const [path, s] of strings(r)) {
      if (/^https?:\/\//.test(s)) continue;
      for (const [id, re] of SPEC_DOSE_PATTERNS) if (re.test(s)) hit('rejected', ln, path, id, s);
    }
  });
  report.ok = report.doseHits.length === 0 && report.section42 === 0 && report.badImageCount === 0;
  return report;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const dir = process.argv[2] ?? OUT_DIR;
  audit(dir).then((r) => {
    const shown = { ...r, doseHits: r.doseHits.slice(0, 20), doseHitCount: r.doseHits.length };
    writeFileSync(join(dir, 'audit.json'), JSON.stringify({ ...shown }, null, 2) + '\n');
    console.log(JSON.stringify(shown, null, 2));
    process.exitCode = r.ok ? 0 : 1;
  });
}
