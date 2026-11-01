import {
  HTTP_BOUNDS_MS,
  estimatePercentile,
  percentileValue,
} from './latency-histogram';

describe('estimatePercentile', () => {
  it('sin muestras es null, no 0', () => {
    expect(
      estimatePercentile(
        HTTP_BOUNDS_MS,
        HTTP_BOUNDS_MS.map(() => 0),
        0,
        0.95,
      ),
    ).toBeNull();
    expect(
      percentileValue(
        HTTP_BOUNDS_MS,
        HTTP_BOUNDS_MS.map(() => 0),
        0,
        0.95,
      ),
    ).toEqual({
      value: null,
      reason: 'SIN_MUESTRAS',
    });
  });

  it('interpola dentro del corte', () => {
    // 100 muestras, todas ≤ 10 ms; 50 ≤ 5 ms. p50 = 5 ms, p75 = 7,5 ms.
    const cum = [50, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100];
    expect(estimatePercentile(HTTP_BOUNDS_MS, cum, 100, 0.5)?.ms).toBe(5);
    expect(estimatePercentile(HTTP_BOUNDS_MS, cum, 100, 0.75)?.ms).toBe(7.5);
  });

  it('nunca supera el máximo observado', () => {
    const cum = [0, 0, 0, 0, 10, 10, 10, 10, 10, 10, 10];
    expect(estimatePercentile(HTTP_BOUNDS_MS, cum, 10, 0.99, 60)?.ms).toBe(60);
  });

  it('si el percentil cae en la cola > 10 s, devuelve la cota inferior marcada', () => {
    const cum = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
    const est = estimatePercentile(HTTP_BOUNDS_MS, cum, 10, 0.95, 30000);
    expect(est).toEqual({ ms: 10000, lowerBound: true });
    expect(percentileValue(HTTP_BOUNDS_MS, cum, 10, 0.95, 30000)).toEqual({
      value: 10000,
      atLeast: true,
    });
  });
});
