// =============================================================================
// CodeSystem y ValueSet de FHIR (HL7 Terminology y FHIR core) → registros comunes.
//
// Todo VERBATIM del recurso: código, `display`, `definition`, propiedades,
// designaciones (todas, en su idioma), extensiones y estado. Lo único que se calcula
// es (a) a qué code system interno pertenece (derivado de la URL canónica), (b) si la
// licencia permite cargarlo (lista cerrada, ver `classifyLicense`) y (c) la membresía de
// los value sets, expandiendo `compose` sólo sobre contenido que SÍ se carga.
// =============================================================================

// --- Identidad ----------------------------------------------------------------

const THO_CS = 'http://terminology.hl7.org/CodeSystem/';
const THO_VS = 'http://terminology.hl7.org/ValueSet/';
const FHIR_ROOT = 'http://hl7.org/fhir/';

const slug = (s) => s.replace(/^[a-z]+:\/*/i, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** Código interno estable de un code system, derivado de su URL canónica. */
export function codeSystemInternalCode(url) {
  if (url.startsWith(THO_CS)) return `hl7-tho:${url.slice(THO_CS.length)}`;
  if (url.startsWith(FHIR_ROOT)) return `fhir:${url.slice(FHIR_ROOT.length)}`;
  return `fhir-ext:${slug(url)}`;
}
/** Código interno estable de un value set. */
export function valueSetInternalCode(url) {
  if (url.startsWith(THO_VS)) return `hl7-tho-vs:${url.slice(THO_VS.length)}`;
  if (url.startsWith(`${FHIR_ROOT}ValueSet/`)) return `fhir-vs:${url.slice(`${FHIR_ROOT}ValueSet/`.length)}`;
  return `fhir-ext-vs:${slug(url)}`;
}

// --- Licencia ------------------------------------------------------------------

/** Texto estándar de THO y sellos de HL7 que no limitan el uso. */
const HL7_OPEN_STATEMENT = /(made available under the CC0 designation|licensed under creative commons public domain|^creative commons 0$|are in the public domain and are free to use without restriction)/i;
const HL7_STAMP = /^(HL7 International\.?|HL7 Inc\.?|This is an example set\.?|This is an extensible set\.?)$/i;
/** Marcas de contenido de terceros: si el recurso las nombra, NO se carga (licencia no verificada o restrictiva). */
const THIRD_PARTY =
  /(SNOMED|IHTSDO|\bLOINC\b|Regenstrief|\bDICOM\b|\bNEMA\b|ISO Standard|\bISO\b[ \d/:.-]*(?:TS|standard)|\bASTM\b|\bETSI\b|\bIHE\b|\bAHA\b|\bNUBC\b|\bUB-?0?4\b|\bUB-?92\b|\bNEHTA\b|World Wide Web Consortium|\bW3C\b|\bAMA\b|\bCPT\b|American Medical Association|Third Party IP|American Dental Association|\bNUCC\b)/i;

/** Editor que no es HL7 y cuyo contenido tiene dueño propio (DICOM/NEMA, ISO, SNOMED…): no se carga aunque el recurso no traiga `copyright`. */
const THIRD_PARTY_PUBLISHER = /(NEMA|DICOM|IHTSDO|SNOMED|Regenstrief|LOINC|American (Medical|Dental)|\bADA\b|\bAMA\b|\bISO\b|ASTM|ETSI|W3C|World Wide Web|NUBC|NUCC)/i;

/** Recursos de ejemplo del propio estándar (editor ficticio o sistema externo simulado): HL7 los publica, pero no son terminología. */
export function illustrativeReason(resource) {
  const publisher = resource.publisher ?? '';
  if (/^(Acme Co|FHIR \(Example\))$/i.test(publisher)) return `recurso de ejemplo del estándar (editor «${publisher}»)`;
  if (/\/fhir\/sid\/ex-/.test(resource.url ?? '')) return 'sistema externo simulado con códigos de muestra («ex-»); podría confundirse con el real';
  return null;
}

const isHl7Url = (url) => /^https?:\/\/(terminology\.)?hl7\.org\//i.test(url);

/**
 * @returns {{ ok: boolean, spdx: string|null, reason: string }}
 * Lista cerrada: se carga sólo si el recurso es de HL7 (o declara dominio público/CC0 por sí mismo) y no nombra
 * contenido de terceros. El paquete ya trae `license: CC0-1.0` en su package.json (se verifica en el fetch).
 */
export function classifyLicense(resource) {
  const copyright = (resource.copyright ?? '').replace(/\s+/g, ' ').trim();
  const url = resource.url ?? '';
  if (resource.publisher && THIRD_PARTY_PUBLISHER.test(resource.publisher)) return { ok: false, spdx: null, reason: `editor externo a HL7 con contenido propio: «${resource.publisher}»` };
  if (THIRD_PARTY.test(copyright)) return { ok: false, spdx: null, reason: `contenido de terceros según su copyright: «${copyright.slice(0, 140)}…»` };
  if (copyright && (HL7_OPEN_STATEMENT.test(copyright) || HL7_STAMP.test(copyright))) return { ok: true, spdx: 'CC0-1.0', reason: 'copyright del recurso: CC0/dominio público/sello de HL7' };
  if (!copyright && isHl7Url(url)) return { ok: true, spdx: 'CC0-1.0', reason: 'recurso de HL7 sin copyright propio (paquete CC0-1.0)' };
  if (!copyright) return { ok: false, spdx: null, reason: `autoridad externa (${url}) sin declaración de licencia en el recurso` };
  return { ok: false, spdx: null, reason: `copyright no reconocido como abierto: «${copyright.slice(0, 140)}…»` };
}

// --- CodeSystem -----------------------------------------------------------------

const VALUE_KEYS = ['valueCode', 'valueString', 'valueBoolean', 'valueInteger', 'valueDecimal', 'valueDateTime', 'valueCoding'];
function propertyValue(p) {
  const key = VALUE_KEYS.find((k) => p[k] !== undefined);
  return key ? p[key] : null;
}

/** Aplana la jerarquía anidada: [{ c, parentCode }] en orden de documento. */
function* walk(concepts, parentCode = null) {
  for (const c of concepts ?? []) {
    yield { c, parentCode };
    yield* walk(c.concept, c.code);
  }
}

const STATE_OF = { active: 'active', retired: 'retired', draft: 'draft', deprecated: 'deprecated', experimental: 'draft' };

/**
 * Un CodeSystem FHIR → { meta, concepts }. Lanza si no es `complete`.
 * @param {object} cs recurso
 * @param {{ key: string, name: string, version: string, file: string }} pkg paquete de origen
 */
export function parseCodeSystem(cs, pkg) {
  if (cs?.resourceType !== 'CodeSystem' || !cs.url) throw new Error('no es un CodeSystem FHIR con url');
  if (cs.content !== 'complete') throw new Error(`${cs.url}: content=${cs.content}; sólo se cargan los completos`);
  const version = cs.version ?? pkg.version;
  const internalCode = codeSystemInternalCode(cs.url);
  const defs = Object.fromEntries((cs.property ?? []).map((p) => [p.code, p]));
  const isParentProp = (code) => /#parent$/.test(defs[code]?.uri ?? '');
  const hierarchy = cs.hierarchyMeaning ?? null;

  const concepts = [];
  const duplicates = []; // defecto de la fuente: el mismo código dos veces en un mismo CodeSystem (se conserva la primera aparición)
  const seen = new Set();
  for (const { c, parentCode } of walk(cs.concept)) {
    if (!c.code) throw new Error(`${cs.url}: concepto sin code`);
    if (seen.has(c.code)) {
      duplicates.push(c.code);
      continue;
    }
    seen.add(c.code);
    const props = {};
    for (const p of c.property ?? []) {
      const v = propertyValue(p);
      if (v === null) continue;
      (props[p.code] ??= []).push(v);
    }
    const first = (code) => props[code]?.[0];
    const statusRaw = first('status');
    const status = (statusRaw && STATE_OF[statusRaw]) || (first('inactive') === true ? 'retired' : first('deprecated') === true ? 'deprecated' : 'active');
    const abstract = first('notSelectable') === true;
    const parents = [...new Set([...(parentCode ? [parentCode] : []), ...Object.keys(props).filter(isParentProp).flatMap((k) => props[k])])];
    concepts.push({
      code: c.code,
      display: c.display ?? null,
      definition: c.definition ?? null,
      abstract,
      status,
      selectable: !abstract && status !== 'retired' && status !== 'deprecated',
      properties: Object.fromEntries(Object.entries(props).map(([k, v]) => [k, v.length === 1 ? v[0] : v])),
      designations: (c.designation ?? []).map((d) => ({ language: d.language ?? null, use: d.use ?? null, value: d.value })),
      extensions: c.extension ?? null,
      conceptId: c.id ?? null,
      parents,
    });
  }
  const meta = {
    internalCode,
    canonicalUrl: cs.url,
    version,
    name: cs.title ?? cs.name ?? internalCode,
    fhirName: cs.name ?? null,
    status: STATE_OF[cs.status] ?? 'active',
    fhirStatus: cs.status ?? null,
    content: cs.content,
    caseSensitive: cs.caseSensitive ?? null,
    compositional: cs.compositional ?? null,
    hierarchyMeaning: hierarchy,
    description: cs.description ?? null,
    copyright: cs.copyright ?? null,
    publisher: cs.publisher ?? null,
    date: cs.date ?? null,
    experimental: cs.experimental ?? null,
    resourceId: cs.id ?? null,
    declaredCount: cs.count ?? null,
    valueSet: cs.valueSet ?? null,
    propertyDefinitions: cs.property ?? null,
    identifiers: cs.identifier ?? null,
    packageKey: pkg.key,
    packageName: pkg.name,
    packageVersion: pkg.version,
    sourceFile: pkg.file,
    duplicateCodes: duplicates.length ? duplicates : null,
  };
  return { meta, concepts };
}

/** OIDs publicados por los NamingSystem de THO: url canónica → oid (sólo si el NamingSystem trae ambos de forma explícita). */
export function oidIndex(namingSystems) {
  const m = new Map();
  for (const ns of namingSystems) {
    const ids = ns.uniqueId ?? [];
    const oid = ids.find((u) => u.type === 'oid')?.value;
    const uri = ids.filter((u) => u.type === 'uri').map((u) => u.value);
    if (!oid) continue;
    for (const u of uri) if (!m.has(u)) m.set(u, oid);
  }
  return m;
}

// --- ValueSet: expansión de `compose` sobre contenido cargado ------------------------

export class Unresolved extends Error {}

/**
 * Índice de code systems cargados para expandir value sets.
 * @param {Array<{meta: object, concepts: object[]}>} systems
 */
export class SystemIndex {
  constructor(systems) {
    this.byUrl = new Map(); // url → [{ meta, byCode, children }]
    for (const s of systems) {
      const entry = { meta: s.meta, byCode: new Map(s.concepts.map((c) => [c.code, c])), children: null };
      if (!this.byUrl.has(s.meta.canonicalUrl)) this.byUrl.set(s.meta.canonicalUrl, []);
      this.byUrl.get(s.meta.canonicalUrl).push(entry);
    }
  }
  has(url) {
    return this.byUrl.has(url);
  }
  /** Elige la edición: la versión pedida; si no, la del mismo paquete; si no, la primera (orden de preferencia de carga). */
  pick(url, version, packageKey) {
    const list = this.byUrl.get(url);
    if (!list) throw new Unresolved(`el code system ${url} no se carga (no es completo, sin licencia verificada, o lo carga otro carril)`);
    if (version) {
      const hit = list.find((e) => e.meta.version === version);
      if (!hit) throw new Unresolved(`${url} versión ${version} no está en el corpus`);
      return hit;
    }
    return list.find((e) => e.meta.packageKey === packageKey) ?? list[0];
  }
  childrenOf(entry) {
    if (!entry.children) {
      entry.children = new Map();
      for (const c of entry.byCode.values()) for (const p of c.parents) (entry.children.get(p) ?? entry.children.set(p, []).get(p)).push(c.code);
    }
    return entry.children;
  }
  descendants(entry, code, includeSelf) {
    if (!entry.byCode.has(code)) throw new Unresolved(`el código ${code} no existe en ${entry.meta.canonicalUrl}|${entry.meta.version}`);
    const out = new Set(includeSelf ? [code] : []);
    const stack = [code];
    const kids = this.childrenOf(entry);
    while (stack.length) for (const k of kids.get(stack.pop()) ?? []) if (!out.has(k)) (out.add(k), stack.push(k));
    return out;
  }
}

const propEquals = (c, prop, value) => {
  const v = prop === 'code' ? c.code : prop === 'display' ? c.display : c.properties?.[prop];
  if (v === undefined || v === null) return false;
  return Array.isArray(v) ? v.map(String).includes(value) : String(v) === value;
};

/** Aplica un filtro de `include.filter` sobre las claves (códigos) de una edición. */
function applyFilter(index, entry, filter, codes) {
  const { property, op, value } = filter;
  const fail = () => new Unresolved(`filtro no soportado: ${property} ${op} ${value}`);
  if (property === 'concept' && (op === 'is-a' || op === 'descendent-of')) {
    const set = index.descendants(entry, value, op === 'is-a');
    return new Set([...codes].filter((c) => set.has(c)));
  }
  if (property === 'concept' && op === 'is-not-a') {
    const set = index.descendants(entry, value, true);
    return new Set([...codes].filter((c) => !set.has(c)));
  }
  if (op === 'regex' && property === 'code') {
    const re = new RegExp(`^(?:${value})$`);
    return new Set([...codes].filter((c) => re.test(c)));
  }
  if (op === '=') {
    if (property !== 'code' && property !== 'display' && !entry.meta.propertyDefinitions?.some((p) => p.code === property)) throw fail();
    return new Set([...codes].filter((c) => propEquals(entry.byCode.get(c), property, value)));
  }
  if (op === 'in') {
    const vals = value.split(',').map((s) => s.trim());
    return new Set([...codes].filter((c) => vals.some((v) => propEquals(entry.byCode.get(c), property, v))));
  }
  throw fail();
}

/**
 * Expande el `compose` de un ValueSet. Devuelve [[codeSystemInternalCode, version, code], …] sin repetir,
 * o lanza `Unresolved` con el motivo exacto. Todo o nada: nunca devuelve una membresía parcial.
 * @param {SystemIndex} index
 * @param {object} vs recurso ValueSet
 * @param {string} packageKey paquete del que sale el value set (resuelve contra su propia edición primero)
 * @param {(canonical: string) => string[][]|null} resolveValueSet expansión ya calculada de otro value set (por canonical, con o sin |versión)
 */
export function expandValueSet(index, vs, packageKey, resolveValueSet) {
  const compose = vs.compose;
  if (!compose?.include?.length) throw new Unresolved('sin compose.include');
  const part = (inc) => {
    // Cada elemento es "sistema|versión|código".
    let members = null;
    if (inc.system) {
      const entry = index.pick(inc.system, inc.version, packageKey);
      const all = [...entry.byCode.keys()];
      let codes;
      if (inc.concept?.length) {
        codes = new Set();
        for (const c of inc.concept) {
          if (!entry.byCode.has(c.code)) throw new Unresolved(`el código ${c.code} no existe en ${inc.system}|${entry.meta.version}`);
          codes.add(c.code);
        }
      } else {
        codes = new Set(all);
        for (const f of inc.filter ?? []) codes = applyFilter(index, entry, f, codes);
      }
      members = new Map([...codes].map((c) => [`${entry.meta.internalCode}\u0000${entry.meta.version}\u0000${c}`, [entry.meta.internalCode, entry.meta.version, c]]));
    }
    for (const canon of inc.valueSet ?? []) {
      const other = resolveValueSet(canon);
      if (!other) throw new Unresolved(`depende del value set ${canon}, que no se pudo resolver`);
      const otherMap = new Map(other.map((m) => [m.join('\u0000'), m]));
      members = members ? new Map([...members].filter(([k]) => otherMap.has(k))) : otherMap;
    }
    if (!members) throw new Unresolved('include sin system ni valueSet');
    return members;
  };
  const result = new Map();
  for (const inc of compose.include) for (const [k, m] of part(inc)) result.set(k, m);
  for (const exc of compose.exclude ?? []) for (const k of part(exc).keys()) result.delete(k);
  return [...result.values()];
}

/** Estado de un ValueSet de FHIR → estado interno. */
export const vsState = (status) => STATE_OF[status] ?? 'active';
