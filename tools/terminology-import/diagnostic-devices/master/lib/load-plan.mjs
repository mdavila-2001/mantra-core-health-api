// =============================================================================
// Plan de carga de la taxonomía (puro, sin base): nodos y mapeos publicados →
// tuplas de `terminology.*`. Sin DDL: solo tablas existentes del módulo 03.
//
// Qué carga (fabricantes, marcas y modelos NO: no hay tablas en el modelo; ver
// docs/seed-research/diagnostic-devices-master.md, «Propuesta para el modelo»):
//   code system por nomenclatura    fda-product-code, emdn, gmdn, gmdn-pt, …
//   catalog_concepts                un concepto por nodo; `selectable` = es de
//                                   diagnóstico; display = nombre publicado (o
//                                   el código si la fuente no publica nombre)
//   concept_designations            nombres publicados (inglés salvo que la
//                                   fuente diga otro idioma)
//   concept_properties              procedencia, decisión de diagnóstico (con
//                                   su criterio) y atributos de la fuente
//   concept_relationships           is-a de la jerarquía EMDN
//   concept_maps                    mapeos publicados (misma fila, dos tipos),
//                                   equivalencia null (la fuente no la declara)
//   value set                       `diagnostic-equipment-types`: los nodos con
//                                   decisión `true`
//
// Ids deterministas (`md5('mantra:dx-devices:<tipo>:…')`): la segunda corrida
// inserta 0. Los conceptos internos (estado, idioma, designación, is-a) se
// reusan de `src/common/constants/concepts.ts` vía `deterministicId`.
// =============================================================================

import { createHash } from 'node:crypto';
import { deterministicId } from '../../../lib/glossary-es/common.mjs';
import { md5uuid } from '../../../lib/glossary-es/load-plan.mjs';

export const INTERNAL = {
  TERM_ACTIVE: deterministicId('terminology:state:active'),
  TERM_DRAFT: deterministicId('terminology:state:draft'),
  LANG_EN: deterministicId('terminology:language:en'),
  DESIG_PREFERRED: deterministicId('terminology:designation-type:preferred'),
  DESIG_SYNONYM: deterministicId('terminology:designation-type:synonym'),
  REL_IS_A: deterministicId('terminology:relationship:is-a'),
};

/** Fuente y code system de cada nomenclatura. */
export const SYSTEMS = {
  'fda-product-code': {
    sourceCode: 'FDA_PRODUCT_CLASSIFICATION',
    owner: 'U.S. Food and Drug Administration — CDRH',
    name: 'FDA Product Classification (product codes de dispositivos médicos)',
    officialUrl:
      'https://www.fda.gov/medical-devices/classify-your-medical-device/product-code-classification-database',
    license:
      'Datos del Gobierno de EE. UU., dominio público (17 U.S.C. § 105); openFDA los publica bajo CC0 1.0 (https://open.fda.gov/license/, leído 2026-10-28).',
  },
  emdn: {
    sourceCode: 'EC_EMDN',
    owner: 'Comisión Europea — DG SANTE',
    name: 'European Medical Device Nomenclature (EMDN)',
    officialUrl: 'https://webgate.ec.europa.eu/dyna2/emdn/',
    license:
      'CC BY 4.0: «content owned by the EU on this website is licensed under CC BY 4.0» (https://commission.europa.eu/legal-notice_en, leído 2026-10-28); requiere atribución e indicar cambios.',
  },
  gmdn: {
    sourceCode: 'GMDN_VIA_GUDID',
    owner: 'GMDN Agency (publicado por FDA/NLM en AccessGUDID)',
    name: 'Global Medical Device Nomenclature — términos publicados en AccessGUDID',
    officialUrl: 'https://accessgudid.nlm.nih.gov/',
    license:
      'Solo los términos que GUDID publica junto a cada dispositivo; la nomenclatura completa exige membresía de la GMDN Agency.',
  },
  'gmdn-pt': {
    sourceCode: 'GMDN_VIA_GUDID',
    owner: 'GMDN Agency (publicado por FDA/NLM en AccessGUDID)',
    name: 'GMDN — término preferido sin código, tal como lo publica AccessGUDID',
    officialUrl: 'https://accessgudid.nlm.nih.gov/',
    license:
      'Solo los términos que GUDID publica junto a cada dispositivo; la nomenclatura completa exige membresía de la GMDN Agency.',
  },
};

export const canonicalUrl = (system) =>
  `https://mantracore.health/fhir/CodeSystem/${system.replace(/[^a-z0-9-]/g, '-')}`;
export const sourceId = (code) => md5uuid(`mantra:dx-devices:source:${code}`);
export const codeSystemId = (system) =>
  md5uuid(`mantra:dx-devices:code-system:${system}`);
export const versionId = (system, version) =>
  md5uuid(`mantra:dx-devices:code-system-version:${system}:${version}`);
export const conceptId = (system, code) =>
  md5uuid(`mantra:dx-devices:concept:${system}:${code}`);
export const VALUE_SET = {
  code: 'diagnostic-equipment-types',
  name: 'Tipos de equipo de diagnóstico',
  canonicalUrl:
    'https://mantracore.health/fhir/ValueSet/diagnostic-equipment-types',
};
export const valueSetId = md5uuid(
  `mantra:dx-devices:value-set:${VALUE_SET.code}`,
);

/**
 * Política de carga por nomenclatura (decidida con las licencias leídas el
 * 2026-10-28; ver SOURCES.md §3). Solo se carga lo que figura `loadable: true`.
 * Lo demás queda en `out/` y se informa en cada corrida con su motivo.
 *   kind 'licensed'   licencia que no permite reproducir: no se carga.
 *   kind 'owner'      falta una decisión o un prerrequisito del propietario;
 *                     se carga recién cuando alguien cambie esta tabla con su OK.
 */
export const LOAD_POLICY = {
  'fda-product-code': { loadable: true, language: 'en' },
  emdn: { loadable: true, language: 'en' },
  gmdn: {
    loadable: false,
    kind: 'licensed',
    reason: 'GMDN Agency: nomenclatura licenciada (membresía); no se carga ni se cruza.',
  },
  'gmdn-pt': {
    loadable: false,
    kind: 'licensed',
    reason: 'GMDN Agency: nomenclatura licenciada (membresía); no se carga ni se cruza.',
  },
  'br:anvisa-nome-tecnico': {
    loadable: false,
    kind: 'owner',
    reason:
      'Nombres en portugués y `concepts.ts` solo define idiomas es/en/la (no hay LANG_PT); licencia del conjunto ANVISA no verificable (dados.gov.br exige token; decreto 8.777/2016 pide licencia abierta sin nombrarla).',
  },
  jmdn: {
    loadable: false,
    kind: 'owner',
    reason:
      'Nombres en japonés y `concepts.ts` no define LANG_JA; licencia del sitio PMDA verificada (PDL 1.0, https://www.pmda.go.jp/english/0013.html, 2026-10-28), pero los datos vienen de un espejo de GitHub porque el host oficial dio 416.',
  },
  'in:cdsco-device-name': {
    loadable: false,
    kind: 'owner',
    reason:
      'Licencia de CDSCO no verificada (su «Copyright Policy» no se pudo leer); los datos vienen de un espejo de GitHub.',
  },
};
export const loadPolicy = (system) =>
  LOAD_POLICY[system] ?? {
    loadable: false,
    kind: 'owner',
    reason: 'Nomenclatura sin política de carga ni licencia leída.',
  };

/** Definición de una nomenclatura nacional sin entrada en `SYSTEMS`. */
export function systemDef(system) {
  if (SYSTEMS[system]) return SYSTEMS[system];
  return {
    sourceCode: `DX_NOMENCLATURE_${system.toUpperCase().replace(/[^A-Z0-9]+/g, '_')}`,
    owner: `Nomenclatura «${system}» tal como la publican los registros consolidados`,
    name: `Nomenclatura de dispositivos «${system}»`,
    officialUrl: null,
    license: 'Ver SOURCES.md de la región que la aporta.',
  };
}

/** Código de catálogo de un nodo: el código publicado, o `name:<NOMBRE>` si la fuente no publica código (gmdn-pt). */
export const conceptCode = (n) =>
  n.code ?? `name:${(n.name ?? '').trim().toUpperCase()}`;

/**
 * Versión de un sistema. FDA: la versión de la copia del PCD. El resto: hash
 * del contenido (códigos y nombres), así la misma taxonomía da la misma versión.
 */
export function systemVersion(system, nodes) {
  const fda = nodes.find(
    (n) =>
      n.provenance?.sourceVersion &&
      n.system === 'fda-product-code' &&
      n.provenance.source === 'fda-pcd',
  );
  if (system === 'fda-product-code' && fda) return fda.provenance.sourceVersion;
  const h = createHash('sha256');
  for (const n of [...nodes].sort((a, b) =>
    conceptCode(a).localeCompare(conceptCode(b)),
  ))
    h.update(`${conceptCode(n)}\u0000${n.name ?? ''}\n`);
  return `content-sha256:${h.digest('hex').slice(0, 16)}`;
}

const prop = (system, code, propertyCode, value) => [
  md5uuid(`mantra:dx-devices:property:${system}:${code}:${propertyCode}`),
  conceptId(system, code),
  propertyCode,
  'json',
  JSON.stringify(value),
];

/** Plan de un code system. */
export function planSystem(system, nodes) {
  const def = systemDef(system);
  const version = systemVersion(system, nodes);
  const vId = versionId(system, version);
  const codes = new Set(nodes.map(conceptCode));
  const concepts = [];
  const designations = [];
  const properties = [];
  const relationships = [];
  for (const n of nodes) {
    const code = conceptCode(n);
    const cid = conceptId(system, code);
    concepts.push([
      cid,
      vId,
      code,
      n.name ?? n.code,
      n.definition ?? null,
      n.diagnostic === true,
      null,
      INTERNAL.TERM_ACTIVE,
    ]);
    (n.names?.length ? n.names : n.name ? [n.name] : []).forEach((name, i) => {
      designations.push([
        md5uuid(
          `mantra:dx-devices:designation:${system}:${code}:${i === 0 ? 'p' : 's'}:${name}`,
        ),
        cid,
        INTERNAL.LANG_EN,
        i === 0 ? INTERNAL.DESIG_PREFERRED : INTERNAL.DESIG_SYNONYM,
        name,
        i === 0,
      ]);
    });
    properties.push(
      prop(system, code, 'dx_device_type_provenance', {
        ...(n.provenance ?? {}),
        seenIn: n.seenIn ?? [],
      }),
    );
    properties.push(
      prop(system, code, 'dx_device_type_decision', {
        diagnostic: n.diagnostic,
        branch: n.branch,
        basis: n.basis,
        crosswalkEvidence: n.crosswalkEvidence ?? null,
      }),
    );
    if (n.attributes && Object.keys(n.attributes).length)
      properties.push(
        prop(system, code, 'dx_device_type_attributes', n.attributes),
      );
    if (n.parent && codes.has(n.parent)) {
      relationships.push([
        md5uuid(`mantra:dx-devices:rel:is-a:${system}:${code}:${n.parent}`),
        cid,
        conceptId(system, n.parent),
        INTERNAL.REL_IS_A,
        0,
      ]);
    }
  }
  return {
    system,
    source: {
      id: sourceId(def.sourceCode),
      code: def.sourceCode,
      name: def.name,
      owner: def.owner,
      officialUrl: def.officialUrl,
      license: def.license,
    },
    codeSystem: {
      id: codeSystemId(system),
      internalCode: system,
      name: def.name,
      canonicalUrl: canonicalUrl(system),
    },
    version: { id: vId, version },
    checksum: version,
    concepts,
    designations,
    properties,
    relationships,
  };
}

/** Mapeos publicados entre nomenclaturas → `concept_maps`. */
export function planMaps(crosswalks, nodesByKey) {
  const out = [];
  for (const cw of crosswalks) {
    const from = nodesByKey.get(cw.from);
    const to = nodesByKey.get(cw.to);
    if (!from || !to) continue;
    const fc = conceptCode(from);
    const tc = conceptCode(to);
    const context = `misma fila declara ambos tipos: ${cw.records} registro(s) en ${cw.sources.join(', ')}`;
    out.push([
      md5uuid(`mantra:dx-devices:map:${from.system}:${fc}:${to.system}:${tc}`),
      conceptId(from.system, fc),
      conceptId(to.system, tc),
      null,
      context,
      cw.sources.join(','),
      INTERNAL.TERM_ACTIVE,
    ]);
  }
  return out;
}

/** Plan completo: un plan por nomenclatura, mapeos y value set. */
export function planTaxonomy({ nodes: allNodes, crosswalks: allCrosswalks }) {
  const nodes = allNodes.filter((n) => loadPolicy(n.system).loadable);
  const skipped = new Map();
  for (const n of allNodes)
    if (!loadPolicy(n.system).loadable)
      skipped.set(n.system, (skipped.get(n.system) ?? 0) + 1);
  const ok = new Set(nodes.map((n) => n.key));
  // Un mapeo con un extremo no cargable no se carga: sería un cruce hacia un concepto ausente.
  const crosswalks = allCrosswalks.filter((c) => ok.has(c.from) && ok.has(c.to));
  const bySystem = new Map();
  for (const n of nodes) {
    if (!bySystem.has(n.system)) bySystem.set(n.system, []);
    bySystem.get(n.system).push(n);
  }
  const systems = [...bySystem.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([s, ns]) => planSystem(s, ns));
  const nodesByKey = new Map(nodes.map((n) => [n.key, n]));
  const maps = planMaps(crosswalks, nodesByKey);
  const vsVersion = createHash('sha256')
    .update(
      nodes
        .filter((n) => n.diagnostic === true)
        .map((n) => `${n.system}:${conceptCode(n)}`)
        .sort()
        .join('\n'),
    )
    .digest('hex')
    .slice(0, 16);
  const vsVersionId = md5uuid(
    `mantra:dx-devices:value-set-version:${VALUE_SET.code}:${vsVersion}`,
  );
  const members = nodes
    .filter((n) => n.diagnostic === true)
    .map((n) => [
      md5uuid(
        `mantra:dx-devices:value-set-member:${vsVersionId}:${n.system}:${conceptCode(n)}`,
      ),
      vsVersionId,
      conceptId(n.system, conceptCode(n)),
      true,
      null,
    ]);
  return {
    skipped: [...skipped.entries()].map(([system, count]) => ({
      system,
      count,
      ...loadPolicy(system),
    })),
    skippedCrosswalks: allCrosswalks.length - crosswalks.length,
    systems,
    maps,
    valueSet: {
      id: valueSetId,
      ...VALUE_SET,
      version: `content-sha256:${vsVersion}`,
      versionId: vsVersionId,
      members,
    },
  };
}
