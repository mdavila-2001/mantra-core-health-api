import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  REDIS_CLIENT,
  type RedisClient,
} from '../../../redis_runtime/redis.provider';
import type {
  HeartbeatStoreRead,
  StoredHeartbeat,
} from '../../domain/instance-liveness';

/**
 * Hash que contiene el último latido de cada instancia (`campo` = instanceId).
 *
 * Se usa el cliente Redis crudo (`REDIS_CLIENT`) y NO `RedisRuntimeService`: las
 * claves de éste son `{tenant}:cache:{clave}` y el endpoint `/redis-runtime/cache`
 * permite a un operador escribirlas, así que un latido guardado ahí sería
 * falsificable. Esta clave no tiene la forma `{tenant}:{tipo}:{clave}` con
 * `tipo` ∈ {cache, counter, lock, challenge}: ningún controller puede formarla.
 */
export const HEARTBEAT_HASH_KEY = 'ops:heartbeat:v1';
/**
 * 7 días. Sólo renueva la clave contenedora: los campos NO expiran uno a uno,
 * para que «caída» (latido viejo) no se confunda con «nunca vista».
 */
export const HEARTBEAT_HASH_TTL_SECONDS = 7 * 24 * 60 * 60;
/** Techo de una lectura: pasado esto el almacén se declara no disponible. */
export const HEARTBEAT_READ_TIMEOUT_MS = 2_000;

@Injectable()
export class InstanceHeartbeatRepository {
  private readonly logger = new Logger(InstanceHeartbeatRepository.name);

  constructor(@Inject(REDIS_CLIENT) private readonly redis: RedisClient) {}

  /** Sobrescribe el latido de la instancia. Idempotente. Lanza si Redis falla. */
  async record(heartbeat: StoredHeartbeat): Promise<void> {
    await this.redis.hset(
      HEARTBEAT_HASH_KEY,
      heartbeat.instanceId,
      JSON.stringify(heartbeat),
    );
    await this.redis.expire(HEARTBEAT_HASH_KEY, HEARTBEAT_HASH_TTL_SECONDS);
  }

  /**
   * Lee todos los latidos. Nunca lanza: si Redis falla o no responde a tiempo
   * devuelve `available:false` (los workers pasarán a `SIN_DATO`, no a `CAIDA`).
   */
  async readAll(
    timeoutMs: number = HEARTBEAT_READ_TIMEOUT_MS,
  ): Promise<HeartbeatStoreRead> {
    let timer: NodeJS.Timeout | undefined;
    try {
      const all = await Promise.race([
        this.redis.hgetall(HEARTBEAT_HASH_KEY),
        new Promise<never>((_, reject) => {
          timer = setTimeout(
            () => reject(new Error(`timeout de ${timeoutMs} ms`)),
            timeoutMs,
          );
          timer.unref();
        }),
      ]);
      return { available: true, records: new Map(Object.entries(all)) };
    } catch (error) {
      // Sólo la clase del error: el mensaje puede traer host o credenciales.
      this.logger.warn(
        `Almacén de latidos no disponible (${error instanceof Error ? error.name : 'desconocido'})`,
      );
      return { available: false, records: new Map() };
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
}
