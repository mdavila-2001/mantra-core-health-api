// Pruebas del importador de enfermería con archivos REALES de las fuentes
// (ver fixtures/README.md). Correr: node --test tools/terminology-import/nursing-care/test/
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { parseArchetype, parseDefinition, termBindings } from '../lib/adl.mjs';
import { archetypeClass, archetypeRows, classifyContentLicense, pickSpanish } from '../lib/ckm.mjs';
import { parseOdin } from '../lib/odin.mjs';
import { conceptId, inGlossary, loincRequestsFor, membershipsFor, propertiesFor, relationshipsFor } from '../lib/plan.mjs';
import { ANA_TERMINOLOGY_IDS, registryRows } from '../lib/registry.mjs';
import { msssiProfile, slotTargets } from '../lib/msssi.mjs';

const FIX = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');
const read = (name) => readFileSync(join(FIX, name), 'utf8');
const CTX = { path: 'local/archetypes/entry/observation/x.adl', commit: 'c3fdc43dcf0eb7ef0cfe60f548fcdebc24c70094', retrievedAt: '2026-10-24T00:53:37Z', repoUrl: 'https://github.com/openEHR/CKM-mirror' };

const ecog = parseArchetype(read('openEHR-EHR-OBSERVATION.ecog.v2.adl'));
const fluid = parseArchetype(read('openEHR-EHR-OBSERVATION.fluid_balance.v1.adl'));
const braden = parseArchetype(read('openEHR-EHR-OBSERVATION.braden_scale.v1.prefix-until-definition.adl'));

test('ODIN: claves con corchetes, escapes, listas y códigos de término', () => {
  const o = parseOdin(`items = <
    ["/data[at0002]/events[at0003]"] = <[LOINC::48334-7]>
    ["at0001"] = <"dice \\"hola\\"">
    ["kw"] = <"a", "b", ...>
  >`);
  assert.deepEqual(o.items['/data[at0002]/events[at0003]'], { terminology: 'LOINC', code: '48334-7' });
  assert.equal(o.items.at0001, 'dice "hola"');
  assert.deepEqual(o.items.kw, ['a', 'b']);
});

test('cADL: el nodo es dueño de la última llave abierta (occurrences matches {0..1} matches {)', () => {
  const { nodes } = parseDefinition(`OBSERVATION[at0000] matches {
    data matches {
      ELEMENT[at0004] occurrences matches {0..1} matches {    -- X
        value matches {
          1|[local::at0005],
          2|[local::at0006]
        }
      }
      ELEMENT[at0009] occurrences matches {0..1} matches {
        value matches {
          DV_CODED_TEXT matches {
            defining_code matches {
              [local::
              at0010,
              at0011]
            }
          }
        }
      }
    }
  }`);
  const e4 = nodes.find((n) => n.atCode === 'at0004');
  const e9 = nodes.find((n) => n.atCode === 'at0009');
  assert.equal(e4.parentAt, 'at0000');
  assert.deepEqual(e4.values, [{ atCode: 'at0005', ordinal: 1 }, { atCode: 'at0006', ordinal: 2 }]);
  assert.equal(e9.parentAt, 'at0000');
  assert.deepEqual(e9.values.map((v) => v.atCode), ['at0010', 'at0011']);
});

test('ADL real: ECOG v2 (id, idioma, traducción es, ordinales 0–5)', () => {
  assert.equal(ecog.archetypeId, 'openEHR-EHR-OBSERVATION.ecog.v2');
  assert.equal(ecog.originalLanguage, 'en');
  assert.equal(archetypeClass(ecog.archetypeId), 'OBSERVATION');
  const el = ecog.definition.nodes.find((n) => n.atCode === 'at0004');
  assert.deepEqual(el.values.map((v) => v.ordinal), [0, 1, 2, 3, 4, 5]);
  assert.equal(archetypeClass('openEHR-DEMOGRAPHIC-CLUSTER.person_identifier.v0'), null);
});

test('Licencia del contenido: Braden con copyright de terceros, ECOG declarado de dominio público, balance de fluidos modelo propio', () => {
  const b = classifyContentLicense(braden);
  assert.equal(b.status, 'third-party-copyright');
  assert.ok(b.evidence.some((e) => /Barbara Braden and Nancy Bergstrom, 1988 All rights reserved/.test(e.text)));
  assert.equal(classifyContentLicense(ecog).status, 'declared-free');
  assert.equal(classifyContentLicense(fluid).status, 'openehr-model');
});

test('Filas: Braden sólo con la raíz y sin nombre ES (el es-ar es un marcador «*…(en)»)', () => {
  const rows = archetypeRows(braden, CTX);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].contentLoaded, false);
  assert.equal(rows[0].nameEs, null);
  assert.deepEqual(rows[0].nursingRules, ['N2-named-scales']);
  assert.ok(rows[0].bindings.length === 0, 'el prefijo no trae ontología');
});

test('Filas: ECOG con jerarquía y valores ordinales, verbatim en castellano', () => {
  const rows = archetypeRows(ecog, CTX);
  const values = rows.filter((r) => r.kind === 'value');
  assert.equal(values.length, 6);
  assert.equal(values[0].nameEs, 'Asintomático');
  assert.equal(values[0].ordinalValue, 0);
  assert.equal(values[0].parentCode, 'openEHR-EHR-OBSERVATION.ecog.v2::at0004');
  assert.equal(rows.find((r) => r.atCode === 'at0004').parentCode, 'openEHR-EHR-OBSERVATION.ecog.v2');
  assert.equal(rows[0].provenance.uri, `${CTX.repoUrl}/blob/${CTX.commit}/${CTX.path}`);
});

test('Plan: balance de fluidos entra al glosario de cuidados; ids deterministas y PART_OF', () => {
  const rows = archetypeRows(fluid, CTX);
  const root = rows[0];
  assert.equal(root.nameEs, 'Balance de fluidos');
  assert.ok(inGlossary(root));
  const m = membershipsFor(root).map((x) => x.valueSet);
  assert.deepEqual(m, ['nursing-care-clinical-models', 'glossary-all-terms', 'glossary-category-care']);
  const props = propertiesFor(root).map((p) => p.code);
  for (const code of ['glossary-slug', 'source_url', 'source_license', 'content_license', 'nursing-provenance', 'translation']) assert.ok(props.includes(code), code);
  assert.equal(conceptId(root), conceptId({ ...root }));
  const child = rows[1];
  const [rel] = relationshipsFor(child, new Set(rows.map((r) => r.code)));
  assert.equal(rel.target, conceptId(root));
  assert.equal(inGlossary(child), false);
  const ids = rows.flatMap((r) => propertiesFor(r).map((p) => p.id));
  assert.equal(new Set(ids).size, ids.length);
});

test('Enlaces: LOINC se pide por código; SNOMED no se guarda', () => {
  const rows = archetypeRows(fluid, CTX);
  const all = termBindings(fluid);
  const loinc = rows.flatMap(loincRequestsFor);
  assert.equal(loinc.length, all.filter((b) => /^(LOINC|LNC)/i.test(b.terminology) && b.code).length);
  const snomedCodes = all.filter((b) => /snomed/i.test(b.terminology)).map((b) => b.code);
  const stored = JSON.stringify(rows.flatMap(propertiesFor).map((p) => p.value));
  for (const c of snomedCodes) assert.ok(!stored.includes(`"${c}"`), `SNOMED ${c} no debe guardarse`);
});

test('pickSpanish prioriza «es» sobre variantes regionales', () => {
  assert.equal(pickSpanish(['en', 'es-ar', 'es']), 'es');
  assert.equal(pickSpanish(['en', 'es-cl', 'es-ar']), 'es-ar');
  assert.equal(pickSpanish(['en', 'pt-br']), null);
});

test('Registro: 12 terminologías ANA con OID y URI verbatim de HL7 THO 7.0.1', () => {
  const dir = join(FIX, 'hl7-tho-7.0.1');
  const ns = Object.fromEntries(readdirSync(dir).map((n) => {
    const d = JSON.parse(readFileSync(join(dir, n), 'utf8'));
    return [d.id, d];
  }));
  const rows = registryRows(ns, { packageName: 'hl7.terminology', packageVersion: '7.0.1', packageLicense: 'CC0-1.0', tarballUrl: 't', retrievedAt: 'r', integrity: 'i' });
  assert.equal(rows.length, ANA_TERMINOLOGY_IDS.length);
  const oms = rows.find((r) => r.code === 'oms');
  assert.equal(oms.nameOriginal, 'Omaha System');
  assert.equal(oms.hl7.oid, '2.16.840.1.113883.6.98');
  assert.equal(oms.license.status, 'public-domain-terms');
  assert.equal(rows.find((r) => r.code === 'nanda-i').license.loadable, false);
});

test('CMDIC: las ranuras del informe de enfermería nombran los arquetipos que lo componen (regla M2, fuera del glosario)', () => {
  const report = parseArchetype(`archetype (adl_version=1.4)
    CEN-EN13606-COMPOSITION.InformeCuidadosEnfermeria.v1
concept
    [at0000]
language
    original_language = <[ISO_639-1::es]>
description
    lifecycle_state = <"Draft">
definition
    COMPOSITION[at0000] occurrences matches {1..1} matches {  -- Informe Cuidados Enfermeria
        content existence matches {0..1} cardinality matches {0..*; ordered; unique} matches {
            SECTION[at0014] occurrences matches {1..1} matches {  -- Información sobre la valoración activa
                members existence matches {0..1} cardinality matches {0..*; ordered; unique} matches {
                    allow_archetype ENTRY[at0015] occurrences matches {0..*} matches {  -- Valoración activa
                        include
                            archetype_id/value matches {/CEN-EN13606-ENTRY.ValoracionActiva.v1/}
                    }
                }
            }
        }
    }
ontology
    term_definitions = <
        ["es"] = <
            items = <
                ["at0000"] = <
                    text = <"Informe Cuidados Enfermeria">
                    description = <"">
                >
                ["at0014"] = <
                    text = <"Información sobre la valoración activa">
                    description = <"">
                >
                ["at0015"] = <
                    text = <"Valoración activa">
                    description = <"">
                >
            >
        >
    >
`);
  const ids = ['CEN-EN13606-ENTRY.ValoracionActiva.v1', 'CEN-EN13606-ENTRY.Direccion.v1'];
  const targets = slotTargets(report, ids);
  assert.deepEqual([...targets], ['CEN-EN13606-ENTRY.ValoracionActiva.v1']);
  const profile = msssiProfile(targets);
  const rows = archetypeRows(report, { ...CTX, profile });
  assert.equal(rows[0].nameEs, 'Informe Cuidados Enfermeria');
  assert.equal(rows[0].contentLicense.status, 'official-publication-license-not-stated');
  assert.deepEqual(rows[0].nursingRules, ['M1-nursing-care-report']);
  assert.ok(inGlossary(rows[0]));
  const slot = rows.find((r) => r.atCode === 'at0015');
  assert.deepEqual(slot.slotIncludes, ['CEN-EN13606-ENTRY.ValoracionActiva.v1']);
  assert.equal(slot.parentCode, 'CEN-EN13606-COMPOSITION.InformeCuidadosEnfermeria.v1::at0014');
  const entry = parseArchetype(`archetype (adl_version=1.4)
    CEN-EN13606-ENTRY.ValoracionActiva.v1
concept
    [at0000]
language
    original_language = <[ISO_639-1::es]>
definition
    ENTRY[at0000] occurrences matches {1..1} matches {  -- Valoración Activa
    }
ontology
    term_definitions = <
        ["es"] = <
            items = <
                ["at0000"] = <
                    text = <"Valoración Activa">
                    description = <"">
                >
            >
        >
    >
`);
  const [e] = archetypeRows(entry, { ...CTX, profile });
  assert.deepEqual(e.nursingRules, ['M2-slot-of-nursing-care-report']);
  assert.equal(inGlossary(e), false);
  assert.ok(membershipsFor(e).some((m) => m.valueSet === 'nursing-care-clinical-models'));
});
