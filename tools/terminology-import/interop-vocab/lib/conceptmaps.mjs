// =============================================================================
// ConceptMap de FHIR (R4/R4B/R5 core) → equivalencias entre conceptos que YA están en el
// corpus. Sólo se carga un par cuando (a) la licencia del recurso se reconoce como abierta,
// (b) sus dos code systems y sus dos códigos existen en la edición del mismo paquete y
// (c) la relación que publica el mapa tiene concepto interno equivalente. Nada se infiere.
// =============================================================================

import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { classifyLicense } from './fhir.mjs';

/**
 * Relación del mapa → clave de equivalencia interna (`concepts.ts`: equivalent/wider/narrower/inexact/unmatched).
 * R4 `equivalence` y R5 `relationship`. R5 invierte el eje: «source-is-narrower-than-target» es el `wider` de R4 y
 * «source-is-broader-than-target» es el `narrower` de R4 (tabla de conversión de ConceptMap.relationship en R5).
 * `equal` (R4) se carga como `equivalent`. Sin concepto interno (no se carga): relatedto, subsumes, specializes,
 * disjoint, not-related-to, related-to.
 */
export const RELATION_TO_EQUIVALENCE = {
  equivalent: 'equivalent',
  equal: 'equivalent',
  wider: 'wider',
  narrower: 'narrower',
  inexact: 'inexact',
  unmatched: 'unmatched',
  'source-is-narrower-than-target': 'wider',
  'source-is-broader-than-target': 'narrower',
  equivalence: null,
};

/**
 * @param {string} rawDir
 * @param {Array<{key: string, name: string, version: string, dir: string, tarballSha256: string, tarballUrl: string, retrievedAt: string}>} packages
 * @param {(packageKey: string, url: string, version?: string) => ({internalCode: string, version: string, has: (code: string) => boolean})|null} resolveSystem
 */
export function buildConceptMaps(packages, resolveSystem) {
  const out = [];
  const coverage = { maps: [], elements: { loaded: 0, noInternalEquivalence: 0, endpointMissing: 0, licenseRejected: 0 }, byRelation: {} };
  for (const pkg of packages) {
    if (pkg.key === 'tho-r4') continue; // THO no publica ConceptMap
    const files = readdirSync(pkg.dir).filter((f) => f.startsWith('ConceptMap-') && f.endsWith('.json')).sort();
    for (const file of files) {
      const buf = readFileSync(join(pkg.dir, file));
      const fileSha = createHash('sha256').update(buf).digest('hex');
      const cm = JSON.parse(buf.toString('utf8'));
      const row = { url: cm.url, version: cm.version ?? pkg.version, package: pkg.key, file };
      const copyright = (cm.copyright ?? '').replace(/\s+/g, ' ').trim();
      const lic = classifyLicense({ url: cm.url, copyright });
      let loaded = 0;
      let skipped = 0;
      if (!lic.ok) {
        const n = (cm.group ?? []).reduce((a, g) => a + (g.element ?? []).reduce((b, e) => b + (e.target ?? []).length, 0), 0);
        coverage.elements.licenseRejected += n;
        coverage.maps.push({ ...row, decision: 'omitido', reason: `licencia: ${lic.reason}`, elements: n });
        continue;
      }
      for (const g of cm.group ?? []) {
        const src = g.source ? resolveSystem(pkg.key, g.source) : null;
        const tgt = g.target ? resolveSystem(pkg.key, g.target) : null;
        for (const e of g.element ?? []) {
          for (const t of e.target ?? []) {
            const rel = t.equivalence ?? t.relationship ?? null;
            coverage.byRelation[rel] = (coverage.byRelation[rel] ?? 0) + 1;
            if (!src || !tgt || !e.code || !t.code || !src.has(e.code) || !tgt.has(t.code)) {
              coverage.elements.endpointMissing++;
              skipped++;
              continue;
            }
            const equivalence = RELATION_TO_EQUIVALENCE[rel] ?? null;
            if (!equivalence) {
              coverage.elements.noInternalEquivalence++;
              skipped++;
              continue;
            }
            out.push({
              kind: 'conceptmap-element',
              mapUrl: cm.url,
              mapVersion: cm.version ?? pkg.version,
              mapName: cm.title ?? cm.name ?? null,
              source: { cs: src.internalCode, version: src.version, code: e.code },
              target: { cs: tgt.internalCode, version: tgt.version, code: t.code },
              relationship: rel,
              equivalence,
              comment: t.comment ?? null,
              provenance: {
                source: pkg.key,
                sourceName: pkg.name,
                sourceVersion: pkg.version,
                sourceUrl: pkg.tarballUrl,
                sourceFile: `package/${file}`,
                sourceSha256: fileSha,
                retrievedAt: pkg.retrievedAt,
                artifactSha256: pkg.tarballSha256,
                license: lic.spdx,
              },
            });
            loaded++;
            coverage.elements.loaded++;
          }
        }
      }
      coverage.maps.push({ ...row, decision: loaded > 0 ? 'cargado' : 'sin pares cargables', loaded, skipped });
    }
  }
  return { elements: out, coverage };
}
