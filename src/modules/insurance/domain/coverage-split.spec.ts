import {
  CoverageSplitError,
  splitCoveredAmount,
  type CoverageTerms,
} from './coverage-split';

/**
 * Reparto paciente/aseguradora (carril 16, REQ-16-025 y puerta P0 REQ-16-035).
 * Los ejemplos son los que aprobó el propietario el 2026-10-23; el bloque de
 * propiedades recorre miles de combinaciones con una semilla fija.
 */
describe('splitCoveredAmount', () => {
  const terms = (
    coveragePercent: string | null,
    copayAmount: string | null,
  ): CoverageTerms => ({ coveragePercent, copayAmount });

  describe('ejemplos aprobados por el propietario', () => {
    it.each([
      // monto, % cobertura, copago → paciente, aseguradora
      ['500.00', '80', '50.00', '140.00', '360.00'],
      ['500', '80', '50', '140.00', '360.00'],
      ['200.00', '100', null, '0.00', '200.00'],
      ['200.00', '100', '30.00', '30.00', '170.00'],
      ['200.00', '0', null, '200.00', '0.00'],
      ['200.00', '70', null, '60.00', '140.00'],
      ['40.00', '80', '50.00', '40.00', '0.00'],
      ['50.00', '80', '50.00', '50.00', '0.00'],
      ['0.00', '80', '10.00', '0.00', '0.00'],
      ['120.00', null, '25.00', '25.00', '95.00'],
    ])(
      '%s con %s%% y copago %s → paciente %s, aseguradora %s',
      (billed, percent, copay, patient, insurer) => {
        expect(splitCoveredAmount(billed, terms(percent, copay))).toEqual({
          patientAmount: patient,
          insurerAmount: insurer,
        });
      },
    );
  });

  describe('redondeo a favor del paciente', () => {
    it('trunca la parte del paciente y el centavo va a la aseguradora', () => {
      // 33.33 × 15 % = 4.9995 → el paciente paga 4.99, no 5.00.
      expect(splitCoveredAmount('33.33', terms('85', null))).toEqual({
        patientAmount: '4.99',
        insurerAmount: '28.34',
      });
    });

    it('con copago y porcentaje con decimales', () => {
      // 10 + (99.99 − 10) × 12.5 / 100 = 10 + 11.24875 = 21.24875 → 21.24
      expect(splitCoveredAmount('99.99', terms('87.5', '10.00'))).toEqual({
        patientAmount: '21.24',
        insurerAmount: '78.75',
      });
    });
  });

  describe('datos inválidos se rechazan, no se adivinan', () => {
    it.each([
      [
        'sin porcentaje ni copago',
        '100.00',
        terms(null, null),
        'BENEFIT_WITHOUT_TERMS',
      ],
      ['monto negativo', '-1.00', terms('80', null), 'INVALID_AMOUNT'],
      [
        'monto con tres decimales',
        '10.005',
        terms('80', null),
        'INVALID_AMOUNT',
      ],
      ['monto no numérico', 'abc', terms('80', null), 'INVALID_AMOUNT'],
      ['copago negativo', '100.00', terms('80', '-5'), 'INVALID_COPAY'],
      [
        'porcentaje mayor a 100',
        '100.00',
        terms('100.01', null),
        'INVALID_COVERAGE_PERCENT',
      ],
      [
        'porcentaje negativo',
        '100.00',
        terms('-1', null),
        'INVALID_COVERAGE_PERCENT',
      ],
      [
        'porcentaje con cinco decimales',
        '100.00',
        terms('10.00001', null),
        'INVALID_COVERAGE_PERCENT',
      ],
    ])('%s', (_case, billed, coverage, failure) => {
      expect(() => splitCoveredAmount(billed, coverage)).toThrow(
        CoverageSplitError,
      );
      try {
        splitCoveredAmount(billed, coverage);
      } catch (error) {
        expect((error as CoverageSplitError).failure).toBe(failure);
      }
    });
  });

  describe('propiedades sobre 20 000 combinaciones (semilla fija)', () => {
    /** LCG de 32 bits: determinista, así un fallo se reproduce siempre igual. */
    function generator(seed: number) {
      let state = seed >>> 0;
      return (max: number) => {
        state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
        return state % max;
      };
    }

    /**
     * Referencia independiente: trabaja en milésimas de centavo con fracciones
     * exactas en lugar de la escala 10⁻⁴ del código bajo prueba, y trunca al
     * final. Si las dos coinciden en 20 000 casos, el cálculo no depende de un
     * detalle de implementación.
     */
    function reference(billed: bigint, copay: bigint, percentBp: bigint) {
      // billed y copay en centavos; percentBp en puntos básicos de 1/100 (0–10000).
      if (copay >= billed) return { patient: billed, insurer: 0n };
      const numerator =
        copay * 10000n + (billed - copay) * (10000n - percentBp);
      const patient = numerator / 10000n;
      return { patient, insurer: billed - patient };
    }

    const cents = (value: bigint) =>
      `${value / 100n}.${(value % 100n).toString().padStart(2, '0')}`;

    it('paciente + aseguradora = monto, nadie queda negativo y coincide con la referencia', () => {
      const next = generator(20261023);
      for (let i = 0; i < 20000; i += 1) {
        const billed = BigInt(next(10_000_000)); // hasta 100 000.00
        const copay = BigInt(next(4) === 0 ? 0 : next(200_000)); // hasta 2 000.00
        const percentBp = BigInt(next(10001)); // 0.00 % – 100.00 %
        const percentText = `${percentBp / 100n}.${(percentBp % 100n)
          .toString()
          .padStart(2, '0')}`;

        const split = splitCoveredAmount(
          cents(billed),
          terms(percentText, cents(copay)),
        );
        const patient = BigInt(split.patientAmount.replace('.', ''));
        const insurer = BigInt(split.insurerAmount.replace('.', ''));
        const expected = reference(billed, copay, percentBp);

        expect({ i, patient, insurer }).toEqual({
          i,
          patient: expected.patient,
          insurer: expected.insurer,
        });
        expect(patient + insurer).toBe(billed);
        expect(patient >= 0n && insurer >= 0n).toBe(true);
        expect(patient <= billed).toBe(true);
      }
    });
  });
});
