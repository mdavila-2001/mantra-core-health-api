import { Global, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { loadWorkerEnv } from './worker.env';
import { MockProviderClient } from './mock-provider-client.service';

/**
 * `@Global()` para que cualquier `*WorkerModule` pueda inyectar
 * `MockProviderClient` sin reimportar este módulo — igual que
 * `SystemApiClientModule`. Es un `HttpModule.registerAsync` PROPIO y
 * distinto del de `SystemApiClientModule`: cada uno vive encapsulado en su
 * módulo y sólo expone su servicio envoltorio, así que tener dos clientes
 * HTTP con baseURL distinta en el mismo proceso no colisiona.
 */
@Global()
@Module({
  imports: [
    HttpModule.registerAsync({
      useFactory: () => {
        const env = loadWorkerEnv();
        return {
          baseURL: env.mockProviderBaseUrl || undefined,
          timeout: env.httpTimeoutMs,
        };
      },
    }),
  ],
  providers: [MockProviderClient],
  exports: [MockProviderClient],
})
export class MockProviderClientModule {}
