import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { ProviderRateGate } from './provider-rate-gate';

/**
 * Reloj y espera controlados: una prueba de ritmo con temporizadores reales es
 * lenta y frágil.
 *
 * La espera simulada **no** adelanta el reloj, y eso es lo que permite modelar
 * varias peticiones concurrentes que salen en el mismo instante: es el escenario
 * en el que un limitador que reservara su hueco *después* de dormir dejaría
 * pasar a todas juntas. El avance del tiempo se pide de forma explícita con
 * `advance` cuando la prueba lo necesita.
 */
function clock(startAt = 0) {
  let now = startAt;
  const waits: number[] = [];
  return {
    now: () => now,
    sleep: mockFn(async (ms: number) => {
      waits.push(ms);
    }),
    advance: (ms: number) => {
      now += ms;
    },
    waits,
  };
}

describe('ProviderRateGate', () => {
  it('espacia las peticiones según la tasa configurada', () => {
    const c = clock();
    expect(new ProviderRateGate(2, 1, c.now, c.sleep).spacingMs).toBe(500);
    expect(new ProviderRateGate(10, 1, c.now, c.sleep).spacingMs).toBe(100);
  });

  it('divide la cuota entre las réplicas declaradas', () => {
    // Sin esta división, escalar a 4 réplicas cuadruplica en silencio la tasa real
    // contra un servicio de pago.
    const c = clock();
    expect(new ProviderRateGate(2, 4, c.now, c.sleep).spacingMs).toBe(2000);
  });

  it('no espera en la primera petición', async () => {
    const c = clock();
    const gate = new ProviderRateGate(2, 1, c.now, c.sleep);
    await gate.waitTurn();
    expect(c.sleep).not.toHaveBeenCalled();
  });

  it('reparte los turnos de peticiones concurrentes sin solaparlos', async () => {
    // La reserva del hueco se hace ANTES de esperar: si se actualizara al
    // despertar, las tres llamadas leerían el mismo instante, calcularían la misma
    // espera y saldrían juntas — que es justo lo que este objeto existe para
    // evitar. Con la reserva previa, cada una recibe su turno escalonado.
    const c = clock();
    const gate = new ProviderRateGate(2, 1, c.now, c.sleep);
    await Promise.all([gate.waitTurn(), gate.waitTurn(), gate.waitTurn()]);
    expect(c.waits).toEqual([500, 1000]);
  });

  it('no arrastra deuda si pasó más tiempo del intervalo', async () => {
    const c = clock();
    const gate = new ProviderRateGate(2, 1, c.now, c.sleep);
    await gate.waitTurn();
    c.advance(5000);
    await gate.waitTurn();
    expect(c.sleep).not.toHaveBeenCalled();
  });

  it('acota una tasa absurdamente baja en vez de dividir por cero', () => {
    const c = clock();
    expect(new ProviderRateGate(0, 1, c.now, c.sleep).spacingMs).toBe(
      1_000_000,
    );
  });
});
