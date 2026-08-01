// Primera importación del proceso worker: los 20 entrypoints
// (`src/worker-<dominio>.ts`) importan este archivo antes que ningún otro, así
// que la telemetría queda inicializada antes que NestJS, axios y pg. El nombre
// del servicio (`redesa-worker-<dominio>`) se deriva del entrypoint en ejecución
// — ver `resolveServiceName` en `observability/telemetry.config.ts`.
import '../observability/telemetry.bootstrap';

import { Module, type Type } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { Logger } from 'nestjs-pino';
import { AuthTokenModule, authEnvSchema } from '../common';
import { LoggingModule, loggingEnvSchema } from '../logging';
import { ObservabilityModule, telemetryEnvSchema } from '../observability';
import {
  assertMockProviderNotInProduction,
  workerEnvSchema,
} from './worker.env';
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
  // ANTES de construir nada: si el emulador de proveedores está configurado en
  // producción, el proceso no debe arrancar. Se comprueba aquí y no solo dentro
  // de `loadWorkerEnv` para que el fallo ocurra en el arranque y no en el primer
  // tick, media hora después y en un log que nadie mira.
  assertMockProviderNotInProduction();

  @Module({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        validationSchema: authEnvSchema
          .concat(loggingEnvSchema)
          .concat(workerEnvSchema)
          .concat(telemetryEnvSchema),
      }),
      LoggingModule,
      ObservabilityModule,
      AuthTokenModule,
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

  // Aviso explícito cuando el emulador está activo. En producción esto ya no se
  // alcanza (el proceso habría abortado antes), pero en desarrollo es fácil
  // olvidar que toda verificación de identidad y de matrícula se está aceptando
  // automáticamente y confundir "el flujo funciona" con "la identidad se
  // comprobó". Que quede en el log del arranque hace la diferencia entre las dos
  // lecturas.
  const mockProviderUrl = (process.env.MOCK_PROVIDER_BASE_URL ?? '').trim();
  if (mockProviderUrl.length > 0) {
    app
      .get(Logger)
      .warn(
        `Emulador de proveedores ACTIVO (${mockProviderUrl}): las verificaciones ` +
          'de identidad y de matrícula profesional se aceptan automáticamente. ' +
          'Ningún registro civil ni colegio médico las comprobó. Para simular ' +
          'rechazos, subir IDENTITY_VERIFICATION_REJECTION_RATE en el emulador.',
      );
  }

  app.get(Logger).log(`Worker "${name}" en marcha`);
}
