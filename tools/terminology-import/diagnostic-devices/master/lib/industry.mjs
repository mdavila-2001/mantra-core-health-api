// =============================================================================
// Fabricantes y marcas en listados del sector (asociaciones y ferias), cada uno
// con la URL que lo afirma. Vienen de `data/industry-directories.json`.
//
// No son registros sanitarios: no crean modelos ni fusionan fabricantes. Cada
// mención se cruza con los fabricantes resueltos por la misma clave
// normalizada; las que no cruzan quedan como «candidatos solo en listados del
// sector», para buscar su registro en la próxima pasada.
// =============================================================================

import { existsSync, readFileSync } from 'node:fs';
import { normalizeManufacturerName } from './manufacturers.mjs';

export function loadIndustryDirectories(path) {
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf8'));
}

/**
 * @returns {{ mentions: object[], candidates: object[], stats: object }}
 *   mentions   una por mención, con `entityId` si cruzó
 *   candidates una por empresa (clave) que no cruzó, con todas sus evidencias
 */
export function matchIndustry(data, entities) {
  const byKey = new Map();
  for (const e of entities)
    for (const k of e.normalizedKeys) if (!byKey.has(k)) byKey.set(k, e.id);
  const mentions = [];
  const candidates = new Map();
  for (const org of data?.organizations ?? []) {
    for (const m of org.mentions ?? []) {
      const { key } = normalizeManufacturerName(m.company);
      const entityId = byKey.get(key) ?? null;
      const rec = {
        organizationId: org.id,
        organization: org.name,
        organizationKind: org.kind,
        company: m.company,
        normalizedKey: key,
        brands: m.brands ?? [],
        edition: m.edition ?? null,
        evidenceUrl: m.evidenceUrl,
        evidenceKind: m.evidenceKind,
        flag: m.flag ?? null,
        method: data.method ?? null,
        retrievedAt: data.retrievedAt ?? null,
        entityId,
      };
      mentions.push(rec);
      if (!entityId) {
        if (!candidates.has(key))
          candidates.set(key, {
            normalizedKey: key,
            names: new Set(),
            brands: new Set(),
            evidence: [],
          });
        const c = candidates.get(key);
        c.names.add(m.company);
        for (const b of m.brands ?? []) c.brands.add(b);
        c.evidence.push({
          organizationId: org.id,
          edition: rec.edition,
          url: rec.evidenceUrl,
          kind: rec.evidenceKind,
          flag: rec.flag,
        });
      }
    }
  }
  const cand = [...candidates.values()]
    .map((c) => ({
      normalizedKey: c.normalizedKey,
      names: [...c.names].sort(),
      brands: [...c.brands].sort(),
      evidence: c.evidence,
    }))
    .sort((a, b) => a.normalizedKey.localeCompare(b.normalizedKey));
  const matchedKeys = new Set(
    mentions.filter((m) => m.entityId).map((m) => m.normalizedKey),
  );
  return {
    mentions,
    candidates: cand,
    stats: {
      organizations: data?.organizations?.length ?? 0,
      mentions: mentions.length,
      companies: new Set(mentions.map((m) => m.normalizedKey)).size,
      companiesMatchedToRegistry: matchedKeys.size,
      companiesOnlyInIndustryLists: cand.length,
    },
  };
}
