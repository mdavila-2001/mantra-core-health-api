import { Module, type Type } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { Logger } from 'nestjs-pino';
import { AuthModule, authEnvSchema } from '../common';
import { LoggingModule, loggingEnvSchema } from '../logging';
import { workerEnvSchema } from './worker.env';
import { SystemApiClientModule } from './system-api-client.module';
import { MockProviderClientModule } from './mock-provider-client.module';
import { GoogleEmailClientModule } from './google-email-client.module';

/**
 * Arranca UN worker por dominio como proceso Node independiente.
 *
 * Cada dominio corre en su propio proceso (y su propio contenedor Docker) en
 * vez de un único monolito con los 20 dominios adentro: un tick largo o un
 * crash de `automation` no debe tocar el tick de `messaging`, y cada uno
 * escala y se despliega por separado. `bootstrapWorker` es lo único que
 * comparten — el resto (`SystemApiClient`, `run-tick.util`, cada
 * `*WorkerModule`) ya vivía en módulos independientes desde la Fase 0/1.
 *
 * Se usa desde un entrypoint de una línea por dominio, p. ej.
 * `src/worker-messaging.ts`:
 * ```ts
 * import { bootstrapWorker } from './worker/bootstrap';
 * import { MessagingWorkerModule } from './worker/jobs/messaging/messaging.worker-module';
 * void bootstrapWorker(MessagingWorkerModule, 'messaging');
 * ```
 */
export async function bootstrapWorker(
  domainModule: Type<unknown>,
  name: string,
): Promise<void> {
  @Module({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        validationSchema: authEnvSchema
          .concat(loggingEnvSchema)
          .concat(workerEnvSchema),
      }),
      LoggingModule,
      AuthModule,
      SystemApiClientModule,
      MockProviderClientModule,
      GoogleEmailClientModule,
      ScheduleModule.forRoot(),
      domainModule,
    ],
  })
  class WorkerRootModule {}

  const app = await NestFactory.createApplicationContext(WorkerRootModule, {
    bufferLogs: true,
  });

  app.useLogger(app.get(Logger));
  app.flushLogs();
  app.enableShutdownHooks();
  app.get(Logger).log(`Worker "${name}" en marcha`);
}
