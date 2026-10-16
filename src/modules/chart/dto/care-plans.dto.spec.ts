import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateCarePlanDto } from './care-plans.dto';

/**
 * P43 · el plan de cuidado puede declarar de qué formulario médico cerrado
 * sale. Se valida contra el DTO real con las opciones del `ValidationPipe`
 * global (`forbidNonWhitelisted`): antes de este cambio el campo era un 400.
 */
async function propertiesWithError(
  body: Record<string, unknown>,
): Promise<string[]> {
  const errors = await validate(plainToInstance(CreateCarePlanDto, body), {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  return [...new Set(errors.map((e) => e.property))].sort();
}

const PATIENT = '22222222-2222-4222-8222-222222222222';
const FORM = '44444444-4444-4444-8444-444444444444';

describe('CreateCarePlanDto — formInstanceId (P43)', () => {
  it('acepta formInstanceId uuid', async () => {
    expect(
      await propertiesWithError({
        patientProfileId: PATIENT,
        formInstanceId: FORM,
      }),
    ).toEqual([]);
  });

  it('sigue siendo opcional', async () => {
    expect(await propertiesWithError({ patientProfileId: PATIENT })).toEqual(
      [],
    );
  });

  it('rechaza un formInstanceId que no es uuid', async () => {
    expect(
      await propertiesWithError({
        patientProfileId: PATIENT,
        formInstanceId: 'no-es-uuid',
      }),
    ).toEqual(['formInstanceId']);
  });
});
