import { describe, expect, it } from '@jest/globals';
import { DYNAMIC_ENUM_CATALOG } from '../../common/seed/dynamic-enum-catalog';
import { MODULE_CONCEPT_SEEDS } from '../../common/seed/module-concepts';
import {
  BONE_TYPE,
  BONE_TYPE_CONCEPT_IDS,
  BONE_TYPE_CONCEPT_SEEDS,
} from './clinical.bone-type.concepts';

/** Ids que siembra el modelo (parche v4294) con la misma derivación uuid5. */
const MODEL_IDS = {
  BONE_TYPE_LONG: 'c5977762-07fa-55dd-8c0e-fc5358ac72ec',
  BONE_TYPE_SHORT: 'f02120f7-c5d1-5747-8dcc-f2ade3d18cd4',
  BONE_TYPE_FLAT: 'bc930351-dbba-5ac5-bf01-d78909c21559',
  BONE_TYPE_IRREGULAR: '043dfefa-d354-515e-b618-cc79a2bf1aab',
  BONE_TYPE_SESAMOID: '27274b9b-5495-5cce-8fa7-3be82a22b7d2',
};

describe('tipos de hueso de la orden de imagen', () => {
  it('los ids son los que siembra el modelo (si no, habría dos juegos de conceptos)', () => {
    expect(BONE_TYPE).toEqual(MODEL_IDS);
  });

  it('declara exactamente cinco claves con prefijo clinical, rótulo en español', () => {
    expect(BONE_TYPE_CONCEPT_SEEDS.map((s) => s.key)).toEqual(
      Object.keys(MODEL_IDS).map((k) => `clinical:${k}`),
    );
    expect(BONE_TYPE_CONCEPT_SEEDS.map((s) => s.display)).toEqual([
      'Hueso largo',
      'Hueso corto',
      'Hueso plano',
      'Hueso irregular',
      'Hueso sesamoideo',
    ]);
  });

  it('entran al seed de módulos una sola vez', () => {
    for (const seed of BONE_TYPE_CONCEPT_SEEDS) {
      expect(
        MODULE_CONCEPT_SEEDS.filter((s) => s.key === seed.key),
      ).toHaveLength(1);
    }
  });

  it('el enum dinámico bone-type apunta a la columna nueva con los cinco conceptos', () => {
    const entries = DYNAMIC_ENUM_CATALOG.filter((e) => e.code === 'bone-type');
    expect(entries).toHaveLength(1);
    expect(entries[0].targets).toEqual([
      'clinical.service_requests.bone_type_concept_id',
    ]);
    expect(entries[0].concepts).toEqual(BONE_TYPE_CONCEPT_IDS);
  });
});
