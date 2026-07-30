import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import { PeriopController } from './controllers';
import {
  PeriopCasesService,
  PeriopPreopService,
  PeriopIntraopService,
} from './services';
import {
  PeriopCasesRepository,
  PeriopPreopRepository,
  PeriopIntraopRepository,
} from './repositories';

/**
 * Módulo perioperatorio: programación del caso quirúrgico, valoración y
 * clearance preoperatorio, checklist de seguridad, anestesia, intervención con
 * implantes e insumos, reporte operatorio, recuperación, cancelación y cargos
 * (UC-53-01 … 14).
 */
@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [PeriopController],
  providers: [
    PeriopCasesRepository,
    PeriopPreopRepository,
    PeriopIntraopRepository,
    PeriopCasesService,
    PeriopPreopService,
    PeriopIntraopService,
  ],
})
export class ProceduresPerioperativeModule {}
