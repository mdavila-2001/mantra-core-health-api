// =============================================================================
// MeSH 2026 (NLM, desc2026.xml): descriptor → nombre y números de árbol.
//
// Clasificación por la propia jerarquía de MeSH, sin mirar nombres:
//  - Intervención no farmacológica: algún número de árbol en E «Analytical,
//    Diagnostic and Therapeutic Techniques, and Equipment» o en F04.754
//    «Psychotherapy», y NINGUNO en un subárbol farmacológico (E02.319 «Drug
//    Therapy», E02.095.465 «Immunomodulation», E02.183.750 «Antineoplastic
//    Protocols», E05.478.550 «Immunization», E05.478.610 «Immunosuppression
//    Therapy») ni en D. Un descriptor mixto (p. ej. un protocolo de
//    quimioterapia, que vive en E02.183 y en E02.319) queda afuera entero.
//  - Condición: algún número de árbol en C «Diseases» o F03 «Mental Disorders».
// Un descriptor que solo está en D (fármacos y sustancias) no es procedimiento:
// lo cubre la sesión `seed-drug-treatments`.
// =============================================================================

import { createReadStream } from 'node:fs';
import { createGunzip } from 'node:zlib';
import { own } from '../common.mjs';

export const PROCEDURE_TREES = ['E'];
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

export function isNonPharmacologicalIntervention(d) {
  if (!d) return false;
  if (d.trees.some((t) => under(t, PHARMACOLOGICAL_EXCLUDED_TREES)))
    return false;
  return d.trees.some(
    (t) => under(t, PROCEDURE_TREES) || under(t, BEHAVIORAL_TREES),
  );
}

/** Categoría por el primer árbol que la define (orden fijo, sin mirar el nombre). */
export function meshInterventionCategory(d) {
  const has = (roots) => d.trees.some((t) => under(t, roots));
  if (has(['E04'])) return 'surgical';
  if (has(['E01', 'E05'])) return 'diagnostic';
  if (has(['E07'])) return 'device';
  if (has(BEHAVIORAL_TREES)) return 'behavioral';
  if (has(['E06'])) return 'dental';
  return 'therapeutic-or-other';
}

export function isCondition(d) {
  return Boolean(d?.trees.some((t) => under(t, CONDITION_TREES)));
}
