#!/usr/bin/env node
// =============================================================================
// ROW · descarga de los archivos OFICIALES (sin espejos) a
// `$DX_DEVICES_BUILD_DIR/official/<fuente>/` y registro de procedencia en
// `official.json` (URL, Last-Modified, bytes, SHA-256, fecha). Reanudable: un
// archivo ya registrado no se vuelve a bajar (salvo --force).
//
//   node fetch-official.mjs [--only=anvisa-site,hc-mdall,tfda,invima] [--force]
//
// Fuentes verificadas el 2026-10-27 (ver SOURCES.md para licencias):
//   anvisa-site    dados.anvisa.gov.br/dados/TA_PRODUTO_SAUDE_SITE.csv
//   hc-mdall       health-products.canada.ca/api/medical-devices/{licence,company,device,deviceidentifier}
//   tfda           data.fda.gov.tw/data/opendata/export/68/csv   (zip con 68_2.csv)
//   invima         datos.gov.co Socrata y4qt-w6tk, sin roles de personas físicas
// ≤ 2 pedidos/s por host; los archivos se escriben en streaming (curl -o).
// =============================================================================

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { BUILD_DIR } from './lib/row.mjs';

const OFFICIAL_DIR = join(BUILD_DIR, 'official');
const REGISTRY = join(OFFICIAL_DIR, 'official.json');
const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const only = args.find((a) => a.startsWith('--only='))?.slice(7).split(',') ?? null;

mkdirSync(OFFICIAL_DIR, { recursive: true });
const registry = existsSync(REGISTRY) ? JSON.parse(readFileSync(REGISTRY, 'utf8')) : {};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const sha256 = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');

/** curl a archivo; devuelve { status, lastModified }. Reintenta con backoff. */
async function download(url, file, { maxSeconds = 1800, maxBytes = 900_000_000 } = {}) {
  mkdirSync(join(file, '..'), { recursive: true });
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const out = execFileSync(
        'curl',
        ['-sS', '-L', '--max-time', String(maxSeconds), '--max-filesize', String(maxBytes),
          '-D', `${file}.hdr`, '-o', file, '-w', '%{http_code}', url],
        { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
      ).trim();
      const status = Number(out);
      if (status >= 200 && status < 300) {
        const hdr = readFileSync(`${file}.hdr`, 'utf8');
        const lm = /^last-modified:\s*(.+)$/im.exec(hdr)?.[1]?.trim() ?? null;
        return { status, lastModified: lm };
      }
      console.warn(`[intento ${attempt}] HTTP ${status} ${url}`);
    } catch (err) {
      console.warn(`[intento ${attempt}] ${String(err.stderr ?? err.message).trim().split('\n').pop()} ${url}`);
    }
    await sleep(Math.min(60_000, 3_000 * 2 ** attempt));
  }
  return { status: null, lastModified: null };
}

async function fetchOne(source, name, url, opts) {
  const key = `${source}/${name}`;
  const file = join(OFFICIAL_DIR, source, name);
  if (!FORCE && registry[key] && existsSync(file)) {
    console.log(`= ${key} (ya descargado)`);
    return registry[key];
  }
  const { status, lastModified } = await download(url, file, opts);
  if (status === null) {
    registry[key] = { url, error: 'sin respuesta tras 5 intentos', at: new Date().toISOString() };
  } else {
    registry[key] = {
      url, file: `${source}/${name}`, status, lastModified,
      bytes: statSync(file).size, sha256: sha256(file), retrievedAt: new Date().toISOString(),
    };
    console.log(`+ ${key} ${registry[key].bytes} B`);
  }
  writeFileSync(REGISTRY, JSON.stringify(registry, null, 2) + '\n');
  return registry[key];
}

const JOBS = {
  async 'anvisa-site'() {
    await fetchOne('anvisa', 'TA_PRODUTO_SAUDE_SITE.csv', 'https://dados.anvisa.gov.br/dados/TA_PRODUTO_SAUDE_SITE.csv');
  },
  async 'hc-mdall'() {
    const B = 'https://health-products.canada.ca/api/medical-devices';
    const specs = [
      ['active_license.json', `${B}/licence/?state=active&type=json&lang=en`],
      ['archive_license.json', `${B}/licence/?state=archived&type=json&lang=en`],
      ['company.json', `${B}/company/?type=json&lang=en`],
      ['active_device.json', `${B}/device/?state=active&type=json&lang=en`],
      ['archive_device.json', `${B}/device/?state=archived&type=json&lang=en`],
      ['active_device_identifier.json', `${B}/deviceidentifier/?state=active&type=json&lang=en`],
      ['archive_device_identifier.json', `${B}/deviceidentifier/?state=archived&type=json&lang=en`],
    ];
    for (const [name, url] of specs) {
      await fetchOne('hc-mdall', name, url);
      await sleep(1000);
    }
  },
  async tfda() {
    await fetchOne('tfda', '68_csv.zip', 'https://data.fda.gov.tw/data/opendata/export/68/csv');
  },
  async invima() {
    // Se excluyen los roles que son personas físicas (apoderado, representante
    // legal, químico farmacéutico, responsable): nombre_rol sería un dato personal.
    const where = encodeURIComponent(
      "rol NOT IN ('APODERADO','REPRESENTANTE LEGAL','REPRESENTANTE LEGAL PARALELO','QUIMICO FARMACEUTICO','RESPONSABLE')",
    );
    await fetchOne('invima', 'meta.json', 'https://www.datos.gov.co/api/views/y4qt-w6tk.json');
    const base = 'https://www.datos.gov.co/resource/y4qt-w6tk.json';
    const limit = 50000;
    for (let page = 0; page < 30; page++) {
      const url = `${base}?$where=${where}&$order=:id&$limit=${limit}&$offset=${page * limit}`;
      const rec = await fetchOne('invima', `page-${String(page + 1).padStart(3, '0')}.json`, url);
      if (!rec.file) break;
      const n = JSON.parse(readFileSync(join(OFFICIAL_DIR, rec.file), 'utf8')).length;
      rec.rows = n;
      writeFileSync(REGISTRY, JSON.stringify(registry, null, 2) + '\n');
      if (n < limit) break;
      await sleep(1000);
    }
  },
};

for (const [name, job] of Object.entries(JOBS)) {
  if (only && !only.includes(name)) continue;
  await job();
}
console.log(`official.json → ${REGISTRY}`);
