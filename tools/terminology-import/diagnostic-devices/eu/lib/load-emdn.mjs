// =============================================================================
// EMDN para el pipeline: la oficial (Excel de la Comisión en el caché de
// fetch.mjs) si está; si no, la réplica fijada por commit (fetch-mirrors.mjs).
// La usan fetch.mjs (lista de códigos a consultar en EUDAMED) y build.mjs.
// =============================================================================

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cacheDir, parseCsv, readJson } from './common.mjs';
import { assertTypePrefixesExist } from './emdn-scope.mjs';
import { mirrorById } from './mirrors.mjs';
import { parseEmdnRows, readFirstSheet } from './sources/emdn.mjs';

/** Versión legible desde el nombre del archivo oficial («EMDN v2026_EN..xlsx» → «v2026»). */
export const emdnVersionFromName = (name) =>
  /v\.?(\d{4})/i.exec(name ?? '')?.[1]
    ? `v${/v\.?(\d{4})/i.exec(name)[1]}`
    : null;

/**
 * @returns {Promise<{ concepts: object[], origin: 'official'|'mirror'|null }>}
 */
export async function loadEmdn() {
  const manifestPath = cacheDir('manifest.json');
  const cache = existsSync(manifestPath)
    ? readJson(manifestPath)
    : { files: [] };
  const xlsx = cache.files
    .filter((f) => f.source === 'EMDN' && /\.xlsx?$/i.test(f.file))
    .at(-1);
  let concepts = [];
  let origin = null;
  if (xlsx) {
    const { header, records } = await readFirstSheet(xlsx.file);
    concepts = parseEmdnRows(header, records, {
      sourceUrl: xlsx.url,
      sourceVersion: `${emdnVersionFromName(decodeURIComponent(xlsx.url)) ?? 'oficial'};sha256:${xlsx.sha256.slice(0, 12)}`,
      retrievedAt: xlsx.retrievedAt,
    });
    origin = 'official';
  } else {
    const mm = cacheDir('mirrors', 'manifest.json');
    const m = existsSync(mm)
      ? readJson(mm).mirrors.find(
          (x) => x.id === 'batirmedical-emdn' && !x.error,
        )
      : null;
    if (!m) return { concepts: [], origin: null };
    const { header, records } = parseCsv(
      readFileSync(join(m.dir, m.data), 'utf8'),
    );
    concepts = parseEmdnRows(header, records, {
      sourceUrl: `${m.repo}/blob/${m.commit}/${m.data}`,
      sourceVersion: `${mirrorById(m.id).upstreamVersion};via=batirmedical@${m.commit.slice(0, 8)};sha256:${m.sha256.slice(0, 12)}`,
      retrievedAt: m.retrievedAt,
    });
    origin = 'mirror';
  }
  assertTypePrefixesExist(new Set(concepts.map((c) => c.code)));
  return { concepts, origin };
}
