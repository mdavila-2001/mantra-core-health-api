import type { SpanishDesignation } from '../../terminology-designations.es';
import { CLIN } from '../../../../modules/clinical/clinical.concepts';
import { ALG } from './allergy.concepts';

/**
 * Nombre y explicación en castellano de cada opción de las enumeraciones de
 * alergia (`allergy-dynamic-enums.ts`).
 *
 * **Traducción de este proyecto, no oficial.** HL7 no publica una versión en
 * castellano de estos CodeSystems (los paquetes `hl7.fhir.r5.core` 5.0.0 y
 * `hl7.terminology.r4` 7.0.1 sólo traen designaciones en inglés, y en alemán
 * para las tablas v2). Los nombres siguen el uso clínico habitual; las
 * definiciones parafrasean la `definition` del CodeSystem de HL7 en lenguaje
 * llano. Si HL7 o una edición nacional publica la traducción, se reemplaza por
 * la oficial.
 *
 * Se esparce en `ENTRIES` de `terminology-designations.es.ts`.
 */
export const ALLERGY_SPANISH_DESIGNATION_ENTRIES: readonly (readonly [
  string,
  SpanishDesignation,
])[] = [
  // --- Tipo (HL7 allergy-intolerance-type) ----------------------------------
  [
    CLIN.ALLERGY_TYPE_ALLERGY,
    {
      display: 'Alergia',
      definition:
        'Tendencia a reaccionar de forma exagerada ante una sustancia por un mecanismo del sistema inmunitario, aunque ese mecanismo no siempre se haya comprobado.',
    },
  ],
  [
    ALG.TYPE_INTOLERANCE,
    {
      display: 'Intolerancia',
      definition:
        'Tendencia a sufrir efectos adversos ante una sustancia por un mecanismo que se considera no alérgico.',
    },
  ],
  // --- Categoría (HL7 allergy-intolerance-category) -------------------------
  [
    ALG.CATEGORY_FOOD,
    {
      display: 'Alimento',
      definition:
        'Sustancia que se consume para nutrir el cuerpo, incluidos sus ingredientes y aditivos.',
    },
  ],
  [
    CLIN.ALLERGY_CATEGORY_MEDICATION,
    {
      display: 'Medicamento',
      definition:
        'Sustancia que se administra para lograr un efecto en el organismo, como un fármaco o su principio activo.',
    },
  ],
  [
    ALG.CATEGORY_ENVIRONMENT,
    {
      display: 'Ambiental',
      definition:
        'Sustancia con la que se tiene contacto en el entorno, como pólenes, ácaros, epitelios de animales, hongos, látex o productos de contacto.',
    },
  ],
  [
    ALG.CATEGORY_BIOLOGIC,
    {
      display: 'Biológico',
      definition:
        'Preparado obtenido de organismos vivos o de sus productos, como vacunas, sangre y hemoderivados, o anticuerpos.',
    },
  ],
  // --- Criticidad (HL7 allergy-intolerance-criticality) ---------------------
  [
    ALG.CRITICALITY_LOW,
    {
      display: 'Riesgo bajo',
      definition:
        'Se estima que una nueva exposición no pondría en riesgo la vida ni dañaría gravemente un órgano.',
    },
  ],
  [
    CLIN.ALLERGY_CRITICALITY_HIGH,
    {
      display: 'Riesgo alto',
      definition:
        'Se estima que una nueva exposición podría poner en riesgo la vida o dañar gravemente un órgano.',
    },
  ],
  [
    ALG.CRITICALITY_UNABLE_TO_ASSESS,
    {
      display: 'Riesgo no evaluable',
      definition:
        'No es posible estimar qué tan grave sería la reacción ante una nueva exposición.',
    },
  ],
  // --- Estado clínico (HL7 allergyintolerance-clinical) ---------------------
  [
    CLIN.ALLERGY_ACTIVE,
    {
      display: 'Activa',
      definition:
        'La persona presenta reacciones o sigue en riesgo de presentarlas ante la sustancia.',
    },
  ],
  [
    ALG.CLINICAL_INACTIVE,
    {
      display: 'Inactiva',
      definition:
        'La persona ya no está en riesgo de reaccionar ante la sustancia.',
    },
  ],
  [
    ALG.CLINICAL_RESOLVED,
    {
      display: 'Resuelta',
      definition:
        'Se volvió a evaluar con pruebas o con una nueva exposición y la persona ya no reacciona ante la sustancia.',
    },
  ],
  // --- Verificación (HL7 allergyintolerance-verification) -------------------
  [
    ALG.VERIFICATION_UNCONFIRMED,
    {
      display: 'Sin confirmar',
      definition:
        'La tendencia a reaccionar no se comprobó con pruebas ni con la evolución clínica.',
    },
  ],
  [
    ALG.VERIFICATION_PRESUMED,
    {
      display: 'Presunta',
      definition:
        'La información clínica disponible indica que la tendencia a reaccionar es muy probable, aunque no se comprobó.',
    },
  ],
  [
    CLIN.ALLERGY_CONFIRMED,
    {
      display: 'Confirmada',
      definition:
        'La tendencia a reaccionar se comprobó con pruebas o con la evolución clínica.',
    },
  ],
  [
    ALG.VERIFICATION_REFUTED,
    {
      display: 'Descartada',
      definition:
        'Se demostró, con un grado alto de certeza, que la persona no tiene esa tendencia a reaccionar.',
    },
  ],
  [
    ALG.VERIFICATION_ENTERED_IN_ERROR,
    {
      display: 'Registrada por error',
      definition: 'El registro se cargó por error y no tiene validez.',
    },
  ],
  // --- Severidad de la reacción (HL7 reaction-event-severity) ---------------
  [
    ALG.REACTION_SEVERITY_MILD,
    {
      display: 'Leve',
      definition: 'La reacción tuvo efectos leves en el organismo.',
    },
  ],
  [
    ALG.REACTION_SEVERITY_MODERATE,
    {
      display: 'Moderada',
      definition: 'La reacción tuvo efectos moderados en el organismo.',
    },
  ],
  [
    ALG.REACTION_SEVERITY_SEVERE,
    {
      display: 'Grave',
      definition: 'La reacción tuvo efectos graves en el organismo.',
    },
  ],
];
