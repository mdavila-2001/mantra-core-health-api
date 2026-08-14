// Primera importación del proceso worker: los 20 entrypoints
// (`src/worker-<dominio>.ts`) importan este archivo antes que ningún otro, así
// que la telemetría queda inicializada antes que NestJS, axios y pg. El nombre
// del servicio (`redesa-worker-<dominio>`) se deriva del entrypoint en ejecución
// — ver `resolveServiceName` en `observability/telemetry.config.ts`.
import '../observability/telemetry.bootstrap';

import { Module, type Type } from '@nestjs/common';
import type { ObjectSchema } from 'joi';
import { NestFactory } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { Logger, PinoLogger } from 'nestjs-pino';
import {
  AuthTokenModule,
  authEnvSchema,
  installProcessGuards,
  installShutdownWatchdog,
} from '../common';
import { LoggingModule, loggingEnvSchema } from '../logging';
import { ObservabilityModule, telemetryEnvSchema } from '../observability';
// Se importa por su ruta exacta y no desde `modules/audio_tts`: el barril del
// módulo arrastra entidades, controladores y `AudioTtsModule` al proceso worker,
// que no los necesita. Este archivo solo depende de Joi.
import { audioTtsEnvSchema } from '../modules/audio_tts/config/audio-tts.env';
import {
  assertMockProviderNotInProduction,
  loadWorkerEnv,
  workerEnvSchema,
} from './worker.env';
import { SystemApiClientModule } from './system-api-client.module';
import { MockProviderClientModule } from './mock-provider-client.module';
import { GoogleEmailClientModule } from './google-email-client.module';
import { WorkerLifecycleService } from './worker-lifecycle.service';
import { configureTicks } from './run-tick.util';
import { workerHealth } from './worker-health.registry';
import { startWorkerHealthServer } from './worker-health.server';

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
 *
 * El orden de las tres primeras operaciones no es casual y no debe reordenarse:
 * la guarda del emulador va antes de construir nada, los manejadores de fallo
 * terminal van antes de que exista código que pueda fallar, y la sonda HTTP va
 * después de que el registro de salud sepa su nombre y su umbral.
 */
export async function bootstrapWorker(
  domainModule: Type<unknown>,
  name: string,
  additionalEnvSchema?: ObjectSchema,
): Promise<void> {
  // ANTES de construir nada: si el emulador de proveedores está configurado en
  // producción, el proceso no debe arrancar. Se comprueba aquí y no solo dentro
  // de `loadWorkerEnv` para que el fallo ocurra en el arranque y no en el primer
  // tick, media hora después y en un log que nadie mira.
  assertMockProviderNotInProduction();

  const env = loadWorkerEnv();
  configureTicks(env.tickTimeoutMs);
  workerHealth.configure(name, env.stuckTickMs);

  @Module({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        validationSchema: additionalEnvSchema
          ? authEnvSchema
              .concat(loggingEnvSchema)
              .concat(workerEnvSchema)
              .concat(telemetryEnvSchema)
              .concat(additionalEnvSchema)
          : authEnvSchema
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
    providers: [WorkerLifecycleService],
  })
  class WorkerRootModule {}

  const app = await NestFactory.createApplicationContext(WorkerRootModule, {
    bufferLogs: true,
  });

  app.useLogger(app.get(Logger));
  app.flushLogs();
  app.enableShutdownHooks();

  const logger = await app.resolve(PinoLogger);
  logger.setContext(`worker:${name}`);

  // Red de seguridad del proceso. Va después de tener logger porque su única
  // razón de existir es que el fallo terminal quede escrito de forma
  // estructurada; instalarla antes la dejaría escribiendo a `console`, que es
  // justo lo que se quiere evitar.
  installProcessGuards({
    logger,
    processName: `worker-${name}`,
    // El SDK de telemetría ya cierra por su cuenta con las señales
    // (`registerTelemetryShutdown`), pero una muerte por excepción no capturada
    // no pasa por ahí: sin este vaciado se perderían justo los spans de la
    // operación que provocó la caída.
    onFatal: async () => {
      await app.close().catch(() => undefined);
    },
  });

  installShutdownWatchdog({
    logger,
    processName: `worker-${name}`,
    timeoutMs: env.shutdownTimeoutMs,
    describePending: () => ({
      inFlightTicks: workerHealth.inFlightOperations(),
      status: workerHealth.getStatus(),
    }),
  });

  // Sonda HTTP: es lo que convierte "el PID existe" en "el worker está haciendo
  // su trabajo" para el orquestador. Ver `worker-health.server.ts`.
  //
  // No se cierra al recibir la señal, a propósito: el drenaje es justo cuando
  // el orquestador más consulta la sonda —para saber si ya puede retirar la
  // instancia— y cerrarla ahí la dejaría sin respuesta en el peor momento.
  // Como el servidor está `unref`, no es motivo para que el proceso siga vivo:
  // muere cuando ya no queda nada más pendiente, que es lo correcto.
  startWorkerHealthServer({ port: env.healthPort, logger });

  // Aviso explícito cuando el emulador está activo. En producción esto ya no se
  // alcanza (el proceso habría abortado antes), pero en desarrollo es fácil
  // olvidar que toda verificación de identidad y de matrícula se está aceptando
  // automáticamente y confundir "el flujo funciona" con "la identidad se
  // comprobó". Que quede en el log del arranque hace la diferencia entre las dos
  // lecturas.
  if (env.mockProviderBaseUrl.trim().length > 0) {
    logger.warn(
      `Emulador de proveedores ACTIVO (${env.mockProviderBaseUrl}): las verificaciones ` +
        'de identidad y de matrícula profesional se aceptan automáticamente. ' +
        'Ningún registro civil ni colegio médico las comprobó. Para simular ' +
        'rechazos, subir IDENTITY_VERIFICATION_REJECTION_RATE en el emulador.',
    );
  }

  logger.info(
    {
      worker: name,
      healthPort: env.healthPort,
      tickTimeoutMs: env.tickTimeoutMs,
      stuckTickMs: env.stuckTickMs,
      shutdownTimeoutMs: env.shutdownTimeoutMs,
    },
    `Worker "${name}" en marcha`,
  );
}
