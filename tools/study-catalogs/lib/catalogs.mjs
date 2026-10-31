// Lectura y verificación de los tres catálogos versionados de estudios
// (laboratorio, imagenología, regiones del cuerpo 3D). Puro: sin base de datos.
// Lo comparten el validador (check-study-catalogs.mjs) y el cargador
// (load-study-catalogs.mjs), para que ambos vean exactamente lo mismo.

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const DATA_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'src', 'modules', 'study_catalog', 'data');
export const LOCAL_KEYS = JSON.parse(readFileSync(join(DATA_DIR, 'local-concept-keys.json'), 'utf8'));
export const FILES = ['laboratorio.json', 'imagenologia.json', 'regiones-cuerpo-3d.json'];
// Admite dígito inicial (17_OH_PROGESTERONA, 5_HIAA): son nombres de analito reales.
export const SNAKE = /^(?=.*[A-Z])[A-Z0-9]+(_[A-Z0-9]+)*$/;

/** Lee los JSON y comprueba su SHA-256 contra `SHA256SUMS` (formato `sha256sum`). */
export function readCatalogs(dir = DATA_DIR) {
  const sums = Object.fromEntries(
    readFileSync(join(dir, 'SHA256SUMS'), 'utf8')
      .split('\n')
      .filter(Boolean)
      .map((l) => l.trim().split(/\s+/).reverse()),
  );
  const out = { sha256: {} };
  for (const f of FILES) {
    const raw = readFileSync(join(dir, f));
    const sha = createHash('sha256').update(raw).digest('hex');
    if (sums[f] !== sha) throw new Error(`${f}: SHA-256 ${sha} no coincide con SHA256SUMS (${sums[f]})`);
    out.sha256[f] = sha;
    out[f.replace('.json', '')] = JSON.parse(raw.toString('utf8'));
  }
  return { lab: out.laboratorio, img: out.imagenologia, reg: out['regiones-cuerpo-3d'], sha256: out.sha256 };
}

/**
 * Qué se puede sembrar como válido. Nada con `verificar`, `verificar_composicion`
 * se siembra (PENDIENTES-CLINICOS.md); `verificar_loinc` y `loinc_estado` retienen
 * sólo el código LOINC, no el estudio.
 */
export function classify({ lab, img }) {
  const pending = [];
  const labSeed = [];
  for (const a of lab.analisis) {
    if (a.verificar === true) { pending.push({ kind: 'analisis', code: a.codigo, why: 'verificar' }); continue; }
    if (a.verificar_composicion === true) { pending.push({ kind: 'analisis', code: a.codigo, why: 'verificar_composicion' }); continue; }
    const componentes = [];
    for (const c of a.componentes) {
      if (c.verificar === true) { pending.push({ kind: 'componente', code: `${a.codigo}.${c.codigo}`, why: 'verificar' }); continue; }
      componentes.push(c);
    }
    labSeed.push({ ...a, componentes });
  }
  const imgSeed = [];
  for (const e of img.estudios) {
    if (e.verificar === true) { pending.push({ kind: 'estudio', code: e.codigo, why: 'verificar' }); continue; }
    let loinc = e.loinc;
    let porLateralidad = e.loinc_por_lateralidad;
    if (e.verificar_loinc === true) { pending.push({ kind: 'loinc', code: e.codigo, why: 'verificar_loinc' }); loinc = null; porLateralidad = undefined; }
    if (e.loinc_estado) { pending.push({ kind: 'loinc', code: e.codigo, why: `loinc_estado=${e.loinc_estado}` }); loinc = null; porLateralidad = undefined; }
    imgSeed.push({ ...e, loinc, loinc_por_lateralidad: porLateralidad });
  }
  return { pending, labSeed, imgSeed };
}
