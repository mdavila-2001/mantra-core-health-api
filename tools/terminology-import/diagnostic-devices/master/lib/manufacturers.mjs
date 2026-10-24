// =============================================================================
// Resolución de fabricantes: de razones sociales verbatim de cada registro a
// entidades únicas, con la procedencia de cada fusión.
//
// 1. Normalización (solo para comparar; el nombre original se guarda siempre):
//    Unicode NFKC, sin diacríticos, mayúsculas, `&`/`+` → AND, puntuación →
//    espacio, sin el artículo inicial THE y sin sufijos societarios al final
//    (INC, LLC, GMBH, S.A. DE C.V., CO., LTD., 株式会社, 有限公司, …).
// 2. Fusiones, de más fuerte a más débil:
//    same-registry-id        mismo id publicado (SRN, FEI, LEI, CNPJ, …).
//    same-name-same-country  misma clave normalizada y mismo país.
//    same-name-unique-country misma clave; una mención sin país y la clave
//                             aparece con un solo país en todo el corpus.
//    same-name-no-country    misma clave, ninguna mención con país.
//    Una fusión por nombre que juntaría dos LEI o dos SRN distintos NO se hace
//    (un LEI y un SRN identifican una sola persona jurídica): va a revisión.
// 3. Grupos y filiales: solo por relaciones publicadas (GLEIF nivel 2,
//    Wikidata P749/P355) que se pasen como entrada; nunca por parecido de
//    nombre. El parecido (misma clave en otro país, misma primera palabra
//    distintiva) se lista para revisión y no se fusiona.
// =============================================================================

import { md5uuid } from '../../../lib/glossary-es/load-plan.mjs';

/**
 * Sufijos societarios, como secuencias de palabras ya normalizadas. Se quitan
 * del final, el más largo primero, repetidamente (`CO LTD`, `GMBH CO KG`).
 */
const LEGAL_SUFFIXES = [
  'S A DE C V',
  'SA DE CV',
  'S DE R L DE C V',
  'S DE RL DE CV',
  'SAPI DE CV',
  'S A P I DE C V',
  'S DE R L',
  'GMBH CO KG',
  'GMBH AND CO KG',
  'AG CO KG',
  'GMBH CO KGAA',
  'CO KG',
  'KGAA',
  'SP Z O O',
  'SP ZOO',
  'S R O',
  'A S',
  'S A S',
  'S A U',
  'S L U',
  'S P A',
  'S R L',
  'S A R L',
  'S L',
  'S A',
  'S C',
  'CO LTD',
  'CO LIMITED',
  'COMPANY LIMITED',
  'CO INC',
  'CO LLC',
  'PTY LTD',
  'PTY LIMITED',
  'PVT LTD',
  'PRIVATE LIMITED',
  'PTE LTD',
  'SDN BHD',
  'L L C',
  'L P',
  'L L P',
  'P L C',
  'N V',
  'B V',
  'K K',
  'G M B H',
  'A G',
  'I N C',
  'INCORPORATED',
  'INC',
  'CORPORATION',
  'CORP',
  'COMPANY',
  'CO',
  'LIMITED',
  'LTD',
  'LTDA',
  'LLC',
  'LLP',
  'LP',
  'PLC',
  'PLLC',
  'GMBH',
  'MBH',
  'AG',
  'KG',
  'OHG',
  'EV',
  'SE',
  'SAS',
  'SARL',
  'SRL',
  'SPA',
  'SA',
  'SAU',
  'SL',
  'SLU',
  'BV',
  'NV',
  'BVBA',
  'SPRL',
  'AB',
  'AS',
  'ASA',
  'APS',
  'OY',
  'OYJ',
  'KFT',
  'ZRT',
  'DOO',
  'D O O',
  'SRO',
  'JSC',
  'PJSC',
  'OJSC',
  'CJSC',
  'OOO',
  'ZAO',
  'AO',
  'PAO',
  'KABUSHIKI KAISHA',
  'KK',
  'YK',
  'PTY',
  'PVT',
  'PTE',
  'BHD',
  'TBK',
  'EIRELI',
  'ME',
  'EPP',
  'SPOLKA AKCYJNA',
];
const SUFFIX_TOKENS = LEGAL_SUFFIXES.map((s) => s.split(' ')).sort(
  (a, b) => b.length - a.length,
);

/** Formas jurídicas en escritura no latina (se quitan donde aparezcan). */
const CJK_FORMS = [
  '股份有限公司',
  '有限责任公司',
  '有限責任公司',
  '有限公司',
  '株式会社',
  '有限会社',
  '合同会社',
  '(株)',
  '（株）',
  '㈱',
  '주식회사',
  '㈜',
  '(주)',
  '（주）',
  '유한회사',
];

/** Palabras demasiado genéricas para sugerir un grupo por la primera palabra. */
const GENERIC_FIRST_TOKENS = new Set([
  'MEDICAL',
  'MEDIZIN',
  'MEDICA',
  'MEDTECH',
  'HEALTH',
  'HEALTHCARE',
  'BIO',
  'BIOTECH',
  'DIAGNOSTIC',
  'DIAGNOSTICS',
  'INTERNATIONAL',
  'GLOBAL',
  'AMERICAN',
  'EUROPEAN',
  'NATIONAL',
  'GENERAL',
  'UNITED',
  'ADVANCED',
  'APPLIED',
  'NEW',
  'FIRST',
  'SHENZHEN',
  'SHANGHAI',
  'BEIJING',
  'GUANGZHOU',
  'JIANGSU',
  'ZHEJIANG',
  'HANGZHOU',
  'TIANJIN',
  'SUZHOU',
  'WUHAN',
  'CHINA',
  'JAPAN',
  'KOREA',
  'INDIA',
  'THE',
  'AND',
  'OF',
  'LABORATORIES',
  'LAB',
  'LABS',
  'SYSTEMS',
  'TECHNOLOGIES',
  'TECHNOLOGY',
  'SOLUTIONS',
  'INSTRUMENTS',
  'DEVICES',
  'SCIENTIFIC',
  'IMAGING',
  'SURGICAL',
  'DENTAL',
  'OPTICAL',
]);

/**
 * Clave de comparación de una razón social. Devuelve `{ key, removed }`:
 * `removed` son los sufijos quitados, para el registro de la normalización.
 */
export function normalizeManufacturerName(raw) {
  let s = (raw ?? '').normalize('NFKC');
  const removed = [];
  for (const f of CJK_FORMS) {
    if (s.includes(f)) {
      removed.push(f);
      s = s.split(f).join(' ');
    }
  }
  s = s
    .normalize('NFD')
    .replace(/\p{M}+/gu, '')
    .toUpperCase()
    .replace(/[&+]/g, ' AND ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
  let tokens = s ? s.split(' ') : [];
  if (tokens[0] === 'THE' && tokens.length > 1) tokens = tokens.slice(1);
  // Quitar sufijos del final hasta que no quede ninguno (sin dejar la clave vacía).
  for (let again = true; again;) {
    again = false;
    for (const suf of SUFFIX_TOKENS) {
      if (
        tokens.length > suf.length &&
        suf.every((t, i) => tokens[tokens.length - suf.length + i] === t)
      ) {
        removed.push(suf.join(' '));
        tokens = tokens.slice(0, tokens.length - suf.length);
        // Un AND colgando («ROCHE AND CO KG» → «ROCHE AND»).
        while (tokens.length > 1 && tokens[tokens.length - 1] === 'AND')
          tokens.pop();
        again = true;
        break;
      }
    }
  }
  return { key: tokens.join(' '), removed };
}

/** Prioridad de esquemas para elegir el ancla estable de una entidad. */
const SCHEME_PRIORITY = [
  'lei',
  'srn',
  'fei',
  'fda-reg',
  'duns',
  'cnpj',
  'artg-sponsor',
];
/** Esquemas que identifican a una sola persona jurídica: dos distintos no se fusionan por nombre. */
const UNIQUE_PER_ENTITY = new Set(['lei', 'srn']);

const schemeOf = (id) => id.slice(0, id.indexOf(':'));
const schemeRank = (id) => {
  const i = SCHEME_PRIORITY.indexOf(schemeOf(id));
  return i === -1 ? SCHEME_PRIORITY.length : i;
};

class UnionFind {
  constructor() {
    this.parent = new Map();
  }
  find(x) {
    if (!this.parent.has(x)) this.parent.set(x, x);
    let r = x;
    while (this.parent.get(r) !== r) r = this.parent.get(r);
    for (let y = x; this.parent.get(y) !== r;) {
      const next = this.parent.get(y);
      this.parent.set(y, r);
      y = next;
    }
    return r;
  }
  union(a, b) {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra === rb) return false;
    if (ra < rb) this.parent.set(rb, ra);
    else this.parent.set(ra, rb);
    return true;
  }
}

/** Ids de fabricante publicados en una fila. */
export function registryIdsOfRow(row) {
  const ids = new Set();
  if (row.manufacturerRegistryId) ids.add(row.manufacturerRegistryId.trim());
  for (const id of row.extra?.manufacturerIds ?? [])
    if (typeof id === 'string' && /^[a-z][a-z0-9-]*:\S/.test(id))
      ids.add(id.trim());
  return [...ids];
}

/**
 * Resuelve fabricantes.
 *
 * @param {Iterable<object>} rows   filas del formato común
 * @param {object} [opts]
 * @param {Array<{child:string,parent:string,relation:string,source:string,url:string}>} [opts.groupLinks]
 *        relaciones publicadas entre ids (`lei:…` → `lei:…`).
 * @returns {{ entities: object[], entityOfRow: Map<string,string>, review: object[] }}
 */
/** Id de la mención (razón social verbatim + país + ids publicados) de una fila. */
export function mentionIdOf(row) {
  const ids = registryIdsOfRow(row).sort();
  return `m:${row.manufacturerName.trim()}|${row.manufacturerCountry ?? ''}|${ids.join(',')}`;
}

export function resolveManufacturers(
  rows,
  { groupLinks = [], trackRows = true } = {},
) {
  const uf = new UnionFind();
  const mentions = new Map(); // mentionId → { name, key, country, ids:Set, rows:[], sources:Set }
  const rowMention = new Map();
  const merges = [];

  for (const row of rows) {
    const { key } = normalizeManufacturerName(row.manufacturerName);
    const country = row.manufacturerCountry ?? null;
    const ids = registryIdsOfRow(row);
    const mid = mentionIdOf(row);
    if (!mentions.has(mid))
      mentions.set(mid, {
        id: mid,
        name: row.manufacturerName.trim(),
        key,
        country,
        ids: new Set(ids),
        rowCount: 0,
        sources: new Set(),
        sample: null,
      });
    const m = mentions.get(mid);
    m.rowCount += row._weight ?? 1;
    m.sources.add(row.source);
    m.sample ??= {
      source: row.source,
      sourceRecordId: row.sourceRecordId,
      sourceUrl: row.sourceUrl,
      sourceVersion: row.sourceVersion,
      retrievedAt: row.retrievedAt,
    };
    if (trackRows)
      rowMention.set(`${row.source}\u0000${row.sourceRecordId}`, mid);
    uf.find(mid);
  }

  // Ids publicados de cada clúster, mantenidos al unir (para no fusionar
  // dos LEI/SRN distintos).
  const idsOfRoot = new Map(
    [...mentions.values()].map((m) => [m.id, new Set(m.ids)]),
  );
  const join = (a, b) => {
    const ra = uf.find(a);
    const rb = uf.find(b);
    if (ra === rb) return false;
    uf.union(ra, rb);
    const r = uf.find(ra);
    const merged = new Set([...idsOfRoot.get(ra), ...idsOfRoot.get(rb)]);
    idsOfRoot.delete(ra);
    idsOfRoot.delete(rb);
    idsOfRoot.set(r, merged);
    return true;
  };
  const conflicts = (idsA, idsB) => {
    for (const a of idsA)
      for (const b of idsB)
        if (
          a !== b &&
          schemeOf(a) === schemeOf(b) &&
          UNIQUE_PER_ENTITY.has(schemeOf(a))
        )
          return [a, b];
    return null;
  };

  // R1: mismo id publicado.
  const byId = new Map();
  for (const m of mentions.values())
    for (const id of m.ids) {
      if (byId.has(id)) {
        const other = byId.get(id);
        if (join(other, m.id))
          merges.push({
            a: other,
            b: m.id,
            rule: 'same-registry-id',
            evidence: { registryId: id, sample: m.sample },
          });
      } else byId.set(id, m.id);
    }

  // R2–R4: por clave normalizada.
  const byKey = new Map();
  for (const m of mentions.values()) {
    if (!m.key) continue;
    if (!byKey.has(m.key)) byKey.set(m.key, []);
    byKey.get(m.key).push(m);
  }
  const review = [];
  for (const [key, list] of byKey) {
    if (list.length < 2) continue;
    const countries = new Set(list.map((m) => m.country).filter(Boolean));
    const tryUnion = (a, b, rule) => {
      const c = conflicts(
        idsOfRoot.get(uf.find(a.id)),
        idsOfRoot.get(uf.find(b.id)),
      );
      if (c) {
        review.push({
          kind: 'name-match-conflicting-ids',
          key,
          mentions: [a.name, b.name],
          ids: c,
          samples: [a.sample, b.sample],
        });
        return;
      }
      if (join(a.id, b.id))
        merges.push({
          a: a.id,
          b: b.id,
          rule,
          evidence: {
            normalizedKey: key,
            country: a.country ?? b.country ?? null,
            samples: [a.sample, b.sample],
          },
        });
    };
    // Por país.
    const byCountry = new Map();
    for (const m of list) {
      const c = m.country ?? '';
      if (!byCountry.has(c)) byCountry.set(c, []);
      byCountry.get(c).push(m);
    }
    for (const [c, ms] of byCountry) {
      for (let i = 1; i < ms.length; i++)
        tryUnion(
          ms[0],
          ms[i],
          c ? 'same-name-same-country' : 'same-name-no-country',
        );
    }
    const noCountry = byCountry.get('') ?? [];
    if (noCountry.length && countries.size === 1) {
      const withCountry = byCountry.get([...countries][0]);
      tryUnion(withCountry[0], noCountry[0], 'same-name-unique-country');
    } else if (noCountry.length && countries.size > 1) {
      review.push({
        kind: 'same-name-ambiguous-country',
        key,
        countries: [...countries].sort(),
        mentions: noCountry.map((m) => m.name),
        samples: noCountry.slice(0, 3).map((m) => m.sample),
      });
    }
    if (countries.size > 1) {
      review.push({
        kind: 'same-name-different-country',
        key,
        countries: [...countries].sort(),
        mentions: [...new Set(list.map((m) => m.name))].slice(0, 10),
      });
    }
  }

  // Entidades.
  const clusters = new Map();
  for (const m of mentions.values()) {
    const r = uf.find(m.id);
    if (!clusters.has(r)) clusters.set(r, []);
    clusters.get(r).push(m);
  }
  const mergesByRoot = new Map();
  for (const x of merges) {
    const r = uf.find(x.a);
    if (!mergesByRoot.has(r)) mergesByRoot.set(r, []);
    mergesByRoot.get(r).push(x);
  }
  const entityOfMention = new Map();
  const entities = [];
  for (const [root, ms] of clusters) {
    const ids = [...new Set(ms.flatMap((m) => [...m.ids]))].sort(
      (a, b) => schemeRank(a) - schemeRank(b) || a.localeCompare(b),
    );
    const byName = new Map();
    for (const m of ms)
      byName.set(m.name, (byName.get(m.name) ?? 0) + m.rowCount);
    const names = [...byName.entries()].sort(
      (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
    );
    const keys = [...new Set(ms.map((m) => m.key))].sort();
    const countries = [
      ...new Set(ms.map((m) => m.country).filter(Boolean)),
    ].sort();
    const anchor = ids[0] ?? `name:${keys[0]}:${countries[0] ?? ''}`;
    const id = md5uuid(`mantra:dx-devices:manufacturer:${anchor}`);
    entities.push({
      id,
      anchor,
      displayName: names[0][0],
      names: names.map(([name, rows]) => ({ name, rows })),
      normalizedKeys: keys,
      countries,
      registryIds: ids,
      sources: [...new Set(ms.flatMap((m) => [...m.sources]))].sort(),
      rowCount: ms.reduce((n, m) => n + m.rowCount, 0),
      merges: (mergesByRoot.get(root) ?? []).map((x) => ({
        rule: x.rule,
        a: mentionLabel(mentions.get(x.a)),
        b: mentionLabel(mentions.get(x.b)),
        evidence: x.evidence,
      })),
      groups: [],
    });
    for (const m of ms) entityOfMention.set(m.id, id);
  }

  // Grupos publicados (no fusionan: enlazan).
  const entityById = new Map(entities.map((e) => [e.id, e]));
  const entityOfRegistryId = new Map();
  for (const e of entities)
    for (const rid of e.registryIds) entityOfRegistryId.set(rid, e.id);
  for (const g of groupLinks) {
    const c = entityOfRegistryId.get(g.child);
    const p = entityOfRegistryId.get(g.parent);
    if (c)
      entityById.get(c).groups.push({
        relation: g.relation,
        parentId: g.parent,
        parentEntityId: p ?? null,
        source: g.source,
        url: g.url,
      });
  }

  // Sugerencias de grupo por primera palabra distintiva (solo revisión).
  const byFirst = new Map();
  for (const e of entities) {
    const first = e.normalizedKeys[0]?.split(' ')[0];
    if (
      !first ||
      first.length < 4 ||
      GENERIC_FIRST_TOKENS.has(first) ||
      /^\d+$/.test(first)
    )
      continue;
    if (!byFirst.has(first)) byFirst.set(first, []);
    byFirst.get(first).push(e);
  }
  for (const [first, es] of byFirst) {
    if (es.length < 2 || es.length > 50) continue;
    review.push({
      kind: 'possible-group-shared-first-word',
      word: first,
      entities: es.map((e) => ({
        id: e.id,
        name: e.displayName,
        countries: e.countries,
      })),
    });
  }

  const entityOfRow = new Map();
  for (const [rk, mid] of rowMention)
    entityOfRow.set(rk, entityOfMention.get(mid));
  entities.sort(
    (a, b) =>
      b.rowCount - a.rowCount || a.displayName.localeCompare(b.displayName),
  );
  const entityOf = (row) => entityOfMention.get(mentionIdOf(row));
  return { entities, entityOfRow, entityOfMention, entityOf, review };
}

function mentionLabel(m) {
  return { name: m.name, country: m.country, registryIds: [...m.ids] };
}
