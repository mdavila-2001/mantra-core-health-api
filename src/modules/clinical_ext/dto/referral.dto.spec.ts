import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RespondReferralDto } from './referral.dto';

const ENCOUNTER = '11111111-1111-4111-8111-111111111111';

/**
 * Los errores de validación, como los vería el `ValidationPipe` global de
 * `main.ts` (`whitelist` y `forbidNonWhitelisted`).
 *
 * @param body - Lo que mandaría el cliente.
 * @returns Las propiedades que no pasaron, en orden.
 */
async function errors(body: unknown): Promise<string[]> {
  const dto = plainToInstance(RespondReferralDto, body);
  const validationErrors = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  return validationErrors.map((e) => e.property).sort();
}

describe('RespondReferralDto · targetEncounterId (v4292)', () => {
  it('la respuesta de siempre, sin el campo, sigue siendo válida', async () => {
    expect(await errors({ decision: 'ACCEPT' })).toEqual([]);
  });

  it('acepta la atención de llegada como uuid', async () => {
    expect(
      await errors({ decision: 'ACCEPT', targetEncounterId: ENCOUNTER }),
    ).toEqual([]);
  });

  it('rechaza una atención que no es uuid', async () => {
    expect(
      await errors({ decision: 'ACCEPT', targetEncounterId: 'enc-1' }),
    ).toEqual(['targetEncounterId']);
  });
});
