// =============================================================================
// Subconjuntos de MEDLINE (revisiones Cochrane, guías de práctica clínica,
// ensayos aleatorizados) → intervención no farmacológica ↔ condición, según la
// INDEXACIÓN MeSH de NLM (metadatos de MEDLINE, sin texto de los artículos).
//
// Un registro aporta el par (procedimiento, condición) cuando NLM lo indexó con:
//  - un descriptor de intervención no farmacológica (árbol MeSH, ver mesh.mjs), y
//  - un descriptor de condición (árbol C/F03) con algún calificador terapéutico
//    no farmacológico: therapy Q000628, surgery Q000601, rehabilitation Q000534,
//    diet therapy Q000178, radiotherapy Q000532, prevention & control Q000517.
//    «drug therapy» Q000188 no cuenta (es de la sesión de fármacos).
// Las publicaciones retractadas (tipo D016441) no aportan.
//
// El tipo de relación depende del subconjunto (`PUBMED_SUBSETS`) y nunca dice que
// la intervención funcione ni que esté indicada: una revisión o un ensayo
// pueden concluir lo contrario, y una guía puede desaconsejarla.
// =============================================================================

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { assertionRecord, procedureRecord } from '../records.mjs';
import { meshUri } from './ctgov.mjs';
import {
  isCondition,
  isNonPharmacologicalIntervention,
  meshInterventionCategory,
} from './mesh.mjs';

export const THERAPEUTIC_QUALIFIERS = {
  Q000628: 'therapy',
  Q000601: 'surgery',
  Q000534: 'rehabilitation',
  Q000178: 'diet therapy',
  Q000532: 'radiotherapy',
  Q000517: 'prevention & control',
};

/** Subconjuntos de MEDLINE: búsqueda exacta, carpeta de caché y tipo de relación. */
export const PUBMED_SUBSETS = {
  cochrane: {
    cache: 'pubmed-cochrane',
    term: '"Cochrane Database Syst Rev"[Journal]',
    name: 'Revisiones Cochrane en MEDLINE/PubMed',
    typeCode: 'pubmed-cochrane:co-indexed',
  },
  guidelines: {
    cache: 'pubmed-guidelines',
    term: '(Guideline[pt] OR Practice Guideline[pt])',
    name: 'Guías de práctica clínica en MEDLINE/PubMed',
    typeCode: 'pubmed-guideline:co-indexed',
  },
  rct: {
    cache: 'pubmed-rct',
    term: 'Randomized Controlled Trial[pt]',
    name: 'Ensayos controlados aleatorizados en MEDLINE/PubMed',
    typeCode: 'pubmed-rct:co-indexed',
  },
  reviews: {
    cache: 'pubmed-reviews',
    // Las revisiones Cochrane ya son su propio subconjunto.
    term: '(Systematic Review[pt] OR Meta-Analysis[pt]) NOT "Cochrane Database Syst Rev"[Journal]',
    name: 'Revisiones sistemáticas y metaanálisis (fuera de Cochrane) en MEDLINE/PubMed',
    typeCode: 'pubmed-review:co-indexed',
  },
  trials: {
    cache: 'pubmed-trials',
    // Los aleatorizados ya son su propio subconjunto.
    term: 'Clinical Trial[pt] NOT Randomized Controlled Trial[pt]',
    name: 'Ensayos clínicos no aleatorizados en MEDLINE/PubMed',
    typeCode: 'pubmed-trial:co-indexed',
  },
};

const RETRACTED_PUBLICATION = 'D016441';
export const pubmedUri = (pmid) => `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`;

/** Un `<PubmedArticle>` → metadatos (sin texto de la revisión). */
export function parsePubmedArticle(xml) {
  const pmid = xml.match(/<PMID[^>]*>(\d+)<\/PMID>/)?.[1];
  if (!pmid) return null;
  const status = xml.match(/<MedlineCitation Status="([^"]+)"/)?.[1] ?? null;
  const rev = xml.match(
    /<DateRevised><Year>(\d+)<\/Year><Month>(\d+)<\/Month><Day>(\d+)<\/Day><\/DateRevised>/,
  );
  const pubTypes = [
    ...xml.matchAll(/<PublicationType UI="(D\d+)">([^<]*)<\/PublicationType>/g),
  ].map((m) => ({ ui: m[1], name: m[2] }));
  const mesh = [...xml.matchAll(/<MeshHeading>([\s\S]*?)<\/MeshHeading>/g)].map(
    (h) => ({
      descriptor:
        h[1]
          .match(/<DescriptorName UI="(D\d+)" MajorTopicYN="([YN])"/)
          ?.slice(1, 3) ?? null,
      qualifiers: [
        ...h[1].matchAll(/<QualifierName UI="(Q\d+)" MajorTopicYN="([YN])"/g),
      ].map((q) => [q[1], q[2]]),
    }),
  );
  return {
    pmid,
    status,
    dateRevised: rev ? `${rev[1]}-${rev[2]}-${rev[3]}` : null,
    pubTypes,
    mesh: mesh
      .filter((m) => m.descriptor)
      .map((m) => ({
        ui: m.descriptor[0],
        major: m.descriptor[1] === 'Y',
        qualifiers: m.qualifiers.map(([ui, major]) => ({
          ui,
          major: major === 'Y',
        })),
      })),
  };
}

export function* pubmedRecords(dir) {
  for (const f of readdirSync(dir)
    .filter((x) => x.endsWith('.json.gz'))
    .sort()) {
    yield* JSON.parse(gunzipSync(readFileSync(join(dir, f))).toString('utf8'));
  }
}

export function pubmedSubsetCorpus(
  records,
  mesh,
  meta,
  meshMeta,
  typeCode = PUBMED_SUBSETS.cochrane.typeCode,
) {
  const pairs = new Map(); // "Dproc|Dcond" → Set<PMID>
  const stats = {
    records: 0,
    retracted: 0,
    withProcedure: 0,
    withTherapeuticCondition: 0,
    withPair: 0,
  };
  for (const r of records) {
    stats.records++;
    if (r.pubTypes.some((p) => p.ui === RETRACTED_PUBLICATION)) {
      stats.retracted++;
      continue;
    }
    const procs = r.mesh
      .filter((h) => isNonPharmacologicalIntervention(mesh.get(h.ui)))
      .map((h) => h.ui);
    const conds = r.mesh
      .filter(
        (h) =>
          isCondition(mesh.get(h.ui)) &&
          h.qualifiers.some((q) => THERAPEUTIC_QUALIFIERS[q.ui]),
      )
      .map((h) => h.ui);
    if (procs.length) stats.withProcedure++;
    if (conds.length) stats.withTherapeuticCondition++;
    if (!procs.length || !conds.length) continue;
    stats.withPair++;
    for (const p of new Set(procs)) {
      for (const c of new Set(conds)) {
        if (p === c) continue;
        const key = `${p}|${c}`;
        (pairs.get(key) ?? pairs.set(key, new Set()).get(key)).add(r.pmid);
      }
    }
  }
  const assertions = [];
  const procedureCodes = new Set();
  for (const [key, set] of pairs) {
    const [p, c] = key.split('|');
    const pmids = [...set].sort((a, b) => Number(a) - Number(b));
    procedureCodes.add(p);
    assertions.push(
      assertionRecord({
        typeCode,
        subject: { system: 'mesh', code: p, label: mesh.get(p).name },
        object: { system: 'mesh', code: c, label: mesh.get(c).name },
        sourceRecordId: key,
        uri: pubmedUri(pmids[0]),
        evidence: {
          reviewCount: pmids.length,
          pmids,
          pmidUriTemplate: 'https://pubmed.ncbi.nlm.nih.gov/{pmid}/',
          conditionQualifiers: Object.values(THERAPEUTIC_QUALIFIERS),
        },
        meta,
      }),
    );
  }
  const procedures = [...procedureCodes].sort().map((ui) =>
    procedureRecord({
      system: 'mesh',
      code: ui,
      display: mesh.get(ui).name,
      category: meshInterventionCategory(mesh.get(ui)),
      owned: true,
      meta: meshMeta,
      uri: meshUri(ui),
      extra: { meshTrees: mesh.get(ui).trees },
    }),
  );
  return { assertions, procedures, stats: { ...stats, pairs: pairs.size } };
}

/** Compatibilidad con la pasada 6 (revisiones Cochrane). */
export const cochraneCorpus = pubmedSubsetCorpus;
export const cochraneRecords = pubmedRecords;
