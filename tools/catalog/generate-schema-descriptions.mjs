#!/usr/bin/env node
// Genera `src/modules/data_catalog/domain/schema-descriptions.generated.ts`: la
// explicación de cada schema (módulo) que el catálogo muestra en «Esquemas».
//
//   node tools/catalog/generate-schema-descriptions.mjs [--vault DIR] [--check]
//
// Fuente: `SALUD/Módulos/M*.md`. El archivo generado no se edita a mano; lleva la
// huella de la fuente y `--check` falla (salida 1) si está desactualizado.
//
// Un módulo sin «Propósito de negocio» queda con `business: null`: la pantalla dice
// que la bóveda no lo describe, no se inventa uno.
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';

import { explicacionDeSistema, parseNotaDeModulo } from './lib/module-notes.mjs';

const { values } = parseArgs({
  options: { vault: { type: 'string' }, check: { type: 'boolean', default: false } },
});

const raiz =
  values.vault ??
  process.env.SALUD_VAULT ??
  [join(process.cwd(), '..', 'mantra_core_technologies_health_docs', 'SALUD'), join(process.cwd(), '..', 'Mantra Core Health Vault', 'SALUD')].find(existsSync);
if (!raiz || !existsSync(join(raiz, 'Módulos'))) {
  console.error('No encuentro la bóveda. Pasá --vault o SALUD_VAULT con la carpeta SALUD.');
  process.exit(2);
}

const archivos = readdirSync(join(raiz, 'Módulos')).filter((a) => /^M\d+ .*\.md$/.test(a)).sort();
const textos = archivos.map((a) => [a, readFileSync(join(raiz, 'Módulos', a), 'utf8').replaceAll('\r\n', '\n')]);
const modulos = textos.map(([a, t]) => parseNotaDeModulo(t, a)).filter(Boolean);
const sinFormato = textos.map(([a]) => a).filter((a) => !modulos.some((m) => m.archivo === a));
if (sinFormato.length > 0) {
  console.warn(`Sin descripción (la nota no tiene el formato estándar de módulo): ${sinFormato.join(', ')}`);
}
const huella = createHash('sha256').update(textos.map(([a, t]) => `${a}\n${t}`).join('\n---\n')).digest('hex');

const entradas = {};
for (const m of modulos.sort((a, b) => a.schema.localeCompare(b.schema))) {
  if (entradas[m.schema]) {
    console.error(`Dos módulos declaran el schema «${m.schema}»: ${entradas[m.schema].source} y ${m.archivo}`);
    process.exit(1);
  }
  entradas[m.schema] = {
    moduleNumber: m.moduleNumber,
    moduleCode: m.moduleCode,
    title: m.title,
    domain: m.domain,
    business: m.business,
    system: explicacionDeSistema(m),
    source: `SALUD/Módulos/${m.archivo}`,
  };
}

const cuerpo = `// GENERADO por tools/catalog/generate-schema-descriptions.mjs — no editar a mano.
// Fuente: SALUD/Módulos/M*.md (${modulos.length} módulos), sha256 ${huella}.
// Regenerar: yarn catalog:schemas (y yarn catalog:schemas --check para verificarlo).
import type { SchemaDescription } from './schema-description';

/** La explicación de cada schema, por nombre de schema. */
export const SCHEMA_DESCRIPTIONS: Readonly<Record<string, SchemaDescription>> = ${JSON.stringify(entradas, null, 2)};
`;

let salida = cuerpo;
try {
  const prettier = await import('prettier');
  const config = (await prettier.resolveConfig(join(process.cwd(), 'src/modules/data_catalog/domain/x.ts'))) ?? {};
  salida = await prettier.format(cuerpo, { ...config, parser: 'typescript' });
} catch {
  console.warn('prettier no está disponible: el archivo se escribe sin formatear.');
}

const destino = join(process.cwd(), 'src/modules/data_catalog/domain/schema-descriptions.generated.ts');
if (values.check) {
  const actual = existsSync(destino) ? readFileSync(destino, 'utf8') : '';
  if (actual !== salida) {
    console.error('schema-descriptions.generated.ts está desactualizado: corré `yarn catalog:schemas`.');
    process.exit(1);
  }
  console.log(`schema-descriptions.generated.ts al día (${modulos.length} módulos).`);
} else {
  writeFileSync(destino, salida);
  console.log(`Escrito ${destino} (${modulos.length} módulos, ${Object.keys(entradas).length} schemas).`);
}
