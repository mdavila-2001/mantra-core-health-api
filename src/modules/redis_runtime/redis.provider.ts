import { Logger, type Provider } from '@nestjs/common';
import Redis from 'ioredis';

/**
 * Token de inyección del cliente ioredis compartido por el módulo. Se usa un
 * `Symbol` para evitar colisiones con otros proveedores y para que el cliente
 * sólo sea alcanzable por quien lo declara explícitamente (`@Inject`).
 */
export const REDIS_CLIENT = Symbol('REDIS_RUNTIME_CLIENT');

/** Tipo público del cliente para tipar servicios sin acoplarlos al token. */
export type RedisClient = Redis;

/**
 * Construye la conexión ioredis a partir del entorno (`REDIS_HOST`,
 * `REDIS_PORT`, `REDIS_PASSWORD`). Se conecta de forma perezosa para no romper
 * el arranque si Redis aún no está disponible, y limita los reintentos por
 * comando para que las operaciones de baja latencia fallen rápido en vez de
 * quedarse colgadas.
 */
export const redisClientProvider: Provider = {
  provide: REDIS_CLIENT,
  useFactory: (): Redis => {
    const logger = new Logger('RedisRuntime');
    const host = process.env.REDIS_HOST ?? 'localhost';
    const port = Number(process.env.REDIS_PORT ?? 6380);
    const password = process.env.REDIS_PASSWORD || undefined;

    const client = new Redis({
      host,
      port,
      password,
      lazyConnect: true,
      maxRetriesPerRequest: 2,
      enableReadyCheck: true,
      // Reintento acotado: baja latencia y fallo rápido ante caídas.
      retryStrategy: (times) =>
        times > 5 ? null : Math.min(times * 100, 1000),
    });

    client.on('error', (err: Error) => {
      logger.error(`Error de conexión Redis: ${err.message}`);
    });

    // Conexión perezosa: se dispara sin bloquear el arranque del módulo.
    void client.connect().catch((err: Error) => {
      logger.error(
        `No se pudo conectar a Redis (${host}:${port}): ${err.message}`,
      );
    });

    return client;
  },
};
