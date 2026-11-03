import { createGlobalValidationPipe } from '../../../common';
import { InsightsFactsQueryDto } from './insights-query.dto';

/** Pasa la query por el mismo pipe global que usa la API. */
const parse = (query: Record<string, unknown>) =>
  createGlobalValidationPipe().transform(query, {
    type: 'query',
    metatype: InsightsFactsQueryDto,
  }) as Promise<InsightsFactsQueryDto>;

describe('InsightsFactsQueryDto', () => {
  const window = { from: '2026-10-01', to: '2026-10-29' };

  it('acepta CSV y parámetros repetidos, sin vacíos ni duplicados', async () => {
    const dto = await parse({
      ...window,
      campaignIds: ['c1,c2', 'c2', ' c3 '],
      channels: 'google,instagram,,google',
    });
    expect(dto.campaignIds).toEqual(['c1', 'c2', 'c3']);
    expect(dto.channels).toEqual(['google', 'instagram']);
  });

  it('los filtros son opcionales', async () => {
    const dto = await parse(window);
    expect(dto.campaignIds).toBeUndefined();
    expect(dto.channels).toBeUndefined();
  });

  it.each([
    ['sin from', { to: '2026-10-29' }],
    ['sin to', { from: '2026-10-01' }],
    ['fecha no ISO', { from: 'ayer', to: '2026-10-29' }],
    ['canal desconocido', { ...window, channels: 'google,telegram' }],
    [
      'código de campaña con caracteres raros',
      { ...window, campaignIds: "c1';--" },
    ],
    [
      'demasiados códigos',
      {
        ...window,
        campaignIds: Array.from({ length: 21 }, (_, i) => `c${i}`).join(','),
      },
    ],
    ['parámetro desconocido', { ...window, limit: '10' }],
  ])('rechaza %s con 400', async (_name, query) => {
    await expect(parse(query)).rejects.toMatchObject({ status: 400 });
  });
});
