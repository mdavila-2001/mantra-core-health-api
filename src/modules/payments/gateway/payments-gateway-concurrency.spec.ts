import {
  DEFAULT_DB_POOL_MAX,
  DispatchSlots,
  dispatchConcurrencyLimit,
  readPoolMax,
} from './payments-gateway-concurrency';

describe('dispatchConcurrencyLimit: estrictamente menos de la mitad del pool', () => {
  it.each([
    [10, 4],
    [4, 1],
    [20, 9],
    [9, 4],
    [3, 1],
    [2, 1],
    [1, 1],
  ])('pool %i => %i despachos simultáneos', (pool, limit) => {
    expect(dispatchConcurrencyLimit(pool)).toBe(limit);
  });

  it('límite: cada despacho necesita 2 conexiones y siempre sobra al menos una libre (pools de 3 o más)', () => {
    for (let pool = 3; pool <= 200; pool += 1) {
      expect(dispatchConcurrencyLimit(pool) * 2).toBeLessThan(pool);
    }
  });

  it.each([NaN, 0, -3, Infinity])(
    'inválido: %p cae al pool por defecto',
    (value) => {
      expect(dispatchConcurrencyLimit(value)).toBe(
        dispatchConcurrencyLimit(DEFAULT_DB_POOL_MAX),
      );
    },
  );
});

describe('readPoolMax', () => {
  it('lee DB_POOL_MAX, o el valor por defecto si falta o no es un número', () => {
    expect(readPoolMax({ DB_POOL_MAX: '25' })).toBe(25);
    expect(readPoolMax({})).toBe(DEFAULT_DB_POOL_MAX);
    expect(readPoolMax({ DB_POOL_MAX: '' })).toBe(DEFAULT_DB_POOL_MAX);
    expect(readPoolMax({ DB_POOL_MAX: 'abc' })).toBe(DEFAULT_DB_POOL_MAX);
  });
});

describe('DispatchSlots: semáforo sin cola', () => {
  it('correcto: entrega hasta el límite y libera', () => {
    const slots = new DispatchSlots(2);
    const a = slots.tryAcquire();
    const b = slots.tryAcquire();
    expect(a).toBeDefined();
    expect(b).toBeDefined();
    expect(slots.busy).toBe(2);
    a?.();
    expect(slots.busy).toBe(1);
  });

  it('límite: sin cupo devuelve undefined AL INSTANTE (no espera) y no cuenta', () => {
    const slots = new DispatchSlots(1);
    slots.tryAcquire();
    expect(slots.tryAcquire()).toBeUndefined();
    expect(slots.busy).toBe(1);
  });

  it('límite: liberar dos veces la misma toma no libera el cupo de otro', () => {
    const slots = new DispatchSlots(2);
    const a = slots.tryAcquire() as () => void;
    slots.tryAcquire();
    a();
    a();
    expect(slots.busy).toBe(1);
  });

  it('inválido: tras liberar, el cupo se puede volver a tomar', () => {
    const slots = new DispatchSlots(1);
    const release = slots.tryAcquire() as () => void;
    release();
    expect(slots.tryAcquire()).toBeDefined();
  });
});
