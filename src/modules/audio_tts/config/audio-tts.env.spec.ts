import { PUBLISHED_DEV_DATA_KEY, loadAudioTtsConfig } from './audio-tts.env';

const VALID_KEY = 'x'.repeat(40);

/** Entorno mínimo que pasa todas las reglas cruzadas. */
function env(overrides: Record<string, string> = {}): NodeJS.ProcessEnv {
  return {
    NODE_ENV: 'development',
    AUDIO_TTS_DATA_KEY: VALID_KEY,
    ...overrides,
  };
}

describe('loadAudioTtsConfig', () => {
  it('parte de un estado que no gasta dinero', () => {
    const config = loadAudioTtsConfig(env());
    expect(config.enabled).toBe(false);
    expect(config.provider).toBe('disabled');
    expect(config.allowRuntimeGeneration).toBe(false);
    expect(config.prodLicenseConfirmed).toBe(false);
  });

  it('solo acepta true/1 como afirmativo', () => {
    // Un `AUDIO_TTS_ENABLED=yes` mal escrito debe dejar el interruptor apagado:
    // al otro lado hay una credencial de pago por uso.
    expect(loadAudioTtsConfig(env({ AUDIO_TTS_ENABLED: 'yes' })).enabled).toBe(
      false,
    );
    expect(loadAudioTtsConfig(env({ AUDIO_TTS_ENABLED: 'true' })).enabled).toBe(
      true,
    );
    expect(loadAudioTtsConfig(env({ AUDIO_TTS_ENABLED: '1' })).enabled).toBe(
      true,
    );
  });

  it('cae al valor por defecto cuando un número no es numérico', () => {
    // `Number(undefined)` es NaN, y un NaN propagado a un plazo significa "sin
    // plazo": el fallo más silencioso posible en una pieza que existe para acotar.
    expect(
      loadAudioTtsConfig(env({ AUDIO_TTS_REQUEST_TIMEOUT_MS: 'diez' }))
        .requestTimeoutMs,
    ).toBe(10_000);
  });

  it('rechaza la clave de datos publicada en el repositorio', () => {
    expect(() =>
      loadAudioTtsConfig(env({ AUDIO_TTS_DATA_KEY: PUBLISHED_DEV_DATA_KEY })),
    ).toThrow(/publicado en el repositorio/);
  });

  it('rechaza una clave de datos demasiado corta', () => {
    expect(() =>
      loadAudioTtsConfig(env({ AUDIO_TTS_DATA_KEY: 'corta' })),
    ).toThrow(/al menos 32 caracteres/);
  });

  it('no exige clave de datos en el entorno de pruebas', () => {
    expect(() =>
      loadAudioTtsConfig({ NODE_ENV: 'test', AUDIO_TTS_DATA_KEY: 'corta' }),
    ).not.toThrow();
  });

  it('prohíbe el proveedor de pruebas en producción', () => {
    expect(() =>
      loadAudioTtsConfig(
        env({
          NODE_ENV: 'production',
          AUDIO_TTS_PROVIDER: 'fake',
          AUDIO_STORAGE_DRIVER: 's3',
          AUDIO_S3_BUCKET: 'b',
        }),
      ),
    ).toThrow(/fake está prohibido en producción/);
  });

  it('bloquea el almacenamiento local en producción salvo override', () => {
    const production = {
      NODE_ENV: 'production',
      AUDIO_TTS_DATA_KEY: VALID_KEY,
    };
    expect(() => loadAudioTtsConfig(production)).toThrow(
      /AUDIO_STORAGE_DRIVER=local/,
    );
    expect(() =>
      loadAudioTtsConfig({
        ...production,
        AUDIO_ALLOW_LOCAL_STORAGE_IN_PROD: 'true',
      }),
    ).not.toThrow();
  });

  it('exige credencial y voz cuando ElevenLabs está activo', () => {
    expect(() =>
      loadAudioTtsConfig(
        env({ AUDIO_TTS_ENABLED: 'true', AUDIO_TTS_PROVIDER: 'elevenlabs' }),
      ),
    ).toThrow(/ELEVENLABS_API_KEY/);
  });

  it('exige bucket cuando el almacenamiento es s3', () => {
    expect(() =>
      loadAudioTtsConfig(env({ AUDIO_STORAGE_DRIVER: 's3' })),
    ).toThrow(/AUDIO_S3_BUCKET/);
  });

  it('exige que el lease supere el plazo de la llamada al proveedor', () => {
    // Si el lease expira antes de que la llamada termine, un segundo worker
    // reclama el mismo asset y el audio se paga dos veces.
    expect(() =>
      loadAudioTtsConfig(
        env({
          AUDIO_GENERATION_LEASE_SECONDS: '30',
          AUDIO_TTS_REQUEST_TIMEOUT_MS: '60000',
        }),
      ),
    ).toThrow(/debe superar/);
  });

  it('exige que el lote quepa en la capacidad del mamparo', () => {
    expect(() =>
      loadAudioTtsConfig(
        env({
          AUDIO_GENERATION_BATCH_SIZE: '20',
          AUDIO_TTS_MAX_CONCURRENCY: '1',
          AUDIO_TTS_BULKHEAD_QUEUE_SIZE: '0',
        }),
      ),
    ).toThrow(/supera la capacidad del mamparo/);
  });

  it('rechaza un colchón mayor que el presupuesto', () => {
    expect(() =>
      loadAudioTtsConfig(
        env({
          AUDIO_TTS_MONTHLY_BUDGET_UNITS: '100',
          AUDIO_TTS_SAFETY_RESERVE_UNITS: '200',
        }),
      ),
    ).toThrow(/no puede superar/);
  });

  it('acumula todos los problemas en un solo mensaje', () => {
    // Reportarlos de uno en uno obliga a arrancar N veces para descubrir N errores.
    let message = '';
    try {
      loadAudioTtsConfig(
        env({ AUDIO_TTS_DATA_KEY: 'corta', AUDIO_STORAGE_DRIVER: 's3' }),
      );
    } catch (error) {
      message = (error as Error).message;
    }
    expect(message).toMatch(/AUDIO_TTS_DATA_KEY/);
    expect(message).toMatch(/AUDIO_S3_BUCKET/);
  });
});
