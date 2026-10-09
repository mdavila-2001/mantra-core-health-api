import { plainToInstance } from 'class-transformer';
import { validate, type ValidationError } from 'class-validator';
import { CreateDirectAppointmentDto } from './scheduling-bookings.dto';

/**
 * P42 / P43 · la cita directa acepta `followUpOf` (la reconsulta) y, dentro,
 * `formInstanceId`. Se valida contra el DTO real con las opciones del
 * `ValidationPipe` global: `forbidNonWhitelisted` también mira el objeto
 * anidado, así que una clave que el contrato no declara sigue siendo 400.
 */

/** Rutas con error (`followUpOf.bookingId`, …), sin repetidos. */
function routes(errors: readonly ValidationError[], prefix = ''): string[] {
  return errors.flatMap((e) => {
    const route = prefix ? `${prefix}.${e.property}` : e.property;
    return e.children && e.children.length > 0
      ? routes(e.children, route)
      : [route];
  });
}

async function errors(body: Record<string, unknown>): Promise<string[]> {
  const dto = plainToInstance(CreateDirectAppointmentDto, body);
  const res = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  return [...new Set(routes(res))].sort();
}

const PATIENT = '22222222-2222-4222-8222-222222222222';
const RESOURCE = '33333333-3333-4333-8333-333333333333';
const ORIGIN = '44444444-4444-4444-8444-444444444444';
const ENCOUNTER = '55555555-5555-4555-8555-555555555555';
const FORM = '66666666-6666-4666-8666-666666666666';

function body(over: Record<string, unknown> = {}) {
  return {
    patientProfileId: PATIENT,
    resourceId: RESOURCE,
    startAt: '2030-01-10T14:00:00.000Z',
    durationMinutes: 30,
    ...over,
  };
}

describe('CreateDirectAppointmentDto — followUpOf (P42) y formInstanceId (P43)', () => {
  it('sin followUpOf valida como siempre', async () => {
    expect(await errors(body())).toEqual([]);
  });

  it('acepta el followUpOf que manda el front (bookingId, encounterId, formInstanceId)', async () => {
    expect(
      await errors(
        body({
          followUpOf: {
            bookingId: ORIGIN,
            encounterId: ENCOUNTER,
            formInstanceId: FORM,
          },
        }),
      ),
    ).toEqual([]);
  });

  it('acepta encounterId null y formInstanceId ausente', async () => {
    expect(
      await errors(
        body({ followUpOf: { bookingId: ORIGIN, encounterId: null } }),
      ),
    ).toEqual([]);
  });

  it('exige followUpOf.bookingId uuid', async () => {
    expect(await errors(body({ followUpOf: {} }))).toEqual([
      'followUpOf.bookingId',
    ]);
  });

  it('rechaza un followUpOf.formInstanceId que no es uuid', async () => {
    expect(
      await errors(
        body({
          followUpOf: { bookingId: ORIGIN, formInstanceId: 'no-es-uuid' },
        }),
      ),
    ).toEqual(['followUpOf.formInstanceId']);
  });

  it('rechaza una clave no declarada dentro de followUpOf', async () => {
    expect(
      await errors(
        body({ followUpOf: { bookingId: ORIGIN, startAt: 'x' } }),
      ),
    ).toEqual(['followUpOf.startAt']);
  });

  it('formInstanceId en la raíz (fuera de followUpOf) sigue siendo 400', async () => {
    expect(await errors(body({ formInstanceId: FORM }))).toEqual([
      'formInstanceId',
    ]);
  });
});
