import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import {
  TerminologyCodeSystemsController,
  TerminologyVersionsController,
  TerminologyConceptsController,
  TerminologyValueSetsController,
} from './controllers';
import {
  CodeSystemsService,
  CodeSystemVersionsService,
  ConceptsService,
  ValueSetsService,
} from './services';
import {
  TerminologySourcesRepository,
  CodeSystemsRepository,
  CodeSystemVersionsRepository,
  CatalogConceptsRepository,
  ConceptDesignationsRepository,
  ConceptRelationshipsRepository,
  ValueSetsRepository,
} from './repositories';

/**
 * Módulo de terminología: administración de catálogos (sistemas de códigos,
 * versiones, conceptos, designaciones, relaciones y conjuntos de valores).
 *
 * Registra las entidades vía `forFeature` para que MikroORM las conozca, y expone
 * los repositorios (sin estado, reciben el EntityManager activo) y servicios
 * (dueños de la transacción) que sirven a los controladores.
 */
@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [
    TerminologyCodeSystemsController,
    TerminologyVersionsController,
    TerminologyConceptsController,
    TerminologyValueSetsController,
  ],
  providers: [
    CodeSystemsService,
    CodeSystemVersionsService,
    ConceptsService,
    ValueSetsService,
    TerminologySourcesRepository,
    CodeSystemsRepository,
    CodeSystemVersionsRepository,
    CatalogConceptsRepository,
    ConceptDesignationsRepository,
    ConceptRelationshipsRepository,
    ValueSetsRepository,
  ],
})
export class TerminologyModule {}
