/**
 * Lector mínimo de arquetipos openEHR en ADL 1.4, el formato del espejo del
 * CKM internacional (https://github.com/openEHR/CKM-mirror).
 *
 * No es un parser ADL completo: saca lo que una ficha necesita de un
 * arquetipo de escala o de evaluación —sus elementos, los valores ordinales o
 * codificados de cada uno y el texto de cada término en cada idioma— y los
 * metadatos que dicen de quién es el contenido (licencia, copyright,
 * reconocimientos de propiedad intelectual). Lo que no se lee bien se nota en
 * la salida: no se completa a mano.
 */
import { readFileSync } from 'node:fs';

/** Desescapa una cadena ODIN: `\"` y `\\`. */
const odin = (s) => s.replace(/\\(["\\])/g, '$1');

const STR = String.raw`"((?:[^"\\]|\\.)*)"`;

/** Las secciones de primer nivel de un .adl, por nombre. */
function secciones(texto) {
  const nombres = [
    'archetype',
    'concept',
    'language',
    'description',
    'definition',
    'ontology',
    'terminology',
  ];
  const marcas = [];
  for (const n of nombres) {
    const m = new RegExp(`^${n}\\b`, 'm').exec(texto);
    if (m) marcas.push([n, m.index]);
  }
  marcas.sort((a, b) => a[1] - b[1]);
  const out = {};
  marcas.forEach(([n, ini], k) => {
    out[n] = texto.slice(ini, marcas[k + 1]?.[1] ?? texto.length);
  });
  return out;
}

/** Una clave `["clave"] = <"valor">` de un bloque ODIN. */
function clave(bloque, nombre) {
  const m = new RegExp(String.raw`\["${nombre}"\]\s*=\s*<${STR}>`).exec(bloque);
  return m ? odin(m[1]) : undefined;
}

/** Un atributo `nombre = <"valor">`. */
function atributo(bloque, nombre) {
  const m = new RegExp(String.raw`\b${nombre}\s*=\s*<${STR}>`).exec(bloque);
  return m ? odin(m[1]) : undefined;
}

/** Los bloques `["xx"] = < … >` de primer nivel dentro de `details`. */
function porIdioma(desc) {
  const out = {};
  const re = /\["([a-z]{2}(?:-[a-zA-Z]{2})?)"\]\s*=\s*<\s*\n\s*language\s*=/g;
  const marcas = [...desc.matchAll(re)].map((m) => [m[1], m.index]);
  marcas.forEach(([idioma, ini], k) => {
    out[idioma] = desc.slice(ini, marcas[k + 1]?.[1] ?? desc.length);
  });
  return out;
}

/** Los términos `atNNNN` de cada idioma: texto y descripción. */
function terminos(onto) {
  const defs = onto.split(/term_bindings|constraint_definitions/)[0];
  const re = /\["([a-z]{2}(?:-[a-zA-Z]{2})?)"\]\s*=\s*<\s*\n?\s*items\s*=\s*</g;
  const marcas = [...defs.matchAll(re)].map((m) => [m[1], m.index]);
  const out = {};
  marcas.forEach(([idioma, ini], k) => {
    const trozo = defs.slice(ini, marcas[k + 1]?.[1] ?? defs.length);
    const items = {};
    const reItem = new RegExp(
      String.raw`\["(at[0-9.]+)"\]\s*=\s*<\s*text\s*=\s*<${STR}>\s*description\s*=\s*<${STR}>`,
      'g',
    );
    for (const m of trozo.matchAll(reItem))
      items[m[1]] = { text: odin(m[2]), description: odin(m[3]) };
    out[idioma] = items;
  });
  return out;
}

/**
 * Los elementos de la definición en orden, con el tipo de su valor y, si es
 * ordinal o codificado local, la lista de valores.
 */
function elementos(def) {
  const out = [];
  let actual = null;
  let grupo = null;
  const lineas = def.split('\n');
  for (let n = 0; n < lineas.length; n += 1) {
    const l = lineas[n];
    const cl = /CLUSTER\[(at[0-9.]+)\]/.exec(l);
    if (cl) grupo = cl[1];
    const el = /ELEMENT\[(at[0-9.]+)\]/.exec(l);
    if (el) {
      actual = { id: el[1], cluster: grupo, type: null, values: [] };
      out.push(actual);
      continue;
    }
    if (actual === null) continue;
    const tipo = /\b(DV_[A-Z_]+)\b/.exec(l);
    if (tipo && actual.type === null) actual.type = tipo[1];
    // Ordinal: `3|[local::at0012],`  (puede venir en la misma línea que `matches {`)
    for (const m of l.matchAll(/(-?\d+(?:\.\d+)?)\|\[local::(at[0-9.]+)\]/g)) {
      if (actual.type === null || actual.type === 'DV_ORDINAL') {
        actual.type = actual.type ?? 'DV_ORDINAL';
        actual.values.push({ ordinal: Number(m[1]), code: m[2] });
      } else if (actual.type === 'DV_SCALE') {
        actual.values.push({ ordinal: Number(m[1]), code: m[2] });
      }
    }
    // Codificado local: `[local::` y luego `at0012,` … `at0013]`
    if (/\[local::\s*$/.test(l) || /\[local::at[0-9.]+[,\]]/.test(l)) {
      if (/\|\[local::/.test(l)) continue;
      let bloque = l;
      let k = n;
      while (
        !/\]/.test(bloque.split('[local::')[1] ?? '') &&
        k < lineas.length - 1
      ) {
        k += 1;
        bloque += lineas[k];
      }
      const dentro = (bloque.split('[local::')[1] ?? '').split(']')[0];
      for (const c of dentro.match(/at[0-9.]+/g) ?? [])
        actual.values.push({ code: c });
      n = k;
    }
  }
  return out;
}

/** Lee un arquetipo y devuelve lo que una ficha necesita de él. */
export function leerArquetipo(ruta) {
  const texto = readFileSync(ruta, 'utf8').replace(/\r\n/g, '\n');
  const sec = secciones(texto);
  const id = /openEHR-EHR-[A-Z_]+\.[\w-]+\.v\d+/.exec(texto)?.[0];
  const desc = sec.description ?? '';
  const detalles = porIdioma(desc);
  const meta = {
    id,
    lifecycle: atributo(desc, 'lifecycle_state'),
    revision: clave(desc, 'revision'),
    licence: clave(desc, 'licence'),
    copyright: Object.fromEntries(
      Object.entries(detalles)
        .map(([idioma, b]) => [idioma, atributo(b, 'copyright')])
        .filter(([, v]) => v !== undefined),
    ),
    ipAcknowledgements: clave(desc, 'ip_acknowledgements'),
    originalPublisher: clave(desc, 'original_publisher'),
    references: clave(desc, 'references'),
    purpose: Object.fromEntries(
      Object.entries(detalles).map(([idioma, b]) => [
        idioma,
        atributo(b, 'purpose'),
      ]),
    ),
    use: Object.fromEntries(
      Object.entries(detalles).map(([idioma, b]) => [
        idioma,
        atributo(b, 'use'),
      ]),
    ),
    misuse: Object.fromEntries(
      Object.entries(detalles).map(([idioma, b]) => [
        idioma,
        atributo(b, 'misuse'),
      ]),
    ),
  };
  const onto = sec.ontology ?? sec.terminology ?? '';
  return {
    ...meta,
    languages: Object.keys(terminos(onto)),
    terms: terminos(onto),
    elements: elementos(sec.definition ?? ''),
  };
}
