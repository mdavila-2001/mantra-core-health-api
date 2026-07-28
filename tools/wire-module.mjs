/**
 * Cablea un módulo de dominio en los dos registros centrales:
 *  - `src/common/seed/module-concepts.ts` (siembra de conceptos)
 *  - `test/smoke/registry.ts` (batería de smoke)
 *
 * Descubre los nombres de export reales (`*_CONCEPT_SEEDS`, `*_SMOKE`) leyendo los
 * archivos del módulo, de modo que tolera variaciones de nombre. Es idempotente:
 * si el módulo ya está cableado, no duplica.
 *
 * Uso: node tools/wire-module.mjs <modulo>   (p. ej. directory)
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const mod = process.argv[2];
if (!mod) {
  console.error('uso: node tools/wire-module.mjs <modulo>');
  process.exit(1);
}

const conceptFile = `src/modules/${mod}/${mod}.concepts.ts`;
const smokeFile = `test/smoke/modules/${mod}.smoke.ts`;

function findExport(file, re) {
  if (!existsSync(file)) return null;
  const m = readFileSync(file, 'utf8').match(re);
  return m ? m[1] : null;
}

const conceptExport =
  findExport(conceptFile, /export const \{\s*seeds:\s*(\w+)/) ??
  findExport(conceptFile, /export const (\w+_CONCEPT_SEEDS)/);
const smokeExport = findExport(smokeFile, /export const (\w+_SMOKE)\b/);

function wire(registryPath, importLine, spreadLine, anchorSpread) {
  let src = readFileSync(registryPath, 'utf8');
  if (src.split('\n').some((l) => l.trim() === importLine.trim())) {
    console.log(`  ya cableado en ${registryPath}`);
    return;
  }
  // Inserta el import tras el último import existente (o al inicio del bloque de comentarios de registro).
  const lines = src.split('\n');
  let lastImport = -1;
  for (let i = 0; i < lines.length; i++)
    if (lines[i].startsWith('import ')) lastImport = i;
  lines.splice(lastImport + 1, 0, importLine);
  src = lines.join('\n');
  // Inserta el spread antes del cierre `];` del arreglo agregador.
  src = src.replace(anchorSpread, `${spreadLine}\n${anchorSpread}`);
  writeFileSync(registryPath, src);
  console.log(`  cableado en ${registryPath}`);
}

console.log(
  `Cableando módulo '${mod}' (conceptos=${conceptExport}, smoke=${smokeExport})`,
);

if (conceptExport) {
  wire(
    'src/common/seed/module-concepts.ts',
    `import { ${conceptExport} } from '../../modules/${mod}/${mod}.concepts';`,
    `  ...${conceptExport},`,
    '];',
  );
} else {
  console.warn(
    `  AVISO: no se encontró export *_CONCEPT_SEEDS en ${conceptFile}`,
  );
}

if (smokeExport) {
  wire(
    'test/smoke/registry.ts',
    `import { ${smokeExport} } from './modules/${mod}.smoke';`,
    `  ...${smokeExport},`,
    '];',
  );
} else {
  console.warn(`  AVISO: no se encontró export *_SMOKE en ${smokeFile}`);
}
