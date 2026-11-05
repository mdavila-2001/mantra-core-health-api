import { jest } from '@jest/globals';
import { PractitionerSpecialties } from '../../entities';
import { PractitionerSpecialtiesRepository } from './practitioner-specialties.repository';

const fn = jest.fn as unknown as (impl?: (...a: any[]) => any) => any;

describe('PractitionerSpecialtiesRepository.findProfileIdsBySpecialties', () => {
  it('trae los perfiles que ejercen HOY alguna de las especialidades, sin repetir', async () => {
    const em = {
      find: fn().mockResolvedValue([
        { practitionerProfileId: 'hp-1' },
        { practitionerProfileId: 'hp-2' },
        { practitionerProfileId: 'hp-1' },
      ]),
    };

    await expect(
      new PractitionerSpecialtiesRepository().findProfileIdsBySpecialties(
        em as never,
        ['esp-cardio', 'esp-pedia'],
      ),
    ).resolves.toEqual(['hp-1', 'hp-2']);
    expect(em.find).toHaveBeenCalledWith(
      PractitionerSpecialties,
      {
        specialtyConceptId: { $in: ['esp-cardio', 'esp-pedia'] },
        validTo: null,
      },
      { fields: ['practitionerProfileId'] },
    );
  });

  it('sin especialidades no consulta', async () => {
    const em = { find: fn() };

    await expect(
      new PractitionerSpecialtiesRepository().findProfileIdsBySpecialties(
        em as never,
        [],
      ),
    ).resolves.toEqual([]);
    expect(em.find).not.toHaveBeenCalled();
  });
});
