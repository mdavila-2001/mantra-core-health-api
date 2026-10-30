import { CLIN } from '../../clinical/clinical.concepts';
import {
  COUNTABLE_PACKAGE_UNITS,
  isComparableUnit,
  remainingQuantity,
} from './prescription-balance';

/**
 * El saldo de una receta: cuánto queda por pedir de un fármaco, y cuándo esa
 * cuenta tiene sentido (solo si la receta cuenta envases que se venden por
 * pieza).
 */
describe('prescription-balance', () => {
  describe('isComparableUnit', () => {
    it('el frasco y el tubo se comparan con lo que pide un pedido', () => {
      expect(isComparableUnit(CLIN.MEDICATION_UNIT_BOTTLE)).toBe(true);
      expect(isComparableUnit(CLIN.MEDICATION_UNIT_TUBE)).toBe(true);
      expect(COUNTABLE_PACKAGE_UNITS.size).toBe(2);
    });

    it('comprimidos, miligramos y unidad nula no se comparan', () => {
      expect(isComparableUnit(CLIN.MEDICATION_UNIT_TABLET)).toBe(false);
      expect(isComparableUnit(CLIN.MEDICATION_UNIT_MILLIGRAM)).toBe(false);
      expect(isComparableUnit(null)).toBe(false);
      expect(isComparableUnit(undefined)).toBe(false);
    });
  });

  describe('remainingQuantity', () => {
    const bottle = CLIN.MEDICATION_UNIT_BOTTLE;

    it('resta lo entregado y lo reservado de lo recetado', () => {
      expect(
        remainingQuantity({ prescribed: 3, dispensed: 1, reserved: 1 }, bottle),
      ).toBe(1);
    });

    it('nunca es negativo', () => {
      expect(
        remainingQuantity({ prescribed: 2, dispensed: 2, reserved: 1 }, bottle),
      ).toBe(0);
    });

    it('sin cantidad recetada no hay control', () => {
      expect(
        remainingQuantity(
          { prescribed: null, dispensed: 0, reserved: 0 },
          bottle,
        ),
      ).toBeNull();
    });

    it('con una unidad no comparable no hay control', () => {
      expect(
        remainingQuantity(
          { prescribed: 30, dispensed: 0, reserved: 0 },
          CLIN.MEDICATION_UNIT_TABLET,
        ),
      ).toBeNull();
      expect(
        remainingQuantity({ prescribed: 30, dispensed: 0, reserved: 0 }, null),
      ).toBeNull();
    });
  });
});
