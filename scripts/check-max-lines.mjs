#!/usr/bin/env node
/**
 * Tamaño máximo de archivo en backend NestJS (ALOVIDA · reforma estructural ≤ 300 líneas).
 *
 * El techo oficial es TOPE (300) líneas y no se sube.
 * Los archivos heredados que superan 300 líneas quedan congelados en
 * `scripts/baselines/max-lines.json` con su tamaño actual (ratchet descendente).
 * Falla si:
 *   - un archivo que NO está en la lista supera TOPE (archivo nuevo o que cruzó el techo);
 *   - un archivo congelado crece por encima de su tamaño registrado.
 *
 * Exentos: *.spec.ts, *.test.ts, *.generated.ts, *.catalog.ts y *.data.ts.
 *
 * Uso: node scripts/check-max-lines.mjs [--lista] [--actualizar] [--congelar] [--tope 300]
 */
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const SRC_ROOT = join(REPO_ROOT, 'src');

const argv = process.argv.slice(2);
const TOPE = Number(argv.includes('--tope') ? argv[argv.indexOf('--tope') + 1] : 300);
const BASELINE_DIR = join(REPO_ROOT, 'scripts/baselines');
const EXCEPCIONES = join(BASELINE_DIR, 'max-lines.json');
const FECHA = /^\d{4}-\d{2}-\d{2}$/;

const hoy = process.env.CHECK_MAX_LINES_HOY ?? new Date().toISOString().slice(0, 10);
if (!FECHA.test(hoy)) {
  console.error(`✗ check-max-lines — CHECK_MAX_LINES_HOY no es una fecha AAAA-MM-DD: ${hoy}`);
  process.exit(2);
}

function walk(dir) {
  let res = [];
  for (const item of readdirSync(dir)) {
    const full = join(dir, item);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (item !== 'node_modules' && item !== 'dist' && item !== '.git') {
        res = res.concat(walk(full));
      }
    } else if (/\.ts$/.test(item)) {
      res.push(full);
    }
  }
  return res;
}

const medidas = new Map(
  walk(SRC_ROOT)
    .map((full) => {
      const ruta = relative(REPO_ROOT, full).replace(/\\/g, '/');
      const lineas = readFileSync(full, 'utf8').split('\n').length;
      return { ruta, lineas };
    })
    .filter(
      (f) =>
        !/\.(spec|test|generated|catalog|data)\.ts$/.test(f.ruta) &&
        !f.ruta.includes('/seed/'),
    )
    .map((f) => [f.ruta, f.lineas]),
);

const filas = [...medidas]
  .filter(([, lineas]) => lineas > TOPE)
  .map(([ruta, lineas]) => ({ ruta, lineas }))
  .sort((a, b) => b.lineas - a.lineas);

if (argv.includes('--lista')) {
  console.log(`${filas.length} archivos de API por encima de ${TOPE} líneas:\n`);
  for (const f of filas) console.log(`${String(f.lineas).padStart(6)}  ${f.ruta}`);
  process.exit(0);
}

if (argv.includes('--congelar') || argv.includes('--fijar-reforma')) {
  if (!existsSync(BASELINE_DIR)) mkdirSync(BASELINE_DIR, { recursive: true });
  const excepciones = {};
  for (const f of filas) {
    excepciones[f.ruta] = { lineas: f.lineas };
  }
  const nuevaLista = {
    $comentario: `Excepciones al techo de ${TOPE} líneas fijadas por reforma estructural en API (${hoy}). Ningún archivo nuevo puede superar ${TOPE} líneas. Los archivos congelados no pueden crecer ni 1 línea. Al tocarlos deben modularizarse (< 300).`,
    tarea: 'REFORMA-300',
    fijada: hoy,
    vence: '2027-04-01',
    excepciones,
  };
  writeFileSync(EXCEPCIONES, JSON.stringify(nuevaLista, null, 2) + '\n');
  console.log(`✓ Baseline API congelado con ${filas.length} archivos > ${TOPE} líneas. Ratchet activo.`);
  process.exit(0);
}

if (!existsSync(EXCEPCIONES)) {
  console.error(`✗ check-max-lines — falta ${relative(REPO_ROOT, EXCEPCIONES)}. Corré con --congelar`);
  process.exit(2);
}

const lista = JSON.parse(readFileSync(EXCEPCIONES, 'utf8'));
const sobrantes = Object.keys(lista.excepciones || {}).filter((ruta) => (medidas.get(ruta) ?? 0) <= TOPE);

if (argv.includes('--actualizar')) {
  let bajadas = 0;
  for (const ruta of sobrantes) delete lista.excepciones[ruta];
  for (const [ruta, e] of Object.entries(lista.excepciones || {})) {
    const actual = medidas.get(ruta);
    if (actual !== undefined && actual < e.lineas) {
      e.lineas = actual;
      bajadas++;
    }
  }
  writeFileSync(EXCEPCIONES, JSON.stringify(lista, null, 2) + '\n');
  console.log(`excepciones API: ${sobrantes.length} quitada(s), ${bajadas} bajada(s); ninguna agregada ni subida`);
  process.exit(0);
}

const nuevos = [];
const crecidos = [];
for (const f of filas) {
  const e = lista.excepciones?.[f.ruta];
  if (!e) nuevos.push(f);
  else if (f.lineas > e.lineas) crecidos.push({ ...f, techo: e.lineas });
}

for (const ruta of sobrantes) {
  console.warn(`  aviso: ${ruta} ya no supera ${TOPE} líneas; quitá su excepción con --actualizar`);
}

if (nuevos.length + crecidos.length > 0) {
  console.error(`\n✗ check-max-lines (API) — techo ${TOPE} líneas (hoy ${hoy})\n`);
  if (nuevos.length) {
    console.error(`  ${nuevos.length} archivo(s) por encima de ${TOPE} sin excepción:`);
    for (const f of nuevos) console.error(`    ${f.ruta}: ${f.lineas} líneas`);
  }
  if (crecidos.length) {
    console.error(`  ${crecidos.length} excepción(es) que crecieron por encima de su tamaño congelado:`);
    for (const f of crecidos) console.error(`    ${f.ruta}: ${f.lineas} líneas (congelado en ${f.techo})`);
  }
  console.error('\n  Partilo: extraé casos de uso, servicios auxiliares, DTOs atómicos o helpers. No subas el techo.\n');
  process.exit(1);
}

console.log(
  `✓ check-max-lines (API) — ${filas.length} archivo(s) por encima de ${TOPE} líneas, todos con excepción vigente y ninguno más grande que su tamaño congelado`,
);
