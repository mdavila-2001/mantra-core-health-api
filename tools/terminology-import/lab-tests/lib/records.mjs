// =============================================================================
// Registro común del catálogo de análisis médicos (una línea de NDJSON).
//
// Todas las fuentes (LOINC, tablas HL7, UCUM) se normalizan a esta forma antes
// de cargar. Nada de acá decide contenido: define la forma y la valida, para que
// un parser que deje de leer bien su fuente falle en el build y no en la base.
//
//   {
//     id, codeSystem, code, display, definition, lang, selectable, status,
//     category: { scheme, code, display } | null,   // categoría que DECLARA la fuente
//     domain, domainRule,                           // dominio AloVida (regla en domains.mjs)
//     properties: { <property_code>: valor },       // sólo lo que la fuente declara
//     designations: [{ lang, type, value }],        // sólo variantes oficiales
//     relations: [{ type, targetCodeSystem, targetCode, ordinal }],
//     valueSets: [<código de value set>],
//     provenance: { source, sourceName, sourceId, sourceVersion, sourceUrl,
//                   sourceFile, sourceSha256, retrievedAt, license }
//   }
// =============================================================================

import { md5uuid } from '../../lib/glossary-es/load-plan.mjs';

export const DOMAINS = {
  laboratory: 'Laboratorio clínico',
  imaging: 'Imagenología',
  pathology: 'Anatomía patológica',
  genetics: 'Genética y molecular',
  functional: 'Pruebas funcionales',
};

/**
 * Id estable del concepto. LOINC reusa EXACTAMENTE la clave de import-loinc.mjs
 * (`md5('mantra:loinc:concept:<code>')`) para enriquecer el mismo concepto si
 * el subconjunto NLM ya se cargó, en vez de duplicarlo.
 */
export function conceptIdFor(codeSystem, code) {
  if (codeSystem === 'loinc') return md5uuid(`mantra:loinc:concept:${code}`);
  return md5uuid(`mantra:lab-tests:concept:${codeSystem}:${code}`);
}

export function propertyIdFor(codeSystem, code, propertyCode) {
  if (codeSystem === 'loinc') return md5uuid(`mantra:loinc:property:${code}:${propertyCode}`);
  return md5uuid(`mantra:lab-tests:property:${codeSystem}:${code}:${propertyCode}`);
}

const REQUIRED_PROVENANCE = ['source', 'sourceName', 'sourceId', 'sourceVersion', 'sourceUrl', 'retrievedAt', 'license'];

/** Valida un registro; devuelve el mismo objeto (para usar en `.map`). */
export function assertRecord(r) {
  const fail = (msg) => {
    throw new Error(`Registro inválido ${r?.codeSystem}|${r?.code}: ${msg}`);
  };
  if (!r || typeof r !== 'object') fail('no es un objeto');
  for (const k of ['id', 'codeSystem', 'code', 'display', 'lang']) if (typeof r[k] !== 'string' || r[k] === '') fail(`falta ${k}`);
  if (r.id !== conceptIdFor(r.codeSystem, r.code)) fail('id no determinista');
  if (typeof r.selectable !== 'boolean') fail('selectable no es booleano');
  if (r.domain != null && !Object.hasOwn(DOMAINS, r.domain)) fail(`dominio desconocido ${r.domain}`);
  if (r.domain != null && !r.domainRule) fail('dominio sin regla');
  for (const k of REQUIRED_PROVENANCE) if (!r.provenance?.[k]) fail(`procedencia sin ${k}`);
  for (const [k, v] of Object.entries(r.properties ?? {})) if (v == null || v === '' || (Array.isArray(v) && v.length === 0)) fail(`propiedad vacía ${k}`);
  for (const d of r.designations ?? []) if (!d.value || !d.lang || !['preferred', 'synonym'].includes(d.type)) fail('designación inválida');
  for (const x of r.relations ?? []) if (!x.type || !x.targetCodeSystem || !x.targetCode) fail('relación inválida');
  return r;
}

/** Atajo: objeto sin claves nulas/vacías (lo que la fuente no trae no se escribe). */
export function compact(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v != null && v !== '' && !(Array.isArray(v) && v.length === 0)));
}
