// =============================================================================
// GA4GH VRS 2.0.x (Variation Representation Specification, Apache-2.0):
// términos del esquema `vrs-source.yaml` — clases (`$defs`) con su madurez,
// herencia y descripción verbatim, y los valores de enumeración del esquema
// (`<Clase>.<propiedad>:<valor>`). Las descripciones están en el formato del
// propio esquema (texto con referencias `:ref:`); no se reescriben.
// =============================================================================

import { readFileSync } from 'node:fs';
import { load as yamlLoad } from 'js-yaml';
import { cleanProps, designationList, prop, withProvenance } from './rows.mjs';

function enumsOf(obj, path, out) {
  if (!obj || typeof obj !== 'object') return;
  if (Array.isArray(obj.enum) && path.length > 1) out.push({ path: path.join('.'), values: obj.enum, description: obj.description ?? null });
  for (const [k, v] of Object.entries(obj)) if (k !== 'enum') enumsOf(v, [...path, k], out);
}

export function vrsRows(path, prov) {
  const doc = yamlLoad(readFileSync(path, 'utf8'));
  const defs = doc.$defs;
  const rows = [];
  const base = (row) => withProvenance({ definition: null, maps: [], relations: [], ...row }, prov, { source: 'vrs-schema', sourceUrl: doc.$id });
  const known = new Set(Object.keys(defs));
  const enums = [];
  for (const [name, d] of Object.entries(defs)) {
    const inherits = d.inherits ? String(d.inherits) : null;
    rows.push(
      base({
        codeSystem: 'ga4gh-vrs',
        code: name,
        display: name,
        designations: designationList(name, []),
        definition: d.description ? { text: String(d.description).replace(/\s+$/, ''), lang: 'en' } : null,
        properties: cleanProps([
          prop('vrs_kind', 'string', 'clase o tipo del esquema ($defs)'),
          prop('maturity', 'string', d.maturity ?? null),
          prop('inherits', 'string', inherits),
          prop('one_of', 'json', Array.isArray(d.oneOf) ? d.oneOf.map((x) => x.$ref).filter(Boolean) : null),
          prop('properties', 'json', d.properties ? Object.keys(d.properties) : d.heritableProperties ? Object.keys(d.heritableProperties) : null),
          prop('required', 'json', d.required ?? null),
        ]),
        parents: inherits && known.has(inherits) ? [inherits] : [],
      }),
    );
    enumsOf(d, [name], enums);
  }
  for (const e of enums) {
    e.values.forEach((value, i) => {
      rows.push(
        base({
          codeSystem: 'ga4gh-vrs',
          code: `${e.path}:${value}`,
          display: String(value),
          designations: designationList(String(value), []),
          properties: cleanProps([
            prop('vrs_kind', 'string', 'valor de enumeración del esquema'),
            prop('enum_path', 'string', e.path),
            prop('list_position', 'string', String(i + 1)),
          ]),
          parents: [],
        }),
      );
    });
  }
  return { rows, version: doc.$id };
}
