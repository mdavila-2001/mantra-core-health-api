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
    async (valor) => {
      expect(await propertiesWithError({ workEmail: valor })).toEqual([
        'workEmail',
      ]);
    },
  );
});
