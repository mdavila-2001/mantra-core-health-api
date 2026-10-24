// =============================================================================
// Lector de arquetipos ADL 1.4 (formato del espejo de openEHR CKM).
//
// - Secciones ODIN (`language`, `description`, `ontology`) → `parseOdin`.
// - Sección `definition` (cADL) → árbol liviano de nodos con código `atNNNN`:
//   tipo del modelo de referencia, padre, si es ranura (`allow_archetype`), y
//   las respuestas codificadas que restringe (`[local::at…]`) con su valor
//   ordinal cuando lo tiene (`3|[local::at0007]`).
//
// No es un validador de ADL: lee lo necesario para catalogar los términos que
// el arquetipo publica, verbatim. Lo que no reconoce lo deja afuera y lo cuenta.
// =============================================================================

import { parseOdin } from './odin.mjs';

const SECTION_NAMES = ['archetype', 'specialize', 'specialise', 'concept', 'language', 'description', 'definition', 'invariant', 'ontology', 'annotations'];

/** Normaliza fin de línea y quita el BOM. */
export function normalizeSource(text) {
  return String(text).replace(/^﻿/, '').replace(/\r\n?/g, '\n');
}

/** Divide el texto en secciones de primer nivel (líneas sin sangría). */
export function splitSections(text) {
  const lines = normalizeSource(text).split('\n');
  const sections = {};
  let current = null;
  let header = null;
  for (const line of lines) {
    const m = /^([a-z_]+)\b(.*)$/.exec(line);
    if (m && SECTION_NAMES.includes(m[1])) {
      current = m[1] === 'specialise' ? 'specialize' : m[1];
      sections[current] = [];
      if (current === 'archetype') header = m[2].trim();
      continue;
    }
    if (current) sections[current].push(line);
  }
  return { header, sections: Object.fromEntries(Object.entries(sections).map(([k, v]) => [k, v.join('\n')])) };
}

/** Quita comentarios `--` de una línea de cADL respetando las comillas. */
function stripComment(line) {
  let inStr = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '\\' && inStr) {
      i++;
      continue;
    }
    if (c === '"') inStr = !inStr;
    if (!inStr && c === '-' && line[i + 1] === '-') return line.slice(0, i);
  }
  return line;
}

/** Quita cadenas y expresiones regulares `{/…/}` para contar llaves sin falsos positivos. */
function maskLiterals(line) {
  return line.replace(/"(?:[^"\\]|\\.)*"/g, '""').replace(/\{\/.*?\/\}/g, '{}');
}

/**
 * Recorre la sección `definition` y devuelve los nodos con código at.
 * @returns {{ nodes: Array<{ atCode: string, rmType: string, parentAt: string|null, slot: boolean, depth: number, values: Array<{ atCode: string, ordinal: number|null }>, dataTypes: string[], includes: string[], excludes: string[] }> }}
 */
export function parseDefinition(definitionText) {
  const lines = normalizeSource(definitionText).split('\n').map(stripComment);
  const nodes = [];
  /** pila de { node|null, depthOpened } */
  const stack = [];
  let depth = 0;
  let pendingCoded = null; // texto acumulado de un `[local::` partido en varias líneas
  const current = () => {
    for (let i = stack.length - 1; i >= 0; i--) if (stack[i].node) return stack[i].node;
    return null;
  };
  const addValue = (atCode, ordinal) => {
    const node = current();
    if (!node) return;
    if (!node.values.some((v) => v.atCode === atCode)) node.values.push({ atCode, ordinal });
  };
  let slotMode = null; // 'include' | 'exclude' dentro de una ranura
  for (const raw of lines) {
    const line = maskLiterals(raw);
    // Ranuras: `include` / `exclude` + `archetype_id/value matches {/patrón/}`.
    const cur = current();
    if (cur?.slot) {
      if (/^\s*include\s*$/.test(raw)) slotMode = 'include';
      else if (/^\s*exclude\s*$/.test(raw)) slotMode = 'exclude';
      const pm = /archetype_id\/value\s+matches\s+\{\/(.*)\/\}/.exec(raw);
      if (pm) (slotMode === 'exclude' ? cur.excludes : cur.includes).push(pm[1]);
    }
    if (pendingCoded !== null) {
      pendingCoded += ' ' + line;
      if (line.includes(']')) {
        for (const code of extractCodedList(pendingCoded)) addValue(code, null);
        pendingCoded = null;
      }
      continue;
    }
    const nodeMatch = /\b(allow_archetype\s+)?([A-Z][A-Z0-9_]*)\[(at[0-9.]+)\]/.exec(line);
    let openedNode = null;
    if (nodeMatch && /\bmatches\s*\{/.test(line)) {
      openedNode = {
        atCode: nodeMatch[3],
        rmType: nodeMatch[2],
        parentAt: current()?.atCode ?? null,
        slot: Boolean(nodeMatch[1]),
        depth: 0,
        values: [],
        dataTypes: [],
        includes: [],
        excludes: [],
      };
      nodes.push(openedNode);
      slotMode = null;
    }
    // Ordinales: `3|[local::at0007]` (también negativos o decimales).
    for (const m of line.matchAll(/(-?\d+(?:\.\d+)?)\s*\|\s*\[local::\s*(at[0-9.]+)\s*\]/g)) addValue(m[2], Number(m[1]));
    // Texto codificado: `[local::at0005, at0006; at0005]`, en una o varias líneas.
    const codedStart = line.search(/\[local::/);
    if (codedStart >= 0 && !/\|\s*\[local::/.test(line)) {
      const rest = line.slice(codedStart);
      if (rest.includes(']')) for (const code of extractCodedList(rest)) addValue(code, null);
      else pendingCoded = rest;
    }
    for (const m of line.matchAll(/\b(DV_[A-Z_]+|C_DV_[A-Z_]+)\b/g)) {
      const node = current();
      if (node && !node.dataTypes.includes(m[1])) node.dataTypes.push(m[1]);
    }
    // Contabilidad de llaves: el nodo abierto en esta línea es dueño de la ÚLTIMA
    // `{` que queda abierta al final de la línea (`occurrences matches {0..1} matches {`).
    let ownerIdx = -1;
    if (openedNode) {
      const open = [];
      for (let i = 0; i < line.length; i++) {
        if (line[i] === '{') open.push(i);
        else if (line[i] === '}') open.pop();
      }
      ownerIdx = open.at(-1) ?? -1;
    }
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '{') {
        depth++;
        if (openedNode && i === ownerIdx) {
          openedNode.depth = depth;
          stack.push({ node: openedNode, depth });
          openedNode = null;
        } else {
          stack.push({ node: null, depth });
        }
      } else if (ch === '}') {
        stack.pop();
        depth--;
      }
    }
  }
  if (depth !== 0) throw new Error(`cADL: llaves desbalanceadas (profundidad final ${depth})`);
  // Un ordinal escrito sin `DV_ORDINAL` explícito sigue siendo un ordinal.
  for (const n of nodes) if (n.values.some((v) => v.ordinal !== null) && !n.dataTypes.includes('DV_ORDINAL')) n.dataTypes.push('DV_ORDINAL');
  return { nodes };
}

function extractCodedList(text) {
  const m = /\[local::([^\]]*)\]/.exec(text);
  if (!m) return [];
  const [list] = m[1].split(';');
  return list
    .split(',')
    .map((s) => s.trim())
    .filter((s) => /^at[0-9.]+$/.test(s));
}

/**
 * Lee un arquetipo completo.
 * @param {string} text  contenido del `.adl`
 */
export function parseArchetype(text) {
  const { header, sections } = splitSections(text);
  const archetypeId = (sections.archetype ?? '').trim().split(/\s+/)[0];
  if (!/^[A-Za-z0-9_-]+-[A-Za-z0-9_-]+-[A-Z_]+\.[A-Za-z0-9_-]+\.v\d+$/.test(archetypeId)) throw new Error(`ADL: id de arquetipo inválido «${archetypeId}»`);
  const headerAttrs = Object.fromEntries(
    [...(header ?? '').matchAll(/([a-z_]+)\s*=\s*([^;)]+)/g)].map((m) => [m[1], m[2].trim()]),
  );
  const conceptAt = /\[(at[0-9.]+)\]/.exec(sections.concept ?? '')?.[1] ?? null;
  const specialises = (sections.specialize ?? '').trim() || null;
  const language = sections.language ? parseOdin(sections.language) : {};
  const description = sections.description ? parseOdin(sections.description) : {};
  const ontology = sections.ontology ? parseOdin(sections.ontology) : {};
  const definition = sections.definition ? parseDefinition(sections.definition) : { nodes: [] };
  return {
    archetypeId,
    adlVersion: headerAttrs.adl_version ?? null,
    uid: headerAttrs.uid ?? null,
    conceptAt,
    specialises,
    originalLanguage: language.original_language?.code ?? null,
    translations: language.translations ?? {},
    description,
    ontology,
    definition,
  };
}

/** Textos (`text`, `description`, `comment`) de un código at en un idioma. */
export function termText(archetype, lang, atCode) {
  const items = archetype.ontology?.term_definitions?.[lang]?.items ?? {};
  const t = items[atCode];
  return t ? { text: t.text ?? null, description: t.description ?? null, comment: t.comment ?? null } : null;
}

/** Idiomas con definiciones de términos en la ontología. */
export function ontologyLanguages(archetype) {
  return Object.keys(archetype.ontology?.term_definitions ?? {});
}

/**
 * Enlaces a terminologías externas declarados por el propio arquetipo
 * (`term_bindings`). Admite el valor como código `[LOINC::38228-3]` o como URI.
 * @returns {Array<{ terminology: string, key: string, code: string|null, uri: string|null }>}
 */
export function termBindings(archetype) {
  const out = [];
  for (const [terminology, block] of Object.entries(archetype.ontology?.term_bindings ?? {})) {
    for (const [key, v] of Object.entries(block?.items ?? {})) {
      if (v && typeof v === 'object' && 'code' in v) out.push({ terminology, key, code: v.code, uri: null });
      else if (typeof v === 'string') out.push({ terminology, key, code: null, uri: v });
    }
  }
  return out;
}
