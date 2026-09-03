import { mismosDecimales, sumarDecimales } from './decimal-money';

describe('sumarDecimales', () => {
  it('devuelve null con la lista vacía, y no cero', () => {
    // «Todavía no hay dictamen» y «el dictamen aprobó cero» son cosas
    // distintas. Si esto devolviera '0.00', la pantalla no podría
    // distinguirlas.
    expect(sumarDecimales([])).toBeNull();
    expect(sumarDecimales([null, undefined, ''])).toBeNull();
  });

  it('conserva los decimales de la entrada más precisa', () => {
    expect(sumarDecimales(['1200.00', '75.125', '340.00'])).toBe('1615.125');
  });

  it('no arrastra el ruido de coma flotante', () => {
    // Con `Number`, sumar 0.1 diez veces da 0.9999999999999999.
    expect(sumarDecimales(Array.from({ length: 10 }, () => '0.1'))).toBe('1.0');
  });

  it('suma importes que no caben en un doble sin perder centavos', () => {
    // 2^53 centavos son ~90 billones: `Math.round(n * 100)` empieza a
    // redondear antes de eso, y acá no.
    expect(sumarDecimales(['90071992547409.91', '0.01'])).toBe(
      '90071992547409.92',
    );
  });

  it('admite negativos, que es lo que tiene una reversa', () => {
    expect(sumarDecimales(['100.00', '-40.50'])).toBe('59.50');
  });

  it('ignora los nulos en vez de contarlos como cero', () => {
    expect(sumarDecimales(['10.00', null, '5.00'])).toBe('15.00');
  });

  it('rechaza lo que no es un decimal', () => {
    expect(() => sumarDecimales(['1.0', 'mil'])).toThrow(RangeError);
  });
});

describe('mismosDecimales', () => {
  it('compara por valor y no por texto', () => {
    // La escala distinta no es un descuadre: marcarlo sería un falso positivo
    // en la pantalla del reclamo.
    expect(mismosDecimales('1250.0', '1250.00')).toBe(true);
  });

  it('detecta la diferencia de un céntimo', () => {
    expect(mismosDecimales('1250.00', '1250.01')).toBe(false);
  });

  it('trata dos ausencias como iguales, y una sola como distinta', () => {
    expect(mismosDecimales(null, null)).toBe(true);
    expect(mismosDecimales('0.00', null)).toBe(false);
  });
});
