import { jest } from '@jest/globals';
import { DomainException } from '../../../common';
import { MarketingErrorReason } from '../marketing.error-reasons';
import type { FactRow } from '../repositories/insights-facts.repository';
import {
  INSIGHTS_DEMO_NOTICE,
  INSIGHTS_LIVE_NOTICE,
  INSIGHTS_MAX_FACT_ROWS,
  InsightsFactsService,
  notMeasuredOf,
  resolveDayWindow,
  toMeasure,
} from './insights-facts.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

function fact(over: Partial<FactRow> = {}): FactRow {
  return {
    fact_date: '2026-10-01',
    campaign_code: 'c1',
    channel_code: 'google',
    impressions: '1968',
    reach: '1888',
    engagements: '4',
    clicks: '67',
    videoViews: '0',
    watchSeconds: '0',
    visits: '57',
    leads: '9',
    registrations: '5',
    activations: '4',
    firstUses: '3',
    conversions: '1',
    spendCents: '7829',
    revenueCents: '9056',
    ...over,
  };
}

function build(overrides: Record<string, unknown> = {}) {
  const repo = {
    campaigns: mockFn().mockResolvedValue([]),
    campaignChannels: mockFn().mockResolvedValue([]),
    milestones: mockFn().mockResolvedValue([]),
    dataSources: mockFn().mockResolvedValue({
      datasets: ['demo'],
      cutoff: '2026-10-29',
    }),
    lastFactDate: mockFn().mockResolvedValue('2026-10-29'),
    facts: mockFn().mockResolvedValue([]),
    ...overrides,
  };
  return { repo, service: new InsightsFactsService(repo as any) };
}

const reasonOf = async (promise: Promise<unknown>) => {
  try {
    await promise;
    return 'resolved';
  } catch (error) {
    if (error instanceof DomainException) {
      return {
        status: error.getStatus(),
        reason: error.reason,
        windowReason: error.details?.reason,
      };
    }
    throw error;
  }
};

describe('resolveDayWindow', () => {
  it('toma días inclusivos: from == to es un día válido', () => {
    expect(resolveDayWindow('2026-10-01', '2026-10-01')).toEqual({
      fromDay: '2026-10-01',
      toDay: '2026-10-01',
      toExclusiveDay: '2026-10-02',
    });
  });

  it('acepta 92 días inclusivos y rechaza 93 (igual que el simulador)', () => {
    expect(() => resolveDayWindow('2026-09-01', '2026-12-01')).not.toThrow(); // 92 días
    expect(() => resolveDayWindow('2026-09-01', '2026-12-02')).toThrow(
      DomainException,
    );
  });

  it('una marca de tiempo cuenta por su día UTC', () => {
    expect(
      resolveDayWindow('2026-10-01T23:30:00-04:00', '2026-10-03T00:00:00Z'),
    ).toMatchObject({ fromDay: '2026-10-02', toDay: '2026-10-03' });
  });

  it.each([
    ['to anterior a from', '2026-10-10', '2026-10-01', 'EMPTY_WINDOW'],
    ['fecha inválida', 'nada', '2026-10-01', 'INVALID_DATE'],
    ['más de 92 días', '2026-01-01', '2026-10-01', 'WINDOW_TOO_LARGE'],
  ])(
    'ventana inválida (%s) → 422 con razón estable',
    (_name, from, to, why) => {
      let caught: unknown;
      try {
        resolveDayWindow(from, to);
      } catch (error) {
        caught = error;
      }
      expect(caught).toBeInstanceOf(DomainException);
      const error = caught as DomainException;
      expect(error.getStatus()).toBe(422);
      expect(error.reason).toBe(MarketingErrorReason.INSIGHTS_WINDOW_INVALID);
      expect(error.details).toEqual({ reason: why });
    },
  );
});

describe('toMeasure', () => {
  it('convierte bigint en texto a número y conserva NULL', () => {
    expect(toMeasure('7829')).toBe(7829);
    expect(toMeasure(0)).toBe(0);
    expect(toMeasure('0')).toBe(0);
    expect(toMeasure(null)).toBeNull();
    expect(toMeasure(undefined)).toBeNull();
  });

  it('un entero fuera del rango seguro falla en vez de redondearse', () => {
    expect(() => toMeasure('9007199254740993')).toThrow(RangeError);
  });
});

describe('InsightsFactsService.campaignFacts', () => {
  it('ventana inválida → 422 sin consultar la base', async () => {
    const { service, repo } = build();
    expect(
      await reasonOf(
        service.campaignFacts({ from: '2026-10-10', to: '2026-10-01' }),
      ),
    ).toEqual({
      status: 422,
      reason: MarketingErrorReason.INSIGHTS_WINDOW_INVALID,
      windowReason: 'EMPTY_WINDOW',
    });
    expect(repo.facts).not.toHaveBeenCalled();
  });

  it('mapea a las 14 medidas camelCase, campaignId = código, y pasa filtros', async () => {
    const { service, repo } = build({
      facts: mockFn().mockResolvedValue([fact()]),
    });
    const result = await service.campaignFacts({
      from: '2026-10-01',
      to: '2026-10-29',
      campaignIds: ['c1'],
      channels: ['google'],
    });
    expect(repo.facts).toHaveBeenCalledWith({
      fromDay: '2026-10-01',
      toExclusiveDay: '2026-10-30',
      campaignCodes: ['c1'],
      channels: ['google'],
      limit: INSIGHTS_MAX_FACT_ROWS + 1,
    });
    expect(result.data).toEqual([
      {
        date: '2026-10-01',
        campaignId: 'c1',
        channel: 'google',
        impressions: 1968,
        reach: 1888,
        engagements: 4,
        clicks: 67,
        videoViews: 0,
        watchSeconds: 0,
        visits: 57,
        leads: 9,
        registrations: 5,
        activations: 4,
        firstUses: 3,
        conversions: 1,
        spendCents: 7829,
        revenueCents: 9056,
      },
    ]);
    expect(Object.keys(result.data[0])).toHaveLength(17);
    expect(result.meta).toEqual({
      dataset: 'demo',
      asOf: '2026-10-29',
      cutoff: '2026-10-29',
      window: { from: '2026-10-01', to: '2026-10-29' },
      notice: INSIGHTS_DEMO_NOTICE,
      notMeasured: [],
    });
  });

  it('NULL no se convierte en 0: queda null y se declara en notMeasured', async () => {
    const { service } = build({
      facts: mockFn().mockResolvedValue([
        fact({ channel_code: 'web', videoViews: null, watchSeconds: null }),
        fact({
          channel_code: 'web',
          fact_date: '2026-10-02',
          videoViews: null,
          watchSeconds: null,
        }),
        fact({ channel_code: 'google', videoViews: '0', watchSeconds: '0' }),
      ]),
    });
    const { data, meta } = await service.campaignFacts({
      from: '2026-10-01',
      to: '2026-10-02',
    });
    expect(data[0].videoViews).toBeNull();
    expect(data[2].videoViews).toBe(0);
    expect(meta.notMeasured).toEqual([
      {
        metric: 'videoViews',
        reason: 'La fuente no reporta esta medida en: web.',
      },
      {
        metric: 'watchSeconds',
        reason: 'La fuente no reporta esta medida en: web.',
      },
    ]);
  });

  it('supera el tope de filas → 422 en vez de truncar en silencio', async () => {
    const rows = Array.from({ length: INSIGHTS_MAX_FACT_ROWS + 1 }, () =>
      fact(),
    );
    const { service } = build({ facts: mockFn().mockResolvedValue(rows) });
    expect(
      await reasonOf(
        service.campaignFacts({ from: '2026-10-01', to: '2026-10-29' }),
      ),
    ).toMatchObject({
      status: 422,
      reason: MarketingErrorReason.INSIGHTS_FACTS_LIMIT_EXCEEDED,
    });
  });

  it('dataset: live solo si todas las fuentes son live; una demo lo deja en demo', async () => {
    const live = build({
      dataSources: mockFn().mockResolvedValue({
        datasets: ['live'],
        cutoff: '2026-10-28',
      }),
      lastFactDate: mockFn().mockResolvedValue('2026-10-27'),
    });
    const liveMeta = (
      await live.service.campaignFacts({ from: '2026-10-01', to: '2026-10-02' })
    ).meta;
    expect(liveMeta).toMatchObject({
      dataset: 'live',
      asOf: '2026-10-27',
      cutoff: '2026-10-28',
      notice: INSIGHTS_LIVE_NOTICE,
    });

    const mixed = build({
      dataSources: mockFn().mockResolvedValue({
        datasets: ['demo', 'live'],
        cutoff: '2026-10-28',
      }),
    });
    expect(
      (
        await mixed.service.campaignFacts({
          from: '2026-10-01',
          to: '2026-10-02',
        })
      ).meta.dataset,
    ).toBe('demo');
  });

  it('sin fuentes ni hechos: dataset demo y asOf cae al corte, nunca inventa un "live"', async () => {
    const { service } = build({
      dataSources: mockFn().mockResolvedValue({ datasets: null, cutoff: null }),
      lastFactDate: mockFn().mockResolvedValue(null),
    });
    const { meta } = await service.campaignFacts({
      from: '2026-10-01',
      to: '2026-10-02',
    });
    expect(meta.dataset).toBe('demo');
    expect(meta.asOf).toBe(meta.cutoff);
  });
});

describe('notMeasuredOf', () => {
  it('distingue "nunca" de "algunos días" por canal', () => {
    const out = notMeasuredOf([
      fact({ channel_code: 'email', clicks: null }),
      fact({ channel_code: 'email', fact_date: '2026-10-02', clicks: '3' }),
      fact({ channel_code: 'web', clicks: null }),
    ]);
    expect(out).toEqual([
      { metric: 'clicks', reason: 'La fuente no reporta esta medida en: web.' },
      {
        metric: 'clicks',
        reason: 'Faltan datos de esta medida en algunos días de: email.',
      },
    ]);
  });

  it('sin filas no declara nada', () => {
    expect(notMeasuredOf([])).toEqual([]);
  });
});

describe('InsightsFactsService.catalog', () => {
  const campaign = {
    code: 'c1',
    name: 'Campaña Registro Médicos',
    objective_text: 'Registrar 650 médicos',
    audience_text: null,
    start_on: '2026-10-01',
    end_on: '2026-10-31',
    budget_cents: '4200000',
    revenue_per_conversion_cents: '18500',
    targets_json: { ctr: 0.025, conversions: 650, nota: 'texto' },
    status_code: 'active',
  };

  it('mapea campañas (id = código, bigint a número, canales de los creativos) e hitos', async () => {
    const { service } = build({
      campaigns: mockFn().mockResolvedValue([
        campaign,
        {
          ...campaign,
          code: 'c2',
          status_code: 'planned',
          end_on: null,
          budget_cents: null,
        },
        { ...campaign, code: 'c3', status_code: 'ended' },
      ]),
      campaignChannels: mockFn().mockResolvedValue([
        { campaign_code: 'c1', channel_code: 'web' },
        { campaign_code: 'c1', channel_code: 'instagram' },
        { campaign_code: 'c1', channel_code: 'google' },
      ]),
      milestones: mockFn().mockResolvedValue([
        {
          occurred_on: '2026-10-09',
          label: 'Viral',
          campaign_code: 'c2',
          kind_code: 'viral',
        },
        {
          occurred_on: '2026-10-10',
          label: 'General',
          campaign_code: null,
          kind_code: 'press',
        },
      ]),
    });
    const { data, meta } = await service.catalog();
    expect(data.campaigns[0]).toEqual({
      id: 'c1',
      name: 'Campaña Registro Médicos',
      objective: 'Registrar 650 médicos',
      audience: '',
      startDate: '2026-10-01',
      endDate: '2026-10-31',
      budgetCents: 4_200_000,
      status: 'active',
      revenuePerConversionCents: 18_500,
      targets: { ctr: 0.025, conversions: 650 },
      channels: ['instagram', 'google', 'web'],
    });
    expect(data.campaigns.map((c) => c.status)).toEqual([
      'active',
      'planned',
      'ended',
    ]);
    expect(data.campaigns[1]).toMatchObject({
      endDate: null,
      budgetCents: null,
      channels: [],
    });
    expect(data.milestones).toEqual([
      { date: '2026-10-09', label: 'Viral', campaignId: 'c2', kind: 'viral' },
      { date: '2026-10-10', label: 'General', campaignId: null, kind: 'press' },
    ]);
    expect(meta.window).toBeNull();
    expect(meta.notMeasured).toEqual([]);
  });

  it.each(['launch', 'viral', 'press', 'offer_change'])(
    'acepta el tipo de hito %s',
    async (kind) => {
      const { service } = build({
        milestones: mockFn().mockResolvedValue([
          {
            occurred_on: '2026-10-09',
            label: 'x',
            campaign_code: null,
            kind_code: kind,
          },
        ]),
      });
      expect((await service.catalog()).data.milestones[0].kind).toBe(kind);
    },
  );

  it('un tipo de hito desconocido se omite y se declara', async () => {
    const { service } = build({
      milestones: mockFn().mockResolvedValue([
        {
          occurred_on: '2026-10-09',
          label: 'x',
          campaign_code: null,
          kind_code: 'otro',
        },
      ]),
    });
    const { data, meta } = await service.catalog();
    expect(data.milestones).toEqual([]);
    expect(meta.notMeasured).toHaveLength(1);
    expect(meta.notMeasured[0].metric).toBe('milestones');
  });

  it('un estado de campaña desconocido no se disfraza de otro', async () => {
    const { service } = build({
      campaigns: mockFn().mockResolvedValue([
        { ...campaign, status_code: 'paused' },
      ]),
    });
    await expect(service.catalog()).rejects.toThrow(
      /Estado de campaña desconocido/,
    );
  });
});
