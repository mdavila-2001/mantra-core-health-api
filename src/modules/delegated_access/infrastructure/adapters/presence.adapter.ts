import { Inject, Injectable, Optional } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import {
  REDIS_CLIENT,
  type RedisClient,
} from '../../../redis_runtime/redis.provider';
import type { PresencePort } from '../../services/support-access-context.ports';

/** Cuánto se espera a Redis antes de dar la presencia por desconocida. */
const REDIS_TIMEOUT_MS = 1500;

/**
 * Presencia del doctor: la misma clave de Redis que escribe
 * `CommunityPresenceService` (`community:presence:<perfil>`, TTL de 60 s). Se lee
 * aquí y no por ese servicio porque `community` importa a `delegated_access` (un
 * ciclo de módulos). Si Redis no responde la presencia es DESCONOCIDA
 * (`undefined`): la condición queda indeterminada y no abre.
 */
@Injectable()
export class RedisPresenceAdapter implements PresencePort {
  /**
   * @param logger - Logger estructurado.
   * @param redis - Cliente compartido; ausente en pruebas y en el generador OpenAPI.
   */
  constructor(
    private readonly logger: PinoLogger,
    @Optional() @Inject(REDIS_CLIENT) private readonly redis?: RedisClient,
  ) {
    this.logger.setContext(RedisPresenceAdapter.name);
  }

  async isOnline(practitionerProfileId: string): Promise<boolean | undefined> {
    if (!this.redis) return undefined;
    try {
      const value = await Promise.race([
        this.redis.get(`community:presence:${practitionerProfileId}`),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error('Redis sin responder')),
            REDIS_TIMEOUT_MS,
          ).unref(),
        ),
      ]);
      return value !== null && value !== undefined;
    } catch (err) {
      this.logger.warn(
        {
          operation: 'delegated_access.presence.read',
          err: err instanceof Error ? err.message : String(err),
        },
        'No se pudo leer la presencia del doctor; se responde «no se sabe»',
      );
      return undefined;
    }
  }
}
