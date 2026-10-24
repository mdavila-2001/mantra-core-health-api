#!/usr/bin/env node
/**
 * Congela en `ckm-snapshot.json` los arquetipos del CKM de openEHR que usan
 * las fichas, para que `build-forms.mjs` no dependa de la red ni del espejo.
 *
 *   git clone --depth 1 https://github.com/openEHR/CKM-mirror /tmp/ckm-mirror
 *   node tools/clinical-forms/openehr/extract-ckm.mjs /tmp/ckm-mirror
 *
 * Guarda de cada arquetipo: id, revisión, estado, licencia, avisos de
 * copyright y de propiedad intelectual, referencias, y por cada elemento el
 * texto y la descripción en inglés y en castellano (si el CKM trae la
 * traducción), con el ordinal de cada valor. Los vínculos a SNOMED CT y LOINC
 * del arquetipo **no se copian**: Bolivia no es miembro de SNOMED
 * International y las fichas no usan esos códigos.
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { leerArquetipo } from './adl.mjs';

export const ARQUETIPOS = [
  'openEHR-EHR-OBSERVATION.apgar.v2',
  'openEHR-EHR-OBSERVATION.has_bled.v0',
  'openEHR-EHR-OBSERVATION.child_pugh_score.v0',
  'openEHR-EHR-OBSERVATION.sofa_score.v0',
  'openEHR-EHR-OBSERVATION.bishop_score.v0',
  'openEHR-EHR-OBSERVATION.revised_cardiac_risk_index.v1',
  'openEHR-EHR-OBSERVATION.charlson_comorbidity_index.v2',
  'openEHR-EHR-OBSERVATION.diabetic_wound_wagner.v0',
  'openEHR-EHR-OBSERVATION.karnofsky_performance_status_scale.v1',
  'openEHR-EHR-OBSERVATION.mayo_score.v1',
  'openEHR-EHR-OBSERVATION.nihss.v0',
  // Pasada 5
  'openEHR-EHR-OBSERVATION.heart_score.v0',
  'openEHR-EHR-OBSERVATION.abcd2_score.v0',
  'openEHR-EHR-OBSERVATION.downton_fall_risk_index.v0',
  'openEHR-EHR-OBSERVATION.padss.v0',
  'openEHR-EHR-OBSERVATION.tanner.v1',
];

const AQUI = dirname(fileURLToPath(import.meta.url));

function main() {
  const espejo = process.argv[2];
  if (espejo === undefined) {
    console.error('uso: extract-ckm.mjs <ruta al clon de openEHR/CKM-mirror>');
    process.exit(2);
  }
  const commit = execFileSync(
    'git',
    ['-C', espejo, 'log', '-1', '--format=%H %cI'],
    {
      encoding: 'utf8',
    },
  ).trim();
  const salida = {
    mirror: 'https://github.com/openEHR/CKM-mirror',
    commit,
    archetypes: {},
  };
  for (const id of ARQUETIPOS) {
    const tipo = id.split('.')[0].split('-')[2].toLowerCase();
    const a = leerArquetipo(
      join(espejo, 'local', 'archetypes', 'entry', tipo, `${id}.adl`),
    );
    if (a.id !== id) throw new Error(`${id}: se leyó ${a.id}`);
    const es = a.languages.includes('es')
      ? 'es'
      : a.languages.find((l) => l.startsWith('es'));
    const termino = (code) => ({
      en: a.terms.en?.[code],
      ...(es === undefined ? {} : { es: a.terms[es]?.[code], esLanguage: es }),
    });
    salida.archetypes[id] = {
      revision: a.revision,
      lifecycle: a.lifecycle,
      licence: a.licence,
      copyright: a.copyright.en,
      ipAcknowledgements: a.ipAcknowledgements,
      references: a.references,
      concept: termino('at0000'),
      elements: a.elements
        .filter((e) => e.values.length > 0 || e.type === 'DV_COUNT')
        .map((e) => ({
          id: e.id,
          type: e.type,
          ...termino(e.id),
          values: e.values.map((v) => ({
            code: v.code,
            ...(v.ordinal === undefined ? {} : { ordinal: v.ordinal }),
            ...termino(v.code),
          })),
        })),
    };
  }
  writeFileSync(
    join(AQUI, 'ckm-snapshot.json'),
    `${JSON.stringify(salida, null, 2)}\n`,
  );
  console.log(`${ARQUETIPOS.length} arquetipos · espejo ${commit}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
