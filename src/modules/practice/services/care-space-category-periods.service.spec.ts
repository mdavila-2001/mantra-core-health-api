import { mockFn } from './infrastructure.testing';
import { CareSpaceCategoryPeriodsService } from './care-space-category-periods.service';

const TENANT = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const AT = new Date('2026-10-29T12:00:00Z');

function build(open: { id: string; valid_from: Date }[] = []) {
  const calls: [string, unknown[]][] = [];
  const tx: any = {
    execute: mockFn(async (sql: string, params: unknown[] = []) => {
      calls.push([sql, params]);
      if (sql.includes('for update')) return open;
      if (sql.includes('insert into')) return [{ id: 'new-period' }];
      return [];
    }),
  };
  return { tx, calls, service: new CareSpaceCategoryPeriodsService() };
}

const input = (extra: Record<string, unknown> = {}) => ({
  careSpaceId: 'bed-1',
  tenantId: TENANT,
  categoryConceptId: 'icu',
  at: AT,
  actorUserId: 'user-1',
  ...extra,
});

describe('CareSpaceCategoryPeriodsService', () => {
  it('open inserta un período abierto con el tenant, la cama y la categoría', async () => {
    const d = build();
    expect(await d.service.open(d.tx, input())).toBe('new-period');
    const [sql, params] = d.calls[0];
    expect(sql).toMatch(/insert into practice\.care_space_category_periods/);
    expect(params.slice(0, 4)).toEqual([TENANT, 'bed-1', 'icu', AT]);
  });

  it('change cierra el período abierto (bloqueado) y abre otro desde el mismo instante, en la misma transacción', async () => {
    const d = build([
      { id: 'old', valid_from: new Date('2026-01-01T00:00:00Z') },
    ]);
    const res = await d.service.change(d.tx, input());
    expect(res).toMatchObject({ openedId: 'new-period', at: AT });
    expect(res.closed).toMatchObject({ id: 'old' });
    const sqls = d.calls.map(([sql]) => sql);
    expect(sqls[0]).toMatch(/for update/);
    expect(sqls[1]).toMatch(
      /update practice\.care_space_category_periods\s+set valid_to = \?/,
    );
    expect(sqls[2]).toMatch(/insert into/);
    expect(d.calls[1][1][0]).toEqual(AT); // valid_to del anterior
    expect(d.calls[2][1][3]).toEqual(AT); // valid_from del nuevo
    expect(d.tx.execute).toHaveBeenCalledTimes(3);
  });

  it('si el período abierto empezó en ese instante (o después) el cierre se corre un milisegundo: la base exige valid_to > valid_from', async () => {
    const d = build([{ id: 'old', valid_from: AT }]);
    const res = await d.service.change(d.tx, input());
    expect(res.at.getTime()).toBe(AT.getTime() + 1);
    expect(d.calls[1][1][0]).toEqual(res.at);
    expect(d.calls[2][1][3]).toEqual(res.at);
  });

  it('una cama sin período abierto (heredada) sólo abre; quitar la categoría sólo cierra', async () => {
    const sin = build([]);
    const abre = await sin.service.change(sin.tx, input());
    expect(abre.closed).toBeNull();
    expect(abre.openedId).toBe('new-period');
    const quita = build([
      { id: 'old', valid_from: new Date('2026-01-01T00:00:00Z') },
    ]);
    const cierra = await quita.service.change(
      quita.tx,
      input({ categoryConceptId: null }),
    );
    expect(cierra.openedId).toBeNull();
    expect(quita.calls.some(([sql]) => sql.includes('insert into'))).toBe(
      false,
    );
  });
});
