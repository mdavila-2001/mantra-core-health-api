import {
  pickBedDayTariff,
  pickOrTimeTariff,
  tariffCoversDate,
  validateTariffShape,
  type TariffCandidate,
} from './tariff-rules';

const tariff = (extra: Partial<TariffCandidate>): TariffCandidate => ({
  id: 't',
  tariffKindConceptId: 'bed',
  bedCategoryConceptId: null,
  careSpaceId: null,
  serviceCatalogId: 's',
  unitMinutes: null,
  minimumUnits: null,
  unitPrice: '100',
  currencyConceptId: 'bob',
  validFrom: '2026-01-01',
  validTo: null,
  ...extra,
});

describe('pickBedDayTariff', () => {
  const shared = tariff({ id: 'shared', bedCategoryConceptId: 'SHARED' });
  const icu = tariff({ id: 'icu', bedCategoryConceptId: 'ICU' });
  const own = tariff({ id: 'own', careSpaceId: 'bed-1' });

  it('elige la tarifa de la categoría vigente en la fecha de servicio', () => {
    expect(
      pickBedDayTariff([shared, icu], 'bed-1', 'ICU', '2026-10-28')?.id,
    ).toBe('icu');
  });
  it('la tarifa propia de la sala manda sobre la de la categoría', () => {
    expect(
      pickBedDayTariff([shared, own], 'bed-1', 'SHARED', '2026-10-28')?.id,
    ).toBe('own');
    expect(
      pickBedDayTariff([shared, own], 'bed-2', 'SHARED', '2026-10-28')?.id,
    ).toBe('shared');
  });
  it('[valid_from, valid_to): la versión nueva rige desde su inicio y la vieja no se aplica ese día', () => {
    const old = tariff({
      id: 'old',
      bedCategoryConceptId: 'SHARED',
      validTo: '2026-11-01',
    });
    const next = tariff({
      id: 'next',
      bedCategoryConceptId: 'SHARED',
      validFrom: '2026-11-01',
      unitPrice: '150',
    });
    expect(pickBedDayTariff([old, next], 'b', 'SHARED', '2026-10-31')?.id).toBe(
      'old',
    );
    expect(pickBedDayTariff([old, next], 'b', 'SHARED', '2026-11-01')?.id).toBe(
      'next',
    );
  });
  it('una tarifa con vigencia futura no se aplica a una fecha pasada y sin tarifa no se inventa precio', () => {
    const future = tariff({
      id: 'f',
      bedCategoryConceptId: 'SHARED',
      validFrom: '2027-01-01',
    });
    expect(pickBedDayTariff([future], 'b', 'SHARED', '2026-10-28')).toBeNull();
  });
  it('nunca cae a otra categoría en silencio', () => {
    expect(pickBedDayTariff([icu], 'b', 'SHARED', '2026-10-28')).toBeNull();
  });
});

describe('pickOrTimeTariff', () => {
  const general = tariff({
    id: 'general',
    tariffKindConceptId: 'or',
    unitMinutes: 30,
  });
  const room = tariff({
    id: 'room',
    tariffKindConceptId: 'or',
    unitMinutes: 15,
    careSpaceId: 'or-1',
  });
  it('la tarifa de la sala o, si no hay, la general de quirófano', () => {
    expect(pickOrTimeTariff([general, room], 'or-1', '2026-10-29')?.id).toBe(
      'room',
    );
    expect(pickOrTimeTariff([general, room], 'or-2', '2026-10-29')?.id).toBe(
      'general',
    );
    expect(pickOrTimeTariff([room], 'or-2', '2026-10-29')).toBeNull();
  });
});

describe('tariffCoversDate', () => {
  it('semiabierto', () => {
    const t = { validFrom: '2026-01-01', validTo: '2026-02-01' };
    expect(tariffCoversDate(t, '2026-01-01')).toBe(true);
    expect(tariffCoversDate(t, '2026-01-31')).toBe(true);
    expect(tariffCoversDate(t, '2026-02-01')).toBe(false);
    expect(tariffCoversDate(t, '2025-12-31')).toBe(false);
  });
});

describe('validateTariffShape', () => {
  it('día-cama válido: categoría o sala, sin unidad de tiempo', () => {
    expect(
      validateTariffShape({
        kind: 'TARIFF_BED_DAY',
        bedCategoryConceptId: 'x',
        unitPrice: '10',
        validFrom: '2026-01-01',
      }),
    ).toEqual([]);
    expect(
      validateTariffShape({
        kind: 'TARIFF_BED_DAY',
        careSpaceId: 'x',
        unitPrice: '10.50',
        validFrom: '2026-01-01',
      }),
    ).toEqual([]);
  });
  it('día-cama sin categoría ni sala, o con unidad de tiempo (los 0,5 días), es inválido', () => {
    const fields = (e: { field: string }[]) => e.map((x) => x.field);
    expect(
      fields(
        validateTariffShape({
          kind: 'TARIFF_BED_DAY',
          unitPrice: '10',
          validFrom: '2026-01-01',
        }),
      ),
    ).toEqual(['bedCategoryCode']);
    expect(
      fields(
        validateTariffShape({
          kind: 'TARIFF_BED_DAY',
          bedCategoryConceptId: 'x',
          unitMinutes: 720,
          unitPrice: '10',
          validFrom: '2026-01-01',
        }),
      ),
    ).toEqual(['unitMinutes']);
  });
  it('quirófano exige unidad de tiempo y no lleva categoría de cama', () => {
    const fields = (e: { field: string }[]) => e.map((x) => x.field);
    expect(
      fields(
        validateTariffShape({
          kind: 'TARIFF_OR_TIME',
          unitPrice: '10',
          validFrom: '2026-01-01',
        }),
      ),
    ).toEqual(['unitMinutes']);
    expect(
      fields(
        validateTariffShape({
          kind: 'TARIFF_OR_TIME',
          unitMinutes: 30,
          bedCategoryConceptId: 'x',
          unitPrice: '10',
          validFrom: '2026-01-01',
        }),
      ),
    ).toEqual(['bedCategoryCode']);
    expect(
      validateTariffShape({
        kind: 'TARIFF_OR_TIME',
        unitMinutes: 30,
        minimumUnits: 2,
        unitPrice: '10',
        validFrom: '2026-01-01',
      }),
    ).toEqual([]);
  });
  it('precio no negativo con a lo sumo 2 decimales, mínimo >= 1 y cierre posterior al inicio', () => {
    const fields = (e: { field: string }[]) => e.map((x) => x.field).sort();
    expect(
      fields(
        validateTariffShape({
          kind: 'TARIFF_OR_TIME',
          unitMinutes: 30,
          minimumUnits: 0,
          unitPrice: '-1',
          validFrom: '2026-02-01',
          validTo: '2026-02-01',
        }),
      ),
    ).toEqual(['minimumUnits', 'unitPrice', 'validTo']);
  });
});
