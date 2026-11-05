import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { InsightsQueryDto } from './insights.dto';

const errorsOf = async (plain: Record<string, unknown>): Promise<string[]> =>
  (await validate(plainToInstance(InsightsQueryDto, plain))).map(
    (e) => e.property,
  );

describe('InsightsQueryDto', () => {
  it('acepta fechas de día y serviceId uuid, y todo es opcional', async () => {
    expect(await errorsOf({})).toEqual([]);
    expect(
      await errorsOf({
        from: '2026-10-01',
        to: '2026-10-31',
        serviceId: '0b6f6d8e-4c6e-4a0e-9d52-0f7b1b2c3d4e',
      }),
    ).toEqual([]);
  });

  it.each([
    ['from', '2026-10-01T10:00:00Z'],
    ['from', '2026-10-15'],
    ['from', '2026-10-01T00:00:00'],
    ['to', '2026-10-28T12:00:00.000Z'],
    ['to', '28/10/2026'],
    ['serviceId', 'no-es-uuid'],
  ])('rechaza %s = %s', async (field, value) => {
    expect(await errorsOf({ [field]: value })).toEqual([field]);
  });
});
