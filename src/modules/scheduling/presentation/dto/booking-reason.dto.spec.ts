import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PreconditionFailedException } from '../../../../common';
import { requireReason } from '../../application/bookings/support/require-reason';
import { SchedulingErrorReason } from '../../scheduling.error-reasons';
import {
  CancelBookingDto,
  RejectBookingDto,
  RescheduleBookingDto,
} from './scheduling-bookings.dto';

/** Errores de validación del DTO sobre `reasonText`. */
async function reasonErrors(
  type: new () => object,
  plain: Record<string, unknown>,
): Promise<string[]> {
  const errors = await validate(plainToInstance(type, plain) as object, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  return errors
    .filter((e) => e.property === 'reasonText')
    .flatMap((e) => Object.keys(e.constraints ?? {}));
}

const BASE = {
  [CancelBookingDto.name]: { cancelledBy: 'PROVIDER' },
  [RescheduleBookingDto.name]: {
    toSlotId: '11111111-1111-4111-8111-111111111111',
  },
  [RejectBookingDto.name]: {},
};

describe.each([[CancelBookingDto], [RescheduleBookingDto], [RejectBookingDto]])(
  '%p: el motivo se exige en el servidor con 422, no con el 400 del validador',
  (Dto) => {
    const base = BASE[Dto.name];

    it('si falta, el DTO no lo rechaza: lo rechaza `requireReason` con 422', async () => {
      expect(await reasonErrors(Dto, { ...base })).toEqual([]);
    });

    it('vacío o demasiado corto tampoco es un 400 del DTO', async () => {
      expect(await reasonErrors(Dto, { ...base, reasonText: '' })).toEqual([]);
      expect(await reasonErrors(Dto, { ...base, reasonText: 'ab' })).toEqual(
        [],
      );
    });

    it('un motivo que no es texto sigue siendo un 400', async () => {
      expect(await reasonErrors(Dto, { ...base, reasonText: 42 })).toContain(
        'isString',
      );
    });

    it('un motivo de más de 500 caracteres sigue siendo un 400', async () => {
      expect(
        await reasonErrors(Dto, { ...base, reasonText: 'x'.repeat(501) }),
      ).toContain('maxLength');
    });

    it('un motivo normal pasa', async () => {
      expect(
        await reasonErrors(Dto, {
          ...base,
          reasonText: 'El paciente lo pidió',
        }),
      ).toEqual([]);
    });
  },
);

describe('requireReason: el 422 con su código', () => {
  const rejected = (raw: string | undefined): PreconditionFailedException => {
    try {
      requireReason(raw, 'cancelar la cita');
    } catch (error) {
      return error as PreconditionFailedException;
    }
    throw new Error('no rechazó');
  };

  it.each([
    ['falta', undefined],
    ['vacío', ''],
    ['solo espacios', '    '],
    ['demasiado corto', 'ab'],
  ])('%s → 422 REASON_REQUIRED', (_n, raw) => {
    const error = rejected(raw);
    expect(error).toBeInstanceOf(PreconditionFailedException);
    expect(error.getStatus()).toBe(422);
    expect(error.reason).toBe(SchedulingErrorReason.REASON_REQUIRED);
    expect(error.message).toContain('cancelar la cita');
  });

  it('un texto de relleno → 422 REASON_PLACEHOLDER', () => {
    const error = rejected('xxxxxxx');
    expect(error.getStatus()).toBe(422);
    expect(error.reason).toBe(SchedulingErrorReason.REASON_PLACEHOLDER);
  });

  it('un motivo de verdad se devuelve normalizado', () => {
    expect(requireReason('  El paciente   lo pidió ', 'cancelar')).toBe(
      'El paciente lo pidió',
    );
  });
});
