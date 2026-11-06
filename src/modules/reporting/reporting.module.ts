import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import { ReportingController } from './controllers';
import { ReportingMoneyController } from './controllers/reporting-money.controller';
import { ReportingMoneyService } from './services/reporting-money.service';
import { ReportingMoneyRepository } from './repositories/reporting-money.repository';
import { ReportingDefinitionsService, ReportingRunsService } from './services';
import {
  ReportingDefinitionsRepository,
  ReportingRunsRepository,
} from './repositories';

/**
 * Módulo de reportes: fuentes gobernadas, definiciones versionadas con
 * parámetros y columnas, corridas y snapshots, programación y distribución,
 * suscripciones y tableros (UC-39-01 … 12).
 */
@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [ReportingController, ReportingMoneyController],
  providers: [
    ReportingDefinitionsRepository,
    ReportingRunsRepository,
    ReportingDefinitionsService,
    ReportingRunsService,
    ReportingMoneyRepository,
    ReportingMoneyService,
  ],
})
export class ReportingModule {}
