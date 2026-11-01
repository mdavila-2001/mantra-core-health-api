/**
 * Genera `data/mutability.catalog.json` desde el modelo y el inventario.
 *
 *   npx tsx src/modules/system_ops/mutability/extractor/extract-cli.ts \
 *        --model ../mantra-core-health-model [--check]
 *
 * Con `--check` no escribe: sale con código 1 si el archivo escrito no coincide con lo que se
 * derivaría hoy (el catálogo quedó viejo respecto del modelo o del código).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { extractMutability } from './extract-model';

// Corre con tsx (CommonJS) y se compila a CommonJS: `__dirname` existe en los dos.
const here = __dirname;
const apiRoot = resolve(here, '../../../../..');
const args = process.argv.slice(2);
const flag = (name: string): string | undefined => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const modelRoot = resolve(
  flag('--model') ?? join(apiRoot, '..', 'mantra-core-health-model'),
);
const target = join(here, '..', 'data', 'mutability.catalog.json');

const catalog = extractMutability({ modelRoot, apiRoot });
const next = `${JSON.stringify(catalog, null, 1)}\n`;
if (args.includes('--check')) {
  let current = '';
  try {
    current = readFileSync(target, 'utf8');
  } catch {
    /* no existe */
  }
  if (current !== next) {
    console.error(
      'mutability.catalog.json no coincide con el modelo/código actuales',
    );
    process.exit(1);
  }
  console.log('mutability.catalog.json al día');
} else {
  writeFileSync(target, next);
  console.log(`escrito ${target} (${catalog.records.length} tablas)`);
}
