// =============================================================================
// HPO (Human Phenotype Ontology) — definiciones de signos y síntomas.
//
// Se usa `hp.json` (OBO Graphs JSON). MEDIDO: la traducción oficial
// `hp-es.babelon.tsv` solo trae `rdfs:label` (19 932 filas, todas OFFICIAL), NO
// traduce definiciones, y su repositorio (`obophenotype/hpo-translations`) no
// declara licencia propia (404 en LICENSE y en la API de licencias, 2026-10-08).
// Por eso NO se usa: la definición va siempre en inglés (`lang: "en"`, «sin
// traducción oficial») y el `locator` cita la etiqueta inglesa de `hp.json`.
//
// Licencia (hpo.jax.org/license, leída el 2026-10-08): libre uso con tres
// condiciones: citar al HPO Consortium, mostrar fecha/versión del archivo y no
// alterar el contenido ni las relaciones. Por eso la definición se copia LITERAL.
// =============================================================================

import { readFileSync } from 'node:fs';
import { tokenKey } from './mesh.mjs';

const HP_IRI_PREFIX = 'http://purl.obolibrary.org/obo/HP_';

/** `http://purl.obolibrary.org/obo/HP_0001945` → `HP:0001945`. */
export function hpIdFromIri(iri) {
  return typeof iri === 'string' && iri.startsWith(HP_IRI_PREFIX) ? `HP:${iri.slice(HP_IRI_PREFIX.length)}` : null;
}

/** Versión (fecha de release) que declara `hp.json`: `…/hp/releases/2026-09-01/hp.json`. */
export function hpoVersionOf(json) {
  const iri = json?.graphs?.[0]?.meta?.version;
  const m = typeof iri === 'string' ? iri.match(/releases\/(\d{4}-\d{2}-\d{2})\//) : null;
  return m ? m[1] : null;
}

/**
 * `hp.json` → `Map HP:id → { label, synonyms[], definition|null, deprecated }`.
 * Solo se conserva lo que el armado cita: etiqueta, sinónimos exactos y definición.
 */
export function parseHpoJson(json) {
  const terms = new Map();
  for (const node of json?.graphs?.[0]?.nodes ?? []) {
    const id = hpIdFromIri(node.id);
    if (!id || node.type !== 'CLASS') continue;
    const meta = node.meta ?? {};
    terms.set(id, {
      label: node.lbl ?? null,
      synonyms: (meta.synonyms ?? []).map((s) => s.val).filter(Boolean),
      definition: meta.definition?.val ?? null,
      deprecated: meta.deprecated === true,
    });
  }
  return terms;
}

export function loadHpo({ hpJsonPath }) {
  const json = JSON.parse(readFileSync(hpJsonPath, 'utf8'));
  return { version: hpoVersionOf(json), terms: parseHpoJson(json) };
}

/**
 * ¿El ítem de Wikidata y el término HPO son el mismo concepto? La equivalencia
 * la DECLARA Wikidata (P3841); acá solo se comprueba que la etiqueta inglesa del
 * ítem sea la etiqueta o un sinónimo exacto del término HPO (sin distinguir
 * mayúsculas). Si no coincide, la definición NO se publica.
 */
export function labelAgrees(wikidataLabels, hpoTerm) {
  if (!hpoTerm) return false;
  const forms = new Set([hpoTerm.label, ...hpoTerm.synonyms].filter(Boolean).map(tokenKey));
  return [wikidataLabels].flat().filter(Boolean).some((l) => forms.has(tokenKey(l)));
}

export const HPO_LICENSE =
  'HPO License: uso libre citando al Human Phenotype Ontology Consortium, mostrando la versión y sin alterar el contenido (https://human-phenotype-ontology.github.io/license.html)';
export const HPO_LICENSE_URL = 'https://human-phenotype-ontology.github.io/license.html';
export const hpoTermUrl = (hpId) => `http://purl.obolibrary.org/obo/HP_${hpId.slice(3)}`;
