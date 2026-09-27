import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import {
  REDIS_CLIENT,
  type RedisClient,
} from '../../modules/redis_runtime/redis.provider';

/** Prefijo de las claves, para no colisionar con otros usos de Redis. */
const KEY_PREFIX = 'idem:';

/** Tope de entradas del respaldo en memoria: una caída larga no agota el heap. */
const LOCAL_MAX_ENTRIES = 10_000;

/**
 * Lo que se guarda por clave de idempotencia.
 *
 * `IN_PROGRESS` es la reserva que toma la primera petición antes de ejecutar;
 * `COMPLETED` es la respuesta que se repite a los reintentos. Las dos llevan la
 * huella del cuerpo, para poder distinguir "el mismo envío otra vez" de "otra
 * operación con una clave reciclada" aunque la primera todavía no termine.
 */
export interface IdempotencyRecord {
  /** Estado de la operación atada a la clave. */
  readonly state: 'IN_PROGRESS' | 'COMPLETED';
  /** Hash del método, la ruta, la query y el cuerpo del primer uso. */
  readonly fingerprint: string;
  /** Status HTTP de la respuesta original (sólo `COMPLETED`). */
  readonly status?: number;
  /** Cuerpo de la respuesta original, ya serializable (sólo `COMPLETED`). */
  readonly body?: unknown;
}

/** Resultado de intentar reservar una clave. */
export type IdempotencyAcquireResult =
  | { readonly acquired: true }
  | { readonly acquired: false; readonly existing: IdempotencyRecord };

/**
 * Almacén de claves de idempotencia sobre el Redis compartido.
 *
 * ## La reserva es atómica
 *
 * `SET clave valor PX ttl NX`: de dos peticiones simultáneas con la misma clave
 * sólo una consigue la reserva, y la otra ve el registro `IN_PROGRESS` de la
 * primera. Sin el `NX`, las dos leerían "no existe" y las dos ejecutarían —que
 * es exactamente el doble cobro o la doble receta que esto viene a evitar—.
 *
 * ## La reserva vence sola
 *
 * El `IN_PROGRESS` lleva un TTL corto (`lockTtlMs`): si la réplica muere a mitad
 * de la operación, la clave no queda bloqueada 24 horas. La respuesta completa,
 * en cambio, vive el TTL largo (`ttlMs`).
 *
 * ## Qué pasa si Redis se cae
 *
 * Igual que `RedisThrottlerStorage`: se degrada a un mapa en memoria del proceso
 * en vez de rechazar. Fallar cerrado dejaría sin walk-in ni recetas a toda la
 * clínica por una caída de caché; en memoria la protección sigue valiendo para
 * el caso común —el doble clic y el reintento del mismo cliente, que suelen
 * caer en la misma réplica—, sólo que no entre réplicas.
 */
@Injectable()
export class IdempotencyStore {
  private readonly logger = new Logger(IdempotencyStore.name);
  /** Respaldo cuando Redis no responde (o no existe, en pruebas). */
  private readonly local = new Map<
    string,
    { record: IdempotencyRecord; expiresAt: number }
  >();
  /** Evita repetir el aviso de degradación en cada petición. */
  private degradado = false;

  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param redis - Cliente compartido; ausente en pruebas y en el generador OpenAPI.
   */
  constructor(
    @Optional() @Inject(REDIS_CLIENT) private readonly redis?: RedisClient,
  ) {}

  /**
   * Intenta reservar la clave para una operación nueva.
   *
   * @param key - Clave ya acotada (usuario, tenant, método y ruta).
   * @param fingerprint - Huella del pedido que toma la reserva.
   * @param lockTtlMs - Vigencia de la reserva mientras la operación corre.
   * @returns `acquired: true`, o el registro que ya ocupa la clave.
   */
  async acquire(
    key: string,
    fingerprint: string,
    lockTtlMs: number,
  ): Promise<IdempotencyAcquireResult> {
    const record: IdempotencyRecord = { state: 'IN_PROGRESS', fingerprint };
    const clave = `${KEY_PREFIX}${key}`;

    if (this.redis) {
      try {
        // Dos vueltas como máximo: si la clave vence entre el SET NX fallido y
        // el GET, la segunda vuelta la toma en vez de inventar un estado.
        for (let intento = 0; intento < 2; intento += 1) {
          const ok = await this.redis.set(
            clave,
            JSON.stringify(record),
            'PX',
            lockTtlMs,
            'NX',
          );
          if (ok === 'OK') return { acquired: true };

          const crudo = await this.redis.get(clave);
          if (crudo !== null) {
            return {
              acquired: false,
              existing: JSON.parse(crudo) as IdempotencyRecord,
            };
          }
        }
        return { acquired: true };
      } catch (err) {
        this.avisarDegradacion(err);
      }
    }

    const existente = this.getLocal(clave);
    if (existente) return { acquired: false, existing: existente };
    this.setLocal(clave, record, lockTtlMs);
    return { acquired: true };
  }

  /**
   * Guarda la respuesta de la operación y libera la reserva.
   *
   * @param key - Clave ya acotada.
   * @param record - Registro `COMPLETED` con status y cuerpo.
   * @param ttlMs - Cuánto se recuerda la respuesta.
   */
  async complete(
    key: string,
    record: IdempotencyRecord,
    ttlMs: number,
  ): Promise<void> {
    const clave = `${KEY_PREFIX}${key}`;
    if (this.redis) {
      try {
        await this.redis.set(clave, JSON.stringify(record), 'PX', ttlMs);
        return;
      } catch (err) {
        this.avisarDegradacion(err);
      }
    }
    this.setLocal(clave, record, ttlMs);
  }

  /**
   * Suelta la reserva sin guardar respuesta: la operación falló y un reintento
   * con la misma clave tiene que poder ejecutarse de nuevo.
   *
   * @param key - Clave ya acotada.
   */
  async release(key: string): Promise<void> {
    const clave = `${KEY_PREFIX}${key}`;
    this.local.delete(clave);
    if (!this.redis) return;
    try {
      await this.redis.del(clave);
    } catch (err) {
      this.avisarDegradacion(err);
    }
  }

  /** Lee el respaldo en memoria descartando lo vencido. */
  private getLocal(clave: string): IdempotencyRecord | undefined {
    const entrada = this.local.get(clave);
    if (!entrada) return undefined;
    if (entrada.expiresAt <= Date.now()) {
      this.local.delete(clave);
      return undefined;
    }
    return entrada.record;
  }

  /** Escribe en el respaldo en memoria, desalojando lo más viejo si se llena. */
  private setLocal(
    clave: string,
    record: IdempotencyRecord,
    ttlMs: number,
  ): void {
    this.local.delete(clave);
    if (this.local.size >= LOCAL_MAX_ENTRIES) {
      const masVieja = this.local.keys().next().value;
      if (masVieja !== undefined) this.local.delete(masVieja);
    }
    this.local.set(clave, { record, expiresAt: Date.now() + ttlMs });
  }

  /** Registra una sola vez que se está trabajando sin Redis. */
  private avisarDegradacion(err: unknown): void {
    if (this.degradado) return;
    this.degradado = true;
    this.logger.warn(
      `Redis no responde; la idempotencia se degrada a memoria por réplica: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
  }
}
