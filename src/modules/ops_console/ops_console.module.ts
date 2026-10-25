import { Module } from '@nestjs/common';
import { RouteIndexModule } from '../../observability/route-index/route-index.module';
import { OpsConsoleService } from './application/ops-console.service';
import { OpsTrafficService } from './application/ops-traffic.service';
import { OpsConsoleRepository } from './infrastructure/repositories/ops-console.repository';
import { OpsTrafficRepository } from './infrastructure/repositories/ops-traffic.repository';
import { OpsConsoleController } from './presentation/controllers/ops-console.controller';

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
