import {
  CLASS_OF_KIND,
  CODE_PREFIX,
  GENERAL_ACCOUNTS,
  accountNameProblem,
  amountProblem,
  dateProblem,
  descriptionProblem,
  fromIsoDay,
  isUuid,
  normalizeAmount,
  summaryRange,
  toIsoDay,
  withoutAccents,
} from './practitioner-simple-accounting.rules';

describe('contabilidad simple del doctor · reglas puras (P49)', () => {
  describe('cuentas generales', () => {
    it('son 26, con código único y prefijo de su clase', () => {
      expect(GENERAL_ACCOUNTS).toHaveLength(26);
      const codes = GENERAL_ACCOUNTS.map(([code]) => code);
      expect(new Set(codes).size).toBe(26);
      for (const [code, , accountClass] of GENERAL_ACCOUNTS) {
        expect(code.startsWith(`${CODE_PREFIX[accountClass]}.`)).toBe(true);
      }
    });

    it('no repiten nombre dentro de una clase', () => {
      const keys = GENERAL_ACCOUNTS.map(
        ([, name, accountClass]) => `${accountClass}:${withoutAccents(name)}`,
      );
      expect(new Set(keys).size).toBe(keys.length);
    });

    it('deuda → LIABILITY, gasto → EXPENSE, activo → ASSET', () => {
      expect(CLASS_OF_KIND).toEqual({
        EXPENSE: 'EXPENSE',
        ASSET: 'ASSET',
        DEBT: 'LIABILITY',
      });
    });
  });

  describe('validación con motivo en castellano', () => {
    it('nombre: vacío o de más de 80 caracteres', () => {
      expect(accountNameProblem(undefined)).toBe(
        'Escriba un nombre de hasta 80 caracteres.',
      );
      expect(accountNameProblem('   ')).not.toBeNull();
      expect(accountNameProblem('x'.repeat(81))).not.toBeNull();
      expect(accountNameProblem('x'.repeat(80))).toBeNull();
    });

    it('descripción: vacía o de más de 160 caracteres', () => {
      expect(descriptionProblem('')).toBe(
        'Escriba una descripción de hasta 160 caracteres.',
      );
      expect(descriptionProblem('x'.repeat(161))).not.toBeNull();
      expect(descriptionProblem('Alquiler')).toBeNull();
    });

    it('importe: hasta dos decimales y mayor a cero', () => {
      expect(amountProblem(undefined)).toBe(
        'Escriba un monto, con hasta dos decimales.',
      );
      expect(amountProblem('12,5')).not.toBeNull();
      expect(amountProblem('1.234')).not.toBeNull();
      expect(amountProblem('-3')).not.toBeNull();
      expect(amountProblem('0')).toBe('El monto tiene que ser mayor a cero.');
      expect(amountProblem('0.00')).toBe(
        'El monto tiene que ser mayor a cero.',
      );
      expect(amountProblem('1250.5')).toBeNull();
      expect(amountProblem('999999999999.99')).toBeNull();
      expect(normalizeAmount('1250.5')).toBe('1250.50');
    });

    it('fecha: YYYY-MM-DD y que exista en el calendario', () => {
      expect(dateProblem(undefined)).toBe('Elija la fecha.');
      expect(dateProblem('2026-9-1')).toBe('Elija la fecha.');
      expect(dateProblem('2026-02-30')).toBe('Elija la fecha.');
      expect(dateProblem('2026-13-01')).toBe('Elija la fecha.');
      expect(dateProblem('2026-02-28')).toBeNull();
    });

    it('uuid: sólo la forma que Postgres acepta', () => {
      expect(isUuid('7d6f3c1e-8a4b-4c2d-9e1f-0a1b2c3d4e5f')).toBe(true);
      expect(isUuid('no-es-uuid')).toBe(false);
      expect(isUuid(undefined)).toBe(false);
    });
  });

  describe('comparación de nombres', () => {
    it('ignora tildes, mayúsculas y espacios sobrantes', () => {
      expect(withoutAccents('  Préstamo BANCARIO ')).toBe('prestamo bancario');
      expect(withoutAccents('Teléfono')).toBe(withoutAccents('telefono'));
    });
  });

  describe('fechas', () => {
    it('toIsoDay acepta Date y texto; fromIsoDay vuelve a medianoche UTC', () => {
      expect(toIsoDay(new Date('2026-09-05T00:00:00.000Z'))).toBe('2026-09-05');
      expect(toIsoDay('2026-09-05')).toBe('2026-09-05');
      expect(fromIsoDay('2026-09-05').toISOString()).toBe(
        '2026-09-05T00:00:00.000Z',
      );
    });
  });

  describe('summaryRange', () => {
    it('por omisión es el mes calendario', () => {
      const range = summaryRange(undefined, new Date('2026-02-15T12:00:00Z'));
      expect(range.period).toBe('month');
      expect(range.from).toBe('2026-02-01');
      expect(range.to).toBe('2026-02-28');
    });

    it('year va de enero a diciembre', () => {
      const range = summaryRange('year', new Date('2026-06-15T12:00:00Z'));
      expect(range.period).toBe('year');
      expect(range.from).toBe('2026-01-01');
      expect(range.to).toBe('2026-12-31');
    });

    it('el mes se mide en hora de La Paz (−04:00)', () => {
      // 02:00 UTC del 1 de octubre son las 22:00 del 30 de septiembre en La Paz.
      const range = summaryRange('month', new Date('2026-10-01T02:00:00Z'));
      expect(range.from).toBe('2026-09-01');
      expect(range.to).toBe('2026-09-30');
      expect(range.fromInstant.toISOString()).toBe('2026-09-01T04:00:00.000Z');
      expect(range.toInstant.toISOString()).toBe('2026-10-01T03:59:59.999Z');
    });

    it('febrero bisiesto termina el 29', () => {
      const range = summaryRange('month', new Date('2028-02-10T12:00:00Z'));
      expect(range.to).toBe('2028-02-29');
    });
  });
});
