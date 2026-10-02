#!/usr/bin/env node
/**
 * Escribe la v2 de las fichas clínicas estándar en
 * `src/common/seed/data/clinical-forms/<especialidad>/*.json`.
 *
 *   node tools/clinical-forms/build-forms.mjs          escribe
 *   node tools/clinical-forms/build-forms.mjs --check  falla si algo cambiaría
 *
 * Los `.json` siguen siendo la fuente que lee `catalog.ts`; este script es la
 * forma de escribirlos sin copiar a mano los mismos bloques en 43 archivos.
 * Conserva de cada `.json` lo que no es contenido —código, nombre,
 * especialidad y procedencia— y reemplaza `fields`.
 *
 * Dos garantías que hace cumplir al escribir:
 * - Un código que ya existía **no cambia de tipo**: la siembra reconcilia por
 *   código y las capturas hechas leen la columna `value_*` de ese tipo. Lo que
 *   cambia de naturaleza entra con código nuevo.
 * - Toda condición `showWhen` apunta a un campo anterior y a un valor que ese
 *   campo puede tomar (`validarFicha`).
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import prettier from 'prettier';

import { CLINICAS } from './fichas-clinicas.mjs';
import {
  ODONTOGRAMA_AJUSTES,
  ODONTOGRAMA_HIJOS,
  OTRAS,
} from './fichas-otras.mjs';
import { PROCEDIMIENTO } from './fichas-procedimiento.mjs';
import { validarFicha } from './lib.mjs';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DATOS = join(RAIZ, 'src', 'common', 'seed', 'data', 'clinical-forms');
const FECHA_V2 = '2026-10-02';
const MARCA_V2 = `v2 (${FECHA_V2})`;
const CONSTRUCTORES = { ...CLINICAS, ...PROCEDIMIENTO, ...OTRAS };

/** Instrumentos que, si aparecen en una ficha, se citan en su nota. */
const INSTRUMENTOS = [
  ['AUDIT-C', 'AUDIT-C (OMS)'],
  ['SRQ-20', 'SRQ-20 (OMS)'],
  ['CURB-65', 'CURB-65 (British Thoracic Society)'],
  ['NYHA', 'clase funcional NYHA'],
  ['mMRC', 'escala de disnea mMRC'],
  ['GINA', 'control del asma GINA'],
  ['Centor', 'criterios de Centor/McIsaac'],
  ['Glasgow', 'escala de coma de Glasgow'],
  ['Cincinnati', 'escala de Cincinnati'],
  ['SNOOP', 'banderas rojas SNOOP'],
  ['ASA', 'clasificación ASA'],
  ['Mallampati', 'Mallampati'],
  ['ECOG', 'ECOG'],
  ['Bristol', 'escala de Bristol'],
  ['Fitzpatrick', 'fototipos de Fitzpatrick'],
  ['Katz', 'índice de Katz'],
  ['Lawton', 'escala de Lawton'],
  ['Fried', 'fenotipo de fragilidad de Fried'],
  ['AIEPI', 'AIEPI (OPS/OMS)'],
  ['Signos de alarma (OPS/OMS)', 'guía de dengue OPS/OMS 2016'],
  ['KDIGO', 'KDIGO'],
  ['Levine', 'escala de Levine'],
  ['Framingham', 'criterios de Framingham'],
  ['Alvarado', 'escala de Alvarado'],
  ['qSOFA', 'qSOFA (Sepsis-3)'],
  ['RASS', 'RASS'],
  ['Barthel', 'índice de Barthel'],
  ['ARIA', 'clasificación ARIA'],
  ['TI-RADS', 'categorías TI-RADS'],
  ['BI-RADS', 'categorías BI-RADS'],
  ['Berlín', 'definición de Berlín del SDRA'],
  ['CTCAE', 'CTCAE (NCI)'],
  ['Gustilo', 'clasificación de Gustilo'],
  ['Ottawa', 'reglas de Ottawa'],
  ['Patil', 'distancia tiromentoniana de Patil'],
  ['Snellen', 'optotipos de Snellen'],
  ['Smilkstein', 'APGAR familiar de Smilkstein'],
  ['MRC', 'escala de fuerza MRC'],
  ['ABCDE', 'regla ABCDE del melanoma'],
  ['Dix-Hallpike', 'maniobra de Dix-Hallpike'],
  ['Beers/STOPP', 'criterios de Beers/STOPP'],
];

function camposDe(ficha) {
  if (ficha.code === 'ODONTO_ODONTOGRAMA_OMS') {
    // Se parte de los campos de la v2 sin los hijos que agrega este script,
    // para que correrlo dos veces no los duplique.
    const hijos = new Set(
      Object.values(ODONTOGRAMA_HIJOS)
        .flat()
        .map((c) => c.code),
    );
    return ficha.fields
      .filter((c) => !hijos.has(c.code))
      .flatMap((c) => {
        const campo =
          ODONTOGRAMA_AJUSTES[c.code] === undefined
            ? c
            : { ...c, options: ODONTOGRAMA_AJUSTES[c.code] };
        const deEste = (ODONTOGRAMA_HIJOS[c.code] ?? []).map((h) => ({
          ...h,
          showWhen: { field: c.code, equals: true },
        }));
        return [campo, ...deEste];
      });
  }
  const construir = CONSTRUCTORES[ficha.code];
  if (construir === undefined)
    throw new Error(`Ficha ${ficha.code}: no tiene constructor v2.`);
  return construir().flat(Infinity);
}

function nota(ficha, campos) {
  const previa = (ficha.provenance.note ?? '').split(` ${MARCA_V2}:`)[0].trim();
  const texto = campos
    .map(
      (c) => `${c.name} ${(c.options ?? []).join(' ')} ${c.description ?? ''}`,
    )
    .join(' ');
  const citados = INSTRUMENTOS.filter(([clave]) => texto.includes(clave)).map(
    ([, cita]) => cita,
  );
  const agregado =
    `${MARCA_V2}: reorganizada en secciones (motivo, antecedentes, examen, diagnóstico presuntivo, plan); ` +
    'las clasificaciones con categorías finitas pasan a lista cerrada; cada sí/no que tiene detalle pregunta «¿cuál?»; ' +
    'el diagnóstico presuntivo abre las observaciones que ese cuadro exige registrar' +
    (citados.length > 0
      ? `. Instrumentos de uso libre incorporados: ${citados.join(', ')}.`
      : '.');
  return previa === '' ? agregado : `${previa} ${agregado}`;
}

const VERSION_V2 = { ODONTO_ODONTOGRAMA_OMS: 3 };

async function main() {
  const soloComprobar = process.argv.includes('--check');
  const archivos = readdirSync(DATOS, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .flatMap((e) =>
      readdirSync(join(DATOS, e.name))
        .filter((n) => n.endsWith('.json'))
        .map((n) => join(DATOS, e.name, n)),
    );

  let cambiadas = 0;
  let totalCampos = 0;
  const vistos = new Set();
  for (const archivo of archivos.sort()) {
    const ficha = JSON.parse(readFileSync(archivo, 'utf8'));
    vistos.add(ficha.code);
    const campos = camposDe(ficha);

    const tipoPrevio = new Map(ficha.fields.map((c) => [c.code, c.dataType]));
    for (const c of campos) {
      const previo = tipoPrevio.get(c.code);
      if (previo !== undefined && previo !== c.dataType) {
        throw new Error(
          `Ficha ${ficha.code}: «${c.code}» era ${previo} y pasaría a ${c.dataType}. Usá un código nuevo.`,
        );
      }
    }

    const nueva = {
      ...ficha,
      version: Math.max(ficha.version, VERSION_V2[ficha.code] ?? 2),
      provenance: { ...ficha.provenance, note: nota(ficha, campos) },
      fields: campos,
    };
    validarFicha(nueva);
    totalCampos += campos.length;

    // Con el mismo formato que exige el repositorio, para que `--check` y
    // prettier no se contradigan.
    const texto = await prettier.format(JSON.stringify(nueva), {
      ...(await prettier.resolveConfig(archivo)),
      filepath: archivo,
    });
    if (texto !== readFileSync(archivo, 'utf8')) {
      cambiadas += 1;
      if (soloComprobar)
        console.error(`desactualizada: ${relative(RAIZ, archivo)}`);
      else writeFileSync(archivo, texto);
    }
  }

  const sinArchivo = Object.keys(CONSTRUCTORES).filter(
    (code) => !vistos.has(code),
  );
  if (sinArchivo.length > 0)
    throw new Error(`Constructores sin .json: ${sinArchivo.join(', ')}`);

  console.log(
    `${archivos.length} fichas · ${totalCampos} campos · ${cambiadas} ${soloComprobar ? 'desactualizadas' : 'escritas'}`,
  );
  if (soloComprobar && cambiadas > 0) process.exit(1);
}

await main();
