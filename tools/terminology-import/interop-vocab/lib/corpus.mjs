// =============================================================================
// Armado del corpus unificado a partir de los crudos en raw/ (puro: no toca la red ni la base).
//   systems[]   { meta, concepts[] }   un elemento por (code system, versión)
//   valueSets[] { meta, members[] }    un elemento por (value set, versión)
//   conceptMaps[]                      pares de ConceptMap con ambos extremos en el corpus
//   coverage                           qué se cargó y qué NO, con el motivo exacto
// =============================================================================

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parseCldr } from './cldr.mjs';
import { parseIso31662 } from './wikidata.mjs';
import { buildConceptMaps } from './conceptmaps.mjs';
import { PACKAGE_ORDER, buildFhirCorpus } from './fhir-build.mjs';
import { classifyLicense } from './fhir.mjs';
import { LICENSES, stateKeyOf } from './model.mjs';
import { parseCvx, parseCvxTradenames, parseIanaRegistry, parseMvx, parseUcumEssence } from './parsers.mjs';

const text = (rawDir, rel) => readFileSync(join(rawDir, rel), 'utf8');

const provOf = (m, extra) => ({
  source: m.key,
  sourceName: m.name ?? m.key,
  sourceVersion: m.version ?? null,
  sourceUrl: m.url,
  retrievedAt: m.retrievedAt,
  artifactSha256: m.sha256,
  ...extra,
});

// --- FHIR (THO + core) ------------------------------------------------------------------

const hl7SourceCode = (pkgKey) => (pkgKey === 'tho-r4' ? 'INTEROP_HL7_THO' : pkgKey.startsWith('ig-') ? 'INTEROP_HL7_IG' : 'INTEROP_HL7_FHIR');

function fhirLayer(rawDir, manifest) {
  const f = buildFhirCorpus(rawDir, manifest);
  const pkgByKey = new Map(f.packages.map((p) => [p.key, p]));
  const defaults = new Set(); // url → primera edición en el orden de preferencia
  const systems = [];
  for (const s of f.systems) {
    const m = s.meta;
    const pkg = pkgByKey.get(m.packageKey);
    const isDefault = !defaults.has(m.canonicalUrl);
    defaults.add(m.canonicalUrl);
    const prov = {
      source: m.packageKey,
      sourceName: `${pkg.name}`,
      sourceVersion: pkg.version,
      sourceUrl: pkg.tarballUrl,
      sourceFile: m.sourceFile,
      sourceSha256: s.resourceSha256,
      artifactSha256: pkg.tarballSha256,
      retrievedAt: pkg.retrievedAt,
      license: `${s.license.spdx} — ${LICENSES.CC0_HL7(pkg)} Clasificación: ${s.license.reason}.`,
    };
    const concepts = s.concepts.map((c) => ({
      code: c.code,
      display: c.display ?? c.code,
      ...(c.display ? {} : { displayFallback: 'code' }),
      definition: c.definition,
      abstract: c.abstract,
      selectable: c.selectable,
      state: stateKeyOf(c.status) ?? 'active',
      properties: c.properties,
      designations: c.designations,
      extensions: c.extensions,
      parents: c.parents,
      provenance: prov,
    }));
    systems.push({
      meta: {
        internalCode: m.internalCode,
        canonicalUrl: m.canonicalUrl,
        name: m.name,
        version: m.version,
        isDefault,
        sourceCode: hl7SourceCode(m.packageKey),
        state: stateKeyOf(m.fhirStatus) ?? 'active',
        oid: m.oid ?? null,
        caseSensitive: m.caseSensitive,
        compositional: m.compositional,
        hierarchyMeaning: m.hierarchyMeaning,
        description: m.description,
        copyright: m.copyright,
        publisher: m.publisher,
        date: m.date,
        fhirName: m.fhirName,
        fhirStatus: m.fhirStatus,
        declaredCount: m.declaredCount,
        valueSet: m.valueSet,
        propertyDefinitions: m.propertyDefinitions,
        duplicateCodes: m.duplicateCodes,
        alsoIn: s.alsoIn,
        concepts: concepts.length,
        provenance: prov,
      },
      concepts,
    });
  }
  return { systems, packages: f.packages, build: f };
}

// --- CDC: CVX / MVX ---------------------------------------------------------------------

function cdcLayers(rawDir, manifest, oids) {
  const out = [];
  const tn = manifest['cdc-tradename'];
  const trade = tn ? parseCvxTradenames(text(rawDir, 'cdc/tradename.txt')) : [];
  const notes = { tradenameRows: trade.length, tradenamesWithoutCvx: 0, tradenamesWithoutMvx: 0 };
  const cvxCodes = new Set(parseCvx(text(rawDir, 'cdc/cvx.txt')).map((r) => r.code));
  const mvxCodes = new Set(parseMvx(text(rawDir, 'cdc/mvx.txt')).map((r) => r.code));
  const byCvx = new Map();
  const byMvx = new Map();
  for (const t of trade) {
    if (!cvxCodes.has(t.cvx)) notes.tradenamesWithoutCvx++;
    else (byCvx.get(t.cvx) ?? byCvx.set(t.cvx, []).get(t.cvx)).push(t);
    if (t.mvx !== null) {
      if (!mvxCodes.has(t.mvx)) notes.tradenamesWithoutMvx++;
      else (byMvx.get(t.mvx) ?? byMvx.set(t.mvx, []).get(t.mvx)).push(t);
    }
  }
  for (const kind of ['cvx', 'mvx']) {
    const m = manifest[`cdc-${kind}`];
    const rows = kind === 'cvx' ? parseCvx(text(rawDir, 'cdc/cvx.txt')) : parseMvx(text(rawDir, 'cdc/mvx.txt'));
    const version = rows.map((r) => r.lastUpdated).sort().at(-1); // sin versión publicada: la última «Last Updated» de la tabla
    const prov = provOf(
      { ...m, name: kind === 'cvx' ? 'CVX — Vaccines Administered (CDC)' : 'MVX — Manufacturers of Vaccines (CDC)', version: `tabla vigente al ${m.retrievedAt.slice(0, 10)}` },
      {
        sourceFile: `cdc/${kind}.txt`,
        sourceSha256: m.sha256,
        ...(tn ? { alsoReads: [{ file: 'cdc/tradename.txt', url: tn.url, sha256: tn.sha256, retrievedAt: tn.retrievedAt }] } : {}),
        license: LICENSES.CDC,
      },
    );
    const url = kind === 'cvx' ? 'http://hl7.org/fhir/sid/cvx' : 'http://hl7.org/fhir/sid/mvx';
    const product = (t) => ({ tradeName: t.tradeName, description: t.description, cvx: t.cvx, manufacturer: t.manufacturer, mvx: t.mvx, cvxStatus: t.cvxStatus, productStatus: t.productStatus, lastUpdated: t.lastUpdated });
    const concepts = rows.map((r) => {
      if (kind === 'cvx') {
        const products = byCvx.get(r.code) ?? [];
        const names = [...new Set(products.map((t) => t.tradeName))];
        return {
          code: r.code,
          display: r.shortDescription,
          definition: null,
          abstract: false,
          selectable: r.status === 'Active',
          state: 'active',
          properties: { cvx_full_name: r.fullName, cvx_status: r.status, cvx_non_vaccine: r.nonVaccine, cvx_last_updated: r.lastUpdated, ...(r.notes ? { cvx_notes: r.notes } : {}), ...(products.length ? { cvx_trade_names: products.map(product) } : {}) },
          designations: [{ language: 'en', use: null, value: r.fullName }, ...names.map((value) => ({ language: null, use: null, value }))],
          extensions: null,
          parents: [],
          provenance: prov,
        };
      }
      const products = byMvx.get(r.code) ?? [];
      return {
        code: r.code,
        display: r.manufacturer,
        definition: null,
        abstract: false,
        selectable: r.status === 'Active',
        state: 'active',
        properties: { mvx_status: r.status, mvx_last_updated: r.lastUpdated, ...(r.notes ? { mvx_notes: r.notes } : {}), ...(products.length ? { mvx_products: products.map(product) } : {}) },
        designations: [],
        extensions: null,
        parents: [],
        provenance: prov,
      };
    });
    out.push({
      meta: {
        internalCode: `cdc-${kind}`,
        canonicalUrl: url,
        name: kind === 'cvx' ? 'CVX — Vaccines Administered (CDC)' : 'MVX — Manufacturers of Vaccines (CDC)',
        version,
        isDefault: true,
        sourceCode: kind === 'cvx' ? 'INTEROP_CDC_CVX' : 'INTEROP_CDC_MVX',
        state: 'active',
        oid: oids.get(url) ?? null,
        caseSensitive: true,
        compositional: false,
        hierarchyMeaning: null,
        description: kind === 'cvx' ? 'Código de vacuna administrada, con estado (Active, Inactive, Never Active, Non-US, Pending) y las marcas comerciales que el CDC asocia a cada CVX en tradename.txt.' : 'Código de fabricante de vacunas, con estado y los productos que el CDC asocia a cada MVX en tradename.txt.',
        versionNote: 'El CDC no publica un número de versión en el archivo: es la fecha «Last Updated» más reciente de la tabla.',
        concepts: concepts.length,
        notes,
        provenance: prov,
      },
      concepts,
    });
  }
  return out;
}

// --- UCUM -------------------------------------------------------------------------------------

function ucumLayers(rawDir, manifest) {
  const m = manifest['ucum-essence'];
  const u = parseUcumEssence(text(rawDir, 'ucum/ucum-essence.xml'));
  const version = `essence-${u.header.version}-${u.header.date}`;
  const prov = provOf({ ...m, name: 'ucum-essence.xml (ucum-org/ucum)', version: `UCUM ${u.header.version}, ${u.header.date}` }, { sourceFile: 'ucum/ucum-essence.xml', sourceSha256: m.sha256, license: LICENSES.UCUM });
  const props = (x, kind) => ({
    ucum_kind: kind,
    ucum_ci_code: x.CODE,
    ...(x.printSymbol != null ? { ucum_print_symbol: x.printSymbol } : {}),
    ...(x.property ? { ucum_property: x.property } : {}),
    ...(x.dim ? { ucum_dim: x.dim } : {}),
    ...(x.class ? { ucum_class: x.class } : {}),
    ...(x.isMetric ? { ucum_is_metric: x.isMetric } : {}),
    ...(x.isSpecial ? { ucum_is_special: x.isSpecial } : {}),
    ...(x.isArbitrary ? { ucum_is_arbitrary: x.isArbitrary } : {}),
    ...(x.value ? { ucum_value: x.value } : {}),
  });
  const mk = (x, kind) => ({ code: x.code, display: x.name, definition: null, abstract: false, selectable: true, state: 'active', properties: props(x, kind), designations: [], extensions: null, parents: [], provenance: prov });
  const unitConcepts = [...u.baseUnits.map((x) => mk(x, 'base-unit')), ...u.units.map((x) => mk(x, 'unit'))];
  const prefixConcepts = u.prefixes.map((x) => mk(x, 'prefix'));
  const common = { version, isDefault: true, state: 'active', oid: null, caseSensitive: true, hierarchyMeaning: null, copyright: '© 1999-2024 Regenstrief Institute, Inc. and the UCUM Organization', publisher: 'Regenstrief Institute, Inc.', date: u.header.date, provenance: prov };
  return [
    // Mismo code system que carga lab-tests (`ucum`, http://unitsofmeasure.org) como otra versión: la carga lo busca por internal_code
    // y sólo la marca por defecto si el code system todavía no tiene una.
    { meta: { ...common, internalCode: 'ucum', canonicalUrl: 'http://unitsofmeasure.org', name: 'UCUM — Unified Code for Units of Measure', sourceCode: 'INTEROP_UCUM', compositional: true, description: `Unidades base y derivadas de ucum-essence.xml (UCUM ${u.header.version}). Los prefijos están en el code system ucum-prefix.`, concepts: unitConcepts.length }, concepts: unitConcepts },
    { meta: { ...common, internalCode: 'ucum-prefix', canonicalUrl: 'https://mantracore.health/fhir/CodeSystem/ucum-prefix', name: 'UCUM — prefijos de unidades', sourceCode: 'INTEROP_UCUM', compositional: false, description: `Prefijos de ucum-essence.xml (UCUM ${u.header.version}). Aparte de las unidades porque sus códigos (p. ej. «m», «d») coinciden con los de unidades.`, concepts: prefixConcepts.length }, concepts: prefixConcepts },
  ];
}

// --- IANA ------------------------------------------------------------------------------------------

const IANA_TYPES = {
  language: 'Idiomas (ISO 639-1/-2/-3)',
  extlang: 'Idiomas extendidos (extlang)',
  script: 'Escrituras (ISO 15924)',
  region: 'Regiones (ISO 3166-1 alfa-2 y UN M.49)',
  variant: 'Variantes',
  grandfathered: 'Etiquetas «grandfathered»',
  redundant: 'Etiquetas redundantes',
};

function ianaLayers(rawDir, manifest) {
  const m = manifest['iana-lsr'];
  const reg = parseIanaRegistry(text(rawDir, 'iana/language-subtag-registry.txt'));
  const prov = provOf({ ...m, name: 'IANA Language Subtag Registry', version: `File-Date ${reg.fileDate}` }, { sourceFile: 'iana/language-subtag-registry.txt', sourceSha256: m.sha256, license: LICENSES.IANA });
  return Object.entries(IANA_TYPES).map(([type, label]) => {
    const concepts = reg.records
      .filter((r) => r.type === type)
      .map((r) => ({
        code: r.code,
        display: r.descriptions[0] ?? r.code,
        ...(r.descriptions.length ? {} : { displayFallback: 'code' }),
        definition: null,
        abstract: false,
        selectable: !r.deprecated,
        state: r.deprecated ? 'deprecated' : 'active',
        properties: {
          iana_type: r.type,
          ...(r.added ? { iana_added: r.added } : {}),
          ...(r.deprecated ? { iana_deprecated: r.deprecated } : {}),
          ...(r.preferredValue ? { iana_preferred_value: r.preferredValue } : {}),
          ...(r.prefixes.length ? { iana_prefix: r.prefixes } : {}),
          ...(r.suppressScript ? { iana_suppress_script: r.suppressScript } : {}),
          ...(r.macrolanguage ? { iana_macrolanguage: r.macrolanguage } : {}),
          ...(r.scope ? { iana_scope: r.scope } : {}),
          ...(r.comments.length ? { iana_comments: r.comments } : {}),
        },
        designations: r.descriptions.slice(1).map((value) => ({ language: null, use: null, value })),
        extensions: null,
        parents: [],
        provenance: prov,
      }));
    return {
      meta: {
        internalCode: `iana-lsr-${type}`,
        canonicalUrl: `https://www.iana.org/assignments/language-subtag-registry#${type}`,
        name: `IANA Language Subtag Registry — ${label}`,
        version: reg.fileDate,
        isDefault: true,
        sourceCode: 'INTEROP_IANA_LSR',
        state: 'active',
        oid: null,
        caseSensitive: false,
        compositional: false,
        hierarchyMeaning: null,
        description: `Subtags de tipo «${type}» del registro de IANA (RFC 5646). Los códigos de región son los ISO 3166-1 alfa-2 más los UN M.49; los de idioma, los ISO 639; los de escritura, los ISO 15924. El texto de las normas ISO no forma parte del registro.`,
        concepts: concepts.length,
        provenance: prov,
      },
      concepts,
    };
  });
}

// --- CLDR -----------------------------------------------------------------------------------------------------------

function cldrLayers(rawDir, manifest) {
  if (!manifest['cldr-core'] || !manifest['cldr-localenames'] || !manifest['cldr-numbers']) return [];
  const mk = (k) => manifest[k];
  const parsed = parseCldr({ core: join(rawDir, 'x', 'cldr-core'), localenames: join(rawDir, 'x', 'cldr-localenames'), numbers: join(rawDir, 'x', 'cldr-numbers') });
  const arts = ['cldr-core', 'cldr-localenames', 'cldr-numbers'].map((k) => ({ key: k, name: mk(k).name, version: mk(k).version, url: mk(k).url, sha256: mk(k).sha256, npmIntegrity: mk(k).npmIntegrity ?? null, retrievedAt: mk(k).retrievedAt }));
  const version = `cldr-${mk('cldr-core').version}`;
  const license = 'Unicode-3.0 (Unicode License v3): permiso gratuito para usar, copiar, modificar, fusionar, publicar y distribuir los Data Files siempre que el aviso de copyright y permiso acompañe a las copias (https://raw.githubusercontent.com/unicode-org/cldr-json/main/LICENSE; package.json de cldr-core, cldr-localenames-full y cldr-numbers-full: license Unicode-3.0). © 1991-2026 Unicode, Inc. Los identificadores son de ISO 3166/639/15924/4217; el texto de esas normas no se carga.';
  const label = { territory: 'territorios', language: 'idiomas', script: 'escrituras', variant: 'variantes', currency: 'monedas' };
  const url = (k) => `https://mantracore.health/fhir/CodeSystem/cldr-${k}`;
  return parsed.map((p) => {
    const prov = { source: 'cldr', sourceName: 'Unicode CLDR (cldr-json) 49', sourceVersion: mk('cldr-core').version, sourceUrl: mk('cldr-localenames').url, sourceFiles: p.files, artifacts: arts, artifactSha256: mk('cldr-localenames').sha256, retrievedAt: mk('cldr-localenames').retrievedAt, license };
    const concepts = p.concepts.map((c) => ({ definition: null, abstract: false, extensions: null, ...c, provenance: prov }));
    return {
      meta: {
        internalCode: `cldr-${p.kind}`,
        canonicalUrl: url(p.kind),
        name: `CLDR — ${label[p.kind]} (${p.label})`,
        version,
        isDefault: true,
        sourceCode: 'INTEROP_CLDR',
        state: 'active',
        oid: null,
        caseSensitive: true,
        compositional: false,
        hierarchyMeaning: p.kind === 'territory' ? 'part-of' : null,
        description: `Identificadores y nombres en inglés y español de CLDR para ${p.label}. Nombres verbatim de CLDR: sin traducción propia; donde CLDR no trae el nombre en español no hay designación en español.`,
        copyright: '© 1991-2026 Unicode, Inc.',
        publisher: 'Unicode Consortium',
        concepts: concepts.length,
        notes: p.notes,
        provenance: prov,
      },
      concepts,
    };
  });
}

// --- NamingSystem (registro de sistemas de identificación y de código de HL7) ------------------------------------

/**
 * Cada NamingSystem de un paquete es un concepto de `hl7-namingsystem`: código = id del recurso, con sus URI y OID verbatim.
 * Describen sistemas externos (SNOMED CT, LOINC…) pero NO contienen su contenido: sólo identificadores. Entran por la licencia del
 * paquete (CC0-1.0) salvo que el recurso traiga un `copyright` propio no abierto.
 */
function namingSystemLayers(packages) {
  const out = [];
  const skipped = [];
  for (const pkg of packages) {
    if (!existsSync(pkg.dir)) continue;
    const files = readdirSync(pkg.dir).filter((f) => f.startsWith('NamingSystem-') && f.endsWith('.json')).sort();
    if (!files.length) continue;
    const concepts = [];
    for (const file of files) {
      const buf = readFileSync(join(pkg.dir, file));
      const ns = JSON.parse(buf.toString('utf8'));
      const copyright = (ns.copyright ?? '').replace(/\s+/g, ' ').trim();
      if (copyright && !classifyLicense({ url: 'http://terminology.hl7.org/NamingSystem/x', copyright }).ok) {
        skipped.push({ package: pkg.key, file, reason: `copyright propio no abierto: «${copyright.slice(0, 120)}»` });
        continue;
      }
      const ids = ns.uniqueId ?? [];
      const prov = {
        source: pkg.key,
        sourceName: pkg.name,
        sourceVersion: pkg.version,
        sourceUrl: pkg.tarballUrl,
        sourceFile: `package/${file}`,
        sourceSha256: createHash('sha256').update(buf).digest('hex'),
        artifactSha256: pkg.tarballSha256,
        retrievedAt: pkg.retrievedAt,
        license: `CC0-1.0 — ${LICENSES.CC0_HL7(pkg)} Registro de identificadores: no contiene el contenido de los sistemas que describe.`,
      };
      concepts.push({
        code: ns.id,
        display: ns.title ?? ns.name ?? ns.id,
        definition: ns.description ?? null,
        abstract: false,
        selectable: ns.status !== 'retired',
        state: stateKeyOf(ns.status) ?? 'active',
        properties: {
          ns_name: ns.name,
          ns_kind: ns.kind,
          ns_status: ns.status,
          ...(ns.date ? { ns_date: ns.date } : {}),
          ...(ns.version ? { ns_version: ns.version } : {}),
          ...(ns.publisher ? { ns_publisher: ns.publisher } : {}),
          ...(ns.responsible ? { ns_responsible: ns.responsible } : {}),
          ...(ns.usage ? { ns_usage: ns.usage } : {}),
          ...(ns.type ? { ns_type: ns.type } : {}),
          ...(ns.jurisdiction ? { ns_jurisdiction: ns.jurisdiction } : {}),
          ns_unique_ids: ids,
          ...(ids.filter((u) => u.type === 'oid').length ? { ns_oids: ids.filter((u) => u.type === 'oid').map((u) => u.value) } : {}),
          ...(ids.filter((u) => u.type === 'uri').length ? { ns_uris: ids.filter((u) => u.type === 'uri').map((u) => u.value) } : {}),
        },
        designations: [],
        extensions: null,
        parents: [],
        provenance: prov,
      });
    }
    if (!concepts.length) continue;
    const prov0 = concepts[0].provenance;
    out.push({
      meta: {
        internalCode: 'hl7-namingsystem',
        canonicalUrl: 'https://mantracore.health/fhir/CodeSystem/hl7-namingsystem',
        name: 'HL7 NamingSystem — registro de sistemas de identificación y de código',
        version: pkg.version,
        versionNote: `NamingSystem del paquete ${pkg.name}@${pkg.version}`,
        isDefault: false,
        sourceCode: hl7SourceCode(pkg.key),
        state: 'active',
        oid: null,
        caseSensitive: true,
        compositional: false,
        hierarchyMeaning: null,
        description: 'Un concepto por NamingSystem: código = id del recurso FHIR; URI y OID del sistema en las propiedades ns_uris / ns_oids y, completos, en ns_unique_ids.',
        concepts: concepts.length,
        provenance: { ...prov0, sourceFile: 'package/NamingSystem-*.json', sourceSha256: null },
      },
      concepts,
      skipped,
    });
  }
  // la edición del paquete más preferido es la que queda por defecto
  if (out.length) out[0].meta.isDefault = true;
  return out;
}

// --- Wikidata: ISO 3166-2 -------------------------------------------------------------------------------------------

function wikidataLayers(rawDir, manifest) {
  const m = manifest['wikidata-iso3166-2'];
  if (!m) return [];
  const pages = m.pages.map((p) => ({ file: p.file, sha256: p.sha256, json: JSON.parse(readFileSync(join(rawDir, p.file), 'utf8')) }));
  const parsed = parseIso31662(pages);
  const preferredUse = { system: 'http://terminology.hl7.org/CodeSystem/hl7TermMaintInfra', code: 'preferredForLanguage' };
  const concepts = parsed.rows.map((r) => ({
    code: r.code,
    display: r.labelEn ?? r.labelEs ?? r.code,
    ...(r.labelEn ?? r.labelEs ? {} : { displayFallback: 'code' }),
    definition: null,
    abstract: false,
    selectable: true,
    state: 'active',
    properties: { wikidata_qid: r.qid, wikidata_url: `https://www.wikidata.org/wiki/${r.qid}` },
    designations: [...(r.labelEn ? [{ language: 'en', use: preferredUse, value: r.labelEn }] : []), ...(r.labelEs ? [{ language: 'es', use: preferredUse, value: r.labelEs }] : [])],
    extensions: null,
    parents: [],
    provenance: {
      source: 'wikidata',
      sourceName: m.name,
      sourceVersion: m.version,
      sourceUrl: `https://www.wikidata.org/wiki/${r.qid}`,
      sourceFile: r.file,
      sourceSha256: r.sha256,
      retrievedAt: m.retrievedAt,
      license: `${m.license}. Dato estructurado de Wikidata (ítem ${r.qid}, propiedad P300).`,
    },
  }));
  return [
    {
      meta: {
        internalCode: 'wikidata-iso3166-2',
        canonicalUrl: 'https://mantracore.health/fhir/CodeSystem/wikidata-iso3166-2',
        name: 'Subdivisiones ISO 3166-2 (códigos de Wikidata P300, nombres en/es de Wikidata)',
        version: m.version,
        isDefault: true,
        sourceCode: 'INTEROP_WIKIDATA',
        state: 'active',
        oid: null,
        caseSensitive: true,
        compositional: false,
        hierarchyMeaning: null,
        description: 'Código ISO 3166-2 tal cual figura en la propiedad P300 de Wikidata, con las etiquetas en inglés y español del ítem. Un código asignado a más de un ítem no se carga (ver notes.ambiguous). No incluye el texto de ISO 3166-2.',
        concepts: concepts.length,
        notes: { rowsRead: parsed.total, ambiguousCodes: parsed.ambiguous.length, ambiguous: parsed.ambiguous, invalidCodes: parsed.invalid.length, invalid: parsed.invalid, withoutEnglishLabel: concepts.filter((c) => !c.designations.some((d) => d.language === 'en')).length, withoutSpanishLabel: concepts.filter((c) => !c.designations.some((d) => d.language === 'es')).length },
        provenance: concepts[0]?.provenance,
      },
      concepts,
    },
  ];
}

// --- Todo junto -------------------------------------------------------------------------------------

export function buildCorpus(rawDir, manifest) {
  const fhir = fhirLayer(rawDir, manifest);
  const oids = new Map();
  for (const s of fhir.systems) if (s.meta.oid) oids.set(s.meta.canonicalUrl, s.meta.oid);
  // OID de CVX/MVX: los publica el NamingSystem de THO (url → oid), aunque no haya CodeSystem completo.
  for (const [url, oid] of fhir.build.oidsAll ?? []) if (!oids.has(url)) oids.set(url, oid);
  const ns = namingSystemLayers(fhir.packages);
  const systems = [...fhir.systems, ...ns, ...cdcLayers(rawDir, manifest, oids), ...ucumLayers(rawDir, manifest), ...ianaLayers(rawDir, manifest), ...cldrLayers(rawDir, manifest), ...wikidataLayers(rawDir, manifest)];

  // Identidad única (internal_code, versión) y de URL canónica.
  const seen = new Map();
  const urls = new Map();
  for (const s of systems) {
    const k = `${s.meta.internalCode}\u0000${s.meta.version}`;
    if (seen.has(k)) throw new Error(`code system repetido: ${s.meta.internalCode} ${s.meta.version}`);
    seen.set(k, s);
    const prior = urls.get(s.meta.canonicalUrl);
    if (prior && prior !== s.meta.internalCode) throw new Error(`URL canónica ${s.meta.canonicalUrl} para dos internal_code: ${prior}, ${s.meta.internalCode}`);
    urls.set(s.meta.canonicalUrl, s.meta.internalCode);
  }

  // Value sets: la edición de FHIR pasa de [system, version, code] con el internal_code de cada sistema.
  const valueSets = fhir.build.valueSets.map(({ entry, members }) => {
    const r = entry.resource;
    return {
      meta: {
        internalCode: fhir.build.vsInternalCode(r.url),
        canonicalUrl: r.url,
        name: r.title ?? r.name ?? r.url,
        fhirName: r.name ?? null,
        version: r.version ?? entry.pkg.version,
        state: stateKeyOf(r.status) ?? 'active',
        fhirStatus: r.status ?? null,
        description: r.description ?? null,
        copyright: r.copyright ?? null,
        publisher: r.publisher ?? null,
        date: r.date ?? null,
        immutable: r.immutable ?? null,
        compose: r.compose,
        members: members.length,
        alsoIn: entry.alsoIn,
        provenance: {
          source: entry.pkg.key,
          sourceName: entry.pkg.name,
          sourceVersion: entry.pkg.version,
          sourceUrl: entry.pkg.tarballUrl,
          sourceFile: entry.file,
          sourceSha256: entry.resourceSha256,
          artifactSha256: entry.pkg.tarballSha256,
          retrievedAt: entry.pkg.retrievedAt,
          license: `${entry.license.spdx} — ${LICENSES.CC0_HL7(entry.pkg)} Clasificación: ${entry.license.reason}.`,
        },
      },
      members,
    };
  });
  const vsDefaults = new Set();
  for (const v of valueSets.sort((a, b) => PACKAGE_ORDER.indexOf(a.meta.provenance.source) - PACKAGE_ORDER.indexOf(b.meta.provenance.source) || (a.meta.canonicalUrl + a.meta.version < b.meta.canonicalUrl + b.meta.version ? -1 : 1))) {
    v.meta.isDefault = !vsDefaults.has(v.meta.canonicalUrl);
    vsDefaults.add(v.meta.canonicalUrl);
  }
  valueSets.sort((a, b) => (a.meta.canonicalUrl + '|' + a.meta.version < b.meta.canonicalUrl + '|' + b.meta.version ? -1 : 1));

  // ConceptMap: resuelve cada code system contra la edición del propio paquete.
  const editionOf = new Map(); // `${pkg}|${url}` → sistema
  const sysById = new Map(systems.map((s) => [`${s.meta.canonicalUrl}|${s.meta.version}`, s]));
  for (const row of fhir.build.coverage.codeSystems) {
    if (row.decision === 'omitido') continue;
    const s = sysById.get(`${row.url}|${row.version}`);
    if (s) editionOf.set(`${row.package}|${row.url}`, s);
  }
  // El paquete R5/R4B no trae todos los code systems de THO a los que apunta: se usa la edición por defecto (la más nueva) de esa URL.
  // Los dos códigos de cada par igual tienen que existir en la edición elegida, o el par no se carga.
  const defaultEdition = new Map(systems.filter((s) => s.meta.isDefault).map((s) => [s.meta.canonicalUrl, s]));
  const codesCache = new Map();
  const resolveSystem = (pkgKey, url) => {
    const s = editionOf.get(`${pkgKey}|${url}`) ?? defaultEdition.get(url);
    if (!s) return null;
    if (!codesCache.has(s)) codesCache.set(s, new Set(s.concepts.map((c) => c.code)));
    const set = codesCache.get(s);
    return { internalCode: s.meta.internalCode, version: s.meta.version, has: (c) => set.has(c) };
  };
  const cm = buildConceptMaps(fhir.packages, resolveSystem);

  const coverage = {
    codeSystems: fhir.build.coverage.codeSystems,
    valueSets: fhir.build.coverage.valueSets,
    conceptMaps: cm.coverage,
    oidsApplied: fhir.build.coverage.oidsApplied,
    namingSystemsSkipped: ns.flatMap((x) => x.skipped ?? []),
    notes: Object.fromEntries(systems.filter((x) => x.meta.notes).map((x) => [x.meta.internalCode, x.meta.notes])),
  };
  return { systems, valueSets, conceptMaps: cm.elements, coverage, packages: fhir.packages };
}

export { classifyLicense };
