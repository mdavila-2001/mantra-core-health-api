import { describe, expect, it } from '@jest/globals';
import { deterministicId } from '../../../constants/concepts';
import { DYNAMIC_ENUM_CATALOG } from '../../dynamic-enum-catalog';
import { MODULE_CONCEPT_SEEDS } from '../../module-concepts';
import { SPANISH_DESIGNATIONS } from '../../terminology-designations.es';
import { ALLERGY_DYNAMIC_ENUMS } from './allergy-dynamic-enums';
import { ALG, ALLERGY_CONCEPT_SEEDS } from './allergy.concepts';
import enumCodes from './fhir-allergy-enum-codes.json';

/**
 * Las enumeraciones de alergia tienen tres piezas que deben decir lo mismo: los
 * conceptos (`allergy.concepts.ts` + los cinco que ya tenía `CLIN`), las
 * enumeraciones (`allergy-dynamic-enums.ts`) y la correspondencia con HL7
 * (`fhir-allergy-enum-codes.json`, que lee también el importador para escribir
 * los `concept_maps`). Si una se mueve sola, el importador mapea a un concepto
 * que la API no sembró o un selector ofrece un valor sin código HL7.
 */
describe('enumeraciones de alergia (HL7 FHIR AllergyIntolerance)', () => {
  const byCode = new Map(enumCodes.valueSets.map((vs) => [vs.enumCode, vs]));

  it('cada enumeración tiene su CodeSystem de HL7 con un código por opción, en el mismo orden', () => {
    for (const entry of ALLERGY_DYNAMIC_ENUMS) {
      const hl7 = byCode.get(entry.code);
      expect(hl7).toBeDefined();
      expect(hl7!.members.map((m) => deterministicId(m.conceptKey))).toEqual([
        ...entry.concepts,
      ]);
    }
    expect(byCode.size).toBe(ALLERGY_DYNAMIC_ENUMS.length);
  });

  it('las claves del JSON son conceptos que el seed materializa', () => {
    const seeded = new Set(MODULE_CONCEPT_SEEDS.map((s) => s.key));
    for (const vs of enumCodes.valueSets) {
      for (const m of vs.members) expect(seeded.has(m.conceptKey)).toBe(true);
    }
  });

  it('todo concepto nuevo de alergia se ofrece en alguna enumeración', () => {
    const offered = new Set(ALLERGY_DYNAMIC_ENUMS.flatMap((e) => e.concepts));
    for (const id of Object.values(ALG)) expect(offered.has(id)).toBe(true);
    expect(ALLERGY_CONCEPT_SEEDS).toHaveLength(Object.keys(ALG).length);
  });

  it('está publicada en el catálogo de enumeraciones y traducida al castellano', () => {
    const published = new Set(DYNAMIC_ENUM_CATALOG.map((e) => e.code));
    for (const entry of ALLERGY_DYNAMIC_ENUMS) {
      expect(published.has(entry.code)).toBe(true);
      for (const id of entry.concepts) {
        expect(SPANISH_DESIGNATIONS.get(id)?.display).toBeTruthy();
      }
    }
  });

  it('gobierna los seis campos de catálogo de alergia y reacción', () => {
    expect(ALLERGY_DYNAMIC_ENUMS.flatMap((e) => e.targets).sort()).toEqual([
      'clinical.allergy_intolerances.category_concept_id',
      'clinical.allergy_intolerances.clinical_status_concept_id',
      'clinical.allergy_intolerances.criticality_concept_id',
      'clinical.allergy_intolerances.type_concept_id',
      'clinical.allergy_intolerances.verification_status_concept_id',
      'clinical.allergy_reactions.severity_concept_id',
    ]);
  });
});
