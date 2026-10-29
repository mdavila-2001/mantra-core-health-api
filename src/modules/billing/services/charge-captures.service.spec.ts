import { runWithTenant } from '../../../common';
import { mockFn } from '../../practice/services/infrastructure.testing';
import { BILL } from '../billing.concepts';
import {
  ChargeCapturesService,
  toChargeResponse,
  type ChargeRow,
} from './charge-captures.service';

const TENANT = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const PRACTICE = 'pppppppp-pppp-pppp-pppp-pppppppppppp';
const actor = { id: 'user-1', roles: ['USER'] } as any;

const row = (extra: Partial<ChargeRow> = {}): ChargeRow => ({
  id: 'c-1',
  tenant_id: TENANT,
  practice_id: PRACTICE,
  patient_profile_id: 'pat-1',
  encounter_id: 'enc-1',
  source_kind_concept_id: BILL.CHG_SRC_BED_DAY,
  service_date: '2026-10-27',
  care_space_id: 'bed-1',
  bed_category_concept_id: null,
  space_tariff_id: 't-1',
  service_catalog_id: 'svc-1',
  minimum_stay_charge: false,
  quantity: '1',
  unit_price: '350.000000',
  currency_concept_id: 'bob',
  cost_center_id: null,
  status_concept_id: BILL.CHG_PENDING,
  invoice_line_id: null,
  void_reason: null,
  idempotency_key: 'BEDDAY:enc-1:2026-10-27',
  created_at: new Date('2026-10-28T00:00:00Z'),
  ...extra,
});

function build(
  script: (sql: string, params: unknown[]) => unknown[] | undefined = () =>
    undefined,
) {
  const tx: any = {
    execute: mockFn(
      async (sql: string, params: unknown[] = []) => script(sql, params) ?? [],
    ),
  };
  const em: any = {
    transactional: mockFn((cb: any) => cb(tx)),
    fork: mockFn(() => tx),
  };
  const access = {
    forSpace: mockFn().mockResolvedValue(undefined),
    forPractice: mockFn().mockResolvedValue(undefined),
    canOnSpace: mockFn().mockResolvedValue(true),
  };
  const events = { publish: mockFn().mockResolvedValue(undefined) };
  const history = { append: mockFn().mockResolvedValue(undefined) };
  const service = new ChargeCapturesService(
    em,
    access as any,
    events as any,
    history as any,
  );
  const run = <T>(fn: () => Promise<T>) => runWithTenant(TENANT, fn);
  return { service, tx, access, events, history, run };
}

describe('ChargeCapturesService.void', () => {
  const scripted = (current: ChargeRow) => (sql: string) => {
    if (sql.includes('for update')) return [current];
    if (sql.includes('update billing.charge_captures'))
      return [
        {
          ...current,
          status_concept_id: BILL.CHG_VOIDED,
          void_reason: 'x',
          snapshot: {},
        },
      ];
    return undefined;
  };

  it('permitido: autoriza contra la cama del cargo, anula con motivo, deja historia y evento sin el texto del motivo', async () => {
    const d = build(scripted(row()));
    const res = await d.run(() =>
      d.service.void(
        'c-1',
        { reason: '  Ingreso duplicado  ' },
        actor,
        'req-1',
      ),
    );
    expect(d.access.forSpace).toHaveBeenCalledWith(
      d.tx,
      actor,
      'infra.charge.void',
      'bed-1',
    );
    expect(res.status).toBe('VOIDED');
    const update = d.tx.execute.mock.calls.find((c: any[]) =>
      String(c[0]).includes('update billing.charge_captures'),
    );
    expect(update[1]).toEqual([
      BILL.CHG_VOIDED,
      'Ingreso duplicado',
      'user-1',
      'c-1',
    ]);
    expect(d.history.append).toHaveBeenCalledWith(
      d.tx,
      'charge_captures',
      'c-1',
      expect.objectContaining({ tenantId: TENANT, changedByUserId: 'user-1' }),
    );
    const event = d.events.publish.mock.calls[0][1];
    expect(event.type).toBe('billing.charge_capture.voided');
    expect(JSON.stringify(event.payload)).not.toContain('duplicado');
  });

  it('un cargo de otro tenant o inexistente es 404 y no autoriza nada', async () => {
    const d = build(() => []);
    await expect(
      d.run(() => d.service.void('c-1', { reason: 'abc' }, actor)),
    ).rejects.toMatchObject({
      status: 404,
      reason: 'CHARGE_CAPTURE_NOT_FOUND',
    });
    expect(d.access.forSpace).not.toHaveBeenCalled();
  });

  it('sin cama el cargo se autoriza contra su práctica', async () => {
    const d = build(scripted(row({ care_space_id: null })));
    await d.run(() => d.service.void('c-1', { reason: 'abc' }, actor));
    expect(d.access.forPractice).toHaveBeenCalledWith(
      d.tx,
      actor,
      'infra.charge.void',
      PRACTICE,
      'any',
    );
  });

  it('motivo en blanco: 422; ya anulado: 409; el rol insuficiente corta antes de mirar el motivo', async () => {
    const vacio = build(scripted(row()));
    await expect(
      vacio.run(() => vacio.service.void('c-1', { reason: '   ' }, actor)),
    ).rejects.toMatchObject({
      status: 422,
      reason: 'CHARGE_VOID_REASON_REQUIRED',
    });
    const anulado = build(
      scripted(row({ status_concept_id: BILL.CHG_VOIDED })),
    );
    await expect(
      anulado.run(() => anulado.service.void('c-1', { reason: 'abc' }, actor)),
    ).rejects.toMatchObject({ status: 409, reason: 'CHARGE_ALREADY_VOIDED' });
    const sinRol = build(scripted(row()));
    sinRol.access.forSpace.mockRejectedValue(
      Object.assign(new Error('no'), { status: 403 }),
    );
    await expect(
      sinRol.run(() => sinRol.service.void('c-1', { reason: '' }, actor)),
    ).rejects.toThrow('no');
  });
});

describe('ChargeCapturesService.pendingForEncounter', () => {
  const script =
    (charges: ChargeRow[], encounter = true) =>
    (sql: string) => {
      if (sql.includes('from clinical.encounters'))
        return encounter ? [{ id: 'enc-1' }] : [];
      if (sql.includes('from billing.charge_captures c')) return charges;
      if (sql.includes('from clinical.encounter_locations'))
        return [{ practice_id: PRACTICE }];
      return undefined;
    };

  it('devuelve sólo los cargos cuya cama puede ver el actor', async () => {
    const d = build(
      script([
        row({ id: 'a', care_space_id: 'visible' }),
        row({ id: 'b', care_space_id: 'oculta' }),
      ]),
    );
    d.access.canOnSpace.mockImplementation(
      async (_t: unknown, _a: unknown, _x: string, id: string) =>
        id === 'visible',
    );
    const res = await d.run(() =>
      d.service.pendingForEncounter('enc-1', actor),
    );
    expect(res.items.map((i) => i.id)).toEqual(['a']);
    expect(d.access.canOnSpace).toHaveBeenCalledWith(
      d.tx,
      actor,
      'infra.charge.view',
      'visible',
    );
  });

  it('si no ve ninguno, o el encuentro no es del tenant, es el mismo 404', async () => {
    const ninguno = build(script([row()]));
    ninguno.access.canOnSpace.mockResolvedValue(false);
    await expect(
      ninguno.run(() => ninguno.service.pendingForEncounter('enc-1', actor)),
    ).rejects.toMatchObject({ status: 404 });
    const ajeno = build(script([], false));
    await expect(
      ajeno.run(() => ajeno.service.pendingForEncounter('enc-1', actor)),
    ).rejects.toMatchObject({ status: 404 });
  });

  it('un encuentro sin cargos se autoriza por las prácticas donde estuvo', async () => {
    const d = build(script([]));
    await expect(
      d.run(() => d.service.pendingForEncounter('enc-1', actor)),
    ).resolves.toMatchObject({ count: 0 });
    expect(d.access.forPractice).toHaveBeenCalledWith(
      d.tx,
      actor,
      'infra.charge.view',
      PRACTICE,
      'any',
    );
    d.access.forPractice.mockRejectedValue(
      Object.assign(new Error('x'), { status: 404, getStatus: () => 404 }),
    );
    const sinAcceso = build(script([]));
    sinAcceso.access.forPractice.mockRejectedValue(
      Object.assign(new Error('x'), { getStatus: () => 403 }),
    );
    await expect(
      sinAcceso.run(() =>
        sinAcceso.service.pendingForEncounter('enc-1', actor),
      ),
    ).rejects.toMatchObject({ status: 404 });
  });
});

describe('ChargeCapturesService.loadForInvoice', () => {
  const invoice = {
    practiceId: PRACTICE,
    patientProfileId: 'pat-1',
    encounterId: 'enc-1',
  };

  it('todos existen en el tenant, se autorizan contra su cama y se bloquean las filas', async () => {
    const d = build(() => [
      row({ id: 'a' }),
      row({ id: 'b', care_space_id: 'bed-2' }),
    ]);
    const rows = await d.run(() =>
      d.service.loadForInvoice(d.tx, ['a', 'b', 'a'], invoice, actor),
    );
    expect(rows).toHaveLength(2);
    expect(d.access.forSpace).toHaveBeenCalledWith(
      d.tx,
      actor,
      'infra.charge.invoice',
      'bed-1',
    );
    expect(d.access.forSpace).toHaveBeenCalledWith(
      d.tx,
      actor,
      'infra.charge.invoice',
      'bed-2',
    );
    const [sql, params] = d.tx.execute.mock.calls[0];
    expect(sql).toMatch(/for update/);
    expect(params).toEqual(['a', 'b', TENANT]);
  });

  it('un cargo que falta (o es de otro tenant) hace 404 para todo el lote', async () => {
    const d = build(() => [row({ id: 'a' })]);
    await expect(
      d.run(() =>
        d.service.loadForInvoice(d.tx, ['a', 'ajeno'], invoice, actor),
      ),
    ).rejects.toMatchObject({
      status: 404,
      reason: 'CHARGE_CAPTURE_NOT_FOUND',
    });
    expect(d.access.forSpace).not.toHaveBeenCalled();
  });

  it('de otro paciente o encuentro: 422; ya facturado o anulado: 409; sin precio: 422', async () => {
    const reasons: [Partial<ChargeRow>, number, string][] = [
      [{ patient_profile_id: 'otro' }, 422, 'CHARGE_NOT_OF_INVOICE'],
      [{ encounter_id: 'otro' }, 422, 'CHARGE_NOT_OF_INVOICE'],
      [{ practice_id: 'otra' }, 422, 'CHARGE_NOT_OF_INVOICE'],
      [
        { status_concept_id: BILL.CHG_INVOICED },
        409,
        'CHARGE_ALREADY_INVOICED',
      ],
      [{ status_concept_id: BILL.CHG_VOIDED }, 409, 'CHARGE_ALREADY_INVOICED'],
      [{ unit_price: null }, 422, 'CHARGE_WITHOUT_PRICE'],
    ];
    for (const [extra, status, reason] of reasons) {
      const d = build(() => [row(extra)]);
      await expect(
        d.run(() => d.service.loadForInvoice(d.tx, ['c-1'], invoice, actor)),
      ).rejects.toMatchObject({ status, reason });
    }
  });

  it('el rol insuficiente corta antes de validar el contenido', async () => {
    const d = build(() => [row({ status_concept_id: BILL.CHG_INVOICED })]);
    d.access.forSpace.mockRejectedValue(
      Object.assign(new Error('403'), { status: 403 }),
    );
    await expect(
      d.run(() => d.service.loadForInvoice(d.tx, ['c-1'], invoice, actor)),
    ).rejects.toThrow('403');
  });
});

describe('ChargeCapturesService.markInvoiced', () => {
  it('pasa PENDING → INVOICED con su línea; si ya no estaba pendiente, 409', async () => {
    const ok = build((sql) =>
      sql.includes('update billing.charge_captures')
        ? [{ snapshot: {} }]
        : undefined,
    );
    await ok.run(() =>
      ok.service.markInvoiced(
        ok.tx,
        row(),
        { invoiceId: 'i', invoiceLineId: 'l' },
        actor,
      ),
    );
    expect(ok.tx.execute.mock.calls[0][1]).toEqual([
      BILL.CHG_INVOICED,
      'l',
      'user-1',
      'c-1',
      BILL.CHG_PENDING,
    ]);
    expect(ok.events.publish.mock.calls[0][1].type).toBe(
      'billing.charge_capture.invoiced',
    );
    const perdido = build(() => []);
    await expect(
      perdido.run(() =>
        perdido.service.markInvoiced(
          perdido.tx,
          row(),
          { invoiceId: 'i', invoiceLineId: 'l' },
          actor,
        ),
      ),
    ).rejects.toMatchObject({ status: 409, reason: 'CHARGE_ALREADY_INVOICED' });
    expect(perdido.events.publish).not.toHaveBeenCalled();
  });
});

describe('toChargeResponse', () => {
  it('un pendiente sin precio es tariffMissing; un emitido o anulado sin precio no', () => {
    expect(toChargeResponse(row({ unit_price: null })).tariffMissing).toBe(
      true,
    );
    expect(toChargeResponse(row()).tariffMissing).toBe(false);
    expect(
      toChargeResponse(
        row({ unit_price: null, status_concept_id: BILL.CHG_VOIDED }),
      ).tariffMissing,
    ).toBe(false);
    expect(
      toChargeResponse(row({ source_kind_concept_id: BILL.CHG_SRC_OR_TIME }))
        .sourceKind,
    ).toBe('OR_TIME');
  });
});
