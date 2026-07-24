import { Global, Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { buildPinoOptions } from './pino-options';

/**
 * Logging estructurado con pino para todas las capas del backend.
 *
 * Envuelve el `LoggerModule` de `nestjs-pino` con la configuración validada del
 * proyecto (`buildPinoOptions`). Es la pieza que hace realidad la regla
 * transversal: cualquier capa -arranque, ORM, dominios, workers, guards- emite
 * por el mismo transporte, con el mismo formato y con los secretos ya redactados.
 *
 * `@Global` para que `PinoLogger` se pueda inyectar en cualquier módulo sin
 * reimportar nada. El logger de peticiones HTTP queda activo automáticamente; el
 * cambio del logger por defecto de Nest por pino lo hace `main.ts` con
 * `app.useLogger`, y a partir de ahí también los `Logger` de `@nestjs/common`
 * (incluido el puente del ORM) escriben por pino.
 */
@Global()
@Module({
  imports: [LoggerModule.forRoot(buildPinoOptions())],
  exports: [LoggerModule],
})
export class LoggingModule {}
