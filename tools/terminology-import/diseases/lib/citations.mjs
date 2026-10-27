// =============================================================================
// Fuentes que CITAN enfermedades por código sin publicar una nomenclatura propia
// que se pueda cargar. De ellas sólo se toman los identificadores:
//  - anotaciones HPO (phenotype.hpoa): OMIM, ORPHA y DECIPHER de cada anotación
//    (es la entrada de la sesión de síntomas: cada id tiene que resolver acá);
//  - anotaciones HPO de enfermedades comunes (Groza 2015): MeSH y DOID;
//  - phenopacket-store: el OMIM del diagnóstico de cada caso;
//  - tabla OMS 10To11MapToOneCategory: cada código CIE-10 2019 con su categoría
//    CIE-11 MMS de destino (correspondencia publicada por la OMS).
// Los nombres que traen esos archivos (títulos de OMIM, de la CIE-10) no se
// cargan: su licencia es la de la fuente original.
// =============================================================================

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/** phenotype.hpoa → [{ cs, code }] únicos. */
export function citeHpoAnnotations(path) {
  const seen = new Set();
  const out = [];
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    if (!line || line.startsWith('#') || line.startsWith('database_id')) continue;
    const id = line.slice(0, line.indexOf('\t'));
    if (seen.has(id)) continue;
    seen.add(id);
    const [prefix, local] = id.split(':');
    if (prefix === 'OMIM' && /^\d{6}$/.test(local)) out.push({ cs: 'omim', code: local });
    else if (prefix === 'ORPHA') out.push({ cs: 'orphanet', code: local });
    else if (prefix === 'DECIPHER') out.push({ cs: 'decipher', code: local });
  }
  return out;
}

function walkFiles(dir, ext, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walkFiles(p, ext, acc);
    else if (name.endsWith(ext)) acc.push(p);
  }
  return acc;
}

/** phenopacket-store (descomprimido) → [{ cs, code }] únicos de `diseases` y de los diagnósticos. */
export function citePhenopackets(dir) {
  const ids = new Set();
  for (const file of walkFiles(dir, '.json')) {
    let doc;
    try {
      doc = JSON.parse(readFileSync(file, 'utf8'));
    } catch {
      continue;
    }
    for (const d of doc.diseases ?? []) if (d.term?.id) ids.add(d.term.id);
    for (const i of doc.interpretations ?? []) if (i.diagnosis?.disease?.id) ids.add(i.diagnosis.disease.id);
  }
  return [...ids]
    .map((id) => id.split(':'))
    .filter(([p, l]) => p === 'OMIM' && /^\d{6}$/.test(l))
    .map(([, l]) => ({ cs: 'omim', code: l }));
}

/**
 * Anotaciones HPO de enfermedades comunes (Groza 2015) → [{ cs, code }] únicos.
 * Un archivo `.tab` por enfermedad; la columna «Disease ID» trae `MESH:D…` o
 * `DO:DOID:<7 dígitos>`. El DOID se devuelve tal cual: los ceros a la izquierda
 * se resuelven contra DOID en el build (`resolveDoidCode`).
 */
export function citeHpoCommonDiseases(dir) {
  const ids = new Set();
  for (const file of walkFiles(dir, '.tab')) {
    const second = readFileSync(file, 'utf8').split('\n')[1] ?? '';
    const id = second.split('\t')[0].trim();
    if (id) ids.add(id);
  }
  const out = [];
  for (const id of [...ids].sort()) {
    const mesh = /^MESH:([CD]\d+)$/.exec(id);
    const doid = /^DO:(DOID:\d+)$/.exec(id);
    if (mesh) out.push({ cs: 'mesh', code: mesh[1] });
    else if (doid) out.push({ cs: 'doid', code: doid[1] });
  }
  return out;
}

/**
 * DOID citado con ceros a la izquierda (`DOID:0013550`, donde DO publica
 * `DOID:13550`): primero el código exacto (hay DOID vigentes de 7 dígitos como
 * `DOID:0050156`), después sin ceros, después por `alt_id`. Sin match, se
 * devuelve tal cual y queda sin resolver.
 */
export function resolveDoidCode(code, doidCodes, altIds) {
  if (doidCodes.has(code)) return code;
  const stripped = `DOID:${String(Number(code.slice(5)))}`;
  if (doidCodes.has(stripped)) return stripped;
  return altIds.get(code) ?? altIds.get(stripped) ?? code;
}

/**
 * 10To11MapToOneCategory → claves CIE-10 con su destino CIE-11 MMS. Los destinos
 * poscoordinados («stem&extensión», «a/b») no se reducen a uno: no generan mapeo
 * (quitarles la extensión cambiaría lo que dice la OMS) y se guardan textuales en
 * `postcoordinated` para dejarlos como propiedad de la clave.
 */
export function icd10KeysFromWhoMap(path) {
  const lines = readFileSync(path, 'utf8').replace(/^﻿/, '').split(/\r?\n/);
  const header = lines[0].split('\t');
  const col = (n) => header.indexOf(n);
  const [c10, c11] = [col('icd10Code'), col('icd11Code')];
  const version = header[header.length - 1].trim();
  const byCode = new Map();
  let postcoordinated = 0;
  for (const line of lines.slice(1)) {
    const f = line.split('\t');
    const code10 = f[c10]?.trim();
    if (!code10) continue;
    const code11 = f[c11]?.trim() ?? '';
    const entry = byCode.get(code10) ?? { code: code10, targets: [], postcoordinated: [] };
    if (/[&/]/.test(code11)) {
      postcoordinated += 1;
      entry.postcoordinated.push(code11);
    } else if (code11 && code11 !== 'No Mapping') entry.targets.push(code11);
    byCode.set(code10, entry);
  }
  return { version, postcoordinated, keys: [...byCode.values()] };
}

/**
 * 10To11MapToMultipleCategories → Map<código CIE-10, destinos CIE-11 (textuales)> sólo para los códigos que la
 * OMS publica con más de una fila (un código CIE-10 repartido en varias categorías CIE-11).
 */
export function icd10MultipleTargets(path) {
  const lines = readFileSync(path, 'utf8').replace(/^﻿/, '').split(/\r?\n/);
  const header = lines[0].split('\t');
  const [c10, c11] = [header.indexOf('icd10Code'), header.indexOf('icd11Code')];
  const by = new Map();
  for (const line of lines.slice(1)) {
    const f = line.split('\t');
    const a = f[c10]?.trim();
    const b = f[c11]?.trim();
    if (!a || !b || b === 'No Mapping') continue;
    (by.get(a) ?? by.set(a, []).get(a)).push(b);
  }
  return new Map([...by].filter(([, v]) => v.length > 1));
}
