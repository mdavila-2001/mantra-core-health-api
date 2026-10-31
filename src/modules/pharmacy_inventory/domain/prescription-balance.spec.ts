import { CLIN } from '../../clinical/clinical.concepts';
import {
  COUNTABLE_PACKAGE_UNITS,
  exceedsQuantity,
  isComparableUnit,
  remainingQuantity,
  sumQuantities,
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

    it('con decimales la resta es exacta: 0.3 − 0.1 da 0.2, no 0.19999999999999998', () => {
      // Lo que daría la resta en `number`, para que el caso no sea trivial.
      expect(0.3 - 0.1).not.toBe(0.2);
      expect(
        remainingQuantity(
          { prescribed: 0.3, dispensed: 0.1, reserved: 0 },
          bottle,
        ),
      ).toBe(0.2);
      expect(
        remainingQuantity(
          { prescribed: 0.3, dispensed: 0.1, reserved: 0.1 },
          bottle,
        ),
      ).toBe(0.1);
      expect(
        remainingQuantity(
          { prescribed: 1, dispensed: 0.7, reserved: 0.3 },
          bottle,
        ),
      ).toBe(0);
    });
  });

  describe('aritmética exacta de cantidades', () => {
    it('sumQuantities suma sin error de coma flotante', () => {
      expect(0.1 + 0.2).not.toBe(0.3);
      expect(sumQuantities([0.1, 0.2])).toBe(0.3);
      expect(sumQuantities([2, 3])).toBe(5);
      expect(sumQuantities([])).toBe(0);
    });

    it('alinea a la mayor escala de los operandos (las columnas son numeric sin escala)', () => {
      expect(sumQuantities([1.5, 0.000001, 0.25])).toBe(1.750001);
      expect(sumQuantities([1e-7, 2e-7])).toBe(3e-7);
      expect(sumQuantities([1e21, 1])).toBe(1e21 + 1);
    });

    it('exceedsQuantity: pedir 0.2 cuando quedan 0.3 − 0.1 no supera el saldo', () => {
      const left = remainingQuantity(
        { prescribed: 0.3, dispensed: 0.1, reserved: 0 },
        CLIN.MEDICATION_UNIT_BOTTLE,
      ) as number;
      expect(exceedsQuantity([0.2], left)).toBe(false);
      expect(exceedsQuantity([0.1, 0.1], left)).toBe(false);
      expect(exceedsQuantity([0.2000001], left)).toBe(true);
      expect(exceedsQuantity([0.1, 0.2], 0.3)).toBe(false);
      expect(exceedsQuantity([3], 2)).toBe(true);
      expect(exceedsQuantity([2], 2)).toBe(false);
    });
  });
});
