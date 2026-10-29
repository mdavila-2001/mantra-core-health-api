import { mockFn } from '../../practice/services/infrastructure.testing';
import { PERIOP } from '../../procedures_perioperative/procedures_perioperative.concepts';
import { BILL } from '../billing.concepts';
import { ChargeAccrualSupport } from './charge-accrual.support';
import { OrTimeChargesService } from './or-time-charges.service';

const TENANT = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const PRACTICE = 'pppppppp-pppp-pppp-pppp-pppppppppppp';
const NOW = new Date('2026-10-30T12:00:00Z');
const at = (local: string) => new Date(`${local}-04:00`);

const caseRow = (extra: Record<string, unknown> = {}) => ({
  id: 'case-1',
  tenant_id: TENANT,
  patient_profile_id: 'pat-1',
  encounter_id: 'enc-1',
  operating_room_id: 'or-1',
  actual_start_at: at('2026-10-29T10:10:00'),
  actual_end_at: at('2026-10-29T11:20:00'),
  updated_at: NOW,
  practice_id: PRACTICE,
  tz: 'America/La_Paz',
  ...extra,
});

const orTariff = (extra: Record<string, unknown> = {}) => ({
  id: 't-or',
  tariff_kind_concept_id: BILL.TARIFF_OR_TIME,
  bed_category_concept_id: null,
  care_space_id: null,
  service_catalog_id: 'svc-or',
  unit_minutes: 30,
  minimum_units: null,
  unit_price: '200.000000',
  currency_concept_id: 'bob',
  valid_from: '2026-01-01',
  valid_to: null,
  ...extra,
});

function build(
  opts: {
    cases?: Record<string, unknown>[];
    events?: { event_type_concept_id: string; first_at: Date; last_at: Date }[];
    tariffs?: Record<string, unknown>[];
    existing?: Record<string, unknown>[];
    insertError?: unknown;
  } = {},
) {
  const inserted: unknown[][] = [];
  const updated: unknown[][] = [];
  const tx: any = {
    execute: mockFn(async (sql: string, params: unknown[] = []) => {
      if (sql.includes('from procedures_perioperative.procedure_cases'))
        return opts.cases ?? [caseRow()];
      if (sql.includes('practice.practice_settings')) return [];
      if (sql.includes('operating_room_utilization_events'))
        return opts.events ?? [];
      if (sql.includes('from billing.space_tariffs'))
        return opts.tariffs ?? [orTariff()];
      if (sql.includes('select id, status_concept_id, unit_price'))
        return opts.existing ?? [];
      if (sql.includes('with recursive up')) return [{ id: 'cc-1' }];
      if (sql.includes('insert into billing.charge_captures')) {
        if (opts.insertError) throw opts.insertError;
        inserted.push(params);
        return [{ id: 'charge-1', snapshot: {} }];
      }
      if (sql.includes('update billing.charge_captures')) {
        updated.push(params);
        return [{ snapshot: {} }];
      }
      return [];
    }),
  };
  const em: any = { transactional: mockFn((cb: any) => cb(tx)) };
  return { tx, em, inserted, updated };
}

async function make(opts: Parameters<typeof build>[0] = {}) {
  const d = build(opts);
  const events = { publish: mockFn().mockResolvedValue(undefined) };
  const history = { append: mockFn().mockResolvedValue(undefined) };
  const logger = {
    setContext: mockFn(),
    warn: mockFn(),
    error: mockFn(),
    info: mockFn(),
  };
  const service = new OrTimeChargesService(
    d.em,
    new ChargeAccrualSupport(),
    events as any,
    history as any,
    logger as any,
  );
  return { ...d, service, events, history, logger };
}

const inOut = (inLocal: string, outLocal: string) => [
  {
    event_type_concept_id: PERIOP.OR_EVENT_PATIENT_IN_ROOM,
    first_at: at(inLocal),
    last_at: at(inLocal),
  },
  {
    event_type_concept_id: PERIOP.OR_EVENT_PATIENT_OUT_OF_ROOM,
    first_at: at(outLocal),
    last_at: at(outLocal),
  },
];

describe('OrTimeChargesService.run', () => {
  it('95 minutos de sala con unidad de 30 son 4 unidades al precio de la tarifa, con la clave ORTIME y el centro de costo', async () => {
    const d = await make({
      events: inOut('2026-10-29T10:00:00', '2026-10-29T11:35:00'),
    });
    const res = await d.service.run({ now: NOW });
    expect(res).toMatchObject({
      cases: 1,
      created: 1,
      failed: 0,
      tariffMissing: 0,
    });
    const params = d.inserted[0];
    expect(params).toEqual(
      expect.arrayContaining([
        'ORTIME:case-1',
        '4',
        '200.000000',
        'cc-1',
        'or-1',
        '2026-10-29',
      ]),
    );
    expect(d.events.publish.mock.calls[0][1]).toMatchObject({
      type: 'billing.charge_capture.created',
      actorUserId: null,
      payload: expect.objectContaining({
        minutes: 95,
        timeSource: 'ROOM_EVENTS',
        quantity: '4',
      }),
    });
  });

  it('sin hechos de sala usa inicio y fin reales del caso (70 min → 3 unidades)', async () => {
    const d = await make();
    await d.service.run({ now: NOW });
    expect(d.inserted[0]).toEqual(expect.arrayContaining(['3']));
    expect(d.events.publish.mock.calls[0][1].payload.timeSource).toBe(
      'CASE_ACTUALS',
    );
  });

  it('sin tarifa vigente el cargo queda sin precio y avisa tariff_missing', async () => {
    const d = await make({ tariffs: [] });
    const res = await d.service.run({ now: NOW });
    expect(res).toMatchObject({ created: 1, tariffMissing: 1 });
    expect(d.events.publish.mock.calls.map((c: any[]) => c[1].type)).toContain(
      'billing.charge_capture.tariff_missing',
    );
  });

  it('un caso sin tiempos utilizables, sin encuentro o con la salida antes de la entrada no se devenga', async () => {
    for (const row of [
      caseRow({ actual_start_at: null, actual_end_at: null }),
      caseRow({ encounter_id: null }),
      caseRow({
        actual_start_at: at('2026-10-29T12:00:00'),
        actual_end_at: at('2026-10-29T11:00:00'),
      }),
    ]) {
      const d = await make({ cases: [row] });
      const res = await d.service.run({ now: NOW });
      expect(res).toMatchObject({ created: 0, notChargeable: 1 });
      expect(d.inserted).toHaveLength(0);
    }
  });

  it('el cargo ya existente no se duplica; un pendiente sin precio se completa cuando aparece la tarifa', async () => {
    const ya = await make({
      existing: [
        {
          id: 'c',
          status_concept_id: BILL.CHG_PENDING,
          unit_price: '200.000000',
        },
      ],
    });
    expect(await ya.service.run({ now: NOW })).toMatchObject({
      created: 0,
      alreadyCaptured: 1,
    });
    expect(ya.inserted).toHaveLength(0);

    const sinPrecio = await make({
      existing: [
        { id: 'c', status_concept_id: BILL.CHG_PENDING, unit_price: null },
      ],
    });
    const res = await sinPrecio.service.run({ now: NOW });
    expect(res.created).toBe(0);
    expect(sinPrecio.updated).toHaveLength(1);
    expect(sinPrecio.updated[0]).toEqual(
      expect.arrayContaining(['3', 't-or', '200.000000']),
    );

    const emitido = await make({
      existing: [
        { id: 'c', status_concept_id: BILL.CHG_INVOICED, unit_price: null },
      ],
    });
    await emitido.service.run({ now: NOW });
    expect(emitido.updated).toHaveLength(0);
  });

  it('un choque con el único del caso (23505) cuenta como ya devengado; otro error, como fallo', async () => {
    const choque = await make({
      insertError: Object.assign(new Error('d'), { code: '23505' }),
    });
    expect(await choque.service.run({ now: NOW })).toMatchObject({
      alreadyCaptured: 1,
      failed: 0,
    });
    const roto = await make({
      insertError: Object.assign(new Error('x'), { code: '40001' }),
    });
    expect(await roto.service.run({ now: NOW })).toMatchObject({ failed: 1 });
  });

  it('con caseId no filtra por ventana y pide sólo ese caso', async () => {
    const d = await make();
    await d.service.run({ caseId: 'case-1', now: NOW });
    const [sql, params] = d.tx.execute.mock.calls.find((c: any[]) =>
      String(c[0]).includes('from procedures_perioperative.procedure_cases'),
    );
    expect(sql).toMatch(/pc\.id = \?/);
    expect(params).toContain('case-1');
  });
});
