import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import { EducationController } from './controllers';
import { EducationCatalogService, EducationLearningService } from './services';
import {
  EducationCatalogRepository,
  EducationLearningRepository,
} from './repositories';

/**
 * Módulo de formación: catálogo de cursos con módulos y lecciones, versiones,
 * instructores, cohortes, inscripciones con progreso, evaluaciones, certificados
 * verificables y créditos CME (UC-47-01 … 14).
 */
@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [EducationController],
  providers: [
    EducationCatalogRepository,
    EducationLearningRepository,
    EducationCatalogService,
    EducationLearningService,
  ],
})
export class EducationModule {}
