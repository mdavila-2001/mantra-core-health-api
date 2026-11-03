/**
 * Campos de escala armados desde la instantánea del CKM de openEHR
 * (`ckm-snapshot.json`), sin redactar ninguna categoría a mano.
 *
 * Regla de texto, en este orden:
 * 1. la traducción al castellano que trae el propio arquetipo del CKM, tal
 *    cual (se cita como «traducción del CKM»);
 * 2. si el arquetipo no la trae, una **traducción propia del inglés**, que se
 *    pasa explícita en `traduccion` por código `at` y se marca como tal en la
 *    ayuda del campo: no es una versión oficial ni validada de la escala;
 * 3. `corregir` sólo para un defecto comprobado del texto del CKM (se nombra
 *    en la ayuda).
 *
 * Si falta el texto de un valor, la construcción falla: no se completa nada
 * por las dudas.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { una, varias } from '../lib.mjs';

const SNAP = JSON.parse(
  readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), 'ckm-snapshot.json'),
    'utf8',
  ),
);

/** El arquetipo de la instantánea; falla si no fue extraído. */
export function arquetipo(id) {
  const a = SNAP.archetypes[id];
  if (a === undefined) throw new Error(`${id} no está en ckm-snapshot.json`);
  return { id, ...a };
}

/** El commit del espejo del CKM del que salió la instantánea. */
export const CKM_COMMIT = SNAP.commit;

/** La cita corta de un arquetipo, para la ayuda de un campo. */
export function citaCkm(id) {
  const a = arquetipo(id);
  const version = /ShareAlike (\d\.\d)/.exec(a.licence ?? '')?.[1];
  if (version === undefined) throw new Error(`${id}: licencia no reconocida`);
  return `arquetipo openEHR ${id} (rev. ${a.revision}, ${a.lifecycle === 'published' ? 'publicado' : 'en desarrollo'}; CC BY-SA ${version})`;
}

function elemento(a, at) {
  const e = a.elements.find((x) => x.id === at);
  if (e === undefined) throw new Error(`${a.id}: no tiene el elemento ${at}`);
  return e;
}

/**
 * El texto en castellano de un término y de dónde salió (`ckm` o `propia`).
 */
function texto(a, termino, { traduccion = {}, corregir = {} } = {}) {
  if (corregir[termino.code] !== undefined)
    return { t: corregir[termino.code], origen: 'corregida' };
  if (traduccion[termino.code] !== undefined)
    return { t: traduccion[termino.code], origen: 'propia' };
  if (termino.es?.text !== undefined)
    return { t: termino.es.text, origen: 'ckm' };
  throw new Error(
    `${a.id} ${termino.code ?? ''} «${termino.en?.text}»: sin traducción`,
  );
}

const ORIGEN = {
  ckm: (a) => `Texto de la traducción al castellano (${a.esLang}) del CKM.`,
  propia: () =>
    'Traducción propia del inglés del arquetipo: no es una versión oficial ni validada en castellano.',
  corregida: () =>
    'Texto del CKM con una corrección propia de un defecto comprobado (ver docs/seed-research/clinical-forms.md).',
};

function ayuda(a, origenes, fuenteClinica, extra) {
  const esLang = a.elements
    .flatMap((e) => [e, ...e.values])
    .find((x) => x.esLanguage)?.esLanguage;
  const notas = [...new Set(origenes)].map((o) => ORIGEN[o]({ esLang }));
  return [
    extra,
    `Fuente: ${fuenteClinica}, según el ${citaCkm(a.id)}.`,
    ...notas,
  ]
    .filter(Boolean)
    .join(' ');
}

/** El rótulo de un valor ordinal: «2 — Normal»; los no evaluables, «NE — …». */
function rotulo(v, t) {
  if (v.ordinal === undefined) return t;
  return `${v.ordinal === 99 ? 'NE' : v.ordinal} — ${t}`;
}

/**
 * Una escala de respuesta única desde un elemento ordinal o codificado del
 * arquetipo.
 *
 * `orden` permite reordenar los valores por código `at` cuando el arquetipo
 * los trae en un orden distinto del de la escala (se documenta).
 * `ordinales` permite fijar el puntaje de un valor cuando el del arquetipo es
 * un defecto comprobado contra la publicación original (se documenta).
 */
export function escala(
  idArquetipo,
  at,
  code,
  {
    nombre,
    fuente,
    traduccion,
    corregir,
    orden,
    ordinales = {},
    extra,
    ...resto
  },
) {
  const a = arquetipo(idArquetipo);
  const e = elemento(a, at);
  const valores =
    orden === undefined
      ? e.values
      : orden.map((c) => {
          const v = e.values.find((x) => x.code === c);
          if (v === undefined)
            throw new Error(`${a.id}: ${c} no es valor de ${at}`);
          return v;
        });
  const origenes = [];
  const options = valores.map((v) => {
    const r = texto(a, v, { traduccion, corregir });
    origenes.push(r.origen);
    const ordinal = ordinales[v.code] ?? v.ordinal;
    return rotulo({ ...v, ordinal }, r.t);
  });
  const n = nombre ?? texto(a, { ...e, code: at }, { traduccion }).t;
  return una(code, n, options, {
    ...resto,
    ayuda: ayuda(a, origenes, fuente, extra),
  });
}

/**
 * Los elementos sí/no de un arquetipo (ordinal 0 = no, n = sí) como una sola
 * lista de varias respuestas: «Infarto de miocardio (1 punto)».
 */
export function factores(
  idArquetipo,
  ats,
  code,
  { nombre, fuente, traduccion, criterio = {}, ninguno, extra, ...resto },
) {
  const a = arquetipo(idArquetipo);
  const origenes = [];
  const options = ats.map((at) => {
    const e = elemento(a, at);
    const si = e.values.find((v) => v.ordinal > 0);
    const r = texto(a, { ...e, code: at }, { traduccion });
    origenes.push(r.origen);
    const puntos = si.ordinal === 1 ? '1 punto' : `${si.ordinal} puntos`;
    if (criterio[at] !== undefined) origenes.push('propia');
    const c = criterio[at] === undefined ? '' : `: ${criterio[at]}`;
    return `${r.t}${c} (${puntos})`;
  });
  return varias(code, nombre, [...options, ...(ninguno ? [ninguno] : [])], {
    ...resto,
    ayuda: ayuda(a, origenes, fuente, extra),
  });
}

/**
 * Un elemento ordinal cuyos valores pueden coexistir (p. ej. los grupos de
 * fármacos del índice de Downton) como lista de varias respuestas, con el
 * puntaje de cada uno en el rótulo.
 */
export function seleccion(
  idArquetipo,
  at,
  code,
  { nombre, fuente, traduccion, extra, ...resto },
) {
  const a = arquetipo(idArquetipo);
  const e = elemento(a, at);
  const origenes = [];
  const options = e.values.map((v) => {
    const r = texto(a, v, { traduccion });
    origenes.push(r.origen);
    return `${r.t} (${v.ordinal === 1 ? '1 punto' : `${v.ordinal} puntos`})`;
  });
  return varias(code, nombre, options, {
    ...resto,
    ayuda: ayuda(a, origenes, fuente, extra),
  });
}
