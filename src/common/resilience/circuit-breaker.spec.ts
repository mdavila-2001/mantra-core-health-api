import { jest } from '@jest/globals';
import { CircuitBreaker, type CircuitBreakerOptions } from './circuit-breaker';
import { CircuitOpenError } from './resilience.errors';

/** Reloj manual: el estado del circuito depende del tiempo y debe ser determinista. */
function clock() {
  let value = 0;
  return {
    now: () => value,
    advance: (ms: number) => {
      value += ms;
    },
  };
}

/** Fallo transitorio con forma de error de cliente HTTP. */
const TRANSIENT = Object.assign(new Error('HTTP 503'), {
  response: { status: 503 },
});

function build(overrides: Partial<CircuitBreakerOptions> = {}) {
  const time = clock();
  const breaker = new CircuitBreaker({
    operation: 'test-api',
    windowSize: 10,
    minimumThroughput: 4,
    failureRateThreshold: 0.5,
    openDurationMs: 1_000,
    maxOpenDurationMs: 8_000,
    now: time.now,
    ...overrides,
  });
  return { breaker, time };
}

async function failOnce(breaker: CircuitBreaker): Promise<void> {
  await breaker.execute(() => Promise.reject(TRANSIENT)).catch(() => undefined);
}

describe('CircuitBreaker', () => {
  it('deja pasar las llamadas mientras está cerrado', async () => {
    const { breaker } = build();
    await expect(breaker.execute(() => Promise.resolve('ok'))).resolves.toBe(
      'ok',
    );
    expect(breaker.snapshot().state).toBe('closed');
  });

  it('no abre por debajo del volumen mínimo, aunque falle todo', async () => {
    // Abrir con un solo fallo dejaría fuera de servicio a una dependencia sana
    // por un error puntual, que es el modo de fallo opuesto al que se quiere
    // evitar.
    const { breaker } = build();
    await failOnce(breaker);
    await failOnce(breaker);
    await failOnce(breaker);

    expect(breaker.snapshot().state).toBe('closed');
  });

  it('abre al superar el umbral con volumen suficiente', async () => {
    const { breaker } = build();
    for (let i = 0; i < 4; i += 1) await failOnce(breaker);

    expect(breaker.snapshot().state).toBe('open');
  });

  it('rechaza sin llamar mientras está abierto', async () => {
    const { breaker } = build();
    for (let i = 0; i < 4; i += 1) await failOnce(breaker);

    const fn = jest.fn(() => Promise.resolve('ok'));
    await expect(breaker.execute(fn)).rejects.toBeInstanceOf(CircuitOpenError);
    expect(fn).not.toHaveBeenCalled();
  });

  it('el rechazo dice cuándo volver a intentarlo', async () => {
    const { breaker, time } = build();
    for (let i = 0; i < 4; i += 1) await failOnce(breaker);
    time.advance(400);

    await expect(
      breaker.execute(() => Promise.resolve('x')),
    ).rejects.toMatchObject({ retryAfterMs: 600 });
  });

  it('pasa a media apertura al vencer el plazo y cierra si el sondeo va bien', async () => {
    const { breaker, time } = build();
    for (let i = 0; i < 4; i += 1) await failOnce(breaker);
    time.advance(1_000);

    expect(breaker.snapshot().state).toBe('half-open');
    await expect(breaker.execute(() => Promise.resolve('ok'))).resolves.toBe(
      'ok',
    );
    expect(breaker.snapshot().state).toBe('closed');
  });

  it('limpia la ventana al cerrar: los fallos viejos no vuelven a abrirlo', async () => {
    const { breaker, time } = build();
    for (let i = 0; i < 4; i += 1) await failOnce(breaker);
    time.advance(1_000);
    await breaker.execute(() => Promise.resolve('ok'));

    await failOnce(breaker);

    expect(breaker.snapshot().state).toBe('closed');
    expect(breaker.snapshot().samples).toBe(1);
  });

  it('deja pasar UN solo sondeo: al vencer el plazo no entra la avalancha', async () => {
    // Sin esta guarda, todas las llamadas represadas entrarían de golpe y
    // volverían a tumbar la dependencia que acababa de levantarse.
    const { breaker, time } = build();
    for (let i = 0; i < 4; i += 1) await failOnce(breaker);
    time.advance(1_000);

    let release: () => void = () => undefined;
    const probe = breaker.execute(
      () => new Promise<string>((resolve) => (release = () => resolve('ok'))),
    );

    await expect(
      breaker.execute(() => Promise.resolve('otra')),
    ).rejects.toBeInstanceOf(CircuitOpenError);

    release();
    await expect(probe).resolves.toBe('ok');
  });

  it('reabre con el plazo duplicado si el sondeo vuelve a fallar', async () => {
    const { breaker, time } = build();
    for (let i = 0; i < 4; i += 1) await failOnce(breaker);

    time.advance(1_000);
    await failOnce(breaker);
    expect(breaker.snapshot().retryAfterMs).toBe(2_000);

    time.advance(2_000);
    await failOnce(breaker);
    expect(breaker.snapshot().retryAfterMs).toBe(4_000);
  });

  it('el backoff de apertura tiene techo', async () => {
    const { breaker, time } = build();
    for (let i = 0; i < 4; i += 1) await failOnce(breaker);

    for (let round = 0; round < 6; round += 1) {
      time.advance(breaker.snapshot().retryAfterMs);
      await failOnce(breaker);
    }

    expect(breaker.snapshot().retryAfterMs).toBe(8_000);
  });

  it('un error de negocio no cuenta como fallo del circuito', async () => {
    // Un 404 o un 422 son respuestas correctas de una dependencia sana: abrir
    // el circuito por ellos dejaría fuera de servicio a algo que funciona.
    const { breaker } = build();
    const businessError = Object.assign(new Error('HTTP 422'), {
      response: { status: 422 },
    });

    for (let i = 0; i < 8; i += 1) {
      await breaker
        .execute(() => Promise.reject(businessError))
        .catch(() => undefined);
    }

    expect(breaker.snapshot().state).toBe('closed');
  });

  it('notifica cada transición de estado', async () => {
    const onStateChange = jest.fn();
    const { breaker, time } = build({ onStateChange });

    for (let i = 0; i < 4; i += 1) await failOnce(breaker);
    time.advance(1_000);
    await breaker.execute(() => Promise.resolve('ok'));

    expect(
      onStateChange.mock.calls.map(([change]) => (change as { to: string }).to),
    ).toEqual(['open', 'half-open', 'closed']);
  });

  it('reset devuelve el circuito a su estado inicial', async () => {
    const { breaker } = build();
    for (let i = 0; i < 4; i += 1) await failOnce(breaker);

    breaker.reset();

    expect(breaker.snapshot()).toMatchObject({
      state: 'closed',
      samples: 0,
      consecutiveOpenings: 0,
    });
  });
});
