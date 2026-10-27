// =============================================================================
// PAMI · nomenclador-comun.csv del portal propio de PAMI (datos.pami.org.ar).
//
// El conjunto «Nomenclador de prácticas médicas — valor por cápitas y módulos»
// (INSSJP, licencia CC-BY-4.0 según su metadato `license_id`) publica el CSV
// oficial. Se usa para COTEJAR la redistribución de npm (mismos 4 739 códigos) y
// para agregar lo que el npm no trae: el módulo y el valor en unidades.
//
// Formato real (ISO-8859-1, CRLF, `;`): 4 filas de título, una cabecera
// `Módulo;Código de práctica;Descripción de práctica;Valor resultante unidades`
// y una fila por práctica; el título dice «ESTRUCTURA UNIDADES FEBRERO 2019».
// Los nombres vienen en MAYÚSCULAS y, en 10 filas, con «?» donde el export perdió
// una letra griega (β, α): por eso los nombres NO se toman de acá.
// =============================================================================

import { iterDelimited } from './delimited.mjs';

const HEADER = ['Módulo', 'Código de práctica', 'Descripción de práctica', 'Valor resultante unidades'];

/** «$ 1.991,75» → 199175 (centavos enteros; nunca float). */
export function arsToCents(text) {
  const m = String(text).trim().match(/^\$\s*(\d{1,3}(?:\.\d{3})*|\d+),(\d{2})$/);
  if (!m) throw new Error(`Importe PAMI con formato inesperado: «${text}»`);
  return Number(m[1].replace(/\./g, '')) * 100 + Number(m[2]);
}

/** @param {Buffer} buf  bytes del CSV (ISO-8859-1) */
export function parsePamiOriginal(buf) {
  const text = buf.toString('latin1');
  const rows = [...iterDelimited(text, ';')];
  const h = rows.findIndex((r) => HEADER.every((c, i) => r[i] === c));
  if (h < 0) throw new Error(`PAMI original: no encontré la cabecera ${HEADER.join(' ; ')}`);
  const title = rows.slice(0, h).map((r) => r[0]).find((t) => t && t.trim()) ?? null;
  const out = new Map();
  for (const r of rows.slice(h + 1)) {
    if (!r[1]?.trim()) continue; // filas vacías del final
    const code = r[1].trim();
    if (!/^\d{6}$/.test(code)) throw new Error(`PAMI original: código inesperado «${code}»`);
    if (out.has(code)) throw new Error(`PAMI original: código repetido ${code}`);
    out.set(code, { module: r[0].trim(), officialName: r[2].trim(), valueCents: arsToCents(r[3]) });
  }
  return { title, rows: out };
}
