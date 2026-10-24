// =============================================================================
// Consolidación: filas válidas de todas las fuentes → catálogo
// tipo de equipo → fabricante → marca → modelo, con todos los registros de
// cada modelo.
//
// Un «modelo» agrupa las filas del mismo fabricante resuelto con la misma
// marca y el mismo modelo (comparados sin mayúsculas, espacios repetidos ni
// ™/®/©), y además todas las filas que comparten una UDI-DI (la UDI-DI
// identifica un modelo o versión; si dos fuentes la escriben distinto, manda
// la UDI-DI). Nada se rellena: si la fuente no da marca o modelo, queda null.
// =============================================================================

import { md5uuid } from '../../../lib/glossary-es/load-plan.mjs';
import { rowKey } from './exchange.mjs';

/** Jurisdicción del registro según la fuente (prefijo de `source`). */
const JURISDICTION_BY_PREFIX = [
  ['fda-', 'US'],
  ['eudamed-', 'EU'],
  ['mhra-', 'GB'],
  ['swissmedic-', 'CH'],
  ['anvisa-', 'BR'],
  ['hc-', 'CA'],
  ['tga-', 'AU'],
  ['pmda-', 'JP'],
  ['mhlw-', 'JP'],
  ['nmpa-', 'CN'],
  ['mfds-', 'KR'],
  ['cdsco-', 'IN'],
  ['cofepris-', 'MX'],
  ['agemed-', 'BO'],
  ['invima-', 'CO'],
  ['digemid-', 'PE'],
  ['anmat-', 'AR'],
  ['isp-', 'CL'],
  ['hsa-', 'SG'],
  ['sfda-', 'SA'],
  ['mda-', 'MY'],
  ['tfda-', 'TW'],
  ['hk-', 'HK'],
  ['thai-fda-', 'TH'],
  ['nz-', 'NZ'],
  ['medsafe-', 'NZ'],
  ['sahpra-', 'ZA'],
  ['roszdravnadzor-', 'RU'],
];

export function jurisdictionOf(source, region = null) {
  for (const [p, j] of JURISDICTION_BY_PREFIX) if (source.startsWith(p)) return j;
  return region === 'us' ? 'US' : null;
}

/** Clave de comparación de marca o modelo (no se muestra; se guarda el verbatim). */
export function labelKey(s) {
  if (s === null || s === undefined) return '';
  // Los símbolos van antes de NFKC, que convierte ™ en «TM».
  return s
    .replace(/[™®©℠]/g, '')
    .normalize('NFKC')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();
}

class UF {
  constructor(n) {
    this.p = Int32Array.from({ length: n }, (_, i) => i);
  }
  find(x) {
    while (this.p[x] !== x) {
      this.p[x] = this.p[this.p[x]];
      x = this.p[x];
    }
    return x;
  }
  union(a, b) {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra !== rb) this.p[Math.max(ra, rb)] = Math.min(ra, rb);
  }
}

const mostCommon = (values) => {
  const c = new Map();
  for (const v of values) if (v !== null && v !== undefined) c.set(v, (c.get(v) ?? 0) + 1);
  return [...c.entries()].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])))[0]?.[0] ?? null;
};

/**
 * @param {object[]} rows          filas válidas (con `_region` opcional)
 * @param {import('./taxonomy.mjs').Taxonomy} taxonomy
 * @param {{ entities: object[], entityOfRow: Map<string,string> }} resolution
 */
export function consolidate(rows, taxonomy, resolution) {
  const entityById = new Map(resolution.entities.map((e) => [e.id, e]));
  const included = [];
  const excluded = { notDiagnostic: 0, undetermined: 0, undeterminedByType: new Map(), noType: 0 };
  for (const row of rows) {
    const d = taxonomy.decideRow(row);
    if (d.diagnostic === true) included.push({ row, types: d.types });
    else if (d.diagnostic === false) excluded.notDiagnostic++;
    else {
      excluded.undetermined++;
      if (!d.types.length) excluded.noType++;
      for (const t of d.types) excluded.undeterminedByType.set(t, (excluded.undeterminedByType.get(t) ?? 0) + 1);
    }
  }

  // Agrupar en modelos.
  const uf = new UF(included.length);
  const byLabel = new Map();
  const byUdi = new Map();
  included.forEach((x, i) => {
    const ent = resolution.entityOfRow.get(rowKey(x.row));
    x.entityId = ent;
    const k = `${ent}\u0000${labelKey(x.row.brandName)}\u0000${labelKey(x.row.model)}`;
    if (byLabel.has(k)) uf.union(byLabel.get(k), i);
    else byLabel.set(k, i);
    const udi = x.row.udiDi?.trim();
    if (udi) {
      const uk = `${ent}\u0000${udi}`;
      if (byUdi.has(uk)) uf.union(byUdi.get(uk), i);
      else byUdi.set(uk, i);
    }
  });
  const groups = new Map();
  included.forEach((_, i) => {
    const r = uf.find(i);
    if (!groups.has(r)) groups.set(r, []);
    groups.get(r).push(i);
  });

  const models = [];
  for (const idx of groups.values()) {
    const xs = idx.map((i) => included[i]);
    const ent = entityById.get(xs[0].entityId);
    const brand = mostCommon(xs.map((x) => x.row.brandName));
    const model = mostCommon(xs.map((x) => x.row.model));
    const id = md5uuid(`mantra:dx-devices:model:${ent.anchor}:${labelKey(brand)}:${labelKey(model)}:${mostCommon(xs.map((x) => x.row.udiDi)) ?? ''}`);
    const registrations = xs
      .map(({ row }) => ({
        source: row.source,
        sourceRecordId: row.sourceRecordId,
        sourceUrl: row.sourceUrl,
        sourceVersion: row.sourceVersion,
        retrievedAt: row.retrievedAt,
        jurisdiction: jurisdictionOf(row.source, row._region ?? null),
        authorizationId: row.authorizationId,
        authorizationDate: row.authorizationDate,
        riskClass: row.riskClass,
        status: row.status,
        udiDi: row.udiDi,
        manufacturerName: row.manufacturerName,
        brandName: row.brandName,
        model: row.model,
      }))
      .sort((a, b) => a.source.localeCompare(b.source) || a.sourceRecordId.localeCompare(b.sourceRecordId));
    models.push({
      id,
      manufacturerId: ent.id,
      manufacturerName: ent.displayName,
      brand,
      brandVariants: [...new Set(xs.map((x) => x.row.brandName).filter(Boolean))].sort(),
      model,
      modelVariants: [...new Set(xs.map((x) => x.row.model).filter(Boolean))].sort(),
      udiDis: [...new Set(xs.map((x) => x.row.udiDi).filter(Boolean))].sort(),
      deviceTypes: [...new Set(xs.flatMap((x) => x.types))].sort(),
      jurisdictions: [...new Set(registrations.map((r) => r.jurisdiction).filter(Boolean))].sort(),
      registrations,
    });
  }
  models.sort((a, b) => a.manufacturerName.localeCompare(b.manufacturerName) || String(a.brand).localeCompare(String(b.brand)) || String(a.model).localeCompare(String(b.model)) || a.id.localeCompare(b.id));

  // Fabricantes con lo que fabrican (solo los que tienen algún modelo de diagnóstico).
  const perEntity = new Map();
  for (const m of models) {
    if (!perEntity.has(m.manufacturerId)) perEntity.set(m.manufacturerId, { models: 0, brands: new Set(), types: new Set(), jurisdictions: new Set() });
    const p = perEntity.get(m.manufacturerId);
    p.models++;
    if (m.brand) p.brands.add(m.brand);
    for (const t of m.deviceTypes) p.types.add(t);
    for (const j of m.jurisdictions) p.jurisdictions.add(j);
  }
  const manufacturers = resolution.entities
    .filter((e) => perEntity.has(e.id))
    .map((e) => {
      const p = perEntity.get(e.id);
      return { ...e, diagnosticModels: p.models, brands: [...p.brands].sort(), deviceTypes: [...p.types].sort(), jurisdictions: [...p.jurisdictions].sort() };
    });

  return { models, manufacturers, included: included.length, excluded };
}
