import { Inject, Module, type OnModuleDestroy } from '@nestjs/common';
import { RedisRuntimeController } from './controllers';
import { RedisRuntimeService } from './services';
import { REDIS_CLIENT, redisClientProvider, type RedisClient } from './redis.provider';

/**
 * MÓDULO 56 `redis_runtime`: runtime de baja latencia sobre Redis real. Ofrece
 * caché con TTL, contadores/rate por clave, locks distribuidos y challenge store
 * (OTP), todo acotado por tenant (`{tenantId}:...`).
 *
 * El cliente ioredis se comparte como proveedor y se cierra limpiamente en el
 * apagado del módulo (`OnModuleDestroy`). Exporta `RedisRuntimeService` para que
 * otros módulos (p. ej. verificación de contact points vía `verifyChallenge`)
 * puedan reutilizar el runtime sin abrir conexiones propias.
 */
@Module({
  controllers: [RedisRuntimeController],
  providers: [redisClientProvider, RedisRuntimeService],
  exports: [RedisRuntimeService],
})
export class RedisRuntimeModule implements OnModuleDestroy {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: RedisClient) {}

  /** Cierre ordenado de la conexión Redis al destruir el módulo. */
  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }
}
