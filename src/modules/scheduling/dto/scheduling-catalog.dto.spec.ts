import {
  ArgumentMetadata,
  BadRequestException,
  ValidationPipe,
} from '@nestjs/common';
import { CloseSlotsDto, ShiftSlotsDto } from './scheduling-catalog.dto';

/**
 * M4 · H1.S2.M4 (AG-08 de BR-21) — los cupos sembrados derivan su id con
 * uuid5 (`deterministicId`), y `slotIds` exigía UUID **v4**: cerrar o correr
 * un cupo sembrado daba 400 antes de llegar al servicio. El resto de la API
 * usa `@IsUUID()` sin versión.
 *
 * Se valida con un `ValidationPipe` configurado igual que el global de
 * `main.ts`, que es lo que ve la API real.
 */
const PIPE = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  transformOptions: { enableImplicitConversion: true },
});

/** Un id uuid5 real (versión 5 en el tercer grupo, variante RFC 4122). */
const UUID_V5 = '2b1f8a3c-4d5e-5f60-8a7b-9c0d1e2f3a4b';
const UUID_V4 = '0f8fad5b-d9cb-469f-a165-70867728950e';

/** Cuerpos válidos en todo salvo en lo que cada prueba cambia: `slotIds`. */
const cerrar = (slotIds: string[]) => ({ exceptionType: 'ABSENCE', slotIds });
const correr = (slotIds: string[]) => ({
  shiftMinutes: 15,
  from: '2026-10-01T12:00:00.000Z',
  to: '2026-10-01T20:00:00.000Z',
  slotIds,
});

function meta(metatype: new () => unknown): ArgumentMetadata {
  return { type: 'body', metatype, data: '' };
}

async function rejection(body: unknown, metatype: new () => unknown) {
  try {
    await PIPE.transform(body, meta(metatype));
    return null;
  } catch (error) {
    if (error instanceof BadRequestException) return error.getResponse();
    throw error;
  }
}

describe('slotIds de cerrar y correr cupos (M4 · H1.S2.M4)', () => {
  it('cerrar acepta un cupo sembrado con id uuid5', async () => {
    expect(await rejection(cerrar([UUID_V5]), CloseSlotsDto)).toBeNull();
  });

  it('cerrar sigue aceptando ids uuid4', async () => {
    expect(await rejection(cerrar([UUID_V4]), CloseSlotsDto)).toBeNull();
  });

  it('correr acepta un cupo sembrado con id uuid5', async () => {
    expect(await rejection(correr([UUID_V5]), ShiftSlotsDto)).toBeNull();
  });

  it('un texto que no es UUID sigue dando 400', async () => {
    expect(await rejection(cerrar(['cupo-1']), CloseSlotsDto)).not.toBeNull();
    expect(await rejection(correr(['cupo-1']), ShiftSlotsDto)).not.toBeNull();
  });

  it('cerrar sin ningún cupo sigue dando 400', async () => {
    expect(await rejection(cerrar([]), CloseSlotsDto)).not.toBeNull();
  });
});
