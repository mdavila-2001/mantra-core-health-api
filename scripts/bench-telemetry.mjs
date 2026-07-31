#!/usr/bin/env node
// =========================================================================
// Mantra Core Technologies · REDESA Health Ecosystem
// Mide el coste real de la instrumentación sobre un endpoint que recorre el
// camino completo (controller -> guard -> servicio -> span de negocio ->
// PostgreSQL). Sin esto, cualquier afirmación sobre "la sobrecarga es
// aceptable" sería una suposición.
//
// No es una prueba de carga de producción: es una comparación A/B del MISMO
// endpoint y la MISMA máquina, cambiando solo la configuración de telemetría.
// Lo que vale es la diferencia relativa, no los números absolutos.
//
// Uso:
//   node scripts/bench-telemetry.mjs [--requests 300] [--concurrency 10]
//
// Variables: API_BASE_URL (por defecto http://localhost:3000)
// =========================================================================
const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3000';

const args = process.argv.slice(2);
const readArg = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? Number(args[index + 1]) : fallback;
};

const TOTAL = readArg('requests', 300);
const CONCURRENCY = readArg('concurrency', 10);
// Peticiones descartadas al principio: la primera decena paga la apertura del
// pool de PostgreSQL y el calentamiento del JIT, y contaminaría los percentiles.
const WARMUP = readArg('warmup', 30);

/** Una petición de negocio real: login que falla (no crea datos, toca la base). */
async function oneRequest() {
  const startedAt = performance.now();
  await fetch(`${API_BASE_URL}/iam/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'bench@example.invalid',
      password: 'credencial-invalida',
    }),
  }).then((response) => response.text());
  return performance.now() - startedAt;
}

/** Percentil por interpolación de rango más cercano sobre la muestra ordenada. */
function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const index = Math.min(
    sorted.length - 1,
    Math.ceil((p / 100) * sorted.length) - 1,
  );
  return sorted[Math.max(0, index)];
}

async function run() {
  for (let i = 0; i < WARMUP; i += 1) await oneRequest();

  const samples = [];
  const startedAt = performance.now();

  // `CONCURRENCY` cadenas de peticiones en paralelo, cada una secuencial: mantiene
  // la concurrencia constante en vez de disparar TOTAL peticiones a la vez.
  const lanes = Array.from({ length: CONCURRENCY }, async () => {
    while (samples.length < TOTAL) {
      samples.push(await oneRequest());
    }
  });
  await Promise.all(lanes);

  const elapsedSeconds = (performance.now() - startedAt) / 1000;
  const sorted = [...samples].sort((a, b) => a - b);
  const mean = samples.reduce((acc, value) => acc + value, 0) / samples.length;

  const report = {
    requests: samples.length,
    concurrency: CONCURRENCY,
    throughput_rps: Number((samples.length / elapsedSeconds).toFixed(1)),
    mean_ms: Number(mean.toFixed(2)),
    p50_ms: Number(percentile(sorted, 50).toFixed(2)),
    p95_ms: Number(percentile(sorted, 95).toFixed(2)),
    p99_ms: Number(percentile(sorted, 99).toFixed(2)),
    max_ms: Number(sorted[sorted.length - 1].toFixed(2)),
  };

  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

run().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : error}\n`);
  process.exitCode = 1;
});
