// =============================================================================
// Taxonomía de tipos de equipo de diagnóstico.
//
// Une tres nomenclaturas sin inventar mapeos entre ellas:
//   fda-product-code  nodos de la Product Classification Database (todos los
//                     product codes; `diagnostic` según `cfr.mjs`).
//   emdn              nodos vistos en los registros (EUDAMED y otros) y, si
//                     está disponible, el archivo EMDN completo. Jerarquía por
//                     la estructura publicada del código (categoría = letra,
//                     grupo = 2 dígitos, cada nivel siguiente = 2 dígitos).
//   gmdn / gmdn-pt    términos que publican las fuentes abiertas (GUDID da el
//                     nombre y la definición del término preferido, y desde
//                     su actualización también el código).
//   otros             nomenclaturas nacionales (`jmdn`, `cnd`, `<iso2>:…`).
//
// Mapeos: solo los que **publica** una fuente. Hoy son los de un mismo
// registro que declara dos tipos a la vez (GUDID: product code + GMDN de la
// misma UDI-DI). Cada mapeo guarda cuántos registros lo declaran y ejemplos.
// Una nomenclatura sin criterio propio de «diagnóstico» hereda la decisión
// solo por esos mapeos publicados y solo si todos sus destinos coinciden.
// =============================================================================

/** Categoría W de la EMDN: «In vitro diagnostic medical devices». */
export const EMDN_IVD_CATEGORY = 'W';
export const EMDN_IVD_URL =
  'https://www.medtecheurope.org/wp-content/uploads/2025/05/250522_medtech-europe_emdn-booklet-final2.pdf';

/**
 * Esquemas de clase de riesgo exclusivos de IVD: Reglamento (UE) 2017/746
 * (`eu-ivdr:A`…`D`), Directiva 98/79/CE (`eu-ivdd:…`) y las clases IVD de la
 * TGA (`au:Class 1 - IVD` … `au:Class 4 - IVD`).
 */
export const IVD_RISK_CLASS = /^(eu-ivdr|eu-ivdd):|^au:.*\bIVD\b/;

/**
 * Fuentes cuyo alcance publicado es, por definición, un listado de pruebas de
 * diagnóstico. CDC LIVD: «maps all SARS-CoV-2 diagnostic tests that have
 * received FDA Emergency Use Authorizations»
 * (https://www.cdc.gov/locs/2020/new_livd_test_code_mappings_for_sars-cov-2_test_results.html).
 */
export const DIAGNOSTIC_SCOPE_SOURCES = Object.freeze({
  'cdc-livd-sars-cov-2':
    'https://www.cdc.gov/locs/2020/new_livd_test_code_mappings_for_sars-cov-2_test_results.html',
});

/**
 * Tipos de licencia de un registro que el regulador define solo para IVD.
 * Health Canada: la licencia «Test Kit» es un tipo de solicitud de IVDD
 * («Guidance for determining medical device application type: Application
 * type for IVDDs»). No se verificó el texto de SOR/98-282 art. 1.
 */
export const IVD_LICENCE_TYPES = Object.freeze({
  'hc-mdall': {
    values: ['Test Kit'],
    url: 'https://www.canada.ca/en/health-canada/services/drugs-health-products/medical-devices/application-information/guidance-documents/guidance-determining-medical-device-application-type/application-type-ivdd.html',
  },
});

/**
 * Áreas de interés con que ANVISA tramita un registro (`DESC_AREA_INTERESSE`
 * de los archivos `CICLO_ANALISE_PETICOES_*` de https://dados.anvisa.gov.br/dados/,
 * unidas por número de proceso en `extra.anvisaPetitions.areas`). Solo cuando
 * todas las áreas del proceso son de diagnóstico in vitro; si se mezcla con
 * «Dispositivos Médicos» o «Correlatos» queda sin decisión.
 */
export const IVD_INTEREST_AREAS = Object.freeze({
  sources: ['anvisa-produtos', 'anvisa-produtos-modelos'],
  values: [
    'Dispositivos Médicos para Diagnóstico in Vitro',
    'Produtos para diagnóstico de uso in vitro',
  ],
  url: 'https://dados.anvisa.gov.br/dados/',
});

/**
 * Sistemas que son niveles o versiones de una misma clasificación del mismo
 * regulador: que una fila declare los dos no es un mapeo entre nomenclaturas.
 * TFDA: la categoría (A–P, o el código de 4 dígitos) y el código de
 * clasificación (`A.1345`) son de la misma clasificación del 醫療器材分類分級管理辦法.
 */
export const NOMENCLATURE_FAMILY = Object.freeze({
  'tw:tfda-category': 'tw:tfda',
  'tw:tfda-classification': 'tw:tfda',
});
const familyOf = (system) => NOMENCLATURE_FAMILY[system] ?? system;

export const nodeKey = (system, code, name) =>
  `${system}|${code ?? `name:${(name ?? '').trim().toUpperCase()}`}`;

/** Padre estructural de un código EMDN (`W0101060101` → `W01010601`). */
export function emdnParent(code) {
  if (!/^[A-Z]\d*$/.test(code)) return null;
  if (code.length <= 1) return null;
  if (code.length === 3) return code.slice(0, 1);
  if (code.length < 3 || (code.length - 3) % 2 !== 0) return null;
  return code.slice(0, -2);
}

/** Tipos que declara una fila: el principal y los de `extra.deviceTypes`. */
export function typesOfRow(row) {
  const out = [];
  if (row.deviceTypeSystem && (row.deviceTypeCode || row.deviceTypeName)) {
    out.push({
      system: row.deviceTypeSystem,
      code: row.deviceTypeCode ?? null,
      name: row.deviceTypeName ?? null,
      definition: null,
      primary: true,
    });
  }
  for (const t of row.extra?.deviceTypes ?? []) {
    if (!t?.system || !(t.code || t.name)) continue;
    out.push({
      system: t.system,
      code: t.code ?? null,
      name: t.name ?? null,
      definition: t.definition ?? null,
      primary: false,
    });
  }
  return out;
}

export class Taxonomy {
  constructor() {
    /** @type {Map<string, object>} */
    this.nodes = new Map();
    /** @type {Map<string, object>} crosswalk publicado, clave from→to */
    this.crosswalks = new Map();
  }

  addNode(node) {
    const key = nodeKey(node.system, node.code, node.name);
    const prev = this.nodes.get(key);
    if (!prev) {
      this.nodes.set(key, {
        key,
        ...node,
        names: node.name ? [node.name] : [],
        seenIn: new Set(
          node.provenance?.source ? [node.provenance.source] : [],
        ),
      });
      return this.nodes.get(key);
    }
    if (node.name && !prev.names.includes(node.name))
      prev.names.push(node.name);
    if (!prev.name && node.name) prev.name = node.name;
    if (!prev.definition && node.definition) prev.definition = node.definition;
    if (node.provenance?.source) prev.seenIn.add(node.provenance.source);
    return prev;
  }

  /** Nodo visto en un registro (EMDN, GMDN, nacional). FDA ya viene del PCD. */
  addFromRow(row) {
    const types = typesOfRow(row);
    const prov = {
      source: row.source,
      sourceRecordId: row.sourceRecordId,
      sourceUrl: row.sourceUrl,
      sourceVersion: row.sourceVersion,
      retrievedAt: row.retrievedAt,
    };
    const keys = [];
    for (const t of types) {
      const existing = this.nodes.get(nodeKey(t.system, t.code, t.name));
      if (t.system === 'fda-product-code' && !existing) {
        // Un product code que el PCD no tiene (más nuevo que la copia, o mal
        // escrito en la fuente) entra como nodo sin decisión.
        this.addNode({
          system: t.system,
          code: t.code,
          name: t.name,
          definition: null,
          parent: null,
          diagnostic: null,
          branch: null,
          basis: 'fda-code-not-in-pcd',
          attributes: {},
          provenance: prov,
        });
      } else if (t.system === 'emdn' && t.code) {
        this.addEmdn(t.code, t.name, prov);
      } else if (!existing) {
        this.addNode({
          system: t.system,
          code: t.code,
          name: t.name,
          definition: t.definition,
          parent: null,
          diagnostic: null,
          branch: null,
          basis: null,
          attributes: {},
          provenance: prov,
        });
      } else {
        this.addNode({
          system: t.system,
          code: t.code,
          name: t.name,
          definition: t.definition,
          provenance: prov,
        });
      }
      keys.push(nodeKey(t.system, t.code, t.name));
    }
    // Mapeo publicado: la misma fila declara varios tipos.
    for (let i = 0; i < keys.length; i++) {
      for (let j = 0; j < keys.length; j++) {
        if (i === j || familyOf(types[i].system) === familyOf(types[j].system))
          continue;
        const k = `${keys[i]}→${keys[j]}`;
        const cw = this.crosswalks.get(k) ?? {
          from: keys[i],
          to: keys[j],
          records: 0,
          sources: new Set(),
          samples: [],
        };
        cw.records++;
        cw.sources.add(row.source);
        if (cw.samples.length < 5)
          cw.samples.push({
            source: row.source,
            sourceRecordId: row.sourceRecordId,
            sourceUrl: row.sourceUrl,
          });
        this.crosswalks.set(k, cw);
      }
    }
    return keys;
  }

  addEmdn(code, name, provenance) {
    const node = this.addNode({
      system: 'emdn',
      code,
      name,
      definition: null,
      parent: emdnParent(code),
      diagnostic: code.startsWith(EMDN_IVD_CATEGORY) ? true : null,
      branch: code.startsWith(EMDN_IVD_CATEGORY) ? 'ivd' : null,
      basis: code.startsWith(EMDN_IVD_CATEGORY) ? 'emdn-category-w' : null,
      attributes: {
        category: code.slice(0, 1),
        level: code.length === 1 ? 1 : 1 + (code.length - 1) / 2,
      },
      provenance,
    });
    // Ancestros estructurales: el código existe por construcción; el nombre
    // solo si alguna fuente lo publica (si no, queda null).
    for (let p = emdnParent(code); p; p = emdnParent(p)) {
      if (!this.nodes.has(nodeKey('emdn', p))) {
        this.addNode({
          system: 'emdn',
          code: p,
          name: null,
          definition: null,
          parent: emdnParent(p),
          diagnostic: p.startsWith(EMDN_IVD_CATEGORY) ? true : null,
          branch: p.startsWith(EMDN_IVD_CATEGORY) ? 'ivd' : null,
          basis: p.startsWith(EMDN_IVD_CATEGORY) ? 'emdn-category-w' : null,
          attributes: {
            category: p.slice(0, 1),
            level: p.length === 1 ? 1 : 1 + (p.length - 1) / 2,
            structural: true,
          },
          provenance: { source: 'emdn-code-structure' },
        });
      }
    }
    return node;
  }

  /**
   * Nodos sin criterio propio heredan la decisión por los mapeos publicados:
   * `true` si todos sus destinos con decisión son `true`, `false` si todos son
   * `false`, `null` (y `basis: crosswalk-mixed`) si hay de los dos.
   */
  propagateByCrosswalk() {
    const targets = new Map();
    for (const cw of this.crosswalks.values()) {
      const to = this.nodes.get(cw.to);
      if (!to || to.diagnostic === null || to.basis?.startsWith('crosswalk'))
        continue;
      if (!targets.has(cw.from)) targets.set(cw.from, []);
      targets.get(cw.from).push({
        to: cw.to,
        diagnostic: to.diagnostic,
        branch: to.branch,
        records: cw.records,
      });
    }
    let changed = 0;
    for (const [from, list] of targets) {
      const node = this.nodes.get(from);
      if (!node || node.diagnostic !== null) continue;
      const values = new Set(list.map((t) => t.diagnostic));
      if (values.size === 1) {
        node.diagnostic = [...values][0];
        const branches = new Set(
          list.filter((t) => t.diagnostic).map((t) => t.branch),
        );
        node.branch = node.diagnostic
          ? branches.size === 1
            ? [...branches][0]
            : 'mixed'
          : null;
        node.basis = 'crosswalk-published';
      } else {
        node.basis = 'crosswalk-mixed';
      }
      node.crosswalkEvidence = list;
      changed++;
    }
    return changed;
  }

  /**
   * ¿La fila es de un equipo de diagnóstico? `true` si alguno de sus tipos lo
   * es; `false` si todos sus tipos tienen decisión `false`; `null` si no se
   * puede saber (sin tipo, o tipos sin decisión).
   */
  decideRow(row) {
    const keys = typesOfRow(row).map((t) => nodeKey(t.system, t.code, t.name));
    const nodes = keys.map((k) => this.nodes.get(k)).filter(Boolean);
    const dx = nodes.filter((n) => n.diagnostic === true);
    if (dx.length) return { diagnostic: true, types: dx.map((n) => n.key) };
    if (nodes.length && nodes.every((n) => n.diagnostic === false))
      return { diagnostic: false, types: nodes.map((n) => n.key) };
    // Clase de riesgo de un esquema que el regulador define solo para IVD
    // (IVDR/IVDD de la UE, «Class N - IVD» de la TGA): es diagnóstico in vitro
    // por definición del propio registro.
    const lic = IVD_LICENCE_TYPES[row.source];
    if (lic && lic.values.includes(row.extra?.licenceType))
      return {
        diagnostic: true,
        types: [
          ...nodes.map((n) => n.key),
          `ivd-licence-type|${row.source}:${row.extra.licenceType}`,
        ],
      };
    const areas = row.extra?.anvisaPetitions?.areas;
    if (
      IVD_INTEREST_AREAS.sources.includes(row.source) &&
      Array.isArray(areas) &&
      areas.length &&
      areas.every((a) => IVD_INTEREST_AREAS.values.includes(a))
    )
      return {
        diagnostic: true,
        types: [...nodes.map((n) => n.key), `ivd-interest-area|${row.source}`],
      };
    if (DIAGNOSTIC_SCOPE_SOURCES[row.source])
      return {
        diagnostic: true,
        types: [...nodes.map((n) => n.key), `source-scope|${row.source}`],
      };
    if (row.riskClass && IVD_RISK_CLASS.test(row.riskClass))
      return {
        diagnostic: true,
        types: [...nodes.map((n) => n.key), `ivd-risk-class|${row.riskClass}`],
      };
    return { diagnostic: null, types: nodes.map((n) => n.key) };
  }

  /** Nodos y mapeos serializables (Sets → listas). */
  toJSON() {
    return {
      nodes: [...this.nodes.values()].map((n) => ({
        ...n,
        seenIn: [...n.seenIn].sort(),
      })),
      crosswalks: [...this.crosswalks.values()].map((c) => ({
        ...c,
        sources: [...c.sources].sort(),
      })),
    };
  }
}
