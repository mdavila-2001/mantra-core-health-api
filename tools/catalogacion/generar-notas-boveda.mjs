#!/usr/bin/env node
// Extrae de la bóveda SALUD SOLO el texto propio de cada tabla: lo que la herramienta generadora de
// la bóveda NO repite. El resultado es un dataset versionado que el seeder del catálogo lee sin
// necesitar la bóveda en tiempo de ejecución.
//
//   node tools/catalogacion/generar-notas-boveda.mjs [--vault DIR] [--check]
//
// Qué entra y qué no
//  - Entra el texto de «Negocio», «Ejemplo concreto» y «Por qué no debe eliminarse» que no es plantilla
//    (misma regla que `tools/catalog/lib/vault-notes.mjs`: un texto es plantilla si, quitado lo que
//    varía, se repite en 3 notas o más, o cumple un esqueleto conocido del generador).
//  - Lo que es plantilla NO se copia: se cuenta (`plantillas`) para que la brecha sea visible.
//  - «Sistema» no se copia: son hechos de estructura que el seeder recalcula del inventario.
//  - Los conjuntos de índices no son tablas y se omiten.
// Procedencia: ruta de la nota y SHA-256 de su contenido; huella global de la fuente.
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';

import {
  UMBRAL_PLANTILLA,
  indicePlantillas,
  limpiar,
  parseNotaDeEntidad,
} from '../catalog/lib/vault-notes.mjs';

const { values } = parseArgs({
  options: {
    vault: { type: 'string' },
    check: { type: 'boolean', default: false },
  },
});
const raiz =
  values.vault ??
  process.env.SALUD_VAULT ??
  [
    join(process.cwd(), '..', 'mantra_core_technologies_health_docs', 'SALUD'),
  ].find(existsSync);
if (!raiz || !existsSync(join(raiz, 'Entidades'))) {
  console.error(
    'No encuentro la bóveda. Pasá --vault o SALUD_VAULT con la carpeta SALUD.',
  );
  process.exit(2);
}

const salida = join(
  process.cwd(),
  'src/common/seed/catalog/data/vault-table-notes.json',
);
const archivos = readdirSync(join(raiz, 'Entidades'))
  .filter((a) => a.endsWith('.md'))
  .sort();
const notas = [];
const huellas = [];
for (const archivo of archivos) {
  const texto = readFileSync(
    join(raiz, 'Entidades', archivo),
    'utf8',
  ).replaceAll('\r\n', '\n');
  const nota = parseNotaDeEntidad(texto, archivo);
  if (!nota) continue;
  huellas.push(`${archivo}\n${texto}`);
  notas.push({ nota, sha: createHash('sha256').update(texto).digest('hex') });
}
const plantillas = indicePlantillas(notas.map((n) => n.nota));
const MAX = 4000;
const recortar = (t) => (t.length <= MAX ? t : `${t.slice(0, MAX - 1)}…`);

const tablas = {};
const resumen = {
  notasDeEntidad: notas.length,
  conjuntosDeIndices: 0,
  tablasConTextoPropio: 0,
  camposPropios: 0,
  camposPlantilla: 0,
};
for (const { nota, sha } of notas) {
  if (nota.esConjuntoDeIndices) {
    resumen.conjuntosDeIndices += 1;
    continue;
  }
  const campos = {};
  for (const [campo, clave] of [
    ['business', 'business'],
    ['example', 'example'],
    ['existence', 'existence'],
  ]) {
    if (nota.raw[campo] === undefined) continue;
    if (plantillas.esPlantilla(nota, campo)) resumen.camposPlantilla += 1;
    else {
      campos[clave] = recortar(limpiar(nota.raw[campo]));
      resumen.camposPropios += 1;
    }
  }
  if (Object.keys(campos).length === 0) continue;
  resumen.tablasConTextoPropio += 1;
  tablas[`${nota.schema}.${nota.table}`] = {
    reference: `SALUD/Entidades/${nota.archivo}`,
    sha256: sha,
    ...campos,
  };
}
const dataset = {
  generatedBy: 'tools/catalogacion/generar-notas-boveda.mjs',
  source: {
    vault: 'SALUD/Entidades',
    sha256: createHash('sha256').update(huellas.join('\n---\n')).digest('hex'),
    templateThreshold: UMBRAL_PLANTILLA,
    ...resumen,
  },
  tables: Object.fromEntries(
    Object.entries(tablas).sort(([a], [b]) => a.localeCompare(b)),
  ),
};
const json = `${JSON.stringify(dataset, null, 2)}\n`;
if (values.check) {
  const actual = existsSync(salida) ? readFileSync(salida, 'utf8') : '';
  if (actual !== json) {
    console.error(
      'vault-table-notes.json está desactualizado: node tools/catalogacion/generar-notas-boveda.mjs',
    );
    process.exit(1);
  }
  console.log('vault-table-notes.json al día');
} else {
  writeFileSync(salida, json);
  console.log(JSON.stringify(dataset.source));
}
