#!/usr/bin/env node
/**
 * Convierte el texto de las normas de atención clínica **actualizadas el
 * 30/09/2025** (RM 0456, Ministerio de Salud y Deportes de Bolivia) en
 * `nnac-norms-2025.json`. Son seis volúmenes por especialidad: Medicina
 * Interna, Terapia Intensiva, Traumatología, Urgencias y Emergencias,
 * Neurología y Pediatría. Para esas áreas **sustituyen** a las de 2012.
 *
 * A diferencia de 2012, cada capítulo abre con su cabecera («NIVEL DE
 * ATENCIÓN», título, `CIE-10` con los códigos y su nombre oficial) y el texto
 * va en una columna. El resto —viñetas, filtro de tratamiento, listas— es el
 * mismo que `parse-nnac.mjs`, que es de donde se importa.
 *
 *   node tools/clinical-forms/nnac/parse-nnac2025.mjs <carpeta-con-txt> [salida.json]
 *
 * La carpeta tiene un `.txt` por volumen (`extract-text.mjs`), con el nombre
 * de la clave de `VOLUMENES`.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  ENCABEZADOS,
  limpiarLista,
  normalizar,
  prosa,
  resumirDefinicion,
  soloHallazgos,
  unir,
  viñetas,
} from './parse-nnac.mjs';

/** Cada volumen y la carpeta (especialidad) del catálogo de fichas a la que va. */
export const VOLUMENES = {
  'medicina-interna': { carpeta: 'medicina-interna', sigla: 'MI' },
  'terapia-intensiva': { carpeta: 'medicina-intensiva', sigla: 'TI' },
  traumatologia: { carpeta: 'traumatologia', sigla: 'TRA' },
  'urgencias-y-emergencias': { carpeta: 'medicina-emergencia', sigla: 'URG' },
  neurologia: { carpeta: 'neurologia', sigla: 'NEU' },
  pediatria: { carpeta: 'pediatria', sigla: 'PED' },
};

/** Los fragmentos de «criterios de referencia / contrarreferencia / alta» en columnas. */
const FRAGMENTOS_REFERENCIA = new Set(
  [
    'CRITERIOS DE',
    'CRITERIOS',
    'REFERENCIA',
    'CONTRARREFERENCIA',
    'ALTA',
    'DE ALTA',
    'TRANSFERENCIA',
    'CRITERIOS DE REFERENCIA',
    'REFERENCIA CRITERIOS DE',
    'REFERENCIA CRITERIOS',
    'CONTRARREFERENCIA CRITERIOS DE',
    'CONTRARREFERENCIA CRITERIOS',
    'CRITERIOS DE REFERENCIA CRITERIOS DE',
    'CRITERIOS DE ALTA',
    'CRITERIOS DE CONTRARREFERENCIA',
  ].map(normalizar),
);

const NIVELES = /^ATENCI[ÓO]N\s+(I{1,3})(\s*[-–]\s*I{1,3})*$/u;
const CODIGO_CIE10 = /^([A-Z]\d{2}(?:\.\d+)?)\s*:\s*(.{4,})$/u;
const ITEM_NUMERADO = /^\s*(?:\d{1,2}(?:\.\d{1,2})*[.)]|[A-F][.)])\s+(?=\S)/u;
const RUIDO =
  /^(===\s*PAGE|\d{1,3}\s*NORMA NACIONAL|NORMA NACIONAL DE ATENCI[ÓO]N|SERIE:?\s*DOCUMENTOS|\d{1,3}\s*SERIE|\d{1,4}$)/iu;

/**
 * Las cabeceras de capítulo. Su forma habitual es `NIVEL DE` / `ATENCIÓN I - II
 * - III` / título / `CIE-10`, pero hay variantes: `CIE -10`, `CIE-10 B15 a B19`
 * antes del título, o los niveles pegados a «NIVEL DE». Se ancla en
 * `NIVEL DE` + `ATENCIÓN`, que está en todas.
 */
function cabeceras(lineas) {
  const salida = [];
  for (let i = 1; i < lineas.length; i += 1) {
    if (!/^ATENCI[ÓO]N(\s|$)/u.test(lineas[i].trim())) continue;
    if (!/NIVEL DE\s*$/u.test(lineas[i - 1].trim())) continue;
    const niveles =
      [...lineas[i].matchAll(/\bI{1,3}\b/g)].map((m) => m[0]).join(' - ') ||
      [...lineas[i - 1].matchAll(/\bI{1,3}\b/g)].map((m) => m[0]).join(' - ');
    // El título corre hasta el `CIE-10` o hasta el primer encabezado.
    const titulo = [];
    let j = i + 1;
    while (j < Math.min(lineas.length, i + 6)) {
      const l = lineas[j].trim();
      if (/^CIE\s*-?\s*10/u.test(l) || esEncabezado(l) || l === '') break;
      titulo.push(l);
      j += 1;
    }
    if (titulo.length === 0) continue;
    // Las líneas sueltas que preceden a `NIVEL DE` (número, `CIE-10 …`) son de la cabecera.
    let inicio = i - 1;
    while (
      inicio > 0 &&
      /^(\d{1,3}|\d{1,3}\s*CIE\s*-?\s*10.*|CIE\s*-?\s*10.*)$/u.test(
        lineas[inicio - 1].trim(),
      )
    )
      inicio -= 1;
    const previo = lineas[inicio] && /^CIE/u.test(lineas[inicio].trim());
    salida.push({
      inicio,
      linea: j - 1,
      niveles,
      titulo: unir(titulo),
      codigosEnLinea: previo ? lineas[inicio].trim() : '',
    });
  }
  return salida;
}

function esEncabezado(linea) {
  const n = normalizar(linea);
  return ENCABEZADOS.has(n) || FRAGMENTOS_REFERENCIA.has(n);
}

/** Los códigos CIE-10 que declara el capítulo, con su nombre oficial. */
function codigosDe(lineas) {
  const codigos = [];
  for (const l of lineas) {
    if (esEncabezado(l)) break;
    const m = CODIGO_CIE10.exec(l.trim());
    if (m !== null) codigos.push({ codigo: m[1], nombre: m[2].trim() });
  }
  return codigos.slice(0, 15);
}

export function parsearVolumen(texto, volumen) {
  const crudas = texto.split('\n');
  const paginas = [];
  let pagina = 0;
  for (const l of crudas) {
    const m = /^=== PAGE (\d+)/.exec(l);
    if (m) pagina = Number(m[1]);
    paginas.push(pagina);
  }
  const heads = cabeceras(crudas);
  const { carpeta, sigla } = VOLUMENES[volumen];

  return heads.map((c, n) => {
    const fin = n + 1 < heads.length ? heads[n + 1].inicio : crudas.length;
    const cuerpo = crudas.slice(c.linea + 1, fin);
    const codigos = codigosDe(cuerpo);
    const lineas = cuerpo.filter(
      (l) => !RUIDO.test(l.trim()) && l.trim() !== '',
    );

    const secciones = {};
    let clave = null;
    for (const l of lineas) {
      const norm = normalizar(l);
      if (FRAGMENTOS_REFERENCIA.has(norm)) {
        clave = 'referencia';
        secciones[clave] ??= [];
        secciones[clave].doble = true;
        continue;
      }
      const nueva = ENCABEZADOS.get(norm);
      if (nueva !== undefined) {
        clave = nueva;
        secciones[clave] ??= [];
        continue;
      }
      if (clave !== null) secciones[clave].push(l);
    }

    const salida = {};
    for (const [k, ls] of Object.entries(secciones)) {
      // En estas secciones las normas de 2025 también numeran sus ítems
      // («1.1 …», «A. …»): se tratan como viñetas.
      const numerables = ['clasificacion', 'diagnostico', 'manifestaciones'];
      const items = numerables.includes(k)
        ? ls.map((l) => l.replace(ITEM_NUMERADO, '▪ '))
        : ls;
      salida[k] = {
        opciones: limpiarLista(viñetas(items)),
        texto: prosa(ls).slice(0, 1200),
        columnasMezcladas: ls.doble === true,
      };
    }
    const lista = (k, tope) => (salida[k]?.opciones ?? []).slice(0, tope);
    return {
      volumen,
      carpeta,
      sigla,
      numero: String(n + 1),
      titulo: c.titulo,
      niveles: c.niveles,
      cie10: codigos,
      cie10Texto: c.codigosEnLinea.replace(/^CIE\s*-?\s*10:?\s*/u, ''),
      pagina: paginas[c.linea],
      definicion: resumirDefinicion(salida.definicion?.texto ?? ''),
      // Lo observable al examinar al paciente: primero las manifestaciones y
      // después los criterios de diagnóstico.
      criterios: soloHallazgos([
        ...new Set([
          ...lista('manifestaciones', 60),
          ...lista('diagnostico', 60),
        ]),
      ]).slice(0, 30),
      clasificacion: lista('clasificacion', 12),
      factoresRiesgo: lista('factores_riesgo', 20),
      examenes: lista('examenes', 20),
      complicaciones: lista('complicaciones', 20),
      hospitalizacion: lista('hospitalizacion', 15),
      referencia: lista('referencia', 20),
      referenciaYAltaJuntas: salida.referencia?.columnasMezcladas === true,
      alta: lista('alta', 15),
    };
  });
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [carpeta, salida] = process.argv.slice(2);
  const normas = Object.keys(VOLUMENES).flatMap((v) =>
    parsearVolumen(readFileSync(join(carpeta, `${v}.txt`), 'utf8'), v),
  );
  if (salida) writeFileSync(salida, `${JSON.stringify(normas, null, 2)}\n`);
  const porVolumen = normas.reduce(
    (cuenta, n) => ({ ...cuenta, [n.volumen]: (cuenta[n.volumen] ?? 0) + 1 }),
    {},
  );
  console.log(`${normas.length} capítulos`, JSON.stringify(porVolumen));
}
