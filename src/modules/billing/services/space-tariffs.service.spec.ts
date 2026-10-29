import { runWithTenant } from '../../../common';
import { mockFn } from '../../practice/services/infrastructure.testing';
import { BILL } from '../billing.concepts';
import { SpaceTariffsService } from './space-tariffs.service';

const TENANT = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const PRACTICE = 'pppppppp-pppp-pppp-pppp-pppppppppppp';
const SERVICE = 'ssssssss-ssss-ssss-ssss-ssssssssssss';
const actor = { id: 'user-1', roles: ['USER'] } as any;

const tariffRow = (extra: Record<string, unknown> = {}) => ({
  id: 't-1',
  tenant_id: TENANT,
  practice_id: PRACTICE,
  tariff_kind_concept_id: BILL.TARIFF_BED_DAY,
  bed_category_concept_id: null,
  care_space_id: null,
  service_catalog_id: SERVICE,
  unit_minutes: null,
  minimum_units: null,
  unit_price: '350.000000',
  currency_concept_id: 'bob',
  valid_from: '2026-01-01',
  valid_to: null,
  created_at: new Date('2026-10-29T00:00:00Z'),
  snapshot: { id: 't-1' },
  ...extra,
});

function build(
  script: (sql: string, params: unknown[]) => unknown[] | undefined = () =>
    undefined,
) {
  const tx: any = {
    execute: mockFn(async (sql: string, params: unknown[] = []) => {
      const scripted = script(sql, params);
      if (scripted) return scripted;
      if (sql.includes('from billing.service_catalog'))
        return [{ id: SERVICE }];
      if (sql.includes('currency_concept_id from practice.practices'))
        return [{ currency_concept_id: 'bob' }];
      if (sql.includes('from terminology.catalog_concepts'))
        return [{ id: 'bob' }];
      if (sql.includes('daterange(valid_from')) return [];
      if (sql.includes('insert into billing.space_tariffs'))
        return [tariffRow()];
      return [];
    }),
  };
  const em: any = {
    transactional: mockFn((cb: any) => cb(tx)),
    fork: mockFn(() => tx),
  };
  const access = {
    forPractice: mockFn().mockResolvedValue(undefined),
    forSpace: mockFn().mockResolvedValue(undefined),
  };
  const events = { publish: mockFn().mockResolvedValue(undefined) };
  const history = { append: mockFn().mockResolvedValue(undefined) };
  const service = new SpaceTariffsService(
    em,
    access as any,
    events as any,
    history as any,
  );
  const run = <T>(fn: () => Promise<T>) => runWithTenant(TENANT, fn);
  return { service, tx, access, events, history, run };
}

const body = (extra: Record<string, unknown> = {}) => ({
  practiceId: PRACTICE,
  kind: 'TARIFF_BED_DAY' as const,
  bedCategoryCode: 'BED_CAT_SHARED',
  serviceCatalogId: SERVICE,
  unitPrice: '350.00',
  validFrom: '2026-01-01',
  ...extra,
});

describe('SpaceTariffsService.create', () => {
  it('permitido: autoriza sobre TODA la práctica, escribe, deja historia y publica el evento', async () => {
    const d = build();
    const res = await d.run(() =>
      d.service.create(body() as any, actor, 'req-1'),
    );
    expect(d.access.forPractice).toHaveBeenCalledWith(
      d.tx,
      actor,
      'infra.tariff.write',
      PRACTICE,
      'all',
    );
    expect(res).toMatchObject({
      id: 't-1',
      kind: 'TARIFF_BED_DAY',
      unitPrice: '350.000000',
    });
    expect(d.history.append).toHaveBeenCalledWith(
      d.tx,
      'space_tariffs',
      't-1',
      expect.objectContaining({ tenantId: TENANT, firstRevision: true }),
    );
    expect(d.events.publish).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        type: 'billing.space_tariff.created',
        tenantId: TENANT,
        correlationId: 'req-1',
      }),
    );
    // el tenant sale del contexto, no del cuerpo
    const insert = d.tx.execute.mock.calls.find((c: any[]) =>
      String(c[0]).includes('insert into billing.space_tariffs'),
    );
    expect(insert[1][0]).toBe(TENANT);
  });

  it('una tarifa propia de una sala se autoriza contra esa sala y bloquea la fila (for share)', async () => {
    const d = build((sql) =>
      sql.includes('from practice.care_spaces')
        ? [{ id: 'bed-1', status_concept_id: 'active' }]
        : undefined,
    );
    await d.run(() =>
      d.service.create(
        body({ bedCategoryCode: undefined, careSpaceId: 'bed-1' }) as any,
        actor,
      ),
    );
    expect(d.access.forSpace).toHaveBeenCalledWith(
      d.tx,
      actor,
      'infra.tariff.write',
      'bed-1',
    );
    expect(d.access.forPractice).not.toHaveBeenCalled();
    const sql = d.tx.execute.mock.calls.find((c: any[]) =>
      String(c[0]).includes('from practice.care_spaces'),
    )[0];
    expect(sql).toMatch(/for share of cs/);
  });

  it('un espacio ajeno o de otra práctica es 404; uno clausurado, 422', async () => {
    const ajeno = build((sql) =>
      sql.includes('from practice.care_spaces') ? [] : undefined,
    );
    await expect(
      ajeno.run(() =>
        ajeno.service.create(
          body({ bedCategoryCode: undefined, careSpaceId: 'x' }) as any,
          actor,
        ),
      ),
    ).rejects.toMatchObject({ status: 404, reason: 'TARIFF_SPACE_NOT_FOUND' });
    const retirada = build((sql) =>
      sql.includes('from practice.care_spaces')
        ? [{ id: 'b', status_concept_id: 'ignored' }]
        : undefined,
    );
    // el concepto SPACE_RETIRED llega de practice.concepts; se simula con su valor real
    const { PRAC } = await import('../../practice/practice.concepts');
    retirada.tx.execute.mockImplementation(async (sql: string) =>
      sql.includes('from practice.care_spaces')
        ? [{ id: 'b', status_concept_id: PRAC.SPACE_RETIRED }]
        : [],
    );
    await expect(
      retirada.run(() =>
        retirada.service.create(
          body({ bedCategoryCode: undefined, careSpaceId: 'b' }) as any,
          actor,
        ),
      ),
    ).rejects.toMatchObject({ status: 422, reason: 'TARIFF_SHAPE_INVALID' });
  });

  it('un error de autorización corta todo antes de escribir', async () => {
    const d = build();
    d.access.forPractice.mockRejectedValue(
      Object.assign(new Error('x'), { status: 404 }),
    );
    await expect(
      d.run(() => d.service.create(body() as any, actor)),
    ).rejects.toThrow();
    expect(
      d.tx.execute.mock.calls.some((c: any[]) =>
        String(c[0]).includes('insert into'),
      ),
    ).toBe(false);
  });

  it('el servicio de otra práctica responde 422 TARIFF_SERVICE_NOT_IN_PRACTICE', async () => {
    const d = build((sql) =>
      sql.includes('from billing.service_catalog') ? [] : undefined,
    );
    await expect(
      d.run(() => d.service.create(body() as any, actor)),
    ).rejects.toMatchObject({
      status: 422,
      reason: 'TARIFF_SERVICE_NOT_IN_PRACTICE',
    });
  });

  it('solape de vigencia: 409 TARIFF_OVERLAP con la tarifa en conflicto', async () => {
    const d = build((sql) =>
      sql.includes('daterange(valid_from') ? [{ id: 'otra' }] : undefined,
    );
    await expect(
      d.run(() => d.service.create(body() as any, actor)),
    ).rejects.toMatchObject({
      status: 409,
      reason: 'TARIFF_OVERLAP',
      details: { conflictingTariffId: 'otra' },
    });
  });

  it('formas inválidas: fechas imposibles, categoría desconocida, día-cama con unidad de tiempo, quirófano sin unidad', async () => {
    const d = build();
    for (const bad of [
      body({ validFrom: '2026-02-30' }),
      body({ bedCategoryCode: 'BED_CAT_NOPE' }),
      body({ unitMinutes: 30 }),
      body({ kind: 'TARIFF_OR_TIME', bedCategoryCode: undefined }),
      body({ validTo: '2025-12-31' }),
    ]) {
      await expect(
        d.run(() => d.service.create(bad as any, actor)),
      ).rejects.toMatchObject({
        status: 422,
        reason: 'TARIFF_SHAPE_INVALID',
      });
    }
    expect(d.access.forPractice).not.toHaveBeenCalled();
  });

  it('sin moneda en la práctica ni en el cuerpo es 422', async () => {
    const d = build((sql) =>
      sql.includes('currency_concept_id from practice.practices')
        ? [{ currency_concept_id: null }]
        : undefined,
    );
    await expect(
      d.run(() => d.service.create(body() as any, actor)),
    ).rejects.toMatchObject({
      status: 422,
    });
  });
});

describe('SpaceTariffsService.close', () => {
  it('cierra la vigencia, deja historia y evento; la autoridad es la de la tarifa guardada', async () => {
    const d = build((sql) => {
      if (sql.includes('for update')) return [tariffRow()];
      if (sql.includes('max(service_date)')) return [{ last: '2026-10-20' }];
      if (sql.includes('update billing.space_tariffs'))
        return [tariffRow({ valid_to: '2026-11-01' })];
      return undefined;
    });
    const res = await d.run(() =>
      d.service.close('t-1', { validTo: '2026-11-01' }, actor),
    );
    expect(res.validTo).toBe('2026-11-01');
    expect(d.access.forPractice).toHaveBeenCalledWith(
      d.tx,
      actor,
      'infra.tariff.write',
      PRACTICE,
      'all',
    );
    expect(d.events.publish).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({ type: 'billing.space_tariff.closed' }),
    );
  });

  it('una tarifa inexistente o de otro tenant es 404', async () => {
    const d = build((sql) => (sql.includes('for update') ? [] : undefined));
    await expect(
      d.run(() => d.service.close('t-1', { validTo: '2026-11-01' }, actor)),
    ).rejects.toMatchObject({ status: 404, reason: 'TARIFF_NOT_FOUND' });
    expect(d.access.forPractice).not.toHaveBeenCalled();
  });

  it('no se cierra antes del inicio, ni más tarde de lo que ya vale, ni antes de una fecha ya devengada', async () => {
    const closed = tariffRow({ valid_to: '2026-06-01' });
    const cases: [Record<string, unknown>, string, string | null][] = [
      [tariffRow(), '2026-01-01', null],
      [closed, '2026-07-01', null],
      [tariffRow(), '2026-10-20', '2026-10-20'],
    ];
    for (const [row, validTo, last] of cases) {
      const d = build((sql) => {
        if (sql.includes('for update')) return [row];
        if (sql.includes('max(service_date)')) return [{ last }];
        return undefined;
      });
      await expect(
        d.run(() => d.service.close('t-1', { validTo }, actor)),
      ).rejects.toMatchObject({ status: 422, reason: 'TARIFF_CLOSE_INVALID' });
      expect(
        d.tx.execute.mock.calls.some((c: any[]) =>
          String(c[0]).includes('update billing.space_tariffs'),
        ),
      ).toBe(false);
    }
  });
});

describe('SpaceTariffsService.list', () => {
  it('autoriza la lectura sobre la práctica y filtra por tenant en la consulta', async () => {
    const d = build((sql) =>
      sql.includes('from billing.space_tariffs t') ? [tariffRow()] : undefined,
    );
    const res = await d.run(() =>
      d.service.list(
        {
          practiceId: PRACTICE,
          kind: 'TARIFF_BED_DAY',
          onDate: '2026-10-29',
        } as any,
        actor,
      ),
    );
    expect(res.count).toBe(1);
    expect(d.access.forPractice).toHaveBeenCalledWith(
      d.tx,
      actor,
      'infra.tariff.view',
      PRACTICE,
      'any',
    );
    const [sql, params] = d.tx.execute.mock.calls.find((c: any[]) =>
      String(c[0]).includes('from billing.space_tariffs t'),
    );
    expect(sql).toMatch(/t\.tenant_id = \?/);
    expect(params).toContain(TENANT);
  });
});
