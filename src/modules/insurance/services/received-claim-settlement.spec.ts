import {
  fromCents,
  splitApproval,
  toCents,
  type SettlementInputLine,
} from './received-claim-settlement';

const lineas = (...importes: Array<string | null>): SettlementInputLine[] =>
  importes.map((billedAmount, i) => ({ id: `l${i + 1}`, billedAmount }));

describe('toCents / fromCents', () => {
  it.each([
    ['0', 0n],
    ['1', 100n],
    ['1.5', 150n],
    ['0.05', 5n],
    ['400.25', 40025n],
    ['400.2500', 40025n],
    ['12345678901234.56', 1234567890123456n],
  ])('%s son %s centavos', (texto, centavos) => {
    expect(toCents(texto)).toBe(centavos);
  });

  it.each([
    [0n, '0.00'],
    [5n, '0.05'],
    [100n, '1.00'],
    [40025n, '400.25'],
  ])('%s centavos se escriben %s', (centavos, texto) => {
    expect(fromCents(centavos)).toBe(texto);
  });

  it('ida y vuelta conserva el importe a dos decimales', () => {
    for (const texto of ['0.00', '0.01', '9.99', '1000.10', '250.00']) {
      expect(fromCents(toCents(texto))).toBe(texto);
    }
  });

  it.each(['', 'abc', '-1', '1,5', '1.2.3', '.5', '5.', '1e3', '+1'])(
    'rechaza %j: no es un decimal no negativo',
    (texto) => {
      expect(() => toCents(texto)).toThrow(RangeError);
    },
  );

  it('rechaza una fracción de centavo con valor, pero no ceros de más', () => {
    expect(() => toCents('1.234')).toThrow(RangeError);
    expect(() => toCents('1.2301')).toThrow(RangeError);
    expect(toCents('1.2300')).toBe(123n);
  });
});

describe('splitApproval', () => {
  describe('correcto', () => {
    it('aprobar todo deja cada línea aprobada entera y nada denegado', () => {
      const r = splitApproval(lineas('60.00', '40.00'), toCents('100.00'));

      expect(r).toEqual([
        {
          id: 'l1',
          billedAmount: '60.00',
          approvedAmount: '60.00',
          deniedAmount: '0.00',
        },
        {
          id: 'l2',
          billedAmount: '40.00',
          approvedAmount: '40.00',
          deniedAmount: '0.00',
        },
      ]);
    });

    it('aprobar cero deja cada línea denegada entera', () => {
      const r = splitApproval(lineas('60.00', '40.00'), 0n);

      expect(r.map((l) => l.approvedAmount)).toEqual(['0.00', '0.00']);
      expect(r.map((l) => l.deniedAmount)).toEqual(['60.00', '40.00']);
    });

    it('reparte en proporción a lo facturado', () => {
      const r = splitApproval(lineas('60.00', '40.00'), toCents('50.00'));

      expect(r.map((l) => l.approvedAmount)).toEqual(['30.00', '20.00']);
      expect(r.map((l) => l.deniedAmount)).toEqual(['30.00', '20.00']);
    });

    it('una sola línea aprueba exactamente el monto', () => {
      const [l] = splitApproval(lineas('400.25'), toCents('200.10'));

      expect(l.approvedAmount).toBe('200.10');
      expect(l.deniedAmount).toBe('200.15');
    });
  });

  describe('límite', () => {
    it('los centavos que sobran van a la línea de mayor importe', () => {
      // 0,01 repartido entre tres líneas: los tres pisos dan cero.
      const r = splitApproval(lineas('33.33', '33.33', '33.34'), 1n);

      expect(r.map((l) => l.approvedAmount)).toEqual(['0.00', '0.00', '0.01']);
    });

    it('a igualdad de importe, el centavo sobrante va a la primera', () => {
      const r = splitApproval(lineas('10.00', '10.00', '10.00'), 1n);

      expect(r.map((l) => l.approvedAmount)).toEqual(['0.01', '0.00', '0.00']);
    });

    it('aprobar un centavo menos que el total: la suma es exacta y se deniega un solo centavo', () => {
      const r = splitApproval(lineas('33.33', '33.33', '33.34'), 9999n);

      expect(r.reduce((s, l) => s + toCents(l.approvedAmount), 0n)).toBe(9999n);
      // Pisos 33,32 / 33,32 / 33,33; los dos centavos que sobran van a la mayor y
      // luego a la primera, así que el que queda sin aprobar es el de la segunda.
      expect(r.map((l) => l.approvedAmount)).toEqual([
        '33.33',
        '33.32',
        '33.34',
      ]);
      expect(r.map((l) => l.deniedAmount)).toEqual(['0.00', '0.01', '0.00']);
    });

    it('una línea sin importe cuenta cero y aprueba cero', () => {
      const r = splitApproval(lineas(null, '50.00'), toCents('20.00'));

      expect(r[0]).toMatchObject({
        billedAmount: '0.00',
        approvedAmount: '0.00',
      });
      expect(r[1].approvedAmount).toBe('20.00');
    });

    it('sin líneas no hay nada que repartir: vacío si no se aprueba nada', () => {
      expect(splitApproval([], 0n)).toEqual([]);
    });

    it('normaliza los importes de la base a dos decimales', () => {
      const [l] = splitApproval(lineas('400.2500'), toCents('400.25'));

      expect(l.billedAmount).toBe('400.25');
    });
  });

  describe('inválido', () => {
    it('rechaza un monto negativo', () => {
      expect(() => splitApproval(lineas('10.00'), -1n)).toThrow(RangeError);
    });

    it('rechaza aprobar más de lo facturado', () => {
      expect(() => splitApproval(lineas('10.00', '5.00'), 1501n)).toThrow(
        RangeError,
      );
    });

    it('rechaza aprobar algo cuando las líneas no suman nada', () => {
      expect(() => splitApproval(lineas(null, '0.00'), 1n)).toThrow(RangeError);
      expect(() => splitApproval([], 1n)).toThrow(RangeError);
    });

    it('rechaza una línea con un importe que no es decimal', () => {
      expect(() => splitApproval(lineas('abc'), 0n)).toThrow(RangeError);
    });
  });

  describe('invariantes sobre muchos casos', () => {
    /** Generador congruencial: los mismos casos en cada corrida. */
    function azar(semilla: number): () => number {
      let estado = semilla >>> 0;
      return () => {
        estado = (Math.imul(estado, 1_664_525) + 1_013_904_223) >>> 0;
        return estado / 0x1_0000_0000;
      };
    }

    it('la suma es exactamente lo aprobado y ninguna línea aprueba más de lo que facturó', () => {
      const r = azar(20_261_001);
      for (let caso = 0; caso < 300; caso++) {
        const cantidad = 1 + Math.floor(r() * 6);
        const importes = Array.from({ length: cantidad }, () =>
          r() < 0.1 ? null : fromCents(BigInt(Math.floor(r() * 500_000))),
        );
        const facturado = importes.reduce<bigint>(
          (s, i) => s + (i === null ? 0n : toCents(i)),
          0n,
        );
        const aprobado =
          facturado === 0n
            ? 0n
            : BigInt(Math.floor(r() * Number(facturado + 1n)));

        const resultado = splitApproval(lineas(...importes), aprobado);

        expect(resultado).toHaveLength(cantidad);
        let suma = 0n;
        for (const linea of resultado) {
          const a = toCents(linea.approvedAmount);
          const d = toCents(linea.deniedAmount);
          const f = toCents(linea.billedAmount);
          expect(a + d).toBe(f);
          expect(a).toBeLessThanOrEqual(f);
          suma += a;
        }
        expect(suma).toBe(aprobado);
      }
    });
  });
});
