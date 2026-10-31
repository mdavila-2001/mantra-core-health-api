import { DIR, DIRECTORY_CONCEPT_SEEDS } from './directory.concepts';
import { deterministicId } from '../../common/constants/concepts';
import { DYNAMIC_ENUM_CATALOG } from '../../common/seed/dynamic-enum-catalog';
import { SPANISH_DESIGNATIONS } from '../../common/seed/terminology-designations.es';

/**
 * Los cinco conceptos de origen de la membresía los fija el modelo v4.2.71
 * (`CONCEPTOS.md`, «Cambios v4.2.71»): el seed del modelo (`03_terminology`)
 * los trae con estos ids y la FK `fk_tenant_memberships_origin_concept_id` los
 * exige. Si una clave cambia, el id cambia y la membresía no se puede crear.
 */
const MODEL_ORIGIN_CONCEPTS: readonly (readonly [string, string, string])[] = [
  [
    'MEMBERSHIP_ORIGIN_OWNER_CREATED',
    '03513805-b6e4-550a-8ea3-3c3c8cfc0c9b',
    'Membership origin: created by the organization owner',
  ],
  [
    'MEMBERSHIP_ORIGIN_ADMIN_ADDED',
    '27e48f8c-3b60-555f-9c7f-f279405c608f',
    'Membership origin: added by an organization administrator',
  ],
  [
    'MEMBERSHIP_ORIGIN_INVITATION_REDEEMED',
    'f913301b-10c6-5ffb-aabc-2d377c5bd9a0',
    'Membership origin: invitation redeemed',
  ],
  [
    'MEMBERSHIP_ORIGIN_SUPPORT_ENGAGEMENT',
    '13808362-0cd2-5f77-acf7-4a8078d60f20',
    'Membership origin: exists only through a support engagement',
  ],
  [
    'MEMBERSHIP_ORIGIN_UNKNOWN',
    'd9e92737-575d-5d41-9ada-f7910692aeff',
    'Membership origin: unknown',
  ],
];

describe('conceptos de origen de la membresía con ids fijados por el modelo v4.2.71', () => {
  it.each(MODEL_ORIGIN_CONCEPTS)(
    '%s tiene el id del modelo',
    (name, expectedId) => {
      expect((DIR as Record<string, string>)[name]).toBe(expectedId);
      expect(deterministicId(`directory:${name}`)).toBe(expectedId);
    },
  );

  it.each(MODEL_ORIGIN_CONCEPTS)(
    '%s se siembra con la clave del modelo y su display en inglés',
    (name, _id, display) => {
      const seed = DIRECTORY_CONCEPT_SEEDS.find(
        (candidate) => candidate.key === `directory:${name}`,
      );
      expect(seed?.display).toBe(display);
    },
  );

  it('el origen es un conjunto publicado sobre la columna, con su designación en castellano', () => {
    const origin = DYNAMIC_ENUM_CATALOG.find(
      (entry) => entry.code === 'membership-origin',
    );
    expect(origin?.targets).toEqual([
      'directory.tenant_memberships.origin_concept_id',
    ]);
    expect([...(origin?.concepts ?? [])].sort()).toEqual(
      MODEL_ORIGIN_CONCEPTS.map(([, id]) => id).sort(),
    );
    for (const [, id] of MODEL_ORIGIN_CONCEPTS) {
      expect(SPANISH_DESIGNATIONS.has(id)).toBe(true);
    }
  });
});
