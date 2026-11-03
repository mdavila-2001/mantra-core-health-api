import { describe, expect, it } from '@jest/globals';
import { judgeStockPoint } from './stock-point-rules';

const space = {
  tenantId: 't1',
  practiceSiteId: 's1',
  stockPoint: true,
  active: true,
};
const base = {
  tenantId: 't1',
  pharmacyPracticeSiteId: 's1',
  locationType: 'SHELF' as const,
};

describe('judgeStockPoint (§F5c)', () => {
  it('espacio punto de stock de la misma sede → ok', () => {
    expect(judgeStockPoint({ ...base, careSpaceId: 'c', space })).toEqual({
      ok: true,
    });
  });
  it('espacio de otro tenant o inexistente → 404 (fail-closed por tenant)', () => {
    expect(
      judgeStockPoint({
        ...base,
        careSpaceId: 'c',
        space: { ...space, tenantId: 't2' },
      }),
    ).toMatchObject({ status: 404 });
    expect(
      judgeStockPoint({ ...base, careSpaceId: 'c', space: null }),
    ).toMatchObject({ status: 404 });
  });
  it('espacio de otra sede → 422 STOCK_POINT_SITE_MISMATCH', () => {
    expect(
      judgeStockPoint({
        ...base,
        careSpaceId: 'c',
        space: { ...space, practiceSiteId: 's2' },
      }),
    ).toMatchObject({ reason: 'STOCK_POINT_SITE_MISMATCH' });
  });
  it('espacio sin perfil stockPoint o retirado → 422 SPACE_NOT_STOCK_POINT', () => {
    expect(
      judgeStockPoint({
        ...base,
        careSpaceId: 'c',
        space: { ...space, stockPoint: false },
      }),
    ).toMatchObject({ reason: 'SPACE_NOT_STOCK_POINT' });
    expect(
      judgeStockPoint({
        ...base,
        careSpaceId: 'c',
        space: { ...space, active: false },
      }),
    ).toMatchObject({ reason: 'SPACE_NOT_STOCK_POINT' });
  });
  it('unidad de otro tenant → 404; de otra sede → 422', () => {
    expect(
      judgeStockPoint({
        ...base,
        clinicalUnitId: 'u',
        unit: { tenantId: 't2', practiceSiteId: 's1' },
      }),
    ).toMatchObject({ status: 404 });
    expect(
      judgeStockPoint({
        ...base,
        clinicalUnitId: 'u',
        unit: { tenantId: 't1', practiceSiteId: 's2' },
      }),
    ).toMatchObject({ reason: 'STOCK_POINT_SITE_MISMATCH' });
  });
  it('botiquín sin unidad → 422 WARD_STOCK_REQUIRES_UNIT', () => {
    expect(
      judgeStockPoint({ ...base, locationType: 'WARD_STOCK' }),
    ).toMatchObject({ reason: 'WARD_STOCK_REQUIRES_UNIT' });
  });
});
