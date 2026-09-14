import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { InsuranceAnalyticsQueryDto } from './insurance-analytics.dto';

describe('InsuranceAnalyticsQueryDto (subtarea 3.1, v4.2.14)', () => {
  it('acepta el DTO vacío: los tres filtros son opcionales', async () => {
    const dto = plainToInstance(InsuranceAnalyticsQueryDto, {});
    expect(await validate(dto)).toEqual([]);
  });

  it('acepta startDate/endDate ISO 8601 estrictas y un planId uuid', async () => {
    const dto = plainToInstance(InsuranceAnalyticsQueryDto, {
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      planId: '00000000-0000-4000-8000-000000000000',
    });
    expect(await validate(dto)).toEqual([]);
  });

  it('rechaza fechas que no son ISO 8601 estricto', async () => {
    const dto = plainToInstance(InsuranceAnalyticsQueryDto, {
      startDate: '01/01/2026',
      endDate: 'ayer',
    });
    const errors = await validate(dto);
    expect(errors.map((e) => e.property)).toEqual(
      expect.arrayContaining(['startDate', 'endDate']),
    );
  });

  it('rechaza un planId que no es uuid', async () => {
    const dto = plainToInstance(InsuranceAnalyticsQueryDto, {
      planId: 'no-es-un-uuid',
    });
    const errors = await validate(dto);
    expect(errors.map((e) => e.property)).toEqual(
      expect.arrayContaining(['planId']),
    );
  });
});
