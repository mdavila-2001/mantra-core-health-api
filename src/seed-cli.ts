// Misma razón que en `main.ts`: la instrumentación de OpenTelemetry parchea
// `pg` cuando Node lo carga, así que esta importación va antes que NestJS.
import './observability/telemetry.bootstrap';

import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { SeedBootstrapService } from './common/seed/seed-bootstrap.service';
import { seedExitCode } from './common/seed/seed-exit-code';
import { SchemaIntegrityState } from './orm';

/**
 * Siembra los datos estructurales una sola vez y termina.
 *
 * Existe para que sembrar deje de ser un efecto secundario de arrancar el
 * servidor. Un despliegue puede correr esto como paso propio —con
 * `SEED_ON_BOOT=false` en el proceso que sirve HTTP— y ver el resultado en el
 * código de salida en vez de tener que leer los logs de arranque buscando un
 * `warn` que quizá nadie emitió.
 *
 * Fuerza `SEED_ON_BOOT=false` en su propio entorno **antes** de construir el
 * contexto: `createApplicationContext` dispara `onApplicationBootstrap`, así
 * que sin esto la cadena correría dos veces —una por el ciclo de vida y otra
 * por la llamada explícita— y el resumen mediría la segunda, que siempre
 * inserta cero.
 */
async function main(): Promise<void> {
  process.env.SEED_ON_BOOT = 'false';
  // Migración y seed son el uso legítimo del rol dueño (DDL, catálogos): el
  // guard de HZ-05 no debe tratarlo como un runtime que ignora RLS.
  process.env.DB_ROLE_PURPOSE = 'migration';

  const app = await NestFactory.createApplicationContext(AppModule, {
    bufferLogs: true,
  });
  app.useLogger(app.get(Logger));

  try {
    const summary = await app.get(SeedBootstrapService).run();
    const integrity = app.get(SchemaIntegrityState);
    if (!integrity.isComplete()) {
      app
        .get(Logger)
        .error(
          { blockingCount: integrity.current()?.blockingCount },
          'El esquema quedó con incidencias de integridad bloqueantes',
        );
    }
    await app.close();
    // El código de salida es el contrato con quien lo invoca: un seed omitido
    // deja el catálogo incompleto, y un paso de despliegue que devuelve 0 con
    // el catálogo a medias es exactamente el silencio que este trabajo vino a
    // sacar del medio. Lo mismo vale para un esquema con FK o únicos críticos
    // ausentes (ORMN-01): la API no debe arrancar sobre él.
    process.exit(seedExitCode(summary.failed, integrity.isComplete()));
  } catch (error) {
    app
      .get(Logger)
      .error(error, 'La siembra terminó con un error no controlado');
    await app.close();
    process.exit(1);
  }
}

void main();
