import { COURSE_PAYMENT_SOURCE_REF } from '../education/services/education-learning.service';
import {
  DEBT_SOURCE_REF_TYPE,
  NON_DEBT_SOURCE_REF_TYPES,
  mayChargeADebt,
} from './payments.source-refs';

describe('mayChargeADebt (N3: la compuerta de deuda falla cerrado)', () => {
  const base = { purposeIsDebt: false };

  describe('correcto', () => {
    it('payment_debt con id es una deuda', () => {
      expect(
        mayChargeADebt({
          ...base,
          sourceRefType: DEBT_SOURCE_REF_TYPE,
          sourceRefId: 'x',
        }),
      ).toBe(true);
    });

    it('propósito DEBT es una deuda aunque no traiga referencia', () => {
      expect(mayChargeADebt({ purposeIsDebt: true })).toBe(true);
    });

    it('una intención sin propósito DEBT ni referencia de origen no es una deuda', () => {
      expect(mayChargeADebt(base)).toBe(false);
      expect(
        mayChargeADebt({ ...base, sourceRefType: null, sourceRefId: null }),
      ).toBe(false);
      expect(mayChargeADebt({ ...base, sourceRefType: '   ' })).toBe(false);
    });

    it('un tipo conocido como ajeno a las deudas (cursos) no es una deuda', () => {
      expect(
        mayChargeADebt({
          ...base,
          sourceRefType: COURSE_PAYMENT_SOURCE_REF,
          sourceRefId: 'curso',
        }),
      ).toBe(false);
    });
  });

  describe('límite: variantes de un texto libre', () => {
    it.each([
      'PAYMENT_DEBT',
      'Payment_Debt',
      'debt',
      'payment-debt',
      ' payment_debt',
      'payment_debt ',
      'otra_cosa',
    ])('el tipo desconocido %j con id PUEDE ser una deuda', (type) => {
      // La compuerta mide por `sourceRef` sólo el valor EXACTO `payment_debt`; toda
      // otra grafía (mayúsculas, espacios, otro texto) falla cerrado con 422.
      expect(
        mayChargeADebt({ ...base, sourceRefType: type, sourceRefId: 'x' }),
      ).toBe(true);
    });

    it('sólo sourceRefId (sin tipo) PUEDE ser una deuda', () => {
      expect(mayChargeADebt({ ...base, sourceRefId: 'x' })).toBe(true);
    });

    it('sólo el tipo (sin id) también: no se sabe qué cobra', () => {
      expect(mayChargeADebt({ ...base, sourceRefType: 'lo_que_sea' })).toBe(
        true,
      );
    });

    it('el tipo de cursos es sensible a mayúsculas: otra grafía no es el valor conocido', () => {
      expect(
        mayChargeADebt({
          ...base,
          sourceRefType: 'education_course',
          sourceRefId: 'curso',
        }),
      ).toBe(true);
    });
  });

  describe('contrato con el módulo de educación', () => {
    it('el tipo de cursos que escribe educación es uno de los reconocidos como ajenos', () => {
      expect(NON_DEBT_SOURCE_REF_TYPES).toContain(COURSE_PAYMENT_SOURCE_REF);
    });

    it('un tipo de deuda nunca figura entre los ajenos', () => {
      expect(NON_DEBT_SOURCE_REF_TYPES).not.toContain(DEBT_SOURCE_REF_TYPE);
    });
  });
});
