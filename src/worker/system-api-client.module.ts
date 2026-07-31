import { Global, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { loadWorkerEnv } from './worker.env';
import { WORKER_ENV } from './worker.tokens';
import { SystemApiClient } from './system-api-client.service';

/**
 * `@Global()` para que cada `*WorkerModule` de fase (`jobs/<dominio>/...`)
 * pueda inyectar `SystemApiClient`/`WORKER_ENV` sin reimportar este módulo —
 * igual que `AuthModule` hace con `TokenService` en la API HTTP.
 */
@Global()
@Module({
  imports: [
    HttpModule.registerAsync({
      useFactory: () => {
        const env = loadWorkerEnv();
        return { baseURL: env.apiBaseUrl, timeout: env.httpTimeoutMs };
      },
    }),
  ],
  providers: [
    SystemApiClient,
    { provide: WORKER_ENV, useValue: loadWorkerEnv() },
  ],
  exports: [SystemApiClient, WORKER_ENV],
})
export class SystemApiClientModule {}
