#!/usr/bin/env node
// =============================================================================
// S3 · comprobación de que las imágenes del artículo SIGUEN resolviendo.
// HEAD (sin bajar el archivo), 1 petición por segundo, reanudable, solo hosts de la CSP.
//
//   node check-images.mjs --plan                 # cuenta, no pide nada
//   node check-images.mjs --scope main           # la primera imagen de cada artículo
//   node check-images.mjs --scope sample:200     # + muestra determinista de las demás
//   node check-images.mjs --scope all
//
// Escribe `cache/image-check.json` y `out/image-check-summary.json`.
// =============================================================================

import { createReadStream, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createInterface } from 'node:readline';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { allowedHost } from './lib/images.mjs';
import { CACHE_DIR, OUT_DIR } from './lib/paths.mjs';
import { PoliteClient } from './lib/polite-client.mjs';

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : def;
};

export async function selectUrls(articlesPath, scope) {
  const first = new Set();
  const rest = new Set();
  const rl = createInterface({ input: createReadStream(articlesPath, { encoding: 'utf8' }), crlfDelay: Infinity });
  for await (const line of rl) {
    if (!line.trim()) continue;
    const a = JSON.parse(line);
    a.images.forEach((img, i) => (i === 0 ? first : rest).add(img.url));
  }
  // Las de Commons son pocas y son las que más cambian (archivos renombrados o borrados): todas.
  const commons = [...rest].filter((u) => new URL(u).hostname === 'upload.wikimedia.org');
  const others = [...rest].filter((u) => !commons.includes(u)).sort();
  const h = (u) => createHash('sha1').update(u).digest('hex');
  let extra = [];
  if (scope === 'all') extra = others;
  else if (scope.startsWith('sample:')) extra = others.sort((a, b) => h(a).localeCompare(h(b))).slice(0, Number(scope.split(':')[1]));
  return { urls: [...new Set([...first, ...commons, ...extra])].sort(), counts: { first: first.size, commonsExtra: commons.length, othersTotal: others.length, extraChosen: extra.length } };
}

async function main() {
  const scope = opt('--scope', 'sample:200');
  const { urls, counts } = await selectUrls(join(OUT_DIR, 'articles.ndjson'), scope);
  const bad = urls.filter((u) => !allowedHost(u));
  if (bad.length) throw new Error(`URLs fuera de la CSP: ${bad.slice(0, 3).join(', ')}`);
  const cachePath = join(CACHE_DIR, 'image-check.json');
  const done = existsSync(cachePath) ? JSON.parse(readFileSync(cachePath, 'utf8')) : {};
  const pending = urls.filter((u) => !(u in done));
  console.log(JSON.stringify({ scope, ...counts, toCheck: urls.length, alreadyChecked: urls.length - pending.length, pending: pending.length }));
  if (args.includes('--plan')) return;

  const client = new PoliteClient({ minIntervalMs: 1000 });
  let n = 0;
  for (const url of pending) {
    try {
      const r = await client.request(url, { method: 'HEAD', allow404: true });
      done[url] = { status: r.status, contentType: r.headers.get('content-type'), bytes: Number(r.headers.get('content-length')) || null };
    } catch (err) {
      done[url] = { status: 0, error: String(err.message).slice(0, 120) };
    }
    if (++n % 50 === 0) {
      writeFileSync(cachePath, JSON.stringify(done));
      console.log(`${n}/${pending.length}`);
    }
  }
  writeFileSync(cachePath, JSON.stringify(done));

  const byHost = {};
  for (const u of urls) {
    const h = new URL(u).hostname;
    const r = done[u];
    const b = (byHost[h] ??= { checked: 0, ok: 0, notFound: 0, otherStatus: {}, notImage: 0 });
    b.checked++;
    if (r.status === 200) {
      b.ok++;
      if (!/^image\//.test(r.contentType ?? '')) b.notImage++;
    } else if (r.status === 404) b.notFound++;
    else b.otherStatus[r.status] = (b.otherStatus[r.status] ?? 0) + 1;
  }
  const failing = urls.filter((u) => done[u].status !== 200);
  const summary = { scope, ...counts, checked: urls.length, byHost, failing: failing.slice(0, 50), failingCount: failing.length };
  writeFileSync(join(OUT_DIR, 'image-check-summary.json'), JSON.stringify(summary, null, 2) + '\n');
  console.log(JSON.stringify(summary, null, 2));
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error('ERROR FATAL en check-images:', e);
    process.exitCode = 1;
  });
}
