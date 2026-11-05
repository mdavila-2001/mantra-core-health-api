import { createGlobalValidationPipe } from '../../../../common/http/validation-pipe';
import { SetSiteAvailabilityDto } from './site-availability.dto';

/** El cuerpo, por el mismo pipe que corre en `main.ts`. */
function validate(body: unknown): Promise<SetSiteAvailabilityDto> {
  return createGlobalValidationPipe().transform(body, {
    type: 'body',
    metatype: SetSiteAvailabilityDto,
  }) as Promise<SetSiteAvailabilityDto>;
}

/** El estado HTTP del rechazo, o `null` si el pipe aceptó. */
async function statusOf(body: unknown): Promise<number | null> {
  try {
    await validate(body);
    return null;
  } catch (error) {
    return (error as { getStatus(): number }).getStatus();
  }
}

describe('SetSiteAvailabilityDto', () => {
  it('«false» como texto es 400: no se convierte en «Lo tengo»', async () => {
    expect(await statusOf({ available: 'false' })).toBe(400);
  });

  it('«true» como texto también es 400: el campo es booleano', async () => {
    expect(await statusOf({ available: 'true' })).toBe(400);
  });

  it('un número no pasa por booleano', async () => {
    expect(await statusOf({ available: 0 })).toBe(400);
  });

  it('sin el campo es 400', async () => {
    expect(await statusOf({ quantity: 3 })).toBe(400);
  });

  it('los booleanos de verdad pasan tal cual', async () => {
    await expect(validate({ available: false })).resolves.toMatchObject({
      available: false,
    });
    await expect(
      validate({ available: true, quantity: 4 }),
    ).resolves.toMatchObject({ available: true, quantity: 4 });
  });
});
