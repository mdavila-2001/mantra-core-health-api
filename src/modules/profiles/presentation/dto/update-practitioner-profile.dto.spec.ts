import { describe, it, expect } from '@jest/globals';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { UpdateOwnPractitionerProfileDto } from './update-practitioner-profile.dto';

/**
 * Valida un cuerpo de `PATCH /profiles/practitioners/me` con las mismas
 * opciones que el `ValidationPipe` de `main.ts` y devuelve las propiedades con
 * error.
 *
 * @param body - El cuerpo del PATCH, tal como llegaría del cliente.
 * @returns Las propiedades con error, ordenadas.
 */
async function propertiesWithError(
  body: Record<string, unknown>,
): Promise<string[]> {
  const dto = plainToInstance(UpdateOwnPractitionerProfileDto, body, {
    enableImplicitConversion: true,
  });
  const errors = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  return errors.map((e) => e.property).sort();
}

/**
 * `workEmail`: el correo de trabajo es editable, pero es obligatorio desde el
 * alta — a diferencia de los otros contactos, no se borra con `''`.
 */
describe('UpdateOwnPractitionerProfileDto — workEmail', () => {
  it('acepta un correo válido', async () => {
    expect(await propertiesWithError({ workEmail: 'dra@clinica.bo' })).toEqual(
      [],
    );
  });

  it('omitirlo no es un error: es un PATCH', async () => {
    expect(await propertiesWithError({ professionalTitle: 'X' })).toEqual([]);
  });

  it.each([[''], ['no-es-un-correo'], ['a@'], [42]])(
    'rechaza %p',
    async (value) => {
      expect(await propertiesWithError({ workEmail: value })).toEqual([
        'workEmail',
      ]);
    },
  );
});

/**
 * `languages` (informe B, C13): la pantalla de edición del perfil ya mandaba
 * la lista y el DTO no la declaraba, así que `forbidNonWhitelisted` respondía
 * 400. Mismas tres columnas que `profiles.practitioner_languages`.
 */
describe('UpdateOwnPractitionerProfileDto — languages', () => {
  const SPANISH = '22222222-2222-4222-8222-222222222222';

  it('acepta la forma que manda la pantalla', async () => {
    expect(
      await propertiesWithError({
        languages: [
          {
            languageConceptId: SPANISH,
            proficiencyConceptId: '44444444-4444-4444-8444-444444444444',
            clinicalInterpretationAllowed: true,
          },
          { languageConceptId: SPANISH, clinicalInterpretationAllowed: false },
        ],
      }),
    ).toEqual([]);
  });

  it('acepta la lista vacía: es como se quitan todos', async () => {
    expect(await propertiesWithError({ languages: [] })).toEqual([]);
  });

  it.each([
    [{ languageConceptId: 'es', clinicalInterpretationAllowed: true }],
    [{ languageConceptId: SPANISH }],
    [
      {
        languageConceptId: SPANISH,
        clinicalInterpretationAllowed: true,
        level: 'C1',
      },
    ],
  ])('rechaza el elemento %p', async (item) => {
    expect(await propertiesWithError({ languages: [item] })).toEqual([
      'languages',
    ]);
  });

  it('rechaza más de 20 idiomas', async () => {
    const languages = Array.from({ length: 21 }, () => ({
      languageConceptId: SPANISH,
      clinicalInterpretationAllowed: false,
    }));
    expect(await propertiesWithError({ languages })).toEqual(['languages']);
  });
});
