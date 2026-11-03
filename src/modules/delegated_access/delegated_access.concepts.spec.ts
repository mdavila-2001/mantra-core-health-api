import { deterministicId } from '../../common/constants/concepts';
import { MODULE_CONCEPT_SEEDS } from '../../common/seed/module-concepts';
import {
  DELEGATED_ACCESS_CONCEPT_SEEDS,
  DELEG,
} from './delegated_access.concepts';

/** Los conceptos del enlace compartido de receta (S-7). */
describe('delegated_access.concepts — enlace compartido de receta', () => {
  const SHARE_KEYS = [
    'SHARE_RESOURCE_PRESCRIPTION_ENCOUNTER',
    'SHARE_RESOURCE_MEDICATION_REQUEST',
    'SHARE_SCOPE_PHARMACY_DISPENSE',
    'SHARE_ACTION_OPEN',
    'SHARE_ACTION_PUBLIC_VIEW',
    'SHARE_OUTCOME_OPENED',
    'SHARE_OUTCOME_DENIED',
  ] as const;

  it('cada id es el determinista de su clave de módulo', () => {
    for (const key of SHARE_KEYS) {
      expect(DELEG[key]).toBe(deterministicId(`delegated_access:${key}`));
    }
  });

  it('ningún id ni código choca con otro concepto de módulo', () => {
    const ids = MODULE_CONCEPT_SEEDS.map((seed) => deterministicId(seed.key));
    expect(new Set(ids).size).toBe(ids.length);
    const shareCodes = DELEGATED_ACCESS_CONCEPT_SEEDS.filter((seed) =>
      seed.code.startsWith('DA_SHARE_'),
    ).map((seed) => seed.code);
    expect(shareCodes).toHaveLength(SHARE_KEYS.length);
    const allCodes = MODULE_CONCEPT_SEEDS.map((seed) => seed.code);
    for (const code of shareCodes) {
      expect(allCodes.filter((other) => other === code)).toHaveLength(1);
    }
  });

  it('los seeds del módulo entran en el agregador', () => {
    const keys = new Set(MODULE_CONCEPT_SEEDS.map((seed) => seed.key));
    for (const key of SHARE_KEYS) {
      expect(keys.has(`delegated_access:${key}`)).toBe(true);
    }
  });
});
