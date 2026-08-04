import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import {
  TerminologyCodeSystemsController,
  TerminologyVersionsController,
  TerminologyConceptsController,
  TerminologyValueSetsController,
  TerminologyFhirController,
  TerminologyTenantCatalogController,
} from './controllers';
import {
  CodeSystemsService,
  CodeSystemVersionsService,
  ConceptsService,
  ValueSetsService,
  ConceptMapsService,
  TenantCatalogService,
} from './services';
import {
  TerminologySourcesRepository,
  CodeSystemsRepository,
  CodeSystemVersionsRepository,
  CatalogConceptsRepository,
  ConceptDesignationsRepository,
  ConceptRelationshipsRepository,
  ValueSetsRepository,
  ConceptMapsRepository,
  TenantCatalogRepository,
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
    TerminologyFhirController,
    TerminologyTenantCatalogController,
  ],
  providers: [
    CodeSystemsService,
    CodeSystemVersionsService,
    ConceptsService,
    ValueSetsService,
    ConceptMapsService,
    TenantCatalogService,
    TerminologySourcesRepository,
    CodeSystemsRepository,
    CodeSystemVersionsRepository,
    CatalogConceptsRepository,
    ConceptDesignationsRepository,
    ConceptRelationshipsRepository,
    ValueSetsRepository,
    ConceptMapsRepository,
    TenantCatalogRepository,
  ],
  // `CatalogConceptsRepository` lo necesita directory para comprobar que los
  // `*ConceptId` de un alta existen antes de escribirlos: son FK contra
  // `catalog_concepts` y descubrirlas en el INSERT devuelve un 500 opaco.
  exports: [CatalogConceptsRepository],
})
export class TerminologyModule {}
