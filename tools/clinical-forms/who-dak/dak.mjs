/**
 * Campos armados desde los diccionarios de datos de los Digital Adaptation
 * Kits (DAK) de la OMS congelados en `dak-snapshot.json`.
 *
 * Las DAK están en inglés: cada opción lleva una **traducción propia** que se
 * pasa explícita por id de elemento de datos (`PNC.B4a.DE.3`, …). Si falta la
 * traducción de una opción, falla: no se completa nada por las dudas. Las
 * opciones «Other (specify)» de la DAK no se traducen como opción: se ofrecen
 * como «Otro» con texto libre (`allowOther`).
 *
 * Licencia de las DAK: CC BY-NC-SA 3.0 IGO. Toda adaptación debe llevar el
 * descargo de la OMS («Esta adaptación no fue creada por la OMS…»), que va en
 * la ayuda de cada campo.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { una, varias } from '../lib.mjs';

const SNAP = JSON.parse(
  readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), 'dak-snapshot.json'),
    'utf8',
  ),
);

const OTRO = /^other\b/i;

export const DESCARGO_OMS =
  'Esta adaptación no fue creada por la Organización Mundial de la Salud (OMS); la OMS no es responsable de su contenido ni de su exactitud.';

/** La cita corta de una DAK para la ayuda de un campo. */
export function citaDak(clave) {
  const d = SNAP[clave];
  if (d === undefined)
    throw new Error(`DAK ${clave} no está en la instantánea`);
  return `${d.title} (OMS, CC BY-NC-SA 3.0 IGO; ${d.repository}, commit ${d.commit.slice(0, 7)})`;
}

/**
 * Un campo de elección desde un elemento de datos de una DAK.
 *
 * `multiple` fuerza varias respuestas cuando la DAK marca «Select one» en
 * una lista de síntomas concurrentes (se documenta en `extra`).
 */
export function dak(
  clave,
  id,
  code,
  { nombre, traduccion, multiple, extra, ...resto },
) {
  const d = SNAP[clave];
  const e = d?.elements[id];
  if (e === undefined)
    throw new Error(`${clave} ${id}: no está en la instantánea`);
  const conOtro = e.options.some((o) => OTRO.test(o.label));
  const options = e.options
    .filter((o) => !OTRO.test(o.label))
    .map((o) => {
      const t = traduccion[o.id];
      if (t === undefined)
        throw new Error(`${id} ${o.id} «${o.label}»: sin traducción`);
      return t;
    });
  const sobran = Object.keys(traduccion).filter(
    (k) => !e.options.some((o) => o.id === k),
  );
  if (sobran.length > 0)
    throw new Error(`${id}: traducciones que no son opciones: ${sobran}`);
  const ayuda = [
    extra,
    `Fuente: elemento ${id} «${e.label}» de la ${citaDak(clave)}.`,
    'Traducción propia del inglés, no oficial.',
    DESCARGO_OMS,
  ]
    .filter(Boolean)
    .join(' ');
  const varios = multiple ?? e.multiple;
  const crear = varios ? varias : una;
  return crear(code, nombre, options, {
    ...resto,
    ...(conOtro ? { otro: true } : {}),
    ayuda,
  });
}
