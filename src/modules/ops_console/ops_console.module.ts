import { Module } from '@nestjs/common';
import { OpsConsoleController } from './ops-console.controller';
import { OpsConsoleRepository } from './ops-console.repository';
import { OpsConsoleService } from './ops-console.service';

/**
 * Consola de operación y preparación para producción del portal
 * administrativo. Sin tablas propias: lee los schemas de los módulos que
 * poseen cada dato y nunca escribe en ellos.
 */
@Module({
  controllers: [OpsConsoleController],
  providers: [OpsConsoleRepository, OpsConsoleService],
})
export class OpsConsoleModule {}
