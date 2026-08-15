import { diagnosticUnitsIndexes } from '../../orm/catalog/indexes/diagnostic_units.idx';

describe('diagnostic_units canonical uniqueness', () => {
  it('allows several units per tenant and scopes code uniqueness to that tenant', () => {
    const uniqueUnitIndexes = diagnosticUnitsIndexes.filter(
      ([table, , , unique]) => table === 'diagnostic_units' && unique,
    );

    expect(uniqueUnitIndexes).toContainEqual([
      'diagnostic_units',
      'uq_diagnostic_units_tenant_id_code',
      ['tenant_id', 'code'],
      true,
      'btree',
    ]);
    expect(uniqueUnitIndexes).not.toEqual(
      expect.arrayContaining([
        expect.arrayContaining(['uq_diagnostic_units_tenant_id']),
        expect.arrayContaining(['uq_diagnostic_units_code']),
      ]),
    );
  });
});
