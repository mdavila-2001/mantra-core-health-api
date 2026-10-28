// =============================================================================
// Sintaxis de la nomenclatura HGVS (HGVSnomenclature/hgvs-nomenclature,
// `docs/syntax.yaml`; texto CC0 1.0, artefactos legibles por máquina MIT).
//
// Vocabulario de la SINTAXIS (no variantes concretas):
//  - `element:<nombre>`   elementos globales (`element_descriptions`) con su
//                         descripción verbatim.
//  - `<sección>:<tipo>`   tipos de variante por sección del archivo (`aa`,
//                         `dna`, `rna`): del, dup, ins, sub… con sus formas
//                         (nombre, sintaxis, ejemplos, notas) verbatim y los
//                         elementos propios del tipo.
// Las claves del YAML se usan tal cual como código; el display es la clave del
// tipo precedida por la sección (`dna del`). Nada se traduce ni se completa.
// =============================================================================

import { readFileSync } from 'node:fs';
import { load as yamlLoad } from 'js-yaml';
import { cleanProps, designationList, prop, withProvenance } from './rows.mjs';

const clean = (v) => (v == null ? null : Array.isArray(v) ? v.filter((x) => x != null) : v);

export function hgvsRows(path, prov) {
  const doc = yamlLoad(readFileSync(path, 'utf8'));
  const expected = ['element_descriptions', 'aa', 'dna', 'rna'];
  if (Object.keys(doc).join() !== expected.join()) throw new Error(`syntax.yaml: secciones inesperadas: ${Object.keys(doc).join()}`);
  const rows = [];
  const base = (row) => withProvenance({ definition: null, parents: [], maps: [], relations: [], ...row }, prov, { source: 'hgvs-syntax', sourceUrl: 'https://hgvs-nomenclature.org/stable/' });
  for (const [name, description] of Object.entries(doc.element_descriptions)) {
    rows.push(
      base({
        codeSystem: 'hgvs-syntax',
        code: `element:${name}`,
        display: name,
        designations: designationList(name, []),
        definition: description ? { text: String(description), lang: 'en' } : null,
        properties: cleanProps([prop('syntax_kind', 'string', 'elemento global (element_descriptions)')]),
      }),
    );
  }
  for (const section of ['aa', 'dna', 'rna']) {
    for (const [type, def] of Object.entries(doc[section])) {
      const forms = (def.forms ?? []).map((f) => ({ name: f.name ?? null, syntax: f.syntax, examples: clean(f.examples) ?? [], notes: clean(f.notes) ?? [] }));
      rows.push(
        base({
          codeSystem: 'hgvs-syntax',
          code: `${section}:${type}`,
          display: `${section} ${type}`,
          designations: designationList(`${section} ${type}`, []),
          properties: cleanProps([
            prop('syntax_kind', 'string', 'tipo de variante por sección de syntax.yaml'),
            prop('syntax_section', 'string', section),
            prop('variant_type_key', 'string', type),
            prop('forms', 'json', forms),
            prop('local_elements', 'json', def.elements && typeof def.elements === 'object' ? def.elements : null),
          ]),
        }),
      );
    }
  }
  return { rows };
}
