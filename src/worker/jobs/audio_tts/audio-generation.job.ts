import { Inject, Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { randomUUID } from 'node:crypto';
import { PinoLogger } from 'nestjs-pino';
import {
  AUDIO_STORAGE,
  AUDIO_TTS_CONFIG,
  AUDIO_TTS_PROVIDER,
  audioErrorCodeOf,
  isRetryableAudioError,
  type AudioGenerationJob as AudioJob,
  type AudioStoragePort,
  type TtsProviderPort,
} from '../../../modules/audio_tts/domain';
import type { AudioTtsConfig } from '../../../modules/audio_tts/config/audio-tts.env';
import { SystemApiClient } from '../../system-api-client.service';
import { runTick } from '../../run-tick.util';
import { AUDIO_GENERATION_INTERVAL_MS } from './audio-tts.intervals';

/** Refleja `ClaimAudioJobsResponseDto`. */
interface ClaimResponse {
  jobs: AudioJob[];
  skipped: number;
}

/**
 * Genera el audio de los assets pendientes.
 *
 * Cada tick: reclama un lote por `/internal/audio-tts/jobs/claim`, y para cada
 * trabajo sintetiza, almacena y reporta el resultado. El worker **no toca
 * PostgreSQL**: es un cliente HTTP autenticado más, como el resto de los 20
 * workers de este backend, de modo que la autorización, el contexto de tenant y la
 * validación siguen aplicándose sobre cada operación.
 *
 * El reparto de responsabilidades con la API es estricto y explica por qué el
 * worker es tan pequeño:
 *   - la API decide **si** se genera (presupuesto, cupo, licencia), entrega el
 *     texto en claro y contabiliza el resultado;
 *   - el worker decide **cómo** se llama al proveedor (ritmo, mamparo, circuito,
 *     reintento) y escribe los bytes.
 *
 * Cada trabajo va en su propia unidad anidada (`runTick` dentro de `runTick`): un
 * fallo del elemento 2 no debe abortar el lote ni impedir que se reporte el 3. Es
 * el mismo patrón del relevo del outbox de `messaging`.
 */
@Injectable()
export class AudioGenerationJob {
  constructor(
    @Inject(AUDIO_TTS_CONFIG) private readonly config: AudioTtsConfig,
    @Inject(AUDIO_TTS_PROVIDER) private readonly tts: TtsProviderPort,
    @Inject(AUDIO_STORAGE) private readonly storage: AudioStoragePort,
    private readonly api: SystemApiClient,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AudioGenerationJob.name);
  }

  @Interval(AUDIO_GENERATION_INTERVAL_MS)
  async tick(): Promise<void> {
    await runTick(this.logger, 'worker.audio_tts.generation', async () => {
      const workerId = this.api.workerId('audio-generation');

      // `idempotent: false` (el valor por defecto de `post`) es lo correcto aquí y
      // no una omisión: el reclamo tiene efecto —incrementa el intento y toma el
      // lease—, así que un reintento a ciegas tras un timeout consumiría un intento
      // de cada asset del lote sin haberlos generado. Si la llamada se pierde, el
      // lease expira y el tick siguiente los recoge.
      const claimed = await this.api.post<ClaimResponse>(
        '/internal/audio-tts/jobs/claim',
        { workerId, limit: this.config.batchSize },
      );

      if (claimed.jobs.length === 0) {
        if (claimed.skipped > 0) {
          this.logger.warn(
            {
              operation: 'worker.audio_tts.generation',
              skipped: claimed.skipped,
            },
            'Assets reclamados y cerrados sin generar (presupuesto o texto ilegible)',
          );
        }
        return;
      }

      for (const job of claimed.jobs) {
        await runTick(this.logger, 'worker.audio_tts.synthesize', () =>
          this.generate(job),
        );
      }
    });
  }

  /**
   * Sintetiza y almacena un trabajo, y reporta el desenlace.
   *
   * El reporte de fallo **no se propaga como excepción**: si fallara también el
   * reporte, propagar dejaría el asset en `GENERATING` hasta que expire su lease,
   * que es el mismo estado en el que quedaría de todas formas. Lo que no puede
   * pasar es que un fallo al reportar oculte el fallo original en el log.
   */
  private async generate(job: AudioJob): Promise<void> {
    const startedAt = Date.now();
    try {
      const result = await this.tts.synthesize({
        text: job.text,
        language: job.language,
        voiceProfile: this.config.voiceProfile,
        providerVoiceRef: job.providerVoiceRef,
        model: job.model,
        outputFormat: job.outputFormat,
        sampleRate: job.sampleRate,
        requestId: randomUUID(),
      });

      const stored = await this.storage.store({
        assetId: job.assetId,
        buffer: result.audio,
        mimeType: result.mimeType,
        outputFormat: job.outputFormat,
      });

      // Los bytes ya están a salvo: el reporte es idempotente, así que reintentarlo
      // tras un fallo de red no puede duplicar el consumo imputado.
      await this.api.post(
        `/internal/audio-tts/assets/${job.assetId}/complete`,
        {
          storageUri: stored.storageUri,
          mimeType: result.mimeType,
          checksumSha256: stored.checksumSha256,
          bytes: stored.sizeBytes,
          usageUnits: result.usageUnits,
          provider: result.provider,
        },
        { idempotent: true },
      );

      this.logger.info(
        {
          operation: 'worker.audio_tts.synthesize',
          assetId: job.assetId,
          correlationId: job.correlationId,
          provider: result.provider,
          bytes: stored.sizeBytes,
          usageUnits: result.usageUnits,
          usageIsReported: result.usageIsReported,
          durationMs: Date.now() - startedAt,
        },
        'Audio generado y almacenado',
      );
    } catch (error) {
      await this.reportFailure(job, error, Date.now() - startedAt);
    }
  }

  private async reportFailure(
    job: AudioJob,
    error: unknown,
    durationMs: number,
  ): Promise<void> {
    const code = audioErrorCodeOf(error);
    const retryable = isRetryableAudioError(error);

    this.logger.error(
      {
        operation: 'worker.audio_tts.synthesize',
        assetId: job.assetId,
        correlationId: job.correlationId,
        provider: this.tts.providerName,
        code,
        retryable,
        attempts: job.attempts,
        durationMs,
        err: error,
      },
      'Fallo al generar el audio',
    );

    try {
      await this.api.post(
        `/internal/audio-tts/assets/${job.assetId}/fail`,
        { code, retryable },
        { idempotent: true },
      );
    } catch (reportError) {
      // El asset queda con su lease vivo y volverá a ser reclamable al expirar. Se
      // registra aparte para que no se confunda con el fallo de generación.
      this.logger.error(
        {
          operation: 'worker.audio_tts.synthesize',
          assetId: job.assetId,
          err: reportError,
        },
        'No fue posible reportar el fallo de generación: el asset volverá al expirar su lease',
      );
    }
  }
}
