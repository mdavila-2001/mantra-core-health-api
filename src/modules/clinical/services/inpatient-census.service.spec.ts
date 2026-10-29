import { jest } from '@jest/globals';
import {
  CENSUS_NUMERIC_FIELDS,
  type CensusCounts,
} from '../domain/census-calculation';
import {
  InpatientCensusService,
  addDays,
  adjustedTotals,
} from './inpatient-census.service';

const fn = (impl?: any): any => (jest.fn as any)(impl);

const zero = (over: Partial<CensusCounts> = {}): CensusCounts => ({
  ...(Object.fromEntries(
    CENSUS_NUMERIC_FIELDS.map((f) => [f, 0]),
  ) as CensusCounts),
  ...over,
});

describe('adjustedTotals', () => {
  it('el último valor de cada campo gana y el snapshot no se modifica', () => {
    const snapshot = zero({ patient_days: 4, admissions: 4 });
    const totals = adjustedTotals(snapshot, [
      { fieldCode: 'patient_days', newValue: 3 },
      { fieldCode: 'patient_days', newValue: 2 },
      { fieldCode: 'deaths', newValue: 1 },
    ]);
    expect(totals).toMatchObject({ patient_days: 2, admissions: 4, deaths: 1 });
    expect(snapshot.patient_days).toBe(4);
    expect(totals).not.toBe(snapshot);
  });
});

describe('addDays', () => {
  it('suma días calendario sin depender de la zona', () => {
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-10-29', -7)).toBe('2026-10-22');
  });
});

describe('InpatientCensusService.closeDueDays', () => {
  const NOW = new Date('2026-10-29T10:00:00Z');

  function build(
    sites: any[],
    closeImpl: (siteId: string, date: string) => Promise<any>,
  ) {
    const calls: string[] = [];
    const tx: any = {
      execute: fn(async (sql: string) => {
        calls.push(sql.trim().split(/\s+/).slice(0, 3).join(' '));
        if (sql.includes('from practice.practice_sites s join')) return sites;
        if (sql.includes('select (?::date)::timestamp')) {
          return [
            {
              day_start: new Date('2026-10-28T04:00:00Z'),
              cutoff: new Date('2026-10-29T04:00:00Z'),
            },
          ];
        }
        return [];
      }),
    };
    const em = { transactional: fn((cb: any) => cb(tx)) };
    const settings = {
      forPractice: fn().mockResolvedValue({
        censusCloseGraceMinutes: 5,
        censusCloseLookbackDays: 3,
      }),
    };
    const service = new InpatientCensusService(
      em as any,
      {} as any,
      settings as any,
      {} as any,
      { setContext: fn(), error: fn(), info: fn() } as any,
    );
    jest
      .spyOn(service as any, 'closeSiteDay')
      .mockImplementation((async (_tx: any, input: any) =>
        closeImpl(input.siteId, input.date)) as any);
    return { service, tx, calls };
  }

  const site = (id: string) => ({
    site_id: id,
    tenant_id: `t-${id}`,
    practice_id: 'p',
    tz: 'America/La_Paz',
  });

  it('cada transacción fija el contexto SYSTEM antes de leer: la tabla tiene RLS y el tick no trae tenant', async () => {
    const { service, tx } = build([site('s1')], async () => ({
      closed: [],
      alreadyClosed: [],
    }));
    await service.closeDueDays(NOW);
    const firstSql = tx.execute.mock.calls[0][0] as string;
    expect(firstSql).toContain(
      "set_config('app.system_context', 'true', true)",
    );
    const sets = tx.execute.mock.calls.filter((c: any[]) =>
      String(c[0]).includes('app.system_context'),
    ).length;
    const txs = tx.execute.mock.calls.length;
    expect(sets).toBeGreaterThanOrEqual(3); // lectura de sedes, ajustes y al menos un cierre
    expect(txs).toBeGreaterThan(sets);
  });

  it('recorre los últimos N días terminados de cada sede y cuenta lo cerrado', async () => {
    const seen: string[] = [];
    const { service } = build(
      [site('s1'), site('s2')],
      async (siteId, date) => {
        seen.push(`${siteId}:${date}`);
        return {
          closed: siteId === 's1' && date === '2026-10-28' ? [{ id: 'd' }] : [],
          alreadyClosed: [],
        };
      },
    );
    const out = await service.closeDueDays(NOW);
    // hoy en La Paz es 2026-10-29 ⇒ ayer, antes de ayer y un día más (lookback 3)
    expect(seen).toEqual([
      's1:2026-10-28',
      's1:2026-10-27',
      's1:2026-10-26',
      's2:2026-10-28',
      's2:2026-10-27',
      's2:2026-10-26',
    ]);
    expect(out).toEqual({ sites: 2, daysClosed: 1, unitsClosed: 1, failed: 0 });
  });

  it('un fallo en una sede no frena a las demás y se informa en failed', async () => {
    const { service } = build([site('s1'), site('s2')], async (siteId) => {
      if (siteId === 's1') throw new Error('falla de s1');
      return { closed: [{ id: 'x' }], alreadyClosed: [] };
    });
    const out = await service.closeDueDays(NOW);
    expect(out.failed).toBe(3); // s1 × 3 días
    expect(out.unitsClosed).toBe(3); // s2 × 3 días
  });

  it('no cierra un día que todavía no pasó el corte más la gracia', async () => {
    const closeSpy = fn();
    const { service, tx } = build([site('s1')], closeSpy);
    // 04:02Z del 29 es 00:02 local: el día 28 terminó hace 2 min (< 5 min de gracia)
    tx.execute.mockImplementation(async (sql: string) => {
      if (sql.includes('from practice.practice_sites s join'))
        return [site('s1')];
      if (sql.includes('select (?::date)::timestamp'))
        return [
          {
            day_start: new Date('2026-10-28T04:00:00Z'),
            cutoff: new Date('2026-10-29T04:00:00Z'),
          },
        ];
      return [];
    });
    const spy = jest.spyOn(service as any, 'closeSiteDay');
    await service.closeDueDays(new Date('2026-10-29T04:02:00Z'));
    const dates = spy.mock.calls.map((c: any[]) => c[1].date);
    expect(dates).not.toContain('2026-10-28');
  });
});
