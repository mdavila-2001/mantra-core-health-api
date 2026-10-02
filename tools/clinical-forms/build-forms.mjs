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
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import prettier from 'prettier';

import { ESPECIFICAS_1 } from './especificas-1.mjs';
import { ESPECIFICAS_2 } from './especificas-2.mjs';
import { ESPECIFICAS_3 } from './especificas-3.mjs';
import { CLINICAS } from './fichas-clinicas.mjs';
import { FUENTES } from './fuentes.mjs';
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
const ESPECIFICAS = [...ESPECIFICAS_1, ...ESPECIFICAS_2, ...ESPECIFICAS_3];
const FECHA_ESPECIFICAS = '2026-10-02';

/**
 * Qué clase de ficha es cada una, que es como se ofrece en pantalla:
 * - `BASE`: la consulta inicial de la especialidad;
 * - `SPECIFIC`: el control o la evaluación estándar de una condición;
 * - `GENERAL`: las transversales, de toda consulta.
 * Las fichas del catálogo original que ya eran de una condición —el riesgo
 * cardiovascular, las curvas de crecimiento, el control prenatal, el
 * odontograma— son específicas, no base. La consulta ginecológica es la base
 * de ginecología aunque se haya escrito junto con las específicas.
 */
const YA_ERAN_ESPECIFICAS = new Set([
  'CARDIO_RIESGO_CV_OMS',
  'PEDIA_CURVAS_CRECIMIENTO_OMS',
  'GINOBS_CONTROL_PRENATAL',
  'ODONTO_ODONTOGRAMA_OMS',
]);
const BASES_NUEVAS = new Set(['GINOBS_CONSULTA_GINECOLOGICA']);

/**
 * El nombre de cada ficha base: la especialidad primero y qué consulta es,
 * todas con la misma forma para que en la lista se reconozcan de un vistazo.
 */
const NOMBRE_DE_BASE = {
  ANEST_VALORACION_PREANESTESICA: 'valoración preanestésica',
  BIOQ_INFORME_BASE: 'informe general de laboratorio',
  EMERG_ATENCION_BASE: 'atención inicial en emergencia',
  ENFER_VALORACION_BASE: 'valoración de enfermería',
  GINOBS_CONSULTA_GINECOLOGICA: 'consulta ginecológica',
  MEDINT_UCI_EVALUACION: 'evaluación de ingreso',
  OBST_CONTROL_BASE: 'control obstétrico',
  ODONTO_ANAMNESIS: 'anamnesis y consulta inicial',
  PATOL_INFORME_BASE: 'informe general de anatomía patológica',
  PEDIA_CONTROL_NINO_SANO: 'control de niño sano',
  RADIO_INFORME_BASE: 'informe general de estudio por imágenes',
};
function nombreDe(ficha, clase) {
  if (clase !== 'BASE') return ficha.name;
  return `${ficha.specialty.display} — ${NOMBRE_DE_BASE[ficha.code] ?? 'consulta inicial'} (ficha base)`;
}

function claseDe(code) {
  if (code.startsWith('TRANSV_')) return 'GENERAL';
  if (YA_ERAN_ESPECIFICAS.has(code)) return 'SPECIFIC';
  if (BASES_NUEVAS.has(code)) return 'BASE';
  return ESPECIFICAS.some((e) => e.code === code) ? 'SPECIFIC' : 'BASE';
}

/** El nombre de archivo de una ficha específica: su código en kebab-case. */
function archivoDe(code) {
  return `${code.toLowerCase().replaceAll('_', '-')}.json`;
}

/**
 * Crea el `.json` de cada ficha específica que todavía no existe, con la
 * especialidad de una ficha base de su carpeta y la procedencia de su fuente.
 * Los campos los llena después el recorrido general, como a cualquier otra.
 */
async function crearEspecificas(soloComprobar) {
  let creadas = 0;
  for (const e of ESPECIFICAS) {
    const carpeta = join(DATOS, e.carpeta);
    const archivo = join(carpeta, archivoDe(e.code));
    if (existsSync(archivo)) continue;
    const base = readdirSync(carpeta)
      .filter((n) => n.endsWith('.json'))
      .map((n) => JSON.parse(readFileSync(join(carpeta, n), 'utf8')))
      .find((ficha) => ficha.specialty !== undefined);
    if (base === undefined)
      throw new Error(`${e.code}: la carpeta ${e.carpeta} no tiene ficha.`);
    const fuente = FUENTES[e.fuente];
    if (fuente === undefined)
      throw new Error(`${e.code}: fuente desconocida ${e.fuente}.`);
    creadas += 1;
    if (soloComprobar) {
      console.error(`falta: ${relative(RAIZ, archivo)}`);
      continue;
    }
    const nueva = {
      code: e.code,
      name: e.nombre,
      specialty: base.specialty,
      version: 1,
      provenance: { ...fuente, retrievedAt: FECHA_ESPECIFICAS, note: e.nota },
      fields: [],
    };
    writeFileSync(archivo, `${JSON.stringify(nueva, null, 2)}\n`);
  }
  return creadas;
}

/**
 * El barrel de las específicas: `catalog.ts` importa cada `.json` por nombre
 * —es lo que hace que `tsc` los valide y los copie a `dist/`—, y escribir a
 * mano ciento y pico de imports es la forma segura de olvidarse uno.
 */
async function escribirBarrel(soloComprobar) {
  const lineas = [
    '/* GENERADO por tools/clinical-forms/build-forms.mjs — no editar a mano. */',
    '/* Las fichas específicas por condición, una por archivo. */',
    '',
    ...ESPECIFICAS.map(
      (e, n) =>
        `import f${n} from './${e.carpeta}/${archivoDe(e.code).replace('.json', '')}.json';`,
    ),
    '',
    `export const SPECIFIC_FORMS = [${ESPECIFICAS.map((_, n) => `f${n}`).join(', ')}];`,
    '',
  ];
  const destino = join(DATOS, 'specific-forms.generated.ts');
  const texto = await prettier.format(lineas.join('\n'), {
    ...(await prettier.resolveConfig(destino)),
    filepath: destino,
  });
  const previo = existsSync(destino) ? readFileSync(destino, 'utf8') : '';
  if (texto === previo) return 0;
  if (soloComprobar)
    console.error(`desactualizado: ${relative(RAIZ, destino)}`);
  else writeFileSync(destino, texto);
  return 1;
}

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
  const especifica = ESPECIFICAS.find((e) => e.code === ficha.code);
  if (especifica !== undefined) return especifica.campos().flat(Infinity);
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
  // Las específicas nacen en v2: su nota es la propia, sin el agregado.
  const especifica = ESPECIFICAS.find((e) => e.code === ficha.code);
  if (especifica !== undefined) return especifica.nota;
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
  const creadas = await crearEspecificas(soloComprobar);
  const barrel = await escribirBarrel(soloComprobar);
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

    const esEspecifica = ESPECIFICAS.some((e) => e.code === ficha.code);
    const nueva = {
      ...ficha,
      kind: claseDe(ficha.code),
      name: nombreDe(ficha, claseDe(ficha.code)),
      version: esEspecifica
        ? ficha.version
        : Math.max(ficha.version, VERSION_V2[ficha.code] ?? 2),
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

  const sinArchivo = [
    ...Object.keys(CONSTRUCTORES),
    ...ESPECIFICAS.map((e) => e.code),
  ].filter((code) => !vistos.has(code));
  if (sinArchivo.length > 0)
    throw new Error(`Constructores sin .json: ${sinArchivo.join(', ')}`);

  const porClase = archivos.reduce((cuenta, a) => {
    const k = JSON.parse(readFileSync(a, 'utf8')).kind ?? '?';
    return { ...cuenta, [k]: (cuenta[k] ?? 0) + 1 };
  }, {});
  const total = cambiadas + creadas + barrel;
  console.log(
    `${archivos.length} fichas (${JSON.stringify(porClase)}) · ${totalCampos} campos · ` +
      `${total} ${soloComprobar ? 'desactualizadas' : 'escritas'}`,
  );
  if (soloComprobar && total > 0) process.exit(1);
}

await main();
