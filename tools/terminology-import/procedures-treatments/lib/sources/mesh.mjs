// =============================================================================
// MeSH 2026 (NLM, desc2026.xml): descriptor → nombre y números de árbol.
//
// Clasificación por la propia jerarquía de MeSH, sin mirar nombres:
//  - Intervención no farmacológica: algún número de árbol «válido», es decir,
//    dentro de PROCEDURE_TREES (E01.370 técnicas diagnósticas, E02 terapéutica
//    por debajo de su raíz, E03 anestesia, E04 cirugía, E06 odontología, E07
//    equipos, F04.754 psicoterapia) y fuera de NON_PROCEDURE_TREES; y NINGUNO en
//    un subárbol farmacológico (PHARMACOLOGICAL_EXCLUDED_TREES) ni en D. Un
//    descriptor mixto (p. ej. un protocolo de quimioterapia, que vive en E02.183
//    y en E02.319) queda afuera entero.
//  - NON_PROCEDURE_TREES: ramas de E que son métodos de investigación o de
//    laboratorio (E05 entero: «Control Groups», «Methods», «Surveys and
//    Questionnaires»…), conceptos diagnósticos que no son procedimientos (el
//    resto de E01: pronóstico, errores diagnósticos…), estrategias o diseño de
//    tratamiento dentro de E02 (protocolos, placebos, contraindicaciones,
//    prevención secundaria/terciaria, retratamiento, cambio de tratamiento,
//    terapias en investigación, prescripción), tiempos y conceptos
//    administrativos (período perioperatorio, hospitalización, tiempo hasta el
//    tratamiento, duración de la terapia…) e insumos de laboratorio dentro de
//    E07. Un descriptor que además tenga un árbol válido (p. ej. «Biopsy»:
//    E01.370 y E04, además de E05) sí entra. La raíz E02 «Therapeutics» sola no
//    nombra un procedimiento y no entra.
//  - Condición: algún número de árbol en C «Diseases» o F03 «Mental Disorders».
// Un descriptor que solo está en D (fármacos y sustancias) no es procedimiento:
// lo cubre la sesión `seed-drug-treatments`.
// =============================================================================

import { createReadStream } from 'node:fs';
import { createGunzip } from 'node:zlib';
import { own } from '../common.mjs';

export const PROCEDURE_TREES = [
  'E01.370',
  'E02',
  'E03',
  'E04',
  'E06',
  'E07',
  'F04.754',
];
export const NON_PROCEDURE_TREES = [
  'E05',
  'E02.183', // Clinical Protocols
  'E02.208', // Contraindications
  'E02.785', // Placebos
  'E02.887', // Retreatment
  'E02.895', // Salvage Therapy
  'E02.897', // Secondary Prevention
  'E02.919', // Tertiary Prevention
  'E02.931', // Therapies, Investigational
  'E02.990', // Treatment Switching
  'E02.860', // Remission Induction
  'E02.134', // Bridge Therapy
  'E02.637', // Non-Medical Prescribing
  // Tiempos y conceptos administrativos que MeSH cuelga dentro de procedimientos
  'E04.614', // Perioperative Period (p. ej. «Operative Time»)
  'E02.760.400', // Hospitalization (p. ej. «Length of Stay»)
  'E02.760.928', // Time-to-Treatment
  'E02.760.287', // Duration of Therapy
  'E02.760.263', // Delayed Diagnosis
  'E02.760.952', // Withholding Treatment
  'E02.760.300', // Episode of Care
  // E07: insumos de laboratorio e investigación
  'E07.039',
  'E07.079',
  'E07.115',
  'E07.123',
  'E07.161',
  'E07.206',
  'E07.241',
  'E07.461',
  'E07.553',
  'E07.560',
  'E07.565',
  'E07.595',
  'E07.671',
  'E07.705',
  'E07.720',
];
/** Raíces generales que no nombran un procedimiento («Therapeutics» = E02). */
export const GENERIC_ROOT_TREES = ['E02'];
export const PHARMACOLOGICAL_EXCLUDED_TREES = [
  'E02.319',
  'E02.095.465',
  'E02.183.750',
  'E05.478.550',
  'E05.478.610',
  'D',
];
export const BEHAVIORAL_TREES = ['F04.754'];
export const CONDITION_TREES = ['C', 'F03'];

const decode = (s) =>
  s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');

/** Un `<DescriptorRecord>` (texto XML) → `{ ui, name, trees }`. */
export function parseDescriptor(xml) {
  const ui = xml.match(/<DescriptorUI>(D\d+)<\/DescriptorUI>/)?.[1];
  const name = xml.match(/<DescriptorName>\s*<String>([^<]*)<\/String>/)?.[1];
  if (!ui || name == null) return null;
  const trees = [...xml.matchAll(/<TreeNumber>([^<]+)<\/TreeNumber>/g)].map(
    (m) => own(m[1]),
  );
  return { ui: own(ui), name: own(decode(name)), trees };
}

/** Lee desc20XX.xml(.gz) en streaming y devuelve `Map<UI, descriptor>`. */
export async function readMeshDescriptors(path) {
  const stream = path.endsWith('.gz')
    ? createReadStream(path).pipe(createGunzip())
    : createReadStream(path);
  stream.setEncoding('utf8');
  const out = new Map();
  let buf = '';
  let year = null;
  for await (const chunk of stream) {
    buf += chunk;
    if (!year) year = buf.match(/nlmdescriptorrecordset_(\d{4})/)?.[1] ?? null;
    let end;
    while ((end = buf.indexOf('</DescriptorRecord>')) >= 0) {
      const start = buf.indexOf('<DescriptorRecord ');
      const d = parseDescriptor(buf.slice(start, end));
      if (d) out.set(d.ui, d);
      buf = buf.slice(end + '</DescriptorRecord>'.length);
    }
  }
  return { descriptors: out, year };
}

const under = (tree, roots) =>
  roots.some(
    (r) =>
      tree === r ||
      tree.startsWith(`${r}.`) ||
      (r.length === 1 && tree.startsWith(r)),
  );

const validProcedureTree = (t) =>
  !GENERIC_ROOT_TREES.includes(t) &&
  under(t, PROCEDURE_TREES) &&
  !under(t, NON_PROCEDURE_TREES);

export function isNonPharmacologicalIntervention(d) {
  if (!d) return false;
  if (d.trees.some((t) => under(t, PHARMACOLOGICAL_EXCLUDED_TREES)))
    return false;
  return d.trees.some(validProcedureTree);
}

/** Categoría por el primer árbol que la define (orden fijo, sin mirar el nombre). */
export function meshInterventionCategory(d) {
  const has = (roots) => d.trees.some((t) => under(t, roots));
  if (has(['E04'])) return 'surgical';
  if (has(['E01.370'])) return 'diagnostic';
  if (has(['E07'])) return 'device';
  if (has(BEHAVIORAL_TREES)) return 'behavioral';
  if (has(['E06'])) return 'dental';
  return 'therapeutic-or-other';
}

export function isCondition(d) {
  return Boolean(d?.trees.some((t) => under(t, CONDITION_TREES)));
}
