import { describe, expect, it } from '@jest/globals';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreatePractitionerDto } from './create-practitioner.dto';

describe('CreatePractitionerDto · especialidad principal y tres adicionales', () => {
  it('acepta cuatro ids válidos del catálogo', async () => {
    const dto = plainToInstance(CreatePractitionerDto, {
      specialtyConceptIds: [
        '7218acbc-5098-56ae-980a-9345961ced89',
        'bd0484b1-8959-5ba5-bb65-ca9305eedb30',
        'e0f2c074-572e-521c-a647-0ec85de5ff62',
        '3f29af08-4339-5c4f-90d6-e3831c7f0fbc',
      ],
    });

    const errors = await validate(dto);

    expect(
      errors.find((error) => error.property === 'specialtyConceptIds'),
    ).toBeUndefined();
  });

  it('rechaza cinco ids del catálogo', async () => {
    const dto = plainToInstance(CreatePractitionerDto, {
      specialtyConceptIds: [
        '7218acbc-5098-56ae-980a-9345961ced89',
        'bd0484b1-8959-5ba5-bb65-ca9305eedb30',
        'e0f2c074-572e-521c-a647-0ec85de5ff62',
        '3f29af08-4339-5c4f-90d6-e3831c7f0fbc',
        'c7a25eba-6961-5b97-bfae-bf1e2a33ce19',
      ],
    });

    const errors = await validate(dto);

    expect(
      errors.find((error) => error.property === 'specialtyConceptIds'),
    ).toMatchObject({ property: 'specialtyConceptIds' });
  });
});
