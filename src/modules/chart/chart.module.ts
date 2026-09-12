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
  ChartNotesReadService,
} from './services';
import {
  ClinicalNotesRepository,
  CarePlansRepository,
  DocumentsRepository,
  ChartTemplatesRepository,
} from './repositories';
// FT-07-R08: `ChartReadController` necesita el mismo guard que
// `ClinicalReadController` — ambos son la misma pregunta de autorización
// (¿puede este profesional ver el expediente de este paciente?) sobre la misma
// pantalla de archivo clínico. `ClinicalModule` exporta el guard ya resuelto
// contra `ClinicalReadService`; importar `AuthzModule` directamente acá sería
// redundante.
import { ClinicalModule } from '../clinical/clinical.module';

/**
 * Módulo Chart (15): notas clínicas versionadas y firmadas, liberación al
 * paciente, hallazgos de examen físico, documentos gobernados, planes de cuidado
 * y asignación de plantillas por especialidad.
 */
@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities)), ClinicalModule],
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
    ChartNotesReadService,
  ],
})
export class ChartModule {}
