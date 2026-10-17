import { Module } from '@nestjs/common';
import { RouteIndexModule } from '../../observability/route-index/route-index.module';
import { OpsConsoleController } from './ops-console.controller';
import { OpsConsoleRepository } from './ops-console.repository';
import { OpsConsoleService } from './ops-console.service';
import { OpsTrafficRepository } from './ops-traffic.repository';
import { OpsTrafficService } from './ops-traffic.service';

/**
 * Consola de operación y preparación para producción del portal
 * administrativo. Sin tablas propias: lee los schemas de los módulos que
 * poseen cada dato y nunca escribe en ellos.
 */
@Module({
  imports: [RouteIndexModule],
  controllers: [OpsConsoleController],
  providers: [
    OpsConsoleRepository,
    OpsConsoleService,
    OpsTrafficRepository,
    OpsTrafficService,
  ],
})
export class OpsConsoleModule {}
