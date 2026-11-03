#!/usr/bin/env node
// =============================================================================
// Sondeo de alcance: ¿qué fuentes europeas responden desde este entorno?
// Se corre al inicio de cada pasada del /loop. Escribe
// out/probe/probe-<fecha>.json (pequeño, versionado como evidencia) y no
// descarga datos.
//
//   node tools/terminology-import/diagnostic-devices/eu/probe.mjs
// =============================================================================

import { httpFetch, nowIso, outDir, writeJson } from './lib/common.mjs';
import { SOURCES, requiredHosts } from './lib/sources.mjs';

const startedAt = nowIso();
const results = [];
for (const [key, s] of Object.entries(SOURCES)) {
  const r = httpFetch(s.probeUrl, { timeoutS: 30 });
  results.push({
    source: key,
    host: new URL(s.probeUrl).host,
    url: s.probeUrl,
    httpStatus: r.status,
    blockedByEnvironment: r.blocked,
    error: r.error,
    reachable: r.status !== null && r.status < 500,
  });
  console.log(
    `${key.padEnd(18)} ${r.blocked ? 'BLOQUEADO (política de red)' : r.status ? `HTTP ${r.status}` : `ERROR ${r.error}`}`,
  );
}
const file = outDir(
  'probe',
  `probe-${startedAt.replace(/[-:]/g, '').slice(0, 13)}.json`,
);
writeJson(file, {
  startedAt,
  finishedAt: nowIso(),
  requiredHosts: requiredHosts(),
  results,
});
const blocked = results.filter((r) => r.blockedByEnvironment).length;
console.log(
  `\n${results.length - blocked}/${results.length} fuentes alcanzables; ${blocked} bloqueadas por la política de red. Detalle: ${file}`,
);
