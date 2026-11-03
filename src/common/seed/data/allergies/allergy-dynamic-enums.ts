import type { DynamicEnumCatalogEntry } from '../../dynamic-enum-catalog';
import { CLIN } from '../../../../modules/clinical/clinical.concepts';
import { ALG } from './allergy.concepts';

/**
 * Enumeraciones de los campos de catálogo de `clinical.allergy_intolerances` y
 * `clinical.allergy_reactions`, una por cada value set de HL7 FHIR
 * `AllergyIntolerance` (R5 / HL7 Terminology). Los códigos HL7 de cada opción
 * están en `fhir-allergy-enum-codes.json`.
 *
 * Quedan fuera, a propósito, la sustancia (`substance_concept_id`) y la
 * manifestación (`manifestation_concept_id`): son catálogos de decenas de miles
 * de conceptos que carga el importador de `tools/terminology-import/allergies/`
 * en sus propios value sets, no un selector cerrado.
 *
 * Se esparce en `DYNAMIC_ENUM_CATALOG`; el orden de cada lista es el del
 * CodeSystem de HL7.
 */
export const ALLERGY_DYNAMIC_ENUMS: readonly DynamicEnumCatalogEntry[] = [
  {
    code: 'allergy-intolerance-type',
    name: 'Tipo de reacción adversa',
    description:
      'Si el mecanismo es alérgico (inmunitario) o una intolerancia no alérgica (HL7 allergy-intolerance-type).',
    concepts: [CLIN.ALLERGY_TYPE_ALLERGY, ALG.TYPE_INTOLERANCE],
    targets: ['clinical.allergy_intolerances.type_concept_id'],
  },
  {
    code: 'allergy-intolerance-category',
    name: 'Categoría de la sustancia',
    description:
      'Grupo general de la sustancia causante: alimento, medicamento, ambiental o biológico (HL7 allergy-intolerance-category).',
    concepts: [
      ALG.CATEGORY_FOOD,
      CLIN.ALLERGY_CATEGORY_MEDICATION,
      ALG.CATEGORY_ENVIRONMENT,
      ALG.CATEGORY_BIOLOGIC,
    ],
    targets: ['clinical.allergy_intolerances.category_concept_id'],
  },
  {
    code: 'allergy-intolerance-criticality',
    name: 'Criticidad',
    description:
      'Riesgo estimado de una reacción grave ante una exposición futura (HL7 allergy-intolerance-criticality).',
    concepts: [
      ALG.CRITICALITY_LOW,
      CLIN.ALLERGY_CRITICALITY_HIGH,
      ALG.CRITICALITY_UNABLE_TO_ASSESS,
    ],
    targets: ['clinical.allergy_intolerances.criticality_concept_id'],
  },
  {
    code: 'allergyintolerance-clinical',
    name: 'Estado clínico de la alergia',
    description:
      'Si el riesgo de reacción sigue vigente (HL7 allergyintolerance-clinical).',
    concepts: [
      CLIN.ALLERGY_ACTIVE,
      ALG.CLINICAL_INACTIVE,
      ALG.CLINICAL_RESOLVED,
    ],
    // Es el valor que ya fija el alta (`AllergyIntolerancesService`).
    defaultConceptId: CLIN.ALLERGY_ACTIVE,
    targets: ['clinical.allergy_intolerances.clinical_status_concept_id'],
  },
  {
    code: 'allergyintolerance-verification',
    name: 'Estado de verificación de la alergia',
    description:
      'Qué tan comprobada está la alergia (HL7 allergyintolerance-verification).',
    concepts: [
      ALG.VERIFICATION_UNCONFIRMED,
      ALG.VERIFICATION_PRESUMED,
      CLIN.ALLERGY_CONFIRMED,
      ALG.VERIFICATION_REFUTED,
      ALG.VERIFICATION_ENTERED_IN_ERROR,
    ],
    targets: ['clinical.allergy_intolerances.verification_status_concept_id'],
  },
  {
    code: 'allergy-reaction-severity',
    name: 'Severidad de la reacción',
    description:
      'Gravedad de una reacción concreta, no de la alergia en general (HL7 reaction-event-severity).',
    concepts: [
      ALG.REACTION_SEVERITY_MILD,
      ALG.REACTION_SEVERITY_MODERATE,
      ALG.REACTION_SEVERITY_SEVERE,
    ],
    targets: ['clinical.allergy_reactions.severity_concept_id'],
  },
];
