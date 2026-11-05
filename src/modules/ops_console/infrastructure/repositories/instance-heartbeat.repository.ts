import { Inject, Injectable } from '@nestjs/common';
import {
  REDIS_CLIENT,
  type RedisClient,
} from '../../../redis_runtime/redis.provider';

/**
 * Clave única del almacén de latidos. Un hash con un campo por `instanceId`:
 * sobrescribir el campo es la idempotencia del latido, y `HGETALL` trae la
 * flota entera en una ida y vuelta.
 *
 * El prefijo `ops:` queda fuera de lo que `RedisRuntimeService` sabe formar
 * (`{tenantId}:cache:{key}`): el controller `/redis-runtime/cache` no puede
 * escribir ni leer esta clave, así que nadie fabrica latidos por la API.
 */
export const HEARTBEAT_HASH_KEY = 'ops:heartbeat:v1';

/**
 * Vida de la clave contenedora, renovada en cada latido. Sólo caduca el hash
 * completo tras 7 días sin ningún latido: los campos **no** expiran uno a uno,
 * para que «caída» (fila vieja) no se confunda con «nunca vista» (sin fila).
 */
export const HEARTBEAT_HASH_TTL_SECONDS = 604_800;

/** Lo que se guarda por latido: el cuerpo recibido más el reloj de la API. */
export interface StoredHeartbeat {
  readonly instanceId: string;
  readonly pid: number;
  readonly startedAt: string;
  readonly sentAt: string;
  readonly status: string;
  readonly liveness: { healthy: boolean; reasons: string[] };
  readonly readiness: { healthy: boolean; reasons: string[] };
  readonly stuckTicks: number;
  readonly openCircuits: string[];
  /** Epoch ms del reloj de la API al recibirlo; es lo que decide la edad. */
  readonly receivedAt: number;
}

/** Acceso al hash de latidos sobre la conexión compartida de `RedisRuntimeModule`. */
@Injectable()
export class InstanceHeartbeatRepository {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: RedisClient) {}

  /** `HSET` del campo de la instancia y renovación del TTL del hash. */
  async save(record: StoredHeartbeat): Promise<void> {
    await this.redis.hset(
      HEARTBEAT_HASH_KEY,
      record.instanceId,
      JSON.stringify(record),
    );
    await this.redis.expire(HEARTBEAT_HASH_KEY, HEARTBEAT_HASH_TTL_SECONDS);
  }

  /**
   * Todos los latidos guardados, crudos, por `instanceId`. Lanza si Redis no
   * responde: quien llama decide qué significa no poder leer (nunca «viva»).
   */
  async readAll(): Promise<Record<string, string>> {
    return this.redis.hgetall(HEARTBEAT_HASH_KEY);
  }
}
