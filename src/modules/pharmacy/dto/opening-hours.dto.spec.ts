import {
  ArgumentMetadata,
  BadRequestException,
  ValidationPipe,
} from '@nestjs/common';
import { CreateOnCallShiftDto, SetOpen24hDto } from './opening-hours.dto';

/**
 * Los cuerpos del P34 contra los DTO reales y las mismas opciones del
 * `ValidationPipe` global de `main.ts`.
 */
describe('DTO del horario de farmacia (P34)', () => {
  const pipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  });
  const parse = (metatype: ArgumentMetadata['metatype'], body: unknown) =>
    pipe.transform(body, { type: 'body', metatype });

  describe('SetOpen24hDto', () => {
    it.each([true, false, null])('acepta open24h = %p', async (value) => {
      await expect(
        parse(SetOpen24hDto, { open24h: value }),
      ).resolves.toMatchObject({ open24h: value });
    });

    it('rechaza el cuerpo vacío: callar no es «no»', async () => {
      await expect(parse(SetOpen24hDto, {})).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rechaza una clave que no existe', async () => {
      await expect(
        parse(SetOpen24hDto, { open24h: true, nightOnly: true }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('CreateOnCallShiftDto', () => {
    it.each([
      ['2026-10-26T20:00:00-04:00', '2026-10-27T08:00:00-04:00'],
      ['2026-10-27T00:00:00Z', '2026-10-27T12:00:00.000Z'],
      ['2026-10-26T20:00-04:00', '2026-10-27T08:00+00:00'],
    ])('acepta %s → %s', async (startsAt, endsAt) => {
      await expect(
        parse(CreateOnCallShiftDto, { startsAt, endsAt }),
      ).resolves.toMatchObject({ startsAt, endsAt });
    });

    it.each([
      '2026-10-26T20:00:00',
      '2026-10-26',
      '26/10/2026 20:00',
      '2026-10-26T20:00:00 -04:00',
    ])('rechaza «%s» (sin desplazamiento explícito)', async (startsAt) => {
      await expect(
        parse(CreateOnCallShiftDto, {
          startsAt,
          endsAt: '2026-10-27T08:00:00-04:00',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rechaza que falte el fin', async () => {
      await expect(
        parse(CreateOnCallShiftDto, { startsAt: '2026-10-26T20:00:00-04:00' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
