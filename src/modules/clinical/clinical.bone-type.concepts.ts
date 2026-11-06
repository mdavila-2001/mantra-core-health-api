import { defineModuleConcepts } from '../../common/seed/concept-seed';

/**
 * Tipos de hueso de una orden de imagen (`clinical.service_requests.bone_type_concept_id`,
 * value set `bone-type`). Los elige el médico; no se derivan de la región.
 *
 * Mismo prefijo `clinical` que `clinical.concepts.ts`: el id de cada uno es
 * `uuid5(HEALTH_UUID_NAMESPACE, 'clinical:BONE_TYPE_*')`, el mismo que siembra el
 * modelo (parche v4294), así que los dos lados convergen sin duplicar conceptos.
 * Equivalencia externa de cada clase: ver la procedencia en el parche del modelo.
 */
export const { seeds: BONE_TYPE_CONCEPT_SEEDS, ids: BONE_TYPE } =
  defineModuleConcepts('clinical', {
    BONE_TYPE_LONG: { code: 'BONE_TYPE_LONG', display: 'Hueso largo' },
    BONE_TYPE_SHORT: { code: 'BONE_TYPE_SHORT', display: 'Hueso corto' },
    BONE_TYPE_FLAT: { code: 'BONE_TYPE_FLAT', display: 'Hueso plano' },
    BONE_TYPE_IRREGULAR: {
      code: 'BONE_TYPE_IRREGULAR',
      display: 'Hueso irregular',
    },
    BONE_TYPE_SESAMOID: {
      code: 'BONE_TYPE_SESAMOID',
      display: 'Hueso sesamoideo',
    },
  });

/** Los cinco ids, en el orden de la declaración. */
export const BONE_TYPE_CONCEPT_IDS: string[] = Object.values(BONE_TYPE);
