import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import {
  Bulkhead,
  CircuitBreaker,
  retry,
  type RetryPolicy,
} from '../../../common';
import {
  AUDIO_TTS_CONFIG,
  TtsProviderError,
  type TtsProviderHealth,
  type TtsProviderPort,
  type TtsSynthesisInput,
  type TtsSynthesisResult,
} from '../../../modules/audio_tts/domain';
import type { AudioTtsConfig } from '../../../modules/audio_tts/config/audio-tts.env';
import { workerHealth } from '../../worker-health.registry';
import { ElevenLabsHttpClient } from './elevenlabs-http.client';
import { ProviderRateGate } from './provider-rate-gate';

/**
 * Adaptador de ElevenLabs con el kernel de resiliencia del backend.
 *
 * Usa `Bulkhead`, `CircuitBreaker` y `retry` de `common/resilience` en vez de
 * implementaciones propias, que es lo que hacía la versión desacoplada del worker
 * (tenía las tres duplicadas). No es solo menos código: son las mismas primitivas
 * que protegen a los otros 20 workers, con reloj y aleatoriedad inyectables, y su
 * estado se publica en la **misma** sonda `/status` del proceso, así que un
 * circuito abierto contra el proveedor se diagnostica igual que uno contra la API.
 *
 * Orden de las capas, de fuera hacia dentro —y no es intercambiable:
 *
 * ```
 *   Bulkhead        ¿cabe otra petición en vuelo?   → rechaza si no
 *     └─ Circuito   ¿el proveedor está caído?       → rechaza sin llamar
 *         └─ retry  ¿el fallo se cura solo?         → reintenta con jitter
 *             └─ ritmo + llamada real
 * ```
 *
 * El circuito va **por fuera** del reintento para que, estando abierto, corte la
 * escalera entera en vez de consumir tres rechazos; el espaciador va por dentro
 * para que se aplique a cada intento.
 *
 * Una diferencia respecto al circuito de la versión desacoplada, que conviene
 * tener presente: el kernel decide por **proporción de fallos en una ventana**
 * (`minimumThroughput` muestras y más de la mitad fallidas), no por N fallos
 * consecutivos. `AUDIO_TTS_CB_FAILURE_THRESHOLD` se mapea al tamaño mínimo de esa
 * ventana. En la práctica es más difícil de abrir por casualidad y más difícil de
 * mantener cerrado cuando el proveedor va mal de verdad.
 */
@Injectable()
export class ElevenLabsTtsAdapter implements TtsProviderPort, OnModuleInit {
  readonly providerName = 'elevenlabs';

  private readonly rateGate: ProviderRateGate;
  private readonly bulkhead: Bulkhead;
  private readonly circuit: CircuitBreaker;
  private readonly retryPolicy: RetryPolicy;

  constructor(
    @Inject(AUDIO_TTS_CONFIG) private readonly config: AudioTtsConfig,
    private readonly http: ElevenLabsHttpClient,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ElevenLabsTtsAdapter.name);

    this.rateGate = new ProviderRateGate(
      config.maxRequestsPerSecond,
      config.replicaCount,
    );

    this.bulkhead = new Bulkhead({
      operation: 'elevenlabs',
      maxConcurrent: config.maxConcurrency,
      maxQueued: config.bulkheadQueueSize,
    });

    this.circuit = new CircuitBreaker({
      operation: 'elevenlabs',
      minimumThroughput: config.circuitFailureThreshold,
      openDurationMs: config.circuitOpenMs,
      // Solo los fallos transitorios abren el circuito. Un 401 es un error de
      // configuración de este lado: abrir por él dejaría fuera de servicio a un
      // proveedor que está perfectamente sano.
      isFailure: (error) =>
        !(error instanceof TtsProviderError) || error.retryable,
      onStateChange: (change) => {
        this.logger.warn(
          {
            operation: change.operation,
            from: change.from,
            to: change.to,
            failureRate: change.failureRate,
            openForMs: change.openForMs,
          },
          `Cortacircuitos de ElevenLabs: ${change.from} → ${change.to}`,
        );
      },
    });

    this.retryPolicy = {
      attempts: config.httpMaxRetries + 1,
      baseDelayMs: config.retryBaseMs,
      maxDelayMs: 5000,
      // El presupuesto total acota la latencia, no solo el número de intentos: sin
      // él, tres intentos con su plazo completo mantendrían ocupado un hueco del
      // mamparo mucho más de lo que el lease del asset aguanta.
      totalBudgetMs: config.requestTimeoutMs * (config.httpMaxRetries + 1),
      isRetryable: (error) =>
        error instanceof TtsProviderError && error.retryable,
      onRetry: (info) => {
        this.logger.warn(
          {
            operation: info.operation,
            attempt: info.attempt,
            delayMs: info.delayMs,
            serverDirected: info.serverDirected,
            err: info.error,
          },
          'Reintentando la llamada a ElevenLabs',
        );
      },
    };
  }

  /** Publica el estado del circuito y del mamparo en la sonda del proceso. */
  onModuleInit(): void {
    workerHealth.registerCircuit('elevenlabs', () => this.circuit.snapshot());
  }

  async synthesize(input: TtsSynthesisInput): Promise<TtsSynthesisResult> {
    const startedAt = Date.now();

    const response = await this.bulkhead.execute(() =>
      this.circuit.execute(() =>
        retry(
          'elevenlabs.synthesize',
          async () => {
            await this.rateGate.waitTurn();
            return this.http.synthesize(input);
          },
          this.retryPolicy,
        ),
      ),
    );

    return {
      audio: response.audio,
      mimeType: response.mimeType,
      provider: this.providerName,
      model: input.model,
      requestId: response.requestId,
      // Si el proveedor no declara el coste, se estima por puntos de código del
      // texto —la unidad con la que factura—. `usageIsReported` conserva la
      // diferencia: una contabilidad que no sabe si está estimando no sirve para
      // conciliar contra una factura.
      usageUnits: response.reportedUnits ?? [...input.text].length,
      usageIsReported: response.reportedUnits !== undefined,
      durationMs: Date.now() - startedAt,
    };
  }

  async health(): Promise<TtsProviderHealth> {
    return {
      provider: this.providerName,
      configured: Boolean(
        this.config.elevenLabsApiKey && this.config.elevenLabsVoiceId,
      ),
    };
  }

  /** Ocupación del mamparo, para el diagnóstico del proceso. */
  snapshot(): { bulkhead: ReturnType<Bulkhead['snapshot']> } {
    return { bulkhead: this.bulkhead.snapshot() };
  }
}
