import { mockFn } from '../../practice/services/infrastructure.testing';
import { BILL } from '../billing.concepts';
import { BedDayChargesService } from './bed-day-charges.service';
import type { ChargeRow } from './charge-captures.service';

const TENANT = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const PRACTICE = 'pppppppp-pppp-pppp-pppp-pppppppppppp';
const SHARED = 'cat-shared';
const ICU = 'cat-icu';
const NOW = new Date('2026-10-31T12:00:00Z'); // 08:00 en La Paz
const at = (local: string) => new Date(`${local}-04:00`);

interface World {
  tz?: string | null;
  locations?: {
    id: string;
    care_space_id: string;
    start: string;
    end: string | null;
  }[];
  existing?: Partial<ChargeRow>[];
  tariffs?: Record<string, unknown>[];
  insertError?: unknown;
}

const location = (
  l: NonNullable<World['locations']>[number],
  tz: string | null,
) => ({
  id: l.id,
  encounter_id: 'enc-1',
  care_space_id: l.care_space_id,
  period_start: at(l.start),
  period_end: l.end ? at(l.end) : null,
  tenant_id: TENANT,
  patient_profile_id: 'pat-1',
  practice_id: PRACTICE,
  site_id: 'site-1',
  tz,
});

const tariff = (id: string, category: string, price: string) => ({
  id,
  tariff_kind_concept_id: BILL.TARIFF_BED_DAY,
  bed_category_concept_id: category,
  care_space_id: null,
  service_catalog_id: 'svc',
  unit_minutes: null,
  minimum_units: null,
  unit_price: price,
  currency_concept_id: 'bob',
  valid_from: '2026-01-01',
  valid_to: null,
});

const existing = (extra: Partial<ChargeRow>): ChargeRow => ({
  id: 'c-x',
  tenant_id: TENANT,
  practice_id: PRACTICE,
  patient_profile_id: 'pat-1',
  encounter_id: 'enc-1',
  source_kind_concept_id: BILL.CHG_SRC_BED_DAY,
  service_date: '2026-10-27',
  care_space_id: 'bed-a',
  bed_category_concept_id: SHARED,
  space_tariff_id: 't-shared',
  service_catalog_id: 'svc',
  minimum_stay_charge: false,
  quantity: '1',
  unit_price: '350.000000',
  currency_concept_id: 'bob',
  cost_center_id: null,
  status_concept_id: BILL.CHG_PENDING,
  invoice_line_id: null,
  void_reason: null,
  idempotency_key: 'k',
  created_at: new Date(),
  ...extra,
});

function build(world: World = {}) {
  const inserted: unknown[][] = [];
  const updates: unknown[][] = [];
  const tx: any = {
    execute: mockFn(async (sql: string, params: unknown[] = []) => {
      if (sql.includes('set_config')) return [];
      if (sql.includes('from clinical.encounter_locations el'))
        return (world.locations ?? []).map((l) =>
          location(l, world.tz === undefined ? 'America/La_Paz' : world.tz),
        );
      if (sql.includes('practice.practice_settings')) return [];
      if (sql.includes('care_space_category_periods'))
        return [
          {
            care_space_id: 'bed-a',
            bed_category_concept_id: SHARED,
            valid_from: at('2026-01-01T00:00:00'),
            valid_to: null,
          },
          {
            care_space_id: 'bed-b',
            bed_category_concept_id: ICU,
            valid_from: at('2026-01-01T00:00:00'),
            valid_to: null,
          },
        ];
      if (sql.includes('from billing.space_tariffs'))
        return (
          world.tariffs ?? [
            tariff('t-shared', SHARED, '350.000000'),
            tariff('t-icu', ICU, '900.000000'),
          ]
        );
      if (sql.includes('from billing.charge_captures c where c.id'))
        return (world.existing ?? [])
          .map(existing)
          .filter((r) => r.id === params[0]);
      if (sql.includes('from billing.charge_captures c'))
        return (world.existing ?? []).map(existing);
      if (sql.includes('with recursive up')) return [];
      if (sql.includes('insert into billing.charge_captures')) {
        if (world.insertError) throw world.insertError;
        inserted.push([sql, params]);
        return [{ id: `new-${inserted.length}`, snapshot: {} }];
      }
      if (sql.includes('update billing.charge_captures')) {
        updates.push([sql, params]);
        return [
          { snapshot: {}, ...existing({}), status_concept_id: BILL.CHG_VOIDED },
        ];
      }
      return [];
    }),
  };
  const em: any = { transactional: mockFn((cb: any) => cb(tx)) };
  const support = {
    loadTariffs: mockFn(async () => []),
    costCenterOfSpace: mockFn().mockResolvedValue(null),
    insertIfAbsent: mockFn(),
  };
  // Se usa el soporte real para ejercer el SQL de la inserción.
  const captures = {
    markVoided: mockFn(async (_tx: unknown, charge: ChargeRow) => ({
      ...charge,
      status_concept_id: BILL.CHG_VOIDED,
    })),
    voidedPayload: mockFn(() => ({})),
  };
  const events = { publish: mockFn().mockResolvedValue(undefined) };
  const history = { append: mockFn().mockResolvedValue(undefined) };
  const logger = {
    setContext: mockFn(),
    info: mockFn(),
    warn: mockFn(),
    error: mockFn(),
  };
  return {
    em,
    tx,
    captures,
    events,
    history,
    logger,
    inserted,
    updates,
    support,
  };
}

async function make(world: World) {
  const d = build(world);
  const { ChargeAccrualSupport } = await import('./charge-accrual.support');
  const real = new ChargeAccrualSupport();
  const service = new BedDayChargesService(
    d.em,
    real,
    d.captures as any,
    d.events as any,
    d.history as any,
    d.logger as any,
  );
  return { ...d, service };
}

describe('BedDayChargesService.run', () => {
  it('una fecha que no es un día del calendario es 422 BED_DAY_DATE_INVALID y no toca la base', async () => {
    const d = await make({});
    await expect(
      d.service.run({ date: '2026-02-30', now: NOW }),
    ).rejects.toMatchObject({
      status: 422,
      reason: 'BED_DAY_DATE_INVALID',
    });
    expect(d.tx.execute).not.toHaveBeenCalled();
  });

  it('ejemplo del contrato: 3 cargos con la clave BEDDAY y ON CONFLICT con objetivo; el evento sale en la misma transacción', async () => {
    const d = await make({
      locations: [
        {
          id: 'l1',
          care_space_id: 'bed-a',
          start: '2026-10-27T15:00:00',
          end: '2026-10-28T10:00:00',
        },
        {
          id: 'l2',
          care_space_id: 'bed-b',
          start: '2026-10-28T10:00:00',
          end: '2026-10-30T09:00:00',
        },
      ],
    });
    const res = await d.service.run({ now: NOW });
    expect(res).toMatchObject({
      created: 3,
      failed: 0,
      conflicts: 0,
      tariffMissing: 0,
      encounters: 1,
    });
    const keys = d.inserted.map(([, params]) => (params as unknown[])[17]);
    expect(keys).toEqual([
      'BEDDAY:enc-1:2026-10-27',
      'BEDDAY:enc-1:2026-10-28',
      'BEDDAY:enc-1:2026-10-29',
    ]);
    for (const [sql] of d.inserted)
      expect(sql).toMatch(
        /on conflict \(tenant_id, idempotency_key\) do nothing/i,
      );
    const prices = d.inserted.map(([, params]) => (params as unknown[])[13]);
    expect(prices).toEqual(['350.000000', '900.000000', '900.000000']);
    expect(d.events.publish).toHaveBeenCalledTimes(3);
    expect(d.history.append).toHaveBeenCalledTimes(3);
  });

  it('reaplicar con los cargos ya existentes no inserta ni publica nada', async () => {
    const d = await make({
      locations: [
        {
          id: 'l1',
          care_space_id: 'bed-a',
          start: '2026-10-27T15:00:00',
          end: '2026-10-28T10:00:00',
        },
      ],
      existing: [existing({})],
    });
    const res = await d.service.run({ now: NOW });
    expect(res).toMatchObject({
      created: 0,
      alreadyCaptured: 1,
      repriced: 0,
      voidedStale: 0,
    });
    expect(d.inserted).toHaveLength(0);
    expect(d.events.publish).not.toHaveBeenCalled();
  });

  it('una noche anulada a mano no se resucita; una emitida no se toca', async () => {
    const d = await make({
      locations: [
        {
          id: 'l1',
          care_space_id: 'bed-a',
          start: '2026-10-26T15:00:00',
          end: '2026-10-28T10:00:00',
        },
      ],
      existing: [
        existing({
          id: 'v',
          service_date: '2026-10-26',
          status_concept_id: BILL.CHG_VOIDED,
          void_reason: 'x',
        }),
        existing({
          id: 'i',
          service_date: '2026-10-27',
          status_concept_id: BILL.CHG_INVOICED,
          invoice_line_id: 'l',
        }),
      ],
    });
    const res = await d.service.run({ now: NOW });
    expect(res).toMatchObject({
      created: 0,
      voidedStale: 0,
      repriced: 0,
      alreadyCaptured: 2,
    });
    expect(d.inserted).toHaveLength(0);
  });

  it('el choque con otro cargo de la misma noche (23505) se cuenta y NO aborta el resto', async () => {
    const d = await make({
      locations: [
        {
          id: 'l1',
          care_space_id: 'bed-a',
          start: '2026-10-27T15:00:00',
          end: '2026-10-29T10:00:00',
        },
      ],
      insertError: Object.assign(new Error('duplicate'), {
        code: '23505',
        constraint: 'ux_charge_captures_bed_night',
      }),
    });
    const res = await d.service.run({ now: NOW });
    expect(res).toMatchObject({ created: 0, conflicts: 2, failed: 0 });
  });

  it('un error distinto cuenta como fallo del encuentro y no se traga en silencio', async () => {
    const d = await make({
      locations: [
        {
          id: 'l1',
          care_space_id: 'bed-a',
          start: '2026-10-27T15:00:00',
          end: '2026-10-28T10:00:00',
        },
      ],
      insertError: Object.assign(new Error('boom'), { code: '40001' }),
    });
    const res = await d.service.run({ now: NOW });
    expect(res.failed).toBe(1);
    expect(d.logger.error).toHaveBeenCalled();
  });

  it('sin zona horaria válida no se adivina la medianoche: el encuentro se informa y no devenga', async () => {
    const d = await make({
      tz: null,
      locations: [
        {
          id: 'l1',
          care_space_id: 'bed-a',
          start: '2026-10-27T15:00:00',
          end: '2026-10-28T10:00:00',
        },
      ],
    });
    const res = await d.service.run({ now: NOW });
    expect(res).toMatchObject({
      timeZoneMissing: 1,
      created: 0,
      encounters: 0,
    });
    expect(d.inserted).toHaveLength(0);
  });

  it('sin tarifa el cargo se crea sin precio y publica tariff_missing', async () => {
    const d = await make({
      tariffs: [],
      locations: [
        {
          id: 'l1',
          care_space_id: 'bed-a',
          start: '2026-10-27T15:00:00',
          end: '2026-10-28T10:00:00',
        },
      ],
    });
    const res = await d.service.run({ now: NOW });
    expect(res).toMatchObject({ created: 1, tariffMissing: 1 });
    expect((d.inserted[0][1] as unknown[])[13]).toBeNull();
    expect(d.events.publish.mock.calls.map((c: any[]) => c[1].type)).toEqual([
      'billing.charge_capture.created',
      'billing.charge_capture.tariff_missing',
    ]);
  });

  it('un pendiente cuya noche ya no existe se anula con rastro (nunca se edita)', async () => {
    const d = await make({
      locations: [
        {
          id: 'l1',
          care_space_id: 'bed-a',
          start: '2026-10-27T15:00:00',
          end: '2026-10-28T10:00:00',
        },
      ],
      existing: [
        existing({}),
        existing({
          id: 'sobra',
          service_date: '2026-10-28',
          idempotency_key: 'k2',
        }),
      ],
    });
    d.tx.execute.mockImplementation(
      (
        (impl) =>
        async (sql: string, params: unknown[] = []) => {
          if (sql.includes('for update'))
            return [existing({ id: 'sobra', service_date: '2026-10-28' })];
          return impl(sql, params);
        }
      )(d.tx.execute.getMockImplementation()),
    );
    const res = await d.service.run({ now: NOW });
    expect(res.voidedStale).toBe(1);
    expect(d.captures.markVoided).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({ id: 'sobra' }),
      expect.stringMatching(/ocupación/),
      null,
    );
    expect(d.events.publish.mock.calls[0][1]).toMatchObject({
      type: 'billing.charge_capture.voided',
      actorUserId: null,
    });
  });

  it('un pendiente sin precio recibe el de la tarifa que apareció después (recalcula, no duplica)', async () => {
    const d = await make({
      locations: [
        {
          id: 'l1',
          care_space_id: 'bed-a',
          start: '2026-10-27T15:00:00',
          end: '2026-10-28T10:00:00',
        },
      ],
      existing: [
        existing({
          unit_price: null,
          space_tariff_id: null,
          service_catalog_id: null,
          currency_concept_id: null,
        }),
      ],
    });
    const res = await d.service.run({ now: NOW });
    expect(res).toMatchObject({ repriced: 1, created: 0 });
    expect(d.updates).toHaveLength(1);
    expect(d.updates[0][1]).toEqual(
      expect.arrayContaining(['t-shared', '350.000000']),
    );
  });
});
