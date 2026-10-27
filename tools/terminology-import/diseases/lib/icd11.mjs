// =============================================================================
// CIE-11 MMS (OMS): tabulación simple y tabla de correspondencia 11→10.
//
// `SimpleTabulation-ICD-11-MMS-en.txt` es un TSV con una fila por entidad de la
// linealización (capítulo, bloque, categoría). La columna `CodingNote` puede
// traer saltos de línea sin comillas, así que una fila lógica empieza siempre
// en una línea con la URI de linealización en la 2.ª columna (la 1.ª, la de la
// Fundación, va vacía en las categorías residuales `…/other` y
// `…/unspecified`) y las demás líneas se le suman. El título trae los guiones de profundidad de la tabulación
// («- - - Cholera»): se quitan, el resto es verbatim.
// =============================================================================

import { readFileSync } from 'node:fs';

const ENTITY = 'http://id.who.int/icd/entity/';
const ROW_START = /^(http:\/\/id\.who\.int\/icd\/entity\/\d+)?\thttp:\/\/id\.who\.int\/icd\/release\/11\/mms\//;

const unquote = (s) => (s.startsWith('"') && s.endsWith('"') ? s.slice(1, -1).replace(/""/g, '"') : s);

/**
 * Tabulación simple → { version, rows: [...] }. Las columnas se ubican por el nombre del encabezado: el
 * archivo en castellano trae una columna más (`TitleEN`, el título inglés) antes de `Title` (el título
 * en castellano), así que las posiciones no son las del archivo en inglés.
 */
export function parseSimpleTabulation(path) {
  const text = readFileSync(path, 'utf8').replace(/^﻿/, '');
  const lines = text.split(/\r?\n/);
  const header = lines[0].split('\t');
  const versionCell = header.find((h) => h.startsWith('Version:'));
  const at = (name) => header.indexOf(name);
  const col = {
    title: at('Title'),
    titleEn: at('TitleEN'),
    classKind: at('ClassKind'),
    depth: at('DepthInKind'),
    residual: at('IsResidual'),
    chapter: at('ChapterNo'),
    leaf: at('isLeaf'),
    primary: at('Primary tabulation'),
    grouping1: at('Grouping1'),
    note: at('CodingNote'),
  };
  const records = [];
  for (const line of lines.slice(1)) {
    if (ROW_START.test(line)) records.push(line);
    else if (records.length && line !== '') records[records.length - 1] += `\n${line}`;
  }
  const clean = (v) => unquote(v).replace(/^(- )+/, '').trim();
  const rows = records.map((rec) => {
    const f = rec.split('\t');
    const last = f[f.length - 1];
    const parent = last.startsWith(ENTITY) ? last : null;
    const note = f.slice(col.note, parent ? f.length - 1 : f.length).join('\t').trim();
    return {
      foundationUri: f[0] || null,
      linearizationUri: f[1],
      code: f[2] || null,
      blockId: f[3] || null,
      title: clean(f[col.title]),
      titleEn: col.titleEn >= 0 ? clean(f[col.titleEn]) : null,
      classKind: f[col.classKind],
      depthInKind: Number(f[col.depth]),
      isResidual: f[col.residual] === 'True',
      chapterNo: f[col.chapter],
      isLeaf: f[col.leaf] === 'True',
      primaryTabulation: f[col.primary] === 'True' ? true : f[col.primary] === 'False' ? false : null,
      groupings: f.slice(col.grouping1, col.grouping1 + 5).filter(Boolean),
      codingNote: note ? unquote(note) : null,
      parentUri: parent,
    };
  });
  return { version: versionCell ? versionCell.replace('Version:', '').trim() : null, rows };
}

/**
 * Código del concepto en el catálogo: el código de la categoría, el BlockId del
 * bloque o `chapter-<nº>`. Los bloques de las secciones V y X no traen ni código
 * ni BlockId: se usa el id de la entidad en la URI de linealización.
 */
export function mmsCode(row) {
  if (row.classKind === 'chapter') return `chapter-${row.chapterNo}`;
  return row.code ?? row.blockId ?? `mms-entity-${row.linearizationUri.replace(/^.*\/mms\//, '')}`;
}

/** Id numérico de la Fundación, o null para las entidades residuales (`…/other`, `…/unspecified`). */
export function foundationId(uri) {
  const m = /^http:\/\/id\.who\.int\/icd\/entity\/(\d+)$/.exec(uri ?? '');
  return m ? m[1] : null;
}

/** 11To10MapToOneCategory → Map<código CIE-11, código CIE-10> (sólo filas con ambos códigos). */
export function parse11To10(path) {
  const lines = readFileSync(path, 'utf8').replace(/^﻿/, '').split(/\r?\n/);
  const header = lines[0].split('\t');
  const col = (name) => header.indexOf(name);
  const [c11, c10] = [col('icd11Code'), col('icd10Code')];
  const out = new Map();
  for (const line of lines.slice(1)) {
    const f = line.split('\t');
    const a = f[c11]?.trim();
    const b = f[c10]?.trim();
    // Sólo categorías con código en ambas: los capítulos traen el número romano en icd10Code.
    if (a && b && /^[A-Z0-9]{2,}/.test(a) && /^[A-Z]\d/.test(b) && b !== 'No Mapping') out.set(a, b);
  }
  return { version: header[header.length - 1].trim(), map: out };
}
