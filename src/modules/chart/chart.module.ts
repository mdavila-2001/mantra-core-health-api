import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import {
  ChartNotesController,
  ChartDocumentsController,
  ChartCarePlansController,
  ChartTemplatesController,
  ChartReadController,
} from './controllers';
import {
  ChartNotesService,
  ChartDocumentsService,
  ChartCarePlansService,
  ChartTemplatesService,
  ChartReadService,
} from './services';
import {
  ClinicalNotesRepository,
  CarePlansRepository,
  DocumentsRepository,
  ChartTemplatesRepository,
} from './repositories';

/**
 * Módulo Chart (15): notas clínicas versionadas y firmadas, liberación al
 * paciente, hallazgos de examen físico, documentos gobernados, planes de cuidado
 * y asignación de plantillas por especialidad.
 */
@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [
    ChartNotesController,
    ChartDocumentsController,
    ChartCarePlansController,
    ChartTemplatesController,
    ChartReadController,
  ],
  providers: [
    // Repositorios
    ClinicalNotesRepository,
    CarePlansRepository,
    DocumentsRepository,
    ChartTemplatesRepository,
    // Servicios
    ChartNotesService,
    ChartDocumentsService,
    ChartCarePlansService,
    ChartTemplatesService,
    ChartReadService,
  ],
})
export class ChartModule {}
