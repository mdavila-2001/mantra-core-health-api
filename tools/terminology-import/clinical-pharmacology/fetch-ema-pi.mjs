#!/usr/bin/env node
// =============================================================================
// Farmacología clínica · etapa 1i (red): información de producto de la EMA en
// castellano (PDF del EPAR), de cada medicamento de uso humano autorizado con
// ATC 5 en el informe «Medicines output» ya bajado por fetch-ema.mjs.
//
//   URL: https://www.ema.europa.eu/es/documents/product-information/<slug>-epar-product-information_es.pdf
//   (<slug> = último tramo de la «Medicine URL» del informe; es el enlace que
//   publica la página del EPAR).
//
// Se guarda el PDF y su texto (`pdftotext -layout -enc UTF-8`, poppler) en
// clinical-pharmacology/cache/ema-pi/; el meta lleva URL, bytes y sha256 de
// cada PDF. Reanudable. Un 404 se registra, no se adivina otra URL. El texto
// de pdftotext sólo sirve para leer los nº EU: no se publica.
//
// También baja la tabla oficial «Adobe Symbol Encoding to Unicode» (unicode.org)
// y verifica su sha256: es la que usa py/ema_pi_extract.py.
//
// Uso:
//   NODE_USE_ENV_PROXY=1 node tools/terminology-import/clinical-pharmacology/fetch-ema-pi.mjs
//   EMA_PI_WORKERS=4 python3 -I tools/terminology-import/clinical-pharmacology/py/ema_pi_extract.py \
//     <cache>/ema-pi/adobe-symbol.txt <cache>/ema-pi/rows <cache>/ema-pi/*_es.pdf
// =============================================================================

import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { HttpClient, ensureDir, mapPool, progressLogger, writeJson } from '../lib/glossary-es/common.mjs';
import { emaRecords, isHumanAuthorised } from './lib/ema.mjs';
import { emaPiSlug, emaPiUrl } from './lib/ema-pi.mjs';
import { readEma } from './lib/inputs.mjs';
import { cpCache } from './lib/paths.mjs';

const http = new HttpClient({ concurrency: 2, minDelayMs: 500 });
/** Tabla oficial de la codificación Symbol de Adobe → Unicode (Unicode, Inc., 2011-07-12). */
export const ADOBE_SYMBOL_URL = 'https://unicode.org/Public/MAPPINGS/VENDORS/ADOBE/symbol.txt';
export const ADOBE_SYMBOL_SHA256 = 'deb78ca840a429311939b9d165890873f71fb23ef223ceeb144a6c6d641a7e52';

async function main() {
  const t0 = Date.now();
  const raw = readEma();
  if (!raw) throw new Error('Falta el informe de la EMA: correr fetch-ema.mjs antes.');
  const recs = emaRecords(raw.rows).filter((r) => isHumanAuthorised(r) && r.atc5.length);
  const dir = ensureDir(cpCache('ema-pi'));
  const symbol = await http.getFileCached(ADOBE_SYMBOL_URL, join(dir, 'adobe-symbol.txt'));
  const symbolSha = createHash('sha256').update(symbol).digest('hex');
  if (symbolSha !== ADOBE_SYMBOL_SHA256) throw new Error(`La tabla de Adobe cambió (sha256 ${symbolSha}); revisarla antes de extraer.`);
  const files = [];
  await mapPool(
    recs,
    2,
    async (r) => {
      const slug = emaPiSlug(r.url);
      if (!slug) return files.push({ productNumber: r.productNumber, error: 'sin slug en Medicine URL' });
      const url = emaPiUrl(slug);
      const pdf = join(dir, `${slug}_es.pdf`);
      const txt = join(dir, `${slug}_es.txt`);
      const missing = join(dir, `${slug}_es.404`);
      if (existsSync(missing)) return files.push({ productNumber: r.productNumber, slug, url, status: 404 });
      if (!existsSync(pdf)) {
        const { status, body } = await http.get(url, { allow404: true });
        if (status === 404) {
          writeJson(missing, { url, status });
          return files.push({ productNumber: r.productNumber, slug, url, status: 404 });
        }
        writeFileSync(pdf, body);
      }
      if (!existsSync(txt)) execFileSync('pdftotext', ['-layout', '-enc', 'UTF-8', pdf, txt]);
      const buf = readFileSync(pdf);
      files.push({ productNumber: r.productNumber, slug, url, status: 200, bytes: buf.length, sha256: createHash('sha256').update(buf).digest('hex') });
    },
    progressLogger('ema-pi', 100),
  );
  files.sort((a, b) => String(a.productNumber).localeCompare(String(b.productNumber)));
  const meta = {
    source: 'ema-product-information',
    language: 'es',
    extractor: `${spawnSync('pdftotext', ['-v'], { encoding: 'utf8' }).stderr.split('\n')[0]} (-layout -enc UTF-8)`,
    adobeSymbol: { url: ADOBE_SYMBOL_URL, sha256: symbolSha },
    medicines: recs.length,
    downloaded: files.filter((f) => f.status === 200).length,
    notFound: files.filter((f) => f.status === 404).length,
    errors: files.filter((f) => f.error).length,
    http: http.stats,
    segundos: Math.round((Date.now() - t0) / 1000),
  };
  writeJson(join(dir, 'fetch.meta.json'), { ...meta, files }, true);
  console.log(JSON.stringify(meta, null, 2));
}

main().catch((err) => {
  console.error('ERROR FATAL en fetch-ema-pi:', err);
  process.exitCode = 1;
});
