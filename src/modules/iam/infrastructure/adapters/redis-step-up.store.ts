import { Inject, Injectable, Optional } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import {
  REDIS_CLIENT,
  type RedisClient,
} from '../../../redis_runtime/redis.provider';
import {
  StepUpUnavailableError,
  type StepUpPort,
} from '../../application/ports/step-up.port';
import {
  StepUpStorePort,
  type StepUpStamp,
} from '../../application/ports/step-up-store.port';
import {
  ageMinutesOf,
  parseStepUpStamp,
  stepUpKey,
  stepUpTtlMinutes,
} from '../../domain/step-up';

export type { StepUpStamp };

/** Cuánto se espera a Redis antes de darlo por no disponible. */
export const STEP_UP_REDIS_TIMEOUT_MS = 2000;

/**
 * Sello del paso extra por sesión, en Redis (`stepup:<sessionId>` = instante,
 * con TTL de `SUPPORT_STEP_UP_TTL_MIN`, 60 por defecto).
 *
 * ## Falla cerrado
 *
 * A diferencia de los contadores (que degradan a memoria para no dejar sin
 * servicio al mostrador), un sello en memoria por réplica sería un sello que otra
 * réplica no ve —o peor, uno que la política creería—. Si Redis no está, no
 * responde en {@link STEP_UP_REDIS_TIMEOUT_MS} o no está configurado, toda
 * lectura y escritura lanza {@link StepUpUnavailableError}: la política niega
 * (`STEP_UP_UNAVAILABLE`) y quien intenta sellar recibe 503. Nunca se devuelve
 * «sin sello» ni «fresco» cuando no se sabe.
 *
 * ## Qué no hace
 *
 * El refresco de la sesión no renueva el sello: solo `POST /iam/me/step-up` lo
 * escribe. El reloj es el de la aplicación (réplicas con la hora sincronizada).
 */
@Injectable()
export class StepUpStore implements StepUpPort, StepUpStorePort {
  /**
   * @param logger - Logger estructurado.
   * @param redis - Cliente compartido; ausente en pruebas y en el generador OpenAPI.
   */
  constructor(
    private readonly logger: PinoLogger,
    @Optional() @Inject(REDIS_CLIENT) private readonly redis?: RedisClient,
  ) {
    this.logger.setContext(StepUpStore.name);
  }

  /**
   * Sella la sesión: guarda el instante con su TTL.
   *
   * @param sessionId - `sid` del token.
   * @param nowMs - Instante del sello (por defecto, ahora).
   * @returns Instante y vigencia en minutos.
   * @throws StepUpUnavailableError si no se pudo escribir.
   */
  async stamp(
    sessionId: string,
    nowMs: number = Date.now(),
  ): Promise<StepUpStamp> {
    const ttlMinutes = stepUpTtlMinutes(process.env);
    await this.run('stamp', (redis) =>
      redis.set(stepUpKey(sessionId), String(nowMs), 'EX', ttlMinutes * 60),
    );
    return { verifiedAt: new Date(nowMs), ttlMinutes };
  }

  /** @inheritdoc */
  async ageMinutes(
    sessionId: string,
    nowMs: number = Date.now(),
  ): Promise<number | null> {
    if (!sessionId) return null;
    const raw = await this.run('read', (redis) =>
      redis.get(stepUpKey(sessionId)),
    );
    const stampMs = parseStepUpStamp(raw);
    return stampMs === null ? null : ageMinutesOf(stampMs, nowMs);
  }

  /**
   * Borra el sello de la sesión (al cerrarla). Nunca lanza: cerrar sesión no
   * puede fallar por Redis, y un sello huérfano muere con su TTL y no sirve a
   * ninguna otra sesión.
   *
   * @param sessionId - `sid` del token.
   */
  async clear(sessionId: string): Promise<void> {
    if (!sessionId) return;
    try {
      await this.run('clear', (redis) => redis.del(stepUpKey(sessionId)));
    } catch {
      // `run` ya dejó el aviso; no se propaga.
    }
  }

  /**
   * Comprueba que Redis responde, para no gastar un código de un solo uso
   * cuando luego no se podría sellar.
   *
   * @throws StepUpUnavailableError si no responde.
   */
  async assertAvailable(): Promise<void> {
    await this.run('ping', (redis) => redis.ping());
  }

  /** Ejecuta un comando con plazo; cualquier fallo es «no disponible». */
  private async run<T>(
    operation: string,
    command: (redis: RedisClient) => Promise<T>,
  ): Promise<T> {
    if (!this.redis) {
      this.logger.warn(
        { operation: `iam.step_up.${operation}` },
        'Redis no está configurado: el paso extra no se puede comprobar',
      );
      throw new StepUpUnavailableError('Redis no configurado');
    }
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        command(this.redis),
        new Promise<never>((_, reject) => {
          timer = setTimeout(
            () => reject(new Error('plazo agotado')),
            STEP_UP_REDIS_TIMEOUT_MS,
          );
        }),
      ]);
    } catch (err) {
      // Sin el `sessionId` ni datos de la persona: solo la causa técnica.
      const cause = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        { operation: `iam.step_up.${operation}`, err: cause },
        'Redis no responde: el paso extra falla cerrado',
      );
      throw new StepUpUnavailableError(cause);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
}
